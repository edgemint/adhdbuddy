import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Link, Redirect } from 'expo-router';
import { useAuth } from '../src/hooks/useAuth';

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (user) {
    return <Redirect href="/(tabs)/dashboard" />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.title}>ADHDBuddy</Text>
        <Text style={styles.subtitle}>
          Focus better with accountability partners
        </Text>
        <Text style={styles.description}>
          Schedule focused work sessions with partners who keep you accountable.
          Set goals, work together via video, and achieve more.
        </Text>
      </View>

      <View style={styles.buttons}>
        <Link href="/signup" asChild>
          <Pressable style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Get Started</Text>
          </Pressable>
        </Link>

        <Link href="/login" asChild>
          <Pressable style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Login</Text>
          </Pressable>
        </Link>
      </View>

      <View style={styles.features}>
        <View style={styles.feature}>
          <Text style={styles.featureEmoji}>🎯</Text>
          <Text style={styles.featureText}>Set & achieve goals</Text>
        </View>
        <View style={styles.feature}>
          <Text style={styles.featureEmoji}>👥</Text>
          <Text style={styles.featureText}>Smart partner matching</Text>
        </View>
        <View style={styles.feature}>
          <Text style={styles.featureEmoji}>📹</Text>
          <Text style={styles.featureText}>Video accountability</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 24,
  },
  loadingText: {
    textAlign: 'center',
    color: '#6B7280',
    marginTop: 100,
  },
  hero: {
    marginTop: 60,
    marginBottom: 40,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#7C3AED',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  buttons: {
    gap: 12,
    marginBottom: 40,
  },
  primaryButton: {
    backgroundColor: '#7C3AED',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#7C3AED',
  },
  secondaryButtonText: {
    color: '#7C3AED',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  features: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  feature: {
    alignItems: 'center',
  },
  featureEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  featureText: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
  },
});
