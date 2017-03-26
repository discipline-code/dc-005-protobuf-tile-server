exports.register = function(server, options, next) {
  server.route({ method: 'GET', path: '/layers/states/{z}/{x}/{y}.pbf', config: require('./layer/states') });
  console.log(['debug'], 'Layers plugin loaded...');
  next();
};

exports.register.attributes = {
  pkg: require('./package.json')
};


