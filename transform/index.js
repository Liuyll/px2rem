import { Platform } from 'react-native';

const NO_TRANSFORM_SET = new Set([
    'flex',
    'opacity',
    'fontWeight'
]);

const TRANSFORM_PROP_NO_SET = [
    'scaleX',
    'scaleY',
    'scale',
    'perspective'
];

// 匹配translateX(1)里的参数
const match = new RegExp(/(?<=\().*?(?=\))/);
function handleObject(obj, unit) {
    for (const k in obj) {
        const v = obj[k];

        if (Object.prototype.toString.call(v) === '[object Object]') {
            handleObject(v, unit);
        }

        if (NO_TRANSFORM_SET.has(k)) continue;
        if (k === 'transform') {
            const isNotTransform = TRANSFORM_PROP_NO_SET.some(p => v.includes(p));
            if (!isNotTransform) {
                obj[k] = obj[k].replace(match, (_, $1) => {
                    return (+$1 * unit) + 'rem';
                });
            }
        }

        if (typeof v === 'number') obj[k] = (unit * v) + 'rem';
    }
}

export default function transform(styles, unit = 1 / 37.5, noSet) {
    if (noSet) noSet.forEach(v => NO_TRANSFORM_SET.add(v));
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