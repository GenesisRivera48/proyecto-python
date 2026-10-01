/* ==========================================================================
   GZ STUDIO — Interactividad del sitio promocional
   Todo funciona en local con HTML + CSS + JavaScript puro.
   No requiere servidor, PHP, MySQL ni conexión a Internet.

   El sitio está dividido en varias páginas (vistas). Cada página carga este
   mismo archivo y solo se inicializan los módulos cuyos elementos existen en
   el documento, por eso casi todos los bloques empiezan con una comprobación.

   PÁGINAS
   index.html          Portada
   catalogo.html       Catálogo de productos + modal de producto
   disenos.html        Galería de diseños + modal de diseño
   personalizar.html   Simulador de personalización
   como-funciona.html  Proceso en cuatro pasos
   sistema.html        Módulos de gestión + interfaz administrativa

   ÍNDICE
   01. Utilidades generales
   02. Datos del proyecto (productos, diseños, pantallas, simulador)
   03. Respaldo de imágenes faltantes
   04. Header, menú responsive, enlace activo y navegación entre páginas
   05. Catálogo: renderizado y filtros
   06. Galería de diseños: renderizado y filtros
   07. Modales (producto y diseño)
   08. Simulador de personalización
   09. Pasos "Cómo funciona"
   10. Tarjetas de funciones del sistema
   11. Mockup de la interfaz administrativa
   12. Animaciones de aparición, botón "volver arriba" y aviso (toast)
   13. Arranque
   ========================================================================== */

