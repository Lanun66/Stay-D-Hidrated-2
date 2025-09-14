import React from 'react';

interface HistoryEntry {
    date: string; // YYYY-MM-DD
    amount: number;
}

interface HistoryChartProps {
    history: HistoryEntry[];
    target: number;
}

const HistoryChart: React.FC<HistoryChartProps> = ({ history, target }) => {
    const last7DaysHistory = history.slice(-7);
    const maxAmount = Math.max(...last7DaysHistory.map(h => h.amount), target);

    if (history.length === 0) {
        return (
            <div className="w-full max-w-sm p-4 bg-white/10 rounded-xl backdrop-blur-sm shadow-lg text-center text-blue-100">
                <h3 className="text-lg font-semibold mb-2">Riwayat 7 Hari Terakhir</h3>
                <p>Belum ada riwayat. Mulai minum hari ini!</p>
            </div>
        );
    }
    
    return (
        <div className="w-full max-w-sm p-4 bg-white/10 rounded-xl backdrop-blur-sm shadow-lg">
            <h3 className="text-lg font-semibold mb-4 text-center text-white">Riwayat 7 Hari Terakhir</h3>
            <div className="flex justify-around items-end h-40 space-x-2">
                {last7DaysHistory.map((entry) => {
                    const barHeight = maxAmount > 0 ? (entry.amount / maxAmount) * 100 : 0;
                    const day = new Date(entry.date + 'T00:00:00').toLocaleDateString('id-ID', { weekday: 'short' });
                    
                    return (
                        <div key={entry.date} className="flex-1 flex flex-col items-center justify-end h-full">
                            <div 
                                className="w-full rounded-t-md transition-all duration-500"
                                style={{ 
                                    height: `${barHeight}%`,
                                    backgroundColor: entry.amount >= target ? '#4ade80' : '#60a5fa' // green if target reached, blue otherwise
                                 }}
                                title={`${entry.date}: ${entry.amount.toFixed(2)}L`}
                            ></div>
                            <span className="text-xs text-white mt-1">{day}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default HistoryChart;
