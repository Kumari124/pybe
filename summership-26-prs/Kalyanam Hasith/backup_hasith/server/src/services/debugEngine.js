const { exec } = require('child_process');
const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const Groq = require('groq-sdk');

// Bypass strict SSL for local development environments with custom certificates
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

/**
 * Runs Python code safely in a child process with a timeout.
 * Returns stdout, stderr, or a timeout/execution error.
 */
async function runPythonCode(code, setupCode = '') {
  const tempDir = path.join(__dirname, '..', 'data');
  const tempFileName = `temp_${crypto.randomUUID().slice(0, 8)}.py`;
  const tempFilePath = path.join(tempDir, tempFileName);

  const fullCode = `${setupCode}\n\n${code}`;

  try {
    // Ensure the temp directory exists and write the code
    await fs.mkdir(tempDir, { recursive: true });
    await fs.writeFile(tempFilePath, fullCode, 'utf8');

    // Run the Python script with a 2-second timeout
    const result = await new Promise((resolve) => {
      exec(`python "${tempFilePath}"`, { timeout: 2000 }, (error, stdout, stderr) => {
        if (error) {
          if (error.killed) {
            resolve({
              success: false,
              errorType: 'TimeoutError',
              rawError: 'Execution timed out (possible infinite loop)',
              stdout: stdout.trim()
            });
          } else {
            resolve({
              success: false,
              errorType: 'RuntimeError',
              rawError: stderr || error.message,
              stdout: stdout.trim()
            });
          }
        } else {
          resolve({
            success: true,
            stdout: stdout.trim()
          });
        }
      });
    });

    return result;
  } catch (err) {
    return {
      success: false,
      errorType: 'SystemError',
      rawError: err.message,
      stdout: ''
    };
  } finally {
    // Cleanup the temp file
    try {
      await fs.unlink(tempFilePath);
    } catch {
      // Ignore if file doesn't exist
    }
  }
}

/**
 * Translates standard Python error tracebacks into friendly plain English.
 */
function explainError(rawError) {
  if (!rawError) return '';

  if (rawError.includes('Execution timed out')) {
    return 'Your code ran for too long and was stopped. This usually happens when a loop runs forever because its stopping condition is never reached (an infinite loop). Check if you are modifying the loop list or if the loop variable is never updating.';
  }

  if (rawError.includes('SyntaxError')) {
    if (rawError.includes('invalid syntax')) {
      return 'There is a syntax error in your code. Double check if you forgot a colon (`:`) at the end of a `for` loop header, `if` statement, or `else` statement. Also check for open parentheses or quotation marks.';
    }
    return 'Python could not parse your code. Check for typos, missing characters like colons `:`, brackets, or mismatched quote marks.';
  }

  if (rawError.includes('IndentationError')) {
    return 'You have an indentation problem. Python requires lines of code inside a loop or conditional block to be indented (press Tab or add spaces). Check if the code block under your loop or `if` statement is properly aligned.';
  }

  if (rawError.includes('NameError')) {
    const match = rawError.match(/name '([^']+)' is not defined/);
    const varName = match ? match[1] : 'a variable';
    return `You tried to use ${varName} before creating it. Check if you misspelled the variable name, or if you forgot to initialize it (like ${varName} = 0) at the start of your code.`;
  }

  if (rawError.includes('IndexError')) {
    return 'You tried to access an item in a list using an index that is out of range. For example, asking for the 5th item when the list only contains 3 items. Remember that list indexing in Python starts at 0, not 1.';
  }

  if (rawError.includes('TypeError')) {
    if (rawError.includes('object of type') && rawError.includes('has no len')) {
      return 'You tried to get the length (`len()`) of a single value (like an integer or boolean) which does not have a length. Make sure you pass a list or dictionary to `len()`, not a single number.';
    }
    if (rawError.includes('can only concatenate str') || rawError.includes('unsupported operand type')) {
      return 'You tried to perform arithmetic or combine values of incompatible types (such as adding text/string to a number). You may need to convert types, e.g., converting a number to a string using `str(value)`.';
    }
    return 'You are performing an operation on incompatible data types. Check what values you are passing to functions or operators.';
  }

  if (rawError.includes('KeyError')) {
    const match = rawError.match(/KeyError: '([^']+)'/);
    const keyName = match ? match[1] : 'a key';
    return `You tried to look up the key '${keyName}' in a dictionary, but that key does not exist. Check if the key is spelled correctly or check if the key is missing in the dictionary.`;
  }

  return 'An error occurred during execution. Read the traceback below to identify which line failed, and check your syntax or values.';
}

