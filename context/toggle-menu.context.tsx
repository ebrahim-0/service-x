"use client";

import { createContext, useContext, useState } from "react";

interface Props {
  toggle?: boolean;
  closeMenu: () => void;
  openMenu: () => void;
  handleToggleMenu: () => void;
}

const initialState: Props = {
  toggle: false,
  closeMenu: (): void | undefined => {},
  openMenu: (): void | undefined => {},
  handleToggleMenu: (): void | undefined => {},
};
export const ToggleLayoutContext = createContext<Props>(initialState);

export const ToggleLayoutProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [toggle, setToggle] = useState<boolean>(true);

  const handleToggleMenu = () => {
    setToggle((prev) => !prev);
  };

  const closeMenu = () => {
    setToggle(false);
  };

  const openMenu = () => {
    setToggle(true);
  };

  return (
    <ToggleLayoutContext.Provider
      value={{
        toggle,
        closeMenu,
        openMenu,
        handleToggleMenu,
      }}
    >
      {children}
    </ToggleLayoutContext.Provider>
  );
};

export const useToggleLayoutContext = () => useContext(ToggleLayoutContext);
