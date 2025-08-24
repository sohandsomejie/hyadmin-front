# 忍者组织管理系统 API 文档（v1)

- 基础路径：`/api/v1`
- 认证：JWT（登录后返回 `token`，其后请求需携带 `Authorization: Bearer <token>`）
- 时间：统一使用 UTC，ISO8601（例：`2025-08-09T12:00:00Z`）
- 场次状态：不在后端存储，由前端依据 `startAt`/`endAt` 计算“未开始/进行中/已结束”
- 列表返回：统一 `{ items: [...], total: number }`

## 枚举

- MemberStatus：`normal` | `left`
- MemberRole：`trainee`(学员) | `senior`(高层) | `member`(成员) | `leader`(首领)
- ParticipationStatus：`participated`(参与) | `leave`(请假) | `unknown`(未知) | `unset`(未设置)
- LeaderboardSort：`score`(总分) | `avgScore`(均分) | `attendance`(出勤率)
- AiParseStatus：`queued` | `processing` | `succeeded` | `failed` | `canceled` | `timeout`

## 通用分页参数

- `page`（默认 1），`pageSize`（默认 20）

---

## 认证 Auth

### POST /auth/login

请求体：

```json
{ "username": "admin", "password": "******" }
```

响应：

```json
{ "token": "jwt-token", "user": { "id": "u1", "username": "admin", "createdAt": "2025-01-01T00:00:00Z", "lastLoginAt": "2025-01-02T00:00:00Z" } }
```

### GET /auth/profile

响应：

```json
{ "id": "u1", "username": "admin", "createdAt": "...", "lastLoginAt": "..." }
```

---

## 成员 Members

### GET /members

说明：查询成员列表

- Query：`keyword`（昵称/QQ 模糊）、`status=normal|left`、`role=trainee|senior|member|leader`、`page`、`pageSize`
响应：

```json
{ "items": [
  { "id": "m1", "nickname": "鸣人", "qq": "10001", "status": "normal", "joinAt": "...", "role": "member", "remark": "" }
], "total": 1 }
```

### POST /members

说明：新增成员

```json
{ "nickname": "鸣人", "qq": "10001", "status": "normal", "joinAt": "2025-01-01T12:00:00Z", "role": "member", "remark": "" }
```

响应：成员对象

校验与错误：

- 昵称唯一：若已存在相同 `nickname`，返回 400

```json
{ "error": { "code": "DUPLICATE_NICKNAME", "message": "昵称已存在" } }
```

### GET /members/:id

说明：成员详情（对象）

### PUT /members/:id

说明：更新成员

```json
{ "nickname": "漩涡鸣人", "qq": "10001", "status": "normal", "joinAt": "...", "role": "leader", "remark": "..." }
```

校验与错误：

- 昵称唯一：当更新 `nickname` 时会进行重名校验（排除自身），若重复返回 400

```json
{ "error": { "code": "DUPLICATE_NICKNAME", "message": "昵称已存在" } }
```

### POST /members/generate

说明：生成成员。未提供 `nickname` 时自动生成唯一昵称（格式：`Member_YYYYMMDDHHmmss[_abcd]`）。

请求体（可选字段与新增一致）：

```json
{ "qq": "10001", "status": "normal", "role": "member", "remark": "" }
```

也可显式传入 `nickname`，服务端仍会进行重名校验。

响应：成员对象

错误：

- 400：昵称已存在

```json
{ "error": { "code": "DUPLICATE_NICKNAME", "message": "昵称已存在" } }
```

### PATCH /members/:id/status（可选）

说明：仅更新状态

```json
{ "status": "left", "leaveAt": "2025-01-10T10:00:00Z" }
```

### GET /members/:id/participations

### DELETE /members/:id

说明：删除成员（需要 JWT）。若存在参与记录，已通过外键设置为 `ON DELETE CASCADE` 自动级联删除。

响应：

```json
{ "id": "m1", "deleted": true }
```

错误：

- 404：成员不存在

说明：成员历史参与记录（含场次信息）

- Query：`typeId`、`from`、`to`、`page`、`pageSize`
响应：

```json
{ "items": [
  { "id": "p1", "sessionId": "s2", "memberId": "m1", "status": "participated", "score": 95, "setBy": "u1", "setAt": "...",
    "session": { "id": "s2", "typeId": "t2", "name": "天地 2025-08-06", "startAt": "...", "endAt": "..." } }
], "total": 1 }
```

