// BLOODRUN.exe — Title menu, Death, Archive

import { useState, useEffect } from 'react';
import { VHSCorners, GlitchText, FootSprite, useTypewriter, useKey } from './sprites-engine.jsx';
import { REAPER_FRAMES } from './sprites-data.js';

// === TITLE MENU =====================================================
function TitleMenu({ onStart, onOptions, onArchive, onExit, onSkipTrack }) {
  const items = ['START', 'OPTIONS', 'ARCHIVE', 'EXIT'];
  const [sel, setSel] = useState(0);
  const [breathing, setBreathing] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setBreathing(b => 1 - b), 600);
    return () => clearInterval(id);
  }, []);

  useKey((e) => {
    if (e.key === 'ArrowUp' || e.key === 'w') setSel(s => (s + items.length - 1) % items.length);
    else if (e.key === 'ArrowDown' || e.key === 's') setSel(s => (s + 1) % items.length);
    else if (e.key === 'n' || e.key === 'N') onSkipTrack && onSkipTrack();
    else if (e.key === 'Enter' || e.key === ' ' || e.key === 'z') {
      if (items[sel] === 'START') onStart();
      else if (items[sel] === 'OPTIONS') onOptions();
      else if (items[sel] === 'ARCHIVE') onArchive();
      else if (items[sel] === 'EXIT') onExit();
    }
  }, [sel, onStart, onOptions, onArchive, onExit, onSkipTrack]);

  return (
    <div className="scene" style={{ background: '#000', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <VHSCorners
        tl={<>L.P <span className="kata">ｽﾀﾝﾊﾞｲ</span></>}
        tr={<>16 BIT <span className="kata">ﾓﾉﾄｰﾝ</span></>}
        bl={<>SP <span className="kata">ﾓﾑｶﾞｶ</span></>}
        br={<>00:83</>}
      />

      {/* faint stars */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage: `
          radial-gradient(1px 1px at 12% 18%, #fff, transparent 100%),
          radial-gradient(1px 1px at 78% 14%, #fff, transparent 100%),
          radial-gradient(1px 1px at 30% 30%, #888, transparent 100%),
          radial-gradient(1px 1px at 88% 50%, #aaa, transparent 100%),
          radial-gradient(1px 1px at 22% 70%, #888, transparent 100%),
          radial-gradient(1px 1px at 64% 78%, #fff, transparent 100%),
          radial-gradient(1px 1px at 8% 88%, #666, transparent 100%)
        `,
        opacity: 0.7,
        pointerEvents: 'none',
      }} />

      {/* logo */}
      <div style={{ marginTop: 30, position: 'relative' }}>
        <div className="bloodrun-logo">BLOOD RUN</div>
        <div style={{
          position: 'absolute', top: -8, left: '50%', transform: 'translateX(-50%) translateY(-100%)',
          fontFamily: 'IBM Plex Mono', fontSize: 10, color: '#F5A524',
          letterSpacing: '0.4em', whiteSpace: 'nowrap',
        }}>
          ▲ CSG · BLOODRUN.exe · ©1996 ▲
        </div>
        <div style={{
          marginTop: -10,
          textAlign: 'center',
          fontFamily: 'IBM Plex Mono',
          fontSize: 18,
          color: '#E8E0D0',
          letterSpacing: '0.18em',
          borderBottom: '1px solid #C8161D',
          paddingBottom: 4,
          display: 'inline-block',
          width: '100%',
        }}>BLOODRUN.exe</div>
      </div>

      {/* reaper centered behind menu */}
      <div style={{
        position: 'absolute',
        left: '50%',
        top: '38%',
        width: 0, height: 0,
        opacity: 0.92,
        filter: breathing ? 'none' : 'brightness(1.04)',
        transition: 'filter 600ms linear',
      }}>
        <FootSprite src={REAPER_FRAMES.idle} scale={0.85} dir={1} />
      </div>

      {/* menu */}
      <div style={{
        position: 'absolute',
        left: '50%', bottom: '12%',
        transform: 'translateX(-50%)',
        display: 'flex', flexDirection: 'column', gap: 2,
      }}>
        {items.map((it, i) => (
          <div
            key={it}
            className={`menu-item ${i === sel ? 'selected' : ''}`}
            onMouseEnter={() => setSel(i)}
            onClick={() => {
              if (it === 'START') onStart();
              else if (it === 'OPTIONS') onOptions();
              else if (it === 'ARCHIVE') onArchive();
              else if (it === 'EXIT') onExit();
            }}
          >
            {it}
          </div>
        ))}
      </div>

      {/* katakana sidebar */}
      <div style={{
        position: 'absolute',
        right: 22, top: '50%', transform: 'translateY(-50%)',
        fontFamily: 'IBM Plex Mono',
        fontSize: 14,
        writingMode: 'vertical-rl',
        color: '#6BCC4D',
        letterSpacing: '0.1em',
        textShadow: '1px 0 #C8161D',
      }}>
        ﾓﾑｶﾞｶ ｷﾊﾀﾁﾍﾞｲﾝﾊﾞ
      </div>

      <div className="input-strip">
        <span><kbd>↑↓</kbd> SELECT</span>
        <span><kbd>↵</kbd> CONFIRM</span>
        <span><kbd>N</kbd> NEXT TRACK</span>
      </div>

      <div style={{
        position: 'absolute', left: '50%', bottom: 30, transform: 'translateX(-50%)',
        fontFamily: 'IBM Plex Mono', fontSize: 11, letterSpacing: '0.18em', color: '#807A75',
      }}>
        <span className="blink">INIT IALIZ ING</span>
      </div>
    </div>
  );
}

