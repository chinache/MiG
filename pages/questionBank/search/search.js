var questionBank = require('../../../utils/questionBank')
var storage = require('../../../utils/questionStorage')

function decorateQuestion(question, expandedId) {
  return Object.assign({}, question, {
    expanded: question.id === expandedId,
    favorite: storage.isFavorite(question.id),
    displayOptions: question.optionList.map(function (option) {
      return Object.assign({}, option, {
        className: question.answer.indexOf(option.key) !== -1 ? 'question-option correct' : 'question-option'
      })
    })
  })
}

Page({
  data: {
    keyword: '',
    searched: false,
    searching: false,
    results: [],
    expandedId: ''
  },

  onInput: function (event) {
    var keyword = event.detail.value || ''
    this.setData({ keyword: keyword })
    this.queueSearch(keyword)
  },

  queueSearch: function (keyword) {
    var self = this
    if (this.searchTimer) {
      clearTimeout(this.searchTimer)
    }
    if (!String(keyword).trim()) {
      this.setData({ searched: false, searching: false, results: [], expandedId: '' })
      return
    }
    this.setData({ searching: true })
    this.searchTimer = setTimeout(function () {
      self.runSearch(keyword)
    }, 120)
  },

  runSearch: function (keyword) {
    var self = this
    var results = questionBank.searchQuestions(keyword).map(function (question) {
      return decorateQuestion(question, self.data.expandedId)
    })
    this.setData({ searched: true, searching: false, results: results })
  },

  clearSearch: function () {
    this.setData({ keyword: '', searched: false, searching: false, results: [], expandedId: '' })
  },

  toggleDetail: function (event) {
    var questionId = event.currentTarget.dataset.id
    var expandedId = this.data.expandedId === questionId ? '' : questionId
    this.setData({
      expandedId: expandedId,
      results: this.data.results.map(function (question) {
        return decorateQuestion(question, expandedId)
      })
    })
  },

  toggleFavorite: function (event) {
    var questionId = event.currentTarget.dataset.id
    var favorite = storage.toggleFavorite(questionId)
    this.setData({
      results: this.data.results.map(function (question) {
        return Object.assign({}, question, {
          favorite: question.id === questionId ? favorite : question.favorite
        })
      })
    })
    wx.showToast({ title: favorite ? '已收藏' : '已取消收藏', icon: 'none' })
  },

  onUnload: function () {
    if (this.searchTimer) {
      clearTimeout(this.searchTimer)
    }
  }
})
