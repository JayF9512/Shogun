/* world.js — the strategic realm map. */
(function () {
  'use strict';

  Screens.world = {
    topbar: true, navbar: true, navKey: 'world',

    render: function (el) {
      el.innerHTML =
        '<div id="worldmap-canvas-container"></div>' +
        '<div class="map-toolbar">' +
          '<div class="map-chip">' + esc(localStorage.getItem('shogun_stateName') || 'State 1') + '</div>' +
          '<div class="spacer"></div>' +
          '<button class="map-chip" id="wm-recenter">Recenter</button>' +
        '</div>';

      var container = el.querySelector('#worldmap-canvas-container');
      var self = this;
      try {
        WorldMap.create(container, function (node) { self._node(node); });
      } catch (e) { console.error(e); container.innerHTML = '<div class="empty">' + icon('map') + '<div>Map unavailable.</div></div>'; }

      el.querySelector('#wm-recenter').onclick = function () {
        var wm = WorldMap.instance;
        if (wm) { wm._centerOn(wm.player.x, wm.player.y); wm.draw(); }
      };
    },

    _node: function (n) {
      var title, body, actions;
      if (n.type === 'player') {
        title = n.name + '\u2019s Castle';
        body = '<p style="font-size:14px">Your seat of power. Power: <b style="color:var(--gold)">' + Fmt.int(n.power || 0) + '</b></p>';
        actions = '<button class="btn" id="n-go">Enter city</button>';
      } else if (n.type === 'monster') {
        title = n.name;
        body = '<p style="font-size:14px">A level ' + n.level + ' Yokai roams here. Defeat it to gain fear and spoils.</p>';
        actions = '<button class="btn danger" id="n-attack">Attack</button>';
      } else if (n.type === 'castle') {
        title = n.name + '\u2019s Stronghold';
        body = '<p style="font-size:14px">A rival warlord. Power: <b style="color:#ff8b7d">' + Fmt.int(n.power || 0) + '</b></p>';
        actions = '<button class="btn danger" id="n-attack">March to attack</button><button class="btn secondary" id="n-scout" style="margin-top:8px">Scout</button>';
      } else {
        title = (TERMS.resources[n.res] || 'Resource') + ' Field';
        body = '<p style="font-size:14px">A level ' + (n.level || 1) + ' node rich in ' + (TERMS.resources[n.res] || 'resources') + '. Send troops to gather.</p>';
        actions = '<button class="btn jade" id="n-gather">Gather</button>';
      }
      Modal(
        '<h3 class="sec-title">' + esc(title) + '</h3>' +
        '<div class="panel stack">' + body +
          '<div class="muted" style="font-size:12px">Coordinates: (' + Math.round(n.x) + ', ' + Math.round(n.y) + ')</div>' +
          actions +
        '</div>' +
        '<button class="btn secondary" id="n-close" style="margin-top:8px">Close</button>');

      var close = document.getElementById('n-close'); if (close) close.onclick = closeModal;
      var go = document.getElementById('n-go'); if (go) go.onclick = function () { closeModal(); Router.reset('settlement'); };
      var atk = document.getElementById('n-attack'); if (atk) atk.onclick = function () {
        closeModal();
        if (Game.shieldRemainingMs() > 0) { window.showShieldModal(); return; }
        Router.go('battle', { target: n });
      };
      var scout = document.getElementById('n-scout'); if (scout) scout.onclick = function () { closeModal(); UI.ok('Scouts dispatched \u2014 report arriving soon.'); };
      var gather = document.getElementById('n-gather'); if (gather) gather.onclick = function () { closeModal(); UI.ok('Gathering party sent to the ' + (TERMS.resources[n.res] || 'node') + ' field.'); };
    },

    destroy: function () { if (WorldMap.instance) { try { WorldMap.instance.dispose(); WorldMap.instance = null; } catch (e) {} } }
  };
})();
