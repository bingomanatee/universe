import { CubeCoord, Hexes } from '@wonderlandlabs/hexagony';
import { proppify } from '@wonderlandlabs/propper';
// import * as pp from 'pointinpoly';
import is from 'is';

import lGet from './lodash/get';
import range from './lodash/range';
import sortBy from './lodash/sortBy';
import { Box2 } from './three/Box2';

const ORIGIN = new CubeCoord(0, 0, 0);

const distance = (p1) => ['x', 'y', 'z'].reduce((d, dim) => {
  const cDist = Math.abs(p1[dim]);
  return Math.max(d, cDist);
}, 0);

class HexCell {
  constructor(props = {}) {
    this.coord = lGet(props, 'coord', ORIGIN);
    this.name = lGet(props, 'name', '');
    this.parent = lGet(props, 'parent', null);
    this.divisions = lGet(props, 'divisions', 1);
    this.pointy = this.parent ? !this.parent.pointy : lGet(props, 'pointy', true);
    this.diameter = this.parent ? this.parent.diameter / ((this.divisions - 1) * Math.cos(Math.PI / 6)) : lGet(props, 'diameter', 1);
  }

  get matrix() {
    if (!this._matrix) {
      this._matrix = new Hexes({ pointy: this.pointy, scale: this.diameter });
    } else {
      this._matrix.size = this.diameter;
    }
    return this._matrix;
  }

  childExtent() {
    if (!this.size) {
      return this.toBox();
    }


    if (!this._box) {
      this._box = this.reduce((b, child) => {
        if (!b) {
          return child.toBox();
        }

        return b.union(child.toBox());
      }, null);
    }

    return this._box;
  }

  corners() {
    return this.matrix.corners(this.coord).map((c) => {
      if (this.parent) {
        return c.clone().add(this.parent.center);
      }
      return c;
    });
  }

  toBox() {
    const corners = this.corners();
    let box = new Box2(corners[0].clone(), corners[0].clone());
    corners.forEach((v) => {
      box = box.union({ min: v, max: v });
    });
    return box;
  }

  get center() {
    const scale = this.diameter;
    if (!scale) {
      console.log('undefined diameter for ', this.id);
    }
    const center = this.coord.toXY(this.matrix);
    if (this.parent) {
      return this.parent.center.add(center);
    }
    return center;
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

  forEach(fn) {
    this.children.forEach(fn);
  }

  reduce(fn, init) {
    let value = init;
    this.forEach((child) => {
      value = fn(value, child);
    });
    return value;
  }

  sumOf(prop) {
    return this.reduce((sum, child) => {
      if (is.function(prop)) {
        return prop(child) + sum;
      }
      return child.get(prop) + sum;
    }, 0);
  }

  get localId() {
    return `x${this.coord.x}y${this.coord.y}z${this.coord.z}`;
  }

  get id() {
    const prefix = this.parent ? `${this.parent.id}.` : '';
    return `${prefix}${this.name}${this.localId}`;
  }

  get localIdLong() {
    return `x${this.coord.x}y${this.coord.y}d${this.divisions}`;
  }

  get idLong() {
    const prefix = this.parent ? `${this.parent.idLong}.` : '';
    return `${prefix}${this.localIdLong}`;
  }

  makeChild(coord, divisions) {
    return new HexCell({ coord, parent: this, divisions });
  }

  /**
   * @param radius
   */
  divide(radius) {
    const divisions = 2 * radius + 1;
    this.childDivisions = divisions;

    this.children.clear();

    const corners = this.corners();

    const r = range(radius * -2, radius + 2);
    r.forEach((x) => r.forEach((y) => {
      const coord = new CubeCoord(x, y);
      if (distance(coord) <= radius) {
        const child = this.makeChild(coord, divisions);
        this.children.set(child.localId, child);
      }
    }));
  }

  set(name, value) {
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
      value /= this.divisions;
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
}

proppify(HexCell)
  .addProp('children', () => new Map())
  .addProp('generators', () => new Map())
  .addProp('props', () => new Map())
  .addProp('diameter', 1, 'number')
  .addProp('name', '', 'string')
  .addProp('divisions', 100, 'number')
  .addProp('childDivisions', 0, 'number')
  .addProp('coord', () => new CubeCoord(0, 0), 'object')
  .addProp('parent');

export default HexCell;
