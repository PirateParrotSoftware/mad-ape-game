// load network.js to get network/chain id
document.body.appendChild(Object.assign(document.createElement("script"), { type: "text/javascript", src: "./network.js" }));
// load web3modal to connect to wallet
document.body.appendChild(Object.assign(document.createElement("script"), { type: "text/javascript", src: "./web3/lib/web3modal.js" }));
// load web3js to create transactions
document.body.appendChild(Object.assign(document.createElement("script"), { type: "text/javascript", src: "./web3/lib/web3.min.js" }));
// uncomment to enable torus wallet
// document.body.appendChild(Object.assign(document.createElement("script"), { type: "text/javascript", src: "https://unpkg.com/@toruslabs/torus-embed" }));
// uncomment to enable walletconnect
// document.body.appendChild(Object.assign(document.createElement("script"), { type: "text/javascript", src: "https://unpkg.com/@walletconnect/web3-provider@1.2.1/dist/umd/index.min.js" }));

// load web3gl to connect to unity
window.web3gl = {
  networkId: 137,
  connect,
  connectAccount: "",
  signMessage,
  signMessageResponse: "",
  sendTransaction,
  sendTransactionResponse: "",
  sendContract,
  sendContractResponse: "",
  sendContractWithArray,
  fetchTokenIds,
  fetchBNNAmount,
  fetchRarity,
  fetchRate,
  fetchIsStaked,
  apeClaim,
  apeStake,
  apeUnstake,
  StakeAllNFTs,
  ClaimAllNFTs,
  FetchBNNAmountForUser,
  SendBNN,
  fetchTransactionResult,
  CheckInternetConnection,
  RequestConnectionStatus
};

// will be defined after connect()
let provider;
let web3;

const baseGas = "0x09184e72a0";

const sdk = new MetaMaskSDK.MetaMaskSDK({
  dappMetadata: {
    name: "Metamask",
    url: window.location.host,
  }
});

/*
paste this in inspector to connect to wallet:
window.web3gl.connect()
*/
async function connect() {
  
  console.log("Start logging process");

  let result = await ethereum
    .request({
      method: 'eth_requestAccounts',
      params: [],
    });

  console.log("Connected");

  let chainResult = await ethereum
          .request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0x89',
                chainName: "Matic Mainnet",
                nativeCurrency: {
                  name: "MATIC",
                  symbol: "MATIC",
                  decimals: 18
                },
                blockExplorerUrls: ['https://polygonscan.com'],
                nativeCurrency: { symbol: 'MATIC', decimals: 18 },
                rpcUrls: ['https://polygon-rpc.com/'],
              },
            ],
          });

  console.log("Chain added");

  // set provider
  provider = ethereum;
  web3 = new Web3(new Web3.providers.HttpProvider("https://practical-neat-spree.matic.quiknode.pro/c6fb548022fc12ef652c60edf20769acf4db4771/"));

  // set current network id
  web3gl.networkId = parseInt(provider.chainId);

  // if current network id is not equal to network id, then switch
  await checkNetwork(web3gl.networkId);

  // set current account
  web3gl.connectAccount = provider.selectedAddress;

  // refresh page if player changes account
  provider.on("accountsChanged", (accounts) => {
	  gameInstance.SendMessage("ClientConnectionHandler", "LogOutIfUserIsNotGuest"); 
  });

  // update if player changes network
  provider.on("chainChanged", async (chainId) => {
    web3gl.networkId = parseInt(chainId);
	  gameInstance.SendMessage("ClientConnectionHandler", "LogOut"); 
    await checkNetwork(web3gl.networkId);
  });
}

