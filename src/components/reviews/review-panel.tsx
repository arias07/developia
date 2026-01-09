'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  MessageSquare,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  ThumbsUp,
  ThumbsDown,
  AlertCircle,
  FileText,
  Image as ImageIcon,
  Loader2,
  Plus,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface Review {
  id: string;
  project_id: string;
  user_id: string;
  milestone_id?: string;
  title: string;
  description: string;
  status: 'pending' | 'approved' | 'rejected' | 'changes_requested';
  feedback?: string;
  attachments?: string[];
  created_at: string;
  updated_at: string;
  reviewer_name?: string;
}

interface ReviewComment {
  id: string;
  review_id: string;
  user_id: string;
  content: string;
  is_admin: boolean;
  created_at: string;
  user_name?: string;
}

interface ReviewPanelProps {
  projectId: string;
  isAdmin?: boolean;
}

const statusConfig = {
  pending: {
    label: 'Pendiente de Revisión',
    color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    icon: Clock,
  },
  approved: {
    label: 'Aprobado',
    color: 'bg-green-500/20 text-green-400 border-green-500/30',
    icon: CheckCircle,
  },
  rejected: {
    label: 'Rechazado',
    color: 'bg-red-500/20 text-red-400 border-red-500/30',
    icon: XCircle,
  },
  changes_requested: {
    label: 'Cambios Solicitados',
    color: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
    icon: AlertCircle,
  },
};

