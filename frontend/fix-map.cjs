const fs = require('fs');
const topojson = require('topojson-client');
const rewind = require('@turf/rewind').default;

const topology = JSON.parse(fs.readFileSync('public/india-states.topo.json', 'utf8'));

// Highcharts topodata is usually under objects.default
const geojson = topojson.feature(topology, topology.objects.default);

// D3 requires the exterior ring to be counter-clockwise!
const rewound = rewind(geojson, { reverse: true });

fs.writeFileSync('public/india-states.geojson', JSON.stringify(rewound));
console.log('Rewound GeoJSON saved to public/india-states.geojson');
