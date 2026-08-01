/* NAME YOUR CASTLE — set the castle name for a new player. */
window.Screens.namecastle = {
  hasNav: false,
  render: function (root) {
    var suggested = 'Castle ' + Game.displayName().replace(/[^A-Za-z0-9_]/g, '');
    root.innerHTML =
      '<div class="screen-bg" style="background-image:url(assets/images/settlement.webp)"></div>' +
      '<div class="screen-inner" style="display:flex;flex-direction:column;min-height:100%">' +
        '<div style="flex:1"></div>' +
        '<div class="parchment" style="padding:22px 18px">' +
          '<h1 style="font-family:Cinzel;font-size:24px;text-align:center;color:#5a3d12">Name Your Castle</h1>' +
          '<p style="text-align:center;color:#6b4e22;font-size:13px;margin:8px 0 18px">Every legend begins with a stronghold.</p>' +
          '<input class="input" id="nc-name" maxlength="24" placeholder="Castle name" style="background:rgba(255,255,255,.7);color:#3a2a10;border-color:#b7893c" />' +
          '<div class="form-err" id="nc-err" style="color:#8b1a12"></div>' +
          '<button class="btn btn-primary" id="nc-go" style="margin-top:6px">🏯 ENTER THE REALM</button>' +
        '</div>' +
        '<div style="flex:1"></div>' +
      '</div>';

    var input = root.querySelector('#nc-name');
    input.value = suggested.slice(0, 24);
    var err = root.querySelector('#nc-err');

    root.querySelector('#nc-go').onclick = function () {
      var name = input.value.trim();
      if (name.length < 2) { err.textContent = 'Choose a name of at least 2 characters.'; return; }
      err.textContent = '';
      api.setCastle(name);
      UI.loading(true);
      // Ensure profile + resources are ready before entering the hub.
      Promise.all([
        Game.refreshProfile().catch(function () {}),
        Game.refreshResources().catch(function () {})
      ]).then(function () {
        UI.loading(false);
        UI.ok('Your banner rises over ' + name + '!');
        Router.go('settlement');
      });
    };
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') root.querySelector('#nc-go').click(); });
  }
};
