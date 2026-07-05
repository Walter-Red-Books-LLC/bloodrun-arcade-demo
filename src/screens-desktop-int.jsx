// BLOODRUN.exe — Interactive Win95 desktop + mid-game breakout overlay
// Every element does something.

import { useState, useRef, useEffect, useCallback } from 'react';
import { useKey } from './sprites-engine.jsx';
import {
  CSGGlyph, BloodrunIcon, FolderIcon, DocIcon, HazardIcon,
  TitlebarMiniIcon, TitlebarButtons,
} from './surfaces-shared.jsx';

// ── Shared primitives ────────────────────────────────────────────────────────

function DesktopBg() {
  return (
    <div style={{ position: 'absolute', inset: 0,
      background: 'radial-gradient(ellipse at 50% 40%, #0c2a2c 0%, #062023 50%, #021214 100%)' }}>
      <div style={{ position: 'absolute', inset: 0, opacity: 0.4,
        backgroundImage: 'repeating-linear-gradient(0deg, rgba(255,255,255,0.015) 0 2px, transparent 2px 4px)' }}/>
    </div>
  );
}

function DesktopIcon({ icon, label, selected, onActivate, onSingleClick }) {
  const lastClickAt = useRef(0);
  const onClick = (e) => {
    e.stopPropagation();
    const now = Date.now();
    if (now - lastClickAt.current < 400) {
      lastClickAt.current = 0;
      onActivate && onActivate();
    } else {
      lastClickAt.current = now;
      onSingleClick && onSingleClick();
    }
  };
  return (
    <div className={`w95-desktop-icon${selected ? ' selected' : ''}`}
         style={{ cursor: 'default' }}
         onClick={onClick}
         onDoubleClick={(e) => { e.stopPropagation(); onActivate && onActivate(); }}>
      {icon}
      <div className="label">{label}</div>
    </div>
  );
}

// Thin Win95-style window chrome wrapper — with working min/max/restore
function W95Window({ id, title, iconKind = 'doc', width, style = {}, zIndex, onFocus, onClose,
                     minimized = false, maximized = false, onMinimize, onMaximize, children }) {
  if (minimized) return null; // hidden until restored via taskbar

  const wStyle = maximized
    ? { position: 'absolute', inset: '0 0 30px 0', width: 'auto', zIndex }
    : { position: 'absolute', width, boxShadow: '4px 4px 0 rgba(0,0,0,0.55)', zIndex, ...style };

  return (
    <div className="w95 w95-window"
         onMouseDown={() => onFocus && onFocus(id)}
         style={{ ...wStyle, display: 'flex', flexDirection: 'column' }}>
      <div className="w95-titlebar">
        <TitlebarMiniIcon kind={iconKind}/>
        <div className="w95-title-text">{title}</div>
        <div className="w95-titlebar-buttons">
          {/* Minimize */}
          <div className="w95-tb-btn" title="Minimize"
               onClick={(e) => { e.stopPropagation(); onMinimize && onMinimize(id); }}>
            <svg width="8" height="8" viewBox="0 0 8 8" shapeRendering="crispEdges">
              <rect x="1" y="6" width="6" height="2" fill="black"/>
            </svg>
          </div>
          {/* Maximize / Restore */}
          <div className="w95-tb-btn" title={maximized ? 'Restore' : 'Maximize'}
               onClick={(e) => { e.stopPropagation(); onMaximize && onMaximize(id); }}>
            {maximized
              ? <svg width="8" height="8" viewBox="0 0 8 8" shapeRendering="crispEdges">
                  <rect x="2" y="0" width="6" height="6" fill="none" stroke="black" strokeWidth="1"/>
                  <rect x="0" y="2" width="6" height="6" fill="#c0c0c0" stroke="black" strokeWidth="1"/>
                  <rect x="0" y="2" width="6" height="2" fill="black"/>
                </svg>
              : <svg width="8" height="8" viewBox="0 0 8 8" shapeRendering="crispEdges">
                  <rect x="0" y="0" width="8" height="8" fill="none" stroke="black" strokeWidth="1"/>
                  <rect x="0" y="0" width="8" height="2" fill="black"/>
                </svg>
            }
          </div>
          {/* Close */}
          <div className="w95-tb-btn" style={{ marginLeft: 2 }}
               onClick={(e) => { e.stopPropagation(); onClose && onClose(id); }}>
            <svg width="8" height="8" viewBox="0 0 8 8" shapeRendering="crispEdges">
              <path d="M0,0 L8,8 M8,0 L0,8" stroke="black" strokeWidth="1.2"/>
            </svg>
          </div>
        </div>
      </div>
      {children}
    </div>
  );
}

// ── Window contents ──────────────────────────────────────────────────────────

const README_TEXT = `C:\\PROGRAM FILES\\CSG\\DSC04A\\README.WRI
────────────────────────────────────────────
BLOODRUN.exe — Operator Notes (rev. 1996.10.31)

This is a diagnostic distribution. You are not
the first operator.

The three sectors (CHAPEL, SLUICE, VAULT) were mapped
from the artifact's internal state. CSG does not assert
that these names are the artifact's own designations.

NOTE ON SAVE2.SAV:
  Do not attempt to restore this save state. The terminal
  condition is unresolvable and the operator who generated
  SAVE2.SAV has not been identified.

NOTE ON UNINST.EXE:
  Removal of this artifact is not permitted under the
  terms of CSG-LIC-04. The uninstaller key has been
  withheld by the distribution envelope.

NOTE ON EXTENDED OPERATION:
  Operators who run the artifact for extended periods
  have reported anomalous behavior in adjacent processes.
  CSG records all diagnostic sessions. This is standard
  procedure.

  If you experience recurrence (ref § 4.A.ii), contact
  CSG at the address on file.

  There is no address on file.

────────────────────────────────────────────
Catalyst Systems Group — Internal Only
CSG-DSC-04A · Not For General Distribution`;

function ReadmeWindow({ zIndex, onFocus, onClose }) {
  return (
    <W95Window id="readme" title="README.WRI - WordPad" iconKind="doc"
               width={400} style={{ left: 80, top: 55 }}
               zIndex={zIndex} onFocus={onFocus} onClose={onClose}>
      <div style={{ background: '#c0c0c0', padding: '2px 4px', borderBottom: '1px solid #808080', fontSize: 11 }}>
        <span style={{ marginRight: 10 }}><u>F</u>ile</span>
        <span style={{ marginRight: 10 }}><u>E</u>dit</span>
        <span style={{ marginRight: 10 }}><u>V</u>iew</span>
        <span style={{ marginRight: 10 }}><u>H</u>elp</span>
      </div>
      <div className="w95-inset" style={{ margin: 4, padding: 8, background: '#fff', height: 260, overflowY: 'auto' }}>
        <pre style={{ fontFamily: '"Courier New", monospace', fontSize: 10, lineHeight: 1.45, color: '#000', margin: 0, whiteSpace: 'pre-wrap' }}>
          {README_TEXT}
        </pre>
      </div>
      <div className="w95-statusbar">
        <div className="field">For Help, press F1</div>
      </div>
    </W95Window>
  );
}

