"use client";

import { useEffect, useMemo, useState } from "react";

interface WindowSize {
  width: number | undefined;
  height: number | undefined;
}

type ScreenSize = "xl" | "lg" | "md" | "sm" | "xs";

interface WindowSizeReturn extends WindowSize {
  screen: ScreenSize;
}

export const useWindowSize = (): WindowSizeReturn => {
  const [windowSize, setWindowSize] = useState<WindowSize>({
    width: undefined,
    height: undefined,
  });

  // Determine initial screen size only once
  const getInitialScreenSize = (width: number): ScreenSize => {
    if (width > 1279) return "xl";
    if (width <= 1279 && width > 1024) return "lg";
    if (width <= 1024 && width >= 768) return "md";
    if (width < 768 && width > 639) return "sm";
    return "xs";
  };

  // const screen = useMemo<ScreenSize>(getInitialScreenSize());
  const screen = useMemo(
    () => getInitialScreenSize(windowSize.width || 0),
    [windowSize.width]
  );

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    handleResize(); // Call once to set initial size
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return { ...windowSize, screen };
};
