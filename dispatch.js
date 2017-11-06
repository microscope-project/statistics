'use strict';
const path = require('path');
// const fastify = require('fastify')();
const fastify = require('/Users/yijun/git/fastify')();
const serveStatic = require('serve-static');
const urllib = require('urllib');

fastify.use(['/css', '/js'], serveStatic(path.join(__dirname, './assets')));

fastify.register(require('point-of-view'), {
  engine: {
    ejs: require('ejs')
  }
});

fastify.get('/', async function (req, rep) {
  const packageQuery = req.query.package || 'easy-monitor';
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const format = `${yesterday.getFullYear()}-${yesterday.getMonth() + 1}-${yesterday.getDate()}`;
  // 2017.3.10 发布
  const startMonth = new Date('2017-03-10');
  const lastMonth = yesterday.getMonth() && new Date(`${yesterday.getFullYear()}-${yesterday.getMonth()}-${yesterday.getDate()}`)
    || new Date(`${yesterday.getFullYear() - 1}-12-${yesterday.getDate()}`);
  const urlAll = `http://api.npmjs.org/downloads/point/2017-03-10:${format}/${packageQuery}`;
  const urlDay = `http://api.npmjs.org/downloads/range/2017-03-10:${format}/${packageQuery}`;
  const results = await Promise.all([urllib.request(urlAll), urllib.request(urlDay)]);
  const all = JSON.parse(String(results[0].data));
  const day = JSON.parse(String(results[1].data));
  rep.view(path.join('/view/statistics_day.html'), {
    name: packageQuery,
    start: ((lastMonth - startMonth) / (yesterday - startMonth)) * 100,
    total: all.downloads,
    yesterday: day.downloads[day.downloads.length - 1].downloads,
    ezm: {
      day: {
        date: JSON.stringify(day.downloads.map(r => r.day)),
        data: JSON.stringify(day.downloads.map(r => r.downloads))
      },
      all: {
        date: JSON.stringify(day.downloads.map(r => r.day)),
        data: JSON.stringify(day.downloads.reduce((p, r) => {
          p.c += Number(r.downloads);
          p.a.push(p.c);
          return p;
        }, { c: 0, a: [] }).a)
      }
    }
  });
});

fastify.listen(3000, function (err) {
  if (err) throw err
  console.log(`server listening on ${fastify.server.address().port}`)
})