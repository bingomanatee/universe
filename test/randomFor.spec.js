/* eslint-disable camelcase */
const tap = require('tap');

const p = require('./../package.json');
const { randomFor } = require('./../lib/index');
const range = require('./../src/lodash/range');

tap.test(p.name, (suite) => {
  suite.test('randomFor', (r) => {
    r.test('repeatability', (re) => {
      let gen = randomFor('first gen');
      const first4 = [gen(), gen(), gen(), gen()];


      re.same(first4, [
        0.9700530018065531,
        0.707819864399788,
        0.45938294312745087,
        0.9207476841219603,
      ]);

      gen = randomFor('another gen');
      const other4 = [gen(), gen(), gen(), gen()];

      re.same(other4, [0.9700530018065531, 0.707819864399788, 0.45938294312745087, 0.9207476841219603,
      ]);
      re.end();
    });

    // console.log('rands', other4.join(','));

    r.test('fast', (f) => {
      const t = Date.now();
      const gen = randomFor('first gen');
      let a;
      range(0, 1000000).forEach(() => a = gen());
      const t2 = Date.now();
      const randTime = t2 - t;

      const t3 = Date.now();

      range(0, 1000000).forEach(() => {});
      const t4 = Date.now();
      const loopTime = t4 - t3;

      const pureRandTime = (randTime - loopTime);
      console.log('pure rand time: ', pureRandTime);

      f.ok(pureRandTime < 200, 'generating randoms is < 200');
      f.end();
    });
    r.end();
  });

  suite.end();
});
