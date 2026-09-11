'use client';
import {useEffect,useState} from 'react';
import {CloudSun,Wind} from 'lucide-react';
import './header-weather.css';
export function HeaderWeather(){
 const [now,setNow]=useState<Date|null>(null);
 useEffect(()=>{setNow(new Date());const timer=setInterval(()=>setNow(new Date()),1000);return()=>clearInterval(timer)},[]);
 const options={timeZone:'America/Toronto'};
 return <section className="forge-header-weather" aria-label="Météo de démonstration et heure de Québec"><div className="fhw-weather"><CloudSun aria-hidden="true"/><div><strong>21° <span>Québec</span></strong><small>Éclaircies <span className="fhw-demo">Démo</span></small></div><span className="fhw-wind"><Wind size={15} aria-hidden="true"/>12 km/h</span></div><div className="fhw-clock"><time dateTime={now?.toISOString()}>{now?now.toLocaleTimeString('fr-CA',{...options,hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).replace(' h ',':'):'—:—'}</time><small>{now?now.toLocaleDateString('fr-CA',{...options,weekday:'short',day:'numeric',month:'short'}):'Heure de Québec'}</small></div></section>;
}
