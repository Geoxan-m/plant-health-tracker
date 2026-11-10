export type DemoPlant = {id:string;name:string;species:string;location:string;status:string;demo:number;created_at:string;photo?:string|null;analysis?:{commonName:string;confidence:string;observations:string[];careNotes:string[]}|null};
export type DemoLog = {id:string;plant_id:string;type:string;date:string;note:string;status:string|null;amount:number|null;created_at:string};
export type DemoData = {plants:DemoPlant[];logs:DemoLog[]};
export const DEMO_STORAGE_KEY = 'plant-health-portfolio-demo-v2';
export function sampleData(now = new Date()): DemoData {
 const date=(days:number)=>new Date(now.getTime()-days*86400000).toISOString().slice(0,10);
 const rows=[
  ['Big-leaf monstera','Monstera deliciosa','Living room','Healthy'],
  ['Lush golden pothos','Epipremnum aureum','Office','Healthy'],
  ['Bird of paradise','Strelitzia reginae','Balcony','Watch'],
  ['Crimson camellia','Camellia japonica','Yard','Needs care'],
 ];
 const plants=rows.map(([name,species,location,status],i)=>({id:`sample-${i}`,name,species,location,status,demo:1,created_at:now.toISOString(),photo:`/botanical/${["monstera","pothos","strelitzia","camellia"][i]}.webp`}));
 const notes=['Large split leaves, 58 cm across; newest leaf has fully unfurled.','Dense trailing vines, 145 cm long; variegation remains bright.','Orange and blue bird-of-paradise bloom open; one older leaf has a dry edge.','Deep red flowers open; a few buds dropped after a dry spell.','Healthy trailing growth observed.','A few soft leaf tips; check watering schedule.'];
 const logs:DemoLog[]=plants.flatMap((p,i)=>[
  {id:`sample-note-${i}`,plant_id:p.id,type:i===1||i===3||i===5?'Symptom':'Observation',date:date(i%4),note:notes[i],status:p.status,amount:null,created_at:new Date(now.getTime()-i*1000).toISOString()},
  {id:`sample-water-${i}`,plant_id:p.id,type:'Watering',date:date(i+2),note:'Sample watering record for exploring the care journal.',status:null,amount:150+i*50,created_at:now.toISOString()},
 ]).sort((a,b)=>b.date.localeCompare(a.date)||b.created_at.localeCompare(a.created_at));
 return {plants,logs};
}
export function updateDemo(data:DemoData,input:unknown):DemoData {
 if(!input||typeof input!=='object')throw Error('Invalid record.');
 const p=input as Record<string,unknown>;
 if(p.action==='demo')return sampleData();
 const now=new Date().toISOString();
 const id=crypto.randomUUID();
 const text=(key:string,max:number)=>{const s=p[key];if(typeof s!=='string'||!s.trim()||s.length>max)throw Error(`Please enter a valid ${key}.`);return s.trim();};
 const status=(v:unknown)=>typeof v==='string'&&['Healthy','Watch','Needs care'].includes(v);
 if(p.action==='plant'){
  if(!status(p.status))throw Error('Choose a health status.');
  const photo=typeof p.photo==='string'&&p.photo? p.photo:null;
  if(photo&&(!/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(photo)||photo.length>220000))throw Error('Choose a valid JPEG photo.');
  return {...data,plants:[...data.plants,{id,name:text('name',120),species:text('species',120),location:text('location',120),status:p.status as string,demo:0,created_at:now,photo,analysis:null}]};
 }
 if(p.action==='log'){
  if(!data.plants.some(plant=>plant.id===p.plantId))throw Error('Choose a plant.');
  if(!['Watering','Observation','Symptom'].includes(String(p.type)))throw Error('Choose a record type.');
  const date=text('date',10);
  if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||!Number.isFinite(Date.parse(date))||new Date(date).toISOString().slice(0,10)!==date||date>now.slice(0,10))throw Error('Choose a valid date up to today.');
  if(p.status!==null&&!status(p.status))throw Error('Choose a health status.');
  if(p.amount!==null&&(typeof p.amount!=='number'||!Number.isInteger(p.amount)||p.amount<1||p.amount>100000))throw Error('Enter a valid water amount.');
  const log:DemoLog={id,plant_id:p.plantId as string,type:p.type as string,date,note:text('note',2000),status:p.status as string|null,amount:p.amount as number|null,created_at:now};
  return {...data,logs:[log,...data.logs].sort((a,b)=>b.date.localeCompare(a.date)||b.created_at.localeCompare(a.created_at))};
 }
 throw Error('Unknown action.');
}
