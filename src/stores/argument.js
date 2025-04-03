import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { v4 as uuidv4 } from 'uuid';

export const useArgumentStore = defineStore('argument', () => {
  const argumentList = ref([]);
  const categories = ref([
    { id: 'housework', name: '家务分工', color: '#4F46E5' },
    { id: 'finance', name: '金钱支出', color: '#059669' },
    { id: 'habits', name: '个人习惯', color: '#B45309' },
    { id: 'entertainment', name: '娱乐选择', color: '#7C3AED' },
    { id: 'communication', name: '沟通问题', color: '#DC2626' },
    { id: 'emergency', name: '突发事件', color: '#DB2777' },
    // 新增积极情绪相关分类
    { id: 'sweet_moments', name: '甜蜜瞬间', color: '#EC4899' },
    { id: 'growth', name: '共同成长', color: '#10B981' },
    { id: 'expression', name: '情感表达', color: '#8B5CF6' },
    { id: 'appreciation', name: '相互欣赏', color: '#F59E0B' }
  ]);
  const aiAnalysis = ref({});

  // 加载数据
  const initializeStore = () => {
    const savedArguments = window.services.loadData('arguments');
    const savedCategories = window.services.loadData('categories');
    const savedAnalysis = window.services.loadData('aiAnalysis');
    
    if (savedArguments) {
      // 为旧数据增加默认的情绪类型（兼容性处理）
      argumentList.value = savedArguments.map(arg => ({
        ...arg,
        // 如果没有情绪类型，根据分类推断添加一个
        moodType: arg.moodType || getMoodTypeByCategory(arg.category) || 'negative'
      }));
    }
    
    if (savedCategories) {
      // 保留用户自定义分类，但确保新的情绪分类存在
      const existingIds = savedCategories.map(c => c.id);
      const newCategories = categories.value.filter(c => 
        ['sweet_moments', 'growth', 'expression', 'appreciation'].includes(c.id) && 
        !existingIds.includes(c.id)
      );
      
      categories.value = [...savedCategories, ...newCategories];
    } else {
      // 如果本地没有分类数据，保存默认分类
      saveToStorage();
    }
    
    if (savedAnalysis) {
      aiAnalysis.value = savedAnalysis;
    }
  };

  // 根据分类推断情绪类型
  const getMoodTypeByCategory = (categoryId) => {
    if (['sweet_moments', 'growth', 'expression', 'appreciation'].includes(categoryId)) {
      return 'positive';
    }
    return 'negative';
  };

  // 保存数据
  const saveToStorage = () => {
    window.services.saveData('arguments', argumentList.value);
    window.services.saveData('categories', categories.value);
    window.services.saveData('aiAnalysis', aiAnalysis.value);
  };

  // 添加心情记录（保持原方法名以兼容）
  const addArgument = (argument) => {
    // 确保有ID
    if (!argument.id) {
      argument.id = uuidv4();
    }
    
    // 确保有情绪类型
    if (!argument.moodType) {
      argument.moodType = getMoodTypeByCategory(argument.category) || 'negative';
    }
    
    argumentList.value.push(argument);
    saveToStorage();
    return argument;
  };

  // 添加心情记录（新方法名，功能相同）
  const addMoodEntry = addArgument;

  // 更新心情记录（保持原方法名以兼容）
  const updateArgument = (id, updates) => {
    const index = argumentList.value.findIndex(arg => arg.id === id);
    if (index !== -1) {
      // 如果更新了分类但没有更新情绪类型，尝试推断情绪类型
      if (updates.category && !updates.moodType) {
        updates.moodType = getMoodTypeByCategory(updates.category) || argumentList.value[index].moodType || 'negative';
      }
      
      argumentList.value[index] = { ...argumentList.value[index], ...updates };
      saveToStorage();
      return argumentList.value[index];
    }
    return null;
  };

  // 更新心情记录（新方法名，功能相同）
  const updateMoodEntry = updateArgument;

  // 获取心情记录（保持原方法名以兼容）
  const getArgumentById = (id) => {
    return argumentList.value.find(arg => arg.id === id) || null;
  };

  // 获取心情记录（新方法名，功能相同）
  const getMoodEntryById = getArgumentById;

  // 添加分类
  const addCategory = (category) => {
    // 确保有ID
    if (!category.id) {
      category.id = uuidv4();
    }
    categories.value.push(category);
    saveToStorage();
    return category;
  };

  // 更新分类
  const updateCategory = (id, updates) => {
    const index = categories.value.findIndex(cat => cat.id === id);
    if (index !== -1) {
      categories.value[index] = { ...categories.value[index], ...updates };
      saveToStorage();
      return categories.value[index];
    }
    return null;
  };

  // 删除分类
  const deleteCategory = (id) => {
    const index = categories.value.findIndex(cat => cat.id === id);
    if (index !== -1) {
      categories.value.splice(index, 1);
      saveToStorage();
      return true;
    }
    return false;
  };
  
  // 保存AI分析结果
  const saveAIAnalysis = (argumentId, analysisText) => {
    aiAnalysis.value[argumentId] = {
      text: analysisText,
      timestamp: new Date().toISOString()
    };
    saveToStorage();
  };
  
  // 获取AI分析结果
  const getAIAnalysis = (argumentId) => {
    return aiAnalysis.value[argumentId] || null;
  };
  
  // 清除AI分析结果
  const clearAIAnalysis = (argumentId) => {
    if (aiAnalysis.value[argumentId]) {
      delete aiAnalysis.value[argumentId];
      saveToStorage();
      return true;
    }
    return false;
  };

  // 解决率统计（情绪管理成功率）
  const resolutionRate = computed(() => {
    const resolved = argumentList.value.filter(arg => arg.status === 'resolved').length;
    return argumentList.value.length ? (resolved / argumentList.value.length) * 100 : 0;
  });

  // 情绪积极率（新增）
  const positiveRate = computed(() => {
    const positive = argumentList.value.filter(arg => arg.moodType === 'positive').length;
    return argumentList.value.length ? (positive / argumentList.value.length) * 100 : 0;
  });

  // 分类统计
  const categoryStats = computed(() => {
    return categories.value.map(category => ({
      name: category.name,
      count: argumentList.value.filter(arg => arg.category === category.id).length,
      color: category.color
    }));
  });

  // 情绪类型统计（新增）
  const moodTypeStats = computed(() => {
    const positive = argumentList.value.filter(arg => arg.moodType === 'positive').length;
    const negative = argumentList.value.filter(arg => 
      !arg.moodType || arg.moodType === 'negative'
    ).length;
    
    return [
      { name: '积极情绪', count: positive, color: '#10B981' },
      { name: '消极情绪', count: negative, color: '#EF4444' }
    ];
  });

  // 按月统计
  const monthlyStats = computed(() => {
    const stats = {};
    
    argumentList.value.forEach(arg => {
      const date = new Date(arg.date);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!stats[monthYear]) {
        stats[monthYear] = {
          total: 0,
          resolved: 0,
          ongoing: 0,
          positive: 0,
          negative: 0
        };
      }
      
      stats[monthYear].total += 1;
      
      if (arg.status === 'resolved') {
        stats[monthYear].resolved += 1;
      } else {
        stats[monthYear].ongoing += 1;
      }
      
      if (arg.moodType === 'positive') {
        stats[monthYear].positive += 1;
      } else {
        stats[monthYear].negative += 1;
      }
    });
    
    // 转换为数组并排序
    return Object.entries(stats)
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => a.month.localeCompare(b.month));
  });

  // 成长指数（优化计算逻辑，考虑积极情绪占比）
  const growthIndex = computed(() => {
    if (argumentList.value.length === 0) return 100;
    
    const resolvedPercentage = resolutionRate.value;
    const positivePercentage = positiveRate.value;
    const recentIssuesWeight = Math.max(0, 100 - (argumentList.value.filter(arg => 
      arg.status === 'ongoing' && (!arg.moodType || arg.moodType === 'negative')
    ).length * 5));
    
    // 考虑积极情绪占比的成长指数
    return Math.min(100, Math.round((resolvedPercentage * 0.4) + (positivePercentage * 0.3) + (recentIssuesWeight * 0.3)));
  });

  return {
    argumentList,
    categories,
    aiAnalysis,
    initializeStore,
    // 原方法保留
    addArgument,
    updateArgument,
    getArgumentById,
    // 新方法
    addMoodEntry,
    updateMoodEntry,
    getMoodEntryById,
    // 其他方法
    addCategory,
    updateCategory,
    deleteCategory,
    saveAIAnalysis,
    getAIAnalysis,
    clearAIAnalysis,
    // 计算属性
    resolutionRate,
    positiveRate,
    categoryStats,
    moodTypeStats,
    monthlyStats,
    growthIndex
  };
}); 