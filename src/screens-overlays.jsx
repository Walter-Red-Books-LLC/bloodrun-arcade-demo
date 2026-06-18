// BLOODRUN.exe — Notice viewer + VOID ending + Uninstall Failed modal

import { useState, useEffect } from 'react';
import { useKey } from './sprites-engine.jsx';
import { CSGGlyph, TitlebarMiniIcon, NoiseLayer } from './surfaces-shared.jsx';

// =====================================================================
// NoticeViewer — fullscreen printed-paper notice with dismiss
// =====================================================================
function NoticeViewer({ onClose }) {
  useKey((e) => {
    if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ' || e.key === 'Backspace') {
      onClose();
    }
  }, [onClose]);

  return (
    <div className="scene" style={{
      background: '#000',
      display: 'grid', placeItems: 'center', padding: 20,
    }}>
      {/* light source rim */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 60% 60% at 50% 50%, rgba(245,165,36,0.05), transparent 70%)',
        pointerEvents: 'none',
      }}/>

      <div className="paper-card" style={{
        width: 540, padding: 0,
        transform: 'rotate(-1.2deg)',
        maxHeight: '92%',
      }}>
        <NoiseLayer opacity={0.10} freq={0.9}/>
        <div className="paper-edge-stain"/>

        <div style={{ padding: '32px 44px 30px', position: 'relative', display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, borderBottom: '1px solid #B0A88E', paddingBottom: 10 }}>
            <CSGGlyph size={44} color="#1A1612" strokeWidth={2.4}/>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 8, letterSpacing: '0.22em', color: '#6B5E4A', marginBottom: 3 }}>
                CSG / CATALYST SYSTEMS GROUP &nbsp;·&nbsp; DISTRIBUTION INSERT
              </div>
              <div style={{ fontFamily: '"IBM Plex Mono", monospace', fontWeight: 700, fontSize: 12, letterSpacing: '0.18em', textTransform: 'uppercase' }}>
                Diagnostic Distribution Notice
              </div>
              <div style={{ fontFamily: '"IBM Plex Mono", monospace', fontSize: 8, letterSpacing: '0.12em', color: '#6B5E4A', marginTop: 2 }}>
                CSG-LIC-04 &nbsp;·&nbsp; REV. 1991.11.02 &nbsp;·&nbsp; INSERT REF. CSG-DSC-04A
              </div>
            </div>
            <div style={{
              border: '2px double #A8281C', color: '#A8281C',
              fontFamily: '"Special Elite", "Courier Prime", monospace',
              textTransform: 'uppercase', fontSize: 9, letterSpacing: '0.18em',
              padding: '4px 8px', transform: 'rotate(-6deg)',
              textAlign: 'center', lineHeight: 1.15,
            }}>
              For Diagnostic<br/>Use Only
            </div>
          </div>

          <p style={{ fontSize: 11, lineHeight: 1.55, fontFamily: '"Special Elite", "Courier Prime", monospace' }}>
            To the recipient party,
          </p>
          <p style={{ fontSize: 11, lineHeight: 1.55, textAlign: 'justify', marginTop: -6 }}>
            Enclosed under this seal is one (1) instance of the artifact referenced as <b><i>BLOODRUN.exe</i></b>, distributed by Catalyst Systems Group under license <b>CSG-LIC-04</b>. <b>CSG does not assert authorship.</b>
          </p>
          <p style={{ fontSize: 11, lineHeight: 1.55, textAlign: 'justify' }}>
            No representation is made as to the origin, fitness, or behavior of the enclosed artifact. Reproduction, redistribution, or attribution to any party other than the listed publisher is prohibited.
          </p>
          <p style={{ fontSize: 11, lineHeight: 1.55, textAlign: 'justify', fontStyle: 'italic' }}>
            If, during operation, the artifact addresses the operator by name, identifies family members, or refers to events not yet observed, the operator is to discontinue use and contact the Publisher in writing within twenty-four (24) hours of first occurrence. Inquiries are not accepted at this address.
          </p>

          <div style={{
            marginTop: 6,
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3,
            fontSize: 10, fontFamily: '"IBM Plex Mono", monospace',
            letterSpacing: '0.04em',
            borderTop: '1px solid #B0A88E', borderBottom: '1px solid #B0A88E',
            padding: '10px 0',
          }}>
            <div><b>PUBLISHER.</b> Catalyst Systems Group</div>
            <div><b>DISPOSITION.</b> INTERNAL / DIAGNOSTIC</div>
            <div><b>ARTIFACT.</b> BLOODRUN.exe</div>
            <div><b>SEAL.</b> ▲-04-A-0117</div>
            <div><b>REFERENCE.</b> CSG-DSC-04A</div>
            <div><b>RECIPIENT.</b> {`<UNATTRIBUTED>`}</div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 4 }}>
            <div style={{ fontSize: 9, fontFamily: '"IBM Plex Mono", monospace', color: '#6B5E4A', maxWidth: 220, lineHeight: 1.4 }}>
              By breaking the enclosed seal, the licensee waives any and all claims arising from this distribution.
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{
                fontFamily: '"Special Elite", monospace', fontSize: 20, color: '#1A1612',
                borderBottom: '1px solid #1A1612', padding: '0 18px 2px',
                fontStyle: 'italic', transform: 'rotate(-2deg)', display: 'inline-block',
              }}>W. Hellier</div>
              <div style={{ fontSize: 8, fontFamily: '"IBM Plex Mono", monospace', color: '#6B5E4A', marginTop: 4, letterSpacing: '0.1em' }}>
                FOR THE PUBLISHER &nbsp;·&nbsp; 1996.10.31
              </div>
            </div>
          </div>

          {/* Diagonal seal stamp */}
          <div style={{
            position: 'absolute', right: 50, bottom: 100,
            border: '2px solid #A8281C', color: '#A8281C',
            fontFamily: '"Special Elite", monospace',
            padding: '3px 10px', fontSize: 11, letterSpacing: '0.18em',
            textTransform: 'uppercase', transform: 'rotate(-12deg)',
            opacity: 0.7, pointerEvents: 'none',
          }}>
            Sealed ▲-04-A-0117
          </div>
        </div>
      </div>

      <div className="input-strip" style={{ zIndex: 5 }}>
        <span><kbd>↵</kbd> RETURN ARTIFACT</span>
        <span><kbd>ESC</kbd> DROP</span>
      </div>

      <div style={{
        position: 'absolute', top: 40, right: 24,
        fontFamily: '"IBM Plex Mono", monospace', fontSize: 10,
        color: '#F5A524', letterSpacing: '0.22em',
        textTransform: 'uppercase', textAlign: 'right',
      }}>
        ▲ ITEM RETRIEVED<br/>
        <span style={{ color: '#6BCC4D' }}>FILED TO ARCHIVE</span>
      </div>
    </div>
  );
}

