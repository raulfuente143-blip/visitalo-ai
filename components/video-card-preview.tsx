"use client";

export function VideoCardPreview({ src }: { src: string }) {
  return (
    <video
      src={src}
      className="w-full rounded-lg mb-3 aspect-video object-cover bg-slate-100"
      muted
      playsInline
      preload="metadata"
      onMouseEnter={(e) => (e.currentTarget as HTMLVideoElement).play()}
      onMouseLeave={(e) => {
        const v = e.currentTarget as HTMLVideoElement;
        v.pause();
        v.currentTime = 0;
      }}
    />
  );
}
