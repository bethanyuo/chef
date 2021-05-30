const ChefMarketContract = artifacts.require("ChefMarketContract");

module.exports = function (deployer) {
  deployer.deploy(ChefMarketContract);
};
