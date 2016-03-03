// exports.migration_path = './migrations/';

// Which DBMS to use for executing migrations
exports.dbms = 'sqlite';

// Configuration for MySQL (username, password, etc.)
exports.sqlite = {
    database: '../sqlite/insistent.db'
};

function bootupMochaTestingSchema(db, done) {
    function createIfNotExists(tname, statement) {
        db.get("select count(*) as c from sqlite_master where type=? and name=?;", "table", tname, function(err, row) {
            if(row) {
                return ;
            }
            sys.puts("Creating table '" + tname + "'...");
            db.run(statement, function(err) {
                if(err) {
//           return exit(err);
                }
                sys.puts("...created");
            });
        });
    }

    createIfNotExists('assets', 'create table assets(asset_name VARCHAR(100));');
    done();
}

exports.bootupMochaTestingSchema = bootupMochaTestingSchema;