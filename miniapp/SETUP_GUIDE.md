# 微信小程序配置指南

## 一、环境变量配置

### 1.1 填写 Taro 项目环境变量
编辑 `/Users/zacheswdl/duolingo-shuati/miniapp/.env` 文件：

```env
TARO_APP_SUPABASE_URL=https://your-project-id.supabase.co
TARO_APP_SUPABASE_ANON_KEY=your-anon-key-here
```

**如何获取这些值？**
1. 登录 [Supabase 控制台](https://supabase.com/dashboard)
2. 进入你的项目
3. 点击左侧菜单「Settings」→「API」
4. 复制 `URL` 和 `anon public` 密钥

---

## 二、微信公众平台配置

### 2.1 添加服务器域名（关键步骤！）

**操作步骤：**

1. **登录微信公众平台**  
   打开 [https://mp.weixin.qq.com/](https://mp.weixin.qq.com/)，使用你的账号登录

2. **进入小程序管理后台**  
   在左侧菜单点击「开发管理」→「开发设置」

3. **配置服务器域名**  
   找到「服务器域名」部分：
   
   | 域名类型 | 需要添加的域名 |
   |---------|---------------|
   | request 合法域名 | `https://your-project-id.supabase.co` |
   | request 合法域名 | `https://your-project-id.functions.supabase.co` |
   | socket 合法域名 | `wss://your-project-id.supabase.co` |

   **示例：**
   ```
   request 合法域名:
   https://abc123.supabase.co
   https://abc123.functions.supabase.co
   
   socket 合法域名:
   wss://abc123.supabase.co
   ```

4. **保存并提交**  
   点击「保存并提交」，等待微信审核（通常几小时内生效）

---

## 三、Supabase Edge Function 配置

### 3.1 部署微信登录函数

**操作步骤：**

1. **安装 Supabase CLI**（如果未安装）
   ```bash
   # macOS/Linux
   brew install supabase/tap/supabase
   
   # 或者使用 npm
   npm install -g supabase
   ```

2. **登录 Supabase**
   ```bash
   supabase login
   ```

3. **链接项目**
   ```bash
   cd /Users/zacheswdl/duolingo-shuati
   supabase link --project-ref your-project-id
   ```

4. **部署 Edge Function**
   ```bash
   supabase functions deploy wechat-auth
   ```

5. **设置环境变量**
   ```bash
   supabase secrets set WECHAT_APPID=你的小程序AppID
   supabase secrets set WECHAT_SECRET=你的小程序密钥
   supabase secrets set SUPABASE_URL=https://your-project-id.supabase.co
   supabase secrets set SUPABASE_SERVICE_ROLE_KEY=你的服务角色密钥
   ```

   **如何获取服务角色密钥？**
   - 在 Supabase 控制台 → Settings → API → `service_role` 密钥

6. **重新部署函数（使环境变量生效）**
   ```bash
   supabase functions deploy wechat-auth
   ```

---

## 四、数据库迁移

### 4.1 执行 SQL 迁移

**操作步骤：**

1. **打开 Supabase SQL Editor**  
   在 Supabase 控制台左侧菜单点击「SQL Editor」

2. **创建新查询**  
   点击「New query」

3. **复制粘贴迁移脚本**  
   将 `/Users/zacheswdl/duolingo-shuati/supabase/functions/wechat-auth/migration.sql` 的内容粘贴到编辑器中

4. **运行查询**  
   点击「Run」按钮执行

---

## 五、微信开发者工具配置

### 5.1 打开项目

**操作步骤：**

1. **打开微信开发者工具**
2. **导入项目**：
   - 选择目录：`/Users/zacheswdl/duolingo-shuati/miniapp`
   - 填写 AppID：`wxd1e29c348a10b518`（已在 project.config.json 中配置）
3. **点击「导入」**

### 5.2 构建项目

在终端执行：
```bash
cd /Users/zacheswdl/duolingo-shuati/miniapp
npm run dev:weapp
```

开发者工具会自动检测文件变化并热更新。

---

## 六、验证配置

### 6.1 测试登录流程

1. 在开发者工具中打开「调试」面板
2. 点击登录页面的「微信一键登录」按钮
3. 查看控制台输出，确认：
   - `wx.login()` 成功获取 code
   - 请求发送到 Edge Function
   - 返回 access_token 和 refresh_token
   - 用户自动登录并进入首页

---

## 配置检查清单

- [ ] ✅ 填写 `.env` 文件（Supabase URL 和 Anon Key）
- [ ] ✅ 在微信公众平台添加服务器域名
- [ ] ✅ 部署 Edge Function 并设置环境变量
- [ ] ✅ 执行数据库迁移
- [ ] ✅ 在开发者工具中测试登录功能
- [ ] ✅ 测试所有页面功能（学习、考试、错题本、个人中心）

---

## 常见问题

### Q1: 为什么请求被拒绝？
**A:** 检查以下几点：
1. 服务器域名是否已添加并审核通过
2. 域名格式是否正确（必须是 https:// 开头）
3. 网络请求是否使用了正确的域名

### Q2: 微信登录失败？
**A:** 检查以下几点：
1. Edge Function 的环境变量是否正确设置
2. `WECHAT_APPID` 和 `WECHAT_SECRET` 是否与小程序一致
3. 小程序是否已发布（测试号可能有限制）

### Q3: 构建失败？
**A:** 检查以下几点：
1. 是否安装了依赖：`npm install`
2. Node.js 版本是否 >= 18.0.0
3. 是否有 TypeScript 错误：`npm run typecheck`