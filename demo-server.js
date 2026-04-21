/**
 * WOKI - Servidor de demostración
 * Simula el flujo: QR → Cliente hace pedido → Notificación al dueño → Aceptar
 *
 * Uso: node demo-server.js
 * Luego abre http://localhost:3333 en desktop y escanea el QR desde tu celular (misma red WiFi)
 */

const express = require('express');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3333;

// Almacén en memoria para pedidos pendientes (simula backend)
const pedidosPendientes = new Map();
let contadorId = 1;

// --- Stock ---
const stockItems = {
  'Café con Leche':   { cantidad: 40, minimo: 10, unidad: 'porciones' },
  'Café Americano':   { cantidad: 50, minimo: 10, unidad: 'porciones' },
  'Cappuccino':       { cantidad: 5,  minimo: 8,  unidad: 'porciones' },
  'Medialuna x2':     { cantidad: 5,  minimo: 8,  unidad: 'unid.' },
  'Tostado Completo': { cantidad: 12, minimo: 5,  unidad: 'unid.' },
  'Panqueques':       { cantidad: 6,  minimo: 10, unidad: 'porciones' },
  'Cheesecake':       { cantidad: 8,  minimo: 5,  unidad: 'porciones' },
  'Brownie':          { cantidad: 6,  minimo: 10, unidad: 'porciones' },
  'Jugo Naranja':     { cantidad: 15, minimo: 5,  unidad: 'vasos' },
  'Agua Mineral':     { cantidad: 24, minimo: 6,  unidad: 'unid.' }
};

