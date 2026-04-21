# WOKI - MVP Visual

Sistema Inteligente para Gestión de Cafeterías - **Demostración interactiva (solo visual, sin backend)**.

## Demo con QR y celular

Para simular el flujo completo (QR → celular hace pedido → dueño recibe notificación y acepta):

1. **Instalar dependencias:** `npm install`
2. **Iniciar servidor demo:** `npm run demo`
3. **En tu PC:** Abrí `http://localhost:3333/merchant/generar-qr.html` para ver el código QR.
4. **En tu celular:** Conectate a la misma red WiFi, escaneá el QR con la cámara (o abrí la URL que muestra la página).
5. **Celular:** Elegí productos, andá al carrito, tocá "Enviar pedido".
6. **PC:** En el Monitor de Salón aparecerá una notificación "Nuevo pedido por confirmar" con el botón "Aceptar".
7. **Celular:** Verás "¡Pedido aceptado!" y podés continuar a pagar.

## Uso rápido (sin servidor)

1. Abre `index.html` en tu navegador.
2. Elige **Experiencia Cliente** o **Panel Administrador**.

### Flujo Cliente (mobile-first)
- **Escaneo**: Simula escanear el QR de la mesa.
- **Menú**: Explora la carta digital, agrega productos al carrito. Prueba personalizar el Cappuccino (leche de almendras, etc.).
- **Carrito**: Revisa y ajusta cantidades.
- **Pago**: Mercado Pago, débito/crédito y transferencia se pagan desde la app. Efectivo: un mozo se acerca con la cuenta.
- **Seguimiento**: Ve el estado del pedido en tiempo real (simulado: Recibido → En preparación → Listo).

### Flujo Administrador (desktop/tablet) — Diseño Stitch
- **Monitor de Salón**: Mapa de mesas con semáforo (libre, ocupada, en pedido, alerta). Panel lateral con detalle de mesa y pedido.
- **BI Dashboard**: KPIs, gráfico de ventas por hora, Ranking de Oro, insights operativos.
- **Menú**: Edición live, cambio masivo de precios, botón "Agotado".
- **Stock**: Productos finales y materia prima con alertas.
- **Configuración**: Marca blanca (logo, colores), membresía.

## Diseño
El panel merchant integra los diseños exportados de **Google Stitch** (Salon Monitor y BI Dashboard), con tipografía Work Sans y paleta azul (#137fec).

## Tecnologías
- HTML5, CSS3, JavaScript
- Tailwind CSS (CDN)
- Node.js + Express (solo para demo con QR)

## Nota
- **Sin servidor:** el MVP es exclusivamente visual. No hay base de datos ni lógica real.
- **Con servidor demo:** se simula el flujo completo QR → pedido → notificación → aceptar. Ideal para validar la experiencia de usuario.
