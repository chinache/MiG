var format = require('./format')

// 产品配置集中维护区：新增产品分类时，优先在这里增加配置，再到测算页展示。
var productConfigs = [
  {
    key: 'deposit',
    name: '存款类',
    shortName: '存款',
    color: '#16a34a',
    gradient: 'linear-gradient(135deg, #e9f9ef, #f7fffb)',
    description: '日均增量 × 系数',
    fields: [
      { key: 'avgBalance', label: '日均余额', unit: '元', placeholder: '请输入日均余额', type: 'money' },
      { key: 'incrementAmount', label: '日均增量', unit: '元', placeholder: '请输入日均增量', type: 'money', required: true },
      { key: 'households', label: '业务户数', unit: '户', placeholder: '请输入业务户数', type: 'integer' }
    ]
  },
  {
    key: 'loan',
    name: '贷款类',
    shortName: '贷款',
    color: '#1677ff',
    gradient: 'linear-gradient(135deg, #eaf3ff, #f7fbff)',
    description: '贷款投放金额 × 系数',
    fields: [
      { key: 'loanAmount', label: '贷款投放金额', unit: '元', placeholder: '请输入贷款金额', type: 'money', required: true },
      { key: 'loanHouseholds', label: '贷款户数', unit: '户', placeholder: '请输入贷款户数', type: 'integer' },
      { key: 'completedCount', label: '完成数量', unit: '笔', placeholder: '请输入完成数量', type: 'integer' }
    ]
  },
  {
    key: 'insurance',
    name: '保险类',
    shortName: '保险',
    color: '#6d4aff',
    gradient: 'linear-gradient(135deg, #f0ecff, #fbfaff)',
    description: '发卡户数 × 单户奖励',
    fields: [
      { key: 'cardHouseholds', label: '发卡户数', unit: '户', placeholder: '请输入发卡户数', type: 'integer', required: true },
      { key: 'businessAmount', label: '业务金额', unit: '元', placeholder: '请输入业务金额', type: 'money' },
      { key: 'completedCount', label: '完成数量', unit: '件', placeholder: '请输入完成数量', type: 'integer' }
    ]
  },
  {
    key: 'metal',
    name: '贵金属类',
    shortName: '贵金属',
    color: '#d08a00',
    gradient: 'linear-gradient(135deg, #fff5db, #fffdf8)',
    description: '有效户数 × 单户奖励',
    fields: [
      { key: 'validHouseholds', label: '有效户数', unit: '户', placeholder: '请输入有效户数', type: 'integer', required: true },
      { key: 'businessAmount', label: '业务金额', unit: '元', placeholder: '请输入业务金额', type: 'money' },
      { key: 'completedCount', label: '完成数量', unit: '笔', placeholder: '请输入完成数量', type: 'integer' }
    ]
  }
]

// 示例系数集中维护区：后续拿到正式 Excel 公式后，建议先替换这里的系数。
var SAMPLE_RATES = {
  depositIncrementRate: 0.00008, // 存款类：日均增量每 1 元奖励 0.00008 元。
  loanAmountRate: 0.00012, // 贷款类：贷款投放金额每 1 元奖励 0.00012 元。
  insurancePerHousehold: 35, // 保险类：每个发卡户奖励 35 元。
  metalPerHousehold: 28 // 贵金属类：每个有效户奖励 28 元。
}

function findProductConfig(productKey) {
  for (var i = 0; i < productConfigs.length; i += 1) {
    if (productConfigs[i].key === productKey) {
      return productConfigs[i]
    }
  }
  return productConfigs[0]
}

function getFieldValue(inputData, key) {
  return format.toNumber(inputData && inputData[key])
}

// 绩效计算总入口：页面只调用这个函数，不要把公式写到页面 JS 中。
// 后续替换正式公式时，请在 switch 分支内按产品修改计算逻辑，并保持返回结构不变。
function calculatePerformance(productKey, inputData) {
  var config = findProductConfig(productKey)
  var items = []
  var total = 0

  switch (productKey) {
    case 'deposit': {
      var incrementAmount = getFieldValue(inputData, 'incrementAmount')
      var depositPay = incrementAmount * SAMPLE_RATES.depositIncrementRate
      total += depositPay
      items.push({ name: '存款类绩效', formula: '日均增量 × 系数', amount: depositPay })
      break
    }
    case 'loan': {
      var loanAmount = getFieldValue(inputData, 'loanAmount')
      var loanPay = loanAmount * SAMPLE_RATES.loanAmountRate
      total += loanPay
      items.push({ name: '贷款类绩效', formula: '贷款投放金额 × 系数', amount: loanPay })
      break
    }
    case 'insurance': {
      var cardHouseholds = getFieldValue(inputData, 'cardHouseholds')
      var insurancePay = cardHouseholds * SAMPLE_RATES.insurancePerHousehold
      total += insurancePay
      items.push({ name: '保险类绩效', formula: '发卡户数 × 单户奖励', amount: insurancePay })
      break
    }
    case 'metal': {
      var validHouseholds = getFieldValue(inputData, 'validHouseholds')
      var metalPay = validHouseholds * SAMPLE_RATES.metalPerHousehold
      total += metalPay
      items.push({ name: '贵金属类绩效', formula: '有效户数 × 单户奖励', amount: metalPay })
      break
    }
    default:
      break
  }

  return {
    productKey: productKey,
    productName: config.name,
    total: Number(total.toFixed(2)),
    items: items.map(function (item) {
      return {
        name: item.name,
        formula: item.formula,
        amount: Number(item.amount.toFixed(2))
      }
    }),
    inputData: inputData || {}
  }
}

module.exports = {
  productConfigs: productConfigs,
  SAMPLE_RATES: SAMPLE_RATES,
  findProductConfig: findProductConfig,
  calculatePerformance: calculatePerformance
}
