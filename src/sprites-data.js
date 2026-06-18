// BLOODRUN.exe — Pixel sprite renderer
// Sprites are arrays of strings, one char per pixel. The palette map turns chars into colors.
// Render with <PixelSprite data={...} scale={4} palette={...} />

export const REAPER_PALETTE = {
  '.': 'transparent',
  'k': '#000000',
  'r': '#5A0A0E',   // deepest red robe shadow
  'R': '#A11018',   // mid red robe
  'X': '#C8161D',   // robe highlight body
  'B': '#E62028',   // bright red trim/accent
  'b': '#EFE7D2',   // bone (skull/scythe)
  'd': '#8a7a60',   // bone shadow / cheekbone
  'e': '#ffffff',   // glint in eye socket
  's': '#3a2615',   // scythe shaft (dark wood)
  'S': '#7a5c3a',   // scythe shaft highlight
  'y': '#F5A524',   // amber (lantern)
  'o': '#FF6A1A',
};

// 18w × 26h reaper, idle frame A
export const REAPER_IDLE_A = [
  '.....s............',
  '.....s..bbb.......',
  '....kkkks.bbb.....',
  '...krrrrkbb.bb....',
  '..krrRRRrSkbbbb...',
  '..krRRRRRrS.bbb...',
  '.krRkkkkkkRrS.b...',
  '.krRkbddbbkRrSk...',
  '.krRkekbkekkRrS...',
  '.krRkbkbbkbkRrSk..',
  '.krRRkbbbbkRRrSk..',
  '.krRRkkbbkkRRrSk..',
  '.krRRRRRRRRRRrSk..',
  '.krRRRRRRRRRRrSks.',
  'krrRRRBRRBRRRRrks.',
  'krrRRRRRRRRRRRrk..',
  'krrRRRRRRRRRRRrk..',
  'krrRRRRBBBBRRRrk..',
  'krrRRRRRRRRRRRrk..',
  'krrRRRRRRRRRRRrk..',
  '.krRRRRRRRRRRrk...',
  '.krRRRRRRRRRRrk...',
  '.krrRRRRRRRRRrk...',
  'krrRRRRRRRRRRrrk..',
  'kkrkkrrkkrrkkrkk..',
  '..k..kk..kk..k....',
];

// idle frame B — gentle breath
export const REAPER_IDLE_B = [
  '..................',
  '.....s............',
  '.....s..bbb.......',
  '....kkkks.bbb.....',
  '...krrrrkbb.bb....',
  '..krrRRRrSkbbbb...',
  '..krRRRRRrS.bbb...',
  '.krRkkkkkkRrS.b...',
  '.krRkbddbbkRrSk...',
  '.krRkekbkekkRrS...',
  '.krRkbkbbkbkRrSk..',
  '.krRRkbbbbkRRrSk..',
  '.krRRkkbbkkRRrSk..',
  '.krRRRRRRRRRRrSk..',
  '.krRRRRRRRRRRrSks.',
  'krrRRRBRRBRRRRrks.',
  'krrRRRRRRRRRRRrk..',
  'krrRRRRRRRRRRRrk..',
  'krrRRRRBBBBRRRrk..',
  'krrRRRRRRRRRRRrk..',
  'krrRRRRRRRRRRRrk..',
  '.krRRRRRRRRRRrk...',
  '.krRRRRRRRRRRrk...',
  '.krrRRRRRRRRRrk...',
  'krrRRRRRRRRRRrrk..',
  'kkrkkrrkkrrkkrkk..',
];

// walk frame A — cloak hem sways LEFT
export const REAPER_WALK_A = [
  '.....s............',
  '.....s..bbb.......',
  '....kkkks.bbb.....',
  '...krrrrkbb.bb....',
  '..krrRRRrSkbbbb...',
  '..krRRRRRrS.bbb...',
  '.krRkkkkkkRrS.b...',
  '.krRkbddbbkRrSk...',
  '.krRkekbkekkRrS...',
  '.krRkbkbbkbkRrSk..',
  '.krRRkbbbbkRRrSk..',
  '.krRRkkbbkkRRrSk..',
  '.krRRRRRRRRRRrSk..',
  '.krRRRRRRRRRRrSks.',
  'krrRRRBRRBRRRRrks.',
  'krrRRRRRRRRRRRrk..',
  'krrRRRRRRRRRRRrk..',
  'krrRRRRBBBBRRRrk..',
  'krrRRRRRRRRRRRrk..',
  '.krRRRRRRRRRRrk...',
  '.krRRRRRRRRRRrkk..',
  'krrRRRRRRRRRRrk...',
  'krrRRRRRRRRRrkk...',
  '.krRRRRRRRRRrk....',
  'kkrkkrrkkrrkkk....',
  '..k..kk..k..k.....',
];

