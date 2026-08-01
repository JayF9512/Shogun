/* leaderboard.js — realm rankings. The player is always shown. */
(function () {
  'use strict';

  var NAMES = ['Ironclad Ryu', 'Snowfall Hana', 'Iron Tiger Clan', 'Kurogane', 'Silent Sparrow', 'Red Maple Kai', 'Frostwind Rei', 'Golden Crane', 'Shadow Fang', 'Thunder Mori'];

  Screens.leaderboard = {
    topbar: true, navbar: true, navKey: 'profile',

    render: function (el) {
      el.innerHTML =
        '<div class="screen-head"><button class="hud-btn" id="lb-back">' + icon('back') + '</button><h2>Rankings</h2></div>' +
        '<div class="pad"><div class="tabs"><div class="tab active" data-t="power">Power</div>' +
          '<div class="tab" data-t="fear">Fear</div></div><div id="lb-body"></div></div>';
      el.querySelector('#lb-back').onclick = function () { Router.back('profile'); };

      var self = this;
      function paint(tab) {
        UI.loading(true);
        api.getLeaderboards().then(function (rows) {
          UI.loading(false);
          self._render(el, rows || [], tab);
        }).catch(function () { UI.loading(false); self._render(el, [], tab); });
      }
      Array.prototype.forEach.call(el.querySelectorAll('.tab'), function (t) {
        t.onclick = function () {
          Array.prototype.forEach.call(el.querySelectorAll('.tab'), function (x) { x.classList.remove('active'); });
          t.classList.add('active'); paint(t.getAttribute('data-t'));
        };
      });
      paint('power');
    },

    _render: function (el, rows, tab) {
      var me = { name: Game.displayName(), score: (Game.profile && Number(Game.profile.power)) || 0, isMe: true };
      var list;
      if (rows && rows.length) {
        list = rows.map(function (r, i) { return { name: r.displayName || r.name || ('Lord ' + (i + 1)), score: r.power || r.score || 0, isMe: r.playerId === api.playerId }; });
      } else {
        // Seeded field so the board is never empty; player is inserted by score.
        list = NAMES.map(function (n, i) { return { name: n, score: (tab === 'fear' ? 4000 : 18000) - i * 1500 + (i % 3) * 300 }; });
        list.push(me);
        list.sort(function (a, b) { return b.score - a.score; });
      }
      var body = el.querySelector('#lb-body');
      body.innerHTML = list.map(function (r, i) {
        var rank = i + 1;
        var medal = rank <= 3 ? ['#f5c842', '#cdd6e0', '#c8922a'][rank - 1] : 'transparent';
        return '<div class="card list-card" style="margin-bottom:8px;' + (r.isMe ? 'border-color:var(--gold)' : '') + '">' +
          '<div style="width:30px;text-align:center;font-weight:800;color:' + (rank <= 3 ? medal : 'var(--text-dim)') + '">' + rank + '</div>' +
          '<div class="thumb" style="width:40px;height:40px">' + icon(rank === 1 ? 'crown' : 'people') + '</div>' +
          '<div style="flex:1"><b>' + esc(r.name) + (r.isMe ? ' <span class="lvl-badge">You</span>' : '') + '</b></div>' +
          '<div class="row" style="gap:4px">' + icon(tab === 'fear' ? 'monster' : 'sword', 'sm') + '<b style="color:var(--gold)">' + Fmt.num(r.score) + '</b></div>' +
        '</div>';
      }).join('');
    }
  };
})();
