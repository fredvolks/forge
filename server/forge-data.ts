import {ServiceError,type VerifiedActor} from './identity';

/** Reads existing central tables, not a second catalogue or order store. */
export class ForgeData {
 constructor(private db:D1Database){}
 private async active(actor:VerifiedActor){
  const user=await this.db.prepare('SELECT role FROM users WHERE id=? AND company_id=? AND active=1').bind(actor.userId,actor.companyId).first<{role:string}>();
  if(!user)throw new ServiceError(403,'Accès refusé.');
  return user;
 }
 async catalog(actor:VerifiedActor){
  const user=await this.active(actor),admin=['boss','adjointe'].includes(user.role);
  const products=await this.db.prepare(`SELECT p.id,p.name,p.category_id,p.source_mode,p.default_supplier_id,p.active,c.name AS category
   FROM catalog_products p JOIN catalog_categories c ON c.id=p.category_id AND c.company_id=p.company_id
   WHERE p.company_id=? AND (?=1 OR (p.active=1 AND c.active=1)) ORDER BY p.name,p.id LIMIT 500`).bind(actor.companyId,admin?1:0).all();
  return products.results;
 }
 async jobs(actor:VerifiedActor){
  const user=await this.active(actor),admin=['boss','adjointe'].includes(user.role);
  const jobs=await this.db.prepare(`SELECT j.id,j.job_number,j.name,j.status FROM jobs j WHERE j.company_id=?
   AND (?=1 OR EXISTS(SELECT 1 FROM job_members m WHERE m.job_id=j.id AND m.user_id=?)) ORDER BY j.job_number LIMIT 500`).bind(actor.companyId,admin?1:0,actor.userId).all();
  return jobs.results;
 }
 async orders(actor:VerifiedActor){
  const user=await this.active(actor),admin=['boss','adjointe'].includes(user.role);
  const orders=await this.db.prepare(`SELECT o.id,o.job_id,o.status,o.priority,o.created_at,j.job_number,j.name AS job_name,
    (SELECT COUNT(*) FROM order_items i WHERE i.order_id=o.id AND i.company_id=o.company_id) AS item_count
   FROM orders o JOIN jobs j ON j.id=o.job_id AND j.company_id=o.company_id
   WHERE o.company_id=? AND (?=1 OR o.requested_by=?) ORDER BY o.created_at DESC,o.id LIMIT 200`).bind(actor.companyId,admin?1:0,actor.userId).all();
  return orders.results;
 }
 async order(actor:VerifiedActor,id:string){
  const user=await this.active(actor),admin=['boss','adjointe'].includes(user.role);
  const order=await this.db.prepare(`SELECT o.* FROM orders o JOIN jobs j ON j.id=o.job_id AND j.company_id=o.company_id
   WHERE o.id=? AND o.company_id=? AND (?=1 OR o.requested_by=?)`).bind(id,actor.companyId,admin?1:0,actor.userId).first();
  if(!order)throw new ServiceError(404,'Commande inaccessible.');
  const items=await this.db.prepare('SELECT id,name,quantity,unit,product_id,field_values_json,product_snapshot_json FROM order_items WHERE order_id=? AND company_id=? ORDER BY id').bind(id,actor.companyId).all();
  return {...order,items:items.results};
 }
}
