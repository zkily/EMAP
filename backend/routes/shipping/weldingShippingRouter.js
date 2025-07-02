import express from 'express'
import * as weldingShippingService from './services/weldingShippingService.js'

const router = express.Router()

// 获取溶接产品列表
router.get('/products', weldingShippingService.getWeldingProducts)

// 获取溶接出荷数据
router.get('/data', weldingShippingService.getWeldingShippingData)

// 导出溶接出荷报告
router.post('/export', weldingShippingService.exportWeldingShippingReport)

export default router
