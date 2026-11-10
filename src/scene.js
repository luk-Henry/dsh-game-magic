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
