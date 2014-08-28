var Pazpar2 = require('../index');
var assert = require('assert');

describe('Parpar2', function() {

  var pz2 = new Pazpar2();

  it('initializes the connection', function(done) {
    pz2.init().then(function(o) {
      done();
    }, function(err) {
      done(err);
    });
  });

  it('pings the connection', function(done) {
    pz2.ping().then(function(o) {
      done();
    }, function(err) {
      done(err);
    });
  });

});
