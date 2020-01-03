/* eslint-disable camelcase */

const tap = require('tap');
const _N = require('@wonderlandlabs/n');
const { FormatNumber } = require('num-format');
const tinygradient = require('tinygradient');
const drawHexes = require('../src/drawHexes');
const uniq = require('../src/lodash/uniq');
const shuffle = require('../src/lodash/shuffle');
const range = require('../src/lodash/range');
const sum = require('../src/lodash/sum');
const map = require('../src/lodash/map');
const { Vector2 } = require('../src/three/Vector2');

const {
  K10, B, M, B10, M10, M100, K100, K, HUN,
} = require('../src/constants');
const asserts = require('../addVectorAsserts');
// const { tens } = require('../utils');

const UNIVERSE_DIV = 300;
const SUBSECTOR_DIV = 40;
const GAL_DIV = 200;

asserts(tap);

const p = require('../package.json');
const { Universe } = require('../lib');

const uniGradient = tinygradient([
  { color: 'rgb(0,0,0)', pos: 0 },
  { color: 'rgb(137,0,83)', pos: 0.1 },
  { color: 'rgb(0,15,255)', pos: 0.2 },
  { color: 'rgb(202,255,243)', pos: 0.3 },
  { color: 'rgb(42,85,0)', pos: 0.4 },
  { color: 'rgb(255,164,0)', pos: 0.6 },
  { color: 'rgb(82,44,0)', pos: 1 },
]);

const starGradient = tinygradient([
  { color: 'rgb(0,0,0)', pos: 0 },
  { color: 'rgb(0,0,115)', pos: 0.1 },
  { color: 'rgb(106,0,184)', pos: 0.4 },
  { color: 'rgb(255,109,237)', pos: 0.55 },
  { color: 'rgb(255,184,12)', pos: 0.7 },
  { color: 'rgb(210,255,112)', pos: 0.85 },
  { color: 'rgb(89,255,67)', pos: 1 },
]);

let brackets = [
  0,
];

for (let i = 0; i < 16; ++i) {
  brackets.push(Math.floor(10 ** (i / 4)));
}

const colorOf = (n, ranges, gradient) => {
  for (let i = 0; i < ranges.length - 2; ++i) {
    if (ranges[i + 1] > n) {
      return gradient.rgbAt(i / ranges.length);
    }
  }
  return gradient.rgbAt(1);
};

brackets = uniq(brackets);

const legend = (uni, ctx) => {
  const fontSize = 20;
  ctx.font = `bold ${fontSize}px Helvetica`;
  ctx.fillStyle = 'black';
  ctx.fillText(`${uni.id} -- ${FormatNumber(uni.galaxies)} galaxies, ${FormatNumber(uni.diameter)} ly across; ${FormatNumber(Math.round(uni.diameter / uni.childDivisions))} ly/hex`,
    fontSize * 2, fontSize * 2);

  ctx.fillText(`${uni.childDivisions} hexes across, ${FormatNumber(uni.meanGalaxiesPerChild, 5)} galaxies/hex`,
    fontSize * 10, fontSize * 4);

  brackets.forEach((value, index) => {
    ctx.fillStyle = 'black';
    const text = `${FormatNumber(value)} galaxies`;
    ctx.fillText(text, fontSize * 2 + 2, fontSize * index + fontSize * 4 + 2);
    ctx.fillStyle = uniGradient.rgbAt(index / brackets.length).toRgbString();
    ctx.fillText(text, fontSize * 2, fontSize * index + fontSize * 4);
  });
};
const legendStars = (uni, ctx) => {
  const fontSize = 20;
  ctx.font = `bold ${fontSize}px Helvetica`;
  ctx.fillStyle = 'black';
  ctx.fillText(`${uni.id} -- ${FormatNumber(uni.galaxies)} galaxies, ${FormatNumber(uni.diameter)} ly across; ${FormatNumber(Math.round(uni.diameter / uni.childDivisions))} ly/hex`,
    fontSize * 2, fontSize * 2);

  ctx.fillText(`${uni.childDivisions} hexes across, ${FormatNumber(uni.meanGalaxiesPerChild, 5)} galaxies/hex`,
    fontSize * 10, fontSize * 4);

  const starBrackets = [];
  let pow = 0;
  do {
    starBrackets.push(10 ** pow);
    pow += 1;
  } while (starBrackets[starBrackets.length - 1] < uni.maxStars);

  starBrackets.forEach((value, index) => {
    ctx.fillStyle = 'black';
    const text = `${FormatNumber(value)} stars`;
    ctx.fillText(text, fontSize * 2 + 2, fontSize * index + fontSize * 4 + 2);
    ctx.fillStyle = starGradient.rgbAt(index / starBrackets.length).toRgbString();
    ctx.fillText(text, fontSize * 2, fontSize * index + fontSize * 4);
  });

  return starBrackets;
};

const makeDrawHex = (ctx, screenCoord) => (hex, color = 'black', width = 1, fill = false) => {
  ctx.lineWidth = width;
  ctx.strokeStyle = color;

  const corners = hex.corners(true).map(screenCoord);
  corners.push(corners[0]);

  ctx.beginPath();
  const firstCorner = corners[0];
  ctx.moveTo(firstCorner.x, firstCorner.y);
  corners.forEach((p2) => ctx.lineTo(p2.x, p2.y));
  ctx.closePath();
  if (fill) {
    ctx.fillStyle = fill;
    ctx.fill();
  }
  ctx.stroke();
};

