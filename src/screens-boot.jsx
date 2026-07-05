// BLOODRUN.exe — Boot splash + License notice screens

import { useState, useEffect } from 'react';
import { VHSCorners, GlitchText, useTypewriter, useKey } from './sprites-engine.jsx';

const BOOT_LOG = [
  { t: 0,    msg: 'POST.................OK' },
  { t: 1,    msg: 'CHK MEM 524288.......OK' },
  { t: 2,    msg: 'CHK FPU..............OK' },
  { t: 3,    msg: 'MOUNT /diag/CSG-04A..OK' },
  { t: 4,    msg: 'VERIFY SEAL..........OK' },
  { t: 5,    msg: 'DECRYPT MANIFEST.....OK' },
  { t: 6,    msg: 'LOAD ARTIFACT........' },
  { t: 7,    msg: 'INDEX SAVED RUNS.....3 FOUND, 1 CORRUPT' },
  { t: 8,    msg: 'INIT SUBSYSTEM ./BLOODRUN.exe', warn: false },
  { t: 9,    msg: 'WARNING: ARTIFACT OPERATING OUTSIDE AUTHORIZED ENVELOPE', warn: true },
  { t: 10,   msg: 'PRESS [ENTER] TO ACKNOWLEDGE', ok: true },
];

function BootSplash({ onContinue, refCode }) {
  const [step, setStep] = useState(0);
  const [pct, setPct] = useState(0);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setStep(s => Math.min(BOOT_LOG.length, s + 1));
    }, 320);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    let raf;
    const start = performance.now();
    const tick = (t) => {
      const e = t - start;
      setPct(Math.min(100, (e / 3500) * 100));
      if (e < 3500) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    const id = setTimeout(() => setReady(true), 2000);
    return () => clearTimeout(id);
  }, []);

  useKey((e) => {
    if (!ready) return;
    if (e.key === 'Enter' || e.key === ' ') onContinue();
  }, [onContinue, ready]);

  return (
    <div className="scene" style={{ background: '#000' }}>
      <VHSCorners
        tl={<>L.P <span className="kata">ｽﾀﾝﾊﾞｲ</span></>}
        tr={<>16 BIT <span className="kata">ﾓﾉﾄｰﾝ</span></>}
        bl={<>00:00:00:{String(step).padStart(2, '0')}</>}
        br={<>3.2.1.0.1.2.3</>}
      />

      <div className="boot-glyph">
        <img src="assets/blood-sigil.png" alt="" style={{ width: '100%', height: '100%', objectFit: 'contain' }}/>
      </div>

      <div className="boot-card">
        <div className="head">
          <span>▲ CATALYST SYSTEMS GROUP — DIAGNOSTIC LOADER</span>
          <span className="right">{refCode} · REV. 1996.10.31</span>
        </div>

        <div className="row" style={{ fontSize: 11, marginBottom: 4 }}>
          THIS DISTRIBUTION IS PROVIDED WITHOUT WARRANTY OF ANY KIND.
        </div>
        <div className="row" style={{ fontSize: 11, color: '#5a3a08', marginBottom: 10 }}>
          NO REPRESENTATION IS MADE AS TO THE ORIGIN OR FITNESS OF THE ENCLOSED ARTIFACT.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 3, fontSize: 12, minHeight: 180 }}>
          {BOOT_LOG.slice(0, step).map((line, i) => (
            <div key={i} className={`row ${line.warn ? 'warn' : line.ok ? 'ok' : ''}`}>
              <span style={{ opacity: 0.5, marginRight: 8 }}>0x{(i*0x1c).toString(16).padStart(4,'0').toUpperCase()}</span>
              {line.msg}
              {i === step - 1 && !line.ok && <span className="blink"> ▮</span>}
            </div>
          ))}
        </div>

        <div className="progress">
          <div style={{ width: `${pct}%` }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, letterSpacing: '0.15em', marginTop: 4 }}>
          <span>LOAD {Math.floor(pct)}%</span>
          <span>SECTOR 0x{(step * 0x1c).toString(16).padStart(4,'0').toUpperCase()} / 0x0140</span>
          <span className="phosphor">▮▮▮▯▯▯▯▯</span>
        </div>
      </div>

      <div className="input-strip">
        <span><kbd>↵</kbd> ACKNOWLEDGE</span>
        <span><kbd>ESC</kbd> ABORT (NOT PERMITTED)</span>
      </div>
    </div>
  );
}

