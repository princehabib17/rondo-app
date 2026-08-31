"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

type AmbientVideoProps = {
  src: string;
  poster: string;
  active?: boolean;
  className?: string;
  mediaClassName?: string;
  sizes?: string;
  fetchPriority?: "high" | "low" | "auto";
};

export function AmbientVideo({
  src,
  poster,
  active = true,
  className,
  mediaClassName,
  sizes = "100vw",
  fetchPriority = "auto",
}: AmbientVideoProps) {
  const reduceMotion = useReducedMotion();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [showVideo, setShowVideo] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    if (!active || reduceMotion) {
      video.pause();
      setShowVideo(false);
      return;
    }

    const play = () => {
      video.play().then(() => setShowVideo(true)).catch(() => setShowVideo(false));
    };

    if (video.readyState >= 2) play();
    else {
      video.addEventListener("canplay", play, { once: true });
      video.load();
    }

    return () => {
      video.removeEventListener("canplay", play);
      video.pause();
    };
  }, [active, reduceMotion]);

  return (
    <div className={cn("absolute inset-0 overflow-hidden", className)} aria-hidden>
      <Image
        src={poster}
        alt=""
        fill
        sizes={sizes}
        fetchPriority={fetchPriority}
        className={cn("object-cover object-center", mediaClassName)}
      />
      <video
        ref={videoRef}
        className={cn(
          "absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-500",
          showVideo ? "opacity-100" : "opacity-0",
          mediaClassName
        )}
        poster={poster}
        muted
        loop
        playsInline
        preload={active && !reduceMotion ? "metadata" : "none"}
        tabIndex={-1}
      >
        <source src={src} type="video/mp4" />
      </video>
    </div>
  );
}
