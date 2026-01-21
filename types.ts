
export enum ToolType {
  COMPLEX = 'COMPLEX',
  CALCULUS = 'CALCULUS',
  MATRIX = 'MATRIX',
  PLOTTING = 'PLOTTING',
  TRANSFORMS = 'TRANSFORMS',
  PHYSICS_REF = 'PHYSICS_REF'
}

export interface MatrixData {
  rows: number;
  cols: number;
  data: number[][];
}

export interface PlotConfig {
  expression: string;
  type: '1D' | '2D';
  rangeX: [number, number];
  rangeY?: [number, number];
}

export interface MathResult {
  value: any;
  explanation?: string;
  steps?: string[];
  latex?: string;
}
