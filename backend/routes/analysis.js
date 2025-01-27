import express from 'express';
import multer from 'multer';
import { DEEPSEEK_API_KEY } from '../config/config.js';
import axios from 'axios';
import fs from 'fs';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

const analyzeWithDeepseek = async (sequence) => {
  try {
    console.log('Starting DeepSeek analysis...');
    const response = await axios.post('https://api.deepseek.ai/v1/completions', {
      model: "deepseek-coder-33b-instruct",
      prompt: `As a bioinformatics expert, please analyze this biological sequence and provide detailed insights about its characteristics, potential functions, and any notable patterns:\n\nSequence: ${sequence}\n\nPlease include:\n1. Sequence type identification\n2. Basic sequence characteristics\n3. Potential biological significance\n4. Notable patterns or motifs\n5. Recommendations for further analysis`,
      temperature: 0.3,
      max_tokens_to_sample: 2000,
      stop_sequences: ["</analysis>"]
    }, {
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 60000 // Increased timeout to 60 seconds
    });

    console.log('DeepSeek API response received');
    
    if (!response.data || !response.data.choices || response.data.choices.length === 0) {
      console.error('Invalid response format from DeepSeek:', response.data);
      throw new Error('Invalid response from DeepSeek API');
    }

    return {
      analysis: response.data.choices[0].text,
      model: "deepseek-coder-33b-instruct",
      provider: "deepseek"
    };
  } catch (error) {
    console.error('DeepSeek API error:', error.message);
    if (error.response) {
      console.error('Error response:', error.response.data);
      throw new Error(`DeepSeek API error: ${error.response.data.error || error.message}`);
    }
    throw new Error(`Failed to connect to DeepSeek API: ${error.message}`);
  }
}

router.post('/analyze', upload.single('file'), async (req, res) => {
  try {
    let sequence = req.body.sequence;
    const provider = req.body.provider || 'claude';
    
    if (req.file) {
      const fileContent = await fs.promises.readFile(req.file.path, 'utf8');
      sequence = fileContent.trim();
    }

    if (!sequence) {
      return res.status(400).json({ error: 'No sequence provided' });
    }

    console.log(`Analyzing sequence with ${provider}...`);
    let result;
    
    if (provider === 'deepseek') {
      result = await analyzeWithDeepseek(sequence);
    } else {
      result = await analyzeWithClaude(sequence);
    }

    // Save analysis to database
    const analysis = {
      sequence: sequence,
      result: result,
      timestamp: new Date()
    };

    await db.collection('analyses').insertOne(analysis);
    
    res.json(result);
  } catch (error) {
    console.error('Error analyzing sequence:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

export { router }; 