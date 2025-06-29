<template>
  <div class="stock-transaction-container">
    <!-- 背景装饰 -->
    <div class="bg-decoration">
      <div class="cloud cloud-1"></div>
      <div class="cloud cloud-2"></div>
      <div class="cloud cloud-3"></div>
      <div class="ancient-pattern pattern-1">◆</div>
      <div class="ancient-pattern pattern-2">◇</div>
      <div class="ancient-pattern pattern-3">◆</div>
    </div>

    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-decoration">
        <div class="ancient-border"></div>
      </div>
      <div class="header-content">
        <div class="header-left">
          <div class="header-icon">
            <el-icon size="32">
              <Box />
            </el-icon>
          </div>
          <div class="header-text">
            <h1 class="main-title">総合入出庫実績操作登録</h1>
            <p class="subtitle">在庫の入出庫・調整・廃棄などを一元管理</p>
          </div>
        </div>
        <div class="header-stats">
          <div class="stat-item">
            <span class="stat-value">{{ todayLoggedTransactions.length }}</span>
            <span class="stat-label">本日登録</span>
          </div>
        </div>
      </div>
      <div class="header-decoration right">
        <div class="ancient-border"></div>
      </div>
    </div>

    <!-- 主要内容区域 -->
    <div class="content-container">
      <!-- 表单卡片 -->
      <el-card class="form-card" shadow="never">
        <template #header>
          <div class="card-header">
            <div class="card-title">
              <el-icon class="title-icon">
                <Box />
              </el-icon>
              <span>入出庫操作フォーム</span>
            </div>
            <div class="card-ornament">❋</div>
          </div>
        </template>

        <el-form :model="form" :rules="rules" ref="formRef" label-width="120px" class="transaction-form"
          label-position="left">

          <!-- 基本情報セクション -->
          <div class="form-section">
            <div class="section-title">
              <span class="section-icon">🏺</span>
              <span>基本情報</span>
              <div class="section-line"></div>
            </div>

            <div class="form-row">
              <el-form-item label="在庫種別" prop="stock_type" class="elegant-form-item">
                <el-select v-model="form.stock_type" placeholder="選択してください" class="elegant-select">
                  <el-option label="製品" value="製品" />
                  <el-option label="材料" value="材料" />
                  <el-option label="部品" value="部品" />
                  <el-option label="仕掛品" value="仕掛品" />
                </el-select>
              </el-form-item>

              <el-form-item label="対象コード" prop="target_cd" class="elegant-form-item">
                <el-select v-model="form.target_cd" filterable placeholder="CDを選択" :disabled="!form.stock_type"
                  class="elegant-select">
                  <el-option v-for="item in targetOptions" :key="item.cd" :label="`${item.cd}｜${item.name}`"
                    :value="item.cd" />
                </el-select>
              </el-form-item>

              <el-form-item label="保管場所" prop="location_cd" class="elegant-form-item">
                <el-select v-model="form.location_cd" placeholder="保管場所を選択" class="elegant-select">
                  <el-option v-for="loc in locationOptions" :key="loc.cd" :label="loc.name" :value="loc.cd" />
                </el-select>
              </el-form-item>
            </div>
          </div>

          <!-- 操作情報セクション -->
          <div class="form-section">
            <div class="section-title">
              <span class="section-icon">⚖️</span>
              <span>操作情報</span>
              <div class="section-line"></div>
            </div>

            <div class="form-row">
              <el-form-item label="操作種別" prop="transaction_type" class="elegant-form-item full-width">
                <div class="transaction-type-container">
                  <el-radio-group v-model="form.transaction_type" class="elegant-radio-group">
                    <el-radio-button value="入庫" class="elegant-radio-btn">入庫</el-radio-button>
                    <el-radio-button value="出庫" class="elegant-radio-btn">出庫</el-radio-button>
                    <el-radio-button value="調整" class="elegant-radio-btn">調整</el-radio-button>
                    <el-radio-button value="廃棄" class="elegant-radio-btn">廃棄</el-radio-button>
                    <el-radio-button value="保留" class="elegant-radio-btn">保留</el-radio-button>
                    <el-radio-button value="実績" class="elegant-radio-btn">実績</el-radio-button>
                    <el-radio-button value="不良" class="elegant-radio-btn">不良</el-radio-button>
                    <el-radio-button value="初期" class="elegant-radio-btn">初期</el-radio-button>
                  </el-radio-group>
                </div>
              </el-form-item>
            </div>

            <div class="form-row">
              <el-form-item label="数量" prop="quantity" class="elegant-form-item">
                <div class="quantity-unit-container">
                  <el-input v-model="form.quantity" type="number" class="elegant-input quantity-input" maxlength="5" :min="0"
                    placeholder="数量" />
                  <el-select v-model="form.unit" placeholder="単位を選択" class="elegant-select unit-select"
                    v-if="form.stock_type !== '材料'">
                    <el-option label="本" value="本" />
                    <el-option label="kg" value="kg" />
                    <el-option label="m" value="m" />
                    <el-option label="束" value="束" />
                    <el-option label="個" value="個" />
                    <el-option label="箱" value="箱" />
                    <el-option label="その他" value="その他" />
                  </el-select>
                  <span v-else class="unit-text">束</span>
                </div>
              </el-form-item>

              <!-- 材料専用：束本数 -->
              <template v-if="form.stock_type === '材料'">
                <el-form-item label="束本数" prop="base_qty" class="elegant-form-item">
                  <div class="base-qty-container">
                    <el-input v-model="form.base_qty" type="number" placeholder="束あたりの本数" class="elegant-input base-qty-input" />
                    <span class="unit-suffix">本/束</span>
                  </div>
                </el-form-item>
              </template>
            </div>

            <!-- 仕掛品専用：工程CD -->
            <div v-if="form.stock_type === '仕掛品'" class="form-row">
              <el-form-item label="工程名" prop="process_cd" class="elegant-form-item full-width">
                <div class="process-container">
                  <el-radio-group v-model="form.process_cd" class="elegant-process-group">
                    <el-radio-button v-for="p in processOptions" :key="p.cd" :value="p.cd" class="elegant-process-btn">
                      {{ p.name }}
                    </el-radio-button>
                  </el-radio-group>
                </div>
              </el-form-item>
            </div>
          </div>

          <!-- 詳細情報セクション -->
          <div class="form-section">
            <div class="section-title">
              <span class="section-icon">📝</span>
              <span>詳細情報</span>
              <div class="section-line"></div>
            </div>

            <div class="form-row">
              <el-form-item label="備考" class="elegant-form-item full-width">
                <el-input v-model="form.remarks" type="textarea" :rows="3" placeholder="備考を入力してください"
                  class="elegant-textarea" />
              </el-form-item>
            </div>

            <div class="form-row">
              <el-form-item label="操作日時" prop="transaction_time" class="elegant-form-item">
                <el-date-picker v-model="form.transaction_time" type="datetime" value-format="YYYY-MM-DDTHH:mm:ss"
                  placeholder="操作日時を選択" class="elegant-date-picker" />
              </el-form-item>
            </div>
          </div>

          <!-- アクションボタン -->
          <div class="form-actions">
            <el-button type="primary" @click="submit" size="large" class="elegant-btn primary-btn">
              <el-icon>
                <Check />
              </el-icon>
              <span>{{ submitButtonText }}</span>
            </el-button>
            <el-button @click="resetForm" size="large" class="elegant-btn secondary-btn">
              <el-icon>
                <Refresh />
              </el-icon>
              <span>リセット</span>
            </el-button>
          </div>
        </el-form>
      </el-card>

      <!-- 登録履歴カード -->
      <transition name="slide-up" appear>
        <el-card v-if="todayLoggedTransactions.length" class="result-card" shadow="never">
          <template #header>
            <div class="result-header">
              <div class="result-decoration">
                <div class="ancient-pattern-small"></div>
              </div>
              <div class="result-title">
                <el-icon class="result-icon">
                  <Document />
                </el-icon>
                <span>本日の登録履歴</span>
              </div>
              <div class="result-badge">{{ todayLoggedTransactions.length }}件</div>
              <div class="result-decoration right">
                <div class="ancient-pattern-small"></div>
              </div>
            </div>
          </template>

          <div class="table-container">
            <el-table :data="todayLoggedTransactions" stripe class="elegant-table" :show-header="true">
              <el-table-column prop="stock_type" label="在庫種別" width="100" align="center">
                <template #default="scope">
                  <el-tag :type="getStockTypeTagType(scope.row.stock_type)" effect="light" size="small" class="elegant-tag">
                    {{ scope.row.stock_type }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="cd" label="コード" width="120" align="center" />
              <el-table-column prop="name" label="名称" min-width="140" />
              <el-table-column prop="location_cd" label="保管場所" width="120" align="center" />
              <el-table-column v-if="form.stock_type === '仕掛品'" prop="process_name" label="工程" width="120"
                align="center" />
              <el-table-column prop="transaction_type" label="操作種別" width="100" align="center">
                <template #default="scope">
                  <el-tag :type="getTransactionTypeTagType(scope.row.transaction_type)" effect="dark" size="small" class="elegant-tag">
                    {{ scope.row.transaction_type }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="quantity" label="数量" width="80" align="center" />
              <el-table-column prop="unit" label="単位" width="80" align="center" />
            </el-table>
          </div>
        </el-card>
      </transition>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, watch, computed } from 'vue';
import { ElMessage } from 'element-plus';
import request from '@/utils/request';
import {
  getProductOptions,
  getMaterialOptions,
  getComponentOptions,
  getProcessOptions,
} from '@/api/options';
import type { OptionItem } from '@/types/master';
import { Box, Document, Check, Refresh } from '@element-plus/icons-vue';

interface StockTransactionForm {
  stock_type: string;
  target_cd: string;
  location_cd: string;
  transaction_type: string;
  quantity: number;
  unit: string;
  process_cd: string;
  base_qty?: number;
  remarks: string;
  transaction_time: string;
}
interface LoggedTransaction {
  stock_type: string;
  cd: string;
  name: string;
  location_cd: string;
  process_name?: string;
  transaction_type: string;
  quantity: number;
  unit: string;
}

const formRef = ref<InstanceType<typeof import('element-plus').ElForm>>();

// 获取日本时间（JST）字符串，格式：YYYY-MM-DDTHH:mm:ss
function getJSTISOString() {
  // 获取当前的日期和时间
  const now = new Date();

  // 获取年、月、日、时、分、秒
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  // 按照ISO格式组装日期时间字符串：YYYY-MM-DDTHH:mm:ss
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

const createInitialForm = (): StockTransactionForm => ({
  stock_type: '',
  target_cd: '',
  location_cd: '',
  transaction_type: '',
  quantity: 0,
  unit: '本',
  process_cd: '',
  base_qty: 0,
  remarks: '',
  transaction_time: getJSTISOString(),
});
const form = ref<StockTransactionForm>(createInitialForm());

const rules = {
  stock_type: [{ required: true, message: '在庫種別は必須です', trigger: 'change' }],
  target_cd: [{ required: true, message: '対象コードを入力してください', trigger: 'change' }],
  location_cd: [{ required: true, message: '保管場所を入力してください', trigger: 'change' }],
  transaction_type: [{ required: true, message: '操作種別は必須です', trigger: 'change' }],
  quantity: [{ required: true, message: '数量を入力してください', trigger: 'blur' }],
  transaction_time: [{ required: true, message: '操作日時を選択してください', trigger: 'change' }],
};

const targetOptions = ref<OptionItem[]>([]);
const processOptions = ref<OptionItem[]>([]);
const locationOptions = [
  { cd: '製品倉庫', name: '製品倉庫' },
  { cd: '仮設倉庫', name: '仮設倉庫' },
  { cd: '部品倉庫', name: '部品倉庫' },
  { cd: '仕上倉庫', name: '仕上倉庫' },
  { cd: 'メッキ倉庫', name: 'メッキ倉庫' },
  { cd: '工程中間在庫', name: '工程中間在庫' },
  { cd: '材料置場', name: '材料置場' },
  { cd: 'その他', name: 'その他' },
];

const todayLoggedTransactions = ref<LoggedTransaction[]>([]);

// 添加材料详情的响应式变量
const selectedMaterial = ref<any>(null);

// 动态按钮文字
const submitButtonText = computed(() => {
  if (form.value.stock_type === '製品') return '完成';
  if (form.value.stock_type === '材料') return '材料';
  if (form.value.stock_type === '部品') return '部品';
  return '登録';
});

// 标签类型计算
const getStockTypeTagType = (type: string) => {
  switch (type) {
    case '製品': return 'primary'
    case '材料': return 'success'
    case '部品': return 'warning'
    case '仕掛品': return 'info'
    default: return 'danger'
  }
}

const getTransactionTypeTagType = (type: string) => {
  switch (type) {
    case '入庫': return 'success'
    case '出庫': return 'info'
    case '調整': return 'warning'
    case '廃棄': return 'danger'
    case '保留': return 'info'
    case '実績': return 'success'
    case '不良': return 'danger'
    case '取消': return 'info'
    case '出荷': return 'primary'
    default: return 'info'
  }
}

// 监听材料选择变化
watch(
  () => form.value.target_cd,
  async (newTargetCd) => {
    if (form.value.stock_type === '材料' && newTargetCd) {
      try {
        // 获取材料详细信息
        const response = await request.get(`/api/materials/${newTargetCd}`);
        if (response.data.success) {
          selectedMaterial.value = response.data.data;
          // 自动填充束本数，但保持可编辑
          form.value.base_qty = selectedMaterial.value.pieces_per_bundle || 0;
        }
      } catch (error) {
        console.error('获取材料信息失败:', error);
      }
    }
  }
);

watch(
  () => form.value.stock_type,
  async (type) => {
    // 切换时清空选择
    form.value.target_cd = '';
    form.value.process_cd = '';
    selectedMaterial.value = null; // 清空材料信息
    if (type === '製品') {
      targetOptions.value = await getProductOptions();
    } else if (type === '材料') {
      targetOptions.value = await getMaterialOptions();
      form.value.unit = '束';
      form.value.base_qty = 0; // 重置束本数
    } else if (type === '部品') {
      targetOptions.value = await getComponentOptions();
    } else if (type === '仕掛品') {
      // 仕掛品の場合は対象コード＝製品、工程＝工程
      targetOptions.value = await getProductOptions();
      processOptions.value = await getProcessOptions();
    } else {
      targetOptions.value = [];
    }
  }
);

const submit = async () => {
  try {
    await formRef.value!.validate();
  } catch {
    ElMessage.warning('必須項目を確認してください');
    return;
  }
  try {
    // 从JWT令牌中获取用户名
    let operatorName = '';
    const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
    if (token) {
      try {
        // JWT令牌结构: header.payload.signature，我们需要解码payload部分
        const base64Payload = token.split('.')[1];
        const payload = JSON.parse(window.atob(base64Payload));
        // 根据login.js的JWT结构，用户名在username字段
        operatorName = payload.username || payload.name || '';
      } catch (e) {
        console.error('解析JWT令牌失败', e);
      }
    }
    // 如果从JWT取不到，再尝试其他可能的存储位置
    if (!operatorName) {
      const userInfo = localStorage.getItem('userInfo');
      if (userInfo) {
        try {
          const user = JSON.parse(userInfo);
          operatorName = user.username || user.name || '';
        } catch (e) {
          console.error('解析userInfo失败', e);
        }
      }
    }
    // 根据在庫種別自动设置process_cd
    if (form.value.stock_type === '製品') {
      form.value.process_cd = 'KT13';
    } else if (form.value.stock_type === '材料') {
      form.value.process_cd = 'KT15';
    } else if (form.value.stock_type === '部品') {
      form.value.process_cd = 'KT16';
    }
    // 增加operation_label字段
    const payload = { ...form.value, operator_name: operatorName, operation_label: submitButtonText.value };
    await request.post('/api/stock/transaction', payload);
    ElMessage.success('在庫履歴を登録しました');

    // 本日分を记録
    const todayYMD = new Date().toISOString().slice(0, 10);
    if (form.value.transaction_time.startsWith(todayYMD)) {
      const base = targetOptions.value.find(t => t.cd === form.value.target_cd);
      const proc = processOptions.value.find(p => p.cd === form.value.process_cd);
      const entry: LoggedTransaction = {
        stock_type: form.value.stock_type,
        cd: form.value.target_cd,
        name: base?.name || '',
        location_cd: form.value.location_cd,
        process_name: proc?.name,
        transaction_type: form.value.transaction_type,
        quantity: form.value.quantity,
        unit: form.value.unit,
      };
      const exists = todayLoggedTransactions.value.some(x =>
        x.stock_type === entry.stock_type &&
        x.cd === entry.cd &&
        x.process_name === entry.process_name &&
        x.quantity === entry.quantity &&
        x.unit === entry.unit
      );
      if (!exists) {
        todayLoggedTransactions.value.push(entry);
      }
    }

    resetForm();
  } catch {
    ElMessage.error('登録に失敗しました');
  }
};

const resetForm = () => {
  formRef.value!.resetFields();
  form.value = createInitialForm();
};
</script>

<style scoped>
/* 页面整体布局 */
.stock-transaction-container {
  min-height: 100vh;
  background: linear-gradient(135deg,
    #f8f4e6 0%,
    #f5f0e8 25%,
    #f2ede9 50%,
    #efe9ea 75%,
    #ece6eb 100%);
  position: relative;
  overflow-x: hidden;
  padding: 20px;
}

/* 背景装饰 */
.bg-decoration {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;
}

.cloud {
  position: absolute;
  background: radial-gradient(ellipse at center, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
  border-radius: 50%;
  animation: float 20s infinite ease-in-out;
}

.cloud-1 {
  width: 200px;
  height: 100px;
  top: 10%;
  left: 10%;
  animation-delay: 0s;
}

.cloud-2 {
  width: 150px;
  height: 75px;
  top: 20%;
  right: 15%;
  animation-delay: -7s;
}

.cloud-3 {
  width: 180px;
  height: 90px;
  bottom: 30%;
  left: 20%;
  animation-delay: -14s;
}

.ancient-pattern {
  position: absolute;
  color: rgba(218, 165, 32, 0.1);
  font-size: 2rem;
  animation: rotate 30s linear infinite;
}

.pattern-1 {
  top: 15%;
  right: 20%;
  animation-delay: 0s;
}

.pattern-2 {
  bottom: 20%;
  right: 10%;
  animation-delay: -10s;
}

.pattern-3 {
  top: 60%;
  left: 5%;
  animation-delay: -20s;
}

@keyframes float {
  0%, 100% { transform: translateY(0px) translateX(0px); }
  25% { transform: translateY(-10px) translateX(5px); }
  50% { transform: translateY(0px) translateX(10px); }
  75% { transform: translateY(10px) translateX(5px); }
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 页面头部 */
.page-header {
  background: linear-gradient(145deg,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(248, 244, 230, 0.9) 100%);
  backdrop-filter: blur(20px);
  border-radius: 20px;
  padding: 24px 32px;
  margin-bottom: 24px;
  border: 1px solid rgba(218, 165, 32, 0.2);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  animation: slideInDown 0.6s ease-out;
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  max-width: 1000px;
  margin: 0 auto 24px auto;
}

.page-header::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg,
    transparent 0%,
    #daa520 20%,
    #b8860b 50%,
    #daa520 80%,
    transparent 100%);
}

.header-decoration {
  flex: 1;
  display: flex;
  justify-content: center;
}

.header-decoration.right {
  transform: scaleX(-1);
}

.ancient-border {
  width: 80px;
  height: 2px;
  background: linear-gradient(90deg,
    transparent 0%,
    #daa520 50%,
    transparent 100%);
  position: relative;
}

.ancient-border::before,
.ancient-border::after {
  content: '';
  position: absolute;
  top: -2px;
  width: 6px;
  height: 6px;
  background: #daa520;
  border-radius: 50%;
}

.ancient-border::before {
  left: 20px;
}

.ancient-border::after {
  right: 20px;
}

@keyframes slideInDown {
  from {
    opacity: 0;
    transform: translateY(-30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex: 3;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #daa520, #b8860b);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  box-shadow:
    0 4px 16px rgba(218, 165, 32, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
  animation: iconPulse 3s ease-in-out infinite;
}

@keyframes iconPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.header-text {
  flex: 1;
}

.main-title {
  font-size: 1.8rem;
  font-weight: 700;
  color: #8b4513;
  margin: 0 0 4px 0;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  letter-spacing: 1px;
}

.subtitle {
  font-size: 1rem;
  color: #a0522d;
  margin: 0;
  font-weight: 400;
  opacity: 0.8;
}

.header-stats {
  display: flex;
  gap: 16px;
}

.stat-item {
  text-align: center;
  padding: 12px 16px;
  background: linear-gradient(135deg, rgba(218, 165, 32, 0.1), rgba(184, 134, 11, 0.1));
  border-radius: 12px;
  border: 1px solid rgba(218, 165, 32, 0.2);
  min-width: 60px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.stat-value {
  display: block;
  font-size: 20px;
  font-weight: 700;
  color: #daa520;
  line-height: 1;
}

.stat-label {
  display: block;
  font-size: 12px;
  color: #8b4513;
  margin-top: 4px;
  font-weight: 500;
}

/* 主要内容区域 */
.content-container {
  max-width: 1000px;
  margin: 0 auto;
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* 表单卡片 */
.form-card {
  background: linear-gradient(145deg,
    rgba(255, 255, 255, 0.95) 0%,
    rgba(248, 244, 230, 0.9) 100%);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  border: 1px solid rgba(218, 165, 32, 0.2);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  animation: slideInUp 0.6s ease-out;
  position: relative;
  overflow: hidden;
}

.form-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg,
    transparent 0%,
    #daa520 20%,
    #b8860b 50%,
    #daa520 80%,
    transparent 100%);
}

@keyframes slideInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 0;
}

.card-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #8b4513;
  font-size: 18px;
}

.title-icon {
  color: #daa520;
  font-size: 20px;
}

.card-ornament {
  color: #daa520;
  font-size: 1.2rem;
  opacity: 0.6;
}

/* 表单样式 */
.transaction-form {
  padding: 20px 0;
}

.form-section {
  margin-bottom: 32px;
  padding: 24px;
  background: rgba(255, 255, 255, 0.4);
  border-radius: 16px;
  border: 1px solid rgba(218, 165, 32, 0.1);
  backdrop-filter: blur(5px);
  transition: all 0.3s ease;
}

.form-section:hover {
  background: rgba(255, 255, 255, 0.6);
  border-color: rgba(218, 165, 32, 0.2);
  transform: translateY(-1px);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 20px;
  font-weight: 600;
  color: #8b4513;
  font-size: 1.1rem;
  position: relative;
}

.section-icon {
  font-size: 1.2rem;
}

.section-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg,
    rgba(218, 165, 32, 0.3) 0%,
    transparent 100%);
  margin-left: 12px;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 20px;
  margin-bottom: 16px;
}

.elegant-form-item {
  margin-bottom: 0;
}

.elegant-form-item.full-width {
  grid-column: 1 / -1;
}

.elegant-form-item :deep(.el-form-item__label) {
  color: #8b4513;
  font-weight: 500;
  font-size: 0.95rem;
}

/* 输入框样式 */
.elegant-select,
.elegant-input,
.elegant-textarea,
.elegant-date-picker {
  width: 100%;
}

.elegant-select :deep(.el-input__wrapper),
.elegant-input :deep(.el-input__wrapper),
.elegant-textarea :deep(.el-textarea__inner),
.elegant-date-picker :deep(.el-input__wrapper) {
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(218, 165, 32, 0.3);
  border-radius: 12px;
  box-shadow:
    0 2px 8px rgba(0, 0, 0, 0.05),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  transition: all 0.3s ease;
}

.elegant-select :deep(.el-input__wrapper):hover,
.elegant-input :deep(.el-input__wrapper):hover,
.elegant-date-picker :deep(.el-input__wrapper):hover {
  border-color: #daa520;
  box-shadow:
    0 4px 12px rgba(218, 165, 32, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
}

.elegant-select :deep(.el-input__wrapper.is-focus),
.elegant-input :deep(.el-input__wrapper.is-focus),
.elegant-date-picker :deep(.el-input__wrapper.is-focus) {
  border-color: #daa520;
  box-shadow:
    0 0 0 2px rgba(218, 165, 32, 0.2),
    0 4px 12px rgba(218, 165, 32, 0.3);
}

.elegant-textarea :deep(.el-textarea__inner) {
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(218, 165, 32, 0.3);
  border-radius: 12px;
  transition: all 0.3s ease;
  resize: vertical;
}

.elegant-textarea :deep(.el-textarea__inner):hover,
.elegant-textarea :deep(.el-textarea__inner):focus {
  border-color: #daa520;
  box-shadow: 0 4px 12px rgba(218, 165, 32, 0.2);
}

/* 操作类型按钮组 */
.transaction-type-container {
  width: 100%;
}

.elegant-radio-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.elegant-radio-btn :deep(.el-radio-button__inner) {
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(218, 165, 32, 0.3);
  border-radius: 20px;
  padding: 8px 16px;
  color: #8b4513;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.elegant-radio-btn :deep(.el-radio-button__inner):hover {
  background: rgba(218, 165, 32, 0.1);
  border-color: #daa520;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.elegant-radio-btn :deep(.el-radio-button__orig-radio:checked + .el-radio-button__inner) {
  background: linear-gradient(135deg, #daa520 0%, #b8860b 100%);
  border-color: #daa520;
  color: white;
  box-shadow:
    0 4px 12px rgba(218, 165, 32, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

/* 数量输入区域 */
.quantity-unit-container {
  display: flex;
  align-items: center;
  gap: 12px;
  width: 100%;
}

.quantity-input {
  flex: 2;
  min-width: 120px;
}

.unit-select {
  flex: 1;
  min-width: 100px;
}

.unit-text {
  padding: 0 12px;
  color: #8b4513;
  font-size: 14px;
  font-weight: 500;
  background: rgba(218, 165, 32, 0.1);
  border-radius: 8px;
  padding: 8px 12px;
}

.base-qty-container {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
}

.base-qty-input {
  flex: 1;
  max-width: 200px;
}

.unit-suffix {
  color: #8b4513;
  font-size: 14px;
  white-space: nowrap;
  font-weight: 500;
  background: rgba(218, 165, 32, 0.1);
  border-radius: 8px;
  padding: 8px 12px;
}

/* 工程按钮 */
.process-container {
  width: 100%;
}

.elegant-process-group {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.elegant-process-btn :deep(.el-radio-button__inner) {
  border-radius: 12px;
  padding: 10px 20px;
  background: linear-gradient(135deg, #e8f0fe 60%, #d4e4fd 100%);
  color: #1a73e8;
  border: 1px solid #a4c7fd;
  font-weight: 600;
  min-width: 120px;
  text-align: center;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.elegant-process-btn :deep(.el-radio-button__inner):hover {
  background: linear-gradient(135deg, #d4e4fd 60%, #c6dcfc 100%);
  color: #1557b0;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(26, 115, 232, 0.2);
}

.elegant-process-btn :deep(.el-radio-button__orig-radio:checked + .el-radio-button__inner) {
  background: linear-gradient(135deg, #1a73e8 60%, #1557b0 100%);
  color: white;
  border-color: #1a73e8;
  box-shadow: 0 6px 16px rgba(26, 115, 232, 0.4);
}

/* 操作按钮 */
.form-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid rgba(218, 165, 32, 0.2);
}

.elegant-btn {
  padding: 12px 32px;
  border-radius: 25px;
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.3s ease;
  border: none;
  display: flex;
  align-items: center;
  gap: 8px;
}

.primary-btn {
  background: linear-gradient(135deg, #daa520 0%, #b8860b 100%);
  color: white;
  box-shadow:
    0 4px 12px rgba(218, 165, 32, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.primary-btn:hover {
  transform: translateY(-2px);
  box-shadow:
    0 6px 20px rgba(218, 165, 32, 0.5),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

.secondary-btn {
  background: rgba(255, 255, 255, 0.8);
  color: #8b4513;
  border: 1px solid rgba(218, 165, 32, 0.3);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.secondary-btn:hover {
  background: rgba(218, 165, 32, 0.1);
  border-color: #daa520;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* 结果卡片 */
.result-card {
  background: linear-gradient(145deg,
    rgba(255, 255, 255, 0.9) 0%,
    rgba(240, 248, 255, 0.85) 100%);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  border: 1px solid rgba(64, 158, 255, 0.2);
  box-shadow:
    0 8px 32px rgba(0, 0, 0, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  position: relative;
  overflow: hidden;
}

.result-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg,
    transparent 0%,
    #409eff 20%,
    #337ecc 50%,
    #409eff 80%,
    transparent 100%);
}

.result-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 0;
}

.result-decoration {
  flex: 1;
  display: flex;
  justify-content: center;
}

.result-decoration.right {
  transform: scaleX(-1);
}

.ancient-pattern-small {
  width: 40px;
  height: 2px;
  background: linear-gradient(90deg,
    transparent 0%,
    #409eff 50%,
    transparent 100%);
  position: relative;
}

.ancient-pattern-small::before {
  content: '';
  position: absolute;
  top: -2px;
  left: 50%;
  transform: translateX(-50%);
  width: 4px;
  height: 4px;
  background: #409eff;
  border-radius: 50%;
}

.result-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #2c5aa0;
  font-size: 18px;
}

.result-icon {
  color: #409eff;
  font-size: 20px;
}

.result-badge {
  background: linear-gradient(135deg, #409eff, #67c23a);
  color: white;
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.3);
}

/* 表格样式 */
.table-container {
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.elegant-table {
  border-radius: 12px;
  overflow: hidden;
}

.elegant-table :deep(.el-table__header) {
  background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%);
}

.elegant-table :deep(.el-table__header th) {
  background: transparent;
  color: #2c5aa0;
  font-weight: 600;
  border-bottom: 2px solid rgba(64, 158, 255, 0.2);
}

.elegant-table :deep(.el-table__body tr:hover) {
  background: rgba(64, 158, 255, 0.05);
}

.elegant-table :deep(.el-table__body tr.el-table__row--striped) {
  background: rgba(240, 249, 255, 0.5);
}

.elegant-tag {
  border-radius: 12px;
  font-weight: 500;
  padding: 4px 12px;
}

/* 过渡动画 */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.5s ease;
}

.slide-up-enter-from {
  opacity: 0;
  transform: translateY(30px);
}

.slide-up-leave-to {
  opacity: 0;
  transform: translateY(-30px);
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .content-container {
    padding: 0 16px;
  }

  .form-row {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}

@media (max-width: 768px) {
  .stock-transaction-container {
    padding: 12px;
  }

  .page-header {
    padding: 16px 20px;
    flex-direction: column;
    gap: 12px;
  }

  .header-decoration {
    display: none;
  }

  .header-content {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }

  .main-title {
    font-size: 1.4rem;
  }

  .subtitle {
    font-size: 0.9rem;
  }

  .form-section {
    padding: 16px;
  }

  .elegant-radio-group {
    flex-direction: column;
    gap: 8px;
  }

  .elegant-process-group {
    flex-direction: column;
    gap: 8px;
  }

  .form-actions {
    flex-direction: column;
    gap: 12px;
  }

  .elegant-btn {
    width: 100%;
    justify-content: center;
  }

  .quantity-unit-container,
  .base-qty-container {
    flex-direction: column;
    gap: 8px;
  }

  .quantity-input,
  .unit-select,
  .base-qty-input {
    max-width: 100%;
  }
}

@media (max-width: 480px) {
  .main-title {
    font-size: 1.2rem;
  }

  .subtitle {
    font-size: 0.8rem;
  }

  .form-section {
    padding: 12px;
  }

  .section-title {
    font-size: 1rem;
  }

  .elegant-btn {
    padding: 10px 24px;
    font-size: 14px;
  }
}
</style>
