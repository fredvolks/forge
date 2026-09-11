import {test} from 'node:test';
import assert from 'node:assert/strict';
import {parseMeasure,measured,profilePoints,publishDefinition,configuredGeometry,validateGeometry} from '../lib/folding-domain.ts';
const geometry=()=>({unit:'inch',material:'Acier',thickness:.018,segments:[{id:'a',label:'A',length:1.5,angle:0,mode:'employee_input',min:.5,max:12,step:.125,doubleFold:'none'},{id:'b',label:'B',length:2,angle:90,mode:'fixed',min:.5,max:12,step:.125,doubleFold:'none'}]});
test('fractions, decimals and unit conversion',()=>{
 for(const [text,n] of [['1',1],['1.5',1.5],['1/2',.5],['1 1/2"',1.5],['3 7/8',3.875]])assert.equal(parseMeasure(text),n);
 for(const text of ['','1/0','oops','-2','Infinity'])assert.throws(()=>parseMeasure(text));
 assert.equal(measured('25.4','mm'),1);
});
test('geometry is derived from lengths and relative turns',()=>{
 const p=profilePoints(geometry());assert.deepEqual(p[1],{x:1.5,y:0});assert.ok(Math.abs(p[2].x-1.5)<1e-8);assert.equal(p[2].y,2);
});
test('V1 order remains unchanged after publishing V2',()=>{
 const v1=publishDefinition({draft:geometry(),versions:[]});
 const order={versionId:v1.versions[0].id,geometry:configuredGeometry(v1.versions[0].geometry,{'fold-a':'2 1/2'})};
 v1.draft.segments[0].length=4;v1.draft.material='Aluminium';
 const v2=publishDefinition(v1);
 assert.equal(v2.versions[0].geometry.segments[0].length,1.5);
 assert.equal(v2.versions[1].geometry.segments[0].length,4);
 assert.equal(order.geometry.segments[0].length,2.5);assert.equal(order.geometry.material,'Acier');
 assert.equal(v2.versions[1].number,2);assert.notEqual(v2.versions[1].id,order.versionId);
});
test('employee constraints reject off-step, min/max and fixed overrides',()=>{
 assert.throws(()=>configuredGeometry(geometry(),{'fold-a':'13'}));
 assert.throws(()=>configuredGeometry(geometry(),{'fold-a':'1.1'}));
 assert.equal(configuredGeometry(geometry(),{'fold-b':'999'}).segments[1].length,2);
});
test('invalid publication is blocked',()=>{
 const g=geometry();g.segments[1].label='A';assert.ok(validateGeometry(g).length);assert.throws(()=>publishDefinition({draft:g,versions:[]}));
 g.segments[1].label='B';g.segments[0].length=0;assert.ok(validateGeometry(g).length);
});
