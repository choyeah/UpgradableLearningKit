// scripts/create-box.js
import { ethers, upgrades } from "hardhat";

async function main() {
  const Box = await ethers.getContractFactory("Box");
  const proxyInstance = await upgrades.deployProxy(Box, [42], {
    initializer: "store",
  });
  await proxyInstance.deployed();
  console.log("Box Proxy deployed to:", proxyInstance.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
