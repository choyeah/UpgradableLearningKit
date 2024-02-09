import { expect } from "chai";
import { Contract } from "ethers";
import { ethers, upgrades } from "hardhat";
import { getImplementationAddress } from "@openzeppelin/upgrades-core";

// contracts
let boxProxy: Contract;

// Start test block
describe("Box (proxy)", function () {
  beforeEach(async function () {
    const Box = await ethers.getContractFactory("Box");
    boxProxy = await upgrades.deployProxy(Box, [42], { initializer: "store" });
    console.log("boxProxy deployProxy", boxProxy.address);
    const currentImplAddress = await upgrades.erc1967.getImplementationAddress(
      boxProxy.address
    );
    console.log("currentImplAddress", currentImplAddress);
  });

  // Test case
  it("retrieve returns a value previously initialized", async function () {
    // Test if the returned value is the same one
    // Note that we need to use strings to compare the 256 bit integers
    expect((await boxProxy.retrieve()).toString()).to.equal("42");
  });
});
