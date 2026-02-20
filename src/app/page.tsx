import { Metadata } from 'next';
import { CalendarView } from '@/components/calendar/CalendarView';
import { Header } from '@/components/layout/Header';
import { Sidebar } from '@/components/layout/Sidebar';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export const metadata: Metadata = {
  title: 'Planning du Personnel - AdaPlanning',
  description: 'Vue d\'ensemble du planning du personnel pour L\'Osteria Deerlijk',
};

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Temporary Debug UI */}
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-blue-600 mb-2">
            🏗️ AdaPlanning - Debug Mode
          </h1>
          <p className="text-gray-600 mb-4">
            Restaurant Staff Scheduling Application - Temporarily bypassing authentication
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h2 className="font-semibold text-blue-800 mb-2">System Status:</h2>
            <ul className="text-blue-700 space-y-1">
              <li>✅ React App Loading</li>
              <li>✅ Next.js Routing</li>
              <li>✅ Tailwind CSS</li>
              <li>✅ UI Components</li>
            </ul>
          </div>
        </div>

        {/* Temporary UI Preview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">📋 Planning Features</h3>
            <div className="space-y-3">
              <div className="bg-gray-50 p-3 rounded">
                <h4 className="font-medium">Calendar View</h4>
                <p className="text-sm text-gray-600">Monthly staff scheduling</p>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <h4 className="font-medium">Staff Management</h4>
                <p className="text-sm text-gray-600">Add, edit, manage employees</p>
              </div>
              <div className="bg-gray-50 p-3 rounded">
                <h4 className="font-medium">Shift Assignment</h4>
                <p className="text-sm text-gray-600">Drag & drop scheduling</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4">🔐 Authentication</h3>
            <div className="space-y-3">
              <div className="bg-green-50 p-3 rounded">
                <h4 className="font-medium">Backend API</h4>
                <p className="text-sm text-green-700">✅ Running on ada.mindgen.app</p>
              </div>
              <div className="bg-green-50 p-3 rounded">
                <h4 className="font-medium">Database</h4>
                <p className="text-sm text-green-700">✅ Supabase Connected</p>
              </div>
              <div className="bg-yellow-50 p-3 rounded">
                <h4 className="font-medium">Auth Flow</h4>
                <p className="text-sm text-yellow-700">⚠️ Temporarily Disabled</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <a 
            href="/login" 
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Go to Login Page
          </a>
        </div>
      </div>
    </div>
  );
}