
import React, { useState } from 'react';
import * as math from 'mathjs';

const MatrixTensorEngine: React.FC = () => {
  const [matrixA, setMatrixA] = useState('[[1, 2], [3, 4]]');
  const [matrixB, setMatrixB] = useState('[[5, 6], [7, 8]]');
  const [operation, setOperation] = useState('multiply(A, B)');
  const [result, setResult] = useState<any>(null);

  const compute = () => {
    try {
      const A = math.evaluate(matrixA);
      const B = math.evaluate(matrixB);
      const res = math.evaluate(operation, { A, B });
      setResult(res);
    } catch (e: any) {
      setResult('错误: ' + e.message);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-orange-600">
          矩阵与张量工作台
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">矩阵 A</label>
            <textarea
              value={matrixA}
              onChange={(e) => setMatrixA(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 math-font text-sm h-32 focus:ring-2 focus:ring-orange-500"
              placeholder="[[1, 2], [3, 4]]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">矩阵 B</label>
            <textarea
              value={matrixB}
              onChange={(e) => setMatrixB(e.target.value)}
              className="w-full p-3 rounded-xl border border-slate-200 math-font text-sm h-32 focus:ring-2 focus:ring-orange-500"
              placeholder="[[5, 6], [7, 8]]"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={operation}
            onChange={(e) => setOperation(e.target.value)}
            className="flex-1 px-4 py-2 rounded-xl border border-slate-200 focus:ring-2 focus:ring-orange-500 outline-none math-font"
            placeholder="例如: inv(A), det(A), A * B, transpose(A)"
          />
          <button
            onClick={compute}
            className="px-6 py-2 bg-orange-600 text-white rounded-xl font-medium hover:bg-orange-700 transition-colors"
          >
            开始执行
          </button>
        </div>

        {result && (
          <div className="mt-6">
             <div className="text-sm text-slate-500 mb-2">计算输出 (Output)</div>
             <div className="p-6 bg-slate-900 text-orange-400 rounded-xl overflow-x-auto">
               <pre className="math-font text-lg">
                 {typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
               </pre>
             </div>
          </div>
        )}
      </div>

      <div className="bg-slate-100 p-4 rounded-xl">
        <h4 className="text-xs font-bold text-slate-500 uppercase mb-2">常用运算符速览</h4>
        <div className="flex flex-wrap gap-2">
          {['inv(A)', 'det(A)', 'transpose(A)', 'eigs(A)', 'trace(A)', 'cross(A, B)', 'dot(A, B)'].map(tag => (
            <span key={tag} className="px-2 py-1 bg-white border border-slate-200 rounded text-xs font-mono text-slate-600 cursor-pointer hover:border-orange-300" onClick={() => setOperation(tag)}>
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default MatrixTensorEngine;
