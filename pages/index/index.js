Page({
  goCalc: function () {
    wx.navigateTo({
      url: '/pages/calc/calc'
    })
  },

  goAbout: function () {
    wx.navigateTo({
      url: '/pages/about/about'
    })
  }
})
