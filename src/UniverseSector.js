import Noise from 'simplex-noise';
import GalacticContainer from './GalacticContainer';
import randomFor from './randomFor';
import sortBy from './lodash/sortBy';
import random from './lodash/random';
import shuffle from './lodash/shuffle';

import {
  BIL, MIO, HUND_K, TEN_K, THOU,
} from '../utils';

export default class UniverseSector extends GalacticContainer {
  constructor(coord, division, parent) {
    super({
      coord, division, parent,
    });
    this.init();
    this.generate('lyCoord');
  }

  init() {
    this.generators.set('distribution', (child) => {
      const lyCoord = child.get('lyCoord');
      return this.distribution(lyCoord);
    });
  }

  distribution(lyCoord) {
    return this.root.distribution(lyCoord);
  }

  makeChild(coord, division) {
    return new UniverseSector(coord, division, this);
  }

  generateSectors() {
    if (this.galaxies > HUND_K) {
      super.generateSectors(300);
    } else if (this.galaxies > MIO) {
      super.generateSectors(250);
    } else if (this.galaxies > THOU) {
      super.generateSectors(100);
    } else if (this.galaxies > 500) {
      super.generateSectors(50);
    } else {
      super.generateSectors(25);
    }
  }
}
