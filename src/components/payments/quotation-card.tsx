'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  DollarSign,
  Clock,
  FileText,
  CheckCircle,
  Loader2,
  CreditCard,
  Download,
} from 'lucide-react';

interface QuotationBreakdown {
  phase: string;
  hours: number;
  cost: number;
  description: string;
}

interface QuotationCardProps {
  projectId: string;
  projectName: string;
  quotation: {
    estimatedHours: number;
    hourlyRate: number;
    totalCost: number;
    breakdown: QuotationBreakdown[];
    timeline: string;
    notes: string[];
  };
  status: 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired';
  onAccept?: () => void;
  onPay?: (amount: number, paymentType: string) => void;
  isClient?: boolean;
}

const statusColors: Record<string, string> = {
  draft: 'bg-slate-500',
  sent: 'bg-blue-500',
  accepted: 'bg-green-500',
  rejected: 'bg-red-500',
  expired: 'bg-yellow-500',
};

const statusLabels: Record<string, string> = {
  draft: 'Borrador',
  sent: 'Enviada',
  accepted: 'Aceptada',
  rejected: 'Rechazada',
  expired: 'Expirada',
};

export function QuotationCard({
  projectId,
  projectName,
  quotation,
  status,
  onAccept,
  onPay,
  isClient = false,
}: QuotationCardProps) {
  const [loading, setLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

  const depositAmount = quotation.totalCost * 0.5; // 50% deposit

  const handleAccept = async () => {
    if (!onAccept) return;
    setLoading(true);
    try {
      await onAccept();
    } finally {
      setLoading(false);
    }
  };

  const handlePayDeposit = async () => {
    if (!onPay) return;
    setPaymentLoading(true);
    try {
      await onPay(depositAmount, 'deposit');
    } finally {
      setPaymentLoading(false);
    }
  };

  const downloadQuotation = () => {
    const content = `
COTIZACIÓN - ${projectName}
========================================

Fecha: ${new Date().toLocaleDateString()}
Estado: ${statusLabels[status]}

RESUMEN
-------
Horas estimadas: ${quotation.estimatedHours} hrs
Tarifa promedio: $${quotation.hourlyRate}/hr
Total: $${quotation.totalCost.toLocaleString()} USD

DESGLOSE
--------
${quotation.breakdown.map((b) => `${b.phase}: ${b.hours} hrs - $${b.cost.toLocaleString()}\n  ${b.description}`).join('\n\n')}

CRONOGRAMA
----------
${quotation.timeline}

NOTAS
-----
${quotation.notes.map((n) => `• ${n}`).join('\n')}

========================================
Generado por DevelopIA
    `;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cotizacion-${projectName.toLowerCase().replace(/\s+/g, '-')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-400" />
            Cotización
          </CardTitle>
          <Badge className={`${statusColors[status]} text-white border-none`}>
            {statusLabels[status]}
          </Badge>
        </div>
        <p className="text-slate-400 text-sm">{projectName}</p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 rounded-lg bg-slate-800/50">
            <Clock className="w-5 h-5 text-cyan-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{quotation.estimatedHours}</p>
            <p className="text-xs text-slate-400">Horas estimadas</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-slate-800/50">
            <DollarSign className="w-5 h-5 text-green-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">${quotation.hourlyRate}</p>
            <p className="text-xs text-slate-400">Tarifa/hora</p>
          </div>
          <div className="text-center p-4 rounded-lg bg-purple-600/20">
            <DollarSign className="w-5 h-5 text-purple-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-purple-400">${quotation.totalCost.toLocaleString()}</p>
            <p className="text-xs text-slate-400">Total USD</p>
          </div>
        </div>

        <Separator className="bg-slate-700" />

        {/* Breakdown */}
        <div>
          <h4 className="text-sm font-medium text-slate-400 mb-3">Desglose de costos</h4>
          <div className="space-y-3">
            {quotation.breakdown.map((item, index) => (
              <div key={index} className="flex items-start justify-between p-3 rounded-lg bg-slate-800/30">
                <div className="flex-1">
                  <p className="font-medium text-white">{item.phase}</p>
                  <p className="text-xs text-slate-400">{item.description}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium text-white">${item.cost.toLocaleString()}</p>
                  <p className="text-xs text-slate-400">{item.hours} hrs</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator className="bg-slate-700" />

        {/* Timeline */}
        <div>
          <h4 className="text-sm font-medium text-slate-400 mb-2">Tiempo estimado</h4>
          <p className="text-white">{quotation.timeline}</p>
        </div>

        {/* Notes */}
        {quotation.notes.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-slate-400 mb-2">Notas importantes</h4>
            <ul className="space-y-1">
              {quotation.notes.map((note, index) => (
                <li key={index} className="text-sm text-slate-300 flex items-start gap-2">
                  <span className="text-purple-400">•</span>
                  {note}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Payment info for accepted quotes */}
        {status === 'accepted' && isClient && (
          <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="font-medium text-green-400">Cotización aceptada</span>
            </div>
            <p className="text-slate-300 text-sm mb-3">
              Para iniciar el desarrollo, se requiere un anticipo del 50%:
            </p>
            <p className="text-2xl font-bold text-white">
              Anticipo: ${depositAmount.toLocaleString()} USD
            </p>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex flex-col sm:flex-row gap-3">
        <Button variant="outline" className="flex-1 border-slate-700" onClick={downloadQuotation}>
          <Download className="w-4 h-4 mr-2" />
          Descargar
        </Button>

        {isClient && status === 'sent' && onAccept && (
          <Button
            className="flex-1 bg-green-600 hover:bg-green-700"
            onClick={handleAccept}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Aceptar cotización
              </>
            )}
          </Button>
        )}

        {isClient && status === 'accepted' && onPay && (
          <Button
            className="flex-1 bg-purple-600 hover:bg-purple-700"
            onClick={handlePayDeposit}
            disabled={paymentLoading}
          >
            {paymentLoading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Procesando...
              </>
            ) : (
              <>
                <CreditCard className="w-4 h-4 mr-2" />
                Pagar anticipo (${depositAmount.toLocaleString()})
              </>
            )}
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
