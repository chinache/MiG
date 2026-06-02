const { authorizedUsers } = require('../../utils/authorizedUsers.js')

const AUTH_VALID_DURATION = 30 * 24 * 60 * 60 * 1000
const HOME_URL = '/pages/index/index'

Page({
  data: {
    employeeNo: '',
    phoneLast4: ''
  },

  onLoad: function () {
    this.redirectIfAuthed()
  },

  onShow: function () {
    this.redirectIfAuthed()
  },

  onEmployeeNoInput: function (event) {
    this.setData({
      employeeNo: (event.detail.value || '').trim()
    })
  },

  onPhoneLast4Input: function (event) {
    this.setData({
      phoneLast4: (event.detail.value || '').trim()
    })
  },

  redirectIfAuthed: function () {
    if (this.isAuthValid()) {
      wx.reLaunch({
        url: HOME_URL
      })
    }
  },

  isAuthValid: function () {
    const authStatus = wx.getStorageSync('authStatus')
    const authTime = wx.getStorageSync('authTime')

    if (!authStatus || !authTime) {
      return false
    }

    if (Date.now() - Number(authTime) > AUTH_VALID_DURATION) {
      this.clearAuth()
      return false
    }

    return true
  },

  verifyIdentity: function () {
    const employeeNo = this.data.employeeNo.trim()
    const phoneLast4 = this.data.phoneLast4.trim()

    if (!employeeNo) {
      wx.showToast({
        title: '请输入工号',
        icon: 'none'
      })
      return
    }

    if (!phoneLast4) {
      wx.showToast({
        title: '请输入手机号后 4 位',
        icon: 'none'
      })
      return
    }

    if (!/^\d{4}$/.test(phoneLast4)) {
      wx.showToast({
        title: '手机号后 4 位必须为 4 位数字',
        icon: 'none'
      })
      return
    }

    const matchedUser = authorizedUsers.some(function (user) {
      return user.employeeNo === employeeNo && user.phoneLast4 === phoneLast4
    })

    if (!matchedUser) {
      wx.showModal({
        title: '验证失败',
        content: '信息校验失败，请确认工号和手机号后 4 位是否正确',
        showCancel: false
      })
      return
    }

    wx.setStorageSync('authStatus', true)
    wx.setStorageSync('authTime', Date.now())
    wx.setStorageSync('authUser', {
      employeeNo: employeeNo
    })

    wx.reLaunch({
      url: HOME_URL
    })
  },

  clearAuth: function () {
    wx.removeStorageSync('authStatus')
    wx.removeStorageSync('authTime')
    wx.removeStorageSync('authUser')
  }
})
