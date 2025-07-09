<template>
  <div class="outsourcing-management">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">
          <i class="el-icon-s-cooperation"></i>
          外注管理
        </h1>
        <div class="header-actions">
          <el-button type="primary" @click="showQuickOrder = true">
            <i class="el-icon-plus"></i> 新規注文
          </el-button>
          <el-button @click="refreshData"> <i class="el-icon-refresh"></i> 更新 </el-button>
        </div>
      </div>
    </div>

    <!-- 概览统计 -->
    <div class="overview-section">
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon orders">
              <i class="el-icon-document"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ overview.total_orders }}</div>
              <div class="stat-label">総注文数</div>
              <div class="stat-trend positive">+{{ overview.orders_growth }}%</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon suppliers">
              <i class="el-icon-office-building"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ overview.active_suppliers }}</div>
              <div class="stat-label">活動仕入先</div>
              <div class="stat-trend positive">+{{ overview.suppliers_growth }}%</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon amount">
              <i class="el-icon-money"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">¥{{ formatNumber(overview.total_amount) }}</div>
              <div class="stat-label">総取引額</div>
              <div class="stat-trend positive">+{{ overview.amount_growth }}%</div>
            </div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-icon performance">
              <i class="el-icon-trophy"></i>
            </div>
            <div class="stat-content">
              <div class="stat-value">{{ overview.avg_performance }}%</div>
              <div class="stat-label">平均パフォーマンス</div>
              <div
                class="stat-trend"
                :class="overview.performance_trend >= 0 ? 'positive' : 'negative'"
              >
                {{ overview.performance_trend >= 0 ? '+' : '' }}{{ overview.performance_trend }}%
              </div>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 主要功能导航 -->
    <div class="function-nav">
      <el-row :gutter="20">
        <el-col :span="4" v-for="func in functions" :key="func.key">
          <div class="function-card" @click="navigateToFunction(func.key)">
            <div class="function-icon" :class="func.iconClass">
              <i :class="func.icon"></i>
            </div>
            <div class="function-title">{{ func.title }}</div>
            <div class="function-desc">{{ func.description }}</div>
            <div class="function-count" v-if="func.count !== undefined">
              {{ func.count }}
            </div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <el-tabs v-model="activeTab" type="card" @tab-click="handleTabClick">
        <!-- 订单管理 -->
        <el-tab-pane label="注文管理" name="orders">
          <OrderManagement v-if="activeTab === 'orders'" ref="orderManagement" />
        </el-tab-pane>

        <!-- 供应商管理 -->
        <el-tab-pane label="仕入先管理" name="suppliers">
          <SupplierManagement v-if="activeTab === 'suppliers'" ref="supplierManagement" />
        </el-tab-pane>

        <!-- 能力矩阵 -->
        <el-tab-pane label="能力マトリックス" name="capability">
          <CapabilityMatrix v-if="activeTab === 'capability'" ref="capabilityMatrix" />
        </el-tab-pane>

        <!-- 绩效管理 -->
        <el-tab-pane label="パフォーマンス管理" name="performance">
          <PerformanceManagement v-if="activeTab === 'performance'" ref="performanceManagement" />
        </el-tab-pane>

        <!-- 库存管理 -->
        <el-tab-pane label="在庫管理" name="inventory">
          <InventoryManagement v-if="activeTab === 'inventory'" ref="inventoryManagement" />
        </el-tab-pane>

        <!-- 收货检验 -->
        <el-tab-pane label="受入検査" name="receiving">
          <ReceivingInspection v-if="activeTab === 'receiving'" ref="receivingInspection" />
        </el-tab-pane>

        <!-- 结算成本 -->
        <el-tab-pane label="精算コスト" name="settlement">
          <SettlementCost v-if="activeTab === 'settlement'" ref="settlementCost" />
        </el-tab-pane>

        <!-- 分析报告 -->
        <el-tab-pane label="分析レポート" name="analysis">
          <AnalysisReport v-if="activeTab === 'analysis'" ref="analysisReport" />
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 快速下单对话框 -->
    <el-dialog
      title="新規注文"
      :visible.sync="showQuickOrder"
      width="800px"
      :close-on-click-modal="false"
    >
      <QuickOrderForm
        v-if="showQuickOrder"
        @success="handleQuickOrderSuccess"
        @cancel="showQuickOrder = false"
      />
    </el-dialog>

    <!-- 通知中心 -->
    <div class="notification-center" v-if="notifications.length > 0">
      <el-badge :value="notifications.length" class="notification-badge">
        <el-button
          type="link"
          icon="el-icon-bell"
          @click="showNotifications = true"
          class="notification-btn"
        >
        </el-button>
      </el-badge>
    </div>

    <!-- 通知列表 -->
    <el-drawer title="通知センター" :visible.sync="showNotifications" direction="rtl" size="400px">
      <div class="notification-list">
        <div
          v-for="notification in notifications"
          :key="notification.id"
          class="notification-item"
          :class="notification.type"
        >
          <div class="notification-icon">
            <i :class="getNotificationIcon(notification.type)"></i>
          </div>
          <div class="notification-content">
            <div class="notification-title">{{ notification.title }}</div>
            <div class="notification-message">{{ notification.message }}</div>
            <div class="notification-time">{{ formatTime(notification.created_at) }}</div>
          </div>
          <div class="notification-actions">
            <el-button type="link" size="small" @click="markAsRead(notification.id)">
              既読
            </el-button>
          </div>
        </div>
      </div>
    </el-drawer>
  </div>
