/**
 * These test are written by github copilot Claude4 Sonnet.
 * I first just let the copilot to generate the tests for three constrians listed
 * in the appendix. Then I manually check the code and run the tests. But at first
 * all the tests passed, which it should not since the parser is pretty naive.
 * So I updated the prompt to add tests that would fail as intended.
 * Then, I let the copilot to generate more tests for the CSV standard and 
 * schema validation. And let it comment the code as well.
 * I manually checked the code and fixed some minor issues. make sure every tests
 * are correct and meaningful. There should be 6 test failed as intended.
 */

import { parseCSV } from "../src/basic-parser";
import * as path from "path";
import * as fs from "fs";
import * as os from "os";

const PEOPLE_CSV_PATH = path.join(__dirname, "../data/people.csv");

// Helper function to create temporary CSV files for testing
async function createTempCSV(content: string): Promise<string> {
  const tempPath = path.join(os.tmpdir(), `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.csv`);
  await fs.promises.writeFile(tempPath, content);
  return tempPath;
}

// Helper function to clean up temporary files
async function cleanupTempFile(filePath: string): Promise<void> {
  try {
    await fs.promises.unlink(filePath);
  } catch (error) {
    // Ignore errors if file doesn't exist
  }
}

/**
 * Test: Basic CSV parsing functionality
 * Purpose: Verifies that the parser can read a simple CSV file and return correct data structure
 * Input: people.csv file with basic comma-separated values (no quotes, no special characters)
 * Expected Output: Array of arrays where each inner array represents a CSV row
 * CSV Standard: Tests basic comma separation and line-by-line reading
 */
test("parseCSV yields arrays", async () => {
  const results = await parseCSV(PEOPLE_CSV_PATH)
  
  expect(results).toHaveLength(5);
  expect(results[0]).toEqual(["name", "age"]);
  expect(results[1]).toEqual(["Alice", "23"]);
  expect(results[2]).toEqual(["Bob", "thirty"]); // why does this work? :(
  expect(results[3]).toEqual(["Charlie", "25"]);
  expect(results[4]).toEqual(["Nim", "22"]);
});

/**
 * Test: Data structure validation
 * Purpose: Ensures all returned rows are arrays (proper data type consistency)
 * Input: people.csv file 
 * Expected Output: All rows should be JavaScript arrays
 * CSV Standard: Validates that parser maintains consistent data structure
 */
test("parseCSV yields only arrays", async () => {
  const results = await parseCSV(PEOPLE_CSV_PATH)
  for(const row of results) {
    expect(Array.isArray(row)).toBe(true);
  }
});

// Edge case tests - these may fail with current parser implementation

/**
 * Test: Empty field handling
 * Purpose: Tests parser's ability to handle missing values (empty columns)
 * Input: CSV with various empty fields (beginning, middle, end of rows)
 * Expected Output: Empty fields should be represented as empty strings ""
 * CSV Standard: RFC 4180 - Adjacent commas represent empty fields
 * Current Parser: PASSES - Simple split() handles this correctly
 */
test("parseCSV handles empty columns", async () => {
  const csvContent = `name,age,city
Alice,23,
Bob,,Boston
,25,Chicago`;
  
  const tempPath = await createTempCSV(csvContent);
  try {
    const results = await parseCSV(tempPath);
    
    expect(results).toHaveLength(4);
    expect(results[0]).toEqual(["name", "age", "city"]);
    expect(results[1]).toEqual(["Alice", "23", ""]);      // Empty city
    expect(results[2]).toEqual(["Bob", "", "Boston"]);    // Empty age
    expect(results[3]).toEqual(["", "25", "Chicago"]);    // Empty name
  } finally {
    await cleanupTempFile(tempPath);
  }
});

/**
 * Test: Quoted fields containing commas
 * Purpose: Tests proper handling of commas within quoted fields
 * Input: CSV with quoted fields that contain commas (should not be split)
 * Expected Output: Quoted fields should be treated as single values, quotes removed
 * CSV Standard: RFC 4180 - Fields containing commas must be quoted
 * Current Parser: FAILS - Splits on all commas, ignores quotes
 */
