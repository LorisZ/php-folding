import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log("PHP Folding Extension Activated 🚀");

    vscode.languages.registerFoldingRangeProvider('php', new PhpUseFoldingProvider());

    const timeoutHandles = new Map<string, NodeJS.Timeout>();

    context.subscriptions.push(
        vscode.workspace.onDidOpenTextDocument((document) => {
            if (document.languageId === 'php') {
                const documentUri = document.uri.toString();

                // Set a timeout to fold use statements after 100ms
                const handle = setTimeout(() => {
                    vscode.window.visibleTextEditors.forEach(editor => {
                        if (editor.document.uri.toString() === documentUri) {
                            foldUseStatements(editor);
                        }
                    });
                    timeoutHandles.delete(documentUri);
                }, 100);

                timeoutHandles.set(documentUri, handle);
            }
        })
    );

    context.subscriptions.push(
        vscode.workspace.onDidCloseTextDocument((document) => {
            const documentUri = document.uri.toString();
            if (timeoutHandles.has(documentUri)) {
                clearTimeout(timeoutHandles.get(documentUri));
                timeoutHandles.delete(documentUri);
            }
        })
    );
}

class PhpUseFoldingProvider implements vscode.FoldingRangeProvider {
    provideFoldingRanges(
        document: vscode.TextDocument,
        context: vscode.FoldingContext,
        token: vscode.CancellationToken
    ): vscode.FoldingRange[] {
        const foldingRanges: vscode.FoldingRange[] = [];
        let useStartLine: number | null = null;
        let indentationStartLines: number[] = [];
        let indentationLevel: number[] = [];

        for (let i = 0; i < document.lineCount; i++) {
            const line = document.lineAt(i).text;

            // use block detection
            if (line.startsWith("use ") && useStartLine === null) {
                useStartLine = i;
            }

            if (useStartLine !== null && (line === "" || i === document.lineCount - 1)) {
                foldingRanges.push(new vscode.FoldingRange(useStartLine, i - 1));
                useStartLine = null;
            }

            if (line.trim() === "") {
                continue;
            }

            // indentation based detection
            let curIndentation = indentationLevel.length > 0 ? indentationLevel[indentationLevel.length - 1] : 0;
            let match = line.match(/^ */);
            let lineIndentation = match ? match[0].length : 0;

            if (curIndentation < lineIndentation) {
                indentationStartLines.push(i);
                indentationLevel.push(lineIndentation);
            }

            if (indentationLevel.length > 0 && curIndentation > lineIndentation) {
                let start = indentationStartLines.pop();
                if (start !== undefined) {
                    if (start > 0) {
                        start--;
                    }
                    foldingRanges.push(new vscode.FoldingRange(start, i - 1));
                    indentationLevel.pop();
                }
            }
        }

        return foldingRanges;
    }
}

function foldUseStatements(editor: vscode.TextEditor) {
    const document = editor.document;
    let startLine: number | null = null;
    let endLine: number | null = null;

    for (let i = 0; i < document.lineCount; i++) {
        const line = document.lineAt(i).text.trim();

        if (line.startsWith("use ") && startLine === null) {
            startLine = i;
        }

        if (startLine !== null && (line === "" || i === document.lineCount - 1)) {
            endLine = i - 1;
            break;
        }
    }

    if (startLine !== null && endLine !== null) {
        vscode.commands.executeCommand('editor.fold', { levels: 1, selectionLines: [startLine] });
    }
}

export function deactivate() {}