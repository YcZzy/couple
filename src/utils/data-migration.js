/**
 * 数据迁移工具 - 处理uTools和浏览器环境之间的数据迁移
 */
import servicesAdapter from './services-adapter';

// 数据存储键名列表
const DATA_KEYS = [
  'mood-records',           // 心情记录
  'mood-categories',        // 心情分类
  'rewards',                // 奖励列表
  'rewardRecords',          // 奖励记录
  'anniversaries',          // 纪念日
  'tasks',                  // 共同任务
  'memos',                  // 备忘录
  'user-profile',           // 用户资料
  'app-settings'            // 应用设置
];

/**
 * 导出所有应用数据为JSON文件
 * @returns {Promise<boolean>} 导出是否成功
 */
export async function exportAllData() {
  try {
    // 收集所有数据
    const allData = {};
    
    for (const key of DATA_KEYS) {
      const data = servicesAdapter.loadData(key);
      if (data) {
        allData[key] = data;
      }
    }
    
    // 添加导出元数据
    allData._metadata = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      dataKeys: Object.keys(allData).filter(k => k !== '_metadata')
    };
    
    // 导出为JSON文件
    const jsonData = JSON.stringify(allData, null, 2);
    const success = servicesAdapter.writeFile(
      `couple-app-data-${new Date().toISOString().split('T')[0]}.json`, 
      jsonData, 
      'application/json'
    );
    
    return success;
  } catch (error) {
    console.error('导出数据失败:', error);
    return false;
  }
}

/**
 * 导入应用数据
 * @param {Object|null} jsonData - 已解析的JSON数据，如果为null则会请求选择文件
 * @returns {Promise<{success: boolean, message: string, importedKeys: string[]}>} 导入结果
 */
export async function importData(jsonData = null) {
  try {
    let dataToImport = jsonData;
    
    // 如果未提供数据，则请求用户选择文件
    if (!dataToImport) {
      const fileData = await servicesAdapter.readFile('application/json');
      if (!fileData || !fileData.content) {
        return { 
          success: false, 
          message: '未选择任何文件或文件读取失败', 
          importedKeys: [] 
        };
      }
      
      try {
        dataToImport = JSON.parse(fileData.content);
      } catch (parseError) {
        return { 
          success: false, 
          message: '文件不是有效的JSON格式', 
          importedKeys: [] 
        };
      }
    }
    
    // 验证导入的数据
    if (!dataToImport || typeof dataToImport !== 'object') {
      return { 
        success: false, 
        message: '导入的数据格式无效', 
        importedKeys: [] 
      };
    }
    
    const importedKeys = [];
    
    // 导入数据
    for (const key of DATA_KEYS) {
      if (dataToImport[key]) {
        servicesAdapter.saveData(key, dataToImport[key]);
        importedKeys.push(key);
      }
    }
    
    if (importedKeys.length === 0) {
      return { 
        success: false, 
        message: '导入的数据中不包含任何有效的应用数据', 
        importedKeys: [] 
      };
    }
    
    return { 
      success: true, 
      message: `成功导入 ${importedKeys.length} 组数据`, 
      importedKeys 
    };
  } catch (error) {
    console.error('导入数据失败:', error);
    return { 
      success: false, 
      message: `导入数据时发生错误: ${error.message || '未知错误'}`, 
      importedKeys: [] 
    };
  }
}

/**
 * 检查是否有现有数据
 * @returns {boolean} 是否存在数据
 */
export function hasExistingData() {
  for (const key of DATA_KEYS) {
    const data = servicesAdapter.loadData(key);
    if (data && (Array.isArray(data) ? data.length > 0 : Object.keys(data).length > 0)) {
      return true;
    }
  }
  return false;
}

/**
 * 清除所有应用数据
 * @param {boolean} confirmationRequired - 是否需要用户确认
 * @returns {boolean} 是否成功清除
 */
export function clearAllData(confirmationRequired = true) {
  if (confirmationRequired) {
    const confirmed = confirm(
      '警告：此操作将清除所有应用数据，且无法恢复。确定要继续吗？'
    );
    if (!confirmed) {
      return false;
    }
  }
  
  try {
    for (const key of DATA_KEYS) {
      servicesAdapter.saveData(key, null);
    }
    return true;
  } catch (error) {
    console.error('清除数据失败:', error);
    return false;
  }
} 