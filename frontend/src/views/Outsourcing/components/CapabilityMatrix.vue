<template>
  <div class="capability-matrix">
    <div class="matrix-header">
      <h3>{{ supplierData.supplier_name }} の能力マトリックス</h3>
      <p class="supplier-info">仕入先CD: {{ supplierData.supplier_cd }}</p>
    </div>

    <!-- 能力矩阵表格 -->
    <div class="matrix-table">
      <el-table
        :data="capabilityData"
        border
        style="width: 100%"
        :row-class-name="getRowClassName"
      >
        <el-table-column prop="process_name" label="工序名" width="150" fixed="left">
          <template #default="scope">
            <strong>{{ scope.row.process_name }}</strong>
          </template>
        </el-table-column>
        
        <el-table-column label="対応可能" width="100" align="center">
          <template #default="scope">
            <el-switch
              v-model="scope.row.is_capable"
              @change="handleCapabilityChange(scope.row)"
            ></el-switch>
          </template>
        </el-table-column>
        
        <el-table-column prop="capacity_per_day" label="日産能力" width="120" align="right">
          <template #default="scope">
            <el-input-number
              v-model="scope.row.capacity_per_day"
              :min="0"
              :precision="0"
              size="small"
              :disabled="!scope.row.is_capable"
              @change="handleDataChange"
            ></el-input-number>
          </template>
        </el-table-column>
        
        <el-table-column prop="capacity_unit" label="単位" width="80">
          <template #default="scope">
            <el-select
              v-model="scope.row.capacity_unit"
              size="small"
              style="width: 100%"
              :disabled="!scope.row.is_capable"
              @change="handleDataChange"
            >
              <el-option label="個" value="pcs"></el-option>
              <el-option label="kg" value="kg"></el-option>
              <el-option label="m" value="m"></el-option>
              <el-option label="㎡" value="sqm"></el-option>
              <el-option label="ロット" value="lot"></el-option>
            </el-select>
          </template>
        </el-table-column>
        
        <el-table-column prop="lead_time_days" label="リードタイム" width="120" align="right">
          <template #default="scope">
            <el-input-number
              v-model="scope.row.lead_time_days"
              :min="1"
              :precision="0"
              size="small"
              :disabled="!scope.row.is_capable"
              @change="handleDataChange"
            ></el-input-number>
            <span v-if="scope.row.is_capable" style="margin-left: 4px; font-size: 12px; color: #909399;">日</span>
          </template>
        </el-table-column>
        
        <el-table-column prop="quality_level" label="品質レベル" width="120">
          <template #default="scope">
            <el-select
              v-model="scope.row.quality_level"
              size="small"
              style="width: 100%"
              :disabled="!scope.row.is_capable"
              @change="handleDataChange"
            >
              <el-option label="S" value="S"></el-option>
              <el-option label="A" value="A"></el-option>
              <el-option label="B" value="B"></el-option>
              <el-option label="C" value="C"></el-option>
            </el-select>
          </template>
        </el-table-column>
        
        <el-table-column prop="cost_level" label="コストレベル" width="120">
          <template #default="scope">
            <el-select
              v-model="scope.row.cost_level"
              size="small"
              style="width: 100%"
              :disabled="!scope.row.is_capable"
              @change="handleDataChange"
            >
              <el-option label="低" value="low"></el-option>
              <el-option label="中" value="medium"></el-option>
              <el-option label="高" value="high"></el-option>
            </el-select>
          </template>
        </el-table-column>
        
        <el-table-column prop="equipment_info" label="設備情報" width="200">
          <template #default="scope">
            <el-input
              v-model="scope.row.equipment_info"
              size="small"
              placeholder="設備情報を入力"
              :disabled="!scope.row.is_capable"
              @change="handleDataChange"
            ></el-input>
          </template>
        </el-table-column>
        
        <el-table-column prop="certification_required" label="認証要求" width="100" align="center">
          <template #default="scope">
            <el-checkbox
              v-model="scope.row.certification_required"
              :disabled="!scope.row.is_capable"
              @change="handleDataChange"
            ></el-checkbox>
          </template>
        </el-table-column>
        
        <el-table-column prop="remarks" label="備考" min-width="150">
          <template #default="scope">
            <el-input
              v-model="scope.row.remarks"
              size="small"
              placeholder="備考を入力"
              :disabled="!scope.row.is_capable"
              @change="handleDataChange"
            ></el-input>
          </template>
        </el-table-column>
        
        <el-table-column prop="last_updated" label="最終更新" width="120">
          <template #default="scope">
            <span style="font-size: 12px; color: #909399;">
              {{ formatDate(scope.row.last_updated) }}
            </span>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 统计信息 -->
    <div class="matrix-summary">
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="summary-card">
            <div class="summary-number">{{ capableProcessCount }}</div>
            <div class="summary-label">対応可能工序</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="summary-card">
            <div class="summary-number">{{ totalCapacity }}</div>
            <div class="summary-label">総日産能力</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="summary-card">
            <div class="summary-number">{{ averageLeadTime }}</div>
            <div class="summary-label">平均リードタイム（日）</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="summary-card">
            <div class="summary-number">{{ highQualityProcessCount }}</div>
            <div class="summary-label">高品質工序（S/A）</div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 操作按钮 -->
    <div class="matrix-actions">
      <el-button @click="handleCancel">キャンセル</el-button>
      <el-button type="primary" @click="handleSave" :loading="saving">保存</el-button>
      <el-button type="success" @click="handleExport">エクスポート</el-button>
    </div>
  </div>
