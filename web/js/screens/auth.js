/* AUTH — login / register tabs, with guest-bind warning. */
window.Screens.auth = {
  hasNav: false,
  render: function (root) {
    root.innerHTML =
      '<div class="screen-bg" style="background-image:url(assets/images/login-bg.webp)"></div>' +
      '<div class="screen-inner" style="display:flex;flex-direction:column;min-height:100%">' +
        '<div class="logo-mini" style="margin-top:6px">SHADOWS OF THE SHOGUN</div>' +
        '<div style="flex:1"></div>' +
        '<div class="panel">' +
          '<div class="tabs">' +
            '<div class="tab active" data-tab="login">LOGIN</div>' +
            '<div class="tab" data-tab="register">REGISTER</div>' +
          '</div>' +
          '<div id="auth-body"></div>' +
        '</div>' +
        '<button class="btn btn-ghost" id="a-guest" style="margin-top:14px">Play as Guest instead</button>' +
        '<div style="flex:1"></div>' +
      '</div>';

    var body = root.querySelector('#auth-body');
    var tabs = root.querySelectorAll('[data-tab]');
    Array.prototype.forEach.call(tabs, function (t) {
      t.onclick = function () {
        Array.prototype.forEach.call(tabs, function (x) { x.classList.remove('active'); });
        t.classList.add('active');
        renderTab(t.getAttribute('data-tab'));
      };
    });
    renderTab('login');

    root.querySelector('#a-guest').onclick = function () {
      if (api.isLoggedIn && api.isGuest) { Router.go('settlement'); return; }
      UI.loading(true);
      api.guest().then(function () { return Promise.all([Game.ensureContent(), Game.refreshResources().catch(function () {})]); })
        .then(function () { UI.loading(false); Router.go('namecastle'); })
        .catch(function (e) { UI.loading(false); UI.err(e); });
    };

    function renderTab(kind) {
      if (kind === 'login') {
        body.innerHTML =
          '<div class="field"><label>Email</label><input class="input" id="l-email" type="email" placeholder="you@realm.jp" autocomplete="email" /></div>' +
          '<div class="field"><label>Password</label><input class="input" id="l-pass" type="password" placeholder="••••••••" autocomplete="current-password" /></div>' +
          '<div class="form-err" id="l-err"></div>' +
          '<button class="btn btn-primary" id="l-go">ENTER THE REALM</button>';
        body.querySelector('#l-go').onclick = doLogin;
      } else {
        body.innerHTML =
          '<div class="field"><label>Warrior Name</label><input class="input" id="r-name" placeholder="Your display name" /></div>' +
          '<div class="field"><label>Email</label><input class="input" id="r-email" type="email" placeholder="you@realm.jp" /></div>' +
          '<div class="field"><label>Password</label><input class="input" id="r-pass" type="password" placeholder="Min. 8 characters" /></div>' +
          '<div class="field"><label>Confirm Password</label><input class="input" id="r-pass2" type="password" placeholder="Repeat password" /></div>' +
          '<div class="form-err" id="r-err"></div>' +
          '<button class="btn btn-primary" id="r-go">CREATE ACCOUNT</button>';
        body.querySelector('#r-go').onclick = doRegister;
      }
    }

    function afterAuth() {
      return Promise.all([Game.ensureContent(), Game.refreshProfile().catch(function () {}), Game.refreshResources().catch(function () {})])
        .then(function () {
          UI.loading(false);
          UI.ok('Welcome back, ' + Game.displayName() + '!');
          if (Game.profile && Game.profile.settlement) Router.go('settlement');
          else Router.go('namecastle');
        });
    }

    function doLogin() {
      var email = body.querySelector('#l-email').value.trim();
      var pass = body.querySelector('#l-pass').value;
      var err = body.querySelector('#l-err');
      if (!email || !pass) { err.textContent = 'Enter your email and password.'; return; }
      err.textContent = '';
      UI.loading(true);
      api.login(email, pass).then(afterAuth).catch(function (e) { UI.loading(false); err.textContent = e.message; });
    }

    function doRegister() {
      var name = body.querySelector('#r-name').value.trim();
      var email = body.querySelector('#r-email').value.trim();
      var pass = body.querySelector('#r-pass').value;
      var pass2 = body.querySelector('#r-pass2').value;
      var err = body.querySelector('#r-err');
      if (name.length < 2) { err.textContent = 'Your warrior name needs at least 2 characters.'; return; }
      if (!email) { err.textContent = 'Enter a valid email.'; return; }
      if (pass.length < 8) { err.textContent = 'Password must be at least 8 characters.'; return; }
      if (pass !== pass2) { err.textContent = 'Passwords do not match.'; return; }
      err.textContent = '';

      // If a guest session exists, binding warning first (progress-link caveat).
      if (api.isLoggedIn && api.isGuest) {
        showBindWarning(email, pass, name, err);
      } else {
        UI.loading(true);
        api.register(email, pass, name, localStorage.getItem('shogun_serverId') || 'seed-server')
          .then(afterAuth).catch(function (e) { UI.loading(false); err.textContent = e.message; });
      }
    }

    function showBindWarning(email, pass, name, err) {
      Modal({
        title: '⚠️ Bind Your Account',
        html:
          '<p style="color:var(--text-dim);font-size:14px;line-height:1.6;margin:6px 0 18px">' +
            'Binding will permanently link your current guest progress to <b style="color:var(--gold)">' + esc(email) + '</b>.' +
            ' If you already have an account on a different state, your current progress will <b>not</b> transfer.</p>' +
          '<button class="btn btn-primary" id="bind-yes">BIND MY ACCOUNT</button>' +
          '<div style="height:10px"></div>' +
          '<button class="btn btn-ghost" id="bind-no">Cancel</button>',
        onMount: function (m) {
          m.querySelector('#bind-no').onclick = closeModal;
          m.querySelector('#bind-yes').onclick = function () {
            closeModal(); UI.loading(true);
            api.bind(email, pass, name).then(function () {
              UI.ok('Account bound! Your progress is now saved.');
              return afterAuth();
            }).catch(function (e) { UI.loading(false); UI.err(e); });
          };
        }
      });
    }
  }
};
