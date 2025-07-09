<template>
  <div class="analytics-reports">
    <!-- 筛选条件区域 -->
    <div class="filter-section">
      <el-form :model="filterForm" inline>
        <el-form-item label="仕入先">
          <el-select
            v-model="filterForm.supplierCd"
            placeholder="仕入先を選択"
            clearable
            multiple
            collapse-tags
            style="width: 250px"
          >
            <el-option
              v-for="supplier in suppliers"
              :key="supplier.supplier_cd"
              :label="supplier.supplier_name"
              :value="supplier.supplier_cd"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="レポートタイプ">
          <el-select
            v-model="filterForm.reportType"
            placeholder="レポートタイプを選択"
            style="width: 200px"
          >
            <el-option label="総合分析" value="comprehensive" />
            <el-option label="コスト分析" value="cost" />
            <el-option label="品質分析" value="quality" />
            <el-option label="納期分析" value="delivery" />
            <el-option label="仕入先比較" value="supplier_comparison" />
          </el-select>
        </el-form-item>
        <el-form-item label="期間">
          <el-date-picker
            v-model="filterForm.dateRange"
            type="daterange"
            range-separator="～"
            start-placeholder="開始日"
            end-placeholder="終了日"
            format="yyyy-MM-dd"
            value-format="yyyy-MM-dd"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="generateReport">
            <i class="el-icon-data-analysis"></i> レポート生成
          </el-button>
          <el-button @click="resetFilter"> <i class="el-icon-refresh"></i> リセット </el-button>
        </el-form-item>
      </el-form>
    </div>

    <!-- 概览统计 -->
    <div class="overview-section" v-if="overview">
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="stat-card orders">
            <div class="stat-icon">
              <i class="el-icon-document"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ overview.totalOrders }}</div>
              <div class="stat-label">総注文数</div>
              <div class="stat-trend" :class="overview.ordersTrend >= 0 ? 'positive' : 'negative'">
                {{ overview.ordersTrend >= 0 ? '+' : '' }}{{ overview.ordersTrend }}%
              </div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card amount">
            <div class="stat-icon">
              <i class="el-icon-money"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">¥{{ formatNumber(overview.totalAmount) }}</div>
              <div class="stat-label">総取引額</div>
              <div class="stat-trend" :class="overview.amountTrend >= 0 ? 'positive' : 'negative'">
                {{ overview.amountTrend >= 0 ? '+' : '' }}{{ overview.amountTrend }}%
              </div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card suppliers">
            <div class="stat-icon">
              <i class="el-icon-office-building"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ overview.activeSuppliers }}</div>
              <div class="stat-label">活動仕入先数</div>
              <div
                class="stat-trend"
                :class="overview.suppliersTrend >= 0 ? 'positive' : 'negative'"
              >
                {{ overview.suppliersTrend >= 0 ? '+' : '' }}{{ overview.suppliersTrend }}%
              </div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card performance">
            <div class="stat-icon">
              <i class="el-icon-trophy"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ overview.avgPerformance }}%</div>
              <div class="stat-label">平均パフォーマンス</div>
              <div
                class="stat-trend"
                :class="overview.performanceTrend >= 0 ? 'positive' : 'negative'"
              >
                {{ overview.performanceTrend >= 0 ? '+' : '' }}{{ overview.performanceTrend }}%
              </div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 图表分析区域 -->
    <div class="charts-section" v-if="chartData">
      <el-row :gutter="20">
        <!-- 月度趋势图 -->
        <el-col :span="12">
          <div class="chart-card">
            <div class="chart-header">
              <h3>月度取引トレンド</h3>
              <el-button-group>
                <el-button
                  size="small"
                  @click="switchTrendType('amount')"
                  :type="trendType === 'amount' ? 'primary' : ''"
                  >金額</el-button
                >
                <el-button
                  size="small"
                  @click="switchTrendType('quantity')"
                  :type="trendType === 'quantity' ? 'primary' : ''"
                  >数量</el-button
                >
              </el-button-group>
            </div>
            <div ref="trendChart" class="chart-container"></div>
          </div>
        </el-col>

        <!-- 供应商分布图 -->
        <el-col :span="12">
          <div class="chart-card">
            <div class="chart-header">
              <h3>仕入先分布</h3>
              <el-button-group>
                <el-button
                  size="small"
                  @click="switchSupplierType('amount')"
                  :type="supplierType === 'amount' ? 'primary' : ''"
                  >金額</el-button
                >
                <el-button
                  size="small"
                  @click="switchSupplierType('orders')"
                  :type="supplierType === 'orders' ? 'primary' : ''"
                  >注文数</el-button
                >
              </el-button-group>
            </div>
            <div ref="supplierChart" class="chart-container"></div>
          </div>
        </el-col>
      </el-row>

      <el-row :gutter="20" style="margin-top: 20px">
        <!-- 成本分析图 -->
        <el-col :span="12">
          <div class="chart-card">
            <div class="chart-header">
              <h3>コスト分析</h3>
            </div>
            <div ref="costChart" class="chart-container"></div>
          </div>
        </el-col>

        <!-- 质量分析图 -->
        <el-col :span="12">
          <div class="chart-card">
            <div class="chart-header">
              <h3>品質分析</h3>
            </div>
            <div ref="qualityChart" class="chart-container"></div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 详细分析表格 -->
    <div class="analysis-tables" v-if="analysisData">
      <el-tabs v-model="activeAnalysisTab">
        <!-- 供应商分析 -->
        <el-tab-pane label="仕入先分析" name="supplier">
          <el-table :data="analysisData.supplierAnalysis" stripe border>
            <el-table-column prop="supplier_name" label="仕入先名" width="200" />
            <el-table-column prop="order_count" label="注文数" width="100" align="right" />
            <el-table-column prop="total_amount" label="総額" width="120" align="right">
              <template slot-scope="scope"> ¥{{ formatNumber(scope.row.total_amount) }} </template>
            </el-table-column>
            <el-table-column prop="avg_unit_price" label="平均単価" width="120" align="right">
              <template slot-scope="scope">
                ¥{{ formatNumber(scope.row.avg_unit_price) }}
              </template>
            </el-table-column>
            <el-table-column prop="quality_rate" label="品質率" width="100" align="right">
              <template slot-scope="scope"> {{ scope.row.quality_rate }}% </template>
            </el-table-column>
            <el-table-column prop="delivery_rate" label="納期遵守率" width="120" align="right">
              <template slot-scope="scope"> {{ scope.row.delivery_rate }}% </template>
            </el-table-column>
            <el-table-column prop="performance_score" label="総合評価" width="100" align="right">
              <template slot-scope="scope">
                <el-rate
                  :value="scope.row.performance_score / 20"
                  disabled
                  show-score
                  text-color="#ff9900"
                />
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- 产品分析 -->
        <el-tab-pane label="製品分析" name="product">
          <el-table :data="analysisData.productAnalysis" stripe border>
            <el-table-column prop="product_name" label="製品名" width="200" />
            <el-table-column prop="order_count" label="注文数" width="100" align="right" />
            <el-table-column prop="total_quantity" label="総数量" width="120" align="right" />
            <el-table-column prop="total_amount" label="総額" width="120" align="right">
              <template slot-scope="scope"> ¥{{ formatNumber(scope.row.total_amount) }} </template>
            </el-table-column>
            <el-table-column prop="avg_unit_price" label="平均単価" width="120" align="right">
              <template slot-scope="scope">
                ¥{{ formatNumber(scope.row.avg_unit_price) }}
              </template>
            </el-table-column>
            <el-table-column prop="defect_rate" label="不良率" width="100" align="right">
              <template slot-scope="scope">
                <span :class="getDefectRateClass(scope.row.defect_rate)">
                  {{ scope.row.defect_rate }}%
                </span>
              </template>
            </el-table-column>
            <el-table-column
              prop="avg_lead_time"
              label="平均リードタイム"
              width="140"
              align="right"
            >
              <template slot-scope="scope"> {{ scope.row.avg_lead_time }}日 </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>

        <!-- 成本分析 -->
        <el-tab-pane label="コスト分析" name="cost">
          <el-table :data="analysisData.costAnalysis" stripe border>
            <el-table-column prop="category" label="カテゴリ" width="150" />
            <el-table-column prop="current_period" label="当期" width="120" align="right">
              <template slot-scope="scope">
                ¥{{ formatNumber(scope.row.current_period) }}
              </template>
            </el-table-column>
            <el-table-column prop="previous_period" label="前期" width="120" align="right">
              <template slot-scope="scope">
                ¥{{ formatNumber(scope.row.previous_period) }}
              </template>
            </el-table-column>
            <el-table-column prop="variance" label="差異" width="120" align="right">
              <template slot-scope="scope">
                <span :class="scope.row.variance >= 0 ? 'positive' : 'negative'">
                  {{ scope.row.variance >= 0 ? '+' : '' }}¥{{
                    formatNumber(Math.abs(scope.row.variance))
                  }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="variance_rate" label="差異率" width="100" align="right">
              <template slot-scope="scope">
                <span :class="scope.row.variance_rate >= 0 ? 'positive' : 'negative'">
                  {{ scope.row.variance_rate >= 0 ? '+' : '' }}{{ scope.row.variance_rate }}%
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="budget" label="予算" width="120" align="right">
              <template slot-scope="scope"> ¥{{ formatNumber(scope.row.budget) }} </template>
            </el-table-column>
            <el-table-column prop="budget_variance" label="予算差異" width="120" align="right">
              <template slot-scope="scope">
                <span :class="scope.row.budget_variance >= 0 ? 'positive' : 'negative'">
                  {{ scope.row.budget_variance >= 0 ? '+' : '' }}{{ scope.row.budget_variance }}%
                </span>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 操作按钮区域 -->
    <div class="action-section" v-if="reportGenerated">
      <el-button type="primary" @click="exportReport">
        <i class="el-icon-download"></i> レポートエクスポート
      </el-button>
      <el-button @click="printReport"> <i class="el-icon-printer"></i> 印刷 </el-button>
      <el-button @click="saveTemplate"> <i class="el-icon-folder"></i> テンプレート保存 </el-button>
      <el-button @click="scheduleReport"> <i class="el-icon-time"></i> 定期レポート設定 </el-button>
    </div>

    <!-- 定期报告设置对话框 -->
    <el-dialog title="定期レポート設定" :visible.sync="showScheduleDialog" width="600px">
      <ScheduleReportForm
        v-if="showScheduleDialog"
        :filter-form="filterForm"
        @success="handleScheduleSuccess"
        @cancel="showScheduleDialog = false"
      />
    </el-dialog>
  </div>
</template>

<script>
import * as echarts from 'echarts'
import ScheduleReportForm from './ScheduleReportForm.vue'
import { outsourcingApi } from '@/api/outsourcing'

export default {
  name: 'AnalyticsReports',
  components: {
    ScheduleReportForm,
  },
  data() {
    return {
      loading: false,
      filterForm: {
        supplierCd: [],
        reportType: 'comprehensive',
        dateRange: [],
      },
      suppliers: [],
      overview: null,
      chartData: null,
      analysisData: null,
      reportGenerated: false,
      activeAnalysisTab: 'supplier',
      trendType: 'amount',
      supplierType: 'amount',
      showScheduleDialog: false,
      trendChart: null,
      supplierChart: null,
      costChart: null,
      qualityChart: null,
    }
  },
  mounted() {
    this.loadSuppliers()
    this.initDefaultDateRange()
  },
  beforeDestroy() {
    this.disposeCharts()
  },
  methods: {
    async loadSuppliers() {
      try {
        const response = await outsourcingApi.getSuppliers()
        if (response.success) {
          this.suppliers = response.data
        }
      } catch (error) {
        console.error('仕入先データ読み込みエラー:', error)
      }
    },

    initDefaultDateRange() {
      const endDate = new Date()
      const startDate = new Date()
      startDate.setMonth(startDate.getMonth() - 6)

      this.filterForm.dateRange = [
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0],
      ]
    },

    async generateReport() {
      this.loading = true
      try {
        const params = {
          ...this.filterForm,
          startDate: this.filterForm.dateRange[0],
          endDate: this.filterForm.dateRange[1],
        }

        const [overviewRes, chartRes, analysisRes] = await Promise.all([
          outsourcingApi.getAnalyticsOverview(params),
          outsourcingApi.getAnalyticsChartData(params),
          outsourcingApi.getAnalyticsDetailData(params),
        ])

        if (overviewRes.success) {
          this.overview = overviewRes.data
        }

        if (chartRes.success) {
          this.chartData = chartRes.data
          this.$nextTick(() => {
            this.initCharts()
            this.updateCharts()
          })
        }

        if (analysisRes.success) {
          this.analysisData = analysisRes.data
        }

        this.reportGenerated = true
        this.$message.success('レポートを生成しました')
      } catch (error) {
        console.error('レポート生成エラー:', error)
        this.$message.error('レポート生成に失敗しました')
      } finally {
        this.loading = false
      }
    },

    resetFilter() {
      this.filterForm = {
        supplierCd: [],
        reportType: 'comprehensive',
        dateRange: [],
      }
      this.initDefaultDateRange()
      this.overview = null
      this.chartData = null
      this.analysisData = null
      this.reportGenerated = false
      this.disposeCharts()
    },

    initCharts() {
      if (this.$refs.trendChart) {
        this.trendChart = echarts.init(this.$refs.trendChart)
      }
      if (this.$refs.supplierChart) {
        this.supplierChart = echarts.init(this.$refs.supplierChart)
      }
      if (this.$refs.costChart) {
        this.costChart = echarts.init(this.$refs.costChart)
      }
      if (this.$refs.qualityChart) {
        this.qualityChart = echarts.init(this.$refs.qualityChart)
      }

      window.addEventListener('resize', this.handleResize)
    },

    updateCharts() {
      this.updateTrendChart()
      this.updateSupplierChart()
      this.updateCostChart()
      this.updateQualityChart()
    },

    updateTrendChart() {
      if (!this.trendChart || !this.chartData) return

      const data =
        this.trendType === 'amount' ? this.chartData.trendAmount : this.chartData.trendQuantity
      const option = {
        tooltip: {
          trigger: 'axis',
        },
        xAxis: {
          type: 'category',
          data: this.chartData.months,
        },
        yAxis: {
          type: 'value',
        },
        series: [
          {
            name: this.trendType === 'amount' ? '取引額' : '数量',
            type: 'line',
            data: data,
            smooth: true,
            areaStyle: {},
          },
        ],
      }
      this.trendChart.setOption(option)
    },

    updateSupplierChart() {
      if (!this.supplierChart || !this.chartData) return

      const data =
        this.supplierType === 'amount'
          ? this.chartData.supplierAmount
          : this.chartData.supplierOrders
      const option = {
        tooltip: {
          trigger: 'item',
        },
        legend: {
          orient: 'vertical',
          left: 'left',
        },
        series: [
          {
            name: this.supplierType === 'amount' ? '取引額' : '注文数',
            type: 'pie',
            radius: '50%',
            data: data,
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)',
              },
            },
          },
        ],
      }
      this.supplierChart.setOption(option)
    },

    updateCostChart() {
      if (!this.costChart || !this.chartData) return

      const option = {
        tooltip: {
          trigger: 'axis',
        },
        legend: {
          data: ['当期', '前期'],
        },
        xAxis: {
          type: 'category',
          data: this.chartData.costCategories,
        },
        yAxis: {
          type: 'value',
        },
        series: [
          {
            name: '当期',
            type: 'bar',
            data: this.chartData.currentCosts,
          },
          {
            name: '前期',
            type: 'bar',
            data: this.chartData.previousCosts,
          },
        ],
      }
      this.costChart.setOption(option)
    },

    updateQualityChart() {
      if (!this.qualityChart || !this.chartData) return

      const option = {
        tooltip: {
          trigger: 'axis',
        },
        legend: {
          data: ['合格率', '不良率'],
        },
        xAxis: {
          type: 'category',
          data: this.chartData.qualityMonths,
        },
        yAxis: {
          type: 'value',
          max: 100,
        },
        series: [
          {
            name: '合格率',
            type: 'line',
            data: this.chartData.qualityRates,
            smooth: true,
          },
          {
            name: '不良率',
            type: 'line',
            data: this.chartData.defectRates,
            smooth: true,
          },
        ],
      }
      this.qualityChart.setOption(option)
    },

    switchTrendType(type) {
      this.trendType = type
      this.updateTrendChart()
    },

    switchSupplierType(type) {
      this.supplierType = type
      this.updateSupplierChart()
    },

    disposeCharts() {
      if (this.trendChart) {
        this.trendChart.dispose()
        this.trendChart = null
      }
      if (this.supplierChart) {
        this.supplierChart.dispose()
        this.supplierChart = null
      }
      if (this.costChart) {
        this.costChart.dispose()
        this.costChart = null
      }
      if (this.qualityChart) {
        this.qualityChart.dispose()
        this.qualityChart = null
      }
      window.removeEventListener('resize', this.handleResize)
    },

    handleResize() {
      this.trendChart?.resize()
      this.supplierChart?.resize()
      this.costChart?.resize()
      this.qualityChart?.resize()
    },

    async exportReport() {
      try {
        const params = {
          ...this.filterForm,
          startDate: this.filterForm.dateRange[0],
          endDate: this.filterForm.dateRange[1],
        }

        const response = await outsourcingApi.exportAnalyticsReport(params)
        if (response.success) {
          const link = document.createElement('a')
          link.href = response.data.downloadUrl
          link.download = response.data.filename
          link.click()
        }
      } catch (error) {
        console.error('エクスポートエラー:', error)
        this.$message.error('エクスポートに失敗しました')
      }
    },

    async printReport() {
      try {
        const params = {
          ...this.filterForm,
          startDate: this.filterForm.dateRange[0],
          endDate: this.filterForm.dateRange[1],
        }

        const response = await outsourcingApi.printAnalyticsReport(params)
        if (response.success) {
          window.open(response.data.printUrl, '_blank')
        }
      } catch (error) {
        console.error('印刷エラー:', error)
        this.$message.error('印刷に失敗しました')
      }
    },

    async saveTemplate() {
      try {
        const templateName = await this.$prompt(
          'テンプレート名を入力してください',
          'テンプレート保存',
          {
            confirmButtonText: '保存',
            cancelButtonText: 'キャンセル',
          },
        )

        const params = {
          name: templateName.value,
          config: this.filterForm,
        }

        const response = await outsourcingApi.saveReportTemplate(params)
        if (response.success) {
          this.$message.success('テンプレートを保存しました')
        }
      } catch (error) {
        if (error !== 'cancel') {
          console.error('テンプレート保存エラー:', error)
          this.$message.error('テンプレート保存に失敗しました')
        }
      }
    },

    scheduleReport() {
      this.showScheduleDialog = true
    },

    handleScheduleSuccess() {
      this.showScheduleDialog = false
      this.$message.success('定期レポートを設定しました')
    },

    getDefectRateClass(rate) {
      if (rate <= 1) return 'excellent'
      if (rate <= 3) return 'good'
      if (rate <= 5) return 'warning'
      return 'danger'
    },

    formatNumber(value) {
      if (value == null) return '0'
      return Number(value).toLocaleString()
    },

    refresh() {
      if (this.reportGenerated) {
        this.generateReport()
      }
    },
  },
}
</script>

