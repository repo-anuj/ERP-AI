#!/bin/bash

echo "ERP-AI Sales Data Import Tool"
echo "============================"
echo
echo "This script will generate and import sample sales data into your MongoDB database."
echo
echo "Prerequisites:"
echo "- MongoDB connection configured in .env file"
echo "- Node.js installed"
echo

read -p "Press Enter to continue or Ctrl+C to cancel..."

echo
echo "Step 1: Installing dependencies..."
npm install

echo
echo "Step 2: Generating and importing sales data..."
node scripts/import-sales-data.js

echo
echo "Import process completed!"
echo "You can now view the sales data in the ERP-AI dashboard."
echo

read -p "Press Enter to exit..."
