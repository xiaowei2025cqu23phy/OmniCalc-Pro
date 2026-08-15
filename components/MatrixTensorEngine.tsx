
import React, { useState } from 'react';
import * as math from 'mathjs';
import { Copy, Check, Grid3x3, Sigma, AlertTriangle, Rows3, Sparkles } from 'lucide-react';

/* ============================================================
 * 矩阵输出类型检测与格式化工具
 * ============================================================ */

type ResultKind = 'matrix' | 'vector' | 'scalar' | 'complex' | 'fraction' | 'eigs' | 'array' | 'error' | 'other';

const detectKind = (r: any): ResultKind => {
  if (typeof r === 'string') return 'error';
  if (r && r.values && Array.isArray(r.values)) return 'eigs'; // eigs() 结构 {values, vectors}
  if (r && (r.isMatrix || r instanceof math.Matrix)) return 'matrix';
  if (Array.isArray(r)) return Array.isArray(r[0]) ? 'matrix' : 'vector';
  if (typeof r === 'number') return 'scalar';
  if (r && r.type === 'Complex') return 'complex';
  if (r && r.type === 'Fraction') return 'fraction';
  return 'other';
};

/** 数值格式化：消除浮点尾差，整数直显，其余保留至多 8 位有效数字 */
const fmtNum = (n: number): string => {
  if (!isFinite(n)) return n > 0 ? '∞' : n < 0 ? '-∞' : 'NaN';
  const cleaned = Math.round(n * 1e10) / 1e10;
  if (Number.isInteger(cleaned)) return cleaned.toString();
  const s = cleaned.toPrecision(8);
  return String(parseFloat(s));
};

/** 任意 mathjs 元素 → 可读字符串 */
const fmtElement = (v: any): string => {
  if (typeof v === 'number') return fmtNum(v);
  if (typeof v === 'boolean') return String(v);
  if (typeof v === 'string') return v;
  if (!v || typeof v !== 'object') return String(v);
  switch (v.type) {
    case 'Complex': {
      const re = v.re, im = v.im;
      const reS = fmtNum(re);
      const imAbs = fmtNum(Math.abs(im));
      const imPart = (imAbs === '1' ? '' : imAbs) + 'i';
      if (re === 0 && im === 0) return '0';
      if (re === 0) return (im < 0 ? '-' : '') + imPart;
      if (im === 0) return reS;
      return `${reS} ${im < 0 ? '-' : '+'} ${imPart}`;
    }
    case 'Fraction':
      return `${v.n}/${v.d}`;
    case 'BigNumber':
      return v.toString();
    case 'Unit':
      return v.toString();
    default:
      return v.toString ? v.toString() : JSON.stringify(v);
  }
};

/** 矩阵 → 嵌套数组 */
const toArray = (r: any): any[][] => {
  if (r && (r.isMatrix || r instanceof math.Matrix)) return r.toArray();
  return r;
};

const matrixToArrayText = (data: any[][]): string =>
  '[' + data.map(row => '[' + row.map(fmtElement).join(', ') + ']').join(', ') + ']';

const matrixToLatex = (data: any[][]): string =>
  '\\begin{bmatrix}\n' +
  data.map(row => row.map(fmtElement).join(' & ')).join(' \\\\\n') +
  '\n\\end{bmatrix}';

/* ============================================================
 * 矩阵括号 + 网格渲染组件
 * ============================================================ */

