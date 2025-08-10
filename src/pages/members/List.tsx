import { Button, Input, Segmented, Space, Table, Tag, Select } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import type { Member } from '../../types';
import { apiListMembers } from '../../api';
import { useNavigate } from 'react-router-dom';

export default function MemberListPage() {
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<'all' | 'normal' | 'left'>('all');
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<'all' | 'trainee' | 'senior' | 'member' | 'leader'>('all');
  const [data, setData] = useState<Member[]>([]);
  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    const res = await apiListMembers({
      keyword: keyword || undefined,
      status: status === 'all' ? undefined : status,
      role: role === 'all' ? undefined : role,
    });
    setData(res.items);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [status, role]);

  const columns = useMemo(() => {
    const roleOrder: Record<NonNullable<Member['role']>, number> = { trainee: 1, member: 2, senior: 3, leader: 4 };
    return [
    { title: '昵称', dataIndex: 'nickname' },
    { title: 'QQ', dataIndex: 'qq' },
    { title: '角色', dataIndex: 'role', render: (v: Member['role']) => ({ trainee: '学员', senior: '高层', member: '成员', leader: '首领' }[v || 'member']), sorter: (a: Member, b: Member) => (roleOrder[(a.role || 'member') as keyof typeof roleOrder] - roleOrder[(b.role || 'member') as keyof typeof roleOrder]) },
    { title: '状态', dataIndex: 'status', render: (v: Member['status']) => v === 'normal' ? <Tag color="green">正常</Tag> : <Tag>离开</Tag> },
    { title: '操作', render: (_: unknown, row: Member) => (<Space>
      <Button type="link" onClick={() => navigate(`/members/${row.id}`)}>详情</Button>
      <Button type="link" onClick={() => navigate(`/members/${row.id}/edit`)}>编辑</Button>
    </Space>) }
  ];
  }, []);

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Space>
        <Input.Search placeholder="搜索昵称/QQ" value={keyword} onChange={e => setKeyword(e.target.value)} onSearch={fetchData} allowClear />
        <Segmented options={[{label:'全部',value:'all'},{label:'正常',value:'normal'},{label:'离开',value:'left'}]} value={status} onChange={v => setStatus(v as any)} />
        <Select placeholder="角色" style={{ width: 160 }} value={role} onChange={v => setRole(v)} options={[
          { label: '全部', value: 'all' },
          { label: '学员', value: 'trainee' },
          { label: '高层', value: 'senior' },
          { label: '成员', value: 'member' },
          { label: '首领', value: 'leader' },
        ]} />
        <Button type="primary" onClick={() => navigate('/members/new')}>新增成员</Button>
      </Space>
      <Table rowKey="id" loading={loading} columns={columns} dataSource={data} pagination={{ pageSize: 10 }} />
    </Space>
  );
}


