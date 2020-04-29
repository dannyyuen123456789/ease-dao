import getConfig from '../../app/utils/config.util';

describe('Config Util', () => {
  it('[function]getConfig [cause] Success', () => {
    expect(getConfig('minio.endPoint')).toBe('minio.dp.k8s-dev');
  });

  it('[function]getConfig [cause] key empty)', () => {
    expect(getConfig('')).toBe('');
  });

  it('[function]getConfig [cause] not exist empty)', () => {
    expect(getConfig('mongodb.abc')).toBe('');
  });
});
