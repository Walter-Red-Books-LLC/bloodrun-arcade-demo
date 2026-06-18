// BLOODRUN.exe — Playable sidescroller / dungeon-room game
// World rendering is fully canvas-based — no React reconciliation for moving entities.

import { useState, useRef, useCallback, useEffect, memo } from 'react';
import { drawSprite, useKey, useGameLoop } from './sprites-engine.jsx';

// ── PNG image cache ───────────────────────────────────────────────────────────
// One HTMLImageElement per src — avoids recreating and re-decoding per frame.
const IMG_CACHE = new Map();
function getImg(src) {
  if (!IMG_CACHE.has(src)) { const el = new Image(); el.src = src; IMG_CACHE.set(src, el); }
  return IMG_CACHE.get(src);
}

// ── Boss color-key cache ──────────────────────────────────────────────────────
// Boss PNGs have an opaque gray background (not alpha). We sample the four
// corners, treat any pixel within THRESH of that color as background, and
// store a background-removed offscreen canvas per frame. Built once per src.
const BOSS_KEYED = new Map();
function getBossKeyed(src) {
  if (BOSS_KEYED.has(src)) return BOSS_KEYED.get(src) || null;
  const img = getImg(src);
  if (!img.complete || !img.naturalWidth) return null; // not loaded yet — try next frame

  const nw = img.naturalWidth, nh = img.naturalHeight;
  const off  = document.createElement('canvas');
  off.width  = nw; off.height = nh;
  const octx = off.getContext('2d', { willReadFrequently: true });
  octx.drawImage(img, 0, 0);

  const idata = octx.getImageData(0, 0, nw, nh);
  const d     = idata.data;

  // Sample all four corners to find the background color
  const corners = [[0,0],[nw-1,0],[0,nh-1],[nw-1,nh-1]];
  let bgR=0, bgG=0, bgB=0;
  for (const [cx,cy] of corners) {
    const i = (cy * nw + cx) * 4;
    bgR += d[i]; bgG += d[i+1]; bgB += d[i+2];
  }
  bgR /= 4; bgG /= 4; bgB /= 4;

  // Zero alpha on any pixel within THRESH of the background color
  const THRESH = 28;
  for (let i = 0; i < d.length; i += 4) {
    if (Math.abs(d[i]-bgR) < THRESH && Math.abs(d[i+1]-bgG) < THRESH && Math.abs(d[i+2]-bgB) < THRESH) {
      d[i+3] = 0;
    }
  }
  octx.putImageData(idata, 0, 0);

  BOSS_KEYED.set(src, off);
  return off;
}

// Draw a PNG sprite so that pixel (anchorX, anchorY) in the source lands at (pivotX, pivotY).
// dir < 0 mirrors horizontally around the pivot.
function drawFootSprite(ctx, src, pivotX, pivotY, scale, dir, anchorX = 181, anchorY = 40, alpha = 1) {
  const img = getImg(src);
  if (!img.complete || !img.naturalWidth) return;
  ctx.save();
  if (alpha !== 1) ctx.globalAlpha = alpha;
  if (dir < 0) { ctx.translate(pivotX * 2, 0); ctx.scale(-1, 1); }
  ctx.drawImage(img,
    pivotX - anchorX * scale,
    pivotY - anchorY * scale,
    img.naturalWidth  * scale,
    img.naturalHeight * scale,
  );
  ctx.restore();
}

// ── Zone background colors ────────────────────────────────────────────────────
const ZONE_BG_INNER = { chapel: '#2a0a0e', sluice: '#071a10', vault: '#2a1808', sanctum: '#1a0002' };
const ZONE_BG_OUTER = { chapel: '#0a0204', sluice: '#020a06', vault: '#0a0602', sanctum: '#060001' };

// ── Sheet-cell renderer ───────────────────────────────────────────────────────
// Sprite sheets are 4 cols × 3 rows of FRAME_SZ×FRAME_SZ cells, same anchor
// convention as individual frames (anchorX=181, anchorY=40).
// getBossKeyed() strips the opaque background on the first call, then the keyed
// canvas is used for all future cell draws — no background leaks into any cell.
const FRAME_SZ  = 362;
const SHEET_COLS = 4;

function drawSheetCell(ctx, sheetSrc, col, row, pivotX, pivotY, scale, dir, filter) {
  const keyed = getBossKeyed(sheetSrc);
  const img   = keyed || getImg(sheetSrc);
  if (!img) return;
  if (!keyed && (!img.complete || !img.naturalWidth)) return;
  ctx.save();
  if (filter) ctx.filter = filter;
  if (dir < 0) { ctx.translate(pivotX * 2, 0); ctx.scale(-1, 1); }
  ctx.drawImage(
    img,
    col * FRAME_SZ, row * FRAME_SZ, FRAME_SZ, FRAME_SZ, // source: one cell
    pivotX - 181 * scale, pivotY - 40 * scale,           // dest position (same anchor)
    FRAME_SZ * scale,     FRAME_SZ * scale,               // dest size
  );
  ctx.restore();
}

// ── Parallax draw (replaces the ParallaxLayer React component) ────────────────
function drawParallax(ctx, cam, zone, mothX) {
  const off = -cam * 0.3;
  // Pillars — skip if off-screen
  for (let i = 0; i < 10; i++) {
    const x = off + i * 180;
    if (x + 66 < 0 || x > GAME_W) continue;
    const grad = ctx.createLinearGradient(x + 25, 30, x + 25, GROUND_Y);
    grad.addColorStop(0, 'transparent');
    grad.addColorStop(0.2, zone.pillars);
    grad.addColorStop(1, zone.pillars);
    ctx.fillStyle = grad;
    ctx.fillRect(x, 30, 50, GROUND_Y - 30);
    ctx.strokeStyle = zone.accent + '22'; ctx.lineWidth = 1;
    ctx.strokeRect(x + 0.5, 30, 49, GROUND_Y - 30);
    ctx.fillStyle = zone.pillars; ctx.fillRect(x - 8, 30, 66, 12);
    ctx.strokeStyle = zone.accent + '33'; ctx.strokeRect(x - 7.5, 30, 65, 12);
  }
  // Arches — skip if off-screen
  const archOff = -cam * 0.18;
  ctx.strokeStyle = zone.accent + '18'; ctx.lineWidth = 1;
  for (let i = 0; i < 7; i++) {
    const cx = archOff + i * 420 + 120;
    if (cx + 120 < 0 || cx - 120 > GAME_W) continue;
    ctx.beginPath(); ctx.arc(cx, 18, 120, Math.PI, 0); ctx.stroke();
  }
  // Moth
  const mx = mothX + off * 0.4;
  const my = 200 + Math.sin(performance.now() / 500) * 8;
  ctx.save(); ctx.globalAlpha = 0.6;
  drawSprite(ctx, MOTH, REAPER_PALETTE, Math.round(mx), Math.round(my), 2, false);
  ctx.restore();
}

// ── Per-zone gradient cache (created once, reused every frame) ────────────────
const ZONE_GRAD_CACHE = {};
function getZoneGradients(ctx, zoneKey, zone) {
  if (ZONE_GRAD_CACHE[zoneKey]) return ZONE_GRAD_CACHE[zoneKey];
  const bg = ctx.createRadialGradient(GAME_W / 2, GAME_H * 0.3, 0, GAME_W / 2, GAME_H * 0.3, GAME_H);
  bg.addColorStop(0, ZONE_BG_INNER[zoneKey]); bg.addColorStop(0.6, ZONE_BG_OUTER[zoneKey]); bg.addColorStop(1, '#000');
  const vg = ctx.createRadialGradient(GAME_W / 2, GAME_H / 2, GAME_H * 0.25, GAME_W / 2, GAME_H / 2, GAME_H * 0.75);
  vg.addColorStop(0, 'transparent'); vg.addColorStop(1, 'rgba(0,0,0,0.75)');
  const f1 = ctx.createRadialGradient(GAME_W * 0.3, GAME_H * 0.8, 0, GAME_W * 0.3, GAME_H * 0.8, GAME_W * 0.4);
  f1.addColorStop(0, zone.fog); f1.addColorStop(1, 'transparent');
  const f2 = ctx.createRadialGradient(GAME_W * 0.75, GAME_H * 0.7, 0, GAME_W * 0.75, GAME_H * 0.7, GAME_W * 0.35);
  f2.addColorStop(0, zone.fog); f2.addColorStop(1, 'transparent');
  return (ZONE_GRAD_CACHE[zoneKey] = { bg, vg, f1, f2 });
}

