#!/usr/bin/env node

const commander = require('commander');
const info = require('../package');
const { create, update, mkdir } = require('../src/lib/fetchCase');

/**
 * E2E support create test case template file from custom cases server.
 */

commander
  .version(info.version)
  .usage('<command> [options]');

commander
  .command('create')
  .arguments('[caseID]')
  .description('Create Case from caseServices.')
  .option('-S, --service <service>', 'Create case template with those service params.')
  .option('-O, --origin <origin>', 'Create case template with origin.')
  .action(create);

commander
  .command('update')
  .arguments('[caseID]')
  .description('Update Case from caseServices.')
  .option('-S, --service <service>', 'Update case template with service params.')
  .option('-O, --origin <origin>', 'Update case template with origin.')
  .action(update);

commander
  .command('mkdir')
  .description('make directory')
  .option('-S, --service <service>', '')
  .option('-O, --origin <origin>', '')
  .action(mkdir);

commander.parse(process.argv);

if (!commander.args.length) {
  commander.help();
}
