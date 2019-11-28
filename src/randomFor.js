import { Random, MersenneTwister19937 } from 'random-js';
import range from './lodash/range';

const stringToNum = (string) => range(0, string.length + 1)
  .reduce((value, n) => {
    const code = string.charCodeAt(n) + 1;
    if (value * code < Number.MAX_SAFE_INTEGER) {
      return value * code;
    }
    if (value + code < Number.MAX_SAFE_INTEGER) {
      return value + code;
    }
    return Math.abs(value - code);
  }, 0);

export default (seedString = 'seed') => {
  const seedInt = stringToNum(seedString);

  const engine = MersenneTwister19937.seed(seedInt);

  const rand = new Random(engine);

  return () => rand.real(0, 1);
};
