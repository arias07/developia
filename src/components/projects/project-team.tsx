'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Users, Loader2, UserCircle, Star } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';

interface TeamMember {
  id: string;
  project_id: string;
  display_name: string;
  avatar_url: string;
  role: string;
  title: string;
  specializations: string[];
  bio: string;
  internal_code: string;
  is_active: boolean;
  assigned_at: string;
}

const roleLabels: Record<string, string> = {
  project_manager: 'Project Manager',
  senior_developer: 'Senior Developer',
  junior_developer: 'Developer',
};

const roleBadgeColors: Record<string, string> = {
  project_manager: 'bg-purple-500',
  senior_developer: 'bg-cyan-500',
  junior_developer: 'bg-blue-500',
};

interface ProjectTeamProps {
  projectId: string;
}

export function ProjectTeam({ projectId }: ProjectTeamProps) {
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTeam = async () => {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('project_team_members')
        .select('*')
        .eq('project_id', projectId)
        .eq('is_active', true)
        .order('role', { ascending: true });

      if (!error && data) {
        setTeam(data as TeamMember[]);
      }
      setLoading(false);
    };

    fetchTeam();
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (team.length === 0) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="py-12 text-center">
          <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400 mb-2">No hay equipo asignado todavía</p>
          <p className="text-sm text-slate-500">
            El equipo será asignado una vez que el proyecto esté pagado
          </p>
        </CardContent>
      </Card>
    );
  }

  // Separar por roles
  const pm = team.find((m) => m.role === 'project_manager');
  const senior = team.find((m) => m.role === 'senior_developer');
  const juniors = team.filter((m) => m.role === 'junior_developer');

  return (
    <div className="space-y-6">
      {/* Team Overview */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-purple-400" />
            Tu Equipo de Desarrollo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-400 text-sm mb-4">
            Un equipo de {team.length} profesionales está trabajando en tu proyecto.
          </p>

          {/* Project Manager */}
          {pm && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-slate-400 mb-3 flex items-center gap-2">
                <Star className="w-4 h-4 text-yellow-400" />
                Líder del Proyecto
              </h3>
              <TeamMemberCard member={pm} featured />
            </div>
          )}

          {/* Senior Developer */}
          {senior && (
            <div className="mb-6">
              <h3 className="text-sm font-medium text-slate-400 mb-3">
                Desarrollador Senior
              </h3>
              <TeamMemberCard member={senior} />
            </div>
          )}

          {/* Junior Developers */}
          {juniors.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-slate-400 mb-3">
                Equipo de Desarrollo ({juniors.length})
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {juniors.map((member, index) => (
                  <motion.div
                    key={member.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <TeamMemberCard member={member} compact />
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface TeamMemberCardProps {
  member: TeamMember;
  featured?: boolean;
  compact?: boolean;
}

function TeamMemberCard({ member, featured, compact }: TeamMemberCardProps) {
  const initials = member.display_name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase();

  if (compact) {
    return (
      <div className="p-4 rounded-lg bg-slate-900/50 border border-slate-700">
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={member.avatar_url} alt={member.display_name} />
            <AvatarFallback className="bg-slate-700 text-white">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium truncate">{member.display_name}</p>
            <p className="text-xs text-slate-400">{member.title}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-1 mt-2">
          {member.specializations?.slice(0, 3).map((spec, i) => (
            <Badge
              key={i}
              variant="outline"
              className="border-slate-600 text-slate-400 text-xs"
            >
              {spec}
            </Badge>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`p-4 rounded-lg border ${
        featured
          ? 'bg-gradient-to-br from-purple-900/30 to-cyan-900/30 border-purple-500/30'
          : 'bg-slate-900/50 border-slate-700'
      }`}
    >
      <div className="flex items-start gap-4">
        <Avatar className={featured ? 'h-16 w-16' : 'h-12 w-12'}>
          <AvatarImage src={member.avatar_url} alt={member.display_name} />
          <AvatarFallback className="bg-slate-700 text-white text-lg">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="text-white font-semibold">{member.display_name}</p>
            <Badge
              className={`${roleBadgeColors[member.role]} text-white border-none text-xs`}
            >
              {roleLabels[member.role]}
            </Badge>
          </div>
          <p className="text-sm text-slate-400 mb-2">{member.title}</p>

          {member.bio && (
            <p className="text-sm text-slate-300 mb-3">{member.bio}</p>
          )}

          <div className="flex flex-wrap gap-2">
            {member.specializations?.map((spec, i) => (
              <Badge
                key={i}
                variant="outline"
                className="border-slate-600 text-slate-300 text-xs"
              >
                {spec}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
