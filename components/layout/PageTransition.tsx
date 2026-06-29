"use client";

import { motion } from "motion/react";
import { gentle } from "@/components/motion/springs";

export function PageTransition({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={gentle}
    >
      {children}
    </motion.div>
  );
}
