/* SETTLEMENT — the main hub: buildings grid, building modals, march queue. */
window.Screens.settlement = {
  hasNav: true,
  _timer: null,

  // Static building UI meta keyed to a category from the content catalogue.
  BUILDINGS: [
    { key: 'tenshu', ic: '🏯', name: 'Castle' },
    { key: 'barracks', ic: '🛖', name: 'Barracks', action: 'train' },
    { key: 'farm', ic: '🌾', name: 'Farm' },
    { key: 'lumber', ic: '🪵', name: 'Lumber Mill' },
    { key: 'quarry', ic: '⛏️', name: 'Quarry' },
    { key: 'hospital', ic: '⛩️', name: 'Hospital' },
    { key: 'research', ic: '📜', name: 'Research Lab', action: 'research' },
    { key: 'wall', ic: '🧱', name: 'Wall' },
    { key: 'watchtower', ic: '🗼', name: 'Watchtower' },
    { key: 'alliance', ic: '🤝', name: 'Alliance Hall' },
    { key: 'blacksmith', ic: '⚒️', name: 'Blacksmith' },
    { key: 'market', ic: '🪙', name: 'Market' }
  ],

  render: function (root) {
    var self = this;
    root.innerHTML =
      '<div class="screen-bg" style="background-image:url(assets/images/settlement.webp);opacity:.5"></div>' +
      '<div class="screen-inner">' +
        '<div class="section-title">Command Center</div>' +
        '<div class="grid-3" id="quick-actions" style="margin-bottom:18px"></div>' +
        '<div class="section-title">Your Settlement</div>' +
        '<div class="grid-2" id="build-grid"></div>' +
        '<div class="section-title" style="margin-top:20px">March Queue</div>' +
        '<div id="march-queue"><div class="empty" style="padding:16px">No active marches. Send your armies from the World map.</div></div>' +
        '<div style="height:14px"></div>' +
        '<button class="btn btn-secondary" id="go-world">🗺️ OPEN WORLD MAP</button>' +
      '</div>';

    // Building grid — levels are derived deterministically from castle level for display.
    var grid = root.querySelector('#build-grid');
    grid.innerHTML = this.BUILDINGS.map(function (b, i) {
      var lv = self._level(b.key, i);
      return '<div class="card build-card" data-b="' + b.key + '">' +
          '<span class="lv-badge">Lv.' + lv + '</span>' +
          '<span class="build-ic">' + b.ic + '</span>' +
          '<span class="build-name">' + b.name + '</span>' +
        '</div>';
    }).join('');
    Array.prototype.forEach.call(grid.querySelectorAll('[data-b]'), function (c) {
      c.onclick = function () { self._buildingModal(c.getAttribute('data-b')); };
    });

    // Quick-access to feature screens that are not on the bottom tab bar.
    var QA = [
      { s: 'battle', ic: '⚔️', name: 'Battle' },
      { s: 'seasonpass', ic: '🎟️', name: 'Season Pass' },
      { s: 'leaderboard', ic: '🏆', name: 'Rankings' },
      { s: 'events', ic: '🎌', name: 'Events' },
      { s: 'clan', ic: '🏯', name: 'Clan' },
      { s: 'mail', ic: '📬', name: 'Mail' }
    ];
    var qa = root.querySelector('#quick-actions');
    qa.innerHTML = QA.map(function (a) {
      return '<div class="card build-card" data-s="' + a.s + '" style="padding:12px 6px"><span class="build-ic" style="font-size:28px">' + a.ic + '</span><span class="build-name" style="font-size:12px">' + a.name + '</span></div>';
    }).join('');
    Array.prototype.forEach.call(qa.querySelectorAll('[data-s]'), function (c) {
      c.onclick = function () { Router.go(c.getAttribute('data-s')); };
    });

    root.querySelector('#go-world').onclick = function () { Router.go('world'); };

    // Load resources + marches, then keep countdowns ticking.
    this._loadMarches(root);
    Game.refreshResources().then(function () { TopBar.render(); }).catch(function () {});
    this._refreshMail();
  },

  _level: function (key, i) {
    // Deterministic pseudo-levels so the hub feels populated; castle highest.
    var base = Math.max(1, ((Game.profile && Game.profile.level) || 1));
    if (key === 'tenshu') return base;
    return Math.max(1, base - ((i % 5)));
  },

  _refreshMail: function () {
    api.getMail().then(function (mail) {
      var unread = (mail || []).filter(function (m) { return !m.readAt && !m.isRead; }).length;
      TopBar._mailUnread = unread; TopBar.render();
    }).catch(function () {});
  },

  _loadMarches: function (root) {
    var self = this;
    var wrap = root.querySelector('#march-queue');
    api.getMarches().then(function (marches) {
      Game.marches = marches || [];
      if (!Game.marches.length) return;
      self._renderMarches(wrap);
      if (self._timer) clearInterval(self._timer);
      self._timer = setInterval(function () {
        if (!document.getElementById('march-queue')) { clearInterval(self._timer); return; }
        self._renderMarches(document.getElementById('march-queue'));
      }, 1000);
    }).catch(function () {});
  },

  _renderMarches: function (wrap) {
    if (!wrap) return;
    var self = this;
    var active = Game.marches.filter(function (m) { return m.status === 'marching' || m.state === 'MARCHING'; });
    if (!active.length) { wrap.innerHTML = '<div class="empty" style="padding:16px">No active marches. Send your armies from the World map.</div>'; return; }
    wrap.innerHTML = active.map(function (m) {
      var arrive = new Date(m.arrivesAt || m.resolvedAt || (new Date(m.departedAt).getTime() + (m.distance / (m.speed || 100)) * 1000)).getTime();
      var left = arrive - Date.now();
      var total = self._troopTotal(m.troopComposition);
      return '<div class="panel list-row" style="margin-bottom:10px">' +
          '<div class="rank-badge">⚔️</div>' +
          '<div style="flex:1">' +
            '<div style="font-weight:700;color:var(--gold)">' + Fmt.title(m.marchType) + ' → (' + m.targetX + ',' + m.targetY + ')</div>' +
            '<div class="muted" style="font-size:12px">' + Fmt.int(total) + ' troops · <span class="countdown" data-arrive="' + arrive + '">' + Fmt.countdown(left) + '</span></div>' +
          '</div>' +
          '<button class="btn btn-ghost btn-sm" data-recall="' + m.id + '">Recall</button>' +
        '</div>';
    }).join('');
    Array.prototype.forEach.call(wrap.querySelectorAll('[data-recall]'), function (b) {
      b.onclick = function () {
        var id = b.getAttribute('data-recall');
        UI.loading(true);
        api.recallMarch(id).then(function () {
          UI.ok('Army recalled to your settlement.');
          Game.marches = Game.marches.filter(function (m) { return m.id !== id; });
          self._renderMarches(document.getElementById('march-queue'));
        }).catch(function (e) { UI.err(e); }).then(function () { UI.loading(false); });
      };
    });
    // update countdown text live
    Array.prototype.forEach.call(wrap.querySelectorAll('.countdown'), function (c) {
      var left = Number(c.getAttribute('data-arrive')) - Date.now();
      c.textContent = Fmt.countdown(left);
    });
  },

  _troopTotal: function (tc) {
    if (!tc) return 0;
    return (tc.infantry || 0) + (tc.cavalry || 0) + (tc.ranged || 0);
  },

  _buildingModal: function (key) {
    var self = this;
    var meta = this.BUILDINGS.filter(function (b) { return b.key === key; })[0];
    var i = this.BUILDINGS.indexOf(meta);
    var lv = this._level(key, i);
    var defs = (Game.content.buildings || []);
    var def = defs.filter(function (d) { return d.key === key || (d.name || '').toLowerCase().indexOf(meta.name.toLowerCase().split(' ')[0]) >= 0; })[0];
    var cost = self._cost(def, lv);

    var bonus = def && def.producesResource
      ? ('Produces ' + Fmt.title(def.producesResource) + ' · +' + ((def.baseProduction || 10) * lv) + '/hr')
      : 'Boosts your settlement power and defence.';

    var extra = '';
    if (meta.action === 'train') extra = '<button class="btn btn-secondary" id="b-train" style="margin-top:10px">🪖 TRAIN TROOPS</button>';
    if (meta.action === 'research') extra = '<button class="btn btn-secondary" id="b-research" style="margin-top:10px">🔬 RESEARCH</button>';

    Modal({
      title: meta.ic + ' ' + meta.name,
      html:
        '<div class="center"><span class="pill-count">Level ' + lv + ' / ' + ((def && def.maxLevel) || 30) + '</span></div>' +
        '<p class="muted center" style="margin:12px 0">' + bonus + '</p>' +
        '<div class="panel" style="margin-bottom:12px">' +
          '<div class="section-title" style="font-size:14px">Upgrade to Level ' + (lv + 1) + '</div>' +
          '<div class="res-row" style="flex-wrap:wrap">' + self._costPills(cost) + '</div>' +
          '<div class="muted" style="font-size:12px;margin-top:8px">⏱️ Build time: ' + self._buildTime(def, lv) + '</div>' +
        '</div>' +
        '<button class="btn btn-primary" id="b-up">⬆️ UPGRADE</button>' +
        extra,
      onMount: function (m) {
        m.querySelector('#b-up').onclick = function () {
          closeModal();
          UI.ok(meta.name + ' upgrade started (Lv.' + (lv + 1) + '). Resources will be spent as it completes.');
        };
        var tr = m.querySelector('#b-train');
        if (tr) tr.onclick = function () { closeModal(); Router.go('world'); UI.toast('Train troops, then dispatch them from the World map.'); };
        var rs = m.querySelector('#b-research');
        if (rs) rs.onclick = function () { closeModal(); UI.ok('Research queued. Your scholars begin their work.'); };
      }
    });
  },

  _cost: function (def, lv) {
    var c = (def && def.costCurve) || { baseRice: 200, baseWood: 150, baseStone: 120, baseIron: 30, growth: 1.25 };
    var g = Math.pow(c.growth || 1.25, lv);
    return {
      RICE: Math.round((c.baseRice || 100) * g),
      WOOD: Math.round((c.baseWood || 80) * g),
      STONE: Math.round((c.baseStone || 60) * g),
      IRON: Math.round((c.baseIron || 20) * g)
    };
  },
  _costPills: function (cost) {
    return Object.keys(cost).map(function (k) {
      return '<div class="res-pill"><span class="ic">' + (RESOURCE[k] ? RESOURCE[k].ic : '📦') + '</span><span class="v">' + Fmt.num(cost[k]) + '</span></div>';
    }).join('');
  },
  _buildTime: function (def, lv) {
    var t = (def && def.timeCurve) || { baseSeconds: 120, growth: 1.2 };
    var s = Math.round((t.baseSeconds || 120) * Math.pow(t.growth || 1.2, lv));
    var h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
    return (h ? h + 'h ' : '') + m + 'm ' + (s % 60) + 's';
  }
};
