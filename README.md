## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

# OmniCalc Pro - 高级数学与物理符号运算引擎

OmniCalc Pro 是一款专为工程师、物理学者和数学爱好者打造的全功能科学计算工作台。它集成了本地高性能符号运算引擎与 Google Gemini 3 Pro 顶级 AI 推理能力，支持从基础复数运算到复杂偏微分方程 (PDE) 的辅助分析。

## 🌟 核心特性

- **🔢 复数运算引擎**: 支持直角坐标与极坐标转化，实时生成阿甘得图 (Argand Diagram) 可视化。
- **📐 高级函数绘图**: 
  - **1D/2D 绘图**: 笛卡尔坐标、参数方程、极坐标。
  - **3D 曲面投影**: 支持双变量函数 $z = f(x, y)$ 的交互式 3D 可视化，支持视角旋转。
- **🔬 物理速查手册**: 
  - **矢量分析**: 梯度、散度、旋度及拉普拉斯算子的公式与物理意义速查。
  - **特殊函数**: 勒让德 (Legendre)、贝塞尔 (Bessel)、埃尔米特 (Hermite) 多项式背景与递推式。
  - **积分简表**: 高斯积分、指数衰减等常见物理积分汇总。
- **🧠 智能微积分求解**: 结合本地 MathJS 引擎与云端 Gemini AI，提供带步骤推导的导数、积分及 ODE 解答。
- **⚡ 积分变换**: 支持拉普拉斯变换 (Laplace) 与傅里叶变换 (Fourier) 的符号化推导。

## 🛠️ 技术栈

- **Frontend**: React 19 + TypeScript
- **Styling**: Tailwind CSS
- **Math Core**: [MathJS](https://mathjs.org/) (本地符号运算)
- **AI Core**: [Google Gemini API](https://ai.google.dev/) (高级逻辑推理)
- **Charts**: Recharts & HTML5 Canvas (3D 投影)
- **Icons**: Lucide React

## 🚀 快速开始

### 环境要求
- 现代浏览器 (Chrome, Edge, Safari)
- 需要配置 `API_KEY` 以启用 AI 功能

### 本地运行
由于本项目采用了 ESM 模块化设计，你可以直接通过静态服务器运行：

1. 克隆仓库:
   ```bash
   git clone https://github.com/xiaowei2025cqu23phy/OmniCalc-Pro.git
   ```
2. 使用 VS Code 的 **Live Server** 插件打开 `index.html`。
3. 或者使用简单的 Python 服务器:
   ```bash
   python -m http.server 8000
   ```

## 📝 环境变量说明

为了启用 AI 辅助计算功能，你需要从 [Google AI Studio](https://aistudio.google.com/) 获取 API Key，并将其注入到运行环境中。

## 🤝 贡献指南

欢迎提交 Issue 或 Pull Request 来改进算法或添加更多的物理公式。
1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启一个 Pull Request

## 📄 开源协议

本项目采用 [MIT License](LICENSE) 开源。

---
*数学是科学的皇后，而 OmniCalc Pro 是你手中的利剑。*
