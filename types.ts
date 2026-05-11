export enum ToolType {
  SCIENTIFIC = 'SCIENTIFIC',
  COMPLEX = 'COMPLEX',
  CALCULUS = 'CALCULUS',
  MATRIX = 'MATRIX',
  PLOTTING = 'PLOTTING',
  TRANSFORMS = 'TRANSFORMS',
  EQUATION = 'EQUATION',
  PHYSICS_REF = 'PHYSICS_REF'
}

export enum ModelType {
  GEMINI = 'GEMINI',
  DEEPSEEK = 'DEEPSEEK',
  QWEN = 'QWEN'
}

export interface ApiKeys {
  deepseek?: string;
  qwen?: string;
  gemini?: string;
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
  method?: 'ai' | 'local';
}
