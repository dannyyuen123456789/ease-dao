import faker from 'faker';

import log4jUtil from '../../app/utils/log4j.util';

describe('Log4js Util', () => {
  it('[function]log("all", info) [cause] Success', (done) => {
    const fakeInfo = faker.random.words();
    log4jUtil.log('all', fakeInfo);
    done();
  });

  it('[function]log("all", info) [cause] Success with uuid', (done) => {
    const fakeInfo = faker.random.words();
    log4jUtil.log('all', fakeInfo, faker.random.number());
    done();
  });

  it('[function]log("trace", info) [cause] Success', (done) => {
    const fakeInfo = faker.random.words();
    log4jUtil.log('trace', fakeInfo);
    done();
  });

  it('[function]log("trace", info) [cause] Success with uuid', (done) => {
    const fakeInfo = faker.random.words();
    log4jUtil.log('trace', fakeInfo, faker.random.number());
    done();
  });

  it('[function]log("debug", info) [cause] Success', (done) => {
    const fakeInfo = faker.random.words();
    log4jUtil.log('debug', fakeInfo);
    done();
  });

  it('[function]log("debug", info) [cause] Success with uuid', (done) => {
    const fakeInfo = faker.random.words();
    log4jUtil.log('debug', fakeInfo, faker.random.number());
    done();
  });

  it('[function]log("info", info) [cause] Success', (done) => {
    const fakeInfo = faker.random.words();
    log4jUtil.log('info', fakeInfo);
    done();
  });

  it('[function]log("info", info) [cause] Success with uuid', (done) => {
    const fakeInfo = faker.random.words();
    log4jUtil.log('info', fakeInfo, faker.random.number());
    done();
  });

  it('[function]log("warn", info) [cause] Success', (done) => {
    const fakeInfo = faker.random.words();
    log4jUtil.log('warn', fakeInfo);
    done();
  });

  it('[function]log("warn", info) [cause] Success with uuid', (done) => {
    const fakeInfo = faker.random.words();
    log4jUtil.log('warn', fakeInfo, faker.random.number());
    done();
  });

  it('[function]log("error", info) [cause] Success', (done) => {
    const fakeInfo = faker.random.words();
    log4jUtil.log('error', fakeInfo);
    done();
  });

  it('[function]log("error", info) [cause] Success with uuid', (done) => {
    const fakeInfo = faker.random.words();
    log4jUtil.log('error', fakeInfo, faker.random.number());
    done();
  });

  it('[function]log("fatal", info) [cause] Success', (done) => {
    const fakeInfo = faker.random.words();
    log4jUtil.log('fatal', fakeInfo);
    done();
  });

  it('[function]log("fatal", info) [cause] Success with uuid', (done) => {
    const fakeInfo = faker.random.words();
    log4jUtil.log('fatal', fakeInfo, faker.random.number());
    done();
  });

  it('[function]log("mark", info) [cause] Success', (done) => {
    const fakeInfo = faker.random.words();
    log4jUtil.log('mark', fakeInfo);
    done();
  });

  it('[function]log("mark", info) [cause] Success with uuid', (done) => {
    const fakeInfo = faker.random.words();
    log4jUtil.log('mark', fakeInfo, faker.random.number());
    done();
  });

  it('[function]log("OFF", info) [cause] Success', (done) => {
    const fakeInfo = faker.random.words();
    log4jUtil.log('off', fakeInfo);
    done();
  });

  it('[function]log("OFF", info) [cause] Success with uuid', (done) => {
    const fakeInfo = faker.random.words();
    log4jUtil.log('off', fakeInfo, faker.random.number());
    done();
  });

  it('[function]log(ELSE CASE, info) [cause] Success', (done) => {
    const fakeInfo = faker.random.words();
    log4jUtil.log(faker.random.word(), fakeInfo);
    done();
  });

  it('[function]log(ELSE CASE, info) [cause] Success with uuid', (done) => {
    const fakeInfo = faker.random.words();
    log4jUtil.log(faker.random.word(), fakeInfo, faker.random.number());
    done();
  });
});
