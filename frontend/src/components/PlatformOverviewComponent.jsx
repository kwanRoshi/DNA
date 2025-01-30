import React from 'react';
import { Card, Row, Col, Typography, List, Tag, Space } from 'antd';
import { 
  ExperimentOutlined, 
  SafetyCertificateOutlined,
  RobotOutlined,
  FileProtectOutlined,
  DatabaseOutlined,
  TeamOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

const PlatformOverviewComponent = () => {
  const coreServices = [
    {
      title: '健康咨询',
      icon: <RobotOutlined />,
      description: '智能AI健康顾问提供专业的健康评估和建议',
      features: ['症状评估', '生活方式建议', '辅助诊断', '早期筛查']
    },
    {
      title: '基因测序',
      icon: <ExperimentOutlined />,
      description: '专业的基因测序分析服务，揭示健康密码',
      features: ['基因风险评估', '遗传特征分析', '健康预测', '个性化建议']
    },
    {
      title: '健康档案',
      icon: <FileProtectOutlined />,
      description: '安全可靠的健康数据管理系统',
      features: ['数据加密存储', '实时同步', '历史记录追踪', '多维度分析']
    }
  ];

  const aiFeatures = [
    '深度学习算法支持的健康评估系统',
    '多模态数据分析能力',
    '个性化健康建议生成',
    '实时数据处理和分析',
    '持续学习和优化的AI模型'
  ];

  const securityMeasures = [
    '数据加密传输和存储',
    '区块链技术保障数据安全',
    '多重身份认证机制',
    '隐私保护协议',
    '合规数据处理流程'
  ];

  const qualifications = [
    {
      title: '医疗AI服务认证',
      issuer: '国家卫生健康委员会',
      year: '2024'
    },
    {
      title: '数据安全等级保护认证',
      issuer: '国家信息安全等级保护测评中心',
      year: '2024'
    },
    {
      title: '医疗机构合作资质',
      issuer: '省级卫生部门',
      year: '2024'
    }
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card>
        <Title level={2}>AI 健康检测平台</Title>
        <Paragraph>
          基于先进AI技术的智能健康管理平台，为您提供专业、全面的健康检测和管理服务。
        </Paragraph>
      </Card>

      <Row gutter={[16, 16]}>
        {coreServices.map((service, index) => (
          <Col xs={24} sm={24} md={8} key={index}>
            <Card>
              <Space align="center" style={{ marginBottom: 16 }}>
                {service.icon}
                <Title level={4}>{service.title}</Title>
              </Space>
              <Paragraph>{service.description}</Paragraph>
              <List
                size="small"
                dataSource={service.features}
                renderItem={item => (
                  <List.Item>
                    <Text>{item}</Text>
                  </List.Item>
                )}
              />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={[16, 16]}>
        <Col xs={24} sm={24} md={12}>
          <Card title={<><RobotOutlined /> AI 技术优势</>}>
            <List
              size="small"
              dataSource={aiFeatures}
              renderItem={item => (
                <List.Item>
                  <Text>{item}</Text>
                </List.Item>
              )}
            />
          </Card>
        </Col>
        <Col xs={24} sm={24} md={12}>
          <Card title={<><DatabaseOutlined /> 数据安全措施</>}>
            <List
              size="small"
              dataSource={securityMeasures}
              renderItem={item => (
                <List.Item>
                  <Text>{item}</Text>
                </List.Item>
              )}
            />
          </Card>
        </Col>
      </Row>

      <Card title={<><SafetyCertificateOutlined /> 平台资质认证</>}>
        <List
          dataSource={qualifications}
          renderItem={item => (
            <List.Item>
              <Space direction="vertical">
                <Text strong>{item.title}</Text>
                <Space>
                  <Tag color="blue">{item.issuer}</Tag>
                  <Tag color="green">{item.year}</Tag>
                </Space>
              </Space>
            </List.Item>
          )}
        />
      </Card>
    </Space>
  );
};

export default PlatformOverviewComponent;
