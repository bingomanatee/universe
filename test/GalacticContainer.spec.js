/* eslint-disable camelcase */
const tap = require('tap');
const { CubeCoord } = require('@wonderlandlabs/hexagony');
const { inspect } = require('util');

const p = require('./../package.json');
const { GalacticContainer, randomFor } = require('./../lib/index');

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
      base.set('title-size', ['24px', '18px', '12px']);
      base.set('ly-scale', MIO * 5, 'light-year');

      gp.same(base.get('pop'), BASE_POP);
      gp.same(g1.get('pop'), BASE_POP / 30);
      gp.same(g2.get('pop'), BASE_POP / (30 * 100));
      gp.same(g3.get('pop'), BASE_POP / (30 * 100 * 50));
      gp.same(g3.get('pop'), BASE_POP / (30 * 100 * 50));
      gp.same(g4.get('pop'), BASE_POP / (30 * 100 * 50 * 10));

      gp.same(base.get('color'), 'red');
      gp.same(g1.get('color'), 'red');
      gp.same(g2.get('color'), 'red');
      gp.same(g3.get('color'), 'red');
      gp.same(g4.get('color'), 'red');

      gp.same(base.get('title-size'), '24px');
      gp.same(g1.get('title-size'), '18px');
      gp.same(g2.get('title-size'), '12px');
      gp.same(g3.get('title-size'), '12px');
      gp.same(g4.get('title-size'), '12px');

      g.same(base.get('ly-scale').toString(), '5000000 ly');
      g.same(g1.get('ly-scale').toPrec(1).toString(), '166667 ly');
      g.same(g2.get('ly-scale').toPrec(1).toString(), '1667 ly');
      g.same(g3.get('ly-scale').toPrec(1).toString(), '33 ly');
      g.same(g4.get('ly-scale').toPrec(1).toString(), '3 ly');

      gp.end();
    });

    g.test('division/children', (dc) => {
      const base = new GalacticContainer();

      base.divide(3);
      /*      const childrenKeys = Array.from(base.children.keys());
   //  console.log('children keys:', childrenKeys.join(' '));
      dc.same(childrenKeys, ['-3.0.3/7 -3.1.2/7 -3.2.1/7 -3.3.0/7 -2.-1.3/7 -2.0.2/7 -2.1.1/7 -2.2.0/7 -2.3.-1/7 ',
        '-1.-2.3/7 -1.-1.2/7 -1.0.1/7 -1.1.0/7 -1.2.-1/7 -1.3.-2/7 0.-3.3/7 0.-2.2/7 0.-1.1/7 0.0.0/7 0.1.-1/7 ',
        '0.2.-2/7 0.3.-3/7 1.-3.2/7 1.-2.1/7 1.-1.0/7 1.0.-1/7 1.1.-2/7 1.2.-3/7 2.-3.1/7 2.-2.0/7 2.-1.-1/7 ',
        '2.0.-2/7 2.1.-3/7 3.-3.0/7 3.-2.-1/7 3.-1.-2/7 3.0.-3/7']
        .join('').split(' ')); */

      base.children.forEach((sub) => {
        dc.ok(sub.x >= -3);
        dc.ok(sub.x <= 3);
        dc.ok(sub.y >= -3);
        dc.ok(sub.y <= 3);
      });

      dc.same(base.children.size, 37);

      // console.log('base size: ', base.children.size);

      const child = base.child('-3.1.2/7');

      child.divide(4);
      /*
        const subChildKeys = Array.from(child.children.keys());

        //  console.log('children 2 keys:', subChildKeys.join(' '));

        dc.same(subChildKeys, ['-7.1.6/9 -7.2.5/9 -7.3.4/9 -7.4.3/9 -7.5.2/9 -6.0.6/9 -6.1.5/9 -6.2.4/9 -6.3.3/9',
          ' -6.4.2/9 -6.5.1/9 -5.-1.6/9 -5.0.5/9 -5.1.4/9 -5.2.3/9 -5.3.2/9 -5.4.1/9 -5.5.0/9 -4.-2.6/9 -4.-1.5/9',
          ' -4.0.4/9 -4.1.3/9 -4.2.2/9 -4.3.1/9 -4.4.0/9 -4.5.-1/9 -3.-3.6/9 -3.-2.5/9 -3.-1.4/9 -3.0.3/9 -3.1.2/9',
          ' -3.2.1/9 -3.3.0/9 -3.4.-1/9 -3.5.-2/9 -2.-3.5/9 -2.-2.4/9 -2.-1.3/9 -2.0.2/9 -2.1.1/9 -2.2.0/9',
          ' -2.3.-1/9 -2.4.-2/9 -1.-3.4/9 -1.-2.3/9 -1.-1.2/9 -1.0.1/9 -1.1.0/9 -1.2.-1/9 -1.3.-2/9 0.-3.3/9',
          ' 0.-2.2/9 0.-1.1/9 0.0.0/9 0.1.-1/9 0.2.-2/9 1.-3.2/9 1.-2.1/9 1.-1.0/9 1.0.-1/9 1.1.-2/9']
          .join('').split(' ')); */

      child.children.forEach((sub) => {
        dc.ok(sub.x >= -7);
        dc.ok(sub.x <= 1);
        dc.ok(sub.y >= -3);
        dc.ok(sub.y <= 5);
      });
      // console.log('child size: ', child.children.size);

      dc.same(child.children.size, 61);

      dc.end();
    });

    g.end();
  });

  suite.end();
});
