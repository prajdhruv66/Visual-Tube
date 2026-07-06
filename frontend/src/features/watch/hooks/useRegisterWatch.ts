import { useEffect, useRef, type RefObject } from 'react';
import { videoApi } from '@/services/api/videoApi';

/**
 * Attaches to a <video> element and calls `POST /videos/:id/watch` once,
 * after 20% of the video duration is played, matching the new progress rule.
 */
export function useRegisterWatch(
  videoId: string | undefined,
  videoRef: RefObject<HTMLVideoElement | null>,
  onRegistered?: () => void
) {
  const hasRegisteredRef = useRef(false);

  useEffect(() => {
    hasRegisteredRef.current = false;
  }, [videoId]);

  useEffect(() => {
    const el = videoRef.current;
    if (!el || !videoId) return;

    const handleTimeUpdate = () => {
      if (hasRegisteredRef.current) return;
      if (el.duration && el.currentTime >= el.duration * 0.2) {
        hasRegisteredRef.current = true;
        console.log("Registering watch for video:", videoId);
        videoApi
          .registerWatch(videoId)
          .then(() => {
            console.log("Watch registered successfully, calling onRegistered callback");
            onRegistered?.();
          })
          .catch((error) => {
            console.error("Error registering watch:", error);
            /* non-critical: a missed watch registration shouldn't disrupt playback */
          });
      }
    };

    el.addEventListener('timeupdate', handleTimeUpdate);

    return () => {
      el.removeEventListener('timeupdate', handleTimeUpdate);
    };
  }, [videoId, videoRef, onRegistered]);
}
