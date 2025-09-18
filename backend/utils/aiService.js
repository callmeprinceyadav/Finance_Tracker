const { GoogleGenerativeAI } = require('@google/generative-ai');
const pdf = require('pdf-parse');
const csv = require('csv-parser');
const fs = require('fs');


const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });


const EXPENSE_CATEGORIES = {
  'Food & Dining': ['restaurant', 'cafe', 'food', 'dining', 'starbucks', 'mcdonalds', 'pizza', 'grocery'],
  'Shopping': ['amazon', 'walmart', 'target', 'store', 'shop', 'retail', 'purchase'],
  'Transportation': ['gas', 'fuel', 'uber', 'lyft', 'parking', 'metro', 'transit', 'car'],
  'Bills & Utilities': ['electric', 'water', 'internet', 'phone', 'insurance', 'rent', 'mortgage'],
  'Entertainment': ['movie', 'netflix', 'spotify', 'game', 'entertainment', 'fun'],
  'Healthcare': ['pharmacy', 'doctor', 'hospital', 'medical', 'health'],
  'Travel': ['hotel', 'flight', 'airbnb', 'booking', 'travel'],
  'ATM & Cash': ['atm', 'cash', 'withdrawal'],
  'Transfer': ['transfer', 'deposit', 'wire'],
  'Income': ['salary', 'paycheck', 'deposit', 'income', 'payment']
};

class BankStatementParser {
  constructor() {
    this.maxRetries = 3;
    this.retryDelay = 1000; // 1 second
  }

  async parseFile(filePath, fileType) {
    try {
      let rawText = '';

      switch (fileType.toLowerCase()) {
        case 'pdf':
          rawText = await this.extractFromPDF(filePath);
          break;
        case 'csv':
          return await this.extractFromCSV(filePath);
        case 'txt':
          rawText = fs.readFileSync(filePath, 'utf8');
          break;
        default:
          throw new Error(`Unsupported file type: ${fileType}`);
      }

      // Parse using AI
      return await this.parseWithAI(rawText);
    } catch (error) {
      console.error('File parsing error:', error.message);
      throw error;
    }
  }

  async extractFromPDF(filePath) {
    try {
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdf(dataBuffer);
      return data.text;
    } catch (error) {
      throw new Error(`PDF parsing failed: ${error.message}`);
    }
  }

