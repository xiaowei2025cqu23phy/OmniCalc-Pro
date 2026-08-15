
import * as math from 'mathjs';

/**
 * 本地离线求解引擎
 * 目标：用模式识别 + mathjs 本地能力覆盖常见场景，减少对 AI 的依赖。
 * 识别失败时返回 null，由调用方回退到 AI。
 */

export interface LocalSolveResult {
  value: string;
  steps: string[];
  explanation: string;
  method: 'local';
}

/* ============================================================
 * 通用工具
 * ============================================================ */

const CONST_SYMBOLS = ['i', 'e', 'pi', 'Infinity', 'true', 'false', 'NaN', 'tau'];

/** 按逗号/分号拆分多等式 */
const splitEquations = (query: string): string[] =>
  query.split(/[,;]/).map(s => s.trim()).filter(Boolean);

/** 等式 → f = lhs - rhs（无等号视为 f = 0） */
const toFunctionExpr = (eq: string): string => {
  if (eq.includes('=')) {
    const [l, r] = eq.split('=');
    return `(${l.trim()}) - (${r.trim()})`;
  }
  return eq.trim();
};

/** 收集表达式中出现的符号变量（排除数学常数与函数名） */
export const collectVariables = (expr: string, exclude: string[] = []): string[] => {
  try {
    const names: string[] = [];
    const walk = (node: any) => {
      if (!node) return;
      if (node.isSymbolNode && !CONST_SYMBOLS.includes(node.name) && !exclude.includes(node.name)) {
        names.push(node.name);
      }
      if (node.isParenthesisNode) {
        // mathjs 括号节点：内容在 .content
        walk(node.content);
        return;
      }
      if (node.isFunctionNode) {
        // 仅遍历函数参数，函数名（如 sin）不作为变量
        node.args.forEach(walk);
        return;
      }
      if (Array.isArray(node.args)) node.args.forEach(walk);
    };
    walk(math.parse(expr));
    return [...new Set(names)];
  } catch {
    return [];
  }
};

const isFiniteNum = (v: any): v is number => typeof v === 'number' && isFinite(v);

/** 编译并安全求值，非有限数返回 null */
const makeEvaluator = (expr: string) => {
  let compiled: any = null;
  try { compiled = math.compile(expr); } catch { return null; }
  return (scope: Record<string, number>): number | null => {
    try {
      const v = compiled.evaluate(scope);
      return isFiniteNum(v) ? v : null;
    } catch { return null; }
  };
};

/** 通用浮点格式化 */
const fmt = (n: number): string => {
  if (!isFinite(n)) return n > 0 ? '∞' : n < 0 ? '-∞' : 'NaN';
  const cleaned = Math.round(n * 1e10) / 1e10;
  if (Number.isInteger(cleaned)) return cleaned.toString();
  return String(parseFloat(cleaned.toPrecision(10)));
};

/* ============================================================
 * 一元方程求解
 * ============================================================ */

/** 尝试二次方程解析解（含复数根）。返回 [根1, 根2, 判别式] 或 null。 */
const tryQuadratic = (expr: string, v: string): [string, string, number] | null => {
  const f = makeEvaluator(expr);
  if (!f) return null;
  const scope0 = { [v]: 0 };
  const c0 = f(scope0);
  if (c0 === null) return null;

  // 一阶/二阶导数系数
  let c1: number | null = null, c2: number | null = null;
  try {
    const d1 = math.derivative(expr, v);
    const d1f = makeEvaluator(d1.toString());
    c1 = d1f ? d1f(scope0) : null;
    const d2 = math.derivative(d1, v);
    const d2f = makeEvaluator(d2.toString());
    c2 = d2f ? d2f(scope0) / 2 : null;
  } catch { /* 非多项式 */ }

  if (c1 === null || c2 === null) return null;

  // 二次拟合验证：采样若干点，f(x) ≈ c0 + c1x + c2x²
  for (const x of [-3, -1.5, -0.7, 0.7, 1.5, 3]) {
    const fx = f({ [v]: x });
    if (fx === null) continue;
    const fit = c0 + c1 * x + c2 * x * x;
    const scale = Math.max(1, Math.abs(fx));
    if (Math.abs(fx - fit) > 1e-7 * scale) return null; // 非线性 → 不是二次
  }

  // 解析求根（支持复数判别式）
  const a = c2, b = c1, c = c0;
  if (Math.abs(a) < 1e-12) {
    // 退化为一次
    if (Math.abs(b) < 1e-12) return null;
    const single = fmt(-c / b);
    return [single, single, 0];
  }
  const disc = math.sqrt(math.complex(b * b - 4 * a * c, 0)) as any;
  const x1 = math.divide(math.subtract(math.multiply(-1, b), disc), math.multiply(2, a)) as any;
  const x2 = math.divide(math.add(math.multiply(-1, b), disc), math.multiply(2, a)) as any;
  const r1 = `${x1.re === 0 ? '' : fmt(x1.re)}${x1.im === 0 ? '' : (x1.im < 0 ? '-' : '+') + (Math.abs(x1.im) === 1 ? '' : fmt(Math.abs(x1.im))) + 'i'}` || '0';
  const r2 = `${x2.re === 0 ? '' : fmt(x2.re)}${x2.im === 0 ? '' : (x2.im < 0 ? '-' : '+') + (Math.abs(x2.im) === 1 ? '' : fmt(Math.abs(x2.im))) + 'i'}` || '0';
  const discReal = b * b - 4 * a * c;
  return [r1, r2, discReal];
};

