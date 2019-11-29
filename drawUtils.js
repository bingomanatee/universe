
const { CubeCoord } = require('@wonderlandlabs/hexagony');
const mean = require('./src/lodash/mean');
const sortBy = require('./src/lodash/sortBy');

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
  ctx.font = '18pt Helvetica';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  child.do((subChild) => {
    const x = Math.abs(subChild.x);
    const y = Math.abs(subChild.y);
    if (!((x % increment) || (y % increment))) {
      const labelPoint = screenPoint(subChild.coord.toXY(matrix));

      ctx.fillStyle = 'rgba(255,204,0,0.66)';
      ctx.beginPath();
      ctx.arc(labelPoint.x, labelPoint.y, 6, 0, 2 * Math.PI);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.5)';
      ctx.stroke();

      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.fillText(subChild.localId, labelPoint.x, labelPoint.y);
    }
  });
}

function drawDiscs(child, ctx, screenPoint, matrix, color) {
  ctx.lineWidth = 1;
  ctx.fillStyle = color || 'rgba(55,102,204,0.5)';

  const origin = new CubeCoord(0, 0);
  const offset = new CubeCoord(1, 0);

  const oPt = origin.toXY(matrix);
  const offPt = offset.toXY(matrix);
  const HEX_RADIUS = screenPoint(oPt).distanceTo(screenPoint(offPt)) / 2;

  let list = [];

  child.do((sector) => {
    const galaxies = sector.get('galaxies');
    if (galaxies > 2) {
      list.push(galaxies);
    }
  });

  /* ------------ PUT X on tiny clumps ----------- */

  child.do((sector) => {
    ctx.strokeStyle = 'rgba(39,29,58,0.5)';
    ctx.lineWidth = 2;
    const galaxies = sector.getLocal('galaxies');
    const center = sector.coord.toXY(matrix);
    const screenCenter = screenPoint(center);

    const X_RADIUS = Math.max(HEX_RADIUS / 2, 3);

    if ((galaxies > 0) && (galaxies < 10)) {
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
  if (list.length < 10) return;
  const average = mean(list);
  // remove the long tail
  list = list.filter((v) => v > average / 10);
  list = sortBy(list).reverse();

  // remove the unusually large spikes
  list = list.slice(Math.floor(list.length / 10));

  const MEDIAN_GALAXIES = mean(list) * 2;


  if (MEDIAN_GALAXIES < 4) return;

  const GALAXY_SCALE = HEX_RADIUS / MEDIAN_GALAXIES;

  child.do((sector) => {
    ctx.strokeStyle = 'rgba(0,102,255,0.5)';
    const galaxies = sector.getLocal('galaxies');
    const radius = galaxies * GALAXY_SCALE;
    const center = sector.coord.toXY(matrix);
    const screenCenter = screenPoint(center);
    if (radius > 2) {
      ctx.beginPath();
      ctx.arc(screenCenter.x, screenCenter.y, Math.min(radius, HEX_RADIUS), 0, 2 * Math.PI);
      ctx.closePath();
      ctx.fill();
    }
  });

  /* ------------------- DRAW CIRCLES AROUND REALLY BIG ONES --------------- */

  child.do((sector) => {
    ctx.strokeStyle = 'rgba(0,102,255,0.5)';
    const galaxies = sector.getLocal('galaxies');
    const radius = galaxies * GALAXY_SCALE;
    const center = sector.coord.toXY(matrix);
    ctx.lineWidth = 2;
    const screenCenter = screenPoint(center);
    ctx.strokeStyle = 'rgba(0,102,255,0.75)';

    if (radius > HEX_RADIUS) {
      ctx.beginPath();
      ctx.arc(screenCenter.x, screenCenter.y, radius, 0, 2 * Math.PI);
      ctx.closePath();
      ctx.stroke();
    }

    const X_RADIUS = Math.max(HEX_RADIUS, 8) / 2;

    if ((galaxies > 0) && (galaxies < 10)) {
      ctx.strokeStyle = 'black';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(screenCenter.x - X_RADIUS, screenCenter.y - X_RADIUS);
      ctx.lineTo(screenCenter.x + X_RADIUS, screenCenter.y + X_RADIUS);
      ctx.moveTo(screenCenter.x + X_RADIUS, screenCenter.y - X_RADIUS);
      ctx.lineTo(screenCenter.x - X_RADIUS, screenCenter.y + X_RADIUS);
      ctx.closePath();
      ctx.stroke();
      ctx.lineWidth = 1;
    }
  });
}

const digit = (n, large) => {
  if (large) return (n > 10) ? Math.round(n) : n.toFixed(1);
  return ((n > 10) ? Math.round(n) : n);
};

const THOUSAND = 1000;
const MILLION = THOUSAND * THOUSAND;

function labelSectorQty(child, ctx, screenPoint, matrix, fract = false) {
  ctx.font = '8pt Helvetica';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'bottom';
  child.do((sector) => {
    const galaxies = sector.getLocal('galaxies');
    if (galaxies <= 0) return;
    if ((!fract) && (galaxies < 1)) return;

    const center = sector.coord.toXY(matrix);
    const screenCenter = screenPoint(center);

    const mio = (galaxies / MILLION);
    if (mio > 1) {
      ctx.fillStyle = 'rgba(0,0,0,0.8)';
      ctx.fillText(`${digit(mio, true)}m`, screenCenter.x, screenCenter.y);
    } else {
      const k = (galaxies / THOUSAND);
      if (k > 1) {
        ctx.fillStyle = 'rgb(100,130,120)';
        ctx.fillText(`${digit(k, true)}k`, screenCenter.x, screenCenter.y);
      } else if (galaxies > 2) {
        ctx.fillStyle = 'rgb(100,25,0)';
        ctx.fillText(`${digit(galaxies)}`, screenCenter.x, screenCenter.y);
      }
    }
  });
}


module.exports = {
  tellChildIDs,
  labelPoints,
  drawDiscs,
  labelSectorQty,
};
