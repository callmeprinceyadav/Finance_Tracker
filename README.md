# AI-Powered Finance Tracker 🏦💡

A smart personal finance management app that automatically parses your bank statements using AI and gives you insights into your spending habits. Built with modern web technologies for a seamless experience.

## ✨ What Makes This Special

This isn't just another expense tracker. I wanted to solve the pain of manually categorizing dozens of transactions every month, so I built something that does the heavy lifting for you:

- **Smart AI Transaction Parser** - Upload your bank statement, and watch as AI automatically extracts every transaction with proper categories
- **No More Duplicates** - Built-in duplicate detection means you can safely re-upload files without creating a mess
- **Beautiful Insights** - Get visual breakdowns of your spending with interactive charts that actually look good
- **Mobile-First Design** - Works perfectly on your phone, tablet, or desktop
- **Complete Transaction Management** - Search, filter, edit, and verify your financial data with ease

## 🚀 Quick Start

Getting this up and running is straightforward. You'll need Node.js installed and either a local MongoDB or a free MongoDB Atlas account.

### Backend Setup

```bash
cd backend
npm install
```

Create your `.env` file:
```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/finance_tracker
GEMINI_API_KEY=your_actual_api_key_here
NODE_ENV=development
```

Start the server:
```bash
npm start
```

### Frontend Setup

```bash
cd frontend
npm install
```

Create your `.env` file:
```env
REACT_APP_API_URL=http://localhost:5000/api
```

Fire it up:
```bash
npm start
```

That's it! Open `http://localhost:3000` and you're ready to go.

## 🎯 How to Use

1. **Upload Your Statement** - Drag and drop your PDF bank statement or CSV file
2. **Watch the Magic** - AI processes your file and extracts all transactions with categories
3. **Review & Verify** - Check the results, make any corrections needed
4. **Get Insights** - View your spending patterns, trends, and financial health

### Supported File Types
- **PDF Bank Statements** (works with most major banks)
- **CSV Files** (Date, Amount, Description format)
- **Text Files** (structured transaction data)

## 🛠 Tech Stack

I chose these technologies to balance developer experience with performance:

**Backend:**
- Node.js + Express for the API
- MongoDB for data storage
- Google Gemini AI for transaction parsing
- Multer for handling file uploads

**Frontend:**
- React 18 with TypeScript
- Tailwind CSS for styling
- Recharts for beautiful data visualization
- React Dropzone for smooth file uploads

## 📱 Features Deep Dive

### Dashboard
- **Financial Overview**: Total income, expenses, and net balance at a glance
- **Spending Categories**: Pie chart breakdown of where your money goes
- **Monthly Trends**: See your financial patterns over time
- **Recent Transactions**: Quick access to your latest activity

### Transaction Management
- **Smart Search**: Find transactions by description, merchant, or category
- **Advanced Filtering**: Filter by date range, amount, type, or category
- **Bulk Operations**: Select multiple transactions to verify or edit at once
- **Pagination**: Handles thousands of transactions smoothly

### AI Processing
- **Intelligent Categorization**: Automatically sorts transactions into logical categories
- **Merchant Recognition**: Identifies and standardizes merchant names
- **Error Handling**: Gracefully handles corrupted or unusual file formats
- **Progress Tracking**: Real-time feedback during file processing

## 🏗 Project Structure

Here's how everything is organized:

```
finance-tracker/
├── backend/
│   ├── controllers/        # Business logic
│   │   ├── transactionController.js
│   │   └── uploadController.js
│   ├── models/            # Database schemas
│   │   └── Transaction.js
│   ├── routes/            # API endpoints
│   ├── utils/             # Helper functions
│   └── server.js          # Express app setup
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── Dashboard.tsx
│   │   │   ├── FileUpload.tsx
│   │   │   └── Transactions.tsx
│   │   ├── hooks/         # Custom React hooks
│   │   ├── services/      # API client
│   │   └── types/         # TypeScript definitions
│   └── public/
└── docs/                  # Documentation
```

## 📊 API Reference

### Core Endpoints

**Transactions**
```
GET    /api/transactions              # List transactions with filters
GET    /api/transactions/dashboard    # Get dashboard data
GET    /api/transactions/:id          # Get specific transaction
POST   /api/transactions              # Create transaction
PUT    /api/transactions/:id          # Update transaction
DELETE /api/transactions/:id          # Delete transaction
PUT    /api/transactions/bulk/update  # Bulk update transactions
```

**File Upload**
```
POST   /api/upload/statement          # Upload and process bank statement
GET    /api/upload/history            # Get upload history
```

### Query Parameters

The transactions endpoint supports filtering:
- `category` - Filter by transaction category
- `transactionType` - 'credit' or 'debit'  
- `startDate` & `endDate` - Date range filtering
- `search` - Search in description and merchant fields
- `page` & `limit` - Pagination
- `sortBy` & `sortOrder` - Sorting options

## 🔧 Configuration

### Environment Variables

**Backend (.env)**
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
GEMINI_API_KEY=your_google_ai_api_key
NODE_ENV=development
```

**Frontend (.env)**
```env
REACT_APP_API_URL=http://localhost:5000/api
```

### Getting a Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create a new API key
3. Add it to your backend `.env` file
4. You get free quota to start with!

## 🚀 Deployment

### Quick Deploy Options

**Backend:**
- Railway, Render, or Heroku for the Node.js app
- MongoDB Atlas for the database (free tier available)

**Frontend:**
- Vercel, Netlify, or GitHub Pages for static hosting

### Production Checklist
- [ ] Update CORS settings for your domain
- [ ] Set NODE_ENV=production
- [ ] Use environment variables for all sensitive data
- [ ] Set up proper MongoDB indexes for performance
- [ ] Configure rate limiting for the API

## 🐛 Troubleshooting

**"Dashboard shows no data"**
- Check if your transactions have dates in the current month
- The app automatically shows the most recent month with data

**"AI parsing failed"**
- Verify your Gemini API key is valid and has quota
- Make sure the uploaded file is a readable bank statement

**"Can't connect to backend"**
- Ensure both servers are running (backend on 5000, frontend on 3000)
- Check that MongoDB is running and accessible

**"Upload keeps failing"**
- File might be too large (10MB limit)
- Check file format is supported (PDF, CSV, TXT)

## 🤝 Contributing

I'd love your help making this better! Here's how:

1. Fork the repo
2. Create a feature branch: `git checkout -b cool-new-feature`
3. Make your changes and test them
4. Commit with a clear message: `git commit -m "Add cool new feature"`
5. Push and create a Pull Request

### Development Tips
- The codebase uses TypeScript where possible for better developer experience
- Components are designed to be responsive by default
- Error handling is important - always consider edge cases
- Keep the AI prompts in `aiService.js` clear and specific

## 💡 Future Ideas

Things I'm thinking about adding:
- Budget tracking and alerts
- Recurring transaction detection
- Export functionality (CSV, PDF reports)
- Multiple account support
- Receipt photo processing
- Bank account integration via Plaid
- Spending goals and targets

## 📄 License

MIT License - feel free to use this for your own projects!

## 🙏 Acknowledgments

- Google for providing the Gemini AI API that makes the magic happen
- The React and Node.js communities for amazing tools and documentation
- Everyone who's contributed ideas and feedback

---

**Questions?** Open an issue or reach out. I'm happy to help you get this running!

**Like this project?** Give it a star ⭐ and share it with others who might find it useful.
