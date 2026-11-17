"use client";

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";

type FullscreenVideo = HTMLVideoElement & { webkitEnterFullscreen?: () => void };

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const minutes = Math.floor(seconds / 60);
  const rest = Math.floor(seconds % 60);
  return `${minutes}:${rest.toString().padStart(2, "0")}`;
}

const PLAY_PATH = "M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5Z";

// Reproductor minimalista: sin el menú del navegador, con una línea de progreso fina y dorada.
export function MinimalVideoPlayer({ src }: { src: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<FullscreenVideo>(null);
  const scrubbingRef = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [current, setCurrent] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (!playing) return;
    let frame = 0;
    const tick = () => {
      if (videoRef.current) setCurrent(videoRef.current.currentTime);
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [playing]);

  const updateDuration = () => {
    const video = videoRef.current;
    if (video && Number.isFinite(video.duration)) setDuration(video.duration);
  };

  // Algunos WebM no indican su duración: se averigua saltando al final y volviendo.
  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video) return;
    if (Number.isFinite(video.duration)) {
      setDuration(video.duration);
      return;
    }
    const restore = () => {
      video.removeEventListener("timeupdate", restore);
      video.currentTime = 0;
      updateDuration();
    };
    video.addEventListener("timeupdate", restore);
    video.currentTime = 1e101;
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused || video.ended) void video.play().catch(() => {});
    else video.pause();
  };

  const seekFromPointer = (event: PointerEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video || !duration) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
    video.currentTime = ratio * duration;
    setCurrent(video.currentTime);
  };

  const toggleFullscreen = () => {
    if (document.fullscreenElement) {
      void document.exitFullscreen().catch(() => {});
      return;
    }
    const container = containerRef.current;
    if (container?.requestFullscreen) {
      void container.requestFullscreen().catch(() => {});
      return;
    }
    videoRef.current?.webkitEnterFullscreen?.();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) return;
    const video = videoRef.current;
    if (!video) return;
    if (event.key === " " || event.key === "k") {
      event.preventDefault();
      togglePlay();
    } else if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      const step = event.key === "ArrowRight" ? 2 : -2;
      video.currentTime = Math.min(duration || video.currentTime, Math.max(0, video.currentTime + step));
      setCurrent(video.currentTime);
    } else if (event.key === "f") {
      toggleFullscreen();
    }
  };

  const progress = duration ? Math.min(100, (current / duration) * 100) : 0;
  const iconButton = "rounded-full p-1 text-white/90 transition hover:text-white";

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="group relative overflow-hidden rounded-3xl bg-black outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] [&:fullscreen]:flex [&:fullscreen]:items-center [&:fullscreen]:rounded-none"
    >
      <video
        ref={videoRef}
        src={src}
        playsInline
        preload="metadata"
        className="block aspect-video w-full bg-black object-contain [:fullscreen_&]:h-screen"
        onClick={togglePlay}
        onContextMenu={(event) => event.preventDefault()}
        onLoadedMetadata={handleLoadedMetadata}
        onDurationChange={updateDuration}
        onTimeUpdate={(event) => setCurrent(event.currentTarget.currentTime)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
      />

      {!playing ? (
        <button
          type="button"
          onClick={togglePlay}
          aria-label="Reproducir video"
          className="absolute left-1/2 top-1/2 flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-md transition hover:bg-white/25"
        >
          <svg viewBox="0 0 24 24" className="ml-1 h-7 w-7" fill="currentColor" aria-hidden="true">
            <path d={PLAY_PATH} />
          </svg>
        </button>
      ) : null}

      <div
        className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent px-5 pb-4 pt-10 transition-opacity duration-300 ${
          playing ? "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100" : "opacity-100"
        }`}
      >
        <div
          role="slider"
          aria-label="Progreso del video"
          aria-valuemin={0}
          aria-valuemax={Math.round(duration)}
          aria-valuenow={Math.round(Math.min(current, duration))}
          className="group/bar flex h-5 cursor-pointer touch-none items-center"
          onPointerDown={(event) => {
            scrubbingRef.current = true;
            event.currentTarget.setPointerCapture(event.pointerId);
            seekFromPointer(event);
          }}
          onPointerMove={(event) => {
            if (scrubbingRef.current) seekFromPointer(event);
          }}
          onPointerUp={(event) => {
            scrubbingRef.current = false;
            event.currentTarget.releasePointerCapture(event.pointerId);
          }}
          onPointerCancel={() => {
            scrubbingRef.current = false;
          }}
        >
          <div className="relative h-[3px] w-full rounded-full bg-white/25 transition-[height] group-hover/bar:h-[5px]">
            <div className="absolute inset-y-0 left-0 rounded-full bg-[#D4AF37]" style={{ width: `${progress}%` }} />
          </div>
        </div>

        <div className="mt-1 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <button type="button" onClick={togglePlay} aria-label={playing ? "Pausar" : "Reproducir"} className={iconButton}>
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
                <path d={playing ? "M7 5h3.5v14H7zM13.5 5H17v14h-3.5z" : PLAY_PATH} />
              </svg>
            </button>
            <span className="text-xs tabular-nums text-white/80">
              {formatTime(Math.min(current, duration))} / {formatTime(duration)}
            </span>
          </div>
          <button type="button" onClick={toggleFullscreen} aria-label="Pantalla completa" className={iconButton}>
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
