
import React, { useState, useEffect, useRef } from 'react';
import { 
  generatePlotData1D, generateParametricData, generatePolarData,
  generateImplicitData
} from '../utils/mathUtils';
import { AreaChart, Plus, Trash2, Keyboard, RotateCw, Move } from 'lucide-react';
import MathKeypad from './MathKeypad';
import PlotView2D from './PlotView2D';
import PlotView3D from './PlotView3D';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

type PlotMode = '直角坐标' | '参数方程(2D)' | '参数方程(3D)' | '极坐标(2D)' | '球坐标(3D)' | '3D 曲面图';

/** 示例模板库：fields 按各模式字段数定义（直角坐标=多条显式曲线，参数2D/3D=分量，其余=单表达式） */
interface PlotTemplate {
  name: string;
  desc: string;
  fields: string[];
}
const TEMPLATES: Record<PlotMode, PlotTemplate[]> = {
  '直角坐标': [
    { name: '三角对比', desc: 'sin(x) / cos(x) / sin(2x) 三曲线同绘', fields: ['sin(x)', 'cos(x)', 'sin(2*x)'] },
    { name: '多项式族', desc: 'x² / x³ / x⁴ 对比增长', fields: ['x^2', 'x^3', 'x^4'] },
    { name: '指数与对数', desc: 'exp(x) / ln(x) / log10(x)', fields: ['exp(x)', 'ln(x)', 'log10(x)'] },
    { name: '双曲函数', desc: 'sinh(x) / cosh(x) / tanh(x)', fields: ['sinh(x)', 'cosh(x)', 'tanh(x)'] },
    { name: '圆（隐式）', desc: 'x² + y² = 25', fields: ['x^2 + y^2 = 25'] },
    { name: '笛卡尔叶线（隐式）', desc: 'x³ + y³ = 3xy', fields: ['x^3 + y^3 = 3*x*y'] },
  ],
  '3D 曲面图': [
    { name: '高斯钟', desc: 'z = exp(-(x²+y²))', fields: ['exp(-(x^2+y^2))'] },
    { name: '鞍面', desc: 'z = x² - y²', fields: ['x^2 - y^2'] },
    { name: '波纹面', desc: 'z = sin(x)·cos(y)', fields: ['sin(x)*cos(y)'] },
    { name: '涟漪', desc: 'z = sin(√(x²+y²))', fields: ['sin(sqrt(x^2+y^2))'] },
  ],
  '参数方程(2D)': [
    { name: '圆', desc: 'x=3cos(t), y=3sin(t)', fields: ['cos(t)*3', 'sin(t)*3'] },
    { name: '利萨如曲线', desc: 'x=sin(3t), y=sin(5t)', fields: ['sin(3*t)', 'sin(5*t)'] },
    { name: '阿基米德螺线', desc: 'x=t·cos(t)/4, y=t·sin(t)/4', fields: ['cos(t)*t/4', 'sin(t)*t/4'] },
  ],
  '参数方程(3D)': [
    { name: '螺旋线', desc: 'x=5cos(t), y=5sin(t), z=t/2', fields: ['cos(t)*5', 'sin(t)*5', 't/2'] },
    { name: '环面结', desc: '经典 (2,3) 环面结', fields: ['cos(3*t)*(2+cos(2*t))', 'sin(3*t)*(2+cos(2*t))', 'sin(2*t)'] },
  ],
  '极坐标(2D)': [
    { name: '心形线', desc: 'r = 2(1-cos θ)', fields: ['2 * (1 - cos(theta))'] },
    { name: '五叶玫瑰', desc: 'r = sin(5θ)', fields: ['sin(5*theta)'] },
    { name: '对数螺线', desc: 'r = e^(θ/8)', fields: ['exp(theta/8)'] },
  ],
  '球坐标(3D)': [
    { name: '球面', desc: 'r = 5', fields: ['5'] },
    { name: '旋转体', desc: 'r = 5(1+cos θ)', fields: ['5*(1+cos(theta))'] },
    { name: '花式曲面', desc: 'r = 5(1+0.2sin(8θ)cos(8φ))', fields: ['5 * (1 + 0.2 * sin(8 * theta) * cos(8 * phi))'] },
  ],
};

