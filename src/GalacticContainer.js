import {CubeCoord} from '@wonderlandlabs/hexagony';
import {proppify} from '@wonderlandlabs/propper';
import Qty from 'js-quantities';

import is from 'is';
import lGet from './lodash/get';
import last from './lodash/last';
import range from './lodash/range';
import sortBy from './lodash/sortBy';
import mean from './lodash/mean';
import map from './lodash/map';
import shuffle from './lodash/shuffle';
import sum from './lodash/sum';
import groupBy from './lodash/groupBy';

const tens = (x) => Math.floor(Math.log(x) / Math.log(10) + 1);

const ORIGIN = new CubeCoord(0, 0, 0);

const distance = (p1) => ['x', 'y', 'z'].reduce((d, dim) => {
  const cDist = Math.abs(p1[dim]);
  return Math.max(d, cDist);
}, 0);

class GalacticContainer {
  constructor(props) {
    this.coord = lGet(props, 'coord', ORIGIN);
    this.parent = lGet(props, 'parent', null);
    this.division = lGet(props, 'division', 1);
  }

  get lyCoord() {
    const scale = this.get('diameter');
    const base = this.coord.toXY({scale: 1, pointy: false});
    if (this.parent) {
      return this.parent.lyCoord.add(base);
    }
    return base;
  }

  get size() {
    return this.children.size;
  }

  get x() {
    return this.coord.x;
  }

  get y() {
    return this.coord.y;
  }

  get z() {
    return this.coord.z;
  }

  do(fn, fn2) {
    this.children.forEach(fn);
    if (fn2) {
      fn2(this);
    }
  }

  sumOf(prop, local = false) {
    let value = 0;
    this.do((c) => {
      if (local) {
        value += c.getLocal(prop);
      } else {
        value += c.get(prop);
      }
    });
    return value;
  }

  get localIdLong() {
    return `x${this.coord.x}y${this.coord.y}d${this.division}`;
  }

  get localId() {
    return `x${this.coord.x}y${this.coord.y}`;
  }

  get id() {
    const prefix = this.parent ? `${this.parent.id}.` : '';
    return `${prefix}${this.localId}`;
  }

  get idLong() {
    const prefix = this.parent ? `${this.parent.idLong}.` : '';
    return `${prefix}${this.localIdLong}`;
  }

  get childDivisions() {
    const firstChild = Array.from(this.children.values())[0];
    return firstChild.division;
  }

  makeChild(coord, division) {
    return new GalacticContainer({coord, parent: this, division});
  }

  /**
   * if clip is true, we will end up with an even number of sectors;
   * this will make divisions of units cleaner, but will mean that the map
   * is not perfectly symmertric - there will be more hexes to the left/up of the
   * region than the right/down.
   * @param radius
   * @param clip
   */
  divide(radius) {
    const division = 2 * radius;

    this.children.clear();

    range(radius * -1, radius + 1)
      .forEach((x) => range(radius * -1, radius + 1)
        .forEach((y) => {
          const coord = new CubeCoord(x, y);
          // console.log('division point for ', x, y, coord.toString());
          if (distance(coord) <= radius) {
            const child = this.makeChild(coord, division);

            // console.log('rad', radius, 'making child of ', this.id, 'at', x, y, child.localId);
            this.children.set(child.localId, child);
          }
        }));
  }

  setLocal(name, value) {
    this.props.set(name, value);
  }

  getLocal(name) {
    return this.props.get(name);
  }

  set(name, value, unit) {
    if (unit) {
      throw new Error('cannot set units now');
    }
    this.props.set(name, value);
  }

  child(id) {
    return this.children.get(id);
  }

  has(name) {
    return this.props.has(name);
  }

  get heritage() {
    return this.parent ? [...this.parent.heritage, this] : [this];
  }

  get root() {
    return this.parent ? this.parent.root : this;
  }

  get(name) {
    if (this.has(name)) {
      return this.props.get(name);
    }

    if (!this.parent) {
      return null;
    }
    if (this.parent === this) {
      console.log('FRY!!!');
      return;
    }

    let value = this.parent.get(name);
    if (is.number(value)) {
      value /= this.division;
    }
    if (value instanceof Qty) {
      value = value.div(this.division);
    }
    return value;
  }

  getTop(name) {
    if (this.parent) {
      return this.parent.getTop(name);
    }
    return this.props.get(name)[0];
  }

  get depth() {
    return this.parent ? this.parent.depth + 1 : 0;
  }

  /**
   * this method determines a value for this container based on a function in the parent.
   * @param prop
   */
  generate(prop) {
    if (!this.parent.generators.has(prop)) {
      throw new Error(`child ${this.id}parent does not have generator ${prop}`);
    }
    this.set(prop, this.parent.generators.get(prop)(this));
  }

