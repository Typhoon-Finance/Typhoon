const { expect, assert } = require("chai");
const { ethers } = require("hardhat");

describe("Flashloan using Aave V2 Protocol", function () {
  it("Flashloan contract can deploy successfully", async function () {
    const lendingPoolAddressProvider = "0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5";

    const Flashloan = await ethers.getContractFactory("Flashloan");
    const flashloan = await Flashloan.deploy(lendingPoolAddressProvider);
    await flashloan.deployed();
    assert(flashloan.address);
  });
});
