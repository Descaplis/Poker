import React, { useState, useEffect } from 'react';

export default function Timer({expiresAt}) {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    const calculateTime = () => {
      // Obliczamy różnicę między końcem a chwilą obecną
      const difference = new Date(expiresAt) - new Date();
      const seconds = Math.max(0, Math.floor(difference / 1000));
      setTimeLeft(seconds);
    };

    // Pierwsze wywołanie
    calculateTime();

    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  return (
    <h1 className="text-white text-xl font-black text-center mt-1">{timeLeft}</h1>
  );
};