const MatrixGrid: React.FC<{ data: any[][] }> = ({ data }) => {
  const rows = data.length;
  const cols = rows > 0 && Array.isArray(data[0]) ? data[0].length : 0;
  return (
    <div className="flex items-stretch justify-center gap-1 w-full">
      {/* 左括号 */}
      <div className="w-2.5 rounded-l-lg border-l-4 border-y-4 border-emerald-500/70 my-2 shrink-0" />
      <div className="overflow-x-auto overflow-y-auto max-h-[320px] min-w-0">
        <table className="border-collapse">
          <tbody>
            {data.map((row, i) => (
              <tr key={i}>
                {row.map((cell, j) => (
                  <td key={j} className="px-3 py-1.5 text-right font-mono text-[13px] text-emerald-200 whitespace-nowrap">
                    {fmtElement(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* 右括号 */}
      <div className="w-2.5 rounded-r-lg border-r-4 border-y-4 border-emerald-500/70 my-2 shrink-0" />
    </div>
  );
};

/* ============================================================
 * 主组件
 * ============================================================ */

const MatrixTensorEngine: React.FC = () => {
  const [matrixA, setMatrixA] = useState('[[1, 2], [3, 4]]');
  const [matrixB, setMatrixB] = useState('[[5, 6], [7, 8]]');
  const [operation, setOperation] = useState('multiply(A, B)');
  const [result, setResult] = useState<any>(null);
  const [copied, setCopied] = useState<'array' | 'latex' | null>(null);

  const compute = (override?: string) => {
    const op = typeof override === 'string' && override.trim() ? override : operation;
    try {
      const A = math.evaluate(matrixA);
      const B = math.evaluate(matrixB);
      const res = math.evaluate(op, { A, B });
      setResult(res);
    } catch (e: any) {
      setResult('错误: ' + e.message);
    }
  };

  const handleCopy = async (mode: 'array' | 'latex') => {
    if (!result) return;
    const kind = detectKind(result);
    let text = '';
    if (kind === 'matrix') text = mode === 'latex' ? matrixToLatex(toArray(result)) : matrixToArrayText(toArray(result));
    else if (kind === 'vector') text = mode === 'latex' ? matrixToLatex([toArray(result)]) : matrixToArrayText([toArray(result)]);
    else if (kind === 'eigs') text = `values: ${JSON.stringify(result.values.map(fmtElement))}`;
    else text = fmtElement(result);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(mode);
      setTimeout(() => setCopied(null), 1800);
    } catch { /* 剪贴板不可用时静默 */ }
  };

  /** 结果内容渲染 */
  const renderResultContent = () => {
    if (result === null || result === undefined) return null;
    const kind = detectKind(result);

    if (kind === 'error') {
      return (
        <div className="flex items-start gap-3 text-amber-300">
          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <div className="font-bold text-sm mb-1">运算未成功</div>
            <div className="text-xs text-amber-200/80 font-mono break-all">{result.replace(/^错误:\s*/, '')}</div>
          </div>
        </div>
      );
    }

    if (kind === 'matrix') {
      const data = toArray(result);
      return <MatrixGrid data={data} />;
    }

    if (kind === 'vector') {
      return <MatrixGrid data={[toArray(result)]} />;
    }

    if (kind === 'scalar') {
      return <div className="text-4xl font-black text-emerald-300 math-font text-center py-4">{fmtNum(result)}</div>;
    }

    if (kind === 'complex') {
      return (
        <div className="text-center py-4">
          <div className="text-4xl font-black text-emerald-300 math-font">{fmtElement(result)}</div>
          <div className="mt-2 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
            模长 {fmtNum(result.abs())} · 辐角 {fmtNum(result.arg())} rad
          </div>
        </div>
      );
    }

    if (kind === 'fraction') {
      return <div className="text-4xl font-black text-emerald-300 math-font text-center py-4">{fmtElement(result)}</div>;
    }

    if (kind === 'eigs') {
      const values = result.values.map((v: any) => fmtElement(v));
      const eigenvectors: { value: any; vector: any[] }[] = result.eigenvectors || [];
      // 特征向量列并排 → 转置为行矩阵便于展示
      const vecCols = eigenvectors.map(ev => ev.vector || []);
      const nRows = vecCols.length > 0 ? Math.max(...vecCols.map(c => c.length)) : 0;
      const vecMatrix = Array.from({ length: nRows }, (_, j) => vecCols.map(col => col[j] !== undefined ? col[j] : ''));
      return (
        <div className="space-y-4">
          <div>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-emerald-400" /> 特征值 (Eigenvalues)
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {values.map((v: string, i: number) => (
                <span key={i} className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg font-mono text-sm text-emerald-200">
                  λ{i+1} = {v}
                </span>
              ))}
            </div>
          </div>
          {eigenvectors.length > 0 && (
            <div>
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
                特征向量矩阵（每列对应一个 λ）
              </div>
              <MatrixGrid data={vecMatrix} />
            </div>
          )}
        </div>
      );
    }

    // 其他类型（对象/未识别）
    return (
      <pre className="math-font text-sm text-emerald-200/90 whitespace-pre-wrap break-all max-h-[320px] overflow-y-auto">
        {JSON.stringify(result, null, 2)}
      </pre>
    );
  };

  /** 结果类型徽章 */
  const renderKindBadge = () => {
    if (!result) return null;
    const kind = detectKind(result);
    if (kind === 'error') {
      return <span className="px-2.5 py-1 bg-red-500/15 border border-red-500/30 rounded-full text-[10px] font-bold text-red-300">执行失败</span>;
    }
    if (kind === 'matrix') {
      const data = toArray(result);
      const rows = data.length;
      const cols = rows > 0 && Array.isArray(data[0]) ? data[0].length : 0;
      return (
        <span className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500/15 border border-emerald-500/30 rounded-full text-[10px] font-bold text-emerald-300">
          <Grid3x3 className="w-3 h-3" /> {rows}×{cols} 矩阵
        </span>
      );
    }
    if (kind === 'vector') return <span className="px-2.5 py-1 bg-emerald-500/15 border border-emerald-500/30 rounded-full text-[10px] font-bold text-emerald-300">向量</span>;
    if (kind === 'scalar') return <span className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500/15 border border-emerald-500/30 rounded-full text-[10px] font-bold text-emerald-300"><Sigma className="w-3 h-3" /> 标量</span>;
    if (kind === 'complex') return <span className="px-2.5 py-1 bg-emerald-500/15 border border-emerald-500/30 rounded-full text-[10px] font-bold text-emerald-300">复数</span>;
    if (kind === 'fraction') return <span className="px-2.5 py-1 bg-emerald-500/15 border border-emerald-500/30 rounded-full text-[10px] font-bold text-emerald-300">分数</span>;
    if (kind === 'eigs') return <span className="px-2.5 py-1 bg-emerald-500/15 border border-emerald-500/30 rounded-full text-[10px] font-bold text-emerald-300">特征分解</span>;
    return <span className="px-2.5 py-1 bg-slate-500/20 border border-slate-500/40 rounded-full text-[10px] font-bold text-slate-300">结果</span>;
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-orange-600">
          矩阵与张量工作台
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">矩阵 A</label>
            <textarea
              value={matrixA}
              onChange={(e) => setMatrixA(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 math-font text-sm h-32 focus:ring-2 focus:ring-orange-500"
              placeholder="[[1, 2], [3, 4]]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">矩阵 B</label>
            <textarea
              value={matrixB}
              onChange={(e) => setMatrixB(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 math-font text-sm h-32 focus:ring-2 focus:ring-orange-500"
              placeholder="[[5, 6], [7, 8]]"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={operation}
            onChange={(e) => setOperation(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && compute()}
            className="flex-1 px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none math-font"
            placeholder="例如: inv(A), det(A), A * B, transpose(A)"
          />
          <button
            onClick={compute}
            className="px-6 py-2 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700 transition-colors"
          >
            开始执行
          </button>
        </div>

        {result !== null && (
          <div className="mt-6 animate-in fade-in duration-300">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Rows3 className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">计算输出</span>
                {renderKindBadge()}
              </div>
              <div className="flex items-center gap-2">
                {detectKind(result) !== 'error' && (
                  <>
                    <button
                      onClick={() => handleCopy('array')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold border border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white transition-all"
                      title="复制为可直接粘贴的数组格式"
                    >
                      {copied === 'array' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      {copied === 'array' ? '已复制' : '复制数组'}
                    </button>
                    <button
                      onClick={() => handleCopy('latex')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold border border-slate-600 text-slate-300 hover:bg-slate-700 hover:text-white transition-all"
                      title="复制为 LaTeX bmatrix 格式"
                    >
                      {copied === 'latex' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      {copied === 'latex' ? '已复制' : '复制 LaTeX'}
                    </button>
                  </>
                )}
              </div>
            </div>
            <div className="p-6 bg-slate-900 rounded-2xl border border-slate-800 shadow-inner min-h-[80px]">
              {renderResultContent()}
            </div>
          </div>
        )}
      </div>

      <div className="bg-slate-100 p-4 rounded-xl">
        <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">常用运算符速览（点击即算）</h4>
        <div className="flex flex-wrap gap-2 mb-3">
          {['inv(A)', 'det(A)', 'transpose(A)', 'eigs(A)', 'trace(A)', 'pinv(A)', 'norm(A)'].map(tag => (
            <span key={tag} className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-mono text-slate-600 cursor-pointer hover:border-orange-300 hover:bg-orange-50" onClick={() => { setOperation(tag); compute(tag); }}>
              {tag}
            </span>
          ))}
        </div>
        <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">示例运算（点击即算）</h4>
        <div className="flex flex-wrap gap-2">
          {['A * B', 'A^2', 'det(A * B)', 'inv(A) * B', 'transpose(A) + B', 'cross([1,2,3], [4,5,6])', 'dot([1,2,3], [4,5,6])'].map(tag => (
            <span key={tag} className="px-2 py-1 bg-orange-50 border border-orange-100 rounded text-xs font-mono text-orange-600 cursor-pointer hover:border-orange-300 hover:bg-orange-100" onClick={() => { setOperation(tag); compute(tag); }}>
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MatrixTensorEngine;
