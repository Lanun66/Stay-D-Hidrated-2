import React from 'react';
import { useFirestoreWaterTracker } from './hooks/useFirestoreWaterTracker';
import WaterProgress from './components/WaterProgress';
import AddWaterButton from './components/AddWaterButton';
import Confetti from './components/Confetti';
import UserLinker from './components/UserLinker';
import PartnerProgress from './components/PartnerProgress';

const App: React.FC = () => {
  const {
    currentUserData,
    partnerUserData,
    userId,
    isGoalReached,
    isLoading,
    addWater,
    resetWater,
    linkPartner,
    unlinkPartner,
    partnerId,
  } = useFirestoreWaterTracker();

  if (isLoading) {
    return (
      <div className="min-h-screen w-full bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600 text-white flex flex-col items-center justify-center">
        <h1 className="text-3xl font-bold">Memuat Data...</h1>
      </div>
    );
  }

  const { progressPercentage, currentAmount, targetAmount } = currentUserData;

  return (
    <main className="relative min-h-screen w-full bg-gradient-to-br from-sky-400 via-blue-500 to-indigo-600 text-white flex flex-col items-center justify-center p-4 overflow-hidden">
      {isGoalReached && <Confetti />}
      <div className="text-center mb-8 z-10">
        <h1 className="text-4xl font-bold tracking-tight">Hidrasi Harian</h1>
        <p className="text-lg text-blue-100 mt-2">Tetap sehat, tetap terhidrasi.</p>
      </div>

      <div className="relative mb-6 z-10">
        <WaterProgress progress={progressPercentage} currentAmount={currentAmount} />
      </div>

      <div className="text-center mb-6 z-10">
        <p className="text-xl font-medium">
          <span className="font-bold text-2xl">{currentAmount.toFixed(2)}L</span> / {targetAmount.toFixed(1)}L
        </p>
        {isGoalReached && (
          <p className="mt-2 text-green-300 font-semibold text-lg animate-pulse">
            Selamat! Target harian tercapai!
          </p>
        )}
      </div>
      
      <div className="flex items-center space-x-4 z-10 mb-8">
        <AddWaterButton onAdd={addWater} isGoalReached={isGoalReached}/>
        
        <button 
          onClick={resetWater}
          className="bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-5 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-blue-500 focus:ring-white shadow-md backdrop-blur-sm h-14"
          aria-label="Atur ulang progres"
        >
          Reset
        </button>
      </div>

      {partnerUserData && (
        <div className="w-full max-w-sm z-10 mb-8">
            <PartnerProgress
                name={partnerId ? `Pasangan (${partnerId.substring(0, 6)}...)` : 'Pasangan'}
                current={partnerUserData.currentAmount}
                target={partnerUserData.targetAmount}
                progress={partnerUserData.progressPercentage}
            />
        </div>
      )}

      <UserLinker 
        userId={userId} 
        partnerId={partnerId} 
        onLink={linkPartner} 
        onUnlink={unlinkPartner} 
      />
    </main>
  );
};

export default App;