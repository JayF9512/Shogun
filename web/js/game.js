/* ============================================================
   Game — central client state + shared UI helpers + formatters.
   ============================================================ */
(function () {
  'use strict';

  // Emoji icons for resources / currencies (keeps the UI lively, no image sprites needed).
  var RESOURCE = {
    RICE:   { ic: '🍚', name: 'Rice' },
    WOOD:   { ic: '🪵', name: 'Wood' },
    STONE:  { ic: '🪨', name: 'Stone' },
    IRON:   { ic: '⛓️', name: 'Iron' },
    CHARCOAL:{ ic: '🔥', name: 'Charcoal' },
    CATALYST:{ ic: '⚗️', name: 'Catalyst' }
  };
  var CURRENCY = {
    JADE:   { ic: '💎', name: 'Jade' },
    GOLD:   { ic: '🪙', name: 'Gold' },
    SILVER: { ic: '🥈', name: 'Silver' },
    HONOUR: { ic: '🎖️', name: 'Honour' },
    FEAR:   { ic: '💀', name: 'Fear' },
    STAMINA:{ ic: '⚡', name: 'Stamina' }
  };

  var Fmt = {
    num: function (n) {
      n = Number(n) || 0;
      if (n >= 1e9) return (n / 1e9).toFixed(2).replace(/\.?0+$/, '') + 'B';
      if (n >= 1e6) return (n / 1e6).toFixed(2).replace(/\.?0+$/, '') + 'M';
      if (n >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
      return String(Math.round(n));
    },
    int: function (n) { return (Number(n) || 0).toLocaleString('en-US'); },
    title: function (s) {
      if (!s) return '';
      return String(s).toLowerCase().replace(/_/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); });
    },
    rewards: function (obj) {
      // {JADE:80, RICE:2000} -> "💎80  🍚2K"
      if (!obj) return '';
      return Object.keys(obj).map(function (k) {
        var meta = CURRENCY[k] || RESOURCE[k];
        var ic = meta ? meta.ic : '🎁';
        var label = k === 'heroShards' ? '🧩' : ic;
        return label + Fmt.num(obj[k]);
      }).join('  ');
    },
    countdown: function (ms) {
      if (ms <= 0) return 'Arrived';
      var s = Math.floor(ms / 1000);
      var h = Math.floor(s / 3600); s -= h * 3600;
      var m = Math.floor(s / 60); s -= m * 60;
      function p(x) { return (x < 10 ? '0' : '') + x; }
      return (h > 0 ? h + ':' : '') + p(m) + ':' + p(s);
    },
    timeLeft: function (endsAt) {
      var ms = new Date(endsAt).getTime() - Date.now();
      if (ms <= 0) return 'Ended';
      var d = Math.floor(ms / 86400000);
      var h = Math.floor((ms % 86400000) / 3600000);
      var m = Math.floor((ms % 3600000) / 60000);
      if (d > 0) return d + 'd ' + h + 'h';
      if (h > 0) return h + 'h ' + m + 'm';
      return m + 'm';
    }
  };

  var Game = {
    profile: null,
    resources: null,        // [{resource,amount,capacity,productionPerHour}]
    content: {},            // cached static catalogues
    marches: [],

    // Cache static content once per session.
    ensureContent: function () {
      if (this._contentLoaded) return Promise.resolve(this.content);
      var self = this;
      return Promise.all([
        api.getHeroes().catch(function () { return []; }),
        api.getTroops().catch(function () { return []; }),
        api.getBuildings().catch(function () { return []; }),
        api.getPets().catch(function () { return []; })
      ]).then(function (r) {
        self.content = { heroes: r[0] || [], troops: r[1] || [], buildings: r[2] || [], pets: r[3] || [] };
        self._contentLoaded = true;
        return self.content;
      });
    },

    refreshProfile: function () {
      var self = this;
      return api.getProfile().then(function (p) { self.profile = p; return p; });
    },
    refreshResources: function () {
      var self = this;
      return api.getResources().then(function (r) { self.resources = (r && r.resources) || []; return self.resources; });
    },

    displayName: function () {
      if (this.profile && this.profile.displayName) return this.profile.displayName;
      return localStorage.getItem('shogun_displayName') || 'Warrior';
    },
    reset: function () { this.profile = null; this.resources = null; this.marches = []; }
  };

  // ---------- UI helpers (toast / loader) ----------
  var UI = {
    _loaderCount: 0,
    loading: function (on) {
      var el = document.getElementById('loader');
      if (on) { this._loaderCount++; el.classList.remove('hidden'); }
      else { this._loaderCount = Math.max(0, this._loaderCount - 1); if (this._loaderCount === 0) el.classList.add('hidden'); }
    },
    toast: function (msg, type) {
      var layer = document.getElementById('toast-layer');
      var t = document.createElement('div');
      t.className = 'toast ' + (type === 'error' ? 'err' : type === 'success' ? 'ok' : '');
      var ic = type === 'error' ? '⚠️' : type === 'success' ? '✅' : '📜';
      t.innerHTML = '<span class="tic">' + ic + '</span><span>' + msg + '</span>';
      layer.appendChild(t);
      setTimeout(function () { t.classList.add('out'); setTimeout(function () { t.remove(); }, 300); }, 2600);
    },
    err: function (e) { this.toast((e && e.message) || 'Something went wrong.', 'error'); },
    ok: function (m) { this.toast(m, 'success'); }
  };

  window.Game = Game;
  window.UI = UI;
  window.Fmt = Fmt;
  window.RESOURCE = RESOURCE;
  window.CURRENCY = CURRENCY;
})();
