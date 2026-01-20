import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useAuth } from '../../src/hooks/useAuth';
import { supabase } from '../../src/lib/supabase';
import { formatDuration } from '@adhdbuddy/shared';

interface SessionData {
  id: string;
  start_time: string;
  duration_minutes: number;
  status: string;
  goal: string | null;
  goal_completed: boolean | null;
}

export default function History() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [stats, setStats] = useState({
    totalSessions: 0,
    completedGoals: 0,
    totalMinutes: 0,
    currentStreak: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadHistory();
    }
  }, [user]);

  const loadHistory = async () => {
    const { data } = await supabase
      .from('session_participants')
      .select('*, sessions(*)')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (data) {
      const sessionsData: SessionData[] = data.map((p: { sessions: SessionData; goal: string | null; goal_completed: boolean | null }) => ({
        id: p.sessions.id,
        start_time: p.sessions.start_time,
        duration_minutes: p.sessions.duration_minutes,
        status: p.sessions.status,
        goal: p.goal,
        goal_completed: p.goal_completed,
      }));

      setSessions(sessionsData);

      const completed = sessionsData.filter((s) => s.status === 'completed');
      setStats({
        totalSessions: completed.length,
        completedGoals: completed.filter((s) => s.goal_completed).length,
        totalMinutes: completed.reduce((sum, s) => sum + s.duration_minutes, 0),
        currentStreak: calculateStreak(completed),
      });
    }

    setLoading(false);
  };

  const calculateStreak = (sessions: SessionData[]): number => {
    if (sessions.length === 0) return 0;

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

  const renderSession = ({ item }: { item: SessionData }) => (
    <View style={styles.sessionItem}>
      <View style={styles.sessionLeft}>
        <View
          style={[
            styles.statusDot,
            item.status === 'completed'
              ? item.goal_completed
                ? styles.statusGreen
                : styles.statusYellow
              : styles.statusGray,
          ]}
        />
        <View>
          <Text style={styles.sessionDate}>
            {new Date(item.start_time).toLocaleDateString('en-US', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
          </Text>
          {item.goal && <Text style={styles.sessionGoal}>{item.goal}</Text>}
        </View>
      </View>
      <View style={styles.sessionRight}>
        <Text style={styles.sessionDuration}>
          {formatDuration(item.duration_minutes)}
        </Text>
        <View
          style={[
            styles.statusBadge,
            item.status === 'completed'
              ? item.goal_completed
                ? styles.badgeGreen
                : styles.badgeYellow
              : styles.badgeGray,
          ]}
        >
          <Text style={styles.statusText}>
            {item.status === 'completed'
              ? item.goal_completed
                ? 'Completed'
                : 'Partial'
              : item.status}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#7C3AED' }]}>
            {stats.totalSessions}
          </Text>
          <Text style={styles.statLabel}>Sessions</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#10B981' }]}>
            {stats.completedGoals}
          </Text>
          <Text style={styles.statLabel}>Goals</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#3B82F6' }]}>
            {Math.round(stats.totalMinutes / 60)}h
          </Text>
          <Text style={styles.statLabel}>Focus</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statValue, { color: '#F97316' }]}>
            {stats.currentStreak}
          </Text>
          <Text style={styles.statLabel}>Streak</Text>
        </View>
      </View>

      <View style={styles.listContainer}>
        <Text style={styles.listTitle}>Recent Sessions</Text>
        {loading ? (
          <Text style={styles.emptyText}>Loading...</Text>
        ) : sessions.length === 0 ? (
          <Text style={styles.emptyText}>No sessions yet</Text>
        ) : (
          <FlatList
            data={sessions}
            renderItem={renderSession}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  listContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  emptyText: {
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 20,
  },
  sessionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  sessionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 12,
  },
  statusGreen: {
    backgroundColor: '#10B981',
  },
  statusYellow: {
    backgroundColor: '#F59E0B',
  },
  statusGray: {
    backgroundColor: '#9CA3AF',
  },
  sessionDate: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
  },
  sessionGoal: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  sessionRight: {
    alignItems: 'flex-end',
  },
  sessionDuration: {
    fontSize: 12,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginTop: 4,
  },
  badgeGreen: {
    backgroundColor: '#D1FAE5',
  },
  badgeYellow: {
    backgroundColor: '#FEF3C7',
  },
  badgeGray: {
    backgroundColor: '#F3F4F6',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '500',
  },
});
