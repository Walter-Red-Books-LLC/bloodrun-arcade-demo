// BLOODRUN.exe — App router + Tweaks

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTweaks, TweaksPanel, TweakSection, TweakSlider, TweakToggle, TweakRadio, TweakButton } from './tweaks-panel.jsx';
import { useAudioPlayer } from './audio-player.jsx';
import { VHSOverlay, CSGChrome, useKey } from './sprites-engine.jsx';
import { BootSplash, LicenseNotice, DemoEula } from './screens-boot.jsx';
import { TitleMenu, DeathScreen, ArchiveScreen, DemoWarrantyVoid } from './screens-title.jsx';
import { Game } from './screens-game.jsx';
import { OptionsScreen } from './screens-options.jsx';
import { NoticeViewer, VoidEnding, UninstallFailedModal } from './screens-overlays.jsx';
import { InstallerFlow } from './screens-installer-flow.jsx';
import { DesktopLaunch, Breakout } from './screens-desktop-int.jsx';
import { preloadSprites } from './sprites-data.js';

// Preload PNG sprites at module evaluation time
preloadSprites();

const TWEAK_DEFAULTS = {
  "vhsIntensity": 65,
  "zone": "chapel",
  "csgHeavy": true,
  "crtFlicker": true,
  "volume": 55,
  "muted": false,
};

// ===== localStorage — namespaced to holmn arcade ONLY =====
// These keys MUST NOT overlap with any bloodrun.exe core state.
// Do NOT add keys that write to wr_login_*, wr_profile, wr_tier,
// or any main progression key. This artifact is locally isolated.
const FLAGS = {
  installed:   'wr_holmn_arcade_installed_v1',
  completed:   'wr_holmn_arcade_completed_v1',
  noticeFound: 'wr_holmn_arcade_notice_found_v1',
  acked:       'wr_holmn_arcade_acked_v1',       // boot+license acknowledged once — skip on return
  demoVoided:  'wr_holmn_arcade_demo_voided_v1', // DEMO: warranty wall hit once — cap runs to CHAPEL
  eula:        'wr_holmn_arcade_eula_v1',        // DEMO: EULA accepted once — skip on return
};

// ===== DEMO build config ============================================
// Evaluation slice. The first run grants a taste of SLUICE; clearing it
// trips the WARRANTY VOID wall and permanently caps further runs to CHAPEL.
const DEMO = {
  enabled: true,
  // Zones the player may reach BEFORE the warranty has been voided.
  zonesBeforeVoid: ['chapel', 'sluice'],
  // Zones the player may reach AFTER the warranty has been voided.
  zonesAfterVoid:  ['chapel'],
};
const readFlag = (k) => { try { return localStorage.getItem(k) === '1'; } catch { return false; } };
const writeFlag = (k, v) => { try { v ? localStorage.setItem(k, '1') : localStorage.removeItem(k); } catch {} };
const clearAllFlags = () => Object.values(FLAGS).forEach(k => { try { localStorage.removeItem(k); } catch {} });

