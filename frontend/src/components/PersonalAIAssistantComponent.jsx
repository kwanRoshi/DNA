import React, { useState } from 'react';
import { Card, Tabs, Form, Input, Button, Avatar, List, Tag, Space, Typography, Alert, Progress } from 'antd';
import { UserOutlined, RobotOutlined, HistoryOutlined, SettingOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { TabPane } = Tabs;

const PersonalAIAssistantComponent = () => {
  const [loading, setLoading] = useState(false);
  const [userInfo, setUserInfo] = useState({
    name: '张三',
    realNameVerified: true,
    aiAssistantLevel: 2,
    consultationCount: 15,
    lastActive: '2024-03-15'
  });

  const [consultationHistory] = useState([
    {
      id: 1,
      type: 'health',
      date: '2024-03-15',
      summary: '常规健康咨询，讨论睡眠质量改善方案',
      status: 'completed'
    },
    {
      id: 2,
      type: 'gene',
      date: '2024-03-10',
      summary: '基因测序分析，评估遗传风险因素',
      status: 'completed'
    }
  ]);

  const handleUpdateProfile = async (values) => {
    setLoading(true);
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(values)
      });

      if (!response.ok) throw new Error('更新个人信息失败');

      const updatedInfo = await response.json();
      setUserInfo(updatedInfo);
    } catch (error) {
      Alert.error({
        message: '更新失败',
        description: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const renderProfileInfo = () => (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Card>
        <Space align="start">
          <Avatar size={64} icon={<UserOutlined />} />
          <Space direction="vertical">
            <Title level={4}>{userInfo.name}</Title>
            <Space>
              {userInfo.realNameVerified && (
                <Tag color="green">实名认证</Tag>
              )}
              <Tag color="blue">AI助手等级 {userInfo.aiAssistantLevel}</Tag>
            </Space>
          </Space>
        </Space>
      </Card>

      <Card title="个人信息设置">
        <Form
          layout="vertical"
          onFinish={handleUpdateProfile}
          initialValues={userInfo}
        >
          <Form.Item
            name="name"
            label="姓名"
            rules={[{ required: true, message: '请输入姓名' }]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="email"
            label="邮箱"
            rules={[
              { required: true, message: '请输入邮箱' },
              { type: 'email', message: '请输入有效的邮箱地址' }
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item
            name="phone"
            label="手机号"
            rules={[
              { required: true, message: '请输入手机号' },
              { pattern: /^1\d{10}$/, message: '请输入有效的手机号' }
            ]}
          >
            <Input />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading}>
              保存更改
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </Space>
  );

  const renderAIAssistant = () => (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Card>
        <Space align="center">
          <Avatar size={48} icon={<RobotOutlined />} style={{ backgroundColor: '#1890ff' }} />
          <Space direction="vertical">
            <Title level={4}>AI助手状态</Title>
            <Progress percent={userInfo.aiAssistantLevel * 20} status="active" />
          </Space>
        </Space>
      </Card>

      <Card title="AI助手功能">
        <List
          itemLayout="horizontal"
          dataSource={[
            {
              title: '健康咨询',
              description: '智能分析健康数据，提供专业建议',
              available: true
            },
            {
              title: '基因解读',
              description: '深度分析基因数据，评估健康风险',
              available: userInfo.aiAssistantLevel >= 2
            },
            {
              title: '个性化建议',
              description: '根据历史数据提供定制化健康方案',
              available: userInfo.aiAssistantLevel >= 3
            }
          ]}
          renderItem={item => (
            <List.Item>
              <List.Item.Meta
                title={<Text strong>{item.title}</Text>}
                description={item.description}
              />
              <Tag color={item.available ? 'success' : 'default'}>
                {item.available ? '已启用' : '未解锁'}
              </Tag>
            </List.Item>
          )}
        />
      </Card>
    </Space>
  );

  const renderConsultationHistory = () => (
    <Card title="咨询历史">
      <List
        itemLayout="vertical"
        dataSource={consultationHistory}
        renderItem={item => (
          <List.Item
            extra={
              <Tag color={item.status === 'completed' ? 'success' : 'processing'}>
                {item.status === 'completed' ? '已完成' : '进行中'}
              </Tag>
            }
          >
            <List.Item.Meta
              title={`${item.type === 'health' ? '健康咨询' : '基因分析'} - ${item.date}`}
              description={item.summary}
            />
          </List.Item>
        )}
      />
    </Card>
  );

  return (
    <Card>
      <Tabs defaultActiveKey="profile">
        <TabPane
          tab={
            <span>
              <UserOutlined />
              个人信息
            </span>
          }
          key="profile"
        >
          {renderProfileInfo()}
        </TabPane>
        <TabPane
          tab={
            <span>
              <RobotOutlined />
              AI助手
            </span>
          }
          key="ai-assistant"
        >
          {renderAIAssistant()}
        </TabPane>
        <TabPane
          tab={
            <span>
              <HistoryOutlined />
              咨询历史
            </span>
          }
          key="history"
        >
          {renderConsultationHistory()}
        </TabPane>
      </Tabs>
    </Card>
  );
};

export default PersonalAIAssistantComponent;
