
/* jshint esnext: false */
/* jshint esversion: 6 */

var fs = require('fs');
var CoreSet = require('./core-set');
var Mongo = require('mongodb').MongoClient;

function MongoSet(connectionStringEnv, stateFile, migrationCollection) {
  CoreSet.call(this, 'mongo');
  this.connectionString = process.env[connectionStringEnv];
  this.migrationCollection = migrationCollection || 'migrations';
  this.stateFile = stateFile;
  this.dataBase = null;
}

MongoSet.prototype = Object.create(CoreSet.prototype);
MongoSet.prototype.constructor = MongoSet;

// used to migrate from state file to DB persistence
function syncStateFileWithDB(collection, filePath) {
  console.log('Syncing migration file with mongo migrations table');
  try {
    const migrationData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return collection.update({}, migrationData, { upsert: true }).then(() => console.log('Sync OK!'));
  } catch (e) {
    // ignored, file probably no longer used, logged just in case
    console.error(e);
    return Promise.resolve();
  }
}

MongoSet.prototype.load = function(fn) {
  const stateFile = this.stateFile;
  this.emit('load');
  
  Mongo.connect(this.connectionString).then((db) => {
    this.dataBase = db;
    return db.collection(this.migrationCollection);
  }).then((collection) => {
    return Promise.all([collection, collection.findOne({})]);
  }).then(([collection, migrations]) => {
    var syncPromise = Promise.resolve();
    if (!migrations && stateFile) {
      // sync database with state file, and get again the migration info 
      // in the database
      syncPromise = syncStateFileWithDB(collection, stateFile).then((sync) => {
        return collection.findOne({});
      });
    } else {
      syncPromise = migrations;
    }
    return Promise.all([collection, syncPromise]);
  }).then(([collection, migrations]) => {
    fn(null, migrations || {});
  }).catch((err) => { 
    fn(); 
  });
};

MongoSet.prototype.save = function(fn) {
  this.emit('save');
  var save = Object.assign({}, this);
  delete(save.dataBase);
  var json = JSON.parse(JSON.stringify(save));

  // Mongo.connect(this.connectionString).then((db) => {
  //   return db.collection(this.migrationCollection);
  this.dataBase.collection(this.migrationCollection).update({}, json, { upsert: true })
    .then(function(res) {
      fn(null, res || {});
    })
    .catch(fn);
};

module.exports = MongoSet;
