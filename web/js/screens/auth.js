/* auth.js — login, register, and guest account binding. */
(function () {
  'use strict';

  Screens.auth = {
    render: function (el, params) {
      var mode = (params && params.mode) || (api.isGuest && api.isLoggedIn ? 'bind' : 'login');
      var isBind = api.isGuest && api.isLoggedIn;

      el.innerHTML =
        '<div class="bg-cover" style="background-image:url(assets/images/login-bg.webp)"></div>' +
        '<div class="bg-scrim"></div>' +
        '<button class="back-btn" id="a-back">' + icon('back') + '</button>' +
        '<div style="position:relative;z-index:2;padding:64px 22px 30px;min-height:100%;display:flex;flex-direction:column;justify-content:center">' +
          '<div class="center" style="margin-bottom:16px">' +
            '<div class="title-md" id="a-title">Welcome Back</div>' +
          '</div>' +
          (isBind ? '' :
            '<div class="tabs">' +
              '<div class="tab' + (mode === 'login' ? ' active' : '') + '" data-m="login">Sign In</div>' +
              '<div class="tab' + (mode === 'register' ? ' active' : '') + '" data-m="register">Register</div>' +
            '</div>') +
          '<div class="panel gold stack" id="a-form"></div>' +
        '</div>';

      el.querySelector('#a-back').onclick = function () { Router.back('welcome'); };

      var self = this;
      function form(m) {
        var f = el.querySelector('#a-form');
        var title = el.querySelector('#a-title');
        var showName = (m === 'register' || m === 'bind');
        title.textContent = m === 'register' ? 'Forge Your Legend' : (m === 'bind' ? 'Save Your Progress' : 'Welcome Back');
        f.innerHTML =
          (m === 'bind' ? '<p class="muted" style="font-size:13px">Bind an email to keep your domain forever. Your current progress is preserved.</p>' : '') +
          (showName ? '<div class="field"><label>Commander Name</label><input id="a-name" maxlength="20" placeholder="At least 2 characters" value="' + esc(m === 'bind' ? Game.displayName() : '') + '"/></div>' : '') +
          '<div class="field"><label>Email</label><input id="a-email" type="email" placeholder="you@example.com" autocomplete="email"/></div>' +
          '<div class="field"><label>Password</label><input id="a-pass" type="password" placeholder="At least 8 characters" autocomplete="current-password"/></div>' +
          '<div class="err-text" id="a-err"></div>' +
          '<button class="btn" id="a-submit">' + (m === 'register' ? 'Create account' : (m === 'bind' ? 'Bind account' : 'Sign in')) + '</button>';

        f.querySelector('#a-submit').onclick = function () { self._submit(m, el); };
      }

      form(mode);
      Array.prototype.forEach.call(el.querySelectorAll('.tab'), function (t) {
        t.onclick = function () {
          Array.prototype.forEach.call(el.querySelectorAll('.tab'), function (x) { x.classList.remove('active'); });
          t.classList.add('active');
          form(t.getAttribute('data-m'));
        };
      });
    },

    _submit: function (mode, el) {
      var email = (el.querySelector('#a-email') || {}).value || '';
      var pass = (el.querySelector('#a-pass') || {}).value || '';
      var nameEl = el.querySelector('#a-name');
      var name = nameEl ? nameEl.value.trim() : '';
      var err = el.querySelector('#a-err');
      err.textContent = '';

      email = email.trim();
      if (!/.+@.+\..+/.test(email)) { err.textContent = 'Enter a valid email.'; return; }
      if (pass.length < 8) { err.textContent = 'Password must be at least 8 characters.'; return; }
      if ((mode === 'register' || mode === 'bind') && name.length < 2) { err.textContent = 'Commander name must be at least 2 characters.'; return; }

      UI.loading(true);
      var req;
      if (mode === 'register') req = api.register(email, pass, name);
      else if (mode === 'bind') req = api.bind(email, pass, name);
      else req = api.login(email, pass);

      req.then(function (data) {
        if (mode === 'bind') {
          localStorage.setItem('shogun_isGuest', '0');
          UI.loading(false);
          UI.ok('Account bound \u2014 your domain is now saved.');
          Router.reset('profile');
          return;
        }
        api.saveSession(data);
        Game.profile = data.player || null;
        return Promise.all([
          Game.ensureContent().catch(function () {}),
          Game.refreshResources().catch(function () {}),
          Game.refreshTutorial().catch(function () {})
        ]).then(function () {
          UI.loading(false);
          Game.startPolling();
          if (mode === 'register') Router.reset('namecastle');
          else Router.reset('settlement');
        });
      }).catch(function (e) {
        UI.loading(false);
        err.textContent = api.friendly(e);
      });
    }
  };
})();
