"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = transform;

var _reactNative = require("react-native");

var NO_TRANSFORM_SET = Array.from(['flex', 'opacity', 'fontWeight', 'scaleX', 'scaleY', 'scale', 'perspective', 'zIndex']);
/**
 * 该match匹配`transform:"translateX()"`的参数
 * 实际上,rn里transform接受数组而非`transform:"translateX()"`这样的形式
 * 但考虑到未来可能会支持,依旧保留这种case
 * 这种写法ios白屏
 */
// const match = new RegExp(/(?<=\().*?(?=\))/); // eslint-disable-line

function handleObject(obj, unit) {
  for (var k in obj) {
    var v = obj[k];

    if (Object.prototype.toString.call(v) === '[object Object]' || Object.prototype.toString.call(v) === '[object Array]') {
      handleObject(v, unit);
    }

    if (~NO_TRANSFORM_SET.indexOf(k)) continue;
    if (k.endsWith('!')) continue;

    if (typeof v === 'number') {
      if (v === 0) continue;
      obj[k] = unit * v + 'rem';
    } else if (typeof v === 'string' && !isNaN(+v)) {
      var av = Number.parseFloat(v);
      if (av === 0) continue;
      obj[k] = unit * av + 'rem';
    }
  }
}
/**
 * @param {*} unit 单个px对应rem,一般标准宽度为375,在我们的adapter里,标准宽度下字体为37.5px,所以unit默认为1 / 37.5
 * @param {*} noSet 用户提供的不包含在转换列表的属性
 */


function transform(styles) {
  var unit = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 1 / 37.5;
  var noSet = arguments.length > 2 ? arguments[2] : undefined;
  if (noSet) noSet.forEach(function (v) {
    if (~NO_TRANSFORM_SET.indexOf(v)) return;
    NO_TRANSFORM_SET.push(v);
  });

  if (_reactNative.Platform.OS === 'web') {
    var transformUnit = unit || 1 / 37.5;

    if (Object.prototype.toString.call(styles) !== '[object Object]') {
      throw new Error('style must be plain object');
    }

    handleObject(styles, transformUnit);
    return styles;
  }

  return styles;
}