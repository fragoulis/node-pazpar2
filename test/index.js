var Pazpar2 = require('../index');
var assert = require('assert');

describe('Parpar2', function() {

  var pz2 = new Pazpar2({
    session: '246404645',
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

  it('searches for "george"', function(done) {
    pz2.search("ti=saint").then(function(o) {
      setTimeout(done, 2000);
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

  var record = null;
  it('shows the records', function(done) {
    pz2.show().then(function(o) {
      record = o.show.hit[0];
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

  it('shows the first record', function(done) {

    if (record === null) {
      done('Record not set.');
    }

    pz2.record(record.recid[0], 0).then(function(o) {
      console.log(o);
      done();
    }, function(err) {
      done(err);
    })
  });

});
