/**
 * 服务适配器 - 处理uTools环境和浏览器环境的兼容性
 * 为应用程序提供统一的接口，无论是在uTools插件中还是在浏览器中运行
 */

import { DEEPSEEK_CONFIG, isUToolsEnv } from './config';

// 检测是否在uTools环境中运行
const isUTools = isUToolsEnv;

// uTools环境下的服务实现
const uToolsServices = {
  // 数据持久化
  saveData: (key, data) => {
    try {
      if (typeof window.services !== 'undefined' && typeof window.services.saveData === 'function') {
        return window.services.saveData(key, data);
      }
      console.warn('uTools services.saveData not available');
      return false;
    } catch (error) {
      console.error('保存数据失败:', error);
      return false;
    }
  },
  
  loadData: (key) => {
    try {
      if (typeof window.services !== 'undefined' && typeof window.services.loadData === 'function') {
        return window.services.loadData(key);
      }
      console.warn('uTools services.loadData not available');
      return null;
    } catch (error) {
      console.error('加载数据失败:', error);
      return null;
    }
  },
  
  // 文件操作
  readFile: (filePath) => {
    try {
      if (typeof window.services !== 'undefined' && typeof window.services.readFile === 'function') {
        return window.services.readFile(filePath);
      }
      return null;
    } catch (error) {
      console.error('读取文件失败:', error);
      return null;
    }
  },
  
  writeFile: (filePath, content) => {
    try {
      if (typeof window.services !== 'undefined' && typeof window.services.writeFile === 'function') {
        return window.services.writeFile(filePath, content);
      }
      return false;
    } catch (error) {
      console.error('写入文件失败:', error);
      return false;
    }
  },
  
  // AI功能
  hasAISupport: () => {
    return isUTools && typeof window.utools.ai !== 'undefined';
  },
  
  analyzeWithAI: async (prompt, data) => {
    if (isUTools && typeof window.utools.ai !== 'undefined' && typeof window.utools.ai.chat === 'function') {
      try {
        return await window.utools.ai.chat({
          modelName: 'gpt-4',
          messages: [
            { role: 'system', content: 'You are an AI assistant helping with relationship analysis.' },
            { role: 'user', content: prompt + '\n' + JSON.stringify(data) }
          ]
        });
      } catch (error) {
        console.error('AI分析失败:', error);
        return { error: '无法完成AI分析' };
      }
    }
    return { error: '当前环境不支持AI功能' };
  },
  
  // 系统功能
  getPath: (type) => {
    if (isUTools && typeof window.utools.getPath === 'function') {
      return window.utools.getPath(type);
    }
    return null;
  }
};

// 浏览器环境下的服务实现
const browserServices = {
  // 数据持久化 - 使用localStorage
  saveData: (key, data) => {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('保存数据失败:', error);
      return false;
    }
  },
  
  loadData: (key) => {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('加载数据失败:', error);
      return null;
    }
  },
  
  // 文件操作 - 浏览器环境使用File API模拟
  readFile: async (acceptTypes = 'text/*') => {
    return new Promise((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = acceptTypes;
      
      input.onchange = (event) => {
        const file = event.target.files[0];
        if (!file) {
          resolve(null);
          return;
        }
        
        const reader = new FileReader();
        reader.onload = (e) => {
          resolve({
            name: file.name,
            content: e.target.result,
            path: file.name, // 浏览器环境中没有真实的文件路径
            type: file.type
          });
        };
        
        if (file.type.startsWith('text') || file.type === 'application/json') {
          reader.readAsText(file);
        } else {
          reader.readAsDataURL(file);
        }
      };
      
      input.click();
    });
  },
  
  writeFile: (fileName, content, mimeType = 'text/plain') => {
    try {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.style.display = 'none';
      
      document.body.appendChild(a);
      a.click();
      
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
      
      return true;
    } catch (error) {
      console.error('写入文件失败:', error);
      return false;
    }
  },
  
  // AI功能 - 使用DeepSeek API提供AI支持
  hasAISupport: () => true,
  
  analyzeWithAI: async (prompt, data) => {
    try {
      const response = await fetch(`${DEEPSEEK_CONFIG.baseUrl}/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_CONFIG.apiKey}`
        },
        body: JSON.stringify({
          model: DEEPSEEK_CONFIG.model,
          messages: [
            { role: 'system', content: '你是一位專業的關係心理學家，擅長分析伴侶間的情緒並提供有建設性的建議。' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7
        })
      });
      
      if (!response.ok) {
        throw new Error(`DeepSeek API請求失敗: ${response.status} ${response.statusText}`);
      }
      
      const result = await response.json();
      return result.choices[0].message.content;
    } catch (error) {
      console.error('DeepSeek AI分析失敗:', error);
      return { error: '無法完成AI分析: ' + error.message };
    }
  },
  
  // 系统功能
  getPath: (type) => {
    // 浏览器环境中模拟路径
    switch (type) {
      case 'home':
        return '/home/user';
      case 'appData':
        return '/appdata';
      case 'userData':
        return '/userdata';
      case 'temp':
        return '/temp';
      case 'downloads':
        return '/downloads';
      case 'desktop':
        return '/desktop';
      default:
        return '/';
    }
  }
};

// 统一的服务接口
const servicesAdapter = isUTools ? uToolsServices : browserServices;

// 在控制台中显示当前环境
console.log(`应用当前运行在${isUTools ? 'uTools' : '浏览器(H5)'}环境中`);

// 如果存在window.services，合并其中的方法
if (isUTools && typeof window.services !== 'undefined') {
  Object.keys(window.services).forEach(key => {
    if (typeof window.services[key] === 'function' && !servicesAdapter[key]) {
      servicesAdapter[key] = window.services[key];
    }
  });
}

export default servicesAdapter; 
