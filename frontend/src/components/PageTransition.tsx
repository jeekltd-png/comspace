'use client';

import { motion, type HTMLMotionProps } from 'framer-motion';
import type { ReactNode } from 'react';

const pageVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: [0.16, 1, 0.3, 1],
    },
  },
  exit: {
    opacity: 0,
    y: -8,
    transition: { duration: 0.2, ease: 'easeIn' },
  },
};

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export function PageTransition({ children, className }: PageTransitionProps) {
  const motionProps = {
    variants: pageVariants,
    initial: 'hidden',
    animate: 'visible',
    exit: 'exit',
    className,
  } as HTMLMotionProps<'div'>;

  return (
    <motion.div {...motionProps}>
      {children}
    </motion.div>
  );
}

// Stagger children animation — useful for lists/grids
const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.1,
    },
  },
};

const staggerItem = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] },
  },
};

interface StaggerGridProps {
  children: ReactNode;
  className?: string;
}

export function StaggerGrid({ children, className }: StaggerGridProps) {
  const motionProps = {
    variants: staggerContainer,
    initial: 'hidden',
    animate: 'visible',
    className,
  } as HTMLMotionProps<'div'>;

  return (
    <motion.div {...motionProps}>
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, className }: StaggerGridProps) {
  const motionProps = {
    variants: staggerItem,
    className,
  } as HTMLMotionProps<'div'>;

  return (
    <motion.div {...motionProps}>
      {children}
    </motion.div>
  );
}
