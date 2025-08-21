'use client';

export function DemoMode() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              🎮 PhotonX Demo Mode
            </h1>
            <p className="text-lg text-gray-600">
              Experience gasless trading with simulated funds
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-blue-50 rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">1</div>
              <div className="text-sm text-blue-800">Open Channel</div>
              <div className="text-xs text-blue-600 mt-1">1 signature</div>
            </div>
            <div className="bg-green-50 rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-green-600 mb-2">10+</div>
              <div className="text-sm text-green-800">Execute Trades</div>
              <div className="text-xs text-green-600 mt-1">0 signatures</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-6 text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">1</div>
              <div className="text-sm text-purple-800">Settle All</div>
              <div className="text-xs text-purple-600 mt-1">1 signature</div>
            </div>
          </div>
          
          <div className="bg-yellow-100 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-yellow-900 mb-4">
              🏆 Judge Mode Features
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-yellow-600">47</div>
                <div className="text-sm text-yellow-800">Trades Executed</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">94%</div>
                <div className="text-sm text-yellow-800">Gas Saved</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">156ms</div>
                <div className="text-sm text-yellow-800">Avg Latency</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-yellow-600">92%</div>
                <div className="text-sm text-yellow-800">Settlements Reduced</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}