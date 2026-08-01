/* battle.js — muster an army and simulate combat via /combat/simulate. */
(function () {
  'use strict';

  var CLASSES = [
    { key: 'SAMURAI_GUARD', label: 'Samurai Guard', atk: 50, ic: 'sword' },
    { key: 'YUMI_ARCHERS', label: 'Yumi Archers', atk: 45, ic: 'banner' },
    { key: 'KOMAINU_RIDERS', label: 'Komainu Riders', atk: 60, ic: 'flag' }
  ];

  Screens.battle = {
    topbar: true, navbar: true, navKey: 'world',

    render: function (el, params) {
      var target = (params && params.target) || { type: 'monster', name: 'Oni Marauder', level: 3 };
      var lvl = target.level || 3;
      el.innerHTML =
        '<div class="screen-head"><button class="hud-btn" id="b-back">' + icon('back') + '</button><h2>Battle</h2></div>' +
        '<div style="position:relative;height:160px;overflow:hidden">' +
          '<div class="bg-cover" style="background-image:url(assets/images/battle-scene.webp)"></div>' +
          '<div class="bg-scrim"></div>' +
          '<div style="position:absolute;left:16px;bottom:12px;z-index:2">' +
            '<div class="title-md" style="font-size:20px">' + esc(target.name || 'Enemy') + '</div>' +
            '<div class="rar-EPIC" style="font-size:12px;font-weight:700">' + (target.type === 'castle' ? 'Rival Warlord' : 'Yokai') + ' \u2022 Level ' + lvl + '</div>' +
          '</div>' +
        '</div>' +
        '<div class="pad">' +
          '<h4 class="sec-title">Muster your army</h4>' +
          '<div class="panel stack" id="army"></div>' +
          '<button class="btn danger" id="b-engage" style="margin-top:14px">Engage in battle</button>' +
          '<div id="b-result" style="margin-top:14px"></div>' +
        '</div>';

      el.querySelector('#b-back').onclick = function () { Router.back('world'); };

      var army = el.querySelector('#army');
      army.innerHTML = CLASSES.map(function (c) {
        return '<div class="slider-row"><span class="ic">' + icon(c.ic) + '</span>' +
          '<span style="width:96px;font-size:12px">' + c.label + '</span>' +
          '<input type="range" min="0" max="500" step="10" value="100" data-c="' + c.key + '"/>' +
          '<span class="sv" data-v="' + c.key + '">100</span></div>';
      }).join('');
      Array.prototype.forEach.call(army.querySelectorAll('input'), function (r) {
        r.oninput = function () { army.querySelector('[data-v="' + r.getAttribute('data-c') + '"]').textContent = r.value; };
      });

      el.querySelector('#b-engage').onclick = function () {
        var attacker = CLASSES.map(function (c) {
          var v = Number(army.querySelector('input[data-c="' + c.key + '"]').value);
          return { troopClass: c.key, count: v, attack: c.atk };
        }).filter(function (a) { return a.count > 0; });
        if (!attacker.length) { UI.err('Select at least some troops to march.'); return; }

        var dcount = 60 + lvl * 40;
        var defender = [
          { troopClass: 'SAMURAI_GUARD', count: Math.round(dcount * 0.5), attack: 40 + lvl * 4 },
          { troopClass: 'YUMI_ARCHERS', count: Math.round(dcount * 0.5), attack: 38 + lvl * 4 }
        ];

        UI.loading(true);
        api.simulate(attacker, defender).then(function (res) {
          UI.loading(false);
          Screens.battle._result(el, res, target);
        }).catch(function (e) { UI.loading(false); UI.err(e); });
      };
    },

    _result: function (el, res, target) {
      var win = res.winner === 'ATTACKER';
      var box = el.querySelector('#b-result');
      box.innerHTML =
        '<div class="panel gold stack" style="animation:popIn .3s ease">' +
          '<div class="center"><div class="ic lg" style="margin:0 auto">' + icon(win ? 'trophy' : 'shield') + '</div>' +
            '<h3 class="title-md" style="color:' + (win ? 'var(--jade)' : '#ff8b7d') + '">' + (win ? 'Victory!' : 'Defeat') + '</h3></div>' +
          '<div class="stat-grid">' +
            '<div class="stat"><div class="k">Your Power</div><div class="val">' + Fmt.int(res.attacker && res.attacker.power) + '</div></div>' +
            '<div class="stat"><div class="k">Enemy Power</div><div class="val">' + Fmt.int(res.defender && res.defender.power) + '</div></div>' +
            '<div class="stat"><div class="k">Your Losses</div><div class="val">' + Fmt.int(res.attacker && res.attacker.losses) + '</div></div>' +
            '<div class="stat"><div class="k">Fear Gained</div><div class="val">' + Fmt.int(res.fearGained || 0) + '</div></div>' +
          '</div>' +
          (win ? '<p class="muted center" style="font-size:13px">The spoils are yours, my lord.</p>' :
            '<p class="muted center" style="font-size:13px">Regroup and return with a stronger host.</p>') +
          '<button class="btn secondary" id="b-again">Return to map</button>' +
        '</div>';
      document.getElementById('b-again').onclick = function () { Router.reset('world'); };
    }
  };
})();