/** 数值求根：区间扫描变号 + 二分精化（实根） */
const numericRoots = (f: (x: number) => number | null, range: [number, number] = [-50, 50], samples = 600): number[] => {
  const roots: number[] = [];
  const step = (range[1] - range[0]) / samples;
  let prevX = range[0];
  let prevY = f(prevX);

  for (let i = 1; i <= samples; i++) {
    const x = range[0] + i * step;
    const y = f(x);
    // 变号或精确为零（采样点恰为根）
    const signChange = (prevY !== null && y !== null) && ((prevY > 0 && y < 0) || (prevY < 0 && y > 0));
    if (signChange || y === 0) {
      // 二分精化
      let lo = prevX, hi = x, flo = prevY;
      for (let k = 0; k < 60; k++) {
        const mid = (lo + hi) / 2;
        const fm = f(mid);
        if (fm === null) break;
        if (fm === 0) { lo = hi = mid; break; }
        if (flo * fm < 0) { hi = mid; } else { lo = mid; flo = fm; }
      }
      const root = (lo + hi) / 2;
      const fv = f(root);
      // 根有效性：f 有限且接近 0（排除 1/x 型奇点变号）
      if (fv !== null && Math.abs(fv) < 1e-6 * Math.max(1, Math.abs(root))) {
        roots.push(Math.round(root * 1e8) / 1e8);
      }
    }
    prevX = x; prevY = y;
  }

  // 去重（合并相邻根）
  const dedup: number[] = [];
  for (const r of roots) {
    if (!dedup.some(d => Math.abs(d - r) < 1e-6)) dedup.push(r);
  }
  return dedup.sort((a, b) => a - b);
};

/** 一元方程本地求解入口 */
const solveUnivariate = (expr: string, v: string): LocalSolveResult | null => {
  const steps: string[] = [`将方程化为 f(${v}) = 0 的标准形式`, `识别变量 ${v} 并调用本地求解引擎`];

  // 1. 解析二次
  const quad = tryQuadratic(expr, v);
  if (quad) {
    const [r1, r2, disc] = quad;
    if (disc >= 0) {
      const roots = r1 === r2 ? [r1] : [r1, r2];
      steps.push(`判别式 Δ = ${fmt(disc)} ≥ 0，为两个实根`, `由求根公式得到解`);
      return {
        value: roots.length === 1 ? `${v} = ${roots[0]}（重根）` : `${v} = ${roots.join(' 或 ')}`,
        explanation: `一元二次方程，判别式 Δ = ${fmt(disc)}，已通过解析求根公式求解。`,
        steps,
        method: 'local'
      };
    }
    steps.push(`判别式 Δ = ${fmt(disc)} < 0，为一对共轭复根`);
    return {
      value: `${v} = ${r1} 或 ${v} = ${r2}`,
      explanation: `一元二次方程，判别式 Δ = ${fmt(disc)} < 0，解为一对共轭复根。`,
      steps,
      method: 'local'
    };
  }

  // 2. 通用数值求根
  const f = makeEvaluator(expr);
  if (!f) return null;
  const evalFn = (x: number) => f({ [v]: x });
  const roots = numericRoots(evalFn);
  if (roots.length === 0) return null;

  steps.push(`在 [-50, 50] 区间扫描符号变化点，二分法精化`, `检测到 ${roots.length} 个实根`);
  return {
    value: roots.map(r => `${v} = ${fmt(r)}`).join('；'),
    explanation: `无法解析求解，采用本地数值求根（区间扫描 + 二分法），找到 ${roots.length} 个实根。`,
    steps,
    method: 'local'
  };
};

