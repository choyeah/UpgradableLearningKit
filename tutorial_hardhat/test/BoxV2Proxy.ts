import { expect } from "chai";
import { Contract } from "ethers";
import { ethers, upgrades } from "hardhat";
// contracts
let boxProxy: Contract;
let boxV2Proxy: Contract;
// Start test block
describe("BoxV2 (proxy)", function () {
  beforeEach(async function () {
    const Box = await ethers.getContractFactory("Box");
    const BoxV2 = await ethers.getContractFactory("BoxV2");

    boxProxy = await upgrades.deployProxy(Box, [42], { initializer: "store" });
    console.log("deployProxy", boxProxy.address);
    let boxV2Implentaion = await upgrades.prepareUpgrade(
      boxProxy.address,
      BoxV2
    );
    console.log("implementation V2 address : ", boxV2Implentaion);
    boxV2Proxy = await upgrades.upgradeProxy(boxProxy.address, BoxV2);
    console.log("upgradeProxy", boxV2Proxy.address);
  });

  // Test case
  it("retrieve returns a value previously incremented", async function () {
    // Increment
    await boxV2Proxy.increment();

    // Test if the returned value is the same one
    // Note that we need to use strings to compare the 256 bit integers
    expect((await boxV2Proxy.retrieve()).toString()).to.equal("43");
  });
});
