/* BATTLE — real combat simulation (POST /combat/simulate) + active marches. */
window.Screens.battle = {
  hasNav: true,
  CLASSES: [
    { key: 'SAMURAI_GUARD', ic: '🗡️', name: 'Samurai', atk: 12 },
    { key: 'YUMI_ARCHERS', ic: '🏹', name: 'Archers', atk: 15 },
    { key: 'KOMAINU_RIDERS', ic: '🐎', name: 'Riders', atk: 18 }
  ],

  render: function (root, params) {
    var self = this;
    root.innerHTML =
      '<div class="screen-bg" style="background-image:url(assets/images/battle-scene.webp);opacity:.55"></div>' +
      '<div class="screen-inner">' +
        '<div class="section-title">Battle Simulator</div>' +
        '<p class="muted" style="font-size:13px;margin-bottom:12px">Compose your army and preview the outcome. Resolution is server-authoritative and deterministic.</p>' +
        '<div class="panel"><div style="font-weight:700;color:var(--gold);margin-bottom:8px">🚩 Your Army</div><div id="atk-sliders"></div></div>' +
        '<div style="height:12px"></div>' +
        '<div class="panel"><div style="font-weight:700;color:#ff8b7f;margin-bottom:8px">🛡️ Enemy Garrison</div><div id="def-sliders"></div></div>' +
        '<div style="height:14px"></div>' +
        '<button class="btn btn-primary" id="sim-go">⚔️ SIMULATE BATTLE</button>' +
        '<div id="sim-result" style="margin-top:16px"></div>' +
        '<div class="section-title" style="margin-top:22px">Active Marches</div>' +
        '<div id="b-marches"><div class="empty" style="padding:16px">No marches on the field.</div></div>' +
      '</div>';

    this._sliders(root.querySelector('#atk-sliders'), 'a', [1000, 400, 300]);
    var enemyDefaults = params && params.region ? [600 + params.region.npc * 60, 300, 200] : [800, 300, 200];
    this._sliders(root.querySelector('#def-sliders'), 'd', enemyDefaults);

    root.querySelector('#sim-go').onclick = function () { self._simulate(root); };
    this._loadMarches(root.querySelector('#b-marches'));
  },

  _sliders: function (wrap, prefix, defaults) {
    wrap.innerHTML = this.CLASSES.map(function (c, i) {
      var id = prefix + '-' + c.key;
      return '<div class="slider-row"><div class="lab"><span>' + c.ic + ' ' + c.name + '</span><span class="count-tag" id="v-' + id + '">' + defaults[i] + '</span></div>' +
        '<input type="range" id="s-' + id + '" min="0" max="3000" step="50" value="' + defaults[i] + '" /></div>';
    }).join('');
    Array.prototype.forEach.call(wrap.querySelectorAll('input[type=range]'), function (inp) {
      inp.oninput = function () { document.getElementById('v-' + inp.id.slice(2)).textContent = inp.value; };
    });
  },

  _collect: function (root, prefix) {
    var arr = [];
    this.CLASSES.forEach(function (c) {
      var v = +root.querySelector('#s-' + prefix + '-' + c.key).value;
      if (v > 0) arr.push({ troopClass: c.key, count: v, attack: c.atk });
    });
    return arr;
  },

  _simulate: function (root) {
    var self = this;
    var attacker = this._collect(root, 'a');
    var defender = this._collect(root, 'd');
    if (!attacker.length) { UI.toast('Add at least one attacking unit.', 'error'); return; }
    UI.loading(true);
    api.simulate(attacker, defender).then(function (res) {
      UI.loading(false);
      var win = res.winner === 'ATTACKER';
      var box = root.querySelector('#sim-result');
      box.innerHTML =
        '<div class="panel fadeup" style="text-align:center;border-color:' + (win ? 'var(--success)' : 'var(--danger)') + '">' +
          '<div style="font-family:Cinzel;font-size:26px;color:' + (win ? 'var(--success)' : '#ff8b7f') + ';text-shadow:0 0 16px currentColor">' + (win ? '🏆 VICTORY' : '💀 DEFEAT') + '</div>' +
          '<div class="grid-2" style="margin:12px 0">' +
            '<div class="stat"><div class="n">' + Fmt.num(res.attacker.power) + '</div><div class="l">Your Power</div></div>' +
            '<div class="stat"><div class="n">' + Fmt.num(res.defender.power) + '</div><div class="l">Enemy Power</div></div>' +
            '<div class="stat"><div class="n" style="color:#ff8b7f">-' + Fmt.num(res.attacker.losses) + '</div><div class="l">Your Losses</div></div>' +
            '<div class="stat"><div class="n" style="color:var(--success)">-' + Fmt.num(res.defender.losses) + '</div><div class="l">Enemy Losses</div></div>' +
          '</div>' +
          '<div class="res-pill" style="display:inline-flex">' + CURRENCY.FEAR.ic + ' <span class="v">+' + Fmt.num(res.fearGained) + ' Fear</span></div>' +
          '<div style="height:12px"></div>' +
          '<button class="btn btn-secondary btn-sm" id="view-report">📜 VIEW FULL REPORT</button>' +
        '</div>';
      box.querySelector('#view-report').onclick = function () { self._report(res, win); };
      box.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }).catch(function (e) { UI.loading(false); UI.err(e); });
  },

  _report: function (res, win) {
    Modal({
      title: win ? '🏆 Battle Report — Victory' : '💀 Battle Report — Defeat',
      html:
        '<div class="panel" style="margin-bottom:10px"><div class="section-title" style="font-size:13px">Attacker</div>' +
          '<div class="muted" style="font-size:13px">Total power: <span class="count-tag">' + Fmt.int(res.attacker.power) + '</span></div>' +
          '<div class="muted" style="font-size:13px">Troops lost: <span style="color:#ff8b7f">' + Fmt.int(res.attacker.losses) + '</span></div></div>' +
        '<div class="panel" style="margin-bottom:10px"><div class="section-title" style="font-size:13px">Defender</div>' +
          '<div class="muted" style="font-size:13px">Total power: <span class="count-tag">' + Fmt.int(res.defender.power) + '</span></div>' +
          '<div class="muted" style="font-size:13px">Troops lost: <span style="color:var(--success)">' + Fmt.int(res.defender.losses) + '</span></div></div>' +
        '<div class="center"><span class="res-pill" style="display:inline-flex">' + CURRENCY.FEAR.ic + '<span class="v">+' + Fmt.int(res.fearGained) + ' Fear harvested</span></span></div>' +
        '<p class="muted center" style="font-size:12px;margin-top:12px">Class-counter math (spec §98): Samurai › Riders › Archers › Samurai.</p>',
      onMount: function () {}
    });
  },

  _loadMarches: function (wrap) {
    api.getMarches().then(function (marches) {
      var active = (marches || []).filter(function (m) { return (m.status === 'marching' || m.state === 'MARCHING'); });
      if (!active.length) return;
      wrap.innerHTML = active.map(function (m) {
        var total = (m.troopComposition ? (m.troopComposition.infantry || 0) + (m.troopComposition.cavalry || 0) + (m.troopComposition.ranged || 0) : 0);
        return '<div class="panel list-row" style="margin-bottom:8px"><div class="rank-badge">⚔️</div>' +
          '<div style="flex:1"><div style="font-weight:700;color:var(--gold)">' + Fmt.title(m.marchType) + ' → (' + m.targetX + ',' + m.targetY + ')</div>' +
          '<div class="muted" style="font-size:12px">' + Fmt.int(total) + ' troops en route</div></div></div>';
      }).join('');
    }).catch(function () {});
  }
};
