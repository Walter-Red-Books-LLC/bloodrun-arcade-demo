// BLOODRUN.exe — Interactive installer flow.
// Owns its own state machine: welcome → license → dest → progress → finish.

import { useState, useRef, useEffect } from 'react';
import { useKey } from './sprites-engine.jsx';
import { CSGGlyph, TitlebarMiniIcon, TitlebarButtons, NoiseLayer, BloodrunIcon } from './surfaces-shared.jsx';

const INSTALL_LOG_LINES = [
  'Copying BLOODRUN.EXE..............',
  'Copying BLOODRUN.DAT..............',
  'Copying CSG-LIC-04.TXT............',
  'Copying CSG-DSC-04A.TXT...........',
  'Copying assets/REAPER_*.SPR.......',
  'Copying assets/CHAPEL_*.MAP.......',
  'Copying assets/SLUICE_*.MAP.......',
  'Copying assets/VAULT_*.MAP........',
  'Registering CLSID {▲-04-A-0117}..',
  'Registering envelope CSG-LIC-04..',
  'Sealing artifact (▲-04-A-0117)...',
  'Indexing SAVE0.SAV................',
  'Verifying integrity...............',
  'Writing registry hive.............',
  'Writing uninstall key (DENIED)....',
  'Setup complete.',
];

// Banner column reused in every step
function StepBanner({ subtitle = 'CATALYST SYSTEMS GROUP' }) {
  return (
    <div className="installer-banner" style={{ flex: '0 0 164px' }}>
      <NoiseLayer opacity={0.22} freq={1.8} octaves={2}/>
      {/* Animated scan band — rolls down continuously */}
      <div className="installer-scan-band"/>
      {/* Radial glow at bottom */}
      <div style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, height: 130,
        background: 'radial-gradient(ellipse at 50% 100%, rgba(230, 32, 40, 0.45), transparent 70%)',
        pointerEvents: 'none',
      }}/>
      {/* Glyph floats and rotates via CSS */}
      <div className="installer-banner-glyph">
        <CSGGlyph size={90} color="#F5A524" strokeWidth={1.5}/>
      </div>
      <div className="installer-banner-title">BLOOD<br/>RUN</div>
      <div className="installer-banner-sub">{subtitle}</div>
    </div>
  );
}

