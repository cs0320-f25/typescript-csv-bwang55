# Sprint 1: TypeScript CSV

### Task C: Proposing Enhancement

- #### Step 1: Brainstorm on your own.
- Here're my initial thoughts on the limitations of the current CSV parser implementation, categorized by functionality and extensibility:
1. (Functionality)The current version simply divides the input strings by commas. If the data form is consecutive words, like sentences or HTTP links(which might contain commas), it will mistakenly take these as separate fields and split in the middle.
2. (Functionality)If the schema in the CSV is different from what the user defined, like there are 5 rows but the user only defined 4, the parser will not raise any error, and it will just take it as it is.
3. (Extensibility)The parser takes file directories as input, and it does not handle FileNotFound gracefully. If the file does not exist, it will throw an error.
4. (Extensibility)All the input was read as strings, which will omit the information of their original type, and thus it cannot check the type unmatched in the first place. For example, it would not see the difference between “31” and “thirty-one”.
### Step 2: Use an LLM to Help Expand Perspective

#### (Self, Functionality) Complex Data Handling
**User Story:**  
As a user of the CSV parser, I am able to pass in complex data like long strings, URLs without format errors, so that I can use the parser in real-world complex scenarios.

**Acceptance Criteria:**
- The parser would take care of special cases like commas within quotes, multilines in single fields, and more.  
- The parser will handle special cases gracefully, either quit with an error message or replace it with a default value, not just take in everything.  
- The parser would identify reserved symbols like control flow.  

---

#### (Self, Functionality) Malformed Data Handling
**User Story:**  
As a user of the parser, I am able to pass in malformed data to the parser without leaving unchecked bugs, so I don’t worry about whether I made a mistake when collecting the data, the parser output is incomplete, or the schema was broken.

**Acceptance Criteria:**
- The parser would automatically detect mismatches in the input form (e.g., 5th column in a 4-entry schema).  
- The parser will explicitly omit or replace the malformed data, not just parse it.  
- The user will be notified or warned when the parser encounters “bad” data.  

---

#### (Both, Extensibility) Multiple Input Sources
**User Story:**  
As a user, I can have multiple options to pass in my CSV, not just use the file directory, so that I can incorporate the parser into different places.

**Acceptance Criteria:**
- The parser would support multiple input forms like file directories, buffers, stdin, or network channels.  
- The parser would automatically check the availability of the input data.  
- If the input CSV does not exist or is not compatible with the parser, handle this case gracefully instead of throwing an error.  

---

#### (Both, Extensibility) Multiple Data Types
**User Story:**  
As a user, I can have multiple data types in the same CSV file, and the parser could detect them for me, so that I don’t need to handle the data type elsewhere.

**Acceptance Criteria:**
- The parser would automatically infer or detect the data type from CSV entries.  
- The parser would detect if the data in the CSV matches the type of the column.  
- The user will be notified if there is a data mismatch.  

- #### Step 3: use an LLM to help expand your perspective.
- My initial brainstorm are in the previous step. I prompted the claude4 sonnet with the sample prompt, and two variation with extra text describing the functionality and extensibility aspects. The responses share the same half of the content, but differ in the later half with different aspects. I resonate with LLM's idea that we should have multi-form of input, not just check the existence of the file. However, LLM gives many low-level details, which we do not cares about in this stage.

### Design Choices

### 1340 Supplement

I would like to demonstrate a **linked list implementation** in TypeScript.  
My idea is to create a JSON file with recursively enclosed nodes, where each node contains a value and a pointer to the next node.  

I will use Zod to validate the structure of the linked list, with a recursive definition in Zod.  
I will also implement a function to traverse the linked list and print the values of each node.  

Here’s the demo code:

```ts
import { z, ZodType } from "zod";

function createLinkedListSchema<T>(valueSchema: ZodType<T>) {
  return z.lazy(() =>
    z.object({
      value: valueSchema,
      next: z.union([z.null(), createLinkedListSchema(valueSchema)]),
    })
  );
}

// Demo function
function validateLinkedList<T>(data: any, valueSchema: ZodType<T>) {
  const schema = createLinkedListSchema(valueSchema);
  return schema.parse(data);
}

const stringData = {
  value: "first",
  next: {
    value: "second",
    next: {
      value: "third",
      next: null,
    },
  },
};
```

- #### 1. Correctness
* The parser should correctly handle all specified edge cases and produce the expected output.(like multiline, commas in quotes)
* The parser should explicitly omit or replace malformed data, not just parse it.
* The parser should detect if the data in the CSV matches the type of the column.
* the parser would handle all the control flow in CSV standard
- #### 2. Random, On-Demand Generation
*  Random Data would be a good source that contains uncommon pattern, which will not be covered in the normal "human" cases. Also, random data would be easier for testing, since the random data do not contain information so the pattern it self would be more obvious.
*  On-Demand Generation could be long enough to cover all the edge cases, and explore certain error that only appers after many iterations.
- #### 3. Overall experience, Bugs encountered and resolved
- The sprint would be a new form for me, since I usually write test after I finished my major coding part. Also, I would not pay that much attention to the feeling when I code. Moreover, I did not expect that LLM could help me more than consolidate the code. In sprint, I cooperate with LLM to brainstorm and design the code, which is a new experience for me.
#### Errors/Bugs: 
- I do encountered some bugs when I write the test in the first place. It tooks me a while to exaime some test cases that should not pass but passed. 
#### Tests: 
- I wrote tests for all the new features I added. For example, I wrote 3 tests cases mentioned in the design document. I also wrote some extra test cases to conform with the CSV standard, with help from LLM.
#### How To…
- I manually checked the output of the parser and the test, then I prompted the LLM for debugging help. Then I modified the prompt until I got a satisfactory answer.
- I would have a scratch of what I expected before I prompt the LLM, so the LLM answer would not distract me. I would also try to be specific when I prompt the LLM, and iterate my prompt for a better result.
- with the preset goal, I could now which part of my code should work, and which part should not(at current stage). I would not let LLM do the things that over the curent stage.
#### Team members and contributions (include cs logins):

#### Collaborators (cslogins of anyone you worked with on this project and/or generative AI):
- Github Copilot (Claude Sonnet 4, Agent mode, student access)
- Claude Sonnet 4 (Extended Thinking, website)
#### Total estimated time it took to complete project: 
- Around 10 hours, include reading all the documents, learning typescript, writing code, writing test, and writing readme. I have to catch up with all the stuff before I joined the class so it took me longer than expected.
#### Link to GitHub Repo:  
- https://github.com/cs0320-f25/typescript-csv-bwang55