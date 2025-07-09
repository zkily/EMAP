<template>
  <div class="analysis-report">
    <!-- 筛选条件 -->
    <div class="filter-section">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-select v-model="filterForm.supplier_id" placeholder="仕入先選択" clearable>
            <el-option
              v-for="supplier in supplierList"
              :key="supplier.id"
              :label="supplier.name"
              :value="supplier.id">
            </el-option>
          </el-select>
        </el-col>
        <el-col :span="6">
          <el-select v-model="filterForm.report_type" placeholder="レポートタイプ">
            <el-option label="月次レポート" value="monthly"></el-option>
            <el-option label="四半期レポート" value="quarterly"></el-option>
            <el-option label="年次レポート" value="yearly"></el-option>
            <el-option label="カスタム期間" value="custom"></el-option>
          </el-select>
        </el-col>
        <el-col :span="8">
          <el-date-picker
            v-model="filterForm.date_range"
            type="monthrange"
            placeholder="期間選択"
            format="yyyy-MM"
            value-format="yyyy-MM"
            range-separator="～"
            v-if="filterForm.report_type === 'custom'">
          </el-date-picker>
          <el-date-picker
            v-model="filterForm.year"
            type="year"
            placeholder="年選択"
            format="yyyy"
            value-format="yyyy"
            v-else-if="filterForm.report_type === 'yearly'">
          </el-date-picker>
          <el-date-picker
            v-model="filterForm.quarter"
            type="month"
            placeholder="四半期選択"
            format="yyyy-MM"
            value-format="yyyy-MM"
            v-else-if="filterForm.report_type === 'quarterly'">
          </el-date-picker>
          <el-date-picker
            v-model="filterForm.month"
            type="month"
            placeholder="月選択"
            format="yyyy-MM"
            value-format="yyyy-MM"
            v-else>
          </el-date-picker>
        </el-col>
        <el-col :span="4">
          <el-button type="primary" @click="generateReport" :loading="loading">
            <i class="el-icon-data-analysis"></i> 分析実行
          </el-button>
        </el-col>
      </el-row>
    </div>
    
    <!-- 概览统计 -->
    <div class="overview-section" v-if="reportData">
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon orders">
              <i class="el-icon-document"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ reportData.overview.total_orders }}</div>
              <div class="stat-label">総注文件数</div>
              <div class="stat-change" :class="getChangeClass(reportData.overview.orders_change)">
                {{ formatChange(reportData.overview.orders_change) }}
              </div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon amount">
              <i class="el-icon-money"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">¥{{ formatNumber(reportData.overview.total_amount) }}</div>
              <div class="stat-label">総取引額</div>
              <div class="stat-change" :class="getChangeClass(reportData.overview.amount_change)">
                {{ formatChange(reportData.overview.amount_change) }}
              </div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon suppliers">
              <i class="el-icon-office-building"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ reportData.overview.active_suppliers }}</div>
              <div class="stat-label">活動仕入先数</div>
              <div class="stat-change" :class="getChangeClass(reportData.overview.suppliers_change)">
                {{ formatChange(reportData.overview.suppliers_change) }}
              </div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon performance">
              <i class="el-icon-trophy"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ reportData.overview.avg_performance }}%</div>
              <div class="stat-label">平均パフォーマンス</div>
              <div class="stat-change" :class="getChangeClass(reportData.overview.performance_change)">
                {{ formatChange(reportData.overview.performance_change) }}
              </div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>
    
    <!-- 图表分析 -->
    <div class="charts-section" v-if="reportData">
      <el-row :gutter="20">
        <!-- 月度趋势图 -->
        <el-col :span="12">
          <div class="chart-card">
            <h4>月度取引トレンド</h4>
            <div ref="trendChart" class="chart-container"></div>
          </div>
        </el-col>
        
        <!-- 供应商分布图 -->
        <el-col :span="12">
          <div class="chart-card">
            <h4>仕入先別取引分布</h4>
            <div ref="supplierChart" class="chart-container"></div>
          </div>
        </el-col>
      </el-row>
      
      <el-row :gutter="20">
        <!-- 成本分析图 -->
        <el-col :span="12">
          <div class="chart-card">
            <h4>コスト分析</h4>
            <div ref="costChart" class="chart-container"></div>
          </div>
        </el-col>
        
        <!-- 质量分析图 -->
        <el-col :span="12">
          <div class="chart-card">
            <h4>品質分析</h4>
            <div ref="qualityChart" class="chart-container"></div>
          </div>
        </el-col>
      </el-row>
    </div>
    
    <!-- 详细分析表格 -->
    <div class="table-section" v-if="reportData">
      <el-tabs v-model="activeTab" type="card">
        <!-- 供应商分析 -->
        <el-tab-pane label="仕入先分析" name="supplier">
          <el-table
            :data="reportData.supplier_analysis"
            border
            size="small">
            <el-table-column prop="supplier_name" label="仕入先" width="150" fixed="left"></el-table-column>
            <el-table-column prop="order_count" label="注文件数" width="100" align="right">
              <template slot-scope="scope">
                {{ formatNumber(scope.row.order_count) }}
              </template>
            </el-table-column>
            <el-table-column prop="total_amount" label="取引額" width="120" align="right">
              <template slot-scope="scope">
                ¥{{ formatNumber(scope.row.total_amount) }}
              </template>
            </el-table-column>
            <el-table-column prop="avg_unit_price" label="平均単価" width="100" align="right">
              <template slot-scope="scope">
                ¥{{ formatNumber(scope.row.avg_unit_price) }}
              </template>
            </el-table-column>
            <el-table-column prop="otd_rate" label="OTD率" width="80" align="right">
              <template slot-scope="scope">
                <span :class="getPerformanceClass(scope.row.otd_rate)">
                  {{ scope.row.otd_rate }}%
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="quality_ppm" label="品質PPM" width="100" align="right">
              <template slot-scope="scope">
                <span :class="getQualityClass(scope.row.quality_ppm)">
                  {{ formatNumber(scope.row.quality_ppm) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="cost_performance" label="コスト評価" width="100" align="center">
              <template slot-scope="scope">
                <el-rate
                  v-model="scope.row.cost_performance"
                  :max="5"
                  disabled
                  show-score
                  text-color="#ff9900">
                </el-rate>
              </template>
            </el-table-column>
            <el-table-column prop="overall_score" label="総合評価" width="100" align="center">
              <template slot-scope="scope">
                <el-tag :type="getScoreType(scope.row.overall_score)">
                  {{ getScoreText(scope.row.overall_score) }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        
        <!-- 产品分析 -->
        <el-tab-pane label="製品分析" name="product">
          <el-table
            :data="reportData.product_analysis"
            border
            size="small">
            <el-table-column prop="product_name" label="製品名" width="200" fixed="left"></el-table-column>
            <el-table-column prop="order_count" label="注文件数" width="100" align="right">
              <template slot-scope="scope">
                {{ formatNumber(scope.row.order_count) }}
              </template>
            </el-table-column>
            <el-table-column prop="total_quantity" label="総数量" width="100" align="right">
              <template slot-scope="scope">
                {{ formatNumber(scope.row.total_quantity) }}
              </template>
            </el-table-column>
            <el-table-column prop="total_amount" label="取引額" width="120" align="right">
              <template slot-scope="scope">
                ¥{{ formatNumber(scope.row.total_amount) }}
              </template>
            </el-table-column>
            <el-table-column prop="avg_unit_price" label="平均単価" width="100" align="right">
              <template slot-scope="scope">
                ¥{{ formatNumber(scope.row.avg_unit_price) }}
              </template>
            </el-table-column>
            <el-table-column prop="price_trend" label="価格トレンド" width="120" align="center">
              <template slot-scope="scope">
                <span :class="getTrendClass(scope.row.price_trend)">
                  <i :class="getTrendIcon(scope.row.price_trend)"></i>
                  {{ formatTrend(scope.row.price_trend) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="main_supplier" label="主要仕入先" width="150"></el-table-column>
            <el-table-column prop="supplier_count" label="仕入先数" width="100" align="right">
              <template slot-scope="scope">
                {{ scope.row.supplier_count }}社
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
        
        <!-- 成本分析 -->
        <el-tab-pane label="コスト分析" name="cost">
          <el-table
            :data="reportData.cost_analysis"
            border
            size="small">
            <el-table-column prop="period" label="期間" width="100" fixed="left">
              <template slot-scope="scope">
                {{ formatPeriod(scope.row.period) }}
              </template>
            </el-table-column>
            <el-table-column prop="planned_cost" label="計画コスト" width="120" align="right">
              <template slot-scope="scope">
                ¥{{ formatNumber(scope.row.planned_cost) }}
              </template>
            </el-table-column>
            <el-table-column prop="actual_cost" label="実績コスト" width="120" align="right">
              <template slot-scope="scope">
                ¥{{ formatNumber(scope.row.actual_cost) }}
              </template>
            </el-table-column>
            <el-table-column prop="cost_variance" label="コスト差異" width="120" align="right">
              <template slot-scope="scope">
                <span :class="getVarianceClass(scope.row.cost_variance)">
                  ¥{{ formatNumber(scope.row.cost_variance) }}
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="variance_rate" label="差異率" width="100" align="right">
              <template slot-scope="scope">
                <span :class="getVarianceClass(scope.row.cost_variance)">
                  {{ scope.row.variance_rate }}%
                </span>
              </template>
            </el-table-column>
            <el-table-column prop="material_cost" label="材料費" width="120" align="right">
              <template slot-scope="scope">
                ¥{{ formatNumber(scope.row.material_cost) }}
              </template>
            </el-table-column>
            <el-table-column prop="processing_cost" label="加工費" width="120" align="right">
              <template slot-scope="scope">
                ¥{{ formatNumber(scope.row.processing_cost) }}
              </template>
            </el-table-column>
            <el-table-column prop="other_cost" label="その他費用" width="120" align="right">
              <template slot-scope="scope">
                ¥{{ formatNumber(scope.row.other_cost) }}
              </template>
            </el-table-column>
          </el-table>
        </el-tab-pane>
      </el-tabs>
    </div>
    
    <!-- 导出操作 -->
    <div class="export-section" v-if="reportData">
      <el-button type="primary" @click="exportReport">
        <i class="el-icon-download"></i> レポートエクスポート
      </el-button>
      <el-button @click="printReport">
        <i class="el-icon-printer"></i> 印刷
      </el-button>
      <el-button @click="saveTemplate">
        <i class="el-icon-document-add"></i> テンプレート保存
      </el-button>
    </div>
  </div>
</template>

<script>
import * as echarts from 'echarts'
import { outsourcingApi } from '@/api/outsourcing'

export default {
  name: 'AnalysisReport',
  data() {
    return {
      loading: false,
      activeTab: 'supplier',
      filterForm: {
        supplier_id: '',
        report_type: 'monthly',
        date_range: [],
        year: new Date().getFullYear().toString(),
        quarter: '',
        month: new Date().toISOString().slice(0, 7)
      },
      supplierList: [],
      reportData: null,
      charts: {
        trend: null,
        supplier: null,
        cost: null,
        quality: null
      }
    }
  },
  mounted() {
    this.loadSupplierList()
    this.generateReport()
  },
  beforeDestroy() {
    // 销毁图表实例
    Object.values(this.charts).forEach(chart => {
      if (chart) {
        chart.dispose()
      }
    })
  },
  methods: {
    async loadSupplierList() {
      try {
        const response = await outsourcingApi.getSupplierList()
        if (response.success) {
          this.supplierList = response.data
        }
      } catch (error) {
        console.error('仕入先リスト取得エラー:', error)
      }
    },
    
    async generateReport() {
      this.loading = true
      try {
        const params = {
          ...this.filterForm
        }
        const response = await outsourcingApi.generateAnalysisReport(params)
        if (response.success) {
          this.reportData = response.data
          this.$nextTick(() => {
            this.initCharts()
          })
        }
      } catch (error) {
        console.error('レポート生成エラー:', error)
        this.$message.error('レポートの生成に失敗しました')
      } finally {
        this.loading = false
      }
    },
    
    initCharts() {
      this.initTrendChart()
      this.initSupplierChart()
      this.initCostChart()
      this.initQualityChart()
    },
    
    initTrendChart() {
      if (this.charts.trend) {
        this.charts.trend.dispose()
      }
      
      this.charts.trend = echarts.init(this.$refs.trendChart)
      const option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross'
          }
        },
        legend: {
          data: ['注文件数', '取引額']
        },
        xAxis: {
          type: 'category',
          data: this.reportData.trend_data.map(item => item.period)
        },
        yAxis: [
          {
            type: 'value',
            name: '注文件数',
            position: 'left'
          },
          {
            type: 'value',
            name: '取引額 (万円)',
            position: 'right'
          }
        ],
        series: [
          {
            name: '注文件数',
            type: 'bar',
            data: this.reportData.trend_data.map(item => item.order_count),
            itemStyle: {
              color: '#409eff'
            }
          },
          {
            name: '取引額',
            type: 'line',
            yAxisIndex: 1,
            data: this.reportData.trend_data.map(item => Math.round(item.amount / 10000)),
            itemStyle: {
              color: '#67c23a'
            }
          }
        ]
      }
      this.charts.trend.setOption(option)
    },
    
    initSupplierChart() {
      if (this.charts.supplier) {
        this.charts.supplier.dispose()
      }
      
      this.charts.supplier = echarts.init(this.$refs.supplierChart)
      const option = {
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        legend: {
          orient: 'vertical',
          left: 'left'
        },
        series: [
          {
            name: '取引額',
            type: 'pie',
            radius: '50%',
            data: this.reportData.supplier_distribution.map(item => ({
              value: item.amount,
              name: item.supplier_name
            })),
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            }
          }
        ]
      }
      this.charts.supplier.setOption(option)
    },
    
    initCostChart() {
      if (this.charts.cost) {
        this.charts.cost.dispose()
      }
      
      this.charts.cost = echarts.init(this.$refs.costChart)
      const option = {
        tooltip: {
          trigger: 'axis'
        },
        legend: {
          data: ['計画コスト', '実績コスト']
        },
        xAxis: {
          type: 'category',
          data: this.reportData.cost_analysis.map(item => item.period)
        },
        yAxis: {
          type: 'value',
          name: 'コスト (万円)'
        },
        series: [
          {
            name: '計画コスト',
            type: 'bar',
            data: this.reportData.cost_analysis.map(item => Math.round(item.planned_cost / 10000)),
            itemStyle: {
              color: '#409eff'
            }
          },
          {
            name: '実績コスト',
            type: 'bar',
            data: this.reportData.cost_analysis.map(item => Math.round(item.actual_cost / 10000)),
            itemStyle: {
              color: '#f56c6c'
            }
          }
        ]
      }
      this.charts.cost.setOption(option)
    },
    
    initQualityChart() {
      if (this.charts.quality) {
        this.charts.quality.dispose()
      }
      
      this.charts.quality = echarts.init(this.$refs.qualityChart)
      const option = {
        tooltip: {
          trigger: 'axis'
        },
        legend: {
          data: ['OTD率', '品質PPM']
        },
        xAxis: {
          type: 'category',
          data: this.reportData.supplier_analysis.map(item => item.supplier_name)
        },
        yAxis: [
          {
            type: 'value',
            name: 'OTD率 (%)',
            min: 0,
            max: 100
          },
          {
            type: 'value',
            name: '品質PPM',
            position: 'right'
          }
        ],
        series: [
          {
            name: 'OTD率',
            type: 'bar',
            data: this.reportData.supplier_analysis.map(item => item.otd_rate),
            itemStyle: {
              color: '#67c23a'
            }
          },
          {
            name: '品質PPM',
            type: 'line',
            yAxisIndex: 1,
            data: this.reportData.supplier_analysis.map(item => item.quality_ppm),
            itemStyle: {
              color: '#e6a23c'
            }
          }
        ]
      }
      this.charts.quality.setOption(option)
    },
    
    exportReport() {
      this.$message.info('エクスポート機能は開発中です')
    },
    
    printReport() {
      this.$message.info('印刷機能は開発中です')
    },
    
    saveTemplate() {
      this.$message.info('テンプレート保存機能は開発中です')
    },
    
    getChangeClass(change) {
      if (change > 0) return 'positive'
      if (change < 0) return 'negative'
      return 'neutral'
    },
    
    getPerformanceClass(rate) {
      if (rate >= 95) return 'excellent'
      if (rate >= 90) return 'good'
      if (rate >= 80) return 'average'
      return 'poor'
    },
    
    getQualityClass(ppm) {
      if (ppm <= 100) return 'excellent'
      if (ppm <= 500) return 'good'
      if (ppm <= 1000) return 'average'
      return 'poor'
    },
    
    getScoreType(score) {
      if (score >= 90) return 'success'
      if (score >= 80) return 'warning'
      if (score >= 70) return 'primary'
      return 'danger'
    },
    
    getScoreText(score) {
      if (score >= 90) return '優秀'
      if (score >= 80) return '良好'
      if (score >= 70) return '普通'
      return '要改善'
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
    
    getVarianceClass(variance) {
      if (variance > 0) return 'variance-over'
      if (variance < 0) return 'variance-under'
      return 'variance-neutral'
    },
    
    formatChange(change) {
      if (change > 0) return `+${change}%`
      return `${change}%`
    },
    
    formatTrend(trend) {
      if (trend > 0) return `+${trend}%`
      if (trend < 0) return `${trend}%`
      return '変化なし'
    },
    
    formatNumber(value) {
      if (value == null) return '0'
      return Number(value).toLocaleString()
    },
    
    formatPeriod(period) {
      if (!period) return '-'
      return period.replace('-', '年') + '月'
    }
  }
}
</script>

<style scoped>
.analysis-report {
  padding: 20px;
}

.filter-section {
  background: white;
  padding: 20px;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.overview-section {
  margin-bottom: 20px;
}

.stat-card {
  background: white;
  border-radius: 6px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 15px;
  font-size: 20px;
  color: white;
}

.stat-icon.orders {
  background: linear-gradient(135deg, #409eff, #66b1ff);
}

.stat-icon.amount {
  background: linear-gradient(135deg, #67c23a, #85ce61);
}

.stat-icon.suppliers {
  background: linear-gradient(135deg, #e6a23c, #f7ba2a);
}

.stat-icon.performance {
  background: linear-gradient(135deg, #f56c6c, #f78989);
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 5px;
}

.stat-change {
  font-size: 12px;
  font-weight: 600;
}

.stat-change.positive {
  color: #67c23a;
}

.stat-change.negative {
  color: #f56c6c;
}

.stat-change.neutral {
  color: #909399;
}

.charts-section {
  margin-bottom: 20px;
}

.chart-card {
  background: white;
  border-radius: 6px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.chart-card h4 {
  margin: 0 0 15px 0;
  color: #2c3e50;
  font-size: 16px;
  padding-bottom: 10px;
  border-bottom: 2px solid #409eff;
}

.chart-container {
  width: 100%;
  height: 300px;
}

.table-section {
  background: white;
  border-radius: 6px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  overflow: hidden;
}

.export-section {
  text-align: right;
}

.export-section .el-button {
  margin-left: 10px;
}

/* 性能指标样式 */
.excellent {
  color: #67c23a;
  font-weight: 600;
}

.good {
  color: #409eff;
  font-weight: 600;
}

.average {
  color: #e6a23c;
  font-weight: 600;
}

.poor {
  color: #f56c6c;
  font-weight: 600;
}

/* 趋势样式 */
.trend-up {
  color: #67c23a;
}

.trend-down {
  color: #f56c6c;
}

.trend-stable {
  color: #909399;
}

/* 差异样式 */
.variance-over {
  color: #f56c6c;
  font-weight: 600;
}

.variance-under {
  color: #67c23a;
  font-weight: 600;
}

.variance-neutral {
  color: #909399;
}

.el-select {
  width: 100%;
}

.el-date-editor {
  width: 100%;
}

.el-tabs {
  padding: 20px;
}

.el-table {
  font-size: 14px;
}

.el-table th {
  background-color: #f8f9fa;
  color: #2c3e50;
  font-weight: 600;
}
</style>