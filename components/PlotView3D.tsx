
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
    if (mode === '3D 曲面图') {
      points = generatePlotData2D(threeDExpr, range, range, res);
    } else if (mode === '参数方程(3D)') {
      points = generateParametricData3D(parametric3DExprs[0], parametric3DExprs[1], parametric3DExprs[2], tRange, res);
    } else if (mode === '球坐标(3D)') {
      points = generateSphericalData(sphericalExpr, thetaRange, phiRange, res);
    }

    ctx.clearRect(0, 0, w, h);

    const project = (x: number, y: number, z: number) => {
      let nx = (x - range[0]) / (range[1] - range[0]) * 2 - 1;
      let ny = (y - range[0]) / (range[1] - range[0]) * 2 - 1;
      let nz = isNaN(z) || !isFinite(z) ? 0 : z / 5;

      if (mode === '参数方程(3D)' || mode === '球坐标(3D)') {
        nx = x / 10;
        ny = y / 10;
        nz = z / 10;
      }

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

    drawAxis(10, 0, 0, '#ef4444', 'X');
    drawAxis(0, 10, 0, '#10b981', 'Y');
    drawAxis(0, 0, 10, '#3b82f6', 'Z');

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

          const avgZDepth = (p1.proj.zDepth + p2.proj.zDepth + p3.proj.zDepth + p4.proj.zDepth) / 4;
          const avgZValue = (p1.z + p2.z + p3.z + p4.z) / 4;
          
          polygons.push({
            nodes: [p1.proj, p2.proj, p3.proj, p4.proj],
            zDepth: avgZDepth,
            zValue: avgZValue
          });
        }
      }

      polygons.sort((a, b) => b.zDepth - a.zDepth);

      polygons.forEach(poly => {
        ctx.beginPath();
        poly.nodes.forEach((node, i) => {
          if (i === 0) ctx.moveTo(node.px, node.py);
          else ctx.lineTo(node.px, node.py);
        });
        ctx.closePath();

        const hue = 200 - (poly.zValue + 5) * 20; 
        const lightness = Math.max(30, Math.min(80, 50 + poly.zDepth * 10));
        
        ctx.fillStyle = `hsla(${hue}, 70%, ${lightness}%, 0.85)`;
        ctx.fill();
        ctx.strokeStyle = `hsla(${hue}, 70%, 40%, 0.3)`;
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