// =====================================================================
// VOID ending — true ending screen
// =====================================================================
function VoidEnding({ onReset }) {
  const [phase, setPhase] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setPhase(p => p + 1), 1100);
    return () => clearInterval(id);
  }, []);

  useKey((e) => {
    if (e.key === 'Enter' || e.key === ' ' || e.key === 'r' || e.key === 'R') {
      if (phase >= 3) onReset();
    }
  }, [phase, onReset]);

  return (
    <div className="scene" style={{
      background: '#000', overflow: 'hidden', display: 'grid', placeItems: 'center',
    }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 28,
        background: '#000', borderBottom: '1px solid #8A5A12',
        color: '#F5A524', fontSize: 11, letterSpacing: '0.22em',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px', textTransform: 'uppercase', zIndex: 30,
      }}>
        <span>▲ CSG-DSC-04A &nbsp;·&nbsp; ENVELOPE WITHDRAWN</span>
        <span style={{ color: '#E62028' }}>DISPOSITION — SEALED</span>
        <span style={{ opacity: 0.7 }}>REV. 1996.10.31 → 2003.04.17</span>
      </div>

      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 26,
        background: '#000', borderTop: '1px solid #8A5A12',
        color: '#F5A524', fontSize: 10, letterSpacing: '0.22em',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 16px', textTransform: 'uppercase', zIndex: 30,
      }}>
        <span>SEAL ▲-04-A-0117</span>
        <span style={{ color: '#E62028' }}>DO NOT INSTANTIATE</span>
        <span>FORM CSG-WD-12</span>
      </div>

      <div style={{ position: 'absolute', right: 110, top: '40%', transform: 'translateY(-50%)', width: 260, height: 260, opacity: 0.08 }}>
        <CSGGlyph size={260} color="#F5A524" strokeWidth={1.2}/>
      </div>

      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse at 50% 55%, rgba(200,22,29,0.18), transparent 65%)',
        mixBlendMode: 'screen', pointerEvents: 'none',
      }}/>

      <div style={{
        textAlign: 'center', zIndex: 20, position: 'relative',
        transform: 'rotate(-10deg)',
      }}>
        <div className="void-stamp" style={{ fontSize: 140, padding: '8px 32px', letterSpacing: '0.2em' }}>
          VOID
        </div>
        <div style={{
          fontFamily: '"Special Elite", monospace', color: '#E62028',
          fontSize: 18, letterSpacing: '0.32em', marginTop: 10,
          textTransform: 'uppercase',
        }}>
          DECOMMISSIONED &nbsp; 2003·04·17
        </div>
      </div>

      <div style={{
        position: 'absolute', right: 40, bottom: 50, width: 360,
        background: 'rgba(10,6,6,0.85)', border: '1px solid #7A1014',
        padding: '14px 16px', color: '#E8E0D0',
        fontFamily: '"IBM Plex Mono", monospace', fontSize: 11, lineHeight: 1.55,
        opacity: phase >= 1 ? 1 : 0, transition: 'opacity 600ms ease-out',
      }}>
        <div style={{ color: '#E62028', fontWeight: 700, letterSpacing: '0.15em', fontSize: 11, marginBottom: 6 }}>
          ▲ WITHDRAWAL OF SERVICE — CSG-WD-12
        </div>
        <div style={{ marginBottom: 6 }}>
          Effective 2003·04·17, the Publisher withdraws all support, distribution rights, and operating envelopes associated with reference <b>CSG-DSC-04A</b>.
        </div>
        <div style={{ color: '#F5A524', fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase' }}>
          Inquiries are not accepted at this address.
        </div>
      </div>

      <div style={{
        position: 'absolute', top: 60, left: 64,
        fontFamily: '"Special Elite", monospace', color: '#A8281C',
        fontSize: 18, transform: 'rotate(-3deg)',
        opacity: phase >= 2 ? 0.9 : 0, transition: 'opacity 600ms ease-out',
      }}>
        <div style={{ borderBottom: '1px solid #A8281C', paddingBottom: 2 }}>Disposition: SEALED</div>
        <div style={{ marginTop: 8, fontSize: 14, color: '#7A1014' }}>do not re-instance</div>
      </div>

      {phase >= 3 && (
        <div style={{
          position: 'absolute', left: '50%', bottom: 56,
          transform: 'translateX(-50%)',
          fontFamily: '"IBM Plex Mono", monospace',
          fontSize: 11, color: '#807A75', letterSpacing: '0.2em',
          textTransform: 'uppercase', textAlign: 'center',
          zIndex: 35,
          animation: 'reset-in 600ms ease-out',
        }}>
          <div>SEAL HAS BEEN AFFIXED.</div>
          <div style={{ marginTop: 6, color: '#C8161D' }}>
            PRESS <kbd style={{ border: '1px solid #C8161D', padding: '2px 6px', color: '#C8161D' }}>R</kbd> TO RE-INSTANCE
          </div>
        </div>
      )}

      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 40,
        backgroundImage: 'repeating-linear-gradient(to bottom, rgba(0,0,0,0) 0 2px, rgba(0,0,0,0.5) 3px, rgba(0,0,0,0) 4px)',
        mixBlendMode: 'multiply', opacity: 0.55,
      }}/>
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 41,
        background: 'radial-gradient(ellipse 120% 100% at 50% 50%, transparent 50%, rgba(0,0,0,0.7) 100%)',
      }}/>
    </div>
  );
}

