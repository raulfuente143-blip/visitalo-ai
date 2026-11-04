import type { Metadata } from "next";
import { HolderDetails, LegalPage } from "@/components/legal-page";
import { legal } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Política de privacidad",
};

export default function PrivacidadPage() {
  const mail = <a href={`mailto:${legal.contactEmail}`}>{legal.contactEmail}</a>;

  return (
    <LegalPage
      title="Política de privacidad"
      intro="Esta política explica qué datos personales tratamos cuando usas Visitalo.ai, para qué los usamos y qué derechos tienes. Se aplica el Reglamento General de Protección de Datos (RGPD) y la Ley Orgánica 3/2018 de Protección de Datos Personales y garantía de los derechos digitales (LOPDGDD)."
      sections={[
        {
          title: "Responsable del tratamiento",
          body: (
            <>
              <p>El responsable del tratamiento de tus datos es:</p>
              <HolderDetails />
            </>
          ),
        },
        {
          title: "Qué datos tratamos",
          body: (
            <ul>
              <li>
                <strong>Datos de cuenta:</strong> tu email, tu contraseña (que se guarda cifrada y nadie puede ver) y tu nombre, si lo indicas.
              </li>
              <li>
                <strong>Datos de la agencia:</strong> nombre, logo y color de marca.
              </li>
              <li>
                <strong>Contenido que subes:</strong> planos, fotografías de inmuebles, direcciones, referencias internas y los vídeos que se generan a partir de ellos.
              </li>
              <li>
                <strong>Datos de facturación:</strong> los pagos los gestiona Stripe. Nosotros no almacenamos los datos completos de tu tarjeta.
              </li>
              <li>
                <strong>Datos técnicos:</strong> los mínimos necesarios para mantener tu sesión iniciada y proteger la seguridad del servicio.
              </li>
            </ul>
          ),
        },
        {
          title: "Para qué los usamos y con qué base legal",
          body: (
            <>
              <ul>
                <li>
                  <strong>Prestarte el servicio</strong> (crear tu cuenta, generar y guardar tus vídeos, darte soporte). Base legal: la ejecución del contrato (art. 6.1.b RGPD).
                </li>
                <li>
                  <strong>Cobrar tu suscripción y cumplir obligaciones fiscales y contables.</strong> Base legal: el cumplimiento de obligaciones legales (art. 6.1.c RGPD).
                </li>
                <li>
                  <strong>Enviarte avisos sobre el servicio</strong> (seguridad, cambios en la cuenta o en las condiciones). Base legal: la ejecución del contrato.
                </li>
                <li>
                  <strong>Proteger la seguridad del servicio y prevenir el fraude.</strong> Base legal: nuestro interés legítimo (art. 6.1.f RGPD).
                </li>
              </ul>
              <p>
                No vendemos tus datos, no los usamos para publicidad y no tomamos decisiones automatizadas que produzcan efectos jurídicos sobre ti.
              </p>
            </>
          ),
        },
        {
          title: "Datos personales dentro del contenido que subes",
          body: (
            <>
              <p>
                Las fotografías y documentos que sube una agencia pueden contener datos personales de terceros (por ejemplo, personas o documentos visibles en una imagen). Respecto a ese contenido, la agencia es la responsable del tratamiento y Visitalo.ai actúa como encargado del tratamiento, en los términos recogidos en los Términos y condiciones.
              </p>
              <p>Te recomendamos no subir imágenes en las que aparezcan personas identificables o documentos personales.</p>
            </>
          ),
        },
        {
          title: "Proveedores que tratan datos por nuestra cuenta",
          body: (
            <>
              <p>Para prestar el servicio trabajamos con proveedores que actúan como encargados del tratamiento:</p>
              <ul>
                <li>
                  <strong>Supabase:</strong> base de datos, inicio de sesión y almacenamiento de archivos. Servidores en la Unión Europea.
                </li>
                <li>
                  <strong>Vercel:</strong> alojamiento de la web.
                </li>
                <li>
                  <strong>Stripe:</strong> gestión de pagos y suscripciones.
                </li>
                <li>
                  <strong>Resend:</strong> envío de emails relacionados con el servicio.
                </li>
              </ul>
              <p>
                Algunos de estos proveedores pueden tratar datos fuera del Espacio Económico Europeo, principalmente en Estados Unidos. En ese caso, la transferencia se ampara en el Marco de Privacidad de Datos UE-EE. UU. o en las cláusulas contractuales tipo aprobadas por la Comisión Europea.
              </p>
            </>
          ),
        },
        {
          title: "Cuánto tiempo los conservamos",
          body: (
            <>
              <p>
                Conservamos tus datos mientras tu cuenta esté activa. Puedes eliminar en cualquier momento tus propiedades y vídeos desde el panel.
              </p>
              <p>
                Cuando cierres tu cuenta, eliminaremos o anonimizaremos tus datos en un plazo razonable, salvo aquellos que debamos conservar por obligación legal, como los de facturación, durante los plazos que marca la normativa fiscal y mercantil (hasta seis años).
              </p>
            </>
          ),
        },
        {
          title: "Tus derechos",
          body: (
            <>
              <p>
                Puedes ejercer en cualquier momento tus derechos de acceso, rectificación, supresión, oposición, limitación del tratamiento y portabilidad escribiendo a {mail}. Indica qué derecho quieres ejercer; si es necesario, te pediremos información para confirmar tu identidad.
              </p>
              <p>
                Si consideras que no hemos tratado tus datos correctamente, puedes presentar una reclamación ante la Agencia Española de Protección de Datos (
                <a href="https://www.aepd.es" target="_blank" rel="noopener noreferrer">
                  www.aepd.es
                </a>
                ).
              </p>
            </>
          ),
        },
        {
          title: "Seguridad",
          body: (
            <p>
              Aplicamos medidas técnicas y organizativas para proteger tus datos: contraseñas cifradas, conexiones seguras (HTTPS) y acceso restringido a la información de cada agencia.
            </p>
          ),
        },
        {
          title: "Cambios en esta política",
          body: (
            <p>
              Podemos actualizar esta política para reflejar cambios en el servicio o en la normativa. Si los cambios son relevantes, te avisaremos por email o a través del panel antes de que entren en vigor.
            </p>
          ),
        },
      ]}
    />
  );
}
