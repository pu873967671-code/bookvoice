# BookVoice 部署配置清单

## 服务列表（5个）

| 服务名 | 类型 | Root Directory | Build Command | Start Command | Port |
|--------|------|----------------|---------------|---------------|------|
| postgresql | Prebuilt | - | - | - | 5432 |
| redis | Prebuilt | - | - | - | 6379 |
| api | Git | `apps/api` | `npm ci --include=dev` | `npx tsx src/main.ts` | 3001 |
| worker | Git | `apps/worker` | `npm ci --include=dev` | `npx tsx src/main.ts` | - |
| web | Git | `apps/web` | `npm ci && npm run build` | `npm start` | 3000 |

---

## 环境变量

### API 和 Worker（完全相同）

```bash
REDIS_URL=${redis.REDIS_URL}
DATABASE_URL=${postgresql.DATABASE_URL}
PORT=3001
NODE_ENV=production
AZURE_TTS_KEY=9bOCvPM7lHvnYCSzRAIsIzoHDcJUArT14gK8V2OmksniFCJqyb2NJQQJ99CCAC3pKaRXJ3w3AAAYACOGBLxS
AZURE_TTS_REGION=eastasia
AZURE_TTS_VOICE=zh-HK-HiuGaaiNeural
AZURE_TTS_RATE=-15%
GLM_API_KEY=14fba339ad5741fa98027473a2cbb579.vTX4iTe8NM4j9CfZ
GLM_API_URL=https://open.bigmodel.cn/api/paas/v4/chat/completions
USE_OBJECT_STORAGE=false
STORAGE_ROOT=/tmp/storage
FFMPEG_BIN=ffmpeg
FFPROBE_BIN=ffprobe
```

### Web

```bash
REDIS_URL=${redis.REDIS_URL}
DATABASE_URL=${postgresql.DATABASE_URL}
NEXT_PUBLIC_API_URL=${api.ZEABUR_WEB_URL}
NODE_ENV=production
```

---

## 部署步骤

### 1. 添加 PostgreSQL
- Add Service → Prebuilt → PostgreSQL 16

### 2. 添加 Redis
- Add Service → Prebuilt → Redis 7

### 3. 添加 API
- Add Service → Git → pu873967671-code/bookvoice
- Name: `api`
- Root Directory: `apps/api`
- Build Command: `npm ci --include=dev`
- Start Command: `npx tsx src/main.ts`
- Port: `3001`
- 添加上述环境变量
- Deploy

### 4. 添加 Worker
- Add Service → Git → pu873967671-code/bookvoice
- Name: `worker`
- Root Directory: `apps/worker`
- Build Command: `npm ci --include=dev`
- Start Command: `npx tsx src/main.ts`
- 添加上述环境变量
- Deploy

### 5. 添加 Web
- Add Service → Git → pu873967671-code/bookvoice
- Name: `web`
- Root Directory: `apps/web`
- Build Command: `npm ci && npm run build`
- Start Command: `npm start`
- Port: `3000`
- 添加上述环境变量
- Deploy

### 6. 添加域名
- 点击 `web` 服务
- 网络 → 生成域名

---

## 常见问题

### Q: 构建失败 "Cannot find module 'dotenv'"
A: 确保 Build Command 是 `npm ci --include=dev`，不是 `npm install`

### Q: 服务 502 错误
A: 检查日志，确认端口配置正确（API: 3001, Web: 3000）

### Q: Redis 连接失败
A: 确保环境变量使用 `${redis.REDIS_URL}` 引用

---

## 验证清单

- [ ] 5 个服务都在运行
- [ ] API 日志无错误
- [ ] Worker 日志显示 "Worker started"
- [ ] Web 域名可以打开
- [ ] 可以看到 22 个绘本卡片
- [ ] 图片正常加载
