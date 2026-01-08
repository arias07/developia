'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Star, Briefcase } from 'lucide-react';
import type { ProjectTeamMember, FictionalTeamRole } from '@/types/database';

interface ProjectTeamProps {
  projectId: string;
}

const roleLabels: Record<FictionalTeamRole, string> = {
  project_manager: 'Project Manager',
  senior_developer: 'Senior Developer',
  junior_developer: 'Developer',
};

const roleColors: Record<FictionalTeamRole, string> = {
  project_manager: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  senior_developer: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  junior_developer: 'bg-green-500/20 text-green-400 border-green-500/30',
};

export function ProjectTeam({ projectId }: ProjectTeamProps) {
  const [team, setTeam] = useState<ProjectTeamMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTeam() {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data, error } = await supabase
        .from('project_team_members')
        .select('*')
        .eq('project_id', projectId)
        .eq('is_active', true)
        .order('role', { ascending: true });

      if (!error && data) {
        setTeam(data as ProjectTeamMember[]);
      }
      setLoading(false);
    }

    fetchTeam();
  }, [projectId]);

  if (loading) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Users className="h-5 w-5 text-purple-400" />
            Tu Equipo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="p-4 rounded-lg bg-slate-700/50">
                <Skeleton className="h-12 w-12 rounded-full mb-3" />
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-3 w-32" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (team.length === 0) {
    return (
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Users className="h-5 w-5 text-purple-400" />
            Tu Equipo
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-slate-400">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>El equipo será asignado una vez que se confirme el pago.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Sort team: PM first, then Senior, then Juniors
  const sortedTeam = [...team].sort((a, b) => {
    const order: Record<FictionalTeamRole, number> = {
      project_manager: 0,
      senior_developer: 1,
      junior_developer: 2,
    };
    return order[a.role] - order[b.role];
  });

  return (
    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-white">
          <Users className="h-5 w-5 text-purple-400" />
          Tu Equipo de Desarrollo
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedTeam.map((member) => (
            <TeamMemberCard key={member.id} member={member} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface TeamMemberCardProps {
  member: ProjectTeamMember;
}

function TeamMemberCard({ member }: TeamMemberCardProps) {
  return (
    <div className="p-4 rounded-lg bg-slate-700/50 hover:bg-slate-700/70 transition-colors border border-slate-600/50">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="flex-shrink-0">
          {member.avatar_url ? (
            <img
              src={member.avatar_url}
              alt={member.display_name}
              className="h-12 w-12 rounded-full bg-slate-600"
            />
          ) : (
            <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white font-bold">
              {member.display_name.charAt(0)}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <h4 className="text-white font-medium truncate">{member.display_name}</h4>
          <p className="text-slate-400 text-sm">{member.title}</p>

          {/* Role Badge */}
          <Badge
            variant="outline"
            className={`mt-2 text-xs ${roleColors[member.role]}`}
          >
            {roleLabels[member.role]}
          </Badge>
        </div>
      </div>

      {/* Specializations */}
      {member.specializations && member.specializations.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1">
          {member.specializations.slice(0, 3).map((spec, i) => (
            <span
              key={i}
              className="px-2 py-0.5 text-xs rounded bg-slate-600/50 text-slate-300"
            >
              {spec}
            </span>
          ))}
          {member.specializations.length > 3 && (
            <span className="px-2 py-0.5 text-xs rounded bg-slate-600/50 text-slate-400">
              +{member.specializations.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Bio preview */}
      {member.bio && (
        <p className="mt-2 text-xs text-slate-400 line-clamp-2">{member.bio}</p>
      )}
    </div>
  );
}

export default ProjectTeam;
