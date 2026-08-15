
import React, { useState, useMemo } from 'react';
import * as math from 'mathjs';
import { solveAdvancedMath } from '../services/geminiService';
import { solveEquationLocal } from '../utils/localSolvers';
import { MathResult, ModelType, ApiKeys } from '../types';
import { Loader2, Variable, ChevronRight, Hash, Sparkles, Keyboard, RotateCcw, ShieldCheck, Globe } from 'lucide-react';
import MathKeypad from './MathKeypad';
import ComplexPlane from './ComplexPlane';

import EquationInput from './EquationInput';

interface EquationEngineProps {
  model?: ModelType;
  apiKeys?: ApiKeys;
}

type SolverMode = 'Algebraic' | 'LinearSystems';

const EquationEngine: React.FC<EquationEngineProps> = ({ model = ModelType.GEMINI, apiKeys }) => {
  const [mode, setMode] = useState<SolverMode>('Algebraic');
  const [query, setQuery] = useState('x^2 + 5x + 6 = 0');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MathResult | null>(null);

  const complexResult = useMemo(() => {
    if (!result || !result.value || typeof result.value !== 'string') return null;
    try {
      // Try to extract a complex number from the string, e.g. "x = 2i" -> "2i"
      const cleanValue = result.value.replace(/^[a-z]\s*=\s*/i, '').trim();
      const parsed = math.evaluate(cleanValue);
      if (parsed && parsed.type === 'Complex') return parsed;
    } catch (e) {}
    return null;
  }, [result]);

  const handleSolve = async (override?: string) => {
    const q = (typeof override === 'string' && override.trim() ? override : query).trim();
    if (!q) return;
    setLoading(true);
    try {
      // 优先本地引擎：解析二次/数值求根/线性方程组
      const localRes = solveEquationLocal(q);
      if (localRes) {
        setResult({ ...localRes, method: 'local' });
        setLoading(false);
        return;
      }

      const category = mode === 'Algebraic' ? '代数方程' : '线性方程组';
      const res = await solveAdvancedMath(q, category, model, apiKeys);
      setResult({ ...res, method: 'ai' });
    } catch (e) {
      setResult({ value: "无法求解", explanation: "请确保方程格式正确。示例: x^2 - 4 = 0", method: 'ai' });
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-50 rounded-2xl">
              <Variable className="w-6 h-6 text-rose-600" />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800">方程求解工作台</h3>
              <p className="text-xs text-slate-400 font-medium tracking-tight">支持代数方程与多元线性方程组</p>
            </div>
          </div>
          <div className="flex bg-slate-100 p-1.5 rounded-2xl w-full md:w-auto">
            {(['Algebraic', 'LinearSystems'] as const).map(m => (
              <button
                key={m}
                onClick={() => { 
                  setMode(m); 
                  setQuery(m === 'Algebraic' ? 'x^2 + 5x + 6 = 0' : '2x + 3y = 7, x - y = 1'); 
                  setResult(null);
                }}
                className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${mode === m ? 'bg-white shadow-sm text-rose-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {m === 'Algebraic' ? '代数方程' : '线性方程组'}
              </button>
            ))}
          </div>
        </div>

        <EquationInput 
          value={query}
          onChange={(val) => {
            setQuery(val);
            if (val === '') setResult(null);
          }}
          onSolve={handleSolve}
          loading={loading}
          placeholder={mode === 'Algebraic' ? '输入方程，例如: x^2 - 4 = 0' : '输入方程组，用逗号分隔，例如: x+y=5, x-y=1'}
        />

        {result && (
          <div className="mt-8 space-y-6 animate-in fade-in slide-in-from-top-4">
            <div className="p-6 bg-rose-50 rounded-2xl border border-rose-100 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-5">
                 <Hash className="w-24 h-24" />
               </div>
               <div className="relative z-10">
                 <div className="flex items-center gap-2 mb-2">
                   <div className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">解析结果 (Solution)</div>
                   <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold flex items-center gap-1 ${result.method === 'local' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-500'}`}>
                     {result.method === 'local' ? <><ShieldCheck className="w-3 h-3" /> 离线引擎</> : <><Globe className="w-3 h-3" /> 云端推理</>}
                   </span>
                 </div>
                 <div className="text-3xl font-black text-slate-900 math-font mb-4">
                   {result.value}
                 </div>
                 {complexResult && (
                    <div className="mb-4 space-y-4">
                      <div className="p-3 bg-white/40 rounded-xl border border-rose-200/30">
                        <div className="text-[10px] font-bold text-rose-400 uppercase mb-2">极坐标表示</div>
                        <div className="text-sm font-bold text-rose-700 font-mono">
                          {complexResult.abs().toFixed(3)} · e<sup>i({complexResult.arg().toFixed(3)})</sup>
                        </div>
                      </div>
                      <div className="flex justify-center">
                        <ComplexPlane c={complexResult} title="根的复平面表示" />
                      </div>
                    </div>
                  )}
                 <div className="p-3 bg-white/60 backdrop-blur rounded-xl border border-rose-200/50 text-sm text-rose-900 italic">
                   {result.explanation}
                 </div>
               </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 mb-2">
                 <div className="h-px flex-1 bg-slate-100"></div>
                 <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">分步求解细节</span>
                 <div className="h-px flex-1 bg-slate-100"></div>
              </div>
              <div className="grid gap-3">
                {result.steps?.map((step, i) => (
                  <div key={i} className="flex gap-4 p-4 bg-white border border-slate-100 rounded-xl hover:border-rose-200 transition-colors group">
                    <span className="flex-shrink-0 w-6 h-6 bg-slate-50 text-slate-400 font-bold text-[10px] flex items-center justify-center rounded-lg group-hover:bg-rose-50 group-hover:text-rose-400 transition-colors italic">
                      {i + 1}
                    </span>
                    <p className="text-sm text-slate-600 leading-relaxed pt-0.5">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      <div>
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">示例（点击即算）</div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {[
            { title: '二次方程', expr: 'x^2 - 5x + 6 = 0', mode: 'Algebraic' as SolverMode, color: 'bg-rose-50 border-rose-100 hover:bg-rose-100', text: 'text-rose-600' },
            { title: '复数根', expr: 'x^2 + 1 = 0', mode: 'Algebraic' as SolverMode, color: 'bg-rose-50 border-rose-100 hover:bg-rose-100', text: 'text-rose-600' },
            { title: '三次方程', expr: 'x^3 - 6x^2 + 11x - 6 = 0', mode: 'Algebraic' as SolverMode, color: 'bg-rose-50 border-rose-100 hover:bg-rose-100', text: 'text-rose-600' },
            { title: '四次方程', expr: 'x^4 - 10x^2 + 9 = 0', mode: 'Algebraic' as SolverMode, color: 'bg-rose-50 border-rose-100 hover:bg-rose-100', text: 'text-rose-600' },
            { title: '超越方程', expr: 'e^x - 2 = 0', mode: 'Algebraic' as SolverMode, color: 'bg-rose-50 border-rose-100 hover:bg-rose-100', text: 'text-rose-600' },
            { title: '混合方程', expr: 'x^2 + sin(x) = 0', mode: 'Algebraic' as SolverMode, color: 'bg-rose-50 border-rose-100 hover:bg-rose-100', text: 'text-rose-600' },
            { title: '二元一次组', expr: 'x + y = 10, x - y = 2', mode: 'LinearSystems' as SolverMode, color: 'bg-emerald-50 border-emerald-100 hover:bg-emerald-100', text: 'text-emerald-600' },
            { title: '二元组-分数解', expr: '3x + 4y = 10, 2x - y = 3', mode: 'LinearSystems' as SolverMode, color: 'bg-emerald-50 border-emerald-100 hover:bg-emerald-100', text: 'text-emerald-600' },
            { title: '三元一次组', expr: 'x + y + z = 6, 2x - y + z = 3, x + 2y - z = 2', mode: 'LinearSystems' as SolverMode, color: 'bg-emerald-50 border-emerald-100 hover:bg-emerald-100', text: 'text-emerald-600' },
          ].map(ex => (
            <div
              key={ex.expr}
              className={`p-4 ${ex.color} rounded-2xl border cursor-pointer transition-colors`}
              onClick={() => { setMode(ex.mode); setQuery(ex.expr); setResult(null); handleSolve(ex.expr); }}
            >
              <div className={`text-[10px] font-bold ${ex.text} uppercase mb-1`}>{ex.title}</div>
              <div className="text-[11px] font-mono text-slate-600 break-all">{ex.expr}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EquationEngine;
