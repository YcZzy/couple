<script setup>
import { ref, defineProps, defineEmits, onMounted, watch, computed } from 'vue';
import { useMoodStore } from '../store/mood';

const props = defineProps({
  argumentId: String,
  visible: Boolean
});

const emit = defineEmits(['close']);
const store = useMoodStore();
const isLoading = ref(false);
const error = ref(null);
const analysis = ref('');
const savedAnalysis = ref(null);
const isGeneratingNew = ref(false);
const isProcessing = ref(false);
const isAISupported = ref(true);
const currentMood = ref(null);

// 关闭对话框
const close = () => {
  emit('close');
};

// 根据情绪类型获取不同的分析提示
const getAnalysisPrompt = computed(() => {
  if (!currentMood.value) return '';
  
  const baseInfo = `
日期: ${new Date(currentMood.value.date).toLocaleDateString()}
分类: ${store.categories.find(c => c.id === currentMood.value.category)?.name || '未分类'}
情绪类型: ${currentMood.value.moodType === 'positive' ? '积极情绪' : '消极情绪'}
强度: ${currentMood.value.intensity} (1-3)
状态: ${currentMood.value.moodType === 'negative' ? (currentMood.value.resolved ? '已解决' : '未解决') : '不适用'}
内容: ${currentMood.value.content || '无内容'}
${currentMood.value.resolution ? `应对方式: ${currentMood.value.resolution}` : ''}
${currentMood.value.reflection ? `心得体会: ${currentMood.value.reflection}` : ''}
`;

  if (currentMood.value.moodType === 'positive') {
    return `
作为情感智能顾问，请分析以下积极情绪记录。根据这段美好时光，提供积极的强化和建议，帮助情侣更好地保持和增强这种积极情绪。
分析应该包括：
1. 这种积极情绪的价值和意义
2. 如何将这种美好时刻的体验延续到日常生活中
3. 建议如何记录和珍藏这种情感，使其成为关系中的宝贵财富
4. 如何从中获得成长，加深彼此的连接

${baseInfo}

请用温暖、鼓励的语气，提供具体且实用的建议。`;
  } else {
    return `
作为情感智能顾问，请分析以下情绪记录。根据记录的情绪状况，提供中立、客观的分析和建议，帮助情侣更好地理解和处理这种情绪。
分析应该包括：
1. 可能引起这种情绪的根本原因
2. 双方可以采取哪些具体沟通策略来有效处理
3. 如何将这种情绪转化为关系成长的机会
4. 预防类似情绪再次发生的建议

${baseInfo}

请用平和、支持的语气，不要指责任何一方，而是关注解决方案和成长机会。`;
  }
});

// 检查AI功能支持
onMounted(() => {
  try {
    // 检查是否有window.services.checkAISupport方法
    if (window.services && typeof window.services.checkAISupport === 'function') {
      isAISupported.value = window.services.checkAISupport();
    } else {
      isAISupported.value = true; // 默认支持
    }
  } catch (e) {
    isAISupported.value = false;
    console.error('检查AI支持时出错:', e);
  }
});

// 获取AI分析
const getAnalysis = async (force = false) => {
  if (!props.argumentId) return;
  
  // 检查AI支持
  if (!isAISupported.value) {
    error.value = '当前环境不支持AI功能';
    return;
  }
  
  // 检查是否有保存的分析结果
  if (!force) {
    savedAnalysis.value = store.getAIAnalysis(props.argumentId);
    if (savedAnalysis.value) {
      analysis.value = savedAnalysis.value;
      return;
    }
  }
  
  isLoading.value = true;
  isProcessing.value = true;
  error.value = null;
  isGeneratingNew.value = true;
  analysis.value = ''; // 清空之前的分析结果
  
  try {
    generateAnalysis();
    
    // 更新保存的分析信息
    savedAnalysis.value = analysis.value;
  } catch (err) {
    console.error('AI分析错误:', err);
    error.value = err.message || '分析过程中发生错误';
    // 增加更详细的错误信息
    if (err.stack) {
      console.error('错误堆栈:', err.stack);
    }
  } finally {
    isLoading.value = false;
    isGeneratingNew.value = false;
    isProcessing.value = false;
  }
};

// 重新生成分析
const regenerateAnalysis = () => {
  getAnalysis(true);
};

// 当组件属性变化且可见时执行分析
watch(() => [props.visible, props.argumentId], ([newVisible, newId]) => {
  if (newVisible && newId) {
    loadMood();
    getAnalysis();
  }
}, { immediate: true });

const loadMood = () => {
  currentMood.value = store.getMoodById(props.argumentId);
};

