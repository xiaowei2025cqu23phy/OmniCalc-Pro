
import React, { useState, useEffect } from 'react';
import { X, Key, Save, ShieldCheck, AlertCircle } from 'lucide-react';
import { ApiKeys } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (keys: ApiKeys) => void;
  initialKeys: ApiKeys;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, onSave, initialKeys }) => {
  const [keys, setKeys] = useState<ApiKeys>(initialKeys);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setKeys(initialKeys);
    }
  }, [isOpen, initialKeys]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSave(keys);
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-100">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-slate-900 tracking-tight">API 配置中心</h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">推理引擎密钥管理</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded-xl transition-colors text-slate-400 hover:text-slate-600 border border-transparent hover:border-slate-100">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-8 space-y-6">
          <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
            <p className="text-xs text-amber-700 leading-relaxed font-medium">
              密钥将仅保存在您的浏览器本地存储中。如果您未设置，系统将尝试使用默认环境变量。
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Gemini API Key</label>
              <input
                type="password"
                value={keys.gemini || ''}
                onChange={(e) => setKeys({ ...keys, gemini: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none text-sm font-mono transition-all bg-slate-50/50 focus:bg-white"
                placeholder="在此输入 Gemini API 密钥..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">DeepSeek API Key</label>
              <input
                type="password"
                value={keys.deepseek || ''}
                onChange={(e) => setKeys({ ...keys, deepseek: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none text-sm font-mono transition-all bg-slate-50/50 focus:bg-white"
                placeholder="在此输入 DeepSeek API 密钥..."
              />
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Qwen (Aliyun) API Key</label>
              <input
                type="password"
                value={keys.qwen || ''}
                onChange={(e) => setKeys({ ...keys, qwen: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500 outline-none text-sm font-mono transition-all bg-slate-50/50 focus:bg-white"
                placeholder="在此输入通义千问 API 密钥..."
              />
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={showSuccess}
            className={`w-full py-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
              showSuccess 
                ? 'bg-emerald-500 text-white shadow-emerald-100' 
                : 'bg-slate-900 text-white hover:bg-black shadow-slate-200'
            }`}
          >
            {showSuccess ? (
              <><ShieldCheck className="w-5 h-5" /> 配置已保存</>
            ) : (
              <><Save className="w-5 h-5" /> 保存配置</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
