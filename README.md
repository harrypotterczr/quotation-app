# 电梯改造报价单系统（quotation-app）

一个基于 React + Vite 的电梯改造报价单生成工具，用于快速配置改造方案、自动匹配控制系统/曳引机并生成标准化报价单（支持导出 PDF、支持价格表批量维护）。

在线演示（GitHub Pages 部署示例）：  
`https://harrypotterczr.github.io/quotation-app/`

---

## 1. 功能概览

- 参数化配置电梯改造方案，自动匹配 **方案1 ~ 方案5**：
  - 方案1：同步原主机 + 标准 EN1387 编码器
  - 方案2-1 / 2-2 / 2-3：同步原主机 + 非标准编码器多种解决方案
  - 方案3：异步原主机方案
  - 方案4：更换曳引机（含机架）
  - 方案5：更换曳引机 + 整套门机
- 根据载重、速度、曳引比等参数，自动从数据表中匹配合适的曳引机及控制系统功率。
- 自动计算：
  - 控制系统全套价格（含楼层增减价、无机房加价、贯通门加价等）
  - 曳引机及机架价格
  - 门机（门机马达及控制器 / 整套门机）价格
  - 现场测量费、包装费、运费等杂项
- 支持人工微调与自定义：
  - 对任意条目可修改单价、数量
  - 可新增自定义项目行（名称、规格、数量、单价、备注）
- 报价单预览与导出：
  - 右侧实时渲染 A4 版式报价单
  - 支持一键导出 PDF 文件
  - 鼠标悬浮高亮查看“控制系统全套”、“曳引系统”等对应图片及明细列表
- 价格数据维护：
  - 使用 `prices.xlsx` 统一管理价格
  - 通过 `manage_prices.py` 同步到 JSON 数据文件

---

## 2. 技术栈

- 构建工具：Vite 5
- 语言：TypeScript
- 前端框架：React 18
- UI 与样式：
  - Tailwind CSS
  - 自定义工业风配色（`bg-industrial-*` 等）
  - `lucide-react` 图标
- PDF 导出：`html2canvas` + `jspdf`
- 数据存储：
  - `src/data/*.json`：控制系统 / 曳引机 / 杂项价格表
  - `prices.xlsx`：Excel 源数据
  - `manage_prices.py`：Excel 与 JSON 之间的转换与更新

---

## 3. 项目结构（简要）

- `src/main.tsx`：应用入口
- `src/App.tsx`：整体布局（左侧表单 + 右侧预览）
- `src/components/QuotationForm.tsx`：
  - 参数配置表单
  - “是否更换曳引机”等问答式向导，自动匹配方案 1~5
  - 方案 4/5 时自动锁定“有机房”选项
- `src/components/QuotationPreview.tsx`：
  - 报价单预览与 PDF 导出
  - 明细表格、总价、注意事项展示
  - 鼠标悬浮展示控制系统/曳引系统/门机图片与明细
- `src/lib/logic.ts`：
  - 核心报价逻辑 `calculateQuotation(input: QuotationInput): QuotationResult`
  - 控制系统功率及价格匹配
  - 曳引机匹配（按载重、速度、曳引比）
  - 杂项价格获取、总价计算
- `src/types.ts`：
  - `QuotationInput` / `QuotationItem` / `QuotationResult` 等核心类型定义
- `public/`：
  - 控制系统、曳引系统、门机等展示用图片
  - 部分数据 JSON（用于静态部署）
- `.github/workflows/*.yml`：
  - GitHub Actions 工作流（构建与 GitHub Pages 部署）
- `start_quotation.bat`：
  - Windows 一键启动脚本（用于本地/离线环境打开报价系统）

更多关于部署与数据维护的细节，参见根目录的 [DEPLOYMENT.md](DEPLOYMENT.md)。

---

## 4. 本地开发与运行

### 4.1 环境要求

- Node.js 18+
- （可选）Python 3.x（如需通过 Excel 维护价格）

### 4.2 初始化

```bash
# 安装依赖
npm install
```

### 4.3 启动开发服务器

```bash
npm run dev
```

启动后，终端会输出一个本地访问地址（通常为 `http://localhost:5173`），在浏览器中打开即可使用。

---

## 5. 打包与部署

### 5.1 构建生产包

```bash
npm run build
```

执行完成后会生成 `dist/` 目录，包含静态 HTML/CSS/JS 文件。

### 5.2 使用 GitHub Pages 部署

本仓库已配置 GitHub Actions 工作流，可将构建结果自动发布到 GitHub Pages：

- 主分支推送后，工作流会自动执行构建并部署到 `https://<用户名>.github.io/quotation-app/`。
- 项目内部已通过 `import.meta.env.BASE_URL` 处理静态资源路径，以适配 GitHub Pages 的子路径。

如需其他部署方式（Nginx / 内网服务器 / 第三方静态托管等），可参考 [DEPLOYMENT.md](DEPLOYMENT.md) 中的示例配置。

---

## 6. Windows 一键启动（离线/本地场景）

在项目根目录下提供了 `start_quotation.bat`，主要用途：

- 自动检测 `dist/index.html` 是否存在：
  - 如不存在，则执行 `npm run build` 进行构建
- 使用 `npm run preview -- --port 4000` 启动本地预览服务器
- 以隐藏命令行窗口的方式启动（适合给非技术人员使用）

使用方法：

1. 双击 `start_quotation.bat`
2. 等待浏览器自动打开或手动访问 `http://localhost:4000`

> 提示：首次执行会稍慢（需要安装依赖并构建），之后启动速度会明显加快。

---

## 7. 价格数据维护（Excel）

系统支持通过 Excel 文件来维护价格，不需要直接修改 JSON 或代码。详细说明见 [DEPLOYMENT.md](DEPLOYMENT.md)，这里简要列出核心流程：

1. 编辑根目录的 `prices.xlsx`：
   - `Control` 工作表：控制系统功率与价格
   - `Traction_1_1` / `Traction_2_1` 等工作表：曳引机数据
   - `Misc` 工作表：门机、编码器、现场测量、包装、运费等杂项
2. 保存后执行：

   ```bash
   python manage_prices.py update
   ```

3. 如在生产环境部署，更新数据后应重新执行：

   ```bash
   npm run build
   ```

---

## 8. 注意事项与业务规则摘要

- 方案匹配：
  - 通过表单中的“是否更换曳引机”“主机类型”“编码器方案”等选项自动推导方案号。
  - 当前方案会在表单中实时显示。
- 有机房/无机房：
  - 方案 4、方案 5（更换曳引机类方案）下，“有机房/无机房”开关会被锁定为 **有机房**，用户无法切换为无机房。
  - 其他方案中，用户可自由切换，有机房/无机房状态会影响控制系统价格。
- 门机逻辑：
  - 方案 1、2-1、2-2、2-3、3、4：计入“门机马达及控制器”
  - 方案 5：计入“轿门机（不含门板和地坎）”，根据门型与开门宽度调整价格。
- 现场测量：
  - 勾选“工程师现场测量”时，系统会自动添加一行“现场测量”费用。
- 所有金额均按含税价格计算，并在最终总价中汇总。

---

## 9. 适用场景

- 内部技术销售 / 方案工程师快速出具电梯改造报价单
- 需要频繁调整价格、但不希望频繁改代码的场景
- 通过 GitHub Pages 或内网服务器给多位同事共享使用

如果后续有新业务规则或字段变更，可以在：

- 报价逻辑：`src/lib/logic.ts`
- 表单字段：`src/components/QuotationForm.tsx`
- 报价预览：`src/components/QuotationPreview.tsx`

中进行扩展和调整。
