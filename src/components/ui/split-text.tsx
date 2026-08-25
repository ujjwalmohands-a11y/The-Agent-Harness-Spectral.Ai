"use client";

import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

interface SplitTextProps {
  text: string;
  className?: string;
  delay?: number;
  duration?: number;
  from?: { opacity: number; y: number };
  to?: { opacity: number; y: number };
  textAlign?: 'left' | 'center' | 'right' | 'justify';
}

export const SplitText: React.FC<SplitTextProps> = ({
  text,
  className = '',
  delay = 50,
  duration = 1.25,
  from = { opacity: 0, y: 40 },
  to = { opacity: 1, y: 0 },
  textAlign = 'center',
}) => {
  const ref = useRef<HTMLParagraphElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-10px' });

  const chars = text.split('');

  return (
    <p
      ref={ref}
      className={`split-parent ${className}`}
      style={{ textAlign, display: 'inline-block', overflow: 'hidden' }}
    >
      {chars.map((char, index) => (
        <motion.span
          key={index}
          initial={from}
          animate={isInView ? to : from}
          transition={{
            duration: duration,
            ease: "easeOut",
            delay: (index * delay) / 1000,
          }}
          style={{ display: 'inline-block', willChange: 'transform, opacity' }}
        >
          {char === ' ' ? '\u00A0' : char}
        </motion.span>
      ))}
    </p>
  );
};

export default SplitText;
