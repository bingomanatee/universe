
const { CubeCoord } = require('@wonderlandlabs/hexagony');
// eslint-disable-next-line import/no-extraneous-dependencies
const { FormatNumber } = require('num-format');
const mean = require('./src/lodash/mean');
const sortBy = require('./src/lodash/sortBy');
const lGet = require('./src/lodash/get');
const {
  colorOf, tens, MIO, THOU, brackets,
} = require('./utils');

function tellChildIDs(item, max = 10, name = 'target') {
  let count = max;
  Array.from(item.children.keys()).forEach((key) => {
    if (count < 1) return;
    if (/^x-10/.test(key)) {
      console.log(`child of ${name} key: [${key}]`);
      count -= 1;
    }
  });
}

function labelPoints(child, ctx, screenPoint, matrix, increment) {
  ctx.font = '12pt Helvetica';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  child.do((subChild) => {
    const x = Math.abs(subChild.x);
    const y = Math.abs(subChild.y);
    if (!((x % increment) || (y % increment))) {
      const labelPoint = screenPoint(subChild.coord.toXY(matrix));

      ctx.fillStyle = 'rgba(255,204,0,0.9)';
      ctx.beginPath();
      ctx.arc(labelPoint.x, labelPoint.y, 6, 0, 2 * Math.PI);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = 'rgba(255,255,255,0.82)';
      ctx.fillText(subChild.localId, labelPoint.x, labelPoint.y);
    }
  });
}

function drawDiscs(child, ctx, screenPoint, matrix, color) {
  ctx.lineWidth = 1;

  const origin = new CubeCoord(0, 0);
  const offset = new CubeCoord(1, 0);

  const oPt = origin.toXY(matrix);
  const offPt = offset.toXY(matrix);
  const HEX_RADIUS = screenPoint(oPt).distanceTo(screenPoint(offPt)) / 2;
  const SMALL_COUNT = 5;


  /* ------------ PUT X on tiny clumps ----------- */

  console.log('--drawing +');
  child.do((sector) => {
    ctx.strokeStyle = 'rgba(176,105,255,0.5)';
    ctx.lineWidth = 2;
    const galaxies = sector.getLocal('galaxies');
    const center = sector.coord.toXY(matrix);
    const screenCenter = screenPoint(center);

    const X_RADIUS = Math.max(HEX_RADIUS / 2, 3);

    if ((galaxies > 0) && (galaxies < SMALL_COUNT)) {
      ctx.beginPath();
      ctx.moveTo(screenCenter.x - X_RADIUS, screenCenter.y - X_RADIUS);
      ctx.lineTo(screenCenter.x + X_RADIUS, screenCenter.y + X_RADIUS);
      ctx.moveTo(screenCenter.x + X_RADIUS, screenCenter.y - X_RADIUS);
      ctx.lineTo(screenCenter.x - X_RADIUS, screenCenter.y + X_RADIUS);
      ctx.closePath();
      ctx.stroke();
    }
    ctx.lineWidth = 1;
  });

  /* ------------ DETERMINE THE "Typical" count of galaxies ----------- */

  console.log('--drawing dots');
  // draw a dot sized relative to the typical size.
  child.do((sector) => {
    if (sector.galaxies < SMALL_COUNT) return;

    const radius = HEX_RADIUS;
    const center = sector.coord.toXY(matrix);
    const screenCenter = screenPoint(center);

    ctx.fillStyle = colorOf(sector.galaxies);
    ctx.beginPath();
    ctx.arc(screenCenter.x, screenCenter.y, Math.min(radius, HEX_RADIUS), 0, 2 * Math.PI);
    ctx.closePath();
    ctx.fill();
  });

  /* ------------------- DRAW CIRCLES AROUND REALLY BIG ONES ---------------

  console.log('--drawing circles');
  ctx.lineWidth = 2;

  child.do((sector) => {
    if (sector.galaxies < 10) return;
    const radius = getRadius(sector);
    const center = sector.coord.toXY(matrix);
    const screenCenter = screenPoint(center);

    if (radius > HEX_RADIUS) {
      ctx.strokeStyle = colorOf(sector.galaxies);
      ctx.beginPath();
      ctx.arc(screenCenter.x, screenCenter.y, radius, 0, 2 * Math.PI);
      ctx.closePath();
      ctx.stroke();
    }
  }); */
}

const digit = (n, large) => {
  if (large) return (n > 10) ? Math.round(n) : n.toFixed(1);
  return ((n > 10) ? Math.round(n) : n);
};

const CLEAR_BG = 'rgba(255,255,255,0.5)';

function labelSectorQty(child, ctx, screenPoint, matrix, fract = false) {
  ctx.font = 'bold 8pt Helvetica';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  child.do((sector) => {
    const galaxies = sector.getLocal('galaxies');
    if (galaxies <= 0) return;
    if ((!fract) && (galaxies < 1)) return;

    const center = sector.coord.toXY(matrix);
    const screenCenter = screenPoint(center);

    const mio = (galaxies / MIO);
    const k = (galaxies / THOU);
    if (mio >= 1) {
      ctx.fillStyle = 'rgba(153,0,51,0.8)';
      ctx.fillText(`${digit(mio, true)}m`, screenCenter.x, screenCenter.y);
    } else if (k >= 1) {
      ctx.fillStyle = 'rgba(100,130,120,0.8)';
      ctx.fillText(`${digit(k)}k`, screenCenter.x, screenCenter.y);
    }
  });
}

function formatQ(q) {
  return q.toPrec(1).format((value, unit) => `${FormatNumber(value, 0)} ${unit}`);
}

function legend(ctx, target, canvas) {
  const height = lGet(canvas, 'height', 1000);
  const fontSize = Math.round(height / 100);
  ctx.font = `bold ${fontSize}pt Helvetica`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'bottom';
  ctx.fillStyle = 'rgba(255,255,255,0.6)';

  const firstChild = Array.from(target.children.values())[0];
  const diam = target.get('diameter');
  const hexDiam = diam / (firstChild.division);

  ctx.fillText(target.id, fontSize, fontSize * 2);
  ctx.fillText(`${FormatNumber(diam, 1)}ly across (diagonally)`, fontSize, fontSize * 5);
  ctx.fillText(`${firstChild.division} hexes across(diagonally)`, fontSize, fontSize * 8);
  ctx.fillText(`${FormatNumber(hexDiam, 1)} ly per hex`, fontSize, fontSize * 11);
  ctx.fillText(`${FormatNumber(target.sumOf('galaxies'), 0)} galaxies`, fontSize, fontSize * 14);

  ctx.font = `bold ${fontSize / 2}pt Helvetica`;
  brackets.forEach((color, i) => {
    ctx.fillStyle = color;
    ctx.fillText(`${FormatNumber(10 ** i, 1)}... ${FormatNumber(10 ** (i + 1), 1)} galaxies`, fontSize, fontSize * (i + 17));
  });
}

module.exports = {
  tellChildIDs,
  labelPoints,
  drawDiscs,
  labelSectorQty,
  legend,
};