test("parseCSV handles fields containing commas", async () => {
  const csvContent = `name,description,age
"Smith, John",Software Engineer,30
"Johnson, Jane","Data Scientist, Senior",28
Alice,Designer,25`;
  
  const tempPath = await createTempCSV(csvContent);
  try {
    const results = await parseCSV(tempPath);
    
    expect(results).toHaveLength(4);
    expect(results[0]).toEqual(["name", "description", "age"]);
    expect(results[1]).toEqual(["Smith, John", "Software Engineer", "30"]);      // Comma in name should be preserved
    expect(results[2]).toEqual(["Johnson, Jane", "Data Scientist, Senior", "28"]); // Commas in both name and description
    expect(results[3]).toEqual(["Alice", "Designer", "25"]);                     // No quotes needed
  } finally {
    await cleanupTempFile(tempPath);
  }
});

/**
 * Test: Quote escaping within fields
 * Purpose: Tests handling of double quotes within quoted fields
 * Input: CSV with escaped quotes (doubled quotes "") within quoted fields
 * Expected Output: Escaped quotes should become single quotes in output
 * CSV Standard: RFC 4180 - Quote within quoted field is escaped by doubling ""
 * Current Parser: FAILS - No quote processing, treats quotes as literal characters
 */
test("parseCSV handles fields containing double quotes", async () => {
  const csvContent = `name,quote,age
Alice,"She said ""Hello world""",23
Bob,"The ""quick"" brown fox",30
Charlie,"""Quoted at start",25
Diana,"Quoted at end""",28`;
  
  const tempPath = await createTempCSV(csvContent);
  try {
    const results = await parseCSV(tempPath);
    
    expect(results).toHaveLength(5);
    expect(results[0]).toEqual(["name", "quote", "age"]);
    expect(results[1]).toEqual(["Alice", 'She said "Hello world"', "23"]);    // "" becomes "
    expect(results[2]).toEqual(["Bob", 'The "quick" brown fox', "30"]);       // Multiple "" within field
    expect(results[3]).toEqual(["Charlie", '"Quoted at start', "25"]);        // Quote at start
    expect(results[4]).toEqual(["Diana", 'Quoted at end"', "28"]);            // Quote at end
  } finally {
    await cleanupTempFile(tempPath);
  }
});

/**
 * Test: Complex combination of edge cases
 * Purpose: Tests multiple CSV complexities in a single file
 * Input: CSV combining quoted fields, commas, quote escaping, and empty fields
 * Expected Output: All edge cases should be handled correctly simultaneously
 * CSV Standard: RFC 4180 - Real-world CSV complexity test
 * Current Parser: FAILS - Multiple parsing issues compound
 */
test("parseCSV handles complex edge cases combined", async () => {
  const csvContent = `name,address,notes
"Smith, John","123 Main St, Apt ""A""","Lives in a ""cozy"" place"
,"","Empty name and address"
Alice,"456 Oak Dr","Simple entry"`;
  
  const tempPath = await createTempCSV(csvContent);
  try {
    const results = await parseCSV(tempPath);
    
    expect(results).toHaveLength(4);
    expect(results[0]).toEqual(["name", "address", "notes"]);
    expect(results[1]).toEqual(["Smith, John", '123 Main St, Apt "A"', 'Lives in a "cozy" place']); // Commas + escaped quotes
    expect(results[2]).toEqual(["", "", "Empty name and address"]);                                   // Empty quoted fields
    expect(results[3]).toEqual(["Alice", "456 Oak Dr", "Simple entry"]);                            // Mixed quoted/unquoted
  } finally {
    await cleanupTempFile(tempPath);
  }
});

// Additional CSV standard conformity tests

/**
 * Test: Multi-line fields within quotes
 * Purpose: Tests handling of newlines within quoted fields (RFC 4180 requirement)
 * Input: CSV with quoted fields containing literal newline characters
 * Expected Output: Multi-line fields should be preserved as single field values with \n
 * CSV Standard: RFC 4180 - Quoted fields may contain newlines
 * Current Parser: FAILS - Treats each line separately, doesn't recognize quoted multi-line fields
 */
