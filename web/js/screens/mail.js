/* mail.js — the war-room inbox. Reports, rewards, and decrees. */
(function () {
  'use strict';

  // A seed welcome letter so a brand-new lord always has mail.
  function seedMail() {
    return [{
      id: 'seed-welcome', local: true,
      sender: 'Akari', subject: 'Welcome home, my lord',
      body: 'The shrine has waited long for your return. Your domain is small, but ambition needs only a spark. Claim this gift and let the rebuilding begin.',
      rewards: { RICE: 1000, WOOD: 1000 }, readAt: null, claimedAt: null
    }, {
      id: 'seed-decree', local: true,
      sender: 'War Council', subject: 'The realm stirs',
      body: 'Warlords gather beyond your borders. Strengthen your walls and muster your armies before the Crimson Eclipse deepens.',
      rewards: null, readAt: null, claimedAt: null
    }];
  }

  function claimedLocal() { try { return JSON.parse(localStorage.getItem('shogun_mail_claimed') || '[]'); } catch (e) { return []; } }
  function addClaimed(id) { var a = claimedLocal(); if (a.indexOf(id) < 0) a.push(id); localStorage.setItem('shogun_mail_claimed', JSON.stringify(a)); }

  Screens.mail = {
    topbar: true, navbar: true, navKey: 'profile',

    render: function (el) {
      el.innerHTML =
        '<div class="screen-head"><button class="hud-btn" id="m-back">' + icon('back') + '</button><h2>Mail</h2></div>' +
        '<div class="pad" id="m-body"><div class="empty">' + icon('mail') + '<div>Loading\u2026</div></div></div>';
      el.querySelector('#m-back').onclick = function () { Router.back('profile'); };

      var self = this;
      UI.loading(true);
      api.getMail().then(function (rows) {
        UI.loading(false);
        var list = (rows && rows.length) ? rows : seedMail();
        self._paint(el, list);
      }).catch(function () { UI.loading(false); self._paint(el, seedMail()); });
    },

    _paint: function (el, list) {
      var self = this;
      var cl = claimedLocal();
      var body = el.querySelector('#m-body');
      if (!list.length) { body.innerHTML = '<div class="empty">' + icon('mail') + '<div>No mail.</div></div>'; return; }
      body.innerHTML = list.map(function (m) {
        var claimed = m.claimedAt || cl.indexOf(m.id) >= 0;
        var hasReward = m.rewards && Object.keys(m.rewards).length;
        return '<div class="card" style="margin-bottom:10px;padding:14px" data-id="' + esc(m.id) + '">' +
          '<div class="row between"><b style="color:var(--gold)">' + esc(m.subject || 'Message') + '</b>' +
            '<span class="muted" style="font-size:11px">' + esc(m.sender || 'System') + '</span></div>' +
          '<p class="muted" style="font-size:13px;line-height:1.5;margin:8px 0">' + esc(m.body || '') + '</p>' +
          (hasReward ? '<div class="row between"><span class="row" style="gap:8px">' + Fmt.rewards(m.rewards) + '</span>' +
            '<button class="btn sm" data-claim="' + esc(m.id) + '" ' + (claimed ? 'disabled' : '') + '>' + (claimed ? 'Claimed' : 'Claim') + '</button></div>' : '') +
        '</div>';
      }).join('');

      Array.prototype.forEach.call(body.querySelectorAll('[data-claim]'), function (b) {
        b.onclick = function () {
          var id = b.getAttribute('data-claim');
          var m = list.filter(function (x) { return x.id === id; })[0];
          var finish = function () {
            addClaimed(id);
            if (m && m.rewards) {
              Game.refreshResources().then(function () { TopBar.render(); }).catch(function () {});
              UI.ok('Rewards claimed');
            }
            self._paint(el, list);
          };
          if (m && m.local) { finish(); }
          else { UI.loading(true); api.claimMail(id).then(function () { UI.loading(false); finish(); }).catch(function (e) { UI.loading(false); UI.err(e); }); }
        };
      });

      // mark unread as read (best-effort for server mail)
      list.forEach(function (m) { if (!m.local && !m.readAt) api.readMail(m.id).catch(function () {}); });
      TopBar.setMailUnread(0);
    }
  };
})();
