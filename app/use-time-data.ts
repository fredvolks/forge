'use client';
import { useSyncExternalStore } from 'react';
import { readTimeDemo } from '../lib/time-demo';
function subscribe(callback:()=>void){window.addEventListener('forge-time-updated',callback);window.addEventListener('storage',callback);return()=>{window.removeEventListener('forge-time-updated',callback);window.removeEventListener('storage',callback)};}
export function useTimeData(companyId:string){return useSyncExternalStore(subscribe,()=>readTimeDemo(companyId),()=>null);}
