/* welcome.js — enter as guest or sign in. No store pop-ups. */
(function () {
  'use strict';

  Screens.welcome = {
    render: function (el) {
      var stateName = localStorage.getItem('shogun_stateName') || 'State 1';
      el.innerHTML =
        '<div class="bg-cover" style="background-image:url(assets/images/guest-welcome.webp)"></div>' +
        '<div class="bg-scrim"></div>' +
        '<div style="position:relative;z-index:2;padding:70px 24px 34px;min-height:100%;display:flex;flex-direction:column">' +
          '<div class="center" style="flex:1;display:flex;flex-direction:column;justify-content:center">' +
            '<div class="title-lg">Your Domain<br/>Awaits</div>' +
            '<p class="muted" style="margin-top:14px;font-size:15px;line-height:1.6;max-width:320px;margin-left:auto;margin-right:auto">' +
              'The old shogun has fallen and the land lies in ashes. Claim a settlement in <b style="color:var(--gold)">' + esc(stateName) + '</b> and forge a new dynasty.</p>' +
          '</div>' +
          '<div class="stack">' +
            '<button class="btn" id="w-guest">Begin as Warrior</button>' +
            '<button class="btn secondary" id="w-login">I have an account</button>' +
            '<p class="muted center" style="font-size:11px;margin-top:4px">Play instantly \u2014 bind an account later to save your progress.</p>' +
          '</div>' +
        '</div>';

      el.querySelector('#w-guest').onclick = function () {
        UI.loading(true);
        api.guest().then(function (data) {
          api.saveSession(data);
          Game.profile = data.player || null;
          return Promise.all([
            Game.ensureContent().catch(function () {}),
            Game.refreshResources().catch(function () {}),
            Game.refreshTutorial().catch(function () {})
          ]);
        }).then(function () {
          UI.loading(false);
          Game.startPolling();
          Router.reset('namecastle');
        }).catch(function (e) {
          UI.loading(false);
          UI.err(e);
        });
      };

      el.querySelector('#w-login').onclick = function () { Router.go('auth'); };
    }
  };
})();
