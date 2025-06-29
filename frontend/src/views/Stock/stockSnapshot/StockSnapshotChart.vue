<template>
  <div class="chart-wrapper">
    <div class="chart-header">
      <h3>📊 製品在庫数量推移</h3>
      <el-button type="info" size="small" @click="printChart">🖨️ 印刷</el-button>
    </div>
    <v-chart v-if="props.data.length" :option="chartOption" autoresize ref="chartRef" class="chart-area" />
    <el-empty v-else description="データなし" />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { use } from 'echarts/core'
import VChart from 'vue-echarts'
import { LineChart } from 'echarts/charts'
import { TitleComponent, TooltipComponent, GridComponent, LegendComponent, DataZoomComponent, MarkPointComponent, MarkLineComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

use([
  LineChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  LegendComponent,
  DataZoomComponent,
  MarkPointComponent,
  MarkLineComponent,
  CanvasRenderer
])

const props = defineProps<{
  data: { date: string; quantity: number }[]
}>()

const chartRef = ref()

const chartOption = computed(() => ({
  title: {

    left: 'right',
    textStyle: { fontSize: 18, fontWeight: 'bold' }
  },
  tooltip: {
    trigger: 'axis',
    formatter: (params: any[]) => {
      const p = params[0]
      return `${p.axisValue}<br/>数量: ${p.data.toLocaleString()}`
    }
  },
  legend: {
    top: '5%',
    left: 'center'
  },
  grid: {
    left: '3%', right: '4%', bottom: '8%', containLabel: true
  },
  xAxis: {
    type: 'category',
    boundaryGap: false,
    data: props.data.map(d => d.date),
    axisLabel: { fontSize: 12, rotate: 45 }
  },
  yAxis: {
    type: 'value',
    name: '数量',
    axisLabel: { fontSize: 12 }
  },
  dataZoom: [
    { type: 'slider', start: 0, end: 100 },
    { type: 'inside', start: 0, end: 100 }
  ],
  series: [{
    name: '数量',
    type: 'line',
    smooth: true,
    lineStyle: { width: 2 },
    itemStyle: { color: '#409EFF' },
    areaStyle: {
      color: {
        type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
        colorStops: [
          { offset: 0, color: '#409EFF' },
          { offset: 1, color: '#fff' }
        ]
      },
      opacity: 0.3
    },
    data: props.data.map(d => d.quantity),
    markPoint: {
      data: [{ type: 'max', name: '最大' }, { type: 'min', name: '最小' }]
    },
    markLine: {
      data: [{ type: 'average', name: '平均' }]
    }
  }]
}))

const printChart = () => {
  const chartDom = chartRef.value?.$el?.querySelector('canvas')
  if (!chartDom) return

  const printWindow = window.open('', '', 'width=800,height=600')
  if (!printWindow) return

  const imgData = chartDom.toDataURL()
  printWindow.document.write(`
    <html>
      <head>
        <title>在庫数量推移チャート印刷</title>
      </head>
      <body style="text-align:center; margin:0;">
        <h3>📊 製品在庫数量推移</h3>
        <img src="${imgData}" style="max-width:100%; height:auto;" />
      </body>
    </html>
  `)
  printWindow.document.close()
  printWindow.print()
}
</script>

<style scoped>
.chart-wrapper {
  margin-top: 16px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.chart-area {
  width: 100%;
  height: 400px;
}
</style>