</template>

<script>
import { outsourcingApi } from '@/api/outsourcing'

export default {
  name: 'CapabilityMatrix',
  props: {
    supplierData: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      saving: false,
      capabilityData: [],
      hasChanges: false
    }
  },
  computed: {
    capableProcessCount() {
      return this.capabilityData.filter(item => item.is_capable).length
    },
    
    totalCapacity() {
      return this.capabilityData
        .filter(item => item.is_capable && item.capacity_per_day)
        .reduce((sum, item) => sum + (item.capacity_per_day || 0), 0)
    },
    
    averageLeadTime() {
      const capableItems = this.capabilityData.filter(item => item.is_capable && item.lead_time_days)
      if (capableItems.length === 0) return 0
      const total = capableItems.reduce((sum, item) => sum + (item.lead_time_days || 0), 0)
      return Math.round(total / capableItems.length * 10) / 10
    },
    
    highQualityProcessCount() {
      return this.capabilityData.filter(item => 
        item.is_capable && ['S', 'A'].includes(item.quality_level)
      ).length
    }
  },
  mounted() {
    this.loadCapabilityData()
  },
  methods: {
    async loadCapabilityData() {
      try {
        // 获取所有外包工序
        const processResponse = await outsourcingApi.getOutsourceProcesses()
        if (!processResponse.success) {
          throw new Error('工序データの取得に失敗しました')
        }
        
        // 获取供应商的能力矩阵数据
        const capabilityResponse = await outsourcingApi.getSupplierCapability(this.supplierData.id)
        const existingCapabilities = capabilityResponse.success ? capabilityResponse.data : []
        
        // 合并数据
        this.capabilityData = processResponse.data.map(process => {
          const existing = existingCapabilities.find(cap => cap.process_cd === process.process_cd)
          return {
            process_cd: process.process_cd,
            process_name: process.process_name,
            is_capable: existing ? existing.is_capable : false,
            capacity_per_day: existing ? existing.capacity_per_day : 0,
            capacity_unit: existing ? existing.capacity_unit : 'pcs',
            lead_time_days: existing ? existing.lead_time_days : 1,
            quality_level: existing ? existing.quality_level : 'B',
            cost_level: existing ? existing.cost_level : 'medium',
            equipment_info: existing ? existing.equipment_info : '',
            certification_required: existing ? existing.certification_required : false,
            remarks: existing ? existing.remarks : '',
            last_updated: existing ? existing.last_updated : null
          }
        })
      } catch (error) {
        console.error('能力マトリックスデータ取得エラー:', error)
        this.$message.error('能力マトリックスデータの取得に失敗しました')
      }
    },
    
    handleCapabilityChange(row) {
      if (!row.is_capable) {
        // 如果设置为不可对应，清空相关数据
        row.capacity_per_day = 0
        row.lead_time_days = 1
        row.quality_level = 'B'
        row.cost_level = 'medium'
        row.equipment_info = ''
        row.certification_required = false
        row.remarks = ''
      } else {
        // 如果设置为可对应，设置默认值
        if (!row.capacity_per_day) row.capacity_per_day = 100
        if (!row.lead_time_days) row.lead_time_days = 3
      }
      this.handleDataChange()
    },
    
    handleDataChange() {
      this.hasChanges = true
    },
    
    async handleSave() {
      if (!this.hasChanges) {
        this.$message.info('変更がありません')
        return
      }
      
      this.saving = true
      try {
        const capabilityData = {
          supplier_id: this.supplierData.id,
          capabilities: this.capabilityData.map(item => ({
            process_cd: item.process_cd,
            is_capable: item.is_capable,
            capacity_per_day: item.capacity_per_day || 0,
            capacity_unit: item.capacity_unit,
            lead_time_days: item.lead_time_days || 1,
            quality_level: item.quality_level,
            cost_level: item.cost_level,
            equipment_info: item.equipment_info || '',
            certification_required: item.certification_required || false,
            remarks: item.remarks || ''
          }))
        }
        
        const response = await outsourcingApi.updateSupplierCapability(
          this.supplierData.id,
          capabilityData
        )
        
        if (response.success) {
          this.$message.success('能力マトリックスを保存しました')
          this.hasChanges = false
          this.$emit('save', capabilityData)
        } else {
          this.$message.error(response.message || '保存に失敗しました')
        }
      } catch (error) {
        console.error('能力マトリックス保存エラー:', error)
        this.$message.error('保存に失敗しました')
      } finally {
        this.saving = false
      }
    },
    
    handleCancel() {
      if (this.hasChanges) {
        this.$confirm('変更が保存されていません。破棄しますか？', '確認', {
          confirmButtonText: 'はい',
          cancelButtonText: 'いいえ',
          type: 'warning'
        }).then(() => {
          this.$emit('cancel')
        }).catch(() => {})
      } else {
        this.$emit('cancel')
      }
    },
    
    handleExport() {
      // 导出功能实现
      this.$message.info('エクスポート機能は開発中です')
    },
    
    getRowClassName({ row }) {
      return row.is_capable ? 'capable-row' : 'incapable-row'
    },
    
    formatDate(date) {
      if (!date) return '-'
      return new Date(date).toLocaleDateString('ja-JP')
    }
  }
}
</script>

