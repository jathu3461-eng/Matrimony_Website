import { motion } from 'framer-motion';

/**
 * Premium glass card. `tilt` enables a subtle 3D tilt on hover.
 * `hover` adds a gentle lift. `as` swaps the rendered element.
 */
export default function Card({
  as: Tag = 'div',
  hover = false,
  tilt = false,
  glow = false,
  padding = true,
  className = '',
  children,
  ...rest
}) {
  const base = `glass-card ${padding ? 'p-6' : ''} ${hover ? 'lift' : ''} ${
    glow ? 'shadow-[var(--shadow-elevated)]' : ''
  } ${className}`;

  if (tilt) {
    return (
      <motion.div
        className={`perspective ${base}`}
        whileHover={{ y: -6 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        {...rest}
      >
        <motion.div
          className="preserve-3d"
          style={{ transformStyle: 'preserve-3d' }}
          whileHover={{ rotateX: 3, rotateY: -3 }}
          transition={{ type: 'spring', stiffness: 200, damping: 18 }}
        >
          {children}
        </motion.div>
      </motion.div>
    );
  }

  return (
    <Tag className={base} {...rest}>
      {children}
    </Tag>
  );
}
