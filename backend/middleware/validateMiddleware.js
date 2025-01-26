import { body, validationResult } from 'express-validator';

// 验证结果处理中间件
export const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// 健康数据文件验证规则
export const validateHealthDataUpload = [
  body('file')
    .custom((value, { req }) => {
      if (!req.file) {
        throw new Error('请上传文件');
      }
      
      const allowedTypes = [
        'text/plain',
        'text/csv',
        'application/json',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      ];
      
      if (!allowedTypes.includes(req.file.mimetype)) {
        throw new Error('不支持的文件类型');
      }
      
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (req.file.size > maxSize) {
        throw new Error('文件大小不能超过5MB');
      }
      
      return true;
    }),
  handleValidation
];

// 钱包地址验证规则
export const validateWalletAddress = [
  body('walletAddress')
    .trim()
    .notEmpty()
    .withMessage('钱包地址不能为空')
    .matches(/^0x[a-fA-F0-9]{40}$/)
    .withMessage('无效的钱包地址格式'),
  handleValidation
];
