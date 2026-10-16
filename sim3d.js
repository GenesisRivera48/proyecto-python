/* GZ Studio · Vista 3D del simulador.
   Los modelos necesitan un servidor local o alojamiento web.
*/

(function () {
  'use strict';

  var THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.128.0/';

  var LIBS = [
    'build/three.min.js',
    'examples/js/loaders/GLTFLoader.js',
    'examples/js/controls/OrbitControls.js'
  ];

  var SOPORTA = {
    camisa: 1,
    taza: 1,
    llavero: 1,
    sudadera: 1,
    tote: 1,
    vaso: 1
  };

  /* ZONAS DE ESTAMPADO */

  var CAMISA_AREA = {
    cx: 0.235,
    cy: 0.64,
    w: 0.25,
    h: 0.30
  };

  var SUDADERA_AREA = {
    cx: 0,
    cy: 1290,
    w: 170,
    h: 150
  };

  var SUDADERA_UV = {
    su: 7.71e-4,
    ou: 0.188269,
    sv: 5.79e-4,
    ov: -0.040185
  };

  var TOTE_AREA = {
    cx: 0,
    cy: 2.0,
    w: 2.3,
    h: 2.5
  };

  var TOTE_UV = {
    su: 0.256,
    ou: 0.504,
    sv: 0.2179,
    ov: 0.0271
  };

  var TOTE_COSTURA = 'tono';

  var TAZA = {
    R: 0.0598,
    yc: 0.068,
    alto: 0.075,
    arco: 1.75,
    sobre: 0.0004
  };

  var VASO = {
    cx: 1672.41,
    cz: -50.13,
    R: 2.203,
    yc: 4.9,
    alto: 5.4,
    arco: 1.9
  };

  /* ESTADO */

  var estado = null;
  var listo = false;
  var falloLibs = false;
  var fallos = {};

  var stage;
  var cont;
  var renderer;
  var scene;
  var camera;
  var controls;
  var pivot;

  var tokenCarga = 0;
  var imgs = {};
  var modelos = {};
  var actual = null;

  function $(s) {
    return document.querySelector(s);
  }

  /* CARGA DE LIBRERÍAS */

  var BASES = [
    'assets/vendor/three/',
    THREE_URL,
    'https://unpkg.com/three@0.128.0/'
  ];

  function cargarLib(lib, cb) {
    var b = 0;

    (function probar() {
      if (b >= BASES.length) {
        return cb(false);
      }

      var s = document.createElement('script');
      s.src = BASES[b++] + lib;

      s.onload = function () {
        cb(true);
      };

      s.onerror = function () {
        s.remove();
        probar();
      };

      document.head.appendChild(s);
    })();
  }

  function cargarLibs(cb) {
    var i = 0;

    (function sig() {
      if (i >= LIBS.length) {
        return cb(true);
      }

      cargarLib(LIBS[i++], function (ok) {
        if (ok) {
          sig();
        } else {
          cb(false);
        }
      });
    })();
  }

  function avisarSin3D(texto) {
    var canvas = $('#previewCanvas');

    if (!canvas || $('#aviso3d-libs')) {
      return;
    }

    var p = document.createElement('p');
    p.id = 'aviso3d-libs';

    p.style.cssText =
      'margin:10px 4px 0;' +
      'font-size:.82rem;' +
      'color:#c9a227;' +
      'text-align:center';

    p.textContent = texto;
    canvas.after(p);
  }

  /* IMÁGENES Y COLOR */

  function imagen(src) {
    if (!imgs[src]) {
      imgs[src] = new Promise(function (ok, no) {
        var im = new Image();

        im.onload = function () {
          ok(im);
        };

        im.onerror = no;
        im.src = src;
      });
    }

    return imgs[src];
  }

  function tinta(hex) {
    var n = parseInt(hex.replace('#', ''), 16);
    var r = n >> 16;
    var g = (n >> 8) & 255;
    var b = n & 255;

    return (0.299 * r + 0.587 * g + 0.114 * b) > 150
      ? '#14181f'
      : '#fbf8f0';
  }

  /*
   * Dibuja la imagen y el texto.
   * El texto es opcional.
   * Las frases largas se distribuyen en líneas y se ajustan
   * al espacio disponible sin recortar caracteres.
   */
  function dibujarEstampa(ctx, x, y, w, h, e, img) {
    var ink = tinta(e.hex);
    var txt = e.texto;

    if (img) {
      var maxW = w;
      var maxH = h * (txt ? 0.72 : 0.95);

      var iw = img.naturalWidth || img.width || 1;
      var ih = img.naturalHeight || img.height || 1;

      var k = Math.min(maxW / iw, maxH / ih);
      var dw = iw * k;
      var dh = ih * k;

      var top = txt
        ? y + h * 0.02 + (maxH - dh) / 2
        : y + (h - dh) / 2;

      ctx.drawImage(
        img,
        x + (w - dw) / 2,
        top,
        dw,
        dh
      );
    }

    if (txt) {
      var ancho = w * 0.94;
      var alto = h * (img ? 0.24 : 0.9);
      var centroY = y + (img ? h * 0.86 : h / 2);
      var t = h * (img ? 0.16 : 0.3);
      var lineas;

      function distribuir() {
        ctx.font = t + 'px ' + e.fuente;

        var resultado = [];
        var linea = '';

        Array.from(txt).forEach(function (letra) {
          if (letra === '\n') {
            resultado.push(linea);
            linea = '';
            return;
          }

          if (
            linea &&
            ctx.measureText(linea + letra).width > ancho
          ) {
            resultado.push(linea);
            linea = letra;
          } else {
            linea += letra;
          }
        });

        resultado.push(linea);
        return resultado;
      }

      lineas = distribuir();

      while (lineas.length * t * 1.2 > alto) {
        t *= 0.85;
        lineas = distribuir();
      }

      ctx.fillStyle = ink;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      lineas.forEach(function (linea, i) {
        var posicionY =
          centroY +
          (i - (lineas.length - 1) / 2) * t * 1.2;

        ctx.fillText(
          linea,
          x + w / 2,
          posicionY,
          ancho
        );
      });
    }
  }

  function texturaCanvas(c, flipY) {
    var t = new THREE.CanvasTexture(c);

    t.flipY = !!flipY;
    t.encoding = THREE.sRGBEncoding;
    t.anisotropy = renderer.capabilities.getMaxAnisotropy();

    return t;
  }

  /* INICIALIZACIÓN 3D */

  function init3D() {
    stage = $('.preview-stage');

    if (!stage) {
      return;
    }

    if (getComputedStyle(stage).position === 'static') {
      stage.style.position = 'relative';
    }

    cont = document.createElement('div');
    cont.id = 'preview3d';
    cont.className = 'preview-canvas';

    cont.style.cssText =
      'width:100%;' +
      'aspect-ratio:1/1;' +
      'max-height:520px;' +
      'display:none;' +
      'cursor:grab;';

    $('#previewCanvas').after(cont);

    var av = document.createElement('p');
    av.id = 'aviso3d';
    av.hidden = false;

    av.style.cssText =
      'display:none;' +
      'margin:10px 4px 0;' +
      'font-size:.82rem;' +
      'color:#c9a227;' +
      'text-align:center';

    stage.appendChild(av);

    renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });

    renderer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, 2)
    );

    renderer.outputEncoding = THREE.sRGBEncoding;
    cont.appendChild(renderer.domElement);

    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(
      32,
      1,
      0.1,
      100
    );

    camera.position.set(0, 0.2, 6.2);

    scene.add(
      new THREE.HemisphereLight(
        0xffffff,
        0x8a8478,
        0.95
      )
    );

    var d1 = new THREE.DirectionalLight(
      0xffffff,
      0.85
    );

    d1.position.set(3, 4, 5);
    scene.add(d1);

    var d2 = new THREE.DirectionalLight(
      0xfff1d6,
      0.35
    );

    d2.position.set(-4, 1, -3);
    scene.add(d2);

    pivot = new THREE.Group();
    scene.add(pivot);

    controls = new THREE.OrbitControls(
      camera,
      renderer.domElement
    );

    controls.enablePan = false;
    controls.enableDamping = true;
    controls.minDistance = 3;
    controls.maxDistance = 10;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 1.2;

    renderer.domElement.addEventListener(
      'pointerdown',
      function () {
        controls.autoRotate = false;
      }
    );

    new ResizeObserver(ajustar).observe(cont);

    ajustar();

    (function loop() {
      requestAnimationFrame(loop);

      if (cont.style.display !== 'none') {
        controls.update();
        renderer.render(scene, camera);
      }
    })();

    listo = true;
  }

  function ajustar() {
    if (!renderer) {
      return;
    }

    var w = cont.clientWidth || 400;
    var h = cont.clientHeight || 400;

    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }

  function refrescarVista() {
    var hay =
      listo &&
      estado &&
      SOPORTA[estado.producto];

    var av = $('#aviso3d');

    if (av) {
      av.style.display =
        hay && fallos[estado.producto]
          ? 'block'
          : 'none';
    }

    var ver3d = hay && !fallos[estado.producto];

    cont.style.display = ver3d ? 'block' : 'none';
    $('#previewCanvas').style.display = ver3d ? 'none' : '';

    if (ver3d) {
      ajustar();
    }
  }

  function limpiar() {
    while (pivot.children.length) {
      pivot.remove(pivot.children[0]);
    }

    pivot.rotation.set(0, 0, 0);
    actual = null;
  }

  function encuadrar(obj, altoDeseado) {
    obj.updateMatrixWorld(true);

    var box = new THREE.Box3().setFromObject(obj);
    var size = box.getSize(new THREE.Vector3());
    var c = box.getCenter(new THREE.Vector3());

    if (!isFinite(size.y) || size.y <= 0) {
      console.warn(
        'GZ3D: el modelo no tiene medidas válidas',
        size
      );
    }

    var k = altoDeseado / Math.max(size.y, 0.0001);

    obj.scale.multiplyScalar(k);
    obj.position.sub(c.multiplyScalar(k));
  }

  /* CARGA DE MODELOS */

  function motivo(err) {
    if (location.protocol === 'file:') {
      return 'Abriste la página con file:///. Ábrela con un servidor local: http://localhost:8000/personalizar.html';
    }

    var u =
      err &&
      err.target &&
      err.target.responseURL;

    if (
      err &&
      err.target &&
      err.target.status === 404
    ) {
      return 'No se encontró ' +
        (u || 'el archivo del modelo') +
        '. Revisa que la carpeta assets/models esté en el proyecto.';
    }

    return 'No se pudo leer el modelo' +
      (u ? ' (' + u + ')' : '') +
      '. Revisa la pestaña Red (F12).';
  }

  function cargarGLTF(url) {
    if (!modelos[url]) {
      modelos[url] = new Promise(function (ok, no) {
        new THREE.GLTFLoader().load(
          url,
          ok,
          undefined,
          no
        );
      });
    }

    return modelos[url];
  }

  /* CAMISA */

  function montarCamisa(token) {
    return Promise.all([
      cargarGLTF('assets/models/camisa/scene.gltf'),
      imagen('assets/models/camisa/textures/Main_baseColor.png')
    ]).then(function (r) {
      if (token !== tokenCarga) {
        return;
      }

      var modelo = r[0].scene.clone(true);
      var base = r[1];

      var c = document.createElement('canvas');
      c.width = c.height = 1024;

      var tex = texturaCanvas(c, false);

      modelo.traverse(function (o) {
        if (o.isMesh) {
          o.material = o.material.clone();
          o.material.map = tex;
          o.material.needsUpdate = true;
        }
      });

      encuadrar(modelo, 3.2);
      pivot.add(modelo);

      actual = {
        tipo: 'camisa',
        c: c,
        tex: tex,
        base: base
      };
    });
  }

  function pintarCamisa(e, img) {
    var c = actual.c;
    var ctx = c.getContext('2d');
    var A = CAMISA_AREA;

    ctx.globalCompositeOperation = 'source-over';
    ctx.drawImage(actual.base, 0, 0, 1024, 1024);

    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = e.hex;
    ctx.fillRect(0, 0, 1024, 1024);

    ctx.globalCompositeOperation = 'source-over';

    dibujarEstampa(
      ctx,
      (A.cx - A.w / 2) * 1024,
      (A.cy - A.h / 2) * 1024,
      A.w * 1024,
      A.h * 1024,
      e,
      img
    );

    actual.tex.needsUpdate = true;
  }

  /* TAZA */

  function montarTaza(token) {
    return cargarGLTF(
      'assets/models/taza/scene.gltf'
    ).then(function (r) {
      if (token !== tokenCarga) {
        return;
      }

      var modelo = r.scene.clone(true);
      var ceramica = null;

      modelo.traverse(function (o) {
        if (o.isMesh) {
          o.material = ceramica = o.material.clone();
        }
      });

      var T = TAZA;

      var geo = new THREE.CylinderGeometry(
        T.R + T.sobre,
        T.R + T.sobre,
        T.alto,
        64,
        1,
        true,
        -T.arco / 2,
        T.arco
      );

      geo.translate(0, T.yc, 0);

      var c = document.createElement('canvas');
      c.width = 1024;

      c.height = Math.round(
        1024 * T.alto / (T.R * T.arco)
      );

      var tex = texturaCanvas(c, true);

      var decal = new THREE.Mesh(
        geo,
        new THREE.MeshBasicMaterial({
          map: tex,
          transparent: true,
          depthWrite: false,
          polygonOffset: true,
          polygonOffsetFactor: -2
        })
      );

      var g = new THREE.Group();
      g.add(modelo, decal);

      encuadrar(g, 2.7);
      pivot.add(g);

      actual = {
        tipo: 'taza',
        c: c,
        tex: tex,
        ceramica: ceramica
      };
    });
  }

  function pintarTaza(e, img) {
    var c = actual.c;
    var ctx = c.getContext('2d');

    ctx.clearRect(0, 0, c.width, c.height);

    dibujarEstampa(
      ctx,
      c.width * 0.12,
      c.height * 0.1,
      c.width * 0.76,
      c.height * 0.8,
      e,
      img
    );

    actual.tex.needsUpdate = true;
    actual.ceramica.color.copy(colorLineal(e.hex));
  }

  /* LLAVERO */

  function formaPlaca(id) {
    var s = new THREE.Shape();

    if (id === 'circulo') {
      s.absarc(
        0,
        0,
        0.62,
        0,
        Math.PI * 2,
        false
      );
    } else if (id === 'corazon') {
      s.moveTo(0, -0.62);

      s.bezierCurveTo(
        -0.9,
        -0.05,
        -0.62,
        0.62,
        0,
        0.3
      );

      s.bezierCurveTo(
        0.62,
        0.62,
        0.9,
        -0.05,
        0,
        -0.62
      );
    } else {
      var w = 0.56;
      var r = 0.12;

      s.moveTo(-w + r, -w);
      s.lineTo(w - r, -w);

      s.quadraticCurveTo(
        w,
        -w,
        w,
        -w + r
      );

      s.lineTo(w, w - r);

      s.quadraticCurveTo(
        w,
        w,
        w - r,
        w
      );

      s.lineTo(-w + r, w);

      s.quadraticCurveTo(
        -w,
        w,
        -w,
        w - r
      );

      s.lineTo(-w, -w + r);

      s.quadraticCurveTo(
        -w,
        -w,
        -w + r,
        -w
      );
    }

    return s;
  }

  function montarLlavero() {
    var g = new THREE.Group();

    var geo = new THREE.ExtrudeGeometry(
      formaPlaca(estado.forma),
      {
        depth: 0.1,
        bevelEnabled: true,
        bevelThickness: 0.025,
        bevelSize: 0.025,
        bevelSegments: 3,
        curveSegments: 32
      }
    );

    geo.translate(0, 0, -0.05);

    var placa = new THREE.Mesh(
      geo,
      new THREE.MeshPhongMaterial({
        color: estado.hex,
        shininess: 90,
        specular: 0x666666
      })
    );

    var anillo = new THREE.Mesh(
      new THREE.TorusGeometry(
        0.2,
        0.032,
        16,
        40
      ),
      new THREE.MeshPhongMaterial({
        color: 0xc9ced6,
        shininess: 120,
        specular: 0x999999
      })
    );

    anillo.rotation.y = Math.PI / 2;
    anillo.position.set(0, 0.62 + 0.08, 0);

    var c = document.createElement('canvas');
    c.width = c.height = 512;

    var tex = texturaCanvas(c, true);

    var cara = new THREE.Mesh(
      new THREE.PlaneGeometry(0.95, 0.95),
      new THREE.MeshBasicMaterial({
        map: tex,
        transparent: true,
        depthWrite: false
      })
    );

    cara.position.z = 0.078;

    g.add(placa, anillo, cara);
    pivot.add(g);
    encuadrar(g, 3.0);

    actual = {
      tipo: 'llavero',
      c: c,
      tex: tex,
      placa: placa,
      forma: estado.forma
    };
  }

  function pintarLlavero(e, img) {
    var ctx = actual.c.getContext('2d');

    ctx.clearRect(0, 0, 512, 512);

    dibujarEstampa(
      ctx,
      56,
      56,
      400,
      400,
      e,
      img
    );

    actual.tex.needsUpdate = true;
    actual.placa.material.color.set(e.hex);
  }

  /* UTILIDADES DE COLOR Y TEXTURAS */

  function colorLineal(hex) {
    return new THREE.Color(hex).convertSRGBToLinear();
  }

  function estamparEnUV(ctx, N, M, A, e, img) {
    ctx.save();

    ctx.translate(
      (M.ou + M.su * A.cx) * N,
      (M.ov + M.sv * A.cy) * N
    );

    ctx.scale(
      M.su * N,
      -M.sv * N
    );

    dibujarEstampa(
      ctx,
      -A.w / 2,
      -A.h / 2,
      A.w,
      A.h,
      e,
      img
    );

    ctx.restore();
  }

  /* SUDADERA */

  var normalSudadera = null;

  function cargarNormalSudadera() {
    if (!normalSudadera) {
      normalSudadera = new Promise(function (ok, no) {
        new THREE.TextureLoader().load(
          'assets/models/sudadera/textures/normal_2048.png',
          function (t) {
            t.flipY = false;

            t.anisotropy =
              renderer.capabilities.getMaxAnisotropy();

            ok(t);
          },
          undefined,
          no
        );
      });
    }

    return normalSudadera;
  }

  function montarSudadera(token) {
    return Promise.all([
      cargarGLTF('assets/models/sudadera/scene.gltf'),
      cargarNormalSudadera()
    ]).then(function (r) {
      if (token !== tokenCarga) {
        return;
      }

      var modelo = r[0].scene.clone(true);

      var c = document.createElement('canvas');
      c.width = c.height = 2048;

      var tex = texturaCanvas(c, false);

      var mat = new THREE.MeshStandardMaterial({
        map: tex,
        normalMap: r[1],
        roughness: 0.9,
        metalness: 0,
        side: THREE.DoubleSide
      });

      modelo.traverse(function (o) {
        if (o.isMesh) {
          o.material = mat;
        }
      });

      encuadrar(modelo, 3.0);
      pivot.add(modelo);

      actual = {
        tipo: 'sudadera',
        c: c,
        tex: tex
      };
    });
  }

  function pintarSudadera(e, img) {
    var c = actual.c;
    var ctx = c.getContext('2d');

    ctx.fillStyle = e.hex;
    ctx.fillRect(0, 0, c.width, c.height);

    estamparEnUV(
      ctx,
      c.width,
      SUDADERA_UV,
      SUDADERA_AREA,
      e,
      img
    );

    actual.tex.needsUpdate = true;
  }

  /* TOTE BAG */

  function montarTote(token) {
    return cargarGLTF(
      'assets/models/tote/scene.gltf'
    ).then(function (r) {
      if (token !== tokenCarga) {
        return;
      }

      var modelo = r.scene.clone(true);

      var c = document.createElement('canvas');
      c.width = c.height = 1024;

      var tex = texturaCanvas(c, false);

      var tela = new THREE.MeshStandardMaterial({
        roughness: 1,
        metalness: 0,
        side: THREE.DoubleSide
      });

      var frente = new THREE.MeshStandardMaterial({
        map: tex,
        roughness: 1,
        metalness: 0,
        side: THREE.DoubleSide
      });

      var costura = new THREE.MeshStandardMaterial({
        roughness: 0.85,
        metalness: 0,
        side: THREE.DoubleSide
      });

      modelo.traverse(function (o) {
        if (!o.isMesh) {
          return;
        }

        var n = (o.material && o.material.name) || '';

        o.material = /Truoc/i.test(n)
          ? frente
          : /^Chi/i.test(n)
            ? costura
            : tela;
      });

      encuadrar(modelo, 3.3);
      pivot.add(modelo);

      actual = {
        tipo: 'tote',
        c: c,
        tex: tex,
        tela: tela,
        costura: costura
      };
    });
  }

  function pintarTote(e, img) {
    var c = actual.c;
    var ctx = c.getContext('2d');

    ctx.fillStyle = e.hex;
    ctx.fillRect(0, 0, c.width, c.height);

    estamparEnUV(
      ctx,
      c.width,
      TOTE_UV,
      TOTE_AREA,
      e,
      img
    );

    actual.tex.needsUpdate = true;
    actual.tela.color.copy(colorLineal(e.hex));

    actual.costura.color.copy(
      TOTE_COSTURA === 'tono'
        ? colorLineal(e.hex).lerp(
            colorLineal(tinta(e.hex)),
            0.22
          )
        : colorLineal(TOTE_COSTURA)
    );
  }

  /* VASO */

  function montarVaso(token) {
    return cargarGLTF(
      'assets/models/vaso/scene.gltf'
    ).then(function (r) {
      if (token !== tokenCarga) {
        return;
      }

      var modelo = r.scene.clone(true);

      var cuerpo = new THREE.MeshPhongMaterial({
        shininess: 80,
        specular: 0x555555
      });

      var tapa = new THREE.MeshPhongMaterial({
        shininess: 40,
        specular: 0x222222
      });

      modelo.traverse(function (o) {
        if (!o.isMesh) {
          return;
        }

        var n = (o.material && o.material.name) || '';

        o.material =
          /DarkGray/i.test(n) || o.name === 'Material3'
            ? tapa
            : cuerpo;
      });

      var V = VASO;

      var geo = new THREE.CylinderGeometry(
        V.R + 0.006,
        V.R + 0.006,
        V.alto,
        64,
        1,
        true,
        -V.arco / 2,
        V.arco
      );

      geo.translate(V.cx, V.yc, V.cz);

      var c = document.createElement('canvas');
      c.width = 1024;

      c.height = Math.round(
        1024 * V.alto / (V.R * V.arco)
      );

      var tex = texturaCanvas(c, true);

      var decal = new THREE.Mesh(
        geo,
        new THREE.MeshBasicMaterial({
          map: tex,
          transparent: true,
          depthWrite: false,
          polygonOffset: true,
          polygonOffsetFactor: -2
        })
      );

      var g = new THREE.Group();
      g.add(modelo, decal);

      encuadrar(g, 3.2);
      pivot.add(g);

      actual = {
        tipo: 'vaso',
        c: c,
        tex: tex,
        cuerpo: cuerpo,
        tapa: tapa
      };
    });
  }

  function pintarVaso(e, img) {
    var c = actual.c;
    var ctx = c.getContext('2d');

    ctx.clearRect(0, 0, c.width, c.height);

    dibujarEstampa(
      ctx,
      c.width * 0.12,
      c.height * 0.1,
      c.width * 0.76,
      c.height * 0.8,
      e,
      img
    );

    actual.tex.needsUpdate = true;

    actual.cuerpo.color.copy(
      colorLineal(e.hex)
    );

    actual.tapa.color.copy(
      colorLineal(e.tapa || '#232c3b')
    );
  }

  /* ACTUALIZACIÓN DEL MODELO */

  function aplicar(token) {
    if (token !== tokenCarga || !actual) {
      return;
    }

    var e = estado;

    var p = e.diseno
      ? imagen(e.diseno).catch(function () {
          return null;
        })
      : Promise.resolve(null);

    p.then(function (img) {
      if (token !== tokenCarga || !actual) {
        return;
      }

      var pintar = {
        camisa: pintarCamisa,
        taza: pintarTaza,
        llavero: pintarLlavero,
        sudadera: pintarSudadera,
        tote: pintarTote,
        vaso: pintarVaso
      }[actual.tipo];

      pintar(e, img);
    });
  }

  function actualizar(e) {
    estado = e;

    if (falloLibs) {
      return;
    }

    if (!SOPORTA[e.producto]) {
      if (listo) {
        refrescarVista();
      }

      return;
    }

    if (fallos[e.producto]) {
      if (listo) {
        refrescarVista();
      }

      return;
    }

    var token = ++tokenCarga;

    var rehacer =
      !actual ||
      actual.tipo !== e.producto ||
      (
        e.producto === 'llavero' &&
        actual.forma !== e.forma
      );

    var listoPara = function () {
      if (rehacer) {
        limpiar();
      }

      var montar = {
        camisa: montarCamisa,
        taza: montarTaza,
        llavero: montarLlavero,
        sudadera: montarSudadera,
        tote: montarTote,
        vaso: montarVaso
      }[e.producto];

      var m = !rehacer
        ? Promise.resolve()
        : Promise.resolve(montar(token));

      m.then(function () {
        aplicar(token);
        refrescarVista();
      }).catch(function (err) {
        console.warn(
          'GZ3D: no se pudo montar el modelo de ' + e.producto,
          err
        );

        fallos[e.producto] = true;

        $('#aviso3d').textContent =
          motivo(err) + ' Se muestra la vista 2D.';

        refrescarVista();
      });
    };

    if (listo) {
      return listoPara();
    }

    if (
      window.THREE &&
      window.THREE.OrbitControls &&
      window.THREE.GLTFLoader
    ) {
      init3D();
      return listoPara();
    }

    if (actualizar.cargando) {
      return;
    }

    actualizar.cargando = true;

    cargarLibs(function (ok) {
      if (!ok) {
        falloLibs = true;

        console.warn(
          'GZ3D: no se pudo cargar three.js; se mantiene la vista 2D.'
        );

        avisarSin3D(
          'No se pudo cargar la librería 3D (three.js). Revisa tu conexión a internet o instala la copia local en assets/vendor/three/. Se muestra la vista 2D.'
        );

        return;
      }

      try {
        init3D();
      } catch (err) {
        falloLibs = true;

        console.warn(
          'GZ3D: no se pudo iniciar WebGL.',
          err
        );

        avisarSin3D(
          'Tu navegador no pudo iniciar WebGL (gráficos 3D). Activa la aceleración por hardware o prueba con Chrome/Edge. Se muestra la vista 2D.'
        );

        return;
      }

      actualizar(estado);
    });
  }

  /* CAPTURA PARA MIS DISEÑOS */

  function capturar(ladoMax) {
    if (
      !listo ||
      !estado ||
      !cont ||
      cont.style.display === 'none'
    ) {
      return null;
    }

    try {
      var pos = camera.position.clone();

      camera.position.set(0, 0.2, 6.2);
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);

      var src = renderer.domElement;

      var k = Math.min(
        1,
        (ladoMax || 420) / Math.max(src.width, src.height)
      );

      var c = document.createElement('canvas');

      c.width = Math.max(
        1,
        Math.round(src.width * k)
      );

      c.height = Math.max(
        1,
        Math.round(src.height * k)
      );

      c.getContext('2d').drawImage(
        src,
        0,
        0,
        c.width,
        c.height
      );

      camera.position.copy(pos);
      camera.lookAt(0, 0, 0);

      return c.toDataURL('image/webp', 0.85);
    } catch (err) {
      return null;
    }
  }

  window.GZ3D = {
    actualizar: actualizar,
    capturar: capturar
  };
})();