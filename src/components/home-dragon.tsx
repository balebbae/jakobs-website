import { useEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import sleeping from "@/assets/menu-dragon-sleeping.mp4.asset.json";

export function HomeDragon() {
  const [paused, setPaused] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = video.current;
    const wrapper = container.current;
    if (!element || !wrapper) return;
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let visible = false;
    let disposed = false;
    const sync = () => {
      if (disposed) return;
      if (paused || !visible || document.hidden || motion.matches) element.pause();
      else void element.play().catch(() => {});
    };
    const observer = new IntersectionObserver(entries => {
      visible = entries.some(entry => entry.isIntersecting);
      sync();
    }, { threshold: 0.1 });
    observer.observe(wrapper);
    document.addEventListener("visibilitychange", sync);
    motion.addEventListener("change", sync);
    element.addEventListener("loadeddata", sync);
    return () => {
      disposed = true;
      observer.disconnect();
      document.removeEventListener("visibilitychange", sync);
      motion.removeEventListener("change", sync);
      element.removeEventListener("loadeddata", sync);
      element.pause();
    };
  }, [paused]);
  return <div ref={container} className="home-dragon" onPointerDown={event => event.stopPropagation()} onWheel={event => event.stopPropagation()}>
    <video ref={video} src={sleeping.url} aria-label="Sleeping dragon animation" muted loop playsInline preload="metadata" className="block aspect-video w-full object-contain" />
    <div role="group" aria-label="Dragon animations" className="flex justify-center gap-2">
      <Button variant="outline" size="icon" aria-label={paused ? "Play dragon animation" : "Pause dragon animation"} title={paused ? "Play" : "Pause"} className="glow-button h-7 w-7" onClick={() => setPaused(value => !value)}>{paused ? <Play /> : <Pause />}</Button>
    </div>
  </div>;
}