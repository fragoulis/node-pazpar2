var http = require('http')
  ,util = require('util')
  ,_ = require('underscore')
  ,q = require('q')
  ,querystring = require('querystring')
  ,xml = require('xml2js')
;

var Pazpar2 = function() {

  this.requestOptions = {
    hostname: 'localhost',
    port: '9004',
    path: '/search.pz2',
    method: 'GET'
  };

  this.session = null;
  this.keepAlive = 50000;
  this.createdAt = null;
  this.updatedAt = null;
}

/**
 * [get description]
 * @param  {[type]} query         [description]
 * @param  {[type]} errorCallback [description]
 * @param  {[type]} dataCallback  [description]
 * @return {[type]}               [description]
 */
Pazpar2.prototype.get = function(query, dataCallback) {
  var options = _.clone(this.requestOptions);
  options.path += '?' + querystring.stringify(query);
  return http.get(options, function(response) {
    response.on('data', dataCallback);
  });
};

/**
 * Initialiazes a new session with the pz2 server.
 * 
 * @param  {array} options [description]
 * @return {Promise}       [description]
 */
Pazpar2.prototype.init = function() {
  var self = this;
  return q.Promise(function(resolve, reject) {
    
    var query = {
      command: 'init'
    };

    self.get(query, function (data) {
      self.createdAt = new Date().toUTCString();

      xml.parseString(data, function(err, result) {
        self.session = result.init.session;
        self.keepAlive = result.init.keepAlive;
      });

      console.log('Pazpar2 session initialized [%s] @ %s', self.session, self.createdAt);

      resolve(self);
    }).on('error', function(e) {
      reject(new Error(util.format('Pazpar2: %s', e.message)));
    });

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
    
    var query = {
      command: 'ping',
      session: self.session
    };

    self.get(query, function(data) {
      self.updatedAt = new Date().toUTCString();
      xml.parseString(data, function(err, result) {
        if (result.error) {
          reject(new Error(util.format('Pazpar2 (%s): %s [%s]', result.error.$.code, result.error.$.msg, querystring.stringify(query))));
        } else {
          resolve(self);
        }
      });
    }).on('error', function(e) {
      reject(new Error(util.format('Pazpar2: %s', e.message)));
    });

  });  
}

module.exports = Pazpar2;
