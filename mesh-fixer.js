var rasterize = require('haar-3d/rasterize-cells')
var contour = require('haar-3d/contour')
var calcNormals = require('angle-normals')
var refine = require('refine-mesh')

var createGrid = require('./lib/mesh-grid')
var projectVerts = require('./lib/project-verts')

function calcTolerance (cells, positions) {
  console.log(`calculating tolerance for ${cells.length} cells and ${positions.length} positions`);
  var avgEdge = 0

  let prevProgress = 0;
  let currentProgress = 0;

  for (var i = 0; i < cells.length; ++i) {
    var c = cells[i]
    for (var j = 0; j < 3; ++j) {
      var a = positions[c[j]]
      var b = positions[c[(j + 1) % 3]]
      var d = Math.sqrt(
        Math.pow(a[0] - b[0], 2) +
        Math.pow(a[1] - b[1], 2) +
        Math.pow(a[2] - b[2], 2))

      avgEdge += d
    }

    currentProgress = ((i / cells.length) * 100).toFixed(2);
    if (currentProgress - prevProgress > 1) {
      console.log(`Progress: ${currentProgress}%`);
    }
    prevProgress = currentProgress;
  }

  return 2 * avgEdge / (3 * cells.length)
}

module.exports = function (cells, positions, _options) {
  var options = _options || {}

  var tolerance
  if ('tolerance' in options) {
    tolerance = options.tolerance
  } else {
    tolerance = calcTolerance(cells, positions)
  }
  console.log("tolerance:", tolerance);

  var GRID_SIZE = 2 * tolerance

  console.log("starting contour");
  var mesh = contour(rasterize(cells, positions, {
    resolution: 0.5 * tolerance
  }))
  console.log("contour complete");

  console.log("creating grid");
  var grid = createGrid(cells, positions, GRID_SIZE)
  console.log("grid complete");

  console.log("calculating normals");
  mesh.normals = calcNormals(mesh.cells, mesh.positions)
  console.log("finished calculating normals");

  console.log("refining mesh");
  mesh = refine(mesh.cells, mesh.positions, mesh.normals, {
    edgeLength: 0.5 * tolerance
  })
  console.log("mesh complete");

  console.log("projecting verts");
  projectVerts(
    grid,
    positions,
    mesh.positions,
    mesh.normals,
    GRID_SIZE)
  console.log("complete");
  return mesh
}
