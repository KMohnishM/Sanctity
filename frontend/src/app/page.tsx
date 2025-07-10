'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Comment, api, canRestoreComment } from '@/lib/api';

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const renderComment = (comment: Comment, depth = 0) => (
    <div key={comment.id} className={`border-l-2 border-gray-200 pl-4 ${depth > 0 ? 'ml-4' : ''}`}>
      <div className="bg-white p-4 rounded-lg shadow mb-4">
        <div className="flex justify-between items-start">
          <div>
            <div className="font-semibold text-gray-900">{comment.username}</div>
            <div className="text-sm text-gray-500">{formatDate(comment.createdAt)}</div>
            {/* Debug info */}
            <div className="text-xs text-gray-400">
              isDeleted: {comment.isDeleted ? 'true' : 'false'} | 
              deletedAt: {comment.deletedAt || 'null'} | 
              userId: {comment.userId} | 
              currentUser: {user?.id}
            </div>
          </div>
          {user && comment.userId === user.id && (
            <div className="flex space-x-2">
              {comment.canEdit && !comment.isDeleted && (
                <button 
                  onClick={() => {
                    setEditingComment(comment.id);
                    setEditContent(comment.content);
                  }}
                  className="text-blue-600 hover:text-blue-800 text-sm"
                >
                  Edit
                </button>
              )}
              {!comment.isDeleted ? (
                <button
                  onClick={() => handleDeleteComment(comment.id)}
                  className="text-red-600 hover:text-red-800 text-sm"
                >
                  Delete
                </button>
              ) : canRestoreComment(comment) && (
                <button
                  onClick={() => handleRestoreComment(comment.id)}
                  className="text-green-600 hover:text-green-800 text-sm"
                >
                  Restore
                </button>
              )}
            </div>
          )}
        </div>
        
        {!comment.isDeleted ? (
          <div className="mt-2 text-gray-700">{comment.content}</div>
        ) : canRestoreComment(comment) ? (
          <div className="mt-2 text-gray-400 italic">[Comment deleted]</div>
        ) : null}

        {!comment.isDeleted && user && (
          <div className="mt-3">
            <button
              onClick={() => setReplyingTo(comment.id)}
              className="text-blue-600 hover:text-blue-800 text-sm"
            >
              Reply
            </button>
          </div>
        )}

        {replyingTo === comment.id && (
          <form onSubmit={handleSubmitReply} className="mt-3">
            <textarea
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="Write your reply..."
              className="w-full p-2 border border-gray-300 rounded-md"
              rows={3}
            />
            <div className="mt-2 flex space-x-2">
              <button
                type="submit"
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
              >
                Reply
              </button>
              <button
                type="button"
                onClick={() => {
                  setReplyingTo(null);
                  setReplyContent('');
                }}
                className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm"
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
              className="w-full p-2 border border-gray-300 rounded-md"
              rows={3}
            />
            <div className="mt-2 flex space-x-2">
              <button
                type="submit"
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditingComment(null);
                  setEditContent('');
                }}
                className="px-3 py-1 bg-gray-300 text-gray-700 rounded text-sm"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-4">
            {comment.replies
              .filter(reply => !reply.isDeleted || canRestoreComment(reply))
              .map(reply => renderComment(reply, depth + 1))}
          </div>
        )}
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
