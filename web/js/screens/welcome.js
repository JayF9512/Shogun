/* WELCOME — guest play or login/register. */
window.Screens.welcome = {
  hasNav: false,
  render: function (root) {
    root.innerHTML =
      '<div class="screen-bg" style="background-image:url(assets/images/guest-welcome.webp)"></div>' +
      '<div class="screen-inner" style="display:flex;flex-direction:column;min-height:100%">' +
        '<div class="logo-mini" style="margin-top:6px">SHADOWS OF THE SHOGUN</div>' +
        '<div style="flex:1"></div>' +
        '<h1 class="h-title" style="font-size:24px">Begin Your Journey, Warrior!</h1>' +
        '<p class="h-sub" style="margin-bottom:24px">Rise from a lone samurai to the shadow ruler of a war-torn Japan.</p>' +
        '<button class="btn btn-primary" id="w-guest">⚔️ PLAY AS GUEST</button>' +
        '<div style="height:12px"></div>' +
        '<button class="btn btn-secondary" id="w-login">👤 LOGIN / REGISTER</button>' +
        '<p class="muted center" style="font-size:11px;margin-top:16px;line-height:1.5">' +
          'Guest progress is tied to this device.<br>Bind your account later to save it forever.</p>' +
      '</div>';

    root.querySelector('#w-guest').onclick = function () {
      UI.loading(true);
      api.guest().then(function () {
        return Promise.all([Game.ensureContent(), Game.refreshResources().catch(function () {})]);
      }).then(function () {
        UI.loading(false);
        UI.ok('Welcome, ' + Game.displayName() + '!');
        Router.go('namecastle');
      }).catch(function (e) { UI.loading(false); UI.err(e); });
    };
    root.querySelector('#w-login').onclick = function () { Router.go('auth'); };
  }
};
