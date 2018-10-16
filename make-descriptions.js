const https = require('https');

const descriptions = require('./docs/description/description.json');

const camelize = (str) => str.replace(/\-([a-z])/g, (_, letter) => letter.toUpperCase());

const request = (url) => {
  return new Promise((resolve, reject) => {
    https.get(url, (resp) => {
      let data = '';
      resp.on('data', (chunk) => { data += chunk; });
      resp.on('end', () => { resolve(data); });
    }).on('error', (err) => { reject(err); });
  });
}

const htmlToMd = (content) => {
  return content.replace(/\s+\n/g, '\n')
    .replace(/\n\n+/g, '\n')
    .replace(/^\s+/gm, '')
    .replace(/(<\/\s+>)/g, '\1\n');
}

const parseTslintRule = (str) => {
  let [, content] = str.split('<article class="page-content">');
  content = content.split('</article>')[0];
  return htmlToMd(content);
}

const sync = async () => {
  for (const { patternId } of descriptions) {
    let description = '';

    try {
      const tslintRule = await request(`https://palantir.github.io/tslint/rules/${patternId}/`);
      description = parseTslintRule(tslintRule);
    } catch (err) {
      const microsoftRule = await request(``)
      console.error(patternId, err);
    }

    if (description) {
      console.log('Parsed', patternId, description);
    } else {
      console.error('No description for', patternId);
    }
  }
}

sync();
