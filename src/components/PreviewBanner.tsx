import { useState, useEffect } from 'react';
import { Info, X } from 'lucide-react';
const STORAGE_KEY = 'aptx_preview_dismissed';
export const PreviewBanner = () => {
  const [isVisible, setIsVisible] = useState(false);
  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    setIsVisible(!dismissed);
  }, []);
  const handleDismiss = () => {
    localStorage.setItem(STORAGE_KEY, 'true');
    setIsVisible(false);
  };
  if (!isVisible) return null;
  return <div className="sticky top-0 z-50 w-full" role="status" aria-live="polite">
      <div className="mx-auto max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg">
        
      </div>
    </div>;
};