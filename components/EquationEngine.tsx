
import React, { useState, useMemo } from 'react';
import * as math from 'mathjs';
import { solveAdvancedMath } from '../services/geminiService';
import { MathResult, ModelType, ApiKeys } from '../types';
import { Loader2, Variable, ChevronRight, Hash, Sparkles, Keyboard, RotateCcw } from 'lucide-react';
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

  const handleSolve = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const category = mode === 'Algebraic' ? '代数方程' : '线性方程组';
      const res = await solveAdvancedMath(query, category, model, apiKeys);
      setResult(res);
    } catch (e) {
      setResult({ value: "无法求解", explanation: "请确保方程格式正确。示例: x^2 - 4 = 0" });
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
                 <div className="text-[10px] font-bold text-rose-400 uppercase tracking-widest mb-2">解析结果 (Solution)</div>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 bg-indigo-50 rounded-2xl border border-indigo-100 hover:shadow-md transition-all cursor-pointer" onClick={() => { setMode('Algebraic'); setQuery('x^2 - 5x + 6 = 0'); }}>
          <h4 className="text-sm font-bold text-indigo-900 mb-2 flex items-center gap-2">
            <Variable className="w-4 h-4" /> 代数方程示例
          </h4>
          <ul className="text-xs text-indigo-700 space-y-1 opacity-80">
            <li>• 二次方程: x² - 5x + 6 = 0</li>
            <li>• 复数方程: x² + 1 = 0</li>
            <li>• 复系数方程: x + 2i = 5</li>
          </ul>
        </div>
        <div className="p-5 bg-emerald-50 rounded-2xl border border-emerald-100 hover:shadow-md transition-all cursor-pointer" onClick={() => { setMode('LinearSystems'); setQuery('x + y = 10, x - y = 2'); }}>
          <h4 className="text-sm font-bold text-emerald-900 mb-2 flex items-center gap-2">
            <ChevronRight className="w-4 h-4" /> 线性方程组示例
          </h4>
          <ul className="text-xs text-emerald-700 space-y-1 opacity-80">
            <li>• 二元一次: x + y = 10, x - y = 2</li>
            <li>• 三元一次系统求解</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default EquationEngine;
