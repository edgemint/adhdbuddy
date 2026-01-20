import { Outlet, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Layout() {
  const { user, signOut, loading } = useAuth();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="text-xl font-bold text-primary-600">
                ADHDBuddy
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              {loading ? (
                <span className="text-gray-500">Loading...</span>
              ) : user ? (
                <>
                  <Link
                    to="/dashboard"
                    className="text-gray-700 dark:text-gray-200 hover:text-primary-600"
                  >
                    Dashboard
                  </Link>
                  <Link
                    to="/history"
                    className="text-gray-700 dark:text-gray-200 hover:text-primary-600"
                  >
                    History
                  </Link>
                  <Link
                    to="/profile"
                    className="text-gray-700 dark:text-gray-200 hover:text-primary-600"
                  >
                    Profile
                  </Link>
                  <button
                    onClick={signOut}
                    className="text-gray-700 dark:text-gray-200 hover:text-primary-600"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="text-gray-700 dark:text-gray-200 hover:text-primary-600"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}
