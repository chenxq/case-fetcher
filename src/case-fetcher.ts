import commander from 'commander';
const pkg = require('./package.json');

import { initConfig } from './lib/initConfig';
import { create, update } from './lib/caseServices/create.js';
import { mkdir, template } from './lib/fetchCase.js';

/**
 * E2E support create test case template file from custom cases server.
 */

commander.version(pkg.version, '-v, --version').usage('<command> [options]');

commander
  .command('create')
  .arguments('[caseID]')
  .description('Create Case from caseServices.')
  .option(
    '-S, --service <service>',
    'Create case template with those service params.',
  )
  .option('-O, --origin <origin>', 'Create case template with origin.')
  .action(create);

commander
  .command('update')
  .arguments('[caseID]')
  .description('Update Case from caseServices.')
  .option(
    '-S, --service <service>',
    'Update case template with service params.',
  )
  .option('-O, --origin <origin>', 'Update case template with origin.')
  .action(update);

commander
  .command('mkdir')
  .description('make directory')
  .option('-S, --service <service>', '')
  .option('-O, --origin <origin>', '')
  .action(mkdir);

commander
  .command('template')
  .arguments('<path>')
  .description('Set template file path.')
  .option('-S, --service <service>', '')
  .option('-O, --origin <origin>', '')
  .action(template);

commander
  .command('init')
  .description('Init an new case-fetcher configuration')
  .usage('<command>')
  .action(initConfig);

commander.parse(process.argv);

if (!commander.args.length) {
  commander.help();
}
