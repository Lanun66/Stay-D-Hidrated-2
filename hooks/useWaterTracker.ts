
import { useState, useMemo, useCallback, useEffect } from 'react';

export const useWaterTracker = (initialTarget: number, incrementAmount: number) => {
  const [targetAmount] = useState<number>(initialTarget);
  const [currentAmount, setCurrentAmount] = useState<number>(() => {
    const savedAmount = localStorage.getItem('waterTrackerCurrentAmount');
    return savedAmount ? parseFloat(savedAmount) : 0;
  });

  useEffect(() => {
    localStorage.setItem('waterTrackerCurrentAmount', currentAmount.toString());
  }, [currentAmount]);

  const addWater = useCallback(() => {
    setCurrentAmount(prev => prev + incrementAmount);
  }, [incrementAmount]);
  
  const resetWater = useCallback(() => {
      setCurrentAmount(0);
  }, []);

  const progress = useMemo(() => {
    if (targetAmount === 0) return 0;
    return Math.min((currentAmount / targetAmount) * 100, 100);
  }, [currentAmount, targetAmount]);

  const isGoalReached = useMemo(() => currentAmount >= targetAmount, [currentAmount, targetAmount]);

  return { currentAmount, targetAmount, progress, isGoalReached, addWater, resetWater };
};
