const is = require('is');
const chromajs = require('chroma-js');
const { Vector2 } = require('./src/three/Vector2');
const { Box2 } = require('./src/three/Box2');
const clamp = require('./src/lodash/clamp');

const fix = (n, depth = 3) => {
  if (!is.number(n)) {
    return 0;
  }
  return Number(n).toFixed(depth);
};
const hex2string = (h) => `hexes|${fix(h.scale, 5)}-${h.pointy ? 'P' : 'F'}|`;
const isPointLike = (a) => a && is.object(a) && is.number(a.x) && is.number(a.y);
const isPoint3Like = (a) => a && is.object(a) && is.number(a.x) && is.number(a.y) && is.number(a.z);
const cubeString = (c) => {
  if (!isPoint3Like(c)) {
    console.log('bad cubeString candidate:', c);
    throw new Error('bad cubeString candidate');
    return '--- non cube-- ';
  }
  return `cube|${c.x},${c.y},${c.z}|`;
};
const point2string = (c) => `xy|${fix(c.x, 3)},${fix(c.y, 3)}|`;

const point2stringI = (c) => {
  c = c.clone().round();
  return `xy|${c.x},${c.y}|`;
};

const box2array = (box2) => {
  const { min, max } = box2;
  return [min.x, min.y, max.x, max.y];
};

const array2box = (x, y, x2, y2) => {
  if (Array.isArray(x)) {
    return array2box(...x);
  }
  return new Box2(new Vector2(x, y), new Vector2(x2, y2));
};


const HUND = 100;
const THOU = 1000;
const TEN_K = 10 * THOU;
const HUND_K = HUND * THOU;
const MIO = THOU * THOU;
const TEN_MIO = 10 * MIO;
const HUND_MIO = HUND * MIO;
const BIL = MIO * THOU;
const TEN_B = 10 * BIL;

const numberBrackets = [1, 10, HUND, THOU, TEN_K, HUND_K, MIO, TEN_MIO, HUND_MIO, BIL, TEN_B];

/* const ONE_COLOR = 'rgba(255,255,255,0.1)';
const TEN_COLOR = 'rgba(255,255,255,0.25)';
const FIFTY_COLOR = 'rgba(255,255,255,0.4)';
const HUNDRED_COLOR = 'rgba(255,255,255,0.67)';
const THOU_COLOR = 'rgb(0,222,255)';
const TEN_K_COLOR = 'rgb(0,123,87)';
const HUND_K_COLOR = 'rgb(214,255,0)';
const MIO_COLOR = 'rgb(207,161,0)';
const TEN_MIO_COLOR = 'rgb(193,93,70)';
const HUND_MIO_COLOR = 'rgb(120,42,55)';
const BIL_COLOR = 'rgb(117,0,92)';
const TEN_B_COLOR = 'rgb(88,0,99)';
const HUND_B_COLOR = 'rgb(46,0,140)'; */

const colorBand = [
  ['rgba(255,255,255,0.1)', 0],
  ['rgb(214,255,0)', 0.3],
  ['rgb(117,0,92)', 0.6],
  ['rgb(46,0,140)', 1],
];

const tens = (x) => Math.floor(Math.log(x) / Math.log(10) + 1);


const colorBrackets = numberBrackets.reduce((out, number) => [...out,
  [number, number * 50 - 1],
  [number * 50, number * 100 - 1],
], []);

const brackets = [];
for (let i = 0; i < colorBrackets.length; ++i) {
  const fraction = i / colorBrackets.length;
}

const colorBracketNum = (n) => {
  for (let i = 0; i < colorBrackets.length; ++i) {
    if (colorBrackets[i][0] <= n && colorBrackets[i][1] >= n) return i;
  }
  return colorBrackets.length;
};


const colorOf = (n) => {
  if (!is.number(n)) {
    return 'white';
  }
  let power = colorBracketNum(n);
  power = clamp(power, 0, brackets.length - 1);
  return brackets[power];
};

colorBrackets.forEach(([min, max]) => {
 // console.log('color brackets: ', min, colorOf(min), max, colorOf(max));
});

module.exports = {
  tens,
  hex2string,
  isPoint3Like,
  isPointLike,
  isPoint2Like: isPointLike,
  cubeString,
  fix,
  point2string,
  point2stringI,
  box2array,
  array2box,
  HUND,
  THOU,
  TEN_K,
  HUND_K,
  MIO,
  TEN_MIO,
  HUND_MIO,
  BIL,
  TEN_B,
  colorOf,
  brackets,
  colorBrackets,
};
