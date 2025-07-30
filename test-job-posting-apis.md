# Job Posting API Issues - FIXED ✅

## Summary of Issues and Solutions

The job posting functionality had three main issues that prevented departments and locations from being fetched properly, and caused validation errors during job posting creation.

## Issues Fixed

### 1. Department Data Fetching ✅
- **Problem**: Job posting forms expected `deptsData.departments` but API returned array directly
- **Root Cause**: Mismatch between API response format and frontend expectations
- **Solution**:
  - Modified job posting pages to handle direct array response: `Array.isArray(deptsData) ? deptsData : []`
  - Added `type=simple` parameter to departments API to return department records with `id` and `name`
  - Auto-creates missing default departments when using `type=simple`
  - **Files Changed**:
    - `app/api/departments/route.ts` - Added `type=simple` handling
    - `app/hr/recruitment/job-postings/create/page.tsx` - Fixed response handling
    - `app/hr/recruitment/job-postings/page.tsx` - Fixed response handling

### 2. Location Data Fetching ✅
- **Problem**: Job posting forms expected `locsData.locations` but API returned array directly
- **Root Cause**: Same response format mismatch + missing default locations
- **Solution**:
  - Modified job posting pages to handle direct array response: `Array.isArray(locsData) ? locsData : []`
  - Enhanced locations API to auto-create default headquarters location if none exists
  - Uses company information (name, city, state) for default location
  - **Files Changed**:
    - `app/api/locations/route.ts` - Added default location creation
    - `app/hr/recruitment/job-postings/create/page.tsx` - Fixed response handling
    - `app/hr/recruitment/job-postings/page.tsx` - Fixed response handling

### 3. Validation Errors ✅
- **Problem**: Form sent string values for numeric fields (`salaryMin`, `salaryMax`, `maxApplications`)
- **Root Cause**: Frontend forms send all values as strings, but API expected numbers
- **Solution**: Enhanced validation schema to handle string-to-number conversion:
  ```typescript
  salaryMin: z.union([z.string(), z.number()]).transform((val) => {
    if (typeof val === 'string') {
      const parsed = parseFloat(val);
      return isNaN(parsed) || val === '' ? null : parsed;
    }
    return val;
  }).optional().nullable(),
  ```
- **Files Changed**:
  - `app/api/hr/recruitment/job-postings/route.ts` - Enhanced validation schema
  - `app/api/hr/recruitment/job-postings/[id]/route.ts` - Added same validation for updates

## API Endpoints

### Departments API
- **GET** `/api/departments?type=simple` - Returns departments with `id` and `name` for dropdowns ✅
- **GET** `/api/departments` - Returns department overview with employee counts
- **GET** `/api/departments?type=dropdown` - Returns array of department names (legacy)

### Locations API
- **GET** `/api/locations` - Returns all company locations with city/state info ✅
- Auto-creates default headquarters location if none exists ✅
- Returns locations ordered by `isMain` (main location first), then by name

### Job Postings API
- **POST** `/api/hr/recruitment/job-postings` - Create job posting with proper validation ✅
- **PUT** `/api/hr/recruitment/job-postings/[id]` - Update job posting with proper validation ✅

## What Was Fixed

### Frontend Changes
1. **Job Posting Create Page** (`app/hr/recruitment/job-postings/create/page.tsx`):
   - Changed API call to use `?type=simple` for departments
   - Fixed response handling to expect arrays directly
   - Added proper error handling for array responses

2. **Job Posting List Page** (`app/hr/recruitment/job-postings/page.tsx`):
   - Same fixes as create page for consistency

### Backend Changes
1. **Departments API** (`app/api/departments/route.ts`):
   - Added `type=simple` parameter handling
   - Returns actual Department records with `id` and `name`
   - Auto-creates missing default departments

2. **Locations API** (`app/api/locations/route.ts`):
   - Auto-creates default headquarters location if none exists
   - Uses company data (name, city, state) for default location

3. **Job Postings API** (`app/api/hr/recruitment/job-postings/route.ts`):
   - Enhanced validation schema with string-to-number transformation
   - Handles empty strings and converts them to null
   - Supports both string and number inputs

4. **Job Postings Update API** (`app/api/hr/recruitment/job-postings/[id]/route.ts`):
   - Added same validation schema as create endpoint
   - Consistent handling of string-to-number conversion

## Testing Results

✅ **Department Fetching**: Now returns proper department objects with IDs
✅ **Location Fetching**: Returns company locations with city/state, creates defaults
✅ **Job Posting Creation**: No more validation errors for salary/maxApplications
✅ **Job Posting Updates**: Same validation fixes applied
✅ **Default Data**: Auto-creates departments and locations when missing

## Expected Behavior

- **Departments**: Shows all company departments plus default departments (Engineering, Sales, etc.)
- **Locations**: Shows company locations with format "Location Name - City"
- **Job Posting Form**: Submits successfully without validation errors
- **Default Data**: If no departments/locations exist, defaults are created automatically
- **Company Locations**: All locations for the company are fetched and displayed
- **City/State Display**: Location dropdowns show "Location Name - City" format
