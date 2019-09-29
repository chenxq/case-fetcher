const accounts = {
  username: '18552032014',
  password: 'Test!123',
  officeAccount: 'demo5@RingCentral639.onmicrosoft.com',
  officePwd: 'Rcisfun25',
};

module.exports = {
  office: {
    rc: {
      ...accounts,
      username: '18002085150',
      extension: '../googlechrome/build/extension/office/rc',
    },
    bt: {
      ...accounts,
      username: '448081009381',
      extension: '../googlechrome/build/extension/office/bt',
    },
    att: {
      ...accounts,
      username: '18772153841 ',
      extension: '../googlechrome/build/extension/office/att',
    },
    telus: {
      ...accounts,
      username: '18002064046',
      extension: '../googlechrome/build/extension/office/telus',
    },
  },
  salesforce: {
    username: 'integration.end2end@ringcentral.com',
    password: 'RNG94405!'
  },
  archiver: {
    storageAccounts: {
      dropbox1: {
        username: 'archiverdrive1@gmail.com',
        password: 'Test!123'
      },
      dropbox2: {
        username: 'archiverdrive2@gmail.com',
        password: 'Test!123'
      },
      googleDrive1: {
        username: 'archiverdrive1@gmail.com',
        password: 'Test!123'
      },
      googleDrive2: {
        username: 'archiverdrive2@gmail.com',
        password: 'Test!123'
      },
      box1: {
        username: 'archiverdrive1@gmail.com',
        password: 'Test!123'
      },
      box2: {
        username: 'archiverdrive2@gmail.com',
        password: 'Test!123'
      },
      sftp: {
        host: 's-38039b80a44e426b9.server.transfer.us-east-1.amazonaws.com',
        port: '22',
        username: 'max',
        password: 'test'
      }
    },
    archiverDBUrl: {
      xmnup: 'postgres://aurora-xmnup-cluster.cluster-czwillulczws.us-east-1.rds.amazonaws.com:5432/rcdb',
      itldevxmn: 'postgres://rcdb:Rcisfun29@archiver.cluster-czwillulczws.us-east-1.rds.amazonaws.com:5432/rcdb'
      // itldevxmn: 'postgres://rcpruser:Test!123@itl01-t01-ard01.lab.nordigy.ru:5432/rcdb'

    }
  },
  caseServices: {
    username: 'linna.lin',
    password: '^'
  }
};
