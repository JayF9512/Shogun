/* seasonpass.js — seasonal reward track with free + premium lanes. */
(function () {
  'use strict';

  function claimed() { try { return JSON.parse(localStorage.getItem('shogun_pass_claimed') || '[]'); } catch (e) { return []; } }
  function setClaimed(a) { localStorage.setItem('shogun_pass_claimed', JSON.stringify(a)); }
  function hasPrem() { return localStorage.getItem('shogun_pass_premium') === '1'; }

  Screens.seasonpass = {
    topbar: true, navbar: true, navKey: 'store',

    render: function (el) {
      el.innerHTML =
        '<div class="screen-head"><button class="hud-btn" id="sp-back">' + icon('back') + '</button><h2>Season Pass</h2></div>' +
        '<div class="pad" id="sp-body"><div class="empty">' + icon('banner') + '<div>Loading\u2026</div></div></div>';
      el.querySelector('#sp-back').onclick = function () { Router.back('store'); };

      var self = this;
      UI.loading(true);
      api.getSeasonPass().then(function (d) {
        UI.loading(false);
        self._data = d;
        self._paint(el, d);
      }).catch(function (e) {
        UI.loading(false);
        el.querySelector('#sp-body').innerHTML = '<div class="empty">' + icon('banner') + '<div>' + esc(api.friendly(e)) + '</div></div>';
      });
    },

    _paint: function (el, d) {
      var season = (d && d.season) || { name: 'The Crimson Eclipse' };
      var tiers = (d && d.tiers) || [];
      var points = 0; // seed players start at 0 season points
      var prem = hasPrem();
      var body = el.querySelector('#sp-body');
      var self = this;

      var track = tiers.map(function (t) {
        var done = claimed().indexOf(t.tier) >= 0;
        var reached = points >= (t.requiredPoints || 0);
        return '<div class="pass-tier' + (done ? ' done' : '') + '">' +
          '<div class="th">Tier ' + t.tier + '</div>' +
          '<div class="rw free"><span class="pill-tag pill-free">Free</span><div style="margin-top:5px">' + (Fmt.rewards(t.freeReward) || '\u2014') + '</div></div>' +
          '<div class="rw"><span class="pill-tag pill-prem">Premium</span><div style="margin-top:5px">' + (Fmt.rewards(t.premiumReward) || '\u2014') + '</div></div>' +
          '<div style="padding:8px"><button class="btn sm" data-tier="' + t.tier + '" ' + (reached ? '' : 'disabled') + ' style="width:100%">' + (done ? 'Claimed' : (reached ? 'Claim' : 'Locked')) + '</button></div>' +
        '</div>';
      }).join('');

      body.innerHTML =
        '<div class="panel gold stack" style="margin-bottom:14px">' +
          '<div class="row between"><div><div class="title-md" style="font-size:18px">' + esc(season.name) + '</div>' +
            '<div class="muted" style="font-size:12px">Season Zero \u2022 ' + tiers.length + ' tiers</div></div>' +
            '<span class="pill-tag ' + (prem ? 'pill-prem' : 'pill-free') + '">' + (prem ? 'PREMIUM' : 'FREE') + '</span></div>' +
          '<div class="row between"><span class="muted">Season points</span><b style="color:var(--gold)">' + Fmt.int(points) + '</b></div>' +
          (prem ? '' : '<button class="btn" id="sp-upgrade">Unlock Premium Pass</button>') +
        '</div>' +
        '<div class="pass-track">' + track + '</div>' +
        '<p class="muted center" style="font-size:12px;margin-top:10px">Earn season points from events and battles to climb the track.</p>';

      var up = document.getElementById('sp-upgrade');
      if (up) up.onclick = function () {
        Modal('<div class="panel gold center stack"><div class="ic lg" style="margin:0 auto">' + icon('banner') + '</div>' +
          '<h3 class="title-md">Premium Pass</h3><p class="muted" style="font-size:13px">Unlock premium rewards on every tier for the season.</p>' +
          '<div class="grid-2"><button class="btn secondary" id="up-no">Later</button><button class="btn" id="up-yes">Unlock</button></div></div>', { center: true });
        document.getElementById('up-no').onclick = closeModal;
        document.getElementById('up-yes').onclick = function () {
          localStorage.setItem('shogun_pass_premium', '1'); closeModal(); UI.ok('Premium Pass unlocked!'); self._paint(el, self._data);
        };
      };

      Array.prototype.forEach.call(body.querySelectorAll('[data-tier]'), function (b) {
        b.onclick = function () {
          var tier = Number(b.getAttribute('data-tier'));
          var c = claimed(); if (c.indexOf(tier) < 0) c.push(tier); setClaimed(c);
          UI.ok('Tier ' + tier + ' rewards claimed.');
          self._paint(el, self._data);
        };
      });
    }
  };
})();
