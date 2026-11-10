/* 自动生成，请勿直接修改：源文件是 src/scene.js 与 src/widget.js（node build.mjs 重新打包）。
 * 冒险魔法商店 · 客户端半。纯 DOM + SVG，不依赖 React，也不占用任何 slot：
 * 载入后自己往 document.body 挂一张右下角卡片（宿主调不调 apply() 都能起来）。 */
window.__ModuleLoader__.load({
  id: "dsh-game-magic",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
    Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });

    /* ===== src/scene.js ===== */
      /*
       * 冒险魔法商店 · 场景（纯 SVG，零依赖）
       * viewBox 320×200 —— 店主站在柜台后面，货架在左，窗在右；
       * 有客人时左下角出现一个背影（近景框景），客人走后淡出。
       *
       * 图层顺序：墙与梁 → 墙上挂件 → 货架与货 → 窗 → 灯 → 柜台面 →
       *          店主躯干与头 → 柜台上的东西 → 手臂与手 → 柜台前脸 → 客人背影 → 氛围
       *
       * 对外（v0.8）：
       *   createScene(host) → { render, setState, setStock, setUnlocked, setGold, setClock,
       *                         setCustomer, event, setDecor, setTier,
       *                         state / tier / decor / unlocked, nodes, ITEMS, POSES }
       *   MagicShopScene.ITEMS[i].unlock  该货的解锁价（单位：铜；0 = 白送）
       *   MagicShopScene.COINS            [铜, 银, 金] 面值表（1 银 = 100 铜，1 金 = 100 银）
       *   MagicShopScene.coinIcon('s',14) 一枚货币图标，独立 <svg>，塞进卡片 HTML
       *   MagicShopScene.coinUse('s',x,y,12)  <use>，嵌进场景 SVG（符号在 defs 里）
       *   setCustomer(on, kind)  kind 收 villager / knight / merc / thief / rogue / mage /
       *                          noble / outsider（v0.8 六类客 + 旧骑士 + 盗贼别名）
       *   setDecor({...})  v0.8 新增 board / counter / stool / bell / vault / icebox 六个开关，
       *                    与原有 shelf4 / cat / candle / glass / chand / sign / portal 并列；
       *                    函数签名不变，缺省字段 = 没有这件装饰
       */
      (function () {
        'use strict';

        /* ---------------- 货品 ----------------
           每个货品带：
             `lv`     = 需要到第几级场所才卖（0 地摊起就能卖）
             `unlock` = v0.6 解锁价（单位：铜）。1 银 = 100 铜，1 金 = 100 银
                        —— 统一 = 售价 × 60，尾段 67×／64× 落在整金整银上（见 docs/economy-v0.6.md B 表）
             `free`   = 地摊期白送（解锁价 0，开局就进账本，不进「未上架」区） */
        var ITEMS = [
          { k: 'potion', name: '治疗药水', price: 12, lv: 0, unlock: 20 },
          { k: 'mana', name: '魔力药水', price: 18, lv: 0, unlock: 0, free: true },
          { k: 'scroll', name: '火球卷轴', price: 25, lv: 0, unlock: 0, free: true },
          { k: 'dagger', name: '银匕首', price: 30, lv: 1, unlock: 200 },
          { k: 'wand', name: '橡木法杖', price: 45, lv: 1, unlock: 450 },
          { k: 'helm', name: '铁面盔', price: 40, lv: 2, unlock: 900 },
          { k: 'shield', name: '旧圆盾', price: 55, lv: 2, unlock: 3500 },
          { k: 'orb', name: '占卜水晶', price: 60, lv: 3, unlock: 6000 },
          { k: 'tome', name: '残页魔典', price: 80, lv: 3, unlock: 14000 },
          /* 第 4 级（商会）才上架 */
          { k: 'rune', name: '符文石', price: 120, lv: 4, unlock: 28000 },
          { k: 'star', name: '星砂瓶', price: 150, lv: 4, unlock: 45000 },
          { k: 'scale', name: '龙鳞', price: 160, lv: 4, unlock: 84000 },
          /* ---------------- v0.16 §6.2 禁忌 12 件 ----------------
             传承之后才解锁的长线货：tier:'forbidden' 是唯一的新标记，lv 4（商会货架）。
             刻意**不给**它们画 SVG —— setStock 遇到没有 <g id="g-xxx"> 的货会自己跳过，
             所以这 12 件不占货架格子、不动画风、不改配色，只出现在店铺页的「禁忌货品」段里。
             售价 300–900 铜、解锁价 3 万–20 万铜，是挂到第 7 天之后的主要花钱去处。 */
          { k: 'ash', name: '灰烬面具', price: 300, lv: 4, unlock: 30000, tier: 'forbidden' },
          { k: 'thorn', name: '荆棘冠', price: 340, lv: 4, unlock: 38000, tier: 'forbidden' },
          { k: 'null', name: '无字契约', price: 380, lv: 4, unlock: 46000, tier: 'forbidden' },
          { k: 'echo', name: '回声骨笛', price: 420, lv: 4, unlock: 55000, tier: 'forbidden' },
          { k: 'veil', name: '薄暮面纱', price: 470, lv: 4, unlock: 65000, tier: 'forbidden' },
          { k: 'moth', name: '食梦蛾', price: 520, lv: 4, unlock: 76000, tier: 'forbidden' },
          { k: 'ink', name: '黑露墨', price: 570, lv: 4, unlock: 88000, tier: 'forbidden' },
          { k: 'bone', name: '渡鸦骨', price: 620, lv: 4, unlock: 102000, tier: 'forbidden' },
          { k: 'mirror', name: '倒影镜', price: 680, lv: 4, unlock: 118000, tier: 'forbidden' },
          { k: 'hymn', name: '缄默圣歌', price: 740, lv: 4, unlock: 136000, tier: 'forbidden' },
          { k: 'void', name: '空壳之心', price: 810, lv: 4, unlock: 160000, tier: 'forbidden' },
          { k: 'crown', name: '无名之冠', price: 900, lv: 4, unlock: 200000, tier: 'forbidden' }
        ];
        var ITEM_BY_KEY = {};
        ITEMS.forEach(function (it) { ITEM_BY_KEY[it.k] = it; });
        function isForbidden(it) { return !!it && it.tier === 'forbidden'; }

        /* ---------------- 货币图标（铜 / 银 / 金）----------------
           v0.6：钱只存一个整数（单位铜），三档纯显示层。
           图标 16×16、细描边、一圈很淡的高光，色值沿用柜台上那堆铜板（#d8b25a/#8a6a28）的调子，
           12px 以下也认得出来；不用 emoji，卡片里和场景里是同一份形状。
             卡片 HTML：coinIcon('s', 14) → 独立 <svg>
             场景 SVG ：<use href="#coinS">（defs 里的 <symbol>，coinUse() 生成） */
        var COINS = [
          { k: 'c', id: 'coinC', name: '铜', value: 1, alias: ['copper', '铜', '铜币', '铜板'],
            fill: '#c98a55', rim: '#7f4d28', ink: '#8a5528', mark: 'dot' },
          { k: 's', id: 'coinS', name: '银', value: 100, alias: ['silver', '银', '银币'],
            fill: '#cbd6e2', rim: '#7b8998', ink: '#5f6b78', mark: 'diamond' },
          { k: 'g', id: 'coinG', name: '金', value: 10000, alias: ['gold', '金', '金币'],
            fill: '#e8c574', rim: '#a37b28', ink: '#8a6a28', mark: 'star' }
        ];
        var COIN_BY_K = {};
        COINS.forEach(function (c) { COIN_BY_K[c.k] = c; });

        /* 's' / 'S' / 'silver' / '银' 都收 */
        function coinUnit(u) {
          if (u == null) return 'c';
          var s = String(u).toLowerCase();
          if (COIN_BY_K[s]) return s;
          for (var i = 0; i < COINS.length; i++) {
            if (COINS[i].alias.indexOf(s) >= 0) return COINS[i].k;
          }
          return 'c';
        }

        /* 币面：俯视圆币 + 内圈 + 中心徽记 + 左上高光（三档靠颜色和徽记区分） */
        function coinFace(u) {
          var c = COIN_BY_K[coinUnit(u)];
          var mark;
          if (c.mark === 'dot') {
            mark = '<circle cx="8" cy="8" r="1.5" fill="' + c.ink + '" opacity=".5"/>';
          } else if (c.mark === 'diamond') {
            mark = '<path d="M8 5.3 L10.5 8 L8 10.7 L5.5 8 Z" fill="' + c.ink + '" opacity=".45"/>';
          } else {
            mark = '<path d="M8 4.4 L9.2 6.8 L11.6 8 L9.2 9.2 L8 11.6 L6.8 9.2 L4.4 8 L6.8 6.8 Z" fill="' +
              c.ink + '" opacity=".45"/>';
          }
          return '<circle cx="8" cy="8" r="6.5" fill="' + c.fill + '" stroke="' + c.rim + '" stroke-width="1.1"/>' +
            '<circle cx="8" cy="8" r="4.3" fill="none" stroke="' + c.rim + '" stroke-width=".7" opacity=".4"/>' +
            mark +
            '<path d="M4.9 5.7 Q7.6 3.7 10.7 5.5" fill="none" stroke="#fff" stroke-width=".9" stroke-linecap="round" opacity=".4"/>';
        }

        /* 卡片 HTML 用：一段自带 viewBox 的 <svg>。size 默认 14，建议 14–18 */
        function coinIcon(u, size, cls) {
          var k = coinUnit(u), s = size || 14;
          return '<svg class="idk-coin idk-coin-' + k + (cls ? ' ' + cls : '') + '" viewBox="0 0 16 16" width="' + s +
            '" height="' + s + '" aria-hidden="true" focusable="false" style="vertical-align:-2px;flex:0 0 auto">' +
            coinFace(k) + '</svg>';
        }

        /* 场景 SVG 用：defs 里的 <symbol>（放一次，后面都用 <use> 引） */
        var COIN_DEFS = COINS.map(function (c) {
          return '<symbol id="' + c.id + '" viewBox="0 0 16 16">' + coinFace(c.k) + '</symbol>';
        }).join('');

        /* 场景 SVG 用：把一枚币放到 (x,y)，size 是「用户坐标」宽高 */
        function coinUse(u, x, y, size) {
          var c = COIN_BY_K[coinUnit(u)], s = size || 12;
          return '<use href="#' + c.id + '" x="' + x + '" y="' + y + '" width="' + s + '" height="' + s + '"/>';
        }

        /* v0.14 四季窗外景用的小工具：把 n 片花瓣/叶子按黄金角散成一簇。
           位置在构建期就算死（确定性，两次刷新截图一致），运行期一个字节都不用重算。 */
        function petals(cx, cy, r, n, fill, op) {
          var s = '<g fill="' + fill + '"' + (op ? ' opacity="' + op + '"' : '') + '>', i, a, rr;
          for (i = 0; i < n; i++) {
            a = i * 2.3999632;
            rr = r * Math.sqrt((i + 0.62) / n);
            s += '<circle cx="' + (cx + Math.cos(a) * rr).toFixed(1) + '" cy="' +
              (cy + Math.sin(a) * rr * 0.72).toFixed(1) + '" r="' + (1.4 + (i % 3) * 0.5).toFixed(2) + '"/>';
          }
          return s + '</g>';
        }

        /* ---------------- 场景标记 ---------------- */
        var MARKUP = [
          '<defs>',
          '<linearGradient id="wallG" x1="0" y1="0" x2="0" y2="1">',
          '<stop id="wallA" offset="0" stop-color="#2b2118"/><stop id="wallB" offset="1" stop-color="#3c2c1e"/></linearGradient>',
          '<linearGradient id="counterG" x1="0" y1="0" x2="0" y2="1">',
          '<stop offset="0" stop-color="#7a4f2b"/><stop offset="1" stop-color="#4f311a"/></linearGradient>',
          '<linearGradient id="frontG" x1="0" y1="0" x2="0" y2="1">',
          '<stop offset="0" stop-color="#5a3a20"/><stop offset="1" stop-color="#33200f"/></linearGradient>',
          '<linearGradient id="skyG" x1="0" y1="0" x2="0" y2="1">',
          '<stop id="skyA" offset="0" stop-color="#1a2440"/><stop id="skyB" offset="1" stop-color="#2e3a58"/></linearGradient>',
          '<radialGradient id="lampG" cx=".5" cy=".5" r=".5">',
          '<stop offset="0" stop-color="#ffd79a" stop-opacity=".7"/><stop offset="1" stop-color="#ffd79a" stop-opacity="0"/></radialGradient>',
          '<radialGradient id="vigG" cx=".5" cy=".44" r=".8">',
          '<stop offset=".5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></radialGradient>',
          /* v0.11：日光渐变的三段给 id，applyLight 按时次写色温（清晨冷蓝／正午暖白／黄昏橙红） */
          '<linearGradient id="sunG" x1="1" y1="0" x2="0" y2="1">',
          '<stop id="sunStopA" offset="0" stop-color="#fff6d0" stop-opacity=".5"/>',
          '<stop id="sunStopB" offset=".55" stop-color="#ffeab0" stop-opacity=".22"/>',
          '<stop id="sunStopC" offset="1" stop-color="#ffe2a0" stop-opacity="0"/></linearGradient>',
          '<radialGradient id="sunPatchG" cx=".5" cy=".5" r=".5">',
          '<stop id="sunPatchStopA" offset="0" stop-color="#fff3c8" stop-opacity=".55"/>',
          '<stop id="sunPatchStopB" offset="1" stop-color="#fff3c8" stop-opacity="0"/></radialGradient>',
          '<linearGradient id="coneG" x1="0" y1="0" x2="0" y2="1">',
          '<stop offset="0" stop-color="#ffd79a" stop-opacity=".26"/>',
          '<stop offset="1" stop-color="#ffd79a" stop-opacity="0"/></linearGradient>',
          '<radialGradient id="shadowG" cx=".5" cy=".5" r=".5">',
          '<stop offset="0" stop-color="#140b05" stop-opacity=".5"/>',
          '<stop offset="1" stop-color="#140b05" stop-opacity="0"/></radialGradient>',
          /* v0.8：异界客的半透明蓝光（背影外圈 + 法师浮球都用这一份） */
          '<radialGradient id="custGlowG" cx=".5" cy=".5" r=".5">',
          '<stop offset="0" stop-color="#7fe3ff" stop-opacity=".5"/>',
          '<stop offset=".55" stop-color="#5cc8ee" stop-opacity=".18"/>',
          '<stop offset="1" stop-color="#4aa8d8" stop-opacity="0"/></radialGradient>',
          /* v0.9：客人背影的分离光 + 左上柔光糊边（都只画一次，不逐帧改） */
          '<radialGradient id="custHaloG" cx=".42" cy=".4" r=".62">',
          '<stop offset="0" stop-color="#fff3e0" stop-opacity=".4"/>',
          '<stop offset=".62" stop-color="#e7dcff" stop-opacity=".18"/>',
          '<stop offset="1" stop-color="#cfc4ff" stop-opacity="0"/></radialGradient>',
          '<filter id="custSoftF" x="-40%" y="-40%" width="180%" height="180%">',
          '<feGaussianBlur stdDeviation="2.1"/></filter>',
          '<pattern id="stoneP" width="32" height="20" patternUnits="userSpaceOnUse">',
          '<g stroke="#000" stroke-opacity=".2" stroke-width="1" fill="none">',
          '<path d="M0 .5 H32"/><path d="M0 10.5 H32"/>',
          '<path d="M.5 0 V10"/><path d="M16.5 10 V20"/><path d="M31.5 0 V10"/></g></pattern>',
          '<pattern id="woodP" width="46" height="9" patternUnits="userSpaceOnUse">',
          '<g stroke="#2a1608" stroke-opacity=".16" stroke-width=".9" fill="none">',
          '<path d="M0 3 q12 -1.6 23 0 t23 0"/><path d="M0 6.6 q11 1.4 22 0 t24 0"/></g></pattern>',
          /* ---- v0.11 五档地面材质 ----
             dirtP 泥地（碎石＋车辙）/ floorBoardP 木地板 / floorBrickP 石砖 /
             floorMosaicP 拼花石（菱形）/ floorMarbleP 大理石纹；
             floorShadeG 是「靠墙那侧的暗部」，给地面做出纵深。
             注意：这些都是 <defs> 里的 id，和组名（floorDirtG 等）分开，别跟 wallG / woodP / stoneP 撞 */
          '<pattern id="dirtP" width="26" height="10" patternUnits="userSpaceOnUse">',
          '<g fill="#5c4b33" opacity=".5"><circle cx="3" cy="3" r=".8"/><circle cx="11" cy="7.4" r=".6"/>',
          '<circle cx="19" cy="2.4" r=".7"/><circle cx="23.4" cy="8" r=".5"/></g>',
          '<path d="M0 5.2 q6.4 -1.4 13 0 t13 0" stroke="#2e2519" stroke-width=".7" fill="none" opacity=".55"/></pattern>',
          '<pattern id="floorBoardP" width="40" height="7" patternUnits="userSpaceOnUse">',
          '<g stroke="#2a1608" stroke-opacity=".4" stroke-width=".8" fill="none">',
          '<path d="M0 .4 H40"/><path d="M0 3.6 H40"/></g>',
          '<path d="M20 0 V.4 M0 3.6 V7" stroke="#20120a" stroke-width=".9" opacity=".4"/></pattern>',
          '<pattern id="floorBrickP" width="28" height="10" patternUnits="userSpaceOnUse">',
          '<g stroke="#282420" stroke-opacity=".55" stroke-width=".9" fill="none">',
          '<path d="M0 .4 H28"/><path d="M0 5 H28"/><path d="M14 0 V5"/><path d="M0 5 V10"/><path d="M28 5 V10"/></g></pattern>',
          '<pattern id="floorMosaicP" width="16" height="16" patternUnits="userSpaceOnUse">',
          '<g stroke="#302b3a" stroke-opacity=".5" stroke-width=".8" fill="none">',
          '<path d="M8 0 L16 8 L8 16 L0 8 Z"/></g>',
          '<circle cx="8" cy="8" r=".9" fill="#9a8fb2" opacity=".45"/></pattern>',
          '<pattern id="floorMarbleP" width="52" height="18" patternUnits="userSpaceOnUse">',
          '<g stroke="#a8aebb" stroke-opacity=".26" stroke-width=".7" fill="none">',
          '<path d="M0 12.4 q10 -6 20 -2 t16 4 t16 -6"/>',
          '<path d="M4 3 q12 4 22 1 t22 3"/></g></pattern>',
          '<linearGradient id="floorShadeG" x1="0" y1="0" x2="0" y2="1">',
          '<stop offset="0" stop-color="#0d0906" stop-opacity=".6"/>',
          '<stop offset=".55" stop-color="#0d0906" stop-opacity=".14"/>',
          '<stop offset="1" stop-color="#0d0906" stop-opacity="0"/></linearGradient>',
          /* v0.11：天花板/屋顶的压暗（画面上沿往下一压，顶部不再是一条平的墙） */
          '<linearGradient id="ceilGrad" x1="0" y1="0" x2="0" y2="1">',
          '<stop offset="0" stop-color="#0a0705" stop-opacity=".62"/>',
          '<stop offset=".55" stop-color="#0a0705" stop-opacity=".22"/>',
          '<stop offset="1" stop-color="#0a0705" stop-opacity="0"/></linearGradient>',
          /* 檐口齿饰（x=0/320 全宽重复）：3 档木檐、4 档包金 */
          '<pattern id="dentilP" width="12" height="9" patternUnits="userSpaceOnUse">',
          '<rect x="5" y="3.4" width="4" height="4.2" fill="#241608" opacity=".7"/></pattern>',
          '<pattern id="dentilGoldP" width="16" height="9" patternUnits="userSpaceOnUse">',
          '<rect x="6" y="2.8" width="3.6" height="4.6" fill="#c9a24a" opacity=".8"/></pattern>',
          /* ---- v0.11c 天气 / 节日 / 升级过场用的渐变 ----
             festGlowG 灯笼暖光 / instBloomG 过场光晕 / instSweepG 过场扫光。
             命名一律带 fest/inst 前缀，别和已有的 lampG / vigG / sunG 撞。 */
          '<radialGradient id="festGlowG" cx=".5" cy=".5" r=".5">',
          '<stop offset="0" stop-color="#ffcf8a" stop-opacity=".55"/>',
          '<stop offset=".6" stop-color="#ff9f4a" stop-opacity=".18"/>',
          '<stop offset="1" stop-color="#ff8a3a" stop-opacity="0"/></radialGradient>',
          '<radialGradient id="instBloomG" cx=".5" cy=".5" r=".5">',
          '<stop offset="0" stop-color="#fff3d2" stop-opacity=".62"/>',
          '<stop offset=".55" stop-color="#ffe0a8" stop-opacity=".2"/>',
          '<stop offset="1" stop-color="#ffd79a" stop-opacity="0"/></radialGradient>',
          '<linearGradient id="instSweepG" x1="0" y1="0" x2="1" y2="0">',
          '<stop offset="0" stop-color="#fff8e8" stop-opacity="0"/>',
          '<stop offset=".5" stop-color="#fff8e8" stop-opacity=".34"/>',
          '<stop offset="1" stop-color="#fff8e8" stop-opacity="0"/></linearGradient>',
          /* 雪天地面那层淡白：上淡下浓，贴着地坪线化开 */
          '<linearGradient id="snowFloorG" x1="0" y1="0" x2="0" y2="1">',
          '<stop offset="0" stop-color="#eaf3ff" stop-opacity="0"/>',
          '<stop offset=".4" stop-color="#eaf3ff" stop-opacity=".28"/>',
          '<stop offset="1" stop-color="#f6faff" stop-opacity=".44"/></linearGradient>',
          /* ---- v0.13 夜间照明 / 窗外街景用的渐变 ----
             命名一律 night* / n* 前缀：现有 id 里没有 n[A-Z] 开头的，
             特意避开 shadowG / lampG / coneG / skyG 这些老名字（shadowG 本身已经是 id 重名）。 */
          '<radialGradient id="nWarmG" cx=".5" cy=".5" r=".5">',
          '<stop offset="0" stop-color="#ffd79a" stop-opacity=".8"/>',
          '<stop offset=".45" stop-color="#ffb968" stop-opacity=".3"/>',
          '<stop offset="1" stop-color="#ff9a3c" stop-opacity="0"/></radialGradient>',
          '<radialGradient id="nPoolG" cx=".5" cy=".5" r=".5">',
          '<stop offset="0" stop-color="#ffc274" stop-opacity=".42"/>',
          '<stop offset=".55" stop-color="#ff9a44" stop-opacity=".15"/>',
          '<stop offset="1" stop-color="#ff8a38" stop-opacity="0"/></radialGradient>',
          '<linearGradient id="nWinG" x1="0" y1="0" x2="0" y2="1">',
          '<stop offset="0" stop-color="#2f5a92" stop-opacity=".55"/>',
          '<stop offset=".55" stop-color="#1b3054" stop-opacity=".4"/>',
          '<stop offset="1" stop-color="#0f1a2c" stop-opacity=".28"/></linearGradient>',
          '<radialGradient id="nStreetG" cx=".5" cy=".45" r=".55">',
          '<stop offset="0" stop-color="#ffe9bb" stop-opacity=".75"/>',
          '<stop offset=".42" stop-color="#ffc46a" stop-opacity=".3"/>',
          '<stop offset="1" stop-color="#ffb050" stop-opacity="0"/></radialGradient>',
          '<linearGradient id="nStreetConeG" x1="0" y1="0" x2="0" y2="1">',
          '<stop offset="0" stop-color="#ffd694" stop-opacity=".4"/>',
          '<stop offset="1" stop-color="#ffd694" stop-opacity="0"/></linearGradient>',
          '<linearGradient id="nGlassG" x1="0" y1="0" x2="1" y2="1">',
          '<stop offset="0" stop-color="#d8ecff" stop-opacity=".18"/>',
          '<stop offset=".5" stop-color="#8fc0f0" stop-opacity=".04"/>',
          '<stop offset="1" stop-color="#e6f3ff" stop-opacity=".14"/></linearGradient>',
          /* v0.13.1 夜间环境光：0/1 档打烊时货架这一侧太黑，加一层很弱的暖光 ——
             中心压在货架下沿（摊子那盏提灯的位置），往右上散开，右侧窗洞/门口不受影响。
             只是把「架子上有东西」从背景里提出来，不把整幅画提到白天。 */
          '<radialGradient id="nAmbG" cx=".34" cy=".8" r=".74">',
          '<stop offset="0" stop-color="#ffd8a4" stop-opacity=".5"/>',
          '<stop offset=".46" stop-color="#ffc07a" stop-opacity=".24"/>',
          '<stop offset="1" stop-color="#ffae6a" stop-opacity="0"/></radialGradient>',
          /* v0.13.1 夜间「台面补光」：一条横着的高光带，压过摊子/柜台那一层。
             0/1 档没有吊灯，货架下沿和台面上的瓶子、账本全靠它跟背景分开；
             上下两端都是 0，所以只提柜台这一条，不会把整幅画抹平。 */
          '<linearGradient id="nGoodsG" gradientUnits="userSpaceOnUse" x1="0" y1="110" x2="0" y2="156">',
          '<stop offset="0" stop-color="#ffcf94" stop-opacity="0"/>',
          '<stop offset=".42" stop-color="#ffdcae" stop-opacity=".26"/>',
          '<stop offset=".76" stop-color="#ffc07a" stop-opacity=".15"/>',
          '<stop offset="1" stop-color="#ffae6a" stop-opacity="0"/></linearGradient>',
          /* ---- v0.14 落地大窗：窗洞形状 + 四季天光 + 白天玻璃高光 + 冬天雪面 ----
             窗洞（玻璃内沿）固定一条路径，天空/天光/夜景都用 <use> 引它，改尺寸只改这一处。 */
          '<path id="winShape" d="M178 118 V46 Q178 26 198 26 H286 Q306 26 306 46 V118 Z"/>',
          '<clipPath id="winClipG"><use href="#winShape"/></clipPath>',
          /* 0 春：樱粉 */
          '<linearGradient id="sSky0" x1="0" y1="0" x2="0" y2="1">',
          '<stop offset="0" stop-color="#ffc2d6" stop-opacity=".44"/>',
          '<stop offset=".62" stop-color="#ffd8e6" stop-opacity=".3"/>',
          '<stop offset="1" stop-color="#ffe8f0" stop-opacity=".16"/></linearGradient>',
          /* 1 夏：亮蓝 */
          '<linearGradient id="sSky1" x1="0" y1="0" x2="0" y2="1">',
          '<stop offset="0" stop-color="#6cc8f4" stop-opacity=".42"/>',
          '<stop offset=".6" stop-color="#a6e2ff" stop-opacity=".28"/>',
          '<stop offset="1" stop-color="#dcf4ff" stop-opacity=".14"/></linearGradient>',
          /* 2 秋：暖橙 */
          '<linearGradient id="sSky2" x1="0" y1="0" x2="0" y2="1">',
          '<stop offset="0" stop-color="#ff9440" stop-opacity=".42"/>',
          '<stop offset=".6" stop-color="#ffbe7c" stop-opacity=".28"/>',
          '<stop offset="1" stop-color="#ffd9a8" stop-opacity=".16"/></linearGradient>',
          /* 3 冬：冷蓝 */
          '<linearGradient id="sSky3" x1="0" y1="0" x2="0" y2="1">',
          '<stop offset="0" stop-color="#9cc0e6" stop-opacity=".4"/>',
          '<stop offset=".6" stop-color="#c6ddf5" stop-opacity=".26"/>',
          '<stop offset="1" stop-color="#eaf4ff" stop-opacity=".16"/></linearGradient>',
          '<linearGradient id="dayGlassG" x1="0" y1="0" x2="1" y2="1">',
          '<stop offset="0" stop-color="#f4fbff" stop-opacity=".34"/>',
          '<stop offset=".55" stop-color="#f4fbff" stop-opacity=".05"/>',
          '<stop offset="1" stop-color="#f4fbff" stop-opacity="0"/></linearGradient>',
          '<linearGradient id="sSnowG" x1="0" y1="0" x2="0" y2="1">',
          '<stop offset="0" stop-color="#ffffff" stop-opacity=".95"/>',
          '<stop offset="1" stop-color="#cfe2f6" stop-opacity=".92"/></linearGradient>',
          /* v0.15 月亮光晕：两轮月亮共用一枚冷白 radial，只做「淡光晕」，不引入高饱和色 */
          '<radialGradient id="moonHaloG" cx=".5" cy=".5" r=".5">',
          '<stop offset="0" stop-color="#e6efff" stop-opacity=".42"/>',
          '<stop offset=".48" stop-color="#cddff8" stop-opacity=".14"/>',
          '<stop offset="1" stop-color="#b9d0ee" stop-opacity="0"/></radialGradient>',
          /* 三档货币的 <symbol>（v0.6）：场景里 `<use href="#coinS" .../>` 就是一枚银币 */
          COIN_DEFS,
          '</defs>',

          /* ---- 后墙 ---- */
          '<rect width="320" height="200" fill="url(#wallG)"/>',
          '<rect y="0" width="320" height="146" fill="url(#stoneP)"/>',
          '<g stroke="#211710" stroke-width="7" opacity=".4">',
          '<path d="M0 17 H320"/><path d="M124 7 V142"/><path d="M306 7 V142"/></g>',
          '<g fill="#1f150e" opacity=".35"><rect x="0" y="138" width="320" height="5"/></g>',

          /* ---- v0.11 顶部收口：每一档都有「屋子上沿」，不再是一条平墙 ----
             0 档地摊没有屋顶 → 只压一层天花板暗影；1/2 档是布棚布面；
             3 档木檐口、4 档包金檐口（商会一眼看出来）。都画在装饰之前，所以挂件/二楼会压在上面。 */
          '<g id="ceilShadeG" display="none"><rect y="0" width="320" height="26" fill="url(#ceilGrad)"/></g>',
          '<g id="corniceG" display="none">',
          '<rect y="0" width="320" height="11" fill="#3a2617"/>',
          '<rect y="0" width="320" height="2.6" fill="#5a3f28"/>',
          '<rect y="2.6" width="320" height="6.4" fill="url(#dentilP)"/>',
          '<path d="M0 9.6 H320" stroke="#c9a24a" stroke-width=".9" opacity=".45"/>',
          '<rect y="9.6" width="320" height="1.6" fill="#1d1109" opacity=".9"/>',
          '</g>',
          '<g id="corniceGoldG" display="none">',
          '<rect y="0" width="320" height="11" fill="#4a3218"/>',
          '<rect y="0" width="320" height="3" fill="#7a5528"/>',
          '<rect y="3" width="320" height="6" fill="url(#dentilGoldP)"/>',
          '<path d="M0 1.4 H320" stroke="#f0d79a" stroke-width="1.2" opacity=".75"/>',
          '<path d="M0 9.2 H320" stroke="#f0d79a" stroke-width="1.4" opacity=".8"/>',
          '<g fill="#e6c980" opacity=".9">',
          '<circle cx="44" cy="6" r="1.5"/><circle cx="160" cy="6" r="1.5"/><circle cx="276" cy="6" r="1.5"/></g>',
          '<rect y="10.6" width="320" height="2.2" fill="#c9a24a" opacity=".55"/>',
          '</g>',

          /* ---- v0.11 地面：五档材质 ----
             地坪线（地面开始的高度）随档位往上抬：132 → 128 → 124 → 120 → 114，
             露出来的地面越深，屋子看起来就越大。五组一次性建好，setTier 只切 display —— 不重建节点、不闪。 */
          '<g id="floorDirtG" display="none">',
          '<rect x="0" y="132" width="320" height="14" fill="#3b3126"/>',
          '<rect x="0" y="132" width="320" height="14" fill="url(#dirtP)"/>',
          '<rect x="0" y="132" width="320" height="14" fill="url(#floorShadeG)"/>',
          '<g fill="#4a3d2c" opacity=".75"><ellipse cx="24" cy="140.4" rx="6" ry="1.6"/>',
          '<ellipse cx="98" cy="143" rx="7" ry="1.8"/><ellipse cx="212" cy="141" rx="5" ry="1.4"/></g>',
          '<g stroke="#6a5a3a" stroke-width=".9" opacity=".65" stroke-linecap="round">',
          '<path d="M42 142 l4 -3"/><path d="M150 141 l-4 -3"/><path d="M268 143 l5 -3"/><path d="M306 139 l3 2"/></g>',
          '</g>',
          '<g id="floorWoodG" display="none">',
          '<rect x="0" y="128" width="320" height="18" fill="#4a3018"/>',
          '<rect x="0" y="128" width="320" height="18" fill="url(#floorBoardP)"/>',
          '<rect x="0" y="128" width="320" height="18" fill="url(#floorShadeG)"/>',
          '<path d="M0 128.4 H320" stroke="#2d1a0c" stroke-width="1.4" opacity=".8"/>',
          '<path d="M0 129.6 H320" stroke="#7a4f2b" stroke-width=".8" opacity=".45"/>',
          '</g>',
          '<g id="floorBrickG" display="none">',
          '<rect x="0" y="124" width="320" height="22" fill="#464038"/>',
          '<rect x="0" y="124" width="320" height="22" fill="url(#floorBrickP)"/>',
          '<rect x="0" y="124" width="320" height="22" fill="url(#floorShadeG)"/>',
          '<path d="M0 124.4 H320" stroke="#1e1a16" stroke-width="1.6" opacity=".8"/>',
          '<path d="M0 125.8 H320" stroke="#6f675a" stroke-width=".8" opacity=".4"/>',
          '</g>',
          '<g id="floorMosaicG" display="none">',
          '<rect x="0" y="120" width="320" height="26" fill="#453e4c"/>',
          '<rect x="0" y="120" width="320" height="26" fill="url(#floorMosaicP)"/>',
          '<rect x="0" y="120" width="320" height="26" fill="url(#floorShadeG)"/>',
          '<g fill="#8a7fa0" opacity=".35"><path d="M40 133 l4 4 l-4 4 l-4 -4 Z"/>',
          '<path d="M152 136 l4 4 l-4 4 l-4 -4 Z"/><path d="M244 132 l4 4 l-4 4 l-4 -4 Z"/></g>',
          '<path d="M0 120.4 H320" stroke="#26212c" stroke-width="1.6" opacity=".85"/>',
          '<path d="M0 121.8 H320" stroke="#7a7088" stroke-width=".8" opacity=".38"/>',
          '</g>',
          '<g id="floorMarbleG" display="none">',
          '<rect x="0" y="114" width="320" height="32" fill="#6a6a76"/>',
          '<rect x="0" y="114" width="320" height="32" fill="url(#floorMarbleP)"/>',
          '<rect x="0" y="114" width="320" height="32" fill="url(#floorShadeG)"/>',
          /* v0.11 第 4 级：抛光面更亮 —— 窗下一片高光 + 两道反光 + 几点星点 */
          '<ellipse cx="262" cy="126" rx="40" ry="7" fill="#dfe7f5" opacity=".12"/>',
          '<ellipse cx="262" cy="125" rx="22" ry="3.4" fill="#f2f6ff" opacity=".14"/>',
          '<rect x="0" y="134" width="320" height="5" fill="#cfd6e2" opacity=".12"/>',
          '<path d="M188 117 l58 9" stroke="#e8eef8" stroke-width="1.2" opacity=".18"/>',
          '<path d="M96 121 l44 7" stroke="#e8eef8" stroke-width="1" opacity=".13"/>',
          '<g fill="#f4f8ff" opacity=".5"><circle cx="236" cy="123" r=".9"/><circle cx="284" cy="130" r=".7"/>',
          '<circle cx="66" cy="127" r=".7"/></g>',
          '<path d="M0 114.4 H320" stroke="#2a2a33" stroke-width="1.6" opacity=".85"/>',
          '<path d="M0 115.8 H320" stroke="#aab0bd" stroke-width=".8" opacity=".4"/>',
          '</g>',
          /* v0.11c 雪天地面淡白：画在地面之后、柜台之前 —— 只铺地，不洗柜台和店主 */
          '<g id="wxSnowFloorG" display="none">',
          '<rect x="0" y="108" width="320" height="92" fill="url(#snowFloorG)"/>',
          '</g>',

          /* ---- 可购买装饰：地面三件（门边盐线 / 迎客草席 / 地窖暗门）----
             画在所有地板之后、柜台与店主之前；都压在 y128–141 的可见地面上，
             不碰柜台前脸（y142+），也不进店主站位（x202–274）。 */
          /* 门边盐线：断续白弧 + 几粒粗盐。右侧真门口被钱袋(276–299)和窗框(314–320)挤住，
             只剩 15 单位宽，放不下能看清的弧线，故画在店内侧地面、草席后沿（x92–136, y118–127）*/
          '<g id="saltG" display="none">',
          '<path d="M92 121.6 Q113 117.8 136 120.9" fill="none" stroke="#efe7d4" stroke-width="1.7" stroke-linecap="round" stroke-dasharray="3.6 3.8" opacity=".85"/>',
          '<g fill="#f6efdd" opacity=".8"><circle cx="95" cy="123.9" r=".6"/><circle cx="108" cy="123.4" r=".5"/><circle cx="126" cy="123.2" r=".6"/><circle cx="134" cy="122.4" r=".45"/></g>',
          '</g>',
          /* 迎客草席：门内地上的一块浅褐编织席（34×12，近边略宽做透视），细密斜纹 + 横向压条暗示编织。
             放在 x99–127 的空地上，避开旧账本(150–188)、铃(125–142)、烛台(190–204) */
          '<g id="matG" display="none">',
          '<path d="M102 126.8 L122 126.4 L127 139.2 L99 138.6 Z" fill="#a8814f"/>',
          '<path d="M102 126.8 L122 126.4 L127 139.2 L99 138.6 Z" fill="none" stroke="#8b6a3f" stroke-width="1"/>',
          '<g stroke="#8b6a3f" stroke-width=".6" opacity=".45" fill="none" stroke-dasharray="3 1.8">',
          '<path d="M101.7 127.98 L122.5 127.68"/><path d="M101.1 130.34 L123.5 130.24"/><path d="M100.5 132.7 L124.5 132.8"/><path d="M99.9 135.06 L125.5 135.36"/><path d="M99.3 137.42 L126.5 137.92"/>',
          '</g>',
          '<g stroke="#6d4f2c" stroke-width=".6" opacity=".4" fill="none" stroke-dasharray="3 1.8" stroke-dashoffset="2.4">',
          '<path d="M101.4 129.16 L123 128.96"/><path d="M100.8 131.52 L124 131.52"/><path d="M100.2 133.88 L125 134.08"/><path d="M99.6 136.24 L126 136.64"/>',
          '</g>',
          '<path d="M99 138.6 L127 139.2" stroke="#7d5c33" stroke-width="1.5"/>',
          '<path d="M99.4 140 L127.4 140.6" stroke="#3a2a1e" stroke-width="1.1" opacity=".2"/>',
          '</g>',
          /* 地窖暗门：靠内侧地上一扇掀起并靠墙的门板 + 压扁的黑色门洞（带两级台阶），落在柜台左侧空地 */
          '<g id="cellarG" display="none">',
          '<path d="M62 131.4 L86 128.6 L90.4 139.2 L66.6 141.2 Z" fill="#0b0704"/>',
          '<path d="M62 131.4 L86 128.6 L90.4 139.2 L66.6 141.2 Z" fill="none" stroke="#2a1a0e" stroke-width="1"/>',
          '<path d="M66.4 134.4 L87.8 132.2 M67.8 137.6 L89 135.6" stroke="#241208" stroke-width="1.6" opacity=".9"/>',
          '<path d="M63.4 130.6 L85 128 L83 119.4 L65.6 121.6 Z" fill="#4a3018" stroke="#2d1a0c" stroke-width="1"/>',
          '<path d="M66.6 121.2 L83.4 119.2" stroke="#6b4a2e" stroke-width="1" opacity=".85"/>',
          '<path d="M64.6 127.6 L84 125.4" stroke="#5c3d20" stroke-width="1.2" opacity=".8"/>',
          '<path d="M64.2 124.4 L82.8 122.4" stroke="#3a2a1e" stroke-width=".9" opacity=".7"/>',
          '<circle cx="75" cy="126.8" r="1.1" fill="#c9a24a"/>',
          '</g>',

          /* ---- v0.11 墙面：粗石墙（0–1 档）→ 挂毯（2 档起）→ 壁灯（3 档起）→ 墙上货架（4 档）----
             这几组画得早，所以刀盾挂件、货架、店主、灯都会压在上面（挂毯上挂着刀盾是想要的效果） */
          '<g id="wallRoughG" display="none">',
          '<g fill="#4c3b29" opacity=".45">',
          '<path d="M8 8 h26 v12 h-26 Z"/><path d="M52 52 h22 v10 h-22 Z"/><path d="M18 104 h20 v12 h-20 Z"/>',
          '<path d="M186 6 h20 v12 h-20 Z"/><path d="M212 118 h22 v10 h-22 Z"/><path d="M252 112 h24 v10 h-24 Z"/>',
          '<path d="M306 18 h10 v16 h-10 Z"/></g>',
          '<g stroke="#120d08" stroke-width="1.1" fill="none" opacity=".75">',
          '<path d="M120 130 l-7 -14 l5 -11"/><path d="M196 46 l9 12 l-4 10"/><path d="M92 16 l7 10 l-4 9"/>',
          '<path d="M306 96 l-6 12 l4 11"/></g>',
          '<path d="M116 0 V146" stroke="#392a1b" stroke-width="5" opacity=".45"/>',
          '<path d="M0 60 H116" stroke="#392a1b" stroke-width="3.4" opacity=".4"/>',
          '<g stroke="#8a8272" stroke-width=".6" fill="none" opacity=".3">',
          '<path d="M0 6 q16 2 22 16"/><path d="M0 18 q11 4 15 15"/><path d="M16 6 q2 8 6 12"/></g>',
          '</g>',
          '<g id="wallTapestryG" display="none">',
          '<rect x="124" y="29" width="56" height="3.4" rx="1.6" fill="#5a3a20"/>',
          '<path d="M130 32 h44 v76 q-11 5 -22 0 q-11 5 -22 0 Z" fill="#463a5a"/>',
          '<path d="M130 32 h44 v3 h-44 Z" fill="#2f2740"/>',
          '<g stroke="#6b5a80" stroke-width=".8" opacity=".5" fill="none">',
          '<path d="M136 34 V106"/><path d="M144 34 V109"/><path d="M152 34 V110"/><path d="M160 34 V109"/><path d="M168 34 V106"/></g>',
          '<path d="M152 84 l6 7 l-6 7 l-6 -7 Z" fill="none" stroke="#c9a24a" stroke-width="1.2" opacity=".7"/>',
          '<circle cx="152" cy="91" r="2" fill="#c9a24a" opacity=".55"/>',
          '<g stroke="#8a7a9a" stroke-width=".9" opacity=".65">',
          '<path d="M134 109 v5"/><path d="M141 111 v5"/><path d="M148 112 v5"/><path d="M155 112 v5"/><path d="M162 111 v5"/><path d="M169 109 v5"/></g>',
          '</g>',
          /* wallSconceG / boardG / iceboxG / doorbellG 在 v0.14 挪到 winG 之后：
             2 档起窗洞吃掉了右墙（178..306），这几件要么挂在窗边、要么立在窗前台面上，
             必须画在玻璃前面，否则会被窗框/窗台切掉一角。它们本来只在 tier≥2 / ≥3 显示，
             所以 tier<2 的像素完全不受影响。 */
          '<g id="wallNicheG" display="none">',
          '<rect x="128" y="124" width="48" height="4" rx="1" fill="#5a3a20" stroke="#2d1a0c" stroke-width=".8"/>',
          '<path d="M134 128 v8 M170 128 v8" stroke="#4a3018" stroke-width="1.8"/>',
          '<rect x="131" y="114" width="5.4" height="10" rx="1.4" fill="#7fc8a8" opacity=".9"/>',
          '<rect x="132.6" y="110.6" width="2.2" height="3.6" rx="1" fill="#6b4a32"/>',
          '<path d="M142 124 v-8 l4 -3 l4 3 v8 Z" fill="#8fa8ea" opacity=".85"/>',
          '<circle cx="155" cy="117.6" r="3.4" fill="#b6c6f0" opacity=".9"/>',
          '<circle cx="154" cy="116.4" r="1.1" fill="#fff" opacity=".7"/>',
          '<path d="M160 124 v-7 h9 v7 Z" fill="#7a3b4a"/>',
          '<path d="M161.4 117.4 h6.2" stroke="#e8dfcb" stroke-width="1" opacity=".8"/>',
          '<path d="M172 124 v-5.4 l2 -1.6 l2 1.6 v5.4 Z" fill="#c9a24a" opacity=".85"/>',
          '</g>',

          /* ---- 布棚（第 1/2 级：木棚、临街小铺）----
             v0.11 重画：原来是一块布 + 四片悬空的斜旗子，中间露出墙，看着像没画完。
             现在改成「横杆 + 布面 + 连续荷叶边（16 个 20px 弧）+ 褶皱 + 布下投影」，
             下缘是连贯的波浪，顶上到边，读起来就是一整条布棚。 */
          '<g id="awningG" display="none">',
          '<rect y="0" width="320" height="5" fill="#3d2029"/>',
          '<rect y="5" width="320" height="2.4" fill="#8f6572" opacity=".5"/>',
          '<rect y="7.4" width="320" height="9.8" fill="#6b3f4a"/>',
          '<path d="M10 7.4 V17.2 M30 7.4 V17.2 M50 7.4 V17.2 M70 7.4 V17.2 M90 7.4 V17.2 ' +
            'M110 7.4 V17.2 M130 7.4 V17.2 M150 7.4 V17.2 M170 7.4 V17.2 M190 7.4 V17.2 ' +
            'M210 7.4 V17.2 M230 7.4 V17.2 M250 7.4 V17.2 M270 7.4 V17.2 M290 7.4 V17.2 ' +
            'M310 7.4 V17.2" stroke="#4a2b33" stroke-width=".9" opacity=".45"/>',
          '<path fill="#8a5460" d="M0 17.2 q10 13 20 0 q10 13 20 0 q10 13 20 0 q10 13 20 0 ' +
            'q10 13 20 0 q10 13 20 0 q10 13 20 0 q10 13 20 0 q10 13 20 0 q10 13 20 0 ' +
            'q10 13 20 0 q10 13 20 0 q10 13 20 0 q10 13 20 0 q10 13 20 0 q10 13 20 0 Z"/>',
          '<rect y="16.6" width="320" height="1.4" fill="#3a1c24" opacity=".4"/>',
          '<rect y="18" width="320" height="10" fill="url(#ceilGrad)" opacity=".75"/>',
          '</g>',

          /* ---- 墙上挂件：一把挂在墙上的剑 ---- */
          '<g id="wallSword" opacity=".95">',
          '<circle cx="134" cy="44" r="3" fill="#c9a24a"/>',
          '<rect x="132.2" y="46" width="3.6" height="9" rx="1.6" fill="#5a3a20"/>',
          '<rect x="127" y="55" width="14" height="3" rx="1.5" fill="#8a6a28"/>',
          '<path d="M131 58 h6 v22 l-3 5 l-3 -5 Z" fill="#c6d0dc"/>',
          '<path d="M134 59 v21" stroke="#93a0b2" stroke-width=".9" opacity=".75"/>',
          '<circle cx="134" cy="88" r="2.2" fill="#c9a24a"/>',
          '</g>',
          '<g id="wallShield" opacity=".95">',
          '<path d="M150 62 q9 -3 15 0 v8 q0 8 -7.5 12 q-7.5 -4 -7.5 -12 Z" fill="#7d5a3a"/>',
          '<path d="M150 62 q9 -3 15 0 v8 q0 8 -7.5 12 q-7.5 -4 -7.5 -12 Z" fill="none" stroke="#4a3418" stroke-width="1.6"/>',
          '<circle cx="157.6" cy="72" r="2" fill="#c9a24a"/>',
          '</g>',

          /* ---- v0.8 可购买装饰（新增 6 件里的 4 件，挂在墙 / 后墙）----
             board  今日有货木牌：窗右下、店主右侧的墙面（避开店主与传送门）
             vault  铁皮保险柜：后墙货架与窗之间
             icebox 后屋冰窖：一席冷帘（帘子 + 霜光）
             bell   黄铜门铃：吊在布棚下、传送门上方（注意：柜台上那只旧铃叫 bellG，别撞 id） */
          /* boardG / iceboxG / doorbellG 见 winG 之后的说明 */
          '<g id="vaultG" display="none">',
          '<ellipse cx="135" cy="142" rx="18" ry="2.2" fill="#000" opacity=".25"/>',
          '<rect x="118" y="104" width="34" height="38" rx="2" fill="#3b414c" stroke="#22262d" stroke-width="1.4"/>',
          '<rect x="121" y="107" width="28" height="32" rx="1.4" fill="#4b5361"/>',
          '<circle cx="135" cy="122" r="6.4" fill="#5d6675" stroke="#2c313a" stroke-width="1.1"/>',
          '<circle cx="135" cy="122" r="2.2" fill="#c9a24a"/>',
          '<path d="M135 116 V118.4 M135 125.6 V128 M129 122 H131.6 M138.4 122 H141" stroke="#c9a24a" stroke-width="1" opacity=".9"/>',
          '<rect x="146" y="118" width="3" height="8" rx="1.2" fill="#c9a24a"/>',
          '<g fill="#8a93a2" opacity=".6"><circle cx="121.6" cy="107.6" r=".8"/><circle cx="148" cy="107.6" r=".8"/>',
          '<circle cx="121.6" cy="138.4" r=".8"/><circle cx="148" cy="138.4" r=".8"/></g>',
          '</g>',
          /* ---- 货架（左）---- */
          '<g id="shelfG">',
          '<rect x="10" y="40" width="106" height="5" fill="#4a301a"/>',
          '<rect x="10" y="66" width="106" height="5" fill="#4a301a"/>',
          '<rect x="10" y="92" width="106" height="5" fill="#4a301a"/>',
          '<g fill="#3a2513" opacity=".9"><rect x="10" y="45" width="4" height="7"/><rect x="112" y="45" width="4" height="7"/>',
          '<rect x="10" y="71" width="4" height="7"/><rect x="112" y="71" width="4" height="7"/>',
          '<rect x="10" y="97" width="4" height="7"/><rect x="112" y="97" width="4" height="7"/></g>',
          '<g fill="#2a1c10" opacity=".4"><rect x="8" y="40" width="106" height="2"/><rect x="8" y="66" width="106" height="2"/><rect x="8" y="92" width="106" height="2"/></g>',
          '</g>',
          /* ---- 第四层货架（买下 shelf4 才显示）---- */
          '<g id="shelf4G" display="none">',
          '<rect x="10" y="118" width="106" height="5" fill="#4a301a"/>',
          '<g fill="#3a2513" opacity=".9"><rect x="10" y="123" width="4" height="7"/><rect x="112" y="123" width="4" height="7"/></g>',
          '<rect x="8" y="118" width="106" height="2" fill="#2a1c10" opacity=".4"/>',
          '</g>',
          '<g id="goodsG"></g>',

          /* ---- v0.11 窗洞的三档 ----
             0 档是破门洞（黑洞洞的，没有玻璃也没有天），1 档挂一块补丁布帘，
             2 档起才砌成真窗 winG。阳光只走 winG，tier<2 时 applyLight 把 sun 归零。 */
          '<g id="apHoleG" display="none">',
          '<path d="M230 100 V46 Q230 26 250 26 H286 Q302 26 302 46 V100 Z" fill="#080b10"/>',
          '<path d="M230 100 V46 Q230 26 250 26 H286 Q302 26 302 46 V100" fill="none" stroke="#2a2015" stroke-width="4"/>',
          '<g fill="#3a2f22"><path d="M225 40 h7 v11 h-6 Z"/><path d="M225 84 h6 v10 h-5 Z"/>',
          '<path d="M300 52 h6 v13 h-5 Z"/><path d="M296 26 h4 v6 h-4 Z"/></g>',
          '<g stroke="#5a4c3a" stroke-width=".7" fill="none" opacity=".45">',
          '<path d="M234 30 q14 10 6 24 q-8 12 4 22"/><path d="M292 74 q-10 6 -18 2"/></g>',
          '</g>',
          '<g id="apClothG" display="none">',
          '<path d="M230 100 V46 Q230 26 250 26 H286 Q302 26 302 46 V100 Z" fill="#12161c"/>',
          '<path d="M231 99 V46 Q231 27 250 27 H286 Q301 27 301 46 V99 Q283 104 267 99 Q250 104 231 99 Z" fill="#5b4a3a"/>',
          '<g fill="none" stroke="#3f3225" stroke-width="1" opacity=".75">',
          '<path d="M240 28 q4 36 0 71"/><path d="M254 27 q-3 36 0 72"/><path d="M268 27 q4 36 0 71"/><path d="M282 28 q-3 34 0 69"/></g>',
          '<path d="M262 50 h14 v12 h-14 Z" fill="#4b3d2e" stroke="#382c20" stroke-width=".8"/>',
          '<path d="M266 48 l1.6 3 l3.4 .4 l-2.4 2.4 l.6 3.4 l-3 -1.6 l-3 1.6 l.6 -3.4 l-2.4 -2.4 l3.4 -.4 Z" fill="#8a7a5a" opacity=".55"/>',
          '<path d="M239 66 h11 v9 h-11 Z" fill="#6a5744"/>',
          '<path d="M231 63 q17 5 26 1" stroke="#8a6a28" stroke-width="1.5" fill="none" opacity=".8"/>',
          '<path d="M296 58 q-7 3 -1 7" stroke="#8a6a28" stroke-width="1.4" fill="none" opacity=".7"/>',
          '<path d="M230 100 V46 Q230 26 250 26 H286 Q302 26 302 46 V100" fill="none" stroke="#3a2a18" stroke-width="3.6"/>',
          '<path d="M224 98 h84 v4 h-84 Z" fill="#3a2a18"/>',
          '</g>',

          /* ---- 窗（右）：v0.14 起 2 档以上砌成落地大窗 ----
             原窗 72×74（230..302 × 26..100）；大窗 128×92（178..306 × 26..118，宽 ≈ 原 1.78 倍），
             下沿落到柜台线上方，上沿仍贴檐下。tier<2 这一组不显示 → 旧档像素一点没动。
             v0.15：窗外原来是现代城市剪影（方块楼 + 窗格 + 烟囱），换成异世界风景：
             侧逆光、只分深浅三层的剪影，不画写实细节。
             分层（从后往前）：天空渐变 → 季节天光 wash → 两轮月亮 → 星点/流星 → 异世界远景
             （最远锯齿山 → 中景尖峰 → 浮空岛群/世界树 → 近山基）→ 岛上暖灯 cityLight
             → 季节前景（枝/叶/雪）→ 窗框/竖梃/横梃/玻璃高光 → nightWinG 夜间 overlay。
             月亮要压在天光 wash 之上：wash 是半透明色纱，压在月亮前面会把月牙糊成一块。
             窗外中段被店主挡住（脑袋约占 x214..262 / y53..118），所以景物按「左簇 + 右簇 +
             头顶一条高空带」布置，别把主岛画在窗洞正中。
             四季做成八组（四组天光 + 四组前景）全部预建：setSeason 只切 display，不新建节点。 */
          '<g id="winG">',
          '<use href="#winShape" fill="url(#skyG)"/>',
          /* 季节天光 wash：默认春（0）显示，其余三组 display:none，等 setSeason 切 */
          '<g id="seasonSky0G" clip-path="url(#winClipG)"><use href="#winShape" fill="url(#sSky0)"/></g>',
          '<g id="seasonSky1G" clip-path="url(#winClipG)" display="none"><use href="#winShape" fill="url(#sSky1)"/></g>',
          '<g id="seasonSky2G" clip-path="url(#winClipG)" display="none"><use href="#winShape" fill="url(#sSky2)"/></g>',
          '<g id="seasonSky3G" clip-path="url(#winClipG)" display="none"><use href="#winShape" fill="url(#sSky3)"/></g>',
          /* 两轮月亮：大的在右簇上方（284,43.4），小的偏左上方（183.4,33.2）；同一个 id，
             applyLight 一次写整组 opacity（白天不归零，见 applyLight 里的淡月影）。
             都画成「亮盘 + 一圈冷色边 + 淡光晕」：玻璃上还压着 0.85 的太阳光束，
             只描一个圆盘会和天光糊成一片，加边光才数得出是两轮。 */
          '<g id="moonG" clip-path="url(#winClipG)">',
          '<circle cx="284" cy="50.4" r="14" fill="url(#moonHaloG)" opacity=".62"/>',
          '<circle cx="284" cy="50.4" r="8.6" fill="#fffaee"/>',
          '<circle cx="284" cy="50.4" r="8.6" fill="none" stroke="#8ea4c2" stroke-width="1.1" opacity=".62"/>',
          '<circle cx="183" cy="46" r="9.4" fill="url(#moonHaloG)" opacity=".72"/>',
          '<circle cx="183" cy="46" r="4" fill="#fffaee"/>',
          '<circle cx="183" cy="46" r="4" fill="none" stroke="#8ea4c2" stroke-width="1" opacity=".6"/>',
          '</g>',
          /* 星点：几粒 + 一划流星，都很淡；位置避开两轮月亮，别抢戏 */
          '<g id="starG" clip-path="url(#winClipG)" fill="#e8f1ff" opacity=".66">',
          '<circle cx="206" cy="28" r=".7"/><circle cx="214" cy="32.4" r=".5"/>',
          '<circle cx="222" cy="27.4" r=".55"/><circle cx="236" cy="29.4" r=".6"/>',
          '<circle cx="258" cy="33" r=".5"/><circle cx="264" cy="28.4" r=".55"/>',
          '<circle cx="272" cy="31.4" r=".45"/><circle cx="296" cy="34" r=".5"/>',
          '<circle cx="182" cy="48" r=".45"/><circle cx="292" cy="24.6" r=".4"/>',
          '</g>',
          '<path d="M204 27 L210.6 31" stroke="#dfeaff" stroke-width="1" opacity=".36" stroke-linecap="round"/>',
          '<circle cx="210.9" cy="31.1" r=".8" fill="#fff6e4" opacity=".6"/>',
          /* ---- 异世界远景：三层剪影，远去淡、近去深（#2b3a54 / #1c2739 / #101825） ---- */
          '<g id="fantasyG" clip-path="url(#winClipG)">',
          /* 1/4 最远一层：山脊线是「长坡上去、短坡下来」几座峰，不是等距锯齿
             （等距尖三角在剪影里会读成锯齿/草叶），最淡的一层（#2b3a54，透明度最低）。 */
          '<path d="M178 120 V86 L183 82.6 L187.4 84.4 L190.6 78.2 L194.2 79.8 L197.6 74.4 L201 78.6 L204.4 76.4 L208.2 82 L211.6 80.6 L215 83.4 L219 76.8 L222.6 78.4 L226 72.6 L229.6 76.4 L233 75.2 L236.6 79.8 L240.4 78 L244 80.6 L247.6 74.8 L251.2 77 L254.6 73.2 L258.4 77.6 L262 75.8 L265.4 79.4 L269.2 73.6 L272.8 76.2 L276.2 74.4 L279.8 79 L283.4 77.2 L286.8 80.2 L290.6 74.2 L294.2 76.8 L297.6 73.6 L301.2 78.2 L304.4 76.4 L306 78.4 V120 Z" fill="#2b3a54" opacity=".38"/>',
          /* 2/4 中景山峰：四座主峰带肩带鞍，峰顶别画得又窄又高（那样会读成尖塔/城市天际线） */
          '<path d="M178 120 V102 L183 96 L186.6 98.2 L190.5 90 L194 92.8 L197.5 80.5 L201 88 L204.4 86 L208 95 L211.5 93 L215 97.5 L219 89 L222.6 91.4 L226 84 L230 92 L233.6 94.6 L237 90 L241 97.8 L245 92 L248.6 94.4 L252 86.4 L256 93 L259.6 95.4 L263 91.6 L267 98.6 L271 92.4 L274.6 94.8 L278 87 L282 94 L285.6 96.4 L289 92 L293 98.8 L297 93.4 L300.6 95.8 L304 91 L306 93.6 V120 Z" fill="#1c2739" opacity=".68"/>',
          /* 3/4 浮空岛群：四块，高度错开，越近越深（上宽下尖的倒锥 + 垂藤/碎石/晶簇） */
          /* 岛 1（最远，右上角，被窗洞右沿切掉一角） */
          '<path d="M296.6 56.4 L300.4 53.8 L303.6 54.8 L306 56.4 L305.2 58.8 L303 58 L301.4 61.8 L299.4 60.8 L298 63.6 L296.6 60.2 Z" fill="#22303f" opacity=".5"/>',
          '<path d="M299.8 63 q1 3 -.4 5.6 M303.6 58.2 q1 2.8 .2 5" fill="none" stroke="#22303f" stroke-width=".7" opacity=".45"/>',
          /* 岛 2（右簇，托一片针叶林和暖灯）：上宽下尖，侧边一级级碎岩，
             不能画成光滑圆锥 —— 光滑锥在剪影里会读成船帆/帐篷。 */
          '<path d="M264 76.8 L268 74.6 L272.4 75.6 L277 74.2 L282 75.4 L287 74.6 L292 75.8 L297 75 L301.6 76.4 L306 77.6 L304.6 80.4 L302.4 83.6 L300.4 82.8 L298 88.4 L295.6 87.6 L293 93 L290 92.2 L287.6 97 L284.6 96.2 L283 101.4 L280 96 L277.4 97.2 L275.4 91.6 L273 92.6 L271 86.8 L268.6 87.8 L267 82 L265.4 83 Z" fill="#1a2433" opacity=".86"/>',
          '<path d="M265 76.4 L272.6 74.8 L282 75.2 L292 75.6 L300.6 76.2" fill="none" stroke="#3a4d6b" stroke-width=".8" opacity=".5"/>',
          '<path d="M283 101.4 q1 4 -.8 7 M295.6 87.6 q1.6 5 .2 8.6 M271 86.8 q-1.4 5 .4 8.4" fill="none" stroke="#1a2433" stroke-width=".7" opacity=".75"/>',
          '<g fill="#0e1622" opacity=".8"><path d="M281 92 l2.4 -3 l2 3 Z"/><path d="M290 84.6 l1.8 -2.2 l1.6 2.2 Z"/></g>',
          '<g fill="#5c86b8" opacity=".7"><path d="M288 82.6 l1.4 -4 l1.4 4 l-1.4 1.6 Z"/>',
          '<path d="M299.6 84.4 l1.2 -3.4 l1.2 3.4 l-1.2 1.4 Z"/></g>',
          /* 岛上小树林：两丛树冠各由三四个圆叠成（同色叠合没有缝），比单一个圆点更像叶子 */
          '<g fill="#0c1420" opacity=".92">',
          '<path d="M271.4 76 V71.8 M273.2 76 V72.6"/>',
          '<circle cx="270.2" cy="69.8" r="3.2"/><circle cx="274" cy="70.6" r="2.8"/>',
          '<circle cx="272.2" cy="67.8" r="2.6"/><ellipse cx="272.2" cy="72.6" rx="4.2" ry="1.6"/>',
          '<path d="M291.2 75.8 V70.8 M293.6 75.8 V71.6"/>',
          '<circle cx="289.6" cy="69.4" r="3.6"/><circle cx="294.6" cy="70.4" r="3.2"/>',
          '<circle cx="292.2" cy="67.2" r="2.8"/><ellipse cx="292.2" cy="73" rx="5" ry="1.8"/></g>',
          /* 岛 3（高空小岛）：整体抬高到店主头顶那条天上，倒锥的尖必须露出来，
             藏在脑袋后面就只剩一块圆石，读不出「浮空」。 */
          '<path d="M228 34.4 L231.4 32.2 L235 33 L238.4 31.8 L242 32.8 L245.6 32.4 L248.4 33.6 L250 35 L248.2 38 L245.8 41 L244 40.2 L242.2 43.6 L239.6 42.8 L237.8 46 L236 45 L235.2 47.6 L233 44.2 L231.2 45 L229.8 40.6 L228.2 41.4 Z" fill="#1f2a3a" opacity=".78"/>',
          '<path d="M235.2 47.6 q.8 2.4 -.4 4.2 M242.2 43.6 q1 2.2 .2 4" fill="none" stroke="#1f2a3a" stroke-width=".7" opacity=".6"/>',
          '<g fill="#1f2a3a" opacity=".6"><path d="M239.8 50.4 l1.6 -1.8 l1.2 1.8 Z"/>',
          '<path d="M231 51.6 l1.4 -1.6 l1 1.6 Z"/></g>',
          /* 岛 4（主岛，左簇，最大）：上面立一座孤塔 —— 塔身窄、尖顶高，
             在逆光剪影里比树冠好认（树冠几团叠在一起容易读成蘑菇）。 */
          '<path d="M176 65.4 L180.4 62.8 L184.6 63.8 L188.4 62.2 L192.6 63.2 L197 62.4 L201.8 63.4 L206.4 62.8 L211 64.2 L214.6 65.6 L217 67.2 L215.6 70.6 L213.8 74.4 L212.2 73.6 L210.8 78.6 L208.6 77.8 L207.2 83.4 L204.8 82.6 L203.4 88 L201 87.2 L199.4 91.6 L197.2 90.8 L196.2 97.6 L193.8 92.4 L192 93.6 L190.6 88.2 L188.8 89.4 L187.2 83 L185.4 84.2 L184 77.6 L182.4 78.6 L181 72.2 L179.2 73 L178.2 68.6 Z" fill="#131d2b" opacity=".93"/>',
          /* 主岛顶面的一条边光 + 草尖 */
          '<path d="M177.4 64.8 L184.6 63.4 L192.6 62.8 L201.8 63 L211 64.4 L214.8 65.6" fill="none" stroke="#3a4d6b" stroke-width=".8" opacity=".55"/>',
          '<path d="M183.6 64.4 l1.4 -3 l1.2 3 M189 63.6 l1.2 -2.6 l1.2 2.8 M208.6 64.6 l1.2 -2.6 l1.2 2.8 M212.4 65.4 l1.2 -2.4 l1 2.6" fill="none" stroke="#3a4d6b" stroke-width=".7" opacity=".5"/>',
          /* 孤塔：塔身（下宽上收）+ 一圈出檐 + 一个不算太尖的锥顶 + 一道亮着的窗缝。
             顶不能画成又宽又尖的大三角（会读成箭头），也别加一排垛口小窗（会读成灯塔灯室）。 */
          '<path d="M195.9 63.9 L203.1 63.9 L202.5 51.4 L196.5 51.4 Z" fill="#0d1520"/>',
          '<path d="M194.9 51.5 L204.1 51.5 L204.1 49.9 L194.9 49.9 Z" fill="#0d1520"/>',
          '<path d="M199.5 43.6 L203.4 49.9 L195.6 49.9 Z" fill="#0d1520"/>',
          '<path d="M199.5 43.6 V42.4" stroke="#0d1520" stroke-width=".9" stroke-linecap="round"/>',
          '<path d="M198.6 60.8 V56.2" stroke="#2b3a54" stroke-width=".9" opacity=".7"/>',
          '<path d="M199.5 45 L199.5 49.2" stroke="#2b3a54" stroke-width=".5" opacity=".45"/>',
          /* 岛底垂藤 / 碎石 / 晶簇 */
          '<g fill="none" stroke="#0e1622" stroke-width=".8" opacity=".85" stroke-linecap="round">',
          '<path d="M188 72 q-1.6 8 .8 14 q1.6 4 -.4 7"/><path d="M196.2 97.6 q1.4 6 -.6 10"/>',
          '<path d="M206.4 78 q2 7 .4 11 q-1 3 .6 5"/></g>',
          '<g fill="#0e1622" opacity=".8"><path d="M193 93.4 l2.4 -3 l2 3 Z"/><path d="M200.4 88 l1.8 -2.2 l1.6 2.2 Z"/></g>',
          '<g fill="#5c86b8" opacity=".7"><path d="M191.6 80.6 l1.4 -4 l1.4 4 l-1.4 1.6 Z"/>',
          '<path d="M207.4 84 l1.2 -3.4 l1.2 3.4 l-1.2 1.4 Z"/></g>',
          /* 远处一只极小的飞龙：两片弯翼 + 一截尾，别画成飞机（别和流星放同一条线上） */
          '<path d="M254.4 34.4 c.9 -1.4 1.9 -1.1 2.3 .1 c.8 -1.5 2 -1.6 2.7 -.4 c-.7 .4 -1.5 .4 -2.1 .2 c-.6 .9 -1.7 1 -2.9 .1 Z" fill="#101825" opacity=".9"/>',
          '<path d="M259.6 34.6 q1.4 .8 1.6 2" fill="none" stroke="#101825" stroke-width=".6" opacity=".85" stroke-linecap="round"/>',
          /* 4/4 近山基：最暗的一条锯口，把画面坐住（冬天会被前景雪坡盖住下半） */
          '<path d="M178 120 V114 L188 110 L196 115 L205 108 L213 114 L221 110 L230 116 L238 111 L247 116 L256 112 L265 117 L274 113 L283 118 L292 114 L300 118 L306 115 V120 Z" fill="#101825" opacity=".88"/>',
          '</g>',
          /* 岛上暖色小灯：只有傍晚/夜里 city 权重 > 0 才亮（applyLight 直接写这一组的 opacity）。
             位置跟新的景物对齐：孤塔窗缝 / 针叶林边 / 高空小岛 / 右上角碎岛，各自带一圈光晕。 */
          '<g id="cityLight" fill="#ffce7a" opacity=".9">',
          '<circle cx="198.6" cy="58.4" r="1.1"/><circle cx="291.8" cy="73.4" r=".9"/>',
          '<circle cx="233.4" cy="34.6" r=".7"/><circle cx="300.4" cy="55.4" r=".6"/>',
          '</g>',
          /* ---- 季节前景：枝/叶/雪，全部落在 winClipG 里，压不到窗框外面 ---- */
          /* 0 春：右上斜下的樱枝 + 花簇 + 几片飘落 */
          '<g id="seasonFg0G" clip-path="url(#winClipG)">',
          '<path d="M306 30 q-22 5 -38 17 q-13 10 -26 8" fill="none" stroke="#6d4638" stroke-width="2.4" stroke-linecap="round"/>',
          '<path d="M268 47 q-9 -7 -17 -7 M247 53 q7 7 6 14 M300 33 q-8 10 -6 18" fill="none" stroke="#6d4638" stroke-width="1.4" stroke-linecap="round"/>',
          petals(260, 42, 13, 9, '#ffb9cf'),
          petals(248, 54, 11, 7, '#ffa9c4'),
          petals(288, 31, 10, 6, '#ffd3e2'),
          petals(232, 62, 9, 5, '#ffc2d4'),
          '<g fill="#fff2f7" opacity=".85"><circle cx="268" cy="44" r="1.4"/><circle cx="248" cy="54" r="1.2"/><circle cx="288" cy="34" r="1.1"/></g>',
          '<g fill="#ffc2d4" opacity=".9"><ellipse cx="222" cy="74" rx="2.2" ry="1.3" transform="rotate(-18 222 74)"/>',
          '<ellipse cx="262" cy="68" rx="1.9" ry="1.1" transform="rotate(14 262 68)"/>',
          '<ellipse cx="240" cy="90" rx="1.7" ry="1" transform="rotate(-9 240 90)"/></g>',
          '</g>',
          /* 1 夏：浓绿树冠压住上沿 + 两侧垂叶（v0.15 收薄了一层：原来树冠一直垂到 y≈60，
             把两轮月亮整个吃掉；现在压到 y≈42 以上，月亮露在树冠下面，夏天也数得出两轮） */
          '<g id="seasonFg1G" clip-path="url(#winClipG)" display="none">',
          '<g fill="#2c5c2e"><ellipse cx="196" cy="30" rx="34" ry="12"/><ellipse cx="236" cy="24" rx="34" ry="13"/>',
          '<ellipse cx="276" cy="30" rx="32" ry="12"/><ellipse cx="306" cy="24" rx="26" ry="11"/></g>',
          '<g fill="#3f7d3a"><ellipse cx="200" cy="27" rx="27" ry="9"/><ellipse cx="240" cy="21" rx="28" ry="10"/>',
          '<ellipse cx="280" cy="27" rx="26" ry="9"/></g>',
          '<g fill="#5a9a46" opacity=".9"><ellipse cx="212" cy="23" rx="17" ry="5.4"/><ellipse cx="252" cy="18" rx="18" ry="5.4"/>',
          '<ellipse cx="288" cy="24" rx="16" ry="5.4"/></g>',
          '<g fill="#a6e2ff" opacity=".5"><circle cx="222" cy="38" r="2.4"/><circle cx="258" cy="34" r="2"/><circle cx="196" cy="46" r="1.6"/></g>',
          '<g fill="#3f7d3a"><ellipse cx="183" cy="62" rx="9" ry="4" transform="rotate(-24 183 62)"/>',
          '<ellipse cx="301" cy="58" rx="11" ry="4.6" transform="rotate(20 301 58)"/></g>',
          '</g>',
          /* 2 秋：左上的红枫枝 + 右侧一簇 + 几片落叶 */
          '<g id="seasonFg2G" clip-path="url(#winClipG)" display="none">',
          '<path d="M178 34 q26 6 40 20 q11 10 24 8" fill="none" stroke="#7a4a30" stroke-width="2.4" stroke-linecap="round"/>',
          '<path d="M306 38 q-18 6 -28 18 M214 52 q6 9 4 16" fill="none" stroke="#7a4a30" stroke-width="1.6" stroke-linecap="round"/>',
          petals(206, 44, 16, 10, '#d2562f'),
          petals(236, 56, 12, 8, '#e88a3a'),
          petals(288, 30, 12, 7, '#d2562f'),
          petals(268, 62, 10, 6, '#f0b24a'),
          '<g fill="#f0b24a" opacity=".9"><ellipse cx="222" cy="80" rx="2.4" ry="1.4" transform="rotate(20 222 80)"/>',
          '<ellipse cx="252" cy="92" rx="2.1" ry="1.2" transform="rotate(-16 252 92)"/>',
          '<ellipse cx="292" cy="76" rx="1.9" ry="1.1" transform="rotate(26 292 76)"/></g>',
          '</g>',
          /* 3 冬：枯枝 + 底下一道雪坡 + 雪点 */
          '<g id="seasonFg3G" clip-path="url(#winClipG)" display="none">',
          '<path d="M178 30 q24 8 36 22 M196 38 q-2 12 -8 18 M212 48 q10 -2 18 2" fill="none" stroke="#4a3a34" stroke-width="2.2" stroke-linecap="round"/>',
          '<path d="M306 28 q-24 8 -34 22 M290 38 q4 12 10 18 M262 46 q-6 10 -4 16" fill="none" stroke="#4a3a34" stroke-width="2" stroke-linecap="round"/>',
          '<path d="M178 118 V106 q20 -7 36 -3 q18 5 32 1 q16 -4 34 1 q16 4 26 1 V118 Z" fill="url(#sSnowG)"/>',
          '<path d="M178 107.4 q22 -6 38 -2 q17 4 30 0 q17 -4 32 1 q14 3 28 0" fill="none" stroke="#b9d2ea" stroke-width="1.1" opacity=".75"/>',
          '<g fill="#f6fbff" opacity=".9"><circle cx="196" cy="66" r="1.1"/><circle cx="228" cy="58" r=".9"/>',
          '<circle cx="256" cy="72" r="1.2"/><circle cx="282" cy="60" r="1"/><circle cx="300" cy="74" r=".9"/>',
          '<circle cx="214" cy="86" r="1"/><circle cx="244" cy="96" r=".8"/></g>',
          '</g>',
          /* ---- 窗框：竖梃两道 + 横梃一道（线宽恒定 3，不跟窗一起缩放）---- */
          '<g fill="none" stroke="#5a3a20" stroke-width="3">',
          '<path d="M220.7 26 V118"/><path d="M263.3 26 V118"/><path d="M178 72 H306"/></g>',
          /* 玻璃高光（白天也有；夜间另有 nightWinG 那层反光，两套都按新尺寸画） */
          '<g fill="url(#dayGlassG)" opacity=".38">',
          '<path d="M186 28 L212 28 L186 78 Z"/><path d="M272 33 L298 33 L298 62 Z"/></g>',
          /* 外框 + 窗台（比原来宽 140，向两侧各出 6） */
          '<path d="M178 118 V46 Q178 26 198 26 H286 Q306 26 306 46 V118" fill="none" stroke="#4a2e18" stroke-width="5"/>',
          '<rect x="172" y="116" width="140" height="5" rx="2" fill="#4a2e18"/>',
          '<path d="M173.5 117 H310.5" stroke="#6a4a2e" stroke-width="1" opacity=".5"/>',
          /* v0.15 打烊窗景：冷蓝夜色压在窗景上 + 浮空岛上几盏暖灯 + 玻璃反光。
             原来那盏「街灯 + 光锥 + 灯杆」属于城市语汇，已整根删掉，换成岛上的暖色小灯
             （和白天 cityLight 那几粒同位，夜里才亮）。整组在 winG 里 —— tier<2 没有窗就
             自然没有；opacity 由 applyLight 按夜间权重写。 */
          '<g id="nightWinG" opacity="0" clip-path="url(#winClipG)">',
          '<use href="#winShape" fill="url(#nWinG)"/>',
          '<ellipse cx="198.6" cy="58.4" rx="11" ry="8" fill="url(#nStreetG)" opacity=".7"/>',
          '<ellipse cx="291.8" cy="73.4" rx="9.6" ry="7.2" fill="url(#nStreetG)" opacity=".58"/>',
          '<ellipse cx="233.4" cy="34.6" rx="6.4" ry="4.8" fill="url(#nStreetG)" opacity=".42"/>',
          '<circle cx="198.6" cy="58.6" r="1.4" fill="#ffe6b4"/>',
          '<circle cx="291.8" cy="73.6" r="1.2" fill="#ffe6b4"/>',
          '<circle cx="233.4" cy="34.8" r=".9" fill="#ffe6b4"/>',
          '<path d="M184 30 L226 31 L184 96 Z" fill="url(#nGlassG)"/>',
          '<path d="M250 33 L300 34 L300 72 Z" fill="url(#nGlassG)" opacity=".55"/>',
          '</g>',
          '</g>',
          /* ---- 窗边/窗前挂件：画在大窗之后 = 压在玻璃前面，不会被窗框切一角 ----
             sconce 3 档起、board/icebox/bell 是买的装饰，原本都只在 tier≥2 出现；
             位置一点没动（墙灯仍 176..200，正好贴着新窗框左边那一根竖梃）。 */
          '<g id="wallSconceG" display="none">',
          '<circle cx="188" cy="70" r="20" fill="url(#lampG)" opacity=".5"/>',
          '<path d="M186 76 h4 v6 h-4 Z" fill="#3b3b42"/>',
          '<path d="M176 82 h24 v4 h-24 Z" fill="#33333a"/>',
          '<path d="M180 86 q1.6 -6 3 -6 q1.4 0 3 6" fill="none" stroke="#3b3b42" stroke-width="1.6"/>',
          '<path d="M192 86 q1.6 -6 3 -6 q1.4 0 3 6" fill="none" stroke="#3b3b42" stroke-width="1.6"/>',
          '<rect x="181.4" y="72" width="3.4" height="9" fill="#e8dfcb"/>',
          '<rect x="193.4" y="72" width="3.4" height="9" fill="#e8dfcb"/>',
          '<path d="M183 66 q3 4.4 0 7.2 q-3 -2.8 0 -7.2 Z" fill="#ffd98a"/>',
          '<path d="M195 66 q3 4.4 0 7.2 q-3 -2.8 0 -7.2 Z" fill="#ffd98a"/>',
          '</g>',
          '<g id="boardG" display="none" transform="translate(78 4)">',
          '<path d="M203 106 V100 M221 106 V100" stroke="#4a3418" stroke-width="1.2"/>',
          '<circle cx="203" cy="99" r="1.2" fill="#c9a24a"/><circle cx="221" cy="99" r="1.2" fill="#c9a24a"/>',
          '<rect x="196" y="106" width="32" height="26" rx="2.2" fill="#5a3a20" stroke="#2d1a0c" stroke-width="1.2"/>',
          '<rect x="198.4" y="108.4" width="27.2" height="21.2" rx="1.4" fill="none" stroke="#8a6a28" stroke-width=".8" opacity=".7"/>',
          '<path d="M202 113 h20 M202 117 h20 M202 121 h13" stroke="#e8dfcb" stroke-width="1.1" opacity=".8"/>',
          '<path d="M214 125 l2.2 -2.4 l4.4 4.4" stroke="#8fd39a" stroke-width="1.3" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity=".85"/>',
          '</g>',
          '<g id="iceboxG" display="none">',
          '<rect x="158" y="98" width="34" height="44" rx="2" fill="#1b2430" stroke="#0f151c" stroke-width="1.2"/>',
          '<rect x="160" y="100" width="30" height="42" rx="1.6" fill="#243244"/>',
          '<g stroke="#8fd6ff" fill="none" stroke-linecap="round" opacity=".4">',
          '<path d="M165 102 q2 9 -1 18 q-1.6 7 .6 13" stroke-width="2.6"/>',
          '<path d="M173 102 q2 10 -1 19 q-1.6 7 .8 14" stroke-width="2.8"/>',
          '<path d="M182 102 q2 9 -1 18 q-1.6 7 .6 13" stroke-width="2.4"/></g>',
          '<path d="M160 100 q15 6 30 0" stroke="#a8ecff" stroke-width="1.1" fill="none" opacity=".75"/>',
          '<path d="M162 138 q13 5 26 0" stroke="#a8ecff" stroke-width=".9" fill="none" opacity=".45"/>',
          '<g fill="#d6f6ff" opacity=".8"><circle cx="164" cy="106" r=".8"/><circle cx="186" cy="112" r=".7"/>',
          '<circle cx="171" cy="130" r=".7"/><circle cx="188" cy="134" r=".8"/></g>',
          '<ellipse cx="175" cy="142" rx="17" ry="2.6" fill="#bff0ff" opacity=".16"/>',
          '</g>',
          '<g id="doorbellG" display="none" transform="translate(52 26)">',
          '<path d="M148 4 V10" stroke="#4a3418" stroke-width="1.4"/>',
          '<path d="M141 10 h14" stroke="#8a6a28" stroke-width="2.2" stroke-linecap="round"/>',
          '<path d="M148 11 q-6 4 -6 8.4 q0 3 6 3 q6 0 6 -3 q0 -4.4 -6 -8.4 Z" fill="#c9a24a"/>',
          '<path d="M142.4 21.4 h11.2" stroke="#8a6a28" stroke-width="1.8"/>',
          '<circle cx="148" cy="23.4" r="1.6" fill="#e6c980"/>',
          '<path d="M146 18 q2 2 4 0" stroke="#8a6a28" stroke-width=".8" fill="none" opacity=".8"/>',
          '</g>',

          /* ---- v0.13 檐下挡雨棚（装饰 awning）：门洞/摊位上沿的一条斜布棚 ----
             画在 winG 之后 = 压在窗洞上沿，看起来是挂在屋檐外的一层；只用一套布色，
             但形态与 1/2 档那条「横杆 + 连续荷叶边」的布棚区分开：
             这里是「木撑杆 + 斜布面 + 收边挂穗 + 绳结」，只占右半（门这一侧），
             下缘压到 y30 打住 —— 不碰店主的头（头顶 y≈62）、不进货架（x<116）、不压柜台（y140）。 */
          '<g id="awningRainG" display="none">',
          /* 顶梁（挂布的那根木条） */
          '<rect x="184" y="8.2" width="138" height="4.2" rx="1.6" fill="#3d2029"/>',
          '<rect x="184" y="8.8" width="138" height="1.1" fill="#8f6572" opacity=".45"/>',
          /* 斜布面：后缘贴梁，前缘向右上收 */
          '<path d="M186 11.6 L320 11.6 L320 22 L188 30 Z" fill="#6b3f4a"/>',
          '<path d="M186 11.6 L320 11.6 L320 13.8 L186 14.6 Z" fill="#8a5460" opacity=".45"/>',
          /* 布面褶皱（四道） */
          '<g stroke="#4a2b33" stroke-width=".9" opacity=".45" fill="none">',
          '<path d="M206 11.8 L207 29.4"/><path d="M236 11.8 L237 28.6"/>',
          '<path d="M266 11.8 L267 27.4"/><path d="M296 11.8 L297 26.2"/></g>',
          /* 前缘收边 + 高光 */
          '<path d="M188 30 L320 22" stroke="#8a5460" stroke-width="2.6" stroke-linecap="round"/>',
          '<path d="M189 29.2 L319 21.6" stroke="#b07a88" stroke-width=".7" opacity=".55"/>',
          /* 收边挂穗：七枚（线 + 珠） */
          '<g stroke="#8a5460" stroke-width="1.1">',
          '<path d="M194 29.6 V32.8"/><path d="M212 28.6 V31.8"/><path d="M230 27.5 V30.7"/>',
          '<path d="M248 26.4 V29.6"/><path d="M266 25.3 V28.5"/><path d="M284 24.2 V27.4"/>',
          '<path d="M302 23.1 V26.3"/></g>',
          '<g fill="#b07a88"><circle cx="194" cy="33.2" r=".9"/><circle cx="212" cy="32.2" r=".9"/>',
          '<circle cx="230" cy="31.1" r=".9"/><circle cx="248" cy="30" r=".9"/>',
          '<circle cx="266" cy="28.9" r=".9"/><circle cx="284" cy="27.8" r=".9"/>',
          '<circle cx="302" cy="26.7" r=".9"/></g>',
          /* 木撑杆两根（斜撑到前缘两端）+ 高光 + 绳结 */
          '<path d="M194 7.4 L191 30.6" stroke="#4a3018" stroke-width="2.4" stroke-linecap="round"/>',
          '<path d="M194.8 8.2 L192 29.4" stroke="#6e4a24" stroke-width=".8" opacity=".7"/>',
          '<path d="M312 7.4 L315.6 21.6" stroke="#4a3018" stroke-width="2.4" stroke-linecap="round"/>',
          '<path d="M311.2 8.2 L314.4 20.6" stroke="#6e4a24" stroke-width=".8" opacity=".7"/>',
          '<circle cx="194" cy="10.4" r="1.7" fill="#8a6a28"/>',
          '<circle cx="312" cy="10.4" r="1.7" fill="#8a6a28"/>',
          /* 布下的一层浅影，跟货架/窗框脱开 */
          '<path d="M188 30 L320 22 L320 26 L190 34 Z" fill="#000" opacity=".13"/>',
          '</g>',

          /* ---- 吊灯 ---- */
          '<g id="lampG2">',
          '<path d="M168 0 V10" stroke="#241a12" stroke-width="1.6"/>',
          '<path id="lampCone" d="M157 30 L179 30 L208 148 L128 148 Z" fill="url(#coneG)" opacity=".8"/>',
          '<circle id="lampGlow" cx="168" cy="22" r="34" fill="url(#lampG)"/>',
          '<path d="M160 14 H176 L182 22 L176 30 H160 L154 22 Z" fill="#2f2a24"/>',
          '<path d="M160 14 H176" stroke="#4a423a" stroke-width="1.2"/>',
          '<ellipse id="lampBody" cx="168" cy="22" rx="5.4" ry="6.4" fill="#ffe0a8"/>',
          '<rect x="166.6" y="8" width="2.8" height="6" fill="#2f2a24"/>',
          '</g>',

          /* ---- 可购买装饰：墙面三件（蒙尘穿衣镜 / 停摆座钟 / 门口油灯）----
             都画在墙、窗之后与柜台之前；镜子立在货架与窗之间的墙脚，
             座钟挂在挂毯上沿的空白墙面上，油灯挂在窗口右侧的墙棱上。 */
          /* 蒙尘穿衣镜：深木框 + 浅冷灰镜面 + 两道斜向高光，立在地面上靠墙 */
          '<g id="mirrorG" display="none">',
          '<ellipse cx="169" cy="126.4" rx="10.5" ry="2.4" fill="#000" opacity=".2"/>',
          '<rect x="159.6" y="92" width="18.8" height="34" rx="1.6" fill="#5a3a20" stroke="#3a2a1e" stroke-width="1"/>',
          '<rect x="161.6" y="94.2" width="14.8" height="29.6" fill="#bcc8ce"/>',
          '<rect x="161.6" y="94.2" width="14.8" height="29.6" fill="none" stroke="#8b6a3f" stroke-width=".7" opacity=".8"/>',
          '<path d="M162 109 L172.4 95.4" stroke="#e9f0f3" stroke-width="2.2" opacity=".75"/>',
          '<path d="M165 121.6 L175.4 107.2" stroke="#e9f0f3" stroke-width="1.4" opacity=".5"/>',
          '<path d="M162.4 116 L168 94.8" stroke="#dfe8ec" stroke-width=".9" opacity=".32"/>',
          '<g fill="#8e9aa1" opacity=".32"><circle cx="171" cy="101" r="1.2"/><circle cx="165" cy="112" r=".9"/><circle cx="173" cy="118" r=".7"/></g>',
          '</g>',
          /* 停摆座钟：木壳圆盘，指针停在 11:47（分针 282°、时针 353.5°） */
          '<g id="clockG" display="none">',
          '<circle cx="134" cy="21" r="8.6" fill="#5a3a20" stroke="#3a2a1e" stroke-width="1"/>',
          '<circle cx="134" cy="21" r="6.6" fill="#e8dfcb"/>',
          '<circle cx="134" cy="21" r="6.6" fill="none" stroke="#8a6a28" stroke-width=".6" opacity=".7"/>',
          '<path d="M134 14.8 V16 M134 26 V27.2 M127.8 21 H129 M139 21 H140.2" stroke="#4a3418" stroke-width=".8"/>',
          '<path d="M134 21 L133.6 18.2" stroke="#3a2a1e" stroke-width="1.6" stroke-linecap="round"/>',
          '<path d="M134 21 L130.8 20.5" stroke="#3a2a1e" stroke-width="1.1" stroke-linecap="round"/>',
          '<circle cx="134" cy="21" r=".9" fill="#c9a24a"/>',
          '<circle cx="134" cy="11.6" r="1.5" fill="#8b6a3f"/>',
          '</g>',
          /* 门口油灯：挂在窗口右侧墙棱上的小油灯，灯芯一点暖光 + 一圈很淡的光晕 */
          '<g id="oilLampG" display="none">',
          '<circle cx="310.5" cy="63" r="10" fill="#ffd98a" opacity=".13"/>',
          '<circle cx="310.5" cy="63" r="6.4" fill="none" stroke="#ffd98a" stroke-width="1" opacity=".18"/>',
          '<rect x="307.6" y="43.4" width="5.8" height="2.6" rx=".9" fill="#3a2a1e"/>',
          '<path d="M310.5 46 V55" stroke="#3a2a1e" stroke-width="1.2"/>',
          '<circle cx="310.5" cy="46" r="1.2" fill="#c9a24a"/>',
          '<rect x="307.4" y="52.6" width="6.2" height="6.6" rx="1.6" fill="#f3e2b8" opacity=".45" stroke="#c9a24a" stroke-width=".5"/>',
          '<path d="M310.5 54.6 q1.7 2.3 0 3.6 q-1.7 -1.3 0 -3.6 Z" fill="#ffd98a"/>',
          '<path d="M304.6 59 q0 -2.8 3.2 -2.8 h5.4 q3.2 0 3.2 2.8 v6.2 q0 2.8 -3.2 2.8 h-5.4 q-3.2 0 -3.2 -2.8 Z" fill="#4a3018" stroke="#2d1a0c" stroke-width=".8"/>',
          '<rect x="307.9" y="61.4" width="5.2" height="4.2" rx=".7" fill="#e0b45c" opacity=".5"/>',
          '<rect x="304" y="67.2" width="13" height="2" rx="1" fill="#5a4028"/>',
          '<path d="M316.6 60 q2.4 2.2 .6 5.2" stroke="#c9a24a" stroke-width="1" fill="none" opacity=".85"/>',
          '</g>',

          /* ---- 二楼（第 4 级：商会铺面）---- */
          '<g id="upperG" display="none">',
          '<rect x="8" y="0" width="30" height="11" fill="#ffcf87" opacity=".42"/>',
          '<rect x="48" y="0" width="30" height="11" fill="#ffcf87" opacity=".26"/>',
          '<path d="M23 0 v11 M8 5.5 h30 M63 0 v11 M48 5.5 h30" stroke="#3b3227" stroke-width="1.2"/>',
          '<rect x="0" y="12" width="126" height="3.4" rx="1.4" fill="#5a4632"/>',
          '<g fill="#2b3038">',
          '<rect x="8" y="15" width="3.6" height="9" rx="1"/><rect x="24" y="15" width="3.6" height="9" rx="1"/>',
          '<rect x="40" y="15" width="3.6" height="9" rx="1"/><rect x="56" y="15" width="3.6" height="9" rx="1"/>',
          '<rect x="72" y="15" width="3.6" height="9" rx="1"/><rect x="88" y="15" width="3.6" height="9" rx="1"/>',
          '<rect x="104" y="15" width="3.6" height="9" rx="1"/></g>',
          '<rect x="0" y="23.4" width="126" height="2.6" rx="1" fill="#3b3227"/>',
          '</g>',    /* ---- 地摊（第 0 级：两块木箱架一块板，货摆板上）---- */
          /* v0.13 二楼亮窗的夜光（只有 tier 4 有 upperG；亮度由 applyLight 写） */
          '<g id="nightUpperG" opacity="0">',
          '<circle cx="23" cy="4" r="17" fill="url(#nWarmG)" opacity=".7"/>',
          '<circle cx="63" cy="4" r="17" fill="url(#nWarmG)" opacity=".55"/>',
          '</g>',
          '<g id="stallG" display="none">',
          '<rect y="0" width="320" height="152" fill="#14181f" opacity=".34"/>',
          '<rect y="152" width="320" height="48" fill="#22201d"/>',
          '<g fill="#2b2722"><circle cx="18" cy="176" r="1.3"/><circle cx="96" cy="188" r="1"/><circle cx="210" cy="182" r="1.1"/><circle cx="286" cy="192" r="1"/></g>',
          '<rect x="20" y="158" width="26" height="22" rx="2" fill="#4a3726" stroke="#2d2114" stroke-width="1.2"/>',
          '<rect x="48" y="158" width="26" height="22" rx="2" fill="#553f2b" stroke="#2d2114" stroke-width="1.2"/>',
          '<rect x="14" y="142" width="128" height="6" rx="1.6" fill="#6b4a2e"/>',
          '<rect x="14" y="142" width="128" height="2" rx="1" fill="#8a6338" opacity=".8"/>',
          '<path d="M16 148 v32" stroke="#3a2a1a" stroke-width="3"/>',
          '<path d="M140 148 v32" stroke="#3a2a1a" stroke-width="3"/>',
          /* 街灯（画面左边缘） */
          '<rect x="4" y="66" width="2.4" height="88" fill="#2b2e35"/>',
          '<path d="M5.2 66 q0 -5.4 5.4 -5.4 h4.4 q5.4 0 5.4 5.4 Z" fill="#c9a24a"/>',
          '<circle cx="12.6" cy="69.6" r="3" fill="#ffd79a" opacity=".95"/>',
          '<circle cx="12.6" cy="69.6" r="10" fill="url(#coneG)" opacity=".38"/>',
          '</g>',

          /* ---- 柜台面 ---- */
          '<g id="counterTopG">',
          '<rect x="0" y="142" width="320" height="9" fill="url(#counterG)"/>',
          '<rect x="0" y="142" width="320" height="9" fill="url(#woodP)"/>',
          '<rect x="0" y="142" width="320" height="2" fill="#a3713f" opacity=".9"/>',
          '<rect x="0" y="149.4" width="320" height="1.6" fill="#2d1a0c" opacity=".55"/>',
          /* v0.11：台面材质三档（1 木板 / 2 台布 / 3+ 雕花实木）—— 一次性建好，setTier 切 display。
             台面上的账本、钱袋、铜板都画在这组之后，所以永远压在台布上。 */
          '<g id="ctPlankG" display="none">',
          '<rect x="0" y="142" width="320" height="9" fill="#6b4a2e"/>',
          '<g stroke="#3a2414" stroke-width="1" opacity=".65"><path d="M0 145.4 H320"/><path d="M52 142 V151"/>',
          '<path d="M118 142 V151"/><path d="M196 142 V151"/><path d="M268 142 V151"/></g>',
          '<g fill="#3a3a3f"><circle cx="24" cy="143.6" r=".9"/><circle cx="86" cy="143.4" r=".9"/>',
          '<circle cx="150" cy="143.8" r=".8"/><circle cx="232" cy="143.5" r=".9"/><circle cx="300" cy="143.7" r=".8"/></g>',
          '<path d="M0 149.6 H320" stroke="#2a180c" stroke-width="1.2" opacity=".8"/>',
          '</g>',
          '<g id="ctClothG" display="none">',
          '<rect x="0" y="142" width="320" height="9" fill="#c9c1a8"/>',
          '<g stroke="#a89e84" stroke-width=".8" opacity=".8"><path d="M0 144.4 H320"/><path d="M0 148.4 H320"/></g>',
          '<rect x="0" y="146.6" width="320" height="1.4" fill="#8a8069" opacity=".5"/>',
          '<rect x="0" y="142" width="320" height="1.2" fill="#e8e2cf" opacity=".55"/>',
          '</g>',
          '<g id="ctCarveG" display="none">',
          '<rect x="0" y="142" width="320" height="9" fill="#5b3517"/>',
          '<rect x="0" y="142" width="320" height="9" fill="url(#woodP)" opacity=".7"/>',
          '<rect x="0" y="142.4" width="320" height="1.4" fill="#c08a4a" opacity=".85"/>',
          '<path d="M0 148.8 H320" stroke="#c9a24a" stroke-width=".8" opacity=".45"/>',
          '<g fill="#8a6a28" opacity=".65"><path d="M30 145 l2 2.4 l-2 2.4 l-2 -2.4 Z"/>',
          '<path d="M92 145 l2 2.4 l-2 2.4 l-2 -2.4 Z"/><path d="M222 145 l2 2.4 l-2 2.4 l-2 -2.4 Z"/>',
          '<path d="M292 145 l2 2.4 l-2 2.4 l-2 -2.4 Z"/></g>',
          '</g>',
          '</g>',

          /* ---- 可购买装饰：旧账本（柜台上、店主左手边的一本摊开旧账）----
             画在柜台之后、店主之前；位置在钱袋右侧的空台面上，不碰木牌与店主。 */
          '<g id="ledgerG" display="none">',
          '<ellipse cx="303" cy="141.4" rx="7.4" ry="1.5" fill="#000" opacity=".26"/>',
          '<path d="M296.4 141.2 L297.4 134.4 Q303 136.2 308.6 134.4 L309.6 141 Z" fill="#3a2a1e"/>',
          '<path d="M297.2 140.6 L298.1 135.2 Q303 136.8 308 135.2 L308.9 140.4 Z" fill="#e8dfcb"/>',
          '<path d="M303 135.4 V140.4" stroke="#b3a68d" stroke-width=".8"/>',
          '<g stroke="#8d8271" stroke-width=".55" opacity=".8"><path d="M299 137.4 H302"/><path d="M299 139 H302"/><path d="M304.2 137.4 H307.4"/><path d="M304.2 139 H307.4"/></g>',
          '<path d="M308.4 136.2 V140.8" stroke="#5a3a20" stroke-width="1.2"/>',
          '<path d="M297.4 135.4 q2.2 1.4 4.6 1.2" stroke="#8b6a3f" stroke-width=".5" opacity=".7"/>',
          '</g>',

          /* ---- 阳光：从右窗斜射进来（白天才亮）；v0.14 起光束起点跟着落地大窗的玻璃走 ---- */
          '<g id="sunBeamG" opacity="0">',
          '<path d="M182 28 L304 33 L214 200 L74 200 Z" fill="url(#sunG)"/>',
          '<path d="M200 34 L298 39 L242 200 L150 200 Z" fill="url(#sunG)" opacity=".6"/>',
          '</g>',
          '<g id="sunPatchG2" opacity="0">',
          '<ellipse cx="150" cy="146" rx="74" ry="9" fill="url(#sunPatchG)"/>',
          '</g>',

          /* ---- 台面阴影 ---- */
          '<g id="shadowG" opacity=".9">',
          '<ellipse cx="169" cy="143.4" rx="25" ry="3.2" fill="url(#shadowG)"/>',
          '<ellipse cx="132" cy="142.4" rx="10" ry="2.2" fill="url(#shadowG)"/>',
          '<ellipse cx="284" cy="142.6" rx="14" ry="3" fill="url(#shadowG)"/>',
          '<ellipse cx="262" cy="142" rx="12" ry="2.4" fill="url(#shadowG)"/>',
          '<ellipse cx="240" cy="146" rx="46" ry="6" fill="url(#shadowG)"/>',
          '</g>',

          /* ---- v0.13 打烊夜灯（h<7）：地面 / 台面的柔光 + 各档灯具的暖黄光晕 ----
             全部预建，applyLight 只写 opacity、setTier 只切 display —— 不新建节点、不跑新循环。
             放在 shadowG 之后、店主之前：光洒在台面和地上，人站在光里，但人的画法一点没改。 */
          '<g id="nightPoolG" opacity="0">',
          '<ellipse cx="76" cy="143.6" rx="54" ry="12" fill="url(#nPoolG)"/>',
          '<ellipse cx="306" cy="143.2" rx="34" ry="9" fill="url(#nPoolG)" opacity=".85"/>',
          '<ellipse cx="168" cy="135" rx="78" ry="18" fill="url(#nPoolG)" opacity=".55"/>',
          '<ellipse cx="86" cy="136" rx="42" ry="11" fill="url(#nPoolG)" opacity=".45"/>',
          '<ellipse cx="240" cy="147.6" rx="60" ry="10" fill="url(#nPoolG)" opacity=".3"/>',
          '</g>',
          /* 0 档地摊：木板上的一盏提灯（街边摊没有吊灯，就靠这个） */
          '<g id="nightStallLanG" opacity="0">',
          '<path d="M116 141.6 h10 v-2.4 h-10 Z" fill="#4a4033"/>',
          '<path d="M117.4 131.6 h7.2 l1.4 7.6 h-10 Z" fill="#ffd79a" opacity=".95"/>',
          '<path d="M117.4 131.6 h7.2" stroke="#8a6a28" stroke-width="1.1"/>',
          '<path d="M118.6 131.6 q0 -4.6 2.4 -4.6 q2.4 0 2.4 4.6" fill="none" stroke="#8a6a28" stroke-width="1.2"/>',
          '<circle cx="121" cy="135.6" r="18" fill="url(#nWarmG)"/>',
          '</g>',
          /* 1 档起：柜台左端的油灯 */
          '<g id="nightCounterG" opacity="0">',
          '<path d="M71 141.6 h12 v-2.6 h-12 Z" fill="#4a4033"/>',
          '<path d="M72.6 133 h8.8 l-1.2 6 h-6.4 Z" fill="#ffd79a" opacity=".95"/>',
          '<path d="M72.6 133 h8.8" stroke="#8a6a28" stroke-width="1"/>',
          '<path d="M74 133 q1.4 -4.4 3 -4.4 q1.6 0 3 4.4" fill="none" stroke="#8a6a28" stroke-width="1.2"/>',
          '<circle cx="77" cy="136" r="19" fill="url(#nWarmG)"/>',
          '</g>',
          /* 2 档起：柜台右端再补一支蜡烛（钱袋旁边那块空台面） */
          '<g id="nightCounter2G" opacity="0">',
          '<path d="M300 141.6 h13 v-2.6 h-13 Z" fill="#4a4033"/>',
          '<rect x="303.6" y="130" width="5.6" height="9.6" fill="#efe6d1"/>',
          '<path d="M306.4 126 q3 4 0 6.4 q-3 -2.4 0 -6.4 Z" fill="#ffd98a"/>',
          '<circle cx="306.4" cy="130" r="15" fill="url(#nWarmG)" opacity=".9"/>',
          '</g>',
          /* 3 档起：墙上壁灯（老壁灯那盏的晕 + 窗边再点一盏双烛壁灯） */
          '<g id="nightSconceG" opacity="0">',
          '<circle cx="188" cy="72" r="27" fill="url(#nWarmG)" opacity=".9"/>',
          '<path d="M216 56 v-9" stroke="#3b3b42" stroke-width="2.6"/>',
          '<path d="M206 56 h20 v-3.2 h-20 Z" fill="#33333a"/>',
          '<path d="M208.4 52 q1.4 -6.4 3 -6.4 q1.6 0 3 6.4 M216.4 52 q1.4 -6.4 3 -6.4 q1.6 0 3 6.4" fill="none" stroke="#3b3b42" stroke-width="1.4"/>',
          '<rect x="209.4" y="38" width="3.2" height="8.4" fill="#efe6d1"/>',
          '<rect x="218.6" y="38" width="3.2" height="8.4" fill="#efe6d1"/>',
          '<path d="M210.6 32 q3.2 4.6 0 7.4 q-3.2 -2.8 0 -7.4 Z" fill="#ffd98a"/>',
          '<path d="M219.8 32 q3.2 4.6 0 7.4 q-3.2 -2.8 0 -7.4 Z" fill="#ffd98a"/>',
          '<circle cx="215" cy="38" r="21" fill="url(#nWarmG)" opacity=".85"/>',
          '</g>',
          /* v0.13.1 夜间环境光（0/1 档最需要，2 档以上自己就有灯，权重收着）：
             一层很淡的暖光铺在墙面 + 货架区域，再把三层货架板的「板沿」提亮一条细线 ——
             瓶子和卷轴的剪影靠这条亮边从墙里分离出来，所以夜里也能认出架子上摆的是什么。
             整组预建，applyLight 只写 opacity，不新建节点。 */
          '<g id="nightAmbG" opacity="0">',
          '<rect x="0" y="22" width="252" height="128" fill="url(#nAmbG)"/>',
          '<rect x="6" y="110" width="244" height="46" fill="url(#nGoodsG)"/>',
          '<g id="nAmbShelfG" fill="#ffcf94" display="none">',
          '<rect x="10" y="39.2" width="106" height="1.3" opacity=".5"/>',
          '<rect x="10" y="65.2" width="106" height="1.3" opacity=".46"/>',
          '<rect x="10" y="91.2" width="106" height="1.3" opacity=".42"/>',
          '</g>',
          '</g>',

          /* ---- 店主 ---- */
          '<g id="charBody">',
          '<g id="torso">',
          '<path id="robe" d="M202 152 C202 116 216 102 238 102 C260 102 274 116 274 152 Z" fill="#2f4a5c"/>',
          '<path id="robeShade" d="M238 102 C260 102 274 116 274 152 H250 C250 120 246 106 238 102 Z" fill="#233a48" opacity=".9"/>',
          '<path id="apron" d="M226 127 H250 L253 152 H223 Z" fill="#6b4526"/>',
          '<path id="apronPocket" d="M230 137 H246 v4 H230 Z" fill="#57351c"/>',
          '<path id="apronStrap" d="M230 112 l-3 15 M246 112 l3 15" stroke="#4a2e18" stroke-width="2.4"/>',
          '<path id="collar" d="M228 104 q10 7 20 0" fill="none" stroke="#8fd0c8" stroke-width="2.2" opacity=".65"/>',
          '</g>',
          '<circle id="neck" cx="238" cy="100" r="7.5" fill="#d9a078"/>',
          '<g id="headG">',
          '<ellipse id="head" cx="238" cy="86" rx="19" ry="19.5" fill="#e8b48c"/>',
          '<path id="hair" d="M219 84 q0 -21 19 -21 q19 0 19 21 q-5 -10 -19 -10 q-14 0 -19 10 Z" fill="#c9a24a" opacity=".0"/>',
          '<path id="hood" d="M217 86 q2 -25 21 -25 q19 0 21 25 q-4 -9 -21 -9 q-17 0 -21 9 Z" fill="#3c5c6e"/>',
          '<path id="hoodTip" d="M217 84 q-4 -8 1 -12 q3 6 8 7 Z" fill="#3c5c6e"/>',
          '<g id="faceG">',
          '<g id="eyesG"><ellipse id="eyeL" cx="231" cy="88" rx="2" ry="2.4" fill="#22282f"/>',
          '<ellipse id="eyeR" cx="245" cy="88" rx="2" ry="2.4" fill="#22282f"/></g>',
          '<path id="browL" d="M227 82.4 q4 -1.6 8 -0.4" stroke="#3a2b20" stroke-width="1.5" fill="none" stroke-linecap="round"/>',
          '<path id="browR" d="M241 82 q4 -1.2 8 0.6" stroke="#3a2b20" stroke-width="1.5" fill="none" stroke-linecap="round"/>',
          '<path id="mouth" d="M233 96 q5 4 10 0" stroke="#8a4a3c" stroke-width="1.7" fill="none" stroke-linecap="round"/>',
          /* v0.13.1 打哈欠时张开的嘴（平时 opacity=0） */
          '<ellipse id="mouthO" cx="238" cy="97.4" rx="2.2" ry="1.2" fill="#5d2a26" opacity="0"/>',
          '<ellipse cx="224" cy="94" rx="4" ry="2.4" fill="#e08d78" opacity=".26"/>',
          '<ellipse cx="252" cy="94" rx="4" ry="2.4" fill="#e08d78" opacity=".26"/>',
          '</g>',
          '</g>',
          '</g>',

          /* ---- 柜台上的东西 ---- */
          '<g id="propsG">',
          /* 常驻的摊开账本：id 改成 shopLedgerG，把 ledgerG 让给可购买的「旧账本」 */
          '<g id="shopLedgerG">',
          '<path d="M150 141 L188 141 L188 132 L150 133 Z" fill="#e8dfcb"/>',
          '<path d="M169 133 L169 141" stroke="#b3a68d" stroke-width="1"/>',
          '<g stroke="#8d8271" stroke-width=".8" opacity=".85"><path d="M153 136 H166"/><path d="M172 136 H185"/><path d="M153 138.6 H165"/><path d="M172 138.6 H184"/></g>',
          '<path d="M150 141 L150 133" stroke="#5a3a20" stroke-width="1.6"/>',
          '<path d="M188 141 L188 132" stroke="#5a3a20" stroke-width="1.6"/>',
          '</g>',
          /* v0.13.1 摊在店主面前的那本账（翻账本动作时才亮出来）：两页 + 中缝 + 一页可翻的纸 */
          '<g id="bookG" opacity="0">',
          '<path d="M207 141.6 L227 141.6 L227 133.4 L209 134 Z" fill="#e8dfcb"/>',
          '<path d="M229 141.6 L249 141.6 L247 134 L229 133.4 Z" fill="#efe6d1"/>',
          '<g stroke="#9a8f7a" stroke-width=".7" opacity=".8"><path d="M211 136.2 H224"/><path d="M211 138.6 H223"/>',
          '<path d="M232 136.2 H245"/><path d="M232 138.6 H244"/></g>',
          '<path d="M228 132.8 V141.8" stroke="#6b4a32" stroke-width="1.4"/>',
          /* 正在翻的那一页：绕中缝转起来，读成「翻页」 */
          '<path id="bookPage" d="M229 133.2 L248 133.8 L248 141.4 L229 141.2 Z" fill="#fdf8ea" stroke="#b3a68d" stroke-width=".5"/>',
          '</g>',
          '<g id="bellG"><path d="M126 141 q0 -7 6 -7 q6 0 6 7 Z" fill="#c9a24a"/>',
          '<rect x="125" y="140.4" width="14" height="1.8" rx=".9" fill="#8a6a28"/>',
          '<circle cx="132" cy="134" r="1.6" fill="#e6c980"/></g>',
          '<g id="coinsG"></g>',
          '<g id="pouchG">',
          '<path d="M282 141 q-10 0 -10 -8 q0 -9 12 -9 q12 0 12 9 q0 8 -10 8 Z" fill="#7a5a34"/>',
          '<path d="M283 125 q5 2 9 0" stroke="#3a2a18" stroke-width="2" fill="none"/>',
          '<circle cx="284" cy="136" r="2.4" fill="#c9a24a" opacity=".9"/>',
          '</g>',
          /* ---- 可购买装饰：店猫 / 烛台 / 学徒 ---- */
          '<g id="catG" display="none">',
          '<ellipse id="catShadow" cx="34" cy="141.8" rx="13" ry="2.2" fill="#000" opacity=".22"/>',
          '<g id="catBody">',
          '<path d="M25 142 q0 -15 8.6 -18 q8.6 3 8.6 18 Z" fill="#343d50"/>',
          '<path id="catTail" d="M41.4 141 q6.4 -1.4 5.6 -10.6" stroke="#343d50" stroke-width="3.6" fill="none" stroke-linecap="round"/>',
          '<path id="catPaw" d="M30.4 132.4 q-3 2 -2.2 5" stroke="#343d50" stroke-width="2.8" fill="none" stroke-linecap="round" opacity="0"/>',
          '<g id="catHead">',
          '<circle cx="33.4" cy="122.6" r="7.4" fill="#343d50"/>',
          '<path d="M27.6 118.6 l1.4 -5.6 l4.2 3.4 Z" fill="#343d50"/>',
          '<path d="M36.4 118 l2.6 -5.4 l2.8 4.6 Z" fill="#343d50"/>',
          '<path d="M27.4 118 q-2.6 6 -1.6 12" stroke="#93a2bf" stroke-width="1.5" fill="none" opacity=".9"/>',
          '<g id="catEyes"><circle cx="30.6" cy="124" r="1.15" fill="#c6d2e6"/><circle cx="36.4" cy="124" r="1.15" fill="#c6d2e6"/></g>',
          '<path id="catMouth" d="M32.4 127.6 q1 .9 2 0" stroke="#8e9bb0" stroke-width=".9" fill="none" opacity=".8"/>',
          '<ellipse id="catMouthO" cx="33.4" cy="127.9" rx="1.5" ry="1.1" fill="#7b879b" opacity="0"/>',
          '</g>',
          '</g>',
          '</g>',
          '<g id="candleG" display="none">',
          '<path d="M191 141.6 q6.4 2 13 0" stroke="#8a6a28" stroke-width="1.2" fill="none"/>',
          '<rect x="190.4" y="139.8" width="14" height="2.4" rx="1.2" fill="#b08d2e"/>',
          '<rect x="195.2" y="127.4" width="4.4" height="12.6" fill="#efe6d1"/>',
          '<rect x="195.2" y="127.4" width="1.5" height="12.6" fill="#fffaf0" opacity=".8"/>',
          '<circle id="flameHalo" cx="197.4" cy="123.4" r="9" fill="#ffcf7a" opacity=".2"/>',
          '<path id="flame" d="M197.4 118.4 q3.6 4.6 0 7.8 q-3.6 -3.2 0 -7.8 Z" fill="#ffd98a"/>',
          '<path d="M197.4 121.4 q1.7 2 0 3.6 q-1.7 -1.5 0 -3.6" fill="#fff6dc"/>',
          '</g>',
          /* ---- 可购买装饰：玻璃橱窗 / 水晶吊灯 / 金字招牌 / 传送门 ---- */
          '<g id="glassG" display="none">',
          '<path d="M234 30 H298 V96 H234 Z" fill="#cfe4f5" opacity=".1"/>',
          '<path d="M237 33 L263 33 L237 76 Z" fill="#dceeff" opacity=".12"/>',
          '<path d="M268 37 L295 37 L295 62 Z" fill="#dceeff" opacity=".09"/>',
          '<g transform="translate(266 80)">',
          '<circle r="11" fill="#8fd6ff" opacity=".16"/>',
          '<path d="M0 -9 L5 1 L0 9 L-5 1 Z" fill="#8fd6ff" opacity=".85"/>',
          '<path d="M0 -9 L0 9" stroke="#d8f4ff" stroke-width=".7" opacity=".7"/>',
          '</g>',
          '</g>',
          '<g id="chandG" display="none">',
          '<circle id="chandHalo" cx="168" cy="44" r="26" fill="#ffe6b0" opacity=".14"/>',
          '<ellipse cx="168" cy="44" rx="21" ry="5.2" fill="none" stroke="#d8b45a" stroke-width="1.6"/>',
          '<path d="M168 32 V40" stroke="#d8b45a" stroke-width="1.4"/>',
          '<g fill="#bfe6ff" opacity=".92">',
          '<path d="M150 46 l2.4 4 l-2.4 4.6 l-2.4 -4.6 Z"/>',
          '<path d="M159 48 l2.4 4 l-2.4 4.6 l-2.4 -4.6 Z"/>',
          '<path d="M168 49 l2.4 4 l-2.4 4.6 l-2.4 -4.6 Z"/>',
          '<path d="M177 48 l2.4 4 l-2.4 4.6 l-2.4 -4.6 Z"/>',
          '<path d="M186 46 l2.4 4 l-2.4 4.6 l-2.4 -4.6 Z"/>',
          '</g>',
          '</g>',
          '<g id="signG" display="none">',
          '<rect x="190" y="10" width="38" height="18" rx="2.4" fill="#241d14" stroke="#d8b45a" stroke-width="1.5"/>',
          '<rect x="193" y="13" width="32" height="12" rx="1.4" fill="none" stroke="#8a6a28" stroke-width=".7" opacity=".8"/>',
          '<path d="M201 22 a4.2 4.2 0 1 0 3.6 -4.2 a3.4 3.4 0 1 1 -3.6 4.2 Z" fill="#e6c980"/>',
          '<path d="M212 15.4 l1.1 2.4 l2.5 .3 l-1.9 1.8 l.5 2.5 l-2.2 -1.3 l-2.2 1.3 l.5 -2.5 l-1.9 -1.8 l2.5 -.3 Z" fill="#e6c980" opacity=".9"/>',
          '<path d="M220 16 h4 M220 19.6 h4 M220 23.2 h3" stroke="#8a6a28" stroke-width=".9" opacity=".8"/>',
          '</g>',
          '<g id="portalG" display="none">',
          '<ellipse id="portalGlow" cx="200" cy="80" rx="15" ry="24" fill="#7fe3ff" opacity=".11"/>',
          '<ellipse cx="200" cy="80" rx="10.5" ry="19" fill="#0b2030" stroke="#7fe3ff" stroke-width="1.5"/>',
          '<ellipse cx="200" cy="80" rx="7.2" ry="15" fill="#276b8c" opacity=".92"/>',
          '<ellipse cx="200" cy="80" rx="3.6" ry="9" fill="#a8ecff" opacity=".55"/>',
          '<g fill="#d6f6ff" opacity=".85"><circle cx="195" cy="68" r=".8"/><circle cx="206" cy="73" r=".7"/><circle cx="196" cy="92" r=".7"/><circle cx="205" cy="88" r=".8"/></g>',
          '</g>',

          /* ---- 手臂 ---- */
          '<g id="charArm">',
          '<path id="armFar" d="M260 120 Q268 132 270 140" fill="none" stroke="#2f4a5c" stroke-width="10" stroke-linecap="round"/>',
          '<path id="armNear" d="M216 120 Q208 132 206 140" fill="none" stroke="#2f4a5c" stroke-width="10" stroke-linecap="round"/>',
          '<circle id="handFar" cx="270" cy="140" r="5" fill="#e8b48c"/>',
          '<circle id="handNear" cx="206" cy="140" r="5" fill="#e8b48c"/>',
          /* v0.13.1 擦柜台时攥在近手里的抹布（原点跟着 handNear 走，transform 由 render 写） */
          '<g id="clothG" opacity="0">',
          '<path d="M-8.2 -2.6 q8.4 -2.8 15.6 -.4 l-1.6 6.6 q-7.2 2.6 -13.8 -.4 Z" fill="#cdd6d2"/>',
          '<path d="M-8.2 -2.6 q8.4 -2.8 15.6 -.4" stroke="#f4f8f6" stroke-width="1" fill="none" opacity=".85"/>',
          '<path d="M-3.4 1.8 l6.4 -1.1" stroke="#9aa8a4" stroke-width=".9" opacity=".8"/>',
          '</g>',
          '<g id="propG" opacity="0"></g>',
          '</g>',

          /* ---- 柜台前脸 ---- */
          '<g id="deskFrontG">',
          '<rect x="0" y="151" width="320" height="49" fill="url(#frontG)"/>',
          '<rect x="0" y="151" width="320" height="49" fill="url(#woodP)" opacity=".8"/>',
          '<rect x="0" y="151" width="320" height="2" fill="#3e2414"/>',
          '<g stroke="#4c2f1c" stroke-width="1.4" opacity=".85"><path d="M64 160 V200"/><path d="M190 160 V200"/><path d="M264 160 V200"/></g>',
          '<g fill="none" stroke="#4a2d1a" stroke-width="1.2" opacity=".75">',
          '<rect x="14" y="166" width="42" height="26" rx="2"/><rect x="72" y="166" width="42" height="26" rx="2"/>',
          '<rect x="198" y="166" width="56" height="26" rx="2"/></g>',
          '<g fill="#6b4a32" opacity=".9"><rect x="30" y="178" width="12" height="3" rx="1.5"/><rect x="88" y="178" width="12" height="3" rx="1.5"/><rect x="218" y="178" width="14" height="3" rx="1.5"/></g>',
          /* v0.11：柜台前脸材质三档（1 木板钉的 / 2 台布垂下来 / 3+ 雕花实木）。
             放在 shopCloth 之前 —— 店招布永远压在最上面。 */
          '<g id="cfPlankG" display="none">',
          '<rect x="0" y="151" width="320" height="49" fill="#4a3018"/>',
          '<g stroke="#2a1608" stroke-width="1.2" opacity=".5"><path d="M0 168.5 H320"/><path d="M0 184.5 H320"/></g>',
          '<g stroke="#241408" stroke-width="1.4" opacity=".75"><path d="M46 151 V200"/><path d="M104 151 V200"/>',
          '<path d="M166 151 V200"/><path d="M238 151 V200"/><path d="M296 151 V200"/></g>',
          '<g fill="#3c3c42" opacity=".9"><circle cx="40" cy="155" r="1"/><circle cx="110" cy="155" r="1"/>',
          '<circle cx="172" cy="155" r="1"/><circle cx="244" cy="155" r="1"/><circle cx="302" cy="155" r="1"/></g>',
          '<path d="M104 184 l10 -2 v13 l-10 1 Z" fill="#5e3f26" stroke="#2a1608" stroke-width=".8"/>',
          '<path d="M0 151.6 H320" stroke="#3e2414" stroke-width="2"/>',
          '</g>',
          '<g id="cfClothG" display="none">',
          '<path d="M0 151 H320 V176 Q300 180 280 176 Q260 180 240 176 Q220 180 200 176 Q180 180 160 176 Q140 180 120 176 Q100 180 80 176 Q60 180 40 176 Q20 180 0 176 Z" fill="#a29a84"/>',
          '<g stroke="#948b74" stroke-width="1" opacity=".6" fill="none"><path d="M40 151 V178"/>',
          '<path d="M96 151 V179"/><path d="M152 151 V178"/><path d="M208 151 V179"/><path d="M264 151 V178"/></g>',
          '<path d="M0 172 q40 4 80 0 t80 0 t80 0 t80 0" stroke="#8a6a28" stroke-width="1.2" fill="none" opacity=".7"/>',
          '<path d="M0 176 q20 4 40 0 q20 4 40 0 q20 4 40 0 q20 4 40 0 q20 4 40 0 q20 4 40 0 q20 4 40 0" stroke="#8a8069" stroke-width="1" fill="none" opacity=".45"/>',
          '<rect x="0" y="151" width="320" height="2.4" fill="#3a3026" opacity=".35"/>',
          '<rect x="0" y="153.4" width="320" height="1.2" fill="#e0d8c2" opacity=".45"/>',
          '</g>',
          '<g id="cfCarveG" display="none">',
          '<rect x="0" y="151" width="320" height="49" fill="#4a2b12"/>',
          '<rect x="0" y="151" width="320" height="49" fill="url(#woodP)" opacity=".55"/>',
          '<path d="M0 151.6 H320" stroke="#7a4a20" stroke-width="2"/>',
          '<g fill="none" stroke="#8a5a28" stroke-width="1.2" opacity=".8">',
          '<rect x="14" y="160" width="76" height="31" rx="3"/><rect x="106" y="160" width="58" height="31" rx="3"/>',
          '<rect x="180" y="160" width="58" height="31" rx="3"/><rect x="254" y="160" width="52" height="31" rx="3"/></g>',
          '<g fill="#a3713f" opacity=".6">',
          '<path d="M52 168 q-6 -8 0 -12 q6 4 0 12 Z"/><path d="M52 184 q-6 8 0 12 q6 -4 0 -12 Z"/>',
          '<path d="M30 176 q8 -6 12 0 q-4 6 -12 0 Z"/><path d="M74 176 q-8 -6 -12 0 q4 6 12 0 Z"/>',
          '<path d="M135 176 q8 -6 12 0 q-4 6 -12 0 Z"/><path d="M252 176 q8 -6 12 0 q-4 6 -12 0 Z"/></g>',
          '<g fill="#c9a24a" opacity=".8"><rect x="0" y="151" width="6" height="49"/>',
          '<rect x="314" y="151" width="6" height="49"/></g>',
          '<path d="M0 151.8 H320" stroke="#c08a4a" stroke-width=".8" opacity=".6"/>',
          '</g>',
          /* v0.11 第 4 级专属：柜台包铜 + 铜钉饰 —— 商会铺面得有自己的记号 */
          '<g id="cfGiltG" display="none">',
          '<rect x="0" y="151" width="320" height="3" fill="#c9a24a" opacity=".9"/>',
          '<rect x="0" y="154.2" width="320" height="1" fill="#f4e0ac" opacity=".6"/>',
          '<g fill="#c9a24a" opacity=".92"><rect x="0" y="151" width="11" height="49"/>',
          '<rect x="309" y="151" width="11" height="49"/></g>',
          '<g stroke="#7d5f22" stroke-width=".8" opacity=".5">',
          '<path d="M3.6 155 V200"/><path d="M7.4 155 V200"/><path d="M312.6 155 V200"/><path d="M316.4 155 V200"/></g>',
          '<g fill="#c9a24a" opacity=".85">',
          '<circle cx="32" cy="190" r="4.4"/><circle cx="160" cy="194" r="4.4"/><circle cx="288" cy="190" r="4.4"/></g>',
          '<g fill="#4a2b12" opacity=".85">',
          '<circle cx="32" cy="190" r="1.9"/><circle cx="160" cy="194" r="1.9"/><circle cx="288" cy="190" r="1.9"/></g>',
          '</g>',

          /* 挂在前脸上的店招布*/
          '<g id="shopCloth">',
          '<path d="M124 152 h44 l-4 30 l-18 -7 l-18 7 Z" fill="#3f2f4e"/>',
          '<path d="M124 152 h44 l-4 30 l-18 -7 l-18 7 Z" fill="none" stroke="#2a1f36" stroke-width="1.4"/>',
          '<circle cx="146" cy="166" r="6.4" fill="#e6c980" opacity=".92"/>',
          '<circle cx="143.4" cy="164.6" r="5.6" fill="#3f2f4e"/>',
          '<path d="M154 162 l1.5 3 l3.2 .4 l-2.4 2.2 l.7 3.2 l-3 -1.6 l-3 1.6 l.7 -3.2 l-2.4 -2.2 l3.2 -.4 Z" fill="#e6c980" opacity=".88"/>',
          '</g>',
          '</g>',

          /* ---- v0.8 可购买装饰：实木柜台（台面嵌铜线 + 两端包铜角） / 门口长凳 ---- */
          '<g id="counterInlayG" display="none">',
          '<path d="M0 143.2 H320" stroke="#c9a24a" stroke-width=".8" opacity=".4"/>',
          '<g fill="#c9a24a" opacity=".85">',
          '<path d="M18 145 l3 3 l-3 3 l-3 -3 Z"/><path d="M58 145 l3 3 l-3 3 l-3 -3 Z"/>',
          '<path d="M100 145 l3 3 l-3 3 l-3 -3 Z"/><path d="M232 145 l3 3 l-3 3 l-3 -3 Z"/>',
          '<path d="M300 145 l3 3 l-3 3 l-3 -3 Z"/></g>',
          '<rect x="0" y="149.8" width="320" height="2.6" fill="#7a4f2b"/>',
          '<rect x="0" y="149.8" width="320" height=".9" fill="#c08a4a" opacity=".75"/>',
          '<path d="M0 140 V160 M320 140 V160" stroke="#a3713f" stroke-width="4" opacity=".85"/>',
          '<path d="M0 140 V160 M320 140 V160" stroke="#e0b45c" stroke-width="1.1" opacity=".55"/>',
          '</g>',
          '<g id="stoolG" display="none" transform="translate(-4 0)">',
          '<ellipse cx="302" cy="197" rx="19" ry="2.8" fill="#000" opacity=".28"/>',
          '<rect x="286" y="176" width="34" height="5.4" rx="2" fill="#6b4a2e"/>',
          '<rect x="286" y="176" width="34" height="1.8" rx="1" fill="#8a6338"/>',
          '<path d="M290 181.4 V196 M316 181.4 V196" stroke="#4a301a" stroke-width="3.2"/>',
          '<path d="M290 190 h26" stroke="#4a301a" stroke-width="2.2"/>',
          '<path d="M292 183 h22" stroke="#3a2513" stroke-width="1" opacity=".6"/>',
          '</g>',

          /* ---- v0.11c 节日装饰（彩旗 + 两盏灯笼 + 门口摊布 + 纸屑）----
             画在客人之前，所以客人走进来时是压在摊布前面的；关节日只把 display 切回 none。 */
          '<g id="festG" display="none">',
          festMarkup(),
          '</g>',
          '<g id="festConfG" display="none">',
          festConfMarkup(),
          '</g>',

          /* ---- 客人背影（近景，左下）----
             v0.12：兜帽顶做成帽尖折角（顶点 y≈84，帽口一道斜折线）—— 之前 90.4 的圆顶在 1x 下读不出帽子；
             分离光 custHalo 的 opacity 改由 applyLight 按暗度写（0.30..0.66）；custRim 补齐两侧轮廓；
             merc 的刀身加宽提亮 + 刃口高光，护手金色。
             v0.9：重绘成「背对镜头的兜帽客人」——披肩线 y≈133、下摆到 y=200、
             最宽 102；兜帽 / 收窄的颈 / 外扩的肩 / 微张的下摆 四段轮廓 + 后缝 + 披肩线 + 褶皱 +
             左上柔光，在 tier0/1 的暗柜台前也能一眼看出是个人。
             仍按 kind 叠部件：noble 羽毛帽 + 毛领 / merc 背剑 + 斜挎带 / knight 背圆盾 /
             mage 尖顶帽 + 浮球 / rogue 腰间匕首 / outsider 蓝光轮廓 + 浮尘 */
          '<g id="custG" opacity="0">',
          /* 身后分离光：把剪影从暗背景里提出来（异界客另有蓝光） */
          '<ellipse id="custHalo" cx="58" cy="140" rx="50" ry="58" fill="url(#custHaloG)" opacity=".3"/>',
          '<ellipse id="custAura" cx="64" cy="150" rx="52" ry="58" fill="url(#custGlowG)" opacity="0"/>',
          '<ellipse id="custRing" cx="64" cy="150" rx="44" ry="50" fill="none" stroke="#7fe3ff" stroke-width="1.1" stroke-dasharray="4 7" opacity="0"/>',
          /* 主体：兜帽 → 颈部收窄 → 肩部外扩 → 下摆微张（fill 由 customerLook 按客种写） */
          '<path id="custHood" fill="#2a2230" d="M13 200 C12.2 188 13 176 14.8 167 C16.4 158 18.4 147 20.2 140 C21.4 135.2 23 132.6 26 131.2 C29.2 129.8 32.4 129 35.6 128.6 C38.6 128.2 41 127 42.4 124.6 C43.4 122.8 43.2 120.6 42.8 117.6 C42.4 114 42.6 110 43.4 106.6 C44.6 101.6 46.6 97.4 50 94 C53.6 90.4 57.8 87.4 61.6 85.6 L64 84 L66.4 85.6 C70.2 87.4 74.4 90.4 78 94 C80.4 95.2 83.2 100.6 84.6 106.6 C85.4 110 85.6 114 85.2 117.6 C84.8 120.6 84.6 122.8 85.6 124.6 C87 127 89.4 128.2 92.4 128.6 C95.6 129 98.8 129.8 102 131.2 C105 132.6 106.6 135.2 107.8 140 C109.6 147 111.6 158 113.2 167 C115 176 115.8 188 115 200 Z"/>',
          /* 右半身压暗：给斗篷一点体积，别是一片平色 */
          '<path fill="#000" opacity=".15" d="M64 84 L66.4 85.6 C70.2 87.4 74.4 90.4 78 94 C80.4 95.2 83.2 100.6 84.6 106.6 C85.4 110 85.6 114 85.2 117.6 C84.8 120.6 84.6 122.8 85.6 124.6 C87 127 89.4 128.2 92.4 128.6 C95.6 129 98.8 129.8 102 131.2 C105 132.6 106.6 135.2 107.8 140 C109.6 147 111.6 158 113.2 167 C115 176 115.8 188 115 200 L82 200 C80 178 76 152 72 132 C69 118 66 102 64 84 Z"/>',
          /* 兜帽后缝 + 披肩线：兜帽与肩膀之间要看出结构，不能连成一条弧 */
          '<path d="M64 86 v31" fill="none" stroke="#0c0812" stroke-width="1.3" opacity=".22"/>',
          /* 帽口折线：从左颈口斜切到帽尖下方 —— 兜帽要有「开口」的折角，不然只是一圈圆顶 */
          '<path d="M44 112 L64 96" fill="none" stroke="#0c0812" stroke-width="1.8" stroke-linecap="round" opacity=".4"/>',
          '<path d="M45.4 110.2 L63.2 97.4" fill="none" stroke="#c8bfe0" stroke-width="1.2" stroke-linecap="round" opacity=".3"/>',
          '<path d="M84 112 L67.4 96.8" fill="none" stroke="#0c0812" stroke-width="1.3" stroke-linecap="round" opacity=".16"/>',
          '<path d="M28 133 Q64 148 100 133" fill="none" stroke="#0c0812" stroke-width="1.9" opacity=".3"/>',
          '<path d="M30 132.2 Q64 146.4 98 132.2" fill="none" stroke="#c8bfe0" stroke-width=".8" opacity=".16"/>',
          /* 兜帽压肩的暗部：一条透镜形的阴影，把头从身子上分出来 */
          '<path d="M42.6 122 Q64 131.5 85.4 122 Q80 135.5 64 135.5 Q48 135.5 42.6 122 Z" fill="#000" opacity=".2"/>',
          /* 兜帽左上受光：一小片高光，别让头顶是死平色 */
          '<path d="M47.4 104.6 Q49.6 94.6 58.4 88.4" fill="none" stroke="#fff" stroke-width="4.2" stroke-linecap="round" opacity=".12" filter="url(#custSoftF)"/>',
          /* 帽尖的硬边高光：1x 下靠这道细亮线把折角读出来 */
          '<path d="M51 94.6 Q54.4 89.8 62.2 85.2" fill="none" stroke="#e8e0f4" stroke-width="1.5" stroke-linecap="round" opacity=".4"/>',
          /* 斗篷褶皱：中间一道暗、两侧各一道，读成布而不是筒 */
          '<path d="M56 124 C52 146 50 172 49 200" fill="none" stroke="#000" stroke-width="2.4" opacity=".15"/>',
          '<path d="M72 124 C76 148 78 172 79 200" fill="none" stroke="#fff" stroke-width="1.8" opacity=".05"/>',
          '<path d="M40 129 C36 152 34 176 33 200" fill="none" stroke="#fff" stroke-width="1.2" opacity=".06"/>',
          '<path d="M88 129 C92 152 94 176 95 200" fill="none" stroke="#000" stroke-width="2" opacity=".11"/>',
          /* 左上柔光：外圈糊边 + 内圈实边（custRim 的色仍按客种写） */
          '<path id="custRimSoft" fill="none" stroke="#efe6ff" stroke-width="9" stroke-linecap="round" opacity=".26" filter="url(#custSoftF)" d="M13 200 C12.2 188 13 176 14.8 167 C16.4 158 18.4 147 20.2 140 C21.4 135.2 23 132.6 26 131.2 C29.2 129.8 32.4 129 35.6 128.6 C38.6 128.2 41 127 42.4 124.6 C43.4 122.8 43.2 120.6 42.8 117.6 C42.4 114 42.6 110 43.4 106.6 C44.6 101.6 46.6 97.4 50 94 C53.6 90.4 57.8 87.4 61.6 85.6 L64 84"/>',
          /* v0.12：两侧都勾 —— 只勾左边+头顶时，右肩在暗背景里还是糊的 */
          '<path id="custRim" fill="none" stroke="#9a8fb2" stroke-width="2" opacity=".58" d="M13 200 C12.2 188 13 176 14.8 167 C16.4 158 18.4 147 20.2 140 C21.4 135.2 23 132.6 26 131.2 C29.2 129.8 32.4 129 35.6 128.6 C38.6 128.2 41 127 42.4 124.6 C43.4 122.8 43.2 120.6 42.8 117.6 C42.4 114 42.6 110 43.4 106.6 C44.6 101.6 46.6 97.4 50 94 C53.6 90.4 57.8 87.4 61.6 85.6 L64 84 L66.4 85.6 C70.2 87.4 74.4 90.4 78 94 C80.4 95.2 83.2 100.6 84.6 106.6 C85.4 110 85.6 114 85.2 117.6 C84.8 120.6 84.6 122.8 85.6 124.6 C87 127 89.4 128.2 92.4 128.6 C95.6 129 98.8 129.8 102 131.2 C105 132.6 106.6 135.2 107.8 140 C109.6 147 111.6 158 113.2 167 C115 176 115.8 188 115 200"/>',
          /* 异界客专属：轮廓外再罩一层宽蓝光（默认熄灭） */
          '<path id="custRimGlow" fill="none" stroke="#7fe3ff" stroke-width="6.5" stroke-linecap="round" opacity="0" d="M13 200 C12.2 188 13 176 14.8 167 C16.4 158 18.4 147 20.2 140 C21.4 135.2 23 132.6 26 131.2 C29.2 129.8 32.4 129 35.6 128.6 C38.6 128.2 41 127 42.4 124.6 C43.4 122.8 43.2 120.6 42.8 117.6 C42.4 114 42.6 110 43.4 106.6 C44.6 101.6 46.6 97.4 50 94 C53.6 90.4 57.8 87.4 61.6 85.6 L64 84 L66.4 85.6 C70.2 87.4 74.4 90.4 78 94 C80.4 95.2 83.2 100.6 84.6 106.6 C85.4 110 85.6 114 85.2 117.6"/>',
          /* v0.13.1 村民：右胯挂一只草筐（这一组以前缺，村民一直只有斗篷） */
          '<g id="custVillagerG" display="none">',
          '<path d="M96 152 q12 -3 18 3 l-3 20 q-9 5 -15 0 Z" fill="#a9863f" stroke="#6b4f22" stroke-width="1"/>',
          '<path d="M96 152 q12 -3 18 3" fill="none" stroke="#e0c07a" stroke-width="1.2" opacity=".9"/>',
          '<g stroke="#7d5f28" stroke-width=".8" opacity=".85"><path d="M97 158 q8 -1.6 16 1"/>',
          '<path d="M96.4 164 q9 -1.6 17 1"/><path d="M96 170 q9 -1.4 16 1"/></g>',
          '<path d="M104 150 q6 -8 12 -1" fill="none" stroke="#8a6a34" stroke-width="1.6"/>',
          '<path d="M99 148 q6 -3 11 2" fill="none" stroke="#c9a24a" stroke-width="1.1" opacity=".8"/>',
          '</g>',
          '<g id="custNobleG" display="none">',
          /* 毛领：贴着披肩线，别飘在肩下 */
          '<path d="M36 131 q7 -8 16 -3 M92 131 q-7 -8 -16 -3" stroke="#c9b98a" stroke-width="1.7" fill="none" opacity=".8"/>',
          /* 帽：帽檐压在兜帽顶上 */
          '<ellipse cx="64" cy="103" rx="25" ry="5.2" fill="#241a2b" stroke="#c9b98a" stroke-width="1"/>',
          '<path d="M44 102 Q52 83 64 80.5 Q76 83 84 102 Z" fill="#2a2030" stroke="#c9b98a" stroke-width=".9"/>',
          '<path d="M45 99.5 q19 6 38 0" stroke="#c9a24a" stroke-width="2" fill="none"/>',
          /* 羽毛：从帽檐右上斜出去 */
          '<path d="M79 92 Q90 74 101 64 L93 73 L96 71 L87 81 L89 79 L76 90 Z" fill="#e8dcc0" opacity=".95"/>',
          '<path d="M76 90 Q88 74 100 65" stroke="#f6efdb" stroke-width=".7" fill="none" opacity=".9"/>',
          '<path d="M77 90 q3 3 7 1" stroke="#c9a24a" stroke-width="1.3" fill="none"/>',
          /* 手杖：右手边一支带金球头的手杖，杖尾点在下摆边（不越出 102 宽的下摆） */
          '<path d="M104 146 L114 194" stroke="#3a2a1c" stroke-width="3.4" stroke-linecap="round"/>',
          '<path d="M104.6 147.6 L112.6 188" stroke="#6b4a32" stroke-width="1.2" opacity=".8"/>',
          '<circle cx="103.4" cy="145.4" r="4.4" fill="#c9a24a" stroke="#8a6a28" stroke-width=".8"/>',
          '<path d="M103.4 145.4 q-3.6 -2.2 -6.6 -1.4" fill="none" stroke="#e6c980" stroke-width="1.6"/>',
          '<path d="M113.6 191 l1.6 5.4" stroke="#c9b98a" stroke-width="2.6"/>',
          '</g>',
          '<g id="custMercG" display="none">',
          /* 斜挎皮带（在剑鞘底下），比剑鞘细一档，别跟剑抢注意力 */
          '<path d="M40 131 Q68 160 98 184" stroke="#55391c" stroke-width="3.6" fill="none" opacity=".85"/>',
          '<path d="M41 130 Q68 159 97 182" stroke="#8a6a34" stroke-width="1" fill="none" opacity=".5"/>',
          /* 剑鞘：从左下角斜到右肩 */
          '<path d="M27 200 L86 132" stroke="#22262d" stroke-width="10" stroke-linecap="round"/>',
          /* v0.12：刀身加宽到 3.4px 并提高亮度，再补一段更亮的刃口高光 —— 1x 下也能看出是把剑 */
          '<path d="M28.6 197.6 L84.6 133" stroke="#c6cfdd" stroke-width="3.4" stroke-linecap="round" opacity=".9"/>',
          '<path d="M68 152 L84.4 133.4" stroke="#f2f6fb" stroke-width="2.2" stroke-linecap="round" opacity=".95"/>',
          '<circle cx="27" cy="200" r="2.8" fill="#c9a24a"/>',
          '<path d="M76 123 L94 139" stroke="#c9a24a" stroke-width="3.8" stroke-linecap="round"/>',
          /* 握柄 + 缠绳 + 剑首 */
          '<path d="M86 132 L99 116" stroke="#4a3418" stroke-width="4.6" stroke-linecap="round"/>',
          '<path d="M89 129 l4 -4 M92 126 l4 -4" stroke="#8a6a28" stroke-width="1.1" opacity=".95"/>',
          '<circle cx="101" cy="114" r="3" fill="#c9a24a"/>',
          '<path d="M38 131 q6 -6 14 -4" stroke="#9aa7bb" stroke-width="1.4" fill="none" opacity=".5"/>',
          /* 刀鞘：挂在左腰，和背上的剑分开 —— 皮鞘身 + 两道铜箍，整体收在轮廓里（别飘到斗篷外） */
          '<path d="M34 147 L26.4 183" stroke="#3a2a1c" stroke-width="8" stroke-linecap="round"/>',
          '<path d="M33.4 149 L27 180" stroke="#6b4a32" stroke-width="3" opacity=".95"/>',
          '<path d="M35 150 l-4 1.4" stroke="#c9a24a" stroke-width="3"/>',
          '<path d="M29.5 171 l-3.4 1" stroke="#c9a24a" stroke-width="2.4"/>',
          '<path d="M24.6 186 l-1.2 4.6" stroke="#8a6a28" stroke-width="2.6"/>',
          '<path d="M36 143.6 q6.4 -4 10.4 -1" fill="none" stroke="#55391c" stroke-width="2.6"/>',
          '</g>',
          '<g id="custKnightG" display="none">',
          /* 背圆盾：压在上背，下缘到腰 */
          '<path d="M43 136 q21 -5 42 0 v14 q0 15 -21 22 q-21 -7 -21 -22 Z" fill="#3f4654" stroke="#b6c0ce" stroke-width="1.3"/>',
          '<path d="M43 145 h42 M64 136 v30" stroke="#8b96a6" stroke-width="1" opacity=".85"/>',
          '<circle cx="64" cy="151" r="5" fill="#59616f" stroke="#b6c0ce" stroke-width=".9"/>',
          '<path d="M38 132 q6 -7 13 -3 M90 132 q-6 -7 -13 -3" stroke="#b6c0ce" stroke-width="1.5" fill="none" opacity=".55"/>',
          '</g>',
          '<g id="custMageG" display="none">',
          /* 浮球（右上，离帽尖远一点才不粘在一起） */
          '<circle cx="97" cy="101" r="9" fill="url(#custGlowG)" opacity=".7"/>',
          '<circle cx="97" cy="101" r="4.6" fill="#a8e0ff" opacity=".85"/>',
          '<path d="M97 97.6 v6.8 M93.6 101 h6.8" stroke="#dff6ff" stroke-width=".6" opacity=".8"/>',
          /* 尖顶帽：帽檐压在兜帽顶上，帽尖略弯 */
          '<ellipse cx="64" cy="106" rx="22" ry="4.4" fill="#322a45" stroke="#9d8fd0" stroke-width=".9"/>',
          '<path d="M45 105 Q53 82 60 72 Q61 70 64 71 Q74 82 82 105 Z" fill="#322a45" stroke="#b9a9e6" stroke-width=".9"/>',
          '<path d="M49 101 q15 5 30 0" stroke="#c9a24a" stroke-width="1.8" fill="none"/>',
          '<path d="M62 76.5 l1 2 l2.2 .3 l-1.6 1.6 l.4 2.2 l-2 -1.1 l-2 1.1 l.4 -2.2 l-1.6 -1.6 l2.2 -.3 Z" fill="#e6c980" opacity=".9"/>',
          /* 卷轴筒：左腰斜插，两端铜盖，筒身一道露出纸边的高光 */
          '<path d="M24 154 L40 184" stroke="#4a3a26" stroke-width="8.4" stroke-linecap="round"/>',
          '<path d="M24.4 155 L38 181" stroke="#8c6f45" stroke-width="4" opacity=".95"/>',
          '<circle cx="24" cy="154" r="4.6" fill="#c9a24a" stroke="#6b4f22" stroke-width=".7"/>',
          '<circle cx="40" cy="184" r="4.6" fill="#c9a24a" stroke="#6b4f22" stroke-width=".7"/>',
          '<path d="M28 160 l7 12" stroke="#e6dcc0" stroke-width="1" opacity=".55"/>',
          '<path d="M22 150 q4 -3 7 0" fill="none" stroke="#8a6a34" stroke-width="1.4"/>',
          '</g>',
          '<g id="custRogueG" display="none">',
          /* 腰间匕首：挂在右胯（腰线 y≈152）。v0.12 把刀身拉长 6px、加宽并补刃口高光，1x 下也能读出“腰侧有把刀” */
          '<path d="M80 172 l22 -11" stroke="#b9c5d3" stroke-width="3" stroke-linecap="round"/>',
          '<path d="M86 169 l16.5 -8.2" stroke="#fff" stroke-width="1.1" stroke-linecap="round" opacity=".7"/>',
          '<path d="M77 172 l6 1" stroke="#c9a24a" stroke-width="3" stroke-linecap="round"/>',
          '<path d="M74 174 q4 -2 8 0" stroke="#6b4a32" stroke-width="1.8" fill="none"/>',
          '<circle cx="72.5" cy="175" r="1.7" fill="#c9a24a"/>',
          '<path d="M46 152 q8 -5 15 -2" stroke="#a89bb0" stroke-width="1.4" fill="none" opacity=".6"/>',
          /* 小包：左腰一只翻盖皮袋（右腰已经有匕首，别挤在一侧），铜扣 + 背带 */
          '<path d="M25 157 q10 -4.4 18 .2 l-2 15.4 q-7 4 -13.6 .2 Z" fill="#4a3a2a" stroke="#241a12" stroke-width="1"/>',
          '<path d="M25 157 q10 -4.4 18 .2 l-1.2 5.6 q-8 3.4 -15.6 .2 Z" fill="#634c34"/>',
          '<path d="M25.4 157 q10 -4.4 17.6 .2" fill="none" stroke="#a08658" stroke-width="1" opacity=".85"/>',
          '<circle cx="34" cy="166" r="1.9" fill="#c9a24a"/>',
          '<path d="M30 152 q3 3 4 6" fill="none" stroke="#2a1e14" stroke-width="2"/>',
          '</g>',
          '<g id="custOutsiderG" display="none">',
          '<path d="M32 127 q32 -12 64 0" stroke="#7fe3ff" stroke-width="1.4" fill="none" opacity=".8"/>',
          '<path d="M24 150 q8 -6 16 -4 M104 164 q-8 6 -16 3" stroke="#a8ecff" stroke-width="1" fill="none" opacity=".55"/>',
          '<g fill="#a8ecff"><circle cx="22" cy="152" r="1.2" opacity=".8"/><circle cx="106" cy="134" r="1" opacity=".7"/>',
          '<circle cx="18" cy="178" r=".9" opacity=".6"/><circle cx="110" cy="170" r="1.3" opacity=".75"/>',
          '<circle cx="30" cy="108" r=".8" opacity=".6"/></g>',
          /* 浮空灯：无提手的小灯悬在左肩外侧，冷青的芯 + 一圈薄光（浮着，所以不贴身子） */
          '<circle cx="19" cy="106" r="14" fill="url(#custGlowG)" opacity=".5"/>',
          '<path d="M13.6 100.6 h10.8 v10.4 h-10.8 Z" fill="#10263a" stroke="#7fe3ff" stroke-width="1.2"/>',
          '<path d="M15.4 102.4 h7.2 v7 h-7.2 Z" fill="#a8ecff" opacity=".9"/>',
          '<path d="M19 100.6 v-4.2" stroke="#7fe3ff" stroke-width="1"/>',
          '<circle cx="19" cy="95" r="1.6" fill="#d6f6ff" opacity=".9"/>',
          '<path d="M13.6 105 h-3.2 M24.4 105 h3.2" stroke="#7fe3ff" stroke-width=".9" opacity=".7"/>',
          '</g>',
          /* 领口：贴着兜帽下沿 */
          '<path id="custCollar" d="M42 126 q22 -10 44 0" fill="none" stroke="#413852" stroke-width="2.6" opacity=".9"/>',
          /* 地面投影：跟着新体型放宽，别露在脚外 */
          '<ellipse cx="64" cy="199" rx="56" ry="10" fill="#120e18" opacity=".42"/>',
          '</g>',

          /* ---- 氛围 ---- */
          '<g id="motes" opacity=".5"></g>',
          '<g id="coinFx" opacity="0">',
          '<path d="M250 112 l2.6 3.2 l3.6 -1.4 l-1 4 l3.2 2.2 l-3.6 1.4 l.2 3.8 l-3.4 -1.8 l-2.8 2.6 l-.4 -3.8 l-3.6 -1.2 l3 -2.4 Z" fill="#ffe3a0"/>',
          '<circle cx="262" cy="106" r="1.4" fill="#ffe3a0"/><circle cx="243" cy="120" r="1.1" fill="#ffe3a0"/>',
          '</g>',
          '<g id="zzz" opacity="0">',
          '<path d="M204 64 h9.4 l-9.4 8.4 h9.4" stroke="#cfd8e4" stroke-width="1.7" fill="none" stroke-linejoin="round"/>',
          '<path d="M190 46 h7.4 l-7.4 6.6 h7.4" stroke="#cfd8e4" stroke-width="1.4" fill="none" stroke-linejoin="round" opacity=".8"/>',
          '<path d="M178 32 h5.4 l-5.4 4.8 h5.4" stroke="#cfd8e4" stroke-width="1.2" fill="none" stroke-linejoin="round" opacity=".5"/>',
          '</g>',
          /* ---- v0.11c 天气 + 升级过场 ----
             ＊ 雪天那层「地上的淡白」画在五档地面之后、柜台之前（见 floorMarbleG 下方），
               所以它只铺在地面上，不会把柜台和店主一起洗白；
             ＊ wxDim 是「天色压暗」的整幅压暗层，雨天/阴天各给一个 fill-opacity；
             ＊ wxSnowVeil 是雪天专用的冷白薄雾，没有它雪只会是几个白点、屋里一点也不冷；
             ＊ v0.12.3：这两层原来用 SVG 混合模式（multiply/screen），每次场景重绘都要多做一次
               全幅混合，是雨天掉帧的主因；现在改成普通半透明填充（暗色/亮色直接写进 fill），
               观感几乎不变，但合成退回最快的那条路径。pointer-events:none 免得挡住点击；
             ＊ wxRainG / wxSnowG 是预建的 26 条雨丝、26 个雪点（v0.12 加密，原来 16/14 太稀），位置每帧改一次 transform；
             ＊ instG 是升级过场的光晕 + 扫光，平时 display:none。 */
          '<rect id="wxDim" width="320" height="200" fill="#0e1e2c" fill-opacity="0" pointer-events="none"/>',
          '<rect id="wxSnowVeil" width="320" height="200" fill="#eef6ff" fill-opacity="0" pointer-events="none"/>',
          '<g id="wxRainG" display="none">',
          wxRainMarkup(),
          '</g>',
          '<g id="wxSnowG" display="none">',
          wxSnowMarkup(),
          '</g>',
          '<g id="instG" display="none">',
          '<ellipse id="instBloom" cx="160" cy="118" rx="150" ry="92" fill="url(#instBloomG)" opacity="0"/>',
          '<rect id="instSweep" x="-120" y="0" width="120" height="200" fill="url(#instSweepG)" opacity="0"/>',
          '</g>',
          /* v0.11 色温：一整块半透明色压在画面上，applyLight 只写 fill / fill-opacity —— 不新建节点。
             v0.12.3：同样去掉了 SVG 混合模式（原来用 multiply）。普通 alpha 混合会把画面往色相方向
             拉亮，所以 applyLight 写进去的是「把色温色压暗 60% 混合黑」之后的版本，叠出来的明暗
             关系与原来基本一致，还省掉一次全幅混合。 */
          '<rect id="moodTint" width="320" height="200" fill="#3d2415" fill-opacity="0" pointer-events="none"/>',
          '<rect id="vig" width="320" height="200" fill="url(#vigG)"/>'
        ].join('');

        /* ---------------- 货品图形（底边贴在货架板上）---------------- */
        function goodsMarkup() {
          return [
            /* 第一层 y=40 */
            '<g id="g-potion"><path d="M27 26 h5 v5 l4 6 v2.4 H23 v-2.4 l4 -6 Z" fill="#7fd3b0"/>',
            '<rect x="27.4" y="22" width="4.2" height="4" rx="1" fill="#6b4a32"/>',
            '<path d="M25.5 34.6 h7" stroke="#fff" stroke-width="1" opacity=".35"/></g>',
            '<g id="g-mana"><path d="M49 27 h5 v5 l4 5.6 v2 H45 v-2 l4 -5.6 Z" fill="#8fa8ea"/>',
            '<rect x="49.4" y="23" width="4.2" height="4" rx="1" fill="#6b4a32"/>',
            '<circle cx="51.6" cy="33.4" r="1.1" fill="#dfe8ff" opacity=".85"/></g>',
            '<g id="g-scroll"><rect x="76" y="26" width="4" height="14" rx="2" fill="#e6dcc2"/>',
            '<rect x="83" y="26" width="4" height="14" rx="2" fill="#e6dcc2"/>',
            '<rect x="80" y="27" width="3" height="12" fill="#d2c6a8"/>',
            '<path d="M76 27 h11" stroke="#b3a68d" stroke-width="1.4"/></g>',
            /* 第二层 y=66 */
            /* 第二层 y=66：银匕首画成一把立在货架板上的「铁剑」（剑尖抵板、柄朝上），
               配色和墙上那把挂剑同一套；宽护手让它在小窗里也一眼看出是把剑 */
            '<g id="g-dagger">',
            '<path d="M31.5 56.6 H35.9 V61.4 L33.7 66 L31.5 61.4 Z" fill="#c6d0dc"/>',
            '<path d="M33.7 57.6 V64.2" stroke="#93a0b2" stroke-width=".9" opacity=".8"/>',
            '<path d="M32.1 57.8 V60.8" stroke="#fff" stroke-width=".6" opacity=".45"/>',
            '<rect x="27.9" y="54" width="11.6" height="2.4" rx="1.2" fill="#8a6a28"/>',
            '<path d="M28.4 55.2 h10.6" stroke="#c9a24a" stroke-width=".7" opacity=".5"/>',
            '<rect x="32.4" y="48.6" width="2.6" height="5.6" rx="1.3" fill="#4a3418"/>',
            '<path d="M32.7 50.2 h2 M32.7 52.2 h2" stroke="#6b4a32" stroke-width=".7"/>',
            '<circle cx="33.7" cy="47.4" r="1.9" fill="#c9a24a"/></g>',
            '<g id="g-wand"><path d="M55 66 V48" stroke="#6b4a32" stroke-width="2.6" stroke-linecap="round"/>',
            '<circle cx="55" cy="46" r="3.6" fill="#a8e0ff"/>',
            '<path d="M51.6 44 q3.4 -4.4 6.8 0" stroke="#8a6a28" stroke-width="1.2" fill="none"/></g>',
            '<g id="g-orb"><circle cx="90" cy="60" r="6.4" fill="#b6c6f0" opacity=".85"/>',
            '<circle cx="88.2" cy="58" r="2" fill="#fff" opacity=".6"/>',
            '<path d="M84 66 h12 l-2.4 3 h-7.2 Z" fill="#5a3a20"/></g>',
            /* 第三层 y=92 */
            '<g id="g-shield"><path d="M31 71 q9 -3 15 0 v9 q0 8 -7.5 12 q-7.5 -4 -7.5 -12 Z" fill="#8a6b4a"/>',
            '<path d="M31 77 h15" stroke="#5a3a20" stroke-width="1.2"/><circle cx="38.5" cy="75" r="1.6" fill="#e6c980"/></g>',
            '<g id="g-helm"><path d="M60 91 q0 -13 7 -13 q7 0 7 13 q-3 2.4 -7 2.4 q-4 0 -7 -2.4 Z" fill="#9aa6b4"/>',
            '<rect x="63" y="82" width="8" height="2.4" rx="1.2" fill="#5a3a20"/>',
            '<path d="M67 78 V73" stroke="#7a5a34" stroke-width="2"/><circle cx="67" cy="73" r="1.8" fill="#c9a24a"/></g>',
            '<g id="g-tome"><rect x="86" y="82" width="15" height="11" rx="1.6" fill="#7a3b4a"/>',
            '<rect x="88.4" y="84.4" width="10" height="6" fill="#e8dfcb" opacity=".85"/>',
            '<path d="M86 82 h15" stroke="#4a2230" stroke-width="1.6"/></g>',
            /* 第四层 y=118（买下 shelf4 才上架）*/
            '<g id="g-rune"><path d="M30 106 l8 -6.4 l8 6.4 v5.6 l-8 6.4 l-8 -6.4 Z" fill="#7c8aa0"/>',
            '<path d="M33.6 107.4 l8.8 6.8 M42.4 107.4 l-8.8 6.8" stroke="#3c4756" stroke-width="1.2"/>',
            '<path d="M38 104 v14" stroke="#aebccd" stroke-width=".9" opacity=".55"/></g>',
            '<g id="g-star"><rect x="57" y="106.6" width="9" height="11.4" rx="2.4" fill="#9ec8e8" opacity=".6"/>',
            '<rect x="57.4" y="103.6" width="8.2" height="3.4" rx="1.6" fill="#6b4a32"/>',
            '<circle cx="61.6" cy="109.6" r="1.2" fill="#fff" opacity=".95"/>',
            '<circle cx="64" cy="114" r=".7" fill="#fff" opacity=".7"/>',
            '<circle cx="59.4" cy="113" r=".6" fill="#fff" opacity=".6"/></g>',
            '<g id="g-scale"><path d="M84 118 q0 -12.4 7 -12.4 q7 0 7 12.4 Z" fill="#5f7d6a"/>',
            '<path d="M84.4 118 q3 -6.4 6.6 -6.4 q3.6 0 6.6 6.4" stroke="#8fae99" stroke-width="1.1" fill="none"/>',
            '<path d="M87.6 111 q3.4 -2.6 6.8 0" stroke="#9dbba6" stroke-width=".9" fill="none"/></g>'
          ].join('');
        }

        /* ---------------- v0.11c 天气 / 节日 / 过场的图形 ----------------
         * 这三组图形都是「一次性拼进 MARKUP」的固定节点：天气切换、节日开关、升级过场
         * 只改 display / transform / opacity，不新建也不删除 DOM —— 所以来回切不会卡，
         * 也不会残留上一档的节点。数量是常量：雨丝 16、雪点 14、纸屑 8。
         * 随机数用 wxRand(i) 这种「索引 → 0..1」的确定性函数，保证每次建出来的位置一样
         * （截图可复现），不依赖 Math.random。 */
        function wxRand(i) {
          var s = Math.sin(i * 12.9898 + 4.1414) * 43758.5453;
          return s - Math.floor(s);
        }

        /* 雨丝：一小段斜线，位置由 createScene 里的同一条公式写 transform */
        function wxRainMarkup() {
          var out = [], i, x, y, op;
          for (i = 0; i < 26; i++) {
            x = (wxRand(i) * 320).toFixed(1);
            y = (wxRand(i + 40) * 212).toFixed(1);
            op = (0.34 + wxRand(i + 80) * 0.38).toFixed(2);
            out.push('<path d="M0 0 L-2.9 11.5" stroke="#d8ecff" stroke-width="' + (1 + wxRand(i + 55) * 0.45).toFixed(2) +
              '" stroke-linecap="round" opacity="' + op +
              '" transform="translate(' + x + ' ' + y + ')"/>');
          }
          return out.join('');
        }

        /* 雪点：14 个大小不一的圆 */
        function wxSnowMarkup() {
          var out = [], i, x, y, r, op;
          for (i = 0; i < 26; i++) {
            x = (wxRand(i + 7) * 320).toFixed(1);
            y = (wxRand(i + 61) * 210).toFixed(1);
            r = (0.9 + wxRand(i + 21) * 1.3).toFixed(2);
            op = (0.62 + wxRand(i + 99) * 0.36).toFixed(2);
            out.push('<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="#f4faff" opacity="' + op + '"/>');
          }
          return out.join('');
        }

        /* 节日：彩旗（一条下垂的绳 + 11 面三角旗）/ 两盏灯笼 / 柜台左端的红摊布 */
        function festMarkup() {
          var out = [], i, x, y, col, c;
          out.push('<path d="M-4 30 Q80 38 160 33 T324 31" fill="none" stroke="#6b4a32" stroke-width="1.3"/>');
          out.push('<path d="M-4 30 Q80 38 160 33 T324 31" fill="none" stroke="#a3713f" stroke-width=".6" opacity=".6"/>');
          for (i = 0; i < 11; i++) {
            x = i * 30 + 4;
            y = 30.6 + Math.sin(i * 0.62 + 0.4) * 3.4;
            col = ['#c2504a', '#d8a33c', '#4a7ba8'][i % 3];
            out.push('<path d="M' + x.toFixed(1) + ' ' + y.toFixed(1) + ' l12 0 l-6 10.4 Z" fill="' + col +
              '" opacity=".9"/>');
            out.push('<path d="M' + (x + 1).toFixed(1) + ' ' + (y + 0.9).toFixed(1) + ' l10 0 l-5 8.6 Z" fill="#fff" opacity=".14"/>');
          }
          /* 两盏灯笼：吊绳 + 暖光 + 灯身 + 金饰 + 穗子（挂在货架与窗之间的空墙上，别挡货） */
          out.push(lanternMarkup(116, 21), lanternMarkup(202, 25));
          /* 门口摆摊布：盖在柜台左端，红底 + 暗纹 + 金边 */
          out.push('<path d="M0 139 H62 L58 176 q-4 6 -10 0 L6 172 q-4 6 -6 0 Z" fill="#b4433e"/>');
          out.push('<path d="M0 139 H62 L61 148 H0 Z" fill="#cf5a52" opacity=".85"/>');
          c = 0;
          while (c < 6) {
            out.push('<path d="M' + (6 + c * 9) + ' 141 V' + (168 + (c % 2) * 4) + '" stroke="#8d2f2c" stroke-width="1.6" opacity=".55"/>');
            c++;
          }
          out.push('<path d="M2 140 H60" stroke="#e8c37a" stroke-width="1.4" opacity=".85"/>');
          out.push('<path d="M6 172 q4 6 10 0 M46 170 q4 6 10 0" fill="none" stroke="#e8c37a" stroke-width="1" opacity=".5"/>');
          return out.join('');
        }

        function lanternMarkup(x, top) {
          var s = [], y = top + 12;
          s.push('<path d="M' + x + ' ' + top + ' V' + y + '" stroke="#5a3a20" stroke-width="1"/>');
          s.push('<ellipse cx="' + x + '" cy="' + (y + 9) + '" rx="17" ry="15" fill="url(#festGlowG)" opacity=".85"/>');
          s.push('<path d="M' + (x - 3) + ' ' + y + ' h6" stroke="#8a6a28" stroke-width="2"/>');
          s.push('<ellipse cx="' + x + '" cy="' + (y + 9) + '" rx="7.4" ry="8.6" fill="#c8503f"/>');
          s.push('<ellipse cx="' + x + '" cy="' + (y + 9) + '" rx="7.4" ry="8.6" fill="url(#festGlowG)" opacity=".45"/>');
          s.push('<path d="M' + (x - 5.4) + ' ' + (y + 4) + ' q5.4 4 10.8 0" fill="none" stroke="#8d2f2c" stroke-width="1" opacity=".7"/>');
          s.push('<rect x="' + (x - 3.6) + '" y="' + (y + 16) + '" width="7.2" height="2.6" rx="1" fill="#8a6a28"/>');
          s.push('<path d="M' + x + ' ' + (y + 18.6) + ' v4.4" stroke="#e8c37a" stroke-width="1.4"/>');
          s.push('<path d="M' + (x - 1.6) + ' ' + (y + 23) + ' h3.2" stroke="#e8c37a" stroke-width="1"/>');
          return s.join('');
        }

        /* 节日纸屑：8 小片，慢速下落 + 左右飘 */
        function festConfMarkup() {
          var out = [], i, x, y, col;
          for (i = 0; i < 8; i++) {
            x = (wxRand(i + 3) * 300 + 10).toFixed(1);
            y = (wxRand(i + 33) * 190 + 8).toFixed(1);
            col = ['#e8c37a', '#c2504a', '#7fb0d8', '#e0e0d0'][i % 4];
            out.push('<rect x="0" y="0" width="2.6" height="1.7" fill="' + col + '" opacity=".85" transform="translate(' +
              x + ' ' + y + ')"/>');
          }
          return out.join('');
        }

        /* ---------------- 光照关键帧 ---------------- */
        /* sun = 从右窗斜射进来的日光强度；lamp = 吊灯亮度
         * v0.11 加三个色温字段（都按整点插值）：
         *   tint/to = 压在整个画面上的情绪色与不透明度（清晨冷蓝 / 正午暖白 / 黄昏橙红 / 夜里烛光）
         *   sc      = 照进窗口的那束日光本身的颜色（傍晚偏橙、清晨偏冷） */
        var LIGHT = [
          { h: 0, a: '#141d33', b: '#202a45', wa: '#1e222a', wb: '#282d36', lamp: 1, moon: 1, city: 1, sun: 0,
            tint: '#ffb066', to: .2, sc: '#ffd0a0' },
          { h: 5, a: '#18223b', b: '#26314f', wa: '#1f242c', wb: '#2a2f38', lamp: 1, moon: .9, city: .9, sun: 0,
            tint: '#ffac63', to: .18, sc: '#ffe0c0' },
          { h: 6.6, a: '#6d7fa0', b: '#c6b39a', wa: '#3a3f48', wb: '#4c525c', lamp: .35, moon: 0, city: .18, sun: .3,
            tint: '#8fb0e0', to: .2, sc: '#cfe2ff' },
          { h: 8.5, a: '#8fb6d8', b: '#cfe0e6', wa: '#59616c', wb: '#6d7683', lamp: .08, moon: 0, city: 0, sun: .9,
            tint: '#bcd4f2', to: .12, sc: '#fff0d4' },
          { h: 12, a: '#9dc2e2', b: '#ddeadf', wa: '#69727e', wb: '#7d8794', lamp: .04, moon: 0, city: 0, sun: 1,
            tint: '#ffe6c0', to: .06, sc: '#fffdf2' },
          { h: 15, a: '#a6c2d6', b: '#e2d3b2', wa: '#6a6b70', wb: '#7f7d80', lamp: .1, moon: 0, city: 0, sun: .85,
            tint: '#ffd9a8', to: .1, sc: '#ffeccb' },
          { h: 17.5, a: '#9a86a0', b: '#e0a878', wa: '#57504e', wb: '#6a5a50', lamp: .4, moon: 0, city: .2, sun: .45,
            tint: '#ff9a5e', to: .2, sc: '#ffb070' },
          { h: 19.5, a: '#3c3a63', b: '#8a5a55', wa: '#2f2e37', wb: '#3d3a42', lamp: .85, moon: .35, city: .6, sun: .1,
            tint: '#ff8a50', to: .22, sc: '#ff8a50' },
          { h: 22, a: '#161f38', b: '#232d49', wa: '#1f232b', wb: '#2a2f38', lamp: 1, moon: 1, city: 1, sun: 0,
            tint: '#ffb066', to: .2, sc: '#ffd0a0' },
          { h: 24, a: '#141d33', b: '#202a45', wa: '#1e222a', wb: '#282d36', lamp: 1, moon: 1, city: 1, sun: 0,
            tint: '#ffb066', to: .2, sc: '#ffd0a0' }
        ];

        function hex(v) {
          return [parseInt(v.slice(1, 3), 16), parseInt(v.slice(3, 5), 16), parseInt(v.slice(5, 7), 16)];
        }
        function mix(a, b, t) {
          var A = hex(a), B = hex(b);
          return '#' + A.map(function (v, i) {
            var n = Math.round(v + (B[i] - v) * t);
            return (n < 16 ? '0' : '') + n.toString(16);
          }).join('');
        }

        /* ---------------- 姿态 ---------------- */
        var BASE = {
          lean: 0, hdx: 0, hdy: 0, hrot: 0,
          lh: [206, 140], rh: [270, 140],
          alpha: 1, dx: 0, sink: 0,
          brows: 0, smile: 1, ledger: 1
        };
        var POSES = {
          wait: Object.assign({}, BASE),
          serve: Object.assign({}, BASE, { lean: -2, hdx: -4, lh: [172, 108], brows: 1, smile: 2 }),
          tally: Object.assign({}, BASE, { lean: 3, hdx: -5, hdy: 8, hrot: 11, rh: [170, 134], lh: [212, 143], brows: 1 }),
          restock: Object.assign({}, BASE, { lean: -4, hdx: -9, hrot: 15, lh: [128, 86], rh: [148, 96], alpha: .95 }),
          count: Object.assign({}, BASE, { lean: 1, hdx: 3, lh: [258, 132], rh: [274, 136], smile: 2 }),
          doze: Object.assign({}, BASE, { lean: 15, hdx: -16, hdy: 32, hrot: 28, sink: 4, lh: [212, 146], rh: [262, 148], smile: 0 }),
          away: Object.assign({}, BASE, { alpha: 0, dx: 44 })
        };

        /* 客人配色（v0.8：沿用旧键，另加四类）
         * 这张表是「斗篷主色」的简表，外部只读；剪影细节见下面的 CUSTOMER_LOOK */
        var CUSTOMERS = {
          villager: '#463527', knight: '#39404c', merc: '#3c4450',
          thief: '#2f2a36', rogue: '#2f2a36', mage: '#403656',
          noble: '#3a2a3c', outsider: '#16303c', default: '#3a3244'
        };

        /* 每类客的剪影：fill/rim/collar 是斗篷三色，look 决定叠哪组配件。
         * 新增客类只加一行，setCustomer 不用改结构。 */
        var CUSTOMER_LOOK = {
          villager: { key: 'villager', fill: '#463527', rim: '#9a8f7a', collar: '#5a4632', look: 'villager' },
          knight: { key: 'knight', fill: '#39404c', rim: '#aeb8c6', collar: '#59616f', look: 'knight' },
          merc: { key: 'merc', fill: '#3c4450', rim: '#9aa7bb', collar: '#4b5361', look: 'merc' },
          thief: { key: 'thief', fill: '#2f2a36', rim: '#a89bb0', collar: '#413852', look: 'rogue' },
          rogue: { key: 'rogue', fill: '#2f2a36', rim: '#a89bb0', collar: '#413852', look: 'rogue' },
          mage: { key: 'mage', fill: '#403656', rim: '#b9a9e6', collar: '#5b4a7a', look: 'mage' },
          noble: { key: 'noble', fill: '#3a2a3c', rim: '#d8c9a6', collar: '#c9a24a', look: 'noble' },
          outsider: { key: 'outsider', fill: '#16303c', rim: '#7fe3ff', collar: '#3f7f96',
            look: 'outsider', alpha: 0.82, rimW: 2.8, rimOp: 0.95 },
          default: { key: 'default', fill: '#3a3244', rim: '#9a8fb2', collar: '#413852', look: '' }
        };
        /* look 名 → 配件组 id（组在 MARKUP 里 display:none 起手） */
        var CUST_GROUPS = [
          ['villager', 'custVillagerG'],
          ['noble', 'custNobleG'], ['merc', 'custMercG'], ['knight', 'custKnightG'],
          ['mage', 'custMageG'], ['rogue', 'custRogueG'], ['outsider', 'custOutsiderG']
        ];

        function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
        function lerp(a, b, t) { return a + (b - a) * t; }

        function solveArm(sx, sy, hx, hy, l1, l2, dir) {
          var dx = hx - sx, dy = hy - sy;
          var d = clamp(Math.sqrt(dx * dx + dy * dy), 0.01, l1 + l2 - 0.01);
          var a = Math.atan2(dy, dx);
          var cos = clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1);
          var ang = Math.acos(cos) * dir;
          return { ex: sx + Math.cos(a + ang) * l1, ey: sy + Math.sin(a + ang) * l1, hx: sx + Math.cos(a) * d, hy: sy + Math.sin(a) * d };
        }

        /* ---------------- 主体 ---------------- */
        function createScene(host) {
          host.innerHTML = '<svg viewBox="0 0 320 200" preserveAspectRatio="xMidYMid slice" ' +
            'style="display:block;width:100%;height:100%">' +
            MARKUP.replace('<g id="goodsG"></g>', '<g id="goodsG">' + goodsMarkup() + '</g>') + '</svg>';

          var root = host.querySelector('svg');
          var $ = function (id) { return root.querySelector('#' + id); };

          var n = {
            body: $('charBody'), arm: $('charArm'), headG: $('headG'), torso: $('torso'),
            eyeL: $('eyeL'), eyeR: $('eyeR'), browL: $('browL'), browR: $('browR'), mouth: $('mouth'), mouthO: $('mouthO'),
            armNear: $('armNear'), armFar: $('armFar'), handNear: $('handNear'), handFar: $('handFar'),
            ledger: $('shopLedgerG'), coins: $('coinsG'), pouch: $('pouchG'), bell: $('bellG'),
            cust: $('custG'), custHood: $('custHood'), custRim: $('custRim'), custCollar: $('custCollar'),
            custHalo: $('custHalo'),
            custAura: $('custAura'), custRing: $('custRing'), custRimGlow: $('custRimGlow'),
            custVillagerG: $('custVillagerG'), custNobleG: $('custNobleG'), custMercG: $('custMercG'), custKnightG: $('custKnightG'),
            custMageG: $('custMageG'), custRogueG: $('custRogueG'), custOutsiderG: $('custOutsiderG'),
            zzz: $('zzz'), coinFx: $('coinFx'), motes: $('motes'),
            lampBody: $('lampBody'), lampGlow: $('lampGlow'), lampCone: $('lampCone'),
            sunBeam: $('sunBeamG'), sunPatch: $('sunPatchG2'),
            moonG: $('moonG'), cityLight: $('cityLight'),
            skyA: $('skyA'), skyB: $('skyB'), wallA: $('wallA'), wallB: $('wallB'),
            deskFront: $('deskFrontG'), goodsG: $('goodsG'), vig: $('vig'),
            shelf4G: $('shelf4G'), catG: $('catG'), catTail: $('catTail'),
            catBody: $('catBody'), catShadow: $('catShadow'), catHead: $('catHead'),
            catEyes: $('catEyes'), catMouth: $('catMouth'), catMouthO: $('catMouthO'), catPaw: $('catPaw'),
            candleG: $('candleG'), flame: $('flame'), flameHalo: $('flameHalo'),
            glassG: $('glassG'), chandG: $('chandG'), chandHalo: $('chandHalo'),
            signG: $('signG'), portalG: $('portalG'), portalGlow: $('portalGlow'),
            /* v0.8 新增装饰 */
            boardG: $('boardG'), counterInlayG: $('counterInlayG'), stoolG: $('stoolG'),
            doorbellG: $('doorbellG'), vaultG: $('vaultG'), iceboxG: $('iceboxG'),
            awningRainG: $('awningRainG'),
            /* 装修补件：旧账本 / 门边盐线 / 门口油灯 / 迎客草席 / 穿衣镜 / 座钟 / 地窖暗门 */
            ledgerG: $('ledgerG'), saltG: $('saltG'), oilLampG: $('oilLampG'), matG: $('matG'),
            mirrorG: $('mirrorG'), clockG: $('clockG'), cellarG: $('cellarG'),
            counterTopG: $('counterTopG'), shelfG: $('shelfG'), shelf4G2: $('shelf4G'),
            winG: $('winG'), lampG2: $('lampG2'), shopCloth: $('shopCloth'),
            stallG: $('stallG'), awningG: $('awningG'), upperG: $('upperG'),
            wallSword: $('wallSword'), wallShield: $('wallShield'), stoneWall: $('stoneWall'),
            /* v0.11 空间分级（五档地面 / 门窗 / 墙面 / 台面 / 台脸）与色温节点 */
            floorDirtG: $('floorDirtG'), floorWoodG: $('floorWoodG'), floorBrickG: $('floorBrickG'),
            floorMosaicG: $('floorMosaicG'), floorMarbleG: $('floorMarbleG'),
            apHoleG: $('apHoleG'), apClothG: $('apClothG'),
            wallRoughG: $('wallRoughG'), wallTapestryG: $('wallTapestryG'),
            wallSconceG: $('wallSconceG'), wallNicheG: $('wallNicheG'),
            ctPlankG: $('ctPlankG'), ctClothG: $('ctClothG'), ctCarveG: $('ctCarveG'),
            cfPlankG: $('cfPlankG'), cfClothG: $('cfClothG'), cfCarveG: $('cfCarveG'),
            moodTint: $('moodTint'),
            /* v0.11 顶部收口与 4 档专属记号 */
            ceilShadeG: $('ceilShadeG'), corniceG: $('corniceG'), corniceGoldG: $('corniceGoldG'),
            cfGiltG: $('cfGiltG'),
            sunStopA: $('sunStopA'), sunStopB: $('sunStopB'), sunStopC: $('sunStopC'),
            sunPatchStopA: $('sunPatchStopA'), sunPatchStopB: $('sunPatchStopB'),
            /* v0.13 夜间照明 / 窗外街灯：全部预建，applyLight 只写 opacity、setTier 只切 display */
            nightPoolG: $('nightPoolG'), nightStallLanG: $('nightStallLanG'),
            nightCounterG: $('nightCounterG'), nightCounter2G: $('nightCounter2G'),
            nightSconceG: $('nightSconceG'), nightUpperG: $('nightUpperG'),
            nightWinG: $('nightWinG'),
            /* v0.13.1 夜间环境光 + 店主动作道具（全部预建，只写 opacity / transform） */
            nightAmbG: $('nightAmbG'), nAmbShelfG: $('nAmbShelfG'),
            clothG: $('clothG'), bookG: $('bookG'), bookPage: $('bookPage'),
            /* v0.11c 天气 / 节日 / 过场：节点全部预建，只切 display / transform */
            wxDim: $('wxDim'), wxSnowVeil: $('wxSnowVeil'), wxRainG: $('wxRainG'), wxSnowG: $('wxSnowG'), wxSnowFloorG: $('wxSnowFloorG'),
            festG: $('festG'), festConfG: $('festConfG'),
            instG: $('instG'), instBloom: $('instBloom'), instSweep: $('instSweep'),
            wxRainEls: root.querySelectorAll('#wxRainG path'),
            wxSnowEls: root.querySelectorAll('#wxSnowG circle'),
            festConfEls: root.querySelectorAll('#festConfG rect'),
            /* v0.14 四季窗外景：四组天光 + 四组前景，全部预建，setSeason 只切 display */
            seasonSkyG: [$('seasonSky0G'), $('seasonSky1G'), $('seasonSky2G'), $('seasonSky3G')],
            seasonFgG: [$('seasonFg0G'), $('seasonFg1G'), $('seasonFg2G'), $('seasonFg3G')]
          };

          /* ---------------- v0.14 四季（窗外） ----------------
             0 春 / 1 夏 / 2 秋 / 3 冬，默认 0。只切两个数组里的 display：
             不新建节点、不改 DOM 结构、不依赖 render 是否在跑，也不碰 applyLight 的夜色权重。
             tier<2 时这两组跟着 winG 一起不显示，旧窗（apHoleG/apClothG）一点没动。 */
          var season = 0;
          function applySeason() {
            for (var k = 0; k < 4; k++) {
              var sky = n.seasonSkyG[k], fg = n.seasonFgG[k];
              var d = k === season ? 'inline' : 'none';
              if (sky) sky.setAttribute('display', d);
              if (fg) fg.setAttribute('display', d);
            }
          }
          function setSeason(k) {
            var v = (k === null || k === undefined) ? 0 : (k | 0);
            if (v < 0 || v > 3) v = 0;
            season = v;
            applySeason();
          }
          applySeason();

          var goods = {};
          ITEMS.forEach(function (it) { goods[it.k] = root.querySelector('#g-' + it.k); });

          /* ---------------- v0.11c 天气 / 节日 / 升级过场 ----------------
           * 三种表现都只动「预建节点」：display 开关 + 每次少量属性写入，绝不 new 元素。
           * v0.12.2 起雨/雪/纸屑**逐帧**推进（26+26+20 个属性写入 ≈ 0.1ms/帧），
           * 原来用 0.09s/0.14s 累加器限频，在 60 帧屏上看起来就是雨点一卡一卡。*/
          var weather = 'sunny';          /* 'sunny' | 'rain' | 'overcast' | 'snow' */
          var festivalOn = false;
          var wxDirty = false;            /* 天气变了 → 强制 applyLight 重算光斑 */
          var wxT = 0;                    /* 天气动画时钟 */
          var festT = 0;                  /* 纸屑时钟 */
          var instT = 0, instDur = 1.5, instKind = '', instTargets = [];

          /* 逐元素参数用和 MARKUP 同一套 wxRand → 首帧位置与静态图形完全对得上，切档不「跳一下」 */
          var rainDrops = [], snowFlakes = [], confetti = [], wi;
          for (wi = 0; wi < n.wxRainEls.length; wi++) {
            rainDrops.push({
              el: n.wxRainEls[wi],
              x: parseFloat((wxRand(wi) * 320).toFixed(1)),
              y0: parseFloat((wxRand(wi + 40) * 212).toFixed(1)),
              sp: 118 + wxRand(wi + 12) * 62
            });
          }
          for (wi = 0; wi < n.wxSnowEls.length; wi++) {
            snowFlakes.push({
              el: n.wxSnowEls[wi],
              x: parseFloat((wxRand(wi + 7) * 320).toFixed(1)),
              y0: parseFloat((wxRand(wi + 61) * 210).toFixed(1)),
              sp: 20 + wxRand(wi + 5) * 26,
              ph: wxRand(wi + 77) * 6.28
            });
          }
          for (wi = 0; wi < n.festConfEls.length; wi++) {
            confetti.push({
              el: n.festConfEls[wi],
              x: parseFloat((wxRand(wi + 3) * 300 + 10).toFixed(1)),
              y0: parseFloat((wxRand(wi + 33) * 190 + 8).toFixed(1)),
              sp: 15 + wxRand(wi + 55) * 18,
              ph: wxRand(wi + 91) * 6.28
            });
          }

          /* 货品显隐：三态
           *   未解锁 / 等级不到 / 没买第四层 → 完全不显示（display:none，别留残影）
           *   已解锁且有货               → 不透明
           *   已解锁但售罄               → 留在原位淡出（约 0.4s），不是「啪」一下没
           * goodsA = 当前不透明度，goodsTgt = 目标值，在 render() 里追。 */
          var goodsA = {}, goodsTgt = {};
          ITEMS.forEach(function (it) { goodsA[it.k] = 0; goodsTgt[it.k] = 0; });
          var unlocked = {};        /* v0.6 解锁表：{ key: true } */
          var unlockedAll = true;   /* 没调用过 setUnlocked 时按老行为「全都已解锁」 */

          /* 尘埃 */
          var motes = [];
          var seed = 771022;
          function rnd() { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; }
          for (var i = 0; i < 6; i++) {
            var c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            c.setAttribute('r', (rnd() * 1 + 0.4).toFixed(2));
            c.setAttribute('fill', '#ffdca6');
            c.setAttribute('opacity', (rnd() * 0.25 + 0.08).toFixed(2));
            n.motes.appendChild(c);
            motes.push({ el: c, x: rnd() * 320, y: rnd() * 200, sp: rnd() * 3 + 1.4, ph: rnd() * 6 });
          }

          var state = 'wait';
          var target = POSES.wait;
          var cur = Object.assign({}, BASE);
          cur.lh = BASE.lh.slice(); cur.rh = BASE.rh.slice();
          var clockHour = 21;
          var lightLast = -999, lightTier = -1;
          var coinFxT = 0;
          var custLerp = 0, custOn = false;
          /* v0.11 客人进店过程：out（门外）→ enter（走进来）→ stand（站在柜台前）→ leave（走回门口）
           * custP：0 = 门外，1 = 柜台前；相位按秒推进，setCustomer 只切相位，不直接改坐标 */
          var custPhase = 'out', custP = 0, custPhaseT = 0, custWalkPh = 0;
          /* 店主等客时的低频小动作：0 无 / 1 擦柜台（抹布）/ 2 搓手 / 3 翻账本 / 4 打哈欠
           * v0.13.1：补了 3 与 4；打烊时段（0–6 点）打哈欠权重最高。
           * 仍然只挂在 idleGap 6–9.6 秒那条链上，不新增 rAF、不新建节点。 */
          var idleAct = 0, idleActT = 0, idleGap = 5.5, idleCount = 0, idleHold = 0;
          var IDLE_DUR = { 1: 2.1, 2: 2.1, 3: 2.8, 4: 2.4 };
          function idleDur(a) { return IDLE_DUR[a] || 2.1; }
          /* 权重抽签：夜里哈欠最多，白天以擦柜台/搓手为主，翻账本一天里都会有 */
          function pickIdleAct() {
            var hh = ((clockHour % 24) + 24) % 24;
            var night = hh < 6 ? 1 : ((hh >= 22 || hh < 7) ? 0.55 : 0);
            var w = [3, 2, 2.2, 1.1 + night * 4.4];
            var sum = 0, k;
            for (k = 0; k < w.length; k++) sum += w[k];
            var r = rnd() * sum;
            for (k = 0; k < w.length; k++) { r -= w[k]; if (r <= 0) return k + 1; }
            return 1;
          }
          var custKind = 'default', custLook = '';
          function customerLook(kind) {
            var k = kind == null ? '' : String(kind).toLowerCase();
            return CUSTOMER_LOOK[k] || CUSTOMER_LOOK.default;
          }
          var decor = {};
          var tier = 3;
          var lastStock = {};

          /* 店猫自己的小日子：眨眼、蹦位置、舔爪、打哈欠、有客人时抬头看；打烊后睡 */
          var catS = {
            pos: 0, from: 0, to: 0, hopStart: -9, hopDur: 0.74,
            nextHop: 6, nextGroom: 5, nextYawn: 16, nextBlink: 2,
            groomUntil: 0, yawnUntil: 0, blinkUntil: 0
          };
          function catTick(t) {
            var asleep = clockHour < 8 || clockHour >= 23;
            var eyeS = 1;
            if (asleep) eyeS = 0.1;
            else {
              if (t > catS.nextBlink) { catS.blinkUntil = t + 0.16; catS.nextBlink = t + 2.6 + rnd() * 3.4; }
              if (t < catS.blinkUntil) eyeS = 0.1;
            }
            n.catEyes.setAttribute('transform', 'translate(33.4 124) scale(1 ' + eyeS.toFixed(2) + ') translate(-33.4 -124)');

            /* 挪个位置：短促地蹦一下（幅度加大到 10–20，小窗里也看得出来） */
            var dx = catS.pos, lift = 0;
            if (!asleep && t > catS.nextHop) {
              var dir = rnd() < 0.5 ? -1 : 1;
              catS.from = catS.pos;
              catS.to = Math.max(-8, Math.min(18, catS.pos + dir * (10 + rnd() * 10)));
              catS.hopStart = t;
              catS.nextHop = t + 9 + rnd() * 9;
            }
            var hp = (t - catS.hopStart) / catS.hopDur;
            if (hp >= 0 && hp < 1) {
              var e = hp * hp * (3 - 2 * hp);
              dx = catS.from + (catS.to - catS.from) * e;
              lift = Math.sin(Math.PI * hp) * 8.5;
              catS.pos = dx;
            }
            n.catBody.setAttribute('transform', 'translate(' + dx.toFixed(2) + ' ' + (-lift).toFixed(2) + ')');
            n.catShadow.setAttribute('cx', (34 + dx).toFixed(2));
            n.catShadow.setAttribute('rx', (13 + lift * 0.2).toFixed(2));
            n.catShadow.setAttribute('opacity', (0.22 - lift * 0.011).toFixed(2));

            /* 舔爪 / 打哈欠 */
            if (!asleep && t > catS.nextGroom) { catS.groomUntil = t + 2.6; catS.nextGroom = t + 12 + rnd() * 10; }
            if (!asleep && t > catS.nextYawn) { catS.yawnUntil = t + 1.8; catS.nextYawn = t + 18 + rnd() * 14; }
            var grooming = t < catS.groomUntil, yawning = t < catS.yawnUntil;
            var watching = !asleep && custLerp > 0.5;   /* 有客人进门就抬头盯着看 */

            n.catPaw.setAttribute('opacity', grooming ? '1' : '0');
            var headTf = '';
            if (grooming) headTf = 'rotate(-8 33.4 129) translate(0 0.8)';
            else if (yawning) headTf = 'translate(0 -1)';
            else if (watching) headTf = 'rotate(-5 33.4 129) translate(-1.2 0)';
            n.catHead.setAttribute('transform', headTf);
            n.catMouth.setAttribute('opacity', yawning ? '0' : '0.8');
            n.catMouthO.setAttribute('opacity', yawning ? '0.9' : '0');


            /* 尾巴：睡着时卷着不动，醒着慢慢摆 */
            if (asleep) n.catTail.setAttribute('d', 'M41.4 141 q7.6 -0.6 7 -6.2');
            else {
              var tw = Math.sin(t * 0.9);
              n.catTail.setAttribute('d', 'M41.4 141 q' + (6.4 + tw * 1.5).toFixed(1) + ' -1.4 ' + (5.6 - tw * 4).toFixed(1) + ' -10.6');
            }
          }

          /* 金币堆：钱越多，柜台上的铜板越多 */
          function drawCoins(gold) {
            var want = clamp(Math.floor(Math.log(1 + gold / 6) * 2.4), 0, 12);
            var have = n.coins.childNodes.length;
            while (have < want) {
              var e = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
              var idx = have;
              e.setAttribute('cx', (259 + (idx % 2) * 7).toFixed(1));
              e.setAttribute('cy', (140 - Math.floor(idx / 2) * 2.2).toFixed(1));
              e.setAttribute('rx', '3.2');
              e.setAttribute('ry', '1.4');
              e.setAttribute('fill', '#d8b25a');
              e.setAttribute('stroke', '#8a6a28');
              e.setAttribute('stroke-width', '.6');
              n.coins.appendChild(e);
              have++;
            }
            while (have > want) { n.coins.removeChild(n.coins.lastChild); have--; }
          }

          /* 这格货现在该不该出现在货架上 */
          function goodsOn(i, t) {
            if (!(unlockedAll || unlocked[i.k])) return false;          /* v0.6：没花钱解锁的货不上架 */
            if ((i.lv | 0) > t) return false;                           /* 等级不到不显形 */
            if ((i.lv | 0) === 4 && !decor.shelf4) return false;        /* 第 4 级的货还要先买第四层货架 */
            return true;
          }

          function setStock(map) {
            lastStock = map || {};
            ITEMS.forEach(function (it) {
              var g = goods[it.k];
              if (!g) return;
              if (!goodsOn(it, tier)) {
                /* 未解锁 / 等级不到：一格空着，连轮廓都不画 */
                g.setAttribute('display', 'none');
                g.setAttribute('opacity', '0');
                goodsA[it.k] = 0;
                goodsTgt[it.k] = 0;
                return;
              }
              g.setAttribute('display', 'inline');
              var tgt = typeof lastStock[it.k] === 'number' && lastStock[it.k] <= 0 ? 0 : 1;
              goodsTgt[it.k] = tgt;
              /* 淡入淡出在 render 里推；已经停在目标值上的（例如一创建就是售罄）就当场写死，
                 否则 opacity 属性压根没写过，SVG 默认不透明 = 售罄的货还挂着。 */
              if (goodsA[it.k] === tgt) g.setAttribute('opacity', String(tgt));
            });
          }

          /* v0.6 解锁表：setUnlocked({ dagger: true, wand: true }) 或 setUnlocked(['dagger','wand'])
           * 传 null / undefined = 全部已解锁（v0.5 宿主/老存档的兼容行为，货品按 setStock 的库存显隐）。
           * 解锁价在 ITEMS[i].unlock（单位铜），免费货 unlock: 0 & free: true。 */
          function setUnlocked(map) {
            if (map === null || map === undefined) {
              unlockedAll = true;
              unlocked = {};
            } else {
              unlockedAll = false;
              unlocked = {};
              if (Array.isArray(map)) {
                map.forEach(function (k) { if (k) unlocked[String(k)] = true; });
              } else if (typeof map === 'object') {
                Object.keys(map).forEach(function (k) { if (map[k]) unlocked[k] = true; });
              }
            }
            setStock(lastStock || {});
          }

          function applyLight() {
            /* 时次和场所任一变了都要重算：窗是 Lv.2 才砌的，升级那一帧亮度也得跟着变 */
            if (!wxDirty && Math.abs(clockHour - lightLast) < 0.02 && lightTier === tier) return;
            lightLast = clockHour; lightTier = tier; wxDirty = false;
            var h = ((clockHour % 24) + 24) % 24, i = 0;
            while (i < LIGHT.length - 2 && LIGHT[i + 1].h <= h) i++;
            var A = LIGHT[i], B = LIGHT[i + 1];
            var t = clamp((h - A.h) / (B.h - A.h), 0, 1);
            n.skyA.setAttribute('stop-color', mix(A.a, B.a, t));
            n.skyB.setAttribute('stop-color', mix(A.b, B.b, t));
            n.wallA.setAttribute('stop-color', mix(A.wa, B.wa, t));
            n.wallB.setAttribute('stop-color', mix(A.wb, B.wb, t));
            var moon = lerp(A.moon, B.moon, t), city = lerp(A.city, B.city, t);
            /* v0.15：窗外换成异世界风景后，两轮月亮是画面主体之一，白天不再归零 ——
               留 0.3 的淡月影（正午太阳最亮时也只是淡），夜里仍然是 1。零档窗户不显示，不影响 tier<2。 */
            n.moonG.setAttribute('opacity', (0.3 + 0.7 * moon).toFixed(2));
            n.cityLight.setAttribute('opacity', (city * 0.9).toFixed(2));
            var lamp = lerp(A.lamp, B.lamp, t);
            n.lampBody.setAttribute('opacity', (0.4 + 0.6 * lamp).toFixed(2));
            n.lampGlow.setAttribute('opacity', (0.15 + 0.85 * lamp).toFixed(2));
            n.lampCone.setAttribute('opacity', (0.55 * lamp).toFixed(2));
            var sun = lerp(A.sun || 0, B.sun || 0, t);
            /* v0.9：光斑得穿窗进屋，而窗是 Lv.2 才砌的 —— 地摊/木棚没窗就不能有斜光 */
            if (tier < 2) sun = 0;
            /* v0.11c 天气：阴天光斑发虚、雨天几乎没有太阳、雪天比晴天弱一点（tier<2 依旧是 0） */
            var sunK = weather === 'rain' ? 0.3 : weather === 'overcast' ? 0.45 : weather === 'snow' ? 0.72 : 1;
            n.sunBeam.setAttribute('opacity', (sun * 0.85 * sunK).toFixed(2));
            n.sunPatch.setAttribute('opacity', (sun * 0.7 * sunK).toFixed(2));
            var vigVal = 0.5 + 0.4 * (1 - lamp) - sun * 0.25;
            n.vig.setAttribute('opacity', vigVal.toFixed(2));
            /* v0.12：客人身后的分离光跟着暗度走 —— 亮堂时收着（0.30），越暗越亮（夜里/地摊前 0.55–0.62），
             * 剪影在任何时段都从柜台上分离出来，又不会在正午糊成一圈光。
             * 暗度只看「真正照到客人身上的光」：窗光（tier<2 没有）为主，吊灯只算一点。 */
            if (n.custHalo) {
              var custDark = clamp(1 - (sun * 0.75 * sunK + lamp * 0.18), 0, 1);
              n.custHalo.setAttribute('opacity', clamp(0.3 + 0.38 * custDark, 0.3, 0.66).toFixed(2));
            }
            /* v0.11 色温：只改既有节点的 fill / fill-opacity，不新建节点、不每帧建 DOM。
             * tint/to = 压在整幅画面上的情绪色（清晨冷蓝 / 正午暖白 / 黄昏橙红 / 夜里烛光暖黄）。
             * v0.12.3：不再用 multiply 混合 —— 把色温色先压暗（moodDark 越大越暗）再按 alpha 叠加，
             * 这样普通混合也能得到「暗处更暗 + 带一点色相」的观感，且省掉全幅混合开销。
             * sc = 那束日光的颜色，顺手改 sunG / sunPatchG 的渐变 stop，让傍晚的光偏橙、清晨偏冷。 */
            var tint = mix(A.tint || '#ffb066', B.tint || '#ffb066', t);
            var to = lerp(A.to || 0, B.to || 0, t);
            if (n.moodTint) {
              n.moodTint.setAttribute('fill', mix(tint, '#0a0705', 0.6));
              n.moodTint.setAttribute('fill-opacity', (to * 0.9).toFixed(3));
            }
            var sc = mix(A.sc || '#fffdf2', B.sc || '#fffdf2', t);
            if (n.sunStopA) {
              n.sunStopA.setAttribute('stop-color', sc);
              n.sunStopB.setAttribute('stop-color', mix(sc, '#ffe6c0', 0.35));
              n.sunStopC.setAttribute('stop-color', mix(sc, '#ffe6c0', 0.72));
              n.sunPatchStopA.setAttribute('stop-color', sc);
              n.sunPatchStopB.setAttribute('stop-color', mix(sc, '#ffe6c0', 0.6));
            }

            /* ---- v0.13 夜间照明：打烊时段（h<7）亮店内夜灯、窗外换成夜色街灯 ----
             * 夜间权重 nightF：23:00 起 1 小时淡入（打烊前点灯），5:30 起 1.5 小时淡出，
             * 这样跨 0 点不回跳；21:00 这种营业时段 nightF 仍是 0，白天/傍晚的观感一点没动。
             * 只对预建节点写 opacity，不新建 DOM、不加 rAF；亮几盏灯由 setTier 的 display 决定。
             * 这是「加光」：wxDim / wxSnowVeil / moodTint 一概不碰 —— 雨雪阴天夜里本来更暗，
             * 不再叠一层压暗（req 3），夜里只是从「一片死黑」变成「几盏暖灯」。 */
            var nightF = 0;
            if (h < 7) nightF = clamp((7 - h) / 1.5, 0, 1);
            else if (h >= 23) nightF = clamp((h - 23) / 1, 0, 1);
            /* 灯油不稳的微呼吸：只有亮度在小范围里晃，位置不动，所以看不出「闪」 */
            var flick = 0.95 + 0.05 * Math.sin(clockHour * 2.1 + 0.8);
            setOp(n.nightPoolG, nightF * (tier >= 3 ? 0.92 : 0.78) * flick);
            setOp(n.nightStallLanG, nightF * flick);
            setOp(n.nightCounterG, nightF * flick);
            setOp(n.nightCounter2G, nightF * flick);
            setOp(n.nightSconceG, nightF * flick);
            setOp(n.nightUpperG, nightF * 0.85 * flick);
            /* 窗景只在 tier>=2 的 winG 里存在：tier<2 时这个引用是 null，setOp 自动跳过 */
            setOp(n.nightWinG, nightF * 0.95);
            /* v0.13.1 夜间环境光：0/1 档没有吊灯也没有窗，最需要这一层（货架上的东西靠它分离出来）；
               2 档起自己就有烛台/窗景，权重往下收，免得夜里看着像阴天。 */
            var ambK = tier <= 0 ? 1.14 : tier === 1 ? 1.12 : tier === 2 ? 0.62 : 0.42;
            setOp(n.nightAmbG, nightF * 0.72 * ambK);
          }

          /* ---------------- v0.11c 天气 / 节日 / 升级过场 ---------------- */
          function vis(el, showIt) { if (el) el.setAttribute('display', showIt ? 'inline' : 'none'); }
          /* v0.13：夜灯/窗景的亮度全靠这一个写 opacity 的动作，节点引用常驻，不查 DOM */
          function setOp(el, v) { if (el) el.setAttribute('opacity', v.toFixed(3)); }

          /* 天气外观：雨天压暗 + 雨丝；雪天铺一层淡白 + 雪点；阴天整幅降饱和、光斑变虚；晴天回原样。
           * 只切 display / opacity / 一个 filter 字符串 —— 瞬时完成，不重建任何节点，所以不会卡。 */
          function applyWeather() {
            var isRain = weather === 'rain', isSnow = weather === 'snow', isOver = weather === 'overcast';
            vis(n.wxRainG, isRain);
            vis(n.wxSnowG, isSnow);
            vis(n.wxSnowFloorG, isSnow);
            if (n.wxDim) n.wxDim.setAttribute('fill-opacity', isRain ? '0.26' : isOver ? '0.14' : '0');
            if (n.wxSnowVeil) n.wxSnowVeil.setAttribute('fill-opacity', isSnow ? '0.13' : '0');
            /* 阴天：只写一次 root.style.filter，不参与每帧 */
            if (root) root.style.filter = isOver ? 'saturate(.62) brightness(.97)' : '';
            wxT = 0;
            paintWeather();
          }

          function paintWeather() {
            var i, d, y;
            if (weather === 'rain') {
              for (i = 0; i < rainDrops.length; i++) {
                d = rainDrops[i];
                y = (d.y0 + wxT * d.sp) % 212;
                /* 每帧调用：x 固定，预先存好字符串，避免每帧重复 toFixed */
                d.el.setAttribute('transform', 'translate(' + (d.xs || (d.xs = d.x.toFixed(1))) + ' ' + y.toFixed(1) + ')');
              }
            } else if (weather === 'snow') {
              for (i = 0; i < snowFlakes.length; i++) {
                d = snowFlakes[i];
                y = (d.y0 + wxT * d.sp) % 210;
                d.el.setAttribute('cx', (d.x + Math.sin(wxT * 0.55 + d.ph) * 7).toFixed(1));
                d.el.setAttribute('cy', y.toFixed(1));
              }
            }
          }

          function paintFest() {
            var i, d, y;
            for (i = 0; i < confetti.length; i++) {
              d = confetti[i];
              y = (d.y0 + festT * d.sp) % 200;
              d.el.setAttribute('transform', 'translate(' +
                (d.x + Math.sin(festT * 0.7 + d.ph) * 6).toFixed(1) + ' ' + y.toFixed(1) + ')');
            }
          }

          /* render 末尾统一推进。
           * v0.12.2：雨/雪改成**每帧**写位置。原来卡 0.09s 累加器 ≈ 11 次/秒，
           * 屏幕 60 帧下就是「一卡一卡的」——26 条雨丝逐帧改 transform 只要 ~0.1ms，
           * 真正贵的是每秒几十次全 SVG 重算，而 26 个属性写入远不至于。纸屑同理。*/
          function tickScene(dtS) {
            wxT += dtS;
            if (weather === 'rain' || weather === 'snow') paintWeather();
            if (festivalOn) { festT += dtS; paintFest(); }
            if (instT > 0) tickInstall(dtS);
          }

          /* 升级过场：新物件从下往上滑入（16px + easeOutCubic 落位），同时一次柔和光晕 + 一道扫光，
           * 1.5s 后把 transform / opacity 全部归位 —— 常态里不留任何痕迹。 */
          var INST_TIER = ['floorDirtG', 'floorWoodG', 'floorBrickG', 'floorMosaicG', 'floorMarbleG',
            'apHoleG', 'apClothG', 'wallRoughG', 'wallTapestryG', 'wallSconceG', 'wallNicheG',
            'ctPlankG', 'ctClothG', 'ctCarveG', 'cfPlankG', 'cfClothG', 'cfCarveG',
            'ceilShadeG', 'corniceG', 'corniceGoldG', 'cfGiltG', 'shelfG', 'winG', 'upperG'];
          var INST_DECOR = ['boardG', 'counterInlayG', 'doorbellG', 'vaultG', 'iceboxG',
            'glassG', 'chandG', 'signG', 'portalG', 'candleG', 'catG', 'stoolG',
            /* 装修补件 7 件：都自带 display=none，买下时一起滑入 */
            'ledgerG', 'saltG', 'oilLampG', 'matG', 'mirrorG', 'clockG', 'cellarG'];

          function clearInstall() {
            for (var i = 0; i < instTargets.length; i++) instTargets[i].removeAttribute('transform');
            instTargets = [];
            if (n.instBloom) n.instBloom.setAttribute('opacity', '0');
            if (n.instSweep) { n.instSweep.setAttribute('opacity', '0'); n.instSweep.setAttribute('x', '-120'); }
            vis(n.instG, false);
            instT = 0;
          }

          function playInstall(kind) {
            clearInstall();                    /* 上一次没播完就重来，别留半截位移 */
            instKind = kind === 'decor' ? 'decor' : 'tier';
            instDur = 1.5; instT = instDur;
            var list = instKind === 'decor' ? INST_DECOR : INST_TIER;
            for (var i = 0; i < list.length; i++) {
              var el = n[list[i]];
              if (!el || el.style.display === 'none') continue;
              if (el.getAttribute('transform')) continue;   /* 自带位移的（凳子/货品）不抢它的 transform */
              el.setAttribute('transform', 'translate(0 16)');
              instTargets.push(el);
            }
            vis(n.instG, true);
            if (n.instBloom) n.instBloom.setAttribute('opacity', '0');
            if (n.instSweep) { n.instSweep.setAttribute('opacity', '0'); n.instSweep.setAttribute('x', '-120'); }
          }

          function tickInstall(dtS) {
            instT -= dtS;
            if (instT <= 0) { clearInstall(); return; }
            var p = 1 - instT / instDur;
            var e = 1 - Math.pow(1 - p, 3);
            var dy = (1 - e) * 16;
            for (var i = 0; i < instTargets.length; i++) {
              if (dy > 0.3) instTargets[i].setAttribute('transform', 'translate(0 ' + dy.toFixed(2) + ')');
              else instTargets[i].removeAttribute('transform');
            }
            var q = Math.sin(Math.PI * p);
            if (n.instBloom) n.instBloom.setAttribute('opacity', (q * 0.62).toFixed(3));
            if (n.instSweep) {
              n.instSweep.setAttribute('x', (-120 + p * 440).toFixed(1));
              n.instSweep.setAttribute('opacity', (q * 0.95).toFixed(3));
            }
          }

          function setWeather(kind) {
            var k = (kind === 'rain' || kind === 'snow' || kind === 'overcast') ? kind : 'sunny';
            if (k === weather && wxT > 0) return;   /* 重复设同一档不必重摆雨丝 */
            weather = k;
            wxDirty = true;                          /* 跳过 applyLight 的时次缓存，重算光斑 */
            applyWeather();
            applyLight();
          }

          function setFestival(onOff) {
            var v = !!onOff;
            if (v === festivalOn) return;
            festivalOn = v;
            festT = 0;
            vis(n.festG, v);
            vis(n.festConfG, v);
            if (v) paintFest();
          }

          function event(kind, ms) {
            if (kind === 'coin') coinFxT = Date.now() + (ms || 1600);
          }

          var t0 = 0;
          function render(now, dt) {
            if (!t0) t0 = now;
            var t = (now - t0) / 1000;
            var f = 1 - Math.exp(-dt * 7);
            var dtS = Math.min(dt, 0.05);   /* v0.11：动画相位按「秒」推，掉帧也不会一下跳完 */

            cur.alpha = lerp(cur.alpha, target.alpha, f);
            ['lean', 'hdx', 'hdy', 'hrot', 'dx', 'sink', 'brows', 'smile', 'ledger'].forEach(function (k) {
              cur[k] = lerp(cur[k], target[k], f);
            });
            cur.lh[0] = lerp(cur.lh[0], target.lh[0], f); cur.lh[1] = lerp(cur.lh[1], target.lh[1], f);
            cur.rh[0] = lerp(cur.rh[0], target.rh[0], f); cur.rh[1] = lerp(cur.rh[1], target.rh[1], f);

            var breath = Math.sin(t * 1.5) * 0.6;
            var busy = state === 'tally';
            var tap = busy ? Math.sin(t * 11) : 0;

            var xf = 'translate(' + cur.dx.toFixed(1) + ',' + (cur.sink + breath * 0.35).toFixed(1) + ')';
            n.body.setAttribute('opacity', cur.alpha.toFixed(2));
            n.body.setAttribute('transform', xf + ' rotate(' + cur.lean.toFixed(2) + ' 238 152)');
            n.arm.setAttribute('opacity', cur.alpha.toFixed(2));
            n.arm.setAttribute('transform', xf + ' rotate(' + cur.lean.toFixed(2) + ' 238 152)');

            /* v0.11 店主动作：
             *   serve —— 客人站在柜台前（custLerp）时，头朝客人偏一点，近手抬起来招呼
             *   tally/count —— 低头看手里的钱，眼睛跟着往下
             *   wait  —— 每 7~12 秒来一次 2 秒的小动作：擦柜台 / 搓手（不是每帧都在动） */
            var serveAmt = state === 'serve' ? clamp(custLerp, 0, 1) : 0;
            var lookDown = (state === 'tally' || state === 'count') ? 1 : 0;

            if (idleHold) {
              /* 调试/截图用：把某个小动作钉住（见 setIdleAct），生产逻辑不会走这条 */
              idleAct = idleHold; idleActT = idleDur(idleAct) * 0.42;
            } else if (state === 'wait' && custLerp < 0.15 && cur.alpha > 0.5) {
              idleActT += dtS;
              if (!idleAct) {
                if (idleActT > idleGap) { idleAct = pickIdleAct(); idleActT = 0; idleCount++; }
              } else if (idleActT > idleDur(idleAct)) {
                idleAct = 0; idleActT = 0; idleGap = 6 + (idleCount % 3) * 1.8;
              }
            } else { idleAct = 0; idleActT = 0; }

            /* 小动作的渐入渐出（0.32 秒淡入/淡出），翻账本与哈欠要拿来调头与嘴 */
            var idleNow = idleDur(idleAct);
            var ia = idleAct ? clamp(Math.min(idleActT, idleNow - idleActT) / 0.32, 0, 1) : 0;
            var wipeAmt = idleAct === 1 ? ia : 0;
            var pageAmt = idleAct === 3 ? ia : 0;
            var yawnAmt = idleAct === 4 ? ia : 0;

            var hdx2 = cur.hdx - 3.2 * serveAmt + 1.4 * lookDown;
            var hdy2 = cur.hdy + 2.8 * lookDown + 0.6 * serveAmt;
            var hrot2 = cur.hrot - 2.2 * serveAmt + 1.6 * lookDown;
            if (serveAmt > 0.01) hrot2 += Math.sin(t * 2.1) * 1.1 * serveAmt;   /* 点头招呼 */
            /* v0.13.1：翻账本低头看页，打哈欠仰头 */
            if (pageAmt > 0.01) { hdy2 += 4.2 * pageAmt; hrot2 += 5 * pageAmt; hdx2 -= 2.4 * pageAmt; }
            if (yawnAmt > 0.01) { hdy2 -= 5.5 * yawnAmt; hrot2 -= 7 * yawnAmt; hdx2 -= 1.5 * yawnAmt; }
            n.headG.setAttribute('transform',
              'translate(' + hdx2.toFixed(2) + ',' + hdy2.toFixed(2) + ') rotate(' + hrot2.toFixed(2) + ' 238 102)');

            var blink = (Math.sin(t * 0.9) > 0.985) || (Math.sin(t * 0.37 + 1) > 0.995);
            var eyeRy = blink ? 0.5 : (state === 'doze' ? 0.9 : 2.4);
            if (lookDown) eyeRy = Math.min(eyeRy, 1.7);   /* 低头数钱：眼睛压扁一点 */
            if (yawnAmt > 0.4) eyeRy = 0.6;               /* 打哈欠眯眼 */
            n.eyeL.setAttribute('ry', eyeRy.toFixed(1));
            n.eyeR.setAttribute('ry', eyeRy.toFixed(1));
            var eyeOff = 1.5 * lookDown;
            n.eyeL.setAttribute('transform', 'translate(0,' + eyeOff.toFixed(1) + ')');
            n.eyeR.setAttribute('transform', 'translate(0,' + eyeOff.toFixed(1) + ')');
            var browY = (state === 'serve' || busy) ? -1 : 0;
            n.browL.setAttribute('transform', 'translate(0,' + (browY + cur.brows * -0.5).toFixed(1) + ')');
            n.browR.setAttribute('transform', 'translate(0,' + (browY + cur.brows * -0.5).toFixed(1) + ')');
            var open = 0.8 + cur.smile * 0.7;
            var mouthDrop = 2.2 * open + 4.6 * yawnAmt;
            var mouthWide = 5 + 1.6 * yawnAmt;
            n.mouth.setAttribute('d', 'M' + (233 + tap * 0.5 - 0.8 * yawnAmt).toFixed(1) + ' 96 q' +
              mouthWide.toFixed(1) + ' ' + mouthDrop.toFixed(1) + ' ' + (10 + 1.6 * yawnAmt).toFixed(1) + ' 0');
            if (n.mouthO) {
              n.mouthO.setAttribute('opacity', (yawnAmt * 0.95).toFixed(2));
              n.mouthO.setAttribute('rx', (2.2 + 2.6 * yawnAmt).toFixed(2));
              n.mouthO.setAttribute('ry', (1.2 + 2.4 * yawnAmt).toFixed(2));
            }

            var lh = { x: cur.lh[0] + tap * 1.4, y: cur.lh[1] + (busy ? tap * -1 : 0) };
            var rh = { x: cur.rh[0], y: cur.rh[1] + (busy ? tap * 1 : 0) };

            /* 接待：近手抬到肩上方，小幅挥两下（读作"招呼客人"） */
            if (serveAmt > 0.01) {
              var wave = Math.sin(t * 3.4) * 2.4 * serveAmt;
              lh.x = lerp(lh.x, 188 + wave, serveAmt);
              lh.y = lerp(lh.y, 97 + Math.cos(t * 3.4) * 1.3 * serveAmt, serveAmt);
              rh.x = lerp(rh.x, 272 - wave * 0.5, serveAmt * 0.5);
            }
            /* 数钱：右手在钱堆上点，左手压着账本（低头由上面的 headG 负责） */
            if (lookDown) {
              rh.y += Math.sin(t * 9.5) * 0.9;
              lh.x += 1.4;
            }
            /* 等客时的小动作（v0.13.1 四种）：
             *   1 擦柜台 —— 近手攥着抹布左右抹，另一只手撑在台面上
             *   2 搓手   —— 两手并到胸前摩
             *   3 翻账本 —— 两手压在摊开的账上，右手隔一拍挑一页
             *   4 打哈欠 —— 两手抬到肩上方张开，头后仰、嘴张开（headG / mouth 在上面算） */
            if (idleAct === 1) {
              /* 抹布压在台面上沿（y≈134）来回抹，抬到台面线以上才看得出「在擦」，不是「趴着」 */
              var wx = 224 + Math.sin(idleActT * 6.2) * 16;
              lh.x = lerp(lh.x, wx, ia); lh.y = lerp(lh.y, 133.6, ia);
              rh.x = lerp(rh.x, 264, ia);
            } else if (idleAct === 2) {
              var rub = Math.sin(idleActT * 10.5) * 1.7;
              lh.x = lerp(lh.x, 226 + rub, ia); lh.y = lerp(lh.y, 133.5, ia);
              rh.x = lerp(rh.x, 241 - rub, ia); rh.y = lerp(rh.y, 134, ia);
            } else if (idleAct === 3) {
              lh.x = lerp(lh.x, 217, ia); lh.y = lerp(lh.y, 137, ia);
              rh.x = lerp(rh.x, 245, ia); rh.y = lerp(rh.y, 137, ia);
            } else if (idleAct === 4) {
              var up = Math.sin(clamp(idleActT / 1.3, 0, 1) * Math.PI * 0.5);
              lh.x = lerp(lh.x, 208 - up * 2, ia); lh.y = lerp(lh.y, 140 - up * 41, ia);
              rh.x = lerp(rh.x, 268 + up * 2, ia); rh.y = lerp(rh.y, 140 - up * 38, ia);
            }

            var a1 = solveArm(216, 120, lh.x, lh.y, 22, 19, 1);
            var a2 = solveArm(260, 120, rh.x, rh.y, 22, 19, -1);
            n.armNear.setAttribute('d', 'M216 120 Q' + a1.ex.toFixed(1) + ' ' + a1.ey.toFixed(1) + ' ' + lh.x.toFixed(1) + ' ' + lh.y.toFixed(1));
            n.armFar.setAttribute('d', 'M260 120 Q' + a2.ex.toFixed(1) + ' ' + a2.ey.toFixed(1) + ' ' + rh.x.toFixed(1) + ' ' + rh.y.toFixed(1));
            n.handNear.setAttribute('cx', lh.x.toFixed(1)); n.handNear.setAttribute('cy', lh.y.toFixed(1));
            n.handFar.setAttribute('cx', rh.x.toFixed(1)); n.handFar.setAttribute('cy', rh.y.toFixed(1));
            /* 抹布跟着近手走；翻账本时那本账亮出来，右手隔一拍挑一页（都只是写 opacity / transform） */
            if (n.clothG) {
              n.clothG.setAttribute('opacity', wipeAmt.toFixed(3));
              if (wipeAmt > 0.02) {
                n.clothG.setAttribute('transform',
                  'translate(' + lh.x.toFixed(1) + ' ' + lh.y.toFixed(1) + ') rotate(' +
                  (-8 + Math.sin(idleActT * 6.2) * 7).toFixed(1) + ')');
              }
            }
            if (n.bookG) {
              n.bookG.setAttribute('opacity', pageAmt.toFixed(3));
              if (pageAmt > 0.02 && n.bookPage) {
                var pf = idleActT < 0.55 ? 0 : ((idleActT - 0.55) % 1.15) / 1.15;
                var pfl = pf < 0.62 ? pf / 0.62 : 0;
                n.bookPage.setAttribute('transform',
                  'translate(229 137.4) rotate(' + (-30 * pfl).toFixed(1) + ') translate(-229 -137.4)');
              }
            }

            n.ledger.setAttribute('opacity', (0.5 + 0.5 * clamp(cur.ledger, 0, 1)).toFixed(2));

            /* ---- 客人：进店 → 走到柜台 → 成交点头 → 退回门口（v0.11）----
               位移 + 体积（远处略小）+ 走路的上下踏步 + 轻微左右晃；不新建节点，只写 transform。 */
            var walkSpeed = custPhase === 'enter' ? (1 / 1.15) : (1 / 1.0);
            if (custPhase === 'enter') {
              custP = Math.min(1, custP + dtS * walkSpeed);
              custPhaseT += dtS;
              if (custP >= 1) { custPhase = 'stand'; custPhaseT = 0; }
            } else if (custPhase === 'stand') {
              custPhaseT += dtS;
            } else if (custPhase === 'leave') {
              custP = Math.max(0, custP - dtS * walkSpeed);
              custPhaseT += dtS;
              if (custP <= 0) custPhase = 'out';
            }
            var custMoving = (custPhase === 'enter' && custP < 0.999) ||
                             (custPhase === 'leave' && custP > 0.001);
            custWalkPh += dtS * (custMoving ? 9.6 : 1.7);
            var custBob = -Math.abs(Math.sin(custWalkPh)) * (custMoving ? 2.1 : 0.45);
            var custSway = custMoving ? Math.sin(custWalkPh) * 0.85 : Math.sin(t * 1.15) * 0.3;
            /* 成交：朝柜台轻点一下（只做一次，1 秒左右） */
            if (custPhase === 'stand' && custPhaseT > 0.55 && custPhaseT < 1.45) {
              var gp = Math.sin((custPhaseT - 0.55) * 7.4);
              custBob += gp * 1.5;
              custSway -= 1.2 * Math.max(0, gp);
            }
            var custA = custPhase === 'out' ? 0 : 1;
            if (custPhase === 'enter') custA = clamp(0.25 + custP * 2.4, 0, 1);   /* 进门几步就实起来，别一路半透明 */
            if (custPhase === 'leave') custA = custP < 0.72 ? 1 : clamp((1 - custP) / 0.28, 0, 1);  /* 走到门口才淡出 */
            custLerp = lerp(custLerp, custA, Math.min(1, f * 3.4));
            var cScale = 0.72 + 0.28 * custP;                 /* 门口的人小一圈 = 站得远 */
            var cdx = 268 * (1 - custP);                      /* 0 → 门口（右侧），1 → 柜台前 */
            var cdy = -8 * (1 - custP);                       /* 门口那只脚略高一点 = 站得远些，但不能飘到柜台上 */
            n.cust.setAttribute('opacity', custLerp.toFixed(2));
            n.cust.setAttribute('transform',
              'translate(' + (64 * (1 - cScale) + cdx).toFixed(1) + ',' +
              (200 * (1 - cScale) + cdy + custBob).toFixed(1) + ') scale(' + cScale.toFixed(3) +
              ') rotate(' + custSway.toFixed(2) + ' 64 200)');
            /* 异界客：蓝光轮廓跟着呼吸；其它客种保持熄灭（setCustomer 也会写一次） */
            if (n.custAura) {
              n.custAura.setAttribute('opacity',
                custLook === 'outsider' ? (custLerp * (0.4 + 0.12 * Math.sin(t * 1.8))).toFixed(3) : '0');
            }
            if (n.custRing) {
              n.custRing.setAttribute('opacity',
                custLook === 'outsider' ? (custLerp * (0.28 + 0.1 * Math.sin(t * 1.3 + 1))).toFixed(3) : '0');
            }
            if (n.custRimGlow) {
              n.custRimGlow.setAttribute('opacity',
                custLook === 'outsider' ? (custLerp * (0.22 + 0.08 * Math.sin(t * 1.8))).toFixed(3) : '0');
            }

            /* 货品：新解锁的淡入、售罄的淡出（display 由 setStock 管，这里只推不透明度） */
            for (var gi = 0; gi < ITEMS.length; gi++) {
              var gk = ITEMS[gi].k, ga = goodsA[gk];
              if (ga === goodsTgt[gk]) continue;
              ga = lerp(ga, goodsTgt[gk], Math.min(1, f * 1.8));
              if (Math.abs(ga - goodsTgt[gk]) < 0.01) ga = goodsTgt[gk];
              goodsA[gk] = ga;
              if (goods[gk]) goods[gk].setAttribute('opacity', ga.toFixed(2));
            }

            n.coinFx.setAttribute('opacity', (Date.now() < coinFxT ? (0.6 + 0.4 * Math.sin(t * 9)).toFixed(2) : '0'));
            n.zzz.setAttribute('opacity', state === 'doze' ? (0.5 + 0.4 * Math.sin(t * 1.6)).toFixed(2) : '0');
            n.zzz.setAttribute('transform', 'translate(0,' + (-Math.sin(t * 1.3) * 2).toFixed(2) + ')');

            /* 烛台：火苗不跳（之前一直在抖，看着烦），只留一圈很淡的暖光 */
            if (decor.candle && n.flameHalo) n.flameHalo.setAttribute('opacity', '0.2');

            /* 水晶吊灯：光晕轻微呼吸 */
            if (decor.chand && n.chandHalo) {
              n.chandHalo.setAttribute('opacity', (0.14 + 0.05 * Math.sin(t * 1.1)).toFixed(3));
            }

            /* 传送门：光在缓缓涌动 */
            if (decor.portal && n.portalGlow) {
              n.portalGlow.setAttribute('opacity', (0.11 + 0.05 * Math.sin(t * 1.6)).toFixed(3));
              n.portalGlow.setAttribute('rx', (15 + Math.sin(t * 1.6) * 1.2).toFixed(2));
            }

            /* 店猫：眨眼 / 舔爪 / 打哈欠 / 偶尔挪个位置；打烊之后睡 */
            if (decor.cat && n.catBody) catTick(t);

            for (var m = 0; m < motes.length; m++) {
              var p = motes[m];
              p.y -= p.sp * dt * 3;
              p.x += Math.sin(t * 0.6 + p.ph) * 0.15;
              if (p.y < 6) { p.y = 196; p.x = rnd() * 320; }
              p.el.setAttribute('cx', p.x.toFixed(1));
              p.el.setAttribute('cy', p.y.toFixed(1));
            }

            tickScene(dtS);   /* v0.11c：雨/雪/纸屑/过场 —— 低频写属性 */
            applyLight();
          }

          function setState(name, instant) {
            if (!POSES[name]) return;
            state = name;
            target = POSES[name];
            if (instant) {
              Object.keys(BASE).forEach(function (k) {
                if (Array.isArray(BASE[k])) { cur[k][0] = target[k][0]; cur[k][1] = target[k][1]; }
                else cur[k] = target[k];
              });
            }
          }

          return {
            render: render,
            setState: setState,
            /* v0.13.1 调试/截图用：把某个等客小动作钉住（1 擦柜台 / 2 搓手 / 3 翻账本 / 4 打哈欠，0 = 放开）。
             * 只在预览与验收截图里用，正常调度仍然走 idleGap 那条链。 */
            setIdleAct: function (a) { idleHold = a | 0; idleAct = idleHold; idleActT = idleHold ? idleDur(idleHold) * 0.42 : 0; },
            setStock: setStock,
            setUnlocked: setUnlocked,
            get unlocked() { return unlockedAll ? null : Object.assign({}, unlocked); },
            get unlockedAll() { return unlockedAll; },
            setGold: drawCoins,
            /* 只写 clockHour 的话，没开 rAF 的宿主（如 click-test 的 noLoop）永远看不到天色变化 */
            setClock: function (h) { clockHour = ((h % 24) + 24) % 24; applyLight(); },
            /* v0.11c 场景侧 C：天气 / 节日 / 升级过场（逻辑侧接线用） */
            setWeather: setWeather,
            setFestival: setFestival,
            playInstall: playInstall,
            get weather() { return weather; },
            get festival() { return festivalOn; },
            get installing() { return instT > 0; },
            setCustomer: function (on, kind) {
              custOn = !!on;
              /* v0.11：进店/离店各走一段动画。重复 setCustomer(true) 不会把已站定的客人拽回门口；
               * 客人在门口/正走出去时又来一单，就从当前位置接着往回走。 */
              if (custOn) {
                if (custPhase === 'out') { custP = 0; custPhase = 'enter'; custPhaseT = 0; }
                else if (custPhase === 'leave') { custPhase = 'enter'; custPhaseT = 0; }
              } else if (custPhase === 'enter' || custPhase === 'stand') {
                custPhase = 'leave'; custPhaseT = 0;
              }
              /* kind 省略时回退 default：v0.7 是 CUSTOMERS[kind] || default，这里保持同一语义 */
              custKind = kind == null ? 'default' : String(kind).toLowerCase();
              var look = customerLook(custKind);
              custLook = look.look;
              /* 斗篷三色 + 轮廓：每类客写全，别让上一类客的配色留在场上 */
              if (n.custHood) {
                n.custHood.setAttribute('fill', look.fill);
                n.custHood.setAttribute('opacity', look.alpha == null ? '1' : String(look.alpha));
              }
              if (n.custRim) {
                n.custRim.setAttribute('stroke', look.rim);
                n.custRim.setAttribute('stroke-width', look.rimW == null ? '2' : String(look.rimW));
                n.custRim.setAttribute('opacity', look.rimOp == null ? '.58' : String(look.rimOp));
              }
              if (n.custCollar) n.custCollar.setAttribute('stroke', look.collar);
              CUST_GROUPS.forEach(function (pr) {
                var g = n[pr[1]];
                if (g) g.setAttribute('display', look.look === pr[0] ? 'inline' : 'none');
              });
              if (n.custAura) n.custAura.setAttribute('opacity', look.look === 'outsider' ? '.45' : '0');
              if (n.custRing) n.custRing.setAttribute('opacity', look.look === 'outsider' ? '.35' : '0');
              if (n.custRimGlow) n.custRimGlow.setAttribute('opacity', look.look === 'outsider' ? '.22' : '0');
            },
            event: event,
            /* 装饰开关：{shelf4, cat, candle, glass, chand, sign, portal,
             *            board, counter, stool, bell, vault, icebox, awning,
             *            accounts, salt, lamp, mat, tallglass, clock, cellar} 里为真的项显示出来 */
            setDecor: function (map) {
              decor = map || {};
              var pairs = [['shelf4', 'shelf4G'], ['cat', 'catG'], ['candle', 'candleG'],
                           ['glass', 'glassG'], ['chand', 'chandG'], ['sign', 'signG'], ['portal', 'portalG'],
                           /* v0.8 新增 6 件；bell 是门铃，组 id 用 doorbellG 免得撞柜台上那只 bellG */
                           ['board', 'boardG'], ['counter', 'counterInlayG'], ['stool', 'stoolG'],
                           ['bell', 'doorbellG'], ['vault', 'vaultG'], ['icebox', 'iceboxG'],
                           /* v0.13 装修「檐下挡雨棚」：widget 传 awning:!!data.upgrades.awning */
                           ['awning', 'awningRainG'],
                           /* 装修补件 7 件：旧账本 / 盐线 / 油灯 / 草席 / 穿衣镜 / 座钟 / 地窖门 */
                           ['accounts', 'ledgerG'], ['salt', 'saltG'], ['lamp', 'oilLampG'],
                           ['mat', 'matG'], ['tallglass', 'mirrorG'], ['clock', 'clockG'],
                           ['cellar', 'cellarG']];
              pairs.forEach(function (pr) {
                var g = n[pr[1]];
                if (g) g.setAttribute('display', decor[pr[0]] ? 'inline' : 'none');
              });
              /* 第 4 级的货要等买了第四层货架才上架 —— 交给 setStock 统一判定 */
              setStock(lastStock || {});
            },
            get decor() { return decor; },
            /* 场所等级 0..4：地摊 → 木棚 → 小铺 → 商铺 → 商会 */
            setTier: function (t) {
              tier = Math.max(0, Math.min(4, t | 0));
              var on = function (g, v) { if (g) g.setAttribute('display', v ? 'inline' : 'none'); };
              on(n.stallG, tier === 0);
              on(n.awningG, tier === 1 || tier === 2);
              on(n.upperG, tier >= 4);
              on(n.counterTopG, tier >= 1);
              on(n.deskFront, tier >= 1);
              on(n.shelfG, tier >= 1);
              /* 0 档没有货架（货摆在地摊上），板沿那条夜光也不该浮在空中 */
              on(n.nAmbShelfG, tier >= 1);
              on(n.winG, tier >= 2);
              on(n.lampG2, tier >= 3);
              on(n.shopCloth, tier >= 2);
              on(n.wallSword, tier >= 2);
              on(n.wallShield, tier >= 2);
              /* v0.11 五档空间语言：地面材质 / 门窗 / 墙面 / 台面 / 台脸。
               * 全部只在建好的节点上切 display —— 不重建 DOM、不闪、节点引用不变。 */
              on(n.floorDirtG, tier === 0);        /* 泥地（碎石 + 车辙） */
              on(n.floorWoodG, tier === 1);        /* 木地板 */
              on(n.floorBrickG, tier === 2);       /* 错缝石砖 */
              on(n.floorMosaicG, tier === 3);      /* 拼花石 */
              on(n.floorMarbleG, tier >= 4);       /* 大理石 + 抛光 */
              on(n.apHoleG, tier === 0);           /* 0 档只有破门洞 */
              on(n.apClothG, tier === 1);          /* 1 档挂补丁布帘；2 档起才换成真窗 winG */
              on(n.wallRoughG, tier <= 1);         /* 粗石墙 + 裂缝 + 木梁 */
              on(n.wallTapestryG, tier >= 2);      /* 挂毯 */
              on(n.wallSconceG, tier >= 3);        /* 壁灯 */
              on(n.wallNicheG, tier >= 4);         /* 墙上货架 */
              on(n.ctPlankG, tier === 1); on(n.cfPlankG, tier === 1);   /* 木板钉的简陋柜台 */
              on(n.ctClothG, tier === 2); on(n.cfClothG, tier === 2);   /* 台布柜台 */
              on(n.ctCarveG, tier >= 3); on(n.cfCarveG, tier >= 3);     /* 雕花实木柜台 */
              /* v0.11b 顶部收口（每档都有上沿）+ 4 档专属记号 */
              on(n.ceilShadeG, tier === 0);        /* 0 档没屋顶：只压一层天花板暗影 */
              on(n.corniceG, tier === 3);          /* 3 档木檐口 + 齿饰 */
              on(n.corniceGoldG, tier >= 4);       /* 4 档包金檐口：商会一眼看出来 */
              on(n.cfGiltG, tier >= 4);            /* 4 档柜台包铜 + 铜钉 */
              /* v0.13 夜灯：灯数按档走（0 档提灯 / 1+ 台面油灯 / 2+ 再一支蜡烛 / 3+ 壁灯 / 4 楼上），
                 亮多少由 applyLight 按小时算，这里只管「这一档有没有这盏灯」。 */
              on(n.nightStallLanG, tier === 0);
              on(n.nightCounterG, tier >= 1);
              on(n.nightCounter2G, tier >= 2);
              on(n.nightSconceG, tier >= 3);
              on(n.nightUpperG, tier >= 4);
              /* 货架只在 1、2 级露出一层／两层，商铺起全露 */
              if (n.shelfG) {
                var rows = tier >= 2 ? 3 : 2;
                var boards = n.shelfG.querySelectorAll('rect');
                for (var i = 0; i < boards.length; i++) {
                  var y = parseFloat(boards[i].getAttribute('y'));
                  if (isNaN(y) || y < 40) continue;
                  boards[i].style.display = (y <= (40 + (rows - 1) * 26 + 0.5)) ? '' : 'none';
                }
              }
              /* 地摊：货直接摆在地上那块板子上 */
              if (n.goodsG) {
                n.goodsG.setAttribute('transform', tier === 0 ? 'translate(4 102)' : '');
              }
              setStock(lastStock || {});
              applyLight();   /* 窗出现了／消失了，光斑要立刻跟着变 */
            },
            get tier() { return tier; },
            get state() { return state; },
            get clock() { return clockHour; },
            /* v0.14 四季：0 春 / 1 夏 / 2 秋 / 3 冬（非法值按 0）；只切预建组的 display */
            setSeason: setSeason,
            get season() { return season; },
            nodes: n,
            ITEMS: ITEMS,
            POSES: POSES
          };
        }

        window.MagicShopScene = {
          createScene: createScene,
          POSES: POSES,
          ITEMS: ITEMS,
          ITEM_BY_KEY: ITEM_BY_KEY,
          CUSTOMERS: CUSTOMERS,
          /* v0.6 货币：面值表 + 两套图标（卡片 HTML / 场景 SVG） */
          COINS: COINS,
          COIN_BY_K: COIN_BY_K,
          coinUnit: coinUnit,
          coinIcon: coinIcon,
          coinUse: coinUse
        };
      })();


    /* ===== src/lore.js ===== */
      /*
       * 冒险魔法商店 · 文案包（纯数据 + 纯函数）
       *
       * v0.13：商品小传、常客名册与口头禅、六类客成交台词、里程碑、通关小结。
       * v0.14：心愿（DREAMS）、城建（TOWN）、成就（ACHIEVEMENTS）、打烊独白（CLOSE_LINES）。
       * 这里只有字和纯函数：不碰 DOM、不读 localStorage、不发请求、不依赖 scene.js / widget.js。
       * 语气跟店里一致——店主视角，平实，偶尔冷一点；不写鸡汤，不写网文腔。
       *
       * 对外：window.MagicShopLore = { VER, ITEM_LORE, REG_NAMES, REG_QUIP, REG_STORY, REG_STORY_AT,
       *                               CUST_LINES, CUST_ENTER, CUST_BROWSE, CUST_EMPTY,
       *                               WEATHER_LINES, DAILY_LINES, QUEST_LINES, EVENT_LINES, MILESTONES,
       *                               DREAMS, TOWN, ACHIEVEMENTS, CLOSE_LINES, endCard }
       *
       * MILESTONES 的 at 是「该条 id 对应那个计数」的门槛值，读取方自己知道 id 指哪一项：
       *   first_sale  成交单数   orders_10  成交单数   items_100  卖出件数
       *   broke_first 金币归零次数 clear_first 通关次数  gen_2      代数
       *   gold_10k    累计金币（铜）  days_30    营业天数
       *
       * endCard(stats) 返回字符串数组，每项一行（3–5 行），调用方自己 join('\n') 或逐行 addLog。
       * stats = { generation, days, totalGold, bestItem, regulars: [name] }，缺字段一律容错。
       */
      (function () {
        'use strict';

        /* ---------------- 12 件货的小传（键与 scene.js 的货类一致） ---------------- */
        var ITEM_LORE = {
          potion: '草药味很冲，喝下去伤口先热后麻，第二天照常下地。',
          mana: '瓶底总有一层沉渣，法师说那是药效，学徒说那是沙子。',
          scroll: '念错一个音节会把眉毛烧掉，念对了只烧别人的眉毛。',
          dagger: '柄上缠过三回布，前两任主人一个没回来，一个没敢回来。',
          wand: '橡木杖是自己长歪的，巫师说这算留过记号。',
          helm: '面甲上有一道补痕，原来的主人没来得及说明来历。',
          shield: '盾面的漆掉了大半，剩下的那点还能看出是谁家的纹。',
          orb: '问它问题它不答，只在你要走的时候亮一下。',
          tome: '前后各缺十几页，缺的那部分据说在一个更冷的地方。',
          rune: '摸上去比周围的石头凉，搁久了会在柜台上留个印。',
          star: '白天是灰的，夜里自己亮；谁装的砂，没人说得清。',
          scale: '边缘还带着烧焦的痕迹，卖它的人不肯说是哪来的。'
        };

        /* ---------------- 30 位常客的名字（小镇上叫得出口的那种） ---------------- */
        var REG_NAMES = [
          '磨坊主奥托', '缝补匠莉安', '守夜人巴托', '草药婆伊丝', '独脚汉格里姆',
          '面包师奈达', '提灯人科尔', '书记官佩兰', '猎户丘恩', '河渡人塔姆',
          '修钟匠老维克', '卖炭的塞德', '执事莫兰', '赌坊老板奎因', '牧羊女拉克',
          '铁匠学徒菲恩', '掘墓人哈罗', '香料商娜吉', '琴手雷欧', '屠户布兰',
          '渡口寡妇蒂娜', '井匠戈多', '信使薇恩', '磨刀人斯图', '药剂学徒洛可',
          '城墙看守凯尔', '皮匠奥姆', '拾荒婆葛蕾', '军械匠杜兰', '网鱼人赛普'
        ];

        /* 每人一句口头禅：不解释来历，只让人听出是谁 */
        var REG_QUIP = {
          '磨坊主奥托': '风大的日子，面粉比钱好使。',
          '缝补匠莉安': '你这围裙，线头都开了。',
          '守夜人巴托': '夜里谁敲你的门，别开。',
          '草药婆伊丝': '药钱可以先欠，命不行。',
          '独脚汉格里姆': '少条腿，砍价可不能少。',
          '面包师奈达': '隔夜的面包硬，能当砖用。',
          '提灯人科尔': '灯油涨价了，我照旧走夜路。',
          '书记官佩兰': '我只记数，不记人情。',
          '猎户丘恩': '林子里的东西比人讲道理。',
          '河渡人塔姆': '过河两个铜，回头再算。',
          '修钟匠老维克': '钟慢了能修，人慢了不能。',
          '卖炭的塞德': '我的手黑，钱是白的。',
          '执事莫兰': '赎罪要捐，买东西另算。',
          '赌坊老板奎因': '手气是假的，账是真的。',
          '牧羊女拉克': '羊不吃这个，我买回去自己试。',
          '铁匠学徒菲恩': '师父说别乱花钱，我听听。',
          '掘墓人哈罗': '这行不景气，但总有人来。',
          '香料商娜吉': '闻过这个，你就回不去了。',
          '琴手雷欧': '曲子免费，酒钱你出。',
          '屠户布兰': '刀要快，账要清，别赊。',
          '渡口寡妇蒂娜': '河不讲价，我也不讲。',
          '井匠戈多': '底下有水，上面有人。',
          '信使薇恩': '信送到了，人还没到。',
          '磨刀人斯图': '钝了拿来，别自己硬磨。',
          '药剂学徒洛可': '师父让我买，钱我垫着。',
          '城墙看守凯尔': '门开不开，看天色，我看人。',
          '皮匠奥姆': '这块皮，摸过就忘不掉。',
          '拾荒婆葛蕾': '你们扔的，我都见过。',
          '军械匠杜兰': '兵器不讲交情，只讲趁手。',
          '网鱼人赛普': '河里今天没开口，我先开口。'
        };

        /* ---------------- 六类客的成交台词（每类 5 句，按客种分） ---------------- */
        var CUST_LINES = {
          villager: [
            '就要这瓶，别的看不着。',
            '便宜两个铜，我常来。',
            '这价钱，我娘要骂人。',
            '包起来，我赶着回去。',
            '你说的我都信，多少钱？'
          ],
          merc: [
            '成套拿，省得再跑。',
            '结实就行，好看其次。',
            '多来一件，队里缺。',
            '这价公道，我认。',
            '能挡一刀，就值。'
          ],
          rogue: [
            '别问来路，多少钱？',
            '便宜的，我全要。',
            '你这价，比我还黑。',
            '账别记，钱现给。',
            '下次给你带点东西。'
          ],
          mage: [
            '成分写清楚了吗？',
            '这东西，会炸吗？',
            '多买一件，备着。',
            '价不是问题，来源是。',
            '我要的是稳，不是便宜。'
          ],
          noble: [
            '这个，包三层纸。',
            '价钱不用报，直接算。',
            '成色，勉强能看。',
            '送人，别丢了体面。',
            '下次上新，先通知我。'
          ],
          outsider: [
            '你们这里的钱，收吗？',
            '这个世界的火，真安静。',
            '我要的，你未必懂。',
            '多给一件，我不还价。',
            '门开的时候，我会走。'
          ]
        };

        /* ---------------- 客人三个阶段的话（进店 / 看货 / 空手走） ----------------
           一类客一天里可能只说一句：进门招呼、上手摸货、没买就退场。
           空手走的那几句不埋怨店主——没买是客人自己的事。 */
        var CUST_ENTER = {
          villager: [
            '有人吗？我进来看看。',
            '这天说变就变，进来躲躲。',
            '我不买东西，就看看。',
            '听说你这儿东西全。'
          ],
          merc: [
            '老板，护具在哪儿？',
            '先看货，价钱后说。',
            '队里让我来采买。',
            '门口那匹马是我的。'
          ],
          rogue: [
            '别抬头，看货就行。',
            '我时间不多，快点。',
            '后门通哪儿？随口问的。',
            '你这儿收旧东西吗？'
          ],
          mage: [
            '我需要安静地看看。',
            '听说你这儿有旧书。',
            '先别招呼我，我认认货。',
            '这里的味道很杂。'
          ],
          noble: [
            '这地方，比我想的窄。',
            '把最好的拿出来。',
            '我只看，不碰你的货。',
            '门口那位是我的随从。'
          ],
          outsider: [
            '你们这儿，有光吗？',
            '我不太会说你们的价。',
            '这个门，是自己开的吗？',
            '我需要一件能带走的东西。'
          ]
        };

        var CUST_BROWSE = {
          villager: [
            '这个摸起来挺沉。',
            '这件的边角磕了。',
            '这个能用上几年？',
            '我掂掂，不买也行吧。'
          ],
          merc: [
            '这刃口，磨过几回？',
            '这扣子，结实吗？',
            '重量合适，就是贵。',
            '我试试手感，行吗？'
          ],
          rogue: [
            '这锁，开过没有？',
            '便宜的那堆在哪儿？',
            '这个拿起来不扎手。',
            '我闻着有股旧味。'
          ],
          mage: [
            '这纹路是手刻的。',
            '让我翻过来看看背面。',
            '这成色比上次的好。',
            '别晃它，它会响。'
          ],
          noble: [
            '上面有指印，擦一下。',
            '这件配我的壁炉。',
            '还有更旧一点的吗？',
            '轻了点，但还行。'
          ],
          outsider: [
            '它在动，你看见了吗？',
            '这个世界的铁，很冷。',
            '我摸不出它的年纪。',
            '这个，我认得一半。'
          ]
        };

        var CUST_EMPTY = {
          villager: [
            '今天先不买了，钱紧。',
            '下回吧，我记着。',
            '回去问问家里再说。',
            '再看看，别处也逛逛。'
          ],
          merc: [
            '这批不合用，走了。',
            '队里等着，下次来。',
            '先去别家比比价。',
            '货留下，我改天。'
          ],
          rogue: [
            '今天手气不太好。',
            '没看中的，算了。',
            '我改天再来一趟。',
            '东西不错，就是贵。'
          ],
          mage: [
            '看来还不到时候。',
            '我先回去查查书。',
            '这批不合我的配方。',
            '下次带够钱再来。'
          ],
          noble: [
            '这里没有一件合适的。',
            '那我去别处看看。',
            '东西留着，人先走。',
            '不急，我再慢慢挑。'
          ],
          outsider: [
            '看来那扇门还没开。',
            '我下次带别的东西来。',
            '这里不是我要找的。',
            '我记住这个地方了。'
          ]
        };

        /* ---------------- 8 个里程碑（at 的口径见文件头注释） ---------------- */
        var MILESTONES = [
          { id: 'first_sale', at: 1, title: '首单', line: '第一笔钱进袋，你把它单独搁在一边。' },
          { id: 'orders_10', at: 10, title: '十单', line: '第十个客人走后，你才想起该记个账。' },
          { id: 'items_100', at: 100, title: '百件', line: '卖出去第一百件，货架终于空出一格。' },
          { id: 'broke_first', at: 0, title: '见底', line: '钱袋见底，你把最后一枚铜板翻了个面。' },
          { id: 'clear_first', at: 1, title: '开成了', line: '这条街只剩你一间还亮着灯，你却睡不着。' },
          { id: 'gen_2', at: 2, title: '第二代', line: '招牌重新刷过一遍，字比上一代端正。' },
          { id: 'gold_10k', at: 10000, title: '一金', line: '攒够一金那天，你没舍得花。' },
          { id: 'days_30', at: 30, title: '满月', line: '开门满三十天，门槛被踩出一道浅坑。' }
        ];

        /* ---------------- 常客长线（聊熟） ----------------
           同一位来第 3 / 6 / 10 次，依次解锁 REG_STORY[name] 的三段：
           第 1 段还是客套，第 2 段开始抱怨日子，第 3 段说一句只说给熟人听的话。
           只写 20 位，其余常客不出现——名单不够也不该硬凑，没聊熟就是没聊熟。 */
        var REG_STORY = {
          '磨坊主奥托': [
            '你这店开在路口，风大，招牌也不换一个。',
            '今年水小，磨盘转半圈就停，面粉卖不出价。',
            '我爹留下的石磨，我怕哪天转不动了，就真没东西留给他。'
          ],
          '缝补匠莉安': [
            '听说你这儿的东西不便宜，我先看看再说。',
            '裁一件衣裳才三个铜，线还得我自己掏。',
            '我给人缝了三十年，自己的嫁衣还在箱底压着。'
          ],
          '守夜人巴托': [
            '这个点还开着，真少见。我就随便看看。',
            '巡到后半夜，腿还是自己的，脑子不是。',
            '上个月那盏灯灭了，我没敢跟人说，自己又点上了。'
          ],
          '草药婆伊丝': [
            '年轻人，你这药水的成色，我看不太懂。',
            '今年苦根收得少，连熬药的柴都跟着涨价。',
            '我这一屋子药，治得好别人，治不好我自己。'
          ],
          '独脚汉格里姆': [
            '不必招呼，我自己看，看中了自会开口。',
            '这条腿是打仗换的，抚恤金半年没发了。',
            '我每天路过你这儿，就想听听有人在说话。'
          ],
          '面包师奈达': [
            '来早了，我炉子还没熄，顺路进来看看。',
            '面粉涨了三回，面包我不敢涨，怕没人买。',
            '我总想着哪天关了铺子，又怕街坊早上没得吃。'
          ],
          '提灯人科尔': [
            '借个火，顺便看看你柜台上摆的那些货。',
            '灯油又贵了，我这份差事，越干越像白干。',
            '我点了一辈子灯，最怕的是哪天没人需要灯。'
          ],
          '书记官佩兰': [
            '先登记一下，我买的东西回去都要入册。',
            '上头要的数目一年比一年多，纸却一年比一年薄。',
            '我记了半城人的名字，自己那份，一直空着。'
          ],
          '猎户丘恩': [
            '有结实的绳子吗？没有的话我下回再来。',
            '开春到现在，林子里能打的越来越少了。',
            '我在林子里待得比在家久，回去反倒睡不着。'
          ],
          '河渡人塔姆': [
            '我是摆渡的，路过。你这儿有什么能带的？',
            '水涨水落，客人一天多一天少，全看天。',
            '我撑了二十年船，最怕的不是翻船，是岸上没人等。'
          ],
          '修钟匠老维克': [
            '你这店里的钟慢了两分，我听着就不对。',
            '现在没人修钟了，坏了就换，换不起就扔。',
            '我修得好所有的钟，修不好自己那口气。'
          ],
          '卖炭的塞德': [
            '我的手黑，不碰你的货，站着看看就走。',
            '冬天一年比一年短，炭却一年比一年难卖。',
            '烧了半辈子炭，我自己屋里，从来没生过火。'
          ],
          '执事莫兰': [
            '愿你有福。我只是顺路来清点一下货色。',
            '教会的屋顶漏了半年，捐的钱都去补别人的墙了。',
            '我替人念了三十年经，自己的那本，没翻开过。'
          ],
          '赌坊老板奎因': [
            '别紧张，我今天不赌，只是来买点东西。',
            '手气这东西，赢的时候信，输的时候骂。',
            '我这行当，最怕夜里安静，一安静就想起欠谁的。'
          ],
          '牧羊女拉克': [
            '羊拴在门外，我进来看看货，很快就好。',
            '今年狼多，羊少，牧草也不够，什么都没涨。',
            '我爹说女孩子别放羊，我说羊比人老实。'
          ],
          '铁匠学徒菲恩': [
            '师父让我来的，说你这儿的东西都结实。',
            '打了三年铁，工钱还是那句「再等等」。',
            '我想自己开一间，又怕师父知道了伤心。'
          ],
          '掘墓人哈罗': [
            '打扰了，我身上有土味，站门口看看就行。',
            '这活计不看天气，只看城里死了多少人。',
            '我挖了半辈子坑，只盼自己那个，别太早用上。'
          ],
          '香料商娜吉': [
            '你这儿有能压住味道的东西吗？我急用。',
            '商队半年没来，我柜子里那点存货快见底了。',
            '我闻得出所有人的心事，唯独闻不出自己的。'
          ],
          '琴手雷欧': [
            '我给你弹上一曲，抵掉一半账，行不行？',
            '酒馆换了老板，我这几支曲子没人点了。',
            '我写了首新曲子，只弹给听得懂的人，你是第三个。'
          ],
          '屠户布兰': [
            '有刀卖吗？我这把钝了，先看看你家的。',
            '肉价压得厉害，我这把刀三年没舍得换。',
            '我切了一辈子肉，最怕听见有人说「少切点」。'
          ]
        };

        /* 解锁节奏：来第 3 / 6 / 10 次，依次给 REG_STORY[name][0..2] */
        var REG_STORY_AT = [3, 6, 10];

        /* 委托交差时店主的自言自语：钱是赚到了，人是累亏了 */
        var QUEST_LINES = [
          '委托办完了，赏钱还不够补货。',
          '客人要的东西，我总算没搞错。',
          '这一单跑断腿，账上多两行字。',
          '我算过了，帮忙比卖货费神。',
          '委托单上没写要跑这么多趟。',
          '事办成了，人累得像被搬过。',
          '赏钱收下，欠的人情记着。',
          '下次这种活，我得先问价。',
          '忙完这一趟，能歇半天了吧。',
          '交差的时候，我笑得很勉强。'
        ];

        /* 街面事件：一个事件一句，路过的人说完就走 */
        var EVENT_LINES = {
          peddler: [
            '他从包袱里摸出一只锈铃铛，问你收不收。',
            '他说这趟走了六个城，只有你这儿还亮着灯。',
            '他临走塞给你半张旧地图，说用不上就烧了。'
          ],
          bard: [
            '他在门口拉了一段，风把调子吹散了一半。',
            '他唱到一半停了，说这歌还没写完。',
            '他收下两枚铜板，又添了一句新词。'
          ]
        };

        /* 看天的自言自语：键跟 widget 的天气 id 一致（sunny / overcast / rain / snow） */
        var WEATHER_LINES = {
          sunny: [
            '日头这么足，晒得货都发烫。',
            '晴天客人多，可我只想打盹。',
            '光从门缝里进来，灰尘都在飞。',
            '这么好的天，没人愿意进店。'
          ],
          overcast: [
            '天阴着，像谁欠了它一笔钱。',
            '云压得低，灯得早早点上。',
            '这种天，客人都懒得开口。',
            '阴天不出错，也不怎么出彩。'
          ],
          rain: [
            '雨点砸在招牌上，像在催账。',
            '下雨天，地板比客人先湿。',
            '雨一停，门槛就得擦一遍。',
            '这种天，最适合守着炉子发呆。'
          ],
          snow: [
            '雪落进门槛，化成一小滩水。',
            '下雪了，炉子得多添两块柴。',
            '雪把街上的脚印都盖平了。',
            '这种天，谁进门都带着一身白。'
          ]
        };

        /* 每日一句的补充（widget.js 里原有 44 条不动，这里只给新的 36 条） */
        var DAILY_LINES = [
          '南门的锁换了，钥匙还没配。',
          '有个孩子把铜板塞进了排水沟。',
          '西街的木匠接了个大活，敲到半夜。',
          '河里捞上来一只没有底的桶。',
          '有人在教堂门口站了一下午。',
          '面包房今天多烤了一炉，卖不完。',
          '巡夜的人换了条路线，绕开了酒馆。',
          '马厩里多了一匹没人认领的马。',
          '城墙上的旗子换了颜色。',
          '有个老人在数自己剩下的牙。',
          '雨停之后，屋檐还在滴水。',
          '巷口新开了个摊子，卖旧钉子。',
          '有人把一封信读了三遍才烧。',
          '钟楼的钥匙丢了，暂时不响。',
          '一只乌鸦在招牌上站了很久。',
          '药铺的秤被人调过，掌柜没吭声。',
          '城外的路塌了一段，车绕行。',
          '有人在井边洗一双很旧的靴子。',
          '酒馆后院多了三只猫。',
          '有个学徒把师父的袍子烧了个洞。',
          '夜里有人敲门，敲了三下就走了。',
          '集市的秤今天查得特别严。',
          '教堂的蜡烛短了一截，没人承认。',
          '北门来了个不肯下马的人。',
          '巷子里晾着的衣服少了一件。',
          '有人用粉笔在墙上画了个圈。',
          '磨坊的水轮卡住了，转了半圈。',
          '城里的更夫今天早收了一个时辰。',
          '有个猎人把弓当了，又赎回去。',
          '河对岸的灯今晚多了一盏。',
          '铁匠接了把怪刀，没问用途。',
          '有人在数仓库里剩下的麻袋。',
          '广场的石板换了一块新的。',
          '酒馆的账本上多了个不认得的名字。',
          '夜里下过霜，草都白了。',
          '有个陌生人问起这间店开了多久。'
        ];

        /* ---------------- 20 条心愿 ----------------
           一个人开口求你办一件事。ask 是他说的那句话，done 是办成之后他的反应，
           after 是往后再进门时偶尔冒出的一句回响。
           cost 只有六档，越贵越少：60000 一条、28000 两条、14000 两条、7000 四条、
           4000 五条、2000 六条，二十条合计二十万零四千。
           who 一律取 REG_NAMES，二十位各占一条，都是 REG_STORY 里说过心事的人。 */
        var DREAMS = [
          {
            id: 'd01', who: '修钟匠老维克', title: '走得慢半分的钟', cost: 30000,
            ask: '给我弄个机芯，走得比别家慢半分的那种。日子过得太快，我修不过来。',
            done: '他把机芯装进一只旧壳子，挂在铺子最里头。说这下钟点和人都不催他了。收钱时数了两遍，一枚没少。',
            after: '他说铺子里那口钟，还是慢半分。'
          },
          {
            id: 'd02', who: '执事莫兰', title: '自己那本经', cost: 30000,
            ask: '有没有一本……是给自己念的？教会那本我念了三十年，都是替别人念。',
            done: '他挑了本最旧的，翻开第一页念了一句就合上。走的时候把书抱在胸前，没让我包。',
            after: '他现在进门先看书架，不看货。'
          },
          {
            id: 'd03', who: '牧羊女拉克', title: '羊听得见的铃', cost: 30000,
            ask: '给我个铃铛，羊听得见的那种。今年狼多，丢了三只，我嗓子也喊哑了。',
            done: '铃铛挂上头羊的脖子上，一群走起来叮当响。她说这下找羊不用喊了，能省着点嗓子。',
            after: '她说今年一只没丢，说的时候在数手指。'
          },
          {
            id: 'd04', who: '香料商娜吉', title: '闻不见的味道', cost: 30000,
            ask: '我什么味都闻得出，就是闻不出自己。有那种香吗——能让我闻见我自己。',
            done: '她试了七种，最后拿走最不起眼的那瓶，说闻着像小时候的院子。走时没还价，也没说谢。',
            after: '她身上换了味道，别人都说不出是什么。'
          },
          {
            id: 'd05', who: '琴手雷欧', title: '一副不跑调的弦', cost: 30000,
            ask: '给我一副弦，好点的。我这把琴跑调跑得连我自己都听不下去。',
            done: '他当场换上，弹了半支曲子就停手，说这回准了。旧弦绕成一圈收进袋里，说留着备。',
            after: '他说酒馆又开始点他那支曲子了。'
          },
          {
            id: 'd06', who: '屠户布兰', title: '一把不用再磨的刀', cost: 30000,
            ask: '给我把刀，能切就行，别花哨。我这把三年没换了，钝得厉害。',
            done: '他在门槛上试了试刃，说行。回去路上把旧刀扔进了河里，没回头。',
            after: '他说最近没人跟他讲价。'
          },
          {
            id: 'd07', who: '磨坊主奥托', title: '石磨再转一年', cost: 60000,
            ask: '那盘磨是我爹留下的，今年水小，转半圈就停。你有没有办法让它再转一年？',
            done: '他把新磨齿抬回去，装上试了半圈，面粉下来得很匀。走时把磨坊钥匙在我柜台上放了放，什么也没说。',
            after: '风大的日子，他门口的面粉袋比去年多一只。'
          },
          {
            id: 'd08', who: '面包师奈达', title: '一炉出两屉', cost: 60000,
            ask: '炉子老了，一炉只出十二个。有没有那种炉心，能让一炉出两屉？',
            done: '新炉心装上那天，她烤了三炉，卖到晌午就空了。剩下两个塞给我，说算试吃，不算钱。',
            after: '早上路过，她门口排队的人多了一个。'
          },
          {
            id: 'd09', who: '猎户丘恩', title: '躺着听见林子', cost: 60000,
            ask: '有没有东西，让人躺着也能听见林子？我在屋里睡不着，回了林子才睡得着。',
            done: '他拿回去挂在床头，说夜里风一吹，像树在响。第二回来，眼下没那么黑了。',
            after: '他说最近在家能睡到天亮。'
          },
          {
            id: 'd10', who: '卖炭的塞德', title: '自己屋里的火', cost: 60000,
            ask: '我烧了半辈子炭，屋里没生过火。给我弄个不呛人的炉子，小的就行。',
            done: '他把炉子搬回去，第二天来说烧了半筐。说这话时手还是黑的，脸上没什么表情。',
            after: '他说今年冬天，屋里能坐人了。'
          },
          {
            id: 'd11', who: '铁匠学徒菲恩', title: '自己的第一把锤', cost: 60000,
            ask: '我想打一把自己的锤子，可好铁都在师父库里。你这儿有吗？钱我攒了两年。',
            done: '他把锤子打好，柄上刻了个歪歪的记号。说等开铺那天再用，现在还锁在箱底。',
            after: '他说师父最近让他掌锤了，别的没提。'
          },
          {
            id: 'd12', who: '缝补匠莉安', title: '箱底那件嫁衣', cost: 120000,
            ask: '我那件嫁衣在箱底压了三十年，线都脆了。你能让布自己长回去吗？',
            done: '她拿回去自己改了三处，改完穿着在店里站了一会儿。第二天照常给人缝衣裳，没提这事。',
            after: '她袖口多了一道新线，说是顺手缝的。'
          },
          {
            id: 'd13', who: '提灯人科尔', title: '自己会亮的灯', cost: 120000,
            ask: '有没有那种不用点、自己就亮的灯？我想挂一盏在没人走的那条巷子。',
            done: '他把灯挂在巷子尽头，那地方本来没人走。后来有人开始从那儿抄近路。',
            after: '他说那条巷子现在有脚步声了。'
          },
          {
            id: 'd14', who: '河渡人塔姆', title: '渡口的一盏灯', cost: 120000,
            ask: '渡口夜里黑，过河的人看不见岸。给我一盏亮得久的灯，挂在桩子上。',
            done: '灯挂上那晚，他撑了两趟夜船，说岸上有人朝灯走。他没提自己在等谁。',
            after: '他说现在收船晚半个时辰，也不觉得冷。'
          },
          {
            id: 'd15', who: '赌坊老板奎因', title: '夜里会响的东西', cost: 120000,
            ask: '有没有一晚上都在响的东西？别太吵，能盖住点动静就行。',
            done: '他拿走那只旧八音盒，第二天说响了一夜，睡得还行。钱给得比标价多，没让找。',
            after: '他说最近赌坊关得早。'
          },
          {
            id: 'd16', who: '守夜人巴托', title: '一盏不灭的灯', cost: 200000,
            ask: '路口那盏灯，上个月灭了，我没敢跟人说，自己又点上了。你能不能弄个不会灭的？',
            done: '新灯挂上去，他站在底下看了很久，没说话。第二晚巡夜，他特意绕了远路，从灯下过。',
            after: '他说灯还亮着，说这话时不看我。'
          },
          {
            id: 'd17', who: '书记官佩兰', title: '名册上的一行', cost: 200000,
            ask: '城里的名册我写了三十年，上面全是别人的名字。能不能……也给我留一行？',
            done: '他把那页纸裁得比别人的都齐，写了自己的名字，又描了一遍。合上册子时说，这样就算数了。',
            after: '他每次来都带着那本册子，不打开。'
          },
          {
            id: 'd18', who: '草药婆伊丝', title: '给自己熬的药', cost: 320000,
            ask: '有一样苦根，我自己舍不得买。你替我弄来，我熬一副试试。',
            done: '药熬好了，她分了三碗，自己只喝一碗。剩下两碗放在窗台上，说给路过的人。',
            after: '她咳嗽的时候会背过身去。'
          },
          {
            id: 'd19', who: '掘墓人哈罗', title: '给自己留块地', cost: 320000,
            ask: '城西那块坡地，我想先买下来。不用大，够躺就行。',
            done: '他把地契折了两折收进怀里，说这样心里踏实。走的时候步子比来时慢。',
            after: '他说那块地上种了两棵树。'
          },
          {
            id: 'd20', who: '独脚汉格里姆', title: '能走远路的腿', cost: 500000,
            ask: '给我弄条能走远路的腿，木头也行，别太响。抚恤金下个月到，我先欠着。',
            done: '他装上走了两步，又走回来，说声音还行。付钱时把抚恤金的欠条压在钱底下，我没收。',
            after: '他现在来得少了，说路上能走的地方多了。'
          }
        ];

        /* ---------------- 10 档城建（顺序固定，越往后越贵） ----------------
           line 是决定掏钱那一刻店主说的一句话，afterLine 是建成后留在城建列表里的一行结果。 */
        var TOWN = [
          {
            id: 't01', title: '修水渠', cost: 15000,
            line: '水渠不修，东头那口井到夏天就又咸了。这钱我出。',
            afterLine: '水渠通了，洗衣的婆娘们挪到了东头。'
          },
          {
            id: 't02', title: '立钟楼', cost: 30000,
            line: '没有钟，全城看日头过日子，误事的总是穷人。立一座。',
            afterLine: '钟楼立起来，全城第一次同时抬头。'
          },
          {
            id: 't03', title: '开学堂', cost: 55000,
            line: '学堂开起来，冬天的孩子至少有个去处。钱给了吧。',
            afterLine: '学堂开课那天，最小的那个孩子把门框上的灰摸了一遍。'
          },
          {
            id: 't04', title: '铺石板路', cost: 90000,
            line: '石板铺上，雨季就不用抬着货过泥了。我认这笔。',
            afterLine: '石板铺到店门口，推车的不用再抬了。'
          },
          {
            id: 't05', title: '修城墙', cost: 140000,
            line: '城墙塌的那一段，风一吹就掉土。修吧，别等出事。',
            afterLine: '城墙补上，夜里巡到那一段，脚步声实了。'
          },
          {
            id: 't06', title: '建义仓', cost: 210000,
            line: '荒年城里饿过人。建个义仓，粮放进去，钥匙两个人管。',
            afterLine: '义仓立起来，秋天第一车谷子进去，谁都没说话。'
          },
          {
            id: 't07', title: '修渡口', cost: 300000,
            line: '河上那条渡船，一年翻两回。修个渡口，桩子打到石头里。',
            afterLine: '渡口修好，船工第一次不用看天吃饭。'
          },
          {
            id: 't08', title: '开医馆', cost: 420000,
            line: '城里看病要跑三十里。请个郎中，药柜我来出。',
            afterLine: '医馆开门那天，门口排的队比集市还长。'
          },
          {
            id: 't09', title: '架廊桥', cost: 580000,
            line: '桥修成带顶的，雨季赶集的人就能在桥上躲一躲。',
            afterLine: '廊桥的木头还新，已经有人在上面歇脚了。'
          },
          {
            id: 't10', title: '立长明灯', cost: 800000,
            line: '把长街的灯都点上，每年灯油我出。夜里走的人，脚下能看见。',
            afterLine: '长街亮起来的第一夜，巡夜的人多走了两趟。'
          }
        ];

        /* ---------------- 36 条成就（替代通关） ----------------
           id 就是 cond，读档的一方按 cond 自己判条件；这里只给标题和账本边角上的那行字。
           四组各九条：经营、收藏、人情、见闻。 */
        var ACHIEVEMENTS = [
          /* 经营 */
          { id: 'first_sale', group: '经营', title: '第一枚铜板', cond: 'first_sale', line: '柜台上落下一枚铜板，我拿起来又放下，位置记住了。' },
          { id: 'orders_100', group: '经营', title: '一百单', cond: 'orders_100', line: '账本翻到第一百页，手有点酸，就写到这儿。' },
          { id: 'items_1000', group: '经营', title: '千件出手', cond: 'items_1000', line: '第一千件货出去，货架空了一排，补货单写了半张。' },
          { id: 'profit_day_100', group: '经营', title: '一天一百', cond: 'profit_day_100', line: '今天净落一百，比平时多两成，晚饭添了半碗。' },
          { id: 'gold_10000', group: '经营', title: '攒够一金', cond: 'gold_10000', line: '账上到一金，我数了三遍，还是那些。' },
          { id: 'debt_free_10', group: '经营', title: '十次还清', cond: 'debt_free_10', line: '第十回把欠账还上，账本那页终于可以划掉。' },
          { id: 'days_30', group: '经营', title: '开门满月', cond: 'days_30', line: '开门三十天，门槛磨出一道浅坑，扫不干净。' },
          { id: 'days_100', group: '经营', title: '百日老店', cond: 'days_100', line: '一百天。街坊进门不问新不新了，改问今天有什么。' },
          { id: 'best_price_500', group: '经营', title: '五百一件', cond: 'best_price_500', line: '一件货卖到五百，我报了价，客人没还，我反倒心虚。' },
          /* 收藏 */
          { id: 'tier_2', group: '收藏', title: '扩了半间', cond: 'tier_2', line: '墙往里推了半间，原来的门框留在原处，多出个凹口。' },
          { id: 'tier_max', group: '收藏', title: '落地窗', cond: 'tier_max', line: '窗子落地，街上的人能看见柜台，我也能看见他们。' },
          { id: 'items_12', group: '收藏', title: '十二种货', cond: 'items_12', line: '柜台上摆满十二种，闭着眼也摸得出哪个是哪个。' },
          { id: 'deco_13', group: '收藏', title: '二十件摆设', cond: 'deco_13', line: '第二十件摆上台，柜台后面已经没有空墙了。' },
          { id: 'sets_2', group: '收藏', title: '凑齐两套', cond: 'sets_2', line: '两套配齐，我把它们摆在一起，中间隔了一枚铜板。' },
          { id: 'channels_3', group: '收藏', title: '三条进货路', cond: 'channels_3', line: '第三条路子打通，同一个价，我能挑三家了。' },
          { id: 'cust_all', group: '收藏', title: '客人都见过', cond: 'cust_all', line: '六种客人全来过一遍，我给他们各留了一句招呼。' },
          { id: 'slots_full', group: '收藏', title: '架子放满', cond: 'slots_full', line: '每个格子都放上了东西，反倒不知道手往哪儿放。' },
          { id: 'vault', group: '收藏', title: '地窖', cond: 'vault', line: '地窖挖好，值钱的往下搬，搬完发现最值钱的是账本。' },
          /* 人情 */
          { id: 'reg_friend_1', group: '人情', title: '第一个熟人', cond: 'reg_friend_1', line: '有个人进门不再问价，先问我吃了没有。' },
          { id: 'reg_confidant_1', group: '人情', title: '说心里话的', cond: 'reg_confidant_1', line: '有人在我这儿说了句不该跟外人说的话，我没往外讲。' },
          { id: 'reg_20', group: '人情', title: '二十张熟脸', cond: 'reg_20', line: '二十个人进门我不用抬头，脚步声不一样。' },
          { id: 'regs_10_x10', group: '人情', title: '十个常来十回', cond: 'regs_10_x10', line: '十个人来满十回，凳子被他们坐出了各自的位置。' },
          { id: 'dreams_5', group: '人情', title: '办成五件', cond: 'dreams_5', line: '五个人的心愿办成了，他们走后我坐了很久。' },
          { id: 'dreams_20', group: '人情', title: '二十件办完', cond: 'dreams_20', line: '最后一件事也办完了，册子合上，里头没有一件是我的。' },
          { id: 'town_5', group: '人情', title: '城里五处', cond: 'town_5', line: '五处都修好了，走在街上，哪儿都有我出的钱。' },
          { id: 'fame_50', group: '人情', title: '名望五十', cond: 'fame_50', line: '街上有人指着我背后说话，声音不大，我听见了。' },
          { id: 'fame_100', group: '人情', title: '名望满百', cond: 'fame_100', line: '现在整条街都知道我，我反倒不敢关门歇一天。' },
          /* 见闻 */
          { id: 'weather_4', group: '见闻', title: '四种天气', cond: 'weather_4', line: '晴、阴、雨、雪都守过一遍，哪种天客人少，我心里有数。' },
          { id: 'season_4', group: '见闻', title: '看过四季', cond: 'season_4', line: '四季走完，才知道这店冬天最难，夏天最闲。' },
          { id: 'wanderer_1', group: '见闻', title: '第一个旅人', cond: 'wanderer_1', line: '有个从没见过的旅人进来，买了东西，说这地方怪。' },
          { id: 'market_day', group: '见闻', title: '赶集日', cond: 'market_day', line: '集市那天，门口挤得进不来人，我卖了半柜货，嗓子哑了。' },
          { id: 'lantern_day', group: '见闻', title: '灯节', cond: 'lantern_day', line: '灯节那晚，我把最亮的一盏挂到门外，一直亮到收摊。' },
          { id: 'busker_1', group: '见闻', title: '门口卖艺', cond: 'busker_1', line: '有人在门口弹了一下午，收摊时分了我三枚铜板。' },
          { id: 'night_shift', group: '见闻', title: '守到后半夜', cond: 'night_shift', line: '后半夜还开着，进来的人话少，买得多。' },
          { id: 'clear_first', group: '见闻', title: '卖空一回', cond: 'clear_first', line: '头一回把货卖空，架子上只剩灰，我拿布擦了一遍。' },
          { id: 'reg_30', group: '见闻', title: '三十张脸', cond: 'reg_30', line: '三十个人我都叫得出名字，有一个叫错的，他没纠正。' },
          /* ---- v0.16 §6.5：第七天之后才有的事（36 → 44） ---- */
          { id: 'gen_once', group: '人情', title: '交过一次手', cond: 'gen_once', line: '把店交给下一代那天，我在门口站到灯灭才走。' },
          { id: 'gift_any', group: '人情', title: '留了样东西', cond: 'gift_any', line: '柜子最下那层留着一件东西，下一任会知道怎么用。' },
          { id: 'forbidden_12', group: '收藏', title: '黑门十二件', cond: 'forbidden_12', line: '十二件都进了后屋，我没敢让它们挨着放。' },
          { id: 'rites_13', group: '收藏', title: '十三次充能', cond: 'rites_13', line: '法阵转过的第十三次，我已经听得出它什么时候要停。' },
          { id: 'ghost_10', group: '见闻', title: '十位影子', cond: 'ghost_10', line: '第十个影子来的时候，我先把灯芯挑亮了。' },
          { id: 'market_3', group: '见闻', title: '赶过三回集', cond: 'market_3', line: '第三回星砂集市散场，我认得那几个摊位的棚布了。' },
          { id: 'fame_200', group: '人情', title: '名望两百', cond: 'fame_200', line: '两百了。镇上的孩子开始拿我的店编顺口溜。' },
          { id: 'cal_30', group: '经营', title: '一个月', cond: 'cal_30', line: '照墙上的日历算，这店开了整三十天，一天没落下。' },
          /* ---- v0.18：补到 50 条（初级 / 中级 / 高级 / 大 / 星辉，各 10 条） ---- */
          { id: 'first_rite', group: '收藏', title: '头一次点火', cond: 'first_rite', line: '法阵头一次转起来，墙上的影子跟着走了一圈。' },
          { id: 'days_200', group: '经营', title: '两百天', cond: 'days_200', line: '两百天。门槛那道坑，现在踩下去刚好卡住鞋跟。' },
          { id: 'orders_500', group: '经营', title: '五百单', cond: 'orders_500', line: '第五百单结完，我把笔搁下，手比三百单的时候稳了。' },
          { id: 'market_6', group: '见闻', title: '赶过六回集', cond: 'market_6', line: '第六回散场，我收摊的手法已经和邻摊一模一样。' },
          { id: 'gen_3', group: '人情', title: '第三代', cond: 'gen_3', line: '第三次把钥匙递出去，这回我没站在门口看灯灭。' },
          { id: 'fame_300', group: '人情', title: '名望三百', cond: 'fame_300', line: '三百。外乡人进镇先问我的店在哪，指路的都指到我门口。' }
        ];

        /* ---------------- 12 条打烊独白 ----------------
           收摊、插门闩之后店主自己念叨的一句，随机取一条。安静、具体，不讲道理。 */
        var CLOSE_LINES = [
          '灯芯剪短了，火小一点，能撑到后半夜。',
          '账本今天只写了三行，剩下的页还白着。',
          '街上有马蹄声，走远了才听出是两个人。',
          '明天该进货了，灯油、绳子，还有盐。',
          '门口那块牌子歪了，明天再扶。',
          '炉子里还剩一块炭，我留着没添。',
          '对面酒馆散了，最后走的那个人在唱歌。',
          '数钱的时候数错一遍，懒得再数。',
          '今天有个客人没买东西，坐了半个时辰。',
          '风从窗缝进来，把账本翻了一页。',
          '门闩插上，外面的脚步声就跟我没关系了。',
          '明天早点开，可能有人的货到了。'
        ];

        /* 铜整数 → 铜/银/金，跟 widget 里 fmt 同口径（最高位必显，其余只显非零位） */
        function money(n) {
          n = Math.max(0, Math.round(Number(n) || 0));
          if (n < 100) return n + ' 铜';
          var g = Math.floor(n / 10000), s = Math.floor((n % 10000) / 100), c = n % 100;
          var out = [];
          if (g) out.push(g + ' 金');
          if (s) out.push(s + ' 银');
          if (c || !out.length) out.push(c + ' 铜');
          return out.join(' ');
        }

        /* 通关/交店那一下的小结：3–5 行纯文本，字段缺了就给个不尴尬的兜底 */
        function endCard(stats) {
          stats = stats || {};
          var gen = Math.max(1, Math.round(Number(stats.generation) || 1));
          var days = Math.max(0, Math.round(Number(stats.days) || 0));
          var gold = Math.max(0, Math.round(Number(stats.totalGold) || 0));
          var best = stats.bestItem ? String(stats.bestItem) : '';
          var regs = [], raw = stats.regulars, i, nm;

          if (raw && raw.length) {
            for (i = 0; i < raw.length && regs.length < 3; i++) {
              nm = raw[i] ? String(raw[i]) : '';
              if (nm && regs.indexOf(nm) < 0) regs.push(nm);
            }
          }

          var lines = [];
          lines.push('第 ' + gen + ' 代店主，开了 ' + days + ' 天，账上 ' + money(gold) + '。');
          lines.push(best
            ? '卖得最顺的是' + best + '，进货那本账翻得最烂。'
            : '货架上什么都卖过，唯独没卖过便宜。');
          lines.push(regs.length
            ? '熟客 ' + (raw.length || regs.length) + ' 位，' + regs.join('、') + '，进门都不问价。'
            : '常客还没坐热，柜台前的凳子一直是新的。');
          lines.push(gen <= 1
            ? '你把最后一句记在账本背面，吹灭了灯。'
            : '招牌换过 ' + gen + ' 回，字还是那几个，笔迹一次比一次稳。');
          return lines;
        }

        window.MagicShopLore = {
          VER: '0.15.0',
          ITEM_LORE: ITEM_LORE,
          REG_NAMES: REG_NAMES,
          REG_QUIP: REG_QUIP,
          CUST_LINES: CUST_LINES,
          CUST_ENTER: CUST_ENTER,
          CUST_BROWSE: CUST_BROWSE,
          CUST_EMPTY: CUST_EMPTY,
          WEATHER_LINES: WEATHER_LINES,
          DAILY_LINES: DAILY_LINES,
          MILESTONES: MILESTONES,
          /* v0.13 常客长线：第 3 / 6 / 10 次各解锁一段；委托与街面事件各一句 */
          REG_STORY: REG_STORY,
          REG_STORY_AT: REG_STORY_AT,
          QUEST_LINES: QUEST_LINES,
          EVENT_LINES: EVENT_LINES,
          /* v0.14 心愿 / 城建 / 成就 / 打烊独白 */
          DREAMS: DREAMS,
          TOWN: TOWN,
          ACHIEVEMENTS: ACHIEVEMENTS,
          CLOSE_LINES: CLOSE_LINES,
          endCard: endCard
        };
      })();


    /* ===== src/widget.js ===== */
      /*
       * 冒险魔法商店 · 挂机卡片控件（纯 DOM，零依赖）
       *
       * 玩法：他守着柜台卖装备道具。客人来→招呼→报价→收钱（钱袋增加、库存减少）；
       *      缺货就去后屋补货（花掉一部分钱）；夜里打烊打盹。
       *      偶尔来大单商队，也偶尔被小贼顺走一件。
       *
       * v0.6：钱只存一个铜整数（data.gold），显示时折算成 铜/银/金；
       *      12 件货逐件花钱解锁，解锁后才上架；关掉卡片后月亮固定在视口右下角。
       *
       * 依赖同目录 scene.js 提供的 window.MagicShopScene。
       * v0.8：伙食三档（钱不够自动降档，中档 = v0.7 现状，老档零迁移）、升级树 12 件每级 3 件、
       *      顾客 6 类可解锁（权重抽人 → 客单价倍率 / 一次多件真实进账）。
       * 对外：window.MagicShopWidget = { mount, boot, _logic:{decide, pickItem, stockTotal, TIMING, isOpen, isNight, fmt, topUnit,
       *      MEALS, CUSTS, villagerWeight, custWeightOf, custById, prefOf, UPGRADES} }
       */
      (function () {
        'use strict';

        var VER = '0.15.0';
        try {
          window.__MAGIC_SHOP_VER__ = VER;
          document.documentElement.setAttribute('data-magic-shop', VER);
          if (window.console) console.info('[dsh-magic-shop] bundle loaded v' + VER);
        } catch (e) {}

        /* v0.7 换库键：老档（v1 键）一律作废，所有人从街边地摊重新摆起 */
        /* v0.9.1：经济重构（回本制定价 + 收入阶梯）。旧档的解锁价/收益全变了，硬切换一次：
           换键即"重新开始"，老键在 load() 里删掉，避免旧档带着旧价继续跑。 */
        var STORE_KEY = 'dsh:magic-shop:v8';
        var OLD_KEYS = ['dsh:magic-shop:v7', 'dsh:magic-shop:v1'];
        var MAX_STOCK = 3;

        /* ---------------- 能花钱的地方 ----------------
           一处房子分五级往上买；装修是"好看 + 提速"，渠道是"同样的货卖更贵"。 */
        var TIERS = [
          { lv: 0, name: '街边地摊', short: '地摊', price: 0, desc: '一块板子架在木箱上，只摆得下三样' },
          { lv: 1, name: '木棚小摊', short: '木棚', price: 170, desc: '有柜台有布棚，能卖匕首和法杖' },
          { lv: 2, name: '临街小铺', short: '小铺', price: 2600, desc: '砌了墙、开一扇窗，盾和盔能上架' },
          { lv: 3, name: '正经商铺', short: '商铺', price: 36000, desc: '石墙三層货架加吊灯，水晶魔典有位置' },
          { lv: 4, name: '商会铺面', short: '商会', price: 180000, desc: '二楼亮灯，符文石/星砂瓶/龙鳞上架' }
        ];
        /* 场所等级越高，客人来得越勤（乘进 rushFactor 的等待倍率，越小越勤） */
        var TIER_RUSH = [1.7, 1.2, 0.82, 0.58, 0.41];

        /* 定价口径：装修是永久乘数，所以比"只加花色"的货品贵；同档内回本天数落在 8–12 天的窄带。
           存档只记 key（data.upgrades[id]=1），已买过的老玩家零影响。 */
        var UPGRADES = [
          /* L1 建立。v0.21：所有能持续生钱的件都按「约 8–12 天回本」重新定价，
             不再有「几十铜买永久 +11% 客流」的白捡价。 */
          { id: 'candle', name: '黄铜烛台', price: 80, minLv: 1, desc: '多一盏火（纯观感）' },
          { id: 'board', name: '今日有货木牌', short: '木牌', price: 110, minLv: 1, desc: '客人来得勤 6%（永久，逐件相加不叠乘）' },
          { id: 'cat', name: '养只店猫', price: 70, minLv: 1, desc: '小贼得手率 55% → 30%' },
          /* v0.17：L1 再补两件小物，让刚开张也有东西可挑 */
          { id: 'accounts', name: '旧账本', price: 60, minLv: 1, desc: '账目清楚，报价不虚，卖价 +2%' },
          { id: 'salt', name: '门边盐线', price: 60, minLv: 1, desc: '门槛撒一道盐，客人来得勤 2%' },
          /* L2 */
          { id: 'glass', name: '玻璃橱窗', short: '橱窗', price: 520, minLv: 2, desc: '客人来得勤 7.5%' },
          { id: 'counter', name: '实木柜台', short: '柜台', price: 210, minLv: 2, desc: '卖价 +3%' },
          { id: 'stool', name: '门口长凳', short: '长凳', price: 210, minLv: 2, desc: '客人来得勤 3%' },
          { id: 'awning', name: '檐下挡雨棚', price: 610, minLv: 2, desc: '客人愿意在门口多停一步，客流 +8.7%' },
          /* v0.17：L2 的灯与席 —— 一个拉客流，一个抬客单价 */
          { id: 'lamp', name: '门口油灯', price: 140, minLv: 2, desc: '灯亮到街尾，客人来得勤 2%' },
          { id: 'mat', name: '迎客草席', price: 140, minLv: 2, desc: '进门先蹭掉泥，卖价 +2%' },
          /* L3 */
          { id: 'bell', name: '黄铜门铃', price: 540, minLv: 3, desc: '客人来得勤 4.2%' },
          { id: 'chand', name: '水晶吊灯', short: '吊灯', price: 760, minLv: 3, desc: '入夜卖价 +15%、客流 +2%' },
          { id: 'sign', name: '金字招牌', price: 1130, minLv: 3, desc: '客人再勤 8.7%' },
          /* v0.17：L3 的镜与钟 —— 镜留客，钟只在入夜后抬价 */
          { id: 'tallglass', name: '蒙尘穿衣镜', price: 390, minLv: 3, desc: '客人愿意多站一会儿，来得勤 3.1%' },
          { id: 'clock', name: '停摆座钟', price: 320, minLv: 3, desc: '入夜后钟摆自己动，卖价 +6%' },
          /* L4 */
          { id: 'portal', name: '魔法传送门', short: '传送门', price: 3400, minLv: 4, desc: '客人再多 16.3%（全店最大的一件客流件）' },
          { id: 'vault', name: '铁皮保险柜', price: 400, minLv: 4, desc: '库存上限 3 → 5' },
          { id: 'icebox', name: '后屋冰窖', price: 120, minLv: 4, desc: '伙食日费 −40%（省的是每天三顿饭钱，日子越久越划算）' },
          /* v0.17：L4 最后一件 —— 与保险柜叠加的库存位 */
          { id: 'cellar', name: '地窖暗门', price: 2600, minLv: 4, desc: '后屋再挖一层，库存上限 +1（与保险柜叠加）' }
        ];
        /* v0.13：套装缺件提示要用装修的中文名，按 id 反查（找不到就退回 id，绝不抛错） */
        function upById(k) {
          for (var i = 0; i < UPGRADES.length; i++) if (UPGRADES[i].id === k) return UPGRADES[i];
          return null;
        }
        /* v0.17：店铺 / 心愿的折叠分组。键名写进 data.ui.open，刷新后照旧。
           顺序固定；「货品」并在「渠道」组里（渠道与货品是同一件事的两头）。
           其余分组名统一两个字，读起来齐。资助冒险队在 v0.25 挪去了「资助」页。 */
        var SHOP_GROUPS = [
          { key: 'shop.place', title: '场所' },
          { key: 'shop.decor', title: '装修' },
          { key: 'shop.channel', title: '渠道' },
          { key: 'shop.cust', title: '顾客' },
          { key: 'shop.food', title: '伙食' },
          { key: 'shop.cat', title: '猫猫' },
          { key: 'shop.legacy', title: '传承' }
        ];
        var WISH_GROUPS = [
          { key: 'wish.town', title: '城建' },
          { key: 'wish.dream', title: '常客心愿' }
        ];
        /* v0.17：成就五档，按「魔法商人」的段位起名（初级 → 星辉），每档 10 项。
           key 沿用旧值（存档 data.ui.open 里记的就是它），只换显示名。 */
        var ACH_TIERS = [
          { key: 'ach.bronze', name: '初级商人' },
          { key: 'ach.silver', name: '中级商人' },
          { key: 'ach.gold', name: '高级商人' },
          { key: 'ach.platinum', name: '大商人' },
          { key: 'ach.diamond', name: '星辉商人' }
        ];
        /* 50 条，五档各 10。旧 id 全部保留（存档按 id 记），只调档位。 */
        var ACH_TIER = {
          first_sale: 'bronze', profit_day_100: 'bronze', slots_full: 'bronze',
          reg_friend_1: 'bronze', weather_4: 'bronze', wanderer_1: 'bronze',
          busker_1: 'bronze', night_shift: 'bronze', clear_first: 'bronze',
          first_rite: 'bronze',
          orders_100: 'silver', gold_10000: 'silver', debt_free_10: 'silver',
          days_30: 'silver', tier_2: 'silver',
          reg_confidant_1: 'silver', reg_20: 'silver', dreams_5: 'silver',
          fame_50: 'silver', lantern_day: 'silver',
          best_price_500: 'gold', sets_2: 'gold', cust_all: 'gold',
          vault: 'gold', regs_10_x10: 'gold', fame_100: 'gold',
          season_4: 'gold', market_3: 'gold', cal_30: 'gold', channels_3: 'gold',
          items_1000: 'platinum', days_100: 'platinum', deco_13: 'platinum',
          rites_13: 'platinum', ghost_10: 'platinum', reg_30: 'platinum',
          market_day: 'platinum', days_200: 'platinum', orders_500: 'platinum',
          market_6: 'platinum',
          tier_max: 'diamond', dreams_20: 'diamond', town_5: 'diamond',
          items_12: 'diamond', gen_once: 'diamond', gift_any: 'diamond',
          forbidden_12: 'diamond', fame_200: 'diamond', gen_3: 'diamond',
          fame_300: 'diamond'
        };
        function achTierOf(a) {
          var t = (a && (a.tier || ACH_TIER[a.id])) || 'bronze';
          return t.indexOf('ach.') === 0 ? t : 'ach.' + t;
        }
        /* 进货渠道：开了之后，这一批货的卖价 +15% */
        var CHANNELS = [
          { id: 'dwarf', name: '矮人锻造', price: 1200, minLv: 2, desc: '兵刃盾盔 +15%', items: ['dagger', 'wand', 'helm', 'shield'] },
          { id: 'herb', name: '精灵草药', price: 700, minLv: 2, desc: '药水卷轴 +15%', items: ['potion', 'mana', 'scroll'] },
          { id: 'black', name: '黑市', price: 20000, minLv: 4, desc: '法器异材 +15%', items: ['orb', 'tome', 'rune', 'star', 'scale'] }
        ];

        /* ---------------- v0.8 伙食三档 ----------------
           日费 = 2 顿正餐（9:00 / 19:00，不饿也吃）；中档是 v0.7 现状的等价物 → 老档零迁移。
           高档的 flow 必须和 tm 一起给：只加客流会被 3.2s 的固定动作稀释（见设计稿 B.2）。 */
        var MEALS = [
          { id: 0, name: '冷面包配井水', short: '低', per: 4, sat: 14, price: 1.00, flow: 1.00, tm: 1.00, note: '省钱，无加成' },
          { id: 1, name: '街口炖肉热汤', short: '中', per: 12, sat: 18, price: 1.08, flow: 1.00, tm: 1.00, note: '贵一点，换客单价' },
          { id: 2, name: '酒馆席面', short: '高', per: 30, sat: 26, price: 1.00, flow: 0.85, tm: 0.80, note: '最贵，换客流 + 翻台' }
        ];
        /* v0.18：店猫的伙食也分三档，一次买断、只买下一档。
           效果走两条已有的乘法链：客流（rushFactor 里 ×flow）与小贼得手率（doThief 里减 thief）。 */
        var CATFOODS = [
          { id: 1, name: '门口一碗干粮', price: 120, minLv: 1, thief: 0.03, flow: 0.99, note: '守夜更久 · 小贼 −3%' },
          { id: 2, name: '隔天一条小鱼干', price: 900, minLv: 2, thief: 0.05, flow: 0.98, note: '小贼 −5% · 客流 +2%' },
          { id: 3, name: '月露拌饭', price: 6800, minLv: 3, thief: 0.06, flow: 0.96, note: '小贼 −6% · 客流 +4%' }
        ];
        /* 三个纯函数挂在模块层，data 由调用方传入（mount 里的 data 才是活的存档）
           v0.21：catFood 是「当前在喂哪一档」，效果只取这一档，不再逐档累加 */
        function catTierNow(d) { return Math.max(0, Math.min(CATFOODS.length, Number((d || {}).catFood) || 0)); }
        function catFoodMul(d) {
          var t = catTierNow(d);
          return t > 0 ? CATFOODS[t - 1].flow : 1;
        }
        function catThiefCut(d) {
          var t = catTierNow(d);
          return t > 0 ? CATFOODS[t - 1].thief : 0;
        }

        /* ---------------- v0.8 顾客 6 类 ----------------
           w 是出现权重；villager 的权重由 max(12, 40−4×(已解锁数−1)) 动态算（熟客让位给新客源）。
           bulk = 一次买几件（小数按概率进位）；pref = pickItem 的偏好货，没有就回落全货。 */
        var CUSTS = [
          { id: 'villager', name: '村民', price: 0, lv: 0, mult: 1.00, bulk: 1.0, w: 40, kind: 'villager', desc: '开局就有，什么货都买' },
          { id: 'merc', name: '佣兵团', price: 120, lv: 1, mult: 1.05, bulk: 1.5, w: 22, kind: 'merc', pref: ['dagger', 'helm', 'shield', 'scale'], desc: '成队来，兵器盾盔一两件' },
          { id: 'rogue', name: '盗贼', price: 38000, lv: 2, mult: 1.10, bulk: 2.2, w: 12, kind: 'rogue', cheap: 60, desc: '只捡便宜货，一买一大把' },
          { id: 'mage', name: '法师', price: 2900, lv: 2, mult: 1.40, bulk: 1.15, w: 16, kind: 'mage', pref: ['wand', 'orb', 'tome', 'scroll', 'rune', 'star'], desc: '法器典册，出手大方' },
          { id: 'noble', name: '贵族', price: 9000, lv: 3, mult: 1.45, bulk: 1.25, w: 10, kind: 'noble', pref: ['orb', 'tome', 'star', 'scale', 'rune'], desc: '只挑贵的，价钱不问' },
          { id: 'outsider', name: '异界客', price: 16000, lv: 4, mult: 1.30, bulk: 1.60, w: 8, kind: 'outsider', pref: ['rune', 'star', 'scale', 'tome', 'orb'], desc: '从传送门来，认符文星砂' },
          /* v0.16 §6.2 灵体客：传承之后才出现，只在夜里来，只买禁忌货（pref 由 forbiddenKeys() 现算），单价 ×1.6。
             gen 字段 = 「第几代才可能来」；不进「已开 N/6」的分母（那 6 类是传承闸门的核心客种）。 */
          { id: 'ghost', name: '灵体客', price: 0, lv: 0, mult: 1.60, bulk: 1.0, w: 6, kind: 'ghost', gen: 1, night: true, forbidden: true, desc: '传承之后夜里来的影子，只买禁忌货' },
          /* v0.27 星砂集市：只在开市那 48 小时出现的行商，什么货都收、出手比村民阔。
             不进「已开 N/6」的分母，也不需要买 —— 集市一到自己就来。 */
          { id: 'stardust', name: '星砂客', price: 0, lv: 0, mult: 1.35, bulk: 1.3, w: 14, kind: 'stardust', mkt: true, desc: '星砂集市开市才来的行商，什么货都收' }
        ];
        function custById(id) {
          for (var ci = 0; ci < CUSTS.length; ci++) if (CUSTS[ci].id === id) return CUSTS[ci];
          return null;
        }
        /* 核心客种 = 传承闸门要的那 6 类（灵体客不算，它是传承之后的东西） */
        function coreCusts() { return CUSTS.filter(function (c) { return !c.gen && !c.mkt; }); }
        function villagerWeight(count) { return Math.max(12, 40 - 4 * (Math.max(1, count) - 1)); }
        function custWeightOf(c, count) { return c.id === 'villager' ? villagerWeight(count) : c.w; }
        function prefOf(kind) {
          var c = custById(kind);
          return c && c.pref ? c.pref : null;
        }
        /* ============ v0.23 持续花钱的地方：资助冒险队 ============
           这是全店唯一「净亏」的长期支出：每天日结自动扣一笔，换声望与偶发战利品，后两档再带一点客流。
           期望回收（luck × 平均战利品）刻意低于支出 —— 钱多到没处花时，总要有个去处。
           规则：付不出当天的钱就自动停掉，不滚成欠账（房租才欠账，赞助没有赊的）。
           id 写进 data.sponsor（字符串数组），存档 v7 不用升版。 */
        var SPONSORS = [
          { id: 'band', name: '见习冒险队', cost: 30, fame: 1, luck: 0.35, back: [10, 45], flow: 0, lv: 0,
            desc: '几个刚拿剑的年轻人，替你在城外跑腿' },
          { id: 'merc', name: '老练佣兵队', cost: 150, fame: 3, luck: 0.40, back: [50, 160], flow: 0.04, lv: 1,
            desc: '接得下硬活，回来时顺路带点战利品' },
          { id: 'royal', name: '皇家远征队', cost: 600, fame: 8, luck: 0.50, back: [150, 500], flow: 0.08, lv: 3,
            desc: '挂着王室旗号，名声传得最远' }
        ];
        function sponsorById(id) {
          for (var si = 0; si < SPONSORS.length; si++) if (SPONSORS[si].id === id) return SPONSORS[si];
          return null;
        }
        function sponsorActive(d) {
          var raw = (d && Array.isArray(d.sponsor)) ? d.sponsor : [], out = [], i, s;
          for (i = 0; i < raw.length; i++) {
            s = sponsorById(raw[i]);
            if (s && out.indexOf(s) < 0) out.push(s);
          }
          return out;
        }
        function sponsorDaily(d) {
          var a = sponsorActive(d), sum = 0, i;
          for (i = 0; i < a.length; i++) sum += a[i].cost;
          return sum;
        }
        function sponsorFame(d) {
          var a = sponsorActive(d), sum = 0, i;
          for (i = 0; i < a.length; i++) sum += a[i].fame;
          return sum;
        }
        /* 客流倍率：4% → ×0.96（等待缩短），与装修客流同一条乘法链 */
        function sponsorFlow(d) {
          var a = sponsorActive(d), f = 1, i;
          for (i = 0; i < a.length; i++) f *= (1 - (a[i].flow || 0));
          return f;
        }
        /* 调试参数（?pace= ?tier= ?ch= ?up= ?play= ?fast= ?dbg=）只在 dev/ 预览页或显式 ?dev=1 时生效。
           正式挂载时一律忽略：别人在地址栏补个 ?tier=4 不能把货全解锁，也不会被存档记下来。 */
        function devView() {
          try {
            return /\/dev\//.test(location.pathname) || /[?&]dev=1(?:&|$)/.test(location.search);
          } catch (e) { return false; }
        }

        /* 一"天" = 12 分钟真时间（v0.7 从 6 分钟放慢：一天里只来十来个客人，不像流水线） */
        var DAY_MS = 12 * 60 * 1000;
        /* 调试倍率：?pace=0.5 把等待腰斩、?pace=2 拖慢一倍；正常 = 1 */
        var PACE = (function () {
          try {
            var q = (typeof location !== 'undefined' && location.search) ? location.search : '';
            var m = devView() ? /[?&]pace=([\d.]+)/.exec(q) : null;
            var v = m ? parseFloat(m[1]) : 1;
            return (v > 0.2 && v < 12) ? v : 1;
          } catch (e) { return 1; }
        })();

        /* ============ v0.16 墙钟：第二个时钟 ============
           plan-v016 §2 定的三条时钟：
             营业钟 = DAY_MS（上客、打烊、天气、日结、营收）—— 一个字都不改；
             墙钟   = Date.now()（法阵充能、传承、星砂集市、日历成就）—— 店关着也照样走；
             离线钟 = catchUp（补算）—— 削弱到 35%。
           规矩只有一条：钱只从营业钟来，解锁只从墙钟来。这样「挂机」不再等于「立刻点满」。 */
        var REAL_DAY_MS = 24 * 60 * 60 * 1000;

        /* §8 法阵充能表。付完钱先写 data.rites[id] = Date.now()，到点自动生效（不要求人在场点确认）。
           键与 TIERS[].lv / CHANNELS[].id / TOWN[] 下标一一对应，故意手写死，不做字符串拼接。 */
        var RITES = {
          tier1: 10 * 60 * 1000, tier2: 2 * 3600e3, tier3: 6 * 3600e3, tier4: 12 * 3600e3,
          ch1: 1 * 3600e3, ch2: 2 * 3600e3, ch3: 8 * 3600e3,
          town1: 6 * 3600e3, town2: 12 * 3600e3, town3: 18 * 3600e3, town4: 24 * 3600e3, town5: 36 * 3600e3,
          town6: 12 * 3600e3, town7: 16 * 3600e3, town8: 20 * 3600e3, town9: 24 * 3600e3, town10: 30 * 3600e3,
          legacy: 24 * 3600e3
        };
        var RITE_KEYS = ['tier1', 'tier2', 'tier3', 'tier4', 'ch1', 'ch2', 'ch3',
          'town1', 'town2', 'town3', 'town4', 'town5', 'town6', 'town7', 'town8', 'town9', 'town10'];

        /* §5 离线削弱：8 小时封顶不变，补算只按昨日营业额的 35%，房租照扣 */
        var CATCH_MAX_MS = 8 * 60 * 60 * 1000;
        var CATCH_RATE = 0.35;

        /* §6.3 星砂集市：每 7 个日历天开一次，一次 48 小时（墙钟）。错过就等下一轮，没有惩罚。 */
        var MARKET_EVERY_DAYS = 7, MARKET_HOLD_MS = 48 * 3600e3;

        /* ---- 下面是「墙钟」的纯函数：只吃数字，不碰存档、不碰 DOM，node 里能直接对 ---- */
        function riteDur(id) { return Number(RITES[id]) || 0; }
        /* 还没充完的毫秒数：0 = 没开始 或 已经充完（用 riteState 区分）。
           k 是充能加速系数（天赋「充能」= 0.8，其余 1）—— 会影响总时长，所以必须从外面传进来，
           否则纯函数就得去读存档，node 里不好测。 */
        function riteLeft(id, ts, now, k) {
          if (!ts) return 0;
          var used = Math.max(0, (Number(now) || 0) - (Number(ts) || 0));
          var dur = riteDur(id) * (k == null ? 1 : Number(k) || 1);
          return Math.max(0, dur - used);
        }
        /* 'idle' 未充能 / 'charging' 充能中 / 'done' 已完成 */
        function riteState(id, ts, now, k) {
          if (!ts) return 'idle';
          return riteLeft(id, ts, now, k) > 0 ? 'charging' : 'done';
        }
        /* 已开业几个日历天（第 1 天 = 1）。realStart 是第一次开张的墙钟刻度；天数派生，不单独存。 */
        function calDays(now, realStart) {
          var s = Number(realStart) || 0;
          if (!s) return 1;
          var n = Math.floor(((Number(now) || 0) - s) / REAL_DAY_MS) + 1;
          return n < 1 ? 1 : n;
        }
        /* 第几轮星砂集市（0 = 还没开过第一轮） */
        function marketRound(now, realStart) {
          var s = Number(realStart) || 0;
          if (!s) return 0;
          var t = (Number(now) || 0) - s;
          return t < 0 ? 0 : Math.floor(t / (MARKET_EVERY_DAYS * REAL_DAY_MS));
        }
        function marketOpen(now, realStart) {
          var s = Number(realStart) || 0, r = marketRound(now, realStart);
          if (!s || r < 1) return false;
          return ((Number(now) || 0) - s) - r * MARKET_EVERY_DAYS * REAL_DAY_MS < MARKET_HOLD_MS;
        }

        var CSS = [
          /* v0.8.2：宿主（DSH 桌面版）把窗口背景声明成 -webkit-app-region:drag 用来拖窗口，
             挂在 body 上的浮层不带 no-drag 时鼠标事件会被原生层整块吞掉 ——
             表现就是卡片看得见却点不动、拖不动、拉不宽。 */
          '.idk-card{position:fixed;z-index:2147483647;width:268px;border-radius:14px;overflow:hidden;',
          '-webkit-app-region:no-drag;app-region:no-drag;pointer-events:auto;',
          'background:#141a22;border:1px solid #2b3542;box-shadow:0 18px 44px rgba(0,0,0,.5),0 2px 0 rgba(255,255,255,.03) inset;',
          'font-family:"Segoe UI","PingFang SC","Microsoft YaHei",system-ui,sans-serif;color:#cdd6e2;',
          'user-select:none;transition:box-shadow .18s ease}',
          '.idk-card[data-flash="1"]{box-shadow:0 0 0 2px #e0b45c,0 0 22px rgba(224,180,92,.35)}',
          '.idk-head{display:flex;align-items:center;gap:6px;padding:7px 9px;cursor:grab;',
          'background:linear-gradient(#1b2430,#161e28);border-bottom:1px solid #232d3a}',
          '.idk-dot{width:6px;height:6px;border-radius:50%;background:#63c88a;box-shadow:0 0 7px #63c88a;flex:none}',
          '.idk-title{font-size:12px;font-weight:600;letter-spacing:.3px;flex:none}',
          /* v0.28 星砂集市开市的一枚小标记：只放一个 ✨，不占提示行，也不改状态文字 */
          '.idk-mktdot{font-size:10px;line-height:1;margin-left:1px;flex:none;opacity:.85;cursor:default}',
          '.idk-stat{margin-left:auto;font-size:11px;color:#8b97a6;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
          '.idk-btn{width:19px;height:19px;line-height:17px;text-align:center;border-radius:6px;',
          'background:#232e3b;color:#9fadbd;font-size:11.5px;border:1px solid #2e3a49;cursor:pointer;flex:none}',
          '.idk-btn:hover{background:#2c3a49;color:#dfe7f1}',
          '.idk-btn.idk-pwr{color:#9aa7b6}',
          '.idk-btn.idk-pwr:hover{background:#3a2630;border-color:#6b3a46;color:#f0a8b4}',
          '.idk-badge{position:fixed;right:16px;bottom:16px;z-index:2147483647;width:44px;height:44px;box-sizing:border-box;border-radius:14px;display:none;',
          '-webkit-app-region:no-drag;app-region:no-drag;pointer-events:auto;',
          'align-items:center;justify-content:center;cursor:pointer;font-size:17px;line-height:1;color:#f0d495;',
          'background:radial-gradient(circle at 30% 25%,#2c3948,#171e28 70%);border:1px solid #3b4859;',
          'box-shadow:0 10px 24px rgba(0,0,0,.55),0 1px 0 rgba(255,255,255,.06) inset;',
          'font-family:"Segoe UI","PingFang SC",system-ui,sans-serif;user-select:none;transition:transform .15s,box-shadow .15s}',
          '.idk-badge:hover{transform:translateY(-1px);box-shadow:0 12px 28px rgba(0,0,0,.6),0 0 0 1px #5d6d81}',
          '.idk-badge[data-on="1"]{display:flex}',
          /* v0.28 集市开市：小月亮镀一圈金，关着店也知道这两天有市 */
          '.idk-badge[data-mkt="1"]{border-color:#c9a05a;box-shadow:0 10px 24px rgba(0,0,0,.55),0 0 0 2px rgba(224,180,92,.45),0 0 14px rgba(224,180,92,.3)}',
          '.idk-badge .idk-bd{position:absolute;right:-1px;top:-1px;width:7px;height:7px;border-radius:50%;',
          'background:#e0b45c;box-shadow:0 0 6px #e0b45c;opacity:0}',
          '.idk-badge[data-flash="1"] .idk-bd{opacity:1}',
          '.idk-grip{position:absolute;left:0;bottom:0;width:14px;height:14px;cursor:nwse-resize;z-index:3;',
          'background:linear-gradient(45deg,transparent 42%,#4a5768 42%,#4a5768 52%,transparent 52%,transparent 62%,#4a5768 62%,#4a5768 72%,transparent 72%)}',
          '.idk-stage{position:relative;aspect-ratio:320/200;background:#101720;cursor:pointer;overflow:hidden}',
          '.idk-stage svg{display:block;width:100%;height:100%}',
          '.idk-bubble{position:absolute;right:9px;top:8px;max-width:180px;padding:5px 9px;border-radius:9px;',
          'background:rgba(20,26,34,.9);border:1px solid #33404f;color:#dbe4ef;font-size:11.5px;line-height:1.4;',
          'opacity:0;transform:translateY(-3px);transition:opacity .22s,transform .22s;pointer-events:none}',
          '.idk-bubble[data-on="1"]{opacity:1;transform:none}',
          /* v0.13 流浪商人：报价期间气泡临时可点（点一下 = 成交），其余时候仍是纯提示 */
          '.idk-bubble[data-offer="1"]{pointer-events:auto;cursor:pointer}',
          '.idk-foot{display:flex;align-items:center;flex-wrap:wrap;gap:5px;padding:7px 10px 8px;font-size:10px;color:#93a1b1;white-space:nowrap;',
          'background:#161e28;border-top:1px solid #232d3a}',
          '.idk-foot b{color:#e7eef7;font-weight:600}',
          '.idk-gold{display:inline-flex;align-items:center;gap:3px;vertical-align:-2px}',
          '.idk-gold svg{display:block;flex:none}',
          '.idk-bar{position:absolute;left:10px;right:10px;bottom:3px;height:3px;border-radius:2px;background:#232d3a}',
          '.idk-bar i{display:block;height:100%;border-radius:2px;background:linear-gradient(90deg,#d8a94e,#f0cf83);transition:width .4s}',
          '.idk-side{display:none;border-top:1px solid #232d3a;background:#121924;grid-template-columns:1.1fr 1fr}',
          '.idk-card.is-big{display:grid;grid-template-columns:58% 42%;grid-template-areas:"head head" "stage side" "foot foot";',
          'align-content:start;align-items:start;',
          'width:min(700px,calc(100vw - 28px));max-height:calc(100vh - 20px)}',
          '.idk-card.is-big .idk-head{grid-area:head}',
          '.idk-card.is-big .idk-stage{grid-area:stage;height:auto;aspect-ratio:320/200}',
          '.idk-card.is-big .idk-side{grid-area:side;display:flex;flex-direction:column;overflow:hidden;',
          'border-top:none;border-left:1px solid #232d3a;max-height:100%}',
          '.idk-tabs{display:flex;gap:4px;padding:6px 8px 0;flex:none}',
          '.idk-tabs button{flex:1;border:1px solid transparent;border-radius:7px 7px 0 0;background:none;color:#7f8c9b;',
          'font:inherit;font-size:11px;padding:3px 0;cursor:pointer}',
          '.idk-tabs button:hover{color:#b9c5d3}',
          '.idk-tabs button[data-on="1"]{color:#e0b45c;background:#182130;border-color:#2b3542;border-bottom-color:transparent}',
          '.idk-side .idk-pane{display:none}',
          '.idk-side[data-tab="shop"] .idk-pane[data-pane="shop"],',
          '.idk-side[data-tab="stat"] .idk-pane[data-pane="stat"],',
          '.idk-side[data-tab="dream"] .idk-pane[data-pane="dream"],',
          '.idk-side[data-tab="ach"] .idk-pane[data-pane="ach"],',
          '.idk-side[data-tab="set"] .idk-pane[data-pane="set"]{display:flex;flex-direction:column;flex:1;min-height:0}',
          /* v0.22：经营页也不夹流水条——它自己就是一份账 */
          '.idk-card.is-big .idk-side[data-tab="stat"] .idk-recent,',
          /* v0.18：大窗里流水只属于店铺页——心愿/成就/设置不夹一条流水条 */
        '.idk-card.is-big .idk-side[data-tab="dream"] .idk-recent,',
        '.idk-card.is-big .idk-side[data-tab="ach"] .idk-recent,',
        '.idk-card.is-big .idk-side[data-tab="set"] .idk-recent{display:none}',
          '.idk-card.is-big .idk-foot{grid-area:foot}',
          '.idk-card.is-big .idk-pane{min-height:0;overflow:hidden}',
          '.idk-card.is-big .idk-list{flex:1;min-height:0;max-height:none;overflow:auto}',
          /* v0.12.4：货架两列是写死的，格子一窄名字就被省略号切掉（用户报「货架显示不全」）。
             改成按最小可用宽度自动分列：窄的时候只有一列，名字永远整行显示。 */
          '.idk-card.is-big .idk-pane[data-pane="stock"] .idk-list{column-width:132px;column-gap:10px}',
          '.idk-card.is-big .idk-pane[data-pane="stock"] .idk-list li{break-inside:avoid}',
          '.idk-shop-pane .idk-list{max-height:none}',
          /* 店铺页 7 行要塞得下：行距压紧、说明行贴着名字 */

          '.idk-buy{flex:none;border:1px solid #3b4a5c;background:#1d2733;color:#e0b45c;border-radius:7px;',
          'font:inherit;font-size:11px;padding:1px 7px;cursor:pointer}',
          '.idk-buy:hover{background:#26333f;border-color:#4c5f74}',
          '.idk-buy[disabled]{opacity:.5;color:#66727f;border-color:#2b3542;background:#161d26;cursor:not-allowed}',
          '.idk-list li[data-own="1"] .p{color:#6fae7f}',
          '.idk-list .mk{flex:none;font-size:10px;line-height:1}',
          '.idk-list .mk.up{color:#8fd39a}',
          '.idk-list .mk.dn{color:#d98a8a}',
          '.idk-list li[data-k="buy"] .t{color:#e0b45c}',
          '.idk-list li[data-k="day"] .t{color:#8fd39a}',
          '.idk-debt{color:#e07c7c}',
          '.idk-pane{padding:8px 10px;min-width:0}',
          '.idk-pane+.idk-pane{border-left:1px solid #1e2734}',
          '.idk-h{display:flex;align-items:center;justify-content:space-between;font-size:11px;color:#7f8c9b;margin-bottom:5px}',
          /* v0.22 经营页：四个数字两列排，下面是一条条「这东西每天给我挣多少」 */
          '.idk-statbox{display:grid;grid-template-columns:1fr 1fr;gap:2px 10px;margin:0 0 6px}',
          '.idk-kv{display:flex;justify-content:space-between;align-items:baseline;gap:6px;font-size:11px;color:#8b97a6;min-width:0}',
          '.idk-kv span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
          '.idk-kv b{color:#e0b45c;font-weight:400;white-space:nowrap;flex-shrink:0}',
          /* v0.26：经营页的行略收一点，五笔支出 + 标签条刚好一屏放得下 */
          '.idk-statlist li{padding:4px 1px;line-height:1.3}',
          '.idk-statlist li i{font-size:10px;line-height:1.3;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
          '.idk-list{list-style:none;margin:0;padding:0;max-height:200px;overflow:auto;font-size:11.5px;line-height:1.7}',
          '.idk-list li{display:flex;gap:6px;align-items:baseline;color:#b9c5d3}',
          '.idk-list li .nm{flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
          '.idk-list li .nm i{display:block;font-style:normal;font-size:10px;color:#78848f;line-height:1.35;overflow:hidden;text-overflow:ellipsis}',
          '.idk-list li .q{color:#8b97a6;flex:none}',
          '.idk-list li .p{color:#e0b45c;flex:none}',
          '.idk-list li[data-out="1"]{opacity:.42}',
          /* v0.11 货架 3 格陈列位：前台只摆 3 件，客人只从这 3 件里挑 */
          '.idk-list.idk-slotlist{display:flex;gap:5px;overflow:visible;max-height:none;margin-bottom:6px}',
          '.idk-slotlist li{flex:1;min-width:0;flex-direction:column;align-items:flex-start;gap:1px;padding:4px 5px;line-height:1.25;',
          'border:1px dashed #2b3a4c;border-radius:6px;background:#111a24;cursor:pointer}',
          '.idk-slotlist li:hover{border-color:#4c6480;background:#152030}',
          /* v0.12.4：格子窄时名字会被省略号切掉（用户报「货架显示不全」）——改成允许换行，宁可行高一点也要看全 */
          '.idk-slotlist li .n{color:#cdd8e5;font-size:10.5px;width:100%;line-height:1.2;word-break:break-word;overflow-wrap:anywhere}',
          '.idk-slotlist li .q{color:#7f8c9b;font-size:9.5px;flex:none}',
          '.idk-slotlist li.is-empty .n{color:#5f6b79}',
          '.idk-log li{display:block;color:#9aa7b6}',
          '.idk-log li .t{color:#5f6b79;margin-right:6px}',
          '.idk-log li[data-k="ev"] .t+span{color:#8fd0c8}',
          '.idk-log li[data-k="bad"] .t+span{color:#e08d78}',
          /* v0.11 每日一句：世界碎片用暗紫，和买卖流水区分开 */
          '.idk-log li[data-k="word"] .t+span{color:#b0a2cf}',
          '.idk-empty{color:#5f6b79;font-size:11.5px;padding:4px 0}',
          /* 店铺页：7 行要在一屏里塞下，所以压成单行（说明贴在名字后面） */
          '.idk-need{font-size:10.5px;color:#9fb0c2;letter-spacing:.2px}',
          '.idk-tier{font-size:10px;color:#7f8d9c;white-space:nowrap}',
          '.idk-sec{font-size:10.5px;color:#8fa0b4;opacity:.9;margin-top:4px;padding:2px 0;border-bottom:1px dashed #263443}',
          /* v0.20：分组改成「标签条」——左侧色条 + 圆点 + 底色 + 圆角，层次一眼分得开 */
          '.idk-grp{display:flex;align-items:center;gap:7px;margin:6px 0 2px;padding:5px 9px 5px 9px;border-radius:7px;',
          'cursor:pointer;font-size:11px;color:#c6d3e1;line-height:1.3;border:1px solid rgba(255,255,255,.07);',
          'border-left:3px solid var(--gc,#46586c);background:linear-gradient(90deg,rgba(255,255,255,.055),rgba(255,255,255,.012))}',
          '.idk-grp:first-child{margin-top:2px}',
          '.idk-grp::before{content:"";flex:none;width:5px;height:5px;border-radius:50%;background:var(--gc,#46586c);box-shadow:0 0 7px var(--gc,#46586c)}',
          '.idk-grp:hover{background:linear-gradient(90deg,rgba(255,255,255,.09),rgba(255,255,255,.02))}',
          '.idk-grp .gt{flex:none;font-weight:600;letter-spacing:.5px;color:#e6eef7}',
          '.idk-grp .gs{margin-left:auto;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;',
          'font-size:10px;color:#8b9bad;font-weight:400}',
          '.idk-grp .ga{flex:none;width:12px;text-align:center;color:#8fa0b4;font-size:10px}',
          '.idk-grp[data-open="0"] .ga{color:#66727f}',
          '.idk-grp[data-open="0"]{background:linear-gradient(90deg,rgba(255,255,255,.03),rgba(255,255,255,0))}',
          /* 每组一个色相：店铺七组 + 心愿两组 + 成就五段 */
          '.idk-card [data-grp="shop.place"]{--gc:#4f9ad4}',
          '.idk-card [data-grp="shop.decor"]{--gc:#c98b4b}',
          '.idk-card [data-grp="shop.channel"]{--gc:#8b7ad4}',
          '.idk-card [data-grp="shop.cust"]{--gc:#4aa38b}',
          '.idk-card [data-grp="wish.sponsor"]{--gc:#c96a9a}',
          /* v0.24：经营页的两本账，收入绿、支出红 */
          '.idk-card [data-grp="stat.income"]{--gc:#57a06a}',
          '.idk-card [data-grp="stat.expense"]{--gc:#c46a6a}',
          '.idk-card [data-grp="shop.food"]{--gc:#c46a6a}',
          '.idk-card [data-grp="shop.cat"]{--gc:#d4a94f}',
          '.idk-card [data-grp="shop.legacy"]{--gc:#a97ad4}',
          '.idk-card [data-grp="wish.town"]{--gc:#5f9ad0}',
          '.idk-card [data-grp="wish.dream"]{--gc:#b98ad0}',
          '.idk-card [data-grp="ach.bronze"]{--gc:#c98b4b}',
          '.idk-card [data-grp="ach.silver"]{--gc:#aebccb}',
          '.idk-card [data-grp="ach.gold"]{--gc:#e0b45c}',
          '.idk-card [data-grp="ach.platinum"]{--gc:#7fd0c4}',
          '.idk-card [data-grp="ach.diamond"]{--gc:#8fa9ff}',
          '.idk-grp.idk-wishgrp{margin-top:8px}',
          /* v0.17：最近流水薄条。固定两行高，超出省略，绝不出现滚动条。 */
          '.idk-recent{flex:none;border-top:1px solid #232d3a;padding:4px 10px 5px;min-height:26px;max-height:40px;',
          'overflow:hidden;font-size:10px;line-height:1.45;color:#78848f}',
          '.idk-recent-list{list-style:none;margin:0;padding:0;max-height:29px;overflow:hidden}',
          '.idk-recent-list li{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
          '.idk-recent-list li .t{color:#5f6b79;margin-right:6px}',
          '.idk-recent .idk-empty{padding:0;font-size:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
          '.idk-side .idk-list[hidden],.idk-side .idk-mkt[hidden]{display:none!important}',
          /* 小卡也留一条「最近」：side 只显示薄条，页签与内容区仍藏起来；收起时整条藏掉。 */
          '.idk-card:not(.is-big) .idk-side{display:block;border-top:1px solid #232d3a}',
          '.idk-card:not(.is-big) .idk-side .idk-tabs,.idk-card:not(.is-big) .idk-side .idk-pane{display:none!important}',
          '.idk-card[data-collapsed="1"] .idk-side{display:none!important}',
          '.idk-shoplist{font-size:11.5px}',
          '.idk-shoplist li{padding:5px 1px;align-items:center;line-height:1.35}',
          /* v0.23：资助三档行更紧一点，三支队伍一屏放得下 */
          '.idk-shoplist li[data-sp]{padding:3px 1px;line-height:1.28}',
          '.idk-shoplist li[data-sp] .nm i{display:block;line-height:1.3}',
          /* v0.20：说明句一律另起一行、字更暗更小，行与行之间加一道极淡的分隔——不再挤成一团 */
          '.idk-shoplist li .nm{color:#dbe6f1}',
          '.idk-shoplist li .nm i{display:block;font-size:10px;line-height:1.45;margin:2px 0 0;color:#7f8c9b;white-space:normal}',
          '.idk-shoplist li[data-own],.idk-shoplist li[data-food],.idk-shoplist li[data-cust]{border-bottom:1px solid rgba(255,255,255,.05)}',
          /* v0.11 回本估算：单独一行跟在说明下面，268px 的卡片里也不挤 */
          '.idk-shoplist li .nm i.pb{display:block;margin-left:0;margin-top:2px;color:#7f8c9b;font-size:9.5px;opacity:.95}',
          /* v0.12 大窗里价格右对齐不参与压缩 */
          '.idk-card.is-big .idk-shoplist li .nm{white-space:normal}',
          '.idk-shoplist .idk-buy{flex:none;white-space:nowrap}',
          '.idk-shoplist .idk-buy{padding:2px 9px;line-height:1.5;border-radius:6px}',
          /* 组内的次级小标题（套装 / 货品 / 猫粮）也做成窄标签，别和组标题抢 */
          '.idk-shoplist .idk-sec{margin:7px 0 2px;padding:3px 7px;border-bottom:none;border-radius:5px;',
          'background:rgba(255,255,255,.035);font-size:9.5px;letter-spacing:.4px;color:#93a3b5}',
          /* v0.8：伙食行整行可点，当前档高亮（只由 data.foodTier 决定，纯函数，重画安全） */
          '.idk-shoplist li[data-food],.idk-shoplist li[data-cust]{cursor:pointer}',
          '.idk-shoplist li[data-food]:hover,.idk-shoplist li[data-cust]:hover{color:#e7eef7}',
          '.idk-shoplist li.on .nm{color:#e0b45c}',
          /* v0.6：货架页签底部的「未上架」解锁区；小卡只留一行摘要 */
          /* v0.13：目标提示比一行长（窄卡 268px 实测被切掉「可以买…」），
             改成最多两行、超出才省略；悬停仍可在 title 里看到完整两段。 */
          '.idk-lockhint{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden;',
          'padding:4px 10px;background:#141c26;border-top:1px solid #232d3a;line-height:1.45;',
          'color:#c9a45e;font-size:10.5px;cursor:pointer;white-space:normal;overflow-wrap:anywhere}',
          '.idk-lockhint:hover{background:#19222e;color:#e0b45c}',
          '.idk-lockhint[hidden]{display:none}',
          '.idk-card.is-big .idk-lockhint{display:none}',
          /* v0.9：收起成迷你条 —— 藏锁提示，脚注贴到底，标题栏整条可点展开 */
          '.idk-card[data-collapsed="1"] .idk-lockhint{display:none}',
          '.idk-card[data-collapsed="1"] .idk-foot{border-top:none;border-radius:0 0 13px 13px}',
          '.idk-card[data-collapsed="1"] .idk-head{cursor:pointer}',
          '.idk-card[data-collapsed="1"] .idk-grip{display:none}',
          /* 迷你条只用一行放得下的信息：钱袋 / 今日 / 第几天，其余先收起来 */
          '.idk-card[data-collapsed="1"] .idk-need,.idk-card[data-collapsed="1"] .idk-soldwrap,.idk-card[data-collapsed="1"] .idk-tier{display:none}',
          '.idk-card[data-collapsed="1"] .idk-foot{gap:8px;font-size:11px;padding:6px 10px}',
          '.idk-net{color:#8fd39a;font-size:10px;white-space:nowrap}',
          '.idk-unlock{flex:none;display:flex;flex-direction:column;min-height:0;margin-top:5px;padding-top:2px;border-top:1px dashed #263443}',
          '.idk-unlock[hidden]{display:none}',
          '.idk-unlock .idk-sec{margin-top:0;border-bottom:none}',
          '.idk-unlocklist{max-height:132px;overflow:auto;font-size:11px;line-height:1.55}',
          '.idk-card.is-big .idk-pane[data-pane="stock"] .idk-stocklist{flex:0 0 auto;max-height:72px}',
          '.idk-card.is-big .idk-pane[data-pane="stock"] .idk-unlock{flex:0 1 auto;max-height:110px;overflow:hidden}',
          '.idk-card.is-big .idk-pane[data-pane="stock"] .idk-unlocklist{max-height:84px;columns:auto;column-count:auto;column-width:auto;column-fill:auto}',
          '.idk-unlocklist li{align-items:center;gap:5px;padding:1px 0}',
          '.idk-unlocklist .nm{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
          '.idk-unlocklist .need{flex:none;color:#7f8c9b;font-size:10px}',
          '.idk-unlocklist .idk-short{flex:none;color:#e07c7c;font-size:10px}',
          '.idk-unlocklist .idk-buy{padding:0 6px;line-height:1.45;font-size:10.5px}',
          /* v0.13：未上架列表里名字后的「?」小按钮 —— 只借现有气泡说话，不开面板 */
          '.idk-unlocklist .idk-lore{flex:none;width:14px;height:14px;padding:0;border-radius:50%;cursor:pointer;',
          'border:1px solid #33475c;background:#182231;color:#8ea6bd;font-size:9.5px;line-height:12px;text-align:center}',
          '.idk-unlocklist .idk-lore:hover{color:#e0b45c;border-color:#6b5a34;background:#1d2837}',
          /* v0.14 心愿页：名望一行 + 城建/圆梦两张列表，沿用 .idk-list 与 .idk-sec 的样式 */
          '.idk-regh{flex:none;font-size:10px;color:#7f8c9b;padding:0 0 2px}',
          /* 心愿页整页一个滚动条：两张表都按内容自然高，行永远整行，不裁半行 */
          '.idk-side[data-tab="dream"] .idk-pane[data-pane="dream"]{overflow-y:auto;overflow-x:hidden}',
          '.idk-pane[data-pane="dream"] .idk-townlist,.idk-pane[data-pane="dream"] .idk-dreamlist,.idk-pane[data-pane="dream"] .idk-sponsorlist{flex:none;min-height:0;max-height:none;overflow:visible}',
          /* 窄侧栏（实测 232px）：受控两行网格 —— 第 1 行 名称 + 右侧按钮/差 X，第 2 行 说明句整行、只许一行 */
          '.idk-dreamlist li,.idk-townlist li,.idk-sponsorlist li{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;column-gap:8px;min-height:38px;padding:5px 0;overflow:hidden;border-bottom:1px solid rgba(255,255,255,.05)}',
          '.idk-dreamlist li .nm,.idk-townlist li .nm,.idk-sponsorlist li .nm{grid-column:1;grid-row:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;line-height:1.4;color:#dbe6f1}',
          '.idk-dreamlist li > i,.idk-townlist li > i,.idk-sponsorlist li > i{grid-column:1/-1;grid-row:2;display:block;min-width:0;max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-style:normal;font-size:10px;color:#7d8a99;line-height:1.5;margin-top:2px}',
          '.idk-dreamlist .rt,.idk-townlist .rt,.idk-sponsorlist .rt{grid-column:2;grid-row:1;justify-self:end;display:flex;align-items:center;gap:6px;white-space:nowrap;min-width:0}',
          '.idk-dreamlist .idk-buy,.idk-townlist .idk-buy,.idk-sponsorlist .idk-buy{padding:2px 9px;line-height:1.5;font-size:10.5px;white-space:nowrap;flex:none;border-radius:6px}',
          '.idk-dreamlist .idk-short,.idk-townlist .idk-short,.idk-sponsorlist .idk-short{flex:none;color:#e07c7c;font-size:9.5px;white-space:nowrap}',
          '.idk-dreamlist .p,.idk-townlist .p,.idk-sponsorlist .p{flex:none;white-space:nowrap}',
          /* v0.16：星砂集市横幅（开店页顶部，不开市时整块 hidden 不占位）与法阵充能小标 */
          '.idk-mkt{flex:none;margin:0 0 4px;padding:4px 7px;border:1px solid #6b5a2a;border-radius:6px;',
          'font-size:10.5px;line-height:1.4;color:#e8cd8a;background:rgba(122,96,36,.22);white-space:normal}',
          '.idk-mkt[hidden]{display:none}',
          '.idk-rite{color:#8fc3e0;font-size:9.5px;white-space:nowrap}',
          '.idk-legacy{color:#c9a7e8}',
          /* 店铺页那行「装修 木系三件 差 …」在 232px 下会撑出横向滚动条：最多两行，超出才省略 */
          '.idk-shoplist .idk-sec,.idk-shoplist .idk-sec *{min-width:0;max-width:100%;white-space:normal!important;overflow-wrap:anywhere}',
          '.idk-shoplist{overflow-x:hidden}',
          /* v0.14 存档：导出/导入共用一个框，贴在店铺页签底部（不弹窗） */
          '.idk-savebox{flex:none;margin-top:6px;padding-top:5px;border-top:1px dashed #263443}',
          '.idk-savebox[hidden]{display:none}',
          '.idk-savemsg{font-size:10px;color:#8fa0b4;margin-bottom:3px;line-height:1.35}',
          '.idk-savemsg[data-bad="1"]{color:#e07c7c}',
          '.idk-ta{width:100%;box-sizing:border-box;height:76px;resize:vertical;border-radius:6px;border:1px solid #2b3542;',
          'background:#0f1620;color:#c3cede;font:10px/1.4 ui-monospace,Consolas,monospace;padding:4px 6px;outline:none}',
          '.idk-saverow{display:flex;gap:6px;margin-top:4px}',
          '.idk-saveapply[hidden]{display:none}',
          /* v0.14 成就：店铺页底部按组排，未解锁的半灰（不给弹窗、不给额外页签） */
          '.idk-achh{font-size:9.5px;color:#7f8c9b;opacity:.85;padding:3px 0 1px;letter-spacing:.5px}',
          '.idk-ach[data-ach="0"]{opacity:.55}',
          /* 勾/点放名字前面；已解锁的 line 一行省略号（全文在 title），未解锁不显示 i */
          '.idk-ach .mark{flex:none;color:#7f8c9b;font-size:10px;line-height:1.35}',
          '.idk-ach[data-ach="1"] .mark{color:#8fd39a}',
          '.idk-ach .nm{flex:1;min-width:0;overflow:hidden}',
          '.idk-shoplist li.idk-ach .nm i{display:block;max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
          '.idk-ach{min-height:30px}',
          '.idk-ach[data-ach="1"] .p{color:#8fd39a}',
          /* v0.15 成就独占一页：mark/标题/说明三块排成两行网格（说明是 li 的第三个子元素，不是 .nm 里的 i） */
          '.idk-achlist li.idk-ach{display:grid;grid-template-columns:12px minmax(0,1fr);column-gap:8px;align-items:baseline;min-height:0;padding:5px 0;border-bottom:1px solid rgba(255,255,255,.05)}',
          '.idk-achlist li.idk-ach .mark{grid-column:1;grid-row:1;text-align:center}',
          '.idk-achlist li.idk-ach .nm{grid-column:2;grid-row:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#dbe6f1}',
          '.idk-achlist li.idk-ach > i{grid-column:2;grid-row:2;display:block;min-width:0;max-width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-style:normal;font-size:10px;color:#7d8a99;line-height:1.45;margin-top:2px}',
          /* 已圆 / 已建成：整行压暗，只留 after 那句话 */
          '.idk-dreamlist li[data-out="1"],.idk-townlist li[data-out="1"],.idk-sponsorlist li[data-out="1"]{opacity:.62}'
        ].join('');

        var LABEL = {
          wait: '等客', serve: '招呼', tally: '报价', restock: '上货',
          count: '数钱', doze: '守夜', away: '后屋'
        };

        var LINES = {
          wait: ['炉子还旺着。', '今晚的月亮不错。', '谁要一把能捅穿板甲的匕首？', '这批药水是新配的。'],
          serve: ['欢迎，随便看。', '骑士老爷，需要点什么？', '这把是矮人打的，不二价。', '您眼光不错。'],
          tally: ['三十枚，抹个零。', '这价已经亏本了。', '要包起来的。', '现银还是赊账？'],
          restock: ['后屋还有两箱。', '得去补点货了。', '这批卷轴有点受潮。'],
          count: ['今天不错。', '数来数去还是这么点。', '铜板真沉。'],
          doze: ['……', '（打盹）', '炉火噼啪。'],
          away: ['（去后屋搬货了）']
        };

        /* ================= v0.13 文案包（src/lore.js，拿不到就静默降级） =================
           story-writer 的 lore.js 挂在 window.MagicShopLore 上。这里每次用的时候现取、不缓存：
           页面先加载 widget、后加载 lore 也能用；没有就返回空串/退回旧文案，不抛错、不打印。
           所以 widget 单独跑（比如 dev/card.html 没引 lore.js）时，行为与 v0.12.6 一模一样。 */
        function lorePack() {
          var L = window.MagicShopLore;
          return (L && typeof L === 'object') ? L : null;
        }
        function itemLore(k) {
          var L = lorePack(), s = L && L.ITEM_LORE ? L.ITEM_LORE[k] : '';
          return typeof s === 'string' ? s : '';
        }
        function custLine(cat, rnd) {
          var L = lorePack(), arr = L && L.CUST_LINES ? L.CUST_LINES[cat] : null;
          if (!arr || !arr.length) return '';
          var r = typeof rnd === 'function' ? rnd : Math.random;
          var s = arr[Math.min(arr.length - 1, Math.floor(r() * arr.length))];
          return typeof s === 'string' ? s : '';
        }
        /* 常客名字池：有 lore 的 30 个名字就用它；没有返回 null（调用方退回 v0.11 那 12 位） */
        function regNamePool() {
          var L = lorePack(), a = L && L.REG_NAMES, out = [], i;
          if (!a || !a.length) return null;
          for (i = 0; i < a.length; i++) if (a[i]) out.push(String(a[i]));
          return out.length ? out : null;
        }
        function regQuip(name) {
          var L = lorePack(), s = L && L.REG_QUIP ? L.REG_QUIP[name] : '';
          return typeof s === 'string' ? s : '';
        }
        /* ================= v0.13 常客长线 / 街面事件台词 =================
           三样都来自 lore.js，取不到一律返回空串，调用方退回原有文案（不报错）。 */
        /* 同一位常客第 seen 次光顾：正好踩在 REG_STORY_AT 的某一档就给对应那段。
           档位表是数据（lore.REG_STORY_AT = [3,6,10]），这里不写死次数。 */
        function regStory(name, seen) {
          var L = lorePack(), segs, at, i, n;
          if (!L || !L.REG_STORY || !name) return '';
          segs = L.REG_STORY[name];
          at = L.REG_STORY_AT;
          if (!segs || !segs.length || !at || !at.length) return '';
          n = Number(seen) || 0;
          for (i = 0; i < at.length && i < segs.length; i++) {
            if (n === (Number(at[i]) || 0)) return typeof segs[i] === 'string' ? segs[i] : '';
          }
          return '';
        }
        /* 从数组里随机一条；没有就返回空串 */
        function pickLine(arr, rnd) {
          if (!arr || !arr.length) return '';
          var r = typeof rnd === 'function' ? rnd : Math.random;
          var s = arr[Math.min(arr.length - 1, Math.floor(r() * arr.length))];
          return typeof s === 'string' ? s : '';
        }
        function eventLine(kind, rnd) {
          var L = lorePack(), a = L && L.EVENT_LINES ? L.EVENT_LINES[kind] : null;
          return pickLine(a, rnd);
        }

        /* ================= v0.13 客人三态台词 / 看天自言自语 / 每日一句并池 =================
           进店、看货、空手走各一句（lore.js 的 CUST_ENTER / CUST_BROWSE / CUST_EMPTY）。
           同一类客的同一句话不连着说两遍：先把上一条从候选里剔掉再抽，抽不到就退回原句。
           看天那句（WEATHER_LINES）按天气 id 取，同样不连着重复。 */
        var lastSaid = {};
        function pickFresh(arr, key, rnd) {
          if (!arr || !arr.length) return '';
          var pool = [], i;
          for (i = 0; i < arr.length; i++) {
            if (typeof arr[i] === 'string' && arr[i] && arr[i] !== lastSaid[key]) pool.push(arr[i]);
          }
          if (!pool.length) pool = arr;
          var s = pickLine(pool, rnd);
          if (s) lastSaid[key] = s;
          return s;
        }
        function custSay(kind, cat, rnd) {
          var L = lorePack(), tbl = L && L[cat] ? L[cat] : null;
          return pickFresh(tbl ? tbl[kind] : null, cat + ':' + kind, rnd);
        }
        function weatherLine(id, rnd) {
          var L = lorePack(), a = L && L.WEATHER_LINES ? L.WEATHER_LINES[id] : null;
          return pickFresh(a, 'w:' + id, rnd);
        }
        /* 每日一句的池子：widget 原有的 WORLDS（44 条）+ lore.DAILY_LINES 的补充（36 条）。
           现取不缓存：lore 后加载也能并进来；没有 lore 时就是原来的 44 条。 */
        function worldPool() {
          var L = lorePack(), extra = L && L.DAILY_LINES, out = WORLDS.slice(), i;
          if (extra && extra.length) {
            for (i = 0; i < extra.length; i++) if (typeof extra[i] === 'string' && extra[i]) out.push(extra[i]);
          }
          return out;
        }

        /* ================= v0.13 里程碑与通关小结 =================
           MILESTONES 都来自 src/lore.js（story-writer 的文案包）。
           拿不到就返回空数组 / 空串：不报错、不写流水、不在界面上留空行。
           每条里程碑吃哪个计数，见 lore.js 文件头：
             first_sale / orders_10 → 成交单数；items_100 → 卖出件数；
             broke_first → 钱袋见底次数；clear_first → 通关次数；
             gen_2 → 代数；gold_10k → 累计赚到（铜）；days_30 → 营业天数。 */
        function milestoneList() {
          var L = lorePack(), a = L && L.MILESTONES;
          return (a && a.length) ? a : [];
        }
        var MILESTONE_COUNTER = {
          first_sale: 'orders', orders_10: 'orders', items_100: 'items',
          broke_first: 'broke', clear_first: 'clears', gen_2: 'generation',
          gold_10k: 'gold', days_30: 'days'
        };
        /* 到了没有：at<=0 的条目（「见底」）表示「至少发生过一次」，其余按 ≥ at */
        function milestoneHit(m, st) {
          if (!m || !m.id) return false;
          var key = MILESTONE_COUNTER[m.id];
          if (!key || !st) return false;
          var v = Number(st[key]) || 0, at = Number(m.at) || 0;
          return at <= 0 ? v > 0 : v >= at;
        }
        /* ================= v0.11 常客（故事） → v0.13 名册扩到 30 位 =================
           12 套「客种 + 偏好货类 + 招呼 + 扑空台词」当模板，按序套到 lore.js 的 30 个名字上：
           同一套模板的人说同一类话，但各自是镇上的另一个人。
           ids 固定 reg_0..reg_29（按序号，不跟名字走），换池子也不丢熟客次数。
           节奏与 15% 小费一个字没动：每位每 REG_PERIOD 天来一次、一天最多 REG_MAX_DAY 位，
           买不到偏好货只叹气走人（不扣分、不进 rest），第 3 次起给小费。
           lore.js 没加载时退回 v0.11 那 12 位，行为与 0.12.6 完全一致。 */
        var REG_TEMPLATES = [
          { kind: 'villager', pref: ['potion', 'mana', 'scroll'],
            line: '又是你这店，给我留的药水呢？', miss: '哎，连瓶药水都没有，我回去熬草药吧。' },
          { kind: 'villager', pref: ['dagger', 'potion'],
            line: '打铁的手抖，先来看看你家的东西稳不稳。', miss: '没有合手的，那我回去把锤子磨磨。' },
          { kind: 'merc', pref: ['dagger', 'helm', 'shield', 'scale'],
            line: '护具呢？上回那副甲片救了我一命。', miss: '空手？那我只能拿木板挡了。' },
          { kind: 'merc', pref: ['dagger', 'shield', 'scale'],
            line: '老规矩，能挡刀的都要。', miss: '啧，这趟白跑。' },
          { kind: 'rogue', pref: ['dagger', 'scroll', 'potion'],
            line: '别问我从哪来，问价就行。', miss: '你这家店，越来越正经了。' },
          { kind: 'rogue', pref: ['scroll', 'dagger', 'potion'],
            line: '有能开锁的东西吗？没有也行。', miss: '算了，我自己想办法。' },
          { kind: 'mage', pref: ['wand', 'orb', 'tome', 'scroll', 'rune', 'star'],
            line: '我需要一件……不会炸的东西。', miss: '不巧。我明天再来碰运气。' },
          { kind: 'mage', pref: ['tome', 'scroll', 'wand', 'rune'],
            line: '老师让我买卷轴，钱不太够。', miss: '那我先抄一份吧……' },
          { kind: 'noble', pref: ['orb', 'tome', 'star', 'scale', 'rune'],
            line: '客厅缺一件镇得住场面的东西。', miss: '这里竟没有一件配得上我的壁炉。' },
          { kind: 'noble', pref: ['star', 'orb', 'tome', 'rune'],
            line: '听说你这里有不常见的东西。', miss: '不常见？我看是没货吧。' },
          { kind: 'outsider', pref: ['rune', 'star', 'tome', 'scale'],
            line: '我在找夜里会发亮的那种。', miss: '那我去别的城问问。' },
          { kind: 'outsider', pref: ['rune', 'star', 'scale'],
            line: '你柜台底下那东西，还在吗？', miss: '……下次吧。' }
        ];
        /* lore 拿不到时用的 12 位老常客名字（与 v0.12.6 一字不差） */
        var REG_FALLBACK_NAMES = [
          '玛莎婶', '铁匠霍尔姆', '佣兵格尔达', '独眼托瓦尔', '丝手薇拉', '九个指头',
          '法师阿尔德里克', '学徒米伦', '拉维妮娅夫人', '卡修斯勋爵', '游方学者忒莎', '深渊使者萨布尔'
        ];

        var REGULARS = null, REGULARS_TAG = '';
        /* 名册按需构建：lore.js 可能比 widget.js 后加载，所以每次取用时对一下「池子签名」，
           变了就重建 —— ids 按序号固定，熟客次数不会因为换名字丢掉。 */
        function regList() {
          var L = lorePack();
          var tag = L ? String(L.VER || 'x') + ':' + ((L.REG_NAMES && L.REG_NAMES.length) || 0) : '';
          if (!REGULARS || REGULARS_TAG !== tag) { REGULARS = buildRegulars(); REGULARS_TAG = tag; }
          return REGULARS;
        }
        function buildRegulars() {
          var names = regNamePool() || REG_FALLBACK_NAMES, out = [], i, t;
          for (i = 0; i < names.length; i++) {
            t = REG_TEMPLATES[i % REG_TEMPLATES.length];
            out.push({ id: 'reg_' + i, kind: t.kind, name: names[i], pref: t.pref.slice(), line: t.line, miss: t.miss });
          }
          return out;
        }
        var REG_PERIOD = 2;      /* 每位每 2 个游戏日最多来一次 */
        /* 一天最多排 6 位：常客是插队顶掉生客的（不额外加客流、不动经济），6/天 只占日常客流的两三成。
           v0.13 名册 30 位之后，这个上限不变 —— 变的只是「今天轮到镇上哪几张脸」，
           每天上门的常客总数还是 6 位，所以客流与收入侧跟 0.12.6 一样。 */
        var REG_MAX_DAY = 6;
        var REG_TIP_AFTER = 3;   /* 第 3 次起算熟客，开始给小费 */
        var REG_TIP_RATE = 0.15; /* 小费 = 这单成交额的 15% */
        var REG_TIP_MIN = 3;     /* 但不少于 3 铜、不多于 30 铜（小额，不改经济平衡） */
        var REG_TIP_MAX = 30;
        var REG_QUIP_AFTER = 3;  /* v0.13：第 3 次光顾起，改用 lore 的口头禅打招呼 */

        function regularById(id) {
          var list = regList();
          for (var i = 0; i < list.length; i++) { if (list[i].id === id) return list[i]; }
          return null;
        }
        /* 跨天时排今天的常客：客源没解锁的不排；没过 REG_PERIOD 天的不排；
           洗一下再截取，免得永远从名单第一位开始。rnd 传 Math.random，方便自测注入。 */
        function regularsDueToday(day, custOwned, regs, rnd) {
          var list = regList(), due = [], i, r, rec, last;
          for (i = 0; i < list.length; i++) {
            r = list[i];
            if (r.kind !== 'villager' && !(custOwned && custOwned[r.kind])) continue;
            rec = regs && regs[r.id];
            last = rec ? (Number(rec.d) || 0) : 0;
            if (last > 0 && (Number(day) || 0) - last < REG_PERIOD) continue;
            due.push(r.id);
          }
          for (i = due.length - 1; i > 0; i--) {
            var j = Math.floor(rnd() * (i + 1)), t = due[i];
            due[i] = due[j]; due[j] = t;
          }
          return due.slice(0, REG_MAX_DAY);
        }
        /* 小费：ord = 这是第几次买成。不到熟客门槛返回 0。 */
        function regularTip(gain, ord) {
          if ((Number(ord) || 0) < REG_TIP_AFTER) return 0;
          return clampN(Math.round((Number(gain) || 0) * REG_TIP_RATE), REG_TIP_MIN, REG_TIP_MAX);
        }

        /* ================= v0.11 每日一句（故事） =================
           世界碎片：开门/打烊各说一句，洗牌袋轮播，一轮之内不重复。
           洗完重排时把上一轮的末条挪到后面，避免「刚说完又说一遍」。 */
        var WORLDS = [
          '城门口的守卫换岗了。', '北边的雪线又往下压了一截。', '酒馆的琴手换了个调子。',
          '有人在井边贴了张通缉令。', '面包房的炉子今天熄得早。', '教会钟楼少响了一下。',
          '河面的雾比昨天厚。', '一群候鸟从塔顶掠过。', '铁匠铺的锤声停了半夜。',
          '石板路上多了道车辙。', '街角的孩子在赌铜板。', '有人在数今年的第一场霜。',
          '驿站的马换成了黑骡。', '药草铺进了新一批苦根。', '城墙根下有人在挖什么。',
          '月亮边缘缺了一角。', '集市末尾那家摊子收了。', '有人往护城河里扔了花。',
          '公会栏上添了一条新悬赏。', '收税官的马车从南门过。', '巷子里有人在烧旧信。',
          '一只猫在屋檐上蹲到天亮。', '打更人换了个新人。', '城南某户在办喜事。',
          '塔里的灯今晚亮着。', '有商队在北门搭了帐篷。', '井水带着铁味。',
          '有人提到了龙，又闭了嘴。', '码头卸了半船旧书。', '街口的告示被人撕了一角。',
          '学徒们在广场上练火苗。', '药价又涨了两个铜。', '有位骑士把马拴在店外。',
          '城郊的坟上多了新土。', '有人在找一件丢了的法器。', '风把晾着的布吹翻了。',
          '老钟表匠今天没开门。', '有人从传送门那头回来。', '城门外传来不熟悉的号角。',
          '酒馆老板在擦一只空杯。', '一只信鸽落在窗台上歇脚。', '有人在问星砂从哪来。',
          '下过雨，石阶很滑。', '城里的狗整夜没叫。'
        ];
        /* state 就是存档对象（用它的 wBag / wLast / wSig 三个字段），rnd 可注入。
           v0.13：池子换成 worldPool()（44 + lore.DAILY_LINES）。池子长度变了（lore 后加载、
           或者存档来自没装 lore 的版本）就重排一袋，免得旧下标越界或漏掉新句。 */
        function nextWorldLine(state, rnd) {
          if (!state) return '';
          rnd = rnd || Math.random;
          var pool = worldPool();
          var stale = !state.wBag || !state.wBag.length || (Number(state.wSig) || 0) !== pool.length;
          if (!stale) {
            for (var k = 0; k < state.wBag.length; k++) {
              if (!(state.wBag[k] >= 0 && state.wBag[k] < pool.length)) { stale = true; break; }
            }
          }
          if (stale) {
            var bag = [], i, j, t;
            for (i = 0; i < pool.length; i++) bag.push(i);
            for (i = bag.length - 1; i > 0; i--) { j = Math.floor(rnd() * (i + 1)); t = bag[i]; bag[i] = bag[j]; bag[j] = t; }
            if (pool.length > 1 && bag[0] === state.wLast) { t = bag[0]; bag[0] = bag[1]; bag[1] = t; }
            state.wBag = bag;
            state.wSig = pool.length;
          }
          var idx = state.wBag.shift();
          state.wLast = idx;
          return pool[idx];
        }

        /* ================= v0.11 回本估算 =================
           给「这件东西多久能回本」一个粗估：天数 = 价格 / 日增收益。
           算不出来（纯装饰、ΔR 极小、回本超过 120 天）就说「长期收益」，绝不乱写数字。 */
        function paybackText(cost, gain) {
          cost = Number(cost) || 0;
          gain = Number(gain) || 0;
          if (cost <= 0 || gain <= 0) return '长期收益';
          var days = cost / gain;
          if (!isFinite(days) || days > 120) return '长期收益';
          if (days < 1) return '1 天内回本';
          return '约 ' + Math.round(days) + ' 天回本';
        }

        function rand(a, b) { return a + Math.random() * (b - a); }
        function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
        function pad2(n) { return (n < 10 ? '0' : '') + n; }
        function hhmm(d) { return pad2(d.getHours()) + ':' + pad2(d.getMinutes()); }
        function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]; }); }
        /* v0.12.1：07:00 开门、24:00 打烊，只留 00:00–07:00 关门，把中段空窗压平。
           原来 09:00–23:00 营业、一关就是 10 小时，一天 12 分钟里近一半时间店里是黑的，
           玩家常常先看到一间没人的店；现在一天里 7 小时打烊（只剩下半夜），进门基本都在营业。 */
        function isOpen(hour) { return hour >= 7 && hour < 24; }
        /* 入夜：19:00 到次日 8:00（关店时段）——水晶吊灯只在这段时间加价 */
        function isNight(hour) { return hour >= 19 || hour < 8; }
        function clampN(v, a, b) { return v < a ? a : (v > b ? b : v); }

        /* ---------------- 货币显示 ----------------
           唯一存储是铜整数；fmt 是唯一折算处。1 金 = 100 银 = 10000 铜。
           规则：最高位必显，其余只显非零位，最多三段。 */
        function fmt(n) {
          n = Math.max(0, Math.round(Number(n) || 0));
          if (n < 100) return n + ' 铜';
          var g = Math.floor(n / 10000);
          var s = Math.floor((n % 10000) / 100);
          var c = n % 100;
          var out = [];
          if (g) out.push(g + ' 金');
          if (s) out.push(s + ' 银');
          if (c || !out.length) out.push(c + ' 铜');
          return out.join(' ');
        }
        /* v0.9 脚注用紧凑写法：只给最高两位，避免「今日 +29 金 98 银 80 铜」这种长串把脚注挤爆 */
        function fmtShort(n) {
          n = Math.round(Math.abs(Number(n) || 0));
          if (n >= 10000) { var g = Math.floor(n / 10000), s = Math.floor((n % 10000) / 100); return g + ' 金' + (s ? ' ' + s + ' 银' : ''); }
          if (n >= 100) { var ss = Math.floor(n / 100), c = n % 100; return ss + ' 银' + (c ? ' ' + c + ' 铜' : ''); }
          return n + ' 铜';
        }
        /* 钱袋图标用哪一档：金 / 银 / 铜 */
        function topUnit(n) {    n = Math.max(0, Math.round(Number(n) || 0));
          return n >= 10000 ? 'g' : (n >= 100 ? 's' : 'c');
        }
        function coinIcon(u, size) {
          var s = window.MagicShopScene;
          return s && s.coinIcon ? s.coinIcon(u, size || 13) : '';
        }

        /* ---------------- 纯逻辑（Node 测试用） ---------------- */
        function stockTotal(stock) {
          var t = 0;
          for (var k in stock) if (stock.hasOwnProperty(k)) t += stock[k];
          return t;
        }

        /* 这一单买什么：按客人身份偏好，但库存要有 */
        function pickItem(items, stock, kind) {
          var avail = items.filter(function (it) { return (stock[it.k] || 0) > 0; });
          if (!avail.length) return null;
          var want;
          var pref = prefOf(kind);
          if (kind === 'thief') want = avail.filter(function (i) { return i.price >= 60; });      /* 小贼挑贵的拿 */
          else if (kind === 'rogue') want = avail.filter(function (i) { return i.price < 60; });  /* 盗贼客只捡便宜货 */
          else if (kind === 'knight') want = avail.filter(function (i) { return i.k === 'shield' || i.k === 'helm' || i.k === 'dagger' || i.k === 'scale'; });
          else if (pref) want = avail.filter(function (i) { return pref.indexOf(i.k) >= 0; });
          else want = avail;
          if (!want.length) want = avail;
          return pick(want);
        }

        /* ---------------- v0.11 陈列位（前台 3 格）与套装 ----------------
           陈列位只是「展示引用」：data.slots 里放 3 个货 key（'' = 空格），
           上架不扣后仓库存，卖出时才扣 —— 库存总数与 v0.10 的语义完全一致。
           客人只从这 3 格里挑；某格卖空、后仓还有同款就自动补上，没有就换下一件。 */
        var SLOT_N = 3;
        function normSlots(arr) {
          var out = [], i;
          for (i = 0; i < SLOT_N; i++) out.push(arr && typeof arr[i] === 'string' ? arr[i] : '');
          return out;
        }
        function byKeyMap(items) {
          var m = {}, i;
          for (i = 0; i < items.length; i++) m[items[i].k] = items[i];
          return m;
        }
        /* 清掉失效/卖空的格，再从「后仓有货且没在别的格」的候选里按价格从高到低补满 */
        function fillSlots(keys, items, stock) {
          var cur = normSlots(keys), map = byKeyMap(items), out = [], seen = {}, cand = [], i, k, it, ci = 0;
          for (i = 0; i < SLOT_N; i++) {
            k = cur[i];
            if (k && map[k] && (stock[k] || 0) > 0 && !seen[k]) { out.push(k); seen[k] = true; }
            else out.push('');
          }
          for (i = 0; i < items.length; i++) {
            it = items[i];
            if ((stock[it.k] || 0) > 0 && !seen[it.k]) cand.push(it);
          }
          cand.sort(function (a, b) { return (b.price || 0) - (a.price || 0); });
          for (i = 0; i < SLOT_N; i++) {
            if (out[i]) continue;
            while (ci < cand.length && seen[cand[ci].k]) ci++;
            if (ci >= cand.length) break;
            out[i] = cand[ci].k;
            seen[cand[ci].k] = true;
            ci++;
          }
          return out;
        }
        /* 陈列位上「后仓还有货」的那几件 */
        function slotItems(keys, items, stock) {
          var map = byKeyMap(items), cur = normSlots(keys), out = [], i, it;
          for (i = 0; i < SLOT_N; i++) {
            it = map[cur[i]];
            if (it && (stock[cur[i]] || 0) > 0) out.push(it);
          }
          return out;
        }
        /* 客人只在陈列位里挑；偏好兜底沿用 pickItem（3 格全空才返回 null → 客人空手走） */
        function pickFromSlots(keys, items, stock, kind) {
          var on = slotItems(keys, items, stock);
          return on.length ? pickItem(on, stock, kind) : null;
        }
        /* 常客用严格偏好版：陈列位上没有他想要的就扑空（故事要求，不兜底） */
        function pickFromSlotsPref(keys, items, stock, pref) {
          var on = slotItems(keys, items, stock), hits = [], i;
          for (i = 0; i < on.length; i++) if (pref && pref.indexOf(on[i].k) >= 0) hits.push(on[i]);
          return hits.length ? pick(hits) : null;
        }
        /* 套装：同类装修集齐三件才有额外加成；flow 乘进 rushFactor、price 乘进 priceOf，各自只乘一次 */
        var SETS = [
          { id: 'wood', name: '木系三件', need: ['board', 'counter', 'stool'], flow: 0.9, price: 1, tag: '客流 −10%' },
          { id: 'luxe', name: '华丽三件', need: ['chand', 'glass', 'portal'], flow: 1, price: 1.1, tag: '客单价 +10%' }
        ];
        /* v0.13 陈列加成：前台 3 格摆着 3 种不同的货 → 客流 +8%（沿用 boon 的 +8% = ×0.92 口径）。
           重复货（同一 key 占两格）不算；格子里的货卖空（库存 0）也不算——那格等于空的。
           纯函数：只吃 slots/stock，跟 setsMul 一样放在模块级，方便 test/logic.mjs 直接测。 */
        function displayOn(slots, stock) {
          var cur = normSlots(slots), seen = {}, n = 0, i, k;
          for (i = 0; i < SLOT_N; i++) {
            k = cur[i];
            if (!k || seen[k] || ((stock || {})[k] || 0) <= 0) continue;
            seen[k] = true; n++;
          }
          return n;
        }
        function displayFull(slots, stock) { return displayOn(slots, stock) >= SLOT_N; }
        function setMissing(set, owned) {
          return set.need.filter(function (k) { return !owned(k); });
        }
        function setsMul(flow, owned) {
          var m = 1, i, s;
          for (i = 0; i < SETS.length; i++) {
            s = SETS[i];
            if (!setMissing(s, owned).length) m *= (flow ? s.flow : s.price);
          }
          return m;
        }

        /* ============ v0.21 装修收益收敛（治「越叠越滚」） ============
           旧版每件装修各乘一个系数（0.9 × 0.88 × 0.8 …），十几件叠完客流能到 ×4；
           而它们只值几十铜、买断永久生效 —— 于是「越买越滚、钱越花越不值钱」。v0.21 起：
             · 单件效应整体下调到 +1.5%–+6%（满装修合计约 +66% 客流，不再 ×4）；
             · 价格按「回本约 4–8 天」重定：同一个档位的铺子买得起一件，但不是白捡；
             · 加成一律相乘、与购买顺序无关（不制造「先买占便宜、后买白买」的陷阱）。
           FLOW_ITEMS / PRICE_ITEMS 是唯一真源：rushFactor()、priceOf()、upgradeGain()、
           经营页的收益明细全部从这里取值，改一处全对。 */
        var FLOW_ITEMS = [
          { id: 'board', name: '今日有货木牌', mul: 0.94 },              /* 客流 +6.4% */
          { id: 'glass', name: '玻璃橱窗', mul: 0.93 },                  /* +7.5% */
          { id: 'stool', name: '门口长凳', mul: 0.97 },                  /* +3.1% */
          { id: 'awning', name: '檐下挡雨棚', mul: 0.92 },               /* +8.7% */
          { id: 'salt', name: '门边盐线', mul: 0.98 },                   /* +2.0% */
          { id: 'lamp', name: '门口油灯', mul: 0.98 },                   /* +2.0% */
          { id: 'tallglass', name: '蒙尘穿衣镜', mul: 0.97 },            /* +3.1% */
          { id: 'bell', name: '黄铜门铃', mul: 0.96 },                   /* +4.2% */
          { id: 'chand', name: '水晶吊灯', mul: 0.98 },                  /* +2.0% */
          { id: 'sign', name: '金字招牌', mul: 0.92 },                   /* +8.7% */
          { id: 'portal', name: '魔法传送门', mul: 0.86 }                /* +16.3% */
        ];
        var PRICE_ITEMS = [
          { id: 'counter', name: '实木柜台', mul: 1.03 },
          { id: 'accounts', name: '旧账本', mul: 1.02 },
          { id: 'mat', name: '迎客草席', mul: 1.02 }
        ];
        function flowMulOf(d) {
          var u = (d && d.upgrades) || {}, m = 1, i;
          for (i = 0; i < FLOW_ITEMS.length; i++) if (u[FLOW_ITEMS[i].id]) m *= FLOW_ITEMS[i].mul;
          if (!setMissing(SETS[0], function (k) { return !!u[k]; }).length) m *= SETS[0].flow;
          return m;
        }
        function priceMulOf(d) {
          var u = (d && d.upgrades) || {}, m = 1, i;
          for (i = 0; i < PRICE_ITEMS.length; i++) if (u[PRICE_ITEMS[i].id]) m *= PRICE_ITEMS[i].mul;
          return m;
        }
        /* 逐件明细：b = 这一件带来的百分比（客流是「+多少客流」，客单价是「+多少价」） */
        function flowParts(d) {
          var u = (d && d.upgrades) || {}, out = [], i;
          for (i = 0; i < FLOW_ITEMS.length; i++) if (u[FLOW_ITEMS[i].id]) {
            out.push({ id: FLOW_ITEMS[i].id, name: FLOW_ITEMS[i].name, b: 1 / FLOW_ITEMS[i].mul - 1 });
          }
          if (!setMissing(SETS[0], function (k) { return !!u[k]; }).length) {
            out.push({ id: 'set.wood', name: '木系三件（套）', b: 1 / SETS[0].flow - 1 });
          }
          return out;
        }
        function priceParts(d) {
          var u = (d && d.upgrades) || {}, out = [], i;
          for (i = 0; i < PRICE_ITEMS.length; i++) if (u[PRICE_ITEMS[i].id]) {
            out.push({ id: PRICE_ITEMS[i].id, name: PRICE_ITEMS[i].name, b: PRICE_ITEMS[i].mul - 1 });
          }
          return out;
        }
        function upMul(u, id) { return u.id === id ? u.mul : 1; }
        /* 摘掉一件装修之后，客流倍数会变成多少（经营页/回本估算算「这一件每天多赚多少」用） */
        function flowMulWithout(d, id) {
          var u = {}, k;
          for (k in (d.upgrades || {})) if (Object.prototype.hasOwnProperty.call(d.upgrades, k)) u[k] = d.upgrades[k];
          delete u[id];
          var m = 1, i;
          for (i = 0; i < FLOW_ITEMS.length; i++) if (u[FLOW_ITEMS[i].id]) m *= FLOW_ITEMS[i].mul;
          if (!setMissing(SETS[0], function (x) { return !!u[x]; }).length) m *= SETS[0].flow;
          return m;
        }
        function priceMulWithout(d, id) {
          var u = {}, k;
          for (k in (d.upgrades || {})) if (Object.prototype.hasOwnProperty.call(d.upgrades, k)) u[k] = d.upgrades[k];
          delete u[id];
          var m = 1, i;
          for (i = 0; i < PRICE_ITEMS.length; i++) if (u[PRICE_ITEMS[i].id]) m *= PRICE_ITEMS[i].mul;
          return m;
        }

        /* ============ v0.11 无尽模式：通关判定 + 传家宝（转生） ============
           通关 = 铺子顶配 + 12 件装修全买 + 3 条渠道全开 + 5 类客种全解锁。
           通关后不锁数值（想接着刷就接着刷），只在店铺页底多出「交给下一位店主」；
           重开时三选一带走一样东西，代数 +1，脚注记「第 N 代」。 */
        var BOONS = [
          { id: 'tier', name: '祖传招牌', note: '起始 Lv.1', desc: '下一位店主接手就有个正经门面，少熬一天' },
          { id: 'flow', name: '老主顾名单', note: '客流 +8%', desc: '熟客跟着招牌走，客流常年 +8%' },
          { id: 'gold', name: '压箱底的铜板', note: '起始 500 铜', desc: '柜底翻出五百铜，够直接进两批好货' }
        ];
        function boonById(id) {
          var i;
          for (i = 0; i < BOONS.length; i++) if (BOONS[i].id === id) return BOONS[i];
          return null;
        }
        /* 通关判定：d 是存档对象（不在 mount 里，方便脚本直接测）。客种要除村民外的 5 类全开 */
        function clearedNow(d) {
          if (!d || (d.tier | 0) < TIERS.length - 1) return false;
          var i, ups = d.upgrades || {}, chs = d.channels || {}, cus = d.cust || {};
          for (i = 0; i < UPGRADES.length; i++) if (!ups[UPGRADES[i].id]) return false;
          for (i = 0; i < CHANNELS.length; i++) if (!chs[CHANNELS[i].id]) return false;
          for (i = 0; i < CUSTS.length; i++) if (CUSTS[i].id !== 'villager' && !cus[CUSTS[i].id]) return false;
          return true;
        }
        /* 把传承加成落进存档：纯数据改动，画面那边再去 applyDecor / paint */
        function applyBoon(d, id) {
          d.boon = id || '';
          if (id === 'tier') d.tier = 1;
          if (id === 'gold') d.gold = 500;
          return d;
        }
        function boonFlow(id) { return id === 'flow' ? 0.92 : 1; }

        /* ============ v0.11 天气 / 集市日（t7 场景侧已给 scene.setWeather / setFestival，这里只算数值） ============
           天气每天日结时抽一次，权重 晴 .55 / 阴 .20 / 雨 .17 / 雪 .08；倍率只乘一次：
             雨 客流 ×0.88；雪 客流 ×0.80、客单价 ×1.08；阴 客流 ×0.95；晴 ×1
           节日由天数直接推导，不另存状态机：每 7 天一次集市日（客流 ×1.30），
           其余日子里每 23 天一次灯节（客单价 ×1.05）——同一天重复调永远只有一次倍率。 */
        var WEATHER_ROLL = [
          { k: 'sunny', w: 0.55 }, { k: 'overcast', w: 0.20 }, { k: 'rain', w: 0.17 }, { k: 'snow', w: 0.08 }
        ];
        var WEATHER_MUL = {
          sunny: { flow: 1, price: 1 },
          overcast: { flow: 0.95, price: 1 },
          rain: { flow: 0.88, price: 1 },
          snow: { flow: 0.80, price: 1.08 }
        };
        function normWeather(k) { return WEATHER_MUL[k] ? k : 'sunny'; }
        function weatherFlow(k) { return WEATHER_MUL[normWeather(k)].flow; }
        function weatherPrice(k) { return WEATHER_MUL[normWeather(k)].price; }
        function rollWeather(rnd) {
          var r = typeof rnd === 'number' ? rnd : Math.random();
          var acc = 0, i, w = WEATHER_ROLL;
          for (i = 0; i < w.length; i += 1) {
            acc += w[i].w;
            if (r < acc) return w[i].k;
          }
          return 'sunny';
        }
        function isMarketDay(day) { var d = day | 0; return d > 0 && d % 7 === 0; }
        function isLanternDay(day) { var d = day | 0; return d > 0 && d % 23 === 11; }
        function festOn(day) { return isMarketDay(day) || isLanternDay(day); }
        function festFlow(day) { return isMarketDay(day) ? 1.3 : 1; }
        function festPrice(day) { return isLanternDay(day) ? 1.05 : 1; }

        /* ============ v0.12.3 打烊时段的一句有用信息 ============
           00:00–07:00 不能营业，锁提示行原本还挂着白天那句「下一步买什么」——对玩家没意义。
           改成一句话：今天净赚多少 + 明天什么天气、客流会怎样 + 是不是集市日。
           纯函数（只吃数字，不读全局），node 里能直接验三种情形。 */
        var WEATHER_CN = { sunny: '晴', overcast: '阴', rain: '雨', snow: '雪' };
        function closeHint(net, weather, nextDay) {
          var n = Math.round(Number(net) || 0);
          var w = normWeather(weather);
          var f = weatherFlow(w);
          /* 口径跟倍率一致：晴 = 正常里最好（会多一些），阴略少（差不多），雨雪明显少（会少些） */
          var word = f >= 0.99 ? '会多一些' : (f >= 0.9 ? '差不多' : '会少些');
          /* 注意 fmtShort 会把负数取绝对值，符号必须自己拼（fmt 更是直接把负数钳成 0） */
          var t = '🌙 打烊了，今天净赚 ' + (n < 0 ? '−' : '+') + fmtShort(Math.abs(n));
          var t2 = '明天' + (WEATHER_CN[w] || '晴') + '，客人' + word;
          if (isMarketDay(nextDay | 0)) t2 += '，还是集市日';
          return t + '\n' + t2;
        }
        /* ================= v0.14 心愿 / 城建 / 成就 / 四季 =================
           lore.js 的 DREAMS / TOWN / ACHIEVEMENTS / CLOSE_LINES 现取不缓存（story-writer 还没写、
           或 dev 页没引 lore.js 时一律当空表）：页面照常跑，不报错、不打印、不留空行。
           下面的判定全是纯函数（只吃存档对象），node 里能直接跑：见文件底 _logic 导出。 */
        function loreList(key) {
          var L = lorePack(), a = L && L[key], out = [], i, x;
          if (!a || !a.length) return out;
          for (i = 0; i < a.length; i++) {
            x = a[i];
            if (!x || typeof x !== 'object' || !x.id) continue;
            out.push(x);
          }
          return out;
        }
        function dreamLore() { return loreList('DREAMS'); }
        function townLore() { return loreList('TOWN'); }
        function achLore() { return loreList('ACHIEVEMENTS'); }
        /* 打烊独白：一天最多一句，取不到就返回空串（调用方静默跳过） */
        function closeLore(rnd) {
          var L = lorePack();
          return pickLine(L && L.CLOSE_LINES, rnd);
        }
        function dreamById(id) {
          var a = dreamLore(), i;
          for (i = 0; i < a.length; i++) if (a[i].id === id) return a[i];
          return null;
        }
        function townById(id) {
          var a = townLore(), i;
          for (i = 0; i < a.length; i++) if (a[i].id === id) return a[i];
          return null;
        }
        function townIndex(id) {
          var a = townLore(), i;
          for (i = 0; i < a.length; i++) if (a[i].id === id) return i;
          return -1;
        }
        function hasIn(arr, id) { return Array.isArray(arr) && arr.indexOf(id) >= 0; }
        /* v0.20：城建不再一档一档排队——十处都能先动工，玩家按自己攒钱的速度挑
           （价格仍是递增的，所以自然有先后，但不再强制） */
        function townOpen(d, id) {
          var i = townIndex(id);
          return i >= 0 && !hasIn(d && d.town, id) && !(d && d.rites && d.rites['town' + (i + 1)]);
        }
        function moneyOf(v) { return Math.max(0, Math.round(Number(v) || 0)); }

        /* ---- 四季：v0.16 起由「墙钟日历天」推，每 3 个日历天换一季（第 1–3 天 = 春）。
           原来是每 30 个游戏日一季（= 6 分钟一季），四季在挂机里根本看不见；现在四季是长线的东西，
           和「挂 7 天」同一个尺度。颜色/画法一个字没动，只动了换季的节拍。配 scene.setSeason(0..3) ---- */
        var SEASON_CN = ['春', '夏', '秋', '冬'];
        var SEASON_DAYS = 3;
        function seasonOf(day) {
          var d = Math.floor(Number(day) || 0);
          if (d < 1) d = 1;
          return Math.floor((d - 1) / SEASON_DAYS) % 4;
        }
        /* 到第 day 天为止见过了几季（成就 season_4 用）：第 1–3 天算 1 季，四季走满 = 第 10 天 */
        function seasonsSeen(day) {
          var d = Math.max(1, Math.floor(Number(day) || 0));
          return Math.floor((d - 1) / SEASON_DAYS) + 1;
        }
        function seasonWord(day) { return SEASON_CN[seasonOf(day)] || '春'; }
        /* §6.4 每季挂 1 件限定货：本季那件在架上的卖价 +20%，过了这季就得等明年。
           不新增美术，只在货品/店铺行上打「本季限定」的标记（scene 那边认不出的货一律跳过）。
           限定货只挑中后段货：开局那两件白送的和治疗药水要留着原价，否则新玩家第一单的钱就对不上。 */
        var SEASON_GOODS = ['helm', 'orb', 'rune', 'scale'];
        function seasonGoodOf(day) { return SEASON_GOODS[seasonOf(day)] || ''; }
        /* §6.3 星砂集市的 6 件限定货：开市那 48 小时里 +30% 卖价 */
        var MARKET_GOODS = ['dagger', 'orb', 'tome', 'rune', 'star', 'scale'];
        function marketGoodOn(k) { return MARKET_GOODS.indexOf(k) >= 0; }

        /* ---- 常客四级：等级只看 data.regs[id].n，不另存字段 ----
           0 生面孔 / 1–4 熟客 / 5–11 朋友 / >=12 知己（UI 上英文 + 中文一起显示） */
        var REG_LEVELS = ['Stranger', 'Regular', 'Friend', 'Confidant'];
        var REG_LEVEL_CN = ['生面孔', '熟客', '朋友', '知己'];
        function regLevel(n) {
          var v = Math.max(0, Math.floor(Number(n) || 0));
          if (v >= 12) return 3;
          if (v >= 5) return 2;
          if (v >= 1) return 1;
          return 0;
        }
        function regLevelName(n) { return REG_LEVELS[regLevel(n)] + ' ' + REG_LEVEL_CN[regLevel(n)]; }

        /* ---- 36 条成就 ----
           cond 是封闭词表（lore.ACHIEVEMENTS 的 id 就是 cond），判定只读存档里已有的计数。
           打点：成交（sellTo）、跨日结算（settleDay）、买装修/货/渠道/客种、常客上门、
           天气与季节切换、随机事件、打烊。解锁只写 data.ach[cond] = 1 + 一条流水（lore 的 line），
           不给钱、不给属性 —— 成就只是记一笔。 */
        function achCtx(d) {
          d = d || {};
          var regs = d.regs || {}, ids = Object.keys(regs), i, n;
          var seen = 0, lv1 = 0, lv2 = 0, x10 = 0, x20 = 0;
          for (i = 0; i < ids.length; i++) {
            n = Math.max(0, Math.floor(Number(regs[ids[i]] && regs[ids[i]].n) || 0));
            if (n > 0) seen++;
            if (n >= 5) lv1++;
            if (n >= 12) lv2++;
            if (n >= 10) x10++;
            if (n >= 20) x20++;
          }
          var ups = d.upgrades || {}, chs = d.channels || {}, cus = d.cust || {};
          var upN = 0, chN = 0, cuN = 0, setN = 0, owned;
          for (i = 0; i < UPGRADES.length; i++) if (ups[UPGRADES[i].id]) upN++;
          for (i = 0; i < CHANNELS.length; i++) if (chs[CHANNELS[i].id]) chN++;
          for (i = 0; i < CUSTS.length; i++) if (CUSTS[i].id === 'villager' || cus[CUSTS[i].id]) cuN++;
          owned = function (k) { return !!ups[k]; };
          for (i = 0; i < SETS.length; i++) if (!setMissing(SETS[i], owned).length) setN++;
          var num = function (v) { return Math.max(0, Math.floor(Number(v) || 0)); };
          return {
            orders: num(d.nOrders), items: num(d.nSold), gold: num(d.nGold), cash: num(d.gold),
            bestNet: Math.floor(Number(d.bestNet) || 0), bestPrice: num(d.bestPrice),
            day: Math.max(1, num(d.day)), debtFree: num(d.noDebtRun), tier: num(d.tier),
            items12: Array.isArray(d.unlocked) ? d.unlocked.length : 0,
            deco: upN, sets: setN, channels: chN, custs: cuN,
            slotsFull: displayFull(d.slots || [], d.stock || {}) ? 1 : 0,
            regSeen: seen, regFriend: lv1, regConf: lv2, reg10: x10, reg20: x20,
            dreams: Array.isArray(d.dreams) ? d.dreams.length : 0,
            town: Array.isArray(d.town) ? d.town.length : 0,
            fame: Math.min(300, num(d.fame)),
            weather: (d.weatherSeen && typeof d.weatherSeen === 'object') ? Object.keys(d.weatherSeen).length : 0,
            seasons: seasonsSeen(calDays(Number(d.clock) || Date.now(), d.realStart)),
            clears: num(d.nClear), wanderer: num(d.nWanderer), busker: num(d.nBusker),
            night: num(d.nightSeen), market: num(d.marketSeen), lantern: num(d.lanternSeen),
            /* ---- v0.16 §6.5：墙钟那几项 ---- */
            gen: num(d.gen),
            gift: d.gift ? 1 : 0,
            calDays: calDays(Number(d.clock) || Date.now(), d.realStart),
            rites: (d.rites && typeof d.rites === 'object') ? Object.keys(d.rites).filter(function (k) { return !!d.rites[k]; }).length : 0,
            forbidden: Array.isArray(d.unlocked) ? d.unlocked.filter(function (k) {
              var map = (window.MagicShopScene && window.MagicShopScene.ITEM_BY_KEY) || null;
              var it = map ? map[k] : null;
              return !!it && it.tier === 'forbidden';
            }).length : 0,
            ghosts: num(d.nGhost),
            mktRounds: (d.market && typeof d.market === 'object') ? num(d.market.n) : 0
          };
        }
        function achHit(cond, c) {
          c = c || {};
          switch (String(cond || '')) {
            /* —— 经营 —— */
            case 'first_sale': return c.orders >= 1;
            case 'orders_100': return c.orders >= 100;
            case 'items_1000': return c.items >= 1000;
            case 'profit_day_100': return c.bestNet >= 100;
            case 'gold_10000': return c.gold >= 10000;
            case 'debt_free_10': return c.debtFree >= 10;
            case 'days_30': return c.day >= 30;
            case 'days_100': return c.day >= 100;
            case 'best_price_500': return c.bestPrice >= 500;
            /* —— 收藏 —— */
            case 'tier_2': return c.tier >= 2;
            case 'tier_max': return c.tier >= TIERS.length - 1;
            case 'items_12': return c.items12 >= 12;
            case 'deco_13': return c.deco >= UPGRADES.length;
            case 'sets_2': return c.sets >= SETS.length;
            case 'channels_3': return c.channels >= CHANNELS.length;
            case 'cust_all': return c.custs >= CUSTS.length;
            case 'slots_full': return !!c.slotsFull;
            case 'vault': return c.cash >= 10000;
            /* —— 人情 —— */
            case 'reg_friend_1': return c.regFriend >= 1;
            case 'reg_confidant_1': return c.regConf >= 1;
            case 'reg_20': return c.reg20 >= 1;
            case 'regs_10_x10': return c.reg10 >= 10;
            case 'dreams_5': return c.dreams >= 5;
            case 'dreams_20': return c.dreams >= 20;
            case 'town_5': return c.town >= 5;
            case 'fame_50': return c.fame >= 50;
            case 'fame_100': return c.fame >= 100;
            /* —— 见闻 —— */
            case 'weather_4': return c.weather >= 4;
            case 'season_4': return c.seasons >= 4;
            case 'wanderer_1': return c.wanderer >= 1;
            case 'market_day': return c.market >= 1;
            case 'lantern_day': return c.lantern >= 1;
            case 'busker_1': return c.busker >= 1;
            case 'night_shift': return c.night >= 1;
            case 'clear_first': return c.clears >= 1;
            case 'reg_30': return c.regSeen >= 30;
            /* —— v0.16 §6.5：第七天之后才有的事 —— */
            case 'gen_once': return c.gen >= 1;
            case 'gift_any': return c.gift >= 1;
            case 'forbidden_12': return c.forbidden >= 12;
            case 'rites_13': return c.rites >= 13;
            case 'ghost_10': return c.ghosts >= 10;
            case 'market_3': return c.mktRounds >= 3;
            case 'fame_200': return c.fame >= 200;
            case 'cal_30': return c.calDays >= 30;
            /* ---- v0.18：补到 50 条（五档各 10） ---- */
            case 'first_rite': return c.rites >= 1;
            case 'days_200': return c.day >= 200;
            case 'orders_500': return c.orders >= 500;
            case 'market_6': return c.mktRounds >= 6;
            case 'gen_3': return c.gen >= 3;
            case 'fame_300': return c.fame >= 300;
            default: return false;
          }
        }
        /* 还没解锁的那几条（渲染与打点都用它） */
        function achMissing(list, got) {
          var out = [], i, a;
          list = list || [];
          got = got || {};
          for (i = 0; i < list.length; i++) {
            a = list[i];
            if (!a || !a.id || got[a.id]) continue;
            out.push(a);
          }
          return out;
        }

        /* ---- 存档导出 / 导入 ----
           导出 = 把内存档整个抄成一段 JSON（跳过落盘时间戳这类运行时字段），玩家自己复制走；
           导入只做校验与解包（JSON 能解析、v 兼容、关键字段类型对），覆盖内存档由调用方负责，
           失败给一行原因，不弹窗。 */
        var SAVE_SKIP = ['savedAt', 'saveSeq', 'cleared'];
        function buildSave(d) {
          var out = { app: 'magic-shop', ver: VER, at: Date.now() }, k;
          d = d || {};
          for (k in d) {
            if (!d.hasOwnProperty(k)) continue;
            if (SAVE_SKIP.indexOf(k) >= 0 || k.indexOf('__') === 0) continue;
            out[k] = d[k];
          }
          return out;
        }
        function importSave(text) {
          var raw = String(text == null ? '' : text).trim(), p, i, k;
          if (!raw) return { ok: false, reason: '还没有内容：把导出那段粘进来。' };
          try {
            p = JSON.parse(raw);
          } catch (e) {
            return { ok: false, reason: '这段不是 JSON（可能少复制了一半）。' };
          }
          if (!p || typeof p !== 'object' || Array.isArray(p)) return { ok: false, reason: '这段 JSON 不是一份存档。' };
          if (!p.hasOwnProperty('v')) return { ok: false, reason: '存档里没有版本号 v，不是这里的档。' };
          var v = Number(p.v);
          if (!isFinite(v)) return { ok: false, reason: '版本号 v 不是数字。' };
          /* v0.16 §7：认得 v7；v1–v6 的老档照样能导，缺的字段由 normalizeLoaded 补 */
          if (v > 7) return { ok: false, reason: '这是更新版本的档（v' + v + '），这里只认 v7 及更早。' };
          var nums = ['gold', 'day', 'tier', 'fame'];
          for (i = 0; i < nums.length; i++) {
            k = nums[i];
            if (p[k] == null) continue;
            if (typeof p[k] !== 'number' || !isFinite(p[k])) return { ok: false, reason: '字段 ' + k + ' 该是数字。' };
          }
          var objs = ['stock', 'fresh', 'upgrades', 'channels', 'cust', 'regs', 'ach', 'milestones', 'weatherSeen', 'rites', 'market'];
          for (i = 0; i < objs.length; i++) {
            k = objs[i];
            if (p[k] == null) continue;
            if (typeof p[k] !== 'object' || Array.isArray(p[k])) return { ok: false, reason: '字段 ' + k + ' 该是一组键值。' };
          }
          var arrs = ['unlocked', 'slots', 'log', 'regToday', 'dreams', 'town'];
          for (i = 0; i < arrs.length; i++) {
            k = arrs[i];
            if (p[k] == null) continue;
            if (!Array.isArray(p[k])) return { ok: false, reason: '字段 ' + k + ' 该是一个列表。' };
          }
          if (p.day != null && Math.floor(p.day) < 1) return { ok: false, reason: '天数不合法（小于 1）。' };
          if (p.gold != null && (p.gold < 0 || p.gold > 1e12)) return { ok: false, reason: '钱数不合法。' };
          return { ok: true, save: p };
        }

        /* v0.12.1：到店频率的放慢系数（营业时段 14h→17h）。为什么是 1.95 而不是理论比例 ——
           按 17/14 ≈ 1.214 放太轻：实测只掉 3.9% 客流，因为等客只占事件环的一段，
           乘上去会被补货/数钱/事件稀释。20 日推演扫灵敏度后取 1.95：
           全解锁 ≈ 14.54 日 ≈ 2.91h（1.90→2.84h、2.00→3.11h，全都落在 2.85–3.15h 的目标带里）。
           再要微调，只改这一个数即可；它只作用于「等客」，不碰补货/数钱/守夜节奏。 */
        var PULL = 1.95;

        /* 下一步：营业时段拉客/补货/数钱，打烊后守夜/数钱/后屋 */
        function decide(hour, stock, gold, restockCost) {
          var total = stockTotal(stock);
          if (!isOpen(hour)) {
            if (total <= 3) return { act: 'restock', wait: rand(50, 90) };
            var r = Math.random();
            if (r < 0.22) return { act: 'count', wait: rand(20, 40) };
            if (r < 0.3) return { act: 'away', wait: rand(18, 34) };
            return { act: 'doze', wait: rand(40, 90) };
          }
          /* 货架空了一定去补货（钱不够也会去翻旧货，否则店会死锁） */
          if (total <= 0) return { act: 'restock', wait: rand(30, 55) };
          if (total <= 2 && Math.random() < 0.35) return { act: 'restock', wait: rand(35, 60) };
          if (Math.random() < 0.10) return { act: 'count', wait: rand(25, 45) };
          /* v0.7：街边摊一天来十来个客人（原来 5–14 秒一个，像流水线） */
          return { act: 'customer', wait: rand(14, 30) };
        }

        var TIMING = { serve: 1.2, tally: 1.2, leave: 0.8, restock: 4.0, count: 3.2 };

        /* ---------------- 控件 ---------------- */
          /* v0.27 传承天赋池：从 3 样扩到 6 样，二周目才有「换个活法」的意思。
             放在 mount 外层 —— 首帧渲染时就会读它，写在 mount 里会因为 var 还没赋值先抛错。 */
        var GIFTS = [
          { id: 'flow', name: '人流', desc: '来的人多一成', flow: 0.9 },
          { id: 'price', name: '定价', desc: '每件多卖 8%', price: 1.08 },
          { id: 'rite', name: '法阵', desc: '充能快两成', rite: 0.8 },
          { id: 'loot', name: '运气', desc: '冒险队带回来的多一半', loot: 1.5 },
          { id: 'rent', name: '铺租', desc: '每天的房租少两成', rent: 0.8 },
          { id: 'stock', name: '货源', desc: '补货便宜一成半', stock: 0.85 }
          ];
        function giftById(id) { for (var gi = 0; gi < GIFTS.length; gi++) if (GIFTS[gi].id === id) return GIFTS[gi]; return null; }

        function mount(opts) {
          opts = opts || {};
          if (document.getElementById('idk-card')) return document.getElementById('idk-card');
          if (!document.getElementById('idk-style')) {
            var st = document.createElement('style');
            st.id = 'idk-style';
            st.textContent = CSS;
            document.head.appendChild(st);
          }

          var data = load();
          /* v0.12.6：用户定的规矩是「DSH 关着就停、开着就在营业」。关着那段时间既不卖货也不收房租，
             所以把游戏时钟整体往后挪一段（dayStart += 离开时长）——回来接着上次那一刻继续，
             不会因为跨了几个日界一开机就白扣好几天房租。 */
          (function shiftClockForDowntime() {
            var awayMs = Number(data.savedAt) ? (Date.now() - Number(data.savedAt)) : 0;
            if (awayMs > 60000 && Number(data.dayStart)) data.dayStart += awayMs;
          })();
          var items = (window.MagicShopScene && window.MagicShopScene.ITEMS) || [];
          var itemByKey = {};
          items.forEach(function (it) { itemByKey[it.k] = it; });

          function isUnlocked(k) { return data.unlocked.indexOf(k) >= 0; }
          function addUnlocked(k) {
            if (k && itemByKey[k] && data.unlocked.indexOf(k) < 0) data.unlocked.push(k);
          }

          /* 存档迁移（§F.3）：老档没有 v，gold 原样当铜；已经在卖的货不能锁回去。
             v0.16：判定改成「比 v6 还老」—— v6/v7 存档都带着真实的 unlocked 表，不必再按等级补一遍；
             而补一遍会让传承之前的 v7 档把 12 件禁忌货也一起算成「已解锁」。 */
          var legacy = (data.v | 0) < 6;
          var rawUnlocked = data.unlocked;
          if (!Array.isArray(rawUnlocked)) {
            data.unlocked = [];
            if (rawUnlocked && typeof rawUnlocked === 'object') {
              Object.keys(rawUnlocked).forEach(function (k) { if (rawUnlocked[k]) data.unlocked.push(k); });
            }
          }
          var seenU = {};
          data.unlocked = data.unlocked.filter(function (k) {
            if (!itemByKey[k] || seenU[k]) return false;
            seenU[k] = true;
            return true;
          });
          items.forEach(function (it) { if (it.free || (it.unlock | 0) === 0) addUnlocked(it.k); });
          if (legacy) items.forEach(function (it) {
            if ((it.lv | 0) <= (data.tier | 0) && !isForbidden(it)) addUnlocked(it.k);
          });
          /* v0.16 §7：存档版本 6 → 7。这一次只「补默认值」，绝不清账、绝不动玩家已有的铜币：
             老档读进来时 rites{} / gen / gift / realStart / market{} 缺哪补哪，
             gold / tier / unlocked / 成就 / 里程碑 一个字段都不碰。
             localStorage 的键还是 dsh:magic-shop:v8，没有改（改键等于把老玩家的店弄丢）。 */
          if ((data.v | 0) < 7) {
            if (!data.rites || typeof data.rites !== 'object' || Array.isArray(data.rites)) data.rites = {};
            data.gen = Math.max(0, Number(data.gen) | 0);
            if (['flow', 'price', 'rite', 'loot', 'rent', 'stock'].indexOf(data.gift) < 0) data.gift = '';
            /* realStart = 这家店第一次开张的墙钟刻度；老档没有，就拿「当下」当起点，
               别拿 dayStart 反推（那是营业钟，迁移时早就滚过很多轮了）。 */
            if (!(Number(data.realStart) > 0)) data.realStart = Date.now();
            if (!data.market || typeof data.market !== 'object' || Array.isArray(data.market)) data.market = { n: 0, round: -1 };
            if (!data.ui || typeof data.ui !== 'object' || Array.isArray(data.ui)) data.ui = { open: {} };
            if (!data.ui.open || typeof data.ui.open !== 'object' || Array.isArray(data.ui.open)) data.ui.open = {};
            data.v = 7;
          }
          /* v0.23：资助名单 / 猫粮 / 经营页记账这类「只补不动」的字段，无论哪版档都在这里收一遍 */
          if (!Array.isArray(data.sponsor)) data.sponsor = [];
          /* v0.27：老档没有 tut 字段 —— 他们已经会玩了，直接算走完；新档由默认值 0 从第一步开始 */
          if (typeof data.tut !== 'number') data.tut = 9;
          data.sponsor = data.sponsor.filter(function (x) { return !!sponsorById(x); });
          data.catFood = clampN(Math.round(Number(data.catFood) || 0), 0, CATFOODS.length);
          if (!Array.isArray(data.revHist)) data.revHist = [];
          data.revHist = data.revHist.slice(-7).map(function (v) { return Math.max(0, Math.round(Number(v) || 0)); });
          data.custToday = Math.max(0, Math.round(Number(data.custToday) || 0));
          /* v0.24：经营页的五本今日小账（老档补 0，不清别的） */
          data.lootToday = Math.max(0, Math.round(Number(data.lootToday) || 0));
          data.rentToday = Math.max(0, Math.round(Number(data.rentToday) || 0));
          data.mealToday = Math.max(0, Math.round(Number(data.mealToday) || 0));
          data.sponsorToday = Math.max(0, Math.round(Number(data.sponsorToday) || 0));
          data.restockToday = Math.max(0, Math.round(Number(data.restockToday) || 0));
          data.catToday = Math.max(0, Math.round(Number(data.catToday) || 0));   /* v0.26：今天买猫粮花掉的 */
          data.v = 7;
          /* v0.13 常客名册扩到 30 位：旧档那 12 位的熟客次数，按「第几套模板」搬到新名册的对应那位 */
          migrateRegs();
          /* v0.14：读档后的字段清洗集中在这里 —— 首次 mount 与「导入存档」共用同一套规则。
             老档缺的新字段一律补默认值（缺就补，绝不重置），键名与 data.v 都不动。 */
          function normalizeLoaded() {
            if (!Array.isArray(data.dreams)) data.dreams = [];
            if (!Array.isArray(data.town)) data.town = [];
            /* v0.16 §7：五个新字段在这里再补一次 —— 「导入存档」不走 load()，走的是这条口子 */
            if (!data.rites || typeof data.rites !== 'object' || Array.isArray(data.rites)) data.rites = {};
            data.gen = Math.max(0, Number(data.gen) | 0);
            if (['flow', 'price', 'rite', 'loot', 'rent', 'stock'].indexOf(data.gift) < 0) data.gift = '';
            if (!(Number(data.realStart) > 0)) data.realStart = Date.now();
            if (!data.market || typeof data.market !== 'object' || Array.isArray(data.market)) data.market = { n: 0, round: -1 };
            data.market.n = Math.max(0, Number(data.market.n) | 0);
            data.market.round = Number(data.market.round) | 0;
            /* v0.17：折叠状态只在缺失时补；老档已有的 ui.open 原样保留（不把折起来的组重新展开） */
            if (!data.ui || typeof data.ui !== 'object' || Array.isArray(data.ui)) data.ui = { open: {} };
            if (!data.ui.open || typeof data.ui.open !== 'object' || Array.isArray(data.ui.open)) data.ui.open = {};
            data.fame = clampN(Math.round(Number(data.fame) || 0), 0, 300);
            if (!data.ach || typeof data.ach !== 'object' || Array.isArray(data.ach)) data.ach = {};
            data.noDebtRun = Math.max(0, data.noDebtRun | 0);
            if (!data.weatherSeen || typeof data.weatherSeen !== 'object' || Array.isArray(data.weatherSeen)) data.weatherSeen = {};
            if (!data.wishAsked || typeof data.wishAsked !== 'object' || Array.isArray(data.wishAsked)) data.wishAsked = {};
            data.nWanderer = Math.max(0, data.nWanderer | 0);
            data.nBusker = Math.max(0, data.nBusker | 0);
            data.nightSeen = Math.max(0, data.nightSeen | 0);
            data.marketSeen = Math.max(0, data.marketSeen | 0);
            data.lanternSeen = Math.max(0, data.lanternSeen | 0);
            /* v0.14.1：老档没有 season 时按天数回填；否则建场景时窗景会停在春（见 mount 里建完场景后的同步） */
            data.season = (data.season == null) ? seasonOf(calDays(Date.now(), data.realStart)) : clampN(data.season | 0, 0, 3);
            /* v0.14 删掉的每日委托：老档里还可能留着 data.quest，读档时清掉，别跟着导出再传下去 */
            if ('quest' in data) delete data.quest;
            data.closeSaidDay = (data.closeSaidDay == null) ? -1 : Math.floor(Number(data.closeSaidDay) || 0);
            data.bestNet = Math.round(Number(data.bestNet) || 0);
            data.gold = Math.max(0, Math.round(Number(data.gold) || 0));
            data.revToday = Math.max(0, Math.round(Number(data.revToday) || 0));
          data.debt = Math.max(0, Math.round(Number(data.debt) || 0));
          /* v0.9：今日净赚 = 钱袋 − 当天开局的钱袋；revLast 用来给离线补算定速 */
          data.goldDay0 = Math.round(Number(data.goldDay0));
          if (!isFinite(data.goldDay0)) data.goldDay0 = data.gold;
          data.revLast = Math.max(0, Math.round(Number(data.revLast) || 0));
          if (!data.stock || typeof data.stock !== 'object') data.stock = {};
          if (!Array.isArray(data.log)) data.log = [];
          if (!data.upgrades || typeof data.upgrades !== 'object') data.upgrades = {};
          if (!data.channels || typeof data.channels !== 'object') data.channels = {};
          if (!data.fresh || typeof data.fresh !== 'object') data.fresh = {};
          data.tier = clampN(data.tier | 0, 0, TIERS.length - 1);
          /* v0.8 新字段：老档没有这两个键 → 补默认即可读（默认档=中档，与 v0.7 现状等价，零迁移） */
          data.foodTier = clampN(data.foodTier == null ? 1 : (data.foodTier | 0), 0, MEALS.length - 1);
          if (!data.cust || typeof data.cust !== 'object') data.cust = { villager: 1 };
          data.cust.villager = 1;
          if (data.mealSlot == null) data.mealSlot = -1;
          data.mealMissed = !!data.mealMissed;
          data.mealDebtDays = Math.max(0, data.mealDebtDays | 0);
          /* t7：mealTier=上一顿实际吃到（付得起）的档，只作展示；foodTier 永远只记玩家所选档 */
          data.mealTier = clampN(data.mealTier == null ? -1 : (data.mealTier | 0), -1, MEALS.length - 1);
          data.mealDebtDay = Math.max(0, data.mealDebtDay | 0);   /* 欠账按天：上次记账的日序号 */

          /* 只有「等级到了 + 已解锁」的货占库存；没买的货不占格 */
          items.forEach(function (it) {
            if ((it.lv | 0) > data.tier || !isUnlocked(it.k)) { delete data.stock[it.k]; return; }
            var q = data.stock[it.k];
            if (typeof q !== 'number' || !isFinite(q)) data.stock[it.k] = maxStock();
            else data.stock[it.k] = Math.max(0, Math.round(q));
          });
          }
          normalizeLoaded();

          /* v0.17：折叠状态只有「明确关了」才算关；缺键 = 展开。这样老档读进来默认全开。 */
          function uiOpen(key) {
            return !(data.ui && data.ui.open && data.ui.open[key] === 0);
          }
          function uiToggle(key) {
            if (!data.ui || typeof data.ui !== 'object' || Array.isArray(data.ui)) data.ui = { open: {} };
            if (!data.ui.open || typeof data.ui.open !== 'object' || Array.isArray(data.ui.open)) data.ui.open = {};
            data.ui.open[key] = uiOpen(key) ? 0 : 1;
            persist();
          }
          function grpHead(key, title, summary, extraClass) {
            var open = uiOpen(key);
            return '<li class="idk-grp' + (extraClass ? ' ' + extraClass : '') + '" data-grp="' + esc(key) + '" data-open="' + (open ? '1' : '0') + '">' +
              '<span class="gt">' + esc(title) + '</span>' +
              '<span class="gs" title="' + esc(summary) + '">' + esc(summary) + '</span>' +
              '<span class="ga">' + (open ? '▾' : '▸') + '</span></li>';
          }
          function syncGrpDom(grpEl, sumEl, key, summary) {
            var open = uiOpen(key);
            if (grpEl) {
              grpEl.setAttribute('data-open', open ? '1' : '0');
              var arw = grpEl.querySelector('.ga');
              if (arw) arw.textContent = open ? '▾' : '▸';
            }
            if (sumEl) sumEl.textContent = summary;
          }

          var card = document.createElement('div');
          card.id = 'idk-card';
          card.className = 'idk-card';
          card.innerHTML = [
            '<div class="idk-head">',
            '<span class="idk-dot"></span><span class="idk-title">魔法商店</span>',
            '<span class="idk-mktdot" hidden title="星砂集市开市（每 7 天一次，持续 48 小时）">✨</span>',
            '<span class="idk-stat"></span>',
            '<button class="idk-btn idk-exp" title="展开/收起（Esc）">⤢</button>',
            '<button class="idk-btn idk-min" title="收起">–</button>',
            '<button class="idk-btn idk-pwr" title="关掉（只剩右下角一颗小月亮，点它再开）">☾</button>',
            '</div>',
            '<div class="idk-stage"><div class="idk-scene"></div>',
            '<div class="idk-bubble"></div>',
            '<div class="idk-bar"><i></i></div></div>',
            '<div class="idk-lockhint" hidden></div>',
            '<div class="idk-side">',
            '<div class="idk-tabs">',
            '<button data-tab="stat" data-on="1">经营</button>',
            '<button data-tab="shop">店铺</button>',
            '<button data-tab="dream">资助</button>',
            '<button data-tab="ach">成就</button>',
            '<button data-tab="set">设置</button>',
            '</div>',
            '<div class="idk-pane" data-pane="shop"><div class="idk-h"><span>店铺</span><span class="idk-shoph">可买</span></div>',
            '<div class="idk-mkt" hidden></div>',
            '<ul class="idk-list idk-shoplist"></ul></div>',
            /* v0.22 经营页：把「今天赚了多少、钱是哪些东西挣来的、买它们的钱回本了没有」摊开给玩家看 */
            '<div class="idk-pane" data-pane="stat"><div class="idk-h"><span>经营</span><span class="idk-stath">今日 —</span></div>',
            '<div class="idk-statbox"></div><ul class="idk-list idk-statlist"></ul></div>',
            '<div class="idk-pane" data-pane="dream"><div class="idk-h"><span>资助</span><span class="idk-fameh">名望 0</span></div>',
            '<div class="idk-regh"></div>',
            '<div class="idk-grp idk-wishgrp" data-grp="wish.town"><span class="gt">城建</span><span class="gs idk-townsum">已建 0/' + townLore().length + '</span><span class="ga">▾</span></div>',
            '<ul class="idk-list idk-townlist"></ul>',
            '<div class="idk-grp idk-wishgrp" data-grp="wish.dream"><span class="gt">心愿</span><span class="gs idk-dreamsum">已了 0/20</span><span class="ga">▾</span></div>',
            '<ul class="idk-list idk-dreamlist"></ul>',
            /* v0.25：冒险队从店铺页挪到这里——城建、心愿、冒险队三件事都是「花钱换名声」。 */
            '<div class="idk-grp idk-wishgrp" data-grp="wish.sponsor"><span class="gt">冒险队</span><span class="gs idk-spsum">未资助</span><span class="ga">▾</span></div>',
            '<ul class="idk-list idk-sponsorlist"></ul></div>',
            '<div class="idk-pane" data-pane="ach"><div class="idk-h"><span>成就</span><span class="idk-achh2">0/50</span></div>',
            '<ul class="idk-list idk-achlist"></ul></div>',
            '<div class="idk-pane" data-pane="set"><div class="idk-h"><span>设置</span><span class="idk-verh"></span></div>',
            '<ul class="idk-list idk-setlist"></ul>',
            '<div class="idk-savebox" hidden><div class="idk-savemsg"></div>',
            '<textarea class="idk-ta" spellcheck="false"></textarea>',
            '<div class="idk-saverow"><button class="idk-buy idk-saveapply" hidden>确认导入</button></div></div></div>',
            /* v0.17：流水页签撤掉，改成侧栏底部常驻的「最近两条」薄条；不抢金额条（foot 在 side 外）。 */
            '<div class="idk-recent" aria-label="最近流水"><ul class="idk-recent-list"></ul></div>',
            '</div>',
            '<div class="idk-foot"><span>钱袋 <b class="idk-gold">0 铜</b></span>',
            '<span class="idk-net" title="今天净赚（买东西花掉的不算）"></span>',
            '<span class="idk-debt" hidden></span>',
            '<span class="idk-need" title="饱食 🍞 / 体力 ⚡">🍞70 ⚡80</span>',
            '<span class="idk-soldwrap"><b class="idk-sold">0</b>单</span>',
            '<span class="idk-tier">Lv.0 地摊</span>',
            '<span class="idk-gen" hidden></span>',
            '<span style="margin-left:auto" class="idk-daybtn" title="点一下：现在对账（跳过等待）">第 <b class="idk-day">1</b> 天</span></div>',
            '<div class="idk-grip" title="拖动改宽度"></div>'
          ].join('');
          document.body.appendChild(card);

          /* 关掉之后留下的那枚小月亮：点一下把店重新开起来 */
          var badge = document.createElement('div');
          badge.id = 'idk-badge';
          badge.className = 'idk-badge';
          badge.title = '打开魔法商店';
          badge.setAttribute('role', 'button');
          badge.setAttribute('tabindex', '0');
          badge.setAttribute('aria-label', '打开魔法商店');
          badge.innerHTML = '<span>☾</span><i class="idk-bd"></i>';
          document.body.appendChild(badge);

          var scene = window.MagicShopScene ? window.MagicShopScene.createScene(card.querySelector('.idk-scene')) : null;
          /* v0.14.1：场景刚建出来默认春景，把存档里的季节立刻推过去；
             否则重载后要等到下一个游戏日 settleDay 才换景（最长约 12 分钟看着不对） */
          if (scene && typeof scene.setSeason === 'function') scene.setSeason(data.season | 0);
          var el = {
            stat: card.querySelector('.idk-stat'), bubble: card.querySelector('.idk-bubble'),
            mkt: card.querySelector('.idk-mkt'),
            mktDot: card.querySelector('.idk-mktdot'),
            hungerEl: card.querySelector('.idk-need'), tierEl: card.querySelector('.idk-tier'),
            genEl: card.querySelector('.idk-gen'),
            gas: card.querySelector('.idk-gold'), sold: card.querySelector('.idk-sold'), day: card.querySelector('.idk-day'),
            bar: card.querySelector('.idk-bar i'),
            log: card.querySelector('.idk-log'), logH: card.querySelector('.idk-logh'),
            exp: card.querySelector('.idk-exp'), min: card.querySelector('.idk-min'), head: card.querySelector('.idk-head'),
            pwr: card.querySelector('.idk-pwr'),
            stage: card.querySelector('.idk-stage'), foot: card.querySelector('.idk-foot'), side: card.querySelector('.idk-side'),
            grip: card.querySelector('.idk-grip'),
            shopList: card.querySelector('.idk-shoplist'), shopH: card.querySelector('.idk-shoph'),
            debtEl: card.querySelector('.idk-debt'), net: card.querySelector('.idk-net'),
            lockHint: card.querySelector('.idk-lockhint'),
            mkt: card.querySelector('.idk-mkt')
          };
          /* v0.14 心愿页 / 存档框的句柄（面板结构见上面的 innerHTML） */
          el.fameEl = card.querySelector('.idk-fameh');
          el.regEl = card.querySelector('.idk-regh');
          el.townList = card.querySelector('.idk-townlist');
          el.dreamList = card.querySelector('.idk-dreamlist');
          /* v0.15：成就独立页签 + 设置页签（存档、重开都在设置里） */
          el.achList = card.querySelector('.idk-achlist');
          /* v0.22 经营页 */
          el.statBox = card.querySelector('.idk-statbox');
          el.statList = card.querySelector('.idk-statlist');
          el.statH = card.querySelector('.idk-stath');
          el.achH = card.querySelector('.idk-achh2');
          el.setList = card.querySelector('.idk-setlist');
          el.verH = card.querySelector('.idk-verh');
          el.recent = card.querySelector('.idk-recent-list');
          el.townSum = card.querySelector('.idk-townsum');
          el.dreamSum = card.querySelector('.idk-dreamsum');
          el.townGrp = card.querySelector('[data-grp="wish.town"]');
          el.dreamGrp = card.querySelector('[data-grp="wish.dream"]');
          /* v0.25：冒险队也进了资助页 */
          el.sponsorList = card.querySelector('.idk-sponsorlist');
          el.sponsorGrp = card.querySelector('[data-grp="wish.sponsor"]');
          el.sponSum = card.querySelector('.idk-spsum');
          var saveBoxEl = card.querySelector('.idk-savebox');
          var saveTa = card.querySelector('.idk-ta');
          var saveMsgEl = card.querySelector('.idk-savemsg');
          var saveApplyBtn = card.querySelector('.idk-saveapply');
          var saveMode = 'export';
          var wishFor = '';       /* v0.14：这一轮气泡上是哪位常客的心愿（点气泡直接跳心愿页） */

          if (data.x == null) { data.x = Math.max(12, window.innerWidth - 286); data.y = Math.max(12, window.innerHeight - 250); }
          card.style.left = data.x + 'px';
          card.style.top = data.y + 'px';
          applyWidth();
          if (data.collapsed) collapse(true);
          if (data.big) setBig(true);
          if (data.quiet) card.setAttribute('data-quiet', '1');
          var state = 'wait';
          var off = false;
          var timers = [];
          var lastUnlockedK = '';
          var bubbleT = 0, flashT = 0;
          var lastFrame = 0, raf = 0, paused = false;
          /* headless/后台标签里 document.hidden 恒为 true，调试时用 ?play=1 强制跑 */
          var FORCE_PLAY = devView() && /[?&]play=1/.test(location.search);

          function after(sec, fn) { timers.push(setTimeout(fn, sec * 1000)); }
          function clearTimers() { timers.forEach(clearTimeout); timers = []; }

          /* v0.11 接待窗口：成交后先让客人站在柜台前够 1.2 秒再退场；
             退场那段窗口里不许把下一位拽回来（scene 的 setCustomer(true) 会把 leave 直接掰成 enter）。 */
          var custHideAt = 0, custSeq = 0;
          var serving = false;   /* v0.11.1：同一时刻只接待一位客人（防链条复制把客流翻倍） */
          function hideCustomer(sec, mine) {
            if (!scene) return;
            var s = Math.max(1.2, Number(sec) || 0);
            var tok = (mine == null) ? custSeq : mine;
            if (tok !== custSeq) return;          /* 这单早被新客人顶替：别再把他拽走 */
            custHideAt = Date.now() + s * 1000;
            after(s, function () {
              if (tok !== custSeq) return;        /* 等待期间又来了一位：这条退场作废 */
              custHideAt = 0;
              if (scene) scene.setCustomer(false);
            });
          }
          function showCustomer(kind) {
            if (!scene) return 0;
            var mine = ++custSeq;
            var go = function () {
              if (mine !== custSeq) return;
              custHideAt = 0;
              if (scene) scene.setCustomer(true, kind);
            };
            var left = custHideAt - Date.now();
            if (left > 0) {                       /* 上一位还在退场：等它走完再上人，别把人拽回柜台 */
              after(left / 1000 + 0.02, go);
              return mine;
            }
            go();
            return mine;
          }

          /* ---------- 店铺经济 ---------- */
          function tierDef() { return TIERS[Math.min(TIERS.length - 1, data.tier | 0)]; }
          function nextTier() { return (data.tier | 0) < TIERS.length - 1 ? TIERS[(data.tier | 0) + 1] : null; }
          function isForbidden(it) { return !!it && it.tier === 'forbidden'; }
          /* 禁忌货不上货架（scene 没给它们画格子）：能卖、能解锁，但不进 3 格陈列、不参与客流展示。
             所以 shelf() 故意把 forbidden 挡在外面，它们走 separateStock()/pickForbidden()。 */
          function shelf() {
            return items.filter(function (it) {
              return (it.lv | 0) <= (data.tier | 0) && isUnlocked(it.k) && !isForbidden(it);
            });
          }
          /* 禁忌货池：传承之后（gen>0）才认，等级到 Lv.4 才卖得出去 */
          function forbiddenPool() {
            if (!(data.gen | 0)) return [];
            return items.filter(function (it) {
              return isForbidden(it) && (it.lv | 0) <= (data.tier | 0) && isUnlocked(it.k);
            });
          }
          /* 后屋：禁忌货的补货与挑货（它们不进货架 3 格，scene 里也没有它们的画） */
          function separateStock() { return forbiddenPool(); }
          function pickForbidden() {
            var pool = forbiddenPool().filter(function (it) { return (data.stock[it.k] || 0) > 0; });
            if (!pool.length) return null;
            pool.sort(function (a, b) { return (b.price || 0) - (a.price || 0); });
            return pool[0];
          }
          /* 「未上架」区：所有还没买的货（含等级不够的），按 ITEMS 原序。
             v0.16：禁忌 12 件在传承之前整段不出现 —— 传承才解锁「禁忌」，提前列出来只是噪音。 */
          function lockedGoods() {
            return items.filter(function (it) {
              if (isForbidden(it) && !(data.gen | 0)) return false;
              return !isUnlocked(it.k);
            });
          }
          /* 小卡摘要只数当前等级已开放、但还没买的 */
          function availableLocked() {
            return items.filter(function (it) {
              if (isForbidden(it) && !(data.gen | 0)) return false;
              return (it.lv | 0) <= (data.tier | 0) && !isUnlocked(it.k);
            });
          }
          function unlockCost(it) { return Math.max(0, Math.round((it && it.unlock) || 0)); }
          /* v0.16 天赋（传承后三选一，只生效一样）：客流 +10% → 倍率 ×0.90；售价 +8% → ×1.08；充能 −20% 见 riteFactor */
          /* v0.27：GIFTS / giftById 已提到 mount 外层（见 CUSTS 之后），这里只留读写存档的函数口径 */

          function giftFlow() { var g = giftById(data.gift); return g && g.flow ? g.flow : 1; }
          function giftPrice() { var g = giftById(data.gift); return g && g.price ? g.price : 1; }
          function giftLoot() { var g = giftById(data.gift); return g && g.loot ? g.loot : 1; }
          function giftRent() { var g = giftById(data.gift); return g && g.rent ? g.rent : 1; }
          function giftStock() { var g = giftById(data.gift); return g && g.stock ? g.stock : 1; }
          function riteFactor() { var g = giftById(data.gift); return g && g.rite ? g.rite : 1; }
          /* v0.16 星砂集市开市中？——纯墙钟判定，店关着也照样开市 */
          function mktOpen() { return marketOpen(Date.now(), data.realStart); }
          function priceOf(it) {
            var f = 1;
            if (data.marketK === it.k) f *= data.marketMult;
            CHANNELS.forEach(function (c) {
              if (data.channels[c.id] && c.items.indexOf(it.k) >= 0) f *= 1.15;
            });
            /* v0.21 柜台/账本/草席：合计 +7.3%（1.03 × 1.02 × 1.02），不再逐件乘到 +11% */
            f *= priceMulOf(data);
            if (data.upgrades.chand && isNight(nowHour())) f *= 1.15;   /* v0.8 水晶吊灯：入夜 +15%（v0.10.3 改游戏时钟） */
            if (data.upgrades.clock && isNight(nowHour())) f *= 1.06;   /* v0.17 停摆座钟：入夜 +6%，白天不动 */
            f *= effectDef().price;                                                 /* v0.8 伙食：客单价按「这顿实际吃到的档」×1.08（中档） */
            f *= priceSetMul();                                                     /* v0.11 华丽三件：客单价再 +10% */
            f *= weatherPrice(data.weather) * festPrice(data.day);                  /* v0.11 雪天 ×1.08 / 灯节 ×1.05，只乘这一次 */
            f *= giftPrice();                                                       /* v0.16 传承天赋「售价 +8%」 */
            /* v0.16 限定货：星砂集市那 6 件开市 48 小时内 +30%；当季那 1 件 +20%（过季就得等明年） */
            if (mktOpen() && marketGoodOn(it.k)) f *= 1.3;
            if (seasonGoodOf(calDays(Date.now(), data.realStart)) === it.k) f *= 1.2;
            return Math.round(it.price * f);
          }
          /* ============ v0.16 §8 法阵充能 ============
             付完钱只是「挂上一张充能单」：data.rites[id] = Date.now()，到点由 idleTick（30 秒一次心跳）
             自动生效 —— 不要求玩家在线点确认，DSH 关着的时候也在走（墙钟）。
             13 张单子各充各的，不排队：一边给 Lv.3 充能，一边攒钱买下一个渠道，充能与赚钱交错。 */
          var RITE_BIND = [
            { id: 'tier1', kind: 'tier', lv: 1 },
            { id: 'tier2', kind: 'tier', lv: 2 },
            { id: 'tier3', kind: 'tier', lv: 3 },
            { id: 'tier4', kind: 'tier', lv: 4 },
            { id: 'ch1', kind: 'ch', key: 'dwarf' },
            { id: 'ch2', kind: 'ch', key: 'herb' },
            { id: 'ch3', kind: 'ch', key: 'black' },
            { id: 'town1', kind: 'town', key: 't01' },
            { id: 'town2', kind: 'town', key: 't02' },
            { id: 'town3', kind: 'town', key: 't03' },
            { id: 'town4', kind: 'town', key: 't04' },
            { id: 'town5', kind: 'town', key: 't05' },
            { id: 'town6', kind: 'town', key: 't06' },
            { id: 'town7', kind: 'town', key: 't07' },
            { id: 'town8', kind: 'town', key: 't08' },
            { id: 'town9', kind: 'town', key: 't09' },
            { id: 'town10', kind: 'town', key: 't10' }
          ];
          function riteTs(id) { return (data.rites && data.rites[id]) || 0; }
          function riteStNow(id) { return riteState(id, riteTs(id), Date.now(), riteFactor()); }
          function riteLeftNow(id) { return riteLeft(id, riteTs(id), Date.now(), riteFactor()); }
          /* 充能剩余怎么显示：一小时以内 m:ss，超过一小时 h:mm（§8 的「充能 3:12」） */
          function riteClock(ms) {
            var s = Math.max(0, Math.ceil(ms / 1000));
            var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), ss = s % 60;
            if (h > 0) return h + ':' + pad2(m);
            return m + ':' + pad2(ss);
          }
          /* 充能单和「买的东西」一一对应：tier3 ↔ TIERS[3]，ch3 ↔ CHANNELS[2]，town2 ↔ TOWN[1] */
          function riteIdOf(kind, key) {
            var i;
            if (kind === 'tier') return 'tier' + key;
            if (kind === 'ch') {
              for (i = 0; i < CHANNELS.length; i++) if (CHANNELS[i].id === key) return 'ch' + (i + 1);
              return '';
            }
            if (kind === 'town') {
              for (i = 0; i < RITE_BIND.length; i++) if (RITE_BIND[i].kind === 'town' && RITE_BIND[i].key === key) return RITE_BIND[i].id;
              return '';
            }
            return '';
          }
          function riteStart(id) {
            if (!RITES[id] || riteTs(id)) return false;
            if (!data.rites || typeof data.rites !== 'object') data.rites = {};
            data.rites[id] = Date.now();
            return true;
          }
          /* 到点就生效。幂等：只按「目标状态还没到位」补一次，重复调用不会多给东西。 */
          function applyRites() {
            var now = Date.now(), done = [];
            for (var i = 0; i < RITE_BIND.length; i++) {
              var b = RITE_BIND[i], ts = riteTs(b.id);
              if (!ts || riteLeft(b.id, ts, now, riteFactor()) > 0) continue;
              if (b.kind === 'tier') {
                if ((data.tier | 0) >= b.lv) continue;
                data.tier = b.lv;
                applyDecor();
                if (scene && scene.playInstall) scene.playInstall('tier');
                addLog('法阵充能完毕：' + (TIERS[b.lv] ? TIERS[b.lv].name : 'Lv.' + b.lv) + ' 落成', 'buy');
                done.push(TIERS[b.lv] ? TIERS[b.lv].name : ('Lv.' + b.lv));
              } else if (b.kind === 'ch') {
                if (data.channels[b.key]) continue;
                data.channels[b.key] = 1;
                var cn = '';
                CHANNELS.forEach(function (c) { if (c.id === b.key) cn = c.name; });
                addLog('法阵充能完毕：' + cn + ' 通了（这批货卖价 +15%）', 'buy');
                done.push(cn);
              } else if (b.kind === 'town') {
                if (!Array.isArray(data.town)) data.town = [];
                if (data.town.indexOf(b.key) >= 0) continue;
                data.town.push(b.key);
                addFame(10);                        /* 和 v0.14 一样：城建建成 +10 名望 */
                var tn = townById(b.key);
                addLog('法阵充能完毕：' + (tn ? tn.title : b.key) + ' 建成', 'buy');
                if (tn && (tn.afterLine || tn.line)) showLine(tn.afterLine || tn.line, 4200);
                done.push(tn ? tn.title : b.key);
              }
            }
            if (done.length) {
              if (done.length === 1) showLine('法阵亮了：' + done[0] + ' 到位。', 3000);
              flash();
              checkAchievements();
              paint(); renderShop(); renderStock(); persist();
            }
            return done;
          }
          /* 星砂集市开市记账：每轮只记一次（不急不催，错过了等下一轮） */
          function mktTick() {
            var r = marketRound(Date.now(), data.realStart);
            if (!data.market || typeof data.market !== 'object') data.market = { n: 0, round: -1 };
            if (r >= 1 && (Number(data.market.round) || 0) !== r) {
              data.market.round = r;
              data.market.n = (Number(data.market.n) || 0) + 1;
              addLog('星砂集市开市了（第 ' + data.market.n + ' 回，开 48 小时）', 'day');
              mktArm = false;
            }
          }

          /* ============ v0.16 §6.1 传承 ============
             门槛 = 核心全开（5 级场所 / 12 件核心货 / 3 条渠道 / 6 类客人）+ 开业满 7 个日历天。
             两段式上膛，不弹窗：第一下把按钮变「确定」，五秒内再点才真交接。
             交接不清店：铺子、货、渠道、客人、法阵、成就、常驻天赋都留着，只把铜币清 0，
             换来「禁忌」内容（12 件禁忌货 + 夜里来的灵体客 + 黑市）。 */
          function coreGoodsDone() {
            var core = items.filter(function (it) { return !isForbidden(it); });
            for (var i = 0; i < core.length; i++) if (!isUnlocked(core[i].k)) return false;
            return true;
          }
          function coreCustsDone() {
            var cc = coreCusts();
            for (var i = 0; i < cc.length; i++) {
              if (cc[i].id === 'villager') continue;
              if (!data.cust[cc[i].id]) return false;
            }
            return true;
          }
          function legacyCore() {
            var ch = true, i;
            for (i = 0; i < CHANNELS.length; i++) if (!data.channels[CHANNELS[i].id]) ch = false;
            return {
              tier: (data.tier | 0) >= TIERS.length - 1,
              goods: coreGoodsDone(),
              chans: ch,
              custs: coreCustsDone()
            };
          }
          function legacyDays() { return calDays(Date.now(), data.realStart); }
          function legacyReady() {
            var c = legacyCore();
            return { ok: c.tier && c.goods && c.chans && c.custs && legacyDays() >= 7, core: c, days: legacyDays() };
          }
          function legacyCdLeft() { return riteLeft('legacy', riteTs('legacy'), Date.now()); }
          function legacyGo(giftId) {
            var g = giftId || data.gift || '';
            if (g && ['flow', 'price', 'rite'].indexOf(g) < 0) g = '';
            data.gen = (Number(data.gen) || 0) + 1;
            if (!data.gift) data.gift = g;              /* 天赋只定一次：之后再传承沿用同一样 */
            data.gold = 0;                              /* §6.1：铜币清零，铺子本身留着 */
            data.goldDay0 = 0;
            data.revToday = 0;
            data.debt = 0;
            data.arrears = 0;
            data.rest = false;
            data.rites.legacy = Date.now();             /* §2：传承进入 24 小时冷却 */
            /* §6.2：灵体客是「黑门的副作用」，不需要再花钱买 —— 传承即到，只在夜里来 */
            if (!data.cust || typeof data.cust !== 'object') data.cust = {};
            data.cust.ghost = 1;
            addFame(20);                                /* 镇上记住了这家店（fame_200 的来路） */
            addLog('第 ' + data.gen + ' 代接手了。铜币清账，禁忌的门开了。', 'day');
            showLine('交接完了。柜里的铜板清空了，后屋多了一扇黑门。', 4200);
            legacyArm = false;
            flash();
            applyDecor();
            checkAchievements();
            paint(); renderShop(); renderStock(); persist();
          }

          function applyDecor() {
            if (!scene) return;
            if (scene.setTier) scene.setTier(data.tier | 0);
            if (scene.setUnlocked) scene.setUnlocked(data.unlocked);
            scene.setDecor({
              shelf4: (data.tier | 0) >= 4, cat: !!data.upgrades.cat,
              candle: !!data.upgrades.candle, glass: !!data.upgrades.glass,
              chand: !!data.upgrades.chand, sign: !!data.upgrades.sign,
              portal: !!data.upgrades.portal,
              /* v0.8 新画 6 件：只加字段，setDecor 签名不变 */
              board: !!data.upgrades.board, counter: !!data.upgrades.counter,
              stool: !!data.upgrades.stool, bell: !!data.upgrades.bell,
              vault: !!data.upgrades.vault, icebox: !!data.upgrades.icebox,
              /* v0.13 檐下挡雨棚：场景侧 awningRainG（scene.js:557 / pairs :2264），
                 这一行是 widget 唯一的接线 —— 少了它，买了 200 铜的棚子场景里什么都不出现。
                 buy() 在 paint 之前就调 applyDecor()，所以买完当帧即可见。 */
              awning: !!data.upgrades.awning,
              /* v0.27 补画 7 件：旧账本 / 门边盐线 / 门口油灯 / 迎客草席 / 蒙尘穿衣镜 / 停摆座钟 / 地窖暗门。
                 scene.js 侧节点与 pairs 早已就绪（ledgerG/saltG/oilLampG/matG/mirrorG/clockG/cellarG），
                 只差这张表把键传过去 —— 少一个键，买了也看不见。 */
              accounts: !!data.upgrades.accounts, salt: !!data.upgrades.salt,
              lamp: !!data.upgrades.lamp, mat: !!data.upgrades.mat,
              tallglass: !!data.upgrades.tallglass, clock: !!data.upgrades.clock,
              cellar: !!data.upgrades.cellar
            });
            scene.setStock(data.stock);
          }
          /* v0.11 天气/节日：只在真的变了才去切场景（scene 自己同档也会早退，这里先挡一层，省一次走 scene） */
          function applyWeather() {
            if (!scene || !scene.setWeather) return;
            var w = normWeather(data.weather);
            if (scene.weather === w) return;
            scene.setWeather(w);
          }
          function applyFestival() {
            if (!scene || !scene.setFestival) return;
            var on = !!data.festival;
            if (scene.festival === on) return;
            scene.setFestival(on);
          }
          /* 库存上限：铁皮保险柜把 3 抬到 5 */
          function maxStock() {
            /* v0.17 地窖暗门：在保险柜之上再 +1（没买保险柜就是 4，买了就是 6） */
            var n = data.upgrades.vault ? 5 : MAX_STOCK;
            if (data.upgrades.cellar) n += 1;
            return n;
          }
          /* ---------- v0.11 陈列位：3 格前台，永远跟后仓对齐 ---------- */
          function syncSlots() {
            data.slots = fillSlots(data.slots, shelf(), data.stock);
            return data.slots;
          }
          function decorOwned(k) { return !!data.upgrades[k]; }
          function flowSetMul() { return setsMul(true, decorOwned); }
          function priceSetMul() { return setsMul(false, decorOwned); }
          /* 点一下陈列位：空格就摆最贵的候选；已有货就换到后仓里另一件（不提供下架，免得和自动补位打架） */
          function cycleSlot(i) {
            var rows = shelf(), sl = syncSlots(), cand = [], j, it;
            for (j = 0; j < rows.length; j++) {
              it = rows[j];
              if ((data.stock[it.k] || 0) > 0 && sl.indexOf(it.k) < 0) cand.push(it);
            }
            if (!cand.length) {
              showLine(sl[i] ? '后仓没有别的货可以换了。' : '后仓空了，先补货吧。');
              return;
            }
            cand.sort(function (a, b) { return (b.price || 0) - (a.price || 0); });
            sl[i] = cand[0].k;
            data.slots = sl;
            renderStock();
            persist();
          }

          /* ---------- v0.8 伙食：档位 → 饭钱 / 客单价 / 客流 / 翻台 ---------- */
          function foodDef() { return MEALS[clampN(data.foodTier | 0, 0, MEALS.length - 1)]; }
          /* 销售效果看「上一顿实际吃到」的档（data.mealTier），不看玩家所选档（data.foodTier）。
             钱不够时玩家手选高档、这顿只付中档钱 → 加成也只能按中档算，否则付中档的钱享高档的 tm/flow。
             mealTier = -1（还没吃上/这顿饿着）钳到低档 = price 1.00 / flow 1.00 / tm 1.00，中性、不加不减。
             别把 priceOf / rushFactor / doCustomer 里的三处 effectDef() “统一”回 foodDef()。 */
          function effectDef() { return MEALS[clampN(data.mealTier == null ? -1 : (data.mealTier | 0), 0, MEALS.length - 1)]; }
          function foodFactor() { return data.upgrades.icebox ? 0.6 : 1; }   /* 冰窖：日费 ×0.60 */
          function mealPrice(tier) {
            var m = (tier == null) ? foodDef()          /* 饭钱看玩家所选档（不是吃到的档） */
              : MEALS[clampN(tier | 0, 0, MEALS.length - 1)];
            return Math.max(1, Math.round(m.per * foodFactor()));
          }
          function dayFoodCost(tier) { return mealPrice(tier) * 2; }
          /* 一顿正餐的"槽位"：游戏内 9:00 一顿、19:00 一顿；返回值单调递增，只用来判断"这一顿吃过没有"。
             v0.10.3：锚到游戏日 data.day（以前锚真实日期，一天 12 分钟里根本轮不到第二顿）。 */
          function mealSlotId() {
            var h = nowHour();
            var slot = h >= 19 ? 1 : (h >= 9 ? 0 : -1);
            if (slot < 0) return -1;                       /* 9 点前还没到今天的正餐 */
            return (data.day | 0) * 2 + slot;
          }
          /* 这一顿实际吃哪一档：玩家所选档付得起就用所选档，付不起逐级往下退；低档也付不起 → −1（这顿吃不上）。
             只用于「本顿实付」，绝不回写 data.foodTier —— foodTier 是玩家在店铺页手选的套餐，
             钱不够只影响这一顿，重新够钱会自动回到所选档（t7 修：旧版会把吃货档永久写低）。 */
          function mealTierFor(gold) {
            var tier = clampN(data.foodTier | 0, 0, MEALS.length - 1);
            while (tier > 0 && gold < mealPrice(tier)) tier -= 1;
            return gold < mealPrice(tier) ? -1 : tier;
          }
          /* 欠账按天：同一天不管欠几顿只记 1 天；成功吃上一顿清零，之后再欠才重新 +1（v0.10.3 改锚游戏日） */
          function mealDayId() { return data.day | 0; }
          function markMealDebt() {
            var day = mealDayId();
            data.mealMissed = true;
            if (!(data.mealDebtDays | 0) || (data.mealDebtDay | 0) !== day) {
              data.mealDebtDay = day;
              data.mealDebtDays = (data.mealDebtDays | 0) + 1;
            }
          }
          /* 吃一顿：钱不够就只在「这一顿」降档，低档也付不起就跳过这顿并记 mealMissed（欠账按天） */
          function eatMeal() {
            var chosen = clampN(data.foodTier | 0, 0, MEALS.length - 1);
            var tier = mealTierFor(data.gold);
            if (tier < 0) {
              markMealDebt();
              addLog('肚子叫，但没钱吃饭', 'bad');
              showLine('……今天只能饿着。', 2600);
              paint(); renderShop();
              persist();                        /* t7：失败分支也要落盘，刷新后 mealMissed / 欠账天数不能回退 */
              return false;
            }
            var cost = mealPrice(tier);
            data.mealDebtDays = 0;
            data.mealDebtDay = 0;
            data.mealMissed = false;
            data.mealTier = tier;
            if (tier !== chosen) {
              addLog('钱不够，这顿先吃「' + MEALS[tier].name + '」（所选仍是「' + MEALS[chosen].name + '」）', 'bad');
            }
            data.gold -= cost;
            data.mealToday = (Number(data.mealToday) || 0) + cost;   /* v0.24 经营页：今日伙食支出 */
            data.hunger = clampN(data.hunger + MEALS[tier].sat, 0, 100);
            addLog('吃了' + MEALS[tier].name + ' −' + fmt(cost), 'bad');
            setState('away');
            showLine('回后屋吃' + MEALS[tier].short + '档。', 2400);
            paint(); renderShop(); persist();
            return true;
          }
          /* 玩家手选伙食档（店铺页『伙食』段点一下） */
          function setFoodTier(t) {
            t = clampN(t | 0, 0, MEALS.length - 1);
            if (t === (data.foodTier | 0)) { showLine('现在就是「' + MEALS[t].name + '」。'); return false; }
            data.foodTier = t;
            addLog('伙食换成「' + MEALS[t].name + '」·每天约 ' + fmt(dayFoodCost(t)), 'buy');
            showLine('伙食定了：' + MEALS[t].name + '。', 2600);
            flash(800);
            paint(); renderShop(); persist();
            return true;
          }
          /* 客人来得勤不勤：场所等级 × 木牌 −10%、橱窗 −12%、长凳 −6%、门铃 −7%、招牌 −20%、传送门 −35%、吊灯 −5%（叠乘），
             再乘伙食档的客流倍率（高档 −15%）——同一套乘法，schedule() 不用改。 */
          function rushFactor() {
            var f = TIER_RUSH[Math.min(TIER_RUSH.length - 1, data.tier | 0)];
            /* v0.21：装修客流加成收敛成「每件 +1.5%–+11%、满装修合计 +66%」（见 FLOW_ITEMS）。
               旧版十几件逐个 ×0.9/×0.8 乘下来是 +313% 客流，再叠客单价就成了「越滚越快」。 */
            f *= flowMulOf(data);
            if (displayFull(data.slots, data.stock)) f *= 0.92;    /* v0.13 陈列加成：3 格摆 3 种不同货 → 客流 +8%（×0.92，只乘这一次） */
            f *= boonFlow(data.boon);        /* v0.11 传家宝「老主顾名单」：客流 +8%（×0.92，只在带这一样时生效） */
            f *= weatherFlow(data.weather) * festFlow(data.day);   /* v0.11 雨 .88 / 雪 .80 / 阴 .95 + 集市日 ×1.30，只乘一次 */
            f *= effectDef().flow;           /* v0.8 高档：客流 ×0.85（按这顿实际吃到的档） */
            if (buskerLeft() > 0) f *= 1.25; /* v0.13 街头艺人：3 个游戏小时内客流 +25%。
                                                只在这一条乘法链里乘一次，与天气/集市/装修同链，
                                                所以不会和 paint()/priceOf() 的倍率重复计算。 */
            if (data.starve) f *= 1.45;      /* 饿着肚子，客人也懒得等 */
            f *= catFoodMul(data);               /* v0.18 猫粮三档：+2% / +4%（买断，叠乘只算一次） */
            f *= sponsorFlow(data);              /* v0.23 资助冒险队：后两档各带 +4% / +8% 客流 */
            f *= giftFlow();                 /* v0.16 传承天赋「客流 +10%」（×0.90，只乘一次） */
            /* v0.27 星砂集市：开市那两天门口多两成人，配上集市客与限定货的 +30%，
               玩家能明显感觉到「这两天不一样」，错过才知道等下一轮。 */
            if (mktOpen()) f *= 1.25;
            /* v0.16 收入扁平化：客人再密也有个上限（rush ≥ 0.25，即一天约 25 客）。
               原来这条链能压到 0.083（一天 50.8 客、日营收 2 万铜），价格只涨 3 倍，
               于是「一天点满」。开局 rush≈1.7 远在 0.25 之上，前 10 分钟一分钱都不会变慢。 */
            return Math.max(0.25, f);
          }
          function canUpgrade() { return data.gold >= (nextTier() ? nextTier().price : Infinity); }

          /* ============ v0.11 回本估算（店铺页每件可买项下面那一行） ============
             口径：日增收益，全按「日营业额」折算，和价格表用的是同一套 ΔR 思路
               · 装修（客流类）：该件把等待倍率从 mul 压到 1 → 营业额 ×（1/mul − 1）
               · 装修（价格类）：柜台 +5%、吊灯入夜 +15%（按 4.3 小时夜间摊成 +4.3%）
               · 冰窖：每天省 40% 伙食费；店猫：小贼得手率 55%→30%，少丢 0.25 件货
               · 场所升级：TIER_RUSH 的档位比（1.7 → 1.2 = 客流 +41.7%）
               · 渠道：这批货卖价 +15%，按它们在货架上的价占比摊
               · 客源：多一类客把平均订单额拉高多少 → 乘上每天客流
             算不出来的（烛台纯观感、ΔR ≤ 0、回本超过 120 天）显示「长期收益」，不编数字。 */
          function dayRevBase() {
            var r = Number(data.revLast) || 0;
            if (r > 0) return r;
            return Math.max(60, shelf().length * 55);   /* 还没结过账：按开局口径估 */
          }
          function avgPrice() {
            var arr = shelf(), s = 0, i;
            if (!arr.length) return 20;
            for (i = 0; i < arr.length; i++) s += priceOf(arr[i]);
            return s / arr.length;
          }
          function orderValue(c) { return (Number(c.mult) || 1) * (Number(c.bulk) || 1) * avgPrice(); }
          function custGain(c) {
            var pool = unlockedCusts(), i, w, sumW = 0, sumV = 0, w2, avg0, avg1, base;
            for (i = 0; i < pool.length; i++) {
              w = custWeightOf(pool[i], pool.length);
              sumW += w; sumV += w * orderValue(pool[i]);
            }
            avg0 = sumW ? sumV / sumW : avgPrice();
            w2 = custWeightOf(c, pool.length + 1);
            avg1 = (sumV + w2 * orderValue(c)) / (sumW + w2);
            base = dayRevBase();
            return (avg0 > 0 && avg1 > avg0) ? (avg1 - avg0) * (base / avg0) : 0;
          }
          function rushGain(mul) { return (mul > 0 && mul < 1) ? dayRevBase() * (1 / mul - 1) : 0; }
          /* v0.21：一件装修的「日增收益」= 有它 / 没它 的客流（或客单价）倍数差。
             单件效应下调之后再算回本，才不会出现「0.7 天回本」这种价格。 */
          function upgradeGain(u) {
            var base = dayRevBase(), isFlow = false, isPrice = false, i;
            for (i = 0; i < FLOW_ITEMS.length; i++) if (FLOW_ITEMS[i].id === u.id) isFlow = true;
            for (i = 0; i < PRICE_ITEMS.length; i++) if (PRICE_ITEMS[i].id === u.id) isPrice = true;
            if (isFlow) {
              var withF = flowMulOf(data), withoutF = flowMulWithout(data, u.id);
              var g = base * (withoutF / withF - 1);
              if (u.id === 'chand') g += base * 0.043;      /* 入夜卖价 +15% 按夜间占比摊成 +4.3% */
              return g;
            }
            if (isPrice) {
              var withP = priceMulOf(data), withoutP = priceMulWithout(data, u.id);
              return base * (withP / withoutP - 1);
            }
            if (u.id === 'clock') return base * 0.017;
            if (u.id === 'vault') return base * 0.05;
            if (u.id === 'cellar') return base * 0.025;
            if (u.id === 'icebox') return Math.round(0.4 * dayFoodCost());
            /* v0.12：店猫是「止损」不是「增收」——它省下的是小贼少偷的货，
               按实际事件频率（每 5–11 分钟一次事件、三成是小偷）折下来每天约 5 铜，
               拿它跟售价去比会得出「12 天回本」，比模型口径更吓人，也不该用回本天数量化。
               所以这里按「长期收益」处理，把真实机制写在说明里。 */
            if (u.id === 'cat') return 0;
            return 0;                                                   /* candle：纯观感 */
          }
          function channelGain(c) {
            var arr = shelf(), total = 0, sub = 0, i, p;
            for (i = 0; i < arr.length; i++) {
              p = priceOf(arr[i]);
              total += p;
              if (c.items.indexOf(arr[i].k) >= 0) sub += p;
            }
            if (total <= 0 || sub <= 0) return 0;
            return dayRevBase() * 0.15 * (sub / total);
          }
          function tierGain() {
            var lv = data.tier | 0;
            var a = TIER_RUSH[Math.min(TIER_RUSH.length - 1, lv)];
            var b = TIER_RUSH[Math.min(TIER_RUSH.length - 1, lv + 1)];
            if (!(a > 0) || !(b > 0) || a === b) return 0;
            return dayRevBase() * (a / b - 1);
          }
          function pbTag(cost, gain) {
            var t = paybackText(cost, gain);
            return t ? '<i class="pb">' + esc(t) + '</i>' : '';
          }

          var resetArm = false;   /* 「重来」要点两下：一下上膛，五秒内再点才真清 */
          var rebirthArm = false; /* v0.11「交给下一位店主」同上：先上膛，再选带哪样传家宝 */
          var legacyArm = false;  /* v0.16 §6.1 传承：同上膛逻辑，不弹窗 */
          var mktArm = false;     /* v0.16 §6.3 集市横幅认过一次就不再闪 */
          function renderShop() {
            if (!el.shopList) return;
            var keepTop = el.shopList.scrollTop;   /* paint() 每秒重画，别把玩家滚到的位置弹回顶部 */
            var lv = data.tier | 0, nx = nextTier();
            /* v0.16 §6.3 星砂集市横幅：只在开市那 48 小时出现，错过就等下一轮，不算惩罚 */
            if (el.mkt) {
              if (mktOpen()) {
                var mGoods = MARKET_GOODS.map(function (k) { var it = itemByKey[k]; return it ? it.name : k; }).join('、');
                el.mkt.hidden = false;
                el.mkt.textContent = '✨ 星砂集市开市（' + (48 - Math.floor(((Date.now() - (Number(data.realStart) || Date.now())) % (MARKET_EVERY_DAYS * REAL_DAY_MS)) / 3600e3)) +
                  ' 小时后收摊）：' + mGoods + ' 这几天按 +30% 卖，别错过，下一轮七天后。';
              } else {
                el.mkt.hidden = true;
                el.mkt.textContent = '';
              }
            }
            var html = '';
            var nxRite = nx ? riteIdOf('tier', nx.lv) : '';
            var nxSt = nxRite ? riteStNow(nxRite) : '';
            var upN = 0;
            UPGRADES.forEach(function (u) { if (data.upgrades[u.id]) upN++; });
            var chN = 0;
            CHANNELS.forEach(function (c) { if (data.channels[c.id]) chN++; });
            var lockeds = lockedGoods();
            var goodsN = items.length - lockeds.length;
            /* v0.27 星砂客只在开市时进这张表，且不占「已开 N/6」的分母（跟灵体客一样是临时来客） */
            var shownCusts = CUSTS.filter(function (c) {
              if (c.gen && !(Number(data.gen) || 0)) return false;
              if (c.mkt && !mktOpen()) return false;
              return true;
            });
            /* 计数不跟着昼夜走：夜里灵体客进池、白天退出，但「已开 N/M」是账不是临时状态 */
            var cnum = CUSTS.filter(function (c) {
              if (c.mkt) return false;
              if (c.gen && !(data.gen | 0)) return false;
              return c.id === 'villager' || !!data.cust[c.id];
            }).length;
            var custDen = coreCusts().length + ((Number(data.gen) || 0) > 0 ? 1 : 0);
            var lgc = legacyCore(), lgd = legacyDays();
            var legacyOpen = (lgc.tier && lgc.goods && lgc.chans && lgc.custs) || lgd >= 7 || (Number(data.gen) || 0) > 0;

            /* ===== 1 场所 ===== */
            var tierSt = nxRite && nxSt === 'charging' ? '充能中' : (nx ? '已充能 · 可升' : '已充能 · 顶配');
            html += grpHead('shop.place', '场所', 'Lv.' + lv + ' · ' + tierSt);
            if (uiOpen('shop.place')) {
              html += '<li><span class="nm">' + (nx ? '升级：' + esc(nx.name) + '<i>' + esc(nx.desc) + '</i>' + pbTag(nx.price, tierGain()) : '已是顶配<i>商会铺面，没地方再扩了</i>') +
                '</span>' + (nx ? (nxSt === 'charging'
                  ? '<span class="idk-rite">充能 ' + riteClock(riteLeftNow(nxRite)) + '</span>'
                  : '<button class="idk-buy" data-up="1"' + (canUpgrade() ? '' : ' disabled') + ' title="' + nx.price + ' 铜 · 付完开始充能 ' + riteClock(RITES[nxRite] * riteFactor()) + '">' + fmt(nx.price) + '</button>') : '') + '</li>';
            }

            /* ===== 2 装修 ===== */
           /* v0.15 侧栏只有 232px 宽：套装进度压成「木系 2/3」计数，缺哪几件放 title，
               免得长句把这一行撑成两行、还跟后面的按钮抢宽度。 */
            function setText(set) {
              var miss = setMissing(set, decorOwned), fulls = [], i, u;
              for (i = 0; i < miss.length; i++) {
                u = upById(miss[i]);
                fulls.push(u ? u.name : miss[i]);
              }
              var shortName = set.id === 'wood' ? '木系' : '华丽';
              var own = set.need.length - miss.length;
              if (!miss.length) return '<span title="' + esc(set.name) + ' 已集齐">' + shortName + ' 3/3</span>';
              return '<span title="还差：' + esc(fulls.join('、')) + '">' + shortName + ' ' + own + '/3</span>';
            }
            html += grpHead('shop.decor', '装修', '已购 ' + upN + '/' + UPGRADES.length);
            if (uiOpen('shop.decor')) {
              var dispN = displayOn(data.slots, data.stock);
              html += '<li class="idk-sec"><span class="nm">套装</span><span class="p" title="同类装修集齐三件有额外加成；前台 3 格摆 3 种不同货 → 客流 +8%">' +
                setText(SETS[0]) + ' · ' + setText(SETS[1]) + ' · ' +
                (displayFull(data.slots, data.stock) ? '<b>陈列齐全 · 客流 +8%</b>' : '陈列 ' + dispN + '/' + SLOT_N) + '</span></li>';
              UPGRADES.forEach(function (u) {
                var own = !!data.upgrades[u.id];
                var lock = lv < u.minLv;
                html += '<li data-own="' + (own ? 1 : 0) + '"><span class="nm">' + esc(u.name) + '<i>' + (lock ? '需 Lv.' + u.minLv : esc(u.desc)) + '</i>' +
                  (lock || own ? '' : pbTag(u.price, upgradeGain(u))) + '</span>' +
                  (own ? '<span class="p">已有</span>' : (lock ? '<span class="p">未解锁</span>'
                    : '<button class="idk-buy" data-id="' + u.id + '" title="' + u.price + ' 铜"' + (data.gold >= u.price ? '' : ' disabled') + '>' + fmt(u.price) + '</button>')) +
                  '</li>';
              });
            }

            /* ===== 4 进货渠道（货品跟着走：渠道与货品是同一件事的两头） ===== */
            html += grpHead('shop.channel', '渠道', '已开 ' + chN + '/' + CHANNELS.length + ' · 货品 ' + goodsN + '/' + items.length);
            if (uiOpen('shop.channel')) {
              CHANNELS.forEach(function (c) {
                var own = !!data.channels[c.id];
                var lock = lv < c.minLv;
                var rid = riteIdOf('ch', c.id);
                var rst = own ? 'done' : (rid ? riteStNow(rid) : '');
                html += '<li data-own="' + (own ? 1 : 0) + '"><span class="nm">' + esc(c.name) + '<i>' + (lock ? '需 Lv.' + c.minLv : esc(c.desc)) + '</i>' +
                  (lock || own ? '' : pbTag(c.price, channelGain(c))) + '</span>' +
                  (own ? '<span class="p">已完成</span>' : (lock ? '<span class="p">未解锁</span>'
                    : (rst === 'charging' ? '<span class="idk-rite">充能 ' + riteClock(riteLeftNow(rid)) + '</span>'
                      : '<button class="idk-buy" data-ch="' + c.id + '" title="' + c.price + ' 铜 · 付完开始充能 ' + riteClock(RITES[rid] * riteFactor()) + '"' + (data.gold >= c.price ? '' : ' disabled') + '>' + fmt(c.price) + '</button>'))) +
                  '</li>';
              });
              /* v0.15：还没买的货放在店铺末尾的「货品」段（原来是货架页签里的「未上架」区）。
                 货架本身全自动：卖光了后屋自己补，陈列 3 格自己挑最贵的摆，玩家只管买货。 */
              if (lockeds.length) {
                html += '<li class="idk-sec"><span class="nm">货品</span><span class="p">已上架 ' + goodsN + '/' + items.length + '</span></li>';
                for (var gl = 0; gl < lockeds.length; gl++) html += unlockRow(lockeds[gl]);
              }
            }

            /* ===== 5 顾客 ===== */
            html += grpHead('shop.cust', '顾客', '已开 ' + cnum + '/' + custDen);
            if (uiOpen('shop.cust')) {
              shownCusts.forEach(function (c) {
                var own = c.id === 'villager' || !!data.cust[c.id];
                var lock = lv < c.lv;
                html += '<li data-own="' + (own ? 1 : 0) + '" data-cust="' + c.id + '"><span class="nm">' + esc(c.name) +
                  '<i>' + (lock ? '需 Lv.' + c.lv : esc(c.desc)) + ' · 权重 ' + custWeightOf(c, cnum) + ' · 单价 ×' + c.mult.toFixed(2) + '</i>' +
                  (lock || own || c.mkt ? '' : pbTag(c.price, custGain(c))) + '</span>' +
                  (own ? '<span class="p">已开</span>' : (lock ? '<span class="p">未解锁</span>'
                    : (c.mkt ? '<span class="p">集市开市自来</span>'
                      : (c.gen ? '<span class="p">传承后自现</span>'
                        : '<button class="idk-buy" data-cust="' + c.id + '" title="' + c.price + ' 铜"' + (data.gold >= c.price ? '' : ' disabled') + '>' + fmt(c.price) + '</button>')))) +
                  '</li>';
              });
            }

            /* v0.25：资助冒险队挪去「资助」页，店铺页不再渲染这一段 */

            /* ===== 5 伙食（含猫粮三档） ===== */
            var ft = data.foodTier | 0;
            /* t7：高亮永远跟玩家所选档；钱不够时只是「这一顿」降档/跳过，右侧给个提示，不改所选档 */
            var payTier = mealTierFor(data.gold);
            var cfNow = catTierNow(data);
            html += grpHead('shop.food', '伙食', '当前：' + foodDef().short + ' · ' + fmt(mealPrice()) + '/顿');
            if (uiOpen('shop.food')) {
              MEALS.forEach(function (m) {
                var on = m.id === ft;
                var tight = on && payTier !== ft;
                /* v0.21：换档不收钱，钱是按顿扣的——所以按钮上直接写「这顿多少钱」 */
                html += '<li data-food="' + m.id + '"' + (on ? ' class="on"' : '') + '><span class="nm">' + esc(m.name) +
                  '<i>' + esc(m.note) + ' · 每天约 ' + fmt(dayFoodCost(m.id)) + '</i></span>' +
                  (on ? '<span class="p">在用' + (tight ? (payTier < 0 ? ' · 钱不够，这顿吃不上' : ' · 钱不够，这顿降档') : '') + '</span>'
                    : '<button class="idk-buy" data-food="' + m.id + '" title="每顿 ' + fmt(mealPrice(m.id)) + '">' + fmt(mealPrice(m.id)) + '/顿</button>') +
                  '</li>';
              });
            }

            /* ===== 5.5 猫猫（店猫的伙食单独一组，三档任选、随时可换） ===== */
            html += grpHead('shop.cat', '猫猫', data.upgrades.cat ? ('在喂：' + (cfNow ? CATFOODS[cfNow - 1].name : '还没配粮')) : '未解锁');
            if (uiOpen('shop.cat')) {
              if (!data.upgrades.cat) {
                html += '<li><span class="nm">还没养猫<i>先在装修里买「养只店猫」，再来配粮</i></span><span class="p">未解锁</span></li>';
              } else {
                CATFOODS.forEach(function (cf) {
                  var on = cf.id === cfNow;
                  var lock = lv < cf.minLv;
                  html += '<li data-own="' + (on ? 1 : 0) + '"><span class="nm">' + esc(cf.name) +
                    '<i>' + (lock ? '需 Lv.' + cf.minLv : esc(cf.note)) + '</i></span>' +
                    (on ? '<span class="p">在喂</span>'
                      : (lock ? '<span class="p">需 Lv.' + cf.minLv + '</span>'
                        : '<button class="idk-buy" data-cf="' + cf.id + '" title="换这档 ' + fmt(cf.price) + ' 铜"' + (data.gold >= cf.price ? '' : ' disabled') + '>' + fmt(cf.price) + '</button>')) +
                    '</li>';
                });
              }
            }

            /* ===== 6 传承（含交接） ===== */
            html += grpHead('shop.legacy', '传承', legacyOpen ? ('第 ' + Math.max(1, (Number(data.gen) || 0) + 1) + ' 代') : '未开启');
            if (uiOpen('shop.legacy')) {
              /* v0.28 这一脉的进度：传承之后才显示，给第七天以后的长期目标一个看着动的地方 */
              if ((Number(data.gen) || 0) > 0) {
                var fgt = 0, fgb = 0;
                for (var fgi = 0; fgi < items.length; fgi++) {
                  if (items[fgi].tier !== 'forbidden') continue;
                  fgt++;
                  if (hasIn(data.unlocked, items[fgi].k)) fgb++;
                }
                var mktTimes = (data.market && Number(data.market.n)) || 0;
                html += '<li><span class="nm">这一脉<i>第 ' + ((Number(data.gen) | 0) + 1) + ' 代 · 禁忌货 ' + fgb + '/' + fgt +
                  ' · 赶集 ' + mktTimes + ' 回</i></span></li>';
              }
              if (legacyOpen) {
                var miss = [];
                if (!lgc.tier) miss.push('场所到 Lv.' + (TIERS.length - 1));
                if (!lgc.goods) miss.push('12 件核心货');
                if (!lgc.chans) miss.push('3 条渠道');
                if (!lgc.custs) miss.push('6 类客人');
                var ready = legacyReady();
                var cd = legacyCdLeft();
                if (cd > 0) {
                  html += '<li><span class="nm">法阵还在冷<i>交接之后要等 24 小时才能再传一次</i></span>' +
                    '<span class="p idk-rite">冷却 ' + riteClock(cd) + '</span></li>';
                } else if (!ready.ok) {
                  html += '<li><span class="nm">还不能交接<i>还差：' + esc(miss.length ? miss.join('、') : ('开业满 7 个日历天，现在第 ' + lgd + ' 天')) + '</i></span>' +
                    '<span class="p">' + (ready.core.tier && ready.core.goods && ready.core.chans && ready.core.custs ? ('第 ' + lgd + '/7 天') : '筹备中') + '</span></li>';
                } else if (!legacyArm) {
                  html += '<li><span class="nm">把店交给下一代<i>铜币清账，铺子、货、客人、法阵都留着，后屋的黑门开了</i></span>' +
                    '<button class="idk-buy" data-legacy="1">传承</button></li>';
                } else if (!data.gift) {
                  /* 天赋：从六样里挑一样，定一次，之后每一代都沿用它（§6.2） */
                  html += '<li><span class="nm"><i>选一样留给下一代的底气，五秒内不选就收回去</i></span></li>';
                  for (var gfi = 0; gfi < GIFTS.length; gfi++) {
                    html += '<li data-gift-row="' + GIFTS[gfi].id + '"><span class="nm">' + esc(GIFTS[gfi].name) +
                      '<i>' + esc(GIFTS[gfi].desc) + '</i></span><button class="idk-buy" data-gift="' + GIFTS[gfi].id + '">选它</button></li>';
                  }
                } else {
                  html += '<li><span class="nm">确认交接<i>铜币清零，其余照旧；天赋沿用「' +
                    esc(giftById(data.gift) ? giftById(data.gift).name : data.gift) + '」</i></span>' +
                    '<button class="idk-buy" data-legacy="1">确定</button></li>';
                }
              } else {
                html += '<li><span class="nm">还没到时候<i>把场所、12 件核心货、3 条渠道、6 类客人都开出来，再谈下一代</i></span></li>';
              }
              /* v0.14：原来的「通关/传承」降级成可选交接 —— 不庆祝、不说「通关」，
                 还是可以带一样东西交给下一位店主；milestones 等字段照旧保留。 */
              if (clearedNow(data)) {
                html += '<li class="idk-sec">交接 <span class="p">第 ' + Math.max(1, data.generation | 0) + ' 代</span></li>';
                if (!rebirthArm) {
                  html += '<li><span class="nm">把店交给下一位店主<i>' +
                    (data.cleared ? '想接着开也行，什么时候交出去都可以' : '这间店可以一直开下去，也可以交给下一位') + '</i></span>' +
                    '<button class="idk-buy" data-rebirth="1">交给下一位</button></li>';
                } else {
                  BOONS.forEach(function (b) {
                    html += '<li data-boon-row="' + b.id + '"><span class="nm">' + esc(b.name) + '<i>' + esc(b.desc) + '</i></span>' +
                      '<button class="idk-buy" data-boon="' + b.id + '" style="color:#e0c07c;border-color:#7d6a3a">' + esc(b.note) + '</button></li>';
                  });
                  html += '<li><span class="nm"><i>选一样带过去，店铺本身从头开始；五秒内不选就收回去</i></span></li>';
                }
              }
            }
            /* v0.15：36 条成就与存档都搬去自己的页签（成就 / 设置），店铺页只留经营。
               成就见 renderAch()，存档见 renderSet()。 */
            el.shopList.innerHTML = html;
            el.shopList.scrollTop = keepTop;
            if (el.shopH) el.shopH.textContent = 'Lv.' + lv;
          }
          function upTier() {
            var nx = nextTier();
            if (!nx) return false;
            var rid = riteIdOf('tier', nx.lv);
            if (rid && riteTs(rid)) { showLine('法阵还在给「' + nx.name + '」充能，' + riteClock(riteLeftNow(rid)) + ' 后好。'); return false; }
            if (data.gold < nx.price) { showLine('还差 ' + fmt(nx.price - data.gold)); return false; }
            data.gold -= nx.price;
            /* v0.16 §8：钱付了，法阵开始充能；到点由 idleTick 自动落成（data.tier 此时还没变） */
            riteStart(rid);
            addLog('付讫：' + nx.name + ' 的法阵 ' + fmt(nx.price) + '，充能 ' + riteClock(RITES[rid] * riteFactor()), 'buy');
            showLine('法阵开始转了，' + riteClock(RITES[rid] * riteFactor()) + ' 后' + nx.name + '落成。', 3400);
            flash();
            paint(); renderShop(); renderStock(); persist();
            return true;
          }

          /* v0.7：清空账本回到地摊。先删档再重载默认值，连下一个客人也重新排。 */
          function restart() {
            resetArm = false;
            try {
              localStorage.removeItem(STORE_KEY);
              OLD_KEYS.forEach(function (k) { localStorage.removeItem(k); });
            } catch (e) {}
            clearTimers();
            busy = false; chainOn = false;
            nextEventAt = 0;
            data = load();
            clearEvents();                    /* v0.13：艺人加成、商人报价一并清掉 */
            if (scene) scene.setCustomer(false);
            custHideAt = 0;
            applyDecor();
            setState('wait');
            paint(); renderStock(); renderLog(); renderShop();
            addLog('把摊子重新支起来了，账本从头记。', 'day');
            showLine('重头来过。', 2600);
            persist();
            schedule();
          }
          /* v0.11 转生：清档重来，但把代数与选中的传家宝带过去（其余全归零，和 restart 一样从头摆摊） */
          function rebirth(boonId) {
            var gen = Math.max(1, data.generation | 0) + 1;
            var bo = boonById(boonId);
            /* v0.13：里程碑是「跳代累积」的荣誉，换店主也不清；其余计数随新档归零 */
            var keepMs = (data.milestones && typeof data.milestones === 'object') ? data.milestones : {};
            rebirthArm = false;
            try {
              localStorage.removeItem(STORE_KEY);
              OLD_KEYS.forEach(function (k) { localStorage.removeItem(k); });
            } catch (e) {}
            clearTimers();
            busy = false; chainOn = false;
            nextEventAt = 0;
            data = load();
            data.generation = gen;
            data.milestones = keepMs;         /* v0.13：里程碑保留，通关次数等计数从 0 起算 */
            clearEvents();                    /* v0.13：转生清掉艺人剩余时长与商人报价 */
            applyBoon(data, boonId);
            if (scene) scene.setCustomer(false);
            custHideAt = 0;
            applyDecor();
            setState('wait');
            syncSlots();
            paint(); renderStock(); renderLog(); renderShop();
            addLog('第 ' + gen + ' 代店主接过钥匙' + (bo ? ' · 带走「' + bo.name + '」' : ''), 'day');
            showLine(boonId === 'tier' ? '钥匙给你，招牌我留着。' :
              (boonId === 'gold' ? '柜底还有五百铜，别乱花。' : '老主顾的名单，一并给你。'), 3400);
            persist();
            schedule();
          }
          /* ============ v0.13 里程碑（称号 + 一句） ============
             条件到了就写一条 k='day' 流水、发一次气泡，每项只触发一次（存档 data.milestones）。
             计数口径都在 data 上（nOrders/nSold/nGold/nBroke/nClear/day/generation），
             lore.js 没接上时 milestoneList() 是空的，这里整段静默跳过。 */
          function milestoneCounters() {
            return {
              orders: Number(data.nOrders) || 0,
              items: Number(data.nSold) || 0,
              gold: Number(data.nGold) || 0,
              days: Number(data.day) || 0,
              generation: Number(data.generation) || 0,
              broke: Number(data.nBroke) || 0,
              clears: Number(data.nClear) || 0
            };
          }
          function checkMilestones() {
            var list = milestoneList(), st, i, m, got = [];
            if (!list.length) return 0;
            if (!data.milestones || typeof data.milestones !== 'object') data.milestones = {};
            st = milestoneCounters();
            for (i = 0; i < list.length; i++) {
              m = list[i];
              if (!m || !m.id || data.milestones[m.id]) continue;
              if (!milestoneHit(m, st)) continue;
              data.milestones[m.id] = 1;
              got.push(m);
            }
            if (!got.length) return 0;
            for (i = 0; i < got.length; i++) addLog('🏅 ' + got[i].title + '：' + got[i].line, 'day');
            showLine('🏅 ' + got[0].title + '：' + got[0].line, 6000);
            flash(700);
            persist();
            return got.length;
          }
          /* v0.14：不再有「通关小结」和庆祝 —— 只在第一次开到今天的规模时记一笔（流水一句话） */
          function checkClear() {
            if (data.cleared || !clearedNow(data)) return false;
            data.cleared = Date.now();
            data.nClear = (Number(data.nClear) || 0) + 1;   /* v0.13 里程碑：通关次数（转生后继续累积） */
            addLog('铺子开到今天的规模了。', 'word');
            showLine('这铺子，算是开起来了。', 5200);
            paint(); renderShop(); persist();
            return true;
          }
          function unlockItem(k) {
            var it = itemByKey[k];
            if (!it || isUnlocked(k)) return false;
            if ((it.lv | 0) > (data.tier | 0)) {
              showLine('得先把铺子升级到 Lv.' + it.lv);
              return false;
            }
            var cost = unlockCost(it);
            if (data.gold < cost) {
              showLine('再卖一阵子吧，还差 ' + fmt(cost - data.gold));
              return false;
            }
            data.gold -= cost;
            addUnlocked(k);
            data.stock[k] = 1;                 /* 当天限 1 件，次日补货再补满 */
            data.fresh[k] = data.day | 0;
            lastUnlockedK = k;
            applyDecor();
            addLog('进货：' + it.name + ' −' + fmt(cost), 'buy');
            showLine('新货上架了。');
            flash();
            paint(); renderShop(); renderStock(); persist();
            return true;
          }
          function buy(id) {
            var u = null;
            UPGRADES.forEach(function (x) { if (x.id === id) u = x; });
            if (!u || data.upgrades[id]) return false;
            if ((data.tier | 0) < u.minLv) { showLine('得先把铺子升级到 Lv.' + u.minLv); return false; }
            if (data.gold < u.price) { showLine('还差 ' + fmt(u.price - data.gold)); return false; }
            data.gold -= u.price;
            data.upgrades[id] = 1;
            /* v0.21：装修加成与购买顺序无关，这里不再记录顺序 */
            applyDecor();
            if (scene && scene.playInstall) scene.playInstall('decor');  /* v0.11 装修上场：1.5 秒滑入，不 await 不挡帧 */
            addLog('买下' + u.name + ' −' + fmt(u.price), 'buy');
            flash();
            paint(); renderShop(); renderStock(); persist();
            checkClear();
            return true;
          }
          function buyChannel(id) {
            var c = null;
            CHANNELS.forEach(function (x) { if (x.id === id) c = x; });
            if (!c || data.channels[id]) return false;
            if ((data.tier | 0) < c.minLv) { showLine('得先把铺子升级到 Lv.' + c.minLv); return false; }
            var rid = riteIdOf('ch', id);
            if (rid && riteTs(rid)) { showLine('「' + c.name + '」还在充能，' + riteClock(riteLeftNow(rid)) + ' 后通。'); return false; }
            if (data.gold < c.price) { showLine('还差 ' + fmt(c.price - data.gold)); return false; }
            data.gold -= c.price;
            /* v0.16 §8：渠道也要过法阵（ch1 1 小时 / ch2 2 小时 / ch3 8 小时） */
            riteStart(rid);
            addLog('付讫：' + c.name + ' −' + fmt(c.price) + '，法阵充能 ' + riteClock(RITES[rid] * riteFactor()), 'buy');
            showLine('法阵在给「' + c.name + '」接线，' + riteClock(RITES[rid] * riteFactor()) + ' 后通。', 3200);
            flash();
            paint(); renderShop(); renderStock(); persist();
            return true;
          }
          /* v0.21 猫粮：三档不再排队，谁都能直接喂——换一种粮就是重新买一袋，价钱写在按钮上。
             效果只按「当前在喂的那一档」算（客流走 rushFactor、得手率走 doThief）。 */
          function buyCatFood(id) {
            var cf = null;
            CATFOODS.forEach(function (x) { if (x.id === id) cf = x; });
            if (!cf) return false;
            if (catTierNow(data) === cf.id) { showLine('现在喂的就是这一档。'); return false; }
            if ((data.tier | 0) < cf.minLv) { showLine('得先把铺子升级到 Lv.' + cf.minLv); return false; }
            if (data.gold < cf.price) { showLine('还差 ' + fmt(cf.price - data.gold)); return false; }
            data.gold -= cf.price;
            data.catToday = (Number(data.catToday) || 0) + cf.price;   /* v0.26：猫粮也算今天的支出 */
            data.catFood = cf.id;
            addLog('猫粮换成「' + cf.name + '」−' + fmt(cf.price), 'buy');
            showLine('猫换口味了：' + cf.name + '。', 3000);
            flash(900);
            checkAchievements();
            paint(); renderShop(); persist();
            return true;
          }
          /* v0.23 资助冒险队：开关式，不立刻扣钱，日结时按天扣（付不出自动停） */
          function sponsorToggle(id) {
            var sy = sponsorById(id);
            if (!sy) return false;
            var arr = Array.isArray(data.sponsor) ? data.sponsor.slice() : [];
            var at = arr.indexOf(id);
            if (at >= 0) {
              arr.splice(at, 1);
              data.sponsor = arr;
              addLog('不再资助' + sy.name + '。', 'word');
              showLine('和' + sy.name + '结了账。', 2600);
            } else {
              if ((data.tier | 0) < sy.lv) { showLine('得先把铺子升级到 Lv.' + sy.lv); return false; }
              arr.push(id);
              data.sponsor = arr;
              addLog('开始资助' + sy.name + '：每天 ' + fmt(sy.cost) + '。', 'word');
              showLine('明天起每天给' + sy.name + ' ' + fmt(sy.cost) + '。', 3000);
            }
            flash(700);
            paint(); renderDream(); renderShop(); persist();
            return true;
          }
          /* v0.8 解锁顾客：一次买断，之后按权重复合进客流 */
          function buyCustomer(id) {
            var c = custById(id);
            if (!c || id === 'villager' || data.cust[id]) return false;
            if ((data.tier | 0) < c.lv) { showLine('得先把铺子升级到 Lv.' + c.lv); return false; }
            if (data.gold < c.price) { showLine('还差 ' + fmt(c.price - data.gold)); return false; }
            data.gold -= c.price;
            data.cust[id] = 1;
            addLog('客源打通：' + c.name + ' −' + fmt(c.price) + '（单价 ×' + c.mult.toFixed(2) + '，一次 ' + c.bulk + ' 件）', 'buy');
            flash();
            showLine(c.name + '开始光顾了。', 2800);
            paint(); renderShop(); persist();
            checkClear();
            return true;
          }
          /* atMs：这一天的「日界」时刻。离线补算要逐日结账，每结一天都得把 dayStart 钉在那一天的日界上，
             不能一律拿 Date.now() —— 否则一次补算就把日历抹平，跨天该扣的房租、该换的行情全丢了。
             quiet：补算会连着结十几/几十天，中间不必重绘，最后统一 paint 一次就够。 */
          function settleDay(atMs, quiet) {
            /* v0.23 资助：每天先扣这笔固定支出（比房租优先，付不出就整队停掉，不滚欠账），
               换声望与偶发战利品；钱袋不够时连房租都轮不到，先看这一笔。 */
            var spList = sponsorActive(data), spCost = 0, spFame = 0, spBack = 0, spNames = [], spi, sps;
            for (spi = 0; spi < spList.length; spi++) { spCost += spList[spi].cost; spNames.push(spList[spi].name); }
            if (spCost > 0) {
              if ((Number(data.gold) || 0) >= spCost) {
                data.gold -= spCost;
                data.sponsorToday = (Number(data.sponsorToday) || 0) + spCost;   /* v0.24 经营页：今日资助支出 */
                for (spi = 0; spi < spList.length; spi++) {
                  sps = spList[spi];
                  spFame += sps.fame;
                  if (Math.random() < sps.luck) spBack += Math.round(rand(sps.back[0], sps.back[1]) * giftLoot());
                }
                data.gold += spBack;
                if (spBack > 0) data.lootToday = (Number(data.lootToday) || 0) + spBack;   /* v0.24 经营页：今日战利品收入 */
                if (spFame) addFame(spFame);
                addLog('资助' + spNames.join('、') + '：付 ' + fmt(spCost) +
                  (spBack ? '，带回战利品 ' + fmt(spBack) : '，这回空手') +
                  (spFame ? ' · 声望 +' + spFame : ''), 'day');
              } else {
                data.sponsor = [];
                addLog('钱袋见底，资助停了：' + spNames.join('、') + ' 等不到这批钱了。', 'day');
              }
            }
            /* v0.6：房租 = 当日营业额 10%（ceil，下限 20 铜）+ 蜡烛 5 铜
               旧公式随天数线性涨，在 60× 解锁价结构下会把玩家逼破产（§D.1） */
            var rent = Math.round(Math.max(20, Math.ceil((Number(data.revToday) || 0) * 0.10)) * giftRent());
            var candle = 5;
            /* v0.8.3：旧账（data.debt）并进账单一起付，付掉的部分当场销账，剩下的滚到明天。
               以前 debt 只增不减，钱袋里攒够钱了也还挂着那笔数，变成一张没人收的欠条（用户报过：3 银 60 铜还欠 87）。 */
            var back = Math.max(0, Math.round(Number(data.debt) || 0));
            var cost = rent + candle + back;
            var paid = Math.min(data.gold, cost);
            data.gold -= paid;
            data.rentToday = Math.round(paid);   /* v0.24 经营页：今天实际交出去的房租+蜡烛 */
            if ((data.gold | 0) <= 0) data.nBroke = (Number(data.nBroke) || 0) + 1;   /* v0.13 里程碑：钱袋见底 */
            var short = cost - paid;
            data.debt = short;                       /* 旧账 + 今天的新缺口 − 已付 = 滚到明天的 */
            if (short > 0) { data.arrears += 1; } else { data.arrears = 0; }
            addLog('第' + data.day + '天结账：房租' + fmt(rent) + '、蜡烛' + fmt(candle) + (back ? '、补旧账' + fmt(back) : '') + ' → 付 ' + fmt(paid) + (short ? '，还欠 ' + fmt(short) : ''), 'day');
            data.revLast = Math.max(0, Math.round(Number(data.revToday) || 0));
            data.revToday = 0;
            /* v0.14：今天净赚（钱袋增量）记进最好的一天（成就 profit_day_100） */
            data.bestNet = Math.max(Number(data.bestNet) || 0, Math.round((Number(data.gold) || 0) - (Number(data.goldDay0) || 0)));
            data.goldDay0 = data.gold;          /* 新的一天从当前钱袋起算净赚 */
            data.day += 1;
            /* v0.11 天气：新的一天重抽一次（55/20/17/8）。节日由天数直接推导，不另存状态 */
            /* v0.12.3：昨天的「明日预告」就是今天的天气（说到做到），同时再抽一份新的预告。
               老档没有 weatherNext 时退回现抽。 */
            var prevWeather = data.weather;
            data.weather = WEATHER_MUL[data.weatherNext] ? data.weatherNext : rollWeather(Math.random());
            data.weatherNext = rollWeather(Math.random());
            data.festival = festOn(data.day);
            data.fresh = {};
            data.sold = 0;
            data.custToday = 0;                                  /* v0.22 经营页：新的一天客流从 0 起算 */
            if (Number(data.tut) > 0 && Number(data.tut) !== 9) data.tut = 9;   /* v0.27 新手三步：过完一天就算走完了 */
            /* v0.24 经营页：今日收支五本小账，跨天清零（房租/资助在日结时已经记进昨天那笔） */
            data.lootToday = 0; data.rentToday = 0; data.mealToday = 0; data.sponsorToday = 0; data.restockToday = 0; data.catToday = 0;
            /* v0.22：留最近 7 天的营业额外加一天，经营页画柱看走势 */
            data.revHist = (Array.isArray(data.revHist) ? data.revHist : []).concat([Math.round(Number(data.revLast) || 0)]).slice(-7);
            /* v0.14 跨日打点（只写计数，成就统一在函数末尾结算）：
               weatherSeen 见过几种天气（weather_4）、marketSeen/lanternSeen 集市日与灯会日、
               noDebtRun 连续不欠账天数（debt_free_10）、season 四季（只由天数推，一天只切一次）。 */
            if (!data.weatherSeen || typeof data.weatherSeen !== 'object') data.weatherSeen = {};
            if (data.weather) data.weatherSeen[data.weather] = 1;
            if (isMarketDay(data.day)) data.marketSeen = (Number(data.marketSeen) || 0) + 1;
            if (isLanternDay(data.day)) data.lanternSeen = (Number(data.lanternSeen) || 0) + 1;
            data.noDebtRun = short > 0 ? 0 : (Number(data.noDebtRun) || 0) + 1;
            /* v0.16 四季：改由墙钟日历天推（每 3 个日历天换一季，seasonOf 只吃日历天）。
               切换做两件事：写 data.season、叫 scene.setSeason 让大窗换景（scene 还没落地就跳过）。 */
            var nextSeason = seasonOf(calDays(Date.now(), data.realStart));
            if ((Number(data.season) || 0) !== nextSeason) {
              data.season = nextSeason;
              if (scene && typeof scene.setSeason === 'function') scene.setSeason(nextSeason);
              if (!quiet) addLog('天时转' + (seasonWord(nextSeason) || '了') + '。', 'word');
            }
            data.dayStart = (atMs == null) ? Date.now() : atMs;
            /* v0.11.1 死局修复：作息是「连欠两天 → 歇业」，可歇业日没有客流也没有收入，
               只有"次日当场付清"才算还上、才重新开门 —— 钱袋见底时这就成了永久停业
               （实测 5 个种子里 3 个第 2–3 天起连续 20 天 0 客流 0 收入，档直接废掉）。
               用户要的是背景板挂机，不该因为一次破产就再也玩不了：歇业日仍还不上时，房东宽限一天，
               欠账留着以后慢慢补，明天照常开门。惩罚最多一天。 */
            if (data.rest && short > 0) {
              data.arrears = 0;
              addLog('房东摆摆手：明天照常开门，欠的慢慢还', 'day');
            }
            data.rest = data.arrears >= 2;
            if (data.rest) addLog('房东放话：明天别开门', 'day');
            var pool = shelf();
            var hot = pool.length ? pool[Math.floor(Math.random() * pool.length)] : null;
            data.marketK = hot ? hot.k : '';
            data.marketMult = Math.random() < 0.45 ? 1.25 : 0.8;
            /* 补算（quiet）时不逐日播报行情：一天一条结账已经够长，行情本身照换（上面 marketK/marketMult 已更新） */
            if (hot && !quiet) addLog((data.marketMult > 1 ? '行情涨：' : '行情跌：') + hot.name, 'day');
            /* v0.11：新的一天先排常客（每位每 2 个游戏日来一次，一天最多 2 位） */
            data.regToday = regularsDueToday(data.day, data.cust, data.regs, Math.random);
            /* v0.11 每日一句：打烊时说一句世界碎片。补算时不吭声——40 天补算刷 40 条会把流水冲没 */
            if (!quiet) {
              var wl = nextWorldLine(data, Math.random);
              if (wl) addLog(wl, 'word');
              /* v0.13 看天自言自语：天气换了才说一句，走同一条「每日一句」通道（同一条流水行） */
              if (data.weather !== prevWeather) {
                var wxl = weatherLine(data.weather, Math.random);
                if (wxl) addLog(wxl, 'word');
              }
            }
            /* v0.14：跨日是最全的一次打点（天数/连续不欠账/天气/季节/集市），quiet 补算也要结算，
               否则补算 40 天会把这些成就全漏掉。 */
            checkAchievements();
            if (!quiet) { paint(); renderStock(); renderShop(); persist(); }
            return paid;
          }

          function persist() {      data.x = parseInt(card.style.left, 10) || 0;
            data.y = parseInt(card.style.top, 10) || 0;
            data.collapsed = card.getAttribute('data-collapsed') === '1';
            data.big = card.classList.contains('is-big');
            data.quiet = card.getAttribute('data-quiet') === '1';
            data.off = !!off;
            /* v0.11：存档版本戳。同一份档可能同时存在于 localStorage 和磁盘，
               两边谁新谁旧只能靠时间戳比 —— 没有它，多开时旧档会把新档盖回去。 */
            /* v0.12.2：再加一个单调递增的 saveSeq。多开时两个窗口各自的序号会错开，
               宿主拿它跟 savedAt 一起判「谁才是慢半拍的那个」（比自己旧、序号也不比自己大 →
               拒写）。序号跟档一起存，重开、换端口都会接着往上走。 */
            data.saveSeq = (Number(data.saveSeq) || 0) + 1;
            data.savedAt = Date.now();
            try { localStorage.setItem(STORE_KEY, JSON.stringify(data)); } catch (e) {}
            schedulePushSave();
          }

          /* ---------- v0.10.2：把档推到磁盘（节流 4 秒，结算太频繁） ---------- */
          var pushTimer = 0, diskOk = null, diskStale = 0;
          function pushSave() {
            var url = saveEndpoint();
            if (!url) return;
            pushTimer = 0;
            var body;
            /* v0.12.2：body 里已经带了 savedAt / saveSeq（persist 每次都会写进 data），
               宿主据此判新旧。这里不需要额外拼信封。 */
            try { body = JSON.stringify(data); } catch (e) { return; }
            fetch(url, { method: 'POST', credentials: 'same-origin', headers: { 'content-type': 'application/json' }, body: body })
              .then(function (r) { return r.json(); })
              .then(function (res) {
                diskOk = !!(res && res.ok);
                /* 宿主说我们比磁盘旧（另一个窗口刚写过）：这次不覆盖它，静默作罢。
                   不弹窗、不改本地档 —— 玩家下次动一下就会带着新的 savedAt 重新写盘。
                   顺手把磁盘的序号并进来，保证下一次写盘时 saveSeq 一定比磁盘大。 */
                if (res && res.stale) {
                  diskStale = (res.disk && Number(res.disk.savedAt)) || 0;
                  if (res.disk && Number(res.disk.saveSeq) > (Number(data.saveSeq) || 0)) data.saveSeq = Number(res.disk.saveSeq);
                }
              })
              .catch(function () { diskOk = false; });
          }
          function schedulePushSave() {
            if (pushTimer || !saveEndpoint()) return;
            pushTimer = setTimeout(pushSave, 4000);
          }

          function showLine(text, ms) {
            if (!text || card.getAttribute('data-quiet') === '1') return;
            el.bubble.textContent = text;
            el.bubble.setAttribute('data-on', '1');
            bubbleT = Date.now() + (ms || 4200);
          }

          function flash(ms) {
            card.setAttribute('data-flash', '1');
            flashT = Date.now() + (ms || 1200);
          }

          function addLog(text, kind) {
            data.log.push({ t: hhmm(new Date()), s: text, k: kind || 'sale' });
            if (data.log.length > 80) data.log.shift();
            renderLog(); persist();
          }

          function renderLog() {
            /* v0.17：流水不再占页签。这里改成侧栏底部的薄条：只留最近两条，时间 + 一句话。
               小卡也渲染（CSS 只露出薄条）；写日志时随时更新，不需要等大窗。 */
            var log = data.log || [];
            var recent = [];
            for (var i = log.length - 1; i >= 0 && recent.length < 2; i--) {
              var e = log[i];
              recent.push('<li data-k="' + esc(e.k || 'sale') + '" title="' + esc(e.t + ' ' + e.s) + '"><span class="t">' + esc(e.t) + '</span><span>' + esc(e.s) + '</span></li>');
            }
            if (el.recent) {
              el.recent.innerHTML = recent.length ? recent.join('') : '<li class="idk-empty">今天还没开张</li>';
            }
            /* 旧版流水容器已随页签删除；保留 if 只是防御，不让旧存档或测试页炸掉。 */
            if (el.logH) el.logH.textContent = '今天 · ' + log.length + ' 条';
            if (el.log) {
              if (!log.length) el.log.innerHTML = '<div class="idk-empty">炉子刚点上。第一位客人还没来。</div>';
              else {
                var all = [];
                for (var j = log.length - 1; j >= 0 && all.length < 30; j--) {
                  var x = log[j];
                  all.push('<li data-k="' + esc(x.k || 'sale') + '"><span class="t">' + esc(x.t) + '</span><span>' + esc(x.s) + '</span></li>');
                }
                el.log.innerHTML = all.join('');
              }
            }
          }

          function unlockRow(it) {
            var lv = it.lv | 0;
            var cost = unlockCost(it);
            var ready = lv <= (data.tier | 0);
            var enough = data.gold >= cost;
            var short = ready && !enough ? '还差 ' + fmt(cost - data.gold) : '';
            /* v0.13：名字后一个小「?」，点一下在气泡里说这件货的来历。
               lore.js 没加载（itemLore 空）就整颗按钮都不出现，退回 0.12.6 的样子。 */
            var ask = itemLore(it.k) ? '<button class="idk-lore" data-lore="' + it.k + '" title="这件货的来历">?</button>' : '';
            var btn = ready
              ? '<button class="idk-buy" data-unlock="' + it.k + '" title="' + cost + ' 铜"' + (enough ? '' : ' disabled') + '>解锁 ' + fmt(cost) + '</button>'
              : '<button class="idk-buy" data-unlock="' + it.k + '" disabled title="需 Lv.' + lv + '">需 Lv.' + lv + '</button>';
            return '<li data-k="' + it.k + '" data-lv="' + lv + '" data-cost="' + cost + '">' +
              '<span class="nm">🔒 ' + esc(it.name) + '</span>' + ask +
              '<span class="idk-short"' + (short ? '' : ' hidden') + '>' + short + '</span>' + btn + '</li>';
          }

          /* v0.15：货架页签撤了 —— 陈列位改成全自动（syncSlots/fillSlots 照旧跑），
             「还没买的货」并入店铺页末尾的「货品」段（见 renderShop）。
             这个函数留作空壳，老的调用点（paint / 解锁 / 导入 / restart）照旧安全。 */
          function renderStock() { renderShop(); }

          /* v0.12.4：列表可用高度不是行高的整数倍时，最后一行会被切成半截（用户报「货架显示不全」）。
             把 max-height 对齐到整行：宁可少显示一行，也不留半行。 */
          function snapRows(list) {
            if (!list || !list.firstElementChild) return;
            var pane = list.closest ? list.closest('.idk-pane') : null;
            if (!pane || !pane.clientHeight) return;
            list.style.maxHeight = '';
            var rowH = list.firstElementChild.getBoundingClientRect().height;
            if (!rowH) return;
            var avail = pane.getBoundingClientRect().bottom - list.getBoundingClientRect().top - 6;
            var cssMax = parseFloat(getComputedStyle(list).maxHeight);
            var n = Math.max(1, Math.floor(avail / rowH));
            if (cssMax > 0) n = Math.min(n, Math.max(1, Math.floor(cssMax / rowH)));
            list.style.maxHeight = Math.round(n * rowH) + 'px';
          }
          /* v0.11 前台 3 格：空着的格子写「点一下摆货」，有货的格子写名字 + 后仓还剩几件 */
          function renderSlots() {
            if (!el.slotList) return;
            var sl = syncSlots(), map = byKeyMap(shelf());
            el.slotList.innerHTML = sl.map(function (k, i) {
              var it = map[k];
              var q = it ? (data.stock[k] || 0) : 0;
              return '<li class="idk-slot' + (it ? '' : ' is-empty') + '" data-slot="' + i + '" title="' +
                (it ? '点一下换一件摆上（后仓 ' + q + ' 件）' : '点一下从后仓摆一件上来') + '">' +
                '<span class="n">' + (it ? esc(it.name) : '空') + '</span>' +
                '<span class="q">' + (it ? '仓 ' + q : '摆货') + '</span></li>';
            }).join('');
          }

          /* ============ v0.11 ETA：把「还差多少」折算成「还要多久」 ============
             分母 = revLast（上一天的营业额，正好是「日净存」的粗糙代理）÷ 一个游戏日的分钟数。
             revLast 缺失或为 0（还没结过账、刚重来）就没有可靠的分母 → 返回 ''，
             调用方原样退回「还差 X 铜」，绝不编一个假时间。 */
          function perMinGold() {
            var daily = Number(data.revLast) || 0;
            if (daily <= 0) return 0;
            var span = daySpanMs();
            return span > 0 ? daily / (span / 60000) : 0;
          }
          function etaNum(v) { return String(Math.round(v * 10) / 10).replace(/\.0$/, ''); }
          function etaText(gap) {
            var pm = perMinGold();
            if (!(pm > 0) || !(gap > 0)) return '';
            var m = gap / pm;
            if (!isFinite(m) || m < 0) return '';
            if (m < 60) return '约 ' + Math.max(1, Math.round(m)) + ' 分钟';
            if (m < 60 * 24) {
              var h = m / 60;
              return '约 ' + (h < 10 ? etaNum(h) : Math.round(h)) + ' 小时';
            }
            return '约 ' + Math.round(m / 1440) + ' 天';
          }

          /* v0.12.1：锁提示改成「下一步最便宜的那件事」。
             老写法永远先喊「下一步升级木棚小摊」，可玩家手里 30 铜时，药水 20 / 装修 45 / 客种 29 都比升级近 ——
             喊升级等于没喊。现在把当前所有「能买 / 差得不多」的项摊开取价格最低的那项当下一步，
             只有连最便宜的也超过 2 天净存，才退回「最近一件」的老口径。不新增存档字段，全部现算。 */
          function nextBuyables() {
            var out = [];
            var lv = data.tier | 0;
            var nt = TIERS[lv + 1];
            if (nt) out.push({ price: nt.price, name: nt.name, why: '客人更多、货更能卖' });
            UPGRADES.forEach(function (u) {
              if (data.upgrades[u.id] || lv < (u.minLv | 0)) return;
              out.push({ price: u.price, name: u.name, why: u.desc });
            });
            CHANNELS.forEach(function (c) {
              if (data.channels[c.id] || lv < (c.minLv | 0)) return;
              out.push({ price: c.price, name: c.name, why: c.desc });
            });
            CUSTS.forEach(function (c) {
              if (c.id === 'villager' || data.cust[c.id] || lv < (c.lv | 0)) return;
              /* v0.16：灵体客不是买来的，传承那一刻自己进店门，别把它算进「下一步能买什么」 */
              if (c.gen) return;
              out.push({ price: c.price, name: c.name, why: c.desc });
            });
            availableLocked().forEach(function (it) {
              var cost = unlockCost(it);
              if (cost <= 0) return;                  /* 免费货开局就送（魔力药水/火球卷轴），不用提示 */
              out.push({ price: cost, name: it.name, why: '解锁后能上架，客人会挑走' });
            });
            return out;
          }
          /* 买过任何一件「要花钱」的货没有？第 1 天引导用；开局送的免费货不算 */
          function hasPaidUnlock() {
            for (var i = 0; i < data.unlocked.length; i++) {
              var it = itemByKey[data.unlocked[i]];
              if (it && (it.unlock | 0) > 0) return true;
            }
            return false;
          }

          /* ---------- v0.14 成就打点 ----------
             只做两件事：写 data.ach[cond] = 1、push 一条流水（用 lore 的 line）。不给钱、不给属性。
             检查点在成交/跨日/购买/常客/天气/季节/事件/打烊；paint 里也兜一次（每秒一次，36 条全扫）。
             成就判定本身在模块级 achCtx/achHit（纯函数），这里只管落地与播报。 */
          function checkAchievements() {
            var list = achLore(), i, a, n = 0, ctx;
            if (!list.length) return 0;
            if (!data.ach || typeof data.ach !== 'object' || Array.isArray(data.ach)) data.ach = {};
            ctx = achCtx(data);
            for (i = 0; i < list.length; i++) {
              a = list[i];
              if (!a || !a.id || data.ach[a.id]) continue;
              if (!achHit(a.cond || a.id, ctx)) continue;
              data.ach[a.id] = 1;
              n++;
              addLog('🏆 ' + (a.title || a.cond || a.id) + (a.line ? '：' + a.line : ''), 'day');
            }
            if (n) { renderAch(); renderShop(); }
            return n;
          }
          function achCount() {
            var list = achLore(), got = data.ach || {}, n = 0, i;
            for (i = 0; i < list.length; i++) if (list[i] && got[list[i].id]) n++;
            return n;
          }

          /* ---------- v0.14 心愿页：名望 / 城建 / 圆梦 ---------- */
          function fameNow() { return Math.max(0, Math.min(300, Math.round(Number(data.fame) || 0))); }
          function addFame(n) {
            data.fame = Math.max(0, Math.min(300, fameNow() + Math.round(Number(n) || 0)));
            return data.fame;
          }
          /* v0.14：这位常客还没圆、也还没求过的那条心愿（每条只求一次，圆过就不再求） */
          function dreamFor(who) {
            var list = dreamLore(), asked = data.wishAsked || {}, i, x;
            if (!who) return null;
            for (i = 0; i < list.length; i++) {
              x = list[i];
              if (!x || x.who !== who) continue;
              if (hasIn(data.dreams, x.id)) continue;
              if (asked[x.id]) continue;
              return x;
            }
            return null;
          }
          /* 心愿页顶部那一行：认识几位、其中几位到朋友 / 知己（等级只由 regs[id].n 推） */
          function regStats() {
            var regs = data.regs || {}, ids = Object.keys(regs), out = { n: 0, friend: 0, conf: 0 }, i, lv;
            for (i = 0; i < ids.length; i++) {
              lv = regLevel(regs[ids[i]] && regs[ids[i]].n);
              if (lv < 1) continue;
              out.n++;
              if (lv >= 2) out.friend++;
              if (lv >= 3) out.conf++;
            }
            return out;
          }
          /* 圆梦：扣铜（不够就禁用并显示差多少）、写一条 k='dream' 流水、名望 +5 */
          function buyDream(id) {
            var d = dreamById(id), cost;
            if (!d || hasIn(data.dreams, id)) return false;
            cost = moneyOf(d.cost);
            if ((data.gold | 0) < cost) {
              showLine('还差 ' + fmt(cost - (data.gold | 0)) + '。', 2400);
              return false;
            }
            data.gold -= cost;
            data.dreams.push(id);
            addFame(5);
            addLog('圆了' + (d.who || '一位常客') + '的心愿：' + (d.title || id) + ' −' + fmt(cost), 'dream');
            showLine(d.after || ('「' + (d.title || '那件事') + '」，办成了。'), 4200);
            flash(1100);
            checkAchievements();
            paint(); renderDream(); renderShop(); persist();
            return true;
          }
          /* 城建：按 lore.TOWN 的顺序一档一档来，名望 +10 */
          function buyTown(id) {
            var t = townById(id), cost;
            if (!t || !townOpen(data, id)) return false;
            var rid = riteIdOf('town', id);
            if (rid && riteTs(rid)) { showLine('这项工程还在充能，' + riteClock(riteLeftNow(rid)) + ' 后完工。', 2600); return false; }
            cost = moneyOf(t.cost);
            if ((data.gold | 0) < cost) {
              showLine('还差 ' + fmt(cost - (data.gold | 0)) + '。', 2400);
              return false;
            }
            data.gold -= cost;
            /* v0.16 §8：城建也走法阵（6/12/18/24/36 小时），到点由 idleTick 落成 */
            riteStart(rid);
            addLog('动工：' + (t.title || id) + ' −' + fmt(cost) + '，法阵充能 ' + riteClock(RITES[rid] * riteFactor()), 'town');
            showLine((t.title || '工程') + '动工了，法阵充能 ' + riteClock(RITES[rid] * riteFactor()) + '。', 3600);
            flash(1100);
            paint(); renderDream(); renderShop(); persist();
            return true;
          }
          /* ============ v0.22 经营页 ============
             玩家问的两件事：今天赚了多少、我买的东西到底给我涨了多少。
             口径全部复用 FLOW_ITEMS / PRICE_ITEMS 与 dayRevBase()，不另起一套公式；
             单件收益 = 「有它 / 没它」的日营收差，跟店铺页的回本天数同一套数。 */
          function renderStat() {
            if (!el.statList) return;
            var base = dayRevBase();
            var today = Math.round(Number(data.revToday) || 0);
            var yest = Math.round(Number(data.revLast) || 0);
            var custs = Number(data.custToday) || 0;
            var fMul = flowMulOf(data), pMul = priceMulOf(data);
            var fPct = 1 / fMul - 1, pPct = pMul - 1;
            var i, x, html = '';
            /* 伙食档位要在这里先定：收入账（其他加成）和支出账（伙食那行）都要用，
               不能只在收账展开时赋值，否则收起收入账就会读不到。
               v0.26：支出是「会花多少」，所以按玩家选的档（foodTier）算，不是上一顿实际吃到的档。 */
            var ft = clampN(data.foodTier == null ? (data.mealTier == null ? 0 : data.mealTier) : data.foodTier, 0, MEALS.length - 1);
            var fm = MEALS[ft] || MEALS[0];

            var incSale = Math.max(0, Math.round(Number(data.revToday) || 0));
            var incLoot = Math.max(0, Math.round(Number(data.lootToday) || 0));
            /* v0.26：支出改成「预显示」—— 不等扣款，按当前状态先把今天要花多少摆出来，
               玩家换伙食档、加资助、买猫粮、补货之后，这里立刻跟着变（每秒重算一次）。
               收入仍是真账（营业额 + 已带回的战利品），只有支出是预估。 */
            var expRent = Math.max(20, Math.ceil(incSale * 0.10)) + 5;      /* 房租 10%（ceil，下限 20）+ 蜡烛 5 */
            var expMeal = dayFoodCost(ft);                                   /* 两顿正餐 */
            var expCat = Math.max(0, Math.round(Number(data.catToday) || 0)); /* 今天买猫粮已经花掉的 */
            var expSp = sponsorDaily(data);                                  /* 资助按天扣 */
            var expStock = restockCost();                                    /* 下一轮上货的料钱（估） */
            var income = incSale + incLoot;
            var expense = expRent + expMeal + expCat + expSp + expStock;
            var bal = income - expense;
            var signed = function (v) { return (v > 0 ? '+' : v < 0 ? '−' : '') + fmt(Math.abs(v)); };

            if (el.statH) el.statH.textContent = '合计 ' + signed(bal);
            if (el.statBox) {
              el.statBox.innerHTML =
                '<div class="idk-kv"><span>收入</span><b>+' + fmt(income) + '</b></div>' +
                '<div class="idk-kv"><span>支出</span><b>−' + fmt(expense) + '</b></div>' +
                '<div class="idk-kv"><span>合计</span><b>' + signed(bal) + '</b></div>' +
                '<div class="idk-kv"><span>成交</span><b>' + custs + ' 单' + (custs ? ' · ' + fmt(Math.round(incSale / custs)) : '') + '</b></div>';
            }

            /* 收入账：钱从哪儿进来。营业额和战利品是真发生的数，下面的装修归因是「少了它今天会少赚多少」的估算。 */
            html += grpHead('stat.income', '收入', '+' + fmt(income));
            if (uiOpen('stat.income')) {
              html += '<li><span class="nm">营业额<i>' + custs + ' 单成交' + (yest ? ' · 昨天 ' + fmt(yest) : '') + '</i></span><span class="p">+' + fmt(incSale) + '</span></li>';
              html += '<li><span class="nm">队伍带回的战利品<i>' +
                (sponsorActive(data).length ? '资助 ' + sponsorActive(data).length + ' 支队伍' : '还没资助冒险队') +
                '</i></span><span class="p">+' + fmt(incLoot) + '</span></li>';

            /* 1. 装修：客流 / 客单价 两笔账，再逐件列
               口径（v0.21）：每件都按「少了这一件，今天少赚多少」折算 —— 客流件少赚 base×b，
               客单价件少赚 base×(p−1)；合计那一行是全部装修一起的增量，别和逐件相加混用。 */
            html += '<li class="idk-sec">装修 · 客流合计 +' + Math.round(fPct * 100) + '%（多赚 ' + fmt(Math.round(base * (1 - fMul))) + '/天）</li>';
            var fParts = flowParts(data);
            if (!fParts.length) html += '<li class="idk-sec">还没买带客流的摆设</li>';
            for (i = 0; i < fParts.length; i++) {
              x = fParts[i];
              html += '<li><span class="nm">' + esc(x.name) + '<i>客流 +' + (x.b * 100).toFixed(1) + '%</i></span><span class="p">+' + fmt(Math.max(1, Math.round(base * x.b))) + '/天</span></li>';
            }
            html += '<li class="idk-sec">装修 · 客单价 +' + Math.round(pPct * 100) + '%（多赚 ' + fmt(Math.round(base * (pMul - 1))) + '/天）</li>';
            var pParts = priceParts(data);
            if (!pParts.length) html += '<li class="idk-sec">还没买抬价的摆设</li>';
            for (i = 0; i < pParts.length; i++) {
              x = pParts[i];
              html += '<li><span class="nm">' + esc(x.name) + '<i>卖价 +' + (x.b * 100).toFixed(1) + '%</i></span><span class="p">+' + fmt(Math.max(1, Math.round(base * x.b))) + '/天</span></li>';
            }

            /* 2. 店铺之外那些也在抬收益的东西：渠道、伙食、猫粮、天赋、天气 */
            html += '<li class="idk-sec">其他加成</li>';
            for (i = 0; i < CHANNELS.length; i++) {
              x = CHANNELS[i];
              if (!data.channels[x.id]) continue;
              var g = channelGain(x);
              html += '<li><span class="nm">' + esc(x.name) + '<i>这批货卖价 +15%</i></span><span class="p">+' + fmt(Math.round(g)) + '/天</span></li>';
            }
            if (fm.price && fm.price > 1) html += '<li><span class="nm">伙食 · ' + esc(fm.name) + '<i>卖价 ×' + fm.price + '</i></span><span class="p">+' + fmt(Math.round(base * (fm.price - 1))) + '/天</span></li>';
            if (Number(data.catFood) > 0) {
              var cm = catFoodMul(data);
              html += '<li><span class="nm">猫粮 · ' + esc((CATFOODS[(Number(data.catFood) | 0) - 1] || {}).name || '') + '<i>客流 +' + Math.round((1 / cm - 1) * 100) + '%</i></span><span class="p">+' + fmt(Math.round(base * (1 / cm - 1))) + '/天</span></li>';
            }
            if (data.gift) {
              var gif = giftById(data.gift);
              var gifEffect = data.gift === 'flow' ? '客流 +11%' : data.gift === 'price' ? '售价 +8%'
                : data.gift === 'rite' ? '充能 −20%' : data.gift === 'loot' ? '战利品 +50%'
                : data.gift === 'rent' ? '房租 −20%' : '补货 −15%';
              html += '<li><span class="nm">天赋 · ' + esc(gif ? gif.name : '') + '<i>传承带来的：' + esc(gif ? gif.desc : '') + '</i></span><span class="p">' + gifEffect + '</span></li>';
            }
            var wf = weatherFlow(data.weather), wp = weatherPrice(data.weather);
            if (data.weather) html += '<li><span class="nm">天气 · ' + esc(WEATHER_CN[normWeather(data.weather)] || '') + '<i>客流 ×' + wf + ' · 卖价 ×' + wp + '</i></span><span class="p">' + (wf * wp >= 1 ? '+' : '−') + fmt(Math.abs(Math.round(base * (wf * wp - 1)))) + '/天</span></li>';
            }

            /* 3. 投入与回本：只算持续性装修（渠道/城建/心愿不在这一栏） */
            var spent = 0, owned = 0;
            for (i = 0; i < UPGRADES.length; i++) {
              if (data.upgrades[UPGRADES[i].id]) { spent += UPGRADES[i].price; owned += 1; }
            }
            var gain = base * (1 - fMul) + base * (pMul - 1);
            if (gain < 0) gain = 0;
            /* 4. v0.26 支出账：预显示。每一笔都是「按现在这个样子，今天会花掉多少」，
               换档/加资助/买猫粮/补货之后立刻重算，不用等日结。 */
            html += grpHead('stat.expense', '支出（预计）', '−' + fmt(expense));
            if (uiOpen('stat.expense')) {
              html += '<li><span class="nm">房租与蜡烛<i>今天营业额 ' + fmt(incSale) + ' 的 10%（保底 20）+ 5 铜，日结时扣' +
                (data.rentToday ? ' · 今天已扣 ' + fmt(data.rentToday) : '') + '</i></span><span class="q">−' + fmt(expRent) + '</span></li>';
              html += '<li><span class="nm">伙食<i>' + esc(fm.short || fm.name) + ' · 两顿 × ' + fmt(mealPrice(ft)) + '，吃一顿扣一顿' +
                (data.mealToday ? ' · 今天已扣 ' + fmt(data.mealToday) : '') + '</i></span><span class="q">−' + fmt(expMeal) + '</span></li>';
              html += '<li><span class="nm">猫粮<i>' + (Number(data.catFood) > 0
                ? '在喂' + esc((CATFOODS[(Number(data.catFood) | 0) - 1] || {}).name || '') + (data.catToday ? ' · 今天换粮 −' + fmt(data.catToday) : ' · 今天没换粮')
                : '还没养猫') + '</i></span><span class="q">−' + fmt(expCat) + '</span></li>';
              html += '<li><span class="nm">资助冒险队<i>' +
                (sponsorActive(data).length ? esc(sponsorActive(data).map(function (s) { return s.name; }).join('、')) + ' · 按天扣' : '没雇人，不花钱') +
                '</i></span><span class="q">−' + fmt(expSp) + '</span></li>';
              html += '<li><span class="nm">进货补货<i>按现在货架估下一轮的料钱' +
                (data.restockToday ? ' · 今天已补 ' + fmt(data.restockToday) : ' · 今天还没补') + '</i></span><span class="q">−' + fmt(expStock) + '</span></li>';
            }
            /* 5. 投入与回本放在两本账之后：先看今天进出，再看这些摆设值不值。 */
            html += '<li class="idk-sec">投入与回本</li>';
            html += '<li><span class="nm">装修已投入<i>' + owned + ' 件</i></span><span class="q">' + fmt(spent) + '</span></li>';
            html += '<li><span class="nm">每天多赚<i>按当前营收口径估</i></span><span class="p">+' + fmt(Math.round(gain)) + '</span></li>';
            html += '<li><span class="nm">回本还差<i>' + (gain > 0 ? '已回的部分不再算' : '暂无收益') + '</i></span><span class="q">' + (gain > 0 ? Math.max(0, Math.ceil(spent / gain)) + ' 天' : '—') + '</span></li>';
            if (Array.isArray(data.revHist) && data.revHist.length) {
              html += '<li class="idk-sec">近七日营业额</li>';
              html += '<li><span class="nm">' + data.revHist.map(function (v) { return fmt(Math.round(v)); }).join(' · ') + '</span></li>';
            }
            el.statList.innerHTML = html;
          }
          function renderDream() {
            var st = regStats(), fame = fameNow(), tl = townLore(), dl = dreamLore();
            var out = [], out2 = [], i, x, cost, done, enough, row, sub;
            var ct = 0, cd = 0;
            for (i = 0; i < tl.length; i++) if (hasIn(data.town, tl[i].id)) ct++;
            for (i = 0; i < dl.length; i++) if (hasIn(data.dreams, dl[i].id)) cd++;
            if (el.fameEl) el.fameEl.textContent = '名望 ' + fame;
            if (el.regEl) el.regEl.textContent = '常客 ' + st.n + ' 位 · 知己 ' + st.conf + ' 位';
            /* v0.17：两组各自折叠，摘要常驻在 header 上，折起来也知道建了多少、圆了多少 */
            if (el.townGrp) el.townGrp.setAttribute('data-open', uiOpen('wish.town') ? '1' : '0');
            if (el.dreamGrp) el.dreamGrp.setAttribute('data-open', uiOpen('wish.dream') ? '1' : '0');
            if (el.sponsorGrp) el.sponsorGrp.setAttribute('data-open', uiOpen('wish.sponsor') ? '1' : '0');
            if (el.townSum) el.townSum.textContent = '已建 ' + ct + '/' + tl.length;
            if (el.dreamSum) el.dreamSum.textContent = '已了 ' + cd + '/' + dl.length;
            if (el.townGrp) { var ta = el.townGrp.querySelector('.ga'); if (ta) ta.textContent = uiOpen('wish.town') ? '▾' : '▸'; }
            if (el.dreamGrp) { var da = el.dreamGrp.querySelector('.ga'); if (da) da.textContent = uiOpen('wish.dream') ? '▾' : '▸'; }
            if (el.sponsorGrp) { var sa = el.sponsorGrp.querySelector('.ga'); if (sa) sa.textContent = uiOpen('wish.sponsor') ? '▾' : '▸'; }
            if (el.townList) el.townList.hidden = !uiOpen('wish.town');
            if (el.dreamList) el.dreamList.hidden = !uiOpen('wish.dream');
            if (el.sponsorList) el.sponsorList.hidden = !uiOpen('wish.sponsor');
            if (el.townList) {
              for (i = 0; i < tl.length; i++) {
                x = tl[i];
                cost = moneyOf(x.cost);
                done = hasIn(data.town, x.id);
                enough = (data.gold | 0) >= cost;
                var trid = riteIdOf('town', x.id);
                /* v0.16 §8：动工之后这一行报充能倒计时，不再是按钮 */
                if (done) row = '<span class="p">已建成</span>';
                else if (trid && riteTs(trid)) row = '<span class="idk-rite">充能 ' + riteClock(riteLeftNow(trid)) + '</span>';
                else if (townOpen(data, x.id)) {
                  row = '<button class="idk-buy" data-town="' + esc(x.id) + '"' + (enough ? '' : ' disabled') + '>' + fmt(cost) + '</button>';
                  if (!enough) row += '<span class="idk-short">差 ' + fmt(cost - (data.gold | 0)) + '</span>';
                } else row = '<span class="p">需先建上一项</span>';
                /* 说明那句在窄侧栏里放不下：独占第二行、一行省略号，全文挂 title（不叠字） */
                sub = done ? (x.afterLine || x.line || '') : (x.line || '');
                out.push('<li data-town="' + esc(x.id) + '"' + (done ? ' data-out="1"' : '') + '>' +
                  '<span class="nm">' + esc(x.title || x.id) + '</span>' +
                  '<i title="' + esc(sub) + '">' + esc(sub) + '</i>' +
                  '<span class="rt">' + row + '</span></li>');
              }
              if (!out.length) out.push('<li><span class="nm">这里还空着</span><i>（城建表还没补上）</i></li>');
              el.townList.innerHTML = out.join('');
            }
            if (el.dreamList) {
              for (i = 0; i < dl.length; i++) {
                x = dl[i];
                cost = moneyOf(x.cost);
                done = hasIn(data.dreams, x.id);
                enough = (data.gold | 0) >= cost;
                if (done) row = '<span class="p">已圆</span>';
                else {
                  /* v0.15：按钮上直接写价钱（原来写「帮他圆」，玩家还得在说明行里找多少钱） */
                  row = '<button class="idk-buy" data-dream="' + esc(x.id) + '" title="帮 ' + esc(x.who || '常客') + ' 圆这件事·' + cost + ' 铜"' + (enough ? '' : ' disabled') + '>' + fmt(cost) + '</button>';
                  if (!enough) row += '<span class="idk-short">差 ' + fmt(cost - (data.gold | 0)) + '</span>';
                }
                sub = '「' + (done ? (x.after || x.ask || '') : (x.ask || '')) + '」';
                out2.push('<li data-dream="' + esc(x.id) + '"' + (done ? ' data-out="1"' : '') + '>' +
                  '<span class="nm">' + esc(x.who || '常客') + ' · ' + esc(x.title || x.id) + '</span>' +
                  '<i title="' + esc(sub) + '">' + esc(sub) + '</i>' +
                  '<span class="rt">' + row + '</span></li>');
              }
              if (!out2.length) out2.push('<li><span class="nm">这里还空着</span><i>（心愿表还没补上）</i></li>');
              el.dreamList.innerHTML = out2.join('');
            }
            /* v0.25：冒险队 —— 按天扣钱的支出，换声望与偶发战利品。三行紧凑，故事放 title。 */
            if (el.sponsorList) {
              var spOn = sponsorActive(data), spCostNow = sponsorDaily(data), lvNow = data.tier | 0;
              var spOut = [];
              if (el.sponSum) el.sponSum.textContent = spOn.length
                ? ('每天 ' + fmt(spCostNow) + ' · 声望 +' + sponsorFame(data) + '/天')
                : '未资助';
              SPONSORS.forEach(function (sy) {
                var on = spOn.indexOf(sy) >= 0, lock = lvNow < sy.lv, tail;
                if (on) tail = '<button class="idk-buy" data-sp="' + sy.id + '" title="停掉就不用再花这笔钱了">停止</button>';
                else if (lock) tail = '<span class="p">需 Lv.' + sy.lv + '</span>';
                else {
                  tail = '<button class="idk-buy" data-sp="' + sy.id + '" title="每天 ' + sy.cost + ' 铜"' +
                    (data.gold >= sy.cost ? '' : ' disabled') + '>' + fmt(sy.cost) + '/天</button>';
                  if (data.gold < sy.cost) tail += '';
                }
                var sub = lock ? ('需 Lv.' + sy.lv + ' 才能请动')
                  : ('声望 +' + sy.fame + '/天 · 战利品 ' + fmt(sy.back[0]) + '–' + fmt(sy.back[1]) +
                     (sy.flow ? ' · 客流 +' + Math.round(sy.flow * 100) + '%' : ''));
                spOut.push('<li data-sp="' + sy.id + '"' + (on ? ' data-out="1"' : '') + ' title="' + esc(sy.desc) + '">' +
                  '<span class="nm">' + esc(sy.name) + '</span>' +
                  '<i title="' + esc(sub) + '">' + esc(sub) + '</i>' +
                  '<span class="rt">' + tail + '</span></li>');
              });
              el.sponsorList.innerHTML = spOut.join('');
            }
          }

          /* ---------- v0.17 成就页：50 条按魔法商人五段摊开（初级→星辉，各 10 条），只给文字，不给奖励 ---------- */
          function renderAch() {
            if (!el.achList) return;
            var achs = achLore(), got = (data.ach && typeof data.ach === 'object') ? data.ach : {};
            var out = [], ti, aj, ac, any, list, ngot;
            if (el.achH) el.achH.textContent = achCount() + '/' + achs.length;
            for (ti = 0; ti < ACH_TIERS.length; ti++) {
              var tier = ACH_TIERS[ti];
              list = achs.filter(function (a) { return achTierOf(a) === tier.key; });
              ngot = list.filter(function (a) { return !!got[a.id]; }).length;
              out.push(grpHead(tier.key, tier.name, '已达成 ' + ngot + '/' + list.length, 'idk-achgrp'));
              if (!uiOpen(tier.key)) continue;
              any = false;
              for (aj = 0; aj < list.length; aj++) {
                ac = list[aj];
                any = true;
                out.push('<li class="idk-ach" data-ach="' + (got[ac.id] ? 1 : 0) + '">' +
                  '<span class="mark">' + (got[ac.id] ? '✓' : '·') + '</span>' +
                  '<span class="nm">' + esc(ac.title || ac.id) + '</span>' +
                  (got[ac.id] && ac.line ? '<i title="' + esc(ac.line) + '">' + esc(ac.line) + '</i>' : '') + '</li>');
              }
              if (!any) out.push('<li class="idk-achh" data-empty="1">' + esc(tier.name) + '（还没有条目）</li>');
            }
            el.achList.innerHTML = out.join('');
          }

          /* ---------- v0.15 设置页：存档导出/导入 + 重头摆摊（原来都混在店铺页） ---------- */
          function renderSet() {
            if (!el.setList) return;
            if (el.verH) el.verH.textContent = VER;
            el.setList.innerHTML =
              '<li class="idk-sec">存档 <span class="p">换设备／清缓存前先导出一份</span></li>' +
              '<li><span class="nm">导出存档<i>复制那段 JSON 存到别处</i></span>' +
              '<button class="idk-buy" data-save="export">导出</button></li>' +
              '<li><span class="nm">导入存档<i>把备份粘进去，点确认覆盖这一档</i></span>' +
              '<button class="idk-buy" data-save="import">导入</button></li>' +
              /* v0.27：一行存档码 —— 复制走、粘回来，换设备不用开文件 */
              '<li><span class="nm">复制存档码<i>一串字，发给另一台设备粘进「导入」就能接着开</i></span>' +
              '<button class="idk-buy" data-save="code">复制</button></li>' +
              '<li class="idk-sec">提示</li>' +
              '<li><span class="nm">新手提示<i>' + (Number(data.tut) === -1
                ? '关着；想再看一遍就打开，从「先补货」重新走'
                : '开店头三步的那行字，走完一次就不再出现') + '</i></span>' +
              '<button class="idk-buy" data-tut="1">' + (Number(data.tut) === -1 ? '打开' : '关掉') + '</button></li>' +
              '<li class="idk-sec">重新开始</li>' +
              '<li><span class="nm">重头摆摊<i>' + (resetArm ? '再点一下就真清了：金币、天数、解锁全归零' : '清空账本，从街边地摊重新开始') + '</i></span>' +
              '<button class="idk-buy" data-reset="1"' + (resetArm ? ' style="color:#e07c7c;border-color:#7d3a44"' : '') + '>' +
              (resetArm ? '确定' : '重来') + '</button></li>';
          }

          /* ---------- v0.14 存档导出 / 导入：都在店铺页签里，不弹窗 ---------- */
          function saveMsg(text, bad) {
            if (!saveMsgEl) return;
            saveMsgEl.textContent = text || '';
            saveMsgEl.setAttribute('data-bad', bad ? '1' : '0');
          }
          /* v0.27 存档码：把整档压成一行 JSON 丢进剪贴板，换设备时粘进「导入」就行。
             浏览器不给剪贴板（file:// 或旧内核）就退回导出框，让玩家自己全选复制。 */
          function copySaveCode() {
            var code = JSON.stringify(buildSave(data));
            var okMsg = function () {
              saveMsg('存档码已复制（' + code.length + ' 字），粘到另一台设备的「导入」里即可。', false);
            };
            /* 老浏览器 / 内嵌 webview 有时不给 clipboard 权限：
               先走 execCommand 的隐藏 textarea 方案，两样都不行才展开存档让人手动全选。 */
            var legacyCopy = function () {
              try {
                var ta = document.createElement('textarea');
                ta.value = code;
                ta.setAttribute('readonly', '');
                ta.style.cssText = 'position:fixed;left:-9999px;top:0;opacity:0';
                document.body.appendChild(ta);
                ta.select();
                ta.setSelectionRange(0, code.length);
                var done = document.execCommand && document.execCommand('copy');
                document.body.removeChild(ta);
                return !!done;
              } catch (e) { return false; }
            };
            var fallback = function () {
              if (legacyCopy()) { okMsg(); return; }
              saveMsg('这个浏览器不让直接写剪贴板，已经展开存档，手动全选复制即可。', true);
              openSaveBox('export');
            };
            try {
              if (navigator.clipboard && navigator.clipboard.writeText) {
                navigator.clipboard.writeText(code).then(okMsg, fallback);
                return true;
              }
            } catch (e) {}
            fallback();
            return true;
          }
          function openSaveBox(mode) {
            if (!saveBoxEl) return;
            saveBoxEl.hidden = false;
            saveMode = (mode === 'import') ? 'import' : 'export';
            if (saveTa) {
              saveTa.value = saveMode === 'export' ? JSON.stringify(buildSave(data), null, 2) : '';
              saveTa.readOnly = saveMode === 'export';
              try { saveTa.focus(); if (saveMode === 'export') saveTa.select(); } catch (e) {}
            }
            if (saveApplyBtn) saveApplyBtn.hidden = saveMode !== 'import';
            saveMsg(saveMode === 'export'
              ? '复制这一段存到别处（记事本、聊天窗口都行）。'
              : '把导出那段粘进来，再点「确认导入」。', false);
          }
          function applyImport() {
            var res = importSave(saveTa ? saveTa.value : ''), p, k;
            if (!res.ok) { saveMsg(res.reason, true); return false; }
            p = res.save;
            for (k in data) if (data.hasOwnProperty(k)) delete data[k];
            for (k in p) {
              if (!p.hasOwnProperty(k)) continue;
              if (k === 'app' || k === 'ver' || k === 'at') continue;
              data[k] = p[k];
            }
            data.dayStart = Date.now();
            /* 导入的档可能缺界面字段（tab/宽/位置）：补回默认值，别让卡片消失或切到空页签 */
            if (data.tab == null) data.tab = 'stat';   /* v0.23：经营排第一栏，副驾默认落在这里 */
            if (data.w == null) data.w = 268;
            if (data.wb == null) data.wb = 640;
            normalizeLoaded();
            syncSlots();
            applyDecor();
            renderLog(); renderShop(); renderDream(); renderAch(); renderSet(); updateLockHint();
            paint();
            persist();
            saveMsg('导入成功：第 ' + (data.day | 0) + ' 天。', false);
            checkAchievements();
            return true;
          }

          /* ---------- v0.14 打烊独白：一天最多一句（data.closeSaidDay），缺 lore 就静默 ---------- */
          function closeMonologue() {
            if ((data.day | 0) === (Number(data.closeSaidDay) || 0)) return false;
            if (isOpen(nowHour())) return false;
            var line = closeLore(Math.random);
            data.closeSaidDay = data.day | 0;
            if (!line) return false;
            showLine(line, 5200);
            return true;
          }

          /* v0.27 新手三步：只走一次，不弹窗，不拦操作。0 未开始 / 1 先补货 / 2 等第一位客人 / 3 等第一次打烊 / 9 走完 / -1 关了 */
          var TUT_LINES = {
            1: '先补一排货：点右下角「补货」，或点货架上的空位。',
            2: '现在等第一位客人：开着店，客人自己会推门进来。',
            3: '今天就这么过：打烊后看两行小结，明天再来。'
          };
          function tutStage() {
            var t = Number(data.tut);
            if (!(t > 0) || t === 9) return 0;
            if (t >= 3) return 3;
            return t;
          }
          function updateLockHint() {
            if (!el.lockHint) return;
            if (card.getAttribute('data-collapsed') === '1') { el.lockHint.hidden = true; el.lockHint.textContent = ''; el.lockHint.title = ''; return; }
            if (card.classList.contains('is-big') && tutStage() === 0) { el.lockHint.hidden = true; el.lockHint.textContent = ''; el.lockHint.title = ''; return; }
            function putHint(text) {
              var line = text || '';
              if (!line) { el.lockHint.hidden = true; el.lockHint.textContent = ''; el.lockHint.title = ''; return; }
              el.lockHint.hidden = false;
              /* v0.18：两行提示（打烊小结）用 <br> 断行；CSS 那边限两行，长句照样截断 */
              if (line.indexOf('\n') >= 0) {
                el.lockHint.innerHTML = line.split('\n').map(function (s) { return esc(s); }).join('<br>');
              } else {
                el.lockHint.textContent = line;
              }
              el.lockHint.title = line.replace(/\n/g, ' ');
            }
            /* v0.12.3：打烊时段（00:00–07:00）说「今天赚了多少 + 明天什么天气」。
               v0.19（用户要求）：营业时段这行一律不出现——小窗本来就窄，白天只说「等客」，
               把「下一步买什么」的引导收进店铺页，不再常驻占一行。
               v0.27：新手三步走的时候，这行优先显示当前那一步（白天也说）。 */
            var tst = tutStage();
            if (tst > 0) { putHint('📖 ' + TUT_LINES[tst]); return; }
            if (!isOpen(nowHour())) {
              var netDay = Math.round((Number(data.gold) || 0) - (Number(data.goldDay0) || 0));
              putHint(closeHint(netDay, data.weatherNext || data.weather, (data.day | 0) + 1));
              return;
            }
            putHint('');
          }

          function paint() {
            /* v0.14：先结算成就再画 —— 刚解锁的流水要出现在这一帧里（每项只触发一次） */
            checkAchievements();
            /* v0.13：里程碑条件一到就记一笔（每项只触发一次，lore.js 没接上时是空循环） */
            checkMilestones();
            /* v0.14：打烊独白 —— 一天最多一句，只在守夜/等客时借店主的嘴说，不抢客人台词 */
            if (state === 'doze' || state === 'wait') closeMonologue();
            var total = stockTotal(data.stock);
            var cap = shelf().length * maxStock();
            el.gas.innerHTML = coinIcon(topUnit(data.gold), 13) + '<span>' + fmt(data.gold) + '</span>';
            el.gas.title = Math.round(data.gold) + ' 铜';
            el.sold.textContent = data.sold;
            el.day.textContent = data.day;
            el.bar.style.width = (cap ? Math.max(2, Math.round(total / cap * 100)) : 0) + '%';
            el.stat.textContent = LABEL[state] || '';
            if (el.tierEl) el.tierEl.textContent = 'Lv.' + (data.tier | 0) + ' ' + (tierDef().short || tierDef().name);
            /* v0.11 脚注：第几代店主 + 这一代带走的传家宝 */
            if (el.genEl) {
              var gen = Math.max(1, data.generation | 0);
              var bo = boonById(data.boon);
              el.genEl.hidden = false;
              el.genEl.textContent = '第 ' + gen + ' 代' + (bo ? ' · ' + bo.note : '');
              el.genEl.title = '这间店传到第 ' + gen + ' 代' + (bo ? '，这一代带着「' + bo.name + '」' : '');
            }
            if (el.hungerEl) {
              el.hungerEl.textContent = '🍞' + Math.round(data.hunger) + ' ⚡' + Math.round(data.energy);
              el.hungerEl.style.color = data.starve ? '#e08d78' : (data.hunger < 35 ? '#e0b45c' : '');
            }
            if (el.net) {
              var net = Math.round(data.gold - (Number(data.goldDay0) || 0));
              el.net.textContent = (net < 0 ? '今日 −' : '今日 +') + fmtShort(net);
              el.net.title = '今天净赚（含开店买东西花掉的；负数是今天花超了）';
              el.net.style.color = net < 0 ? '#e08d78' : '#8fd39a';
            }
            if (el.debtEl) {
              if (data.debt > 0) {
                el.debtEl.hidden = false;
                /* v0.8.3：改成「待补」，说明它会在下次日结自动补缴，不是"有钱不还" */
                el.debtEl.textContent = '待补 ' + fmt(data.debt);
                el.debtEl.title = '上次没付清的房租，下次日结会先从钱袋里补缴';
              } else { el.debtEl.hidden = true; el.debtEl.textContent = ''; el.debtEl.title = ''; }
            }
            if (scene) { scene.setGold(data.gold); scene.setStock(data.stock); }
            applyWeather();
            applyFestival();
            updateLockHint();
            renderStock();
            /* v0.27（挂机优化）：只重画当前那一页。原来每次成交都把店铺/心愿/经营三页的
               列表整个重建成字符串，大窗开着挂一整天，等于每秒替三份看不见的清单做排版。 */
            var tabNow = data.tab || 'shop';
            if (tabNow === 'shop') renderShop();
            if (tabNow === 'dream') { if (el.dreamList || el.townList || el.sponsorList) renderDream(); }
            if (tabNow === 'stat') { if (el.statList) renderStat(); }
          }

          function setState(name, instant) {
            state = name;
            if (scene) scene.setState(name, instant);
            el.stat.textContent = LABEL[name] || '';
          }

          /* v0.9：收起 = 一条迷你条（标题 + 钱袋/单数/天数），不是只剩个标题栏。
             以前 stage/side/foot 全藏、lockhint 还留着，看起来就像卡片坏了（用户报过）。 */
          function collapse(on) {
            if (on && card.classList.contains('is-big')) { data.bigBefore = true; setBig(false); }
            card.setAttribute('data-collapsed', on ? '1' : '0');
            el.stage.style.display = on ? 'none' : '';
            el.side.style.display = on ? 'none' : '';
            el.foot.style.display = '';
            el.min.textContent = on ? '▣' : '–';
            el.min.title = on ? '展开商店' : '收起成迷你条';
            if (on) el.bubble.setAttribute('data-on', '0');
            /* 收起前是大窗的，展开时还回大窗 —— 否则点一下“展开”反而缩成小卡 */
            if (!on && data.bigBefore) { data.bigBefore = false; setBig(true); }
            updateLockHint();
            keepInView();
          }

          /* v0.6：关掉卡片后，月亮钉死在内置浏览器视口右下角（position:fixed），不再跟着卡片走、也不能拖动。
             v0.12.6：用户要的是「只要 DSH 开着，店就一直在营业」——收起只是不画画面，
             心跳、事件链、结账统统照跑；真的停下来只发生在关掉 DSH（进程没了由 boot 补算）或窗口被藏起来。 */
          var offAt = 0;
          function setOff(on) {
            on = !!on;
            off = on;
            data.off = on;
            /* paused 只管「窗口在不在前台」；收起不再等于暂停逻辑 */
            paused = !!document.hidden && !FORCE_PLAY;
            if (on) {
              /* 只记卡片位置，方便下次开回来 */
              data.x = parseInt(card.style.left, 10) || data.x;
              data.y = parseInt(card.style.top, 10) || data.y;
              card.style.display = 'none';
              badge.style.left = '';
              badge.style.top = '';
              badge.style.right = '';
              badge.style.bottom = '';
              badge.setAttribute('data-on', '1');
              badge.setAttribute('data-flash', '1');
              setTimeout(function () { badge.removeAttribute('data-flash'); }, 900);
              stopRaf();                     /* 不画了；但底下照常营业 */
              startLoop();                   /* 保住 30 秒心跳（链条是 setTimeout，本来就活着） */
              offAt = Date.now();
            } else {
              badge.setAttribute('data-on', '0');
              card.style.display = '';
              lastFrame = 0;
              keepInView();
              paint();
              offAt = 0;                     /* 收起期间一直在跑，不需要补算 */
              startLoop();
              if (!busy && !data.rest && !data.starve) startNow();
            }
            persist();
          }

          /* 宽度：小卡用 data.w，大窗用 data.wb，都能拖 */
          function maxW() { return Math.min(760, Math.max(240, window.innerWidth - 28)); }
          function layout() {
            var w = parseFloat(card.style.width) || (data.w || 268);
            var big = card.classList.contains('is-big');
            var sw = big ? Math.round(w * 0.58) : w;
            var h = Math.round(sw * 0.625);
            el.stage.style.height = h + 'px';
            el.side.style.maxHeight = big ? Math.round(h) + 'px' : '';
          }
          function applyWidth() {
            var w = card.classList.contains('is-big') ? (data.wb || 640) : (data.w || 268);
            w = Math.max(card.classList.contains('is-big') ? 470 : 220, Math.min(maxW(), w));
            card.style.width = w + 'px';
            if (card.classList.contains('is-big')) data.wb = w; else data.w = w;
            layout();
          }

          function setBig(on) {
            card.classList.toggle('is-big', !!on);
            el.exp.textContent = on ? '⤡' : '⤢';
            if (on && (!data.wb || data.wb < 470)) data.wb = Math.min(640, maxW());
            applyWidth();
            renderLog(); renderStock(); renderShop(); updateLockHint();
            var tp = /[?&]tab=(stock|shop|dream|ach|set)/.exec(location.search);
            setTab(tp ? tp[1] : (data.tab || 'stat'));
            /* 立刻摆一次（class 和 width 都已同步生效，getBoundingClientRect 会强制回流拿到新尺寸），
               再等一帧摆一次兜住字体/折行导致的细微高度变化。
               v0.10：只在 rAF 里摆是不够的 —— 标签页在后台时 rAF 被暂停，展开后的卡片会直接顶出右边界。 */
            if (on) { keepInView(); syncSide(); }
            requestAnimationFrame(function () {
              if (on) { keepInView(); syncSide(); }
              /* 尺寸定下来之后再对齐一次行高，避免展开瞬间算出半行 */
              snapRows(el.stockList); snapRows(el.unlockList);
            });
            persist();
          }

          /* 右侧栏高度对齐场景高度，避免场景下面出现空白 */
          function syncSide() { layout(); }

          function keepInView() {
            var r = card.getBoundingClientRect();
            var x = Math.min(parseInt(card.style.left, 10) || 0, Math.max(8, window.innerWidth - r.width - 8));
            var y = Math.min(parseInt(card.style.top, 10) || 0, Math.max(8, window.innerHeight - r.height - 8));
            card.style.right = 'auto';
            card.style.bottom = 'auto';
            card.style.left = Math.max(8, x) + 'px';
            card.style.top = Math.max(8, y) + 'px';
          }

          function restockCost() {
            return Math.max(6, Math.round(shelf().reduce(function (a, it) { return a + it.price; }, 0) * 0.35 * giftStock()));
          }

          /* 补货：按件买，先补便宜的；一件都买不起时后屋翻出一件旧货，避免店停摆 */
          function unitCost(it) { return Math.max(2, Math.round(it.price * 0.28)); }

          function doRestock() {
            setState('restock');
            showLine(pick(LINES.restock));
            after(TIMING.restock, function () {
              var sorted = shelf().slice().sort(function (a, b) { return a.price - b.price; });
              var filled = 0, spent = 0, i, guard = 0;
              while (guard++ < 90) {
                var target = null;
                for (i = 0; i < sorted.length; i++) {
                  if ((data.stock[sorted[i].k] || 0) >= maxStock()) continue;
                  if ((data.fresh[sorted[i].k] | 0) === (data.day | 0)) continue;  /* 当天新解锁的货只卖 1 件 */
                  target = sorted[i]; break;
                }
                if (!target) break;
                var u = unitCost(target);
                if (data.gold < u) break;
                data.gold -= u; data.stock[target.k] = (data.stock[target.k] || 0) + 1;
                spent += u; filled++;
              }
              /* v0.16：禁忌货走「后屋」，补货规矩和小卡一致，只是不进 3 格陈列 */
              var br = separateStock(), bi, guard2 = 0;
              while (guard2++ < 90) {
                var bt = null;
                for (bi = 0; bi < br.length; bi++) {
                  if ((data.stock[br[bi].k] || 0) >= maxStock()) continue;
                  if ((data.fresh[br[bi].k] | 0) === (data.day | 0)) continue;
                  bt = br[bi]; break;
                }
                if (!bt) break;
                var bu = unitCost(bt);
                if (data.gold < bu) break;
                data.gold -= bu; data.stock[bt.k] = (data.stock[bt.k] || 0) + 1;
                spent += bu; filled++;
              }
              if (spent > 0) data.restockToday = (Number(data.restockToday) || 0) + spent;   /* v0.24 经营页：今日进货支出 */
              if (spent > 0 && Number(data.tut) === 1) data.tut = 2;   /* v0.27 新手第一步：补到货了，去等客人 */
              if (filled > 0) {
                addLog('去后屋补了 ' + filled + ' 件 −' + fmt(spent), 'ev');
                paint();
              } else if (stockTotal(data.stock) <= 0) {
                var low = null;
                for (i = 0; i < sorted.length; i++) {
                  if ((data.fresh[sorted[i].k] | 0) !== (data.day | 0)) { low = sorted[i]; break; }
                }
                if (low) {
                  data.stock[low.k] = 1;
                  addLog('钱不够，后屋翻出一件' + low.name, 'bad');
                  paint();
                }
              }
              setState('wait'); paint(); schedule();
            });
          }

          function doCount() {
            setState('count');
            showLine(pick(LINES.count));
            if (scene) scene.event('coin', 1600);
            after(TIMING.count, function () { setState('wait'); schedule(); });
          }

          function doIdle(act) {
            setState(act);
            /* v0.12.1：守夜只发生在打烊时段（decide 的 !isOpen 分支），文案跟着新区间改成 24:00–07:00 */
            if (act === 'doze') showLine('打烊了（24:00–07:00）。' + pick(LINES.doze), 2600);
            else if (act === 'away') showLine(pick(LINES.away), 2400);
            after(rand(8, 16), function () {
              setState(act === 'away' ? 'doze' : 'wait');
              schedule();
            });
          }

          /* v0.8：顾客 = 已解锁的 6 类，按权重抽（村民权重随解锁数衰减，新客源才进得来）。
             v0.16：灵体客要「传承过 + 夜深」才进池子 —— 白天抽不到它，抽到了也没有禁忌货可卖。 */
          function unlockedCusts() {
            return CUSTS.filter(function (c) {
              if (c.gen && !(data.gen | 0)) return false;
              if (c.night && !isNight(nowHour())) return false;
              if (c.mkt && !mktOpen()) return false;     /* v0.27 星砂客只在集市开市那两天进池 */
              return c.id === 'villager' || c.mkt || !!data.cust[c.id];
            });
          }
          function pickCustomer() {
            var pool = unlockedCusts(), total = 0, i;
            for (i = 0; i < pool.length; i++) total += custWeightOf(pool[i], pool.length);
            var r = Math.random() * total;
            for (i = 0; i < pool.length; i++) {
              r -= custWeightOf(pool[i], pool.length);
              if (r <= 0) return pool[i];
            }
            return pool[0];
          }
          /* 卖出一件：客单价倍率在这里落地（pos：伙食中档 ×1.08 已在 priceOf 里） */
          function sellTo(c, it) {
            var paid = Math.round(priceOf(it) * c.mult);
            data.stock[it.k] = Math.max(0, (data.stock[it.k] || 0) - 1);
            syncSlots();                      /* 卖空后自动补位：后仓还有同款就留在格上，没有就换下一件 */
            data.gold += paid;
            data.revToday += paid;
            data.sold += 1;
            data.custToday = (Number(data.custToday) || 0) + 1;   /* v0.22 经营页：今日成交客数 */
            if (Number(data.tut) === 2) data.tut = 3;             /* v0.27 新手第二步：第一位客人成交了 */
            data.nSold = (Number(data.nSold) || 0) + 1;      /* v0.13 里程碑：累计卖出件数 */
            data.nOrders = (Number(data.nOrders) || 0) + 1;  /* v0.13 里程碑：累计成交单数 */
            data.nGold = (Number(data.nGold) || 0) + paid;   /* v0.13 里程碑：累计赚到（铜） */
            if ((Number(it.price) || 0) > (Number(data.bestPrice) || 0)) {
              data.bestPrice = it.price;                     /* v0.13 通关小结：最贵的一件 */
              data.bestItem = it.name;
            }
            /* v0.14：夜里成交记一笔（night_shift），成交本身就是成就检查点之一 */
            if (isNight(nowHour())) data.nightSeen = (Number(data.nightSeen) || 0) + 1;
            /* v0.16：灵体客成交单独记（ghost_10） */
            if (c.kind === 'ghost') data.nGhost = (Number(data.nGhost) || 0) + 1;
            checkAchievements();
            return paid;
          }

          /* ============ v0.11 常客（故事） ============
             常客不是新客源：不额外进客流权重、不动任何经济数值，只是「有名有姓的那位」。
             队列 data.regToday 由 settleDay 每天排好（每位每 2 个游戏日来一次、一天最多 2 位）；
             普通顾客上门时有约 2/3 的几率先让排队里的常客进来。
             买不到偏好货：只说一句失望台词、空手走人 —— 不扣分、不入 rest、不停业、不改日程。
             熟客（第 3 次买成起）留一笔小额小费，当场写进流水。 */
          function regRec(id) {
            if (!data.regs || typeof data.regs !== 'object') data.regs = {};
            var r = data.regs[id];
            if (!r || typeof r !== 'object') { r = { n: 0, d: 0, tip: 0 }; data.regs[id] = r; }
            return r;
          }
          /* v0.13：常客名册从 12 位扩到 30 位，ids 也换了。旧档里那 12 位（v_martha…）的熟客次数
             按「第几套模板」搬到新名册的对应那位（reg_0 / reg_12 / reg_24 共用一套模板），
             只搬一次（data.regMig），搬完把旧键删掉，免得 regs 越存越脏。 */
          function migrateRegs() {
            if (!data.regs || typeof data.regs !== 'object' || data.regMig) return 0;
            var OLD = ['v_martha', 'v_holm', 'm_gerda', 'm_tovar', 'r_silk', 'r_nine',
              'g_aldric', 'g_miren', 'n_lavinia', 'n_cassius', 'o_thessa', 'o_sable'];
            var list = regList(), moved = 0, i, old, nid, cur;
            for (i = 0; i < OLD.length; i++) {
              old = data.regs[OLD[i]];
              if (!old || typeof old !== 'object') { delete data.regs[OLD[i]]; continue; }
              nid = list[i] ? list[i].id : '';
              if (!nid) continue;
              cur = data.regs[nid];
              if (!cur || typeof cur !== 'object') cur = data.regs[nid] = { n: 0, d: 0, tip: 0 };
              cur.n = Math.max(Number(cur.n) || 0, Number(old.n) || 0);
              cur.d = Math.max(Number(cur.d) || 0, Number(old.d) || 0);
              cur.tip = Math.max(Number(cur.tip) || 0, Number(old.tip) || 0);
              delete data.regs[OLD[i]];
              moved += 1;
            }
            data.regMig = 1;
            return moved;
          }
          function nextRegular() {
            var q = data.regToday;
            if (!q || typeof q.shift !== 'function' || !q.length) return null;
            if (Math.random() > 0.65) return null;       /* 大多数时候还是生客，熟客别霸占整条队 */
            var id = String(q[0]);
            q.shift();
            var r = regularById(id);
            if (!r) return null;
            if (r.kind !== 'villager' && !data.cust[r.kind]) return null;   /* 客源还没解锁：这次不来了 */
            return r;
          }
          /* v0.11：常客也只看陈列位——台上没有他想要的，就扑空（严格偏好，不兜底） */
          function pickRegularItem(reg) {
            syncSlots();
            return pickFromSlotsPref(data.slots, shelf(), data.stock, reg.pref);
          }
          function serveRegular(reg) {
            var c = custById(reg.kind) || custById('villager');
            /* 不管买没买成，「今天来过」当场记下 —— 否则一直扑空的那位会天天堵在队里 */
            regRec(reg.id).d = data.day | 0;
            var myCust = showCustomer(reg.kind);
            setState('serve');
            /* v0.14 常客四级：等级只看数据里的熟客次数，跟天数无关
               （0 Stranger 生面孔 / 1–4 Regular 熟客 / 5–11 Friend 朋友 / >=12 Confidant 知己） */
            var seen = (Number(regRec(reg.id).n) || 0) + 1;
            var nRec = (Number(regRec(reg.id).n) || 0);
            /* 到「朋友」之后，他心里那件事会先于寒暄说出来：每条愿望只求一次（data.wishAsked），
               已经圆过就再也不提 —— 气泡上点一下可以跳到心愿页去办。 */
            var wish = nRec >= 5 ? dreamFor(reg.name) : '';
            if (wish) {
              if (!data.wishAsked || typeof data.wishAsked !== 'object') data.wishAsked = {};
              data.wishAsked[wish.id] = 1;
              wishFor = wish.id;
              showLine(regLevelName(nRec) + ' · 「' + (wish.ask || wish.title || '') + '」', 5200);
            } else {
              wishFor = '';
              /* v0.13 长线：第 3/6/10 次（档位读 lore.REG_STORY_AT）先说那一段心事，
                 其余场次仍是熟客口头禅 / 模板招呼语 —— 三级降级，缺哪个退哪个 */
              showLine((nRec > 0 ? regLevelName(nRec) + ' · ' : '') +
                (regStory(reg.name, seen) || (seen >= REG_QUIP_AFTER ? regQuip(reg.name) : '') || reg.line), 4200);
            }
            var tm = effectDef().tm;
            after(TIMING.serve * tm, function () {
              var it = pickRegularItem(reg);
              if (!it) {
                showLine(reg.miss, 3600);
                /* 扑空也记流水，但一天最多记一条：50 条「空手走了」会把账本冲没 */
                if ((data.regMissDay | 0) !== (data.day | 0)) {
                  data.regMissDay = data.day | 0;
                  addLog(reg.name + '没找到想要的，空手走了', 'ev');
                }
                paint();
                after(TIMING.leave, function () {
                  hideCustomer(1.2, myCust);      /* v0.11：成交后先站够 1.2 秒，再由场景演退场 */
                  setState('wait'); schedule();
                });
                return;
              }
              setState('tally');
              showLine(pick(LINES.tally));
              after(TIMING.tally * tm, function () {
                var want = 1 + (Math.random() < 0.4 ? 1 : 0), got = 0, gain = 0, names = [], cur = it;
                while (got < want && cur && (data.stock[cur.k] || 0) > 0) {
                  gain += sellTo(c, cur);
                  names.push(cur.name);
                  got += 1;
                  cur = pickRegularItem(reg);
                }
                var rec = regRec(reg.id);
                rec.n = (Number(rec.n) || 0) + 1;
                rec.d = data.day | 0;
                /* v0.14：第 20 次成交额外那句「老交情」（成就 reg_20 由 achCtx 判定，paint 里结算） */
                var oldFriend = rec.n >= 20;
                if (oldFriend) addLog(reg.name + '：' + regLevelName(rec.n), 'ev');
                var tip = regularTip(gain, rec.n);
                if (tip > 0) {
                  data.gold += tip;
                  data.revToday += tip;
                  rec.tip = (Number(rec.tip) || 0) + tip;
                  addLog('熟客' + reg.name + '留下 ' + fmt(tip) + ' 小费', 'sale');
                }
                if (gain > 0) {
                  if (scene) scene.event('coin', 1500);
                  flash(1000);
                  addLog(reg.name + '买了' + names.join('、') + ' +' + fmt(gain), 'sale');
                }
                showLine(rec.n === 20 ? '认识你这么些年了，这声谢不能省。'
                  : (wish ? '那件事，你要是能帮就帮一把。'
                    : (tip > 0 ? '拿着，多的不用找了。' : (got > 1 ? '还是老样子，多拿一件。' : '谢谢。'))));
                wishFor = '';
                paint();
                after(TIMING.leave, function () {
                  hideCustomer(1.2, myCust);      /* v0.11：成交后先站够 1.2 秒，再由场景演退场 */
                  setState('wait'); schedule();
                });
              });
            });
          }

          function doCustomer() {
            /* v0.11.1：营业中已经有客人在柜台前，就不要再拉一位进来。
               实测 5 个种子下客流是单链的 2–4 倍（峰值 42 笔/分 vs 单链 ~3 笔/分），
               说明仍有并行链在抢客人；这一道"同一时刻只服务一位"是收入侧最直接的闸门。 */
            if (serving) return;
            var reg = nextRegular();
            if (reg) { serveRegular(reg); return; }
            serving = true;
            var cust = pickCustomer();
            var myCust = showCustomer(cust.kind);
            setState('serve');
            /* v0.13 三态之一：进门招呼（CUST_ENTER）；没有 lore 就退回原来那句 */
            showLine(custSay(cust.kind, 'CUST_ENTER') || (cust.id === 'villager' ? pick(LINES.serve) : cust.name + '进店了。'));
            var tm = effectDef().tm;        /* 高档伙食把接待动作也压短；按这顿实际吃到的档，付中档钱就按中档算 */
            after(TIMING.serve * tm, function () {
              syncSlots();     /* 后仓可能刚被补过货：先把 3 格对齐再挑 */
              /* v0.16 §6.2：灵体客只从「后屋」拿禁忌货 —— 那批货不上货架，走 pickForbidden() */
              var pickFn = cust.forbidden
                ? function () { return pickForbidden(); }
                : function () { return pickFromSlots(data.slots, shelf(), data.stock, cust.kind); };
              var it = pickFn();
              if (!it) {
                /* v0.13 三态之三：空手走（CUST_EMPTY），不埋怨店主 */
                var bye0 = custSay(cust.kind, 'CUST_EMPTY');
                if (bye0) showLine(bye0);
                addLog(cust.name + '想买东西，货架空着', 'bad');
                setState('wait');
                if (scene) scene.setCustomer(false);
                serving = false;
                schedule();
                return;
              }
              setState('tally');
              /* v0.13 三态之二：上手看货（CUST_BROWSE），成交前那几秒说一句 */
              showLine(custSay(cust.kind, 'CUST_BROWSE') || pick(LINES.tally));
              after(TIMING.tally * tm, function () {
                if ((data.stock[it.k] || 0) <= 0) {
                  showLine(custSay(cust.kind, 'CUST_EMPTY') || '刚卖完了，抱歉。');
                  addLog(cust.name + '要' + it.name + '，没货', 'bad');
                } else {
                  /* bulk：1.5 件 = 一半机会买两件；同一单里每件都按顾客倍率结算 */
                  var want = Math.floor(cust.bulk) + (Math.random() < cust.bulk - Math.floor(cust.bulk) ? 1 : 0);
                  var got = 0, gain = 0, names = [], cur = it;
                  while (got < want && cur && (data.stock[cur.k] || 0) > 0) {
                    gain += sellTo(cust, cur);
                    names.push(cur.name);
                    got += 1;
                    cur = pickFn();
                  }
                  if (scene) scene.event('coin', 1500);
                  flash(1000);
                  addLog(cust.name + '买了' + names.join('、') + ' +' + fmt(gain), 'sale');
                  /* v0.13：成交后按客种说一句（lore.js 的 CUST_LINES）；没有就退回原来那两句 */
                  var said = custLine(cust.kind);
                  showLine(said || (got > 1 ? '一口气买了 ' + got + ' 件。' : '谢谢惠顾。'));
                }
                paint();
                after(TIMING.leave, function () {
                  hideCustomer(1.2, myCust);      /* v0.11：成交后先站够 1.2 秒，再由场景演退场 */
                  serving = false;
                  setState('wait'); schedule();
                });
              });
            });
          }

          function doCaravan() {
            setState('serve');
            showLine('商队来了，全要了。', 5000);
            showCustomer('knight');
            after(1.6, function () {
              var n = 0, gain = 0;
              shelf().forEach(function (x) {
                if (n >= 3) return;
                if ((data.stock[x.k] || 0) > 0) { data.stock[x.k] -= 1; gain += x.price; n++; }
              });
              if (!n) { addLog('商队来了，货架空着', 'bad'); }
              else {
                data.gold += gain; data.sold += n;
                data.nSold = (Number(data.nSold) || 0) + n;     /* v0.13 里程碑：商队按件数累计 */
                data.nGold = (Number(data.nGold) || 0) + gain;  /* v0.13 里程碑：累计赚到 */
                data.revToday += gain;
                flash(1600);
                if (scene) scene.event('coin', 2400);
                addLog('商队包了 ' + n + ' 件 +' + fmt(gain), 'ev');
              }
              paint();
              after(1.8, function () {
                if (scene) scene.setCustomer(false);
                setState('wait'); schedule();
              });
            });
          }

          function doThief() {
            /* 解锁「盗贼」客源之后，夜里来的就不再是生面孔：先踩点，再谈批发。数值一律不动。 */
            var known = !!data.cust.rogue;
            setState('serve');
            showLine(known ? '门口那个熟脸……又来了。' : '喂——站住！', 3600);
            showCustomer(known ? 'rogue' : 'thief');
            after(1.4, function () {
              var it = pickItem(shelf(), data.stock, 'thief');
              /* 店猫：得手率 0.55 → 0.30；v0.18 猫粮再往下压，最低 0.12（再低就没戏了） */
              var hit = Math.max(0.12, (data.upgrades.cat ? 0.30 : 0.55) - catThiefCut(data));
              if (it && Math.random() < hit) {
                data.stock[it.k] = Math.max(0, (data.stock[it.k] || 0) - 1);
                addLog((known ? '熟脸顺手牵走' : '小贼顺走了') + it.name, 'bad');
                showLine(known ? '他还冲我笑了笑。' : '该死，被摸了。', 3000);
              } else {
                addLog(known ? '熟脸转了一圈，空手走了' : '小贼没得手，跑了', 'ev');
                showLine(known ? '这回没伸手。' : '算他跑得快。', 2600);
              }
              paint();
              after(1.4, function () {
                if (scene) scene.setCustomer(false);
                setState('wait'); schedule();
              });
            });
          }

          /* ============ v0.13 随机事件：流浪商人 / 街头艺人 ============
             两者都挂在现有的事件链上（schedule() 的 nextEventAt 分支），不新增循环、不加 DOM：
             商人 8%、艺人 10%，剩下仍是商队/小贼（沿用 70/30）。
             商人靠「气泡临时可点」成交（8 秒不点 = 自动拒绝），艺人只在 rushFactor() 里乘一次 1.25。 */
          var MERCHANT_P = 0.08;        /* 事件档里出商人的概率 */
          var BUSKER_P = 0.10;          /* 事件档里出艺人的概率 */
          var MERCHANT_WAIT = 8000;     /* 8 秒不选 = 自动拒绝 */
          var BUSKER_HOURS = 3;         /* 接下来 3 个游戏小时 */
          var offer = null;             /* 当前摆着的报价 {k, name, price} */
          var offerResolve = null;      /* 点气泡成交时调用（null = 没有报价） */

          function gameHourAbs() { return (Number(data.day) || 1) * 24 + nowHour(); }
          function buskerLeft() {
            var left = (Number(data.buskerUntil) || 0) - gameHourAbs();
            return left > 0 ? left : 0;
          }
          function clearEvents() {
            offer = null; offerResolve = null;
            data.buskerUntil = 0;
            if (el.bubble) el.bubble.setAttribute('data-offer', '0');
          }

          /* 只从「已解锁」的货里挑一件；价 = 售价的 60–80%，取整到 5 铜 */
          function merchantPick() {
            var pool = items.filter(function (it) { return isUnlocked(it.k) && (it.price | 0) > 0; });
            if (!pool.length) return null;
            var it = pool[Math.floor(Math.random() * pool.length)];
            var price = Math.max(5, Math.round(it.price * (0.6 + Math.random() * 0.2) / 5) * 5);
            return { k: it.k, name: it.name, price: price };
          }

          function doMerchant() {
            var o = merchantPick();
            if (!o) { doIdle('wait'); return; }        /* 一件货都没解锁：不摆这个摊，链条照常走 */
            setState('serve');
            showCustomer('default');
            offer = o;
            var done = false;
            /* v0.13：先让 lore 里的街面台词说一句（1.8 秒），再把可点的报价挂上来 ——
               报价气泡本身要带价格与货名、还得能点，所以不拿台词顶掉它。 */
            var flavor = eventLine('peddler');
            var armOffer = function () {
              if (done || !offerResolve) return;       /* 台词期间被 restart/转生 收走了就不再挂 */
              el.bubble.setAttribute('data-offer', '1');
              showLine('流浪商人：' + fmt(o.price) + ' 换「' + o.name + '」？点我成交', MERCHANT_WAIT);
              after(MERCHANT_WAIT / 1000, function () { if (offerResolve) offerResolve(false); });
            };
            offerResolve = function (took) {
              if (done) return;
              done = true;
              offer = null; offerResolve = null;
              el.bubble.setAttribute('data-offer', '0');
              if (took) {
                data.gold -= o.price;
                data.stock[o.k] = (data.stock[o.k] || 0) + 1;
                addLog('流浪商人：' + fmt(o.price) + ' 换到「' + o.name + '」', 'ev');
                data.nWanderer = (Number(data.nWanderer) || 0) + 1;   /* v0.14 成就 wanderer_1 */
                showLine('成交。他把货塞进你怀里就走了。', 3000);
                flash(900);
                if (scene) scene.event('coin', 1200);
                paint();
              } else {
                addLog('流浪商人走了，没换', 'ev');
                showLine('他耸耸肩，背着包走了。', 2600);
              }
              after(1.2, function () {
                if (scene) scene.setCustomer(false);
                setState('wait'); schedule();
              });
            };
            if (flavor) {
              showLine(flavor, 1800);
              after(1.8, armOffer);
            } else {
              armOffer();
            }
          }

          function doBusker() {
            setState('serve');
            /* v0.13：气泡台词从 lore.EVENT_LINES.bard 里随机取一句，没有就退回原句 */
            showLine(eventLine('bard') || '门口有人支起琴盒，弹起来了。', 3600);
            data.buskerUntil = gameHourAbs() + BUSKER_HOURS;
            data.nBusker = (Number(data.nBusker) || 0) + 1;   /* v0.14 成就 busker_1 */
            addLog('街头艺人：接下来 ' + BUSKER_HOURS + ' 小时客人更勤', 'ev');
            paint(); persist();
            after(2.4, function () { setState('wait'); schedule(); });
          }

          var DAY0H = 9;   /* 游戏日从 9:00 起算，见 nowHour() */
          var nextEventAt = 0;
          var busy = false;
          var busyAt = 0;      /* v0.10.3 看门狗：链条最后一次推进的时刻 */
          var busyDeadline = 0; /* v0.11.1 看门狗：本次等待/动画的合法截止时刻（按等客时长动态给） */
          var chainOn = false;  /* v0.11.1 单链令牌：全局只允许一条事件链，重复 schedule() 直接忽略 */

          /* ---------- v0.10.3：营业/用餐改用「游戏内小时」 ----------
             以前用 new Date().getHours()（真实墙钟），可一游戏日只有 12 分钟真时间：
             20 个游戏日才推进 4 小时墙钟 → 19:00 的晚饭永远等不到、第 2 天起永久饥饿（客流 ×1.45），
             而且"几点开档"直接决定整局能不能营业（凌晨开档 = 永远打烊，只买得起 5 件）。
             现在：一天 12 分钟里走完 0–24 点，`nowHour()` 是唯一时钟。 */
          function daySpanMs() {
            return (devView() && /[?&]fast=1/.test(location.search)) ? 12000 : DAY_MS * PACE;
          }
          function nowHour() {
            if (typeof data.__hour === 'number' && isFinite(data.__hour)) return data.__hour;   /* 测试钩子 */
            var span = daySpanMs();
            var t = (Date.now() - (Number(data.dayStart) || Date.now())) / span;
            if (!isFinite(t)) return 12;
            /* 每个游戏日从 9:00 开门算起（DAY0H）：一天 12 分钟里 9:00→次日 7:00 都在营业
               （v0.12.1 起 07:00–24:00 开门），只有 07:00→09:00 这两个钟头打烊。
               dayStart 是「新的一天」的边界，若直接当 0 点用，一开局恰好是半夜，
               前五分钟店里全黑、一个人都不来。 */
            return ((t - Math.floor(t)) * 24 + DAY0H) % 24;
          }

          function schedule() {
            busy = true; busyAt = Date.now();
            if (!nextEventAt) nextEventAt = Date.now() + rand(300000, 660000);
            if (data.rest) { busy = false; chainOn = false; return; }        /* 歇业：链条停住，等 idleTick 在开门后重启 */
            var plan = decide(nowHour(), data.stock, data.gold, restockCost());
            /* v0.11.1：看门狗必须比「等客」本身长。
               等客 = rand(14,30) × PULL × rushFactor() × PACE（首日 rush 1.7 → 约 29–62 秒）；
               而 v0.10.3 的看门狗只给 15 秒，等待期间必然过期，30 秒一次的 idleTick
               每次都能补一条新链 —— 链条复制被「修」成了每天多一条，客流仍是单链的 8–25 倍。
               现在按本次等待时长动态定截止时刻；waitMs 里已经含 PULL，看门狗自动跟着放宽。 */
            /* v0.12.1：只有「等客」这一档乘 PULL（现取值见 :620，按实测灵敏度定的），
               补货/数钱/守夜的节奏保持原样，否则这些短动画也会被拖慢，观感变钝。 */
            var pull = plan.act === 'customer' ? PULL : 1;
            var waitMs = Math.max(1.6, plan.wait * pull * rushFactor() * PACE);
            busyDeadline = Date.now() + waitMs + 30000;
            after(waitMs, function () {
              /* v0.10.3：这里原来有一行 busy=false。它让 idleTick 在顾客/数钱动画的 3 秒里
                 误以为"店里闲着"，于是每 30 秒复制一条事件链，链条只增不减（实测客流 84→1550 客/日）。
                 现在 busy 覆盖整条链，闲置只由 data.rest / off 触发。 */
              busyAt = Date.now();
              busyDeadline = Date.now() + 30000;
              if (data.rest) { busy = false; chainOn = false; return; }   /* v0.12.6：收起（off）不再停链，只有歇业才停 */
              var care = careAct();                          /* 吃饭/睡觉优先，占掉一个档口 */
              if (care) { doCare(care); return; }
              if (Date.now() > nextEventAt) {
                nextEventAt = Date.now() + rand(360000, 800000);
                var roll = Math.random();
                if (roll < MERCHANT_P) { doMerchant(); return; }          /* v0.13 流浪商人 8% */
                if (roll < MERCHANT_P + BUSKER_P) { doBusker(); return; } /* v0.13 街头艺人 10% */
                if (Math.random() < 0.70) doCaravan(); else doThief();   /* v0.8：小贼事件 45% → 30% */
                return;
              }
              var p2 = decide(nowHour(), data.stock, data.gold, restockCost());
              if (p2.act === 'customer') doCustomer();
              else if (p2.act === 'restock') doRestock();
              else if (p2.act === 'count') doCount();
              else doIdle(p2.act);
            });
          }

          /* 该吃饭 / 该睡觉了吗？——原来散在 surviveTick 里靠 `!busy` 抢空隙（结果一天吃不上两顿），
             现在由事件链在每个档口主动问一次，链条自己会把这两件事排进去。 */
          function careAct() {
            if (data.energy < 22) return 'sleep';
            var slot = mealSlotId();
            if (slot >= 0 && (data.mealSlot | 0) !== slot) return 'meal';
            if (data.hunger < 30 && slot < 0) return 'bread';
            return null;
          }
          function doCare(act, quiet) {
            var again = quiet ? function () {} : schedule;   /* quiet：只做动作，不再排下一档（测试 / 兜底调用） */
            if (act === 'sleep') {
              data.energy = clampN(data.energy + 45, 0, 100);
              data.hunger = clampN(data.hunger - 4, 0, 100);
              addLog('撑不住，趴下睡了一会儿', 'ev');
              setState('away'); showLine('眼皮打架，眯一会儿。', 2600);
              paint();
              after(2, again);
              return;
            }
            if (act === 'meal') {
              data.mealSlot = mealSlotId();                  /* 先占槽位，eatMeal 失败也只是这顿跳过 */
              eatMeal();
              paint();
              after(1.2, again);
              return;
            }
            /* 夜里垫肚子（正餐槽位之外）：钱不够就别在厨房门口反复念叨，退回待客 */
            if (data.gold < 6) { doIdle('away'); return; }
            data.gold -= 6;
            data.hunger = clampN(data.hunger + 34, 0, 100);
            addLog('啃了个面包垫一下 −' + fmt(6), 'bad');
            setState('away'); showLine('啃个面包垫一下。', 2600);
            persist();
            paint();
            after(2, again);
          }

          function startNow() {
            if (opts.instant) {
              var name = opts.instant;
              if (name === 'customer') return doCustomer();
              if (name === 'restock') return doRestock();
              if (name === 'count') return doCount();
              if (name === 'caravan') return doCaravan();
              if (name === 'thief') return doThief();
              return setState(name);
            }
            schedule();
          }

          /* ---- 点击分区 ---- */
          function regionOf(e) {
            var r = el.stage.getBoundingClientRect();
            var fx = (e.clientX - r.left) / r.width;
            var fy = (e.clientY - r.top) / r.height;
            if (fx < 0.42 && fy < 0.46) return 'shelf';
            if (fx > 0.84 && fy > 0.58 && fy < 0.88) return 'pouch';
            if (fx > 0.4 && fx < 0.64 && fy > 0.6 && fy < 0.82) return 'ledger';
            if (fx < 0.4 && fy > 0.62) return 'customer';
            if (fx > 0.62 && fy < 0.62) return 'keeper';
            return 'counter';
          }

          var TEMP = {
            shelf: ['那排货都是好东西。', '想看看哪件？'],
            pouch: ['钱袋有点轻。', '今天进账还行。'],
            ledger: ['账目我都记着。', '赊账的都记在这。'],
            customer: ['（客人回过头）', '慢慢挑。'],
            keeper: ['（他抬头看你一眼）', '夜还长。'],
            counter: ['柜台上一层薄灰。']
          };

          el.stage.addEventListener('click', function (e) {
            var reg = regionOf(e);
            showLine(pick(TEMP[reg] || TEMP.counter), 3600);
            if (reg === 'ledger') addLog('你翻了翻账本', 'ev');
            else if (reg === 'pouch') { if (scene) scene.event('coin', 900); addLog('你掂了掂钱袋', 'ev'); }
            else if (reg === 'shelf') addLog('你看了看货架', 'ev');
            else if (reg === 'customer') addLog('你戳了戳客人', 'ev');
            else addLog('你拍了拍柜台', 'ev');
            flash(500);
          });

          /* 点“第 N 天”立刻对账（免得等 6 分钟） */
          var dayBtn = card.querySelector('.idk-daybtn');
          if (dayBtn) dayBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            settleDay();
            showLine('对完账了。');
            paint(); renderShop(); persist();
          });

          /* 左下角拖动改宽度 */
          el.grip.addEventListener('mousedown', function (e) {
            e.preventDefault(); e.stopPropagation();
            var sx = e.clientX, sw = card.getBoundingClientRect().width, sl = parseInt(card.style.left, 10) || 0;
            var isBig = card.classList.contains('is-big');
            function mv(ev) {
              var nw = Math.max(isBig ? 470 : 220, Math.min(maxW(), sw + (sx - ev.clientX)));
              card.style.width = nw + 'px';
              card.style.left = Math.max(4, sl + sw - nw) + 'px';
            }
            function up() {
              document.removeEventListener('mousemove', mv);
              document.removeEventListener('mouseup', up);
              var w = Math.round(card.getBoundingClientRect().width);
              if (isBig) data.wb = w; else data.w = w;
              data.x = parseInt(card.style.left, 10) || data.x;
              keepInView(); syncSide(); persist();
            }
            document.addEventListener('mousemove', mv);
            document.addEventListener('mouseup', up);
          });

          el.exp.addEventListener('click', function (e) { e.stopPropagation(); setBig(!card.classList.contains('is-big')); });
          el.min.addEventListener('click', function (e) {
            e.stopPropagation();
            collapse(!(card.getAttribute('data-collapsed') === '1'));
            persist();
          });
          el.pwr.addEventListener('click', function (e) {
            e.stopPropagation();
            setOff(true);
          });

          /* 侧栏五个页签：店铺 / 经营 / 心愿 / 成就 / 设置（v0.17 流水改成底部薄条） */
          var sideEl = card.querySelector('.idk-side');
          var tabBtns = card.querySelectorAll('.idk-tabs button');
          function setTab(name) {
            if (!sideEl) return;
            if (name === 'stock' || name === 'log') name = 'shop';   /* v0.17：旧货架/流水页签一律落到店铺 */
            if (name !== 'shop' && name !== 'stat' && name !== 'dream' && name !== 'ach' && name !== 'set') name = 'shop';
            sideEl.setAttribute('data-tab', name);
            for (var i = 0; i < tabBtns.length; i++) {
              tabBtns[i].setAttribute('data-on', tabBtns[i].getAttribute('data-tab') === name ? '1' : '0');
            }
            data.tab = name;
            persist();
            if (name === 'shop') renderShop();
            if (name === 'stat') renderStat();
            if (name === 'dream') renderDream();
            if (name === 'ach') renderAch();
            if (name === 'set') renderSet();
          }
          for (var ti = 0; ti < tabBtns.length; ti++) {
            tabBtns[ti].addEventListener('click', function (e) {
              e.stopPropagation();
              setTab(this.getAttribute('data-tab'));
            });
          }
          /* v0.17：心愿页两个静态 header、成就页动态 header 都在这里折叠。 */
          [el.townGrp, el.dreamGrp, el.sponsorGrp].forEach(function (g) {
            if (!g) return;
            g.addEventListener('click', function (e) {
              e.stopPropagation();
              uiToggle(g.getAttribute('data-grp'));
              renderDream();
            });
          });
          if (el.achList) {
            el.achList.addEventListener('click', function (e) {
              var g = e.target && e.target.closest ? e.target.closest('li[data-grp]') : null;
              if (!g) return;
              e.stopPropagation();
              uiToggle(g.getAttribute('data-grp'));
              renderAch();
            });
          }

          /* 经营页：收入 / 支出两本账各是一条可折叠的标签条（v0.24） */
          if (el.statList) {
            el.statList.addEventListener('click', function (e) {
              var g = e.target && e.target.closest ? e.target.closest('li[data-grp]') : null;
              if (!g) return;
              e.stopPropagation();
              uiToggle(g.getAttribute('data-grp'));
              renderStat();
            });
          }

          /* 店铺页：点价钱就买（升场所 / 装修 / 渠道 / 顾客）；伙食行和顾客行整行可点 */    if (el.shopList) {
            el.shopList.addEventListener('click', function (e) {
              var t = e.target;
              var btn = t && t.closest ? t.closest('.idk-buy') : null;
              var loreBtn = t && t.closest ? t.closest('.idk-lore') : null;
              var row = t && t.closest ? t.closest('li[data-food],li[data-cust]') : null;
              var grp = t && t.closest ? t.closest('li[data-grp]') : null;
              if (grp) {              /* v0.17：整行 header 折叠/展开，状态写进 data.ui.open */
                e.stopPropagation();
                uiToggle(grp.getAttribute('data-grp'));
                renderShop();
                return;
              }
              if (loreBtn) {          /* 货品名后的「?」：只在气泡里讲来历，不买 */
                e.stopPropagation();
                showLine(itemLore(loreBtn.getAttribute('data-lore')), 6000);
                return;
              }
              if (!btn && !row) return;
              e.stopPropagation();
              if (!btn) {
                var food = row.getAttribute('data-food');
                if (food != null) { setFoodTier(food | 0); return; }
                var cid = row.getAttribute('data-cust');
                if (cid) buyCustomer(cid);
                return;
              }
              var un = btn.getAttribute('data-unlock');
              if (un) { unlockClick(un); return; }
              /* v0.21：伙食行的价钱按钮 */
              var bf = btn.getAttribute('data-food');
              if (bf != null) { setFoodTier(bf | 0); return; }
              if (btn.getAttribute('data-up')) { upTier(); return; }
              if (btn.getAttribute('data-reset')) {
                if (!resetArm) {
                  resetArm = true; renderShop();
                  after(5, function () { if (resetArm) { resetArm = false; renderShop(); } });
                } else restart();
                return;
              }
              /* v0.11：先点「交给下一位」上膛，再点某一样传家宝才真交店 */
              if (btn.getAttribute('data-rebirth')) {
                if (!rebirthArm) {
                  rebirthArm = true; renderShop();
                  after(5, function () { if (rebirthArm) { rebirthArm = false; renderShop(); } });
                }
                return;
              }
              var boonId = btn.getAttribute('data-boon');
              if (boonId) { rebirth(boonId); return; }
              /* v0.16 §6.1 传承：两段式上膛，和「重来」同一套手感，不弹窗 */
              if (btn.getAttribute('data-legacy')) {
                if (!legacyArm) {
                  legacyArm = true; renderShop();
                  after(5, function () { if (legacyArm) { legacyArm = false; renderShop(); } });
                } else if (data.gift) {
                  legacyGo(data.gift);
                } else {
                  legacyArm = true; renderShop();   /* 已上膛：改出天赋三选一 */
                }
                return;
              }
              var giftId = btn.getAttribute('data-gift');
              if (giftId) { legacyGo(giftId); return; }
              var ch = btn.getAttribute('data-ch');
              if (ch) { buyChannel(ch); return; }
              var cf = btn.getAttribute('data-cf');
              if (cf) { buyCatFood(cf | 0); return; }
              var cu = btn.getAttribute('data-cust');
              if (cu) { buyCustomer(cu); return; }
              /* v0.14：店铺页底那两个存档按钮 —— 就在页里展开 textarea，不弹窗 */
              var sv = btn.getAttribute('data-save');
              if (sv === 'code') { copySaveCode(); return; }
              if (sv) { openSaveBox(sv === 'import' ? 'import' : 'export'); return; }
              buy(btn.getAttribute('data-id'));
            });
          }
          /* v0.15：货品解锁（按钮现在长在店铺页里）。disabled 也接住点击，给一句为什么不能买 */
          function unlockClick(k) {
            var it = itemByKey[k];
            if (!it) return;
            if ((it.lv | 0) > (data.tier | 0)) { showLine('得先把铺子升级到 Lv.' + it.lv); return; }
            if (data.gold >= unlockCost(it)) { unlockItem(k); return; }
            var lack = unlockCost(it) - data.gold;
            if (lack > 0) showLine(data.gold < lack ? '再卖一阵子吧，还差 ' + fmt(lack) : '还差 ' + fmt(lack));
          }
          /* v0.14 心愿页：点行上的价钱扣铜圆梦、点城建按顺序建；整行也接住，给一句为什么不行 */
          if (el.dreamList) {
            el.dreamList.addEventListener('click', function (e) {
              var t = e.target;
              var li = t && t.closest ? t.closest('li[data-dream]') : null;
              if (!li) return;
              e.stopPropagation();
              buyDream(li.getAttribute('data-dream'));
            });
          }
          if (el.townList) {
            el.townList.addEventListener('click', function (e) {
              var t = e.target;
              var li = t && t.closest ? t.closest('li[data-town]') : null;
              if (!li) return;
              e.stopPropagation();
              var tid = li.getAttribute('data-town');
              if (!townOpen(data, tid)) { showLine('上一项还没建好，一档一档来。', 2400); return; }
              buyTown(tid);
            });
          }
          if (el.sponsorList) {
            el.sponsorList.addEventListener('click', function (e) {
              var t = e.target;
              var btn = t && t.closest ? t.closest('button[data-sp]') : null;
              if (!btn) return;
              e.stopPropagation();
              sponsorToggle(btn.getAttribute('data-sp'));
            });
          }
          /* v0.15 设置页：存档两个按钮 + 重头摆摊（上膛逻辑跟原来店铺页里一样） */
          if (el.setList) {
            el.setList.addEventListener('click', function (e) {
              var t = e.target;
              var btn = t && t.closest ? t.closest('.idk-buy') : null;
              if (!btn) return;
              e.stopPropagation();
              var sv = btn.getAttribute('data-save');
              if (sv === 'code') { copySaveCode(); return; }
              if (sv) { openSaveBox(sv === 'import' ? 'import' : 'export'); return; }
              if (btn.getAttribute('data-tut')) {
                /* v0.27 新手提示开关：关掉就不再出现；想再看一遍就打开，从第一步重来 */
                data.tut = Number(data.tut) === -1 ? 0 : -1;
                persist(); renderSet(); updateLockHint();
                return;
              }
              if (btn.getAttribute('data-reset')) {
                if (!resetArm) {
                  resetArm = true; renderSet();
                  after(5, function () { if (resetArm) { resetArm = false; renderSet(); } });
                } else restart();
              }
            });
          }
          /* v0.14 存档框：确认导入 + 点文本框不触发卡片拖拽 */
          if (saveApplyBtn) {
            saveApplyBtn.addEventListener('click', function (e) { e.stopPropagation(); applyImport(); });
          }
          if (saveBoxEl) {
            saveBoxEl.addEventListener('click', function (e) { e.stopPropagation(); });
          }
          /* 小卡上的「还有 N 件没上架」：点开大窗并切到店铺页签（货品段在那儿） */
          if (el.lockHint) {
            el.lockHint.addEventListener('click', function (e) {
              e.stopPropagation();
              setBig(true);
              setTab('shop');
            });
          }
          /* v0.13 流浪商人：气泡在报价期间可点，点一下 = 成交（8 秒不点由 doMerchant 的定时器自动拒绝） */
          if (el.bubble) {
            el.bubble.addEventListener('click', function (e) {
              /* v0.14：常客在气泡上求的那件事 —— 点一下就跳到心愿页去办 */
              if (wishFor) {
                e.stopPropagation();
                wishFor = '';
                setBig(true);
                setTab('dream');
                return;
              }
              if (!offer || !offerResolve) return;
              e.stopPropagation();
              if ((data.gold | 0) < offer.price) {
                showLine('钱袋不够，要 ' + fmt(offer.price) + '。', 2200);
                return;
              }
              if ((data.stock[offer.k] || 0) >= maxStock()) {
                showLine('货架放不下了，先卖两件。', 2200);
                return;
              }
              offerResolve(true);
            });
          }
          (function () {
            /* 调试解锁（?tier/?ch/?up）只在 dev 预览页生效；正式挂载时这段整个跳过 */
            if (devView()) {
            var mt = /[?&]tier=(\d)/.exec(location.search);
            if (mt) {
              data.tier = Math.max(0, Math.min(4, parseInt(mt[1], 10) || 0));
              /* 调试看高等级货架时，把该等级的货一并解锁（老 ?tier= 的预览语义） */
              items.forEach(function (it) { if ((it.lv | 0) <= data.tier) addUnlocked(it.k); });
            }
            var mc = /[?&]ch=([a-z,]+)/.exec(location.search);
            if (mc) mc[1].split(',').forEach(function (id) {
              if (CHANNELS.some(function (c) { return c.id === id; })) data.channels[id] = 1;
            });
            var m = /[?&]up=([a-z0-9,]+)/.exec(location.search);
            if (m) {
              m[1].split(',').forEach(function (id) {
                if (UPGRADES.some(function (u) { return u.id === id; })) data.upgrades[id] = 1;
              });
            }
            }
            /* 按最终等级补齐/清空库存（只补已解锁的货） */
            items.forEach(function (it) {
              if ((it.lv | 0) <= (data.tier | 0) && isUnlocked(it.k)) {
                if (typeof data.stock[it.k] !== 'number') data.stock[it.k] = maxStock();
              } else delete data.stock[it.k];
            });
            syncSlots();      /* v0.11：旧档没有 slots / 库存变了 → 先把 3 格对齐，再画界面 */
            applyDecor();
            renderShop();
            renderStock();
            var tp = /[?&]tab=(stock|shop|dream|ach|set)/.exec(location.search);
            setTab(tp ? tp[1] : (data.tab || 'stat'));
            /* v0.11：读进来的档如果已经通关（比如从另一台机器同步过来），补一次收尾，不重复写 */
            checkClear();
          })();

          /* 小月亮：固定右下角，单击开回来（不再支持拖动） */
          badge.addEventListener('click', function (e) {
            e.stopPropagation();
            if (off) setOff(false);
          });
          badge.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              if (off) setOff(false);
            }
          });
          el.head.addEventListener('dblclick', function () {
            var on = card.getAttribute('data-quiet') === '1';
            card.setAttribute('data-quiet', on ? '0' : '1');
            if (!on) el.bubble.setAttribute('data-on', '0');
            persist();
          });
          document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && card.classList.contains('is-big')) setBig(false);
          });

          /* 拖拽 */
          var drag = null;
          el.head.addEventListener('mousedown', function (e) {
            if (e.target.classList.contains('idk-btn')) return;
            drag = { x: e.clientX, y: e.clientY, l: parseInt(card.style.left, 10) || 0, t: parseInt(card.style.top, 10) || 0, moved: false };
            el.head.style.cursor = 'grabbing';
          });
          window.addEventListener('mousemove', function (e) {
            if (!drag) return;
            var ddx = e.clientX - drag.x, ddy = e.clientY - drag.y;
            if (!drag.moved && Math.abs(ddx) + Math.abs(ddy) > 4) drag.moved = true;
            card.style.left = Math.max(6, drag.l + ddx) + 'px';
            card.style.top = Math.max(6, drag.t + ddy) + 'px';
          });
          window.addEventListener('mouseup', function () {
            if (!drag) return;
            var wasMoved = drag.moved;
            drag = null; el.head.style.cursor = 'grab'; keepInView(); persist();
            /* v0.9：收起成迷你条后，点一下标题栏就展开（拖动超过 4px 才算拖） */
            if (!wasMoved && card.getAttribute('data-collapsed') === '1') { collapse(false); persist(); }
          });

          /* 吃饭 / 睡觉：衰减在这里，真正"吃/睡"由事件链的 careAct()/doCare() 排进去（v0.10.3） */
          function surviveTick() {
            var hour = nowHour();
            var open = isOpen(hour) && !data.rest;
            data.hunger = clampN(data.hunger - (open ? 1.1 : 0.7), 0, 100);
            if (open) data.energy = clampN(data.energy - 0.9, 0, 100);
            else if (!isOpen(hour)) data.energy = clampN(data.energy + 2.6, 0, 100);
            data.starve = data.hunger < 12;
            /* 链内由 careAct() 排进档口；这里只在链条完全闲着时兜底，避免测试/看门狗场景下饿死在原地 */
            if (!busy) { var care = careAct(); if (care) doCare(care, true); }
            paint();
          }

          function idleTick() {
            if (paused) return;
            if (scene) scene.setClock(nowHour());   /* v0.10.3：场景天色也走游戏时间（12 分钟一昼夜） */
            /* v0.16：墙钟的两件事 —— 法阵到点自己落成、星砂集市到点自己开市。
               这两笔都不看营业时间，DSH 关着的时候照样走（§2「解锁只从墙钟来」）。 */
            applyRites();
            mktTick();
            /* 跨天：到点就结账、换行情 */
            if (!data.dayStart) { data.dayStart = Date.now(); persist(); }
            var span = daySpanMs();
            if (Date.now() - data.dayStart >= span) settleDay();
            surviveTick();
            /* 看门狗：链条若在某个分支里断掉（busy 永远为 true），等到「本次等待 + 30 秒」还没推进才强制重启。
               不能用固定 15 秒 —— 营业时等客本身就要 24–51 秒，固定阈值会在等待期把 busy 清零，
               于是每 30 秒补一条链，客流翻十几倍（v0.11.0 实测 285 客/日 vs 单链 10 客/日）。 */
            if (busy && busyDeadline && Date.now() > busyDeadline) { busy = false; chainOn = false; }
            if (!busy && !data.rest && !data.starve) schedule();
            if (data.rest && !busy && state !== 'away') { setState('away'); showLine('门上挂了块木牌：今日歇业。'); }
          }

          /* v0.11：后台挂机补算（重写）。
             旧版（v0.9）两个地方都太保守：只补 2 小时、再打 0.55 的折扣，而且是一笔钱直接拍进钱袋、
             整个跳过日结 —— 跨天该付的房租、该换的行情、该记的流水全被吞掉，"挂着"永远不如"守着"。
             v0.16（plan §5）：口径定死为「你不在的时候，店里照常开着一点」——
               · 上限 8 小时不变；
               · 补算速率 = 昨日营业额 × 35%（CATCH_RATE），不再是 100%；
               · 房租照扣、行情照换、日结照走。
             所以离线只是「少亏一点」，不再是一夜之间白拿一整天；钱仍然只从营业钟来。 */

          function catchUp(ms) {
            var now = Date.now();
            var msN = Number(ms);
            if (!isFinite(msN) || msN < 60 * 1000) return 0;      /* 走开不到一分钟，不值得播报 */
            var use = Math.min(msN, CATCH_MAX_MS);
            var capped = msN > use;
            var span = Math.max(1000, daySpanMs());
            var from = now - use;                                 /* 离线窗口起点，更早的账不过问 */
            /* 日界不能早于窗口起点：更早的那几天整段不算（"最多补 8 小时"是整段封顶，
               不是"只给收益、房租照收"）。dayStart 没初始化 / 被改到未来（系统时间倒拨）也回落到窗口起点。 */
            var anchor = Number(data.dayStart) || 0;
            if (!anchor || anchor > now || anchor < from) anchor = from;
            /* 当日速度：优先用上一天实收，没历史就按货架估（每件 55 铜）；再乘 CATCH_RATE */
            var dayRate = Number(data.revLast) || 0;
            if (!dayRate) dayRate = Math.max(60, shelf().length * 55);
            var perMs = (dayRate * CATCH_RATE) / span;

            data.goldDay0 = Math.round(Number(data.goldDay0) || 0);
            var t = anchor, days = 0, total = 0, rent = 0, guard = 0;
            /* 逐日：日界在 anchor + k*span 上，一天一天往前走，走到 now 为止 */
            while (t + span <= now && guard++ < 400) {
              var nxt = t + span;
              var segA = t > from ? t : from;                     /* 这天里真正离线的那段 */
              var seg = nxt - segA;
              /* 歇业日（连欠两天房租）不开门：日历照走，营业额不记 */
              if (seg > 0 && !data.rest && !data.starve) {
                var sale = Math.round(perMs * seg);
                if (sale > 0) { data.gold += sale; data.revToday = (Number(data.revToday) || 0) + sale; total += sale; }
              }
              rent += Number(settleDay(nxt, true)) || 0;          /* 真日结：扣房租 / 换行情 / 记流水 */
              days += 1;
              t = nxt;
            }
            /* 最后一天还没走完：只补离线的那一截。guard 用尽（极端旧档）时按一天封顶，免得凭空空转出钱 */
            var tailA = t > from ? t : from;
            var tail = Math.max(0, now - tailA);
            if (tail > span) tail = span;
            if (tail > 0 && !data.rest && !data.starve) {
              var gain = Math.round(perMs * tail);
              if (gain > 0) { data.gold += gain; data.revToday = (Number(data.revToday) || 0) + gain; total += gain; }
            }
            /* 日界重定：跨过去的天已逐日结清，当前这一天从"现在"重新起算。
               没跨天就不动 dayStart —— 否则每次走开两分钟都白送一整天的额度。 */
            if (days > 0) data.dayStart = now;
            busy = false; chainOn = false; busyAt = now;          /* 链条可能停在某个动画中途，回来立刻续跑 */
            applyRites();                                        /* 走开这几小时里充完的法阵，回来当场生效 */

            if (days > 0 || total > 0) {
              var mins = Math.round(use / 60000);
              var away = mins >= 60 ? (Math.floor(mins / 60) + ' 小时 ' + (mins % 60) + ' 分') : (mins + ' 分钟');
              addLog('离开 ' + away + (capped ? '（只补前 8 小时）' : '') + '：' + fmt(total) +
                (days > 0 ? '，' + days + ' 天结账付 ' + fmt(rent) : ''), 'ev');
              showLine('你不在的时候，店里照常开着一点（补 ' + fmt(total) + '）' + (days > 1 ? '，跨 ' + days + ' 天' : '') + '。', 3400);
              paint(); persist();
            }
            if (scene) scene.setClock(nowHour());
            return total;
          }

          /* v0.11：动画循环自己开关，不指望浏览器"替你节流"。
             隐藏标签页里浏览器会把 rAF 压到几乎不跑（但偶尔还是跑一帧），回来时 dt 会攒成一大坨、场景一跳；
             更麻烦的是压着跑的那几帧会让 lastFrame 逻辑错乱。所以：隐藏 → 显式 cancel，可见 → 重新起。 */
          function stopRaf() {
            if (raf) { cancelAnimationFrame(raf); raf = 0; }
            lastFrame = 0;
          }
          function startRaf() {
            if (opts.noLoop || paused || off || raf) return;   /* 收着的时候不画，但逻辑照跑 */
            lastFrame = 0;
            raf = requestAnimationFrame(frame);
          }

          function frame(now) {
            if (paused) { raf = 0; lastFrame = 0; return; }   /* 不再排队，等可见了 startRaf 再起 */
            raf = requestAnimationFrame(frame);
            var dt = lastFrame ? Math.min(0.1, (now - lastFrame) / 1000) : 0.016;
            lastFrame = now;
            if (scene) scene.render(now, dt);
            /* v0.18：天亮/打烊的瞬间把顶上那句提示换掉——打烊小结只在关店后出现，
               开门后立刻回到「下一步买什么」，不让它赖在营业时段里。 */
            if (now - lastOpenChk > 1000) {
              lastOpenChk = now;
              var op = isOpen(nowHour());
              if (op !== lastOpenState) { lastOpenState = op; updateLockHint(); }
              if (el.mktDot) el.mktDot.hidden = !mktOpen();
              /* 卡片收起来只剩那颗小月亮：集市开着时让它镀一圈金，免得 48 小时白过 */
              var mktOn = mktOpen() ? '1' : '0';
              if (badge && badge.getAttribute('data-mkt') !== mktOn) badge.setAttribute('data-mkt', mktOn);
            }
            if (bubbleT && Date.now() > bubbleT) { el.bubble.setAttribute('data-on', '0'); bubbleT = 0; }
            if (flashT && Date.now() > flashT) { card.removeAttribute('data-flash'); flashT = 0; }
          }
          var lastOpenChk = 0, lastOpenState = null;

          var hiddenAt = 0;
          var idleTimer = 0;

          /* v0.11：隐藏 = 冻结整条事件链，不是"让它自己慢慢跑"。
             隐藏期间 setTimeout 被节流到约 1 次/分钟，链条会以"每分钟一小步"的速度偷偷继续卖货；
             回来再 catchUp 补一整段，等于同一段时间卖两遍（补算 + 偷偷卖的那几件）。
             所以藏起来就全停：rAF、30 秒心跳、链条上的 setTimeout 一起停。 */
          function stopLoop() {
            stopRaf();
            if (idleTimer) { clearInterval(idleTimer); idleTimer = 0; }
            clearTimers();
            busy = false; chainOn = false;
          }
          function startLoop() {
            if (opts.noLoop) return;
            startRaf();
            if (!idleTimer) idleTimer = setInterval(idleTick, 30000);
          }

          document.addEventListener('visibilitychange', function () {
            var hide = !!document.hidden && !FORCE_PLAY;
            if (hide) {
              hiddenAt = Date.now();
              paused = true;
              stopLoop();
              return;
            }
            var away = hiddenAt ? Date.now() - hiddenAt : 0;
            hiddenAt = 0;
            paused = false;
            /* 回来先复位画面：离开时可能正卡在某个动画中间，不收拾一下会留个半截客人站在店里 */
            if (scene) scene.setCustomer(false);
            setState(data.rest ? 'away' : 'wait');
            catchUp(away);                       /* 补齐：按游戏日逐日结账 */
            startLoop();                         /* 心跳 + （没收起时）rAF 一起续上 */
            if (off) { stopRaf(); }
            if (!busy && !data.rest && !data.starve) schedule();   /* 立刻续跑，不等 30 秒心跳 */
          });

          /* v0.8.2 体检：万一还有别的东西盖在卡片上（原生标题栏 / 别的插件浮层），
             把挡路者写进气泡和控制台。只在真被挡住时说话，平时零噪音。 */
          function auditTop() {
            try {
              if (off || card.style.display === 'none' || document.hidden) return;
              var r = card.getBoundingClientRect();
              if (!r.width || !r.height) return;
              var probes = [[r.left + 30, r.top + 16], [r.left + r.width / 2, r.top + r.height / 2], [r.left + 8, r.top + r.height - 8]];
              for (var i = 0; i < probes.length; i++) {
                var e = document.elementFromPoint(probes[i][0], probes[i][1]);
                if (!e || e === card || card.contains(e)) continue;
                var nm = e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') +
                  (e.className && e.className.toString ? '.' + e.className.toString().trim().split(/\s+/).slice(0, 2).join('.') : '');
                if (window.console) console.warn('[dsh-magic-shop] 卡片被遮挡：' + nm);
                showLine('好像被「' + nm.slice(0, 30) + '」挡住了。');
                return;
              }
            } catch (e) {}
          }
          setTimeout(auditTop, 1600);

          renderLog();
          paint();
          persist();                 /* 迁移后的 v=6 / unlocked 立刻落盘 */
          if (data.off) setOff(true);
          if (/[?&]off=1/.test(location.search)) setOff(true);
          /* 窗口变小过的话，上次记住的位置可能已经在屏幕外了 —— 挂载时和每次改窗口都拉回可见区 */
          if (!off) keepInView();
          window.addEventListener('resize', function () {
            if (!off) { layout(); keepInView(); }
          });
          if (!opts.noLoop) {
            /* v0.11：在隐藏标签里被挂载（DSH 有时把卡片渲染进后台的 tab）：先冻住，
               等第一次 visible 由 visibilitychange 补算 + 起循环。这样"藏着的这段时间"只算一次账。
               v0.12.6：卡片是「收起成小月亮」的状态也照样开跑（startRaf 自己会因为 off 跳过绘制）。 */
            if (document.hidden && !FORCE_PLAY) {
              paused = true;
              hiddenAt = Date.now();
            } else {
              startLoop();
              startNow();
            }
          }
          /* 任何路径挂上过都算数，避免兜底重试再挂一张 */
          window.__MAGIC_SHOP_MOUNTED__ = true;

          var api = {
            card: card, scene: scene, badge: badge,
            /* data 用 getter：restart() 会整个换掉对象，句柄必须每次现取 */
            get data() { return data; },
            set: setState, setBig: setBig, setOff: setOff,
            /* v0.9：收起态 / 重画 / 离线补算 —— 都给它一个句柄，click-test 才验得动 */
            collapse: collapse, paint: paint, catchUp: catchUp,
            /* v0.12.2：存档版本 —— 序号/最近一次被宿主判「你比磁盘旧」时磁盘的时间戳，都给测试看 */
            get saveSeq() { return Number(data.saveSeq) || 0; },
            get diskStaleAt() { return diskStale || 0; },
            buy: buy, buyChannel: buyChannel, upTier: upTier, unlockItem: unlockItem,
            buyCustomer: buyCustomer, setFoodTier: setFoodTier, buyCatFood: buyCatFood,
            get foodTier() { return data.foodTier | 0; },
            /* 上一顿实际吃到的档（钱不够时可能低于 foodTier；foodTier 始终是玩家所选档） */
            get mealTier() { return data.mealTier == null ? -1 : (data.mealTier | 0); },
            get mealCost() { return { per: mealPrice(), day: dayFoodCost() }; },
            get custs() { return unlockedCusts().map(function (c) { return c.id; }); },
            /* 供测试/QA：按当前解锁状态抽一位客人（含村民权重衰减） */
            pickCustomer: pickCustomer,
            get foodSlot() { return mealSlotId(); },
            restart: restart,
            settleDay: settleDay, setTab: setTab,
            /* v0.16：法阵充能是墙钟，测试不可能真的等 10 分钟——给它一个「立刻充完」的钩子，
               只动 data.rites 的时间戳，走的仍是正式那条 applyRites()。 */
            riteNow: function (id) {
              if (!riteTs(id)) return false;
              data.rites[id] = Date.now() - riteDur(id) - 1000;
              applyRites();
              return true;
            },
            get rites() { return JSON.parse(JSON.stringify(data.rites || {})); },
            /* 传承要「开业满 7 个日历天」，测试同样没法真等一周：把开业时间往前挪。 */
            backdate: function (days) {
              data.realStart = Date.now() - (Number(days) || 7) * REAL_DAY_MS;
              paint(); renderShop();
              return data.realStart;
            },
            get legacy() { var r = legacyReady(); return { ok: r.ok, core: r.core, days: r.days, cd: legacyCdLeft(), gen: data.gen | 0, gift: data.gift || '' }; },
            legacyGo: legacyGo,
            get unlocked() { return data.unlocked.slice(); },
            /* v0.9.1：把定价表交给测试。数值由 docs/economy-model-v2 推出来，
               click-test 只该验"界面上显示的就是表里的数"，不该把数字抄死在断言里 */
            get balance() {
              var items = (window.MagicShopScene && window.MagicShopScene.ITEMS) || [];
              var pick = function (arr, f) { return arr.map(f); };
              return {
                tier: pick(TIERS, function (t) { return { lv: t.lv, price: t.price }; }),
                up: pick(UPGRADES, function (u) { return { id: u.id, price: u.price, minLv: u.minLv }; }),
                ch: pick(CHANNELS, function (c) { return { id: c.id, price: c.price }; }),
                cust: pick(CUSTS, function (c) { return { id: c.id, price: c.price }; }),
                item: pick(items, function (i) { return { k: i.k, unlock: i.unlock || 0, price: i.price }; })
              };
            },
            /* 金额格式化也交给测试：断言只验"显示 == fmt(表里的数)" */
            fmt: fmt, fmtShort: fmtShort,
            /* 供测试用：客人到店的等待倍率（橱窗 0.88 · 招牌 0.8 · 传送门 0.65 叠乘） */
            rush: rushFactor,
            /* v0.11：客单价也交给测试——天气（雪 ×1.08）/ 灯节（×1.05）要能被断言到 */
            price: function (k) { var it = itemByKey[k]; return it ? priceOf(it) : 0; },
            survive: surviveTick,
            get off() { return off; },
            run: function (name) { opts.instant = name; startNow(); },
            log: function (t, k) { addLog(t, k); },
            event: function (kind) { if (scene) scene.event(kind, 2000); },
            /* v0.13 随机事件：测试/QA 可以直接叫一次，或读当前报价与艺人剩余时长 */
            merchant: doMerchant, busker: doBusker,
            /* v0.13 长线：QA 可以直接让某位常客上门一次，验第 3/6/10 次的故事台词 */
            serve: serveRegular, regular: regularById,
            get offer() { return offer ? { k: offer.k, name: offer.name, price: offer.price } : null; },
            get buskerLeft() { return buskerLeft(); },
            get eventP() { return { merchant: MERCHANT_P, busker: BUSKER_P, hours: BUSKER_HOURS }; },
            destroy: function () {
              stopRaf(); clearTimers();
              custHideAt = 0;
              if (idleTimer) { clearInterval(idleTimer); idleTimer = 0; }
              if (card.parentNode) card.parentNode.removeChild(card);
              if (badge.parentNode) badge.parentNode.removeChild(badge);
            }
          };
          /* v0.13：?dbg=1 时把句柄挂到 window，方便在预览页里直接叫一次随机事件验行为 */
          try { if (devView() && /[?&]dbg=1/.test(location.search)) window.__MAGIC_SHOP_DEBUG__ = api; } catch (e) {}
          return api;
        }

        /* ---------- v0.10.2：存档落盘（端口变了也不丢） ----------
           localStorage 按 origin（协议+域名+端口）隔离，DSH 一换端口就换 origin，档就"没了"。
           所以再往宿主半（lib/index.js 注册的 /api/magic-shop/save）双写一份；路由跟进程走。
           磁盘不可用（宿主旧、路由没注册、目录不可写）时全部静默降级，只留 localStorage。 */
        function saveEndpoint() {
          try {
            if (typeof location === 'undefined' || typeof fetch !== 'function') return null;
            return location.protocol === 'file:' ? 'api/magic-shop/save' : location.origin + '/api/magic-shop/save';
          } catch (e) { return null; }
        }

        function hasLocalSave() {
          try { return !!localStorage.getItem(STORE_KEY); } catch (e) { return false; }
        }

        /* v0.11：本地档的时间戳。老档没有 savedAt，一律当 0（= 最旧）。 */
        function localSavedAt() {
          try {
            var raw = localStorage.getItem(STORE_KEY);
            if (!raw) return 0;
            var p = JSON.parse(raw);
            return Number(p && p.savedAt) || 0;
          } catch (e) { return 0; }
        }

        /* v0.12.2：磁盘档该不该收编（抽出来是为了能离线测，不用真的开浏览器）。
           - 本地没档：收（多半是 DSH 换了端口，磁盘就是唯一的一份）。
           - 本地有档：只有磁盘更「新」才收；相等/更旧一律丢磁盘，免得把本地新档盖回去。 */
        function diskIsNewer(hasLocal, mine, theirs) {
          if (!hasLocal) return true;
          return (Number(theirs) || 0) > (Number(mine) || 0);
        }

        /* v0.11：收编磁盘档。
           旧版只在 localStorage 空着时收（换了端口那种），可反过来的危险没管：
           两个窗口开着同一家店，A 刚写盘、B 手里是半小时前的旧档又写了一次 —— 新档就被盖回去了。
           现在比 savedAt：本地有档且磁盘档不比它新，就不收编（本地为准）；本地没档则无条件收。 */
        function restoreFromDisk() {
          var url = saveEndpoint();
          if (!url) return Promise.resolve(false);
          return fetch(url, { credentials: 'same-origin' })
            .then(function (r) { return r.json(); })
            .then(function (res) {
              if (!res || !res.ok || !res.save) return false;
              var disk = JSON.parse(res.save);              /* 坏档就别塞进 localStorage */
              if (!disk || typeof disk !== 'object') return false;
              var hasLocal = hasLocalSave();
              var mine = hasLocal ? localSavedAt() : 0;
              var theirs = Number(disk.savedAt) || 0;
              if (!diskIsNewer(hasLocal, mine, theirs)) return false; /* 磁盘档更旧：不收编，免得把新档盖回去 */
              localStorage.setItem(STORE_KEY, res.save);
              return true;
            })
            .catch(function () { return false; });
        }

        function load() {
          var d = { x: null, y: null, bx: null, by: null, off: false, collapsed: false, big: false, quiet: false, w: 268, wb: 640,
            gold: 120, day: 1, sold: 0, stock: {}, log: [],
            upgrades: {}, channels: {}, tier: 0, hunger: 70, energy: 80, starve: false,
            debt: 0, arrears: 0, dayStart: 0, savedAt: 0, saveSeq: 0, marketK: '', marketMult: 1, rest: false, tab: 'shop',
            /* v0.17：折叠状态。缺省空对象 = 全部展开；只记折叠过的组，老档不会被重置。 */
            ui: { open: {} },
            unlocked: ['mana', 'scroll'], revToday: 0, revLast: 0, goldDay0: 120, fresh: {}, v: 7,
            /* v0.8 新增：伙食档（1=中档，与 v0.7 现状等价）、已解锁顾客（村民白送）、正餐槽位 */
            foodTier: 1, cust: { villager: 1 }, mealSlot: -1, mealMissed: false, mealDebtDays: 0,
            mealTier: -1, mealDebtDay: 0,
            /* v0.11 故事侧：常客档案（id → {n 买成次数, d 上次来的游戏日, tip 小费累计}）、
               今天的常客队列（跨天由 settleDay 重排）、世界碎片的洗牌袋（wBag 是没抽到的下标，wLast 是最近一条） */
            /* v0.11：前台 3 格陈列位（'' = 空格；旧档没有这个字段时挂载时自动补 3 件） */
            slots: [],
            /* v0.11 无尽：代数（默认第 1 代）、这一代带走的传家宝 id、通关时间戳（0 = 还没通关） */
            generation: 1, boon: '', cleared: 0,
            /* v0.11 天气/集市日：天气每天日结重抽（非法值回落 sunny），节日由 day%k 推导后写这里存档 */
            weather: 'sunny', weatherNext: '', festival: false,
            regs: {}, regToday: [], wBag: [], wLast: -1, regMissDay: 0,
            /* v0.13 街头艺人：客流加成到期的「游戏小时绝对刻度」= day*24 + nowHour()，0 = 没有 */
            buskerUntil: 0,
            /* v0.14 心愿页：圆过的梦（lore.DREAMS 的 id）、建成的城建（lore.TOWN 的 id）、名望 0–100、
               已经被常客开口求过的愿望 id（每条只求一次） */
            dreams: [], town: [], fame: 0, wishAsked: {},
            /* v0.14 成就：36 条，id 就是判定用的 cond，1 = 已解锁 */
            ach: {},
            /* v0.14 打点：连续不欠账天数、见过的天气、见过的路人/艺人/夜里成交次数、四季（0 春…3 冬）、
               打烊独白说到第几天（-1 = 还没说过） */
            noDebtRun: 0, weatherSeen: {}, nWanderer: 0, nBusker: 0, nightSeen: 0,
            season: 0, closeSaidDay: -1, marketSeen: 0, lanternSeen: 0, bestNet: 0,
            /* v0.13 里程碑与通关小结的累计计数：成交单数 / 卖出件数 / 累计赚到（铜）/
               钱袋见底次数 / 通关次数 / 卖过最贵的一件；milestones 是已触发过的 id 表（1 = 已触发） */
            nOrders: 0, nSold: 0, nGold: 0, nBroke: 0, nClear: 0, bestItem: '', bestPrice: 0, milestones: {},
            /* v0.16 §7 新增五个字段（v6→v7 只补默认值，不动 gold）：
               rites = 法阵充能单 { id: 开始时刻 }；gen = 传承代数（0 = 还没传过）；
               gift = 三选一的天赋（'' 未选）；realStart = 第一次开张的墙钟刻度；market = 星砂集市记账 */
            rites: {}, gen: 0, gift: '', realStart: 0, market: { n: 0, round: -1 },
            /* v0.18：猫粮档次（0 = 没买过，1–3 = CATFOODS 的 id）；老档缺省补 0 */
            catFood: 0,
            /* v0.23：正在资助的冒险队 id 列表；老档缺省补空数组 */
            sponsor: [],
            /* v0.27 新手三步：0 未开始 / 1 先补货 / 2 等第一位客人 / 3 等第一次打烊 / 9 走完 / -1 关了 */
            tut: 0 };
          try {
            /* v0.7：老库键直接丢掉，不给"旧档还能接着用"的机会 */
            OLD_KEYS.forEach(function (k) { try { localStorage.removeItem(k); } catch (e) {} });
            var raw = localStorage.getItem(STORE_KEY);
            if (raw) {
              var p = JSON.parse(raw);
              for (var k in p) if (p.hasOwnProperty(k)) d[k] = p[k];
              /* 老档没有 v（或 v<6）：挂载时按 lv<=tier 补 unlocked，gold 原样当铜 */
              if (p.v == null || (p.v | 0) < 6) d.v = 0;
            }
          } catch (e) {}
          return d;
        }

        function showFail(err) {
          try {
            var box = document.getElementById('idk-fail') || document.createElement('div');
            box.id = 'idk-fail';
            box.style.cssText = 'position:fixed;right:14px;bottom:14px;z-index:2147483647;max-width:340px;padding:10px 12px;' +
              'border-radius:10px;background:#3a1d22;border:1px solid #7d3a44;color:#ffd9de;font:12px/1.5 system-ui;' +
              'box-shadow:0 10px 30px rgba(0,0,0,.45);white-space:pre-wrap';
            box.textContent = '魔法商店没挂上：' + (err && err.message ? err.message : err);
            if (!box.parentNode) document.body.appendChild(box);
          } catch (e) {}
          if (window.console) console.error('[dsh-magic-shop] mount failed', err);
        }

        function boot() {
          try {
            if (window.dshLocalPlugins && window.dshLocalPlugins.magicShop === false) return null;
            if (window.__MAGIC_SHOP_MOUNTED__) return null;
            /* v0.11：本地有没有档都问一次宿主 —— 有档时 restoreFromDisk() 会用 savedAt 比新旧，
               不会拿磁盘上的旧档盖掉本地新档；本地没档（多半是 DSH 换了端口）就无条件收编。 */
            if (!window.__MAGIC_SHOP_DISK_TRIED__ && saveEndpoint()) {
              window.__MAGIC_SHOP_DISK_TRIED__ = true;
              restoreFromDisk().then(function () { boot(); }, function () { boot(); });
              return null;
            }
            /* 宿主可能在 <head> 里就跑 apply()：那时 body 还不存在，必须等 DOM 就绪再来一次 */
            if (document.readyState === 'loading' || !document.body) {
              if (!window.__MAGIC_SHOP_WAIT__ && typeof document.addEventListener === 'function') {
                window.__MAGIC_SHOP_WAIT__ = true;
                document.addEventListener('DOMContentLoaded', function () { boot(); }, { once: true });
                window.addEventListener('load', function () { boot(); }, { once: true });
              }
              return null;
            }
            var w = mount();
            window.__MAGIC_SHOP_MOUNTED__ = true;
            if (window.console) console.info('[dsh-magic-shop] mounted v' + VER);
            return w;
          } catch (err) {
            showFail(err);
            return null;
          }
        }

        window.MagicShopWidget = {
          mount: mount, boot: boot,
          _logic: { decide: decide, pickItem: pickItem, stockTotal: stockTotal, TIMING: TIMING, isOpen: isOpen, isNight: isNight, fmt: fmt, topUnit: topUnit,
            MEALS: MEALS, CUSTS: CUSTS, villagerWeight: villagerWeight, custWeightOf: custWeightOf, custById: custById, prefOf: prefOf, UPGRADES: UPGRADES,
            CATFOODS: CATFOODS, catTierNow: catTierNow, catFoodMul: catFoodMul, catThiefCut: catThiefCut, ACH_TIERS: ACH_TIERS, ACH_TIER: ACH_TIER,
            SPONSORS: SPONSORS, sponsorById: sponsorById, sponsorActive: sponsorActive,
            sponsorDaily: sponsorDaily, sponsorFame: sponsorFame, sponsorFlow: sponsorFlow,
            /* v0.11 故事/机制侧：常客名册与排班、小费、世界碎片、回本天数——纯函数，test/logic.mjs 直接测 */
            REGULARS: regList(), REG_PERIOD: REG_PERIOD, REG_MAX_DAY: REG_MAX_DAY, REG_TIP_AFTER: REG_TIP_AFTER,
            regularById: regularById, regularsDueToday: regularsDueToday, regularTip: regularTip,
            WORLDS: WORLDS, nextWorldLine: nextWorldLine, paybackText: paybackText,
            /* v0.11 机制侧：陈列位与套装也是纯函数，test/logic.mjs 可以直接测 */
            SLOT_N: SLOT_N, normSlots: normSlots, fillSlots: fillSlots, slotItems: slotItems,
            pickFromSlots: pickFromSlots, pickFromSlotsPref: pickFromSlotsPref,
            SETS: SETS, setMissing: setMissing, setsMul: setsMul, displayOn: displayOn, displayFull: displayFull, upById: upById,
            /* v0.21 收益来源的唯一真源：装修客流/客单价表与合计、摘件重算 —— 经营页、回本估算、配速模拟器共用 */
            FLOW_ITEMS: FLOW_ITEMS, PRICE_ITEMS: PRICE_ITEMS,
            flowMulOf: flowMulOf, priceMulOf: priceMulOf, flowParts: flowParts, priceParts: priceParts,
            flowMulWithout: flowMulWithout, priceMulWithout: priceMulWithout,
            /* v0.11 无尽模式：交接判定、传家宝——纯函数，脚本可直接模拟「跑到通关 → 交给下一位」 */
            BOONS: BOONS, boonById: boonById, clearedNow: clearedNow, applyBoon: applyBoon, boonFlow: boonFlow,
            /* v0.11 天气/集市日：抽签、倍率、判定全是纯函数，脚本可以直接跑 30 天分布 */
            WEATHER_ROLL: WEATHER_ROLL, WEATHER_MUL: WEATHER_MUL, normWeather: normWeather,
            weatherFlow: weatherFlow, weatherPrice: weatherPrice, rollWeather: rollWeather,
            isMarketDay: isMarketDay, isLanternDay: isLanternDay, festOn: festOn,
            festFlow: festFlow, festPrice: festPrice,
            /* v0.12.2 并发保护：磁盘档该不该收编 —— 纯函数，node 里就能测「旧档不盖新档」 */
            diskIsNewer: diskIsNewer,
            /* v0.12.3 打烊提示：净赚 + 明日天气 + 集市日，纯函数，脚本可直接验三种情形 */
            closeHint: closeHint, WEATHER_CN: WEATHER_CN,
            /* v0.14 心愿页 / 城建 / 成就 / 四季 / 常客四级 / 存档往返：全是纯函数，node 里可直接对 */
            dreamLore: dreamLore, townLore: townLore, achLore: achLore, closeLore: closeLore,
            dreamById: dreamById, townById: townById, townIndex: townIndex, townOpen: townOpen, hasIn: hasIn,
            moneyOf: moneyOf, achCtx: achCtx, achHit: achHit, achMissing: achMissing,
            seasonOf: seasonOf, seasonsSeen: seasonsSeen, seasonWord: seasonWord, SEASON_CN: SEASON_CN,
            REG_LEVELS: REG_LEVELS, REG_LEVEL_CN: REG_LEVEL_CN, regLevel: regLevel, regLevelName: regLevelName,
            buildSave: buildSave, importSave: importSave, SAVE_SKIP: SAVE_SKIP,
            /* v0.13 文案包接入：lore 有没有、取了哪段，脚本里都能直接对（无 lore 时全部降级） */
            lorePack: lorePack, itemLore: itemLore, custLine: custLine, regQuip: regQuip,
            /* v0.13 长线台词：常客第 3/6/10 次的故事段、街面事件——纯函数，取不到 lore 时返回空串 */
            regStory: regStory, eventLine: eventLine,
            /* v0.13 客人三态 / 看天自言自语 / 每日一句并池：纯函数，脚本里能直接验「不连着重复」「池子 80 条」 */
            custSay: custSay, weatherLine: weatherLine, worldPool: worldPool, pickFresh: pickFresh,
            /* v0.13 里程碑/小结：纯函数，test/logic.mjs 可以直接测（没 lore 时返回空） */
            MILESTONE_COUNTER: MILESTONE_COUNTER, milestoneList: milestoneList, milestoneHit: milestoneHit,
            regNamePool: regNamePool, regList: regList, REG_TEMPLATES: REG_TEMPLATES,
            REG_FALLBACK_NAMES: REG_FALLBACK_NAMES, REG_QUIP_AFTER: REG_QUIP_AFTER,
            /* v0.16 §9 墙钟：法阵表、离线口径、日历天数、集市窗口 —— 纯函数，pacing 模拟器与测试直接调 */
            RITES: RITES, RITE_KEYS: RITE_KEYS, riteDur: riteDur, riteLeft: riteLeft, riteState: riteState,
            CATCH_RATE: CATCH_RATE, CATCH_MAX_MS: CATCH_MAX_MS, REAL_DAY_MS: REAL_DAY_MS,
            calDays: calDays, marketRound: marketRound, marketOpen: marketOpen,
            MARKET_EVERY_DAYS: MARKET_EVERY_DAYS, MARKET_HOLD_MS: MARKET_HOLD_MS,
            SEASON_DAYS: SEASON_DAYS, SEASON_GOODS: SEASON_GOODS, seasonGoodOf: seasonGoodOf,
            MARKET_GOODS: MARKET_GOODS, marketGoodOn: marketGoodOn,
            PULL: PULL, TIERS: TIERS, CHANNELS: CHANNELS, coreCusts: coreCusts }
        };

        if (!window.__MAGIC_SHOP_NO_AUTOBOOT) {
          if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { boot(); });
          else boot();
        } else if (!window.__MAGIC_SHOP_WATCHDOG__) {
          /* 兜底：宿主没有调 apply()（或调得太早没挂上）时，自己补一次 */
          window.__MAGIC_SHOP_WATCHDOG__ = true;
          setTimeout(function () { if (!window.__MAGIC_SHOP_MOUNTED__) boot(); }, 3000);
        }
      })();


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
