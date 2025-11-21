# Supabase 数据库设置

本目录包含了 AI 图片生成应用所需的数据库表和函数定义。

## 📋 执行顺序

请按照以下顺序在 Supabase SQL Editor 中执行：

1. **`01_create_credits_table.sql`** - 创建点数表
2. **`02_create_history_table.sql`** - 创建历史记录表

## 📊 表结构说明

### 1. ai_images_creator_credits（点数表）

存储用户的点数信息。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| user_id | UUID | 用户ID（关联 auth.users） |
| credits | INTEGER | 点数余额（默认5，不能为负） |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

**特性：**
- ✅ 用户注册时自动创建记录并赋予 5 点
- ✅ 自动更新 `updated_at` 时间戳
- ✅ RLS 策略保护用户数据
- ✅ 提供 `consume_credits()` 和 `add_credits()` 辅助函数

### 2. ai_images_creator_history（历史记录表）

存储用户的图片生成历史。

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| user_id | UUID | 用户ID（关联 auth.users） |
| prompt | TEXT | 生成提示词 |
| task_id | TEXT | API任务ID（可选） |
| image_urls | JSONB | 图片URL数组（通常4张） |
| status | TEXT | 状态：pending/generating/completed/failed |
| error_message | TEXT | 错误信息（如果失败） |
| metadata | JSONB | 额外元数据 |
| created_at | TIMESTAMP | 创建时间 |
| updated_at | TIMESTAMP | 更新时间 |

**特性：**
- ✅ 自动更新 `updated_at` 时间戳
- ✅ RLS 策略保护用户数据
- ✅ 提供辅助函数和视图
- ✅ 多个索引优化查询性能

## 🔧 辅助函数

### Credits 相关

```sql
-- 消耗点数（返回是否成功）
SELECT consume_credits(1);

-- 增加点数（充值）
SELECT add_credits(10);
```

### History 相关

```sql
-- 创建生成记录
SELECT create_generation_record(
    '一只在太空中飞行的猫',
    'task-123',
    '{"model": "wanx2.1-t2i-plus"}'::jsonb
);

-- 更新生成记录
SELECT update_generation_record(
    '<record-id>'::uuid,
    'completed',
    '["url1", "url2", "url3", "url4"]'::jsonb,
    NULL
);

-- 获取用户统计数据
SELECT * FROM get_user_generation_stats();

-- 查看历史记录
SELECT * FROM user_generation_history LIMIT 10;
```

## 🔐 安全策略

所有表都启用了 Row Level Security (RLS)：

- ✅ 用户只能查看、修改、删除自己的数据
- ✅ 自动关联当前登录用户（`auth.uid()`）
- ✅ 防止跨用户数据泄露

## 📝 使用步骤

### 1. 在 Supabase Dashboard 执行 SQL

1. 登录 [Supabase Dashboard](https://app.supabase.com)
2. 选择你的项目
3. 进入 **SQL Editor**
4. 依次复制并执行两个 SQL 文件的内容
5. 确认执行成功（无错误）

### 2. 验证表创建

在 **Table Editor** 中应该能看到：
- `ai_images_creator_credits`
- `ai_images_creator_history`

### 3. 测试触发器

注册一个新用户，然后查询：

```sql
SELECT * FROM ai_images_creator_credits WHERE user_id = auth.uid();
```

应该能看到自动创建的 5 点初始点数。

## 🚀 集成到应用

在应用代码中使用这些表：

```typescript
// 获取用户点数
const { data: credits } = await supabase
  .from('ai_images_creator_credits')
  .select('credits')
  .single();

// 消耗点数（通过函数）
const { data, error } = await supabase
  .rpc('consume_credits', { amount: 1 });

// 创建生成记录
const { data: record } = await supabase
  .rpc('create_generation_record', {
    p_prompt: '提示词',
    p_task_id: 'task-123'
  });

// 查询历史记录
const { data: history } = await supabase
  .from('user_generation_history')
  .select('*')
  .order('created_at', { ascending: false })
  .limit(20);
```

## 📌 注意事项

1. **首次执行**：确保按顺序执行 SQL 文件
2. **重复执行**：SQL 使用了 `IF NOT EXISTS`，可以安全重复执行
3. **删除表**：如需重新创建，先手动删除表和函数
4. **备份数据**：生产环境修改前请先备份

## 🔄 更新日志

- **v1.0** (2025-01-09): 初始版本
  - 创建点数表和历史记录表
  - 实现自动赋予初始点数
  - 添加 RLS 策略和辅助函数

