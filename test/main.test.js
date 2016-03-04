require('../');
var should = require('should');

require('mocha');

Ext.Loader.setPath('Mocha', __dirname + '/Mocha');

var iPhone = Ext.create('Mocha.asset.gadget.IPhone');

describe('Insistent', function() {
  it('namespace should be defined', function(done) {

    should.exist(Insistent);
    done();
  });

});

describe('Mocha ', function() {
  it('namespace should be defined', function(done) {
    should.exist(Mocha);
    done();
  });

  it('iPhone is defined', function(done) {
    should.exist(iPhone);
    done();
  });

  it('iPhone\'s vendor name is' , function(done) {
    var vendorName = iPhone.getVendorName();
    should.equal(vendorName, 'Apple');
    done();
  });

});