---

## 活动类型 Activity Types

### GET /activity-types

响应：

```json
[
  { "id": "t1", "code": "fortress", "name": "要塞", "enabled": true,
    "scheduleRule": { "weekday": 6, "time": "20:00" }, "durationMinutes": 120 },
  { "id": "t2", "code": "battlefield", "name": "天地战场", "enabled": true,
    "scheduleRule": { "weekday": 3, "time": "20:00" }, "durationMinutes": 120 }
]
```

### POST /activity-types

说明：新增活动类型

```json
{ "code": "custom", "name": "自定义活动", "enabled": true,
  "scheduleRule": { "weekday": 2, "time": "19:30" }, "durationMinutes": 120 }
```

### PUT /activity-types/:id

说明：修改活动类型（任意字段可选）

```json
{ "name": "要塞(改)", "enabled": false,
  "scheduleRule": { "weekday": 6, "time": "21:00" }, "durationMinutes": 150 }
```

### DELETE /activity-types/:id

说明：删除活动类型（可按业务限制：存在场次时禁止删除）

---

## 场次 Sessions（状态前端计算）

### GET /sessions

说明：按类型/时间范围查询场次

- Query：`typeId`、`from`、`to`、`page`、`pageSize`
响应：

```json
{ "items": [
  { "id": "s1", "typeId": "t1", "name": "要塞 2025-08-09",
    "startAt": "2025-08-09T12:00:00Z", "endAt": "2025-08-09T14:00:00Z", "notes": "" }
], "total": 1 }
```

### POST /sessions

说明：新增场次；创建成功后自动插入所有“正常”成员到参与表，状态设为 `unset`，分数设为 `0`

```json
{ "typeId": "t1", "name": "要塞 2025-08-09",
  "startAt": "2025-08-09T12:00:00Z", "endAt": "2025-08-09T14:00:00Z", "notes": "" }
```

响应：场次对象

### GET /sessions/:id

说明：场次详情（对象）

### PUT /sessions/:id

说明：更新场次（名称/开始/结束/备注）

```json
{ "name": "要塞 2025-08-09(晚场)", "startAt": "...", "endAt": "...", "notes": "..." }
```

### DELETE /sessions/:id

说明：删除场次（需级联删除该场次参与记录）

---

## 参与记录 Participations

### GET /sessions/:id/participations

说明：获取某场次的参与记录（分页）

- Query：`page`（默认 1）、`pageSize`（默认 20）
- 响应：

```json
{ "items": [
  { "id": "p1", "sessionId": "s1", "memberId": "m1", "nickname": "鸣人", "status": "unset", "score": 0, "note": "", "setBy": "u1", "setAt": "..." }
], "total": 1 }
```

### POST /sessions/:id/participations/bulk-upsert

说明：批量新增/更新参与记录（存在则更新，否则插入）

```json
[
  { "memberId": "m1", "status": "participated", "score": 95, "note": "" },
  { "memberId": "m2", "status": "leave", "score": 0 }
]
```

### POST /sessions/:id/participations

说明：新增单条参与记录

```json
{ "memberId": "m3", "status": "unset", "score": 0, "note": "" }
```

### PUT /sessions/:id/participations/:pid

说明：更新单条参与记录

```json
{ "status": "participated", "score": 88, "note": "..." }
```

### DELETE /sessions/:id/participations/:pid

说明：删除单条参与记录

---

## 统计 Reports

### GET /reports/leaderboard

说明：排行榜（默认要塞，可筛）

- Query：`typeId`、`period=custom|month|quarter|year`、`from`、`to`、`year`、`quarter=1..4`、`month=1..12`、`sort=score|avgScore|attendance`、`page`、`pageSize`
响应：

```json
{ "items": [
  { "member": { "id": "m1", "nickname": "鸣人", "role": "member" },
    "totalScore": 300, 
    "avgScore": 75, 
    "attendance": 0.8, 
    "times": 4,
    "attendedTimes": 3,
    "leaveTimes": 1,
    "unknownTimes": 0 }
], "total": 1 }
```

**响应字段说明：**

- `member`: 成员信息对象
  - `id`: 成员ID
  - `nickname`: 成员昵称
  - `role`: 成员角色
