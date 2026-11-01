import React, { useEffect, useRef } from 'react';

export const AmbientEffects: React.FC = () => {
  const spotRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const canHover = window.matchMedia('(hover: hover)').matches;

    if (!canHover || isReducedMotion || !spotRef.current) return;

    const spotEl = spotRef.current;

    const handlePointerMove = (e: PointerEvent) => {
      spotEl.style.opacity = '1';
      spotEl.style.transform = `translate(${e.clientX}px, ${e.clientY}px) translate(-50%, -50%)`;
    };

    window.addEventListener('pointermove', handlePointerMove);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
    };
  }, []);

  return (
    <>
      <div className="orb o1" aria-hidden="true" />
      <div className="orb o2" aria-hidden="true" />
      <div ref={spotRef} className="spot" aria-hidden="true" />
    </>
  );
};
