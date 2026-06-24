import { useEffect, useRef, useState } from "react";
import { X, Volume2, VolumeX } from "lucide-react";
import videoAsset from "@/assets/reirunner-explainer.mp4.asset.json";

interface ExplainerVideoModalProps {
  onClose: () => void;
}

export function ExplainerVideoModal({ onClose }: ExplainerVideoModalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const toggleMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="REI Runner explainer video"
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 md:top-6 md:right-6 z-10 inline-flex items-center gap-2 px-3 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm transition"
        aria-label="Close explainer video"
      >
        <span className="hidden sm:inline">Skip intro</span>
        <X className="size-4" />
      </button>

      <div
        className="relative w-full max-w-6xl aspect-video mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <video
          ref={videoRef}
          src={videoAsset.url}
          autoPlay
          muted
          playsInline
          controls
          preload="auto"
          onEnded={onClose}
          className="w-full h-full rounded-xl shadow-2xl bg-black"
        />
        <button
          type="button"
          onClick={toggleMute}
          className="absolute bottom-16 right-4 inline-flex items-center gap-2 px-3 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium shadow-glow hover:scale-105 transition"
          aria-label={muted ? "Unmute video" : "Mute video"}
        >
          {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
          {muted ? "Tap for sound" : "Sound on"}
        </button>
      </div>
    </div>
  );
}