// --- Menu ---
let menuItems = [
  {
    nombre: 'Café con Leche', precio: 1200, categoria: 'cafe', disponible: true,
    foto: 'https://images.unsplash.com/photo-1461023058943-07fcbe16d735?w=400&h=400&fit=crop&q=80&auto=format',
    descripcion: 'Espresso doble con leche entera vaporizada y una capa de espuma sedosa. Equilibrado, cremoso y perfecto para arrancar el día.',
    ingredientes: ['Espresso', 'Leche entera', 'Espuma de leche'],
    tamanios: [{nombre:'Chico',precio:0},{nombre:'Mediano',precio:200},{nombre:'Grande',precio:400}],
    extras: [{nombre:'Leche vegetal',precio:300},{nombre:'Extra espresso',precio:500},{nombre:'Canela',precio:0},{nombre:'Vainilla',precio:150},{nombre:'Sin azúcar',precio:0}],
    personalizable: true
  },
  {
    nombre: 'Café Americano', precio: 950, categoria: 'cafe', disponible: true,
    foto: 'https://images.unsplash.com/photo-1510591509098-f4fdc2f9a02e?w=400&h=400&fit=crop&q=80&auto=format',
    descripcion: 'Espresso largo con agua caliente. Negro, limpio y potente. Para quienes prefieren el café sin leche y sin vueltas.',
    ingredientes: ['Espresso', 'Agua caliente'],
    tamanios: [{nombre:'Simple',precio:0},{nombre:'Doble',precio:300}],
    extras: [{nombre:'Leche fría aparte',precio:200},{nombre:'Hielo',precio:0},{nombre:'Azúcar mascabo',precio:0}],
    personalizable: true
  },
  {
    nombre: 'Cappuccino', precio: 1400, categoria: 'cafe', disponible: true,
    foto: 'https://images.unsplash.com/photo-1572442388796-11668a67e53d?w=400&h=400&fit=crop&q=80&auto=format',
    descripcion: 'El clásico italiano. Espresso con leche vaporizada y una generosa capa de espuma densa. Suave, aromático y reconfortante.',
    ingredientes: ['Espresso', 'Leche vaporizada', 'Espuma de leche'],
    tamanios: [{nombre:'Chico',precio:0},{nombre:'Grande',precio:400}],
    extras: [{nombre:'Leche vegetal',precio:300},{nombre:'Extra espuma',precio:0},{nombre:'Cacao en polvo',precio:0},{nombre:'Canela',precio:0},{nombre:'Jarabe de vainilla',precio:200}],
    personalizable: true
  },
  {
    nombre: 'Medialuna x2', precio: 800, categoria: 'comida', disponible: true,
    foto: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=400&h=400&fit=crop&q=80&auto=format',
    descripcion: 'Dos medialunas de manteca recién horneadas. Hojaldradas, doradas y con el aroma que llena el salón. Perfectas solas o acompañadas.',
    ingredientes: ['Hojaldre de manteca', 'Harina', 'Huevo', 'Azúcar'],
    tamanios: null,
    extras: [{nombre:'Manteca',precio:0},{nombre:'Mermelada de frutilla',precio:200},{nombre:'Mermelada de ciruela',precio:200},{nombre:'Dulce de leche',precio:250}],
    personalizable: true
  },
  {
    nombre: 'Tostado Completo', precio: 1800, categoria: 'comida', disponible: true,
    foto: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=400&h=400&fit=crop&q=80&auto=format',
    descripcion: 'Pan de miga grueso tostado con jamón cocido y queso en lonchas fundido. Crocante por fuera, cremoso y caliente por dentro.',
    ingredientes: ['Pan de miga', 'Jamón cocido', 'Queso en lonchas'],
    tamanios: null,
    extras: [{nombre:'Tomate fresco',precio:150},{nombre:'Lechuga',precio:0},{nombre:'Mayonesa',precio:0},{nombre:'Mostaza',precio:0},{nombre:'Doble queso',precio:400}],
    personalizable: true
  },
  {
    nombre: 'Panqueques', precio: 2100, categoria: 'comida', disponible: true,
    foto: 'https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=400&h=400&fit=crop&q=80&auto=format',
    descripcion: 'Tres panqueques esponjosos rellenos con dulce de leche repostero artesanal, enrollados y bañados en salsa tibia. Una delicia.',
    ingredientes: ['Harina', 'Huevo', 'Leche', 'Manteca', 'Dulce de leche repostero'],
    tamanios: null,
    extras: [{nombre:'Helado de crema',precio:600},{nombre:'Crema chantilly',precio:400},{nombre:'Nueces',precio:350},{nombre:'Frutillas frescas',precio:500},{nombre:'Salsa de chocolate',precio:300}],
    personalizable: true
  },
  {
    nombre: 'Cheesecake', precio: 1500, categoria: 'postres', disponible: true,
    foto: 'https://images.unsplash.com/photo-1524351199678-941a58a3df50?w=400&h=400&fit=crop&q=80&auto=format',
    descripcion: 'Base crocante de galletitas con relleno cremoso de queso crema horneado. Coronado con coulis de frutos rojos hecho en el local.',
    ingredientes: ['Queso crema', 'Galletitas de vainilla', 'Manteca', 'Huevo', 'Azúcar', 'Frutos rojos'],
    tamanios: null,
    extras: [{nombre:'Crema chantilly',precio:400},{nombre:'Salsa extra de frutos rojos',precio:300},{nombre:'Miel',precio:200},{nombre:'Fresas frescas',precio:500}],
    personalizable: true
  },
  {
    nombre: 'Brownie', precio: 1100, categoria: 'postres', disponible: true,
    foto: 'https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=400&h=400&fit=crop&q=80&auto=format',
    descripcion: 'Brownie de chocolate negro 70% cacao. Húmedo en el centro, ligeramente crocante en los bordes. Servido tibio con helado de crema.',
    ingredientes: ['Chocolate negro 70%', 'Manteca', 'Huevo', 'Harina', 'Azúcar'],
    tamanios: null,
    extras: [{nombre:'Helado de dulce de leche',precio:600},{nombre:'Nueces',precio:350},{nombre:'Crema chantilly',precio:400},{nombre:'Salsa de chocolate extra',precio:300}],
    personalizable: true
  },
  {
    nombre: 'Jugo Naranja', precio: 900, categoria: 'bebidas', disponible: true,
    foto: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&h=400&fit=crop&q=80&auto=format',
    descripcion: 'Naranjas exprimidas al momento, sin azúcar agregada ni conservantes. Natural, fresco y lleno de vitamina C.',
    ingredientes: ['Naranja exprimida'],
    tamanios: [{nombre:'250 ml',precio:0},{nombre:'400 ml',precio:300}],
    extras: [{nombre:'Con hielo',precio:0},{nombre:'Con jengibre',precio:200},{nombre:'Con menta fresca',precio:200},{nombre:'Con un toque de limón',precio:150}],
    personalizable: true
  },
  {
    nombre: 'Agua Mineral', precio: 500, categoria: 'bebidas', disponible: true,
    foto: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&h=400&fit=crop&q=80&auto=format',
    descripcion: 'Agua mineral de manantial en botella de 500 ml. Podés elegir con o sin gas.',
    ingredientes: null,
    tamanios: [{nombre:'Sin gas',precio:0},{nombre:'Con gas',precio:0}],
    extras: null,
    personalizable: false
  }
];

// --- Config ---
let negocioConfig = {
  nombre: 'Café del Centro',
  tagline: 'Pedí directo desde tu asiento',
  color_primario: '#0f172a',
  color_acento: '#f59e0b',
  logo_url: '',
  cuenta_bancaria: {
    banco: 'Banco Galicia',
    titular: 'Café del Centro SRL',
    cbu: '0070999620000004368800',
    alias: 'CAFE.CENTRO.WOKI',
    cuit: '30-71234567-8'
  }
};

function getStockEstado(item) {
  if (item.cantidad < item.minimo) return 'rojo';
  if (item.cantidad < item.minimo * 1.5) return 'amarillo';
  return 'verde';
}

