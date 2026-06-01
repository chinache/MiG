var format = require('../../utils/format')

var PRODUCTS = [
  { key: 'life', name: '寿险' },
  { key: 'nongxin', name: '农信保' },
  { key: 'taihui', name: '太惠保' }
]

var LIFE_OPTIONS = [
  { key: 'life3', name: '三年期缴', rate: 0.081 },
  { key: 'life5', name: '五年期缴', rate: 0.126 },
  { key: 'life10', name: '十年期缴', rate: 0.162 }
]

var NONGXIN_OPTIONS = [
  { key: 'nongxin365', name: '365', amount: 365 },
  { key: 'nongxin888', name: '888', amount: 888 },
  { key: 'nongxin1388', name: '1388', amount: 1388 }
]

var TAIHUI_OPTIONS = [
  { key: 'taihui360', name: '360', amount: 360 },
  { key: 'taihui1288', name: '1288', amount: 1288 }
]

var PRODUCT_CONFIGS = {
  life: {
    optionLabel: '交费档次',
    inputLabel: '保费金额（元）',
    placeholder: '请输入保费金额',
    inputType: 'digit',
    options: LIFE_OPTIONS
  },
  nongxin: {
    optionLabel: '保障档次',
    inputLabel: '份数',
    placeholder: '请输入份数',
    inputType: 'number',
    options: NONGXIN_OPTIONS
  },
  taihui: {
    optionLabel: '保障档次',
    inputLabel: '份数',
    placeholder: '请输入份数',
    inputType: 'number',
    options: TAIHUI_OPTIONS
  }
}

var DEFAULT_PRODUCT = 'life'

function getProductConfig(productKey) {
  return PRODUCT_CONFIGS[productKey] || PRODUCT_CONFIGS[DEFAULT_PRODUCT]
}

function getDefaultOptionKey(productKey) {
  return getProductConfig(productKey).options[0].key
}

function findOption(productKey, optionKey) {
  var options = getProductConfig(productKey).options
  for (var i = 0; i < options.length; i += 1) {
    if (options[i].key === optionKey) {
      return options[i]
    }
  }
  return options[0]
}

function sanitizeDecimalInput(value) {
  var rawValue = String(value || '')
  var result = ''
  var hasDot = false

  for (var i = 0; i < rawValue.length; i += 1) {
    var char = rawValue.charAt(i)
    if (char >= '0' && char <= '9') {
      result += char
    } else if (char === '.' && !hasDot) {
      result += char
      hasDot = true
    }
  }

  return result
}

function sanitizeIntegerInput(value) {
  var rawValue = String(value || '')
  var result = ''

  for (var i = 0; i < rawValue.length; i += 1) {
    var char = rawValue.charAt(i)
    if (char >= '0' && char <= '9') {
      result += char
    }
  }

  return result
}

function isPositiveNumber(value) {
  if (value === undefined || value === null || value === '') {
    return false
  }

  var numberValue = Number(value)
  return !isNaN(numberValue) && numberValue > 0
}

function isPositiveInteger(value) {
  if (value === undefined || value === null || value === '') {
    return false
  }

  if (!/^\d+$/.test(String(value))) {
    return false
  }

  return Number(value) > 0
}

function formatMoneyWithComma(value) {
  var fixedValue = format.formatMoney(value)
  var parts = fixedValue.split('.')
  parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return parts.join('.')
}

function trimTrailingZero(value) {
  return String(value).replace(/\.0+$/, '').replace(/(\.\d*[1-9])0+$/, '$1')
}

function calculateInsuranceSalary(productKey, optionKey, inputValue) {
  var option = findOption(productKey, optionKey)
  var numberValue = Number(inputValue)
  var salary = 0
  var detail = ''

  if (productKey === 'life') {
    salary = numberValue * option.rate * 0.7
    detail = '保费金额 ' + trimTrailingZero(inputValue) + ' 元 × ' + option.name + '系数'
  } else if (productKey === 'nongxin') {
    salary = option.amount * numberValue * 0.2
    detail = option.name + ' 档 × ' + numberValue + ' 份 × 20%'
  } else {
    salary = option.amount * numberValue * 0.21
    detail = option.name + ' 档 × ' + numberValue + ' 份 × 21%'
  }

  return {
    salary: Number(salary.toFixed(2)),
    detail: detail
  }
}

Page({
  data: {
    products: PRODUCTS,
    selectedProduct: DEFAULT_PRODUCT,
    selectedOption: getDefaultOptionKey(DEFAULT_PRODUCT),
    currentOptions: getProductConfig(DEFAULT_PRODUCT).options,
    optionLabel: getProductConfig(DEFAULT_PRODUCT).optionLabel,
    inputLabel: getProductConfig(DEFAULT_PRODUCT).inputLabel,
    placeholder: getProductConfig(DEFAULT_PRODUCT).placeholder,
    inputType: getProductConfig(DEFAULT_PRODUCT).inputType,
    inputValue: '',
    resultVisible: false,
    resultAmount: '0.00',
    resultDetail: '',
    calculatedTime: ''
  },

  onProductTap: function (event) {
    var productKey = event.currentTarget.dataset.key
    var config = getProductConfig(productKey)

    if (productKey === this.data.selectedProduct) {
      return
    }

    this.setData({
      selectedProduct: productKey,
      selectedOption: getDefaultOptionKey(productKey),
      currentOptions: config.options,
      optionLabel: config.optionLabel,
      inputLabel: config.inputLabel,
      placeholder: config.placeholder,
      inputType: config.inputType,
      inputValue: '',
      resultVisible: false,
      resultAmount: '0.00',
      resultDetail: '',
      calculatedTime: ''
    })
  },

  onOptionTap: function (event) {
    var optionKey = event.currentTarget.dataset.key

    if (optionKey === this.data.selectedOption) {
      return
    }

    this.setData({
      selectedOption: optionKey,
      resultVisible: false,
      resultAmount: '0.00',
      resultDetail: '',
      calculatedTime: ''
    })
  },

  onInput: function (event) {
    var value = this.data.selectedProduct === 'life'
      ? sanitizeDecimalInput(event.detail.value)
      : sanitizeIntegerInput(event.detail.value)

    this.setData({
      inputValue: value,
      resultVisible: false,
      resultAmount: '0.00',
      resultDetail: '',
      calculatedTime: ''
    })

    return { value: value }
  },

  validateForm: function () {
    if (this.data.selectedProduct === 'life') {
      if (!isPositiveNumber(this.data.inputValue)) {
        return '请输入正确的保费金额'
      }
      return ''
    }

    if (!isPositiveInteger(this.data.inputValue)) {
      return '请输入正确的份数'
    }

    return ''
  },

  startCalc: function () {
    var error = this.validateForm()
    if (error) {
      wx.showToast({ title: error, icon: 'none' })
      return
    }

    var result = calculateInsuranceSalary(
      this.data.selectedProduct,
      this.data.selectedOption,
      this.data.inputValue
    )

    this.setData({
      resultVisible: true,
      resultAmount: formatMoneyWithComma(result.salary),
      resultDetail: result.detail,
      calculatedTime: format.formatDateTime(new Date())
    })
  }
})
