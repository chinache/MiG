function toNumber(value) {
  if (value === '' || value === null || value === undefined) {
    return 0
  }
  var numberValue = Number(value)
  if (isNaN(numberValue)) {
    return 0
  }
  return numberValue
}

function formatMoney(value) {
  return toNumber(value).toFixed(2)
}

function formatWan(value) {
  return (toNumber(value) / 10000).toFixed(2)
}

function padZero(value) {
  return value < 10 ? '0' + value : String(value)
}

function formatDateTime(date) {
  var target = date || new Date()
  var year = target.getFullYear()
  var month = padZero(target.getMonth() + 1)
  var day = padZero(target.getDate())
  var hour = padZero(target.getHours())
  var minute = padZero(target.getMinutes())
  return year + '-' + month + '-' + day + ' ' + hour + ':' + minute
}

module.exports = {
  toNumber: toNumber,
  formatMoney: formatMoney,
  formatWan: formatWan,
  padZero: padZero,
  formatDateTime: formatDateTime
}
