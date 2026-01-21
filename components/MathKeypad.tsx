
import React from 'react';
import { Delete, CornerDownLeft } from 'lucide-react';

interface KeypadProps {
  onInsert: (val: string) => void;
  onClear: () => void;
  onDelete: () => void;
  onConfirm?: () => void;
  type?: 'basic' | 'advanced' | 'calculus' | 'plotting' | 'transforms';
}

const MathKeypad: React.FC<KeypadProps> = ({ onInsert, onClear, onDelete, onConfirm, type = 'basic' }) => {
  const btnClass = "p-2 text-sm font-bold rounded-lg transition-all active:scale-95 flex items-center justify-center min-h-[40px]";
  const numClass = `${btnClass} bg-white text-slate-700 border border-slate-200 hover:bg-slate-50`;
  const opClass = `${btnClass} bg-slate-100 text-indigo-600 hover:bg-indigo-50`;
  const funcClass = `${btnClass} bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-[11px]`;
  const actionClass = `${btnClass} bg-slate-800 text-white hover:bg-black`;
  const specialClass = `${btnClass} bg-emerald-50 text-emerald-700 hover:bg-emerald-100`;
  const transformClass = `${btnClass} bg-amber-50 text-amber-700 hover:bg-amber-100`;

  return (
    <div className="grid grid-cols-4 md:grid-cols-6 gap-1.5 p-3 bg-white border border-slate-200 rounded-2xl shadow-xl animate-in zoom-in-95 duration-200">
      {/* Numbers & Basic Ops */}
      <button onClick={() => onInsert('7')} className={numClass}>7</button>
      <button onClick={() => onInsert('8')} className={numClass}>8</button>
      <button onClick={() => onInsert('9')} className={numClass}>9</button>
      <button onClick={() => onInsert('/')} className={opClass}>÷</button>
      <button onClick={() => onInsert('sin(')} className={funcClass}>sin</button>
      <button onClick={() => onInsert('cos(')} className={funcClass}>cos</button>

      <button onClick={() => onInsert('4')} className={numClass}>4</button>
      <button onClick={() => onInsert('5')} className={numClass}>5</button>
      <button onClick={() => onInsert('6')} className={numClass}>6</button>
      <button onClick={() => onInsert('*')} className={opClass}>×</button>
      <button onClick={() => onInsert('tan(')} className={funcClass}>tan</button>
      <button onClick={() => onInsert('log(')} className={funcClass}>log</button>

      <button onClick={() => onInsert('1')} className={numClass}>1</button>
      <button onClick={() => onInsert('2')} className={numClass}>2</button>
      <button onClick={() => onInsert('3')} className={numClass}>3</button>
      <button onClick={() => onInsert('-')} className={opClass}>-</button>
      <button onClick={() => onInsert('sqrt(')} className={funcClass}>√</button>
      <button onClick={() => onInsert('^')} className={funcClass}>xⁿ</button>

      <button onClick={() => onInsert('0')} className={numClass}>0</button>
      <button onClick={() => onInsert('.')} className={numClass}>.</button>
      <button onClick={() => onInsert('(')} className={opClass}>(</button>
      <button onClick={() => onInsert(')')} className={opClass}>)</button>
      <button onClick={() => onInsert('+')} className={opClass}>+</button>
      <button onClick={() => onDelete()} className={`${opClass} text-red-500`}><Delete className="w-4 h-4" /></button>

      {/* Variables & Constants */}
      <div className="col-span-4 md:col-span-6 grid grid-cols-6 gap-1.5 border-t border-slate-100 pt-1.5">
        <button onClick={() => onInsert('x')} className={specialClass}>x</button>
        <button onClick={() => onInsert('y')} className={specialClass}>y</button>
        <button onClick={() => onInsert('t')} className={specialClass}>t</button>
        <button onClick={() => onInsert('i')} className={`${specialClass} italic text-purple-600`}>i</button>
        <button onClick={() => onInsert('pi')} className={specialClass}>π</button>
        <button onClick={() => onInsert('e')} className={specialClass}>e</button>
      </div>

      {/* Advanced Templates */}
      {type === 'calculus' && (
        <div className="col-span-4 md:col-span-6 grid grid-cols-4 gap-1.5 border-t border-slate-100 pt-1.5">
          <button onClick={() => onInsert('diff(')} className={`${funcClass} col-span-1 bg-blue-50 text-blue-700`}>d/dx</button>
          <button onClick={() => onInsert('integral(')} className={`${funcClass} col-span-1 bg-blue-50 text-blue-700`}>∫</button>
          <button onClick={() => onInsert(', x')} className={funcClass}>, x</button>
          <button onClick={() => onInsert("'")} className={funcClass}>y'</button>
        </div>
      )}

      {type === 'plotting' && (
        <div className="col-span-4 md:col-span-6 grid grid-cols-6 gap-1.5 border-t border-slate-100 pt-1.5">
          <button onClick={() => onInsert('sin(x)')} className={funcClass}>sin(x)</button>
          <button onClick={() => onInsert('cos(x)')} className={funcClass}>cos(x)</button>
          <button onClick={() => onInsert('x^2')} className={funcClass}>x²</button>
          <button onClick={() => onInsert('exp(x)')} className={funcClass}>exp</button>
          <button onClick={() => onInsert('abs(')} className={funcClass}>|x|</button>
          <button onClick={() => onInsert('theta')} className={funcClass}>θ</button>
        </div>
      )}

      {type === 'transforms' && (
        <div className="col-span-4 md:col-span-6 grid grid-cols-6 gap-1.5 border-t border-slate-100 pt-1.5">
          <button onClick={() => onInsert('f(t)')} className={transformClass}>f(t)</button>
          <button onClick={() => onInsert('u(t)')} className={transformClass}>u(t)</button>
          <button onClick={() => onInsert('delta(t)')} className={transformClass}>δ(t)</button>
          <button onClick={() => onInsert('s')} className={transformClass}>s</button>
          <button onClick={() => onInsert('w')} className={transformClass}>ω</button>
          <button onClick={() => onInsert('exp(-')} className={transformClass}>e⁻ᵃᵗ</button>
        </div>
      )}

      {/* Global Actions */}
      <div className="col-span-4 md:col-span-6 grid grid-cols-4 md:grid-cols-6 gap-1.5 border-t border-slate-100 pt-1.5">
        <button onClick={onClear} className="p-2 text-xs font-bold rounded-lg border border-red-100 text-red-500 bg-red-50 hover:bg-red-100 flex items-center justify-center gap-1">
          清空
        </button>
        <button 
          onClick={onConfirm} 
          className={`${actionClass} col-span-3 md:col-span-5 flex items-center gap-2 tracking-widest uppercase text-xs`}
        >
          <CornerDownLeft className="w-3 h-3" /> 开始计算
        </button>
      </div>
    </div>
  );
};

export default MathKeypad;
