import { useState, useEffect } from 'react';
import { X, Tag, MapPin, Package } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';

interface CreatePostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (post: PostData) => Promise<void>;
}

interface PostData {
  title: string;
  content: string;
  commodity: string;
  market?: string;
  tags: string[];
  author: string;
}

interface Commodity {
  id: number;
  name: string;
}

interface Market {
  id: number;
  name: string;
  state?: string;
}

export function CreatePostModal({ isOpen, onClose, onSubmit }: CreatePostModalProps) {
  const { user } = useUser();
  const authorName = user?.fullName || user?.username || 'Anonymous';
  
  const [formData, setFormData] = useState<PostData>({
    title: '',
    content: '',
    commodity: '',
    market: '',
    tags: [],
    author: authorName,
  });
  const [tagInput, setTagInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [commodities, setCommodities] = useState<Commodity[]>([]);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [loading, setLoading] = useState(true);
  const [validationError, setValidationError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchData();
    }
  }, [isOpen]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [commoditiesRes, marketsRes] = await Promise.all([
        fetch('http://localhost:8000/api/commodities'),
        fetch('http://localhost:8000/api/markets'),
      ]);

      if (commoditiesRes.ok) {
        const commoditiesData = await commoditiesRes.json();
        setCommodities(commoditiesData);
      }

      if (marketsRes.ok) {
        const marketsData = await marketsRes.json();
        setMarkets(marketsData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags.includes(tagInput.trim())) {
      setFormData({ ...formData, tags: [...formData.tags, tagInput.trim()] });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tag: string) => {
    setFormData({ ...formData, tags: formData.tags.filter((t) => t !== tag) });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    // console.log('Form data on submit:', formData);

    if (!formData.title?.trim()) {
      // console.log('Title validation failed');
      setValidationError('Please enter a title');
      return;
    }
    if (!formData.content?.trim()) {
      // console.log('Content validation failed');
      setValidationError('Please enter content');
      return;
    }
    if (!formData.commodity?.trim()) {
      console.log('Commodity validation failed:', formData.commodity);
      setValidationError('Please select a commodity');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({ ...formData, author: authorName });
      setFormData({
        title: '',
        content: '',
        commodity: '',
        market: '',
        tags: [],
        author: authorName,
      });
      setValidationError('');
      onClose();
    } catch (error) {
      console.error('Error submitting post:', error);
      setValidationError('Failed to create post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create New Post</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
          >
            <X size={20} className="text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {validationError && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
              {validationError}
            </div>
          )}

          {/* Author */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Your Name
            </label>
            <input
              type="text"
              value={authorName}
              readOnly
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 cursor-not-allowed"
            />
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="What's your discussion about?"
              required
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Content *
            </label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="Share your thoughts, experiences, or questions..."
              required
              rows={6}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Commodity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <Package size={16} className="inline mr-1" />
                Commodity *
              </label>
              <select
                value={formData.commodity}
                onChange={(e) => {
                  console.log('Commodity selected:', e.target.value);
                  setFormData({ ...formData, commodity: e.target.value });
                }}
                required
                disabled={loading}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Select commodity</option>
                {commodities.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Market */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                <MapPin size={16} className="inline mr-1" />
                Market (Optional)
              </label>
              <select
                value={formData.market}
                onChange={(e) => setFormData({ ...formData, market: e.target.value })}
                disabled={loading}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Select market</option>
                {markets.map((m) => (
                  <option key={m.id} value={m.name}>
                    {m.name} {m.state && `(${m.state})`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              <Tag size={16} className="inline mr-1" />
              Tags (Optional)
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                placeholder="Add a tag (press Enter)"
                className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {formData.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 rounded-full text-sm flex items-center gap-2"
                >
                  #{tag}
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-emerald-600 dark:hover:text-emerald-200"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !formData.title.trim() || !formData.content.trim() || !formData.commodity?.trim()}
              className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white rounded-lg font-medium transition"
            >
              {isSubmitting ? 'Posting...' : 'Post Discussion'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
