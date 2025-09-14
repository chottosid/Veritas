# Veritas Blockchain

This is the blockchain component of Veritas, a comprehensive blockchain-based justice management system. It contains smart contracts for managing justice events and case proceedings.

## Project Overview

This blockchain project includes:

- Smart contracts for justice event management
- Hardhat configuration for development and deployment
- Deployment scripts for various networks
- Integration with the main Veritas application

## Usage

### Running Tests

To run all the tests in the project, execute the following command:

```shell
npx hardhat test
```

You can also selectively run the Solidity or `mocha` tests:

```shell
npx hardhat test solidity
npx hardhat test mocha
```

### Deploy Smart Contracts

This project includes deployment scripts for smart contracts. You can deploy contracts to a locally simulated chain or to various testnets.

To run the deployment to a local chain:

```shell
npx hardhat ignition deploy ignition/modules/Counter.ts
```

To deploy to a testnet, you need an account with funds to send the transaction. Configure your private key in the environment variables or Hardhat configuration.

Example deployment to a testnet:

```shell
npx hardhat ignition deploy --network <network-name> ignition/modules/Counter.ts
```
