const SHARE_TITLE = '知心金算盘｜一键测算 更清晰'
const SHARE_PATH = '/pages/index/index'

function getShareAppMessage() {
  return {
    title: SHARE_TITLE,
    path: SHARE_PATH
  }
}

function getShareTimeline() {
  return {
    title: SHARE_TITLE,
    query: ''
  }
}

module.exports = {
  getShareAppMessage,
  getShareTimeline
}
