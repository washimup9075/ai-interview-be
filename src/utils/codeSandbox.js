import vm from "vm";

/**
 * Safely executes JavaScript code against test cases in an isolated VM context.
 * Blocks dangerous globals (fs, process, require, fetch, etc.) and enforces strict execution timeouts.
 */
export function executeJavaScriptSandbox(code, testCases = []) {
  const results = [];

  for (const tc of testCases) {
    const sandbox = {
      console: {
        log: (...args) => args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')
      },
      output: null,
      error: null
    };

    const context = vm.createContext(sandbox);

    // Construct execution wrapper
    const scriptText = `
      try {
        ${code}
        
        // Execute main function or evaluate test input
        if (typeof main === 'function') {
          output = main(${tc.input});
        } else {
          // Attempt to call the last defined function or evaluate test input
          const fnKeys = Object.keys(this).filter(k => typeof this[k] === 'function' && k !== 'main');
          if (fnKeys.length > 0) {
            output = this[fnKeys[fnKeys.length - 1]](${tc.input});
          } else {
            output = eval("(${tc.input})");
          }
        }
      } catch (err) {
        error = err.message;
      }
    `;

    try {
      const script = new vm.Script(scriptText);
      script.runInContext(context, { timeout: 2000 }); // 2 second timeout limit

      const actualOutput = sandbox.error
        ? `Error: ${sandbox.error}`
        : typeof sandbox.output === "object"
        ? JSON.stringify(sandbox.output)
        : String(sandbox.output ?? "");

      const expectedStr = String(tc.expectedOutput ?? "").trim();
      const actualStr = actualOutput.trim();

      const passed = !sandbox.error && (actualStr === expectedStr || actualStr.replace(/\s+/g, '') === expectedStr.replace(/\s+/g, ''));

      results.push({
        input: tc.input,
        expected: expectedStr,
        actual: actualStr,
        passed,
        explanation: tc.explanation || ""
      });
    } catch (err) {
      results.push({
        input: tc.input,
        expected: String(tc.expectedOutput ?? ""),
        actual: `Execution Timeout or Error: ${err.message}`,
        passed: false,
        explanation: "Code execution timed out or failed safety checks."
      });
    }
  }

  return results;
}
