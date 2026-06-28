import OpenAI from "openai";
import { getSettingsByCategory, getOpenAIStatus, ServiceStatus } from "./settings";

let openaiClient: OpenAI | null = null;
let currentApiKey: string | null = null;

export interface OpenAIConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  requestsPerMinute: number;
}

export interface AnalysisResult {
  success: boolean;
  content?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  error?: string;
  stubMode?: boolean;
  stubReason?: string;
}

export interface RiskAnalysis {
  riskLevel: "low" | "medium" | "high" | "critical";
  score: number;
  factors: string[];
  recommendations: string[];
  summary: string;
}

async function getOpenAIConfig(): Promise<OpenAIConfig | null> {
  const settings = await getSettingsByCategory("openai");
  
  const apiKey = settings["openai.apiKey"];
  if (!apiKey) {
    return null;
  }

  return {
    apiKey,
    model: settings["openai.model"] || "gpt-4",
    maxTokens: parseInt(settings["openai.maxTokens"] || "4096", 10),
    requestsPerMinute: parseInt(settings["openai.requestsPerMinute"] || "60", 10),
  };
}

async function getClient(): Promise<OpenAI | null> {
  const config = await getOpenAIConfig();

  if (!config) {
    openaiClient = null;
    currentApiKey = null;
    return null;
  }

  // Check if API key changed and we need a new client
  if (openaiClient && currentApiKey === config.apiKey) {
    return openaiClient;
  }

  openaiClient = new OpenAI({
    apiKey: config.apiKey,
  });
  currentApiKey = config.apiKey;
  return openaiClient;
}

export async function isOpenAIEnabled(): Promise<boolean> {
  const status = await getOpenAIStatus();
  return status.enabled;
}

export async function getStatus(): Promise<ServiceStatus> {
  return getOpenAIStatus();
}

function generateDeterministicStubResponse(prompt: string): RiskAnalysis {
  const promptLength = prompt.length;
  const wordCount = prompt.split(/\s+/).length;
  
  // Generate deterministic values based on input
  const hash = promptLength * 31 + wordCount * 17;
  const riskScore = ((hash % 100) + 1) / 100;
  
  let riskLevel: RiskAnalysis["riskLevel"];
  if (riskScore < 0.25) {
    riskLevel = "low";
  } else if (riskScore < 0.5) {
    riskLevel = "medium";
  } else if (riskScore < 0.75) {
    riskLevel = "high";
  } else {
    riskLevel = "critical";
  }

  return {
    riskLevel,
    score: Math.round(riskScore * 100) / 100,
    factors: [
      "Stub mode analysis - deterministic based on input characteristics",
      `Input length: ${promptLength} characters`,
      `Word count: ${wordCount} words`,
    ],
    recommendations: [
      "Configure OpenAI API key for real AI-powered analysis",
      "Review input data manually for accurate risk assessment",
      "Consider enabling AI analysis for production use",
    ],
    summary: `Stub mode analysis complete. Risk level: ${riskLevel} (score: ${riskScore.toFixed(2)}). Configure OpenAI for real AI analysis.`,
  };
}

export async function analyzeText(
  prompt: string,
  systemPrompt?: string
): Promise<AnalysisResult> {
  const client = await getClient();
  const config = await getOpenAIConfig();

  if (!client || !config) {
    // Return deterministic stub response
    const stubAnalysis = generateDeterministicStubResponse(prompt);
    return {
      success: true,
      content: JSON.stringify(stubAnalysis, null, 2),
      stubMode: true,
      stubReason: "OpenAI not configured - using deterministic stub mode",
    };
  }

  try {
    const messages: OpenAI.ChatCompletionMessageParam[] = [];
    
    if (systemPrompt) {
      messages.push({ role: "system", content: systemPrompt });
    }
    
    messages.push({ role: "user", content: prompt });

    const response = await client.chat.completions.create({
      model: config.model,
      messages,
      max_tokens: config.maxTokens,
    });

    const content = response.choices[0]?.message?.content || "";
    
    return {
      success: true,
      content,
      usage: response.usage
        ? {
            promptTokens: response.usage.prompt_tokens,
            completionTokens: response.usage.completion_tokens,
            totalTokens: response.usage.total_tokens,
          }
        : undefined,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return {
      success: false,
      error: `OpenAI API error: ${message}`,
    };
  }
}

export async function analyzeRisk(data: string): Promise<RiskAnalysis> {
  const client = await getClient();
  const config = await getOpenAIConfig();

  if (!client || !config) {
    // Return deterministic stub response
    return generateDeterministicStubResponse(data);
  }

  try {
    const systemPrompt = `You are a risk analysis AI. Analyze the provided data and return a JSON object with the following structure:
{
  "riskLevel": "low" | "medium" | "high" | "critical",
  "score": number between 0 and 1,
  "factors": string[] - list of risk factors identified,
  "recommendations": string[] - list of recommendations,
  "summary": string - brief summary of the analysis
}
Return only valid JSON, no additional text.`;

    const response = await client.chat.completions.create({
      model: config.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: data },
      ],
      max_tokens: config.maxTokens,
      response_format: { type: "json_object" },
    });

    const content = response.choices[0]?.message?.content || "{}";
    const analysis = JSON.parse(content) as RiskAnalysis;
    
    return analysis;
  } catch (error) {
    // Fall back to stub mode on error
    console.error("OpenAI analysis failed, falling back to stub mode:", error);
    return generateDeterministicStubResponse(data);
  }
}

export async function testConnection(): Promise<{ success: boolean; error?: string; model?: string }> {
  const client = await getClient();
  const config = await getOpenAIConfig();

  if (!client || !config) {
    return { success: false, error: "OpenAI not configured" };
  }

  try {
    // Make a minimal API call to verify the key works
    const response = await client.chat.completions.create({
      model: config.model,
      messages: [{ role: "user", content: "Hello" }],
      max_tokens: 5,
    });

    return {
      success: true,
      model: response.model,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return { success: false, error: message };
  }
}
