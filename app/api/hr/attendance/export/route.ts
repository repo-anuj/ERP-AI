import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyAuth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { format, startOfMonth, endOfMonth } from 'date-fns';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// GET - Export attendance data
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month') || format(new Date(), 'yyyy-MM');
    const departmentId = searchParams.get('departmentId');
    const employeeId = searchParams.get('employeeId');
    const exportFormat = searchParams.get('format') || 'json';

    // Parse month and calculate date range
    const [year, monthNum] = month.split('-').map(Number);
    const startDate = startOfMonth(new Date(year, monthNum - 1));
    const endDate = endOfMonth(new Date(year, monthNum - 1));

    // Build where clause
    const whereClause: any = {
      companyId: user.companyId,
      date: {
        gte: startDate,
        lte: endDate,
      },
    };

    if (departmentId) {
      whereClause.employee = {
        departmentId: departmentId,
      };
    }

    if (employeeId) {
      whereClause.employeeId = employeeId;
    }

    // Fetch attendance data
    const attendanceRecords = await prisma.attendance.findMany({
      where: whereClause,
      include: {
        employee: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            employeeId: true,
            email: true,
            position: true,
            jobTitle: true,
            department: {
              select: {
                id: true,
                name: true,
              }
            }
          }
        }
      },
      orderBy: [
        { date: 'desc' },
        { employeeId: 'asc' }
      ]
    });

    // Format data for export
    const exportData = attendanceRecords.map(record => ({
      'Employee ID': record.employee.employeeId,
      'Employee Name': `${record.employee.firstName} ${record.employee.lastName}`,
      'Email': record.employee.email,
      'Department': record.employee.department?.name || 'N/A',
      'Position': record.employee.position || 'N/A',
      'Job Title': record.employee.jobTitle || 'N/A',
      'Date': format(new Date(record.date), 'yyyy-MM-dd'),
      'Day': format(new Date(record.date), 'EEEE'),
      'Check In': record.checkIn ? format(new Date(record.checkIn), 'HH:mm:ss') : 'N/A',
      'Check Out': record.checkOut ? format(new Date(record.checkOut), 'HH:mm:ss') : 'N/A',
      'Total Hours': record.totalHours || 0,
      'Overtime Hours': record.overtimeHours || 0,
      'Status': record.status,
      'Is Late': record.isLate ? 'Yes' : 'No',
      'Is Early Leave': record.isEarlyLeave ? 'Yes' : 'No',
      'Check In Location': record.checkInLocation || 'N/A',
      'Check Out Location': record.checkOutLocation || 'N/A',
      'Notes': record.notes || 'N/A',
      'Is Approved': record.isApproved ? 'Yes' : 'No',
      'Created At': format(new Date(record.createdAt), 'yyyy-MM-dd HH:mm:ss'),
    }));

    // Return data based on format
    if (exportFormat === 'json') {
      return NextResponse.json({
        success: true,
        data: exportData,
        summary: {
          totalRecords: exportData.length,
          period: {
            startDate: format(startDate, 'yyyy-MM-dd'),
            endDate: format(endDate, 'yyyy-MM-dd'),
            month: format(startDate, 'MMMM yyyy'),
          },
          exportedAt: new Date().toISOString(),
          exportedBy: `${user.firstName} ${user.lastName}`,
        }
      });
    }

    // For CSV/Excel format, return CSV data
    if (exportFormat === 'csv' || exportFormat === 'excel') {
      const csvHeaders = Object.keys(exportData[0] || {});
      const csvRows = exportData.map(row => 
        csvHeaders.map(header => {
          const value = row[header as keyof typeof row];
          // Escape commas and quotes in CSV
          if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      );

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows
      ].join('\n');

      const headers = new Headers();
      headers.set('Content-Type', 'text/csv');
      headers.set('Content-Disposition', `attachment; filename="attendance-export-${month}.csv"`);

      return new NextResponse(csvContent, { headers });
    }

    return new NextResponse('Invalid export format', { status: 400 });

  } catch (error) {
    console.error('[ATTENDANCE_EXPORT_GET]', error);
    return new NextResponse('Internal error', { status: 500 });
  }
}
