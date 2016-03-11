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

var db, clientAndBudgets;

describe('sql proxy', function() {
    before(function (done) {
//         db = new sqlite3.Database(':memory:', done);
        db = new sqlite3.Database(dbFileName, done);
    });

    it('test db is up', function(done) {
        should.exist(db);
        done();
    });

    it('setup schema', function(done) {
        mochaBoot.bootupMochaTestingSchema(db, done);
    });
    
    it('client budget has 5 items', function(done) {
        db.each('select * from ClientBudget', function(err, row) {
//             console.log('%d : %s', row.ID, row.ChildName);
        }, function(err, num) {
            should.equal(num, 5);
            done();
        });
    });

    it('clientBudet store should be created', function(done) {
        clientAndBudgets = Ext.create('Mocha.store.ClientsAndBudgetsStore');
        should.exists(clientAndBudgets);
        done();
    });

    it('... and class of ', function(done) {
        (clientAndBudgets instanceof Mocha.store.ClientsAndBudgetsStore).should.be.true();
        done();
    });

    /*
        it('clientBudget store has load method', function(done) {
            clientAndBudgets.load({
                callback: function() {
                    done();
                }
            });
        });
    */
});

