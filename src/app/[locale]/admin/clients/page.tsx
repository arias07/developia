'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Search,
  MoreVertical,
  Eye,
  Mail,
  Phone,
  Building,
  Calendar,
  FolderKanban,
  Users,
  UserPlus,
} from 'lucide-react';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase/client';

interface Client {
  id: string;
  email: string;
  full_name: string;
  avatar_url: string | null;
  phone: string | null;
  company: string | null;
  created_at: string;
  projects_count: number;
}

export default function AdminClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    newThisMonth: 0,
    withProjects: 0,
  });

  useEffect(() => {
    const fetchClients = async () => {
      const supabase = getSupabaseClient();

      // Fetch clients
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'client')
        .order('created_at', { ascending: false });

      if (profilesData) {
        // Get project counts for each client
        const clientsWithProjects = await Promise.all(
          profilesData.map(async (profile: any) => {
            const { count } = await supabase
              .from('projects')
              .select('id', { count: 'exact' })
              .eq('client_id', profile.id);

            return {
              ...profile,
              projects_count: count || 0,
            };
          })
        );

        setClients(clientsWithProjects);

        // Calculate stats
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const newThisMonth = clientsWithProjects.filter(
          (c: any) => new Date(c.created_at) >= firstDayOfMonth
        ).length;
        const withProjects = clientsWithProjects.filter((c: any) => c.projects_count > 0).length;

        setStats({
          total: clientsWithProjects.length,
          newThisMonth,
          withProjects,
        });
      }

      setLoading(false);
    };

    fetchClients();
  }, []);

  const filteredClients = clients.filter(
    (client) =>
      client.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.company?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-blue-500/10">
                  <Users className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Total Clientes</p>
                  <p className="text-2xl font-bold text-white">{stats.total}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-green-500/10">
                  <UserPlus className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Nuevos este mes</p>
                  <p className="text-2xl font-bold text-white">{stats.newThisMonth}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-purple-500/10">
                  <FolderKanban className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-400">Con proyectos</p>
                  <p className="text-2xl font-bold text-white">{stats.withProjects}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Search */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              placeholder="Buscar clientes por nombre, email o empresa..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>
        </CardContent>
      </Card>

      {/* Clients Table */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Clientes ({filteredClients.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-slate-400">Cargando clientes...</div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-8 text-slate-400">No se encontraron clientes</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800 hover:bg-transparent">
                    <TableHead className="text-slate-400">Cliente</TableHead>
                    <TableHead className="text-slate-400">Contacto</TableHead>
                    <TableHead className="text-slate-400">Empresa</TableHead>
                    <TableHead className="text-slate-400">Proyectos</TableHead>
                    <TableHead className="text-slate-400">Registro</TableHead>
                    <TableHead className="text-slate-400 text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow key={client.id} className="border-slate-800 hover:bg-slate-800/50">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarImage src={client.avatar_url || undefined} />
                            <AvatarFallback className="bg-blue-500/20 text-blue-400">
                              {client.full_name?.slice(0, 2).toUpperCase() || 'CL'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium text-white">{client.full_name}</p>
                            <p className="text-xs text-slate-400">{client.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {client.phone && (
                            <div className="flex items-center gap-1 text-slate-400 text-sm">
                              <Phone className="w-3 h-3" />
                              {client.phone}
                            </div>
                          )}
                          <div className="flex items-center gap-1 text-slate-400 text-sm">
                            <Mail className="w-3 h-3" />
                            {client.email}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {client.company ? (
                          <div className="flex items-center gap-1 text-white">
                            <Building className="w-4 h-4 text-slate-400" />
                            {client.company}
                          </div>
                        ) : (
                          <span className="text-slate-500">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="secondary"
                          className={
                            client.projects_count > 0
                              ? 'bg-purple-500/20 text-purple-400'
                              : 'bg-slate-700 text-slate-400'
                          }
                        >
                          {client.projects_count} proyectos
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-slate-400 text-sm">
                          <Calendar className="w-3 h-3" />
                          {new Date(client.created_at).toLocaleDateString('es-MX')}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="bg-slate-800 border-slate-700">
                            <DropdownMenuItem className="text-slate-300 hover:text-white cursor-pointer">
                              <Eye className="w-4 h-4 mr-2" />
                              Ver perfil
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-slate-300 hover:text-white cursor-pointer">
                              <FolderKanban className="w-4 h-4 mr-2" />
                              Ver proyectos
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-slate-300 hover:text-white cursor-pointer">
                              <Mail className="w-4 h-4 mr-2" />
                              Enviar mensaje
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
