import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { SESSION_DURATIONS, type SessionDuration } from '@adhdbuddy/shared';
import { supabase } from '../../src/lib/supabase';
import { useAuth } from '../../src/hooks/useAuth';

export default function Dashboard() {
  const { user } = useAuth();
  const [selectedDuration, setSelectedDuration] = useState<SessionDuration>(50);
  const [scheduling, setScheduling] = useState(false);

  const handleSchedule = async () => {
    if (!user) return;

    setScheduling(true);
    try {
      // Add to matching queue
      const { error: queueError } = await supabase.from('matching_queue').upsert({
        user_id: user.id,
        duration: selectedDuration,
        start_time: new Date().toISOString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });

      if (queueError) throw queueError;

      // Create a pending session
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .insert({
          duration_minutes: selectedDuration,
          status: 'pending',
          start_time: new Date().toISOString(),
        })
        .select()
        .single();

      if (sessionError) throw sessionError;

      // Add user as participant
      await supabase.from('session_participants').insert({
        session_id: session.id,
        user_id: user.id,
      });

      router.push(`/session/${session.id}`);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to schedule session');
    } finally {
      setScheduling(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Start a Focus Session</Text>
        <Text style={styles.cardDescription}>
          Choose a duration and we'll match you with an accountability partner
        </Text>

        <View style={styles.durations}>
          {SESSION_DURATIONS.map((duration) => (
            <Pressable
              key={duration}
              style={[
                styles.durationButton,
                selectedDuration === duration && styles.durationButtonSelected,
              ]}
              onPress={() => setSelectedDuration(duration)}
            >
              <Text
                style={[
                  styles.durationText,
                  selectedDuration === duration && styles.durationTextSelected,
                ]}
              >
                {duration} min
              </Text>
            </Pressable>
          ))}
        </View>

        <Pressable
          style={[styles.startButton, scheduling && styles.startButtonDisabled]}
          onPress={handleSchedule}
          disabled={scheduling}
        >
          <Text style={styles.startButtonText}>
            {scheduling ? 'Finding partner...' : 'Find a Partner'}
          </Text>
        </Pressable>
      </View>

      <View style={styles.tips}>
        <Text style={styles.tipsTitle}>Tips for a Great Session</Text>
        <View style={styles.tip}>
          <Text style={styles.tipNumber}>1</Text>
          <Text style={styles.tipText}>Have a clear goal ready to declare</Text>
        </View>
        <View style={styles.tip}>
          <Text style={styles.tipNumber}>2</Text>
          <Text style={styles.tipText}>Find a quiet space with good lighting</Text>
        </View>
        <View style={styles.tip}>
          <Text style={styles.tipNumber}>3</Text>
          <Text style={styles.tipText}>Put your phone on do not disturb</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 16,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  durations: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  durationButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
  },
  durationButtonSelected: {
    backgroundColor: '#7C3AED',
  },
  durationText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  durationTextSelected: {
    color: '#fff',
  },
  startButton: {
    backgroundColor: '#7C3AED',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  startButtonDisabled: {
    backgroundColor: '#A78BFA',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  tips: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  tipNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#EDE9FE',
    color: '#7C3AED',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 24,
    marginRight: 12,
  },
  tipText: {
    fontSize: 14,
    color: '#4B5563',
  },
});