// =====================================================================
// UninstallFailedModal — Win95 modal overlay
// =====================================================================
function UninstallFailedModal({ onDismiss, reason = 'exit' }) {
  const [showDetails, setShowDetails] = useState(false);

  useKey((e) => {
    if (e.key === 'Enter' || e.key === 'Escape') onDismiss();
  }, [onDismiss]);

  const reasons = {
    exit:    { title: 'BLOODRUN.exe cannot be exited.',  body: 'The artifact cannot be terminated by the operator. Sealed by publisher (Catalyst Systems Group).' },
    boot:    { title: 'Setup cannot be aborted.',         body: 'The diagnostic loader is mid-handshake. Abort is not permitted by the operating envelope.' },
    close:   { title: 'Window cannot be closed.',         body: "The active window is bound to the artifact's seal. Closure must be authorized in writing." },
    unload:  { title: 'BLOODRUN.exe is still running.',   body: 'The tab cannot be closed while the artifact is unsealed. End execution from inside the program first.' },
  };
  const r = reasons[reason] || reasons.exit;

  return (
    <div style={{
      position: 'absolute', inset: 0, zIndex: 200,
      display: 'grid', placeItems: 'center',
      animation: 'modal-bg-in 180ms ease-out',
    }}>
      <div className="w95" style={{
        width: 440,
        boxShadow: '6px 6px 0 rgba(0,0,0,0.7)',
        animation: 'modal-shake 300ms ease-out',
      }}>
        <div className="w95-window" style={{ width: '100%' }}>
          <div className="w95-titlebar">
            <TitlebarMiniIcon kind="doc"/>
            <div className="w95-title-text">Add/Remove Programs</div>
            <div className="w95-titlebar-buttons">
              <div className="w95-tb-btn"><svg width="8" height="8" viewBox="0 0 8 8" shapeRendering="crispEdges"><rect x="1" y="6" width="6" height="2" fill="black"/></svg></div>
              <div className="w95-tb-btn"><svg width="8" height="8" viewBox="0 0 8 8" shapeRendering="crispEdges"><rect x="0" y="0" width="8" height="8" fill="none" stroke="black" strokeWidth="1"/><rect x="0" y="0" width="8" height="2" fill="black"/></svg></div>
              <div className="w95-tb-btn" style={{ marginLeft: 2 }} onClick={onDismiss}>
                <svg width="8" height="8" viewBox="0 0 8 8" shapeRendering="crispEdges"><path d="M0,0 L8,8 M8,0 L0,8" stroke="black" strokeWidth="1.2"/></svg>
              </div>
            </div>
          </div>

          <div style={{ padding: '20px 18px 14px', display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <div className="icon-stop">✕</div>
            <div style={{ flex: 1, fontSize: 11, lineHeight: 1.55 }}>
              <div style={{ fontWeight: 700, marginBottom: 8 }}>{r.title}</div>
              <div>{r.body}</div>
              <div style={{ marginTop: 8, color: '#7a1014' }}>
                Error 0x80004005 — operation not permitted by distribution envelope.
              </div>
              <div style={{ marginTop: 4, fontSize: 10, color: '#404040' }}>
                Reference: CSG-DSC-04A · Seal ▲-04-A-0117
              </div>
            </div>
          </div>

          <div style={{ padding: '0 10px 10px', display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
            <div className="w95-btn default" onClick={onDismiss}>OK</div>
            <div className="w95-btn" onClick={() => setShowDetails(v => !v)}>
              {showDetails ? 'Details <<' : 'Details >>'}
            </div>
          </div>

          {/* Expandable details panel */}
          {showDetails && (
            <div style={{ borderTop: '1px solid #808080', margin: '0 6px 8px',
                          padding: '8px 6px', background: '#fff', maxHeight: 160, overflowY: 'auto' }}>
              <div style={{ fontFamily: '"Courier New", monospace', fontSize: 10, lineHeight: 1.45, color: '#000' }}>
                {[
                  `[${new Date().toLocaleTimeString()}] UNINST.EXE launched — PID 0x04A0`,
                  `Querying registry key: HKLM\\SOFTWARE\\CSG\\DSC04A\\UninstallKey`,
                  `Registry query result: ERROR_ACCESS_DENIED (0x80004005)`,
                  `Attempting fallback: file system delete C:\\PROGRAM FILES\\CSG\\DSC04A\\`,
                  `File delete result: DENIED — envelope seal active (▲-04-A-0117)`,
                  `Contacting CSG distribution node at 192.168.▲.∞…`,
                  `Network response: CONNECTION_REFUSED — node decommissioned 2003.04.17`,
                  `Writing removal request to C:\\WINDOWS\\TEMP\\csg_removal_req.tmp…`,
                  `Write result: DENIED — file marked SYSTEM + HIDDEN + SEALED`,
                  `Error 0x80004005 — UninstallKey withheld by publisher at time of setup.`,
                  `See CSG-LIC-04 § 5.1: removal is explicitly prohibited.`,
                  `This error has been logged to C:\\WINDOWS\\csg_diagnostic.log.`,
                ].map((line, i) => (
                  <div key={i} style={{ color: line.includes('DENIED') || line.includes('ERROR') || line.includes('refused') ? '#a8281c' : '#000' }}>
                    {line}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export { NoticeViewer, VoidEnding, UninstallFailedModal };
