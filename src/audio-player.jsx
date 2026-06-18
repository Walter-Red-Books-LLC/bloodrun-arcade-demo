// BLOODRUN.exe — context-aware audio player with fade transitions
import { useState, useEffect, useRef, useCallback } from 'react';

// ── Track registry ────────────────────────────────────────────────────────────
export const TRACK_SETS = {
  menu:     [
    { src: 'audio/track1.mp3', name: 'BLOODRUN.EXE_03' },
    { src: 'audio/track2.mp3', name: 'BLOODRUN.EXE_04' },
    { src: 'audio/track3.mp3', name: 'BLOODRUN.EXE_05' },
    { src: 'audio/track4.mp3', name: 'BLOODRUN.EXE_04b' },
  ],
  chapel:   [
    { src: 'audio/bloodrun-chapel-1.mp3', name: 'SECTOR_I.A' },
    { src: 'audio/bloodrun-chapel-2.mp3', name: 'SECTOR_I.B' },
  ],
  sluice:   [
    { src: 'audio/toxic-souls-1.mp3',  name: 'SECTOR_II.A' },
    { src: 'audio/toxic-souls-2.mp3',  name: 'SECTOR_II.B' },
  ],
  vault:    [
    { src: 'audio/vault-rush-1.mp3',  name: 'SECTOR_III.A' },
    { src: 'audio/vault-rush-2.mp3',  name: 'SECTOR_III.B' },
  ],
  sanctum:  [
    { src: 'audio/sanctum-walk-1.mp3', name: 'SECTOR_IV.A' },
    { src: 'audio/sanctum-walk-2.mp3', name: 'SECTOR_IV.B' },
  ],
  boss:     [
    { src: 'audio/boss-blitz-1.mp3', name: 'ENTITY_0xDE4D.I' },
    { src: 'audio/boss-blitz-2.mp3', name: 'ENTITY_0xDE4D.II' },
  ],
  gameover: [
    { src: 'audio/game-over-1.m4a', name: 'FAULT.I' },
    { src: 'audio/game-over-2.m4a', name: 'FAULT.II' },
  ],
  silent: [], // desktop / boot / title — no music
};

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Tween audio.volume from `from` to `to` over `ms`. Returns cancel fn.
function fadeVolume(audio, from, to, ms, onDone) {
  const STEPS = 16;
  const dt    = Math.max(8, ms / STEPS);
  let   i     = 0;
  const id    = setInterval(() => {
    i++;
    audio.volume = Math.max(0, Math.min(1, from + (to - from) * (i / STEPS)));
    if (i >= STEPS) {
      clearInterval(id);
      audio.volume = Math.max(0, Math.min(1, to));
      if (onDone) onDone();
    }
  }, dt);
  return () => clearInterval(id);
}

