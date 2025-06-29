<template>
  <div class="chart-container">
    <v-chart :option="chartOption" autoresize style="height: 400px" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { use } from 'echarts/core'
import VChart from 'vue-echarts'
import {
  LineChart
} from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  GridComponent,
  DatasetComponent,
  LegendComponent,
  DataZoomComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'

use([
  LineChart,
  TitleComponent,
  TooltipComponent,
  GridComponent,
  DatasetComponent,
  LegendComponent,
  DataZoomComponent,
  CanvasRenderer
])

interface StockTrendRow {
  date: string
  product_cd: string
  product_name?: string
  差引累計: number
}

const props = defineProps<{ data: StockTrendRow[]; warningLevel?: number }>()

const chartOption = computed(() => {
  const seriesMap: Record<string, { positive: any[]; negative: any[]; fullLabel: string }> = {}
  const dates = new Set<string>()

  for (const row of props.data) {
    const date = row.date.slice(0, 10)
    dates.add(date)

    const label = row.product_name
      ? `${row.product_cd}｜${row.product_name}`
      : row.product_cd

    if (!seriesMap[label]) {
      seriesMap[label] = {
        fullLabel: label,
        positive: [],
        negative: []
      }
    }

    if (row.差引累計 < 0) {
      seriesMap[label].positive.push(null)
      seriesMap[label].negative.push(row.差引累計)
    } else {
      seriesMap[label].positive.push(row.差引累計)
      seriesMap[label].negative.push(null)
    }
  }

  const series: any[] = []
  const legendLabels: string[] = []

  for (const key in seriesMap) {
    const { fullLabel, positive, negative } = seriesMap[key]

    legendLabels.push(fullLabel)

    series.push({
      name: fullLabel,
      type: 'line',
      smooth: true,
      data: positive,
      label: { show: true, position: 'top', fontSize: 10 }
    })

    series.push({
      name: `${fullLabel}（マイナス）`,
      type: 'line',
      smooth: true,
      data: negative,
      lineStyle: { color: 'red', type: 'solid' },
      itemStyle: { color: 'red' },
      label: { show: true, position: 'top', fontSize: 10, color: 'red' },
      // ✅ 不显示图例
      showSymbol: true,
      emphasis: { disabled: true },
      legendHoverLink: false
    })
  }

  return {
    tooltip: {
      trigger: 'axis',
      formatter: (params: any[]) => {
        const date = params[0]?.axisValueLabel
        let content = `📅 <b>${date}</b><br/>`

        for (const item of params) {
          if (item.seriesName.endsWith('（マイナス）')) continue

          const isNegative = item.data < 0
          const valueDisplay = isNegative
            ? `<span style="color:red"><b>${item.data}</b></span> 個`
            : `<b>${item.data}</b> 個`

          content += `📦 <span style="color:${item.color}">●</span> ${item.seriesName}: ${valueDisplay}<br/>`
        }

        if (props.warningLevel !== undefined) {
          content += `<br/>⚠️ <span style="color:red">警告ライン：${props.warningLevel}（安全在庫）</span>`
        }

        return content
      }
    },
    legend: {
      data: legendLabels
    },
    xAxis: {
      type: 'category',
      data: Array.from(dates)
    },
    yAxis: {
      type: 'value',
      name: '在庫数量'
    },
    dataZoom: [
      {
        type: 'slider',
        show: true,
        xAxisIndex: 0,
        height: 20,
        bottom: 0
      },
      {
        type: 'inside',
        xAxisIndex: 0
      }
    ],
    series
  }
})
</script>


<style scoped>
.chart-container {
  width: 100%;
}
</style>
