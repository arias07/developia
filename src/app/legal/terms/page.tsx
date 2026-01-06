import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Términos y Condiciones | Devvy',
  description: 'Términos y condiciones de uso de Devvy',
};

export default function TermsPage() {
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

        <h1 className="text-4xl font-bold text-white mb-8">Términos y Condiciones</h1>

        <div className="prose prose-invert max-w-none">
          <p className="text-slate-300 text-lg mb-8">
            Última actualización: 2 de enero de 2026
          </p>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">1. Aceptación de Términos</h2>
            <p className="text-slate-300">
              Al acceder y utilizar los servicios de Devvy, usted acepta estos términos y
              condiciones en su totalidad. Si no está de acuerdo con alguna parte de estos
              términos, no debe utilizar nuestros servicios.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">2. Descripción del Servicio</h2>
            <p className="text-slate-300 mb-4">
              Devvy ofrece servicios de desarrollo de software utilizando tecnología avanzada,
              incluyendo pero no limitado a:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2">
              <li>Desarrollo de aplicaciones web y móviles</li>
              <li>Generación automatizada de código</li>
              <li>Consultoría técnica</li>
              <li>Diseño de interfaces de usuario</li>
              <li>Integración de sistemas</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">3. Cuenta de Usuario</h2>
            <p className="text-slate-300 mb-4">
              Para utilizar nuestros servicios, debe crear una cuenta proporcionando información
              precisa y completa. Usted es responsable de:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2">
              <li>Mantener la confidencialidad de sus credenciales</li>
              <li>Todas las actividades realizadas bajo su cuenta</li>
              <li>Notificar inmediatamente cualquier uso no autorizado</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">4. Pagos y Facturación</h2>
            <p className="text-slate-300 mb-4">
              Los precios de nuestros servicios se determinan según el alcance del proyecto:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2">
              <li>Las cotizaciones tienen validez de 30 días</li>
              <li>Se requiere un anticipo del 50% para iniciar el proyecto</li>
              <li>El saldo restante se paga al completar el proyecto</li>
              <li>Aceptamos pagos mediante tarjeta de crédito/débito (Stripe)</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">5. Política de Reembolsos</h2>
            <p className="text-slate-300 mb-4">
              Nuestra política de reembolsos es la siguiente:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2">
              <li>
                <strong>Antes de iniciar:</strong> Reembolso del 100% del anticipo
              </li>
              <li>
                <strong>Durante el desarrollo (menos del 25% completado):</strong> Reembolso del 75%
              </li>
              <li>
                <strong>Durante el desarrollo (25-50% completado):</strong> Reembolso del 50%
              </li>
              <li>
                <strong>Más del 50% completado:</strong> No se realizan reembolsos
              </li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">6. Propiedad Intelectual</h2>
            <p className="text-slate-300 mb-4">
              Una vez completado el pago total:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2">
              <li>El cliente obtiene la propiedad total del código fuente desarrollado</li>
              <li>
                Devvy retiene el derecho de usar el proyecto como referencia (portafolio)
              </li>
              <li>Las bibliotecas de terceros mantienen sus licencias originales</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">7. Confidencialidad</h2>
            <p className="text-slate-300">
              Nos comprometemos a mantener la confidencialidad de toda la información
              proporcionada por el cliente. No compartiremos datos con terceros sin
              consentimiento expreso, excepto cuando sea requerido por ley.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">8. Garantía</h2>
            <p className="text-slate-300 mb-4">
              Ofrecemos las siguientes garantías:
            </p>
            <ul className="list-disc list-inside text-slate-300 space-y-2">
              <li>30 días de corrección de bugs sin costo adicional</li>
              <li>Código limpio y documentado</li>
              <li>Funcionalidad según lo especificado en el PRD aprobado</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">9. Limitación de Responsabilidad</h2>
            <p className="text-slate-300">
              Devvy no será responsable por daños indirectos, incidentales o consecuentes
              que resulten del uso de nuestros servicios. Nuestra responsabilidad máxima se
              limita al monto pagado por el cliente por el servicio específico.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">10. Modificaciones</h2>
            <p className="text-slate-300">
              Nos reservamos el derecho de modificar estos términos en cualquier momento.
              Los cambios entrarán en vigor inmediatamente después de su publicación.
              El uso continuado de nuestros servicios constituye aceptación de los nuevos términos.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold text-white mb-4">11. Contacto</h2>
            <p className="text-slate-300">
              Para cualquier pregunta sobre estos términos, puede contactarnos en:
            </p>
            <p className="text-purple-400 mt-2">legal@developia.com</p>
          </section>
        </div>
      </div>
    </div>
  );
}
