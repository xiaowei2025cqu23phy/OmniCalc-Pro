
import React from 'react';
import { 
  Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  ComposedChart, Scatter, ReferenceLine
} from 'recharts';
import { Maximize2 } from 'lucide-react';

interface PlotView2DProps {
  mode: string;
  plotData: any[];
  implicitSeries: { points: any[], name: string, color: string }[];
  range: [number, number];
  viewY: [number, number];
  isDragging: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: () => void;
  onWheel: (e: React.WheelEvent) => void;
  chartContainerRef: React.RefObject<HTMLDivElement>;
  /** 仅显式（y=f(x)）表达式列表，与 generatePlotData1D 的 val_${index} 索引严格对应 */
  explicitExprs: string[];
  COLORS: string[];
}

const PlotView2D: React.FC<PlotView2DProps> = ({
  mode, plotData, implicitSeries, range, viewY, isDragging,
  onMouseDown, onMouseMove, onMouseUp, onWheel, chartContainerRef,
  explicitExprs, COLORS
}) => {
  return (
    <div 
      className={`w-full h-full cursor-move select-none p-4 ${isDragging ? 'grabbing' : 'grab'}`}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onWheel={onWheel}
      ref={chartContainerRef}
    >
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={plotData} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <ReferenceLine x={0} stroke="#cbd5e1" strokeDasharray="3 3" />
          <ReferenceLine y={0} stroke="#cbd5e1" strokeDasharray="3 3" />
          <XAxis 
            dataKey="x" 
            type="number" 
            domain={range} 
            stroke="#94a3b8" 
            fontSize={10} 
            tickFormatter={v => typeof v === 'number' ? v.toFixed(1) : v}
            allowDataOverflow
          />
          <YAxis 
            stroke="#94a3b8" 
            fontSize={10} 
            type="number"
            domain={viewY}
            tickFormatter={v => typeof v === 'number' ? v.toFixed(1) : v}
            allowDataOverflow
          />
          <Tooltip 
            cursor={{ stroke: '#10b981', strokeWidth: 1 }}
            contentStyle={{ backgroundColor: '#fff', borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}
          />
          <Legend iconType="circle" />
          
          {mode === '直角坐标' ? (
            <>
              {/* 显式曲线：索引与 plotData 的 val_${index} 严格一致 */}
              {explicitExprs.map((expr, index) => (
                <Line 
                  key={index}
                  name={expr || `函数${index+1}`}
                  type="monotone" 
                  dataKey={`val_${index}`} 
                  stroke={COLORS[index % COLORS.length]} 
                  strokeWidth={3} 
                  dot={false} 
                  connectNulls
                  animationDuration={0}
                  isAnimationActive={false}
                />
              ))}
              {/* Implicit Scatter Points */}
              {implicitSeries.map((series, index) => (
                <Scatter
                  key={`implicit-${index}`}
                  name={series.name}
                  data={series.points}
                  fill={series.color}
                  line={false}
                  shape="circle"
                  r={1.2}
                  isAnimationActive={false}
                />
              ))}
            </>
          ) : (
            <Line 
              name={mode === '参数方程(2D)' ? `轨迹(t)` : `极径 r(θ)`}
              type="monotone" 
              dataKey="y" 
              stroke="#10b981" 
              strokeWidth={3} 
              dot={false} 
              animationDuration={400}
            />
          )}
        </ComposedChart>
      </ResponsiveContainer>
      <div className="absolute top-4 right-4 bg-white/80 backdrop-blur px-3 py-1.5 rounded-full border border-slate-200 text-[10px] font-bold text-slate-500 flex items-center gap-2 z-10 pointer-events-none">
        <Maximize2 className="w-3 h-3 text-emerald-500" /> 交互式视图：双指缩放/拖拽平移
      </div>
    </div>
  );
};

export default PlotView2D;
