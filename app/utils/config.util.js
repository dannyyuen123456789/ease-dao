import config from 'config';

const getConfig = (key) => {
  if (key) {
    if (config.has(key)) {
      return config.get(key);
    }
    return '';
  }
  return '';
};

export default getConfig;
