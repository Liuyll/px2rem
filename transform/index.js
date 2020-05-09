import { Platform } from 'react-native';

const hasSet = typeof Set === 'function';

const NO_TRANSFORM_SET = typeof Set === 'function'
    ? new Set([
        'flex',
        'opacity',
        'fontWeight',
        'scaleX',
        'scaleY',
        'scale',
        'perspective'
    ])
    : Array([
        'flex',
        'opacity',
        'fontWeight',
        'scaleX',
        'scaleY',
        'scale',
        'perspective'
    ]);

/**
 * 该match匹配`transform:"translateX()"`的参数
 * 实际上,rn里transform接受数组而非`transform:"translateX()"`这样的形式
 * 但考虑到未来可能会支持,依旧保留这种case
 */
const match = new RegExp(/(?<=\().*?(?=\))/); // eslint-disable-line

function handleObject(obj, unit) {
    for (const k in obj) {
        const v = obj[k];

        if (
            Object.prototype.toString.call(v) === '[object Object]' ||
            Object.prototype.toString.call(v) === '[object Array]'
        ) {
            handleObject(v, unit);
        }

        if (hasSet) {
            if (NO_TRANSFORM_SET.has(k)) continue;
        } else if (!~NO_TRANSFORM_SET.indexOf(k)) continue;

        if (typeof v === 'number') obj[k] = (unit * v) + 'rem';
    }
}

/**
 * @param {*} unit 单个px对应rem,一般标准宽度为375,在我们的adapter里,标准宽度下字体为37.5px,所以unit默认为1 / 37.5
 * @param {*} noSet 用户提供的不包含在转换列表的属性
 */
export default function transform(styles, unit = 1 / 37.5, noSet) {
    if (noSet) noSet.forEach(v => hasSet ? NO_TRANSFORM_SET.add(v) : NO_TRANSFORM_SET.push(v));

    if (Platform.OS === 'web') {
        const transformUnit = unit || 1 / 37.5;
        if (Object.prototype.toString.call(styles) !== '[object Object]') {
            throw new Error('style must be plain object');
        }

        handleObject(styles, transformUnit);

        return styles;
    }

    return styles;
}