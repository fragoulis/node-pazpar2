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
    pz2.ping('291738251').then(function(o) {
      done();
    }, function(err) {
      done(err);
    });
  });

  it('searches for "george"', function(done) {
    pz2.search('291738251', "ti=saint").then(function(o) {
      setTimeout(done, 2000);
    }, function(err) {
      done(err);
    });
  });

  it('stats for last search', function(done) {
    pz2.stat('291738251').then(function(o) {
      done();
    }, function(err) {
      done(err);
    });
  });

  it('shows the records', function(done) {
    pz2.show('291738251').then(function(o) {
      done();
    }, function(err) {
      done(err);
    });
  });

  it('shows termlist', function(done) {
    pz2.termlist('291738251', ['subject', 'author_070']).then(function(o) {
      done();
    }, function(err) {
      done(err);
    });
  });

  it('shows the first record', function(done) {
    pz2.record('291738251', 'content: 32621').then(function(o) {
      done();
    }, function(err) {
      done(err);
    })
  });

});