function App() {
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  const [installed,  setInstalled]  = useState(() => readFlag(FLAGS.installed));
  const [completed,  setCompleted]  = useState(() => readFlag(FLAGS.completed));
  const [noticeFound,setNoticeFound]= useState(() => readFlag(FLAGS.noticeFound));
  const [acked,      setAcked]      = useState(() => readFlag(FLAGS.acked)); // boot+license already seen
  const [demoVoided, setDemoVoided] = useState(() => readFlag(FLAGS.demoVoided)); // DEMO: warranty wall hit
  const [eulaOk,     setEulaOk]     = useState(() => readFlag(FLAGS.eula)); // DEMO: EULA accepted

  const urlParams = (() => { try { return new URLSearchParams(location.search); } catch { return new URLSearchParams(); } })();
  const initialScreen = useRef(
    urlParams.get('artifact') === '1'
      ? 'title'                      // deep-link bypass
      : 'eula'                       // ← DEMO: legal gate shown EVERY launch (not flag-gated)
  ).current;
  const [screen, setScreen] = useState(initialScreen);

  const [runTime, setRunTime] = useState(0);
  const [zoneKey, setZoneKey] = useState(t.zone || 'chapel');

  const [uninstallReason, setUninstallReason] = useState(null);
  const [breakoutActive, setBreakoutActive] = useState(false);
  const allowCloseRef = useRef(false); // set true before window.close() to bypass beforeunload
  const [crtOff, setCrtOff] = useState(false);       // ESC close animation
  const [bootedDesktop, setBootedDesktop] = useState(false); // true once OS has booted — return trips skip BIOS
  const [autoLaunch, setAutoLaunch] = useState(false); // installer "Run now" → desktop auto-fires
  const [noticeFrom, setNoticeFrom] = useState(null);
  const [loopCount, setLoopCount] = useState(0); // increments each time sanctum→chapel loops
  const [bossMode,  setBossMode]  = useState(false); // true when player is in boss arena

  const breakoutFiredRef = useRef(false);

  // === AUDIO =====================================================
  const audio = useAudioPlayer();
  useEffect(() => { audio.setVolume((t.volume ?? 55) / 100); }, [t.volume]);
  useEffect(() => { audio.setMuted(!!t.muted); }, [t.muted]);

  // Audio context routing.
  // audio.started MUST be in deps: when started flips to true we need to
  // re-run and set the correct context for whatever screen is currently active.
  useEffect(() => {
    if (!audio.started) return;
    if      (screen === 'death')                       audio.setContext('gameover');
    else if (screen === 'game')                        audio.setContext(bossMode ? 'boss' : zoneKey);
    else if (['title', 'archive', 'options'].includes(screen))
                                                       audio.setContext('menu');
    else /* desktop, installer, boot, license, void */ audio.setContext('silent');
  }, [screen, zoneKey, bossMode, audio.started]); // eslint-disable-line

  // Zone change or boss arena transition mid-game
  useEffect(() => {
    if (!audio.started || screen !== 'game') return;
    audio.setContext(bossMode ? 'boss' : zoneKey);
  }, [zoneKey, bossMode, screen, audio.started]); // eslint-disable-line
  useEffect(() => {
    if (audio.started) return;
    const start = () => audio.start();
    window.addEventListener('keydown', start, { once: true });
    window.addEventListener('pointerdown', start, { once: true });
    return () => {
      window.removeEventListener('keydown', start);
      window.removeEventListener('pointerdown', start);
    };
  }, [audio.started]);

  // sync zone tweak ↔ state
  useEffect(() => {
    if (t.zone && t.zone !== zoneKey) setZoneKey(t.zone);
    // eslint-disable-next-line
  }, [t.zone]);

  // === Global keyboard handlers =================================
  useEffect(() => {
    const h = (e) => {
      if (e.key === 'Escape') {
        if (screen === 'boot') setUninstallReason('boot');
        else if (screen === 'game' || screen === 'death') {
          // Cabinet power-down (CRT collapse), then drop back to the OS desktop.
          // bootedDesktop is already true here, so the desktop won't replay BIOS.
          setCrtOff(true);
          setBootedDesktop(true);
          setTimeout(() => { setCrtOff(false); setScreen('desktop'); }, 750);
        }
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [screen]);

  // === beforeunload trap → uninstall modal ========================
  // The artifact resists closing — but once the player has acknowledged the
  // error modal, allowCloseRef is set and the next close attempt goes through.
  // This preserves the fiction while not actually trapping the user.
  useEffect(() => {
    const handler = (e) => {
      if (allowCloseRef.current) return; // player acknowledged — let it close
      if (screen === 'desktop' || screen === 'void' || screen === 'eula') return; // these screens allow close
      setUninstallReason('unload');
      e.preventDefault();
      e.returnValue = '';
      return '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [screen]);

  // === Mid-game breakout scheduler ================================
  useEffect(() => {
    if (screen !== 'game') return;
    if (breakoutFiredRef.current) return;
    const delay = 45000 + Math.random() * 50000;
    const id = setTimeout(() => {
      if (screen === 'game') {
        breakoutFiredRef.current = true;
        setBreakoutActive(true);
      }
    }, delay);
    return () => clearTimeout(id);
    // eslint-disable-next-line
  }, [screen]);

  // === Screen action handlers =====================================
  // Desktop icon launch — only reachable when already installed.
  // If the user has already acknowledged boot+license once, skip straight to title.
  const launchArtifact = useCallback(() => {
    setScreen(acked ? 'title' : 'boot');
  }, [acked]);

  const completeInstall = useCallback((launch) => {
    writeFlag(FLAGS.installed, true);
    writeFlag(FLAGS.acked, false); // force boot+license on next launch after fresh install
    setInstalled(true);
    setAcked(false);
    setAutoLaunch(false);    // DEMO: never auto-fire the arcade — land on the desktop, user clicks
    setScreen('desktop');    // always go through desktop — it's the mandatory gateway
  }, []);

  const handleNoticeFound = useCallback((rt) => {
    // Mark notice as found but DO NOT immediately void.
    // The game continues — void fires as a "system glitch" after a random delay
    // (30–90 s). The player only sees the notice viewer when the glitch triggers.
    if (!noticeFound) {
      writeFlag(FLAGS.noticeFound, true);
      setNoticeFound(true);
    }
    setRunTime(rt || 0);
    // Schedule the void as a delayed glitch — not immediate
    const delay = 30000 + Math.random() * 60000; // 30–90 s
    setTimeout(() => {
      setNoticeFrom('game');
      setScreen('notice');
    }, delay);
  }, [noticeFound]);

  const closeNotice = useCallback(() => {
    if (noticeFrom === 'game') {
      writeFlag(FLAGS.completed, true);
      setCompleted(true);
      setScreen('void');
    } else {
      setScreen('desktop');
    }
    setNoticeFrom(null);
  }, [noticeFrom]);

  const resetCompletion = useCallback(() => {
    writeFlag(FLAGS.completed, false);
    setCompleted(false);
    breakoutFiredRef.current = false;
    setScreen('desktop');
  }, []);

  const resetAll = useCallback(() => {
    clearAllFlags();
    setInstalled(false);
    setCompleted(false);
    setNoticeFound(false);
    setAcked(false);
    setDemoVoided(false);
    setEulaOk(false);
    breakoutFiredRef.current = false;
    setScreen('desktop');
  }, []);

  const onUninstallTriggered = (reason = 'close') => setUninstallReason(reason);

  const refCode = `CSG-DSC-04A`;

  // === RENDER =====================================================
  const insideCrt = !(screen === 'desktop' || screen === 'installer' || screen === 'void' || screen === 'eula');

  return (
    <div className="crt-shell">
      {insideCrt ? (
        <div className={`crt-screen${t.crtFlicker ? ' flicker' : ''}${crtOff ? ' crt-off' : ''}`}>
          {t.csgHeavy && screen !== 'license' && screen !== 'options' && screen !== 'notice' && (
            <CSGChrome refCode={refCode} heavy={true}/>
          )}
          {!t.csgHeavy && <CSGChrome refCode={refCode} heavy={false}/>}

          {screen === 'boot' && (
            <BootSplash refCode={refCode} onContinue={() => setScreen('license')}/>
          )}

          {screen === 'license' && (
            <LicenseNotice
              onAccept={() => {
                writeFlag(FLAGS.acked, true); // never show boot+license again
                setAcked(true);
                setScreen('title');
              }}
              onDecline={() => setScreen('desktop')}
            />
          )}

          {screen === 'title' && (
            <TitleMenu
              onStart={() => setScreen('game')}
              onOptions={() => setScreen('options')}
              onArchive={() => setScreen('archive')}
              onExit={() => {
                // DEMO: EXIT powers the cabinet down (CRT collapse) and returns to
                // the Win95 desktop — no BIOS replay. Shut Down closes the app.
                setCrtOff(true);
                setBootedDesktop(true);
                setTimeout(() => { setCrtOff(false); setScreen('desktop'); }, 750);
              }}
              onSkipTrack={() => audio.skip()}
            />
          )}

          {screen === 'options' && (
            <OptionsScreen
              onBack={() => setScreen('title')}
              tweaks={t}
              setTweak={setTweak}
            />
          )}

          {screen === 'game' && (
            <Game
              zoneKey={zoneKey}
              paused={breakoutActive}
              noticeFound={noticeFound}
              onNoticeFound={handleNoticeFound}
              loopCount={loopCount}
              onDeath={(rt) => { setRunTime(rt); setBossMode(false); setScreen('death'); }}
              onBossArena={(entered) => setBossMode(entered)}
              onZoneChange={(z) => {
                // DEMO gate: the game computes the next sector from the full
                // ZONE_ORDER, but the evaluation slice caps which sectors are
                // licensed. If the requested sector falls outside the cap, the
                // player has cleared the last licensed sector — trip the wall
                // instead of advancing (and never spawn vault/sanctum bosses).
                if (DEMO.enabled) {
                  const allowed = demoVoided ? DEMO.zonesAfterVoid : DEMO.zonesBeforeVoid;
                  if (!allowed.includes(z)) {
                    if (!demoVoided) { writeFlag(FLAGS.demoVoided, true); setDemoVoided(true); }
                    setBossMode(false);
                    setScreen('warranty');
                    return;
                  }
                }
                // Track full-loop completion (sanctum → chapel wraps back around)
                if (zoneKey === 'sanctum' && z === 'chapel') setLoopCount(lc => lc + 1);
                setBossMode(false); // reset boss mode on zone change
                setZoneKey(z);
                setTweak('zone', z);
              }}
            />
          )}

          {screen === 'death' && (
            <DeathScreen runTime={runTime} onContinue={() => setScreen('title')}/>
          )}

          {screen === 'warranty' && (
            <DemoWarrantyVoid
              firstTime={zoneKey === 'sluice'}
              onAcknowledge={() => {
                // Drop back to the licensed entry sector and return to title.
                setZoneKey('chapel');
                setTweak('zone', 'chapel');
                setScreen('title');
              }}
            />
          )}

          {screen === 'archive' && (
            <ArchiveScreen onBack={() => setScreen('title')} noticeFound={noticeFound} onOpenNotice={() => { setNoticeFrom('archive'); setScreen('notice'); }}/>
          )}

          {screen === 'notice' && (
            <NoticeViewer onClose={() => {
              if (noticeFrom === 'archive') { setScreen('archive'); setNoticeFrom(null); }
              else closeNotice();
            }}/>
          )}

          <VHSOverlay intensity={t.vhsIntensity}/>

          {audio.currentTrack && (
            <div style={{
              position: 'absolute', left: 14, bottom: 30, zIndex: 45,
              fontFamily: 'IBM Plex Mono', fontSize: 10, letterSpacing: '0.18em',
              color: '#6BCC4D', textTransform: 'uppercase',
              textShadow: '1px 0 #C8161D', pointerEvents: 'none',
            }}>
              <span className="blink">♪</span> {audio.currentTrack.name}
            </div>
          )}

          {breakoutActive && (
            <Breakout onResolve={() => setBreakoutActive(false)} durationMs={2800}/>
          )}
        </div>
      ) : (
        <div style={{ position: 'fixed', inset: 0, background: '#000', overflow: 'hidden' }}>
          {screen === 'desktop' && (
            <DesktopLaunch
              onLaunch={launchArtifact}
              onNoticeOpen={noticeFound ? () => { setNoticeFrom('desktop'); setScreen('notice'); } : null}
              onUninstallTriggered={() => setUninstallReason('close')}
              onShutdown={() => { allowCloseRef.current = true; window.close(); }} // DEMO: desktop power-down closes the app
              skipStartup={bootedDesktop} // DEMO: returning from the cabinet skips the BIOS boot animation
              hint={false}          // DEMO: no phantom "hint" cursor — user navigates the desktop themselves
              autoLaunch={false}
              onAutoLaunchConsumed={() => setAutoLaunch(false)}
            />
          )}
          {screen === 'eula' && (
            <DemoEula
              onAccept={() => {
                writeFlag(FLAGS.eula, true);
                setEulaOk(true);
                setScreen(installed ? (completed ? 'void' : 'desktop') : 'installer');
              }}
              onDecline={() => { allowCloseRef.current = true; window.close(); }}
            />
          )}
          {screen === 'installer' && (
            <InstallerFlow
              durationMs={6000}
              onCancel={() => setUninstallReason('close')}
              onComplete={(launch) => completeInstall(launch)}
            />
          )}
          {screen === 'void' && (
            <VoidEnding onReset={resetCompletion}/>
          )}
        </div>
      )}

      {uninstallReason && (
        <UninstallFailedModal
          reason={uninstallReason}
          onDismiss={() => {
            setUninstallReason(null);
            // 'boot' = abort the boot sequence, just return to desktop — don't close
            // everything else = user clicked OK after being told it "can't" close.
            // The fiction played out; now actually close.
            if (uninstallReason !== 'boot') {
              allowCloseRef.current = true;
              setTimeout(() => window.close(), 600); // brief beat after modal dismisses
            }
          }}
        />
      )}

      <TweaksPanel title="DIAGNOSTIC TWEAKS">
        <TweakSection title="System">
          <TweakRadio
            label="Screen"
            value={screen}
            onChange={setScreen}
            options={[
              { value: 'eula',      label: 'EULA' },
              { value: 'desktop',   label: 'DESKTOP' },
              { value: 'installer', label: 'INSTALL' },
              { value: 'boot',      label: 'BOOT' },
              { value: 'license',   label: 'LIC' },
              { value: 'title',     label: 'TITLE' },
              { value: 'options',   label: 'OPTS' },
              { value: 'game',      label: 'GAME' },
              { value: 'death',     label: 'DEATH' },
              { value: 'warranty',  label: 'WARR' },
              { value: 'archive',   label: 'ARCH' },
              { value: 'notice',    label: 'NOTICE' },
              { value: 'void',      label: 'VOID' },
            ]}
          />
        </TweakSection>
        <TweakSection title="Persistence">
          <div style={{ fontSize: 10, opacity: 0.7, lineHeight: 1.4, marginBottom: 4 }}>
            Installed: <b>{installed ? 'YES' : 'no'}</b> · Completed: <b>{completed ? 'YES' : 'no'}</b> · Notice: <b>{noticeFound ? 'YES' : 'no'}</b> · DemoVoid: <b>{demoVoided ? 'YES' : 'no'}</b>
          </div>
          <TweakButton
            label="Reset first-run state"
            onClick={resetAll}
          />
          <TweakButton
            label="Trigger breakout now"
            onClick={() => setBreakoutActive(true)}
          />
          <TweakButton
            label="Force completion (→ VOID)"
            onClick={() => { writeFlag(FLAGS.completed, true); setCompleted(true); setScreen('void'); }}
          />
        </TweakSection>
        <TweakSection title="VHS Degradation">
          <TweakSlider
            label="VHS intensity"
            value={t.vhsIntensity}
            onChange={(v) => setTweak('vhsIntensity', v)}
            min={0} max={100} step={5}
          />
          <TweakToggle
            label="CRT flicker"
            value={t.crtFlicker}
            onChange={(v) => setTweak('crtFlicker', v)}
          />
        </TweakSection>
        <TweakSection title="Zone">
          <TweakRadio
            label="Active zone"
            value={zoneKey}
            onChange={(v) => { setZoneKey(v); setTweak('zone', v); }}
            options={[
              { value: 'chapel',  label: 'CHAPEL' },
              { value: 'sluice',  label: 'SLUICE' },
              { value: 'vault',   label: 'VAULT' },
              { value: 'sanctum', label: 'SANCT' },
            ]}
          />
        </TweakSection>
        <TweakSection title="Catalyst Systems wrapper">
          <TweakToggle
            label="Heavy CSG chrome"
            value={t.csgHeavy}
            onChange={(v) => setTweak('csgHeavy', v)}
          />
        </TweakSection>
        <TweakSection title="Audio">
          <TweakSlider
            label="Volume"
            value={t.volume ?? 55}
            onChange={(v) => setTweak('volume', v)}
            min={0} max={100} step={5}
          />
          <TweakToggle
            label="Mute"
            value={!!t.muted}
            onChange={(v) => setTweak('muted', v)}
          />
          <TweakButton
            label="Skip track"
            onClick={() => audio.skip()}
          />
        </TweakSection>
      </TweaksPanel>
    </div>
  );
}

export default App;
