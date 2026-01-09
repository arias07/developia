'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Download, Printer, FileText, Loader2, X } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase/client';

interface InvoiceData {
  invoice: {
    id: string;
    number: string;
    date: string;
    dueDate: string;
    status: string;
  };
  client: {
    name: string;
    email: string;
    company?: string;
  };
  project: {
    name: string;
    description: string;
  };
  payment: {
    id: string;
    amount: number;
    currency: string;
    type: string;
    paidAt?: string;
  };
  company: {
    name: string;
    tagline: string;
    email: string;
    website: string;
  };
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  totals: {
    subtotal: number;
    tax: number;
    taxRate: number;
    total: number;
  };
}

interface InvoiceViewerProps {
  paymentId: string;
  children?: React.ReactNode;
}

export function InvoiceViewer({ paymentId, children }: InvoiceViewerProps) {
  const [loading, setLoading] = useState(false);
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const fetchInvoice = async () => {
    setLoading(true);
    setError(null);

    try {
      const supabase = getSupabaseClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        setError('No hay sesión activa');
        return;
      }

      const response = await fetch(`/api/invoices/${paymentId}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Error al cargar la factura');
        return;
      }

      const data = await response.json();
      setInvoice(data);
    } catch {
      setError('Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && !invoice) {
      fetchInvoice();
    }
  };

  const handlePrint = () => {
    if (printRef.current) {
      const printContent = printRef.current.innerHTML;
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <title>Factura ${invoice?.invoice.number}</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #1e293b; }
              .invoice-container { max-width: 800px; margin: 0 auto; }
              .header { display: flex; justify-content: space-between; margin-bottom: 40px; }
              .company-name { font-size: 28px; font-weight: bold; color: #a855f7; }
              .company-tagline { color: #64748b; font-size: 14px; }
              .invoice-title { text-align: right; }
              .invoice-title h2 { font-size: 24px; color: #1e293b; }
              .invoice-number { color: #64748b; margin-top: 4px; }
              .info-section { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 40px; }
              .info-box h3 { font-size: 12px; text-transform: uppercase; color: #64748b; margin-bottom: 8px; letter-spacing: 1px; }
              .info-box p { color: #1e293b; line-height: 1.6; }
              .items-table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
              .items-table th { background: #f1f5f9; padding: 12px; text-align: left; font-size: 12px; text-transform: uppercase; color: #64748b; }
              .items-table td { padding: 16px 12px; border-bottom: 1px solid #e2e8f0; }
              .items-table .amount { text-align: right; }
              .totals { width: 300px; margin-left: auto; }
              .totals-row { display: flex; justify-content: space-between; padding: 8px 0; }
              .totals-row.total { border-top: 2px solid #1e293b; font-weight: bold; font-size: 18px; padding-top: 12px; margin-top: 8px; }
              .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
              .status-completed { background: #dcfce7; color: #166534; }
              .status-pending { background: #fef3c7; color: #92400e; }
              .footer { margin-top: 60px; text-align: center; color: #64748b; font-size: 12px; }
              @media print {
                body { padding: 20px; }
                @page { margin: 1cm; }
              }
            </style>
          </head>
          <body>
            ${printContent}
          </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const formatCurrency = (amount: number, currency: string) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      completed: 'Pagado',
      pending: 'Pendiente',
      processing: 'Procesando',
      failed: 'Fallido',
      refunded: 'Reembolsado',
    };
    return labels[status] || status;
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        {children || (
          <Button variant="outline" size="sm" className="border-slate-600 text-slate-300 hover:text-white">
            <FileText className="w-4 h-4 mr-2" />
            Factura
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-slate-900 border-slate-700 max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-white">Factura</DialogTitle>
          {invoice && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="border-slate-600 text-slate-300 hover:text-white"
              >
                <Printer className="w-4 h-4 mr-2" />
                Imprimir
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrint}
                className="border-slate-600 text-slate-300 hover:text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                Descargar PDF
              </Button>
            </div>
          )}
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <X className="w-12 h-12 text-red-400 mb-4" />
            <p className="text-red-400">{error}</p>
            <Button variant="outline" onClick={fetchInvoice} className="mt-4">
              Reintentar
            </Button>
          </div>
        )}

        {invoice && (
          <div ref={printRef} className="bg-white text-slate-900 p-8 rounded-lg">
            <div className="invoice-container">
              {/* Header */}
              <div className="header flex justify-between items-start mb-10">
                <div>
                  <h1 className="company-name text-3xl font-bold text-purple-600">
                    {invoice.company.name}
                  </h1>
                  <p className="company-tagline text-slate-500">{invoice.company.tagline}</p>
                  <p className="text-sm text-slate-500 mt-2">{invoice.company.email}</p>
                  <p className="text-sm text-slate-500">{invoice.company.website}</p>
                </div>
                <div className="invoice-title text-right">
                  <h2 className="text-2xl font-bold text-slate-900">FACTURA</h2>
                  <p className="invoice-number text-slate-500">{invoice.invoice.number}</p>
                  <div className="mt-2">
                    <span
                      className={`status-badge ${
                        invoice.invoice.status === 'completed' ? 'status-completed' : 'status-pending'
                      }`}
                    >
                      {getStatusLabel(invoice.invoice.status)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Info Section */}
              <div className="info-section grid grid-cols-2 gap-10 mb-10">
                <div className="info-box">
                  <h3 className="text-xs uppercase text-slate-500 mb-2 tracking-wider">Facturar a</h3>
                  <p className="font-semibold text-slate-900">{invoice.client.name}</p>
                  {invoice.client.company && <p className="text-slate-600">{invoice.client.company}</p>}
                  <p className="text-slate-600">{invoice.client.email}</p>
                </div>
                <div className="info-box">
                  <h3 className="text-xs uppercase text-slate-500 mb-2 tracking-wider">
                    Detalles de la factura
                  </h3>
                  <p className="text-slate-600">
                    <span className="text-slate-500">Fecha:</span> {formatDate(invoice.invoice.date)}
                  </p>
                  {invoice.payment.paidAt && (
                    <p className="text-slate-600">
                      <span className="text-slate-500">Fecha de pago:</span>{' '}
                      {formatDate(invoice.payment.paidAt)}
                    </p>
                  )}
                  <p className="text-slate-600">
                    <span className="text-slate-500">Proyecto:</span> {invoice.project.name}
                  </p>
                </div>
              </div>

              {/* Items Table */}
              <table className="items-table w-full mb-10">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="p-3 text-left text-xs uppercase text-slate-500">Descripción</th>
                    <th className="p-3 text-center text-xs uppercase text-slate-500">Cantidad</th>
                    <th className="p-3 text-right text-xs uppercase text-slate-500">Precio unitario</th>
                    <th className="p-3 text-right text-xs uppercase text-slate-500">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {invoice.items.map((item, index) => (
                    <tr key={index} className="border-b border-slate-200">
                      <td className="p-4">{item.description}</td>
                      <td className="p-4 text-center">{item.quantity}</td>
                      <td className="p-4 text-right">
                        {formatCurrency(item.unitPrice, invoice.payment.currency)}
                      </td>
                      <td className="p-4 text-right font-medium">
                        {formatCurrency(item.total, invoice.payment.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals */}
              <div className="totals ml-auto w-72">
                <div className="totals-row flex justify-between py-2">
                  <span className="text-slate-500">Subtotal</span>
                  <span>{formatCurrency(invoice.totals.subtotal, invoice.payment.currency)}</span>
                </div>
                {invoice.totals.tax > 0 && (
                  <div className="totals-row flex justify-between py-2">
                    <span className="text-slate-500">IVA ({invoice.totals.taxRate * 100}%)</span>
                    <span>{formatCurrency(invoice.totals.tax, invoice.payment.currency)}</span>
                  </div>
                )}
                <div className="totals-row total flex justify-between py-3 border-t-2 border-slate-900 font-bold text-lg mt-2">
                  <span>Total</span>
                  <span className="text-purple-600">
                    {formatCurrency(invoice.totals.total, invoice.payment.currency)}
                  </span>
                </div>
              </div>

              {/* Footer */}
              <div className="footer mt-16 text-center text-slate-500 text-sm">
                <p>Gracias por confiar en {invoice.company.name}</p>
                <p className="mt-1">{invoice.company.website}</p>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
