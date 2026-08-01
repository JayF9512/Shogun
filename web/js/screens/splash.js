/* SPLASH — animated loading, then routes into the game or onboarding. */
window.Screens.splash = {
  hasNav: false,
  render: function (root) {
    var embers = '';
    for (var i = 0; i < 14; i++) {
      var dur = (5 + Math.random() * 6).toFixed(1);
      var delay = (Math.random() * 6).toFixed(1);
      var left = Math.floor(Math.random() * 100);
      var dx = (Math.random() * 60 - 30).toFixed(0);
      var size = (5 + Math.random() * 8).toFixed(0);
      embers += '<span class="ember" style="left:' + left + '%;width:' + size + 'px;height:' + size +
        'px;animation-duration:' + dur + 's;animation-delay:' + delay + 's;--dx:' + dx + 'px"></span>';
    }
    root.innerHTML =
      '<div id="splash-screen">' +
        '<div class="splash-bg" style="background-image:url(assets/images/splash.webp)"></div>' +
        '<div class="embers">' + embers + '</div>' +
        '<div class="splash-content">' +
          '<div class="splash-title">SHADOWS OF<br>THE SHOGUN</div>' +
          '<div class="splash-sub">Sengoku Conquest</div>' +
          '<div class="progress-wrap">' +
            '<div class="progress-track"><div class="progress-fill" id="sp-fill"></div></div>' +
            '<div class="progress-pct" id="sp-pct">Entering the State… 0%</div>' +
          '</div>' +
        '</div>' +
      '</div>';

    var fill = root.querySelector('#sp-fill');
    var pct = root.querySelector('#sp-pct');
    var v = 0;
    var timer = setInterval(function () {
      v += Math.random() * 16 + 6;
      if (v >= 100) { v = 100; clearInterval(timer); setTimeout(next, 350); }
      fill.style.width = v + '%';
      pct.textContent = 'Entering the State… ' + Math.floor(v) + '%';
    }, 200);

    function next() {
      if (api.isLoggedIn && api.stateId) {
        // Returning player — load straight into the game.
        loadGame();
      } else if (api.stateId) {
        Router.go('welcome');
      } else {
        Router.go('stateselect');
      }
    }

    function loadGame() {
      UI.loading(true);
      Promise.all([
        Game.ensureContent(),
        Game.refreshProfile().catch(function () { return null; }),
        Game.refreshResources().catch(function () { return null; })
      ]).then(function () {
        UI.loading(false);
        if (!api.castleName && !(Game.profile && Game.profile.settlement)) Router.go('namecastle');
        else Router.go('settlement');
      }).catch(function () { UI.loading(false); Router.go('settlement'); });
    }
  }
};
