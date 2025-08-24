// 基础类型定义，供全站使用

export type MemberStatus = 'normal' | 'left';
export type SessionStatus = 'draft' | 'closed' | 'locked';
export type ParticipationStatus = 'participated' | 'leave' | 'unknown' | 'unset';
export type MemberRole = 'trainee' | 'senior' | 'member' | 'leader';

export interface Member {
  id: string;
  nickname: string;
  qq?: string;
  status: MemberStatus;
  joinAt?: string;
  leaveAt?: string;
  remark?: string;
  role?: MemberRole;
}

export interface ActivityType {
  id: string;
  code: 'fortress' | 'battlefield' | string;
  name: string;
  scheduleRule?: { weekday: number; time: string };
  enabled: boolean;
  durationMinutes?: number; // 默认场次时长
}

export interface ActivitySession {
  id: string;
  typeId: string;
  name: string;
  startAt: string;
  endAt?: string;
  status: SessionStatus;
  notes?: string;
}

export interface Participation {
  id: string;
  sessionId: string;
  memberId: string;
  status: ParticipationStatus;
  score?: number;
  note?: string;
  setBy?: string;
  setAt?: string;
}

export interface ParticipationWithSession extends Participation {
  session: ActivitySession;
}

export interface User {
  id: string;
  username: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface LeaderboardItem {
  member: Member;
  totalScore: number;
  avgScore: number;
  attendance: number; // 0-1
  times: number;
  attendedTimes?: number;
  leaveTimes?: number;
  unknownTimes?: number;
}

// AI 图片解析
export type AiParseStatus = 'queued' | 'processing' | 'succeeded' | 'failed' | 'canceled' | 'timeout';
export interface AiParseJob<TData = unknown> {
  id: string | number;
  sessionId?: string | number;
  url: string; // 图片地址，相对或绝对
  mime?: string;
  status: AiParseStatus;
  data?: TData | null; // AI 输出
  error?: string | null;
  createdAt?: string;
  updatedAt?: string;
}


