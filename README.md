# Upgradable Contract 란?

업그레이더블(Upgradable) 컨트랙트는 프록시 패턴에 기반한다. 프록시 패턴이란 클라이언트와 스마트 컨트랙트 중간 계층으로, 클라이언트가 스마트 컨트랙트에 직접 접근하는 것이 아니라 프록시 컨트랙트를 통해 간접적으로 접근하도록 한느 패턴이다.
이런 프록시 패턴은 fallback() 함수와 delegate_call() 함수, 이 두 가지 함수의 메커니즘이 함께 사용되어 구현된다.

> 프록시 패턴 참고: https://blog.openzeppelin.com/proxy-patterns/

### fallback() 함수의 역할

Solidity에서 fallback 함수가 호출되는 조건은 다음과 같다.

- EOA 또는 CA에서 특정 컨트랙트로 이더를 전송하는 경우
- 컨트랙트에 **존재하지 않는 함수를 호출할 때**
- 컨트랙트가 다른 컨트랙트로부터 델리게이트 콜을 받는 경우

최초의 호출하는 계정은 중계 역할을하는 프록시 컨트랙트에 존재하지 않는 함수를 호출하여 fallback() 함수를 발동시키게되고 이 fallback() 함수 내부에서는 delegate_call()을 사용하여 최초 호출 계정으로부터 전달된 펑션시그와 데이터를 로직을 담당하는 임플리멘트 컨트랙트에 전달한다.

### delegate_call()의 역할

