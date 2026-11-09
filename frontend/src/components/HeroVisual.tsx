import { useEffect, useRef, useState } from "react";
import heroVideo from "../../asset/economy-loop.mp4";
import heroPoster from "../../asset/hero-economy.jpg";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  return (
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false
  );
}

export function HeroVisual() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const userPaused = useRef(prefersReducedMotion());
  const [paused, setPaused] = useState(prefersReducedMotion);

  useEffect(() => {
    const video = videoRef.current;
    const node = containerRef.current;
    if (!video || !node || typeof IntersectionObserver === "undefined") {
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          if (!userPaused.current) {
            void video.play().catch(() => undefined);
          }
        } else {
          video.pause();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) {
      return;
    }
    const onPlay = () => setPaused(false);
    const onPause = () => setPaused(true);
    video.addEventListener("play", onPlay);
    video.addEventListener("pause", onPause);
    return () => {
      video.removeEventListener("play", onPlay);
      video.removeEventListener("pause", onPause);
    };
  }, []);

  useEffect(() => {
    const onVisibilityChange = () => {
      const video = videoRef.current;
      if (!video) {
        return;
      }
      if (document.visibilityState === "visible") {
        if (!userPaused.current) {
          void video.play().catch(() => undefined);
        }
      } else {
        video.pause();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  function toggle() {
    const video = videoRef.current;
    if (!video) {
      return;
    }
    if (video.paused) {
      userPaused.current = false;
      void video.play().catch(() => undefined);
      setPaused(false);
    } else {
      userPaused.current = true;
      video.pause();
      setPaused(true);
    }
  }

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden rounded-[1.75rem] border border-line bg-brand-50"
    >
      <video
        ref={videoRef}
        className="aspect-[4/3] w-full object-cover"
        src={heroVideo}
        poster={heroPoster}
        autoPlay={!prefersReducedMotion()}
        loop
        muted
        playsInline
        preload="metadata"
        disablePictureInPicture
        aria-hidden="true"
        tabIndex={-1}
      />
      <button
        type="button"
        onClick={toggle}
        aria-pressed={paused}
        className="absolute bottom-3 right-3 rounded-lg border border-line bg-surface/85 px-3 py-1.5 text-xs font-semibold text-ink backdrop-blur transition-colors hover:border-brand-500"
      >
        {paused ? "Putar animasi" : "Jeda animasi"}
      </button>
    </div>
  );
}
