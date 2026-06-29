import type { Transition } from "motion/react";

export const snappy: Transition = { type: "spring", stiffness: 500, damping: 35 };
export const bouncy: Transition = { type: "spring", stiffness: 400, damping: 22 };
export const gentle: Transition = { type: "spring", stiffness: 280, damping: 40 };
