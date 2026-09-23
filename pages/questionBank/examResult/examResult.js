var storage = require('../../../utils/questionStorage')

Page({
  data: {
    result: null
  },

  onLoad: function () {
    var result = storage.getLastExamResult()
    if (!result) {
      wx.showToast({ title: '暂无考试结果', icon: 'none' })
      return
    }
    this.setData({ result: result })
  },

  reviewWrong: function () {
    if (!this.data.result.wrongIds.length) {
      wx.showToast({ title: '本次没有错题', icon: 'none' })
      return
    }
    wx.navigateTo({ url: '/pages/questionBank/collection/collection?mode=wrong&scope=lastExam' })
  },

  backHome: function () {
    wx.reLaunch({ url: '/pages/questionBank/index/index' })
  }
})
