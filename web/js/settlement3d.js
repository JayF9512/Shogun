/* ============================================================
   settlement3d.js — Procedural low-poly 3D settlement built on
   Three.js (r128). Isometric orthographic camera, pan + zoom,
   clickable buildings, wandering civilians, cherry trees, lanterns.
   Locked buildings render as grey ruins; unlocked ones are lit.
   Fails gracefully (static image) when WebGL is unavailable.
   ============================================================ */
(function () {
  'use strict';

  // Building plots. unlockStep = tutorial currentStep at which it lights up.
  var LAYOUT = [
    { key: 'tenshu', name: 'Tenshu Keep', x: 0, z: 0, w: 3.2, h: 4.4, tiers: 3, roof: '#8b1a1a', unlockStep: 2 },
    { key: 'farm', name: 'Rice Paddies', x: -6, z: -2, w: 2.4, h: 1.3, tiers: 1, roof: '#6b8e23', unlockStep: 3 },
    { key: 'lumberyard', name: 'Timber Camp', x: -6, z: 3, w: 2.4, h: 1.6, tiers: 1, roof: '#7a4a24', unlockStep: 3 },
    { key: 'quarry', name: 'Stone Quarry', x: 6, z: -3, w: 2.6, h: 1.5, tiers: 1, roof: '#6d7078', unlockStep: 4 },
    { key: 'barracks', name: 'Barracks', x: 5.5, z: 3.5, w: 3, h: 2, tiers: 2, roof: '#3a5a8c', unlockStep: 5 },
    { key: 'blacksmith', name: 'Blacksmith', x: -3, z: 6, w: 2.2, h: 1.8, tiers: 1, roof: '#4a4a52', unlockStep: 6 },
    { key: 'stable', name: 'Komainu Stable', x: 3.5, z: 6.5, w: 2.6, h: 1.7, tiers: 1, roof: '#8c6a3a', unlockStep: 8 },
    { key: 'shrine', name: 'Shrine', x: 0, z: -7, w: 2, h: 2.4, tiers: 2, roof: '#b0392b', unlockStep: 9 },
    { key: 'market', name: 'Merchant Market', x: -7, z: 7, w: 2.6, h: 1.6, tiers: 1, roof: '#a8862c', unlockStep: 12 }
  ];

  function Settlement3D(container) {
    this.container = container;
    this.buildings = [];
    this.civilians = [];
    this._raf = null;
    this._ok = false;
    this._t = 0;
  }

  Settlement3D.prototype.init = function () {
    if (typeof THREE === 'undefined') { this._fallback('3D engine unavailable'); return false; }
    try {
      this._build();
      this._ok = true;
      return true;
    } catch (e) {
      console.error('Settlement3D init failed', e);
      this._fallback('WebGL not supported');
      return false;
    }
  };

  Settlement3D.prototype._fallback = function (msg) {
    this.container.innerHTML =
      '<div class="bg-cover" style="background-image:url(assets/images/settlement.webp)"></div>' +
      '<div class="bg-scrim" style="background:linear-gradient(180deg,rgba(7,5,15,0.2),rgba(7,5,15,0.75))"></div>';
  };

  Settlement3D.prototype._build = function () {
    var W = this.container.clientWidth || 400;
    var H = this.container.clientHeight || 600;

    var scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0716);
    scene.fog = new THREE.Fog(0x0a0716, 26, 46);
    this.scene = scene;

    // Isometric orthographic camera
    var aspect = W / H;
    var d = 12;
    var cam = new THREE.OrthographicCamera(-d * aspect, d * aspect, d, -d, 0.1, 200);
    cam.position.set(18, 18, 18);
    cam.lookAt(0, 0, 0);
    this.camera = cam;
    this._camD = d; this._aspect = aspect;

    var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(W, H);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.innerHTML = '';
    this.container.appendChild(renderer.domElement);
    this.renderer = renderer;

    // Lights
    scene.add(new THREE.AmbientLight(0x9988bb, 0.55));
    var dir = new THREE.DirectionalLight(0xffdca8, 0.9);
    dir.position.set(12, 20, 8);
    dir.castShadow = true;
    dir.shadow.mapSize.width = 1024; dir.shadow.mapSize.height = 1024;
    dir.shadow.camera.left = -20; dir.shadow.camera.right = 20;
    dir.shadow.camera.top = 20; dir.shadow.camera.bottom = -20;
    scene.add(dir);
    var fill = new THREE.DirectionalLight(0x5566aa, 0.35);
    fill.position.set(-10, 8, -6);
    scene.add(fill);

    // Ground
    var groundGeo = new THREE.CircleGeometry(22, 48);
    var groundMat = new THREE.MeshStandardMaterial({ color: 0x1b2a1e, roughness: 1 });
    var ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // dirt courtyard
    var court = new THREE.Mesh(
      new THREE.CircleGeometry(9, 40),
      new THREE.MeshStandardMaterial({ color: 0x3a2f24, roughness: 1 })
    );
    court.rotation.x = -Math.PI / 2; court.position.y = 0.01; court.receiveShadow = true;
    scene.add(court);

    // Paths (cross)
    var pathMat = new THREE.MeshStandardMaterial({ color: 0x4a3d2c, roughness: 1 });
    [[16, 2.2, 0], [2.2, 16, 0]].forEach(function (p) {
      var m = new THREE.Mesh(new THREE.PlaneGeometry(p[0], p[1]), pathMat);
      m.rotation.x = -Math.PI / 2; m.position.y = 0.02;
      m.receiveShadow = true; scene.add(m);
    });

    // Buildings
    var self = this;
    LAYOUT.forEach(function (spec) { self._addBuilding(spec); });

    // Trees + lanterns around the ring
    for (var i = 0; i < 10; i++) {
      var a = (i / 10) * Math.PI * 2;
      this._addTree(Math.cos(a) * 13, Math.sin(a) * 13);
    }
    [[-4, -4], [4, -4], [-4, 4], [4, 4], [0, 8], [-8, 0], [8, 0]].forEach(function (p) {
      self._addLantern(p[0], p[1]);
    });

    // Civilians
    for (var c = 0; c < 7; c++) this._addCivilian();

    // Controls
    this._raycaster = new THREE.Raycaster();
    this._mouse = new THREE.Vector2();
    this._bindControls();

    // Apply current tutorial unlock state
    var step = (Game.tutorial && Game.tutorial.currentStep) || 0;
    this.setUnlockedByStep(step);

    this._onResize = this._resize.bind(this);
    window.addEventListener('resize', this._onResize);
    this._animate();
  };

  Settlement3D.prototype._addBuilding = function (spec) {
    var g = new THREE.Group();
    g.position.set(spec.x, 0, spec.z);

    // Stone base
    var base = new THREE.Mesh(
      new THREE.BoxGeometry(spec.w + 0.6, 0.4, spec.w + 0.6),
      new THREE.MeshStandardMaterial({ color: 0x6b6458, roughness: 1 })
    );
    base.position.y = 0.2; base.castShadow = true; base.receiveShadow = true;
    g.add(base);

    // Walls (tiered)
    var wallMat = new THREE.MeshStandardMaterial({ color: 0xe8ddc7, roughness: 0.9 });
    var tierH = spec.h / spec.tiers;
    var roofs = [];
    for (var t = 0; t < spec.tiers; t++) {
      var shrink = 1 - t * 0.18;
      var w = spec.w * shrink;
      var wall = new THREE.Mesh(new THREE.BoxGeometry(w, tierH, w), wallMat);
      wall.position.y = 0.4 + tierH * t + tierH / 2;
      wall.castShadow = true; wall.receiveShadow = true;
      g.add(wall);
      // pagoda roof over each tier
      var roof = new THREE.Mesh(
        new THREE.ConeGeometry(w * 0.92, tierH * 0.7, 4),
        new THREE.MeshStandardMaterial({ color: new THREE.Color(spec.roof), roughness: 0.7 })
      );
      roof.rotation.y = Math.PI / 4;
      roof.position.y = 0.4 + tierH * (t + 1) + tierH * 0.25;
      roof.castShadow = true;
      g.add(roof);
      roofs.push(roof);
    }

    // Lantern light (added when unlocked)
    var lamp = new THREE.PointLight(0xffb347, 0, 8, 2);
    lamp.position.set(0, spec.h + 0.5, 0);
    g.add(lamp);

    this.scene.add(g);
    this.buildings.push({
      group: g, spec: spec, wallMat: wallMat, roofs: roofs, lamp: lamp,
      base: base, unlocked: false
    });
  };

  Settlement3D.prototype._addTree = function (x, z) {
    var g = new THREE.Group();
    g.position.set(x, 0, z);
    var trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.12, 0.18, 1.4, 6),
      new THREE.MeshStandardMaterial({ color: 0x5a3d29 })
    );
    trunk.position.y = 0.7; trunk.castShadow = true; g.add(trunk);
    for (var i = 0; i < 3; i++) {
      var blob = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.7 + Math.random() * 0.3, 0),
        new THREE.MeshStandardMaterial({ color: 0xe38cc0, roughness: 0.9, flatShading: true })
      );
      blob.position.set((Math.random() - 0.5) * 0.8, 1.4 + Math.random() * 0.5, (Math.random() - 0.5) * 0.8);
      blob.castShadow = true; g.add(blob);
    }
    this.scene.add(g);
  };

  Settlement3D.prototype._addLantern = function (x, z) {
    var g = new THREE.Group();
    g.position.set(x, 0, z);
    var post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.06, 0.06, 1.1, 6),
      new THREE.MeshStandardMaterial({ color: 0x2a2a30 })
    );
    post.position.y = 0.55; g.add(post);
    var lantern = new THREE.Mesh(
      new THREE.BoxGeometry(0.3, 0.4, 0.3),
      new THREE.MeshStandardMaterial({ color: 0xc0392b, emissive: 0xff6a3a, emissiveIntensity: 0.8 })
    );
    lantern.position.y = 1.2; g.add(lantern);
    var light = new THREE.PointLight(0xff7a3a, 0.5, 5, 2);
    light.position.y = 1.2; g.add(light);
    this.scene.add(g);
  };

  Settlement3D.prototype._addCivilian = function () {
    var g = new THREE.Group();
    var colors = [0xc0392b, 0x2c3e7a, 0x2e7d5b, 0x8a6d3b, 0x6a3d7a];
    var col = colors[Math.floor(Math.random() * colors.length)];
    var body = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.22, 0.7, 8),
      new THREE.MeshStandardMaterial({ color: col })
    );
    body.position.y = 0.35; body.castShadow = true; g.add(body);
    var head = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 10, 8),
      new THREE.MeshStandardMaterial({ color: 0xe8c8a0 })
    );
    head.position.y = 0.82; head.castShadow = true; g.add(head);

    var r = 3 + Math.random() * 5;
    var a = Math.random() * Math.PI * 2;
    g.position.set(Math.cos(a) * r, 0, Math.sin(a) * r);
    this.scene.add(g);
    this.civilians.push({
      group: g, angle: a, radius: r,
      speed: 0.15 + Math.random() * 0.25, dir: Math.random() > 0.5 ? 1 : -1,
      bob: Math.random() * Math.PI * 2
    });
  };

  Settlement3D.prototype.setUnlockedByStep = function (step) {
    this.buildings.forEach(function (b) {
      var unlocked = step >= b.spec.unlockStep;
      b.unlocked = unlocked;
      if (unlocked) {
        b.wallMat.color.set(0xe8ddc7);
        b.wallMat.emissive && b.wallMat.emissive.set(0x000000);
        b.roofs.forEach(function (r) { r.material.color.set(new THREE.Color(b.spec.roof)); r.visible = true; });
        b.lamp.intensity = 1.1;
        b.group.position.y = 0;
        b.group.rotation.z = 0;
      } else {
        // Ruined: grey, dim, roofs collapsed (hidden), slight tilt
        b.wallMat.color.set(0x4a4640);
        b.roofs.forEach(function (r, i) { r.visible = i === 0 ? true : false; if (r.visible) r.material.color.set(0x3a3630); });
        b.lamp.intensity = 0;
        b.group.rotation.z = 0.04;
      }
    });
  };

  Settlement3D.prototype._bindControls = function () {
    var self = this;
    var el = this.renderer.domElement;
    var dragging = false, moved = false, sx = 0, sy = 0;
    var panX = 0, panZ = 0;
    this._pan = { x: 0, z: 0 };

    function down(x, y) { dragging = true; moved = false; sx = x; sy = y; }
    function move(x, y) {
      if (!dragging) return;
      var dx = x - sx, dy = y - sy;
      if (Math.abs(dx) + Math.abs(dy) > 4) moved = true;
      sx = x; sy = y;
      // Pan in screen space -> world offset of camera target
      var f = self._camD / 220;
      self.camera.position.x -= (dx - dy) * f * 0.6;
      self.camera.position.z -= (dx + dy) * f * 0.6;
      self.camera.lookAt(
        self.camera.position.x - 18, 0, self.camera.position.z - 18
      );
    }
    function up(x, y, cx, cy) {
      dragging = false;
      if (!moved) self._pick(cx, cy);
    }

    el.addEventListener('mousedown', function (e) { down(e.clientX, e.clientY); });
    window.addEventListener('mousemove', function (e) { move(e.clientX, e.clientY); });
    window.addEventListener('mouseup', function (e) { if (dragging) up(e.clientX, e.clientY, e.clientX, e.clientY); });

    el.addEventListener('touchstart', function (e) {
      if (e.touches.length === 1) down(e.touches[0].clientX, e.touches[0].clientY);
      else if (e.touches.length === 2) self._pinchStart(e);
    }, { passive: true });
    el.addEventListener('touchmove', function (e) {
      if (e.touches.length === 1) move(e.touches[0].clientX, e.touches[0].clientY);
      else if (e.touches.length === 2) self._pinchMove(e);
    }, { passive: true });
    el.addEventListener('touchend', function (e) {
      if (dragging && e.changedTouches.length) {
        var t = e.changedTouches[0]; up(t.clientX, t.clientY, t.clientX, t.clientY);
      }
    });

    el.addEventListener('wheel', function (e) {
      e.preventDefault();
      self._zoom(e.deltaY > 0 ? 1.1 : 0.9);
    }, { passive: false });
  };

  Settlement3D.prototype._pinchStart = function (e) {
    var dx = e.touches[0].clientX - e.touches[1].clientX;
    var dy = e.touches[0].clientY - e.touches[1].clientY;
    this._pinchDist = Math.sqrt(dx * dx + dy * dy);
  };
  Settlement3D.prototype._pinchMove = function (e) {
    var dx = e.touches[0].clientX - e.touches[1].clientX;
    var dy = e.touches[0].clientY - e.touches[1].clientY;
    var d = Math.sqrt(dx * dx + dy * dy);
    if (this._pinchDist) this._zoom(this._pinchDist / d);
    this._pinchDist = d;
  };

  Settlement3D.prototype._zoom = function (factor) {
    this._camD = Math.max(6, Math.min(22, this._camD * factor));
    var d = this._camD, a = this._aspect;
    this.camera.left = -d * a; this.camera.right = d * a;
    this.camera.top = d; this.camera.bottom = -d;
    this.camera.updateProjectionMatrix();
  };

  Settlement3D.prototype._pick = function (cx, cy) {
    var rect = this.renderer.domElement.getBoundingClientRect();
    this._mouse.x = ((cx - rect.left) / rect.width) * 2 - 1;
    this._mouse.y = -((cy - rect.top) / rect.height) * 2 + 1;
    this._raycaster.setFromCamera(this._mouse, this.camera);
    var meshes = [];
    this.buildings.forEach(function (b) {
      b.group.traverse(function (o) { if (o.isMesh) { o._bref = b; meshes.push(o); } });
    });
    var hits = this._raycaster.intersectObjects(meshes, false);
    if (hits.length) {
      var b = hits[0].object._bref;
      if (b) {
        window.dispatchEvent(new CustomEvent('buildingClicked', {
          detail: { key: b.spec.key, name: b.spec.name, unlocked: b.unlocked }
        }));
      }
    }
  };

  Settlement3D.prototype._resize = function () {
    if (!this.renderer) return;
    var W = this.container.clientWidth, H = this.container.clientHeight;
    if (!W || !H) return;
    this._aspect = W / H;
    var d = this._camD, a = this._aspect;
    this.camera.left = -d * a; this.camera.right = d * a;
    this.camera.top = d; this.camera.bottom = -d;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(W, H);
  };

  Settlement3D.prototype._animate = function () {
    var self = this;
    this._raf = requestAnimationFrame(function () { self._animate(); });
    this._t += 0.016;
    // civilians wander along their ring
    this.civilians.forEach(function (c) {
      c.angle += c.dir * c.speed * 0.01;
      var x = Math.cos(c.angle) * c.radius;
      var z = Math.sin(c.angle) * c.radius;
      c.group.position.x = x; c.group.position.z = z;
      c.group.position.y = Math.abs(Math.sin(self._t * 6 + c.bob)) * 0.06;
      c.group.rotation.y = -c.angle + (c.dir > 0 ? Math.PI / 2 : -Math.PI / 2);
    });
    // flicker unlocked lamps
    this.buildings.forEach(function (b) {
      if (b.unlocked) b.lamp.intensity = 1.0 + Math.sin(self._t * 5 + b.spec.x) * 0.12;
    });
    this.renderer.render(this.scene, this.camera);
  };

  Settlement3D.prototype.dispose = function () {
    if (this._raf) cancelAnimationFrame(this._raf);
    if (this._onResize) window.removeEventListener('resize', this._onResize);
    if (this.renderer) {
      try { this.renderer.forceContextLoss(); this.renderer.dispose(); } catch (e) {}
    }
    this.scene = null; this.buildings = []; this.civilians = [];
  };

  window.Settlement3D = {
    instance: null,
    create: function (container) {
      if (this.instance) this.instance.dispose();
      this.instance = new Settlement3D(container);
      this.instance.init();
      return this.instance;
    },
    LAYOUT: LAYOUT
  };
})();
