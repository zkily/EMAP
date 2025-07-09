<template>
  <div class="performance-management">
    <div class="performance-header">
      <h3>{{ supplierData.supplier_name }} のパフォーマンス管理</h3>
      <p class="supplier-info">仕入先CD: {{ supplierData.supplier_cd }}</p>
    </div>

    <!-- 期间选择 -->
    <div class="period-selector">
      <el-row :gutter="20" align="middle">
        <el-col :span="8">
          <el-date-picker
            v-model="dateRange"
            type="monthrange"
            range-separator="～"
            start-placeholder="開始月"
            end-placeholder="終了月"
            format="yyyy年MM月"
            value-format="yyyy-MM"
            @change="loadPerformanceData"
          ></el-date-picker>
        </el-col>
        <el-col :span="4">
          <el-button type="primary" @click="loadPerformanceData">更新</el-button>
        </el-col>
        <el-col :span="12">
          <div class="quick-periods">
            <el-button size="small" @click="setQuickPeriod('current')">今月</el-button>
            <el-button size="small" @click="setQuickPeriod('last3')">過去3ヶ月</el-button>
            <el-button size="small" @click="setQuickPeriod('last6')">過去6ヶ月</el-button>
            <el-button size="small" @click="setQuickPeriod('last12')">過去12ヶ月</el-button>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- KPI概览 -->
    <div class="kpi-overview">
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="kpi-card otd">
            <div class="kpi-icon">
              <i class="el-icon-time"></i>
            </div>
            <div class="kpi-content">
              <div class="kpi-value">{{ performanceData.otd_rate }}%</div>
              <div class="kpi-label">OTD率（納期遵守率）</div>
              <div class="kpi-trend" :class="getTrendClass(performanceData.otd_trend)">
                <i :class="getTrendIcon(performanceData.otd_trend)"></i>
                {{ Math.abs(performanceData.otd_trend) }}%
              </div>
            </div>
          </div>
        </el-col>

        <el-col :span="6">
          <div class="kpi-card quality">
            <div class="kpi-icon">
              <i class="el-icon-medal"></i>
            </div>
            <div class="kpi-content">
              <div class="kpi-value">{{ performanceData.quality_ppm }}</div>
              <div class="kpi-label">品質PPM</div>
              <div class="kpi-trend" :class="getTrendClass(-performanceData.quality_trend)">
                <i :class="getTrendIcon(-performanceData.quality_trend)"></i>
                {{ Math.abs(performanceData.quality_trend) }}
              </div>
            </div>
          </div>
        </el-col>

        <el-col :span="6">
          <div class="kpi-card delivery">
            <div class="kpi-icon">
              <i class="el-icon-truck"></i>
            </div>
            <div class="kpi-content">
              <div class="kpi-value">{{ performanceData.delivery_accuracy }}%</div>
              <div class="kpi-label">納品精度</div>
              <div class="kpi-trend" :class="getTrendClass(performanceData.delivery_trend)">
                <i :class="getTrendIcon(performanceData.delivery_trend)"></i>
                {{ Math.abs(performanceData.delivery_trend) }}%
              </div>
            </div>
          </div>
        </el-col>

        <el-col :span="6">
          <div class="kpi-card cost">
            <div class="kpi-icon">
              <i class="el-icon-money"></i>
            </div>
            <div class="kpi-content">
              <div class="kpi-value">{{ performanceData.cost_performance }}%</div>
              <div class="kpi-label">コストパフォーマンス</div>
              <div class="kpi-trend" :class="getTrendClass(performanceData.cost_trend)">
                <i :class="getTrendIcon(performanceData.cost_trend)"></i>
                {{ Math.abs(performanceData.cost_trend) }}%
              </div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 图表区域 -->
    <div class="charts-section">
      <el-row :gutter="20">
        <el-col :span="12">
          <div class="chart-card">
            <h4>月別パフォーマンス推移</h4>
            <div ref="trendChart" class="chart-container"></div>
          </div>
        </el-col>
        <el-col :span="12">
          <div class="chart-card">
            <h4>品質分析</h4>
            <div ref="qualityChart" class="chart-container"></div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 详细数据表格 -->
    <div class="performance-table">
      <div class="table-header">
        <h4>詳細パフォーマンスデータ</h4>
        <div class="table-actions">
          <el-button size="small" @click="exportData">エクスポート</el-button>
          <el-button size="small" type="primary" @click="addPerformanceRecord">手動記録追加</el-button>
        </div>
      </div>

      <el-table
        :data="performanceRecords"
        v-loading="loading"
        border
        stripe
        style="width: 100%"
      >
        <el-table-column prop="period" label="期間" width="100">
          <template #default="scope">
            {{ formatPeriod(scope.row.period) }}
          </template>
        </el-table-column>

        <el-table-column prop="total_orders" label="総注文数" width="100" align="right"></el-table-column>

        <el-table-column prop="on_time_orders" label="定時納品" width="100" align="right"></el-table-column>

        <el-table-column prop="otd_rate" label="OTD率" width="100" align="right">
          <template #default="scope">
            <span :class="getPerformanceClass('otd', scope.row.otd_rate)">
              {{ scope.row.otd_rate }}%
            </span>
          </template>
        </el-table-column>

        <el-table-column prop="total_quantity" label="総数量" width="100" align="right"></el-table-column>

        <el-table-column prop="defect_quantity" label="不良数" width="100" align="right"></el-table-column>

        <el-table-column prop="quality_ppm" label="品質PPM" width="100" align="right">
          <template #default="scope">
            <span :class="getPerformanceClass('quality', scope.row.quality_ppm)">
              {{ scope.row.quality_ppm }}
            </span>
          </template>
        </el-table-column>

        <el-table-column prop="delivery_accuracy" label="納品精度" width="100" align="right">
          <template #default="scope">
            <span :class="getPerformanceClass('delivery', scope.row.delivery_accuracy)">
              {{ scope.row.delivery_accuracy }}%
            </span>
          </template>
        </el-table-column>

        <el-table-column prop="cost_variance" label="コスト差異" width="100" align="right">
          <template #default="scope">
            <span :class="scope.row.cost_variance >= 0 ? 'cost-over' : 'cost-under'">
              {{ scope.row.cost_variance > 0 ? '+' : '' }}{{ scope.row.cost_variance }}%
            </span>
          </template>
        </el-table-column>

        <el-table-column prop="overall_score" label="総合評価" width="100" align="center">
          <template #default="scope">
            <el-tag :type="getScoreType(scope.row.overall_score)" size="small">
              {{ getScoreGrade(scope.row.overall_score) }}
            </el-tag>
          </template>
        </el-table-column>

        <el-table-column prop="remarks" label="備考" min-width="150" show-overflow-tooltip></el-table-column>

        <el-table-column label="操作" width="120">
          <template #default="scope">
            <el-button size="small" @click="editRecord(scope.row)">編集</el-button>
            <el-button size="small" type="danger" @click="deleteRecord(scope.row)">削除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 绩效记录编辑对话框 -->
    <el-dialog
      :title="recordDialogTitle"
      :visible.sync="recordDialogVisible"
      width="60%"
    >
      <performance-record-form
        v-if="recordDialogVisible"
        :record-data="currentRecord"
        :supplier-data="supplierData"
        :mode="recordMode"
        @save="handleRecordSave"
        @cancel="recordDialogVisible = false"
      ></performance-record-form>
    </el-dialog>
  </div>
