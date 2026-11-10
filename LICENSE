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
