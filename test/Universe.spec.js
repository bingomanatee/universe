/* eslint-disable camelcase */
const tap = require('tap');

const { Hexes, CubeCoord } = require('@wonderlandlabs/hexagony');
const Qty = require('js-quantities');
const p = require('./../package.json');
const { Universe } = require('./../lib/index');
const draw = require('../drawContainer');
const { point2stringI, BIL } = require('../utils');
const sortBy = require('./../src/lodash/sortBy');
const asserts = require('../addVectorAsserts');
const map = require('../src/lodash/map');

const {
  drawDiscs, labelPoints, tellChildIDs, labelSectorQty, legend,
} = require('./../drawUtils');

asserts(tap);

const UNIVERSE_DIV = 150;
const SECTOR_DIV = 50;
const SUBSECTOR_DIV = 50;
const HEX_SCALE = 40;
const U_GALAXIES = 5 * BIL;
const U_DIAMETER = 100 * BIL;

const makeUni = () => new Universe({
  seed: 'test',
  galaxies: U_GALAXIES,
  diameter: U_DIAMETER,
});

function getChildBySize(target, fr) {
  const sortedPopulatedKids = target.byGalaxies();
  return sortedPopulatedKids[Math.round(sortedPopulatedKids.length * fr)];
}

async function drawSector(sector, hexScale = 6, name = 'sector') {
  const visualScale = 1;
  const matrixScale = 6;
  const K = 1 / 5;
  const matrix = new Hexes({ scale: hexScale, pointy: true });
  const hexes = sector.childDivisions;
  const width = hexScale * matrixScale * hexes * K;
  const height = hexScale * matrixScale * hexes * 0.9 * K;

  console.log('------- drawing: ', name);
  console.log('          width: ', width);
  console.log('         height: ', height);
  console.log('         diameter:', sector.get('diameter'));
  console.log('         galaxies:', sector.galaxies);

  try {
    await draw(Array.from(sector.children.values()), {
      min_x: -width / 2,
      min_y: -height / 2,
      max_x: width / 2,
      max_y: height / 2,
      visual_scale: visualScale,
      matrix,
      fn(ctx, screenPoint, canvas) {
        drawDiscs(sector, ctx, screenPoint, matrix);
        labelSectorQty(sector, ctx, screenPoint, matrix);
        labelPoints(sector, ctx, screenPoint, matrix, 20);
        legend(ctx, sector, canvas);
      },
    }, `${name}-${sector.id}`);
  } catch (err) {
    console.log('error in : ', name, sector.id, err);
  }
}


