const path = require('path');
const zlib = require('zlib');
const mapnik = require('mapnik');
const SphericalMercator = require('sphericalmercator');
const topojson = require('topojson');
const mercator = new SphericalMercator({
  size: 256 //tile size
});

mapnik.registerDatasource(path.join(mapnik.settings.paths.input_plugins, 'geojson.input'));

const query = `
  SELECT c.topojson as feature, c.cve_ent as cve_ent
  FROM geoms.estados c 
  WHERE (st_intersects(c.geom, ST_MakeEnvelope($1, $2, $3, $4, 4326)))
`;

module.exports = {
  handler: (request, reply) => {
    const cache = request.server.app.rc;
    const layername = 'estatal';
    let { x , y , z }  = request.params;

    const createTile = data => {
      const vtile = new mapnik.VectorTile(+z, +x, +y);
      const features = data.map(parseEstado);
      const geojson = { type: "FeatureCollection", features };
      vtile.addGeoJSON(JSON.stringify(geojson), 'estatal' , {});
      request.server.log(['debug'], 'creating tile');
      return vtile;
    };

    const deflateTile = vtile => {
      return new Promise((resolve, reject) => {
        vtile.getData({}, (err, pbf) => {
          if(err) reject(err);
          zlib.deflate(pbf, (err, res) => {
            if(err) reject(err);
            resolve(res);
          });
        });
      });
    };

    const replyProtoBuf = binary => {
      reply(binary).type('application/x-protobuf')
        .header('Content-Type', 'application/x-protobuf')
        .header('Content-Encoding', 'deflate')
      return binary;
    };

    const setTileInCache = tile => {
      cache.setAsync(`${layername}/${z}/${x}/${y}`, tile.toString('binary'))
        .then(status => {
          console.log(['debug'], `saving binary with key ${layername}/${z}/${x}/${y}`);
        });
    };


    cache.getAsync(`${layername}/${z}/${x}/${y}`)
      .then(cachedResult => {
        if(cachedResult !== null) {
          console.log(['debug'], 'hit in cache');
          replyProtoBuf(new Buffer(cachedResult, "binary"));
        } else {
          console.log(['debug'], 'cache miss');
          const db = request.server.app.conn;
          const bbox = mercator.bbox(+x, +y, +z, false, 'WGS84' );
          db.any(query, [bbox[0], bbox[1], bbox[2], bbox[3]])
            .then(createTile)
            .then(deflateTile)
            .then(replyProtoBuf)
            .then(setTileInCache);
        }
      })
      .catch(err => {
        console.log(['error'], err);
        reply(err);
      });
  }
}; 

const parseEstado = estado => {
  const topo = estado.feature;
  const cve_ent = estado.cve_ent;
  const geometry = topojson.feature(topo, topo.objects[cve_ent]);
  return {
    type: "Feature",
    geometry: geometry.features[0].geometry,
    properties: {}
  };
};