async function checkNetwork(networkId) {
  if (networkId != window.web3ChainId) {
    await window.ethereum
      .request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${window.web3ChainId.toString(16)}` }], // chainId must be in hexadecimal numbers
      })
      .catch(() => {
        // window.location.reload();
      });
  }
}

/*
paste this in inspector to connect to sign message:
window.web3gl.signMessage("hello")
*/
async function signMessage(message) {
  try {
    const from = (await web3.eth.getAccounts())[0];
    const signature = await web3.eth.personal.sign(message, from, "");
    window.web3gl.signMessageResponse = signature;
  } catch (error) {
    window.web3gl.signMessageResponse = error.message;
  }
}

/*
paste this in inspector to send eth:
const to = "0xdD4c825203f97984e7867F11eeCc813A036089D1"
const value = "12300000000000000"
const gasLimit = "21000" // gas limit
const gasPrice = "33333333333"
window.web3gl.sendTransaction(to, value, gasLimit, gasPrice);
*/
async function sendTransaction(receiver, value, gasLimit, gasPrice) {
  const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
  
  const transactionParameters = {
    from: accounts[0],
    to: receiver,
    value: value,
    gasPrice: gasPrice ? gasPrice : undefined, // custom gas price
  };
  await ethereum.request({
    method: 'eth_sendTransaction',
    params: [transactionParameters],
  })
  .then(async (hash) => {
    
    window.web3gl.sendTransactionResponse = hash;
  }).catch( async (err)=> {
    
    window.web3gl.sendTransactionResponse = err;
  });
}

/*
paste this in inspector to connect to interact with contract:
const method = "increment"
const abi = `[ { "inputs": [], "name": "increment", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "x", "outputs": [ { "internalType": "uint256", "name": "", "type": "uint256" } ], "stateMutability": "view", "type": "function" } ]`;
const contract = "0xB6B8bB1e16A6F73f7078108538979336B9B7341C"
const args = "[]"
const value = "0"
const gasLimit = "222222" // gas limit
const gasPrice = "333333333333"
window.web3gl.sendContract(method, abi, contract, args, value, gasLimit, gasPrice)
*/
async function sendContract(method, abi, contract, args, value, gasLimit, gasPrice) {
  const from = (await web3.eth.getAccounts())[0];

  new web3.eth.Contract(JSON.parse(abi), contract).methods[method](...JSON.parse(args)).send({
    from,
    value,
    gas: gasLimit ? gasLimit : web3.eth.gasLimit,
    gasPrice: gasPrice ? gasPrice : web3.eth.gasPrice,
  })
  .on("transactionHash", (transactionHash) => {
    window.web3gl.sendContractResponse = transactionHash;
  })
  .on("error", (error) => {
    window.web3gl.sendContractResponse = error.message;
  });
}

async function sendContractWithArray(method, abi, contract, args, value, gasLimit, gasPrice) {
  const from = (await web3.eth.getAccounts())[0];

  new web3.eth.Contract(JSON.parse(abi), contract).methods[method](JSON.parse(args)).send({
    from,
    value,
    gas: gasLimit ? gasLimit : web3.eth.gasLimit,
    gasPrice: gasPrice ? gasPrice : web3.eth.gasPrice,
  })
  .on("transactionHash", (transactionHash) => {
    window.web3gl.sendContractResponse = transactionHash;
  })
  .on("error", (error) => {
    window.web3gl.sendContractResponse = error.message;
  });
}

async function fetchTokenIds(abi, contractAddress, account, nftType) {
  var contract = new web3.eth.Contract(JSON.parse(abi), contractAddress);

  await contract.methods.tokensOfOwner(account).call((err, result) => {
    if(err) {
      console.log(err);
      return;
    }
    var callbackRes = {ids: result, NFTType: nftType};
    gameInstance.SendMessage("UserWallet", "ReceiveTokenIds", JSON.stringify(callbackRes)); 
  });
}

async function fetchBNNAmount(abi, contractAddress, id, nftType) {
  var contract = new web3.eth.Contract(JSON.parse(abi), contractAddress);

  await contract.methods.apeCheckBalance(id).call((err, result) => {
    if(err) {
      console.log(err);
      return;
    }
    var callbackRes = { Id: id, NFTType: nftType, Balance: result };
    gameInstance.SendMessage("BlockchainInteractor", "ReceiveBNNAmount", JSON.stringify(callbackRes)); 
  });
}

async function fetchRarity(abi, contractAddress, id, nftType) {
  var contract = new web3.eth.Contract(JSON.parse(abi), contractAddress);

  await contract.methods.getRarity(id).call((err, result) => {
    if(err) {
      console.log(err);
      return;
    }
    var callbackRes = { Id: id, NFTType: nftType, Rarity: result };
    gameInstance.SendMessage("BlockchainInteractor", "ReceiveRarity", JSON.stringify(callbackRes)); 
  });
}

async function fetchIsStaked(abi, contractAddress, id, nftType) {

  var contract = new web3.eth.Contract(JSON.parse(abi), contractAddress);

  await contract.methods.apeIsStaked(id).call((err, result) => {
    if(err) {
      console.log(err);
      return;
    }
    var callbackRes = { Id: id, NFTType: nftType, IsStaked: result };
    gameInstance.SendMessage("BlockchainInteractor", "ReceiveApeStakedStatus", JSON.stringify(callbackRes)); 
  });
}

async function fetchRate(abi, contractAddress, id, nftType) {
  var contract = new web3.eth.Contract(JSON.parse(abi), contractAddress);

  await contract.methods.getMultiplierForTokenId(id).call((err, result) => {
    if(err) {
      console.log(err);
      return;
    }
    var callbackRes = { Id: id, NFTType: nftType, Rate: result };
    gameInstance.SendMessage("BlockchainInteractor", "ReceiveAccrualRate", JSON.stringify(callbackRes)); 
  });
}

async function fetchTransactionResult(txHash, id) {
  let trx = await web3.eth.getTransactionReceipt(txHash);

  console.log(trx);

  let trxResult = {};
  trxResult.callId = id;

  if(trx == null || trx == undefined) {
    trxResult.status = false;
  }
  else {
    trxResult.status = trx.status;
  }

  gameInstance.SendMessage("BlockchainInteractor", "ReceiveTransactionResult", JSON.stringify(trxResult)); 
}

async function apeStake(abi, contractAddress, id, nftType) {
  var contract = new web3.eth.Contract(JSON.parse(abi), contractAddress);
  const accounts = await ethereum.request({ method: 'eth_requestAccounts' });

  const transactionParameters = {
  from: accounts[0],
    to: contractAddress,
    data: contract.methods.apeStake(id).encodeABI(),
    gasPrice: baseGas, // custom gas price
};
// popup - request the user to sign and broadcast the transaction
  await ethereum.request({
      method: 'eth_sendTransaction',
      params: [transactionParameters],
  }).then(async (hash) => {
	let trx = await web3.eth.getTransactionReceipt(hash);
	
	while(trx == null) {
		trx = await web3.eth.getTransactionReceipt(hash);
		setTimeout(3000);
	}
	await fetchIsStaked(abi, contractAddress, id, nftType);
  }).catch( async(err)=> {
    await fetchIsStaked(abi, contractAddress, id, nftType);
  });
}

async function sendTransactionReceipt(objectName, trxHash) {
  let trx = null;
  while(trx == null || trx == undefined) {
		trx = await web3.eth.getTransactionReceipt(trxHash);
		setTimeout(3000);
	}
  
  gameInstance.SendMessage(objectName, "ReceiveTransactionReceipt", trx); 
}

async function apeUnstake(abi, contractAddress, id, nftType) {

  var contract = new web3.eth.Contract(JSON.parse(abi), contractAddress);
  const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
  
  const transactionParameters = {
    from: accounts[0],
    to: contractAddress,
    data: contract.methods.apeUnstake(id).encodeABI(),
    gasPrice: baseGas, // custom gas price
  };

  await ethereum.request({
    method: 'eth_sendTransaction',
    params: [transactionParameters],
  }).then(async (hash) => {
    let trx = await web3.eth.getTransactionReceipt(hash);
    
    while(trx == null) {
      trx = await web3.eth.getTransactionReceipt(hash);
      setTimeout(3000);
    }
    await fetchIsStaked(abi, contractAddress, id, nftType);
  }).catch( async (err)=> {
    await fetchIsStaked(abi, contractAddress, id, nftType);
  });
}

async function apeClaim(abi, contractAddress, id, nftType) {
  var contract = new web3.eth.Contract(JSON.parse(abi), contractAddress);
  const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
  
  const transactionParameters = {
    from: accounts[0],
    to: contractAddress,
    data: contract.methods.apeClaim(id).encodeABI(),
    gasPrice: baseGas, // custom gas price
  };
  await ethereum.request({
    method: 'eth_sendTransaction',
    params: [transactionParameters],
  })
  .then(async (hash) => {
    let trx = await web3.eth.getTransactionReceipt(hash);
    
    while(trx == null) {
      trx = await web3.eth.getTransactionReceipt(hash);
      setTimeout(3000);
    }
    await fetchBNNAmount(abi, contractAddress, id, nftType);
  }).catch( async (err)=> {
    await fetchBNNAmount(abi, contractAddress, id, nftType);
  });
}

async function StakeAllNFTs(abi, contractAddress, ids, nftType) {
  var contract = new web3.eth.Contract(JSON.parse(abi), contractAddress);
  const accounts = await ethereum.request({ method: 'eth_requestAccounts' });

  var nfts = JSON.parse(ids);
  let raw = contract.methods.apeMultiStake(nfts).encodeABI();
  let fee = (parseInt(baseGas, 16) * nfts.length / 10);
  let minFee = (parseInt(baseGas, 16));
  
  const transactionParameters = {
    from: accounts[0],
    to: contractAddress,
    data: raw,
    gasPrice: (fee > minFee ? fee : minFee).toString(16), // custom gas price
  };

  await ethereum.request({
      method: 'eth_sendTransaction',
      params: [transactionParameters],
  }).then(async (hash) => {
    let trx = await web3.eth.getTransactionReceipt(hash);
    
    while(trx == null) {
      trx = await web3.eth.getTransactionReceipt(hash);
      setTimeout(3000);
    }
    for(let i = 0; i < nfts.length; i++) {
      await fetchIsStaked(abi, contractAddress, nfts[i], nftType);
    }

  }).catch( async (err)=> {
    for(let i = 0; i < nfts.length; i++) {
      await fetchIsStaked(abi, contractAddress, nfts[i], nftType);
    }
  });
}

async function ClaimAllNFTs(abi, contractAddress, ids, nftType) {
  var contract = new web3.eth.Contract(JSON.parse(abi), contractAddress);
  const accounts = await ethereum.request({ method: 'eth_requestAccounts' });

  var nfts = JSON.parse(ids);
  console.log(nfts);
  let fee = (parseInt(baseGas, 16) * nfts.length / 10);
  let minFee = (parseInt(baseGas, 16));
  
  const transactionParameters = {
    from: accounts[0],
    to: contractAddress,
    data: contract.methods.apeMultiClaim(nfts).encodeABI(),
    gasPrice: (fee > minFee ? fee : minFee).toString(16), // custom gas price
  };

  await ethereum.request({
      method: 'eth_sendTransaction',
      params: [transactionParameters],
  }).then(async (hash) => {
    let trx = await web3.eth.getTransactionReceipt(hash);
    
    while(trx == null) {
      trx = await web3.eth.getTransactionReceipt(hash);
      setTimeout(3000);
    }
    for(let i = 0; i < nfts.length; i++) {
      await fetchBNNAmount(abi, contractAddress, nfts[i], nftType);
    }

  }).catch( async (err)=> {
    for(let i = 0; i < nfts.length; i++) {
      await fetchBNNAmount(abi, contractAddress, nfts[i], nftType);
    }
  });
}

const BNN_CONTRACT = "0x31E480D9Ec9FD36F5FAfF6c9F4875772d8B0e621";
const ERC20_ABI = [
  {
    constant: true,
    inputs: [
      {
        name: "_owner",
        type: "address",
      },
    ],
    name: "balanceOf",
    outputs: [
      {
        name: "balance",
        type: "uint256",
      },
    ],
    payable: false,
    type: "function",
  },
  {
    constant: false,
    inputs: [
     {
      name: "_to",
      type: "address"
     },
     {
      name: "_value",
      type: "uint256"
     }
    ],
      name: "transfer",
      outputs: [
     {
      name: "",
      type: "bool"
     }
    ],
    type: "function"
   }
];

async function FetchBNNAmountForUser(address) {
  const contract = new web3.eth.Contract(ERC20_ABI, BNN_CONTRACT);
  const tokenBalance = await contract.methods.balanceOf(address).call();
  const res = web3.utils.fromWei(tokenBalance, "ether");
  gameInstance.SendMessage("UserWallet", "ReceiveBNNAmount", res); 
}

function CheckInternetConnection()
{
  var xhr = new XMLHttpRequest();
  var url = self.location.origin + '?cache=' + Date.now();
  xhr.open('GET', url, true);
  xhr.timeout = 4000; 

  xhr.onload = function () 
  {
    if (xhr.status >= 200 && xhr.status < 400) {
          console.log("CheckInternetConnection true");
          gameInstance.SendMessage('ClientConnectionHandler', 'OnInternetConnectionChecked', 1);
    } 
    else 
    {
        console.log("CheckInternetConnection false");
        gameInstance.SendMessage('ClientConnectionHandler', 'OnInternetConnectionChecked', 0);
    }
  };
  
  xhr.onerror = function () 
  {
    console.log("CheckInternetConnection onError");
    gameInstance.SendMessage('ClientConnectionHandler', 'OnInternetConnectionChecked', 0);
  };

  xhr.send();
    
}


document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    console.log("SetTabStatus visible");
    gameInstance.SendMessage('ClientAPI', 'SetTabStatus', 1);
  } else {
    console.log("SetTabStatus not visible");
    gameInstance.SendMessage('ClientAPI', 'SetTabStatus', 0);
  }
});

async function RequestConnectionStatus() {
  while (true) {

    // Send the message to Unity
    gameInstance.SendMessage('ClientAPI', 'RequestConnectionStatusContinuously');

    // Wait for 3 seconds before sending the next message
    await new Promise(resolve => setTimeout(resolve, 3000));
  }
}

async function SendBNN(value) {       
  const contractInstance = new web3.eth.Contract(ERC20_ABI, BNN_CONTRACT);
  
  let contractData = contractInstance.methods.transfer('0x000FE638Bae3230b81F354550DFD54B512aA41B4', web3.utils.toWei(value.toString()).toString() ).encodeABI();

  if (window.ethereum) {
    const ethereum = window.ethereum;
    const Web3 = window.Web3;
    const web3 = new Web3(ethereum);
    try {
      ethereum.enable().then(accounts => {
        const from = accounts[0];
        web3.eth.sendTransaction(
          {
            from,
            to: contractInstance._address,
            data: contractData,
            gasPrice: baseGas
          },
          async (err, res) => {
            console.log("Result");
            console.log(res);

            let trx = await web3.eth.getTransactionReceipt(res);
    
            while(trx == null) {
              trx = await web3.eth.getTransactionReceipt(res);
              setTimeout(3000);
            }

            FetchBNNAmountForUser(from);

            setTimeout(3000);
            gameInstance.SendMessage("UAccountSettings", "ListenToBNNAmountChange"); 
          }
        );
      });
    } catch (error) {
      reject(error);
    }
  } 
}
