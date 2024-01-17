"use strict";

/**
 * Example JavaScript code that interacts with the page and Web3 wallets
 */

 // Unpkg imports
const Web3Modal = window.Web3Modal.default;
const WalletConnectProvider = window.WalletConnectProvider.default;
const Fortmatic = window.Fortmatic;
const evmChains = window.evmChains;

// Web3modal instance
let web3Modal

// Chosen wallet provider given by the dialog window
let provider;


// Address of the selected account
let selectedAccount;


/**
 * Setup the orchestra
 */
function init() {

  console.log("Initializing example");
  console.log("WalletConnectProvider is", WalletConnectProvider);
  console.log("Fortmatic is", Fortmatic);
  console.log("window.web3 is", window.web3, "window.ethereum is", window.ethereum);

  // Check that the web page is run in a secure context,
  // as otherwise MetaMask won't be available
  if(location.protocol !== 'https:' && false) {
    // https://ethereum.stackexchange.com/a/62217/620
    const alert = document.querySelector("#alert-error-https");
    alert.style.display = "block";
    document.querySelector("#btn-connect").setAttribute("disabled", "disabled")
    return;
  }

  const MMSDK = new MetaMaskSDK.MetaMaskSDK(
    {
      dappMetadata: {
        name: "Example Pure JS Dapp",
        url: window.location.host,
      }
      // Other options
    }
  )
  // Because init process of the MetaMaskSDK is async.
  setTimeout(() => {
    // Tell Web3modal what providers we have available.
    // Built-in web browser provider (only one can exist as a time)
    // like MetaMask, Brave or Opera is added automatically by Web3modal
    const providerOptions = {
      injected: {
        display: {
          logo: 'data:image/png;base64,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',
          name: 'Metamask',
          description: 'Connect with the provider in your Browser',
        },
        package: window.etherium,
      },
      walletconnect: {
        package: WalletConnectProvider,
        options: {
          infuraId: "INFURA_ID" 
        }
      },
    };

    web3Modal = new Web3Modal({
      cacheProvider: false, // optional
      providerOptions, // required
      disableInjectedProvider: false, // optional. For MetaMask / Brave / Opera.
    });

    console.log("Web3Modal instance is", web3Modal);
  }, 0)

}


/**
 * Kick in the UI action after Web3modal dialog has chosen a provider
 */
async function fetchAccountData() {

  // Get a Web3 instance for the wallet
  const web3 = new Web3(provider);

  console.log("Web3 instance is", web3);

  // Get connected chain id from Ethereum node
  const chainId = await web3.eth.getChainId();
  // Load chain information over an HTTP API
  const chainData = evmChains.getChain(chainId);
  document.querySelector("#network-name").textContent = chainData.name;

  // Get list of accounts of the connected wallet
  const accounts = await web3.eth.getAccounts();

  // MetaMask does not give you all accounts, only the selected account
  console.log("Got accounts", accounts);
  selectedAccount = accounts[0];

  document.querySelector("#selected-account").textContent = selectedAccount;

  // Get a handl
  const template = document.querySelector("#template-balance");
  const accountContainer = document.querySelector("#accounts");

  // Purge UI elements any previously loaded accounts
  accountContainer.innerHTML = '';

  // Go through all accounts and get their ETH balance
  const rowResolvers = accounts.map(async (address) => {
    const balance = await web3.eth.getBalance(address);
    // ethBalance is a BigNumber instance
    // https://github.com/indutny/bn.js/
    const ethBalance = web3.utils.fromWei(balance, "ether");
    const humanFriendlyBalance = parseFloat(ethBalance).toFixed(4);
    // Fill in the templated row and put in the document
    const clone = template.content.cloneNode(true);
    clone.querySelector(".address").textContent = address;
    clone.querySelector(".balance").textContent = humanFriendlyBalance;
    accountContainer.appendChild(clone);
  });

  // Because rendering account does its own RPC commucation
  // with Ethereum node, we do not want to display any results
  // until data for all accounts is loaded
  await Promise.all(rowResolvers);

  // Display fully loaded UI for wallet data
  document.querySelector("#prepare").style.display = "none";
  document.querySelector("#connected").style.display = "block";
}



/**
 * Fetch account data for UI when
 * - User switches accounts in wallet
 * - User switches networks in wallet
 * - User connects wallet initially
 */
async function refreshAccountData() {

  // If any current data is displayed when
  // the user is switching acounts in the wallet
  // immediate hide this data
  document.querySelector("#connected").style.display = "none";
  document.querySelector("#prepare").style.display = "block";

  // Disable button while UI is loading.
  // fetchAccountData() will take a while as it communicates
  // with Ethereum node via JSON-RPC and loads chain data
  // over an API call.
  document.querySelector("#btn-connect").setAttribute("disabled", "disabled")
  await fetchAccountData(provider);
  document.querySelector("#btn-connect").removeAttribute("disabled")
}


/**
 * Connect wallet button pressed.
 */
async function onConnect() {

  console.log("Opening a dialog", web3Modal);
  try {
    provider = await web3Modal.connect();
  } catch(e) {
    console.log("Could not get a wallet connection", e);
    return;
  }

  // Subscribe to accounts change
  provider.on("accountsChanged", (accounts) => {
    fetchAccountData();
  });

  // Subscribe to chainId change
  provider.on("chainChanged", (chainId) => {
    fetchAccountData();
  });

  // Subscribe to networkId change
  provider.on("networkChanged", (networkId) => {
    fetchAccountData();
  });

  await refreshAccountData();
}

/**
 * Disconnect wallet button pressed.
 */
async function onDisconnect() {

  console.log("Killing the wallet connection", provider);

  // TODO: Which providers have close method?
  if(provider.close) {
    await provider.close();

    // If the cached provider is not cleared,
    // WalletConnect will default to the existing session
    // and does not allow to re-scan the QR code with a new wallet.
    // Depending on your use case you may want or want not his behavir.
    await web3Modal.clearCachedProvider();
    provider = null;
  }

  selectedAccount = null;

  // Set the UI back to the initial state
  document.querySelector("#prepare").style.display = "block";
  document.querySelector("#connected").style.display = "none";
}


/**
 * Main entry point.
 */
window.addEventListener('load', async () => {
  init();
  document.querySelector("#btn-connect").addEventListener("click", onConnect);
  document.querySelector("#btn-disconnect").addEventListener("click", onDisconnect);
});
