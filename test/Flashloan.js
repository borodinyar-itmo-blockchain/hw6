const {loadFixture} = require("@nomicfoundation/hardhat-network-helpers");

const {ethers} = require("hardhat");
const {expect} = require("chai");

const PROVIDER_ADDRESS = "0xB53C1a33016B2DC2fF3653530bfF1848a515c8c5"
const UNISWAP_V2_ROUTER_ADDRESS = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"

const WETH_ADDRESS = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2"
const LINK_ADDRESS = "0x514910771AF9Ca656af840dff83E8264EcF986CA";
const USTD_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7";

const SWAP_EVENT_ABI = [
    "event Swap(address indexed sender, uint amount0In, uint amount1In, uint amount0Out, uint amount1Out, address indexed to)"
]

const SWAP_EVENT_TOPIC = new ethers.utils.Interface(SWAP_EVENT_ABI).getEventTopic("Swap")

describe("Flashloan", function () {
    async function deployFlashloanFixture() {
        const [deployer] = await ethers.getSigners();

        const Flashloan = await ethers.getContractFactory("Flashloan");
        const flashloan = await Flashloan.deploy(
            PROVIDER_ADDRESS,
            UNISWAP_V2_ROUTER_ADDRESS,
            [WETH_ADDRESS, LINK_ADDRESS, USTD_ADDRESS, WETH_ADDRESS]
        );

        console.log("Flashloan deployed to:", flashloan.address);

        const WETH = await ethers.getContractFactory("WETH9");
        const weth = WETH.attach(WETH_ADDRESS);

        // Send some ETH to the contract to be able to pay off debts from a failed flash loan
        weth.connect(deployer).deposit({value: ethers.utils.parseEther("10")});

        return {
            deployer,
            flashloan,
            weth
        };
    }
    async function consoleEvents(events, tokenSymbols) {
        for (let i = 0; i < events.length; i++) {
            const swapEvent = new ethers.utils.Interface(SWAP_EVENT_ABI).parseLog(events[i]);

            const {amount0In, amount1In, amount0Out, amount1Out} = swapEvent.args;

            const token0Symbol = tokenSymbols[i];
            const token1Symbol = tokenSymbols[i + 1];

            console.log("Swap");
            console.log("\tToken0: In: " + amount0In + " " + token0Symbol);
            console.log("\tToken1: In: " + amount1In + " " + token1Symbol);
            console.log("\tToken0: Out: " + amount0Out + " " + token0Symbol);
            console.log("\tToken1: Out: " + amount1Out + " " + token1Symbol);
            console.log();
        }
    }

    it("Take a flash loan and make a trnasaction", async function () {
        const {deployer, flashloan, weth} = await loadFixture(deployFlashloanFixture);

        const amount = ethers.utils.parseEther("1");
        weth.connect(deployer).transfer(flashloan.address, amount);

        const balanceBefore = await weth.balanceOf(flashloan.address);
        console.log("Balance before: ", balanceBefore.toString() + " WETH");

        const tx = await flashloan.flashLoanCall(amount);

        const receipt = await tx.wait();

        const swapEvents = receipt.events.filter(event => event.topics[0] === SWAP_EVENT_TOPIC);

        expect(swapEvents.length).to.equal(3);


        await consoleEvents(swapEvents, ["WETH", "LINK", "USTD", "WETH"]);

        const balanceAfter = await weth.balanceOf(flashloan.address);
        console.log("Balance after: ", balanceAfter.toString() + " WETH");


        if (receipt.status === 1) {
            console.log("Flashloan successful");
        } else {
            console.log("Flashloan failed");
        }

        if (balanceBefore.lt(balanceAfter)) {
            console.log("Flashloan profit: ", balanceAfter.sub(balanceBefore).toString() + " WETH");
        } else {
            console.log("Flashloan loss: ", balanceBefore.sub(balanceAfter).toString() + " WETH");
        }

        console.log("Gas used: ", receipt.gasUsed.toString());
    });
});
  