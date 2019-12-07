/* eslint-disable camelcase */

const tap = require('tap');
// const _N = require('@wonderlandlabs/n');
const { FormatNumber } = require('num-format');
const tinygradient = require('tinygradient');
const drawHexes = require('./../drawHexes');
const {
  K10, B, M, B10, M10, K100,
} = require('../src/constants');
const asserts = require('../addVectorAsserts');
// const { tens } = require('../utils');

asserts(tap);

const p = require('../package.json');
const { Universe } = require('../lib');

const gradient = tinygradient([
  { color: 'rgb(0,0,0)', pos: 0 },
  { color: 'rgb(137,0,83)', pos: 0.1 },
  { color: 'rgb(0,15,255)', pos: 0.2 },
  { color: 'rgb(202,255,243)', pos: 0.3 },
  { color: 'rgb(42,85,0)', pos: 0.6 },
  { color: 'rgb(255,164,0)', pos: 1 },
]);

const brackets = [
  0,
  1,
  5,
  10,
  20,
  50,
  100,
  200,
  500,
  10000,
  100000,
];

const draw = (uni, out, visual_scale) => {
  const box = uni.toBox(true);
  console.log('drawing ', uni.id, 'in box ', box);
  console.log('corners: ', ...uni.corners());
  console.log('...abs', ...uni.corners(true));
  return drawHexes({
    min_x: box.min.x * 1.1,
    min_y: box.min.y * 1.1,
    max_x: box.max.x * 1.1,
    max_y: box.max.y * 1.1,
    visual_scale,
    lpu: B,
    fn(ctx, screenCoord) {
      const drawHex = (hex, color = 'black', width = 1, fill = false) => {
        ctx.lineWidth = width;
        ctx.strokeStyle = color;

        const corners = hex.corners(true).map(screenCoord);
        if (hex.parent && hex.parent.parent && Math.random() > 0.99) {
          console.log('drawing ', hex.id, 'corners:', ...corners);
        }
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

      drawHex(uni, 'black', 2);

      uni.forEach((child, i) => {
        const index = brackets.filter((a) => a <= child.galaxies).length - 1;
        const grey = gradient.rgbAt(index / brackets.length).toRgbString();
        drawHex(child, grey, 1, grey);
      });

      const fontSize = 20;
      ctx.font = `bold ${fontSize}px Helvetica`;
      ctx.fillStyle = 'black';
      ctx.fillText(`${uni.id} -- ${FormatNumber(uni.galaxies)} galaxies, ${FormatNumber(uni.diameter)} ly across; ${FormatNumber(Math.round(uni.diameter / uni.childDivisions))} ly/hex`,
        fontSize * 2, fontSize * 2);

      ctx.fillText(`${uni.childDivisions} hexes across, ${FormatNumber(uni.meanGalaxiesPerChild)} galaxies/hex`,
        fontSize * 10, fontSize * 4);

      brackets.forEach((value, index) => {
        ctx.fillStyle = 'black';
        ctx.fillText(`${value} galaxies`, fontSize * 2 + 2, fontSize * index + fontSize * 4 + 2);
        ctx.fillStyle = gradient.rgbAt(index / brackets.length).toRgbString();
        ctx.fillText(`${FormatNumber(value)} galaxies`, fontSize * 2, fontSize * index + fontSize * 4);
      });
    },

  }, out);
};

tap.test(p.name, (suite) => {
  suite.test('Universe', (u) => {
    const uni = new Universe({ diameter: 5 * K10, galaxies: 3 * M });

    uni.makeSubsectors(500);
    const sum = uni.sumOf(((c) => c.galaxies));

    u.same(sum, uni.galaxies, 'children galaxies sum up to the total of the parent universe');

    u.test('draw', async (d) => {
      const realUni = new Universe({});
      realUni.makeSubsectors(250);

      await draw(realUni, 'real universe', 0.5 / M10);

      const cbg = realUni.childrenByGalaxies(false, true);

      const median = cbg[Math.floor(cbg.length / 2)];

      median.makeSubsectors(50);

      await draw(median, 'normal subsector', 0.2 / K10);

      d.end();
    });
    u.end();
  });


  suite.end();
});
