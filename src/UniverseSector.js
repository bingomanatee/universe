import Noise from 'simplex-noise';
import GalacticContainer from './GalacticContainer';
import randomFor from './randomFor';
import sortBy from './lodash/sortBy';
import random from './lodash/random';
import shuffle from './lodash/shuffle';

export default class UniverseSector extends GalacticContainer {
  constructor(coord, division, parent) {
    super({
      coord, division, parent,
    });
    this.initGenerators();
    this.generate('lyCoord');
    if (this.depth === 1) this.generate('galaxies');
  }

  initGenerators() {
    this.generators.set('lyCoord', (child) => {
      const scale = child.get('diameter').scalar;
      return child.coord.toXY({ scale, pointy: true }).add(this.get('lyCoord'));
    });
    this.generators.set('galaxy-share', (child) => this.root.galaxiesFromLyCoord(child.get('lyCoord')),

      /*   const sn = new Noise(randomFor(this.id));
      const sn2 = new Noise(randomFor(this.localId));
      const scale = child.division / 5;
      const scale2 = child.division / 20;
      const scale3 = child.division / 100;
      const value = sn.noise3D(child.x / scale, child.y / scale, child.z / scale);
      const value2 = sn2.noise3D(child.x / scale2, child.y / scale2, child.z / scale2);
      const value3 = sn2.noise3D(child.x / scale3, child.y / scale3, child.z / scale3);
      const sum = (1 + value + value2 + value3);
      return Math.max(0, sum); */
    );
  }

  makeChild(coord, division) {
    return new UniverseSector(coord, division, this);
  }

  makeSubsectors(division) {
    const t = Date.now();
    console.log('making subsectors of ', this.id);

    this.divide(division);

    this.do((child) => {
      child.generate('lyCoord');
      child.generate('galaxy-share');
    });

    const totalShares = this.sumOf('galaxy-share');

    const galaxies = this.get('galaxies');
    console.log('scaling generators as share of ', galaxies);
    const scale = (galaxies / totalShares);
    this.do((child) => {
      child.set('galaxies', (child.getLocal('galaxy-share') * scale));
    });

    // rationalize fractional galaxy count into integers;
    // not guaranteed to be a net sum zero calculation

    const children = Array.from(this.children.values())
      .filter((child) => {
        const g = child.getLocal('galaxies');
        return g > 0 && (g !== Math.floor(g));
      });

    const ordered = sortBy(children, ((c) => -1 * c.get('galaxies')));

    while (ordered.length > 1) {
      const first = ordered.shift();
      const last = ordered.pop();
      first.set('galaxies', Math.ceil(first.get('galaxies')));
      last.set('galaxies', Math.floor(last.get('galaxies')));
    }

    if (ordered.length) {
      children[0].set('galaxies', Math.round(children[0].get('galaxies')));
    }

    const sog = this.sumOf('galaxies');
    let difference = sog - galaxies;

    const sc = (all) => shuffle(Array.from(this.children.values())
      .filter((child) => {
        if (all) return true;
        const g = child.getLocal('galaxies');
        return g > 0;
      }));

    let childrenToAdjust = sc();

    while (childrenToAdjust.length && (difference > 0)) {
      const child = childrenToAdjust.pop();
      const g = child.get('galaxies');
      const remove = g < 4 ? g : random(1, g);
      difference -= remove;
      child.set('galaxies', g - remove);
      if (!childrenToAdjust.length) childrenToAdjust = sc();
    }

    childrenToAdjust = sc(true);
    while (difference < 0) {
      const child = childrenToAdjust.pop();
      const g = child.get('galaxies');
      const add = random(1, Math.max(g, 5));
      difference += add;
      child.set('galaxies', g + add);
      if (!childrenToAdjust.length) childrenToAdjust = sc(true);
    }

    console.log('----------------------------------');
    console.log('::time:', ((Date.now() - t) / 1000).toFixed(2), 'seconds;');
    console.log(':: ---- end of makeSubsectors ----');
    console.log(':: sum of galaxies:',
      Math.round(this.sumOf('galaxies')), 'based on totalShares: ',
      Math.round(totalShares));
    console.log(':: target: ', this.get('galaxies'));
  }
}
