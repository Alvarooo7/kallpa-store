const assert = require('node:assert/strict');
const fs = require('node:fs');
const ts = require('typescript');
const vm = require('node:vm');
const output = ts.transpileModule(fs.readFileSync('src/lib/rewards.ts', 'utf8'), {compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
const context={exports:{}};vm.runInNewContext(output,context);
const {rewardForRoll,TIERS,tierForCents,prizeLabel}=context.exports;
for(const tier of TIERS){
 const counts=new Map();
 for(let roll=0;roll<100;roll++){const r=rewardForRoll(tier.id,roll);counts.set(r.id,(counts.get(r.id)||0)+1);}
 for(const r of tier.prizes){assert.equal(counts.get(r.id),r.probability);assert.ok(prizeLabel(r,'practical'));assert.ok((r.amount||0)<=30);}
 for(const bad of [-1,100,0.5,NaN])assert.throws(()=>rewardForRoll(tier.id,bad));
}
for(const [cents,expected] of [[5999,null],[6000,'sorpresa'],[11999,'sorpresa'],[12000,'plus'],[22999,'plus'],[23000,'premium']])assert.equal(tierForCents(cents)?.id??null,expected);
assert.equal(tierForCents(6500-650),null,'10% discount is below entry minimum');
console.log('PASS: 300 outcomes, 3 probability tables, tier boundaries, credit cap, invalid rolls, discounted entry.');
