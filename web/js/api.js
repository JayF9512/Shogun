/* ============================================================
   ApiClient — all backend communication for Shadows of the Shogun.
   Live backend: https://728065aeb.abacusai.cloud/api
   ============================================================ */

// Screen registry — must exist before any screen script runs (they load before main.js).
window.Screens = window.Screens || {};

(function () {
  'use strict';

  var API_BASE = 'https://728065aeb.abacusai.cloud/api';
  var LS = 'shogun_';

  function ApiError(status, message, raw) {
    this.status = status;
    this.message = message || 'Something went wrong.';
    this.raw = raw;
  }
  ApiError.prototype = Object.create(Error.prototype);

  // Turn any backend error payload into one friendly sentence.
  function friendly(status, body) {
    var msg = body && body.message;
    if (Array.isArray(msg)) msg = msg[0];
    if (typeof msg !== 'string' || !msg) {
      if (status === 401) msg = 'Your session expired. Please sign in again.';
      else if (status === 403) msg = 'You are not allowed to do that.';
      else if (status === 404) msg = 'That was not found.';
      else if (status === 409) msg = 'That action conflicts with your current state.';
      else if (status >= 500) msg = 'The realm servers are busy. Please try again.';
      else msg = 'Request failed. Please try again.';
    }
    // Capitalise + tidy validation style messages
    msg = msg.charAt(0).toUpperCase() + msg.slice(1);
    return msg;
  }

  var Api = {
    base: API_BASE,

    // ---------- token / identity storage ----------
    get accessToken() { return localStorage.getItem(LS + 'accessToken') || ''; },
    get refreshToken() { return localStorage.getItem(LS + 'refreshToken') || ''; },
    get playerId() { return localStorage.getItem(LS + 'playerId') || ''; },
    get stateId() { return localStorage.getItem(LS + 'stateId') || ''; },
    get castleName() { return localStorage.getItem(LS + 'castleName') || ''; },
    get isGuest() { return localStorage.getItem(LS + 'isGuest') === '1'; },
    get isLoggedIn() { return !!this.accessToken && !!this.playerId; },

    setCastle: function (name) { localStorage.setItem(LS + 'castleName', name); },
    setState: function (id) { if (id) localStorage.setItem(LS + 'stateId', id); },

    saveSession: function (data) {
      if (!data) return;
      if (data.accessToken) localStorage.setItem(LS + 'accessToken', data.accessToken);
      if (data.refreshToken) localStorage.setItem(LS + 'refreshToken', data.refreshToken);
      var p = data.player || {};
      if (p.id) localStorage.setItem(LS + 'playerId', p.id);
      if (p.stateId) localStorage.setItem(LS + 'stateId', p.stateId);
      if (p.serverId) localStorage.setItem(LS + 'serverId', p.serverId);
      localStorage.setItem(LS + 'isGuest', p.isGuest ? '1' : '0');
      if (p.displayName) localStorage.setItem(LS + 'displayName', p.displayName);
    },

    clearSession: function () {
      ['accessToken', 'refreshToken', 'playerId', 'stateId', 'serverId', 'isGuest', 'displayName']
        .forEach(function (k) { localStorage.removeItem(LS + k); });
    },

    // ---------- core request with auto token-refresh ----------
    request: function (path, opts) {
      opts = opts || {};
      var self = this;
      var headers = { 'Content-Type': 'application/json' };
      if (opts.auth !== false && this.accessToken) headers['Authorization'] = 'Bearer ' + this.accessToken;

      var init = { method: opts.method || 'GET', headers: headers };
      if (opts.body !== undefined) init.body = JSON.stringify(opts.body);

      return fetch(API_BASE + path, init).then(function (res) {
        // Attempt a single silent refresh + retry on 401
        if (res.status === 401 && opts._retried !== true && self.refreshToken && opts.auth !== false) {
          return self._doRefresh().then(function (ok) {
            if (!ok) { self.clearSession(); throw new ApiError(401, 'Your session expired. Please sign in again.'); }
            var o2 = Object.assign({}, opts, { _retried: true });
            return self.request(path, o2);
          });
        }
        return res.text().then(function (txt) {
          var data = null;
          try { data = txt ? JSON.parse(txt) : null; } catch (e) { data = txt; }
          if (!res.ok) throw new ApiError(res.status, friendly(res.status, data), data);
          return data;
        });
      }, function () {
        throw new ApiError(0, 'Cannot reach the realm. Check your connection.');
      });
    },

    _doRefresh: function () {
      var self = this;
      return fetch(API_BASE + '/auth/refresh', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken })
      }).then(function (r) {
        if (!r.ok) return false;
        return r.json().then(function (d) {
          if (d && d.accessToken) { localStorage.setItem(LS + 'accessToken', d.accessToken); if (d.refreshToken) localStorage.setItem(LS + 'refreshToken', d.refreshToken); return true; }
          return false;
        });
      }).catch(function () { return false; });
    },

    // ---------- AUTH ----------
    guest: function () {
      var self = this;
      return this.request('/auth/guest', { method: 'POST', body: {}, auth: false })
        .then(function (d) { self.saveSession(d); return d; });
    },
    register: function (email, password, displayName, serverId) {
      var self = this;
      return this.request('/auth/register', { method: 'POST', auth: false,
        body: { email: email, password: password, displayName: displayName, serverId: serverId || 'seed-server' } })
        .then(function (d) { self.saveSession(d); return d; });
    },
    login: function (email, password) {
      var self = this;
      return this.request('/auth/login', { method: 'POST', auth: false, body: { email: email, password: password } })
        .then(function (d) { self.saveSession(d); return d; });
    },
    bind: function (email, password, displayName) {
      var body = { email: email, password: password };
      if (displayName) body.displayName = displayName;
      var self = this;
      return this.request('/auth/bind', { method: 'POST', body: body }).then(function (d) {
        localStorage.setItem(LS + 'isGuest', '0');
        if (d && d.player) self.saveSession(d);
        return d;
      });
    },
    logout: function () {
      var rt = this.refreshToken;
      this.clearSession();
      if (rt) return this.request('/auth/logout', { method: 'POST', auth: false, body: { refreshToken: rt } }).catch(function () {});
      return Promise.resolve();
    },

    // ---------- STATES ----------
    getStates: function () { return this.request('/states', { auth: false }); },
    joinState: function (id) { return this.request('/states/' + id + '/join', { method: 'POST', body: {} }); },

    // ---------- PLAYER ----------
    getProfile: function (id) { return this.request('/players/' + (id || this.playerId) + '/profile'); },

    // ---------- ECONOMY ----------
    getResources: function () { return this.request('/economy/resources'); },
    tick: function () { return this.request('/economy/tick', { method: 'POST', body: {} }); },

    // ---------- CONTENT ----------
    getHeroes: function () { return this.request('/content/heroes', { auth: false }); },
    getTroops: function () { return this.request('/content/troops', { auth: false }); },
    getBuildings: function () { return this.request('/content/buildings', { auth: false }); },
    getPets: function () { return this.request('/content/pets', { auth: false }); },
    getStore: function () { return this.request('/store', { auth: false }); },
    getSeasonPass: function () { return this.request('/season-pass'); },

    // ---------- MARCH ----------
    sendMarch: function (dto) { return this.request('/march', { method: 'POST', body: dto }); },
    getMarches: function () { return this.request('/march'); },
    recallMarch: function (id) { return this.request('/march/' + id + '/recall', { method: 'POST', body: {} }); },

    // ---------- COMBAT ----------
    simulate: function (attacker, defender) { return this.request('/combat/simulate', { method: 'POST', auth: false, body: { attacker: attacker, defender: defender } }); },

    // ---------- CLANS ----------
    getClans: function (q) { return this.request('/clans' + (q ? '?q=' + encodeURIComponent(q) : '')); },
    createClan: function (dto) { return this.request('/clans', { method: 'POST', body: dto }); },
    getClan: function (id) { return this.request('/clans/' + id); },
    joinClan: function (id) { return this.request('/clans/' + id + '/join', { method: 'POST', body: {} }); },

    // ---------- EVENTS ----------
    getEvents: function () { return this.request('/events'); },

    // ---------- MAIL ----------
    getMail: function () { return this.request('/mail'); },
    readMail: function (id) { return this.request('/mail/' + id + '/read', { method: 'POST', body: {} }); },
    claimMail: function (id) { return this.request('/mail/' + id + '/claim', { method: 'POST', body: {} }); },

    // ---------- LEADERBOARD ----------
    getLeaderboard: function () { return this.request('/leaderboards'); }
  };

  window.api = Api;
  window.ApiError = ApiError;
  window.API_BASE = API_BASE;
})();
