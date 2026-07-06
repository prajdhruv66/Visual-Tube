import { useState } from 'react';
import toast from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { commentSchema, type CommentFormValues } from '@/schemas/comment';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/feedback/EmptyState';
import { ErrorState } from '@/components/feedback/ErrorState';
import { MessageSquare } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useAddComment, useComments, useCommentLike, useDeleteComment, useEditComment } from '../hooks/useComments';
import { CommentItem } from './CommentItem';
import { getErrorMessage } from '@/services/api/apiClient';

export function CommentSection({ videoId }: { videoId: string }) {
  const { user } = useAuth();
  const commentsQuery = useComments(videoId);
  const addComment = useAddComment(videoId);
  const editComment = useEditComment(videoId);
  const deleteComment = useDeleteComment(videoId);
  const likeComment = useCommentLike(videoId);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CommentFormValues>({ resolver: zodResolver(commentSchema) });

  const onSubmit = async (values: CommentFormValues) => {
    setIsSubmitting(true);
    try {
      await addComment.mutateAsync(values.content);
      reset();
    } catch (error) {
      toast.error(getErrorMessage(error, 'Could not post your comment.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const comments = commentsQuery.data?.pages.flatMap((p) => p.items) ?? [];

  return (
    <section className="mt-8">
      <h2 className="mb-4 text-sm font-semibold text-text-primary">
        {comments.length > 0 ? `${comments.length} Comments` : 'Comments'}
      </h2>

      {user && (
        <form onSubmit={handleSubmit(onSubmit)} className="mb-6 flex gap-3">
          <Avatar src={user.avatar} alt={user.username} size="sm" />
          <div className="flex-1">
            <textarea
              placeholder="Add a comment..."
              className="min-h-[44px] w-full resize-y border-b border-border bg-transparent py-1 text-sm text-text-primary placeholder:text-text-tertiary focus:border-accent focus:outline-none"
              {...register('content')}
            />
            {errors.content && <p className="mt-1 text-xs text-danger">{errors.content.message}</p>}
            <div className="mt-2 flex justify-end">
              <Button type="submit" size="sm" isLoading={isSubmitting}>
                Comment
              </Button>
            </div>
          </div>
        </form>
      )}

      {commentsQuery.isLoading && (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      )}

      {commentsQuery.isError && (
        <ErrorState message={getErrorMessage(commentsQuery.error)} onRetry={() => commentsQuery.refetch()} />
      )}

      {!commentsQuery.isLoading && !commentsQuery.isError && comments.length === 0 && (
        <EmptyState icon={MessageSquare} title="No comments yet" description="Be the first to share your thoughts." />
      )}

      <div className="flex flex-col gap-5">
        {comments.map((comment) => (
          <CommentItem
            key={comment._id}
            comment={comment}
            onLike={(id) => likeComment.mutate(id)}
            onEdit={(id, content) => editComment.mutateAsync({ commentId: id, content })}
            onDelete={(id) => deleteComment.mutate(id)}
          />
        ))}
      </div>

      {commentsQuery.hasNextPage && (
        <div className="mt-4 flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => commentsQuery.fetchNextPage()}
            isLoading={commentsQuery.isFetchingNextPage}
          >
            Load more comments
          </Button>
        </div>
      )}
    </section>
  );
}
