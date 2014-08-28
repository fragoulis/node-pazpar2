var http = require('http')
  ,util = require('util')
  ,_ = require('underscore')
  ,q = require('q')
  ,querystring = require('querystring')
  ,xml = require('xml2js')
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
}

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
 * @param  {array} options [description]
 * @return {Promise}       [description]
 */
Pazpar2.prototype.init = function(params) {

  // params = {
  //   session: '',
  //   keepAlive: '',
  // }
  
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
}

/**
 * Pings the pz2 to keep the session alive.
 * 
 * @param  {string} session The session to ping
 */
Pazpar2.prototype.ping = function() {
  var self = this;
  return q.Promise(function(resolve, reject) {
    
    var params = {
      command: 'ping',
      session: self.session
    };

    return get.call(self, params)
      .then(function(result) {
        self.updatedAt = new Date().toUTCString();

        resolve(result);
      }, reject);
  });  
}

/**
 * [search description]
 * @param  {array|string} options [description]
 * @return {[type]}        [description]
 */
Pazpar2.prototype.search = function(options) {
  var self = this;

  // options = {
  //   query: '',
  //   filter: '',
  //   onStat: function() {},
  //   onShow: function() {},
  //   onTerms: function() {}
  // }

  if (typeof options === 'string') {
    options = {
      query: options
    };
  }

  if (options.query === undefined || options.query === '') {
    throw new Error('Search query cannot must be defined and not empty.');
  }

  return q.Promise(function(resolve, reject) {

    var params = {
      command: 'search',
      session: self.session,
      query: options.query
    };

    if (options.filter) {
      params.filter = filter;
    }

    return get.call(self, params)
      .then(function(result) {
        resolve(result);
      }, reject);
  });
}

/**
 * [createStatObject description]
 * @param  {[type]} result [description]
 * @return {[type]}        [description]
 */
var StatObject = function(result) {
  
  // var stat = {};
  // Object.keys(result.stat).forEach(function(key) {
  //   var val = result.stat[key][0];
  //   stat[key] = val;
  // });
  
  return {
    activeclients: parseInt(result.activeclients[0]),
    hits: parseInt(result.hits[0]),
    records: parseInt(result.records[0]),
    clients: parseInt(result.clients[0]),
    unconnected: parseInt(result.unconnected[0]),
    connecting: parseInt(result.connecting[0]),
    working: parseInt(result.working[0]),
    idle: parseInt(result.idle[0]),
    failed: parseInt(result.failed[0]),
    error: parseInt(result.error[0]),
    progress: parseFloat(result.progress[0])
  };
}

/**
 * [stat description]
 * @return {[type]} [description]
 */
Pazpar2.prototype.stat = function() {
  var self = this;
  return q.Promise(function(resolve, reject) {
    
    var params = {
      command: 'stat',
      session: self.session
    };

    return get.call(self, params)
      .then(function(result) {
        var stat = new StatObject(result.stat);
        resolve(stat);
      }, reject);
  });
}

/**
 * [ShowObject description]
 * @param {[type]} result [description]
 */
var ShowObject = function(result) {

  var show = {};

  show.status = result.status[0];
  show.activeclients = parseInt(result.activeclients[0]);
  show.merged = parseInt(result.merged[0]);
  show.total = parseInt(result.total[0]);
  show.start = parseInt(result.start[0]);
  show.num = parseInt(result.num[0]);
  show.hit = [];

  for(var idxHit in result.hit) {
    var newHit = {}
      , oldHit = result.hit[idxHit];

    newHit.title = oldHit['md-title'][0];
    newHit.author = oldHit['md-author_070'];
    newHit.publisher = oldHit['md-author_650'];
    newHit.year = oldHit['md-year'][0];
    newHit.count = parseInt(oldHit.count[0]);
    newHit.relevance = parseInt(oldHit.relevance[0]);
    newHit.recid = oldHit.recid[0];
    newHit.recno = parseInt(oldHit.location[0]['md-recno'][0]);
    newHit.holdings = [];

    for(var idxLoc in oldHit.location) {
      var holding = {}
        , location = oldHit.location[idxLoc];

      holding.source = location.$.id;
      holding.checksum = location.$.checksum;
      holding.digital = location['md-digital'];

      newHit.holdings.push(holding);
    }

    show.hit.push(newHit);
  }

  return show;
}

/**
 * [show description]
 * @return {[type]} [description]
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
      .then(function(result) {
        var show = new ShowObject(result.show);
        resolve(show);
      }, reject);
  });
}

/**
 * [termlist description]
 * @return {[type]} [description]
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
      .then(function(result) {
        resolve(result);
      }, reject);

  });
}


module.exports = Pazpar2;
