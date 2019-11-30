/* eslint-disable camelcase */
const tap = require('tap');

const { Hexes, CubeCoord } = require('@wonderlandlabs/hexagony');
const Qty = require('js-quantities');
const p = require('./../package.json');
const { Universe } = require('./../lib/index');
const draw = require('../drawContainer');
const { point2stringI } = require('../utils');

const {
  drawDiscs, labelPoints, tellChildIDs, labelSectorQty,
} = require('./../drawUtils');

tap.test(p.name, (suite) => {
  suite.test('Universe', (u) => {
    u.test('drawing sectors', (dr) => {
      dr.test('universe', { timeout: 500000 }, async (r) => {
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

      dr.test('subsectors', { timeout: 500000 }, async (rs) => {
        const uni = new Universe('test');
        uni.generateSectors(100);

        const matrix = new Hexes({ scale: 6, pointy: true });

        const child = uni.children.get('x-3y-9d201');

        console.log('=========== sub - sectors', child.id, Qty(child.get('galaxies')).toPrec(1000000).toString(), 'galaxies');
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

      dr.test('subsectors - larger', { timeout: 500000 }, async (rs) => {
        const uni = new Universe('test');
        uni.generateSectors(100);

        const matrix = new Hexes({ scale: 6, pointy: true });

        const child = uni.children.get('x3y-6d201');

        console.log('=============== sub - sub- sectors - larger', child.id, Qty(child.get('galaxies')).toPrec(1000000).toString(), 'galaxies');

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

      dr.test('sub-sub-sectors', { timeout: 500000 }, async (rs) => {
        const uni = new Universe('test');
        uni.generateSectors(100);

        const matrix = new Hexes({ scale: 10, pointy: true });

        const child = uni.children.get('x-3y-9d201');

        child.makeSubsectors(200);

        const subChild = child.children.get('x0y-10d401');

        console.log('=============== sub - sub - sectors', subChild.id, Qty(subChild.get('galaxies')).toPrec(10).toString(), 'galaxies');

        subChild.makeSubsectors(50);
        const visual_scale = 4;

        /*      subChild.do((c) => {
                if (c.get('galaxies') > 0) console.log(c.id, ':', c.get('galaxies'), 'galaxies');
              }); */

        try {
          await draw(Array.from(subChild.children.values()), {
            min_x: -600,
            min_y: -400,
            max_x: 600,
            max_y: 400,
            visual_scale,
            matrix,
            fn(ctx, screenPoint) {
              drawDiscs(subChild, ctx, screenPoint, matrix, 'rgba(51,0,79,0.8)');
              labelSectorQty(subChild, ctx, screenPoint, matrix, true);
               labelPoints(subChild, ctx, screenPoint, matrix, 5);
            },
          }, `sub-sub-sector_-${subChild.id}`);
        } catch (err) {
          console.log('error in subsectors: ', err);
        }

        rs.end();
      });

      dr.test('sub-sub-sectors - larger', { timeout: 500000 }, async (rs) => {
        const uni = new Universe('test');
        uni.generateSectors(100);

        const matrix = new Hexes({ scale: 10, pointy: true });

        const child = uni.children.get('x3y-6d201');

        child.makeSubsectors(200);

        const subChild = child.children.get('x12y-1d401');

        console.log('=============== sub- sub - sectors - larger', subChild.id, Qty(subChild.get('galaxies')).toPrec(10).toString(), 'galaxies');

        subChild.makeSubsectors(50);
        const visual_scale = 4;

        /*      subChild.do((c) => {
                if (c.get('galaxies') > 0) console.log(c.id, ':', c.get('galaxies'), 'galaxies');
              }); */

        try {
          await draw(Array.from(subChild.children.values()), {
            min_x: -600,
            min_y: -400,
            max_x: 600,
            max_y: 400,
            visual_scale,
            matrix,
            fn(ctx, screenPoint) {
              drawDiscs(subChild, ctx, screenPoint, matrix, 'rgba(51,0,79,0.8)');
              labelSectorQty(subChild, ctx, screenPoint, matrix, true);
              labelPoints(subChild, ctx, screenPoint, matrix, 5);
            },
          }, `sub-sub-sector_-${subChild.id}`);
        } catch (err) {
          console.log('error in subsectors: ', err);
        }

        rs.end();
      });

      dr.end();
    });

    u.test('coordinates', (co) => {
      const uni = new Universe();

      uni.generateSectors(2);

      uni.do((s) => {
        console.log('sector id:', s.id, 'ly-coord:', point2stringI(s.get('lyCoord').clone().multiplyScalar(1 / 100000000)));
      });

      const sub = uni.children.get('x2y-1d5');

      console.log('------------ sub extracted: ', point2stringI(sub.get('lyCoord').clone().multiplyScalar(1 / 100000000)));

      sub.makeSubsectors(2);

      sub.do((s) => {
        console.log(sub.id, 'child:', s.id, 'ly-coord:', point2stringI(s.get('lyCoord').clone().multiplyScalar(1 / 100000000)));
      });

      co.end();
    });

    u.end();
  });

  suite.end();
});
