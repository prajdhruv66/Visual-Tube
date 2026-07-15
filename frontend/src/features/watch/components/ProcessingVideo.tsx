import { Link } from 'react-router-dom';
import { Loader2, AlertCircle, Clock, Home } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ProcessingVideoProps {
  status?: 'queued' | 'processing' | 'failed' | string;
}

export function ProcessingVideo({ status }: ProcessingVideoProps) {
  const isFailed = status === 'failed';
  
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-8 text-center bg-surface-1 rounded-xl border border-border shadow-xl max-w-xl mx-auto my-12 animate-fade-in">
      <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-surface-2 shadow-inner">
        {isFailed ? (
          <AlertCircle className="h-10 w-10 text-error animate-pulse" />
        ) : (
          <>
            <Clock className="h-10 w-10 text-accent animate-pulse" />
            <Loader2 className="absolute inset-0 h-20 w-20 animate-spin text-accent opacity-25" />
          </>
        )}
      </div>

      <h2 className="font-display text-2xl font-bold text-text-primary">
        {isFailed ? 'Video Processing Failed' : 'Video is being processed.'}
      </h2>

      <p className="mt-3 text-sm text-text-secondary max-w-md">
        {isFailed 
          ? 'An error occurred during transcoding. Please try re-uploading the video or contact support if the issue persists.' 
          : 'We are generating multiple streaming resolutions for this video. It will be available shortly.'}
      </p>

      <div className="mt-8 flex items-center justify-center gap-4">
        <Link to="/">
          <Button variant="primary" className="flex items-center gap-2">
            <Home className="h-4 w-4" />
            Go to Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