  getChildren() {
    return Array.from(this.children.values());
  }

  childrenBy(unit, desc = false, trim = true) {
    let children = sortBy(this.getChildren(), (c) => c.get(unit));
    if (trim) {
      children = children.filter((c) => c.get(unit) > 0);
    }
    return desc ? children.reverse() : children;
  }

  generateSectors(radius) {
    this.divide(radius, true);
    this.do((c) => {
      c.generate('distribution');
    });
    this.distributeGalaxies();
  }

  distributeGalaxies() {
    console.log('distributing galaxies for ', this.id);
    const descList = this.childrenBy('distribution', true);
    const totalDist = this.sumOf('distribution');
    let galaxiesUsed = 0;
    let distributionUsed = 0;
    descList.forEach((child) => {
      const dist = child.get('distribution');
      distributionUsed += dist;
      const desiredGalaxies = Math.round(this.galaxies * (distributionUsed / totalDist));
      const childGalaxies = desiredGalaxies - galaxiesUsed;
      child.galaxies = childGalaxies;
      galaxiesUsed += childGalaxies;
    });
    this.do((sector) => sector.galaxies = Math.floor(sector.galaxies));
    this.fixCount();
  }

  sumOfGalaxies() {
    return sum(map(Array.from(this.children.values()), 'galaxies'));
  }

  byGalaxies(desc = false, noZeros = true){
    let out = sortBy(shuffle(Array.from(this.children.values())), 'galaxies');
    if (noZeros) out = out.filter(a => a.galaxies > 0);
    if (desc) return out.reverse();
    return out;
  }

  fixCount() {
    const count = this.sumOfGalaxies();
    let diff = Math.round(count - this.galaxies);

    // note - will NOT be synced with galaxies
    if (diff === 0) {
      return;
    }
    const galList =  this.byGalaxies(true, false);
    if (galList.length < 1) {
      console.log('no children --- cannot fix', this.id);
      return
    }

    console.log('fixing ', this.id, 'count', count, 'desired', this.galaxies, 'diff', diff, galList.length, 'children');

    while ((diff !== 0) && galList.length) {
      const child = galList.shift();
      const cGalaxies = child.galaxies;
      const offset = Math.max(1, Math.round(cGalaxies / 10));
      console.log('adjusting child.galaxies from ', child.galaxies)
      if ((diff > 0) && (cGalaxies > 0)) {
        child.galaxies = cGalaxies - offset;
        diff -= offset;
      }
      if (diff < 0) {
        child.galaxies = cGalaxies + offset;
        diff += offset;
      }
      console.log('... to ', child.galaxies);
      console.log('... diff = ', diff);
      if (diff === 0) {
        break;
      }
    }
    console.log('after fixing ', this.id, 'count', count, 'desired', this.galaxies);

    if (diff) {
      this.fixCount();
    }
  }

  distribution() {
    const list = this.childrenBy('distribution', true, true).filter((c) => c.galaxies > 0);
    /**
     * find the most typical power of ten in the data set
     */
    const listTens = map(list, 'galaxies').map(tens);
    const dist = [];
    listTens.forEach
  }

  medianGalaxies(smallCount = 4) {
    const list = this.childrenBy('distribution', true, true).filter((c) => c.galaxies >= smallCount);
    if (list.length < 1) {
      return 0;
    }

    if (list.length < 10) {
      return mean(map(list, 'galaxies'));
    }
    /**
     * find the most typical power of ten in the data set
     */
    const listTens = map(list, 'galaxies').map(tens);
    const dist = groupBy(listTens);

    /*    console.log('power of 10 distribution:');
    Object.keys(dist).forEach((key) => {
      console.log('power:', key, 'count: ', dist[key].length);
    }); */

    const averageDist = Array.from(Object.values(dist)).reduce((bestList, list) => {
      if (list.length > bestList.length) {
        return list;
      }
      return bestList;
    }, [])[0];

    /**
     * poll elements between 10 * typical and 1/10 * typical power
     */
    const max = 10 ** (averageDist + 1);
    const min = 10 ** (averageDist - 1);

    const typical = list.filter((child) => child.galaxies <= max && child.galaxies >= min);

    return mean(map(typical, 'galaxies'));
  }
}

proppify(GalacticContainer)
  .addProp('children', () => new Map())
  .addProp('generators', () => new Map())
  .addProp('props', () => new Map())
  .addProp('division', 100, 'number')
  .addProp('galaxies', 0, (n) => {
    if (!is.number(n)) {
      return 'must be a number';
    }
    if (n < 0) {
      return 'must be positive';
    }
    return false;
  })
  .addProp('coord', () => new CubeCoord(0, 0), 'object')
  .addProp('parent');

export default GalacticContainer;
