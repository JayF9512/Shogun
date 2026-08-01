/* PROFILE — player identity, stats, bind/account, clan section. */
window.Screens.profile = {
  hasNav: true,
  render: function (root) {
    var self = this;
    var p = Game.profile || {};
    var counts = p.counts || {};
    var joined = p.createdAt ? new Date(p.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
    var st = localStorage.getItem('shogun_stateName') || (window.TERMS && window.TERMS.STATE_DEFAULT_NAME) || 'State 1';

    root.innerHTML =
      '<div class="screen-inner">' +
        '<div class="panel" style="text-align:center">' +
          '<img src="assets/images/pet-shiro.webp" style="width:84px;height:84px;border-radius:50%;border:3px solid var(--gold);margin:0 auto;box-shadow:0 0 18px rgba(245,179,0,.5)" alt="avatar" />' +
          '<div style="font-family:Cinzel;font-size:20px;color:var(--gold);margin-top:8px">' + esc(Game.displayName()) + '</div>' +
          '<div style="margin-top:6px"><span class="badge badge-rec">VIP ' + (p.vipLevel || 0) + '</span> <span class="pill-count">🏯 ' + esc(st) + '</span> ' +
            '<span class="pill-count">' + (api.isGuest ? '👤 Guest' : '🔐 Registered') + '</span></div>' +
          '<div class="muted" style="font-size:12px;margin-top:8px">🏯 ' + esc(api.castleName || (p.settlement && p.settlement.name) || 'Unnamed Castle') + ' · Joined ' + joined + '</div>' +
        '</div>' +
        '<div class="stat-grid" style="margin:14px 0">' +
          '<div class="stat"><div class="n">' + Fmt.num(p.power || 0) + '</div><div class="l">⚡ Power</div></div>' +
          '<div class="stat"><div class="n">Lv.' + (p.level || 1) + '</div><div class="l">🎖️ Level</div></div>' +
          '<div class="stat"><div class="n">' + Fmt.int(counts.heroes || 0) + '</div><div class="l">🦸 Heroes</div></div>' +
          '<div class="stat"><div class="n">' + Fmt.int(counts.troops || 0) + '</div><div class="l">🪖 Troops</div></div>' +
        '</div>' +
        (api.isGuest
          ? '<button class="btn btn-primary" id="p-bind">🔗 BIND ACCOUNT</button>'
          : '<button class="btn btn-secondary" id="p-settings">⚙️ ACCOUNT SETTINGS</button>') +
        '<div class="section-title" style="margin-top:22px">My Clan</div>' +
        '<div id="p-clan"><div class="panel center"><div class="muted" style="margin-bottom:10px">You have not joined a clan.</div><button class="btn btn-secondary btn-sm" id="p-findclan" style="width:auto;margin:0 auto">🔍 Find a Clan</button></div></div>' +
        '<div class="divider"></div>' +
        '<button class="btn btn-danger" id="p-logout">🚪 LOG OUT</button>' +
      '</div>';

    var bind = root.querySelector('#p-bind');
    if (bind) bind.onclick = function () { self._bindModal(); };
    var settings = root.querySelector('#p-settings');
    if (settings) settings.onclick = function () { self._settingsModal(); };
    root.querySelector('#p-findclan').onclick = function () { self._clanSearch(); };
    root.querySelector('#p-logout').onclick = function () {
      Modal({
        title: 'Log Out?', html: '<p class="muted center" style="margin:6px 0 16px">' + (api.isGuest ? 'You are playing as a guest — logging out clears this device session.' : 'You can log back in any time.') + '</p>' +
          '<button class="btn btn-danger" id="lo-yes">LOG OUT</button><div style="height:10px"></div><button class="btn btn-ghost" id="lo-no">Cancel</button>',
        onMount: function (m) {
          m.querySelector('#lo-no').onclick = closeModal;
          m.querySelector('#lo-yes').onclick = function () {
            closeModal(); UI.loading(true);
            api.logout().then(function () {
              Game.reset();
              localStorage.removeItem('shogun_castleName');
              UI.loading(false); Router.history = []; Router.go('welcome');
            });
          };
        }
      });
    };
  },

  _bindModal: function () {
    Modal({
      title: '🔗 Bind Your Account',
      html:
        '<p class="muted" style="font-size:13px;line-height:1.5;margin-bottom:14px">⚠️ Binding permanently links your current progress to this email. If you already have an account on another state, your current progress will not transfer.</p>' +
        '<div class="field"><label>Warrior Name</label><input class="input" id="b-name" value="' + esc(Game.displayName()) + '" /></div>' +
        '<div class="field"><label>Email</label><input class="input" id="b-email" type="email" placeholder="you@example.com" /></div>' +
        '<div class="field"><label>Password</label><input class="input" id="b-pass" type="password" placeholder="Min. 8 characters" /></div>' +
        '<div class="form-err" id="b-err"></div>' +
        '<button class="btn btn-primary" id="b-go">BIND MY ACCOUNT</button>',
      onMount: function (m) {
        m.querySelector('#b-go').onclick = function () {
          var name = m.querySelector('#b-name').value.trim();
          var email = m.querySelector('#b-email').value.trim();
          var pass = m.querySelector('#b-pass').value;
          var err = m.querySelector('#b-err');
          if (!email) { err.textContent = 'Enter a valid email.'; return; }
          if (pass.length < 8) { err.textContent = 'Password must be at least 8 characters.'; return; }
          err.textContent = ''; UI.loading(true);
          api.bind(email, pass, name).then(function () {
            return Game.refreshProfile().catch(function () {});
          }).then(function () {
            UI.loading(false); closeModal(); UI.ok('Account bound! Progress saved forever.'); Router.go('profile');
          }).catch(function (e) { UI.loading(false); err.textContent = e.message; });
        };
      }
    });
  },

  _settingsModal: function () {
    Modal({
      title: '⚙️ Account Settings',
      html:
        '<div class="panel" style="margin-bottom:10px"><div class="muted" style="font-size:12px">Signed in as</div><div style="font-weight:700;color:var(--gold)">' + esc(localStorage.getItem('shogun_displayName') || Game.displayName()) + '</div></div>' +
        '<div class="panel" style="margin-bottom:14px"><div class="muted" style="font-size:12px">State</div><div style="font-weight:700;color:var(--gold)">' + esc(localStorage.getItem('shogun_stateName') || (window.TERMS && window.TERMS.STATE_DEFAULT_NAME) || 'State 1') + '</div></div>' +
        '<button class="btn btn-secondary" id="s-close">CLOSE</button>',
      onMount: function (m) { m.querySelector('#s-close').onclick = closeModal; }
    });
  },

  _clanSearch: function () {
    var body = Modal({
      title: '🔍 Find a Clan',
      html:
        '<div class="field"><input class="input" id="cs-q" placeholder="Search clans by name…" /></div>' +
        '<div id="cs-list"><div class="empty"><div class="loader-ring" style="margin:0 auto"></div></div></div>'
    });
    function load(q) {
      var list = body.querySelector('#cs-list');
      list.innerHTML = '<div class="empty"><div class="loader-ring" style="margin:0 auto"></div></div>';
      api.getClans(q).then(function (clans) {
        clans = clans || [];
        if (!clans.length) { list.innerHTML = '<div class="empty">No clans found.</div>'; return; }
        list.innerHTML = clans.map(function (c) {
          return '<div class="panel list-row" style="margin-bottom:8px"><div class="rank-badge">🏯</div>' +
            '<div style="flex:1"><div style="font-weight:700;color:var(--gold)">[' + esc(c.tag) + '] ' + esc(c.name) + '</div>' +
            '<div class="muted" style="font-size:12px">' + esc(c.description || 'A proud clan.') + '</div></div>' +
            '<button class="btn btn-primary btn-sm" data-join="' + c.id + '">JOIN</button></div>';
        }).join('');
        Array.prototype.forEach.call(list.querySelectorAll('[data-join]'), function (b) {
          b.onclick = function () {
            var id = b.getAttribute('data-join');
            UI.loading(true);
            api.joinClan(id).then(function () { UI.loading(false); closeModal(); UI.ok('Join request sent! The clan leaders will review it.'); })
              .catch(function (e) { UI.loading(false); UI.err(e); });
          };
        });
      }).catch(function (e) { UI.err(e); list.innerHTML = '<div class="empty">Could not load clans.</div>'; });
    }
    var q = body.querySelector('#cs-q');
    var deb;
    q.oninput = function () { clearTimeout(deb); deb = setTimeout(function () { load(q.value.trim()); }, 300); };
    load('');
  }
};
