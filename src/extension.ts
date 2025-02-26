import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    vscode.window.onDidChangeActiveTextEditor(editor => {
        if (editor && editor.document.languageId === 'php') {
            foldUseStatements(editor);
        }
    }, null, context.subscriptions);
}

async function foldUseStatements(editor: vscode.TextEditor) {
    const document = editor.document;
    let startLine: number | null = null;

    for (let i = 0; i < document.lineCount; i++) {
        const line = document.lineAt(i).text.trim();

        if (line.startsWith("use ") && startLine === null) {
            startLine = i;
        }

        if (startLine !== null && (line === "" || i === document.lineCount - 1)) {
            // Apply folding command
            await vscode.commands.executeCommand('editor.fold', { selectionLines: [startLine] });
            startLine = null;
        }
    }
}

export function deactivate() {}
