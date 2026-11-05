"use client";

/* eslint-disable @next/next/no-img-element */
import { useState, type ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

function FadeImgInner({ className, alt = "", ...rest }: ImgHTMLAttributes<HTMLImageElement>) {
  const [loaded, setLoaded] = useState(false);
  return (
    <img
      alt={alt}
      draggable={false}
      {...rest}
      onLoad={() => setLoaded(true)}
      className={cn(
        "bg-white/[0.04] transition-opacity duration-500 ease-out",
        loaded ? "opacity-100" : "opacity-0",
        className,
      )}
    />
  );
}

export default function FadeImg(props: ImgHTMLAttributes<HTMLImageElement>) {
  const src = typeof props.src === "string" ? props.src : "";
  // Keyed child gets fresh load state without a setState-in-effect cascade.
  return <FadeImgInner key={src} {...props} />;
}
