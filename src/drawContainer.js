/* eslint-disable camelcase */
const { CubeCoord } = require('@wonderlandlabs/hexagony');
const { createCanvas, registerFont } = require('canvas');
const _N = require('@wonderlandlabs/n');
const fs = require('fs');
const { isPoint2Like, cubeString } = require('./utils');
const { Vector2 } = require('./three/Vector2');

const lGet = require('./lodash/get');
const range = require('./lodash/range');


registerFont('Helvetica.ttf', { family: 'Helvetica' });
registerFont('Helvetica Bold.ttf', { weight: 'bold', family: 'Helvetica' });

const draw = async (sectors, config = {}, outputFilename) => {
  const UNIT = 500;
  const min_x = lGet(config, 'min_x', -UNIT);
  const min_y = lGet(config, 'min_y', -UNIT);
  const max_x = lGet(config, 'max_x', UNIT);
  const max_y = lGet(config, 'max_y', UNIT);
  const linesPerUnit = lGet(config, 'lpu', 200);
  const visual_scale = lGet(config, 'visual_scale', 1);
  const padding = lGet(config, 'padding', 15);
  const p2 = _N(padding).times(2);
  const matrix = lGet(config, 'matrix');


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

  if (!matrix) throw new Error('draw requires matrix');

  const cornerSets = sectors.map((sector) => matrix.corners(sector.coord));

  const pointMap = lGet(config, 'points');

  const minPoint = screenCoord(min_x, min_y);
  const maxPoint = screenCoord(max_x, max_y);

  const width = _N(maxPoint.x).sub(minPoint.x).plus(p2).value;
  const height = _N(maxPoint.y).sub(minPoint.y).plus(p2).value;

  let can;
  try {
    can = createCanvas(width, height);
  } catch (err) {
    console.log('error making canvas', width, height, err);
    return;
  }
  const ctx = can.getContext('2d');
  ctx.font = '14pt Helvetica';

  // background
  ctx.beginPath();
  ctx.fillStyle = 'black';
  ctx.rect(-1, -1, width + 2, height + 2);
  ctx.closePath();
  ctx.fill();

  // grid lines;
  ctx.beginPath();
  ctx.strokeStyle = 'rgba(117,173,218,0.2)';
  ctx.lineWidth = 2;
  range(min_x, max_x + 1, linesPerUnit).forEach((x) => {
    const start = screenCoord(x, min_y);
    const end = screenCoord(x, max_y);
    ctx.moveTo(...start.toArray());
    ctx.lineTo(...end.toArray());
  });

  range(min_y, max_y + 1, linesPerUnit).forEach((y) => {
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
  cornerSets.forEach((corners) => {
    ctx.beginPath();
    corners.forEach((point, i) => {
      if (i) {
        ctx.lineTo(...screenCoord(point.x, point.y).toArray());
      } else {
        ctx.moveTo(...screenCoord(point.x, point.y).toArray());
      }
    });
    const endpoint = corners[0];
    ctx.lineTo(...screenCoord(endpoint.x, endpoint.y).toArray());
    ctx.closePath();
    ctx.stroke();
  });

  const PR = 15;
  if (pointMap) {
    pointMap.forEach(({ point, label }) => {
      ctx.strokeStyle = '#993300';
      ctx.lineWidth = 1;
      const screenPt = screenCoord(point);
      const { x, y } = screenPt;
      ctx.beginPath();
      //  console.log('drawing point ', point, 'label:', label, 'at', x, y);
      ctx.moveTo(x - PR, y);
      ctx.lineTo(x + PR, y);
      ctx.moveTo(x, y - PR);
      ctx.lineTo(x, y + PR);
      ctx.closePath();
      ctx.stroke();

      ctx.fillStyle = '#009900';
      ctx.fillText(label, x + 5, y + 5);
    });
  }

  if (fn) {
    fn(ctx, screenCoord, can);
  }

  const stream = can.createPNGStream();

  const writeStream = fs.createWriteStream(`test-images/${outputFilename}.png`);
  stream.pipe(writeStream);
  let done;
  const p = new Promise((d) => {
    done = d;
  });
  writeStream.on('close', () => {
    done();
  });
  return p;
};

module.exports = draw;