// ── Hook ──────────────────────────────────────────────────────────────────────
export function useAudioPlayer() {
  const audioRef = useRef(null);
  if (!audioRef.current && typeof Audio !== 'undefined') {
    audioRef.current = new Audio();
    audioRef.current.preload = 'auto';
  }

  const [volume,       setVolumeState] = useState(0.55);
  const [muted,        setMutedState]  = useState(false);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [started,      setStarted]      = useState(false);

  const volumeRef  = useRef(0.55);
  const mutedRef   = useRef(false);
  const ctxRef     = useRef(null);    // null = not yet committed
  const queueRef   = useRef([]);
  const idxRef     = useRef(-1);
  const cancelRef  = useRef(null);
  const startedRef = useRef(false);

  volumeRef.current  = volume;
  mutedRef.current   = muted;
  startedRef.current = started;

  const liveVol = () => (mutedRef.current ? 0 : volumeRef.current);

  // ── Play a single track ───────────────────────────────────────────────────
  const playTrack = useCallback((track, fadeIn = true) => {
    const a = audioRef.current;
    if (!a) return;
    a.src    = track.src;
    a.volume = fadeIn ? 0 : liveVol();
    const p  = a.play();
    if (p?.then) {
      p.then(() => {
        setCurrentTrack(track);
        if (fadeIn) {
          if (cancelRef.current) cancelRef.current();
          cancelRef.current = fadeVolume(a, 0, liveVol(), 500, () => {
            cancelRef.current = null;
          });
        }
      }).catch(() => setCurrentTrack(null));
    }
  }, []);

  // ── Advance the shuffled queue for a context ──────────────────────────────
  const playNext = useCallback((ctx) => {
    const raw = TRACK_SETS[ctx] ?? [];

    // Empty set (silent, missing) — fade out and stop
    if (raw.length === 0) {
      const a = audioRef.current;
      if (a && !a.paused && a.volume > 0) {
        if (cancelRef.current) cancelRef.current();
        cancelRef.current = fadeVolume(a, a.volume, 0, 400, () => {
          cancelRef.current = null;
          a.pause();
          a.currentTime = 0;
          setCurrentTrack(null);
        });
      } else if (a) {
        a.pause();
        a.currentTime = 0;
        setCurrentTrack(null);
      }
      return;
    }

    // Gameover — random one-shot
    if (ctx === 'gameover') {
      playTrack(raw[Math.floor(Math.random() * raw.length)], true);
      return;
    }

    // Shuffle queue, avoid repeating last track
    if (idxRef.current + 1 >= queueRef.current.length) {
      const last     = queueRef.current[queueRef.current.length - 1];
      let   shuffled = shuffle(raw);
      if (last && shuffled[0]?.src === last.src && shuffled.length > 1) {
        [shuffled[0], shuffled[1]] = [shuffled[1], shuffled[0]];
      }
      queueRef.current = shuffled;
      idxRef.current   = -1;
    }
    idxRef.current++;
    playTrack(queueRef.current[idxRef.current], true);
  }, [playTrack]);

  // Auto-advance on track end
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const onEnd = () => {
      if (ctxRef.current && ctxRef.current !== 'gameover') playNext(ctxRef.current);
    };
    a.addEventListener('ended', onEnd);
    return () => a.removeEventListener('ended', onEnd);
  }, [playNext]);

  // ── Switch context (fade-out → silence → fade-in new context) ────────────
  // Three cases handled cleanly:
  //   A) context unchanged + something playing  → no-op
  //   B) nothing playing (paused / vol=0)       → start new context immediately
  //   C) something playing + context changed    → fade out, then start new context
  const setContext = useCallback((newCtx) => {
    const prev         = ctxRef.current;
    const isNewCtx     = newCtx !== prev;
    ctxRef.current     = newCtx;

    if (!startedRef.current) return; // audio not started — just record intent

    const a = audioRef.current;
    if (!a) return;

    const isPlaying = !a.paused && a.volume > 0;

    // Case A — same context, already playing
    if (!isNewCtx && isPlaying) return;

    if (cancelRef.current) { cancelRef.current(); cancelRef.current = null; }

    // Reset queue for the new context so it always starts fresh
    if (isNewCtx) { queueRef.current = []; idxRef.current = -1; }

    // Case B — nothing playing, start immediately
    if (!isPlaying) {
      playNext(newCtx);
      return;
    }

    // Case C — fade current track out, then start new context
    const from     = a.volume;
    cancelRef.current = fadeVolume(a, from, 0, 350, () => {
      cancelRef.current = null;
      a.pause();
      a.currentTime = 0;
      setTimeout(() => playNext(newCtx), 80);
    });
  }, [playNext]);

  // ── Start on first interaction ────────────────────────────────────────────
  // Does NOT call playNext directly — the context effects fire on the
  // subsequent render (audio.started flips to true) and set the right context.
  const start = useCallback(() => {
    if (startedRef.current) return;
    setStarted(true);
  }, []);

  // ── Skip current track ────────────────────────────────────────────────────
  const skip = useCallback(() => {
    if (!startedRef.current) { start(); return; }
    const ctx = ctxRef.current;
    if (!ctx || ctx === 'gameover' || ctx === 'silent') return;
    const a = audioRef.current;
    if (!a) return;
    if (cancelRef.current) { cancelRef.current(); cancelRef.current = null; }
    const from = a.volume;
    cancelRef.current = fadeVolume(a, from, 0, 200, () => {
      cancelRef.current = null;
      a.pause();
      a.currentTime = 0;
      idxRef.current++;
      if (idxRef.current >= queueRef.current.length) {
        queueRef.current = [];
        idxRef.current   = -1;
      }
      playNext(ctx);
    });
  }, [start, playNext]);

  // Volume / mute (don't interrupt mid-fade)
  const setVolume = useCallback((v) => {
    setVolumeState(v);
    if (audioRef.current && !cancelRef.current) {
      audioRef.current.volume = mutedRef.current ? 0 : v;
    }
  }, []);
  const setMuted = useCallback((m) => {
    setMutedState(m);
    if (audioRef.current && !cancelRef.current) {
      audioRef.current.volume = m ? 0 : volumeRef.current;
    }
  }, []);

  return {
    currentTrack, volume, muted,
    setVolume, setMuted,
    start, skip, started,
    setContext,
  };
}
