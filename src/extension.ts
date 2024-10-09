import { commands, ExtensionContext, StatusBarAlignment, StatusBarItem, TextDocument, window, workspace } from 'vscode';

export function activate(context: ExtensionContext) {
  console.log('Activating File Stats extension');

  const statusBar = window.createStatusBarItem(StatusBarAlignment.Right, 100);
  statusBar.show();

  const updateStatusBar = async () => {
    const editor = window.activeTextEditor;
    if (!editor) { return; }

    const doc = editor.document;
    const selections = editor.selections;

    const lines = doc.lineCount;
    const words = doc.getText().split(/\s+/).length;
    const bytes = doc.getText().length;
    const selectedChars = selections.reduce((total, selection) => total + doc.getText(selection).length, 0);
    const fileSize = await getFileSize(doc.fileName);
    const formattedFileSize = formatFileSize(fileSize);

    const statusBarText = `➜ L: ${lines}  |  W: ${words}  |  B: ${formattedFileSize}  |  Sel: ${selectedChars} [${selections.length} selections]`;
    statusBar.text = statusBarText;
    statusBar.tooltip = `File Size: ${formattedFileSize}\nLines: ${lines}\nWords: ${words}\nSelected Characters: ${selectedChars}`;
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
  if (window.activeTextEditor) {
    updateStatusBar();
  }
}

export function deactivate() { }