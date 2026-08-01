/* ============================================================
   main.js — Router, TopBar HUD, bottom Nav, Modal system, boot.
   Loaded LAST. All screens have registered on window.Screens.
   ============================================================ */
(function () {
  'use strict';

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  window.esc = esc;

  var ASSET = 'assets/images/';
  window.ASSET = ASSET;

  /* ---------------- Router ---------------- */
  var Router = {
    current: null,
    _stack: [],
    _screenEl: null,

    go: function (name, params, opts) {
      opts = opts || {};
      var def = window.Screens[name];
      if (!def) { console.error('No screen:', name); return; }
      if (this.current && !opts.replace) this._stack.push({ name: this.current, params: this._params });
      this._transition(name, params || {});
    },

    replace: function (name, params) { this.go(name, params, { replace: true }); },

    back: function (fallback) {
      var prev = this._stack.pop();
      if (prev) this._transition(prev.name, prev.params || {});
      else if (fallback) this._transition(fallback, {});
    },

    reset: function (name, params) {
      this._stack = [];
      this._transition(name, params || {});
    },

    _transition: function (name, params) {
      var def = window.Screens[name];
      var root = document.getElementById('screen-root');
      // tear down previous
      if (this._curDef && this._curDef.destroy) { try { this._curDef.destroy(); } catch (e) {} }

      this.current = name; this._params = params; this._curDef = def;

      // chrome visibility
      var showTop = !!def.topbar;
      var showNav = !!def.navbar;
      document.getElementById('topbar').classList.toggle('hidden', !showTop);
      document.getElementById('navbar').classList.toggle('hidden', !showNav);
      if (!def.tutorial) TutorialUI && TutorialUI.hide && TutorialUI.hide();

      // render
      var el = document.createElement('div');
      el.className = 'screen' + (showTop ? ' with-top' : '') + (showNav ? ' with-nav' : '');
      root.innerHTML = '';
      root.appendChild(el);
      this._screenEl = el;

      var out = def.render(el, params);
      Promise.resolve(out).catch(function (e) { console.error(e); });

      if (showTop) TopBar.render();
      if (showNav) Nav.render(def.navKey || name);

      window.scrollTo(0, 0);
    }
  };
  window.Router = Router;

  /* ---------------- Top HUD ---------------- */
  var TopBar = {
    _mailUnread: 0,
    setMailUnread: function (n) { this._mailUnread = n || 0; if (!document.getElementById('topbar').classList.contains('hidden')) this.render(); },

    render: function () {
      var bar = document.getElementById('topbar');
      var p = Game.profile || {};
      var name = Game.displayName();
      var vip = p.vipLevel != null ? p.vipLevel : 0;
      var lvl = p.level != null ? p.level : 1;

      // resource pills (economy resources)
      var order = ['RICE', 'WOOD', 'STONE', 'IRON', 'CHARCOAL', 'CATALYST'];
      var pills = order.map(function (k) {
        return '<div class="res-pill">' + icon(RES_ICON[k], 'sm') +
          '<span class="v">' + Fmt.num(Game.resourceAmount(k)) + '</span></div>';
      }).join('');
      // add jade currency pill at the end
      pills += '<div class="res-pill">' + icon('jade', 'sm') + '<span class="v">' + Fmt.num(Game.currency('JADE')) + '</span></div>';

      // shield
      var shieldMs = Game.shieldRemainingMs();
      var shieldHtml = '';
      if (shieldMs > 0) {
        shieldHtml = '<div class="hud-shield" id="hud-shield">' + icon('shield', 'sm') +
          '<span>' + Fmt.time(shieldMs / 1000) + '</span></div>';
      }

      var avatarImg = ASSET + 'guest-welcome.webp';

      bar.innerHTML =
        '<div class="hud-top">' +
          '<div class="hud-avatar" id="hud-avatar"><img src="' + avatarImg + '" alt="" /></div>' +
          '<div style="min-width:0">' +
            '<div class="hud-name">' + esc(name) + '</div>' +
            '<div class="hud-sub">Lv ' + lvl + ' &middot; VIP ' + vip + '</div>' +
          '</div>' +
          shieldHtml +
          '<div class="hud-icons">' +
            '<button class="hud-btn" id="hud-mail" aria-label="Mail">' + icon('mail') +
              (this._mailUnread > 0 ? '<span class="dot">' + this._mailUnread + '</span>' : '') + '</button>' +
            '<button class="hud-btn" id="hud-settings" aria-label="Profile">' + icon('gear') + '</button>' +
          '</div>' +
        '</div>' +
        '<div class="res-strip">' + pills + '</div>';

      document.getElementById('hud-mail').onclick = function () { Router.go('mail'); };
      document.getElementById('hud-settings').onclick = function () { Router.go('profile'); };
      document.getElementById('hud-avatar').onclick = function () { Router.go('profile'); };
      var sh = document.getElementById('hud-shield');
      if (sh) sh.onclick = function () { window.showShieldModal && window.showShieldModal(); };
    }
  };
  window.TopBar = TopBar;

  /* ---------------- Bottom Nav ---------------- */
  var NAV = [
    { key: 'settlement', label: 'City', ic: 'home' },
    { key: 'heroes', label: 'Heroes', ic: 'hero' },
    { key: 'world', label: 'World', ic: 'map' },
    { key: 'store', label: 'Store', ic: 'bag' },
    { key: 'profile', label: 'Clan', ic: 'people', target: 'clan' }
  ];
  var Nav = {
    render: function (activeKey) {
      var bar = document.getElementById('navbar');
      bar.innerHTML = NAV.map(function (n) {
        var active = (n.key === activeKey || n.target === activeKey);
        return '<button class="nav-item' + (active ? ' active' : '') + '" data-t="' + (n.target || n.key) + '">' +
          icon(n.ic) + '<span>' + n.label + '</span></button>';
      }).join('');
      Array.prototype.forEach.call(bar.querySelectorAll('.nav-item'), function (b) {
        b.onclick = function () {
          var t = b.getAttribute('data-t');
          if (t === Router.current) return;
          Router.reset(t);
        };
      });
    }
  };
  window.Nav = Nav;

  /* ---------------- Modal system ---------------- */
  function openModal(html, opts) {
    opts = opts || {};
    var layer = document.getElementById('modal-layer');
    var sheet = document.getElementById('modal-sheet');
    var backdrop = document.getElementById('modal-backdrop');
    layer.classList.remove('hidden');
    if (opts.center) {
      sheet.className = 'modal-center';
      sheet.innerHTML = html;
    } else {
      sheet.className = '';
      sheet.innerHTML = '<div class="sheet-grip"></div>' + html;
    }
    backdrop.onclick = opts.persist ? null : closeModal;
    return sheet;
  }
  function closeModal() {
    var layer = document.getElementById('modal-layer');
    layer.classList.add('hidden');
    document.getElementById('modal-sheet').innerHTML = '';
  }
  window.Modal = openModal;
  window.closeModal = closeModal;

  // Generic "Coming in Season X" modal (no dead ends)
  window.comingSoon = function (title, season, desc) {
    var html =
      '<div class="panel gold center stack">' +
        '<div class="ic lg" style="margin:0 auto">' + icon('scroll') + '</div>' +
        '<h3 class="title-md">' + esc(title) + '</h3>' +
        '<p class="muted" style="font-size:14px;line-height:1.5">' + esc(desc || 'This feature is being forged by the war council.') + '</p>' +
        '<div class="pill-tag pill-prem" style="margin:0 auto">Coming in ' + esc(season || 'Season 1') + '</div>' +
        '<button class="btn" id="cs-ok">Understood</button>' +
      '</div>';
    openModal(html, { center: true });
    document.getElementById('cs-ok').onclick = closeModal;
  };

  /* ---------------- Shield break-warning modal ---------------- */
  window.showShieldModal = function () {
    var ms = Game.shieldRemainingMs();
    if (ms <= 0) {
      window.comingSoon('Peace Shield', 'Season 1', 'Your protection has ended. Fortify your defenses, commander.');
      return;
    }
    var html =
      '<div class="panel gold stack">' +
        '<div class="row"><div class="ic lg">' + icon('shield') + '</div>' +
          '<div><h3 class="title-md" style="font-size:18px">Peace Shield Active</h3>' +
          '<div class="muted" style="font-size:12px">Newcomer protection</div></div></div>' +
        '<p style="font-size:14px;line-height:1.5">While your shield holds, no warlord may attack your settlement. It expires in ' +
          '<b style="color:var(--rarity-blue)">' + Fmt.time(ms / 1000) + '</b>.</p>' +
        '<div class="panel" style="background:rgba(192,57,43,0.1);border-color:rgba(192,57,43,0.4)">' +
          '<div class="row"><div class="ic">' + icon('sword') + '</div><b style="color:#ff8b7d">Breaking your shield</b></div>' +
          '<p class="muted" style="font-size:12px;margin-top:6px">Launching an attack on another player will shatter your shield early and expose you to reprisal. Are you ready for war?</p>' +
        '</div>' +
        '<div class="grid-2">' +
          '<button class="btn secondary" id="sh-keep">Keep Shield</button>' +
          '<button class="btn danger" id="sh-break">Break Shield</button>' +
        '</div>' +
      '</div>';
    openModal(html);
    document.getElementById('sh-keep').onclick = closeModal;
    document.getElementById('sh-break').onclick = function () {
      localStorage.setItem('shogun_shieldBroken', '1');
      closeModal();
      UI.ok('Your peace shield has been shattered. Fight well.');
      TopBar.render();
    };
  };

  /* ---------------- Boot ---------------- */
  function boot() {
    Router.reset('splash');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
