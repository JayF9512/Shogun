/* WORLD MAP — regions, region detail, and march formation (real POST /march). */
window.Screens.world = {
  hasNav: true,
  REGIONS: [
    { name: 'Kansai Plains', type: 'Plains', x: 12, y: 8, npc: 3, ic: '🌾' },
    { name: 'Hakone Mountains', type: 'Mountains', x: 34, y: 22, npc: 7, ic: '⛰️' },
    { name: 'Sagami Coast', type: 'Coast', x: 48, y: 40, npc: 5, ic: '🌊' },
    { name: 'Aokigahara Forest', type: 'Forest', x: 20, y: 55, npc: 9, ic: '🌲' },
    { name: 'Echigo Rice Fields', type: 'Plains', x: 60, y: 15, npc: 4, ic: '🌾' },
    { name: 'Kii Peninsula', type: 'Coast', x: 70, y: 60, npc: 8, ic: '🌊' }
  ],

  render: function (root) {
    var self = this;
    var stName = localStorage.getItem('shogun_stateName') || (window.TERMS && window.TERMS.STATE_DEFAULT_NAME) || 'State 1';
    root.innerHTML =
      '<div class="screen-inner">' +
        '<div class="section-title">World Map — ' + esc(stName) + '</div>' +
        '<div style="position:relative;border-radius:16px;overflow:hidden;border:1px solid var(--gold-line)">' +
          '<img src="assets/images/world-map.webp" style="width:100%;display:block" alt="World map" />' +
          '<div id="pins"></div>' +
        '</div>' +
        '<div class="section-title" style="margin-top:18px">Regions</div>' +
        '<div class="row-list" id="region-list"></div>' +
      '</div>';

    // Map pins positioned as % over the image.
    var pins = root.querySelector('#pins');
    pins.innerHTML = this.REGIONS.map(function (r, i) {
      var px = 8 + (i % 3) * 32 + Math.random() * 6;
      var py = 18 + Math.floor(i / 3) * 34 + Math.random() * 6;
      return '<button data-r="' + i + '" style="position:absolute;left:' + px + '%;top:' + py + '%;transform:translate(-50%,-50%);' +
        'width:44px;height:44px;border-radius:50%;background:rgba(0,0,0,.55);border:2px solid var(--gold);font-size:20px;' +
        'box-shadow:0 0 12px rgba(245,179,0,.6)">' + r.ic + '</button>';
    }).join('');

    var list = root.querySelector('#region-list');
    list.innerHTML = this.REGIONS.map(function (r, i) {
      return '<div class="panel list-row" data-r="' + i + '" style="cursor:pointer">' +
          '<div class="rank-badge">' + r.ic + '</div>' +
          '<div style="flex:1"><div style="font-weight:700;color:var(--gold)">' + esc(r.name) + '</div>' +
          '<div class="muted" style="font-size:12px">' + r.type + ' · NPC Lv.' + r.npc + ' · (' + r.x + ',' + r.y + ')</div></div>' +
          '<span class="pill-count">View</span>' +
        '</div>';
    }).join('');

    function bind(el) { el.onclick = function () { self._region(self.REGIONS[+el.getAttribute('data-r')]); }; }
    Array.prototype.forEach.call(root.querySelectorAll('[data-r]'), bind);
  },

  _region: function (r) {
    var self = this;
    Modal({
      title: r.ic + ' ' + r.name,
      html:
        '<div class="center"><span class="pill-count">' + r.type + '</span> <span class="pill-count">NPC Level ' + r.npc + '</span> <span class="pill-count">(' + r.x + ',' + r.y + ')</span></div>' +
        '<p class="muted center" style="margin:12px 0">A contested ' + r.type.toLowerCase() + ' region. Scout it to reveal its garrison, or attack to seize its riches.</p>' +
        '<button class="btn btn-primary" id="r-attack">⚔️ ATTACK</button>' +
        '<div style="height:10px"></div>' +
        '<div class="btn-row">' +
          '<button class="btn btn-secondary btn-sm" id="r-scout">🔭 SCOUT</button>' +
          '<button class="btn btn-secondary btn-sm" id="r-sim">🎯 SIMULATE</button>' +
        '</div>',
      onMount: function (m) {
        m.querySelector('#r-attack').onclick = function () { self._formation(r, 'attack'); };
        m.querySelector('#r-scout').onclick = function () { self._formation(r, 'scout'); };
        m.querySelector('#r-sim').onclick = function () { closeModal(); Router.go('battle', { region: r }); };
      }
    });
  },

  _formation: function (r, type) {
    var self = this;
    var heroes = Game.content.heroes || [];
    var cmdKey = localStorage.getItem('shogun_commander');
    var heroOpts = '<option value="">No commander</option>' + heroes.map(function (h) {
      return '<option value="' + h.key + '"' + (h.key === cmdKey ? ' selected' : '') + '>' + esc(h.name) + '</option>';
    }).join('');

    Modal({
      title: (type === 'scout' ? '🔭 Scout ' : '⚔️ March on ') + r.name,
      html:
        '<div class="field"><label>Commander</label><select class="input" id="f-hero">' + heroOpts + '</select></div>' +
        '<div class="slider-row"><div class="lab"><span>🗡️ Infantry</span><span class="count-tag" id="v-inf">200</span></div><input type="range" id="s-inf" min="0" max="2000" step="50" value="200" /></div>' +
        '<div class="slider-row"><div class="lab"><span>🐎 Cavalry</span><span class="count-tag" id="v-cav">100</span></div><input type="range" id="s-cav" min="0" max="2000" step="50" value="100" /></div>' +
        '<div class="slider-row"><div class="lab"><span>🏹 Ranged</span><span class="count-tag" id="v-rng">150</span></div><input type="range" id="s-rng" min="0" max="2000" step="50" value="150" /></div>' +
        '<div class="panel" style="padding:10px;margin-bottom:12px"><div class="muted" style="font-size:12px">Target (' + r.x + ',' + r.y + ') · March speed scales with cavalry ratio · Total: <span class="count-tag" id="v-total">450</span> troops</div></div>' +
        '<button class="btn btn-primary" id="f-send">🚩 SEND ' + (type === 'scout' ? 'SCOUT' : 'MARCH') + '</button>',
      onMount: function (m) {
        function sync() {
          var inf = +m.querySelector('#s-inf').value, cav = +m.querySelector('#s-cav').value, rng = +m.querySelector('#s-rng').value;
          m.querySelector('#v-inf').textContent = inf; m.querySelector('#v-cav').textContent = cav; m.querySelector('#v-rng').textContent = rng;
          m.querySelector('#v-total').textContent = inf + cav + rng;
        }
        ['#s-inf', '#s-cav', '#s-rng'].forEach(function (id) { m.querySelector(id).oninput = sync; });
        m.querySelector('#f-send').onclick = function () {
          var inf = +m.querySelector('#s-inf').value, cav = +m.querySelector('#s-cav').value, rng = +m.querySelector('#s-rng').value;
          if (inf + cav + rng <= 0) { UI.toast('Assign at least one troop.', 'error'); return; }
          var dto = { targetX: r.x, targetY: r.y, troops: { infantry: inf, cavalry: cav, ranged: rng }, marchType: type };
          var hero = m.querySelector('#f-hero').value; if (hero) dto.heroId = hero;
          UI.loading(true);
          api.sendMarch(dto).then(function (march) {
            UI.loading(false); closeModal();
            UI.ok('⚔️ Army dispatched to ' + r.name + '!');
            Game.marches.push(march);
            Router.go('settlement');
          }).catch(function (e) { UI.loading(false); UI.err(e); });
        };
      }
    });
  }
};
