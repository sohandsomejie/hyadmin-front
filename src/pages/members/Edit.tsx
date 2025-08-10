import { Card, DatePicker, Form, Input, Radio, Select, Space, message, Button } from 'antd';
import dayjs from 'dayjs';
import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { apiGetMember, apiUpsertMember } from '../../api';

export default function MemberEditPage() {
  const { id } = useParams();
  const [form] = Form.useForm();
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      if (id && id !== 'new') {
        const m = await apiGetMember(id);
        if (m) form.setFieldsValue({ ...m, joinAt: m.joinAt ? dayjs(m.joinAt) : undefined });
      } else {
        form.resetFields();
      }
    })();
  }, [id]);

  return (
    <Card title={id === 'new' ? '新增成员' : '编辑成员'}>
      <Form form={form} layout="vertical" onFinish={async (values) => {
        const saved = await apiUpsertMember({ id: id === 'new' ? undefined : id, ...values, joinAt: values.joinAt ? dayjs(values.joinAt).unix() : undefined });
        message.success('已保存');
        navigate(`/members/${saved.id}`);
      }}>
        <Form.Item name="nickname" label="昵称" rules={[{ required: true, message: '请输入昵称' }]}> 
          <Input />
        </Form.Item>
        <Form.Item name="qq" label="QQ"> 
          <Input />
        </Form.Item>
        <Form.Item name="status" label="状态" initialValue={'normal'}>
          <Radio.Group>
            <Radio value="normal">正常</Radio>
            <Radio value="left">离开</Radio>
          </Radio.Group>
        </Form.Item>
        <Form.Item name="joinAt" label="加入时间">
          <DatePicker showTime />
        </Form.Item>
        <Form.Item name="role" label="角色" initialValue={'member'}>
          <Select options={[
            { label: '学员', value: 'trainee' },
            { label: '高层', value: 'senior' },
            { label: '成员', value: 'member' },
            { label: '首领', value: 'leader' },
          ]} />
        </Form.Item>
        <Form.Item name="remark" label="备注"> 
          <Input.TextArea rows={3} />
        </Form.Item>
        <Space>
          <Button type="primary" htmlType="submit">保存</Button>
          <Button onClick={() => navigate(-1)}>返回</Button>
        </Space>
      </Form>
    </Card>
  );
}


