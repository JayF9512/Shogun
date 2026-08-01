/* namecastle.js — name your castle and your lord. */
(function () {
  'use strict';

  Screens.namecastle = {
    render: function (el) {
      var suggested = Game.displayName();
      el.innerHTML =
        '<div class="bg-cover" style="background-image:url(assets/images/settlement.webp)"></div>' +
        '<div class="bg-scrim"></div>' +
        '<div style="position:relative;z-index:2;padding:56px 24px 30px;min-height:100%;display:flex;flex-direction:column">' +
          '<div class="center" style="margin-bottom:8px">' +
            '<div class="title-md">Claim Your Seat</div>' +
            '<p class="muted" style="font-size:13px;margin-top:6px">Every dynasty needs a name to be feared.</p>' +
          '</div>' +
          '<div class="panel gold stack" style="margin-top:14px">' +
            '<div class="field">' +
              '<label>Your Castle</label>' +
              '<input id="nc-castle" maxlength="24" placeholder="e.g. Crimson Peak Keep" value="Ashfall Keep" />' +
            '</div>' +
            '<div class="field">' +
              '<label>Your Name, Lord</label>' +
              '<input id="nc-lord" maxlength="20" placeholder="Your commander name" value="' + esc(suggested) + '" />' +
            '</div>' +
            '<div class="err-text" id="nc-err"></div>' +
            '<button class="btn" id="nc-go">Raise my banner</button>' +
          '</div>' +
        '</div>';

      el.querySelector('#nc-go').onclick = function () {
        var castle = el.querySelector('#nc-castle').value.trim();
        var lord = el.querySelector('#nc-lord').value.trim();
        var err = el.querySelector('#nc-err');
        if (castle.length < 2) { err.textContent = 'Give your castle a name (2+ characters).'; return; }
        if (lord.length < 2) { err.textContent = 'Give your lord a name (2+ characters).'; return; }
        localStorage.setItem('shogun_castleName', castle);
        localStorage.setItem('shogun_commander', lord);

        // Place the castle at the heart of the realm (best-effort; ignore seed errors).
        UI.loading(true);
        api.placeCastle(600, 600).catch(function () {}).then(function () {
          UI.loading(false);
          Router.reset('prologue');
        });
      };
    }
  };
})();