// ── Full-frame canvas draw ────────────────────────────────────────────────────
// Called imperatively from the game loop — zero React involvement.
function drawGameFrame(ctx, s, zone, groundCache, onPickup) {
  ctx.imageSmoothingEnabled = false; // crisp pixels, faster software blit
  const cam  = Math.floor(s.camera);
  const r    = s.reaper;
  const now  = performance.now();
  const grad = getZoneGradients(ctx, s.zoneKey, zone);

  // 1. Background (cached gradient)
  ctx.fillStyle = grad.bg;
  ctx.fillRect(0, 0, GAME_W, GAME_H);

  // 2. Parallax (no camera offset — world-space anchored)
  drawParallax(ctx, cam, zone, s.mothX);

  // 3. World (camera-translated)
  ctx.save();
  ctx.translate(-cam, 0);

  // Ground tiles — blit only the visible slice.
  // Destination x must be `cam` (not 0) because we're inside ctx.translate(-cam, 0):
  // screen_x = world_x - cam, so world_x = cam lands at screen x = 0.
  if (groundCache) ctx.drawImage(groundCache, cam, 0, GAME_W, groundCache.height, cam, GROUND_Y, GAME_W, groundCache.height);

  // Pits (zone-aware — sanctum has none)
  for (const p of getZonePits(s.zoneKey)) {
    ctx.fillStyle = '#000';
    ctx.fillRect(p.x, GROUND_Y, p.w, GAME_H - GROUND_Y + 50);
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(p.x, GROUND_Y, 8, GAME_H - GROUND_Y);
    ctx.fillRect(p.x + p.w - 8, GROUND_Y, 8, GAME_H - GROUND_Y);
  }

  // Platforms
  for (const p of PLATFORMS) {
    ctx.globalAlpha = 0.5; ctx.fillStyle = zone.accent;
    ctx.fillRect(p.x, p.y, p.w, p.h);
    ctx.globalAlpha = 1;   ctx.fillStyle = zone.accent;
    ctx.fillRect(p.x, p.y - 2, p.w, 2);
  }

  // Lanterns (chapel)
  if (s.zoneKey === 'chapel') {
    for (const lx of [300, 900, 1500, 2100]) drawSprite(ctx, LANTERN, PAL_LANTERN, lx, 60, 3, false);
  }

  // Sanctum: blood drips down the walls, pooling at floor — drawn in world space
  if (s.zoneKey === 'sanctum') {
    const DRIP_COLS = [180, 340, 520, 700, 950, 1100, 1280, 1450, 1620, 1820, 2000, 2150, 2280];
    ctx.save();
    for (let i = 0; i < DRIP_COLS.length; i++) {
      const dx = DRIP_COLS[i];
      // Static drip streak height varies per column
      const streakH = 40 + (i * 37 % 80);
      // Slow animated drip bead
      const beadY = ((now * 0.04 + i * 47) % (GROUND_Y - streakH - 10)) + streakH;
      // Streak
      const sg = ctx.createLinearGradient(0, 10, 0, streakH + 10);
      sg.addColorStop(0, 'rgba(180,10,14,0.0)');
      sg.addColorStop(0.5, 'rgba(180,10,14,0.6)');
      sg.addColorStop(1, 'rgba(180,10,14,0.3)');
      ctx.fillStyle = sg;
      ctx.fillRect(dx, 10, 3, streakH);
      // Bead
      ctx.fillStyle = 'rgba(220,20,20,0.75)';
      ctx.beginPath();
      ctx.arc(dx + 1.5, beadY, 3, 0, Math.PI * 2);
      ctx.fill();
      // Pool at floor
      ctx.fillStyle = 'rgba(100,5,8,0.4)';
      ctx.beginPath();
      ctx.ellipse(dx + 1, GROUND_Y - 2, 8, 3, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Pickups
  for (const pk of s.pickups) {
    if (pk.taken) continue;
    const bobY = pk.y - 16 + Math.sin(now / 300 + pk.id) * 3;
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    const glw = ctx.createRadialGradient(pk.x, pk.y, 0, pk.x, pk.y, 20);
    glw.addColorStop(0, 'rgba(245,165,36,0.3)'); glw.addColorStop(1, 'transparent');
    ctx.fillStyle = glw; ctx.fillRect(pk.x - 20, bobY - 20, 40, 40);
    ctx.restore();
    drawSprite(ctx, HEART_PICKUP, REAPER_PALETTE, pk.x - 16, bobY - 16, 4, false);
  }

  // Notice item (parchment page — chapel only)
  if (s.noticeItem && !s.noticeItem.taken) {
    const ni   = s.noticeItem;
    const hov  = Math.sin(now / 400) * 3;
    const rot  = Math.sin(now / 600) * 0.07;
    const nx   = ni.x, ny = ni.y + hov;
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    const ng = ctx.createRadialGradient(nx, ny, 0, nx, ny, 30);
    ng.addColorStop(0, 'rgba(245,165,36,0.45)'); ng.addColorStop(1, 'transparent');
    ctx.fillStyle = ng; ctx.fillRect(nx - 30, ny - 30, 60, 60); ctx.restore();
    ctx.save();
    ctx.translate(nx, ny + 24); ctx.rotate(rot); ctx.translate(-nx, -(ny + 24));
    ctx.fillStyle = '#EFE7D2'; ctx.fillRect(nx - 18, ny - 24, 36, 48);
    ctx.strokeStyle = '#1A1612'; ctx.lineWidth = 1;
    ctx.strokeRect(nx - 18 + 0.5, ny - 24 + 0.5, 35, 47);
    ctx.strokeStyle = '#B0A88E';
    for (const oy of [4, 8, 12, 16, 28, 44]) {
      ctx.beginPath(); ctx.moveTo(nx - 14, ny - 24 + oy); ctx.lineTo(nx + 14, ny - 24 + oy); ctx.stroke();
    }
    ctx.fillStyle = '#A8281C'; ctx.font = '8px monospace'; ctx.textAlign = 'center';
    ctx.fillText('▲', nx, ny - 24 + 28); ctx.restore();
    ctx.save(); ctx.font = '8px IBM Plex Mono, monospace'; ctx.fillStyle = '#F5A524';
    ctx.textAlign = 'center'; ctx.shadowColor = '#C8161D'; ctx.shadowOffsetX = 1;
    ctx.fillText('▲ CSG-DSC-04A', nx, ny - 32); ctx.restore();
  }

  // Enemies (PNG sprites + boss)
  for (const en of s.enemies) {
    if (en.hp <= 0) continue;

    if (en.type === 'boss') {
      const bossSet = ENEMY_FRAMES.boss;
      if (bossSet) {
        let bossAnim, bossFps;
        if (en.chargeActive) {
          bossAnim = bossSet.attack; bossFps = 10;
        } else if (Math.abs(s.reaper.x - en.x) < 300) {
          bossAnim = bossSet.cast;   bossFps = 8;
        } else {
          bossAnim = bossSet.idle;   bossFps = 6;
        }
        const bossIdx = Math.floor((now / (1000 / bossFps)) + en.id) % bossAnim.length;
        const bossSrc = bossAnim[bossIdx];

        const BOSS_SCALE = 0.55;
        const BOSS_ANCHOR_X = 181;
        const BOSS_ANCHOR_Y = 340;
        const bossDisplayH = BOSS_ANCHOR_Y * BOSS_SCALE; // height from feet to head anchor

        // en.y = GROUND_Y (feet on the ground plane).
        // drawFootSprite places pixel (BOSS_ANCHOR_X, BOSS_ANCHOR_Y) at (en.x, en.y),
        // so the sprite top is at en.y - BOSS_ANCHOR_Y*BOSS_SCALE.
        const bossBodyTop = en.y - BOSS_ANCHOR_Y * BOSS_SCALE; // visual/hitbox top

        // Ground shadow centred at feet
        ctx.save();
        ctx.globalAlpha = 0.6;
        const shadowGrad = ctx.createRadialGradient(en.x, en.y, 0, en.x, en.y, 90);
        shadowGrad.addColorStop(0, 'rgba(0,0,0,0.75)');
        shadowGrad.addColorStop(1, 'transparent');
        ctx.fillStyle = shadowGrad;
        ctx.fillRect(en.x - 90, en.y - 18, 180, 22);
        ctx.restore();

        // Boss sprite — drawn with color-keyed canvas to remove opaque gray PNG background.
        // getBossKeyed() samples corners on first call and zeroes background pixels.
        // Falls back to raw drawFootSprite until the keyed canvas is ready.
        {
          const keyed = getBossKeyed(bossSrc);
          ctx.save();
          if (en.chargeActive) ctx.filter = 'brightness(1.6) sepia(1) saturate(12) hue-rotate(-5deg)';
          if (en.dir < 0) { ctx.translate(en.x * 2, 0); ctx.scale(-1, 1); }
          if (keyed) {
            ctx.drawImage(
              keyed,
              en.x - BOSS_ANCHOR_X * BOSS_SCALE,
              en.y - BOSS_ANCHOR_Y * BOSS_SCALE,
              keyed.width  * BOSS_SCALE,
              keyed.height * BOSS_SCALE,
            );
          } else {
            // Not cached yet — draw raw (will fix on next frame)
            const raw = getImg(bossSrc);
            if (raw.complete && raw.naturalWidth) {
              ctx.drawImage(
                raw,
                en.x - BOSS_ANCHOR_X * BOSS_SCALE,
                en.y - BOSS_ANCHOR_Y * BOSS_SCALE,
                raw.naturalWidth  * BOSS_SCALE,
                raw.naturalHeight * BOSS_SCALE,
              );
            }
          }
          ctx.restore();
        }

        // Sanctum seal — once player enters the arena (past x=1400), lock them in
        if (s.zoneKey === 'sanctum' && s.bossArenaEntered) {
          const sealX = 1380;
          ctx.save();
          ctx.globalAlpha = 0.8;
          const sealGrad = ctx.createLinearGradient(sealX - 10, 0, sealX + 20, 0);
          sealGrad.addColorStop(0, 'transparent');
          sealGrad.addColorStop(0.4, '#E62028');
          sealGrad.addColorStop(1, 'transparent');
          ctx.fillStyle = sealGrad;
          ctx.fillRect(sealX - 10, 0, 30, GAME_H);
          ctx.globalAlpha = 1;
          ctx.font = '8px IBM Plex Mono, monospace';
          ctx.fillStyle = '#E62028';
          ctx.textAlign = 'center';
          ctx.fillText('▲ SEALED ▲', sealX + 5, GAME_H / 2);
          ctx.restore();
          // Block retreat past the seal
          if (s.reaper.x < sealX) s.reaper.x = sealX + 2;
        }
      }
      continue;
    }

    const set = ENEMY_FRAMES[en.type]; if (!set) continue;

    const action = (en.state === 'chase' || en.state === 'charge' ||
                    en.type === 'wraith' || en.type === 'butterfly') ? 'walk' : 'idle';

    if (set.sheet) {
      // Sheet-based sprite: crop one cell from the 4×3 sheet.
      // Use en.x + ew/2 as pivot (same convention as all other enemies).
      // Scale matches comparable existing enemies so ground alignment is consistent.
      const fps  = en.type === 'boss_aphid' ? 8 : en.type === 'butterfly' ? 10 : 6;
      const col  = Math.floor(now / (1000 / fps) + en.id) % (set.frames || 4);
      const row  = set.rows[action] ?? 0;
      const sc   = en.type === 'beetle'     ? 0.26
                 : en.type === 'boss_aphid' ? 0.34
                 : 0.22;  // aphid + butterfly
      const sheetEW = en.type === 'beetle' ? 55 : en.type === 'boss_aphid' ? 75 : en.type === 'aphid' ? 38 : 40;
      const pivX = en.x + sheetEW / 2;
      const flt  = (en.type === 'boss_aphid' && en.chargeActive)
                   ? 'brightness(1.5) sepia(1) saturate(8)' : undefined;
      drawSheetCell(ctx, set.sheet, col, row, pivX, en.y, sc, en.dir, flt);
    } else {
      // Individual-frame sprites (player, skullknife, hound, wraith, boss frames)
      const phase  = (now / 180 + en.id * 2) | 0;
      const frames = set[action] || set.idle;
      const src    = frames[phase % frames.length];
      const sc     = en.type === 'hound' ? 0.20 : en.type === 'wraith' ? 0.26 : 0.30;
      const ew     = en.type === 'hound' ? 70 : en.type === 'wraith' ? 56 : 40;
      drawFootSprite(ctx, src, en.x + ew / 2, en.y, sc, en.dir);
    }
  }

  // Player (PNG sprite)
  const attackProgress = r.attackTimer > 0 ? (ATTACK_DUR - r.attackTimer) : -1;
  let frameUrl;
  if (r.dead) {
    frameUrl = REAPER_FRAMES.idleCycle ? REAPER_FRAMES.idleCycle[0] : REAPER_FRAMES.idle;
  } else if (attackProgress >= 0) {
    const af = REAPER_FRAMES.attack;
    frameUrl = af[Math.min(af.length - 1, Math.floor(attackProgress / (ATTACK_DUR / af.length)))];
  } else if (Math.abs(r.vx) > 0.1) {
    const wf = REAPER_FRAMES.walk;
    frameUrl = wf[Math.floor(r.walkPhase) % wf.length];
  } else {
    frameUrl = REAPER_FRAMES.idle;
  }
  const walking = Math.abs(r.vx) > 0.1 && r.grounded;
  const bobY    = walking ? Math.sin(r.walkPhase * Math.PI / 2) * 2 : 0;
  const tiltDeg = walking ? Math.sin(r.walkPhase * Math.PI / 4) * 2 : 0;
  const pvX = r.x + PLAYER_W / 2, pvY = r.y + bobY;
  const palpha = r.iframes > 0 ? (Math.floor(r.iframes / 80) % 2 === 0 ? 0.3 : 1) : 1;
  ctx.save();
  if (r.dead) {
    ctx.filter = 'grayscale(0.5) brightness(0.4)';
    ctx.translate(pvX, pvY + PLAYER_H);
    ctx.rotate(r.dir < 0 ? -Math.PI / 2 : Math.PI / 2);
    ctx.translate(-pvX, -(pvY + PLAYER_H));
  } else if (tiltDeg !== 0) {
    ctx.translate(pvX, pvY + PLAYER_H);
    ctx.rotate((tiltDeg * r.dir) * Math.PI / 180);
    ctx.translate(-pvX, -(pvY + PLAYER_H));
  }
  drawFootSprite(ctx, frameUrl, pvX, pvY, SPRITE_SCALE, r.dir, 181, 40, palpha);
  ctx.restore();

  // Hit flashes + pickup text (gold floaters)
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  for (const f of s.hitFlashes) {
    const maxT = f.maxT || 250;
    const a    = Math.max(0, f.t / maxT);
    if (f.gold) {
      // Gold pickup burst — larger radius
      const fg = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, 36);
      fg.addColorStop(0, `rgba(245,165,36,${(a * 0.9).toFixed(3)})`);
      fg.addColorStop(1, 'transparent');
      ctx.fillStyle = fg; ctx.fillRect(f.x - 36, f.y - 36, 72, 72);
    } else {
      const fg = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, 24);
      fg.addColorStop(0, `rgba(255,255,255,${(a * 0.8).toFixed(3)})`);
      fg.addColorStop(1, 'transparent');
      ctx.fillStyle = fg; ctx.fillRect(f.x - 24, f.y - 24, 48, 48);
    }
    if (f.text) {
      const rise = (1 - a) * 28; // floats upward as it fades
      ctx.font = 'bold 12px IBM Plex Mono, monospace';
      ctx.fillStyle = `rgba(245,165,36,${Math.min(1, a * 2).toFixed(2)})`;
      ctx.textAlign = 'center';
      ctx.fillText(f.text, f.x, f.y - rise);
      ctx.textAlign = 'left';
    }
  }
  ctx.restore();

  // Exit portal arch — drawn inside camera translate so it sits in world space
  const EXIT_X = WORLD_W - 140;
  const pulse = 0.6 + Math.sin(now / 400) * 0.2;
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  const pg = ctx.createRadialGradient(EXIT_X, GROUND_Y - 30, 0, EXIT_X, GROUND_Y - 30, 70);
  pg.addColorStop(0, `rgba(245,165,36,${(0.4 * pulse).toFixed(2)})`);
  pg.addColorStop(1, 'transparent');
  ctx.fillStyle = pg;
  ctx.fillRect(EXIT_X - 70, GROUND_Y - 100, 140, 100);
  ctx.restore();
  ctx.save();
  ctx.strokeStyle = zone.accent;
  ctx.lineWidth = 2;
  ctx.shadowColor = zone.accent;
  ctx.shadowBlur = 8 * pulse;
  ctx.beginPath();
  ctx.arc(EXIT_X, GROUND_Y, 55, Math.PI, 0);
  ctx.stroke();
  // Vertical pillars
  ctx.beginPath();
  ctx.moveTo(EXIT_X - 55, GROUND_Y); ctx.lineTo(EXIT_X - 55, GROUND_Y - 10);
  ctx.moveTo(EXIT_X + 55, GROUND_Y); ctx.lineTo(EXIT_X + 55, GROUND_Y - 10);
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.font = '9px IBM Plex Mono, monospace';
  ctx.fillStyle = '#F5A524';
  ctx.textAlign = 'center';
  ctx.fillText('▲ EXIT ▲', EXIT_X, GROUND_Y - 66);
  ctx.restore();

  // Queen arena seal — amber wall that locks player in when boss_aphid engages
  if (s.queenSealX != null) {
    const sealX = s.queenSealX;
    ctx.save();
    ctx.globalAlpha = 0.75;
    const qg = ctx.createLinearGradient(sealX - 12, 0, sealX + 22, 0);
    qg.addColorStop(0, 'transparent');
    qg.addColorStop(0.4, '#F5A524');
    qg.addColorStop(1, 'transparent');
    ctx.fillStyle = qg;
    ctx.fillRect(sealX - 12, 0, 34, GAME_H);
    ctx.globalAlpha = 1;
    ctx.font = '8px IBM Plex Mono, monospace';
    ctx.fillStyle = '#F5A524';
    ctx.textAlign = 'center';
    ctx.fillText('▲ SEALED ▲', sealX + 5, GAME_H / 2);
    ctx.restore();
    // Block retreat
    if (s.reaper.x < sealX) s.reaper.x = sealX + 2;
  }

  ctx.restore(); // end camera translation

  // Zone tint + fog + vignette — all use cached gradients
  ctx.save(); ctx.globalCompositeOperation = 'screen';
  ctx.fillStyle = zone.tint; ctx.fillRect(0, 0, GAME_W, GAME_H); ctx.restore();
  ctx.fillStyle = grad.f1; ctx.fillRect(0, 0, GAME_W, GAME_H);
  ctx.fillStyle = grad.f2; ctx.fillRect(0, 0, GAME_W, GAME_H);
  ctx.fillStyle = grad.vg; ctx.fillRect(0, 0, GAME_W, GAME_H);
}
import {
  REAPER_FRAMES, ENEMY_FRAMES,
  TILE_STONE, LANTERN, MOTH, HEART_PICKUP, SCYTHE_ARC,
  REAPER_PALETTE, PAL_GREEN, PAL_STONE_RED, PAL_STONE_GREEN, PAL_STONE_AMBER, PAL_LANTERN,
} from './sprites-data.js';

// Eagerly populate IMG_CACHE at module load time so all PNG sprites are
// decoding in the background before the first game frame is drawn.
// (preloadSprites() in app.jsx uses separate Image objects; this ensures the
//  canvas draw path has its own decoded references ready immediately.)
{
  const allSrcs = [
    REAPER_FRAMES.idle,
    ...(REAPER_FRAMES.idleCycle || []),
    ...REAPER_FRAMES.walk,
    ...REAPER_FRAMES.attack,
    ...Object.values(ENEMY_FRAMES).flatMap(set =>
      set.idle ? [...set.idle, ...(set.walk||[]), ...(set.attack||[]), ...(set.cast||[])] : []
    ),
  ];
  for (const src of new Set(allSrcs)) getImg(src);
}

// === GAME CONSTANTS =================================================
const GAME_W = 640;
const GAME_H = 320;
const WORLD_W = 2400;
const GROUND_Y = 252;
const GRAVITY = 0.55;
const MOVE_SPEED = 2.3;
const JUMP_VEL = -14;   // raised: platform 6 (GROUND_Y-150) needs ~150px, old -12.5 only gave ~136px
// Reaper image sprites: head pinned at PNG (181, 40), foot at ~(181, 338).
// Head-to-foot = ~298px; SPRITE_SCALE shrinks to PLAYER_H so feet land on hitbox bottom.
const PLAYER_W = 44;       // collision width
const PLAYER_H = 100;      // collision height
const SPRITE_SCALE = PLAYER_H / 298;
const ATTACK_DUR = 320;
const ATTACK_HIT_MS = [60, 200];
const IFRAMES_MS = 800;

// ZONE configs --------------------------------------------------------
const ZONES = {
  chapel: {
    name: 'CHAPEL',
    nameJP: 'ｾｲﾄﾞｳ',
    refCode: 'CSG-DSC-04A.I',
    bgGradient: 'radial-gradient(ellipse 70% 50% at 50% 15%, #1f070b 0%, #0a0204 50%, #000 100%)',
    accent: '#C8161D',
    tilePal: PAL_STONE_RED,
    enemies: 'demons',
    pillars: '#2a0a0e',
    fog: 'rgba(200, 22, 29, 0.06)',
    tint: 'rgba(200, 22, 29, 0.10)',
    motto: 'EVERY SACRAMENT IS ALSO A WOUND.',
  },
  sluice: {
    name: 'SLUICE',
    nameJP: 'ﾊｲｽｲﾛ',
    refCode: 'CSG-DSC-04A.II',
    bgGradient: 'radial-gradient(ellipse 70% 50% at 50% 15%, #0a2014 0%, #02080a 50%, #000 100%)',
    accent: '#6BCC4D',
    tilePal: PAL_STONE_GREEN,
    enemies: 'watchers',
    pillars: '#0a2a18',
    fog: 'rgba(43, 191, 110, 0.05)',
    tint: 'rgba(43, 191, 110, 0.08)',
    motto: 'WHAT THE PIPE FORGETS, THE FLOOR REMEMBERS.',
  },
  vault: {
    name: 'VAULT',
    nameJP: 'ｺﾝﾄﾝｺ',
    refCode: 'CSG-DSC-04A.III',
    bgGradient: 'radial-gradient(ellipse 70% 50% at 50% 15%, #1f1308 0%, #0a0602 50%, #000 100%)',
    accent: '#F5A524',
    tilePal: PAL_STONE_AMBER,
    enemies: 'mixed',
    pillars: '#2a1808',
    fog: 'rgba(245, 165, 36, 0.05)',
    tint: 'rgba(245, 165, 36, 0.07)',
    motto: 'ATTRIBUTION IS A LIABILITY. SEAL EVERY RECORD.',
  },
  // Final chamber — boss deathmatch. No escape. No record.
  sanctum: {
    name: 'SANCTUM',
    nameJP: 'ｻｲｼｭｳ',
    refCode: 'CSG-DSC-04A.IV',
    bgGradient: 'radial-gradient(ellipse 80% 60% at 50% 10%, #300004 0%, #0a0002 55%, #000 100%)',
    accent: '#E62028',
    tilePal: PAL_STONE_RED,
    enemies: 'boss',
    pillars: '#1a0004',
    fog: 'rgba(200, 22, 29, 0.18)',
    tint: 'rgba(200, 22, 29, 0.22)',
    motto: 'NO EXIT. NO RECORD. ONLY TERMINATION.',
  },
};

// === SPAWN PRESETS ==================================================
// Random offset for enemy spawn positions — keeps placement fresh on loops
const rng = (base, spread) => base + (Math.random() - 0.5) * spread;

function makeEnemies(zone, loopCount = 0) {
  const list = [];
  // Each loop: +15% speed, +1 hp (up to 5), extra enemies after loop 1
  const spd  = 1 + loopCount * 0.15;
  const extraHp = Math.min(3, loopCount);
  const addExtra = loopCount >= 1;

  if (zone === 'chapel') {
    list.push({ id: 1, type: 'skullknife', x: rng(440,  60), y: GROUND_Y - 70, hp: 2 + extraHp, vx: -0.6 * spd, dir: -1, state: 'patrol' });
    list.push({ id: 2, type: 'skullknife', x: rng(760,  60), y: GROUND_Y - 70, hp: 2 + extraHp, vx:  0.6 * spd, dir:  1, state: 'patrol' });
    list.push({ id: 3, type: 'skullknife', x: rng(1140, 60), y: GROUND_Y - 70, hp: 2 + extraHp, vx: -0.6 * spd, dir: -1, state: 'patrol' });
    list.push({ id: 4, type: 'wraith',     x: rng(1500, 80), y: 140,            hp: 1 + extraHp, vx: 0, dir: -1, state: 'float', baseY: 140 });
    list.push({ id: 5, type: 'hound',      x: rng(1800, 60), y: GROUND_Y - 50, hp: 2 + extraHp, vx: 0, dir: -1, state: 'rest' });
    list.push({ id: 6, type: 'skullknife', x: rng(2050, 40), y: GROUND_Y - 70, hp: 2 + extraHp, vx: -0.6 * spd, dir: -1, state: 'patrol' });
    if (addExtra) {
      list.push({ id: 7, type: 'skullknife', x: rng(600, 80),  y: GROUND_Y - 70, hp: 2 + extraHp, vx: 0.8 * spd, dir: 1, state: 'patrol' });
      list.push({ id: 8, type: 'hound',      x: rng(1300, 80), y: GROUND_Y - 50, hp: 3 + extraHp, vx: 0, dir: -1, state: 'rest' });
    }
  } else if (zone === 'sluice') {
    // Sluice II — mix in aphids (jittery ground) and butterflies (floaty erratic)
    list.push({ id: 1, type: 'wraith',    x: rng(500,  80), y: 120,            hp: 3 + extraHp, vx: 0, dir: -1, state: 'guard',  baseY: 120 });
    // Ground alignment: sheet sprites (362×362 cells, anchor y=40) sit higher in
    // their frames than the individual-PNG enemies. Adjusted y values below push
    // them down so their feet land on the ground plane (GROUND_Y).
    list.push({ id: 2, type: 'aphid',     x: rng(650,  60), y: GROUND_Y - 50, hp: 2 + extraHp, vx: 0.9 * spd, dir: 1, state: 'patrol' });
    list.push({ id: 3, type: 'butterfly', x: rng(900,  80), y: 140,            hp: 2 + extraHp, vx: 0, dir: -1, state: 'float',  baseY: 140, dashTimer: 0 });
    list.push({ id: 4, type: 'wraith',    x: rng(1100, 80), y: 150,            hp: 3 + extraHp, vx: 0, dir: -1, state: 'guard',  baseY: 150 });
    list.push({ id: 5, type: 'aphid',     x: rng(1430, 50), y: GROUND_Y - 50, hp: 2 + extraHp, vx: -0.9 * spd, dir: -1, state: 'patrol' });
    list.push({ id: 6, type: 'hound',     x: rng(1900, 60), y: GROUND_Y - 50, hp: 2 + extraHp, vx: 0, dir: -1, state: 'rest' });
    if (addExtra) {
      list.push({ id: 7, type: 'butterfly', x: rng(350, 60), y: 130, hp: 2 + extraHp, vx: 0, dir: 1, state: 'float', baseY: 130, dashTimer: 0 });
      list.push({ id: 8, type: 'aphid',     x: rng(1600,80), y: GROUND_Y - 50, hp: 3 + extraHp, vx: 0.8 * spd, dir: 1, state: 'patrol' });
    }
  } else if (zone === 'vault') {
    // Vault III — beetles (armoured slow tanks) and boss_aphid (Queen mini-boss)
    list.push({ id: 1, type: 'wraith',    x: rng(400,  60), y: 130,            hp: 1 + extraHp, vx: 0, dir: -1, state: 'float', baseY: 130 });
    list.push({ id: 2, type: 'beetle',    x: rng(650,  60), y: GROUND_Y - 45, hp: 4 + extraHp, vx: 0, dir: -1, state: 'chase' });
    list.push({ id: 3, type: 'aphid',     x: rng(950,  60), y: GROUND_Y - 50, hp: 2 + extraHp, vx: 0.8 * spd, dir: 1, state: 'patrol' });
    list.push({ id: 4, type: 'beetle',    x: rng(1250, 60), y: GROUND_Y - 45, hp: 4 + extraHp, vx: 0, dir: -1, state: 'chase' });
    list.push({ id: 5, type: 'boss_aphid',x: rng(1600, 40), y: GROUND_Y - 62, hp: 7 + extraHp, vx: 0, dir: -1, state: 'guard', chargeTimer: 2000, chargeActive: false, arenaSealed: false });
    list.push({ id: 6, type: 'skullknife',x: rng(1950, 40), y: GROUND_Y - 70, hp: 2 + extraHp, vx: -0.6 * spd, dir: -1, state: 'patrol' });
    if (addExtra) {
      list.push({ id: 7, type: 'beetle',   x: rng(820, 60),  y: GROUND_Y - 45, hp: 4 + extraHp, vx: 0, dir: 1, state: 'chase' });
      list.push({ id: 8, type: 'butterfly', x: rng(1780,80),  y: 130,           hp: 2 + extraHp, vx: 0, dir: -1, state: 'float', baseY: 130, dashTimer: 0 });
    }
  } else if (zone === 'sanctum') {
    // Final chamber — ONLY the boss. Deep in the chamber at x=1800.
    // Hallway (x=0→1400) is empty — the breathing room.
    // en.y = GROUND_Y so the foot-anchor of the sprite lands on the ground plane.
    const bossHp = 14 + loopCount * 5;
    list.push({ id: 99, type: 'boss', x: 1800, y: GROUND_Y + 8, hp: bossHp,
      maxHp: bossHp, vx: 0, dir: -1, state: 'guard',
      chargeTimer: 3500, chargeActive: false }); // 3.5s grace before first charge
  }
  return list;
}

// === PLATFORMS =====================================================
const PLATFORMS = [
  { x: 360, y: GROUND_Y - 80, w: 100, h: 8 },
  { x: 620, y: GROUND_Y - 130, w: 80, h: 8 },
  { x: 880, y: GROUND_Y - 80, w: 120, h: 8 },
  { x: 1180, y: GROUND_Y - 140, w: 80, h: 8 },
  { x: 1400, y: GROUND_Y - 100, w: 120, h: 8 },
  { x: 1700, y: GROUND_Y - 150, w: 80, h: 8 },
  { x: 1920, y: GROUND_Y - 80, w: 120, h: 8 },
];

// Hazards: small gap pits — zone-aware.
// Sanctum is a flat open arena; pits would wall-off the boss and ruin the fight.
// Vault uses a reduced set: only the early pit (x=800) so the queen arena
// (x≈1100–1700) stays pit-free — the mid-pits at 1320 and 1620 blocked the queen
// from chasing the player and caused her to spawn inside the 1620 pit.
const PITS_STANDARD = [
  { x: 800, w: 60 },
  { x: 1320, w: 50 },
  { x: 1620, w: 60 },
];
const PITS_VAULT = [
  { x: 800, w: 60 },
];
function getZonePits(zoneKey) {
  if (zoneKey === 'sanctum') return [];
  if (zoneKey === 'vault')   return PITS_VAULT;
  return PITS_STANDARD;
}

// Heart pickups — float just above ground so the player walks into them naturally.
// Pickups placed BEFORE the first enemy cluster so they're collectable
// without having to kill anything first. Coin 1 is 5 steps from spawn.
function makePickups(zone = 'chapel') {
  if (zone === 'vault') return [
    // One mercy pickup in the queen arena — randomised slightly each run
    { id: 1, x: 1420 + Math.floor(Math.random() * 120), y: GROUND_Y - 28, taken: false },
  ];
  if (zone === 'sanctum') return [
    // One mercy pickup in the sealed boss arena
    { id: 1, x: 1620 + Math.floor(Math.random() * 100), y: GROUND_Y - 28, taken: false },
  ];
  return [
    { id: 1, x: 160,  y: GROUND_Y - 28, taken: false }, // right at start
    { id: 2, x: 900,  y: GROUND_Y - 28, taken: false }, // past first enemy cluster
    { id: 3, x: 1700, y: GROUND_Y - 28, taken: false }, // late level
  ];
}

// ====================================================================
function Game({ zoneKey, onDeath, onZoneChange, noticeFound, onNoticeFound, onBossArena, paused, loopCount = 0 }) {
  const zone = ZONES[zoneKey];
  const canvasRef     = useRef(null);  // main game canvas
  const groundCache   = useRef(null);  // offscreen tile cache
  const frameCount    = useRef(0);     // for HUD throttle
  const keys = useRef({});
  const rerender = useState(0);
  const force = useCallback(() => rerender[1](n => n + 1), [rerender]);

  const stateRef = useRef(null);
  if (stateRef.current === null || stateRef.current.zoneKey !== zoneKey) {
    stateRef.current = {
      zoneKey,
      reaper: {
        x: 80, y: GROUND_Y - PLAYER_H, vx: 0, vy: 0, dir: 1,
        state: 'idle', attackTimer: 0, walkPhase: 0,
        hp: zoneKey === 'sanctum' ? 5 : 3, // full health restored for the final fight
        iframes: 0,
        grounded: true, dead: false,
      },
      enemies: makeEnemies(zoneKey, loopCount),
      pickups: makePickups(zoneKey),
      // Always place the artifact in chapel so there's always something to find.
      // First time: triggers notice viewer. Replays: shows an in-game dialog instead.
      noticeItem: zoneKey === 'chapel'
        ? { x: 2180, y: GROUND_Y - 30, taken: false, bob: 0 }
        : null,
      hitFlashes: [],
      camera: 0,
      runTime: 0,
      dialog: null,
      dialogTimer: 0,
      mothX: 200,
      exitTriggered: false,
      exitTimer: 0,
      bossArenaEntered: false,  // tracks if player has passed the hallway into the boss arena
      bossHintShown: false,     // one-time "EXIT SEALED" hint
      voidTriggered: false,     // sanctum boss kill → completion
      queenSealX: null,         // vault queen arena seal x-position (null = inactive)
    };
  }
  const s = stateRef.current;

  // Pre-render ground tiles to offscreen canvas once per zone change
  useEffect(() => {
    const tileW = 16 * 4, tileH = 8 * 4;
    const off = document.createElement('canvas');
    off.width = WORLD_W; off.height = tileH * 3;
    const ctx = off.getContext('2d');
    for (let row = 0; row < 3; row++)
      for (let x = 0; x < WORLD_W; x += tileW)
        drawSprite(ctx, TILE_STONE, zone.tilePal, x, row * tileH, 4, false);
    groundCache.current = off;
  }, [zone]);

  // intro dialog
  useEffect(() => {
    s.dialog = `> ENTERING ${zone.name}. ${zone.motto}`;
    s.dialogTimer = 4000;
    force();
    // eslint-disable-next-line
  }, [zoneKey]);

  useKey((e) => {
    keys.current[e.key.toLowerCase()] = true;
    // Always read stateRef.current — never close over `s`, which becomes stale
    // after zone changes (stateRef is reset but the [] closure isn't re-registered).
    const reaper = stateRef.current?.reaper;
    if (!reaper) return;
    if (e.key === ' ' || e.key === 'z' || e.key === 'Z') {
      e.preventDefault();
      if (reaper.attackTimer <= 0 && !reaper.dead) reaper.attackTimer = ATTACK_DUR;
    }
    if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W' || e.key === 'x' || e.key === 'X') {
      e.preventDefault();
      if (reaper.grounded && !reaper.dead) { reaper.vy = JUMP_VEL; reaper.grounded = false; }
    }
  }, []);

  useEffect(() => {
    const up = (e) => { keys.current[e.key.toLowerCase()] = false; };
    window.addEventListener('keyup', up);
    return () => window.removeEventListener('keyup', up);
  }, []);

  useGameLoop((dt) => {
    if (paused) return;
    if (s.reaper.dead) return;
    const r = s.reaper;
    r.iframes = Math.max(0, r.iframes - dt);
    r.attackTimer = Math.max(0, r.attackTimer - dt);
    s.runTime += dt / 1000;
    s.dialogTimer = Math.max(0, s.dialogTimer - dt);
    s.mothX = 200 + Math.sin(performance.now() / 600) * 60;

    // input
    let inputX = 0;
    if (keys.current['arrowleft'] || keys.current['a']) inputX -= 1;
    if (keys.current['arrowright'] || keys.current['d']) inputX += 1;
    if (r.attackTimer > 0) inputX *= 0.35;

    r.vx = inputX * MOVE_SPEED;
    if (inputX !== 0) r.dir = inputX > 0 ? 1 : -1;

    // gravity
    r.vy = Math.min(12, r.vy + GRAVITY);

    // horizontal move
    r.x += r.vx;
    r.x = Math.max(20, Math.min(WORLD_W - 80, r.x));

    // vertical move + ground/platform collision
    r.y += r.vy;

    const zonePits = getZonePits(s.zoneKey);
    let inPit = false;
    for (const p of zonePits) {
      if (r.x + PLAYER_W/2 > p.x && r.x + PLAYER_W/2 < p.x + p.w) inPit = true;
    }

    if (!inPit && r.y + PLAYER_H >= GROUND_Y) {
      r.y = GROUND_Y - PLAYER_H;
      r.vy = 0;
      r.grounded = true;
    } else {
      r.grounded = false;
    }

    if (r.vy >= 0) {
      for (const p of PLATFORMS) {
        const wasAbove = r.y + PLAYER_H - r.vy <= p.y + 1;
        const isBelowTop = r.y + PLAYER_H >= p.y && r.y + PLAYER_H <= p.y + 16;
        const xHits = r.x + 8 < p.x + p.w && r.x + PLAYER_W - 8 > p.x;
        if (wasAbove && isBelowTop && xHits) {
          r.y = p.y - PLAYER_H;
          r.vy = 0;
          r.grounded = true;
          break;
        }
      }
    }

    if ((inPit && r.y + PLAYER_H > GROUND_Y + 40) || r.y > GROUND_Y + 200) {
      r.dead = true;
      onDeath(s.runTime);
      return;
    }

    if (Math.abs(r.vx) > 0.1) r.walkPhase += dt / 90;
    else r.walkPhase = 0;

    // Sanctum: once player crosses x=1400 they've entered the arena — seal behind them
    if (s.zoneKey === 'sanctum' && r.x > 1400 && !s.bossArenaEntered) {
      s.bossArenaEntered = true;
      s.dialog = '> NO RETURN. THE ENTITY AWAITS.';
      s.dialogTimer = 3200;
      onBossArena && onBossArena(true); // switch audio to boss tracks
    }

    const camTarget = r.x - GAME_W * 0.4;
    s.camera += (camTarget - s.camera) * 0.12;
    s.camera = Math.max(0, Math.min(WORLD_W - GAME_W, s.camera));

    const attackProgress = r.attackTimer > 0 ? (ATTACK_DUR - r.attackTimer) : -1;
    const attackActive = attackProgress >= ATTACK_HIT_MS[0] && attackProgress <= ATTACK_HIT_MS[1];
    const hitbox = attackActive ? {
      x: r.dir > 0 ? r.x + PLAYER_W - 12 : r.x - 36,
      y: r.y + 24,
      w: 56, h: PLAYER_H - 30,
    } : null;

    for (const en of s.enemies) {
      if (en.hp <= 0) continue;
      const dx = r.x - en.x;
      const distSq = dx*dx + (r.y - en.y) * (r.y - en.y);

      // Returns true if world x would place the enemy's foot-center over a pit
      const wouldFallInPit = (ex, halfW = 20) =>
        zonePits.some(p => ex + halfW > p.x && ex - halfW < p.x + p.w);

      // Boss AI — always pursues player, charges periodically
      if (en.type === 'boss') {
        const absDx = Math.abs(dx);
        en.chargeTimer = Math.max(0, (en.chargeTimer || 0) - dt);

        if (en.chargeActive) {
          en.x += en.vx * 2.6;
          if (en.chargeTimer <= 0) {
            en.chargeActive = false;
            en.chargeTimer = 1800; // cooldown between charges (ms)
            en.vx *= 0.1;
          }
        } else if (absDx < 380 && en.chargeTimer <= 0) {
          // Launch a charge whenever close enough and cooldown expired
          en.chargeActive = true;
          en.chargeTimer  = 800; // charge duration (ms)
          en.vx = (dx > 0 ? 1 : -1) * 0.9;
          en.dir = dx > 0 ? 1 : -1;
        } else {
          // Constant pursuit — speed scales with distance so he closes fast from far away
          // but slows before reaching the player (gives reaction window)
          if (absDx > 20) {
            const pursuitSpd = absDx > 300 ? 1.1 : absDx > 150 ? 0.75 : 0.5;
            en.vx = (dx > 0 ? 1 : -1) * pursuitSpd;
            en.dir = dx > 0 ? 1 : -1;
          } else {
            en.vx *= 0.8; // small dead-zone right at the player
          }
        }
        const nextX = en.x + en.vx;
        // Sanctum has no pits, so wouldFallInPit always returns false there
        if (!wouldFallInPit(nextX, 50)) en.x = nextX;
        else { en.vx = 0; en.chargeActive = false; en.chargeTimer = 1500; }
        // continue to hitbox checks below
      } else

      if (en.type === 'skullknife') {
        // Pit recovery: if already inside a pit push toward nearest edge
        const knifeInPit = zonePits.find(p => en.x + 20 > p.x && en.x - 20 < p.x + p.w);
        if (knifeInPit) {
          const toLeft  = Math.abs(en.x - knifeInPit.x);
          const toRight = Math.abs(en.x - (knifeInPit.x + knifeInPit.w));
          en.vx = toLeft < toRight ? -1.5 : 1.5;
          en.x += en.vx;
        } else {
        const absDx = Math.abs(dx);
        if (absDx < 200) {
          // Dead zone: don't micro-adjust when directly under the player —
          // prevents jitter and lets the player pass overhead without the enemy spinning.
          if (absDx > 24) {
            en.vx = (dx > 0 ? 1 : -1) * 0.9;
            en.dir = dx > 0 ? 1 : -1;
          } else {
            en.vx *= 0.7; // bleed off velocity naturally
          }
          en.state = absDx > 24 ? 'chase' : 'patrol';
        } else {
          en.state = 'patrol';
          if (en.x < 200) en.dir = 1;
          if (en.x > WORLD_W - 200) en.dir = -1;
          en.vx = en.dir * 0.6;
        }
        const nextX = en.x + en.vx;
        if (!wouldFallInPit(nextX)) en.x = nextX;
        else { en.dir *= -1; en.vx = 0; }
        }

      } else if (en.type === 'wraith') {
        // Wraith floats — no pit avoidance needed, but add horizontal dead zone
        en.y = (en.baseY || en.y) + Math.sin(performance.now() / 400 + en.id) * 10;
        if (Math.abs(dx) > 40 && Math.abs(dx) < 350) {
          en.x += (dx > 0 ? 1 : -1) * 0.4;
          en.dir = dx > 0 ? 1 : -1;
        }

      } else if (en.type === 'aphid') {
        // Pit recovery: if already inside a pit, push toward nearest edge
        const aphidInPit = zonePits.find(p => en.x + 20 > p.x && en.x - 20 < p.x + p.w);
        if (aphidInPit) {
          const toLeft  = Math.abs(en.x - aphidInPit.x);
          const toRight = Math.abs(en.x - (aphidInPit.x + aphidInPit.w));
          en.vx = toLeft < toRight ? -1.5 : 1.5;
          en.x += en.vx;
        } else {
        // Jittery fast chaser — changes speed unpredictably
        if (!en.jitterTimer) { en.jitterTimer = 0; en.jitterDir = 0; }
        en.jitterTimer = Math.max(0, en.jitterTimer - dt);
        if (en.jitterTimer <= 0) {
          en.jitterDir   = (Math.random() - 0.5) * 0.8;
          en.jitterTimer = 250 + Math.random() * 450;
        }
        const absDxA = Math.abs(dx);
        if (absDxA < 280) {
          en.vx  = (dx > 0 ? 1 : -1) * (1.5 + en.jitterDir);
          en.dir = dx > 0 ? 1 : -1;
          en.state = 'chase';
        } else {
          en.state = 'patrol';
          if (en.x < 150) en.dir = 1;
          if (en.x > WORLD_W - 150) en.dir = -1;
          en.vx = en.dir * 0.9;
        }
        const nextXa = en.x + en.vx;
        if (!wouldFallInPit(nextXa)) en.x = nextXa;
        else { en.dir *= -1; en.vx = 0; }
        }

      } else if (en.type === 'beetle') {
        // Slow armoured relentless advance — never stops, hard to kill
        const absDxB = Math.abs(dx);
        if (absDxB > 18) {
          en.vx  = (dx > 0 ? 1 : -1) * 0.62;
          en.dir = dx > 0 ? 1 : -1;
          en.state = 'chase';
        } else {
          en.vx *= 0.85; en.state = 'rest';
        }
        const nextXb = en.x + en.vx;
        if (!wouldFallInPit(nextXb, 38)) en.x = nextXb;
        else { en.dir *= -1; en.vx = 0; }

      } else if (en.type === 'butterfly') {
        // Floaty + random horizontal dashes — unpredictable
        en.y = (en.baseY || 115) + Math.sin(performance.now() / 500 + en.id * 1.9) * 28;
        if (!en.dashTimer) { en.dashTimer = 0; en.vx = 0; }
        en.dashTimer = Math.max(0, en.dashTimer - dt);
        if (en.dashTimer <= 0) {
          // bias toward player when close
          const toPlayer = Math.abs(dx) < 320 ? (dx > 0 ? 1 : -1) : (Math.random() > 0.5 ? 1 : -1);
          en.vx = toPlayer * (1.1 + Math.random() * 0.8);
          en.dir = en.vx > 0 ? 1 : -1;
          en.dashTimer = 500 + Math.random() * 700;
          en.state = 'chase';
        } else {
          en.vx *= 0.97; // soft drag
        }
        en.x = Math.max(80, Math.min(WORLD_W - 80, en.x + en.vx));

      } else if (en.type === 'boss_aphid') {
        // Mini-boss Queen: arena seal + periodic charges + steady pursuit
        const absDxM = Math.abs(dx);

        // Arena lock: first time player gets within 420px, seal behind them
        if (!en.arenaSealed && absDxM < 420 && en.hp > 0) {
          en.arenaSealed = true;
          s.queenSealX = r.x - 50; // seal 50px behind player's current position
          s.dialog = '> QUEEN ENTITY ENGAGED. SECTOR LOCKED.';
          s.dialogTimer = 3200;
        }
        // Clear seal when queen dies
        if (en.hp <= 0 && s.queenSealX != null) {
          s.queenSealX = null;
          s.dialog = '> QUEEN TERMINATED. SECTOR UNSEALED.';
          s.dialogTimer = 2500;
        }

        // Pit recovery only — queen has no gravity so she doesn't fall; avoidance
        // would block her from crossing the x=800 pit to reach the player.
        const queenInPit = zonePits.find(p => en.x + 42 > p.x && en.x - 42 < p.x + p.w);
        if (queenInPit) {
          const toLeft  = Math.abs(en.x - queenInPit.x);
          const toRight = Math.abs(en.x - (queenInPit.x + queenInPit.w));
          en.vx = toLeft < toRight ? -2.0 : 2.0;
          en.x += en.vx;
          en.chargeActive = false;
          en.chargeTimer = 1600;
        } else {
          en.chargeTimer = Math.max(0, (en.chargeTimer ?? 2000) - dt);
          if (en.chargeActive) {
            en.x = Math.max(100, Math.min(WORLD_W - 100, en.x + en.vx * 2.2));
            if (en.chargeTimer <= 0) { en.chargeActive = false; en.chargeTimer = 2000; en.vx *= 0.1; }
          } else if (absDxM < 320 && en.chargeTimer <= 0) {
            en.chargeActive = true; en.chargeTimer = 750;
            en.vx = (dx > 0 ? 1 : -1) * 0.95; en.dir = dx > 0 ? 1 : -1;
          } else {
            if (absDxM > 18) { en.vx = (dx > 0 ? 1 : -1) * 0.8; en.dir = dx > 0 ? 1 : -1; }
            else en.vx *= 0.85;
            en.x = Math.max(100, Math.min(WORLD_W - 100, en.x + en.vx));
          }
        }

      } else if (en.type === 'hound') {
        // Pit recovery: if hound is already inside a pit, push toward nearest edge
        const inPitNow = zonePits.find(p => en.x + 35 > p.x && en.x - 35 < p.x + p.w);
        if (inPitNow) {
          // Push toward whichever pit edge is closer
          const toLeft  = Math.abs(en.x - inPitNow.x);
          const toRight = Math.abs(en.x - (inPitNow.x + inPitNow.w));
          en.vx = toLeft < toRight ? -1.8 : 1.8;
          en.x += en.vx;
        } else {
          const absDx = Math.abs(dx);
          if (absDx < 260) {
            if (absDx > 35) {
              en.vx = (dx > 0 ? 1 : -1) * 1.6;
              en.dir = dx > 0 ? 1 : -1;
              en.state = 'charge';
            } else {
              en.vx = 0;
              en.state = 'rest';
            }
          } else {
            en.vx = 0;
            en.state = 'rest';
          }
          const nextX = en.x + en.vx;
          if (!wouldFallInPit(nextX, 35)) en.x = nextX;
          else { en.vx = 0; en.dir *= -1; }
        }
      }

      // Entity dimensions
      // boss: en.y = feet (GROUND_Y), body extends upward. All others: en.y = body top.
      const BOSS_BODY_H = 125; // shorter than full sprite — lets skilled players jump over
      // Collision widths/heights — sheet sprites use 362×362 cells at their scale.
      // boss_aphid at 0.36: sprite ~130px tall. beetle at 0.28: ~90px. aphid at 0.22: ~70px.
      const ew   = en.type === 'boss'       ? 100
                 : en.type === 'boss_aphid' ? 75
                 : en.type === 'beetle'     ? 55
                 : en.type === 'hound'      ? 70
                 : en.type === 'wraith'     ? 56
                 : en.type === 'aphid'      ? 38
                 : en.type === 'butterfly'  ? 40
                 : 40;
      const etop = en.type === 'boss' ? en.y - BOSS_BODY_H : en.y;
      const eh   = en.type === 'boss'       ? BOSS_BODY_H
                 : en.type === 'boss_aphid' ? 100
                 : en.type === 'beetle'     ? 80
                 : en.type === 'hound'      ? 50
                 : en.type === 'wraith'     ? 56
                 : en.type === 'aphid'      ? 64
                 : en.type === 'butterfly'  ? 50
                 : 64;

      if (hitbox && en.hp > 0) {
        const ex = en.x;
        if (ex < hitbox.x + hitbox.w && ex + ew > hitbox.x &&
            etop < hitbox.y + hitbox.h && etop + eh > hitbox.y) {
          if (!en.hitThisSwing) {
            en.hp -= 1;
            en.hitThisSwing = true;
            s.hitFlashes.push({ x: ex + ew/2, y: etop + eh/2, t: 250 });
          }
        }
      }
      if (!attackActive) en.hitThisSwing = false;

      // Sanctum boss kill → completion void
      if (en.type === 'boss' && en.hp <= 0 && s.zoneKey === 'sanctum' && !s.voidTriggered) {
        s.voidTriggered = true;
        s.dialog = '> ENTITY TERMINATED. RECORD UNLOCKED.';
        s.dialogTimer = 3000;
        setTimeout(() => { onNoticeFound && onNoticeFound(s.runTime); }, 1800);
      }

      // Contact damage — player walks/jumps into enemy body
      const overlapX = en.x < r.x + PLAYER_W - 16 && en.x + ew > r.x + 16;
      const overlapY = etop < r.y + PLAYER_H - 8  && etop + eh > r.y + 8;
      if (overlapX && overlapY && r.iframes <= 0 && en.hp > 0) {
        r.hp -= 1;
        r.iframes = IFRAMES_MS;
        r.vx = (en.x < r.x ? 4 : -4);
        r.vy = -5;
        s.hitFlashes.push({ x: r.x + PLAYER_W/2, y: r.y + PLAYER_H/2, t: 250 });
        if (r.hp <= 0) {
          r.dead = true;
          onDeath(s.runTime);
        }
      }
    }

    // Queen seal: wall off enemies that are near the seal boundary.
    // Only apply within ±60px of sealX so enemies already deep inside the arena
    // (e.g. skullknife spawning past the queen) are not teleported out.
    if (s.queenSealX != null) {
      for (const en of s.enemies) {
        if (en.hp <= 0 || en.type === 'boss_aphid') continue;
        if (en.x > s.queenSealX - 60 && en.x < s.queenSealX + 40) {
          en.x = Math.min(en.x, s.queenSealX - 22);
        }
      }
    }

    // Pickup collection
    {
      const live = stateRef.current;
      if (live && !live.reaper.dead) {
        const cx = live.reaper.x + PLAYER_W / 2;
        for (const pk of live.pickups) {
          if (!pk.taken && Math.abs(cx - pk.x) < 64) {
            pk.taken = true;
            live.reaper.hp = Math.min(5, live.reaper.hp + 1);
            // Gold burst + floating "+♥" text — makes collection unmistakably visible
            live.hitFlashes.push({ x: pk.x, y: pk.y - 10, t: 900, maxT: 900, gold: true, text: '+♥' });
            force();
          }
        }
      }
    }

    if (s.noticeItem && !s.noticeItem.taken) {
      const NH = 32;
      const ni = s.noticeItem;
      if (r.x < ni.x + NH && r.x + PLAYER_W > ni.x - NH &&
          r.y < ni.y + NH && r.y + PLAYER_H > ni.y - NH) {
        s.noticeItem.taken = true;
        if (!noticeFound) {
          // First discovery: hand off to the notice viewer
          onNoticeFound && onNoticeFound(s.runTime);
        } else {
          // Replay: stay in game, show a brief in-world log entry
          s.dialog = '> ARTIFACT CSG-DSC-04A. RECORD ALREADY SEALED.';
          s.dialogTimer = 4000;
        }
      }
    }

    s.hitFlashes = s.hitFlashes.map(f => ({ ...f, t: f.t - dt })).filter(f => f.t > 0);

    // Zone exit — blocked in vault/sanctum until the boss is dead
    const bossAlive = (s.zoneKey === 'vault' || s.zoneKey === 'sanctum') &&
                      s.enemies.some(e => e.type === 'boss' && e.hp > 0);
    const EXIT_X = WORLD_W - 140;
    if (!s.exitTriggered && r.x + PLAYER_W > EXIT_X - 20 && bossAlive && !s.bossHintShown) {
      s.bossHintShown = true;
      s.dialog = '> EXIT SEALED. ENTITY 0xDE4D MUST BE NEUTRALIZED.';
      s.dialogTimer = 3500;
    }
    if (!s.exitTriggered && r.x + PLAYER_W > EXIT_X - 20 && !bossAlive) {
      s.exitTriggered = true;
      s.exitTimer = 2800;
      const ZONE_ORDER = ['chapel', 'sluice', 'vault', 'sanctum'];
      const nextZone = ZONE_ORDER[(ZONE_ORDER.indexOf(s.zoneKey) + 1) % ZONE_ORDER.length];
      s.dialog = `> SECTOR ${zone.name} CLEARED. ADVANCING TO ${nextZone.toUpperCase()}.`;
      s.dialogTimer = 2800;
    }
    if (s.exitTriggered && s.exitTimer > 0) {
      s.exitTimer = Math.max(0, s.exitTimer - dt);
      if (s.exitTimer === 0) {
        const ZONE_ORDER = ['chapel', 'sluice', 'vault', 'sanctum'];
        const next = ZONE_ORDER[(ZONE_ORDER.indexOf(s.zoneKey) + 1) % ZONE_ORDER.length];
        onZoneChange(next);
      }
    }

    // Draw world to canvas — no React involvement for any moving part
    const canvas = canvasRef.current;
    if (canvas) drawGameFrame(canvas.getContext('2d'), s, zone, groundCache.current, force);

    // Throttle HUD React updates to ~15 fps — timer text doesn't need 60fps reconciliation
    frameCount.current++;
    if (frameCount.current % 4 === 0) force();
  }, true);

  // Only the HUD + overlay need React; world is fully canvas-drawn above
  const r = s.reaper;

  return (
    <div className="scene scene--game" data-zone={zoneKey}>
      <div className="game-viewport">
        <canvas
          ref={canvasRef}
          className="game-canvas"
          width={GAME_W}
          height={GAME_H}
        />
      </div>
      <GameHUD reaper={r} zone={zone} runTime={s.runTime} onZoneChange={onZoneChange} zoneKey={zoneKey} enemies={s.enemies} />
      {s.dialog && s.dialogTimer > 0 && (
        <div className={`dialog-box dialog-box--${zoneKey}`}>
          <div className="speaker">[CSG-LOG] · {zone.refCode}</div>
          <div>{s.dialog}</div>
        </div>
      )}
      <div className="input-strip">
        <span><kbd>← →</kbd> MOVE</span>
        <span><kbd>X</kbd>/<kbd>↑</kbd> JUMP</span>
        <span><kbd>Z</kbd>/<kbd>SPACE</kbd> ATTACK</span>
      </div>
    </div>
  );
}


