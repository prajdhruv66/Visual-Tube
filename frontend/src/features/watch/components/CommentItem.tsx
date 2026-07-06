import { useState } from 'react';
import { ThumbsUp, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import type { Comment } from '@/types/models';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { formatRelativeTime } from '@/utils/format';
import { cn } from '@/utils/cn';
import { useAuth } from '@/context/AuthContext';

interface CommentItemProps {
  comment: Comment;
  onLike: (id: string) => void;
  onEdit: (id: string, content: string) => Promise<unknown>;
  onDelete: (id: string) => void;
}

export function CommentItem({ comment, onLike, onEdit, onDelete }: CommentItemProps) {
  const { user } = useAuth();
  const isOwn = user?._id === comment.owner._id;
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(comment.content);
  const [menuOpen, setMenuOpen] = useState(false);

  const submitEdit = async () => {
    if (draft.trim() && draft !== comment.content) {
      await onEdit(comment._id, draft.trim());
    }
    setIsEditing(false);
  };

  return (
    <div className="flex gap-3">
      <Avatar src={comment.owner.avatar} alt={comment.owner.username} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-text-primary">{comment.owner.fullname}</span>
          <span className="text-xs text-text-tertiary">{formatRelativeTime(comment.createdAt)}</span>
        </div>

        {isEditing ? (
          <div className="mt-1.5 flex flex-col gap-2">
            <textarea
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="min-h-[60px] rounded-md border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
            />
            <div className="flex gap-2">
              <Button size="sm" onClick={submitEdit}>
                Save
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <p className="mt-1 whitespace-pre-wrap text-sm text-text-primary">{comment.content}</p>
        )}

        <div className="mt-1.5 flex items-center gap-4">
          <button
            onClick={() => onLike(comment._id)}
            className={cn(
              'flex items-center gap-1.5 text-xs text-text-secondary hover:text-text-primary',
              comment.isLiked && 'text-accent-text'
            )}
          >
            <ThumbsUp className={cn('h-3.5 w-3.5', comment.isLiked && 'fill-current')} />
            {comment.likesCount > 0 && comment.likesCount}
          </button>

          {isOwn && !isEditing && (
            <div className="relative">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="rounded p-1 text-text-tertiary hover:bg-surface-2 hover:text-text-primary"
                aria-label="Comment options"
              >
                <MoreVertical className="h-3.5 w-3.5" />
              </button>
              {menuOpen && (
                <div className="absolute left-0 top-6 z-10 w-32 overflow-hidden rounded-md border border-border bg-surface py-1 shadow-xl">
                  <button
                    onClick={() => {
                      setIsEditing(true);
                      setMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-text-primary hover:bg-surface-2"
                  >
                    <Pencil className="h-3 w-3" /> Edit
                  </button>
                  <button
                    onClick={() => {
                      onDelete(comment._id);
                      setMenuOpen(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-left text-xs text-danger hover:bg-danger-muted"
                  >
                    <Trash2 className="h-3 w-3" /> Delete
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
