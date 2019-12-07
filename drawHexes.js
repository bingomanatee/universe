/* eslint-disable camelcase */
const { CubeCoord } = require('@wonderlandlabs/hexagony');
const { createCanvas, registerFont } = require('canvas');
const _N = require('@wonderlandlabs/n');
const fs = require('fs');
const { isPoint2Like, cubeString } = require('./utils');
const { Vector2 } = require('./src/three/Vector2');

const lGet = require('./src/lodash/get');
const range = require('./src/lodash/range');


registerFont('Helvetica.ttf', { family: 'Helvetica' });
registerFont('Helvetica Bold.ttf', { weight: 'bold', family: 'Helvetica' });

const draw = async (config = {}, outputFilename) => {
  const UNIT = 500;
  const min_x = lGet(config, 'min_x', -UNIT);
  const min_y = lGet(config, 'min_y', -UNIT);
  const max_x = lGet(config, 'max_x', UNIT);
  const max_y = lGet(config, 'max_y', UNIT);
  const linesPerUnit = lGet(config, 'lpu', 10);
  const visual_scale = lGet(config, 'visual_scale', 1);
  const padding = lGet(config, 'padding', 15);
  const p2 = _N(padding).times(2);

  const fn = lGet(config, 'fn');

  const screenCoord = (x, y) => {
    if (isPoint2Like(x)) {
      return screenCoord(x.x, x.y);
    }
    return new Vector2(
      _N(x).sub(min_x).times(visual_scale).plus(padding).value,
      _N(y).sub(min_y).times(visual_scale).plus(padding).value,
    );
  };

  const minPoint = screenCoord(min_x, min_y);
  const maxPoint = screenCoord(max_x, max_y);

  const width = _N(maxPoint.x).sub(minPoint.x).plus(p2).value;
  const height = _N(maxPoint.y).sub(minPoint.y).plus(p2).value;

  console.log('drawing hexes -- ', outputFilename, width, 'x', height);

  let can;
  try {
    can = createCanvas(width, height);
  } catch (err) {
    console.log('error making canvas', width, height, err);
    return;
  }
  const ctx = can.getContext('2d');

  // background
  ctx.beginPath();
  ctx.fillStyle = 'white';
  ctx.rect(-1, -1, width + 2, height + 2);
  ctx.closePath();
  ctx.fill();

  // grid lines;
  ctx.beginPath();
  ctx.strokeStyle = 'rgba(117,173,218,0.2)';
  ctx.lineWidth = 1;
  range(0, max_x + 1, linesPerUnit).concat(range(0, min_x - 1, -linesPerUnit)).forEach((x) => {
    const start = screenCoord(x, min_y);
    const end = screenCoord(x, max_y);
    ctx.moveTo(...start.toArray());
    ctx.lineTo(...end.toArray());
  });

  range(0, max_y + 1, linesPerUnit).concat(range(0, min_y - 1, -linesPerUnit)).forEach((y) => {
    const start = screenCoord(min_x, y);
    const end = screenCoord(max_x, y);
    ctx.moveTo(...start.toArray());
    ctx.lineTo(...end.toArray());
  });
  ctx.closePath();
  ctx.stroke();

  ctx.lineWidth = 10;
  ctx.strokeStyle = 'rgba(122,4,23,0.75)';
  ctx.beginPath();
  ctx.moveTo(...screenCoord(min_x, 0).toArray());
  ctx.lineTo(...screenCoord(max_x, 0).toArray());
  ctx.moveTo(...screenCoord(0, min_y).toArray());
  ctx.lineTo(...screenCoord(0, max_y).toArray());
  ctx.closePath();
  ctx.stroke();

  ctx.strokeStyle = 'rgba(172,255,201,0.11)';
  ctx.lineWidth = 1;

  if (fn) {
    console.log('starting function');
    fn(ctx, screenCoord, can);
    console.log('done with function');
  }

  const stream = can.createPNGStream();

  const writeStream = fs.createWriteStream(`test-images/${outputFilename}.png`);
  stream.pipe(writeStream);
  let done;
  const p = new Promise((d) => {
    done = d;
  });
  const dt = Date.now();
  writeStream.on('close', () => {
    console.log('writeStream done writing', outputFilename);
    console.log(((Date.now() - dt) / 1000).toFixed(1), 'seconds');
    done();
  });
  return p;
};

module.exports = draw;