// === DEATH SCREEN ===================================================
function DeathScreen({ runTime, onContinue }) {
  const subline = useTypewriter(
    'THE OPERATOR HAS EXPIRED. THE ARTIFACT REMAINS.',
    35,
    true,
  );
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setReady(true), 1500);
    return () => clearTimeout(id);
  }, []);
  useKey((e) => {
    if (!ready) return;
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'z') onContinue();
  }, [onContinue, ready]);

  return (
    <div className="death-overlay">
      {/* Tarot attendant — emerges slowly from the dark, barely visible */}
      <div className="death-attendant" aria-hidden="true" />
      <VHSCorners
        tl={<>L.P <span className="kata">ﾀｲｷ</span></>}
        tr={<>REC <span className="blink">●</span></>}
        bl={<>{`00:${String(Math.floor(runTime/60)).padStart(2,'0')}:${String(Math.floor(runTime)%60).padStart(2,'0')}`}</>}
        br={<>FAULT 0xDE4D</>}
      />
      <div style={{ textAlign: 'center', position: 'relative', zIndex: 30 }}>
        <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#F5A524', letterSpacing: '0.3em', marginBottom: 18 }}>
          ▲ CATALYST SYSTEMS GROUP · DIAGNOSTIC FAULT 0xDE4D ▲
        </div>
        <div className="death-title phosphor">
          <GlitchText>YOU DIED</GlitchText>
        </div>
        <div style={{
          marginTop: 18,
          fontFamily: 'IBM Plex Mono', fontSize: 14, letterSpacing: '0.18em',
          color: '#B8B0A8', textTransform: 'uppercase',
        }}>
          {subline}<span className="blink">▮</span>
        </div>
        <div style={{
          marginTop: 36,
          fontFamily: 'IBM Plex Mono', fontSize: 12, letterSpacing: '0.2em',
          color: '#807A75', textTransform: 'uppercase',
        }}>
          RUN ARCHIVED &nbsp;·&nbsp; CSG-DSC-04A &nbsp;·&nbsp; ENTRY #{Math.floor(Math.random()*9000+1000)}
        </div>
        <div style={{
          marginTop: 22,
          fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#C8161D', letterSpacing: '0.2em',
        }}>
          PRESS <kbd style={{ border: '1px solid #C8161D', padding: '2px 6px' }}>↵</kbd> TO ACKNOWLEDGE
        </div>
      </div>
    </div>
  );
}

