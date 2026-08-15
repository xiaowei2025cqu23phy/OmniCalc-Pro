
import React, { useEffect, useRef } from 'react';
import { Box } from 'lucide-react';
import { 
  generatePlotData2D, generateParametricData3D, generateSphericalData 
} from '../utils/mathUtils';

interface PlotView3DProps {
  mode: string;
  threeDExpr: string;
  parametric3DExprs: [string, string, string];
  sphericalExpr: string;
  range: [number, number];
  tRange: [number, number];
  thetaRange: [number, number];
  phiRange: [number, number];
  rotX: number;
  rotY: number;
  zoom3D: number;
  isDragging: boolean;
  onMouseDown: (e: React.MouseEvent) => void;
  onMouseMove: (e: React.MouseEvent) => void;
  onMouseUp: () => void;
  onWheel: (e: React.WheelEvent) => void;
}

const PlotView3D: React.FC<PlotView3DProps> = ({
  mode, threeDExpr, parametric3DExprs, sphericalExpr, range, tRange, thetaRange, phiRange,
  rotX, rotY, zoom3D, isDragging, onMouseDown, onMouseMove, onMouseUp, onWheel
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const res = mode === '参数方程(3D)' ? 200 : 40; 
    const w = canvas.width;
    const h = canvas.height;
    
    let points: any[] = [];
    // 记录各轴实际范围，用于动态归一化，避免硬编码 /10 导致视图错乱
    let xMin = -10, xMax = 10, yMin = -10, yMax = 10, zMin = -10, zMax = 10;
    if (mode === '3D 曲面图') {
      points = generatePlotData2D(threeDExpr, range, range, res);
      xMin = range[0]; xMax = range[1];
      yMin = range[0]; yMax = range[1];
    } else if (mode === '参数方程(3D)') {
      points = generateParametricData3D(parametric3DExprs[0], parametric3DExprs[1], parametric3DExprs[2], tRange, res);
    } else if (mode === '球坐标(3D)') {
      points = generateSphericalData(sphericalExpr, thetaRange, phiRange, res);
    }

    // 计算参数/球坐标的实际坐标范围（曲面图已由 range 给定），过滤 NaN
    if (mode !== '3D 曲面图' && points.length > 0) {
      const finite = (key: 'x' | 'y' | 'z') => points.map(p => p[key]).filter(v => isFinite(v));
      if (finite('x').length) { xMin = Math.min(...finite('x')); xMax = Math.max(...finite('x')); }
      if (finite('y').length) { yMin = Math.min(...finite('y')); yMax = Math.max(...finite('y')); }
      if (finite('z').length) { zMin = Math.min(...finite('z')); zMax = Math.max(...finite('z')); }
    }
    // 防止退化（范围为 0）导致除零
    const safeSpan = (lo: number, hi: number) => (hi - lo) === 0 ? 1 : (hi - lo);
    const spanX = safeSpan(xMin, xMax);
    const spanY = safeSpan(yMin, yMax);
    const spanZ = safeSpan(zMin, zMax);

    ctx.clearRect(0, 0, w, h);

    const project = (x: number, y: number, z: number) => {
      // 归一化到 [-1, 1]，再统一缩放
      const nx = ((x - xMin) / spanX) * 2 - 1;
      const ny = ((y - yMin) / spanY) * 2 - 1;
      const nz = isNaN(z) || !isFinite(z) ? 0 : ((z - zMin) / spanZ) * 2 - 1;

      const ax = (rotY - 90) * Math.PI / 180;
      const ay = rotX * Math.PI / 180;

      const x1 = nx * Math.cos(ay) + ny * Math.sin(ay);
      const y1 = ny * Math.cos(ay) - nx * Math.sin(ay);
      const z1 = nz;

      const x2 = x1;
      const y2 = y1 * Math.cos(ax) - z1 * Math.sin(ax);
      const z2 = z1 * Math.cos(ax) + y1 * Math.sin(ax);

      const distance = 5;
      const perspective = 1000 * zoom3D;
      const depth = z2 + distance;
      const factor = perspective / (depth > 0.1 ? depth : 0.1);
      
      return {
        px: w / 2 + x2 * factor,
        py: h / 2 + y2 * factor,
        zDepth: z2
      };
    };

    const drawAxis = (x: number, y: number, z: number, color: string, label: string) => {
      const start = project(0, 0, 0);
      const end = project(x, y, z);
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 5]);
      ctx.moveTo(start.px, start.py);
      ctx.lineTo(end.px, end.py);
      ctx.stroke();
      ctx.setLineDash([]);
      
      ctx.fillStyle = color;
      ctx.font = 'bold 10px Inter';
      ctx.fillText(label, end.px + 5, end.py + 5);
    };

    drawAxis(xMax, 0, 0, '#ef4444', 'X');
    drawAxis(0, yMax, 0, '#10b981', 'Y');
    drawAxis(0, 0, zMax, '#3b82f6', 'Z');

    const projectedPoints = points.map(p => ({
      ...p,
      proj: project(p.x, p.y, p.z)
    }));

    if (mode === '3D 曲面图' || mode === '球坐标(3D)') {
      const polygons = [];
      const resolution = res;
      for (let i = 0; i < resolution; i++) {
        for (let j = 0; j < resolution; j++) {
          const idx1 = i * (resolution + 1) + j;
          const idx2 = (i + 1) * (resolution + 1) + j;
          const idx3 = (i + 1) * (resolution + 1) + (j + 1);
          const idx4 = i * (resolution + 1) + (j + 1);

          const p1 = projectedPoints[idx1];
          const p2 = projectedPoints[idx2];
          const p3 = projectedPoints[idx3];
          const p4 = projectedPoints[idx4];

          if (!p1 || !p2 || !p3 || !p4) continue;
          // 跳过含 NaN 的退化单元，避免出现飞到原点的乱码多边形
          if ([p1.z, p2.z, p3.z, p4.z].some(v => isNaN(v) || !isFinite(v))) continue;

          const avgZDepth = (p1.proj.zDepth + p2.proj.zDepth + p3.proj.zDepth + p4.proj.zDepth) / 4;
          const avgZValue = (p1.z + p2.z + p3.z + p4.z) / 4;
          
          polygons.push({
            nodes: [p1.proj, p2.proj, p3.proj, p4.proj],
            zDepth: avgZDepth,
            zValue: avgZValue
          });
        }
      }

      // 按深度排序：远的先画（zDepth 越大越远，取决于投影方向，此处保持原逻辑）
      polygons.sort((a, b) => b.zDepth - a.zDepth);

      // 计算 z 值范围用于颜色归一化，避免硬编码 [-5,5] 范围
      const zValues = polygons.map(p => p.zValue);
      const zLo = zValues.length ? Math.min(...zValues) : -1;
      const zHi = zValues.length ? Math.max(...zValues) : 1;
      const zSpan = (zHi - zLo) === 0 ? 1 : (zHi - zLo);

      polygons.forEach(poly => {
        ctx.beginPath();
        poly.nodes.forEach((node, i) => {
          if (i === 0) ctx.moveTo(node.px, node.py);
          else ctx.lineTo(node.px, node.py);
        });
        ctx.closePath();

        // 归一化 z 到 [0,1]，映射色相：低值=蓝(240)，高值=红(0)
        const norm = (poly.zValue - zLo) / zSpan;
        const hue = 240 - norm * 240;
        const lightness = Math.max(35, Math.min(75, 50 + poly.zDepth * 8));
        
        ctx.fillStyle = `hsla(${hue}, 75%, ${lightness}%, 0.88)`;
        ctx.fill();
        ctx.strokeStyle = `hsla(${hue}, 75%, 40%, 0.35)`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      });
    } else if (mode === '参数方程(3D)') {
      for (let i = 0; i < projectedPoints.length - 1; i++) {
        const p1 = projectedPoints[i];
        const p2 = projectedPoints[i+1];
        ctx.beginPath();
        ctx.lineWidth = 3;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        const avgDepth = (p1.proj.zDepth + p2.proj.zDepth) / 2;
        const opacity = Math.max(0.2, Math.min(1, (avgDepth + 2) / 4));
        const hue = (p1.t * 50) % 360;
        ctx.strokeStyle = `hsla(${hue}, 70%, 50%, ${opacity})`;
        ctx.moveTo(p1.proj.px, p1.proj.py);
        ctx.lineTo(p2.proj.px, p2.proj.py);
        ctx.stroke();
      }
    }
  }, [mode, threeDExpr, parametric3DExprs, sphericalExpr, range, tRange, thetaRange, phiRange, rotX, rotY, zoom3D]);

  return (
    <div className="relative group w-full h-full flex flex-col items-center justify-center">
      <div className="absolute top-4 left-4 bg-white/80 backdrop-blur px-3 py-1.5 rounded-full border border-slate-200 text-[10px] font-bold text-slate-500 flex items-center gap-2 z-10">
        <Box className="w-3 h-3 text-emerald-500" /> {mode} 投影视图
      </div>
      <canvas 
        ref={canvasRef} 
        width={600} 
        height={450} 
        className={`rounded-xl bg-transparent cursor-grab ${isDragging ? 'cursor-grabbing' : ''}`}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
        onMouseUp={onMouseUp}
        onMouseLeave={onMouseUp}
        onWheel={onWheel}
      />
      <div className="mt-4 flex gap-6 text-[10px] font-bold text-slate-400">
         <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-blue-400" /> 低洼处</span>
         <span className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-red-400" /> 高峰处</span>
         <span className="ml-4 italic">提示：拖拽旋转视角，滚轮缩放</span>
      </div>
    </div>
  );
};

export default PlotView3D;
