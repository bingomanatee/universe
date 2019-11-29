/* eslint-disable camelcase */
const tap = require('tap');

const { Hexes, CubeCoord } = require('@wonderlandlabs/hexagony');
const p = require('./../package.json');
const { Universe } = require('./../lib/index');
const draw = require('../drawContainer');

const {
  drawDiscs, labelPoints, tellChildIDs, labelSectorQty,
} = require('./../drawUtils');

tap.test(p.name, (suite) => {
  suite.test('Universe', (u) => {
    u.test('render', { timeout: 500000 }, async (r) => {
      const uni = new Universe('test');
      uni.generateSectors(100);
      const matrix = new Hexes({ scale: 10, pointy: true });
      const visual_scale = 8;

      try {
        await draw(Array.from(uni.children.values()), {
          min_x: -1000,
          min_y: -800,
          visual_scale,
          max_x: 1000,
          max_y: 800,
          matrix,
          fn(ctx, screenPoint) {
            drawDiscs(uni, ctx, screenPoint, matrix, 'rgba(9,37,11,0.9)');
            labelSectorQty(uni, ctx, screenPoint, matrix);
            labelPoints(uni, ctx, screenPoint, matrix, 3);
          },
        }, 'universe');
      } catch (err) {
        console.log('error in render universe:', err);
      }

      // 205,162,994,999
      const gCount = uni.sumOf('galaxies', true);
      r.ok(gCount > 100000000000, 'universe is not too small');
      r.ok(gCount < 1000000000000, 'universe is not too big');
      r.end();
    });

    u.test('subsectors', { timeout: 500000 }, async (rs) => {
      const uni = new Universe('test');
      uni.generateSectors(100);

      const matrix = new Hexes({ scale: 6, pointy: true });

      const child = uni.children.get('x-6y0d201');

      child.makeSubsectors(200);

      const visual_scale = 6;

      try {
        await draw(Array.from(child.children.values()), {
          min_x: -1200,
          min_y: -900,
          max_x: 1200,
          max_y: 900,
          visual_scale,
          matrix,
          fn(ctx, screenPoint) {
            drawDiscs(child, ctx, screenPoint, matrix);
            labelSectorQty(child, ctx, screenPoint, matrix);
            labelPoints(child, ctx, screenPoint, matrix, 5);
          },
        }, `subsector-${child.id}`);
      } catch (err) {
        console.log('error in subsectors: ', err);
      }

      rs.end();
    });

    u.test('sub-sub-sectors', { timeout: 500000 }, async (rs) => {
      const uni = new Universe('test');
      uni.generateSectors(100);

      const matrix = new Hexes({ scale: 10, pointy: true });

      const child = uni.children.get('x-6y0d201');

      child.makeSubsectors(200);

      const subChild = child.children.get('x5y-15d401');

      subChild.makeSubsectors(50);
      const visual_scale = 4;

/*      subChild.do((c) => {
        if (c.get('galaxies') > 0) console.log(c.id, ':', c.get('galaxies'), 'galaxies');
      });*/

      try {
        await draw(Array.from(subChild.children.values()), {
          min_x: -800,
          min_y: -600,
          max_x: 800,
          max_y: 600,
          visual_scale,
          matrix,
          fn(ctx, screenPoint) {
            drawDiscs(subChild, ctx, screenPoint, matrix, 'rgba(51,0,79,0.8)');
            labelSectorQty(subChild, ctx, screenPoint, matrix, true);
            // labelPoints(subChild, ctx, screenPoint, matrix, 5);
          },
        }, `sub-sub-sector_-${subChild.id}`);
      } catch (err) {
        console.log('error in subsectors: ', err);
      }

      rs.end();
    });

    u.end();
  });

  suite.end();
});
