"use strict";
const crypto=require("node:crypto");
const ALLOWED_KEYS=new Set(["projectId","projectVersion","candidateId","futureAdvisorIdReference","sourceRowReference","name","contactMethods","relationship","relationshipContext","sourceDate","consentStatus","evidenceReferences"]);
function stableContactId({projectId,projectVersion,sourceRowReference}) { if(!projectId||!projectVersion||!sourceRowReference) throw new Error("PROJECT_ROW_IDENTITY_REQUIRED"); return `P200C_${crypto.createHash("sha256").update(`${projectId}|${projectVersion}|${sourceRowReference}`).digest("hex").slice(0,20).toUpperCase()}`; }
function createProject200Contact(input) {
  Object.keys(input||{}).forEach(k=>{if(!ALLOWED_KEYS.has(k)) throw new Error(`PRIVATE_OR_UNGOVERNED_FIELD:${k}`);});
  if(!input.name||!Array.isArray(input.contactMethods)||!input.contactMethods.length) throw new Error("CONTACT_FIELDS_REQUIRED");
  if(!Array.isArray(input.evidenceReferences)||!input.evidenceReferences.length) throw new Error("EVIDENCE_REQUIRED");
  if(!["UNKNOWN","NOT_RECORDED","RECORDED","WITHDRAWN","REVIEW_REQUIRED"].includes(input.consentStatus)) throw new Error("INVALID_CONSENT_STATUS");
  return Object.freeze({contractType:"PROJECT_200_CONTACT_IDENTITY",schemaVersion:"1.0.0",project200ContactId:stableContactId(input),...JSON.parse(JSON.stringify(input)),automaticallyBecomesProspect:false,nasatIncluded:false,privacyClassification:"FORGE_RESTRICTED_RECRUITMENT_CONTACT"});
}
function findDuplicateSourceRows(rows) { const seen=new Set(), duplicates=[]; rows.forEach((r,i)=>{const key=`${r.projectId}|${r.projectVersion}|${r.sourceRowReference}`; if(seen.has(key)) duplicates.push(i); else seen.add(key);}); return duplicates; }
module.exports={stableContactId,createProject200Contact,findDuplicateSourceRows};
