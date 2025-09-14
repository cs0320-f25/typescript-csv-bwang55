/**
 * Generated with assistance from Claude Sonnet 4 (LLM), 2025-09-14.
 * Prompt: See README.md
 */

import * as fs from "fs";
import * as readline from "readline";
import { ZodType } from "zod";

/**
 * Parses a CSV file and returns the contents as a 2D array of strings.
 * This is the original behavior when no schema is provided.
 * 
 * @param path The path to the file being loaded.
 * @returns a promise to produce a 2D array of cell values
 */
export async function parseCSV(path: string): Promise<string[][]>;

/**
 * Parses a CSV file and validates/transforms each row using the provided Zod schema.
 * 
 * @param path The path to the file being loaded.
 * @param schema The Zod schema to validate and transform each row
 * @returns a promise to produce an array of validated/transformed rows
 */
export async function parseCSV<T>(path: string, schema: ZodType<T>): Promise<T[]>;

/**
 * Implementation of the parseCSV function with optional Zod schema support.
 * 
 * File I/O in TypeScript is "asynchronous", meaning that we can't just
 * read the file and return its contents. You'll learn more about this
 * in class. For now, just leave the "async" and "await" where they are.
 * You shouldn't need to alter them.
 */
export async function parseCSV<T>(
  path: string, 
  schema?: ZodType<T>
): Promise<string[][] | T[]> {
  // This initial block of code reads from a file in Node.js. The "rl"
  // value can be iterated over in a "for" loop.
  const fileStream = fs.createReadStream(path);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity, // handle different line endings
  });

  // Create an empty array to hold the results
  let result: string[][] | T[] = [];
  let rowNumber = 0;

  // We add the "await" here because file I/O is asynchronous.
  // We need to force TypeScript to _wait_ for a row before moving on.
  // More on this in class soon!
  for await (const line of rl) {
    rowNumber++;
    const values = line.split(",").map((v) => v.trim());
    
    if (schema) {
      // Validate and transform using the provided schema
      try {
        const parsed = schema.parse(values);
        (result as T[]).push(parsed);
      } catch (error) {
        // Communicate validation failure back to caller
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new Error(
          `CSV validation failed at row ${rowNumber}: ${JSON.stringify(values)}. ${errorMessage}`
        );
      }
    } else {
      // Fall back to original behavior
      (result as string[][]).push(values);
    }
  }
  
  return result;
}