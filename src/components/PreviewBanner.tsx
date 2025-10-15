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

  return (
    <div 
      className="sticky top-0 z-50 w-full"
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto max-w-screen-sm md:max-w-screen-md lg:max-w-screen-lg">
        <div className="flex items-center justify-between gap-3 px-4 py-3 text-sm rounded-b-xl bg-[#25292a] shadow-soft" 
             style={{ 
               background: 'linear-gradient(180deg, rgba(7,9,11,0.08), rgba(63,36,35,0.12)), #25292a' 
             }}>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <div className="relative flex-shrink-0">
              <Info className="w-4 h-4 text-white/90" strokeWidth={2} />
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-brand rounded-full" />
            </div>
            <p className="text-white/90 font-medium truncate">
              Preview build — for demonstration purposes only
            </p>
          </div>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            <a 
              href="https://devfolio.co/projects/kudos-protocol-d7e4"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Learn more about this preview build"
              className="text-white/70 text-xs underline decoration-transparent hover:decoration-white/40 hover:text-white transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded px-1"
            >
              Learn more
            </a>
            <button
              onClick={handleDismiss}
              aria-label="Dismiss preview banner"
              className="ml-1 rounded p-1.5 hover:bg-white/5 active:scale-[0.98] transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
            >
              <X className="w-4 h-4 text-white/70 hover:text-white" strokeWidth={2} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