// Wizard chrome wraps all step bodies
function WizardFrame({ title, children, footer, onCancelClick }) {
  return (
    <div className="w95" style={{ width: 640, height: 480, margin: 'auto', boxShadow: '4px 4px 0 #000, 8px 8px 32px rgba(0,0,0,0.6)' }}>
      <div className="w95-window" style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div className="w95-titlebar">
          <TitlebarMiniIcon kind="csg"/>
          <div className="w95-title-text">{title}</div>
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
            <div className="w95-tb-btn" title="Close" style={{ marginLeft: 2 }} onClick={onCancelClick}>
              <svg width="8" height="8" viewBox="0 0 8 8" shapeRendering="crispEdges">
                <path d="M0,0 L8,8 M8,0 L0,8" stroke="black" strokeWidth="1.2"/>
              </svg>
            </div>
          </div>
        </div>
        <div style={{ flex: 1, display: 'flex', padding: 4, minHeight: 0 }}>
          {children}
        </div>
        <div style={{ borderTop: '1px solid #808080', borderBottom: '1px solid #ffffff', margin: '0 4px' }}/>
        <div style={{ padding: 10, display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
          {footer}
        </div>
      </div>
    </div>
  );
}

function Steps({ step }) {
  const order = ['welcome', 'license', 'dest', 'progress', 'finish'];
  const labels = { welcome: 'Welcome', license: 'License', dest: 'Destination', progress: 'Install', finish: 'Finish' };
  return (
    <div style={{ display: 'flex', gap: 6, fontSize: 10, color: '#404040', textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 'auto' }}>
      {order.map(s => (
        <span key={s} style={{ fontWeight: s === step ? 700 : 400, color: s === step ? 'black' : '#404040' }}>
          {s === step ? '● ' : '○ '}{labels[s]}
        </span>
      ))}
    </div>
  );
}

// === WELCOME ===============================================================
function WelcomeStep({ onNext, onCancel }) {
  return (
    <WizardFrame title="BLOODRUN — InstallShield Wizard" onCancelClick={onCancel} footer={
      <>
        <div className="w95-btn disabled">&lt; Back</div>
        <div className="w95-btn default" onClick={onNext}><u>N</u>ext &gt;</div>
        <div className="w95-btn" style={{ marginLeft: 6 }} onClick={onCancel}>Cancel</div>
      </>
    }>
      <StepBanner/>
      <div style={{ flex: 1, padding: '20px 22px 10px', display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700 }}>Welcome to the BLOODRUN Setup</div>
        <div style={{ fontSize: 11, lineHeight: 1.5 }}>
          Setup will install <b>BLOODRUN.exe</b> on your computer under the terms of license&nbsp;<b>CSG-LIC-04</b>. It is strongly recommended that you exit all programs before continuing.
        </div>
        <div style={{ fontSize: 11, lineHeight: 1.5 }}>
          Click&nbsp;<b>Next</b> to continue, or&nbsp;<b>Cancel</b> to exit Setup.
        </div>
        <div className="w95-inset-frame" style={{ padding: 8, marginTop: 6 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <CSGGlyph size={36} color="#000" strokeWidth={3}/>
            <div style={{ fontSize: 11, lineHeight: 1.45 }}>
              <div><b>Publisher:</b> Catalyst Systems Group</div>
              <div><b>Reference:</b> CSG-DSC-04A &nbsp;·&nbsp; REV. 1996.10.31</div>
              <div style={{ color: '#a8281c' }}><b>Notice:</b> the publisher's certificate could not be verified.</div>
            </div>
          </div>
        </div>
        <div style={{ flex: 1 }}/>
        <Steps step="welcome"/>
      </div>
    </WizardFrame>
  );
}

// === LICENSE ===============================================================
const EULA_TEXT = `CATALYST SYSTEMS GROUP — DIAGNOSTIC DISTRIBUTION LICENSE
CSG-LIC-04 / REV. 1991.11.02

PLEASE READ THE FOLLOWING LICENSE AGREEMENT CAREFULLY.

1. DISTRIBUTION
  1.1  The artifact referenced herein as BLOODRUN.exe ("the Artifact")
       is distributed by Catalyst Systems Group ("the Publisher")
       under license reference CSG-LIC-04, revision 1991.11.02.
  1.2  The Publisher is the surface distribution entity of record.
       CSG does not assert authorship. No representation is made as
       to the origin, authorship, fitness, or behavior of the
       enclosed Artifact.

2. CONDITIONS OF USE
  2.1  The recipient party ("the Operator") acknowledges receipt of
       the Artifact under the terms set forth in § 4.A.ii of the
       master CSG Distribution Framework.
  2.2  The Operator is advised that the Artifact may, under certain
       operational envelopes, exhibit behavior not described in the
       enclosed documentation.
  2.3  In the event that the Artifact addresses the Operator by
       name, identifies family members of the Operator, or refers
       to events not yet observed, the Operator is directed to
       § 7.B and must contact the Publisher WITHIN 24 HOURS.

3. NON-WARRANTY
  3.1  THE ARTIFACT IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
       EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
       OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-
       INFRINGEMENT, OR CONTAINMENT.

4. RECIPIENT WAIVER
  4.A  By proceeding past this notice the Operator hereby waives any
       and all claims, present and prospective, arising from or in
       connection with this distribution, including:
         (i)    physical reaction to the Artifact's presentation;
         (ii)   recurrence, in waking or dreaming state, of any
                imagery rendered by the Artifact during operation;
         (iii)  failure of the Artifact to terminate;
         (iv)   any subsequent contact, by any means, with parties
                not enumerated herein.

5. PROHIBITION
  5.1  Reproduction, redistribution, or attribution of the Artifact
       to any party other than the listed Publisher is prohibited.
  5.2  Inquiries are not accepted at this address.

———— END OF LICENSE ————
`;

function LicenseStep({ onNext, onBack, onCancel }) {
  const [accepted, setAccepted] = useState(false);
  const scrollRef = useRef(null);
  const [scrollPct, setScrollPct] = useState(0);
  const [scrollMax, setScrollMax] = useState(1);

  const onScroll = (e) => {
    const el = e.target;
    const max = el.scrollHeight - el.clientHeight;
    setScrollMax(max);
    setScrollPct(max > 0 ? el.scrollTop / max : 0);
  };

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const m = el.scrollHeight - el.clientHeight;
    setScrollMax(m);
  }, []);

  const scrollBy = (dy) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = Math.max(0, Math.min(el.scrollHeight, el.scrollTop + dy));
  };
  useKey((e) => {
    if (e.key === 'PageDown' || (e.key === ' ' && !accepted)) { e.preventDefault(); scrollBy(160); }
    else if (e.key === 'PageUp') { e.preventDefault(); scrollBy(-160); }
    else if (e.key === 'End') { const el = scrollRef.current; if (el) el.scrollTop = el.scrollHeight; }
    else if (e.key === 'Home') { const el = scrollRef.current; if (el) el.scrollTop = 0; }
  }, [accepted]);

  return (
    <WizardFrame title="BLOODRUN — InstallShield Wizard" onCancelClick={onCancel} footer={
      <>
        <div className="w95-btn" onClick={onBack}>&lt; Back</div>
        <div className={`w95-btn ${accepted ? 'default' : 'disabled'}`} onClick={() => accepted && onNext()}>
          <u>N</u>ext &gt;
        </div>
        <div className="w95-btn" style={{ marginLeft: 6 }} onClick={onCancel}>Cancel</div>
      </>
    }>
      <StepBanner subtitle="CSG-LIC-04"/>
      <div style={{ flex: 1, padding: '14px 16px 8px', display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0, minHeight: 0 }}>
        <div style={{ fontSize: 12, fontWeight: 700 }}>License Agreement</div>
        <div style={{ fontSize: 11, lineHeight: 1.4 }}>
          Please read the following license agreement carefully. Press the&nbsp;PAGE&nbsp;DOWN key to see the rest.
        </div>

        <div className="w95-inset" style={{ flex: 1, padding: 0, position: 'relative', display: 'flex', minHeight: 0 }}>
          <div
            ref={scrollRef}
            onScroll={onScroll}
            style={{
              flex: 1, padding: 6, overflowY: 'auto', overflowX: 'hidden', minHeight: 0,
              fontFamily: '"Courier New", Courier, monospace',
              fontSize: 11, lineHeight: 1.35, color: 'black',
              whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            }}>
            {EULA_TEXT}
          </div>
          <div style={{
            width: 16, background: '#dfdfdf', borderLeft: '1px solid #808080',
            display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0,
            userSelect: 'none',
          }}>
            <div className="w95-tb-btn" style={{ width: 14, height: 14, fontSize: 8, cursor: 'pointer' }}
                 onClick={() => scrollBy(-40)}>▲</div>
            <div
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const rel = (e.clientY - rect.top) / rect.height;
                const el = scrollRef.current;
                if (!el) return;
                const cur = el.scrollTop / Math.max(1, el.scrollHeight - el.clientHeight);
                scrollBy(rel > cur ? 120 : -120);
              }}
              style={{ flex: 1, position: 'relative', width: '100%', cursor: 'pointer',
                background: 'repeating-conic-gradient(#c0c0c0 0% 25%, #dfdfdf 0% 50%) 50% / 2px 2px' }}>
              <div className="w95-inset-frame" style={{
                position: 'absolute', left: 1, right: 1,
                top: `calc(${scrollPct * 100}% - ${scrollPct * 40}px + 2px)`,
                height: 40, background: '#c0c0c0',
                pointerEvents: 'none',
              }}/>
            </div>
            <div className="w95-tb-btn" style={{ width: 14, height: 14, fontSize: 8, cursor: 'pointer' }}
                 onClick={() => scrollBy(40)}>▼</div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 11, marginTop: 4 }}>
          <label className="w95-check" onClick={() => setAccepted(true)}>
            <span className={`w95-check-box ${accepted ? 'checked' : ''}`}/>
            I <u>a</u>ccept the terms in the license agreement.
          </label>
          <label className="w95-check" onClick={() => setAccepted(false)}>
            <span className={`w95-check-box ${!accepted ? 'checked' : ''}`}/>
            I <u>d</u>o not accept the terms in the license agreement.
          </label>
        </div>

        <Steps step="license"/>
      </div>
    </WizardFrame>
  );
}

