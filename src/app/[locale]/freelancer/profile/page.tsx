'use client';

import { useEffect, useState } from 'react';
import { useLocale } from 'next-intl';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  DollarSign,
  Github,
  Linkedin,
  Globe,
  FileText,
  Star,
  Clock,
  CheckCircle2,
  Edit2,
  Save,
  X,
  Loader2,
} from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/auth-store';
import type { FreelancerProfile } from '@/types/database';

const content = {
  es: {
    title: 'Mi Perfil',
    subtitle: 'Gestiona tu información profesional',
    tabs: {
      overview: 'General',
      skills: 'Habilidades',
      links: 'Enlaces',
    },
    sections: {
      personal: 'Información Personal',
      professional: 'Información Profesional',
      skills: 'Habilidades',
      links: 'Enlaces y Portafolio',
      stats: 'Estadísticas',
    },
    fields: {
      fullName: 'Nombre completo',
      email: 'Correo electrónico',
      phone: 'Teléfono',
      location: 'Ubicación',
      title: 'Título profesional',
      bio: 'Biografía',
      hourlyRate: 'Tarifa por hora (USD)',
      yearsExperience: 'Años de experiencia',
      primarySkills: 'Habilidades principales',
      secondarySkills: 'Habilidades secundarias',
      specializations: 'Especializaciones',
      languages: 'Idiomas',
      portfolioUrl: 'Portafolio',
      githubUrl: 'GitHub',
      linkedinUrl: 'LinkedIn',
      resumeUrl: 'CV/Resume',
    },
    stats: {
      rating: 'Calificación',
      reviews: 'reseñas',
      projects: 'Proyectos completados',
      tasks: 'Tareas completadas',
      earnings: 'Ganancias totales',
    },
    buttons: {
      edit: 'Editar',
      save: 'Guardar cambios',
      cancel: 'Cancelar',
      saving: 'Guardando...',
    },
    messages: {
      saved: 'Perfil actualizado correctamente',
      error: 'Error al actualizar el perfil',
    },
  },
  en: {
    title: 'My Profile',
    subtitle: 'Manage your professional information',
    tabs: {
      overview: 'Overview',
      skills: 'Skills',
      links: 'Links',
    },
    sections: {
      personal: 'Personal Information',
      professional: 'Professional Information',
      skills: 'Skills',
      links: 'Links & Portfolio',
      stats: 'Statistics',
    },
    fields: {
      fullName: 'Full name',
      email: 'Email',
      phone: 'Phone',
      location: 'Location',
      title: 'Professional title',
      bio: 'Bio',
      hourlyRate: 'Hourly rate (USD)',
      yearsExperience: 'Years of experience',
      primarySkills: 'Primary skills',
      secondarySkills: 'Secondary skills',
      specializations: 'Specializations',
      languages: 'Languages',
      portfolioUrl: 'Portfolio',
      githubUrl: 'GitHub',
      linkedinUrl: 'LinkedIn',
      resumeUrl: 'CV/Resume',
    },
    stats: {
      rating: 'Rating',
      reviews: 'reviews',
      projects: 'Projects completed',
      tasks: 'Tasks completed',
      earnings: 'Total earnings',
    },
    buttons: {
      edit: 'Edit',
      save: 'Save changes',
      cancel: 'Cancel',
      saving: 'Saving...',
    },
    messages: {
      saved: 'Profile updated successfully',
      error: 'Error updating profile',
    },
  },
};

