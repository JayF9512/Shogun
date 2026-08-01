/* ============================================================
   worldmap.js — Canvas 2D strategic map. 1200x1200 logical world,
   pan + zoom, painted background, region rings, and interactive
   nodes (resource / monster / castle). Real tiles from /map/tiles
   are drawn when present; otherwise a seeded field is generated so
   the realm always feels alive.
   ============================================================ */
(function () {
  'use strict';

  var MAP_SIZE = 1200;

  // Deterministic PRNG so the generated realm is stable between views.
  function seeded(seed) {
    return function () {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
  }

  function genNodes(playerCastle) {
    var rnd = seeded(1337);
    var nodes = [];
    var resTypes = ['RICE', 'WOOD', 'STONE', 'IRON'];
    // resource fields
    for (var i = 0; i < 26; i++) {
      nodes.push({
        type: 'resource',
        res: resTypes[Math.floor(rnd() * resTypes.length)],
        level: 1 + Math.floor(rnd() * 5),
        x: 120 + rnd() * (MAP_SIZE - 240),
        y: 120 + rnd() * (MAP_SIZE - 240)
      });
    }
    // monsters
    var mnames = ['Oni Marauder', 'Kappa Raider', 'Tengu Warband', 'Yurei Host', 'Nue Beast'];
    for (var m = 0; m < 12; m++) {
      nodes.push({
        type: 'monster',
        name: mnames[Math.floor(rnd() * mnames.length)],
        level: 1 + Math.floor(rnd() * 8),
        x: 100 + rnd() * (MAP_SIZE - 200),
        y: 100 + rnd() * (MAP_SIZE - 200)
      });
    }
    // rival castles
    for (var c = 0; c < 6; c++) {
      nodes.push({
        type: 'castle',
        name: 'Warlord ' + String.fromCharCode(65 + c),
        power: (5 + Math.floor(rnd() * 40)) * 1000,
        x: 160 + rnd() * (MAP_SIZE - 320),
        y: 160 + rnd() * (MAP_SIZE - 320)
      });
    }
    if (playerCastle) nodes.push(playerCastle);
    return nodes;
  }

  function WorldMap(container, onNode) {
    this.container = container;
    this.onNode = onNode || function () {};
    this.scale = 0.42;
    this.minScale = 0.28; this.maxScale = 1.6;
    this.ox = 0; this.oy = 0; // pan offset (screen px)
    this._img = null;
    this._built = false;
  }

  WorldMap.prototype.init = function () {
    var self = this;
    var cv = document.createElement('canvas');
    this.canvas = cv;
    this.container.appendChild(cv);
    this.ctx = cv.getContext('2d');

    // player castle center of map
    this.player = { type: 'player', name: Game.displayName(), x: MAP_SIZE / 2, y: MAP_SIZE / 2, power: (Game.profile && Number(Game.profile.power)) || 0 };
    this.nodes = genNodes(this.player);

    // Try to overlay real tiles (seed returns none, but wire it up honestly).
    if (api.isLoggedIn && api.stateId) {
      api.getTiles(api.stateId, 600, 600, 600).then(function (d) {
        if (d && d.tiles && d.tiles.length) {
          d.tiles.forEach(function (t) {
            self.nodes.push({
              type: (t.type || 'resource').toLowerCase(),
              res: t.resource, level: t.level || 1, name: t.name,
              x: t.x, y: t.y, real: true
            });
          });
          self.draw();
        }
      }).catch(function () {});
    }

    this._bg = new Image();
    this._bg.onload = function () { self._img = self._bg; self.draw(); };
    this._bg.src = 'assets/images/world-map.webp';

    this._resize();
    // center on player
    this._centerOn(this.player.x, this.player.y);
    this._bind();
    this._built = true;
    this.draw();

    this._onResize = this._resize.bind(this);
    window.addEventListener('resize', this._onResize);
  };

  WorldMap.prototype._resize = function () {
    var W = this.container.clientWidth, H = this.container.clientHeight;
    if (!W || !H) { W = 400; H = 600; }
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = W * dpr; this.canvas.height = H * dpr;
    this.canvas.style.width = W + 'px'; this.canvas.style.height = H + 'px';
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.vw = W; this.vh = H;
    this.draw();
  };

  WorldMap.prototype._centerOn = function (wx, wy) {
    this.ox = this.vw / 2 - wx * this.scale;
    this.oy = this.vh / 2 - wy * this.scale;
  };

  WorldMap.prototype._w2s = function (x, y) {
    return { x: x * this.scale + this.ox, y: y * this.scale + this.oy };
  };

  WorldMap.prototype._bind = function () {
    var self = this, cv = this.canvas;
    var dragging = false, moved = false, sx = 0, sy = 0;
    cv.addEventListener('mousedown', function (e) { dragging = true; moved = false; sx = e.clientX; sy = e.clientY; });
    window.addEventListener('mousemove', function (e) {
      if (!dragging) return;
      var dx = e.clientX - sx, dy = e.clientY - sy;
      if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
      self.ox += dx; self.oy += dy; sx = e.clientX; sy = e.clientY; self.draw();
    });
    window.addEventListener('mouseup', function (e) {
      if (dragging && !moved) self._pick(e.clientX, e.clientY);
      dragging = false;
    });
    cv.addEventListener('wheel', function (e) {
      e.preventDefault(); self._zoomAt(e.clientX, e.clientY, e.deltaY > 0 ? 0.9 : 1.1);
    }, { passive: false });

    cv.addEventListener('touchstart', function (e) {
      if (e.touches.length === 1) { dragging = true; moved = false; sx = e.touches[0].clientX; sy = e.touches[0].clientY; }
      else if (e.touches.length === 2) self._pd = self._touchDist(e);
    }, { passive: true });
    cv.addEventListener('touchmove', function (e) {
      if (e.touches.length === 1 && dragging) {
        var dx = e.touches[0].clientX - sx, dy = e.touches[0].clientY - sy;
        if (Math.abs(dx) + Math.abs(dy) > 3) moved = true;
        self.ox += dx; self.oy += dy; sx = e.touches[0].clientX; sy = e.touches[0].clientY; self.draw();
      } else if (e.touches.length === 2) {
        var d = self._touchDist(e);
        var mid = self._touchMid(e);
        if (self._pd) self._zoomAt(mid.x, mid.y, d / self._pd);
        self._pd = d;
      }
    }, { passive: true });
    cv.addEventListener('touchend', function (e) {
      if (dragging && !moved && e.changedTouches.length) {
        var t = e.changedTouches[0]; self._pick(t.clientX, t.clientY);
      }
      dragging = false; self._pd = 0;
    });
  };

  WorldMap.prototype._touchDist = function (e) {
    var dx = e.touches[0].clientX - e.touches[1].clientX;
    var dy = e.touches[0].clientY - e.touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };
  WorldMap.prototype._touchMid = function (e) {
    return { x: (e.touches[0].clientX + e.touches[1].clientX) / 2, y: (e.touches[0].clientY + e.touches[1].clientY) / 2 };
  };

  WorldMap.prototype._zoomAt = function (cx, cy, factor) {
    var rect = this.canvas.getBoundingClientRect();
    var mx = cx - rect.left, my = cy - rect.top;
    var wx = (mx - this.ox) / this.scale, wy = (my - this.oy) / this.scale;
    this.scale = Math.max(this.minScale, Math.min(this.maxScale, this.scale * factor));
    this.ox = mx - wx * this.scale; this.oy = my - wy * this.scale;
    this.draw();
  };

  WorldMap.prototype._nodeRadius = function () { return Math.max(9, 13 * this.scale + 5); };

  WorldMap.prototype._pick = function (cx, cy) {
    var rect = this.canvas.getBoundingClientRect();
    var mx = cx - rect.left, my = cy - rect.top;
    var r = this._nodeRadius() + 6;
    var best = null, bestD = r * r;
    for (var i = 0; i < this.nodes.length; i++) {
      var s = this._w2s(this.nodes[i].x, this.nodes[i].y);
      var dx = s.x - mx, dy = s.y - my, d = dx * dx + dy * dy;
      if (d < bestD) { bestD = d; best = this.nodes[i]; }
    }
    if (best) this.onNode(best);
  };

  WorldMap.prototype.draw = function () {
    if (!this.ctx) return;
    var ctx = this.ctx;
    ctx.clearRect(0, 0, this.vw, this.vh);
    ctx.fillStyle = '#0b1420';
    ctx.fillRect(0, 0, this.vw, this.vh);

    var tl = this._w2s(0, 0), br = this._w2s(MAP_SIZE, MAP_SIZE);
    // background image mapped to world bounds
    if (this._img) {
      ctx.globalAlpha = 0.9;
      ctx.drawImage(this._img, tl.x, tl.y, br.x - tl.x, br.y - tl.y);
      ctx.globalAlpha = 1;
    }
    // world border
    ctx.strokeStyle = 'rgba(245,200,66,0.5)'; ctx.lineWidth = 2;
    ctx.strokeRect(tl.x, tl.y, br.x - tl.x, br.y - tl.y);

    // grid
    ctx.strokeStyle = 'rgba(255,255,255,0.05)'; ctx.lineWidth = 1;
    for (var g = 0; g <= MAP_SIZE; g += 150) {
      var a = this._w2s(g, 0), b = this._w2s(g, MAP_SIZE);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      var c = this._w2s(0, g), d = this._w2s(MAP_SIZE, g);
      ctx.beginPath(); ctx.moveTo(c.x, c.y); ctx.lineTo(d.x, d.y); ctx.stroke();
    }

    var self = this;
    var R = this._nodeRadius();
    // draw non-player nodes first
    this.nodes.forEach(function (n) { if (n.type !== 'player') self._drawNode(n, R); });
    // player castle on top with gold ring
    this._drawNode(this.player, R);
  };

  WorldMap.prototype._drawNode = function (n, R) {
    var ctx = this.ctx;
    var s = this._w2s(n.x, n.y);
    if (s.x < -40 || s.x > this.vw + 40 || s.y < -40 || s.y > this.vh + 40) return;
    var color, label;
    if (n.type === 'player') { color = '#f5c842'; label = 'You'; }
    else if (n.type === 'castle') { color = '#c0392b'; label = 'Lv' + Math.max(1, Math.round((n.power || 0) / 5000)); }
    else if (n.type === 'monster') { color = '#9b59b6'; label = 'Lv' + n.level; }
    else { color = '#27ae60'; label = (TERMS.resources[n.res] || 'Node').slice(0, 4); }

    // glow
    ctx.beginPath(); ctx.arc(s.x, s.y, R + 3, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0,0,0,0.45)'; ctx.fill();

    ctx.beginPath(); ctx.arc(s.x, s.y, R, 0, Math.PI * 2);
    ctx.fillStyle = color; ctx.fill();
    ctx.lineWidth = n.type === 'player' ? 3 : 1.5;
    ctx.strokeStyle = n.type === 'player' ? '#fff6cf' : 'rgba(0,0,0,0.5)';
    ctx.stroke();

    // inner glyph
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.font = 'bold ' + Math.round(R * 0.9) + 'px serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    var glyph = n.type === 'castle' ? '\u25B2' : n.type === 'monster' ? '\u2605' : n.type === 'player' ? '\u2691' : '\u25C6';
    ctx.fillText(glyph, s.x, s.y + 1);

    // label
    if (this.scale > 0.34) {
      ctx.fillStyle = '#f0e6cc';
      ctx.font = '10px "Noto Sans JP", sans-serif';
      ctx.fillText(label, s.x, s.y + R + 10);
    }
  };

  WorldMap.prototype.dispose = function () {
    if (this._onResize) window.removeEventListener('resize', this._onResize);
    this.ctx = null;
  };

  window.WorldMap = {
    instance: null,
    MAP_SIZE: MAP_SIZE,
    create: function (container, onNode) {
      if (this.instance) this.instance.dispose();
      this.instance = new WorldMap(container, onNode);
      this.instance.init();
      return this.instance;
    }
  };
})();
