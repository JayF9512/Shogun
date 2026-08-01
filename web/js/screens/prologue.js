/* prologue.js — "Ashes Beneath the Blossom", 5 tap-to-advance panels. */
(function () {
  'use strict';

  var PANELS = [
    { head: 'Ashes Beneath the Blossom',
      body: 'For a hundred springs the cherry trees bloomed over a land at peace, held together by the will of a single shogun.' },
    { head: 'The Eclipse',
      body: 'Then came the Crimson Eclipse. The old shogun fell in the night, and with him fell order. Warlords rose like smoke from a hundred fires.' },
    { head: 'A Realm in Ruins',
      body: 'Villages burned. Clans turned upon clans. The Yokai crept from the shadows to feed on the fear of the living.' },
    { head: 'The Shrine Remembers',
      body: 'Yet in a forgotten shrine, a maiden named Akari kept one ember alight \u2014 waiting for a lord worthy of the ashes.' },
    { head: 'Your Awakening',
      body: 'That lord is you. Rise from the ruins, rebuild your domain, and carve your name into the age to come.' }
  ];

  Screens.prologue = {
    render: function (el) {
      el.id = 'prologue';
      var i = 0;
      var dots = PANELS.map(function (_, idx) { return '<div class="p-dot' + (idx === 0 ? ' on' : '') + '"></div>'; }).join('');
      el.innerHTML =
        '<div class="p-bg" id="p-bg" style="background-image:url(assets/images/prologue-scene.webp)"></div>' +
        '<div class="p-scrim bg-scrim"></div>' +
        '<div class="p-progress" id="p-progress">' + dots + '</div>' +
        '<div class="p-portrait"><img src="assets/images/guest-welcome.webp" alt="Akari" style="width:100%;height:100%;object-fit:cover"/></div>' +
        '<div class="p-text" id="p-text"></div>' +
        '<div class="p-tap">tap to continue \u203A</div>';

      var textEl = el.querySelector('#p-text');
      var bg = el.querySelector('#p-bg');

      function paint() {
        var p = PANELS[i];
        textEl.innerHTML = '<div class="p-head">' + esc(p.head) + '</div><div class="p-body">' + esc(p.body) + '</div>';
        textEl.style.animation = 'none'; void textEl.offsetWidth; textEl.style.animation = 'fadeIn 0.6s ease';
        bg.style.transform = 'scale(' + (1.05 + i * 0.02) + ')';
        bg.style.filter = 'brightness(' + (0.6 + i * 0.08) + ')';
        var ds = el.querySelectorAll('.p-dot');
        Array.prototype.forEach.call(ds, function (d, idx) { d.classList.toggle('on', idx <= i); });
      }
      paint();

      function advance() {
        i++;
        if (i >= PANELS.length) { Router.reset('settlement'); return; }
        paint();
      }
      el.addEventListener('click', advance);
    }
  };
})();
