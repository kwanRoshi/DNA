import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  walletAddress: {
    type: String,
    required: true,
    unique: true
  },
  healthData: [{
    uploadDate: {
      type: Date,
      default: Date.now
    },
    fileName: String,
    fileType: String,
    fileSize: Number,
    content: String
  }],
  analysisHistory: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    analysis: {
      summary: String,
      recommendations: [String],
      riskFactors: [String],
      metrics: {
        healthScore: Number,
        stressLevel: String,
        sleepQuality: String
      }
    },
    originalContent: String
  }],
  
  imageAnalysis: [{
    timestamp: {
      type: Date,
      default: Date.now
    },
    imageInfo: {
      fileName: String,
      fileType: String,
      fileSize: Number
    },
    analysisType: {
      type: String,
      enum: ['general', 'medical_report', 'lifestyle'],
      default: 'general'
    },
    result: {
      summary: String,
      confidence: Number,
      metrics: {
        healthScore: Number,
        riskLevel: String,
        reliabilityScore: Number
      },
      recommendations: [{
        category: String,
        suggestion: String,
        priority: Number
      }],
      risks: [{
        type: String,
        severity: String,
        description: String
      }]
    },
    note: String
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const User = mongoose.model('User', userSchema);

export default User;
