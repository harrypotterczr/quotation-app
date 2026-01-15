# 电梯改造报价单系统 - 部署与维护说明

本文档详细说明了系统的安装、运行、数据维护及生产环境部署流程。

## 1. 环境准备

在开始之前，请确保您的计算机已安装以下软件：

*   **Node.js** (v18 或更高版本): 用于运行前端应用。
*   **Python** (3.x): 用于批量管理价格数据 (Excel 功能)。

## 2. 项目初始化

首次获取项目代码后，需要安装必要的依赖包：

```bash
# 进入项目目录
cd quotation-app

# 1. 安装前端依赖
npm install

# 2. 安装价格管理脚本依赖 (如果需要使用 Excel 修改价格)
pip install pandas openpyxl
```

## 3. 价格数据维护 (Excel 模式)

本系统支持通过 Excel 表格批量管理和更新价格数据库，无需直接修改代码。

### 步骤 1: 编辑价格
直接打开项目根目录下的 **`prices.xlsx`** 文件进行编辑：
*   **Control**: 修改控制系统及功率价格。
*   **Traction_1_1**: 修改 1:1 曳引机价格。
*   **Misc**: 修改杂项（门机、编码器等）价格。

### 步骤 2: 更新生效
修改并保存 Excel 后，运行以下命令将数据同步到系统：

```bash
python manage_prices.py update
```

> **提示**: 如果误删了 Excel 文件，可以运行 `python manage_prices.py init` 重新生成。

## 4. 本地开发运行

在开发或测试阶段，可以使用以下命令启动本地服务器：

```bash
npm run dev
```
启动后，浏览器访问提供的地址（通常是 `http://localhost:5173`）即可使用。

## 5. 生产环境部署

当需要将系统发布给其他人使用时，请执行构建和部署操作。

### 5.1 构建静态文件

运行以下命令进行打包：

```bash
npm run build
```

构建成功后，项目目录下会生成一个 **`dist`** 文件夹。这个文件夹包含了运行系统所需的所有静态文件（HTML, CSS, JS）。

### 5.2 部署选项

您可以选择以下任意一种方式进行部署：

#### 选项 A: 静态网站托管 (最简单/公网)
将 `dist` 文件夹内的所有文件上传至：
*   **Vercel / Netlify** (推荐)
*   **GitHub Pages**
*   **阿里云 OSS / 腾讯云 COS** (静态网站托管模式)

#### 选项 B: 局域网/公司内网服务器 (Nginx)
如果您有内部服务器，可以使用 Nginx 托管。配置示例如下：

```nginx
server {
    listen 80;
    server_name quotation.your-company.com;
    
    # 指向 dist 目录的绝对路径
    root /var/www/quotation-app/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

#### 选项 C: 临时本地共享
如果只想临时在局域网内共享给同事：

1.  全局安装 serve 工具: `npm install -g serve`
2.  在项目根目录下运行: `serve -s dist`
3.  将显示的局域网 IP 地址发送给同事即可访问。

## 6. 常见问题排查

*   **PDF 导出文字错位**: 请确保浏览器缩放比例设置为 100% 后再点击导出。
*   **新增项输入中文异常**: 系统已针对中文输入法进行优化，如果遇到问题，请尝试切换输入法或刷新页面。
*   **价格没更新**: 运行 `python manage_prices.py update` 后，确保重新运行了 `npm run build` (生产环境) 或重启了开发服务器 (本地环境)。