function LicenseNotice({ onAccept, onDecline }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setReady(true), 1500);
    return () => clearTimeout(id);
  }, []);
  useKey((e) => {
    if (!ready) return;
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onAccept(); }
    else if (e.key === 'Escape') onDecline();
  }, [onAccept, onDecline, ready]);

  return (
    <div className="csg-notice">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <div style={{ fontFamily: 'IBM Plex Mono', fontSize: 10, letterSpacing: '0.20em', color: '#6B5E4A', marginBottom: 6 }}>
            CSG-LIC-04 &nbsp;·&nbsp; REV. 1991.11.02
          </div>
          <h1>Diagnostic Distribution Notice</h1>
        </div>
        <div className="stamp">FOR DIAGNOSTIC USE</div>
      </div>

      <p style={{ marginTop: 8 }}>
        The artifact referenced herein as <em>BLOODRUN.exe</em> is distributed by Catalyst Systems Group ("the Publisher") under
        CSG-LIC-04 (REV. 1991.11.02). The Publisher is the surface distribution entity of record. CSG does not assert authorship.
      </p>

      <p>
        No representation is made as to the origin, fitness, or behavior of the enclosed artifact. The recipient party
        acknowledges receipt under the terms set forth in § 4.A.ii. Reproduction, redistribution, or attribution to any party
        other than the listed publisher is prohibited.
      </p>

      <p style={{ fontStyle: 'italic' }}>
        If this notice is visible, the artifact is operating outside its authorized envelope. The operator is advised that
        continued execution constitutes acknowledgement of the foregoing terms. Inquiries are not accepted at this address.
      </p>

      <div style={{ height: 1, background: 'var(--doc-rule)', margin: '12px 0' }} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, fontSize: 11, fontFamily: 'IBM Plex Mono', color: '#6B5E4A' }}>
        <div>
          <div><strong style={{ color: '#1A1612' }}>PUBLISHER.</strong> Catalyst Systems Group</div>
          <div><strong style={{ color: '#1A1612' }}>ARTIFACT.</strong> BLOODRUN.exe</div>
          <div><strong style={{ color: '#1A1612' }}>REFERENCE.</strong> CSG-DSC-04A</div>
        </div>
        <div>
          <div><strong style={{ color: '#1A1612' }}>DISPOSITION.</strong> INTERNAL / DIAGNOSTIC</div>
          <div><strong style={{ color: '#1A1612' }}>SEAL.</strong> ▲-04-A-0117</div>
          <div><strong style={{ color: '#1A1612' }}>RECIPIENT.</strong> {`<UNATTRIBUTED>`}</div>
        </div>
      </div>

      <div style={{ flex: 1 }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 16, borderTop: '1px solid var(--doc-rule)' }}>
        <div className="small">
          By proceeding, the licensee waives any and all claims arising from or in connection with this distribution.
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="csg-btn" onClick={onDecline}>DECLINE</button>
          <button className="csg-btn csg-btn--primary" onClick={onAccept}>ACKNOWLEDGE [↵]</button>
        </div>
      </div>
    </div>
  );
}

// === DEMO EULA SPLASH ===============================================
// Real-world legal gate shown FIRST, ahead of the installer. Tightened from
// the main BLOODRUN.exe EULA for this evaluation demo. Acceptance is persisted
// (owned by App) so it shows once. DECLINE quits the app.
const EULA_SECTIONS = [
  ['1. Acceptance of Terms',
    'By selecting “ACCEPT,” or by launching, executing, opening, or otherwise interacting with this software (the “Software”), you (“User”) agree to be bound by this Agreement. If you do not agree, select “DECLINE” and discontinue all use.'],
  ['2. Evaluation License',
    'This is a DEMO / EVALUATION build containing only a limited portion of the full work. Subject to your compliance with this Agreement, the Distributor grants you a limited, revocable, non-exclusive, non-transferable license to use the Software solely for personal, non-commercial, artistic, narrative, and entertainment purposes. No ownership rights are transferred. All rights not expressly granted are reserved.'],
  ['3. Restrictions',
    'You may not: copy, reproduce, distribute, sell, sublicense, lease, or commercially exploit the Software; reverse engineer, decompile, or disassemble it except where such restriction is prohibited by law; remove, alter, or obscure any notices, labels, or attribution marks; or use the Software in any manner that violates applicable law or infringes the rights of any party.'],
  ['4. Fictional / Simulated Work',
    'The Software is a fictional, simulated interactive artwork. All content is presented for artistic and narrative effect and does not represent real-world systems, entities, events, organizations, or procedures. It is not a diagnostic, medical, legal, therapeutic, or evaluative tool and must not be relied upon for any such purpose. The Software is not affiliated with, endorsed by, sponsored by, or connected to Microsoft Corporation or any other company; all trademarks are the property of their respective owners.'],
  ['5. Content Advisory',
    'The Software contains flashing imagery, simulated CRT flicker, strobing effects, sudden audio, and themes of simulated horror. Discontinue use if you experience discomfort. If you have a photosensitive condition, exercise caution before use.'],
  ['6. No Data Collection / Privacy',
    'The Software does not intentionally collect, request, or transmit personally identifiable information. Interactions may be stored locally on your device to support experience continuity (e.g., session flags, progress markers). You are responsible for safeguarding your device and environment.'],
  ['7. Warranty Disclaimer',
    'TO THE MAXIMUM EXTENT PERMITTED BY LAW, THE SOFTWARE IS PROVIDED “AS IS” AND “AS AVAILABLE,” WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, NON-INFRINGEMENT, OR THAT THE SOFTWARE WILL BE ERROR-FREE OR UNINTERRUPTED.'],
  ['8. Limitation of Liability',
    'TO THE MAXIMUM EXTENT PERMITTED BY LAW, IN NO EVENT SHALL THE DISTRIBUTOR OR ANY AFFILIATED PARTY BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF DATA, PROFITS, OR GOODWILL, ARISING OUT OF OR RELATED TO USE OF OR INABILITY TO USE THE SOFTWARE. YOUR SOLE AND EXCLUSIVE REMEDY IS TO DISCONTINUE USE.'],
  ['9. Intellectual Property',
    'All rights, title, and interest in and to the Software — including text, audio, images, layouts, and interactive elements — are owned by the relevant rights holders. The Software is licensed, not sold.'],
  ['10. Termination',
    'This Agreement is effective upon acceptance and continues until terminated. It terminates automatically if you breach any term. Upon termination you must cease all use and destroy all copies in your possession or control.'],
  ['11. Governing Law; Entire Agreement',
    'This Agreement is governed by applicable law without regard to conflict-of-law principles. It constitutes the entire agreement between you and the Distributor regarding the Software and supersedes all prior communications.'],
];

