
import React, { useState, useEffect } from 'react';
import { ToolType, ModelType, ApiKeys } from './types';
import ComplexEngine from './components/ComplexEngine';
import CalculusEngine from './components/CalculusEngine';
import MatrixTensorEngine from './components/MatrixTensorEngine';
import PlottingEngine from './components/PlottingEngine';
import TransformsEngine from './components/TransformsEngine';
import PhysicsRefEngine from './components/PhysicsRefEngine';
import ScientificEngine from './components/ScientificEngine';
import EquationEngine from './components/EquationEngine';
import SettingsModal from './components/SettingsModal';
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
  Library,
  ChevronRight,
  Variable,
  Hash,
  Sparkles,
  Cpu,
  Key
} from 'lucide-react';

const App: React.FC = () => {
  const [activeTool, setActiveTool] = useState<ToolType>(ToolType.SCIENTIFIC);
  const [selectedModel, setSelectedModel] = useState<ModelType>(ModelType.GEMINI);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [apiKeys, setApiKeys] = useState<ApiKeys>(() => {
    const saved = localStorage.getItem('omnicalc_api_keys');
    return saved ? JSON.parse(saved) : {};
  });

  const handleSaveKeys = (keys: ApiKeys) => {
    setApiKeys(keys);
    localStorage.setItem('omnicalc_api_keys', JSON.stringify(keys));
  };

  const renderTool = () => {
    switch (activeTool) {
      case ToolType.SCIENTIFIC: return <ScientificEngine />;
      case ToolType.COMPLEX: return <ComplexEngine />;
      case ToolType.CALCULUS: return <CalculusEngine model={selectedModel} apiKeys={apiKeys} />;
      case ToolType.MATRIX: return <MatrixTensorEngine />;
      case ToolType.PLOTTING: return <PlottingEngine />;
      case ToolType.TRANSFORMS: return <TransformsEngine model={selectedModel} apiKeys={apiKeys} />;
      case ToolType.EQUATION: return <EquationEngine model={selectedModel} apiKeys={apiKeys} />;
      case ToolType.PHYSICS_REF: return <PhysicsRefEngine />;
      default: return <ScientificEngine />;
    }
  };

  const navItems = [
    { id: ToolType.SCIENTIFIC, label: '科学计算', icon: Calculator, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200', offline: true },
    { id: ToolType.COMPLEX, label: '复数运算', icon: Hash, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', offline: true },
    { id: ToolType.MATRIX, label: '矩阵与张量', icon: Binary, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', offline: true },
    { id: ToolType.EQUATION, label: '方程求解', icon: Variable, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200', offline: 'hybrid' },
    { id: ToolType.PLOTTING, label: '函数可视化', icon: FunctionSquare, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', offline: true },
    { id: ToolType.CALCULUS, label: '微积分与 ODE', icon: Activity, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', offline: 'hybrid' },
    { id: ToolType.TRANSFORMS, label: '积分变换', icon: Zap, color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200', offline: false },
    { id: ToolType.PHYSICS_REF, label: '物理速查手册', icon: Library, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200', offline: true },
  ];

  const models = [
    { id: ModelType.GEMINI, label: 'Gemini 2.0', icon: Sparkles, color: 'text-blue-500', bg: 'bg-blue-50', border: 'border-blue-200' },
    { id: ModelType.DEEPSEEK, label: 'DeepSeek V3', icon: Cpu, color: 'text-indigo-500', bg: 'bg-indigo-50', border: 'border-indigo-200' },
    { id: ModelType.QWEN, label: 'Qwen Max', icon: Globe, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  ];

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#F8FAFC]">
      {/* Sidebar */}
      <aside className="w-full md:w-80 bg-white border-r border-slate-200 flex flex-col z-20 sticky top-0 h-auto md:h-screen shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <div className="p-8 border-b border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-xl shadow-indigo-100 ring-4 ring-indigo-50">
            Ω
          </div>
          <div>
            <h1 className="font-extrabold text-slate-900 tracking-tight text-xl">OmniCalc <span className="text-indigo-600">Pro</span></h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Scientific Engine v1.0</p>
          </div>
        </div>

        <nav className="flex-1 p-6 space-y-3 overflow-y-auto custom-scrollbar">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4 px-2">数学工具模块</div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTool === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTool(item.id)}
                className={`w-full flex items-center gap-3 p-4 rounded-2xl transition-all duration-300 group relative border ${
                  isActive 
                    ? `${item.bg} ${item.color} ${item.border} shadow-sm translate-x-1` 
                    : 'text-slate-500 border-transparent hover:bg-slate-50 hover:text-slate-700'
                }`}
              >
                <div className={`p-2 rounded-xl transition-colors ${isActive ? 'bg-white shadow-sm' : 'bg-slate-50 group-hover:bg-white'}`}>
                  <Icon className={`w-5 h-5 ${isActive ? item.color : 'text-slate-400 group-hover:text-slate-600'}`} />
                </div>
                <span className="font-bold text-sm flex-1 text-left">{item.label}</span>
                {isActive && <ChevronRight className="w-4 h-4 opacity-50" />}
                {!isActive && item.offline === true && <WifiOff className="w-3 h-3 opacity-20" />}
              </button>
            );
          })}
        </nav>

        <div className="p-6 mt-auto border-t border-slate-100">
          <div className="p-5 bg-gradient-to-br from-slate-900 to-slate-800 rounded-[2rem] text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-colors"></div>
            <div className="flex items-center justify-between mb-3 relative z-10">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-400 rounded-full animate-ping"></div>
                <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">内核状态</span>
              </div>
              <Settings 
                className="w-4 h-4 text-slate-400 cursor-pointer hover:text-white transition-colors" 
                onClick={() => setIsSettingsOpen(true)}
              />
            </div>
            <p className="text-xs text-slate-400 leading-relaxed relative z-10 font-medium">
              符号计算引擎已就绪。{models.find(m => m.id === selectedModel)?.label} 处于监听状态，随时准备处理复杂逻辑推导。
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-12 lg:p-16 overflow-y-auto max-w-[1400px] mx-auto w-full">
        <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-1 w-8 bg-indigo-600 rounded-full"></div>
              <span className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Workspace</span>
            </div>
            <h2 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tight">
              {navItems.find(n => n.id === activeTool)?.label}
            </h2>
            
            {/* Model Selector */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mr-2">推理引擎:</span>
              {models.map((model) => {
                const Icon = model.icon;
                const isSelected = selectedModel === model.id;
                return (
                  <button
                    key={model.id}
                    onClick={() => setSelectedModel(model.id)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                      isSelected 
                        ? `${model.bg} ${model.color} ${model.border} shadow-sm` 
                        : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    {model.label}
                  </button>
                );
              })}
            </div>

            <p className="text-slate-500 text-lg font-medium max-w-2xl pt-2">
              {navItems.find(n => n.id === activeTool)?.offline === true 
                ? '采用本地 WebAssembly 符号引擎，毫秒级响应，支持完全离线操作。' 
                : `结合 ${models.find(m => m.id === selectedModel)?.label} 云端推理，支持分步推导与高阶数学逻辑分析。`}
            </p>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="flex items-center gap-2 px-5 py-3 bg-white rounded-2xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all shadow-sm hover:shadow-md"
            >
              <Settings className="w-4 h-4" /> API 设置
            </button>
            <button className="flex items-center gap-2 px-5 py-3 bg-white rounded-2xl border border-slate-200 text-slate-600 font-bold text-sm hover:bg-slate-50 transition-all shadow-sm hover:shadow-md">
              <Info className="w-4 h-4" /> 帮助说明
            </button>
            <a 
              href="https://github.com/xiaowei2025cqu23phy/OmniCalc-Pro"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-black transition-all shadow-lg shadow-slate-200"
            >
              <Github className="w-4 h-4" /> 源代码
            </a>
          </div>
        </header>

        <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out">
          {renderTool()}
        </div>

        <SettingsModal 
          isOpen={isSettingsOpen} 
          onClose={() => setIsSettingsOpen(false)} 
          onSave={handleSaveKeys} 
          initialKeys={apiKeys} 
        />

        <footer className="mt-32 py-12 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 font-bold text-sm italic">Ω</div>
             <p className="text-sm text-slate-400 font-medium">
               &copy; 2024 OmniCalc Pro. 基于开源精神构建。
             </p>
          </div>
          <div className="flex gap-8 items-center">
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Local Engine</span>
              <span className="text-xs font-bold text-slate-500">MathJS v15.1</span>
            </div>
            <div className="h-8 w-px bg-slate-200"></div>
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">AI Reasoning</span>
              <span className={`text-xs font-bold ${models.find(m => m.id === selectedModel)?.color}`}>
                {models.find(m => m.id === selectedModel)?.label}
              </span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default App;
