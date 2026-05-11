
import React from 'react';
import { Keyboard, RotateCcw } from 'lucide-react';
import MathKeypad from './MathKeypad';

interface EquationInputProps {
  value: string;
  onChange: (val: string) => void;
  onSolve: () => void;
  loading: boolean;
  placeholder: string;
}

const EquationInput: React.FC<EquationInputProps> = ({ 
  value, 
  onChange, 
  onSolve, 
  loading, 
  placeholder 
}) => {
  const [showKeypad, setShowKeypad] = React.useState(true);

  return (
    <div className="space-y-4">
      <div className="relative group bg-white rounded-3xl border border-slate-200 overflow-hidden focus-within:ring-2 focus-within:ring-rose-500/20 focus-within:border-rose-500 transition-all shadow-sm">
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-6 py-6 text-2xl font-bold math-font bg-transparent outline-none resize-none min-h-[120px] placeholder:text-slate-300 placeholder:font-normal"
          placeholder={placeholder}
        />
        
        <div className="absolute right-4 bottom-4 flex items-center gap-2">
          <button 
            onClick={() => { onChange(''); }}
            className="p-2.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
            title="清空"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          <button 
            onClick={() => setShowKeypad(!showKeypad)} 
            className={`p-2.5 rounded-xl transition-all ${
              showKeypad ? 'bg-rose-100 text-rose-600' : 'bg-slate-50 text-slate-400 border border-slate-200'
            }`}
            title={showKeypad ? "隐藏键盘" : "显示工具键盘"}
          >
            <Keyboard className="w-5 h-5" />
          </button>
        </div>
      </div>

      {showKeypad ? (
        <div className="animate-in slide-in-from-top-2 duration-300">
          <MathKeypad 
            onInsert={(val) => onChange(value + val)} 
            onClear={() => onChange('')} 
            onDelete={() => onChange(value.slice(0, -1))} 
            onConfirm={onSolve}
            type="equation"
          />
        </div>
      ) : (
        <button
          onClick={onSolve}
          disabled={loading || !value.trim()}
          className="w-full py-5 bg-gradient-to-r from-rose-600 to-rose-500 text-white rounded-2xl font-black text-lg shadow-xl shadow-rose-100 hover:shadow-2xl hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none"
        >
          {loading ? "正在解析符号..." : "立即推导方程解"}
        </button>
      )}
    </div>
  );
};

export default EquationInput;
