# 环境熵 Entropy Observer

手机优先的 web app。用户输入选项 A/B，AI 以"环境熵观测器"身份提问 4 个抽象信号采样问题，综合后输出"世界偏向 A 还是 B"及一句宿命感判词。

## 技术栈

- 后端：Node.js + Express (server.js)
- AI：DeepSeek API (prompts/entropy.js)
- 前端：Vanilla HTML/CSS/JS SPA，hash 路由
- 无框架，无构建工具

## 文件结构

```
server.js              — Express 服务器，两个 API 端点
prompts/entropy.js     — AI prompt 生成 (提问 + 结果判词)
public/
  index.html           — 入口
  app.js               — 核心 SPA：状态、路由、导航、公共视图
  engine-mystic.js     — Mystic Void 引擎（问题流 + 结果卡片）
  engine-silent.js     — Silent Signal 引擎（逐题浮现 + 禅意结果）
  engine-neon.js       — Neon Entropy 引擎（终端模拟器，无 hash 路由）
  styles.css           — 全局样式，三个主题的 CSS 自定义属性
  particles.js         — Canvas 粒子引擎（三套效果）
  ambient.js           — Web Audio API 环境音生成
```

## 三个世界

三个主题不是换皮，是三套独立的交互引擎，共用 S、API、$、el 等基础设施。

### Mystic Void — 向宇宙提交犹豫
- 引擎：engine-mystic.js
- 交互：问题从黑暗中浮现 → 回答后溶解消散 → 1.5s 黑暗间隔 → 下题
- 输入：浮动选项（void-floating-choice）或下划线输入（void-input-line）
- 进度：4 颗金色星点
- Loading：粒子向心聚拢 + 径向光晕
- 结果：金边卡片

### Neon Entropy — 非法读取命运数据
- 引擎：engine-neon.js
- 交互：完整终端模拟器，单页持续会话
- 关键：不使用 hash 路由。startTerminal() 接管整个 #app
- 输入：隐藏 <input> 元素，原生支持 IME（中文输入法）
- 特殊键：Enter 提交，R 重来，T 换主题
- 全局变量：_termState, _termInputBuffer, _termAcceptingInput
- 安全退出：destroyTerminal() 清理监听器和 DOM

### Silent Signal — 答案自己浮现
- 引擎：engine-silent.js
- 交互：每次只显示一个问题，如墨迹晕开般浮现，回答后 2s 停顿再进入下一题
- 输入：极细下划线（zen-input-line），按回车提交
- 无进度指示器（停顿本身就是体验）
- 结果：纯白空间，文字分段延时浮现（staggered emergence）

## 路由

Hash 路由：`#splash` → `#theme` → `#decide` → `#sample` → `#loading` → `#result`

例外：Neon Entropy 不走 hash 路由。当 `S.theme === 'neon-entropy'` 且 hash 不是 splash 时，router 直接调用 startTerminal()。

## 全局状态

```js
S = {
  theme,       // 'mystic-void' | 'neon-entropy' | 'silent-signal'
  optionA,     // 用户输入的选项 A
  optionB,     // 用户输入的选项 B
  questions,   // AI 生成的问题数组
  answers,     // { q.id: answer_string }
  currentQuestion,  // 当前问题索引
  result,      // AI 返回的判词结果
}
```

## API 端点

- `POST /api/questions` — 请求：{ theme, optionA, optionB } → 返回：{ questions: [...] }
- `POST /api/decide` — 请求：{ theme, optionA, optionB, answers } → 返回：{ bias, verdict, finalLine, signals }

## 全局 API（供引擎使用）

- `$` — document.querySelector
- `el(tag, attrs, ...children)` — 创建 DOM 元素
- `S` — 全局状态对象
- `API` — getQuestions / decide
- `setTheme(theme)` — 切换主题（同步 CSS data-theme + localStorage + Ambient 音效）
- `shareResult(r)` — 分享结果
- `route()` — 路由分发
- `clearLoadingCleanup()` — 清理 loading 定时器

## 修改时注意

1. 引擎之间不要交叉引用对方的 DOM class。每个引擎用自己的 class 前缀
2. Neon Entropy 的终端键盘监听在 document 上，切换主题时必须调 destroyTerminal()
3. styles.css 中 [data-theme] 选择器用于主题覆盖，不要直接改共享样式
4. 移动端优先：基准 16px，最小触摸 44×44，单列布局
5. ambient.js 的音效需要用户首次交互后才能播放（浏览器 autoplay policy）
