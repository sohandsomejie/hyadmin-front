import { Button, Card, DatePicker, Select, Space, Table, Tag, message } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { apiListActivityTypes, apiListSessions, apiUpsertSession } from '../../api';
import type { ActivitySession, ActivityType } from '../../types';
import { useNavigate } from 'react-router-dom';

export default function SessionListPage() {
  const [types, setTypes] = useState<ActivityType[]>([]);
  const [typeId, setTypeId] = useState<string | undefined>();
  const [range, setRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [computedStatus, setComputedStatus] = useState<'all' | 'notStarted' | 'inProgress' | 'finished'>('all');
  const [data, setData] = useState<ActivitySession[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => { apiListActivityTypes().then(setTypes); }, []);

  const fetchData = async () => {
    setLoading(true);
    const res = await apiListSessions({ typeId, from: range?.[0]?.toISOString(), to: range?.[1]?.toISOString() });
    setData(res.items);
    setLoading(false);
  };
  useEffect(() => { fetchData(); }, [typeId, range]);

  const getComputedStatus = (row: ActivitySession): 'notStarted' | 'inProgress' | 'finished' => {
    const now = dayjs();
    const start = dayjs(row.startAt);
    const end = dayjs(row.endAt || row.startAt);
    if (now.isBefore(start)) return 'notStarted';
    if (now.isAfter(end)) return 'finished';
    return 'inProgress';
  };

  const filteredData = useMemo(() => {
    if (computedStatus === 'all') return data;
    return data.filter(r => getComputedStatus(r) === computedStatus);
  }, [data, computedStatus]);

  const columns = useMemo(() => [
    { title: '名称', dataIndex: 'name' },
    { title: '开始时间', dataIndex: 'startAt', render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm') },
    { title: '结束时间', dataIndex: 'endAt', render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm') },
    { title: '状态', render: (_: unknown, row: ActivitySession) => {
      const st = getComputedStatus(row);
      if (st === 'notStarted') return <Tag>未开始</Tag>;
      if (st === 'inProgress') return <Tag color="blue">进行中</Tag>;
      return <Tag color="green">已结束</Tag>;
    } },
    { title: '操作', render: (_: unknown, row: ActivitySession) => <a onClick={() => navigate(`/sessions/${row.id}`)}>详情</a> }
  ], []);

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Card>
        <Space wrap>
          <Select placeholder="活动类型" style={{ width: 200 }} allowClear value={typeId} onChange={setTypeId} options={types.map(t => ({ label: t.name, value: t.id }))} />
          <DatePicker.RangePicker showTime value={range as any} onChange={(v) => setRange(v as any)} />
          <Select placeholder="状态" style={{ width: 160 }} value={computedStatus} onChange={v => setComputedStatus(v)} options={[
            { label: '全部', value: 'all' },
            { label: '未开始', value: 'notStarted' },
            { label: '进行中', value: 'inProgress' },
            { label: '已结束', value: 'finished' },
          ]} />
          <Button type="primary" onClick={async () => {
            if (!typeId) { message.warning('请先选择活动类型'); return; }
            const t = types.find(t => t.id === typeId);
            await apiUpsertSession({ typeId, name: `${t?.name || '场次'} ${dayjs().format('YYYY-MM-DD')}`, startAt: dayjs().toISOString(), endAt: dayjs().add(2,'hour').toISOString() });
            message.success('已创建场次并默认插入成员');
            setRange(null);
            setComputedStatus('all');
            await fetchData();
          }}>添加场次</Button>
        </Space>
      </Card>
      <Table rowKey="id" loading={loading} columns={columns} dataSource={filteredData} />
    </Space>
  );
}