test("parseCSV handles fields with newlines (RFC 4180)", async () => {
  const csvContent = `name,description,status
Alice,"Software
Engineer",Active
Bob,"Data Scientist
with PhD",Active
Charlie,"Designer","On
Leave"`;
  
  const tempPath = await createTempCSV(csvContent);
  try {
    const results = await parseCSV(tempPath);
    
    expect(results).toHaveLength(4);
    expect(results[0]).toEqual(["name", "description", "status"]);
    expect(results[1]).toEqual(["Alice", "Software\nEngineer", "Active"]);        // Newline preserved in field
    expect(results[2]).toEqual(["Bob", "Data Scientist\nwith PhD", "Active"]);    // Multi-word with newline
    expect(results[3]).toEqual(["Charlie", "Designer", "On\nLeave"]);             // Newline in last field
  } finally {
    await cleanupTempFile(tempPath);
  }
});

/**
 * Test: Mixed quoted and unquoted fields
 * Purpose: Tests parser's handling of mixed quoting scenarios in same row
 * Input: CSV with combination of quoted and unquoted fields
 * Expected Output: Quoted fields should have quotes removed, unquoted fields unchanged
 * CSV Standard: RFC 4180 - Fields may be optionally quoted
 * Current Parser: FAILS - Doesn't process quotes, treats them as literal characters
 */
test("parseCSV handles different quote scenarios", async () => {
  const csvContent = `field1,field2,field3
"quoted field","unquoted field","another quoted"
unquoted,"mixed, with comma",unquoted
"","only quotes","last"`;
  
  const tempPath = await createTempCSV(csvContent);
  try {
    const results = await parseCSV(tempPath);
    
    expect(results).toHaveLength(4);
    expect(results[0]).toEqual(["field1", "field2", "field3"]);
    expect(results[1]).toEqual(["quoted field", "unquoted field", "another quoted"]); // All quoted but quotes removed
    expect(results[2]).toEqual(["unquoted", "mixed, with comma", "unquoted"]);        // Mixed quoting
    expect(results[3]).toEqual(["", "only quotes", "last"]);                          // Empty quoted field
  } finally {
    await cleanupTempFile(tempPath);
  }
});

/**
 * Test: Trailing commas and empty fields at end
 * Purpose: Tests handling of trailing commas that create empty fields
 * Input: CSV with trailing commas on each line
 * Expected Output: Trailing commas should create additional empty string fields
 * CSV Standard: RFC 4180 - Trailing comma indicates empty field
 * Current Parser: PASSES - Simple split() correctly handles trailing commas
 */
test("parseCSV handles trailing commas and empty last fields", async () => {
  const csvContent = `col1,col2,col3,
value1,value2,value3,
value4,value5,,
value6,,,`;
  
  const tempPath = await createTempCSV(csvContent);
  try {
    const results = await parseCSV(tempPath);
    
    expect(results).toHaveLength(4);
    expect(results[0]).toEqual(["col1", "col2", "col3", ""]);      // Header with trailing comma
    expect(results[1]).toEqual(["value1", "value2", "value3", ""]); // One trailing empty field
    expect(results[2]).toEqual(["value4", "value5", "", ""]);       // Two trailing empty fields
    expect(results[3]).toEqual(["value6", "", "", ""]);             // Three trailing empty fields
  } finally {
    await cleanupTempFile(tempPath);
  }
});

/**
 * Test: Whitespace handling around fields
 * Purpose: Tests trimming of whitespace around field values
 * Input: CSV with various whitespace patterns around values
 * Expected Output: Whitespace should be trimmed from field values
 * CSV Standard: Implementation dependent - some parsers trim, others preserve
 * Current Parser: PASSES - trim() function removes leading/trailing whitespace
 */
test("parseCSV handles whitespace around fields", async () => {
  const csvContent = `name, age , city
 Alice , 23 , Boston 
Bob,  30  ,  New York  
 Charlie ,25, Chicago`;
  
  const tempPath = await createTempCSV(csvContent);
  try {
    const results = await parseCSV(tempPath);
    
    expect(results).toHaveLength(4);
    expect(results[0]).toEqual(["name", "age", "city"]);           // Whitespace trimmed from headers
    expect(results[1]).toEqual(["Alice", "23", "Boston"]);         // All fields trimmed
    expect(results[2]).toEqual(["Bob", "30", "New York"]);         // Multiple spaces trimmed
    expect(results[3]).toEqual(["Charlie", "25", "Chicago"]);      // Mixed whitespace patterns
  } finally {
    await cleanupTempFile(tempPath);
  }
});

