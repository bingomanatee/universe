import { CubeCoord } from '@wonderlandlabs/hexagony';
import { proppify } from '@wonderlandlabs/propper';
import Qty from 'js-quantities';

import is from 'is';
import lGet from './lodash/get';
import last from './lodash/last';
import range from './lodash/range';

const ORIGIN = new CubeCoord(0, 0, 0);

const distance = (p1, p2) => ['x', 'y', 'z'].reduce((d, dim) => {
  const cDist = Math.abs(p1[dim] - p2[dim]);
  return Math.max(d, cDist);
}, 0);

class GalacticContainer {
  constructor(props) {
    this.coord = lGet(props, 'coord', ORIGIN);
    this.parent = lGet(props, 'parent', null);
    this.division = lGet(props, 'division', (this.parent ? 1000 : 1));
  }

  get x() { return this.coord.x; }

  get y() { return this.coord.y; }

  get z() { return this.coord.z; }

  do(fn, fn2) {
    this.children.forEach(fn);
    if (fn2) fn2(this);
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

  get localId() {
    return `${this.coord.x}.${this.coord.y}.${this.coord.z}/${this.division}`;
  }

  get id() {
    const prefix = this.parent ? `${this.parent.id}:` : '';
    return `${prefix}${this.localId}`;
  }

  makeChild(coord, division) {
    return new GalacticContainer({ coord, parent: this, division });
  }

  divide(radius = 10, overwrite = false) {
    const division = 2 * radius + 1;
    const center = this.coord;

    const minX = center.x - radius;
    const maxX = center.x + radius + 1;
    const minY = center.y - radius;
    const maxY = center.y + radius + 1;

    range(minX, maxX)
      .forEach((x) => range(minY, maxY).forEach((y) => {
        const coord = new CubeCoord(x, y);
        if (distance(coord, center) <= radius) {
          const child = this.makeChild(coord, division);

          // console.log('rad', radius, 'making child of ', this.id, 'at', x, y, child.localId);
          if (overwrite || !this.children.has(child.localId)) {
            this.children.set(child.localId, child);
          }
        }
      }));
  }

  setLocal(name, value, unit) {
    if (unit) {
      const q = Qty(value, unit);
      this.setLocal(name, q);
      return;
    }
    this.props.set(name, value);
  }

  getLocal(name) {
    return this.props.get(name);
  }

  set(name, value, unit) {
    if (unit) {
      const q = Qty(value, unit);
      this.set(name, q);
      return;
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

    if (!this.parent) return null;
    if (this.parent === this) {
      console.log('FRY!!!');
      return;
    }

    let value = this.parent.get(name);
    if (is.number(value)) value /= this.division;
    if (value instanceof Qty) value = value.div(this.division);
    this.set(name, value);
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

  generate(prop) {
    this.setLocal(prop, this.parent.generators.get(prop)(this));
  }
}

proppify(GalacticContainer)
  .addProp('children', () => new Map())
  .addProp('generators', () => new Map())
  .addProp('props', () => new Map())
  .addProp('division', 100, 'number')
  .addProp('coord', () => new CubeCoord(0, 0), 'object')
  .addProp('parent');

export default GalacticContainer;