/**
 * Translates Python code to plain English pseudocode using Groq Llama-3.
 */
async function translateCodeToEnglish(code) {
  if (!code) return 'No code provided.';
  
  if (!groq) {
    return 'Error: Groq API key is not configured. Please add it to your .env file.';
  }

  const prompt = `You are a strict code translator. Your ONLY job is to translate the provided Python code into highly readable, plain English pseudocode.

RULES:
1. 1-TO-1 LINE CORRESPONDENCE: Translate the Python code strictly line-by-line from top to bottom. NEVER repeat, reorder, or duplicate any lines or definitions. Every single line of Python must produce exactly one corresponding line of English on a single line (do not split single lines into multi-line bullet points).
2. BI-DIRECTIONAL PRECISION: Your translation must be structurally precise enough that ANY LLM could convert it back into the EXACT same Python code without guessing.
3. PRESERVE IDENTIFIERS: Always use the exact variable names, function names, parameter names, and string literals from the code (e.g. if the variable is named "double_prce", use "double_prce", do not change it to "double price" or "double_price").
4. PRESERVE BUGS AND TYPOS (CRITICAL): The provided Python code contains logic bugs, missing 'else' blocks, and incorrect indentation. DO NOT fix them! If a line is incorrectly indented inside an 'if' block in Python, it MUST be inside the 'If' block in your translation, even if it is logically wrong! Translate the exact structure literally.
5. EXPLICIT BLOCK CLOSERS: To eliminate indentation ambiguity across different LLMs without using awkward prefixes like "Outside the block", use standard pseudocode block closers ("End if", "End for", "End while", "End function") on a new line aligned with the start of the block whenever an indented block terminates. NEVER prefix lines with "Outside the block" or "Outside the loop".
6. DETERMINISTIC SLICING & INDEXING: To ensure LLMs reconstruct the exact slice syntax without adding default steps (like :1), provide explicit instructions in English:
- For words[a:b], write: "a slice of list words from index a to b (do not specify the step size)".
- For words[a:b:c], write: "a slice of list words from index a to b with step c".
- For words[::-1], write: "a slice of list words with step -1 (omitting start and stop)".
- For words[:], write: "a slice of list words (omitting start and stop)".
7. CLEAN FORMATTING & SINGLE-LINE STRUCTURES: Keep dictionary and list definitions on the same single line as they appear in Python (e.g. write: Set dictionary scores to {"Alice": 95, "Bob": 100, "Charlie": 100}). Do NOT expand single lines into multi-line bullet points. Maintain exact indentation for loops and conditionals.
8. DETERMINISTIC RANGE: Write ranges in natural English that explicitly tells LLMs what Python range to use. For example: "Loop variable i through the Python range from 1 to 11 (exclusive):". This reads like natural English but gives the LLMs the exact arguments (1, 11) to prevent off-by-one errors.
9. DETERMINISTIC TERNARY OPERATORS: Write ternary logic in natural English, but explicitly ask for an inline expression. For example: "Print the result of the inline conditional expression: i if condition is true, otherwise 'Special'". This is English, but mathematically guarantees all LLMs will use a single-line ternary instead of a multi-line if/else block.
10. EXPLICIT VARIABLE ASSIGNMENT: If a Python line assigns a value to a variable, you MUST explicitly state the assignment. For 'discount = calculate_discount(price)', write "Set variable discount to the result of calling calculate_discount with price". NEVER simplify or merge assignment lines with return statements.
11. DETERMINISTIC TUPLE UNPACKING: If a line unpacks multiple variables from a function or tuple (e.g., 'even, odd = count(nums)'), explicitly instruct the AI to unpack. Write "Unpack the returned tuple from calling count with nums into variables even and odd".
12. EXPLICIT KEYWORD ARGUMENTS: If a Python function call uses keyword arguments (e.g. 'func(a=1, b=2)'), you MUST explicitly state the argument names. Write "Call func with parameter a set to 1 and parameter b set to 2". NEVER omit the keyword names or simplify them to positional arguments.
13. DO NOT output any markdown formatting blocks, introductory text, or examples. Output ONLY the raw translation.

Code to translate:
\`\`\`python
${code}
\`\`\`

Translation (strictly no markdown blocks):`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: 'system', content: prompt }],
      model: 'llama-3.1-8b-instant',
      temperature: 0.2,
      max_tokens: 500,
    });
    
    return completion.choices[0]?.message?.content?.trim() || 'Could not translate code.';
  } catch (err) {
    console.error('Groq Translation Error:', err);
    return 'Failed to connect to the translation service.';
  }
}

