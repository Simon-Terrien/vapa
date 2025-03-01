# LangChain Repository Analyzer for VS Code

A VS Code extension that uses LangChain to analyze and visualize your codebase.

## Features

### Repository Analysis
- Analyze entire repositories to get insights about code quality, structure, and potential issues
- Generate dependency graphs to visualize relationships between modules
- Get recommendations for improving code organization

### File Analysis
- Analyze individual files for code quality and complexity
- Generate comprehensive documentation for your code
- Get suggestions for improving code readability and performance

### Code Assistance
- Generate test cases for your functions and classes
- Measure code complexity with detailed metrics
- Add proper documentation to undocumented code

### Visualizations
- View dependency graphs of your code
- See code quality metrics in interactive charts
- Analyze file type distribution in your projects

## Commands

The extension provides the following commands:

- **LangChain: Analyze Repository** - Analyzes the entire workspace folder
- **LangChain: Analyze Current File** - Analyzes the currently open file
- **LangChain: Generate Dependency Graph** - Creates a visualization of file dependencies
- **LangChain: Analyze Code Complexity** - Measures complexity metrics of current file
- **LangChain: Generate Test Cases** - Creates test cases for functions in current file
- **LangChain: Document Code** - Adds comprehensive documentation to your code

## Getting Started

1. Install the extension from the VS Code Marketplace
2. Open a project folder in VS Code
3. Configure your OpenAI API key in the extension settings
4. Right-click on a file or folder and select one of the LangChain commands

## Requirements

- VS Code 1.80.0 or higher
- OpenAI API key

## Extension Settings

This extension contributes the following settings:

* `langchainRepoAnalyzer.apiKey`: Your OpenAI API key
* `langchainRepoAnalyzer.maxFilesToAnalyze`: Maximum number of files to analyze in a repository (default: 50)

## How It Works

This extension uses LangChain to orchestrate multiple AI-powered analysis operations:

1. It reads your code files and extracts their content
2. The content is processed using LangChain with OpenAI models
3. The results are presented in readable Markdown documents or interactive visualizations

## Privacy and Security

Your code is sent to OpenAI's API for analysis. Please review OpenAI's privacy policy. You can limit what files are analyzed by adjusting the maxFilesToAnalyze setting.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This extension is licensed under the MIT License.