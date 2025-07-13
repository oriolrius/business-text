/* eslint-disable no-console */

/**
 * Create Execution Code with error handling and async support
 * @param args
 */
export const createExecutionCode = (...args: string[]) => {
  try {
    const code = args[args.length - 1];
    const parameters = args.slice(0, -1);
    
    // Check if code contains await keyword
    if (code.includes('await')) {
      // Create async function for await support
      return new Function(...parameters, `return (async () => { ${code} })()`);
    } else {
      // Create regular function
      return new Function(...args);
    }
  } catch (error) {
    console.error('Code Error', error);
    console.log(args[args.length - 1]);

    return () => {};
  }
};
