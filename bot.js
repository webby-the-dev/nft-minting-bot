import "dotenv/config";
import ethers from "ethers";
import axios from "axios";

const etherscanAbiLink =
  process.env.NETWORK === "rinkeby"
    ? `https://api-rinkeby.etherscan.io/api?module=contract&action=getabi&address=${process.env.CONTRACT_ADDRESS}&apikey=${process.env.ETHERSCAN_API_KEY}`
    : `https://api.etherscan.io/api
?module=contract
&action=getabi
&address=${process.env.CONTRACT_ADDRESS}
&apikey=${process.env.ETHERSCAN_API_KEY}`;

const data = await axios.get(etherscanAbiLink);

let ABI = JSON.parse(data.data.result);

const privateKey = process.env.PRIVATE_KEY;

const ADDRESS = process.env.CONTRACT_ADDRESS;
const GAS_LIMIT = 2000000;
const GAS_PRICE = ethers.utils.parseUnits("666", "gwei");

const amount = 1;
const TOKEN_PRICE = ethers.utils.parseEther("0.001");
const INTERVAL = 500;

const provider = new ethers.providers.JsonRpcProvider(process.env.INFURA_API);
const wallet = new ethers.Wallet(privateKey, provider);
const contract = new ethers.Contract(ADDRESS, ABI, wallet);

async function main() {
  try {
    const saleIsActive = !(await contract[
      process.env.SALE_IS_ACTIVE_METHOD_NAME
    ]());
    if (saleIsActive) {
      clearInterval(timer);
      console.log("LFG");
      contract
        .mint(amount, {
          gasLimit: GAS_LIMIT,
          gasPrice: GAS_PRICE,
          nonce: startingNonce,
          value: TOKEN_PRICE * amount,
        })
        .then((data) => {
          const hash = data?.hash;
          if (hash) {
            console.log("Hash:", hash);
          }
        });
    } else {
      console.log("Contract paused, trying again. \n");
    }
  } catch (error) {
    // console.log(error.message);
  }
}

let startingNonce;
let timer;

(async () => {
  startingNonce = await provider.getTransactionCount(wallet.address);
  timer = setInterval(() => {
    main();
  }, INTERVAL);
})();
