import { useRef, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { useRegisterWatch } from '../hooks/useRegisterWatch';

interface VideoPlayerProps {
  videoId: string;
  src: string;
  poster: string;
  title: string;
  onWatchRegistered?: () => void;
}

/**
 * Plays whatever URL/format the backend returns (mp4, webm, mkv, ...)
 * without inspecting the file extension — the browser's <video> element
 * negotiates playback support on its own. If a format truly isn't
 * supported by the viewer's browser, we show a friendly fallback instead
 * of a blank/broken player.
 */
export function VideoPlayer({ videoId, src, poster, title, onWatchRegistered }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hasError, setHasError] = useState(false);

  useRegisterWatch(videoId, videoRef, onWatchRegistered);

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
      className="aspect-video w-full rounded-lg bg-black"
    />
  );
}
