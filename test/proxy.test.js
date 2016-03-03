// var sys = require('util'),
//     exec = require('child_process').exec,
//     fs = require('fs');

var mochaBoot = require('./boot');
var dbms = mochaBoot.dbms;
var dbmsConfig = mochaBoot[dbms];
var dbFileName = dbmsConfig.database;
var should = require('should');

var sqlite3 = require("sqlite3");
if(dbmsConfig.verbose) {
    sqlite3.verbose();
}

var db;

// var client = new sqlite3.Database(dbFileName, function(err) {
//     mochaBoot.bootupMochaTestingSchema(client);
// });

describe('sql proxy', function() {
    before(function (done) {
        db = new sqlite3.Database('dbFileName', done);
    });

    it('test db is up', function(done) {
        should.exist(db);
        done();
    });

    it('setup schema', function(done) {
        mochaBoot.bootupMochaTestingSchema(db, done);
//         should.exist(db);
//         done();
    });

});

