var storage = require('../../../utils/questionStorage')

Page({
  data: {
    activeTab: 'practice',
    tabs: [
      { key: 'practice', name: '练习记录' },
      { key: 'exam', name: '考试记录' }
    ],
    records: []
  },

  onShow: function () {
    this.loadRecords()
  },

  switchTab: function (event) {
    this.setData({ activeTab: event.currentTarget.dataset.key })
    this.loadRecords()
  },

  loadRecords: function () {
    var activeTab = this.data.activeTab
    var records = activeTab === 'practice' ? storage.getPracticeRecords() : storage.getExamRecords()
    records = records.map(function (record) {
      if (activeTab === 'practice') {
        var practiceAccuracy = record.answeredCount ? Math.round(record.correctCount / record.answeredCount * 100) : 0
        return {
          id: record.id,
          title: record.modeName,
          result: '答对 ' + record.correctCount + ' / ' + record.answeredCount + ' 题',
          detail: '正确率 ' + practiceAccuracy + '%',
          timeText: storage.formatRecordTime(record.createdAt)
        }
      }
      return {
        id: record.id,
        title: record.bank,
        result: record.score + ' 分 · 正确 ' + record.correctCount + ' 题',
        detail: '用时 ' + record.elapsedText,
        timeText: storage.formatRecordTime(record.createdAt)
      }
    })
    this.setData({ records: records })
  }
})
