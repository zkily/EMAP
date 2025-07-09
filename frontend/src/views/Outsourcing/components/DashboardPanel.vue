<template>
  <div class="dashboard-panel">
    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon orders">
          <i class="el-icon-document"></i>
        </div>
        <div class="stat-content">
          <h3>{{ statistics.totalOrders }}</h3>
          <p>総注文数</p>
          <span class="stat-change positive">+{{ statistics.ordersChange }}%</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon suppliers">
          <i class="el-icon-office-building"></i>
        </div>
        <div class="stat-content">
          <h3>{{ statistics.activeSuppliers }}</h3>
          <p>活動中仕入先</p>
          <span class="stat-change positive">+{{ statistics.suppliersChange }}%</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon amount">
          <i class="el-icon-money"></i>
        </div>
        <div class="stat-content">
          <h3>¥{{ formatNumber(statistics.totalAmount) }}</h3>
          <p>総取引金額</p>
          <span class="stat-change positive">+{{ statistics.amountChange }}%</span>
        </div>
      </div>

      <div class="stat-card">
        <div class="stat-icon quality">
          <i class="el-icon-medal"></i>
        </div>
        <div class="stat-content">
          <h3>{{ statistics.qualityRate }}%</h3>
          <p>品質合格率</p>
          <span class="stat-change negative">{{ statistics.qualityChange }}%</span>
        </div>
      </div>
    </div>

    <!-- チャートとテーブル -->
    <div class="dashboard-content">
      <div class="left-panel">
        <!-- 注文状態分布 -->
        <div class="chart-card">
          <h3>注文状態分布</h3>
          <div ref="orderStatusChart" class="chart-container"></div>
        </div>

        <!-- 月別取引推移 -->
        <div class="chart-card">
          <h3>月別取引推移</h3>
          <div ref="monthlyTrendChart" class="chart-container"></div>
        </div>
      </div>

      <div class="right-panel">
        <!-- 最近の注文 -->
        <div class="table-card">
          <h3>最近の注文</h3>
          <el-table :data="recentOrders" size="small" style="width: 100%">
            <el-table-column prop="order_no" label="注文番号" width="120"></el-table-column>
            <el-table-column prop="supplier_name" label="仕入先" width="100"></el-table-column>
            <el-table-column prop="product_cd" label="製品CD" width="80"></el-table-column>
            <el-table-column prop="quantity" label="数量" width="60"></el-table-column>
            <el-table-column prop="order_status" label="状態" width="80">
              <template #default="scope">
                <el-tag :type="getStatusType(scope.row.order_status)" size="small">
                  {{ scope.row.order_status }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 仕入先パフォーマンス -->
        <div class="table-card">
          <h3>仕入先パフォーマンス</h3>
          <el-table :data="supplierPerformance" size="small" style="width: 100%">
            <el-table-column prop="supplier_name" label="仕入先" width="100"></el-table-column>
            <el-table-column prop="otd_rate" label="OTD率" width="70">
              <template #default="scope"> {{ scope.row.otd_rate }}% </template>
            </el-table-column>
            <el-table-column prop="quality_ppm" label="PPM" width="70">
              <template #default="scope">
                {{ scope.row.quality_ppm }}
              </template>
            </el-table-column>
            <el-table-column prop="overall_rating" label="評価" width="60">
              <template #default="scope">
                <el-tag :type="getRatingType(scope.row.overall_rating)" size="small">
                  {{ scope.row.overall_rating }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import * as echarts from 'echarts'
import { outsourcingApi } from '@/api/outsourcing'

export default {
  name: 'DashboardPanel',
  data() {
    return {
      statistics: {
        totalOrders: 0,
        ordersChange: 0,
        activeSuppliers: 0,
        suppliersChange: 0,
        totalAmount: 0,
        amountChange: 0,
        qualityRate: 0,
        qualityChange: 0,
      },
      recentOrders: [],
      supplierPerformance: [],
      orderStatusChart: null,
      monthlyTrendChart: null,
    }
  },
  mounted() {
    this.loadDashboardData()
    this.$nextTick(() => {
      this.initCharts()
    })
  },
  beforeDestroy() {
    if (this.orderStatusChart) {
      this.orderStatusChart.dispose()
    }
    if (this.monthlyTrendChart) {
      this.monthlyTrendChart.dispose()
    }
  },
  methods: {
    async loadDashboardData() {
      try {
        // 统计数据
        const statsResponse = await outsourcingApi.getOrderStatistics()
        if (statsResponse.success) {
          this.updateStatistics(statsResponse.data)
        }

        // 最近订单
        const ordersResponse = await outsourcingApi.getOrders({ limit: 10 })
        if (ordersResponse.success) {
          this.recentOrders = ordersResponse.data.slice(0, 10)
        }

        // 供应商绩效
        const performanceResponse = await outsourcingApi.getSupplierPerformance()
        if (performanceResponse.success) {
          this.supplierPerformance = performanceResponse.data.slice(0, 10)
        }

        this.updateCharts()
      } catch (error) {
        console.error('ダッシュボードデータ読み込みエラー:', error)
        this.$message.error('ダッシュボードデータの読み込みに失敗しました')
      }
    },

    updateStatistics(data) {
      // 模拟统计数据更新
      this.statistics = {
        totalOrders: data.length || 156,
        ordersChange: 12.5,
        activeSuppliers: 24,
        suppliersChange: 8.3,
        totalAmount: 15680000,
        amountChange: 15.2,
        qualityRate: 98.5,
        qualityChange: -0.3,
      }
    },

    initCharts() {
      this.orderStatusChart = echarts.init(this.$refs.orderStatusChart)
      this.monthlyTrendChart = echarts.init(this.$refs.monthlyTrendChart)

      // 初始化图表配置
      this.updateCharts()
    },

    updateCharts() {
      // 订单状态分布饼图
      const orderStatusOption = {
        tooltip: {
          trigger: 'item',
          formatter: '{a} <br/>{b}: {c} ({d}%)',
        },
        legend: {
          orient: 'vertical',
          left: 'left',
        },
        series: [
          {
            name: '注文状態',
            type: 'pie',
            radius: '50%',
            data: [
              { value: 35, name: '作成済' },
              { value: 28, name: '送信済' },
              { value: 42, name: '生産中' },
              { value: 31, name: '完了' },
              { value: 8, name: 'キャンセル' },
            ],
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

      // 月别趋势折线图
      const monthlyTrendOption = {
        tooltip: {
          trigger: 'axis',
        },
        legend: {
          data: ['注文数', '取引金額'],
        },
        xAxis: {
          type: 'category',
          data: ['1月', '2月', '3月', '4月', '5月', '6月'],
        },
        yAxis: [
          {
            type: 'value',
            name: '注文数',
            position: 'left',
          },
          {
            type: 'value',
            name: '金額(万円)',
            position: 'right',
          },
        ],
        series: [
          {
            name: '注文数',
            type: 'line',
            data: [25, 32, 28, 35, 42, 38],
            yAxisIndex: 0,
          },
          {
            name: '取引金額',
            type: 'line',
            data: [1200, 1580, 1350, 1680, 1920, 1750],
            yAxisIndex: 1,
          },
        ],
      }

      this.orderStatusChart.setOption(orderStatusOption)
      this.monthlyTrendChart.setOption(monthlyTrendOption)
    },

    formatNumber(num) {
      return num.toLocaleString()
    },

    getStatusType(status) {
      const statusMap = {
        作成済: '',
        送信済: 'info',
        確認済: 'warning',
        生産中: 'primary',
        完了: 'success',
        キャンセル: 'danger',
      }
      return statusMap[status] || ''
    },

    getRatingType(rating) {
      const ratingMap = {
        S: 'success',
        A: 'primary',
        B: 'warning',
        C: 'info',
        D: 'danger',
      }
      return ratingMap[rating] || 'info'
    },
  },
}
</script>

<style scoped>
.dashboard-panel {
  padding: 0;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 16px;
  transition: transform 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: white;
}

.stat-icon.orders {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-icon.suppliers {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-icon.amount {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-icon.quality {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-content {
  flex: 1;
}

.stat-content h3 {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 4px 0;
  color: #2c3e50;
}

.stat-content p {
  font-size: 14px;
  color: #7f8c8d;
  margin: 0 0 8px 0;
}

.stat-change {
  font-size: 12px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 12px;
}

.stat-change.positive {
  background-color: #d4edda;
  color: #155724;
}

.stat-change.negative {
  background-color: #f8d7da;
  color: #721c24;
}

.dashboard-content {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 20px;
}

.left-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.right-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.chart-card,
.table-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.chart-card h3,
.table-card h3 {
  margin: 0 0 20px 0;
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
}

.chart-container {
  height: 300px;
}

.table-card {
  height: fit-content;
}

@media (max-width: 1200px) {
  .dashboard-content {
    grid-template-columns: 1fr;
  }

  .stats-grid {
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }

  .stat-card {
    padding: 16px;
  }

  .chart-card,
  .table-card {
    padding: 16px;
  }
}
</style>
