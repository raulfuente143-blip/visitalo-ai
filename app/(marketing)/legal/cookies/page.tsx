import type { Metadata } from "next";
import { LegalPage } from "@/components/legal-page";
import { legal } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Política de cookies",
};

export default function CookiesPage() {
  const mail = <a href={`mailto:${legal.contactEmail}`}>{legal.contactEmail}</a>;

  return (
    <LegalPage
      title="Política de cookies"
      intro="Visitalo.ai solo utiliza las cookies imprescindibles para que el servicio funcione. No usamos cookies de análisis ni de publicidad."
      sections={[
        {
          title: "Qué son las cookies",
          body: (
            <p>
              Las cookies son pequeños archivos que una web guarda en tu navegador para recordar información entre una visita y otra, como que has iniciado sesión.
            </p>
          ),
        },
        {
          title: "Qué cookies usamos",
          body: (
            <>
              <p>
                Usamos únicamente <strong>cookies técnicas</strong>, propias, necesarias para mantener tu sesión iniciada de forma segura:
              </p>
              <ul>
                <li>
                  <strong>Cookies de sesión de autenticación</strong> (con nombres que empiezan por «sb-» y terminan en «-auth-token»). Finalidad: mantener tu sesión iniciada y proteger tu cuenta. Duración: hasta que cierras sesión o la sesión caduca.
                </li>
              </ul>
              <p>Las fuentes tipográficas de la web se sirven desde nuestro propio servidor, sin conectarse a servicios de terceros.</p>
            </>
          ),
        },
        {
          title: "Por qué no te pedimos consentimiento",
          body: (
            <p>
              Las cookies estrictamente necesarias para prestar un servicio que has solicitado están exentas de consentimiento, según el artículo 22.2 de la Ley 34/2002 de Servicios de la Sociedad de la Información (LSSI). Como no usamos cookies de análisis, de personalización ni de publicidad, no mostramos un aviso de cookies. Si en el futuro incorporamos cookies de otro tipo, actualizaremos esta política y te pediremos tu consentimiento antes de instalarlas.
            </p>
          ),
        },
        {
          title: "Pagos",
          body: (
            <p>
              Cuando pagas tu suscripción, el proceso de pago se realiza en la plataforma de Stripe, que puede instalar sus propias cookies conforme a su política de cookies.
            </p>
          ),
        },
        {
          title: "Cómo gestionar las cookies",
          body: (
            <p>
              Puedes ver, bloquear o eliminar las cookies desde la configuración de tu navegador. Ten en cuenta que, si bloqueas las cookies técnicas, no podrás iniciar sesión en Visitalo.ai.
            </p>
          ),
        },
        {
          title: "Contacto",
          body: <p>Si tienes cualquier pregunta sobre esta política, escríbenos a {mail}.</p>,
        },
      ]}
    />
  );
}
