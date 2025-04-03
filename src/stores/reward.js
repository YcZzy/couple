import { defineStore } from 'pinia';
import { v4 as uuidv4 } from 'uuid';
import servicesAdapter from '../utils/services-adapter';

// 使用服务适配器，确保在不同环境中正常工作
const services = servicesAdapter;

export const useRewardStore = defineStore('reward', {
  state: () => ({
    rewards: [],
    records: []
  }),
  
  actions: {
    // 初始化商店数据
    initializeStore() {
      this.loadData();
      
      // 如果没有数据，创建一些默认数据
      if (this.rewards.length === 0) {
        this.initializeDefaultRewards();
      }
    },
    
    // 从持久化存储加载数据
    loadData() {
      try {
        // 使用服务适配器加载数据
        const rewards = services.loadData('rewards') || [];
        const records = services.loadData('rewardRecords') || [];
        
        this.rewards = rewards;
        this.records = records;
      } catch (error) {
        console.error('加载奖励数据失败:', error);
      }
    },
    
    // 保存数据到持久化存储
    saveData() {
      try {
        // 使用服务适配器保存数据
        services.saveData('rewards', this.rewards);
        services.saveData('rewardRecords', this.records);
      } catch (error) {
        console.error('保存奖励数据失败:', error);
      }
    },
    
    // 初始化一些默认的奖励和惩罚
    initializeDefaultRewards() {
      this.rewards = [
        {
          id: uuidv4(),
          name: '一起看电影',
          description: '选择一部两人都喜欢的电影，度过美好的电影之夜',
          type: 'reward'
        },
        {
          id: uuidv4(),
          name: '按摩服务',
          description: '获得对方15分钟的专业按摩服务',
          type: 'reward'
        },
        {
          id: uuidv4(),
          name: '特别晚餐',
          description: '由对方准备一顿特别的晚餐',
          type: 'reward'
        },
        {
          id: uuidv4(),
          name: '洗碗一周',
          description: '负责整整一周的洗碗工作',
          type: 'punishment'
        },
        {
          id: uuidv4(),
          name: '早起做早餐',
          description: '连续三天早起为对方准备早餐',
          type: 'punishment'
        }
      ];
      
      this.saveData();
    },
    
    // 添加奖励或惩罚
    addReward(reward) {
      this.rewards.push(reward);
      this.saveData();
    },
    
    // 更新奖励或惩罚
    updateReward(id, updatedData) {
      const index = this.rewards.findIndex(r => r.id === id);
      if (index !== -1) {
        this.rewards[index] = { ...this.rewards[index], ...updatedData };
        this.saveData();
      }
    },
    
    // 删除奖励或惩罚
    deleteReward(id) {
      // 检查是否有记录使用此奖励
      const hasRecords = this.records.some(r => r.rewardId === id);
      if (hasRecords) {
        // 可以选择阻止删除或级联删除记录
        const recordsToRemove = this.records.filter(r => r.rewardId === id);
        recordsToRemove.forEach(record => {
          const recordIndex = this.records.findIndex(r => r.id === record.id);
          if (recordIndex !== -1) {
            this.records.splice(recordIndex, 1);
          }
        });
      }
      
      const index = this.rewards.findIndex(r => r.id === id);
      if (index !== -1) {
        this.rewards.splice(index, 1);
        this.saveData();
      }
    },
    
    // 添加记录
    addRecord(record) {
      this.records.push(record);
      this.saveData();
    },
    
    // 获取特定类型的奖励
    getRewardsByType(type) {
      return this.rewards.filter(r => r.type === type);
    },
    
    // 获取记录
    getRecords() {
      return this.records.sort((a, b) => new Date(b.date) - new Date(a.date));
    }
  }
}); 