<style scoped>
.analytics-reports {
  padding: 20px;
}

.filter-section {
  background: white;
  padding: 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.overview-section {
  margin-bottom: 20px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  transition: transform 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20px;
  font-size: 24px;
  color: white;
}

.stat-card.orders .stat-icon {
  background: linear-gradient(135deg, #409eff, #66b1ff);
}

.stat-card.amount .stat-icon {
  background: linear-gradient(135deg, #67c23a, #85ce61);
}

.stat-card.suppliers .stat-icon {
  background: linear-gradient(135deg, #e6a23c, #f7ba2a);
}

.stat-card.performance .stat-icon {
  background: linear-gradient(135deg, #f56c6c, #f78989);
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.stat-trend {
  font-size: 12px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 12px;
  display: inline-block;
}

.stat-trend.positive {
  background-color: #f0f9ff;
  color: #67c23a;
}

.stat-trend.negative {
  background-color: #fef0f0;
  color: #f56c6c;
}

.charts-section {
  margin-bottom: 20px;
}

.chart-card {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.chart-header h3 {
  margin: 0;
  color: #2c3e50;
}

.chart-container {
  height: 300px;
}

.analysis-tables {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.action-section {
  text-align: center;
  padding: 20px;
}

.positive {
  color: #67c23a;
}

.negative {
  color: #f56c6c;
}

.excellent {
  color: #67c23a;
  font-weight: 600;
}

.good {
  color: #409eff;
  font-weight: 600;
}

.warning {
  color: #e6a23c;
  font-weight: 600;
}

.danger {
  color: #f56c6c;
  font-weight: 600;
}

.el-button + .el-button {
  margin-left: 10px;
}

@media (max-width: 768px) {
  .filter-section .el-form {
    display: block;
  }

  .filter-section .el-form-item {
    display: block;
    margin-bottom: 15px;
  }

  .overview-section .el-col {
    margin-bottom: 15px;
  }

  .charts-section .el-col {
    margin-bottom: 15px;
  }

  .action-section .el-button {
    margin-bottom: 10px;
  }
}
</style>
