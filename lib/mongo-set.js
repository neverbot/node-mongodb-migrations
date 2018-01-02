
/* jshint esnext: false */
/* jshint esversion: 6 */

var fs = require('fs');
var CoreSet = require('./core-set');
var mongo = require('then-mongo');

function MongoSet(connectionStringEnv, stateFile, migrationCollection) {
  CoreSet.call(this, 'mongo');
  this.connectionString = process.env[connectionStringEnv];
  this.migrationCollection = migrationCollection || 'migrations';
  this.stateFile = stateFile;
}

MongoSet.prototype = Object.create(CoreSet.prototype);
MongoSet.prototype.constructor = MongoSet;

// used to migrate from state file to DB persistence
function syncStateFileWithDB(collection, filePath) {
  console.log('Syncing migration file with mongno migrations table');
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
  var migrations = mongo(this.connectionString)[this.migrationCollection];
  migrations.findOne({})
    .then(([res]) => {
      var syncPromise = Promise.resolve();
      if (!res && stateFile) {
        syncPromise = syncStateFileWithDB(migrations, stateFile);
      }
      return syncPromise.then(function() {
          migrations.findOne({}).then(([res]) => {
            fn(null, res || {});
        });
      });
    })
    .catch(fn);
};

MongoSet.prototype.save = function(fn) {
  this.emit('save');
  var migrations = mongo(this.connectionString)[this.migrationCollection];
  var json = JSON.parse(JSON.stringify(this));
  migrations
    .update({}, json, { upsert: true })
    .then(function(res) {
      fn(null, res || {});
    })
    .catch(fn);
};

module.exports = MongoSet;
