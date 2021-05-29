const ChefToken = artifacts.require("ChefToken");

module.exports = function (deployer) {
  deployer.deploy(ChefToken);
};
