import { Button, Card, Col, Form, Input, Modal, Popconfirm, Row, Space, Switch, TimePicker, message, Select, Tag } from 'antd';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { apiDeleteActivityType, apiListActivityTypes, apiListMembers, apiListParticipations, apiListSessions, apiUpsertActivityType } from '../../api';
import type { ActivitySession, ActivityType } from '../../types';
import { useNavigate } from 'react-router-dom';

function computeNextStartAt(rule?: { weekday: number; time: string }) {
  if (!rule) return undefined;
  const [hour, minute] = rule.time.split(':').map(Number);
  let next = dayjs().hour(hour).minute(minute).second(0);
  // dayjs weekday: Sunday 0 ... Saturday 6
  const target = rule.weekday % 7;
  const delta = (target - next.day() + 7) % 7;
  if (delta === 0 && next.isBefore(dayjs())) {
    next = next.add(7, 'day');
  } else {
    next = next.add(delta, 'day');
  }
  return next;
}

export default function ActivitiesOverviewPage() {
  const [types, setTypes] = useState<ActivityType[]>([]);
  const [sessionsByType, setSessionsByType] = useState<Record<string, ActivitySession[]>>({});
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<ActivityType | null>(null);
  const [form] = Form.useForm();
  const navigate = useNavigate();
  // const [period, setPeriod] = useState<'month'|'quarter'|'year'>('month');

  useEffect(() => { apiListActivityTypes().then(setTypes); }, []);

  const [memberMap, setMemberMap] = useState<Record<string, string>>({});
  useEffect(() => {
    (async () => {
      const ms = (await apiListMembers({})).items;
      const map: Record<string, string> = {};
      ms.forEach(m => { map[m.id] = m.nickname; });
      setMemberMap(map);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const map: Record<string, ActivitySession[]> = {};
      for (const t of types) {
        map[t.id] = (await apiListSessions({ typeId: t.id })).items;
      }
      setSessionsByType(map);
      setLoading(false);
    })();
  }, [types]);

  const cards = useMemo(() => types.map(t => {
    const sessions = (sessionsByType[t.id] || []).slice().sort((a, b) => dayjs(b.startAt).valueOf() - dayjs(a.startAt).valueOf());
    const last = sessions[0];
    const next = computeNextStartAt(t.scheduleRule);
    return { t, last, next };
  }), [types, sessionsByType]);

  const [lastInfo, setLastInfo] = useState<Record<string, { counts: Record<'participated'|'leave'|'unknown'|'unset', number>; top?: { nickname: string; score: number } }>>({});
  useEffect(() => {
    (async () => {
      const ret: Record<string, { counts: Record<'participated'|'leave'|'unknown'|'unset', number>; top?: { nickname: string; score: number } }> = {};
      for (const t of types) {
        const sessions = sessionsByType[t.id] || [];
        const last = sessions.slice().sort((a, b) => dayjs(b.startAt).valueOf() - dayjs(a.startAt).valueOf())[0];
        if (!last) continue;
        const ps = await apiListParticipations(last.id);
        const counts = { participated: 0, leave: 0, unknown: 0, unset: 0 } as Record<'participated'|'leave'|'unknown'|'unset', number>;
        ps.forEach(p => { counts[p.status as keyof typeof counts] = (counts[p.status as keyof typeof counts] || 0) + 1; });
        // 取最高分并列全部
        let top: { nickname: string; score: number } | undefined;
        const withScore = ps.filter(p => typeof p.score === 'number');
        if (withScore.length) {
          const sorted = withScore.sort((a, b) => (b.score || 0) - (a.score || 0));
          console.log(sorted);
          const max = sorted[0]?.score || 0;
          const tops = sorted.filter(p => (p.score || 0) === max);
          top = { nickname: tops.map(tp => memberMap[tp.memberId] || tp.memberId).join('、'), score: max };
        }
        ret[t.id] = { counts, top };
      }
      setLastInfo(ret);
    })();
  }, [types, sessionsByType, memberMap]);

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Space>
        {/* <Segmented options={[{label:'月度',value:'month'},{label:'季度',value:'quarter'},{label:'年度',value:'year'}]} value={period} onChange={v => setPeriod(v as any)} /> */}
        <Button type="primary" onClick={() => { setEditing(null); form.resetFields(); setOpen(true); }}>新增活动</Button>
      </Space>

      <Row gutter={[16,16]}>
        {cards.map(({ t, last, next }) => (
          <Col key={t.id} xs={24} md={12} lg={8}>
            <Card title={<Space>{t.name}{t.enabled ? <Tag color="green">启用</Tag> : <Tag>停用</Tag>}</Space>} loading={loading} extra={<Space>
              <a onClick={() => navigate(`/activities/${t.id}`)}>查看场次</a>
              <a onClick={() => { setEditing(t); form.setFieldsValue({ id: t.id, name: t.name, code: t.code, weekday: t.scheduleRule?.weekday, time: t.scheduleRule?.time ? dayjs(t.scheduleRule.time, 'HH:mm') : undefined, enabled: t.enabled, durationMinutes: t.durationMinutes }); setOpen(true); }}>修改活动</a>
              <Popconfirm title="确认删除该活动？" onConfirm={async () => { await apiDeleteActivityType(t.id); message.success('已删除活动'); setTypes(await apiListActivityTypes()); }}>
                <a>删除活动</a>
              </Popconfirm>
            </Space>}>
              <Space direction="vertical">
                <div>下次时间：{next ? next.format('YYYY-MM-DD HH:mm') : '未配置'}</div>
                <div>上次场次：{last ? `${last.name}` : '暂无'}</div>
                {last && (
                  <Space wrap>
                    <Tag color="green">参与 {lastInfo[t.id]?.counts.participated || 0}</Tag>
                    <Tag color="orange">请假 {lastInfo[t.id]?.counts.leave || 0}</Tag>
                    <Tag>未知 {lastInfo[t.id]?.counts.unknown || 0}</Tag>
                    <Tag color="red">未设置 {lastInfo[t.id]?.counts.unset || 0}</Tag>
                    <span>Top 成员：{lastInfo[t.id]?.top ? `${lastInfo[t.id]?.top?.nickname}（${lastInfo[t.id]?.top?.score}）` : '-'}</span>
                  </Space>
                )}
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      <Modal title={editing ? '修改活动' : '新增活动'} open={open} onCancel={() => setOpen(false)} onOk={() => form.submit()} destroyOnClose>
        <Form form={form} layout="vertical" onFinish={async (values: any) => {
          await apiUpsertActivityType({ id: values.id, name: values.name, code: values.code || values.name, scheduleRule: { weekday: values.weekday, time: values.time?.format('HH:mm') }, enabled: values.enabled, durationMinutes: values.durationMinutes });
          message.success(editing ? '已修改活动' : '已新增活动');
          setOpen(false);
          setTypes(await apiListActivityTypes());
        }}>
          <Form.Item name="id" hidden>
            <Input />
          </Form.Item>
          <Form.Item name="name" label="活动名称" rules={[{ required: true, message: '请输入活动名称' }]}>
            <Input placeholder="如：要塞、天地战场" />
          </Form.Item>
          <Form.Item name="code" label="唯一标识（可选）">
            <Input placeholder="英文/拼音/短码" />
          </Form.Item>
          <Form.Item name="enabled" label="启用状态" valuePropName="checked" initialValue={true}>
            <Switch />
          </Form.Item>
          <Form.Item name="durationMinutes" label="默认场次时长(分钟)" rules={[{ required: true, message: '请输入场次时长' }]} initialValue={120}>
            <Input type="number" min={1} />
          </Form.Item>
          <Form.Item label="每周时间">
            <Space>
              <Form.Item name="weekday" noStyle rules={[{ required: true, message: '选择星期' }]}>
                <Select style={{ width: 120 }} placeholder="星期">
                  <Select.Option value={1}>周一</Select.Option>
                  <Select.Option value={2}>周二</Select.Option>
                  <Select.Option value={3}>周三</Select.Option>
                  <Select.Option value={4}>周四</Select.Option>
                  <Select.Option value={5}>周五</Select.Option>
                  <Select.Option value={6}>周六</Select.Option>
                  <Select.Option value={0}>周日</Select.Option>
                </Select>
              </Form.Item>
              <Form.Item name="time" noStyle rules={[{ required: true, message: '选择时间' }]}>
                <TimePicker format="HH:mm" />
              </Form.Item>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}