export function ReviewPanel({ projectId, isAdmin = false }: ReviewPanelProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [comments, setComments] = useState<Record<string, ReviewComment[]>>({});
  const [expandedReview, setExpandedReview] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<string | null>(null);
  const [showNewReview, setShowNewReview] = useState(false);
  const [newReview, setNewReview] = useState({
    title: '',
    description: '',
  });
  const supabase = createClient();

  useEffect(() => {
    fetchReviews();
  }, [projectId]);

  async function fetchReviews() {
    try {
      const { data, error } = await supabase
        .from('reviews')
        .select(`
          *,
          reviewer:profiles!reviews_user_id_fkey(full_name)
        `)
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching reviews:', error);
        setReviews([]);
      } else {
        const formattedReviews = (data || []).map((review: any) => ({
          ...review,
          reviewer_name: review.reviewer?.full_name || 'Usuario',
        }));
        setReviews(formattedReviews);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchComments(reviewId: string) {
    try {
      const { data, error } = await supabase
        .from('review_comments')
        .select(`
          *,
          commenter:profiles!review_comments_user_id_fkey(full_name)
        `)
        .eq('review_id', reviewId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('Error fetching comments:', error);
        setComments((prev) => ({
          ...prev,
          [reviewId]: [],
        }));
      } else {
        const formattedComments = (data || []).map((comment: any) => ({
          ...comment,
          user_name: comment.commenter?.full_name || (comment.is_admin ? 'Equipo Devvy' : 'Usuario'),
        }));
        setComments((prev) => ({
          ...prev,
          [reviewId]: formattedComments,
        }));
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      setComments((prev) => ({
        ...prev,
        [reviewId]: [],
      }));
    }
  }

  function toggleReview(reviewId: string) {
    if (expandedReview === reviewId) {
      setExpandedReview(null);
    } else {
      setExpandedReview(reviewId);
      if (!comments[reviewId]) {
        fetchComments(reviewId);
      }
    }
  }

  async function handleAddComment(reviewId: string) {
    const content = newComment[reviewId]?.trim();
    if (!content) return;

    setSubmitting(reviewId);
    try {
      const { error } = await supabase.from('review_comments').insert({
        review_id: reviewId,
        content,
        is_admin: isAdmin,
      });

      if (error) throw error;

      // Add optimistically
      const newCommentData: ReviewComment = {
        id: crypto.randomUUID(),
        review_id: reviewId,
        user_id: 'current',
        content,
        is_admin: isAdmin,
        created_at: new Date().toISOString(),
        user_name: isAdmin ? 'Equipo Devvy' : 'Tú',
      };

      setComments((prev) => ({
        ...prev,
        [reviewId]: [...(prev[reviewId] || []), newCommentData],
      }));
      setNewComment((prev) => ({ ...prev, [reviewId]: '' }));
    } catch (error) {
      console.error('Error adding comment:', error);
    } finally {
      setSubmitting(null);
    }
  }

  async function handleStatusChange(reviewId: string, status: Review['status'], feedback?: string) {
    try {
      const { error } = await supabase
        .from('reviews')
        .update({ status, feedback, updated_at: new Date().toISOString() })
        .eq('id', reviewId);

      if (error) throw error;

      setReviews((prev) =>
        prev.map((r) =>
          r.id === reviewId ? { ...r, status, feedback, updated_at: new Date().toISOString() } : r
        )
      );
    } catch (error) {
      console.error('Error updating review status:', error);
    }
  }

  async function handleCreateReview() {
    if (!newReview.title.trim() || !newReview.description.trim()) return;

    setSubmitting('new');
    try {
      const reviewData: Review = {
        id: crypto.randomUUID(),
        project_id: projectId,
        user_id: 'current',
        title: newReview.title,
        description: newReview.description,
        status: 'pending',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        reviewer_name: isAdmin ? 'Equipo Devvy' : 'Cliente',
      };

      const { error } = await supabase.from('reviews').insert(reviewData);

      if (error) throw error;

      setReviews((prev) => [reviewData, ...prev]);
      setNewReview({ title: '', description: '' });
      setShowNewReview(false);
    } catch (error) {
      console.error('Error creating review:', error);
    } finally {
      setSubmitting(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-500/20">
            <MessageSquare className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white">Revisiones y Feedback</h3>
            <p className="text-sm text-slate-400">
              {reviews.length} revisiones en total
            </p>
          </div>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowNewReview(true)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nueva Revisión
          </button>
        )}
      </div>

      {/* New Review Form */}
      {showNewReview && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 space-y-4">
          <h4 className="font-medium text-white">Crear Nueva Revisión</h4>
          <input
            type="text"
            value={newReview.title}
            onChange={(e) => setNewReview((prev) => ({ ...prev, title: e.target.value }))}
            placeholder="Título de la revisión"
            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
          />
          <textarea
            value={newReview.description}
            onChange={(e) => setNewReview((prev) => ({ ...prev, description: e.target.value }))}
            placeholder="Describe lo que necesitas que el cliente revise..."
            rows={4}
            className="w-full px-4 py-3 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none"
          />
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setShowNewReview(false)}
              className="px-4 py-2 text-slate-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleCreateReview}
              disabled={submitting === 'new'}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {submitting === 'new' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Enviar para Revisión
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { status: 'pending', count: reviews.filter((r) => r.status === 'pending').length },
          { status: 'approved', count: reviews.filter((r) => r.status === 'approved').length },
          { status: 'changes_requested', count: reviews.filter((r) => r.status === 'changes_requested').length },
          { status: 'rejected', count: reviews.filter((r) => r.status === 'rejected').length },
        ].map(({ status, count }) => {
          const config = statusConfig[status as keyof typeof statusConfig];
          const Icon = config.icon;
          return (
            <div
              key={status}
              className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4 text-center"
            >
              <Icon className={`h-5 w-5 mx-auto mb-2 ${config.color.split(' ')[1]}`} />
              <p className="text-2xl font-bold text-white">{count}</p>
              <p className="text-xs text-slate-400">{config.label}</p>
            </div>
          );
        })}
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <div className="text-center py-12 text-slate-400">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No hay revisiones pendientes</p>
          </div>
        ) : (
          reviews.map((review) => {
            const config = statusConfig[review.status];
            const StatusIcon = config.icon;
            const isExpanded = expandedReview === review.id;
            const reviewComments = comments[review.id] || [];

            return (
              <div
                key={review.id}
                className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden"
              >
                {/* Review Header */}
                <div
                  className="p-6 cursor-pointer hover:bg-slate-800/70 transition-colors"
                  onClick={() => toggleReview(review.id)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-medium text-white">{review.title}</h4>
                        <span
                          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}
                        >
                          <StatusIcon className="h-3 w-3" />
                          {config.label}
                        </span>
                      </div>
                      <p className="text-sm text-slate-400 line-clamp-2">
                        {review.description}
                      </p>
                      <div className="flex items-center gap-4 mt-3 text-xs text-slate-500">
                        <span>Por {review.reviewer_name}</span>
                        <span>
                          {new Date(review.created_at).toLocaleDateString('es-MX', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    </div>
                    <button className="text-slate-400">
                      {isExpanded ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </button>
                  </div>

                  {/* Feedback if exists */}
                  {review.feedback && (
                    <div className="mt-4 p-4 bg-slate-900/50 rounded-lg border-l-4 border-purple-500">
                      <p className="text-sm text-slate-300">{review.feedback}</p>
                    </div>
                  )}
                </div>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="border-t border-slate-700 p-6 space-y-6">
                    {/* Full Description */}
                    <div>
                      <h5 className="text-sm font-medium text-slate-400 mb-2">
                        Descripción Completa
                      </h5>
                      <p className="text-sm text-slate-300">{review.description}</p>
                    </div>

                    {/* Action Buttons (for client) */}
                    {!isAdmin && review.status === 'pending' && (
                      <div className="flex items-center gap-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusChange(review.id, 'approved', 'Aprobado por el cliente');
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
                        >
                          <ThumbsUp className="h-4 w-4" />
                          Aprobar
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const feedback = prompt('¿Qué cambios necesitas?');
                            if (feedback) {
                              handleStatusChange(review.id, 'changes_requested', feedback);
                            }
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
                        >
                          <AlertCircle className="h-4 w-4" />
                          Solicitar Cambios
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const feedback = prompt('¿Por qué rechazas esta revisión?');
                            if (feedback) {
                              handleStatusChange(review.id, 'rejected', feedback);
                            }
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                        >
                          <ThumbsDown className="h-4 w-4" />
                          Rechazar
                        </button>
                      </div>
                    )}

                    {/* Comments Section */}
                    <div>
                      <h5 className="text-sm font-medium text-slate-400 mb-4">
                        Comentarios ({reviewComments.length})
                      </h5>

                      {reviewComments.length > 0 && (
                        <div className="space-y-3 mb-4">
                          {reviewComments.map((comment) => (
                            <div
                              key={comment.id}
                              className={`p-4 rounded-lg ${
                                comment.is_admin
                                  ? 'bg-purple-500/10 border border-purple-500/20'
                                  : 'bg-slate-900/50 border border-slate-700'
                              }`}
                            >
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-sm font-medium text-white">
                                  {comment.user_name}
                                </span>
                                {comment.is_admin && (
                                  <span className="text-xs px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded">
                                    Equipo
                                  </span>
                                )}
                                <span className="text-xs text-slate-500">
                                  {new Date(comment.created_at).toLocaleString('es-MX')}
                                </span>
                              </div>
                              <p className="text-sm text-slate-300">{comment.content}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Add Comment */}
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newComment[review.id] || ''}
                          onChange={(e) =>
                            setNewComment((prev) => ({
                              ...prev,
                              [review.id]: e.target.value,
                            }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleAddComment(review.id);
                            }
                          }}
                          placeholder="Agregar un comentario..."
                          className="flex-1 px-4 py-2 bg-slate-900/50 border border-slate-700 rounded-lg text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        />
                        <button
                          onClick={() => handleAddComment(review.id)}
                          disabled={submitting === review.id || !newComment[review.id]?.trim()}
                          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors disabled:opacity-50"
                        >
                          {submitting === review.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
