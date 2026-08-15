
import * as math from 'mathjs';

/**
 * 尝试本地符号化处理数学表达式
 */
export const localSymbolicSolve = (expr: string) => {
  try {
    const lower = expr.toLowerCase();
    // 处理形如 diff(sin(x), x) / derivative(expr, var) 的本地求导
    if (lower.startsWith('diff(') || lower.startsWith('derivative(')) {
      const fnName = lower.startsWith('derivative(') ? 'derivative' : 'diff';
      const inner = expr.slice(fnName.length + 1, expr.lastIndexOf(')'));
      // 用括号配平的方式切分顶层逗号，避免嵌套括号被误切
      const parts = splitTopLevelArgs(inner);
      if (parts.length >= 1) {
        const target = parts[0].trim();
        const variable = (parts[1] || 'x').trim();
        const result = math.derivative(target, variable);
        return {
          value: result.toString(),
          explanation: "Computed locally using symbolic differentiation engine.",
          method: 'local'
        };
      }
    }
    
    // 普通求值
    const evaluated = math.evaluate(expr);
    return {
      value: evaluated.toString(),
      explanation: "Evaluated locally.",
      method: 'local'
    };
  } catch (err) {
    return null; // 如果本地无法处理，返回null触发AI备选
  }
};

/**
 * 按顶层逗号切分参数，忽略嵌套括号/引号内的逗号。
 * 例如 "sin(x), x" -> ["sin(x)", " x"]
 */
