<script setup>
import { defineProps, computed } from 'vue';

const props = defineProps({
  title: {
    type: String,
    required: true
  },
  value: {
    type: [String, Number],
    required: true
  },
  trend: {
    type: String,
    default: 'neutral' // up, down, neutral
  }
});

// 根据卡片类型显示不同图标
const cardIcon = computed(() => {
  if (props.title.includes('甜蜜')) return '💖';
  if (props.title.includes('经历')) return '🌈';
  if (props.title.includes('面对')) return '🌱';
  return '✨';
});
</script>

<template>
  <div class="relative overflow-hidden bg-white/80 rounded-2xl shadow-sm p-6 border border-teal-50 hover:shadow hover:bg-white/90 transition-all duration-300 group">
    <!-- 装饰元素 -->
    <div class="absolute -right-6 -top-6 w-16 h-16 bg-teal-50 rounded-full opacity-40 group-hover:scale-125 transition-transform duration-500"></div>
    <div class="absolute -right-4 -bottom-4 w-12 h-12 bg-blue-50 rounded-full opacity-40 group-hover:scale-110 transition-transform duration-700 delay-100"></div>
    
    <!-- 卡片内容 -->
    <div class="relative">
      <div class="flex items-center mb-2">
        <span class="text-2xl mr-2">{{ cardIcon }}</span>
        <h3 class="text-sm font-medium text-gray-500">{{ title }}</h3>
      </div>
      <div class="mt-2 flex items-baseline">
        <div class="text-2xl font-semibold bg-gradient-to-r from-teal-600 to-sky-600 bg-clip-text text-transparent">{{ value }}</div>
        <div v-if="trend !== 'neutral'" class="ml-3 flex items-baseline text-sm font-semibold">
          <span 
            :class="[
              trend === 'up' ? 'text-emerald-400' : 'text-rose-400',
              'inline-flex items-center'
            ]"
          >
            <span v-if="trend === 'up'" class="transform transition-transform group-hover:-translate-y-1">↑</span>
            <span v-else class="transform transition-transform group-hover:translate-y-1">↓</span>
          </span>
        </div>
      </div>
    </div>
  </div>
</template> 