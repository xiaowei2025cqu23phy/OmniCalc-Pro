
import { MathResult, ModelType, ApiKeys } from "../types";
import { GoogleGenAI } from "@google/genai";

/**
 * 多模型数学求解服务
 * 支持 Gemini, DeepSeek, Qwen
 */
export const solveAdvancedMath = async (
  query: string, 
  category: string, 
  model: ModelType = ModelType.GEMINI,
  userKeys?: ApiKeys
): Promise<MathResult> => {
  const systemPrompt = `You are a world-class mathematician and symbolic computation engine. 
  Your task is to solve ${category} problems with extreme precision.
  Always return the response in a structured JSON format with the following keys:
  - value: The final mathematical answer (as a string).
  - explanation: A brief high-level explanation of the theorem or method used.
  - steps: An array of strings representing the logical derivation steps.
  - latex: The result formatted in LaTeX for high-quality rendering.
  
  For ODEs or complex transforms, ensure the solution is general unless initial conditions are specified.`;

  const handleError = (e: any, modelName: string): MathResult => {
    console.error(`${modelName} Solver Error:`, e);
    
    let userMessage = "计算引擎响应异常";
    let detail = e.message || "未知错误";
    let suggestions = ["检查网络连接", "确认 API 密钥是否有效", "尝试简化表达式"];

    if (e.message?.includes("401") || e.message?.includes("unauthorized") || e.message?.includes("API key not valid")) {
      userMessage = "身份验证失败";
      detail = "提供的 API 密钥无效或已过期。";
      suggestions = ["进入设置检查 API 密钥", "确保密钥具有访问权限", "如果是本地密钥，请重新输入"];
    } else if (e.message?.includes("429") || e.message?.includes("quota") || e.message?.includes("Too Many Requests")) {
      userMessage = "请求频率受限";
      detail = "已达到 API 调用配额限制。";
      suggestions = ["稍后再试", "检查 API 账户余额", "考虑更换其他模型引擎"];
    } else if (e.message?.includes("fetch") || e.message?.includes("NetworkError") || e.message?.includes("Failed to fetch")) {
      userMessage = "网络连接失败";
      detail = "无法连接到 AI 推理服务器，请检查您的互联网连接。";
      suggestions = ["检查网络状态", "如果是国内用户，可能需要配置代理访问部分引擎", "刷新页面重试"];
    } else if (e instanceof SyntaxError) {
      userMessage = "解析响应失败";
      detail = "AI 返回了非标准格式的数据。";
      suggestions = ["尝试重新提交", "检查输入表达式是否有歧义"];
    }

    return { 
      value: "计算异常", 
      explanation: `${userMessage}: ${detail}`,
      steps: suggestions,
      method: 'ai'
    };
  };

  try {
    if (model === ModelType.GEMINI) {
      const apiKey = userKeys?.gemini || process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("401: 未检测到 Gemini API 密钥");
      
      const ai = new GoogleGenAI({ apiKey });
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: query,
        config: {
          systemInstruction: systemPrompt,
          responseMimeType: "application/json",
          temperature: 0.3
        }
      });
      
      if (!response.text) throw new Error("AI 返回了空响应");
      try {
        return JSON.parse(response.text) as MathResult;
      } catch (e) {
        // AI 偶尔返回带 markdown 包裹的 JSON，尝试提取
        const match = response.text.match(/\{[\s\S]*\}/);
        if (match) return JSON.parse(match[0]) as MathResult;
        throw new SyntaxError("AI 返回了非标准格式的数据");
      }
    } else if (model === ModelType.DEEPSEEK) {
      const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";
      const apiKey = userKeys?.deepseek || process.env.DEEPSEEK_API_KEY;
      if (!apiKey) throw new Error("401: 未检测到 DeepSeek API 密钥");

      const response = await fetch(DEEPSEEK_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "deepseek-chat",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: query }
          ],
          response_format: { type: "json_object" },
          temperature: 0.3
        })
      });
      
      if (response.status === 401) throw new Error("401: DeepSeek 密钥无效");
      if (response.status === 429) throw new Error("429: DeepSeek 配额不足");
      if (!response.ok) {
        const errBody = await response.text().catch(() => "");
        throw new Error(`DeepSeek API 请求失败 (HTTP ${response.status}): ${errBody.slice(0, 200)}`);
      }
      
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "";
      try {
        return JSON.parse(content) as MathResult;
      } catch (e) {
        const match = content.match(/\{[\s\S]*\}/);
        if (match) return JSON.parse(match[0]) as MathResult;
        throw new SyntaxError("DeepSeek 返回了非标准格式的数据");
      }
    } else if (model === ModelType.QWEN) {
      const QWEN_API_URL = "https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions";
      const apiKey = userKeys?.qwen || process.env.QWEN_API_KEY;
      if (!apiKey) throw new Error("401: 未检测到通义千问 API 密钥");

      const response = await fetch(QWEN_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: "qwen-max",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: query }
          ],
          temperature: 0.3
        })
      });
      
      if (response.status === 401) throw new Error("401: Qwen 密钥无效");
      if (response.status === 429) throw new Error("429: Qwen 配额不足");
      if (!response.ok) {
        const errBody = await response.text().catch(() => "");
        throw new Error(`Qwen API 请求失败 (HTTP ${response.status}): ${errBody.slice(0, 200)}`);
      }
      
      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || "";
      try {
        return JSON.parse(content) as MathResult;
      } catch (e) {
        const match = content.match(/\{[\s\S]*\}/);
        if (match) return JSON.parse(match[0]) as MathResult;
        throw new SyntaxError("Qwen 返回了非标准格式的数据");
      }
    }
    throw new Error("不支持的模型类型");
  } catch (e: any) {
    return handleError(e, model);
  }
};
