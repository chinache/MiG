var questionBank = require('../../../utils/questionBank')
var storage = require('../../../utils/questionStorage')

function formatDuration(seconds) {
  var safeSeconds = Math.max(0, Number(seconds) || 0)
  var minutes = Math.floor(safeSeconds / 60)
  var remainSeconds = safeSeconds % 60
  return (minutes < 10 ? '0' + minutes : String(minutes)) + ':' + (remainSeconds < 10 ? '0' + remainSeconds : String(remainSeconds))
}

function decorateOptions(question, selectedAnswer) {
  return question.optionList.map(function (option) {
    return Object.assign({}, option, {
      className: selectedAnswer.indexOf(option.key) !== -1 ? 'question-option selected' : 'question-option'
    })
  })
}

Page({
  data: {
    bank: '全部题库',
    questions: [],
    currentIndex: 0,
    currentQuestion: null,
    answers: {},
    answeredCount: 0,
    remainingSeconds: 0,
    remainingText: '00:00',
    answerSheetVisible: false,
    answerSheet: []
  },

  onLoad: function (options) {
    var bank = decodeURIComponent(options.bank || '全部题库')
    var questionCount = Number(options.count) || 10
    var minutes = Number(options.minutes) || 20
    var questions = questionBank.shuffleQuestions(questionBank.filterQuestions({ bank: bank })).slice(0, questionCount)

    this.startedAt = Date.now()
    this.deadlineAt = this.startedAt + minutes * 60 * 1000
    this.setData({
      bank: bank,
      questions: questions,
      remainingSeconds: minutes * 60,
      remainingText: formatDuration(minutes * 60)
    })
    this.showQuestion(0)
    this.startTimer()
  },

  startTimer: function () {
    var self = this
    this.examTimer = setInterval(function () {
      var remainingSeconds = Math.max(0, Math.ceil((self.deadlineAt - Date.now()) / 1000))
      self.setData({ remainingSeconds: remainingSeconds, remainingText: formatDuration(remainingSeconds) })
      if (remainingSeconds <= 0) {
        clearInterval(self.examTimer)
        self.examTimer = null
        self.submitExam(true)
      }
    }, 1000)
  },

  showQuestion: function (index) {
    var question = this.data.questions[index]
    if (!question) {
      return
    }
    var selectedAnswer = this.data.answers[question.id] || []
    this.setData({
      currentIndex: index,
      currentQuestion: Object.assign({}, question, {
        displayOptions: decorateOptions(question, selectedAnswer)
      })
    })
  },

  selectOption: function (event) {
    var question = this.data.currentQuestion
    var key = event.currentTarget.dataset.key
    var answers = Object.assign({}, this.data.answers)
    var selectedAnswer = (answers[question.id] || []).slice()

    if (question.type === 'multiple') {
      var optionIndex = selectedAnswer.indexOf(key)
      if (optionIndex === -1) {
        selectedAnswer.push(key)
      } else {
        selectedAnswer.splice(optionIndex, 1)
      }
    } else {
      selectedAnswer = [key]
    }
    selectedAnswer.sort()
    answers[question.id] = selectedAnswer

    this.setData({ answers: answers, answeredCount: Object.keys(answers).filter(function (id) { return answers[id].length }).length })
    this.showQuestion(this.data.currentIndex)
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
      this.toggleAnswerSheet()
    }
  },

  toggleAnswerSheet: function () {
    var answers = this.data.answers
    var currentIndex = this.data.currentIndex
    var answerSheet = this.data.questions.map(function (question, index) {
      var answered = Boolean(answers[question.id] && answers[question.id].length)
      var className = 'answer-sheet-item' + (answered ? ' answered' : '') + (index === currentIndex ? ' current' : '')
      return { index: index, number: index + 1, className: className }
    })
    this.setData({ answerSheetVisible: !this.data.answerSheetVisible, answerSheet: answerSheet })
  },

  goQuestion: function (event) {
    this.setData({ answerSheetVisible: false })
    this.showQuestion(Number(event.currentTarget.dataset.index))
  },

  noop: function () {},

  confirmSubmit: function () {
    var self = this
    var unansweredCount = this.data.questions.length - this.data.answeredCount
    wx.showModal({
      title: '确认交卷',
      content: unansweredCount ? '还有 ' + unansweredCount + ' 道题未作答，确定交卷吗？' : '题目已全部作答，确定交卷吗？',
      confirmText: '交卷',
      success: function (result) {
        if (result.confirm) {
          self.submitExam(false)
        }
      }
    })
  },

  submitExam: function (autoSubmit) {
    if (this.submitting) {
      return
    }
    this.submitting = true
    if (this.examTimer) {
      clearInterval(this.examTimer)
      this.examTimer = null
    }

    var answers = this.data.answers
    var correctCount = 0
    var wrongIds = []
    var details = this.data.questions.map(function (question) {
      var selectedAnswer = answers[question.id] || []
      var correct = questionBank.isSameAnswer(selectedAnswer, question.answer)
      storage.markAnswered(question.id)
      if (correct) {
        correctCount += 1
      } else {
        wrongIds.push(question.id)
        storage.addWrong(question.id, 'exam')
      }
      return {
        questionId: question.id,
        selectedAnswer: selectedAnswer,
        correct: correct
      }
    })

    var totalCount = this.data.questions.length
    var elapsedSeconds = Math.max(1, Math.round((Date.now() - this.startedAt) / 1000))
    var record = {
      id: 'exam-' + Date.now(),
      bank: this.data.bank,
      totalCount: totalCount,
      answeredCount: this.data.answeredCount,
      correctCount: correctCount,
      wrongCount: totalCount - correctCount,
      score: totalCount ? Math.round(correctCount / totalCount * 100) : 0,
      accuracy: totalCount ? Math.round(correctCount / totalCount * 100) : 0,
      elapsedSeconds: elapsedSeconds,
      elapsedText: formatDuration(elapsedSeconds),
      autoSubmit: Boolean(autoSubmit),
      wrongIds: wrongIds,
      details: details,
      createdAt: Date.now()
    }
    storage.saveExamRecord(record)

    wx.redirectTo({ url: '/pages/questionBank/examResult/examResult' })
  },

  onUnload: function () {
    if (this.examTimer) {
      clearInterval(this.examTimer)
    }
  }
})