function DemoEula({ onAccept, onDecline }) {
  const [atEnd, setAtEnd] = useState(false);
  const onScroll = (e) => {
    const el = e.currentTarget;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 24) setAtEnd(true);
  };
  useKey((e) => {
    if (e.key === 'Escape') onDecline();
  }, [onDecline]);

  return (
    <div style={{ position: 'absolute', inset: 0, background: '#0a0608', color: '#e8e0d0',
                  display: 'flex', flexDirection: 'column', alignItems: 'center',
                  padding: '24px 20px', overflow: 'hidden', fontFamily: 'IBM Plex Mono, monospace' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10, maxWidth: 720, width: '100%' }}>
        <img src="assets/demo-icon.png" alt="" width={52} height={52}
             style={{ objectFit: 'contain', imageRendering: 'pixelated' }}/>
        <div>
          <div style={{ fontSize: 15, letterSpacing: '0.14em', color: '#fff' }}>BLOODRUN.exe — END USER LICENSE AGREEMENT</div>
          <div style={{ fontSize: 10, letterSpacing: '0.18em', color: '#8a7e6a', marginTop: 3 }}>
            EVALUATION DEMO · CSG-DSC-04A · Published by Quiet Mark Systems, Ltd. · Distributed by Catalyst Systems Group
          </div>
        </div>
      </div>

      <div onScroll={onScroll}
           style={{ flex: 1, maxWidth: 720, width: '100%', overflowY: 'auto',
                    border: '1px solid #3a2e26', background: '#120c0e', padding: '16px 18px' }}>
        <p style={{ fontSize: 11, lineHeight: 1.6, color: '#b8b0a8', marginTop: 0 }}>
          This End User License Agreement (“Agreement”) is entered into between you (“User”) and the distributor of
          the software artifact identified as BLOODRUN.exe (“Software”). Read it carefully before proceeding.
        </p>
        {EULA_SECTIONS.map(([h, body], i) => (
          <div key={i} style={{ marginTop: 14 }}>
            <div style={{ fontSize: 12, color: '#F5A524', letterSpacing: '0.08em', marginBottom: 4 }}>{h}</div>
            <p style={{ fontSize: 11, lineHeight: 1.6, color: '#cfc6ba', margin: 0 }}>{body}</p>
          </div>
        ))}
        <p style={{ fontSize: 10, color: '#6b5e4a', marginTop: 20, letterSpacing: '0.06em' }}>
          © 2026 Quiet Mark Systems, Ltd. All rights reserved. BLOODRUN.exe, Catalyst Systems Group, and CSG-DSC-04A
          are designations used for presentation purposes. This demonstration build is not for resale.
        </p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    maxWidth: 720, width: '100%', marginTop: 14, gap: 16 }}>
        <div style={{ fontSize: 10, color: atEnd ? '#6b5e4a' : '#8a7e6a' }}>
          {atEnd ? 'By selecting ACCEPT you agree to the terms above.' : 'Scroll to review the full agreement.'}
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button className="csg-btn" onClick={onDecline}>DECLINE &amp; QUIT</button>
          <button className="csg-btn csg-btn--primary" onClick={onAccept}>ACCEPT</button>
        </div>
      </div>
    </div>
  );
}

export { BootSplash, LicenseNotice, DemoEula };