</template>

<script>
import OrderManagement from './components/OrderManagement.vue'
import SupplierManagement from './components/SupplierManagement.vue'
import CapabilityMatrix from './components/CapabilityMatrix.vue'
import PerformanceManagement from './components/PerformanceManagement.vue'
import InventoryManagement from './components/InventoryManagement.vue'
import ReceivingInspection from './components/ReceivingInspection.vue'
import SettlementCost from './components/SettlementCost.vue'
import AnalysisReport from './components/AnalysisReport.vue'
import QuickOrderForm from './components/QuickOrderForm.vue'
import { outsourcingApi } from '@/api/outsourcing'

export default {
  name: 'OutsourcingManagement',
  components: {
    OrderManagement,
    SupplierManagement,
    CapabilityMatrix,
    PerformanceManagement,
    InventoryManagement,
    ReceivingInspection,
    SettlementCost,
    AnalysisReport,
    QuickOrderForm,
  },
  data() {
    return {
      activeTab: 'orders',
      showQuickOrder: false,
      showNotifications: false,
      overview: {
        total_orders: 0,
        orders_growth: 0,
        active_suppliers: 0,
        suppliers_growth: 0,
        total_amount: 0,
        amount_growth: 0,
        avg_performance: 0,
        performance_trend: 0,
      },
      functions: [
        {
          key: 'orders',
          title: '注文管理',
          description: '外注注文の作成・管理',
          icon: 'el-icon-document',
          iconClass: 'orders',
          count: 0,
        },
        {
          key: 'suppliers',
          title: '仕入先管理',
          description: '仕入先情報の管理',
          icon: 'el-icon-office-building',
          iconClass: 'suppliers',
          count: 0,
        },
        {
          key: 'capability',
          title: '能力マトリックス',
          description: '仕入先能力の評価',
          icon: 'el-icon-data-analysis',
          iconClass: 'capability',
        },
        {
          key: 'performance',
          title: 'パフォーマンス',
          description: '仕入先パフォーマンス分析',
          icon: 'el-icon-trophy',
          iconClass: 'performance',
        },
        {
          key: 'inventory',
          title: '在庫管理',
          description: '外注在庫の管理',
          icon: 'el-icon-goods',
          iconClass: 'inventory',
          count: 0,
        },
        {
          key: 'receiving',
          title: '受入検査',
          description: '受入品の検査管理',
          icon: 'el-icon-view',
          iconClass: 'receiving',
          count: 0,
        },
      ],
      notifications: [],
    }
  },
  mounted() {
    this.loadOverviewData()
    this.loadNotifications()
    // 设置定时刷新
    this.refreshTimer = setInterval(() => {
      this.loadOverviewData()
      this.loadNotifications()
    }, 300000) // 5分钟刷新一次
  },
  beforeDestroy() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer)
    }
  },
  methods: {
    async loadOverviewData() {
      try {
        const response = await outsourcingApi.getOverviewData()
        if (response.success) {
          this.overview = response.data
          // 更新功能卡片的计数
          this.updateFunctionCounts(response.data)
        }
      } catch (error) {
        console.error('概览数据加载失败:', error)
      }
    },

    async loadNotifications() {
      try {
        const response = await outsourcingApi.getNotifications()
        if (response.success) {
          this.notifications = response.data.filter((item) => !item.is_read)
        }
      } catch (error) {
        console.error('通知加载失败:', error)
      }
    },

    updateFunctionCounts(data) {
      const countMap = {
        orders: data.pending_orders || 0,
        suppliers: data.active_suppliers || 0,
        inventory: data.low_stock_items || 0,
        receiving: data.pending_inspections || 0,
      }

      this.functions.forEach((func) => {
        if (countMap[func.key] !== undefined) {
          func.count = countMap[func.key]
        }
      })
    },

    navigateToFunction(key) {
      this.activeTab = key
    },

    handleTabClick(tab) {
      // 当切换标签页时，可以执行一些初始化操作
      const componentRef = this.$refs[tab.name]
      if (componentRef && typeof componentRef.refresh === 'function') {
        componentRef.refresh()
      }
    },

    refreshData() {
      this.loadOverviewData()
      this.loadNotifications()

      // 刷新当前活动标签页的数据
      const componentRef = this.$refs[this.activeTab]
      if (componentRef && typeof componentRef.refresh === 'function') {
        componentRef.refresh()
      }

      this.$message.success('データを更新しました')
    },

    handleQuickOrderSuccess() {
      this.showQuickOrder = false
      this.refreshData()
      this.$message.success('注文を作成しました')
    },

    async markAsRead(notificationId) {
      try {
        await outsourcingApi.markNotificationAsRead(notificationId)
        this.notifications = this.notifications.filter((item) => item.id !== notificationId)
      } catch (error) {
        console.error('通知既読処理失敗:', error)
      }
    },

    getNotificationIcon(type) {
      const iconMap = {
        info: 'el-icon-info',
        warning: 'el-icon-warning',
        error: 'el-icon-error',
        success: 'el-icon-success',
      }
      return iconMap[type] || 'el-icon-info'
    },

    formatNumber(value) {
      if (value == null) return '0'
      return Number(value).toLocaleString()
    },

    formatTime(time) {
      if (!time) return ''
      const date = new Date(time)
      const now = new Date()
      const diff = now - date

      if (diff < 60000) {
        // 1分钟内
        return 'たった今'
      } else if (diff < 3600000) {
        // 1小时内
        return `${Math.floor(diff / 60000)}分前`
      } else if (diff < 86400000) {
        // 1天内
        return `${Math.floor(diff / 3600000)}時間前`
      } else {
        return date.toLocaleDateString('ja-JP')
      }
    },
  },
}
</script>

