# 题库文件说明

本目录中的 JSON 是题库源文件。微信原生小程序不能直接通过 `require()` 加载普通 JSON 数据文件，因此运行时使用自动生成的 `generated.js`。

替换或新增 JSON 后运行：

```bash
node scripts/syncQuestionBanks.js
```

同步脚本会扫描本目录全部 `.json` 文件、校验必填字段和重复 id，并生成微信小程序可直接加载的数据包。页面代码无需修改。

新增题库时：

1. 复制现有 JSON 文件并替换题目内容。
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
