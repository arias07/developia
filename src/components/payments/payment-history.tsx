'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  CreditCard,
  CheckCircle2,
  Clock,
  XCircle,
  Download,
  ExternalLink,
  Loader2,
  Receipt,
} from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';
import { InvoiceViewer } from './invoice-viewer';

interface Payment {
  id: string;
  project_id: string;
  client_id: string;
  amount: number;
  currency: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';
  payment_type: 'full' | 'deposit' | 'milestone' | 'maintenance';
  stripe_payment_intent_id?: string;
  stripe_invoice_id?: string;
  paid_at?: string;
  created_at: string;
}

interface PaymentHistoryProps {
  projectId: string;
}

const statusConfig = {
  pending: { label: 'Pendiente', color: 'bg-yellow-500', icon: Clock },
  processing: { label: 'Procesando', color: 'bg-blue-500', icon: Clock },
  completed: { label: 'Completado', color: 'bg-green-500', icon: CheckCircle2 },
  failed: { label: 'Fallido', color: 'bg-red-500', icon: XCircle },
  refunded: { label: 'Reembolsado', color: 'bg-purple-500', icon: Receipt },
};

const typeLabels = {
  full: 'Pago Total',
  deposit: 'Anticipo',
  milestone: 'Hito',
  maintenance: 'Mantenimiento',
};

export function PaymentHistory({ projectId }: PaymentHistoryProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, [projectId]);

  const fetchPayments = async () => {
    setLoading(true);
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('payments')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (!error && data) {
      setPayments(data as Payment[]);
    }
    setLoading(false);
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const totalPaid = payments
    .filter((p) => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPending = payments
    .filter((p) => p.status === 'pending' || p.status === 'processing')
    .reduce((sum, p) => sum + p.amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/20">
                <CheckCircle2 className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Total Pagado</p>
                <p className="text-xl font-bold text-green-400">
                  {formatCurrency(totalPaid, 'USD')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/20">
                <Clock className="w-5 h-5 text-yellow-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Pendiente</p>
                <p className="text-xl font-bold text-yellow-400">
                  {formatCurrency(totalPending, 'USD')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800/50 border-slate-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Receipt className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Transacciones</p>
                <p className="text-xl font-bold text-white">{payments.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payments List */}
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-purple-400" />
            Historial de Pagos
          </CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Receipt className="w-12 h-12 text-slate-500 mb-4" />
              <p className="text-slate-400 text-center">No hay pagos registrados</p>
            </div>
          ) : (
            <div className="space-y-4">
              {payments.map((payment) => {
                const status = statusConfig[payment.status];
                const StatusIcon = status.icon;

                return (
                  <div
                    key={payment.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-slate-900/50 border border-slate-700"
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className={`p-2 rounded-lg ${
                          payment.status === 'completed'
                            ? 'bg-green-500/20'
                            : payment.status === 'pending'
                            ? 'bg-yellow-500/20'
                            : 'bg-slate-500/20'
                        }`}
                      >
                        <StatusIcon
                          className={`w-5 h-5 ${
                            payment.status === 'completed'
                              ? 'text-green-400'
                              : payment.status === 'pending'
                              ? 'text-yellow-400'
                              : 'text-slate-400'
                          }`}
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">
                            {typeLabels[payment.payment_type]}
                          </span>
                          <Badge className={`${status.color} text-white border-none text-xs`}>
                            {status.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-400">
                          {payment.paid_at
                            ? `Pagado el ${new Date(payment.paid_at).toLocaleDateString('es-MX', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}`
                            : `Creado el ${new Date(payment.created_at).toLocaleDateString('es-MX', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-xl font-bold text-white">
                        {formatCurrency(payment.amount, payment.currency)}
                      </span>

                      <InvoiceViewer paymentId={payment.id}>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-slate-600 text-slate-300 hover:text-white"
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Factura
                        </Button>
                      </InvoiceViewer>

                      {payment.stripe_invoice_id && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-slate-600 text-slate-300 hover:text-white"
                          asChild
                        >
                          <a
                            href={`https://dashboard.stripe.com/invoices/${payment.stripe_invoice_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="w-4 h-4 mr-2" />
                            Stripe
                          </a>
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
