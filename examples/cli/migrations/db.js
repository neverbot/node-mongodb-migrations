
/* whatever configuration you need to get 
    your connection url */

// let config = new Config();

var mongo = require('then-mongo');
var database = mongo(config.mongo.path);

module.exports = database;
