/* settlement.js — the home city. Orchestrates the 3D scene, HUD,
   quick-action rail, building interactions, and the tutorial. */
(function () {
  'use strict';

  var BUILDING_INFO = {
    tenshu: { desc: 'The heart of your domain. Upgrade it to raise your power ceiling and unlock new structures.', act: 'Upgrade' },
    farm: { desc: 'Rice paddies feed your armies. Higher levels raise rice production.', act: 'Upgrade' },
    lumberyard: { desc: 'Timber camps supply the wood for every construction.', act: 'Upgrade' },
    quarry: { desc: 'Stone hewn from the mountains fortifies your walls.', act: 'Upgrade' },
    barracks: { desc: 'Train Samurai Guard and other infantry here.', act: 'Train' },
    blacksmith: { desc: 'Forge weapons and armour to strengthen your troops.', act: 'Upgrade' },
    stable: { desc: 'Raise Komainu Riders \u2014 your fast cavalry.', act: 'Train' },
    shrine: { desc: 'Honour the kami for blessings upon your marches.', act: 'Pray' },
    market: { desc: 'Trade resources with travelling merchants.', act: 'Trade' }
  };

  Screens.settlement = {
    topbar: true,
    navbar: true,
    tutorial: true,
    navKey: 'settlement',

    render: function (el) {
      el.innerHTML =
        '<div id="settlement-3d-container"></div>' +
        '<div class="set-rail" id="set-rail">' +
          '<button class="rail-btn" data-rail="build">' + icon('castle') + '<span>Build</span></button>' +
          '<button class="rail-btn" data-rail="troops">' + icon('sword') + '<span>Troops</span></button>' +
          '<button class="rail-btn" data-rail="quests">' + icon('scroll') + '<span>Quests</span></button>' +
          '<button class="rail-btn" data-rail="events">' + icon('calendar') + '<span>Events</span></button>' +
        '</div>' +
        '<div class="set-hint">Drag to look around \u2022 pinch to zoom \u2022 tap a building</div>';

      // Build the 3D scene (falls back to a static image if WebGL is unavailable).
      var container = el.querySelector('#settlement-3d-container');
      try { Settlement3D.create(container); } catch (e) { console.error(e); }

      // Building click handler
      this._onBuilding = function (ev) {
        var d = ev.detail;
        Screens.settlement._openBuilding(d);
      };
      window.addEventListener('buildingClicked', this._onBuilding);

      // Quick-action rail
      Array.prototype.forEach.call(el.querySelectorAll('.rail-btn'), function (b) {
        b.onclick = function () {
          var r = b.getAttribute('data-rail');
          if (r === 'build') Screens.settlement._buildMenu();
          else if (r === 'troops') Router.go('troops');
          else if (r === 'quests') Screens.settlement._quests();
          else if (r === 'events') Router.go('events');
        };
      });

      // Refresh HUD data then start the tutorial guide.
      Promise.all([
        Game.refreshResources().catch(function () {}),
        Game.refreshProfile().then(function (p) { Game.saveSession(p); }).catch(function () {}),
        Game.tutorial ? Promise.resolve() : Game.refreshTutorial().catch(function () {})
      ]).then(function () {
        TopBar.render();
        // count unread mail for the HUD badge
        api.getMail().then(function (m) {
          var unread = (m || []).filter(function (x) { return !x.readAt && !x.read; }).length;
          TopBar.setMailUnread(unread);
        }).catch(function () {});
        TutorialUI.start();
      });
    },

    _openBuilding: function (d) {
      var info = BUILDING_INFO[d.key] || { desc: 'A structure of your domain.', act: 'Manage' };
      if (!d.unlocked) {
        var html =
          '<div class="panel stack">' +
            '<div class="row"><div class="ic lg">' + icon('lock') + '</div>' +
              '<div><h3 class="title-md" style="font-size:18px">' + esc(d.name) + '</h3>' +
              '<div class="muted" style="font-size:12px">Locked \u2014 in ruins</div></div></div>' +
            '<p style="font-size:14px;line-height:1.5">' + esc(info.desc) + '</p>' +
            '<p class="muted" style="font-size:12px">Progress through the tutorial to rebuild this structure.</p>' +
            '<button class="btn secondary" id="b-ok">Close</button>' +
          '</div>';
        Modal(html);
        document.getElementById('b-ok').onclick = closeModal;
        return;
      }
      var html2 =
        '<div class="panel gold stack">' +
          '<div class="row"><div class="thumb">' + icon('castle') + '</div>' +
            '<div><h3 class="title-md" style="font-size:18px">' + esc(d.name) + '</h3>' +
            '<span class="lvl-badge">Level 1</span></div></div>' +
          '<p style="font-size:14px;line-height:1.5">' + esc(info.desc) + '</p>' +
          '<div class="grid-2">' +
            '<button class="btn" id="b-act">' + esc(info.act) + '</button>' +
            '<button class="btn secondary" id="b-close">Close</button>' +
          '</div>' +
        '</div>';
      Modal(html2);
      document.getElementById('b-close').onclick = closeModal;
      document.getElementById('b-act').onclick = function () {
        closeModal();
        if (d.key === 'barracks' || d.key === 'stable') Router.go('troops');
        else if (d.key === 'market') Router.go('store');
        else { UI.ok(info.act + ' underway \u2014 ' + d.name); }
      };
    },

    _buildMenu: function () {
      var layout = Settlement3D.LAYOUT;
      var step = (Game.tutorial && Game.tutorial.currentStep) || 0;
      var rows = layout.map(function (b) {
        var unlocked = step >= b.unlockStep;
        return '<div class="list-card card" style="margin-bottom:8px">' +
          '<div class="thumb">' + icon(unlocked ? 'castle' : 'lock') + '</div>' +
          '<div style="flex:1"><b>' + esc(b.name) + '</b><div class="muted" style="font-size:11px">' +
            (unlocked ? 'Built \u2022 Level 1' : 'Unlocks at tutorial step ' + (b.unlockStep + 1)) + '</div></div>' +
          (unlocked ? '<span class="lvl-badge">Lv 1</span>' : icon('lock')) +
          '</div>';
      }).join('');
      Modal('<h3 class="sec-title">Structures</h3>' + rows +
        '<button class="btn secondary" id="bm-close" style="margin-top:6px">Close</button>');
      document.getElementById('bm-close').onclick = closeModal;
    },

    _quests: function () {
      var t = Game.tutorial || { currentStep: 0, totalSteps: 13 };
      var done = t.currentStep;
      var total = t.totalSteps || 13;
      var pct = Math.round((done / total) * 100);
      Modal(
        '<h3 class="sec-title">Campaign Quests</h3>' +
        '<div class="panel stack">' +
          '<div class="row between"><b>Path of the Shogun</b><span class="lvl-badge">' + done + '/' + total + '</span></div>' +
          '<div class="bar"><i style="width:' + pct + '%"></i></div>' +
          '<p class="muted" style="font-size:13px">' + (done >= total ? 'All campaign quests complete. The realm is yours to expand.' : 'Follow Akari\u2019s guidance to rebuild your domain and earn rewards at every step.') + '</p>' +
          (done < total ? '<button class="btn" id="q-go">Continue tutorial</button>' : '') +
        '</div>' +
        '<button class="btn secondary" id="q-close" style="margin-top:8px">Close</button>');
      var g = document.getElementById('q-go');
      if (g) g.onclick = function () { closeModal(); TutorialUI.start(); };
      document.getElementById('q-close').onclick = closeModal;
    },

    destroy: function () {
      if (this._onBuilding) window.removeEventListener('buildingClicked', this._onBuilding);
      if (Settlement3D.instance) { try { Settlement3D.instance.dispose(); Settlement3D.instance = null; } catch (e) {} }
    }
  };
})();
