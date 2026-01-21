
import React, { useState, useEffect, useRef } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { generatePlotData1D, generatePlotData2D, generateParametricData, generatePolarData } from '../utils/mathUtils';
import { AreaChart, Plus, Trash2, Keyboard, RotateCw, Move, Box } from 'lucide-react';
import MathKeypad from './MathKeypad';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

type PlotMode = '直角坐标' | '参数方程' | '极坐标' | '3D 曲面图';

const PlottingEngine: React.FC = () => {
  const [mode, setMode] = useState<PlotMode>('直角坐标');
  const [exprs, setExprs] = useState<string[]>(['sin(x)', 'cos(x)']);
  const [threeDExpr, setThreeDExpr] = useState<string>('sin(sqrt(x^2 + y^2)) / sqrt(x^2 + y^2)');
  const [parametricExprs, setParametricExprs] = useState<[string, string]>(['cos(t)*3', 'sin(t)*3']);
  const [polarExpr, setPolarExpr] = useState<string>('2 * (1 - cos(theta))');
  
  const [range, setRange] = useState<[number, number]>([-10, 10]);
  const [tRange, setTRange] = useState<[number, number]>([0, 6.28]); 
  const [thetaRange, setThetaRange] = useState<[number, number]>([0, 6.28]);
  
  // 3D 旋转状态
  const [rotX, setRotX] = useState(45);
  const [rotY, setRotY] = useState(30);

  const [plotData, setPlotData] = useState<any[]>([]);
  const [showKeypad, setShowKeypad] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (mode === '直角坐标') {
      setPlotData(generatePlotData1D(exprs, range));
    } else if (mode === '参数方程') {
      setPlotData(generateParametricData(parametricExprs[0], parametricExprs[1], tRange));
    } else if (mode === '极坐标') {
      setPlotData(generatePolarData(polarExpr, thetaRange));
    } else if (mode === '3D 曲面图') {
      draw3DPlot();
    }
  }, [exprs, threeDExpr, parametricExprs, polarExpr, mode, range, tRange, thetaRange, rotX, rotY]);

  const handleInsert = (val: string) => {
    if (mode === '直角坐标') {
      const newExprs = [...exprs];
      newExprs[activeIndex] = (newExprs[activeIndex] || '') + val;
      setExprs(newExprs);
    } else if (mode === '参数方程') {
      const n = [...parametricExprs] as [string, string];
      n[activeIndex] = n[activeIndex] + val;
      setParametricExprs(n);
    } else if (mode === '极坐标') {
      setPolarExpr(prev => prev + val);
    } else if (mode === '3D 曲面图') {
      setThreeDExpr(prev => prev + val);
    }
  };

  const draw3DPlot = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const res = 40; // 分辨率
    const w = canvas.width;
    const h = canvas.height;
    const data = generatePlotData2D(threeDExpr, range, range, res);

    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = "rgba(100, 116, 139, 0.3)";
    ctx.lineWidth = 0.5;

    // 投影算法
    const project = (x: number, y: number, z: number) => {
      // 归一化到 -1 到 1
      const nx = (x - range[0]) / (range[1] - range[0]) * 2 - 1;
      const ny = (y - range[0]) / (range[1] - range[0]) * 2 - 1;
      
      // 这里的 Z 需要特殊处理，防止溢出
      const nz = isNaN(z) || !isFinite(z) ? 0 : z * 0.5;

      // 旋转矩阵
      const radX = rotX * Math.PI / 180;
      const radY = rotY * Math.PI / 180;

      let x1 = nx * Math.cos(radX) - ny * Math.sin(radX);
      let y1 = nx * Math.sin(radX) + ny * Math.cos(radX);

      let y2 = y1 * Math.cos(radY) - nz * Math.sin(radY);
      let z2 = y1 * Math.sin(radY) + nz * Math.cos(radY);

      const scale = 150;
      return {
        px: w / 2 + x1 * scale,
        py: h / 2 - y2 * scale,
        zDepth: z2
      };
    };

    // 绘制网格
    for (let i = 0; i < res; i++) {
      for (let j = 0; j < res; j++) {
        const p1 = data[i * (res + 1) + j];
        const p2 = data[(i + 1) * (res + 1) + j];
        const p3 = data[(i + 1) * (res + 1) + (j + 1)];
        const p4 = data[i * (res + 1) + (j + 1)];

        if (!p1 || !p2 || !p3 || !p4) continue;

        const proj1 = project(p1.x, p1.y, p1.z);
        const proj2 = project(p2.x, p2.y, p2.z);
        const proj3 = project(p3.x, p3.y, p3.z);
        const proj4 = project(p4.x, p4.y, p4.z);

        ctx.beginPath();
        ctx.moveTo(proj1.px, proj1.py);
        ctx.lineTo(proj2.px, proj2.py);
        ctx.lineTo(proj3.px, proj3.py);
        ctx.lineTo(proj4.px, proj4.py);
        ctx.closePath();

        // 填充颜色逻辑 - 根据高度 z
        const hue = 200 + (p1.z * 20); // 基础蓝色 + 高度偏移
        ctx.fillStyle = `hsla(${hue}, 70%, 50%, 0.8)`;
        ctx.fill();
        ctx.stroke();
      }
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
            {(['直角坐标', '3D 曲面图', '参数方程', '极坐标'] as PlotMode[]).map(m => (
              <button 
                key={m}
                onClick={() => { setMode(m); setShowKeypad(false); }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${mode === m ? 'bg-white shadow-sm text-emerald-600' : 'text-slate-500 hover:text-slate-700'}`}
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
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">数学表达式输入</label>
            
            <div className="space-y-3">
              {mode === '直角坐标' && exprs.map((expr, index) => (
                <div key={index} className="flex items-center gap-2 group animate-in slide-in-from-left-2">
                  <div className="w-1.5 h-10 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                  <input
                    type="text"
                    value={expr}
                    onFocus={() => { setActiveIndex(index); setShowKeypad(true); }}
                    onChange={(e) => {
                      const n = [...exprs];
                      n[index] = e.target.value;
                      setExprs(n);
                    }}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none math-font text-sm bg-slate-50/50"
                    placeholder={`y = f(x)`}
                  />
                  {exprs.length > 1 && (
                    <button onClick={() => setExprs(exprs.filter((_, i) => i !== index))} className="p-2 text-slate-300 hover:text-red-500 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}

              {mode === '参数方程' && (
                <div className="space-y-3 animate-in slide-in-from-left-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-400 w-8">x(t) =</span>
                    <input
                      type="text"
                      value={parametricExprs[0]}
                      onFocus={() => { setActiveIndex(0); setShowKeypad(true); }}
                      onChange={(e) => setParametricExprs([e.target.value, parametricExprs[1]])}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none math-font text-sm"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-400 w-8">y(t) =</span>
                    <input
                      type="text"
                      value={parametricExprs[1]}
                      onFocus={() => { setActiveIndex(1); setShowKeypad(true); }}
                      onChange={(e) => setParametricExprs([parametricExprs[0], e.target.value])}
                      className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none math-font text-sm"
                    />
                  </div>
                </div>
              )}

              {mode === '极坐标' && (
                <div className="flex items-center gap-3 animate-in slide-in-from-left-2">
                  <span className="text-xs font-bold text-slate-400 w-8">r(θ) =</span>
                  <input
                    type="text"
                    value={polarExpr}
                    onFocus={() => setShowKeypad(true)}
                    onChange={(e) => setPolarExpr(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none math-font text-sm"
                  />
                </div>
              )}

              {mode === '3D 曲面图' && (
                <div className="flex items-center gap-3 animate-in slide-in-from-left-2">
                  <span className="text-xs font-bold text-slate-400 w-12 text-right">z(x,y)=</span>
                  <input
                    type="text"
                    value={threeDExpr}
                    onFocus={() => setShowKeypad(true)}
                    onChange={(e) => setThreeDExpr(e.target.value)}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none math-font text-sm"
                  />
                </div>
              )}

              {mode === '直角坐标' && (
                <button onClick={() => setExprs([...exprs, ''])} className="flex items-center gap-2 text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors">
                  <Plus className="w-3 h-3" /> 添加新函数
                </button>
              )}
            </div>

            {showKeypad && (
              <div className="pt-2 animate-in zoom-in-95">
                <MathKeypad 
                  onInsert={handleInsert}
                  onDelete={() => {
                    if (mode === '直角坐标') {
                      const n = [...exprs];
                      n[activeIndex] = n[activeIndex].slice(0, -1);
                      setExprs(n);
                    } else if (mode === '参数方程') {
                      const n = [...parametricExprs];
                      n[activeIndex] = n[activeIndex].slice(0, -1);
                      setParametricExprs(n as [string, string]);
                    } else if (mode === '极坐标') {
                      setPolarExpr(p => p.slice(0, -1));
                    } else if (mode === '3D 曲面图') {
                      setThreeDExpr(p => p.slice(0, -1));
                    }
                  }}
                  onClear={() => {
                    if (mode === '直角坐标') setExprs(['']);
                    else if (mode === '参数方程') setParametricExprs(['', '']);
                    else if (mode === '极坐标') setPolarExpr('');
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
                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <Move className="w-4 h-4 text-slate-300" />
                  <input type="number" step="0.5" value={range[0]} onChange={e => setRange([Number(e.target.value), range[1]])} className="w-full bg-transparent text-sm font-bold text-center outline-none" />
                  <span className="text-slate-200 text-xs">范围</span>
                  <input type="number" step="0.5" value={range[1]} onChange={e => setRange([range[0], Number(e.target.value)])} className="w-full bg-transparent text-sm font-bold text-center outline-none" />
                </div>

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
                {mode === '参数方程' && "基于时间 't' 定义坐标。非常适合绘制螺旋线和复杂轨迹。"}
                {mode === '极坐标' && "绘制极径 'r' 与极角 'theta' 的关系。例如心形线 '2 * (1 - cos(theta))'。"}
                {mode === '3D 曲面图' && "通过 3D 投影展示双变量函数 z = f(x, y)。调节上方滑块可旋转视角。"}
              </p>
            </div>
          </div>
        </div>

        <div className="h-[500px] w-full bg-slate-50 rounded-3xl border border-slate-100 flex items-center justify-center relative overflow-hidden shadow-inner">
          {mode === '3D 曲面图' ? (
            <div className="relative group w-full h-full flex flex-col items-center justify-center">
              <div className="absolute top-4 left-4 bg-white/80 backdrop-blur px-3 py-1.5 rounded-full border border-slate-200 text-[10px] font-bold text-slate-500 flex items-center gap-2 z-10">
                <Box className="w-3 h-3 text-emerald-500" /> 交互式 3D 投影视图
              </div>
              <canvas ref={canvasRef} width={600} height={450} className="rounded-xl bg-transparent" />
              <div className="mt-4 flex gap-6 text-[10px] font-bold text-slate-400">
                 <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-blue-400" /> 低洼处</span>
                 <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-400" /> 高峰处</span>
              </div>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={plotData} margin={{ top: 30, right: 30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="2 2" stroke="#e2e8f0" />
                <XAxis 
                  dataKey="x" 
                  type="number" 
                  domain={['auto', 'auto']} 
                  stroke="#94a3b8" 
                  fontSize={10} 
                  tickFormatter={v => v.toFixed(1)} 
                />
                <YAxis 
                  stroke="#94a3b8" 
                  fontSize={10} 
                  domain={['auto', 'auto']}
                />
                <Tooltip 
                  cursor={{ stroke: '#10b981', strokeWidth: 1 }}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}
                />
                <Legend iconType="circle" />
                
                {mode === '直角坐标' ? (
                  exprs.map((expr, index) => (
                    <Line 
                      key={index}
                      name={expr || `函数${index+1}`}
                      type="monotone" 
                      dataKey={`val_${index}`} 
                      stroke={COLORS[index % COLORS.length]} 
                      strokeWidth={3} 
                      dot={false} 
                      connectNulls
                      animationDuration={400}
                    />
                  ))
                ) : (
                  <Line 
                    name={mode === '参数方程' ? `轨迹(t)` : `极径 r(θ)`}
                    type="monotone" 
                    dataKey="y" 
                    stroke="#10b981" 
                    strokeWidth={3} 
                    dot={false} 
                    animationDuration={600}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlottingEngine;
