"use client";

import { initial } from "zustore";
import { initialState } from "./initialState";
import { createDispatch } from "./createDispatch";

const ZustoreStateProvider = initial(initialState, createDispatch);

const StateProvider = ({ children }: { children: React.ReactNode }) => {
  return <ZustoreStateProvider>{children}</ZustoreStateProvider>;
};

export default StateProvider;
