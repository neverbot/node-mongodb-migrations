
/* jshint sub:true */

/* whatever configuration you need to get 
    your connection url */

// let config = new Config();

process.env['MONGODB_CONNECTION_STRING'] = 'mongodb://<database_url>:<database_port>/<database_collection>';

module.exports = require('./../../node_modules/node-mongodb-migrations/bin/migrate');
