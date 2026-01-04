import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Política de Privacidad | Devvy',
  description: 'Política de privacidad de Devvy',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-4xl mx-auto px-4 py-12">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver al inicio
        </Link>

        <h1 className="text-4xl font-bold text-white mb-8">Política de Privacidad</h1>

        <div className="prose prose-invert max-w-none">
          <p className="text-slate-300 text-lg mb-8">
            Última actualización: 2 de enero de 2026
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">1. Introducción</h2>
            <p className="text-slate-300">
              En Devvy, respetamos su privacidad y nos comprometemos a proteger sus datos
              personales. Esta política de privacidad explica cómo recopilamos, usamos y
              protegemos su información cuando utiliza nuestros servicios.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">2. Información que Recopilamos</h2>
            <p className="text-slate-300 mb-4">Recopilamos los siguientes tipos de información:</p>

            <h3 className="text-xl font-medium text-white mb-2">2.1 Información proporcionada por usted</h3>
            <ul className="list-disc list-inside text-slate-300 space-y-2 mb-4">
              <li>Nombre completo y datos de contacto</li>
              <li>Dirección de correo electrónico</li>
              <li>Información de la empresa (si aplica)</li>
              <li>Detalles del proyecto y requerimientos</li>
              <li>Información de pago (procesada de forma segura por Stripe)</li>
            </ul>

            <h3 className="text-xl font-medium text-white mb-2">2.2 Información recopilada automáticamente</h3>
            <ul className="list-disc list-inside text-slate-300 space-y-2">
              <li>Dirección IP y ubicación geográfica aproximada</li>
              <li>Tipo de navegador y dispositivo</li>
              <li>Páginas visitadas y tiempo de navegación</li>
              <li>Cookies y tecnologías similares</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">3. Cómo Usamos su Información</h2>
            <p className="text-slate-300 mb-4">Utilizamos su información para:</p>
            <ul className="list-disc list-inside text-slate-300 space-y-2">
              <li>Proveer y mejorar nuestros servicios</li>
              <li>Procesar pagos y transacciones</li>
              <li>Comunicarnos sobre su proyecto</li>
              <li>Enviar actualizaciones y notificaciones relevantes</li>
              <li>Cumplir con obligaciones legales</li>
              <li>Prevenir fraude y actividades maliciosas</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">4. Compartir Información</h2>
            <p className="text-slate-300 mb-4">
              No vendemos ni alquilamos su información personal. Podemos compartirla con:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2">
              <li>
                <strong>Proveedores de servicios:</strong> Stripe (pagos), Supabase (base de datos),
                Vercel (hosting)
              </li>
              <li>
                <strong>Socios de IA:</strong> OpenAI y Anthropic (para generación de código y
                documentos)
              </li>
              <li>
                <strong>Autoridades legales:</strong> Cuando sea requerido por ley
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">5. Seguridad de Datos</h2>
            <p className="text-slate-300 mb-4">
              Implementamos medidas de seguridad robustas, incluyendo:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2">
              <li>Encriptación SSL/TLS para todas las comunicaciones</li>
              <li>Encriptación de datos en reposo</li>
              <li>Autenticación de dos factores (opcional)</li>
              <li>Acceso restringido basado en roles</li>
              <li>Monitoreo continuo de seguridad</li>
              <li>Backups regulares y plan de recuperación</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">6. Cookies</h2>
            <p className="text-slate-300 mb-4">Utilizamos cookies para:</p>
            <ul className="list-disc list-inside text-slate-300 space-y-2">
              <li>Mantener su sesión activa</li>
              <li>Recordar sus preferencias</li>
              <li>Analizar el uso del sitio (analytics)</li>
              <li>Mejorar la experiencia de usuario</li>
            </ul>
            <p className="text-slate-300 mt-4">
              Puede configurar su navegador para rechazar cookies, aunque esto puede afectar
              la funcionalidad del sitio.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">7. Sus Derechos</h2>
            <p className="text-slate-300 mb-4">Usted tiene derecho a:</p>
            <ul className="list-disc list-inside text-slate-300 space-y-2">
              <li>
                <strong>Acceso:</strong> Solicitar una copia de sus datos personales
              </li>
              <li>
                <strong>Rectificación:</strong> Corregir datos inexactos
              </li>
              <li>
                <strong>Eliminación:</strong> Solicitar la eliminación de sus datos
              </li>
              <li>
                <strong>Portabilidad:</strong> Recibir sus datos en formato estructurado
              </li>
              <li>
                <strong>Oposición:</strong> Oponerse al procesamiento de sus datos
              </li>
            </ul>
            <p className="text-slate-300 mt-4">
              Para ejercer estos derechos, contacte a privacy@developia.com
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">8. Retención de Datos</h2>
            <p className="text-slate-300">
              Conservamos sus datos mientras tenga una cuenta activa o según sea necesario
              para proporcionar servicios. Después de la terminación de la cuenta, podemos
              retener ciertos datos por un período limitado para cumplir con obligaciones
              legales, resolver disputas y hacer cumplir nuestros acuerdos.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">9. Transferencias Internacionales</h2>
            <p className="text-slate-300">
              Sus datos pueden ser procesados en servidores ubicados fuera de su país de
              residencia. Nos aseguramos de que cualquier transferencia cumpla con las
              regulaciones de protección de datos aplicables mediante cláusulas contractuales
              estándar u otros mecanismos aprobados.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">10. Menores de Edad</h2>
            <p className="text-slate-300">
              Nuestros servicios no están dirigidos a menores de 18 años. No recopilamos
              conscientemente información de menores. Si descubrimos que hemos recopilado
              datos de un menor, los eliminaremos inmediatamente.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">11. Cambios a esta Política</h2>
            <p className="text-slate-300">
              Podemos actualizar esta política periódicamente. Le notificaremos sobre cambios
              significativos por correo electrónico o mediante un aviso destacado en nuestro
              sitio. Le recomendamos revisar esta política regularmente.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">12. Contacto</h2>
            <p className="text-slate-300 mb-4">
              Para cualquier pregunta sobre esta política de privacidad o el tratamiento
              de sus datos:
            </p>
            <div className="bg-slate-800/50 p-4 rounded-lg border border-slate-700">
              <p className="text-slate-300">
                <strong className="text-white">Email:</strong> privacy@developia.com
              </p>
              <p className="text-slate-300 mt-2">
                <strong className="text-white">Responsable de Datos:</strong> Devvy Privacy Team
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