export default function FreelancerProfilePage() {
  const locale = useLocale();
  const t = content[locale as keyof typeof content] || content.es;
  const { user } = useAuthStore();

  const [profile, setProfile] = useState<FreelancerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<FreelancerProfile>>({});

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      const supabase = getSupabaseClient();
      const { data } = await supabase
        .from('freelancer_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (data) {
        setProfile(data as FreelancerProfile);
        setFormData(data);
      }
      setLoading(false);
    };

    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    if (!profile) return;

    setSaving(true);
    const supabase = getSupabaseClient();

    const { error } = await supabase
      .from('freelancer_profiles')
      .update({
        full_name: formData.full_name,
        phone: formData.phone,
        city: formData.city,
        country: formData.country,
        title: formData.title,
        bio: formData.bio,
        hourly_rate: formData.hourly_rate,
        portfolio_url: formData.portfolio_url,
        github_url: formData.github_url,
        linkedin_url: formData.linkedin_url,
        resume_url: formData.resume_url,
        updated_at: new Date().toISOString(),
      })
      .eq('id', profile.id);

    if (!error) {
      setProfile({ ...profile, ...formData } as FreelancerProfile);
      setEditing(false);
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Profile not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-white">{t.title}</h1>
          <p className="text-slate-400 mt-1">{t.subtitle}</p>
        </div>
        {!editing ? (
          <Button
            onClick={() => setEditing(true)}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Edit2 className="w-4 h-4 mr-2" />
            {t.buttons.edit}
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setEditing(false);
                setFormData(profile);
              }}
              className="border-slate-700"
            >
              <X className="w-4 h-4 mr-2" />
              {t.buttons.cancel}
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-emerald-600 hover:bg-emerald-700"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {saving ? t.buttons.saving : t.buttons.save}
            </Button>
          </div>
        )}
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/20">
                <Star className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {profile.average_rating?.toFixed(1) || '0.0'}
                </p>
                <p className="text-xs text-slate-400">
                  {profile.total_reviews || 0} {t.stats.reviews}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <Briefcase className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {profile.total_projects_completed || 0}
                </p>
                <p className="text-xs text-slate-400">{t.stats.projects}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {profile.total_tasks_completed || 0}
                </p>
                <p className="text-xs text-slate-400">{t.stats.tasks}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <DollarSign className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  ${(profile.total_earnings || 0).toLocaleString()}
                </p>
                <p className="text-xs text-slate-400">{t.stats.earnings}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <User className="w-5 h-5 text-emerald-400" />
                {t.sections.personal}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">{t.fields.fullName}</Label>
                {editing ? (
                  <Input
                    value={formData.full_name || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, full_name: e.target.value })
                    }
                    className="bg-slate-900 border-slate-700"
                  />
                ) : (
                  <p className="text-white">{profile.full_name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">{t.fields.email}</Label>
                <div className="flex items-center gap-2 text-white">
                  <Mail className="w-4 h-4 text-slate-400" />
                  {profile.email}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">{t.fields.phone}</Label>
                {editing ? (
                  <Input
                    value={formData.phone || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    className="bg-slate-900 border-slate-700"
                  />
                ) : (
                  <div className="flex items-center gap-2 text-white">
                    <Phone className="w-4 h-4 text-slate-400" />
                    {profile.phone || '-'}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">{t.fields.location}</Label>
                {editing ? (
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Ciudad"
                      value={formData.city || ''}
                      onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                      className="bg-slate-900 border-slate-700"
                    />
                    <Input
                      placeholder="País"
                      value={formData.country || ''}
                      onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                      className="bg-slate-900 border-slate-700"
                    />
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-white">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    {[profile.city, profile.country].filter(Boolean).join(', ') || '-'}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Professional Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-blue-400" />
                {t.sections.professional}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">{t.fields.title}</Label>
                {editing ? (
                  <Input
                    value={formData.title || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="bg-slate-900 border-slate-700"
                  />
                ) : (
                  <p className="text-white">{profile.title}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">{t.fields.bio}</Label>
                {editing ? (
                  <Textarea
                    value={formData.bio || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, bio: e.target.value })
                    }
                    className="bg-slate-900 border-slate-700 min-h-[100px]"
                  />
                ) : (
                  <p className="text-slate-300">{profile.bio || '-'}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">{t.fields.hourlyRate}</Label>
                  {editing ? (
                    <Input
                      type="number"
                      value={formData.hourly_rate || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          hourly_rate: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="bg-slate-900 border-slate-700"
                    />
                  ) : (
                    <p className="text-white">${profile.hourly_rate}/hr</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="text-slate-300">{t.fields.yearsExperience}</Label>
                  <div className="flex items-center gap-2 text-white">
                    <Clock className="w-4 h-4 text-slate-400" />
                    {profile.years_experience} years
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Skills */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white">{t.sections.skills}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">{t.fields.primarySkills}</Label>
                <div className="flex flex-wrap gap-2">
                  {profile.primary_skills?.map((skill, i) => (
                    <Badge
                      key={i}
                      className="bg-emerald-500/20 text-emerald-300 border-none"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">{t.fields.secondarySkills}</Label>
                <div className="flex flex-wrap gap-2">
                  {profile.secondary_skills?.map((skill, i) => (
                    <Badge
                      key={i}
                      variant="outline"
                      className="border-slate-600 text-slate-300"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">{t.fields.specializations}</Label>
                <div className="flex flex-wrap gap-2">
                  {profile.specializations?.map((spec, i) => (
                    <Badge
                      key={i}
                      className="bg-blue-500/20 text-blue-300 border-none"
                    >
                      {spec}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">{t.fields.languages}</Label>
                <div className="flex flex-wrap gap-2">
                  {profile.languages?.map((lang, i) => (
                    <Badge
                      key={i}
                      variant="outline"
                      className="border-slate-600 text-slate-300"
                    >
                      {lang === 'es' ? 'Español' : lang === 'en' ? 'English' : lang}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Links */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="bg-slate-800/50 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Globe className="w-5 h-5 text-cyan-400" />
                {t.sections.links}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-slate-300">{t.fields.portfolioUrl}</Label>
                {editing ? (
                  <Input
                    value={formData.portfolio_url || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, portfolio_url: e.target.value })
                    }
                    placeholder="https://..."
                    className="bg-slate-900 border-slate-700"
                  />
                ) : profile.portfolio_url ? (
                  <a
                    href={profile.portfolio_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-cyan-400 hover:text-cyan-300"
                  >
                    <Globe className="w-4 h-4" />
                    {profile.portfolio_url}
                  </a>
                ) : (
                  <p className="text-slate-500">-</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">{t.fields.githubUrl}</Label>
                {editing ? (
                  <Input
                    value={formData.github_url || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, github_url: e.target.value })
                    }
                    placeholder="https://github.com/..."
                    className="bg-slate-900 border-slate-700"
                  />
                ) : profile.github_url ? (
                  <a
                    href={profile.github_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-slate-300 hover:text-white"
                  >
                    <Github className="w-4 h-4" />
                    {profile.github_url}
                  </a>
                ) : (
                  <p className="text-slate-500">-</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">{t.fields.linkedinUrl}</Label>
                {editing ? (
                  <Input
                    value={formData.linkedin_url || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, linkedin_url: e.target.value })
                    }
                    placeholder="https://linkedin.com/in/..."
                    className="bg-slate-900 border-slate-700"
                  />
                ) : profile.linkedin_url ? (
                  <a
                    href={profile.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-blue-400 hover:text-blue-300"
                  >
                    <Linkedin className="w-4 h-4" />
                    {profile.linkedin_url}
                  </a>
                ) : (
                  <p className="text-slate-500">-</p>
                )}
              </div>

              <div className="space-y-2">
                <Label className="text-slate-300">{t.fields.resumeUrl}</Label>
                {editing ? (
                  <Input
                    value={formData.resume_url || ''}
                    onChange={(e) =>
                      setFormData({ ...formData, resume_url: e.target.value })
                    }
                    placeholder="https://..."
                    className="bg-slate-900 border-slate-700"
                  />
                ) : profile.resume_url ? (
                  <a
                    href={profile.resume_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-purple-400 hover:text-purple-300"
                  >
                    <FileText className="w-4 h-4" />
                    {profile.resume_url}
                  </a>
                ) : (
                  <p className="text-slate-500">-</p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
