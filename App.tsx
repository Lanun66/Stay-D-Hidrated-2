import React from 'react';
import { useWaterTracker } from './hooks/useWaterTracker';
import { useNotificationReminder } from './hooks/useNotificationReminder';
import WaterProgress from './components/WaterProgress';
import AddWaterButton from './components/AddWaterButton';
import Confetti from './components/Confetti';
import BellIcon from './components/BellIcon';

const App: React.FC = () => {
  const { 
    currentAmount, 
    targetAmount, 
    progress, 
    isGoalReached, 
    addWater, 
    resetWater 
  } = useWaterTracker(2.5, 0.25);

  const { 
    isReminderEnabled, 
    toggleReminder, 
    permissionStatus 
  } = useNotificationReminder(isGoalReached);

  const getReminderButtonTooltip = () => {
    if (permissionStatus === 'denied') {
        return 'Notifikasi diblokir oleh browser';
    }
    return isReminderEnabled ? 'Matikan pengingat minum' : 'Aktifkan pengingat minum';
  };

  return (
    <main className="relative min-h-screen w-full bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600 text-white flex flex-col items-center justify-center p-4 overflow-hidden">
      {isGoalReached && <Confetti />}
      <div className="text-center mb-8 z-10">
        <h1 className="text-4xl font-bold tracking-tight">Hidrasi Harian</h1>
        <p className="text-lg text-blue-100 mt-2">Tetap sehat, tetap terhidrasi.</p>
      </div>

      <div className="relative mb-10 z-10">
        <WaterProgress progress={progress} currentAmount={currentAmount} />
      </div>

      <div className="text-center mb-10 z-10">
        <p className="text-xl font-medium">
          <span className="font-bold text-2xl">{currentAmount.toFixed(2)}L</span> / {targetAmount}L
        </p>
        {isGoalReached && (
          <p className="mt-2 text-green-300 font-semibold text-lg animate-pulse">
            Selamat! Target harian tercapai!
          </p>
        )}
      </div>
      
      <div className="flex items-center space-x-4 z-10">
        <AddWaterButton onAdd={addWater} isGoalReached={isGoalReached}/>
        
        <div className="flex flex-col space-y-2">
            <button 
              onClick={resetWater}
              className="bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-5 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-blue-500 focus:ring-white shadow-md backdrop-blur-sm"
              aria-label="Atur ulang progres"
            >
              Reset
            </button>
            
            <button
                onClick={toggleReminder}
                disabled={permissionStatus === 'denied'}
                className={`
                    group relative
                    bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-5 rounded-full 
                    transition-all duration-300 
                    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-blue-500 focus:ring-white 
                    shadow-md backdrop-blur-sm
                    disabled:opacity-50 disabled:cursor-not-allowed
                `}
                aria-label={getReminderButtonTooltip()}
                title={getReminderButtonTooltip()}
            >
                <BellIcon className="w-5 h-5" isReminderEnabled={isReminderEnabled} />
            </button>
        </div>
      </div>
      
      <div className="absolute bottom-4 text-center text-blue-200 text-sm z-10">
        <p>Setiap tegukan berarti.</p>
      </div>
    </main>
  );
};

export default App;