function MyComputerWindow({ zIndex, minimized, maximized, onMinimize, onMaximize, onFocus, onClose }) {
  const drives = [
    { label: '3½ Floppy (A:)', icon: '💾', free: '0 bytes', total: '1.44 MB' },
    { label: 'Local Disk (C:)',   icon: '🖥', free: '1,420 MB', total: '2,048 MB' },
    { label: 'BLOODRUN_96 (D:)',  icon: '💿', free: '—',        total: '650 MB', warn: true },
  ];
  return (
    <W95Window id="my-computer" title="My Computer" iconKind="doc"
               width={320} style={{ left: 220, top: 40 }}
               zIndex={zIndex} minimized={minimized} maximized={maximized}
               onMinimize={onMinimize} onMaximize={onMaximize}
               onFocus={onFocus} onClose={onClose}>
      <div style={{ background: '#c0c0c0', padding: '2px 4px', borderBottom: '1px solid #808080', fontSize: 11 }}>
        <span style={{ marginRight: 10 }}><u>F</u>ile</span>
        <span style={{ marginRight: 10 }}><u>E</u>dit</span>
        <span style={{ marginRight: 10 }}><u>V</u>iew</span>
        <span style={{ marginRight: 10 }}><u>H</u>elp</span>
      </div>
      <div className="w95-inset" style={{ margin: 4, background: '#fff', padding: 8, minHeight: 120 }}>
        {drives.map((d, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 2px',
                                fontSize: 11, color: d.warn ? '#a8281c' : '#000', cursor: 'default' }}>
            <span style={{ fontSize: 18 }}>{d.icon}</span>
            <div>
              <div style={{ fontWeight: 600 }}>{d.label}</div>
              <div style={{ fontSize: 10, color: '#404040' }}>{d.free} free · {d.total}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="w95-statusbar"><div className="field">3 object(s)</div></div>
    </W95Window>
  );
}

function RecycleBinWindow({ zIndex, onFocus, onClose, onCorruptOpen }) {
  const items = [
    { name: 'SAVE2.SAV',     date: '??/??/??', origin: 'C:\\PROGRAM FILES\\CSG\\DSC04A\\', warn: true },
    { name: '[REDACTED].LOG', date: '??/??/??', origin: '[PATH SEALED]', warn: true },
  ];
  return (
    <W95Window id="recycle-bin" title="Recycle Bin" iconKind="doc"
               width={380} style={{ left: 140, top: 90 }}
               zIndex={zIndex} onFocus={onFocus} onClose={onClose}>
      <div style={{ background: '#c0c0c0', padding: '2px 4px', borderBottom: '1px solid #808080', fontSize: 11 }}>
        <span style={{ marginRight: 10 }}><u>F</u>ile</span>
        <span style={{ marginRight: 10 }}><u>E</u>dit</span>
        <span style={{ marginRight: 10 }}><u>V</u>iew</span>
        <span style={{ marginRight: 10 }}><u>H</u>elp</span>
      </div>
      <div className="w95-inset" style={{ margin: 4, background: '#fff', minHeight: 80 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 1fr', fontSize: 11, fontWeight: 700,
                      background: '#c0c0c0', borderBottom: '1px solid #808080' }}>
          <div style={{ padding: '2px 6px' }}>Name</div>
          <div style={{ padding: '2px 6px' }}>Deleted</div>
          <div style={{ padding: '2px 6px' }}>Original Location</div>
        </div>
        {items.map((r, i) => (
          <div key={i} onDoubleClick={() => r.warn && onCorruptOpen && onCorruptOpen()}
               style={{ display: 'grid', gridTemplateColumns: '1fr 80px 1fr', fontSize: 11,
                        color: r.warn ? '#a8281c' : '#000', cursor: 'default', padding: '1px 0' }}>
            <div style={{ padding: '1px 6px', display: 'flex', gap: 4 }}>
              <HazardIcon size={14}/> {r.name}
            </div>
            <div style={{ padding: '1px 6px' }}>{r.date}</div>
            <div style={{ padding: '1px 6px', fontFamily: '"Courier New", monospace', fontSize: 10 }}>{r.origin}</div>
          </div>
        ))}
      </div>
      <div className="w95-statusbar">
        <div className="field">2 object(s) — cannot be restored</div>
      </div>
    </W95Window>
  );
}

function SaveViewerWindow({ id, saveNum, corrupt, zIndex, onFocus, onClose, onCorruptOpen }) {
  if (corrupt) {
    return (
      <W95Window id={id} title={`SAVE${saveNum}.SAV — Properties`} iconKind="doc"
                 width={300} style={{ left: 180 + saveNum * 20, top: 120 + saveNum * 20 }}
                 zIndex={zIndex} onFocus={onFocus} onClose={onClose}>
        <div style={{ padding: 14, display: 'flex', gap: 10 }}>
          <div className="icon-stop">✕</div>
          <div style={{ fontSize: 11, lineHeight: 1.5 }}>
            <div><b>SAVE{saveNum}.SAV</b></div>
            <div style={{ color: '#a8281c', marginTop: 4 }}>File is corrupt. Terminal state unresolvable.</div>
            <div style={{ marginTop: 4, fontSize: 10, color: '#404040' }}>The operator who generated this save has not been identified.</div>
          </div>
        </div>
        <div style={{ padding: '0 12px 10px', display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
          <div className="w95-btn default" onClick={() => onClose && onClose(id)}>OK</div>
        </div>
      </W95Window>
    );
  }
  const data = saveNum === 0
    ? { op: '<UNATTRIBUTED>', zone: 'CHAPEL', time: '00:14:22', loop: 1, hp: 0, state: 'EXPIRED' }
    : { op: '<UNATTRIBUTED>', zone: 'SLUICE', time: '00:03:08', loop: 0, hp: 1, state: 'EXPIRED' };
  return (
    <W95Window id={id} title={`SAVE${saveNum}.SAV — Run Record`} iconKind="doc"
               width={300} style={{ left: 150 + saveNum * 20, top: 100 + saveNum * 20 }}
               zIndex={zIndex} onFocus={onFocus} onClose={onClose}>
      <div style={{ padding: 12, fontSize: 11, lineHeight: 1.6, fontFamily: '"Courier New", monospace' }}>
        <div><b style={{ fontFamily: 'inherit' }}>OPERATOR</b> : {data.op}</div>
        <div><b style={{ fontFamily: 'inherit' }}>ZONE</b>     : {data.zone}</div>
        <div><b style={{ fontFamily: 'inherit' }}>RUN TIME</b> : {data.time}</div>
        <div><b style={{ fontFamily: 'inherit' }}>LOOP</b>     : {data.loop}</div>
        <div><b style={{ fontFamily: 'inherit' }}>HP</b>       : {data.hp}/5</div>
        <div style={{ marginTop: 6, color: '#a8281c' }}><b style={{ fontFamily: 'inherit' }}>STATUS</b>   : {data.state}</div>
      </div>
      <div style={{ padding: '0 12px 10px', display: 'flex', justifyContent: 'flex-end' }}>
        <div className="w95-btn default" onClick={() => onClose && onClose(id)}>Close</div>
      </div>
    </W95Window>
  );
}

function LicenseTextWindow({ zIndex, onFocus, onClose }) {
  return (
    <W95Window id="csg-lic" title="CSG-LIC-04.TXT — Notepad" iconKind="doc"
               width={380} style={{ left: 100, top: 70 }}
               zIndex={zIndex} onFocus={onFocus} onClose={onClose}>
      <div className="w95-inset" style={{ margin: 4, background: '#fff', height: 200, overflowY: 'auto', padding: 6 }}>
        <pre style={{ fontFamily: '"Courier New", monospace', fontSize: 10, lineHeight: 1.4, color: '#000', whiteSpace: 'pre-wrap', margin: 0 }}>
{`CATALYST SYSTEMS GROUP — CSG-LIC-04
REV. 1991.11.02

The artifact BLOODRUN.exe is distributed without warranty
of any kind. CSG does not assert authorship. No
representation is made as to origin, fitness, or behavior.

By operating this artifact the Operator waives all claims
present and prospective, including:
  (i)   physical reaction to the Artifact's presentation;
  (ii)  recurrence, in waking or dreaming state, of any
        imagery rendered during operation;
  (iii) failure of the Artifact to terminate;
  (iv)  contact, by any means, with parties not enumerated.

Reproduction or redistribution is prohibited.
Inquiries are not accepted at this address.

— END OF LICENSE —`}
        </pre>
      </div>
    </W95Window>
  );
}

function FileAccessError({ id, filename, zIndex, onFocus, onClose }) {
  return (
    <W95Window id={id} title="Access Denied" iconKind="doc"
               width={320} style={{ left: 200, top: 150 }}
               zIndex={zIndex} onFocus={onFocus} onClose={onClose}>
      <div style={{ padding: 14, display: 'flex', gap: 10 }}>
        <div className="icon-stop">✕</div>
        <div style={{ fontSize: 11, lineHeight: 1.5 }}>
          <b>{filename}</b>
          <div style={{ marginTop: 6 }}>Cannot open file: this file is sealed under the distribution envelope.</div>
          <div style={{ marginTop: 4, color: '#a8281c', fontSize: 10 }}>Access prohibited by CSG-LIC-04 § 5.1</div>
        </div>
      </div>
      <div style={{ padding: '0 12px 10px', display: 'flex', justifyContent: 'flex-end' }}>
        <div className="w95-btn default" onClick={() => onClose && onClose(id)}>OK</div>
      </div>
    </W95Window>
  );
}

function NetworkError({ zIndex, onFocus, onClose }) {
  return (
    <W95Window id="net-error" title="Network Neighborhood" iconKind="doc"
               width={340} style={{ left: 240, top: 100 }}
               zIndex={zIndex} onFocus={onFocus} onClose={onClose}>
      <div style={{ padding: 14, display: 'flex', gap: 10 }}>
        <div className="icon-warn"/>
        <div style={{ fontSize: 11, lineHeight: 1.5 }}>
          <div>\\CSGRG\DSC04A</div>
          <div style={{ marginTop: 6, color: '#7a1014' }}>Network path not found.</div>
          <div style={{ marginTop: 4, fontSize: 10, color: '#404040' }}>The network address is no longer active. This machine may be operating outside the authorized envelope.</div>
        </div>
      </div>
      <div style={{ padding: '0 12px 10px', display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
        <div className="w95-btn default" onClick={() => onClose && onClose('net-error')}>OK</div>
      </div>
    </W95Window>
  );
}

function UninstError({ zIndex, onFocus, onClose }) {
  return (
    <W95Window id="uninst-error" title="UNINST.EXE — Error" iconKind="doc"
               width={360} style={{ left: 160, top: 130 }}
               zIndex={zIndex} onFocus={onFocus} onClose={onClose}>
      <div style={{ padding: 14, display: 'flex', gap: 10 }}>
        <div className="icon-stop">✕</div>
        <div style={{ fontSize: 11, lineHeight: 1.55 }}>
          <div>Removal of <b>BLOODRUN.exe</b> is not permitted.</div>
          <div style={{ marginTop: 6, color: '#a8281c' }}>Operation prohibited by distribution envelope CSG-LIC-04.</div>
          <div style={{ marginTop: 4, fontSize: 10, color: '#404040' }}>The uninstall key was withheld at the time of installation. To report this condition, contact CSG at the address on file.</div>
          <div style={{ marginTop: 2, fontSize: 10, color: '#808080', fontStyle: 'italic' }}>There is no address on file.</div>
        </div>
      </div>
      <div style={{ padding: '0 12px 10px', display: 'flex', justifyContent: 'flex-end' }}>
        <div className="w95-btn default" onClick={() => onClose && onClose('uninst-error')}>OK</div>
      </div>
    </W95Window>
  );
}

// ── Start menu ───────────────────────────────────────────────────────────────

function StartMenu({ onClose, onLaunch, onShutdown, onOpenReadme, onOpenMyComputer }) {
  return (
    <div style={{
      position: 'absolute', bottom: 30, left: 0, zIndex: 200,
      width: 200, background: '#c0c0c0',
      border: '2px outset #ffffff',
      boxShadow: '3px 3px 0 rgba(0,0,0,0.5)',
    }} onClick={(e) => e.stopPropagation()}>
      {/* Side banner */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 24,
        background: 'linear-gradient(to top, #000080, #404040)',
        display: 'flex', alignItems: 'flex-end', paddingBottom: 8,
      }}>
        <span style={{ color: '#fff', fontSize: 11, fontWeight: 700, writingMode: 'vertical-rl',
                       transform: 'rotate(180deg)', letterSpacing: '0.1em', paddingLeft: 4 }}>
          RUNTIME 95
        </span>
      </div>

      <div style={{ marginLeft: 24 }}>
        {[
          { label: 'Programs',  sub: 'BLOODRUN.exe…', action: onLaunch },
          { label: 'Documents', sub: 'README.WRI…', action: onOpenReadme },
          { label: 'Settings',  sub: 'Control Panel', action: onOpenMyComputer },
          { label: 'Find',      disabled: true },
          { label: 'Help',      action: () => onOpenReadme && onOpenReadme() },
          { label: 'Run…',      disabled: true },
          { sep: true },
          { label: 'Shut Down…', action: onShutdown, warn: true },
        ].map((item, i) => item.sep
          ? <div key={i} style={{ height: 1, background: '#808080', margin: '2px 4px', borderBottom: '1px solid #fff' }}/>
          : (
            <div key={i}
                 onMouseEnter={!item.disabled ? e => e.currentTarget.classList.add('w95-row-hover') : undefined}
                 onMouseLeave={!item.disabled ? e => e.currentTarget.classList.remove('w95-row-hover') : undefined}
                 onClick={() => { if (!item.disabled && item.action) { item.action(); onClose(); } }}
                 style={{
                   padding: '5px 12px 5px 8px', fontSize: 11, cursor: item.disabled ? 'default' : 'pointer',
                   color: item.disabled ? '#808080' : item.warn ? '#a8281c' : '#000',
                   display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                 }}>
              <span style={{ fontWeight: 600 }}>{item.label}</span>
              {item.sub && <span style={{ fontSize: 9, color: '#404040' }}>▶</span>}
            </div>
          )
        )}
      </div>
    </div>
  );
}

// ── Desktop Properties dialog ─────────────────────────────────────────────────

const PROP_TABS = ['Background', 'Screen Saver', 'Appearance', 'Settings'];

function DesktopPropertiesDialog({ zIndex, onFocus, onClose }) {
  const [tab, setTab] = useState('Background');
  const tabContent = {
    Background: (
      <div style={{ padding: 12, fontSize: 11, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ display: 'flex', gap: 12 }}>
          {/* fake monitor preview */}
          <div style={{ width: 120, height: 90, background: '#008080', border: '4px solid #808080',
                        position: 'relative', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: 60, height: 40, background: '#0c2a2c', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CSGGlyph size={24} color="#F5A524" strokeWidth={1.5}/>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div className="w95-group"><span className="legend">Wallpaper</span>
              {['(None)', 'CSG Diagnostic', 'Artifact Teal', 'Dark Matter'].map(w => (
                <div key={w} style={{ padding: '2px 4px', fontSize: 11, cursor: 'default',
                                      background: w === 'CSG Diagnostic' ? '#000080' : 'transparent',
                                      color: w === 'CSG Diagnostic' ? '#fff' : '#000' }}>{w}</div>
              ))}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <div className="w95-btn disabled">Browse…</div>
          <div className="w95-btn disabled">Pattern…</div>
        </div>
        <div style={{ fontSize: 10, color: '#a8281c', marginTop: 4 }}>
          ⚠ Wallpaper modification restricted by distribution envelope CSG-LIC-04.
        </div>
      </div>
    ),
    'Screen Saver': (
      <div style={{ padding: 12, fontSize: 11, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="w95-group"><span className="legend">Screen Saver</span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 4 }}>
            <div className="w95-inset" style={{ flex: 1, padding: '3px 6px', fontFamily: '"Courier New", monospace', fontSize: 11 }}>
              CSG Diagnostic (Always Active)
            </div>
            <div className="w95-btn disabled">Settings…</div>
            <div className="w95-btn disabled">Preview</div>
          </div>
        </div>
        <div className="w95-group"><span className="legend">Password</span>
          <label className="w95-check">
            <span className="w95-check-box checked"/>
            Password protected (cannot be disabled)
          </label>
        </div>
        <div style={{ fontSize: 10, color: '#a8281c', marginTop: 8 }}>
          ⚠ This machine is under continuous diagnostic observation. The screen saver is a
          monitoring process and cannot be terminated or modified.
        </div>
      </div>
    ),
    Appearance: (
      <div style={{ padding: 12, fontSize: 11, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div className="w95-group"><span className="legend">Scheme</span>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <div className="w95-inset" style={{ flex: 1, padding: '3px 6px', fontSize: 11 }}>
              CSG Standard (Locked)
            </div>
            <div className="w95-btn disabled">Save As…</div>
            <div className="w95-btn disabled">Delete</div>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 4 }}>
          {[
            ['Active Title Bar', '#000080'],
            ['Window Background', '#ffffff'],
            ['Button Face', '#c0c0c0'],
            ['Button Text', '#000000'],
            ['Desktop', '#008080'],
            ['Warning Text', '#a8281c'],
          ].map(([name, color]) => (
            <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10 }}>
              <div style={{ width: 16, height: 16, background: color, border: '1px solid #808080', flexShrink: 0 }}/>
              <span>{name}</span>
            </div>
          ))}
        </div>
        <div style={{ fontSize: 10, color: '#a8281c', marginTop: 4 }}>
          ⚠ Appearance cannot be modified. Scheme is enforced by publisher.
        </div>
      </div>
    ),
    Settings: (
      <div style={{ padding: 12, fontSize: 11, display: 'flex', flexDirection: 'column', gap: 6,
                    fontFamily: '"Courier New", monospace' }}>
        <div><b style={{ fontFamily: 'inherit' }}>DISPLAY ADAPTER</b> : CSG Diagnostic Video [VGA]</div>
        <div><b style={{ fontFamily: 'inherit' }}>SERIAL</b>          : ▲-04-A-0117-VGA</div>
        <div><b style={{ fontFamily: 'inherit' }}>RESOLUTION</b>      : 640 × 480 (locked)</div>
        <div><b style={{ fontFamily: 'inherit' }}>COLOR DEPTH</b>     : 256 colors (locked)</div>
        <div><b style={{ fontFamily: 'inherit' }}>REFRESH RATE</b>    : 60 Hz (non-adjustable)</div>
        <div><b style={{ fontFamily: 'inherit' }}>DRIVER</b>          : csg_vga.drv v1.0.0</div>
        <div style={{ marginTop: 6 }}>
          <b style={{ fontFamily: 'inherit' }}>MONITOR</b>           : Generic CRT (unidentified)
        </div>
        <div style={{ color: '#a8281c', marginTop: 6, fontSize: 10 }}>
          ⚠ Display settings are read-only. Hardware is diagnostic-grade and cannot be reconfigured
          without written authorisation from CSG (ref CSG-LIC-04 § 3.1).
        </div>
        <div style={{ marginTop: 8 }}>
          <div className="w95-btn disabled">Change Display Type…</div>
        </div>
      </div>
    ),
  };

  return (
    <W95Window id="desktop-props" title="Display Properties" iconKind="doc"
               width={360} style={{ left: '50%', top: '50%', transform: 'translate(-50%,-50%)' }}
               zIndex={zIndex} onFocus={onFocus} onClose={onClose}>
      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid #808080',
                    background: '#c0c0c0', paddingTop: 4, paddingLeft: 4, gap: 1 }}>
        {PROP_TABS.map(t => (
          <div key={t}
               onClick={() => setTab(t)}
               style={{
                 padding: '3px 10px', fontSize: 11, cursor: 'default', userSelect: 'none',
                 background: t === tab ? '#c0c0c0' : '#a0a0a0',
                 border: '1px solid #808080',
                 borderBottom: t === tab ? '1px solid #c0c0c0' : '1px solid #808080',
                 marginBottom: t === tab ? -1 : 0,
                 fontWeight: t === tab ? 700 : 400,
                 zIndex: t === tab ? 1 : 0, position: 'relative',
               }}>
            {t}
          </div>
        ))}
      </div>
      {/* Tab body */}
      <div style={{ background: '#c0c0c0', minHeight: 200 }}>
        {tabContent[tab]}
      </div>
      <div style={{ borderTop: '1px solid #808080', padding: '8px 10px',
                    display: 'flex', justifyContent: 'flex-end', gap: 6, background: '#c0c0c0' }}>
        <div className="w95-btn default" onClick={() => onClose('desktop-props')}>OK</div>
        <div className="w95-btn" onClick={() => onClose('desktop-props')}>Cancel</div>
        <div className="w95-btn disabled">Apply</div>
      </div>
    </W95Window>
  );
}

// ── Context menu ─────────────────────────────────────────────────────────────

function ContextMenu({ x, y, onClose, onOpenProperties }) {
  const items = [
    { label: 'Arrange Icons', action: onClose },
    { label: 'Line Up Icons', action: onClose },
    { sep: true },
    { label: 'New Folder', disabled: true },
    { sep: true },
    { label: 'Properties', action: onOpenProperties },
  ];
  return (
    <div style={{
      position: 'absolute', left: x, top: y, zIndex: 200,
      background: '#c0c0c0', border: '2px outset #ffffff',
      boxShadow: '3px 3px 0 rgba(0,0,0,0.5)', minWidth: 160,
    }} onClick={(e) => e.stopPropagation()}>
      {items.map((item, i) => item.sep
        ? <div key={i} style={{ height: 1, background: '#808080', margin: '2px 4px', borderBottom: '1px solid #fff' }}/>
        : (
          <div key={i}
               onMouseEnter={!item.disabled ? e => e.currentTarget.style.background = '#000080' : undefined}
               onMouseLeave={!item.disabled ? e => e.currentTarget.style.background = '' : undefined}
               onClick={() => { if (!item.disabled && item.action) { item.action(); } }}
               style={{ padding: '4px 14px', fontSize: 11, cursor: item.disabled ? 'default' : 'pointer',
                        color: item.disabled ? '#808080' : '#000' }}>
            {item.label}
          </div>
        )
      )}
    </div>
  );
}

// ── System tray popup ────────────────────────────────────────────────────────

function TrayPopup({ onClose }) {
  return (
    <div style={{
      position: 'absolute', bottom: 34, right: 4, zIndex: 200,
      background: '#ffffcc', border: '1px solid #000',
      padding: '6px 10px', fontSize: 11, lineHeight: 1.5,
      boxShadow: '2px 2px 0 rgba(0,0,0,0.3)',
      maxWidth: 220,
    }} onClick={onClose}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>Catalyst Systems Group</div>
      <div>Diagnostic process active.</div>
      <div style={{ color: '#a8281c', fontSize: 10, marginTop: 4 }}>BLOODRUN.exe sealed · envelope CSG-LIC-04</div>
      <div style={{ fontSize: 9, color: '#404040', marginTop: 4 }}>This process cannot be terminated.</div>
    </div>
  );
}

// ── Taskbar ──────────────────────────────────────────────────────────────────

function Taskbar({ time = '2:13 AM', tasks = [], onStartClick, onTrayClick }) {
  return (
    <div className="w95-taskbar">
      <div className="w95-start-btn" onClick={onStartClick}>
        <svg width="14" height="14" viewBox="0 0 14 14" shapeRendering="crispEdges">
          <rect x="0" y="0" width="6" height="6" fill="#E62028"/>
          <rect x="7" y="0" width="6" height="6" fill="#2BBF6E"/>
          <rect x="0" y="7" width="6" height="6" fill="#1084d0"/>
          <rect x="7" y="7" width="6" height="6" fill="#F5A524"/>
        </svg>
        Start
      </div>
      {tasks.map((t, i) => (
        <div key={i} className={`w95-task${t.active ? ' active' : ''}`}
             onClick={() => t.onFocus && t.onFocus()}>
          {t.icon} {t.label}
        </div>
      ))}
      <div className="w95-tray" style={{ cursor: 'pointer' }} onClick={onTrayClick}>
        <CSGGlyph size={14} color="#000" strokeWidth={2.5}/>
        <span>{time}</span>
      </div>
    </div>
  );
}

// ── Enhanced file manager ─────────────────────────────────────────────────────

function FileManagerWindow({ zIndex, minimized, maximized, onMinimize, onMaximize, onFocus, onClose, onLaunch, onNoticeOpen, onUninstallTriggered,
                             onOpenReadme, onOpenSave0, onOpenSave1, onOpenSave2,
                             onOpenUninstError, onOpenFileError }) {
  const [selectedRow, setSelectedRow] = useState(0);
  const rows = [
    { name: 'BLOODRUN.EXE',    size: '1,184 KB', date: '10/31/96', type: 'Application',    ico: <BloodrunIcon size={16}/>, action: 'launch' },
    { name: 'BLOODRUN.DAT',    size: '2,048 KB', date: '10/31/96', type: 'DAT File',        ico: <DocIcon size={16}/>, action: 'sealed', arg: 'BLOODRUN.DAT' },
    { name: 'CSG-LIC-04.TXT',  size: '   8 KB',  date: '11/02/91', type: 'Text Document',   ico: <DocIcon size={16}/>, action: 'lic' },
    { name: 'CSG-DSC-04A.TXT', size: '  12 KB',  date: '10/31/96', type: 'Text Document',   ico: <DocIcon size={16}/>, action: 'notice' },
    { name: 'README.WRI',      size: '   4 KB',  date: '10/31/96', type: 'Write Document',  ico: <DocIcon size={16}/>, action: 'readme' },
    { name: 'SAVE0.SAV',       size: '  64 KB',  date: '03/02/97', type: 'SAV File',         ico: <DocIcon size={16}/>, action: 'save0' },
    { name: 'SAVE1.SAV',       size: '  64 KB',  date: '03/04/97', type: 'SAV File',         ico: <DocIcon size={16}/>, action: 'save1' },
    { name: 'SAVE2.SAV',       size: '  64 KB',  date: '??/??/??', type: '[CORRUPT]',        ico: <HazardIcon size={16}/>, action: 'save2', warn: true },
    { name: 'UNINST.EXE',      size: ' 184 KB',  date: '10/31/96', type: 'Application',      ico: <DocIcon size={16} tone="#c0c0c0"/>, action: 'uninst' },
  ];

  const activate = (r) => {
    if (r.action === 'launch')  onLaunch && onLaunch();
    if (r.action === 'sealed')  onOpenFileError && onOpenFileError(r.arg);
    if (r.action === 'lic')     onOpenReadme && onOpenReadme('csg-lic'); // reuse readme window
    if (r.action === 'notice')  onNoticeOpen && onNoticeOpen();
    if (r.action === 'readme')  onOpenReadme && onOpenReadme('readme');
    if (r.action === 'save0')   onOpenSave0 && onOpenSave0();
    if (r.action === 'save1')   onOpenSave1 && onOpenSave1();
    if (r.action === 'save2')   onOpenSave2 && onOpenSave2();
    if (r.action === 'uninst')  onOpenUninstError && onOpenUninstError();
  };

  return (
    <W95Window id="file-manager" title="C:\PROGRAM FILES\CSG\DSC04A" iconKind="doc"
               width={380} style={{ left: 36, top: 70 }}
               zIndex={zIndex} minimized={minimized} maximized={maximized}
               onMinimize={onMinimize} onMaximize={onMaximize}
               onFocus={onFocus} onClose={onClose}>
      <div style={{ background: '#c0c0c0', padding: '2px 4px', borderBottom: '1px solid #808080', fontSize: 11 }}>
        <span style={{ marginRight: 10 }}><u>F</u>ile</span>
        <span style={{ marginRight: 10 }}><u>E</u>dit</span>
        <span style={{ marginRight: 10 }}><u>V</u>iew</span>
        <span style={{ marginRight: 10 }}><u>H</u>elp</span>
      </div>
      <div className="w95-inset" style={{ margin: 4, padding: 0, background: '#fff' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 80px 100px', fontSize: 11,
                      fontWeight: 700, background: '#c0c0c0', borderBottom: '1px solid #808080' }}>
          <div style={{ padding: '2px 6px' }}>Name</div>
          <div style={{ padding: '2px 6px' }}>Size</div>
          <div style={{ padding: '2px 6px' }}>Date</div>
          <div style={{ padding: '2px 6px' }}>Type</div>
        </div>
        {rows.map((r, i) => (
          <div key={i}
               onClick={(e) => { e.stopPropagation(); setSelectedRow(i); }}
               onDoubleClick={(e) => { e.stopPropagation(); setSelectedRow(i); activate(r); }}
               style={{
                 display: 'grid', gridTemplateColumns: '1fr 80px 80px 100px',
                 fontSize: 11, lineHeight: 1.4, cursor: 'default',
                 background: i === selectedRow ? '#000080' : 'transparent',
                 color: i === selectedRow ? '#fff' : r.warn ? '#a8281c' : '#000',
               }}>
            <div style={{ padding: '1px 6px', display: 'flex', alignItems: 'center', gap: 6 }}>{r.ico} {r.name}</div>
            <div style={{ padding: '1px 6px', textAlign: 'right', fontFamily: '"Courier New", monospace' }}>{r.size}</div>
            <div style={{ padding: '1px 6px' }}>{r.date}</div>
            <div style={{ padding: '1px 6px' }}>{r.type}</div>
          </div>
        ))}
      </div>
      <div className="w95-statusbar">
        <div className="field">9 object(s) — double-click to open</div>
        <div className="field" style={{ flex: 0, minWidth: 80 }}>3.65 MB</div>
      </div>
    </W95Window>
  );
}

// ── CSG notification window ──────────────────────────────────────────────────

function CSGNoticeWindow({ zIndex, minimized, maximized, onMinimize, onMaximize, onFocus, onClose, onLaunch, onDetails }) {
  return (
    <W95Window id="csg-notice" title="Catalyst Systems Group" iconKind="csg"
               width={340} style={{ right: 30, bottom: 60 }}
               zIndex={zIndex} minimized={minimized} maximized={maximized}
               onMinimize={onMinimize} onMaximize={onMaximize}
               onFocus={onFocus} onClose={onClose}>
      <div style={{ padding: 12, display: 'flex', gap: 10 }}>
        <div className="icon-warn"/>
        <div style={{ fontSize: 11, lineHeight: 1.5 }}>
          The artifact is awaiting launch.
          <div style={{ marginTop: 4, color: '#7a1014' }}>Double-click <b>BLOODRUN.EXE</b> to acknowledge.</div>
        </div>
      </div>
      <div style={{ padding: '0 10px 10px', display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
        <div className="w95-btn default" onClick={onLaunch}>Acknowledge</div>
        <div className="w95-btn" onClick={onDetails}>Details</div>
      </div>
    </W95Window>
  );
}

// ── BONUS content (DEMO) ─────────────────────────────────────────────────────
// Jukebox, the "Little Runner" reader, and a bonus imaging gallery. These are
// desktop-only extras; their <audio> is created on mount and torn down on
// unmount (i.e. when the player leaves the desktop for the game), so nothing
// keeps playing underneath the runtime audio.

function NoteIcon({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" shapeRendering="crispEdges">
      <rect x="0" y="0" width="16" height="16" fill="#c0c0c0" stroke="#000" strokeWidth="1"/>
      <path d="M6 3 L12 2 L12 10" fill="none" stroke="#000" strokeWidth="1.4"/>
      <circle cx="4.5" cy="11" r="2.2" fill="#C8161D" stroke="#000" strokeWidth="1"/>
      <circle cx="10.5" cy="11" r="2.2" fill="#C8161D" stroke="#000" strokeWidth="1"/>
    </svg>
  );
}
function PictureIcon({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" shapeRendering="crispEdges">
      <rect x="0.5" y="1.5" width="15" height="13" fill="#fff" stroke="#000" strokeWidth="1"/>
      <circle cx="5" cy="5" r="1.6" fill="#F5A524"/>
      <path d="M2 13 L6 8 L9 11 L11 9 L14 13 Z" fill="#3a6a3a"/>
    </svg>
  );
}
function BookIcon({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" shapeRendering="crispEdges">
      <rect x="1" y="2" width="14" height="12" fill="#7a1014" stroke="#000" strokeWidth="1"/>
      <rect x="3" y="4" width="10" height="8" fill="#e8e0d0"/>
      <path d="M8 4 L8 12" stroke="#7a1014" strokeWidth="1"/>
    </svg>
  );
}

const fmtTime = (s) => {
  if (!s || !isFinite(s)) return '0:00';
  const m = Math.floor(s / 60), ss = Math.floor(s % 60);
  return `${m}:${String(ss).padStart(2, '0')}`;
};

// Single <audio> deck with optional playlist. Returns transport state + controls.
function useAudioDeck(tracks, { withAnalyser = false } = {}) {
  const audioRef = useRef(null);
  const wantPlay = useRef(false);
  const ctxRef      = useRef(null); // Web Audio context (visualizer only)
  const analyserRef = useRef(null); // AnalyserNode (visualizer only)
  const [idx, setIdx]     = useState(0);
  const [playing, setPlaying] = useState(false);
  const [cur, setCur]     = useState(0);
  const [dur, setDur]     = useState(0);
  const [vol, setVolState] = useState(0.7);

  useEffect(() => {
    const a = new Audio();
    a.preload = 'metadata';
    a.volume = 0.7;
    audioRef.current = a;
    // Web Audio analyser graph: source → analyser → destination. Same-origin
    // (app://) audio, so the analyser is not CORS-tainted. Built once.
    if (withAnalyser) {
      try {
        const Ctx = window.AudioContext || window.webkitAudioContext;
        const ctx = new Ctx();
        const src = ctx.createMediaElementSource(a);
        const an  = ctx.createAnalyser();
        an.fftSize = 128;
        an.smoothingTimeConstant = 0.78;
        src.connect(an); an.connect(ctx.destination);
        ctxRef.current = ctx; analyserRef.current = an;
      } catch { /* visualizer optional — playback still works */ }
    }
    const onTime = () => setCur(a.currentTime || 0);
    const onMeta = () => setDur(a.duration || 0);
    const onEnd  = () => {
      if (tracks.length > 1) { wantPlay.current = true; setIdx(i => (i + 1) % tracks.length); }
      else { setPlaying(false); wantPlay.current = false; setCur(0); }
    };
    a.addEventListener('timeupdate', onTime);
    a.addEventListener('loadedmetadata', onMeta);
    a.addEventListener('ended', onEnd);
    return () => {
      a.pause();
      a.removeEventListener('timeupdate', onTime);
      a.removeEventListener('loadedmetadata', onMeta);
      a.removeEventListener('ended', onEnd);
      if (ctxRef.current) { try { ctxRef.current.close(); } catch {} ctxRef.current = null; analyserRef.current = null; }
      audioRef.current = null;
    };
  }, []); // eslint-disable-line

  useEffect(() => {
    const a = audioRef.current; if (!a) return;
    a.src = tracks[idx].file;
    a.load();
    setCur(0); setDur(0);
    if (wantPlay.current) a.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
  }, [idx]); // eslint-disable-line

  const resumeCtx = () => { const c = ctxRef.current; if (c && c.state === 'suspended') c.resume().catch(() => {}); };
  const toggle = () => {
    const a = audioRef.current; if (!a) return;
    resumeCtx();
    if (playing) { a.pause(); setPlaying(false); wantPlay.current = false; }
    else { wantPlay.current = true; a.play().then(() => setPlaying(true)).catch(() => setPlaying(false)); }
  };
  const select = (i) => { resumeCtx(); wantPlay.current = true; setPlaying(true); setIdx(i); };
  const next = () => { wantPlay.current = playing || wantPlay.current; setIdx(i => (i + 1) % tracks.length); };
  const prev = () => { wantPlay.current = playing || wantPlay.current; setIdx(i => (i - 1 + tracks.length) % tracks.length); };
  const seek = (ratio) => { const a = audioRef.current; if (a && dur) { a.currentTime = ratio * dur; setCur(ratio * dur); } };
  const setVol = (v) => { const a = audioRef.current; if (a) a.volume = v; setVolState(v); };

  return { idx, playing, cur, dur, vol, toggle, select, next, prev, seek, setVol, analyserRef };
}

// Classic spectrum visualizer: green bars with falling red peak caps, on black.
function SpectrumViz({ analyserRef, playing }) {
  const canvasRef = useRef(null);
  const peaksRef  = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    const an = analyserRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width, H = canvas.height;
    const BARS = 24;
    const data = an ? new Uint8Array(an.frequencyBinCount) : null;
    if (!peaksRef.current) peaksRef.current = new Array(BARS).fill(0);
    const peaks = peaksRef.current;
    let raf;
    const draw = () => {
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
      const gap = 2, bw = (W - gap * (BARS - 1)) / BARS;
      if (an && playing) an.getByteFrequencyData(data);
      // bar gradient: green → amber → red by height (same for every bar)
      const grad = ctx.createLinearGradient(0, H, 0, 0);
      grad.addColorStop(0, '#1e7a1e'); grad.addColorStop(0.6, '#6BCC4D');
      grad.addColorStop(0.85, '#F5A524'); grad.addColorStop(1, '#E62028');
      for (let i = 0; i < BARS; i++) {
        let mag = 0;
        if (an && playing) {
          // log-ish spread across the spectrum, skipping the very lowest bin
          const bin = Math.min(data.length - 1, 1 + Math.floor((i / BARS) * (data.length * 0.7)));
          mag = data[bin] / 255;
        }
        const bh = Math.max(playing ? 1 : 0, mag * H);
        const x = i * (bw + gap);
        ctx.fillStyle = grad;
        ctx.fillRect(x, H - bh, bw, bh);
        // falling peak cap
        peaks[i] = Math.max(bh, peaks[i] - H * 0.012);
        ctx.fillStyle = '#E62028';
        ctx.fillRect(x, H - Math.min(H, peaks[i]) - 2, bw, 2);
      }
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [analyserRef, playing]);

  return (
    <canvas ref={canvasRef} width={312} height={46}
            className="w95-inset"
            style={{ display: 'block', width: '100%', height: 46, background: '#000', marginBottom: 6 }}/>
  );
}

function TransportBar({ cur, dur, onSeek }) {
  const pct = dur ? (cur / dur) * 100 : 0;
  return (
    <div className="w95-inset"
         style={{ height: 14, background: '#000', cursor: 'pointer', position: 'relative', margin: '0 0 4px' }}
         onClick={(e) => {
           const r = e.currentTarget.getBoundingClientRect();
           onSeek(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)));
         }}>
      <div style={{ position: 'absolute', inset: 0, width: `${pct}%`, background: '#6BCC4D' }}/>
    </div>
  );
}

const JUKEBOX_TRACKS = [
  { title: 'BLOODRUN — Main Theme',  file: 'audio/jukebox/Bloodrun-main.mp3' },
  { title: 'Bloodlines',            file: 'audio/jukebox/Bloodlines.mp3' },
  { title: 'Machine Confession',    file: 'audio/jukebox/Machine_Confession.mp3' },
  { title: 'Stain On The Wall',     file: 'audio/jukebox/Stain_On_The_Wall.mp3' },
  { title: 'BLOODRUN.EXE · V.1',    file: 'audio/jukebox/BLOODRUN-EXE-V-1.mp3' },
  { title: 'BLOODRUN.EXE · V.2',    file: 'audio/jukebox/BLOODRUN-EXE-V-2.mp3' },
];

function JukeboxWindow({ zIndex, minimized, maximized, onMinimize, onMaximize, onFocus, onClose }) {
  const d = useAudioDeck(JUKEBOX_TRACKS, { withAnalyser: true });
  return (
    <W95Window id="jukebox" title="CSG JUKEBOX — Media Player" iconKind="doc"
               width={340} style={{ left: 120, top: 70 }}
               zIndex={zIndex} minimized={minimized} maximized={maximized}
               onMinimize={onMinimize} onMaximize={onMaximize} onFocus={onFocus} onClose={onClose}>
      <div style={{ padding: 6 }}>
        {/* LCD now-playing */}
        <div className="w95-inset" style={{ background: '#000', padding: '6px 8px', marginBottom: 6,
                      fontFamily: '"Courier New", monospace', color: '#6BCC4D', fontSize: 11, letterSpacing: '0.04em' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: '#F5A524' }}>{d.playing ? '▶ NOW PLAYING' : '❚❚ PAUSED'}</span>
            <span style={{ color: '#3a6a3a', fontSize: 9 }}>CSG·STEREO·▪▪▪</span>
          </div>
          <div style={{ marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {String(d.idx + 1).padStart(2, '0')}. {JUKEBOX_TRACKS[d.idx].title}
          </div>
          <div style={{ color: '#807A75', fontSize: 10, marginTop: 2 }}>{fmtTime(d.cur)} / {fmtTime(d.dur)}</div>
        </div>
        {/* Spectrum visualizer */}
        <SpectrumViz analyserRef={d.analyserRef} playing={d.playing}/>
        <TransportBar cur={d.cur} dur={d.dur} onSeek={d.seek}/>
        {/* Transport buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}>
          <div className="w95-btn" onClick={d.prev} style={{ minWidth: 30, textAlign: 'center' }}>⏮</div>
          <div className="w95-btn default" onClick={d.toggle} style={{ minWidth: 40, textAlign: 'center' }}>{d.playing ? '❚❚' : '▶'}</div>
          <div className="w95-btn" onClick={d.next} style={{ minWidth: 30, textAlign: 'center' }}>⏭</div>
          <span style={{ fontSize: 10, marginLeft: 6 }}>VOL</span>
          <input type="range" min="0" max="100" value={Math.round(d.vol * 100)}
                 onChange={(e) => d.setVol(Number(e.target.value) / 100)}
                 style={{ flex: 1 }}/>
        </div>
        {/* Playlist */}
        <div className="w95-inset" style={{ background: '#fff', maxHeight: 132, overflowY: 'auto' }}>
          {JUKEBOX_TRACKS.map((t, i) => (
            <div key={i} onClick={() => d.select(i)}
                 style={{ padding: '3px 6px', fontSize: 11, cursor: 'default',
                          background: i === d.idx ? '#000080' : 'transparent',
                          color: i === d.idx ? '#fff' : '#000', display: 'flex', justifyContent: 'space-between' }}>
              <span>{String(i + 1).padStart(2, '0')}. {t.title}</span>
              {i === d.idx && d.playing && <span>♪</span>}
            </div>
          ))}
        </div>
      </div>
      <div className="w95-statusbar"><div className="field">{JUKEBOX_TRACKS.length} track(s) · CSG-DSC-04A</div></div>
    </W95Window>
  );
}

const LITTLE_RUNNER_TRACK = [{ title: 'The Little Runner — Audio Reading', file: 'assets/little_runner/The_Little_Runner_Audio_Reading.mp3' }];
const LITTLE_RUNNER_TEXT = `The first rule was simple.

Carry the signal.

The second rule was simpler.

Do not open it.

No one knew who wrote those instructions. They appeared inside the cabinet before the cabinet had a name, before the red paint dried around its coin slot, before anyone thought to ask why a training machine needed a lock on the inside.

The cabinet stood in an auxiliary room beneath the Cathedral, where unused terminals were stored after their screens began to bloom with red light. Someone had covered it with canvas. Someone else had written DO NOT POWER on a strip of masking tape and pressed it across the control panel.

The tape failed first. It curled at the edges from the heat. Then the screen woke.

Not brightly. Not all at once. A thin red line appeared across the glass, trembling as if it had been pulled from somewhere deeper than the machine itself. The speakers clicked. Dust shifted behind the bezel. For several minutes, nothing moved.

Then the title appeared.

RUNNER FORM LOADED.

Below it stood a small figure in a red hood. The figure had no face. Where a face should have been, there was only shadow, sealed inside the little oval of the hood. Its body was simple, almost crude: a robe, two hands, two feet, a small dark satchel hanging at its side.

It looked harmless. That was why the room allowed it to remain.

The cabinet produced a second line.

FRAGMENT READY.

The little figure did not move until the fragment appeared. It was a square of light, red at the edges, white at the center, pulsing slowly against the black floor of the game world. The figure crossed the screen, picked it up, and placed it in the satchel.

The speakers made a sound like a breath being held. Then the floor opened.

The first route was narrow. Black ground. Red sky. Thin white stars that might have been scratches in the glass. The Runner moved because the route demanded movement. It jumped when the path broke. It ducked when shapes passed overhead. It waited when the red lights ahead began to pulse too quickly.

It did not ask where the fragment came from. It did not ask where the fragment needed to go. It carried.

At the end of the route stood a door drawn in three colors: black, red, and a yellow so dim it almost looked sick. The Runner stopped before it. The satchel opened by itself. The fragment rose. The door accepted it. The screen cleared.

FRAGMENT DELIVERED.

RUNNER FORM STABLE.

NO MEMORY RETAINED.

For a while, this was enough. The cabinet ran the route again. Then again. Then again. Each time, the Runner woke beneath the same title. Each time, the fragment waited. Each time, the route broke in the same places, opened in the same places, and closed behind the Runner as though nothing had passed through it at all.

The machine was satisfied. The room was not.

Something about the fourth run changed. The Runner paused before the first gap. It had never paused there before.

The jump was easy. The route expected it. The cabinet expected it. The fragment in the satchel pulsed once, then again, impatient without being alive.

The Runner stood still. Behind it, something small moved in the red sky. A moth shape. Or a tear in the screen. Or a piece of dust caught between the glass and the light.

The Runner jumped. The cabinet continued.

On the seventh run, the Runner stopped before a place where the floor had not yet broken. Three seconds later, the floor broke. The cabinet recorded the delay as acceptable variance.

On the twelfth run, the Runner ducked before the overhead shape appeared. The cabinet recorded the motion as predictive alignment.

On the nineteenth run, the Runner turned around. The cabinet did not record that. There was no instruction for turning back.

The route continued forward. The fragment continued pulsing. The door waited at the end, patient in the way machines are patient when they have nowhere else to go.

The Runner walked left until the screen would not scroll farther. At the edge of the world, where there should have been nothing, the red sky flickered. A line appeared in the dark.

NOT EXIT.

The Runner raised one hand. The line changed.

NOT ROUTE.

The Runner remained. For the first time, the cabinet made a sound that was not music, not static, and not breath. It sounded like something remembering it had a mouth.

The screen went black. When it returned, the route was different. The sky had yellow in it now. Not light. Field color. The kind of yellow that did not shine but watched. The ground had softened at the edges. The enemies no longer moved like obstacles. They moved like fragments that had failed to become anything else.

The Runner carried the signal through them. It was very small. That mattered.

Large things could not pass through the route without changing it. Operators brought names, histories, voices, expectations. They asked questions. They wanted answers. They mistook attention for permission.

The Runner had no name. The hood kept it that way. Nothing could call to it correctly. Nothing could claim its face. Nothing could say, You were here before, because the system had never verified who had been there.

Only the route remembered. Only the Runner began to.

At the final door, the satchel opened. The fragment rose. The door waited. The cabinet prepared to clear the form.

The Runner reached up and closed the satchel. The fragment remained inside.

For several seconds, the entire machine held still. Then the screen filled with red text.

DELIVERY ERROR.

The Runner did not move.

FRAGMENT REQUIRED.

The Runner did not move.

ROUTE CANNOT CLOSE.

The Runner did not move.

Beyond the door, something echoed. Not a voice. Not an answer. A return from far away, shaped by distance.

The cabinet tried again.

CARRY THE SIGNAL.

The Runner turned from the door. This was not victory. Nothing opened. Nothing was freed. The Cathedral did not heal. The cabinet did not break. The route did not end. Somewhere below the visible world, the old systems continued their work: holding, returning, watching, refusing to collapse.

But one fragment was not delivered. One small red figure carried it away from the door and into the yellow distance.

The cabinet remained active long enough to print one final line.

RUNNER FORM LOST.

Then another appeared beneath it.

HOOD SEAL INTACT.

Then, after a long pause:

NO SCORE RECORDED.`;

function LittleRunnerWindow({ zIndex, minimized, maximized, onMinimize, onMaximize, onFocus, onClose }) {
  const d = useAudioDeck(LITTLE_RUNNER_TRACK);
  const paras = LITTLE_RUNNER_TEXT.split('\n\n');
  return (
    <W95Window id="little-runner" title="The Little Runner — Reader" iconKind="doc"
               width={460} style={{ left: 90, top: 40 }}
               zIndex={zIndex} minimized={minimized} maximized={maximized}
               onMinimize={onMinimize} onMaximize={onMaximize} onFocus={onFocus} onClose={onClose}>
      {/* Title block */}
      <div style={{ background: '#000', color: '#C8161D', padding: '8px 10px', textAlign: 'center',
                    fontFamily: '"Courier New", monospace', borderBottom: '1px solid #808080' }}>
        <div style={{ fontSize: 15, letterSpacing: '0.18em' }}>THE LITTLE RUNNER</div>
        <div style={{ fontSize: 9, color: '#807A75', marginTop: 3, letterSpacing: '0.2em' }}>CSG-DSC-04A · BONUS REMNANT</div>
      </div>
      {/* Audio reading transport */}
      <div style={{ padding: 6, borderBottom: '1px solid #808080', background: '#c0c0c0' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <div className="w95-btn default" onClick={d.toggle} style={{ minWidth: 64, textAlign: 'center' }}>
            {d.playing ? '❚❚ PAUSE' : '▶ READING'}
          </div>
          <span style={{ fontSize: 10, color: '#404040' }}>{fmtTime(d.cur)} / {fmtTime(d.dur)}</span>
        </div>
        <TransportBar cur={d.cur} dur={d.dur} onSeek={d.seek}/>
      </div>
      {/* Story */}
      <div className="w95-inset" style={{ margin: 4, padding: '10px 14px', background: '#e8e0d0',
                    height: 280, overflowY: 'auto' }}>
        {paras.map((p, i) => {
          const cabinet = /^[A-Z0-9 .,]+$/.test(p) && p.length < 40; // the cabinet's terminal voice
          return (
            <p key={i} style={cabinet
              ? { fontFamily: '"Courier New", monospace', color: '#a8281c', fontSize: 11, letterSpacing: '0.1em', margin: '10px 0', textAlign: 'center' }
              : { fontFamily: 'Georgia, serif', color: '#1a1612', fontSize: 12, lineHeight: 1.65, margin: '8px 0' }}>
              {p}
            </p>
          );
        })}
      </div>
      <div className="w95-statusbar"><div className="field">A short story · read or listen</div></div>
    </W95Window>
  );
}

const BONUS_IMAGES = [
  { src: 'assets/bonus/mock-ad.png',             label: 'AD_INSERT_A.PNG',  caption: 'Distribution insert — recovered' },
  { src: 'assets/bonus/mock-ad-2.png',           label: 'AD_INSERT_B.PNG',  caption: 'Distribution insert — recovered' },
  { src: 'assets/bonus/BR-000.png',              label: 'BR-000.PNG',       caption: 'Cabinet plate ▲-04-A-0117' },
  { src: 'assets/bonus/original-sprite-sheet.png',  label: 'REAPER_FORM.SPR',  caption: 'Runner form — source sheet' },
  { src: 'assets/bonus/sprite-movement-sheet.png',  label: 'REAPER_WALK.SPR',  caption: 'Runner form — movement cuts' },
];

function GalleryWindow({ zIndex, minimized, maximized, onMinimize, onMaximize, onFocus, onClose }) {
  const [sel, setSel] = useState(0);
  const img = BONUS_IMAGES[sel];
  return (
    <W95Window id="gallery" title="BONUS — Imaging" iconKind="doc"
               width={500} style={{ left: 110, top: 40 }}
               zIndex={zIndex} minimized={minimized} maximized={maximized}
               onMinimize={onMinimize} onMaximize={onMaximize} onFocus={onFocus} onClose={onClose}>
      <div style={{ padding: 6 }}>
        {/* Main preview */}
        <div className="w95-inset" style={{ background: '#404040', height: 300, display: 'flex',
                      alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          <img src={img.src} alt={img.label}
               style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', imageRendering: 'pixelated' }}/>
        </div>
        <div style={{ fontSize: 11, padding: '4px 2px', color: '#000' }}>
          <b>{img.label}</b> — <span style={{ color: '#404040' }}>{img.caption}</span>
        </div>
        {/* Thumbnail rail */}
        <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 2 }}>
          {BONUS_IMAGES.map((b, i) => (
            <div key={i} onClick={() => setSel(i)}
                 className="w95-inset"
                 style={{ flex: '0 0 64px', height: 48, background: '#000', cursor: 'pointer',
                          outline: i === sel ? '2px solid #000080' : 'none' }}>
              <img src={b.src} alt={b.label}
                   style={{ width: '100%', height: '100%', objectFit: 'cover', imageRendering: 'pixelated', opacity: i === sel ? 1 : 0.7 }}/>
            </div>
          ))}
        </div>
      </div>
      <div className="w95-statusbar"><div className="field">{sel + 1} / {BONUS_IMAGES.length}</div></div>
    </W95Window>
  );
}

// ── DesktopLaunch — main export ──────────────────────────────────────────────

function DesktopLaunch({ onLaunch, onNoticeOpen, onUninstallTriggered, onShutdown,
                         hint = true, autoLaunch = false, onAutoLaunchConsumed, skipStartup = false }) {
  // Window stack
  const [openWins, setOpenWins] = useState(new Set(['file-manager', 'csg-notice']));
  const zTop = useRef(10);
  const [zMap, setZMap] = useState({ 'file-manager': 5, 'csg-notice': 6 });
  const [fileErrors, setFileErrors] = useState({}); // id → filename for access-denied dialogs
  const [minimizedWins, setMinimizedWins] = useState(new Set());
  const [maximizedWins, setMaximizedWins] = useState(new Set());

  const focusWin = useCallback((id) => {
    zTop.current++;
    setZMap(m => ({ ...m, [id]: zTop.current }));
  }, []);
  const openWin = useCallback((id) => {
    zTop.current++;
    setOpenWins(s => new Set([...s, id]));
    setZMap(m => ({ ...m, [id]: zTop.current }));
    setMinimizedWins(s => { const n = new Set(s); n.delete(id); return n; }); // un-minimize on re-open
  }, []);
  const closeWin = useCallback((id) => {
    setOpenWins(s => { const n = new Set(s); n.delete(id); return n; });
    setFileErrors(fe => { const n = { ...fe }; delete n[id]; return n; });
    setMinimizedWins(s => { const n = new Set(s); n.delete(id); return n; });
    setMaximizedWins(s => { const n = new Set(s); n.delete(id); return n; });
  }, []);
  const minimizeWin = useCallback((id) => {
    setMinimizedWins(s => new Set([...s, id]));
    setMaximizedWins(s => { const n = new Set(s); n.delete(id); return n; });
  }, []);
  const maximizeWin = useCallback((id) => {
    setMaximizedWins(s => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
    setMinimizedWins(s => { const n = new Set(s); n.delete(id); return n; });
    focusWin(id);
  }, [focusWin]);
  const restoreWin = useCallback((id) => {
    setMinimizedWins(s => { const n = new Set(s); n.delete(id); return n; });
    focusWin(id);
  }, [focusWin]);

  // Shorthand: pass win-state props to W95Window children
  const winProps = (id) => ({
    minimized: minimizedWins.has(id),
    maximized: maximizedWins.has(id),
    onMinimize: minimizeWin,
    onMaximize: maximizeWin,
  });

  const openFileError = useCallback((filename) => {
    const id = `file-err-${Date.now()}`;
    zTop.current++;
    setFileErrors(fe => ({ ...fe, [id]: filename }));
    setOpenWins(s => new Set([...s, id]));
    setZMap(m => ({ ...m, [id]: zTop.current }));
  }, []);

  // UI state
  const [startOpen, setStartOpen] = useState(false);
  const [contextMenu, setContextMenu] = useState(null); // { x, y }
  const [trayOpen, setTrayOpen] = useState(false);
  const [bootSeq, setBootSeq] = useState(false);
  const [selectedIcon, setSelectedIcon] = useState('bloodrun');

  // Stable ref used by the startup timer so autoLaunch can call doLaunch
  // without a stale-closure problem (doLaunch is defined below this effect).
  const doLaunchRef = useRef(null);

  // ── Multi-phase startup sequence ───────────────────────────────────────
  // bios (0-2600ms) → splash (2600-3800ms) → fading (3800-4600ms) → gone
  const BIOS_LINES = [
    { t: 0,    text: 'CSG/AWARD BIOS v4.51PG',                            col: 'grey'  },
    { t: 110,  text: 'Copyright (C) 1984-1996  Award Software / CSG',     col: 'grey'  },
    { t: 220,  text: '',                                                    col: 'grey'  },
    { t: 360,  text: 'CPU: Intel 486DX2-66 MHz          [OK]',             col: 'grey'  },
    { t: 510,  text: 'Memory Test: 65536 KB OK',                           col: 'grey'  },
    { t: 660,  text: 'HDD 0: C:\\BLOODRUN [1,184 KB]  SEALED',            col: 'grey'  },
    { t: 810,  text: '',                                                    col: 'grey'  },
    { t: 930,  text: 'CSG Diagnostic Runtime Loader v1.0',                 col: 'amber' },
    { t: 1080, text: '  Checking artifact seal ▲-04-A-0117…',             col: 'grey'  },
    { t: 1400, text: '  Seal status: VALID',                               col: 'green' },
    { t: 1580, text: '  Mounting BLOODRUN.EXE…',                          col: 'grey'  },
    { t: 1820, text: '  Artifact checksum: CSG-DSC-04A [OK]',             col: 'green' },
    { t: 1980, text: '  Envelope: CSG-LIC-04 § 3.1 — NON-REMOVABLE',     col: 'red'   },
    { t: 2150, text: '',                                                    col: 'grey'  },
    { t: 2260, text: 'Starting RUNTIME 95…',                               col: 'grey'  },
  ];
  const BIOS_COL = { grey: '#b0b0b0', amber: '#F5A524', green: '#6BCC4D', red: '#E62028' };

  // ?e2e=1 skips the 5-second BIOS/splash animation so Playwright tests run quickly
  const isE2E = (() => { try { return new URLSearchParams(location.search).get('e2e') === '1'; } catch { return false; } })();
  const [startupPhase, setStartupPhase] = useState(isE2E || skipStartup ? 'gone' : 'bios');
  const [biosVisible, setBiosVisible]   = useState(0);
  const [splashPct,   setSplashPct]     = useState(0);

  useEffect(() => {
    if (skipStartup) return; // returning from the cabinet — no BIOS replay
    // BIOS lines appear per their timestamps
    const timers = BIOS_LINES.map((_, i) =>
      setTimeout(() => setBiosVisible(n => Math.max(n, i + 1)), BIOS_LINES[i].t)
    );
    // Phase transitions
    const p1 = setTimeout(() => setStartupPhase('splash'), 2700);
    const p2 = setTimeout(() => setStartupPhase('fading'), 3800);
    const p3 = setTimeout(() => setStartupPhase('gone'),   4700);
    // If "Run BLOODRUN.exe now" was checked in the installer, fire launch
    // automatically after the startup animation clears + a beat to settle.
    // Uses doLaunchRef so we always call the live function, not a stale closure.
    const p4 = autoLaunch
      ? setTimeout(() => { onAutoLaunchConsumed?.(); doLaunchRef.current?.(); }, 5800)
      : null;
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(p1); clearTimeout(p2); clearTimeout(p3);
      if (p4) clearTimeout(p4);
    };
    // eslint-disable-next-line
  }, []);

  // Splash progress bar animation
  useEffect(() => {
    if (startupPhase !== 'splash') return;
    const start = performance.now();
    let raf;
    const tick = (t) => {
      setSplashPct(Math.min(100, ((t - start) / 1000) * 100));
      if (t - start < 1000) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [startupPhase]);

  // Animated hint cursor
  const [cursorPos, setCursorPos] = useState({ x: -200, y: -200, visible: hint });
  useEffect(() => {
    if (!hint) return;
    const start = performance.now();
    let raf;
    const loop = (t) => {
      const e = t - start;
      if (e > 6500) { setCursorPos(p => ({ ...p, visible: false })); return; }
      const k = Math.min(1, e / 1800);
      setCursorPos({
        x: 60 + (100 - 60) * k + Math.sin(e / 300) * 6,
        y: 280 + (134 - 280) * k + Math.cos(e / 280) * 4,
        visible: true,
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [hint]);

  const doLaunch = () => {
    if (bootSeq) return;
    setBootSeq(true);
    setTimeout(() => onLaunch(), 720);
  };
  doLaunchRef.current = doLaunch; // keep ref in sync every render

  const dismissAll = () => {
    setStartOpen(false);
    setContextMenu(null);
    setTrayOpen(false);
  };

  // Taskbar tasks — click restores if minimised, re-minimises if active
  const makeTask = (id, label, icon) => openWins.has(id) && {
    label, icon,
    active: !minimizedWins.has(id),
    onFocus: () => minimizedWins.has(id) ? restoreWin(id) : minimizeWin(id),
  };
  const taskbarTasks = [
    makeTask('file-manager', 'C:\\PROGRAM FILES…', <DocIcon size={14}/>),
    makeTask('csg-notice',   'Catalyst Systems Group', <DocIcon size={14}/>),
    makeTask('readme',       'README.WRI', <DocIcon size={14}/>),
    makeTask('csg-lic',      'CSG-LIC-04.TXT', <DocIcon size={14}/>),
    makeTask('my-computer',  'My Computer', <DocIcon size={14}/>),
    makeTask('recycle-bin',  'Recycle Bin', <DocIcon size={14}/>),
    makeTask('save0',         'SAVE0.SAV', <DocIcon size={14}/>),
    makeTask('save1',         'SAVE1.SAV', <DocIcon size={14}/>),
    makeTask('jukebox',       'CSG Jukebox', <NoteIcon size={14}/>),
    makeTask('little-runner', 'The Little Runner', <BookIcon size={14}/>),
    makeTask('gallery',       'Imaging', <PictureIcon size={14}/>),
    makeTask('desktop-props', 'Display Properties', <DocIcon size={14}/>),
  ].filter(Boolean);

  return (
    <div className="w95"
         style={{ position: 'absolute', inset: 0, overflow: 'hidden', background: '#021214', zIndex: 70 }}
         onClick={dismissAll}
         onContextMenu={(e) => { e.preventDefault(); setContextMenu({ x: e.clientX, y: e.clientY }); setStartOpen(false); }}>
      <DesktopBg/>

      {/* Desktop icons — right column */}
      <div style={{ position: 'absolute', top: 12, right: 12,
                    display: 'flex', flexDirection: 'column', gap: 4, alignItems: 'flex-end' }}>
        <DesktopIcon icon={<DocIcon size={32} tone="#ffffaa"/>} label="My Computer"
                     selected={selectedIcon === 'mycomputer'} onSingleClick={() => setSelectedIcon('mycomputer')}
                     onActivate={() => { openWin('my-computer'); setSelectedIcon('mycomputer'); }}/>
        <DesktopIcon icon={<FolderIcon size={32}/>} label="Network Neighborhood"
                     selected={selectedIcon === 'network'} onSingleClick={() => setSelectedIcon('network')}
                     onActivate={() => { openWin('net-error'); setSelectedIcon('network'); }}/>
        <DesktopIcon icon={<FolderIcon size={32}/>} label="Recycle Bin"
                     selected={selectedIcon === 'recycle'} onSingleClick={() => setSelectedIcon('recycle')}
                     onActivate={() => { openWin('recycle-bin'); setSelectedIcon('recycle'); }}/>
        <DesktopIcon
          icon={<img src="assets/blood-sigil.png" width={32} height={32}
                     style={{ objectFit: 'contain', imageRendering: 'pixelated' }}
                     alt="BLOODRUN.exe"/>}
          label="BLOODRUN.exe"
          selected={selectedIcon === 'bloodrun'} onSingleClick={() => setSelectedIcon('bloodrun')}
          onActivate={doLaunch}/>
        <DesktopIcon icon={<DocIcon size={32}/>} label="CSG-DSC-04A.TXT"
                     selected={selectedIcon === 'notice'} onSingleClick={() => setSelectedIcon('notice')}
                     onActivate={() => { onNoticeOpen && onNoticeOpen(); setSelectedIcon('notice'); }}/>
        <DesktopIcon icon={<HazardIcon size={32}/>} label="SAVE2.SAV"
                     selected={selectedIcon === 'save2'} onSingleClick={() => setSelectedIcon('save2')}
                     onActivate={() => { openWin('save2'); setSelectedIcon('save2'); }}/>
        {/* ── BONUS extras ── */}
        <DesktopIcon icon={<NoteIcon size={32}/>} label="JUKEBOX.EXE"
                     selected={selectedIcon === 'jukebox'} onSingleClick={() => setSelectedIcon('jukebox')}
                     onActivate={() => { openWin('jukebox'); setSelectedIcon('jukebox'); }}/>
        <DesktopIcon icon={<BookIcon size={32}/>} label="LITTLE_RUNNER.TXT"
                     selected={selectedIcon === 'little-runner'} onSingleClick={() => setSelectedIcon('little-runner')}
                     onActivate={() => { openWin('little-runner'); setSelectedIcon('little-runner'); }}/>
        <DesktopIcon icon={<PictureIcon size={32}/>} label="BONUS"
                     selected={selectedIcon === 'gallery'} onSingleClick={() => setSelectedIcon('gallery')}
                     onActivate={() => { openWin('gallery'); setSelectedIcon('gallery'); }}/>
      </div>

      {/* Windows */}
      {openWins.has('file-manager') && (
        <FileManagerWindow
          zIndex={zMap['file-manager'] || 5}
          {...winProps('file-manager')}
          onFocus={focusWin} onClose={closeWin}
          onLaunch={doLaunch}
          onNoticeOpen={onNoticeOpen}
          onUninstallTriggered={onUninstallTriggered}
          onOpenReadme={(id) => openWin(id === 'csg-lic' ? 'csg-lic' : 'readme')}
          onOpenSave0={() => openWin('save0')}
          onOpenSave1={() => openWin('save1')}
          onOpenSave2={() => openWin('save2')}
          onOpenUninstError={() => openWin('uninst-error')}
          onOpenFileError={openFileError}
        />
      )}
      {openWins.has('csg-notice') && (
        <CSGNoticeWindow
          zIndex={zMap['csg-notice'] || 6}
          {...winProps('csg-notice')}
          onFocus={focusWin} onClose={closeWin}
          onLaunch={doLaunch}
          onDetails={() => openWin('file-manager')}
        />
      )}
      {openWins.has('readme') && (
        <ReadmeWindow zIndex={zMap['readme']} {...winProps('readme')} onFocus={focusWin} onClose={closeWin}/>
      )}
      {openWins.has('csg-lic') && (
        <LicenseTextWindow zIndex={zMap['csg-lic']} {...winProps('csg-lic')} onFocus={focusWin} onClose={closeWin}/>
      )}
      {openWins.has('my-computer') && (
        <MyComputerWindow zIndex={zMap['my-computer']} {...winProps('my-computer')} onFocus={focusWin} onClose={closeWin}/>
      )}
      {openWins.has('recycle-bin') && (
        <RecycleBinWindow zIndex={zMap['recycle-bin']} {...winProps('recycle-bin')} onFocus={focusWin} onClose={closeWin}
                          onCorruptOpen={() => openWin('save2')}/>
      )}
      {openWins.has('net-error') && (
        <NetworkError zIndex={zMap['net-error']} {...winProps('net-error')} onFocus={focusWin} onClose={closeWin}/>
      )}
      {openWins.has('uninst-error') && (
        <UninstError zIndex={zMap['uninst-error']} {...winProps('uninst-error')} onFocus={focusWin} onClose={closeWin}/>
      )}
      {openWins.has('save0') && (
        <SaveViewerWindow id="save0" saveNum={0} zIndex={zMap['save0']} {...winProps('save0')} onFocus={focusWin} onClose={closeWin}/>
      )}
      {openWins.has('save1') && (
        <SaveViewerWindow id="save1" saveNum={1} zIndex={zMap['save1']} {...winProps('save1')} onFocus={focusWin} onClose={closeWin}/>
      )}
      {openWins.has('save2') && (
        <SaveViewerWindow id="save2" saveNum={2} corrupt zIndex={zMap['save2']} {...winProps('save2')} onFocus={focusWin} onClose={closeWin}/>
      )}
      {/* ── BONUS windows ── */}
      {openWins.has('jukebox') && (
        <JukeboxWindow zIndex={zMap['jukebox']} {...winProps('jukebox')} onFocus={focusWin} onClose={closeWin}/>
      )}
      {openWins.has('little-runner') && (
        <LittleRunnerWindow zIndex={zMap['little-runner']} {...winProps('little-runner')} onFocus={focusWin} onClose={closeWin}/>
      )}
      {openWins.has('gallery') && (
        <GalleryWindow zIndex={zMap['gallery']} {...winProps('gallery')} onFocus={focusWin} onClose={closeWin}/>
      )}

      {/* Dynamic file access error dialogs */}
      {Object.entries(fileErrors).map(([id, filename]) =>
        openWins.has(id) && (
          <FileAccessError key={id} id={id} filename={filename}
                           zIndex={zMap[id]} {...winProps(id)} onFocus={focusWin} onClose={closeWin}/>
        )
      )}

      {/* Overlays */}
      {startOpen && (
        <StartMenu
          onClose={() => setStartOpen(false)}
          onLaunch={doLaunch}
          onShutdown={onShutdown || onUninstallTriggered}
          onOpenReadme={() => { openWin('readme'); setStartOpen(false); }}
          onOpenMyComputer={() => { openWin('my-computer'); setStartOpen(false); }}
        />
      )}
      {contextMenu && (
        <ContextMenu x={contextMenu.x} y={contextMenu.y}
                     onClose={() => setContextMenu(null)}
                     onOpenProperties={() => { openWin('desktop-props'); setContextMenu(null); }}/>
      )}
      {openWins.has('desktop-props') && (
        <DesktopPropertiesDialog zIndex={zMap['desktop-props']}
                                 {...winProps('desktop-props')}
                                 onFocus={focusWin} onClose={closeWin}/>
      )}
      {trayOpen && <TrayPopup onClose={() => setTrayOpen(false)}/>}

      {/* ── Startup sequence overlay ── */}
      {startupPhase !== 'gone' && (
        <div className={`desktop-startup-overlay${startupPhase === 'fading' ? ' fading' : ''}`}
             style={{ background: startupPhase === 'bios' ? '#000' : '#008080' }}>

          {/* Phase 1: BIOS POST text */}
          {startupPhase === 'bios' && (
            <div style={{ padding: '14px 18px', fontFamily: '"Courier New", Courier, monospace',
                          fontSize: 13, lineHeight: 1.55 }}>
              {BIOS_LINES.slice(0, biosVisible).map((line, i) => (
                <div key={i} className="bios-line"
                     style={{ color: BIOS_COL[line.col], minHeight: line.text === '' ? 10 : 'auto' }}>
                  {line.text}
                </div>
              ))}
              {biosVisible > 0 && biosVisible < BIOS_LINES.length && (
                <span className="blink" style={{ color: '#b0b0b0' }}>▮</span>
              )}
            </div>
          )}

          {/* Phase 2: Win95/CSG splash */}
          {startupPhase === 'splash' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center',
                          justifyContent: 'center', height: '100%', gap: 20 }}>
              {/* CSG logo block */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                <CSGGlyph size={72} color="#F5A524" strokeWidth={1.2}/>
                <div>
                  <div style={{ fontFamily: '"Times New Roman", Times, serif', color: '#fff',
                                fontSize: 32, fontWeight: 400, letterSpacing: '0.04em', lineHeight: 1 }}>
                    RUNTIME<span style={{ fontStyle: 'italic' }}>95</span>
                  </div>
                  <div style={{ fontFamily: 'IBM Plex Mono, monospace', color: '#F5A524',
                                fontSize: 10, letterSpacing: '0.2em', marginTop: 6 }}>
                    CSG DIAGNOSTIC RUNTIME
                  </div>
                </div>
              </div>
              {/* Progress bar */}
              <div style={{ width: 260 }}>
                <div style={{ height: 8, border: '1px solid rgba(255,255,255,0.4)',
                              background: 'rgba(0,0,0,0.3)', overflow: 'hidden' }}>
                  <div className="startup-splash-bar" style={{ height: '100%', width: `${splashPct}%` }}/>
                </div>
                <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 9,
                              color: 'rgba(255,255,255,0.55)', marginTop: 6, letterSpacing: '0.12em' }}>
                  {splashPct < 40 ? 'Loading device drivers…'
                   : splashPct < 70 ? 'Mounting artifact envelope…'
                   : splashPct < 95 ? 'Verifying CSG seal ▲-04-A-0117…'
                   : 'Preparing desktop…'}
                </div>
              </div>
              <div style={{ fontFamily: 'IBM Plex Mono, monospace', fontSize: 8,
                            color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', marginTop: -8 }}>
                CSG-DSC-04A · NOT FOR GENERAL DISTRIBUTION
              </div>
            </div>
          )}
        </div>
      )}

      {/* Launch transition */}
      {bootSeq && (
        <div style={{
          position: 'absolute', inset: 0, zIndex: 150,
          background: '#000', display: 'grid', placeItems: 'center',
          animation: 'crt-on 700ms ease-out forwards',
        }}>
          <div style={{ fontFamily: 'IBM Plex Mono, monospace', color: '#F5A524',
                        letterSpacing: '0.2em', fontSize: 14 }}>
            LAUNCHING BLOODRUN.EXE…
          </div>
        </div>
      )}

      {/* Animated hint cursor */}
      {cursorPos.visible && (
        <div style={{ position: 'absolute', left: cursorPos.x, top: cursorPos.y,
                      pointerEvents: 'none', zIndex: 160,
                      transition: 'left 80ms linear, top 80ms linear' }}>
          <svg width="16" height="22" viewBox="0 0 16 22" shapeRendering="crispEdges">
            <polygon points="0,0 0,16 4,12 7,18 9,17 6,11 11,11" fill="#fff" stroke="#000" strokeWidth="1"/>
          </svg>
          <div style={{ position: 'absolute', left: 18, top: 18, background: '#ffffcc',
                        border: '1px solid #000', padding: '2px 6px',
                        fontFamily: 'Tahoma, Geneva, sans-serif', fontSize: 11,
                        whiteSpace: 'nowrap' }}>
            Double-click to run
          </div>
        </div>
      )}

      <Taskbar
        tasks={taskbarTasks}
        onStartClick={(e) => { e.stopPropagation(); setStartOpen(v => !v); setContextMenu(null); setTrayOpen(false); }}
        onTrayClick={(e) => { e.stopPropagation(); setTrayOpen(v => !v); setStartOpen(false); }}
      />
    </div>
  );
}

// ── Breakout — mid-game crash ─────────────────────────────────────────────────

function Breakout({ onResolve, durationMs = 2800 }) {
  const [phase, setPhase] = useState('crash');
  useEffect(() => {
    const t1 = setTimeout(() => setPhase('dialog'), 350);
    const t2 = setTimeout(() => setPhase('snap'), durationMs - 350);
    const t3 = setTimeout(() => onResolve(), durationMs);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    // eslint-disable-next-line
  }, []);

  return (
    <div className="w95" style={{
      position: 'absolute', inset: 0, zIndex: 90, overflow: 'hidden',
      animation: phase === 'snap' ? 'breakout-snap 350ms steps(4) forwards' : undefined,
    }}>
      <DesktopBg/>
      <div style={{ position: 'absolute', inset: 0, animation: 'breakout-shudder 80ms infinite' }}>
        <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <DesktopIcon icon={<DocIcon size={32} tone="#ffffaa"/>} label="My Computer"/>
          <DesktopIcon icon={<FolderIcon size={32}/>} label="Network Neighborhood"/>
          <DesktopIcon icon={<FolderIcon size={32}/>} label="Recycle Bin"/>
          <DesktopIcon icon={<BloodrunIcon size={32}/>} label="BLOODRUN.exe" selected/>
        </div>
      </div>
      {(phase === 'dialog' || phase === 'snap') && (
        <div className="w95-window" style={{
          position: 'absolute', left: '50%', top: '50%',
          transform: 'translate(-50%, -50%)', width: 380, padding: 2,
          boxShadow: '6px 6px 0 rgba(0,0,0,0.55)',
        }}>
          <div className="w95-titlebar">
            <TitlebarMiniIcon kind="csg"/>
            <div className="w95-title-text">BLOODRUN.EXE — Application Error</div>
            <TitlebarButtons/>
          </div>
          <div style={{ padding: '18px 16px 14px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
            <div className="icon-stop">✕</div>
            <div style={{ fontSize: 11, lineHeight: 1.55 }}>
              The instruction at <b>0x04A0117</b> referenced sealed memory at <b>0x∞</b>.
              <div style={{ marginTop: 6, color: '#7a1014' }}>The artifact has lost containment.</div>
              <div style={{ marginTop: 6, fontSize: 10, color: '#404040' }}>Press OK to terminate. Press CANCEL to continue.</div>
            </div>
          </div>
          <div style={{ padding: '0 12px 12px', display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
            <div className="w95-btn default">OK</div>
            <div className="w95-btn">Cancel</div>
          </div>
        </div>
      )}
      <Taskbar tasks={[
        { icon: <BloodrunIcon size={14}/>, label: 'BLOODRUN.exe (not responding)', active: true },
      ]}/>
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 95,
        backgroundImage: 'repeating-linear-gradient(to bottom, rgba(0,0,0,0) 0 2px, rgba(0,0,0,0.45) 3px, rgba(0,0,0,0) 4px)',
        mixBlendMode: 'multiply', opacity: 0.7,
      }}/>
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 96,
        background: 'radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(255,0,0,0.06) 70%, rgba(0,0,0,0.6) 100%)',
      }}/>
    </div>
  );
}

export { DesktopLaunch, Breakout };
