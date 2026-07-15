import { useRef, useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useRegisterWatch } from '../hooks/useRegisterWatch';

interface VideoPlayerProps {
  videoId: string;
  src: string;
  poster: string;
  title: string;
  onWatchRegistered?: () => void;
}

export function VideoPlayer({ videoId, src, poster, title, onWatchRegistered }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasError, setHasError] = useState(false);
  const prevSrcRef = useRef(src);

  useRegisterWatch(videoId, videoRef, onWatchRegistered);

  useEffect(() => {
    if (prevSrcRef.current !== src) {
      const videoElement = videoRef.current;
      if (videoElement) {
        const currentTime = videoElement.currentTime;
        const isPlaying = !videoElement.paused;
        
        prevSrcRef.current = src;

        const handleLoadedMetadata = () => {
          videoElement.currentTime = currentTime;
          if (isPlaying) {
            videoElement.play().catch((err) => console.log('Auto-play failed after source change:', err));
          }
          videoElement.removeEventListener('loadedmetadata', handleLoadedMetadata);
        };

        videoElement.addEventListener('loadedmetadata', handleLoadedMetadata);
      }
    }
  }, [src]);

  if (hasError) {
    return (
      <div className="flex aspect-video w-full flex-col items-center justify-center gap-3 rounded-lg bg-black text-center">
        <AlertTriangle className="h-6 w-6 text-text-secondary" />
        <p className="max-w-sm px-6 text-sm text-text-secondary">
          Your browser can&apos;t play this video's format. Try a different browser, or download an updated player
          plugin.
        </p>
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      key={videoId}
      src={src}
      poster={poster}
      controls
      playsInline
      preload="metadata"
      aria-label={title}
      onError={() => setHasError(true)}
      className="aspect-video w-full rounded-lg bg-black shadow-lg"
    />
  );
}
