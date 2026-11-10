// Server gateway: custom RSA authentication is mandatory before any database call.
const publicKey = {"kty":"RSA","n":"jnNom_un9HRoW0j-qyHPjJedWg4Rhb38HsCLPf16fGHV68ufY5SoWmj7Rfd0ivqzTRtILXEF5TnXzTpbYJQzZSDZ2QP6uI28ievm2cjOPl7bgBQR1jtmTUqaXLTMJ1xHD3ocMSzGP5R5zIczLGVUEUPxfvJ6FugBitccbIfSqy1flUT0i9tZhcp2mRhStaCyH_AlxYR59ukyHcNLyY9FmT9z443IRYXaoq_SmgiOPXHaBbqJwspobhi0IqmOC2rwIryDagc-J3Wt6RsWiy00OptjrdW3FLG_fg20NvGaFXQteKvRb0RBBsOZ6Ap7ykE5yFwxZOktq80aEa8gn25d5w","e":"AQAB"};
const issuer='appgprj_6ac0080fd0f08191884c33c9f06bec7e';
const statuses=['Healthy','Watch','Needs care'];
const decode=(s:string)=>Uint8Array.from(atob(s.replace(/-/g,'+').replace(/_/g,'/')),c=>c.charCodeAt(0));
const encode=(b:Uint8Array)=>btoa(String.fromCharCode(...b)).replace(/=/g,'').replace(/\+/g,'-').replace(/\//g,'_');
const keyPromise=crypto.subtle.importKey('jwk',publicKey,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
const reply=(value:unknown,status=200)=>Response.json(value,{status,headers:{'Cache-Control':'no-store'}});
async function owner(request:Request,body:string):Promise<string|null>{
 try {
 const token=(request.headers.get('authorization')||'').replace(/^Bearer /,'');
 const pieces=token.split('.');
 if(pieces.length!==3)return null;
 const header=JSON.parse(new TextDecoder().decode(decode(pieces[0])));
 if(header.alg!=='RS256'||header.typ!=='JWT')return null;
 if(!await crypto.subtle.verify('RSASSA-PKCS1-v1_5',await keyPromise,decode(pieces[2]),new TextEncoder().encode(pieces[0]+'.'+pieces[1])))return null;
 const claims=JSON.parse(new TextDecoder().decode(decode(pieces[1])));
 const now=Math.floor(Date.now()/1000);
 const digest=encode(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(body))));
 if(claims.iss!==issuer||claims.aud!=='plant-records'||typeof claims.sub!=='string'||!claims.sub||claims.sub.length>200||!Number.isInteger(claims.exp)||!Number.isInteger(claims.iat)||claims.exp<=now||claims.iat>now+5||claims.exp-claims.iat>60||claims.exp-claims.iat<=0||claims.method!==request.method||claims.digest!==digest)return null;
 return claims.sub;
 }catch{return null;}
}
async function rest(path:string,method='GET',body?:unknown,ignore=false){
 const secrets=JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS')||'{}');
 const secret=secrets.default||Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
 if(!secret)throw new Error('Database configuration missing');
 const response=await fetch(Deno.env.get('SUPABASE_URL')+'/rest/v1/'+path,{method,headers:{apikey:secret,Authorization:'Bearer '+secret,'Content-Type':'application/json',Prefer:ignore?'resolution=ignore-duplicates,return=minimal':'return=minimal'},body:body===undefined?undefined:JSON.stringify(body),signal:AbortSignal.timeout(12000)});
 if(!response.ok)throw new Error('Database operation failed');
 const text=await response.text();
 return text?JSON.parse(text):null;
}
const field=(v:unknown)=>typeof v==='string'&&v.trim().length>0&&v.length<=120;
Deno.serve(async(request:Request)=>{
 if(!['GET','POST'].includes(request.method))return reply({error:'Method not allowed.'},405);
 const body=request.method==='POST'?await request.text():'';
 if(body.length>235000)return reply({error:'Record is too large.'},413);
 const ownerId=await owner(request,body);
 if(!ownerId)return reply({error:'Unauthorized.'},401);
 const query='owner_id=eq.'+encodeURIComponent(ownerId);
 try {
 if(request.method==='GET'){
 const [plants,logs]=await Promise.all([rest('plants?'+query+'&select=id,name,species,location,status,demo,created_at,photo,analysis&order=created_at.desc'),rest('logs?'+query+'&select=id,plant_id,type,date,note,status,amount,created_at&order=date.desc,created_at.desc')]);
 return reply({plants,logs});
 }
 let b;
 try{b=JSON.parse(body);}catch{return reply({error:'Invalid JSON.'},400);}
 if(!b||typeof b!=='object')return reply({error:'Invalid record.'},400);
 const id=crypto.randomUUID();
 if(b.action==='plant'){
 if(![b.name,b.species,b.location].every(field)||!statuses.includes(b.status))return reply({error:'Please complete all plant fields.'},400);
 if(b.photo!=null&&(typeof b.photo!=='string'||b.photo.length>220000||!/^data:image\/jpeg;base64,\/9j\/[A-Za-z0-9+/=]+$/.test(b.photo)))return reply({error:'Invalid photo.'},400);
 if(b.analysis!=null&&(typeof b.analysis!=='object'||JSON.stringify(b.analysis).length>6000||typeof b.analysis.isPlant!=='boolean'||typeof b.analysis.commonName!=='string'||b.analysis.commonName.length>120||typeof b.analysis.scientificName!=='string'||b.analysis.scientificName.length>120||!['low','medium','high'].includes(b.analysis.confidence)||![b.analysis.observations,b.analysis.careNotes].every(a=>Array.isArray(a)&&a.length<=8&&a.every(v=>typeof v==='string'&&v.length<=500))))return reply({error:'Invalid photo observations.'},400);
 await rest('plants','POST',{photo:b.photo||null,analysis:b.analysis||null,id,owner_id:ownerId,name:b.name.trim(),species:b.species.trim(),location:b.location.trim(),status:b.status,demo:0});
 }else if(b.action==='log'){
 const date=typeof b.date==='string'?new Date(b.date+'T12:00:00Z'):new Date(NaN);
 if(typeof b.plantId!=='string'||!['Watering','Symptom','Observation'].includes(b.type)||typeof b.note!=='string'||!b.note.trim()||b.note.length>2000||!/^\d{4}-\d{2}-\d{2}$/.test(b.date)||isNaN(date.valueOf())||date.toISOString().slice(0,10)!==b.date||b.date>new Date().toISOString().slice(0,10)||(b.status!=null&&!statuses.includes(b.status))||(b.amount!=null&&(!Number.isInteger(b.amount)||b.amount<1||b.amount>100000)))return reply({error:'Please enter a valid date, note and water amount.'},400);
 const plants=await rest('plants?'+query+'&id=eq.'+encodeURIComponent(b.plantId)+'&select=id');
 if(!plants.length)return reply({error:'Plant not found.'},404);
 await rest('logs','POST',{id,owner_id:ownerId,plant_id:b.plantId,type:b.type,date:b.date,note:b.note.trim(),status:b.status||null,amount:b.type==='Watering'?b.amount||null:null});
 }else if(b.action==='demo'){
 const samples=[['monstera','Monstera','Monstera deliciosa','Living room','Healthy'],['ficus','Rubber plant','Ficus elastica','Living room','Watch'],['pothos','Golden pothos','Epipremnum aureum','Office','Healthy'],['basil','Sweet basil','Ocimum basilicum','Balcony','Needs care'],['aloe','Aloe vera','Aloe barbadensis','Balcony','Healthy'],['peace','Peace lily','Spathiphyllum wallisii','Office','Watch']];
 const records=[['Watering','Soil checked before watering.',null,250],['Observation','New leaf unfolding.','Healthy',null],['Symptom','Yellowing on a lower leaf.','Watch',null],['Watering','Watered slowly until drainage.',null,180],['Symptom','Leaves wilting; inspect soil moisture.','Needs care',null],['Observation','Leaves firm and evenly coloured.','Healthy',null]];
 await rest('plants?on_conflict=id','POST',samples.map(p=>({id:ownerId+':demo-'+p[0],owner_id:ownerId,name:p[1],species:p[2],location:p[3],status:p[4],demo:1})),true);
 const logs=samples.flatMap((p,i)=>records.map((r,j)=>{const date=new Date();date.setUTCDate(date.getUTCDate()-((i+j*2)%14));return {id:ownerId+':demo-log-'+i+'-'+j,owner_id:ownerId,plant_id:ownerId+':demo-'+p[0],type:r[0],date:date.toISOString().slice(0,10),note:r[1],status:r[2],amount:r[3]};}));
 await rest('logs?on_conflict=id','POST',logs,true);
 }else return reply({error:'Unknown action.'},400);
 return reply({ok:true,id});
 }catch{ return reply({error:'Could not load or save records. Please try again.'},503);}
});