// walk frame B — cloak hem sways RIGHT
export const REAPER_WALK_B = [
  '.....s............',
  '.....s..bbb.......',
  '....kkkks.bbb.....',
  '...krrrrkbb.bb....',
  '..krrRRRrSkbbbb...',
  '..krRRRRRrS.bbb...',
  '.krRkkkkkkRrS.b...',
  '.krRkbddbbkRrSk...',
  '.krRkekbkekkRrS...',
  '.krRkbkbbkbkRrSk..',
  '.krRRkbbbbkRRrSk..',
  '.krRRkkbbkkRRrSk..',
  '.krRRRRRRRRRRrSk..',
  '.krRRRRRRRRRRrSks.',
  'krrRRRBRRBRRRRrks.',
  'krrRRRRRRRRRRRrk..',
  'krrRRRRRRRRRRRrk..',
  'krrRRRRBBBBRRRrk..',
  'krrRRRRRRRRRRRrk..',
  '.krRRRRRRRRRRrkk..',
  '.krRRRRRRRRRRRrk..',
  'krrRRRRRRRRRRRrk..',
  'krrkRRRRRRRRRRrk..',
  '.krkrRRRRRRRRrk...',
  'kkkkkrrkkrrkkrkk..',
  '.....k..kk..k.k...',
];

// attack frame — scythe swept across body
export const REAPER_ATTACK = [
  '..................',
  '..................',
  '....kkkkk.........',
  '...krrrrrk........',
  '..krrRRRRrk.......',
  '..krRRRRRRk.......',
  '.krRkkkkkkRk......',
  '.krRkbddbbkRk.....',
  '.krRkekbkekRk.....',
  '.krRkbkbbkbkRk....',
  '.krRRkbbbbkRRk....',
  '.krRRkkbbkkRRk....',
  '.krRRRRRRRRRRk....',
  '.krRRRRRRRRRRk....',
  'krrRRRBRRBRRRRrk..',
  'krrRRRRRRRRRRRrkb.',
  'krrRRRRRRRRRRRkbb.',
  'krrRRRRBBBBRRRksbb',
  'krrRRRRRRRRRRRksbb',
  'krrRRRRRRRRRRRrk.b',
  '.krRRRRRRRRRRrk...',
  '.krRRRRRRRRRRrk...',
  '.krrRRRRRRRRRrk...',
  'krrRRRRRRRRRRrrk..',
  'kkrkkrrkkrrkkrkk..',
  '..k..kk..kk..k....',
];

// FOUL CHILD - 12w 14h
export const FOUL_CHILD = [
  '...kkkkkk...',
  '..kbbbbbbk..',
  '.kbbBBBBbbk.',
  '.kbBBkkBBBk.',
  '.kbBkkkkBBk.',
  '.kbBBBBBBBk.',
  '..kkbbbbkk..',
  '..krRRRRrk..',
  '..krRRRRrk..',
  '..krRRRRrk..',
  '.kbkrRRrkbk.',
  '.kbkkrrkkbk.',
  '..kk.kk.kk..',
  '...........',
];

// WATCHER — 16w 16h — eye in a cube enemy, sickly green
export const PAL_GREEN = {
  '.': 'transparent',
  'k': '#000000',
  'g': '#2A6E1E',
  'G': '#6BCC4D',
  'L': '#A8E893',
  'e': '#ffffff',
  'r': '#7A1014',
  'B': '#E62028',
};
export const WATCHER = [
  '..kkkkkkkkkkkk..',
  '.kggggggggggggk.',
  'kgGGGGGGGGGGGGk.',
  'kgGGGGGGGGGGGGk.',
  'kgGGgkkkkkkgGGk.',
  'kgGGkLLLLLLkgGk.',
  'kgGgLLeeeeLLgGk.',
  'kgGgLeBBBBeLgGk.',
  'kgGgLeBkkBeLgGk.',
  'kgGgLLeeeeLLgGk.',
  'kgGGkLLLLLLkgGk.',
  'kgGGgkkkkkkgGGk.',
  'kgGGGGGGGGGGGGk.',
  'kgggggggggggggk.',
  'kkkkkkkkkkkkkkk.',
  '................',
];