/**
 * Test: Variable column count handling
 * Purpose: Tests parser's behavior with inconsistent number of fields per row
 * Input: CSV with rows having different numbers of columns
 * Expected Output: Each row should be parsed independently, preserving actual field count
 * CSV Standard: Not strictly defined - robustness test for malformed CSV
 * Current Parser: PASSES - Handles variable lengths gracefully
 */
test("parseCSV handles inconsistent column counts", async () => {
  const csvContent = `name,age,city
Alice,23,Boston,ExtraField
Bob,30
Charlie,25,Chicago`;
  
  const tempPath = await createTempCSV(csvContent);
  try {
    const results = await parseCSV(tempPath);
    
    expect(results).toHaveLength(4);
    expect(results[0]).toEqual(["name", "age", "city"]);                    // 3 columns (header)
    expect(results[1]).toEqual(["Alice", "23", "Boston", "ExtraField"]);    // 4 columns (extra field)
    expect(results[2]).toEqual(["Bob", "30"]);                              // 2 columns (missing field)
    expect(results[3]).toEqual(["Charlie", "25", "Chicago"]);               // 3 columns (normal)
  } finally {
    await cleanupTempFile(tempPath);
  }
});

/**
 * Test: Special characters and Unicode in quoted fields
 * Purpose: Tests handling of special symbols, Unicode, and complex characters
 * Input: CSV with special symbols, Unicode characters, and escaped quotes
 * Expected Output: All characters should be preserved correctly within fields
 * CSV Standard: RFC 4180 - Should handle any character within quoted fields
 * Current Parser: FAILS - Comma splitting breaks fields with commas
 */
test("parseCSV handles special characters in quoted fields", async () => {
  const csvContent = `name,symbols,unicode
Alice,"Special: !@#$%^&*()_+-=[]{}|;':\",./<>?",Normal
Bob,"Unicode: αβγδε 中文 🚀🎉",Test
Charlie,"Tab:	Space: ",End`;
  
  const tempPath = await createTempCSV(csvContent);
  try {
    const results = await parseCSV(tempPath);
    
    expect(results).toHaveLength(4);
    expect(results[0]).toEqual(["name", "symbols", "unicode"]);
    expect(results[1]).toEqual(["Alice", "Special: !@#$%^&*()_+-=[]{}|;':\",./<>?", "Normal"]); // All special chars preserved
    expect(results[2]).toEqual(["Bob", "Unicode: αβγδε 中文 🚀🎉", "Test"]);                      // Unicode support
    expect(results[3]).toEqual(["Charlie", "Tab:	Space: ", "End"]);                            // Tab and space chars
  } finally {
    await cleanupTempFile(tempPath);
  }
});

/**
 * Test: Empty file handling
 * Purpose: Tests parser behavior with completely empty input file
 * Input: Empty string (zero-length file)
 * Expected Output: Empty array (no rows to parse)
 * CSV Standard: Edge case - should handle gracefully without errors
 * Current Parser: PASSES - Returns empty array correctly
 */
test("parseCSV handles empty file", async () => {
  const csvContent = ``;
  
  const tempPath = await createTempCSV(csvContent);
  try {
    const results = await parseCSV(tempPath);
    
    expect(results).toEqual([]);  // Should return empty array for empty file
  } finally {
    await cleanupTempFile(tempPath);
  }
});

/**
 * Test: Single column CSV handling
 * Purpose: Tests parsing of CSV with only one column (no commas except in data)
 * Input: CSV with single column, multiple rows
 * Expected Output: Each row should be array with single element
 * CSV Standard: Valid CSV format - should parse correctly
 * Current Parser: PASSES - Single values handled correctly
 */
