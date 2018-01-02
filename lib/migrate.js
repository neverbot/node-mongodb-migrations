
/*!
 * migrate
 * Copyright(c) 2011 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

/* jshint laxcomma:true */

/**
 * Module dependencies.
 */

var CoreSet = require('./core-set')
  , path = require('path')
  , fs = require('fs');

/**
 * Expose the migrate function.
 */

exports = module.exports = migrate;

function migrate(title, up, down) {
  // migration
  if ('string' === typeof title && up && down) {
    migrate.set.addMigration(title, up, down);
  // specify migration file
  } else if ('string' === typeof title) {
    migrate.set = new CoreSet(title);
  // no migration path
  } else if (!migrate.set) {
    throw new Error('must invoke migrate(path) before running migrations');
  // run migrations
  } else {
    return migrate.set;
  }
}

var MongoSet = require('./mongo-set');

exports.load = function (stateSrc, migrationsDirectory, type, stateFile) {
  type = type || 'file';
  var set = type === 'file' ? new CoreSet(stateSrc) : new MongoSet(stateSrc, stateFile);
  var dir = path.resolve(migrationsDirectory);
  fs.readdirSync(dir).filter(function(file){
    return file.match(/^\d+.*\.js$/);
  }).sort().forEach(function (file) {
    var mod = require(path.join(dir, file));
    set.addMigration(file, mod.up, mod.down);
  });

  return set;
};
