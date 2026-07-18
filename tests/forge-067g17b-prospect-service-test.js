const assert=require('node:assert/strict');
const Service=require('../advisor-os/sales-pipeline/productive-prospect-service.js');
const A='11111111-1111-4111-8111-111111111111';
function mock(userId=A){
 const rows=[]; const audits=[];
 const client={auth:{getUser:async()=>userId?{data:{user:{id:userId}},error:null}:{data:{user:null},error:null}},from(table){
  const state={table,op:'select',payload:null,filters:[]};
  const q={select(){return q},insert(v){state.op='insert';state.payload=v;return q},update(v){state.op='update';state.payload=v;return q},eq(k,v){state.filters.push([k,v]);return q},is(k,v){state.filters.push([k,v]);return q},or(){return q},order:async()=>({data:rows.filter(r=>r.advisor_id===userId&&!r.archived_at),error:null}),single:async()=>{
   if(state.op==='insert'){if(state.payload.advisor_id!==userId)return{data:null,error:{code:'42501'}}; const row={id:crypto.randomUUID(),...state.payload,created_at:new Date().toISOString(),updated_at:new Date().toISOString()};rows.push(row);audits.push('prospect_created');return{data:row,error:null};}
   const row=rows.find(r=>state.filters.every(([k,v])=>k==='archived_at'?r[k]==v:r[k]===v)&&r.advisor_id===userId); if(!row)return{data:null,error:{code:'PGRST116'}}; Object.assign(row,state.payload);audits.push(row.archived_at?'prospect_archived':'prospect_updated');return{data:row,error:null};
  },then(resolve){const data=rows.filter(r=>r.advisor_id===userId&&state.filters.every(([k,v])=>k==='archived_at'?r[k]==v:r[k]===v));resolve({data,error:null})}}; return q;
 }}; return {client,rows,audits};
}
(async()=>{
 const m=mock(), service=Service.create(m.client);
 const input={fullName:'Marlene Test',phone:'55 1234 5678',source:'Referido',initialContext:'Fixture controlado'};
 const created=await service.createProspect(input); assert.match(created.id,/^[0-9a-f-]{36}$/); assert.equal(created.advisorId,A); assert.equal(created.status,'referred_new'); assert.equal(created.phone,'+525512345678'); assert.deepEqual(m.audits,['prospect_created']);
 assert.equal((await service.checkProspectDuplicates(input)).length,1);
 await assert.rejects(()=>service.createProspect(input),e=>e.code==='DUPLICATE_PROSPECT');
 assert.equal((await service.listProspects()).length,1); assert.equal((await service.getProspect(created.id)).id,created.id);
 const updated=await service.updateProspect(created.id,{occupation:'Arquitecta'}); assert.equal(updated.occupation,'Arquitecta'); assert.equal(m.audits.at(-1),'prospect_updated');
 await assert.rejects(()=>service.updateProspect(created.id,{advisorId:'forged'}),e=>e.code==='OWNERSHIP_TRANSFER_DENIED');
 await service.archiveProspect(created.id); assert.equal((await service.listProspects()).length,0); assert.equal(m.audits.at(-1),'prospect_archived');
 for(const bad of [{phone:'1',source:'x',initialContext:'x'},{fullName:'x',source:'x',initialContext:'x'}]) await assert.rejects(()=>service.createProspect(bad),e=>e.code==='VALIDATION_ERROR');
 await assert.rejects(()=>Service.create(mock(null).client).createProspect(input),e=>e.code==='AUTH_REQUIRED');
 await assert.rejects(()=>service.createProspect({...input,advisorId:'forged'}),e=>e.code==='OWNERSHIP_TRANSFER_DENIED');
 assert.equal(typeof service.deleteProspect,'undefined');
 assert.equal(Service.normalizeEmail(' X@Example.COM '),'x@example.com');
 await assert.rejects(()=>service.createProspect({...input,phone:null,whatsapp:'+525512345679',email:'x@example.com,id.neq.null'}),e=>e.code==='VALIDATION_ERROR');
 assert.doesNotMatch(Service.create.toString(),/\.or\(/);
 console.log('067G17B PROSPECT SERVICE: PASS');
})().catch(e=>{console.error(e);process.exit(1)});
