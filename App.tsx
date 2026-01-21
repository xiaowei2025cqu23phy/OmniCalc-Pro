
import React, { useState } from 'react';
import { ToolType } from './types';
import ComplexEngine from './components/ComplexEngine';
import CalculusEngine from './components/CalculusEngine';
import MatrixTensorEngine from './components/MatrixTensorEngine';
import PlottingEngine from './components/PlottingEngine';
import TransformsEngine from './components/TransformsEngine';
import PhysicsRefEngine from './components/PhysicsRefEngine';
import { 
  Calculator, 
  Binary, 
  FunctionSquare, 
  Activity, 
  Github,
  Settings,
  Info,
  Zap,
  WifiOff,
  Globe,
  Library
} from 'lucide-react';

const App: React.FC = () => {
  const [activeTool, setActiveTool] = useState<ToolType>(ToolType.COMPLEX);

  const renderTool = () => {
    switch (activeTool) {
      case ToolType.COMPLEX: return <ComplexEngine />;
      case ToolType.CALCULUS: return <CalculusEngine />;
      case ToolType.MATRIX: return <MatrixTensorEngine />;
      case ToolType.PLOTTING: return <PlottingEngine />;
      case ToolType.TRANSFORMS: return <TransformsEngine />;
      case ToolType.PHYSICS_REF: return <PhysicsRefEngine />;
      default: return <ComplexEngine />;
    }
  };

  const navItems = [
    { id: ToolType.COMPLEX, label: '复数运算', icon: Calculator, color: 'text-purple-600', bg: 'bg-purple-100', offline: true },
    { id: ToolType.MATRIX, label: '矩阵与张量', icon: Binary, color: 'text-orange-600', bg: 'bg-orange-100', offline: true },
    { id: ToolType.PLOTTING, label: '函数可视化', icon: FunctionSquare, color: 'text-emerald-600', bg: 'bg-emerald-100', offline: true },
    { id: ToolType.CALCULUS, label: '微积分与 ODE', icon: Activity, color: 'text-blue-600', bg: 'bg-blue-100', offline: 'hybrid' },
    { id: ToolType.TRANSFORMS, label: '积分变换', icon: Zap, color: 'text-yellow-600', bg: 'bg-yellow-100', offline: false },
    { id: ToolType.PHYSICS_REF, label: '物理速查手册', icon: Library, color: 'text-indigo-600', bg: 'bg-indigo-100', offline: true },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-72 bg-white border-r border-slate-200 flex flex-col z-10 sticky top-0 h-auto md:h-screen">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-200">
            Ω
          </div>
          <div>
            <h1 className="font-bold text-slate-800 tracking-tight">OmniCalc <span className="text-indigo-600">Pro</span></h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">高级数学/物理引擎</p>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTool === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTool(item.id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 group relative ${
                  isActive 
                    ? `${item.bg} ${item.color} shadow-sm` 
                    : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? item.color : 'group-hover:text-slate-800'}`} />
                <span className="font-semibold text-sm flex-1 text-left">{item.label}</span>
                {item.offline === true && <span title="支持离线使用"><WifiOff className="w-3 h-3 opacity-30" /></span>}
                {item.offline === 'hybrid' && <span title="在线/离线混合模式"><Globe className="w-3 h-3 opacity-30" /></span>}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <div className="p-4 bg-slate-50 rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-bold text-slate-500 uppercase">系统状态</span>
              </div>
              <Settings className="w-4 h-4 text-slate-400 cursor-pointer hover:text-indigo-600 transition-colors" />
            </div>
            <p className="text-[10px] text-slate-400 leading-tight">
              混合引擎已开启。基础代数运算将在本地处理以节省响应时间。
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-10 bg-slate-50 overflow-y-auto max-w-5xl mx-auto w-full">
        <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {navItems.find(n => n.id === activeTool)?.label}
            </h2>
            <p className="text-slate-500 mt-1">
              {navItems.find(n => n.id === activeTool)?.offline === true 
                ? '正在使用本地高性能引擎（支持离线）。' 
                : '使用高级符号逻辑引擎（部分功能需要网络连接）。'}
            </p>
          </div>
          <div className="flex gap-2">
            <button className="p-2 bg-white rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors">
              <Info className="w-5 h-5" />
            </button>
            <button className="p-2 bg-white rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors">
              <Github className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          {renderTool()}
        </div>

        <footer className="mt-20 py-8 border-t border-slate-200 text-center">
          <p className="text-sm text-slate-400">
            &copy; 2024 OmniCalc Pro. 本地运算由 <span className="text-emerald-500 font-semibold">MathJS</span> 驱动，高级推理由 <span className="text-indigo-500 font-semibold">Gemini 3 Pro</span> 提供支持。
          </p>
        </footer>
      </main>
    </div>
  );
};

export default App;
