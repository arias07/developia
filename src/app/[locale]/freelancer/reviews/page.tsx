'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Star,
  MessageSquare,
  ThumbsUp,
  Calendar,
  Briefcase,
  Loader2,
  StarHalf,
} from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/auth-store';
import type { FreelancerProfile } from '@/types/database';

interface Review {
  id: string;
  project_id: string;
  project_name: string;
  client_name: string;
  rating: number;
  comment: string;
  created_at: string;
  task_type?: string;
}

const content = {
  es: {
    title: 'Mis Reseñas',
    subtitle: 'Feedback de tus clientes y proyectos',
    stats: {
      overall: 'Calificación General',
      total: 'Total de Reseñas',
      projects: 'Proyectos Completados',
    },
    distribution: 'Distribución de Calificaciones',
    reviews: 'Reseñas Recientes',
    noReviews: 'Aún no tienes reseñas',
    noReviewsDesc: 'Las reseñas aparecerán aquí cuando completes proyectos',
  },
  en: {
    title: 'My Reviews',
    subtitle: 'Feedback from your clients and projects',
    stats: {
      overall: 'Overall Rating',
      total: 'Total Reviews',
      projects: 'Projects Completed',
    },
    distribution: 'Rating Distribution',
    reviews: 'Recent Reviews',
    noReviews: 'No reviews yet',
    noReviewsDesc: 'Reviews will appear here when you complete projects',
  },
};


function StarRating({ rating }: { rating: number }) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);

  return (
    <div className="flex items-center gap-0.5">
      {[...Array(fullStars)].map((_, i) => (
        <Star key={`full-${i}`} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
      ))}
      {hasHalfStar && <StarHalf className="w-4 h-4 fill-yellow-400 text-yellow-400" />}
      {[...Array(emptyStars)].map((_, i) => (
        <Star key={`empty-${i}`} className="w-4 h-4 text-slate-600" />
      ))}
    </div>
  );
}

export default function FreelancerReviewsPage() {
  const locale = useLocale();
  const t = content[locale as keyof typeof content] || content.es;
  const { user } = useAuthStore();

  const [profile, setProfile] = useState<FreelancerProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      const supabase = getSupabaseClient();

      // Fetch profile
      const { data: profileData } = await supabase
        .from('freelancer_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileData) {
        setProfile(profileData as FreelancerProfile);

        // Fetch real reviews from database
        const { data: reviewsData } = await supabase
          .from('freelancer_reviews')
          .select(`
            id,
            rating,
            comment,
            created_at,
            project:projects(id, name, project_type),
            reviewer:profiles(full_name)
          `)
          .eq('freelancer_id', profileData.id)
          .order('created_at', { ascending: false });

        if (reviewsData) {
          const formattedReviews: Review[] = reviewsData.map((review: {
            id: string;
            rating: number;
            comment: string;
            created_at: string;
            project: { id: string; name: string; project_type?: string } | null;
            reviewer: { full_name: string } | null;
          }) => ({
            id: review.id,
            project_id: review.project?.id || '',
            project_name: review.project?.name || 'Proyecto',
            client_name: review.reviewer?.full_name || 'Cliente',
            rating: review.rating,
            comment: review.comment || '',
            created_at: review.created_at,
            task_type: review.project?.project_type,
          }));
          setReviews(formattedReviews);
        }
      }

      setLoading(false);
    };

    fetchData();
  }, [user]);

  // Calculate rating distribution
  const ratingDistribution = [5, 4, 3, 2, 1].map((rating) => ({
    rating,
    count: reviews.filter((r) => Math.floor(r.rating) === rating).length,
    percentage:
      reviews.length > 0
        ? (reviews.filter((r) => Math.floor(r.rating) === rating).length / reviews.length) * 100
        : 0,
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Star className="w-8 h-8 text-yellow-400" />
          {t.title}
        </h1>
        <p className="text-slate-400 mt-1">{t.subtitle}</p>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid md:grid-cols-3 gap-4"
      >
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">{t.stats.overall}</p>
                <p className="text-4xl font-bold text-white mt-1">
                  {profile?.average_rating?.toFixed(1) || '0.0'}
                </p>
                <StarRating rating={profile?.average_rating || 0} />
              </div>
              <div className="p-4 rounded-full bg-yellow-500/20">
                <Star className="w-8 h-8 text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">{t.stats.total}</p>
                <p className="text-4xl font-bold text-white mt-1">
                  {profile?.total_reviews || reviews.length}
                </p>
              </div>
              <div className="p-4 rounded-full bg-blue-500/20">
                <MessageSquare className="w-8 h-8 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400">{t.stats.projects}</p>
                <p className="text-4xl font-bold text-white mt-1">
                  {profile?.total_projects_completed || 0}
                </p>
              </div>
              <div className="p-4 rounded-full bg-emerald-500/20">
                <Briefcase className="w-8 h-8 text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Rating Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">{t.distribution}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {ratingDistribution.map(({ rating, count, percentage }) => (
                <div key={rating} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1">
                      <span className="text-white">{rating}</span>
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    </div>
                    <span className="text-slate-400">{count}</span>
                  </div>
                  <Progress value={percentage} className="h-2 bg-slate-700" />
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Reviews List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-2"
        >
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">{t.reviews}</CardTitle>
            </CardHeader>
            <CardContent>
              {reviews.length === 0 ? (
                <div className="text-center py-12">
                  <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                  <p className="text-white mb-2">{t.noReviews}</p>
                  <p className="text-slate-400 text-sm">{t.noReviewsDesc}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review, index) => (
                    <motion.div
                      key={review.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="p-4 rounded-lg bg-slate-900/50 border border-slate-700"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-white font-medium">{review.project_name}</p>
                          <p className="text-sm text-slate-400">{review.client_name}</p>
                        </div>
                        <div className="text-right">
                          <StarRating rating={review.rating} />
                          <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(review.created_at).toLocaleDateString(
                              locale === 'es' ? 'es-MX' : 'en-US'
                            )}
                          </div>
                        </div>
                      </div>

                      <p className="text-slate-300 text-sm">{review.comment}</p>

                      {review.task_type && (
                        <div className="mt-3">
                          <Badge variant="outline" className="border-slate-600 text-slate-400">
                            {review.task_type}
                          </Badge>
                        </div>
                      )}

                      <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-700">
                        <button className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors">
                          <ThumbsUp className="w-3 h-3" />
                          Helpful
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
