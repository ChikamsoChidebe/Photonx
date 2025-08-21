'use client';

export function TechSpecs() {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
          Technical Specifications
        </h2>
        <div className="bg-gray-50 rounded-xl p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">ERC-7824 State Channels</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Nonce-based state progression</li>
                <li>• EIP-712 signature verification</li>
                <li>• Dispute resolution mechanism</li>
                <li>• Batch settlement optimization</li>
              </ul>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Supported Networks</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Ethereum Mainnet</li>
                <li>• Polygon</li>
                <li>• Base</li>
                <li>• Arbitrum</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}