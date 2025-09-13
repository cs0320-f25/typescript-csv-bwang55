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

test("parseCSV yields arrays", async () => {
  const results = await parseCSV(PEOPLE_CSV_PATH)
  
  expect(results).toHaveLength(5);
  expect(results[0]).toEqual(["name", "age"]);
  expect(results[1]).toEqual(["Alice", "23"]);
  expect(results[2]).toEqual(["Bob", "thirty"]); // why does this work? :(
  expect(results[3]).toEqual(["Charlie", "25"]);
  expect(results[4]).toEqual(["Nim", "22"]);
});

test("parseCSV yields only arrays", async () => {
  const results = await parseCSV(PEOPLE_CSV_PATH)
  for(const row of results) {
    expect(Array.isArray(row)).toBe(true);
  }
});

// Edge case tests - these may fail with current parser implementation

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
    expect(results[1]).toEqual(["Alice", "23", ""]);
    expect(results[2]).toEqual(["Bob", "", "Boston"]);
    expect(results[3]).toEqual(["", "25", "Chicago"]);
  } finally {
    await cleanupTempFile(tempPath);
  }
});

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
    expect(results[1]).toEqual(["Smith, John", "Software Engineer", "30"]);
    expect(results[2]).toEqual(["Johnson, Jane", "Data Scientist, Senior", "28"]);
    expect(results[3]).toEqual(["Alice", "Designer", "25"]);
  } finally {
    await cleanupTempFile(tempPath);
  }
});

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
    expect(results[1]).toEqual(["Alice", 'She said "Hello world"', "23"]);
    expect(results[2]).toEqual(["Bob", 'The "quick" brown fox', "30"]);
    expect(results[3]).toEqual(["Charlie", '"Quoted at start', "25"]);
    expect(results[4]).toEqual(["Diana", 'Quoted at end"', "28"]);
  } finally {
    await cleanupTempFile(tempPath);
  }
});

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
    expect(results[1]).toEqual(["Smith, John", '123 Main St, Apt "A"', 'Lives in a "cozy" place']);
    expect(results[2]).toEqual(["", "", "Empty name and address"]);
    expect(results[3]).toEqual(["Alice", "456 Oak Dr", "Simple entry"]);
  } finally {
    await cleanupTempFile(tempPath);
  }
});

// Additional CSV standard conformity tests

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
    expect(results[1]).toEqual(["Alice", "Software\nEngineer", "Active"]);
    expect(results[2]).toEqual(["Bob", "Data Scientist\nwith PhD", "Active"]);
    expect(results[3]).toEqual(["Charlie", "Designer", "On\nLeave"]);
  } finally {
    await cleanupTempFile(tempPath);
  }
});

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
    expect(results[1]).toEqual(["quoted field", "unquoted field", "another quoted"]);
    expect(results[2]).toEqual(["unquoted", "mixed, with comma", "unquoted"]);
    expect(results[3]).toEqual(["", "only quotes", "last"]);
  } finally {
    await cleanupTempFile(tempPath);
  }
});

test("parseCSV handles trailing commas and empty last fields", async () => {
  const csvContent = `col1,col2,col3,
value1,value2,value3,
value4,value5,,
value6,,,`;
  
  const tempPath = await createTempCSV(csvContent);
  try {
    const results = await parseCSV(tempPath);
    
    expect(results).toHaveLength(4);
    expect(results[0]).toEqual(["col1", "col2", "col3", ""]);
    expect(results[1]).toEqual(["value1", "value2", "value3", ""]);
    expect(results[2]).toEqual(["value4", "value5", "", ""]);
    expect(results[3]).toEqual(["value6", "", "", ""]);
  } finally {
    await cleanupTempFile(tempPath);
  }
});

test("parseCSV handles whitespace around fields", async () => {
  const csvContent = `name, age , city
 Alice , 23 , Boston 
Bob,  30  ,  New York  
 Charlie ,25, Chicago`;
  
  const tempPath = await createTempCSV(csvContent);
  try {
    const results = await parseCSV(tempPath);
    
    expect(results).toHaveLength(4);
    expect(results[0]).toEqual(["name", "age", "city"]);
    expect(results[1]).toEqual(["Alice", "23", "Boston"]);
    expect(results[2]).toEqual(["Bob", "30", "New York"]);
    expect(results[3]).toEqual(["Charlie", "25", "Chicago"]);
  } finally {
    await cleanupTempFile(tempPath);
  }
});

test("parseCSV handles inconsistent column counts", async () => {
  const csvContent = `name,age,city
Alice,23,Boston,ExtraField
Bob,30
Charlie,25,Chicago`;
  
  const tempPath = await createTempCSV(csvContent);
  try {
    const results = await parseCSV(tempPath);
    
    expect(results).toHaveLength(4);
    expect(results[0]).toEqual(["name", "age", "city"]);
    expect(results[1]).toEqual(["Alice", "23", "Boston", "ExtraField"]);
    expect(results[2]).toEqual(["Bob", "30"]);
    expect(results[3]).toEqual(["Charlie", "25", "Chicago"]);
  } finally {
    await cleanupTempFile(tempPath);
  }
});

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
    expect(results[1]).toEqual(["Alice", "Special: !@#$%^&*()_+-=[]{}|;':\",./<>?", "Normal"]);
    expect(results[2]).toEqual(["Bob", "Unicode: αβγδε 中文 🚀🎉", "Test"]);
    expect(results[3]).toEqual(["Charlie", "Tab:	Space: ", "End"]);
  } finally {
    await cleanupTempFile(tempPath);
  }
});

test("parseCSV handles empty file", async () => {
  const csvContent = ``;
  
  const tempPath = await createTempCSV(csvContent);
  try {
    const results = await parseCSV(tempPath);
    
    expect(results).toEqual([]);
  } finally {
    await cleanupTempFile(tempPath);
  }
});

test("parseCSV handles single column CSV", async () => {
  const csvContent = `name
Alice
Bob
Charlie`;
  
  const tempPath = await createTempCSV(csvContent);
  try {
    const results = await parseCSV(tempPath);
    
    expect(results).toHaveLength(4);
    expect(results[0]).toEqual(["name"]);
    expect(results[1]).toEqual(["Alice"]);
    expect(results[2]).toEqual(["Bob"]);
    expect(results[3]).toEqual(["Charlie"]);
  } finally {
    await cleanupTempFile(tempPath);
  }
});

test("parseCSV handles CSV with only headers", async () => {
  const csvContent = `name,age,city`;
  
  const tempPath = await createTempCSV(csvContent);
  try {
    const results = await parseCSV(tempPath);
    
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual(["name", "age", "city"]);
  } finally {
    await cleanupTempFile(tempPath);
  }
});
