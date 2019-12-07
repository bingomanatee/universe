import Noise from 'simplex-noise';
import { proppify } from '@wonderlandlabs/propper';
import _N from '@wonderlandlabs/n';
import { mean, standardDeviation, sum } from 'simple-statistics';
import randomFor from '../randomFor';
import HexRegion from '../HexRegion';
import lGet from '../lodash/get';
import map from '../lodash/map';
import {
  B10, B100, M, T, B,
} from '../constants';

const sn = new Noise(randomFor('test'));
const sn2 = new Noise(randomFor('everything'));
const sn3 = new Noise(randomFor('life'));
const sn4 = new Noise(randomFor('the universe'));

export default class Universe extends HexRegion {
  constructor(props) {
    if (!props.diameter) {
      props.diameter = 5 * B10;
    }
    super(props);

    this.galaxies = lGet(props, 'galaxies', M);
  }

  makeChild(coord, divisions) {
    return new Universe({ coord, parent: this, divisions });
  }

  get meanGalaxiesPerChild() {
    return this.sumOf((c) => c.galaxies) / this.size;
  }

  get sdGalaxiesPerChild() {
    return standardDeviation(this.map((c) => c.galaxies));
  }

  makeSubsectors(r, o) {
    this.divide(r, o);

    this.forEach((child) => {
      const center = child.center.clone().multiplyScalar(12 / this.diameter);
      const center2 = child.center.clone().multiplyScalar(30 / this.diameter);
      const center3 = child.center.clone().multiplyScalar(200 / this.diameter);
      const center4 = child.center.clone().multiplyScalar(50 / this.diameter);

      // console.log('centers', center, center2, center3, center4);
      const shade = _N(sn.noise2D(center.x, center.y)).abs().times(-1).plus(1);
      const shade2 = _N(sn2.noise2D(center2.x, center2.y)).abs().times(-1).plus(1);
      const shade3 = sn3.noise2D(center3.x, center3.y);
      const shade4 = _N(sn4.noise2D(center4.x, center4.y)).abs().times(-1).plus(1);
      // console.log('shades:', shade.value, shade2.value, shade3, shade4);
      const d = _N(shade).times(30) // broad veins
        .plus(_N(shade4).times(25))
        .plus(_N(shade2).times(45)) // coarse veins
        .plus(_N(shade3).times(15)) // general fine grained noise
        .times(M)
        .floor()
        .value;
      child.d = d;
    });
    const ds = map(this.getChildren(), 'd');

    // console.log('--- initial sample:', ds.slice(0, 10));
    const m = mean(ds);
    const sd = standardDeviation(ds);

    // console.log('---- initial stats:', m, sd);

    this.forEach((child) => {
      child.d = _N(child.d).sub(m).div(sd).plus(1)
        .max(0).value;
    });

    const ds2 = map(this.getChildren(), 'd');
    // console.log('---- adjusted stats:', m, sd);
    const m2 = mean(ds2);
    const sd2 = standardDeviation(ds2);
    const totalDs = sum(ds2);

    // console.log('-------- universe ', this.id, 'has total ds:', sum(ds2), 'mean', m2, 'sd:', sd2);
    //  const avgGalaxies = this.galaxies / this.size;

    let galaxiesUsed = 0;
    let dsUsed = 0;
    this.forEach((child) => {
      const { d } = child;
      const nextDsUsed = dsUsed + d;
      const expectedTotalGalaxies = _N(this.galaxies)
        .times(nextDsUsed)
        .div(totalDs)
        .max(0)
        .round().value;

      child.galaxies = expectedTotalGalaxies - galaxiesUsed;
      galaxiesUsed += child.galaxies;
      dsUsed = nextDsUsed;
    });

    const galaxies = map(this.getChildren(), 'galaxies');
    // console.log('---- adjusted stats:', m, sd);
    const mg = mean(galaxies);
    const sg = standardDeviation(galaxies);

    if (!this.parent) {
      console.log('-------- universe ', this.id, 'has total galaxies:', sum(galaxies),
        '(target ', this.galaxies, '), mean', mg, 'sd:', sg);
    }
  }
}

proppify(Universe)
  .addProp('d', 0, 'number')
  .addProp('galaxies', 2 * B100, 'integer');
