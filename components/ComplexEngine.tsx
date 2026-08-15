
import React, { useState } from 'react';
import { parseAndEvaluate } from '../utils/mathUtils';
import { Keyboard, RefreshCw } from 'lucide-react';
import MathKeypad from './MathKeypad';

import ComplexPlane from './ComplexPlane';

const ComplexEngine: React.FC = () => {
  const [input, setInput] = useState('3 + 4i');
  const [result, setResult] = useState<any>(null);
  const [showKeypad, setShowKeypad] = useState(true);

  const calculate = () => {
    const res = parseAndEvaluate(input);
    setResult(res);
  };

  const handleInsert = (val: string) => setInput(prev => prev + val);
  const handleDelete = () => setInput(prev => prev.slice(0, -1));
  const handleClear = () => {
    setInput('');
    setResult(null);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <span className="p-2 bg-purple-100 text-purple-600 rounded-lg">i</span>
            复数运算与转化引擎
          </h3>
          <button 
            onClick={() => setShowKeypad(!showKeypad)}
            className={`p-2 rounded-lg transition-colors ${showKeypad ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-500'}`}
          >
            <Keyboard className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="relative group">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="w-full px-4 py-4 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 outline-none math-font text-xl pr-12"
              placeholder="例如: 3 + 4i 或 5 exp(i * pi/4)"
            />
            <RefreshCw className="absolute right-4 top-4 w-5 h-5 text-slate-300 group-hover:text-purple-400 transition-colors cursor-pointer" onClick={calculate} />
          </div>
          
          {showKeypad && (
            <MathKeypad 
              onInsert={handleInsert} 
              onClear={handleClear} 
              onDelete={handleDelete} 
              onConfirm={calculate}
              type="complex"
            />
          )}

          {!showKeypad && (
            <button
              onClick={calculate}
              className="w-full py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors shadow-lg shadow-purple-100"
            >
              分析并计算
            </button>
          )}
        </div>

        {result && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-center border-t border-slate-100 pt-8 animate-in fade-in duration-500">
            <div className="space-y-4">
              <div className="p-5 bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-200 shadow-sm">
                <div className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest">代数式 (Rectangular)</div>
                <div className="text-3xl font-black text-purple-700 math-font mb-4">
                  {result.toString()}
                </div>
                
                {result.type === 'Complex' && (
                  <>
                    <div className="h-px bg-slate-100 w-full mb-4"></div>
                    <div className="text-[10px] font-bold text-slate-400 mb-2 uppercase tracking-widest">极坐标 (Polar / Exponential)</div>
                    <div className="text-xl font-bold text-slate-700 math-font">
                      {result.abs().toFixed(3)} · e<sup>i({result.arg().toFixed(3)})</sup>
                    </div>
                  </>
                )}
              </div>
              
              {result.type === 'Complex' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 group hover:bg-indigo-100 transition-colors">
                    <span className="text-slate-400 block uppercase text-[10px] font-bold mb-1">模长 (Magnitude)</span>
                    <span className="font-mono text-indigo-700 font-bold text-lg">{result.abs().toFixed(4)}</span>
                  </div>
                  <div className="p-4 bg-pink-50 rounded-xl border border-pink-100 group hover:bg-pink-100 transition-colors">
                    <span className="text-slate-400 block uppercase text-[10px] font-bold mb-1">辐角 (Phase Angle)</span>
                    <span className="font-mono text-pink-700 font-bold text-lg">{result.arg().toFixed(4)} rad</span>
                  </div>
                </div>
              )}
            </div>

            {result.type === 'Complex' && <ComplexPlane c={result} />}
          </div>
        )}
      </div>
    </div>
  );
};

export default ComplexEngine;
