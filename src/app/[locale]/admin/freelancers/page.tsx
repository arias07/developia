'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  Star,
  Search,
  Filter,
  MoreVertical,
  Eye,
  CheckCircle,
  XCircle,
  Mail,
  Phone,
  Globe,
  Github,
  Linkedin,
  FileText,
  DollarSign,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { getSupabaseClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/auth-store';
import type { FreelancerProfile, FreelancerApplicationRecord } from '@/types/database';
import { useToast } from '@/hooks/use-toast';

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  approved: 'bg-green-500/20 text-green-400 border-green-500/30',
  rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
  suspended: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  inactive: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  reviewing: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  interview: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
};

const availabilityColors: Record<string, string> = {
  available: 'bg-green-500',
  busy: 'bg-yellow-500',
  unavailable: 'bg-red-500',
};

export default function AdminFreelancersPage() {
  const { toast } = useToast();
  const { profile: adminProfile } = useAuthStore();
  const [activeTab, setActiveTab] = useState('freelancers');
  const [freelancers, setFreelancers] = useState<FreelancerProfile[]>([]);
  const [applications, setApplications] = useState<FreelancerApplicationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedFreelancer, setSelectedFreelancer] = useState<FreelancerProfile | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<FreelancerApplicationRecord | null>(null);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [showApplicationDialog, setShowApplicationDialog] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [stats, setStats] = useState({
    total: 0,
    approved: 0,
    pending: 0,
    pendingApplications: 0,
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const supabase = getSupabaseClient();

    // Fetch freelancer profiles
    const { data: freelancersData } = await supabase
      .from('freelancer_profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (freelancersData) {
      setFreelancers(freelancersData as FreelancerProfile[]);
    }

    // Fetch applications
    const { data: applicationsData } = await supabase
      .from('freelancer_applications')
      .select('*')
      .order('created_at', { ascending: false });

    if (applicationsData) {
      setApplications(applicationsData as FreelancerApplicationRecord[]);
    }

    // Calculate stats
    const total = freelancersData?.length || 0;
    const approved = freelancersData?.filter((f: FreelancerProfile) => f.status === 'approved').length || 0;
    const pending = freelancersData?.filter((f: FreelancerProfile) => f.status === 'pending').length || 0;
    const pendingApplications = applicationsData?.filter((a: FreelancerApplicationRecord) => a.status === 'pending').length || 0;

    setStats({ total, approved, pending, pendingApplications });
    setLoading(false);
  };

  const updateFreelancerStatus = async (freelancerId: string, newStatus: string) => {
    const supabase = getSupabaseClient();

    const updates: Record<string, unknown> = {
      status: newStatus,
      updated_at: new Date().toISOString(),
    };

    if (newStatus === 'approved') {
      updates.approved_by = adminProfile?.id;
      updates.approved_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('freelancer_profiles')
      .update(updates)
      .eq('id', freelancerId);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Freelancer actualizado',
      description: `Estado cambiado a ${newStatus}`,
    });

    fetchData();
    setShowProfileDialog(false);
  };

  const updateApplicationStatus = async (applicationId: string, newStatus: string) => {
    const supabase = getSupabaseClient();

    const updates: Record<string, unknown> = {
      status: newStatus,
      updated_at: new Date().toISOString(),
      reviewed_by: adminProfile?.id,
      reviewed_at: new Date().toISOString(),
    };

    if (newStatus === 'rejected') {
      updates.rejection_reason = rejectionReason;
    }

    const { error } = await supabase
      .from('freelancer_applications')
      .update(updates)
      .eq('id', applicationId);

    if (error) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
      return;
    }

    // If approved, create freelancer profile
    if (newStatus === 'approved' && selectedApplication) {
      const { data: newFreelancer, error: createError } = await supabase
        .from('freelancer_profiles')
        .insert({
          full_name: selectedApplication.full_name,
          email: selectedApplication.email,
          phone: selectedApplication.phone,
          country: selectedApplication.country,
          city: selectedApplication.city,
          title: selectedApplication.title,
          bio: selectedApplication.bio,
          years_experience: selectedApplication.years_experience || 0,
          hourly_rate: selectedApplication.expected_hourly_rate,
          primary_skills: selectedApplication.primary_skills,
          secondary_skills: selectedApplication.secondary_skills,
          specializations: selectedApplication.specializations,
          languages: selectedApplication.languages,
          portfolio_url: selectedApplication.portfolio_url,
          github_url: selectedApplication.github_url,
          linkedin_url: selectedApplication.linkedin_url,
          resume_url: selectedApplication.resume_url,
          status: 'approved',
          availability: 'available',
          weekly_hours_available: selectedApplication.weekly_hours_available || 40,
          approved_by: adminProfile?.id,
          approved_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (createError) {
        toast({
          title: 'Error',
          description: 'Error al crear perfil de freelancer',
          variant: 'destructive',
        });
        return;
      }

      // Update application with freelancer ID
      await supabase
        .from('freelancer_applications')
        .update({
          freelancer_id: newFreelancer.id,
          converted_at: new Date().toISOString(),
        })
        .eq('id', applicationId);

      toast({
        title: 'Freelancer aprobado',
        description: 'Se ha creado el perfil de freelancer',
      });
    } else {
      toast({
        title: 'Solicitud actualizada',
        description: `Estado cambiado a ${newStatus}`,
      });
    }

    fetchData();
    setShowApplicationDialog(false);
    setRejectionReason('');
  };

  const filteredFreelancers = freelancers.filter(f => {
    const matchesSearch = f.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.primary_skills.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || f.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredApplications = applications.filter(a => {
    const matchesSearch = a.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-MX', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Total Freelancers</p>
                  <p className="text-3xl font-bold text-white">{stats.total}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-400" />
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
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Aprobados</p>
                  <p className="text-3xl font-bold text-green-400">{stats.approved}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                  <UserCheck className="w-6 h-6 text-green-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Pendientes</p>
                  <p className="text-3xl font-bold text-yellow-400">{stats.pending}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="bg-slate-900/50 border-slate-800">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-sm">Solicitudes Nuevas</p>
                  <p className="text-3xl font-bold text-blue-400">{stats.pendingApplications}</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                  <FileText className="w-6 h-6 text-blue-400" />
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-800 border border-slate-700">
          <TabsTrigger value="freelancers" className="data-[state=active]:bg-purple-600">
            Freelancers ({freelancers.length})
          </TabsTrigger>
          <TabsTrigger value="applications" className="data-[state=active]:bg-purple-600">
            Solicitudes ({applications.length})
          </TabsTrigger>
        </TabsList>

        {/* Filters */}
        <Card className="bg-slate-900/50 border-slate-800 mt-4">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Input
                  placeholder="Buscar por nombre, email o skills..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-white"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48 bg-slate-800 border-slate-700 text-white">
                  <SelectValue placeholder="Todos los estados" />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-slate-700">
                  <SelectItem value="all">Todos los estados</SelectItem>
                  <SelectItem value="pending">Pendiente</SelectItem>
                  <SelectItem value="approved">Aprobado</SelectItem>
                  <SelectItem value="rejected">Rechazado</SelectItem>
                  <SelectItem value="suspended">Suspendido</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Freelancers Tab */}
        <TabsContent value="freelancers" className="space-y-4">
          {filteredFreelancers.length === 0 ? (
            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="py-12">
                <div className="text-center">
                  <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-white mb-2">No hay freelancers</h3>
                  <p className="text-slate-400">Los freelancers aprobados aparecerán aquí</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFreelancers.map((freelancer, index) => (
                <motion.div
                  key={freelancer.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="bg-slate-900/50 border-slate-800 hover:border-purple-500/30 transition-colors">
                    <CardContent className="pt-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={freelancer.avatar_url || ''} />
                              <AvatarFallback className="bg-purple-600 text-white">
                                {freelancer.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                              </AvatarFallback>
                            </Avatar>
                            <span
                              className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-slate-900 ${
                                availabilityColors[freelancer.availability] || 'bg-slate-500'
                              }`}
                            />
                          </div>
                          <div>
                            <h4 className="font-medium text-white">{freelancer.full_name}</h4>
                            <p className="text-sm text-slate-400">{freelancer.title || 'Freelancer'}</p>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-slate-400">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent className="bg-slate-900 border-slate-700">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedFreelancer(freelancer);
                                setShowProfileDialog(true);
                              }}
                              className="text-slate-300"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Ver perfil
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-slate-700" />
                            {freelancer.status !== 'approved' && (
                              <DropdownMenuItem
                                onClick={() => updateFreelancerStatus(freelancer.id, 'approved')}
                                className="text-green-400"
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Aprobar
                              </DropdownMenuItem>
                            )}
                            {freelancer.status !== 'suspended' && (
                              <DropdownMenuItem
                                onClick={() => updateFreelancerStatus(freelancer.id, 'suspended')}
                                className="text-orange-400"
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Suspender
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Badge className={statusColors[freelancer.status]}>
                            {freelancer.status}
                          </Badge>
                          <div className="flex items-center gap-1 text-yellow-400">
                            <Star className="w-4 h-4 fill-current" />
                            <span className="text-sm">{freelancer.average_rating?.toFixed(1) || '0.0'}</span>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-1">
                          {freelancer.primary_skills.slice(0, 3).map((skill) => (
                            <Badge key={skill} variant="outline" className="text-xs border-slate-700 text-slate-400">
                              {skill}
                            </Badge>
                          ))}
                          {freelancer.primary_skills.length > 3 && (
                            <Badge variant="outline" className="text-xs border-slate-700 text-slate-400">
                              +{freelancer.primary_skills.length - 3}
                            </Badge>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-sm text-slate-400">
                          <span>{freelancer.years_experience} años exp.</span>
                          {freelancer.hourly_rate && (
                            <span className="text-emerald-400">
                              {formatCurrency(freelancer.hourly_rate)}/h
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-500">
                          <span>{freelancer.total_tasks_completed} tareas</span>
                          <span>{formatCurrency(freelancer.total_earnings)} ganados</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Applications Tab */}
        <TabsContent value="applications" className="space-y-4">
          {filteredApplications.length === 0 ? (
            <Card className="bg-slate-900/50 border-slate-800">
              <CardContent className="py-12">
                <div className="text-center">
                  <FileText className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <h3 className="text-xl font-medium text-white mb-2">No hay solicitudes</h3>
                  <p className="text-slate-400">Las nuevas solicitudes aparecerán aquí</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredApplications.map((application, index) => (
                <motion.div
                  key={application.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="bg-slate-900/50 border-slate-800 hover:border-purple-500/30 transition-colors">
                    <CardContent className="pt-6">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="bg-blue-600 text-white">
                              {application.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h4 className="font-medium text-white">{application.full_name}</h4>
                            <p className="text-sm text-slate-400">{application.title || application.email}</p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                              <span>{application.years_experience || 0} años exp.</span>
                              {application.expected_hourly_rate && (
                                <span>• {formatCurrency(application.expected_hourly_rate)}/h</span>
                              )}
                              <span>• {formatDate(application.created_at)}</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Badge className={statusColors[application.status]}>
                            {application.status}
                          </Badge>
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-slate-700 text-slate-300"
                            onClick={() => {
                              setSelectedApplication(application);
                              setShowApplicationDialog(true);
                            }}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Ver
                          </Button>
                          {application.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => {
                                  setSelectedApplication(application);
                                  updateApplicationStatus(application.id, 'approved');
                                }}
                              >
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Aprobar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                                onClick={() => {
                                  setSelectedApplication(application);
                                  setShowApplicationDialog(true);
                                }}
                              >
                                <XCircle className="w-4 h-4 mr-1" />
                                Rechazar
                              </Button>
                            </>
                          )}
                        </div>
                      </div>

                      {application.primary_skills.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-3">
                          {application.primary_skills.slice(0, 5).map((skill) => (
                            <Badge key={skill} variant="outline" className="text-xs border-slate-700 text-slate-400">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Freelancer Profile Dialog */}
      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Perfil de Freelancer</DialogTitle>
          </DialogHeader>
          {selectedFreelancer && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={selectedFreelancer.avatar_url || ''} />
                  <AvatarFallback className="bg-purple-600 text-white text-xl">
                    {selectedFreelancer.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-bold text-white">{selectedFreelancer.full_name}</h3>
                  <p className="text-slate-400">{selectedFreelancer.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge className={statusColors[selectedFreelancer.status]}>
                      {selectedFreelancer.status}
                    </Badge>
                    <div className="flex items-center gap-1 text-yellow-400">
                      <Star className="w-4 h-4 fill-current" />
                      <span className="text-sm">
                        {selectedFreelancer.average_rating?.toFixed(1) || '0.0'} ({selectedFreelancer.total_reviews} reseñas)
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-slate-500">Email</p>
                  <p className="text-white flex items-center gap-2">
                    <Mail className="w-4 h-4 text-slate-400" />
                    {selectedFreelancer.email}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-slate-500">Teléfono</p>
                  <p className="text-white flex items-center gap-2">
                    <Phone className="w-4 h-4 text-slate-400" />
                    {selectedFreelancer.phone || '-'}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-slate-500">Ubicación</p>
                  <p className="text-white flex items-center gap-2">
                    <Globe className="w-4 h-4 text-slate-400" />
                    {selectedFreelancer.city}, {selectedFreelancer.country}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-slate-500">Tarifa</p>
                  <p className="text-emerald-400 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    {formatCurrency(selectedFreelancer.hourly_rate || 0)}/hora
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-slate-500">Bio</p>
                <p className="text-slate-300">{selectedFreelancer.bio || 'Sin biografía'}</p>
              </div>

              <div className="space-y-2">
                <p className="text-sm text-slate-500">Skills principales</p>
                <div className="flex flex-wrap gap-2">
                  {selectedFreelancer.primary_skills.map((skill) => (
                    <Badge key={skill} className="bg-purple-500/20 text-purple-400">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                {selectedFreelancer.github_url && (
                  <a href={selectedFreelancer.github_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="border-slate-700 text-slate-300">
                      <Github className="w-4 h-4 mr-1" /> GitHub
                    </Button>
                  </a>
                )}
                {selectedFreelancer.linkedin_url && (
                  <a href={selectedFreelancer.linkedin_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="border-slate-700 text-slate-300">
                      <Linkedin className="w-4 h-4 mr-1" /> LinkedIn
                    </Button>
                  </a>
                )}
                {selectedFreelancer.portfolio_url && (
                  <a href={selectedFreelancer.portfolio_url} target="_blank" rel="noopener noreferrer">
                    <Button variant="outline" size="sm" className="border-slate-700 text-slate-300">
                      <Globe className="w-4 h-4 mr-1" /> Portfolio
                    </Button>
                  </a>
                )}
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-700">
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{selectedFreelancer.total_tasks_completed}</p>
                  <p className="text-sm text-slate-400">Tareas completadas</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-white">{selectedFreelancer.total_projects_completed}</p>
                  <p className="text-sm text-slate-400">Proyectos</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-emerald-400">
                    {formatCurrency(selectedFreelancer.total_earnings)}
                  </p>
                  <p className="text-sm text-slate-400">Ganancias totales</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProfileDialog(false)}>
              Cerrar
            </Button>
            {selectedFreelancer?.status === 'pending' && (
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={() => updateFreelancerStatus(selectedFreelancer.id, 'approved')}
              >
                Aprobar
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Application Dialog */}
      <Dialog open={showApplicationDialog} onOpenChange={setShowApplicationDialog}>
        <DialogContent className="bg-slate-900 border-slate-700 max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">Solicitud de Freelancer</DialogTitle>
          </DialogHeader>
          {selectedApplication && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="bg-blue-600 text-white text-xl">
                    {selectedApplication.full_name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-xl font-bold text-white">{selectedApplication.full_name}</h3>
                  <p className="text-slate-400">{selectedApplication.title}</p>
                  <Badge className={statusColors[selectedApplication.status]}>
                    {selectedApplication.status}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-slate-500">Email</p>
                  <p className="text-white">{selectedApplication.email}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-slate-500">Teléfono</p>
                  <p className="text-white">{selectedApplication.phone || '-'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-slate-500">Experiencia</p>
                  <p className="text-white">{selectedApplication.years_experience || 0} años</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-slate-500">Tarifa esperada</p>
                  <p className="text-emerald-400">
                    {formatCurrency(selectedApplication.expected_hourly_rate || 0)}/hora
                  </p>
                </div>
              </div>

              {selectedApplication.cover_letter && (
                <div className="space-y-2">
                  <p className="text-sm text-slate-500">Carta de presentación</p>
                  <p className="text-slate-300 whitespace-pre-wrap">{selectedApplication.cover_letter}</p>
                </div>
              )}

              <div className="space-y-2">
                <p className="text-sm text-slate-500">Skills</p>
                <div className="flex flex-wrap gap-2">
                  {selectedApplication.primary_skills.map((skill) => (
                    <Badge key={skill} className="bg-purple-500/20 text-purple-400">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>

              {selectedApplication.status === 'pending' && (
                <div className="space-y-2 pt-4 border-t border-slate-700">
                  <p className="text-sm text-slate-500">Razón de rechazo (opcional)</p>
                  <Textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Explica por qué se rechaza la solicitud..."
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowApplicationDialog(false)}>
              Cerrar
            </Button>
            {selectedApplication?.status === 'pending' && (
              <>
                <Button
                  variant="outline"
                  className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                  onClick={() => updateApplicationStatus(selectedApplication.id, 'rejected')}
                >
                  Rechazar
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => updateApplicationStatus(selectedApplication.id, 'approved')}
                >
                  Aprobar
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