// === ARCHIVE SCREEN =================================================
const ARCHIVE_ENTRIES = [
  { id: '04A.001', op: '<UNATTRIBUTED>',   zone: 'CHAPEL', dur: '00:14:22', state: 'EXPIRED' },
  { id: '04A.002', op: '<UNATTRIBUTED>',   zone: 'SLUICE', dur: '00:03:08', state: 'EXPIRED' },
  { id: '04A.003', op: '[REDACTED]',       zone: 'VAULT',  dur: '? ?:? ?:? ?', state: 'CORRUPT', corrupt: true },
  { id: '04A.004', op: 'V. WALTER',        zone: 'CHAPEL', dur: '00:00:38', state: 'EXPIRED' },
  { id: '04A.005', op: '<UNATTRIBUTED>',   zone: 'CHAPEL', dur: '00:21:47', state: 'EXPIRED' },
  { id: '04A.006', op: 'CSG-AUDITOR-07',   zone: 'VAULT',  dur: '00:08:11', state: 'SEALED' },
  { id: '04A.007', op: '<UNATTRIBUTED>',   zone: 'SLUICE', dur: '00:01:55', state: 'EXPIRED' },
  { id: '04A.008', op: '[REDACTED]',       zone: '???',    dur: '∞',        state: 'OPEN',    corrupt: true },
];

function ArchiveScreen({ onBack, noticeFound, onOpenNotice }) {
  const entries = noticeFound
    ? [
        { id: '04A.000', op: 'CSG / PUBLISHER', zone: 'INSERT',  dur: '—',          state: 'RETRIEVED', notice: true },
        ...ARCHIVE_ENTRIES,
      ]
    : ARCHIVE_ENTRIES;
  const [sel, setSel] = useState(0);
  useKey((e) => {
    if (e.key === 'ArrowUp' || e.key === 'w') setSel(s => (s + entries.length - 1) % entries.length);
    else if (e.key === 'ArrowDown' || e.key === 's') setSel(s => (s + 1) % entries.length);
    else if (e.key === 'Enter' || e.key === 'z') {
      if (entries[sel].notice && onOpenNotice) onOpenNotice();
    }
    else if (e.key === 'Escape' || e.key === 'Backspace') onBack();
  }, [onBack, sel, entries, onOpenNotice]);

  const e = entries[sel];

  return (
    <div className="scene" style={{ background: '#0A0808', padding: '20px 32px' }}>
      <VHSCorners
        tl={<>L.P <span className="kata">ｱｰｶｲﾌﾞ</span></>}
        tr={<>16 BIT</>}
        bl={<>00:00:21:08</>}
        br={<>3.2.1.0.1.2.3</>}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14, marginTop: 14 }}>
        <div>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#F5A524', letterSpacing: '0.3em' }}>
            ▲ CSG-DSC-04A · RUN ARCHIVE
          </div>
          <div style={{ fontFamily: 'VT323', fontSize: 42, color: '#E8E0D0', letterSpacing: '0.06em', lineHeight: 1 }}>
            DIAGNOSTIC ARCHIVE
          </div>
        </div>
        <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#807A75', letterSpacing: '0.15em' }}>
          {entries.length} ENTRIES · {entries.filter(r => r.corrupt).length} CORRUPT
        </div>
      </div>

      <div style={{ border: '1px solid #2a2722', background: '#000' }}>
        <div className="archive-row head">
          <div>IDX</div>
          <div>OPERATOR</div>
          <div>ZONE</div>
          <div>DURATION</div>
          <div>STATE</div>
        </div>
        {entries.map((row, i) => (
          <div
            key={row.id}
            className={`archive-row ${i === sel ? 'selected' : ''} ${row.corrupt ? 'corrupt' : ''}`}
            onClick={() => setSel(i)}
            onDoubleClick={() => { if (row.notice && onOpenNotice) onOpenNotice(); }}
            style={row.notice ? { color: '#F5A524' } : undefined}
          >
            <div>{row.id}</div>
            <div>{row.op}</div>
            <div>{row.zone}</div>
            <div>{row.dur}</div>
            <div>{row.state}</div>
          </div>
        ))}
      </div>

      {/* selected detail panel */}
      <div style={{
        marginTop: 14,
        border: '1px solid #2a2722',
        padding: '12px 16px',
        background: '#000',
        fontFamily: 'IBM Plex Mono',
        fontSize: 12,
        color: '#807A75',
        letterSpacing: '0.06em',
      }}>
        <div style={{ color: '#F5A524', fontSize: 10, letterSpacing: '0.2em', marginBottom: 6 }}>
          ENTRY DETAIL · {e.id}
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
          <div>OPERATOR &nbsp;: <span style={{ color: '#E8E0D0' }}>{e.op}</span></div>
          <div>ZONE &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;: <span style={{ color: '#E8E0D0' }}>{e.zone}</span></div>
          <div>DURATION &nbsp;: <span style={{ color: '#E8E0D0' }}>{e.dur}</span></div>
          <div>STATE &nbsp;&nbsp;&nbsp;&nbsp;: <span style={{ color: e.corrupt ? '#E62028' : '#E8E0D0' }}>{e.state}</span></div>
        </div>
        <div style={{ marginTop: 8, color: '#5a5550' }}>
          {e.notice
            ? 'NOTE. CSG DISTRIBUTION INSERT RETRIEVED IN-WORLD. PRESS [↵] TO REVIEW.'
            : e.corrupt
              ? 'NOTE. RUN DATA UNREADABLE. ARTIFACT MAY HAVE OPERATED OUTSIDE ENVELOPE.'
              : 'NOTE. RUN TERMINATED AS EXPECTED. ARTIFACT SEAL INTACT.'}
        </div>
      </div>

      <div className="input-strip">
        <span><kbd>↑↓</kbd> SELECT</span>
        {entries[sel].notice && <span><kbd>↵</kbd> OPEN</span>}
        <span><kbd>ESC</kbd> BACK</span>
      </div>
    </div>
  );
}

