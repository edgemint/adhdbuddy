import { useEffect, useState } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useAuth } from '../../src/hooks/useAuth';
import { supabase } from '../../src/lib/supabase';

type SessionStage = 'waiting' | 'goal' | 'in-progress' | 'check-in' | 'completed';

export default function SessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [stage, setStage] = useState<SessionStage>('waiting');
  const [goal, setGoal] = useState('');
  const [goalCompleted, setGoalCompleted] = useState(false);
  const [partner, setPartner] = useState<{ id: string; name: string } | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [duration, setDuration] = useState(50);

  useEffect(() => {
    if (id && user) {
      loadSession();
      subscribeToPartner();
    }
  }, [id, user]);

  useEffect(() => {
    if (stage === 'in-progress' && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(timer);
            setStage('check-in');
            return 0;
          }
          return t - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [stage, timeLeft]);

  const loadSession = async () => {
    const { data: session } = await supabase
      .from('sessions')
      .select('*')
      .eq('id', id)
      .single();

    if (session) {
      setDuration(session.duration_minutes);
      setTimeLeft(session.duration_minutes * 60);

      // Check for existing participants
      const { data: participants } = await supabase
        .from('session_participants')
        .select('*, profiles(name)')
        .eq('session_id', id)
        .neq('user_id', user!.id);

      if (participants && participants.length > 0) {
        const p = participants[0];
        setPartner({
          id: p.user_id,
          name: (p.profiles as { name?: string } | null)?.name || 'Partner',
        });
        setStage('goal');
      }
    }
  };

  const subscribeToPartner = () => {
    const subscription = supabase
      .channel(`session-${id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'session_participants',
          filter: `session_id=eq.${id}`,
        },
        async (payload) => {
          if (payload.new.user_id !== user!.id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('name')
              .eq('id', payload.new.user_id)
              .single();

            setPartner({
              id: payload.new.user_id,
              name: profile?.name || 'Partner',
            });
            setStage('goal');
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  };

  const handleSetGoal = async () => {
    if (!goal.trim()) {
      Alert.alert('Error', 'Please enter your goal');
      return;
    }

    await supabase
      .from('session_participants')
      .update({ goal: goal.trim() })
      .eq('session_id', id)
      .eq('user_id', user!.id);

    setStage('in-progress');
  };

  const handleCheckIn = async (completed: boolean) => {
    setGoalCompleted(completed);

    await supabase
      .from('session_participants')
      .update({ goal_completed: completed })
      .eq('session_id', id)
      .eq('user_id', user!.id);

    await supabase
      .from('sessions')
      .update({ status: 'completed' })
      .eq('id', id);

    setStage('completed');
  };

  const handleLeave = () => {
    Alert.alert('Leave Session', 'Are you sure you want to leave?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Leave', onPress: () => router.replace('/(tabs)/dashboard'), style: 'destructive' },
    ]);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      {stage === 'waiting' && (
        <View style={styles.center}>
          <Text style={styles.title}>Finding a Partner...</Text>
          <Text style={styles.subtitle}>
            We're matching you with an accountability partner
          </Text>
          <View style={styles.spinner} />
          <Pressable style={styles.cancelButton} onPress={handleLeave}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </Pressable>
        </View>
      )}

      {stage === 'goal' && (
        <View style={styles.content}>
          <Text style={styles.title}>Matched with {partner?.name}!</Text>
          <Text style={styles.subtitle}>What will you accomplish in {duration} minutes?</Text>

          <TextInput
            style={styles.goalInput}
            value={goal}
            onChangeText={setGoal}
            placeholder="e.g., Write 500 words, Review PRs, Study chapter 3..."
            multiline
          />

          <Pressable style={styles.primaryButton} onPress={handleSetGoal}>
            <Text style={styles.primaryButtonText}>Start Session</Text>
          </Pressable>
        </View>
      )}

      {stage === 'in-progress' && (
        <View style={styles.content}>
          <View style={styles.videoPlaceholder}>
            <Text style={styles.videoText}>Video call with {partner?.name}</Text>
            <Text style={styles.videoSubtext}>
              (Video requires native device)
            </Text>
          </View>

          <View style={styles.timerCard}>
            <Text style={styles.timerLabel}>Time Remaining</Text>
            <Text style={styles.timer}>{formatTime(timeLeft)}</Text>
          </View>

          <View style={styles.goalCard}>
            <Text style={styles.goalLabel}>Your Goal</Text>
            <Text style={styles.goalText}>{goal}</Text>
          </View>

          <Pressable style={styles.leaveButton} onPress={handleLeave}>
            <Text style={styles.leaveButtonText}>Leave Session</Text>
          </Pressable>
        </View>
      )}

      {stage === 'check-in' && (
        <View style={styles.center}>
          <Text style={styles.title}>Time's Up!</Text>
          <Text style={styles.subtitle}>Did you complete your goal?</Text>

          <View style={styles.goalCard}>
            <Text style={styles.goalLabel}>Your Goal</Text>
            <Text style={styles.goalText}>{goal}</Text>
          </View>

          <View style={styles.checkInButtons}>
            <Pressable
              style={[styles.checkInButton, styles.checkInYes]}
              onPress={() => handleCheckIn(true)}
            >
              <Text style={styles.checkInButtonText}>Yes, I did it!</Text>
            </Pressable>
            <Pressable
              style={[styles.checkInButton, styles.checkInNo]}
              onPress={() => handleCheckIn(false)}
            >
              <Text style={[styles.checkInButtonText, { color: '#374151' }]}>
                Not quite
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      {stage === 'completed' && (
        <View style={styles.center}>
          <Text style={styles.emoji}>{goalCompleted ? '🎉' : '💪'}</Text>
          <Text style={styles.title}>
            {goalCompleted ? 'Goal Completed!' : 'Great effort!'}
          </Text>
          <Text style={styles.subtitle}>
            {goalCompleted
              ? "You crushed it! Keep up the momentum."
              : "Progress is progress. You'll get it next time!"}
          </Text>

          <Pressable
            style={styles.primaryButton}
            onPress={() => router.replace('/(tabs)/dashboard')}
          >
            <Text style={styles.primaryButtonText}>Back to Dashboard</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  spinner: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 4,
    borderColor: '#E5E7EB',
    borderTopColor: '#7C3AED',
    marginVertical: 32,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  cancelButtonText: {
    color: '#EF4444',
    fontWeight: '600',
  },
  goalInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 24,
  },
  primaryButton: {
    backgroundColor: '#7C3AED',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  videoPlaceholder: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  videoText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  videoSubtext: {
    color: '#9CA3AF',
    fontSize: 14,
    marginTop: 8,
  },
  timerCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  timerLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  timer: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#7C3AED',
    fontVariant: ['tabular-nums'],
  },
  goalCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  goalLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  goalText: {
    fontSize: 16,
    color: '#1F2937',
  },
  leaveButton: {
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 'auto',
  },
  leaveButtonText: {
    color: '#EF4444',
    fontWeight: '600',
  },
  checkInButtons: {
    width: '100%',
    gap: 12,
    marginTop: 24,
  },
  checkInButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  checkInYes: {
    backgroundColor: '#10B981',
  },
  checkInNo: {
    backgroundColor: '#F3F4F6',
  },
  checkInButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  emoji: {
    fontSize: 64,
    marginBottom: 16,
  },
});
