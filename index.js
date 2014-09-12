var http = require('http')
  , util = require('util')
  , _ = require('underscore')
  , q = require('q')
  , querystring = require('querystring')
  , ip = require('ip')
  ;

/**
 * Application's default settings
 * @type {Object}
 */
var defaultSettings = {
  keepAlive: 50000,
  url: 'http://' + ip.address() + '/pazpar2/search.pz2',
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
  this.url = defaultSettings.url;
  this.keepAlive = options.keepAlive || defaultSettings.keepAlive;
  this.requestOptions = defaultSettings.request;
}

/**
 * [get description]
 * @param  {[type]} query         [description]
 * @return {[type]}               [description]
 */
var get = function(query) {
  var options = _.clone(this.requestOptions);
  query.keepAlive = this.keepAlive

  var qs = querystring.stringify(query);
  options.path += '?' + qs

  var self = this;
  return q.Promise(function(resolve, reject) {

    console.log('Pazpar2: %s', qs);

    http.get(options, function(response) {
      response.on('data', resolve);
    }).on('error', function(e) {
      reject(new Error(util.format('Pazpar2: %s', e.message)));
    });

  });
} // get

/**
 * Initialiazes a new session with the pz2 server.
 * 
 * @return {Promise}       
 */
Pazpar2.prototype.init = function() {

  var self = this;
  return q.Promise(function(resolve, reject) {
    
    var params = {
      command: 'init'
    };

    return get.call(self, params)
      .then(resolve, reject);
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
      session: session
    };

    return get.call(self, params)
      .then(resolve, reject);
  });  
} // ping

/**
 * Executes the search command.
 * 
 * @return {Promise}       
 */
Pazpar2.prototype.search = function(session, ccl, filter) {
  var self = this;

  if (ccl === undefined || ccl === '') {
    throw new Error('Search query must be defined and not empty.');
  }

  return q.Promise(function(resolve, reject) {

    var params = {
      command: 'search',
      session: session,
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
Pazpar2.prototype.stat = function(session) {
  var self = this;
  return q.Promise(function(resolve, reject) {
    
    var params = {
      command: 'stat',
      session: session
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
Pazpar2.prototype.show = function(session, options) {
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
      session: session,
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
Pazpar2.prototype.termlist = function(session, terms) {
  var self = this;

  return q.Promise(function(resolve, reject) {

    var params = {
      command: 'termlist',
      session: session,
      name: typeof terms === 'String' ? terms.join(',') : terms
    }

    return get.call(self, params)
      .then(resolve, reject);

  });
} // termlist

/**
 * Loads a single record.
 * 
 * @param  {String} id 
 * @return {Promise}    
 */
Pazpar2.prototype.record = function(session, id, offset) {
  var self = this;
  
  return q.Promise(function(resolve, reject) {

    var params = {
        command: 'record'
      , session: session
      , id: id
    };

    if (offset !== undefined) {
      params.offset = offset;
    }

    return get.call(self, params)
      .then(resolve, reject);
  });
} // record

module.exports = Pazpar2;
