'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Calendar,
  Download,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  Clock,
  XCircle,
} from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { Payment, PaymentStatus } from '@/types/database';

interface PaymentWithProject extends Payment {
  project?: {
    name: string;
  };
  client?: {
    full_name: string;
    email: string;
  };
}

interface FinanceStats {
  totalRevenue: number;
  monthlyRevenue: number;
  pendingPayments: number;
  completedPayments: number;
  revenueGrowth: number;
  averageProjectValue: number;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500',
  processing: 'bg-blue-500',
  completed: 'bg-green-500',
  failed: 'bg-red-500',
  refunded: 'bg-purple-500',
};

const statusLabels: Record<string, string> = {
  pending: 'Pendiente',
  processing: 'Procesando',
  completed: 'Completado',
  failed: 'Fallido',
  refunded: 'Reembolsado',
};

const statusIcons: Record<string, React.ReactNode> = {
  pending: <Clock className="w-4 h-4" />,
  processing: <Clock className="w-4 h-4" />,
  completed: <CheckCircle className="w-4 h-4" />,
  failed: <XCircle className="w-4 h-4" />,
  refunded: <ArrowDownRight className="w-4 h-4" />,
};

export default function AdminFinancesPage() {
  const [payments, setPayments] = useState<PaymentWithProject[]>([]);
  const [stats, setStats] = useState<FinanceStats>({
    totalRevenue: 0,
    monthlyRevenue: 0,
    pendingPayments: 0,
    completedPayments: 0,
    revenueGrowth: 15.3,
    averageProjectValue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<string>('all');

  useEffect(() => {
    const fetchPayments = async () => {
      const supabase = getSupabaseClient();

      let query = supabase
        .from('payments')
        .select(
          `
          *,
          project:projects!payments_project_id_fkey(name),
          client:profiles!payments_client_id_fkey(full_name, email)
        `
        )
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data } = await query;

      if (data) {
        const typedData = data as PaymentWithProject[];
        setPayments(typedData);

        // Calculate stats
        const completed = typedData.filter((p) => p.status === 'completed');
        const pending = typedData.filter((p) => p.status === 'pending');

        const totalRevenue = completed.reduce((sum, p) => sum + p.amount, 0);
        const avgValue = completed.length > 0 ? totalRevenue / completed.length : 0;

        // Get current month payments
        const now = new Date();
        const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const monthlyPayments = completed.filter(
          (p) => new Date(p.created_at) >= firstDayOfMonth
        );
        const monthlyRevenue = monthlyPayments.reduce((sum, p) => sum + p.amount, 0);

        setStats({
          totalRevenue,
          monthlyRevenue,
          pendingPayments: pending.reduce((sum, p) => sum + p.amount, 0),
          completedPayments: completed.length,
          revenueGrowth: 15.3, // Placeholder - would need historical data
          averageProjectValue: avgValue,
        });
      }
      setLoading(false);
    };

    fetchPayments();
  }, [statusFilter]);

  const statCards = [
    {
      title: 'Ingresos totales',
      value: `$${stats.totalRevenue.toLocaleString()}`,
      change: stats.revenueGrowth,
      icon: DollarSign,
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
    },
    {
      title: 'Este mes',
      value: `$${stats.monthlyRevenue.toLocaleString()}`,
      icon: Calendar,
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
    },
    {
      title: 'Pagos pendientes',
      value: `$${stats.pendingPayments.toLocaleString()}`,
      icon: Clock,
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
    },
    {
      title: 'Valor promedio',
      value: `$${stats.averageProjectValue.toLocaleString()}`,
      icon: TrendingUp,
      color: 'text-purple-400',
      bgColor: 'bg-purple-500/10',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((stat, index) => (
          <Card key={stat.title} className="bg-slate-900 border-slate-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className={`p-3 rounded-xl ${stat.bgColor}`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                {stat.change !== undefined && (
                  <div
                    className={`flex items-center gap-1 text-sm ${
                      stat.change >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {stat.change >= 0 ? (
                      <ArrowUpRight className="w-4 h-4" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4" />
                    )}
                    {Math.abs(stat.change)}%
                  </div>
                )}
              </div>
              <p className="text-sm text-slate-400 mb-1">{stat.title}</p>
              <p className="text-2xl font-bold text-white">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters and Export */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4 justify-between">
            <div className="flex gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px] bg-slate-800 border-slate-700 text-white">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Estado" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all">Todos los estados</SelectItem>
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={periodFilter} onValueChange={setPeriodFilter}>
                <SelectTrigger className="w-[180px] bg-slate-800 border-slate-700 text-white">
                  <Calendar className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="all">Todo el tiempo</SelectItem>
                  <SelectItem value="today">Hoy</SelectItem>
                  <SelectItem value="week">Esta semana</SelectItem>
                  <SelectItem value="month">Este mes</SelectItem>
                  <SelectItem value="year">Este año</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button variant="outline" className="border-slate-700">
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Payments table */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">Historial de pagos</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-slate-400">Cargando pagos...</div>
          ) : payments.length === 0 ? (
            <div className="text-center py-8 text-slate-400">No hay pagos registrados</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-slate-800 hover:bg-transparent">
                    <TableHead className="text-slate-400">Fecha</TableHead>
                    <TableHead className="text-slate-400">Cliente</TableHead>
                    <TableHead className="text-slate-400">Proyecto</TableHead>
                    <TableHead className="text-slate-400">Tipo</TableHead>
                    <TableHead className="text-slate-400">Monto</TableHead>
                    <TableHead className="text-slate-400">Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.map((payment) => (
                    <TableRow key={payment.id} className="border-slate-800 hover:bg-slate-800/50">
                      <TableCell className="text-slate-400">
                        {new Date(payment.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-white">{payment.client?.full_name}</p>
                          <p className="text-xs text-slate-400">{payment.client?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-white">{payment.project?.name || '-'}</TableCell>
                      <TableCell className="text-slate-400 capitalize">
                        {payment.payment_type.replace('_', ' ')}
                      </TableCell>
                      <TableCell className="text-white font-medium">
                        ${payment.amount.toLocaleString()} {payment.currency}
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`${statusColors[payment.status]} text-white border-none flex items-center gap-1 w-fit`}
                        >
                          {statusIcons[payment.status]}
                          {statusLabels[payment.status]}
                        </Badge>
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