// Estado en tiempo real de mesas (seed + mesas creadas por clientes)
function _hace(min) {
  const d = new Date();
  d.setMinutes(d.getMinutes() - min);
  return d.toISOString();
}
const mesaEstados = {
  1: { estado: 'libre', estadoLabel: 'Disponible', pedido: [], flujo: [], escaneo: null, personas: null },
  4: { estado: 'libre', estadoLabel: 'Disponible', pedido: [], flujo: [], escaneo: null, personas: null },
  5: { estado: 'cocina', estadoLabel: 'En cocina', aceptadoAt: _hace(2), escaneo: '19:40', personas: 4, flujo: ['escaneo','viendo','eligiendo','pedido','listo'], pedido: [{ nombre: 'Cappuccino', cantidad: 2, notas: 'Sin azúcar uno', estado: 'preparando', precio: 2800 }], total: 2800 },
  11: { estado: 'alerta', estadoLabel: 'Demora cocina', aceptadoAt: _hace(12), escaneo: '19:30', personas: 4, flujo: ['escaneo','viendo','eligiendo','pedido','listo'], pedido: [{ nombre: 'Panqueques', cantidad: 1, notas: '', estado: 'preparando', precio: 2100 }, { nombre: 'Jugo Naranja', cantidad: 2, notas: '', estado: 'preparando', precio: 1800 }], total: 3900 },
  12: { estado: 'cocina', estadoLabel: 'En cocina', aceptadoAt: _hace(5), escaneo: '19:37', personas: 4, flujo: ['escaneo','viendo','eligiendo','pedido','listo'], pedido: [{ nombre: 'Cheesecake', cantidad: 1, notas: '', estado: 'preparando', precio: 1500 }, { nombre: 'Brownie', cantidad: 1, notas: 'Con helado extra', estado: 'preparando', precio: 1100 }], total: 2600 }
};
const pedidoPorMesa = new Map(); // mesa -> pedido aceptado (para mostrar en dashboard)

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));
app.use(express.static(path.join(__dirname)));

// API: Enviar pedido (desde el celular del cliente)
app.post('/api/pedido', (req, res) => {
  const { mesa, items, total, nombreCliente, personas, metodoPago, notas } = req.body;
  if (!mesa || !items || items.length === 0) {
    return res.status(400).json({ error: 'Mesa e ítems requeridos' });
  }
  const id = String(contadorId++);
  const esCash = metodoPago === 'efectivo';
  const pedido = {
    id,
    mesa: String(mesa),
    items,
    total: total || items.reduce((s, i) => s + (i.precio || 0) * (i.cantidad || 1), 0),
    nombreCliente: nombreCliente || null,
    estado: 'pendiente',
    metodoPago: metodoPago || null,
    requires_manual_approval: esCash,
    notas: notas || null,
    createdAt: new Date().toISOString()
  };
  pedidosPendientes.set(id, pedido);
  const mesaNum = String(mesa);
  if (!mesaEstados[mesaNum]) mesaEstados[mesaNum] = { estado: 'libre', estadoLabel: 'Disponible', pedido: null, flujo: [], personas: null };

  mesaEstados[mesaNum].pedidoPendienteId = id;
  mesaEstados[mesaNum].pedido = pedido.items.map(i => ({ nombre: i.nombre, cantidad: i.cantidad || 1, notas: i.notas || '', precio: (i.precio || 0) * (i.cantidad || 1), estado: 'preparando' }));
  mesaEstados[mesaNum].total = pedido.total;
  mesaEstados[mesaNum].flujo = ['escaneo', 'viendo', 'eligiendo', 'pedido'];
  if (personas != null) mesaEstados[mesaNum].personas = personas;

  if (esCash) {
    // Efectivo: queda en espera hasta que el encargado apruebe manualmente
    mesaEstados[mesaNum].estado = 'esperando_efectivo';
    mesaEstados[mesaNum].estadoLabel = 'Aprobar efectivo';
    mesaEstados[mesaNum].metodoPagoElegido = 'efectivo';
    console.log('[WOKI] Nuevo pedido EFECTIVO (esperando aprobación):', pedido.mesa, pedido.items.map(i => i.nombre).join(', '));
  } else {
    mesaEstados[mesaNum].estado = 'pedido';
    mesaEstados[mesaNum].estadoLabel = 'Esperando aceptar';
    console.log('[WOKI] Nuevo pedido:', pedido.mesa, pedido.items.map(i => i.nombre).join(', '));

    // Auto-aceptación si está activada en config (solo para pagos digitales)
    if (negocioConfig.autoAceptar) {
      pedido.estado = 'aceptado';
      pedido.aceptadoAt = new Date().toISOString();
      mesaEstados[mesaNum].estado = 'cocina';
      mesaEstados[mesaNum].estadoLabel = 'En cocina';
      mesaEstados[mesaNum].aceptadoAt = new Date().toISOString();
      mesaEstados[mesaNum].flujo = ['escaneo', 'viendo', 'eligiendo', 'pedido', 'listo'];
      mesaEstados[mesaNum].pedidoPendienteId = null;
      console.log('[WOKI] Auto-aceptado → cocina, Mesa', mesaNum);
    }
  }

  res.json({ ok: true, id, autoAceptado: !esCash && !!negocioConfig.autoAceptar });
});

