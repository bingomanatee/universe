import Noise from 'simplex-noise';
import GalacticContainer from './GalacticContainer';
import UniverseSector from './UniverseSector';
import randomFor from './randomFor';
import { Vector2 } from './three/Vector2';
import {
  BIL, MIO, THOU, TEN_K, HUND_MIO, TEN_MIO,
} from '../utils';
import lGet from './lodash/get';

const D1 = HUND_MIO;
const D2 = TEN_MIO;
const D3 = TEN_K;
const D4 = THOU;
const D5 = 10;

// the known universe is 100 billion light years across.
// there are 200 billion galaxies in the observable universe;
// so an average of 1 galaxy/50 billion ly squared;
// partitioning the universe into 100 divisions gives us 30,301 hexes.
// so, those 200 billion galaxies:
// 200,000,000,000
// 9,007,199,254,740,991
// the formula below gives around
// 205,162,994,999 galaxies in the region, varying by seed

// note - cheating and lowering galaxy count to 50 billion.

// 36,000,000,000
export default class Universe extends GalacticContainer {
  constructor(props = {}) {
    super(props);
    const seed = lGet(props, 'seed', 'the universe is big. really really big.');
    const galaxies = lGet(props, 'galaxies', 50 * BIL);
    const diameter = lGet(props, 'diameter', 100 * BIL);
    this.seed = seed;
    this.set('diameter', diameter);
    this.galaxies = galaxies;
    this.init();
  }

  get sn() {
    if (!this._sn) {
      this._sn = new Noise(randomFor(this.seed));
    }
    return this._sn;
  }

  get sn2() {
    if (!this._sn2) {
      this._sn2 = new Noise(randomFor(this.seed2));
    }
    return this._sn2;
  }

  get sn3() {
    if (!this._sn3) {
      this._sn3 = new Noise(randomFor(this.seed2 + this.seed));
    }
    return this._sn3;
  }

  get sn4() {
    if (!this._sn4) {
      this._sn4 = new Noise(randomFor(this.seed + this.seed2));
    }
    return this._sn4;
  }

  init() {
    this.generators.set('distribution', (child) => this.distribution(child.lyCoord));
  }

  distribution(lyCoord) {
    const value = this.sn.noise2D(lyCoord.x / D1, lyCoord.y / D1);
    const value2 = this.sn2.noise2D(lyCoord.x / D2, lyCoord.y / D2);
    const value3 = this.sn3.noise2D(lyCoord.x / D3, lyCoord.y / D3);
    const value4 = this.sn4.noise2D(lyCoord.x / D4, lyCoord.y / D4);
    const value5 = this.sn4.noise2D(lyCoord.x / D5, lyCoord.y / D5);
    const sum = ((1 - Math.abs(value2)) * MIO); // + Math.abs(value3) + Math.abs(value5 / 2)
    return Math.floor((Math.max(0, sum)));
  }

  get seed2() {
    return this.seed.toUpperCase();
  }

  makeChild(coord, division) {
    return new UniverseSector(coord, division, this);
  }
}
