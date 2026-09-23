var pako = require('../vendor/pako_inflate.min')
var QUESTION_BUNDLE = require('../data/questionBanks/generated')
var TYPE_LABELS = {
  single: '单选题',
  multiple: '多选题',
  judge: '判断题'
}

function decodeBase64(base64Text) {
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  var cleanText = String(base64Text || '').replace(/[^A-Za-z0-9+/=]/g, '')
  var outputLength = Math.floor(cleanText.length * 3 / 4)
  if (cleanText.slice(-2) === '==') {
    outputLength -= 2
  } else if (cleanText.slice(-1) === '=') {
    outputLength -= 1
  }

  var output = new Uint8Array(outputLength)
  var outputIndex = 0
  var index
  for (index = 0; index < cleanText.length; index += 4) {
    var first = characters.indexOf(cleanText.charAt(index))
    var second = characters.indexOf(cleanText.charAt(index + 1))
    var third = characters.indexOf(cleanText.charAt(index + 2))
    var fourth = characters.indexOf(cleanText.charAt(index + 3))
    var combined = (first << 18) | (second << 12) | ((third < 0 ? 0 : third) << 6) | (fourth < 0 ? 0 : fourth)

    if (outputIndex < outputLength) output[outputIndex++] = (combined >> 16) & 255
    if (outputIndex < outputLength) output[outputIndex++] = (combined >> 8) & 255
    if (outputIndex < outputLength) output[outputIndex++] = combined & 255
  }
  return output
}

function loadQuestionSources(bundle) {
  if (Array.isArray(bundle)) {
    return bundle
  }
  if (!bundle || bundle.encoding !== 'gzip-base64' || !bundle.data) {
    throw new Error('题库运行时数据格式无效')
  }
  return JSON.parse(pako.inflate(decodeBase64(bundle.data), { to: 'string' }))
}

var QUESTION_SOURCES = loadQuestionSources(QUESTION_BUNDLE)

function copyQuestion(question) {
  var options = question.options || {}
  var optionList = Object.keys(options).sort().map(function (key) {
    return { key: key, text: options[key] }
  })

  return {
    id: String(question.id),
    type: question.type || 'single',
    typeLabel: TYPE_LABELS[question.type] || '单选题',
    stem: question.stem || '',
    options: options,
    optionList: optionList,
    answer: (question.answer || []).slice().sort(),
    answerText: (question.answer || []).slice().sort().join('、'),
    analysis: question.analysis || '',
    bank: question.bank || '未分类题库',
    category: question.category || '未分类',
    knowledgePoints: question.knowledgePoints || [],
    knowledgeText: (question.knowledgePoints || []).join('、'),
    number: question.number || String(question.id)
  }
}

function getAllQuestions() {
  var questions = []
  QUESTION_SOURCES.forEach(function (source) {
    source.forEach(function (question) {
      questions.push(copyQuestion(question))
    })
  })
  return questions
}

function findQuestion(questionId) {
  var questions = getAllQuestions()
  for (var i = 0; i < questions.length; i += 1) {
    if (questions[i].id === String(questionId)) {
      return questions[i]
    }
  }
  return null
}

function findQuestions(questionIds) {
  var idMap = {}
  ;(questionIds || []).forEach(function (id) { idMap[String(id)] = true })
  return getAllQuestions().filter(function (question) { return idMap[question.id] })
}

function buildSearchText(question) {
  var optionText = question.optionList.map(function (option) {
    return option.key + option.text
  }).join(' ')

  return [
    question.id,
    question.number,
    question.typeLabel,
    question.stem,
    optionText,
    question.answerText,
    question.analysis,
    question.bank,
    question.category,
    question.knowledgeText
  ].join(' ').toLowerCase()
}

function searchQuestions(keyword) {
  var normalizedKeyword = String(keyword || '').trim().toLowerCase()
  if (!normalizedKeyword) {
    return []
  }

  var keywords = normalizedKeyword.split(/\s+/).filter(Boolean)
  return getAllQuestions().filter(function (question) {
    var searchText = buildSearchText(question)
    return keywords.every(function (word) { return searchText.indexOf(word) !== -1 })
  })
}

function uniqueValues(fieldName) {
  var values = []
  var valueMap = {}
  getAllQuestions().forEach(function (question) {
    var value = question[fieldName]
    if (value && !valueMap[value]) {
      valueMap[value] = true
      values.push(value)
    }
  })
  return values
}

function filterQuestions(options) {
  var filter = options || {}
  return getAllQuestions().filter(function (question) {
    if (filter.bank && filter.bank !== '全部题库' && question.bank !== filter.bank) {
      return false
    }
    if (filter.category && filter.category !== '全部分类' && question.category !== filter.category) {
      return false
    }
    return true
  })
}

function shuffleQuestions(questions) {
  var result = (questions || []).slice()
  for (var i = result.length - 1; i > 0; i -= 1) {
    var randomIndex = Math.floor(Math.random() * (i + 1))
    var temporary = result[i]
    result[i] = result[randomIndex]
    result[randomIndex] = temporary
  }
  return result
}

function isSameAnswer(selected, answer) {
  return (selected || []).slice().sort().join(',') === (answer || []).slice().sort().join(',')
}

module.exports = {
  TYPE_LABELS: TYPE_LABELS,
  getAllQuestions: getAllQuestions,
  findQuestion: findQuestion,
  findQuestions: findQuestions,
  searchQuestions: searchQuestions,
  getBanks: function () { return uniqueValues('bank') },
  getCategories: function () { return uniqueValues('category') },
  filterQuestions: filterQuestions,
  shuffleQuestions: shuffleQuestions,
  isSameAnswer: isSameAnswer
}
