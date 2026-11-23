/**
 * HEUSER — THE DRIVE: WORLD
 *
 * Builds the whole Las Vegas -> Reno road as one continuous 3D scene. Every
 * object is geometry written here (no downloaded models, no generated art) and
 * shaded like a banknote engraving: brightness is drawn as line thickness.
 *
 * Exposes window.RHWorld(THREE, opts) -> world. drive.js owns scroll, camera,
 * input and the page; this file only owns what exists and how it moves.
 *
 * Units are metres. The car travels toward -Z. `s` is distance along the road.
 */
(function () {
  'use strict';

  var TAU = Math.PI * 2;
  function clamp(x, a, b) { return x < a ? a : x > b ? b : x; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function sm(a, b, x) { x = clamp((x - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); }

  /* Deterministic random, so the skyline is the same skyline on every visit. */
  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hash2(x, y) {
    var n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
    return n - Math.floor(n);
  }
  function vnoise(x, y) {
    var xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    var u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    return lerp(lerp(hash2(xi, yi), hash2(xi + 1, yi), u), lerp(hash2(xi, yi + 1), hash2(xi + 1, yi + 1), u), v);
  }
  function fbm(x, y) { return vnoise(x, y) * 0.55 + vnoise(x * 2.1 + 7, y * 2.1) * 0.3 + vnoise(x * 4.3, y * 4.3 + 3) * 0.15; }
  function ridged(x, y) {
    var a = 1 - Math.abs(2 * vnoise(x, y) - 1), b = 1 - Math.abs(2 * vnoise(x * 2.2 + 5, y * 2.2) - 1);
    return a * a * 0.7 + b * b * 0.3;
  }

  /* ------------------------------------------------------------------ road */
  var L = 2420;
  function curveAmp(s) { return sm(150, 430, s) * (1 - sm(1940, 2120, s)); }
  function roadX(s) { return curveAmp(s) * (22 * Math.sin(s / 190) + 8 * Math.sin(s / 77 + 1)); }
  function roadY(s) {
    return sm(320, 700, s) * 3.6 * Math.sin(s / 150) * (1 - sm(1700, 1860, s)) +
      24 * sm(1380, 1640, s) - 12 * sm(1660, 1840, s);
  }
  /** Orthonormal-ish frame at distance s. */
  function frame(s) {
    var e = 0.6, dx = (roadX(s + e) - roadX(s - e)) / (2 * e), dy = (roadY(s + e) - roadY(s - e)) / (2 * e);
    var l = Math.sqrt(dx * dx + 1);
    return {
      x: roadX(s), y: roadY(s), z: -s,
      rx: 1 / l, rz: dx / l,           // right vector (horizontal)
      fx: dx / l, fz: -1 / l,          // forward vector (horizontal)
      yaw: -Math.atan(dx), pitch: Math.atan(dy)
    };
  }
  /** Road-relative (right, up, back) -> world. */
  function toWorld(s, r, u, b, out) {
    var f = frame(s);
    out.x = f.x + f.rx * r - f.fx * b;
    out.y = f.y + u;
    out.z = f.z + f.rz * r - f.fz * b;
    return out;
  }
  function band(s, a, b, f) { return sm(a - f, a, s) * (1 - sm(b, b + f, s)); }
  function flatW(s) {
    return 16 + 40 * (1 - sm(260, 420, s)) + 26 * band(s, 440, 660, 60) + 26 * band(s, 1840, 1960, 60) + 46 * sm(1980, 2080, s);
  }
  function terrainY(x, s) {
    var d = Math.abs(x), f = flatW(s);
    var amp1 = 3 + 8 * band(s, 700, 1380, 120) + 16 * band(s, 1420, 1700, 120);
    var amp2 = 24 + 24 * band(s, 620, 1400, 200) + 52 * band(s, 1420, 1760, 160) + 26 * sm(1950, 2150, s);
    var y = roadY(s) - 0.12 - 0.3 * sm(4.8, 8, d);
    y += sm(f, f + 46, d) * (fbm(x / 46, s / 46) - 0.22) * amp1;
    y += sm(f + 30, f + 190, d) * ridged(x / 120, s / 120) * amp2;
    return y;
  }

  window.RHWorld = function (T, opt) {
    opt = opt || {};
    var lite = !!opt.lite;              // phones and small GPUs
    var scene = new T.Scene();
    var V = function (x, y, z) { return new T.Vector3(x, y, z); };

    var C = {
      ink: 0x060B17, brass: 0xC9A227, lite: 0xF2DBA0, ivory: 0xF7F5EF,
      steel: 0x9AA3AE, red: 0xC8141E, purple: 0x6A3FA0, gold: 0xD9A833
    };

    /* ---------------------------------------------------------- uniforms */
    var U = {
      uTime: { value: 0 }, uBeat: { value: 0 }, uWave: { value: 0 },
      uFog: { value: new T.Color(0x0A1020) }, uFogD: { value: 0.0042 },
      uMoon: { value: V(-0.45, 0.72, 0.4).normalize() },
      uHead: { value: V(0, 0.7, -2.3) }, uHeadDir: { value: V(0, -0.06, -1) }, uHeadOn: { value: 0 },
      uTail: { value: V(0, 0.8, 2.3) }, uTailOn: { value: 0.6 },
      uCar: { value: V(0, 0, 0) },
      uAccent: { value: new T.Color(C.brass) },
      uDpr: { value: 1 }, uPx: { value: 0.12 }
    };

    /* --------------------------------------------------- engraving shader */
    var ENG_VS = [
      'uniform vec3 uDir; uniform float uFreq,uTime,uWave; uniform vec3 uCar;',
      'varying vec3 vW,vN,vC,vI; varying float vH;',
      '#ifdef HATCH_ATTR', 'attribute float aH;', '#endif',
      '#ifdef VCOL', 'attribute vec3 aCol;', '#endif',
      'void main(){',
      '  vec4 p=vec4(position,1.0); vec3 n=normal;',
      '#ifdef USE_INSTANCING',
      '  p=instanceMatrix*p; n=mat3(instanceMatrix)*n;',
      '#endif',
      '#ifdef USE_INSTANCING_COLOR', '  vI=instanceColor;', '#else', '  vI=vec3(1.0);', '#endif',
      '  vec4 w=modelMatrix*p; vN=normalize(mat3(modelMatrix)*n);',
      '#ifdef HATCH_ATTR', '  vH=aH*uFreq;',
      '#else',
      '#ifdef HATCH_OBJ', '  vH=dot(position,uDir)*uFreq;', '#else', '  vH=dot(w.xyz,uDir)*uFreq;', '#endif',
      '#endif',
      '#ifdef VCOL', '  vC=aCol;', '#else', '  vC=vec3(1.0);', '#endif',
      '  float r=distance(w.xz,uCar.xz);',
      '  w.y+=uWave*sin(r*0.85-uTime*10.0)*exp(-r*0.055)*smoothstep(3.0,7.0,r);',
      '  vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w;',
      '}'].join('\n');

    var LIGHT = [
      'uniform vec3 uMoon,uHead,uHeadDir,uTail,uFog,uAccent; uniform float uHeadOn,uTailOn,uFogD,uTime,uBeat,uPx;',
      // Engraved line at tone th. Picks its own density so lines stay the same
      // width on screen at any distance, and split the way a burin would.
      'float hatch(float h,float th,float dens,float jit){ float w=max(fwidth(h),1e-6); float lod=log2(uPx*dens/w); float fl=floor(lod),f=lod-fl; float sc=exp2(fl)*2.0;',
      '  float k=h*sc+jit; float aa=clamp(w*sc*0.8,0.02,0.5); float de=abs(k-2.0*floor(k*0.5+0.5)); float dd=1.0-de;',
      '  float he=th*(1.0-f*0.5), ho=0.5*th*f; return clamp(max(1.0-smoothstep(he-aa,he+aa,de),(1.0-smoothstep(ho-aa,ho+aa,dd))*step(0.001,ho)),0.0,1.0); }',
      'float spot(vec3 P,vec3 N){ vec3 d=P-uHead; float l=length(d); d/=max(l,0.01); float c=dot(d,uHeadDir);',
      '  return smoothstep(0.86,0.985,c)*max(dot(N,-d),0.16)*uHeadOn*(1.0/(1.0+l*l*0.0009)); }',
      'float tail(vec3 P){ float l=distance(P,uTail); return uTailOn/(1.0+l*l*0.5); }',
      'vec3 fogged(vec3 c,vec3 P){ float d=distance(P,cameraPosition); float f=1.0-exp(-pow(d*uFogD,1.5)); return mix(c,uFog,clamp(f,0.0,1.0)); }'
    ].join('\n');

    var ENG_FS = [
      'uniform vec3 uInk,uBg; uniform float uSolid,uEmis,uAmb,uRim,uSpec,uDens,uTailK;',
      'varying vec3 vW,vN,vC,vI; varying float vH;',
      LIGHT,
      'void main(){',
      '  vec3 N=normalize(vN); if(!gl_FrontFacing) N=-N;',
      '  vec3 E=normalize(cameraPosition-vW);',
      '  float dif=max(dot(N,uMoon),0.0);',
      '  float sp=spot(vW,N);',
      '  float rim=pow(1.0-abs(dot(N,E)),3.0)*uRim;',
      '  float Lm=clamp(uAmb+dif*0.46+sp*1.5+rim*0.4+uEmis+max(dot(N,E),0.0)*0.06,0.0,1.15);',
      '  float boil=sin(vW.x*0.9+vW.z*0.7+floor(uTime*7.0)*1.9)*0.07;',
      '  float th=clamp(Lm*0.86+uBeat*0.05,0.03,0.97);',
      '  float line=hatch(vH,th,uDens,boil);',
      '  vec3 ink=uInk*vC*vI;',
      '  vec3 c=mix(uBg,ink*(0.5+0.62*Lm),line);',
      '  vec3 sc=ink*(0.1+0.95*Lm);',
      '  c=mix(c,sc,uSolid);',
      '  float s1=pow(max(dot(reflect(-E,N),uMoon),0.0),28.0)*uSpec;',
      '  c+=vec3(1.0,0.93,0.8)*s1+uAccent*rim*0.34*uRim;',
      '  c+=vec3(0.9,0.06,0.08)*tail(vW)*0.55*uTailK;',
      '  gl_FragColor=vec4(fogged(c,vW),1.0);',
      '}'].join('\n');

    /** Engraved material. */
    function eng(o) {
      o = o || {};
      var def = {};
      if (o.vcol) def.VCOL = 1;
      if (o.hatch === 'attr') def.HATCH_ATTR = 1;
      if (o.hatch === 'obj') def.HATCH_OBJ = 1;
      var u = {
        uInk: { value: new T.Color(o.ink === undefined ? C.brass : o.ink) },
        uBg: { value: new T.Color(o.bg === undefined ? C.ink : o.bg) },
        uDir: { value: o.dir || V(0, 1, 0) }, uFreq: { value: o.freq || 3 },
        uSolid: { value: o.solid || 0 }, uEmis: { value: o.emis || 0 },
        uAmb: { value: o.amb === undefined ? 0.14 : o.amb },
        uRim: { value: o.rim === undefined ? 0.6 : o.rim }, uSpec: { value: o.spec || 0 },
        uDens: { value: o.dens || 1 }, uTailK: { value: o.tailK === undefined ? 1 : o.tailK }
      };
      for (var k in U) u[k] = U[k];
      return new T.ShaderMaterial({ vertexShader: ENG_VS, fragmentShader: ENG_FS, uniforms: u, defines: def, side: o.side || T.DoubleSide });
    }

    /* ------------------------------------------------------------ helpers */
    var _m = new T.Matrix4(), _q = new T.Quaternion(), _e = new T.Euler(), _p = V(0, 0, 0), _s = V(1, 1, 1);
    function mat(x, y, z, rx, ry, rz, sx, sy, sz) {
      _e.set(rx || 0, ry || 0, rz || 0); _q.setFromEuler(_e);
      _p.set(x, y, z); _s.set(sx === undefined ? 1 : sx, sy === undefined ? (sx === undefined ? 1 : sx) : sy, sz === undefined ? (sx === undefined ? 1 : sx) : sz);
      return new T.Matrix4().compose(_p, _q, _s);
    }
    /** Collects geometry and merges it into one draw call with vertex colors. */
    function Bag() { this.g = []; }
    Bag.prototype.add = function (geo, m, col) {
      var g = geo.index ? geo.toNonIndexed() : geo.clone();
      if (m) g.applyMatrix4(m);
      var n = g.attributes.position.count, a = new Float32Array(n * 3), c = new T.Color(col === undefined ? 0xffffff : col);
      for (var i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; }
      var out = new T.BufferGeometry();
      out.setAttribute('position', g.attributes.position);
      out.setAttribute('normal', g.attributes.normal);
      out.setAttribute('aCol', new T.BufferAttribute(a, 3));
      this.g.push(out); return this;
    };
    Bag.prototype.geo = function () { return T.mergeGeometries(this.g, false); };
    Bag.prototype.mesh = function (material) { return new T.Mesh(this.geo(), material); };

    function edges(geo, color, op, ang) {
      return new T.LineSegments(new T.EdgesGeometry(geo, ang || 28),
        new T.LineBasicMaterial({ color: color, transparent: true, opacity: op }));
    }
    /** Put an object on the road frame: r metres right, u up. */
    function place(o, s, r, u, ry) {
      toWorld(s, r, u || 0, 0, o.position);
      o.rotation.y = frame(s).yaw + (ry || 0);
      return o;
    }
    function canvas(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
    function tex(c) { var t = new T.CanvasTexture(c); t.colorSpace = T.NoColorSpace; t.anisotropy = 4; return t; }

    var glowTex = (function () {
      var c = canvas(128, 128), x = c.getContext('2d'), g = x.createRadialGradient(64, 64, 0, 64, 64, 64);
      g.addColorStop(0, 'rgba(255,255,255,1)'); g.addColorStop(0.18, 'rgba(255,255,255,.55)');
      g.addColorStop(0.5, 'rgba(255,255,255,.13)'); g.addColorStop(1, 'rgba(255,255,255,0)');
      x.fillStyle = g; x.fillRect(0, 0, 128, 128); return tex(c);
    }());
    function glow(color, size, op) {
      var sp = new T.Sprite(new T.SpriteMaterial({ map: glowTex, color: color, transparent: true, opacity: op === undefined ? 0.8 : op, blending: T.AdditiveBlending, depthWrite: false }));
      sp.scale.set(size, size, 1); return sp;
    }
    /** Neon lettering on a transparent plane. lines: [{t, size, color, font}] */
    function neon(lines, w, h, o) {
      o = o || {};
      var k = o.px || 128, c = canvas(Math.round(w * k), Math.round(h * k)), x = c.getContext('2d');
      x.textAlign = 'center'; x.textBaseline = 'middle';
      if (o.frame) {
        x.strokeStyle = o.frame; x.lineWidth = k * 0.05; x.shadowColor = o.frame; x.shadowBlur = k * 0.22;
        for (var r = 0; r < 2; r++) x.strokeRect(k * 0.16, k * 0.16, c.width - k * 0.32, c.height - k * 0.32);
      }
      lines.forEach(function (ln) {
        x.font = (ln.w || '400') + ' ' + Math.round(ln.size * k) + 'px ' + (ln.font || '"Playfair Display",Didot,Georgia,serif');
        if ('letterSpacing' in x) x.letterSpacing = (ln.ls || 0) * k + 'px';
        var y = c.height / 2 + (ln.y || 0) * k;
        x.shadowColor = ln.color; x.fillStyle = ln.color; x.shadowBlur = k * 0.34; x.fillText(ln.t, c.width / 2, y, c.width * 0.9);
        x.shadowBlur = k * 0.12; x.fillText(ln.t, c.width / 2, y, c.width * 0.9);
        x.shadowBlur = 0; x.fillStyle = 'rgba(255,255,255,.72)'; x.fillText(ln.t, c.width / 2, y, c.width * 0.9);
      });
      var m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: tex(c), transparent: true, depthWrite: false, blending: o.solid ? T.NormalBlending : T.AdditiveBlending, side: T.DoubleSide }));
      return m;
    }
    var SANS = '"Inter",-apple-system,"Helvetica Neue",Arial,sans-serif';

    /* Groups that only exist near their stretch of road. */
    var zones = [];
    function zone(a, b) { var g = new T.Group(); scene.add(g); zones.push({ g: g, a: a, b: b }); return g; }
    var ticks = [];                       // fn(state)
    function tick(f) { ticks.push(f); }

    /* ================================================================ SKY */
    var skyU = {
      uZen: { value: new T.Color(0x050912) }, uHor: { value: new T.Color(0x1a1626) }, uGlow: { value: new T.Color(0x8a5a2a) },
      uGZ: { value: 1 }, uTime: U.uTime, uBeat: U.uBeat
    };
    var sky = new T.Mesh(new T.SphereGeometry(900, 40, 24), new T.ShaderMaterial({
      side: T.BackSide, depthWrite: false, uniforms: skyU,
      vertexShader: 'varying vec3 vD; void main(){ vD=position; vec4 p=projectionMatrix*mat4(mat3(viewMatrix))*vec4(position,1.0); gl_Position=p.xyww; }',
      fragmentShader: [
        'uniform vec3 uZen,uHor,uGlow; uniform float uGZ,uTime,uBeat; varying vec3 vD;',
        'void main(){ vec3 d=normalize(vD); float h=d.y;',
        '  float az=0.5+0.5*normalize(d.xz+1e-4).y*uGZ; az=0.35+0.65*az*az;',
        '  float g=exp(-max(h,0.0)*5.5)*az;',
        '  vec3 c=mix(uHor,uZen,smoothstep(0.0,0.42,h));',
        '  c+=uGlow*g*0.62;',
        '  float k=(h+sin(d.x*9.0+uTime*0.05)*0.004)*150.0; float w=fwidth(k);',
        '  float tri=abs(fract(k)-0.5)*2.0; float th=clamp(g*0.62+uBeat*0.04,0.0,0.8)*smoothstep(0.0,0.02,h);',
        '  float ln=smoothstep(1.0-th-w,1.0-th+w,tri); ln=mix(ln,th,smoothstep(0.4,1.0,w));',
        '  c+=uGlow*ln*0.34; gl_FragColor=vec4(c,1.0); }'].join('\n')
    }));
    sky.frustumCulled = false; sky.renderOrder = -10; scene.add(sky);

    /* stars */
    (function () {
      var N = lite ? 700 : 1500, p = new Float32Array(N * 3), r = new Float32Array(N), R = rng(11);
      for (var i = 0; i < N; i++) {
        var a = R() * TAU, y = Math.pow(R(), 0.7), q = Math.sqrt(1 - y * y);
        p[i * 3] = Math.cos(a) * q * 800; p[i * 3 + 1] = y * 800 + 20; p[i * 3 + 2] = Math.sin(a) * q * 800; r[i] = R();
      }
      var g = new T.BufferGeometry();
      g.setAttribute('position', new T.BufferAttribute(p, 3)); g.setAttribute('aR', new T.BufferAttribute(r, 1));
      var m = new T.ShaderMaterial({
        transparent: true, depthWrite: false, blending: T.AdditiveBlending,
        uniforms: { uTime: U.uTime, uDpr: U.uDpr, uBeat: U.uBeat },
        vertexShader: 'attribute float aR; uniform float uTime,uDpr,uBeat; varying float vA; void main(){ vec4 p=projectionMatrix*mat4(mat3(viewMatrix))*vec4(position,1.0); gl_Position=p.xyww; vA=(0.25+0.75*pow(0.5+0.5*sin(uTime*(0.6+aR*2.4)+aR*40.0),2.0))*(0.35+0.65*aR)+uBeat*0.25; gl_PointSize=(1.1+aR*1.7)*uDpr; }',
        fragmentShader: 'varying float vA; void main(){ vec2 d=gl_PointCoord-0.5; float a=smoothstep(0.25,0.0,dot(d,d)); gl_FragColor=vec4(vec3(1.0,0.95,0.84)*a*vA,1.0); }'
      });
      var pts = new T.Points(g, m); pts.frustumCulled = false; pts.renderOrder = -9; scene.add(pts);
    }());

    /* ============================================================ TERRAIN */
    (function () {
      var xs = [], K = lite ? 32 : 46, i, j, s;
      for (i = 0; i <= K; i++) { var t = (i / K) * 2 - 1; xs.push(Math.sign(t) * Math.pow(Math.abs(t), 1.75) * 300); }
      var step = lite ? 16 : 11, rows = Math.ceil((L + 900) / step), nx = xs.length;
      var pos = new Float32Array(rows * nx * 3), ah = new Float32Array(rows * nx), idx = [];
      for (i = 0; i < rows; i++) {
        s = -460 + i * step;
        for (j = 0; j < nx; j++) {
          var k = i * nx + j, y = terrainY(xs[j], s);
          pos[k * 3] = roadX(s) + xs[j]; pos[k * 3 + 1] = y; pos[k * 3 + 2] = -s;
          ah[k] = y * 1.35 + xs[j] * 0.42 + Math.sin(s / 34) * 0.5;
          if (i < rows - 1 && j < nx - 1) idx.push(k, k + 1, k + nx, k + 1, k + nx + 1, k + nx);
        }
      }
      var g = new T.BufferGeometry();
      g.setAttribute('position', new T.BufferAttribute(pos, 3)); g.setAttribute('aH', new T.BufferAttribute(ah, 1));
      g.setIndex(idx); g.computeVertexNormals();
      var m = new T.Mesh(g, eng({ hatch: 'attr', freq: 1, ink: 0xB08C2E, amb: 0.12, rim: 0.12 }));
      m.frustumCulled = false; scene.add(m);
    }());

    /* =============================================================== ROAD */
    (function () {
      var st = 5, n = Math.ceil((L + 700) / st), pos = [], lat = [], ss = [], idx = [], W = 4.75;
      for (var i = 0; i < n; i++) {
        var s = -420 + i * st, v = V(0, 0, 0);
        [-W, -W / 2, 0, W / 2, W].forEach(function (x) { toWorld(s, x, 0, 0, v); pos.push(v.x, v.y, v.z); lat.push(x); ss.push(s); });
        if (i < n - 1) for (var j = 0; j < 4; j++) { var k = i * 5 + j; idx.push(k, k + 1, k + 5, k + 1, k + 6, k + 5); }
      }
      var g = new T.BufferGeometry();
      g.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
      g.setAttribute('aLat', new T.Float32BufferAttribute(lat, 1)); g.setAttribute('aS', new T.Float32BufferAttribute(ss, 1));
      g.setIndex(idx);
      var u = {}; for (var q in U) u[q] = U[q];
      var m = new T.Mesh(g, new T.ShaderMaterial({
        uniforms: u, side: T.DoubleSide,
        vertexShader: 'attribute float aLat,aS; varying float vLat,vS; varying vec3 vW; uniform float uWave,uTime; uniform vec3 uCar; void main(){ vLat=aLat; vS=aS; vec4 w=modelMatrix*vec4(position,1.0); float r=distance(w.xz,uCar.xz); w.y+=uWave*sin(r*0.85-uTime*10.0)*exp(-r*0.055)*smoothstep(3.0,7.0,r); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }',
        fragmentShader: [
          'varying float vLat,vS; varying vec3 vW;', LIGHT,
          'float ln(float x,float w){ float e=fwidth(vLat)*1.2; return 1.0-smoothstep(w,w+e,abs(vLat-x)); }',
          'void main(){ vec3 N=vec3(0.0,1.0,0.0); float sp=spot(vW,N);',
          '  vec3 c=vec3(0.018,0.026,0.048);',
          '  float jit=sin(vS*0.6+floor(uTime*7.0))*0.05;',
          '  float th=clamp(0.05+sp*2.6+uBeat*0.05,0.0,0.94); float l=hatch(vLat,th,0.9,jit);',
          '  c=mix(c,vec3(0.62,0.5,0.26)*(0.35+sp*1.9),l*0.8);',
          '  float dash=step(fract(vS/12.0),0.34)*ln(0.0,0.085);',
          '  float edge=max(ln(4.25,0.06),ln(-4.25,0.06));',
          '  c=mix(c,mix(vec3(0.95,0.72,0.2),uAccent,0.55)*(0.42+sp*1.7),dash);',
          '  c=mix(c,vec3(0.86,0.84,0.78)*(0.2+sp*1.5),edge);',
          '  c+=vec3(0.95,0.05,0.08)*tail(vW)*0.8;',
          '  gl_FragColor=vec4(fogged(c,vW),1.0); }'].join('\n')
      }));
      m.frustumCulled = false; scene.add(m);
    }());

    /* ================================================================ CAR
       A carbon-grey compact crossover with black cladding, red interior and a
       subwoofer box in the back. Lofted from cross-sections, not downloaded. */
    var car = (function () {
      var root = new T.Group(), body = new T.Group(); root.add(body);

      function loft(st, cf) {
        var ni = st.length, nj = st[0].length, p = [], idx = [], i, j;
        for (i = 0; i < ni; i++) for (j = 0; j < nj; j++) p.push(st[i][j][0], st[i][j][1], st[i][j][2]);
        for (i = 0; i < ni - 1; i++) for (j = 0; j < nj - 1; j++) { var a = i * nj + j; idx.push(a, a + 1, a + nj, a + nj, a + 1, a + nj + 1); }
        var g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(p, 3)); g.setIndex(idx); g.computeVertexNormals();
        var nn = g.attributes.normal.array, out = { paint: [[], [], []], glass: [[], [], []] }, col = new T.Color();
        [1, -1].forEach(function (sd) {
          for (i = 0; i < ni - 1; i++) for (j = 0; j < nj - 1; j++) {
            var c = cf(i, j); if (c === null) continue;
            var tgt = c === 'glass' ? out.glass : out.paint; col.set(c === 'glass' ? 0xffffff : c);
            var A = i * nj + j, q = sd === 1 ? [A, A + 1, A + nj, A + nj, A + 1, A + nj + 1] : [A, A + nj, A + 1, A + nj, A + nj + 1, A + 1];
            q.forEach(function (v) {
              tgt[0].push(p[v * 3] * sd, p[v * 3 + 1], p[v * 3 + 2]);
              tgt[1].push(nn[v * 3] * sd, nn[v * 3 + 1], nn[v * 3 + 2]);
              tgt[2].push(col.r, col.g, col.b);
            });
          }
        });
        function mk(o) {
          var b = new T.BufferGeometry();
          b.setAttribute('position', new T.Float32BufferAttribute(o[0], 3)); b.setAttribute('normal', new T.Float32BufferAttribute(o[1], 3));
          b.setAttribute('aCol', new T.Float32BufferAttribute(o[2], 3)); return b;
        }
        return { paint: mk(out.paint), glass: out.glass[0].length ? mk(out.glass) : null };
      }

      var PAINT = 0x5C646E, CLAD = 0x1b1f25, DARK = 0x0A0C10;
      var paintMat = eng({ vcol: 1, hatch: 'obj', ink: 0xffffff, bg: 0x070A11, freq: 20, dir: V(0.12, 1, 0.05), solid: 0.74, amb: 0.26, rim: 1.0, spec: 0.75, dens: 1.5, tailK: 0.1 });
      var trimMat = eng({ vcol: 1, hatch: 'obj', ink: 0xffffff, bg: 0x040609, freq: 26, solid: 0.6, amb: 0.24, rim: 0.6, spec: 0.35, dens: 1.5, tailK: 0.12 });
      var redMat = eng({ vcol: 1, hatch: 'obj', ink: 0xffffff, bg: 0x22040a, freq: 22, dir: V(1, 0.3, 0), solid: 0.66, amb: 0.36, rim: 0.4, emis: 0.06, dens: 1.5, tailK: 0.1 });
      var glassMat = new T.MeshBasicMaterial({ color: 0x0b0408, transparent: true, opacity: 0.5, side: T.DoubleSide, depthWrite: false });

      /* lower body: [z, half-width, bottom, top] */
      var LB = [[-2.215, 0.001, 0.36, 0.71], [-2.2, 0.64, 0.36, 0.72], [-2.1, 0.8, 0.29, 0.83], [-1.85, 0.872, 0.25, 0.91], [-1.4, 0.898, 0.24, 0.975],
        [-0.96, 0.898, 0.24, 1.015], [-0.4, 0.896, 0.23, 1.015], [0.4, 0.896, 0.23, 1.03], [0.95, 0.9, 0.24, 1.055], [1.45, 0.9, 0.25, 1.085],
        [1.85, 0.882, 0.27, 1.1], [2.08, 0.846, 0.3, 1.08], [2.2, 0.8, 0.36, 1.0], [2.215, 0.001, 0.36, 1.0]];
      var st = LB.map(function (r) {
        var z = r[0], w = r[1], b = r[2], t = r[3], m = Math.max(b + 0.1, 0.46), sh = t - 0.13, md = m + (sh - m) * 0.45;
        return [[w * 0.88, b, z], [w, m, z], [w, md, z], [w * 0.985, sh, z], [w * 0.925, t, z], [w * 0.55, t + 0.04, z], [0, t + 0.052, z]];
      });
      var lower = loft(st, function (i, j) {
        if (j >= 4 && i >= 5) return null;                       // open above the beltline: cabin and cargo
        if (i >= 12 && j >= 2) return null;                      // open tail: the hatch covers it
        if (j === 0) return CLAD;
        return PAINT;
      });
      body.add(new T.Mesh(lower.paint, paintMat));
      body.add(edges(lower.paint, C.lite, 0.2, 24));

      /* greenhouse: [z, base half-width, belt y, roof half-width, roof y] */
      var GH = [[-0.98, 0.8, 1.02, 0.66, 1.035], [-0.6, 0.815, 1.02, 0.645, 1.245], [-0.2, 0.822, 1.02, 0.635, 1.44], [0.1, 0.826, 1.03, 0.63, 1.52],
        [0.45, 0.828, 1.035, 0.625, 1.552], [0.95, 0.826, 1.055, 0.612, 1.54], [1.35, 0.82, 1.08, 0.592, 1.492], [1.72, 0.806, 1.1, 0.565, 1.43], [2.0, 0.79, 1.1, 0.63, 1.165]];
      var gs = GH.map(function (r) {
        return [[r[1], r[2], r[0]], [r[3] + 0.03, r[4] - 0.06, r[0]], [r[3] * 0.9, r[4] - 0.012, r[0]], [r[3] * 0.5, r[4] + 0.014, r[0]], [0, r[4] + 0.02, r[0]]];
      });
      var gh = loft(gs, function (i, j) {
        if (j === 0) return i >= 6 ? PAINT : 'glass';
        if (i < 2) return j >= 1 ? 'glass' : PAINT;
        if (i >= 7) return null;
        return PAINT;
      });
      body.add(new T.Mesh(gh.paint, paintMat)); body.add(edges(gh.paint, C.lite, 0.24, 18));
      var gl = new T.Mesh(gh.glass, glassMat); gl.renderOrder = 3; body.add(gl);

      /* pillars, roof rails, cladding arches, floor, grille, details */
      var tb = new Bag(), box = new T.BoxGeometry(1, 1, 1);
      function bx(x, y, z, sx, sy, sz, c, rx, ry, rz) { tb.add(box, mat(x, y, z, rx, ry, rz, sx, sy, sz), c); }
      [1, -1].forEach(function (d) {
        bx(d * 0.735, 1.27, 0.42, 0.05, 0.5, 0.09, DARK, 0, 0, d * 0.36);                 // B pillar
        bx(d * 0.728, 1.235, -0.52, 0.04, 0.04, 1.0, DARK, -0.52, d * 0.1, 0);          // A pillar
        bx(d * 0.585, 1.548, 0.72, 0.03, 0.03, 1.3, DARK, 0.03, 0, 0);                      // roof rail
        bx(d * 0.9, 1.06, -0.62, 0.16, 0.11, 0.1, PAINT);                                  // mirror
        bx(d * 0.906, 0.84, 0.16, 0.016, 0.022, 0.16, 0xC7CDD4); bx(d * 0.906, 0.86, 1.0, 0.016, 0.022, 0.16, 0xC7CDD4); // handles
        bx(d * 0.84, 0.33, 0, 0.16, 0.16, 1.7, CLAD);                                      // rocker
        [-1.36, 1.3].forEach(function (wz) {
          tb.add(new T.CircleGeometry(0.455, 30), mat(d * 0.907, 0.36, wz, 0, d * Math.PI / 2, 0), DARK);
          tb.add(new T.RingGeometry(0.385, 0.505, 40, 1, -0.28, Math.PI + 0.56), mat(d * 0.915, 0.36, wz, 0, d * Math.PI / 2, 0), CLAD);
        });
        bx(d * 0.62, 0.46, -2.14, 0.3, 0.09, 0.12, DARK, 0, d * -0.5, 0);                  // lower vent
        tb.add(new T.CylinderGeometry(0.045, 0.045, 0.16, 14), mat(d * 0.52, 0.33, 2.2, Math.PI / 2, 0, 0), 0xB7BEC7); // exhaust
        bx(d * 0.18, 0.482, -2.226, 0.37, 0.018, 0.016, 0xC3CAD2, 0, 0, d * 0.11);          // grille wing
        bx(d * 0.435, 0.592, -2.222, 0.25, 0.018, 0.016, 0xC3CAD2, 0, 0, d * 0.85);
      });
      bx(0, 0.3, 0, 1.6, 0.06, 4.0, DARK);
      bx(0, 0.43, 0.5, 1.6, 0.03, 3.1, 0x2a0a0d);
      bx(0, 0.6, -2.212, 0.9, 0.22, 0.024, DARK); bx(0, 0.4, -2.2, 1.1, 0.1, 0.05, CLAD);
      for (var gi = 0; gi < 5; gi++) bx(0, 0.52 + gi * 0.04, -2.226, 0.6 + gi * 0.06, 0.007, 0.008, 0x4A525D);
      bx(0, 1.458, 1.74, 1.02, 0.03, 0.26, PAINT, 0.12);                                   // spoiler
      bx(0, 0.43, 2.2, 1.46, 0.28, 0.06, CLAD);                                            // rear bumper
      bx(0, 0.9, -0.72, 1.5, 0.2, 0.42, DARK);                                             // dash
      [1, -1].forEach(function (d) { bx(d * 0.735, 0.74, 1.72, 0.03, 0.62, 0.98, 0x14161b); bx(d * 0.745, 0.78, 2.14, 0.13, 0.5, 0.08, PAINT); });   // cargo walls, tail posts
      bx(0, 0.5, 1.8, 1.46, 0.04, 0.76, 0x1a1c21);                                          // load floor
      body.add(tb.mesh(trimMat));

      /* red interior */
      var rb = new Bag(), RED = 0xC9202B, RED2 = 0x8F141D;
      function rx(x, y, z, sx, sy, sz, c, r) { rb.add(box, mat(x, y, z, r || 0, 0, 0, sx, sy, sz), c); }
      [-0.37, 0.37].forEach(function (x) {
        rx(x, 0.62, -0.02, 0.5, 0.16, 0.5, RED); rx(x, 0.96, 0.27, 0.48, 0.62, 0.14, RED, 0.22); rx(x, 1.32, 0.36, 0.25, 0.15, 0.1, RED2, 0.2);
        rx(x, 0.96, 0.2, 0.28, 0.5, 0.03, RED2, 0.22);
      });
      rx(0, 0.62, 0.85, 1.24, 0.16, 0.46, RED); rx(0, 0.92, 1.12, 1.24, 0.5, 0.13, RED, 0.22);
      rx(0, 0.62, 0.05, 0.16, 0.24, 0.9, RED2); rx(0.73, 0.82, 0.1, 0.03, 0.2, 1.2, RED); rx(-0.73, 0.82, 0.1, 0.03, 0.2, 1.2, RED);
      rx(0, 0.94, -0.52, 1.46, 0.06, 0.05, RED);
      rb.add(new T.TorusGeometry(0.17, 0.022, 8, 24), mat(-0.37, 0.98, -0.36, -0.35, 0, 0), 0x1c1c20);
      body.add(rb.mesh(redMat));
      var cabin = glow(0xff2a35, 2.1, 0.3); cabin.position.set(0, 1.05, 0.15); body.add(cabin);

      /* hatch */
      var HP = [[1.72, 1.44, 0.56], [1.99, 1.165, 0.665], [2.09, 1.05, 0.76], [2.19, 0.95, 0.82], [2.215, 0.6, 0.83]];
      var hs = HP.map(function (r) { return [[r[2], r[1] - 1.44, r[0] - 1.72], [r[2] * 0.5, r[1] - 1.44 + 0.01, r[0] - 1.72 + 0.03], [0, r[1] - 1.44 + 0.012, r[0] - 1.72 + 0.04]]; });
      var hg = loft(hs, function (i) { return i === 0 ? 'glass' : i === 3 ? PAINT : PAINT; });
      var hatch = new T.Group(); hatch.position.set(0, 1.44, 1.72);
      hatch.add(new T.Mesh(hg.paint, paintMat)); hatch.add(edges(hg.paint, C.lite, 0.3, 14));
      var hgl = new T.Mesh(hg.glass, glassMat); hgl.renderOrder = 3; hatch.add(hgl);
      var plateC = canvas(256, 128), px = plateC.getContext('2d');
      px.fillStyle = '#F2DBA0'; px.fillRect(0, 0, 256, 128); px.fillStyle = '#0A1426'; px.textAlign = 'center';
      px.font = '600 22px ' + SANS; px.fillText('LAS VEGAS TO RENO', 128, 30); px.font = '700 62px ' + SANS; px.fillText('HEUSER', 128, 100);
      var plate = new T.Mesh(new T.PlaneGeometry(0.4, 0.2), new T.MeshBasicMaterial({ map: tex(plateC), side: T.DoubleSide }));
      plate.position.set(0, -0.68, 0.537); hatch.add(plate);
      body.add(hatch);

      /* lights */
      var headM = new T.MeshBasicMaterial({ color: 0xfff4d6 }), tailM = new T.MeshBasicMaterial({ color: 0xff2230 });
      var heads = [], tails = [];
      [1, -1].forEach(function (d) {
        var h = new T.Mesh(box, headM); h.scale.set(0.27, 0.062, 0.05); h.position.set(d * 0.69, 0.735, -2.168); h.rotation.set(0, d * -0.52, d * 0.12); body.add(h);
        var hg2 = glow(0xffe9b8, 1.5, 0); hg2.position.set(d * 0.68, 0.735, -2.26); body.add(hg2); heads.push(hg2);
        var t1 = new T.Mesh(new T.TorusGeometry(0.056, 0.012, 8, 28), tailM); t1.position.set(d * 0.725, 0.89, 2.2); body.add(t1);
        var t2 = new T.Mesh(new T.TorusGeometry(0.056, 0.012, 8, 28), tailM); t2.position.set(d * 0.56, 0.885 - 1.44, 2.225 - 1.72); hatch.add(t2);
        var tg = glow(0xff1c2c, 1.1, 0.5); tg.position.set(d * 0.6, 0.89, 2.26); body.add(tg); tails.push(tg);
      });
      var bar = new T.Mesh(box, tailM); bar.scale.set(0.94, 0.012, 0.012); bar.position.set(0, 0.9 - 1.44, 2.225 - 1.72 + 0.02); hatch.add(bar);

      /* headlight beams + dust */
      var beamU = { uOn: { value: 0 }, uTime: U.uTime };
      var beamM = new T.ShaderMaterial({
        transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.DoubleSide, uniforms: beamU,
        vertexShader: 'varying vec3 vP; varying vec2 vUv; void main(){ vUv=uv; vP=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
        fragmentShader: 'uniform float uOn,uTime; varying vec2 vUv; varying vec3 vP; void main(){ float a=pow(vUv.y,2.6)*0.12*uOn; float st=0.75+0.25*sin(vUv.x*60.0+sin(uTime*0.7+vUv.y*9.0)*2.0); gl_FragColor=vec4(vec3(1.0,0.9,0.66)*a*st,1.0); }'
      });
      [1, -1].forEach(function (d) {
        var cg = new T.CylinderGeometry(0.1, 2.5, 17, 24, 1, true); cg.translate(0, -8.5, 0); cg.rotateX(-Math.PI / 2 + Math.PI);
        cg.rotateX(0); var b = new T.Mesh(cg, beamM); b.position.set(d * 0.6, 0.73, -2.2); b.rotation.set(-0.045, d * -0.02, 0); b.renderOrder = 4; body.add(b);
      });
      var dustN = lite ? 60 : 130, dp = new Float32Array(dustN * 3), dr = new Float32Array(dustN), R = rng(5);
      for (var di = 0; di < dustN; di++) { dp[di * 3] = (R() - 0.5) * 2; dp[di * 3 + 1] = R(); dp[di * 3 + 2] = R(); dr[di] = R(); }
      var dg = new T.BufferGeometry(); dg.setAttribute('position', new T.BufferAttribute(dp, 3)); dg.setAttribute('aR', new T.BufferAttribute(dr, 1));
      var dust = new T.Points(dg, new T.ShaderMaterial({
        transparent: true, depthWrite: false, blending: T.AdditiveBlending, uniforms: { uOn: beamU.uOn, uTime: U.uTime, uDpr: U.uDpr },
        vertexShader: 'attribute float aR; uniform float uTime,uDpr; varying float vA; void main(){ float k=fract(position.z-uTime*(0.12+aR*0.2)); float z=-2.4-k*15.0; float w=0.6+k*2.2; vec3 p=vec3(position.x*w,0.25+position.y*(0.7+k*1.2),z); vec4 m=modelViewMatrix*vec4(p,1.0); vA=sin(k*3.14)*(0.4+0.6*aR); gl_PointSize=clamp(uDpr*(16.0/max(-m.z,0.4))*(0.5+aR),1.0,7.0); gl_Position=projectionMatrix*m; }',
        fragmentShader: 'uniform float uOn; varying float vA; void main(){ vec2 d=gl_PointCoord-0.5; float a=smoothstep(0.25,0.0,dot(d,d)); gl_FragColor=vec4(vec3(1.0,0.9,0.68)*a*vA*uOn*0.55,1.0); }'
      }));
      dust.frustumCulled = false; body.add(dust);

      /* wheels */
      var wheels = [], wb = new Bag();
      var tire = new T.CylinderGeometry(0.355, 0.355, 0.22, 34); tire.rotateZ(Math.PI / 2);
      wb.add(tire, null, 0x101216);
      [0.112, -0.112].forEach(function (x) {
        wb.add(new T.RingGeometry(0.235, 0.265, 34), mat(x, 0, 0, 0, Math.PI / 2, 0), 0x8A929C);
        wb.add(new T.CircleGeometry(0.235, 30), mat(x * 0.8, 0, 0, 0, Math.PI / 2, 0), 0x0b0d10);
        for (var k = 0; k < 10; k++) { var a = k / 10 * TAU + (k % 2 ? 0.14 : -0.14); wb.add(box, mat(x * 0.94, Math.cos(a) * 0.135, Math.sin(a) * 0.135, a, 0, 0, 0.018, 0.22, 0.028), 0x6C747E); }
        wb.add(new T.CircleGeometry(0.05, 16), mat(x * 1.0, 0, 0, 0, Math.PI / 2, 0), 0xA8AFB8);
      });
      var wgeo = wb.geo();
      [[0.83, -1.36], [-0.83, -1.36], [0.83, 1.3], [-0.83, 1.3]].forEach(function (w) {
        var m = new T.Mesh(wgeo, trimMat); m.position.set(w[0], 0.355, w[1]); root.add(m); wheels.push(m);
      });

      /* subs */
      var sb = new Bag();
      sb.add(box, mat(0, 0.69, 1.42, 0, 0, 0, 1.26, 0.5, 0.4), 0x17191d);
      var subBox = sb.mesh(trimMat); body.add(subBox); body.add(edges(subBox.geometry, C.lite, 0.35));
      var subs = [], leds = [];
      [-0.31, 0.31].forEach(function (x) {
        var g = new T.Group(); g.position.set(x, 0.69, 1.625);
        var f = new Bag(); f.add(new T.TorusGeometry(0.2, 0.026, 10, 40), null, 0x9aa2ac); f.add(new T.CircleGeometry(0.2, 40), mat(0, 0, -0.06), 0x08090b); g.add(f.mesh(trimMat));
        var cone = new T.Group();
        var cb = new Bag(), cg = new T.CylinderGeometry(0.175, 0.06, 0.07, 40, 4, true); cg.rotateX(Math.PI / 2);
        cb.add(cg, mat(0, 0, -0.02), 0x3b4048); cb.add(new T.SphereGeometry(0.066, 20, 12), mat(0, 0, -0.035, 0, 0, 0, 1, 1, 0.5), 0x9aa2ac);
        cb.add(new T.TorusGeometry(0.168, 0.02, 8, 40), mat(0, 0, 0.012), 0x1d2025);
        cone.add(cb.mesh(trimMat)); g.add(cone); subs.push(cone);
        var led = new T.Mesh(new T.TorusGeometry(0.228, 0.008, 6, 48), new T.MeshBasicMaterial({ color: 0xff2a35 })); led.position.z = 0.012; g.add(led); leds.push(led);
        body.add(g);
      });
      var subGlow = glow(0xff2a35, 1.9, 0); subGlow.position.set(0, 0.72, 1.78); body.add(subGlow);

      /* shock rings thrown by the subs */
      var rings = [];
      for (var ri = 0; ri < 6; ri++) {
        var rm = new T.Mesh(new T.RingGeometry(0.96, 1, 72), new T.MeshBasicMaterial({ color: C.lite, transparent: true, opacity: 0, side: T.DoubleSide, depthWrite: false, blending: T.AdditiveBlending }));
        rm.position.set(0, 0.72, 2.0); body.add(rm); rings.push(rm);
      }
      scene.add(root);
      return { root: root, body: body, wheels: wheels, hatch: hatch, subs: subs, leds: leds, subGlow: subGlow, rings: rings, heads: heads, tails: tails, beam: beamU, cabin: cabin, tailM: tailM, headM: headM };
    }());

    /* ======================================================= THE POINTS
       2,800 points with four homes: the galaxy over Vegas, the lights of the
       skyline, the Milky Way over the desert, and the name at the end. */
    var skyBoxes = [];                    // filled by the Vegas builder, used for window lights

    /* ============================================================== VEGAS */
    (function () {
      var Z = zone(-400, 330), R = rng(42), b = new Bag(), box = new T.BoxGeometry(1, 1, 1);
      function tower(x, s, w, h, d) { b.add(box, mat(x, h / 2 - 0.3, -s, 0, 0, 0, w, h, d), 0xffffff); skyBoxes.push({ x: x, s: s, w: w, h: h, d: d }); }
      var i;
      for (i = 0; i < 84; i++) {
        var sd = R() < 0.5 ? -1 : 1, s = -70 - R() * 290, x = sd * (16 + Math.pow(R(), 1.3) * 190);
        var far = sm(-120, -300, s); tower(x, s, 9 + R() * 17, 7 + Math.pow(R(), 1.8) * (10 + far * 58), 9 + R() * 14);
      }
      for (i = 0; i < 26; i++) { var e = i % 2 ? 1 : -1; tower(e * (24 + R() * 34), 18 + i * 6 + R() * 5, 8 + R() * 9, 6 + Math.pow(R(), 1.5) * 24, 7 + R() * 8); }
      Z.add(b.mesh(eng({ vcol: 1, freq: 1.15, dir: V(0, 1, 0), ink: 0x8A6A3F, bg: 0x060A14, amb: 0.1, rim: 0.12 })));

      /* generic landmarks: needle tower, pyramid with a beam, wheel */
      var lm = new Bag();
      lm.add(new T.CylinderGeometry(1.5, 5, 92, 18), mat(-128, 46, 250), 0xffffff);
      lm.add(new T.CylinderGeometry(9, 4, 7, 22), mat(-128, 92, 250), 0xffffff);
      lm.add(new T.CylinderGeometry(0.4, 1.4, 26, 10), mat(-128, 108, 250), 0xffffff);
      lm.add(new T.ConeGeometry(46, 46, 4), mat(104, 22, 225, 0, Math.PI / 4, 0), 0xffffff);
      Z.add(lm.mesh(eng({ vcol: 1, freq: 1.5, ink: C.brass, amb: 0.16, rim: 0.5 })));
      var beam = new T.Mesh(new T.CylinderGeometry(5, 0.6, 320, 18, 1, true), new T.MeshBasicMaterial({ color: 0x5a5236, transparent: true, opacity: 0.5, blending: T.AdditiveBlending, depthWrite: false, side: T.DoubleSide }));
      beam.position.set(104, 205, 225); Z.add(beam);
      var wheel = new T.Group(); wheel.position.set(-70, 33, 205);
      wheel.add(new T.Mesh(new T.TorusGeometry(29, 0.5, 6, 64), new T.MeshBasicMaterial({ color: 0xb8892b })));
      for (i = 0; i < 28; i++) {
        var a = i / 28 * TAU, sp = new T.Mesh(new T.SphereGeometry(1.1, 8, 6), new T.MeshBasicMaterial({ color: i % 2 ? 0xff3b6b : 0xf2dba0 }));
        sp.position.set(Math.cos(a) * 30, Math.sin(a) * 30, 0); wheel.add(sp);
        var ln = new T.Mesh(box, new T.MeshBasicMaterial({ color: 0x5b4520 })); ln.scale.set(29, 0.12, 0.12); ln.position.set(Math.cos(a) * 14.5, Math.sin(a) * 14.5, 0); ln.rotation.z = a; wheel.add(ln);
      }
      Z.add(wheel);

      var signs = [];
      function vsign(t, c, x, s, y, w, h) { var n = neon([{ t: t, size: h * 0.52, color: c, w: '700', font: SANS, ls: 0.1 }], w, h, { frame: c, px: 48 }); n.position.set(x, y, -s); n.rotation.y = Math.PI; Z.add(n); signs.push(n); return n; }
      vsign('OPEN 24 HRS', '#FF3B6B', -27, -62, 12, 14, 3.4); vsign('VACANCY', '#3FD8FF', -50, -80, 21, 12, 3.8);
      vsign('LATE NIGHT', '#F2C14E', -20, -112, 19, 16, 3.8); vsign('CASINO', '#FF5A3C', 19, -150, 17, 15, 4);
      var nl = neon([{ t: 'NOW LEAVING', size: 0.62, y: -0.95, color: '#F2DBA0', w: '600', font: SANS, ls: 0.16 }, { t: 'Las Vegas', size: 1.5, y: 0.35, color: '#FF4D6A' }], 9, 4.2, { frame: '#C9A227' });
      place(nl, 150, 10.5, 6.4, 0); Z.add(nl); signs.push(nl);
      var post = new T.Mesh(new T.CylinderGeometry(0.14, 0.18, 4.6, 10), eng({ freq: 5, ink: C.brass })); place(post, 150, 10.5, 2, 0); Z.add(post);
      var bk = new T.Mesh(new T.PlaneGeometry(8.6, 3.8), new T.MeshBasicMaterial({ color: 0x0a0f1c, side: T.DoubleSide })); place(bk, 150.2, 10.5, 6.4, 0); Z.add(bk);

      tick(function (S) {
        if (!Z.visible) return;
        wheel.rotation.z = S.t * 0.12;
        beam.material.opacity = 0.34 + 0.16 * Math.sin(S.t * 1.3) + S.beat * 0.25;
        for (var k = 0; k < signs.length; k++) {
          var fl = Math.sin(S.t * (7 + k * 3.1) + k * 9) > 0.965 ? 0.25 : 1;
          signs[k].material.opacity = fl * (0.8 + S.beat * 0.2);
        }
      });
    }());

    /* -------------------------------------------------- points, continued */
    var cloud = (function () {
      var N = lite ? 2600 : 4400, R = rng(77), gal = new Float32Array(N * 3), win = new Float32Array(N * 3), nam = new Float32Array(N * 3), col = new Float32Array(N * 3), rnd = new Float32Array(N), i;
      var tot = 0, acc = skyBoxes.map(function (b) { tot += b.h * (b.w + b.d); return tot; });
      for (i = 0; i < N; i++) {
        var t = Math.pow(R(), 0.62), rad = 0.25 + t * 2.55, ang = Math.floor(R() * 3) * (TAU / 3) + rad * 1.55 + (R() - 0.5) * (0.55 + rad * 0.3);
        gal[i * 3] = Math.cos(ang) * rad + (R() - 0.5) * 0.1; gal[i * 3 + 1] = (R() - 0.5) * (0.36 / (1 + rad * 1.5)); gal[i * 3 + 2] = Math.sin(ang) * rad + (R() - 0.5) * 0.1;
        var pick = R() * tot, k = 0; while (k < acc.length - 1 && acc[k] < pick) k++;
        var b = skyBoxes[k], front = R() < 0.62, wx, wz;
        if (front) { wx = b.x + Math.round((R() - 0.5) * b.w * 0.9 / 1.5) * 1.5; wz = -b.s - b.d / 2 - 0.12; }
        else { wx = b.x - Math.sign(b.x) * (b.w / 2 + 0.12); wz = -b.s + Math.round((R() - 0.5) * b.d * 0.9 / 1.5) * 1.5; }
        win[i * 3] = wx; win[i * 3 + 1] = 1 + Math.round(R() * (b.h - 3) / 2.1) * 2.1; win[i * 3 + 2] = wz;
        var m = Math.min(rad / 2.8, 1), q = m < 0.42 ? m / 0.42 : (m - 0.42) / 0.58;
        if (m < 0.42) { col[i * 3] = 1; col[i * 3 + 1] = 0.86 - q * 0.1; col[i * 3 + 2] = 0.55 + q * 0.12; }
        else { col[i * 3] = 1 - q * 0.55; col[i * 3 + 1] = 0.76 - q * 0.24; col[i * 3 + 2] = 0.67 + q * 0.28; }
        rnd[i] = R();
      }
      var g = new T.BufferGeometry();
      g.setAttribute('position', new T.BufferAttribute(gal, 3)); g.setAttribute('aWin', new T.BufferAttribute(win, 3));
      g.setAttribute('aName', new T.BufferAttribute(nam, 3)); g.setAttribute('aCol', new T.BufferAttribute(col, 3)); g.setAttribute('aR', new T.BufferAttribute(rnd, 1));
      var gA = V(-62, 80, 185), gD = V(0, 0, 0); toWorld(1330, -30, 150, 0, gD);
      var u = { uLite: { value: opt.narrow ? 0.55 : 1 }, uTime: U.uTime, uDpr: U.uDpr, uBeat: U.uBeat, uW: { value: [1, 0, 0, 0] }, uA: { value: gA }, uD: { value: gD }, uTilt: { value: new T.Vector2(0, 0) }, uGain: { value: 1 }, uAccent: U.uAccent };
      var mtl = new T.ShaderMaterial({
        transparent: true, depthWrite: false, blending: T.AdditiveBlending, uniforms: u,
        vertexShader: [
          'attribute vec3 aWin,aName,aCol; attribute float aR; uniform float uTime,uDpr,uBeat,uGain,uLite; uniform float uW[4]; uniform vec3 uA,uD,uAccent; uniform vec2 uTilt; varying vec3 vC; varying float vA;',
          'mat3 rx(float a){float c=cos(a),s=sin(a);return mat3(1.,0.,0.,0.,c,s,0.,-s,c);}',
          'mat3 rz(float a){float c=cos(a),s=sin(a);return mat3(c,s,0.,-s,c,0.,0.,0.,1.);}',
          'void main(){ float r=length(position.xz); float a=uTime*(0.16/(0.45+r)); float s=sin(a),c=cos(a);',
          '  vec3 q=vec3(position.x*c-position.z*s,position.y,position.x*s+position.z*c);',
          '  vec3 A=uA+rz(0.26+uTilt.x)*rx(-0.62+uTilt.y)*q*38.0;',
          '  vec3 D=uD+rz(-0.3)*rx(0.5)*q*56.0;',
          '  vec3 NM=aName+vec3(sin(uTime*0.9+aR*30.0),cos(uTime*0.8+aR*20.0),sin(uTime+aR*9.0))*0.06;',
          '  vec3 P=A*uW[0]+aWin*uW[1]+D*uW[2]+NM*uW[3];',
          '  float tw=0.62+0.38*sin(uTime*(0.8+aR*3.0)+aR*50.0);',
          '  vec4 m=viewMatrix*vec4(P,1.0); float d=-m.z;',
          '  vC=mix(aCol,mix(vec3(1.0,0.80,0.46),uAccent,0.45),uW[1]*0.5+uW[3]*0.9);',
          '  vA=tw*uGain*(0.9+uBeat*0.5+uW[0]*0.2-uW[3]*0.12); gl_PointSize=clamp(uDpr*(0.7+aR*1.4)*(150.0+300.0*uW[0]+60.0*uW[2]+10.0*uW[3])/max(d,20.0)*mix(1.0,uLite,uW[3]),1.1,7.5*uDpr);',
          '  gl_Position=projectionMatrix*m; }'].join('\n'),
        fragmentShader: 'varying vec3 vC; varying float vA; void main(){ vec2 d=gl_PointCoord-0.5; float r=dot(d,d); if(r>0.25) discard; gl_FragColor=vec4(vC*smoothstep(0.25,0.0,r)*vA,1.0); }'
      });
      var pts = new T.Points(g, mtl); pts.frustumCulled = false; pts.renderOrder = 2; scene.add(pts);

      /** Sample the name into point targets. Faces a camera looking down +Z. */
      function setName(narrow) {
        var W = 900, H = narrow ? 460 : 200, c = canvas(W, H), x = c.getContext('2d');
        x.fillStyle = '#fff'; x.textAlign = 'center'; x.textBaseline = 'middle';
        var f = '700 ' + (narrow ? 200 : 116) + 'px "Playfair Display",Didot,Georgia,serif'; x.font = f;
        if (narrow) { x.fillText('ROMAN', W / 2, 120, W * 0.96); x.fillText('HEUSER', W / 2, 345, W * 0.96); } else x.fillText('ROMAN HEUSER', W / 2, H / 2, W * 0.98);
        var d = x.getImageData(0, 0, W, H).data, hit = [], i;
        for (var y = 0; y < H; y += 1) for (var xx = 0; xx < W; xx += 1) if (d[(y * W + xx) * 4 + 3] > 128) hit.push([xx, y]);
        var R2 = rng(9), cp = toWorld(2196, 0, narrow ? 29 : 29, 6, V(0, 0, 0)), wide = narrow ? 24 : 62, arr = g.attributes.aName.array;
        for (i = 0; i < N; i++) {
          var h = hit[Math.floor((i * 0.6180339887 % 1) * hit.length)] || [W / 2, H / 2];   // low-discrepancy: even coverage, crisp letters
          arr[i * 3] = cp.x - ((h[0] + R2() * 2) / W - 0.5) * wide;
          arr[i * 3 + 1] = cp.y - ((h[1] + R2() * 2) - H / 2) / W * wide; arr[i * 3 + 2] = cp.z + (R2() - 0.5) * 0.3;
        }
        g.attributes.aName.needsUpdate = true;
      }
      setName(!!opt.narrow);
      return { u: u, setName: setName };
    }());

    /* =============================================================== HOME */
    (function () {
      var Z = zone(120, 560), R = rng(8), b = new Bag(), wn = new Bag(), box = new T.BoxGeometry(1, 1, 1), v = V(0, 0, 0);
      var sh = new T.Shape(); sh.moveTo(-0.5, 0); sh.lineTo(0.5, 0); sh.lineTo(0, 0.42); sh.lineTo(-0.5, 0);
      var gable = new T.ExtrudeGeometry(sh, { depth: 1, bevelEnabled: false }); gable.translate(0, 0, -0.5);
      var palm = [], signs = [];
      for (var i = 0; i < 22; i++) {
        var sd = i % 2 ? 1 : -1, s = 205 + Math.floor(i / 2) * 25 + R() * 4, x = sd * (21 + R() * 4), f = frame(s), yw = f.yaw + (sd > 0 ? -Math.PI / 2 : Math.PI / 2);
        toWorld(s, x, -0.3, 0, v);
        var w = 12 + R() * 4, h = 3.6 + (R() < 0.45 ? 2.6 : 0), d = 10;
        var M = mat(v.x, v.y, v.z, 0, yw, 0);
        b.add(box, M.clone().multiply(mat(0, h / 2, 0, 0, 0, 0, w, h, d)), 0xffffff);
        b.add(gable, M.clone().multiply(mat(0, h, 0, 0, 0, 0, w * 1.12, 7, d * 1.12)), 0xd8b25a);
        b.add(box, M.clone().multiply(mat(w * 0.32, 1.3, d / 2 + 0.6, 0, 0, 0, 4.6, 2.6, 1.2)), 0xcfcfcf);
        [-0.3, -0.06].forEach(function (k) { wn.add(new T.PlaneGeometry(1.5, 1.3), M.clone().multiply(mat(w * k, 1.7, d / 2 + 0.06)), R() < 0.8 ? 0xffd98a : 0x3a2d14); if (h > 5) wn.add(new T.PlaneGeometry(1.5, 1.2), M.clone().multiply(mat(w * k, 4.5, d / 2 + 0.06)), 0xffcf7a); });
        toWorld(s + 9, sd * (9.5 + R() * 3), -0.3, 0, v); palm.push([v.x, v.y, v.z, 6 + R() * 4]);
        if (i > 1) { // SOLD sign, pops up as you pass
          var g = new T.Group(); place(g, s - 2, sd * 8.6, -0.3, sd > 0 ? -0.5 : 0.5);
          var p = new Bag(); p.add(box, mat(-0.95, 0.9, 0, 0, 0, 0, 0.09, 1.9, 0.09), 0xffffff); p.add(box, mat(0, 1.8, 0, 0, 0, 0, 2.1, 0.07, 0.07), 0xffffff); p.add(box, mat(0, 1.16, 0, 0, 0, 0, 1.7, 1.05, 0.04), 0x223049); g.add(p.mesh(eng({ vcol: 1, freq: 9, ink: C.lite })));
          var n = neon([{ t: 'SOLD', size: 0.5, y: -0.1, color: '#FF3B4B', w: '700', font: SANS, ls: 0.06 }, { t: 'The Heuser Team', size: 0.19, y: 0.34, color: '#F2DBA0' }], 1.8, 1.15, { frame: '#C9A227', px: 150 });
          n.position.set(0, 1.16, 0.06); g.add(n); Z.add(g); signs.push({ g: g, s: s });
        }
      }
      Z.add(b.mesh(eng({ vcol: 1, freq: 2.6, dir: V(0.2, 1, 0.1), ink: 0xA98433, amb: 0.14, rim: 0.2 })));
      var wm = wn.mesh(new T.ShaderMaterial({ side: T.DoubleSide, uniforms: { uTime: U.uTime }, vertexShader: 'attribute vec3 aCol; varying vec3 vC; void main(){ vC=aCol; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }', fragmentShader: 'varying vec3 vC; uniform float uTime; void main(){ gl_FragColor=vec4(vC*(0.8+0.06*sin(uTime*3.0)),1.0); }' }));
      Z.add(wm);

      var pb = new Bag(); pb.add(new T.CylinderGeometry(0.035, 0.06, 1, 8), mat(0, 0.5, 0), 0xffffff);
      for (var k = 0; k < 9; k++) { var a = k / 9 * TAU; pb.add(new T.ConeGeometry(0.06, 0.5, 4), mat(Math.cos(a) * 0.22, 0.97, Math.sin(a) * 0.22, Math.sin(a) * 1.95, 0, -Math.cos(a) * 1.95), 0xd7c27a); }
      var pm = new T.InstancedMesh(pb.geo(), eng({ vcol: 1, freq: 3.2, ink: 0xA98433, amb: 0.2 }), palm.length);
      palm.forEach(function (q, j) { pm.setMatrixAt(j, mat(q[0], q[1], q[2], 0, j, 0, q[3] * 0.62, q[3], q[3] * 0.62)); });
      pm.frustumCulled = false; Z.add(pm);

      tick(function (S) {
        if (!Z.visible) return;
        for (var j = 0; j < signs.length; j++) {
          var t = clamp((S.s + 62 - signs[j].s) / 20, 0, 1), e = t <= 0 ? 0.001 : 1 - Math.pow(1 - t, 3) + Math.sin(t * 9) * (1 - t) * 0.25;
          signs[j].g.scale.set(1, Math.max(e, 0.001), 1); signs[j].g.rotation.z = Math.sin(S.t * 1.7 + j) * 0.03;
        }
      });
    }());

    /* =============================================================== JOBS */
    var wash = (function () {
      var Z = zone(330, 800), S0 = 556, v = V(0, 0, 0), box = new T.BoxGeometry(1, 1, 1);
      var LEN = 15, WID = 11, cx = 15.2;

      /* the house the driveway belongs to */
      var b = new Bag(), sh = new T.Shape(); sh.moveTo(-0.5, 0); sh.lineTo(0.5, 0); sh.lineTo(0, 0.32); sh.lineTo(-0.5, 0);
      var gable = new T.ExtrudeGeometry(sh, { depth: 1, bevelEnabled: false }); gable.translate(0, 0, -0.5);
      var H = new T.Group(); place(H, S0, 28, -0.25, -Math.PI / 2);
      b.add(box, mat(0, 2.4, 0, 0, 0, 0, 24, 4.8, 9), 0xffffff); b.add(gable, mat(0, 4.8, 0, 0, 0, 0, 26, 8, 10), 0xd8b25a);
      b.add(box, mat(0, 1.7, 4.6, 0, 0, 0, 8.5, 3.2, 0.5), 0xe9e0c8);
      for (var q = 0; q < 4; q++) b.add(box, mat(0, 0.55 + q * 0.78, 4.9, 0, 0, 0, 8.2, 0.05, 0.06), 0x8a6a3f);
      H.add(b.mesh(eng({ vcol: 1, hatch: 'obj', freq: 2.6, ink: 0xA98433, amb: 0.2 }))); Z.add(H);
      [-8.5, 8.5].forEach(function (x) { var w = new T.Mesh(new T.PlaneGeometry(3, 1.8), new T.MeshBasicMaterial({ color: 0xffd98a })); w.position.set(x, 2.5, 4.56); H.add(w); });
      var porch = glow(0xffdf9a, 9, 0.5); porch.position.set(0, 4.2, 5.4); H.add(porch);

      /* clean concrete artwork */
      var cc = canvas(1024, 1400), x = cc.getContext('2d');
      x.fillStyle = '#d9cfb4'; x.fillRect(0, 0, 1024, 1400);
      x.strokeStyle = 'rgba(80,62,28,.32)'; x.lineWidth = 2; for (q = 0; q < 1400; q += 9) { x.beginPath(); x.moveTo(0, q); for (var k = 0; k <= 1024; k += 64) x.lineTo(k, q + Math.sin(k * 0.02 + q) * 2); x.stroke(); }
      x.strokeStyle = 'rgba(40,30,12,.75)'; x.lineWidth = 7; x.strokeRect(0, 0, 1024, 1400); x.beginPath(); x.moveTo(0, 700); x.lineTo(1024, 700); x.stroke();
      x.fillStyle = '#121c30'; x.textAlign = 'center'; x.textBaseline = 'middle';
      x.font = '400 190px "Playfair Display",Didot,Georgia,serif'; x.fillText('I find it.', 512, 190); x.fillText('I quote it.', 512, 470); x.fillText('I do it.', 512, 900);
      x.font = '600 58px ' + SANS; if ('letterSpacing' in x) x.letterSpacing = '12px'; x.fillText('SELF-EMPLOYED', 512, 1150); x.fillText('DRIVEWAYS AND PATIOS', 512, 1240);
      var mc = canvas(256, 256), mx = mc.getContext('2d'); mx.fillStyle = '#000'; mx.fillRect(0, 0, 256, 256);
      var mt = tex(mc), ct = tex(cc);
      var u = {}; for (var n in U) u[n] = U[n]; u.uMask = { value: mt }; u.uClean = { value: ct };
      var geo = new T.PlaneGeometry(WID, LEN); geo.rotateX(-Math.PI / 2);
      var drive = new T.Mesh(geo, new T.ShaderMaterial({
        uniforms: u, side: T.DoubleSide,
        vertexShader: 'varying vec2 vUv; varying vec3 vW; void main(){ vUv=uv; vec4 w=modelMatrix*vec4(position,1.0); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }',
        fragmentShader: [
          'uniform sampler2D uMask,uClean; varying vec2 vUv; varying vec3 vW;', LIGHT,
          'float h2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}',
          'float ns(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h2(i),h2(i+vec2(1,0)),f.x),mix(h2(i+vec2(0,1)),h2(i+vec2(1,1)),f.x),f.y);}',
          'void main(){ float m=texture2D(uMask,vUv).r; float nz=ns(vUv*vec2(26.0,34.0))*0.6+ns(vUv*90.0)*0.4; float k=smoothstep(0.28,0.62,m+(nz-0.5)*0.35*step(0.02,m)*step(m,0.98));',
          '  float d=vUv.y*150.0+ns(vUv*14.0)*3.0; float w=fwidth(d); float tri=abs(fract(d)-0.5)*2.0; float th=0.16+nz*0.28; float ln=smoothstep(1.0-th-w,1.0-th+w,tri);',
          '  vec3 grime=mix(vec3(0.022,0.026,0.036),vec3(0.20,0.16,0.085),ln*0.8);',
          '  vec3 clean=texture2D(uClean,vUv).rgb*0.94;',
          '  vec3 c=mix(grime,clean,k); float rim=smoothstep(0.02,0.4,m)*(1.0-smoothstep(0.4,0.95,m)); c+=vec3(0.5,0.75,1.0)*rim*0.28;',
          '  gl_FragColor=vec4(fogged(c,vW),1.0); }'].join('\n')
      }));
      place(drive, S0, cx, 0.02, -Math.PI / 2); Z.add(drive);

      /* spray */
      var SN = lite ? 160 : 320, sp = new Float32Array(SN * 3), sr = new Float32Array(SN), R = rng(3);
      for (q = 0; q < SN; q++) { sp[q * 3] = R() - 0.5; sp[q * 3 + 1] = R() - 0.5; sp[q * 3 + 2] = R(); sr[q] = R(); }
      var sg = new T.BufferGeometry(); sg.setAttribute('position', new T.BufferAttribute(sp, 3)); sg.setAttribute('aR', new T.BufferAttribute(sr, 1));
      var su = { uA: { value: V(0, 0, 0) }, uB: { value: V(0, 0, 0) }, uOn: { value: 0 }, uTime: U.uTime, uDpr: U.uDpr };
      var spray = new T.Points(sg, new T.ShaderMaterial({
        transparent: true, depthWrite: false, blending: T.AdditiveBlending, uniforms: su,
        vertexShader: 'attribute float aR; uniform vec3 uA,uB; uniform float uTime,uDpr; varying float vA; void main(){ float k=fract(position.z+uTime*(2.2+aR)); vec3 P; if(k<0.7){ float j=k/0.7; P=mix(uA,uB,j)+vec3(position.x,position.y,position.x*0.7)*j*0.55; vA=0.8; } else { float j=(k-0.7)/0.3; P=uB+vec3(position.x*3.2,0.0,(aR-0.5)*3.2)*j; P.y+=sin(j*3.14)*(0.35+aR*0.7); vA=1.0-j; } vec4 m=viewMatrix*vec4(P,1.0); gl_PointSize=clamp(uDpr*(20.0/max(-m.z,0.5))*(0.4+aR),1.0,9.0); gl_Position=projectionMatrix*m; }',
        fragmentShader: 'uniform float uOn; varying float vA; void main(){ vec2 d=gl_PointCoord-0.5; float a=smoothstep(0.25,0.0,dot(d,d)); gl_FragColor=vec4(vec3(0.72,0.88,1.0)*a*vA*uOn*0.6,1.0); }'
      }));
      spray.frustumCulled = false; Z.add(spray);

      /* roadside job signs */
      var signs = [];
      function job(s, side, top, sub, col) {
        var g = new T.Group(); place(g, s, side * 9.4, 0, side > 0 ? -0.28 : 0.28);
        var nn = neon([{ t: top, size: 0.82, y: -0.28, color: col }, { t: sub, size: 0.32, y: 0.62, color: '#F2DBA0', w: '600', font: SANS, ls: 0.07 }], 7.6, 2.5, { frame: col, px: 110 });
        nn.position.y = 4.4; g.add(nn);
        var pb = new Bag(); [-2.6, 2.6].forEach(function (px2) { pb.add(new T.CylinderGeometry(0.1, 0.12, 5, 8), mat(px2, 1.9, -0.1), 0xffffff); }); pb.add(box, mat(0, 4.4, -0.12, 0, 0, 0, 7.4, 2.3, 0.1), 0x26324a);
        g.add(pb.mesh(eng({ vcol: 1, freq: 6, ink: C.brass }))); Z.add(g); signs.push(nn);
      }
      job(478, -1, 'Maggiano’s', 'FULL-SERVICE RESTAURANT', '#FF5A3C'); job(612, 1, 'Lee Canyon', 'GRILL COOK, ONE SUMMER', '#3FD8FF'); job(672, -1, 'Valet', 'NEVADA PREMIER, RIGHT NOW', '#F2C14E');

      function paint(uvx, uvy, r) {
        var g = mx.createRadialGradient(uvx * 256, (1 - uvy) * 256, 0, uvx * 256, (1 - uvy) * 256, r);
        g.addColorStop(0, 'rgba(255,255,255,.9)'); g.addColorStop(0.6, 'rgba(255,255,255,.55)'); g.addColorStop(1, 'rgba(255,255,255,0)');
        mx.fillStyle = g; mx.fillRect(uvx * 256 - r, (1 - uvy) * 256 - r, r * 2, r * 2); mt.needsUpdate = true;
      }
      /** Serpentine sweep so scrolling alone still cleans the whole slab. */
      var autoAt = 0, tip = V(0, 0, 0);
      function autoUV(p) { var rows = 7, f = clamp(p, 0, 1) * rows, r = Math.min(rows - 1, Math.floor(f)), k = f - r; return [r % 2 ? 1 - k : k, 1 - (r + 0.5) / rows]; }
      function uvWorld(a, out) { var lx = (a[0] - 0.5) * WID, lz = (0.5 - a[1]) * LEN; out.set(lx, 0, lz); drive.localToWorld(out); return out; }
      var ray = new T.Raycaster(), pl = new T.Plane(), hit = V(0, 0, 0);
      var reset = function () { mx.globalCompositeOperation = 'source-over'; mx.fillStyle = '#000'; mx.fillRect(0, 0, 256, 256); mt.needsUpdate = true; autoAt = 0; };
      var ease = 0, userUntil = 0;
      tick(function (S) {
        if (!Z.visible) return;
        for (var j = 0; j < signs.length; j++) signs[j].material.opacity = (Math.sin(S.t * (9 + j * 2) + j * 4) > 0.97 ? 0.35 : 1) * (0.82 + S.beat * 0.18);
        var p = clamp((S.g - 2.24) / 0.42, 0, 1), on = 0;
        drive.updateMatrixWorld();
        if (S.g < 2.05 && autoAt > 0.02) reset();
        if (S.hold && S.sceneId === 'jobs' && S.ray) {
          pl.setFromNormalAndCoplanarPoint(V(0, 1, 0), drive.position); ray.set(S.ray.origin, S.ray.direction);
          if (ray.ray.intersectPlane(pl, hit)) {
            var lc = drive.worldToLocal(hit.clone()), ux = lc.x / WID + 0.5, uy = 0.5 - lc.z / LEN;
            if (ux > -0.1 && ux < 1.1 && uy > -0.1 && uy < 1.1) { paint(ux, uy, 30); tip.lerp(hit, 0.6); on = 1; userUntil = S.t + 0.3; }
          }
        }
        if (p > autoAt) {
          var stp = Math.min(p, autoAt + 0.06), k;
          for (k = autoAt; k <= stp; k += 0.006) { var a = autoUV(k); paint(a[0], a[1], 34); }
          autoAt = stp; if (S.t > userUntil) tip.lerp(uvWorld(autoUV(autoAt), hit), 0.5); on = Math.max(on, 1);
        } else if (p > 0.01 && p < 0.995 && S.t > userUntil) { // idle: keep the wand sweeping the edge of the clean area
          var b2 = autoUV(autoAt); b2[0] = clamp(b2[0] + Math.sin(S.t * 2.4) * 0.09, 0, 1); tip.lerp(uvWorld(b2, hit), 0.2); on = Math.max(on, 0.7);
        }
        ease += (on - ease) * 0.18; su.uOn.value = ease * 1.5;
        toWorld(S0, 7.6, 1.5, 4.6, su.uA.value); su.uB.value.copy(tip);
      });
      return { S0: S0 };
    }());

    /* ======================================================= THREE SIGNS */
    var picks = (function () {
      var Z = zone(600, 1080), box = new T.BoxGeometry(1, 1, 1), list = [];
      var data = [
        { id: 'gomojo', t: 'GoMojo', sub: 'FOUNDER', c: '#FF4F9A', s: 884, r: -14.5, y: 8.4, ry: 0.3 },
        { id: 'tagdata', t: 'TagData', sub: 'FRONTEND DESIGN LEAD', c: '#3FD8FF', s: 900, r: 0, y: 11.8, ry: 0 },
        { id: 'goinvest', t: 'GoInvest', sub: 'BUILDER', c: '#5BE38A', s: 884, r: 14.5, y: 8.4, ry: -0.3 }
      ];
      data.forEach(function (d, i) {
        var g = new T.Group(); place(g, d.s, d.r, 0, d.ry);
        var n = neon([{ t: d.t, size: 2.0, y: -0.35, color: d.c }, { t: d.sub, size: 0.5, y: 1.35, color: '#F7F5EF', w: '600', font: SANS, ls: 0.14 }], 11, 4.6, { frame: d.c, px: 90 });
        n.position.set(0, d.y, 0.2); g.add(n);
        var pb = new Bag(); pb.add(box, mat(0, d.y, -0.15, 0, 0, 0, 10.6, 4.2, 0.2), 0x1a2438);
        if (d.id === 'tagdata') { [-7.2, 7.2].forEach(function (x) { pb.add(box, mat(x, 6.2, -0.2, 0, 0, 0, 0.45, 14, 0.45), 0xffffff); }); pb.add(box, mat(0, 13.9, -0.2, 0, 0, 0, 14.8, 0.4, 0.45), 0xffffff); pb.add(box, mat(0, 9.2, -0.2, 0, 0, 0, 14.8, 0.3, 0.4), 0xffffff); }
        else { pb.add(box, mat(-3, d.y / 2 - 1.4, -0.6, 0, 0, 0, 0.42, d.y, 0.42), 0xffffff); pb.add(box, mat(3, d.y / 2 - 1.4, -0.6, 0, 0, 0, 0.42, d.y, 0.42), 0xffffff); }
        g.add(pb.mesh(eng({ vcol: 1, freq: 3, ink: C.brass, amb: 0.2 })));
        var gw = glow(new T.Color(d.c), 16, 0.22); gw.position.set(0, d.y, 0.6); g.add(gw);
        var hitM = new T.Mesh(new T.PlaneGeometry(11, 4.8), new T.MeshBasicMaterial({ visible: false, side: T.DoubleSide })); hitM.position.set(0, d.y, 0.3); hitM.userData.id = d.id; g.add(hitM);

        /* what each one does, acted out in points */
        var N = d.id === 'gomojo' ? 7 : d.id === 'goinvest' ? 8 : 16, orbs = [];
        for (var k = 0; k < N; k++) { var o = glow(new T.Color(d.c), d.id === 'tagdata' ? 0.7 : 0.95, 0.9); g.add(o); orbs.push(o); }
        Z.add(g); list.push({ id: d.id, c: d.c, g: g, n: n, gw: gw, hit: hitM, orbs: orbs, y: d.y, hov: 0, rise: 0, i: i });
      });
      tick(function (S) {
        if (!Z.visible) return;
        list.forEach(function (p) {
          var r = clamp((S.g - 3.02 - p.i * 0.05) / 0.2, 0, 1); r = 1 - Math.pow(1 - r, 3); p.g.scale.setScalar(Math.max(r, 0.001)); p.g.position.y = p.g.position.y;
          var act = S.pick === p.id, any = !!S.pick, tgt = S.hoverPick === p.id ? 1 : 0; p.hov += (tgt - p.hov) * 0.14;
          var fl = !act && Math.sin(S.t * (8 + p.i * 2.7) + p.i * 5) > 0.975 ? 0.3 : 1;
          p.n.material.opacity = fl * (act ? 1 : any ? 0.5 + p.hov * 0.5 : 0.86 + S.beat * 0.14); p.n.scale.setScalar(1 + p.hov * 0.06 + (act ? S.beat * 0.03 : 0));
          p.gw.material.opacity = (act ? 0.5 : 0.16) + p.hov * 0.25 + S.beat * 0.1; p.gw.scale.setScalar(16 + S.beat * 3 + p.hov * 4);
          p.orbs.forEach(function (o, k) {
            var n = p.orbs.length, a = k / n * TAU, q;
            if (p.id === 'gomojo') { q = 0.5 + 0.5 * Math.sin(S.t * 0.9); var cx = [-4, 0, 4][k % 3]; o.position.set(lerp(Math.cos(a + S.t * 1.3) * 5.6, cx, q), p.y - 3.6 + lerp(Math.sin(a + S.t * 1.3) * 1.1, 0, q), 0.9); }
            else if (p.id === 'goinvest') { q = Math.sin(S.t * 1.1 + k * 1.7); o.position.set(-4.4 + k * (8.8 / 7), p.y - 4.1 + Math.abs(q) * 1.6, 0.9); }
            else { var gx = k % 4, gy = Math.floor(k / 4); q = 0.5 + 0.5 * Math.sin(S.t * 1.2 + (hash2(k, 3) * 6)); o.position.set((gx - 1.5) * 0.8, p.y - 4.4 + (gy - 1.5) * 0.45, 0.9); o.material.opacity = 0.25 + q * 0.75; }
          });
        });
      });
      return { list: list, zone: Z };
    }());

    /* ===================================================== DESERT + BASS */
    (function () {
      var Z = zone(620, 1480), R = rng(21), v = V(0, 0, 0), box = new T.BoxGeometry(1, 1, 1), i;
      /* Joshua trees */
      var jb = new Bag(), arms = [[0, 0, 0, 1.5, 0], [0.12, 1.3, 0, 1.15, 0.7], [-0.1, 1.2, 0.1, 1.2, -0.75], [0, 1.4, 0.1, 1, 0.1]];
      arms.forEach(function (a) {
        var m = mat(a[0], a[1], a[2], a[4] * 0.4, 0, -a[4]); jb.add(new T.CylinderGeometry(0.11, 0.17, a[3], 7), m.clone().multiply(mat(0, a[3] / 2, 0)), 0xffffff);
        for (var k = 0; k < 9; k++) { var t = k / 9 * TAU; jb.add(new T.ConeGeometry(0.07, 0.62, 4), m.clone().multiply(mat(Math.cos(t) * 0.2, a[3] + 0.12, Math.sin(t) * 0.2, Math.sin(t) * 1.0, 0, -Math.cos(t) * 1.0)), 0xe0cf8a); }
      });
      var n = lite ? 46 : 92, jm = new T.InstancedMesh(jb.geo(), eng({ vcol: 1, freq: 5, ink: 0xA98433, amb: 0.18, rim: 0.4 }), n);
      for (i = 0; i < n; i++) { var s = 700 + R() * 700, x = (R() < 0.5 ? -1 : 1) * (9 + Math.pow(R(), 1.6) * 60); toWorld(s, x, 0, 0, v); var k = 0.9 + R() * 1.3; jm.setMatrixAt(i, mat(v.x, terrainY(x, s), v.z, 0, R() * TAU, 0, k)); }
      jm.frustumCulled = false; Z.add(jm);

      /* mile markers carry the numbers */
      [[1062, 1, '3', 'PRODUCTS SHIPPED'], [1108, -1, '<$1K', 'TO BUILD GOMOJO'], [1154, 1, '15', 'AI AGENTS BUILT'], [1200, -1, '6s', 'TO PLAN A NIGHT OUT']].forEach(function (m) {
        var g = new T.Group(); place(g, m[0], m[1] * 8.2, 0, m[1] > 0 ? -0.3 : 0.3);
        var c = canvas(320, 400), q = c.getContext('2d'); q.fillStyle = '#0C1A2E'; q.fillRect(0, 0, 320, 400); q.strokeStyle = '#F2DBA0'; q.lineWidth = 9; q.strokeRect(14, 14, 292, 372);
        q.fillStyle = '#F2DBA0'; q.textAlign = 'center'; q.textBaseline = 'middle'; q.font = '400 130px "Playfair Display",Didot,Georgia,serif'; q.fillText(m[2], 160, 170, 270); q.font = '700 27px ' + SANS; q.fillText(m[3], 160, 310, 270);
        var p = new T.Mesh(new T.PlaneGeometry(3.2, 4), new T.MeshBasicMaterial({ map: tex(c), side: T.DoubleSide })); p.position.y = 3.9; g.add(p);
        var pb = new Bag(); pb.add(box, mat(0, 1, -0.06, 0, 0, 0, 0.16, 2.4, 0.1), 0xffffff); g.add(pb.mesh(eng({ vcol: 1, freq: 8, ink: C.lite }))); Z.add(g);
      });
      var us = neon([{ t: '95', size: 1.9, y: 0.35, color: '#F7F5EF', w: '700', font: SANS }, { t: 'US', size: 0.7, y: -1.15, color: '#F7F5EF', w: '700', font: SANS }], 4, 4, { frame: '#F7F5EF', px: 90 });
      place(us, 1012, 9, 4.6, -0.2); Z.add(us);
    }());

    /* =========================================================== TREENET */
    var net = (function () {
      var Z = zone(1330, 1760), R = rng(33), v = V(0, 0, 0), i, j;
      var pb = new Bag(); pb.add(new T.CylinderGeometry(0.11, 0.3, 4.4, 9), mat(0, 2.2, 0), 0xc08a4a);
      for (i = 0; i < 6; i++) pb.add(new T.ConeGeometry(1.75 - i * 0.24, 1.9, 11, 1, true), mat(Math.sin(i * 9) * 0.1, 2.5 + i * 1.12, Math.cos(i * 7) * 0.1, 0, i, 0), i % 2 ? 0xb9c08a : 0x8f9a62);
      var pg = pb.geo(), n = lite ? 110 : 240, pm = new T.InstancedMesh(pg, eng({ vcol: 1, freq: 3.4, dir: V(0.5, 1, 0.3), ink: 0xC2A14A, amb: 0.15, rim: 0.35 }), n);
      for (i = 0; i < n; i++) {
        var s = 1400 + R() * 320, x = (R() < 0.5 ? -1 : 1) * (9 + Math.pow(R(), 1.4) * 80); if (s > 1535 && s < 1585 && x > 4 && x < 29) x = -x;
        toWorld(s, x, 0, 0, v); var k = 1.2 + R() * 1.7; pm.setMatrixAt(i, mat(v.x, terrainY(x, s) - 0.3, v.z, 0, R() * TAU, 0, k, k * (1 + R() * 0.4), k));
      }
      pm.frustumCulled = false; Z.add(pm);

      /* five anchor trees and the net between them */
      var S0 = 1560, G = new T.Group(); place(G, S0, 16, 0, 0); var gy = terrainY(16, S0) - roadY(S0); G.position.y += gy; Z.add(G);
      var anchors = []; for (i = 0; i < 5; i++) { var a = i / 5 * TAU + 0.35; anchors.push([Math.cos(a) * 8.4, Math.sin(a) * 7.6]); }
      var tb = new Bag();
      anchors.forEach(function (p, q) {
        tb.add(new T.CylinderGeometry(0.28, 0.62, 24, 12), mat(p[0] * 1.08, 12, p[1] * 1.08), 0xc08a4a);
        for (j = 0; j < 7; j++) tb.add(new T.ConeGeometry(4.2 - j * 0.45, 3.1, 12, 1, true), mat(p[0] * 1.08, 14 + j * 2, p[1] * 1.08, 0, q + j, 0), j % 2 ? 0xb9c08a : 0x8f9a62);
        for (j = 0; j < 5; j++) tb.add(new T.CylinderGeometry(0.04, 0.12, 3, 5), mat(p[0] * 1.08 + Math.cos(j * 2 + q) * 1.2, 4 + j * 1.9, p[1] * 1.08 + Math.sin(j * 2 + q) * 1.2, Math.sin(j * 2 + q) * 1.2, 0, -Math.cos(j * 2 + q) * 1.2), 0x9a6f3a);
      });
      G.add(tb.mesh(eng({ vcol: 1, freq: 4.2, dir: V(0.25, 1, 0.2), ink: 0xC2A14A, amb: 0.2, rim: 0.5 })));

      var M = lite ? 23 : 31, half = 6.3, H = 8.2, cnt = M * M, P = new Float32Array(cnt * 3), Yv = new Float32Array(cnt), Yo = new Float32Array(cnt), ins = new Uint8Array(cnt), fix = new Uint8Array(cnt);
      function inside(x, z) { var r = Math.hypot(x / 7.6, z / 6.9), a = Math.atan2(z / 6.9, x / 7.6) - 0.35; return r < 0.86 + 0.14 * Math.cos(a * 5); }
      for (i = 0; i < M; i++) for (j = 0; j < M; j++) {
        var id = i * M + j, px = (i / (M - 1) * 2 - 1) * half * 1.2, pz = (j / (M - 1) * 2 - 1) * half * 1.12, q2 = (i + j) % 2 * 0.06;
        P[id * 3] = px; P[id * 3 + 2] = pz + q2; var rr = Math.hypot(px, pz) / 8; Yo[id] = H - 0.9 * (1 - rr * rr); P[id * 3 + 1] = Yo[id]; ins[id] = inside(px, pz) ? 1 : 0;
      }
      for (i = 0; i < M; i++) for (j = 0; j < M; j++) { id = i * M + j; if (!ins[id]) continue; var nb = 0; if (i > 0 && ins[id - M]) nb++; if (i < M - 1 && ins[id + M]) nb++; if (j > 0 && ins[id - 1]) nb++; if (j < M - 1 && ins[id + 1]) nb++; fix[id] = nb < 4 ? 1 : 0; }
      var segs = [];
      for (i = 0; i < M; i++) for (j = 0; j < M; j++) { id = i * M + j; if (!ins[id]) continue; if (i < M - 1 && ins[id + M]) segs.push(id, id + M); if (j < M - 1 && ins[id + 1]) segs.push(id, id + 1); if (i < M - 1 && j < M - 1 && ins[id + M + 1] && (i + j) % 2) segs.push(id, id + M + 1); }
      segs = (function (a) { var pr = []; for (var k = 0; k < a.length; k += 2) pr.push([a[k], a[k + 1]]); pr.sort(function (x, y) { var ax = Math.atan2(P[x[0] * 3 + 2], P[x[0] * 3]), ay = Math.atan2(P[y[0] * 3 + 2], P[y[0] * 3]); return ax - ay; }); var o = []; pr.forEach(function (p) { o.push(p[0], p[1]); }); return o; }(segs));
      var ng = new T.BufferGeometry(); ng.setAttribute('position', new T.BufferAttribute(P, 3)); ng.setIndex(segs);
      var nm = new T.LineSegments(ng, new T.LineBasicMaterial({ color: C.lite, transparent: true, opacity: 0.95 })); nm.frustumCulled = false; G.add(nm);
      var nm2 = new T.LineSegments(ng, new T.LineBasicMaterial({ color: C.brass, transparent: true, opacity: 0.7 })); nm2.position.y = -0.03; nm2.position.x = 0.02; nm2.frustumCulled = false; G.add(nm2);
      var rp = []; anchors.forEach(function (p) { for (var k = 0; k < 4; k++) rp.push(p[0] * 1.08, H + 0.4 + k * 0.12, p[1] * 1.08, p[0] * 0.74 + (k - 1.5) * 0.5 * -p[1] / 8, H - 0.1, p[1] * 0.74 + (k - 1.5) * 0.5 * p[0] / 8); });
      var rg = new T.BufferGeometry(); rg.setAttribute('position', new T.Float32BufferAttribute(rp, 3)); G.add(new T.LineSegments(rg, new T.LineBasicMaterial({ color: 0xE08A3C })));
      var moon = glow(0xfff0cf, 30, 0.75); moon.position.set(-18, 40, -16); G.add(moon);
      var ff = []; for (i = 0; i < 26; i++) { var f = glow(0xffd36a, 0.35, 0.9); f.userData = [R() * 16 - 8, 1 + R() * 8, R() * 16 - 8, R() * 9]; G.add(f); ff.push(f); }

      var ray = new T.Raycaster(), pl = new T.Plane(), hit = V(0, 0, 0);
      tick(function (S) {
        if (!Z.visible) return;
        var w = clamp((S.g - 5.06) / 0.42, 0, 1); ng.setDrawRange(0, Math.floor(segs.length / 2 * w) * 2);
        var push = null;
        if (S.ray && S.sceneId === 'treenet') { pl.setFromNormalAndCoplanarPoint(V(0, 1, 0), V(0, G.position.y + H, 0)); ray.set(S.ray.origin, S.ray.direction); if (ray.ray.intersectPlane(pl, hit)) push = G.worldToLocal(hit.clone()); }
        var dt = Math.min(S.dt, 0.033), strength = S.hold ? 60 : 9;
        for (var st = 0; st < 2; st++) for (var k = 0; k < cnt; k++) {
          if (!ins[k] || fix[k]) continue; var y = P[k * 3 + 1], lap = (P[(k - 1) * 3 + 1] + P[(k + 1) * 3 + 1] + P[(k - M) * 3 + 1] + P[(k + M) * 3 + 1]) / 4 - y;
          var F = lap * 210 + (Yo[k] - y) * 9 - Yv[k] * 1.7 + Math.sin(S.t * 1.4 + P[k * 3] * 0.8 + P[k * 3 + 2] * 0.5) * 0.9 - S.beat * 4 * (1 - Math.hypot(P[k * 3], P[k * 3 + 2]) / 9);
          if (push) { var dx = P[k * 3] - push.x, dz = P[k * 3 + 2] - push.z, d2 = dx * dx + dz * dz; if (d2 < 9) F += (S.hold ? Math.sin(S.t * 11) * 0.6 + 0.55 : 0.4) * strength * Math.exp(-d2 * 0.7); }
          Yv[k] += F * dt * 0.5; P[k * 3 + 1] = clamp(y + Yv[k] * dt * 0.5, H - 4, H + 4);
        }
        ng.attributes.position.needsUpdate = true;
        ff.forEach(function (f2) { var u = f2.userData; f2.position.set(u[0] + Math.sin(S.t * 0.5 + u[3]) * 1.6, u[1] + Math.sin(S.t * 0.8 + u[3] * 2) * 0.7, u[2] + Math.cos(S.t * 0.4 + u[3]) * 1.6); f2.material.opacity = 0.25 + 0.65 * Math.max(0, Math.sin(S.t * 1.8 + u[3] * 5)); });
      });
      return { S0: S0, gy: gy };
    }());

    /* =============================================================== SAE */
    var sae = (function () {
      var Z = zone(1700, 2080), R = rng(55), S0 = 1888, G = new T.Group(), box = new T.BoxGeometry(1, 1, 1), i; place(G, S0, 27, 0, -Math.PI / 2); Z.add(G);
      var b = new Bag(), sh = new T.Shape(); sh.moveTo(-0.5, 0); sh.lineTo(0.5, 0); sh.lineTo(0, 0.5); sh.lineTo(-0.5, 0);
      var gab = new T.ExtrudeGeometry(sh, { depth: 1, bevelEnabled: false }); gab.translate(0, 0, -0.5);
      b.add(box, mat(0, 1.9, 0, 0, 0, 0, 25, 3.8, 9), 0xB5523C);                                  // brick
      b.add(gab, mat(0, 3.8, 0, 0, Math.PI / 2, 0, 11, 5.2, 27), 0x6f7685);                        // long low roof
      b.add(box, mat(-9.5, 1.9, 6, 0, 0, 0, 7, 3.8, 4), 0xB5523C);
      b.add(gab, mat(-9.5, 3.8, 5.5, 0, 0, 0, 8.4, 3.4, 6), 0x6f7685);
      [[-1, 2], [4, 2], [9.4, 2]].forEach(function (w) { b.add(box, mat(w[0], w[1], 4.52, 0, 0, 0, 2.5, 1.6, 0.08), 0xe8e2d0); });
      G.add(b.mesh(eng({ vcol: 1, hatch: 'obj', freq: 4.4, dir: V(0.04, 1, 0.1), ink: 0xE0C9A0, amb: 0.24, rim: 0.3, solid: 0.18 })));
      var wn = new Bag(); [[-1, 2], [4, 2], [9.4, 2]].forEach(function (w) { wn.add(new T.PlaneGeometry(2.1, 1.25), mat(w[0], w[1], 4.6), 0xffd98a); }); G.add(wn.mesh(new T.MeshBasicMaterial({ color: 0xffd98a })));
      var str = []; for (i = 0; i < 46; i++) { var t = i / 45, l = glow(0xffd98a, 0.75, 0.9); l.position.set(-12 + t * 25, 4.4 - Math.sin(t * Math.PI * 5 % Math.PI) * 0.7, 5.4); G.add(l); str.push(l); }

      /* flag */
      var fc = canvas(512, 340), q = fc.getContext('2d'); q.fillStyle = '#4B2A86'; q.fillRect(0, 0, 512, 340); q.fillStyle = '#D9A833'; q.fillRect(0, 0, 512, 26); q.fillRect(0, 314, 512, 26);
      q.textAlign = 'center'; q.textBaseline = 'middle'; q.font = '600 200px Georgia,serif'; q.fillText('ΣΑΕ', 256, 180);
      var fu = { uMap: { value: tex(fc) }, uTime: U.uTime, uBeat: U.uBeat };
      var flag = new T.Mesh(new T.PlaneGeometry(6.4, 4.2, 26, 12), new T.ShaderMaterial({
        side: T.DoubleSide, uniforms: fu,
        vertexShader: 'uniform float uTime,uBeat; varying vec2 vUv; varying float vL; void main(){ vUv=uv; vec3 p=position; float k=uv.x; float a=sin(k*7.0-uTime*4.2+uv.y*1.2); p.z+=a*0.55*k*(1.0+uBeat*0.6); p.y+=sin(k*4.0-uTime*2.2)*0.16*k; vL=0.78+cos(k*7.0-uTime*4.2+uv.y*1.2)*0.32*k; gl_Position=projectionMatrix*modelViewMatrix*vec4(p,1.0); }',
        fragmentShader: 'uniform sampler2D uMap; varying vec2 vUv; varying float vL; void main(){ vec3 c=texture2D(uMap,vUv).rgb; float h=vUv.y*70.0; float w=fwidth(h); float t=abs(fract(h)-0.5)*2.0; float ln=smoothstep(1.0-vL*0.9-w,1.0-vL*0.9+w,t); gl_FragColor=vec4(c*mix(0.45,1.05,ln),1.0); }'
      }));
      flag.position.set(-3.1, 10.4, 4); G.add(flag);
      var pole = new T.Mesh(new T.CylinderGeometry(0.09, 0.12, 12, 8), eng({ freq: 6, ink: C.lite })); pole.position.set(-6.4, 6.6, 4); G.add(pole);

      /* table */
      var tb = new Bag(); tb.add(box, mat(0, 1.3, 0, 0, 0, 0, 2.5, 0.16, 6), 0xD02B33); tb.add(box, mat(0, 1.2, 0, 0, 0, 0, 2.7, 0.1, 6.2), 0x2F8A4A);
      [[-1, -2.6], [1, -2.6], [-1, 2.6], [1, 2.6]].forEach(function (p) { tb.add(box, mat(p[0], 0.6, p[1], 0, 0, 0, 0.14, 1.2, 0.14), 0x2F8A4A); });
      var tab = tb.mesh(eng({ vcol: 1, hatch: 'obj', freq: 6, dir: V(1, 0, 0.2), ink: 0xffffff, solid: 0.5, amb: 0.36 })); tab.position.set(0, 0, 12); tab.rotation.y = Math.PI / 2; G.add(tab);

      /* die */
      var dc = canvas(64, 64), d2 = dc.getContext('2d'); d2.fillStyle = '#F7F5EF'; d2.fillRect(0, 0, 64, 64); d2.fillStyle = '#0A1426'; [[16, 16], [48, 16], [32, 32], [16, 48], [48, 48]].forEach(function (p) { d2.beginPath(); d2.arc(p[0], p[1], 7, 0, TAU); d2.fill(); });
      var die = new T.Mesh(new T.BoxGeometry(0.42, 0.42, 0.42), new T.MeshBasicMaterial({ map: tex(dc) })); G.add(die);
      var dieG = glow(0xF2DBA0, 1.5, 0.5); G.add(dieG);
      var trail = []; for (i = 0; i < 12; i++) { var tg = glow(0xF2DBA0, 0.5 - i * 0.03, 0.4 - i * 0.03); G.add(tg); trail.push(tg); }

      /* crowd */
      var cb = new Bag();
      [-0.1, 0.1].forEach(function (x3) { cb.add(new T.CylinderGeometry(0.085, 0.065, 0.86, 7), mat(x3, 0.43, 0), 0x8f7a52); });
      cb.add(new T.CylinderGeometry(0.215, 0.15, 0.62, 10), mat(0, 1.15, 0, 0, 0, 0, 1, 1, 0.62), 0xffffff); cb.add(new T.SphereGeometry(0.2, 10, 6), mat(0, 1.42, 0, 0, 0, 0, 1.08, 0.5, 0.64), 0xffffff);
      cb.add(new T.CylinderGeometry(0.055, 0.06, 0.12, 6), mat(0, 1.52, 0), 0xd9b48a); cb.add(new T.SphereGeometry(0.118, 12, 10), mat(0, 1.66, 0, 0, 0, 0, 0.92, 1.12, 1), 0xd9b48a); cb.add(new T.SphereGeometry(0.124, 12, 6, 0, TAU, 0, 1.4), mat(0, 1.69, -0.012), 0x3a2c1c);
      cb.add(new T.CylinderGeometry(0.05, 0.045, 0.6, 6), mat(0.3, 1.62, 0, 0, 0, -0.34), 0xd9b48a); cb.add(new T.CylinderGeometry(0.05, 0.045, 0.6, 6), mat(-0.27, 1.14, 0.02, 0, 0, -0.14), 0xd9b48a);
      var CN = lite ? 70 : 130, cm = new T.InstancedMesh(cb.geo(), eng({ vcol: 1, freq: 9, ink: 0xC9A860, bg: 0x060912, amb: 0.2, rim: 1.0, solid: 0.35, dens: 1.35 }), CN), ppl = [], tone = [0xffffff, 0x9fb4d8, 0xb8a6e0, 0xe0b070, 0x8fa0b8];
      for (i = 0; i < CN; i++) {
        var x, z, y = 0;
        if (i < 9) { x = -7 + i * 1.5; z = 0.3; y = 6.35; } else { var an = R() * TAU, rr = 4.8 + R() * 5.4; x = Math.cos(an) * rr * 1.5; z = 12 + Math.sin(an) * rr * 0.66; if (z < 5.6) z = 5.6 + R(); if (z > 15.6) z = 15.2 + R() * 0.8; }
        ppl.push([x, y, z, i < 9 ? R() * 0.8 - 0.4 : Math.atan2(-x, 12 - z) + (R() - 0.5) * 0.7, 0.94 + R() * 0.2, R()]); cm.setColorAt(i, new T.Color(tone[Math.floor(R() * tone.length)]));
      }
      cm.frustumCulled = false; G.add(cm);
      var tossT = -9;
      tick(function (S) {
        if (!Z.visible) return;
        for (var k = 0; k < CN; k++) { var p = ppl[k], jump = Math.pow(Math.max(0, Math.sin(S.t * 4.52 + p[5] * 1.4)), 2) * (0.18 + (S.sceneId === 'sae' && S.hold ? 0.5 : 0)) * (p[5] > 0.35 ? 1 : 0.3); cm.setMatrixAt(k, mat(p[0], p[1] + jump, p[2], 0, p[3] + Math.sin(S.t + p[5] * 9) * 0.2, 0, p[4])); }
        cm.instanceMatrix.needsUpdate = true;
        str.forEach(function (l, j) { l.material.opacity = 0.5 + 0.4 * Math.sin(S.t * 3 + j * 0.9) + S.beat * 0.25; });
        if (S.holdStart && S.sceneId === 'sae') tossT = S.t;
        var big = S.t - tossT < 2.2, T0 = big ? (S.t - tossT) / 2.2 : (S.t % 3) / 3, hgt = big ? 8 : 3.4;
        function at(u, o) { u = clamp(u, 0, 1); var X = lerp(-5.4, 4.2, Math.min(u / 0.62, 1)), Y; if (u < 0.62) { var a = u / 0.62; Y = 1.5 + 4 * hgt * a * (1 - a); X = lerp(-5.4, 1.4, a); } else { var c = (u - 0.62) / 0.38; X = lerp(1.4, 5.2, c); Y = 1.5 + 4 * 1.2 * c * (1 - c) - c * c * 1.1; } o.position.set(X, Y, 12); }
        at(T0, die); dieG.position.copy(die.position); die.rotation.set(S.t * 8, S.t * 6.2, S.t * 3); trail.forEach(function (o, j) { at(T0 - (j + 1) * 0.016, o); o.visible = T0 - (j + 1) * 0.016 > 0; });
      });
      return { S0: S0 };
    }());

    /* ============================================================== RENO */
    var reno = (function () {
      var Z = zone(1880, 2600), R = rng(71), box = new T.BoxGeometry(1, 1, 1), i, S1 = 2080, S2 = 2196;
      /* the arch */
      var A = new T.Group(); place(A, S1, 0, 0, 0); Z.add(A);
      var ab = new Bag(); [-9, 9].forEach(function (x) { ab.add(box, mat(x, 4.5, 0, 0, 0, 0, 1.5, 9.6, 1.5), 0xffffff); ab.add(box, mat(x, 9.6, 0, 0, 0, 0, 2.1, 0.7, 2.1), 0xffffff); });
      ab.add(new T.TorusGeometry(9.4, 0.42, 10, 48, Math.PI), mat(0, 7.6, 0, 0, 0, 0, 1, 0.52, 1), 0xffffff); ab.add(new T.TorusGeometry(8.1, 0.3, 10, 48, Math.PI), mat(0, 7.2, 0, 0, 0, 0, 1, 0.5, 1), 0xffffff);
      A.add(ab.mesh(eng({ vcol: 1, freq: 3.4, ink: C.brass, amb: 0.28, rim: 0.6 })));
      var rn = neon([{ t: 'RENO', size: 3.1, color: '#FF2E4E', w: '700', font: SANS, ls: 0.22 }], 15, 5, { px: 80, solid: true }); rn.position.set(0, 14.2, 0.2); A.add(rn);
      var bulbs = []; for (i = 0; i < 44; i++) { var a = i / 43 * Math.PI, g = glow(0xffd98a, 0.95, 0.9); g.position.set(Math.cos(a) * 9.4, 7.6 + Math.sin(a) * 9.4 * 0.52, 0.5); A.add(g); bulbs.push(g); }

      /* downtown on both sides */
      var cb = new Bag(), wn = new Bag();
      for (i = 0; i < 46; i++) {
        var sd = i % 2 ? 1 : -1, s = 1995 + R() * 460, x = sd * (34 + R() * 90), w = 9 + R() * 14, h = 9 + Math.pow(R(), 1.5) * (Math.abs(x) < 62 ? 22 : 44), d = 9 + R() * 12, p = toWorld(s, x, 0, 0, V(0, 0, 0));
        cb.add(box, mat(p.x, p.y + h / 2 - 1, p.z, 0, 0, 0, w, h, d), 0xffffff);
        for (var k = 0; k < (lite ? 8 : 20); k++) wn.add(new T.PlaneGeometry(0.8, 1.1), mat(p.x - sd * (w / 2 + 0.06), p.y + 1 + Math.round(R() * (h - 4) / 2.2) * 2.2, p.z + (R() - 0.5) * d * 0.85, 0, Math.PI / 2, 0), 0xffffff);
        for (k = 0; k < (lite ? 4 : 10); k++) wn.add(new T.PlaneGeometry(0.8, 1.1), mat(p.x + (R() - 0.5) * w * 0.85, p.y + 1 + Math.round(R() * (h - 4) / 2.2) * 2.2, p.z + d / 2 + 0.06), 0xffffff);
      }
      Z.add(cb.mesh(eng({ vcol: 1, freq: 1.3, ink: 0x9A6F72, bg: 0x0a0c1c, amb: 0.12, rim: 0.2 })));
      Z.add(wn.mesh(new T.MeshBasicMaterial({ color: 0xffc98a, side: T.DoubleSide })));

      /* the canopy, from his photo: coffered ceiling, four ring chandeliers */
      var K = new T.Group(); place(K, S2, 0, 0, 0); Z.add(K);
      var kb = new Bag();
      kb.add(box, mat(0, 8.6, 0, 0, 0, 0, 34, 1.2, 26), 0xffffff); kb.add(box, mat(0, 7.85, 12.6, 0, 0, 0, 34, 1.1, 0.8), 0xe6cf9a); kb.add(box, mat(0, 7.85, -12.6, 0, 0, 0, 34, 1.1, 0.8), 0xe6cf9a);
      [-16.6, 16.6].forEach(function (x2) { kb.add(box, mat(x2, 7.85, 0, 0, 0, 0, 0.8, 1.1, 26), 0xe6cf9a); [-11, -3.7, 3.7, 11].forEach(function (z) { kb.add(new T.CylinderGeometry(0.72, 0.8, 8.6, 18), mat(x2, 3.9, z), 0xffffff); kb.add(box, mat(x2, 0.25, z, 0, 0, 0, 2.1, 0.7, 2.1), 0xcfcfcf); }); });
      for (i = 0; i < 5; i++) kb.add(new T.TorusGeometry(3.2 - i * 0.12, 0.09, 6, 44), mat(i < 2 ? -6 : 6, 7.9, i % 2 ? -5 : 5, Math.PI / 2, 0, 0, 1 + (i % 2) * 0.2), 0xf2dba0);
      kb.add(box, mat(0, -0.02, 0, 0, 0, 0, 34, 0.12, 26), 0x8a7a58);
      K.add(kb.mesh(eng({ vcol: 1, freq: 3.2, dir: V(0.2, 1, 0.25), ink: 0xD9B86A, bg: 0x130d12, amb: 0.36, rim: 0.4 })));
      var cands = [], rings = new Bag(), flames = new Bag();
      [[-7, 5], [7, 5], [-7, -5], [7, -5]].forEach(function (c, ci) {
        [[2.5, 5.9, 26], [1.7, 5.2, 18]].forEach(function (t) {
          rings.add(new T.TorusGeometry(t[0], 0.05, 6, 48), mat(c[0], t[1], c[1], Math.PI / 2, 0, 0), 0xffffff);
          for (var q = 0; q < t[2]; q++) { var an = q / t[2] * TAU; flames.add(new T.CylinderGeometry(0.06, 0.06, 0.55, 6), mat(c[0] + Math.cos(an) * t[0], t[1] + 0.32, c[1] + Math.sin(an) * t[0]), 0xffffff); if (q % 3 === 0) rings.add(new T.CylinderGeometry(0.012, 0.012, 8 - t[1], 4), mat(c[0] + Math.cos(an) * t[0] * 0.75, t[1] + (8 - t[1]) / 2, c[1] + Math.sin(an) * t[0] * 0.75), 0xffffff); }
        });
        var g = glow(0xffdf9a, 8.5, 0.5); g.position.set(c[0], 5.8, c[1]); K.add(g); cands.push(g);
      });
      K.add(rings.mesh(eng({ vcol: 1, freq: 8, ink: C.lite, amb: 0.5 }))); K.add(flames.mesh(new T.MeshBasicMaterial({ color: 0xffefc4 })));
      var neonCols = [0xff3b6b, 0x7a4bff, 0x3f8cff, 0xff5a3c, 0xff3b9a, 0x4bd0ff, 0x9a4bff, 0xff3b6b], wash2 = [];
      [-16.6, 16.6].forEach(function (x2, xi) { [-11, -3.7, 3.7, 11].forEach(function (z, zi) { var g2 = glow(neonCols[xi * 4 + zi], 7, 0.42); g2.position.set(x2 * 0.96, 3.2, z); K.add(g2); wash2.push(g2); }); });

      /* key fob, handed over */
      var key = new T.Group(), kf = new Bag(); kf.add(box, mat(0, 0, 0, 0, 0, 0, 0.2, 0.34, 0.07), 0x1c1f25); kf.add(box, mat(0, 0.05, 0.04, 0, 0, 0, 0.1, 0.06, 0.02), 0xC9202B); kf.add(new T.TorusGeometry(0.1, 0.014, 6, 24), mat(0, 0.27, 0), 0xc9ced6); kf.add(box, mat(0, -0.3, 0, 0, 0, 0, 0.05, 0.28, 0.02), 0xc9ced6);
      var keyM = kf.mesh(eng({ vcol: 1, hatch: 'obj', freq: 40, ink: 0xffffff, solid: 0.6, amb: 0.5, rim: 1, spec: 0.8 })); key.add(keyM); key.add(edges(keyM.geometry, C.lite, 0.8)); var kg = glow(0xF2DBA0, 1.7, 0.5); key.add(kg); Z.add(key);

      tick(function (S) {
        if (!Z.visible) return;
        bulbs.forEach(function (o, j) { o.material.opacity = 0.35 + 0.65 * Math.pow(0.5 + 0.5 * Math.sin(S.t * 6 - j * 0.55), 2); });
        A.visible = S.g < 7.9; rn.material.opacity = 0.86 + S.beat * 0.14 - (Math.sin(S.t * 13) > 0.985 ? 0.5 : 0);
        cands.forEach(function (o, j) { o.material.opacity = 0.42 + 0.06 * Math.sin(S.t * 5 + j * 2) + S.beat * 0.12; });
        wash2.forEach(function (o, j) { o.material.opacity = 0.3 + 0.2 * Math.sin(S.t * 1.1 + j * 1.3) + S.beat * 0.12; });
        var k = clamp((S.g - 7.5) / 0.22, 0, 1), u = Math.max(k * 0.35, S.keys); key.visible = S.g > 7.46 && S.g < 8.15;
        toWorld(S2, lerp(1.5, -3.1, u), 1.32 + Math.sin(u * Math.PI) * 0.8 + Math.sin(S.t * 2) * 0.04, lerp(-1.2, -4.6, u), key.position); key.rotation.set(Math.sin(S.t) * 0.3, S.t * 1.6, Math.sin(S.t * 1.3) * 0.2); key.scale.setScalar(1.15);
      });
      return { S2: S2 };
    }());

    /* ======================================================== TRAFFIC
       Oncoming headlights and tail lights ahead: the road is never empty, so
       it never stops moving even when the visitor does. */
    (function () {
      var N = lite ? 6 : 10, cars = [], R = rng(91);
      for (var i = 0; i < N; i++) {
        var on = i % 5 !== 4, g = new T.Group(), c = on ? 0xfff0cc : 0xff2838;
        [-0.6, 0.6].forEach(function (x) { var l = glow(c, on ? 2.3 : 1.5, 0.95); l.position.set(x, 0.75, 0); g.add(l); });
        var streak = new T.Mesh(new T.PlaneGeometry(2.6, 9), new T.ShaderMaterial({ transparent: true, depthWrite: false, blending: T.AdditiveBlending, uniforms: { uC: { value: new T.Color(c) } }, vertexShader: 'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }', fragmentShader: 'uniform vec3 uC; varying vec2 vUv; void main(){ float a=pow(1.0-abs(vUv.x-0.5)*2.0,2.0)*pow(1.0-vUv.y,1.6)*0.2; gl_FragColor=vec4(uC*a,1.0); }' }));
        streak.rotation.x = -Math.PI / 2; streak.position.set(0, 0.04, on ? 4.5 : -4.5); if (!on) streak.rotation.z = Math.PI; g.add(streak);
        scene.add(g); cars.push({ g: g, on: on, off: i * (520 / N) + R() * 20, v: on ? 25 + R() * 8 : 7 + R() * 3 });
      }
      tick(function (S) {
        cars.forEach(function (c) {
          var span = 560, rel = c.on ? span - ((S.t * c.v + c.off) % span) - 90 : ((S.t * c.v + c.off) % 330) + 40;
          var s = S.s + rel; c.g.visible = s > -60 && s < 2150 && S.g < 7.75 && !(S.ambient && s > 2100);
          if (!c.g.visible) return; place(c.g, s, c.on ? -2.3 : 2.3, 0, 0);
        });
      });
    }());

    /* ======================================================== PER FRAME */
    var SKY = [
      [0, 0x04070f, 0x191424, 0x9a5f26, 1], [1.2, 0x050912, 0x121a2c, 0x6b4a2a, 1], [3, 0x040815, 0x0c1630, 0x2a3458, 0.2], [4.6, 0x030614, 0x0b1430, 0x23365e, -0.4],
      [5.6, 0x060c1e, 0x141f40, 0x2c3c6c, -0.8], [6.6, 0x0a0f26, 0x2a2347, 0x7a3f6a, -1], [7.6, 0x0e1230, 0x46294f, 0xd2607a, -1], [9, 0x0a0f28, 0x33214a, 0xc05a78, 1]
    ].map(function (r) { return { g: r[0], z: new T.Color(r[1]), h: new T.Color(r[2]), c: new T.Color(r[3]), d: r[4] }; });
    var FOG = new T.Color();

    function skyAt(g) {
      var i = 0; while (i < SKY.length - 2 && SKY[i + 1].g < g) i++;
      var a = SKY[i], b = SKY[i + 1], t = clamp((g - a.g) / (b.g - a.g), 0, 1);
      skyU.uZen.value.copy(a.z).lerp(b.z, t); skyU.uHor.value.copy(a.h).lerp(b.h, t); skyU.uGlow.value.copy(a.c).lerp(b.c, t); skyU.uGZ.value = lerp(a.d, b.d, t);
      FOG.copy(skyU.uHor.value).multiplyScalar(0.72); U.uFog.value.copy(FOG);
    }

    var cv = V(0, 0, 0), fw = V(0, 0, 0), wheelRot = 0, lastS = null;
    /** S: {t, dt, g, s, beat, bump, hold, holdAmt, ignition, sceneId, pick, hoverPick, ray, tilt, keys, hatch, ambient} */
    function update(S) {
      U.uTime.value = S.t; U.uBeat.value = S.beat; U.uWave.value += ((S.bump * 0.55) * (0.35 + S.beat) - U.uWave.value) * 0.25;
      skyAt(S.g);
      for (var i = 0; i < zones.length; i++) zones[i].g.visible = S.s > zones[i].a - 130 && S.s < zones[i].b + 60 || (S.camS !== undefined && S.camS > zones[i].a - 60 && S.camS < zones[i].b + 60);

      /* car */
      toWorld(S.s, 2.15, 0, 0, cv); var f = frame(S.s);
      car.root.position.copy(cv); car.root.rotation.set(f.pitch, f.yaw, 0, 'YXZ');
      var bob = S.beat * (0.012 + S.bump * 0.05); car.body.position.y = bob + Math.sin(S.t * 22) * 0.0016 * (1 + S.rev * 5); car.body.rotation.z = Math.sin(S.t * 1.1) * 0.003 + Math.sin(S.t * 40) * 0.004 * S.rev; car.body.rotation.x = -S.beat * 0.006 * S.bump;
      if (lastS === null) lastS = S.s; wheelRot -= (S.s - lastS) / 0.355; lastS = S.s; car.wheels.forEach(function (w) { w.rotation.x = wheelRot; });
      U.uCar.value.copy(cv);
      fw.set(f.fx, Math.tan(f.pitch) - 0.075, f.fz).normalize(); U.uHeadDir.value.copy(fw); U.uHead.value.set(cv.x + f.fx * 2.3, cv.y + 0.75, cv.z + f.fz * 2.3);
      U.uTail.value.set(cv.x - f.fx * 2.6, cv.y + 0.6, cv.z - f.fz * 2.6);
      var on = S.ignition, flick = on > 0.05 && on < 0.95 ? (Math.sin(S.t * 60) > 0 ? 1 : 0.35) : 1;
      U.uHeadOn.value = on * flick; U.uTailOn.value = 0.25 + on * 0.45 + (S.brake || 0) * 0.5; car.beam.uOn.value = on * flick;
      car.heads.forEach(function (h) { h.material.opacity = 0.22 + on * flick * 0.7 + S.flare; h.scale.setScalar(0.9 + on * 0.55 + S.flare * 5 + S.beat * 0.15); });
      car.tails.forEach(function (h) { h.material.opacity = 0.2 + on * 0.4 + (S.brake || 0) * 0.3; });
      car.headM.color.setScalar(1).multiplyScalar(0.6 + on * 0.4); car.headM.color.b *= 0.86; car.tailM.color.setRGB(0.35 + on * 0.65, 0.05, 0.09);
      car.cabin.material.opacity = 0.16 + on * 0.16 + S.beat * 0.18;
      car.hatch.rotation.x = -1.5 * S.hatch;
      var thump = S.beat * (0.35 + S.bump); car.subs.forEach(function (c, k) { c.position.z = thump * 0.05; c.scale.setScalar(1 + thump * 0.06); });
      car.leds.forEach(function (l) { l.material.color.copy(U.uAccent.value).lerp(FOG.set(0xff2a35), 0.65).multiplyScalar(0.7 + S.beat * 0.8); });
      car.subGlow.material.opacity = S.hatch * (0.25 + S.beat * 0.5 + S.bump * 0.2); car.subGlow.scale.setScalar(1.7 + S.beat * 1.1 + S.bump * 0.8);
      car.rings.forEach(function (r, k) { var q = (S.beatPhase + k / car.rings.length) % 1, a = S.hatch * S.bump * (1 - q) * 0.7; r.visible = a > 0.01; r.material.opacity = a; r.scale.setScalar(0.4 + q * 7); r.position.z = 2 + q * 2.4; });

      for (i = 0; i < ticks.length; i++) ticks[i](S);

      /* the points change homes */
      var w = cloud.u.uW.value, g = S.g, a0 = 1 - sm(0.28, 0.82, g), d0 = sm(3.75, 4.45, g) * (1 - sm(7.55, 8.35, g)), n0 = sm(7.55, 8.35, g);
      w[0] = a0; w[2] = d0; w[3] = n0; w[1] = clamp(1 - a0 - d0 - n0, 0, 1);
      cloud.u.uTilt.value.set(S.tilt.x * 0.3, S.tilt.y * 0.25); cloud.u.uGain.value = S.ambient ? 0.8 : 1;
    }

    return { scene: scene, U: U, car: car, sky: sky, cloud: cloud, picks: picks, frame: frame, toWorld: toWorld, terrainY: terrainY, update: update, L: L, anchors: { wash: wash.S0, net: net.S0, netY: net.gy, sae: sae.S0, reno: reno.S2 } };
  };
}());
