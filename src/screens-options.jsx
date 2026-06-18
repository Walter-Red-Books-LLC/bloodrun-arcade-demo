// BLOODRUN.exe — OPTIONS screen (in-game Properties → Compatibility panel)

import { useKey } from './sprites-engine.jsx';
import { CSGGlyph, TitlebarMiniIcon, TitlebarButtons, BloodrunIcon } from './surfaces-shared.jsx';

function OptionsScreen({ onBack, tweaks, setTweak }) {
  useKey((e) => {
    if (e.key === 'Escape' || e.key === 'Backspace') onBack();
  }, [onBack]);

  const Tab = ({ children, active, faded }) => (
    <div className={`w95-tab ${active ? 'active' : ''}`} style={{ opacity: faded ? 0.85 : 1 }}>{children}</div>
  );

  const Check = ({ on, onChange, children }) => (
    <label className="w95-check" style={{ display: 'flex', marginBottom: 4 }} onClick={() => onChange(!on)}>
      <span className={`w95-check-box ${on ? 'checked' : ''}`}/>
      {children}
    </label>
  );

  const vhsSteps = [0, 25, 50, 75, 100];
  const currentVhs = vhsSteps.reduce((acc, v) => Math.abs(v - tweaks.vhsIntensity) < Math.abs(acc - tweaks.vhsIntensity) ? v : acc, 0);

  return (
    <div style={{
      position: 'absolute', inset: '24px 0 22px 0',
      background: 'radial-gradient(ellipse at center, #1a1612 0%, #050505 70%, #000 100%)',
      overflow: 'auto',
      display: 'flex', justifyContent: 'center', alignItems: 'flex-start',
      padding: '16px 0',
    }}>
      {/* faint Win95 desktop hint behind */}
      <div style={{ position: 'absolute', inset: 0, background: '#008080', opacity: 0.06, pointerEvents: 'none' }}/>

      <div className="w95" style={{
        width: 460,
        boxShadow: '6px 6px 0 rgba(0,0,0,0.7)',
      }}>
        <div className="w95-window" style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
          <div className="w95-titlebar">
            <TitlebarMiniIcon kind="bloodrun"/>
            <div className="w95-title-text">BLOODRUN.exe Properties</div>
            <div className="w95-titlebar-buttons">
              <div className="w95-tb-btn"><svg width="8" height="8" viewBox="0 0 8 8" shapeRendering="crispEdges"><rect x="1" y="6" width="6" height="2" fill="black"/></svg></div>
              <div className="w95-tb-btn"><svg width="8" height="8" viewBox="0 0 8 8" shapeRendering="crispEdges"><rect x="0" y="0" width="8" height="8" fill="none" stroke="black" strokeWidth="1"/><rect x="0" y="0" width="8" height="2" fill="black"/></svg></div>
              <div className="w95-tb-btn" style={{ marginLeft: 2 }} onClick={onBack}>
                <svg width="8" height="8" viewBox="0 0 8 8" shapeRendering="crispEdges"><path d="M0,0 L8,8 M8,0 L0,8" stroke="black" strokeWidth="1.2"/></svg>
              </div>
            </div>
          </div>

          <div style={{ padding: '8px 8px 6px' }}>
            <div className="w95-tabs">
              <Tab>General</Tab>
              <Tab>Version</Tab>
              <Tab>Security</Tab>
              <Tab active>Compatibility</Tab>
              <Tab faded>Diagnostic</Tab>
            </div>

            <div className="w95-tab-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', paddingBottom: 6, borderBottom: '1px solid #808080', marginBottom: 4 }}>
                <BloodrunIcon size={32}/>
                <div style={{ fontSize: 11, lineHeight: 1.4, flex: 1 }}>
                  <div><b>BLOODRUN.exe</b></div>
                  <div style={{ color: '#404040' }}>C:\PROGRAM FILES\CSG\DSC04A\</div>
                </div>
              </div>

              <div style={{ fontSize: 11, lineHeight: 1.45 }}>
                Adjust how this program operates. Settings persist for the duration of the artifact's seal.
              </div>

              <div className="w95-group" style={{ marginTop: 6 }}>
                <span className="legend">Compatibility envelope</span>
                <label className="w95-check" style={{ marginBottom: 6 }}>
                  <span className="w95-check-box checked"/>
                  Run this program in compatibility mode for:
                </label>
                <div className="w95-select" style={{ marginLeft: 18, minWidth: 290 }}>
                  <span>CSG Diagnostic Envelope — REV. 1996.10.31</span>
                  <span className="w95-select-arrow">▼</span>
                </div>
              </div>

              <div className="w95-group">
                <span className="legend">Active zone</span>
                <div style={{ marginLeft: 0, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {[
                    { v: 'chapel', l: 'I · CHAPEL' },
                    { v: 'sluice', l: 'II · SLUICE' },
                    { v: 'vault',  l: 'III · VAULT' },
                  ].map(opt => (
                    <label key={opt.v} className="w95-check" onClick={() => setTweak('zone', opt.v)}>
                      <span className={`w95-check-box ${tweaks.zone === opt.v ? 'checked' : ''}`} style={{ borderRadius: 6 }}>
                        {tweaks.zone === opt.v ? '●' : ''}
                      </span>
                      {opt.l}
                    </label>
                  ))}
                </div>
              </div>

              <div className="w95-group">
                <span className="legend">Display settings</span>
                <Check on={tweaks.crtFlicker} onChange={(v) => setTweak('crtFlicker', v)}>CRT flicker</Check>
                <Check on={tweaks.csgHeavy}   onChange={(v) => setTweak('csgHeavy', v)}>Heavy CSG chrome (top/bottom bars)</Check>
                <Check on={!tweaks.muted}     onChange={(v) => setTweak('muted', !v)}>Enable sound</Check>

                <div style={{ marginTop: 6, fontSize: 11 }}>VHS degradation:</div>
                <div style={{ marginLeft: 0, display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                  {vhsSteps.map(v => (
                    <div
                      key={v}
                      onClick={() => setTweak('vhsIntensity', v)}
                      className="w95-btn"
                      style={{
                        minWidth: 0, padding: '2px 8px',
                        fontFamily: 'monospace',
                        background: v === currentVhs ? '#000080' : undefined,
                        color: v === currentVhs ? '#fff' : '#000',
                      }}
                    >{v}</div>
                  ))}
                </div>
              </div>

              <div className="w95-inset-frame" style={{ marginTop: 2, padding: 8, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <div className="icon-warn"/>
                <div style={{ fontSize: 11, lineHeight: 1.4, color: '#5a1014' }}>
                  This program is signed by an unverified publisher:&nbsp;
                  <b style={{ color: 'black' }}>Catalyst Systems Group (▲)</b>.
                  <div style={{ color: '#404040', marginTop: 2 }}>Seal ▲-04-A-0117 · changes persist locally only.</div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6, marginTop: 4 }}>
                <div className="w95-btn default" onClick={onBack}>OK</div>
                <div className="w95-btn" onClick={onBack}>Cancel</div>
                <div className="w95-btn disabled" style={{ marginLeft: 6 }}>Apply</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="input-strip">
        <span><kbd>ESC</kbd> CLOSE</span>
      </div>
    </div>
  );
}

export { OptionsScreen };
