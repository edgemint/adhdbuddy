import { useEffect, useRef, useState } from 'react';

interface AdBannerProps {
  isPremium: boolean;
  slot?: string;
}

export function AdBanner({ isPremium, slot: _slot = 'auto' }: AdBannerProps) {
  const adRef = useRef<HTMLDivElement>(null);
  const [showAd, setShowAd] = useState(false);

  useEffect(() => {
    if (!isPremium) {
      setShowAd(true);

      // In production, load AdSense:
      // const script = document.createElement('script');
      // script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
      // script.async = true;
      // script.setAttribute('data-ad-client', 'ca-pub-xxxxxxxx');
      // document.head.appendChild(script);
      //
      // Then push the ad:
      // (window.adsbygoogle = window.adsbygoogle || []).push({});
    }
  }, [isPremium]);

  if (isPremium || !showAd) {
    return null;
  }

  // Placeholder for AdSense
  // In production, replace with:
  // <ins
  //   className="adsbygoogle"
  //   style={{ display: 'block' }}
  //   data-ad-client="ca-pub-xxxxxxxx"
  //   data-ad-slot={slot}
  //   data-ad-format="auto"
  //   data-full-width-responsive="true"
  // />

  return (
    <div ref={adRef} className="w-full flex justify-center py-2 bg-gray-50 dark:bg-gray-800">
      <div className="w-full max-w-[728px] h-[90px] bg-gray-200 dark:bg-gray-700 rounded-lg flex flex-col items-center justify-center">
        <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">
          Ad Space (Free Tier)
        </span>
        <span className="text-xs text-gray-400 dark:text-gray-500">
          Upgrade to remove ads
        </span>
      </div>
    </div>
  );
}
