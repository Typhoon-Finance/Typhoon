const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("*Typhoon* Flashloan Standard", function() {
  let flashLender;
  let flashBorrower;
  let dai;
  const supportedTokens = ["0x6B175474E89094C44Da98b954EedeAC495271d0F"]; // DAI
  const fee = 1;
  const chainlinkPriceFeeds = ["0xAed0c38402a5d19df6E4c03F4E2DceD6e29c1ee9"]; // DAI/USD
  const tellorPriceFeeds = ["0x4746DeC9e833A82EC7C2C1356372CcF2cfcD2F3D"]; // DAI?USD
  const tellorAddress = '0x88dF592F8eb5D7Bd38bFeF7dEb0fBc02cf3778a0';
  const exchanges = ["0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F", "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"]; // routers for Sushiswap and Uniswap
  const daiABI = [{"inputs":[{"internalType":"uint256","name":"chainId_","type":"uint256"}],"payable":false,"stateMutability":"nonpayable","type":"constructor"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"src","type":"address"},{"indexed":true,"internalType":"address","name":"guy","type":"address"},{"indexed":false,"internalType":"uint256","name":"wad","type":"uint256"}],"name":"Approval","type":"event"},{"anonymous":true,"inputs":[{"indexed":true,"internalType":"bytes4","name":"sig","type":"bytes4"},{"indexed":true,"internalType":"address","name":"usr","type":"address"},{"indexed":true,"internalType":"bytes32","name":"arg1","type":"bytes32"},{"indexed":true,"internalType":"bytes32","name":"arg2","type":"bytes32"},{"indexed":false,"internalType":"bytes","name":"data","type":"bytes"}],"name":"LogNote","type":"event"},{"anonymous":false,"inputs":[{"indexed":true,"internalType":"address","name":"src","type":"address"},{"indexed":true,"internalType":"address","name":"dst","type":"address"},{"indexed":false,"internalType":"uint256","name":"wad","type":"uint256"}],"name":"Transfer","type":"event"},{"constant":true,"inputs":[],"name":"DOMAIN_SEPARATOR","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"PERMIT_TYPEHASH","outputs":[{"internalType":"bytes32","name":"","type":"bytes32"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"address","name":"","type":"address"}],"name":"allowance","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"usr","type":"address"},{"internalType":"uint256","name":"wad","type":"uint256"}],"name":"approve","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"balanceOf","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"usr","type":"address"},{"internalType":"uint256","name":"wad","type":"uint256"}],"name":"burn","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"decimals","outputs":[{"internalType":"uint8","name":"","type":"uint8"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"guy","type":"address"}],"name":"deny","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"usr","type":"address"},{"internalType":"uint256","name":"wad","type":"uint256"}],"name":"mint","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"src","type":"address"},{"internalType":"address","name":"dst","type":"address"},{"internalType":"uint256","name":"wad","type":"uint256"}],"name":"move","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"name","outputs":[{"internalType":"string","name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"nonces","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"holder","type":"address"},{"internalType":"address","name":"spender","type":"address"},{"internalType":"uint256","name":"nonce","type":"uint256"},{"internalType":"uint256","name":"expiry","type":"uint256"},{"internalType":"bool","name":"allowed","type":"bool"},{"internalType":"uint8","name":"v","type":"uint8"},{"internalType":"bytes32","name":"r","type":"bytes32"},{"internalType":"bytes32","name":"s","type":"bytes32"}],"name":"permit","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"usr","type":"address"},{"internalType":"uint256","name":"wad","type":"uint256"}],"name":"pull","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"usr","type":"address"},{"internalType":"uint256","name":"wad","type":"uint256"}],"name":"push","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"guy","type":"address"}],"name":"rely","outputs":[],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"symbol","outputs":[{"internalType":"string","name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[],"name":"totalSupply","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"dst","type":"address"},{"internalType":"uint256","name":"wad","type":"uint256"}],"name":"transfer","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":false,"inputs":[{"internalType":"address","name":"src","type":"address"},{"internalType":"address","name":"dst","type":"address"},{"internalType":"uint256","name":"wad","type":"uint256"}],"name":"transferFrom","outputs":[{"internalType":"bool","name":"","type":"bool"}],"payable":false,"stateMutability":"nonpayable","type":"function"},{"constant":true,"inputs":[],"name":"version","outputs":[{"internalType":"string","name":"","type":"string"}],"payable":false,"stateMutability":"view","type":"function"},{"constant":true,"inputs":[{"internalType":"address","name":"","type":"address"}],"name":"wards","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"payable":false,"stateMutability":"view","type":"function"}];

  before("Deploy contracts", async () => {
    const FlashLender = await ethers.getContractFactory("FlashLender");
    flashLender = await FlashLender.deploy(
      supportedTokens,
      fee,
      chainlinkPriceFeeds,
      tellorPriceFeeds,
      tellorAddress,
      exchanges
    );
    await flashLender.deployed();

    const FlashBorrower = await ethers.getContractFactory("FlashBorrower");
    flashBorrower = await FlashBorrower.deploy(flashLender.address);
    await flashBorrower.deployed();

    const [account] = await ethers.getSigners();
    dai = new ethers.Contract(
      "0x6B175474E89094C44Da98b954EedeAC495271d0F",
      daiABI,
      account
    )
  });

  it("FlashLender and FlashBorrower deployed successfully", async () => {
    expect(flashLender.address);
    expect(flashBorrower.address);
  });

  it("Can deposit tokens to FlashLender", async () => {
    // Swap ETH for DAI
    const [account] = await ethers.getSigners();
    const amount = 500;

    await flashLender.connect(account).swapETHForDAI({value: ethers.utils.parseEther(amount.toString())});
    const balance = await dai.balanceOf(account.address);
    expect(parseFloat(ethers.utils.formatEther(balance))).to.be.greaterThan(0);
    
    const balanceInt = parseFloat(ethers.utils.formatEther(balance));
    const deposit = balanceInt * 0.7;
    const borrowerDeposit = balanceInt * 0.1;

    // Deposit into FlashLender contract
    await dai.connect(account).approve(flashLender.address, ethers.utils.parseEther(`${deposit}`));
    await dai.connect(account).transferFrom(account.address, flashLender.address, ethers.utils.parseEther(`${deposit}`));

    // Deposit some DAI into FlashBorrower contract
    await dai.connect(account).approve(flashBorrower.address, ethers.utils.parseEther(`${borrowerDeposit}`));
    await dai.connect(account).transferFrom(account.address, flashBorrower.address, ethers.utils.parseEther(`${borrowerDeposit}`));

    const lenderBalance = await dai.balanceOf(flashLender.address);
    const borrowerBalance = await dai.balanceOf(flashBorrower.address);
    expect(lenderBalance).to.equal(ethers.utils.parseEther(`${deposit}`));
    expect(borrowerBalance).to.equal(ethers.utils.parseEther(`${borrowerDeposit}`));
    expect(parseFloat(ethers.utils.formatEther(lenderBalance))).to.be.greaterThan(0);
    expect(parseFloat(ethers.utils.formatEther(borrowerBalance))).to.be.greaterThan(0);
  });


  it("Able to get tellor oracle price", async () => {
    const price = await flashLender.getLatestPriceFromTellor("0x4746DeC9e833A82EC7C2C1356372CcF2cfcD2F3D");
    console.log(ethers.utils.formatEther(price));
    expect(ethers.utils.formatEther(price));
  });

  it("Able to get chainlink oracle price", async () => {
    try {
      await flashLender.getLatestPriceFromChainlink("0xAed0c38402a5d19df6E4c03F4E2DceD6e29c1ee9");
    } catch (error) {
      expect.fail();
    }
    // console.log(ethers.BigNumber.from(price));
    // expect(ethers.BigNumber.from(price));
  });

  it("FlashBorrower can execute flashloan transaction", async () => {
    await flashBorrower.flashBorrow(dai.address, ethers.utils.parseEther('1000'));
    expect(true);
  });

  //Based on prices brought in by both oracles
  it("Flashloan reverts when price of token falls below slippage tolerance");
})
