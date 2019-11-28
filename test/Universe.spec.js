/* eslint-disable camelcase */
const tap = require('tap');

const { Hexes } = require('@wonderlandlabs/hexagony');
const p = require('./../package.json');
const { Universe } = require('./../lib/index');

const draw = require('../drawContainer');

tap.test(p.name, (suite) => {
  suite.test('Universe', async (u) => {
    const uni = new Universe('test');
    const matrix = new Hexes({ scale: 8, pointy: true });
    await draw(Array.from(uni.children.values()), {
      matrix,
      fn(ctx, screenPoint) {
        ctx.strokeStye = 'magenta';
        ctx.fillStyle = 'blue';
        uni.do((sector) => {
          const galaxies = sector.getLocal('galaxies');
          if (galaxies > 0) {
            const center = sector.coord.toXY(matrix);
            const radius = galaxies / (matrix.scale * 500000);
            const screenCenter = screenPoint(center);
            ctx.beginPath();
            ctx.arc(screenCenter.x, screenCenter.y, radius, 0, 2 * Math.PI);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
          }
        }, () => {
          console.log('galaxies:', uni.sumOf('galaxies', true));
        });
        ctx.font = '12pt Helvetica';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        uni.do((sector) => {
          const galaxies = sector.getLocal('galaxies');
          if (galaxies > 0) {
            const center = sector.coord.toXY(matrix);
            const screenCenter = screenPoint(center);

            const mio = Math.round(galaxies / 1000000);
            if (mio > 0) {
              ctx.fillStyle = 'rgba(0,0,0,0.8)';
              ctx.fillText(`${mio}m`, screenCenter.x, screenCenter.y);
            } else {
              const k = Math.round(galaxies / 1000);
              if (k > 0) ctx.fillStyle = 'rgba(0,0,0,0.5)';
              ctx.fillText(`${k}k`, screenCenter.x, screenCenter.y);
            }
          }
        });
      },
    }, 'universe');

    // 205,162,994,999
    const gCount = uni.sumOf('galaxies', true);
    u.ok(gCount > 100000000000, 'universe is not too small');
    u.ok(gCount < 1000000000000, 'universe is not too big');
    u.end();
  });

  suite.end();
});
