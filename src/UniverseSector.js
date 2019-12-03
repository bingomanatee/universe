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
  }

  init() {
    this.generators.set('distribution', (child) => this.distribution(child.lyCoord));
  }

  distribution(lyCoord) {
    return this.root.distribution(lyCoord);
  }

  makeChild(coord, division) {
    return new UniverseSector(coord, division, this);
  }

  generateSectors(diameter) {
    if (diameter) super.generateSectors(diameter);

    let ratio = 150;
    if (this.galaxies > BIL) {
      ratio = 320;
    } else if (this.galaxies > MIO) {
      ratio = 160;
    } else if (this.galaxies > 5 * TEN_K) {
      ratio = 80;
    } else if (this.galaxies > THOU) {
      ratio = 40;
    } else {
      ratio = 20;
    }

    const diam = this.get('diameter');
    if (diam / (2 * ratio) < 2 * HUND_K) {
      ratio = Math.max(20, Math.ceil(HUND_K / diam));
    }
    super.generateSectors(ratio);
  }
}
