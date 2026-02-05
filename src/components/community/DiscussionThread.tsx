import React from 'react';
import { Heart, MessageCircle, Share2 } from 'lucide-react';

interface Reply {
  id: string;
  author: string;
  avatar: string;
  content: string;
  timestamp: Date;
  likes: number;
}

interface DiscussionThreadProps {
  id: string;
  title: string;
  author: string;
  avatar: string;
  content: string;
  commodity: string;
  timestamp: Date;
  likes: number;
  replies: Reply[];
  tags: string[];
  onLike?: () => void;
  onReply?: () => void;
}

export const DiscussionThread: React.FC<DiscussionThreadProps> = ({
  title,
  author,
  avatar,
  content,
  commodity,
  timestamp,
  likes,
  replies,
  tags,
  onLike,
  onReply,
}) => {
  const timeAgo = (date: Date) => {
    const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
    if (seconds < 60) return 'now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition">
      {}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3 flex-1">
          <img
            src={avatar}
            alt={author}
            className="w-10 h-10 rounded-full object-cover flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                {author}
              </h4>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {timeAgo(timestamp)}
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              in <span className="font-semibold">{commodity}</span>
            </p>
          </div>
        </div>
        <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs rounded-full flex-shrink-0">
          Discussion
        </span>
      </div>

      {}
      <h3 className="text-base font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
        {title}
      </h3>

      {}
      <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 line-clamp-3">
        {content}
      </p>

      {}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3">
          {tags.map((tag, i) => (
            <span
              key={i}
              className="px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer transition"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}

      {}
      <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4">
          <button
            onClick={onLike}
            className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition group"
          >
            <Heart
              size={16}
              className="group-hover:fill-red-500 group-hover:text-red-500"
            />
            <span className="text-xs font-medium">{likes}</span>
          </button>
          <button
            onClick={onReply}
            className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 transition"
          >
            <MessageCircle size={16} />
            <span className="text-xs font-medium">{replies.length}</span>
          </button>
          <button className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-green-500 dark:hover:text-green-400 transition">
            <Share2 size={16} />
            <span className="text-xs font-medium">Share</span>
          </button>
        </div>
      </div>

      {}
      {replies.length > 0 && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700 space-y-2">
          {replies.slice(0, 2).map((reply) => (
            <div key={reply.id} className="bg-gray-50 dark:bg-gray-700/30 p-2 rounded text-sm">
              <div className="flex items-center gap-2 mb-1">
                <img
                  src={reply.avatar}
                  alt={reply.author}
                  className="w-6 h-6 rounded-full object-cover"
                />
                <span className="font-semibold text-gray-900 dark:text-white text-xs">
                  {reply.author}
                </span>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {timeAgo(reply.timestamp)}
                </span>
              </div>
              <p className="text-xs text-gray-700 dark:text-gray-300 line-clamp-2">
                {reply.content}
              </p>
            </div>
          ))}
          {replies.length > 2 && (
            <button className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline w-full text-left">
              View {replies.length - 2} more replies
            </button>
          )}
        </div>
      )}
    </div>
  );
};
