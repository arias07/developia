'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { getSupabaseClient } from '@/lib/supabase/client';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const projectId = searchParams.get('project_id');
  const [loading, setLoading] = useState(true);
  const [projectName, setProjectName] = useState<string>('');

  useEffect(() => {
    const fetchProject = async () => {
      if (projectId) {
        const supabase = getSupabaseClient();
        const { data } = await supabase
          .from('projects')
          .select('name')
          .eq('id', projectId)
          .single();

        if (data) {
          setProjectName(data.name);
        }
      }
      setLoading(false);
    };

    fetchProject();
  }, [projectId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
      </div>
    );
  }

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
              className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6"
            >
              <CheckCircle className="w-10 h-10 text-green-400" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h1 className="text-2xl font-bold text-white mb-2">¡Pago exitoso!</h1>
              <p className="text-slate-400 mb-6">
                Tu pago ha sido procesado correctamente.
                {projectName && (
                  <>
                    <br />
                    <span className="text-purple-400">{projectName}</span>
                  </>
                )}
              </p>

              <div className="space-y-4">
                <div className="p-4 rounded-lg bg-slate-800/50 border border-slate-700">
                  <p className="text-sm text-slate-400 mb-1">¿Qué sigue?</p>
                  <p className="text-slate-300 text-sm">
                    Nuestro equipo comenzará a trabajar en tu proyecto.
                    Recibirás actualizaciones periódicas sobre el progreso.
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  {projectId && (
                    <Link href={`/dashboard/projects/${projectId}`} className="w-full">
                      <Button className="w-full bg-purple-600 hover:bg-purple-700">
                        Ver proyecto
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>
                  )}
                  <Link href="/dashboard" className="w-full">
                    <Button variant="outline" className="w-full border-slate-700">
                      Ir al dashboard
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
