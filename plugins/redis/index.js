const redis = require('redis');
const bluebird = require('bluebird');

bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

exports.register = function(server, options, next) {
  const { REDIS_HOST, REDIS_PORT } = options;
  server.app.rc = redis.createClient({
    host: REDIS_HOST,
    port: REDIS_PORT,
    detect_buffers: true
  });
  server.route({ method: 'GET', path: '/cache/flush', config: {
    handler: (request, reply) => {
      const cache = request.server.app.rc;
      cache.flushdb((err, succeeded) => {
        console.log(['debug'], 'Redis databases flushed');
        reply({ status: 'ok' });
      });
    }
  }});
  console.log(['debug'], 'Redis plugin loaded...');
  next();
};

exports.register.attributes = {
  pkg: require('./package.json')
};
