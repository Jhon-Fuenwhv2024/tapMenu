"use client";

import { useEffect, useRef, type CSSProperties, type HTMLAttributes } from "react";

type ModelViewerProps = HTMLAttributes<HTMLElement> & {
  src?: string;
  "ios-src"?: string;
  alt?: string;
  ar?: boolean;
  "ar-modes"?: string;
  "camera-controls"?: boolean;
  "touch-action"?: string;
  poster?: string;
  exposure?: string;
  "shadow-intensity"?: string;
  style?: CSSProperties;
};

const ModelViewerElement = "model-viewer" as unknown as React.ComponentType<ModelViewerProps>;

export function ModelViewer({
  glbUrl,
  usdzUrl,
  poster,
  alt,
}: {
  glbUrl: string;
  usdzUrl?: string | null;
  poster?: string | null;
  alt: string;
}) {
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;
    const script = document.createElement("script");
    script.type = "module";
    script.src =
      "https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js";
    document.head.appendChild(script);
  }, []);

  return (
    <ModelViewerElement
      src={glbUrl}
      ios-src={usdzUrl || undefined}
      alt={alt}
      ar
      ar-modes="webxr scene-viewer quick-look"
      camera-controls
      touch-action="pan-y"
      poster={poster || undefined}
      exposure="1"
      shadow-intensity="1"
      style={{
        width: "100%",
        height: "100%",
        background:
          "radial-gradient(circle at 50% 40%, #e8f5f0 0%, #f7f8f6 70%)",
        borderRadius: "1rem",
      }}
    >
      <button
        slot="ar-button"
        className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-xl bg-[var(--accent)] px-4 py-2 text-sm font-semibold text-white shadow"
      >
        Ver en tu mesa
      </button>
    </ModelViewerElement>
  );
}
