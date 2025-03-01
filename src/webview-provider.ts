import * as vscode from 'vscode';
import * as path from 'path';

/**
 * Provider for code visualization webviews
 */
export class VisualizationViewProvider implements vscode.WebviewViewProvider {
    public static readonly viewType = 'langchain-repo-analyzer.visualization';
    
    private _view?: vscode.WebviewView;
    
    constructor(
        private readonly _extensionUri: vscode.Uri,
    ) {}
    
    resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        _token: vscode.CancellationToken,
    ) {
        this._view = webviewView;
        
        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this._extensionUri]
        };
        
        webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
        
        // Handle messages from the webview
        webviewView.webview.onDidReceiveMessage(data => {
            switch (data.type) {
                case 'log':
                    console.log(data.message);
                    break;
                case 'error':
                    vscode.window.showErrorMessage(data.message);
                    break;
            }
        });
    }
    
    public updateVisualization(data: any, title: string) {
        if (this._view) {
            this._view.show(true);
            this._view.webview.postMessage({ 
                type: 'update',
                data: data,
                title: title
            });
        }
    }
    
    private _getHtmlForWebview(webview: vscode.Webview) {
        const scriptUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'media', 'main.js')
        );
        
        const stylesUri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'media', 'styles.css')
        );
        
        // Use D3.js for visualizations
        const d3Uri = webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, 'media', 'd3.min.js')
        );
        
        return `<!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link href="${stylesUri}" rel="stylesheet">
            <title>Repository Visualization</title>
        </head>
        <body>
            <div class="container">
                <h1 id="visualization-title">Repository Visualization</h1>
                <div id="visualization-container"></div>
            </div>
            <script src="${d3Uri}"></script>
            <script src="${scriptUri}"></script>
        </body>
        </html>`;
    }
}