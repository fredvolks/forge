'use client';
import {createClient,type SupabaseClient} from '@supabase/supabase-js';

// Recovery sessions are kept in memory only: no password or recovery token is saved.
export async function recoveryClient():Promise<SupabaseClient>{
 const response=await fetch('/api/auth/config',{cache:'no-store'});
 if(!response.ok)throw new Error('La récupération par courriel n’est pas encore activée. Contactez votre administrateur.');
 const config=await response.json() as {url:string;publishableKey:string};
 return createClient(config.url,config.publishableKey,{auth:{persistSession:false,autoRefreshToken:false,detectSessionInUrl:false}});
}

export function passwordError(password:string,confirmation:string){
 if(password.length<12)return 'Utilisez au moins 12 caractères.';
 if(password.length>128)return 'Utilisez au maximum 128 caractères.';
 if(password!==confirmation)return 'Les deux mots de passe ne correspondent pas.';
 return '';
}
