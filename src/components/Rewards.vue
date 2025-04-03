<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRewardStore } from '../stores/reward';
import { v4 as uuidv4 } from 'uuid';

const store = useRewardStore();
const activeTab = ref('rewards'); // rewards, punishments, records
const showForm = ref(false);
const editingId = ref(null);
const currentDate = ref(new Date());

// 随机甜蜜语录
const sweetQuotes = [
  "每一个奖励，都是爱的见证～",
  "彼此的关怀，是最美好的礼物～",
  "爱，需要一点甜蜜的仪式感～",
  "值得欢庆的每一刻，都是我们共同的回忆～",
  "用小确幸，编织爱的日常～"
];
const randomQuote = sweetQuotes[Math.floor(Math.random() * sweetQuotes.length)];

// 日期格式化
const formattedDate = computed(() => {
  const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
  return currentDate.value.toLocaleDateString('zh-CN', options);
});

const form = ref({
  name: '',
  description: '',
  type: 'reward'
});

const recordForm = ref({
  rewardId: '',
  date: new Date().toISOString().split('T')[0],
  notes: ''
});

onMounted(() => {
  store.initializeStore();
});

// 监听标签页变化，更新表单类型
watch(activeTab, (newTab) => {
  form.value.type = newTab === 'rewards' ? 'reward' : 'punishment';
});

// 过滤后的奖励
const filteredRewards = computed(() => {
  return store.getRewardsByType(activeTab.value === 'rewards' ? 'reward' : 'punishment');
});

// 重置表单
const resetForm = () => {
  form.value = {
    name: '',
    description: '',
    type: activeTab.value === 'rewards' ? 'reward' : 'punishment'
  };
  editingId.value = null;
};

// 添加/更新奖励
const saveReward = () => {
  if (!form.value.name.trim()) {
    alert('请输入名称');
    return;
  }

  if (editingId.value) {
    store.updateReward(editingId.value, form.value);
  } else {
    store.addReward({
      id: uuidv4(),
      ...form.value
    });
  }

  resetForm();
  showForm.value = false;
};

// 编辑奖励
const editReward = (reward) => {
  form.value = {
    name: reward.name,
    description: reward.description,
    type: reward.type
  };
  editingId.value = reward.id;
  showForm.value = true;
};

// 删除奖励
const deleteReward = (id) => {
  if (confirm('确定要删除此项吗？')) {
    store.deleteReward(id);
  }
};

// 添加记录
const addRecord = () => {
  if (!recordForm.value.rewardId) {
    alert('请选择奖励或小惩罚');
    return;
  }

  const reward = store.rewards.find(r => r.id === recordForm.value.rewardId);
  if (!reward) return;

  store.addRecord({
    id: uuidv4(),
    rewardId: recordForm.value.rewardId,
    rewardName: reward.name,
    rewardType: reward.type,
    date: recordForm.value.date,
    notes: recordForm.value.notes
  });

  recordForm.value = {
    rewardId: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  };
};

// 获取奖励类型文本
const getTypeText = (type) => {
  return type === 'reward' ? '奖励' : '小惩罚';
};

// 获取类型表情
const getTypeEmoji = (type) => {
  return type === 'reward' ? '🎁' : '🍋';
};
</script>

