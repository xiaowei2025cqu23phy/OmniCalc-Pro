
import React from 'react';
import { Delete, CornerDownLeft } from 'lucide-react';

interface KeypadProps {
  onInsert: (val: string) => void;
  onClear: () => void;
  onDelete: () => void;
  onConfirm?: () => void;
  type?: 'basic' | 'advanced' | 'calculus' | 'plotting' | 'transforms' | 'equation' | 'complex' | 'scientific';
}

const MathKeypad: React.FC<KeypadProps> = ({ onInsert, onClear, onDelete, onConfirm, type = 'basic' }) => {
  const btnClass = "p-2 text-sm font-bold rounded-lg transition-all active:scale-95 flex items-center justify-center min-h-[40px]";
  const numClass = `${btnClass} bg-white text-slate-700 border border-slate-200 hover:bg-slate-50`;
  const opClass = `${btnClass} bg-slate-100 text-indigo-600 hover:bg-indigo-50`;
  const funcClass = `${btnClass} bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-[11px]`;
  const actionClass = `${btnClass} bg-slate-800 text-white hover:bg-black`;
  const specialClass = `${btnClass} bg-emerald-50 text-emerald-700 hover:bg-emerald-100`;
  const transformClass = `${btnClass} bg-amber-50 text-amber-700 hover:bg-amber-100`;
  const roseClass = `${btnClass} bg-rose-50 text-rose-700 hover:bg-rose-100`;
  const emeraldClass = `${btnClass} bg-emerald-50 text-emerald-700 hover:bg-emerald-100`;

  return (
    <div className="grid grid-cols-4 md:grid-cols-6 gap-1.5 p-3 bg-white border border-slate-200 rounded-2xl shadow-xl animate-in zoom-in-95 duration-200">
      {/* Basic Row 1 */}
      <button onClick={() => onInsert('7')} className={numClass}>7</button>
      <button onClick={() => onInsert('8')} className={numClass}>8</button>
      <button onClick={() => onInsert('9')} className={numClass}>9</button>
      <button onClick={() => onInsert('/')} className={opClass}>÷</button>
      <button onClick={() => onInsert('sin(')} className={funcClass}>sin</button>
      <button onClick={() => onInsert('cos(')} className={funcClass}>cos</button>

      {/* Basic Row 2 */}
      <button onClick={() => onInsert('4')} className={numClass}>4</button>
      <button onClick={() => onInsert('5')} className={numClass}>5</button>
      <button onClick={() => onInsert('6')} className={numClass}>6</button>
      <button onClick={() => onInsert('*')} className={opClass}>×</button>
      <button onClick={() => onInsert('tan(')} className={funcClass}>tan</button>
      <button onClick={() => onInsert('log(')} className={funcClass}>log</button>

      {/* Basic Row 3 */}
      <button onClick={() => onInsert('1')} className={numClass}>1</button>
      <button onClick={() => onInsert('2')} className={numClass}>2</button>
      <button onClick={() => onInsert('3')} className={numClass}>3</button>
      <button onClick={() => onInsert('-')} className={opClass}>-</button>
      <button onClick={() => onInsert('sqrt(')} className={funcClass}>√</button>
      <button onClick={() => onInsert('^')} className={funcClass}>xʸ</button>

      {/* Basic Row 4 */}
      <button onClick={() => onInsert('0')} className={numClass}>0</button>
      <button onClick={() => onInsert('.')} className={numClass}>.</button>
      <button onClick={() => onInsert('(')} className={opClass}>(</button>
      <button onClick={() => onInsert(')')} className={opClass}>)</button>
      <button onClick={() => onInsert('+')} className={opClass}>+</button>
      <button onClick={() => onDelete()} className={`${opClass} text-red-500`}><Delete className="w-4 h-4" /></button>

      {/* New Row: Fractions and common powers */}
      <div className="col-span-4 md:col-span-6 grid grid-cols-6 gap-1.5 border-t border-slate-100 pt-1.5">
        <button onClick={() => onInsert('1/(')} className={funcClass}>1/x</button>
        <button onClick={() => onInsert('^2')} className={funcClass}>x²</button>
        <button onClick={() => onInsert('^3')} className={funcClass}>x³</button>
        <button onClick={() => onInsert('(/)')} className={funcClass}>分式</button>
        <button onClick={() => onInsert('^(')} className={funcClass}>xⁿ</button>
        <button onClick={() => onInsert('sqrt(')} className={funcClass}>√x</button>
      </div>

      {/* Dynamic Section based on Type */}
      <div className="col-span-4 md:col-span-6 grid grid-cols-6 gap-1.5 border-t border-slate-100 pt-1.5">
        {type === 'equation' ? (
          <>
            <button onClick={() => onInsert('x')} className={roseClass}>x</button>
            <button onClick={() => onInsert('y')} className={roseClass}>y</button>
            <button onClick={() => onInsert('z')} className={roseClass}>z</button>
            <button onClick={() => onInsert(' = ')} className={`${roseClass} font-black`}>=</button>
            <button onClick={() => onInsert(', ')} className={roseClass}>,</button>
            <button onClick={() => onInsert('pi')} className={roseClass}>π</button>
          </>
        ) : type === 'plotting' ? (
          <>
            <button onClick={() => onInsert('x')} className={emeraldClass}>x</button>
            <button onClick={() => onInsert('y')} className={emeraldClass}>y</button>
            <button onClick={() => onInsert('t')} className={emeraldClass}>t</button>
            <button onClick={() => onInsert('z')} className={emeraldClass}>z</button>
            <button onClick={() => onInsert('theta')} className={emeraldClass}>θ</button>
            <button onClick={() => onInsert('phi')} className={emeraldClass}>φ</button>
            <button onClick={() => onInsert(' = ')} className={`${emeraldClass} font-bold`}>=</button>
            <button onClick={() => onInsert('pi')} className={emeraldClass}>π</button>
          </>
        ) : type === 'complex' ? (
          <>
            <button onClick={() => onInsert('i')} className={`${roseClass} italic text-purple-600`}>i</button>
            <button onClick={() => onInsert('exp(')} className={roseClass}>exp</button>
            <button onClick={() => onInsert('pi')} className={roseClass}>π</button>
            <button onClick={() => onInsert('conj(')} className={roseClass}>共轭</button>
            <button onClick={() => onInsert('abs(')} className={roseClass}>|z|</button>
            <button onClick={() => onInsert('arg(')} className={roseClass}>arg</button>
          </>
        ) : type === 'scientific' ? (
          <>
            <button onClick={() => onInsert('pi')} className={specialClass}>π</button>
            <button onClick={() => onInsert('e')} className={specialClass}>e</button>
            <button onClick={() => onInsert('abs(')} className={specialClass}>abs</button>
            <button onClick={() => onInsert('log10(')} className={specialClass}>log₁₀</button>
            <button onClick={() => onInsert('ln(')} className={specialClass}>ln</button>
            <button onClick={() => onInsert('!')} className={specialClass}>x!</button>
          </>
        ) : (
          <>
            <button onClick={() => onInsert('x')} className={specialClass}>x</button>
            <button onClick={() => onInsert('y')} className={specialClass}>y</button>
            <button onClick={() => onInsert('t')} className={specialClass}>t</button>
            <button onClick={() => onInsert('i')} className={`${specialClass} italic text-purple-600`}>i</button>
            <button onClick={() => onInsert('pi')} className={specialClass}>π</button>
            <button onClick={() => onInsert('e')} className={specialClass}>e</button>
          </>
        )}
      </div>

      {type === 'calculus' && (
        <div className="col-span-4 md:col-span-6 grid grid-cols-4 gap-1.5 border-t border-slate-100 pt-1.5">
          <button onClick={() => onInsert('d/dx ')} className={`${funcClass} col-span-1 bg-blue-50 text-blue-700`}>d/dx</button>
          <button onClick={() => onInsert('diff( , x)')} className={`${funcClass} col-span-1 bg-blue-50 text-blue-700`}>∂/∂x</button>
          <button onClick={() => onInsert('integrate( , x)')} className={`${funcClass} col-span-1 bg-blue-50 text-blue-700`}>∫dx</button>
          <button onClick={() => onInsert('limit( , x, 0)')} className={`${funcClass} col-span-1 bg-blue-50 text-blue-700`}>lim</button>
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
          <button onClick={() => onInsert('laplace( , t, s)')} className={transformClass}>L(f)</button>
          <button onClick={() => onInsert('fourier( , t, w)')} className={transformClass}>F(f)</button>
          <button onClick={() => onInsert('inv_laplace( , s, t)')} className={transformClass}>L⁻¹</button>
          <button onClick={() => onInsert('u(t)')} className={transformClass}>u(t)</button>
          <button onClick={() => onInsert('delta(t)')} className={transformClass}>δ(t)</button>
          <button onClick={() => onInsert('exp(-s*t)')} className={transformClass}>e⁻ˢᵗ</button>
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
