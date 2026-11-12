"use client";

import { useEffect, useRef, useState } from "react";

/** D major pentatonic over two octaves: any two notes sound well together. */
const NOTES = [587.33, 659.25, 739.99, 880.0, 987.77, 1174.66, 1318.51, 1479.98];
const KEY = "origen-sound";

type Voice = { ctx: AudioContext; out: GainNode };

function makeVoice(): Voice | null {
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  const ctx = new Ctor();
  const out = ctx.createGain();
  out.gain.value = 0.5;
  // a short, quiet echo gives the note some air without a reverb
  const echo = ctx.createDelay(1);
  echo.delayTime.value = 0.27;
  const feedback = ctx.createGain();
  feedback.gain.value = 0.32;
  const wet = ctx.createGain();
  wet.gain.value = 0.35;
  out.connect(ctx.destination);
  out.connect(echo);
  echo.connect(feedback);
  feedback.connect(echo);
  echo.connect(wet);
  wet.connect(ctx.destination);
  return { ctx, out };
}

/** One soft glass-bell note: a sine with a faint, faster-fading overtone. */
function ring({ ctx, out }: Voice, freq: number) {
  const t = ctx.currentTime;
  for (const [ratio, level, length] of [
    [1, 0.05, 1.5],
    [2.01, 0.012, 0.7],
    [3.02, 0.005, 0.35],
  ]) {
    const osc = ctx.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq * ratio;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(level, t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + length);
    osc.connect(gain);
    gain.connect(out);
    osc.start(t);
    osc.stop(t + length + 0.05);
  }
}

/**
 * Plays a quiet chime whenever the mouse comes to rest on a name (any element
 * marked `data-chime`). Each name always rings the same note. Browsers only
 * allow sound after the visitor has clicked or pressed a key on the page, so
 * the first chimes are heard from then on. The button mutes it for good.
 */
export function Chime({ labelOn, labelOff }: { labelOn: string; labelOff: string }) {
  const [enabled, setEnabled] = useState(true);
  const enabledRef = useRef(true);
  const voice = useRef<Voice | null>(null);

  useEffect(() => {
    let saved: string | null = null;
    try {
      saved = localStorage.getItem(KEY);
    } catch {}
    if (saved === "off") {
      enabledRef.current = false;
      // the stored choice is only known in the browser
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setEnabled(false);
    }

    let current: Element | null = null;
    let last = 0;
    const unlock = () => {
      if (!enabledRef.current) return;
      voice.current ??= makeVoice();
      if (voice.current?.ctx.state === "suspended") void voice.current.ctx.resume();
    };
    const over = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") return;
      const el = (e.target as Element | null)?.closest?.("[data-chime]") ?? null;
      if (el === current) return;
      current = el;
      const v = voice.current;
      if (!el || !enabledRef.current || !v || v.ctx.state !== "running") return;
      const now = performance.now();
      if (now - last < 90) return;
      last = now;
      const name = el.getAttribute("data-chime") ?? "";
      let hash = 0;
      for (const ch of name) hash = (hash * 31 + ch.codePointAt(0)!) >>> 0;
      ring(v, NOTES[hash % NOTES.length]);
    };
    document.addEventListener("pointerover", over);
    document.addEventListener("pointerdown", unlock);
    document.addEventListener("keydown", unlock);
    return () => {
      document.removeEventListener("pointerover", over);
      document.removeEventListener("pointerdown", unlock);
      document.removeEventListener("keydown", unlock);
    };
  }, []);

  const toggle = () => {
    const next = !enabled;
    enabledRef.current = next;
    setEnabled(next);
    try {
      localStorage.setItem(KEY, next ? "on" : "off");
    } catch {}
    if (next) {
      voice.current ??= makeVoice();
      const v = voice.current;
      if (v) void v.ctx.resume().then(() => ring(v, NOTES[3]));
    }
  };

  const label = enabled ? labelOn : labelOff;
  return (
    <button type="button" onClick={toggle} aria-pressed={enabled} aria-label={label} title={label} className="icon-button">
      <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5Z" fill="currentColor" />
        {enabled ? (
          <>
            <path d="M15.5 9a4.2 4.2 0 0 1 0 6" />
            <path d="M18.3 6.5a8 8 0 0 1 0 11" />
          </>
        ) : (
          <path d="M16 9.5l5 5M21 9.5l-5 5" />
        )}
      </svg>
    </button>
  );
}
