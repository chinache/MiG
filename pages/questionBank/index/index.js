var questionBank = require('../../../utils/questionBank')

Page({
  data: {
    coreEntries: [
      { key: 'search', name: '搜题', desc: '题干、选项与解析', icon: '搜', url: '/pages/questionBank/search/search' },
      { key: 'practice', name: '练习', desc: '顺序、随机与专项', icon: '练', url: '/pages/questionBank/practiceSetup/practiceSetup' },
      { key: 'exam', name: '模拟考试', desc: '灵活组卷与计时', icon: '考', url: '/pages/questionBank/examSetup/examSetup' },
      { key: 'wrong', name: '错题本', desc: '错题回顾与重练', icon: '错', url: '/pages/questionBank/collection/collection?mode=wrong' }
    ],
    questionCount: 0
  },

  onLoad: function () {
    this.setData({
      questionCount: questionBank.getAllQuestions().length
    })
  },

  goPage: function (event) {
    wx.navigateTo({ url: event.currentTarget.dataset.url })
  },

  goSearch: function () {
    wx.navigateTo({ url: '/pages/questionBank/search/search' })
  }
})
