const { getShareAppMessage, getShareTimeline } = require('../../utils/share')
var format = require('../../utils/format')

var WAN_TO_YUAN = 10000
var HOUSEHOLD_PAY = 100

var LOAN_RATE_RULES = {
  increase: {
    baseRate: 4.25,
    baseCoefficient: 0.25,
    rateStep: 0.1,
    coefficientStep: 0.0125,
    minCoefficient: 0.05
  },
  decrease: {
    baseRate: 4.25,
    baseCoefficient: 0.1,
    rateStep: 0.1,
    coefficientStep: 0.0125,
    minCoefficient: 0.005
  }
}

function trimValue(value) {
  if (value === undefined || value === null) {
    return ''
  }
  return String(value).trim()
}

function isValidDecimal(value, allowNegative) {
  var pattern = allowNegative ? /^-?(\d+|\d+\.\d+|\.\d+)$/ : /^(\d+|\d+\.\d+|\.\d+)$/
  return pattern.test(value)
}

function isValidNonNegativeInteger(value) {
  return /^\d+$/.test(value)
}

function formatCoefficient(value) {
  return Number(value.toFixed(5)).toString()
}

function formatCurrency(value) {
  var numberValue = Number(value)
  if (isNaN(numberValue)) {
    numberValue = 0
  }

  var sign = numberValue < 0 ? '-' : ''
  var fixedParts = Math.abs(numberValue).toFixed(2).split('.')
  var integerPart = fixedParts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',')
  return sign + integerPart + '.' + fixedParts[1]
}

function calculatePricingCoefficient(incrementYuan, averageRate) {
  var rule = incrementYuan > 0 ? LOAN_RATE_RULES.increase : LOAN_RATE_RULES.decrease

  if (averageRate >= rule.baseRate) {
    return rule.baseCoefficient
  }

  var coefficient = rule.baseCoefficient - (rule.baseRate - averageRate) / rule.rateStep * rule.coefficientStep
  return Math.max(coefficient, rule.minCoefficient)
}

function calculateLoanSalary(incrementWan, averageRate, newHouseholds) {
  var incrementYuan = incrementWan * WAN_TO_YUAN
  var pricingCoefficient = calculatePricingCoefficient(incrementYuan, averageRate)
  var incrementSalary = incrementYuan * pricingCoefficient * 0.01
  var householdSalary = newHouseholds * HOUSEHOLD_PAY
  var totalSalary = incrementSalary + householdSalary

  return {
    incrementYuan: incrementYuan,
    pricingCoefficient: pricingCoefficient,
    incrementSalary: Number(incrementSalary.toFixed(2)),
    householdSalary: Number(householdSalary.toFixed(2)),
    totalSalary: Number(totalSalary.toFixed(2))
  }
}

Page({
  onShareAppMessage: function () {
    return getShareAppMessage()
  },

  onShareTimeline: function () {
    return getShareTimeline()
  },

  data: {
    incrementWan: '',
    averageRate: '',
    newHouseholds: '',
    resultVisible: false,
    resultAmount: '0.00',
    incrementSalaryText: '0.00',
    householdSalaryText: '0.00',
    calculatedIncrementWan: '',
    calculatedRate: '',
    calculatedHouseholds: '',
    calculatedCoefficient: '',
    calculatedTime: ''
  },

  onIncrementInput: function (event) {
    this.setData({
      incrementWan: event.detail.value,
      resultVisible: false
    })
  },

  onRateInput: function (event) {
    this.setData({
      averageRate: event.detail.value,
      resultVisible: false
    })
  },

  onHouseholdsInput: function (event) {
    var value = trimValue(event.detail.value).replace(/\D/g, '')
    this.setData({
      newHouseholds: value,
      resultVisible: false
    })
  },

  validateForm: function () {
    var incrementWan = trimValue(this.data.incrementWan)
    var averageRate = trimValue(this.data.averageRate)
    var newHouseholds = trimValue(this.data.newHouseholds)

    if (!incrementWan || !isValidDecimal(incrementWan, true)) {
      return '请输入正确的较年初增加量'
    }

    if (!averageRate || !isValidDecimal(averageRate, false)) {
      return '请输入正确的贷款平均收息率'
    }

    if (!newHouseholds || !isValidNonNegativeInteger(newHouseholds)) {
      return '请输入正确的新增户数'
    }

    return ''
  },

  startCalc: function () {
    var error = this.validateForm()
    if (error) {
      wx.showToast({ title: error, icon: 'none' })
      return
    }

    var incrementWan = Number(this.data.incrementWan)
    var averageRate = Number(this.data.averageRate)
    var newHouseholds = Number(this.data.newHouseholds)
    var result = calculateLoanSalary(incrementWan, averageRate, newHouseholds)

    this.setData({
      resultVisible: true,
      resultAmount: formatCurrency(result.totalSalary),
      incrementSalaryText: formatCurrency(result.incrementSalary),
      householdSalaryText: formatCurrency(result.householdSalary),
      calculatedIncrementWan: incrementWan,
      calculatedRate: averageRate,
      calculatedHouseholds: newHouseholds,
      calculatedCoefficient: formatCoefficient(result.pricingCoefficient),
      calculatedTime: format.formatDateTime(new Date())
    })
  }
})
