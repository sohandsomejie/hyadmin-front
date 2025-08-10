import { Card, List, Space, Tag } from 'antd';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { leaderboard, listActivityTypes, listSessions } from '../../api/mock';
import type { ActivitySession, ActivityType, LeaderboardItem } from '../../types';
import { useNavigate } from 'react-router-dom';

export default function SessionOverviewPage() {
  const [types, setTypes] = useState<ActivityType[]>([]);
  const [latestByType, setLatestByType] = useState<Record<string, { last?: ActivitySession; nextTime?: string; top?: LeaderboardItem[] }>>({});
  const navigate = useNavigate();

  useEffect(() => { listActivityTypes().then(setTypes); }, []);
  useEffect(() => {
    (async () => {
      const map: Record<string, { last?: ActivitySession; nextTime?: string; top?: LeaderboardItem[] }> = {};
      for (const t of types) {
        const sessions = await listSessions({ typeId: t.id });
        const sorted = sessions.sort((a, b) => dayjs(b.startAt).valueOf() - dayjs(a.startAt).valueOf());
        const last = sorted[0];
        let nextTime: string | undefined;
        if (t.scheduleRule) {
          // 下一次活动时间（本周/下周对应 weekday）
          const now = dayjs();
          let next = now.day(t.scheduleRule.weekday).hour(Number(t.scheduleRule.time.split(':')[0])).minute(Number(t.scheduleRule.time.split(':')[1])).second(0);
          if (next.isBefore(now)) next = next.add(7, 'day');
          nextTime = next.format('YYYY-MM-DD HH:mm');
        }
        const top = (await leaderboard({ typeId: t.id, sort: 'score' })).slice(0, 3);
        map[t.id] = { last, nextTime, top };
      }
      setLatestByType(map);
    })();
  }, [types]);

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <List
        grid={{ gutter: 16, column: 2 }}
        dataSource={types}
        renderItem={(t) => (
          <List.Item>
            <Card title={t.name} extra={<a onClick={() => navigate(`/sessions?type=${t.id}`)}>进入活动</a>}>
              <div>下次时间：{latestByType[t.id]?.nextTime || '-'}</div>
              <div style={{ marginTop: 8 }}>上次场次：{latestByType[t.id]?.last ? (
                <a onClick={() => navigate(`/sessions/${latestByType[t.id]!.last!.id}`)}>{latestByType[t.id]!.last!.name}</a>
              ) : '-'} {latestByType[t.id]?.last ? <Tag style={{ marginLeft: 8 }}>{latestByType[t.id]!.last!.status === 'draft' ? '草稿' : latestByType[t.id]!.last!.status === 'closed' ? '已关闭' : '已锁定'}</Tag> : null}</div>
              <div style={{ marginTop: 8 }}>TOP3：{latestByType[t.id]?.top?.map(x => x.member.nickname).join('、') || '-'}</div>
            </Card>
          </List.Item>
        )}
      />
    </Space>
  );
}




