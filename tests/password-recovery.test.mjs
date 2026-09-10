import test from 'node:test';
import assert from 'node:assert/strict';
import {passwordError,recoveryClient} from '../app/auth-client.ts';

test('recovery rejects short, oversized and mismatched passwords',()=>{
 assert.match(passwordError('short','short'),/12/);
 assert.match(passwordError('x'.repeat(129),'x'.repeat(129)),/128/);
 assert.match(passwordError('a long unique phrase','a different phrase'),/correspondent/);
 assert.equal(passwordError('a long unique phrase','a long unique phrase'),'');
});

test('missing provider configuration fails explicitly before contacting auth',async()=>{
 const original=globalThis.fetch;
 const calls=[];
 globalThis.fetch=async(url)=>{calls.push(url);return new Response('{}',{status:503});};
 try{
  await assert.rejects(recoveryClient(),/pas encore activée/);
  assert.deepEqual(calls,['/api/auth/config']);
 }finally{globalThis.fetch=original;}
});
