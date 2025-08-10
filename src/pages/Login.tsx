import { Button, Card, Form, Input, message } from 'antd';
import { useAuthStore } from '../store/auth';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const login = useAuthStore(s => s.login);
  const loggingIn = useAuthStore(s => s.loggingIn);
  const navigate = useNavigate();

  const onFinish = async (values: { username: string; password: string }) => {
    const ok = await login(values.username, values.password);
    if (ok) {
      message.success('登录成功');
      navigate('/');
    } else {
      message.error('账号或密码错误');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Card title="登录" style={{ width: 360 }}>
        <Form onFinish={onFinish} layout="vertical">
          <Form.Item name="username" label="账号" rules={[{ required: true, message: '请输入账号' }]}> 
            <Input placeholder="admin" />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}> 
            <Input.Password/>
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={loggingIn}>登录</Button>
        </Form>
      </Card>
    </div>
  );
}




