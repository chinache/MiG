var formulas = require('../../utils/formulas')
var format = require('../../utils/format')

var STORAGE_KEY = 'lastCalcInput'

function copyWithExtra(source, extra) {
  var target = {}
  var key
  for (key in source) {
    if (Object.prototype.hasOwnProperty.call(source, key)) {
      target[key] = source[key]
    }
  }
  for (key in extra) {
    if (Object.prototype.hasOwnProperty.call(extra, key)) {
      target[key] = extra[key]
    }
  }
  return target
}

function buildProducts(activeProductKey) {
  return formulas.productConfigs.map(function (product) {
    return copyWithExtra(product, {
      active: product.key === activeProductKey,
      tabClass: product.key === activeProductKey ? 'product-tab active' : 'product-tab',
      tabStyle: product.key === activeProductKey ? 'color: ' + product.color + '; background: #eef6ff;' : ''
    })
  })
}

function buildFields(product, formData) {
  return (product.fields || []).map(function (field) {
    return copyWithExtra(field, {
      value: formData[field.key] || ''
    })
  })
}

Page({
  data: {
    products: buildProducts(formulas.productConfigs[0].key),
    activeProductKey: formulas.productConfigs[0].key,
    activeProduct: formulas.productConfigs[0],
    activeFields: buildFields(formulas.productConfigs[0], {}),
    formData: {},
    amountPreview: []
  },

  onLoad: function () {
    this.loadLastInput()
  },

  loadLastInput: function () {
    var cached = wx.getStorageSync(STORAGE_KEY)
    if (cached && cached.productKey) {
      this.applyProduct(cached.productKey, cached.formData || {})
      this.updateAmountPreview()
    }
  },

  applyProduct: function (productKey, formData) {
    var product = formulas.findProductConfig(productKey)
    var safeFormData = formData || {}
    this.setData({
      products: buildProducts(product.key),
      activeProductKey: product.key,
      activeProduct: product,
      activeFields: buildFields(product, safeFormData),
      formData: safeFormData
    })
  },

  switchProduct: function (event) {
    var key = event.currentTarget.dataset.key
    this.applyProduct(key, {})
    this.setData({ amountPreview: [] })
  },

  onInput: function (event) {
    var key = event.currentTarget.dataset.key
    var value = event.detail.value
    var formData = copyWithExtra(this.data.formData || {}, {})
    formData[key] = value

    this.setData({
      formData: formData,
      activeFields: buildFields(this.data.activeProduct, formData)
    })
    this.updateAmountPreview()
  },

  updateAmountPreview: function () {
    var fields = this.data.activeProduct.fields || []
    var formData = this.data.formData || {}
    var amountPreview = fields
      .filter(function (field) { return field.type === 'money' && formData[field.key] !== undefined && formData[field.key] !== '' })
      .map(function (field) {
        return field.label + '约 ' + format.formatWan(formData[field.key]) + ' 万元'
      })
    this.setData({ amountPreview: amountPreview })
  },

  validateForm: function () {
    var fields = this.data.activeProduct.fields || []
    var formData = this.data.formData || {}

    for (var i = 0; i < fields.length; i += 1) {
      var field = fields[i]
      var rawValue = formData[field.key]
      var isEmpty = rawValue === undefined || rawValue === null || rawValue === ''

      if (field.required && isEmpty) {
        return field.label + '不能为空'
      }

      if (!isEmpty) {
        var numberValue = Number(rawValue)
        if (isNaN(numberValue)) {
          return field.label + '必须填写数字'
        }
        if (numberValue < 0) {
          return field.label + '不能为负数'
        }
        if (field.type === 'integer' && Math.floor(numberValue) !== numberValue) {
          return field.label + '必须填写整数'
        }
      }
    }

    return ''
  },

  startCalc: function () {
    var error = this.validateForm()
    if (error) {
      wx.showToast({ title: error, icon: 'none' })
      return
    }

    var result = formulas.calculatePerformance(this.data.activeProductKey, this.data.formData)
    var resultPayload = {
      productKey: this.data.activeProductKey,
      formData: this.data.formData,
      result: result,
      time: format.formatDateTime(new Date())
    }

    wx.setStorageSync(STORAGE_KEY, {
      productKey: this.data.activeProductKey,
      formData: this.data.formData,
      savedAt: resultPayload.time
    })
    wx.setStorageSync('lastCalcResult', resultPayload)

    wx.navigateTo({
      url: '/pages/result/result'
    })
  },

  clearInput: function () {
    var self = this
    wx.showModal({
      title: '确认清空',
      content: '将清空当前输入和最近一次本地缓存，是否继续？',
      confirmText: '清空',
      confirmColor: '#dc2626',
      success: function (res) {
        if (res.confirm) {
          wx.removeStorageSync(STORAGE_KEY)
          wx.removeStorageSync('lastCalcResult')
          self.applyProduct(self.data.activeProductKey, {})
          self.setData({ amountPreview: [] })
          wx.showToast({ title: '已清空', icon: 'success' })
        }
      }
    })
  }
})
