import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="text-center py-16">
      <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
        Focus Together, Achieve More
      </h1>
      <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-2xl mx-auto">
        ADHDBuddy pairs you with an accountability partner for focused work sessions.
        Declare your goals, work together via video, and check in on your progress.
      </p>

      <div className="flex justify-center gap-4">
        {user ? (
          <Link
            to="/dashboard"
            className="bg-primary-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-primary-700"
          >
            Go to Dashboard
          </Link>
        ) : (
          <>
            <Link
              to="/signup"
              className="bg-primary-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-primary-700"
            >
              Get Started Free
            </Link>
            <Link
              to="/login"
              className="bg-gray-200 text-gray-800 px-8 py-3 rounded-lg text-lg font-medium hover:bg-gray-300"
            >
              Login
            </Link>
          </>
        )}
      </div>

      <div className="mt-16 grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
          <div className="text-3xl mb-4">🎯</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Set Clear Goals
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            Start each session by declaring what you want to accomplish
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
          <div className="text-3xl mb-4">🤝</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Accountability Partner
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            Get matched with someone who will keep you focused
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm">
          <div className="text-3xl mb-4">✅</div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            Track Progress
          </h3>
          <p className="text-gray-600 dark:text-gray-300">
            Check in at the end to celebrate wins and reflect
          </p>
        </div>
      </div>
    </div>
  );
}
