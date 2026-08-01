/* CLAN — create/join if clanless, or clan home if a member. */
window.Screens.clan = {
  hasNav: true,
  render: function (root) {
    var self = this;
    var clanId = localStorage.getItem('shogun_clanId');
    root.innerHTML = '<div class="screen-inner"><div class="section-title">🏯 Clan</div><div id="clan-body"><div class="empty"><div class="loader-ring" style="margin:0 auto"></div></div></div></div>';
    if (clanId) this._home(root, clanId);
    else this._lobby(root);
  },

  _lobby: function (root) {
    var self = this;
    var body = root.querySelector('#clan-body');
    body.innerHTML =
      '<div class="panel center" style="margin-bottom:14px">' +
        '<div style="font-size:44px">🏯</div>' +
        '<div style="font-family:Cinzel;font-size:18px;color:var(--gold);margin-top:6px">Start or Join a Clan!</div>' +
        '<p class="muted" style="font-size:13px;margin:8px 0 14px">Band together for alliance wars, shared territory and rally attacks.</p>' +
        '<button class="btn btn-primary" id="c-create">➕ FOUND A CLAN</button>' +
      '</div>' +
      '<div class="field"><input class="input" id="c-q" placeholder="Search clans by name…" /></div>' +
      '<div id="c-list"></div>';
    body.querySelector('#c-create').onclick = function () { self._createModal(root); };
    var q = body.querySelector('#c-q'); var deb;
    q.oninput = function () { clearTimeout(deb); deb = setTimeout(function () { self._list(body.querySelector('#c-list'), q.value.trim()); }, 300); };
    this._list(body.querySelector('#c-list'), '');
  },

  _list: function (list, q) {
    var self = this;
    list.innerHTML = '<div class="empty"><div class="loader-ring" style="margin:0 auto"></div></div>';
    api.getClans(q).then(function (clans) {
      clans = clans || [];
      if (!clans.length) { list.innerHTML = '<div class="empty">No clans found. Found your own!</div>'; return; }
      list.innerHTML = clans.map(function (c) {
        return '<div class="panel list-row" style="margin-bottom:8px"><div class="rank-badge">🏯</div>' +
          '<div style="flex:1"><div style="font-weight:700;color:var(--gold)">[' + esc(c.tag) + '] ' + esc(c.name) + '</div>' +
          '<div class="muted" style="font-size:12px">👥 ' + (c.memberCount || 0) + '/' + c.memberCap + ' · ⚡' + Fmt.num(c.power) + '</div></div>' +
          '<button class="btn btn-primary btn-sm" data-join="' + c.id + '">JOIN</button></div>';
      }).join('');
      Array.prototype.forEach.call(list.querySelectorAll('[data-join]'), function (b) {
        b.onclick = function () {
          UI.loading(true);
          api.joinClan(b.getAttribute('data-join')).then(function () { UI.loading(false); UI.ok('Join request sent to the clan leaders!'); })
            .catch(function (e) { UI.loading(false); UI.err(e); });
        };
      });
    }).catch(function (e) { UI.err(e); list.innerHTML = '<div class="empty">Could not load clans.</div>'; });
  },

  _createModal: function (root) {
    var self = this;
    Modal({
      title: '➕ Found a Clan',
      html:
        '<div class="field"><label>Clan Name (3-30 chars)</label><input class="input" id="cc-name" maxlength="30" placeholder="e.g. Crimson Lotus" /></div>' +
        '<div class="field"><label>Tag (3-5 chars)</label><input class="input" id="cc-tag" maxlength="5" placeholder="e.g. LOTUS" /></div>' +
        '<div class="field"><label>Description</label><input class="input" id="cc-desc" maxlength="200" placeholder="Your clan motto" /></div>' +
        '<div class="form-err" id="cc-err"></div>' +
        '<button class="btn btn-primary" id="cc-go">FOUND CLAN</button>',
      onMount: function (m) {
        m.querySelector('#cc-go').onclick = function () {
          var name = m.querySelector('#cc-name').value.trim();
          var tag = m.querySelector('#cc-tag').value.trim().toUpperCase();
          var desc = m.querySelector('#cc-desc').value.trim();
          var err = m.querySelector('#cc-err');
          if (name.length < 3) { err.textContent = 'Clan name needs at least 3 characters.'; return; }
          if (tag.length < 3) { err.textContent = 'Tag needs 3-5 characters.'; return; }
          err.textContent = ''; UI.loading(true);
          var dto = { name: name, tag: tag };
          if (desc) dto.description = desc;
          api.createClan(dto).then(function (clan) {
            UI.loading(false); closeModal();
            localStorage.setItem('shogun_clanId', clan.id);
            UI.ok('Clan [' + tag + '] ' + name + ' founded!');
            Router.go('clan');
          }).catch(function (e) { UI.loading(false); err.textContent = e.message; });
        };
      }
    });
  },

  _home: function (root, clanId) {
    var self = this;
    var body = root.querySelector('#clan-body');
    api.getClan(clanId).then(function (c) {
      var members = c.members || [];
      body.innerHTML =
        '<div class="panel center" style="margin-bottom:14px">' +
          '<div style="font-size:40px">🏯</div>' +
          '<div style="font-family:Cinzel;font-size:20px;color:var(--gold)">[' + esc(c.tag) + '] ' + esc(c.name) + '</div>' +
          '<p class="muted" style="font-size:13px;margin:6px 0">' + esc(c.description || 'Honour above all.') + '</p>' +
          '<div class="stat-grid" style="margin-top:10px">' +
            '<div class="stat"><div class="n">⚡' + Fmt.num(c.power) + '</div><div class="l">Clan Power</div></div>' +
            '<div class="stat"><div class="n">' + (c.memberCount || members.length) + '/' + c.memberCap + '</div><div class="l">Members</div></div>' +
          '</div>' +
        '</div>' +
        '<div class="tabs"><div class="tab active" data-t="members">MEMBERS</div><div class="tab" data-t="territory">TERRITORY</div></div>' +
        '<div id="clan-tab"></div>' +
        '<div class="divider"></div><button class="btn btn-ghost" id="c-leave">Leave Clan</button>';

      function members_tab() {
        var t = document.getElementById('clan-tab');
        var rows = members.length ? members : [{ displayName: Game.displayName(), role: 'LEADER', power: (Game.profile && Game.profile.power) || 0 }];
        t.innerHTML = '<div class="row-list">' + rows.map(function (mem, i) {
          return '<div class="panel list-row" style="margin-bottom:6px"><div class="rank-badge">' + (i === 0 ? '👑' : '⚔️') + '</div>' +
            '<div style="flex:1"><div style="font-weight:700;color:var(--gold)">' + esc(mem.displayName || mem.name || 'Member') + '</div>' +
            '<div class="muted" style="font-size:12px">' + Fmt.title(mem.role || 'MEMBER') + '</div></div>' +
            '<div style="color:var(--gold);font-weight:700">⚡' + Fmt.num(mem.power || 0) + '</div></div>';
        }).join('') + '</div>';
      }
      function territory_tab() {
        document.getElementById('clan-tab').innerHTML =
          '<div class="empty"><div class="big">🗺️</div>Your clan holds no territory yet. Win alliance wars to claim regions on the World map.</div>';
      }
      members_tab();
      var tabs = body.querySelectorAll('[data-t]');
      Array.prototype.forEach.call(tabs, function (tb) {
        tb.onclick = function () {
          Array.prototype.forEach.call(tabs, function (x) { x.classList.remove('active'); });
          tb.classList.add('active');
          tb.getAttribute('data-t') === 'territory' ? territory_tab() : members_tab();
        };
      });
      body.querySelector('#c-leave').onclick = function () {
        localStorage.removeItem('shogun_clanId'); UI.ok('You have left the clan.'); Router.go('clan');
      };
    }).catch(function (e) {
      // Clan no longer exists — reset local membership.
      localStorage.removeItem('shogun_clanId'); self._lobby(root);
    });
  }
};
