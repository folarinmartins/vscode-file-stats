import { commands, ExtensionContext, StatusBarAlignment, StatusBarItem, TextDocument, window, workspace, Selection, TextEditorRevealType } from 'vscode';
export function activate(context: ExtensionContext) {
  console.log('Activating File Stats extension');

  const statusBar = window.createStatusBarItem(StatusBarAlignment.Right, 100);
  statusBar.command = 'file-stats.jumpToLine';
  statusBar.show();

  const updateStatusBar = async () => {
    const editor = window.activeTextEditor;
    if (!editor) { return; }

    const doc = editor.document;
    const selections = editor.selections;
    const cursorPosition = editor.selection.active; // Get the active cursor position

    const lines = doc.lineCount;
    const words = doc.getText().split(/\s+/).length;
    const bytes = doc.getText().length;
    const selectedChars = selections.reduce((total, selection) => total + doc.getText(selection).length, 0);
    const fileSize = await getFileSize(doc.fileName);
    const formattedFileSize = formatFileSize(fileSize);

    // Add cursor position to the status bar text
    const statusBarText = `➜ Ln ${cursorPosition.line + 1}, Col ${cursorPosition.character + 1}  |  Lines: ${lines}  |  Words: ${words}  |  Chars: ${bytes}  |  Size: ${formattedFileSize}  |  Sel: ${selectedChars} [${selections.length}]`;
    statusBar.text = statusBarText;
    statusBar.tooltip = `Cursor: Line ${cursorPosition.line + 1}, Column ${cursorPosition.character + 1}\nFile Size: ${formattedFileSize}\nLines: ${lines}\nWords: ${words}\nSelected Characters: ${selectedChars}`;
  };

  const getFileSize = async (fileName: string) => {
    if (!fileName) { return 0; }
    const file = await workspace.openTextDocument(fileName);
    return file.getText().length;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) { return `${bytes} B`; }
    if (bytes < 1024 ** 2) { return `${(bytes / 1024).toFixed(2)} KB`; }
    if (bytes < 1024 ** 3) { return `${(bytes / 1024 ** 2).toFixed(2)} MB`; }
    return `${(bytes / 1024 ** 3).toFixed(2)} GB`;
  };

  window.onDidChangeActiveTextEditor(updateStatusBar);
  window.onDidChangeTextEditorSelection(updateStatusBar);
  workspace.onDidChangeTextDocument(updateStatusBar);
  window.onDidChangeTextEditorSelection(updateStatusBar);

  context.subscriptions.push(statusBar);

  let isStatusBarVisible = true;

  context.subscriptions.push(
    commands.registerCommand('file-stats.toggle', () => {
      if (isStatusBarVisible) {
        statusBar.hide();
        isStatusBarVisible = false;
      } else {
        statusBar.show();
        isStatusBarVisible = true;
      }
    })
  );

  context.subscriptions.push(
    commands.registerCommand('file-stats.jumpToLine', jumpToLine)
  );
  if (window.activeTextEditor) {
    updateStatusBar();
  }
}
const jumpToLine = async () => {
  const editor = window.activeTextEditor;
  if (!editor) {
    window.showErrorMessage('No active text editor');
    return;
  }

  const lineCount = editor.document.lineCount;
  const input = await window.showInputBox({
    prompt: `Enter a line number (1-${lineCount})`,
    validateInput: (value) => {
      const num = parseInt(value);
      if (isNaN(num) || num < 1 || num > lineCount) {
        return `Please enter a number between 1 and ${lineCount}`;
      }
      return null;
    }
  });

  if (input === undefined) {
    return; // User cancelled the input
  }

  const lineNumber = parseInt(input) - 1; // Convert to 0-based index
  const line = editor.document.lineAt(lineNumber);

  // Move cursor to the beginning of the specified line
  editor.selection = new Selection(lineNumber, 0, lineNumber, 0);

  // Reveal the line in the editor
  editor.revealRange(line.range, TextEditorRevealType.InCenter);
};
export function deactivate() { }