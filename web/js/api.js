/* ============================================================
   ApiClient — all backend communication.
   Live backend: https://728065aeb.abacusai.cloud/api
   ============================================================ */

// Screen registry must exist before any screen script runs (they load before main.js).
window.Screens = window.Screens || {};

(function () {
  'use strict';

  var API_BASE = 'https://728065aeb.abacusai.cloud/api';
  var LS = 'shogun_';

  function ls(k) { return localStorage.getItem(LS + k); }
  function setLs(k, v) { if (v == null) localStorage.removeItem(LS + k); else localStorage.setItem(LS + k, v); }

  function ApiError(status, message, raw) { this.status = status; this.message = message; this.raw = raw; }
  ApiError.prototype = Object.create(Error.prototype);

  var Api = {
    base: API_BASE,

    // ---- token / session accessors ----
    get accessToken() { return ls('accessToken'); },
    get refreshToken() { return ls('refreshToken'); },
    get playerId() { return ls('playerId'); },
    get stateId() { return ls('stateId'); },
    get role() { return ls('role') || 'PLAYER'; },
    get isGuest() { return ls('isGuest') === '1'; },
    get isLoggedIn() { return !!ls('accessToken'); },
    get castleName() { return ls('castleName'); },
    get commander() { return ls('commander'); },

    saveSession: function (data) {
      if (data.accessToken) setLs('accessToken', data.accessToken);
      if (data.refreshToken) setLs('refreshToken', data.refreshToken);
      var p = data.player || data;
      if (p) {
        if (p.id) setLs('playerId', p.id);
        if (p.stateId) setLs('stateId', p.stateId);
        if (p.displayName) setLs('displayName', p.displayName);
        if (p.role) setLs('role', p.role);
        if (typeof p.isGuest !== 'undefined') setLs('isGuest', p.isGuest ? '1' : '0');
        if (p.bindCode) setLs('bindCode', p.bindCode);
        if (p.shieldEndsAt) setLs('shieldEndsAt', p.shieldEndsAt);
      }
    },

    clearSession: function () {
      ['accessToken', 'refreshToken', 'playerId', 'displayName', 'role', 'isGuest', 'bindCode', 'shieldEndsAt'].forEach(function (k) { setLs(k, null); });
    },

    // ---- core request with single silent refresh on 401 ----
    request: function (method, path, body, opts) {
      opts = opts || {};
      var self = this;
      var headers = { 'Content-Type': 'application/json' };
      if (!opts.noAuth && this.accessToken) headers.Authorization = 'Bearer ' + this.accessToken;

      var init = { method: method, headers: headers };
      if (body != null) init.body = JSON.stringify(body);

      return fetch(API_BASE + path, init).then(function (res) {
        if (res.status === 401 && !opts._retried && self.refreshToken) {
          return self._refresh().then(function () {
            return self.request(method, path, body, Object.assign({}, opts, { _retried: true }));
          }).catch(function () {
            self.clearSession();
            throw new ApiError(401, 'Your session expired. Please sign in again.');
          });
        }
        return res.text().then(function (txt) {
          var data = null;
          try { data = txt ? JSON.parse(txt) : null; } catch (e) { data = txt; }
          if (!res.ok) {
            var msg = (data && (data.message || data.error)) || ('Request failed (' + res.status + ')');
            if (Array.isArray(msg)) msg = msg[0];
            throw new ApiError(res.status, msg, data);
          }
          return data;
        });
      });
    },

    _refresh: function () {
      var self = this;
      return fetch(API_BASE + '/auth/refresh', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: this.refreshToken })
      }).then(function (r) {
        if (!r.ok) throw new Error('refresh failed');
        return r.json();
      }).then(function (d) { self.saveSession(d); return d; });
    },

    get: function (p, o) { return this.request('GET', p, null, o); },
    post: function (p, b, o) { return this.request('POST', p, b, o); },

    // ---- friendly error mapping ----
    friendly: function (e) {
      if (!e) return 'Something went wrong.';
      if (e.status === 401) return 'Please sign in again.';
      if (e.status === 403) return 'You do not have permission for that.';
      if (e.status === 404) return 'Not found.';
      if (e.status === 409) return e.message || 'That action conflicts with the current state.';
      if (e.status >= 500) return 'The server had a problem. Try again shortly.';
      return e.message || 'Something went wrong.';
    },

    // ================= AUTH =================
    guest: function () { return this.post('/auth/guest', {}, { noAuth: true }); },
    login: function (email, password) { return this.post('/auth/login', { email: email, password: password }, { noAuth: true }); },
    register: function (email, password, displayName) {
      return this.post('/auth/register', { email: email, password: password, displayName: displayName, serverId: 'seed-server' }, { noAuth: true });
    },
    bind: function (email, password, displayName) { return this.post('/auth/bind', { email: email, password: password, displayName: displayName }); },
    me: function () { return this.get('/players/me'); },

    // ================= STATES =================
    getStates: function () { return this.get('/states', { noAuth: true }); },
    joinState: function (id) { return this.post('/states/' + id + '/join', {}); },

    // ================= ECONOMY =================
    getResources: function () { return this.get('/economy/resources'); },
    tick: function () { return this.post('/economy/tick', {}); },

    // ================= CONTENT =================
    getHeroes: function () { return this.get('/content/heroes', { noAuth: true }); },
    getTroops: function () { return this.get('/content/troops', { noAuth: true }); },
    getBuildings: function () { return this.get('/content/buildings', { noAuth: true }); },
    getPets: function () { return this.get('/content/pets', { noAuth: true }); },

    // ================= TUTORIAL =================
    getTutorial: function () { return this.get('/tutorial/progress'); },
    completeStep: function (step, data) { return this.post('/tutorial/complete-step', { step: step, data: data || {} }); },

    // ================= MAP =================
    getTiles: function (stateId, x, y, range) {
      return this.get('/map/tiles?stateId=' + encodeURIComponent(stateId) + '&x=' + x + '&y=' + y + '&range=' + (range || 100));
    },
    placeCastle: function (x, y) { return this.post('/map/place-castle', { x: x, y: y }); },
    teleport: function (x, y) { return this.post('/map/teleport', { x: x, y: y }); },

    // ================= MARCH / COMBAT =================
    getMarches: function () { return this.get('/march'); },
    march: function (payload) { return this.post('/march', payload); },
    recall: function (id) { return this.post('/march/' + id + '/recall', {}); },
    simulate: function (attacker, defender) { return this.post('/combat/simulate', { attacker: attacker, defender: defender }, { noAuth: true }); },

    // ================= STORE / PASS =================
    getStore: function () { return this.get('/store'); },
    getSeasonPass: function () { return this.get('/season-pass'); },

    // ================= SOCIAL =================
    getClans: function () { return this.get('/clans'); },
    getClan: function (id) { return this.get('/clans/' + id); },
    createClan: function (name, tag, description) { return this.post('/clans', { name: name, tag: tag, description: description }); },
    joinClan: function (id) { return this.post('/clans/' + id + '/join', {}); },
    getEvents: function () { return this.get('/events'); },
    getMail: function () { return this.get('/mail'); },
    readMail: function (id) { return this.post('/mail/' + id + '/read', {}); },
    claimMail: function (id) { return this.post('/mail/' + id + '/claim', {}); },
    getLeaderboards: function () { return this.get('/leaderboards'); },

    // ================= ADMIN =================
    adminLog: function () { return this.get('/admin/log'); },
    appointAdmin: function (email) { return this.post('/admin/appoint', { email: email }); },
    demoteAdmin: function (email) { return this.post('/admin/demote', { email: email }); }
  };

  window.api = Api;
  window.ApiError = ApiError;
  window.API_BASE = API_BASE;
})();
