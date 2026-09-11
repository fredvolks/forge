import { ArrowRight, BarChart3, BriefcaseBusiness, CalendarDays, ClipboardList, Users } from 'lucide-react';

type Props = {
  active: number; teams: number; jobs: number; outside: number; pending: number;
  today: string; week: string; month: string;
  filter: (value: string) => void; navigate: (value: string) => void;
};

export function WorkforceSummary(p: Props) {
  return <div className="th-summary">
    <section className="th-summary-card th-summary-live" aria-label="En direct">
      <header><div><h2><i />EN DIRECT</h2><p>Employés actuellement au travail</p></div><button className="th-summary-link" onClick={() => p.navigate('employees')}>Voir les employés <ArrowRight /></button></header>
      <div className="th-summary-live-values">
        <button className="th-summary-primary" onClick={() => p.filter('active')}><strong>{p.active}</strong><span>au travail</span></button>
        <button onClick={() => p.navigate('activeTeams')}><Users /><strong>{p.teams}</strong><span>équipes actives</span></button>
        <button onClick={() => p.filter('jobs')}><BriefcaseBusiness /><strong>{p.jobs}</strong><span>Jobs occupées</span></button>
      </div>
    </section>
    <section className="th-summary-card th-summary-today" aria-label="Aujourd’hui">
      <header><div><h2><CalendarDays />AUJOURD’HUI</h2><p>Heures travaillées (tous employés)</p></div><button className="th-summary-link" onClick={() => p.navigate('punches')}>Voir les Punchs <ArrowRight /></button></header>
      <div className="th-summary-hours" aria-label={`${p.today} travaillées aujourd’hui`}><strong>{p.today}</strong></div>
      <footer><button onClick={() => p.navigate('corrections')}><ClipboardList />{p.pending} correction{p.pending > 1 ? 's' : ''} à traiter <ArrowRight /></button></footer>
    </section>
    <section className="th-summary-card th-summary-period" aria-label="Période">
      <header><div><h2><BarChart3 />PÉRIODE</h2><p>Cumul des heures travaillées</p></div><button className="th-summary-link" onClick={() => p.navigate('history')}>Voir l’historique <ArrowRight /></button></header>
      <dl><div><dt><CalendarDays />Cette semaine</dt><dd>{p.week}</dd></div><div><dt><CalendarDays />Ce mois-ci</dt><dd>{p.month}</dd></div></dl>
    </section>
  </div>;
}
