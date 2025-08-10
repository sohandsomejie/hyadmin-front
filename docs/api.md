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

### GET /members/:id
说明：成员详情（对象）

### PUT /members/:id
说明：更新成员
```json
{ "nickname": "漩涡鸣人", "qq": "10001", "status": "normal", "joinAt": "...", "role": "leader", "remark": "..." }
```

### PATCH /members/:id/status（可选）
说明：仅更新状态
```json
{ "status": "left", "leaveAt": "2025-01-10T10:00:00Z" }
```

### GET /members/:id/participations
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
说明：获取某场次的参与记录（数组）
```json
[
  { "id": "p1", "sessionId": "s1", "memberId": "m1", "status": "unset", "score": 0, "note": "", "setBy": "u1", "setAt": "..." }
]
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
    "totalScore": 300, "avgScore": 75, "attendance": 0.8, "times": 4 }
], "total": 1 }
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
