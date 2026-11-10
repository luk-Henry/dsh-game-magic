/*
 * 冒险魔法商店 · 宿主半（Node 侧）。
 *
 * v0.10.2 起它不再是个空壳：负责把存档落到这台机器的磁盘上。
 * 起因：localStorage 按 origin（协议+域名+端口）隔离，而 DSH 桌面版的 Web 端口每次重启都会变
 * （历史值 11996 → 7424 → 6099 → 8800 → 12763），端口一变存档就"消失"。
 * 路由跟进程走、不跟 origin 走，所以写盘之后换端口也能恢复。
 *
 * v0.11 存档加固：写新档前先把上一份整体改名成 save.bak.json（rename 是原子的，不会留半份 JSON）；
 * 正档缺失或 JSON 损坏时自动回退 .bak。所有失败仍然静默降级，不弹窗、不抛到宿主。
 *
 * v0.12.2 并发保护：同时开两个 DSH 窗口时，后写的会直接盖掉前一个（玩家莫名回档）。
 * 现在客户端每次存档带 savedAt + saveSeq（单调递增），宿主写盘前先比一比：
 * 请求里的 savedAt 更旧**且** saveSeq 更小 → 认定是慢半拍的那个窗口，拒写并回 stale。
 * 写盘本身也串行化（同一个 promise 链），免得两个请求的 tmp 文件互相踩。
 *
 * 只在本机用：文件落在 $DSH_HOME/data/dsh-game-magic/save.json（通常 ~/.dsh/...）。
 * 客户端仍然是"localStorage 优先 + 磁盘兜底"，磁盘不可用时自动降级，不报错。
 */
import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';

export const name = 'dsh-game-magic';

/* 只用 DSH 的 connection 服务注册一条同源路由；没有它插件照样以"仅浏览器存档"模式工作 */
export const inject = ['connection'];

const MAX_BYTES = 4 * 1024 * 1024;
const HOME = process.env.DSH_HOME || join(homedir(), '.dsh');
const DIR = join(HOME, 'data', 'dsh-game-magic');
const FILE = join(DIR, 'save.json');
/* v0.11：上一份存档。写新档前 save.json 会被整体改名成它，读档失败时拿它兜底。 */
const BAK = join(DIR, 'save.bak.json');
/* 0.1.0 改名前的旧目录：只读回退，读到就当作有效档，下次存档自然落到新目录。 */
const LEGACY_DIR = join(HOME, 'data', 'dsh-magic-shop');
const LEGACY_FILE = join(LEGACY_DIR, 'save.json');
const LEGACY_BAK = join(LEGACY_DIR, 'save.bak.json');

function json(body, status) {
  return new Response(JSON.stringify(body), {
    status: status || 200,
    headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' },
  });
}

/* 读一个文件；读不到（没存过 / 没权限）一律当"没有"，调用方自己决定怎么降级 */
async function readText(path) {
  try {
    return await readFile(path, 'utf8');
  } catch (e) {
    return null;
  }
}

function parseOk(text) {
  if (text == null) return false;
  try {
    JSON.parse(text);
    return true;
  } catch (e) {
    return false;
  }
}

async function readSave() {
  /* 正档 → 备份档。正档存在但坏掉（上次写到一半 / 被手改坏）时也必须退到 .bak，不能把坏档推给客户端。 */
  const text = await readText(FILE);
  if (parseOk(text)) return { ok: true, save: text, path: FILE };
  const bak = await readText(BAK);
  if (parseOk(bak)) return { ok: true, save: bak, path: BAK, recovered: true };
  /* 改名前的旧目录（v0.15 及更早装过的玩家）：照样读回来，避免升级即丢档 */
  const legacy = await readText(LEGACY_FILE);
  if (parseOk(legacy)) return { ok: true, save: legacy, path: LEGACY_FILE, migrated: true };
  const legacyBak = await readText(LEGACY_BAK);
  if (parseOk(legacyBak)) return { ok: true, save: legacyBak, path: LEGACY_BAK, recovered: true, migrated: true };
  /* 两份都没有（或都坏了）：对客户端来说等于没档，它会把本地档推上来重建 */
  return { ok: false, missing: true, path: FILE };
}

