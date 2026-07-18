(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.ForgeProductiveProspectService067G17B = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  const EDITABLE = new Set(['fullName','phone','whatsapp','email','source','referrerName','referrerRelationship','dateOfBirth','age','maritalStatus','dependents','occupation','estimatedIncome','productsOfInterest','initialContext','status','nextActionType','nextActionAt']);
  const toSnake = { fullName:'full_name', phone:'phone_normalized', whatsapp:'whatsapp_normalized', email:'email_normalized', referrerName:'referrer_name', referrerRelationship:'referrer_relationship', dateOfBirth:'date_of_birth', maritalStatus:'marital_status', estimatedIncome:'estimated_income', productsOfInterest:'products_of_interest', initialContext:'initial_context', nextActionType:'next_action_type', nextActionAt:'next_action_at' };
  const toCamel = Object.fromEntries(Object.entries(toSnake).map(([a,b]) => [b,a]));
  class ProspectError extends Error { constructor(code, message, details=null){ super(message); this.name='ProspectError'; this.code=code; this.details=details; } }

  function normalizePhone(value, defaultCountry='MX') {
    if (!value) return null;
    const raw=String(value).trim(); const digits=raw.replace(/\D/g,'');
    if (raw.startsWith('+') && digits.length>=8 && digits.length<=15) return `+${digits}`;
    if (defaultCountry==='MX' && digits.length===10) return `+52${digits}`;
    if (digits.length>=8 && digits.length<=15) throw new ProspectError('VALIDATION_ERROR','Selecciona el país o escribe el número con código internacional.');
    throw new ProspectError('VALIDATION_ERROR','El número telefónico no es válido.');
  }
  const normalizeEmail = value => value ? String(value).trim().toLowerCase() : null;
  function validate(input) {
    if (!input || input.advisorId || input.advisor_id || input.createdAt || input.created_at) throw new ProspectError('OWNERSHIP_TRANSFER_DENIED','La identidad del asesor y las fechas son autoritativas.');
    if (!String(input.fullName||'').trim()) throw new ProspectError('VALIDATION_ERROR','El nombre completo es obligatorio.');
    if (!input.phone && !input.whatsapp) throw new ProspectError('VALIDATION_ERROR','Agrega teléfono o WhatsApp.');
    if (!String(input.source||'').trim()) throw new ProspectError('VALIDATION_ERROR','La fuente es obligatoria.');
    if (!String(input.initialContext||'').trim()) throw new ProspectError('VALIDATION_ERROR','El contexto inicial es obligatorio.');
  }
  function rowToProspect(row) { const out={}; for(const [key,value] of Object.entries(row||{})) out[toCamel[key]||key.replace(/_([a-z])/g,(_,c)=>c.toUpperCase())]=value; return out; }
  async function authenticatedUser(client) {
    const {data,error}=await client.auth.getUser(); const user=data?.user;
    if(error||!user?.id) throw new ProspectError('AUTH_REQUIRED','Tu sesión expiró. Inicia sesión nuevamente.');
    return user;
  }
  function mapError(error) {
    if(error instanceof ProspectError) throw error;
    if(error?.code==='23505') throw new ProspectError('DUPLICATE_PROSPECT','Este prospecto ya existe en tu Pipeline.');
    if(error?.code==='PGRST116') throw new ProspectError('PROSPECT_NOT_FOUND','No encontramos el prospecto.');
    throw new ProspectError('NETWORK_ERROR','No pudimos completar la operación. Intenta nuevamente.');
  }
  function create(client,{defaultCountry='MX'}={}) {
    if(!client?.auth?.getUser||!client?.from) throw new ProspectError('AUTH_REQUIRED','Supabase autenticado es obligatorio.');
    async function checkProspectDuplicates(input) {
      await authenticatedUser(client);
      const phone=normalizePhone(input.phone,defaultCountry), whatsapp=normalizePhone(input.whatsapp,defaultCountry), email=normalizeEmail(input.email);
      const clauses=[]; if(phone) clauses.push(`phone_normalized.eq.${phone}`); if(whatsapp) clauses.push(`whatsapp_normalized.eq.${whatsapp}`); if(email) clauses.push(`email_normalized.eq.${email}`);
      if(!clauses.length) return [];
      const {data,error}=await client.from('prospects').select('id,full_name,phone_normalized,whatsapp_normalized,email_normalized,status').is('archived_at',null).or(clauses.join(','));
      if(error) mapError(error); return (data||[]).map(rowToProspect);
    }
    async function createProspect(input) {
      validate(input); const user=await authenticatedUser(client); const duplicates=await checkProspectDuplicates(input);
      if(duplicates.length) throw new ProspectError('DUPLICATE_PROSPECT','Este prospecto ya existe en tu Pipeline.',{prospect:duplicates[0]});
      const row={advisor_id:user.id,full_name:String(input.fullName).trim(),phone_normalized:normalizePhone(input.phone,defaultCountry),whatsapp_normalized:normalizePhone(input.whatsapp,defaultCountry),email_normalized:normalizeEmail(input.email),source:String(input.source).trim(),initial_context:String(input.initialContext).trim(),status:'referred_new'};
      for(const key of EDITABLE) if(input[key]!=null && !(key in {fullName:1,phone:1,whatsapp:1,email:1,source:1,initialContext:1,status:1})) row[toSnake[key]||key]=input[key];
      const {data,error}=await client.from('prospects').insert(row).select('*').single(); if(error) mapError(error); return rowToProspect(data);
    }
    async function listProspects(){ await authenticatedUser(client); const {data,error}=await client.from('prospects').select('*').is('archived_at',null).order('created_at',{ascending:false}); if(error) mapError(error); return (data||[]).map(rowToProspect); }
    async function getProspect(id){ await authenticatedUser(client); const {data,error}=await client.from('prospects').select('*').eq('id',id).is('archived_at',null).single(); if(error) mapError(error); return rowToProspect(data); }
    async function updateProspect(id,changes){ const user=await authenticatedUser(client); if(changes.advisorId||changes.advisor_id||changes.id||changes.createdAt||changes.created_at) throw new ProspectError('OWNERSHIP_TRANSFER_DENIED','No puedes cambiar la propiedad o identidad del prospecto.'); const patch={updated_by:user.id}; for(const [key,value] of Object.entries(changes)) if(EDITABLE.has(key)) patch[toSnake[key]||key]=key==='phone'||key==='whatsapp'?normalizePhone(value,defaultCountry):key==='email'?normalizeEmail(value):value; const {data,error}=await client.from('prospects').update(patch).eq('id',id).is('archived_at',null).select('*').single(); if(error) mapError(error); return rowToProspect(data); }
    async function archiveProspect(id,reason='Retirado del Pipeline'){ const user=await authenticatedUser(client); const {data,error}=await client.from('prospects').update({archived_at:new Date().toISOString(),archived_by:user.id,archive_reason:reason,updated_by:user.id}).eq('id',id).is('archived_at',null).select('*').single(); if(error) mapError(error); return rowToProspect(data); }
    return Object.freeze({createProspect,getProspect,listProspects,updateProspect,archiveProspect,checkProspectDuplicates});
  }
  return Object.freeze({create,normalizePhone,normalizeEmail,ProspectError});
});