/* ============================================================
 * 线性方程组求解
 * ============================================================ */

const solveLinearSystem = (eqs: string[], variables: string[]): LocalSolveResult | null => {
  const n = variables.length;
  if (eqs.length !== n || n < 2) return null;

  try {
    const A: number[][] = [];
    const b: number[] = [];
    const zeroScope: Record<string, number> = {};
    variables.forEach(v => { zeroScope[v] = 0; });

    for (const eq of eqs) {
      const expr = toFunctionExpr(eq);
      const row: number[] = [];
      for (const v of variables) {
        const d = math.derivative(expr, v);
        const dExpr = d.toString();
        // 线性验证：偏导数中不应再出现任何变量
        if (collectVariables(dExpr).length > 0) return null;
        const dEval = makeEvaluator(dExpr);
        const coeff = dEval ? dEval(zeroScope) : null;
        if (coeff === null) return null;
        row.push(coeff);
      }
      const fEval = makeEvaluator(expr);
      const f0 = fEval ? fEval(zeroScope) : null;
      if (f0 === null) return null;
      b.push(-f0);
      A.push(row);
    }

    // 唯一解检查
    const det = math.det(A);
    if (Math.abs(det) < 1e-10) return null; // 奇异/无穷解 → 回退

    const sol = math.lusolve(A, b) as any;
    // lusolve 返回形态兼容：Matrix（matrix 参数）或嵌套数组（array 参数）
    const raw: any = sol && typeof sol.toArray === 'function' ? sol.toArray() : sol;
    const flatArr: number[] = (Array.isArray(raw) && raw.length > 0 && Array.isArray(raw[0]) ? raw.flat() : raw).map((x: any) => {
      const re = typeof x === 'number' ? x : (x && x.re !== undefined ? x.re : NaN);
      return re;
    });

    return {
      value: variables.map((v, i) => `${v} = ${fmt(flatArr[i])}`).join('，'),
      explanation: `检测到 ${n} 元线性方程组，系数矩阵行列式 det = ${fmt(det)} ≠ 0，通过 LU 分解求得唯一解。`,
      steps: [
        '将方程组化为标准形 Ax = b',
        `构造系数矩阵 A（${n}×${n}）与常数列 b`,
        '验证 det(A) ≠ 0，唯一解存在',
        '调用 mathjs lusolve 完成 LU 分解求解'
      ],
      method: 'local'
    };
  } catch {
    return null;
  }
};

/* ============================================================
 * 方程求解主入口
 * ============================================================ */

export const solveEquationLocal = (query: string): LocalSolveResult | null => {
  const eqs = splitEquations(query);
  if (eqs.length === 0) return null;

  try {
    // 收集全部变量
    const exprForms = eqs.map(toFunctionExpr);
    const variables = [...new Set(exprForms.flatMap(e => collectVariables(e)))];
    if (variables.length === 0) return null;

    // 单方程单变量 → 一元求解
    if (eqs.length === 1 && variables.length === 1) {
      return solveUnivariate(exprForms[0], variables[0]);
    }

    // 方程数 = 变量数 ≥ 2 → 线性方程组
    if (eqs.length === variables.length && variables.length >= 2) {
      const linear = solveLinearSystem(eqs, variables);
      if (linear) return linear;
    }

    return null;
  } catch {
    return null;
  }
};

/* ============================================================
 * 微积分：数值极限 / 定积分 / 符号不定积分
 * ============================================================ */

