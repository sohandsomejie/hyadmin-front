import { Card, Descriptions, Segmented, Space, Statistic, Table, Select, Tag } from 'antd';
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { Member, LeaderboardItem, ParticipationWithSession, ActivityType } from '../../types';
import { apiGetMember, apiLeaderboard, apiListActivityTypes, apiListMemberParticipations } from '../../api';
import dayjs from 'dayjs';

export default function MemberDetailPage() {
  const { id } = useParams();
  const [member, setMember] = useState<Member | undefined>();
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('month');
  const [types, setTypes] = useState<ActivityType[]>([]);
  const [typeId, setTypeId] = useState<string | undefined>();
  const [history, setHistory] = useState<ParticipationWithSession[]>([]);
  const [stats, setStats] = useState<LeaderboardItem | undefined>();

  useEffect(() => {
    if (!id) return;
    apiGetMember(id).then(setMember);
  }, [id]);

  useEffect(() => {
    (async () => {
      const list = (await apiLeaderboard({ typeId, sort: 'score' })).items;
      const row = list.find(x => x.member.id === id);
      setStats(row);
    })();
  }, [id, period, typeId]);

  useEffect(() => {
    (async () => {
      const tps = await apiListActivityTypes();
      setTypes(tps);
      if (!typeId) setTypeId(tps.find(t => t.code === 'fortress')?.id || tps[0]?.id);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      if (!id) return;
      const rows = await apiListMemberParticipations(id, { typeId });
      setHistory(rows.items.sort((a, b) => dayjs(b.session.startAt).valueOf() - dayjs(a.session.startAt).valueOf()));
    })();
  }, [id, typeId]);

  if (!member) return null;

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Descriptions title="成员信息" bordered size="small">
        <Descriptions.Item label="昵称">{member.nickname}</Descriptions.Item>
        <Descriptions.Item label="QQ">{member.qq || '-'}</Descriptions.Item>
        <Descriptions.Item label="状态">{member.status === 'normal' ? '正常' : '离开'}</Descriptions.Item>
        <Descriptions.Item label="加入时间">{member.joinAt ? dayjs(member.joinAt).format('YYYY-MM-DD HH:mm') : '-'}</Descriptions.Item>
        <Descriptions.Item label="角色">{{ trainee: '学员', senior: '高层', member: '成员', leader: '首领' }[member.role || 'member']}</Descriptions.Item>
      </Descriptions>

      <Card title="统计">
        <Space>
          <Segmented options={[{label:'月度',value:'month'},{label:'季度',value:'quarter'},{label:'年度',value:'year'}]} value={period} onChange={v => setPeriod(v as any)} />
          <Select placeholder="活动类型" style={{ width: 200 }} value={typeId} onChange={setTypeId} options={types.map(t => ({ label: t.name, value: t.id }))} />
        </Space>
        <Space wrap style={{ marginTop: 16 }}>
          <Statistic title="总分" value={stats?.totalScore || 0} precision={0} />
          <Statistic title="平均分" value={stats?.avgScore || 0} precision={2} />
          <Statistic title="参与次数" value={stats?.times || 0} />
          <Statistic title="出勤率" value={(stats?.attendance || 0) * 100} precision={2} suffix="%" />
        </Space>
      </Card>

      <Card title="历史参与记录">
        <Table rowKey={(r) => r.id} dataSource={history} columns={[
          { title: '场次', dataIndex: ['session','name'] },
          { title: '开始时间', dataIndex: ['session','startAt'], render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm') },
          { title: '状态', dataIndex: 'status', render: (v: string) => {
            const map = {
              participated: { text: '参与', color: 'green' },
              leave: { text: '请假', color: 'orange' },
              unknown: { text: '未知', color: 'default' },
              unset: { text: '未设置', color: 'default' }
            };
            const item = map[v as keyof typeof map] || { text: v, color: 'default' };
            return <Tag color={item.color}>{item.text}</Tag>;
          } },
          { title: '分数', dataIndex: 'score' },
        ]} />
      </Card>
    </Space>
  );
}


