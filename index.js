var http = require('http')
  , util = require('util')
  , _ = require('underscore')
  , q = require('q')
  , querystring = require('querystring')
  , xml = require('xml2js')
;

/**
 * Application's default settings
 * @type {Object}
 */
var defaultSettings = {
  keepAlive: 50000,
  request: {
    hostname: 'localhost',
    port: '9004',
    path: '/search.pz2',
    method: 'GET'
  },
  show: {
    sort: 'relevance',
    block: 1,
    num: 10
  }
}

/**
 * Constructor
 */
var Pazpar2 = function(options) {

  options = options || {};

  this.requestOptions = _.clone(defaultSettings.request);
  this.session = options.session || null;
  this.keepAlive = defaultSettings.keepAlive;
  this.terms = options.terms || [];
  this.createdAt = null;
  this.updatedAt = null;
}

/**
 * [get description]
 * @param  {[type]} query         [description]
 * @return {[type]}               [description]
 */
var get = function(query) {
  var options = _.clone(this.requestOptions);
  options.path += '?' + querystring.stringify(query);

  var self = this;
  return q.Promise(function(resolve, reject) {

    http.get(options, function(response) {
      response.on('data', function(data) {
        xml.parseString(data, function(err, result) {

          if (result.error) {
            reject(new Error(util.format('Pazpar2 (%s): %s [%s]', result.error.$.code, result.error.$.msg, querystring.stringify(query))));
          } else {
            resolve(result);
          }
        });
      });
    }).on('error', function(e) {
      reject(new Error(util.format('Pazpar2: %s', e.message)));
    });

  });
} // get

/**
 * [isInitialized description]
 * @return {Boolean} [description]
 */
var isInitialized = function() {
  return (this.session !== null);
}

/**
 * Initialiazes a new session with the pz2 server.
 * 
 * @return {Promise}       
 */
Pazpar2.prototype.init = function() {

  if (isInitialized.call(this)) {
    throw new Error(util.format('Session is already set [%s]', this.session));
  }

  var self = this;
  return q.Promise(function(resolve, reject) {
    
    var params = {
      command: 'init'
    };

    return get.call(self, params)
      .then(function(result) {
        self.createdAt = new Date().toUTCString();
        self.session = result.init.session;
        self.keepAlive = result.init.keepAlive;

        console.log('Pazpar2 session initialized [%s] @ %s', self.session, self.createdAt);

        resolve(result);
      }, reject);
  });
} // init

/**
 * Pings the pz2 to keep the session alive.
 * 
 * @param  {string} session The session to ping if using a different
 *                          session to check that the object's
 * @return {Promise}       
 */
Pazpar2.prototype.ping = function(session) {
  var self = this;
  return q.Promise(function(resolve, reject) {
    
    var params = {
      command: 'ping',
      session: session || self.session
    };

    return get.call(self, params)
      .then(function(result) {

        // Unless we are pinging the object's session
        // do not by mistake udpate the last ping date.
        if (session === self.session)
          self.updatedAt = new Date().toUTCString();

        resolve(result);
      }, reject);
  });  
} // ping

/**
 * Executes the search command.
 * 
 * @return {Promise}       
 */
Pazpar2.prototype.search = function(ccl, filter) {
  var self = this;

  if (ccl === undefined || ccl === '') {
    throw new Error('Search query cannot must be defined and not empty.');
  }

  return q.Promise(function(resolve, reject) {

    var params = {
      command: 'search',
      session: self.session,
      query: ccl
    };

    if (filter) {
      params.filter = filter;
    }

    return get.call(self, params)
      .then(resolve, reject);
  });
} // search

/**
 * Executes the stat command.
 * 
 * @return {Promise}       
 */
Pazpar2.prototype.stat = function() {
  var self = this;
  return q.Promise(function(resolve, reject) {
    
    var params = {
      command: 'stat',
      session: self.session
    };

    return get.call(self, params)
      .then(resolve, reject);
  });
} // stat

/**
 * Executes the show command.
 * 
 * @return {Promise}       
 */
Pazpar2.prototype.show = function(options) {
  var self = this
    , options = options || {}
    ;

  // options = {
  //   start: 0,
  //   num: 0,
  //   block: 1,
  //   sort: 'relevance',
  //   mergekey: '',
  //   rank: ''
  // };

  return q.Promise(function(resolve, reject) {

    var params = {
      command: 'show',
      session: self.session,
      block: options.block || defaultSettings.show.block,
      num: options.num || defaultSettings.show.num,
      sort: options.sort || defaultSettings.show.sort,
      start: options.start || 0,
      type: 'xml'
    };

    return get.call(self, params)
      .then(resolve, reject);
  });
} // show

/**
 * Executes the termlist command.
 * @return {Promise}       
 */
Pazpar2.prototype.termlist = function() {
  var self = this;

  return q.Promise(function(resolve, reject) {

    var params = {
      command: 'termlist',
      session: self.session,
      name: self.terms.join(',')
    }

    return get.call(self, params)
      .then(resolve, reject);

  });
} // termlist

/**
 * A wrapper for ping that makes sense when checking 
 * to see if a session is alive.
 * 
 * @param  {[type]}  session [description]
 * @return {Boolean}         [description]
 */
Pazpar2.prototype.isSessionValid = function(session) {
  var self = this;
  return q.Promise(function(resolve) {
    return self.ping(session || this.session)
      .then(function() {
        return resolve(true);
      }, function(e) {
        resolve(false);
      });
  });
} // isSessionValid

/**
 * Initialiazes a new session with the pz2 server but
 * also handles an expired session.
 * It checks for session validity and if not valid it creates a new session.
 * 
 * @return {Promise}       
 */
Pazpar2.prototype.safeInit = function() {

  if (!isInitialized.call(this)) {
    return this.init();
  }

  var self = this;
  return q.Promise(function(resolve) {

    return self.isSessionValid()
      .then(function(isValid) {
        if (isValid) {
          console.info(util.format('Reusing session [%s].', self.session));
          return resolve();
        } else {
          console.warn(util.format('Session [%s] is not valid. Creating a new one.', self.session));

          // Invalidate the variable
          self.session = null;

          return self.init().then(resolve);
        }
      });

  });
} // safeInit

module.exports = Pazpar2;
