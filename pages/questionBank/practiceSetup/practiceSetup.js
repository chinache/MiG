var questionBank = require('../../../utils/questionBank')
var storage = require('../../../utils/questionStorage')

Page({
  data: {
    modes: [
      { key: 'sequential', name: '顺序练习', desc: '按题库顺序连续作答' },
      { key: 'random', name: '随机练习', desc: '打乱题目顺序练习' },
      { key: 'category', name: '专项练习', desc: '按分类集中练习' },
      { key: 'unanswered', name: '未做题', desc: '只练尚未作答的题目' },
      { key: 'wrong', name: '错题重练', desc: '重新练习错题本' },
      { key: 'favorite', name: '收藏题练习', desc: '练习已收藏的题目' }
    ],
    selectedMode: 'sequential',
    banks: [],
    categories: [],
    bankIndex: 0,
    categoryIndex: 0,
    availableCount: 0
  },

  onLoad: function (options) {
    var banks = ['全部题库'].concat(questionBank.getBanks())
    var categories = ['全部分类'].concat(questionBank.getCategories())
    var categoryIndex = 0

    if (options && options.category) {
      var targetCategory = decodeURIComponent(options.category)
      var targetIndex = categories.indexOf(targetCategory)
      if (targetIndex !== -1) {
        categoryIndex = targetIndex
        this.setData({ selectedMode: 'category' })
      }
    }

    this.setData({ banks: banks, categories: categories, categoryIndex: categoryIndex })
    this.updateCount()
  },

  selectMode: function (event) {
    this.setData({ selectedMode: event.currentTarget.dataset.key })
    this.updateCount()
  },

  onBankChange: function (event) {
    this.setData({ bankIndex: Number(event.detail.value) })
    this.updateCount()
  },

  onCategoryChange: function (event) {
    this.setData({ categoryIndex: Number(event.detail.value) })
    this.updateCount()
  },

  getQuestionIds: function () {
    var mode = this.data.selectedMode
    var questions = questionBank.filterQuestions({
      bank: this.data.banks[this.data.bankIndex],
      category: mode === 'category' ? this.data.categories[this.data.categoryIndex] : ''
    })

    if (mode === 'wrong') {
      var wrongMap = {}
      storage.getWrongIds().forEach(function (id) { wrongMap[id] = true })
      questions = questions.filter(function (question) { return wrongMap[question.id] })
    } else if (mode === 'favorite') {
      var favoriteMap = {}
      storage.getFavorites().forEach(function (id) { favoriteMap[id] = true })
      questions = questions.filter(function (question) { return favoriteMap[question.id] })
    } else if (mode === 'unanswered') {
      var answeredMap = {}
      storage.getAnsweredIds().forEach(function (id) { answeredMap[id] = true })
      questions = questions.filter(function (question) { return !answeredMap[question.id] })
    }

    if (mode === 'random') {
      questions = questionBank.shuffleQuestions(questions)
    }

    return questions.map(function (question) { return question.id })
  },

  updateCount: function () {
    this.setData({ availableCount: this.getQuestionIds().length })
  },

  startPractice: function () {
    var questionIds = this.getQuestionIds()
    if (!questionIds.length) {
      wx.showToast({ title: '当前条件下暂无题目', icon: 'none' })
      return
    }

    var selectedMode = this.data.selectedMode
    var mode = this.data.modes.filter(function (item) { return item.key === selectedMode })[0]
    storage.setPracticeQueue(questionIds)
    wx.navigateTo({
      url: '/pages/questionBank/practice/practice?mode=' + selectedMode + '&modeName=' + encodeURIComponent(mode.name)
    })
  }
})
