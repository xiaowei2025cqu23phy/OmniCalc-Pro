
import React, { useState } from 'react';
import { BookOpen, Copy, Info, Search, Terminal, Atom, Compass, Waves } from 'lucide-react';

interface RefItem {
  title: string;
  formula: string;
  desc: string;
  context: string;
}

const VECTOR_DATA: RefItem[] = [
  { title: '梯度 (Gradient)', formula: '∇f = (∂f/∂x)i + (∂f/∂y)j + (∂f/∂z)k', desc: '指向函数增长最快的方向，模长为增长率。', context: '势场理论、最速下降法。' },
  { title: '散度 (Divergence)', formula: '∇·A = ∂Ax/∂x + ∂Ay/∂y + ∂Az/∂z', desc: '描述场在某点的发散或汇聚程度。', context: '连续性方程、高斯定律。' },
  { title: '旋度 (Curl)', formula: '∇×A = (∂Az/∂y - ∂Ay/∂z)i + ...', desc: '描述矢量场在某点的旋转强度和方向。', context: '磁场、流体涡量。' },
  { title: '拉普拉斯算子 (Laplacian)', formula: '∇²f = ∂²f/∂x² + ∂²f/∂y² + ∂²f/∂z²', desc: '描述函数在某点的平均值与周围点的偏差。', context: '热传导方程、波动方程。' }
];

const SPECIAL_FUNCS: RefItem[] = [
  { title: '勒让德多项式 (Legendre)', formula: 'P_n(x) = (1/2ⁿn!) dⁿ/dxⁿ (x²-1)ⁿ', desc: '勒让德方程的解。', context: '球谐函数、静电势展开。' },
  { title: '贝塞尔函数 (Bessel)', formula: 'J_n(x) = Σ [(-1)ᵏ / (k!Γ(k+n+1))] (x/2)ⁿ⁺²ᵏ', desc: '具有衰减特性的振荡函数。', context: '圆柱波传播、圆鼓皮振动。' },
  { title: '埃尔米特多项式 (Hermite)', formula: 'H_n(x) = (-1)ⁿ e^(x²) dⁿ/dxⁿ e^(-x²)', desc: '在区间 (-∞, ∞) 上关于权重 e^(-x²) 正交。', context: '量子谐振子、概率论。' }
];

const INTEGRALS: RefItem[] = [
  { title: '高斯积分', formula: '∫ exp(-ax²) dx = √(π/a)', desc: '正态分布下的面积计算基础。', context: '统计力学、量子力学。' },
  { title: '指数衰减积分', formula: '∫ xⁿ e^(-ax) dx = n! / aⁿ⁺¹', desc: '常用于寿命模型或衰减过程。', context: '核物理、反应动力学。' },
  { title: '正弦积分 (Sine Integral)', formula: '∫ sin(ax)/x dx = π/2', desc: '标准的狄利克雷积分。', context: '信号处理、光学衍射。' }
];

const PhysicsRefEngine: React.FC = () => {
  const [tab, setTab] = useState<'vector' | 'integral' | 'special'>('vector');
  const [search, setSearch] = useState('');

  const renderGrid = (items: RefItem[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {items.filter(i => i.title.toLowerCase().includes(search.toLowerCase()) || i.desc.includes(search)).map((item, idx) => (
        <div key={idx} className="group bg-white p-5 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all">
          <div className="flex justify-between items-start mb-3">
            <h4 className="font-bold text-slate-800 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
              {item.title}
            </h4>
            <button 
              onClick={() => navigator.clipboard.writeText(item.formula)}
              className="p-1.5 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
              title="点击复制公式"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 mb-3 overflow-x-auto">
            <code className="text-sm font-bold text-indigo-700 math-font whitespace-nowrap">{item.formula}</code>
          </div>
          <p className="text-xs text-slate-500 leading-relaxed mb-2">{item.desc}</p>
          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-100/50 w-fit px-2 py-0.5 rounded">
            <Info className="w-3 h-3" /> 应用场景: {item.context}
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex bg-slate-100 p-1 rounded-xl w-full md:w-auto">
          <button 
            onClick={() => setTab('vector')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${tab === 'vector' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Compass className="w-4 h-4" /> 矢量分析
          </button>
          <button 
            onClick={() => setTab('integral')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${tab === 'integral' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Waves className="w-4 h-4" /> 常用积分表
          </button>
          <button 
            onClick={() => setTab('special')}
            className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 ${tab === 'special' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            <Atom className="w-4 h-4" /> PDE 特殊函数
          </button>
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
          <input 
            type="text" 
            placeholder="关键词快速搜索..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
          />
        </div>
      </div>

      <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
        {tab === 'vector' && renderGrid(VECTOR_DATA)}
        {tab === 'integral' && renderGrid(INTEGRALS)}
        {tab === 'special' && renderGrid(SPECIAL_FUNCS)}
      </div>

      <div className="p-6 bg-indigo-900 rounded-3xl text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-10">
          <Terminal className="w-32 h-32" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/20">
            <BookOpen className="w-8 h-8 text-indigo-200" />
          </div>
          <div className="flex-1">
            <h3 className="text-xl font-bold mb-2">偏微分方程 (PDE) 进阶手册</h3>
            <p className="text-indigo-200 text-sm leading-relaxed max-w-2xl">
              特殊函数通常在非笛卡尔坐标系下求解 PDE 时产生。例如，勒让德多项式通常解决球坐标系下拉普拉斯方程的角度部分，
              而贝塞尔函数则解决柱坐标系下的径向部分。
            </p>
          </div>
          <button className="px-6 py-2 bg-white text-indigo-900 rounded-xl font-bold text-sm hover:bg-indigo-50 transition-colors whitespace-nowrap">
            查看完整手册
          </button>
        </div>
      </div>
    </div>
  );
};

export default PhysicsRefEngine;
