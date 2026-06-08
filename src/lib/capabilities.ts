import { ModelCapability, InputType, OutputType } from '../types';

export function guessModelCapabilities(modelId: string, provider: string): ModelCapability {
  const idLower = modelId.toLowerCase();
  const name = modelId.split('/').pop() || modelId;

  // Defaults
  let family = 'Unknown Family';
  let size = 'Unknown Size';
  let contextWindow = 8192;
  let supportsVision = false;
  let supportsTools = false;
  let supportsFunctionCalling = false;
  let supportsReasoning = false;
  let supportsEmbeddings = false;
  let supportsImageGeneration = false;
  let supportsStructuredOutput = false;
  let quantization = undefined;

  // Family deduction
  if (idLower.includes('gpt-4')) family = 'GPT-4';
  else if (idLower.includes('gpt-3.5')) family = 'GPT-3.5';
  else if (idLower.includes('claude-3-5')) family = 'Claude 3.5';
  else if (idLower.includes('claude-3')) family = 'Claude 3';
  else if (idLower.includes('gemini')) family = 'Gemini';
  else if (idLower.includes('llama-3') || idLower.includes('llama3')) family = 'Llama 3';
  else if (idLower.includes('qwen')) family = 'Qwen';
  else if (idLower.includes('deepseek')) family = 'DeepSeek';
  else if (idLower.includes('mistral')) family = 'Mistral';
  else if (idLower.includes('mixtral')) family = 'Mixtral';
  else if (idLower.includes('gemma')) family = 'Gemma';
  else if (idLower.includes('phi')) family = 'Phi';

  // Size deduction
  const sizeMatch = idLower.match(/(\d+(?:\.\d+)?[bmx]+)/);
  if (sizeMatch) {
    size = sizeMatch[1].toUpperCase();
  }

  // Quantization deduction
  const quantMatch = idLower.match(/q\d_[k_m]+/);
  if (quantMatch) {
    quantization = quantMatch[0].toUpperCase();
  } else if (idLower.includes('awq')) {
    quantization = 'AWQ';
  } else if (idLower.includes('gptq')) {
    quantization = 'GPTQ';
  }

  // Vision
  if (
    idLower.includes('vision') ||
    idLower.includes('llava') ||
    idLower.includes('gpt-4o') ||
    idLower.includes('gpt-4-turbo') ||
    idLower.includes('claude-3') ||
    idLower.includes('gemini-1.5')
  ) {
    supportsVision = true;
  }

  // Tools & Function calling
  if (
    family === 'GPT-4' ||
    family === 'Claude 3.5' ||
    family === 'Claude 3' ||
    family === 'Gemini' ||
    family === 'Mistral' ||
    idLower.includes('qwen2') ||
    idLower.includes('llama-3.1') ||
    idLower.includes('llama-3.3')
  ) {
    supportsFunctionCalling = true;
    supportsTools = true;
    supportsStructuredOutput = true;
  }

  // Context window deduction
  if (idLower.includes('128k') || family === 'GPT-4' || family.includes('Claude 3.1') || idLower.includes('llama-3.1')) {
    contextWindow = 128000;
  } else if (family === 'Claude 3.5' || family === 'Claude 3') {
    contextWindow = 200000;
  } else if (family === 'Gemini') {
    contextWindow = 1000000;
  } else if (idLower.includes('32k')) {
    contextWindow = 32768;
  } else if (family === 'Llama 3' && !idLower.includes('3.1')) {
    contextWindow = 8192;
  }

  // Reasoning
  if (idLower.includes('reasoner') || idLower.includes('deepseek-r1') || idLower.includes('r1') || idLower.includes('o1') || idLower.includes('o3')) {
    supportsReasoning = true;
  }
  
  if (idLower.includes('embed')) {
    supportsEmbeddings = true;
  }

  const inputTypes = [InputType.TEXT, InputType.CODE];
  if (supportsVision) inputTypes.push(InputType.IMAGE);

  const outputTypes = [OutputType.TEXT, OutputType.CODE, OutputType.MARKDOWN];
  if (supportsStructuredOutput) outputTypes.push(OutputType.JSON);

  return {
    id: modelId,
    name: name,
    provider: provider,
    family,
    size,
    quantization,
    contextWindow,
    supportsVision,
    supportsTools,
    supportsFunctionCalling,
    supportsReasoning,
    supportsEmbeddings,
    supportsStreaming: true, // we assume most text models stream
    supportsImageGeneration,
    supportsAudioInput: false,
    supportsAudioOutput: false,
    supportsVideoInput: false,
    supportsStructuredOutput,
    inputTypes,
    outputTypes
  };
}
