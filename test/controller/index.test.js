import request from 'supertest';
import faker from 'faker';
import 'babel-polyfill';

import app from '../../app/index';

describe('router', () => {
  it('[router][GET] /{random path} [cause] 404 error', (done) => {
    const randomPath = faker.random.words();
    request(app)
      .get(`/${randomPath}`)
      .then((response) => {
        expect(response.status).toBe(404);
        done();
      });
  });

  it('[function]generalSuccessResponse [cause]success', (done) => {
    request(app)
      .get('/api/200')
      .then((response) => {
        expect(response.status).toBe(200);
        done();
      });
  });

  it('[function]generalBadRequestResponse [cause]success', (done) => {
    request(app)
      .get('/api/400')
      .then((response) => {
        expect(response.status).toBe(400);
        done();
      });
  });

  it('[function]generalInternalServerErrorResponse [cause]success', (done) => {
    request(app)
      .get('/api/500')
      .then((response) => {
        expect(response.status).toBe(500);
        done();
      });
  });

  it('[function]customResponseStatusCode [cause]success', (done) => {
    request(app)
      .get('/api/201')
      .then((response) => {
        expect(response.status).toBe(201);
        done();
      });
  });
});
