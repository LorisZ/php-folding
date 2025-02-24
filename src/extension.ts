import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log("PHP Folding Extension Activated 🚀");

    vscode.languages.registerFoldingRangeProvider('php', new PhpUseFoldingProvider());

    context.subscriptions.push(
        vscode.workspace.onDidOpenTextDocument((document) => {
            if (document.languageId === 'php') {
                vscode.window.showTextDocument(document).then((editor) => {
                    foldUseStatements(editor);
                });
            }
        })
    );
}

class PhpUseFoldingProvider implements vscode.FoldingRangeProvider {
    async provideFoldingRanges(
        document: vscode.TextDocument,
        context: vscode.FoldingContext,
        token: vscode.CancellationToken
    ): Promise<vscode.FoldingRange[]> {
        // Get default folding ranges from other providers (like Intelephense)
        const existingRanges = await vscode.commands.executeCommand<vscode.FoldingRange[]>(
            'vscode.executeFoldingRangeProvider',
            document.uri
        ) || [];

        const customRanges: vscode.FoldingRange[] = [];
        let startLine: number | null = null;

        for (let i = 0; i < document.lineCount; i++) {
            const line = document.lineAt(i).text.trim();

            if (line.startsWith("use ") && startLine === null) {
                startLine = i;
            }

            if (startLine !== null && (line === "" || i === document.lineCount - 1)) {
                customRanges.push(new vscode.FoldingRange(startLine, i - 1));
                startLine = null;
            }
        }

        // Combine existing folding ranges with our custom ones
        return [...existingRanges, ...customRanges];
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
