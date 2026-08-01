/* ============================================================
   tutorial.js — Story-driven onboarding over the 13 real backend
   steps. Akari the shrine maiden guides the new lord. Each step
   layers narrative flavour on a genuine /tutorial/complete-step call.
   ============================================================ */
(function () {
  'use strict';

  var AKARI = 'assets/images/guest-welcome.webp';

  // Story for each of the 13 backend steps (0..12). Each entry:
  //  title  - short banner
  //  text   - Akari's dialogue
  //  cta    - action button label (performs the real step)
  //  target - optional CSS selector to place a beacon/arrow over
  //  nav    - optional screen to open after completing the step
  var STORY = [
    { title: 'A New Dawn', target: '#set-rail',
      text: 'My lord\u2026 you live. I am Akari, keeper of this shrine. These ashes were once a proud domain. Drag to look upon what remains \u2014 and let us rebuild.',
      cta: 'Survey the ruins' },
    { title: 'Raise the Tenshu', target: '[data-rail="build"]',
      text: 'A domain without its keep is a body without a heart. Command the Tenshu to rise from the ash, and the people will rally to your banner.',
      cta: 'Raise the Tenshu' },
    { title: 'Feed the People', target: '[data-rail="build"]',
      text: 'Steel cannot be forged on empty stomachs. Lay the rice paddies and timber camps \u2014 let rice and wood flow into your stores.',
      cta: 'Gather resources' },
    { title: 'First Blades', target: '[data-rail="troops"]', navKey: 'troops',
      text: 'Farmers alone cannot hold a border. Train your first Samurai Guard \u2014 they will stand where others flee.',
      cta: 'Train troops', nav: 'troops' },
    { title: 'The Barracks', target: '[data-rail="build"]',
      text: 'A true army needs a home. Construct a barracks so warriors may be forged in number, not in ones and twos.',
      cta: 'Build the barracks' },
    { title: 'Eyes on the Realm', target: '.nav-item[data-t="world"]', navKey: 'world',
      text: 'Beyond these walls lies a realm of rivals and riches. Scout the map \u2014 knowledge is the first weapon of any shogun.',
      cta: 'Scout the map', nav: 'world' },
    { title: 'Blood and Fear', target: '.nav-item[data-t="world"]', navKey: 'world',
      text: 'The Yokai roam the wilds, spreading dread. Slay one, and fear itself will bend to your name.',
      cta: 'Attack a monster', nav: 'battle' },
    { title: 'Claim the Veins', target: '.nav-item[data-t="world"]', navKey: 'world',
      text: 'Iron and stone sleep in the mountain mines. Occupy one, and its bounty is yours to command.',
      cta: 'Occupy a mine', nav: 'world' },
    { title: 'A Hero Answers', target: '.nav-item[data-t="heroes"]', navKey: 'heroes',
      text: 'Legends walk among us, waiting for a cause. Recruit a hero to lead your marches \u2014 their skill turns tides.',
      cta: 'Recruit a hero', nav: 'heroes' },
    { title: 'Bonds of War', target: '.nav-item[data-t="clan"]', navKey: 'clan',
      text: 'No shogun rises alone. Join a clan, and a hundred banners will answer when the war drums sound.',
      cta: 'Join a clan', nav: 'clan' },
    { title: 'The Keep Ascends', target: '[data-rail="build"]',
      text: 'Your Tenshu has served \u2014 now let it tower. Upgrade the keep to unlock greater strength and higher ambition.',
      cta: 'Upgrade the Tenshu' },
    { title: 'The Merchant\u2019s Road', target: '.nav-item[data-t="store"]', navKey: 'store',
      text: 'Merchants travel even in wartime. Visit the store to see what fortune may hasten your rise.',
      cta: 'Open the store', nav: 'store' },
    { title: 'Rise, Shogun', target: null,
      text: 'The ashes are ashes no longer. Your domain breathes because of you, my lord. The realm awaits its new shogun \u2014 go, and let none forget your name.',
      cta: 'Begin your reign' }
  ];

  var TutorialUI = {
    active: false,
    _busy: false,

    // Called by the settlement screen after render.
    start: function () {
      var self = this;
      if (!api.isLoggedIn) return;
      var prog = Game.tutorial;
      var p = prog ? Promise.resolve(prog) : Game.refreshTutorial();
      p.then(function (t) {
        Game.tutorial = t;
        self.showCurrent();
      }).catch(function () { self.hide(); });
    },

    isComplete: function () {
      var t = Game.tutorial;
      return t && t.currentStep >= (t.totalSteps || 13);
    },

    showCurrent: function () {
      var t = Game.tutorial;
      if (!t) { this.hide(); return; }
      var step = t.currentStep;
      if (step >= (t.totalSteps || 13)) { this.hide(); return; }
      var story = STORY[step] || STORY[STORY.length - 1];
      this.render(step, story);
    },

    render: function (step, story) {
      this.active = true;
      var layer = document.getElementById('tutorial-layer');
      layer.classList.remove('hidden');

      var total = (Game.tutorial && Game.tutorial.totalSteps) || 13;
      var beacon = '';
      if (story.target) {
        beacon = '<div class="tut-beacon" id="tut-beacon"></div>';
      }

      layer.innerHTML =
        '<div class="tut-step-badge">Step ' + (step + 1) + ' / ' + total + '</div>' +
        beacon +
        '<div class="tut-dialogue">' +
          '<div class="tut-portrait"><img src="' + AKARI + '" alt="Akari" style="width:100%;height:100%;object-fit:cover" /></div>' +
          '<div class="tut-body">' +
            '<div class="tut-speaker">Akari &middot; ' + esc(story.title) + '</div>' +
            '<div class="tut-text">' + esc(story.text) + '</div>' +
            '<button class="btn sm" id="tut-cta" style="width:100%">' + esc(story.cta) + '</button>' +
          '</div>' +
        '</div>';

      var self = this;
      document.getElementById('tut-cta').onclick = function () { self.doStep(step, story); };
      // Position beacon over the target element once layout settles.
      if (story.target) setTimeout(function () { self._placeBeacon(story.target); }, 60);
    },

    _placeBeacon: function (sel) {
      var b = document.getElementById('tut-beacon');
      var el = document.querySelector(sel);
      if (!b || !el) { if (b) b.style.display = 'none'; return; }
      var r = el.getBoundingClientRect();
      var host = document.getElementById('device').getBoundingClientRect();
      b.style.left = (r.left - host.left + r.width / 2) + 'px';
      b.style.top = (r.top - host.top + r.height / 2) + 'px';
    },

    doStep: function (step, story) {
      var self = this;
      if (this._busy) return;
      this._busy = true;
      UI.loading(true);
      api.completeStep(step, {}).then(function (res) {
        var awarded = (res && res.awarded) || {};
        Game.tutorial = Game.tutorial || {};
        if (res && res.progress) {
          Game.tutorial.currentStep = res.progress.currentStep;
          Game.tutorial.completedSteps = res.progress.completedSteps;
          Game.tutorial.unlockedFeatures = res.progress.unlockedFeatures;
        } else {
          Game.tutorial.currentStep = step + 1;
        }
        return Game.refreshResources().catch(function () {}).then(function () {
          var rewardStr = Fmt.rewards(awarded);
          if (Object.keys(awarded).length) {
            UI.ok('Step complete \u2014 rewards claimed');
          }
          if (window.TopBar) TopBar.render();
          // Refresh the settlement scene so newly unlocked buildings light up.
          if (window.Settlement3D && window.Settlement3D.instance) {
            try { window.Settlement3D.instance.setUnlockedByStep(Game.tutorial.currentStep); } catch (e) {}
          }
        });
      }).then(function () {
        UI.loading(false);
        self._busy = false;
        if (story.nav) {
          self.hide();
          Router.go(story.nav);
        } else if (self.isComplete()) {
          self.finale();
        } else {
          self.showCurrent();
        }
      }).catch(function (e) {
        UI.loading(false);
        self._busy = false;
        UI.err(e);
      });
    },

    finale: function () {
      this.hide();
      var html =
        '<div class="panel gold center stack">' +
          '<div class="ic lg" style="margin:0 auto">' + icon('crown') + '</div>' +
          '<h2 class="title-md">Your Reign Begins</h2>' +
          '<p class="muted" style="font-size:14px;line-height:1.6">The tutorial is complete, my lord. Your domain stands, your armies muster, and the realm trembles at a name not yet spoken. Lead on.</p>' +
          '<button class="btn" id="fin-ok">Rule the realm</button>' +
        '</div>';
      Modal(html, { center: true });
      document.getElementById('fin-ok').onclick = closeModal;
    },

    hide: function () {
      this.active = false;
      var layer = document.getElementById('tutorial-layer');
      if (layer) { layer.classList.add('hidden'); layer.innerHTML = ''; }
    }
  };

  window.TutorialUI = TutorialUI;
})();
