import { Card, Form, Input, Button, message, Space, Table } from 'antd';
import { getAppSettings, setAppSettings, getWorkflowConfigs, type WorkflowConfig } from '../../store/settings';
import { useEffect } from 'react';

export default function WorkflowSettingsPage() {
  const [form] = Form.useForm<{ url: string; apiKey?: string }>();
  // 预留批量编辑/新增用的表单

  useEffect(() => {
    const s = getAppSettings();
    const defaultCfg = (s.workflows || []).find(w => w.isDefault) || (s.workflows || [])[0];
    form.setFieldsValue({ url: defaultCfg?.url || 'https://ai.example.com/ingest', apiKey: defaultCfg?.apiKey });
  }, []);

  const onSave = async () => {
    const v = await form.validateFields();
    const s = getAppSettings();
    const nextList: WorkflowConfig[] = [...(s.workflows || [])];
    const idx = nextList.findIndex(x => x.isDefault);
    const newItem: WorkflowConfig = { url: v.url, apiKey: v.apiKey, isDefault: true };
    if (idx >= 0) nextList[idx] = newItem; else nextList.unshift(newItem);
    setAppSettings({ workflows: nextList });
    message.success('已保存默认工作流配置');
  };

  return (
    <Card title="设置 - 工作流配置" style={{ maxWidth: 880 }}>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Form form={form} layout="vertical">
          <Form.Item
            label="默认工作流接收地址 (workflow_url)"
            name="url"
            rules={[{ required: true, message: '请输入工作流地址' }, { type: 'url', message: '请输入合法的 URL（http/https）' }]}
          >
            <Input placeholder="https://ai.example.com/ingest" />
          </Form.Item>
          <Form.Item
            label="workflow_api_key（可选，用于向远端工作流鉴权）"
            name="apiKey"
          >
            <Input.Password placeholder="可选：填写后将随上传请求转发至后端，用于签名/鉴权" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" onClick={onSave}>保存</Button>
          </Form.Item>
        </Form>

        <div>
          <h4>全部工作流配置</h4>
          <Table
            size="small"
            rowKey={(r) => r.url}
            dataSource={getWorkflowConfigs()}
            pagination={false}
            columns={[
              { title: 'URL', dataIndex: 'url' },
              { title: 'API Key', dataIndex: 'apiKey', render: (v) => v ? '••••••••' : '-' },
              { title: '默认', dataIndex: 'isDefault', render: (v: boolean) => v ? '是' : '否' },
            ]}
          />
        </div>
      </Space>
    </Card>
  );
}


