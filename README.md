# AI Sidebar - 通义千问版本

基于 **Spring AI 1.0.0-M6** 和 **阿里云 DashScope 通义千问** 构建的 JupyterLab AI 助手插件，提供智能编程辅助和多模态对话能力。

## 🚀 版本亮点

- **Spring AI 1.0.0-M6 最新规范**：完全遵循最新API标准，使用`OpenAiChatOptions.builder().model()`配置
- **阿里云 DashScope 原生支持**：内置通义千问 qwen-max 和 qwen-vl-max 模型
- **双模型架构**：智能切换文本模型和多模态视觉模型
- **流式响应优化**：修复流式响应末尾多余结束标记问题
- **OpenAI 兼容模式**：通过 DashScope 兼容接口实现无缝对接

## 📁 项目结构

```
ai-sidebar-qwen/
├── backend/ai_sidebar_backend/    # Spring Boot 后端服务
│   ├── src/main/java/            # Java 源码
│   ├── src/main/resources/       # 配置文件
│   └── pom.xml                   # Maven 依赖配置
└── plugin/ai_sidebar/           # JupyterLab 前端插件
    ├── src/                      # TypeScript 源码
    ├── package.json              # Node.js 依赖
    └── setup.py                  # Python 包配置
```

## 🛠️ 环境准备

### 系统要求
- **JDK 21**（必须）
- **Maven 3.6+**
- **Node.js 16+**
- **Python 3.8+**
- **JupyterLab 3.0+**

### 阿里云 DashScope 配置
1. 访问 [阿里云 DashScope](https://dashscope.console.aliyun.com/)
2. 创建 API-KEY
3. 在配置文件中设置 `spring.ai.openai.api-key`

## 🏃‍♂️ 快速开始

### 1. 克隆项目
```bash
git clone <项目地址>
cd ai-sidebar-qwen
```

### 2. 后端启动

#### 方式一：命令行启动
```bash
cd backend/ai_sidebar_backend
./mvnw spring-boot:run
```

#### 方式二：IDEA 启动
1. 用 IntelliJ IDEA 打开 `backend/ai_sidebar_backend` 目录
2. 等待 Maven 自动下载依赖
3. 运行 `AiSidebarBackendApplication.java`

**后端默认端口：8080**

### 3. 前端启动

#### 创建 Conda 环境
```bash
conda create -n ai-sidebar --override-channels --strict-channel-priority -c conda-forge -c nodefaults jupyterlab nodejs git
conda activate ai-sidebar
```

#### 安装并启动
```bash
cd plugin/ai_sidebar

# 安装依赖
jlpm install
jlpm build

# 安装到 JupyterLab
pip install -e .
jupyter labextension develop . --overwrite

# 启动 JupyterLab
jupyter lab
```

**前端默认端口：8888**

## ⚙️ 配置文件

### 后端配置 (`application.yaml`)
```yaml
spring:
  ai:
    openai:
      api-key: ${DASHSCOPE_API_KEY:your-api-key-here}
      base-url: https://dashscope.aliyuncs.com/compatible-mode/v1
      chat:
        options:
          model: qwen-max  # 文本模型
          
# 多模型配置
ai:
  model:
    text-model: qwen-max        # 文本对话模型
    multimodal-model: qwen-vl-max  # 多模态模型

# 数据库配置
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/ai_sidebar?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai
    username: root
    password: your-password
```

### 环境变量配置
```bash
# Linux/Mac
export DASHSCOPE_API_KEY="your-dashscope-api-key"

# Windows
set DASHSCOPE_API_KEY=your-dashscope-api-key
```

## 🔧 功能特性

### 🤖 AI 对话
- **智能代码问答**：基于当前 notebook 上下文
- **多轮对话**：支持对话历史记忆
- **流式响应**：实时输出 AI 回复

### 👁️ 多模态支持
- **图片理解**：支持上传图片并进行分析
- **代码可视化**：自动识别并描述图表输出

### 💾 会话管理
- **对话历史**：保存完整的对话记录
- **多会话支持**：同时管理多个对话线程
- **会话切换**：快速切换不同对话上下文

### 📝 代码助手
- **代码补全**：基于 AI 的智能代码建议
- **错误修复**：自动检测并修复代码问题
- **重构建议**：提供代码优化方案

## 📊 数据库初始化

### MySQL 数据库创建
```sql
CREATE DATABASE ai_sidebar DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE ai_sidebar;

-- 用户表
CREATE TABLE user (
    id INT PRIMARY KEY AUTO_INCREMENT,
    username VARCHAR(64) NOT NULL UNIQUE,
    password VARCHAR(128) NOT NULL,
    email VARCHAR(128),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 聊天记录表
CREATE TABLE chat_history (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    chat_id INT NOT NULL,
    request TEXT,
    response TEXT,
    codebase TEXT,
    chat_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES user(id)
);

-- 插入测试用户
INSERT INTO user (username, password, email) VALUES ('test', 'test123', 'test@example.com');
```

## 🐛 常见问题

### 端口冲突
- **8080端口被占用**：修改 `application.yaml` 中的 `server.port`
- **8888端口被占用**：启动 JupyterLab 时添加 `--port=新端口`

### API-KEY 问题
- 确保设置了正确的 `DASHSCOPE_API_KEY`
- 检查 API-KEY 是否有足够的调用额度

### 依赖问题
```bash
# 后端依赖更新
cd backend/ai_sidebar_backend
./mvnw clean install

# 前端依赖更新
cd plugin/ai_sidebar
jlpm install
```

### 插件未显示
```bash
# 检查插件状态
jupyter labextension list

# 重新安装
jupyter labextension develop . --overwrite
jupyter lab build
```

## 📝 开发说明

### 后端开发
- **框架**：Spring Boot 3.2 + Spring AI 1.0.0-M6
- **数据库**：Spring Data JPA + MySQL
- **测试**：JUnit 5 + Mockito

### 前端开发
- **框架**：JupyterLab 3.0 扩展
- **语言**：TypeScript
- **构建**：Webpack + Lerna
