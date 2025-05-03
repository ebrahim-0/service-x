"use client";

import { useToggleLayoutContext } from "@/context/toggle-menu.context";
import { useEffect, useState } from "react";
import { useWindowSize } from "./get-screen-size.hook";

export const useToggleMenuScreenSize = () => {
  const { toggle, handleToggleMenu, closeMenu, openMenu } =
    useToggleLayoutContext();

  const [isMobile, setIsMobile] = useState<boolean>(false);

  //get current screen size and toggle sidebar menu
  const { width } = useWindowSize();

  useEffect(() => {
    // @ts-expect-error: width might be undefined during initial render
    if (width < 1430) {
      setIsMobile(true);
      closeMenu();
    } else {
      setIsMobile(false);
      openMenu();
    }
  }, [width]); // ✅ Only runs when width changes

  return { toggle, isMobile, handleToggleMenu };
};
