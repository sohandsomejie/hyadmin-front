import dayjs from 'dayjs';
import type { ActivitySession, ActivityType, LeaderboardItem, Member, Participation, ParticipationStatus, User, ParticipationWithSession } from '../types';

// 简易内存 Mock，每次刷新重置

export const mockUsers: User[] = [
  { id: 'u1', username: 'admin', createdAt: new Date().toISOString(), lastLoginAt: undefined },
];

export const mockMembers: Member[] = [
  { id: 'm1', nickname: '鸣人', qq: '10001', status: 'normal', joinAt: new Date().toISOString(), role: 'member' },
  { id: 'm2', nickname: '佐助', qq: '10002', status: 'normal', joinAt: new Date().toISOString(), role: 'member' },
  { id: 'm3', nickname: '小樱', qq: '10003', status: 'normal', joinAt: new Date().toISOString(), role: 'trainee' },
  { id: 'm4', nickname: '卡卡西', qq: '10004', status: 'left', joinAt: new Date().toISOString(), role: 'senior' },
];

export const mockActivityTypes: ActivityType[] = [
  { id: 't1', code: 'fortress', name: '要塞', scheduleRule: { weekday: 6, time: '20:00' }, enabled: true, durationMinutes: 120 },
  { id: 't2', code: 'battlefield', name: '天地战场', scheduleRule: { weekday: 3, time: '20:00' }, enabled: true, durationMinutes: 120 },
];

export const mockSessions: ActivitySession[] = [
  { id: 's1', typeId: 't1', name: '要塞 2025-08-09', startAt: dayjs().day(6).hour(20).minute(0).second(0).toISOString(), status: 'draft' },
  { id: 's2', typeId: 't2', name: '天地战场 2025-08-06', startAt: dayjs().day(3).hour(20).minute(0).second(0).toISOString(), status: 'closed' },
];

export const mockParticipations: Participation[] = [
  { id: 'p1', sessionId: 's2', memberId: 'm1', status: 'participated', score: 95, setBy: 'u1', setAt: new Date().toISOString() },
  { id: 'p2', sessionId: 's2', memberId: 'm2', status: 'participated', score: 88, setBy: 'u1', setAt: new Date().toISOString() },
  { id: 'p3', sessionId: 's2', memberId: 'm3', status: 'leave', score: 0, setBy: 'u1', setAt: new Date().toISOString() },
];

export function login(username: string, _password: string): Promise<{ token: string; user: User } | null> {
  // 简化：任意密码，用户名为 admin 才能登录
  if (username === 'admin') {
    return Promise.resolve({ token: 'mock-token', user: mockUsers[0] });
  }
  return Promise.resolve(null);
}

export function listMembers(keyword?: string, status?: Member['status'], role?: Member['role']): Promise<Member[]> {
  let data = [...mockMembers];
  if (keyword) {
    const kw = keyword.trim();
    data = data.filter(m => m.nickname.includes(kw) || (m.qq?.includes(kw)));
  }
  if (status) {
    data = data.filter(m => m.status === status);
  }
  if (role) {
    data = data.filter(m => m.role === role);
  }
  return Promise.resolve(data);
}

export function getMember(id: string): Promise<Member | undefined> {
  return Promise.resolve(mockMembers.find(m => m.id === id));
}

export function upsertMember(member: Partial<Member> & { id?: string }): Promise<Member> {
  if (member.id) {
    const idx = mockMembers.findIndex(m => m.id === member.id);
    if (idx >= 0) {
      mockMembers[idx] = { ...mockMembers[idx], ...member } as Member;
      return Promise.resolve(mockMembers[idx]);
    }
  }
  const newItem: Member = {
    id: 'm' + (mockMembers.length + 1),
    nickname: member.nickname || '未命名',
    qq: member.qq,
    status: member.status || 'normal',
    joinAt: member.joinAt || new Date().toISOString(),
    remark: member.remark,
    role: member.role || 'member',
  };
  mockMembers.push(newItem);
  return Promise.resolve(newItem);
}