// SKULL — small floating skull/spirit
export const SKULL = [
  '..kkkkkk..',
  '.kbbbbbbk.',
  'kbBBBBBBbk',
  'kbBkkBkBbk',
  'kbBkbkBBbk',
  'kbBBBBBBbk',
  'kbBkbkbkBk',
  'kbBkbkbkBk',
  '.kbbbbbbk.',
  '..kkkkkk..',
];

// HEART pickup
export const HEART_PICKUP = [
  '.kk..kk.',
  'kBBkkBBk',
  'kBRRRBBk',
  'kBRRRRBk',
  '.kRRRRk.',
  '..kRRk..',
  '...kk...',
  '........',
];

// SCYTHE PROJECTILE - 8x4
export const SCYTHE_ARC = [
  '...BBBB.',
  '..BBkkBB',
  '.BBkkkBB',
  '..BBBBB.',
];

// FLOOR TILE (16x8) — cracked stone
export const TILE_STONE = [
  'kkkkkkkkkkkkkkkk',
  'kggggggkggggggkk',
  'kgGgggggkgGggggk',
  'kggGgggkgggGggk.',
  'kkkkkkkkkkkkkkkk',
  'kggggkggggggggk.',
  'kgGggkgGgggGggk.',
  'kkkkkkkkkkkkkkkk',
];
export const PAL_STONE_RED = {
  '.': 'transparent',
  'k': '#000000',
  'g': '#3a1a18',
  'G': '#7A1014',
};
export const PAL_STONE_GREEN = {
  '.': 'transparent',
  'k': '#000000',
  'g': '#1a2a18',
  'G': '#2A6E1E',
};
export const PAL_STONE_AMBER = {
  '.': 'transparent',
  'k': '#000000',
  'g': '#3a2a10',
  'G': '#8A5A12',
};

// LANTERN background prop
export const LANTERN = [
  '...kkk...',
  '..kyyyk..',
  '.kyoyoyk.',
  '.kyooyok.',
  '.kyoyoyk.',
  '..kyyyk..',
  '...kkk...',
  '....k....',
];
export const PAL_LANTERN = {
  '.': 'transparent',
  'k': '#000000',
  'y': '#F5A524',
  'o': '#FF6A1A',
};

// MOTH (from the title screen)
export const MOTH = [
  '..kkk..kkk..',
  '.kBBBkkBBBk.',
  'kBRRBkkBRRBk',
  'kBRkRBkkRkBk',
  '.kBRRBkBRRBk',
  '..kBBkkBBk..',
  '...kk..kk...',
];

// === IMAGE SPRITE FRAMES ==================================================
// Player + 3 enemies, sliced from 4×3 sheets (4 frames per row × 3 actions).
// Each frame is 362×362 PNG, head pinned at (181, 40), body centroid ~ x=181.
export const SHEET_META = { frameW: 362, frameH: 362, anchorX: 181, anchorY: 40 };

export const REAPER_FRAMES = {
  meta: SHEET_META,
  idle: 'assets/sprites/player_idle_0.png',
  idleCycle: [
    'assets/sprites/player_idle_0.png',
    'assets/sprites/player_idle_1.png',
    'assets/sprites/player_idle_2.png',
    'assets/sprites/player_idle_3.png',
  ],
  walk: [
    'assets/sprites/player_walk_0.png',
    'assets/sprites/player_walk_1.png',
    'assets/sprites/player_walk_2.png',
    'assets/sprites/player_walk_3.png',
  ],
  attack: [
    'assets/sprites/player_atk_0.png',
    'assets/sprites/player_atk_1.png',
    'assets/sprites/player_atk_2.png',
    'assets/sprites/player_atk_3.png',
  ],
};