<template>
  <div class="page-container space-y-8">
    <!-- 顶部区域 -->
    <div class="page-header-yellow">
      <div class="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h1 class="page-title-yellow">
            <span class="text-3xl mr-3 heart-pulse inline-block">🎁</span>
            甜蜜奖励
          </h1>
          <p class="text-gray-600 mt-1">{{ formattedDate }}</p>
          <p class="text-amber-600 mt-3 italic">"{{ randomQuote }}"</p>
        </div>
      </div>
    </div>
    
    <!-- 标签页切换 -->
    <div class="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm p-0.5 border border-gray-100">
      <nav class="flex" aria-label="Tabs">
        <button 
          @click="activeTab = 'rewards'" 
          :class="[
            'flex-1 py-4 px-1 font-medium text-sm rounded-xl transition-all duration-200',
            activeTab === 'rewards' 
              ? 'bg-gradient-to-r from-amber-50 to-rose-50 text-amber-600 shadow-sm' 
              : 'text-gray-500 hover:text-amber-500'
          ]"
        >
          <div class="flex justify-center items-center">
            <span class="text-xl mr-2">🎁</span> 甜蜜奖励
          </div>
        </button>
        <button 
          @click="activeTab = 'punishments'" 
          :class="[
            'flex-1 py-4 px-1 font-medium text-sm rounded-xl transition-all duration-200',
            activeTab === 'punishments' 
              ? 'bg-gradient-to-r from-amber-50 to-rose-50 text-rose-600 shadow-sm' 
              : 'text-gray-500 hover:text-rose-500'
          ]"
        >
          <div class="flex justify-center items-center">
            <span class="text-xl mr-2">🍋</span> 小惩罚
          </div>
        </button>
        <button 
          @click="activeTab = 'records'" 
          :class="[
            'flex-1 py-4 px-1 font-medium text-sm rounded-xl transition-all duration-200',
            activeTab === 'records' 
              ? 'bg-gradient-to-r from-amber-50 to-rose-50 text-amber-600 shadow-sm' 
              : 'text-gray-500 hover:text-amber-500'
          ]"
        >
          <div class="flex justify-center items-center">
            <span class="text-xl mr-2">📝</span> 幸福记录
          </div>
        </button>
      </nav>
    </div>
    
    <!-- 奖励和惩罚的管理界面 -->
    <div v-if="activeTab === 'rewards' || activeTab === 'punishments'">
      <div class="flex justify-between items-center mb-4">
        <div class="flex items-center">
          <span class="text-2xl mr-2">{{ getTypeEmoji(activeTab === 'rewards' ? 'reward' : 'punishment') }}</span>
          <h2 class="text-xl font-semibold text-gray-800">
            {{ activeTab === 'rewards' ? '甜蜜奖励' : '小惩罚' }}
          </h2>
        </div>
        <button 
          v-if="!showForm" 
          @click="showForm = true; resetForm();" 
          class="btn btn-primary text-sm group"
        >
          <span class="mr-1 group-hover:-translate-y-1 transition-transform duration-300">+</span>
          添加{{ activeTab === 'rewards' ? '奖励' : '小惩罚' }}
        </button>
      </div>
      
      <!-- 添加/编辑表单 -->
      <div v-if="showForm" class="card card-yellow transform transition-all duration-500">
        <div class="card-title">
          <span class="card-title-icon">{{ getTypeEmoji(activeTab === 'rewards' ? 'reward' : 'punishment') }}</span>
          <h3 class="card-title-text text-amber-700">
            {{ editingId ? '编辑' : '添加' }}{{ activeTab === 'rewards' ? '奖励' : '小惩罚' }}
          </h3>
        </div>
        <form @submit.prevent="saveReward" class="space-y-4">
          <div>
            <label for="name" class="block text-sm font-medium text-gray-700 mb-1">名称</label>
            <input 
              type="text" 
              id="name" 
              v-model="form.name" 
              class="input" 
              placeholder="例如：一起看电影"
            >
          </div>
          <div>
            <label for="description" class="block text-sm font-medium text-gray-700 mb-1">描述 (可选)</label>
            <textarea 
              id="description" 
              v-model="form.description" 
              rows="3" 
              class="textarea" 
              placeholder="添加一些额外的说明..."
            ></textarea>
          </div>
          <div class="flex justify-end space-x-2 pt-2">
            <button 
              type="button" 
              @click="showForm = false" 
              class="btn btn-outline"
            >
              取消
            </button>
            <button 
              type="submit" 
              class="btn btn-primary"
            >
              保存
            </button>
          </div>
        </form>
      </div>
      
      <!-- 奖励/惩罚列表 -->
      <div v-if="filteredRewards.length === 0 && !showForm" class="text-center py-10">
        <div class="text-4xl mb-3">{{ getTypeEmoji(activeTab === 'rewards' ? 'reward' : 'punishment') }}</div>
        <h3 class="text-lg font-medium text-gray-600">还没有{{ activeTab === 'rewards' ? '奖励' : '小惩罚' }}呢</h3>
        <p class="text-gray-500 mt-1">点击上方的添加按钮，创建你的第一个{{ activeTab === 'rewards' ? '奖励' : '小惩罚' }}吧！</p>
      </div>
      
      <div v-else-if="!showForm" class="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
        <div 
          v-for="reward in filteredRewards" 
          :key="reward.id" 
          class="card card-yellow hover:shadow-md transition-shadow duration-300"
        >
          <div class="flex justify-between items-start">
            <div class="flex">
              <div class="mr-3 text-2xl self-start float-animation">{{ getTypeEmoji(reward.type) }}</div>
              <div>
                <h3 class="text-lg font-medium text-gray-800">{{ reward.name }}</h3>
                <p class="mt-1 text-sm text-gray-600">{{ reward.description }}</p>
              </div>
            </div>
            <div class="flex space-x-2">
              <button 
                @click="editReward(reward)" 
                class="px-3 py-1 text-sm text-blue-600 hover:text-blue-800 bg-blue-50 rounded-full opacity-70 hover:opacity-100 transition-opacity"
              >
                编辑
              </button>
              <button 
                @click="deleteReward(reward.id)" 
                class="px-3 py-1 text-sm text-rose-600 hover:text-rose-800 bg-rose-50 rounded-full opacity-70 hover:opacity-100 transition-opacity"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 记录 -->
    <div v-if="activeTab === 'records'">
      <div class="flex items-center mb-4">
        <span class="text-2xl mr-2">📝</span>
        <h2 class="text-xl font-semibold text-gray-800">幸福记录</h2>
      </div>
      
      <!-- 添加记录表单 -->
      <div class="card bg-gradient-to-br from-amber-50 to-rose-50/50 border-amber-100/50 mb-6">
        <div class="flex items-center mb-5">
          <span class="text-2xl mr-2">✨</span>
          <h3 class="text-lg font-semibold text-amber-700">记录美好时刻</h3>
        </div>
        <form @submit.prevent="addRecord" class="space-y-4">
          <div>
            <label for="reward" class="block text-sm font-medium text-gray-600 mb-1">选择奖励或小惩罚</label>
            <select
              id="reward"
              v-model="recordForm.rewardId"
              class="select"
              required
            >
              <option value="" disabled>请选择...</option>
              <optgroup label="甜蜜奖励">
                <option v-for="r in store.getRewardsByType('reward')" :key="r.id" :value="r.id">
                  {{ r.name }}
                </option>
              </optgroup>
              <optgroup label="小惩罚">
                <option v-for="r in store.getRewardsByType('punishment')" :key="r.id" :value="r.id">
                  {{ r.name }}
                </option>
              </optgroup>
            </select>
          </div>
          
          <div>
            <label for="record-date" class="block text-sm font-medium text-gray-600 mb-1">日期</label>
            <input
              id="record-date"
              v-model="recordForm.date"
              type="date"
              class="input"
            />
          </div>
          
          <div>
            <label for="record-notes" class="block text-sm font-medium text-gray-600 mb-1">感想笔记</label>
            <textarea
              id="record-notes"
              v-model="recordForm.notes"
              rows="2"
              class="textarea"
              placeholder="记录下这一刻的感受..."
            ></textarea>
          </div>
          
          <button type="submit" class="btn btn-primary">记录此刻</button>
        </form>
      </div>
      
      <!-- 记录列表 -->
      <div class="space-y-4">
        <div v-for="record in store.getRecords()" :key="record.id" 
             class="card p-5 hover:shadow-md transition-all duration-300 border-l-4"
             :class="{
               'border-l-amber-300': record.rewardType === 'reward',
               'border-l-rose-300': record.rewardType === 'punishment'
             }">
          <div class="flex">
            <div class="mr-3 text-2xl self-start mt-1">{{ getTypeEmoji(record.rewardType) }}</div>
            <div>
              <div class="flex items-center space-x-3 mb-1">
                <h3 class="font-medium text-gray-800">{{ record.rewardName }}</h3>
                <span class="text-sm text-gray-500">{{ new Date(record.date).toLocaleDateString() }}</span>
                <span 
                  :class="{
                    'px-2 py-0.5 rounded-full text-xs font-medium': true,
                    'bg-amber-100 text-amber-700': record.rewardType === 'reward',
                    'bg-rose-100 text-rose-700': record.rewardType === 'punishment'
                  }"
                >
                  {{ getTypeText(record.rewardType) }}
                </span>
              </div>
              <p class="text-gray-600 mt-2">{{ record.notes || '没有额外笔记' }}</p>
            </div>
          </div>
        </div>
        
        <div v-if="store.getRecords().length === 0" class="card p-12 text-center">
          <div class="text-5xl mb-3">📝</div>
          <p class="text-gray-500 mb-2 text-lg">暂无幸福记录</p>
          <p class="text-amber-600 text-sm">记录下你们的甜蜜时刻吧</p>
        </div>
      </div>
    </div>
  </div>
</template> 