// === DESTINATION ============================================================
function DestStep({ onNext, onBack, onCancel }) {
  return (
    <WizardFrame title="BLOODRUN — InstallShield Wizard" onCancelClick={onCancel} footer={
      <>
        <div className="w95-btn" onClick={onBack}>&lt; Back</div>
        <div className="w95-btn default" onClick={onNext}><u>I</u>nstall</div>
        <div className="w95-btn" style={{ marginLeft: 6 }} onClick={onCancel}>Cancel</div>
      </>
    }>
      <StepBanner subtitle="DESTINATION"/>
      <div style={{ flex: 1, padding: '20px 22px 10px', display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700 }}>Choose Destination Location</div>
        <div style={{ fontSize: 11, lineHeight: 1.5 }}>
          Setup will install BLOODRUN.exe in the following folder. To install to this folder, click <b>Install</b>. To install to a different folder, click <b>Browse…</b> and select another folder.
        </div>

        <div className="w95-group" style={{ marginTop: 4 }}>
          <span className="legend">Destination folder</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div className="w95-inset" style={{ flex: 1, padding: '3px 6px', fontFamily: '"Courier New", monospace', fontSize: 11 }}>
              C:\PROGRAM FILES\CSG\DSC04A\
            </div>
            <div className="w95-btn" style={{ minWidth: 80 }}>Br<u>o</u>wse…</div>
          </div>
          <div style={{ marginTop: 8, fontSize: 11, color: '#404040' }}>
            Space required: <b>3.65 MB</b> &nbsp;·&nbsp; Space available: <b>1,420 MB</b>
          </div>
        </div>

        <div className="w95-group">
          <span className="legend">Components</span>
          <label className="w95-check" style={{ display: 'flex', marginBottom: 4 }}>
            <span className="w95-check-box checked"/>
            BLOODRUN.exe (required)
          </label>
          <label className="w95-check" style={{ display: 'flex', marginBottom: 4 }}>
            <span className="w95-check-box checked"/>
            Diagnostic logger (CSG-DSC-04A)
          </label>
          <label className="w95-check" style={{ display: 'flex', marginBottom: 4 }}>
            <span className="w95-check-box checked"/>
            Run archive
          </label>
          <label className="w95-check" style={{ display: 'flex' }}>
            <span className="w95-check-box"/>
            Uninstaller <span style={{ color: '#a8281c', marginLeft: 6 }}>(prohibited by envelope)</span>
          </label>
        </div>

        <div style={{ flex: 1 }}/>
        <Steps step="dest"/>
      </div>
    </WizardFrame>
  );
}