/** 数值极限（双侧逼近） */
export const numericLimit = (expr: string, v: string, target: number): LocalSolveResult | null => {
  const f = makeEvaluator(expr);
  if (!f) return null;
  const evalAt = (x: number) => f({ [v]: x });

  const epsilons = [1e-2, 1e-3, 1e-4, 1e-5, 1e-6, 1e-7, 1e-8];
  const left: number[] = [], right: number[] = [];
  for (const e of epsilons) {
    const l = evalAt(target - e);
    const r = evalAt(target + e);
    if (l === null || r === null) continue;
    left.push(l); right.push(r);
  }
  if (left.length < 3) return null;

  // 收敛检查：最细粒度两侧一致
  const lFinal = left[left.length - 1], rFinal = right[right.length - 1];
  if (Math.abs(lFinal - rFinal) > 1e-4 * Math.max(1, Math.abs(lFinal))) return null;

  // 双侧极限：取两侧收敛值均值
  const limit = (lFinal + rFinal) / 2;
  if (!isFinite(limit)) return null;

  return {
    value: fmt(limit),
    explanation: `数值极限：x → ${fmt(target)} 双侧逼近收敛至 ${fmt(limit)}（ε 从 1e-2 缩至 1e-8）。`,
    steps: [
      `从左右两侧以 ε = 1e-2 … 1e-8 逼近 x = ${fmt(target)}`,
      '检查两侧收敛值一致（相对误差 < 1e-4）',
      `得到极限 ≈ ${fmt(limit)}`
    ],
    method: 'local'
  };
};

/** Simpson 数值定积分 */
export const numericIntegral = (expr: string, v: string, a: number, b: number): LocalSolveResult | null => {
  const f = makeEvaluator(expr);
  if (!f) return null;
  const n = 2048;
  const h = (b - a) / n;
  const fa = f({ [v]: a });
  const fb = f({ [v]: b });
  if (fa === null || fb === null) return null;

  let sum = fa + fb;
  for (let i = 1; i < n; i++) {
    const x = a + i * h;
    const fx = f({ [v]: x });
    if (fx === null) return null;
    sum += fx * (i % 2 === 0 ? 2 : 4);
  }
  const result = (sum * h) / 3;
  if (!isFinite(result)) return null;

  return {
    value: fmt(result),
    explanation: `数值定积分（复合 Simpson 法，${n} 个子区间）：∫[${fmt(a)}, ${fmt(b)}] ${expr} d${v} ≈ ${fmt(result)}。`,
    steps: [
      `将区间 [${fmt(a)}, ${fmt(b)}] 均匀划分为 ${n} 个子区间`,
      '应用复合 Simpson 公式加权求和',
      `积分值 ≈ ${fmt(result)}`
    ],
    method: 'local'
  };
};

/** 符号不定积分（基础规则表，项级分解） */
export const symbolicIntegral = (expr: string, v: string): LocalSolveResult | null => {
  try {
    const node = math.parse(expr);
    if (!node) return null;
    // 变量检查
    const vars = collectVariables(expr);
    if (vars.length !== 1 || vars[0] !== v) return null;

    // 拆解加法项
    const terms: { coeff: number; node: any; sign: number }[] = [];
    const flatten = (n: any, sign: number) => {
      if (n.isOperatorNode && (n.op === '+' || n.op === '-')) {
        flatten(n.args[0], sign);
        flatten(n.args[1], n.op === '-' ? -sign : sign);
      } else {
        terms.push({ coeff: sign, node: n, sign });
      }
    };
    flatten(node, 1);

    // 每项积分
    const integrated: string[] = [];
    for (const t of terms) {
      const res = integrateTerm(t.node, v, t.coeff);
      if (!res) return null; // 遇到无法处理的项 → 整体回退
      if (res) integrated.push(res);
    }

    const value = integrated.join(' + ');
    return {
      value: `∫ ${expr} d${v} = ${value} + C`,
      explanation: '通过本地符号积分规则表逐项积分（多项式、指数、三角等基本函数族）。',
      steps: ['识别被积表达式', '按加减法拆分为基本项', '逐项套用积分公式', '合并结果并添加积分常数 C'],
      method: 'local'
    };
  } catch {
    return null;
  }
};

