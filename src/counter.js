function s(n) {
  let out = '';
  for (let i = 0; i < n; i += 1) out += '  ';
  return out;
}


function q(v) {
  return `"${v}"`;
}

function lt(v) {
  return v.replace(/^[ ]+/, '');
}

function stringify(value, pretty, depth = 0) {
  if (Array.isArray(value)) {
    if (pretty) {
      return [
        `[`,
       value.map((item) => (`${stringify(item, true, + 1)}`))
          .join(','),
        `${s(depth)}]`,
      ].join('\n');
    }
    return `[${value.map((item) => stringify(item)).join(',')}]`;
  }
  if (value === null) {
    return 'null';
  }
  if (typeof value === 'object') {
    const keys = Object.keys(value);

    if (pretty) {
      return [
       '{',
        ...keys.map((key) => {
          return `${s(depth + 1)}${q(key)}:${(key[value])}`
        }).join(','),
        s(depth) + '}',
      ].join('\n');
    }
    if (keys.length < 1) {
      return '{}';
    }
    return `{${keys.map((key) => `${q(key)}:${stringify(value[key])}`).join(',')}}`;
  }
  if (typeof value === 'string') {
    if (pretty) {
      return s(depth) + q(value);
    }
    return q(value);
  }
  if (pretty) {
    return s(depth) + value;
  }
  return value;
}


const solution = (objStr, pretty) => {
  // Keep this here
  const sourceObject = JSON.parse(objStr);

  // Replace this with your method
  return stringify(sourceObject, pretty);
};

console.log(solution('{\n  "title": "Event Segmentation",\n  "app": 114,\n  "params": {\n    "events": [\n      {\n        "type": "Visit: Home",\n        "filters": [\n          {\n            "property": null,\n            "op": "=",\n            "values": []\n          }\n        ],\n        "groupBy": []\n      },\n      {\n        "type": "Signup",\n        "filters": [\n          {\n            "property": "Plan",\n            "op": "in",\n            "values": [\n              "enterprise",\n              "premier"\n            ]\n          },\n          {\n            "property": "Did demo",\n            "op": "=",\n            "values": [\n              true\n            ]\n          }\n        ],\n        "groupBy": []\n      }\n    ],\n    "metric": "uniques",\n    "range": "Last 30 days"\n  }\n}',
  true));
