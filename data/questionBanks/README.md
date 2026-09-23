# 题库文件说明

题库页面通过 `utils/questionBank.js` 统一读取本目录中的 JSON 文件。新增题库时：

1. 复制现有 JSON 文件并替换题目内容。
2. 为每道题提供唯一 `id`。
3. 在 `utils/questionBank.js` 的 `QUESTION_SOURCES` 中登记新文件。

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
