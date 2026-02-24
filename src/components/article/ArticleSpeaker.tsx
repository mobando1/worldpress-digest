"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Volume2, Pause, Square, ChevronDown, Globe, Loader2 } from "lucide-react";

interface ArticleSpeakerProps {
  articleId: string;
  title: string;
  summary: string | null;
  content: string | null;
  language?: string;
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const SPEEDS = [0.75, 1, 1.25, 1.5];
const LANGS = [
  { code: "en", label: "EN" },
  { code: "es", label: "ES" },
];

export function ArticleSpeaker({
  articleId,
  title,
  summary,
  content,
  language = "en",
}: ArticleSpeakerProps) {
  const [ttsAvailable, setTtsAvailable] = useState<boolean | null>(null);
  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [showSpeed, setShowSpeed] = useState(false);
  const [lang, setLang] = useState(
    LANGS.some((l) => l.code === language) ? language : "en"
  );

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const fallbackRef = useRef(false);

  // Check if ElevenLabs TTS is available
  useEffect(() => {
    let cancelled = false;
    async function check() {
      try {
        const res = await fetch(
          `/api/articles/${articleId}/tts?lang=${lang}`,
          { method: "HEAD" }
        );
        if (cancelled) return;
        if (res.status === 503) {
          fallbackRef.current = true;
          setTtsAvailable(
            typeof window !== "undefined" && !!window.speechSynthesis
          );
        } else {
          fallbackRef.current = false;
          setTtsAvailable(true);
        }
      } catch {
        if (cancelled) return;
        fallbackRef.current = true;
        setTtsAvailable(
          typeof window !== "undefined" && !!window.speechSynthesis
        );
      }
    }
    check();
    return () => {
      cancelled = true;
    };
  }, [articleId, lang]);

  // Cleanup
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      window.speechSynthesis?.cancel();
    };
  }, []);

  // Sync playback rate
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = speed;
    }
  }, [speed]);

  // ── Web Speech API fallback ──
  const buildText = useCallback(() => {
    const parts = [title];
    if (summary) parts.push(stripHtml(summary));
    if (content && content !== summary) parts.push(stripHtml(content));
    return parts.join(". ");
  }, [title, summary, content]);

  const playFallback = useCallback(() => {
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
    utterance.lang = lang === "es" ? "es-ES" : "en-US";
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
  }, [paused, speed, lang, buildText]);

  const pauseFallback = useCallback(() => {
    window.speechSynthesis?.pause();
    setPaused(true);
    setPlaying(false);
  }, []);

  const stopFallback = useCallback(() => {
    window.speechSynthesis?.cancel();
    setPlaying(false);
    setPaused(false);
  }, []);

  // ── ElevenLabs audio ──
  const playElevenLabs = useCallback(async () => {
    if (paused && audioRef.current) {
      audioRef.current.play();
      setPaused(false);
      setPlaying(true);
      return;
    }

    setLoading(true);
    try {
      if (!audioRef.current) {
        audioRef.current = new Audio();
      }
      const audio = audioRef.current;
      audio.src = `/api/articles/${articleId}/tts?lang=${lang}`;
      audio.playbackRate = speed;

      audio.onended = () => {
        setPlaying(false);
        setPaused(false);
      };
      audio.onerror = () => {
        setPlaying(false);
        setPaused(false);
        setLoading(false);
      };
      audio.oncanplaythrough = () => {
        setLoading(false);
      };

      await audio.play();
      setPlaying(true);
      setPaused(false);
    } catch {
      setLoading(false);
      setPlaying(false);
    }
  }, [articleId, lang, speed, paused]);

  const pauseElevenLabs = useCallback(() => {
    audioRef.current?.pause();
    setPaused(true);
    setPlaying(false);
  }, []);

  const stopElevenLabs = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setPlaying(false);
    setPaused(false);
  }, []);

  // ── Unified handlers ──
  const isFallback = fallbackRef.current;
  const play = isFallback ? playFallback : playElevenLabs;
  const pause = isFallback ? pauseFallback : pauseElevenLabs;
  const stop = isFallback ? stopFallback : stopElevenLabs;

  const changeSpeed = useCallback(
    (newSpeed: number) => {
      setSpeed(newSpeed);
      setShowSpeed(false);
      if (audioRef.current) {
        audioRef.current.playbackRate = newSpeed;
      }
      if (fallbackRef.current && (playing || paused)) {
        window.speechSynthesis?.cancel();
        setPlaying(false);
        setPaused(false);
      }
    },
    [playing, paused]
  );

  const changeLang = useCallback(
    (newLang: string) => {
      if (newLang === lang) return;
      // Stop current playback
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.src = "";
      }
      window.speechSynthesis?.cancel();
      setPlaying(false);
      setPaused(false);
      setLang(newLang);
    },
    [lang]
  );

  // Don't render while checking
  if (ttsAvailable === null) {
    return (
      <div className="inline-flex items-center gap-1 bg-secondary rounded-lg p-1">
        <div className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    );
  }

  if (!ttsAvailable) return null;

  return (
    <div className="inline-flex items-center gap-1 bg-secondary rounded-lg p-1">
      {/* Language toggle */}
      <div className="flex items-center border-r border-border pr-1 mr-0.5">
        <Globe className="w-3 h-3 text-muted-foreground mr-1" />
        {LANGS.map((l) => (
          <button
            key={l.code}
            onClick={() => changeLang(l.code)}
            className={`px-1.5 py-1 text-xs rounded transition-colors ${
              lang === l.code
                ? "font-bold text-primary bg-accent"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>

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
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent rounded-md transition-colors disabled:opacity-50"
          title={paused ? "Resume" : "Listen"}
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Volume2 className="w-3.5 h-3.5" />
          )}
          <span>{loading ? "Loading..." : paused ? "Resume" : "Listen"}</span>
        </button>
      )}

      {/* Stop */}
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
