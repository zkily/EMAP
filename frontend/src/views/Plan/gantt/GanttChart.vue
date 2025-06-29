<template>
  <div class="gantt-wrapper">
    <!-- 图例 -->
    <div class="legend">
      <span v-for="[label, colorIdx] in colorLegendList" :key="label" class="legend-item"
        :style="{ backgroundColor: colorPalette[colorIdx] }" :title="label">
        🎨 {{ label }}
      </span>
    </div>

    <!-- 甘特图容器 -->
    <div ref="container" class="gantt-container" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { Timeline } from 'vis-timeline'
import { DataSet } from 'vis-data'
import 'vis-timeline/styles/vis-timeline-graph2d.min.css'

const props = defineProps<{
  items: any[]
  groups?: any[]
  zoomLevel?: 'hour' | 'day'
}>()
const emit = defineEmits(['change', 'edit', 'create'])

const container = ref<HTMLDivElement | null>(null)
let timeline: Timeline | null = null
let itemsDataSet: DataSet<any> | null = null
let groupsDataSet: DataSet<any> | undefined = undefined

// 色彩配置
const colorPalette = [
  '#1abc9c', '#3498db', '#9b59b6', '#f39c12', '#e74c3c',
  '#2ecc71', '#e67e22', '#2980b9', '#8e44ad', '#16a085'
]
const MAX_COLORS = colorPalette.length

// 根据工程名或产品名分配颜色
const colorMap = ref(new Map<string, number>())
let colorIndex = 0

// 图例内容
const colorLegendList = computed(() => Array.from(colorMap.value.entries()))

// 格式化条形图数据
function formatItems(items: any[]) {
  const map = new Map(colorMap.value)

  return items.map(item => {
    const key = item.process_name || item.product_name || 'default'
    if (!map.has(key)) {
      map.set(key, colorIndex++ % MAX_COLORS)
    }
    const colorClass = map.get(key)!
    colorMap.value = map

    return {
      ...item,
      content: `
        <div style="white-space: nowrap; font-size: 13px;">
          📦 <strong>${item.product_name || ''}</strong><br/>
          🛠 ${item.device_name} / 🔢 ${item.quantity || 0}個
        </div>
      `,
      title: `📦 ${item.product_name}\n🛠 ${item.device_name}\n📋 工程: ${item.process_name}\n数量: ${item.quantity}`,
      className: `color-class-${colorClass}`
    }
  })
}

function updateTimeline() {
  if (!timeline || !itemsDataSet) return
  itemsDataSet.clear()
  itemsDataSet.add(formatItems(props.items))
  if (groupsDataSet && props.groups) {
    groupsDataSet.clear()
    groupsDataSet.add(props.groups)
  }
}

onMounted(() => {
  if (!container.value) return

  itemsDataSet = new DataSet(formatItems(props.items))
  groupsDataSet = props.groups ? new DataSet(props.groups) : undefined

  const options = {
    stack: false,
    groupOrder: 'content',
    // groupOrderSwap: true,
    groupTemplate: (group: any) =>
      `<span style="font-weight: bold; font-size: 13px;">${group.content}</span>`,
    groupNestedGroups: true,
    groupHeightMode: 'auto' as const,
    showMajorLabels: true,
    showCurrentTime: true,
    margin: { item: 10, axis: 5 },
    orientation: 'top',
    timeAxis: {
      scale: props.zoomLevel || 'hour',
      step: 1
    },
    tooltip: {
      followMouse: true,
      overflowMethod: 'cap' as const
    },
    zoomKey: 'ctrlKey' as const
  }

  timeline = groupsDataSet
    ? new Timeline(container.value, itemsDataSet, groupsDataSet, options)
    : new Timeline(container.value, itemsDataSet, options)

  timeline.on('change', props => emit('change', props))

  timeline.on('doubleClick', e => {
    if (e.item && itemsDataSet) {
      emit('edit', itemsDataSet.get(e.item))
    }
  })

  timeline.on('itemAdd', ((item: any, callback: (arg0: null) => void) => {
    emit('create', { start: item.start, group: item.group })
    callback(null)
  }) as any)
})

watch(() => props.items, updateTimeline)
watch(() => props.groups, updateTimeline)
watch(() => props.zoomLevel, (val) => {
  if (timeline && val) {
    timeline.setOptions({ timeAxis: { scale: val, step: 1 } })
  }
})

onUnmounted(() => {
  timeline?.destroy()
})
</script>

<style scoped>
.gantt-wrapper {
  width: 100%;
}

.gantt-container {
  width: 100%;
  height: 600px;
  border: 1px solid #ccc;
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-top: 12px;
  overflow-x: auto;
}

/* 图例样式 */
.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 10px;
  font-size: 13px;
  align-items: center;
}

.legend-item {
  color: #fff;
  padding: 5px 12px;
  border-radius: 4px;
  font-weight: bold;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.15);
}

/* 条形图颜色类（按工程/产品分配） */
.color-class-0 .vis-item-content {
  background-color: #1abc9c !important;
  color: #fff;
}

.color-class-1 .vis-item-content {
  background-color: #3498db !important;
  color: #fff;
}

.color-class-2 .vis-item-content {
  background-color: #9b59b6 !important;
  color: #fff;
}

.color-class-3 .vis-item-content {
  background-color: #f39c12 !important;
  color: #fff;
}

.color-class-4 .vis-item-content {
  background-color: #e74c3c !important;
  color: #fff;
}

.color-class-5 .vis-item-content {
  background-color: #2ecc71 !important;
  color: #fff;
}

.color-class-6 .vis-item-content {
  background-color: #e67e22 !important;
  color: #fff;
}

.color-class-7 .vis-item-content {
  background-color: #2980b9 !important;
  color: #fff;
}

.color-class-8 .vis-item-content {
  background-color: #8e44ad !important;
  color: #fff;
}

.color-class-9 .vis-item-content {
  background-color: #16a085 !important;
  color: #fff;
}

/* 条形图内容样式 */
.vis-item .vis-item-content {
  font-size: 12px;
  line-height: 1.3;
  padding: 4px 6px;
  border-radius: 4px;
  white-space: normal;
}
</style>
