# ERP-AI Data Generation Scripts

This directory contains scripts for generating and importing sample data for the ERP-AI system.

## Available Scripts

- `generate-sample-data.js` - Generates basic sample data (users, company, inventory, etc.)
- `generate-sales-data.js` - Generates sample sales data
- `generate-project-data.js` - Generates sample project data
- `generate-finance-data.js` - Generates sample finance data
- `combine-data.js` - Combines all generated data into a single file
- `import-sales-data.js` - Imports sales data directly into MongoDB

## Generating and Importing Sales Data

### Quick Start

The easiest way to generate and import sales data is to use the provided scripts:

- **Windows**: Run `scripts/run-import.bat` by double-clicking it or from the command line
- **macOS/Linux**: Run `scripts/run-import.sh` from the terminal:
  ```bash
  chmod +x scripts/run-import.sh  # Make it executable (first time only)
  ./scripts/run-import.sh
  ```

### Manual Import

If you prefer to run the import manually:

1. Make sure your MongoDB connection is configured in the `.env` file at the root of the project:

```
DATABASE_URL="mongodb+srv://username:password@cluster.mongodb.net/erp-ai?retryWrites=true&w=majority"
```

2. Run the import script:

```bash
node scripts/import-sales-data.js
```

This script will:
- Generate sample data if it doesn't exist
- Generate sales data
- Import customers and sales into your MongoDB database
- Map the data to match the expected schema

## Viewing the Data

After importing the data, you can view it in the Sales dashboard of the ERP-AI application. The data will be displayed in the sales table and used to calculate metrics such as:

- Total sales
- Total revenue
- Average order value
- Total customers

## Customizing the Data

If you want to customize the generated data, you can modify the following files:

- `generate-sales-data.js` - Modify the number of sales, customers, or the date range
- `import-sales-data.js` - Customize how the data is imported into MongoDB

## Troubleshooting

If you encounter any issues:

1. Check your MongoDB connection string in the `.env` file
2. Make sure you have the required permissions to write to the database
3. Check the console output for any error messages
4. Verify that the Prisma schema matches the expected data structure
