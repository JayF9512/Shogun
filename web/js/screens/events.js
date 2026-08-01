/* EVENTS — active events (GET /events) with detail modal. */
window.Screens.events = {
  hasNav: true,
  render: function (root) {
    var self = this;
    root.innerHTML =
      '<div class="screen-inner">' +
        '<div class="section-title">⚔️ Active Events</div>' +
        '<div id="ev-list"><div class="empty"><div class="loader-ring" style="margin:0 auto"></div></div></div>' +
      '</div>';
    var list = root.querySelector('#ev-list');
    api.getEvents().then(function (events) {
      events = (events || []).filter(function (e) { return e.isActive !== false; });
      if (!events.length) { list.innerHTML = '<div class="empty"><div class="big">🎌</div>No events are running right now. Check back soon!</div>'; return; }
      list.innerHTML = events.map(function (e, i) {
        return '<div class="panel" data-i="' + i + '" style="margin-bottom:12px;cursor:pointer;overflow:hidden;padding:0">' +
            '<div style="position:relative"><img src="assets/images/battle-scene.webp" style="width:100%;height:120px;object-fit:cover" alt="event" />' +
              '<div style="position:absolute;inset:0;background:linear-gradient(180deg,transparent,rgba(13,11,26,.92))"></div>' +
              '<div style="position:absolute;bottom:10px;left:12px;right:12px">' +
                '<div style="font-family:Cinzel;font-weight:800;color:var(--gold);font-size:16px;text-shadow:0 2px 6px #000">' + esc(e.name) + '</div>' +
                '<div class="countdown" data-end="' + new Date(e.endsAt).getTime() + '" style="font-size:12px">⏳ ' + Fmt.timeLeft(e.endsAt) + ' left</div>' +
              '</div>' +
            '</div>' +
            '<div style="padding:10px 12px"><span class="badge badge-open">ACTIVE</span> <span class="pill-count" style="float:right">VIEW ▸</span></div>' +
          '</div>';
      }).join('');
      Array.prototype.forEach.call(list.querySelectorAll('[data-i]'), function (el) {
        el.onclick = function () { self._detail(events[+el.getAttribute('data-i')]); };
      });
    }).catch(function (er) { UI.err(er); list.innerHTML = '<div class="empty">Could not load events.</div>'; });
  },

  _detail: function (e) {
    var tiers = (e.rewards || []).slice(0, 6);
    var tierHtml = tiers.length ? '<div class="section-title" style="font-size:14px;margin-top:12px">Reward Milestones</div>' +
      tiers.map(function (t) {
        return '<div class="panel list-row" style="margin-bottom:6px;padding:8px 10px"><div class="rank-badge">T' + t.tier + '</div>' +
          '<div style="flex:1"><div class="muted" style="font-size:12px">' + Fmt.int(t.requiredPoints) + ' pts</div></div>' +
          '<div style="color:var(--gold);font-weight:700;font-size:13px">' + Fmt.rewards(t.premiumReward || t.freeReward) + '</div></div>';
      }).join('') : '';
    Modal({
      title: esc(e.name),
      html:
        '<img src="assets/images/battle-scene.webp" style="width:100%;border-radius:12px;margin-bottom:10px" alt="event" />' +
        '<div class="center"><span class="badge badge-open">ACTIVE</span> <span class="pill-count">⏳ ' + Fmt.timeLeft(e.endsAt) + ' left</span></div>' +
        '<p class="muted center" style="margin:12px 0">' + esc(e.description || 'A limited-time event. Earn points and claim rewards.') + '</p>' +
        tierHtml +
        '<button class="btn btn-primary" id="ev-go" style="margin-top:12px">🎟️ VIEW SEASON PASS</button>',
      onMount: function (m) { m.querySelector('#ev-go').onclick = function () { closeModal(); Router.go('seasonpass'); }; }
    });
  }
};
