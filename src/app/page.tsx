export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              AdaPlanning
            </h1>
            <p className="text-xl text-gray-600">
              Staff Scheduling System for L'Osteria Deerlijk
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-800">
                🗓️ Features
              </h2>
              <ul className="space-y-2 text-gray-600">
                <li>• Weekly staff scheduling interface</li>
                <li>• Drag & drop shift assignment</li>
                <li>• Staff availability management</li>
                <li>• Mobile tablet optimization</li>
                <li>• Multi-language support (FR/NL/EN)</li>
                <li>• PWA offline capabilities</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-gray-800">
                🎯 Business Value
              </h2>
              <ul className="space-y-2 text-gray-600">
                <li>• Digital replica of paper calendar</li>
                <li>• €100/month recurring revenue</li>
                <li>• Part of Ada ecosystem expansion</li>
                <li>• Integrated authentication</li>
                <li>• Real-time schedule updates</li>
                <li>• Staff notification system</li>
              </ul>
            </div>
          </div>

          <div className="mt-8 p-6 bg-blue-50 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              🚀 Development Status
            </h3>
            <p className="text-blue-800">
              Currently in development - Phase 1: Foundation setup complete.
              Full scheduling interface coming soon!
            </p>
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-500">
              Part of L'Osteria business expansion (€50 → €550/month revenue growth)
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}