export function listActivityTypes(): Promise<ActivityType[]> {
  return Promise.resolve(mockActivityTypes);
}

export function upsertActivityType(payload: Partial<ActivityType> & { id?: string }): Promise<ActivityType> {
  if (payload.id) {
    const idx = mockActivityTypes.findIndex(t => t.id === payload.id);
    if (idx >= 0) {
      mockActivityTypes[idx] = { ...mockActivityTypes[idx], ...payload } as ActivityType;
      return Promise.resolve(mockActivityTypes[idx]);
    }
  }
  const newItem: ActivityType = {
    id: 't' + (mockActivityTypes.length + 1),
    code: (payload.code as string) || `type_${mockActivityTypes.length + 1}`,
    name: payload.name || '新活动',
    scheduleRule: payload.scheduleRule,
    enabled: payload.enabled ?? true,
    durationMinutes: payload.durationMinutes ?? 120,
  };
  mockActivityTypes.push(newItem);
  return Promise.resolve(newItem);
}

export function deleteActivityType(id: string): Promise<boolean> {
  const idx = mockActivityTypes.findIndex(t => t.id === id);
  if (idx === -1) return Promise.resolve(false);
  mockActivityTypes.splice(idx, 1);
  return Promise.resolve(true);
}

export function listSessions(params: { typeId?: string; from?: string; to?: string; status?: ActivitySession['status'] }): Promise<ActivitySession[]> {
  let data = [...mockSessions];
  if (params.typeId) data = data.filter(s => s.typeId === params.typeId);
  if (params.status) data = data.filter(s => s.status === params.status);
  if (params.from) data = data.filter(s => dayjs(s.startAt).isAfter(dayjs(params.from)) || dayjs(s.startAt).isSame(dayjs(params.from)));
  if (params.to) data = data.filter(s => dayjs(s.startAt).isBefore(dayjs(params.to)) || dayjs(s.startAt).isSame(dayjs(params.to)));
  return Promise.resolve(data);
}

export function getSession(id: string): Promise<ActivitySession | undefined> {
  return Promise.resolve(mockSessions.find(s => s.id === id));
}

export function upsertSession(payload: Partial<ActivitySession> & { id?: string }): Promise<ActivitySession> {
  if (payload.id) {
    const idx = mockSessions.findIndex(s => s.id === payload.id);
    if (idx >= 0) {
      mockSessions[idx] = { ...mockSessions[idx], ...payload } as ActivitySession;
      return Promise.resolve(mockSessions[idx]);
    }
  }
  const type = mockActivityTypes.find(t => t.id === payload.typeId);
  const newItem: ActivitySession = {
    id: 's' + (mockSessions.length + 1),
    typeId: payload.typeId!,
    name: payload.name || '新场次',
    startAt: payload.startAt || new Date().toISOString(),
    endAt: payload.endAt || dayjs(payload.startAt || new Date().toISOString()).add(type?.durationMinutes || 120, 'minute').toISOString(),
    status: payload.status || 'draft',
    notes: payload.notes,
  };
  mockSessions.push(newItem);
  // 新增需求：创建场次时，默认插入所有正常成员为未设置
  const normals = mockMembers.filter(m => m.status === 'normal');
  const now = new Date().toISOString();
  normals.forEach(m => {
    mockParticipations.push({
      id: 'p' + (mockParticipations.length + 1),
      sessionId: newItem.id,
      memberId: m.id,
      status: 'unset',
      score: 0,
      setBy: 'u1',
      setAt: now,
    });
  });
  return Promise.resolve(newItem);
}

export function listParticipations(sessionId: string): Promise<Participation[]> {
  return Promise.resolve(mockParticipations.filter(p => p.sessionId === sessionId));
}

