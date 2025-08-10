import { http } from './http';
import type { ActivitySession, ActivityType, LeaderboardItem, Member, Participation, ParticipationStatus, ParticipationWithSession, User } from '../types';

// 登录/认证
export async function apiLogin(username: string, password: string): Promise<{ token: string; user: User } | null> {
  try { return await http('/auth/login', { method: 'POST', body: JSON.stringify({ username, password }) }); } catch { return null; }
}
export async function apiProfile(): Promise<User> { return http('/auth/profile'); }

// 成员
export async function apiListMembers(params: { keyword?: string; status?: Member['status']; role?: Member['role']; page?: number; pageSize?: number } = {}): Promise<{ items: Member[]; total: number }> {
  const q = new URLSearchParams();
  if (params.keyword) q.set('keyword', params.keyword);
  if (params.status) q.set('status', params.status);
  if (params.role) q.set('role', params.role);
  if (params.page) q.set('page', String(params.page));
  if (params.pageSize) q.set('pageSize', String(params.pageSize));
  return http(`/members?${q.toString()}`);
}
export async function apiGetMember(id: string): Promise<Member> { return http(`/members/${id}`); }
export async function apiUpsertMember(member: Partial<Member> & { id?: string }): Promise<Member> {
  if (member.id) return http(`/members/${member.id}`, { method: 'PUT', body: JSON.stringify(member) });
  return http('/members', { method: 'POST', body: JSON.stringify(member) });
}
export async function apiListMemberParticipations(memberId: string, params: { typeId?: string; from?: string; to?: string; page?: number; pageSize?: number } = {}): Promise<{ items: ParticipationWithSession[]; total: number }> {
  const q = new URLSearchParams();
  if (params.typeId) q.set('typeId', params.typeId);
  if (params.from) q.set('from', params.from);
  if (params.to) q.set('to', params.to);
  if (params.page) q.set('page', String(params.page));
  if (params.pageSize) q.set('pageSize', String(params.pageSize));
  return http(`/members/${memberId}/participations?${q.toString()}`);
}

// 活动类型
export async function apiListActivityTypes(): Promise<ActivityType[]> { return http('/activity-types'); }
export async function apiUpsertActivityType(payload: Partial<ActivityType> & { id?: string }): Promise<ActivityType> {
  if (payload.id) return http(`/activity-types/${payload.id}`, { method: 'PUT', body: JSON.stringify(payload) });
  return http('/activity-types', { method: 'POST', body: JSON.stringify(payload) });
}
export async function apiDeleteActivityType(id: string): Promise<void> { return http(`/activity-types/${id}`, { method: 'DELETE' }); }

// 场次
export async function apiListSessions(params: { typeId?: string; from?: string; to?: string; page?: number; pageSize?: number } = {}): Promise<{ items: ActivitySession[]; total: number }> {
  const q = new URLSearchParams();
  if (params.typeId) q.set('typeId', params.typeId);
  if (params.from) q.set('from', params.from);
  if (params.to) q.set('to', params.to);
  if (params.page) q.set('page', String(params.page));
  if (params.pageSize) q.set('pageSize', String(params.pageSize));
  return http(`/sessions?${q.toString()}`);
}
export async function apiGetSession(id: string): Promise<ActivitySession> { return http(`/sessions/${id}`); }
export async function apiUpsertSession(payload: Partial<ActivitySession> & { id?: string }): Promise<ActivitySession> {
  if (payload.id) return http(`/sessions/${payload.id}`, { method: 'PUT', body: JSON.stringify(payload) });
  return http('/sessions', { method: 'POST', body: JSON.stringify(payload) });
}
export async function apiDeleteSession(id: string): Promise<void> { return http(`/sessions/${id}`, { method: 'DELETE' }); }

// 参与
export async function apiListParticipations(sessionId: string): Promise<Participation[]> { return http(`/sessions/${sessionId}/participations`); }
export async function apiBulkUpsertParticipations(sessionId: string, items: Array<{ memberId: string; status: ParticipationStatus; score?: number; note?: string }>): Promise<Participation[]> {
  return http(`/sessions/${sessionId}/participations/bulk-upsert`, { method: 'POST', body: JSON.stringify(items) });
}
export async function apiAddParticipation(sessionId: string, item: { memberId: string; status: ParticipationStatus; score?: number; note?: string }): Promise<Participation> {
  return http(`/sessions/${sessionId}/participations`, { method: 'POST', body: JSON.stringify(item) });
}
export async function apiUpdateParticipation(sessionId: string, pid: string, item: Partial<Participation>): Promise<Participation> {
  return http(`/sessions/${sessionId}/participations/${pid}`, { method: 'PUT', body: JSON.stringify(item) });
}
export async function apiDeleteParticipation(sessionId: string, pid: string): Promise<void> {
  return http(`/sessions/${sessionId}/participations/${pid}`, { method: 'DELETE' });
}

// 统计
export async function apiLeaderboard(params: { typeId?: string; period?: 'custom'|'month'|'quarter'|'year'; from?: string; to?: string; year?: number; quarter?: number; month?: number; sort?: 'score'|'avgScore'|'attendance'; page?: number; pageSize?: number } = {}): Promise<{ items: LeaderboardItem[]; total: number }> {
  const q = new URLSearchParams();
  if (params.typeId) q.set('typeId', params.typeId);
  if (params.period) q.set('period', params.period);
  if (params.from) q.set('from', params.from);
  if (params.to) q.set('to', params.to);
  if (params.year) q.set('year', String(params.year));
  if (params.quarter) q.set('quarter', String(params.quarter));
  if (params.month) q.set('month', String(params.month));
  if (params.sort) q.set('sort', params.sort);
  if (params.page) q.set('page', String(params.page));
  if (params.pageSize) q.set('pageSize', String(params.pageSize));
  return http(`/reports/leaderboard?${q.toString()}`);
}


