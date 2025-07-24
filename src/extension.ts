import * as vscode from 'vscode';
import { XianLinter } from './xianLinter';

let linter: XianLinter;
let diagnosticCollection: vscode.DiagnosticCollection;

export function activate(context: vscode.ExtensionContext) {
    console.log('Xian Contract Linter activated');

    // Crear colección de diagnósticos
    diagnosticCollection = vscode.languages.createDiagnosticCollection('xian-linter');
    context.subscriptions.push(diagnosticCollection);

    // Inicializar linter
    linter = new XianLinter();

    // Comando para analizar archivo actual
    const lintCommand = vscode.commands.registerCommand('xianLinter.lintCurrentFile', () => {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            lintDocument(editor.document);
        }
    });

    // Comando para toggle del linter
    const toggleCommand = vscode.commands.registerCommand('xianLinter.toggleLinter', () => {
        const config = vscode.workspace.getConfiguration('xianLinter');
        const enabled = config.get<boolean>('enabled', true);
        config.update('enabled', !enabled, vscode.ConfigurationTarget.Global);
        vscode.window.showInformationMessage(`Xian Linter ${!enabled ? 'enabled' : 'disabled'}`);
    });

    // Eventos de documentos
    const onDidOpenTextDocument = vscode.workspace.onDidOpenTextDocument(lintDocument);
    const onDidChangeTextDocument = vscode.workspace.onDidChangeTextDocument(event => {
        if (event.document.languageId === 'python') {
            // Debounce para evitar análisis excesivo
            setTimeout(() => lintDocument(event.document), 500);
        }
    });
    const onDidSaveTextDocument = vscode.workspace.onDidSaveTextDocument(lintDocument);

    // Registrar suscripciones
    context.subscriptions.push(
        lintCommand,
        toggleCommand,
        onDidOpenTextDocument,
        onDidChangeTextDocument,
        onDidSaveTextDocument
    );

    // Analizar documentos ya abiertos
    vscode.workspace.textDocuments.forEach(lintDocument);
}

function lintDocument(document: vscode.TextDocument) {
    const config = vscode.workspace.getConfiguration('xianLinter');
    
    if (!config.get<boolean>('enabled', true)) {
        return;
    }

    if (document.languageId !== 'python') {
        return;
    }

    // Auto-detectar contratos Xian
    const autoDetect = config.get<boolean>('autoDetect', true);
    const fileName = document.fileName.toLowerCase();
    const isXianContract = fileName.includes('con_') || 
                          document.getText().includes('@export') ||
                          document.getText().includes('Variable(') ||
                          document.getText().includes('Hash(');

    if (autoDetect && !isXianContract) {
        // Limpiar diagnósticos si no es un contrato Xian
        diagnosticCollection.delete(document.uri);
        return;
    }

    try {
        const results = linter.lintCode(document.getText(), document.fileName);
        const diagnostics = convertToDiagnostics(results, config);
        diagnosticCollection.set(document.uri, diagnostics);
    } catch (error) {
        console.error('Error in Xian Linter:', error);
    }
}

function convertToDiagnostics(results: any, config: vscode.WorkspaceConfiguration): vscode.Diagnostic[] {
    const diagnostics: vscode.Diagnostic[] = [];
    const strictMode = config.get<boolean>('strictMode', false);
    const showSuggestions = config.get<boolean>('showSuggestions', true);

    // Errores de sintaxis
    results.syntax_errors?.forEach((error: any) => {
        const line = Math.max(0, (error.line || 1) - 1);
        const range = new vscode.Range(line, error.column || 0, line, (error.column || 0) + 10);
        
        const diagnostic = new vscode.Diagnostic(
            range,
            error.message,
            vscode.DiagnosticSeverity.Error
        );
        diagnostic.source = 'Xian Linter';
        diagnostic.code = 'syntax-error';
        diagnostics.push(diagnostic);
    });

    // Advertencias
    results.warnings?.forEach((warning: any) => {
        const line = Math.max(0, (warning.line || 1) - 1);
        const range = new vscode.Range(line, 0, line, 1000);
        
        const severity = strictMode ? vscode.DiagnosticSeverity.Error : 
                        getSeverityByType(warning.type);
        
        const diagnostic = new vscode.Diagnostic(
            range,
            warning.message,
            severity
        );
        diagnostic.source = 'Xian Linter';
        diagnostic.code = warning.type || 'warning';
        diagnostics.push(diagnostic);
    });

    // Sugerencias
    if (showSuggestions) {
        results.suggestions?.forEach((suggestion: any) => {
            const line = Math.max(0, (suggestion.line || 1) - 1);
            const range = new vscode.Range(line, 0, line, 1000);
            
            const diagnostic = new vscode.Diagnostic(
                range,
                suggestion.message,
                vscode.DiagnosticSeverity.Information
            );
            diagnostic.source = 'Xian Linter';
            diagnostic.code = suggestion.type || 'suggestion';
            diagnostics.push(diagnostic);
        });
    }

    return diagnostics;
}

function getSeverityByType(type: string): vscode.DiagnosticSeverity {
    switch (type) {
        case 'security':
        case 'syntax_error':
        case 'error':
            return vscode.DiagnosticSeverity.Error;
        case 'naming_error':
        case 'performance':
            return vscode.DiagnosticSeverity.Warning;
        case 'best_practice':
        case 'xsc_compliance':
        default:
            return vscode.DiagnosticSeverity.Information;
    }
}

export function deactivate() {
    if (diagnosticCollection) {
        diagnosticCollection.dispose();
    }
}