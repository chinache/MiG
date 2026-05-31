Page({
  data: {
    businessEntries: [
      {
        title: '贷款薪酬',
        desc: '测算贷款业务收入',
        icon: '贷',
        theme: 'loan',
        url: '/pages/loan/loan'
      },
      {
        title: '存款薪酬',
        desc: '测算存款业务收入',
        icon: '存',
        theme: 'deposit',
        url: '/pages/deposit/deposit'
      },
      {
        title: '保险薪酬',
        desc: '测算保险业务收入',
        icon: '保',
        theme: 'insurance',
        url: '/pages/insurance/insurance'
      },
      {
        title: '黄金薪酬',
        desc: '测算黄金业务收入',
        icon: '金',
        theme: 'gold',
        url: '/pages/gold/gold'
      }
    ]
  },

  goBusiness: function (event) {
    var url = event.currentTarget.dataset.url
    if (!url) {
      return
    }
    wx.navigateTo({
      url: url
    })
  }
})
