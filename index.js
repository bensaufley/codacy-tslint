#!/usr/bin/env node

'use strict';
const fs = require('fs');
const path = require('path');
const Linter = require('tslint');
const globby = require('globby');

const root = '/src';
const codacyConfigFn = path.join(root, '.codacy.json');
let codacyConfig = {};
if (fs.existsSync(codacyConfigFn)) {
    codacyConfig = JSON.parse(fs.readFileSync(tslintFileName).toString('utf-8'));
}

const tslintFileName = path.join(root, 'tslint.json');
let configuration = {extends: 'tslint:recommended', rules: {}}; 
if (fs.existsSync(tslintFileName)) {
    configuration = Linter.loadConfigurationFromPath(tslintFileName);
}

// filter rules in configuration by codacy patterns
if ('tools' in codacyConfig) {
    const tool = codacyConfig.tools.find((tool) => tool.name === 'tslint');
    if (tool !== undefined) {
        const rules = patterns2rules(tool.patterns);
        configuration.rules = rules;
    } 
}

const options = {
    formatter: 'json',
    configuration: configuration
}

// only check files in codacy config
let paths = []; 
if ('files' in codacyConfig) {
    paths = codacyConfig.files;
} else { 
    paths = globby.sync(['**/*.ts', '**/*.tsx', '!node_modules/**', '!jspm_packages/**', '!bower_components/**']);
}
paths.map(lintFile)

function formatter(failure) {
    const result = {
        filename: failure.getFileName(),
        message: failure.getFailure(),
        patternId: failure.getRuleName(),
        line: failure.getStartPosition().line
    }
    console.log(JSON.stringify(result));
}

function lintFile(fileName) {
    const contents = fs.readFileSync(fileName, 'utf8');
    const linter = new Linter(fileName, contents, options);
    linter.lint().failures.map(formatter);
}

function patterns2rules(patterns) {
    const patternIds = patterns.map((pattern) => pattern.patternId);
    const pattern2values = {};
    patterns.filter(
        (pattern) => 'parameters' in pattern && pattern.parameters.length > 0
    ).forEach(
        (pattern) => {
            const values = [];
            pattern.parameters.forEach((parameter) => {
                if (typeof parameter.value === 'boolean') {
                    if (parameter.value) {
                        values.push(parameter.name);
                    }
                } else {
                    values.push(parameter.value);
                }
            });
            pattern2values[pattern.name] = values; 
        }
    );
    const rules = {}; 
    patternIds.forEach((rule) => {
        rules[rule] = [true];
        if (rule in pattern2values) {
            rules[rule] = rules[rule].concat(pattern2values[rule]);
        }
    });
    return rules;
}