// API: Listar pedidos pendientes (el dashboard hace polling)
app.get('/api/pedidos-pendientes', (req, res) => {
  const pendientes = [...pedidosPendientes.values()]
    .filter(p => p.estado === 'pendiente')
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  res.json(pendientes);
});

// API: Mozo marca pedido entregado (salida de cocina, llegó a la mesa)
app.post('/api/mesa/:num/entregado', (req, res) => {
  const mesa = req.params.num;
  if (mesaEstados[mesa] && ['cocina','alerta','cobrar'].includes(mesaEstados[mesa].estado)) {
    mesaEstados[mesa].estado = 'entregado';
    mesaEstados[mesa].estadoLabel = 'Listo para entregar';
    mesaEstados[mesa].entregadoAt = new Date().toISOString();
    mesaEstados[mesa].flujo = ['escaneo', 'viendo', 'eligiendo', 'pedido', 'listo'];
    if (mesaEstados[mesa].pago && mesaEstados[mesa].pago.metodo) {
      mesaEstados[mesa].flujo.push('pagado');
    }
    if (mesaEstados[mesa].pedido) {
      mesaEstados[mesa].pedido = mesaEstados[mesa].pedido.map(it => ({ ...it, estado: 'entregado' }));
    }
  }
  console.log('[WOKI] Pedido entregado en Mesa', mesa);
  res.json({ ok: true });
});

// API: Toggle auto-aceptación
app.post('/api/config/auto-aceptar', (req, res) => {
  const { activo } = req.body;
  negocioConfig.autoAceptar = !!activo;
  res.json({ ok: true, autoAceptar: negocioConfig.autoAceptar });
});

// API: Aceptar pedido (desde el panel del dueño)
app.post('/api/aceptar-pedido/:id', (req, res) => {
  const { id } = req.params;
  const pedido = pedidosPendientes.get(id);
  if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });
  pedido.estado = 'aceptado';
  pedido.aceptadoAt = new Date().toISOString();
  const mesa = String(pedido.mesa);
  if (mesaEstados[mesa]) {
    mesaEstados[mesa].estado = 'cocina';
    mesaEstados[mesa].estadoLabel = 'En cocina';
    mesaEstados[mesa].aceptadoAt = new Date().toISOString();
    mesaEstados[mesa].flujo = ['escaneo', 'viendo', 'eligiendo', 'pedido', 'listo'];
    mesaEstados[mesa].pedido = pedido.items.map(i => ({ nombre: i.nombre, cantidad: i.cantidad || 1, notas: i.notas || '', precio: (i.precio || 0) * (i.cantidad || 1), estado: 'preparando' }));
    mesaEstados[mesa].total = pedido.total;
    mesaEstados[mesa].pedidoPendienteId = null;
    pedidoPorMesa.set(mesa, pedido);
  }
  // Deducir stock por cada ítem del pedido
  pedido.items.forEach(item => {
    const cantidad = item.cantidad || 1;
    // Fuzzy match: buscar la clave de stock que esté incluida en el nombre del ítem o viceversa
    const key = Object.keys(stockItems).find(k =>
      item.nombre.toLowerCase().includes(k.toLowerCase()) ||
      k.toLowerCase().includes(item.nombre.toLowerCase())
    );
    if (key) {
      stockItems[key].cantidad = Math.max(0, stockItems[key].cantidad - cantidad);
      if (stockItems[key].cantidad < stockItems[key].minimo) {
        stockItems[key].estadoCritico = true;
      }
      console.log('[WOKI] Stock deducido:', key, '-', cantidad, '→', stockItems[key].cantidad);
    }
  });
  console.log('[WOKI] Pedido aceptado:', id, 'Mesa', pedido.mesa);
  res.json({ ok: true });
});

// API: Aprobar pedido en efectivo → enviar a cocina (aprobación manual)
app.post('/api/pedido/:id/aprobar-efectivo', (req, res) => {
  const { id } = req.params;
  const pedido = pedidosPendientes.get(id);
  if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });
  if (!pedido.requires_manual_approval) return res.status(400).json({ error: 'Este pedido no requiere aprobación manual' });

  pedido.estado = 'aceptado';
  pedido.aceptadoAt = new Date().toISOString();

  const mesa = String(pedido.mesa);
  if (mesaEstados[mesa]) {
    mesaEstados[mesa].estado      = 'cocina';
    mesaEstados[mesa].estadoLabel = 'En cocina';
    mesaEstados[mesa].aceptadoAt  = pedido.aceptadoAt;
    mesaEstados[mesa].flujo       = ['escaneo', 'viendo', 'eligiendo', 'pedido', 'listo'];
    mesaEstados[mesa].pedido      = pedido.items.map(i => ({ nombre: i.nombre, cantidad: i.cantidad || 1, notas: i.notas || '', precio: (i.precio || 0) * (i.cantidad || 1), estado: 'preparando' }));
    mesaEstados[mesa].total       = pedido.total;
    mesaEstados[mesa].pedidoPendienteId = null;
    pedidoPorMesa.set(mesa, pedido);
  }

  // Deducir stock
  pedido.items.forEach(item => {
    const cantidad = item.cantidad || 1;
    const key = Object.keys(stockItems).find(k =>
      item.nombre.toLowerCase().includes(k.toLowerCase()) ||
      k.toLowerCase().includes(item.nombre.toLowerCase())
    );
    if (key) {
      stockItems[key].cantidad = Math.max(0, stockItems[key].cantidad - cantidad);
      if (stockItems[key].cantidad < stockItems[key].minimo) stockItems[key].estadoCritico = true;
      console.log('[WOKI] Stock deducido:', key, '-', cantidad, '→', stockItems[key].cantidad);
    }
  });

  console.log('[WOKI] Efectivo APROBADO → cocina, Pedido', id, 'Mesa', mesa);
  res.json({ ok: true, mesa });
});

