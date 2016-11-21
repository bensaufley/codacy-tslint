#!/usr/bin/env node

'use strict';
const fs = require('fs');
const path = require('path');
const tslint = require('tslint');

const moduleDirectory = path.dirname(require.resolve('tslint'));
const CORE_RULES_DIRECTORY = path.resolve(moduleDirectory, ".", "rules");
const tslintFileName = './tslint.json';
const configuration = tslint.Configuration.loadConfigurationFromPath(tslintFileName);
const ruleDirectories = [CORE_RULES_DIRECTORY].concat(configure.ruleDirectories);

let directories = tslint.Configuration.getRulesDirectories(rulesDirectories);

for (let rulesDirectory of directories) {
        Rule = loadRule(rulesDirectory, camelizedName);
}
