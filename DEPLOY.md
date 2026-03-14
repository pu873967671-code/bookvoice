# ClawRead 部署配置清单

## 架构说明

**方案 A（当前）**：合并容器 + Volume
- API + Worker 在同一个容器运行
- 共享 `/data/storage` 目录
- 通过 Zeabur Volume 持久化存储

## 服务列表（4个）

| 服务名 | 类型 | Root Directory | Build Command | Start Command | Port |
|--------|------|----------------|---------------|---------------|------|
| postgresql | Prebuilt | - | - | - | 5432 |
| redis | Prebuilt | - | - | - | 6379 |
| api-worker | Git | `.` | Docker | - | 8080 |
| web | Git | `.` | Docker | - | 3000 |

---

## 环境变量

### api-worker（合并容器）

```bash
REDIS_URL=${redis.REDIS_URL}
DATABASE_URL=${postgresql.DATABASE_URL}
PORT=8080
NODE_ENV=production
AZURE_TTS_KEY=9bOCvPM7lHvnYCSzRAIsIzoHDcJUArT14gK8V2OmksniFCJqyb2NJQQJ99CCAC3pKaRXJ3w3AAAYACOGBLxS
AZURE_TTS_REGION=eastasia
AZURE_TTS_VOICE=zh-HK-HiuGaaiNeural
AZURE_TTS_RATE=-15%
GLM_API_KEY=14fba339ad5741fa98027473a2cbb579.vTX4iTe8NM4j9CfZ
GLM_API_URL=https://open.bigmodel.cn/api/paas/v4/chat/completions
USE_OBJECT_STORAGE=false
STORAGE_ROOT=/data/storage
FFMPEG_BIN=ffmpeg
FFPROBE_BIN=ffprobe
MOCK_TTS=false
```

### Web

```bash
REDIS_URL=${redis.REDIS_URL}
DATABASE_URL=${postgresql.DATABASE_URL}
NEXT_PUBLIC_API_URL=${api-worker.ZEABUR_WEB_URL}
NODE_ENV=production
```

---

## 部署步骤

### 1. 添加 PostgreSQL
- Add Service → Prebuilt → PostgreSQL 16

### 2. 添加 Redis
- Add Service → Prebuilt → Redis 7

### 3. 添加 api-worker（合并容器）
- Add Service → Git → pu873967671-code/bookvoice
- Name: `api-worker`
- **不要设置 Root Directory**（留空，让 Dockerfile 的 context 生效）
- Build:
  - Type: Docker
  - Dockerfile: `apps/api/Dockerfile.combined`
- 添加上述环境变量
- **重要**：部署后添加 Volume
  - 挂载路径: `/data`
  - 确保环境变量 `STORAGE_ROOT=/data/storage`

### 4. 添加 Web
- Add Service → Git → pu873967671-code/bookvoice
- Name: `web`
- Build:
  - Type: Docker
  - Dockerfile: `apps/web/Dockerfile`
- 添加上述环境变量

### 5. 添加域名
- 点击 `web` 服务
- 网络 → 生成域名
- 点击 `api-worker` 服务
- 网络 → 生成域名（如果需要外部访问 API）

---

## 常见问题

### Q: 构建失败 "Cannot find module"
A: 检查 Dockerfile.combined 是否正确复制所有 workspace package.json

### Q: 音频播放失败
A: 检查：
1. Volume 是否正确挂载到 `/data`
2. 环境变量 `STORAGE_ROOT=/data/storage`
3. 查看 api-worker 日志确认 Worker 启动成功

### Q: 服务 502 错误
A: 检查日志，确认端口配置正确（api-worker: 8080, web: 3000）

---

## 验证清单

- [ ] 4 个服务都在运行（postgresql, redis, api-worker, web）
- [ ] api-worker 日志显示 "[combined] Starting Worker..." 和 "[combined] Starting API..."
- [ ] api-worker 日志显示 "storageRoot=/data/storage"
- [ ] Web 域名可以打开
- [ ] 可以看到绘本卡片
- [ ] TTS 生成后可以播放音频