// API: Cocina marca pedido listo (bump bar) → pasa a entregado
app.post('/api/mesa/:num/listo-cocina', (req, res) => {
  const mesa = req.params.num;
  if (!mesaEstados[mesa]) return res.status(404).json({ error: 'Mesa no encontrada' });
  const est = mesaEstados[mesa].estado;
  if (['cocina', 'verde', 'alerta'].includes(est)) {
    mesaEstados[mesa].estado = 'entregado';
    mesaEstados[mesa].estadoLabel = 'Listo para entregar';
    mesaEstados[mesa].pedidoListo = true;   // ← flag exclusivo: cocina marcó listo
    mesaEstados[mesa].entregadoAt = new Date().toISOString();
    mesaEstados[mesa].flujo = ['escaneo', 'viendo', 'eligiendo', 'pedido', 'listo'];
    if (mesaEstados[mesa].pedido) {
      mesaEstados[mesa].pedido = mesaEstados[mesa].pedido.map(it => ({ ...it, estado: 'listo' }));
    }
    console.log('[WOKI] Cocina → LISTO Mesa', mesa);
  }
  res.json({ ok: true });
});

// API: Mozo lleva el pedido a la mesa (dashboard → en_mesa)
app.post('/api/mesa/:num/en-mesa', (req, res) => {
  const mesa = req.params.num;
  if (!mesaEstados[mesa]) return res.status(404).json({ error: 'Mesa no encontrada' });
  mesaEstados[mesa].estado = 'en_mesa';
  mesaEstados[mesa].estadoLabel = 'En Mesa';
  mesaEstados[mesa].pedidoListo = false;
  mesaEstados[mesa].enMesaAt = new Date().toISOString();
  if (mesaEstados[mesa].pedido) {
    mesaEstados[mesa].pedido = mesaEstados[mesa].pedido.map(it => ({ ...it, estado: 'entregado' }));
  }
  console.log('[WOKI] Pedido llevado a mesa → en_mesa, Mesa', mesa);
  res.json({ ok: true });
});

// API: Cliente confirma recepción del pedido ("Recibí mi pedido") → consumiendo
app.post('/api/mesa/:num/completado', (req, res) => {
  const mesa = req.params.num;
  if (mesaEstados[mesa]) {
    mesaEstados[mesa].estado = 'consumiendo';
    mesaEstados[mesa].estadoLabel = 'Consumiendo';
    mesaEstados[mesa].enMesa = false;
    mesaEstados[mesa].completadoAt = new Date().toISOString();
    if (mesaEstados[mesa].pedido) {
      mesaEstados[mesa].pedido = mesaEstados[mesa].pedido.map(it => ({ ...it, estado: 'entregado' }));
    }
  }
  console.log('[WOKI] Cliente recibió pedido → consumiendo, Mesa', mesa);
  res.json({ ok: true });
});

// API: Item individual listo (marcar ítem como preparado)
app.post('/api/mesa/:num/item/:idx/listo', (req, res) => {
  const mesa = req.params.num;
  const idx = parseInt(req.params.idx, 10);
  if (!mesaEstados[mesa] || !mesaEstados[mesa].pedido) return res.status(404).json({ error: 'Mesa sin pedido' });
  if (mesaEstados[mesa].pedido[idx]) {
    mesaEstados[mesa].pedido[idx].estado = 'listo';
    const todosListos = mesaEstados[mesa].pedido.every(it => it.estado === 'listo');
    if (todosListos) {
      mesaEstados[mesa].estado = 'entregado';
      mesaEstados[mesa].estadoLabel = 'Listo para entregar';
      mesaEstados[mesa].pedidoListo = true;   // todos los ítems marcados → flag activo
      mesaEstados[mesa].entregadoAt = new Date().toISOString();
      console.log('[WOKI] Todos los ítems listos → entregado Mesa', mesa);
    }
  }
  res.json({ ok: true });
});

