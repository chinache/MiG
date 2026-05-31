Page({
  data: {
    showBrandLogo: true,
    showMascot: true,
    businessEntries: [
      {
        key: 'loan',
        name: '贷款薪酬',
        desc: '测算贷款业务收入',
        icon: '贷',
        theme: 'blue',
        url: '/pages/loan/loan'
      },
      {
        key: 'deposit',
        name: '存款薪酬',
        desc: '测算存款业务收入',
        icon: '存',
        theme: 'green',
        url: '/pages/deposit/deposit'
      },
      {
        key: 'insurance',
        name: '保险薪酬',
        desc: '测算保险业务收入',
        icon: '保',
        theme: 'purple',
        url: '/pages/insurance/insurance'
      },
      {
        key: 'gold',
        name: '黄金薪酬',
        desc: '测算黄金业务收入',
        icon: '金',
        theme: 'gold',
        url: '/pages/gold/gold'
      }
    ]
  },

  onBrandLogoError: function () {
    this.setData({
      showBrandLogo: false
    })
  },

  onMascotError: function () {
    this.setData({
      showMascot: false
    })
  },

  goBusiness: function (event) {
    var url = event.currentTarget.dataset.url

    wx.navigateTo({
      url: url
    })
  }
})
