export interface LintResult {
    syntax_errors: Array<{
        line: number;
        column?: number;
        message: string;
        text?: string;
    }>;
    warnings: Array<{
        line?: number;
        message: string;
        type: string;
        code?: string;
    }>;
    suggestions: Array<{
        line?: number;
        message: string;
        type: string;
        code?: string;
    }>;
    stats: {
        total_lines: number;
        code_lines: number;
        comment_lines: number;
        functions: number;
        exported_functions: number;
        construct_functions: number;
        variables: number;
        hashes: number;
        foreign_variables: number;
        foreign_hashes: number;
        log_events: number;
        imports: number;
        asserts: number;
    };
}

export class XianLinter {
    private xianGlobals = new Set([
        'Variable', 'Hash', 'ForeignVariable', 'ForeignHash',
        'construct', 'export', 'ctx', 'now', 'datetime', 'block_num', 'block_hash',
        'importlib', 'LogEvent', 'assert_owner', 'Decimal', 'random', 'crypto', 'hashlib',
        'Any', 'List', 'Dict', 'Tuple', 'Optional', 'Union'
    ]);

    private prohibitedFunctions = new Map([
        ['getattr', 'getattr is a prohibited function in Xian contracts'],
        ['eval', 'eval is not allowed for security reasons'],
        ['exec', 'exec is not allowed for security reasons'],
        ['open', 'open() is not allowed in contracts'],
        ['input', 'input() is not allowed in contracts'],
        ['print', 'print() is not available in contracts (use return or events)'],
        ['float', 'float() is a prohibited builtin. Use mathematical operations like +0.0 to convert ContractingDecimal'],
        ['int', 'int() is a prohibited builtin. Use mathematical operations for type conversion'],
        ['str', 'str() is a prohibited builtin. Use string concatenation with empty strings for conversion'],
        ['bool', 'bool() is a prohibited builtin. Use explicit comparisons'],
        ['len', 'len() is a prohibited builtin. Use object-specific methods'],
        ['type', 'type() is a prohibited builtin'],
        ['isinstance', 'isinstance() is a prohibited builtin. Use explicit comparisons']
    ]);

    private prohibitedImports = new Set([
        'os', 'sys', 'subprocess', 'json', 'pickle', 'urllib', 'requests',
        'socket', 'threading', 'multiprocessing', 'asyncio', 'time',
        'io', 'pathlib', 'glob', 'shutil', 'tempfile'
    ]);