// API: Vista cocina — mesas en preparación con timing
app.get('/api/cocina', (req, res) => {
  const now = Date.now();
  const DEMORA_MINUTOS = 12;
  const result = [];
  for (const [num, m] of Object.entries(mesaEstados)) {
    if (!['cocina', 'verde', 'alerta'].includes(m.estado)) continue;
    const mesa = { num: parseInt(num), ...m };
    if (m.aceptadoAt) {
      const ms = now - new Date(m.aceptadoAt).getTime();
      const min = Math.floor(ms / 60000);
      const seg = Math.floor((ms % 60000) / 1000);
      mesa.tiempoMs = ms;
      mesa.tiempoMin = min;
      mesa.tiempo = min + ':' + (seg < 10 ? '0' : '') + seg;
      if (min >= DEMORA_MINUTOS) mesa.estado = 'alerta';
      else if (min < 1) mesa.estado = 'verde';
    }
    result.push(mesa);
  }
  result.sort((a, b) => (b.tiempoMs || 0) - (a.tiempoMs || 0)); // más antiguos primero
  res.json(result);
});

// API: Cliente está viendo/completando el carrito (haciendo el pedido)
app.post('/api/mesa/:num/eligiendo', (req, res) => {
  const mesa = req.params.num;
  if (mesaEstados[mesa] && (mesaEstados[mesa].estado === 'libre' || mesaEstados[mesa].estado === 'escaneo')) {
    mesaEstados[mesa].estado = 'eligiendo';
    mesaEstados[mesa].estadoLabel = 'Haciendo pedido';
    mesaEstados[mesa].flujo = ['escaneo', 'viendo', 'eligiendo'];
  }
  res.json({ ok: true });
});

// API: Cliente visitó menú (escaneó QR / eligió mesa)
app.post('/api/mesa/:num/visita', (req, res) => {
  const mesa = req.params.num;
  const { personas } = req.body || {};
  if (!mesaEstados[mesa]) mesaEstados[mesa] = { estado: 'libre', estadoLabel: 'Disponible', pedido: null, flujo: [], personas: null };
  const estadoActual = mesaEstados[mesa].estado;
  if (estadoActual === 'libre' || estadoActual === 'consumiendo' || estadoActual === 'completado') {
    // Mesa libre o cliente terminó su pedido → iniciar nuevo ciclo
    mesaEstados[mesa].estado = 'escaneo';
    mesaEstados[mesa].estadoLabel = 'Viendo menú';
    mesaEstados[mesa].flujo = ['escaneo', 'viendo'];
    mesaEstados[mesa].escaneo = new Date().toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
    mesaEstados[mesa].pedido = [];
    mesaEstados[mesa].total = null;
    mesaEstados[mesa].pedidoListo = false;
    mesaEstados[mesa].pedidoPendienteId = null;
    mesaEstados[mesa].personas = personas != null ? personas : mesaEstados[mesa].personas;
    console.log('[WOKI] Re-escaneo Mesa', mesa, '— nuevo ciclo desde', estadoActual);
  } else {
    mesaEstados[mesa].personas = personas != null ? personas : mesaEstados[mesa].personas;
  }
  res.json({ ok: true });
});

// API: Cliente está en pago (listo para cobrar)
app.post('/api/mesa/:num/cobrar', (req, res) => {
  const mesa = req.params.num;
  const { metodo } = req.body || {};
  if (mesaEstados[mesa] && ['cocina', 'cobrar', 'entregado'].includes(mesaEstados[mesa].estado)) {
    mesaEstados[mesa].estado = 'cobrar';
    if (metodo === 'efectivo') {
      mesaEstados[mesa].estadoLabel = 'Requiere efectivo';
      mesaEstados[mesa].metodoPagoElegido = 'efectivo';
    } else {
      mesaEstados[mesa].estadoLabel = 'Listo para cobrar';
      if (metodo) mesaEstados[mesa].metodoPagoElegido = metodo;
    }
    mesaEstados[mesa].flujo = ['escaneo', 'viendo', 'eligiendo', 'pedido', 'listo'];
  }
  res.json({ ok: true });
});

// API: Cliente se fue — liberar mesa
app.post('/api/mesa/:num/salir', (req, res) => {
  const mesa = req.params.num;
  mesaEstados[mesa] = { estado: 'libre', estadoLabel: 'Disponible', pedido: [], flujo: [], escaneo: null, personas: null };
  console.log('[WOKI] Mesa', mesa, 'liberada');
  res.json({ ok: true });
});

// API: Cliente pagó (MP/tarjeta/transfer) o mozzo marcó cobrado (efectivo)
// MP: cliente paga → se marca pagado + pedido QUEDA en cocina (puede pagar antes de que llegue)
// Efectivo: mozzo marca cobrado → pedido pasa a cocina
app.post('/api/mesa/:num/pago', (req, res) => {
  const mesa = req.params.num;
  const { metodo } = req.body || {};
  if (!mesaEstados[mesa]) return res.json({ ok: true });
  mesaEstados[mesa].pago = { metodo: metodo || 'Efectivo', monto: mesaEstados[mesa].total };
  mesaEstados[mesa].flujo = ['escaneo', 'viendo', 'eligiendo', 'pedido', 'listo', 'pagado'];

  const est = mesaEstados[mesa].estado;
  if (est === 'cobrar') {
    mesaEstados[mesa].estado = 'cocina';
    mesaEstados[mesa].estadoLabel = 'En cocina';
    mesaEstados[mesa].aceptadoAt = mesaEstados[mesa].aceptadoAt || new Date().toISOString();
  } else if (est === 'cocina' || est === 'alerta') {
    // Cliente pagó con MP antes de que llegue el pedido: mantener en cocina, NO pasar a pagado
    mesaEstados[mesa].estadoLabel = est === 'alerta' ? 'Demora cocina' : 'En cocina';
  }
  res.json({ ok: true });
});