const makeFillStars = (ctx, screenCoord) => (hex) => {
  const corners = hex.corners(true).map(screenCoord);
  corners.push(corners[0]);

  ctx.beginPath();
  const firstCorner = corners[0];
  ctx.moveTo(firstCorner.x, firstCorner.y);
  corners.forEach((p2) => ctx.lineTo(p2.x, p2.y));
  ctx.closePath();
  ctx.fillStyle = 'black';
  ctx.strokeStyle = 'grey';
  ctx.fill();
  ctx.stroke();
};

const makeDrawStars = (ctx, screenCoord) => (hex, starBrackets) => {
  const corners = hex.corners(true).map(screenCoord);
  corners.push(corners[0]);

  const box = hex.toBox();

  box.min = screenCoord(box.min);
  box.max = screenCoord(box.max);
  const size = box.getSize(new Vector2(0, 0));

  const radius = _N(size.x).plus(size.y).div(4)
    .value;

  const center = screenCoord(hex.absCenter);

  ctx.fillStyle = colorOf(hex.stars, starBrackets, starGradient);
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(center.x, center.y, radius, 0, 2 * Math.PI);
  ctx.closePath();
  ctx.fill();
};

const draw = (uni, out, visual_scale) => {
  const box = uni.toBox(true);
  return drawHexes({
    min_x: box.min.x * 1.1,
    min_y: box.min.y * 1.1,
    max_x: box.max.x * 1.1,
    max_y: box.max.y * 1.1,
    visual_scale,
    lpu: B,
    fn(ctx, screenCoord) {
      const drawHex = makeDrawHex(ctx, screenCoord);

      const drawStars = makeDrawStars(ctx, screenCoord);

      drawHex(uni, 'black', 2);

      uni.forEach((child) => {
        const c = colorOf(child.galaxies, brackets, uniGradient);
        drawHex(child, c, 1, c);
        if (c.s) {
          drawStars(child);
        }
      });

      // legend

      legend(uni, ctx);
    },

  }, out);
};

const drawGalaxy = (uni, out, visual_scale) => {
  const box = uni.toBox(true);
  return drawHexes({
    min_x: box.min.x * 1.1,
    min_y: box.min.y * 1.1,
    max_x: box.max.x * 1.1,
    max_y: box.max.y * 1.1,
    visual_scale,
    lpu: B,
    fn(ctx, screenCoord) {
      const drawStars = makeDrawStars(ctx, screenCoord);
      const fillStars = makeFillStars(ctx, screenCoord);

      const starBrackets = legendStars(uni, ctx);
      uni.forEach(fillStars);
      uni.forEach((hex) => drawStars(hex, starBrackets));
    },

  }, out);
};

tap.test(p.name, (suite) => {
  suite.test('Universe', (u) => {
    const uni = new Universe({ diameter: 5 * K10, galaxies: 3 * M });

    uni.makeSubsectors(100);
    uni.distributeGalaxies();
    const su = uni.sumOf(((c) => c.galaxies));

    u.same(su, uni.galaxies, 'children galaxies sum up to the total of the parent universe');

    u.test('draw', async (d) => {
      const realUni = new Universe({});
      realUni.makeSubsectors(UNIVERSE_DIV);
      realUni.distributeGalaxies();

      await draw(realUni, 'real universe', 4 * K / realUni.diameter);

      const cbg = realUni.childrenByGalaxies(false, true);

      d.test('normal sector', async (ns) => {
        const median = cbg[Math.floor(cbg.length / 2)];

        median.makeSubsectors(SUBSECTOR_DIV);
        median.distributeGalaxies();

        await draw(median, 'normal subsector', 4 * K / median.diameter);
        ns.end();
      });
      d.test('thin sector', async (ns) => {
        const thin = cbg[Math.floor(cbg.length * 0.05)];

        thin.makeSubsectors(SUBSECTOR_DIV);
        thin.distributeGalaxies();

        await draw(thin, 'thin subsector', 4 * K / thin.diameter);
        ns.end();
      });
      d.test('dense sector', async (ns) => {
        const dense = cbg[Math.floor(cbg.length * 0.95)];

        dense.makeSubsectors(SUBSECTOR_DIV);
        dense.distributeGalaxies();

        await draw(dense, 'dense subsector', 4 * K / dense.diameter);
        ns.end();
      });
      d.test('densest sector', async (ns) => {
        const densest = cbg[cbg.length - 1];

        densest.makeSubsectors(SUBSECTOR_DIV);
        densest.distributeGalaxies();

        await draw(densest, 'densest subsector', 4 * K / densest.diameter);

        const sectors = densest.childrenByGalaxies();
        const first = sectors[0];
        first.makeSubsectors(GAL_DIV);
        first.distributeStars();
        await drawGalaxy(first, 'first galaxy', 4 * K / first.diameter);

        ns.end();
      });

      d.end();
    });
    u.end();
  });


  suite.end();
});
