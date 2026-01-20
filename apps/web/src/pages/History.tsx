import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import type { Session, SessionParticipant } from '@adhdbuddy/shared';
import { formatDuration } from '@adhdbuddy/shared';

interface SessionWithParticipant extends Session {
  participant: SessionParticipant | null;
}

export default function History() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<SessionWithParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSessions: 0,
    completedGoals: 0,
    totalMinutes: 0,
    currentStreak: 0,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      loadHistory();
    }
  }, [user]);

  const loadHistory = async () => {
    // Get all sessions where user is a participant
    const { data: participantData } = await supabase
      .from('session_participants')
      .select('*, sessions(*)')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (participantData) {
      const sessionsWithParticipant: SessionWithParticipant[] = participantData.map((p) => ({
        ...(p.sessions as Session),
        participant: {
          id: p.id,
          session_id: p.session_id,
          user_id: p.user_id,
          goal: p.goal,
          goal_completed: p.goal_completed,
          joined_at: p.joined_at,
        } as SessionParticipant,
      }));

      setSessions(sessionsWithParticipant);

      // Calculate stats
      const completedSessions = sessionsWithParticipant.filter(
        (s) => s.status === 'completed'
      );
      const completedGoals = completedSessions.filter(
        (s) => s.participant?.goal_completed === true
      );
      const totalMinutes = completedSessions.reduce(
        (sum, s) => sum + s.duration_minutes,
        0
      );

      // Calculate streak (consecutive days with at least one completed session)
      const streak = calculateStreak(completedSessions);

      setStats({
        totalSessions: completedSessions.length,
        completedGoals: completedGoals.length,
        totalMinutes,
        currentStreak: streak,
      });
    }

    setLoading(false);
  };

  const calculateStreak = (sessions: SessionWithParticipant[]): number => {
    if (sessions.length === 0) return 0;

    // Sort by start time descending
    const sorted = [...sessions].sort(
      (a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime()
    );

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    for (const session of sorted) {
      const sessionDate = new Date(session.start_time);
      sessionDate.setHours(0, 0, 0, 0);

      const dayDiff = Math.floor(
        (currentDate.getTime() - sessionDate.getTime()) / (24 * 60 * 60 * 1000)
      );

      if (dayDiff === 0 || dayDiff === 1) {
        streak++;
        currentDate = sessionDate;
      } else {
        break;
      }
    }

    return streak;
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
        Session History
      </h1>

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 text-center">
          <p className="text-3xl font-bold text-primary-600">{stats.totalSessions}</p>
          <p className="text-sm text-gray-600 dark:text-gray-300">Total Sessions</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 text-center">
          <p className="text-3xl font-bold text-green-600">{stats.completedGoals}</p>
          <p className="text-sm text-gray-600 dark:text-gray-300">Goals Completed</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 text-center">
          <p className="text-3xl font-bold text-blue-600">{Math.round(stats.totalMinutes / 60)}h</p>
          <p className="text-sm text-gray-600 dark:text-gray-300">Focus Time</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4 text-center">
          <p className="text-3xl font-bold text-orange-600">{stats.currentStreak}</p>
          <p className="text-sm text-gray-600 dark:text-gray-300">Day Streak</p>
        </div>
      </div>

      {/* Session list */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Sessions
          </h2>
        </div>

        {loading ? (
          <div className="p-8 text-center text-gray-600 dark:text-gray-300">
            Loading sessions...
          </div>
        ) : sessions.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              No sessions yet. Start your first session!
            </p>
            <Link
              to="/dashboard"
              className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700"
            >
              Schedule Session
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className={`inline-block w-2 h-2 rounded-full ${
                          session.status === 'completed'
                            ? session.participant?.goal_completed
                              ? 'bg-green-500'
                              : 'bg-yellow-500'
                            : session.status === 'cancelled'
                            ? 'bg-red-500'
                            : 'bg-gray-400'
                        }`}
                      />
                      <span className="font-medium text-gray-900 dark:text-white">
                        {new Date(session.start_time).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      <span className="text-gray-500 dark:text-gray-400">
                        {new Date(session.start_time).toLocaleTimeString('en-US', {
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    {session.participant?.goal && (
                      <p className="text-gray-600 dark:text-gray-300 text-sm">
                        {session.participant.goal}
                      </p>
                    )}
                  </div>
                  <div className="text-right ml-4">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDuration(session.duration_minutes)}
                    </p>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        session.status === 'completed'
                          ? session.participant?.goal_completed
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                            : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                          : session.status === 'cancelled'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                    >
                      {session.status === 'completed'
                        ? session.participant?.goal_completed
                          ? 'Goal completed'
                          : 'Partial'
                        : session.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