// API: Estado de una mesa (para seguimiento del cliente)
app.get('/api/mesa/:num/estado', (req, res) => {
  const m = mesaEstados[req.params.num];
  if (!m) return res.json({ estado: null });
  const mesa = { ...m };
  if ((m.estado === 'cocina' || m.estado === 'alerta') && m.aceptadoAt) {
    const ms = Date.now() - new Date(m.aceptadoAt).getTime();
    const min = Math.floor(ms / 60000);
    const seg = Math.floor((ms % 60000) / 1000);
    mesa.tiempo = min + ':' + (seg < 10 ? '0' : '') + seg;
  }
  res.json(mesa);
});

// API: Estado de mesas (para polling del dashboard)
app.get('/api/mesas-estado', (req, res) => {
  const now = Date.now();
  const DEMORA_MINUTOS = 12;
  const out = {};
  for (const [num, m] of Object.entries(mesaEstados)) {
    const mesa = { ...m };
    if ((m.estado === 'cocina' || m.estado === 'alerta') && m.aceptadoAt) {
      const ms = now - new Date(m.aceptadoAt).getTime();
      const min = Math.floor(ms / 60000);
      const seg = Math.floor((ms % 60000) / 1000);
      mesa.tiempo = min + ':' + (seg < 10 ? '0' : '') + seg;
      if (min >= DEMORA_MINUTOS && m.estado !== 'alerta') {
        mesa.estado = 'alerta';
        mesa.estadoLabel = 'Demora cocina';
      } else if (min < 1 && m.estado === 'cocina') {
        mesa.estado = 'verde';
        mesa.estadoLabel = 'Cocina · <1min';
      }
    }
    out[num] = mesa;
  }
  res.json(out);
});

// API: URL para QR — usa PUBLIC_URL en producción, IP local en desarrollo
app.get('/api/demo-url', (req, res) => {
  // Si hay PUBLIC_URL configurada (ej: Railway/Render), usar esa
  if (process.env.PUBLIC_URL) {
    return res.json({ url: process.env.PUBLIC_URL });
  }
  // Si hay header de host (proxy inverso) usar ese
  const proto = req.headers['x-forwarded-proto'] || req.protocol;
  const host = req.headers['x-forwarded-host'] || req.headers.host;
  if (host && !host.startsWith('localhost') && !host.startsWith('127.')) {
    return res.json({ url: proto + '://' + host });
  }
  // Fallback: IP de red local (modo demo en PC)
  const { networkInterfaces } = require('os');
  const nets = networkInterfaces();
  let ip = 'localhost';
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4' && !net.internal) { ip = net.address; break; }
    }
  }
  res.json({ url: 'http://' + ip + ':' + PORT });
});

// API: Estado de un pedido (para que el cliente verifique si fue aceptado)
app.get('/api/pedido/:id', (req, res) => {
  const pedido = pedidosPendientes.get(req.params.id);
  if (!pedido) return res.status(404).json({ error: 'Pedido no encontrado' });
  res.json(pedido);
});

// API: Stock
app.get('/api/stock', (req, res) => {
  const result = {};
  for (const [nombre, item] of Object.entries(stockItems)) {
    result[nombre] = { ...item, estado: getStockEstado(item) };
  }
  res.json(result);
});

app.patch('/api/stock/:nombre', (req, res) => {
  const nombre = decodeURIComponent(req.params.nombre);
  const item = stockItems[nombre];
  if (!item) return res.status(404).json({ error: 'Producto no encontrado en stock' });
  const { cantidad } = req.body;
  if (typeof cantidad !== 'number') return res.status(400).json({ error: 'cantidad debe ser un número' });
  item.cantidad = Math.max(0, cantidad);
  item.estadoCritico = item.cantidad < item.minimo;
  res.json({ ok: true, nombre, cantidad: item.cantidad, estado: getStockEstado(item) });
});

// API: Menu
app.get('/api/menu', (req, res) => {
  res.json(menuItems);
});

app.put('/api/menu', (req, res) => {
  const items = req.body;
  if (!Array.isArray(items)) return res.status(400).json({ error: 'Se esperaba un array de ítems' });
  menuItems = items;
  res.json({ ok: true });
});

// API: Config
app.get('/api/config', (req, res) => {
  res.json(negocioConfig);
});

