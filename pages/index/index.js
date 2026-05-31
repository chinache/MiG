Page({
  data: {
    businessEntries: [
      {
        key: 'loan',
        name: '贷款薪酬',
        desc: '进入贷款薪酬基础页面',
        icon: '贷',
        theme: 'blue',
        url: '/pages/loan/loan'
      },
      {
        key: 'deposit',
        name: '存款薪酬',
        desc: '进入存款薪酬基础页面',
        icon: '存',
        theme: 'green',
        url: '/pages/deposit/deposit'
      },
      {
        key: 'insurance',
        name: '保险薪酬',
        desc: '进入保险薪酬基础页面',
        icon: '保',
        theme: 'orange',
        url: '/pages/insurance/insurance'
      },
      {
        key: 'gold',
        name: '黄金薪酬',
        desc: '进入黄金薪酬基础页面',
        icon: '金',
        theme: 'gold',
        url: '/pages/gold/gold'
      }
    ]
  },

  goBusiness: function (event) {
    var url = event.currentTarget.dataset.url

    wx.navigateTo({
      url: url
    })
  }
})
