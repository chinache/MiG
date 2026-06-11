const { getShareAppMessage, getShareTimeline } = require('../../utils/share')
var format = require('../../utils/format')

var NEW_BASE_RATE = 0.45
var NEW_BASE_COEF = 0.55
var NEW_RATE_STEP = 0.1
var NEW_STEP_DEDUCT = 0.02
var NEW_MIN_COEF = 0.03

var DECLINE_BASE_RATE = 0.45
var DECLINE_BASE_COEF = 0.2
var DECLINE_RATE_STEP = 0.1
var DECLINE_STEP_DEDUCT = 0.02
var DECLINE_MIN_COEF = 0.01

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

function isInvalidNumberInput(value) {
  if (value === undefined || value === null || value === '') {
    return true
  }

  var numberValue = Number(value)
  return isNaN(numberValue) || numberValue < 0
}

function calculatePricingCoefficient(increaseYuan, interestRate) {
  if (increaseYuan > 0) {
    if (interestRate <= NEW_BASE_RATE) {
      return NEW_BASE_COEF
    }

    return Math.max(
      NEW_BASE_COEF - ((interestRate - NEW_BASE_RATE) / NEW_RATE_STEP) * NEW_STEP_DEDUCT,
      NEW_MIN_COEF
    )
  }

  if (interestRate <= DECLINE_BASE_RATE) {
    return DECLINE_BASE_COEF
  }

  return Math.max(
    DECLINE_BASE_RATE - ((interestRate - DECLINE_BASE_RATE) / DECLINE_RATE_STEP) * DECLINE_STEP_DEDUCT,
    DECLINE_MIN_COEF
  )
}

function calculateDepositSalary(increaseWan, interestRate) {
  var increaseYuan = Number(increaseWan) * 10000
  var pricingCoefficient = calculatePricingCoefficient(increaseYuan, Number(interestRate))
  var salary = increaseYuan * pricingCoefficient * 0.01

  return {
    increaseYuan: increaseYuan,
    pricingCoefficient: Number(pricingCoefficient.toFixed(10)),
    salary: Number(salary.toFixed(2))
  }
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

Page({
  onShareAppMessage: function () {
    return getShareAppMessage()
  },

  onShareTimeline: function () {
    return getShareTimeline()
  },

  data: {
    increaseWan: '',
    interestRate: '',
    resultVisible: false,
    resultAmount: '0.00',
    calculatedIncreaseWan: '',
    calculatedCoefficient: '',
    calculatedTime: ''
  },

  onInput: function (event) {
    var key = event.currentTarget.dataset.key
    var value = sanitizeDecimalInput(event.detail.value)
    var nextData = {
      resultVisible: false
    }
    nextData[key] = value

    this.setData(nextData)
    return { value: value }
  },

  validateForm: function () {
    if (isInvalidNumberInput(this.data.increaseWan)) {
      return '请输入正确的较年初增加量'
    }

    if (isInvalidNumberInput(this.data.interestRate)) {
      return '请输入正确的自营存款付息率'
    }

    return ''
  },

  startCalc: function () {
    var error = this.validateForm()
    if (error) {
      wx.showToast({ title: error, icon: 'none' })
      return
    }

    var increaseWan = Number(this.data.increaseWan)
    var interestRate = Number(this.data.interestRate)
    var result = calculateDepositSalary(increaseWan, interestRate)

    this.setData({
      resultVisible: true,
      resultAmount: formatMoneyWithComma(result.salary),
      calculatedIncreaseWan: trimTrailingZero(this.data.increaseWan),
      calculatedCoefficient: trimTrailingZero(result.pricingCoefficient.toFixed(2)),
      calculatedTime: format.formatDateTime(new Date())
    })
  }
})