// Enemy sprite sets — same sheet structure (362×362, 4 idle, 4 walk, 4 atk).
export const ENEMY_FRAMES = {
  meta: SHEET_META,
  skullknife: {
    idle:   ['assets/sprites/skullknife_idle_0.png','assets/sprites/skullknife_idle_1.png','assets/sprites/skullknife_idle_2.png','assets/sprites/skullknife_idle_3.png'],
    walk:   ['assets/sprites/skullknife_walk_0.png','assets/sprites/skullknife_walk_1.png','assets/sprites/skullknife_walk_2.png','assets/sprites/skullknife_walk_3.png'],
    attack: ['assets/sprites/skullknife_atk_0.png','assets/sprites/skullknife_atk_1.png','assets/sprites/skullknife_atk_2.png','assets/sprites/skullknife_atk_3.png'],
  },
  wraith: {
    idle:  ['assets/sprites/wraith_idle_0.png','assets/sprites/wraith_idle_1.png','assets/sprites/wraith_idle_2.png','assets/sprites/wraith_idle_3.png'],
    walk:  ['assets/sprites/wraith_float_0.png','assets/sprites/wraith_float_1.png','assets/sprites/wraith_float_2.png','assets/sprites/wraith_float_3.png'],
    attack:['assets/sprites/wraith_atk_0.png','assets/sprites/wraith_atk_1.png','assets/sprites/wraith_atk_2.png','assets/sprites/wraith_atk_3.png'],
  },
  hound: {
    idle:  ['assets/sprites/hound_idle_0.png','assets/sprites/hound_idle_1.png','assets/sprites/hound_idle_2.png','assets/sprites/hound_idle_3.png'],
    walk:  ['assets/sprites/hound_run_0.png','assets/sprites/hound_run_1.png','assets/sprites/hound_run_2.png','assets/sprites/hound_run_3.png'],
    attack:['assets/sprites/hound_atk_0.png','assets/sprites/hound_atk_1.png','assets/sprites/hound_atk_2.png','assets/sprites/hound_atk_3.png'],
  },

  // ── Sheet-based sprites (1448×1086 = 4 cols × 3 rows of 362×362 frames) ──
  // Same cell format as player/existing enemies — anchorX=181, anchorY=40.
  // `sheet` + `rows` drives drawSheetCell() in screens-game.jsx.
  aphid: {
    sheet: 'assets/sprites/aphid_sprite.png',
    rows:  { idle: 0, walk: 1, attack: 2 },
    frames: 4,
  },
  beetle: {
    sheet: 'assets/sprites/beetle_sprite.png',
    rows:  { idle: 0, walk: 1, attack: 2 },
    frames: 4,
  },
  butterfly: {
    sheet: 'assets/sprites/butterfly_sprite.png',
    rows:  { idle: 0, walk: 1, attack: 2 },
    frames: 4,
  },
  boss_aphid: {
    sheet: 'assets/sprites/boss_aphid_sprite.png',
    rows:  { idle: 0, walk: 1, attack: 2 },
    frames: 4,
  },

  // Boss: 3 animations from Boss Sprite Cuts.html
  //   idle   — 4 frames @ 6 fps  · standing, staff & lantern, cloak sway
  //   cast   — 4 frames @ 8 fps  · floating / channelling, skull projectile orbit
  //   attack — 4 frames @ 10 fps · scythe wind-up → slash → release (one-shot)
  // Source: 362×362 px each, cell anchor matches SHEET_META
  boss: {
    idle:   [
      'assets/sprites/boss/idle_01.png',
      'assets/sprites/boss/idle_02.png',
      'assets/sprites/boss/idle_03.png',
      'assets/sprites/boss/idle_04.png',
    ],
    cast:   [
      'assets/sprites/boss/cast_01.png',
      'assets/sprites/boss/cast_02.png',
      'assets/sprites/boss/cast_03.png',
      'assets/sprites/boss/cast_04.png',
    ],
    attack: [
      'assets/sprites/boss/attack_01.png',
      'assets/sprites/boss/attack_02.png',
      'assets/sprites/boss/attack_03.png',
      'assets/sprites/boss/attack_04.png',
    ],
  },
};

// Preload everything so swapping <img src> mid-animation doesn't stall on decode.
export function preloadSprites() {
  const all = [
    REAPER_FRAMES.idle,
    ...REAPER_FRAMES.walk,
    ...REAPER_FRAMES.attack,
  ];
  for (const e of Object.values(ENEMY_FRAMES)) {
    if (!e.idle) continue;
    all.push(...e.idle);
    if (e.walk)   all.push(...e.walk);
    if (e.attack) all.push(...e.attack);
    if (e.cast)   all.push(...e.cast); // boss has a third animation
  }
  // Large single-frame sprites (deduplicated via Set below)
  all.push(
    'assets/sprites/aphid_sprite.png',
    'assets/sprites/beetle_sprite.png',
    'assets/sprites/butterfly_sprite.png',
    'assets/sprites/boss_aphid_sprite.png',
  );
  for (const src of new Set(all)) {
    const img = new Image();
    img.src = src;
  }
}
