# 🎩 Monopoly Pay — Banca Digital con Pagos QR

Aplicación web progresiva (PWA/SPA) optimizada para celulares y lista para desplegar en Vercel. Diseñada para reemplazar el dinero físico en partidas de Monopoly mediante transferencias instantáneas con códigos QR, efectos de sonido arcade y sincronización en tiempo real.

---

## 🚀 Características Principales

- 📱 **Diseño Mobile-First:** Diseñado como una billetera digital moderna (estilo MercadoPago / Revolut).
- 📷 **Lector QR Integrado:** Escaneo de códigos QR desde la cámara del celular con fallback manual.
- ⚡ **Generador de QR Dinámico:** Permite mostrar tu QR libre o prefijar un cobro exacto con concepto (ej. *"Cobro de $150 por alquiler de Casitas"*).
- 💰 **Banca Digital Integrada:** Botón rápido de **Paso por la Salida (+ $200)** con animación de confeti, pagos de impuestos, fianza de cárcel y cobro de hipotecas.
- 🔊 **Efectos de Sonido Web Audio:** Sonidos retro sintetizados nativamente en el navegador (monedas, pago contactless, fanfare de salida y errores) sin necesidad de cargar archivos externos pesados.
- 📳 **Haptic Feedback:** Vibraciones táctiles al escanear y transferir dinero en dispositivos compatibles.
- 📜 **Libro Mayor en Tiempo Real:** Historial cronológico con filtros para auditar todos los movimientos de la partida.
- 🔄 **Modo Híbrido:**
  - **Modo Local / BroadcastChannel:** Funciona sin backend de inmediato entre pestañas o navegadores del mismo dispositivo.
  - **Modo Multijugador Cloud (Supabase):** Sincronización instantánea por WebSockets entre múltiples celulares en la misma mesa.

---

## 🛠️ Tecnologías

- **React 19 + TypeScript + Vite**
- **Tailwind CSS v4**
- **Html5-Qrcode** (Lectura de QR desde cámara móvil)
- **Qrcode.react** (Generación vectorial SVG de QR)
- **Supabase Realtime** (Sincronización WebSockets y persistencia Postgres)
- **Canvas-Confetti** y **Lucide Icons**

---

## ⚡ Guía Rápida de Configuración (APIs y Despliegue)

### Paso 1: Crear la Base de Datos en Supabase (Gratis)
1. Entrá a [supabase.com](https://supabase.com) y creá un proyecto nuevo gratuito.
2. Andá a la pestaña **SQL Editor** en el menú lateral izquierdo.
3. Copiá y pegá el contenido del archivo [`supabase/schema.sql`](./supabase/schema.sql) y dale al botón **Run**.
4. Andá a **Project Settings → API** y copiá estos dos valores:
   - **Project URL**
   - **Project API keys (anon public)**

### Paso 2: Desplegar en Vercel
1. Subí este repositorio a tu GitHub o usá el CLI de Vercel (`vercel`).
2. En el panel de tu proyecto en Vercel, andá a **Settings → Environment Variables** y agregá:
   - `VITE_SUPABASE_URL` = `https://tu-proyecto.supabase.co`
   - `VITE_SUPABASE_ANON_KEY` = `tu-clave-anonima-publica`
3. Dale a **Redeploy** y ¡listo! Tu app ya es accesible desde cualquier celular escaneando la URL.

---

## 💻 Desarrollo Local

```bash
# Instalar dependencias
pnpm install

# Iniciar servidor local
pnpm dev

# Compilar para producción
pnpm build
```
