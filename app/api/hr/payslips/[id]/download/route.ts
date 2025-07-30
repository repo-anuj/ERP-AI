import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET - Download payslip as PDF
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('token')?.value;

    if (!token) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const payload = await verifyAuth(token);
    if (!payload.email) {
      return new NextResponse('Invalid token', { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: payload.email },
      include: { company: true }
    });

    if (!user?.companyId) {
      return new NextResponse('Company not found', { status: 404 });
    }

    const { id } = params;

    const payslip = await prisma.payslip.findFirst({
      where: {
        id,
        companyId: user.companyId,
      },
      include: {
        employee: {
          select: {
            firstName: true,
            lastName: true,
            employeeId: true,
          }
        }
      }
    });

    if (!payslip) {
      return new NextResponse('Payslip not found', { status: 404 });
    }

    // Update download count
    await prisma.payslip.update({
      where: { id },
      data: {
        downloadCount: {
          increment: 1
        },
        lastDownloadAt: new Date()
      }
    });

    // Generate HTML content for PDF
    const htmlContent = generatePayslipHTML(payslip.payslipData as any, payslip.payslipNumber);

    // For now, return HTML content. In production, you would use a PDF library like puppeteer
    // to convert HTML to PDF and return the PDF buffer
    
    // Example with puppeteer (commented out as it requires additional setup):
    /*
    const puppeteer = require('puppeteer');
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.setContent(htmlContent);
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    });
    await browser.close();

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="payslip-${payslip.payslipNumber}.pdf"`
      }
    });
    */

    // For now, return HTML that can be printed as PDF by the browser
    return new NextResponse(htmlContent, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="payslip-${payslip.payslipNumber}.html"`
      }
    });

  } catch (error) {
    console.error('[PAYSLIP_DOWNLOAD]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}

// Helper function to generate HTML content for payslip
function generatePayslipHTML(payslipData: any, payslipNumber: string): string {
  const data = payslipData;
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Payslip - ${payslipNumber}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Arial', sans-serif;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
            background: #fff;
        }
        
        .payslip-container {
            max-width: 800px;
            margin: 20px auto;
            padding: 20px;
            border: 2px solid #000;
            background: #fff;
        }
        
        .header {
            text-align: center;
            border-bottom: 2px solid #000;
            padding-bottom: 15px;
            margin-bottom: 20px;
        }
        
        .company-name {
            font-size: 24px;
            font-weight: bold;
            color: #2563eb;
            margin-bottom: 5px;
        }
        
        .company-details {
            font-size: 11px;
            color: #666;
            margin-bottom: 10px;
        }
        
        .payslip-title {
            font-size: 18px;
            font-weight: bold;
            color: #000;
            margin-top: 10px;
        }
        
        .employee-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 20px;
            border: 1px solid #ccc;
            padding: 15px;
            background: #f9f9f9;
        }
        
        .employee-left, .employee-right {
            width: 48%;
        }
        
        .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            padding: 2px 0;
        }
        
        .info-label {
            font-weight: bold;
            width: 40%;
        }
        
        .info-value {
            width: 60%;
            text-align: right;
        }
        
        .salary-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            border: 2px solid #000;
        }
        
        .salary-table th,
        .salary-table td {
            border: 1px solid #000;
            padding: 8px;
            text-align: left;
        }
        
        .salary-table th {
            background-color: #f0f0f0;
            font-weight: bold;
            text-align: center;
        }
        
        .amount {
            text-align: right !important;
            font-family: 'Courier New', monospace;
        }
        
        .total-row {
            font-weight: bold;
            background-color: #f9f9f9;
        }
        
        .net-salary {
            background-color: #e8f5e8;
            font-weight: bold;
            font-size: 14px;
        }
        
        .summary-section {
            display: flex;
            justify-content: space-between;
            margin-top: 20px;
        }
        
        .summary-box {
            width: 48%;
            border: 1px solid #ccc;
            padding: 15px;
            background: #f9f9f9;
        }
        
        .summary-title {
            font-weight: bold;
            margin-bottom: 10px;
            color: #2563eb;
            border-bottom: 1px solid #ccc;
            padding-bottom: 5px;
        }
        
        .footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #ccc;
            text-align: center;
            font-size: 10px;
            color: #666;
        }
        
        .signature-section {
            display: flex;
            justify-content: space-between;
            margin-top: 40px;
            padding-top: 20px;
        }
        
        .signature-box {
            width: 30%;
            text-align: center;
            border-top: 1px solid #000;
            padding-top: 10px;
        }
        
        @media print {
            body {
                margin: 0;
                padding: 0;
            }
            
            .payslip-container {
                margin: 0;
                border: none;
                box-shadow: none;
            }
        }
    </style>
</head>
<body>
    <div class="payslip-container">
        <!-- Header -->
        <div class="header">
            <div class="company-name">${data.company.name}</div>
            <div class="company-details">
                ${data.company.address}<br>
                Phone: ${data.company.phone} | Email: ${data.company.email}
                ${data.company.website ? ` | Website: ${data.company.website}` : ''}
            </div>
            <div class="payslip-title">SALARY SLIP</div>
            <div style="font-size: 14px; margin-top: 5px;">
                For the month of ${data.period.monthName} ${data.period.year}
            </div>
        </div>

        <!-- Employee Information -->
        <div class="employee-info">
            <div class="employee-left">
                <div class="info-row">
                    <span class="info-label">Employee Name:</span>
                    <span class="info-value">${data.employee.name}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Employee ID:</span>
                    <span class="info-value">${data.employee.employeeId}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Designation:</span>
                    <span class="info-value">${data.employee.designation}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Department:</span>
                    <span class="info-value">${data.employee.department}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">PAN Number:</span>
                    <span class="info-value">${data.employee.panNumber || 'N/A'}</span>
                </div>
            </div>
            <div class="employee-right">
                <div class="info-row">
                    <span class="info-label">Payslip Number:</span>
                    <span class="info-value">${payslipNumber}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Pay Period:</span>
                    <span class="info-value">${data.period.monthName} ${data.period.year}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Working Days:</span>
                    <span class="info-value">${data.period.workingDays}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Present Days:</span>
                    <span class="info-value">${data.period.presentDays}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Bank Account:</span>
                    <span class="info-value">${data.employee.bankAccount || 'N/A'}</span>
                </div>
            </div>
        </div>

        <!-- Salary Details Table -->
        <table class="salary-table">
            <thead>
                <tr>
                    <th style="width: 50%;">EARNINGS</th>
                    <th style="width: 20%;">AMOUNT (₹)</th>
                    <th style="width: 50%;">DEDUCTIONS</th>
                    <th style="width: 20%;">AMOUNT (₹)</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Basic Salary</td>
                    <td class="amount">${data.earnings.basicSalary.toLocaleString()}</td>
                    <td>Provident Fund</td>
                    <td class="amount">${data.deductions.pfEmployee.toLocaleString()}</td>
                </tr>
                <tr>
                    <td>House Rent Allowance</td>
                    <td class="amount">${data.earnings.hra.toLocaleString()}</td>
                    <td>Employee State Insurance</td>
                    <td class="amount">${data.deductions.esiEmployee.toLocaleString()}</td>
                </tr>
                <tr>
                    <td>Conveyance Allowance</td>
                    <td class="amount">${data.earnings.conveyance.toLocaleString()}</td>
                    <td>Professional Tax</td>
                    <td class="amount">${data.deductions.professionalTax.toLocaleString()}</td>
                </tr>
                <tr>
                    <td>Medical Allowance</td>
                    <td class="amount">${data.earnings.medicalAllowance.toLocaleString()}</td>
                    <td>Tax Deducted at Source</td>
                    <td class="amount">${data.deductions.tds.toLocaleString()}</td>
                </tr>
                <tr>
                    <td>Special Allowance</td>
                    <td class="amount">${data.earnings.specialAllowance.toLocaleString()}</td>
                    <td>Other Deductions</td>
                    <td class="amount">${data.deductions.otherDeductions.toLocaleString()}</td>
                </tr>
                ${data.earnings.bonus > 0 ? `
                <tr>
                    <td>Bonus</td>
                    <td class="amount">${data.earnings.bonus.toLocaleString()}</td>
                    <td></td>
                    <td class="amount"></td>
                </tr>
                ` : ''}
                ${data.earnings.incentives > 0 ? `
                <tr>
                    <td>Incentives</td>
                    <td class="amount">${data.earnings.incentives.toLocaleString()}</td>
                    <td></td>
                    <td class="amount"></td>
                </tr>
                ` : ''}
                <tr class="total-row">
                    <td><strong>GROSS EARNINGS</strong></td>
                    <td class="amount"><strong>₹${data.summary.grossSalary.toLocaleString()}</strong></td>
                    <td><strong>TOTAL DEDUCTIONS</strong></td>
                    <td class="amount"><strong>₹${data.summary.totalDeductions.toLocaleString()}</strong></td>
                </tr>
                <tr class="net-salary">
                    <td colspan="2"><strong>NET SALARY</strong></td>
                    <td colspan="2" class="amount"><strong>₹${data.summary.netSalary.toLocaleString()}</strong></td>
                </tr>
            </tbody>
        </table>

        <!-- Summary Section -->
        <div class="summary-section">
            <div class="summary-box">
                <div class="summary-title">Employer Contributions</div>
                <div class="info-row">
                    <span class="info-label">Provident Fund:</span>
                    <span class="info-value">₹${data.employerContributions.pfEmployer.toLocaleString()}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">ESI:</span>
                    <span class="info-value">₹${data.employerContributions.esiEmployer.toLocaleString()}</span>
                </div>
                <div class="info-row" style="border-top: 1px solid #ccc; margin-top: 10px; padding-top: 10px;">
                    <span class="info-label"><strong>Cost to Company:</strong></span>
                    <span class="info-value"><strong>₹${data.summary.costToCompany.toLocaleString()}</strong></span>
                </div>
            </div>
            
            <div class="summary-box">
                <div class="summary-title">Payment Information</div>
                <div class="info-row">
                    <span class="info-label">Bank Name:</span>
                    <span class="info-value">${data.employee.bankName || 'N/A'}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Account Number:</span>
                    <span class="info-value">${data.employee.bankAccount || 'N/A'}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Payment Mode:</span>
                    <span class="info-value">${data.payment.paymentMode || 'Bank Transfer'}</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Payment Date:</span>
                    <span class="info-value">${data.payment.paymentDate ? new Date(data.payment.paymentDate).toLocaleDateString() : 'Pending'}</span>
                </div>
            </div>
        </div>

        <!-- Signature Section -->
        <div class="signature-section">
            <div class="signature-box">
                <div>Employee Signature</div>
            </div>
            <div class="signature-box">
                <div>HR Signature</div>
            </div>
            <div class="signature-box">
                <div>Authorized Signatory</div>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <p>This is a computer-generated payslip and does not require a signature.</p>
            <p>Generated on: ${new Date().toLocaleDateString()} | Payslip Number: ${payslipNumber}</p>
        </div>
    </div>
</body>
</html>
  `;
}
