
import GalacticContainer from './GalacticContainer';
import randomFor from './randomFor';

const Noise = require('simplex-noise');

export default class Universe extends GalacticContainer {
  constructor(seed = 'the universe is big. Really really big.') {
    super({});
    this.seed = seed;
    this.generateSectors();
  }

  makeChild(coord, division) {
    return new GalacticContainer({ parent: this, coord, division });
  }

  get seed2() {
    return this.seed.toUpperCase();
  }

  // the universe is 100 billion light years;
  // there are 200 billion galaxies in the observable universe;
  // so an average of 1 galaxy/50 billion ly squared;
  // partitioning the universe into 100 divisions gives us 30,301 hexes.
  // so, those 200 billion galaxies:
  // 200,000,000,000
  // the formula below gives around
  // 205,162,994,999 galaxies in the region, varying by seed
  generateSectors() {
    this.divide(100);
    const sn = new Noise(randomFor(this.seed));
    const sn2 = new Noise(randomFor(this.seed2));

    this.generators.set('galaxies', (child) => {
      const value = sn.noise3D(child.x / 5, child.y / 5, child.z / 5);
      const value2 = sn2.noise3D(child.x / 20, child.y / 20, child.z / 20);
      const value3 = sn2.noise3D(child.x / 50, child.y / 50, child.z / 50);
      let galaxies = 0;
      const sum = (0.5 + value + value2 + value3);
      galaxies = Math.floor((Math.max(0, sum) * 15000000));
      return galaxies;
    });

    this.do((child) => {
      child.generate('galaxies');
    }, (b) => {
      let count = 0;
      // eslint-disable-next-line no-return-assign
      b.children.forEach((c) => count += c.getLocal('galaxies'));
      this.set('total-galaxies', count);
    });
  }
}
