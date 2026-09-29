// =====================================================================
//  LANGUAGES: English + 简体中文. tr('id', args...) looks up a line.
// =====================================================================
const LANGS = { en: 'English', zh: '中文' };
let LANG = 'en', LANG_CHOSEN = false;
try { const l = localStorage.getItem('shatterline.lang'); if (LANGS[l]) { LANG = l; LANG_CHOSEN = true; } } catch (e) {}
function setLang(l) {
  LANG = l; LANG_CHOSEN = true;
  try { localStorage.setItem('shatterline.lang', l); } catch (e) {}
  try { document.documentElement.lang = l === 'zh' ? 'zh-CN' : 'en'; } catch (e) {}
  try { if (l === 'zh' && document.fonts) document.fonts.load('700 16px "Noto Sans SC"', '中文字体').catch(() => {}); } catch (e) {}
}
if (LANG === 'zh') setLang('zh');

const STR = {
  en: {
    combo: 'COMBO', early_call: 'EARLY CALL  +{0}', wave: 'WAVE {0}', boss_incoming: 'BOSS INCOMING', final_wave: 'FINAL WAVE',
    cond_noBounty: 'NO BOUNTY · BUILD MINTS', cond_air: 'AIR RAID · BUILD FLAK', cond_shielded: 'HEAVY SHIELDS · USE EMP OR PRISM',
    warden: 'WARDEN', armored_boss: 'ARMORED BOSS', warden_x: 'WARDEN ×{0}', tower_lv: 'LEVEL {0}', level_n: 'LEVEL {0}',
    m_10: 'NICE', m_25: 'AWESOME', m_50: 'UNREAL', m_100: 'LEGENDARY', m_200: 'GODLIKE',
    combo_gold: '{0} COMBO  +{1} GOLD', combo_only: '{0} COMBO', shattered: 'SHATTERED', warden_down: 'WARDEN DOWN', warden_down_gold: 'WARDEN DOWN  +{0}',
    wave_clear: 'WAVE {0} CLEAR', wave_clear_gold: 'WAVE {0} CLEAR  +{1}',
    mode_first: 'FIRST', mode_strong: 'STRONG', mode_close: 'CLOSE',
    mdesc_first: 'Shoots the enemy closest to your core', mdesc_strong: 'Shoots the toughest enemy in range', mdesc_close: 'Shoots the nearest enemy',
    start: 'START', send_wave: 'SEND WAVE {0}', next_wave: 'NEXT WAVE', next_sub: '+{0} GOLD · {1}s', incoming: 'INCOMING',
    hold_slide: 'HOLD, THEN SLIDE', need_gold: 'NEED {0} MORE GOLD', aim: 'AIM {0}', target_x: 'TARGET {0}', max: 'MAX',
    letgo_build: 'LET GO TO BUILD', letgo_upgrade: 'LET GO TO UPGRADE', letgo_turn: 'LET GO TO TURN', letgo_switch: 'LET GO TO SWITCH', letgo_sell: 'LET GO TO SELL',
    turn_to: 'TURN TO {0}', rail_turn: 'Rail only fires down its line. Turn it onto a lane.',
    sell_x: 'SELL {0}', refund: 'Refund {0} gold (70% of what you spent)', up_title: 'LEVEL {0}  ·  {1}', target_title: 'TARGET {0} → {1}',
    slide_letgo: 'TAP A TOWER TO BUILD IT', tut_hold: 'TAP AN EMPTY TILE TO BUILD', tut_send: 'READY? SEND THE FIRST WAVE ↓',
    paused: 'PAUSED', pause_sub: 'LEVEL {0}  ·  WAVE {1}/{2}', resume: 'RESUME', restart: 'RESTART', tap_confirm: 'TAP TO CONFIRM', level_map: 'LEVEL MAP',
    menu_thumb: 'MENU: {0}', thumb_auto: 'AUTO', thumb_left: 'LEFT THUMB', thumb_right: 'RIGHT THUMB',
    thumb_sub_auto: 'GUESSES FROM WHERE YOU TOUCH', thumb_sub_fixed: 'MENU LEANS AWAY FROM THIS THUMB',
    complete: 'COMPLETE!', core_shattered: 'CORE SHATTERED', end_stats: '{0}/{1} LIVES  ·  {2} KILLS  ·  COMBO x{3}',
    new_tower_unlocked: 'NEW TOWER UNLOCKED', plus_slot: '+1 LOADOUT SLOT', plus_slot_line: 'You can now bring 4 towers into each level.',
    reached_wave: 'YOU REACHED WAVE {0} OF {1}', tip: 'TIP', next_level: 'NEXT LEVEL', all_clear: 'ALL CLEAR!', retry: 'RETRY', map: 'MAP', try_again: 'TRY AGAIN',
    upright: 'BEST PLAYED WITH YOUR PHONE UPRIGHT', subtitle: 'A GLOWFORMS TOWER DEFENSE', continue: 'CONTINUE', play: 'PLAY',
    title_footer: '{0} levels  ·  {1} worlds  ·  {2} towers to unlock',
    test_on: 'TEST MODE: ON', test_off: 'TEST MODE: OFF', test_sub_on: 'ALL {0} LEVELS + TOWERS OPEN', test_sub_off: 'TAP TO OPEN ALL LEVELS', test_mode: 'TEST MODE',
    more_levels: 'MORE LEVELS COMING', badge_tower: 'NEW TOWER', badge_enemy: 'NEW ENEMY', two_portals: '2 PORTALS', beat_first: 'BEAT LEVEL {0} FIRST',
    replay: 'REPLAY', play_n: 'PLAY  {0}', boss_level: 'BOSS LEVEL', world_sub: 'WORLD {0} · {1}',
    min_one: 'Bring at least one tower.', loadout_full: 'Loadout full. Tap a chosen tower to remove it first.',
    card_sub: 'WORLD {0} · {1}{2}  ·  {3} WAVES', boss_suffix: ' · BOSS', star_rules: '★★★ lose no lives   ·   ★★ lose 3 or fewer',
    enemies: 'ENEMIES', loadout: 'LOADOUT', new: 'NEW', need: 'NEED', info_unlock: '{0}: unlocks at level {1}',
    info_new: 'NEW  {0}: {1}', info_new_tower: 'NEW TOWER  {0}: {1}', info_two: 'NEW  Enemies pour in from two portals!', info_boss: 'A Warden boss arrives in the final wave.',
    bring: 'BRING', add: 'ADD', play_without: 'PLAY WITHOUT IT',
    confirm_noBounty: 'Enemies drop no gold on this level. Are you sure you want to play without {0}?',
    confirm_air: 'Gliders fly over the path and only {0} can hit them. Are you sure you want to play without it?',
    confirm_shielded: 'This level has heavy shield usage. Are you sure you want to play without {0}?',
    info_light: 'Some enemies carry shields. EMP or PRISM helps, but you can manage without.',
    shield_badge: 'SHIELD', shielded_note: 'Shielded here: takes 20% damage until an EMP strips it.', stripped: 'STRIPPED', dome_down: 'DOME DOWN',
    elec_badge: 'ELECTRIC', ice_badge: 'ICED', shorted: 'SHORTED', supercharged: 'SUPERCHARGED', chilled: 'CHILLED', frozen: 'FROZEN',
    elec_note: 'Electrified here: towers right next to it shut down for 4s. ARC gets supercharged. EMP shorts it out.',
    ice_note: 'Iced here: throws snowballs that slow towers in range for 5s. FROST gets supercharged.',
    info_elec: 'Some enemies are electrified: towers right next to them shut down. ARC and EMP help.',
    info_ice: 'Some enemies are iced: their snowballs slow your towers. FROST loves it.',
    world_from: 'WORLD {0} · FROM LEVEL {1}', world_n: 'WORLD {0}',
    s_dmg: 'DMG', s_dps: 'DPS', s_gold: 'GOLD', s_every: 'EVERY', s_boost: 'BOOST', s_chain: 'CHAIN', s_slow: 'SLOW', s_blast: 'BLAST', s_range: 'RANGE', s_shield: 'SHIELD', s_brittle: '+BRITTLE', s_rate: 'RATE', sec: 's',
    choose_lang: 'CHOOSE LANGUAGE',
  },
  zh: {
    combo: '连击', early_call: '提前召唤  +{0}', wave: '第 {0} 波', boss_incoming: '首领来袭', final_wave: '最后一波',
    cond_noBounty: '无赏金 · 建造铸币塔', cond_air: '空袭 · 建造防空塔', cond_shielded: '重护盾 · 使用电磁或棱镜',
    warden: '守卫者', armored_boss: '重甲首领', warden_x: '守卫者 ×{0}', tower_lv: '{0} 级', level_n: '第 {0} 关',
    m_10: '漂亮', m_25: '太棒了', m_50: '不可思议', m_100: '传奇', m_200: '神级',
    combo_gold: '{0} 连击  +{1} 金币', combo_only: '{0} 连击', shattered: '粉碎！', warden_down: '守卫者被击碎', warden_down_gold: '守卫者被击碎  +{0}',
    wave_clear: '第 {0} 波清除', wave_clear_gold: '第 {0} 波清除  +{1}',
    mode_first: '最前', mode_strong: '最强', mode_close: '最近',
    mdesc_first: '攻击最接近核心的敌人', mdesc_strong: '攻击范围内最强的敌人', mdesc_close: '攻击最近的敌人',
    start: '开始', send_wave: '派出第 {0} 波', next_wave: '下一波', next_sub: '+{0} 金币 · {1}秒', incoming: '来袭中',
    hold_slide: '按住，再滑动', need_gold: '还需 {0} 金币', aim: '瞄准 {0}', target_x: '目标：{0}', max: '满级',
    letgo_build: '松手即可建造', letgo_upgrade: '松手即可升级', letgo_turn: '松手即可转向', letgo_switch: '松手即可切换', letgo_sell: '松手即可出售',
    turn_to: '转向 {0}', rail_turn: '轨道炮只沿直线射击，把它转向道路。',
    sell_x: '出售{0}', refund: '返还 {0} 金币（花费的 70%）', up_title: '{0} 级  ·  {1}', target_title: '目标 {0} → {1}',
    slide_letgo: '点一座塔来建造', tut_hold: '点一块空地来建造', tut_send: '准备好了？派出第一波 ↓',
    paused: '已暂停', pause_sub: '第 {0} 关  ·  第 {1}/{2} 波', resume: '继续', restart: '重新开始', tap_confirm: '再点一次确认', level_map: '关卡地图',
    menu_thumb: '菜单：{0}', thumb_auto: '自动', thumb_left: '左手拇指', thumb_right: '右手拇指',
    thumb_sub_auto: '根据触摸位置判断', thumb_sub_fixed: '菜单避开这根拇指',
    complete: '过关！', core_shattered: '核心被击碎', end_stats: '生命 {0}/{1}  ·  击杀 {2}  ·  连击 x{3}',
    new_tower_unlocked: '解锁新塔', plus_slot: '+1 出战栏位', plus_slot_line: '现在每关可以带 4 座塔。',
    reached_wave: '你坚持到了第 {0}/{1} 波', tip: '提示', next_level: '下一关', all_clear: '全部通关！', retry: '重试', map: '地图', try_again: '再试一次',
    upright: '竖屏游玩效果最佳', subtitle: '霓虹几何塔防', continue: '继续', play: '开始',
    title_footer: '{0} 关  ·  {1} 个世界  ·  {2} 座塔待解锁',
    test_on: '测试模式：开', test_off: '测试模式：关', test_sub_on: '全部 {0} 关与塔已开放', test_sub_off: '点击开放全部关卡', test_mode: '测试模式',
    more_levels: '更多关卡即将推出', badge_tower: '新塔', badge_enemy: '新敌人', two_portals: '双传送门', beat_first: '请先通过第 {0} 关',
    replay: '重玩', play_n: '开始 {0}', boss_level: '首领关', world_sub: '世界 {0} · {1}',
    min_one: '至少带一座塔。', loadout_full: '出战栏已满。先点击已选的塔将其移除。',
    card_sub: '世界 {0} · {1}{2}  ·  {3} 波', boss_suffix: ' · 首领', star_rules: '★★★ 不失生命   ·   ★★ 最多失去 3 条',
    enemies: '敌人', loadout: '出战塔', new: '新', need: '需要', info_unlock: '{0}：第 {1} 关解锁',
    info_new: '新  {0}：{1}', info_new_tower: '新塔  {0}：{1}', info_two: '新  敌人从两个传送门涌入！', info_boss: '守卫者首领将在最后一波出现。',
    bring: '携带', add: '加入', play_without: '不带也开始',
    confirm_noBounty: '本关敌人不掉落金币。确定不带{0}就开始吗？',
    confirm_air: '滑翔者会飞越道路，只有{0}能击中它们。确定不带就开始吗？',
    confirm_shielded: '本关大量敌人带护盾。确定不带{0}就开始吗？',
    info_light: '部分敌人带护盾。电磁或棱镜有帮助，但不带也能应付。',
    shield_badge: '护盾', shielded_note: '本关带护盾：被电磁剥除前只受 20% 伤害。', stripped: '已剥除', dome_down: '护罩破碎',
    elec_badge: '带电', ice_badge: '冰霜', shorted: '短路', supercharged: '超载！', chilled: '冻僵', frozen: '冻结',
    elec_note: '本关带电：紧挨着它的塔会短路 4 秒。电弧塔反而会超载。电磁能让它短路。',
    ice_note: '本关带冰霜：扔出雪球，让范围内的塔 5 秒内变慢。冰霜塔反而会超载。',
    info_elec: '部分敌人带电：紧挨着它们的塔会短路。电弧和电磁有帮助。',
    info_ice: '部分敌人带冰霜：它们的雪球会让塔变慢。冰霜塔会因此超载。',
    world_from: '世界 {0} · 第 {1} 关起', world_n: '世界 {0}',
    s_dmg: '伤害', s_dps: '秒伤', s_gold: '金币', s_every: '间隔', s_boost: '增益', s_chain: '连锁', s_slow: '减速', s_blast: '爆炸', s_range: '射程', s_shield: '破盾', s_brittle: '+易碎', s_rate: '射速', sec: '秒',
    choose_lang: '选择语言',
  },
};
function tr(id, ...a) {
  const s = (STR[LANG] && STR[LANG][id]) || STR.en[id] || id;
  return s.replace(/\{(\d)\}/g, (_, i) => a[i] != null ? a[i] : '');
}

