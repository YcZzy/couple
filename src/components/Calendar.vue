<script setup>
import { ref, computed, onMounted } from 'vue';
import { useArgumentStore } from '../stores/argument';
import dayjs from 'dayjs';

const emit = defineEmits(['navigate']);
const store = useArgumentStore();
const currentMonth = ref(dayjs().month());
const currentYear = ref(dayjs().year());
const currentDate = ref(new Date());

// 随机温馨语录
const calendarQuotes = [
  "每一天的记忆，都是你们爱的印记～",
  "时光流转，美好永存～",
  "点滴故事，编织你们的爱情画卷～",
  "珍藏每一个共同经历的瞬间～",
  "让日历记录下你们的甜蜜足迹～"
];
const randomQuote = calendarQuotes[Math.floor(Math.random() * calendarQuotes.length)];

// 日期格式化
const formattedDate = computed(() => {
  const options = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
  return currentDate.value.toLocaleDateString('zh-CN', options);
});

onMounted(() => {
  store.initializeStore();
});

// 获取当前月的日历数据
const calendarDays = computed(() => {
  const firstDayOfMonth = dayjs(new Date(currentYear.value, currentMonth.value, 1));
  const daysInMonth = firstDayOfMonth.daysInMonth();
  const dayOfWeek = firstDayOfMonth.day(); // 0-6, 0 is Sunday
  
  // 创建日历网格
  const days = [];
  
  // 前一个月的尾部日期
  const prevMonthDays = dayOfWeek === 0 ? 0 : dayOfWeek;
  const prevMonth = dayjs(new Date(currentYear.value, currentMonth.value, 0));
  const prevMonthTotalDays = prevMonth.daysInMonth();
  
  for (let i = prevMonthDays - 1; i >= 0; i--) {
    days.push({
      date: dayjs(new Date(currentYear.value, currentMonth.value - 1, prevMonthTotalDays - i)),
      isCurrentMonth: false,
      arguments: []
    });
  }
  
  // 当前月的日期
  for (let i = 1; i <= daysInMonth; i++) {
    const currentDate = dayjs(new Date(currentYear.value, currentMonth.value, i));
    const dateString = currentDate.format('YYYY-MM-DD');
    
    // 找出当天的记录
    const dayArguments = store.argumentList.filter(arg => {
      const argDate = dayjs(arg.date).format('YYYY-MM-DD');
      return argDate === dateString;
    });
    
    days.push({
      date: currentDate,
      isCurrentMonth: true,
      arguments: dayArguments
    });
  }
  
  // 下一个月的开始日期以填满网格
  const totalDaysInCalendar = Math.ceil(days.length / 7) * 7;
  const nextMonthDays = totalDaysInCalendar - days.length;
  
  for (let i = 1; i <= nextMonthDays; i++) {
    days.push({
      date: dayjs(new Date(currentYear.value, currentMonth.value + 1, i)),
      isCurrentMonth: false,
      arguments: []
    });
  }
  
  return days;
});

// 格式化月份名称
const currentMonthName = computed(() => {
  return dayjs(new Date(currentYear.value, currentMonth.value)).format('YYYY年MM月');
});

// 前一个月
const prevMonth = () => {
  if (currentMonth.value === 0) {
    currentMonth.value = 11;
    currentYear.value--;
  } else {
    currentMonth.value--;
  }
};

// 后一个月
const nextMonth = () => {
  if (currentMonth.value === 11) {
    currentMonth.value = 0;
    currentYear.value++;
  } else {
    currentMonth.value++;
  }
};

// 跳转到详情
const navigateToDetail = (id) => {
  emit('navigate', 'argument-detail', id);
};

// 获取情绪强度的样式类
const getSeverityClass = (severity) => {
  switch (severity) {
    case 1: return 'bg-yellow-300';
    case 2: return 'bg-orange-300';
    case 3: return 'bg-red-300';
    default: return 'bg-gray-300';
  }
};

