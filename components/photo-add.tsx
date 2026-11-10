'use client';
import { useEffect, useRef, useState } from 'react';
import { Camera, ImagePlus } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
type Analysis={isPlant:boolean;commonName:string;scientificName:string;confidence:'low'|'medium'|'high';observations:string[];careNotes:string[]};
export function PhotoAdd({locations,onSave,demo=false}:{demo?:boolean;locations:string[];onSave:(data:unknown)=>Promise<boolean>}){
 const [open,setOpen]=useState(false),[photo,setPhoto]=useState(''),[name,setName]=useState(''),[species,setSpecies]=useState(''),[location,setLocation]=useState('Balcony'),[health,setHealth]=useState('Watch'),[analysis,setAnalysis]=useState<Analysis|null>(null),[error,setError]=useState(''),[working,setWorking]=useState(false),[available,setAvailable]=useState<boolean|null>(null);
 const camera=useRef<HTMLInputElement>(null),upload=useRef<HTMLInputElement>(null),generation=useRef(0);
 useEffect(()=>{if(demo){setAvailable(false);return;}if(open)fetch('/api/analyze').then(r=>r.json() as Promise<{available?:boolean}>).then(d=>setAvailable(Boolean(d.available))).catch(()=>setAvailable(false));},[open,demo]);
 function start(){generation.current++;setPhoto('');setName('');setSpecies('');setAnalysis(null);setError('');setOpen(true);}
 async function choose(file?:File){
  if(!file)return;
  const version=++generation.current;setWorking(true);setError('');setAnalysis(null);setName('');setSpecies('');
  try{
   if(!file.type.startsWith('image/')||file.size>20*1024*1024)throw Error('Choose an image smaller than 20 MB.');
   const bitmap=await createImageBitmap(file,{imageOrientation:'from-image'});
   const scale=Math.min(1,768/Math.max(bitmap.width,bitmap.height));const canvas=document.createElement('canvas');canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale);
   const ctx=canvas.getContext('2d');if(!ctx)throw Error('Could not process this photo.');
   ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();
   let value=canvas.toDataURL('image/jpeg',.78);
   if(value.length>220000)value=canvas.toDataURL('image/jpeg',.45);
   if(value.length>220000)throw Error('This photo is too detailed. Try a closer crop.');
   if(version===generation.current)setPhoto(value);
  }catch(e){if(version===generation.current){setPhoto('');setError(e instanceof Error?e.message:'Could not open this image. Try a JPEG or PNG.');}}
  finally{if(version===generation.current)setWorking(false);}
 }
 async function identify(){
  setWorking(true);setError('');
  try{const r=await fetch('/api/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({photo})});const d=await r.json() as {analysis?:Analysis;error?:string};if(!r.ok||!d.analysis)throw Error(d.error||'No identification returned.');setAnalysis(d.analysis);if(d.analysis.isPlant){setSpecies(d.analysis.scientificName||d.analysis.commonName);setName(d.analysis.commonName);}}
  catch(e){setError(e instanceof Error?e.message:'Analysis failed.');}finally{setWorking(false);}
 }
 async function submit(e:React.FormEvent){e.preventDefault();setWorking(true);setError('');try{if(await onSave({action:'plant',name,species,location,status:health,photo,analysis}))setOpen(false);else setError('Could not save the plant. Your photo and details are kept here.');}finally{setWorking(false);}}
 return <><button className="secondary" onClick={start}><Camera size={18}/> Add from photo</button><Dialog open={open} onOpenChange={v=>{if(!working)setOpen(v)}}><DialogContent className="plant-dialog photo-dialog"><DialogTitle>Add a plant from a photo</DialogTitle><DialogDescription>Capture one plant clearly, then review its species, name and location before saving.</DialogDescription>
 <input ref={camera} type="file" accept="image/*" capture="environment" hidden onChange={e=>{choose(e.target.files?.[0]);e.target.value='';}}/><input ref={upload} type="file" accept="image/*" hidden onChange={e=>{choose(e.target.files?.[0]);e.target.value='';}}/>
 <div className="photo-actions"><button className="secondary" disabled={working} onClick={()=>camera.current?.click()}><Camera size={17}/> Take photo</button><button className="secondary" disabled={working} onClick={()=>upload.current?.click()}><ImagePlus size={17}/> Upload photo</button></div>
 {working&&!photo&&<p role="status">Preparing photo…</p>}
 {photo&&<><img className="photo-preview" src={photo} alt="Plant photo to review"/><button className="primary" disabled={working||available!==true} onClick={identify}>{working?'Working…':'Identify & analyze'}</button><p className="photo-caption">{demo?'Photo upload works locally in this demo. Automatic AI analysis is not enabled.':available===false?'Automatic identification is not enabled yet. You can save the photo and enter the species yourself.':available===null?'Checking photo analysis…':'Analysis sends this photo to OpenAI. Suggestions can be wrong; confirm the species and health yourself.'}</p>
 {analysis&&<div className="photo-analysis"><strong>{analysis.isPlant?analysis.commonName||'Possible plant':'No clear plant identified'}</strong><p>{analysis.scientificName} · Identification confidence: {analysis.confidence}</p>{analysis.observations.length>0&&<><b>Visible observations</b><ul>{analysis.observations.map((s,i)=><li key={i}>{s}</li>)}</ul></>}{analysis.careNotes.length>0&&<><b>Things to check</b><ul>{analysis.careNotes.map((s,i)=><li key={i}>{s}</li>)}</ul></>}<p>A photo cannot confirm a disease or soil conditions.</p></div>}
 <form onSubmit={submit}><div className="form-grid"><label>Your plant name<input required maxLength={120} value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. My balcony basil"/></label><label>Species / identification<input required maxLength={120} value={species} onChange={e=>setSpecies(e.target.value)} placeholder="Species or Unknown plant"/></label><label>Location / category<input list="photo-locations" required maxLength={120} value={location} onChange={e=>setLocation(e.target.value)}/><datalist id="photo-locations">{Array.from(new Set(['Balcony','Yard','Summer house','Living room','Office',...locations])).map(s=><option key={s} value={s}/>)}</datalist></label><label>Your health assessment<select value={health} onChange={e=>setHealth(e.target.value)}>{['Healthy','Watch','Needs care'].map(s=><option key={s}>{s}</option>)}</select></label></div><div className="form-footer"><button type="button" className="secondary" disabled={working} onClick={()=>setOpen(false)}>Cancel</button><button className="primary" disabled={working}>{working?'Working…':'Save plant & photo'}</button></div></form></>}
 {error&&<p className="form-error" role="alert">{error}</p>}</DialogContent></Dialog></>;
}
