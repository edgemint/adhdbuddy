import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';
import { Timer } from '@adhdbuddy/ui';
import type { Session as SessionType, SessionParticipant } from '@adhdbuddy/shared';
import { getSessionEndTime, formatDuration } from '@adhdbuddy/shared';

type SessionStage = 'loading' | 'waiting' | 'goal-setting' | 'in-progress' | 'check-in' | 'completed';

export default function Session() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [session, setSession] = useState<SessionType | null>(null);
  const [participant, setParticipant] = useState<SessionParticipant | null>(null);
  const [stage, setStage] = useState<SessionStage>('loading');
  const [goal, setGoal] = useState('');
  const [goalCompleted, setGoalCompleted] = useState<boolean | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (sessionId && user) {
      loadSession();
    }
  }, [sessionId, user]);

  const loadSession = async () => {
    // Load session
    const { data: sessionData } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', sessionId)
      .single();

    if (sessionData) {
      setSession(sessionData as SessionType);

      // Load participant data
      const { data: participantData } = await supabase
        .from('session_participants')
        .select('*')
        .eq('session_id', sessionId)
        .eq('user_id', user!.id)
        .single();

      if (participantData) {
        setParticipant(participantData as SessionParticipant);
        setGoal(participantData.goal || '');
        setGoalCompleted(participantData.goal_completed);

        // Determine stage based on state
        if (sessionData.status === 'completed') {
          setStage('completed');
        } else if (participantData.goal_completed !== null) {
          setStage('check-in');
        } else if (participantData.goal) {
          setStage('in-progress');
        } else {
          setStage('goal-setting');
        }
      } else {
        setStage('goal-setting');
      }
    }
  };

  const saveGoal = async () => {
    if (!goal.trim()) return;

    await supabase.from('session_participants').upsert({
      session_id: sessionId,
      user_id: user!.id,
      goal: goal.trim(),
      joined_at: new Date().toISOString(),
    });

    // Update session to active if it's scheduled
    if (session?.status === 'scheduled') {
      await supabase.from('sessions').update({ status: 'active' }).eq('id', sessionId);
    }

    setStage('in-progress');
    loadSession();
  };

  const completeCheckIn = async () => {
    if (goalCompleted === null) return;

    await supabase
      .from('session_participants')
      .update({ goal_completed: goalCompleted })
      .eq('session_id', sessionId)
      .eq('user_id', user!.id);

    await supabase.from('sessions').update({ status: 'completed' }).eq('id', sessionId);

    setStage('completed');
  };

  const handleTimerComplete = () => {
    setStage('check-in');
  };

  if (authLoading || stage === 'loading') {
    return (
      <div className="text-center py-16">
        <p className="text-gray-600 dark:text-gray-300">Loading session...</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-600 dark:text-gray-300">Session not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6">
        {stage === 'goal-setting' && (
          <>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              What will you work on?
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Set a clear goal for this {formatDuration(session.duration_minutes)} session.
            </p>
            <textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="e.g., Complete the first draft of my report..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 mb-4"
              rows={3}
            />
            <button
              onClick={saveGoal}
              disabled={!goal.trim()}
              className="bg-primary-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-700 disabled:bg-primary-300"
            >
              Start Session
            </button>
          </>
        )}

        {stage === 'in-progress' && (
          <>
            <div className="text-center mb-8">
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">Time remaining</p>
              <Timer
                endTime={getSessionEndTime(new Date(session.start_time), session.duration_minutes)}
                onComplete={handleTimerComplete}
              />
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Your goal</p>
              <p className="text-gray-900 dark:text-white font-medium">{participant?.goal}</p>
            </div>

            <p className="text-center text-gray-600 dark:text-gray-300">
              Focus on your work. We'll check in when time is up.
            </p>
          </>
        )}

        {stage === 'check-in' && (
          <>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Time's up! How did it go?
            </h1>

            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-6">
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Your goal was</p>
              <p className="text-gray-900 dark:text-white font-medium">{participant?.goal}</p>
            </div>

            <p className="text-gray-600 dark:text-gray-300 mb-4">
              Did you complete your goal?
            </p>

            <div className="flex gap-4 mb-6">
              <button
                onClick={() => setGoalCompleted(true)}
                className={`flex-1 py-3 rounded-lg font-medium ${
                  goalCompleted === true
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                Yes!
              </button>
              <button
                onClick={() => setGoalCompleted(false)}
                className={`flex-1 py-3 rounded-lg font-medium ${
                  goalCompleted === false
                    ? 'bg-yellow-600 text-white'
                    : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                }`}
              >
                Not quite
              </button>
            </div>

            <button
              onClick={completeCheckIn}
              disabled={goalCompleted === null}
              className="w-full bg-primary-600 text-white py-2 rounded-lg font-medium hover:bg-primary-700 disabled:bg-primary-300"
            >
              Complete Session
            </button>
          </>
        )}

        {stage === 'completed' && (
          <div className="text-center">
            <div className="text-4xl mb-4">{participant?.goal_completed ? '🎉' : '💪'}</div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {participant?.goal_completed ? 'Great work!' : 'Good effort!'}
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {participant?.goal_completed
                ? 'You completed your goal. Keep up the momentum!'
                : "You showed up and did the work. That's what matters!"}
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="bg-primary-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-primary-700"
            >
              Back to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
