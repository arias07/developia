'use client';

import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { XCircle, ArrowLeft, RefreshCcw } from 'lucide-react';
import Link from 'next/link';

export default function PaymentCancelledPage() {
  const searchParams = useSearchParams();
  const projectId = searchParams.get('project_id');

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="max-w-md w-full"
      >
        <Card className="bg-slate-900 border-slate-800 text-center">
          <CardContent className="pt-12 pb-8 px-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <XCircle className="w-10 h-10 text-red-400" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h1 className="text-2xl font-bold text-white mb-2">Pago cancelado</h1>
              <p className="text-slate-400 mb-6">
                El proceso de pago fue cancelado. No se realizó ningún cargo a tu tarjeta.
              </p>

              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                  <p className="text-sm text-slate-400 mb-1">¿Necesitas ayuda?</p>
                  <p className="text-slate-300 text-sm">
                    Si tuviste algún problema con el pago, puedes contactarnos
                    o intentar nuevamente.
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  {projectId && (
                    <Link href={`/dashboard/projects/${projectId}`} className="w-full">
                      <Button className="w-full bg-purple-600 hover:bg-purple-700">
                        <RefreshCcw className="w-4 h-4 mr-2" />
                        Intentar de nuevo
                      </Button>
                    </Link>
                  )}
                  <Link href="/dashboard" className="w-full">
                    <Button variant="outline" className="w-full border-slate-700">
                      <ArrowLeft className="w-4 h-4 mr-2" />
                      Volver al dashboard
                    </Button>
                  </Link>
                </div>
              </div>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
