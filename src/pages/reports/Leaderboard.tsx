import { Card, Select, Segmented, Space, Table } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { apiLeaderboard, apiListActivityTypes } from '../../api';
import type { ActivityType, LeaderboardItem } from '../../types';

export default function LeaderboardPage() {
  const [types, setTypes] = useState<ActivityType[]>([]);
  const [typeId, setTypeId] = useState<string | undefined>();
  const [period, setPeriod] = useState<'month' | 'quarter' | 'year'>('month');
  const [sort, setSort] = useState<'score' | 'avgScore' | 'attendance'>('score');
  const [rows, setRows] = useState<LeaderboardItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { 
    (async () => {
      const tps = await apiListActivityTypes();
      setTypes(tps);
      // 默认要塞
      const fortress = tps.find(t => t.code === 'fortress')?.id || tps[0]?.id;
      setTypeId(fortress);
    })();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const res = await apiLeaderboard({ typeId, sort });
    setRows(res.items);
    setLoading(false);
  };
  useEffect(() => { fetchData(); }, [typeId, period, sort]);

  const columns = useMemo(() => [
    { title: '成员', dataIndex: ['member','nickname'] as any },
    { title: '总分', dataIndex: 'totalScore' as const, sorter: (a: LeaderboardItem, b: LeaderboardItem) => a.totalScore - b.totalScore },
    { title: '平均分', dataIndex: 'avgScore' as const, sorter: (a: LeaderboardItem, b: LeaderboardItem) => a.avgScore - b.avgScore },
    { title: '参与次数', dataIndex: 'times' as const },
    { title: '出勤率', dataIndex: 'attendance' as const, render: (v: number) => `${(v * 100).toFixed(2)}%`, sorter: (a: LeaderboardItem, b: LeaderboardItem) => a.attendance - b.attendance },
  ], []);

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Card>
        <Space wrap>
          <Select placeholder="活动类型" style={{ width: 200 }} allowClear value={typeId} onChange={setTypeId} options={types.map(t => ({ label: t.name, value: t.id }))} />
          <Segmented options={[{label:'月度',value:'month'},{label:'季度',value:'quarter'},{label:'年度',value:'year'}]} value={period} onChange={v => setPeriod(v as any)} />
          <Select value={sort} onChange={v => setSort(v)} options={[{label:'按总分',value:'score'},{label:'按平均分',value:'avgScore'},{label:'按出勤率',value:'attendance'}]} />
        </Space>
      </Card>
      <Table rowKey={(r) => r.member.id} columns={columns} dataSource={rows} loading={loading} />
    </Space>
  );
}


