import { useState } from 'react';
import { Heart, MessageCircle, Send } from 'lucide-react';

interface Comment {
  id: number;
  discussion_id: number;
  author: string;
  avatar_url: string;
  content: string;
  likes_count: number;
  created_at: string;
}

interface CommentsSectionProps {
  discussionId: number;
  comments: Comment[];
  onAddComment: (content: string) => Promise<void>;
  onLikeComment: (commentId: number) => Promise<void>;
}

function timeAgo(dateString: string): string {
  const date = new Date(dateString);
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function CommentsSection({
  discussionId,
  comments = [],
  onAddComment,
  onLikeComment,
}: CommentsSectionProps) {
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Ensure comments is always an array
  const safeComments = Array.isArray(comments) ? comments : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    setIsSubmitting(true);
    try {
      await onAddComment(newComment);
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Comment Form */}
      <form onSubmit={handleSubmit} className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-4">
        <div className="flex gap-3">
          <img
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=user`}
            alt="Your avatar"
            className="w-10 h-10 rounded-full flex-shrink-0 ring-2 ring-gray-200 dark:ring-gray-600"
          />
          <div className="flex-1">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              rows={3}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none text-sm"
            />
            <div className="flex justify-end mt-2">
              <button
                type="submit"
                disabled={isSubmitting || !newComment.trim()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition text-sm flex items-center gap-2"
              >
                <Send size={16} />
                {isSubmitting ? 'Posting...' : 'Post Comment'}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Comments List */}
      <div className="space-y-3">
        {safeComments.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <MessageCircle size={48} className="mx-auto mb-2 opacity-50" />
            <p>No comments yet. Be the first to comment!</p>
          </div>
        ) : (
          safeComments.map((comment) => (
            <div
              key={comment.id}
              className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
            >
              <div className="flex gap-3">
                <img
                  src={comment.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.author}`}
                  alt={comment.author}
                  className="w-10 h-10 rounded-full flex-shrink-0 ring-2 ring-gray-200 dark:ring-gray-700"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-semibold text-gray-900 dark:text-white text-sm">
                      {comment.author}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {timeAgo(comment.created_at)}
                    </span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300 text-sm mb-3 whitespace-pre-wrap">
                    {comment.content}
                  </p>
                  <button
                    onClick={() => onLikeComment(comment.id)}
                    className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition text-sm font-medium"
                  >
                    <Heart size={14} />
                    <span>{comment.likes_count}</span>
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
