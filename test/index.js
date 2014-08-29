var Pazpar2 = require('../index');
var assert = require('assert');

describe('Parpar2', function() {

  var pz2 = new Pazpar2({
    session: '2260237',
    terms: ['subject', 'author_070'],
  });

  it('initializes the connection', function(done) {
    pz2.safeInit().then(function(o) {
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

  it('searches for "ti=saint"', function(done) {
    pz2.search("george").then(function(o) {
      setTimeout(done, 1800);
    }, function(err) {
      done(err);
    });
  });

  it('stats for last search', function(done) {
    pz2.stat().then(function(o) {
      done();
    }, function(err) {
      done(err);
    });
  });

  it('shows top records', function(done) {
    pz2.show().then(function(o) {
      console.log(o);
      done();
    }, function(err) {
      done(err);
    });
  });

  it('shows termlist', function(done) {
    pz2.termlist().then(function(o) {
      done();
    }, function(err) {
      done(err);
    });
  });

});
