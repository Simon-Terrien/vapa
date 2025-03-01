import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { URI } from 'vscode-uri';
import { analyzeRepository, analyzeFile, generateDependencyGraph } from './analyzer';
import { VisualizationViewProvider } from './webview-provider';
import { analyzeCodeComplexity, generateTestCases, suggestCodeImprovements, documentCode } from './langchain-utils';

export function activate(context: vscode.ExtensionContext) {
	// Create and register the visualization webview provider
	const visualizationProvider = new VisualizationViewProvider(context.extensionUri);
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider(
			VisualizationViewProvider.viewType,
			visualizationProvider
		)
	);
	
	// Register command to analyze the entire repository
	let analyzeRepoCommand = vscode.commands.registerCommand('langchain-repo-analyzer.analyzeRepo', async () => {
		const workspaceFolders = vscode.workspace.workspaceFolders;
		
		if (!workspaceFolders) {
			vscode.window.showErrorMessage('No workspace folder is open');
			return;
		}
		
		const apiKey = vscode.workspace.getConfiguration('langchainRepoAnalyzer').get('apiKey') as string;
		if (!apiKey) {
			const input = await vscode.window.showInputBox({
				prompt: 'Please enter your OpenAI API key',
				password: true
			});
			
			if (!input) {
				vscode.window.showErrorMessage('API key is required');
				return;
			}
			
			await vscode.workspace.getConfiguration('langchainRepoAnalyzer').update('apiKey', input, true);
		}
		
		const rootPath = workspaceFolders[0].uri.fsPath;
		
		// Create and show output channel
		const outputChannel = vscode.window.createOutputChannel('LangChain Repo Analyzer');
		outputChannel.show();
		outputChannel.appendLine('Starting repository analysis...');
		
		try {
			const analysis = await analyzeRepository(rootPath);
			
			// Create a new untitled document with the analysis
			const document = await vscode.workspace.openTextDocument({
				content: analysis,
				language: 'markdown'
			});
			
			await vscode.window.showTextDocument(document);
			outputChannel.appendLine('Repository analysis completed successfully!');
		} catch (error) {
			outputChannel.appendLine(`Error during analysis: ${error}`);
			vscode.window.showErrorMessage(`Analysis failed: ${error}`);
		}
	});
	
	// Register command to analyze the current file
	let analyzeFileCommand = vscode.commands.registerCommand('langchain-repo-analyzer.analyzeFile', async () => {
		const editor = vscode.window.activeTextEditor;
		
		if (!editor) {
			vscode.window.showErrorMessage('No file is open');
			return;
		}
		
		const apiKey = vscode.workspace.getConfiguration('langchainRepoAnalyzer').get('apiKey') as string;
		if (!apiKey) {
			const input = await vscode.window.showInputBox({
				prompt: 'Please enter your OpenAI API key',
				password: true
			});
			
			if (!input) {
				vscode.window.showErrorMessage('API key is required');
				return;
			}
			
			await vscode.workspace.getConfiguration('langchainRepoAnalyzer').update('apiKey', input, true);
		}
		
		const filePath = editor.document.uri.fsPath;
		const fileContent = editor.document.getText();
		
		// Create and show output channel
		const outputChannel = vscode.window.createOutputChannel('LangChain File Analyzer');
		outputChannel.show();
		outputChannel.appendLine(`Analyzing file: ${path.basename(filePath)}...`);
		
		try {
			const analysis = await analyzeFile(filePath, fileContent);
			
			// Create a new untitled document with the analysis
			const document = await vscode.workspace.openTextDocument({
				content: analysis,
				language: 'markdown'
			});
			
			await vscode.window.showTextDocument(document);
			outputChannel.appendLine('File analysis completed successfully!');
		} catch (error) {
			outputChannel.appendLine(`Error during analysis: ${error}`);
			vscode.window.showErrorMessage(`Analysis failed: ${error}`);
		}
	});
	
	// Register command to generate dependency graph
	let generateDependencyGraphCommand = vscode.commands.registerCommand('langchain-repo-analyzer.generateDependencyGraph', async () => {
		const workspaceFolders = vscode.workspace.workspaceFolders;
		
		if (!workspaceFolders) {
			vscode.window.showErrorMessage('No workspace folder is open');
			return;
		}
		
		const apiKey = vscode.workspace.getConfiguration('langchainRepoAnalyzer').get('apiKey') as string;
		if (!apiKey) {
			const input = await vscode.window.showInputBox({
				prompt: 'Please enter your OpenAI API key',
				password: true
			});
			
			if (!input) {
				vscode.window.showErrorMessage('API key is required');
				return;
			}
			
			await vscode.workspace.getConfiguration('langchainRepoAnalyzer').update('apiKey', input, true);
		}
		
		const rootPath = workspaceFolders[0].uri.fsPath;
		
		// Create and show output channel
		const outputChannel = vscode.window.createOutputChannel('LangChain Dependency Graph');
		outputChannel.show();
		outputChannel.appendLine('Generating dependency graph...');
		
		try {
			const graphContent = await generateDependencyGraph(rootPath);
			
			// Create a new untitled document with the graph
			const document = await vscode.workspace.openTextDocument({
				content: graphContent,
				language: 'markdown'
			});
			
			await vscode.window.showTextDocument(document);
			outputChannel.appendLine('Dependency graph generated successfully!');
		} catch (error) {
			outputChannel.appendLine(`Error generating graph: ${error}`);
			vscode.window.showErrorMessage(`Graph generation failed: ${error}`);
		}
	});
	
	// Register more commands for additional functionality
	let codeComplexityCommand = vscode.commands.registerCommand('langchain-repo-analyzer.analyzeComplexity', async () => {
		const editor = vscode.window.activeTextEditor;
		
		if (!editor) {
			vscode.window.showErrorMessage('No file is open');
			return;
		}
		
		const apiKey = vscode.workspace.getConfiguration('langchainRepoAnalyzer').get('apiKey') as string;
		if (!apiKey) {
			const input = await vscode.window.showInputBox({
				prompt: 'Please enter your OpenAI API key',
				password: true
			});
			
			if (!input) {
				vscode.window.showErrorMessage('API key is required');
				return;
			}
			
			await vscode.workspace.getConfiguration('langchainRepoAnalyzer').update('apiKey', input, true);
		}
		
		const code = editor.document.getText();
		const language = editor.document.languageId;
		
		vscode.window.withProgress({
			location: vscode.ProgressLocation.Notification,
			title: "Analyzing code complexity...",
			cancellable: false
		}, async (progress) => {
			try {
				const result = await analyzeCodeComplexity(code, language, apiKey);
				
				// Display results in visualization panel
				visualizationProvider.updateVisualization({
					type: 'codeQuality',
					metrics: [
						{ name: 'Complexity Score', value: result.complexityScore },
						{ name: 'Functions', value: (code.match(/function/g) || []).length },
						{ name: 'Lines', value: code.split('\n').length },
						{ name: 'Comments', value: (code.match(/(\/\/|\/\*|\*\/)/g) || []).length }
					]
				}, 'Code Complexity Analysis');
				
				// Also show in markdown document
				const document = await vscode.workspace.openTextDocument({
					content: `# Code Complexity Analysis\n\n**Complexity Score:** ${result.complexityScore}/10\n\n${result.analysis}`,
					language: 'markdown'
				});
				
				await vscode.window.showTextDocument(document);
			} catch (error) {
				vscode.window.showErrorMessage(`Analysis failed: ${error}`);
			}
		});
	});
	
	let generateTestsCommand = vscode.commands.registerCommand('langchain-repo-analyzer.generateTests', async () => {
		const editor = vscode.window.activeTextEditor;
		
		if (!editor) {
			vscode.window.showErrorMessage('No file is open');
			return;
		}
		
		const apiKey = vscode.workspace.getConfiguration('langchainRepoAnalyzer').get('apiKey') as string;
		if (!apiKey) {
			const input = await vscode.window.showInputBox({
				prompt: 'Please enter your OpenAI API key',
				password: true
			});
			
			if (!input) {
				vscode.window.showErrorMessage('API key is required');
				return;
			}
			
			await vscode.workspace.getConfiguration('langchainRepoAnalyzer').update('apiKey', input, true);
		}
		
		const code = editor.document.getText();
		const language = editor.document.languageId;
		
		vscode.window.withProgress({
			location: vscode.ProgressLocation.Notification,
			title: "Generating test cases...",
			cancellable: false
		}, async (progress) => {
			try {
				const result = await generateTestCases(code, language, apiKey);
				
				// Determine test file name
				const currentFile = editor.document.fileName;
				const fileExt = path.extname(currentFile);
				const baseName = path.basename(currentFile, fileExt);
				const testFileName = `${baseName}.test${fileExt}`;
				
				// Create new test file
				const workspaceEdit = new vscode.WorkspaceEdit();
				const testFileUri = vscode.Uri.file(path.join(path.dirname(currentFile), testFileName));
				
				workspaceEdit.createFile(testFileUri, { overwrite: true });
				await vscode.workspace.applyEdit(workspaceEdit);
				
				// Write content to the test file
				const document = await vscode.workspace.openTextDocument(testFileUri);
				const edit = new vscode.WorkspaceEdit();
				edit.insert(testFileUri, new vscode.Position(0, 0), result);
				
				await vscode.workspace.applyEdit(edit);
				await vscode.window.showTextDocument(document);
			} catch (error) {
				vscode.window.showErrorMessage(`Test generation failed: ${error}`);
			}
		});
	});
	
	let documentCodeCommand = vscode.commands.registerCommand('langchain-repo-analyzer.documentCode', async () => {
		const editor = vscode.window.activeTextEditor;
		
		if (!editor) {
			vscode.window.showErrorMessage('No file is open');
			return;
		}
		
		const apiKey = vscode.workspace.getConfiguration('langchainRepoAnalyzer').get('apiKey') as string;
		if (!apiKey) {
			const input = await vscode.window.showInputBox({
				prompt: 'Please enter your OpenAI API key',
				password: true
			});
			
			if (!input) {
				vscode.window.showErrorMessage('API key is required');
				return;
			}
			
			await vscode.workspace.getConfiguration('langchainRepoAnalyzer').update('apiKey', input, true);
		}
		
		const code = editor.document.getText();
		const language = editor.document.languageId;
		
		vscode.window.withProgress({
			location: vscode.ProgressLocation.Notification,
			title: "Adding documentation...",
			cancellable: false
		}, async (progress) => {
			try {
				const result = await documentCode(code, language, apiKey);
				
				// Show a preview of the documented code
				const document = await vscode.workspace.openTextDocument({
					content: result,
					language: language
				});
				
				await vscode.window.showTextDocument(document);
			} catch (error) {
				vscode.window.showErrorMessage(`Documentation failed: ${error}`);
			}
		});
	});
	
	// Register all commands
	context.subscriptions.push(analyzeRepoCommand);
	context.subscriptions.push(analyzeFileCommand);
	context.subscriptions.push(generateDependencyGraphCommand);
	context.subscriptions.push(codeComplexityCommand);
	context.subscriptions.push(generateTestsCommand);
	context.subscriptions.push(documentCodeCommand);
}

export function deactivate() {}