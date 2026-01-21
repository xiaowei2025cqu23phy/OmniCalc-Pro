
import React, { useState } from 'react';
import * as math from 'mathjs';
import { parseAndEvaluate } from '../utils/mathUtils';
import { Keyboard } from 'lucide-react';
import MathKeypad from './MathKeypad';

const ComplexEngine: React.FC = () => {
  const [input, setInput] = useState('sqrt(-4) + 2i * 3');
  const [result, setResult] = useState<any>(null);
  const [showKeypad, setShowKeypad] = useState(true);

  const calculate = () => {
    const res = parseAndEvaluate(input);
    setResult(res);
  };

  const handleInsert = (val: string) => setInput(prev => prev + val);
  const handleDelete = () => setInput(prev => prev.slice(0, -1));
  const handleClear = () => setInput('');

  const renderComplexPlane = (c: math.Complex) => {
    const size = 200;
    const center = size / 2;
    const scale = 20;
    const x = center + c.re * scale;
    const y = center - c.im * scale;

    return (
      <div className="flex flex-col items-center justify-center p-4 bg-slate-900 rounded-2xl shadow-inner border border-slate-800">
        <div className="text-[10px] font-bold text-slate-500 uppercase mb-4 tracking-widest">复数平面 (阿甘得图)</div>
        <svg width={size} height={size} className="overflow-visible">
          <line x1="0" y1={center} x2={size} y2={center} stroke="#334155" strokeWidth="1" />
          <line x1={center} y1="0" x2={center} y2={size} stroke="#334155" strokeWidth="1" />
          <line x1={center} y1={center} x2={x} y2={y} stroke="#a855f7" strokeWidth="2" strokeLinecap="round" />
          <circle cx={x} cy={y} r="4" fill="#a855f7" />
          <text x={size-10} y={center+15} fill="#64748b" fontSize="10">实轴 (Re)</text>
          <text x={center+5} y="15" fill="#64748b" fontSize="10">虚轴 (Im)</text>
        </svg>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <span className="p-2 bg-purple-100 text-purple-600 rounded-lg">i</span>
            复数运算引擎
          </h3>
          <button 
            onClick={() => setShowKeypad(!showKeypad)}
            className={`p-2 rounded-lg transition-colors ${showKeypad ? 'bg-purple-100 text-purple-600' : 'bg-slate-100 text-slate-500'}`}
          >
            <Keyboard className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-purple-500 outline-none math-font text-xl"
            placeholder="例如: 3 + 4i"
          />
          
          {showKeypad && (
            <MathKeypad 
              onInsert={handleInsert} 
              onClear={handleClear} 
              onDelete={handleDelete} 
              onConfirm={calculate}
              type="basic"
            />
          )}

          {!showKeypad && (
            <button
              onClick={calculate}
              className="w-full py-3 bg-purple-600 text-white rounded-xl font-medium hover:bg-purple-700 transition-colors"
            >
              计算结果
            </button>
          )}
        </div>

        {result && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8 items-center border-t border-slate-100 pt-8">
            <div className="space-y-4">
              <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                <div className="text-sm text-slate-500 mb-1 font-bold uppercase text-[10px]">直角坐标形式 (代数式)</div>
                <div className="text-3xl font-bold text-purple-700 math-font">
                  {result.toString()}
                </div>
              </div>
              
              {result.type === 'Complex' && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 bg-indigo-50 rounded-lg border border-indigo-100">
                    <span className="text-slate-400 block uppercase text-[10px] font-bold">模长 (r)</span>
                    <span className="font-mono text-indigo-700 font-bold">{result.abs().toFixed(4)}</span>
                  </div>
                  <div className="p-3 bg-pink-50 rounded-lg border border-pink-100">
                    <span className="text-slate-400 block uppercase text-[10px] font-bold">辐角 (θ)</span>
                    <span className="font-mono text-pink-700 font-bold">{result.arg().toFixed(4)} rad</span>
                  </div>
                </div>
              )}
            </div>

            {result.type === 'Complex' && renderComplexPlane(result)}
          </div>
        )}
      </div>
    </div>
  );
};

export default ComplexEngine;
