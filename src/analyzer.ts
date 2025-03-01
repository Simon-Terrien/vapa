import * as fs from 'fs';
import * as path from 'path';
import * as vscode from 'vscode';
import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage } from 'langchain/schema';

// List of file extensions to analyze
const SUPPORTED_EXTENSIONS = [
    '.js', '.ts', '.jsx', '.tsx', 
    '.py', '.java', '.go', '.rust',
    '.rb', '.php', '.swift', '.c', 
    '.cpp', '.cs', '.html', '.css'
];

// Files and directories to ignore
const IGNORE_PATTERNS = [
    'node_modules', '.git', 'dist', 'build',
    'venv', '__pycache__', '.DS_Store'
];

/**
 * Analyzes an entire repository using LangChain
 */
export async function analyzeRepository(repoPath: string): Promise<string> {
    const maxFiles = vscode.workspace.getConfiguration('langchainRepoAnalyzer').get('maxFilesToAnalyze') as number;
    const apiKey = vscode.workspace.getConfiguration('langchainRepoAnalyzer').get('apiKey') as string;
    
    // Initialize the LLM
    const llm = new ChatOpenAI({
        modelName: "gpt-4o",
        temperature: 0,
        openAIApiKey: apiKey
    });
    
    // Collect files to analyze
    const files = await collectFiles(repoPath, maxFiles);
    
    if (files.length === 0) {
        return "No supported files found in the repository.";
    }
    
    // Build a repository summary
    const summary = generateRepositorySummary(repoPath, files);
    
    // Sample code snippets from various files
    const codeSnippets = await extractCodeSnippets(files);
    
    // Construct the prompt
    const systemPrompt = `You are a code analysis expert. Analyze this repository and provide a detailed report covering:
1. Repository Structure Analysis
2. Code Quality Assessment
3. Architectural Patterns Identified
4. Potential Issues and Recommendations
5. Documentation Quality

Repository Summary:
${summary}

Code Samples from the Repository:
${codeSnippets}`;
    
    // Call the LLM
    const response = await llm.invoke([
        new SystemMessage(systemPrompt),
        new HumanMessage("Analyze this repository and provide a detailed report with the sections mentioned above.")
    ]);
    
    return response.content as string;
}

/**
 * Analyzes a single file using LangChain
 */
export async function analyzeFile(filePath: string, fileContent: string): Promise<string> {
    const apiKey = vscode.workspace.getConfiguration('langchainRepoAnalyzer').get('apiKey') as string;
    
    // Initialize the LLM
    const llm = new ChatOpenAI({
        modelName: "gpt-4o",
        temperature: 0,
        openAIApiKey: apiKey
    });
    
    // Get file extension
    const extension = path.extname(filePath);
    const fileName = path.basename(filePath);
    
    // Construct the prompt
    const systemPrompt = `You are a code analysis expert. Analyze this file (${fileName}) and provide a detailed report covering:
1. Purpose and Functionality
2. Code Quality Assessment
3. Design Patterns Used
4. Potential Issues and Recommendations
5. Complexity Analysis
6. Test Coverage Recommendations

File Content:
\`\`\`${extension}
${fileContent}
\`\`\``;
    
    // Call the LLM
    const response = await llm.invoke([
        new SystemMessage(systemPrompt),
        new HumanMessage("Analyze this file and provide a detailed report with the sections mentioned above.")
    ]);
    
    return response.content as string;
}

/**
 * Generates a dependency graph for the repository
 */
export async function generateDependencyGraph(repoPath: string): Promise<string> {
    const maxFiles = vscode.workspace.getConfiguration('langchainRepoAnalyzer').get('maxFilesToAnalyze') as number;
    const apiKey = vscode.workspace.getConfiguration('langchainRepoAnalyzer').get('apiKey') as string;
    
    // Initialize the LLM
    const llm = new ChatOpenAI({
        modelName: "gpt-4o",
        temperature: 0,
        openAIApiKey: apiKey
    });
    
    // Collect files to analyze
    const files = await collectFiles(repoPath, maxFiles);
    
    if (files.length === 0) {
        return "No supported files found in the repository.";
    }
    
    // Build import/dependency information
    const dependencies = await extractDependencies(files);
    
    // Construct the prompt
    const systemPrompt = `You are a code architecture expert. Generate a dependency graph for this repository using Mermaid diagram syntax.
The graph should show relationships between modules and files.

Repository Structure:
${generateRepositorySummary(repoPath, files)}

Dependencies Information:
${dependencies}`;
    
    // Call the LLM
    const response = await llm.invoke([
        new SystemMessage(systemPrompt),
        new HumanMessage("Generate a dependency graph in Mermaid format. Focus on the main components and their relationships. Include an explanation of the graph above the diagram.")
    ]);
    
    return response.content as string;
}

/**
 * Collects files in the repository that match supported extensions
 */
