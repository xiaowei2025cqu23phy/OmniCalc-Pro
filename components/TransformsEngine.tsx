
import React, { useState } from 'react';
import { solveAdvancedMath } from '../services/geminiService';
import { MathResult } from '../types';
import { Loader2, Zap, Beaker, FileText, Globe, Keyboard } from 'lucide-react';
import MathKeypad from './MathKeypad';

const EXAMPLES = [
  { label: '指数衰减', expr: 'f(t) = e^(-at) * u(t)', type: 'Laplace' },
  { label: '单位阶跃', expr: 'f(t) = u(t)', type: 'Laplace' },
  { label: '正弦信号', expr: 'f(t) = sin(w*t)', type: 'Fourier' },
  { label: '高斯脉冲', expr: 'f(t) = e^(-a*t^2)', type: 'Fourier' },
  { label: '狄拉克冲激', expr: 'f(t) = delta(t)', type: 'Laplace' }
];

const TransformsEngine: React.FC = () => {
  const [query, setQuery] = useState('f(t) = e^(-2t) * cos(3t)');
  const [type, setType] = useState<'Fourier' | 'Laplace'>('Laplace');
  const [loading, setLoading] = useState(false);
  const [showKeypad, setShowKeypad] = useState(true);
  const [result, setResult] = useState<MathResult | null>(null);

  const handleSolve = async () => {
    setLoading(true);
    const fullQuery = `求函数在 ${type} 域下的积分变换： ${query}`;
    const res = await solveAdvancedMath(fullQuery, `积分变换 (${type})`);
    setResult(res);
    setLoading(false);
  };

  const handleInsert = (val: string) => setQuery(prev => prev + val);
  const handleDelete = () => setQuery(prev => prev.slice(0, -1));
  const handleClear = () => setQuery('');

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold flex items-center gap-2 text-amber-600">
            <Zap className="w-5 h-5 text-amber-500" />
            积分变换工作台
          </h3>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setShowKeypad(!showKeypad)}
              className={`p-2 rounded-lg transition-colors ${showKeypad ? 'bg-amber-100 text-amber-600' : 'bg-slate-100 text-slate-500'}`}
            >
              <Keyboard className="w-4 h-4" />
            </button>
            <span className="text-[10px] font-bold text-blue-500 flex items-center gap-1 hidden sm:flex">
              <Globe className="w-3 h-3" /> 云端引擎
            </span>
            <div className="flex bg-slate-100 p-1 rounded-lg">
              {(['Laplace', 'Fourier'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setType(t)}
                  className={`px-4 py-1.5 rounded-md text-xs font-bold transition-all ${type === t ? 'bg-white shadow-sm text-amber-600' : 'text-slate-500'}`}
                >
                  {t === 'Laplace' ? '拉普拉斯' : '傅里叶'}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 mb-6 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700">
          <b>注意:</b> 积分变换涉及复杂的符号积分运算，将由 AI 引擎进行推理。
          请输入关于时间项 <span className="font-mono">t</span> 的函数，系统将变换至 <span className="font-mono">{type === 'Laplace' ? 's' : 'ω'}</span> 频域。
        </div>

        <div className="mb-6">
          <label className="block text-[10px] font-bold text-slate-400 uppercase mb-2 tracking-widest">选择常用示例</label>
          <div className="flex flex-wrap gap-2">
            {EXAMPLES.filter(ex => ex.type === type).map((ex, i) => (
              <button
                key={i}
                onClick={() => { setQuery(ex.expr); setType(ex.type as any); }}
                className="px-3 py-1.5 bg-slate-50 hover:bg-amber-50 border border-slate-100 hover:border-amber-200 rounded-full text-xs text-slate-600 transition-colors"
              >
                {ex.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-amber-500 outline-none math-font text-xl"
              placeholder="输入待变换函数 f(t)..."
            />
            <Beaker className="absolute left-4 top-4 w-5 h-5 text-slate-400" />
          </div>

          {showKeypad && (
            <MathKeypad 
              onInsert={handleInsert} 
              onClear={handleClear} 
              onDelete={handleDelete} 
              onConfirm={handleSolve}
              type="transforms"
            />
          )}
          
          {!showKeypad && (
            <button
              onClick={handleSolve}
              disabled={loading}
              className="w-full py-3 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-amber-100"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : '派生变换结果'}
            </button>
          )}
        </div>

        {result && (
          <div className="mt-8 animate-in fade-in slide-in-from-top-4">
            <div className="p-5 bg-amber-50 rounded-2xl border border-amber-100 mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">变换结果 (域函数)</span>
                <FileText className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl font-bold text-slate-900 math-font mb-2">
                {type === 'Laplace' ? 'F(s) = ' : 'F(ω) = '} {result.value}
              </div>
              <p className="text-sm text-amber-800 italic opacity-80 leading-relaxed">{result.explanation}</p>
            </div>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">演算步骤明细</h4>
              <div className="space-y-2">
                {result.steps?.map((step, i) => (
                  <div key={i} className="flex gap-4 p-3 bg-slate-50 rounded-xl text-sm text-slate-600 border border-slate-100">
                    <span className="font-bold text-amber-400 shrink-0">{i+1 < 10 ? `0${i+1}` : i+1}</span>
                    <p>{step}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransformsEngine;