function GameHUD({ reaper, zone, runTime, onZoneChange, zoneKey, enemies }) {
  const hearts = [];
  for (let i = 0; i < 5; i++) {
    hearts.push(<div key={i} className={`heart ${i < reaper.hp ? '' : 'empty'}`} />);
  }
  const tt = Math.floor(runTime);
  const mm = Math.floor(tt / 60);
  const ss = tt % 60;
  const ms = Math.floor((runTime - tt) * 100);

  // Boss HP bar — full-width, shown only in sanctum when boss lives
  const boss = zoneKey === 'sanctum' && enemies?.find(e => e.type === 'boss' && e.hp > 0);

  return (
    <>
      {boss && (
        <div className="boss-hud">
          <div className="boss-hud-label">▲ ENTITY 0xDE4D · SANCTUM SEAL ACTIVE</div>
          <div className="boss-hud-bar-track">
            <div className="boss-hud-bar-fill" style={{ width: `${(boss.hp / (boss.maxHp || 12)) * 100}%` }} />
          </div>
          <div className="boss-hud-sub">CSG-DSC-04A · CONTAINMENT BREACH · TERMINATE TO PROCEED</div>
        </div>
      )}
      <div className="hud">
        <div className="hud-block">
          <span className="hud-label">▲ OPERATOR</span>
          <div className="heart-row">{hearts}</div>
          <span className="hud-label hud-label--zone">{zone.refCode}</span>
        </div>
        <div className="hud-block hud-block--center">
          <span className="hud-label hud-zone-name">
            {zone.name} · <span className="hud-zone-jp">{zone.nameJP}</span>
          </span>
          {/* Only show zone switcher outside boss zones — no escape from the entity */}
          {zoneKey !== 'vault' && zoneKey !== 'sanctum' && (
            <div className="zone-switcher">
              {Object.keys(ZONES).map(z => (
                <button
                  key={z}
                  className={`zone-btn zone-btn--${z}${z === zoneKey ? ' zone-btn--active' : ''}`}
                  onClick={() => onZoneChange(z)}
                >
                  {ZONES[z].name.slice(0, 3)}
                </button>
              ))}
            </div>
          )}
        </div>
        <div className="hud-block right">
          <span className="hud-label">RUN TIME</span>
          <span className="hud-value">
            {String(mm).padStart(2,'0')}:{String(ss).padStart(2,'0')}:{String(ms).padStart(2,'0')}
          </span>
          <span className="hud-label">▲ <span className="blink">●</span> REC</span>
        </div>
      </div>
    </>
  );
}

export { Game };
