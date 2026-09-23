var KEYS = {
  favorites: 'questionBankFavorites',
  wrongBook: 'questionBankWrongBook',
  answered: 'questionBankAnswered',
  practiceRecords: 'questionBankPracticeRecords',
  examRecords: 'questionBankExamRecords',
  lastExamResult: 'questionBankLastExamResult',
  practiceQueue: 'questionBankPracticeQueue'
}

function read(key, fallback) {
  var value = wx.getStorageSync(key)
  return value === undefined || value === null || value === '' ? fallback : value
}

function write(key, value) {
  wx.setStorageSync(key, value)
  return value
}

function uniqueIds(ids) {
  var result = []
  var idMap = {}
  ;(ids || []).forEach(function (id) {
    var value = String(id)
    if (!idMap[value]) {
      idMap[value] = true
      result.push(value)
    }
  })
  return result
}

function getFavorites() {
  return uniqueIds(read(KEYS.favorites, []))
}

function isFavorite(questionId) {
  return getFavorites().indexOf(String(questionId)) !== -1
}

function toggleFavorite(questionId) {
  var questionKey = String(questionId)
  var favorites = getFavorites()
  var index = favorites.indexOf(questionKey)
  var favorite = index === -1

  if (favorite) {
    favorites.unshift(questionKey)
  } else {
    favorites.splice(index, 1)
  }

  write(KEYS.favorites, favorites)
  return favorite
}

function getWrongBook() {
  return read(KEYS.wrongBook, {}) || {}
}

function addWrong(questionId, source) {
  var questionKey = String(questionId)
  var wrongBook = getWrongBook()
  var oldRecord = wrongBook[questionKey] || {}
  wrongBook[questionKey] = {
    questionId: questionKey,
    count: Number(oldRecord.count || 0) + 1,
    source: source || 'practice',
    lastWrongAt: Date.now()
  }
  write(KEYS.wrongBook, wrongBook)
  return wrongBook[questionKey]
}

function removeWrong(questionId) {
  var wrongBook = getWrongBook()
  delete wrongBook[String(questionId)]
  write(KEYS.wrongBook, wrongBook)
}

function getWrongIds() {
  var wrongBook = getWrongBook()
  return Object.keys(wrongBook).sort(function (left, right) {
    return Number(wrongBook[right].lastWrongAt || 0) - Number(wrongBook[left].lastWrongAt || 0)
  })
}

function getAnsweredIds() {
  return uniqueIds(read(KEYS.answered, []))
}

function markAnswered(questionId) {
  var answered = getAnsweredIds()
  var questionKey = String(questionId)
  if (answered.indexOf(questionKey) === -1) {
    answered.push(questionKey)
    write(KEYS.answered, answered)
  }
}

function prependRecord(key, record, limit) {
  var records = read(key, []) || []
  records.unshift(record)
  return write(key, records.slice(0, limit || 50))
}

function savePracticeRecord(record) {
  return prependRecord(KEYS.practiceRecords, record, 50)
}

function getPracticeRecords() {
  return read(KEYS.practiceRecords, []) || []
}

function saveExamRecord(record) {
  write(KEYS.lastExamResult, record)
  return prependRecord(KEYS.examRecords, record, 30)
}

function getExamRecords() {
  return read(KEYS.examRecords, []) || []
}

function getLastExamResult() {
  return read(KEYS.lastExamResult, null)
}

function setPracticeQueue(questionIds) {
  return write(KEYS.practiceQueue, uniqueIds(questionIds))
}

function getPracticeQueue() {
  return uniqueIds(read(KEYS.practiceQueue, []))
}

function formatRecordTime(timestamp) {
  var target = new Date(Number(timestamp) || Date.now())
  function pad(value) { return value < 10 ? '0' + value : String(value) }
  return target.getFullYear() + '-' + pad(target.getMonth() + 1) + '-' + pad(target.getDate()) + ' ' + pad(target.getHours()) + ':' + pad(target.getMinutes())
}

module.exports = {
  KEYS: KEYS,
  getFavorites: getFavorites,
  isFavorite: isFavorite,
  toggleFavorite: toggleFavorite,
  getWrongBook: getWrongBook,
  addWrong: addWrong,
  removeWrong: removeWrong,
  getWrongIds: getWrongIds,
  getAnsweredIds: getAnsweredIds,
  markAnswered: markAnswered,
  savePracticeRecord: savePracticeRecord,
  getPracticeRecords: getPracticeRecords,
  saveExamRecord: saveExamRecord,
  getExamRecords: getExamRecords,
  getLastExamResult: getLastExamResult,
  setPracticeQueue: setPracticeQueue,
  getPracticeQueue: getPracticeQueue,
  formatRecordTime: formatRecordTime
}
