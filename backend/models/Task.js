import mongoose from 'mongoose';

const TaskSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fileName: { type: String, required: true },
  fileType: { type: String, required: true, enum: ['dna', 'image', 'text'] },
  analysisResult: {
    summary: { type: String },
    recommendations: [{
      text: { type: String },
      priority: { type: String, enum: ['low', 'medium', 'high'] }
    }],
    risks: [{
      text: { type: String },
      severity: { type: String, enum: ['low', 'medium', 'high'] }
    }]
  },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

TaskSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.model('Task', TaskSchema);
