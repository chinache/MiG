const { getShareAppMessage, getShareTimeline } = require('../../utils/share')
const AUTH_VALID_DURATION = 7 * 24 * 60 * 60 * 1000
const AUTH_URL = '/pages/auth/auth'

Page({
  onShareAppMessage: function () {
    return getShareAppMessage()
  },

  onShareTimeline: function () {
    return getShareTimeline()
  },

  data: {
    hasLogo: true,
    hasMascot: true,
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
        key: 'businessDeposit',
        name: '业务带存',
        desc: '展示业务办理带动存款',
        icon: '存',
        theme: 'teal',
        url: '/pages/businessDeposit/businessDeposit'
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
      },
      {
        key: 'questionBank',
        name: '知心题库',
        desc: '搜题练习与模拟考试',
        icon: '题',
        theme: 'blue',
        url: '/pages/questionBank/index/index'
      }
    ]
  },

  onLoad: function () {
    if (wx.showShareMenu) {
      wx.showShareMenu({
        withShareTicket: false,
        menus: ['shareAppMessage', 'shareTimeline']
      })
    }

    this.authValid = this.checkAuthStatus()
  },

  onShow: function () {
    this.authValid = this.checkAuthStatus()
  },

  onReady: function () {
    if (this.authValid) {
      this.showPendingMarketingReminder()
    }
  },

  checkAuthStatus: function () {
    const authStatus = wx.getStorageSync('authStatus')
    const authTime = wx.getStorageSync('authTime')

    if (!authStatus || !authTime || Date.now() - Number(authTime) > AUTH_VALID_DURATION) {
      wx.removeStorageSync('authStatus')
      wx.removeStorageSync('authTime')
      wx.removeStorageSync('authUser')

      wx.reLaunch({
        url: AUTH_URL
      })
      return false
    }

    return true
  },

  showPendingMarketingReminder: function () {
    const pendingMarketingReminder = wx.getStorageSync('pendingMarketingReminder')

    if (!pendingMarketingReminder) {
      return
    }

    wx.removeStorageSync('pendingMarketingReminder')
    wx.showModal({
      title: '温馨提示',
      content: '今天你开口营销了吗？',
      showCancel: false,
      confirmText: '马上行动'
    })
  },

  onLogoError: function () {
    this.setData({
      hasLogo: false
    })
  },

  onMascotError: function () {
    this.setData({
      hasMascot: false
    })
  },

  goBusiness: function (event) {
    var url = event.currentTarget.dataset.url

    wx.navigateTo({
      url: url
    })
  }
})
