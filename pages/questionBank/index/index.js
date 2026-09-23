var questionBank = require('../../../utils/questionBank')
var storage = require('../../../utils/questionStorage')

Page({
  data: {
    coreEntries: [
      { key: 'search', name: '搜题', desc: '题干、选项与解析', icon: '搜', url: '/pages/questionBank/search/search' },
      { key: 'practice', name: '练习', desc: '顺序、随机与专项', icon: '练', url: '/pages/questionBank/practiceSetup/practiceSetup' },
      { key: 'exam', name: '模拟考试', desc: '灵活组卷与计时', icon: '考', url: '/pages/questionBank/examSetup/examSetup' },
      { key: 'wrong', name: '错题本', desc: '错题回顾与重练', icon: '错', url: '/pages/questionBank/collection/collection?mode=wrong' }
    ],
    categories: [],
    recentRecords: [],
    favoriteCount: 0,
    wrongCount: 0,
    questionCount: 0
  },

  onLoad: function () {
    var questions = questionBank.getAllQuestions()
    var categoryMap = {}
    questions.forEach(function (question) {
      categoryMap[question.category] = Number(categoryMap[question.category] || 0) + 1
    })

    this.setData({
      categories: Object.keys(categoryMap).map(function (name) {
        return { name: name, count: categoryMap[name] }
      }).slice(0, 6),
      questionCount: questions.length
    })
  },

  onShow: function () {
    var recentRecords = storage.getPracticeRecords().slice(0, 3).map(function (record) {
      return {
        modeName: record.modeName,
        progressText: record.correctCount + '/' + record.answeredCount + ' 题正确',
        timeText: storage.formatRecordTime(record.createdAt)
      }
    })

    this.setData({
      recentRecords: recentRecords,
      favoriteCount: storage.getFavorites().length,
      wrongCount: storage.getWrongIds().length
    })
  },

  goPage: function (event) {
    wx.navigateTo({ url: event.currentTarget.dataset.url })
  },

  goSearch: function () {
    wx.navigateTo({ url: '/pages/questionBank/search/search' })
  },

  goCategory: function (event) {
    wx.navigateTo({
      url: '/pages/questionBank/practiceSetup/practiceSetup?category=' + encodeURIComponent(event.currentTarget.dataset.category)
    })
  }
})