// === DEMO WARRANTY VOID =============================================
// Demo paywall wall. Fires when the evaluation slice is exhausted:
//   - first time: after the player clears the SLUICE taste
//   - thereafter: at the end of CHAPEL (the only remaining sector)
// Acknowledging drops back to TITLE; the demoVoided flag (owned by App)
// permanently caps further runs to CHAPEL.
function DemoWarrantyVoid({ firstTime, onAcknowledge }) {
  const subline = useTypewriter(
    firstTime
      ? 'EVALUATION ENVELOPE EXHAUSTED. SECTORS BEYOND SLUICE ARE UNLICENSED.'
      : 'EVALUATION ENVELOPE EXHAUSTED. ONLY SECTOR I REMAINS UNSEALED.',
    32,
    true,
  );
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setReady(true), 1400);
    return () => clearTimeout(id);
  }, []);
  useKey((e) => {
    if (!ready) return;
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'z') onAcknowledge();
  }, [onAcknowledge, ready]);

  return (
    <div className="death-overlay" data-demo="warranty-void">
      <VHSCorners
        tl={<>EVAL <span className="kata">ﾀｲｷ</span></>}
        tr={<>SEAL <span className="blink">●</span></>}
        bl={<>CSG-DSC-04A</>}
        br={<>§ 4.A.ii</>}
      />
      <div style={{ textAlign: 'center', position: 'relative', zIndex: 30, maxWidth: 620, padding: '0 24px' }}>
        <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#F5A524', letterSpacing: '0.3em', marginBottom: 18 }}>
          ▲ CATALYST SYSTEMS GROUP · DISTRIBUTION ENVELOPE CSG-DSC-04A ▲
        </div>
        <div className="death-title phosphor">
          <GlitchText>WARRANTY VOID</GlitchText>
        </div>
        <div style={{
          marginTop: 18,
          fontFamily: 'IBM Plex Mono', fontSize: 13, letterSpacing: '0.16em',
          color: '#B8B0A8', textTransform: 'uppercase', lineHeight: 1.7,
        }}>
          {subline}<span className="blink">▮</span>
        </div>
        <div style={{
          marginTop: 30,
          fontFamily: 'IBM Plex Mono', fontSize: 11, letterSpacing: '0.14em',
          color: '#807A75', textTransform: 'uppercase', lineHeight: 1.8,
        }}>
          THIS REMNANT IS DISTRIBUTED FOR EVALUATION ONLY. NO REPRESENTATION IS MADE
          AS TO THE ORIGIN OR FITNESS OF THE ENCLOSED ARTIFACT. REPRODUCTION,
          REDISTRIBUTION, OR ATTEMPTED PASSAGE BEYOND THE LICENSED SECTORS VOIDS
          ALL WARRANTY UNDER THE TERMS SET FORTH IN § 4.A.ii.
        </div>
        <div style={{
          marginTop: 30,
          fontFamily: 'IBM Plex Mono', fontSize: 11, color: '#C8161D', letterSpacing: '0.2em',
        }}>
          PRESS <kbd style={{ border: '1px solid #C8161D', padding: '2px 6px' }}>↵</kbd> TO ACKNOWLEDGE
        </div>
      </div>
    </div>
  );
}

export { TitleMenu, DeathScreen, ArchiveScreen, DemoWarrantyVoid };
