"use client";

import { useEffect, useState } from "react";

export function KonamiListener() {
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    const konamiSequence = [
      "ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown",
      "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight",
      "b", "a"
    ];
    let inputBuffer: string[] = [];

    const handleKeyDown = (e: KeyboardEvent) => {
      inputBuffer.push(e.key);
      inputBuffer = inputBuffer.slice(-konamiSequence.length);
      
      if (JSON.stringify(inputBuffer) === JSON.stringify(konamiSequence)) {
        triggerSecretCheatMode();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const triggerSecretCheatMode = () => {
    setIsActive(true);
    // Flash the screen and show discount
    setTimeout(() => {
      setIsActive(false);
    }, 5000);
  };

  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-50 pointer-events-none flex items-center justify-center bg-primary/20 animate-pulse">
      <div className="bg-black/90 border border-primary p-8 rounded-lg shadow-[0_0_50px_rgba(57,255,20,1)] text-center animate-in zoom-in duration-300">
        <h2 className="text-4xl font-bold text-primary mb-2">CHEAT ACTIVATED!</h2>
        <p className="text-xl text-white">Use code <span className="font-mono text-primary font-bold">1UP-DISCOUNT</span> for 10% off your next trade.</p>
      </div>
    </div>
  );
}
