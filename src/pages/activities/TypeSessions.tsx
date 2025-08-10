import { Button, Card, DatePicker, Form, Input, Modal, Popconfirm, Space, Table, Tag, TimePicker, message } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { apiDeleteSession, apiListActivityTypes, apiListSessions, apiUpsertSession } from '../../api';
import type { ActivitySession, ActivityType } from '../../types';

export default function ActivityTypeSessionsPage() {
  const { typeId } = useParams();
  const [type, setType] = useState<ActivityType | undefined>();
  const [data, setData] = useState<ActivitySession[]>([]);
  const [range, setRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    (async () => {
      const types = await apiListActivityTypes();
      setType(types.find(t => t.id === typeId));
    })();
  }, [typeId]);

  const fetchData = async () => {
    setLoading(true);
    const res = await apiListSessions({ typeId, from: range?.[0]?.toISOString(), to: range?.[1]?.toISOString() });
    setData(res.items);
    setLoading(false);
  };
  useEffect(() => { fetchData(); }, [typeId, range]);

  const columns = useMemo(() => [
    { title: '名称', dataIndex: 'name', render: (_: string, row: ActivitySession) => <Link to={`/sessions/${row.id}`}>{row.name}</Link> },
    { title: '开始时间', dataIndex: 'startAt', render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm') },
    { title: '结束时间', dataIndex: 'endAt', render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm') },
    { title: '状态', render: (_: unknown, row: ActivitySession) => {
      const now = dayjs();
      const start = dayjs(row.startAt);
      const end = dayjs(row.endAt || row.startAt);
      if (now.isBefore(start)) return <Tag>未开始</Tag>;
      if (now.isAfter(end)) return <Tag color="green">已结束</Tag>;
      return <Tag color="blue">进行中</Tag>;
    } },
    { title: '操作', render: (_: unknown, row: ActivitySession) => (
      <Space>
        <a onClick={() => { form.setFieldsValue({ id: row.id, name: row.name, date: dayjs(row.startAt), timeStart: dayjs(row.startAt), timeEnd: dayjs(row.endAt) }); setOpen(true); }}>编辑</a>
        <Popconfirm title="确认删除该场次？" onConfirm={async () => { await apiDeleteSession(row.id); message.success('已删除'); await fetchData(); }}>
          <a>删除</a>
        </Popconfirm>
      </Space>
    ) },
  ], []);

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Card title={type?.name} extra={<Button type="primary" onClick={() => { form.resetFields(); setOpen(true); }}>添加场次</Button>}>
        <DatePicker.RangePicker showTime value={range as any} onChange={(v) => setRange(v as any)} />
      </Card>
      <Table rowKey="id" columns={columns} dataSource={data} loading={loading} />

      <Modal title={form.getFieldValue('id') ? '编辑场次' : '添加场次'} open={open} onCancel={() => setOpen(false)} onOk={() => form.submit()} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={async (values: any) => {
          if (!typeId || !type) return;
          const start = dayjs(values.date).hour(dayjs(values.timeStart).hour()).minute(dayjs(values.timeStart).minute()).second(0);
          const end = dayjs(values.date).hour(dayjs(values.timeEnd).hour()).minute(dayjs(values.timeEnd).minute()).second(0);
          await apiUpsertSession({ id: values.id, typeId, name: values.name, startAt: start.toISOString(), endAt: end.toISOString() });
          message.success(values.id ? '已保存' : '已添加场次并插入成员');
          setOpen(false);
          await fetchData();
        }}>
          <Form.Item name="id" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="name" label="场次名称" rules={[{ required: true, message: '请输入场次名称' }]}> 
            <Input placeholder={`${type?.name || ''} ${dayjs().format('YYYY-MM-DD')}`} />
          </Form.Item>
          <Form.Item label="开始/结束时间" required>
            <Space>
              <Form.Item name="date" noStyle rules={[{ required: true, message: '请选择日期' }]}> 
                <DatePicker />
              </Form.Item>
              <Form.Item name="timeStart" noStyle rules={[{ required: true, message: '请选择开始时间' }]}> 
                <TimePicker format="HH:mm" />
              </Form.Item>
              <Form.Item name="timeEnd" noStyle rules={[{ required: true, message: '请选择结束时间' }]}> 
                <TimePicker format="HH:mm" />
              </Form.Item>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}


