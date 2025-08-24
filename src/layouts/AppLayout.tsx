import { Layout, Menu, Breadcrumb } from 'antd';
import { TeamOutlined, CalendarOutlined, BarChartOutlined, LogoutOutlined, ArrowLeftOutlined, MenuUnfoldOutlined, MenuFoldOutlined, SettingOutlined } from '@ant-design/icons';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { useEffect, useState } from 'react';

const { Header, Sider, Content } = Layout;

export default function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const logout = useAuthStore(s => s.logout);
  const [collapsed, setCollapsed] = useState(false);

  // 响应式：根据屏幕宽度自动收缩侧边栏
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setCollapsed(true);
      } else {
        setCollapsed(false);
      }
    };
    handleResize(); // 初始判断
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const selectedKeys = [
    location.pathname.startsWith('/members') ? 'members' :
    location.pathname.startsWith('/activities') ? 'sessions' :
    location.pathname.startsWith('/reports') ? 'reports' :
    location.pathname.startsWith('/settings') ? 'settings' : '',
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider theme="light" width={220} style={{ minHeight: '100vh' }} collapsible collapsed={collapsed} trigger={null}>
        <div style={{ height: 48, margin: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: collapsed ? 'center' : 'space-between' }}>
          <span style={{ display: collapsed ? 'none' : 'inline' }}>火影忍者组织管理</span>
          <span onClick={() => setCollapsed(c => !c)} style={{ cursor: 'pointer', fontSize: 18 }}>
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </span>
        </div>
        <Menu
          mode="inline"
          selectedKeys={selectedKeys}
          inlineCollapsed={collapsed}
          items={[
            { key: 'members', icon: <TeamOutlined />, label: <Link to="/members">成员</Link> },
            { key: 'sessions', icon: <CalendarOutlined />, label: <Link to="/activities">活动</Link> },
            { key: 'reports', icon: <BarChartOutlined />, label: <Link to="/reports">统计</Link> },
            { key: 'settings', icon: <SettingOutlined />, label: <Link to="/settings/workflow">设置</Link> },
            { key: 'logout', icon: <LogoutOutlined />, label: '退出登录', onClick: () => { logout(); navigate('/login'); } },
          ]}
        />
      </Sider>
      <Layout style={{ minHeight: '100vh' }}>
        <Header style={{ background: '#fff', padding: '0 16px', height: 48, display: 'flex', alignItems: 'center' }}>
          <ArrowLeftOutlined style={{ fontSize: 18, marginRight: 16, cursor: 'pointer' }} onClick={() => navigate(-1)} />
          <Breadcrumb>
            <Breadcrumb.Item>
              <Link to="/">首页</Link>
            </Breadcrumb.Item>
            {location.pathname.startsWith('/members') && (
              <Breadcrumb.Item>
                <Link to="/members">成员</Link>
              </Breadcrumb.Item>
            )}
            {location.pathname.startsWith('/activities') && (
              <Breadcrumb.Item>
                <Link to="/activities">活动</Link>
              </Breadcrumb.Item>
            )}
            {location.pathname.startsWith('/reports') && (
              <Breadcrumb.Item>
                <Link to="/reports">统计</Link>
              </Breadcrumb.Item>
            )}
          </Breadcrumb>
        </Header>
        <Content style={{ margin: 16 }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}


