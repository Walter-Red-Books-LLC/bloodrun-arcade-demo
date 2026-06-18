// BLOODRUN.exe — Pixel renderer + reusable UI bits

import { useState, useEffect, useRef, useCallback } from 'react';

// ── Imperative canvas draw ────────────────────────────────────────────────────
// Used by canvas-backed components (GroundStrip) to avoid box-shadow overhead
// in software-rendering mode (GPU disabled).
export function drawSprite(ctx, data, palette, x, y, scale, flip = false) {
  const h = data.length;
  const w = (data[0] || '').length;
  for (let row = 0; row < h; row++) {
    for (let col = 0; col < w; col++) {
      const color = palette[data[row][col]];
      if (!color || color === 'transparent') continue;
      const px = flip ? (w - 1 - col) : col;
      ctx.fillStyle = color;
      ctx.fillRect(x + px * scale, y + row * scale, scale, scale);
    }
  }
}

// Render a 2D pixel sprite as box-shadow on a 1×1 element.
function PixelSprite({ data, palette, scale = 4, flip = false, style = {}, className = '' }) {
  const h = data.length;
  const w = data[0]?.length || 0;
  const shadows = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const ch = data[y][x];
      const c = palette[ch];
      if (!c || c === 'transparent') continue;
      const px = (flip ? (w - 1 - x) : x) * scale;
      const py = y * scale;
      shadows.push(`${px}px ${py}px 0 ${c}`);
    }
  }
  return (
    <div
      className={`pixel-art ${className}`}
      style={{
        position: 'relative',
        width: w * scale,
        height: h * scale,
        ...style,
      }}
    >
      <div
        style={{
          position: 'absolute',
          left: 0, top: 0,
          width: scale, height: scale,
          boxShadow: shadows.join(', '),
        }}
      />
    </div>
  );
}

// VHS overlay — scanlines + chroma + grain + tracking
function VHSOverlay({ intensity = 70 }) {
  const scan = Math.min(1, intensity / 90);
  const grain = Math.min(1, intensity / 200);
  const track = intensity > 30 ? Math.min(1, (intensity - 30) / 70) : 0;
  return (
    <>
      <div className="vhs-grain" style={{ '--vhs-grain-opacity': grain * 0.4 }} />
      <div className="vhs-scanlines" style={{ '--vhs-scan-opacity': scan * 0.7 }} />
      <div className="vhs-tracking" style={{ '--vhs-track-opacity': track }} />
    </>
  );
}

// Persistent CSG classification bars + corner katakana
function CSGChrome({ refCode = 'CSG-DSC-04A', heavy = true }) {
  if (!heavy) {
    return (
      <div style={{
        position: 'absolute', right: 14, bottom: 6, zIndex: 30,
        fontFamily: 'IBM Plex Mono', fontSize: 10, letterSpacing: '0.2em',
        color: 'var(--csg-amber-dim)', textTransform: 'uppercase',
      }}>{refCode}</div>
    );
  }
  return (
    <>
      <div className="csg-bar csg-bar--top">
        <span>▲ CATALYST SYSTEMS GROUP &nbsp;·&nbsp; RESTRICTED — INTERNAL DISTRIBUTION ONLY</span>
        <span>{refCode} &nbsp; <span className="blink">●</span> REC</span>
      </div>
      <div className="csg-bar csg-bar--bottom">
        <span>FOR DIAGNOSTIC USE ONLY · NOT FOR GENERAL RELEASE</span>
        <span>REV. 1996.10.31 · PAGE 04 OF 12</span>
      </div>
    </>
  );
}

// Corner VHS labels — katakana + english
function VHSCorners({ tl, tr, bl, br }) {
  return (
    <>
      {tl && <div className="vhs-corner vhs-corner--tl">{tl}</div>}
      {tr && <div className="vhs-corner vhs-corner--tr">{tr}</div>}
      {bl && <div className="vhs-corner vhs-corner--bl">{bl}</div>}
      {br && <div className="vhs-corner vhs-corner--br">{br}</div>}
    </>
  );
}

// Glitch text — duplicates content with red/green chromatic split
function GlitchText({ children, style = {}, className = '' }) {
  const text = typeof children === 'string' ? children : '';
  return (
    <span className={`glitch-text ${className}`} data-text={text} style={style}>
      {children}
    </span>
  );
}

// Typewriter hook — reveals text one char at a time
function useTypewriter(text, speed = 30, start = true) {
  const [out, setOut] = useState('');
  useEffect(() => {
    if (!start) { setOut(''); return; }
    let i = 0;
    setOut('');
    const id = setInterval(() => {
      i++;
      setOut(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, speed);
    return () => clearInterval(id);
  }, [text, speed, start]);
  return out;
}

// Keyboard listener hook
function useKey(handler, deps = []) {
  useEffect(() => {
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
    // eslint-disable-next-line
  }, deps);
}

// Animation frame hook — calls fn(dt) every frame while active
function useGameLoop(fn, active = true) {
  const fnRef = useRef(fn);
  fnRef.current = fn;
  useEffect(() => {
    if (!active) return;
    let raf;
    let last = performance.now();
    const tick = (now) => {
      const dt = Math.min(50, now - last);
      last = now;
      fnRef.current(dt);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active]);
}

// Render an image sprite anchored at its head position.
// All reaper frames are 362×362 PNGs with HEAD anchor at (181, 40).
function FootSprite({ src, scale = 1, dir = 1, anchorX = 181, anchorY = 40, frameW = 362, frameH = 362, rim = true }) {
  const w = frameW * scale;
  const h = frameH * scale;
  const rimFilter = rim
    ? 'drop-shadow(1px 0 0 #000) drop-shadow(-1px 0 0 #000) drop-shadow(0 1px 0 #000) drop-shadow(0 -1px 0 #000)'
    : 'none';
  return (
    <img
      src={src}
      draggable={false}
      style={{
        position: 'absolute',
        width: w,
        height: h,
        left: -(anchorX * scale),
        top: -(anchorY * scale),
        transform: dir < 0 ? 'scaleX(-1)' : 'none',
        transformOrigin: `${anchorX * scale}px ${anchorY * scale}px`,
        imageRendering: 'auto',
        pointerEvents: 'none',
        userSelect: 'none',
        filter: rimFilter,
      }}
    />
  );
}

export {
  PixelSprite, FootSprite, VHSOverlay, CSGChrome, VHSCorners, GlitchText,
  useTypewriter, useKey, useGameLoop,
};
