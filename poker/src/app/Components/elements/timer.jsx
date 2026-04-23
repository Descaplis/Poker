import React, { useState, useEffect } from 'react';

export default function Timer({endTime, isFolded}) {
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!endTime) return;
    const calculateTime = () => {
      const difference = new Date(endTime) - Date.now();
      const seconds = Math.max(0, Math.floor(difference / 1000));
      setTimeLeft(seconds);
    };

    calculateTime();

    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  return (
    <h1 className={`${isFolded ? 'text-gray-600' : 'text-white'} text-xl font-black text-center mt-1 pointer-events-none`}>{timeLeft}</h1>
  );
};