    private bestPractices = [
        {
            pattern: /ctx\.signer(?!\s*(?:in|not\s+in|==|!=))/,
            message: 'ctx.signer should only be used for security guards/blacklisting, not for authorization. Use ctx.caller for authorization',
            type: 'security'
        },
        {
            pattern: /import\s+(os|sys|subprocess|json|pickle|urllib|requests|socket|threading|multiprocessing|asyncio|time|io|pathlib|glob|shutil|tempfile)/,
            message: 'System/external module imports are not allowed in contracts',
            type: 'security'
        },
        {
            pattern: /from\s+\w+\s+import/,
            message: '"from x import y" imports are not supported. Use direct import or importlib.import_module()',
            type: 'syntax_error'
        },
        {
            pattern: /import\s+\*/,
            message: 'Wildcard imports are not supported',
            type: 'syntax_error'
        },
        {
            pattern: /try\s*:/,
            message: 'try/except is not allowed in Xian contracts. Use if/else instead',
            type: 'syntax_error'
        },
        {
            pattern: /except\s*:/,
            message: 'try/except is not allowed in Xian contracts. Use if/else instead',
            type: 'syntax_error'
        },
        {
            pattern: /(Variable|Hash)\s*\[[^\]]*[:\.]/,
            message: 'Delimiters ":" and "." cannot be used in Variable or Hash keys',
            type: 'syntax_error'
        },
        {
            pattern: /def\s+_\w+/,
            message: 'Cannot use "_" as prefix for functions',
            type: 'naming_error'
        },
        {
            pattern: /^\s*_\w+\s*=/,
            message: 'Cannot use "_" as prefix for variables',
            type: 'naming_error'
        },
        {
            pattern: /random\.\w+\(/,
            message: 'Make sure to call random.seed() before using random functions',
            type: 'best_practice'
        },
        {
            pattern: /float\s*\(/,
            message: 'float() is a prohibited builtin. For ContractingDecimal conversion use: value + 0.0',
            type: 'syntax_error'
        },
        {
            pattern: /int\s*\(/,
            message: 'int() is a prohibited builtin. For conversion use mathematical operations like: value // 1',
            type: 'syntax_error'
        },
        {
            pattern: /str\s*\(/,
            message: 'str() is a prohibited builtin. For string conversion use: "" + value',
            type: 'syntax_error'
        },
        {
            pattern: /bool\s*\(/,
            message: 'bool() is a prohibited builtin. Use explicit comparisons instead',
            type: 'syntax_error'
        },
        {
            pattern: /len\s*\(/,
            message: 'len() is a prohibited builtin. Use object-specific methods',
            type: 'syntax_error'
        },
        {
            pattern: /type\s*\(/,
            message: 'type() is a prohibited builtin',
            type: 'syntax_error'
        },
        {
            pattern: /isinstance\s*\(/,
            message: 'isinstance() is a prohibited builtin. Use explicit comparisons',
            type: 'syntax_error'
        }
    ];

    public lintCode(code: string, filename: string = '<string>'): LintResult {
        const results: LintResult = {
            syntax_errors: [],
            warnings: [],
            suggestions: [],
            stats: {
                total_lines: 0,
                code_lines: 0,
                comment_lines: 0,
                functions: 0,
                exported_functions: 0,
                construct_functions: 0,
                variables: 0,
                hashes: 0,
                foreign_variables: 0,
                foreign_hashes: 0,
                log_events: 0,
                imports: 0,
                asserts: 0
            }
        };

        // Verificar sintaxis básica de Python
        if (!this.isValidPythonSyntax(code)) {
            results.syntax_errors.push({
                line: 1,
                message: 'Python syntax error in code',
                text: 'Check parentheses, quotes and code structure'
            });
            return results;
        }

        // Análisis línea por línea
        this.analyzeCode(code, results);

        // Verificar patrones de buenas prácticas
        this.checkBestPractices(code, results);

        // Verificaciones específicas de Xian
        this.checkXianSpecific(code, results);

        // Calcular estadísticas
        results.stats = this.calculateStats(code);

        return results;
    }

    private isValidPythonSyntax(code: string): boolean {
        try {
            // Verificaciones básicas de sintaxis
            const lines = code.split('\n');
            let openParens = 0;
            let openBrackets = 0;
            let openBraces = 0;
            let inString = false;
            let stringChar = '';

            for (const line of lines) {
                for (let i = 0; i < line.length; i++) {
                    const char = line[i];
                    const prevChar = i > 0 ? line[i - 1] : '';

                    // Manejo de strings
                    if ((char === '"' || char === "'") && prevChar !== '\\') {
                        if (!inString) {
                            inString = true;
                            stringChar = char;
                        } else if (char === stringChar) {
                            inString = false;
                            stringChar = '';
                        }
                    }

                    if (!inString) {
                        switch (char) {
                            case '(':
                                openParens++;
                                break;
                            case ')':
                                openParens--;
                                break;
                            case '[':
                                openBrackets++;
                                break;
                            case ']':
                                openBrackets--;
                                break;
                            case '{':
                                openBraces++;
                                break;
                            case '}':
                                openBraces--;
                                break;
                        }
                    }
                }
            }

            return openParens === 0 && openBrackets === 0 && openBraces === 0 && !inString;
        } catch {
            return false;
        }
    }

    private analyzeCode(code: string, results: LintResult): void {
        const lines = code.split('\n');
        let exports: string[] = [];
        let constructs: string[] = [];
        let functions: string[] = [];

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineNum = i + 1;
            const trimmed = line.trim();

            // Verificar funciones prohibidas
            for (const [func, message] of this.prohibitedFunctions) {
                if (new RegExp(`\\b${func}\\s*\\(`).test(line)) {
                    const errorType = ['float', 'int', 'str', 'bool', 'len', 'type', 'isinstance'].includes(func) ? 'syntax_error' : 'security';
                    
                    results.warnings.push({
                        line: lineNum,
                        message,
                        type: errorType,
                        code: trimmed
                    });

                    // Añadir sugerencias específicas para conversiones de tipo
                    if (func === 'float') {
                        results.suggestions.push({
                            line: lineNum,
                            message: 'Replace float(value) with: value + 0.0',
                            type: 'fix_suggestion',
                            code: trimmed
                        });
                    } else if (func === 'int') {
                        results.suggestions.push({
                            line: lineNum,
                            message: 'Replace int(value) with: value // 1 (for integers) or use mathematical operations',
                            type: 'fix_suggestion',
                            code: trimmed
                        });
                    } else if (func === 'str') {
                        results.suggestions.push({
                            line: lineNum,
                            message: 'Replace str(value) with: "" + str(value) or use f-strings',
                            type: 'fix_suggestion',
                            code: trimmed
                        });
                    } else if (func === 'bool') {
                        results.suggestions.push({
                            line: lineNum,
                            message: 'Replace bool(value) with explicit comparison: value != 0, value != "", etc.',
                            type: 'fix_suggestion',
                            code: trimmed
                        });
                    } else if (func === 'len') {
                        results.suggestions.push({
                            line: lineNum,
                            message: 'Replace len(obj) with object-specific methods or manual counting',
                            type: 'fix_suggestion',
                            code: trimmed
                        });
                    }
                }
            }

            // Verificar imports prohibidos
            for (const module of this.prohibitedImports) {
                if (new RegExp(`import\\s+${module}\\b`).test(line)) {
                    results.warnings.push({
                        line: lineNum,
                        message: `Import of module '${module}' is not allowed in contracts`,
                        type: 'security',
                        code: trimmed
                    });
                }
            }

            // Detectar funciones
            const funcMatch = line.match(/def\s+(\w+)/);
            if (funcMatch) {
                const funcName = funcMatch[1];
                functions.push(funcName);

                // Check _ prefix
                if (funcName.startsWith('_')) {
                    results.warnings.push({
                        line: lineNum,
                        message: `Function "${funcName}" uses "_" prefix which is not allowed`,
                        type: 'naming_error',
                        code: trimmed
                    });
                }

                // Verificar decoradores en líneas anteriores
                for (let j = Math.max(0, i - 3); j < i; j++) {
                    const prevLine = lines[j].trim();
                    if (prevLine === '@export') {
                        exports.push(funcName);
                    } else if (prevLine === '@construct') {
                        constructs.push(funcName);
                    }
                }
            }

            // Check variables with _ prefix
            const varMatch = line.match(/^\s*(_\w+)\s*=/);
            if (varMatch) {
                results.warnings.push({
                    line: lineNum,
                    message: `Variable "${varMatch[1]}" uses "_" prefix which is not allowed`,
                    type: 'naming_error',
                    code: trimmed
                });
            }

            // Check assert without message
            if (/\bassert\s+[^,]+$/.test(line)) {
                results.warnings.push({
                    line: lineNum,
                    message: 'Assert without custom error message - include descriptive message',
                    type: 'best_practice',
                    code: trimmed
                });
            }
        }

        // Contract structure checks
        if (constructs.length === 0) {
            results.suggestions.push({
                message: 'Consider adding a @construct function to initialize the contract',
                type: 'suggestion'
            });
        }

        if (constructs.length > 1) {
            results.warnings.push({
                message: `Multiple @construct functions found: ${constructs.join(', ')}`,
                type: 'error'
            });
        }

        if (exports.length === 0) {
            results.warnings.push({
                message: 'Contract must have at least one @export function',
                type: 'error'
            });
        }
    }

    private checkBestPractices(code: string, results: LintResult): void {
        const lines = code.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineNum = i + 1;

            for (const practice of this.bestPractices) {
                if (practice.pattern.test(line)) {
                    results.warnings.push({
                        line: lineNum,
                        message: practice.message,
                        type: practice.type,
                        code: line.trim()
                    });
                }
            }
        }
    }

    private checkXianSpecific(code: string, results: LintResult): void {
        const lines = code.split('\n');

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineNum = i + 1;
            const trimmed = line.trim();

            // Check ctx.owner usage without verification
            if (trimmed.includes('ctx.owner') && !trimmed.includes('assert')) {
                results.suggestions.push({
                    line: lineNum,
                    message: 'Consider verifying ctx.owner with assert for access control',
                    type: 'security',
                    code: trimmed
                });
            }

            // Check arithmetic operations with balances
            if (/balances\[.*\]\s*[-+*/]/.test(trimmed) && !trimmed.includes('assert')) {
                results.suggestions.push({
                    line: lineNum,
                    message: 'Consider validating balances before arithmetic operations',
                    type: 'security',
                    code: trimmed
                });
            }

            // Check random usage without seed
            if (trimmed.includes('random.') && !code.includes('random.seed()')) {
                results.warnings.push({
                    line: lineNum,
                    message: 'Use random.seed() before any random functions for determinism',
                    type: 'best_practice',
                    code: trimmed
                });
            }

            // Check loops with expensive operations
            if ((/for\s+/.test(trimmed) || /while\s+/.test(trimmed)) && trimmed.includes('.set(')) {
                results.suggestions.push({
                    line: lineNum,
                    message: 'Storage operations in loops can be expensive in stamps',
                    type: 'performance',
                    code: trimmed
                });
            }

            // Check multiple .get() calls on same line
            if ((trimmed.match(/\.get\(/g) || []).length > 1) {
                results.suggestions.push({
                    line: lineNum,
                    message: 'Consider storing .get() result in variable to avoid multiple reads',
                    type: 'performance',
                    code: trimmed
                });
            }

            // Check correct usage of ctx.signer vs ctx.caller
            if (trimmed.includes('ctx.signer') && !trimmed.includes('ctx.caller')) {
                if (!['blacklist', 'security', 'guard'].some(keyword => trimmed.includes(keyword))) {
                    results.suggestions.push({
                        line: lineNum,
                        message: 'ctx.signer should only be used for security guards. Use ctx.caller for authorization',
                        type: 'best_practice',
                        code: trimmed
                    });
                }
            }
        }
    }

    private calculateStats(code: string): LintResult['stats'] {
        const lines = code.split('\n');
        const stats = {
            total_lines: lines.length,
            code_lines: 0,
            comment_lines: 0,
            functions: 0,
            exported_functions: 0,
            construct_functions: 0,
            variables: 0,
            hashes: 0,
            foreign_variables: 0,
            foreign_hashes: 0,
            log_events: 0,
            imports: 0,
            asserts: 0
        };

        let inExportedFunction = false;
        let inConstructFunction = false;

        for (const line of lines) {
            const trimmed = line.trim();

            if (trimmed && !trimmed.startsWith('#')) {
                stats.code_lines++;
            }
            if (trimmed.startsWith('#')) {
                stats.comment_lines++;
            }

            // Contar elementos específicos
            if (trimmed.includes('def ')) stats.functions++;
            if (trimmed === '@export') inExportedFunction = true;
            if (trimmed === '@construct') inConstructFunction = true;
            if (trimmed.includes('def ') && inExportedFunction) {
                stats.exported_functions++;
                inExportedFunction = false;
            }
            if (trimmed.includes('def ') && inConstructFunction) {
                stats.construct_functions++;
                inConstructFunction = false;
            }
            if (trimmed.includes('Variable(')) stats.variables++;
            if (trimmed.includes('Hash(')) stats.hashes++;
            if (trimmed.includes('ForeignVariable(')) stats.foreign_variables++;
            if (trimmed.includes('ForeignHash(')) stats.foreign_hashes++;
            if (trimmed.includes('LogEvent(')) stats.log_events++;
            if (trimmed.includes('import ')) stats.imports++;
            if (trimmed.includes('assert ')) stats.asserts++;
        }

        return stats;
    }
}