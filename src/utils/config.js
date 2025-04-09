/**
 * 應用配置文件
 * 包含環境變量和API設置
 */

// DeepSeek AI API配置
export const DEEPSEEK_CONFIG = {
  baseUrl: 'https://api.deepseek.com',
  // apiKey: process.env.VUE_APP_DEEPSEEK_API_KEY || 'YOUR_DEEPSEEK_API_KEY', // 在實際部署時替換為真實API密鑰
  apiKey: 'sk-101f34ddf2d34e1089649d028920e25e',
  model: 'deepseek-chat' // 使用最新的DeepSeek-V3模型
};

// 環境檢測
export const isUToolsEnv = typeof window.utools !== 'undefined';
export const isH5Env = !isUToolsEnv;

// 版本信息
export const APP_VERSION = '1.1.0';

// 其他配置
export const DEFAULT_SETTINGS = {
  enableAI: true,
  darkMode: false,
  language: 'zh-TW',
  backupFrequency: 'weekly'
};

export default {
  DEEPSEEK_CONFIG,
  isUToolsEnv,
  isH5Env,
  APP_VERSION,
  DEFAULT_SETTINGS
}; 
