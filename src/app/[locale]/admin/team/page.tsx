'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Plus,
  Mail,
  Phone,
  Star,
  MoreVertical,
  Edit,
  Trash2,
  FolderKanban,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { Profile, TeamMember, UserRole } from '@/types/database';

interface TeamMemberWithProfile extends TeamMember {
  profile: Profile;
}

const roleColors: Record<string, string> = {
  admin: 'bg-red-500',
  project_manager: 'bg-purple-500',
  developer: 'bg-blue-500',
  designer: 'bg-pink-500',
  consultant: 'bg-cyan-500',
  freelancer: 'bg-green-500',
};

const roleLabels: Record<string, string> = {
  admin: 'Administrador',
  project_manager: 'Project Manager',
  developer: 'Desarrollador',
  designer: 'Diseñador',
  consultant: 'Consultor',
  freelancer: 'Freelancer',
};

const availabilityColors: Record<string, string> = {
  available: 'bg-green-500',
  busy: 'bg-yellow-500',
  unavailable: 'bg-red-500',
};

const availabilityLabels: Record<string, string> = {
  available: 'Disponible',
  busy: 'Ocupado',
  unavailable: 'No disponible',
};

export default function AdminTeamPage() {
  const [teamMembers, setTeamMembers] = useState<TeamMemberWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newMember, setNewMember] = useState({
    email: '',
    role: 'developer' as UserRole,
    specializations: '',
    hourly_rate: '',
  });

  useEffect(() => {
    const fetchTeamMembers = async () => {
      const supabase = getSupabaseClient();

      const { data } = await supabase
        .from('team_members')
        .select(
          `
          *,
          profile:profiles!team_members_profile_id_fkey(*)
        `
        )
        .order('joined_at', { ascending: false });

      if (data) {
        setTeamMembers(data as TeamMemberWithProfile[]);
      }
      setLoading(false);
    };

    fetchTeamMembers();
  }, []);

  const filteredMembers = teamMembers.filter(
    (member) =>
      member.profile.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.profile.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      member.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInviteMember = async () => {
    // TODO: In a real implementation, this would send an invite email
    setIsDialogOpen(false);
    setNewMember({
      email: '',
      role: 'developer',
      specializations: '',
      hourly_rate: '',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            placeholder="Buscar miembros del equipo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-slate-900 border-slate-700 text-white placeholder:text-slate-500"
          />
        </div>
        <Button
          onClick={() => setIsDialogOpen(true)}
          className="bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Invitar miembro
        </Button>
      </div>

      {/* Team stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Object.entries(roleLabels)
          .filter(([role]) => role !== 'client')
          .slice(0, 4)
          .map(([role, label]) => {
            const count = teamMembers.filter((m) => m.role === role).length;
            return (
              <Card key={role} className="bg-slate-900 border-slate-800">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-3 h-3 rounded-full ${roleColors[role]}`} />
                    <span className="text-sm text-slate-400">{label}</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{count}</p>
                </CardContent>
              </Card>
            );
          })}
      </div>

      {/* Team members grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-full text-center py-8 text-slate-400">
            Cargando equipo...
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="col-span-full text-center py-8 text-slate-400">
            No se encontraron miembros del equipo
          </div>
        ) : (
          filteredMembers.map((member) => {
            const initials = member.profile.full_name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2);

            return (
              <Card key={member.id} className="bg-slate-900 border-slate-800">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={member.profile.avatar_url || ''} />
                          <AvatarFallback className="bg-purple-600 text-white">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div
                          className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-slate-900 ${
                            availabilityColors[member.availability_status]
                          }`}
                        />
                      </div>
                      <div>
                        <h3 className="font-medium text-white">{member.profile.full_name}</h3>
                        <Badge className={`${roleColors[member.role]} text-white border-none text-xs`}>
                          {roleLabels[member.role]}
                        </Badge>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                        <DropdownMenuItem className="text-slate-300 hover:text-white cursor-pointer">
                          <Edit className="w-4 h-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-400 hover:text-red-300 cursor-pointer">
                          <Trash2 className="w-4 h-4 mr-2" />
                          Remover
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Mail className="w-4 h-4" />
                      <span className="truncate">{member.profile.email}</span>
                    </div>
                    {member.profile.phone && (
                      <div className="flex items-center gap-2 text-sm text-slate-400">
                        <Phone className="w-4 h-4" />
                        <span>{member.profile.phone}</span>
                      </div>
                    )}
                  </div>

                  {member.specializations && member.specializations.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {member.specializations.slice(0, 3).map((spec) => (
                        <Badge
                          key={spec}
                          variant="outline"
                          className="border-slate-700 text-slate-400 text-xs"
                        >
                          {spec}
                        </Badge>
                      ))}
                      {member.specializations.length > 3 && (
                        <Badge variant="outline" className="border-slate-700 text-slate-400 text-xs">
                          +{member.specializations.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-slate-800">
                    <div className="flex items-center gap-1 text-sm">
                      <FolderKanban className="w-4 h-4 text-slate-500" />
                      <span className="text-white">{member.current_projects?.length || 0}</span>
                      <span className="text-slate-500">proyectos</span>
                    </div>
                    <div className="flex items-center gap-1 text-sm">
                      <Star className="w-4 h-4 text-yellow-400" />
                      <span className="text-white">{member.rating.toFixed(1)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Invite member dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Invitar nuevo miembro</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-white">Email</Label>
              <Input
                type="email"
                value={newMember.email}
                onChange={(e) => setNewMember({ ...newMember, email: e.target.value })}
                placeholder="correo@ejemplo.com"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-white">Rol</Label>
              <Select
                value={newMember.role}
                onValueChange={(value) => setNewMember({ ...newMember, role: value as UserRole })}
              >
                <SelectTrigger className="bg-slate-800 border-slate-700 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  {Object.entries(roleLabels)
                    .filter(([role]) => !['client', 'admin'].includes(role))
                    .map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-white">Especializaciones</Label>
              <Input
                value={newMember.specializations}
                onChange={(e) => setNewMember({ ...newMember, specializations: e.target.value })}
                placeholder="React, Node.js, PostgreSQL..."
                className="bg-slate-800 border-slate-700 text-white"
              />
              <p className="text-xs text-slate-500">Separadas por comas</p>
            </div>

            <div className="space-y-2">
              <Label className="text-white">Tarifa por hora (USD)</Label>
              <Input
                type="number"
                value={newMember.hourly_rate}
                onChange={(e) => setNewMember({ ...newMember, hourly_rate: e.target.value })}
                placeholder="50"
                className="bg-slate-800 border-slate-700 text-white"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} className="border-slate-700">
              Cancelar
            </Button>
            <Button
              onClick={handleInviteMember}
              className="bg-gradient-to-r from-purple-600 to-cyan-600"
              disabled={!newMember.email}
            >
              Enviar invitación
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