(function () {
  'use strict';

  /* ========================================================================
     01. UTILIDADES GENERALES
     ======================================================================== */

  const $  = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /** Escapa texto antes de insertarlo en HTML o SVG (evita inyección). */
  function esc(valor) {
    return String(valor).replace(/[&<>"']/g, (c) => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));
  }

  /** Formato de moneda para los precios de ejemplo. */
  const dinero = (n) => '$' + Number(n).toFixed(2);

  /** Devuelve texto claro u oscuro según el contraste del color de fondo. */
  function textoLegible(hex) {
    const limpio = hex.replace('#', '');
    const r = parseInt(limpio.slice(0, 2), 16);
    const g = parseInt(limpio.slice(2, 4), 16);
    const b = parseInt(limpio.slice(4, 6), 16);
    const luminancia = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminancia > 0.62 ? '#0d1c33' : '#fbf8f2';
  }

  /** Tamaño de letra que hace caber el texto del usuario dentro del producto. */
  function tamanoTexto(texto, maximo, minimo) {
    const largo = Math.max(texto.trim().length, 1);
    return Math.max(minimo, Math.min(maximo, Math.round((maximo * 11) / largo)));
  }

  const prefiereMenosMovimiento = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /** Parámetros de la URL actual (?ver=, ?categoria=, ?producto=, ?texto=). */
  const parametros = new URLSearchParams(window.location.search);

  /** Nombre del archivo en curso: "catalogo.html", "index.html", etc. */
  const paginaActual = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();


  /* ========================================================================
     02. DATOS DEL PROYECTO
     ------------------------------------------------------------------------
     Para editar el contenido de la tienda solo hay que modificar estos
     arreglos. Las imágenes se cambian reemplazando los archivos .svg de la
     carpeta assets/img/ por las tuyas (conserva los mismos nombres) o
     editando la ruta indicada en cada campo "imagen".
     ======================================================================== */

  // IMÁGENES DE PRODUCTOS: carpeta assets/img/products/
  const PRODUCTOS = [
    {
      id: 'camisa',
      nombre: 'Camisa personalizada',
      categoria: 'camisas',
      categoriaLabel: 'Camisas',
      precio: 18.90,
      simTipo: 'camisa',
      imagen: 'assets/img/products/camisa.jpg',
      descripcion: 'Camisa de algodón peinado con impresión frontal de alta definición. La base más versátil del catálogo: ideal para frases, monogramas o ilustraciones completas.',
      opciones: [
        { nombre: 'Color', valores: ['Blanco', 'Negro', 'Azul marino', 'Gris'] },
        { nombre: 'Talla', valores: ['S', 'M', 'L', 'XL'] },
        { nombre: 'Tipografía', valores: ['Clásica', 'Moderna'] }
      ]
    },
    {
      id: 'taza',
      nombre: 'Taza personalizada',
      categoria: 'tazas',
      categoriaLabel: 'Tazas',
      precio: 9.50,
      simTipo: 'taza',
      imagen: 'assets/img/products/taza.jpeg',
      descripcion: 'Taza de cerámica esmaltada apta para microondas y lavavajillas. El lienzo perfecto para mensajes cortos, nombres y diseños de línea.',
      opciones: [
        { nombre: 'Color', valores: ['Blanco', 'Negro', 'Azul', 'Dorado'] },
        { nombre: 'Capacidad', valores: ['11 oz', '15 oz'] },
        { nombre: 'Tipografía', valores: ['Clásica', 'Moderna'] }
      ]
    },
    {
      id: 'llavero',
      nombre: 'Llavero personalizado',
      categoria: 'llaveros',
      categoriaLabel: 'Llaveros',
      precio: 4.20,
      simTipo: 'llavero',
      imagen: 'assets/img/products/llavero.jpg',
      descripcion: 'Llavero grabado con argolla metálica reforzada. Pequeño, ligero y perfecto para iniciales, fechas o logos simplificados.',
      opciones: [
        { nombre: 'Material', valores: ['Acrílico', 'Madera', 'Metal'] },
        { nombre: 'Forma', valores: ['Círculo', 'Cuadrado', 'Corazón'] }
      ]
    },
    {
      id: 'sudadera',
      nombre: 'Sudadera personalizada',
      categoria: 'camisas',
      categoriaLabel: 'Camisas',
      precio: 32.00,
      simTipo: 'sudadera',
      imagen: 'assets/img/products/sueter.jpg',
      descripcion: 'Sudadera con capucha e interior aflanelado, con diseño impreso en el pecho. La opción más abrigada y con mayor área útil de impresión.',
      opciones: [
        { nombre: 'Color', valores: ['Gris', 'Negro', 'Azul marino', 'Marfil'] },
        { nombre: 'Talla', valores: ['S', 'M', 'L', 'XL'] },
        { nombre: 'Interior', valores: ['Aflanelado', 'Ligero'] }
      ]
    },
    {
      id: 'tote-bag',
      nombre: 'Tote bag personalizada',
      categoria: 'otros',
      categoriaLabel: 'Otros',
      precio: 12.75,
      simTipo: 'tote',
      imagen: 'assets/img/products/tote-bag.jpg',
      descripcion: 'Bolsa de algodón resistente con asas reforzadas y gran superficie imprimible. Práctica para el día a día y muy visible para diseños grandes.',
      opciones: [
        { nombre: 'Color', valores: ['Crudo', 'Negro', 'Azul marino'] },
        { nombre: 'Tamaño', valores: ['Estándar', 'Grande'] },
        { nombre: 'Asa', valores: ['Corta', 'Larga'] }
      ]
    },
    {
      id: 'vaso',
      nombre: 'Vaso personalizado',
      categoria: 'tazas',
      categoriaLabel: 'Tazas',
      precio: 15.40,
      simTipo: 'vaso',
      imagen: 'assets/img/products/vaso.jpg',
      descripcion: 'Vaso térmico de doble pared que mantiene la temperatura por horas. Incluye tapa y sorbete; se personaliza con grabado alrededor del cuerpo.',
      opciones: [
        { nombre: 'Color', valores: ['Blanco', 'Negro', 'Azul', 'Dorado'] },
        { nombre: 'Capacidad', valores: ['16 oz', '20 oz'] },
        { nombre: 'Tapa', valores: ['Bambú', 'Plástica'] }
      ]
    }
  ];

  // IMÁGENES DE DISEÑOS: carpeta assets/img/designs/
  const DISENOS = [
    {
      id: 'monograma',
      nombre: 'Monograma clásico',
      categoria: 'camisas',
      categoriaLabel: 'Camisas',
      productoSugerido: 'camisa',
      imagen: 'assets/img/designs/d01-monograma.svg',
      descripcion: 'Iniciales entrelazadas dentro de un sello circular con filete dorado. Un diseño sobrio pensado para regalos y uniformes.'
    },
    {
      id: 'geometrico',
      nombre: 'Geometría dorada',
      categoria: 'tazas',
      categoriaLabel: 'Tazas',
      productoSugerido: 'taza',
      imagen: 'assets/img/designs/d02-geometrico.svg',
      descripcion: 'Composición de triángulo y círculo en trazo fino con acento metálico. Funciona muy bien en superficies curvas y pequeñas.'
    },
    {
      id: 'botanico',
      nombre: 'Rama botánica',
      categoria: 'camisas',
      categoriaLabel: 'Camisas',
      productoSugerido: 'sudadera',
      imagen: 'assets/img/designs/d03-botanico.svg',
      descripcion: 'Ilustración lineal de una rama con hojas alternas. Elegante en una sola tinta y con mucho carácter en prendas claras.'
    },
    {
      id: 'tipografico',
      nombre: 'Tipografía editorial',
      categoria: 'tazas',
      categoriaLabel: 'Tazas',
      productoSugerido: 'vaso',
      imagen: 'assets/img/designs/d04-tipografico.svg',
      descripcion: 'Frases apiladas con jerarquía de tamaños y un filete separador. La opción favorita para mensajes personalizados.'
    },
    {
      id: 'minimal',
      nombre: 'Montaña minimal',
      categoria: 'llaveros',
      categoriaLabel: 'Llaveros',
      productoSugerido: 'llavero',
      imagen: 'assets/img/designs/d05-minimalista.svg',
      descripcion: 'Paisaje reducido a líneas esenciales con un sol en contorno. Diseñado para reproducirse bien en formatos muy pequeños.'
    },
    {
      id: 'retro',
      nombre: 'Sol retro',
      categoria: 'llaveros',
      categoriaLabel: 'Llaveros',
      productoSugerido: 'llavero',
      imagen: 'assets/img/designs/d06-retro.svg',
      descripcion: 'Medio sol con rayos y bandas horizontales de inspiración setentera, acompañado de olas en trazo simple.'
    }
  ];

  // IMÁGENES DEL SISTEMA: carpeta assets/img/system/
  // Reemplaza cada archivo por la captura real del módulo correspondiente.
  const PANTALLAS = [
    {
      id: 'inicio',
      boton: 'Inicio',
      titulo: 'Panel de inicio',
      imagen: 'assets/img/system/inicio.jpg',
      descripcion: 'Resumen general del negocio: productos registrados, pedidos del periodo, diseños disponibles y clientes activos, junto con la actividad más reciente del sistema.'
    },
    {
      id: 'productos',
      boton: 'Productos',
      titulo: 'Gestión de productos',
      imagen: 'assets/img/system/productos.jpg',
      descripcion: 'Alta, edición y baja de productos del catálogo. Cada registro guarda nombre, categoría, precio y stock, y avisa cuando una pieza está por agotarse.'
    },
    {
      id: 'diseno',
      boton: 'Diseños',
      titulo: 'Gestión de diseños',
      imagen: 'assets/img/system/diseno.jpg',
      descripcion: 'Biblioteca de diseños organizados por categoría y con su conteo de usos. Desde aquí se suben nuevas piezas o se retiran las que ya no están disponibles.'
    },
    {
      id: 'pedidos',
      boton: 'Pedidos',
      titulo: 'Gestión de pedidos',
      imagen: 'assets/img/system/pedidos.jpg',
      descripcion: 'Listado de pedidos con cliente, fecha, cantidad de productos y total. El administrador cambia el estado entre pendiente, en producción, entregado o cancelado.'
    },
    {
      id: 'Mi perfil',
      boton: 'Perfil',
      titulo: 'Reportes y estadísticas',
      imagen: 'assets/img/system/reportes.jpg',
      descripcion: 'Ingresos por mes, participación de cada categoría y los productos más vendidos del periodo. Los reportes se pueden filtrar por rango de fechas.'
    }
  ];

  // Configuración del simulador: las opciones cambian según el producto.
  // "extra" suma al precio base y sirve para demostrar el cálculo del total.
  const SIM_PRODUCTOS = {
    camisa: {
      nombre: 'Camisa',
      base: 18.90,
      maxTexto: 24,
      hint: 'Máximo 24 caracteres: es el ancho útil del área de impresión frontal.',
      icono: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><path d="M9 3 6 4.5 4 8l2.5 2L8 9v11h8V9l1.5 1L20 8l-2-3.5L15 3a3 3 0 0 1-6 0Z"/></svg>',
      grupos: [
        {
          id: 'color', label: 'Color de la prenda', tipo: 'color',
          opciones: [
            { id: 'blanco', label: 'Blanco', hex: '#f7f4ee' },
            { id: 'negro', label: 'Negro', hex: '#14181f' },
            { id: 'azul', label: 'Azul marino', hex: '#16294a' },
            { id: 'gris', label: 'Gris', hex: '#9aa1ab' }
          ]
        },
        {
          id: 'talla', label: 'Talla', tipo: 'chip',
          opciones: [
            { id: 's', label: 'S' },
            { id: 'm', label: 'M' },
            { id: 'l', label: 'L' },
            { id: 'xl', label: 'XL' },
            { id: 'xxl', label: 'XXL', extra: 1.50 }
          ]
        },
        {
          id: 'tipografia', label: 'Estilo del texto', tipo: 'chip',
          opciones: [
            { id: 'clasica', label: 'Clásica' },
            { id: 'moderna', label: 'Moderna' }
          ]
        }
      ]
    },
    taza: {
      nombre: 'Taza',
      base: 9.50,
      maxTexto: 20,
      hint: 'Máximo 20 caracteres: la superficie curva reduce el área útil.',
      icono: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><path d="M5 6h11v9a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5V6Z"/><path d="M16 9h2a3 3 0 0 1 0 6h-2"/></svg>',
      grupos: [
        {
          id: 'color', label: 'Color de la taza', tipo: 'color',
          opciones: [
            { id: 'blanco', label: 'Blanco', hex: '#f7f4ee' },
            { id: 'negro', label: 'Negro', hex: '#14181f' },
            { id: 'azul', label: 'Azul', hex: '#1d3b63' },
            { id: 'dorado', label: 'Dorado', hex: '#c9a227' }
          ]
        },
        {
          id: 'capacidad', label: 'Capacidad', tipo: 'chip',
          opciones: [
            { id: '11oz', label: '11 oz' },
            { id: '15oz', label: '15 oz', extra: 2.50 }
          ]
        },
        {
          id: 'tipografia', label: 'Estilo del texto', tipo: 'chip',
          opciones: [
            { id: 'clasica', label: 'Clásica' },
            { id: 'moderna', label: 'Moderna' }
          ]
        }
      ]
    },
    // El llavero no tiene talla ni color de tela: solo material y forma.
    llavero: {
      nombre: 'Llavero',
      base: 4.20,
      maxTexto: 12,
      hint: 'Máximo 12 caracteres: el llavero es la pieza con menos espacio.',
      icono: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="5" r="2.6"/><path d="M12 7.6V10"/><rect x="7" y="10" width="10" height="11" rx="3"/></svg>',
      grupos: [
        {
          id: 'material', label: 'Material', tipo: 'chip',
          opciones: [
            { id: 'acrilico', label: 'Acrílico', hex: '#eef2f6' },
            { id: 'madera', label: 'Madera', hex: '#b5854b', extra: 1.20 },
            { id: 'metal', label: 'Metal', hex: '#c3cad2', extra: 2.80 }
          ]
        },
        {
          id: 'forma', label: 'Forma', tipo: 'chip',
          opciones: [
            { id: 'circulo', label: 'Círculo' },
            { id: 'cuadrado', label: 'Cuadrado' },
            { id: 'corazon', label: 'Corazón', extra: 0.80 }
          ]
        }
      ]
    },
    sudadera: {
      nombre: 'Sudadera',
      base: 32.00,
      maxTexto: 22,
      hint: 'Máximo 22 caracteres: el diseño se imprime en el pecho, sobre la bolsa frontal.',
      icono: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><path d="M8 4 4 6 2 13l3 1 1.5-3V20h11v-9l1.5 3 3-1-2-7-4-2c0 2.2-1.6 3.5-4 3.5S8 6.2 8 4Z"/></svg>',
      grupos: [
        {
          id: 'color', label: 'Color de la sudadera', tipo: 'color',
          opciones: [
            { id: 'gris', label: 'Gris', hex: '#8e949e' },
            { id: 'negro', label: 'Negro', hex: '#14181f' },
            { id: 'azul', label: 'Azul marino', hex: '#16294a' },
            { id: 'marfil', label: 'Marfil', hex: '#efe9db' }
          ]
        },
        {
          id: 'talla', label: 'Talla', tipo: 'chip',
          opciones: [
            { id: 's', label: 'S' },
            { id: 'm', label: 'M' },
            { id: 'l', label: 'L' },
            { id: 'xl', label: 'XL' },
            { id: 'xxl', label: 'XXL', extra: 2.00 }
          ]
        },
        {
          id: 'interior', label: 'Interior', tipo: 'chip',
          opciones: [
            { id: 'aflanelado', label: 'Aflanelado' },
            { id: 'ligero', label: 'Ligero' }
          ]
        },
        {
          id: 'tipografia', label: 'Estilo del texto', tipo: 'chip',
          opciones: [
            { id: 'clasica', label: 'Clásica' },
            { id: 'moderna', label: 'Moderna' }
          ]
        }
      ]
    },
    tote: {
      nombre: 'Tote bag',
      base: 12.75,
      maxTexto: 22,
      hint: 'Máximo 22 caracteres: la tote bag tiene mucha superficie, pero conviene un texto breve.',
      icono: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><path d="M5 9h14l-1 11H6L5 9Z"/><path d="M9 9V7a3 3 0 0 1 6 0v2"/></svg>',
      grupos: [
        {
          id: 'color', label: 'Color de la bolsa', tipo: 'color',
          opciones: [
            { id: 'crudo', label: 'Crudo', hex: '#e8dfc9' },
            { id: 'negro', label: 'Negro', hex: '#14181f' },
            { id: 'azul', label: 'Azul marino', hex: '#16294a' }
          ]
        },
        {
          id: 'tamano', label: 'Tamaño', tipo: 'chip',
          opciones: [
            { id: 'estandar', label: 'Estándar' },
            { id: 'grande', label: 'Grande', extra: 2.00 }
          ]
        },
        {
          id: 'asa', label: 'Asa', tipo: 'chip',
          opciones: [
            { id: 'corta', label: 'Corta' },
            { id: 'larga', label: 'Larga', extra: 0.60 }
          ]
        },
        {
          id: 'tipografia', label: 'Estilo del texto', tipo: 'chip',
          opciones: [
            { id: 'clasica', label: 'Clásica' },
            { id: 'moderna', label: 'Moderna' }
          ]
        }
      ]
    },
    vaso: {
      nombre: 'Vaso',
      base: 15.40,
      maxTexto: 18,
      hint: 'Máximo 18 caracteres: el grabado va alrededor del cuerpo del vaso.',
      icono: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" aria-hidden="true"><path d="M7 8h10l-1.2 12H8.2L7 8Z"/><path d="M6 8h12"/><path d="M13 8l1.5-5"/></svg>',
      grupos: [
        {
          id: 'color', label: 'Color del vaso', tipo: 'color',
          opciones: [
            { id: 'blanco', label: 'Blanco', hex: '#f7f4ee' },
            { id: 'negro', label: 'Negro', hex: '#14181f' },
            { id: 'azul', label: 'Azul', hex: '#1d3b63' },
            { id: 'dorado', label: 'Dorado', hex: '#c9a227' }
          ]
        },
        {
          id: 'capacidad', label: 'Capacidad', tipo: 'chip',
          opciones: [
            { id: '16oz', label: '16 oz' },
            { id: '20oz', label: '20 oz', extra: 2.00 }
          ]
        },
        {
          id: 'tapa', label: 'Tapa', tipo: 'chip',
          opciones: [
            { id: 'plastica', label: 'Plástica', hex: '#232c3b' },
            { id: 'bambu', label: 'Bambú', hex: '#b5854b', extra: 1.50 }
          ]
        },
        {
          id: 'tipografia', label: 'Estilo del texto', tipo: 'chip',
          opciones: [
            { id: 'clasica', label: 'Clásica' },
            { id: 'moderna', label: 'Moderna' }
          ]
        }
      ]
    }
  };

  const FUENTES = {
    clasica: "Georgia, 'Times New Roman', serif",
    moderna: "Manrope, 'Segoe UI', system-ui, sans-serif"
  };


  /* ========================================================================
     03. RESPALDO DE IMÁGENES FALTANTES
     Si una imagen no existe o fue movida, se sustituye por un marcador
     generado en el momento: así nunca aparece un enlace roto.
     ======================================================================== */

  function imagenRespaldo(ruta) {
    const nombre = ruta.split('/').pop();
    const svg =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600">' +
      '<rect width="800" height="600" fill="#0b1729"/>' +
      '<rect x="20" y="20" width="760" height="560" fill="none" stroke="#c9a227" stroke-opacity=".4" stroke-width="2"/>' +
      '<text x="400" y="286" text-anchor="middle" font-family="Arial, sans-serif" font-size="26" fill="#e9e4d8">Imagen no encontrada</text>' +
      '<text x="400" y="326" text-anchor="middle" font-family="Arial, sans-serif" font-size="18" fill="#c9a227">' + esc(nombre) + '</text>' +
      '</svg>';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  // Captura el evento "error" en fase de captura porque no burbujea.
  document.addEventListener('error', function (e) {
    const img = e.target;
    if (!img || img.tagName !== 'IMG' || img.dataset.respaldo === '1') return;
    img.dataset.respaldo = '1';
    img.src = imagenRespaldo(img.getAttribute('src') || 'imagen');
  }, true);


  /* ========================================================================
     04. HEADER, MENÚ RESPONSIVE, ENLACE ACTIVO Y NAVEGACIÓN ENTRE PÁGINAS
     ======================================================================== */

  const header = $('#siteHeader');
  const btnMenu = $('#btnMenu');
  const nav = $('#navPrincipal');
  const navBackdrop = $('#navBackdrop');
  const btnTop = $('#btnTop');

  function abrirMenu(abrir) {
    if (!nav) return;
    nav.classList.toggle('is-open', abrir);
    if (navBackdrop) navBackdrop.hidden = !abrir;
    btnMenu.setAttribute('aria-expanded', String(abrir));
    btnMenu.setAttribute('aria-label', abrir ? 'Cerrar menú de navegación' : 'Abrir menú de navegación');
    document.body.classList.toggle('no-scroll', abrir);
  }

  if (btnMenu) {
    btnMenu.addEventListener('click', function () {
      abrirMenu(!nav.classList.contains('is-open'));
    });
  }
  if (navBackdrop) navBackdrop.addEventListener('click', function () { abrirMenu(false); });

  /** Marca como activo el enlace de la página que se está viendo. */
  function marcarEnlaceActivo() {
    $$('.nav-link').forEach(function (a) {
      const destino = (a.getAttribute('href') || '').toLowerCase();
      const activo = destino === paginaActual ||
        (paginaActual === '' && destino === 'index.html');
      a.classList.toggle('is-active', activo);
      if (activo) a.setAttribute('aria-current', 'page');
    });
  }

  function alHacerScroll() {
    const y = window.pageYOffset;
    if (header) header.classList.toggle('is-scrolled', y > 24);
    if (btnTop) btnTop.hidden = y < 420;
  }

  if (btnTop) {
    btnTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: prefiereMenosMovimiento ? 'auto' : 'smooth' });
    });
  }

  /**
   * Salto a otra vista del sitio. El mensaje opcional se muestra como aviso
   * (toast) en la página de destino mediante el parámetro "aviso".
   */
  function irAPagina(archivo, params, mensaje) {
    const url = new URLSearchParams(params || {});
    if (mensaje) url.set('aviso', mensaje);
    const query = url.toString();
    window.location.href = archivo + (query ? '?' + query : '');
  }

  /** Muestra el aviso pendiente que vino en la URL y limpia el parámetro. */
  function revisarAviso() {
    const mensaje = parametros.get('aviso');
    if (!mensaje) return;
    mostrarToast(mensaje);
    parametros.delete('aviso');
    const resto = parametros.toString();
    const limpia = window.location.pathname + (resto ? '?' + resto : '');
    if (history.replaceState) history.replaceState(null, '', limpia);
  }


  /* ========================================================================
     05. CATÁLOGO: RENDERIZADO Y FILTROS  (catalogo.html)
     ======================================================================== */

  const gridProductos = $('#gridProductos');
  const emptyCatalogo = $('#emptyCatalogo');
  const filtrosCatalogo = $('#filtrosCatalogo');
  const favoritos = new Set();

  function tarjetaProducto(p, indice) {
    const esFav = favoritos.has(p.id);
    return '' +
      '<article class="product-card" data-categoria="' + esc(p.categoria) + '" style="animation-delay:' + (indice * 55) + 'ms">' +
        '<button class="product-media" type="button" data-ver="' + esc(p.id) + '" aria-label="Ver detalles de ' + esc(p.nombre) + '">' +
          '<img src="' + esc(p.imagen) + '" alt="Imagen de ' + esc(p.nombre) + '" loading="lazy" data-img>' +
          '<span class="product-badge">' + esc(p.categoriaLabel) + '</span>' +
        '</button>' +
        '<div class="product-body">' +
          '<p class="product-cat">' + esc(p.categoriaLabel) + '</p>' +
          '<h3 class="product-name">' + esc(p.nombre) + '</h3>' +
          '<p class="product-desc">' + esc(p.descripcion) + '</p>' +
          '<div class="product-foot">' +
            '<p class="product-price">' + dinero(p.precio) + '<small>Precio de ejemplo</small></p>' +
            '<button class="product-link" type="button" data-ver="' + esc(p.id) + '">' +
              'Ver detalles <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>' +
            '</button>' +
          '</div>' +
        '</div>' +
        '<button class="product-fav' + (esFav ? ' is-on' : '') + '" type="button" data-fav="' + esc(p.id) + '" ' +
          'aria-label="' + (esFav ? 'Quitar de favoritos' : 'Guardar en favoritos') + ': ' + esc(p.nombre) + '" aria-pressed="' + esFav + '">' +
          '<i class="fa-' + (esFav ? 'solid' : 'regular') + ' fa-heart" aria-hidden="true"></i>' +
        '</button>' +
      '</article>';
  }

  function pintarProductos(filtro) {
    if (!gridProductos) return;
    const lista = filtro === 'todos'
      ? PRODUCTOS
      : PRODUCTOS.filter(function (p) { return p.categoria === filtro; });

    gridProductos.innerHTML = lista.map(tarjetaProducto).join('');
    if (emptyCatalogo) emptyCatalogo.hidden = lista.length > 0;
  }

  function iniciarCatalogo() {
    if (!gridProductos) return;

    if (filtrosCatalogo) {
      filtrosCatalogo.addEventListener('click', function (e) {
        const chip = e.target.closest('.chip');
        if (!chip) return;
        $$('.chip', filtrosCatalogo).forEach(function (c) {
          const activo = c === chip;
          c.classList.toggle('is-active', activo);
          c.setAttribute('aria-pressed', String(activo));
        });
        pintarProductos(chip.dataset.filter);
      });
    }

    // Acciones dentro del catálogo (ver detalles / favoritos) por delegación.
    gridProductos.addEventListener('click', function (e) {
      const ver = e.target.closest('[data-ver]');
      if (ver) { abrirModalProducto(ver.dataset.ver); return; }

      const fav = e.target.closest('[data-fav]');
      if (!fav) return;
      const id = fav.dataset.fav;
      const activo = favoritos.has(id);
      if (activo) favoritos.delete(id); else favoritos.add(id);
      fav.classList.toggle('is-on', !activo);
      fav.setAttribute('aria-pressed', String(!activo));
      const icono = $('i', fav);
      if (icono) {
        icono.classList.toggle('fa-solid', !activo);
        icono.classList.toggle('fa-regular', activo);
      }
      const producto = PRODUCTOS.find(function (p) { return p.id === id; });
      mostrarToast(activo
        ? 'Quitado de favoritos: ' + (producto ? producto.nombre : '')
        : 'Guardado en favoritos (demostración local)');
    });

    pintarProductos('todos');

    // ?ver=<id> abre directamente el modal de un producto (viene de otra página).
    const ver = parametros.get('ver');
    if (ver) abrirModalProducto(ver);
  }


  /* ========================================================================
     06. GALERÍA DE DISEÑOS: RENDERIZADO Y FILTROS  (disenos.html)
     ======================================================================== */

  const gridDisenos = $('#gridDisenos');
  const emptyDisenos = $('#emptyDisenos');
  const filtrosDisenos = $('#filtrosDisenos');

  function tarjetaDiseno(d, indice) {
    const producto = PRODUCTOS.find(function (p) { return p.id === d.productoSugerido; });
    return '' +
      '<button class="design-card" type="button" data-diseno="' + esc(d.id) + '" ' +
        'style="animation-delay:' + (indice * 55) + 'ms" aria-label="Ver el diseño ' + esc(d.nombre) + '">' +
        '<img src="' + esc(d.imagen) + '" alt="Diseño ' + esc(d.nombre) + '" loading="lazy" data-img>' +
        '<span class="design-overlay">' +
          '<span>' + esc(d.categoriaLabel) + '</span>' +
          '<strong>' + esc(d.nombre) + '</strong>' +
          '<em>Ideal para: ' + esc(producto ? producto.nombre : 'productos personalizados') + '</em>' +
        '</span>' +
      '</button>';
  }

  function pintarDisenos(filtro) {
    if (!gridDisenos) return;
    const lista = filtro === 'todos'
      ? DISENOS
      : DISENOS.filter(function (d) { return d.categoria === filtro; });

    gridDisenos.innerHTML = lista.map(tarjetaDiseno).join('');
    if (emptyDisenos) emptyDisenos.hidden = lista.length > 0;
  }

  function iniciarDisenos() {
    if (!gridDisenos) return;

    if (filtrosDisenos) {
      filtrosDisenos.addEventListener('click', function (e) {
        const chip = e.target.closest('.chip');
        if (!chip) return;
        $$('.chip', filtrosDisenos).forEach(function (c) {
          const activo = c === chip;
          c.classList.toggle('is-active', activo);
          c.setAttribute('aria-pressed', String(activo));
        });
        pintarDisenos(chip.dataset.filter);
      });
    }

    gridDisenos.addEventListener('click', function (e) {
      const tarjeta = e.target.closest('[data-diseno]');
      if (tarjeta) abrirModalDiseno(tarjeta.dataset.diseno);
    });

    // ?categoria=<cat> llega desde el modal de producto para filtrar la galería.
    const categoria = parametros.get('categoria') || 'todos';
    const chip = $('.chip[data-filter="' + categoria + '"]', filtrosDisenos)
      || $('.chip[data-filter="todos"]', filtrosDisenos);
    if (chip) chip.click(); else pintarDisenos('todos');
  }


  /* ========================================================================
     07. MODALES (PRODUCTO Y DISEÑO)
     El modal de producto vive en catalogo.html y el de diseño en disenos.html.
     ======================================================================== */

  const modalProducto = $('#modalProducto');
  const modalDiseno = $('#modalDiseno');
  let ultimoEnfoque = null;

  function abrirModal(modal, contenidoHtml, idTitulo) {
    ultimoEnfoque = document.activeElement;
    $('.modal-body', modal).innerHTML = contenidoHtml;
    modal.hidden = false;
    document.body.classList.add('no-scroll');

    const dialogo = $('.modal-dialog', modal);
    dialogo.scrollTop = 0;
    // El título debe existir para que aria-labelledby tenga sentido.
    if (idTitulo) dialogo.setAttribute('aria-labelledby', idTitulo);

    const cerrar = $('.modal-close', modal);
    if (cerrar) cerrar.focus();
  }

  function cerrarModal(modal) {
    if (modal.hidden) return;
    modal.hidden = true;
    $('.modal-body', modal).innerHTML = '';
    if (!hayModalAbierto()) document.body.classList.remove('no-scroll');
    if (ultimoEnfoque && document.contains(ultimoEnfoque)) ultimoEnfoque.focus();
  }

  function modalesDeLaPagina() {
    return [modalProducto, modalDiseno].filter(Boolean);
  }

  function hayModalAbierto() {
    return modalesDeLaPagina().some(function (m) { return !m.hidden; });
  }

  function iniciarModales() {
    if (modalesDeLaPagina().length === 0) return;

    // Cierre con la tecla Escape y bloqueo del tabulador dentro del diálogo.
    document.addEventListener('keydown', function (e) {
      const abierto = modalesDeLaPagina().filter(function (m) { return !m.hidden; }).pop();

      if (e.key === 'Escape') {
        if (abierto) { cerrarModal(abierto); return; }
        if (nav && nav.classList.contains('is-open')) abrirMenu(false);
        return;
      }

      if (e.key !== 'Tab' || !abierto) return;

      const enfocables = $$('a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])', abierto)
        .filter(function (el) { return el.offsetParent !== null; });
      if (enfocables.length === 0) return;

      const primero = enfocables[0];
      const ultimo = enfocables[enfocables.length - 1];
      if (e.shiftKey && document.activeElement === primero) {
        e.preventDefault(); ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault(); primero.focus();
      }
    });

    // Clic en el fondo o en la "X" cierra el modal.
    modalesDeLaPagina().forEach(function (modal) {
      modal.addEventListener('click', function (e) {
        if (e.target.closest('[data-close-modal]')) cerrarModal(modal);
      });
    });
  }

  /* --- Modal de producto --- */
  function abrirModalProducto(id) {
    if (!modalProducto) return;
    const p = PRODUCTOS.find(function (x) { return x.id === id; });
    if (!p) return;

    const grupos = p.opciones.map(function (grupo) {
      const valores = grupo.valores.map(function (v, i) {
        return '<button class="m-opt' + (i === 0 ? ' is-active' : '') + '" type="button" ' +
          'data-grupo="' + esc(grupo.nombre) + '" data-valor="' + esc(v) + '">' + esc(v) + '</button>';
      }).join('');
      return '<div class="m-opt-group"><p class="m-opt-title">' + esc(grupo.nombre) + '</p>' +
        '<div class="m-opt-list">' + valores + '</div></div>';
    }).join('');

    abrirModal(modalProducto,
      '<div class="m-product">' +
        '<div class="m-media">' +
          '<img src="' + esc(p.imagen) + '" alt="Imagen de ' + esc(p.nombre) + '" data-img>' +
          '<span class="m-media-badge">' + esc(p.categoriaLabel) + '</span>' +
        '</div>' +
        '<div class="m-content">' +
          '<h2 class="m-title" id="modalProductoTitulo">' + esc(p.nombre) + '</h2>' +
          '<p class="m-price">' + dinero(p.precio) + '</p>' +
          '<p class="m-desc">' + esc(p.descripcion) + '</p>' +
          '<ul class="m-meta">' +
            '<li><i class="fa-solid fa-tag" aria-hidden="true"></i> ' + esc(p.categoriaLabel) + '</li>' +
            '<li><i class="fa-solid fa-circle-check" aria-hidden="true"></i> Disponible</li>' +
            '<li><i class="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i> Personalizable</li>' +
          '</ul>' +
          '<div class="m-options">' +
            '<p class="m-opt-title">Opciones disponibles</p>' +
            grupos +
          '</div>' +
          '<p class="m-selection" id="mSeleccion"></p>' +
          '<div class="m-actions">' +
            '<button class="btn btn-gold" type="button" data-accion="personalizar">' +
              '<i class="fa-solid fa-pen-nib" aria-hidden="true"></i> Personalizar' +
            '</button>' +
            '<button class="btn btn-outline" type="button" data-accion="disenos">Ver diseños</button>' +
          '</div>' +
        '</div>' +
      '</div>', 'modalProductoTitulo');

    actualizarSeleccionProducto(p);

    // Selección de opciones dentro del modal.
    $$('.m-opt', modalProducto).forEach(function (btn) {
      btn.addEventListener('click', function () {
        $$('.m-opt[data-grupo="' + btn.dataset.grupo + '"]', modalProducto)
          .forEach(function (o) { o.classList.remove('is-active'); });
        btn.classList.add('is-active');
        actualizarSeleccionProducto(p);
      });
    });

    // Acciones del modal: llevan a la vista correspondiente del sitio.
    $('[data-accion="personalizar"]', modalProducto).addEventListener('click', function () {
      irAPagina('personalizar.html', { producto: p.simTipo },
        'Producto cargado en el simulador: ' + p.nombre);
    });
    $('[data-accion="disenos"]', modalProducto).addEventListener('click', function () {
      irAPagina('disenos.html', { categoria: p.categoria },
        'Mostrando diseños sugeridos para ' + p.nombre);
    });
  }

  function actualizarSeleccionProducto(p) {
    const salida = $('#mSeleccion', modalProducto);
    if (!salida) return;
    const elegidas = $$('.m-opt.is-active', modalProducto).map(function (o) { return o.dataset.valor; });
    salida.textContent = elegidas.length
      ? 'Tu configuración: ' + p.nombre + ' · ' + elegidas.join(' · ')
      : '';
  }

  /* --- Modal de diseño --- */
  function abrirModalDiseno(id) {
    if (!modalDiseno) return;
    const d = DISENOS.find(function (x) { return x.id === id; });
    if (!d) return;
    const sugerido = PRODUCTOS.find(function (p) { return p.id === d.productoSugerido; });

    abrirModal(modalDiseno,
      '<div class="m-design">' +
        '<div class="m-design-media">' +
          '<img src="' + esc(d.imagen) + '" alt="Diseño ' + esc(d.nombre) + '" data-img>' +
        '</div>' +
        '<div class="m-design-content">' +
          '<h2 class="m-title" id="modalDisenoTitulo">' + esc(d.nombre) + '</h2>' +
          '<dl class="m-rows">' +
            '<div><dt>Categoría</dt><dd>' + esc(d.categoriaLabel) + '</dd></div>' +
            '<div><dt>Producto sugerido</dt><dd>' + esc(sugerido ? sugerido.nombre : 'Producto personalizado') + '</dd></div>' +
            '<div><dt>Descripción</dt><dd>' + esc(d.descripcion) + '</dd></div>' +
          '</dl>' +
          '<div class="m-actions">' +
            '<button class="btn btn-gold" type="button" data-accion="aplicar">' +
              '<i class="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i> Aplicar en el simulador' +
            '</button>' +
            '<button class="btn btn-outline" type="button" data-accion="producto">Ver producto</button>' +
          '</div>' +
        '</div>' +
      '</div>', 'modalDisenoTitulo');

    $('[data-accion="aplicar"]', modalDiseno).addEventListener('click', function () {
      irAPagina('personalizar.html', {
        producto: sugerido ? sugerido.simTipo : 'camisa',
        texto: d.nombre
      }, 'Diseño "' + d.nombre + '" listo para personalizar');
    });

    $('[data-accion="producto"]', modalDiseno).addEventListener('click', function () {
      if (sugerido) irAPagina('catalogo.html', { ver: sugerido.id });
    });
  }


  /* ========================================================================
     08. SIMULADOR DE PERSONALIZACIÓN  (personalizar.html)
     ======================================================================== */

  const simProductos = $('#simProductos');
  const simOpciones = $('#simOpciones');
  const simOpcionesTitulo = $('#simOpcionesTitulo');
  const simTexto = $('#simTexto');
  const simContador = $('#simContador');
  const simError = $('#simTextoError');
  const simHint = $('#simTextoHint');
  const previewCanvas = $('#previewCanvas');

  const estadoSim = { producto: 'camisa', seleccion: {}, texto: '' };

  function pintarSelectorProductos() {
    simProductos.innerHTML = Object.keys(SIM_PRODUCTOS).map(function (tipo) {
      const cfg = SIM_PRODUCTOS[tipo];
      const activo = tipo === estadoSim.producto;
      return '<button class="sim-product' + (activo ? ' is-active' : '') + '" type="button" role="radio" ' +
        'aria-checked="' + activo + '" data-tipo="' + esc(tipo) + '">' +
        cfg.icono + '<span>' + esc(cfg.nombre) + '</span></button>';
    }).join('');
  }

  /** Construye los grupos de opciones que corresponden al producto activo. */
  function pintarOpciones() {
    const cfg = SIM_PRODUCTOS[estadoSim.producto];

    simOpcionesTitulo.textContent = 'Personaliza tu ' + cfg.nombre.toLowerCase();

    simOpciones.innerHTML = cfg.grupos.map(function (grupo) {
      const cuerpo = grupo.opciones.map(function (op) {
        const activa = estadoSim.seleccion[grupo.id] === op.id;
        if (grupo.tipo === 'color') {
          return '<button class="opt-color' + (activa ? ' is-active' : '') + '" type="button" ' +
            'style="background-color:' + esc(op.hex) + '" data-grupo="' + esc(grupo.id) + '" data-op="' + esc(op.id) + '" ' +
            'aria-label="' + esc(op.label) + '" aria-pressed="' + activa + '" title="' + esc(op.label) + '"></button>';
        }
        return '<button class="opt' + (activa ? ' is-active' : '') + '" type="button" ' +
          'data-grupo="' + esc(grupo.id) + '" data-op="' + esc(op.id) + '" aria-pressed="' + activa + '">' +
          esc(op.label) + (op.extra ? ' <span>+' + op.extra.toFixed(2) + '</span>' : '') + '</button>';
      }).join('');

      return '<div class="opt-group">' +
        '<span class="opt-group-label" id="lbl-' + esc(grupo.id) + '">' + esc(grupo.label) + '</span>' +
        '<div class="opt-choices' + (grupo.tipo === 'color' ? ' opt-colors' : '') + '" ' +
          'role="group" aria-labelledby="lbl-' + esc(grupo.id) + '">' + cuerpo + '</div>' +
      '</div>';
    }).join('');

    simHint.textContent = cfg.hint;
    simTexto.maxLength = cfg.maxTexto;
  }

  function opcionElegida(grupoId) {
    const cfg = SIM_PRODUCTOS[estadoSim.producto];
    const grupo = cfg.grupos.find(function (g) { return g.id === grupoId; });
    if (!grupo) return null;
    return grupo.opciones.find(function (o) { return o.id === estadoSim.seleccion[grupoId]; }) || null;
  }

  function precioEstimado() {
    const cfg = SIM_PRODUCTOS[estadoSim.producto];
    const extras = cfg.grupos.reduce(function (total, grupo) {
      const op = opcionElegida(grupo.id);
      return total + (op && op.extra ? op.extra : 0);
    }, 0);
    const porTexto = estadoSim.texto.trim() ? 1.50 : 0;
    return cfg.base + extras + porTexto;
  }

  /* --- Vista previa dinámica (SVG generado según producto y opciones) --- */

  function svgCamisa(color, texto, fuente) {
    const tinta = textoLegible(color);
    const fs = texto ? tamanoTexto(texto, 30, 11) : 0;
    return '<svg viewBox="0 0 400 400" role="img" aria-label="Vista previa de la camisa personalizada">' +
      '<path d="M145 88 L110 102 L86 140 L120 166 L142 148 L142 330 L258 330 L258 148 L280 166 L314 140 L290 102 L255 88 ' +
        'C248 108 226 118 200 118 C174 118 152 108 145 88 Z" fill="' + color + '" stroke="rgba(5,11,22,.28)" stroke-width="2"/>' +
      '<path d="M145 88 C152 108 174 118 200 118 C226 118 248 108 255 88" fill="none" stroke="rgba(5,11,22,.34)" stroke-width="5"/>' +
      '<path d="M150 300 L250 300" stroke="rgba(5,11,22,.14)" stroke-width="2"/>' +
      (texto ? '<text x="200" y="228" text-anchor="middle" font-family="' + fuente + '" font-size="' + fs + '" ' +
        'fill="' + tinta + '" opacity=".92">' + esc(texto) + '</text>' : '') +
      '</svg>';
  }

  function svgTaza(color, texto, fuente) {
    const tinta = textoLegible(color);
    const fs = texto ? tamanoTexto(texto, 24, 10) : 0;
    return '<svg viewBox="0 0 400 400" role="img" aria-label="Vista previa de la taza personalizada">' +
      '<path d="M262 150 C322 146 322 234 258 230" fill="none" stroke="' + color + '" stroke-width="20" stroke-linecap="round"/>' +
      '<path d="M126 128 L262 128 L250 300 C249 311 240 318 229 318 L159 318 C148 318 139 311 138 300 Z" ' +
        'fill="' + color + '" stroke="rgba(5,11,22,.28)" stroke-width="2"/>' +
      '<ellipse cx="194" cy="128" rx="68" ry="16" fill="rgba(5,11,22,.22)"/>' +
      '<ellipse cx="194" cy="128" rx="68" ry="16" fill="none" stroke="rgba(5,11,22,.30)" stroke-width="2"/>' +
      (texto ? '<text x="194" y="234" text-anchor="middle" font-family="' + fuente + '" font-size="' + fs + '" ' +
        'fill="' + tinta + '" opacity=".92">' + esc(texto) + '</text>' : '') +
      '</svg>';
  }

  function svgLlavero(material, forma, texto) {
    const tinta = textoLegible(material);
    const fs = texto ? tamanoTexto(texto, 22, 9) : 0;
    let figura = '';
    if (forma === 'cuadrado') {
      figura = '<rect x="122" y="152" width="156" height="156" rx="34" fill="' + material + '" stroke="rgba(5,11,22,.25)" stroke-width="2"/>';
    } else if (forma === 'corazon') {
      figura = '<path d="M200 320 C200 320 112 266 112 210 C112 180 136 162 160 162 C180 162 194 175 200 186 ' +
        'C206 175 220 162 240 162 C264 162 288 180 288 210 C288 266 200 320 200 320 Z" fill="' + material + '" stroke="rgba(5,11,22,.25)" stroke-width="2"/>';
    } else {
      figura = '<circle cx="200" cy="230" r="88" fill="' + material + '" stroke="rgba(5,11,22,.25)" stroke-width="2"/>';
    }
    const cyTexto = forma === 'corazon' ? 246 : 240;
    return '<svg viewBox="0 0 400 400" role="img" aria-label="Vista previa del llavero personalizado">' +
      '<circle cx="200" cy="76" r="26" fill="none" stroke="#c9a227" stroke-width="9"/>' +
      '<rect x="194" y="100" width="12" height="34" rx="6" fill="#c9a227"/>' +
      figura +
      '<circle cx="200" cy="176" r="7" fill="rgba(5,11,22,.4)"/>' +
      (texto ? '<text x="200" y="' + cyTexto + '" text-anchor="middle" font-family="' + FUENTES.moderna + '" ' +
        'font-size="' + fs + '" font-weight="700" fill="' + tinta + '" opacity=".9">' + esc(texto) + '</text>' : '') +
      '</svg>';
  }

  function svgSudadera(color, texto, fuente) {
    const tinta = textoLegible(color);
    const fs = texto ? tamanoTexto(texto, 26, 10) : 0;
    return '<svg viewBox="0 0 400 400" role="img" aria-label="Vista previa de la sudadera personalizada">' +
      // Cuerpo y mangas largas
      '<path d="M150 104 L100 120 L60 262 L96 274 L124 190 L128 336 L272 336 L276 190 L304 274 L340 262 L300 120 L250 104 Z" ' +
        'fill="' + color + '" stroke="rgba(5,11,22,.28)" stroke-width="2"/>' +
      // Capucha (parte trasera) y abertura
      '<path d="M146 108 C136 48 264 48 254 108 C248 138 152 138 146 108 Z" fill="' + color + '" stroke="rgba(5,11,22,.3)" stroke-width="2"/>' +
      '<path d="M146 108 C136 48 264 48 254 108 C248 138 152 138 146 108 Z" fill="rgba(5,11,22,.10)"/>' +
      '<path d="M162 104 C168 80 232 80 238 104 C232 124 168 124 162 104 Z" fill="rgba(5,11,22,.38)"/>' +
      // Cordones
      '<path d="M184 124 L181 176" stroke="' + tinta + '" stroke-opacity=".55" stroke-width="3" stroke-linecap="round"/>' +
      '<path d="M216 124 L219 176" stroke="' + tinta + '" stroke-opacity=".55" stroke-width="3" stroke-linecap="round"/>' +
      '<circle cx="181" cy="179" r="3.5" fill="' + tinta + '" fill-opacity=".55"/><circle cx="219" cy="179" r="3.5" fill="' + tinta + '" fill-opacity=".55"/>' +
      // Bolsa frontal, puños y dobladillo
      '<path d="M146 268 L254 268 L266 310 L134 310 Z" fill="rgba(5,11,22,.08)" stroke="rgba(5,11,22,.26)" stroke-width="2"/>' +
      '<path d="M128 322 L272 322" stroke="rgba(5,11,22,.22)" stroke-width="3"/>' +
      '<path d="M66 244 L100 255" stroke="rgba(5,11,22,.22)" stroke-width="3"/><path d="M334 244 L300 255" stroke="rgba(5,11,22,.22)" stroke-width="3"/>' +
      (texto ? '<text x="200" y="222" text-anchor="middle" font-family="' + fuente + '" font-size="' + fs + '" ' +
        'fill="' + tinta + '" opacity=".92">' + esc(texto) + '</text>' : '') +
      '</svg>';
  }

  function svgTote(color, texto, fuente, grande, asaLarga) {
    const tinta = textoLegible(color);
    const w = grande ? 244 : 214;
    const h = grande ? 236 : 206;
    const x = 200 - w / 2;
    const y = 362 - h;
    const hx1 = 200 - w * 0.22;
    const hx2 = 200 + w * 0.22;
    const alto = asaLarga ? (grande ? 140 : 170) : 110;
    const fs = texto ? tamanoTexto(texto, 28, 11) : 0;
    const asa = 'M' + hx1 + ' ' + (y + 6) + ' C' + hx1 + ' ' + (y - alto) + ' ' + hx2 + ' ' + (y - alto) + ' ' + hx2 + ' ' + (y + 6);
    return '<svg viewBox="0 0 400 400" role="img" aria-label="Vista previa de la tote bag personalizada">' +
      '<path d="' + asa + '" fill="none" stroke="rgba(5,11,22,.3)" stroke-width="17" stroke-linecap="round"/>' +
      '<path d="' + asa + '" fill="none" stroke="' + color + '" stroke-width="12" stroke-linecap="round"/>' +
      '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="4" fill="' + color + '" stroke="rgba(5,11,22,.28)" stroke-width="2"/>' +
      '<path d="M' + x + ' ' + (y + 16) + ' L' + (x + w) + ' ' + (y + 16) + '" stroke="rgba(5,11,22,.16)" stroke-width="2" stroke-dasharray="6 5"/>' +
      '<path d="M' + x + ' ' + (y + h - 12) + ' L' + (x + w) + ' ' + (y + h - 12) + '" stroke="rgba(5,11,22,.12)" stroke-width="2" stroke-dasharray="6 5"/>' +
      (texto ? '<text x="200" y="' + (y + h * 0.56) + '" text-anchor="middle" font-family="' + fuente + '" font-size="' + fs + '" ' +
        'fill="' + tinta + '" opacity=".92">' + esc(texto) + '</text>' : '') +
      '</svg>';
  }

  function svgVaso(color, texto, fuente, grande, colorTapa) {
    const tinta = textoLegible(color);
    const top = grande ? 128 : 150;
    const fs = texto ? Math.max(8, Math.min(22, Math.round(100 / (0.56 * Math.max(texto.trim().length, 1))))) : 0;
    const cuerpo = 'M132 ' + top + ' L268 ' + top + ' L252 340 C251 351 244 358 233 358 L167 358 C156 358 149 351 148 340 Z';
    const yTexto = top + (358 - top) * 0.56;
    return '<svg viewBox="0 0 400 400" role="img" aria-label="Vista previa del vaso personalizado">' +
      // Sorbete
      '<path d="M220 ' + (top - 24) + ' L246 ' + (top - 112) + '" stroke="rgba(5,11,22,.3)" stroke-width="13" stroke-linecap="round"/>' +
      '<path d="M220 ' + (top - 24) + ' L246 ' + (top - 112) + '" stroke="#d9d4c8" stroke-width="8" stroke-linecap="round"/>' +
      // Cuerpo con brillo lateral
      '<path d="' + cuerpo + '" fill="' + color + '" stroke="rgba(5,11,22,.28)" stroke-width="2"/>' +
      '<path d="M146 ' + (top + 12) + ' L160 ' + (top + 12) + ' L170 340 L158 340 Z" fill="rgba(255,255,255,.14)"/>' +
      // Tapa
      '<path d="M124 ' + (top - 12) + ' C124 ' + (top - 24) + ' 132 ' + (top - 30) + ' 142 ' + (top - 30) + ' L258 ' + (top - 30) + ' C268 ' + (top - 30) + ' 276 ' + (top - 24) + ' 276 ' + (top - 12) + ' L276 ' + (top + 2) + ' L124 ' + (top + 2) + ' Z" ' +
        'fill="' + colorTapa + '" stroke="rgba(5,11,22,.3)" stroke-width="2"/>' +
      '<path d="M130 ' + (top - 10) + ' L270 ' + (top - 10) + '" stroke="rgba(255,255,255,.18)" stroke-width="2"/>' +
      (texto ? '<text x="200" y="' + yTexto + '" text-anchor="middle" font-family="' + fuente + '" font-size="' + fs + '" ' +
        'fill="' + tinta + '" opacity=".92">' + esc(texto) + '</text>' : '') +
      '</svg>';
  }

  function pintarPreview() {
    const texto = estadoSim.texto.trim();
    const tipografia = opcionElegida('tipografia');
    const fuente = tipografia && tipografia.id === 'clasica' ? FUENTES.clasica : FUENTES.moderna;
    let svg = '';

    if (estadoSim.producto === 'camisa') {
      const color = opcionElegida('color');
      svg = svgCamisa(color ? color.hex : '#f7f4ee', texto, fuente);
    } else if (estadoSim.producto === 'taza') {
      const color = opcionElegida('color');
      svg = svgTaza(color ? color.hex : '#f7f4ee', texto, fuente);
    } else if (estadoSim.producto === 'sudadera') {
      const color = opcionElegida('color');
      svg = svgSudadera(color ? color.hex : '#8e949e', texto, fuente);
    } else if (estadoSim.producto === 'tote') {
      const color = opcionElegida('color');
      const tamano = opcionElegida('tamano');
      const asa = opcionElegida('asa');
      svg = svgTote(color ? color.hex : '#e8dfc9', texto, fuente,
        !!tamano && tamano.id === 'grande', !!asa && asa.id === 'larga');
    } else if (estadoSim.producto === 'vaso') {
      const color = opcionElegida('color');
      const capacidad = opcionElegida('capacidad');
      const tapa = opcionElegida('tapa');
      svg = svgVaso(color ? color.hex : '#f7f4ee', texto, fuente,
        !!capacidad && capacidad.id === '20oz', tapa ? tapa.hex : '#232c3b');
    } else {
      const material = opcionElegida('material');
      const forma = opcionElegida('forma');
      svg = svgLlavero(material ? material.hex : '#eef2f6', forma ? forma.id : 'circulo', texto);
    }

    previewCanvas.innerHTML = svg;
    if (!prefiereMenosMovimiento) {
      previewCanvas.classList.remove('is-updating');
      // Reinicia la animación en el siguiente cuadro.
      requestAnimationFrame(function () { previewCanvas.classList.add('is-updating'); });
    }
  }

  function pintarResumen() {
    const cfg = SIM_PRODUCTOS[estadoSim.producto];
    $('#resProducto').textContent = cfg.nombre;

    const partes = cfg.grupos.map(function (grupo) {
      const op = opcionElegida(grupo.id);
      return op ? op.label : '—';
    });
    $('#resOpciones').textContent = partes.join(' · ');
    $('#resTexto').textContent = estadoSim.texto.trim() || 'Sin texto';
    $('#resPrecio').textContent = dinero(precioEstimado());
  }

  function actualizarSimulador() {
    pintarPreview();
    pintarResumen();
  }

  /** Validación básica del campo de texto del simulador. */
  function validarTexto(mostrarSiValido) {
    const cfg = SIM_PRODUCTOS[estadoSim.producto];
    const valor = simTexto.value;
    const recortado = valor.trim();
    let mensaje = '';

    if (recortado.length === 0) {
      mensaje = 'Escribe el texto que quieres en tu ' + cfg.nombre.toLowerCase() + '.';
    } else if (recortado.length < 2) {
      mensaje = 'El texto debe tener al menos 2 caracteres.';
    } else if (valor.length > cfg.maxTexto) {
      mensaje = 'Este producto admite máximo ' + cfg.maxTexto + ' caracteres. Borra ' +
        (valor.length - cfg.maxTexto) + ' para continuar.';
    }

    const hayError = mensaje !== '';
    simError.textContent = mensaje;
    simError.hidden = !hayError;
    simTexto.classList.toggle('has-error', hayError);
    simTexto.setAttribute('aria-invalid', String(hayError));
    if (mostrarSiValido && !hayError) simTexto.focus();
    return !hayError;
  }

  function actualizarContador() {
    const cfg = SIM_PRODUCTOS[estadoSim.producto];
    simContador.textContent = simTexto.value.length + ' / ' + cfg.maxTexto;
  }

  function cambiarProductoSim(tipo) {
    if (!SIM_PRODUCTOS[tipo]) return;
    estadoSim.producto = tipo;
    estadoSim.seleccion = {};

    // Se preselecciona la primera opción de cada grupo disponible.
    SIM_PRODUCTOS[tipo].grupos.forEach(function (grupo) {
      estadoSim.seleccion[grupo.id] = grupo.opciones[0].id;
    });

    $$('.sim-product', simProductos).forEach(function (btn) {
      const activo = btn.dataset.tipo === tipo;
      btn.classList.toggle('is-active', activo);
      btn.setAttribute('aria-checked', String(activo));
    });

    pintarOpciones();

    // Si el texto ya no cabe en el nuevo producto, se recorta al máximo útil.
    if (simTexto.value.length > SIM_PRODUCTOS[tipo].maxTexto) {
      simTexto.value = simTexto.value.slice(0, SIM_PRODUCTOS[tipo].maxTexto);
    }
    estadoSim.texto = simTexto.value;
    actualizarContador();
    validarTexto(false);
    actualizarSimulador();
  }

  function iniciarSimulador() {
    if (!simProductos) return;

    simProductos.addEventListener('click', function (e) {
      const btn = e.target.closest('[data-tipo]');
      if (btn) cambiarProductoSim(btn.dataset.tipo);
    });

    simOpciones.addEventListener('click', function (e) {
      const btn = e.target.closest('[data-op]');
      if (!btn) return;
      estadoSim.seleccion[btn.dataset.grupo] = btn.dataset.op;

      $$('[data-grupo="' + btn.dataset.grupo + '"]', simOpciones).forEach(function (o) {
        const activo = o === btn;
        o.classList.toggle('is-active', activo);
        o.setAttribute('aria-pressed', String(activo));
      });
      actualizarSimulador();
    });

    simTexto.addEventListener('input', function () {
      estadoSim.texto = simTexto.value;
      actualizarContador();
      if (!simError.hidden) validarTexto(false);
      actualizarSimulador();
    });

    simTexto.addEventListener('blur', function () { validarTexto(false); });

    $('#btnGuardarDiseno').addEventListener('click', function () {
      if (!validarTexto(true)) {
        mostrarToast('Revisa el texto del diseño para poder guardarlo', true);
        return;
      }
      const cfg = SIM_PRODUCTOS[estadoSim.producto];
      mostrarToast('Diseño guardado en esta sesión (demostración): ' + cfg.nombre + ' · ' + estadoSim.texto.trim());
      if (!prefiereMenosMovimiento) {
        previewCanvas.classList.remove('is-updating');
        requestAnimationFrame(function () { previewCanvas.classList.add('is-updating'); });
      }
    });

    $('#btnReiniciar').addEventListener('click', function () {
      simTexto.value = '';
      estadoSim.texto = '';
      cambiarProductoSim('camisa');
      simError.hidden = true;
      simTexto.classList.remove('has-error');
      simTexto.setAttribute('aria-invalid', 'false');
      mostrarToast('Simulador reiniciado');
    });

    pintarSelectorProductos();

    // Estado inicial tomado de la URL: ?producto=<tipo>&texto=<texto>
    const tipo = parametros.get('producto');
    cambiarProductoSim(SIM_PRODUCTOS[tipo] ? tipo : 'camisa');

    const texto = parametros.get('texto');
    if (texto) {
      const max = SIM_PRODUCTOS[estadoSim.producto].maxTexto;
      simTexto.value = texto.slice(0, max);
      estadoSim.texto = simTexto.value;
      actualizarContador();
      validarTexto(false);
      actualizarSimulador();
    }
  }


  /* ========================================================================
     09. PASOS "CÓMO FUNCIONA"  (como-funciona.html)
     ======================================================================== */

  function iniciarPasos() {
    const listaPasos = $('#listaPasos');
    if (!listaPasos) return;

    listaPasos.addEventListener('click', function (e) {
      const btn = e.target.closest('.paso-btn');
      if (!btn) return;
      const yaActivo = btn.parentElement.classList.contains('is-active');

      $$('.paso', listaPasos).forEach(function (li) {
        li.classList.remove('is-active');
        $('.paso-btn', li).setAttribute('aria-expanded', 'false');
      });

      if (!yaActivo) {
        btn.parentElement.classList.add('is-active');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  }


  /* ========================================================================
     10. TARJETAS DE FUNCIONES DEL SISTEMA  (sistema.html)
     ======================================================================== */

  function iniciarFunciones() {
    $$('[data-feature] .feature-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        const abierto = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!abierto));
        const etiqueta = $('.feature-toggle', btn);
        if (etiqueta) etiqueta.childNodes[0].nodeValue = abierto ? 'Ver más' : 'Ver menos';
      });
    });
  }


  /* ========================================================================
     11. MOCKUP DE LA INTERFAZ ADMINISTRATIVA  (sistema.html)
     ======================================================================== */

  const tabsSistema = $('#tabsSistema');
  const imgSistema = $('#pantallaSistema');
  const descSistema = $('#systemDesc');

  function pintarPantalla(id) {
    const pantalla = PANTALLAS.find(function (p) { return p.id === id; });
    if (!pantalla) return;

    imgSistema.classList.add('is-loading');
    // La imagen se cambia al cargar la nueva, evitando un parpadeo en blanco.
    const temporal = new Image();
    temporal.onload = temporal.onerror = function () {
      imgSistema.src = pantalla.imagen;
      imgSistema.alt = 'Captura de la interfaz administrativa de GZ Studio: ' + pantalla.titulo;
      imgSistema.classList.remove('is-loading');
    };
    temporal.src = pantalla.imagen;

    descSistema.textContent = pantalla.descripcion;
    // Reinicia la animación del texto descriptivo.
    descSistema.style.animation = 'none';
    requestAnimationFrame(function () { descSistema.style.animation = ''; });

    $$('.sys-tab', tabsSistema).forEach(function (tab) {
      const activo = tab.dataset.pantalla === id;
      tab.classList.toggle('is-active', activo);
      tab.setAttribute('aria-selected', String(activo));
    });
  }

  function iniciarSistema() {
    if (!tabsSistema || !imgSistema) return;

    tabsSistema.addEventListener('click', function (e) {
      const tab = e.target.closest('[data-pantalla]');
      if (tab) pintarPantalla(tab.dataset.pantalla);
    });

    // Navegación con flechas del teclado entre las pestañas del sistema.
    tabsSistema.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
      const tabs = $$('.sys-tab', tabsSistema);
      const actual = tabs.indexOf(document.activeElement);
      if (actual === -1) return;
      e.preventDefault();
      const siguiente = e.key === 'ArrowRight'
        ? (actual + 1) % tabs.length
        : (actual - 1 + tabs.length) % tabs.length;
      tabs[siguiente].focus();
      tabs[siguiente].click();
    });

    pintarPantalla('inicio');
  }


  /* ========================================================================
     12. ANIMACIONES DE APARICIÓN, BOTÓN "SUBIR" Y AVISO (TOAST)
     ======================================================================== */

  const toast = $('#toast');
  let temporizadorToast = null;

  function mostrarToast(mensaje, esError) {
    if (!toast) return;
    toast.innerHTML = '<i class="fa-solid ' + (esError ? 'fa-triangle-exclamation' : 'fa-circle-check') +
      '" aria-hidden="true"></i><span>' + esc(mensaje) + '</span>';
    toast.hidden = false;
    requestAnimationFrame(function () { toast.classList.add('is-visible'); });

    clearTimeout(temporizadorToast);
    temporizadorToast = setTimeout(function () {
      toast.classList.remove('is-visible');
      setTimeout(function () {
        toast.hidden = true;
        toast.innerHTML = '';
      }, 340);
    }, 3200);
  }

  function iniciarReveal() {
    const objetivos = $$('.reveal');
    if (!('IntersectionObserver' in window)) {
      objetivos.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }
    const observador = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (entrada) {
        if (!entrada.isIntersecting) return;
        entrada.target.classList.add('is-visible');
        observador.unobserve(entrada.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    objetivos.forEach(function (el, i) {
      // Pequeño desfase para que los elementos hermanos entren en cascada.
      el.style.transitionDelay = ((i % 4) * 70) + 'ms';
      observador.observe(el);
    });
  }


  /* ========================================================================
     13. ARRANQUE
     Cada función comprueba si su bloque existe en la página actual.
     ======================================================================== */

  function iniciar() {
    marcarEnlaceActivo();
    iniciarModales();
    iniciarCatalogo();
    iniciarDisenos();
    iniciarSimulador();
    iniciarPasos();
    iniciarFunciones();
    iniciarSistema();
    iniciarReveal();

    window.addEventListener('scroll', alHacerScroll, { passive: true });
    window.addEventListener('resize', function () {
      if (window.innerWidth > 980) abrirMenu(false);
    });

    alHacerScroll();
    revisarAviso();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciar);
  } else {
    iniciar();
  }
})();