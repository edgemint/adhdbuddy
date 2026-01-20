import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import type { Session } from '@adhdbuddy/shared';
import { formatDuration } from '@adhdbuddy/shared';

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      loadSessions();
    }
  }, [user]);

  const loadSessions = async () => {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .order('start_time', { ascending: true })
      .limit(10);

    if (!error && data) {
      setSessions(data as Session[]);
    }
    setLoading(false);
  };

  const scheduleSession = async (duration: 25 | 50 | 75) => {
    // Schedule session starting in 5 minutes
    const startTime = new Date(Date.now() + 5 * 60 * 1000);

    const { data, error } = await supabase
      .from('sessions')
      .insert({
        start_time: startTime.toISOString(),
        duration_minutes: duration,
        status: 'scheduled',
      })
      .select()
      .single();

    if (!error && data) {
      // Also add the user as a participant
      await supabase.from('session_participants').insert({
        session_id: data.id,
        user_id: user!.id,
      });

      navigate(`/session/${data.id}`);
    }
  };

  if (authLoading || !user) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-600 dark:text-gray-300">Loading...</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Dashboard
      </h1>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Start a New Session
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-4">
          Choose a session duration and get matched with an accountability partner.
        </p>
        <div className="flex gap-4">
          <button
            onClick={() => scheduleSession(25)}
            className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700"
          >
            25 min
          </button>
          <button
            onClick={() => scheduleSession(50)}
            className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700"
          >
            50 min
          </button>
          <button
            onClick={() => scheduleSession(75)}
            className="bg-primary-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-primary-700"
          >
            75 min
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Upcoming Sessions
        </h2>

        {loading ? (
          <p className="text-gray-600 dark:text-gray-300">Loading sessions...</p>
        ) : sessions.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-300">
            No upcoming sessions. Schedule one above!
          </p>
        ) : (
          <div className="space-y-3">
            {sessions.map((session) => (
              <Link
                key={session.id}
                to={`/session/${session.id}`}
                className="block bg-gray-50 dark:bg-gray-700 p-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {new Date(session.start_time).toLocaleString()}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      {formatDuration(session.duration_minutes)} session
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm ${
                      session.status === 'scheduled'
                        ? 'bg-blue-100 text-blue-800'
                        : session.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : session.status === 'completed'
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {session.status}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
