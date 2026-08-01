/* events.js — limited-time campaigns. */
(function () {
  'use strict';

  Screens.events = {
    topbar: true, navbar: true, navKey: 'settlement',

    render: function (el) {
      el.innerHTML =
        '<div class="screen-head"><button class="hud-btn" id="e-back">' + icon('back') + '</button><h2>Events</h2></div>' +
        '<div class="pad" id="e-body"><div class="empty">' + icon('calendar') + '<div>Loading\u2026</div></div></div>';
      el.querySelector('#e-back').onclick = function () { Router.back('settlement'); };

      var self = this;
      UI.loading(true);
      api.getEvents().then(function (rows) {
        UI.loading(false);
        self._paint(el, rows || []);
      }).catch(function (e) {
        UI.loading(false);
        el.querySelector('#e-body').innerHTML = '<div class="empty">' + icon('calendar') + '<div>' + esc(api.friendly(e)) + '</div></div>';
      });
    },

    _paint: function (el, rows) {
      var body = el.querySelector('#e-body');
      if (!rows.length) { body.innerHTML = '<div class="empty">' + icon('calendar') + '<div>No active events.</div></div>'; return; }
      body.innerHTML = rows.map(function (ev) {
        var active = ev.isActive;
        var end = ev.endsAt ? new Date(ev.endsAt) : null;
        var left = end ? Math.max(0, (end.getTime() - Date.now()) / 1000) : 0;
        var tiers = (ev.rewards || []).map(function (r) {
          return '<div class="card list-card" style="margin-bottom:6px"><div class="thumb" style="width:40px;height:40px">' + icon('trophy') + '</div>' +
            '<div style="flex:1"><b>Tier ' + (r.tier != null ? r.tier : '\u2014') + '</b></div>' +
            '<span class="row" style="gap:6px">' + (Fmt.rewards(r.freeReward) || '') + (Fmt.rewards(r.premiumReward) || '') + '</span></div>';
        }).join('');
        return '<div class="panel gold stack" style="margin-bottom:14px">' +
          '<div class="row between"><div class="title-md" style="font-size:18px">' + esc(ev.name) + '</div>' +
            '<span class="pill-tag ' + (active ? 'pill-prem' : 'pill-free') + '">' + (active ? 'LIVE' : 'SOON') + '</span></div>' +
          '<p class="muted" style="font-size:13px;line-height:1.5">' + esc(ev.description || '') + '</p>' +
          (left > 0 ? '<div class="row" style="gap:6px">' + icon('timer', 'sm') + '<b style="color:var(--gold)">' + Fmt.time(left) + ' remaining</b></div>' : '') +
          (ev.scoringRules ? '<div class="muted" style="font-size:12px">Scoring: ' + esc(Fmt.title(ev.type || 'activity')) + ' \u2022 ' + ((ev.scoringRules.pointsPerActivity) || 1) + ' pts / action</div>' : '') +
          (tiers ? '<h4 class="sec-title">Rewards</h4>' + tiers : '') +
          '<button class="btn" data-ev="' + esc(ev.id) + '">Participate</button>' +
        '</div>';
      }).join('');

      Array.prototype.forEach.call(body.querySelectorAll('[data-ev]'), function (b) {
        b.onclick = function () { UI.ok('You have joined the event. Earn points through battle and building.'); };
      });
    }
  };
})();
