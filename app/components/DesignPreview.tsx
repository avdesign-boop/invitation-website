"use client";

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
  return (
    <div
      className="overflow-hidden rounded-2xl border border-stone-300 bg-white shadow-sm"
      style={{ width: FRAME_WIDTH * scale, height: FRAME_HEIGHT * scale }}
    >
      <div
        className={scrollable ? "overflow-y-auto" : "overflow-hidden"}
        style={{
          width: FRAME_WIDTH,
          height: FRAME_HEIGHT,
          transform: `scale(${scale})`,
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
  );
}
