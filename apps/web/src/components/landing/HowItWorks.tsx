'use client';

export function HowItWorks() {
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          How It Works
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="text-4xl font-bold text-blue-600 mb-4">1</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Open Channel</h3>
            <p className="text-gray-600">Connect wallet and open state channel with one signature</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-green-600 mb-4">2</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Trade Instantly</h3>
            <p className="text-gray-600">Execute multiple trades with zero gas fees</p>
          </div>
          <div className="text-center">
            <div className="text-4xl font-bold text-purple-600 mb-4">3</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Settle On-Chain</h3>
            <p className="text-gray-600">Batch settle all trades with final signature</p>
          </div>
        </div>
      </div>
    </section>
  );
}