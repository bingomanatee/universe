/* eslint-disable camelcase */
const tap = require('tap');
const { CubeCoord } = require('@wonderlandlabs/hexagony');
const { inspect } = require('util');
const asserts = require('../addVectorAsserts');

asserts(tap);

const p = require('./../package.json');
const { GalacticContainer } = require('./../lib/index');

const THOUSAND = 1000;
const MIO = THOUSAND * THOUSAND;
tap.test(p.name, (suite) => {
  suite.test('GalacticContainer', (g) => {
    const gt = new GalacticContainer();

    g.same(gt.coord.x, 0);
    g.same(gt.coord.y, 0);
    g.same(gt.coord.z, 0);
    g.same(gt.depth, 0);

    const gt2 = new GalacticContainer({ coord: new CubeCoord(1, 3), parent: gt });
    g.same(gt2.coord.x, 1);
    g.same(gt2.coord.y, 3);
    g.same(gt2.coord.z, -4);
    g.same(gt2.depth, 1);
    g.same(gt2.parent, gt);

    g.test('props', (gp) => {
      const base = new GalacticContainer();
      const g1 = new GalacticContainer({ parent: base, division: 30, coord: new CubeCoord(2, 2) });
      const g2 = new GalacticContainer({ parent: g1, division: 100, coord: new CubeCoord(-2, 0) });
      const g3 = new GalacticContainer({ parent: g2, division: 50, coord: new CubeCoord(4, 2) });
      const g4 = new GalacticContainer({ parent: g3, division: 10, coord: new CubeCoord(2, 5) });
      const BASE_POP = 10000;
      base.set('pop', BASE_POP);
      base.set('color', 'red');
      base.set('ly-scale', MIO * 5);

      /**
       *
       * 166666.66666666666 ==±
       * 166667
       */
      gp.same(base.get('pop'), BASE_POP);

      gp.realClose(g1.get('pop'), BASE_POP / 30, 1, 'base pop at level 1');
      gp.realClose(g2.get('pop'), BASE_POP / (30 * 100), 1, 'base pop at level 2');
      gp.realClose(g3.get('pop'), BASE_POP / (30 * 100 * 50), 1);
      gp.realClose(g3.get('pop'), BASE_POP / (30 * 100 * 50), 1);
      gp.realClose(g4.get('pop'), BASE_POP / (30 * 100 * 50 * 10), 1);

      gp.same(base.get('color'), 'red');
      gp.same(g1.get('color'), 'red');
      gp.same(g2.get('color'), 'red');
      gp.same(g3.get('color'), 'red');
      gp.same(g4.get('color'), 'red');

      gp.end();
    });

    g.test('division/children', (dc) => {
      const base = new GalacticContainer();

      base.divide(3);

      base.children.forEach((sub) => {
        dc.ok(sub.x >= -3);
        dc.ok(sub.x <= 3);
        dc.ok(sub.y >= -3);
        dc.ok(sub.y <= 3);
      });

      dc.same(base.children.size, 37);

      const child = base.child('x-3y1');

      child.divide(4);

      child.do((sub) => {
        dc.ok(sub.x >= -4);
        dc.ok(sub.x <= 4);
        dc.ok(sub.y >= -4);
        dc.ok(sub.y <= 4);
      });
      // console.log('child size: ', child.children.size);

      dc.same(child.children.size, 61);

      dc.end();
    });

    g.end();
  });

  suite.end();
});