async function writeSave(text) {
  await mkdir(dirname(FILE), { recursive: true });
  const tmp = FILE + '.tmp';
  await writeFile(tmp, text, 'utf8');
  /* 先把上一份挪成备份，再让新档顶上去。rename 是原子操作：
     任何一步失败都不会留下"半个 JSON"，最坏情况也只是回到上一次的档。
     第一次存档没有旧档，ENOENT 忽略即可。 */
  try {
    await rename(FILE, BAK);
  } catch (e) {}
  await rename(tmp, FILE);
}

/* ---------- v0.12.2：并发保护 ---------- */

/* 同一进程里两个窗口可能几乎同时 POST。串成一条链，一次只跑一个：
   否则两个请求会抢同一个 save.json.tmp，还会在读旧档/写新档之间互相踩。 */
let writeChain = Promise.resolve();
function serialized(fn) {
  const run = writeChain.then(fn, fn);
  writeChain = run.then(() => {}, () => {});
  return run;
}

/* 从存档文本里取出版本戳；坏档/老档返回 null（无法比较 → 不拦，保持旧行为）。 */
function saveMeta(text) {
  try {
    const v = JSON.parse(text);
    if (!v || typeof v !== 'object') return null;
    return { savedAt: Number(v.savedAt) || 0, saveSeq: Number(v.saveSeq) || 0 };
  } catch (e) {
    return null;
  }
}

/* 请求比磁盘更旧吗？两个条件都满足才算"慢半拍"：
   时间戳更早 + 序号更小。任一字段缺失（老客户端/老档）都放行，免得把正常存档拦掉。 */
function isStale(incoming, disk) {
  if (!incoming || !disk) return false;
  if (!incoming.savedAt || !incoming.saveSeq) return false;
  if (!disk.savedAt || !disk.saveSeq) return false;
  return incoming.savedAt < disk.savedAt && incoming.saveSeq < disk.saveSeq;
}


export function apply(ctx) {
  /* 万一换了 DSH 版本、connection 服务的形态变了：宁可不落盘，也不能把插件整体搞挂 */
  if (!ctx.connection || !ctx.connection.fetch || typeof ctx.connection.fetch.register !== 'function') {
    try { ctx.logger && ctx.logger.warn && ctx.logger.warn('[dsh-game-magic] 没有 connection.fetch 路由，存档只写 localStorage'); } catch (e) {}
    return;
  }
  ctx.effect(
    () =>
      ctx.connection.fetch.register({
        path: '/api/magic-shop/save',
        methods: ['GET', 'HEAD', 'POST'],
        requestBody: 'buffered',
        fetch: async (request) => {
          try {
            if (request.method === 'GET' || request.method === 'HEAD') {
              const r = await readSave();
              return json(r);
            }
            const text = await request.text();
            if (!text || text.length > MAX_BYTES) return json({ ok: false, error: 'empty-or-too-large' }, 413);
            JSON.parse(text);          /* 只接受合法 JSON，别把坏档写进磁盘 */
            /* v0.12.2：整段（读旧档 → 比版本 → 写盘）串行，避免两个窗口同时写 */
            return await serialized(async () => {
              const disk = await readSave();
              const diskMeta = disk && disk.ok ? saveMeta(disk.save) : null;
              const mine = saveMeta(text);
              if (isStale(mine, diskMeta)) {
                /* 慢半拍的那个窗口：拒写，把磁盘上的版本告诉它（客户端静默忽略即可） */
                return json({
                  ok: false,
                  stale: true,
                  disk: { savedAt: diskMeta.savedAt, saveSeq: diskMeta.saveSeq },
                });
              }
              await writeSave(text);
              return json({ ok: true, bytes: text.length, path: FILE, savedAt: mine ? mine.savedAt : 0 });
            });
          } catch (e) {
            return json({ ok: false, error: String((e && e.message) || e) }, 500);
          }
        },
      }),
    'magic-shop: /api/magic-shop/save',
  );
}
