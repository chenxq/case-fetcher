import * as path from 'path';
import * as fs from 'fs';
import { ncp } from 'ncp';

const moveUrl = ['/src/templates', 'CHANGELOG.md', 'README.md', 'package.json'];

const destinationUrl = process.argv.includes('--prod') ? 'publish' : 'dist';

export class AddEnv {
  fromUrl = `${destinationUrl}/index.js`;

  constructor() {
    this.writeFile(this.fromUrl);
    this.movefile();
  }

  writeFile(fromUrl) {
    const oriString = this.getFile(fromUrl);
    const template = fs.readFileSync(fromUrl).toString();

    if (template.indexOf(`#!/usr/bin/env node\n`) > -1) {
      return;
    }
    const file = fs.createWriteStream(fromUrl);

    file.write(`#!/usr/bin/env node\n`);
    file.write(oriString);
    console.log('complete');
  }

  getFile(fromUrl) {
    if (fs.existsSync(path.resolve(fromUrl))) {
      return fs.readFileSync(fromUrl).toString();
    }
  }

  movefile() {
    moveUrl.forEach((url) => {
      console.log(`${url} => ${path.join(destinationUrl, url)} ...`);
      ncp(
        path.join(__dirname, url),
        path.join(__dirname, destinationUrl, path.basename(url)),
        (err) => {
          if (err) {
            console.error('Not exist: ', url);
            return;
          }
          console.log('Move success:', url);
        },
      );
    });
    console.log('Move Done!');
  }
}
module.exports = new AddEnv();
