import { useState, useEffect } from 'react';
import { useReducedMotion } from 'framer-motion';

export function usePerformance() {
  const reducedMotion = useReducedMotion();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return {
    shouldReduceMotion: reducedMotion || isMobile,
    isMobile,
    // Add logic to disable heavy blurs if needed
    backdropBlurClass: isMobile ? "" : "backdrop-blur-xl"
  };
}
