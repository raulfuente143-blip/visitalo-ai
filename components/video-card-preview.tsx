"use client";

import { useEffect, useRef } from "react";

export function VideoCardPreview({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const seekToFrame = () => {
      if (video.duration && video.currentTime < 1) {
        video.currentTime = 1.5;
      }
    };

    video.addEventListener("loadeddata", seekToFrame);
    video.addEventListener("canplay", seekToFrame);
    video.load();

    return () => {
      video.removeEventListener("loadeddata", seekToFrame);
      video.removeEventListener("canplay", seekToFrame);
    };
  }, [src]);

  return (
    <video
      ref={videoRef}
      src={src}
      className="w-full rounded-lg mb-3 aspect-video object-cover bg-slate-100"
      muted
      playsInline
      preload="auto"
      onMouseEnter={() => {
        videoRef.current?.play().catch(() => {});
      }}
      onMouseLeave={() => {
        const v = videoRef.current;
        if (!v) return;
        v.pause();
        v.currentTime = 1.5;
      }}
    />
  );
}
