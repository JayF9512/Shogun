/* heroes.js — roster of legendary commanders. */
(function () {
  'use strict';

  var PORTRAITS = ['hero-samurai.webp', 'hero-ninja.webp', 'hero-strategist.webp'];
  function portrait(h, i) {
    var cls = (h.heroClass || '').toUpperCase();
    if (cls.indexOf('ARCH') >= 0 || cls.indexOf('NINJA') >= 0 || cls.indexOf('SCOUT') >= 0) return PORTRAITS[1];
    if (cls.indexOf('STRAT') >= 0 || cls.indexOf('MAGE') >= 0 || cls.indexOf('SUPPORT') >= 0) return PORTRAITS[2];
    return PORTRAITS[i % PORTRAITS.length];
  }
  function stars(rarity) {
    var n = { COMMON: 2, RARE: 3, EPIC: 4, LEGENDARY: 5 }[rarity] || 1;
    var s = '';
    for (var i = 0; i < n; i++) s += icon('star', 'sm');
    return s;
  }

  Screens.heroes = {
    topbar: true, navbar: true, navKey: 'heroes',

    render: function (el) {
      el.innerHTML =
        '<div class="screen-head"><h2>Heroes</h2><div class="spacer"></div>' +
          '<span class="muted" style="font-size:12px" id="h-count"></span></div>' +
        '<div class="pad">' +
          '<div class="tabs"><div class="tab active" data-t="roster">Recruited</div>' +
            '<div class="tab" data-t="all">Codex</div></div>' +
          '<div id="h-body"></div>' +
        '</div>';

      var self = this;
      var render = function (tab) {
        var body = el.querySelector('#h-body');
        var heroes = Game.content.heroes || [];
        // "Recruited": show the starter set (first 3) as owned; codex shows all.
        var owned = heroes.slice(0, 3);
        var list = tab === 'all' ? heroes : owned;
        el.querySelector('#h-count').textContent = (tab === 'all' ? heroes.length + ' in codex' : owned.length + ' recruited');
        if (!list.length) { body.innerHTML = '<div class="empty">' + icon('hero') + '<div>No heroes yet.</div></div>'; return; }
        body.innerHTML = '<div class="grid-2">' + list.map(function (h, i) {
          var owned = tab !== 'all' || i < 3;
          return '<div class="hero-card hc-' + (h.rarity || 'COMMON') + '" data-k="' + esc(h.key) + '">' +
            '<div class="portrait" style="background-image:url(assets/images/' + portrait(h, i) + ')"></div>' +
            '<div class="veil"></div>' +
            '<div class="rar rar-' + (h.rarity || 'COMMON') + '">' + esc(h.rarity || '') + '</div>' +
            (owned ? '' : '<div style="position:absolute;top:6px;right:6px">' + icon('lock', 'sm') + '</div>') +
            '<div class="info"><div class="hname">' + esc(h.name) + '</div>' +
              '<div class="htitle">' + esc(h.title || Fmt.title(h.heroClass || '')) + '</div>' +
              '<div class="stars">' + stars(h.rarity) + '</div></div>' +
          '</div>';
        }).join('') + '</div>';

        Array.prototype.forEach.call(body.querySelectorAll('.hero-card'), function (c) {
          c.onclick = function () { self._detail(c.getAttribute('data-k')); };
        });
      };

      var loadThen = Game.content.heroes ? Promise.resolve() : Game.ensureContent();
      UI.loading(true);
      loadThen.then(function () { UI.loading(false); render('roster'); }).catch(function (e) { UI.loading(false); UI.err(e); });

      Array.prototype.forEach.call(el.querySelectorAll('.tab'), function (t) {
        t.onclick = function () {
          Array.prototype.forEach.call(el.querySelectorAll('.tab'), function (x) { x.classList.remove('active'); });
          t.classList.add('active'); render(t.getAttribute('data-t'));
        };
      });
    },

    _detail: function (key) {
      var h = (Game.content.heroes || []).filter(function (x) { return x.key === key; })[0];
      if (!h) return;
      var skills = (h.skills || []).map(function (s) {
        return '<div class="panel" style="padding:10px;margin-bottom:8px">' +
          '<div class="row between"><b style="color:var(--gold)">' + esc(s.name) + '</b>' +
          '<span class="lvl-badge">' + esc(Fmt.title(s.kind || '')) + '</span></div>' +
          '<p class="muted" style="font-size:12px;margin-top:4px">' + esc(s.description || '') + '</p></div>';
      }).join('') || '<p class="muted" style="font-size:13px">No recorded skills.</p>';

      Modal(
        '<div class="row" style="margin-bottom:12px"><div class="thumb" style="width:70px;height:70px">' +
          '<img src="assets/images/' + portrait(h, 0) + '" style="width:100%;height:100%;object-fit:cover;border-radius:12px"/></div>' +
          '<div><h3 class="title-md" style="font-size:19px">' + esc(h.name) + '</h3>' +
          '<div class="rar-' + (h.rarity || 'COMMON') + '" style="font-size:12px;font-weight:700">' + esc(h.rarity || '') + ' \u2022 ' + esc(Fmt.title(h.heroClass || '')) + '</div></div></div>' +
        '<div class="stat-grid" style="margin-bottom:12px">' +
          '<div class="stat"><div class="k">Attack</div><div class="val">' + Fmt.int(h.baseAttack) + '</div></div>' +
          '<div class="stat"><div class="k">Defense</div><div class="val">' + Fmt.int(h.baseDefense) + '</div></div>' +
          '<div class="stat"><div class="k">March Bonus</div><div class="val">+' + (h.marchSkillBonus || 0) + '%</div></div>' +
          '<div class="stat"><div class="k">Affinity</div><div class="val" style="font-size:13px">' + esc(Fmt.title(h.troopAffinity || '\u2014')) + '</div></div>' +
        '</div>' +
        '<h4 class="sec-title">Skills</h4>' + skills +
        '<button class="btn" id="hd-close" style="margin-top:6px">Close</button>');
      document.getElementById('hd-close').onclick = closeModal;
    }
  };
})();
