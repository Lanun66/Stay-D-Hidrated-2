import React, { useMemo, useState, useEffect } from 'react';
import { useFirestoreWaterTracker } from './hooks/useFirestoreWaterTracker';
import WaterProgress from './components/WaterProgress';
import AddWaterButton from './components/AddWaterButton';
import Confetti from './components/Confetti';
import EditableTarget from './components/EditableTarget';
import UserLinker from './components/UserLinker';
import PartnerProgress from './components/PartnerProgress';
import HistoryChart from './components/HistoryChart';
import NotificationManager from './components/NotificationManager';
import ConfigWarningBanner from './components/ConfigWarningBanner';
import ErrorToast from './components/ErrorToast';

function App() {
    const {
        userId,
        current,
        target,
        partnerId,
        partnerData,
        history,
        isLoading,
        error, // Fatal errors
        toastError, // Non-fatal errors
        clearToastError, // Function to clear toast error
        isOffline,
        configError,
        updateWater,
        updateTarget,
        linkPartner,
        unlinkPartner,
        sendNotificationToPartner,
    } = useFirestoreWaterTracker();

    const [showConfetti, setShowConfetti] = useState(false);
    const [activeToast, setActiveToast] = useState<string | null>(null);

    useEffect(() => {
        if (toastError) {
            setActiveToast(toastError);
            clearToastError();
        }
    }, [toastError, clearToastError]);

    const progress = useMemo(() => {
        if (target === 0) return 0;
        return Math.min((current / target) * 100, 100);
    }, [current, target]);

    const isGoalReached = useMemo(() => progress >= 100, [progress]);

    useEffect(() => {
        if (isGoalReached) {
            setShowConfetti(true);
            const timer = setTimeout(() => setShowConfetti(false), 5000);
            return () => clearTimeout(timer);
        }
    }, [isGoalReached]);

    const partnerProgress = useMemo(() => {
        if (!partnerData || partnerData.target === 0) return 0;
        return Math.min((partnerData.current / partnerData.target) * 100, 100);
    }, [partnerData]);

    if (isLoading) {
        return (
            <div className="w-screen h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-400 to-blue-600 text-white font-sans">
                <h1 className="text-3xl font-bold animate-pulse">Memuat Data...</h1>
            </div>
        );
    }
    
    if (error) {
        return (
            <div className="w-screen h-screen flex flex-col items-center justify-center bg-gradient-to-br from-red-400 to-red-600 text-white font-sans p-4 text-center">
                <h1 className="text-3xl font-bold mb-4">Oops! Terjadi Kesalahan Kritis</h1>
                <p className="text-lg">{error}</p>
                <p className="text-sm mt-2">Silakan muat ulang halaman.</p>
            </div>
        );
    }

    return (
        <div className="w-screen min-h-screen flex flex-col items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-blue-400 to-blue-600 text-white font-sans overflow-y-auto">
            {/* Overlays: Banners, Toasts, Confetti */}
            {isOffline && <ConfigWarningBanner message={configError} />}
            {!isOffline && <NotificationManager userId={userId} />}
            {showConfetti && <Confetti />}
            <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[60] w-full max-w-sm px-4">
                {activeToast && (
                    <ErrorToast 
                        message={activeToast}
                        onDismiss={() => setActiveToast(null)}
                    />
                )}
            </div>

            <main className="w-full max-w-md flex flex-col items-center space-y-6">
                <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight text-shadow-lg text-center">Stay D Hidrated by Ayy</h1>
                
                <div className="flex flex-col items-center space-y-4">
                    <WaterProgress progress={progress} currentAmount={current} />
                    <EditableTarget target={target} onTargetChange={updateTarget} />
                </div>
                <AddWaterButton onAdd={() => updateWater(0.25)} isGoalReached={isGoalReached} />

                {/* Online-only features */}
                {!isOffline && (
                    <>
                        <div className="w-full h-px bg-white/30"></div>
                        <div className="w-full flex flex-col items-center space-y-4">
                             <UserLinker userId={userId} partnerId={partnerId} onLink={linkPartner} onUnlink={unlinkPartner} />
                             {partnerData && (
                                <PartnerProgress
                                    name="Progress Pasangan"
                                    current={partnerData.current}
                                    target={partnerData.target}
                                    progress={partnerProgress}
                                    partnerId={partnerData.id}
                                    onSendNotification={sendNotificationToPartner}
                                />
                             )}
                        </div>
                    </>
                )}

                <div className="w-full h-px bg-white/30"></div>
                <HistoryChart history={history} target={target} />
            </main>

            <footer className="mt-8 text-center text-blue-100 text-sm">
                <p>Dibangun dengan ❤️ untuk tetap terhidrasi.</p>
            </footer>
        </div>
    );
}

export default App;