import type { Variants, Transition } from "framer-motion";

/* ==============================================================
   GUILDOS FRAMER MOTION ANIMATIONS
   Reusable animation variants for the entire app
   ============================================================== */

// ---- Shared Transitions ----

const springBouncy: Transition = {
  type: "spring",
  stiffness: 300,
  damping: 25,
  mass: 0.8,
};

const springSnappy: Transition = {
  type: "spring",
  stiffness: 500,
  damping: 35,
  mass: 0.5,
};

const springGentle: Transition = {
  type: "spring",
  stiffness: 200,
  damping: 20,
  mass: 1,
};

const easeOut: Transition = {
  ease: [0.16, 1, 0.3, 1],
  duration: 0.35,
};

// ---- 1. Page Transition (Staggered Enter) ----

export const pageTransition: Variants = {
  initial: {
    opacity: 0,
    y: 12,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      ...easeOut,
      when: "beforeChildren",
      staggerChildren: 0.06,
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: {
      ...easeOut,
      duration: 0.2,
    },
  },
};

// ---- 2. Card Hover (3D Tilt Spring) ----

export const cardHover = {
  rest: {
    scale: 1,
    rotateX: 0,
    rotateY: 0,
    boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
    transition: springGentle,
  },
  hover: {
    scale: 1.02,
    rotateX: 4,
    rotateY: -3,
    boxShadow: "0 12px 32px rgba(0,0,0,0.35)",
    transition: springBouncy,
  },
  tap: {
    scale: 0.98,
    transition: springSnappy,
  },
};

// ---- 3. List Item Stagger (Children) ----

export const listItemStagger: Variants = {
  hidden: {
    opacity: 0,
    y: 12,
    scale: 0.98,
  },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      ...springBouncy,
      delay: i * 0.05,
    },
  }),
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.15 },
  },
};

export const listContainer: Variants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
};

// ---- 4. Fade + Scale (Modals, Overlays) ----

export const fadeScale: Variants = {
  initial: {
    opacity: 0,
    scale: 0.92,
    y: 20,
  },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      ...springBouncy,
      duration: 0.4,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    y: -10,
    transition: {
      ease: "easeIn",
      duration: 0.15,
    },
  },
};

export const backdropFade: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

// ---- 5. Slide In (From Direction) ----

type Direction = "left" | "right" | "top" | "bottom";

export const slideIn = (direction: Direction = "left"): Variants => {
  const offsetMap: Record<Direction, { x?: number; y?: number }> = {
    left: { x: -40 },
    right: { x: 40 },
    top: { y: -40 },
    bottom: { y: 40 },
  };

  const offset = offsetMap[direction];

  return {
    initial: {
      opacity: 0,
      ...offset,
    },
    animate: {
      opacity: 1,
      x: 0,
      y: 0,
      transition: springBouncy,
    },
    exit: {
      opacity: 0,
      ...offset,
      transition: { ease: "easeIn", duration: 0.15 },
    },
  };
};

// ---- 6. Pulse Glow (Legendary Items) ----

export const pulseGlow: Variants = {
  rest: {
    boxShadow:
      "0 0 5px oklch(0.65 0.25 300 / 20%), 0 0 15px oklch(0.65 0.25 300 / 10%)",
  },
  glow: {
    boxShadow: [
      "0 0 5px oklch(0.65 0.25 300 / 20%), 0 0 15px oklch(0.65 0.25 300 / 10%)",
      "0 0 12px oklch(0.65 0.25 300 / 45%), 0 0 35px oklch(0.65 0.25 300 / 20%), 0 0 60px oklch(0.65 0.25 300 / 8%)",
      "0 0 5px oklch(0.65 0.25 300 / 20%), 0 0 15px oklch(0.65 0.25 300 / 10%)",
    ],
    transition: {
      duration: 2.5,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};

// ---- 7. Number Counter (Scroll-triggered) ----

export const numberCounter = {
  initial: { opacity: 0, y: 20 },
  inView: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

// ---- 8. Quick Action Button (Float) ----

export const floatButton: Variants = {
  rest: { y: 0, boxShadow: "0 4px 12px rgba(0,0,0,0.3)" },
  hover: {
    y: -2,
    boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
    transition: springBouncy,
  },
  tap: { scale: 0.92, transition: springSnappy },
};

// ---- 9. Notification Badge ----

export const badgePop: Variants = {
  initial: { scale: 0 },
  animate: {
    scale: 1,
    transition: { type: "spring", stiffness: 500, damping: 15, mass: 0.3 },
  },
  exit: {
    scale: 0,
    transition: { duration: 0.15 },
  },
};

// ---- 10. Sidebar Item ----

export const sidebarItem: Variants = {
  initial: { opacity: 0, x: -16 },
  animate: {
    opacity: 1,
    x: 0,
    transition: springBouncy,
  },
};

// ---- 11. Tooltip ----

export const tooltip: Variants = {
  initial: { opacity: 0, y: 4, scale: 0.95 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: springSnappy,
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.1 },
  },
};
