
const tens = (x) => {
  return Math.floor( Math.log(x) / Math.log(10) + 1)
};

[1, 10, 300, 3000, 0.1].forEach(n => {

  console.log('tens of ', n, tens(n));
})
