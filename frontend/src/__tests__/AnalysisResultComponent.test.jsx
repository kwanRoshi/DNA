import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import AnalysisResultComponent from '../components/AnalysisResultComponent';

describe('AnalysisResultComponent', () => {
  const mockResult = {
    summary: '健康报告总结',
    recommendations: [
      { text: '建议增加运动量', priority: 'high' },
      { text: '保持良好的睡眠习惯', priority: 'medium' }
    ],
    risks: [
      { text: '存在心血管疾病风险', severity: 'high' },
      { text: '轻度贫血风险', severity: 'low' }
    ]
  };

  it('renders analysis results correctly', () => {
    render(<AnalysisResultComponent result={mockResult} />);
    
    expect(screen.getByText('健康报告总结')).toBeInTheDocument();
    expect(screen.getByText('建议增加运动量')).toBeInTheDocument();
    expect(screen.getByText('存在心血管疾病风险')).toBeInTheDocument();
  });

  it('displays priority levels correctly', () => {
    render(<AnalysisResultComponent result={mockResult} />);
    
    const highPriorityRec = screen.getByText('建议增加运动量');
    const mediumPriorityRec = screen.getByText('保持良好的睡眠习惯');
    
    expect(highPriorityRec.closest('.high-priority')).toBeInTheDocument();
    expect(mediumPriorityRec.closest('.medium-priority')).toBeInTheDocument();
  });

  it('handles empty or missing data gracefully', () => {
    const emptyResult = {
      summary: '',
      recommendations: [],
      risks: []
    };
    
    render(<AnalysisResultComponent result={emptyResult} />);
    
    expect(screen.getByText(/暂无分析结果/i)).toBeInTheDocument();
  });

  it('renders risk severity indicators', () => {
    render(<AnalysisResultComponent result={mockResult} />);
    
    const highRisk = screen.getByText('存在心血管疾病风险');
    const lowRisk = screen.getByText('轻度贫血风险');
    
    expect(highRisk.closest('.high-severity')).toBeInTheDocument();
    expect(lowRisk.closest('.low-severity')).toBeInTheDocument();
  });
});