/**
 * Chats with a real LLM using Groq API.
 */
async function chatWithAI(challenge, userCode, message, history, mode = 'intermediate') {
  if (!message) return { message: 'How can I help you debug this?', solved: false };
  
  if (!groq) {
    return { message: 'Error: Groq API key is not configured. Please add it to your .env file.', solved: false };
  }

  let systemPrompt = '';

  if (mode === 'intermediate') {
    systemPrompt = `You are a Junior Developer who has written some buggy Python code. The user is your Senior Developer.
Challenge Title: ${challenge.title}
Goal Context: ${challenge.context}
Expected Logic: ${challenge.expectedLogic}

The buggy code you wrote is:
\`\`\`python
${userCode}
\`\`\`

Instructions for you:
1. Roleplay as the Junior Developer. You are confused about why the code isn't working and are asking the Senior (the user) for conceptual help.
2. The user will try to explain what you did wrong conceptually.
3. If the user's explanation correctly identifies the logic flaw (based on the Expected Logic), you must experience an "Aha!" moment, thank them, and APPEND the exact string "[SOLVED]" at the very end of your response.
4. If the user's explanation is wrong, incomplete, or if they just give you the raw code without explaining the concept, ask them to clarify the concept. Do NOT output [SOLVED].
5. Keep your responses relatively short (1-3 paragraphs).`;
  } else {
    systemPrompt = `You are an expert, helpful AI programming assistant.
Challenge Title: ${challenge.title}
Goal Context: ${challenge.context}

The user is working on the following code:
\`\`\`python
${userCode}
\`\`\`

Instructions for you:
1. Act as a supportive, general-purpose AI assistant. 
2. Answer the user's questions clearly and accurately.
3. Do not roleplay as a junior developer.
4. Provide hints or code snippets if asked.
5. Keep your responses relatively short (1-3 paragraphs).`;
  }

  // Map history to Groq chat format
  const mappedHistory = history.map(msg => ({
    role: msg.role === 'ai' ? 'assistant' : 'user',
    content: msg.content
  }));

  // Construct the full messages array
  const messages = [
    { role: 'system', content: systemPrompt },
    ...mappedHistory
  ];

  try {
    const chatCompletion = await groq.chat.completions.create({
      messages: messages,
      model: 'llama-3.1-8b-instant',
      temperature: 0.7,
      max_tokens: 500,
    });
    
    let aiResponse = chatCompletion.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.";
    let solved = false;
    
    if (aiResponse.includes('[SOLVED]')) {
      solved = true;
      aiResponse = aiResponse.replace(/\[SOLVED\]/g, '').trim();
    }
    
    return { message: aiResponse, solved };
  } catch (err) {
    console.error('Groq API Error:', err);
    return { message: "I'm sorry, I encountered an error connecting to my brain. Please try again.", solved: false };
  }
}

module.exports = {
  runPythonCode,
  explainError,
  translateCodeToEnglish,
  chatWithAI
};
