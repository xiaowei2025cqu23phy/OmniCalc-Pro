
import React from 'react';
import * as math from 'mathjs';

interface ComplexPlaneProps {
  c: math.Complex;
  title?: string;
}

const ComplexPlane: React.FC<ComplexPlaneProps> = ({ c, title = "复数平面 (阿甘得图)" }) => {
  const size = 200;
  const center = size / 2;
  const scale = 20;
  const x = center + c.re * scale;
  const y = center - c.im * scale;

  return (
    <div className="flex flex-col items-center justify-center p-4 bg-slate-900 rounded-2xl shadow-inner border border-slate-800">
      <div className="text-[10px] font-bold text-slate-500 uppercase mb-4 tracking-widest">{title}</div>
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

export default ComplexPlane;
