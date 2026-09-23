var questionBank = require('../../../utils/questionBank')

Page({
  data: {
    banks: [],
    bankIndex: 0,
    countOptions: [5, 10, 20, 30, 50],
    countIndex: 0,
    timeOptions: [10, 20, 30, 45, 60],
    timeIndex: 1,
    availableCount: 0
  },

  onLoad: function () {
    var banks = ['全部题库'].concat(questionBank.getBanks())
    this.setData({ banks: banks })
    this.updateOptions()
  },

  onBankChange: function (event) {
    this.setData({ bankIndex: Number(event.detail.value), countIndex: 0 })
    this.updateOptions()
  },

  onCountChange: function (event) {
    this.setData({ countIndex: Number(event.detail.value) })
  },

  onTimeChange: function (event) {
    this.setData({ timeIndex: Number(event.detail.value) })
  },

  updateOptions: function () {
    var availableCount = questionBank.filterQuestions({ bank: this.data.banks[this.data.bankIndex] }).length
    var countOptions = [5, 10, 20, 30, 50].filter(function (count) { return count <= availableCount })
    if (!countOptions.length || countOptions[countOptions.length - 1] !== availableCount) {
      countOptions.push(availableCount)
    }
    this.setData({ availableCount: availableCount, countOptions: countOptions, countIndex: 0 })
  },

  startExam: function () {
    var bank = this.data.banks[this.data.bankIndex]
    var questionCount = this.data.countOptions[this.data.countIndex]
    var timeMinutes = this.data.timeOptions[this.data.timeIndex]
    if (!questionCount) {
      wx.showToast({ title: '当前题库暂无题目', icon: 'none' })
      return
    }
    wx.navigateTo({
      url: '/pages/questionBank/exam/exam?bank=' + encodeURIComponent(bank) + '&count=' + questionCount + '&minutes=' + timeMinutes
    })
  }
})