async function collectFiles(rootPath: string, maxFiles: number): Promise<string[]> {
    const result: string[] = [];
    
    async function traverseDirectory(dirPath: string): Promise<void> {
        if (result.length >= maxFiles) {
            return;
        }
        
        const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
        
        for (const entry of entries) {
            if (result.length >= maxFiles) {
                break;
            }
            
            const fullPath = path.join(dirPath, entry.name);
            
            // Skip ignored directories and files
            if (IGNORE_PATTERNS.some(pattern => entry.name.includes(pattern))) {
                continue;
            }
            
            if (entry.isDirectory()) {
                await traverseDirectory(fullPath);
            } else if (entry.isFile() && SUPPORTED_EXTENSIONS.includes(path.extname(entry.name))) {
                result.push(fullPath);
            }
        }
    }
    
    await traverseDirectory(rootPath);
    return result;
}

/**
 * Generates a summary of the repository structure
 */
function generateRepositorySummary(rootPath: string, files: string[]): string {
    const relativePaths = files.map(file => path.relative(rootPath, file));
    
    // Count files per extension
    const extensionCounts: Record<string, number> = {};
    for (const file of relativePaths) {
        const ext = path.extname(file);
        extensionCounts[ext] = (extensionCounts[ext] || 0) + 1;
    }
    
    // Format extension counts
    const extensionSummary = Object.entries(extensionCounts)
        .map(([ext, count]) => `${ext}: ${count} files`)
        .join('\n');
    
    // Get directory structure (limit depth for clarity)
    const directoryStructure = buildDirectoryTree(relativePaths);
    
    return `
Repository at: ${rootPath}
Total files analyzed: ${files.length}

File types:
${extensionSummary}

Directory structure:
${directoryStructure}
`;
}

/**
 * Builds a simple directory tree representation
 */
function buildDirectoryTree(relativePaths: string[]): string {
    const tree: Record<string, any> = {};
    
    // Build tree structure
    for (const filePath of relativePaths) {
        const parts = filePath.split(path.sep);
        let current = tree;
        
        for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            if (i === parts.length - 1) {
                // This is a file
                current[part] = null;
            } else {
                // This is a directory
                if (!current[part]) {
                    current[part] = {};
                }
                current = current[part];
            }
        }
    }
    
    // Convert tree to string
    function stringifyTree(node: Record<string, any>, prefix = ''): string {
        let result = '';
        const entries = Object.entries(node);
        
        for (let i = 0; i < entries.length; i++) {
            const [key, value] = entries[i];
            const isLast = i === entries.length - 1;
            const line = `${prefix}${isLast ? '└── ' : '├── '}${key}`;
            result += line + '\n';
            
            if (value !== null) {
                const newPrefix = prefix + (isLast ? '    ' : '│   ');
                result += stringifyTree(value, newPrefix);
            }
        }
        
        return result;
    }
    
    return stringifyTree(tree);
}

/**
 * Extracts sample code snippets from files
 */
async function extractCodeSnippets(files: string[]): Promise<string> {
    let snippets = '';
    
    // Sample up to 5 files for snippets
    const sampleFiles = files.length <= 5 ? files : files.slice(0, 5);
    
    for (const file of sampleFiles) {
        try {
            const content = await fs.promises.readFile(file, 'utf-8');
            const extension = path.extname(file);
            const fileName = path.basename(file);
            
            // Take first 50 lines or less
            const lines = content.split('\n').slice(0, 50);
            
            snippets += `\nFile: ${fileName}\n`;
            snippets += '```' + extension.replace('.', '') + '\n';
            snippets += lines.join('\n');
            snippets += '\n```\n';
        } catch (error) {
            console.error(`Error reading file ${file}:`, error);
        }
    }
    
    return snippets;
}

/**
 * Extracts dependency information from files
 */
async function extractDependencies(files: string[]): Promise<string> {
    let dependencyInfo = '';
    
    for (const file of files) {
        try {
            const content = await fs.promises.readFile(file, 'utf-8');
            const fileName = path.basename(file);
            const extension = path.extname(file);
            
            // Extract import statements based on file type
            let imports: string[] = [];
            
            if (['.js', '.ts', '.jsx', '.tsx'].includes(extension)) {
                // JavaScript/TypeScript import detection
                const importRegex = /import\s+(?:{[^}]*}|\*\s+as\s+\w+|\w+)\s+from\s+['"]([^'"]+)['"]/g;
                let match;
                while ((match = importRegex.exec(content)) !== null) {
                    imports.push(match[1]);
                }
            } else if (extension === '.py') {
                // Python import detection
                const importRegex = /(?:from\s+(\S+)\s+import|import\s+(\S+))/g;
                let match;
                while ((match = importRegex.exec(content)) !== null) {
                    imports.push(match[1] || match[2]);
                }
            }
            // Add more language-specific import detection as needed
            
            if (imports.length > 0) {
                dependencyInfo += `File: ${fileName}\nImports:\n`;
                imports.forEach(imp => {
                    dependencyInfo += `- ${imp}\n`;
                });
                dependencyInfo += '\n';
            }
        } catch (error) {
            console.error(`Error analyzing dependencies in ${file}:`, error);
        }
    }
    
    return dependencyInfo;
}