const PlottingEngine: React.FC = () => {
  const [mode, setMode] = useState<PlotMode>('直角坐标');
  const [exprs, setExprs] = useState<string[]>(['exp(x)', 'x^2 + y^2 = 25', 'sin(x)']);
  const [threeDExpr, setThreeDExpr] = useState<string>('exp(-(x^2 + y^2)/5) * cos(x^2 + y^2)');
  const [parametricExprs, setParametricExprs] = useState<[string, string]>(['cos(t)*3', 'sin(t)*3']);
  const [parametric3DExprs, setParametric3DExprs] = useState<[string, string, string]>(['cos(t)*5', 'sin(t)*5', 't/2']);
  const [polarExpr, setPolarExpr] = useState<string>('2 * (1 - cos(theta))');
  const [sphericalExpr, setSphericalExpr] = useState<string>('5 * (1 + 0.2 * sin(8 * theta) * cos(8 * phi))');
  
  const [range, setRange] = useState<[number, number]>([-10, 10]);
  const [viewY, setViewY] = useState<[number, number]>([-10, 10]);
  const [tRange, setTRange] = useState<[number, number]>([0, 12.56]); 
  const [thetaRange, setThetaRange] = useState<[number, number]>([0, 6.28]);
  const [phiRange, setPhiRange] = useState<[number, number]>([0, 3.14]);
  
  // 3D 旋转状态
  const [rotX, setRotX] = useState(45);
  const [rotY, setRotY] = useState(30);
  const [zoom3D, setZoom3D] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });
  const rafRef = useRef<number | null>(null);

  const [plotData, setPlotData] = useState<any[]>([]);
  const [implicitSeries, setImplicitSeries] = useState<{points: any[], name: string, color: string}[]>([]);
  // 与 plotData 索引严格对应的显式曲线列表（供 PlotView2D 渲染）
  const [explicitExprs, setExplicitExprs] = useState<string[]>([]);
  const [showKeypad, setShowKeypad] = useState(false);
  const [inputMode, setInputMode] = useState<'edit' | 'templates'>('edit');
  const [activeIndex, setActiveIndex] = useState(0);
  const chartContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mode === '直角坐标') {
      const explicitList: string[] = [];
      const implicitList: string[] = [];
      
      exprs.forEach(expr => {
        const normalized = expr.replace(/\s/g, '');
        if (!normalized) return; // 跳过空表达式
        const isActuallyImplicit = (normalized.includes('y') && !normalized.startsWith('y=')) || 
                                   (normalized.includes('=') && !normalized.startsWith('y='));
        
        if (isActuallyImplicit) {
          implicitList.push(expr);
        } else {
          explicitList.push(normalized.startsWith('y=') ? expr.split('=')[1] : expr);
        }
      });

      setExplicitExprs(explicitList);
      setPlotData(generatePlotData1D(explicitList, range));
      
      const implicitData = implicitList.map((expr, i) => ({
        points: generateImplicitData(expr, range, viewY, 150),
        name: expr,
        color: COLORS[(explicitList.length + i) % COLORS.length]
      }));
      setImplicitSeries(implicitData);
      
    } else if (mode === '参数方程(2D)') {
      setExplicitExprs([]);
      setImplicitSeries([]);
      setPlotData(generateParametricData(parametricExprs[0], parametricExprs[1], tRange));
    } else if (mode === '极坐标(2D)') {
      setExplicitExprs([]);
      setImplicitSeries([]);
      setPlotData(generatePolarData(polarExpr, thetaRange));
    } else {
      // 3D 模式：数据由 PlotView3D 自行生成，此处无需处理
      setExplicitExprs([]);
      setImplicitSeries([]);
      setPlotData([]);
    }
    // 注意：不依赖 rotX/rotY/zoom3D 与 3D 表达式（3D 渲染由 PlotView3D 独立处理），避免无谓重算
  }, [exprs, mode, range, viewY, tRange, thetaRange, phiRange, parametricExprs, polarExpr]);

  /** 应用示例模板：按当前模式填入对应字段 */
  const applyTemplate = (t: PlotTemplate) => {
    if (mode === '直角坐标') {
      setExprs([...t.fields]);
    } else if (mode === '参数方程(2D)') {
      setParametricExprs([t.fields[0] || '', t.fields[1] || '']);
    } else if (mode === '参数方程(3D)') {
      setParametric3DExprs([t.fields[0] || '', t.fields[1] || '', t.fields[2] || '']);
    } else if (mode === '极坐标(2D)') {
      setPolarExpr(t.fields[0] || '');
    } else if (mode === '球坐标(3D)') {
      setSphericalExpr(t.fields[0] || '');
    } else if (mode === '3D 曲面图') {
      setThreeDExpr(t.fields[0] || '');
    }
  };

  const handleInsert = (val: string) => {
    if (mode === '直角坐标') {
      const newExprs = [...exprs];
      newExprs[activeIndex] = (newExprs[activeIndex] || '') + val;
      setExprs(newExprs);
    } else if (mode === '参数方程(2D)') {
      const n = [...parametricExprs];
      n[activeIndex] = (n[activeIndex] || '') + val;
      setParametricExprs(n as [string, string]);
    } else if (mode === '参数方程(3D)') {
      const n = [...parametric3DExprs];
      n[activeIndex] = (n[activeIndex] || '') + val;
      setParametric3DExprs(n as [string, string, string]);
    } else if (mode === '极坐标(2D)') {
      setPolarExpr(prev => prev + val);
    } else if (mode === '球坐标(3D)') {
      setSphericalExpr(prev => prev + val);
    } else if (mode === '3D 曲面图') {
      setThreeDExpr(prev => prev + val);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    // rAF 节流：拖动时每帧最多更新一次，避免高频 setState 导致图表重算卡顿
    if (rafRef.current != null) return;
    rafRef.current = requestAnimationFrame(() => {
      rafRef.current = null;
      const prev = lastMousePosRef.current;
      const dx = e.clientX - prev.x;
      const dy = e.clientY - prev.y;
      lastMousePosRef.current = { x: e.clientX, y: e.clientY };
      
      if (mode === '3D 曲面图' || mode === '参数方程(3D)' || mode === '球坐标(3D)') {
        setRotX(r => (r + dx * 0.5 + 360) % 360);
        setRotY(r => Math.max(0, Math.min(90, r + dy * 0.5)));
      } else {
        const scaleX = (range[1] - range[0]) / (chartContainerRef.current?.clientWidth || 600);
        const scaleY = (viewY[1] - viewY[0]) / (chartContainerRef.current?.clientHeight || 450);
        
        setRange(r => [r[0] - dx * scaleX, r[1] - dx * scaleX]);
        setViewY(r => [r[0] + dy * scaleY, r[1] + dy * scaleY]);
      }
    });
  };

  const handleWheel = (e: React.WheelEvent) => {
    if (mode === '3D 曲面图' || mode === '参数方程(3D)' || mode === '球坐标(3D)') {
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      setZoom3D(prev => Math.max(0.1, Math.min(10, prev * zoomFactor)));
      return;
    }
    
    const zoomFactor = e.deltaY > 0 ? 1.1 : 0.9;
    
    setRange(prev => {
      const mid = (prev[0] + prev[1]) / 2;
      const halfDim = ((prev[1] - prev[0]) * zoomFactor) / 2;
      return [mid - halfDim, mid + halfDim];
    });
    
    setViewY(prev => {
      const mid = (prev[0] + prev[1]) / 2;
      const halfDim = ((prev[1] - prev[0]) * zoomFactor) / 2;
      return [mid - halfDim, mid + halfDim];
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <h3 className="text-lg font-semibold flex items-center gap-2 text-emerald-600">
            <AreaChart className="w-5 h-5" />
            高级函数可视化引擎
          </h3>
          <div className="flex flex-wrap gap-2 bg-slate-100 p-1 rounded-xl">
            {(['直角坐标', '3D 曲面图', '参数方程(2D)', '参数方程(3D)', '极坐标(2D)', '球坐标(3D)'] as PlotMode[]).map(m => (
              <button 
                key={m}
                onClick={() => { setMode(m); setShowKeypad(false); setActiveIndex(0); }}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${mode === m ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
              >
                {m}
              </button>
            ))}
            <button 
              onClick={() => setShowKeypad(!showKeypad)}
              className={`p-1.5 ml-2 rounded-lg transition-colors ${showKeypad ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-50 text-slate-400'}`}
            >
              <Keyboard className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between gap-3">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">数学表达式输入</label>
              {/* 输入方式选择：手动编辑 / 示例模板 */}
              <div className="flex bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold">
                <button
                  onClick={() => setInputMode('edit')}
                  className={`px-3 py-1 rounded-md transition-all ${inputMode === 'edit' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  ✏️ 手动编辑
                </button>
                <button
                  onClick={() => setInputMode('templates')}
                  className={`px-3 py-1 rounded-md transition-all ${inputMode === 'templates' ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  📋 模板库
                </button>
              </div>
            </div>

            {inputMode === 'templates' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                {TEMPLATES[mode].map(t => (
                  <button
                    key={t.name}
                    onClick={() => applyTemplate(t)}
                    className="text-left p-4 bg-white border border-emerald-100 rounded-2xl hover:border-emerald-300 hover:shadow-md transition-all group"
                    title={`点击应用：${t.fields.join(', ')}`}
                  >
                    <div className="font-bold text-xs text-emerald-700 mb-1 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                      {t.name}
                    </div>
                    <div className="text-[10px] text-slate-500 leading-relaxed">{t.desc}</div>
                    <div className="mt-2 text-[10px] font-mono text-slate-400 truncate">{t.fields.join(', ')}</div>
                  </button>
                ))}
              </div>
            ) : (
            <div className="space-y-3">
              {mode === '直角坐标' && exprs.map((expr, index) => (
                <div key={index} className="flex flex-col gap-2 group animate-in slide-in-from-left-2">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-10 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={expr}
                        onFocus={() => { setActiveIndex(index); setShowKeypad(true); }}
                        onChange={(e) => {
                          const n = [...exprs];
                          n[index] = e.target.value;
                          setExprs(n);
                        }}
                        className={`w-full px-4 py-3 rounded-xl border transition-all truncate outline-none math-font text-sm ${
                          activeIndex === index && showKeypad ? 'border-emerald-500 ring-2 ring-emerald-500/10 bg-white' : 'border-slate-200 bg-slate-50/50'
                        }`}
                        placeholder={`y = f(x) 或 f(x,y) = 0`}
                      />
                      {activeIndex === index && showKeypad && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
                          <div className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-700 text-[9px] font-bold">编辑中</div>
                        </div>
                      )}
                    </div>
                    {exprs.length > 1 && (
                      <button onClick={() => setExprs(exprs.filter((_, i) => i !== index))} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {mode === '参数方程(2D)' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100 animate-in slide-in-from-left-2">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-indigo-400 uppercase ml-1">X 坐标分量 x(t)</label>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-indigo-300">X =</span>
                      <input
                        type="text"
                        value={parametricExprs[0]}
                        onFocus={() => { setActiveIndex(0); setShowKeypad(true); }}
                        onChange={(e) => setParametricExprs([e.target.value, parametricExprs[1]])}
                        className={`flex-1 px-4 py-3 rounded-xl border transition-all outline-none math-font text-sm ${
                          activeIndex === 0 && showKeypad ? 'border-indigo-400 bg-white ring-2 ring-indigo-500/10' : 'border-indigo-100 bg-white/50'
                        }`}
                        placeholder="例如: cos(t)*3"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-indigo-400 uppercase ml-1">Y 坐标分量 y(t)</label>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-indigo-300">Y =</span>
                      <input
                        type="text"
                        value={parametricExprs[1]}
                        onFocus={() => { setActiveIndex(1); setShowKeypad(true); }}
                        onChange={(e) => setParametricExprs([parametricExprs[0], e.target.value])}
                        className={`flex-1 px-4 py-3 rounded-xl border transition-all outline-none math-font text-sm ${
                          activeIndex === 1 && showKeypad ? 'border-indigo-400 bg-white ring-2 ring-indigo-500/10' : 'border-indigo-100 bg-white/50'
                        }`}
                        placeholder="例如: sin(t)*3"
                      />
                    </div>
                  </div>
                </div>
              )}

              {mode === '参数方程(3D)' && (
                <div className="space-y-4 p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 animate-in slide-in-from-left-2">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-emerald-400 uppercase ml-1">X(t)</label>
                      <input
                        type="text"
                        value={parametric3DExprs[0]}
                        onFocus={() => { setActiveIndex(0); setShowKeypad(true); }}
                        onChange={(e) => setParametric3DExprs([e.target.value, parametric3DExprs[1], parametric3DExprs[2]])}
                        className={`w-full px-4 py-3 rounded-xl border transition-all outline-none math-font text-sm ${
                          activeIndex === 0 && showKeypad ? 'border-emerald-500 ring-2 ring-emerald-500/10 bg-white' : 'border-emerald-100 bg-white/50'
                        }`}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-emerald-400 uppercase ml-1">Y(t)</label>
                      <input
                        type="text"
                        value={parametric3DExprs[1]}
                        onFocus={() => { setActiveIndex(1); setShowKeypad(true); }}
                        onChange={(e) => setParametric3DExprs([parametric3DExprs[0], e.target.value, parametric3DExprs[2]])}
                        className={`w-full px-4 py-3 rounded-xl border transition-all outline-none math-font text-sm ${
                          activeIndex === 1 && showKeypad ? 'border-emerald-500 ring-2 ring-emerald-500/10 bg-white' : 'border-emerald-100 bg-white/50'
                        }`}
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-bold text-emerald-400 uppercase ml-1">Z(t)</label>
                      <input
                        type="text"
                        value={parametric3DExprs[2]}
                        onFocus={() => { setActiveIndex(2); setShowKeypad(true); }}
                        onChange={(e) => setParametric3DExprs([parametric3DExprs[0], parametric3DExprs[1], e.target.value])}
                        className={`w-full px-4 py-3 rounded-xl border transition-all outline-none math-font text-sm ${
                          activeIndex === 2 && showKeypad ? 'border-emerald-500 ring-2 ring-emerald-500/10 bg-white' : 'border-emerald-100 bg-white/50'
                        }`}
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pt-2 border-t border-emerald-100/50">
                    <span className="text-[10px] font-bold text-emerald-400 uppercase">参数 t 范围:</span>
                    <div className="flex items-center gap-2">
                      <input type="number" step="0.1" value={tRange[0]} onChange={e => setTRange([Number(e.target.value), tRange[1]])} className="w-16 px-2 py-1 bg-white border border-emerald-100 rounded text-xs font-bold outline-none" />
                      <span className="text-emerald-300">→</span>
                      <input type="number" step="0.1" value={tRange[1]} onChange={e => setTRange([tRange[0], Number(e.target.value)])} className="w-16 px-2 py-1 bg-white border border-emerald-100 rounded text-xs font-bold outline-none" />
                    </div>
                  </div>
                </div>
              )}

              {mode === '极坐标(2D)' && (
                <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 animate-in slide-in-from-left-2">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-emerald-400 uppercase ml-1">极径方程 r(θ)</label>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-emerald-300">r =</span>
                      <input
                        type="text"
                        value={polarExpr}
                        onFocus={() => { setActiveIndex(0); setShowKeypad(true); }}
                        onChange={(e) => setPolarExpr(e.target.value)}
                        className={`flex-1 px-4 py-3 rounded-xl border transition-all outline-none math-font text-sm ${
                          showKeypad ? 'border-emerald-500 bg-white ring-2 ring-emerald-500/10' : 'border-emerald-100 bg-white/50'
                        }`}
                        placeholder="例如: 2 * (1 - cos(theta))"
                      />
                    </div>
                  </div>
                </div>
              )}

              {mode === '球坐标(3D)' && (
                 <div className="p-4 bg-amber-50/50 rounded-2xl border border-amber-100 animate-in slide-in-from-left-2">
                   <div className="space-y-2">
                     <label className="text-[10px] font-bold text-amber-500 uppercase ml-1">球坐标方程 r(θ, φ)</label>
                     <div className="flex items-center gap-3">
                       <span className="text-xs font-black text-amber-300">r =</span>
                       <input
                         type="text"
                         value={sphericalExpr}
                         onFocus={() => { setActiveIndex(0); setShowKeypad(true); }}
                         onChange={(e) => setSphericalExpr(e.target.value)}
                         className={`flex-1 px-4 py-3 rounded-xl border transition-all outline-none math-font text-sm ${
                           showKeypad ? 'border-amber-500 bg-white ring-2 ring-amber-500/10' : 'border-amber-100 bg-white/50'
                         }`}
                         placeholder="例如: 5"
                       />
                     </div>
                   </div>
                 </div>
              )}

              {mode === '3D 曲面图' && (
                <div className="p-4 bg-blue-50/50 rounded-2xl border border-blue-100 animate-in slide-in-from-left-2">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-blue-400 uppercase ml-1">双变量函数 z(x,y)</label>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-black text-blue-300">z =</span>
                      <input
                        type="text"
                        value={threeDExpr}
                        onFocus={() => { setActiveIndex(0); setShowKeypad(true); }}
                        onChange={(e) => setThreeDExpr(e.target.value)}
                        className={`flex-1 px-4 py-3 rounded-xl border transition-all outline-none math-font text-sm ${
                          showKeypad ? 'border-blue-500 bg-white ring-2 ring-blue-500/10' : 'border-blue-100 bg-white/50'
                        }`}
                        placeholder="例如: sin(sqrt(x^2+y^2))"
                      />
                    </div>
                  </div>
                </div>
              )}

              {mode === '直角坐标' && (
                <button onClick={() => setExprs([...exprs, ''])} className="flex items-center gap-2 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors">
                  <Plus className="w-3 h-3" /> 添加新函数
                </button>
              )}
            </div>
            )}

            {inputMode === 'edit' && showKeypad && (
              <div className="pt-2 animate-in zoom-in-95">
                <MathKeypad 
                  onInsert={handleInsert}
                  onDelete={() => {
                    if (mode === '直角坐标') {
                      const n = [...exprs];
                      n[activeIndex] = n[activeIndex].slice(0, -1);
                      setExprs(n);
                    } else if (mode === '参数方程(2D)') {
                      const n = [...parametricExprs];
                      n[activeIndex] = n[activeIndex].slice(0, -1);
                      setParametricExprs(n as [string, string]);
                    } else if (mode === '参数方程(3D)') {
                      const n = [...parametric3DExprs];
                      n[activeIndex] = n[activeIndex].slice(0, -1);
                      setParametric3DExprs(n as [string, string, string]);
                    } else if (mode === '极坐标(2D)') {
                      setPolarExpr(p => p.slice(0, -1));
                    } else if (mode === '球坐标(3D)') {
                      setSphericalExpr(p => p.slice(0, -1));
                    } else if (mode === '3D 曲面图') {
                      setThreeDExpr(p => p.slice(0, -1));
                    }
                  }}
                  onClear={() => {
                    if (mode === '直角坐标') setExprs(['']);
                    else if (mode === '参数方程(2D)') setParametricExprs(['', '']);
                    else if (mode === '参数方程(3D)') setParametric3DExprs(['', '', '']);
                    else if (mode === '极坐标(2D)') setPolarExpr('');
                    else if (mode === '球坐标(3D)') setSphericalExpr('');
                    else if (mode === '3D 曲面图') setThreeDExpr('');
                  }}
                  type="plotting"
                />
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">绘图参数控制</label>
              
              <div className="space-y-4">
                {/* 坐标范围 (x/y 范围，用于直角坐标和 3D) */}
                {(mode === '直角坐标' || mode === '3D 曲面图') && (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100 animate-in fade-in">
                    <Move className="w-4 h-4 text-slate-300" />
                    <input type="number" step="0.5" value={range[0]} onChange={e => setRange([Number(e.target.value), range[1]])} className="w-full bg-transparent text-sm font-bold text-center outline-none" />
                    <span className="text-slate-400 text-[10px] font-bold uppercase w-12 text-center">X 范围</span>
                    <input type="number" step="0.5" value={range[1]} onChange={e => setRange([range[0], Number(e.target.value)])} className="w-full bg-transparent text-sm font-bold text-center outline-none" />
                  </div>
                )}

                {/* 参数方程范围 (t) */}
                {(mode === '参数方程(2D)' || mode === '参数方程(3D)') && (
                  <div className="flex items-center gap-3 p-3 bg-indigo-50 rounded-2xl border border-indigo-100 animate-in fade-in">
                    <RotateCw className="w-4 h-4 text-indigo-300" />
                    <input type="number" step="0.1" value={tRange[0]} onChange={e => setTRange([Number(e.target.value), tRange[1]])} className="w-full bg-transparent text-sm font-bold text-center outline-none" />
                    <span className="text-indigo-400 text-[10px] font-bold uppercase w-12 text-center">t 范围</span>
                    <input type="number" step="0.1" value={tRange[1]} onChange={e => setTRange([tRange[0], Number(e.target.value)])} className="w-full bg-transparent text-sm font-bold text-center outline-none" />
                  </div>
                )}

                {/* 极坐标范围 (theta) */}
                {(mode === '极坐标(2D)' || mode === '球坐标(3D)') && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-2xl border border-emerald-100 animate-in fade-in">
                      <RotateCw className="w-4 h-4 text-emerald-300" />
                      <input type="number" step="0.1" value={thetaRange[0]} onChange={e => setThetaRange([Number(e.target.value), thetaRange[1]])} className="w-full bg-transparent text-sm font-bold text-center outline-none" />
                      <span className="text-emerald-400 text-[10px] font-bold uppercase w-12 text-center">θ 范围</span>
                      <input type="number" step="0.1" value={thetaRange[1]} onChange={e => setThetaRange([thetaRange[0], Number(e.target.value)])} className="w-full bg-transparent text-sm font-bold text-center outline-none" />
                    </div>
                    {mode === '球坐标(3D)' && (
                      <div className="flex items-center gap-3 p-3 bg-amber-50 rounded-2xl border border-amber-100 animate-in fade-in">
                        <RotateCw className="w-4 h-4 text-amber-300" />
                        <input type="number" step="0.1" value={phiRange[0]} onChange={e => setPhiRange([Number(e.target.value), phiRange[1]])} className="w-full bg-transparent text-sm font-bold text-center outline-none" />
                        <span className="text-amber-500 text-[10px] font-bold uppercase w-12 text-center">φ 范围</span>
                        <input type="number" step="0.1" value={phiRange[1]} onChange={e => setPhiRange([phiRange[0], Number(e.target.value)])} className="w-full bg-transparent text-sm font-bold text-center outline-none" />
                      </div>
                    )}
                  </div>
                )}

                {mode === '3D 曲面图' && (
                  <div className="space-y-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">视角旋转 (X)</span>
                      <input type="range" min="0" max="360" value={rotX} onChange={e => setRotX(Number(e.target.value))} className="w-full h-1.5 bg-emerald-100 rounded-lg appearance-none cursor-pointer accent-emerald-600" />
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">垂直倾角 (Y)</span>
                      <input type="range" min="0" max="90" value={rotY} onChange={e => setRotY(Number(e.target.value))} className="w-full h-1.5 bg-emerald-100 rounded-lg appearance-none cursor-pointer accent-emerald-600" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
              <h4 className="text-[10px] font-bold text-emerald-600 uppercase mb-2">操作指南</h4>
              <p className="text-xs text-emerald-800 leading-relaxed">
                {mode === '直角坐标' && "绘制 y = f(x) 函数。请使用 'x' 作为自变量。"}
                {mode === '参数方程(2D)' && "基于时间 't' 定义坐标。非常适合绘制螺旋线和复杂轨迹。"}
                {mode === '极坐标(2D)' && "绘制极径 'r' 与极角 'theta' 的关系。例如心形线 '2 * (1 - cos(theta))'。"}
                {mode === '3D 曲面图' && "通过 3D 投影展示双变量函数 z = f(x, y)。调节上方滑块可旋转视角。"}
                {mode === '参数方程(3D)' && "3D 空间中的参数曲线 (x(t), y(t), z(t))。"}
                {mode === '球坐标(3D)' && "球坐标系下的曲面 r(theta, phi)。"}
              </p>
            </div>
          </div>
        </div>

        <div className="h-[500px] w-full bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-center relative overflow-hidden shadow-inner">
          {mode === '3D 曲面图' || mode === '参数方程(3D)' || mode === '球坐标(3D)' ? (
            <PlotView3D
              mode={mode}
              threeDExpr={threeDExpr}
              parametric3DExprs={parametric3DExprs}
              sphericalExpr={sphericalExpr}
              range={range}
              tRange={tRange}
              thetaRange={thetaRange}
              phiRange={phiRange}
              rotX={rotX}
              rotY={rotY}
              zoom3D={zoom3D}
              isDragging={isDragging}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onWheel={handleWheel}
            />
          ) : (
            <PlotView2D
              mode={mode}
              plotData={plotData}
              implicitSeries={implicitSeries}
              range={range}
              viewY={viewY}
              isDragging={isDragging}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onWheel={handleWheel}
              chartContainerRef={chartContainerRef}
              explicitExprs={explicitExprs}
              COLORS={COLORS}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default PlottingEngine;