test("parseCSV handles single column CSV", async () => {
  const csvContent = `name
Alice
Bob
Charlie`;
  
  const tempPath = await createTempCSV(csvContent);
  try {
    const results = await parseCSV(tempPath);
    
    expect(results).toHaveLength(4);
    expect(results[0]).toEqual(["name"]);     // Header row
    expect(results[1]).toEqual(["Alice"]);    // Single value rows
    expect(results[2]).toEqual(["Bob"]);
    expect(results[3]).toEqual(["Charlie"]);
  } finally {
    await cleanupTempFile(tempPath);
  }
});

/**
 * Test: Header-only CSV handling
 * Purpose: Tests parsing of CSV file containing only header row (no data rows)
 * Input: Single line CSV with column headers
 * Expected Output: Array with single row containing header fields
 * CSV Standard: Valid minimal CSV - headers without data
 * Current Parser: PASSES - Single row handled correctly
 */
test("parseCSV handles CSV with only headers", async () => {
  const csvContent = `name,age,city`;
  
  const tempPath = await createTempCSV(csvContent);
  try {
    const results = await parseCSV(tempPath);
    
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual(["name", "age", "city"]);  // Only header row present
  } finally {
    await cleanupTempFile(tempPath);
  }
});

// Schema validation tests using Zod

import { z } from "zod";

/**
 * Test: Basic schema validation with string array
 * Purpose: Tests Zod schema parsing with simple string tuple validation
 * Input: CSV with name,age data validated against string tuple schema
 * Expected Output: Array of validated tuples matching schema structure
 * Schema: Validates each row as [string, string] tuple
 */
test("parseCSV with basic string tuple schema", async () => {
  const csvContent = `Alice,23
Bob,30
Charlie,25`;
  
  const schema = z.tuple([z.string(), z.string()]);
  const tempPath = await createTempCSV(csvContent);
  
  try {
    const results = await parseCSV(tempPath, schema);
    
    expect(results).toHaveLength(3);
    expect(results[0]).toEqual(["Alice", "23"]);
    expect(results[1]).toEqual(["Bob", "30"]);
    expect(results[2]).toEqual(["Charlie", "25"]);
  } finally {
    await cleanupTempFile(tempPath);
  }
});

/**
 * Test: Schema validation with type coercion
 * Purpose: Tests Zod schema with automatic type conversion (string to number)
 * Input: CSV with numeric age values as strings
 * Expected Output: Array where age values are converted to numbers
 * Schema: Validates name as string, age as coerced number - handles header as strings
 */
test("parseCSV with type coercion schema", async () => {
  const csvContent = `Alice,23
Bob,30
Charlie,25`;
  
  const schema = z.tuple([z.string(), z.coerce.number()]);
  const tempPath = await createTempCSV(csvContent);
  
  try {
    const results = await parseCSV(tempPath, schema);
    
    expect(results).toHaveLength(3);
    expect(results[0]).toEqual(["Alice", 23]);   // Age converted to number
    expect(results[1]).toEqual(["Bob", 30]);
    expect(results[2]).toEqual(["Charlie", 25]);
  } finally {
    await cleanupTempFile(tempPath);
  }
});

/**
 * Test: Schema validation failure handling
 * Purpose: Tests error handling when CSV data doesn't match schema requirements
 * Input: CSV with invalid age value that can't be coerced to number
 * Expected Output: Should throw descriptive error with row information
 * Schema: Requires second field to be a valid number
 */
test("parseCSV schema validation failure with descriptive error", async () => {
  const csvContent = `Alice,23
Bob,not-a-number
Charlie,25`;
  
  const schema = z.tuple([z.string(), z.coerce.number()]);
  const tempPath = await createTempCSV(csvContent);
  
  try {
    await expect(parseCSV(tempPath, schema)).rejects.toThrow(/CSV validation failed at row 2/);
    await expect(parseCSV(tempPath, schema)).rejects.toThrow(/Bob.*not-a-number/);
  } finally {
    await cleanupTempFile(tempPath);
  }
});

/**
 * Test: Complex schema with multiple data types
 * Purpose: Tests schema with string, number, boolean, and optional fields
 * Input: CSV with mixed data types including boolean values
 * Expected Output: Array with properly typed and transformed values
 * Schema: Complex tuple with various Zod transformations
 */
