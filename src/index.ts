import * as fs from 'fs';
import * as globby from 'globby';
import * as path from 'path';
import { Linter, Configuration, ILinterOptions, RuleFailure, IOptions } from 'tslint';
import { CodacyConfig, CodacyPattern, CodacyTool } from './codacy';
import { stringify } from 'querystring';
import { IConfigurationFile } from 'tslint/lib/configuration';

const defaultConfigPath = path.resolve('.', 'tslint.base.json');
const root = '/src';
const codacyConfigFile = path.join(root, '.codacy.json');
let codacyConfig: CodacyConfig = {};
let rules: Map<string, Partial<IOptions>>;

const patternsToRules = (patterns: CodacyPattern[]) => patterns.filter(
  ({ parameters }) => parameters && parameters.filter(({ value }) => value !== false).length > 0
).reduce<Map<string, IOptions>>(
  (map, { parameters, patternId }) => map.set(patternId, {
    disabledIntervals: [], // deprecated but type checking demands it
    ruleArguments: parameters.reduce<string[]>(
      (arr, parameter) => {
        if (typeof parameter.value === 'boolean') {
          return parameter.value ? [...arr, parameter.name] : arr;
        } else {
          return [...arr, parameter.value];
        }
      },
      []
    ),
    ruleName: patternId,
    ruleSeverity: 'warning',
  }),
  new Map(),
);

if (fs.existsSync(codacyConfigFile)) {
  codacyConfig = JSON.parse(fs.readFileSync(codacyConfigFile).toString('utf-8'));
}

if (codacyConfig.tools) {
  const tool = codacyConfig.tools.find((tool) => tool.name === 'tslint');
  if (tool !== undefined) {
    rules = patternsToRules(tool.patterns);
  }
}

const options: ILinterOptions = {
  fix: false,
  formatter: 'json',
};

let paths: string[] = [];
if (codacyConfig.files) {
  paths = codacyConfig.files;
} else {
  paths = globby.sync([
    '**/*.ts',
    '**/*.tsx',
    '!node_modules/**',
    '!jspm_packages/**',
    '!bower_components/**',
  ]);
}

const outputFailure = (failure: RuleFailure) => {
  console.log(JSON.stringify({
    filename: failure.getFileName(),
    message: failure.getFailure(),
    patternId: failure.getRuleName(),
    line: failure.getStartPosition().getLineAndCharacter().line,
  }));
};

const lintFile = (fileName: string) => {
  const fileContents = fs.readFileSync(fileName, 'utf8');
  const linter = new Linter(options);
  const configuration =
    Configuration.findConfiguration(null, fileName).results ||
    Configuration.findConfiguration(defaultConfigPath, fileName).results;
  if (rules) configuration!.rules = rules;
  linter.lint(fileName, fileContents, configuration);
  const result = linter.getResult();
  result.failures.forEach(outputFailure);
};

paths.forEach(lintFile);
