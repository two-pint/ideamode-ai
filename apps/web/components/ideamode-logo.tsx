"use client";

import Image from "next/image";

type IdeaModeLogoProps = {
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
};

export function IdeaModeLogo({
  width = 148,
  height = 23,
  className,
  priority = false,
}: IdeaModeLogoProps) {
  return (
    <>
      <Image
        src="/ideamode_logo_1.svg"
        alt="IdeaMode"
        width={width}
        height={height}
        priority={priority}
        unoptimized
        className={`h-6 w-auto dark:hidden ${className ?? ""}`}
      />
      <Image
        src="/ideamode_logo_light.svg"
        alt="IdeaMode"
        width={width}
        height={height}
        priority={priority}
        unoptimized
        className={`hidden h-6 w-auto dark:block ${className ?? ""}`}
      />
    </>
  );
}
