'use client';
import {useEffect,useRef,useState} from 'react';
import {ArrowLeft,Check,Eye,EyeOff,LockKeyhole,Mail,ShieldCheck} from 'lucide-react';
import type {SupabaseClient} from '@supabase/supabase-js';
import {passwordError,recoveryClient} from './auth-client';
import './password-recovery.css';

export function PasswordRecovery({mode}:{mode:'request'|'reset'}){
 const [email,setEmail]=useState(''),[password,setPassword]=useState(''),[confirmation,setConfirmation]=useState('');
 const [busy,setBusy]=useState(false),[done,setDone]=useState(false),[error,setError]=useState(''),[show,setShow]=useState(false),[validLink,setValidLink]=useState(false);
 const token=useRef(''),client=useRef<SupabaseClient|null>(null),verified=useRef(false),captured=useRef(false);
 useEffect(()=>{
  if(mode!=='reset'||captured.current)return;captured.current=true;
  const params=new URLSearchParams(window.location.hash.slice(1));
  token.current=params.get('token_hash')||'';
  setValidLink(params.get('type')==='recovery'&&token.current.length>0);
  // Strip the credential before the user interacts; do not send it in an HTTP URL.
  window.history.replaceState(null,'',window.location.pathname);
 },[mode]);
 async function submit(e:React.FormEvent<HTMLFormElement>){
  e.preventDefault();if(busy)return;setError('');
  if(mode==='reset'){
   const problem=passwordError(password,confirmation);if(problem){setError(problem);return;}
   if(!validLink){setError('Ce lien est absent ou invalide. Demandez un nouveau lien.');return;}
  }
  setBusy(true);
  try{
   client.current??=await recoveryClient();
   if(mode==='request'){
    const result=await client.current.auth.resetPasswordForEmail(email.trim(),{redirectTo:`${window.location.origin}/reset-password`});
    if(result.error){
     if(result.error.status===429)throw new Error('Trop de demandes. Patientez quelques minutes avant de réessayer.');
     // Do not reveal whether the submitted account exists.
     throw new Error('La demande n’a pas pu être traitée. Réessayez plus tard ou contactez votre administrateur.');
    }
    setDone(true);
   }else{
    if(!verified.current){
     const result=await client.current.auth.verifyOtp({token_hash:token.current,type:'recovery'});
     if(result.error||!result.data.session){setValidLink(false);throw new Error('Ce lien a expiré ou a déjà été utilisé. Demandez un nouveau lien.');}
     verified.current=true;token.current='';
    }
    const result=await client.current.auth.updateUser({password});
    if(result.error){
     if(result.error.code==='weak_password')throw new Error('Ce mot de passe est trop facile à deviner. Choisissez une phrase plus longue et unique.');
     if(result.error.code==='same_password')throw new Error('Choisissez un mot de passe différent de l’ancien.');
     throw new Error('Le mot de passe n’a pas été modifié. Réessayez ou demandez un nouveau lien.');
    }
    // Ask the provider to revoke sessions after recovery, then discard this client.
    await client.current.auth.signOut({scope:'global'});
    client.current=null;verified.current=false;setPassword('');setConfirmation('');setDone(true);
   }
  }catch(err){setError(err instanceof Error?err.message:'Connexion interrompue. Réessayez.');}
  finally{setBusy(false);}
 }
 return <main className="forge-recovery"><section className="recovery-card" aria-labelledby="recovery-title">
  <a className="recovery-back" href="/"><ArrowLeft/> Retour à Forge</a>
  <div className="recovery-mark">{done?<Check/>:mode==='request'?<Mail/>:<LockKeyhole/>}</div>
  <span className="recovery-brand">FORGE · ACCÈS AU COMPTE</span>
  <h1 id="recovery-title">{done?(mode==='request'?'Vérifiez vos courriels':'Mot de passe modifié'):mode==='request'?'Mot de passe oublié?':'Votre nouveau mot de passe'}</h1>
  {done?<><p role="status">{mode==='request'?'Si un compte correspond à cette adresse, vous recevrez un lien pour réinitialiser votre mot de passe. Vérifiez aussi vos indésirables.':'Votre nouveau mot de passe est enregistré. Vous pouvez retourner à la connexion.'}</p><a className="recovery-primary" href="/">Retour à Forge</a>{mode==='request'&&<button className="recovery-secondary" onClick={()=>{setDone(false);setError('')}}>Utiliser une autre adresse</button>}</>:<>
   <p>{mode==='request'?'Entrez le courriel associé à votre compte Forge. Nous vous enverrons un lien sécurisé.':'Choisissez une phrase de passe unique d’au moins 12 caractères.'}</p>
   {mode==='reset'&&!validLink?<div className="recovery-error" role="alert">Lien absent ou invalide. <a href="/forgot-password">Demander un nouveau lien</a></div>:<form onSubmit={submit}>
    {mode==='request'?<label>Courriel<input type="email" autoComplete="email" required maxLength={254} value={email} onChange={e=>setEmail(e.target.value)} placeholder="vous@compagnie.ca" disabled={busy}/></label>:<>
     <label>Nouveau mot de passe<div className="recovery-password"><input type={show?'text':'password'} autoComplete="new-password" minLength={12} maxLength={128} required value={password} onChange={e=>setPassword(e.target.value)} disabled={busy}/><button type="button" aria-label={show?'Masquer le mot de passe':'Afficher le mot de passe'} aria-pressed={show} onClick={()=>setShow(!show)}>{show?<EyeOff/>:<Eye/>}</button></div></label>
     <label>Confirmer le mot de passe<input type={show?'text':'password'} autoComplete="new-password" minLength={12} maxLength={128} required value={confirmation} onChange={e=>setConfirmation(e.target.value)} disabled={busy}/></label>
    </>}
    {error&&<p className="recovery-error" role="alert">{error}</p>}
    <button className="recovery-primary" disabled={busy}>{busy?'Un instant…':mode==='request'?'Envoyer le lien':'Enregistrer le mot de passe'}</button>
   </form>}
  </>}
  <p className="recovery-note"><ShieldCheck/> Votre mot de passe ne vous sera jamais envoyé par courriel.</p>
 </section></main>;
}
