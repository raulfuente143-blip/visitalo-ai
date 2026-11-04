@AGENTS.md

# Visitalo.ai — instrucciones para Claude Code

## Cómo trabajamos
- Las decisiones de producto, diseño y código las toma el chat de Claude.ai. Tú ejecutas los prompts tal como llegan.
- No tomes decisiones por tu cuenta ni amplíes el alcance. Si algo no coincide con el prompt (un archivo que no existe, un texto a sustituir que no aparece, un marcador con otro valor), PARA y explica qué has encontrado.
- No digas que un paso está hecho si no lo has verificado. Los marcadores grep -c de cada prompt son obligatorios.
- Responde siempre en español, con un resumen claro de lo que has hecho en cada paso.

## Entorno
- Mac. Node 22.23.2 con nvm. Si npx no está en el PATH, usa el Node de nvm sin cambiar la configuración del usuario.
- Next.js 16.3.3 (App Router, Turbopack). Usa proxy.ts en lugar de middleware.ts. Los params son Promises.
- Antes de hacer commit: npx tsc --noEmit && npx next build.
- Si el build falla porque los tipos de .next apuntan a rutas antiguas, borra .next, ejecuta npx next build y repite.

## Git
- Rama main, remoto origin (GitHub). Al final de cada prompt: git add -A, commit con el mensaje indicado y git push.
- Nunca subas archivos .env ni claves. Antes de cada commit, comprueba que git status no incluye ningún .env.

## Convenciones del código
- Toda la interfaz en español.
- Panel: usa components/panel-ui.tsx (PageHeader, Card, buttonStyles, inputStyles, labelStyles). No crees estilos nuevos sueltos.
- Títulos de marketing: fontFamily "var(--font-playfair), Georgia, serif". El texto general usa Inter (--font-inter), cargada en app/layout.tsx.
- Colores: dorado #D4AF37 (hover #B8960C), azul noche #0F172A, fondo del panel #FAFAFA.
- Datos legales del titular: solo en lib/legal.ts.
