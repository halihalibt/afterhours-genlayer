import {abi, decodeInputData} from 'genlayer-js';
export const NETWORK = {id:61999,rpc:'https://studio.genlayer.com/api'};
export const PROTOCOL = 'afterhours-2';
// Records written by the v1 contract keep protocol afterhours-1; checkRecord
// still accepts them so old public records stay readable. New writes and
// chain.verify() require PROTOCOL (afterhours-2).
export const PROTOCOLS = ['afterhours-1','afterhours-2'];
export const MAX_WAITLIST_PER_SLOT = 8;
export const ROOMS=[{id:'atelier',name:'The Atelier',zh:'光的画室',subtitle:'For hands that make.',zhSub:'让灵感，在光里发生。',capacity:4,color:'#ed926e',rule:'Quiet art, handcraft and headphone work. No amplified sound, machines, fumes or dust.',zhRule:'安静绘画、手工与耳机工作。禁止扩音、机器、烟雾与扬尘。'},{id:'listening',name:'The Listening Room',zh:'听风之间',subtitle:'For ideas worth hearing.',zhSub:'给每一种声音，恰好的空间。',capacity:3,color:'#849ac4',rule:'Acoustic work, voice and headphone editing. Silence-dependent recordings cannot share with audible activity.',zhRule:'原声演奏、人声与耳机剪辑。需要安静的录音，不能与有声活动共处。'},{id:'commons',name:'The Commons',zh:'相遇客厅',subtitle:'For a little togetherness.',zhSub:'偶然相遇，也许就是开始。',capacity:6,color:'#91ab93',rule:'Conversation, small discussions, reading and headphone work. No amplification or machinery.',zhRule:'交谈、小组讨论、阅读与耳机工作。禁止扩音与机器作业。'}];
export const SLOTS=['09:00–11:00','11:00–13:00','14:00–16:00','16:00–18:00'];
export function assertDraft({requestId,room,day,slot,activity,people}) {
 if(!/^[A-Za-z0-9_-]{3,64}$/.test(requestId))throw Error('Use a request ID of 3–64 letters, numbers, underscores or hyphens.');
 if(!ROOMS.some(r=>r.id===room))throw Error('Choose a known room.');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(day)||new Date(day+'T00:00:00Z').toISOString().slice(0,10)!==day||+day.slice(0,4)<2026||+day.slice(0,4)>2100)throw Error('Choose a valid date between 2026 and 2100.');
 if(!Number.isInteger(slot)||slot<0||slot>3)throw Error('Choose a time slot.');
 if(activity.trim().length<20||activity.trim().length>800)throw Error('Describe your activity in 20–800 characters.');
 if(!Number.isInteger(people)||people<1||people>6)throw Error('Party size must be 1–6.');
 return true;
}
export function plain(v){ if(v instanceof Map)return Object.fromEntries([...v].map(([k,x])=>[k,plain(x)])); if(Array.isArray(v))return v.map(plain); if(v&&typeof v==='object')return Object.fromEntries(Object.entries(v).map(([k,x])=>[k,plain(x)]));return typeof v==='bigint'?Number(v):v; }
export function normalizeTransaction(tx){
 const t=plain(tx);
 if(t.txDataDecoded)return t;
 // Studio exposes calldata directly; other networks expose the original RLP input.
 if(t.input){const decoded=decodeInputData(t.input,t.to_address||t.recipient);if(decoded)t.txDataDecoded=plain(decoded);}
 if(!t.txDataDecoded&&t.data){
  const d=t.data, cd=d.calldata;
  const bytes=cd?.raw?new Uint8Array(cd.raw):typeof cd==='string'?Uint8Array.from(atob(cd),c=>c.charCodeAt(0)):cd?.base64?Uint8Array.from(atob(cd.base64),c=>c.charCodeAt(0)):null;
  const call=bytes?plain(abi.calldata.decode(bytes)):null;
  const encoded=d.contract_code;
  const code=typeof encoded==='string'?new TextDecoder().decode(Uint8Array.from(atob(encoded),c=>c.charCodeAt(0))):null;
  t.txDataDecoded=code?{type:'deploy',code,constructorArgs:call,leaderOnly:t.leader_only??d.leader_only}:{type:'call',callData:call,leaderOnly:t.leader_only??d.leader_only};
 }
 return t;
}
export function executionState(tx){
 const t=plain(tx);const status=String(t.statusName||t.status_name||(typeof t.status==='string'?t.status:''));
 const receipts=t.consensus_data?.leader_receipt;
 const receipt=Array.isArray(receipts)?(receipts.filter(r=>r.mode==='leader').at(-1)||receipts[0]):receipts||t.consensus_data?.leader_result;
 const execution=t.txExecutionResultName||receipt?.execution_result;
 const result=receipt?.result?.status;
 const failed=['FINISHED_WITH_ERROR','ERROR'].includes(execution)||t.txExecutionResult===2||['rollback','contract_error','error','none','no_leaders'].includes(result);
 if(['CANCELED','CANCELLED','UNDETERMINED','LEADER_TIMEOUT','VALIDATORS_TIMEOUT'].includes(status)||(status==='FINALIZED'&&failed))return 'failed';
 const success=execution==='FINISHED_WITH_RETURN'||t.txExecutionResult===1||(execution==='SUCCESS'&&result==='return');
 return status==='FINALIZED'&&success?'success':'pending';
}
export function bindTransaction(tx,intent){
 const t=normalizeTransaction(tx),d=t.txDataDecoded;
 const sender=t.from_address||t.sender||t.from;
 if(!sender||sender.toLowerCase()!==intent.owner.toLowerCase())throw Error('Transaction sender does not match this saved request.');
 if(d?.leaderOnly!==false)throw Error('Full-consensus transaction is required.');
 if(intent.method==='deploy'){
  if(d.type!=='deploy'||d.code!==intent.source)throw Error('Deployment source does not match.');
  return;
 }
 const to=t.to_address||t.recipient;
 if(!to||to.toLowerCase()!==intent.address.toLowerCase())throw Error('Transaction targets another contract.');
 const call=plain(d.callData);
 if(!call||call.method!==intent.method||JSON.stringify(call.args)!==JSON.stringify(intent.args))throw Error('Transaction call does not match the saved request.');
}
export function checkRecord(record,intent){
 // Anyone may promote, so for promote_waitlist the head record's owner is
 // not the caller; identity there is the slot + head snapshot (see below).
 const ownerMatches=intent.method==='promote_waitlist'||record?.owner===intent.owner.toLowerCase();
 const idMatches=intent.method==='promote_waitlist'||record?.request_id===intent.args[0];
 if(!record||!PROTOCOLS.includes(record.protocol)||!ownerMatches||!idMatches)throw Error('Record identity does not match.');
 if(intent.method==='reserve'){
 const [id,room,day,slot,activity,people,revision]=intent.args, p=record.input;
 if(!p||p.room!==room||p.day!==day||p.slot!==slot||p.activity!==activity.trim()||p.people!==people||p.expected_revision!==revision)throw Error('Record input differs from the signed request.');
 if(!['RESERVED','FULL','CONFLICT','UNCERTAIN'].includes(record.outcome))throw Error('Unknown reservation result.');
 } else if(intent.method==='join_waitlist'){
 const [id,room,day,slot,activity,people,revision]=intent.args, p=record.input;
 // v2 join input carries an extra method field; only the request facts are compared.
 if(!p||p.room!==room||p.day!==day||p.slot!==slot||p.activity!==activity.trim()||p.people!==people||p.expected_revision!==revision)throw Error('Record input differs from the signed request.');
 if(record.outcome!=='WAITLISTED'||record.waitlist_status!=='QUEUED')throw Error('Waitlist join was not read back as WAITLISTED.');
 if(!Number.isInteger(record.position)||record.position<1)throw Error('Waitlist position was not read back.');
 } else if(intent.method==='leave_waitlist'){
 // leave keeps outcome WAITLISTED; the marker is waitlist_status LEFT.
 if(record.waitlist_status!=='LEFT'&&record.outcome!=='WAITLIST_LEFT')throw Error('Waitlist leave has not been read back.');
 } else if(intent.method==='promote_waitlist'){
 // Anyone may promote, so the head record's owner is NOT the caller.
 // Identity is the slot in the record input, plus the head snapshot when known.
 const [room,day,slot]=intent.args, p=record.input;
 if(!p||p.room!==room||p.day!==day||p.slot!==slot)throw Error('Record does not belong to the promoted slot.');
 if(intent.before?.head?.request_id&&record.request_id!==intent.before.head.request_id)throw Error('Record is not the promoted head entry.');
 const promoted=record.outcome==='RESERVED'&&record.waitlist_status==='PROMOTED';
 const deferred=record.outcome==='WAITLISTED'&&record.waitlist_status==='QUEUED'&&Number.isInteger(record.deferral_count)&&record.deferral_count>0&&!!record.last_deferral;
 if(!promoted&&!deferred)throw Error('Promotion outcome was not read back.');
 } else if(intent.method==='cancel'&&!record.cancelled)throw Error('Cancellation has not been read back.');
 else if(!['reserve','join_waitlist','leave_waitlist','promote_waitlist','cancel'].includes(intent.method))throw Error('Unsupported record method.');
 return record;
}
// First exportable result from a FINALIZED readback, or null. The export
// button and its handler share this predicate, so the button is disabled
// until a finalized record exists and can never export unverified data.
export function exportableResult(lastResult, history){
 return [lastResult,...(history||[])].find(x=>x&&(x.state==='success'||x.state==='public-read')&&(x.record||x.slot))||null;
}
// Waitlist queue from a FINALIZED get_slot readback. Entries arrive in FIFO
// order with a 1-based position; a missing waitlist is an empty queue, never
// an invented position. Returns [] when nothing was read back.
export function waitlistEntries(slot){
 const raw=slot?.waitlist;
 if(!Array.isArray(raw))return [];
 return raw.map((e,i)=>{
  if(typeof e==='string')return {key:e,owner:null,request_id:e,activity:'',people:null,joined_revision:null,deferrals:0,position:i+1};
  const key=e.key||'';
  return {key,owner:e.owner||null,request_id:e.request_id||(key.includes(':')?key.slice(key.indexOf(':')+1):null),activity:e.activity||'',people:typeof e.people==='number'?e.people:null,joined_revision:e.joined_revision??null,deferrals:e.deferrals??e.deferral_count??0,position:Number.isInteger(e.position)&&e.position>=1?e.position:i+1};
 });
}
// 1-based position from a FINALIZED get_record readback, or null when the
// contract did not return one. Callers must show no position, never a guess.
export function waitlistPosition(record){
 return Number.isInteger(record?.position)&&record.position>=1?record.position:null;
}
export function waitlistStatus(record){return record?.waitlist_status||null;}
export function slotIsFull(slot,people){
 if(!slot||typeof slot.capacity!=='number')return false;
 const occupied=typeof slot.occupied==='number'?slot.occupied:(Array.isArray(slot.active)?slot.active.reduce((n,b)=>n+(b.people||0),0):0);
 return occupied+people>slot.capacity;
}
// Verify a promote_waitlist outcome from FINALIZED readbacks only.
// slot: get_slot readback for the promoted slot. headRecord: get_record
// readback for the head entry (null when unknown, e.g. an inspected tx
// without a pre-send snapshot). intent.before: the pre-send slot snapshot
// {revision, occupied, waitlist, head} captured before signing, or null.
// Returns 'PROMOTED', 'PROMOTION_DEFERRED' or 'WAITLIST_EMPTY'; throws
// when the readback does not prove any of them, so the UI never shows a
// success it did not read back.
export function checkPromotion(slot,intent,headRecord){
 const [room,day,slotIndex]=intent.args, before=intent.before||null;
 if(!slot||slot.room!==room||slot.day!==day||slot.slot!==slotIndex)throw Error('Slot readback does not match the promotion request.');
 const entries=waitlistEntries(slot);
 if(before&&(!before.waitlist||before.waitlist.length===0)&&slot.revision===before.revision&&entries.length===0)return 'WAITLIST_EMPTY';
 if(headRecord){
  const p=headRecord.input;
  if(!p||p.room!==room||p.day!==day||p.slot!==slotIndex)throw Error('Head record does not belong to the promoted slot.');
  if(before?.head?.request_id&&headRecord.request_id!==before.head.request_id)throw Error('Head record is not the promoted head entry.');
  if(before&&typeof before.revision==='number'&&slot.revision<=before.revision)throw Error('Slot revision did not advance after promotion.');
  if(headRecord.outcome==='RESERVED'&&headRecord.waitlist_status==='PROMOTED')return 'PROMOTED';
  const beforeDeferrals=before?.head?.deferrals??0;
  if(headRecord.outcome==='WAITLISTED'&&headRecord.waitlist_status==='QUEUED'&&Number.isInteger(headRecord.deferral_count)&&headRecord.deferral_count>beforeDeferrals&&!!headRecord.last_deferral)return 'PROMOTION_DEFERRED';
  throw Error('Head record does not show a promotion outcome.');
 }
 // No head record: only the slot history can speak, and only for the head
 // snapshot when one exists.
 const events=[...(slot.history||[])].filter(h=>!before?.head?.key||h.key===before.head.key);
 const last=events.at(-1);
 if(last?.event==='PROMOTED')return 'PROMOTED';
 if(last?.event==='PROMOTION_DEFERRED')return 'PROMOTION_DEFERRED';
 throw Error('Promotion could not be verified from the finalized readback.');
}
export const demoScenarios={
 harmony:{title:'Watercolor & quiet editing',zh:'水彩 × 安静剪辑',label:'COMPATIBLE',zhLabel:'可以共处',occupied:2,activities:[{name:'Watercolor studies',zh:'水彩习作',color:'#ed926e'},{name:'Editing with headphones',zh:'戴耳机剪辑',color:'#8799c6'}],reason:'Both activities are quiet and produce no disruptive sound. Two people share the room, with two places still open.',zhReason:'两项活动都保持安静，不产生干扰声音。两个人共享空间，仍有两个空位。'},
 conflict:{title:'Voice recording & rehearsal',zh:'人声录音 × 扩音排练',label:'CONFLICT',zhLabel:'存在冲突',occupied:1,activities:[{name:'Silence-dependent recording',zh:'需要安静的人声录音',color:'#8799c6'},{name:'Amplified rehearsal',zh:'使用音箱排练',color:'#dd684e'}],reason:'Speakers interrupt the existing recording and breach the no-amplification rule. The new activity receives no reservation.',zhReason:'音箱会打断已有录音，同时违反禁止扩音的规则。新活动不会占用名额。'},
 unknown:{title:'An idea without the details',zh:'还缺一点活动细节',label:'UNKNOWN',zhLabel:'信息不足',occupied:1,activities:[{name:'Quiet illustration',zh:'安静插画',color:'#ed926e'},{name:'A creative session…',zh:'一次创作活动……',color:'#b9a9bd'}],reason:'“A creative session” does not describe sound, tools or working conditions. More detail is needed before a place can be reserved.',zhReason:'“创作活动”没有说明声音、工具或工作条件。补充细节后，才适合提交新的预约。'}
};