test("parseCSV with complex multi-type schema", async () => {
  const csvContent = `Alice,23,true,50000
Bob,30,false,75000
Charlie,25,true,60000`;
  
  const schema = z.tuple([
    z.string(),
    z.coerce.number(),
    z.string().transform(val => val.toLowerCase() === 'true'),
    z.coerce.number()
  ]);
  const tempPath = await createTempCSV(csvContent);
  
  try {
    const results = await parseCSV(tempPath, schema);
    
    expect(results).toHaveLength(3);
    expect(results[0]).toEqual(["Alice", 23, true, 50000]);          // Boolean true, numbers converted
    expect(results[1]).toEqual(["Bob", 30, false, 75000]);           // Boolean false
    expect(results[2]).toEqual(["Charlie", 25, true, 60000]);        // All types properly converted
  } finally {
    await cleanupTempFile(tempPath);
  }
});

/**
 * Test: Schema validation with optional fields
 * Purpose: Tests handling of variable-length rows with optional schema fields
 * Input: CSV with some rows missing trailing fields
 * Expected Output: Schema should handle missing fields gracefully
 * Schema: Tuple with optional trailing elements
 */
test("parseCSV with optional fields in schema", async () => {
  const csvContent = `Alice,23,Boston
Bob,30
Charlie,25,Chicago`;
  
  const schema = z.tuple([z.string(), z.coerce.number()]).rest(z.string());
  const tempPath = await createTempCSV(csvContent);
  
  try {
    const results = await parseCSV(tempPath, schema);
    
    expect(results).toHaveLength(3);
    expect(results[0]).toEqual(["Alice", 23, "Boston"]);    // Full row
    expect(results[1]).toEqual(["Bob", 30]);                // Missing city
    expect(results[2]).toEqual(["Charlie", 25, "Chicago"]); // Full row
  } finally {
    await cleanupTempFile(tempPath);
  }
});

/**
 * Test: Schema validation with custom transformations
 * Purpose: Tests Zod schema with custom data transformations and validation
 * Input: CSV with email addresses and dates that need custom processing
 * Expected Output: Transformed data according to custom schema rules
 * Schema: Custom email validation and date parsing
 */
test("parseCSV with custom transformation schema", async () => {
  const csvContent = `Alice,alice@example.com,2023-01-15
Bob,bob@test.org,2022-12-01
Charlie,charlie@demo.net,2024-03-10`;
  
  const schema = z.tuple([
    z.string().min(1),
    z.string().email(),
    z.string().transform(dateStr => new Date(dateStr))
  ]);
  const tempPath = await createTempCSV(csvContent);
  
  try {
    const results = await parseCSV(tempPath, schema);
    
    expect(results).toHaveLength(3);
    expect(results[0]).toEqual(["Alice", "alice@example.com", new Date("2023-01-15")]);
    expect(results[1]).toEqual(["Bob", "bob@test.org", new Date("2022-12-01")]);
    expect(results[2]).toEqual(["Charlie", "charlie@demo.net", new Date("2024-03-10")]);
  } finally {
    await cleanupTempFile(tempPath);
  }
});

/**
 * Test: Schema validation failure with invalid email
 * Purpose: Tests schema validation failure with descriptive error for invalid email
 * Input: CSV with invalid email format
 * Expected Output: Should throw error indicating email validation failure
 * Schema: Email validation that should catch invalid formats
 */
test("parseCSV schema validation fails on invalid email", async () => {
  const csvContent = `Alice,alice@example.com
Bob,invalid-email-format
Charlie,charlie@demo.net`;
  
  const schema = z.tuple([z.string(), z.string().email()]);
  const tempPath = await createTempCSV(csvContent);
  
  try {
    await expect(parseCSV(tempPath, schema)).rejects.toThrow(/CSV validation failed at row 2/);
    await expect(parseCSV(tempPath, schema)).rejects.toThrow(/invalid-email-format/);
  } finally {
    await cleanupTempFile(tempPath);
  }
});

/**
 * Test: Schema validation with enum values
 * Purpose: Tests schema validation using Zod enum for restricted value sets
 * Input: CSV with status field that should match predefined enum values
 * Expected Output: Array with validated enum values
 * Schema: Enum validation for status field
 */
