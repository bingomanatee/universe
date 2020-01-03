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

    hr.test('draw divided', async (dd) => {
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

    hr.test('draw sub divided', async (dd) => {
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

  /**
   * skip this test -- its got no asserts
   */
  suite.skip('relationship of single division and nested division', (md) => {
    const singleDiv = new HexRegion({ diameter: 100 });
    singleDiv.divide(16);

    const nestedDiv = new HexRegion({ diameter: 100 });
    nestedDiv.divide(4);
    nestedDiv.forEach((ns) => {
      ns.divide(4);
      ns.forEach((nss) => {
        console.log('...subsector ', nss.id, 'center = ', nss.center.clone().round());
      });
    });

    md.end();
  });

  suite.end();
});
