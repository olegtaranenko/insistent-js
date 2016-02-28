var insistent = require('../');
var should = require('should');

require('mocha');

describe('Insistent ', function() {
  it('namespace should be defined', function(done) {

    should.exist(Insistent);
    done();
  });

});
