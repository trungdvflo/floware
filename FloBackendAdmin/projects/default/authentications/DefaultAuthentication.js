module.exports.Apply = (Server, AuthenticationName) => {
  Server.auth.strategy(AuthenticationName, 'nuisance', {
    strategies: ['OAuth']
  });
};

