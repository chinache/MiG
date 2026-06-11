const { getShareAppMessage, getShareTimeline } = require('../../utils/share')
Page({
  onShareAppMessage: function () {
    return getShareAppMessage()
  },

  onShareTimeline: function () {
    return getShareTimeline()
  },

  data: {
    mascotSrc: '/assets/images/mascot-deposit.png',
    businessItems: [
      { name: '一码通', value: '1.68', icon: '码' },
      { name: '代发工资', value: '1.05', icon: '薪' },
      { name: '代扣代缴（水电费签约）', value: '1.46', icon: '扣' },
      { name: '社保卡', value: '1.02', icon: '卡' }
    ]
  },

  onMascotError: function () {
    if (this.data.mascotSrc !== '/assets/images/mascot.png') {
      this.setData({
        mascotSrc: '/assets/images/mascot.png'
      })
    }
  }
})