// 获取当天记录的数量
const getDayArgumentCount = (day) => {
  return day.arguments.length;
};

// 获取日期的状态表情
const getDayEmoji = (day) => {
  if (!day.isCurrentMonth) return '';
  if (day.arguments.length === 0) return '';
  
  // 检查是否全部已解决
  const allResolved = day.arguments.every(arg => arg.status === 'resolved');
  if (allResolved) return '✨';
  
  // 检查严重程度
  const hasSevere = day.arguments.some(arg => arg.severity === 3);
  if (hasSevere) return '💭';
  
  return '🌱';
};

// 获取日期的心情颜色
const getDayMoodClass = (day) => {
  if (!day.isCurrentMonth || day.arguments.length === 0) return '';
  
  // 检查是否全部已解决
  const allResolved = day.arguments.every(arg => arg.status === 'resolved');
  if (allResolved) return 'bg-gradient-to-br from-green-50 to-teal-50 border-green-100';
  
  // 检查严重程度
  const hasSevere = day.arguments.some(arg => arg.severity === 3);
  if (hasSevere) return 'bg-gradient-to-br from-amber-50 to-red-50 border-amber-100';
  
  return 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-100';
};

// 今天
const today = dayjs().format('YYYY-MM-DD');

// 当月记录总数
const currentMonthRecordCount = computed(() => {
  return calendarDays.value
    .filter(day => day.isCurrentMonth)
    .reduce((total, day) => total + day.arguments.length, 0);
});

// 当月已解决记录数
const currentMonthResolvedCount = computed(() => {
  return calendarDays.value
    .filter(day => day.isCurrentMonth)
    .reduce((total, day) => {
      return total + day.arguments.filter(arg => arg.status === 'resolved').length;
    }, 0);
});
</script>

