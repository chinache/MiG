var format = require('../../utils/format')

var GOLD_PAY_PER_GRAM = 8
var DEFAULT_GRAM_WEIGHT = '100'

function calculateGoldSalary(weight) {
  return Number((Number(weight) * GOLD_PAY_PER_GRAM).toFixed(2))
}

Page({
  data: {
    gramWeight: DEFAULT_GRAM_WEIGHT,
    resultVisible: false,
    resultAmount: '0.00',
    calculatedWeight: '',
    calculatedTime: ''
  },

  onWeightInput: function (event) {
    this.setData({
      gramWeight: event.detail.value,
      resultVisible: false
    })
  },

  validateWeight: function () {
    var rawValue = this.data.gramWeight
    var isEmpty = rawValue === undefined || rawValue === null || rawValue === ''

    if (isEmpty) {
      return '请输入正确的黄金克重'
    }

    var numberValue = Number(rawValue)
    if (isNaN(numberValue) || numberValue <= 0) {
      return '请输入正确的黄金克重'
    }

    return ''
  },

  startCalc: function () {
    var error = this.validateWeight()
    if (error) {
      wx.showToast({ title: error, icon: 'none' })
      return
    }

    var gramWeight = Number(this.data.gramWeight)
    var salary = calculateGoldSalary(gramWeight)

    this.setData({
      resultVisible: true,
      resultAmount: format.formatMoney(salary),
      calculatedWeight: gramWeight,
      calculatedTime: format.formatDateTime(new Date())
    })
  }
})
