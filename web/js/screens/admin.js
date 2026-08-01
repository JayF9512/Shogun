/* admin.js — role-gated moderator panel (ADMIN / OWNER only). */
(function () {
  'use strict';

  Screens.admin = {
    topbar: true, navbar: true, navKey: 'profile',

    render: function (el) {
      var role = api.role;
      var isAdmin = role === 'ADMIN' || role === 'OWNER';
      var isOwner = role === 'OWNER';

      el.innerHTML =
        '<div class="screen-head"><button class="hud-btn" id="ad-back">' + icon('back') + '</button><h2>Admin Panel</h2></div>' +
        '<div class="pad" id="ad-body"></div>';
      el.querySelector('#ad-back').onclick = function () { Router.back('profile'); };

      var body = el.querySelector('#ad-body');
      if (!isAdmin) {
        body.innerHTML =
          '<div class="empty">' + icon('lock') +
            '<div style="font-size:16px;color:var(--text-primary);margin-bottom:6px">Access Restricted</div>' +
            '<div>Your role is <b style="color:var(--gold)">' + esc(role) + '</b>. Only ADMIN and OWNER may enter the war council chamber.</div>' +
          '</div>';
        return;
      }

      body.innerHTML =
        '<div class="panel gold stack" style="margin-bottom:14px">' +
          '<div class="row"><div class="thumb">' + icon('gear') + '</div>' +
            '<div><b>Moderator Tools</b><div class="muted" style="font-size:12px">Role: ' + esc(role) + '</div></div></div>' +
        '</div>' +
        '<h4 class="sec-title">Audit Log</h4>' +
        '<div id="ad-log"><div class="empty">' + icon('scroll') + '<div>Loading log\u2026</div></div></div>' +
        (isOwner ?
          '<h4 class="sec-title">Role Management</h4>' +
          '<div class="panel stack">' +
            '<div class="field"><label>Player email</label><input id="ad-email" type="email" placeholder="player@example.com"/></div>' +
            '<div class="grid-2"><button class="btn jade" id="ad-appoint">Appoint Admin</button>' +
              '<button class="btn danger" id="ad-demote">Demote</button></div>' +
          '</div>' : '');

      UI.loading(true);
      api.adminLog().then(function (rows) {
        UI.loading(false);
        var log = el.querySelector('#ad-log');
        rows = rows || [];
        if (!rows.length) { log.innerHTML = '<div class="empty">' + icon('scroll') + '<div>No log entries.</div></div>'; return; }
        log.innerHTML = rows.slice(0, 30).map(function (r) {
          return '<div class="card" style="padding:10px;margin-bottom:6px"><div class="row between">' +
            '<b style="font-size:13px">' + esc(r.action || r.type || 'Action') + '</b>' +
            '<span class="muted" style="font-size:11px">' + esc((r.createdAt || '').slice(0, 16).replace('T', ' ')) + '</span></div>' +
            (r.detail || r.message ? '<div class="muted" style="font-size:12px;margin-top:4px">' + esc(r.detail || r.message) + '</div>' : '') + '</div>';
        }).join('');
      }).catch(function (e) {
        UI.loading(false);
        el.querySelector('#ad-log').innerHTML = '<div class="empty">' + icon('lock') + '<div>' + esc(api.friendly(e)) + '</div></div>';
      });

      if (isOwner) {
        var doRole = function (fn, verb) {
          var email = (document.getElementById('ad-email').value || '').trim();
          if (!/.+@.+\..+/.test(email)) { UI.err('Enter a valid email.'); return; }
          UI.loading(true);
          fn(email).then(function () { UI.loading(false); UI.ok(verb + ' \u2014 ' + email); }).catch(function (e) { UI.loading(false); UI.err(e); });
        };
        document.getElementById('ad-appoint').onclick = function () { doRole(api.appointAdmin.bind(api), 'Appointed admin'); };
        document.getElementById('ad-demote').onclick = function () { doRole(api.demoteAdmin.bind(api), 'Demoted'); };
      }
    }
  };
})();
