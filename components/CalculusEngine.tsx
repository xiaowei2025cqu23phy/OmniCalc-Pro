
import React, { useState, useMemo } from 'react';
import * as math from 'mathjs';
import { solveAdvancedMath } from '../services/geminiService';
import { localSymbolicSolve } from '../utils/mathUtils';
import { numericLimit, numericIntegral, symbolicIntegral } from '../utils/localSolvers';
import { MathResult, ModelType, ApiKeys } from '../types';
import { Loader2, BrainCircuit, ShieldCheck, Globe, Keyboard } from 'lucide-react';
import MathKeypad from './MathKeypad';
import ComplexPlane from './ComplexPlane';

interface CalculusEngineProps {
  model?: ModelType;
  apiKeys?: ApiKeys;
}

const CalculusEngine: React.FC<CalculusEngineProps> = ({ model = ModelType.GEMINI, apiKeys }) => {
  const [query, setQuery] = useState("diff(sin(x) * x^2, x)");
  const [loading, setLoading] = useState(false);
  const [showKeypad, setShowKeypad] = useState(true);
  const [result, setResult] = useState<(MathResult & { method?: 'local' | 'ai' }) | null>(null);

  const complexResult = useMemo(() => {
    if (!result || !result.value) return null;
    try {
      const parsed = math.evaluate(result.value);
      if (parsed && parsed.type === 'Complex') return parsed;
    } catch (e) {}
    return null;
  }, [result]);

  /** 尝试本地求解微积分问题（diff / integral / limit） */
  const tryLocalCalculus = (): (MathResult & { method?: 'local' | 'ai' }) | null => {
    const lower = query.toLowerCase().trim();

    // 1. 符号求导（diff / derivative）
    const der = localSymbolicSolve(query);
    if (der && der.method === 'local' && der.explanation !== "Evaluated locally.") {
      return {
        value: der.value,
        explanation: "已通过本地符号运算引擎求解（链式法则/乘积法则）。",
        steps: ["解析数学表达式", "应用符号求导法则（链式法则/乘积法则）", "化简并输出结果"],
        method: 'local'
      };
    }

    // 2. 定积分 integral(f, x, a, b)
    let m = lower.match(/^integral\s*\(\s*(.+?)\s*,\s*([a-z])\s*,\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\)$/);
    if (!m) m = lower.match(/^integrate\s*\(\s*(.+?)\s*,\s*([a-z])\s*,\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\)$/);
    if (!m) m = lower.match(/^int\s*\(\s*(.+?)\s*,\s*([a-z])\s*,\s*(-?[\d.]+)\s*,\s*(-?[\d.]+)\s*\)$/);
    if (m) {
      const [, fExpr, v, a, b] = m;
      const res = numericIntegral(fExpr, v, Number(a), Number(b));
      if (res) return res;
    }

    // 3. 不定积分 integral(f, x)
    m = lower.match(/^integral\s*\(\s*(.+?)\s*,\s*([a-z])\s*\)$/);
    if (!m) m = lower.match(/^integrate\s*\(\s*(.+?)\s*,\s*([a-z])\s*\)$/);
    if (!m) m = lower.match(/^int\s*\(\s*(.+?)\s*,\s*([a-z])\s*\)$/);
    if (m) {
      const [, fExpr, v] = m;
      const res = symbolicIntegral(fExpr, v);
      if (res) return res;
      // 符号积分失败 → 尝试数值定积分 [-10,10] 作为近似提示
      const approx = numericIntegral(fExpr, v, -10, 10);
      if (approx) {
        return {
          value: approx.value,
          explanation: "该不定积分超出本地规则表，已给出 [-10, 10] 区间数值近似（如需精确解析式请使用云端推理）。",
          steps: approx.steps,
          method: 'local'
        };
      }
    }

    // 4. 极限 limit(f, x, a)
    m = lower.match(/^limit\s*\(\s*(.+?)\s*,\s*([a-z])\s*,\s*(-?[\d.]+)\s*\)$/);
    if (m) {
      const [, fExpr, v, a] = m;
      const res = numericLimit(fExpr, v, Number(a));
      if (res) return res;
    }

    return null;
  };

  const handleSolve = async () => {
    setLoading(true);
    const localRes = tryLocalCalculus();
    if (localRes) {
      setResult(localRes);
      setLoading(false);
      return;
    }

    try {
      const res = await solveAdvancedMath(query, '微积分与微分方程', model, apiKeys);
      setResult({ ...res, method: 'ai' });
    } catch (e) {
      setResult({ value: "错误", explanation: "计算失败，请检查网络连接或表达式语法。", steps: [], method: 'ai' });
    }
    setLoading(false);
  };

  const handleInsert = (val: string) => setQuery(prev => prev + val);
  const handleDelete = () => setQuery(prev => prev.slice(0, -1));
  const handleClear = () => setQuery('');

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2 text-blue-600">
            <BrainCircuit className="w-5 h-5" />
            微积分与 ODE 求解器
          </h3>
          <div className="flex gap-2">
            <button 
              onClick={() => setShowKeypad(!showKeypad)}
              className={`p-2 rounded-lg transition-colors ${showKeypad ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}
            >
              <Keyboard className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        <div className="flex flex-col gap-3">
          <textarea
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none math-font h-24 text-lg"
            placeholder="例如输入 'diff(x^3, x)' 或 'y'' + y = 0'"
          />

          {showKeypad && (
            <MathKeypad 
              onInsert={handleInsert} 
              onClear={handleClear} 
              onDelete={handleDelete} 
              onConfirm={handleSolve}
              type="calculus"
            />
          )}
          
          {!showKeypad && (
            <button
              onClick={handleSolve}
              disabled={loading}
              className="w-full py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : '执行计算'}
            </button>
          )}
        </div>

        {result && (
          <div className="mt-8 space-y-4 border-t border-slate-100 pt-6">
            <div className={`p-4 rounded-xl border ${result.method === 'local' ? 'bg-green-50 border-green-100' : 'bg-blue-50 border-blue-100'}`}>
              <div className="flex justify-between items-center mb-1">
                <div className={`text-xs font-bold uppercase tracking-wider ${result.method === 'local' ? 'text-green-500' : 'text-blue-400'}`}>
                  {result.method === 'local' ? '离线解法 (本地处理)' : 'AI 生成解法 (云端推理)'}
                </div>
                <div className="flex gap-2">
                   {result.method === 'local' ? <ShieldCheck className="w-3 h-3 text-green-400" /> : <Globe className="w-3 h-3 text-blue-300" />}
                </div>
              </div>
              <div className={`text-xl font-bold math-font ${result.method === 'local' ? 'text-green-900' : 'text-blue-900'}`}>{result.value}</div>
              {complexResult && (
                <div className="mt-1 text-xs font-bold text-blue-400 font-mono">
                  极坐标: {complexResult.abs().toFixed(3)} · e<sup>i({complexResult.arg().toFixed(3)})</sup>
                </div>
              )}
              <p className="mt-2 text-xs opacity-70">{result.explanation}</p>
              {complexResult && (
                <div className="mt-4 flex justify-center">
                  <ComplexPlane c={complexResult} title="结果复平面表示" />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <div className="text-sm font-semibold text-slate-700">解题逻辑与步骤</div>
              <ul className="space-y-2">
                {result.steps?.map((step, i) => (
                  <li key={i} className="flex gap-3 text-sm text-slate-600">
                    <span className="flex-shrink-0 w-6 h-6 bg-slate-100 rounded-full flex items-center justify-center text-[10px] font-bold text-slate-500">{i+1}</span>
                    <p className="pt-0.5">{step}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-blue-50 rounded-2xl border border-blue-100 cursor-pointer hover:bg-blue-100 transition-colors" onClick={() => setQuery("diff(exp(i*x), x)")}>
          <div className="text-[10px] font-bold text-blue-600 uppercase mb-1">复数指数求导</div>
          <div className="text-xs font-mono">diff(exp(i*x), x)</div>
        </div>
        <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100 cursor-pointer hover:bg-indigo-100 transition-colors" onClick={() => setQuery("diff(sin(i*x), x)")}>
          <div className="text-[10px] font-bold text-indigo-600 uppercase mb-1">虚数参数三角函数</div>
          <div className="text-xs font-mono">diff(sin(i*x), x)</div>
        </div>
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => setQuery("integral(1/(x^2+1), x)")}>
          <div className="text-[10px] font-bold text-slate-500 uppercase mb-1">标准积分</div>
          <div className="text-xs font-mono">integral(1/(x^2+1), x)</div>
        </div>
      </div>
    </div>
  );
};

export default CalculusEngine;