</template>

<script>
import * as echarts from 'echarts'
import { outsourcingApi } from '@/api/outsourcing'
import PerformanceRecordForm from './PerformanceRecordForm.vue'

export default {
  name: 'PerformanceManagement',
  components: {
    PerformanceRecordForm
  },
  props: {
    supplierData: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      loading: false,
      dateRange: [],
      performanceData: {
        otd_rate: 0,
        otd_trend: 0,
        quality_ppm: 0,
        quality_trend: 0,
        delivery_accuracy: 0,
        delivery_trend: 0,
        cost_performance: 0,
        cost_trend: 0
      },
      performanceRecords: [],
      trendChart: null,
      qualityChart: null,
      recordDialogVisible: false,
      recordMode: 'create',
      currentRecord: null
    }
  },
  computed: {
    recordDialogTitle() {
      return this.recordMode === 'create' ? 'パフォーマンス記録追加' : 'パフォーマンス記録編集'
    }
  },
  mounted() {
    this.initDateRange()
    this.loadPerformanceData()
    this.initCharts()
  },
  beforeDestroy() {
    if (this.trendChart) {
      this.trendChart.dispose()
    }
    if (this.qualityChart) {
      this.qualityChart.dispose()
    }
  },
  methods: {
    initDateRange() {
      const now = new Date()
      const endMonth = now.toISOString().slice(0, 7)
      const startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1)
      const startMonth = startDate.toISOString().slice(0, 7)
      this.dateRange = [startMonth, endMonth]
    },

    setQuickPeriod(period) {
      const now = new Date()
      const endMonth = now.toISOString().slice(0, 7)
      let startDate

      switch (period) {
        case 'current':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1)
          break
        case 'last3':
          startDate = new Date(now.getFullYear(), now.getMonth() - 2, 1)
          break
        case 'last6':
          startDate = new Date(now.getFullYear(), now.getMonth() - 5, 1)
          break
        case 'last12':
          startDate = new Date(now.getFullYear(), now.getMonth() - 11, 1)
          break
        default:
          return
      }

      const startMonth = startDate.toISOString().slice(0, 7)
      this.dateRange = [startMonth, endMonth]
      this.loadPerformanceData()
    },

    async loadPerformanceData() {
      if (!this.dateRange || this.dateRange.length !== 2) {
        return
      }

      this.loading = true
      try {
        const params = {
          supplier_id: this.supplierData.id,
          start_period: this.dateRange[0],
          end_period: this.dateRange[1]
        }

        // 获取绩效汇总数据
        const summaryResponse = await outsourcingApi.getSupplierPerformanceSummary(params)
        if (summaryResponse.success) {
          this.performanceData = {
            otd_rate: summaryResponse.data.otd_rate || 0,
            otd_trend: summaryResponse.data.otd_trend || 0,
            quality_ppm: summaryResponse.data.quality_ppm || 0,
            quality_trend: summaryResponse.data.quality_trend || 0,
            delivery_accuracy: summaryResponse.data.delivery_accuracy || 0,
            delivery_trend: summaryResponse.data.delivery_trend || 0,
            cost_performance: summaryResponse.data.cost_performance || 0,
            cost_trend: summaryResponse.data.cost_trend || 0
          }
        }

        // 获取详细记录
        const recordsResponse = await outsourcingApi.getSupplierPerformanceRecords(params)
        if (recordsResponse.success) {
          this.performanceRecords = recordsResponse.data
        }

        this.updateCharts()
      } catch (error) {
        console.error('パフォーマンスデータ取得エラー:', error)
        this.$message.error('パフォーマンスデータの取得に失敗しました')
      } finally {
        this.loading = false
      }
    },

    initCharts() {
      this.trendChart = echarts.init(this.$refs.trendChart)
      this.qualityChart = echarts.init(this.$refs.qualityChart)
    },

    updateCharts() {
      if (!this.trendChart || !this.qualityChart) return

      // 趋势图
      const trendOption = {
        tooltip: {
          trigger: 'axis'
        },
        legend: {
          data: ['OTD率', '納品精度', 'コストパフォーマンス']
        },
        xAxis: {
          type: 'category',
          data: this.performanceRecords.map(record => this.formatPeriod(record.period))
        },
        yAxis: {
          type: 'value',
          min: 0,
          max: 100,
          axisLabel: {
            formatter: '{value}%'
          }
        },
        series: [
          {
            name: 'OTD率',
            type: 'line',
            data: this.performanceRecords.map(record => record.otd_rate),
            smooth: true
          },
          {
            name: '納品精度',
            type: 'line',
            data: this.performanceRecords.map(record => record.delivery_accuracy),
            smooth: true
          },
          {
            name: 'コストパフォーマンス',
            type: 'line',
            data: this.performanceRecords.map(record => 100 + record.cost_variance),
            smooth: true
          }
        ]
      }

      // 质量分析图
      const qualityOption = {
        tooltip: {
          trigger: 'axis'
        },
        legend: {
          data: ['品質PPM', '不良率']
        },
        xAxis: {
          type: 'category',
          data: this.performanceRecords.map(record => this.formatPeriod(record.period))
        },
        yAxis: [
          {
            type: 'value',
            name: 'PPM',
            position: 'left'
          },
          {
            type: 'value',
            name: '不良率(%)',
            position: 'right'
          }
        ],
        series: [
          {
            name: '品質PPM',
            type: 'bar',
            data: this.performanceRecords.map(record => record.quality_ppm),
            yAxisIndex: 0
          },
          {
            name: '不良率',
            type: 'line',
            data: this.performanceRecords.map(record =>
              record.total_quantity > 0 ? (record.defect_quantity / record.total_quantity * 100).toFixed(2) : 0
            ),
            yAxisIndex: 1,
            smooth: true
          }
        ]
      }

      this.trendChart.setOption(trendOption)
      this.qualityChart.setOption(qualityOption)
    },

    addPerformanceRecord() {
      this.currentRecord = null
      this.recordMode = 'create'
      this.recordDialogVisible = true
    },

    editRecord(record) {
      this.currentRecord = { ...record }
      this.recordMode = 'edit'
      this.recordDialogVisible = true
    },

    async deleteRecord(record) {
      try {
        await this.$confirm('この記録を削除しますか？', '確認', {
          confirmButtonText: 'はい',
          cancelButtonText: 'いいえ',
          type: 'warning'
        })

        const response = await outsourcingApi.deletePerformanceRecord(record.id)
        if (response.success) {
          this.$message.success('記録を削除しました')
          this.loadPerformanceData()
        } else {
          this.$message.error(response.message || '削除に失敗しました')
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('記録削除エラー:', error)
          this.$message.error('削除に失敗しました')
        }
      }
    },

    async handleRecordSave(recordData) {
      try {
        let response
        if (this.recordMode === 'create') {
          response = await outsourcingApi.createPerformanceRecord({
            ...recordData,
            supplier_id: this.supplierData.id
          })
        } else {
          response = await outsourcingApi.updatePerformanceRecord(this.currentRecord.id, recordData)
        }

        if (response.success) {
          this.$message.success(
            this.recordMode === 'create' ? '記録を追加しました' : '記録を更新しました'
          )
          this.recordDialogVisible = false
          this.loadPerformanceData()
        } else {
          this.$message.error(response.message || '保存に失敗しました')
        }
      } catch (error) {
        console.error('記録保存エラー:', error)
        this.$message.error('保存に失敗しました')
      }
    },

    exportData() {
      this.$message.info('エクスポート機能は開発中です')
    },

    getTrendClass(trend) {
      if (trend > 0) return 'trend-up'
      if (trend < 0) return 'trend-down'
      return 'trend-stable'
    },

    getTrendIcon(trend) {
      if (trend > 0) return 'el-icon-top'
      if (trend < 0) return 'el-icon-bottom'
      return 'el-icon-minus'
    },

    getPerformanceClass(type, value) {
      switch (type) {
        case 'otd':
          if (value >= 95) return 'performance-excellent'
          if (value >= 90) return 'performance-good'
          if (value >= 80) return 'performance-fair'
          return 'performance-poor'
        case 'quality':
          if (value <= 100) return 'performance-excellent'
          if (value <= 500) return 'performance-good'
          if (value <= 1000) return 'performance-fair'
          return 'performance-poor'
        case 'delivery':
          if (value >= 98) return 'performance-excellent'
          if (value >= 95) return 'performance-good'
          if (value >= 90) return 'performance-fair'
          return 'performance-poor'
        default:
          return ''
      }
    },

    getScoreType(score) {
      if (score >= 90) return 'success'
      if (score >= 80) return 'primary'
      if (score >= 70) return 'warning'
      return 'danger'
    },

    getScoreGrade(score) {
      if (score >= 90) return 'S'
      if (score >= 80) return 'A'
      if (score >= 70) return 'B'
      if (score >= 60) return 'C'
      return 'D'
    },

    formatPeriod(period) {
      if (!period) return ''
      const [year, month] = period.split('-')
      return `${year}年${month}月`
    }
  }
}
</script>

