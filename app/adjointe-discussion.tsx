'use client';
import './adjointe-discussion.css';
import {ForgeMessages} from './forge-messages';
import {useTimeData} from './use-time-data';
import type {ForgeSession} from './forge-access';
export function AdjointeDiscussion({session,onJob}:{session:ForgeSession;jobs:{id:string;number:string;name:string;chef:string}[];onJob:(number:string)=>void}){
 const identity=useTimeData(session.companyId);
 return <section className="ad-discussion"><ForgeMessages session={session} jobs={identity?.jobs||[]} onJob={onJob}/></section>;
}