test("parseCSV with enum value validation", async () => {
  const csvContent = `Alice,active,high
Bob,inactive,medium
Charlie,pending,low`;
  
  const statusEnum = z.enum(["active", "inactive", "pending"]);
  const priorityEnum = z.enum(["low", "medium", "high"]);
  const schema = z.tuple([z.string(), statusEnum, priorityEnum]);
  const tempPath = await createTempCSV(csvContent);
  
  try {
    const results = await parseCSV(tempPath, schema);
    
    expect(results).toHaveLength(3);
    expect(results[0]).toEqual(["Alice", "active", "high"]);
    expect(results[1]).toEqual(["Bob", "inactive", "medium"]);
    expect(results[2]).toEqual(["Charlie", "pending", "low"]);
  } finally {
    await cleanupTempFile(tempPath);
  }
});

/**
 * Test: Schema validation failure with invalid enum value
 * Purpose: Tests error handling when CSV contains values not in enum
 * Input: CSV with status value not in predefined enum
 * Expected Output: Should throw error indicating invalid enum value
 * Schema: Enum validation that should reject invalid values
 */
test("parseCSV schema validation fails on invalid enum value", async () => {
  const csvContent = `Alice,active
Bob,invalid-status
Charlie,pending`;
  
  const schema = z.tuple([z.string(), z.enum(["active", "inactive", "pending"])]);
  const tempPath = await createTempCSV(csvContent);
  
  try {
    await expect(parseCSV(tempPath, schema)).rejects.toThrow(/CSV validation failed at row 2/);
    await expect(parseCSV(tempPath, schema)).rejects.toThrow(/invalid-status/);
  } finally {
    await cleanupTempFile(tempPath);
  }
});

/**
 * Test: Schema validation with array length mismatch
 * Purpose: Tests error handling when CSV row has wrong number of fields for schema
 * Input: CSV with rows that have too few fields for the schema
 * Expected Output: Should throw error indicating array length mismatch
 * Schema: Fixed-length tuple that requires exact field count
 */
test("parseCSV schema validation fails on field count mismatch", async () => {
  const csvContent = `Alice,23,Boston
Bob,30
Charlie,25,Chicago,ExtraField`;
  
  const schema = z.tuple([z.string(), z.coerce.number(), z.string()]); // Expects exactly 3 fields
  const tempPath = await createTempCSV(csvContent);
  
  try {
    // Should fail on row with too few fields
    await expect(parseCSV(tempPath, schema)).rejects.toThrow(/CSV validation failed at row 2/);
  } finally {
    await cleanupTempFile(tempPath);
  }
});

/**
 * Test: Schema validation with empty file
 * Purpose: Tests schema parsing behavior with empty input file
 * Input: Empty CSV file
 * Expected Output: Should return empty array without errors
 * Schema: Any valid schema should handle empty input gracefully
 */
test("parseCSV with schema handles empty file", async () => {
  const csvContent = ``;
  const schema = z.tuple([z.string(), z.coerce.number()]);
  const tempPath = await createTempCSV(csvContent);
  
  try {
    const results = await parseCSV(tempPath, schema);
    expect(results).toEqual([]);
  } finally {
    await cleanupTempFile(tempPath);
  }
});

/**
 * Test: Schema vs non-schema behavior comparison
 * Purpose: Verifies that schema and non-schema parsing return different types
 * Input: Same CSV file parsed with and without schema
 * Expected Output: Schema version should have transformed data, non-schema should have strings
 * Schema: Type coercion schema vs no schema
 */
test("parseCSV schema vs non-schema behavior comparison", async () => {
  const csvContent = `Alice,23
Bob,30`;
  
  const schema = z.tuple([z.string(), z.coerce.number()]);
  const tempPath = await createTempCSV(csvContent);
  
  try {
    const withoutSchema = await parseCSV(tempPath);
    const withSchema = await parseCSV(tempPath, schema);
    
    // Without schema - all strings
    expect(withoutSchema[0]).toEqual(["Alice", "23"]);
    expect(typeof withoutSchema[0][1]).toBe("string");
    
    // With schema - age converted to number
    expect(withSchema[0]).toEqual(["Alice", 23]);
    expect(typeof withSchema[0][1]).toBe("number");
  } finally {
    await cleanupTempFile(tempPath);
  }
});
