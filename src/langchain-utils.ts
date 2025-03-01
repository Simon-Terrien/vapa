import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from 'langchain/schema';
import { StructuredOutputParser } from 'langchain/output_parsers';
import { ChatPromptTemplate } from 'langchain/prompts';

/**
 * Analyzes code complexity and provides a complexity score
 */
export async function analyzeCodeComplexity(code: string, language: string, apiKey: string): Promise<{
    complexityScore: number;
    analysis: string;
}> {
    const llm = new ChatOpenAI({
        modelName: "gpt-4o",
        temperature: 0,
        openAIApiKey: apiKey
    });
    
    const parser = StructuredOutputParser.fromNamesAndDescriptions({
        complexityScore: "A numeric score from 1-10 indicating the code complexity (1 being simplest, 10 being most complex)",
        analysis: "A detailed analysis of the code complexity including cyclomatic complexity, nesting depth, and function length considerations"
    });
    
    const formatInstructions = parser.getFormatInstructions();
    
    const prompt = ChatPromptTemplate.fromMessages([
        ["system", `You are a code complexity analyzer. Analyze the provided code and return a complexity score and detailed analysis.
        
${formatInstructions}`],
        ["human", `Analyze the complexity of this ${language} code:
        
\`\`\`${language}
${code}
\`\`\``]
    ]);
    
    const chain = prompt.pipe(llm).pipe(parser);
    
    const result = await chain.invoke({});
    return result;
}

/**
 * Generates test cases for a given function
 */
export async function generateTestCases(code: string, language: string, apiKey: string): Promise<string> {
    const llm = new ChatOpenAI({
        modelName: "gpt-4o",
        temperature: 0.2,
        openAIApiKey: apiKey
    });
    
    const prompt = `You are a test engineer specializing in ${language}. Generate comprehensive test cases for the following code:
    
\`\`\`${language}
${code}
\`\`\`

Include tests for:
1. Normal usage scenarios
2. Edge cases
3. Error handling
4. Performance considerations

Provide the test code in the appropriate testing framework for ${language}.`;
    
    const response = await llm.invoke([
        new SystemMessage(prompt),
        new HumanMessage("Generate test cases for this code.")
    ]);
    
    return response.content as string;
}

/**
 * Suggests code improvements
 */
export async function suggestCodeImprovements(code: string, language: string, apiKey: string): Promise<string> {
    const llm = new ChatOpenAI({
        modelName: "gpt-4o",
        temperature: 0.1,
        openAIApiKey: apiKey
    });
    
    const prompt = `You are a senior software engineer with expertise in ${language}. Review the following code and suggest improvements:
    
\`\`\`${language}
${code}
\`\`\`

Focus on:
1. Code readability and maintainability
2. Performance optimizations
3. Best practices for ${language}
4. Potential bugs or edge cases
5. Security considerations

For each suggestion, explain why it's an improvement and provide a code example of the improved version.`;
    
    const response = await llm.invoke([
        new SystemMessage(prompt),
        new HumanMessage("Suggest improvements for this code.")
    ]);
    
    return response.content as string;
}

/**
 * Documents code with comments
 */
export async function documentCode(code: string, language: string, apiKey: string): Promise<string> {
    const llm = new ChatOpenAI({
        modelName: "gpt-4o",
        temperature: 0,
        openAIApiKey: apiKey
    });
    
    const prompt = `You are a documentation expert for ${language}. Add comprehensive comments and documentation to the following code:
    
\`\`\`${language}
${code}
\`\`\`

Follow these documentation guidelines:
1. Add a file header comment explaining the purpose of the code
2. Document each function/method with parameters, return values, and examples
3. Add inline comments for complex logic
4. Use the standard documentation format for ${language} (e.g., JSDoc for JavaScript)
5. Don't over-document obvious code

Return the fully documented version of the code.`;
    
    const response = await llm.invoke([
        new SystemMessage(prompt),
        new HumanMessage("Document this code with appropriate comments.")
    ]);
    
    return response.content as string;
}