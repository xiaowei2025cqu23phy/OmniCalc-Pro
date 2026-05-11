
import * as math from 'mathjs';

/**
 * 尝试本地符号化处理数学表达式
 */
export const localSymbolicSolve = (expr: string) => {
  try {
    // 处理形如 diff(sin(x), x) 的本地求导
    if (expr.toLowerCase().startsWith('diff(') || expr.toLowerCase().startsWith('derivative(')) {
      // 提取内部表达式，例如 diff(x^2, x) -> x^2
      const match = expr.match(/\(([^,]+),?\s*([^)]+)?\)/);
      if (match) {
        const target = match[1].trim();
        const variable = match[2]?.trim() || 'x';
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
  
  const compiledExprs = expressions.map(expr => {
    try {
      return { expr, compiled: math.compile(expr) };
    } catch (e) {
      return null;
    }
  }).filter(item => item !== null);

  for (let x = min; x <= max; x += step) {
    const point: any = { x };
    let hasValue = false;
    
    compiledExprs.forEach((item, index) => {
      try {
        const y = item.compiled.evaluate({ x });
        if (typeof y === 'number' && !isNaN(y)) {
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

    for (let i = 0; i <= resolution; i++) {
      const theta = rangeTheta[0] + i * stepTheta;
      for (let j = 0; j <= resolution; j++) {
        const phi = rangePhi[0] + j * stepPhi;
        try {
          const r = compiled.evaluate({ theta, phi });
          if (typeof r === 'number' && !isNaN(r)) {
            // Spherical to Cartesian: x = r sin(phi) cos(theta), y = r sin(phi) sin(theta), z = r cos(phi)
            const x = r * Math.sin(phi) * Math.cos(theta);
            const y = r * Math.sin(phi) * Math.sin(theta);
            const z = r * Math.cos(phi);
            data.push({ x, y, z, r, theta, phi });
          }
        } catch (e) {}
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

    for (let i = 0; i <= resolution; i++) {
      const x = rangeX[0] + i * stepX;
      for (let j = 0; j <= resolution; j++) {
        const y = rangeY[0] + j * stepY;
        try {
          const z = compiled.evaluate({ x, y });
          data.push({ x, y, z });
        } catch (e) {}
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
