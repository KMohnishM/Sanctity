'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Comment, api, canRestoreComment } from '@/lib/api';
import { formatDistanceToNow } from 'date-fns';

export default function HomePage() {
  const { user, logout, loading, socket } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [loadingComments, setLoadingComments] = useState(true);

  useEffect(() => {
    if (user) {
      loadComments();
    }
  }, [user]);

  useEffect(() => {
    if (!socket) return;
    const handler = () => {
      loadComments();
    };
    socket.on('comment:new', handler);
    return () => { socket.off('comment:new', handler); };
  }, [socket]);

  const loadComments = async () => {
    try {
      const response = await api.getComments();
      setComments(response.comments);
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setLoadingComments(false);
    }
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    try {
      await api.createComment({ content: newComment });
      setNewComment('');
      loadComments();
    } catch (error) {
      console.error('Failed to create comment:', error);
    }
  };

  const handleSubmitReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyContent.trim() || !replyingTo) return;

    try {
      await api.createComment({ content: replyContent, parentId: replyingTo });
      setReplyContent('');
      setReplyingTo(null);
      loadComments();
    } catch (error) {
      console.error('Failed to create reply:', error);
    }
  };

  const handleDeleteComment = async (id: string) => {
    try {
      const result = await api.deleteComment(id);
      console.log('Delete result:', result);
      loadComments();
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  const handleEditComment = async (id: string) => {
    try {
      await api.updateComment(id, { content: editContent });
      setEditingComment(null);
      setEditContent('');
      loadComments();
    } catch (error) {
      console.error('Failed to edit comment:', error);
    }
  };

  const handleRestoreComment = async (id: string) => {
    try {
      await api.restoreComment(id);
      loadComments();
    } catch (error) {
      console.error('Failed to restore comment:', error);
    }
  };

  const renderComment = (comment: Comment, depth = 0) => (
    <div
      key={comment.id}
      className={`relative ${depth > 0 ? 'ml-8' : ''} mt-2`}
    >
      {depth > 0 && (
        <span className="absolute left-0 top-6 w-4 h-full border-l-2 border-indigo-100" />
      )}
      <div className={`flex items-start space-x-3 bg-white rounded-xl shadow-sm p-4 mb-2 transition hover:shadow-md ${comment.isDeleted ? 'opacity-60' : ''}`}
        style={{ borderLeft: depth > 0 ? '4px solid #6366f1' : undefined }}
      >
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-200 flex items-center justify-center font-bold text-indigo-700 text-lg">
          {comment.username?.[0]?.toUpperCase() || '?'}
        </div>
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <span className="font-semibold text-gray-900">{comment.username}</span>
            <span className="text-xs text-gray-400">{formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}</span>
            {comment.isDeleted && <span className="ml-2 text-xs text-red-400">[Deleted]</span>}
          </div>
          {!comment.isDeleted ? (
            <div className="mt-1 text-gray-800 text-base">{comment.content}</div>
          ) : canRestoreComment(comment) ? (
            <div className="mt-1 text-gray-400 italic">[Comment deleted]</div>
          ) : null}
          <div className="flex items-center space-x-2 mt-2">
            {!comment.isDeleted && user && (
              <button
                onClick={() => setReplyingTo(comment.id)}
                className="text-indigo-600 hover:text-indigo-800 text-xs font-medium px-2 py-1 rounded transition"
              >
                Reply
              </button>
            )}
            {user && comment.userId === user.id && !comment.isDeleted && comment.canEdit && (
              <button
                onClick={() => {
                  setEditingComment(comment.id);
                  setEditContent(comment.content);
                }}
                className="text-blue-600 hover:text-blue-800 text-xs font-medium px-2 py-1 rounded transition"
              >
                Edit
              </button>
            )}
            {user && comment.userId === user.id && !comment.isDeleted && (
              <button
                onClick={() => handleDeleteComment(comment.id)}
                className="text-red-600 hover:text-red-800 text-xs font-medium px-2 py-1 rounded transition"
              >
                Delete
              </button>
            )}
            {user && comment.userId === user.id && comment.isDeleted && canRestoreComment(comment) && (
              <button
                onClick={() => handleRestoreComment(comment.id)}
                className="text-green-600 hover:text-green-800 text-xs font-medium px-2 py-1 rounded transition"
              >
                Restore
              </button>
            )}
          </div>
          {replyingTo === comment.id && (
            <form onSubmit={handleSubmitReply} className="mt-3">
              <textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Write your reply..."
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-400 focus:border-indigo-400 transition"
                rows={3}
              />
              <div className="mt-2 flex space-x-2">
                <button
                  type="submit"
                  className="px-3 py-1 bg-indigo-600 text-white rounded text-sm font-medium hover:bg-indigo-700 transition"
                >
                  Reply
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setReplyingTo(null);
                    setReplyContent('');
                  }}
                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm font-medium hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
          {editingComment === comment.id && (
            <form onSubmit={(e) => { e.preventDefault(); handleEditComment(comment.id); }} className="mt-3">
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                placeholder="Edit your comment..."
                className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:border-blue-400 transition"
                rows={3}
              />
              <div className="mt-2 flex space-x-2">
                <button
                  type="submit"
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 transition"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingComment(null);
                    setEditContent('');
                  }}
                  className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm font-medium hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
          {/* Render replies recursively */}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-2">
              {comment.replies.map(reply => renderComment(reply, depth + 1))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Welcome to Comment App</h1>
          <p className="mb-4">Please sign in to view and create comments.</p>
          <a
            href="/login"
            className="inline-block bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
          >
            Sign In
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-semibold">Comment App</h1>
          <div className="flex items-center space-x-4">
            <span className="text-gray-700">Welcome, {user.username}!</span>
            <button
              onClick={logout}
              className="text-gray-600 hover:text-gray-800"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmitComment} className="mb-8">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="w-full p-4 border border-gray-300 rounded-lg resize-none"
            rows={4}
          />
          <div className="mt-3">
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
            >
              Post Comment
            </button>
          </div>
        </form>

        <div>
          <h2 className="text-xl font-semibold mb-4">Comments</h2>
          {loadingComments ? (
            <div>Loading comments...</div>
          ) : comments.length === 0 ? (
            <div className="text-gray-500">No comments yet. Be the first to comment!</div>
          ) : (
            <div>
              {comments
                .filter(comment => {
                  const shouldShow = !comment.isDeleted || canRestoreComment(comment);
                  console.log(`Comment ${comment.id}: isDeleted=${comment.isDeleted}, canRestore=${canRestoreComment(comment)}, shouldShow=${shouldShow}`);
                  return shouldShow;
                })
                .map(comment => renderComment(comment))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