- `totalScore`: 总分数
- `avgScore`: 平均分数
- `attendance`: 出勤率（参与次数/总次数）
- `times`: 总参与次数（包括所有状态）
- `attendedTimes`: 实际参与次数（status='participated'）
- `leaveTimes`: 请假次数（status='leave'）
- `unknownTimes`: 未知状态次数（status='unknown'）

**数据关系：**

- `times = attendedTimes + leaveTimes + unknownTimes + unsetTimes`
- `attendance = attendedTimes / times`
- 所有次数字段均为非负整数

**使用示例：**

```javascript
// 获取出勤率最高的前10名成员
GET /api/v1/reports/leaderboard?sort=attendance&pageSize=10

// 获取指定时间段内的统计
GET /api/v1/reports/leaderboard?period=month&year=2025&month=8

// 筛选特定活动类型
GET /api/v1/reports/leaderboard?typeId=1&sort=avgScore
```

### （可选）GET /activity-types/:id/last-session-summary

说明：活动类型最近一次场次汇总（概览卡片用）
响应：

```json
{ "session": { "id": "sX", "name": "要塞 2025-08-09", "startAt": "...", "endAt": "..." },
  "counts": { "participated": 12, "leave": 2, "unknown": 1, "unset": 3 },
  "tops": [ { "memberId": "m1", "nickname": "鸣人", "score": 98 }, { "memberId": "m2", "nickname": "佐助", "score": 98 } ] }
```

---

## AI 图片解析 AI Parses（与场次关联）

说明：解析任务与具体活动场次关联。前端以 multipart/form-data（二进制文件，支持多张）发起解析任务。后端保存到本地用于前端展示，并调用 Dify Workflow JSON API（remote_url 模式传递图片链接）；AI 完成后回调，前端通过短轮询获取结果。

### POST /api/v1/sessions/:sessionId/parses

说明：为某个场次创建解析任务（需要 JWT）

- Content-Type: `multipart/form-data`
- 字段：
  - `file`: 文件或文件数组（多选）
  - `workflow_url`: 必填，Dify 服务 API 基地址或运行地址（必须是 http/https）。
    - 若为基础地址（如 `https://api.dify.ai/v1`），服务端会自动补全为 `.../workflows/run`
    - 亦支持传入完整的 `.../workflows/{workflow_id}/run` 或 `.../workflows/run`
  - `workflow_api_key`: 必填，远端 AI 平台 API Key；服务端会以 `Authorization: Bearer <key>` 透传
  - `request_id`: 可选，用于幂等（多图时服务端内部扩展为 `request_id#0`、`#1` ...）
  - `workflow_file_var`: 可选，Dify 工作流中文件变量名（默认 `images`）
  - `workflow_response_mode`: 可选，`blocking|streaming`（默认 `blocking`）
  - `workflow_user`: 可选，终端用户标识（默认 `web-user`）

响应（单图）：

```json
{ "id": 123, "status": "queued", "createdAt": "2025-08-09T12:00:00Z", "url": "/uploads/abc.png" }
```

响应（多图）：

```json
{ "items": [ { "id": 123, "status": "queued", "createdAt": "2025-08-09T12:00:00Z", "url": "/uploads/1.png" }, { "id": 124, "status": "queued", "createdAt": "2025-08-09T12:00:00Z", "url": "/uploads/2.png" } ], "total": 2 }
```

说明：

- 仅支持 `image/png`、`image/jpeg`；单文件默认上限 8MB（超限 413）
- 幂等：若携带 `request_id`，多图将扩展为 `request_id#i`
- 典型错误：400（参数）、401（未认证）、409（幂等冲突但无法复用）、413（正文过大）、500（服务器错误）
  - 远端 Dify 返回非 2xx 时，任务将置为 `failed`，`error` 字段包含远端错误（若可解析则包含 `code/message`）

示例（cURL）：

单图上传：

```
curl -X POST "https://your-host/api/v1/sessions/123/parses" \
  -H "Authorization: Bearer <token>" \
  -F "file=@/path/to/image1.jpg" \
  -F "workflow_url=https://ai.example.com/ingest" \
  -F "workflow_api_key=sk-xxxxx" \
  -F "request_id=req-20250815-001"
```

多图上传：