const generateAnalysis = () => {
  if (!currentMood.value) return;
  
  // 根据情绪类型生成不同的分析结果
  if (currentMood.value.moodType === 'positive') {
    generatePositiveMoodAnalysis();
  } else {
    generateNegativeMoodAnalysis();
  }
  
  // 保存分析结果
  store.saveAIAnalysis(props.argumentId, analysis.value);
};

// 生成积极情绪分析
const generatePositiveMoodAnalysis = () => {
  const category = store.categories.find(c => c.id === currentMood.value.category)?.name || '未分类';
  
  // 创建三个部分的内容，每个部分都是独立的卡片
  const valueSection = `
<div class="bg-white/60 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 border border-teal-100">
  <h3 class="text-lg font-medium text-teal-700 mb-3 flex items-center">
    <span class="text-xl mr-2">✨</span>
    美好瞬间的珍贵价值
  </h3>
  <p class="text-gray-700">
    记录的这个"${category}"场景展现了你们关系中的美好时光。这样的积极体验是关系健康的重要养分，能够增强彼此间的情感连接，建立共同的美好记忆库。研究表明，当我们有意识地关注并珍视这些积极时刻时，它们对关系的积极影响会更加持久。
  </p>
</div>`;

  const suggestionsSection = `
<div class="bg-white/60 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 border border-emerald-100">
  <h3 class="text-lg font-medium text-emerald-700 mb-3 flex items-center">
    <span class="text-xl mr-2">💫</span>
    延续美好的建议
  </h3>
  <ul class="space-y-2">
    <li class="flex items-start">
      <span class="text-emerald-500 mr-2">•</span>
      <span>创建一个专属于你们的"美好时刻"相册或记录本</span>
    </li>
    <li class="flex items-start">
      <span class="text-emerald-500 mr-2">•</span>
      <span>定期回顾这些记忆，尤其是在面对挑战的时期</span>
    </li>
    <li class="flex items-start">
      <span class="text-emerald-500 mr-2">•</span>
      <span>建立与这次体验相关的小传统或仪式，定期重复</span>
    </li>
    <li class="flex items-start">
      <span class="text-emerald-500 mr-2">•</span>
      <span>用具体的语言表达这次体验给你带来的快乐和感激</span>
    </li>
  </ul>
</div>`;

  const growthSection = `
<div class="bg-white/60 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 border border-indigo-100">
  <h3 class="text-lg font-medium text-indigo-700 mb-3 flex items-center">
    <span class="text-xl mr-2">🌱</span>
    成长与连接
  </h3>
  <p class="text-gray-700">
    这样的积极体验不仅带来即时的快乐，更能够加深你们之间的情感纽带。当双方共同创造和分享这类体验时，会形成一种"情感储蓄"，为关系提供长期的支持和韧性。尝试从这次美好时刻中找出可以常态化的元素，将它们融入日常生活中。
  </p>
</div>`;

  // 随机选择一种不同的卡片顺序
  const sections = [valueSection, suggestionsSection, growthSection];
  // 保持原来顺序的可能性
  if (Math.random() > 0.5) {
    sections.sort(() => Math.random() - 0.5);
  }
  
  analysis.value = sections.join('\n');
};

