<template>
  <div class="product-stock-page">
    <!-- 背景装饰 -->
    <div class="bg-decoration">
      <div class="cloud cloud-1"></div>
      <div class="cloud cloud-2"></div>
      <div class="cloud cloud-3"></div>
    </div>

    <el-card class="form-card" shadow="never">
      <div class="form-header">
        <div class="header-decoration">
          <div class="ancient-border"></div>
        </div>
        <el-icon class="form-icon">
          <Box />
        </el-icon>
        <div class="title-section">
          <h2 class="form-title">製品在庫 入出庫登録</h2>
          <p class="form-subtitle">製品在庫の入出庫・調整操作を管理</p>
        </div>
        <div class="header-decoration right">
          <div class="ancient-border"></div>
        </div>
      </div>

      <div class="elegant-divider">
        <div class="divider-line"></div>
        <div class="divider-ornament">◆</div>
        <div class="divider-line"></div>
      </div>

      <el-form :model="form" ref="formRef" label-width="120px" class="transaction-form align-form"
        label-position="left">

        <div class="form-section">
          <div class="section-title">
            <span class="section-icon">🏺</span>
            <span>基本情報</span>
          </div>

          <el-form-item label="製品" prop="target_cd" class="elegant-form-item">
            <el-select v-model="form.target_cd" filterable placeholder="製品を選択" class="elegant-select">
              <el-option v-for="item in productOptions" :key="item.cd" :label="`${item.cd}｜${item.name}`"
                :value="item.cd" />
            </el-select>
          </el-form-item>

          <el-form-item label="保管場所" prop="location_cd" class="elegant-form-item">
            <el-select v-model="form.location_cd" placeholder="保管場所を選択" class="elegant-select">
              <el-option v-for="loc in locationOptions" :key="loc.cd" :label="loc.name" :value="loc.cd" />
            </el-select>
          </el-form-item>
        </div>

        <div class="form-section">
          <div class="section-title">
            <span class="section-icon">⚖️</span>
            <span>操作詳細</span>
          </div>

          <el-form-item label="操作種別" prop="transaction_type" class="elegant-form-item">
            <div class="transaction-type-container">
              <el-radio-group v-model="form.transaction_type" class="elegant-radio-group">
                <el-radio-button value="入庫" class="type-in">入庫</el-radio-button>
                <el-radio-button value="出庫" class="type-out">出庫</el-radio-button>
                <el-radio-button value="調整" class="type-adjust">調整</el-radio-button>
                <el-radio-button value="廃棄" class="type-dispose">廃棄</el-radio-button>
                <el-radio-button value="保留" class="type-hold">保留</el-radio-button>
                <el-radio-button value="初期" class="type-init">初期</el-radio-button>
              </el-radio-group>
            </div>
          </el-form-item>

          <el-form-item label="数量" prop="quantity" class="elegant-form-item">
            <div class="quantity-unit-container">
              <el-input v-model="form.quantity" type="number" maxlength="5" class="elegant-input quantity-input"
                placeholder="数量" />
              <el-select v-model="form.unit" placeholder="単位" class="elegant-select unit-select">
                <el-option label="本" value="本" />
                <el-option label="個" value="個" />
                <el-option label="枚" value="枚" />
                <el-option label="kg" value="kg" />
                <el-option label="m" value="m" />
                <el-option label="束" value="束" />
                <el-option label="箱" value="箱" />
                <el-option label="セット" value="セット" />
              </el-select>
            </div>
          </el-form-item>
        </div>

        <div class="form-section">
          <div class="section-title">
            <span class="section-icon">📝</span>
            <span>追加情報</span>
          </div>

          <el-form-item label="備考" class="elegant-form-item">
            <el-input v-model="form.remarks" type="textarea" :rows="3" class="elegant-textarea"
              placeholder="備考を入力してください..." />
          </el-form-item>

          <el-form-item label="操作日時" prop="transaction_time" class="elegant-form-item">
            <el-date-picker v-model="form.transaction_time" type="datetime" value-format="YYYY-MM-DD HH:mm:ss"
              class="elegant-date-picker" placeholder="操作日時を選択" />
          </el-form-item>
        </div>

        <div class="form-actions">
          <el-button type="primary" @click="submit" size="large" class="elegant-btn primary-btn">
            <el-icon>
              <Check />
            </el-icon>
            <span>登録</span>
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

    <!-- 登録結果表示 -->
    <el-card v-if="todayLoggedProducts.length > 0" class="result-card" shadow="never">
      <div class="result-header">
        <div class="result-decoration">
          <div class="ancient-pattern"></div>
        </div>
        <el-icon class="result-icon">
          <Document />
        </el-icon>
        <h3 class="result-title">本日登録した製品</h3>
        <div class="result-decoration right">
          <div class="ancient-pattern"></div>
        </div>
      </div>

      <div class="table-container">
        <el-table :data="todayLoggedProducts" class="elegant-table" stripe>
          <el-table-column prop="cd" label="製品CD" width="120" />
          <el-table-column prop="name" label="製品名称" />
          <el-table-column prop="transaction_type" label="操作種別" width="120">
            <template #default="{ row }">
              <el-tag :type="getTransactionTypeColor(row.transaction_type)" class="elegant-tag">
                {{ row.transaction_type }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="quantity" label="数量" width="80" />
          <el-table-column prop="unit" label="単位" width="60" />
        </el-table>
      </div>
    </el-card>
  </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import request from '@/utils/request';
import { getProductOptions } from '@/api/options';
import type { OptionItem } from '@/types/master';
import { Box, Document, Check, Refresh } from '@element-plus/icons-vue';

// 表单数据接口
interface ProductStockForm {
  target_cd: string;
  location_cd: string;
  transaction_type: string;
  quantity: number;
  unit: string;
  related_doc_type: string;
  related_doc_no: string;
  remarks: string;
  transaction_time: string;
}

// 今日已登録项接口
interface LoggedProduct extends OptionItem {
  transaction_type: string;
  quantity: number;
  unit: string;
}

// 获取本地时间字符串，格式：YYYY-MM-DD HH:mm:ss
function getLocalDateTimeString() {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return `${y}-${m}-${d} ${hh}:${mm}:${ss}`;
}

// 初始表单值工厂
const createInitialForm = (): ProductStockForm => ({
  target_cd: '',
  location_cd: '製品倉庫',
  transaction_type: '',
  quantity: 0,
  unit: '本',
  related_doc_type: '',
  related_doc_no: '',
  remarks: '',
  transaction_time: getLocalDateTimeString(), // 用本地时间字符串
});

const formRef = ref<InstanceType<typeof import('element-plus').ElForm>>();
const form = ref<ProductStockForm>(createInitialForm());

const rules = {
  target_cd: [{ required: true, message: '製品を選択してください', trigger: 'change' }],
  location_cd: [{ required: true, message: '保管場所を選択してください', trigger: 'change' }],
  transaction_type: [{ required: true, message: '操作種別を選択してください', trigger: 'change' }],
  quantity: [{ required: true, message: '数量を入力してください', trigger: 'blur' }],
  transaction_time: [{ required: true, message: '操作日時を選択してください', trigger: 'change' }],
};

const productOptions = ref<OptionItem[]>([]);
const locationOptions = ref<OptionItem[]>([
  { cd: '製品倉庫', name: '製品倉庫' },
  { cd: '仮設倉庫', name: '仮設倉庫' },
  { cd: '部品倉庫', name: '部品倉庫' },
  { cd: '仕上倉庫', name: '仕上倉庫' },
  { cd: 'メッキ倉庫', name: 'メッキ倉庫' },
  { cd: '工程中間在庫', name: '工程中間在庫' },
  { cd: '材料置場', name: '材料置場' },
  { cd: 'その他', name: 'その他' },
]);

// 当日已登録的产品列表（含种类与数量）
const todayLoggedProducts = ref<LoggedProduct[]>([]);

onMounted(async () => {
  productOptions.value = await getProductOptions();
});

const submit = async () => {
  try {
    await formRef.value!.validate();
  } catch {
    ElMessage.warning('必須項目を確認してください');
    return;
  }

  try {
    await request.post('/api/stock/transaction', {
      stock_type: '製品',
      process_cd: 'KT13',
      ...form.value,
    });
    ElMessage.success('在庫履歴を登録しました');

    // 仅记录当天的登记
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const todayYMD = `${y}-${m}-${d}`;
    const loggedDate = form.value.transaction_time.slice(0, 10);

    if (loggedDate === todayYMD) {
      const base = productOptions.value.find(p => p.cd === form.value.target_cd);
      if (base && !todayLoggedProducts.value.some(p => p.cd === base.cd && p.transaction_type === form.value.transaction_type && p.quantity === form.value.quantity && p.unit === form.value.unit)) {
        todayLoggedProducts.value.push({
          cd: base.cd,
          name: base.name,
          transaction_type: form.value.transaction_type,
          quantity: form.value.quantity,
          unit: form.value.unit,
        });
      }
    }

    resetForm();
  } catch {
    ElMessage.error('登録中にエラーが発生しました');
  }
};

const resetForm = () => {
  formRef.value!.resetFields();
  form.value = createInitialForm();
};

// 添加获取操作类型颜色的方法
const getTransactionTypeColor = (type: string): 'success' | 'primary' | 'warning' | 'info' | 'danger' | undefined => {
  const colorMap: { [key: string]: 'success' | 'primary' | 'warning' | 'info' | 'danger' } = {
    '入庫': 'success',
    '出庫': 'warning',
    '調整': 'info',
    '廃棄': 'danger',
    '初期': 'primary'
  };
  return colorMap[type];
};
</script>

<style scoped>
/* 页面整体布局 */
.product-stock-page {
  min-height: 100vh;
  background: linear-gradient(135deg,
      #f8f4e6 0%,
      #f5f0e8 25%,
      #f2ede9 50%,
      #efe9ea 75%,
      #ece6eb 100%);
  position: relative;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 1000px;
  margin: 0 auto;
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

@keyframes float {

  0%,
  100% {
    transform: translateY(0px) translateX(0px);
  }

  25% {
    transform: translateY(-10px) translateX(5px);
  }

  50% {
    transform: translateY(0px) translateX(10px);
  }

  75% {
    transform: translateY(10px) translateX(5px);
  }
}

/* 主卡片样式 */
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
  padding: 32px;
  position: relative;
  z-index: 1;
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

/* 表单头部 */
.form-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 24px;
  position: relative;
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

.form-icon {
  font-size: 2.5rem;
  color: #daa520;
  background: linear-gradient(135deg, #fff8dc 0%, #f5deb3 100%);
  border-radius: 50%;
  padding: 12px;
  box-shadow:
    0 4px 12px rgba(218, 165, 32, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  border: 2px solid rgba(218, 165, 32, 0.3);
}

.title-section {
  text-align: center;
}

.form-title {
  font-size: 1.8rem;
  font-weight: 700;
  color: #8b4513;
  margin: 0 0 4px 0;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  letter-spacing: 1px;
}

.form-subtitle {
  font-size: 1rem;
  color: #a0522d;
  margin: 0;
  font-weight: 400;
  opacity: 0.8;
}

/* 优雅分割线 */
.elegant-divider {
  display: flex;
  align-items: center;
  margin: 24px 0;
  gap: 12px;
}

.divider-line {
  flex: 1;
  height: 1px;
  background: linear-gradient(90deg,
      transparent 0%,
      rgba(218, 165, 32, 0.3) 50%,
      transparent 100%);
}

.divider-ornament {
  color: #daa520;
  font-size: 1.2rem;
  font-weight: bold;
}

/* 表单区域 */
.transaction-form {
  position: relative;
}

.form-section {
  margin-bottom: 32px;
  padding: 24px;
  background: rgba(255, 255, 255, 0.4);
  border-radius: 16px;
  border: 1px solid rgba(218, 165, 32, 0.1);
  backdrop-filter: blur(5px);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  color: #8b4513;
  margin-bottom: 20px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(218, 165, 32, 0.2);
}

.section-icon {
  font-size: 1.2rem;
}

/* 表单项样式 */
.elegant-form-item {
  margin-bottom: 20px;
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
}

.elegant-textarea :deep(.el-textarea__inner):hover,
.elegant-textarea :deep(.el-textarea__inner):focus {
  border-color: #daa520;
  box-shadow:
    0 4px 12px rgba(218, 165, 32, 0.2);
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

.elegant-radio-group :deep(.el-radio-button) {
  margin: 0;
}

.elegant-radio-group :deep(.el-radio-button__inner) {
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(218, 165, 32, 0.3);
  border-radius: 20px;
  padding: 8px 16px;
  color: #8b4513;
  font-weight: 500;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
}

.elegant-radio-group :deep(.el-radio-button__inner):hover {
  background: rgba(218, 165, 32, 0.1);
  border-color: #daa520;
  transform: translateY(-1px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.elegant-radio-group :deep(.el-radio-button__orig-radio:checked + .el-radio-button__inner) {
  background: linear-gradient(135deg, #daa520 0%, #b8860b 100%);
  border-color: #daa520;
  color: white;
  box-shadow:
    0 4px 12px rgba(218, 165, 32, 0.4),
    inset 0 1px 0 rgba(255, 255, 255, 0.3);
}

/* 数量和单位容器 */
.quantity-unit-container {
  display: flex;
  gap: 12px;
  align-items: center;
}

.quantity-input {
  flex: 2;
  min-width: 120px;
}

.unit-select {
  flex: 1;
  min-width: 100px;
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
  padding: 24px;
  position: relative;
  z-index: 1;
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
  align-items: center;
  justify-content: center;
  gap: 16px;
  margin-bottom: 20px;
}

.result-decoration {
  flex: 1;
  display: flex;
  justify-content: center;
}

.result-decoration.right {
  transform: scaleX(-1);
}

.ancient-pattern {
  width: 60px;
  height: 2px;
  background: linear-gradient(90deg,
      transparent 0%,
      #409eff 50%,
      transparent 100%);
  position: relative;
}

.ancient-pattern::before {
  content: '';
  position: absolute;
  top: -2px;
  left: 50%;
  transform: translateX(-50%);
  width: 6px;
  height: 6px;
  background: #409eff;
  border-radius: 50%;
}

.result-icon {
  font-size: 2rem;
  color: #409eff;
  background: linear-gradient(135deg, #e3f0ff 0%, #cce7ff 100%);
  border-radius: 50%;
  padding: 10px;
  box-shadow:
    0 4px 12px rgba(64, 158, 255, 0.3),
    inset 0 1px 0 rgba(255, 255, 255, 0.8);
  border: 2px solid rgba(64, 158, 255, 0.3);
}

.result-title {
  font-size: 1.4rem;
  font-weight: 600;
  color: #2c5aa0;
  margin: 0;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
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

/* 响应式设计 */
@media (max-width: 768px) {
  .product-stock-page {
    padding: 12px;
    gap: 16px;
  }

  .form-card,
  .result-card {
    padding: 20px;
  }

  .form-section {
    padding: 16px;
    margin-bottom: 20px;
  }

  .form-header {
    flex-direction: column;
    gap: 12px;
  }

  .header-decoration {
    display: none;
  }

  .elegant-radio-group {
    flex-direction: column;
  }

  .quantity-unit-container {
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
}

@media (max-width: 480px) {
  .form-title {
    font-size: 1.4rem;
  }

  .form-subtitle {
    font-size: 0.9rem;
  }

  .section-title {
    font-size: 1rem;
  }
}
</style>