```
curl -X POST "https://your-host/api/v1/sessions/123/parses" \
  -H "Authorization: Bearer <token>" \
  -F "file=@/path/to/1.jpg" \
  -F "file=@/path/to/2.png" \
  -F "workflow_url=https://ai.example.com/ingest" \
  -F "workflow_api_key=sk-xxxxx" \
  -F "request_id=req-20250815-batch"
```

### GET /api/v1/sessions/:sessionId/parses

说明：分页获取某场次的解析任务（需要 JWT）

- Query：`page`（默认 1）、`pageSize`（默认 20）
- 响应：

```json
{ "items": [ { "id": 123, "status": "processing", "url": "/uploads/abc.png", "data": null, "error": null, "updatedAt": "2025-08-09T12:00:05Z" } ], "total": 1 }
```

### GET /api/v1/ai-parses/:id

说明：查询任务状态（需要 JWT），供前端短轮询

响应：

```json
{ "id": 123, "status": "processing", "data": null, "error": null, "updatedAt": "2025-08-09T12:00:05Z" }
```

说明：当 `status` ∈ `succeeded|failed|canceled|timeout` 时为终态；`data` 为 AI 的结构化输出（JSON），失败时 `error` 携带原因。

### POST /api/v1/ai-parses/callback

说明：远端 AI 工作流回调（无需 JWT，当前未启用签名校验）。仅允许把 `queued|processing` 更新到终态。

请求体：

```json
{ "id": 123, "status": "succeeded", "data": { "text": "xxx" }, "ai_trace_id": "trace-abc" }
```

### POST /api/v1/ai-parses/:id/cancel

说明：取消解析任务（需要 JWT）。若提供 `cancel_url`，会尝试通知远端 AI 取消；无论远端是否成功，服务端会将本地状态置为 `canceled`（仅当当前为 `queued|processing`）。

- Body：

```json
{ "cancel_url": "https://ai.example.com/cancel", "workflow_api_key": "sk-xxxxx" }
```

- 响应：

```json
{ "id": 123, "status": "canceled" }
```

- 错误：
  - 400：参数错误
  - 401：未认证
  - 404：任务不存在
  - 409：任务已终态，或状态不可更新

或失败：

```json
{ "id": 123, "status": "failed", "error": "model timeout", "ai_trace_id": "trace-abc" }
```

响应：

```json
{ "ok": true }
```

错误：

- 400：参数格式错误
- 401/403：签名校验失败或时间戳过期
- 409：状态不可更新（已终态）
- 404：任务不存在

### （可选）DELETE /api/v1/ai-parses/:id

说明：取消任务（需要 JWT）。若远端支持取消，则尝试远端取消并将本地状态设为 `canceled`。

响应：

```json
{ "id": 123, "status": "canceled" }
```

---

## 错误格式

- HTTP：400/401/403/404/409/422/500
- 统一响应：

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "参数校验失败", "details": { "field": "reason" } } }
```

---

## 重要说明

- 创建场次必须在同一事务里批量插入“正常”成员到参与表，默认 `status=unset`、`score=0`
- 删除活动类型按需限制：若存在场次，是否禁止删除由业务决定
- 时间统一存 UTC；前端展示按本地时区转换

---

## AI 解析任务对象（ParseJob）

通用字段：

```json
{
  "id": 123,
  "sessionId": 456,
  "url": "/uploads/abc.png",
  "mime": "image/jpeg",
  "status": "queued | processing | succeeded | failed | canceled | timeout",
  "data": { },
  "error": null,
  "createdAt": "2025-08-09T12:00:00Z",
  "updatedAt": "2025-08-09T12:00:05Z"
}
```

状态机与回调：

- 初始：`queued`
- 触发远端成功后：`processing`
- 终态：`succeeded | failed | canceled | timeout`
- 回调接口仅允许将 `queued|processing` 更新为终态；重复回调按幂等处理（不更新已终态）

文件访问：

- 上传文件会保存到服务端 `public/uploads/` 目录，接口返回相对路径 `url`
- 前端展示时请拼接服务端基础地址（例如 `https://your-host` + `url`）

幂等建议：

- 多图请求时服务端会扩展 `request_id` 为 `request_id#i`
- 避免在短时间内用同一 `request_id` 重复提交相同的批次，可能因唯一约束导致冲突（409）
