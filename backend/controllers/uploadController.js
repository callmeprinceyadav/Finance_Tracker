const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Transaction = require('../models/Transaction');
const aiService = require('../utils/aiService');


const storage = multer.diskStorage({
  destination: (req, file, callback) => {
    const uploadPath = path.join(__dirname, '../uploads');
    
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    callback(null, uploadPath);
  },
  filename: (req, file, callback) => {
    
    const timestamp = Date.now();
    const originalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
    callback(null, `${timestamp}_${originalName}`);
  }
});


const fileFilter = (req, file, callback) => {
  const allowedTypes = ['application/pdf', 'text/csv', 'text/plain', 'application/vnd.ms-excel'];
  const allowedExtensions = ['.pdf', '.csv', '.txt', '.xls'];
  
  const fileExt = path.extname(file.originalname).toLowerCase();
  
  if (allowedTypes.includes(file.mimetype) || allowedExtensions.includes(fileExt)) {
    callback(null, true);
  } else {
    callback(new Error('Invalid file type. Only PDF, CSV, and TXT files are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  }
});


const uploadStatement = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded. Please select a bank statement file.'
      });
    }

    const filePath = req.file.path;
    const fileExtension = path.extname(req.file.originalname).toLowerCase().replace('.', '');
    
    console.log(`📁 Processing uploaded file: ${req.file.originalname}`);
    console.log(`📝 File type: ${fileExtension}, Size: ${req.file.size} bytes`);

   
    let parsedTransactions = [];
    
    try {
      parsedTransactions = await aiService.parseFile(filePath, fileExtension);
      console.log(`✅ Successfully parsed ${parsedTransactions.length} transactions`);
    } catch (parseError) {
      console.error('❌ Parsing error:', parseError.message);
      
      // Clean up uploaded file
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      return res.status(500).json({
        success: false,
        error: 'Failed to parse bank statement',
        details: parseError.message,
        suggestions: [
          'Make sure the file is a valid bank statement',
          'Try a different file format (PDF, CSV, or TXT)',
          'Check if the file is not corrupted'
        ]
      });
    }

    if (!parsedTransactions || parsedTransactions.length === 0) {
      // Clean up uploaded file
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      return res.status(400).json({
        success: false,
        error: 'No transactions found in the uploaded file',
        message: 'Please make sure your file contains transaction data in a recognizable format.'
      });
    }

   
    const savedTransactions = [];
    let duplicateCount = 0;
    
    for (const transactionData of parsedTransactions) {
      try {
        // Check for potential duplicates (same date, amount, and description)
        const existingTransaction = await Transaction.findOne({
          date: transactionData.date,
          amount: transactionData.amount,
          description: transactionData.description
        });

        if (existingTransaction) {
          duplicateCount++;
          console.log(`⚠️ Duplicate transaction found: ${transactionData.description}`);
          continue;
        }

        const newTransaction = new Transaction(transactionData);
        const savedTransaction = await newTransaction.save();
        savedTransactions.push(savedTransaction);
      } catch (saveError) {
        console.error('Error saving transaction:', saveError.message);
        // Continue processing other transactions
      }
    }

    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Prepare response
    const response = {
      success: true,
      message: savedTransactions.length > 0 
        ? `Successfully processed bank statement!`
        : 'All transactions were duplicates - no new data added',
      data: {
        totalParsed: parsedTransactions.length,
        totalSaved: savedTransactions.length,
        duplicatesSkipped: duplicateCount,
        transactions: savedTransactions,
        isDuplicateOnly: savedTransactions.length === 0 && duplicateCount > 0
      }
    };

    if (duplicateCount > 0) {
      response.warning = `${duplicateCount} duplicate transactions were skipped`;
      
      
      if (savedTransactions.length === 0) {
        response.message = `All ${duplicateCount} transactions already exist in your records`;
        response.data.shouldRedirectToDashboard = true;
      }
    }

    res.json(response);

  } catch (error) {
    console.error('Upload controller error:', error);
    
    
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(500).json({
      success: false,
      error: 'Server error during file processing',
      message: 'Please try again or contact support if the problem persists.'
    });
  }
};

// Get upload status/history (future enhancement)
const getUploadHistory = async (req, res) => {
  try {
    // This could track upload history if we add a uploads collection
    const recentTransactions = await Transaction.find()
      .sort({ createdAt: -1 })
      .limit(50)
      .select('description amount date parsedBy createdAt');

    const summary = await Transaction.aggregate([
      {
        $group: {
          _id: '$parsedBy',
          count: { $sum: 1 },
          latestUpload: { $max: '$createdAt' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        recentTransactions,
        uploadSummary: summary
      }
    });
  } catch (error) {
    console.error('Get upload history error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch upload history'
    });
  }
};


const handleUploadErrors = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large',
        message: 'Please upload a file smaller than 10MB'
      });
    }
    
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'Too many files',
        message: 'Please upload one file at a time'
      });
    }
  }

  if (error.message.includes('Invalid file type')) {
    return res.status(400).json({
      success: false,
      error: 'Invalid file type',
      message: error.message
    });
  }

  // Generic error
  res.status(500).json({
    success: false,
    error: 'Upload failed',
    message: error.message
  });
};

module.exports = {
  upload: upload.single('statement'), 
  uploadStatement,
  getUploadHistory,
  handleUploadErrors
};
