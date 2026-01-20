import { useState } from 'react';
import { View, Text, Pressable, StyleSheet, Modal, Alert } from 'react-native';
import { supabase } from '../lib/supabase';

// RevenueCat integration placeholder
// In production, use: import Purchases from 'react-native-purchases';

interface PremiumModalProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
}

export function PremiumModal({ visible, onClose, userId }: PremiumModalProps) {
  const [purchasing, setPurchasing] = useState(false);

  const handlePurchase = async (plan: 'monthly' | 'yearly') => {
    setPurchasing(true);

    try {
      // In production, use RevenueCat:
      // const offerings = await Purchases.getOfferings();
      // const package = plan === 'monthly'
      //   ? offerings.current?.monthly
      //   : offerings.current?.annual;
      // const { customerInfo } = await Purchases.purchasePackage(package);

      // For now, simulate a successful purchase
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Update premium status in database
      await supabase.from('user_preferences').upsert({
        user_id: userId,
        is_premium: true,
        premium_expires_at: new Date(
          Date.now() + (plan === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000
        ).toISOString(),
      });

      Alert.alert('Success', 'Welcome to Premium!', [{ text: 'OK', onPress: onClose }]);
    } catch {
      Alert.alert('Error', 'Purchase failed. Please try again.');
    } finally {
      setPurchasing(false);
    }
  };

  const handleRestore = async () => {
    setPurchasing(true);

    try {
      // In production:
      // const customerInfo = await Purchases.restorePurchases();
      // if (customerInfo.entitlements.active['premium']) {
      //   await supabase.from('user_preferences').upsert({ ... });
      // }

      await new Promise((resolve) => setTimeout(resolve, 1000));
      Alert.alert('Info', 'No previous purchases found.');
    } catch {
      Alert.alert('Error', 'Could not restore purchases.');
    } finally {
      setPurchasing(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Pressable style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeText}>×</Text>
          </Pressable>

          <Text style={styles.title}>Upgrade to Premium</Text>
          <Text style={styles.subtitle}>
            Unlock ad-free sessions and priority matching
          </Text>

          <View style={styles.features}>
            <View style={styles.feature}>
              <Text style={styles.checkmark}>✓</Text>
              <Text style={styles.featureText}>Ad-free experience</Text>
            </View>
            <View style={styles.feature}>
              <Text style={styles.checkmark}>✓</Text>
              <Text style={styles.featureText}>Priority partner matching</Text>
            </View>
            <View style={styles.feature}>
              <Text style={styles.checkmark}>✓</Text>
              <Text style={styles.featureText}>Unlimited session history</Text>
            </View>
            <View style={styles.feature}>
              <Text style={styles.checkmark}>✓</Text>
              <Text style={styles.featureText}>Advanced statistics</Text>
            </View>
          </View>

          <View style={styles.plans}>
            <Pressable
              style={styles.plan}
              onPress={() => handlePurchase('monthly')}
              disabled={purchasing}
            >
              <Text style={styles.planName}>Monthly</Text>
              <Text style={styles.planPrice}>$4.99/mo</Text>
            </Pressable>

            <Pressable
              style={[styles.plan, styles.planPopular]}
              onPress={() => handlePurchase('yearly')}
              disabled={purchasing}
            >
              <View style={styles.badge}>
                <Text style={styles.badgeText}>Save 40%</Text>
              </View>
              <Text style={[styles.planName, { color: '#fff' }]}>Yearly</Text>
              <Text style={[styles.planPrice, { color: '#fff' }]}>$35.99/yr</Text>
              <Text style={styles.planSavings}>$2.99/mo</Text>
            </Pressable>
          </View>

          <Pressable style={styles.restoreButton} onPress={handleRestore} disabled={purchasing}>
            <Text style={styles.restoreText}>Restore Purchases</Text>
          </Pressable>

          {purchasing && (
            <View style={styles.loadingOverlay}>
              <Text style={styles.loadingText}>Processing...</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeText: {
    fontSize: 24,
    color: '#6B7280',
    lineHeight: 28,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 24,
  },
  features: {
    marginBottom: 24,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkmark: {
    fontSize: 18,
    color: '#10B981',
    marginRight: 12,
  },
  featureText: {
    fontSize: 16,
    color: '#374151',
  },
  plans: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  plan: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  planPopular: {
    backgroundColor: '#7C3AED',
    borderColor: '#7C3AED',
  },
  badge: {
    position: 'absolute',
    top: -12,
    backgroundColor: '#F59E0B',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  planName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginTop: 8,
  },
  planPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 4,
  },
  planSavings: {
    fontSize: 12,
    color: '#D1D5DB',
    marginTop: 2,
  },
  restoreButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  restoreText: {
    color: '#6B7280',
    fontSize: 14,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 24,
  },
  loadingText: {
    color: '#7C3AED',
    fontSize: 16,
    fontWeight: '500',
  },
});
