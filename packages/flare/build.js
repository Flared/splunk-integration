/* eslint-disable */

const shell = require('shelljs');
const OS = require('os').platform().toLocaleLowerCase();

const arg = process.argv[2];
const commands = ['build', 'link', 'unlink'];

if (!arg) {
    shell.echo(
        `No command received, please supply a command to run. \nCommands: ${commands.join(', ')}`
    );
    shell.exit(1);
}

if (!commands.includes(arg)) {
    shell.echo(`Please supply one of the following command to run: ${commands.join(', ')}`);
    shell.exit(1);
}

// prettier-ignore
const runCommands = {
    win32: {
        build: () => shell.exec('set NODE_ENV=production&&.\\node_modules\\.bin\\webpack --mode=production'),
        link: () => shell.exec('mklink /D "%SPLUNK_HOME%\\etc\\apps\\flare" "%cd%\\..\\..\\output\\flare"'),
    },
    nix: {
        build: () => shell.exec('export NODE_ENV=production && ./node_modules/.bin/webpack --mode=production'),
        unlink: () => shell.exec('unlink $SPLUNK_HOME/etc/apps/flare || true'),
        link: () => shell.exec('ln -s $PWD/../../output/flare $SPLUNK_HOME/etc/apps/flare'),
    },
};

try {
    const isWindows = OS === 'win32' || OS === 'win64';
    const os = isWindows ? 'win32' : 'nix';
    runCommands[os][arg]();
} catch (error) {
    shell.echo(error);
}
