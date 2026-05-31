var formulas = require('../../utils/formulas')
var format = require('../../utils/format')

Page({
  data: {
    resultPayload: null,
    product: {},
    totalText: '0.00',
    items: [],
    inputRows: []
  },

  onLoad: function () {
    this.loadResult()
  },

  onShow: function () {
    this.loadResult()
  },

  loadResult: function () {
    var payload = wx.getStorageSync('lastCalcResult')
    if (!payload || !payload.result) {
      wx.showToast({ title: '暂无测算结果', icon: 'none' })
      return
    }

    var product = formulas.findProductConfig(payload.productKey)
    var inputRows = this.buildInputRows(product, payload.formData || {})
    var items = (payload.result.items || []).map(function (item) {
      return {
        name: item.name,
        formula: item.formula,
        amountText: format.formatMoney(item.amount)
      }
    })

    this.setData({
      resultPayload: payload,
      product: product,
      totalText: format.formatMoney(payload.result.total),
      items: items,
      inputRows: inputRows
    })
  },

  buildInputRows: function (product, formData) {
    return (product.fields || []).map(function (field) {
      var value = formData[field.key]
      var displayValue = value === undefined || value === '' ? '未填写' : value + field.unit
      if (field.type === 'money' && value !== undefined && value !== '') {
        displayValue = value + '元（约' + format.formatWan(value) + '万元）'
      }
      return {
        label: field.label,
        value: displayValue
      }
    })
  },

  backCalc: function () {
    wx.navigateBack({
      delta: 1,
      fail: function () {
        wx.navigateTo({ url: '/pages/calc/calc' })
      }
    })
  },

  goHome: function () {
    wx.reLaunch({
      url: '/pages/index/index'
    })
  }
})