// === PROGRESS ===============================================================
function ProgressStep({ onDone, onCancel, durationMs = 6000 }) {
  const [pct,     setPct]     = useState(0);
  const [lineIdx, setLineIdx] = useState(0);
  const [tick,    setTick]    = useState(0);
  const [phase,   setPhase]   = useState('copy'); // 'copy' → 'seal' → 'done'

  useEffect(() => {
    const start = performance.now();
    // Reserve last 12% for the dramatic seal phase
    const copyDur = durationMs * 0.88;
    const sealDur = durationMs * 0.12;
    let raf;
    const loop = (t) => {
      const e = t - start;
      if (e < copyDur) {
        const p = (e / copyDur) * 88;
        setPct(p);
        setLineIdx(Math.min(INSTALL_LOG_LINES.length - 3, Math.floor((p / 88) * (INSTALL_LOG_LINES.length - 3)) + 1));
        setTick(x => x + 1);
        raf = requestAnimationFrame(loop);
      } else if (e < copyDur + sealDur) {
        // Seal phase — progress jumps to 88 then slowly fills to 100
        const sp = ((e - copyDur) / sealDur) * 12;
        setPct(88 + sp);
        // Show the last 3 log lines (seal / verify / complete)
        setLineIdx(INSTALL_LOG_LINES.length - 2 + Math.floor(sp / 6));
        setTick(x => x + 1);
        if (phase !== 'seal') setPhase('seal');
        raf = requestAnimationFrame(loop);
      } else {
        setPct(100);
        setLineIdx(INSTALL_LOG_LINES.length);
        setPhase('done');
        setTimeout(onDone, 600);
      }
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line
  }, []);

  const current = INSTALL_LOG_LINES[Math.min(INSTALL_LOG_LINES.length - 1, lineIdx - 1)] || '';
  const dots = '.'.repeat((tick >> 4) % 4);
  const isSeal = phase === 'seal' || phase === 'done';

  return (
    <WizardFrame title="BLOODRUN — InstallShield Wizard" onCancelClick={onCancel} footer={
      <>
        <div className="w95-btn disabled">&lt; Back</div>
        <div className="w95-btn disabled"><u>N</u>ext &gt;</div>
        <div className="w95-btn" style={{ marginLeft: 6 }} onClick={onCancel}>Cancel</div>
      </>
    }>
      <StepBanner subtitle={isSeal ? 'SEALING…' : 'INSTALLING…'}/>
      <div style={{ flex: 1, padding: '20px 22px 10px', display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700 }}>
          {isSeal ? 'Sealing artifact…' : 'Installing BLOODRUN.exe'}
        </div>
        <div style={{ fontSize: 11, lineHeight: 1.5 }}>
          {isSeal
            ? <span style={{ color: '#a8281c' }}>Applying envelope seal <b>▲-04-A-0117</b>. Do not interrupt.</span>
            : 'The components you selected are being copied. The artifact will be sealed at the end of this process.'}
        </div>

        {/* Current file — typewriter cursor */}
        <div style={{ fontSize: 11, fontFamily: '"Courier New", monospace',
                      color: isSeal ? '#a8281c' : '#000', marginTop: 4, minHeight: 16 }}>
          {current}{pct < 100 ? <span className="blink" style={{ color: isSeal ? '#a8281c' : '#000' }}>{dots || '▮'}</span> : ''}
        </div>

        {/* Progress bar — segments with sweeping sheen when filled */}
        <div className="w95-inset" style={{ height: 22, padding: 2 }}>
          <div style={{ height: '100%', display: 'flex', gap: 2 }}>
            {Array.from({ length: 30 }).map((_, i) => {
              const segPct = ((i + 1) / 30) * 100;
              const filled = segPct <= pct + 0.5;
              return (
                <div key={i} className={filled ? 'installer-seg-filled' : ''}
                     style={{ flex: 1, background: filled ? undefined : 'transparent',
                              transition: filled ? undefined : 'none' }}/>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
          <span style={{ color: isSeal ? '#a8281c' : '#000', fontWeight: isSeal ? 700 : 400 }}>
            {Math.floor(pct)}% complete {isSeal ? '— sealing' : ''}
          </span>
          <span style={{ color: '#404040' }}>{lineIdx} / {INSTALL_LOG_LINES.length} files</span>
        </div>

        {/* Log window — last 6 lines, each slides in */}
        <div className="w95-inset" style={{ flex: 1, padding: 6, fontFamily: '"Courier New", monospace',
                                            fontSize: 10, lineHeight: 1.4, color: '#000', minHeight: 60, overflow: 'hidden' }}>
          {INSTALL_LOG_LINES.slice(0, lineIdx).slice(-6).map((line, i, arr) => (
            <div key={`${lineIdx}-${i}`} className="installer-log-line"
                 style={{ opacity: 1 - (arr.length - 1 - i) * 0.14,
                          color: line.includes('Seal') || line.includes('Verify') || line.includes('uninstall') ? '#a8281c' : '#000' }}>
              {line} {i === arr.length - 1 && pct < 100
                ? <span className="blink" style={{ color: '#000' }}>▮</span>
                : <span style={{ color: '#1e7a1e' }}>OK</span>}
            </div>
          ))}
        </div>

        <Steps step="progress"/>
      </div>
    </WizardFrame>
  );
}

// === FINISH =================================================================
function FinishStep({ onLaunch, onCancel }) {
  return (
    <WizardFrame title="BLOODRUN — InstallShield Wizard" onCancelClick={onCancel} footer={
      <>
        <div className="w95-btn disabled">&lt; Back</div>
        <div className="w95-btn default" onClick={() => onLaunch(false)}><u>F</u>inish</div>
        <div className="w95-btn disabled" style={{ marginLeft: 6 }}>Cancel</div>
      </>
    }>
      <StepBanner subtitle="SETUP COMPLETE"/>
      <div style={{ flex: 1, padding: '20px 22px 10px', display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 700 }}>InstallShield Wizard Complete</div>
        <div style={{ fontSize: 11, lineHeight: 1.5 }}>
          BLOODRUN.exe has been installed on your computer and sealed under reference&nbsp;<b>CSG-DSC-04A</b> · seal&nbsp;<b>▲-04-A-0117</b>. Click&nbsp;<b>Finish</b> to complete Setup.
        </div>

        <div className="w95-inset-frame" style={{ padding: 12, marginTop: 6 }}>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <BloodrunIcon size={48}/>
            <div style={{ fontSize: 11, lineHeight: 1.55 }}>
              <div><b>Installed to:</b> <span style={{ fontFamily: '"Courier New", monospace' }}>C:\PROGRAM FILES\CSG\DSC04A\</span></div>
              <div><b>Files copied:</b> 16 of 16</div>
              <div><b>Seal:</b> ▲-04-A-0117 <span style={{ color: '#1e7a1e' }}>(verified)</span></div>
              <div style={{ color: '#a8281c' }}><b>Uninstaller:</b> not installed (prohibited by envelope)</div>
            </div>
          </div>
        </div>

        <div style={{ marginTop: 8, fontSize: 11 }}>
          Click <b>Finish</b> to return to the desktop. Launch <b>BLOODRUN.exe</b> from there when ready.
        </div>

        <div style={{ flex: 1 }}/>
        <Steps step="finish"/>
      </div>
    </WizardFrame>
  );
}

// === FLOW ===================================================================
function InstallerFlow({ onComplete, onCancel, durationMs = 60000 }) {
  const [step, setStep] = useState('welcome');

  // Wrap each step in a keyed div so React remounts on step change,
  // which re-triggers the step-in animation.
  const inner = (() => {
    if (step === 'welcome')  return <div key="welcome"  className="installer-step-body"><WelcomeStep  onNext={() => setStep('license')}  onCancel={onCancel}/></div>;
    if (step === 'license')  return <div key="license"  className="installer-step-body"><LicenseStep  onNext={() => setStep('dest')}     onBack={() => setStep('welcome')} onCancel={onCancel}/></div>;
    if (step === 'dest')     return <div key="dest"     className="installer-step-body"><DestStep     onNext={() => setStep('progress')} onBack={() => setStep('license')} onCancel={onCancel}/></div>;
    if (step === 'progress') return <div key="progress" className="installer-step-body"><ProgressStep onDone={() => setStep('finish')}   onCancel={onCancel} durationMs={durationMs}/></div>;
    if (step === 'finish')   return <div key="finish"   className="installer-step-body"><FinishStep   onLaunch={(l) => onComplete(l)}    onCancel={onCancel}/></div>;
    return null;
  })();

  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: '#008080',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      overflow: 'hidden', zIndex: 80,
    }}>
      {/* Tiled desktop texture */}
      <div style={{
        position: 'absolute', inset: 0,
        backgroundImage:
          'repeating-conic-gradient(rgba(0,0,0,0.03) 0% 25%, rgba(255,255,255,0.03) 0% 50%) 50% / 2px 2px',
        pointerEvents: 'none',
      }}/>
      {/* Wizard pops in on mount */}
      <div className="w95-wizard-enter" style={{ display: 'contents' }}>
        {inner}
      </div>
    </div>
  );
}

export { InstallerFlow };
