import {
  httpResponseStatus,
} from '../../app/utils/response.util';


describe('response Util', () => {
  it('[function]httpResponseStatus [cause]success', () => {
    expect(httpResponseStatus.continue).toBe(100);
  });
});
