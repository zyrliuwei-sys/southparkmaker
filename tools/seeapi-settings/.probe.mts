import {readFileSync} from 'node:fs';
import {parseEnv} from 'node:util';
for(const file of ['.env.development.local','.env.development','.env.local','.env']){try{for(const [k,v]of Object.entries(parseEnv(readFileSync(file,'utf8'))))if(process.env[k]===undefined)process.env[k]=v}catch{}}
const {getPlatformProxy}=await import('wrangler');
const platform=await getPlatformProxy({configPath:'./wrangler.jsonc',envFiles:[],remoteBindings:true});
try{globalThis.__CF_ENV__=platform.env;const {getAllConfigs}=await import('../../src/modules/config/service.ts');const c=await getAllConfigs();console.log({keyConfigured:!!c.seeapi_api_key,base:c.seeapi_base_url||'https://api.seeapi.com',paymentProviders:['stripe','creem','paypal'].filter(x=>c[x+'_enabled']==='true')});if(c.seeapi_api_key){const r=await fetch(new URL('/v1/prices?model=seedream-5-5&endpoint=text-to-image',c.seeapi_base_url||'https://api.seeapi.com'),{headers:{Authorization:`Bearer ${c.seeapi_api_key}`},redirect:'error',signal:AbortSignal.timeout(20000)});console.log({priceLookupStatus:r.status});if(r.ok)console.log(JSON.stringify(await r.json()))}}finally{await platform.dispose()}
