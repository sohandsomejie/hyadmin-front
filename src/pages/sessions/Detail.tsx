import { Button, Card, InputNumber, Popconfirm, Select, Space, Table, message } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { ActivitySession, Member, Participation, ParticipationStatus } from '../../types';
import { apiBulkUpsertParticipations, apiDeleteParticipation, apiGetSession, apiListMembers, apiListParticipations } from '../../api';
import dayjs from 'dayjs';
import { bulkUpsertParticipations, listParticipations } from '../../api/mock';

export default function SessionDetailPage() {
  const { id } = useParams();
  const [session, setSession] = useState<ActivitySession | undefined>();
  const [members, setMembers] = useState<Member[]>([]);
  const [rows, setRows] = useState<Participation[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => { if (id) apiGetSession(id).then(setSession); }, [id]);
  useEffect(() => { apiListMembers({}).then(r => setMembers(r.items)); }, []);
  useEffect(() => { if (id) apiListParticipations(id).then(setRows); }, [id]);

  const columns = useMemo(() => [
    { title: '成员', dataIndex: 'memberId', render: (v: string) => members.find(m => m.id === v)?.nickname || v },
    { title: '状态', dataIndex: 'status', render: (_: ParticipationStatus, row: Participation) => (
      <Select
        size="small"
        style={{ width: 120 }}
        value={row.status}
        onChange={async (val) => {
          if (!id) return;
          setLoading(true);
          await apiBulkUpsertParticipations(id, [{ memberId: row.memberId, status: val as ParticipationStatus, score: row.score }]);
          const res = await apiListParticipations(id);
          setRows(res);
          setLoading(false);
          message.success('已更新状态');
        }}
        options={[
          { label: '参与', value: 'participated' },
          { label: '请假', value: 'leave' },
          { label: '未知', value: 'unknown' },
          { label: '未设置', value: 'unset' },
        ]}
      />
    ) },
    { title: '分数', dataIndex: 'score', sorter: (a: Participation, b: Participation) => (a.score || 0) - (b.score || 0), render: (_: number, row: Participation) => {
      // 提取保存分数的函数
      const saveScore = async (val: number | null) => {
        if (!id) return;
        setLoading(true);
        await apiBulkUpsertParticipations(id, [{ memberId: row.memberId, status: row.status, score: Number.isFinite(val) ? val as number : undefined }]);
        const res = await apiListParticipations(id);
        setRows(res);
        setLoading(false);
        message.success('已更新分数');
      };
      return (
        <InputNumber
          size="small"
          value={row.score}
          onBlur={async (e) => {
            const val = Number((e.target as HTMLInputElement).value);
            await saveScore(val);
          }}
          onPressEnter={async (e) => {
            const val = Number((e.target as HTMLInputElement).value);
            await saveScore(val);
          }}
        />
      );
    } },
    { title: '操作', render: (_: unknown, row: Participation) => (
      <Popconfirm title="删除该成员参与记录？" onConfirm={async () => { if (!id) return; await apiDeleteParticipation(id, row.id); setRows(await apiListParticipations(id)); }}>
        <a>删除</a>
      </Popconfirm>
    ) },
  ], [members, id]);

  const [editing, setEditing] = useState<{ memberId: string; status: ParticipationStatus; score?: number } | null>(null);
  const onAddOrEdit = async () => {
    if (!id || !editing) return;
    setLoading(true);
    await bulkUpsertParticipations(id, [{ memberId: editing.memberId, status: editing.status, score: editing.score }]);
    const res = await listParticipations(id);
    setRows(res);
    setEditing(null);
    setLoading(false);
    message.success('已保存');
  };
  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Card title={session?.name} extra={<span>{session ? (() => {
        const now = dayjs();
        const start = dayjs(session.startAt);
        const end = dayjs(session.endAt || session.startAt);
        if (now.isBefore(start)) return '未开始';
        if (now.isAfter(end)) return '已结束';
        return '进行中';
      })() : ''}</span>}>
        <Space wrap>
          <Select
            placeholder="选择成员"
            style={{ width: 200 }}
            value={editing?.memberId}
            onChange={(v) => setEditing(prev => ({ ...(prev || { status: 'unset' }), memberId: v }))}
            options={members.filter(m => m.status === 'normal').map(m => ({ label: m.nickname, value: m.id }))}
          />
          <Select
            placeholder="状态"
            style={{ width: 160 }}
            value={editing?.status}
            onChange={(v) => setEditing(prev => ({ ...(prev || { memberId: members[0]?.id }), status: v as ParticipationStatus }))}
            options={[
              { label: '参与', value: 'participated' },
              { label: '请假', value: 'leave' },
              { label: '未知', value: 'unknown' },
              { label: '未设置', value: 'unset' },
            ]}
          />
          <InputNumber placeholder="分数" value={editing?.score} onChange={(v) => setEditing(prev => ({ ...(prev || { memberId: members[0]?.id, status: 'unset' }), score: Number(v) }))} />
          <Button type="primary" onClick={onAddOrEdit} loading={loading}>保存</Button>
        </Space>
      </Card>

      <Table rowKey="id" columns={columns} dataSource={rows} loading={loading} pagination={{ pageSize: 10 }} />
    </Space>
  );
}


