import { env } from 'cloudflare:workers';
import { getChatGPTUser } from '@/app/chatgpt-auth';
const issuer = 'appgprj_6ac0080fd0f08191884c33c9f06bec7e';
function encode(value: string | Uint8Array) {
 const bytes = typeof value === 'string' ? new TextEncoder().encode(value) : value;
 return btoa(String.fromCharCode(...bytes)).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
}
async function proxy(request: Request) {
 const user = await getChatGPTUser();
 if (!user) return Response.json({error:'Please sign in with ChatGPT to use your tracker.'},{status:401});
 if(request.method==='POST' && request.headers.get('origin') && request.headers.get('origin')!==new URL(request.url).origin) return Response.json({error:'Invalid request origin.'},{status:403});
 try {
 const config = env as unknown as {PLANT_GATEWAY_PRIVATE_JWK:string;SUPABASE_URL:string};
 const key = await crypto.subtle.importKey('jwk',JSON.parse(config.PLANT_GATEWAY_PRIVATE_JWK),{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['sign']);
 const now=Math.floor(Date.now()/1000);
 const body=request.method==='POST'?await request.text():'';
 if(body.length>235000) return Response.json({error:'Record is too large.'},{status:413});
 const digest=encode(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(body))));
 const input=encode(JSON.stringify({alg:'RS256',typ:'JWT'}))+'.'+encode(JSON.stringify({iss:issuer,aud:'plant-records',sub:user.userId,iat:now,exp:now+60,method:request.method,digest}));
 const signature=await crypto.subtle.sign('RSASSA-PKCS1-v1_5',key,new TextEncoder().encode(input));
 const response=await fetch(config.SUPABASE_URL+'/functions/v1/plant-records',{method:request.method,headers:{Authorization:'Bearer '+input+'.'+encode(new Uint8Array(signature)),'Content-Type':'application/json'},body:request.method==='POST'?body:undefined,signal:AbortSignal.timeout(20000)});
 return new Response(await response.text(),{status:response.status,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}});
 }catch{return Response.json({error:'Records are temporarily unavailable. Please try again.'},{status:503});}
}
export const GET=proxy;
export const POST=proxy;