/** 单项积分规则 */
const integrateTerm = (node: any, v: string, sign: number): string | null => {
  const s = (str: string) => (sign < 0 ? `-${str}` : str);

  // 常数
  if (node.isConstantNode) {
    const c = Number(node.value);
    if (!isFinite(c)) return null;
    return s(`${fmt(c)}*${v}`);
  }

  // 变量本身 x^1
  if (node.isSymbolNode && node.name === v) {
    return s(`${v}^2/2`);
  }

  // 幂函数 x^n
  if (node.isOperatorNode && node.op === '^' && node.args[0].isSymbolNode && node.args[0].name === v) {
    const expNode = node.args[1];
    if (expNode.isConstantNode) {
      const n = Number(expNode.value);
      if (!isFinite(n) || n === -1) {
        // x^-1 → ln|x|（仅当显式负指数）
        return n === -1 ? s(`ln|${v}|`) : null;
      }
      return s(`${v}^${fmt(n + 1)}/${fmt(n + 1)}`);
    }
    // e^(kx) 形式：exp 由 functionNode 处理
    return null;
  }

  // 乘法：常数 × 函数
  if (node.isOperatorNode && node.op === '*') {
    // 提取常数因子
    const constArgs = node.args.filter((a: any) => a.isConstantNode);
    const funcArgs = node.args.filter((a: any) => !a.isConstantNode);
    if (constArgs.length > 0 && funcArgs.length === 1) {
      const c = constArgs.reduce((acc: number, a: any) => acc * Number(a.value), 1);
      const sub = integrateTerm(funcArgs[0], v, sign * (c < 0 ? -1 : 1));
      if (!sub) return null;
      const abs = fmt(Math.abs(c));
      const prefix = abs === '1' ? '' : `${abs}*`;
      return `${sign < 0 && sub.startsWith('-') ? '' : ''}${prefix}${sub}`;
    }
    // 两个函数相乘（无常数）→ 无法直接处理（如 x*sin(x) 需分部积分）
    return null;
  }

  // 除法：常数/函数 或 函数/常数
  if (node.isOperatorNode && node.op === '/') {
    const [num, den] = node.args;
    if (den.isConstantNode) {
      const c = Number(den.value);
      if (!isFinite(c) || c === 0) return null;
      const sub = integrateTerm(num, v, sign);
      if (!sub) return null;
      return `${fmt(1 / c) === '1' ? '' : fmt(1 / c) + '*'}${sub}`;
    }
    if (num.isConstantNode && den.isSymbolNode && den.name === v) {
      return s(`${fmt(Number(num.value))}*ln|${v}|`);
    }
    return null;
  }

  // 函数节点：exp/sin/cos/sinh/cosh/ln
  if (node.isFunctionNode) {
    const name = node.fn.name;
    const args = node.args;
    if (args.length === 1 && args[0].isSymbolNode && args[0].name === v) {
      switch (name) {
        case 'exp': return s(`exp(${v})`);
        case 'sin': return s(`-cos(${v})`);
        case 'cos': return s(`sin(${v})`);
        case 'sinh': return s(`cosh(${v})`);
        case 'cosh': return s(`sinh(${v})`);
        case 'ln': return s(`${v}*ln(${v}) - ${v}`);
        case 'log': return s(`${v}*ln(${v}) - ${v}`);
        default: return null;
      }
    }
    // 复合：sin(k*x), cos(k*x), exp(k*x), e^(k*x)
    if (args.length === 1) {
      const inner = args[0];
      if (inner.isOperatorNode && inner.op === '*' ) {
        const kArg = inner.args.find((a: any) => a.isConstantNode);
        const vArg = inner.args.find((a: any) => a.isSymbolNode && a.name === v);
        if (kArg && vArg) {
          const k = Number(kArg.value);
          if (!isFinite(k) || k === 0) return null;
          const kStr = fmt(k);
          switch (name) {
            case 'exp': return s(`exp(${kStr}*${v})/${kStr}`);
            case 'sin': return s(`-cos(${kStr}*${v})/${kStr}`);
            case 'cos': return s(`sin(${kStr}*${v})/${kStr}`);
            case 'sinh': return s(`cosh(${kStr}*${v})/${kStr}`);
            case 'cosh': return s(`sinh(${kStr}*${v})/${kStr}`);
            default: return null;
          }
        }
      }
    }
    return null;
  }

  // 幂函数复合：x^n 已处理；a^x 不支持
  return null;
};

/* ============================================================
 * 积分变换查表（Laplace / Fourier）
 * ============================================================ */

