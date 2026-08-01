/* MAIL — inbox, read, and claim rewards (GET /mail). */
window.Screens.mail = {
  hasNav: true,
  render: function (root) {
    var self = this;
    root.innerHTML =
      '<div class="screen-inner">' +
        '<div style="display:flex;justify-content:space-between;align-items:center">' +
          '<div class="section-title" style="margin:0">📬 War Room Mail</div>' +
          '<button class="btn btn-secondary btn-sm" id="claim-all">Claim All</button>' +
        '</div>' +
        '<div id="mail-list" style="margin-top:14px"><div class="empty"><div class="loader-ring" style="margin:0 auto"></div></div></div>' +
      '</div>';
    root.querySelector('#claim-all').onclick = function () { self._claimAll(root); };
    this._load(root);
  },

  _load: function (root) {
    var self = this;
    var list = root.querySelector('#mail-list');
    api.getMail().then(function (mail) {
      self._mail = mail || [];
      if (!self._mail.length) {
        list.innerHTML = '<div class="empty"><div class="big">📭</div>Your inbox is empty. Rewards and battle reports will arrive here.</div>';
        TopBar._mailUnread = 0; return;
      }
      var unread = self._mail.filter(function (m) { return !m.readAt && !m.isRead; }).length;
      TopBar._mailUnread = unread;
      list.innerHTML = self._mail.map(function (m, i) {
        var isUnread = !m.readAt && !m.isRead;
        var when = m.createdAt ? Fmt.timeLeft ? new Date(m.createdAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '' : '';
        return '<div class="panel list-row" data-i="' + i + '" style="margin-bottom:8px;cursor:pointer">' +
            '<div class="rank-badge">' + (m.attachments || m.rewards ? '🎁' : '✉️') + '</div>' +
            '<div style="flex:1"><div style="font-weight:700;color:var(--gold)">' + esc(m.subject || m.title || 'Message') + (isUnread ? ' <span class="badge badge-new">NEW</span>' : '') + '</div>' +
            '<div class="muted" style="font-size:12px">' + esc(when) + '</div></div>' +
          '</div>';
      }).join('');
      Array.prototype.forEach.call(list.querySelectorAll('[data-i]'), function (el) {
        el.onclick = function () { self._open(self._mail[+el.getAttribute('data-i')], root); };
      });
    }).catch(function (e) { UI.err(e); list.innerHTML = '<div class="empty">Could not load mail.</div>'; });
  },

  _open: function (m, root) {
    var self = this;
    var reward = m.rewards || m.attachments;
    if (!m.readAt && !m.isRead && m.id) api.readMail(m.id).catch(function () {});
    Modal({
      title: esc(m.subject || m.title || 'Message'),
      html:
        '<p class="muted" style="font-size:14px;line-height:1.6;margin:6px 0 14px">' + esc(m.body || m.content || 'No further details.') + '</p>' +
        (reward ? '<div class="panel center" style="margin-bottom:12px">🎁 Reward: <span class="count-tag">' + Fmt.rewards(reward) + '</span></div>' +
          '<button class="btn btn-primary" id="m-claim">CLAIM REWARD</button>' : '<button class="btn btn-secondary" id="m-ok">CLOSE</button>'),
      onMount: function (mm) {
        var ok = mm.querySelector('#m-ok'); if (ok) ok.onclick = closeModal;
        var cl = mm.querySelector('#m-claim');
        if (cl) cl.onclick = function () {
          UI.loading(true);
          api.claimMail(m.id).then(function () { UI.loading(false); closeModal(); UI.ok('Reward claimed!'); self._load(root); })
            .catch(function (e) { UI.loading(false); UI.err(e); });
        };
      }
    });
    self._load(root);
  },

  _claimAll: function (root) {
    var self = this;
    var claimable = (this._mail || []).filter(function (m) { return (m.rewards || m.attachments) && !m.claimedAt; });
    if (!claimable.length) { UI.toast('Nothing to claim.', 'error'); return; }
    UI.loading(true);
    Promise.all(claimable.map(function (m) { return api.claimMail(m.id).catch(function () {}); })).then(function () {
      UI.loading(false); UI.ok('Claimed ' + claimable.length + ' reward' + (claimable.length > 1 ? 's' : '') + '!'); self._load(root);
    });
  }
};
