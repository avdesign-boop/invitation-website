"use client";

import { useEffect, useRef, useState } from "react";
import { getDesignComponent } from "@/services/template/designs";
import type { DesignData } from "@/services/template/designs/types";

const FRAME_WIDTH = 390;
const FRAME_HEIGHT = 720;

export function DesignPreview({
  designKey,
  data,
  scale = 1,
  scrollable = false,
}: {
  designKey: string;
  data: DesignData;
  scale?: number;
  scrollable?: boolean;
}) {
  const Design = getDesignComponent(designKey);
  const holder = useRef<HTMLDivElement>(null);
  const [available, setAvailable] = useState<number | null>(null);

  useEffect(() => {
    const node = holder.current;
    if (!node) {
      return;
    }
    const observer = new ResizeObserver(([entry]) => setAvailable(entry.contentRect.width));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const fitted = available === null ? scale : Math.min(scale, available / FRAME_WIDTH);

  return (
    <div ref={holder} className="w-full" style={{ maxWidth: FRAME_WIDTH * scale }}>
      <div
        className="overflow-hidden rounded-2xl border border-stone-300 bg-white shadow-sm"
        style={{ width: FRAME_WIDTH * fitted, height: FRAME_HEIGHT * fitted }}
      >
        <div
          className={scrollable ? "overflow-y-auto" : "overflow-hidden"}
          style={{
            width: FRAME_WIDTH,
            height: FRAME_HEIGHT,
            transform: `scale(${fitted})`,
            transformOrigin: "top left",
          }}
        >
          {Design ? (
            <Design data={data} />
          ) : (
            <p className="p-6 text-sm text-stone-500">No preview for this design.</p>
          )}
        </div>
      </div>
    </div>
  );
}
