// scripts/upgrade-box.js
import { ethers, upgrades } from "hardhat";

const proxyAddress = "0x8d33046c43808974d76C2874c8BbA8eDc06EF495";
async function upgrade() {
  const BoxV2 = await ethers.getContractFactory("BoxV2");

  console.log("Preparing upgrade...");
  // upgrades.prepareUpgrade() 함수는 새로운 임플 컨트랙트 주소를 반환
  const boxV2Address = await upgrades.prepareUpgrade(proxyAddress, BoxV2);
  console.log("BoxV2 Implemantaion address will be :", boxV2Address);
  const boxV2Proxy = await upgrades.upgradeProxy(proxyAddress, BoxV2);
  console.log("upgraded to same proxy address : ", boxV2Proxy.address);
}

upgrade();