tap.test(p.name, (suite) => {
  suite.test('Universe', (u) => {
    u.test('drawing sectors', (dr) => {
      dr.test('universe', async (r) => {
        const uni = makeUni();
        uni.generateSectors(UNIVERSE_DIV);

        await drawSector(uni, HEX_SCALE * 0.8, 'universe');

        r.end();
      });

      dr.test('subsector-normal', async (rs) => {
        const uni = new Universe('test');
        uni.generateSectors(UNIVERSE_DIV);

        const child = getChildBySize(uni, 0.5);

        child.generateSectors();

        await drawSector(child, HEX_SCALE, 'subsector-normal');

        rs.end();
      });

      dr.test('sub-sub-sectors', async (rs) => {
        const uni = makeUni();
        uni.generateSectors(UNIVERSE_DIV);


        const child = getChildBySize(uni, 0.5);

        console.log('---- child: ', child.galaxies);

        child.generateSectors();

        const subChild = getChildBySize(child, 0.5);
        console.log('---- subchild: ', subChild.galaxies);
        subChild.do((c) => {
          if (c.galaxies) console.log('uni subChild of ', subChild.id, subChild.galaxies, ' sector', c.id, c.galaxies, 'galaxies');
        });

        subChild.generateSectors();

        await drawSector(subChild, HEX_SCALE * 2, 'sub-subsector-normal');

        rs.end();
      });

      dr.test('subsectors - larger', async (rs) => {
        const uni = makeUni();
        uni.generateSectors(UNIVERSE_DIV);

        const child = getChildBySize(uni, 0.75);

        child.generateSectors();

        await drawSector(child, HEX_SCALE, 'subsector-larger');

        rs.end();
      });

      dr.test('sub-sub-sectors - larger', async (rs) => {
        const uni = makeUni();
        uni.generateSectors(UNIVERSE_DIV);

        const child = getChildBySize(uni, 0.75);

        child.generateSectors();

        const subChild = getChildBySize(child, 0.75);

        subChild.generateSectors();

        await drawSector(subChild, HEX_SCALE * 2, 'sub-subsector-larger');

        rs.end();
      });

      dr.test('subsectors - largest', async (rs) => {
        const uni = makeUni();
        uni.generateSectors(UNIVERSE_DIV);

        const child = getChildBySize(uni, 0.95);

        child.generateSectors();

        await drawSector(child, HEX_SCALE, 'subsector-largest');

        rs.end();
      });

      dr.test('sub-sub-sectors - largest', async (rs) => {
        const uni = makeUni();
        uni.generateSectors(UNIVERSE_DIV);

        const child = getChildBySize(uni, 0.95);

        child.generateSectors();

        const subChild = getChildBySize(child, 0.95);

        subChild.generateSectors();

        await drawSector(subChild, HEX_SCALE * 2, 'sub-subsector-largest');

        rs.end();
      });

      dr.test('subsectors - smaller', async (rs) => {
        const uni = makeUni();
        uni.generateSectors(UNIVERSE_DIV);

        const child = getChildBySize(uni, 0.25);

        child.generateSectors();

        await drawSector(child, HEX_SCALE, 'subsector-smaller');

        rs.end();
      });

      dr.test('sub-sub-sectors - smaller', async (rs) => {
        const uni = makeUni();
        uni.generateSectors(UNIVERSE_DIV);

        const child = getChildBySize(uni, 0.25);

        child.generateSectors();

        const subChild = getChildBySize(child, 0.25);

        subChild.generateSectors();

        await drawSector(subChild, HEX_SCALE * 2, 'sub-subsector-smaller');

        rs.end();
      });

      dr.test('subsectors - smallest', async (rs) => {
        const uni = makeUni();
        uni.generateSectors(UNIVERSE_DIV);

        const child = getChildBySize(uni, 0.1);

        child.generateSectors();

        await drawSector(child, HEX_SCALE, 'subsector-smallest');

        rs.end();
      });

      dr.test('sub-sub-sectors - smallest', async (rs) => {
        const uni = makeUni();
        uni.generateSectors(UNIVERSE_DIV);

        const child = getChildBySize(uni, 0.1);

        child.generateSectors();

        const subChild = getChildBySize(child, 0.1);

        subChild.generateSectors();

        await drawSector(subChild, HEX_SCALE * 2, 'sub-subsector-smallest');

        rs.end();
      });

      dr.end();
    });

    u.test('distribution', (di) => {
      di.test('small universe', (su) => {
        const uni = new Universe({
          seed: 'test',
          galaxies: 10000,
          diameter: 5000,
        });

        uni.generateSectors(10);
        su.same(uni.galaxies, uni.sumOfGalaxies(), 'universe has the right number of galaxies');
        su.same(uni.galaxies, 10000, 'universe has the right number of galaxies');

        const first = Array.from(uni.children.values())[0];

        su.same(first.get('diameter'), 250, 'diameter is fraction of original');

        first.generateSectors(10);

        const firstSub = Array.from(first.children.values())[0];

        su.same(firstSub.get('diameter'), 5, 'subsector is fraction of sector');

        su.end();
      });

      di.test('real universe', (su) => {
        const uni = new Universe({
          seed: 'test',
        });

        uni.generateSectors(UNIVERSE_DIV);

        su.same(uni.galaxies, uni.sumOfGalaxies(), 'universe has the right number of galaxies');
        su.end();
      });

      di.end();
    });

    u.end();
  });

  suite.end();
});
