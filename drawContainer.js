/* eslint-disable camelcase */

const { createCanvas } = require('canvas');
const _N = require('@wonderlandlabs/n');
const fs = require('fs');
const { isPoint2Like, cubeString } = require('./utils');
const { Vector2 } = require('./src/three/Vector2');

const lGet = require('./src/lodash/get');
const range = require('./src/lodash/range');

const draw = async (sectors, config = {}, outputFilename) => {
  const UNIT = 500;
  const min_x = lGet(config, 'min_x', -UNIT);
  const min_y = lGet(config, 'min_y', -UNIT * 0.8);
  const max_x = lGet(config, 'max_x', UNIT);
  const max_y = lGet(config, 'max_y', UNIT * 0.8);
  const linesPerUnit = lGet(config, 'lpu', 10);
  const visual_scale = lGet(config, 'visual_scale', 5);
  const padding = lGet(config, 'padding', 5);
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

  console.log('min_x', min_x, 'max_x', max_x, minPoint, maxPoint);

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
  ctx.fillStyle = '#FFFFFF';
  ctx.rect(-1, -1, width + 2, height + 2);
  ctx.closePath();
  ctx.fill();

  // horionTAL lines;
  ctx.beginPath();
  ctx.strokeStyle = '#75adda';
  ctx.lineWidth = 1;
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

  ctx.strokeStyle = '#FF0000';
  ctx.beginPath();
  ctx.moveTo(...screenCoord(min_x, 0).toArray());
  ctx.lineTo(...screenCoord(max_x, 0).toArray());
  ctx.moveTo(...screenCoord(0, min_y).toArray());
  ctx.lineTo(...screenCoord(0, max_y).toArray());
  ctx.closePath();
  ctx.stroke();

  ctx.strokeStyle = '#4d785c';
  ctx.lineWidth = 2;
  ctx.beginPath();
  cornerSets.forEach((corners) => {
    corners.forEach((point, i) => {
      if (i) {
        ctx.lineTo(...screenCoord(point.x, point.y).toArray());
      } else {
        ctx.moveTo(...screenCoord(point.x, point.y).toArray());
      }
    });
    ctx.lineTo(...screenCoord(corners[0].x, corners[0].y).toArray());
  });
  ctx.closePath();
  ctx.stroke();

  ctx.fillStyle = '#0000FF';
  cornerSets.forEach((corners) => {
    if (corners.cube) {
      const label = cubeString(corners.cube);
      const center = screenCoord(corners.cubeCenter);
      ctx.fillText(label, center.x, center.y);
    }
  });


  const PR = 15;
  if (pointMap) {
    ctx.beginPath();
    pointMap.forEach(({ point, label }) => {
      ctx.strokeStyle = '#993300';
      ctx.lineWidth = 1;
      const screenPt = screenCoord(point);
      const { x, y } = screenPt;
      //  console.log('drawing point ', point, 'label:', label, 'at', x, y);
      ctx.moveTo(x - PR, y);
      ctx.lineTo(x + PR, y);
      ctx.moveTo(x, y - PR);
      ctx.lineTo(x, y + PR);

      ctx.fillStyle = '#009900';
      ctx.fillText(label, x + 5, y + 5);
    });
    ctx.closePath();
    ctx.stroke();
  }

  if (fn) {
    fn(ctx, screenCoord);
  }

  return can.createPNGStream().pipe(fs.createWriteStream(`${outputFilename}.png`));
};

module.exports = draw;
