# 知心小助手

知心小助手是一个面向银行内部员工的微信原生小程序，用于本地测算绩效薪酬。当前版本为“最小可运行版本”，不接数据库、不接云开发、不做登录、不调用外部 API，适合先在微信开发者工具中预览和验证流程。

## 功能清单

- 首页展示小程序名称、定位说明、进入测算和使用说明入口。
- 产品测算页支持存款类、贷款类、保险类、贵金属类四类示例产品。
- 支持业务金额、业务户数、日均余额、增量金额、完成数量等字段结构。
- 支持空值、非数字、负数、整数类字段的基础校验。
- 支持开始测算、清空输入、金额万元换算提示。
- 支持保存最近一次测算输入到微信小程序本地缓存，再次进入自动读取。
- 结果页突出展示“合计绩效薪酬”，并展示测算明细和本次输入。
- 所有示例公式集中在 `utils/formulas.js`，便于后续替换正式 Excel 公式。

## 项目结构

```text
app.js
app.json
app.wxss
project.config.json
sitemap.json
pages/index/index.js
pages/index/index.wxml
pages/index/index.wxss
pages/calc/calc.js
pages/calc/calc.wxml
pages/calc/calc.wxss
pages/result/result.js
pages/result/result.wxml
pages/result/result.wxss
pages/about/about.js
pages/about/about.wxml
pages/about/about.wxss
utils/formulas.js
utils/format.js
README.md
```

## 如何用微信开发者工具导入项目

1. 打开微信开发者工具。
2. 点击“导入项目”。
3. 项目目录选择本仓库根目录，也就是包含 `app.json` 和 `project.config.json` 的目录。
4. 导入后确认项目类型为“小程序”。
5. 点击工具栏中的“编译”，即可在模拟器中打开首页。

## 没有 AppID 时如何选择测试号

- 如果暂时没有正式小程序 AppID，可以在导入项目时选择“测试号”或使用微信开发者工具提供的游客/测试 AppID。
- 当前 `project.config.json` 中使用的是 `touristappid`，仅用于本地开发预览。
- 后续有正式 AppID 后，可在微信开发者工具的“详情 - 基本信息”中修改 AppID，或直接修改 `project.config.json` 的 `appid` 字段。

## 如何预览首页

1. 导入项目后，微信开发者工具会读取 `app.json`。
2. 当前首页路径为 `pages/index/index`，已经配置在 `app.json` 的第一个页面。
3. 点击“编译”后模拟器默认进入首页。
4. 首页点击“进入测算”可跳转到产品测算页，点击“查看使用说明”可跳转到使用说明页。

## 如何修改公式

所有公式集中维护在：

```text
utils/formulas.js
```

当前示例公式如下：

- 存款类绩效 = 日均增量 × 系数
- 贷款类绩效 = 贷款投放金额 × 系数
- 保险类绩效 = 发卡户数 × 单户奖励
- 贵金属类绩效 = 有效户数 × 单户奖励

后续替换正式公式时，建议按以下顺序修改：

1. 在 `productConfigs` 中调整产品分类、字段名称、字段单位和必填项。
2. 在 `SAMPLE_RATES` 中调整示例系数或删除不用的示例系数。
3. 在 `calculatePerformance(productKey, inputData)` 的 `switch` 分支中替换正式计算逻辑。
4. 保持 `calculatePerformance` 返回结构不变，这样页面无需大改。

## 如何替换 Logo 或吉祥物

当前最小版本没有引入图片资源，首页 Logo 和吉祥物使用 CSS 绘制的占位样式，方便直接运行。

如需替换为正式图片：

1. 新建 `assets/images` 目录。
2. 放入图片，例如 `assets/images/logo.png`、`assets/images/mascot.png`。
3. 在 `pages/index/index.wxml` 中用 `<image>` 替换当前 `.logo-mark` 或 `.mascot` 相关节点。
4. 在 `pages/index/index.wxss` 中设置图片宽高，例如：

```css
.logo-image {
  width: 48rpx;
  height: 48rpx;
}
```

## 后续如何扩展数据库或后台

第一版刻意不接数据库、不接后台，先保证本地测算稳定可运行。后续如果需要扩展：

1. 先确定数据归属和权限边界，例如员工身份、机构、岗位、考核周期。
2. 增加登录或企业内部身份校验能力。
3. 将正式公式版本、产品配置、测算记录放入后台服务或数据库。
4. 小程序端通过安全接口读取公式配置、提交测算记录。
5. 保留 `utils/formulas.js` 作为本地兜底或前端展示辅助，核心口径以后台版本为准。

## 维护建议

- 非专业维护人员优先修改 `utils/formulas.js` 和 README，不建议随意调整页面跳转路径。
- 修改页面路径后必须同步检查 `app.json` 中的 `pages` 配置。
- 修改字段后应在微信开发者工具中重新编译，并至少测试四类产品的测算和清空缓存流程。
