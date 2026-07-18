"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const PipelineUI=require("../advisor-os/sales-pipeline/pipeline-ui.js");
const ProspectUI=require("../advisor-os/sales-pipeline/productive-prospect-ui.js");

test("productive Pipeline exposes canonical add action and empty state",()=>{
 const html=PipelineUI.renderPipelineUI({state:"empty",message:"Todavía no tienes prospectos.",writerAvailable:true});
 assert.match(html,/\+ Agregar prospecto/);
 assert.match(html,/data-add-prospect/);
 assert.match(html,/Todavía no tienes prospectos/);
 assert.doesNotMatch(html,/Datos de prueba/);
});

test("create form enforces name source context and phone-or-whatsapp in controller",()=>{
 const html=ProspectUI.formTemplate();
 assert.match(html,/name="fullName"[^>]*required/);
 assert.match(html,/name="source" required/);
 assert.match(html,/name="initialContext" required/);
 assert.match(html,/name="phone"/);
 assert.match(html,/name="whatsapp"/);
 assert.doesNotMatch(html,/name="advisorId"|name="advisor_id"/);
 assert.match(html,/data-save-prospect/);
});

test("detail exposes edit archive call and WhatsApp without automatic send",()=>{
 const prospect={id:"p-1",fullName:"Marlene Ruiz",status:"referred_new",phoneNormalized:"+525512345678",source:"Referido",initialContext:"Ana nos presentó",createdAt:"2026-07-18T00:00:00Z"};
 const html=ProspectUI.detailTemplate(prospect);
 assert.match(html,/Editar/);
 assert.match(html,/Eliminar/);
 assert.match(html,/href="tel:\+525512345678"/);
 assert.match(html,/https:\/\/wa\.me\/525512345678\?text=/);
 assert.match(html,/target="_blank"/);
 assert.doesNotMatch(html,/send\(|auto.?send/i);
});

test("canonical model places a new prospect in Referido nuevo",()=>{
 const model=ProspectUI.toModel([{id:"p-1",fullName:"Marlene Ruiz",status:"referred_new",source:"Referido"}]);
 assert.equal(model.state,"ready");
 assert.equal(model.columns[0].columnId,"referred_new");
 assert.equal(model.columns[0].label,"Referido nuevo");
 assert.equal(model.columns[0].items[0].prospectId,"p-1");
});

test("WhatsApp templates are contextual and never invoke an automatic send",()=>{
 const url=ProspectUI.whatsappUrl({fullName:"Marlene",phoneNormalized:"+525512345678",initialContext:"tu referencia"},"cercano");
 assert.match(url,/^https:\/\/wa\.me\/525512345678\?text=/);
 const text=decodeURIComponent(url.split("text=")[1]);
 assert.match(text,/Hola, Marlene/);
 assert.match(text,/tu referencia/);
});