  async extractFromCSV(filePath) {
    return new Promise((resolve, reject) => {
      const transactions = [];
      fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (row) => {
          // Try to map common CSV column names
          const transaction = this.mapCSVRow(row);
          if (transaction) {
            transactions.push(transaction);
          }
        })
        .on('end', () => {
          resolve(transactions);
        })
        .on('error', (error) => {
          reject(new Error(`CSV parsing failed: ${error.message}`));
        });
    });
  }

  mapCSVRow(row) {
    // Common column mappings from different banks
    const columnMappings = [
      { date: 'Date', amount: 'Amount', description: 'Description' },
      { date: 'Transaction Date', amount: 'Amount', description: 'Transaction Description' },
      { date: 'date', amount: 'amount', description: 'description' },
      { date: 'DATE', amount: 'AMOUNT', description: 'DESCRIPTION' }
    ];

    let mappedData = null;

    for (const mapping of columnMappings) {
      if (row[mapping.date] && row[mapping.amount] && row[mapping.description]) {
        mappedData = {
          date: this.parseDate(row[mapping.date]),
          amount: this.parseAmount(row[mapping.amount]),
          description: row[mapping.description].trim(),
          originalText: JSON.stringify(row),
          parsedBy: 'csv'
        };
        break;
      }
    }

    if (!mappedData) return null;

    // Categorize the transaction
    mappedData.category = this.categorizeTransaction(mappedData.description);
    mappedData.transactionType = mappedData.amount >= 0 ? 'credit' : 'debit';

    return mappedData;
  }

  async parseWithAI(rawText) {
    let attempt = 0;
    
    while (attempt < this.maxRetries) {
      try {
        const prompt = this.buildParsingPrompt(rawText);
        
        
        const fullPrompt = `You are a financial data analyst specializing in parsing bank statements. Extract transaction data accurately and format it as requested.

${prompt}`;
        
        const result = await model.generateContent({
          contents: [{ role: 'user', parts: [{ text: fullPrompt }] }],
          generationConfig: {
            temperature: 0.1, // Low temperature for consistent results
            maxOutputTokens: 2000,
            topK: 1,
            topP: 0.1
          }
        });

        const aiResponse = result.response.text();
        const transactions = this.parseAIResponse(aiResponse);
        
        return transactions;
      } catch (error) {
        attempt++;
        const errorMessage = this.extractErrorMessage(error);
        console.error(`AI parsing attempt ${attempt} failed:`, errorMessage);
        
        if (attempt >= this.maxRetries) {
          throw new Error(`AI parsing failed after ${this.maxRetries} attempts: ${errorMessage}`);
        }
        
        // Wait before retry with exponential backoff
        const delay = this.retryDelay * Math.pow(2, attempt - 1);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  buildParsingPrompt(statementText) {
    return `
Please analyze this bank statement text and extract all transactions. For each transaction, provide the following information in JSON format:

Required fields:
- date: Transaction date (YYYY-MM-DD format)
- amount: Transaction amount (negative for debits/expenses, positive for credits/income)
- description: Transaction description
- category: One of these categories: ${Object.keys(EXPENSE_CATEGORIES).join(', ')}
- transactionType: "debit" or "credit"

Optional fields:
- merchant: Merchant name if identifiable
- reference: Check number or reference number if present

Bank statement text:
${statementText.substring(0, 3000)} ${statementText.length > 3000 ? '...' : ''}

Please respond with a JSON array of transaction objects. If no transactions are found, return an empty array.
Only include actual transaction data, not headers, balances, or summary information.

Example format:
[
  {
    "date": "2024-01-15",
    "amount": -45.67,
    "description": "STARBUCKS COFFEE #123",
    "category": "Food & Dining",
    "transactionType": "debit",
    "merchant": "Starbucks"
  }
]
    `;
  }

  parseAIResponse(aiResponse) {
    try {
      // Clean up the response - sometimes AI adds extra text
      let jsonText = aiResponse.trim();
      
      // Extract JSON array from response
      const jsonStart = jsonText.indexOf('[');
      const jsonEnd = jsonText.lastIndexOf(']') + 1;
      
      if (jsonStart !== -1 && jsonEnd > jsonStart) {
        jsonText = jsonText.substring(jsonStart, jsonEnd);
      }
      
      const transactions = JSON.parse(jsonText);
      
      // Validate and clean up each transaction
      return transactions.map(transaction => {
        return {
          date: new Date(transaction.date),
          amount: parseFloat(transaction.amount),
          description: transaction.description.trim(),
          category: this.validateCategory(transaction.category),
          transactionType: transaction.transactionType,
          merchant: transaction.merchant || null,
          reference: transaction.reference || null,
          originalText: JSON.stringify(transaction),
          parsedBy: 'ai',
          isVerified: false
        };
      });
    } catch (error) {
      console.error('Failed to parse AI response:', error.message);
      throw new Error('AI response parsing failed. Please try again.');
    }
  }

  validateCategory(category) {
    const validCategories = Object.keys(EXPENSE_CATEGORIES);
    return validCategories.includes(category) ? category : 'Other';
  }

  categorizeTransaction(description) {
    const lowerDesc = description.toLowerCase();
    
    for (const [category, keywords] of Object.entries(EXPENSE_CATEGORIES)) {
      for (const keyword of keywords) {
        if (lowerDesc.includes(keyword)) {
          return category;
        }
      }
    }
    
    return 'Other';
  }

  parseDate(dateString) {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? new Date() : date;
  }

  parseAmount(amountString) {
    // Handle various amount formats: $123.45, (123.45), -123.45
    const cleanAmount = amountString.toString()
      .replace(/[$,\s]/g, '')
      .replace(/[()]/g, '-');
    return parseFloat(cleanAmount) || 0;
  }

  extractErrorMessage(error) {
    // Handle different types of errors that Gemini API might return
    if (error.message) {
      return error.message;
    }
    
    if (error.response?.data?.error?.message) {
      return error.response.data.error.message;
    }
    
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    
    if (error.status === 429) {
      return 'Rate limit exceeded. Please try again later.';
    }
    
    if (error.status === 401) {
      return 'Invalid API key. Please check your Gemini API configuration.';
    }
    
    if (error.status >= 500) {
      return 'Gemini service is temporarily unavailable. Please try again later.';
    }
    
    return error.toString() || 'Unknown error occurred during AI processing';
  }
}

module.exports = new BankStatementParser();
