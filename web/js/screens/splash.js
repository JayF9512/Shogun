/* splash.js — animated ember intro + boot routing. */
(function () {
  'use strict';

  Screens.splash = {
    render: function (el) {
      el.id = 'splash';
      el.innerHTML =
        '<div class="bg-cover" style="background-image:url(assets/images/splash.webp)"></div>' +
        '<div class="bg-scrim"></div>' +
        '<canvas id="splash-particles"></canvas>' +
        '<div class="splash-content">' +
          '<div class="splash-logo">SHADOWS<br/>OF THE SHOGUN</div>' +
          '<div class="splash-tag">Rise from the ashes</div>' +
          '<div class="splash-bar-wrap">' +
            '<div class="splash-bar"><div class="splash-fill" id="splash-fill"></div></div>' +
            '<div class="splash-pct" id="splash-pct">Awakening the realm\u2026</div>' +
          '</div>' +
        '</div>';

      this._embers(el.querySelector('#splash-particles'));

      var fill = el.querySelector('#splash-fill');
      var pct = el.querySelector('#splash-pct');
      var p = 0;
      var self = this;
      this._timer = setInterval(function () {
        p = Math.min(96, p + Math.random() * 16);
        fill.style.width = p + '%';
      }, 180);

      var done = false;
      function finish(route, params) {
        if (done) return; done = true;
        clearInterval(self._timer);
        fill.style.width = '100%';
        pct.textContent = 'Ready';
        setTimeout(function () { Router.reset(route, params); }, 350);
      }

      // Boot routing
      if (api.isLoggedIn) {
        Game.refreshProfile().then(function (prof) {
          Game.saveSession(prof);
          return Promise.all([
            Game.ensureContent().catch(function () {}),
            Game.refreshResources().catch(function () {}),
            Game.refreshTutorial().catch(function () {})
          ]);
        }).then(function () {
          Game.startPolling();
          finish('settlement');
        }).catch(function (e) {
          if (e && e.status === 401) { api.clearSession(); finish('stateselect'); }
          else finish('stateselect');
        });
      } else {
        // Preload content in the background for a snappy first screen.
        Game.ensureContent().catch(function () {});
        setTimeout(function () { finish('stateselect'); }, 900);
      }
    },

    _embers: function (cv) {
      var ctx = cv.getContext('2d');
      var W, H, parts = [];
      function size() {
        var host = cv.parentElement.getBoundingClientRect();
        W = cv.width = host.width; H = cv.height = host.height;
      }
      size();
      for (var i = 0; i < 46; i++) {
        parts.push({
          x: Math.random() * W, y: Math.random() * H,
          r: 0.6 + Math.random() * 2.2,
          s: 0.2 + Math.random() * 0.8,
          d: Math.random() * Math.PI * 2
        });
      }
      var self = this;
      function frame() {
        self._raf = requestAnimationFrame(frame);
        ctx.clearRect(0, 0, W, H);
        for (var i = 0; i < parts.length; i++) {
          var p = parts[i];
          p.y -= p.s; p.x += Math.sin(p.d += 0.01) * 0.3;
          if (p.y < -6) { p.y = H + 6; p.x = Math.random() * W; }
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(245,180,80,' + (0.25 + p.r / 4) + ')';
          ctx.fill();
        }
      }
      frame();
    },

    destroy: function () {
      if (this._timer) clearInterval(this._timer);
      if (this._raf) cancelAnimationFrame(this._raf);
    }
  };
})();
