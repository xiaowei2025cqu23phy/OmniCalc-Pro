
import React, { useState } from 'react';
import { Calculator, HelpCircle, History, RotateCcw, Copy, CheckCircle2 } from 'lucide-react';
import { create, all } from 'mathjs';
import MathKeypad from './MathKeypad';
import { MathResult } from '../types';

const math = create(all);

const ScientificEngine: React.FC = () => {
  const [expression, setExpression] = useState('');
  const [result, setResult] = useState<MathResult | null>(null);
  const [history, setHistory] = useState<{ expr: string; res: string; timestamp: Date }[]>([]);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const calculate = () => {
    if (!expression.trim()) return;
    setLoading(true);
    
    try {
      // Basic mathjs evaluation for scientific calculator
      const res = math.evaluate(expression);
      // 对大整数避免 toLocaleString 丢失精度：仅在安全整数范围内本地化
      let resStr: string;
      if (typeof res === 'number') {
        if (Number.isInteger(res) && Math.abs(res) > 1e15) {
          resStr = res.toExponential(6);
        } else {
          resStr = res.toLocaleString(undefined, { maximumFractionDigits: 12 });
        }
      } else {
        resStr = res.toString();
      }
      
      const newResult: MathResult = {
        value: resStr,
        explanation: `计算结果为: ${resStr}`,
        method: 'local'
      };
      
      setResult(newResult);
      setHistory(prev => [{ 
        expr: expression, 
        res: resStr, 
        timestamp: new Date() 
      }, ...prev].slice(0, 10));
      
    } catch (err) {
      setResult({
        value: '错误',
        explanation: '无效的表达式或数学错误。请检查语法。',
        method: 'local'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result.value.toString());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Input Section */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 rounded-xl">
                  <Calculator className="w-5 h-5 text-indigo-600" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">标准科学计算</h3>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => { setExpression(''); setResult(null); }}
                  className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                  title="重置"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
                <HelpCircle className="w-5 h-5 text-slate-300 cursor-help" />
              </div>
            </div>

            <div className="space-y-4">
              <div className="relative group">
                <input
                  type="text"
                  value={expression}
                  onChange={(e) => setExpression(e.target.value)}
                  placeholder="输入数学表达式，如: sin(45 deg) + sqrt(144)"
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-4 text-xl font-mono focus:border-indigo-400 focus:bg-white outline-none transition-all shadow-inner"
                  onKeyDown={(e) => e.key === 'Enter' && calculate()}
                />
              </div>

              <MathKeypad 
                onInsert={(val) => setExpression(prev => prev + val)}
                onClear={() => setExpression('')}
                onDelete={() => setExpression(prev => prev.slice(0, -1))}
                onConfirm={calculate}
                type="scientific"
              />
            </div>
          </div>

          {result && (
            <div className="bg-emerald-50 border border-emerald-100 rounded-3xl p-6 animate-in zoom-in-95 duration-300 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4">
                  <button 
                    onClick={handleCopy}
                    className="p-2 bg-white/50 hover:bg-white rounded-lg transition-all text-emerald-600 border border-emerald-200"
                  >
                    {copied ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>
               </div>
               <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest mb-2 block">计算结果</span>
               <div className="text-3xl font-bold text-emerald-900 break-all">
                 {result.value}
               </div>
               <p className="mt-3 text-emerald-700/80 text-sm leading-relaxed">
                 {result.explanation}
               </p>
            </div>
          )}
        </div>

        {/* Info & History Sidebar */}
        <div className="flex flex-col gap-6">
          <div className="bg-slate-900 rounded-3xl p-6 text-white shadow-xl shadow-slate-200/50">
            <h4 className="flex items-center gap-2 text-sm font-bold opacity-80 mb-4">
              <History className="w-4 h-4" /> 最近记录
            </h4>
            <div className="space-y-3">
              {history.length > 0 ? history.map((item, i) => (
                <div 
                  key={i} 
                  className="bg-white/5 border border-white/10 rounded-xl p-3 cursor-pointer hover:bg-white/10 transition-colors group"
                  onClick={() => setExpression(item.expr)}
                >
                  <div className="text-white/60 text-[10px] font-mono mb-1">{item.expr}</div>
                  <div className="text-white font-bold flex justify-between items-center">
                    <span>{item.res}</span>
                    <span className="text-[9px] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap ml-2">点击填入</span>
                  </div>
                </div>
              )) : (
                <div className="text-slate-500 text-xs text-center py-8 italic border border-dashed border-white/10 rounded-2xl">
                  暂无记录
                </div>
              )}
            </div>
          </div>

          <div className="bg-indigo-50 border border-indigo-100 rounded-3xl p-6">
             <h4 className="text-indigo-900 font-bold mb-3 flex items-center gap-2">
               <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full"></span>
               常用符号与运算
             </h4>
             <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 bg-white rounded-lg border border-indigo-100">
                  <code className="text-indigo-600 font-bold block mb-1">deg/rad</code> 
                  角度/弧度切换
                </div>
                <div className="p-2 bg-white rounded-lg border border-indigo-100">
                  <code className="text-indigo-600 font-bold block mb-1">! / log</code>
                  阶乘与对数
                </div>
                <div className="p-2 bg-white rounded-lg border border-indigo-100">
                  <code className="text-indigo-600 font-bold block mb-1">sqrt / ^</code>
                  开方与方次
                </div>
                <div className="p-2 bg-white rounded-lg border border-indigo-100">
                  <code className="text-indigo-600 font-bold block mb-1">pi / e</code>
                  数学常数
                </div>
             </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ScientificEngine;
