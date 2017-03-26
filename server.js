const Hapi = require('hapi'); // Require hapi
const server = new Hapi.Server();

const plugins = [
  {
    register: require('./plugins/postgres'),
    options: { 
      DB_HOST: 'db', 
      DB_USER: 'postgres',
      DB_PORT: '5432',
      DB_PASS: '',
      DB_DATA: 'postgres' 
    }
  },
  {
    register: require('./plugins/redis'),
    options: { REDIS_HOST: 'redis', REDIS_PORT: '6379' }
  },
  { register: require('./plugins/layers') },
  { register: require('inert') }
];

server.connection({
  routes: { cors: true },
  host: '0.0.0.0', // If you use localhost Docker won't expose the app
  port: 8081 // Make sure this port is not being used by any other app
});

// Register plugins
server.register(plugins, err => {
  if(err) {
    console.log(['error'], 'There was an error loading plugins...');
    console.log(['error'], 'Terminating...');
    console.log(['error'], err);
    throw err;
  }
  // Default health check URL 
  server.route({
    method: 'GET',
    path: '/',
    handler: (request, reply) => reply({ status: 'ok' })
  });
  server.route({
    method: 'GET',
    path: '/postgres-test',
    handler: (request, reply) => {
      const db = request.server.app.conn;
      const query = 'SELECT nom_ent FROM geoms.estados';
      return db.any(query)
        .then(data => reply(data));
    }
  });
  server.route({
    method: 'GET',
    path: '/test-vector-tiles',
    handler: {
      file: 'index.html'
    }
  });
  // Start server
  server.start(err => {
    if(err) {
      console.log(['error'], 'There was an error at server start...');
      console.log(['error'], 'Terminating...');
      console.log(['error'], err);
      throw err;
    }
    console.log(['debug'], `Server running at: ${server.info.uri}`);
  });
});
