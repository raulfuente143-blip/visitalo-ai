import type { Metadata } from "next";
import { HolderDetails, LegalPage } from "@/components/legal-page";
import { legal } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Términos y condiciones",
};

export default function TerminosPage() {
  const mail = <a href={`mailto:${legal.contactEmail}`}>{legal.contactEmail}</a>;

  return (
    <LegalPage
      title="Términos y condiciones"
      intro="Estos términos regulan el acceso a la web visitalo.ai y la contratación del servicio Visitalo.ai. Al crear una cuenta o contratar un plan, aceptas estos términos."
      sections={[
        {
          title: "Titular del sitio web",
          body: (
            <>
              <p>
                En cumplimiento del artículo 10 de la Ley 34/2002 de Servicios de la Sociedad de la Información y de Comercio Electrónico (LSSI), estos son los datos del titular:
              </p>
              <HolderDetails />
            </>
          ),
        },
        {
          title: "Qué es Visitalo.ai",
          body: (
            <p>
              Visitalo.ai es un servicio web que permite a las agencias inmobiliarias generar vídeos de sus propiedades a partir de un plano y de fotografías, con la identidad visual de la agencia.
            </p>
          ),
        },
        {
          title: "A quién va dirigido",
          body: (
            <p>
              El servicio está dirigido exclusivamente a profesionales y empresas del sector inmobiliario. Al contratar, declaras que actúas en el ámbito de tu actividad empresarial o profesional y no como consumidor.
            </p>
          ),
        },
        {
          title: "Tu cuenta",
          body: (
            <ul>
              <li>Debes facilitar información veraz y mantenerla actualizada.</li>
              <li>Eres responsable de mantener la confidencialidad de tus credenciales y de toda la actividad que se realice desde tu cuenta.</li>
              <li>Cada plan incluye un número máximo de usuarios por oficina. Las credenciales son personales y no deben compartirse.</li>
            </ul>
          ),
        },
        {
          title: "Planes, precios y pago",
          body: (
            <ul>
              <li>El servicio se contrata mediante una suscripción mensual por oficina, según los planes y precios publicados en la web en el momento de la contratación.</li>
              <li>Los precios publicados no incluyen IVA, que se añadirá en la factura conforme a la normativa vigente.</li>
              <li>El pago se realiza por adelantado cada mes, a través de Stripe, con el método de pago que indiques.</li>
              <li>Los límites de cada plan (vídeos, habitaciones por vídeo y usuarios) se aplican por periodo mensual y no son acumulables de un mes a otro.</li>
              <li>Las funciones marcadas como «Próximamente» no forman parte del servicio contratado hasta que estén disponibles.</li>
            </ul>
          ),
        },
        {
          title: "Sin permanencia y cancelación",
          body: (
            <>
              <p>
                Puedes cancelar tu suscripción en cualquier momento desde el panel o escribiendo a {mail}. La cancelación se hará efectiva al final del periodo mensual ya pagado, hasta cuando podrás seguir usando el servicio.
              </p>
              <p>No se reembolsan los periodos ya iniciados, salvo que la ley establezca lo contrario.</p>
            </>
          ),
        },
        {
          title: "Cambios de precio",
          body: (
            <p>
              Si modificamos el precio de tu plan, te avisaremos con al menos 30 días de antelación. Si no estás de acuerdo, podrás cancelar tu suscripción antes de que el nuevo precio se aplique.
            </p>
          ),
        },
        {
          title: "Tu contenido y los vídeos generados",
          body: (
            <ul>
              <li>Los planos, fotografías, logos y demás contenido que subes siguen siendo tuyos.</li>
              <li>Garantizas que tienes los derechos necesarios sobre ese contenido y que su uso en el servicio no infringe derechos de terceros.</li>
              <li>Nos concedes una licencia limitada, no exclusiva y gratuita para almacenar y procesar ese contenido con el único fin de prestarte el servicio.</li>
              <li>Puedes usar libremente los vídeos generados para promocionar tus inmuebles, incluidos portales inmobiliarios y redes sociales. Los vídeos pueden incluir una marca discreta de Visitalo.ai.</li>
            </ul>
          ),
        },
        {
          title: "Uso aceptable",
          body: (
            <>
              <p>No está permitido:</p>
              <ul>
                <li>Subir contenido ilícito, que infrinja derechos de terceros o que presente los inmuebles de forma engañosa.</li>
                <li>Intentar acceder sin autorización a cuentas, sistemas o datos de otros usuarios.</li>
                <li>Copiar, descompilar o aplicar ingeniería inversa al servicio.</li>
                <li>Revender o ceder el servicio a terceros sin nuestra autorización por escrito.</li>
              </ul>
            </>
          ),
        },
        {
          title: "Encargo del tratamiento de datos",
          body: (
            <>
              <p>
                Cuando el contenido que subes contenga datos personales, tú eres el responsable del tratamiento y Visitalo.ai actúa como encargado del tratamiento, conforme al artículo 28 del RGPD. En ese caso, Visitalo.ai se compromete a:
              </p>
              <ul>
                <li>Tratar esos datos únicamente para prestarte el servicio y siguiendo tus instrucciones.</li>
                <li>Garantizar que las personas autorizadas para tratarlos mantienen la confidencialidad.</li>
                <li>Aplicar medidas de seguridad adecuadas.</li>
                <li>Recurrir solo a los subencargados indicados en la Política de privacidad, que autorizas de forma general, e informarte de cualquier cambio para que puedas oponerte.</li>
                <li>Ayudarte a atender los derechos de los interesados.</li>
                <li>Notificarte sin dilación indebida cualquier brecha de seguridad que afecte a esos datos.</li>
                <li>Suprimir o devolverte los datos al terminar la prestación del servicio, salvo obligación legal de conservarlos.</li>
                <li>Poner a tu disposición la información necesaria para demostrar el cumplimiento de estas obligaciones.</li>
              </ul>
            </>
          ),
        },
        {
          title: "Disponibilidad del servicio",
          body: (
            <p>
              Trabajamos para que el servicio esté disponible de forma continua, pero puede haber interrupciones por mantenimiento, actualizaciones o causas ajenas a nuestro control. Procuraremos avisar con antelación de las interrupciones programadas.
            </p>
          ),
        },
        {
          title: "Responsabilidad",
          body: (
            <>
              <p>Los vídeos se generan de forma automática a partir del contenido que subes. Te corresponde revisarlos antes de publicarlos.</p>
              <p>
                Salvo en caso de dolo o culpa grave, nuestra responsabilidad total frente a ti por cualquier concepto se limita al importe que hayas pagado por el servicio en los doce meses anteriores al hecho que la origine. No respondemos de pérdidas indirectas, como el lucro cesante o la pérdida de oportunidades de negocio.
              </p>
            </>
          ),
        },
        {
          title: "Propiedad intelectual de la plataforma",
          body: (
            <p>
              El software, el diseño, la marca Visitalo.ai y los demás elementos de la plataforma pertenecen a su titular. Contratar el servicio no te transmite ningún derecho sobre ellos, más allá de su uso conforme a estos términos.
            </p>
          ),
        },
        {
          title: "Suspensión y cierre de cuentas",
          body: (
            <p>
              Podemos suspender o cerrar una cuenta que incumpla estos términos, avisando previamente siempre que sea posible. Tú puedes cerrar tu cuenta en cualquier momento escribiendo a {mail}.
            </p>
          ),
        },
        {
          title: "Cambios en estos términos",
          body: (
            <p>
              Podemos actualizar estos términos. Si los cambios son relevantes, te avisaremos con antelación por email o a través del panel. Si sigues usando el servicio después de su entrada en vigor, se entenderá que los aceptas.
            </p>
          ),
        },
        {
          title: "Ley aplicable y jurisdicción",
          body: (
            <p>
              Estos términos se rigen por la legislación española. Para cualquier controversia, las partes se someten a los juzgados y tribunales de {legal.jurisdiction}.
            </p>
          ),
        },
      ]}
    />
  );
}
