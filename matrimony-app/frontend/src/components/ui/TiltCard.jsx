import { useRef } from 'react';
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion';

/**
 * 3D tilt card that tracks the pointer and rotates in perspective.
 * `max` is the max rotation in degrees. Disabled on touch / reduced motion.
 */
export default function TiltCard({
  children,
  className = '',
  max = 8,
  scale = 1.02,
  glare = true,
  ...rest
}) {
  const ref = useRef(null);
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);

  const rotateX = useTransform(y, [0, 1], [max, -max]);
  const rotateY = useTransform(x, [0, 1], [-max, max]);
  const glareX = useTransform(x, [0, 1], ['-30%', '130%']);

  const spring = { stiffness: 220, damping: 18, mass: 0.6 };

  const rx = useSpring(rotateX, spring);
  const ry = useSpring(rotateY, spring);

  const handleMove = (e) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    x.set((e.clientX - rect.left) / rect.width);
    y.set((e.clientY - rect.top) / rect.height);
  };

  const reset = () => {
    x.set(0.5);
    y.set(0.5);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={handleMove}
      onMouseLeave={reset}
      style={{ rotateX: rx, rotateY: ry, transformStyle: 'preserve-3d', perspective: 1200 }}
      whileHover={{ scale }}
      className={`relative ${className}`}
      {...rest}
    >
      <div style={{ transformStyle: 'preserve-3d' }}>{children}</div>
      {glare && (
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-[inherit] overflow-hidden"
          style={{ transform: 'translateZ(40px)' }}
        >
          <motion.div
            className="absolute top-0 bottom-0 w-1/3 bg-gradient-to-r from-white/0 via-white/25 to-white/0"
            style={{ left: glareX }}
          />
        </motion.div>
      )}
    </motion.div>
  );
}
