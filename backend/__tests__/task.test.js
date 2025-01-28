import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../server.js';
import Task from '../models/Task.js';
import { mockUser, generateToken } from './testUtils.js';

let mongoServer;
let token;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  token = generateToken(mockUser);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Task.deleteMany({});
});

describe('Task API', () => {
  const mockFile = {
    originalname: 'test.txt',
    buffer: Buffer.from('ATCG'),
    mimetype: 'text/plain'
  };

  const mockAnalysisResult = {
    summary: '测试DNA序列分析',
    recommendations: [
      { text: '建议1', priority: 'high' }
    ],
    risks: [
      { text: '风险1', severity: 'high' }
    ]
  };

  it('creates a new task', async () => {
    const res = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', mockFile.buffer, mockFile.originalname)
      .field('fileType', 'dna');

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.fileName).toBe('test.txt');
    expect(res.body.data.status).toBe('pending');
  });

  it('gets all tasks for user', async () => {
    const task = await Task.create({
      userId: mockUser._id,
      fileName: 'test.txt',
      fileType: 'dna',
      status: 'completed',
      analysisResult: mockAnalysisResult
    });

    const res = await request(app)
      .get('/api/tasks')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.data[0].fileName).toBe('test.txt');
  });

  it('updates task result', async () => {
    const task = await Task.create({
      userId: mockUser._id,
      fileName: 'test.txt',
      fileType: 'dna',
      status: 'pending'
    });

    const res = await request(app)
      .patch(`/api/tasks/${task._id}/result`)
      .set('Authorization', `Bearer ${token}`)
      .send({ analysisResult: mockAnalysisResult });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('completed');
    expect(res.body.data.analysisResult).toEqual(mockAnalysisResult);
  });

  it('returns 404 for non-existent task', async () => {
    const fakeId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .patch(`/api/tasks/${fakeId}/result`)
      .set('Authorization', `Bearer ${token}`)
      .send({ analysisResult: mockAnalysisResult });

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
