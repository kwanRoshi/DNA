import React, { useState } from 'react';
import { Layout, Menu, Typography, Space, Button } from 'antd';
import {
  HomeOutlined,
  ExperimentOutlined,
  FileTextOutlined,
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined
} from '@ant-design/icons';
import PlatformOverviewComponent from './PlatformOverviewComponent';
import HealthAssistantComponent from './HealthAssistantComponent';
import HealthRecordsComponent from './HealthRecordsComponent';
import PersonalAIAssistantComponent from './PersonalAIAssistantComponent';

const { Header, Sider, Content } = Layout;
const { Title } = Typography;

const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [currentView, setCurrentView] = useState('overview');

  const menuItems = [
    {
      key: 'overview',
      icon: <HomeOutlined />,
      label: '平台概览'
    },
    {
      key: 'health-assistant',
      icon: <ExperimentOutlined />,
      label: '健康助手'
    },
    {
      key: 'health-records',
      icon: <FileTextOutlined />,
      label: '健康档案'
    },
    {
      key: 'personal-ai',
      icon: <UserOutlined />,
      label: '个人中心'
    }
  ];

  const renderContent = () => {
    switch (currentView) {
      case 'overview':
        return <PlatformOverviewComponent />;
      case 'health-assistant':
        return <HealthAssistantComponent />;
      case 'health-records':
        return <HealthRecordsComponent />;
      case 'personal-ai':
        return <PersonalAIAssistantComponent />;
      default:
        return <div>功能开发中...</div>;
    }
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div style={{ padding: 16, textAlign: 'center' }}>
          <Title level={4} style={{ color: '#fff', margin: 0 }}>
            AI健康检测
          </Title>
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[currentView]}
          items={menuItems}
          onClick={({ key }) => setCurrentView(key)}
        />
      </Sider>
      <Layout>
        <Header style={{ padding: 0, background: '#fff' }}>
          <Space>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: '16px', width: 64, height: 64 }}
            />
            <Title level={3} style={{ margin: 0 }}>
              {menuItems.find(item => item.key === currentView)?.label}
            </Title>
          </Space>
        </Header>
        <Content style={{ margin: '24px 16px', padding: 24, background: '#fff' }}>
          {renderContent()}
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
