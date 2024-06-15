"use strict";import{z as t,ZodError as N}from"zod";const b=(e,n)=>e.constructor.name===n.name,a=new Map;a.set(t.ZodBoolean.name,()=>!1),a.set(t.ZodNumber.name,()=>0),a.set(t.ZodString.name,()=>""),a.set(t.ZodArray.name,()=>[]),a.set(t.ZodRecord.name,()=>({})),a.set(t.ZodDefault.name,e=>e._def.defaultValue()),a.set(t.ZodEffects.name,e=>Z(e._def.schema)),a.set(t.ZodOptional.name,e=>b(e._def.innerType,t.ZodDefault)?e._def.innerType._def.defaultValue():void 0),a.set(t.ZodTuple.name,e=>{const n=[];for(const u of e._def.items)n.push(Z(u));return n}),a.set(t.ZodEffects.name,e=>Z(e._def.schema)),a.set(t.ZodUnion.name,e=>Z(e._def.options[0])),a.set(t.ZodObject.name,e=>p(e)),a.set(t.ZodRecord.name,e=>p(e)),a.set(t.ZodIntersection.name,e=>p(e));function Z(e){const n=e.constructor.name;if(!a.has(n)){console.warn("getSchemaDefaultForField: Unhandled type",e.constructor.name);return}return a.get(n)(e)}function p(e){if(b(e,t.ZodRecord))return{};if(b(e,t.ZodEffects))return p(e._def.schema);if(b(e,t.ZodIntersection))return Object.assign(Object.assign({},p(e._def.left)),p(e._def.right));if(b(e,t.ZodUnion)){for(const n of e._def.options)if(b(n,t.ZodObject))return p(n);return console.warn("getSchemaDefaultObject: No object found in union, returning empty object"),{}}return b(e,t.ZodObject)?Object.fromEntries(Object.entries(e.shape).map(([n,u])=>[n,Z(u)]).filter(n=>n[1]!==void 0)):(console.warn(`getSchemaDefaultObject: Expected object schema, got ${e.constructor.name}`),{})}function U(e){return p(e)}const v=e=>e.constructor.name===t.ZodEffects.name?e._def.schema:e,$=e=>e instanceof t.ZodObject||e instanceof t.ZodIntersection,y=(e,n)=>Object.fromEntries(Object.entries(e).map(([u,h])=>{const i=v(n).shape,m=i[u];if(!$(m))return[u,{value:h,error:""}];const E=y(h,i[u]);return[u,E]})),V=(e,n,u)=>{const h=e.createReactive,i=e.setReactive,m=e.getReactive,E=u||U(n),w=y(E,n),j=h(),g=h(),d=h();i(j,!1),i(g,[]),i(d,w);const F=(o,r)=>{for(const l in o){const s=o[l],c=Object.prototype.toString.call(s)==="[object Object]";c&&"value"in s&&"error"in s?r(s):c&&F(s,r)}},R=(o,r)=>{const l={};for(const s in o){const c=o[s],f=Object.prototype.toString.call(c)==="[object Object]";f&&"value"in c&&"error"in c?l[s]=r(c):f&&(l[s]=R(c,r))}return l},S=o=>{const r=[...o],l=o.join(".");let s=m(d),c=v(n).shape;for(;r.length>0;){const f=r.shift();if(!f)throw new Error(`Failed to assign form field "${l}".`);if(!(f in s))if(f in c)if(c[f].constructor.name===t.ZodOptional.name)s[f]={value:void 0,error:""};else throw new Error(`Failed to assign form field "${l}".`);else throw new Error(`Failed to assign form field "${l}".`);s=s[f];const O=c[f];(O&&"shape"in O||"_def"in O)&&(c=v(O).shape)}return s},A=o=>Array.isArray(o)?o:o!=null&&o.includes(".")?o.split("."):[o],I=(o,r)=>{const l=S(A(o));l.value=r,i(d,m(d))},x=()=>{i(d,w)},_=()=>{i(g,[]);const o=m(d);F(o,r=>{r.error=""}),i(d,m(d))},D=()=>{const o=m(d);return R(o,r=>r.value)},T=()=>{var o;_();try{return n.parse(D()),i(j,!0),!0}catch(r){if(typeof r=="object"&&((o=r?.constructor)==null?void 0:o.name)===N.name){const l=m(d),s=r.flatten();for(const c in s.fieldErrors){const f=s.fieldErrors[c];l[c].error=f!=null&&f.length?f[0]:""}return i(g,[...s.formErrors]),i(d,m(d)),i(j,!1),!1}throw i(j,!1),r}};return T(),_(),{form:d,formErrors:g,valid:j,assign:I,clear:x,clearErrors:_,validate:T,toJson:D,getFieldByPath:S}};export{v as getObj,$ as isFieldAnObject,y as objectToFormFields,V as useZodactiveForm};
