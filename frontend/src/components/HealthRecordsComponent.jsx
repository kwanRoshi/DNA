import React, { useState } from 'react';
import { Card, Table, Tag, Space, Button, Modal, Form, Input, Select, Typography, Alert } from 'antd';
import { FileTextOutlined, HistoryOutlined, SafetyCertificateOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;
const { Option } = Select;

const HealthRecordsComponent = () => {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [form] = Form.useForm();

  const columns = [
    {
      title: '记录类型',
      dataIndex: 'recordType',
      key: 'recordType',
      render: (type) => {
        const colors = {
          consultation: 'blue',
          gene_sequence: 'purple',
          screening: 'green'
        };
        return <Tag color={colors[type]}>{type === 'consultation' ? '健康咨询' : type === 'gene_sequence' ? '基因测序' : '健康筛查'}</Tag>;
      }
    },
    {
      title: '创建时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      sorter: (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'completed' ? 'success' : status === 'processing' ? 'processing' : 'default'}>
          {status === 'completed' ? '已完成' : status === 'processing' ? '处理中' : '待处理'}
        </Tag>
      )
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          <Button type="link" onClick={() => viewRecord(record)}>查看</Button>
          <Button type="link" onClick={() => downloadRecord(record)}>下载</Button>
        </Space>
      )
    }
  ];

  const handleCreateRecord = async (values) => {
    setLoading(true);
    try {
      const response = await fetch('/api/health-records', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...values,
          timestamp: new Date().toISOString()
        })
      });

      if (!response.ok) throw new Error('创建记录失败');

      const result = await response.json();
      setRecords([...records, result]);
      setModalVisible(false);
      form.resetFields();
    } catch (error) {
      Modal.error({
        title: '错误',
        content: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const viewRecord = (record) => {
    Modal.info({
      title: '健康记录详情',
      content: (
        <div>
          <p><strong>记录类型：</strong> {record.recordType}</p>
          <p><strong>创建时间：</strong> {record.timestamp}</p>
          <p><strong>状态：</strong> {record.status}</p>
          <p><strong>详细信息：</strong></p>
          <pre>{JSON.stringify(record.data, null, 2)}</pre>
        </div>
      ),
      width: 600
    });
  };

  const downloadRecord = (record) => {
    const element = document.createElement('a');
    const file = new Blob([JSON.stringify(record, null, 2)], {type: 'application/json'});
    element.href = URL.createObjectURL(file);
    element.download = `health-record-${record.timestamp}.json`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }}>
      <Card>
        <Space direction="vertical" style={{ width: '100%' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <Title level={4}>健康档案管理</Title>
            <Button type="primary" onClick={() => setModalVisible(true)}>
              创建新记录
            </Button>
          </div>

          <div style={{ marginBottom: 16 }}>
            <Space>
              <Card size="small">
                <Space>
                  <FileTextOutlined />
                  <Text>总记录数：{records.length}</Text>
                </Space>
              </Card>
              <Card size="small">
                <Space>
                  <HistoryOutlined />
                  <Text>最近更新：{records[0]?.timestamp || '无'}</Text>
                </Space>
              </Card>
              <Card size="small">
                <Space>
                  <SafetyCertificateOutlined />
                  <Text>数据安全：已加密</Text>
                </Space>
              </Card>
            </Space>
          </div>

          <Table
            columns={columns}
            dataSource={records}
            rowKey="timestamp"
            loading={loading}
            pagination={{
              defaultPageSize: 10,
              showSizeChanger: true,
              showQuickJumper: true
            }}
          />
        </Space>
      </Card>

      <Modal
        title="创建健康记录"
        visible={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          onFinish={handleCreateRecord}
          layout="vertical"
        >
          <Form.Item
            name="recordType"
            label="记录类型"
            rules={[{ required: true, message: '请选择记录类型' }]}
          >
            <Select>
              <Option value="consultation">健康咨询</Option>
              <Option value="gene_sequence">基因测序</Option>
              <Option value="screening">健康筛查</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="description"
            label="描述"
            rules={[{ required: true, message: '请输入记录描述' }]}
          >
            <Input.TextArea rows={4} />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit" loading={loading}>
                创建
              </Button>
              <Button onClick={() => {
                setModalVisible(false);
                form.resetFields();
              }}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
};

export default HealthRecordsComponent;
