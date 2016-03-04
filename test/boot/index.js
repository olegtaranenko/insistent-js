exports.dbms = 'sqlite';

exports.sqlite = {
    database: 'test/cache/pp'
//     database: 'test/cache/insistent.db'
};

function bootupMochaTestingSchema(db, done) {

    createIfNotExists('assets', 'CREATE TABLE assets(asset_name VARCHAR(100));');
    createIfNotExists('os', 'CREATE TABLE os(vendor_name VARCHAR(30));');
    done();


    function createIfNotExists(tname, statement) {
        db.get("select count(*) as c from sqlite_master where type='table' and name = ?;", tname,
            function(err, row) {
                if (err) throw err;
                if (row.c === 0) {
                    console.log('about to creating %s ... ', tname);
                    db.run(statement, function(err) {
                        if (err) {
                            console.error('error by creating %s', tname);
                            throw err;
                        }
                        console.log('... %s created', tname);
                    });
                } else {
//                     console.log('...%s already exists', tname);
                }
            }
        );
    }
//     throw new Error('test');
}

exports.bootupMochaTestingSchema = bootupMochaTestingSchema;