const ZH = {
  tower: { bolt: '光弹', frost: '冰霜', nova: '新星', arc: '电弧', emp: '电磁', mint: '铸币', prism: '棱镜', rail: '轨道炮', beacon: '信标', flak: '防空' },
  towerDesc: {
    bolt: '快速光弹，可暴击。', frost: '冰冻脉冲，减速附近所有敌人。被雪球击中会超载。', nova: '等离子炸弹，范围伤害，无视护甲。', arc: '在敌人之间连锁的闪电。带电敌人会让它超载。',
    emp: '最多 4 道激光专找护盾：剥除护盾、击破护罩、让带电敌人短路。几乎没有伤害。', mint: '波次进行时不断产出金币。', prism: '光束越烧越强，穿透护甲和护盾。',
    rail: '沿一条固定直线射击，贯穿线上所有敌人。', beacon: '提升相邻塔的伤害。', flak: '防空导弹。唯一能击中飞行敌人的塔。',
  },
  enemy: { grunt: '方块', scout: '飞镖', splitter: '孢子', mite: '螨虫', brute: '壁垒', boss: '守卫者', aegis: '神盾', blink: '闪烁', mender: '治愈者', titan: '泰坦', glider: '滑翔者', volt: '伏特', yeti: '雪怪' },
  enemyDesc: {
    grunt: '最基础的行走者。', scout: '速度快但很脆弱。', splitter: '被摧毁时分裂成 3 只螨虫。', mite: '小而快。', brute: '重甲：小伤害几乎无效。',
    boss: '首领：厚重护甲，生命值极高。', aegis: '投射随行护罩，罩内敌人只受 20% 伤害。电磁可将其击破。', blink: '每隔几秒向前瞬移。',
    mender: '治疗附近的敌人。优先消灭它。', titan: '巨大、缓慢且重甲。', glider: '直线飞越道路。只有防空塔能击中。',
    volt: '带电：紧挨着它的塔会短路 4 秒。电弧塔反而会超载。电磁能让它短路。',
    yeti: '每秒向范围内所有塔扔雪球。被击中的塔 5 秒内攻速大减。冰霜塔反而会超载。',
  },
  world: ['虚空', '深渊', '余烬', '糖果', '极光', '烈日', '冰川', '剧毒'],
  cond: {
    noBounty: ['无赏金', '敌人不掉落金币。铸币塔是唯一收入。'],
    air: ['空袭', '滑翔者飞越道路，只有防空塔能击中。'],
    shielded: ['重护盾', '大量敌人带护盾。带电磁或棱镜。'],
  },
  tips: {
    grunt: '在道路拐角处建塔，一座塔能覆盖两条路。',
    scout: '飞镖很快。冰霜塔能让它们减速，给你的塔更多射击时间。',
    splitter: '孢子会分裂成螨虫。新星的范围伤害和电弧的连锁能清理它们。',
    mite: '螨虫来自孢子。范围伤害最适合对付成群的敌人。',
    brute: '壁垒有护甲。新星、棱镜和轨道炮的伤害足以击穿。',
    boss: '守卫者是重甲首领。棱镜的光束会越烧越强并无视护甲。',
    aegis: '神盾的护罩让罩内敌人只受 20% 伤害。把电磁塔放在它经过的地方即可击破，或用棱镜狙击神盾。',
    shield: '带蓝色光环的敌人有护盾，只受 20% 伤害。在它们进场处放一座电磁塔，或用棱镜直接穿透。',
    blink: '闪烁会向前瞬移。把塔分布在整条道路上。',
    volt: '带电的敌人会让紧挨着它的塔短路。把电磁塔放远一点先让它们短路，或带上电弧塔：电会让它超载。',
    yeti: '雪球会让你的塔变慢。在它经过的地方放冰霜塔：雪球会让它超载，三次冲击就能把敌人冻住。',
    mender: '治愈者会治疗同伴。把塔设为攻击“最强”，或用轨道炮狙击。',
    titan: '泰坦巨大且有护甲。在同一个拐角集中升级过的塔。',
    glider: '滑翔者直线飞向核心。只有防空塔能击中它们。在飞行线下方建造防空塔。',
    nobounty: '无赏金关卡：敌人不掉落金币。尽早建造铸币塔并升级，这是你唯一的收入。',
  },
};
const tName = k => LANG === 'zh' ? ZH.tower[k] || TOWERS[k].name : TOWERS[k].name;
const tDesc = k => LANG === 'zh' ? ZH.towerDesc[k] || TOWERS[k].desc : TOWERS[k].desc;
const eName = k => LANG === 'zh' ? ZH.enemy[k] || ENEMIES[k].name : ENEMIES[k].name;
const eDesc = k => LANG === 'zh' ? ZH.enemyDesc[k] || ENEMIES[k].desc : (ENEMIES[k].desc || 'Tiny and quick.');
const wName = i => LANG === 'zh' ? ZH.world[i] || THEMES[i].name : THEMES[i].name;
const condTag = k => LANG === 'zh' ? ZH.cond[k][0] : CONDITIONS[k].tag;
const condLine = k => LANG === 'zh' ? ZH.cond[k][1] : CONDITIONS[k].line;
