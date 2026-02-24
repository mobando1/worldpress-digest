"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Volume2, Pause, Square, ChevronDown } from "lucide-react";

interface ArticleSpeakerProps {
  title: string;
  summary: string | null;
  content: string | null;
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
}

const SPEEDS = [0.75, 1, 1.25, 1.5];

export function ArticleSpeaker({ title, summary, content }: ArticleSpeakerProps) {
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [showSpeed, setShowSpeed] = useState(false);
  const [supported, setSupported] = useState(true);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      setSupported(false);
    }
    return () => {
      window.speechSynthesis?.cancel();
    };
  }, []);

  const buildText = useCallback(() => {
    const parts = [title];
    if (summary) parts.push(stripHtml(summary));
    if (content && content !== summary) parts.push(stripHtml(content));
    return parts.join(". ");
  }, [title, summary, content]);

  const play = useCallback(() => {
    if (!window.speechSynthesis) return;

    if (paused) {
      window.speechSynthesis.resume();
      setPaused(false);
      setPlaying(true);
      return;
    }

    window.speechSynthesis.cancel();

    const text = buildText();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = speed;
    utterance.onend = () => {
      setPlaying(false);
      setPaused(false);
    };
    utterance.onerror = () => {
      setPlaying(false);
      setPaused(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setPlaying(true);
    setPaused(false);
  }, [paused, speed, buildText]);

  const pause = useCallback(() => {
    window.speechSynthesis?.pause();
    setPaused(true);
    setPlaying(false);
  }, []);

  const stop = useCallback(() => {
    window.speechSynthesis?.cancel();
    setPlaying(false);
    setPaused(false);
  }, []);

  const changeSpeed = useCallback((newSpeed: number) => {
    setSpeed(newSpeed);
    setShowSpeed(false);
    if (playing || paused) {
      window.speechSynthesis?.cancel();
      setPlaying(false);
      setPaused(false);
    }
  }, [playing, paused]);

  if (!supported) return null;

  return (
    <div className="inline-flex items-center gap-1 bg-secondary rounded-lg p-1">
      {/* Play / Pause */}
      {playing ? (
        <button
          onClick={pause}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent rounded-md transition-colors"
          title="Pause"
        >
          <Pause className="w-3.5 h-3.5" />
          <span>Pause</span>
        </button>
      ) : (
        <button
          onClick={play}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent rounded-md transition-colors"
          title={paused ? "Resume" : "Listen"}
        >
          <Volume2 className="w-3.5 h-3.5" />
          <span>{paused ? "Resume" : "Listen"}</span>
        </button>
      )}

      {/* Stop (only when playing/paused) */}
      {(playing || paused) && (
        <button
          onClick={stop}
          className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
          title="Stop"
        >
          <Square className="w-3 h-3" />
        </button>
      )}

      {/* Speed control */}
      <div className="relative">
        <button
          onClick={() => setShowSpeed(!showSpeed)}
          className="flex items-center gap-0.5 px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-accent rounded-md transition-colors"
        >
          {speed}x
          <ChevronDown className="w-3 h-3" />
        </button>
        {showSpeed && (
          <div className="absolute bottom-full right-0 mb-1 bg-card border border-border rounded-lg shadow-lg overflow-hidden z-10">
            {SPEEDS.map((s) => (
              <button
                key={s}
                onClick={() => changeSpeed(s)}
                className={`block w-full px-4 py-1.5 text-xs text-left hover:bg-accent transition-colors ${
                  s === speed ? "font-bold text-primary" : "text-foreground"
                }`}
              >
                {s}x
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