const splitTopLevelArgs = (s: string): string[] => {
  const parts: string[] = [];
  let depth = 0;
  let current = '';
  for (const ch of s) {
    if (ch === '(' || ch === '[' || ch === '{') depth++;
    else if (ch === ')' || ch === ']' || ch === '}') depth--;
    if (ch === ',' && depth === 0) {
      parts.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  if (current.trim() !== '' || parts.length > 0) parts.push(current);
  return parts;
};

// Fix: Use MathJS functional abs and arg as they are safer for types than methods on the Complex object
export const complexToPolar = (c: math.Complex) => {
  return {
    r: math.abs(c as any) as number,
    phi: math.arg(c as any) as number
  };
};

export const generatePlotData1D = (expressions: string[], range: [number, number], steps: number = 200) => {
  const [min, max] = range;
  const step = (max - min) / steps;
  const data = [];
  
  // 保留 null 占位（不收缩索引），确保 val_${index} 与传入列表索引严格对应，
  // 否则与渲染端 (PlotView2D) 的 dataKey 错位会导致曲线消失/错乱
  const compiledExprs = expressions.map(expr => {
    try {
      return { expr, compiled: math.compile(expr) };
    } catch (e) {
      return null;
    }
  });

  for (let x = min; x <= max; x += step) {
    const point: any = { x };
    let hasValue = false;
    
    compiledExprs.forEach((item, index) => {
      if (!item) return;
      try {
        const y = item.compiled.evaluate({ x });
        if (typeof y === 'number' && !isNaN(y) && isFinite(y)) {
          point[`val_${index}`] = y;
          hasValue = true;
        }
      } catch (e) {}
    });
    
    if (hasValue) {
      data.push(point);
    }
  }
  return data;
};

export const generateParametricData = (exprX: string, exprY: string, range: [number, number], steps: number = 200) => {
  const [min, max] = range;
  const step = (max - min) / steps;
  const data = [];
  try {
    const compiledX = math.compile(exprX);
    const compiledY = math.compile(exprY);
    for (let t = min; t <= max; t += step) {
      try {
        const x = compiledX.evaluate({ t });
        const y = compiledY.evaluate({ t });
        if (typeof x === 'number' && typeof y === 'number' && !isNaN(x) && !isNaN(y)) {
          data.push({ x, y, t });
        }
      } catch (e) {}
    }
  } catch (e) {}
  return data;
};

export const generateParametricData3D = (exprX: string, exprY: string, exprZ: string, range: [number, number], steps: number = 300) => {
  const [min, max] = range;
  const step = (max - min) / steps;
  const data = [];
  try {
    const compiledX = math.compile(exprX);
    const compiledY = math.compile(exprY);
    const compiledZ = math.compile(exprZ);
    for (let t = min; t <= max; t += step) {
      try {
        const x = compiledX.evaluate({ t });
        const y = compiledY.evaluate({ t });
        const z = compiledZ.evaluate({ t });
        if (typeof x === 'number' && typeof y === 'number' && typeof z === 'number' && !isNaN(x) && !isNaN(y) && !isNaN(z)) {
          data.push({ x, y, z, t });
        }
      } catch (e) {}
    }
  } catch (e) {}
  return data;
};

export const generatePolarData = (exprR: string, range: [number, number], steps: number = 300) => {
  const [min, max] = range; // range in radians, e.g., [0, 2*pi]
  const step = (max - min) / steps;
  const data = [];
  try {
    const compiled = math.compile(exprR);
    for (let theta = min; theta <= max; theta += step) {
      try {
        const r = compiled.evaluate({ theta });
        if (typeof r === 'number' && !isNaN(r)) {
          const x = r * Math.cos(theta);
          const y = r * Math.sin(theta);
          data.push({ x, y, r, theta });
        }
      } catch (e) {}
    }
  } catch (e) {}
  return data;
};

export const generateSphericalData = (exprR: string, rangeTheta: [number, number], rangePhi: [number, number], resolution: number = 40) => {
  const data = [];
  try {
    const compiled = math.compile(exprR);
    const stepTheta = (rangeTheta[1] - rangeTheta[0]) / resolution;
    const stepPhi = (rangePhi[1] - rangePhi[0]) / resolution;

    // 保留完整 (resolution+1)×(resolution+1) 网格，NaN 占位，避免 3D 多边形索引错位
    for (let i = 0; i <= resolution; i++) {
      const theta = rangeTheta[0] + i * stepTheta;
      for (let j = 0; j <= resolution; j++) {
        const phi = rangePhi[0] + j * stepPhi;
        try {
          const r = compiled.evaluate({ theta, phi });
          if (typeof r === 'number' && !isNaN(r) && isFinite(r)) {
            // Spherical to Cartesian: x = r sin(phi) cos(theta), y = r sin(phi) sin(theta), z = r cos(phi)
            const x = r * Math.sin(phi) * Math.cos(theta);
            const y = r * Math.sin(phi) * Math.sin(theta);
            const z = r * Math.cos(phi);
            data.push({ x, y, z, r, theta, phi });
          } else {
            data.push({ x: NaN, y: NaN, z: NaN, r: NaN, theta, phi });
          }
        } catch (e) {
          data.push({ x: NaN, y: NaN, z: NaN, r: NaN, theta, phi });
        }
      }
    }
  } catch (e) {}
  return data;
};

export const generatePlotData2D = (expr: string, rangeX: [number, number], rangeY: [number, number], resolution: number = 40) => {
  const data = [];
  try {
    const compiled = math.compile(expr);
    const stepX = (rangeX[1] - rangeX[0]) / resolution;
    const stepY = (rangeY[1] - rangeY[0]) / resolution;

    // 注意：必须保留完整的 (resolution+1)×(resolution+1) 网格结构，
    // 即便某点求值失败也要占位（用 NaN），否则 3D 曲面多边形索引会错位。
    for (let i = 0; i <= resolution; i++) {
      const x = rangeX[0] + i * stepX;
      for (let j = 0; j <= resolution; j++) {
        const y = rangeY[0] + j * stepY;
        try {
          const z = compiled.evaluate({ x, y });
          // 保留数值；非数值（如复数结果）用 NaN 占位以维持网格
          data.push({ x, y, z: typeof z === 'number' ? z : NaN });
        } catch (e) {
          data.push({ x, y, z: NaN });
        }
      }
    }
  } catch (e) {
    console.error("Plotting error", e);
  }
  return data;
};

export const generateImplicitData = (expr: string, rangeX: [number, number], rangeY: [number, number], resolution: number = 100) => {
  const points: { x: number, y: number }[] = [];
  try {
    let targetExpr = expr;
    if (expr.includes('=')) {
      const sides = expr.split('=');
      targetExpr = `(${sides[0]}) - (${sides[1]})`;
    }
    
    const compiled = math.compile(targetExpr);
    const stepX = (rangeX[1] - rangeX[0]) / resolution;
    const stepY = (rangeY[1] - rangeY[0]) / resolution;

    // Grid sampling with zero-crossing detection
    for (let i = 0; i < resolution; i++) {
      const x = rangeX[0] + i * stepX;
      for (let j = 0; j < resolution; j++) {
        const y = rangeY[0] + j * stepY;
        try {
          const v = compiled.evaluate({ x, y });
          const vRight = compiled.evaluate({ x: x + stepX, y });
          const vTop = compiled.evaluate({ x, y: y + stepY });

          // 跳过 NaN/Infinity，避免 Math.sign(NaN) 误判产生伪点
          if (!isFinite(v) || !isFinite(vRight) || !isFinite(vTop)) continue;

          // Check if there is a crossing between current point and right/top neighbors
          if (Math.sign(v) !== Math.sign(vRight) || Math.sign(v) !== Math.sign(vTop)) {
            // Linear interpolation for more accuracy
            if (Math.sign(v) !== Math.sign(vRight)) {
              const t = Math.abs(v) / (Math.abs(v) + Math.abs(vRight));
              points.push({ x: x + t * stepX, y });
            }
            if (Math.sign(v) !== Math.sign(vTop)) {
              const t = Math.abs(v) / (Math.abs(v) + Math.abs(vTop));
              points.push({ x, y: y + t * stepY });
            }
          }
        } catch (e) {}
      }
    }
  } catch (e) {
    console.error("Implicit plot error", e);
  }
  return points;
};

export const parseAndEvaluate = (expr: string) => {
  try {
    return math.evaluate(expr);
  } catch (err) {
    return "Error";
  }
};
