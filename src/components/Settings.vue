<template>
  <div class="page-container space-y-8">
    <!-- 顶部区域 -->
    <div class="page-header-blue">
      <div class="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h1 class="page-title-blue">
            <span class="text-3xl mr-3">⚙️</span>
            应用设置
          </h1>
          <p class="text-gray-600 mt-1">管理您的应用数据和设置</p>
        </div>
      </div>
    </div>
    
    <!-- 环境信息卡片 -->
    <div class="card p-6">
      <div class="flex items-center mb-4">
        <span class="text-2xl mr-3">🌐</span>
        <h2 class="text-xl font-semibold text-gray-800">当前运行环境</h2>
      </div>
      
      <div class="p-4 bg-blue-50 rounded-lg mb-4">
        <p class="text-blue-800">
          <span class="font-medium">运行平台：</span>
          {{ isUTools ? 'uTools 插件' : '网页浏览器' }}
        </p>
      </div>
      
      <p class="text-gray-600 mb-4">
        此应用可以在 uTools 或浏览器环境中运行，两种环境中的数据默认相互独立。
        可以使用以下选项导出或导入数据，实现数据迁移。
      </p>
    </div>
    
    <!-- 数据管理卡片 -->
    <div class="card p-6">
      <div class="flex items-center mb-4">
        <span class="text-2xl mr-3">💾</span>
        <h2 class="text-xl font-semibold text-gray-800">数据管理</h2>
      </div>
      
      <div class="space-y-6">
        <!-- 数据导出 -->
        <div>
          <h3 class="font-medium text-lg text-gray-700 mb-2">导出数据</h3>
          <p class="text-gray-600 mb-3">
            将您的所有应用数据导出为JSON文件，可用于备份或迁移到其他环境
          </p>
          <button 
            @click="handleExportData" 
            class="btn btn-primary"
            :disabled="exportInProgress"
          >
            {{ exportInProgress ? '导出中...' : '导出所有数据' }}
          </button>
          <p v-if="exportResult" class="mt-2" :class="exportResult.success ? 'text-green-600' : 'text-red-600'">
            {{ exportResult.message }}
          </p>
        </div>
        
        <!-- 数据导入 -->
        <div class="pt-4 border-t border-gray-100">
          <h3 class="font-medium text-lg text-gray-700 mb-2">导入数据</h3>
          <p class="text-gray-600 mb-3">
            从之前导出的JSON文件导入数据，将覆盖当前环境中的相应数据
          </p>
          <button 
            @click="handleImportData" 
            class="btn btn-outline"
            :disabled="importInProgress"
          >
            {{ importInProgress ? '导入中...' : '导入数据' }}
          </button>
          <p v-if="importResult" class="mt-2" :class="importResult.success ? 'text-green-600' : 'text-red-600'">
            {{ importResult.message }}
          </p>
          <div v-if="importResult && importResult.success && importResult.importedKeys.length > 0" class="mt-3">
            <p class="text-gray-700 font-medium">导入的数据类型：</p>
            <ul class="list-disc list-inside text-gray-600 mt-1">
              <li v-for="key in importResult.importedKeys" :key="key">{{ getDataKeyName(key) }}</li>
            </ul>
          </div>
        </div>
        
        <!-- 数据清除 -->
        <div class="pt-4 border-t border-gray-100">
          <h3 class="font-medium text-lg text-rose-700 mb-2">清除所有数据</h3>
          <p class="text-gray-600 mb-3">
            删除当前环境中的所有应用数据。此操作无法撤销，请谨慎操作！
          </p>
          <button 
            @click="handleClearData" 
            class="px-4 py-2 bg-rose-100 text-rose-700 rounded-lg hover:bg-rose-200 transition-colors"
          >
            清除所有数据
          </button>
          <p v-if="clearResult" class="mt-2" :class="clearResult.success ? 'text-green-600' : 'text-gray-600'">
            {{ clearResult.message }}
          </p>
        </div>
      </div>
    </div>
    
    <!-- 关于信息 -->
    <div class="card p-6">
      <div class="flex items-center mb-4">
        <span class="text-2xl mr-3">ℹ️</span>
        <h2 class="text-xl font-semibold text-gray-800">关于应用</h2>
      </div>
      
      <div class="space-y-2 text-gray-600">
        <p><span class="font-medium">应用名称：</span>Couple</p>
        <p><span class="font-medium">版本：</span>1.0.0</p>
        <p><span class="font-medium">开发者：</span>Your Name</p>
        <p class="pt-3">Couple 是一款专为情侣设计的共同生活管理工具，帮助您记录生活中的美好时刻、心情变化、共同成长，维系亲密关系。</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { exportAllData, importData, clearAllData } from '../utils/data-migration';
import servicesAdapter from '../utils/services-adapter';

// 环境检测
const isUTools = computed(() => typeof window.utools !== 'undefined');

// 导出状态
const exportInProgress = ref(false);
const exportResult = ref(null);

// 导入状态
const importInProgress = ref(false);
const importResult = ref(null);

// 清除状态
const clearResult = ref(null);

// 处理数据导出
async function handleExportData() {
  exportInProgress.value = true;
  exportResult.value = null;
  
  try {
    const success = await exportAllData();
    exportResult.value = {
      success,
      message: success 
        ? '数据导出成功！文件已保存。' 
        : '数据导出失败，请重试。'
    };
  } catch (error) {
    exportResult.value = {
      success: false,
      message: `导出出错: ${error.message || '未知错误'}`
    };
  } finally {
    exportInProgress.value = false;
  }
}

// 处理数据导入
async function handleImportData() {
  importInProgress.value = true;
  importResult.value = null;
  
  try {
    const result = await importData();
    importResult.value = result;
    
    // 如果导入成功，刷新页面以加载新数据
    if (result.success) {
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    }
  } catch (error) {
    importResult.value = {
      success: false,
      message: `导入出错: ${error.message || '未知错误'}`,
      importedKeys: []
    };
  } finally {
    importInProgress.value = false;
  }
}

// 处理数据清除
function handleClearData() {
  clearResult.value = null;
  
  try {
    const success = clearAllData(true); // 需要确认
    
    if (success) {
      clearResult.value = {
        success: true,
        message: '所有数据已清除。页面将在3秒后刷新...'
      };
      
      // 刷新页面
      setTimeout(() => {
        window.location.reload();
      }, 3000);
    } else {
      clearResult.value = {
        success: false,
        message: '操作已取消。'
      };
    }
  } catch (error) {
    clearResult.value = {
      success: false,
      message: `清除数据出错: ${error.message || '未知错误'}`
    };
  }
}

// 获取数据键名的可读名称
function getDataKeyName(key) {
  const keyMap = {
    'mood-records': '心情记录',
    'mood-categories': '心情分类',
    'rewards': '奖励列表',
    'rewardRecords': '奖励记录',
    'anniversaries': '纪念日',
    'tasks': '共同任务',
    'memos': '备忘录',
    'user-profile': '用户资料',
    'app-settings': '应用设置'
  };
  
  return keyMap[key] || key;
}
</script> 