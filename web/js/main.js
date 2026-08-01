/* ============================================================
   main.js — Router, TopBar, bottom nav, modal helper, bootstrap.
   ============================================================ */
(function () {
  'use strict';

  window.Screens = window.Screens || {};

  // ---------------- Router ----------------
  var Router = {
    current: null,
    params: {},
    history: [],

    go: function (name, params) {
      var screen = window.Screens[name];
      if (!screen) { console.error('No screen:', name); return; }
      if (this.current && this.current !== name) this.history.push(this.current);
      this.current = name;
      this.params = params || {};

      var root = document.getElementById('screen-root');
      root.innerHTML = '';
      var el = document.createElement('div');
      el.className = 'screen' + (screen.hasNav ? ' with-nav with-top' : '');
      el.id = 'screen-' + name;
      root.appendChild(el);

      // Top HUD + nav visibility
      document.getElementById('topbar').classList.toggle('hidden', !screen.hasNav);
      document.getElementById('navbar').classList.toggle('hidden', !screen.hasNav);
      if (screen.hasNav) { TopBar.render(); Nav.render(name); }

      try { screen.render(el, this.params); }
      catch (e) { console.error('render error', name, e); UI.err({ message: 'Failed to open that screen.' }); }
      window.scrollTo(0, 0);
    },

    back: function () {
      var prev = this.history.pop();
      if (prev) { this.current = null; this.go(prev); }
      else this.go('settlement');
    }
  };

  // ---------------- Top resource HUD ----------------
  var TopBar = {
    render: function () {
      var bar = document.getElementById('topbar');
      var p = Game.profile || {};
      var name = Game.displayName();
      var castle = api.castleName || (p.settlement && p.settlement.name) || 'Unnamed Castle';
      var vip = p.vipLevel || 0;
      var mailBadge = TopBar._mailUnread || 0;

      // Resource pills: pull rice/wood/stone/iron from resources; jade/honour from currencies.
      var res = Game.resources || [];
      function amt(key) { var r = res.filter(function (x) { return x.resource === key; })[0]; return r ? r.amount : 0; }
      var cur = (p.currencies) || {};
      var pills = [
        { ic: CURRENCY.JADE.ic, v: cur.JADE || 0 },
        { ic: RESOURCE.RICE.ic, v: amt('RICE') },
        { ic: RESOURCE.WOOD.ic, v: amt('WOOD') },
        { ic: RESOURCE.STONE.ic, v: amt('STONE') },
        { ic: RESOURCE.IRON.ic, v: amt('IRON') },
        { ic: CURRENCY.HONOUR.ic, v: cur.HONOUR || 0 }
      ];
      var pillHtml = pills.map(function (x) {
        return '<div class="res-pill"><span class="ic">' + x.ic + '</span><span class="v">' + Fmt.num(x.v) + '</span></div>';
      }).join('');

      bar.innerHTML =
        '<div class="hud-row1">' +
          '<img class="hud-avatar" src="assets/images/pet-shiro.webp" alt="avatar" />' +
          '<div class="hud-id"><div class="hud-name">' + esc(name) + ' <span class="hud-vip">VIP ' + vip + '</span></div>' +
          '<div class="hud-castle">🏯 ' + esc(castle) + '</div></div>' +
          '<div class="hud-btns">' +
            '<button class="hud-ic" id="hud-mail">📬' + (mailBadge ? '<span class="hud-badge">' + mailBadge + '</span>' : '') + '</button>' +
            '<button class="hud-ic" id="hud-settings">⚙️</button>' +
          '</div>' +
        '</div>' +
        '<div class="res-row">' + pillHtml + '</div>';

      bar.querySelector('#hud-mail').onclick = function () { Router.go('mail'); };
      bar.querySelector('#hud-settings').onclick = function () { Router.go('profile'); };
    },
    _mailUnread: 0
  };

  // ---------------- Bottom nav ----------------
  var NAV = [
    { key: 'settlement', ic: '🏯', label: 'City' },
    { key: 'heroes', ic: '⚔️', label: 'Heroes' },
    { key: 'world', ic: '🗺️', label: 'World' },
    { key: 'store', ic: '🏪', label: 'Store' },
    { key: 'profile', ic: '👤', label: 'Profile' }
  ];
  var Nav = {
    render: function (active) {
      var bar = document.getElementById('navbar');
      bar.innerHTML = NAV.map(function (n) {
        var on = n.key === active ? ' active' : '';
        return '<button class="nav-item' + on + '" data-nav="' + n.key + '">' +
          '<span class="nic">' + n.ic + '</span><span>' + n.label + '</span></button>';
      }).join('');
      Array.prototype.forEach.call(bar.querySelectorAll('[data-nav]'), function (b) {
        b.onclick = function () { Router.go(b.getAttribute('data-nav')); };
      });
    }
  };

  // ---------------- Modal helper ----------------
  function Modal(opts) {
    opts = opts || {};
    var layer = document.getElementById('modal-layer');
    var sheet = document.getElementById('modal-sheet');
    sheet.innerHTML =
      '<div class="sheet-grip"></div>' +
      (opts.closable === false ? '' : '<button class="sheet-x" id="__mx">✕</button>') +
      (opts.title ? '<h3 class="sheet-title">' + opts.title + '</h3>' : '') +
      '<div id="__mbody">' + (opts.html || '') + '</div>';
    layer.classList.remove('hidden');
    var bx = sheet.querySelector('#__mx');
    if (bx) bx.onclick = closeModal;
    document.getElementById('modal-backdrop').onclick = opts.closable === false ? null : closeModal;
    if (typeof opts.onMount === 'function') opts.onMount(sheet.querySelector('#__mbody'));
    return sheet.querySelector('#__mbody');
  }
  function closeModal() {
    document.getElementById('modal-layer').classList.add('hidden');
    document.getElementById('modal-sheet').innerHTML = '';
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  // ---------------- Boot ----------------
  function boot() {
    // Always start at the splash; it decides the next screen.
    Router.go('splash');
  }

  window.Router = Router;
  window.TopBar = TopBar;
  window.Nav = Nav;
  window.Modal = Modal;
  window.closeModal = closeModal;
  window.esc = esc;

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
