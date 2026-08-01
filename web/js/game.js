/* ============================================================
   game.js — central state, terminology, formatters, icon library.
   ============================================================ */
(function () {
  'use strict';

  // ---------------- Inline SVG icon library (no emoji) ----------------
  // Each returns an <svg> string. Colors chosen to read on dark panels.
  var P = {
    rice: '#e8d98a', wood: '#c08a4a', stone: '#9aa4ad', iron: '#8fa3c4',
    charcoal: '#6d7078', catalyst: '#c77dff', jade: '#2ecc71', honour: '#f5c842',
    silver: '#cdd6e0', gold: '#f5c842'
  };
  function svg(inner, vb) { return '<svg viewBox="' + (vb || '0 0 24 24') + '" xmlns="http://www.w3.org/2000/svg">' + inner + '</svg>'; }

  var ICONS = {
    rice: svg('<path fill="' + P.rice + '" d="M12 2c1.5 2 2 4 1 6 1.8-.6 3-.2 4 1-1.2 1.4-2.6 2-4.2 1.8V13c2-1 3.6-.8 5 .6-1.4 1.8-3.2 2.4-5 2v1c2.2-.4 3.8.4 4.8 2.2-2 1-3.8.8-5.4-.4-1.6 1.2-3.4 1.4-5.4.4C7.8 17 9.4 16.2 11.6 16.6v-1c-1.8.4-3.6-.2-5-2 1.4-1.4 3-1.6 5-.6v-2.2C10 11 8.6 10.4 7.4 9c1-1.2 2.2-1.6 4-1-1-2-.5-4 1-6z"/>'),
    wood: svg('<path fill="' + P.wood + '" d="M4 7c0-1.5 1.8-2.5 4-2.5S12 5.5 12 7v11c0 1.5-1.8 2.5-4 2.5S4 19.5 4 18z"/><ellipse cx="8" cy="7" rx="4" ry="2.2" fill="#a06a35"/><circle cx="8" cy="7" r="1.1" fill="#7a4e24"/><path fill="' + P.wood + '" d="M13 10c0-1.3 1.6-2.2 3.5-2.2S20 8.7 20 10v8c0 1.3-1.6 2.2-3.5 2.2S13 19.3 13 18z" opacity=".85"/><ellipse cx="16.5" cy="10" rx="3.5" ry="2" fill="#a06a35"/>'),
    stone: svg('<path fill="' + P.stone + '" d="M6 13l3-5 5-1 4 4 1 5-6 3-6-1z"/><path fill="#7f8890" d="M9 8l5-1 1 6-6 2z" opacity=".6"/>'),
    iron: svg('<path fill="' + P.iron + '" d="M7 4h10l-1.5 5h-7z"/><path fill="#6f83a4" d="M8.5 9h7l1 8-4.5 3-4.5-3z"/><path fill="#b6c6e0" d="M12 9v11" opacity=".4"/>'),
    charcoal: svg('<path fill="' + P.charcoal + '" d="M5 14l4-7 6 1 4 6-3 5H8z"/><path fill="#4c4f56" d="M9 7l6 1-3 4z" opacity=".7"/><circle cx="10" cy="16" r="1" fill="#ffb347"/><circle cx="14" cy="15" r=".8" fill="#ff8c37"/>'),
    catalyst: svg('<path fill="' + P.catalyst + '" d="M12 2l2.4 5.6L20 9l-4 4 1 6-5-2.6L7 19l1-6-4-4 5.6-1.4z"/>'),
    jade: svg('<path fill="' + P.jade + '" d="M12 3l7 4v6c0 4-3 6.5-7 8-4-1.5-7-4-7-8V7z"/><path fill="#7bffb0" d="M12 6l4 2.3v4c0 2.4-1.8 3.8-4 4.7z" opacity=".5"/>'),
    honour: svg('<circle cx="12" cy="10" r="6" fill="' + P.honour + '"/><circle cx="12" cy="10" r="3.4" fill="#c8922a"/><path fill="#c0392b" d="M9 15l-2 6 5-2.5L17 21l-2-6z"/>'),
    silver: svg('<circle cx="12" cy="12" r="8" fill="' + P.silver + '"/><circle cx="12" cy="12" r="5" fill="#9aa6b3"/><text x="12" y="16" font-size="8" text-anchor="middle" fill="#e9eef4" font-family="serif">S</text>'),
    gold: svg('<circle cx="12" cy="12" r="8" fill="' + P.gold + '"/><circle cx="12" cy="12" r="5" fill="#c8922a"/>'),
    // UI
    sword: svg('<path fill="#dfe6ee" d="M14 3l7 7-2 2-2-1-6 6 1 2-3 3-1-3-3-1 3-3 2 1 6-6-1-2z"/>'),
    shield: svg('<path fill="#4fc3f7" d="M12 2l8 3v6c0 5-3.5 8-8 11-4.5-3-8-6-8-11V5z"/><path fill="#a5e4ff" d="M12 5l5 2v4c0 3-2 5-5 7z" opacity=".5"/>'),
    scroll: svg('<rect x="5" y="4" width="14" height="16" rx="2" fill="#e8d9b0"/><path stroke="#b39a5f" stroke-width="1.3" d="M8 8h8M8 11h8M8 14h6"/>'),
    castle: svg('<path fill="#f5c842" d="M3 21V9l2 1V7l2 1V6l3-2 3 2v2l2-1v3l2-1v12z"/><rect x="10" y="15" width="4" height="6" fill="#8b0000"/>'),
    timer: svg('<circle cx="12" cy="13" r="8" fill="none" stroke="#f5c842" stroke-width="2"/><path stroke="#f5c842" stroke-width="2" stroke-linecap="round" d="M12 13V9M9 3h6"/>'),
    star: svg('<path fill="#f5c842" d="M12 2l2.9 6.3 6.9.8-5.1 4.7 1.4 6.8L12 17.8 5.9 20.6l1.4-6.8L2.2 9.1l6.9-.8z"/>'),
    banner: svg('<path fill="#c0392b" d="M6 3h12v14l-6-3-6 3z"/><path fill="#f5c842" d="M9 7h6v2H9z"/>'),
    gear: svg('<path fill="#a89878" d="M12 8a4 4 0 100 8 4 4 0 000-8zm9 4l-2-1 1-2-2-2-2 1-1-2h-3l-1 2-2-1-2 2 1 2-2 1v3l2 1-1 2 2 2 2-1 1 2h3l1-2 2 1 2-2-1-2 2-1z"/><circle cx="12" cy="12" r="2.2" fill="#120b22"/>'),
    mail: svg('<rect x="3" y="6" width="18" height="12" rx="2" fill="#e8d9b0"/><path fill="none" stroke="#b39a5f" stroke-width="1.5" d="M4 8l8 5 8-5"/>'),
    people: svg('<circle cx="9" cy="8" r="3" fill="#e8c87a"/><circle cx="16" cy="9" r="2.4" fill="#c8a060"/><path fill="#e8c87a" d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6z"/><path fill="#c8a060" d="M14 20c0-2.5 1.8-4.6 4-5 2.2.4 3 2.5 3 5z"/>'),
    map: svg('<path fill="#4a6741" d="M3 5l6-2 6 2 6-2v16l-6 2-6-2-6 2z"/><path stroke="#2d4029" stroke-width="1.2" d="M9 3v16M15 5v16"/>'),
    home: svg('<path fill="#f5c842" d="M12 3l9 8h-3v9h-4v-6h-4v6H6v-9H3z"/>'),
    trophy: svg('<path fill="#f5c842" d="M7 4h10v3a5 5 0 01-10 0zM5 5H3v2a4 4 0 004 3zM19 5h2v2a4 4 0 01-4 3z"/><rect x="10" y="12" width="4" height="4" fill="#c8922a"/><rect x="7" y="18" width="10" height="3" rx="1" fill="#c8922a"/>'),
    bag: svg('<path fill="#c8922a" d="M6 8h12l1 12H5z"/><path fill="none" stroke="#f5c842" stroke-width="1.6" d="M9 8V6a3 3 0 016 0v2"/>'),
    calendar: svg('<rect x="4" y="5" width="16" height="15" rx="2" fill="#e8d9b0"/><rect x="4" y="5" width="16" height="4" fill="#c0392b"/><path stroke="#b39a5f" stroke-width="1.3" d="M8 12h3M13 12h3M8 15h3M13 15h3"/>'),
    flag: svg('<path stroke="#a89878" stroke-width="2" d="M6 21V4"/><path fill="#c0392b" d="M6 4h11l-2 3 2 3H6z"/>'),
    plus: svg('<path stroke="#1a1005" stroke-width="2.5" stroke-linecap="round" d="M12 6v12M6 12h12"/>'),
    back: svg('<path fill="none" stroke="#f0e6cc" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" d="M15 5l-7 7 7 7"/>'),
    close: svg('<path fill="none" stroke="#f0e6cc" stroke-width="2.2" stroke-linecap="round" d="M6 6l12 12M18 6L6 18"/>'),
    check: svg('<path fill="none" stroke="#2ecc71" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4 10-11"/>'),
    lock: svg('<rect x="5" y="10" width="14" height="10" rx="2" fill="#6d7078"/><path fill="none" stroke="#6d7078" stroke-width="2" d="M8 10V7a4 4 0 018 0v3"/><circle cx="12" cy="15" r="1.6" fill="#2b2d33"/>'),
    monster: svg('<path fill="#8e44ad" d="M12 3c4 0 7 3 7 7 0 3-1 4-1 6l-2-2-2 2-2-2-2 2-2-2-1 2c0-2-1-3-1-6 0-4 3-7 8-7z"/><circle cx="9.5" cy="9" r="1.3" fill="#ffde59"/><circle cx="14.5" cy="9" r="1.3" fill="#ffde59"/>'),
    coin: svg('<circle cx="12" cy="12" r="8" fill="#f5c842"/><circle cx="12" cy="12" r="5" fill="#c8922a"/>'),
    crown: svg('<path fill="#f5c842" d="M4 8l3 4 5-6 5 6 3-4v10H4z"/>'),
    hero: svg('<circle cx="12" cy="8" r="4" fill="#e8c87a"/><path fill="#c0392b" d="M5 21c0-3.9 3.1-7 7-7s7 3.1 7 7z"/>')
  };

  function icon(name, cls) {
    var s = ICONS[name] || ICONS.star;
    return '<span class="ic' + (cls ? ' ' + cls : '') + '">' + s + '</span>';
  }

  // ---------------- Terminology (single source of truth) ----------------
  var TERMS = {
    state: 'State',
    resources: { RICE: 'Rice', WOOD: 'Wood', STONE: 'Stone', IRON: 'Iron', CHARCOAL: 'Charcoal', CATALYST: 'Catalyst' },
    currencies: { JADE: 'Jade', HONOUR: 'Honour', SILVER: 'Silver', GOLD: 'Gold' },
    troopClass: { SAMURAI_GUARD: 'Samurai Guard', YUMI_ARCHERS: 'Yumi Archers', KOMAINU_RIDERS: 'Komainu Riders' }
  };
  var RES_ICON = { RICE: 'rice', WOOD: 'wood', STONE: 'stone', IRON: 'iron', CHARCOAL: 'charcoal', CATALYST: 'catalyst' };
  var CUR_ICON = { JADE: 'jade', HONOUR: 'honour', SILVER: 'silver', GOLD: 'gold' };

  // ---------------- Formatters ----------------
  var Fmt = {
    num: function (n) {
      n = Number(n) || 0;
      if (n >= 1e9) return (n / 1e9).toFixed(n >= 1e10 ? 0 : 1) + 'B';
      if (n >= 1e6) return (n / 1e6).toFixed(n >= 1e7 ? 0 : 1) + 'M';
      if (n >= 1e3) return (n / 1e3).toFixed(n >= 1e4 ? 0 : 1) + 'K';
      return String(Math.floor(n));
    },
    int: function (n) { return (Number(n) || 0).toLocaleString('en-US'); },
    title: function (s) { return String(s || '').replace(/_/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); }); },
    time: function (sec) {
      sec = Math.max(0, Math.floor(sec));
      var d = Math.floor(sec / 86400); sec -= d * 86400;
      var h = Math.floor(sec / 3600); sec -= h * 3600;
      var m = Math.floor(sec / 60); var s = sec - m * 60;
      if (d > 0) return d + 'd ' + h + 'h';
      if (h > 0) return h + 'h ' + m + 'm';
      if (m > 0) return m + 'm ' + s + 's';
      return s + 's';
    },
    rewards: function (obj) {
      if (!obj) return '';
      return Object.keys(obj).map(function (k) {
        var ik = RES_ICON[k] || CUR_ICON[k];
        return '<span class="row" style="gap:3px;display:inline-flex">' + (ik ? icon(ik, 'sm') : '') +
          '<b style="color:var(--gold)">' + Fmt.num(obj[k]) + '</b></span>';
      }).join(' ');
    }
  };

  // ---------------- Game state ----------------
  var Game = {
    profile: null,      // /players/me
    resources: [],      // /economy/resources -> resources[]
    content: { heroes: null, troops: null, buildings: null, pets: null },
    tutorial: null,     // /tutorial/progress
    _pollTimer: null,

    displayName: function () {
      return (localStorage.getItem('shogun_commander')) ||
        (this.profile && this.profile.displayName) ||
        (localStorage.getItem('shogun_displayName')) || 'Warrior';
    },

    ensureContent: function () {
      var self = this;
      var need = [];
      if (!this.content.heroes) need.push(api.getHeroes().then(function (d) { self.content.heroes = d; }));
      if (!this.content.troops) need.push(api.getTroops().then(function (d) { self.content.troops = d; }));
      if (!this.content.buildings) need.push(api.getBuildings().then(function (d) { self.content.buildings = d; }));
      if (!this.content.pets) need.push(api.getPets().then(function (d) { self.content.pets = d; }));
      return Promise.all(need);
    },

    refreshProfile: function () {
      var self = this;
      return api.me().then(function (d) { self.profile = d; return d; });
    },
    refreshResources: function () {
      var self = this;
      return api.getResources().then(function (d) { self.resources = (d && d.resources) || []; return self.resources; });
    },
    refreshTutorial: function () {
      var self = this;
      return api.getTutorial().then(function (d) { self.tutorial = d; return d; });
    },

    resourceAmount: function (key) {
      var r = (this.resources || []).filter(function (x) { return x.resource === key; })[0];
      return r ? Number(r.amount) : 0;
    },
    currency: function (key) { return (this.profile && this.profile.currencies && Number(this.profile.currencies[key])) || 0; },

    shieldRemainingMs: function () {
      var end = (this.profile && this.profile.shield && this.profile.shield.endsAt) || localStorage.getItem('shogun_shieldEndsAt');
      if (!end) return 0;
      if (this.profile && this.profile.shield && this.profile.shield.broken) return 0;
      if (localStorage.getItem('shogun_shieldBroken') === '1') return 0;
      return Math.max(0, new Date(end).getTime() - Date.now());
    },

    startPolling: function () {
      var self = this;
      if (this._pollTimer) return;
      this._pollTimer = setInterval(function () {
        if (!api.isLoggedIn) return;
        self.refreshResources().then(function () {
          if (window.TopBar && !document.getElementById('topbar').classList.contains('hidden')) TopBar.render();
        }).catch(function () {});
      }, 30000);
    },

    reset: function () {
      this.profile = null; this.resources = []; this.tutorial = null;
      if (this._pollTimer) { clearInterval(this._pollTimer); this._pollTimer = null; }
    }
  };

  // ---------------- Global UI helpers ----------------
  var _loadCount = 0;
  var UI = {
    loading: function (on) {
      _loadCount += on ? 1 : -1;
      if (_loadCount < 0) _loadCount = 0;
      document.getElementById('loader').classList.toggle('hidden', _loadCount === 0);
    },
    toast: function (msg, kind) {
      var layer = document.getElementById('toast-layer');
      var t = document.createElement('div');
      t.className = 'toast' + (kind ? ' ' + kind : '');
      t.textContent = msg;
      layer.appendChild(t);
      setTimeout(function () { t.style.transition = 'opacity .3s'; t.style.opacity = '0'; setTimeout(function () { t.remove(); }, 300); }, 2600);
    },
    ok: function (msg) { this.toast(msg, 'ok'); },
    err: function (e) { this.toast(typeof e === 'string' ? e : api.friendly(e), 'err'); }
  };

  window.Game = Game;
  window.UI = UI;
  window.Fmt = Fmt;
  window.TERMS = TERMS;
  window.RES_ICON = RES_ICON;
  window.CUR_ICON = CUR_ICON;
  window.icon = icon;
})();