<template>
  <div class="space-y-8">
    <!-- 顶部区域 -->
    <div class="rounded-3xl bg-gradient-to-br from-indigo-50/80 to-pink-50/80 p-6 shadow-sm border border-indigo-100/50">
      <div class="flex flex-col md:flex-row md:items-center justify-between">
        <div>
          <h1 class="text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-pink-500 bg-clip-text text-transparent flex items-center">
            <span class="text-3xl mr-3 float-animation inline-block">📅</span>
            美好时光
          </h1>
          <p class="text-gray-600 mt-1">{{ formattedDate }}</p>
          <p class="text-indigo-600 mt-3 italic">"{{ randomQuote }}"</p>
        </div>
        <div class="mt-6 md:mt-0 text-center">
          <div class="py-1 px-4 bg-white/50 backdrop-blur-sm rounded-full text-sm text-indigo-600">
            本月记录: {{ currentMonthRecordCount }} 条 / 已解决: {{ currentMonthResolvedCount }} 条
          </div>
        </div>
      </div>
    </div>
    
    <div class="card bg-white/90 p-0 overflow-hidden border-0 shadow-sm">
      <!-- 日历头部 -->
      <div class="p-5 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-indigo-100/50">
        <button @click="prevMonth" class="p-2 rounded-full hover:bg-white/70 transition-colors duration-200 flex items-center">
          <span class="text-lg mr-1">⬅️</span>
          <span class="text-indigo-600">上个月</span>
        </button>
        <h2 class="text-xl font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{{ currentMonthName }}</h2>
        <button @click="nextMonth" class="p-2 rounded-full hover:bg-white/70 transition-colors duration-200 flex items-center">
          <span class="text-indigo-600">下个月</span>
          <span class="text-lg ml-1">➡️</span> 
        </button>
      </div>
      
      <!-- 星期头 -->
      <div class="grid grid-cols-7 text-center border-b border-gray-100 py-3 px-4 bg-white/80">
        <div class="text-sm font-medium text-red-400">周日</div>
        <div class="text-sm font-medium text-gray-500">周一</div>
        <div class="text-sm font-medium text-gray-500">周二</div>
        <div class="text-sm font-medium text-gray-500">周三</div>
        <div class="text-sm font-medium text-gray-500">周四</div>
        <div class="text-sm font-medium text-gray-500">周五</div>
        <div class="text-sm font-medium text-blue-400">周六</div>
      </div>
      
      <!-- 日历主体 -->
      <div class="grid grid-cols-7 gap-1 p-1 bg-gray-50/50">
        <div 
          v-for="(day, index) in calendarDays" 
          :key="index"
          :class="[
            'min-h-[110px] p-2 rounded-lg border transition-all duration-200',
            !day.isCurrentMonth ? 'opacity-40 bg-white/50 border-transparent' : 'hover:shadow-sm ' + getDayMoodClass(day),
            day.date.format('YYYY-MM-DD') === today ? 'ring-2 ring-indigo-300' : ''
          ]"
        >
          <div class="flex justify-between items-start">
            <span :class="[
              'inline-flex justify-center items-center w-7 h-7 rounded-full text-sm',
              day.date.format('YYYY-MM-DD') === today ? 'bg-indigo-500 text-white' : 
              day.date.day() === 0 ? 'text-red-500' :
              day.date.day() === 6 ? 'text-blue-500' : 'text-gray-700'
            ]">
              {{ day.date.date() }}
            </span>
            <div class="flex space-x-1">
              <span v-if="getDayEmoji(day)" class="text-lg">{{ getDayEmoji(day) }}</span>
              <span 
                v-if="getDayArgumentCount(day) > 0" 
                class="px-1.5 py-0.5 text-xs bg-white/70 backdrop-blur-sm rounded-full text-indigo-600 font-medium"
              >
                {{ getDayArgumentCount(day) }}
              </span>
            </div>
          </div>
          
          <!-- 心情记录 -->
          <div class="mt-2 space-y-1.5">
            <div 
              v-for="arg in day.arguments" 
              :key="arg.id"
              class="flex items-center text-xs cursor-pointer hover:bg-white/80 p-1.5 rounded-lg transition-all duration-200 border border-transparent hover:border-indigo-100/50 hover:shadow-sm"
              @click="navigateToDetail(arg.id)"
            >
              <div class="flex items-center flex-1 min-w-0">
                <div 
                  :class="[getSeverityClass(arg.severity), 'w-2 h-2 rounded-full mr-1.5']"
                ></div>
                <span class="truncate text-gray-700">
                  {{ store.categories.find(c => c.id === arg.category)?.name || arg.category }}
                </span>
              </div>
              <span 
                :class="{
                  'ml-1 w-2 h-2 rounded-full': true,
                  'bg-teal-300': arg.status === 'resolved',
                  'bg-amber-300': arg.status === 'ongoing'
                }"
              ></span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 图例 -->
      <div class="p-4 border-t border-gray-100 bg-white/90 flex flex-wrap gap-4 justify-center">
        <div class="flex items-center text-xs">
          <div class="w-2 h-2 rounded-full bg-yellow-300 mr-1.5"></div>
          <span class="text-gray-600">轻微情绪</span>
        </div>
        <div class="flex items-center text-xs">
          <div class="w-2 h-2 rounded-full bg-orange-300 mr-1.5"></div>
          <span class="text-gray-600">中等情绪</span>
        </div>
        <div class="flex items-center text-xs">
          <div class="w-2 h-2 rounded-full bg-red-300 mr-1.5"></div>
          <span class="text-gray-600">强烈情绪</span>
        </div>
        <div class="flex items-center text-xs">
          <div class="w-2 h-2 rounded-full bg-teal-300 mr-1.5"></div>
          <span class="text-gray-600">已解决</span>
        </div>
        <div class="flex items-center text-xs">
          <div class="w-2 h-2 rounded-full bg-amber-300 mr-1.5"></div>
          <span class="text-gray-600">正在面对</span>
        </div>
      </div>
    </div>
  </div>
</template> 