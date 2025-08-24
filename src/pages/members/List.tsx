import { Button, Input, Segmented, Space, Table, Tag, Select, Popconfirm, message } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Member } from '../../types';
import { apiListMembers, apiDeleteMember } from '../../api';
import { useNavigate } from 'react-router-dom';

export default function MemberListPage() {
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<'all' | 'normal' | 'left'>('all');
  const [loading, setLoading] = useState(false);
  const [role, setRole] = useState<'all' | 'trainee' | 'senior' | 'member' | 'leader'>('all');
  const [data, setData] = useState<Member[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [total, setTotal] = useState(0);
  const navigate = useNavigate();

  const fetchData = useCallback(async () => {
    setLoading(true);
    const res = await apiListMembers({
      keyword: keyword || undefined,
      status: status === 'all' ? undefined : status,
      role: role === 'all' ? undefined : role,
      page,
      pageSize,
    });
    setData(res.items);
    setTotal(res.total || 0);
    setLoading(false);
  }, [keyword, status, role, page, pageSize]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const columns = useMemo(() => {
    const roleOrder: Record<NonNullable<Member['role']>, number> = { trainee: 1, member: 2, senior: 3, leader: 4 };
    return [
    { title: '昵称', dataIndex: 'nickname' },
    { title: 'QQ', dataIndex: 'qq' },
    { title: '角色', dataIndex: 'role', render: (v: Member['role']) => ({ trainee: '学员', senior: '高层', member: '成员', leader: '首领' }[v || 'member']), sorter: (a: Member, b: Member) => (roleOrder[(a.role || 'member') as keyof typeof roleOrder] - roleOrder[(b.role || 'member') as keyof typeof roleOrder]) },
    { title: '状态', dataIndex: 'status', render: (v: Member['status']) => v === 'normal' ? <Tag color="green">正常</Tag> : <Tag>离开</Tag> },
    { title: '操作', render: (_: unknown, row: Member) => (
      <Space>
        <Button type="link" onClick={() => navigate(`/members/${row.id}`)}>详情</Button>
        <Button type="link" onClick={() => navigate(`/members/${row.id}/edit`)}>编辑</Button>
        <Popconfirm
          title="确认删除该成员？"
          okText="删除"
          okType="danger"
          cancelText="取消"
          onConfirm={async () => {
            await apiDeleteMember(row.id);
            message.success('已删除成员');
            fetchData();
          }}
        >
          <Button type="link" danger>删除</Button>
        </Popconfirm>
      </Space>
    ) }
  ];
  }, [navigate, fetchData]);

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Space>
        <Input.Search placeholder="搜索昵称/QQ" value={keyword} onChange={e => setKeyword(e.target.value)} onSearch={fetchData} allowClear />
        <Segmented options={[{label:'全部',value:'all'},{label:'正常',value:'normal'},{label:'离开',value:'left'}]} value={status} onChange={(v) => setStatus(v as 'all'|'normal'|'left')} />
        <Select placeholder="角色" style={{ width: 160 }} value={role} onChange={v => setRole(v)} options={[
          { label: '全部', value: 'all' },
          { label: '学员', value: 'trainee' },
          { label: '高层', value: 'senior' },
          { label: '成员', value: 'member' },
          { label: '首领', value: 'leader' },
        ]} />
        <Button type="primary" onClick={() => navigate('/members/new')}>新增成员</Button>
      </Space>
      <Table
        rowKey="id"
        loading={loading}
        columns={columns}
        dataSource={data}
        pagination={{ current: page, pageSize, total, showSizeChanger: true, onChange: (p, ps) => { setPage(p); setPageSize(ps); } }}
      />
    </Space>
  );
}


