import { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';

// AdMob integration placeholder
// In production, use: import { BannerAd, BannerAdSize, TestIds } from 'react-native-google-mobile-ads';

interface AdBannerProps {
  isPremium: boolean;
}

export function AdBanner({ isPremium }: AdBannerProps) {
  const [showAd, setShowAd] = useState(false);

  useEffect(() => {
    // Only show ads for non-premium users
    if (!isPremium) {
      setShowAd(true);
    }
  }, [isPremium]);

  if (isPremium || !showAd) {
    return null;
  }

  // Placeholder for AdMob banner
  // In production, replace with:
  // return (
  //   <BannerAd
  //     unitId={__DEV__ ? TestIds.BANNER : 'ca-app-pub-xxx/yyy'}
  //     size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
  //     requestOptions={{
  //       requestNonPersonalizedAdsOnly: true,
  //     }}
  //   />
  // );

  return (
    <View style={styles.container}>
      <View style={styles.adPlaceholder}>
        <Text style={styles.adText}>Ad Space (Free Tier)</Text>
        <Text style={styles.adSubtext}>Upgrade to remove ads</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 8,
    backgroundColor: '#F9FAFB',
  },
  adPlaceholder: {
    width: '100%',
    maxWidth: 320,
    height: 50,
    backgroundColor: '#E5E7EB',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adText: {
    fontSize: 12,
    color: '#6B7280',
    fontWeight: '500',
  },
  adSubtext: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
  },
});
