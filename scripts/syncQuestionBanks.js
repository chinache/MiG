var fs = require('fs')
var path = require('path')
var zlib = require('zlib')

var sourceDirectory = path.join(__dirname, '..', 'data', 'questionBankSources')
var runtimeDirectory = path.join(__dirname, '..', 'data', 'questionBanks')
var partDirectory = path.join(runtimeDirectory, 'generated')
var outputFile = path.join(runtimeDirectory, 'generated.js')
var partSize = 60 * 1024
var requiredFields = ['id', 'type', 'stem', 'options', 'answer', 'analysis', 'bank', 'category', 'knowledgePoints', 'number']

function validateQuestion(question, fileName, index, usedIds) {
  requiredFields.forEach(function (fieldName) {
    if (question[fieldName] === undefined) {
      throw new Error(fileName + ' 第 ' + (index + 1) + ' 题缺少字段：' + fieldName)
    }
  })

  if (usedIds[question.id]) {
    throw new Error('题目 id 重复：' + question.id)
  }
  usedIds[question.id] = true

  question.answer.forEach(function (answerKey) {
    if (!question.options[answerKey]) {
      throw new Error(question.id + ' 的答案 ' + answerKey + ' 没有对应选项')
    }
  })
}

function syncQuestionBanks() {
  var usedIds = {}
  var fileNames = fs.readdirSync(sourceDirectory).filter(function (fileName) {
    return /\.json$/i.test(fileName)
  }).sort()

  if (!fileNames.length) {
    throw new Error('data/questionBankSources 中没有 JSON 题库文件')
  }

  var sources = fileNames.map(function (fileName) {
    var filePath = path.join(sourceDirectory, fileName)
    var questions = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    if (!Array.isArray(questions)) {
      throw new Error(fileName + ' 的根节点必须是题目数组')
    }
    questions.forEach(function (question, index) {
      validateQuestion(question, fileName, index, usedIds)
    })
    return questions
  })

  var sourceText = JSON.stringify(sources)
  var compressedText = zlib.gzipSync(Buffer.from(sourceText, 'utf8'), { level: 9 }).toString('base64')
  var partNames = []
  var offset

  fs.mkdirSync(partDirectory, { recursive: true })
  fs.readdirSync(partDirectory).forEach(function (fileName) {
    if (/^part-\d+\.js$/i.test(fileName)) {
      fs.unlinkSync(path.join(partDirectory, fileName))
    }
  })

  for (offset = 0; offset < compressedText.length; offset += partSize) {
    var partName = 'part-' + String(partNames.length + 1).padStart(3, '0') + '.js'
    var partText = compressedText.slice(offset, offset + partSize)
    fs.writeFileSync(path.join(partDirectory, partName), 'module.exports = ' + JSON.stringify(partText) + '\n')
    partNames.push(partName)
  }

  var output = [
    '// 本文件由 scripts/syncQuestionBanks.js 自动生成，请勿直接修改。',
    '// 修改或新增 data/questionBankSources/*.json 后，重新运行同步脚本。',
    '',
    'module.exports = {',
    "  encoding: 'gzip-base64',",
    '  data: [',
    partNames.map(function (partName) {
      return "    require('./generated/" + partName.replace(/\.js$/, '') + "')"
    }).join(',\n'),
    "  ].join('')",
    '}',
    ''
  ].join('\n')

  fs.writeFileSync(outputFile, output)
  console.log(
    '已生成 ' + path.relative(process.cwd(), outputFile) +
    ' 和 ' + partNames.length + ' 个压缩分片，共 ' + Object.keys(usedIds).length + ' 道题，' +
    compressedText.length + ' 字节'
  )
}

syncQuestionBanks()