<style scoped>
.capability-matrix {
  padding: 0;
}

.matrix-header {
  margin-bottom: 20px;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 8px;
}

.matrix-header h3 {
  margin: 0 0 8px 0;
  font-size: 20px;
  font-weight: 600;
}

.supplier-info {
  margin: 0;
  font-size: 14px;
  opacity: 0.9;
}

.matrix-table {
  margin-bottom: 30px;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

:deep(.capable-row) {
  background-color: #f0f9ff;
}

:deep(.incapable-row) {
  background-color: #fafafa;
}

:deep(.capable-row:hover) {
  background-color: #e0f2fe !important;
}

:deep(.incapable-row:hover) {
  background-color: #f5f5f5 !important;
}

.matrix-summary {
  margin-bottom: 30px;
}

.summary-card {
  background: white;
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease;
}

.summary-card:hover {
  transform: translateY(-2px);
}

.summary-number {
  font-size: 32px;
  font-weight: 700;
  color: #409eff;
  margin-bottom: 8px;
}

.summary-label {
  font-size: 14px;
  color: #606266;
  font-weight: 500;
}

.matrix-actions {
  text-align: right;
  padding: 20px 0;
  border-top: 1px solid #ebeef5;
}

.matrix-actions .el-button {
  margin-left: 12px;
}

:deep(.el-table .el-table__header-wrapper th) {
  background-color: #f8f9fa;
  color: #495057;
  font-weight: 600;
}

:deep(.el-input-number .el-input__inner) {
  text-align: right;
}

:deep(.el-table .cell) {
  padding: 8px;
}

@media (max-width: 1200px) {
  .matrix-table {
    overflow-x: auto;
  }
  
  :deep(.el-table) {
    min-width: 1200px;
  }
}
</style>