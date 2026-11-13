# v2 参考调研：暗色 · 霓虹 · HUD/控制台

> 选站标准：暗底上信息层级仍清楚、动效有节制、每招能落到 CSS/Canvas。链接均实测可访问（2026-11）。
> 本站映射：71 项 → 只做 6–8 个 featured；2,598 / 469 / 1,450 做数字递增；控制台感靠"HUD 框 + 网格 + 等宽标签"三层，不靠粒子。

## 1. 参考站（9）

| 站点 | 酷在哪 · 抄什么 |
|---|---|
| [Terminal Industries](https://www.terminal-industries.com/) | 工业调度终端气质：等宽标签、细网格、四角取景括号、琥珀+青双色。抄角标与网格层，别抄 3D 车流。 |
| [KPR](https://kprverse.com/) | 科幻世界里 UI 浮在场景之上。抄"HUD 叠 3D 而非藏进 3D"，以及镜头推近式转场。 |
| [Samsy · Gen-02](https://samsy.ninja/) | 2025 Awwwards SOTD，作品集做成可漫游房间。抄"一次只给一个空间"的节奏与 DOM/WebGL 同步。 |
| [basement.studio](https://basement.studio/) | 黑底硬边框，霓虹只出现在 hover 的 1px 描边上。抄"发光当反馈，不当装饰"。 |
| [Darkroom Engineering](https://darkroom.engineering/) | 巨型字压黑底，sticky 分区把长页面切成镜头。抄大标题锚点 + 分段粘性。 |
| [Lusion](https://www.lusion.co/) | 暗色 WebGL，滚动只驱动一条主线，粒子克制。抄"一屏一个主张"。 |
| [Eduard Bodak](https://www.eduardbodak.com/) | 2025 个人作品集，配套 [Codrops 拆解](https://tympanus.net/codrops/2025/07/29/built-to-move-a-closer-look-at-the-animations-behind-eduard-bodaks-portfolio/) 给出分档与 reduced-motion 代码。抄断点即动画分档。 |
| [Olivier Larose](https://www.olivierlarose.com/) | 不是作品集，是 100+ 可抄的交互 demo 库。卡住时按效果名来搜现成实现。 |
| [Igloo Inc](https://www.igloo.inc/) | 暗色全息渐变，光标与卡片有物理惯性、不瞬移。抄"惯性插值"的手感而非它的内容。 |

## 2. 12 个可抄技法

**P0**

1. **分段粘性骨架（CSS）**｜`section{height:320vh}` + 内层 `position:sticky;top:0`；用 `animation-timeline:scroll()`（[MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/animation-timeline)）把进度映射成 `--p` 驱动 transform/opacity。不支持时静态降级，绝不劫持滚轮。
2. **滚动数字递增（JS）**｜`IntersectionObserver` 进视口触发一次，单个 rAF 批处理所有计数器，600ms easeOut；`tabular-nums` 防跳动，reduced-motion 直接写终值。
3. **指针惯性光环（JS+CSS）**｜`rAF + lerp(0.12)` 移动 1px 描边圆，只改 `translate3d`；hover 可点元素时放大 1.8 倍并变实心；仅 `(hover:hover) and (pointer:fine)` 启用。
4. **HUD 角标网格层（CSS）**｜`repeating-linear-gradient` 画 1px 网格（opacity .04），四角括号用 4 个伪元素，整层 `pointer-events:none`；移动端只留角标。
5. **标题分行升入（CSS）**｜每行包 `<span>`，容器 `overflow:clip`，行从 `translateY(110%)` 归零，`transition-delay:calc(var(--i)*40ms)`；只用于 h1/h2。

**P1**

6. **故障字效（CSS）**｜`text-shadow` 红/青双通道 + `clip-path` 两段切片，`steps(2)` 抖 180ms；仅标题、仅 hover 或每 6s 一次，不常驻。
7. **横向廊道（CSS）**｜`scroll-snap-type:x mandatory` + `scroll-snap-align:start`，配左右键与拖拽；不要用 wheel 事件改竖向滚动，卡片文字保持可选中。
8. **卡片 3D 倾斜与高光（JS）**｜`pointermove` 写 `--mx/--my`，`rotateX/Y≤8deg`，叠一层跟随的 `radial-gradient`；离开归零，触屏关闭。
9. **章节刻度导航（CSS）**｜右侧竖排 tick，当前项 `aria-current="true"` 高亮；点击 `scrollIntoView`，Tab 可达。
10. **页面转场（JS）**｜`document.startViewTransition` 包住视图切换，标题设 `view-transition-name` 做共享元素，≤450ms；不支持则直切。

**P2**

11. **低频网格背景（Canvas 2D，可选）**｜≤120 点、DPR 上限 2；出屏与 `visibilitychange` 时停 rAF，单帧 <8ms。
12. **交互音（JS，默认关）**｜首个用户手势后建 `AudioContext`，点击 30ms 短音，localStorage 记开关；不做 BGM。

## 3. 要避开的 6 个俗套

1. **满屏粒子**：吃 GPU 与电量，遮正文，且"粒子=高级"是十年前的判断。
2. **逐滚动视差**：位移叠加导致晕动与阅读漂移，触发多、收益低。
3. **彩虹渐变描边字**：高饱和多色压不出层级，对比度必挂，2018 SaaS 味。
4. **自动播放 BGM/视频**：打断用户、无法预判，移动端还常被策略拦截。
5. **全站劫持滚动**：破坏触控板、PageDown 与锚点，是"炫"变"烦"的第一来源。
6. **紫蓝渐变 + 玻璃拟态卡片**：AI 味最重的组合，与"控制台"气质相反。

## 4. 可访问性与性能底线

- **reduced-motion**（[MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion)）：关 rAF 循环、视差、故障字，保留 ≤150ms 透明度过渡；用 `matchMedia(...).addEventListener('change')` 实时响应。
- **对比度**：底 `#0A0C11` + 正文 `#E7E9EE`（≈14:1）；霓虹只做描边/强调，不作文本色；AA 4.5:1，大字 3:1。
- **焦点**：`:focus-visible` 2px 高亮环，禁止 `outline:none`；动效不夺焦点。
- **移动端降级**：`hover:none` 关光标、倾斜、扫描线；横向廊道回退原生横滑。
- **长列表**：71 项用 `content-visibility:auto` + `contain-intrinsic-size`，图 `loading="lazy"`；重效果只给 featured。
- **帧预算**：同时运行的 rAF ≤2；发光用 `text-shadow`/静态 `box-shadow`，别大面积 `filter:blur()`。
