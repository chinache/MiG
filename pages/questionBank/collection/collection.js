var questionBank = require('../../../utils/questionBank')
var storage = require('../../../utils/questionStorage')

function decorateQuestions(questions, expandedId) {
  return questions.map(function (question) {
    return Object.assign({}, question, {
      expanded: question.id === expandedId,
      displayOptions: question.optionList.map(function (option) {
        return Object.assign({}, option, {
          className: question.answer.indexOf(option.key) !== -1 ? 'question-option correct' : 'question-option'
        })
      })
    })
  })
}

Page({
  data: {
    mode: 'wrong',
    pageTitle: '错题本',
    emptyTitle: '还没有错题',
    emptyDesc: '练习和考试中的错题会自动保存在这里',
    scope: '',
    banks: [],
    bankIndex: 0,
    questions: [],
    expandedId: ''
  },

  onLoad: function (options) {
    var mode = options.mode === 'favorite' ? 'favorite' : 'wrong'
    var scope = mode === 'wrong' && options.scope === 'lastExam' ? 'lastExam' : ''
    this.setData({
      mode: mode,
      scope: scope,
      pageTitle: mode === 'favorite' ? '收藏题目' : (scope === 'lastExam' ? '本次错题' : '错题本'),
      emptyTitle: mode === 'favorite' ? '还没有收藏题目' : '还没有错题',
      emptyDesc: mode === 'favorite' ? '在搜题或练习时可以收藏重要题目' : '练习和考试中的错题会自动保存在这里'
    })
    wx.setNavigationBarTitle({ title: mode === 'favorite' ? '收藏题目' : (scope === 'lastExam' ? '本次错题' : '错题本') })
  },

  onShow: function () {
    this.loadQuestions()
  },

  loadQuestions: function () {
    var ids = this.data.mode === 'favorite' ? storage.getFavorites() : storage.getWrongIds()
    if (this.data.scope === 'lastExam') {
      var lastExamResult = storage.getLastExamResult()
      ids = lastExamResult ? lastExamResult.wrongIds : []
    }
    var allQuestions = questionBank.findQuestions(ids)
    var questionMap = {}
    allQuestions.forEach(function (question) { questionMap[question.id] = question })
    var questions = ids.map(function (id) { return questionMap[id] }).filter(Boolean)
    var banks = ['全部题库']
    questions.forEach(function (question) {
      if (banks.indexOf(question.bank) === -1) {
        banks.push(question.bank)
      }
    })
    var bankIndex = Math.min(this.data.bankIndex, banks.length - 1)
    var selectedBank = banks[bankIndex]
    questions = questions.filter(function (question) {
      return selectedBank === '全部题库' || question.bank === selectedBank
    })
    this.setData({
      banks: banks,
      bankIndex: bankIndex,
      questions: decorateQuestions(questions, this.data.expandedId)
    })
  },

  onBankChange: function (event) {
    this.setData({ bankIndex: Number(event.detail.value), expandedId: '' })
    this.loadQuestions()
  },

  toggleDetail: function (event) {
    var questionId = event.currentTarget.dataset.id
    var expandedId = this.data.expandedId === questionId ? '' : questionId
    this.setData({
      expandedId: expandedId,
      questions: decorateQuestions(this.data.questions, expandedId)
    })
  },

  removeQuestion: function (event) {
    var self = this
    var questionId = event.currentTarget.dataset.id
    wx.showModal({
      title: this.data.mode === 'favorite' ? '取消收藏' : '移出错题本',
      content: '确定移除这道题吗？',
      confirmText: '移除',
      success: function (result) {
        if (!result.confirm) {
          return
        }
        if (self.data.mode === 'favorite') {
          if (storage.isFavorite(questionId)) {
            storage.toggleFavorite(questionId)
          }
        } else {
          storage.removeWrong(questionId)
        }
        self.setData({ expandedId: '' })
        self.loadQuestions()
      }
    })
  },

  startPractice: function () {
    var questionIds = this.data.questions.map(function (question) { return question.id })
    if (!questionIds.length) {
      wx.showToast({ title: '当前没有可练习的题目', icon: 'none' })
      return
    }
    storage.setPracticeQueue(questionIds)
    wx.navigateTo({
      url: '/pages/questionBank/practice/practice?mode=' + this.data.mode + '&modeName=' + encodeURIComponent(this.data.pageTitle + '练习')
    })
  }
})
