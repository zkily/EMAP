<template>
  <div class="receiving-detail">
    <!-- 基本信息 -->
    <div class="detail-section">
      <h4>基本情報</h4>
      <el-row :gutter="20">
        <el-col :span="8">
          <div class="info-item">
            <label>受入番号:</label>
            <span class="value">{{ receivingData.receiving_no }}</span>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="info-item">
            <label>外注注文番号:</label>
            <span class="value link" @click="viewOrder">{{ receivingData.order_no }}</span>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="info-item">
            <label>受入状態:</label>
            <el-tag :type="getReceivingStatusType(receivingData.receiving_status)">
              {{ getReceivingStatusText(receivingData.receiving_status) }}
            </el-tag>
          </div>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="8">
          <div class="info-item">
            <label>仕入先:</label>
            <span class="value">{{ receivingData.supplier_name }}</span>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="info-item">
            <label>製品名:</label>
            <span class="value">{{ receivingData.product_name }}</span>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="info-item">
            <label>受入日:</label>
            <span class="value">{{ formatDateTime(receivingData.receiving_date) }}</span>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 数量信息 -->
    <div class="detail-section">
      <h4>数量情報</h4>
      <el-row :gutter="20">
        <el-col :span="6">
          <div class="quantity-card">
            <div class="quantity-label">注文数量</div>
            <div class="quantity-value order">{{ formatNumber(receivingData.order_quantity) }} {{ receivingData.unit }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="quantity-card">
            <div class="quantity-label">受入数量</div>
            <div class="quantity-value received">{{ formatNumber(receivingData.received_quantity) }} {{ receivingData.unit }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="quantity-card">
            <div class="quantity-label">残り数量</div>
            <div class="quantity-value remaining">{{ formatNumber(receivingData.remaining_quantity) }} {{ receivingData.unit }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="quantity-card">
            <div class="quantity-label">受入率</div>
            <div class="quantity-value rate">{{ ((receivingData.received_quantity / receivingData.order_quantity) * 100).toFixed(1) }}%</div>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 受入详情 -->
    <div class="detail-section">
      <h4>受入詳細</h4>
      <el-row :gutter="20">
        <el-col :span="12">
          <div class="info-item">
            <label>受入担当者:</label>
            <span class="value">{{ receivingData.received_by }}</span>
          </div>
        </el-col>
        <el-col :span="12">
          <div class="info-item">
            <label>受入場所:</label>
            <span class="value">{{ getLocationText(receivingData.receiving_location) }}</span>
          </div>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="8">
          <div class="info-item">
            <label>梱包数:</label>
            <span class="value">{{ receivingData.package_count }} 箱</span>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="info-item">
            <label>梱包タイプ:</label>
            <span class="value">{{ getPackageTypeText(receivingData.package_type) }}</span>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="info-item">
            <label>総重量:</label>
            <span class="value">{{ formatNumber(receivingData.total_weight) }} kg</span>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 运输信息 -->
    <div class="detail-section">
      <h4>輸送情報</h4>
      <el-row :gutter="20">
        <el-col :span="12">
          <div class="info-item">
            <label>運送会社:</label>
            <span class="value">{{ receivingData.shipping_company || '-' }}</span>
          </div>
        </el-col>
        <el-col :span="12">
          <div class="info-item">
            <label>追跡番号:</label>
            <span class="value">{{ receivingData.tracking_number || '-' }}</span>
          </div>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <el-col :span="12">
          <div class="info-item">
            <label>出荷日:</label>
            <span class="value">{{ formatDate(receivingData.shipped_date) }}</span>
          </div>
        </el-col>
        <el-col :span="12">
          <div class="info-item">
            <label>運送費:</label>
            <span class="value">¥{{ formatNumber(receivingData.shipping_cost) }}</span>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 品质检查 -->
    <div class="detail-section">
      <h4>品質チェック</h4>
      <el-row :gutter="20">
        <el-col :span="12">
          <div class="info-item">
            <label>外観チェック:</label>
            <el-tag :type="getQualityCheckType(receivingData.appearance_check)" size="small">
              {{ getQualityCheckText(receivingData.appearance_check) }}
            </el-tag>
          </div>
        </el-col>
        <el-col :span="12">
          <div class="info-item">
            <label>梱包状態:</label>
            <el-tag :type="getPackageConditionType(receivingData.package_condition)" size="small">
              {{ getPackageConditionText(receivingData.package_condition) }}
            </el-tag>
          </div>
        </el-col>
      </el-row>

      <div class="info-item" v-if="receivingData.receiving_notes">
        <label>受入時備考:</label>
        <div class="notes-content">{{ receivingData.receiving_notes }}</div>
      </div>
    </div>

    <!-- 检验信息 -->
    <div class="detail-section" v-if="inspectionData">
      <h4>検査情報</h4>
      <el-row :gutter="20">
        <el-col :span="8">
          <div class="info-item">
            <label>検査状態:</label>
            <el-tag :type="getInspectionStatusType(inspectionData.inspection_status)">
              {{ getInspectionStatusText(inspectionData.inspection_status) }}
            </el-tag>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="info-item">
            <label>検査者:</label>
            <span class="value">{{ inspectionData.inspector }}</span>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="info-item">
            <label>検査日:</label>
            <span class="value">{{ formatDateTime(inspectionData.inspection_date) }}</span>
          </div>
        </el-col>
      </el-row>

      <el-row :gutter="20" v-if="inspectionData.inspection_status !== 'pending'">
        <el-col :span="6">
          <div class="inspection-result">
            <div class="result-label">検査数量</div>
            <div class="result-value">{{ formatNumber(inspectionData.inspected_quantity) }} {{ receivingData.unit }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="inspection-result">
            <div class="result-label">合格数量</div>
            <div class="result-value passed">{{ formatNumber(inspectionData.passed_quantity) }} {{ receivingData.unit }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="inspection-result">
            <div class="result-label">不合格数量</div>
            <div class="result-value failed">{{ formatNumber(inspectionData.failed_quantity) }} {{ receivingData.unit }}</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="inspection-result">
            <div class="result-label">不良率</div>
            <div class="result-value defect-rate">{{ (inspectionData.defect_rate * 100).toFixed(2) }}%</div>
          </div>
        </el-col>
      </el-row>

      <div class="info-item" v-if="inspectionData.inspection_notes">
        <label>検査備考:</label>
        <div class="notes-content">{{ inspectionData.inspection_notes }}</div>
      </div>
    </div>

    <!-- 文档附件 -->
    <div class="detail-section">
      <h4>関連書類</h4>
      <el-row :gutter="20">
        <el-col :span="12">
          <div class="info-item">
            <label>納品書番号:</label>
            <span class="value">{{ receivingData.delivery_note_no || '-' }}</span>
          </div>
        </el-col>
        <el-col :span="12">
          <div class="info-item">
            <label>検査証明書:</label>
            <span class="value">{{ receivingData.inspection_certificate || '-' }}</span>
          </div>
        </el-col>
      </el-row>

      <div class="info-item attachments">
        <label>添付ファイル:</label>
        <ul class="file-list" v-if="receivingData.attachments && receivingData.attachments.length">
          <li v-for="file in receivingData.attachments" :key="file.id">
            <i :class="getFileIcon(file.name)"></i>
            <span>{{ file.name }}</span>
            <el-button type="link" size="small" @click="downloadFile(file)">
              ダウンロード
            </el-button>
          </li>
        </ul>
        <span class="value" v-else>-</span>
      </div>
    </div>

    <!-- 履历信息 -->
    <div class="detail-section">
      <h4>履歴情報</h4>
      <el-row :gutter="20">
        <el-col :span="8">
          <div class="info-item">
            <label>作成日時:</label>
            <span class="value">{{ formatDateTime(receivingData.created_at) }}</span>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="info-item">
            <label>作成者:</label>
            <span class="value">{{ receivingData.created_by || '-' }}</span>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="info-item">
            <label>更新日時:</label>
            <span class="value">{{ formatDateTime(receivingData.updated_at) }}</span>
          </div>
        </el-col>
      </el-row>
    </div>

    <!-- 操作按钮 -->
    <div class="action-buttons">
      <el-button @click="handleClose">閉じる</el-button>
      <el-button type="primary" @click="handleEdit" v-if="canEdit">
        編集
      </el-button>
      <el-button type="success" @click="handleInspection" v-if="canInspect">
        検査
      </el-button>
      <el-button @click="handlePrint">
        印刷
      </el-button>
    </div>
  </div>
</template>

<script>
import { outsourcingApi } from '@/api/outsourcing'

export default {
  name: 'ReceivingDetail',
  props: {
    receivingData: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      inspectionData: null,
      attachments: []
    }
  },
  computed: {
    canEdit() {
      return this.receivingData.receiving_status !== 'completed' ||
             this.receivingData.inspection_status === 'pending'
    },

    canInspect() {
      return this.receivingData.receiving_status === 'completed' &&
             (!this.inspectionData || this.inspectionData.inspection_status === 'pending')
    }
  },
  mounted() {
    this.loadInspectionData()
    this.loadAttachments()
  },
  methods: {
    async loadInspectionData() {
      try {
        const response = await outsourcingApi.getInspectionByReceivingId(this.receivingData.id)
        if (response.success) {
          this.inspectionData = response.data
        }
      } catch (error) {
        console.error('検査データ取得エラー:', error)
      }
    },

    async loadAttachments() {
      try {
        const response = await outsourcingApi.getReceivingAttachments(this.receivingData.id)
        if (response.success) {
          this.attachments = response.data
        }
      } catch (error) {
        console.error('添付ファイル取得エラー:', error)
      }
    },

    viewOrder() {
      this.$emit('view-order', this.receivingData.order_id)
    },

    handleClose() {
      this.$emit('close')
    },

    handleEdit() {
      this.$emit('edit', this.receivingData)
    },

    handleInspection() {
      this.$emit('inspection', this.receivingData)
    },

    handlePrint() {
      this.$message.info('印刷機能は開発中です')
    },

    downloadFile(file) {
      window.open(file.url)
    },

    getReceivingStatusType(status) {
      const statusMap = {
        pending: 'warning',
        partial: 'primary',
        completed: 'success'
      }
      return statusMap[status] || 'info'
    },

    getReceivingStatusText(status) {
      const statusMap = {
        pending: '未受入',
        partial: '一部受入',
        completed: '受入完了'
      }
      return statusMap[status] || status
    },

    getInspectionStatusType(status) {
      const statusMap = {
        pending: 'warning',
        in_progress: 'primary',
        passed: 'success',
        failed: 'danger',
        conditional: 'warning'
      }
      return statusMap[status] || 'info'
    },

    getInspectionStatusText(status) {
      const statusMap = {
        pending: '未検査',
        in_progress: '検査中',
        passed: '合格',
        failed: '不合格',
        conditional: '条件付合格'
      }
      return statusMap[status] || status
    },

    getLocationText(location) {
      const locationMap = {
        warehouse_1: '第1倉庫',
        warehouse_2: '第2倉庫',
        inspection_area: '検査エリア',
        temp_storage: '一時保管エリア',
        other: 'その他'
      }
      return locationMap[location] || location
    },

    getPackageTypeText(type) {
      const typeMap = {
        cardboard: '段ボール箱',
        wooden: '木箱',
        plastic: 'プラスチック箱',
        pallet: 'パレット',
        other: 'その他'
      }
      return typeMap[type] || type
    },

    getQualityCheckType(check) {
      const checkMap = {
        good: 'success',
        acceptable: 'warning',
        poor: 'danger'
      }
      return checkMap[check] || 'info'
    },

    getQualityCheckText(check) {
      const checkMap = {
        good: '良好',
        acceptable: '許容',
        poor: '不良'
      }
      return checkMap[check] || check
    },

    getPackageConditionType(condition) {
      const conditionMap = {
        good: 'success',
        damaged: 'danger',
        wet: 'warning'
      }
      return conditionMap[condition] || 'info'
    },

    getPackageConditionText(condition) {
      const conditionMap = {
        good: '良好',
        damaged: '破損',
        wet: '濡れ'
      }
      return conditionMap[condition] || condition
    },

    formatNumber(value) {
      if (value == null) return '0'
      return Number(value).toLocaleString()
    },

    formatDate(date) {
      if (!date) return '-'
      return new Date(date).toLocaleDateString('ja-JP')
    },

    formatDateTime(datetime) {
      if (!datetime) return '-'
      return new Date(datetime).toLocaleString('ja-JP')
    },

    formatFileSize(size) {
      if (!size) return '0 B'
      const units = ['B', 'KB', 'MB', 'GB']
      let index = 0
      while (size >= 1024 && index < units.length - 1) {
        size /= 1024
        index++
      }
      return `${size.toFixed(1)} ${units[index]}`
    },

    getFileIcon(fileName) {
      const extension = fileName.split('.').pop().toLowerCase()
      const iconMap = {
        pdf: 'el-icon-document',
        doc: 'el-icon-document',
        docx: 'el-icon-document',
        xls: 'el-icon-document',
        xlsx: 'el-icon-document',
        ppt: 'el-icon-document',
        pptx: 'el-icon-document',
        txt: 'el-icon-document',
        jpg: 'el-icon-picture',
        jpeg: 'el-icon-picture',
        png: 'el-icon-picture',
        gif: 'el-icon-picture',
        bmp: 'el-icon-picture',
        tif: 'el-icon-picture',
        tiff: 'el-icon-picture',
        svg: 'el-icon-picture',
        webp: 'el-icon-picture'
      }
      return iconMap[extension] || 'el-icon-document'
    }
  }
}
</script>

<style scoped>
.receiving-detail {
  padding: 0;
}

.detail-section {
  margin-bottom: 30px;
  padding: 20px;
  background-color: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 6px;
}

.detail-section h4 {
  margin: 0 0 20px 0;
  color: #2c3e50;
  font-size: 16px;
  padding-bottom: 10px;
  border-bottom: 2px solid #409eff;
}

.info-item {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.info-item label {
  font-weight: 600;
  color: #5a6c7d;
  margin-right: 10px;
  min-width: 120px;
}

.info-item .value {
  color: #2c3e50;
  font-weight: 500;
}

.info-item .value.link {
  color: #409eff;
  cursor: pointer;
  text-decoration: underline;
}

.info-item .value.link:hover {
  color: #66b1ff;
}

.quantity-card {
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  padding: 15px;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.quantity-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 8px;
}

.quantity-value {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 5px;
}

.quantity-value.order {
  color: #409eff;
}

.quantity-value.received {
  color: #67c23a;
}

.quantity-value.remaining {
  color: #e6a23c;
}

.quantity-value.rate {
  color: #909399;
}

.inspection-result {
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 12px;
  text-align: center;
}

.result-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 6px;
}

.result-value {
  font-size: 16px;
  font-weight: bold;
}

.result-value.passed {
  color: #67c23a;
}

.result-value.failed {
  color: #f56c6c;
}

.result-value.defect-rate {
  color: #e6a23c;
}

.notes-content {
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 10px;
  margin-top: 5px;
  color: #606266;
  line-height: 1.5;
}

.attachments-section {
  margin-top: 15px;
}

.attachments-section label {
  font-weight: 600;
  color: #5a6c7d;
  margin-bottom: 10px;
  display: block;
}

.file-list {
  background: white;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 10px;
}

.file-item {
  display: flex;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.file-item:last-child {
  border-bottom: none;
}

.file-item i {
  margin-right: 8px;
  color: #409eff;
  font-size: 16px;
}

.file-name {
  flex: 1;
  margin-right: 10px;
  color: #2c3e50;
}

.file-size {
  color: #909399;
  font-size: 12px;
  margin-right: 10px;
}

.action-buttons {
  text-align: right;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #e4e7ed;
}

.action-buttons .el-button {
  margin-left: 10px;
}

.el-tag {
  margin-left: 5px;
}

.attachments {
  margin-top: 15px;
}

.attachments label {
  font-weight: 600;
  color: #5a6c7d;
  margin-bottom: 10px;
  display: block;
}

.file-list {
  list-style: none;
  padding: 0;
}

.file-list li {
  display: flex;
  align-items: center;
  padding: 8px 0;
  border-bottom: 1px solid #f0f0f0;
}

.file-list li:last-child {
  border-bottom: none;
}

.file-list li i {
  margin-right: 8px;
  color: #409eff;
  font-size: 16px;
}

.file-list li span {
  flex: 1;
  margin-right: 10px;
  color: #2c3e50;
}

.file-list li .el-button {
  margin-left: 10px;
}
</style>
