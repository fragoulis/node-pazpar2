

var http = require('http')
  ,querystring = require('querystring')
  ,xml = require('xml2js')
;

Pazpar2 = function() {

}

/**
 * Initialiazes a new session with the pz2 server.
 * 
 * @param  {array} options [description]
 * @return {Promise}       [description]
 */
Pazpar2.prototype.init = function() {

}

/**
 * Pings the pz2 to keep the session alive.
 * 
 * @param  {string} session The session to ping
 */
Pazpar2.prototype.ping = function() {
  var query = {
    command: 'ping',
    session: 2109245441
  };

  var options = {
    hostname: 'localhost',
    port: '9004',
    path: '/search.pz2?' + querystring.stringify(query),
    method: 'GET'
  };

  http.get(options, function(res) {
    res.on('data', function (chunk) {
      xml.parseString(chunk, function(err, result) {
        console.log(result);
      });
    });
  });
}

module.exports = Pazpar2;
