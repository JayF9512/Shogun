/* HEROES — collection grid + hero detail modal. */
window.Screens.heroes = {
  hasNav: true,
  PORTRAITS: ['assets/images/hero-samurai.webp', 'assets/images/hero-ninja.webp', 'assets/images/hero-strategist.webp'],
  CLASS_IC: { SAMURAI: '🗡️', ARCHER: '🏹', NINJA: '🥷', STRATEGIST: '📜', CAVALRY: '🐎', DUELIST: '⚔️' },

  render: function (root) {
    var self = this;
    root.innerHTML =
      '<div class="screen-inner" style="padding-top:0">' +
        '<img src="assets/images/hero-cards.webp" alt="Heroes" style="width:100%;border-radius:0 0 16px 16px;border-bottom:1px solid var(--gold-line)" />' +
        '<div class="tabs" style="margin-top:14px">' +
          '<div class="tab active" data-t="heroes">HEROES</div>' +
          '<div class="tab" data-t="pets">PETS</div>' +
        '</div>' +
        '<div id="hero-body"></div>' +
      '</div>';

    var tabs = root.querySelectorAll('[data-t]');
    Array.prototype.forEach.call(tabs, function (t) {
      t.onclick = function () {
        Array.prototype.forEach.call(tabs, function (x) { x.classList.remove('active'); });
        t.classList.add('active');
        t.getAttribute('data-t') === 'pets' ? self._pets(root) : self._heroes(root);
      };
    });
    this._heroes(root);
  },

  _heroes: function (root) {
    var self = this;
    var body = root.querySelector('#hero-body');
    var heroes = Game.content.heroes || [];
    if (!heroes.length) { body.innerHTML = '<div class="empty">No heroes available.</div>'; return; }
    body.innerHTML = '<div class="grid-2">' + heroes.map(function (h, i) {
      var portrait = self.PORTRAITS[i]
        ? '<img class="hero-portrait" src="' + self.PORTRAITS[i] + '" alt="' + esc(h.name) + '" />'
        : '<div class="hero-portrait ph">' + (self.CLASS_IC[h.heroClass] || '⚔️') + '</div>';
      var power = (h.baseAttack || 0) + (h.baseDefense || 0);
      var stars = self._stars(h.rarity);
      return '<div class="card hero-card" data-i="' + i + '">' + portrait +
          '<div class="hero-meta">' +
            '<div class="hero-name">' + esc(h.name) + '</div>' +
            '<div class="stars">' + stars + '</div>' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:4px">' +
              '<span class="rar-pill rar-' + h.rarity + '">' + h.rarity + '</span>' +
              '<span class="pow">⚡' + Fmt.num(power) + '</span>' +
            '</div>' +
          '</div>' +
        '</div>';
    }).join('') + '</div>';

    Array.prototype.forEach.call(body.querySelectorAll('[data-i]'), function (c) {
      c.onclick = function () { self._detail(heroes[+c.getAttribute('data-i')], +c.getAttribute('data-i')); };
    });
  },

  _pets: function (root) {
    var body = root.querySelector('#hero-body');
    var pets = Game.content.pets || [];
    if (!pets.length) { body.innerHTML = '<div class="empty">No companions yet.</div>'; return; }
    body.innerHTML = '<div class="grid-2">' + pets.map(function (p, i) {
      var img = i === 0 ? '<img class="hero-portrait" src="assets/images/pet-shiro.webp" alt="' + esc(p.name) + '" />' : '<div class="hero-portrait ph">🐾</div>';
      return '<div class="card hero-card">' + img +
          '<div class="hero-meta">' +
            '<div class="hero-name">' + esc(p.name) + '</div>' +
            '<div class="muted" style="font-size:11px">' + esc(p.species) + '</div>' +
            '<div style="margin-top:4px"><span class="rar-pill rar-' + p.rarity + '">' + p.rarity + '</span></div>' +
            '<div class="muted" style="font-size:11px;margin-top:6px">+' + Math.round((p.passiveBonusValue || 0) * 100) + '% ' + Fmt.title(p.passiveBonusType) + '</div>' +
          '</div>' +
        '</div>';
    }).join('') + '</div>';
  },

  _stars: function (rarity) {
    var n = { COMMON: 2, RARE: 3, EPIC: 4, LEGENDARY: 5 }[rarity] || 3;
    return '★★★★★'.slice(0, n) + '☆☆☆☆☆'.slice(0, 5 - n);
  },

  _detail: function (h, i) {
    var self = this;
    var portrait = this.PORTRAITS[i] ? '<img src="' + this.PORTRAITS[i] + '" style="width:100%;border-radius:12px;margin-bottom:10px" />' : '';
    var skills = (h.skills || []).map(function (s) {
      return '<div class="panel" style="padding:10px;margin-bottom:8px">' +
        '<div style="font-weight:700;color:var(--gold);font-size:13px">' + esc(s.name) + ' <span class="pill-count">' + s.kind + '</span></div>' +
        '<div class="muted" style="font-size:12px;margin-top:3px">' + esc(s.description) + '</div></div>';
    }).join('');
    var ult = h.ultimate ? '<div class="panel" style="padding:10px;margin-bottom:8px;border-color:var(--gold-strong)"><div style="font-weight:700;color:var(--orange-a);font-size:13px">💥 ' + esc(h.ultimate.name) + ' (Ultimate)</div><div class="muted" style="font-size:12px;margin-top:3px">' + esc(h.ultimate.description) + '</div></div>' : '';
    var army = h.armySkill ? '<div class="muted" style="font-size:12px;margin:8px 0"><b style="color:var(--gold)">Army Bonus:</b> ' + esc(h.armySkill.name) + ' — ' + esc(h.armySkill.description) + '</div>' : '';

    Modal({
      title: h.name,
      html: portrait +
        '<div class="center" style="margin-bottom:6px"><span class="rar-pill rar-' + h.rarity + '">' + h.rarity + '</span> <span class="pill-count">' + self.CLASS_IC[h.heroClass] + ' ' + Fmt.title(h.heroClass) + '</span></div>' +
        '<p class="muted center" style="font-style:italic;font-size:13px">"' + esc(h.title || '') + '"</p>' +
        '<div class="stat-grid" style="margin:12px 0">' +
          '<div class="stat"><div class="n">' + Fmt.num(h.baseAttack) + '</div><div class="l">Attack</div></div>' +
          '<div class="stat"><div class="n">' + Fmt.num(h.baseDefense) + '</div><div class="l">Defense</div></div>' +
        '</div>' + army +
        '<div class="section-title" style="font-size:14px">Skills</div>' + ult + skills +
        '<button class="btn btn-primary" id="h-cmd" style="margin-top:6px">🎖️ SET AS COMMANDER</button>',
      onMount: function (m) {
        m.querySelector('#h-cmd').onclick = function () {
          localStorage.setItem('shogun_commander', h.key);
          closeModal();
          UI.ok(h.name + ' is now your battle commander!');
        };
      }
    });
  }
};
