import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { nanoid } from 'nanoid';
import dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';
import servicesAdapter from '../utils/services-adapter';

// 使用服务适配器，确保在不同环境中正常工作
const services = servicesAdapter;

export const useMoodStore = defineStore('mood', {
  state: () => ({
    moods: [],
    categories: [],
    stats: {
      positiveRate: '0',
      resolvedRate: '0'
    }
  }),
  
  actions: {
    // 初始化数据
    init() {
      this.loadData();
      this.updateStats();
    },
    
    // 从持久化存储加载数据
    loadData() {
      try {
        // 使用服务适配器加载数据
        const moods = services.loadData('moods') || [];
        const categories = services.loadData('categories') || [];
        
        if (moods.length) {
          this.moods = moods;
        } else {
          this.initializeDefaultData();
        }
        
        if (categories.length) {
          this.categories = categories;
        } else {
          this.initializeDefaultCategories();
        }
      } catch (error) {
        console.error('加载数据失败:', error);
        // 如果加载失败，初始化默认数据
        this.initializeDefaultData();
        this.initializeDefaultCategories();
      }
    },
    
    // 保存数据到持久化存储
    saveData() {
      try {
        // 使用服务适配器保存数据
        services.saveData('moods', this.moods);
        services.saveData('categories', this.categories);
      } catch (error) {
        console.error('保存数据失败:', error);
      }
    },
    
    // 初始化默认分类
    initializeDefaultCategories() {
      this.categories = [
        { id: 'comm', name: '沟通问题', icon: '💬', type: 'negative' },
        { id: 'boundary', name: '边界问题', icon: '🚧', type: 'negative' },
        { id: 'trust', name: '信任问题', icon: '🔒', type: 'negative' },
        { id: 'finance', name: '财务问题', icon: '💰', type: 'negative' },
        { id: 'family', name: '家庭关系', icon: '👪', type: 'negative' },
        { id: 'jealousy', name: '嫉妒问题', icon: '😤', type: 'negative' },
        { id: 'intimacy', name: '亲密关系', icon: '❤️', type: 'negative' },
        { id: 'happy', name: '美好时光', icon: '💖', type: 'positive' },
        { id: 'growth', name: '共同成长', icon: '🌱', type: 'positive' },
        { id: 'gift', name: '惊喜礼物', icon: '🎁', type: 'positive' },
        { id: 'milestone', name: '重要里程碑', icon: '✨', type: 'positive' }
      ];
      
      this.saveData();
    },
    
    // 初始化示例数据
    initializeDefaultData() {
      const now = new Date();
      const today = now.toISOString().split('T')[0];
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      
      this.moods = [
        {
          id: uuidv4(),
          date: today,
          time: '09:30',
          category: 'happy',
          content: '一起吃了喜欢的早餐，开始了美好的一天。',
          moodType: 'positive',
          intensity: 1
        },
        {
          id: uuidv4(),
          date: yesterdayStr,
          time: '19:00',
          category: 'comm',
          content: '关于周末计划有些分歧，讨论后达成了一致。',
          moodType: 'negative',
          intensity: 1,
          resolved: true,
          resolution: '我们决定周六按她的想法去公园，周日按我的想法去看电影。'
        }
      ];
      
      this.saveData();
    },
    
    // 更新统计数据
    updateStats() {
      // 计算积极情绪占比
      const totalMoods = this.moods.length;
      const positiveMoods = this.moods.filter(m => m.moodType === 'positive').length;
      const positiveRate = totalMoods > 0 ? (positiveMoods / totalMoods * 100).toFixed(1) : '0';
      
      // 计算解决率
      const totalNegative = this.moods.filter(m => m.moodType === 'negative').length;
      const resolvedNegative = this.moods.filter(m => m.moodType === 'negative' && m.resolved).length;
      const resolvedRate = totalNegative > 0 ? (resolvedNegative / totalNegative * 100).toFixed(1) : '0';
      
      this.stats = {
        positiveRate,
        resolvedRate
      };
    },
    
    // 添加心情记录
    addMood(mood) {
      if (!mood.id) {
        mood.id = uuidv4();
      }
      this.moods.push(mood);
      this.saveData();
      this.updateStats();
      return true;
    },
    
    // 更新心情记录
    updateMood(id, updatedData) {
      const index = this.moods.findIndex(m => m.id === id);
      if (index === -1) return false;
      
      // 合并更新的数据
      this.moods[index] = { ...this.moods[index], ...updatedData };
      this.saveData();
      this.updateStats();
      return true;
    },
    
    // 删除心情记录
    deleteMood(id) {
      const index = this.moods.findIndex(m => m.id === id);
      if (index === -1) return false;
      
      this.moods.splice(index, 1);
      this.saveData();
      this.updateStats();
      return true;
    },
    
    // 根据ID获取心情记录
    getMoodById(id) {
      return this.moods.find(m => m.id === id) || null;
    },
    
    // 添加分类
    addCategory(category) {
      if (!category.id) {
        category.id = uuidv4();
      }
      this.categories.push(category);
      this.saveData();
      return true;
    },
    
    // 更新分类
    updateCategory(id, updatedData) {
      const index = this.categories.findIndex(c => c.id === id);
      if (index === -1) return false;
      
      this.categories[index] = { ...this.categories[index], ...updatedData };
      this.saveData();
      return true;
    },
    
    // 删除分类
    deleteCategory(id) {
      const index = this.categories.findIndex(c => c.id === id);
      if (index === -1) return false;
      
      // 检查是否有心情记录使用此分类
      const usedInMoods = this.moods.some(m => m.category === id);
      if (usedInMoods) return false;
      
      this.categories.splice(index, 1);
      this.saveData();
      return true;
    },
    
    // 按日期获取心情记录
    getMoodsByDate(date) {
      return this.moods.filter(m => m.date === date);
    },
    
    // 按类型获取分类
    getCategoriesByType(type) {
      return this.categories.filter(c => c.type === type);
    },
    
    // 获取心情记录的月度统计
    getMonthlyStats(year, month) {
      // 构建月份字符串
      const monthStr = `${year}-${String(month).padStart(2, '0')}`;
      
      // 过滤当月的记录
      const monthMoods = this.moods.filter(mood => mood.date.startsWith(monthStr));
      
      // 按日期分组
      const dayStats = {};
      monthMoods.forEach(mood => {
        const day = parseInt(mood.date.split('-')[2]);
        if (!dayStats[day]) {
          dayStats[day] = { positive: 0, negative: 0 };
        }
        
        if (mood.moodType === 'positive') {
          dayStats[day].positive++;
        } else {
          dayStats[day].negative++;
        }
      });
      
      return Object.entries(dayStats).map(([day, stats]) => ({
        day: parseInt(day),
        ...stats
      }));
    },
    
    // 导出数据
    exportData() {
      try {
        const data = {
          moods: this.moods,
          categories: this.categories,
          stats: this.stats,
          exportDate: new Date().toISOString()
        };
        
        return JSON.stringify(data, null, 2);
      } catch (error) {
        console.error('导出数据失败:', error);
        return null;
      }
    },
    
    // 导入数据
    importData(jsonData) {
      try {
        const data = JSON.parse(jsonData);
        
        if (data.moods && Array.isArray(data.moods)) {
          this.moods = data.moods;
        }
        
        if (data.categories && Array.isArray(data.categories)) {
          this.categories = data.categories;
        }
        
        this.saveData();
        this.updateStats();
        return true;
      } catch (error) {
        console.error('导入数据失败:', error);
        return false;
      }
    }
  }
}); 