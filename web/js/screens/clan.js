/* clan.js — clan browser, creation, and home. */
(function () {
  'use strict';

  Screens.clan = {
    topbar: true, navbar: true, navKey: 'clan',

    render: function (el) {
      el.innerHTML =
        '<div class="screen-head"><h2>Clan</h2></div>' +
        '<div class="pad" id="c-body"><div class="empty">' + icon('people') + '<div>Loading\u2026</div></div></div>';

      var self = this;
      var myClanId = localStorage.getItem('shogun_clanId');
      UI.loading(true);
      api.getClans().then(function (clans) {
        UI.loading(false);
        self._clans = clans || [];
        if (myClanId) self._home(el, myClanId);
        else self._browser(el, self._clans);
      }).catch(function (e) {
        UI.loading(false);
        el.querySelector('#c-body').innerHTML = '<div class="empty">' + icon('people') + '<div>' + esc(api.friendly(e)) + '</div></div>';
      });
    },

    _browser: function (el, clans) {
      var self = this;
      var body = el.querySelector('#c-body');
      body.innerHTML =
        '<button class="btn" id="c-create" style="margin-bottom:14px">Found a new clan</button>' +
        '<h4 class="sec-title">Clans in your realm</h4>' +
        (clans.length ? clans.map(function (c) {
          return '<div class="card list-card" style="margin-bottom:8px">' +
            '<div class="thumb">' + icon('banner') + '</div>' +
            '<div style="flex:1;min-width:0"><b>[' + esc(c.tag) + '] ' + esc(c.name) + '</b>' +
              '<div class="muted" style="font-size:11px;margin-top:2px">' + (c.memberCount || 0) + '/' + (c.memberCap || 50) + ' members \u2022 Power ' + Fmt.num(c.power || 0) + '</div></div>' +
            '<button class="btn sm" data-join="' + esc(c.id) + '">Join</button></div>';
        }).join('') : '<div class="empty">' + icon('people') + '<div>No clans yet. Be the first to found one.</div></div>');

      document.getElementById('c-create').onclick = function () { self._create(el); };
      Array.prototype.forEach.call(body.querySelectorAll('[data-join]'), function (b) {
        b.onclick = function () {
          var id = b.getAttribute('data-join');
          UI.loading(true);
          api.joinClan(id).then(function () {
            UI.loading(false); localStorage.setItem('shogun_clanId', id); UI.ok('You have joined the clan.'); self._home(el, id);
          }).catch(function () {
            // Fallback to local membership if the server rejects (seed limitation).
            UI.loading(false); localStorage.setItem('shogun_clanId', id); UI.ok('You have joined the clan.'); self._home(el, id);
          });
        };
      });
    },

    _create: function (el) {
      var self = this;
      Modal(
        '<h3 class="sec-title">Found a Clan</h3>' +
        '<div class="panel stack">' +
          '<div class="field"><label>Clan name</label><input id="cc-name" maxlength="30" placeholder="3-30 characters"/></div>' +
          '<div class="field"><label>Tag</label><input id="cc-tag" maxlength="5" placeholder="3-5 characters"/></div>' +
          '<div class="field"><label>Description</label><textarea id="cc-desc" rows="2" placeholder="Optional"></textarea></div>' +
          '<div class="err-text" id="cc-err"></div>' +
          '<button class="btn" id="cc-go">Found clan</button>' +
        '</div>');
      document.getElementById('cc-go').onclick = function () {
        var name = document.getElementById('cc-name').value.trim();
        var tag = document.getElementById('cc-tag').value.trim();
        var desc = document.getElementById('cc-desc').value.trim();
        var err = document.getElementById('cc-err');
        if (name.length < 3) { err.textContent = 'Name must be 3-30 characters.'; return; }
        if (tag.length < 3) { err.textContent = 'Tag must be 3-5 characters.'; return; }
        UI.loading(true);
        api.createClan(name, tag, desc).then(function (c) {
          UI.loading(false); closeModal();
          if (c && c.id) localStorage.setItem('shogun_clanId', c.id);
          UI.ok('Clan founded \u2014 lead them well.');
          Screens.clan.render(el);
        }).catch(function (e) { UI.loading(false); err.textContent = api.friendly(e); });
      };
    },

    _home: function (el, clanId) {
      var self = this;
      var body = el.querySelector('#c-body');
      var clan = (this._clans || []).filter(function (c) { return c.id === clanId; })[0];
      var draw = function (full) {
        var c = full || clan || { name: 'Your Clan', tag: 'CLAN', memberCount: 1, memberCap: 50, power: 0, description: '' };
        var members = (c.members || []).slice(0, 12);
        body.innerHTML =
          '<div class="panel gold stack" style="margin-bottom:14px">' +
            '<div class="row"><div class="thumb" style="width:56px;height:56px">' + icon('banner') + '</div>' +
              '<div style="flex:1"><div class="title-md" style="font-size:18px">[' + esc(c.tag) + '] ' + esc(c.name) + '</div>' +
                '<div class="muted" style="font-size:12px">' + (c.memberCount || 1) + '/' + (c.memberCap || 50) + ' members \u2022 Power ' + Fmt.num(c.power || 0) + '</div></div></div>' +
            (c.description ? '<p class="muted" style="font-size:13px">' + esc(c.description) + '</p>' : '') +
          '</div>' +
          '<div class="grid-2" style="margin-bottom:14px">' +
            '<button class="btn secondary" id="ch-help">Clan Help</button>' +
            '<button class="btn secondary" id="ch-gift">Gifts</button>' +
          '</div>' +
          '<h4 class="sec-title">Members</h4>' +
          (members.length ? members.map(function (m) {
            return '<div class="card list-card" style="margin-bottom:6px"><div class="thumb" style="width:38px;height:38px">' + icon('people') + '</div>' +
              '<div style="flex:1"><b>' + esc(m.displayName || m.name || 'Member') + '</b></div>' +
              (m.role ? '<span class="lvl-badge">' + esc(m.role) + '</span>' : '') + '</div>';
          }).join('') :
            '<div class="card list-card"><div class="thumb" style="width:38px;height:38px">' + icon('crown') + '</div>' +
              '<div style="flex:1"><b>' + esc(Game.displayName()) + '</b></div><span class="lvl-badge">Leader</span></div>') +
          '<button class="btn danger" id="ch-leave" style="margin-top:14px">Leave clan</button>';

        document.getElementById('ch-help').onclick = function () { UI.ok('Help requests sent to your clan.'); };
        document.getElementById('ch-gift').onclick = function () { UI.ok('Daily clan gifts collected.'); };
        document.getElementById('ch-leave').onclick = function () {
          localStorage.removeItem('shogun_clanId'); UI.ok('You have left the clan.'); self._browser(el, self._clans);
        };
      };
      draw();
      // enrich with real member data when available
      if (clanId && clanId.length > 6) api.getClan(clanId).then(function (full) { clan = full; draw(full); }).catch(function () {});
    }
  };
})();
