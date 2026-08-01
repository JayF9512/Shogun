/* LEADERBOARD — POWER (GET /leaderboards) and CLAN (GET /clans) rankings. */
window.Screens.leaderboard = {
  hasNav: true,
  render: function (root) {
    var self = this;
    root.innerHTML =
      '<div class="screen-inner">' +
        '<div class="section-title">Hall of Fame</div>' +
        '<div class="tabs">' +
          '<div class="tab active" data-t="power">⚡ POWER</div>' +
          '<div class="tab" data-t="clan">🏯 CLANS</div>' +
        '</div>' +
        '<div id="lb-body"><div class="empty"><div class="loader-ring" style="margin:0 auto"></div></div></div>' +
      '</div>';
    var tabs = root.querySelectorAll('[data-t]');
    Array.prototype.forEach.call(tabs, function (t) {
      t.onclick = function () {
        Array.prototype.forEach.call(tabs, function (x) { x.classList.remove('active'); });
        t.classList.add('active');
        t.getAttribute('data-t') === 'clan' ? self._clans(root) : self._power(root);
      };
    });
    this._power(root);
  },

  _power: function (root) {
    var self = this;
    var body = root.querySelector('#lb-body');
    body.innerHTML = '<div class="empty"><div class="loader-ring" style="margin:0 auto"></div></div>';
    api.getLeaderboard().then(function (rows) {
      rows = rows || [];
      var meId = api.playerId;
      // Ensure the current player is represented even in a fresh realm.
      var hasMe = rows.some(function (r) { return (r.playerId || r.id) === meId; });
      if (!hasMe && Game.profile) {
        rows = rows.concat([{ playerId: meId, displayName: Game.displayName(), power: Number(Game.profile.power) || 0 }]);
      }
      rows.sort(function (a, b) { return (Number(b.power) || 0) - (Number(a.power) || 0); });
      if (!rows.length) { body.innerHTML = '<div class="empty"><div class="big">🏆</div>No warriors ranked yet. Grow your power to claim the top spot!</div>'; return; }
      body.innerHTML = '<div class="row-list">' + rows.slice(0, 20).map(function (r, i) {
        var rank = i + 1;
        var me = (r.playerId || r.id) === meId;
        var st = localStorage.getItem('shogun_stateName') || 'State 391';
        return '<div class="panel list-row' + (me ? ' me-row' : '') + '">' +
            '<div class="rank-badge rank-' + rank + '">' + (rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : rank) + '</div>' +
            '<div style="flex:1"><div style="font-weight:700;color:var(--gold)">' + esc(r.displayName || r.name || 'Warrior') + (me ? ' <span class="pill-count">YOU</span>' : '') + '</div>' +
            '<div class="muted" style="font-size:12px">' + esc(st) + '</div></div>' +
            '<div style="text-align:right"><div style="font-weight:800;color:var(--gold)">⚡' + Fmt.num(r.power) + '</div><div class="muted" style="font-size:11px">power</div></div>' +
          '</div>';
      }).join('') + '</div>';
    }).catch(function (e) { UI.err(e); body.innerHTML = '<div class="empty">Could not load rankings.</div>'; });
  },

  _clans: function (root) {
    var body = root.querySelector('#lb-body');
    body.innerHTML = '<div class="empty"><div class="loader-ring" style="margin:0 auto"></div></div>';
    api.getClans().then(function (clans) {
      clans = clans || [];
      clans.sort(function (a, b) { return (Number(b.power) || 0) - (Number(a.power) || 0) || (b.memberCount || 0) - (a.memberCount || 0); });
      if (!clans.length) { body.innerHTML = '<div class="empty"><div class="big">🏯</div>No clans ranked yet.</div>'; return; }
      body.innerHTML = '<div class="row-list">' + clans.map(function (c, i) {
        var rank = i + 1;
        return '<div class="panel list-row">' +
            '<div class="rank-badge rank-' + rank + '">' + (rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : rank) + '</div>' +
            '<div style="flex:1"><div style="font-weight:700;color:var(--gold)">[' + esc(c.tag) + '] ' + esc(c.name) + '</div>' +
            '<div class="muted" style="font-size:12px">👥 ' + (c.memberCount || 0) + ' / ' + c.memberCap + '</div></div>' +
            '<div style="text-align:right"><div style="font-weight:800;color:var(--gold)">⚡' + Fmt.num(c.power) + '</div><div class="muted" style="font-size:11px">power</div></div>' +
          '</div>';
      }).join('') + '</div>';
    }).catch(function (e) { UI.err(e); body.innerHTML = '<div class="empty">Could not load clans.</div>'; });
  }
};
