import {createClient} from 'genlayer-js';
import {studionet} from 'genlayer-js/chains';
import {TransactionHashVariant} from 'genlayer-js/types';
import source from '../contracts/afterhours.py?raw';
import {NETWORK,plain,executionState,bindTransaction,checkRecord,normalizeTransaction} from './protocol.js';
export const canonicalSource=source;
const pendingKey='afterhours.pending.v1';
const completedKey='afterhours.completed.v1';
let memoryPending, provider, wallet, signer, verifiedAddress='';
const invalidate=()=>{wallet='';signer=null;window.dispatchEvent(new CustomEvent('wallet-invalidated'))};
export const readClient=createClient({chain:studionet});
const serial=v=>JSON.stringify(plain(v));
function load(key){try{return JSON.parse(localStorage.getItem(key)||'null')}catch{return null}}
export function pending(){return memoryPending||load(pendingKey)}
export function history(){return load(completedKey)||[]}
export function account(){return wallet||''}
function persist(value){localStorage.setItem(pendingKey,serial(value));memoryPending=value;}
function finish(value){const items=history();items.unshift(value);localStorage.setItem(completedKey,serial(items.slice(0,30)));localStorage.removeItem(pendingKey);memoryPending=null;}
export function recoveryHash(hash){const p=pending();if(!p)throw Error('There is no saved request to recover.');if(!/^0x[a-fA-F0-9]{64}$/.test(hash))throw Error('Enter the exact GenLayer transaction hash.');persist({...p,hash});}
export async function preflight(){const id=await readClient.request({method:'eth_chainId',params:[]});if(Number(id)!==NETWORK.id)throw Error('RPC is not Stable Studionet 61999.');const gas=await readClient.request({method:'eth_gasPrice',params:[]});if(BigInt(gas)!==0n)throw Error('This app only sends zero-gas-price Studionet transactions.');return true;}
export async function connect(){
 provider=window.okxwallet?.ethereum||window.okxwallet||window.ethereum;
 if(!provider?.request)throw Error('Open this site in a desktop browser with OKX Wallet or another EVM wallet.');
 const accounts=await provider.request({method:'eth_requestAccounts'});
 wallet=accounts[0];
 let id=await provider.request({method:'eth_chainId'});
 if(Number(id)!==NETWORK.id){try{await provider.request({method:'wallet_switchEthereumChain',params:[{chainId:'0xf22f'}]});}catch(e){if(e.code!==4902)throw e;await provider.request({method:'wallet_addEthereumChain',params:[{chainId:'0xf22f',chainName:'GenLayer Studio',nativeCurrency:{name:'GEN',symbol:'GEN',decimals:18},rpcUrls:[NETWORK.rpc],blockExplorerUrls:['https://explorer-studio.genlayer.com']}]});}}
 id=await provider.request({method:'eth_chainId'});if(Number(id)!==NETWORK.id)throw Error('Switch the wallet to chain 61999.');
 signer=createClient({chain:studionet,account:wallet,provider});
 provider.removeListener?.('accountsChanged',invalidate);provider.removeListener?.('chainChanged',invalidate);provider.on?.('accountsChanged',invalidate);provider.on?.('chainChanged',invalidate);
 return wallet;
}
export async function verify(address){
 if(!/^0x[a-fA-F0-9]{40}$/.test(address))throw Error('Enter the deployed contract address.');
 await preflight();
 const code=await readClient.getContractCode(address);if(code!==source)throw Error('Deployed source is not the bundled AFTERHOURS contract.');
 const p=JSON.parse(await readClient.readContract({address,functionName:'get_protocol',args:[],transactionHashVariant:TransactionHashVariant.LATEST_FINAL}));
 if(p.protocol!=='afterhours-1')throw Error('Unexpected protocol.');
 verifiedAddress=address.toLowerCase();return p;
}
export async function readSlot(address,room,day,slot){if(address.toLowerCase()!==verifiedAddress)await verify(address);return JSON.parse(await readClient.readContract({address,functionName:'get_slot',args:[room,day,slot],transactionHashVariant:TransactionHashVariant.LATEST_FINAL}));}
export async function readRecord(address,owner,id){if(address.toLowerCase()!==verifiedAddress)await verify(address);const r=await readClient.readContract({address,functionName:'get_record',args:[owner,id],transactionHashVariant:TransactionHashVariant.LATEST_FINAL});return r?JSON.parse(r):null;}
export async function send(address,method,args){
 if(pending())throw Error('Track the saved transaction before sending another one.');
 if(!signer||!wallet)throw Error('Connect your wallet first.');
 const selected=await provider.request({method:'eth_accounts'});const id=await provider.request({method:'eth_chainId'});
 if(selected[0]?.toLowerCase()!==wallet.toLowerCase()||Number(id)!==NETWORK.id)throw Error('Wallet changed. Reconnect before signing.');
 await preflight();if(method!=='deploy'&&verifiedAddress!==address.toLowerCase())await verify(address);
 const intent={address,method,args,owner:wallet.toLowerCase(),createdAt:new Date().toISOString(),hash:null,...(method==='deploy'?{source}:{} )};
 persist(intent);
 try{
 const hash=method==='deploy'?await signer.deployContract({code:source,args:[],leaderOnly:false,consensusMaxRotations:3}):await signer.writeContract({address,functionName:method,args,value:0n,leaderOnly:false,consensusMaxRotations:3});
 memoryPending={...intent,hash};persist(memoryPending);return hash;
 }catch(e){if(e.code===4001||e.cause?.code===4001){localStorage.removeItem(pendingKey);memoryPending=null;}throw Error(memoryPending?.hash?`Transaction sent: ${memoryPending.hash}. Storage or tracking needs attention; do not resubmit.`:`${e.shortMessage||e.message}. ${pending()?'The intent remains saved. Recover the transaction hash from your wallet if submission is uncertain.':''}`);}
}
export async function track(){
 const p=pending();if(!p?.hash)throw Error('Attach the transaction hash from wallet activity before tracking.');
 const tx=plain(await readClient.getTransaction({hash:p.hash}));
 bindTransaction(tx,p);
 const state=executionState(tx);
 if(state==='pending')return {state,tx,intent:p};
 if(state==='failed'){const result={state,tx,intent:p};finish(result);return result;}
 if(p.method==='deploy'){
 const address=tx.to_address||tx.recipient||tx.txDataDecoded?.contractAddress;if(!address)throw Error('Finalized deployment has no contract address.');await verify(address);const result={state,tx,intent:p,address};finish(result);return result;
 }
 const record=checkRecord(await readRecord(p.address,p.owner,p.args[0]),p);
 const result={state,tx,intent:p,record};finish(result);return result;
}
export async function inspect(hash,address){
 if(!/^0x[a-fA-F0-9]{64}$/.test(hash))throw Error('Enter an exact transaction hash.');
 await preflight();
 const tx=normalizeTransaction(await readClient.getTransaction({hash}));
 const d=tx.txDataDecoded,call=plain(d?.callData);
 if(!d||!['deploy','call'].includes(d.type))throw Error('Unsupported transaction encoding.');
 const target=tx.to_address||tx.recipient||d.contractAddress;
 if(d.type==='call'&&(!address||target?.toLowerCase()!==address.toLowerCase()))throw Error('Transaction targets another contract.');
 const intent={hash,address:target,owner:(tx.from_address||tx.sender||tx.from||'').toLowerCase(),method:d.type==='deploy'?'deploy':call?.method,args:d.type==='deploy'?[]:call?.args,...(d.type==='deploy'?{source}:{})};
 if(!['deploy','reserve','cancel'].includes(intent.method))throw Error('Unsupported contract method.');
 try{bindTransaction(tx,intent)}catch(e){return {state:'unverified',verificationError:e.message,tx,intent}}const state=executionState(tx);
 if(state!=='success')return {state,tx,intent};
 await verify(target);
 if(intent.method==='deploy')return {state,tx,intent,address:target};
 return {state,tx,intent,record:checkRecord(await readRecord(target,intent.owner,intent.args[0]),intent)};
}
export function download(value,name){const blob=new Blob([JSON.stringify(plain(value),null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
