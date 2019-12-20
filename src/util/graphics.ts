import { each, isEmpty, isNumber } from '@antv/util';
import { Coordinate, IShape } from '../dependents';
import { ShapeInfo } from '../interface';

// 获取图形的包围盒
function getPointsBox(points) {
  if (isEmpty(points)) {
    return null;
  }

  let minX = points[0].x;
  let maxX = points[0].x;
  let minY = points[0].y;
  let maxY = points[0].y;
  each(points, (point) => {
    minX = minX > point.x ? point.x : minX;
    maxX = maxX < point.x ? point.x : maxX;
    minY = minY > point.y ? point.y : minY;
    maxY = maxY < point.y ? point.y : maxY;
  });

  return {
    minX,
    maxX,
    minY,
    maxY,
    centerX: (minX + maxX) / 2,
    centerY: (minY + maxY) / 2,
  };
}

/**
 * 根据弧度计算极坐标系下的坐标点
 * @param centerX
 * @param centerY
 * @param radius
 * @param angleInRadian
 * @returns
 */
export function polarToCartesian(centerX: number, centerY: number, radius: number, angleInRadian: number) {
  return {
    x: centerX + radius * Math.cos(angleInRadian),
    y: centerY + radius * Math.sin(angleInRadian),
  };
}

/**
 * 根据起始角度计算绘制扇形的 path
 * @param centerX
 * @param centerY
 * @param radius
 * @param startAngleInRadian
 * @param endAngleInRadian
 * @returns
 */
export function getSectorPath(
  centerX: number,
  centerY: number,
  radius: number,
  startAngleInRadian: number,
  endAngleInRadian: number
) {
  const start = polarToCartesian(centerX, centerY, radius, endAngleInRadian);
  const end = polarToCartesian(centerX, centerY, radius, startAngleInRadian);

  if (endAngleInRadian - startAngleInRadian === Math.PI * 2) {
    return [
      ['M', centerX, centerY],
      ['m', -radius, 0],
      ['a', radius, radius, 0, 1, 0, radius * 2, 0],
      ['a', radius, radius, 0, 1, 0, -radius * 2, 0],
    ];
  }

  const arcSweep = endAngleInRadian - startAngleInRadian <= Math.PI ? 0 : 1;
  return [
    ['M', start.x, start.y],
    ['A', radius, radius, 0, arcSweep, 0, end.x, end.y],
    ['L', centerX, centerY],
    ['L', start.x, start.y],
  ];
}

/**
 * 从数据模型中的 points 换算角度
 * @param shapeModel
 * @param coordinate
 * @returns
 */
export function getAngle(shapeModel: ShapeInfo, coordinate: Coordinate) {
  const points = shapeModel.points;
  const box = getPointsBox(points);
  let endAngle;
  let startAngle;
  const { startAngle: coordStartAngle, endAngle: coordEndAngle } = coordinate;
  const diffAngle = coordEndAngle - coordStartAngle;

  if (coordinate.isTransposed) {
    endAngle = box.maxY * diffAngle;
    startAngle = box.minY * diffAngle;
  } else {
    endAngle = box.maxX * diffAngle;
    startAngle = box.minX * diffAngle;
  }
  endAngle += coordStartAngle;
  startAngle += coordStartAngle;
  return {
    startAngle,
    endAngle,
  };
}

// 计算多边形重心: https://en.wikipedia.org/wiki/Centroid#Of_a_polygon
export function getPolygonCentroid(xs: number | number[], ys: number | number[]) {
  if (isNumber(xs) && isNumber(ys)) {
    // 普通色块图，xs 和 ys 是数值
    return [xs, ys];
  }
  let i = -1;
  let x = 0;
  let y = 0;
  let former;
  let current = (xs as number[]).length - 1;
  let diff;
  let k = 0;
  while (++i < (xs as number[]).length) {
    former = current;
    current = i;
    k += diff = xs[former] * ys[current] - xs[current] * ys[former];
    x += (xs[former] + xs[current]) * diff;
    y += (ys[former] + ys[current]) * diff;
  }
  k *= 3;
  return [x / k, y / k];
}

// 获取需要替换的属性，如果原先图形元素存在，而新图形不存在，则设置 undefined
export function getReplaceAttrs(sourceShape: IShape, targetShape: IShape) {
  const originAttrs = sourceShape.attr();
  const newAttrs = targetShape.attr();
  each(originAttrs, (v, k) => {
    if (newAttrs[k] === undefined) {
      newAttrs[k] = undefined;
    }
  });
  return newAttrs;
}
