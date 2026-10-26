import test from 'node:test';import assert from 'node:assert/strict';
import {assertDraft,executionState,bindTransaction,checkRecord,plain} from '../src/protocol.js';
const owner='0x'+'a'.repeat(40),address='0x'+'b'.repeat(40);
const args=['visit_1','atelier','2026-10-26',3,'Quiet watercolor painting with no speakers.',1,0];
const intent={owner,address,method:'reserve',args};
const tx={sender:owner,recipient:address,statusName:'FINALIZED',txExecutionResult:1,txDataDecoded:{type:'call',leaderOnly:false,callData:new Map([['method','reserve'],['args',args]])}};
test('valid draft and invalid dates',()=>{const d={requestId:'visit_1',room:'atelier',day:'2026-10-26',slot:3,activity:args[4],people:1};assert.equal(assertDraft(d),true);assert.throws(()=>assertDraft({...d,day:'2026-02-29'}));assert.throws(()=>assertDraft({...d,people:0}));});
test('finalized alone is not execution success',()=>assert.equal(executionState({statusName:'FINALIZED'}),'pending'));
test('accepted success remains pending',()=>assert.equal(executionState({...tx,statusName:'ACCEPTED'}),'pending'));
test('finalized returned call is success',()=>assert.equal(executionState(tx),'success'));
test('finalized execution error is a failure',()=>assert.equal(executionState({...tx,txExecutionResult:2}),'failed'));
test('stable Studio success receipt',()=>assert.equal(executionState({statusName:'FINALIZED',consensus_data:{leader_receipt:{execution_result:'SUCCESS',result:{status:'return'}}}}),'success'));
test('bind exact signed call',()=>assert.doesNotThrow(()=>bindTransaction(tx,intent)));
test('reject wrong sender or contract',()=>{assert.throws(()=>bindTransaction({...tx,sender:address},intent));assert.throws(()=>bindTransaction({...tx,recipient:owner},intent));});
test('reject leader only even if finalized',()=>assert.throws(()=>bindTransaction({...tx,txDataDecoded:{...tx.txDataDecoded,leaderOnly:true}},intent)));
test('reject altered arguments',()=>assert.throws(()=>bindTransaction(tx,{...intent,args:[...args.slice(0,6),1]})));
test('readback must match request facts',()=>{const r={protocol:'afterhours-1',owner,request_id:'visit_1',outcome:'RESERVED',input:{room:'atelier',day:'2026-10-26',slot:3,activity:args[4],people:1,expected_revision:0}};assert.equal(checkRecord(r,intent),r);assert.throws(()=>checkRecord({...r,input:{...r.input,people:3}},intent));});
test('cancel cannot be declared complete without cancelled state',()=>assert.throws(()=>checkRecord({protocol:'afterhours-1',owner,request_id:'visit_1',cancelled:false},{...intent,method:'cancel'})));
test('map/bigint normalize without losing named arguments',()=>assert.deepEqual(plain(new Map([['args',[1n,'x']]])),{args:[1,'x']}));

test('Studio rollback is never success',()=>assert.equal(executionState({statusName:'FINALIZED',consensus_data:{leader_receipt:[{execution_result:'SUCCESS',result:{status:'rollback'}}]}}),'failed'));
test('Studio execution without result remains unverified',()=>assert.equal(executionState({statusName:'FINALIZED',consensus_data:{leader_receipt:[{execution_result:'SUCCESS'}]}}),'pending'));

import {readFileSync} from 'node:fs';
test('actual Studio deployment binds canonical source and full consensus',()=>{const real=JSON.parse(readFileSync(new URL('./fixtures/studio-deploy.json',import.meta.url)));const source=readFileSync(new URL('../contracts/afterhours.py',import.meta.url),'utf8');assert.doesNotThrow(()=>bindTransaction(real,{owner:real.from_address,method:'deploy',source}));assert.equal(executionState(real),'success');assert.throws(()=>bindTransaction({...real,leader_only:true},{owner:real.from_address,method:'deploy',source}));});
