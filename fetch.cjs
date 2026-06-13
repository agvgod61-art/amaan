const https = require('https');
const fs = require('fs');

https.get('https://inquisitive-hotteok-a3daf2.netlify.app', (res) => {
  let html = '';
  res.on('data', d => html += d);
  res.on('end', () => {
    const match = html.match(/src="(\/assets\/index-[^"]+\.js)"/);
    if (match) {
      https.get(`https://inquisitive-hotteok-a3daf2.netlify.app${match[1]}`, (res) => {
        let js = '';
        res.on('data', d => js += d);
        res.on('end', () => {
            fs.writeFileSync('bundle.js', js);
            console.log('Downloaded bundle.js');
        });
      });
    }
  });
});