export async function listMemberParticipations(memberId: string, typeId?: string): Promise<ParticipationWithSession[]> {
  const ps = mockParticipations.filter(p => p.memberId === memberId);
  const sessions = typeId ? mockSessions.filter(s => s.typeId === typeId) : mockSessions;
  const sessionMap = new Map(sessions.map(s => [s.id, s] as const));
  return ps.filter(p => sessionMap.has(p.sessionId)).map(p => ({ ...p, session: sessionMap.get(p.sessionId)! }));
}

export function bulkUpsertParticipations(sessionId: string, items: Array<{ memberId: string; status: ParticipationStatus; score?: number; note?: string }>): Promise<Participation[]> {
  const existed = mockParticipations.filter(p => p.sessionId === sessionId);
  items.forEach(it => {
    const idx = existed.findIndex(p => p.memberId === it.memberId);
    const now = new Date().toISOString();
    if (idx >= 0) {
      const globalIdx = mockParticipations.findIndex(p => p.id === existed[idx].id);
      mockParticipations[globalIdx] = { ...mockParticipations[globalIdx], ...it, setBy: 'u1', setAt: now } as Participation;
    } else {
      mockParticipations.push({ id: 'p' + (mockParticipations.length + 1), sessionId, memberId: it.memberId, status: it.status, score: it.score, note: it.note, setBy: 'u1', setAt: now });
    }
  });
  return Promise.resolve(mockParticipations.filter(p => p.sessionId === sessionId));
}

export function deleteParticipation(participationId: string): Promise<boolean> {
  const idx = mockParticipations.findIndex(p => p.id === participationId);
  if (idx === -1) return Promise.resolve(false);
  mockParticipations.splice(idx, 1);
  return Promise.resolve(true);
}

export function deleteSession(sessionId: string): Promise<boolean> {
  const sIdx = mockSessions.findIndex(s => s.id === sessionId);
  if (sIdx === -1) return Promise.resolve(false);
  mockSessions.splice(sIdx, 1);
  // 同时删除该场次的参与记录
  for (let i = mockParticipations.length - 1; i >= 0; i--) {
    if (mockParticipations[i].sessionId === sessionId) {
      mockParticipations.splice(i, 1);
    }
  }
  return Promise.resolve(true);
}

export function leaderboard(params: { typeId?: string; from?: string; to?: string; sort?: 'score' | 'avgScore' | 'attendance' }): Promise<LeaderboardItem[]> {
  // 简化：基于现有 participation 做聚合
  const byMember = new Map<string, { member: Member; totalScore: number; times: number; participated: number; total: number }>();
  const filteredSessions = mockSessions.filter(s => (!params.typeId || s.typeId === params.typeId) && (!params.from || dayjs(s.startAt).isAfter(dayjs(params.from)) || dayjs(s.startAt).isSame(params.from)) && (!params.to || dayjs(s.startAt).isBefore(dayjs(params.to)) || dayjs(s.startAt).isSame(params.to)));
  const filteredParticipations = mockParticipations.filter(p => filteredSessions.some(s => s.id === p.sessionId));
  filteredParticipations.forEach(p => {
    const m = mockMembers.find(mm => mm.id === p.memberId);
    if (!m) return;
    if (!byMember.has(m.id)) byMember.set(m.id, { member: m, totalScore: 0, times: 0, participated: 0, total: 0 });
    const item = byMember.get(m.id)!;
    item.total += 1;
    item.times += 1;
    if (p.status === 'participated') item.participated += 1;
    item.totalScore += p.score || 0;
  });
  let result: LeaderboardItem[] = Array.from(byMember.values()).map(x => ({ member: x.member, totalScore: x.totalScore, avgScore: x.times ? x.totalScore / x.times : 0, attendance: x.total ? x.participated / x.total : 0, times: x.times }));
  switch (params.sort) {
    case 'avgScore':
      result = result.sort((a, b) => b.avgScore - a.avgScore);
      break;
    case 'attendance':
      result = result.sort((a, b) => b.attendance - a.attendance);
      break;
    default:
      result = result.sort((a, b) => b.totalScore - a.totalScore);
  }
  return Promise.resolve(result);
}


