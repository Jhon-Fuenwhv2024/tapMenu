# TapMenu

SaaS multi-tenant para restaurantes, cafeterías y negocios similares en Colombia.
Cada mesa tiene un sticker NFC (NTAG213/215) y un QR impreso que apuntan a
`/r/{slug}/m/{codigoMesa}`. Al escanear o acercar el teléfono se abre la carta
ya ligada a esa mesa.

**Dueño del producto:** Jhon Fuentes · El Banco, Magdalena.

## Qué incluye (MVP)

- Menú cliente sin login (categorías, fotos, precios COP, agotados, búsqueda, detalle)
- **Carta 4D:** modelos GLB/USDZ con `<model-viewer>` + AR (“Ver en tu mesa”)
- Pedidos en grupo por mesa (varios celulares, ítems etiquetados por persona)
- KDS de cocina en tiempo real (SSE) con estados y alerta sonora
- Llamar mesero / pedir cuenta → alertas al personal
- Dividir cuenta (por ítems o partes iguales) + propina
- Pagos Nequi / Daviplata / efectivo / tarjeta con confirmación manual (abstracción lista para Wompi)
- Panel dueño: marca, carta CRUD + uploads, mesas + PDF QR, equipo, tablero
- Super-admin: crear restaurantes y gestionar plan/estado de suscripción mensual

## Stack

- Next.js 15 (App Router) + TypeScript + Tailwind
- PostgreSQL + Prisma
- NextAuth (credenciales)
- SSE para realtime
- Almacenamiento local abstracto (`src/lib/storage.ts`) — listo para Blob/S3
- Desplegable en Vercel (+ Postgres managed, p. ej. Neon / Supabase / Vercel Postgres)

## Arranque local

### Requisitos

- Node.js 20+
- PostgreSQL 14+

### Pasos

```bash
cp .env.example .env
# Edita DATABASE_URL, NEXTAUTH_SECRET y NEXT_PUBLIC_APP_URL

npm install
npx prisma db push
npm run db:seed
npm run dev
```

Abre [http://127.0.0.1:43123](http://127.0.0.1:43123).

### Cuentas demo (clave: `tapmenu123`)

| Rol | Correo |
|-----|--------|
| Super-admin (Jhon) | `jhon@tapmenu.co` |
| Dueño Resto Demo | `owner@restodemo.co` |
| Cocina | `cocina@restodemo.co` |
| Mesero | `mesero@restodemo.co` |

**Menú demo mesa 1:** [/r/resto-demo/m/t1](http://127.0.0.1:43123/r/resto-demo/m/t1)

Resto Demo incluye 6 mesas (~20 platos). Dos platos tienen modelo 3D CC0
(Khronos Sample Models: Avocado y Duck) para demostrar Carta 4D.

## Variables de entorno

| Variable | Descripción |
|----------|-------------|
| `DATABASE_URL` | Connection string Postgres |
| `NEXTAUTH_URL` | URL pública de la app |
| `NEXTAUTH_SECRET` | Secreto largo aleatorio |
| `NEXT_PUBLIC_APP_URL` | Base para URLs NFC/QR |
| `UPLOAD_DIR` | Carpeta local de uploads (default `./public/uploads`) |
| `WOMPI_PRIVATE_KEY` | (Futuro) activa el proveedor Wompi |

## Programar tags NFC

1. En el panel Admin → **Mesas**, copia la URL de la mesa
   (ej. `https://tudominio.com/r/resto-demo/m/t1`).
2. Abre **NFC Tools** (Android/iOS).
3. Escribir → Agregar registro → URL/URI → pega la URL → escribe en el tag NTAG213/215.
4. Imprime el PDF de tarjetas QR desde el mismo panel para el respaldo visual.

El teléfono abre la carta ya asociada a esa mesa; no hace falta elegir mesa.

## Flujo de demo sugerido

1. Abre el menú de la mesa 1 en dos navegadores (dos “comensales”).
2. Cada uno se une con su nombre, agrega platos y envía a cocina.
3. Entra como `cocina@restodemo.co` → KDS: avanza estados (recibido → preparación → listo).
4. Como cliente: pedir cuenta / llamar mesero; el panel mesero recibe la alerta.
5. En **Cuenta**: divide por ítems o partes iguales, elige propina y método de pago.
6. El mesero confirma el pago pendiente.

## Tests

```bash
npm test
```

Cubre split de cuenta y validación básica de pedidos.

## Deploy en Vercel

1. Crea un proyecto en Vercel y conecta el repo.
2. Provisiona Postgres y pega `DATABASE_URL`.
3. Define `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `NEXT_PUBLIC_APP_URL` (URL de producción).
4. Build command: `prisma generate && next build` (o usa el `postinstall`).
5. Tras el primer deploy, ejecuta migraciones/seed contra la DB de producción:
   `npx prisma db push && npm run db:seed`
6. Para uploads en producción, sustituye `LocalFileStorage` por Vercel Blob / S3
   implementando la misma interfaz en `src/lib/storage.ts`.

## Estructura clave

```
src/app/r/[slug]/m/[tableCode]   Menú cliente + cuenta
src/app/cocina/[restaurantId]    KDS
src/app/staff/[restaurantId]     Alertas mesero + pagos
src/app/admin/[restaurantId]     Panel dueño
src/app/super                    Super-admin
src/lib/payments.ts              Abstracción Manual → Wompi
src/lib/realtime.ts              Bus SSE
prisma/schema.prisma             Multi-tenant
```

## Qué queda por fuera del MVP

- Integración real Wompi / webhooks
- Almacenamiento cloud (Blob) en producción
- Multi-instancia realtime (Redis/Ably) si se escala horizontalmente
- App nativa / PWA offline
- Facturación DIAN / tipografía fiscal
- Impresión automática a cocina (ESC/POS)
