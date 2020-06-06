import _ from 'lodash';
import printLogWithTime from '../utils/log';
import FileUtils from '../files/fileUtils';
import s3Config from '../../config/config.json';

const checkS3Connection = async () => {
  printLogWithTime('========== 1 - Connect to AWS S3==========');

  const isProxy = _.get(s3Config, 'awsS3.isProxy');
  const proxyLink = _.get(s3Config, 'awsS3.proxyLink');

  if (isProxy) {
    printLogWithTime('Proxy enabled = true');
    printLogWithTime(`Proxy URL: ${proxyLink}`);
  } else {
    printLogWithTime('Proxy enabled = false');
  }

  try {
    printLogWithTime('Connecting to AWS S3...');
    //printLogWithTime('AW3 init step 1');
    const fileUtil = new FileUtils('AWS-S3');
    //printLogWithTime(`AW3 init step 2 - done ${JSON.stringify(fileUtil)}`);
    const fileInstance = await fileUtil.getInstance();
    //printLogWithTime('AW3 init step 3 - done');
    // eslint-disable-next-line no-console
    //console.log(fileInstance);
    const initSuccess = await fileInstance.init();
    //printLogWithTime(`AW3 init step 4 - ${initSuccess}`);
    if (initSuccess) {
      printLogWithTime('Connect to AWS S3 - OK');
      return true;
    }
    printLogWithTime('Connect to AWS S3 - Failed 1');
  } catch (error) {
    printLogWithTime('Connect to AWS S3 - Failed 2');
    printLogWithTime(error);
  }
};

export default {
  checkS3Connection,
};
