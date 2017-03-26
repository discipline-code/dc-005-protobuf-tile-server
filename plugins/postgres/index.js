const pgp = require('pg-promise')({});

exports.register = function(server, options, next) {
  const { DB_HOST, DB_USER, DB_PORT, DB_PASS, DB_DATA } = options;
  server.app.conn = pgp({
    host: DB_HOST,
    port: DB_PORT,
    database: DB_DATA,
    user: DB_USER,
    password: DB_PASS
  });
  console.log(['debug'], 'Postgres plugin loaded...');
  next();
};

exports.register.attributes = {
  pkg: require('./package.json')
};

