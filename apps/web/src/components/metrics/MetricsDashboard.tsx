'use client';

interface MetricsDashboardProps {
  compact?: boolean;
}

export function MetricsDashboard({ compact = false }: MetricsDashboardProps) {
  return (
    <div className={`bg-white p-4 ${compact ? 'border-b' : 'rounded-xl shadow-lg'}`}>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Live Metrics Dashboard
      </h2>
      <div className="grid grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">156ms</div>
          <div className="text-sm text-gray-600">Avg Quote Time</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">94%</div>
          <div className="text-sm text-gray-600">Gas Saved</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">12</div>
          <div className="text-sm text-gray-600">Trades/Settlement</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">47</div>
          <div className="text-sm text-gray-600">Total Trades</div>
        </div>
      </div>
    </div>
  );
}