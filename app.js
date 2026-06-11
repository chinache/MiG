App({
  globalData: {
    appName: '知心金算盘',
    bankName: '龙泉农商银行'
  },

  onLaunch: function () {
    wx.setStorageSync('appVersion', '1.0.0')
  }
})
