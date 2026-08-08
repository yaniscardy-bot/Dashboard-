import type { Transition, Variants } from "framer-motion";

export const spring = {
  snappy: { type: "spring", stiffness: 500, damping: 30 } satisfies Transition,
  gentle: { type: "spring", stiffness: 300, damping: 35 } satisfies Transition,
  bouncy: { type: "spring", stiffness: 700, damping: 20 } satisfies Transition,
};

export const duration = {
  fast: 0.15,
  base: 0.25,
  slow: 0.4,
};

export const stagger = {
  children: 0.04,
};

export const pageTransitionVariants: Variants = {
  initial: { opacity: 0, y: 6 },
  animate: { opacity: 1, y: 0, transition: { ...spring.gentle } },
  exit: { opacity: 0, y: -6, transition: { duration: duration.fast } },
};

export const listContainerVariants: Variants = {
  animate: { transition: { staggerChildren: stagger.children } },
};

export const listItemVariants: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: spring.gentle },
};