![https://twitter.com/definikola/status/1512100191804997640](https://velog.velcdn.com/images/choyeah/post/3f7c60b3-d1fb-438c-a7cb-b6ac862d2894/image.jpeg)

델리게이트 콜은 호출된 컨트랙트의 코드를 호출자의 컨텍스트에서 실행하는 메커니즘이다.
프록시 컨트랙트를 통해 임플리멘트(로직) 컨트랙트의 함수를 실행할 때, 프록시 컨트랙트의 컨텍스트에서 코드가 실행되므로 프록시 컨트랙트의 상태가 변경된다. 프록시 컨트랙트에 데이터가 저장되는 원리이다.

# Proxy 컨트랙트 사용 예시

```
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/proxy/Proxy.sol";

contract ERCProxy is Proxy {

    address public implementation;

    constructor(address _impleAddress, CampaignParams memory _campaignParams) {
        implementation = _impleAddress;
    }

    function _implementation() internal view override returns (address) {
        return implementation;
    }
}

```

1. 프록시 컨트랙트를 상속받은 후
2. 생성자에서 임플리멘트 컨트랙트 주소를 전달하여 저장한다.
3. 단순히 임플 컨트랙트 주소를 리턴하는 \_implementation()를 구현해준다.
4. 이제 Proxy 컨트랙트를 상속받은 ERCProxy 컨트랙트에 임플 컨트랙트에 존재하는 함수를 데이터(인자들)와 함께 호출해주면 Proxy 컨트랙트의 fallback() 함수를 타고 임플 컨트랙트의 특정 함수를 델리게이트 콜 하게된다.
5. 만약 임플 컨트랙트에 수정 사항이 생긴다면 새로운 임플 컨트랙트를 재 작성/배포 후 implementation 변수를 새로운 임플 컨트랙트 주소로 업데이트한다.

> [OpenZeppelin Proxy contract 코드](https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/proxy/Proxy.sol)

# initialize()

프록시 패턴에서는 프록시 컨트랙트가 로직 컨트랙트의 생성자를 호출할 수 없다.
로직 컨트랙트 배포시에 생성자가 딱 한 번만 호출되고 이 생성자는 다른 컨트랙트에 의해 호출될 수 없기 때문이다.

로직 컨트랙트가 배포되거나 업그레이드된 상황에서 프록시 컨트랙트는 로직 컨트랙트에 상태 값, 예를들어 로직 컨트랙트의 주소 저장과 같은 상태변수 초기화 또는 변경이 필요한데 생성자를 사용할 수 없으니 생성자와 유사한 라이프사이클에서 단 한번만 호출되도록 설계된 initialize() 함수를 고안하게 되었다.

참고로 프록시에서 로직 컨트랙트의 initialize() 함수를 통해 로직 컨트랙트의 주소를 상태 변수에 저장한다면 그것은 델리게이트콜에 의하여 프록시 컨트랙트의 컨텍스트이기 때문에 저장은 프록시 컨트랙트에 저장된다.

# openzeppelin upgrades 플러그인

openzeppelin Upgrades 플러그인은 업그레이더블 컨트랙트를 쉽게 배포, 업그레이드, 관리자 권한 관리, 테스트할 수 있도록 돕는다. 개발자가 프록시 컨트랙트를 따로 작성할 필요가 없고 배포와, 업그레이드, 관리자 권한 변경 기능을 함수로 제공한다.

upgrades 플러그인은 UUPS, transparent, 비콘 프록시 패턴을 지원한다.

- UUPS:
  로직 컨트랙트가 자신을 업그레이드할 수 있는 기능을 내장하고 있다. 가장 흔히 사용되며 오픈제플린에서도 UUPS 프록시 패턴 사용을 가장 권장한다.
- Transparent:
  로직 컨트랙트 주소를 업그레이드하는 함수는 프록시, 로직 두 컨트랙트에 존재하나 사용자 어카운트와 어드민 어카운트의 함수 호출 대상 컨트랙트를 다르게 한다. (어드민 계정은 프록시 컨트랙트로, 사용자 계정은 로직 컨트랙트로)
  이로써 함수 충돌 이슈를 해소한다.
- Beacon:
  여러 프록시 컨트랙트가 하나의 비콘 컨트랙트로부터 로직 컨트랙트의 주소를 얻는 방식으로, 모든 프록시는 이 비콘 컨트랙트를 통해 업그레이드된 로직 컨트랙트 주소를 얻어 접근.
  > [프록시 패턴 종류들 참고](https://velog.io/@choyeah/%ED%94%84%EB%A1%9D%EC%8B%9C-%ED%8C%A8%ED%84%B4%EC%9D%98-%EC%A2%85%EB%A5%98)

UUPS 및 transparent 프록시의 경우 deployProxy 및 upgradeProxy 함수를 사용하고,
비콘 프록시의 경우 deployBeacon, deployBeaconProxy 및 upgradeBeacon 함수를 사용한다.

> - [스마트 컨트랙트 업그레이드 관련 설명](https://docs.openzeppelin.com/learn/upgrading-smart-contracts)
> - [upgrades 플러그인 공식 문서](https://docs.openzeppelin.com/upgrades-plugins/1.x/)

# openzeppelin upgrades 플러그인을 이용한 배포 & 업그레이드

### 최초 프록시 & 임플리멘테이션 배포 스크립트

```
import { ethers, upgrades } from "hardhat";

async function main() {
  const Box = await ethers.getContractFactory("Box");
  const proxyInstance = await upgrades.deployProxy(Box, [42], {initializer: 'store'});
  await proxyInstance.deployed();
  console.log("Box Proxy deployed to:", proxyInstance.address);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
```

```
npx hardhat run scripts/create-box.ts --network {}
Box Proxy deployed to: 0x0F20c143a98CdfB3a1487278Bcd310296c674498
```

### 업그레이드 스크립트

```
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
```

```
npx hardhat run scripts/upgrade-box.ts --network {}
BoxV2 Implemantaion address will be : 0x4C18BB1a60fb0b9fF5747658cEC416CB91a9AE43
upgraded to same proxy address :  0x0F20c143a98CdfB3a1487278Bcd310296c674498
```

Impelmantion 컨트렉트는 새로운 v2 컨트랙트 주소로 배포되고, 유저와 상호작용하는 프록시 주소는 동일한 주소로업그레이드 된다.

> [upgrades 플러그인 튜토리얼 문서](https://forum.openzeppelin.com/t/openzeppelin-upgrades-step-by-step-tutorial-for-hardhat/3580)

# 테스트

### TEST1 - tutorial_hardhat/test/Box.ts

- 로직 컨트랙트를 배포하고
- 로직 컨트랙트의 기능을 테스트

```
import { expect } from 'chai';
import { Contract } from 'ethers';
import { ethers } from 'hardhat';
  // contracts
  let box: Contract;

  // Start test block
  describe('Box', function () {
    beforeEach(async function () {
      const Box = await ethers.getContractFactory("Box");
      box = await Box.deploy();
      await box.deployed();
      console.log("box deployed",box.address);
    });

    // Test case
    it('retrieve returns a value previously stored', async function () {
      // Store a value
      await box.store(42);

      // Test if the returned value is the same one
      // Note that we need to use strings to compare the 256 bit integers
      expect((await box.retrieve()).toString()).to.equal('42');
    });
  });
```

### TEST2 - /tutorial_hardhat/test/Box.Proxy.ts

- 로직 컨트랙트를 배포
- 프록시 컨트랙트 배포 & 로직 컨트랙트와 바인딩 (초기 실행 함수 지정, 인자 값 설정)
- 프록시 컨트랙트 주소로부터 로직 컨트랙트의 주소 구하기
  `upgrades.erc1967.getImplementationAddress(boxProxy.address);`
- 프록시 컨트랙트를 통해 초기화 시켰던 데이터가 정상 출력 되는지 확인

```
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

```

### TEST3 - /tutorial_hardhat/test/BoxV2.ts

- 새로운 로직 컨트랙트(BoxV2) 배포
- 로직 컨트랙트 기능 테스트

```
import { expect } from 'chai';
import { Contract } from 'ethers';
import { ethers, upgrades } from 'hardhat';
  // contracts
  let boxV2: Contract;

// Start test block
describe('BoxV2', function () {
  beforeEach(async function () {
    const BoxV2 = await ethers.getContractFactory("BoxV2");
    boxV2 = await BoxV2.deploy();
    await boxV2.deployed();
    console.log("boxV2 deployed",boxV2.address);
  });

  // Test case
  it('retrieve returns a value previously stored', async function () {
    // Store a value
    await boxV2.store(42);

    // Test if the returned value is the same one
    // Note that we need to use strings to compare the 256 bit integers
    expect((await boxV2.retrieve()).toString()).to.equal('42');
  });

  // Test case
  it('retrieve returns a value previously incremented', async function () {
    // Increment
    await boxV2.increment();

    // Test if the returned value is the same one
    // Note that we need to use strings to compare the 256 bit integers
    expect((await boxV2.retrieve()).toString()).to.equal('1');
  });
});
```

### TEST4 - /tutorial_hardhat/test/BoxV2Proxy.ts

- 로직V1 컨트랙트 배포 & 로직V1 프록시 배포
- 로직V2 컨트랙트 배포 & 로직V2로 업그레이드
- 프록시를 통해 업그레이드 정상 동작 확인

```
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

```

# 주의 사항 - Storage Collision

새로운 기능이나 버그 수정으로 인해 컨트랙트의 새 버전을 작성할 때, 준수해야할 스토리지 레이아웃 제한 사항이 있다. 전반적으로 컨트랙트 상태 변수의 선언 순서와 타입을 변경할 수 없는 내용들이다.

이런 스토리지 레이아웃 제한을 위반하면 업그레이드된 컨트랙트와 기존 스토리지와의 스토리지 충돌(Storage Collision)이 발생하여 애플리케이션에 심각한 오류가 발생될 수 있으므로 각별한 주의가 필요하다.

실제로 업그레이더블 컨트랙트를 작성할 때는 기존의 로직 컨트랙트를 상속해서 작성하여 기존의 변수 선언에 변화가 없도록 하는것이 일반적이다.

> https://forum.openzeppelin.com/t/korean-writing-upgradeable-contracts/2007

# 업그레이더블 컨트랙트 관련 참고

- [[업그레이더블 컨트랙트 씨-리즈] Part 1 ](https://medium.com/@aiden.p/%EC%97%85%EA%B7%B8%EB%A0%88%EC%9D%B4%EB%8D%94%EB%B8%94-%EC%BB%A8%ED%8A%B8%EB%9E%99%ED%8A%B8-%EC%94%A8-%EB%A6%AC%EC%A6%88-part-1-%EC%97%85%EA%B7%B8%EB%A0%88%EC%9D%B4%EB%8D%94%EB%B8%94-%EC%BB%A8%ED%8A%B8%EB%9E%99%ED%8A%B8%EB%9E%80-b433225ebf58)

- [스토리지 레이아웃, 스토리지 슬롯, 스토리지 콜리전 참고](https://medium.com/@aiden.p/%EC%97%85%EA%B7%B8%EB%A0%88%EC%9D%B4%EB%8D%94%EB%B8%94-%EC%BB%A8%ED%8A%B8%EB%9E%99%ED%8A%B8-%EC%94%A8-%EB%A6%AC%EC%A6%88-part-2-%ED%94%84%EB%A1%9D%EC%8B%9C-%EC%BB%A8%ED%8A%B8%EB%9E%99%ED%8A%B8-%ED%95%B4%EC%B2%B4-%EB%B6%84%EC%84%9D%ED%95%98%EA%B8%B0-95924cb969f0)