app.put('/api/config', (req, res) => {
  const cfg = req.body;
  if (!cfg || typeof cfg !== 'object') return res.status(400).json({ error: 'Config inválida' });
  negocioConfig = { ...negocioConfig, ...cfg };
  res.json({ ok: true, config: negocioConfig });
});

// ── Pago simulado (demo visual) ───────────────────────────────────────────────
const pedidosPorRef = new Map();   // ref → { mesa, items, total, personas, notas }
const pagosConfirmados = new Set(); // ref — idempotencia

// Iniciar checkout: guarda contexto y devuelve URL del checkout simulado
app.post('/api/pago/crear', (req, res) => {
  const { mesa, items, total, personas, notas } = req.body;
  if (!mesa || !items || items.length === 0) {
    return res.status(400).json({ error: 'Mesa e ítems requeridos' });
  }
  const ref = 'SIM-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7).toUpperCase();
  pedidosPorRef.set(ref, { mesa: String(mesa), items, total, personas: personas || null, notas: notas || '' });
  const checkoutUrl = '/cliente/mp-checkout.html?ref=' + encodeURIComponent(ref)
    + '&mesa=' + encodeURIComponent(mesa)
    + '&total=' + encodeURIComponent(total);
  console.log('[WOKI] Checkout simulado creado:', ref, 'Mesa', mesa);
  res.json({ ok: true, checkout_url: checkoutUrl });
});

// Confirmar pago simulado — crea el pedido y pasa la mesa a cocina
app.post('/api/pago/confirmar', (req, res) => {
  const { ref } = req.body || {};
  if (!ref) return res.status(400).json({ error: 'ref requerido' });
  if (pagosConfirmados.has(ref)) return res.json({ ok: true, duplicado: true });

  const ctx = pedidosPorRef.get(ref);
  if (!ctx) return res.status(404).json({ error: 'Referencia no encontrada' });

  pagosConfirmados.add(ref);
  const { mesa: mesaNum, items, total, personas } = ctx;

  if (!mesaEstados[mesaNum]) {
    mesaEstados[mesaNum] = { estado: 'libre', estadoLabel: 'Disponible', pedido: [], flujo: [], escaneo: null, personas: null };
  }

  const id = String(contadorId++);
  const pedidoObj = {
    id, mesa: mesaNum, items, total,
    estado: 'aceptado', metodoPago: 'Mercado Pago',
    aceptadoAt: new Date().toISOString(),
    createdAt: new Date().toISOString()
  };
  pedidosPendientes.set(id, pedidoObj);

  mesaEstados[mesaNum].estado      = 'cocina';
  mesaEstados[mesaNum].estadoLabel = 'En cocina';
  mesaEstados[mesaNum].aceptadoAt  = pedidoObj.aceptadoAt;
  mesaEstados[mesaNum].flujo       = ['escaneo', 'viendo', 'eligiendo', 'pedido', 'listo', 'pagado'];
  mesaEstados[mesaNum].pedido      = items.map(i => ({ nombre: i.nombre, cantidad: i.cantidad || 1, notas: i.notas || '', precio: (i.precio || 0) * (i.cantidad || 1), estado: 'preparando' }));
  mesaEstados[mesaNum].total       = total;
  mesaEstados[mesaNum].pago        = { metodo: 'Mercado Pago', monto: total };
  mesaEstados[mesaNum].pedidoPendienteId = null;
  if (personas) mesaEstados[mesaNum].personas = personas;

  items.forEach(item => {
    const cantidad = item.cantidad || 1;
    const key = Object.keys(stockItems).find(k =>
      item.nombre.toLowerCase().includes(k.toLowerCase()) ||
      k.toLowerCase().includes(item.nombre.toLowerCase())
    );
    if (key) {
      stockItems[key].cantidad = Math.max(0, stockItems[key].cantidad - cantidad);
      if (stockItems[key].cantidad < stockItems[key].minimo) stockItems[key].estadoCritico = true;
    }
  });

  console.log('[WOKI] Pago simulado confirmado — Mesa', mesaNum, 'ref', ref, 'total $' + total);
  res.json({ ok: true, mesa: mesaNum, id });
});

// Exportar para Vercel (serverless) — Vercel importa el módulo y usa app como handler
module.exports = app;

// Escuchar solo cuando se ejecuta directamente (npm run demo / node demo-server.js)
if (require.main === module) {
  app.listen(PORT, '0.0.0.0', () => {
    const { networkInterfaces } = require('os');
    const nets = networkInterfaces();
    let localIp = 'localhost';
    for (const name of Object.keys(nets)) {
      for (const net of nets[name]) {
        if (net.family === 'IPv4' && !net.internal) { localIp = net.address; break; }
      }
    }
    console.log('\n  WOKI - Demo activa\n');
    console.log('  En tu PC:      http://localhost:' + PORT);
    console.log('  Desde celular: http://' + localIp + ':' + PORT);
    console.log('\n  Generar QR:   http://localhost:' + PORT + '/merchant/generar-qr.html');
    console.log('  Panel:        http://localhost:' + PORT + '/merchant/dashboard.html');
    console.log('\n');
  });
}
