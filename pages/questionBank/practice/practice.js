var questionBank = require('../../../utils/questionBank')
var storage = require('../../../utils/questionStorage')

function modeOption(option, selectedAnswer, submitted, correctAnswer) {
  var selected = selectedAnswer.indexOf(option.key) !== -1
  var correct = submitted && correctAnswer.indexOf(option.key) !== -1
  var wrong = submitted && selected && !correct
  var className = 'question-option'
  if (correct) {
    className += ' correct'
  } else if (wrong) {
    className += ' wrong'
  } else if (selected) {
    className += ' selected'
  }
  return Object.assign({}, option, { className: className })
}

Page({
  data: {
    mode: 'sequential',
    modeName: '顺序练习',
    questions: [],
    currentIndex: 0,
    currentQuestion: null,
    selectedAnswer: [],
    submitted: false,
    showAnalysis: false,
    currentCorrect: false,
    answeredCount: 0,
    correctCount: 0,
    favorite: false,
    wrongSaved: false,
    progressText: '0/0'
  },

  onLoad: function (options) {
    var questionIds = options.ids
      ? decodeURIComponent(options.ids).split(',').filter(Boolean)
      : storage.getPracticeQueue()
    var questions = questionBank.findQuestions(questionIds)
    var questionMap = {}
    questions.forEach(function (question) { questionMap[question.id] = question })
    questions = questionIds.map(function (id) { return questionMap[id] }).filter(Boolean)

    if (!questions.length) {
      wx.showToast({ title: '当前没有可练习的题目', icon: 'none' })
      setTimeout(function () { wx.navigateBack() }, 600)
      return
    }

    this.setData({
      questions: questions,
      mode: options.mode || 'sequential',
      modeName: decodeURIComponent(options.modeName || '顺序练习')
    })
    this.showQuestion(0)
  },

  showQuestion: function (index) {
    var question = this.data.questions[index]
    if (!question) {
      return
    }
    var answerState = question._answerState || { selectedAnswer: [], submitted: false, showAnalysis: false, correct: false }
    question = Object.assign({}, question, {
      displayOptions: question.optionList.map(function (option) {
        return modeOption(option, answerState.selectedAnswer, answerState.submitted, question.answer)
      })
    })
    this.setData({
      currentIndex: index,
      currentQuestion: question,
      selectedAnswer: answerState.selectedAnswer,
      submitted: answerState.submitted,
      showAnalysis: answerState.showAnalysis,
      currentCorrect: answerState.correct,
      favorite: storage.isFavorite(question.id),
      wrongSaved: Boolean(storage.getWrongBook()[question.id]),
      progressText: (index + 1) + '/' + this.data.questions.length
    })
  },

  selectOption: function (event) {
    if (this.data.submitted) {
      return
    }
    var key = event.currentTarget.dataset.key
    var selectedAnswer = this.data.selectedAnswer.slice()
    if (this.data.currentQuestion.type === 'multiple') {
      var selectedIndex = selectedAnswer.indexOf(key)
      if (selectedIndex === -1) {
        selectedAnswer.push(key)
      } else {
        selectedAnswer.splice(selectedIndex, 1)
      }
    } else {
      selectedAnswer = [key]
    }
    selectedAnswer.sort()
    var currentQuestion = Object.assign({}, this.data.currentQuestion, {
      displayOptions: this.data.currentQuestion.optionList.map(function (option) {
        return modeOption(option, selectedAnswer, false, [])
      })
    })
    this.setData({ selectedAnswer: selectedAnswer, currentQuestion: currentQuestion })
  },

  submitAnswer: function () {
    if (!this.data.selectedAnswer.length) {
      wx.showToast({ title: '请先选择答案', icon: 'none' })
      return
    }
    if (this.data.submitted) {
      this.nextQuestion()
      return
    }

    var question = this.data.currentQuestion
    var correct = questionBank.isSameAnswer(this.data.selectedAnswer, question.answer)
    var questions = this.data.questions.slice()
    questions[this.data.currentIndex]._answerState = {
      selectedAnswer: this.data.selectedAnswer.slice(),
      submitted: true,
      showAnalysis: true,
      correct: correct
    }

    storage.markAnswered(question.id)
    if (!correct) {
      storage.addWrong(question.id, 'practice')
    }

    this.setData({
      questions: questions,
      answeredCount: this.data.answeredCount + 1,
      correctCount: this.data.correctCount + (correct ? 1 : 0)
    })
    this.showQuestion(this.data.currentIndex)
  },

  toggleAnalysis: function () {
    if (!this.data.submitted) {
      wx.showToast({ title: '提交答案后可查看解析', icon: 'none' })
      return
    }
    var questions = this.data.questions.slice()
    questions[this.data.currentIndex]._answerState.showAnalysis = !this.data.showAnalysis
    this.setData({ questions: questions })
    this.showQuestion(this.data.currentIndex)
  },

  toggleFavorite: function () {
    var favorite = storage.toggleFavorite(this.data.currentQuestion.id)
    this.setData({ favorite: favorite })
    wx.showToast({ title: favorite ? '已收藏' : '已取消收藏', icon: 'none' })
  },

  addToWrong: function () {
    if (this.data.wrongSaved) {
      wx.showToast({ title: '已在错题本中', icon: 'none' })
      return
    }
    storage.addWrong(this.data.currentQuestion.id, 'manual')
    this.setData({ wrongSaved: true })
    wx.showToast({ title: '已加入错题本', icon: 'none' })
  },

  previousQuestion: function () {
    if (this.data.currentIndex > 0) {
      this.showQuestion(this.data.currentIndex - 1)
    }
  },

  nextQuestion: function () {
    if (this.data.currentIndex < this.data.questions.length - 1) {
      this.showQuestion(this.data.currentIndex + 1)
    } else {
      this.finishPractice()
    }
  },

  finishPractice: function () {
    if (!this.data.answeredCount) {
      wx.showToast({ title: '还没有完成题目', icon: 'none' })
      return
    }
    storage.savePracticeRecord({
      id: 'practice-' + Date.now(),
      mode: this.data.mode,
      modeName: this.data.modeName,
      totalCount: this.data.questions.length,
      answeredCount: this.data.answeredCount,
      correctCount: this.data.correctCount,
      createdAt: Date.now()
    })
    wx.showModal({
      title: '练习完成',
      content: '已答 ' + this.data.answeredCount + ' 题，答对 ' + this.data.correctCount + ' 题',
      showCancel: false,
      confirmText: '返回题库',
      success: function () { wx.navigateBack({ delta: 2 }) }
    })
  }
})
