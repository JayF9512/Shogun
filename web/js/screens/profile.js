/* profile.js — commander profile, settings, and hub links. */
(function () {
  'use strict';

  function linkRow(id, ic, label, sub) {
    return '<button class="card list-card" id="' + id + '" style="width:100%;margin-bottom:8px;text-align:left">' +
      '<div class="thumb" style="width:44px;height:44px">' + icon(ic) + '</div>' +
      '<div style="flex:1"><b>' + esc(label) + '</b>' + (sub ? '<div class="muted" style="font-size:11px">' + esc(sub) + '</div>' : '') + '</div>' +
      '<span class="ic">' + icon('back') + '</span></button>';
  }

  Screens.profile = {
    topbar: true, navbar: true, navKey: 'profile',

    render: function (el) {
      var self = this;
      UI.loading(true);
      Game.refreshProfile().then(function (p) { Game.saveSession(p); }).catch(function () {}).then(function () {
        UI.loading(false);
        self._paint(el);
      });
    },

    _paint: function (el) {
      var p = Game.profile || {};
      var role = api.role;
      var isAdmin = role === 'ADMIN' || role === 'OWNER';
      var isGuest = api.isGuest;
      var shieldMs = Game.shieldRemainingMs();

      el.innerHTML =
        '<div class="screen-head"><h2>Commander</h2></div>' +
        '<div class="pad">' +
          '<div class="panel gold stack" style="margin-bottom:14px">' +
            '<div class="row"><div class="hud-avatar" style="width:56px;height:56px"><img src="assets/images/guest-welcome.webp" alt=""/></div>' +
              '<div style="flex:1"><div class="title-md" style="font-size:19px">' + esc(Game.displayName()) + '</div>' +
                '<div class="muted" style="font-size:12px">' + esc(localStorage.getItem('shogun_castleName') || 'Ashfall Keep') + ' \u2022 ' + esc(localStorage.getItem('shogun_stateName') || 'State 1') + '</div>' +
                '<div style="margin-top:4px"><span class="hud-badge">' + esc(role) + '</span> ' + (isGuest ? '<span class="pill-tag pill-free">GUEST</span>' : '<span class="pill-tag pill-prem">BOUND</span>') + '</div>' +
              '</div></div>' +
            '<div class="stat-grid">' +
              '<div class="stat"><div class="k">Level</div><div class="val">' + (p.level || 1) + '</div></div>' +
              '<div class="stat"><div class="k">Power</div><div class="val">' + Fmt.num(p.power || 0) + '</div></div>' +
              '<div class="stat"><div class="k">VIP</div><div class="val">' + (p.vipLevel || 0) + '</div></div>' +
              '<div class="stat"><div class="k">Heroes</div><div class="val">' + ((p.counts && p.counts.heroes) || 0) + '</div></div>' +
            '</div>' +
          '</div>' +

          '<div class="panel stack" style="margin-bottom:14px;' + (shieldMs > 0 ? 'border-color:rgba(79,195,247,0.4)' : '') + '">' +
            '<div class="row between"><div class="row" style="gap:8px">' + icon('shield') + '<b>Peace Shield</b></div>' +
              '<b style="color:var(--rarity-blue)">' + (shieldMs > 0 ? Fmt.time(shieldMs / 1000) + ' left' : 'Inactive') + '</b></div>' +
            '<button class="btn secondary sm" id="pf-shield" style="width:100%">' + (shieldMs > 0 ? 'Manage shield' : 'Shield ended') + '</button>' +
          '</div>' +

          (isGuest ? '<button class="btn" id="pf-bind" style="margin-bottom:14px">Bind account to save progress</button>' : '') +

          '<h4 class="sec-title">Realm</h4>' +
          linkRow('pf-clan', 'people', 'Clan', 'Alliances and members') +
          linkRow('pf-lb', 'trophy', 'Rankings', 'Realm leaderboards') +
          linkRow('pf-pass', 'banner', 'Season Pass', 'The Crimson Eclipse') +
          linkRow('pf-events', 'calendar', 'Events', 'Limited-time campaigns') +
          linkRow('pf-mail', 'mail', 'Mail', 'Reports and rewards') +
          (isAdmin ? linkRow('pf-admin', 'gear', 'Admin Panel', 'Moderator tools') : '') +

          '<button class="btn danger" id="pf-logout" style="margin-top:14px">Sign out</button>' +
          '<p class="muted center" style="font-size:11px;margin-top:10px">Shadows of the Shogun \u2022 Season Zero</p>' +
        '</div>';

      var go = function (id, screen) { var b = document.getElementById(id); if (b) b.onclick = function () { Router.go(screen); }; };
      go('pf-clan', 'clan'); go('pf-lb', 'leaderboard'); go('pf-pass', 'seasonpass');
      go('pf-events', 'events'); go('pf-mail', 'mail'); go('pf-admin', 'admin');

      document.getElementById('pf-shield').onclick = function () { window.showShieldModal(); };
      var bind = document.getElementById('pf-bind');
      if (bind) bind.onclick = function () { Router.go('auth', { mode: 'bind' }); };

      document.getElementById('pf-logout').onclick = function () {
        Modal('<div class="panel stack center"><h3 class="title-md" style="font-size:18px">Sign out?</h3>' +
          '<p class="muted" style="font-size:13px">' + (api.isGuest ? 'You are playing as a guest. Sign out will lose unbound progress.' : 'You can sign back in anytime.') + '</p>' +
          '<div class="grid-2"><button class="btn secondary" id="lo-no">Cancel</button><button class="btn danger" id="lo-yes">Sign out</button></div></div>', { center: true });
        document.getElementById('lo-no').onclick = closeModal;
        document.getElementById('lo-yes').onclick = function () {
          api.clearSession(); Game.reset(); closeModal(); Router.reset('splash');
        };
      };
    }
  };
})();
