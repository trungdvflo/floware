const imaps = require('imap-simple');

const GetMessagesID = async (email, passwordDecrypted, uid) => {
  try {
    const config = {
      imap: {
        user: email,
        password: passwordDecrypted,
        host: process.env.FLO_IMAP_SERVER,
        port: process.env.FLO_IMAP_PORT,
        tls: true,
        authTimeout: 3000
      }
    };
    const connection = await imaps.connect(config);
    await connection.openBox('INBOX');
    const searchCriteria = [
      ['UID', uid]
    ];

    const fetchOptions = {
      bodies: ['HEADER'],
      markSeen: false
    };
    const results = await connection.search(searchCriteria, fetchOptions);

    const messageID = results.map((res) => {
      return res.parts.filter((part) => {
        return part.which === 'HEADER';
      })[0].body['message-id'][0];
    });
    connection.end();
    return messageID.length === 1 ? messageID[0].replace('<', '').replace('>', '') : false;
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log(error);
    return false;
  }
};

module.exports = GetMessagesID;
