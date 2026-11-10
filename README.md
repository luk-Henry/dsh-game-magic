/*
 * 把 src/scene.js + src/widget.js 打包成 dsh 客户端半产物 lib/client.js。
 * dsh 的客户端插件是「手写已构建产物」：文件必须自己调
 * window.__ModuleLoader__.load({ id, factory })，factory 里定义 apply/inject。
 *
 * 用法：node build.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const read = (p) => readFileSync(join(here, p), 'utf8');
const indent = (src) => src.split('\n').map((l) => (l ? '      ' + l : l)).join('\n');

const scene = read('src/scene.js');
const widget = read('src/widget.js');

/* lore.js 是纯数据/纯函数模块（文案包），可选：还没生成时跳过，不影响打包。 */
let lore = '';
try {
  lore = read('src/lore.js');
} catch (e) {
  lore = '';
}

const out = `/* 自动生成，请勿直接修改：源文件是 src/scene.js 与 src/widget.js（node build.mjs 重新打包）。
 * 冒险魔法商店 · 客户端半。纯 DOM + SVG，不依赖 React，也不占用任何 slot：
 * 载入后自己往 document.body 挂一张右下角卡片（宿主调不调 apply() 都能起来）。 */
window.__ModuleLoader__.load({
  id: "dsh-game-magic",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

    /* ===== src/scene.js ===== */
${indent(scene)}

${lore ? '    /* ===== src/lore.js ===== */\n' + indent(lore) + '\n' : ''}
    /* ===== src/widget.js ===== */
${indent(widget)}

    function apply() {
      try {
        if (window.MagicShopWidget) window.MagicShopWidget.boot();
      } catch (e) {
        console.warn("[magic-shop] apply failed", e);
      }
    }
    const inject = [];
    exports.apply = apply;
    exports.inject = inject;
    exports.default = apply;
    return module.exports;
  }
});

/* 兜底：万一宿主没调 apply()，3 秒后自己补一次（已挂上就什么都不做） */
setTimeout(function () {
  if (!window.__MAGIC_SHOP_MOUNTED__ && window.MagicShopWidget) {
    try { window.MagicShopWidget.boot(); } catch (e) { if (window.console) console.error('[dsh-game-magic] boot failed', e); }
  }
}, 3000);
`;

writeFileSync(join(here, 'lib/client.js'), out, 'utf8');
console.log('lib/client.js', out.length, 'bytes');
