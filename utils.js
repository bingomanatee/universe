const is = require('is');
const { Vector2 } = require('./src/three/Vector2');
const { Box2 } = require('./src/three/Box2');

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

const ONE_COLOR = 'rgba(255,255,255,0.13)';
const TEN_COLOR = 'rgba(255,255,255,0.51)';
const HUNDRED_COLOR = 'rgba(255,255,255,0.8)';
const THOU_COLOR = 'rgb(218,255,235)';
const TEN_K_COLOR = 'rgba(171,64,189,0.8)';
const HUND_K_COLOR = 'rgba(162,0,83,0.8)';
const MIO_COLOR = 'rgba(143,1,0,0.8)';
const TEN_MIO_COLOR = 'rgba(193,62,0,0.8)';
const HUND_MIO_COLOR = 'rgba(227,207,0,0.8)';
const BIL_COLOR = 'rgb(182,255,0)';
const TEN_B_COLOR = 'rgb(1,121,0)';
const HUND_B_COLOR = 'rgb(1,33,163)';

const brackets = [
  ONE_COLOR,
  TEN_COLOR,
  HUNDRED_COLOR,
  THOU_COLOR,
  TEN_K_COLOR,
  HUND_K_COLOR,
  MIO_COLOR,
  TEN_MIO_COLOR,
  HUND_MIO_COLOR,
  BIL_COLOR,
  TEN_B_COLOR,
  HUND_B_COLOR,
];

const tens = (x) => Math.floor(Math.log(x) / Math.log(10) + 1);

const colorOf = (n) => {
  if (!is.number) return 'white';
  const power = tens(n);
  if (power <= 0) return HUNDRED_COLOR;
  if (power > brackets.length) return HUND_B_COLOR;
  return brackets[power];
};

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
};
