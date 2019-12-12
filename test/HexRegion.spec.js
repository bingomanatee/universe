/* eslint-disable camelcase */
const tap = require('tap');
const Noise = require('simplex-noise');
const { CubeCoord, Hexes } = require('@wonderlandlabs/hexagony');
const { Vector2 } = require('./../src/three/Vector2');
const drawHexes = require('../src/drawHexes');
const clamp = require('./../src/lodash/clamp');
const asserts = require('../addVectorAsserts');

asserts(tap);

const p = require('../package.json');
const { HexRegion, randomFor } = require('../lib');

tap.test(p.name, (suite) => {
  suite.test('HexRegion', (hr) => {
    hr.test('constructor', (con) => {
      con.test('no arguments', (na) => {
        const baseRegion = new HexRegion();
        con.same(baseRegion.id, 'x0y0z0');
        con.same(baseRegion.diameter, 1);

        con.same(baseRegion.matrix.scale, 1);
        con.same(baseRegion.matrix.pointy, true);

        const box = baseRegion.toBox();

        con.realClose(box.min.x, -0.43301, 10);
        con.realClose(box.min.y, -0.5, 10);
        con.realClose(box.max.x, 0.43301, 10);
        con.realClose(box.max.y, 0.5, 10);

        na.end();
      });

      con.test('arguments', (na) => {
        const baseRegion = new HexRegion({ diameter: 100 });
        con.same(baseRegion.id, 'x0y0z0');
        con.same(baseRegion.diameter, 100);

        const box = baseRegion.toBox();

        con.realClose(box.min.x, -43.301, 10);
        con.realClose(box.min.y, -50, 10);
        con.realClose(box.max.x, 43.301, 10);
        con.realClose(box.max.y, 50, 10);
        na.end();
      });

      con.end();
    });

    hr.test('divide', (div) => {
      const baseRegion = new HexRegion({ diameter: 110 });

      baseRegion.divide(5);

      const first = baseRegion.getChildren()[0];

      div.realClose(first.diameter, 11, 10);
      div.same(first.divisions, 10);

      div.end();
    });

    hr.skip('draw divided', async (dd) => {
      const baseRegion = new HexRegion({ diameter: 110 });

      baseRegion.divide(4);
      const bounds = baseRegion.toBox();

      const draw = ((region, name) => drawHexes({

        min_x: bounds.min.x * 1.5,
        min_y: bounds.min.y * 1.5,
        max_x: bounds.max.x * 1.5,
        max_y: bounds.max.y * 1.5,
        visual_scale: 10,
        fn(ctx, screenCoord) {
          const drawHex = (hex, color = 'black', width = 1) => {
            ctx.lineWidth = width;
            ctx.strokeStyle = color;

            const corners = hex.corners().map(screenCoord);

            corners.push(corners[0]);

            ctx.beginPath();
            const p = corners[0];
            ctx.moveTo(p.x, p.y);
            corners.forEach((p2) => ctx.lineTo(p2.x, p2.y));
            ctx.closePath();
            ctx.stroke();
          };

          const drawInset = (hex) => {
            const iCorners = hex.insetCorners().map(screenCoord);

            ctx.strokeStyle = 'rgba(0,255,0,0.2)';
            ctx.lineWidth = 1;
            ctx.beginPath();
            const pp = iCorners[0];
            ctx.moveTo(pp.x, pp.y);
            iCorners.forEach((p2) => ctx.lineTo(p2.x, p2.y));
            ctx.closePath();
            ctx.stroke();
          };

          drawHex(region, 'black', 2);
          drawInset(region);

          region.forEach((child) => {
            drawHex(child, 'red', 1);
            const c = child.center;
            const cc = screenCoord(c);
            ctx.font = '12pt helvetica';
            ctx.fillStyle = 'black';
            ctx.fillText(child.localId, cc.x, cc.y);
          });
        },

      }, name));

      await draw(baseRegion, 'draw divided');

      const baseRegionOdd = new HexRegion({ diameter: 110 });

      baseRegionOdd.divide(4, true);

      await draw(baseRegionOdd, 'draw divided - odd');

      dd.end();
    });

    hr.skip('draw sub divided', async (dd) => {
      const baseRegion = new HexRegion({ diameter: 110 });

      baseRegion.divide(5);

      baseRegion.forEach((c) => c.divide(3));
      const bounds = baseRegion.toBox();

      await drawHexes({
        min_x: bounds.min.x * 1.5,
        min_y: bounds.min.y * 1.5,
        max_x: bounds.max.x * 1.5,
        max_y: bounds.max.y * 1.5,
        visual_scale: 20,
        fn(ctx, screenCoord) {
          const drawHex = (hex, color = 'black', width = 1, fill = false) => {
            ctx.lineWidth = width;
            ctx.strokeStyle = color;

            const corners = hex.corners().map(screenCoord);

            corners.push(corners[0]);

            ctx.beginPath();
            const p = corners[0];
            ctx.moveTo(p.x, p.y);
            corners.forEach((p2) => ctx.lineTo(p2.x, p2.y));
            ctx.closePath();
            if (fill) {
              ctx.fillStyle = fill;
              ctx.fill();
            }
            ctx.stroke();
          };

          drawHex(baseRegion, 'black', 2);

          baseRegion.forEach((child) => {
            drawHex(child, 'red', 1);
            const r = Math.floor(Math.random() * 255);
            const g = Math.floor(Math.random() * 255);
            const b = Math.floor(Math.random() * 255);
            const color = `rgb(${[r, g, b].join(',')})`;

            const colorA = `rgba(${[r, g, b].join(',')},0.25)`;
            child.forEach((sub) => {
              drawHex(sub, color, 1, colorA);
            });
            const c = child.center;
            const cc = screenCoord(c);
            ctx.font = '12pt helvetica';
            ctx.fillStyle = 'black';
            ctx.fillText(child.localId, cc.x, cc.y);
          });
        },

      }, 'draw sub-divided');

      dd.end();
    });
    hr.end();
  });

  suite.skip('noise on hex', async (noh) => {
    const baseRegion = new HexRegion({ diameter: 40 });

    baseRegion.divide(300);
    const bounds = baseRegion.toBox();

    const sn = new Noise(randomFor('test'));
    const sn2 = new Noise(randomFor('everything'));
    const sn3 = new Noise(randomFor('life'));
    const sn4 = new Noise(randomFor('the universe'));

    await drawHexes({
      min_x: bounds.min.x * 1.5,
      min_y: bounds.min.y * 1.5,
      max_x: bounds.max.x * 1.5,
      max_y: bounds.max.y * 1.5,
      visual_scale: 100,
      fn(ctx, screenCoord) {
        const drawHex = (hex, color = 'black', width = 1, fill = false) => {
          ctx.lineWidth = width;
          ctx.strokeStyle = color;

          const corners = hex.corners().map(screenCoord);

          corners.push(corners[0]);

          ctx.beginPath();
          const p = corners[0];
          ctx.moveTo(p.x, p.y);
          corners.forEach((p2) => ctx.lineTo(p2.x, p2.y));
          ctx.closePath();
          if (fill) {
            ctx.fillStyle = fill;
            ctx.fill();
          }
          ctx.stroke();
        };

        drawHex(baseRegion, 'black', 2);

        baseRegion.forEach((child) => {
          const center = child.center.clone().multiplyScalar(12 / baseRegion.diameter);
          const center2 = child.center.clone().multiplyScalar(30 / baseRegion.diameter);
          const center3 = child.center.clone().multiplyScalar(200 / baseRegion.diameter);
          const center4 = child.center.clone().multiplyScalar(50 / baseRegion.diameter);
          const shade = 1 - Math.abs(sn.noise2D(center.x, center.y));
          const shade2 = 1 - Math.abs(sn2.noise2D(center2.x, center2.y));
          const shade3 = sn3.noise2D(center3.x, center3.y);
          const shade4 = 1 - Math.abs(sn4.noise2D(center4.x, center4.y));
          const c = clamp(Math.floor(((shade * 0.4 + shade4 * 0.25 + shade2 * 0.15 + shade3 * 0.1) ** 1.25) * 255),
            0, 255);
          drawHex(child, `rgb(${c},${c},${c}`, 1, `rgb(${c},${c},${c}`);
        });
      },

    }, 'noise on hex');

    noh.end();
  });

  suite.skip('math', (m) => {
    const h = new Hexes({ pointy: true, scale: 1000 });

    const origin = new CubeCoord(0, 0);

    console.log('100 scale hex points: ', h.corners(origin));

    console.log('corner to corner distance: ', h.corners(origin)[0].distanceTo(h.corners(origin)[3]));

    const hf = new Hexes({ pointy: false, scale: 100 });

    console.log('100 scale hex, flat points: ', hf.corners(origin));

    console.log('corner to corner(flat) distance: ', hf.corners(origin)[0].distanceTo(hf.corners(origin)[3]));

    m.end();
  });

  suite.end();
});