// 生成消极情绪分析
const generateNegativeMoodAnalysis = () => {
  const category = store.categories.find(c => c.id === currentMood.value.category)?.name || '未分类';
  
  // 创建三个部分的内容，每个部分都是独立的卡片
  const rootCauseSection = `
<div class="bg-white/60 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 border border-amber-100">
  <h3 class="text-lg font-medium text-amber-700 mb-3 flex items-center">
    <span class="text-xl mr-2">💡</span>
    情绪根源分析
  </h3>
  <p class="text-gray-700">
    在"${category}"类别中记录的这种情绪状态，通常源于期望与现实之间的差距。研究表明，当我们的期望未被满足时，会产生失落、沮丧或挫折感。这些情绪是完全正常的人类反应，认识到这一点有助于以更客观的视角看待当前状况。
  </p>
</div>`;

  const communicationSection = `
<div class="bg-white/60 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 border border-blue-100">
  <h3 class="text-lg font-medium text-blue-700 mb-3 flex items-center">
    <span class="text-xl mr-2">💬</span>
    有效沟通策略
  </h3>
  <ul class="space-y-2">
    <li class="flex items-start">
      <span class="text-blue-500 mr-2">•</span>
      <span>选择平静的时刻进行对话，避免情绪激动时交流</span>
    </li>
    <li class="flex items-start">
      <span class="text-blue-500 mr-2">•</span>
      <span>使用"我感觉..."的表达方式，而非指责性的"你总是..."</span>
    </li>
    <li class="flex items-start">
      <span class="text-blue-500 mr-2">•</span>
      <span>专注于倾听对方的需求和感受，而不只是想着如何回应</span>
    </li>
    <li class="flex items-start">
      <span class="text-blue-500 mr-2">•</span>
      <span>共同寻找满足双方核心需求的解决方案</span>
    </li>
  </ul>
</div>`;

  const growthSection = `
<div class="bg-white/60 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 border border-purple-100">
  <h3 class="text-lg font-medium text-purple-700 mb-3 flex items-center">
    <span class="text-xl mr-2">🌈</span>
    转化为成长机会
  </h3>
  <p class="text-gray-700">
    每次情绪起伏都是关系成长的潜在契机。这类体验可以帮助双方更深入地了解彼此的边界、需求和价值观。通过共同应对这些挑战，你们可以建立更强的情感韧性和更深的理解。记得在平静后一起反思这次经历带来的洞察。
  </p>
</div>`;

  // 随机选择一种不同的卡片顺序
  const sections = [rootCauseSection, communicationSection, growthSection];
  // 保持原来顺序的可能性
  if (Math.random() > 0.5) {
    sections.sort(() => Math.random() - 0.5);
  }
  
  analysis.value = sections.join('\n');
};
</script>

<template>
  <div v-if="visible" class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
    <div class="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col mx-4" 
         :class="currentMood && currentMood.moodType === 'positive' ? 'border-l-4 border-teal-400' : 'border-l-4 border-amber-400'">
      <div class="p-4 border-b flex justify-between items-center" 
           :class="currentMood && currentMood.moodType === 'positive' ? 'bg-teal-50' : 'bg-amber-50'">
        <h2 class="text-lg font-semibold flex items-center">
          <span class="mr-2">{{ currentMood && currentMood.moodType === 'positive' ? '✨' : '🔍' }}</span>
          {{ currentMood && currentMood.moodType === 'positive' ? '美好时刻分析' : '情绪洞察分析' }}
        </h2>
        <button @click="close" class="text-gray-500 hover:text-gray-700">
          <span class="text-xl">×</span>
        </button>
      </div>
      
      <div class="p-6 overflow-y-auto">
        <div v-if="isAISupported === false" class="text-center py-10">
          <svg xmlns="http://www.w3.org/2000/svg" class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 class="mt-2 text-sm font-medium text-gray-900">AI功能不可用</h3>
          <p class="mt-1 text-sm text-gray-500">此设备或环境不支持AI功能。</p>
        </div>
        
        <div v-else-if="isLoading" class="flex justify-center items-center py-10">
          <div class="loading-spinner"></div>
          <span class="ml-3 text-gray-600">正在分析中...</span>
        </div>
        
        <div v-else-if="analysis" class="prose max-w-none">
          <div class="space-y-6">
            <!-- 将HTML内容拆分为多个卡片展示 -->
            <div v-if="analysis.includes('<div')" v-html="analysis" class="space-y-6"></div>
            <!-- 兼容纯文本内容 -->
            <div v-else>
              <div class="bg-white/60 p-4 rounded-lg shadow-sm mb-4">
                <p class="whitespace-pre-line">{{ analysis }}</p>
              </div>
            </div>
          </div>
        </div>
        
        <div v-else class="text-center py-10">
          <p class="text-gray-500">暂无分析结果</p>
        </div>
      </div>
      
      <div class="p-4 border-t bg-gray-50 flex justify-between">
        <button 
          @click="regenerateAnalysis" 
          class="btn btn-secondary flex items-center"
          :disabled="isLoading || !isAISupported"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd" />
          </svg>
          重新生成
        </button>
        
        <button @click="close" class="btn btn-primary">
          关闭
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.loading-spinner {
  border: 3px solid rgba(0, 0, 0, 0.1);
  border-radius: 50%;
  border-top: 3px solid #3498db;
  width: 24px;
  height: 24px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.btn {
  @apply px-4 py-2 rounded-lg transition-all duration-200 text-sm font-medium;
}

.btn-primary {
  @apply bg-blue-600 text-white hover:bg-blue-700;
}

.btn-secondary {
  @apply bg-gray-200 text-gray-700 hover:bg-gray-300;
}

.btn-outline {
  @apply border border-gray-300 text-gray-700 hover:bg-gray-50;
}

.btn:disabled {
  @apply opacity-50 cursor-not-allowed;
}
</style> 