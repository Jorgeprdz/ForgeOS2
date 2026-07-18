"use strict";
(function(global){
const CONTRACT_ID="FORGE_PRODUCTIVE_PROSPECT_BOOTSTRAP_067G17B_V1";
let client=null;
function getClient(){
 const config=global.ForgeAlivePublicConfig067G17A1;
 const state=config?.current?.();
 if(!config?.allowsProductiveProspectCrud?.()||state?.state!=="READY"){
  const error=new Error(state?.state==="DEMO_EXPLICIT"?"PRODUCTIVE_PROSPECTS_DISABLED_IN_DEMO":"PRODUCTIVE_PROSPECT_CONFIG_BLOCKED");
  error.code=state?.state==="DEMO_EXPLICIT"?"DEMO_MODE":"CONFIG_BLOCKED";
  throw error;
 }
 if(client)return client;
 if(typeof global.supabase?.createClient!=="function"){
  const error=new Error("SUPABASE_BROWSER_CLIENT_UNAVAILABLE");error.code="CLIENT_UNAVAILABLE";throw error;
 }
 const {SUPABASE_URL,SUPABASE_KEY}=state.publicConfig;
 client=global.supabase.createClient(SUPABASE_URL,SUPABASE_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
 return client;
}
function diagnostics(){const state=global.ForgeAlivePublicConfig067G17A1?.current?.();return Object.freeze({contractId:CONTRACT_ID,configState:state?.state||"UNAVAILABLE",demoMode:state?.demoMode===true,clientInitialized:Boolean(client)});}
global.ForgeProductiveProspectBootstrap067G17B=Object.freeze({contractId:CONTRACT_ID,getClient,diagnostics});
if(typeof module!=="undefined"&&module.exports)module.exports={getClient,diagnostics};
})(typeof globalThis!=="undefined"?globalThis:window);
