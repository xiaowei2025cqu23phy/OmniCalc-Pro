import * as math from "mathjs";
const CONST_SYMBOLS = ["i", "e", "pi", "Infinity", "true", "false", "NaN", "tau"];
const splitEquations = (query) => query.split(/[,;]/).map((s) => s.trim()).filter(Boolean);
const toFunctionExpr = (eq) => {
  if (eq.includes("=")) {
    const [l, r] = eq.split("=");
    return `(${l.trim()}) - (${r.trim()})`;
  }
  return eq.trim();
};
const collectVariables = (expr, exclude = []) => {
  try {
    const names = [];
    const walk = (node) => {
      if (!node) return;
      if (node.isSymbolNode && !CONST_SYMBOLS.includes(node.name) && !exclude.includes(node.name)) {
        names.push(node.name);
      }
      if (node.isParenthesisNode) {
        walk(node.content);
        return;
      }
      if (node.isFunctionNode) {
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
const isFiniteNum = (v) => typeof v === "number" && isFinite(v);
const makeEvaluator = (expr) => {
  let compiled = null;
  try {
    compiled = math.compile(expr);
  } catch {
    return null;
  }
  return (scope) => {
    try {
      const v = compiled.evaluate(scope);
      return isFiniteNum(v) ? v : null;
    } catch {
      return null;
    }
  };
};
const fmt = (n) => {
  if (!isFinite(n)) return n > 0 ? "\u221E" : n < 0 ? "-\u221E" : "NaN";
  const cleaned = Math.round(n * 1e10) / 1e10;
  if (Number.isInteger(cleaned)) return cleaned.toString();
  return String(parseFloat(cleaned.toPrecision(10)));
};
const tryQuadratic = (expr, v) => {
  const f = makeEvaluator(expr);
  if (!f) return null;
  const scope0 = { [v]: 0 };
  const c0 = f(scope0);
  if (c0 === null) return null;
  let c1 = null, c2 = null;
  try {
    const d1 = math.derivative(expr, v);
    const d1f = makeEvaluator(d1.toString());
    c1 = d1f ? d1f(scope0) : null;
    const d2 = math.derivative(d1, v);
    const d2f = makeEvaluator(d2.toString());
    c2 = d2f ? d2f(scope0) / 2 : null;
  } catch {
  }
  if (c1 === null || c2 === null) return null;
  for (const x of [-3, -1.5, -0.7, 0.7, 1.5, 3]) {
    const fx = f({ [v]: x });
    if (fx === null) continue;
    const fit = c0 + c1 * x + c2 * x * x;
    const scale = Math.max(1, Math.abs(fx));
    if (Math.abs(fx - fit) > 1e-7 * scale) return null;
  }
  const a = c2, b = c1, c = c0;
  if (Math.abs(a) < 1e-12) {
    if (Math.abs(b) < 1e-12) return null;
    const single = fmt(-c / b);
    return [single, single, 0];
  }
  const disc = math.sqrt(math.complex(b * b - 4 * a * c, 0));
  const x1 = math.divide(math.subtract(math.multiply(-1, b), disc), math.multiply(2, a));
  const x2 = math.divide(math.add(math.multiply(-1, b), disc), math.multiply(2, a));
  const r1 = `${x1.re === 0 ? "" : fmt(x1.re)}${x1.im === 0 ? "" : (x1.im < 0 ? "-" : "+") + (Math.abs(x1.im) === 1 ? "" : fmt(Math.abs(x1.im))) + "i"}` || "0";
  const r2 = `${x2.re === 0 ? "" : fmt(x2.re)}${x2.im === 0 ? "" : (x2.im < 0 ? "-" : "+") + (Math.abs(x2.im) === 1 ? "" : fmt(Math.abs(x2.im))) + "i"}` || "0";
  const discReal = b * b - 4 * a * c;
  return [r1, r2, discReal];
};
const numericRoots = (f, range = [-50, 50], samples = 600) => {
  const roots = [];
  const step = (range[1] - range[0]) / samples;
  let prevX = range[0];
  let prevY = f(prevX);
  for (let i = 1; i <= samples; i++) {
    const x = range[0] + i * step;
    const y = f(x);
    const signChange = prevY !== null && y !== null && (prevY > 0 && y < 0 || prevY < 0 && y > 0);
    if (signChange || y === 0) {
      let lo = prevX, hi = x, flo = prevY;
      for (let k = 0; k < 60; k++) {
        const mid = (lo + hi) / 2;
        const fm = f(mid);
        if (fm === null) break;
        if (fm === 0) {
          lo = hi = mid;
          break;
        }
        if (flo * fm < 0) {
          hi = mid;
        } else {
          lo = mid;
          flo = fm;
        }
      }
      const root = (lo + hi) / 2;
      const fv = f(root);
      if (fv !== null && Math.abs(fv) < 1e-6 * Math.max(1, Math.abs(root))) {
        roots.push(Math.round(root * 1e8) / 1e8);
      }
    }
    prevX = x;
    prevY = y;
  }
  const dedup = [];
  for (const r of roots) {
    if (!dedup.some((d) => Math.abs(d - r) < 1e-6)) dedup.push(r);
  }
  return dedup.sort((a, b) => a - b);
};
const solveUnivariate = (expr, v) => {
  const steps = [`\u5C06\u65B9\u7A0B\u5316\u4E3A f(${v}) = 0 \u7684\u6807\u51C6\u5F62\u5F0F`, `\u8BC6\u522B\u53D8\u91CF ${v} \u5E76\u8C03\u7528\u672C\u5730\u6C42\u89E3\u5F15\u64CE`];
  const quad = tryQuadratic(expr, v);
  if (quad) {
    const [r1, r2, disc] = quad;
    if (disc >= 0) {
      const roots2 = r1 === r2 ? [r1] : [r1, r2];
      steps.push(`\u5224\u522B\u5F0F \u0394 = ${fmt(disc)} \u2265 0\uFF0C\u4E3A\u4E24\u4E2A\u5B9E\u6839`, `\u7531\u6C42\u6839\u516C\u5F0F\u5F97\u5230\u89E3`);
      return {
        value: roots2.length === 1 ? `${v} = ${roots2[0]}\uFF08\u91CD\u6839\uFF09` : `${v} = ${roots2.join(" \u6216 ")}`,
        explanation: `\u4E00\u5143\u4E8C\u6B21\u65B9\u7A0B\uFF0C\u5224\u522B\u5F0F \u0394 = ${fmt(disc)}\uFF0C\u5DF2\u901A\u8FC7\u89E3\u6790\u6C42\u6839\u516C\u5F0F\u6C42\u89E3\u3002`,
        steps,
        method: "local"
      };
    }
    steps.push(`\u5224\u522B\u5F0F \u0394 = ${fmt(disc)} < 0\uFF0C\u4E3A\u4E00\u5BF9\u5171\u8F6D\u590D\u6839`);
    return {
      value: `${v} = ${r1} \u6216 ${v} = ${r2}`,
      explanation: `\u4E00\u5143\u4E8C\u6B21\u65B9\u7A0B\uFF0C\u5224\u522B\u5F0F \u0394 = ${fmt(disc)} < 0\uFF0C\u89E3\u4E3A\u4E00\u5BF9\u5171\u8F6D\u590D\u6839\u3002`,
      steps,
      method: "local"
    };
  }
  const f = makeEvaluator(expr);
  if (!f) return null;
  const evalFn = (x) => f({ [v]: x });
  const roots = numericRoots(evalFn);
  if (roots.length === 0) return null;
  steps.push(`\u5728 [-50, 50] \u533A\u95F4\u626B\u63CF\u7B26\u53F7\u53D8\u5316\u70B9\uFF0C\u4E8C\u5206\u6CD5\u7CBE\u5316`, `\u68C0\u6D4B\u5230 ${roots.length} \u4E2A\u5B9E\u6839`);
  return {
    value: roots.map((r) => `${v} = ${fmt(r)}`).join("\uFF1B"),
    explanation: `\u65E0\u6CD5\u89E3\u6790\u6C42\u89E3\uFF0C\u91C7\u7528\u672C\u5730\u6570\u503C\u6C42\u6839\uFF08\u533A\u95F4\u626B\u63CF + \u4E8C\u5206\u6CD5\uFF09\uFF0C\u627E\u5230 ${roots.length} \u4E2A\u5B9E\u6839\u3002`,
    steps,
    method: "local"
  };
};
const solveLinearSystem = (eqs, variables) => {
  const n = variables.length;
  if (eqs.length !== n || n < 2) return null;
  try {
    const A = [];
    const b = [];
    const zeroScope = {};
    variables.forEach((v) => {
      zeroScope[v] = 0;
    });
    for (const eq of eqs) {
      const expr = toFunctionExpr(eq);
      const row = [];
      for (const v of variables) {
        const d = math.derivative(expr, v);
        const dExpr = d.toString();
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
    const det = math.det(A);
    if (Math.abs(det) < 1e-10) return null;
    const sol = math.lusolve(A, b);
    const raw = sol && typeof sol.toArray === "function" ? sol.toArray() : sol;
    const flatArr = (Array.isArray(raw) && raw.length > 0 && Array.isArray(raw[0]) ? raw.flat() : raw).map((x) => {
      const re = typeof x === "number" ? x : x && x.re !== void 0 ? x.re : NaN;
      return re;
    });
    return {
      value: variables.map((v, i) => `${v} = ${fmt(flatArr[i])}`).join("\uFF0C"),
      explanation: `\u68C0\u6D4B\u5230 ${n} \u5143\u7EBF\u6027\u65B9\u7A0B\u7EC4\uFF0C\u7CFB\u6570\u77E9\u9635\u884C\u5217\u5F0F det = ${fmt(det)} \u2260 0\uFF0C\u901A\u8FC7 LU \u5206\u89E3\u6C42\u5F97\u552F\u4E00\u89E3\u3002`,
      steps: [
        "\u5C06\u65B9\u7A0B\u7EC4\u5316\u4E3A\u6807\u51C6\u5F62 Ax = b",
        `\u6784\u9020\u7CFB\u6570\u77E9\u9635 A\uFF08${n}\xD7${n}\uFF09\u4E0E\u5E38\u6570\u5217 b`,
        "\u9A8C\u8BC1 det(A) \u2260 0\uFF0C\u552F\u4E00\u89E3\u5B58\u5728",
        "\u8C03\u7528 mathjs lusolve \u5B8C\u6210 LU \u5206\u89E3\u6C42\u89E3"
      ],
      method: "local"
    };
  } catch {
    return null;
  }
};
const solveEquationLocal = (query) => {
  const eqs = splitEquations(query);
  if (eqs.length === 0) return null;
  try {
    const exprForms = eqs.map(toFunctionExpr);
    const variables = [...new Set(exprForms.flatMap((e) => collectVariables(e)))];
    if (variables.length === 0) return null;
    if (eqs.length === 1 && variables.length === 1) {
      return solveUnivariate(exprForms[0], variables[0]);
    }
    if (eqs.length === variables.length && variables.length >= 2) {
      const linear = solveLinearSystem(eqs, variables);
      if (linear) return linear;
    }
    return null;
  } catch {
    return null;
  }
};
const numericLimit = (expr, v, target) => {
  const f = makeEvaluator(expr);
  if (!f) return null;
  const evalAt = (x) => f({ [v]: x });
  const epsilons = [0.01, 1e-3, 1e-4, 1e-5, 1e-6, 1e-7, 1e-8];
  const left = [], right = [];
  for (const e of epsilons) {
    const l = evalAt(target - e);
    const r = evalAt(target + e);
    if (l === null || r === null) continue;
    left.push(l);
    right.push(r);
  }
  if (left.length < 3) return null;
  const lFinal = left[left.length - 1], rFinal = right[right.length - 1];
  if (Math.abs(lFinal - rFinal) > 1e-4 * Math.max(1, Math.abs(lFinal))) return null;
  const limit = (lFinal + rFinal) / 2;
  if (!isFinite(limit)) return null;
  return {
    value: fmt(limit),
    explanation: `\u6570\u503C\u6781\u9650\uFF1Ax \u2192 ${fmt(target)} \u53CC\u4FA7\u903C\u8FD1\u6536\u655B\u81F3 ${fmt(limit)}\uFF08\u03B5 \u4ECE 1e-2 \u7F29\u81F3 1e-8\uFF09\u3002`,
    steps: [
      `\u4ECE\u5DE6\u53F3\u4E24\u4FA7\u4EE5 \u03B5 = 1e-2 \u2026 1e-8 \u903C\u8FD1 x = ${fmt(target)}`,
      "\u68C0\u67E5\u4E24\u4FA7\u6536\u655B\u503C\u4E00\u81F4\uFF08\u76F8\u5BF9\u8BEF\u5DEE < 1e-4\uFF09",
      `\u5F97\u5230\u6781\u9650 \u2248 ${fmt(limit)}`
    ],
    method: "local"
  };
};
const numericIntegral = (expr, v, a, b) => {
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
  const result = sum * h / 3;
  if (!isFinite(result)) return null;
  return {
    value: fmt(result),
    explanation: `\u6570\u503C\u5B9A\u79EF\u5206\uFF08\u590D\u5408 Simpson \u6CD5\uFF0C${n} \u4E2A\u5B50\u533A\u95F4\uFF09\uFF1A\u222B[${fmt(a)}, ${fmt(b)}] ${expr} d${v} \u2248 ${fmt(result)}\u3002`,
    steps: [
      `\u5C06\u533A\u95F4 [${fmt(a)}, ${fmt(b)}] \u5747\u5300\u5212\u5206\u4E3A ${n} \u4E2A\u5B50\u533A\u95F4`,
      "\u5E94\u7528\u590D\u5408 Simpson \u516C\u5F0F\u52A0\u6743\u6C42\u548C",
      `\u79EF\u5206\u503C \u2248 ${fmt(result)}`
    ],
    method: "local"
  };
};
const symbolicIntegral = (expr, v) => {
  try {
    const node = math.parse(expr);
    if (!node) return null;
    const vars = collectVariables(expr);
    if (vars.length !== 1 || vars[0] !== v) return null;
    const terms = [];
    const flatten = (n, sign) => {
      if (n.isOperatorNode && (n.op === "+" || n.op === "-")) {
        flatten(n.args[0], sign);
        flatten(n.args[1], n.op === "-" ? -sign : sign);
      } else {
        terms.push({ coeff: sign, node: n, sign });
      }
    };
    flatten(node, 1);
    const integrated = [];
    for (const t of terms) {
      const res = integrateTerm(t.node, v, t.coeff);
      if (!res) return null;
      if (res) integrated.push(res);
    }
    const value = integrated.join(" + ");
    return {
      value: `\u222B ${expr} d${v} = ${value} + C`,
      explanation: "\u901A\u8FC7\u672C\u5730\u7B26\u53F7\u79EF\u5206\u89C4\u5219\u8868\u9010\u9879\u79EF\u5206\uFF08\u591A\u9879\u5F0F\u3001\u6307\u6570\u3001\u4E09\u89D2\u7B49\u57FA\u672C\u51FD\u6570\u65CF\uFF09\u3002",
      steps: ["\u8BC6\u522B\u88AB\u79EF\u8868\u8FBE\u5F0F", "\u6309\u52A0\u51CF\u6CD5\u62C6\u5206\u4E3A\u57FA\u672C\u9879", "\u9010\u9879\u5957\u7528\u79EF\u5206\u516C\u5F0F", "\u5408\u5E76\u7ED3\u679C\u5E76\u6DFB\u52A0\u79EF\u5206\u5E38\u6570 C"],
      method: "local"
    };
  } catch {
    return null;
  }
};
const integrateTerm = (node, v, sign) => {
  const s = (str) => sign < 0 ? `-${str}` : str;
  if (node.isConstantNode) {
    const c = Number(node.value);
    if (!isFinite(c)) return null;
    return s(`${fmt(c)}*${v}`);
  }
  if (node.isSymbolNode && node.name === v) {
    return s(`${v}^2/2`);
  }
  if (node.isOperatorNode && node.op === "^" && node.args[0].isSymbolNode && node.args[0].name === v) {
    const expNode = node.args[1];
    if (expNode.isConstantNode) {
      const n = Number(expNode.value);
      if (!isFinite(n) || n === -1) {
        return n === -1 ? s(`ln|${v}|`) : null;
      }
      return s(`${v}^${fmt(n + 1)}/${fmt(n + 1)}`);
    }
    return null;
  }
  if (node.isOperatorNode && node.op === "*") {
    const constArgs = node.args.filter((a) => a.isConstantNode);
    const funcArgs = node.args.filter((a) => !a.isConstantNode);
    if (constArgs.length > 0 && funcArgs.length === 1) {
      const c = constArgs.reduce((acc, a) => acc * Number(a.value), 1);
      const sub = integrateTerm(funcArgs[0], v, sign * (c < 0 ? -1 : 1));
      if (!sub) return null;
      const abs = fmt(Math.abs(c));
      const prefix = abs === "1" ? "" : `${abs}*`;
      return `${sign < 0 && sub.startsWith("-") ? "" : ""}${prefix}${sub}`;
    }
    return null;
  }
  if (node.isOperatorNode && node.op === "/") {
    const [num, den] = node.args;
    if (den.isConstantNode) {
      const c = Number(den.value);
      if (!isFinite(c) || c === 0) return null;
      const sub = integrateTerm(num, v, sign);
      if (!sub) return null;
      return `${fmt(1 / c) === "1" ? "" : fmt(1 / c) + "*"}${sub}`;
    }
    if (num.isConstantNode && den.isSymbolNode && den.name === v) {
      return s(`${fmt(Number(num.value))}*ln|${v}|`);
    }
    return null;
  }
  if (node.isFunctionNode) {
    const name = node.fn.name;
    const args = node.args;
    if (args.length === 1 && args[0].isSymbolNode && args[0].name === v) {
      switch (name) {
        case "exp":
          return s(`exp(${v})`);
        case "sin":
          return s(`-cos(${v})`);
        case "cos":
          return s(`sin(${v})`);
        case "sinh":
          return s(`cosh(${v})`);
        case "cosh":
          return s(`sinh(${v})`);
        case "ln":
          return s(`${v}*ln(${v}) - ${v}`);
        case "log":
          return s(`${v}*ln(${v}) - ${v}`);
        default:
          return null;
      }
    }
    if (args.length === 1) {
      const inner = args[0];
      if (inner.isOperatorNode && inner.op === "*") {
        const kArg = inner.args.find((a) => a.isConstantNode);
        const vArg = inner.args.find((a) => a.isSymbolNode && a.name === v);
        if (kArg && vArg) {
          const k = Number(kArg.value);
          if (!isFinite(k) || k === 0) return null;
          const kStr = fmt(k);
          switch (name) {
            case "exp":
              return s(`exp(${kStr}*${v})/${kStr}`);
            case "sin":
              return s(`-cos(${kStr}*${v})/${kStr}`);
            case "cos":
              return s(`sin(${kStr}*${v})/${kStr}`);
            case "sinh":
              return s(`cosh(${kStr}*${v})/${kStr}`);
            case "cosh":
              return s(`sinh(${kStr}*${v})/${kStr}`);
            default:
              return null;
          }
        }
      }
    }
    return null;
  }
  return null;
};
const normExpr = (s) => s.replace(/\s+/g, "").replace(/\*/g, "*").toLowerCase();
const param = (s, def = "1") => {
  if (!s || s === "") return def;
  const n = Number(s);
  return isFinite(n) ? fmt(n) : s;
};
const sq = (p) => {
  const n = Number(p);
  return isFinite(n) ? fmt(n * n) : `(${p})^2`;
};
const LAPLACE_RULES = [
  {
    name: "\u72C4\u62C9\u514B\u51B2\u6FC0",
    test: (s) => s === "delta(t)" || s === "\u03B4(t)" ? "1" : null,
    desc: "L{\u03B4(t)} = 1"
  },
  {
    name: "\u5355\u4F4D\u9636\u8DC3",
    test: (s) => {
      if (s === "u(t)" || s === "1*u(t)") return "1/s";
      const m = s.match(/^([\d.a-z]+)\*u\(t\)$/);
      return m ? `${param(m[1])}/s` : null;
    },
    desc: "L{u(t)} = 1/s"
  },
  {
    name: "\u5E38\u6570",
    test: (s) => {
      if (/^[\d.]+$/.test(s)) return `${s}/s`;
      return null;
    },
    desc: "L{c} = c/s"
  },
  {
    name: "\u5E42\u51FD\u6570",
    test: (s) => {
      if (s === "t") return "1/s^2";
      const m = s.match(/^t\^(\d+)$/);
      if (m) {
        const n = Number(m[1]);
        if (n > 0) {
          let fact = "1";
          for (let i = 2; i <= n; i++) fact = `${fact}*${i}`;
          return `${fact}/s^${n + 1}`;
        }
      }
      return null;
    },
    desc: "L{t\u207F} = n!/s\u207F\u207A\xB9"
  },
  {
    name: "\u6307\u6570\u8870\u51CF",
    test: (s) => {
      const m = s.match(/^(?:e|exp)\^?\(\s*-?\s*([\d.a-z]*)\s*\*?\s*t\s*\)\s*(?:\*u\(t\))?$/);
      if (m) {
        const a = param(m[1]);
        return `1/(s+${a})`;
      }
      return null;
    },
    desc: "L{e^(-at)} = 1/(s+a)"
  },
  {
    name: "\u6B63\u5F26\u4FE1\u53F7",
    test: (s) => {
      const m = s.match(/^sin\(\s*([\d.a-z]*)\s*\*?\s*t\s*\)$/);
      if (m) {
        const w = param(m[1]);
        return `${w}/(s^2+${sq(w)})`;
      }
      return null;
    },
    desc: "L{sin(\u03C9t)} = \u03C9/(s\xB2+\u03C9\xB2)"
  },
  {
    name: "\u4F59\u5F26\u4FE1\u53F7",
    test: (s) => {
      const m = s.match(/^cos\(\s*([\d.a-z]*)\s*\*?\s*t\s*\)$/);
      if (m) {
        const w = param(m[1]);
        return `s/(s^2+${sq(w)})`;
      }
      return null;
    },
    desc: "L{cos(\u03C9t)} = s/(s\xB2+\u03C9\xB2)"
  },
  {
    name: "\u53CC\u66F2\u6B63\u5F26",
    test: (s) => {
      const m = s.match(/^sinh\(\s*([\d.a-z]*)\s*\*?\s*t\s*\)$/);
      if (m) {
        const w = param(m[1]);
        return `${w}/(s^2-${sq(w)})`;
      }
      return null;
    },
    desc: "L{sinh(\u03C9t)} = \u03C9/(s\xB2-\u03C9\xB2)"
  },
  {
    name: "\u53CC\u66F2\u4F59\u5F26",
    test: (s) => {
      const m = s.match(/^cosh\(\s*([\d.a-z]*)\s*\*?\s*t\s*\)$/);
      if (m) {
        const w = param(m[1]);
        return `s/(s^2-${sq(w)})`;
      }
      return null;
    },
    desc: "L{cosh(\u03C9t)} = s/(s\xB2-\u03C9\xB2)"
  },
  {
    name: "\u8870\u51CF\u6B63\u5F26",
    test: (s) => {
      const m = s.match(/^(?:e|exp)\^?\(\s*-?\s*([\d.a-z]*)\s*\*?\s*t\s*\)\s*\*\s*sin\(\s*([\d.a-z]*)\s*\*?\s*t\s*\)$/);
      if (m) {
        const a = param(m[1]), b = param(m[2]);
        return `${b}/((s+${a})^2+${sq(b)})`;
      }
      return null;
    },
    desc: "L{e^(-at)sin(bt)} = b/((s+a)\xB2+b\xB2)"
  },
  {
    name: "\u8870\u51CF\u4F59\u5F26",
    test: (s) => {
      const m = s.match(/^(?:e|exp)\^?\(\s*-?\s*([\d.a-z]*)\s*\*?\s*t\s*\)\s*\*\s*cos\(\s*([\d.a-z]*)\s*\*?\s*t\s*\)$/);
      if (m) {
        const a = param(m[1]), b = param(m[2]);
        return `(s+${a})/((s+${a})^2+${sq(b)})`;
      }
      return null;
    },
    desc: "L{e^(-at)cos(bt)} = (s+a)/((s+a)\xB2+b\xB2)"
  },
  {
    name: "t\xB7\u6307\u6570",
    test: (s) => {
      const m = s.match(/^t\s*\*\s*(?:e|exp)\^?\(\s*-?\s*([\d.a-z]*)\s*\*?\s*t\s*\)$/);
      if (m) {
        const a = param(m[1]);
        return `1/(s+${a})^2`;
      }
      return null;
    },
    desc: "L{t\xB7e^(-at)} = 1/(s+a)\xB2"
  }
];
const FOURIER_RULES = [
  {
    name: "\u72C4\u62C9\u514B\u51B2\u6FC0",
    test: (s) => s === "delta(t)" || s === "\u03B4(t)" ? "1" : null,
    desc: "F{\u03B4(t)} = 1"
  },
  {
    name: "\u5E38\u6570\u4FE1\u53F7",
    test: (s) => /^[\d.]+$/.test(s) ? `2\u03C0\xB7\u03B4(\u03C9)` : null,
    desc: "F{c} = 2\u03C0c\xB7\u03B4(\u03C9)"
  },
  {
    name: "\u5355\u4F4D\u9636\u8DC3",
    test: (s) => s === "u(t)" ? "\u03C0\u03B4(\u03C9) + 1/(i\u03C9)" : null,
    desc: "F{u(t)} = \u03C0\u03B4(\u03C9)+1/(i\u03C9)"
  },
  {
    name: "\u53CC\u8FB9\u6307\u6570",
    test: (s) => {
      const m = s.match(/^(?:e|exp)\^?\(\s*-?\s*([\d.a-z]*)\s*\*\s*\|t\|\s*\)$/);
      if (m) {
        const a = param(m[1]);
        return `2*${a}/(${sq(a)}+\u03C9^2)`;
      }
      return null;
    },
    desc: "F{e^(-a|t|)} = 2a/(a\xB2+\u03C9\xB2)"
  },
  {
    name: "\u9AD8\u65AF\u8109\u51B2",
    test: (s) => {
      const m = s.match(/^(?:e|exp)\^?\(\s*-?\s*([\d.a-z]*)\s*\*\s*t\^2\s*\)$/);
      if (m) {
        const a = param(m[1]);
        return `\u221A(\u03C0/${a})\xB7e^(-\u03C9\xB2/(4\xB7${a}))`;
      }
      return null;
    },
    desc: "F{e^(-at\xB2)} = \u221A(\u03C0/a)\xB7e^(-\u03C9\xB2/4a)"
  },
  {
    name: "\u77E9\u5F62\u7A97\uFF08sinc\uFF09",
    test: (s) => {
      const m = s.match(/^rect\(\s*t\s*\/\s*([\d.a-z]*)\s*\)$/);
      if (m) {
        const T = param(m[1]);
        return `${T}\xB7sinc(\u03C9\xB7${T}/2)`;
      }
      return null;
    },
    desc: "F{rect(t/T)} = T\xB7sinc(\u03C9T/2)"
  }
];
const solveTransformLocal = (query, type) => {
  const eqMatch = query.match(/=\s*(.+)$/);
  const raw = eqMatch ? eqMatch[1] : query;
  const normalized = normExpr(raw);
  const rules = type === "Laplace" ? LAPLACE_RULES : FOURIER_RULES;
  for (const rule of rules) {
    const result = rule.test(normalized);
    if (result !== null) {
      return {
        value: result,
        explanation: `\u901A\u8FC7\u672C\u5730\u53D8\u6362\u8868\u8BC6\u522B\u4E3A\u300C${rule.name}\u300D\uFF1A${rule.desc}\u3002`,
        steps: [`\u8BC6\u522B\u8F93\u5165\u4E3A ${rule.name} \u5F62\u5F0F`, `\u5339\u914D\u672C\u5730\u53D8\u6362\u5BF9\u7167\u8868`, `\u8F93\u51FA\u53D8\u6362\u7ED3\u679C ${result}`],
        method: "local"
      };
    }
  }
  return null;
};
export {
  collectVariables,
  numericIntegral,
  numericLimit,
  solveEquationLocal,
  solveTransformLocal,
  symbolicIntegral
};