<style scoped>
.performance-management {
  padding: 0;
}

.performance-header {
  margin-bottom: 20px;
  padding: 20px;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  color: white;
  border-radius: 8px;
}

.performance-header h3 {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 600;
}

.supplier-info {
  margin: 0;
  font-size: 14px;
  opacity: 0.9;
}

.period-selector {
  margin-bottom: 30px;
  padding: 20px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.quick-periods {
  display: flex;
  gap: 8px;
}

.kpi-overview {
  margin-bottom: 30px;
}

.kpi-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 16px;
  transition: transform 0.3s ease;
}

.kpi-card:hover {
  transform: translateY(-2px);
}

.kpi-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
}

.kpi-card.otd .kpi-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.kpi-card.quality .kpi-icon {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.kpi-card.delivery .kpi-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.kpi-card.cost .kpi-icon {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
}

.kpi-content {
  flex: 1;
}

.kpi-value {
  font-size: 28px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 4px;
}

.kpi-label {
  font-size: 14px;
  color: #7f8c8d;
  margin-bottom: 8px;
}

.kpi-trend {
  font-size: 12px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.trend-up {
  background-color: #d4edda;
  color: #155724;
}

.trend-down {
  background-color: #f8d7da;
  color: #721c24;
}

.trend-stable {
  background-color: #e2e3e5;
  color: #383d41;
}

.charts-section {
  margin-bottom: 30px;
}

.chart-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.chart-card h4 {
  margin: 0 0 20px 0;
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
}

.chart-container {
  height: 300px;
}

.performance-table {
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.table-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.table-header h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
}

.table-actions {
  display: flex;
  gap: 8px;
}

.performance-excellent {
  color: #67c23a;
  font-weight: 600;
}

.performance-good {
  color: #409eff;
  font-weight: 600;
}

.performance-fair {
  color: #e6a23c;
  font-weight: 600;
}

.performance-poor {
  color: #f56c6c;
  font-weight: 600;
}

.cost-over {
  color: #f56c6c;
  font-weight: 600;
}

.cost-under {
  color: #67c23a;
  font-weight: 600;
}

@media (max-width: 1200px) {
  .kpi-overview .el-col {
    margin-bottom: 20px;
  }

  .charts-section .el-col {
    margin-bottom: 20px;
  }
}
</style>
