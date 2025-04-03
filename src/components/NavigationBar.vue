<script setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  currentRoute: String
});

const emit = defineEmits(['navigate']);

const navItems = [
  { code: 'dashboard', name: '我们的空间', icon: '❤️' },
  { code: 'argument', name: '心情笔记', icon: '📝' },
  { code: 'rewards', name: '甜蜜奖励', icon: '🎁' },
  { code: 'analytics', name: '成长旅程', icon: '🌱' },
  { code: 'calendar', name: '美好时光', icon: '📅' }
];

const navigate = (route) => {
  emit('navigate', route);
};
</script>

<template>
  <nav class="bg-white/70 backdrop-blur-sm border-b border-teal-100/50">
    <div class="container mx-auto px-6 py-2">
      <div class="flex justify-between items-center">
        <div class="flex items-center">
          <div class="flex items-center py-3">
            <span class="font-bold text-xl bg-gradient-to-r from-teal-500 to-sky-500 bg-clip-text text-transparent flex items-center">
              <span class="text-2xl mr-2">💞</span> 爱的港湾
            </span>
          </div>
          
          <div class="hidden md:flex space-x-8 ml-10">
            <a v-for="item in navItems" :key="item.code" href="#"
               :class="['px-3 py-4 text-sm font-medium transition-all duration-300 flex items-center', 
                       props.currentRoute === item.code 
                       ? 'text-teal-600 border-b-2 border-teal-400 translate-y-0' 
                       : 'text-gray-500 hover:text-teal-500 hover:-translate-y-1']"
               @click.prevent="navigate(item.code)">
              <span class="mr-2 text-lg">{{ item.icon }}</span>
              {{ item.name }}
            </a>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 移动端导航 -->
    <div class="md:hidden bg-white/80 border-t border-teal-100/50">
      <div class="grid grid-cols-5 text-center">
        <a v-for="item in navItems" :key="item.code" href="#"
           :class="['py-2 transition-colors duration-300 flex flex-col items-center', 
                   props.currentRoute === item.code 
                   ? 'text-teal-600' 
                   : 'text-gray-500 hover:text-teal-500']"
           @click.prevent="navigate(item.code)">
          <span class="text-xl mb-1">{{ item.icon }}</span>
          <span class="text-xs font-medium">{{ item.name }}</span>
        </a>
      </div>
    </div>
  </nav>
</template> 