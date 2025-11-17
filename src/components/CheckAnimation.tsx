'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';

export default function CheckAnimation() {
  return (
    <motion.div
      initial={{ scale: 0 }}
      animate={{ scale: [0, 1.2, 1] }}
      transition={{
        duration: 0.5,
        ease: [0.34, 1.56, 0.64, 1], // Spring easing
      }}
      className="relative"
    >
      <Check className="w-6 h-6 text-white" />

      {/* Ripple effect */}
      <motion.div
        initial={{ scale: 1, opacity: 1 }}
        animate={{ scale: 2, opacity: 0 }}
        transition={{ duration: 0.6 }}
        className="absolute inset-0 bg-emerald-500 rounded-full"
      />
    </motion.div>
  );
}

// Success pulse for completed sets
export function SuccessPulse({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ scale: 1 }}
      animate={{ scale: [1, 1.05, 1] }}
      transition={{
        duration: 0.3,
        ease: "easeInOut",
      }}
    >
      {children}
    </motion.div>
  );
}
