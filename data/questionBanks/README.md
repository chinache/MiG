# 题库文件说明

题库源文件保存在 `data/questionBankSources/*.json`。本目录只保存小程序运行时使用的压缩数据包；`generated.js` 和 `generated/part-*.js` 都由脚本生成，请勿直接修改。

导入“合规天天练”Excel 压缩包：

```bash
python3 scripts/importComplianceDaily.py /path/to/合规天天练-题库.zip --output-dir data/questionBankSources
```

替换或新增 JSON 后生成运行时数据：

```bash
node scripts/syncQuestionBanks.js
```

同步脚本会扫描 `data/questionBankSources` 中的全部 `.json` 文件，校验必填字段、重复 id 以及答案与选项的对应关系，再生成微信小程序可直接加载的 gzip 压缩数据包。页面代码无需修改。

`project.config.json` 已将题库源文件目录排除在小程序上传包之外，避免源 JSON 与运行时数据重复占用包体。

新增题库时：

1. 在 `data/questionBankSources` 中复制现有 JSON 文件并替换题目内容。
2. 为每道题提供唯一 `id`。
3. 运行上述同步脚本。

单题结构：

```json
{
  "id": "bank-001",
  "type": "single",
  "stem": "题干",
  "options": { "A": "选项A", "B": "选项B" },
  "answer": ["A"],
  "analysis": "解析",
  "bank": "所属题库",
  "category": "分类",
  "knowledgePoints": ["知识点"],
  "number": "题号"
}
```

`type` 支持 `single`、`multiple`、`judge`。即使是单选题，`answer` 也统一使用数组，页面代码无需因题型切换数据结构。选项 E 可以省略。