<style scoped>
.outsourcing-management {
  min-height: 100vh;
  background-color: #f5f7fa;
}

.page-header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 20px 0;
  margin-bottom: 20px;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-title {
  margin: 0;
  font-size: 28px;
  font-weight: 600;
  display: flex;
  align-items: center;
}

.page-title i {
  margin-right: 10px;
  font-size: 32px;
}

.header-actions .el-button {
  margin-left: 10px;
}

.overview-section {
  max-width: 1200px;
  margin: 0 auto 30px;
  padding: 0 20px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  transition:
    transform 0.3s ease,
    box-shadow 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
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

.stat-icon.orders {
  background: linear-gradient(135deg, #409eff, #66b1ff);
}

.stat-icon.suppliers {
  background: linear-gradient(135deg, #67c23a, #85ce61);
}

.stat-icon.amount {
  background: linear-gradient(135deg, #e6a23c, #f7ba2a);
}

.stat-icon.performance {
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

.function-nav {
  max-width: 1200px;
  margin: 0 auto 30px;
  padding: 0 20px;
}

.function-card {
  background: white;
  border-radius: 12px;
  padding: 25px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
}

.function-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.function-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, #409eff, #67c23a);
  transform: scaleX(0);
  transition: transform 0.3s ease;
}

.function-card:hover::before {
  transform: scaleX(1);
}

.function-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 15px;
  font-size: 20px;
  color: white;
}

.function-icon.orders {
  background: linear-gradient(135deg, #409eff, #66b1ff);
}

.function-icon.suppliers {
  background: linear-gradient(135deg, #67c23a, #85ce61);
}

.function-icon.capability {
  background: linear-gradient(135deg, #e6a23c, #f7ba2a);
}

.function-icon.performance {
  background: linear-gradient(135deg, #f56c6c, #f78989);
}

.function-icon.inventory {
  background: linear-gradient(135deg, #909399, #b3b6bb);
}

.function-icon.receiving {
  background: linear-gradient(135deg, #606266, #909399);
}

.function-title {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 8px;
}

.function-desc {
  font-size: 12px;
  color: #909399;
  margin-bottom: 10px;
}

.function-count {
  position: absolute;
  top: 10px;
  right: 10px;
  background: #f56c6c;
  color: white;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 600;
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.notification-center {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
}

.notification-btn {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: #409eff;
}

.notification-badge {
  display: block;
}

.notification-list {
  padding: 20px;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 10px;
  background: #f8f9fa;
  border-left: 4px solid #409eff;
}

.notification-item.warning {
  border-left-color: #e6a23c;
}

.notification-item.error {
  border-left-color: #f56c6c;
}

.notification-item.success {
  border-left-color: #67c23a;
}

.notification-icon {
  margin-right: 12px;
  font-size: 18px;
  color: #409eff;
}

.notification-content {
  flex: 1;
}

.notification-title {
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 5px;
}

.notification-message {
  font-size: 14px;
  color: #606266;
  margin-bottom: 5px;
}

.notification-time {
  font-size: 12px;
  color: #909399;
}

.notification-actions {
  margin-left: 10px;
}

.el-tabs {
  border: none;
}

.el-tabs__header {
  margin: 0;
  border-bottom: 1px solid #e4e7ed;
}

.el-tabs__content {
  padding: 20px;
}

@media (max-width: 768px) {
  .header-content {
    flex-direction: column;
    text-align: center;
  }

  .header-actions {
    margin-top: 15px;
  }

  .function-nav .el-col {
    margin-bottom: 15px;
  }

  .overview-section .el-col {
    margin-bottom: 15px;
  }
}
</style>
