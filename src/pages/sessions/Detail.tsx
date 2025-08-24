import { Button, Card, Drawer, Image, InputNumber, Modal, Popconfirm, Select, Space, Table, Tag, Upload, message, Input } from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import type { ActivitySession, Member, Participation, ParticipationStatus } from '../../types';
import { apiBulkUpsertParticipations, apiDeleteParticipation, apiGetSession, apiListMembers, apiListParticipations } from '../../api';
import dayjs from 'dayjs';
import { apiCreateParses, apiListParses, apiCancelParse } from '../../api';
import { resolveFileUrl } from '../../api/http';

export default function SessionDetailPage() {
  const { id } = useParams();
  const [session, setSession] = useState<ActivitySession | undefined>();
  const [members, setMembers] = useState<Member[]>([]);
  const [rows, setRows] = useState<Participation[]>([]);
  const [totalRows, setTotalRows] = useState(0);
  const [loading, setLoading] = useState(false);
  const [pageP, setPageP] = useState(1);
  const [pageSizeP, setPageSizeP] = useState(10);

  useEffect(() => { if (id) apiGetSession(id).then(setSession); }, [id]);
  useEffect(() => { apiListMembers({pageSize: 1000 }).then(r => setMembers(r.items)); }, []);
  useEffect(() => { if (id) apiListParticipations(id, { page: pageP, pageSize: pageSizeP }).then(res => { setRows(res.items); setTotalRows(res.total || res.items.length); }); }, [id, pageP, pageSizeP]);
  const statusOptions = useMemo(() => {
    return [
      { label: '参与', value: 'participated' },
      { label: '请假', value: 'leave' },
      { label: '未知', value: 'unknown' },
      { label: '未设置', value: 'unset' },
    ];
  }, []);
  const columns = useMemo(() => [
    { title: '成员', dataIndex: 'memberId', render: (v: string) => {
      return members.find(m => m.id === v)?.nickname || v 
    }},
    { title: '状态', dataIndex: 'status', render: (_: ParticipationStatus, row: Participation) => (
      <Select
        size="small"
        style={{ width: 120 }}
        value={row.status}
        onChange={async (val) => {
          if (!id) return;
          setLoading(true);
          await apiBulkUpsertParticipations(id, [{ memberId: row.memberId, status: val as ParticipationStatus, score: row.score }]);
          const res = await apiListParticipations(id, { page: pageP, pageSize: pageSizeP });
          setRows(res.items);
          setTotalRows(res.total || res.items.length);
          setLoading(false);
          message.success('已更新状态');
        }}
        options={statusOptions}
      />
    ) },
    { title: '分数', dataIndex: 'score', sorter: (a: Participation, b: Participation) => (a.score || 0) - (b.score || 0), render: (_: number, row: Participation) => {
      // 提取保存分数的函数
      const saveScore = async (val: number | null) => {
        if (!id) return;
        setLoading(true);
        await apiBulkUpsertParticipations(id, [{ memberId: row.memberId, status: row.status, score: Number.isFinite(val) ? val as number : undefined }]);
        const res = await apiListParticipations(id, { page: pageP, pageSize: pageSizeP });
        setRows(res.items);
        setTotalRows(res.total || res.items.length);
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
      <Popconfirm title="删除该成员参与记录？" onConfirm={async () => { if (!id) return; await apiDeleteParticipation(id, row.id); const res = await apiListParticipations(id, { page: pageP, pageSize: pageSizeP }); setRows(res.items); setTotalRows(res.total || res.items.length); }}>
        <a>删除</a>
      </Popconfirm>
    ) },
  ], [members, id, pageP, pageSizeP]);

  // 后端已支持分页，无需本地切片

  const [editing, setEditing] = useState<{ memberId: string; status: ParticipationStatus; score?: number } | null>(null);
  const onAddOrEdit = async () => {
    if (!id || !editing) return;
    setLoading(true);
    await apiBulkUpsertParticipations(id, [{ memberId: editing.memberId, status: editing.status, score: editing.score }]);
    const res = await apiListParticipations(id, { page: pageP, pageSize: pageSizeP });
    setRows(res.items);
    setTotalRows(res.total || res.items.length);
    setEditing(null);
    setLoading(false);
    message.success('已保存');
  };
  // AI 工作流：截图列表与弹窗
  const [aiVisible, setAiVisible] = useState(false);
  const [insertVisible, setInsertVisible] = useState(false);
  type UiShot = { id: string | number; url: string; fileName?: string; status: 'queued'|'processing'|'succeeded'|'failed'|'canceled'|'timeout'; parsedPairs?: Array<{ name: string; score: number }> };
  const [screenshots, setScreenshots] = useState<UiShot[]>([]);
  const [selectedShot, setSelectedShot] = useState<UiShot | null>(null);
  type ParsedInsertRow = { memberId: string; name: string; score: number; status: ParticipationStatus };
  const [pairsToInsert, setPairsToInsert] = useState<ParsedInsertRow[]>([]);
  const [uploading, setUploading] = useState(false);
  const [workflowUrl, setWorkflowUrl] = useState<string>(() => {
    try {
      const raw = localStorage.getItem('app-settings');
      if (!raw) return 'https://ai.example.com/ingest';
      const obj = JSON.parse(raw) as { workflows?: Array<{ url: string; apiKey?: string; isDefault?: boolean }> };
      const cfg = (obj.workflows || []).find((w) => w.isDefault) || (obj.workflows || [])[0];
      return cfg?.url || 'https://ai.example.com/ingest';
    } catch { return 'https://ai.example.com/ingest'; }
  });
  const [workflowApiKey, setWorkflowApiKey] = useState<string | undefined>(() => {
    try {
      const raw = localStorage.getItem('app-settings');
      if (!raw) return undefined;
      const obj = JSON.parse(raw) as { workflows?: Array<{ url: string; apiKey?: string; isDefault?: boolean }> };
      const cfg = (obj.workflows || []).find((w) => w.isDefault) || (obj.workflows || [])[0];
      return cfg?.apiKey;
    } catch { return undefined; }
  });
  const [uploadList, setUploadList] = useState<UploadFile[]>([]);
  const [confirmVisible, setConfirmVisible] = useState(false);

  const refreshScreenshots = async () => {
    if (!id) return;
    const res = await apiListParses(id);
    type ServerParseItem = { id: string|number; url: string; status: UiShot['status']; data?: Array<{ name: string; score: number }> | null };
    const mapped: UiShot[] = (res.items as ServerParseItem[]).map((it) => ({
      id: it.id,
      url: resolveFileUrl(it.url),
      status: it.status as UiShot['status'],
      parsedPairs: Array.isArray(it.data) ? it.data : undefined,
    }));
    setScreenshots(mapped);
  };

  const openAi = async () => {
    setAiVisible(true);
    await refreshScreenshots();
  };

  const openInsertWithShot = async (shot: UiShot) => {
    setSelectedShot(shot);
    // 重新获取成员列表
    const fresh = await apiListMembers({pageSize: 1000});
    setMembers(fresh.items);
    // 将解析键值对映射到成员 ID；若不存在成员，则 memberId 为空字符串
    const normalize = (s?: string) => (s || '').replace(/\s+/g, '').toLowerCase();
    const items = (shot.parsedPairs || []).map((p: { name: string; score: number }) => {
      const pn = normalize(p.name);
      const found = fresh.items.find(m => {
        const mn = normalize(m.nickname);
        return mn === pn || mn.includes(pn) || pn.includes(mn);
      });
      return { memberId: found ? found.id : '', name: p.name, score: p.score, status: p.score > 0 ? 'participated' : 'unknown' } as ParsedInsertRow ;
    });
    setPairsToInsert(items);
    setInsertVisible(true);
  };

  const canInsert = useMemo(() => {
    if (!pairsToInsert.length) return false;
    return pairsToInsert.every(p => !!p.memberId);
  }, [pairsToInsert]);

  const doInsert = async () => {
    if (!id || !canInsert) return;
    setLoading(true);
    await apiBulkUpsertParticipations(
      id,
      pairsToInsert.map(p => ({ memberId: p.memberId, status: p.status, score: p.score }))
    );
    const res = await apiListParticipations(id, { page: pageP, pageSize: pageSizeP });
    setRows(res.items);
    setTotalRows(res.total || res.items.length);
    setLoading(false);
    setInsertVisible(false);
    message.success('已插入解析分数');
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
          <Button onClick={openAi}>AI 工作流</Button>
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
            options={statusOptions}
          />
          <InputNumber placeholder="分数" value={editing?.score} onChange={(v) => setEditing(prev => ({ ...(prev || { memberId: members[0]?.id, status: 'unset' }), score: Number(v) }))} />
          <Button type="primary" onClick={onAddOrEdit} loading={loading}>保存</Button>
        </Space>
      </Card>

      <Table
        rowKey="id"
        columns={columns}
        dataSource={rows}
        loading={loading}
        pagination={{ current: pageP, pageSize: pageSizeP, total: totalRows, showSizeChanger: true, onChange: (p, ps) => { setPageP(p); setPageSizeP(ps); } }}
      />

      <Modal
        title="AI 工作流"
        open={aiVisible}
        onCancel={() => setAiVisible(false)}
        footer={null}
        width={900}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Space>
            <Button onClick={refreshScreenshots} loading={loading}>刷新</Button>
            <Input style={{ width: 420 }} value={workflowUrl} onChange={(e) => setWorkflowUrl(e.target.value)} placeholder="工作流接收地址 (workflow_url)" />
            <Input.Password style={{ width: 260 }} value={workflowApiKey} onChange={(e) => setWorkflowApiKey(e.target.value)} placeholder="workflow_api_key（可选）" />
            <Button type="primary" disabled={!uploadList.length || uploading} onClick={() => setConfirmVisible(true)}>确认解析</Button>
          </Space>
          <Upload.Dragger
            multiple
            accept="image/*"
            beforeUpload={() => false}
            showUploadList
            disabled={uploading}
            fileList={uploadList}
            onChange={(info) => {
              setUploadList(info.fileList as UploadFile[]);
            }}
          >
            <p className="ant-upload-drag-icon">🖼️</p>
            <p className="ant-upload-text">点击或拖拽图片到此处上传（可多张）</p>
            <p className="ant-upload-hint">选择图片后，点击“确认解析”发起任务</p>
          </Upload.Dragger>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {screenshots.map(s => (
              <Card key={s.id} size="small" hoverable>
                <Space direction="vertical" style={{ width: '100%' }}>
                  <Image src={s.url} height={140} style={{ objectFit: 'contain' }} />
                  <Space align="center" wrap>
                    <span>{s.fileName || String(s.id)}</span>
                    {s.status === 'succeeded' ? <Tag color="green">已解析</Tag> : s.status === 'processing' || s.status === 'queued' ? <Tag color="blue">处理中</Tag> : s.status === 'failed' ? <Tag color="red">失败</Tag> : s.status === 'canceled' ? <Tag>已取消</Tag> : <Tag>超时</Tag>}
                  </Space>
                  <Space>
                    <Button size="small" disabled={s.status !== 'succeeded'} onClick={() => openInsertWithShot(s)}>加入插入弹窗</Button>
                    <Button size="small" danger onClick={async () => { await apiCancelParse(s.id); await refreshScreenshots(); }}>取消解析</Button>
                  </Space>
                </Space>
              </Card>
            ))}
          </div>
        </Space>
      </Modal>

      <Modal
        title="确认解析"
        open={confirmVisible}
        onCancel={() => setConfirmVisible(false)}
        onOk={async () => {
          if (!id) return;
          const files = uploadList.map(f => f.originFileObj).filter(Boolean) as File[];
          if (!files.length) { setConfirmVisible(false); return; }
          try {
            setUploading(true);
            await apiCreateParses(id, files, workflowUrl, undefined, workflowApiKey);
            setUploadList([]);
            setConfirmVisible(false);
            await refreshScreenshots();
            message.success('已创建解析任务');
          } finally {
            setUploading(false);
          }
        }}
        okButtonProps={{ disabled: !uploadList.length || uploading, loading: uploading }}
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>将提交以下图片进行解析：</div>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {uploadList.map((f) => (
              <li key={f.uid}>{f.name}</li>
            ))}
          </ul>
        </Space>
      </Modal>

      <Drawer
        title="插入解析结果"
        open={insertVisible}
        onClose={() => setInsertVisible(false)}
        width={700}
        extra={
          <Space>
            <Button onClick={() => setInsertVisible(false)}>取消</Button>
            <Button type="primary" onClick={doInsert} disabled={!canInsert} loading={loading}>插入</Button>
          </Space>
        }
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {selectedShot && (
            <Image src={selectedShot.url} height={180} style={{ objectFit: 'contain' }} />
          )}
          <Table<ParsedInsertRow>
            size="small"
            rowKey={(r) => r.name + String(r.score)}
            pagination={false}
            dataSource={pairsToInsert}
            columns={[
              { title: '解析成员名', dataIndex: 'name' },
              {
                title: '匹配成员', dataIndex: 'memberId', render: (_: unknown, row: ParsedInsertRow, idx: number) => (
                  <Select
                    showSearch
                    placeholder="选择成员"
                    style={{ width: 200 }}
                    value={row.memberId || undefined}
                    onChange={(v) => setPairsToInsert(prev => prev.map((it, i) => i === idx ? { ...it, memberId: v } : it))}
                    filterOption={(input, option) => (option?.label as string).includes(input)}
                    options={members.map(m => ({ label: m.nickname, value: m.id }))}
                  />
                )
              },
              { title: '分数', dataIndex: 'score', render: (_: number, row: ParsedInsertRow, idx: number) => (
                <InputNumber
                  size="small"
                  min={0}
                  style={{ width: 100 }}
                  value={row.score}
                  onChange={(v) => setPairsToInsert(prev => prev.map((it, i) => i === idx ? { ...it, score: Number(v) } : it))}
                  onPressEnter={(e) => {
                    const val = Number((e.target as HTMLInputElement).value);
                    setPairsToInsert(prev => prev.map((it, i) => i === idx ? { ...it, score: val } : it));
                  }}
                />
              ) },
              {
                title: '状态', dataIndex: 'status', render: (_: unknown, row: ParsedInsertRow, idx: number) => (
                  <Select
                    size="small"
                    style={{ width: 120 }}
                    value={row.status}
                    options={statusOptions}
                    onChange={(v) => setPairsToInsert(prev => prev.map((it, i) => i === idx ? { ...it, status: v as ParticipationStatus } : it))}
                  />
                )
              },
              {
                title: '校验', render: (_: unknown, row: ParsedInsertRow) => (
                  row.memberId ? <Tag color="green">可插入</Tag> : <Tag color="red">未匹配</Tag>
                )
              }
            ]}
          />
        </Space>
      </Drawer>
    </Space>
  );
}