/** 规范化输入：去空格、统一乘号、小写 */
const normExpr = (s: string): string => s.replace(/\s+/g, '').replace(/\*/g, '*').toLowerCase();

/** 参数归一：数字原样保留/格式化，字母参数原样保留 */
const param = (s: string | undefined, def = '1'): string => {
  if (!s || s === '') return def;
  const n = Number(s);
  return isFinite(n) ? fmt(n) : s;
};

/** 参数平方：数字计算平方，字母保留 (p)² 形式 */
const sq = (p: string): string => {
  const n = Number(p);
  return isFinite(n) ? fmt(n * n) : `(${p})^2`;
};

interface TransformRule {
  name: string;
  test: (norm: string) => string | null; // 返回格式化结果或 null
  desc: string;
}

const LAPLACE_RULES: TransformRule[] = [
  {
    name: '狄拉克冲激',
    test: (s) => (s === 'delta(t)' || s === 'δ(t)' ? '1' : null),
    desc: 'L{δ(t)} = 1'
  },
  {
    name: '单位阶跃',
    test: (s) => {
      if (s === 'u(t)' || s === '1*u(t)') return '1/s';
      const m = s.match(/^([\d.a-z]+)\*u\(t\)$/);
      return m ? `${param(m[1])}/s` : null;
    },
    desc: 'L{u(t)} = 1/s'
  },
  {
    name: '常数',
    test: (s) => {
      if (/^[\d.]+$/.test(s)) return `${s}/s`;
      return null;
    },
    desc: 'L{c} = c/s'
  },
  {
    name: '幂函数',
    test: (s) => {
      if (s === 't') return '1/s^2';
      const m = s.match(/^t\^(\d+)$/);
      if (m) {
        const n = Number(m[1]);
        if (n > 0) {
          let fact = '1';
          for (let i = 2; i <= n; i++) fact = `${fact}*${i}`;
          return `${fact}/s^${n + 1}`;
        }
      }
      return null;
    },
    desc: 'L{tⁿ} = n!/sⁿ⁺¹'
  },
  {
    name: '指数衰减',
    test: (s) => {
      // e^(-a*t) 或 exp(-a*t)（可带 u(t)），参数支持数字或字母
      const m = s.match(/^(?:e|exp)\^?\(\s*-?\s*([\d.a-z]*)\s*\*?\s*t\s*\)\s*(?:\*u\(t\))?$/);
      if (m) {
        const a = param(m[1]);
        return `1/(s+${a})`;
      }
      return null;
    },
    desc: 'L{e^(-at)} = 1/(s+a)'
  },
  {
    name: '正弦信号',
    test: (s) => {
      const m = s.match(/^sin\(\s*([\d.a-z]*)\s*\*?\s*t\s*\)$/);
      if (m) {
        const w = param(m[1]);
        return `${w}/(s^2+${sq(w)})`;
      }
      return null;
    },
    desc: 'L{sin(ωt)} = ω/(s²+ω²)'
  },
  {
    name: '余弦信号',
    test: (s) => {
      const m = s.match(/^cos\(\s*([\d.a-z]*)\s*\*?\s*t\s*\)$/);
      if (m) {
        const w = param(m[1]);
        return `s/(s^2+${sq(w)})`;
      }
      return null;
    },
    desc: 'L{cos(ωt)} = s/(s²+ω²)'
  },
  {
    name: '双曲正弦',
    test: (s) => {
      const m = s.match(/^sinh\(\s*([\d.a-z]*)\s*\*?\s*t\s*\)$/);
      if (m) {
        const w = param(m[1]);
        return `${w}/(s^2-${sq(w)})`;
      }
      return null;
    },
    desc: 'L{sinh(ωt)} = ω/(s²-ω²)'
  },
  {
    name: '双曲余弦',
    test: (s) => {
      const m = s.match(/^cosh\(\s*([\d.a-z]*)\s*\*?\s*t\s*\)$/);
      if (m) {
        const w = param(m[1]);
        return `s/(s^2-${sq(w)})`;
      }
      return null;
    },
    desc: 'L{cosh(ωt)} = s/(s²-ω²)'
  },
  {
    name: '衰减正弦',
    test: (s) => {
      // e^(-a t) sin(b t)
      const m = s.match(/^(?:e|exp)\^?\(\s*-?\s*([\d.a-z]*)\s*\*?\s*t\s*\)\s*\*\s*sin\(\s*([\d.a-z]*)\s*\*?\s*t\s*\)$/);
      if (m) {
        const a = param(m[1]), b = param(m[2]);
        return `${b}/((s+${a})^2+${sq(b)})`;
      }
      return null;
    },
    desc: 'L{e^(-at)sin(bt)} = b/((s+a)²+b²)'
  },
  {
    name: '衰减余弦',
    test: (s) => {
      const m = s.match(/^(?:e|exp)\^?\(\s*-?\s*([\d.a-z]*)\s*\*?\s*t\s*\)\s*\*\s*cos\(\s*([\d.a-z]*)\s*\*?\s*t\s*\)$/);
      if (m) {
        const a = param(m[1]), b = param(m[2]);
        return `(s+${a})/((s+${a})^2+${sq(b)})`;
      }
      return null;
    },
    desc: 'L{e^(-at)cos(bt)} = (s+a)/((s+a)²+b²)'
  },
  {
    name: 't·指数',
    test: (s) => {
      const m = s.match(/^t\s*\*\s*(?:e|exp)\^?\(\s*-?\s*([\d.a-z]*)\s*\*?\s*t\s*\)$/);
      if (m) {
        const a = param(m[1]);
        return `1/(s+${a})^2`;
      }
      return null;
    },
    desc: 'L{t·e^(-at)} = 1/(s+a)²'
  }
];

