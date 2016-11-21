#!/usr/bin/env node

'use strict';
const fs = require('fs');
const path = require('path');
const tslint = require('tslint');
const ruleLoader = require('tslint/lib/ruleLoader');

function ruleFile2Name(ruleFilename) {
        return ruleFilename.replace('Rule.js', '').replace(/([A-Z])/g, function($1){return "-"+$1.toLowerCase();});
}

function rulesMetadata() {
        const moduleDirectory = path.dirname(require.resolve('tslint'));
        const CORE_RULES_DIRECTORY = path.resolve(moduleDirectory, ".", "rules");
        const tslintFileName = './tslint.extends.json';
        const configuration = tslint.loadConfigurationFromPath(tslintFileName);
        const rulesDirectories = [CORE_RULES_DIRECTORY].concat(configuration.rulesDirectory);

        let directories = tslint.getRulesDirectories(rulesDirectories);

        const rules = [];
        for (let rulesDirectory of directories) {
                const ruleFiles = fs.readdirSync(rulesDirectory).filter((f) => f.endsWith('Rule.js'));
                console.warn(rulesDirectory);
                for (let ruleFile of ruleFiles) {
                        const rule = require(path.resolve(rulesDirectory, ruleFile)).Rule;
                        if ('metadata' in rule) {
                                // TODO in which package the rule is located
                                // rule.from = rulesDirectory;
                                rules.push(rule.metadata);
                        } else {
                                // No metadata
                                rules.push({
                                        ruleName: ruleFile2Name(ruleFile)
                                });
                        }
                }
        }
        return rules;
}

function rulesDefaults() {
        const tslintFileName = './tslint.extends.json';
        const configuration = tslint.loadConfigurationFromPath(tslintFileName);
        const defaults = {}
        Object.getOwnPropertyNames(configuration.rules).forEach((ruleName) => {
                const ruleValue = configuration.rules[ruleName];
                if (Array.isArray(ruleValue)) {
                        defaults[ruleName] = ruleValue.slice(1);
                }
        });
        return defaults;
}

function rule2pattern(rule, ruledefault) {
        const categoryTslint2codacy = {
                functionality: 'ErrorProne',
                maintainability: 'ErrorProne',
                style: 'CodeStyle',
                typescript: 'CodeStyle',
        }
        let category = categoryTslint2codacy[rule.type];
        let parameters = [];
        const unsupportedOption = 'Unsupported options in rule ' + rule.ruleName + ', skipping options of this rule';
        let defaultValue;
        if (ruledefault) {
                defaultValue = ruledefault[0];      
        } else if ('optionExamples' in rule) {
                defaultValue = rule.optionExamples[1];
        }
        if ('options' in rule && rule.options) {
                if (rule.options.type === 'string') {
                        let name = 'string';
                        if ('enum' in rule.options) {
                                const name = rule.options.enum.join('-or-').toLowerCase();
                        }
                        parameters.push({
                                'name': name,
                                'default': defaultValue
                        });
                } else if (rule.options.type === 'number') {
                        parameters.push({
                                // TODO better name
                                'name': 'number',
                                'default': defaultValue
                        });
                } else if (rule.options.type === 'array') {
                        let choices = [];
                        if ('enum' in rule.options) {
                                choices = rule.options.enum;
                        } else if ('items' in rule.options && 'enum' in rule.options) {
                                choices = rule.options.items.enum;
                        } else {
                                console.warn(unsupportedOption);
                        }
                        choices.forEach((option, index) => {
                                parameters.push({
                                        'name': option,
                                        'default': ruledefault ? ruledefault[index] : false
                                });
                        });
                } else if (rule.options.type === 'object') {
                        Object.getOwnPropertyNames(rule.options.properties).forEach((optionName) => {
                                const option = rule.options.properties[optionName];
                                if ('enum' in option) {
                                        option.enum.forEach((enumitem) => {
                                                let defaultValue = false;
                                                if (Array.isArray(ruledefault)) {
                                                        defaultValue = ruledefault.indexOf(enumitem) !== -1;
                                                }
                                                parameters.push({
                                                        'name': enumitem,
                                                        'default': defaultValue 
                                                });
                                        })
                                } else if ('oneOf' in option) {
                                        parameters.push({
                                                'name': optionName,
                                                'default': ruledefault[0]
                                        });
                                } else {
                                        console.warn(unsupportedOption);
                                }
                        });
                } else {
                        console.warn(unsupportedOption);
                }
        }
        const pattern = {
                patternId: rule.ruleName,
                level: 'Warning',
                category: category,
                parameters: parameters
        };
        return pattern;
}

function rules2patterns(rules, defaults) {
        const patterns = rules.map((rule) => rule2pattern(rule, defaults[rule.ruleName]))
        return patterns;
}

function writePatterns(patterns) {
        const fn = 'docs/patterns.json';
        let content = {
                "name": "tslint",
                "patterns": []
        }
        if (fs.existsSync(fn)) {
                content = JSON.parse(fs.readFileSync(fn).toString('utf-8'));
        }
        content.patterns = patterns;
        fs.writeFileSync(fn, JSON.stringify(content, null, 4));
}

const rules = rulesMetadata();
const defaults = rulesDefaults();

const patterns = rules2patterns(rules, defaults);

writePatterns(patterns);

