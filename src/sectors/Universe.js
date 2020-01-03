/* eslint-disable no-param-reassign */
import Noise from 'simplex-noise';
import { CubeCoord, Hexes } from '@wonderlandlabs/hexagony';
import { proppify } from '@wonderlandlabs/propper';
import _N from '@wonderlandlabs/n';
import {
  max, mean, standardDeviation, sum,
} from 'simple-statistics';
import randomFor from '../randomFor';
import HexRegion from '../HexRegion';
import lGet from '../lodash/get';
import map from '../lodash/map';
import random from '../lodash/random';
import {
  B10, B100, M, M10, T, B, K100, K10,
} from '../constants';

const ORIGIN = new CubeCoord(0, 0, 0);
const MAX_ARMS = 20;

const sn = new Noise(randomFor('test'));
const sn2 = new Noise(randomFor('everything'));
const sn3 = new Noise(randomFor('life'));
const sn4 = new Noise(randomFor('the universe'));
const spiralNoise = new Noise(randomFor('spiral galaxy'));
const twirls = new Noise(randomFor('twirls'));

export default class Universe extends HexRegion {
  constructor(props) {
    if (!props.diameter) {
      props.diameter = B100;
    }
    super(props);

    this.galaxies = lGet(props, 'galaxies', M10);
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
      child.d = _N(child.d).sub(m).div(sd * 1.5).plus(1)
        .max(0).value;
    });
  }

  /**
   * spiralArms good maximum density for stars is 0.2 stars per cubic parsec;
   * parsecs are 3.25 light years,
   * so spiralArms cubic parsec is about 10 cubic light years.
   *
   * so max density = 0.2 * ((diameter/2)/10) **2
   *  = 0.2 * diameter/20 ^2
   *  = 0.2 * diameter **2 /400
   *  = 5/400 * diameter **2
   *  = diameter ** 2 / 80
   */
  distributeStars() {
    const starNoise = new Noise(randomFor(this.id));

    const starNoiseFine = new Noise(randomFor(`${this.id} fine noise`));

    const spirality = spiralNoise.noise2D(this.center.x, this.center.y);
    const arms = _N(spirality)
      .plus(1)
      .div(2)
      .times(MAX_ARMS)
      .max(3)
      .round().value;

    const r1 = sn.noise2D(this.center.x, this.center.y);
    const r2 = sn2.noise2D(this.center.x, this.center.y);

    const r1R = _N(r1).plus(1).div(2);
    const r2R = _N(r2).plus(1).div(2);

    const rand = r1R.plus(r2R).div(2).pow(2);

    const SCALAR = M * 5;

    const galaxyDiameter = rand.times(SCALAR).clamp(4 * K10, M).round().value;

    this.set('galaxyDiameter', galaxyDiameter);

    const childDiameter = this.diameter / this.childDivisions;
    const area = childDiameter ** 2;
    this.area = area;
    this.maxStars = area / 80;

    const twirly = _N(twirls.noise2D(this.center.x, this.center.y))
      .abs()
      .times(5)
      .plus(3);

    const grossNoiseScale = 100 / this.diameter;
    const mediumNoiseScale = 200 / this.diameter;
    const fineNoiseScale = 400 / this.diameter;
    this.forEach((child) => {
      child.galaxies = 0;
      const childPt = child.coord.toXY(child.matrix);

      const grossNoise = starNoise.noise2D(childPt.x * grossNoiseScale, childPt.y * grossNoiseScale);

      const mediumNoise = starNoiseFine.noise2D(childPt.x * mediumNoiseScale, childPt.y * mediumNoiseScale);

      const fineNoise = starNoiseFine.noise2D(childPt.x * fineNoiseScale, childPt.y * fineNoiseScale);


      const childAngle = Math.atan2(childPt.y, childPt.x);
      const childArmAngle = childAngle * arms;
      const childRadFromCenter = _N(childPt.distanceTo(ORIGIN.toXY(child.matrix))).times(2);
      const diam = this.get('galaxyDiameter');
      const twirlAdd = _N(childRadFromCenter).div(diam).times(twirly).times(Math.PI).value;

      const unitRadFromCenter = childRadFromCenter.div(diam);

      // general galactic noise -1 .. 1
      child.galacticNoise = _N(grossNoise / 3)
        .plus(mediumNoise / 3)
        .plus(fineNoise / 3)
        .clamp(-1, 1)
        .value;

      // spiralArms value 1 .. 0 indicating nearness to center;
      const closenessToCenter = _N(1).minus(unitRadFromCenter).clamp(1, 0);

      // spiralArms central concentration of stars
      child.galacticCore = _N(closenessToCenter - 0.75)
        .clamp(0, 1).value;

      child.r = _N(closenessToCenter).clamp(0, 1).value;

      // spiralArms rotating value from 1 to -1;
      const minimum = _N(childArmAngle)
        .plus(twirlAdd)
        .sin()
        .div(3)
        .plus(2 / 3);
      child.spiralArms = minimum
        .minus(unitRadFromCenter)
        .clamp(-1, 1)
        .value;

      child.starDensity = _N(0)
        .plus(child.spiralArms * 2 / 3)
        .plus(_N(child.galacticNoise)
          .times(closenessToCenter))
        .clamp(0, 1)
        .pow(2)
        .value;


      child.stars = Math.round(child.starDensity * this.maxStars);
    });
  }

  distributeGalaxies() {
    const ds2 = map(this.getChildren(), 'd');
    // console.log('---- adjusted stats:', m, sd);

    const totalDs = sum(ds2);

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
  }
}

proppify(Universe)
  .addProp('d', 0, 'number')
  .addProp('maxStars', 0, 'number')
  .addProp('stars', 0, 'number')
  .addProp('starDensity', 0, 'number')
  .addProp('galacticNoise', 0, 'number')
  .addProp('galacticCore', 0, 'number')
  .addProp('r', 0, 'number')
  .addProp('spiralArms', 0, 'number')
  .addProp('galaxies', 0);
