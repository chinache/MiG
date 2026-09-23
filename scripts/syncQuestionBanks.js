var fs = require('fs')
var path = require('path')

var questionBankDirectory = path.join(__dirname, '..', 'data', 'questionBanks')
var outputFile = path.join(questionBankDirectory, 'generated.js')
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
  var fileNames = fs.readdirSync(questionBankDirectory).filter(function (fileName) {
    return /\.json$/i.test(fileName)
  }).sort()

  if (!fileNames.length) {
    throw new Error('data/questionBanks 中没有 JSON 题库文件')
  }

  var sources = fileNames.map(function (fileName) {
    var filePath = path.join(questionBankDirectory, fileName)
    var questions = JSON.parse(fs.readFileSync(filePath, 'utf8'))
    if (!Array.isArray(questions)) {
      throw new Error(fileName + ' 的根节点必须是题目数组')
    }
    questions.forEach(function (question, index) {
      validateQuestion(question, fileName, index, usedIds)
    })
    return questions
  })

  var output = [
    '// 本文件由 scripts/syncQuestionBanks.js 自动生成，请勿直接修改。',
    '// 修改或新增 data/questionBanks/*.json 后，重新运行同步脚本。',
    '',
    'module.exports = ' + JSON.stringify(sources, null, 2),
    ''
  ].join('\n')

  fs.writeFileSync(outputFile, output)
  console.log('已生成 ' + path.relative(process.cwd(), outputFile) + '，共 ' + Object.keys(usedIds).length + ' 道题')
}

syncQuestionBanks()
