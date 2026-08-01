/* SEASON PASS — 30-tier horizontal track (GET /season-pass). */
window.Screens.seasonpass = {
  hasNav: true,
  render: function (root) {
    var self = this;
    root.innerHTML =
      '<div class="screen-inner">' +
        '<div class="section-title" id="sp-title">Season Pass</div>' +
        '<div id="sp-head"></div>' +
        '<div class="pass-track" id="sp-track"><div class="empty"><div class="loader-ring" style="margin:0 auto"></div></div></div>' +
      '</div>';

    UI.loading(true);
    api.getSeasonPass().then(function (data) {
      UI.loading(false);
      self._render(root, data);
    }).catch(function (e) { UI.loading(false); UI.err(e); root.querySelector('#sp-track').innerHTML = '<div class="empty">Could not load the season pass.</div>'; });
  },

  _render: function (root, data) {
    var season = data.season || {};
    var tiers = data.tiers || [];
    // Client-side progress model (points are derived from profile power for a lively demo of the ladder).
    var points = (data.progress && data.progress.points) || (Game.profile ? Math.min(15000, (Game.profile.level || 1) * 800) : 2400);
    var isPremium = (data.progress && data.progress.premium) || localStorage.getItem('shogun_pass_premium') === '1';
    var currentTier = 0;
    tiers.forEach(function (t) { if (points >= t.requiredPoints) currentTier = t.tier; });

    root.querySelector('#sp-title').textContent = '🎟️ ' + (season.name || 'Season Pass');
    var next = tiers.filter(function (t) { return t.tier === currentTier + 1; })[0];
    var pctTo = next ? Math.min(100, Math.round((points / next.requiredPoints) * 100)) : 100;

    root.querySelector('#sp-head').innerHTML =
      '<div class="panel" style="margin-bottom:14px">' +
        '<div style="display:flex;justify-content:space-between;align-items:center">' +
          '<div><div style="font-weight:800;color:var(--gold)">Season Points</div><div class="muted" style="font-size:12px">Tier ' + currentTier + ' / ' + tiers.length + '</div></div>' +
          (isPremium ? '<span class="badge badge-rec">PREMIUM</span>' : '<button class="btn btn-primary btn-sm" id="go-prem">GO PREMIUM</button>') +
        '</div>' +
        '<div class="progress-track" style="margin-top:10px"><div class="progress-fill" style="width:' + pctTo + '%"></div></div>' +
        '<div class="muted" style="font-size:12px;margin-top:6px">' + Fmt.int(points) + (next ? ' / ' + Fmt.int(next.requiredPoints) + ' pts to Tier ' + next.tier : ' pts — max tier reached') + '</div>' +
      '</div>';

    var goPrem = root.querySelector('#go-prem');
    if (goPrem) goPrem.onclick = function () {
      localStorage.setItem('shogun_pass_premium', '1');
      UI.ok('Premium pass unlocked! Premium rewards are now claimable.');
      Router.go('seasonpass');
    };

    var claimed = JSON.parse(localStorage.getItem('shogun_pass_claimed') || '[]');
    var self = this;
    root.querySelector('#sp-track').innerHTML = tiers.map(function (t) {
      var reached = points >= t.requiredPoints;
      var isCur = t.tier === currentTier + 1;
      function box(reward, premium) {
        var isClaimed = claimed.indexOf(t.tier + (premium ? 'p' : 'f')) >= 0;
        var canClaim = reached && (!premium || isPremium) && !isClaimed;
        var cls = 'reward-box' + (premium ? ' premium' : '') + (isClaimed ? ' claimed' : '') + (canClaim && isCur ? ' claimable' : '');
        return '<div class="' + cls + '" data-claim="' + (canClaim ? (t.tier + (premium ? 'p' : 'f')) : '') + '">' +
          (isClaimed ? '<div style="font-size:18px">✅</div>' : '') +
          '<div>' + Fmt.rewards(reward) + '</div>' +
          (canClaim ? '<div style="font-size:10px;color:var(--gold)">CLAIM</div>' : (!reached ? '<div style="font-size:10px" class="muted">🔒</div>' : '')) +
        '</div>';
      }
      return '<div class="tier-col' + (isCur ? ' current' : '') + '">' +
          '<div class="tier-num">TIER ' + t.tier + '</div>' +
          box(t.freeReward, false) +
          box(t.premiumReward, true) +
        '</div>';
    }).join('');

    Array.prototype.forEach.call(root.querySelectorAll('[data-claim]'), function (el) {
      var code = el.getAttribute('data-claim');
      if (!code) return;
      el.onclick = function () {
        var arr = JSON.parse(localStorage.getItem('shogun_pass_claimed') || '[]');
        if (arr.indexOf(code) >= 0) return;
        arr.push(code); localStorage.setItem('shogun_pass_claimed', JSON.stringify(arr));
        UI.ok('Reward claimed!');
        self._render(root, data);
      };
    });

    // Scroll current tier into view.
    var cur = root.querySelector('.tier-col.current');
    if (cur) cur.scrollIntoView({ inline: 'center', block: 'nearest' });
  }
};
