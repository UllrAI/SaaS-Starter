# Card 组件使用最佳实践

## Overview
Card 组件在不同场景下的使用模式和注意事项。

---

## 场景 1: 纯内容卡片（无顶部图片）

### ✅ 推荐用法
```tsx
<Card className="shadow-sm">
  <CardHeader>
    <div className="mb-4 flex h-12 w-12 items-center justify-center bg-primary/10 text-primary border border-primary/20">
      <Icon className="h-6 w-6" />
    </div>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description text</CardDescription>
  </CardHeader>
</Card>
```

**说明**：
- 使用默认的 Card padding (`py-6`)
- 使用 CardHeader 组件自带的 `px-6` 内边距
- 适用于纯文本、图标等内容

---

## 场景 2: 顶部图片卡片（Full Bleed Image）

### ✅ 推荐用法
```tsx
<Card className="overflow-hidden p-0 shadow-sm">
  {/* Image Section - Full Bleed (no padding) */}
  <div className="aspect-square w-full bg-muted">
    <img src="/image.jpg" alt="..." className="h-full w-full object-cover" />
  </div>
  
  {/* Content Section - With Padding */}
  <div className="p-6">
    <CardTitle className="mb-1.5">Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </div>
</Card>
```

**关键点**：
- `p-0` 移除 Card 默认的 padding
- `overflow-hidden` 配合 0 radius 主题，确保图片边缘整齐
- 图片区域不添加任何 padding，实现 full bleed 效果
- 内容区域使用 `p-6` 保持一致的内边距

### ❌ 不推荐用法
```tsx
{/* 错误：会在图片上方产生空白 */}
<Card className="shadow-sm">
  <div className="aspect-square w-full bg-muted">
    <img src="/image.jpg" alt="..." />
  </div>
  <CardHeader className="p-4">
    <CardTitle>Title</CardTitle>
  </CardHeader>
</Card>
```

**问题**：Card 的默认 `py-6` 会在图片上方创建 24px 的空白

---

## 场景 3: 带封面图 + Footer 的卡片

### ✅ 推荐用法
```tsx
<Card className="overflow-hidden p-0 shadow-sm">
  {/* Cover Image */}
  <div className="h-48 w-full bg-muted">
    <img src="/cover.jpg" alt="..." className="h-full w-full object-cover" />
  </div>
  
  {/* Content */}
  <div className="p-6">
    <CardTitle className="mb-1.5">Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </div>
  
  {/* Footer/Actions */}
  <div className="border-t px-6 py-4">
    <Button>Action</Button>
  </div>
</Card>
```

---

## 场景 4: 横向布局（图片在侧边）

### ✅ 推荐用法
```tsx
<Card className="overflow-hidden p-0 shadow-sm">
  <div className="flex flex-col md:flex-row">
    {/* Side Image */}
    <div className="h-48 w-full bg-muted md:h-auto md:w-48">
      <img src="/side.jpg" alt="..." className="h-full w-full object-cover" />
    </div>
    
    {/* Content */}
    <div className="flex-1 p-6">
      <CardTitle className="mb-1.5">Title</CardTitle>
      <CardDescription>Description</CardDescription>
    </div>
  </div>
</Card>
```

---

## 设计原则

### 1. **Padding 层次**
- **Card 容器**：用于纯内容卡片 (默认 `py-6`)
- **内容区域**：当有 full-bleed 元素时，手动添加 `p-6`
- **保持一致**：所有内边距使用相同的值 (`p-6` = 24px)

### 2. **Full Bleed 元素**
- 图片、视频、背景色等需要完全填充的元素
- 必须移除 Card 的默认 padding (`p-0`)
- 使用 `overflow-hidden` 防止内容溢出

### 3. **间距规范**
```
gap-4  = 16px  (紧凑布局)
gap-6  = 24px  (标准布局)
gap-8  = 32px  (宽松布局)
p-6    = 24px  (卡片内边距标准)
```

---

## 实际应用示例

### 团队成员卡片
```tsx
<div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
  {members.map((member) => (
    <Card key={member.id} className="overflow-hidden p-0 shadow-sm">
      {/* Avatar Image - Full Bleed */}
      <div className="aspect-square w-full bg-muted">
        <img 
          src={member.avatar} 
          alt={member.name}
          className="h-full w-full object-cover"
        />
      </div>
      
      {/* Member Info */}
      <div className="p-6">
        <CardTitle className="mb-1.5">{member.name}</CardTitle>
        <CardDescription className="font-mono text-xs">
          {member.role}
        </CardDescription>
      </div>
    </Card>
  ))}
</div>
```

### 博客文章卡片
```tsx
<Card className="overflow-hidden p-0 shadow-sm">
  {/* Featured Image */}
  <div className="h-48 w-full bg-muted">
    <img 
      src={post.image} 
      alt={post.title}
      className="h-full w-full object-cover"
    />
  </div>
  
  {/* Post Content */}
  <div className="p-6">
    <Badge className="mb-3">{post.category}</Badge>
    <CardTitle className="mb-1.5">{post.title}</CardTitle>
    <CardDescription className="mb-4">
      {post.excerpt}
    </CardDescription>
    <div className="text-xs text-muted-foreground">
      {post.date} · {post.readTime}
    </div>
  </div>
</Card>
```

---

## 总结

**核心规则**：
1. 有顶部图片 → `p-0` + 手动添加内容区 padding
2. 纯内容 → 使用默认 padding + CardHeader
3. 保持一致的间距规范 (`p-6`, `gap-6/8`)
4. 使用 `overflow-hidden` 配合 0 radius 主题

**最大优势**：
- ✅ 不需要修改原始 Card 组件
- ✅ 灵活适应各种布局需求
- ✅ 保持设计系统的一致性
- ✅ 代码清晰易维护
