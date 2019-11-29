
import Noise from 'simplex-noise';
import GalacticContainer from './GalacticContainer';
import UniverseSector from './UniverseSector';
import randomFor from './randomFor';
import { Vector2 } from './three/Vector2';

export default class Universe extends GalacticContainer {
  constructor(seed = 'the universe is big. Really really big.') {
    super({});
    this.seed = seed;
    this.set('diameter', 200000000000, 'ly');
    this.initGenerators();
    this.generateSectors();
  }

  get sn() {
    if (!this._sn) this._sn = new Noise(randomFor(this.seed));
    return this._sn;
  }

  get sn2() {
    if (!this._sn2) this._sn2 = new Noise(randomFor(this.seed2));
    return this._sn2;
  }

  initGenerators() {
    const D1 = 1000;
    const D2 = D1 * 5;
    const D3 = D2 * 10;

    this.set('lyCoord', new Vector2(0, 0));
    this.generators.set('lyCoord', (child) => {
      const scale = child.get('diameter').scalar;
      return child.coord.toXY({ scale, pointy: true });
    });

    this.generators.set('galaxies', (child) => {
      const lyCoord = child.get('lyCoord');
      const value = this.sn.noise2D(lyCoord.x / D1, lyCoord.y / D1);
      const value2 = this.sn2.noise2D(lyCoord.x / D2, lyCoord.y / D2);
      const value3 = this.sn2.noise2D(lyCoord.x / D3, lyCoord.y / D3);
      const sum = (0.5 + value + value2 + value3);
      return Math.floor((Math.max(0, sum) * 15000000));
    });
  }

  get seed2() {
    return this.seed.toUpperCase();
  }

  makeChild(coord, division) {
    return new UniverseSector(coord, division, this);
  }

  // the known universe is 100 billion light years across.
  // there are 200 billion galaxies in the observable universe;
  // so an average of 1 galaxy/50 billion ly squared;
  // partitioning the universe into 100 divisions gives us 30,301 hexes.
  // so, those 200 billion galaxies:
  // 200,000,000,000
  // 9,007,199,254,740,991
  // the formula below gives around
  // 205,162,994,999 galaxies in the region, varying by seed
  generateSectors(radius) {
    this.divide(radius);

    let count = 0;
    this.children.forEach((c) => count += c.getLocal('galaxies'));
    this.set('total-galaxies', count);
  }
}
