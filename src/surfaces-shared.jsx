// BLOODRUN.exe — Fictional Surfaces / shared bits

import { useState, useEffect, useRef, useId } from 'react';

// The BLOODRUN sigil — crown of thorns with a drop.
function CSGGlyph({ size = 24, color, strokeWidth }) {
  return (
    <img
      src="assets/blood-sigil.png"
      alt=""
      width={size}
      height={size}
      draggable={false}
      style={{
        display: 'block',
        objectFit: 'contain',
        pointerEvents: 'none',
        userSelect: 'none',
      }}
    />
  );
}

// Tiny pixel-y "BLOODRUN" icon — used as desktop / file icon
function BloodrunIcon({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" shapeRendering="crispEdges">
      {/* monitor */}
      <rect x="2" y="3" width="28" height="22" fill="#c0c0c0" />
      <rect x="2" y="3" width="28" height="1" fill="#ffffff" />
      <rect x="2" y="3" width="1" height="22" fill="#ffffff" />
      <rect x="29" y="3" width="1" height="22" fill="#000000" />
      <rect x="2" y="24" width="28" height="1" fill="#000000" />
      {/* screen */}
      <rect x="4" y="5" width="24" height="17" fill="#0a0606" />
      {/* logo text */}
      <rect x="6" y="9"  width="20" height="2" fill="#E62028" />
      <rect x="7" y="13" width="18" height="2" fill="#E62028" />
      <rect x="9" y="17" width="14" height="2" fill="#F5A524" />
      {/* base */}
      <rect x="12" y="25" width="8" height="3" fill="#808080" />
      <rect x="9" y="28" width="14" height="2" fill="#c0c0c0" />
      <rect x="9" y="28" width="14" height="1" fill="#ffffff" />
      <rect x="9" y="29" width="14" height="1" fill="#000000" />
    </svg>
  );
}

// Generic Win95 file/folder icons (pixel-style)
function FolderIcon({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" shapeRendering="crispEdges">
      <rect x="2" y="9" width="11" height="3" fill="#dac56d"/>
      <rect x="2" y="9" width="11" height="1" fill="#fff19a"/>
      <rect x="2" y="12" width="28" height="16" fill="#dac56d"/>
      <rect x="2" y="12" width="28" height="1" fill="#fff19a"/>
      <rect x="2" y="12" width="1" height="16" fill="#fff19a"/>
      <rect x="29" y="12" width="1" height="16" fill="#7c6a2e"/>
      <rect x="2" y="27" width="28" height="1" fill="#7c6a2e"/>
    </svg>
  );
}
function DocIcon({ size = 32, tone = '#ffffff' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" shapeRendering="crispEdges">
      <rect x="6" y="3" width="18" height="26" fill={tone}/>
      <rect x="6" y="3" width="18" height="1" fill="#ffffff"/>
      <rect x="6" y="3" width="1" height="26" fill="#ffffff"/>
      <rect x="23" y="3" width="1" height="26" fill="#808080"/>
      <rect x="6" y="28" width="18" height="1" fill="#808080"/>
      <rect x="9" y="8" width="12" height="1" fill="#808080"/>
      <rect x="9" y="11" width="12" height="1" fill="#808080"/>
      <rect x="9" y="14" width="12" height="1" fill="#808080"/>
      <rect x="9" y="17" width="8" height="1" fill="#808080"/>
      <rect x="9" y="20" width="12" height="1" fill="#808080"/>
      <rect x="9" y="23" width="10" height="1" fill="#808080"/>
    </svg>
  );
}
function HazardIcon({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" shapeRendering="crispEdges">
      <polygon points="16,3 30,28 2,28" fill="#F5A524" stroke="#000" strokeWidth="1"/>
      <rect x="15" y="11" width="2" height="9" fill="#000"/>
      <rect x="15" y="22" width="2" height="2" fill="#000"/>
    </svg>
  );
}

// Title bar "system menu" mini-icon
function TitlebarMiniIcon({ kind = 'doc' }) {
  if (kind === 'csg') {
    return (
      <div style={{ width: 16, height: 16, background: '#000', display: 'grid', placeItems: 'center' }}>
        <CSGGlyph size={14} color="#F5A524" strokeWidth={3}/>
      </div>
    );
  }
  if (kind === 'bloodrun') return <BloodrunIcon size={16}/>;
  if (kind === 'compat') {
    return (
      <svg width={16} height={16} viewBox="0 0 16 16" shapeRendering="crispEdges">
        <rect x="1" y="2" width="14" height="11" fill="#c0c0c0"/>
        <rect x="1" y="2" width="14" height="1" fill="#fff"/>
        <rect x="1" y="2" width="1" height="11" fill="#fff"/>
        <rect x="2" y="3" width="12" height="9" fill="#008080"/>
        <rect x="6" y="13" width="4" height="1" fill="#808080"/>
        <rect x="4" y="14" width="8" height="1" fill="#808080"/>
      </svg>
    );
  }
  return <DocIcon size={16} tone="#fff"/>;
}

// Title bar buttons: minimize, maximize, close (Win95 glyphs)
function TitlebarButtons({ disableClose = false }) {
  return (
    <div className="w95-titlebar-buttons">
      <div className="w95-tb-btn" title="Minimize">
        <svg width="8" height="8" viewBox="0 0 8 8" shapeRendering="crispEdges"><rect x="1" y="6" width="6" height="2" fill="black"/></svg>
      </div>
      <div className="w95-tb-btn" title="Maximize">
        <svg width="8" height="8" viewBox="0 0 8 8" shapeRendering="crispEdges">
          <rect x="0" y="0" width="8" height="8" fill="none" stroke="black" strokeWidth="1"/>
          <rect x="0" y="0" width="8" height="2" fill="black"/>
        </svg>
      </div>
      <div className="w95-tb-btn" title="Close" style={{ marginLeft: 2 }}>
        <svg width="8" height="8" viewBox="0 0 8 8" shapeRendering="crispEdges">
          <path d="M0,0 L8,8 M8,0 L0,8" stroke={disableClose ? '#808080' : 'black'} strokeWidth="1.2"/>
        </svg>
      </div>
    </div>
  );
}

// Helper noise svg for grimy banner
function NoiseLayer({ opacity = 0.15, freq = 1.2, octaves = 2 }) {
  const id = useId();
  return (
    <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity }} preserveAspectRatio="none">
      <filter id={`n-${id}`}>
        <feTurbulence type="fractalNoise" baseFrequency={freq} numOctaves={octaves} stitchTiles="stitch"/>
        <feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.6 0"/>
      </filter>
      <rect width="100%" height="100%" filter={`url(#n-${id})`}/>
    </svg>
  );
}

export { CSGGlyph, BloodrunIcon, FolderIcon, DocIcon, HazardIcon, TitlebarMiniIcon, TitlebarButtons, NoiseLayer };
