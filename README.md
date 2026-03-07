# Burn Rate

`Burn Rate` es un roguelite deckbuilder sobre construir una startup bajo presión. Tu vida es el runway, tu energía es el bandwidth y cada enemigo representa un problema clásico: burnout, scope creep, copycats, tech debt y presión de mercado.

El juego corre como una SPA en React y mezcla combate por cartas, mapa estilo run-based y una capa narrativa generada con Gemini para tweets, story beats y post-mortems.

## Stack

- React 19
- TypeScript
- Vite 6
- Tailwind vía CDN en `index.html`
- Integraciones opcionales con Gemini y Giphy

## Qué incluye hoy

- Combate por turnos con mazos, reliquias, pociones y mapa de progresión
- Narrativa progresiva por run y por piso
- Settings modal para configurar Gemini API key y modelos
- GIFs curados/dinámicos para cartas y enemigos
- Servicios de post-mortem y overlays narrativos
- Tests/regresiones de mecánicas en archivos `.ts` sueltos

## Correr localmente

### Requisitos

- Node.js 20+ recomendado
- npm

### Instalación

```bash
npm install
```

### Desarrollo

```bash
npm run dev
```

La app levanta en `http://localhost:3000`.

## Configuración opcional

### Gemini

La forma principal de configurar Gemini es desde el modal de Settings dentro de la app. La key se guarda en `localStorage`.

Si no configuras Gemini, el juego sigue funcionando con contenido fallback para narrativa y post-mortem.

### Giphy

Para habilitar búsqueda de GIFs desde la API de Giphy, crea un `.env.local` con:

```bash
VITE_GIPHY_API_KEY=tu_api_key
```

También existe compatibilidad con `GIPHY_API_KEY` por la configuración heredada de Vite.

## Scripts

```bash
npm run dev
npm run build
npm run preview
npm run test:mechanics
```

Nota: `test:mechanics` usa `ts-node` en el script actual. Si no lo tienes disponible, instálalo antes de correr esa regresión.

## Estructura rápida

- `App.tsx`: orquestación principal del juego y UI de alto nivel
- `components/`: cartas, mapa, modales, overlays y vistas de combate
- `gameLogic.ts`: reglas de juego y resolución principal
- `engine/`: acciones, reducer, eventos y utilidades del motor
- `constants.ts` y `types.ts`: datos base y tipado del dominio
- `progressiveNarrativeService.ts`: narrativa progresiva con Gemini
- `postMortemService.ts`: análisis de derrota
- `giphyService.ts`: búsqueda, cache y curación de GIFs

## Estado del README

El `README` anterior era el template genérico de AI Studio. Este archivo ahora documenta el proyecto real que vive en este repo.