const FOURIER_RULES: TransformRule[] = [
  {
    name: '狄拉克冲激',
    test: (s) => (s === 'delta(t)' || s === 'δ(t)' ? '1' : null),
    desc: 'F{δ(t)} = 1'
  },
  {
    name: '常数信号',
    test: (s) => (/^[\d.]+$/.test(s) ? `2π·δ(ω)` : null),
    desc: 'F{c} = 2πc·δ(ω)'
  },
  {
    name: '单位阶跃',
    test: (s) => (s === 'u(t)' ? 'πδ(ω) + 1/(iω)' : null),
    desc: 'F{u(t)} = πδ(ω)+1/(iω)'
  },
  {
    name: '双边指数',
    test: (s) => {
      const m = s.match(/^(?:e|exp)\^?\(\s*-?\s*([\d.a-z]*)\s*\*\s*\|t\|\s*\)$/);
      if (m) {
        const a = param(m[1]);
        return `2*${a}/(${sq(a)}+ω^2)`;
      }
      return null;
    },
    desc: 'F{e^(-a|t|)} = 2a/(a²+ω²)'
  },
  {
    name: '高斯脉冲',
    test: (s) => {
      const m = s.match(/^(?:e|exp)\^?\(\s*-?\s*([\d.a-z]*)\s*\*\s*t\^2\s*\)$/);
      if (m) {
        const a = param(m[1]);
        return `√(π/${a})·e^(-ω²/(4·${a}))`;
      }
      return null;
    },
    desc: 'F{e^(-at²)} = √(π/a)·e^(-ω²/4a)'
  },
  {
    name: '矩形窗（sinc）',
    test: (s) => {
      const m = s.match(/^rect\(\s*t\s*\/\s*([\d.a-z]*)\s*\)$/);
      if (m) {
        const T = param(m[1]);
        return `${T}·sinc(ω·${T}/2)`;
      }
      return null;
    },
    desc: 'F{rect(t/T)} = T·sinc(ωT/2)'
  }
];

export const solveTransformLocal = (query: string, type: 'Laplace' | 'Fourier'): LocalSolveResult | null => {
  // 提取右侧函数 f(t) = ...
  const eqMatch = query.match(/=\s*(.+)$/);
  const raw = eqMatch ? eqMatch[1] : query;
  const normalized = normExpr(raw);

  const rules = type === 'Laplace' ? LAPLACE_RULES : FOURIER_RULES;
  for (const rule of rules) {
    const result = rule.test(normalized);
    if (result !== null) {
      return {
        value: result,
        explanation: `通过本地变换表识别为「${rule.name}」：${rule.desc}。`,
        steps: [`识别输入为 ${rule.name} 形式`, `匹配本地变换对照表`, `输出变换结果 ${result}`],
        method: 'local'
      };
    }
  }
  return null;
};
