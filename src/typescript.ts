import * as ts from "typescript";
import * as fs from "fs";
import humanStringify from "human-stringify";

function compile(fileNames: string[], options: ts.CompilerOptions): void {
    console.log(`supplied filenames: ${fileNames.join("\n")}`);
    let program = ts.createProgram(fileNames, options);
    let emitResult = program.emit();

    program
        .getSourceFiles()
        .forEach(file => console.log(`source file: ${file.fileName}`));

    let allDiagnostics = ts.getPreEmitDiagnostics(program).concat(emitResult.diagnostics);

    allDiagnostics.forEach(diagnostic => {
        if (diagnostic.file) {
            let { line, character } = diagnostic.file.getLineAndCharacterOfPosition(
                diagnostic.start!
            );
            let message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
            console.log(
                `${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`
            );
        } else {
            console.log(
                `${ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n")}`
            );
        }
    });

    let exitCode = emitResult.emitSkipped ? 1 : 0;
    console.log(`Process exiting with code '${exitCode}'.`);
    process.exit(exitCode);
}

console.log(`__filename: ${__filename}, __dirname: ${__dirname}`);

const jsonConfig = ts.readJsonConfigFile("tsconfig.json", file =>
    fs.readFileSync(file).toString()
);

const parsedCommandLine = ts.parseJsonSourceFileConfigFileContent(
    jsonConfig,
    ts.sys,
    ".",
    { outDir: "generated", target: ts.ScriptTarget.ES5, module: ts.ModuleKind.CommonJS }
);

console.log(
    `parsed options: ${humanStringify(parsedCommandLine.options, { maxDepth: 5 })}`
);

compile(parsedCommandLine.fileNames, parsedCommandLine.options);
