import { Variants } from 'motion/react';

export const springConfig = {
  type: 'spring' as const,
  stiffness: 380,
  damping: 28,
};

export const gentleSpring = {
  type: 'spring' as const,
  stiffness: 260,
  damping: 22,
};

export const pageTransitionVariants: Variants = {
  initial: {
    opacity: 0,
    y: 12,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.28,
      ease: [0.16, 1, 0.3, 1],
      when: 'beforeChildren',
      staggerChildren: 0.06,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      duration: 0.18,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

export const cardStaggerVariants: Variants = {
  initial: { opacity: 0, y: 14 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.25,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

export const modalVariants: Variants = {
  initial: { opacity: 0, scale: 0.95, y: 16 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 10,
    transition: { duration: 0.15, ease: [0.16, 1, 0.3, 1] },
  },
};

export const drawerVariants: Variants = {
  initial: { x: '100%', opacity: 0.4 },
  animate: {
    x: 0,
    opacity: 1,
    transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    x: '100%',
    opacity: 0,
    transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] },
  },
};

export const bottomSheetVariants: Variants = {
  initial: { y: '100%', opacity: 0 },
  animate: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    y: '100%',
    opacity: 0,
    transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] },
  },
};
