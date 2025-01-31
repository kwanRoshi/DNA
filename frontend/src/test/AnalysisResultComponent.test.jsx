import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { renderWithProviders } from './utils/test-utils';
import AnalysisResultComponent from '../components/AnalysisResultComponent';

describe('AnalysisResultComponent', () => {
  const mockAnalysis = {
    summary: '整体健康状况良好',
    riskFactors: ['轻度睡眠不足', '运动量偏低'],
    recommendations: ['保持规律作息', '增加运动频率', '注意饮食均衡'],
    metrics: {
      healthScore: 85,
      stressLevel: '正常',
      sleepQuality: '一般'
    }
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders empty state when no analysis provided', () => {
    render(<AnalysisResultComponent analysis={null} />);
    expect(screen.getByText('No analysis results to display')).toBeInTheDocument();
  });

  it('renders analysis results with all sections', async () => {
    const { container } = render(<AnalysisResultComponent analysis={mockAnalysis} />);
    
    expect(screen.getByText('Health Analysis Results')).toBeInTheDocument();
    
    const sections = [
      'Health Analysis Summary',
      'Risk Factors',
      'Recommendations',
      'Health Metrics'
    ];
    
    sections.forEach(section => {
      expect(screen.getByText(section)).toBeInTheDocument();
    });

    expect(screen.getByText('整体健康状况良好')).toBeInTheDocument();
    expect(screen.getByText(/轻度睡眠不足/)).toBeInTheDocument();
    expect(screen.getByText(/运动量偏低/)).toBeInTheDocument();
    expect(screen.getByText(/保持规律作息/)).toBeInTheDocument();
  });

  it('handles analysis with missing or empty sections', () => {
    const incompleteAnalysis = {
      summary: '分析结果',
      riskFactors: [],
      recommendations: null,
      metrics: {}
    };

    render(<AnalysisResultComponent analysis={incompleteAnalysis} />);
    
    expect(screen.getByText('分析结果')).toBeInTheDocument();
    expect(screen.getByText('No risk factors identified')).toBeInTheDocument();
    expect(screen.getByText('No recommendations available')).toBeInTheDocument();
    expect(screen.getByText('No health metrics available')).toBeInTheDocument();
  });

  it('handles expandable sections correctly', async () => {
    render(<AnalysisResultComponent analysis={mockAnalysis} />);
    
    const sections = screen.getAllByRole('button');
    expect(sections).toHaveLength(4);
    
    sections.forEach((section, index) => {
      if (index > 0) {
        fireEvent.click(section);
        expect(section.getAttribute('aria-expanded')).toBe('true');
        
        fireEvent.click(section);
        expect(section.getAttribute('aria-expanded')).toBe('false');
      }
    });
  });

  it('validates accessibility features', () => {
    const { container } = render(<AnalysisResultComponent analysis={mockAnalysis} />);
    
    const buttons = screen.getAllByRole('button');
    buttons.forEach(button => {
      expect(button).toHaveAttribute('aria-controls');
      expect(button).toHaveAttribute('aria-expanded');
    });
    
    const headings = container.querySelectorAll('h2');
    headings.forEach(heading => {
      expect(heading).toHaveAttribute('role', 'heading');
    });
  });

  it('handles markdown-style analysis content', () => {
    const markdownAnalysis = {
      summary: '### Health Status\nOverall health is good.\n### Risk Factors\n1. Minor sleep issues\n### Recommendations\n- Maintain regular schedule',
      metrics: null
    };

    render(<AnalysisResultComponent analysis={markdownAnalysis} />);
    
    expect(screen.getByText(/Overall health is good/)).toBeInTheDocument();
    expect(screen.getByText(/Minor sleep issues/)).toBeInTheDocument();
    expect(screen.getByText(/Maintain regular schedule/)).toBeInTheDocument();
  });

  it('validates Chinese content display', () => {
    const chineseAnalysis = {
      summary: '### 健康状况\n整体健康良好\n### 生理指标\n血压: 120/80\n心率: 75\n### 建议\n保持作息规律',
      riskFactors: ['血压偏高', '运动不足'],
      recommendations: ['规律运动', '控制饮食', '保证睡眠'],
      metrics: {
        healthScore: 88,
        stressLevel: '正常',
        sleepQuality: '良好'
      }
    };

    render(<AnalysisResultComponent analysis={chineseAnalysis} />);
    
    expect(screen.getByText(/整体健康良好/)).toBeInTheDocument();
    expect(screen.getByText(/血压偏高/)).toBeInTheDocument();
    expect(screen.getByText(/规律运动/)).toBeInTheDocument();
    expect(screen.getByText(/控制饮食/)).toBeInTheDocument();
    expect(screen.getByText(/保证睡眠/)).toBeInTheDocument();
  });
});
