# node-mongodb-migrations

  Abstract migration framework for node.
  Forked from [ikatun/node-migrate](https://github.com/ikatun/node-migrate), forked from [tj/node-migrate](https://github.com/tj/node-migrate).

## Installation

  $ npm install node-mongodb-migrations

## Usage

```
Usage: migrate [options] [command]

Options:

   -c, --chdir <path>      change the working directory
   --state-file <path>     set path to state file (migrations/.migrate)
   --state-mongo <format>  name of env variable containing the mongo connection string for state storage (MONGO_CONNECTION_STRING)
   --template-file <path>  set path to template file to use for new migrations
   --date-format <format>  set a date format to use for new migration filenames

NOTE: if both --state-mongo and --state-file options are specified while migrations collection is empty, the state file is migrated to the migrations collection before migration is initiated. If migrations collection contains migration state, state-file is ignored.
This behaviour can be used for seamless switching from https://github.com/tj/node-migrate (which at the time of this fork did not support persisting of state file to mongo collection).

Commands:

   down   [name]    migrate down till given migration
   up     [name]    migrate up till given migration (the default command)
   create [title]   create a new migration file with optional [title]

```

## Programmatic usage

```javascript
var migrate = require('migrate');
var set = migrate.load('migration/.migrate', 'migration');

set.up(function (err) {
  if (err) throw err;

  console.log('Migration completed');
});
```

## Creating Migrations

To create a migration, execute `migrate create` with an optional title. `node-migrate` will create a node module within `./migrations/` which contains the following two exports:

    exports.up = function(next){
      next();
    };

    exports.down = function(next){
      next();
    };

All you have to do is populate these, invoking `next()` when complete, and you are ready to migrate!

For example:

    $ migrate create add-pets
    $ migrate create add-owners

The first call creates `./migrations/{timestamp in milliseconds}-add-pets.js`, which we can populate:

      var db = require('./db');

      exports.up = function(next){
        db.rpush('pets', 'tobi');
        db.rpush('pets', 'loki');
        db.rpush('pets', 'jane', next);
      };

      exports.down = function(next){
        db.rpop('pets');
        db.rpop('pets');
        db.rpop('pets', next);
      };

The second creates `./migrations/{timestamp in milliseconds}-add-owners.js`, which we can populate:

      var db = require('./db');

      exports.up = function(next){
        db.rpush('owners', 'taylor');
        db.rpush('owners', 'tj', next);
      };

      exports.down = function(next){
        db.rpop('owners');
        db.rpop('owners', next);
      };

## Running Migrations

When first running the migrations, all will be executed in sequence.

    $ migrate
    up : migrations/1316027432511-add-pets.js
    up : migrations/1316027432512-add-jane.js
    up : migrations/1316027432575-add-owners.js
    up : migrations/1316027433425-coolest-pet.js
    migration : complete

Subsequent attempts will simply output "complete", as they have already been executed in this machine. `node-migrate` knows this because it stores the current state in `./migrations/.migrate` which is typically a file that SCMs like GIT should ignore.

    $ migrate
    migration : complete

If we were to create another migration using `migrate create`, and then execute migrations again, we would execute only those not previously executed:

    $ migrate
    up : migrates/1316027433455-coolest-owner.js

You can also run migrations incrementally by specifying a migration.

    $ migrate up 1316027433425-coolest-pet.js
    up : migrations/1316027432511-add-pets.js
    up : migrations/1316027432512-add-jane.js
    up : migrations/1316027432575-add-owners.js
    up : migrations/1316027433425-coolest-pet.js
    migration : complete

This will run up-migrations upto (and including) `1316027433425-coolest-pet.js`. Similarly you can run down-migrations upto (and including) a specific migration, instead of migrating all the way down.

    $ migrate down 1316027432512-add-jane.js
    down : migrations/1316027432575-add-owners.js
    down : migrations/1316027432512-add-jane.js
    migration : complete

## API

### `migrate.load(stateFile, migrationsDirectory)`

Returns a `Set` populated with migration scripts from the `migrationsDirectory`
and state loaded from `stateFile`.

### `Set.up([migration, ]cb)`

Migrates up to the specified `migration` or, if none is specified, to the latest
migration. Calls the callback `cb`, possibly with an error `err`, when done.

### `Set.down([migration, ]cb)`

Migrates down to the specified `migration` or, if none is specified, to the
first migration. Calls the callback `cb`, possibly with an error `err`, when
done.



