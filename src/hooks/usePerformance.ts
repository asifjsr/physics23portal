import { useState, useEffect } from 'react';
import { useReducedMotion } from 'framer-motion';

export function usePerformance() {
  const reducedMotion = useReducedMotion();
  const [isMobile, setIsMobile] = useState(false);
  const [isLowEnd, setIsLowEnd] = useState(false);

  useEffect(() => {
    const checkPerformance = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      // Basic check for low-end device: memory < 4GB or hardwareConcurrency < 4
      const memory = (navigator as any).deviceMemory || 8;
      const cores = navigator.hardwareConcurrency || 4;
      setIsLowEnd(memory < 4 || cores < 4 || mobile);
    };
    
    checkPerformance();
    window.addEventListener('resize', checkPerformance);
    return () => window.removeEventListener('resize', checkPerformance);
  }, []);

  return {
    shouldReduceMotion: reducedMotion || isMobile || isLowEnd,
    isMobile,
    isLowEnd,
    backdropBlurClass: (isMobile || isLowEnd) ? "" : "backdrop-blur-xl",
    animationDuration: (isMobile || isLowEnd) ? 0 : 0.3
  };
}
