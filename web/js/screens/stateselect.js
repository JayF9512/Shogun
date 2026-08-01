/* stateselect.js — choose your State (server). Only State 1 is open. */
(function () {
  'use strict';

  function orb(s) {
    var cap = s.playerCap || 2000;
    var count = s.playerCount || 0;
    var ratio = count / cap;
    var badge = s.isFull ? 'full' : (ratio > 0.8 ? 'busy' : 'open');
    var badgeTxt = s.isFull ? 'FULL' : (ratio > 0.8 ? 'FILLING FAST' : 'OPEN');
    var recommended = s.number === 1;
    return '<div class="state-orb" data-id="' + esc(s.id) + '" data-name="' + esc(s.name) + '">' +
      (recommended ? '<div class="recommend">RECOMMENDED</div>' : '') +
      '<div class="subtitle">' + TERMS.state + '</div>' +
      '<div class="num">' + (s.name || ('State ' + s.number)) + (recommended ? ' \u2605' : '') + '</div>' +
      '<div class="badge-open ' + badge + '">' + badgeTxt + '</div>' +
      '<div class="muted" style="font-size:12px;margin-top:10px">' + Fmt.int(count) + ' / ' + Fmt.int(cap) + ' warlords</div>' +
      '<div class="bar" style="margin-top:8px"><i style="width:' + Math.min(100, ratio * 100) + '%"></i></div>' +
      '</div>';
  }

  Screens.stateselect = {
    render: function (el) {
      el.innerHTML =
        '<div class="bg-cover" style="background-image:url(assets/images/state-select.webp)"></div>' +
        '<div class="bg-scrim"></div>' +
        '<div style="position:relative;z-index:2;padding:60px 20px 30px;min-height:100%;display:flex;flex-direction:column">' +
          '<div class="center" style="margin-bottom:20px">' +
            '<div class="title-lg">Choose Your State</div>' +
            '<div class="subtitle" style="margin-top:8px">Where your legend begins</div>' +
          '</div>' +
          '<div id="state-list" class="stack" style="flex:1"></div>' +
          '<button class="btn" id="ss-confirm" disabled style="margin-top:18px">Select a State to continue</button>' +
        '</div>';

      var list = el.querySelector('#state-list');
      var confirm = el.querySelector('#ss-confirm');
      var selected = null;

      UI.loading(true);
      api.getStates().then(function (states) {
        UI.loading(false);
        if (!states || !states.length) { states = [{ id: 'seed', name: 'State 1', number: 1, playerCap: 2000, playerCount: 18, isOpen: true }]; }
        list.innerHTML = states.map(orb).join('');
        Array.prototype.forEach.call(list.querySelectorAll('.state-orb'), function (o) {
          o.onclick = function () {
            Array.prototype.forEach.call(list.querySelectorAll('.state-orb'), function (x) { x.style.outline = 'none'; });
            o.style.outline = '2px solid var(--gold)';
            o.style.outlineOffset = '2px';
            selected = { id: o.getAttribute('data-id'), name: o.getAttribute('data-name') };
            confirm.disabled = false;
            confirm.textContent = 'Enter ' + selected.name;
          };
        });
        // auto-select the recommended state
        var first = list.querySelector('.state-orb');
        if (first) first.click();
      }).catch(function (e) {
        UI.loading(false);
        list.innerHTML = '<div class="empty">' + icon('map') + '<div>Could not load states. ' + esc(api.friendly(e)) + '</div></div>';
      });

      confirm.onclick = function () {
        if (!selected) return;
        localStorage.setItem('shogun_stateName', selected.name || 'State 1');
        if (selected.id && selected.id !== 'seed') localStorage.setItem('shogun_pendingStateId', selected.id);
        Router.go('welcome');
      };
    }
  };
})();
