/* STATE SELECT — choose a realm/server before playing. */
window.Screens.stateselect = {
  hasNav: false,
  render: function (root) {
    root.innerHTML =
      '<div class="screen-bg" style="background-image:url(assets/images/state-select.webp)"></div>' +
      '<div class="screen-inner">' +
        '<h1 class="h-title">Select Your Realm</h1>' +
        '<p class="h-sub">Choose a state to begin your conquest. Recommended realms have room to grow.</p>' +
        '<div id="st-list" class="row-list" style="margin-top:18px"><div class="empty"><div class="loader-ring" style="margin:0 auto"></div></div></div>' +
      '</div>';

    var list = root.querySelector('#st-list');
    UI.loading(true);
    api.getStates().then(function (states) {
      UI.loading(false);
      if (!states || !states.length) { list.innerHTML = '<div class="empty">No realms are open right now.</div>'; return; }
      // Recommend the first open, non-full state (State 391 in seed data).
      var recId = (states.filter(function (s) { return s.isOpen && !s.isFull; })[0] || states[0]).id;
      list.innerHTML = states.map(function (s) {
        var open = s.isOpen && !s.isFull;
        return '<div class="panel list-row" data-id="' + s.id + '" style="cursor:pointer">' +
            '<div class="rank-badge">🏯</div>' +
            '<div style="flex:1">' +
              '<div style="font-weight:800;color:var(--gold);font-size:15px">' + esc(s.name) +
                (s.id === recId ? ' <span class="badge badge-rec">RECOMMENDED</span>' : '') + '</div>' +
              '<div class="muted" style="font-size:12px;margin-top:3px">👥 ' + Fmt.int(s.playerCount || 0) + ' / ' + Fmt.int(s.playerCap || 0) + ' warriors</div>' +
            '</div>' +
            '<span class="badge ' + (open ? 'badge-open' : 'badge-closed') + '">' + (open ? 'OPEN' : 'FULL') + '</span>' +
          '</div>';
      }).join('');

      Array.prototype.forEach.call(list.querySelectorAll('[data-id]'), function (row) {
        row.onclick = function () {
          var id = row.getAttribute('data-id');
          var st = states.filter(function (s) { return s.id === id; })[0];
          if (!(st.isOpen && !st.isFull)) { UI.toast('That realm is closed. Choose another.', 'error'); return; }
          api.setState(id);
          localStorage.setItem('shogun_stateName', st.name);
          Router.go('welcome');
        };
      });
    }).catch(function (e) { UI.loading(false); list.innerHTML = '<div class="empty">Could not load realms. Please try again.</div>'; UI.err(e); });
  }
};
