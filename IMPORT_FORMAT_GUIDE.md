# Student Import File Format Guide

## CSV Format
Create a CSV file with the following headers:

```
PRN,Name,Email,Mobile,ParentMobile,BatchID
2023001,John Doe,john@email.com,1234567890,9876543210,CS-A
2023002,Jane Smith,jane@email.com,1234567891,9876543211,CS-A
2023003,Bob Wilson,bob@email.com,1234567892,9876543212,CS-B
```

## Excel Format
Create an Excel file (.xlsx) with the same column headers:
- **PRN** (Required): Student Registration Number
- **Name** (Required): Full name of student
- **Email** (Optional): Email address
- **Mobile** (Optional): Phone number
- **ParentMobile** (Optional): Parent's phone number
- **BatchID** (Optional): Batch/Class identifier

## Important Notes:
1. PRN and Name are **required** fields
2. PRN must be unique (no duplicates)
3. File must be either .csv or .xlsx format
4. Headers must match exactly (case-sensitive)

## Testing:
Try importing this sample data to verify the import functionality works.
