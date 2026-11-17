var e=Object.create,t=Object.defineProperty,n=Object.getOwnPropertyDescriptor,r=Object.getOwnPropertyNames,i=Object.getPrototypeOf,a=Object.prototype.hasOwnProperty,o=(e,t)=>()=>(t||(e((t={exports:{}}).exports,t,t.exports),e=null),t.exports),s=(e,i,o,s)=>{if(i&&typeof i==`object`||typeof i==`function`)for(var c=r(i),l=0,u=c.length,d;l<u;l++)d=c[l],!a.call(e,d)&&d!==o&&t(e,d,{get:(e=>i[e]).bind(null,d),enumerable:!(s=n(i,d))||s.enumerable});return e},c=(n,r,o)=>(o=n==null?{}:e(i(n)),s(r||!n||!n.__esModule||!a.call(n,`default`)?t(o,`default`,{value:n,enumerable:!0}):o,n)),l=(e=>typeof require<`u`?require:typeof Proxy<`u`?new Proxy(e,{get:(e,t)=>(typeof require<`u`?require:e)[t]}):e)(function(e){if(typeof require<`u`)return require.apply(this,arguments);throw Error('Calling `require` for "'+e+"\" in an environment that doesn't expose the `require` function. See https://rolldown.rs/in-depth/bundling-cjs#require-external-modules for more details.")});(function(){let e=document.createElement(`link`).relList;if(e&&e.supports&&e.supports(`modulepreload`))return;for(let e of document.querySelectorAll(`link[rel="modulepreload"]`))n(e);new MutationObserver(e=>{for(let t of e)if(t.type===`childList`)for(let e of t.addedNodes)e.tagName===`LINK`&&e.rel===`modulepreload`&&n(e)}).observe(document,{childList:!0,subtree:!0});function t(e){let t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),t.credentials=e.crossOrigin===`use-credentials`?`include`:e.crossOrigin===`anonymous`?`omit`:`same-origin`,t}function n(e){if(e.ep)return;e.ep=!0;let n=t(e);fetch(e.href,n)}})();var u;(function(e){e.Unimplemented=`UNIMPLEMENTED`,e.Unavailable=`UNAVAILABLE`})(u||={});var d=class extends Error{constructor(e,t,n){super(e),this.message=e,this.code=t,this.data=n}},f=e=>e?.androidBridge?`android`:e?.webkit?.messageHandlers?.bridge?`ios`:`web`,p=e=>{let t=e.CapacitorCustomPlatform||null,n=e.Capacitor||{},r=n.Plugins=n.Plugins||{},i=()=>t===null?f(e):t.name,a=()=>i()!==`web`,o=e=>!!(l.get(e)?.platforms.has(i())||s(e)),s=e=>n.PluginHeaders?.find(t=>t.name===e),c=t=>e.console.error(t),l=new Map;return n.convertFileSrc||=e=>e,n.getPlatform=i,n.handleError=c,n.isNativePlatform=a,n.isPluginAvailable=o,n.registerPlugin=(e,a={})=>{let o=l.get(e);if(o)return console.warn(`Capacitor plugin "${e}" already registered. Cannot register plugins twice.`),o.proxy;let c=i(),f=s(e),p,m=async()=>(!p&&c in a?p=p=typeof a[c]==`function`?await a[c]():a[c]:t!==null&&!p&&`web`in a&&(p=p=typeof a.web==`function`?await a.web():a.web),p),h=(t,r)=>{if(f){let i=f?.methods.find(e=>r===e.name);if(i)return i.rtype===`promise`?t=>n.nativePromise(e,r.toString(),t):(t,i)=>n.nativeCallback(e,r.toString(),t,i);if(t)return t[r]?.bind(t)}else if(t)return t[r]?.bind(t);else throw new d(`"${e}" plugin is not implemented on ${c}`,u.Unimplemented)},g=t=>{let n,r=(...r)=>{let i=m().then(i=>{let a=h(i,t);if(a){let e=a(...r);return n=e?.remove,e}throw new d(`"${e}.${t}()" is not implemented on ${c}`,u.Unimplemented)});return t===`addListener`&&(i.remove=async()=>n()),i};return r.toString=()=>`${t.toString()}() { [capacitor code] }`,Object.defineProperty(r,"name",{value:t,writable:!1,configurable:!1}),r},_=g(`addListener`),v=g(`removeListener`),y=(e,t)=>{let n=_({eventName:e},t).then(e=>e),r=async()=>{let t=await n;await v({eventName:e,callbackId:t})},i=new Promise(e=>n.then(()=>e({remove:r})));return i.remove=async()=>{console.warn(`Using addListener() without 'await' is deprecated.`),await r()},i},b=new Proxy({},{get(e,t){switch(t){case`$$typeof`:return;case`toJSON`:return()=>({});case`addListener`:return f?y:_;case`removeListener`:return v;default:return g(t)}}});return r[e]=b,l.set(e,{name:e,proxy:b,platforms:new Set([...Object.keys(a),...f?[c]:[]])}),b},n.Exception=d,n.DEBUG=!!n.DEBUG,n.isLoggingEnabled=!!n.isLoggingEnabled,n},m=(e=>e.Capacitor=p(e))(typeof globalThis<`u`?globalThis:typeof self<`u`?self:typeof window<`u`?window:typeof global<`u`?global:{}),h=m.registerPlugin,g=class{constructor(){this.listeners={},this.retainedEventArguments={},this.windowListeners={}}addListener(e,t){let n=!1;this.listeners[e]||(this.listeners[e]=[],n=!0),this.listeners[e].push(t);let r=this.windowListeners[e];return r&&!r.registered&&this.addWindowListener(r),n&&this.sendRetainedArgumentsForEvent(e),Promise.resolve({remove:async()=>this.removeListener(e,t)})}async removeAllListeners(){this.listeners={};for(let e in this.windowListeners)this.removeWindowListener(this.windowListeners[e]);this.windowListeners={}}notifyListeners(e,t,n){let r=this.listeners[e];if(r)r.forEach(e=>e(t));else if(n){let n=this.retainedEventArguments[e];n||=[],n.push(t),this.retainedEventArguments[e]=n}}hasListeners(e){return!!this.listeners[e]?.length}registerWindowListener(e,t){this.windowListeners[t]={registered:!1,windowEventName:e,pluginEventName:t,handler:e=>{this.notifyListeners(t,e)}}}unimplemented(e=`not implemented`){return new m.Exception(e,u.Unimplemented)}unavailable(e=`not available`){return new m.Exception(e,u.Unavailable)}async removeListener(e,t){let n=this.listeners[e];if(!n)return;let r=n.indexOf(t);r!==-1&&this.listeners[e].splice(r,1),this.listeners[e].length||this.removeWindowListener(this.windowListeners[e])}addWindowListener(e){window.addEventListener(e.windowEventName,e.handler),e.registered=!0}removeWindowListener(e){e&&(window.removeEventListener(e.windowEventName,e.handler),e.registered=!1)}sendRetainedArgumentsForEvent(e){let t=this.retainedEventArguments[e];t&&(delete this.retainedEventArguments[e],t.forEach(t=>{this.notifyListeners(e,t)}))}},_=e=>encodeURIComponent(e).replace(/%(2[346B]|5E|60|7C)/g,decodeURIComponent).replace(/[()]/g,escape),v=e=>e.replace(/(%[\dA-F]{2})+/gi,decodeURIComponent),y=class extends g{async getCookies(){let e=document.cookie,t={};return e.split(`;`).forEach(e=>{if(e.length<=0)return;let[n,r]=e.replace(/=/,`CAP_COOKIE`).split(`CAP_COOKIE`);n=v(n).trim(),r=v(r).trim(),t[n]=r}),t}async setCookie(e){try{let t=_(e.key),n=_(e.value),r=e.expires?`; expires=${e.expires.replace(`expires=`,``)}`:``,i=(e.path||`/`).replace(`path=`,``),a=e.url!=null&&e.url.length>0?`domain=${e.url}`:``;document.cookie=`${t}=${n||``}${r}; path=${i}; ${a};`}catch(e){return Promise.reject(e)}}async deleteCookie(e){try{document.cookie=`${e.key}=; Max-Age=0`}catch(e){return Promise.reject(e)}}async clearCookies(){try{let e=document.cookie.split(`;`)||[];for(let t of e)document.cookie=t.replace(/^ +/,``).replace(/=.*/,`=;expires=${new Date().toUTCString()};path=/`)}catch(e){return Promise.reject(e)}}async clearAllCookies(){try{await this.clearCookies()}catch(e){return Promise.reject(e)}}};h(`CapacitorCookies`,{web:()=>new y});var b=async e=>new Promise((t,n)=>{let r=new FileReader;r.onload=()=>{let e=r.result;t(e.indexOf(`,`)>=0?e.split(`,`)[1]:e)},r.onerror=e=>n(e),r.readAsDataURL(e)}),ee=(e={})=>{let t=Object.keys(e);return Object.keys(e).map(e=>e.toLocaleLowerCase()).reduce((n,r,i)=>(n[r]=e[t[i]],n),{})},x=(e,t=!0)=>e?Object.entries(e).reduce((e,n)=>{let[r,i]=n,a,o;return Array.isArray(i)?(o=``,i.forEach(e=>{a=t?encodeURIComponent(e):e,o+=`${r}=${a}&`}),o.slice(0,-1)):(a=t?encodeURIComponent(i):i,o=`${r}=${a}`),`${e}&${o}`},``).substr(1):null,te=(e,t={})=>{let n=Object.assign({method:e.method||`GET`,headers:e.headers},t),r=ee(e.headers)[`content-type`]||``;if(typeof e.data==`string`)n.body=e.data;else if(r.includes(`application/x-www-form-urlencoded`)){let t=new URLSearchParams;for(let[n,r]of Object.entries(e.data||{}))t.set(n,r);n.body=t.toString()}else if(r.includes(`multipart/form-data`)||e.data instanceof FormData){let t=new FormData;if(e.data instanceof FormData)e.data.forEach((e,n)=>{t.append(n,e)});else for(let n of Object.keys(e.data))t.append(n,e.data[n]);n.body=t;let r=new Headers(n.headers);r.delete(`content-type`),n.headers=r}else(r.includes(`application/json`)||typeof e.data==`object`)&&(n.body=JSON.stringify(e.data));return n},ne=class extends g{async request(e){let t=te(e,e.webFetchExtra),n=x(e.params,e.shouldEncodeUrlParams),r=n?`${e.url}?${n}`:e.url,i=await fetch(r,t),a=i.headers.get(`content-type`)||``,{responseType:o=`text`}=i.ok?e:{};a.includes(`application/json`)&&(o=`json`);let s,c;switch(o){case`arraybuffer`:case`blob`:c=await i.blob(),s=await b(c);break;case`json`:s=await i.json();break;default:s=await i.text()}let l={};return i.headers.forEach((e,t)=>{l[t]=e}),{data:s,headers:l,status:i.status,url:i.url}}async get(e){return this.request(Object.assign(Object.assign({},e),{method:`GET`}))}async post(e){return this.request(Object.assign(Object.assign({},e),{method:`POST`}))}async put(e){return this.request(Object.assign(Object.assign({},e),{method:`PUT`}))}async patch(e){return this.request(Object.assign(Object.assign({},e),{method:`PATCH`}))}async delete(e){return this.request(Object.assign(Object.assign({},e),{method:`DELETE`}))}};h(`CapacitorHttp`,{web:()=>new ne});var re;(function(e){e.Dark=`DARK`,e.Light=`LIGHT`,e.Default=`DEFAULT`})(re||={});var ie;(function(e){e.StatusBar=`StatusBar`,e.NavigationBar=`NavigationBar`})(ie||={});var ae=class extends g{async setStyle(){this.unavailable(`not available for web`)}async setAnimation(){this.unavailable(`not available for web`)}async show(){this.unavailable(`not available for web`)}async hide(){this.unavailable(`not available for web`)}};h(`SystemBars`,{web:()=>new ae});var oe=`modulepreload`,se=function(e){return`/`+e},ce={},le=function(e){return e.pathname.endsWith(`.css`)},ue=function(e,t,n){if(t in e)return e[t];let r=n();if(!r){e[t]=void 0;return}let i=r.then(()=>{e[t]=void 0},n=>{throw e[t]=void 0,n});return e[t]=i,i},de=function(e,t,n){let r=Promise.resolve();if(t&&t.length>0){let e,i=document.querySelector(`meta[property=csp-nonce]`),a=i?.nonce||i?.getAttribute(`nonce`);function o(e){return Promise.all(e.map(e=>Promise.resolve(e).then(e=>({status:`fulfilled`,value:e}),e=>({status:`rejected`,reason:e}))))}function s(e){return import.meta.resolve?new URL(import.meta.resolve(e)):new URL(e,import.meta.url)}r=o(t.map(t=>{t=se(t,n);let r=s(t),i=le(r);return ue(ce,r.href,()=>{if(e===void 0){e={all:new Set,styles:new Set};let t=document.getElementsByTagName(`link`);for(let n=t.length-1;n>=0;n--){let r=t[n];e.all.add(r.href),r.rel===`stylesheet`&&e.styles.add(r.href)}}if((i?e.styles:e.all).has(r.href))return;let t=document.createElement(`link`);if(t.rel=i?`stylesheet`:oe,i||(t.as=`script`),t.crossOrigin=``,t.href=r.href,a&&t.setAttribute(`nonce`,a),document.head.appendChild(t),i)return new Promise((e,n)=>{let i=a=>{t.removeEventListener(`load`,i),t.removeEventListener(`error`,i),a.type===`error`?n(Error(`Unable to preload CSS for ${r}`)):e(a)};t.addEventListener(`load`,i),t.addEventListener(`error`,i)})})}).filter(e=>e!==void 0))}function i(e){let t=new Event(`vite:preloadError`,{cancelable:!0});if(t.payload=e,window.dispatchEvent(t),!t.defaultPrevented)throw e}return r.then(t=>{for(let e of t||[])e.status===`rejected`&&i(e.reason);return e().catch(i)})},fe=h(`Preferences`,{web:()=>de(()=>import(`./web-CkfbjEHr.js`).then(e=>new e.PreferencesWeb),[])}),S=new TextEncoder,pe=new TextDecoder,me=`v1`,he=21e4;function ge(e){let t=``,n=32768;for(let r=0;r<e.length;r+=n)t+=String.fromCharCode(...e.subarray(r,r+n));return btoa(t)}function _e(e){let t=atob(e),n=new Uint8Array(t.length);for(let e=0;e<t.length;e+=1)n[e]=t.charCodeAt(e);return n}function ve(){return crypto.getRandomValues(new Uint8Array(32))}function ye(e){return e.buffer.slice(e.byteOffset,e.byteOffset+e.byteLength)}async function be(e){return crypto.subtle.importKey(`raw`,ye(e),{name:`AES-GCM`},!1,[`encrypt`,`decrypt`])}async function xe(e,t){let n=await be(t),r=crypto.getRandomValues(new Uint8Array(12)),i=await crypto.subtle.encrypt({name:`AES-GCM`,iv:ye(r)},n,S.encode(e));return`${me}:${ge(r)}:${ge(new Uint8Array(i))}`}async function C(e,t){let n=e.split(`:`);if(n.length!==3||n[0]!==me)throw Error(`Format data terenkripsi tidak dikenali.`);let r=n[1],i=n[2];if(!r||!i)throw Error(`Data terenkripsi tidak lengkap.`);let a=await be(t),o=await crypto.subtle.decrypt({name:`AES-GCM`,iv:ye(_e(r))},a,ye(_e(i)));return pe.decode(o)}async function Se(e,t,n){let r=await crypto.subtle.importKey(`raw`,S.encode(e),`PBKDF2`,!1,[`deriveKey`]);return crypto.subtle.deriveKey({name:`PBKDF2`,salt:ye(t),iterations:n,hash:`SHA-256`},r,{name:`AES-GCM`,length:256},!1,[`encrypt`,`decrypt`])}async function Ce(e,t,n){let r=crypto.getRandomValues(new Uint8Array(16)),i=crypto.getRandomValues(new Uint8Array(12)),a=await Se(t,r,he),o=await crypto.subtle.encrypt({name:`AES-GCM`,iv:ye(i)},a,S.encode(e));return{format:`manka-backup`,version:1,createdAt:n,kdf:{name:`PBKDF2-SHA256`,iterations:he,salt:ge(r)},cipher:{name:`AES-GCM`,iv:ge(i)},payload:ge(new Uint8Array(o))}}async function we(e,t){if(e.format!==`manka-backup`||e.version!==1||e.kdf?.name!==`PBKDF2-SHA256`||e.cipher?.name!==`AES-GCM`)throw Error(`Format backup tidak didukung.`);if(!Number.isSafeInteger(e.kdf.iterations)||e.kdf.iterations<1e5||e.kdf.iterations>1e6)throw Error(`Parameter keamanan backup tidak valid.`);let n=_e(e.kdf.salt),r=_e(e.cipher.iv),i=await Se(t,n,e.kdf.iterations);try{let t=await crypto.subtle.decrypt({name:`AES-GCM`,iv:ye(r)},i,ye(_e(e.payload)));return pe.decode(t)}catch{throw Error(`Kata sandi backup salah atau file backup rusak.`)}}var Te=`manka.encryption.key.v1`,Ee=class{async get(e){return(await fe.get({key:e})).value}async set(e,t){await fe.set({key:e,value:t})}},De=class{store;keyPromise=null;constructor(e=new Ee){this.store=e}async loadKey(){return this.keyPromise||=(async()=>{let e=await this.store.get(Te);if(e)return _e(e);let t=ve();return await this.store.set(Te,ge(t)),t})(),this.keyPromise}async encrypt(e){return e==null||e.trim()===``?null:xe(e,await this.loadKey())}async decrypt(e){return e?C(e,await this.loadKey()):null}async exportKeyBase64(){return ge(await this.loadKey())}async replaceKey(e){let t=_e(e);if(t.length!==32)throw Error(`Kunci enkripsi backup tidak valid.`);await this.store.set(Te,e),this.keyPromise=Promise.resolve(t)}};function Oe(){if(typeof crypto<`u`&&typeof crypto.randomUUID==`function`)return crypto.randomUUID();let e=new Uint8Array(16);if(typeof crypto<`u`&&typeof crypto.getRandomValues==`function`)crypto.getRandomValues(e);else for(let t=0;t<e.length;t+=1)e[t]=Math.floor(Math.random()*256);e[6]=(e[6]??0)&15,e[6]=(e[6]??0)|64,e[8]=(e[8]??0)&63,e[8]=(e[8]??0)|128;let t=Array.from(e,e=>e.toString(16).padStart(2,`0`));return[t.slice(0,4).join(``),t.slice(4,6).join(``),t.slice(6,8).join(``),t.slice(8,10).join(``),t.slice(10,16).join(``)].join(`-`)}var ke=[{value:`today`,label:`Hari ini`},{value:`thisWeek`,label:`Minggu ini`},{value:`lastWeek`,label:`Minggu lalu`},{value:`last7`,label:`7 hari terakhir`},{value:`last30`,label:`30 hari terakhir`},{value:`thisMonth`,label:`Bulan ini`},{value:`lastMonth`,label:`Bulan lalu`},{value:`thisYear`,label:`Tahun ini`},{value:`custom`,label:`Rentang khusus`}],Ae=/^(\d{4})-(\d{2})-(\d{2})$/,je=new Intl.DateTimeFormat(`en-CA`,{timeZone:`Asia/Jakarta`,year:`numeric`,month:`2-digit`,day:`2-digit`}),Me=new Intl.DateTimeFormat(`id-ID`,{timeZone:`UTC`,day:`numeric`,month:`short`,year:`numeric`}),Ne=new Intl.DateTimeFormat(`id-ID`,{timeZone:`UTC`,day:`numeric`,month:`long`,year:`numeric`}),Pe=new Intl.DateTimeFormat(`id-ID`,{timeZone:`UTC`,weekday:`long`,day:`numeric`,month:`long`,year:`numeric`}),Fe=new Intl.DateTimeFormat(`id-ID`,{timeZone:`Asia/Jakarta`,day:`2-digit`,month:`short`,year:`numeric`,hour:`2-digit`,minute:`2-digit`});function Ie(e){return String(e).padStart(2,`0`)}function Le(e){let t=Ae.exec(e);if(!t)throw Error(`Tanggal tidak valid: ${e}`);return new Date(Date.UTC(Number(t[1]),Number(t[2])-1,Number(t[3])))}function Re(e){return`${e.getUTCFullYear()}-${Ie(e.getUTCMonth()+1)}-${Ie(e.getUTCDate())}`}function w(){return je.format(new Date)}function T(){return new Date().toISOString()}function ze(e){let t=Ae.exec(e);if(!t)return!1;let n=Number(t[1]),r=Number(t[2]),i=Number(t[3]);if(r<1||r>12||i<1||i>31)return!1;let a=new Date(Date.UTC(n,r-1,i));return a.getUTCFullYear()===n&&a.getUTCMonth()===r-1&&a.getUTCDate()===i}function E(e,t){let n=Le(e);return n.setUTCDate(n.getUTCDate()+t),Re(n)}function Be(e,t){let n=Le(e),r=n.getUTCDate();n.setUTCDate(1),n.setUTCMonth(n.getUTCMonth()+t);let i=new Date(Date.UTC(n.getUTCFullYear(),n.getUTCMonth()+1,0)).getUTCDate();return n.setUTCDate(Math.min(r,i)),Re(n)}function Ve(e){let t=Le(e).getUTCDay();return E(e,-(t===0?6:t-1))}function He(e){return`${e.slice(0,7)}-01`}function Ue(e){let t=Le(e);return Re(new Date(Date.UTC(t.getUTCFullYear(),t.getUTCMonth()+1,0)))}function We(e){return`${e.slice(0,4)}-01-01`}function Ge(e,t){let n=Le(e).getTime(),r=Le(t).getTime();return Math.floor((r-n)/864e5)}function Ke(e,t){let n=Ge(e,t),r=[];for(let t=0;t<=n;t+=1)r.push(E(e,t));return r}function D(e,t=`short`){let n=Le(e);return t===`long`?Ne.format(n):t===`weekday`?Pe.format(n):Me.format(n)}function qe(e){let t=new Date(e);return Number.isNaN(t.getTime())?`—`:Fe.format(t)}function Je(e,t){return e===t?D(e,`long`):`${D(e)} – ${D(t)}`}function Ye(e){let t=Ge(e.from,e.to)+1,n=E(e.from,-1);return{from:E(n,-(t-1)),to:n}}function Xe(e,t,n=w()){let r,i;switch(e){case`today`:r=n,i=n;break;case`thisWeek`:r=Ve(n),i=n;break;case`lastWeek`:{let e=E(Ve(n),-7);r=e,i=E(e,6);break}case`last7`:r=E(n,-6),i=n;break;case`last30`:r=E(n,-29),i=n;break;case`thisMonth`:r=He(n),i=n;break;case`lastMonth`:{let e=Be(He(n),-1);r=He(e),i=Ue(e);break}case`thisYear`:r=We(n),i=n;break;case`custom`:if(r=t?.from??E(n,-29),i=t?.to??n,!ze(r)||!ze(i))throw Error(`Rentang tanggal tidak valid.`);r>i&&([r,i]=[i,r]);break;default:throw Error(`Periode tidak dikenal: ${String(e)}`)}return{preset:e,from:r,to:i,label:Je(r,i)}}function O(e,t){let n=e[t];if(typeof n==`string`)return n;if(typeof n==`number`)return String(n);throw Error(`Kolom ${t} tidak berisi teks.`)}function k(e,t){let n=e[t];if(n==null)return null;if(typeof n==`string`)return n;if(typeof n==`number`)return String(n);throw Error(`Kolom ${t} tidak berisi teks.`)}function A(e,t){let n=e[t];if(typeof n==`number`&&Number.isFinite(n))return n;if(typeof n==`string`&&n.trim()!==``){let e=Number(n);if(Number.isFinite(e))return e}throw Error(`Kolom ${t} tidak berisi angka.`)}function Ze(e,t){let n=e[t];if(n==null)return null;if(typeof n==`number`&&Number.isFinite(n))return n;if(typeof n==`string`&&n.trim()!==``){let e=Number(n);if(Number.isFinite(e))return e}return null}function Qe(e){return{id:O(e,`id`),action:O(e,`action`),entityType:O(e,`entity_type`),entityId:k(e,`entity_id`),details:k(e,`details`),createdAt:O(e,`created_at`)}}var $e=class{db;constructor(e){this.db=e}async log(e,t,n,r){let i=r?JSON.stringify(r,(e,t)=>typeof t==`string`&&t.length>500?t.slice(0,500):t):null;await this.db.execute(`INSERT INTO audit_logs (id, action, entity_type, entity_id, details, created_at) VALUES (?, ?, ?, ?, ?, ?);`,[Oe(),e,t,n,i,T()])}async list(e=60){return(await this.db.query(`SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ?;`,[Math.max(1,Math.min(e,300))])).map(Qe)}},et=`id, name, platform, email, phone, ktp_name, status, created_at, updated_at`;function tt(e){return e===`shopee`||e===`tiktok`||e===`other`?e:`other`}function nt(e){return e===`archived`?`archived`:`active`}function rt(e){return{id:O(e,`id`),name:O(e,`name`),platform:tt(O(e,`platform`)),email:k(e,`email`),phone:k(e,`phone`),ktpName:k(e,`ktp_name`),status:nt(O(e,`status`)),createdAt:O(e,`created_at`),updatedAt:O(e,`updated_at`)}}function it(e){return{...rt(e),passwordEnc:k(e,`password_enc`),bankAccountEnc:k(e,`bank_account_enc`)}}var at=class{db;constructor(e){this.db=e}async list(e={}){let t=[],n=[];if(e.includeArchived||t.push(`status = 'active'`),e.platform&&(t.push(`platform = ?`),n.push(e.platform)),e.search?.trim()){t.push(`(name LIKE ? OR email LIKE ? OR phone LIKE ?)`);let r=`%${e.search.trim()}%`;n.push(r,r,r)}return(await this.db.query(`SELECT ${et} FROM stores ${t.length?`WHERE ${t.join(` AND `)}`:``} ORDER BY status ASC, name COLLATE NOCASE ASC;`,n)).map(rt)}async listAll(){return this.list({includeArchived:!0})}async getPublic(e){let t=await this.db.query(`SELECT ${et} FROM stores WHERE id = ?;`,[e]);return t[0]?rt(t[0]):null}async getRecord(e){let t=await this.db.query(`SELECT * FROM stores WHERE id = ?;`,[e]);return t[0]?it(t[0]):null}async create(e){let t=Oe(),n=T();await this.db.execute(`INSERT INTO stores (id, name, platform, email, phone, password_enc, ktp_name, bank_account_enc, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,[t,e.name,e.platform,e.email,e.phone,e.passwordEnc,e.ktpName,e.bankAccountEnc,e.status,n,n]);let r=await this.getPublic(t);if(!r)throw Error(`Toko gagal disimpan.`);return r}async update(e,t){await this.db.execute(`UPDATE stores
       SET name = ?, platform = ?, email = ?, phone = ?, password_enc = ?, ktp_name = ?,
           bank_account_enc = ?, status = ?, updated_at = ?
       WHERE id = ?;`,[t.name,t.platform,t.email,t.phone,t.passwordEnc,t.ktpName,t.bankAccountEnc,t.status,T(),e]);let n=await this.getPublic(e);if(!n)throw Error(`Toko tidak ditemukan.`);return n}async setStatus(e,t){await this.db.execute(`UPDATE stores SET status = ?, updated_at = ? WHERE id = ?;`,[t,T(),e])}async delete(e){await this.db.execute(`DELETE FROM stores WHERE id = ?;`,[e])}async countTransactions(e){let t=await this.db.query(`SELECT
        (SELECT COUNT(*) FROM orders WHERE store_id = ?) +
        (SELECT COUNT(*) FROM marketplace_fees WHERE store_id = ?) +
        (SELECT COUNT(*) FROM refunds WHERE store_id = ?) +
        (SELECT COUNT(*) FROM settlements WHERE store_id = ?) +
        (SELECT COUNT(*) FROM operational_expenses WHERE store_id = ?) +
        (SELECT COUNT(*) FROM advertising_campaigns WHERE store_id = ?) AS total;`,[e,e,e,e,e,e]);return Number(t[0]?.total??0)}async exists(e){return(await this.db.query(`SELECT 1 AS found FROM stores WHERE id = ?;`,[e])).length>0}};function ot(e){return e===`inactive`?`inactive`:`active`}function st(e){return{id:O(e,`id`),name:O(e,`name`),sku:O(e,`sku`),category:k(e,`category`),variant:k(e,`variant`),price:A(e,`price`),currentCost:A(e,`current_cost`),status:ot(O(e,`status`)),notes:k(e,`notes`),createdAt:O(e,`created_at`),updatedAt:O(e,`updated_at`)}}function ct(e){return{id:O(e,`id`),productId:O(e,`product_id`),cost:A(e,`cost`),effectiveAt:O(e,`effective_at`),note:k(e,`note`),createdAt:O(e,`created_at`)}}function lt(e){return{id:O(e,`id`),productId:O(e,`product_id`),price:A(e,`price`),effectiveAt:O(e,`effective_at`),createdAt:O(e,`created_at`)}}var ut=`
  SELECT p.*,
    COALESCE((
      SELECT pc.cost FROM product_costs pc
      WHERE pc.product_id = p.id
      ORDER BY pc.effective_at DESC, pc.created_at DESC
      LIMIT 1
    ), 0) AS current_cost
  FROM products p
`,dt=class{db;constructor(e){this.db=e}async list(e={}){let t=[],n=[];if(e.status&&e.status!==`all`&&(t.push(`p.status = ?`),n.push(e.status)),e.category&&(t.push(`p.category = ?`),n.push(e.category)),e.search?.trim()){let r=`%${e.search.trim()}%`;t.push(`(p.name LIKE ? OR p.sku LIKE ? OR p.category LIKE ?)`),n.push(r,r,r)}return(await this.db.query(`${ut} ${t.length?`WHERE ${t.join(` AND `)}`:``}
       ORDER BY p.status ASC, p.name COLLATE NOCASE ASC;`,n)).map(st)}async getById(e){let t=await this.db.query(`${ut} WHERE p.id = ?;`,[e]);return t[0]?st(t[0]):null}async getBySku(e){let t=await this.db.query(`${ut} WHERE p.sku = ? COLLATE NOCASE;`,[e]);return t[0]?st(t[0]):null}async getByName(e){let t=await this.db.query(`${ut} WHERE p.name = ? COLLATE NOCASE ORDER BY p.status ASC LIMIT 1;`,[e]);return t[0]?st(t[0]):null}async create(e,t){let n=t??this.db,r=Oe(),i=T();await n.execute(`INSERT INTO products (id, name, sku, category, variant, price, status, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,[r,e.name,e.sku,e.category??null,e.variant??null,e.price,e.status,e.notes??null,i,i]),e.cost!==null&&e.cost!==void 0&&await n.execute(`INSERT INTO product_costs (id, product_id, cost, effective_at, note, created_at) VALUES (?, ?, ?, ?, ?, ?);`,[Oe(),r,e.cost,w(),`HPP awal`,i]),e.price>0&&await n.execute(`INSERT INTO product_prices (id, product_id, price, effective_at, created_at) VALUES (?, ?, ?, ?, ?);`,[Oe(),r,e.price,w(),i]);let a=await n.query(`${ut} WHERE p.id = ?;`,[r]),o=a[0]?st(a[0]):null;if(!o)throw Error(`Produk gagal disimpan.`);return o}async update(e,t,n){await(n??this.db).execute(`UPDATE products SET name = ?, sku = ?, category = ?, variant = ?, price = ?, status = ?, notes = ?, updated_at = ?
       WHERE id = ?;`,[t.name,t.sku,t.category??null,t.variant??null,t.price,t.status,t.notes??null,T(),e])}async delete(e){await this.db.execute(`DELETE FROM products WHERE id = ?;`,[e])}async addCost(e,t,n,r,i){await(i??this.db).execute(`INSERT INTO product_costs (id, product_id, cost, effective_at, note, created_at) VALUES (?, ?, ?, ?, ?, ?);`,[Oe(),e,t,n,r,T()])}async addPrice(e,t,n,r){await(r??this.db).execute(`INSERT INTO product_prices (id, product_id, price, effective_at, created_at) VALUES (?, ?, ?, ?, ?);`,[Oe(),e,t,n,T()])}async listCosts(e){return(await this.db.query(`SELECT * FROM product_costs WHERE product_id = ? ORDER BY effective_at DESC, created_at DESC;`,[e])).map(ct)}async listPrices(e){return(await this.db.query(`SELECT * FROM product_prices WHERE product_id = ? ORDER BY effective_at DESC, created_at DESC;`,[e])).map(lt)}async countOrderItems(e){let t=await this.db.query(`SELECT COUNT(*) AS total FROM order_items WHERE product_id = ?;`,[e]);return Number(t[0]?.total??0)}async listCategories(){return(await this.db.query(`SELECT DISTINCT category FROM products WHERE category IS NOT NULL AND category <> '' ORDER BY category COLLATE NOCASE;`)).map(e=>k(e,`category`)).filter(e=>e!==null)}},ft=[`pending`,`processing`,`shipped`,`delivered`,`completed`];function pt(e){return ft.includes(e)}function mt(e){let t=e.items.reduce((e,t)=>e+t.quantity*t.unitPrice,0),n=e.items.reduce((e,t)=>e+t.quantity*t.hppSnapshot,0),r=e.items.reduce((e,t)=>e+t.quantity,0);if(!pt(e.status))return{grossSales:0,sellerDiscount:0,refunds:0,netSales:0,cogs:0,marketplaceFees:e.marketplaceFees,estimatedProfit:-e.marketplaceFees,unitsSold:0};let i=t-e.sellerDiscount-e.completedRefundTotal;return{grossSales:t,sellerDiscount:e.sellerDiscount,refunds:e.completedRefundTotal,netSales:i,cogs:n,marketplaceFees:e.marketplaceFees,estimatedProfit:i-n-e.marketplaceFees,unitsSold:r}}function ht(e){return[`pending`,`processing`,`shipped`,`delivered`,`completed`,`cancelled`,`returned`,`refunded`].includes(e)?e:`pending`}function gt(e){return{id:O(e,`id`),storeId:O(e,`store_id`),marketplaceOrderId:O(e,`marketplace_order_id`),orderDate:O(e,`order_date`),status:ht(O(e,`status`)),sellerDiscount:A(e,`seller_discount`),marketplaceDiscount:A(e,`marketplace_discount`),shippingPaid:A(e,`shipping_paid`),settlementValue:Ze(e,`settlement_value`),notes:k(e,`notes`),createdAt:O(e,`created_at`),updatedAt:O(e,`updated_at`)}}function _t(e){return{id:O(e,`id`),orderId:O(e,`order_id`),productId:k(e,`product_id`),productName:O(e,`product_name`),sku:O(e,`sku`),quantity:A(e,`quantity`),unitPrice:A(e,`unit_price`),hppSnapshot:A(e,`hpp_snapshot`),createdAt:O(e,`created_at`)}}function j(e){return{id:O(e,`id`),storeId:O(e,`store_id`),orderId:k(e,`order_id`),feeType:O(e,`fee_type`),amount:A(e,`amount`),feeDate:O(e,`fee_date`),source:O(e,`source`),notes:k(e,`notes`),createdAt:O(e,`created_at`),updatedAt:O(e,`updated_at`)}}function vt(e){return{id:O(e,`id`),storeId:O(e,`store_id`),orderId:O(e,`order_id`),settlementId:k(e,`settlement_id`),refundDate:O(e,`refund_date`),amount:A(e,`amount`),quantity:A(e,`quantity`),reason:O(e,`reason`),status:O(e,`status`),notes:k(e,`notes`),createdAt:O(e,`created_at`),updatedAt:O(e,`updated_at`)}}var yt=`
  SELECT o.*, s.name AS store_name,
    COALESCE((SELECT SUM(oi.quantity * oi.unit_price) FROM order_items oi WHERE oi.order_id = o.id), 0) AS gross_sales,
    COALESCE((SELECT COUNT(*) FROM order_items oi WHERE oi.order_id = o.id), 0) AS item_count,
    COALESCE((SELECT SUM(oi.quantity) FROM order_items oi WHERE oi.order_id = o.id), 0) AS unit_count,
    COALESCE((SELECT SUM(f.amount) FROM marketplace_fees f WHERE f.order_id = o.id), 0) AS marketplace_fees,
    COALESCE((SELECT SUM(r.amount) FROM refunds r WHERE r.order_id = o.id AND r.status = 'completed'), 0) AS refund_total
  FROM orders o
  JOIN stores s ON s.id = o.store_id
`;function M(e){let t=gt(e),n=A(e,`gross_sales`),r=A(e,`refund_total`);return{...t,storeName:O(e,`store_name`),grossSales:n,itemCount:A(e,`item_count`),unitCount:A(e,`unit_count`),marketplaceFees:A(e,`marketplace_fees`),refundTotal:r,netSales:pt(t.status)?n-t.sellerDiscount-r:0}}var bt=class{db;constructor(e){this.db=e}async list(e={}){let t=[],n=[];if(e.storeId&&(t.push(`o.store_id = ?`),n.push(e.storeId)),e.status&&e.status!==`all`&&(t.push(`o.status = ?`),n.push(e.status)),e.from&&(t.push(`o.order_date >= ?`),n.push(e.from)),e.to&&(t.push(`o.order_date <= ?`),n.push(e.to)),e.search?.trim()){let r=`%${e.search.trim()}%`;t.push(`(o.marketplace_order_id LIKE ? OR o.notes LIKE ? OR s.name LIKE ?)`),n.push(r,r,r)}let r=Math.max(1,e.page??1),i=Math.max(1,Math.min(e.pageSize??25,100)),a=t.length?`WHERE ${t.join(` AND `)}`:``,o=await this.db.query(`SELECT COUNT(*) AS total FROM orders o JOIN stores s ON s.id = o.store_id ${a};`,n),s=Number(o[0]?.total??0);return{items:(await this.db.query(`${yt} ${a} ORDER BY o.order_date DESC, o.created_at DESC LIMIT ? OFFSET ?;`,[...n,i,(r-1)*i])).map(M),total:s,page:r,pageSize:i}}async listRecent(e=6,t){let n=[],r=``;return t&&(r=`WHERE o.store_id = ?`,n.push(t)),(await this.db.query(`${yt} ${r} ORDER BY o.order_date DESC, o.created_at DESC LIMIT ?;`,[...n,e])).map(M)}async getById(e){let t=await this.db.query(`SELECT * FROM orders WHERE id = ?;`,[e]);return t[0]?gt(t[0]):null}async getDetail(e){let t=await this.db.query(`SELECT o.*, s.name AS store_name FROM orders o JOIN stores s ON s.id = o.store_id WHERE o.id = ?;`,[e]);if(!t[0])return null;let n=gt(t[0]),r=O(t[0],`store_name`),i=await this.db.query(`SELECT * FROM order_items WHERE order_id = ? ORDER BY created_at ASC;`,[e]),a=await this.db.query(`SELECT * FROM marketplace_fees WHERE order_id = ? ORDER BY fee_date ASC, created_at ASC;`,[e]),o=await this.db.query(`SELECT * FROM refunds WHERE order_id = ? ORDER BY refund_date DESC;`,[e]),s=i.map(_t),c=a.map(j),l=o.map(vt),u=l.filter(e=>e.status===`completed`).reduce((e,t)=>e+t.amount,0),d=c.reduce((e,t)=>e+t.amount,0),f=mt({status:n.status,sellerDiscount:n.sellerDiscount,items:s,completedRefundTotal:u,marketplaceFees:d});return{...n,storeName:r,items:s,fees:c,refunds:l,grossSales:f.grossSales,cogs:f.cogs,marketplaceFees:f.marketplaceFees,refundTotal:f.refunds,netSales:f.netSales,estimatedProfit:f.estimatedProfit}}async findByMarketplaceId(e,t){let n=await this.db.query(`SELECT * FROM orders WHERE store_id = ? AND marketplace_order_id = ?;`,[e,t]);return n[0]?gt(n[0]):null}async findExistingMarketplaceIds(e,t){let n=new Set,r=[...new Set(t)];for(let t=0;t<r.length;t+=400){let i=r.slice(t,t+400);if(i.length===0)continue;let a=i.map(()=>`?`).join(`, `),o=await this.db.query(`SELECT marketplace_order_id FROM orders WHERE store_id = ? AND marketplace_order_id IN (${a});`,[e,...i]);for(let e of o)n.add(O(e,`marketplace_order_id`))}return n}async insertOrder(e,t,n){let r=Oe(),i=T();return await n.execute(`INSERT INTO orders (id, store_id, marketplace_order_id, order_date, status, seller_discount,
        marketplace_discount, shipping_paid, settlement_value, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,[r,e.storeId,e.marketplaceOrderId,e.orderDate,e.status,e.sellerDiscount,e.marketplaceDiscount,e.shippingPaid,e.settlementValue,e.notes,i,i]),await this.insertItems(r,t,n),r}async insertItems(e,t,n){let r=T();for(let i of t)await n.execute(`INSERT INTO order_items (id, order_id, product_id, product_name, sku, quantity, unit_price, hpp_snapshot, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,[Oe(),e,i.productId,i.productName,i.sku,i.quantity,i.unitPrice,i.hppSnapshot,r])}async updateOrder(e,t,n,r){await r.execute(`UPDATE orders SET store_id = ?, marketplace_order_id = ?, order_date = ?, status = ?,
        seller_discount = ?, marketplace_discount = ?, shipping_paid = ?, settlement_value = ?,
        notes = ?, updated_at = ?
       WHERE id = ?;`,[t.storeId,t.marketplaceOrderId,t.orderDate,t.status,t.sellerDiscount,t.marketplaceDiscount,t.shippingPaid,t.settlementValue,t.notes,T(),e]),await r.execute(`DELETE FROM order_items WHERE order_id = ?;`,[e]),await this.insertItems(e,n,r)}async updateStatus(e,t){await this.db.execute(`UPDATE orders SET status = ?, updated_at = ? WHERE id = ?;`,[t,T(),e])}async delete(e,t){await(t??this.db).execute(`DELETE FROM orders WHERE id = ?;`,[e])}async countRefunds(e){let t=await this.db.query(`SELECT COUNT(*) AS total FROM refunds WHERE order_id = ?;`,[e]);return Number(t[0]?.total??0)}async countForStore(e){let t=await this.db.query(`SELECT COUNT(*) AS total FROM orders WHERE store_id = ?;`,[e]);return Number(t[0]?.total??0)}async findForFinance(e,t){let n=await this.db.query(`SELECT o.id, o.store_id, o.order_date, o.status, o.seller_discount, o.marketplace_discount,
        oi.quantity, oi.unit_price, oi.hpp_snapshot
       FROM orders o
       LEFT JOIN order_items oi ON oi.order_id = o.id
       WHERE o.order_date >= ? AND o.order_date <= ?
       ORDER BY o.order_date ASC, o.id ASC;`,[e,t]),r=new Map;for(let e of n){let t=O(e,`id`),n=r.get(t);n||(n={id:t,storeId:O(e,`store_id`),orderDate:O(e,`order_date`),status:ht(O(e,`status`)),sellerDiscount:A(e,`seller_discount`),marketplaceDiscount:A(e,`marketplace_discount`),items:[]},r.set(t,n));let i=Ze(e,`quantity`);i!==null&&n.items.push({quantity:i,unitPrice:Ze(e,`unit_price`)??0,hppSnapshot:Ze(e,`hpp_snapshot`)??0})}return[...r.values()]}};function xt(e){return{id:O(e,`id`),storeId:O(e,`store_id`),orderId:k(e,`order_id`),feeType:O(e,`fee_type`),amount:A(e,`amount`),feeDate:O(e,`fee_date`),source:O(e,`source`),notes:k(e,`notes`),createdAt:O(e,`created_at`),updatedAt:O(e,`updated_at`),storeName:O(e,`store_name`),marketplaceOrderId:k(e,`marketplace_order_id`)}}var St=`
  SELECT f.*, s.name AS store_name, o.marketplace_order_id AS marketplace_order_id
  FROM marketplace_fees f
  JOIN stores s ON s.id = f.store_id
  LEFT JOIN orders o ON o.id = f.order_id
`,Ct=class{db;constructor(e){this.db=e}async list(e={}){let t=[],n=[];if(e.storeId&&(t.push(`f.store_id = ?`),n.push(e.storeId)),e.orderId&&(t.push(`f.order_id = ?`),n.push(e.orderId)),e.feeType&&e.feeType!==`all`&&(t.push(`f.fee_type = ?`),n.push(e.feeType)),e.source&&e.source!==`all`&&(t.push(`f.source = ?`),n.push(e.source)),e.from&&(t.push(`f.fee_date >= ?`),n.push(e.from)),e.to&&(t.push(`f.fee_date <= ?`),n.push(e.to)),e.search?.trim()){let r=`%${e.search.trim()}%`;t.push(`(o.marketplace_order_id LIKE ? OR f.notes LIKE ? OR s.name LIKE ?)`),n.push(r,r,r)}let r=Math.max(1,e.page??1),i=Math.max(1,Math.min(e.pageSize??30,100)),a=t.length?`WHERE ${t.join(` AND `)}`:``,o=await this.db.query(`SELECT COUNT(*) AS total FROM marketplace_fees f JOIN stores s ON s.id = f.store_id LEFT JOIN orders o ON o.id = f.order_id ${a};`,n),s=Number(o[0]?.total??0);return{items:(await this.db.query(`${St} ${a} ORDER BY f.fee_date DESC, f.created_at DESC LIMIT ? OFFSET ?;`,[...n,i,(r-1)*i])).map(xt),total:s,page:r,pageSize:i}}async getById(e){let t=await this.db.query(`${St} WHERE f.id = ?;`,[e]);return t[0]?xt(t[0]):null}async listByOrder(e){return(await this.db.query(`${St} WHERE f.order_id = ? ORDER BY f.fee_date ASC;`,[e])).map(xt)}async create(e,t){let n=Oe(),r=T();return await(t??this.db).execute(`INSERT INTO marketplace_fees (id, store_id, order_id, fee_type, amount, fee_date, source, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,[n,e.storeId,e.orderId,e.feeType,e.amount,e.feeDate,e.source,e.notes,r,r]),n}async update(e,t){await this.db.execute(`UPDATE marketplace_fees SET store_id = ?, order_id = ?, fee_type = ?, amount = ?, fee_date = ?, source = ?, notes = ?, updated_at = ?
       WHERE id = ?;`,[t.storeId,t.orderId,t.feeType,t.amount,t.feeDate,t.source,t.notes,T(),e])}async delete(e){await this.db.execute(`DELETE FROM marketplace_fees WHERE id = ?;`,[e])}async findForFinance(e,t){return(await this.db.query(`SELECT store_id, fee_date, amount, source FROM marketplace_fees
       WHERE fee_date >= ? AND fee_date <= ?;`,[e,t])).map(e=>({storeId:O(e,`store_id`),feeDate:O(e,`fee_date`),amount:A(e,`amount`),source:O(e,`source`)}))}async sumByOrder(e){let t=await this.db.query(`SELECT COALESCE(SUM(amount), 0) AS total FROM marketplace_fees WHERE order_id = ?;`,[e]);return Number(t[0]?.total??0)}};function wt(e){return{id:O(e,`id`),storeId:k(e,`store_id`),platform:O(e,`platform`),name:O(e,`name`),notes:k(e,`notes`),createdAt:O(e,`created_at`),updatedAt:O(e,`updated_at`),storeName:k(e,`store_name`),totalSpend:A(e,`total_spend`),totalAttributedRevenue:Ze(e,`total_attributed_revenue`),totalAttributedOrders:Ze(e,`total_attributed_orders`),attributionRows:A(e,`attribution_rows`),expenseCount:A(e,`expense_count`)}}function Tt(e){return{id:O(e,`id`),campaignId:O(e,`campaign_id`),expenseDate:O(e,`expense_date`),amount:A(e,`amount`),impressions:Ze(e,`impressions`),clicks:Ze(e,`clicks`),attributedOrders:Ze(e,`attributed_orders`),attributedRevenue:Ze(e,`attributed_revenue`),notes:k(e,`notes`),createdAt:O(e,`created_at`),campaignName:O(e,`campaign_name`),platform:O(e,`platform`),storeId:k(e,`store_id`),storeName:k(e,`store_name`)}}var Et=`
  SELECT c.*, s.name AS store_name,
    COALESCE((SELECT SUM(ae.amount) FROM advertising_expenses ae WHERE ae.campaign_id = c.id), 0) AS total_spend,
    (SELECT SUM(ae.attributed_revenue) FROM advertising_expenses ae WHERE ae.campaign_id = c.id) AS total_attributed_revenue,
    (SELECT SUM(ae.attributed_orders) FROM advertising_expenses ae WHERE ae.campaign_id = c.id) AS total_attributed_orders,
    (SELECT COUNT(*) FROM advertising_expenses ae WHERE ae.campaign_id = c.id AND (ae.attributed_revenue IS NOT NULL OR ae.attributed_orders IS NOT NULL)) AS attribution_rows,
    (SELECT COUNT(*) FROM advertising_expenses ae WHERE ae.campaign_id = c.id) AS expense_count
  FROM advertising_campaigns c
  LEFT JOIN stores s ON s.id = c.store_id
`,Dt=`
  SELECT ae.*, c.name AS campaign_name, c.platform AS platform, c.store_id AS store_id, s.name AS store_name
  FROM advertising_expenses ae
  JOIN advertising_campaigns c ON c.id = ae.campaign_id
  LEFT JOIN stores s ON s.id = c.store_id
`,Ot=class{db;constructor(e){this.db=e}async listCampaigns(e={}){let t=[],n=[];return e.storeId&&(t.push(`c.store_id = ?`),n.push(e.storeId)),(await this.db.query(`${Et} ${t.length?`WHERE ${t.join(` AND `)}`:``} ORDER BY c.created_at DESC;`,n)).map(wt)}async getCampaign(e){let t=await this.db.query(`${Et} WHERE c.id = ?;`,[e]);return t[0]?wt(t[0]):null}async getCampaignBase(e){let t=await this.db.query(`SELECT * FROM advertising_campaigns WHERE id = ?;`,[e]);if(!t[0])return null;let n=t[0];return{id:O(n,`id`),storeId:k(n,`store_id`),platform:O(n,`platform`),name:O(n,`name`),notes:k(n,`notes`),createdAt:O(n,`created_at`),updatedAt:O(n,`updated_at`)}}async createCampaign(e,t){let n=Oe(),r=T();return await(t??this.db).execute(`INSERT INTO advertising_campaigns (id, store_id, platform, name, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?);`,[n,e.storeId,e.platform,e.name,e.notes,r,r]),n}async updateCampaign(e,t){await this.db.execute(`UPDATE advertising_campaigns SET store_id = ?, platform = ?, name = ?, notes = ?, updated_at = ?
       WHERE id = ?;`,[t.storeId,t.platform,t.name,t.notes,T(),e])}async deleteCampaign(e){await this.db.execute(`DELETE FROM advertising_campaigns WHERE id = ?;`,[e])}async listExpenses(e={}){let t=[],n=[];e.campaignId&&(t.push(`ae.campaign_id = ?`),n.push(e.campaignId)),e.storeId&&(t.push(`c.store_id = ?`),n.push(e.storeId)),e.from&&(t.push(`ae.expense_date >= ?`),n.push(e.from)),e.to&&(t.push(`ae.expense_date <= ?`),n.push(e.to));let r=Math.max(1,e.page??1),i=Math.max(1,Math.min(e.pageSize??40,100)),a=t.length?`WHERE ${t.join(` AND `)}`:``,o=await this.db.query(`SELECT COUNT(*) AS total FROM advertising_expenses ae JOIN advertising_campaigns c ON c.id = ae.campaign_id ${a};`,n),s=Number(o[0]?.total??0);return{items:(await this.db.query(`${Dt} ${a} ORDER BY ae.expense_date DESC, ae.created_at DESC LIMIT ? OFFSET ?;`,[...n,i,(r-1)*i])).map(Tt),total:s,page:r,pageSize:i}}async getExpense(e){let t=await this.db.query(`${Dt} WHERE ae.id = ?;`,[e]);return t[0]?Tt(t[0]):null}async createExpense(e,t){let n=Oe();return await(t??this.db).execute(`INSERT INTO advertising_expenses (id, campaign_id, expense_date, amount, impressions, clicks, attributed_orders, attributed_revenue, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,[n,e.campaignId,e.expenseDate,e.amount,e.impressions,e.clicks,e.attributedOrders,e.attributedRevenue,e.notes,T()]),n}async updateExpense(e,t){await this.db.execute(`UPDATE advertising_expenses SET campaign_id = ?, expense_date = ?, amount = ?, impressions = ?, clicks = ?,
        attributed_orders = ?, attributed_revenue = ?, notes = ?
       WHERE id = ?;`,[t.campaignId,t.expenseDate,t.amount,t.impressions,t.clicks,t.attributedOrders,t.attributedRevenue,t.notes,e])}async deleteExpense(e){await this.db.execute(`DELETE FROM advertising_expenses WHERE id = ?;`,[e])}async findForFinance(e,t){return(await this.db.query(`SELECT c.store_id AS store_id, ae.expense_date AS expense_date, ae.amount AS amount
       FROM advertising_expenses ae
       JOIN advertising_campaigns c ON c.id = ae.campaign_id
       WHERE ae.expense_date >= ? AND ae.expense_date <= ?;`,[e,t])).map(e=>({storeId:k(e,`store_id`),expenseDate:O(e,`expense_date`),amount:A(e,`amount`)}))}};function kt(e){return{id:O(e,`id`),storeId:k(e,`store_id`),expenseDate:O(e,`expense_date`),category:O(e,`category`),amount:A(e,`amount`),description:O(e,`description`),receiptNote:k(e,`receipt_note`),createdAt:O(e,`created_at`),updatedAt:O(e,`updated_at`),storeName:k(e,`store_name`)}}var At=`
  SELECT oe.*, s.name AS store_name
  FROM operational_expenses oe
  LEFT JOIN stores s ON s.id = oe.store_id
`,jt=class{db;constructor(e){this.db=e}async list(e={}){let t=[],n=[];if(e.storeId&&(t.push(`oe.store_id = ?`),n.push(e.storeId)),e.category&&e.category!==`all`&&(t.push(`oe.category = ?`),n.push(e.category)),e.from&&(t.push(`oe.expense_date >= ?`),n.push(e.from)),e.to&&(t.push(`oe.expense_date <= ?`),n.push(e.to)),e.search?.trim()){let r=`%${e.search.trim()}%`;t.push(`(oe.description LIKE ? OR oe.receipt_note LIKE ? OR s.name LIKE ?)`),n.push(r,r,r)}let r=Math.max(1,e.page??1),i=Math.max(1,Math.min(e.pageSize??30,100)),a=t.length?`WHERE ${t.join(` AND `)}`:``,o=await this.db.query(`SELECT COUNT(*) AS total FROM operational_expenses oe LEFT JOIN stores s ON s.id = oe.store_id ${a};`,n),s=Number(o[0]?.total??0);return{items:(await this.db.query(`${At} ${a} ORDER BY oe.expense_date DESC, oe.created_at DESC LIMIT ? OFFSET ?;`,[...n,i,(r-1)*i])).map(kt),total:s,page:r,pageSize:i}}async getById(e){let t=await this.db.query(`${At} WHERE oe.id = ?;`,[e]);return t[0]?kt(t[0]):null}async create(e,t){let n=Oe(),r=T();return await(t??this.db).execute(`INSERT INTO operational_expenses (id, store_id, expense_date, category, amount, description, receipt_note, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,[n,e.storeId,e.expenseDate,e.category,e.amount,e.description,e.receiptNote,r,r]),n}async update(e,t){await this.db.execute(`UPDATE operational_expenses SET store_id = ?, expense_date = ?, category = ?, amount = ?, description = ?, receipt_note = ?, updated_at = ?
       WHERE id = ?;`,[t.storeId,t.expenseDate,t.category,t.amount,t.description,t.receiptNote,T(),e])}async delete(e){await this.db.execute(`DELETE FROM operational_expenses WHERE id = ?;`,[e])}async findForFinance(e,t){return(await this.db.query(`SELECT store_id, expense_date, amount FROM operational_expenses
       WHERE expense_date >= ? AND expense_date <= ?;`,[e,t])).map(e=>({storeId:k(e,`store_id`),expenseDate:O(e,`expense_date`),amount:A(e,`amount`)}))}async listByStore(e,t=10){return(await this.db.query(`${At} WHERE oe.store_id = ? ORDER BY oe.expense_date DESC LIMIT ?;`,[e,t])).map(kt)}};function Mt(e){return e}function Nt(e){return{id:O(e,`id`),storeId:O(e,`store_id`),orderId:O(e,`order_id`),settlementId:k(e,`settlement_id`),refundDate:O(e,`refund_date`),amount:A(e,`amount`),quantity:A(e,`quantity`),reason:O(e,`reason`),status:O(e,`status`),notes:k(e,`notes`),createdAt:O(e,`created_at`),updatedAt:O(e,`updated_at`),storeName:O(e,`store_name`),marketplaceOrderId:O(e,`marketplace_order_id`),orderStatus:Mt(O(e,`order_status`))}}var Pt=`
  SELECT r.*, s.name AS store_name, o.marketplace_order_id AS marketplace_order_id, o.status AS order_status
  FROM refunds r
  JOIN stores s ON s.id = r.store_id
  JOIN orders o ON o.id = r.order_id
`,Ft=class{db;constructor(e){this.db=e}async list(e={}){let t=[],n=[];if(e.storeId&&(t.push(`r.store_id = ?`),n.push(e.storeId)),e.status&&e.status!==`all`&&(t.push(`r.status = ?`),n.push(e.status)),e.from&&(t.push(`r.refund_date >= ?`),n.push(e.from)),e.to&&(t.push(`r.refund_date <= ?`),n.push(e.to)),e.search?.trim()){let r=`%${e.search.trim()}%`;t.push(`(o.marketplace_order_id LIKE ? OR r.reason LIKE ? OR s.name LIKE ?)`),n.push(r,r,r)}let r=Math.max(1,e.page??1),i=Math.max(1,Math.min(e.pageSize??30,100)),a=t.length?`WHERE ${t.join(` AND `)}`:``,o=await this.db.query(`SELECT COUNT(*) AS total FROM refunds r JOIN stores s ON s.id = r.store_id JOIN orders o ON o.id = r.order_id ${a};`,n),s=Number(o[0]?.total??0);return{items:(await this.db.query(`${Pt} ${a} ORDER BY r.refund_date DESC, r.created_at DESC LIMIT ? OFFSET ?;`,[...n,i,(r-1)*i])).map(Nt),total:s,page:r,pageSize:i}}async getById(e){let t=await this.db.query(`${Pt} WHERE r.id = ?;`,[e]);return t[0]?Nt(t[0]):null}async listByOrder(e){return(await this.db.query(`${Pt} WHERE r.order_id = ? ORDER BY r.refund_date DESC;`,[e])).map(Nt)}async create(e,t){let n=Oe(),r=T();return await(t??this.db).execute(`INSERT INTO refunds (id, store_id, order_id, settlement_id, refund_date, amount, quantity, reason, status, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,[n,e.storeId,e.orderId,e.settlementId,e.refundDate,e.amount,e.quantity,e.reason,e.status,e.notes,r,r]),n}async update(e,t){await this.db.execute(`UPDATE refunds SET store_id = ?, order_id = ?, settlement_id = ?, refund_date = ?, amount = ?, quantity = ?,
        reason = ?, status = ?, notes = ?, updated_at = ?
       WHERE id = ?;`,[t.storeId,t.orderId,t.settlementId,t.refundDate,t.amount,t.quantity,t.reason,t.status,t.notes,T(),e])}async delete(e){await this.db.execute(`DELETE FROM refunds WHERE id = ?;`,[e])}async countBySettlement(e){let t=await this.db.query(`SELECT COUNT(*) AS total FROM refunds WHERE settlement_id = ?;`,[e]);return Number(t[0]?.total??0)}async findForFinance(e,t){return(await this.db.query(`SELECT r.store_id, r.order_id, r.refund_date, r.amount, r.status, o.status AS order_status
       FROM refunds r
       JOIN orders o ON o.id = r.order_id
       WHERE r.refund_date >= ? AND r.refund_date <= ?;`,[e,t])).map(e=>({storeId:O(e,`store_id`),orderId:O(e,`order_id`),refundDate:O(e,`refund_date`),amount:A(e,`amount`),status:O(e,`status`),orderStatus:Mt(O(e,`order_status`))}))}};function It(e){return{id:O(e,`id`),storeId:O(e,`store_id`),settlementNo:O(e,`settlement_no`),settlementDate:O(e,`settlement_date`),grossSales:A(e,`gross_sales`),totalDeductions:A(e,`total_deductions`),totalPayout:A(e,`total_payout`),status:O(e,`status`),notes:k(e,`notes`),createdAt:O(e,`created_at`),updatedAt:O(e,`updated_at`),storeName:O(e,`store_name`)}}var Lt=`
  SELECT st.*, s.name AS store_name
  FROM settlements st
  JOIN stores s ON s.id = st.store_id
`,Rt=class{db;constructor(e){this.db=e}async list(e={}){let t=[],n=[];if(e.storeId&&(t.push(`st.store_id = ?`),n.push(e.storeId)),e.status&&e.status!==`all`&&(t.push(`st.status = ?`),n.push(e.status)),e.from&&(t.push(`st.settlement_date >= ?`),n.push(e.from)),e.to&&(t.push(`st.settlement_date <= ?`),n.push(e.to)),e.search?.trim()){let r=`%${e.search.trim()}%`;t.push(`(st.settlement_no LIKE ? OR st.notes LIKE ? OR s.name LIKE ?)`),n.push(r,r,r)}let r=Math.max(1,e.page??1),i=Math.max(1,Math.min(e.pageSize??30,100)),a=t.length?`WHERE ${t.join(` AND `)}`:``,o=await this.db.query(`SELECT COUNT(*) AS total FROM settlements st JOIN stores s ON s.id = st.store_id ${a};`,n),s=Number(o[0]?.total??0);return{items:(await this.db.query(`${Lt} ${a} ORDER BY st.settlement_date DESC, st.created_at DESC LIMIT ? OFFSET ?;`,[...n,i,(r-1)*i])).map(It),total:s,page:r,pageSize:i}}async getById(e){let t=await this.db.query(`${Lt} WHERE st.id = ?;`,[e]);return t[0]?It(t[0]):null}async findByNumber(e,t){let n=await this.db.query(`SELECT * FROM settlements WHERE store_id = ? AND settlement_no = ?;`,[e,t]);if(!n[0])return null;let r=n[0];return{id:O(r,`id`),storeId:O(r,`store_id`),settlementNo:O(r,`settlement_no`),settlementDate:O(r,`settlement_date`),grossSales:A(r,`gross_sales`),totalDeductions:A(r,`total_deductions`),totalPayout:A(r,`total_payout`),status:O(r,`status`),notes:k(r,`notes`),createdAt:O(r,`created_at`),updatedAt:O(r,`updated_at`)}}async listForSelect(e){let t=[],n=``;return e&&(n=`WHERE store_id = ?`,t.push(e)),(await this.db.query(`SELECT * FROM settlements ${n} ORDER BY settlement_date DESC LIMIT 200;`,t)).map(e=>{let t=It({...e,store_name:``});return{id:t.id,storeId:t.storeId,settlementNo:t.settlementNo,settlementDate:t.settlementDate,grossSales:t.grossSales,totalDeductions:t.totalDeductions,totalPayout:t.totalPayout,status:t.status,notes:t.notes,createdAt:t.createdAt,updatedAt:t.updatedAt}})}async create(e,t){let n=Oe(),r=T();return await(t??this.db).execute(`INSERT INTO settlements (id, store_id, settlement_no, settlement_date, gross_sales, total_deductions, total_payout, status, notes, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,[n,e.storeId,e.settlementNo,e.settlementDate,e.grossSales,e.totalDeductions,e.totalPayout,e.status,e.notes,r,r]),n}async update(e,t){await this.db.execute(`UPDATE settlements SET store_id = ?, settlement_no = ?, settlement_date = ?, gross_sales = ?, total_deductions = ?,
        total_payout = ?, status = ?, notes = ?, updated_at = ?
       WHERE id = ?;`,[t.storeId,t.settlementNo,t.settlementDate,t.grossSales,t.totalDeductions,t.totalPayout,t.status,t.notes,T(),e])}async delete(e){await this.db.execute(`DELETE FROM settlements WHERE id = ?;`,[e])}async sumReceived(e,t,n){let r=[e,t],i=``;n&&(i=` AND store_id = ?`,r.push(n));let a=await this.db.query(`SELECT COALESCE(SUM(total_payout), 0) AS total FROM settlements
       WHERE status = 'received' AND settlement_date >= ? AND settlement_date <= ?${i};`,r);return Number(a[0]?.total??0)}};function zt(e){return{id:O(e,`id`),importType:O(e,`import_type`),fileName:O(e,`file_name`),totalRows:A(e,`total_rows`),successRows:A(e,`success_rows`),failedRows:A(e,`failed_rows`),skippedRows:A(e,`skipped_rows`),notes:k(e,`notes`),createdAt:O(e,`created_at`)}}function Bt(e){return{id:O(e,`id`),batchId:O(e,`batch_id`),rowNumber:A(e,`row_number`),message:O(e,`message`),rawData:k(e,`raw_data`),createdAt:O(e,`created_at`)}}var Vt=class{db;constructor(e){this.db=e}async createBatch(e,t){let n=Oe();return await(t??this.db).execute(`INSERT INTO import_batches (id, import_type, file_name, total_rows, success_rows, failed_rows, skipped_rows, notes, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,[n,e.importType,e.fileName,e.totalRows,e.successRows,e.failedRows,e.skippedRows,e.notes,T()]),n}async addErrors(e,t,n){let r=n??this.db,i=T();for(let n of t)await r.execute(`INSERT INTO import_errors (id, batch_id, row_number, message, raw_data, created_at) VALUES (?, ?, ?, ?, ?, ?);`,[Oe(),e,n.rowNumber,n.message,n.rawData,i])}async listBatches(e=30){return(await this.db.query(`SELECT * FROM import_batches ORDER BY created_at DESC LIMIT ?;`,[e])).map(zt)}async getBatch(e){let t=await this.db.query(`SELECT * FROM import_batches WHERE id = ?;`,[e]);return t[0]?zt(t[0]):null}async listErrors(e,t=300){return(await this.db.query(`SELECT * FROM import_errors WHERE batch_id = ? ORDER BY row_number ASC LIMIT ?;`,[e,t])).map(Bt)}},Ht=class{db;constructor(e){this.db=e}async get(e){let t=await this.db.query(`SELECT value FROM app_settings WHERE key = ?;`,[e]);return t[0]?O(t[0],`value`):null}async set(e,t){await this.db.execute(`INSERT INTO app_settings (key, value, updated_at) VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at;`,[e,t,T()])}async delete(e){await this.db.execute(`DELETE FROM app_settings WHERE key = ?;`,[e])}async all(){let e=await this.db.query(`SELECT key, value FROM app_settings ORDER BY key;`),t={};for(let n of e)t[O(n,`key`)]=O(n,`value`);return t}},Ut=[{name:`app_settings`,columns:[`key`,`value`,`updated_at`]},{name:`stores`,columns:[`id`,`name`,`platform`,`email`,`phone`,`password_enc`,`ktp_name`,`bank_account_enc`,`status`,`created_at`,`updated_at`]},{name:`products`,columns:[`id`,`name`,`sku`,`category`,`variant`,`price`,`status`,`notes`,`created_at`,`updated_at`]},{name:`product_costs`,columns:[`id`,`product_id`,`cost`,`effective_at`,`note`,`created_at`]},{name:`product_prices`,columns:[`id`,`product_id`,`price`,`effective_at`,`created_at`]},{name:`orders`,columns:[`id`,`store_id`,`marketplace_order_id`,`order_date`,`status`,`seller_discount`,`marketplace_discount`,`shipping_paid`,`settlement_value`,`notes`,`created_at`,`updated_at`]},{name:`order_items`,columns:[`id`,`order_id`,`product_id`,`product_name`,`sku`,`quantity`,`unit_price`,`hpp_snapshot`,`created_at`]},{name:`marketplace_fees`,columns:[`id`,`store_id`,`order_id`,`fee_type`,`amount`,`fee_date`,`source`,`notes`,`created_at`,`updated_at`]},{name:`advertising_campaigns`,columns:[`id`,`store_id`,`platform`,`name`,`notes`,`created_at`,`updated_at`]},{name:`advertising_expenses`,columns:[`id`,`campaign_id`,`expense_date`,`amount`,`impressions`,`clicks`,`attributed_orders`,`attributed_revenue`,`notes`,`created_at`]},{name:`operational_expenses`,columns:[`id`,`store_id`,`expense_date`,`category`,`amount`,`description`,`receipt_note`,`created_at`,`updated_at`]},{name:`settlements`,columns:[`id`,`store_id`,`settlement_no`,`settlement_date`,`gross_sales`,`total_deductions`,`total_payout`,`status`,`notes`,`created_at`,`updated_at`]},{name:`refunds`,columns:[`id`,`store_id`,`order_id`,`settlement_id`,`refund_date`,`amount`,`quantity`,`reason`,`status`,`notes`,`created_at`,`updated_at`]},{name:`import_batches`,columns:[`id`,`import_type`,`file_name`,`total_rows`,`success_rows`,`failed_rows`,`skipped_rows`,`notes`,`created_at`]},{name:`import_errors`,columns:[`id`,`batch_id`,`row_number`,`message`,`raw_data`,`created_at`]},{name:`audit_logs`,columns:[`id`,`action`,`entity_type`,`entity_id`,`details`,`created_at`]}],Wt=class{db;constructor(e){this.db=e}async readAll(){let e={};for(let t of Ut){let n=await this.db.query(`SELECT * FROM "${t.name}";`);e[t.name]=n.map(e=>{let n={};for(let r of t.columns)n[r]=e[r]??null;return n})}return e}async restoreAll(e){let t=[...Ut].reverse();await this.db.transaction(async n=>{for(let e of t)await n.execute(`DELETE FROM "${e.name}";`);for(let t of Ut){let r=e[t.name];if(r&&r.length!==0)for(let e of r){let r=t.columns.filter(t=>Object.prototype.hasOwnProperty.call(e,t));if(r.length!==t.columns.length)throw Error(`Data backup untuk tabel ${t.name} tidak lengkap.`);let i=r.map(()=>`?`).join(`, `),a=r.map(n=>{let r=e[n];if(r===null||typeof r==`string`||typeof r==`number`)return r;throw Error(`Nilai kolom ${t.name}.${n} pada backup tidak valid.`)});await n.execute(`INSERT INTO "${t.name}" (${r.map(e=>`"${e}"`).join(`, `)}) VALUES (${i});`,a)}}})}async getDataCounts(){let e=(await this.db.query(`SELECT
        (SELECT COUNT(*) FROM stores) AS stores,
        (SELECT COUNT(*) FROM products) AS products,
        (SELECT COUNT(*) FROM orders) AS orders,
        (SELECT COUNT(*) FROM marketplace_fees) AS fees,
        (SELECT COUNT(*) FROM refunds) AS refunds,
        (SELECT COUNT(*) FROM settlements) AS settlements,
        (SELECT COUNT(*) FROM advertising_campaigns) AS campaigns,
        (SELECT COUNT(*) FROM advertising_expenses) AS ad_expenses,
        (SELECT COUNT(*) FROM operational_expenses) AS operational_expenses;`))[0];return{stores:Number(e?.stores??0),products:Number(e?.products??0),orders:Number(e?.orders??0),fees:Number(e?.fees??0),refunds:Number(e?.refunds??0),settlements:Number(e?.settlements??0),campaigns:Number(e?.campaigns??0),expenses:Number(e?.ad_expenses??0),operationalExpenses:Number(e?.operational_expenses??0)}}},N=class extends Error{fieldErrors;constructor(e,t={}){super(e),this.name=`ValidationError`,this.fieldErrors=t}},Gt=class extends Error{constructor(e=`Data tidak ditemukan.`){super(e),this.name=`NotFoundError`}},Kt=class extends Error{constructor(e){super(e),this.name=`ConflictError`}};function qt(e,t,n){let r=(e??``).trim();if(r===``)throw new N(`${t} wajib diisi.`,{[n]:`${t} wajib diisi.`});return r}function P(e,t=2e3){let n=(e??``).trim();return n===``?null:n.slice(0,t)}function Jt(e,t,n,r={}){let{min:i=0,required:a=!0}=r;if(e==null){if(!a)return 0;throw new N(`${t} wajib diisi.`,{[n]:`${t} wajib diisi.`})}if(!Number.isSafeInteger(e)||e<i)throw new N(`${t} tidak valid.`,{[n]:`${t} harus berupa angka bulat minimal ${i}.`});return e}function Yt(e,t,n){if(e==null||!Number.isSafeInteger(e)||e<=0)throw new N(`${t} tidak valid.`,{[n]:`${t} harus berupa bilangan bulat lebih dari 0.`});return e}function Xt(e,t,n){if(e==null)return null;if(!Number.isSafeInteger(e)||e<0)throw new N(`${t} tidak valid.`,{[n]:`${t} harus berupa angka bulat minimal 0.`});return e}function Zt(e){return e instanceof Error&&/UNIQUE constraint failed/i.test(e.message)}function Qt(e,t=`Terjadi kesalahan.`){if(e instanceof N||e instanceof Kt||e instanceof Gt)return e.message;if(e instanceof Error){if(/UNIQUE constraint failed/i.test(e.message))return`Data dengan nilai unik tersebut sudah ada.`;if(/FOREIGN KEY constraint failed/i.test(e.message))return`Data ini masih terkait dengan data lain.`;if(/CHECK constraint failed/i.test(e.message))return`Data tidak memenuhi aturan yang disyaratkan.`}return t}var $t=[`shopee`,`tiktok`,`other`],en=[`pending`,`processing`,`shipped`,`delivered`,`completed`,`cancelled`,`returned`,`refunded`],tn=[`admin`,`service`,`transaction`,`commission`,`promotion`,`other`],nn=[`actual`,`estimated`],rn=[`shopee`,`tiktok`,`meta`,`google`,`other`],an=[`salary`,`electricity`,`internet`,`rent`,`machine_maintenance`,`supplies`,`transportation`,`other`],on=[`pending`,`completed`,`rejected`],sn=[`pending`,`received`],cn=/^[^\s@]+@[^\s@]+\.[^\s@]+$/;function ln(e){if(!$t.includes(e))throw new N(`Platform toko tidak valid.`,{platform:`Pilih platform toko.`});return e}function un(e){return e===`archived`?`archived`:`active`}function dn(e){let t=P(e,254);if(t===null)return null;if(!cn.test(t))throw new N(`Format email tidak valid.`,{email:`Masukkan email yang valid, misalnya nama@toko.com.`});return t}function fn(e){let t=P(e,40);if(t===null)return null;if(!/^[0-9+()\-\s]+$/.test(t))throw new N(`Nomor HP tidak valid.`,{phone:`Nomor HP hanya boleh berisi angka, spasi, +, -, atau tanda kurung.`});return t}var pn=class{stores;audit;encryption;constructor(e,t,n){this.stores=e,this.audit=t,this.encryption=n}list(e={}){return this.stores.list(e)}listAll(){return this.stores.listAll()}async get(e){let t=await this.stores.getPublic(e);if(!t)throw new Gt(`Toko tidak ditemukan.`);return t}async create(e){let t=qt(e.name,`Nama toko`,`name`);if(t.length>120)throw new N(`Nama toko terlalu panjang.`,{name:`Nama toko maksimal 120 karakter.`});let n=ln(e.platform),r=dn(e.email),i=fn(e.phone),a=P(e.ktpName,150),o=await this.encryption.encrypt(e.password??null),s=await this.encryption.encrypt(e.bankAccount??null),c=un(e.status),l=await this.stores.create({name:t,platform:n,email:r,phone:i,ktpName:a,passwordEnc:o,bankAccountEnc:s,status:c});return await this.audit.log(`create`,`store`,l.id,{name:t,platform:n}),l}async update(e,t){let n=await this.stores.getRecord(e);if(!n)throw new Gt(`Toko tidak ditemukan.`);let r=qt(t.name,`Nama toko`,`name`);if(r.length>120)throw new N(`Nama toko terlalu panjang.`,{name:`Nama toko maksimal 120 karakter.`});let i=ln(t.platform),a=dn(t.email),o=fn(t.phone),s=P(t.ktpName,150),c=un(t.status),l=n.passwordEnc;t.password!==void 0&&(l=await this.encryption.encrypt(t.password));let u=n.bankAccountEnc;t.bankAccount!==void 0&&(u=await this.encryption.encrypt(t.bankAccount));let d=await this.stores.update(e,{name:r,platform:i,email:a,phone:o,ktpName:s,passwordEnc:l,bankAccountEnc:u,status:c});return await this.audit.log(`update`,`store`,e,{name:r,platform:i,status:c}),d}async getSensitiveData(e){let t=await this.stores.getRecord(e);if(!t)throw new Gt(`Toko tidak ditemukan.`);try{let n=await this.encryption.decrypt(t.passwordEnc),r=await this.encryption.decrypt(t.bankAccountEnc);return await this.audit.log(`reveal_sensitive`,`store`,e,{fields:`password,bank_account`}),{password:n,bankAccount:r}}catch{throw Error(`Data sensitif tidak dapat dibuka. Kunci enkripsi perangkat mungkin berbeda dengan saat data disimpan.`)}}async archive(e){await this.get(e),await this.stores.setStatus(e,`archived`),await this.audit.log(`archive`,`store`,e)}async restore(e){await this.get(e),await this.stores.setStatus(e,`active`),await this.audit.log(`restore`,`store`,e)}async delete(e){if(await this.get(e),await this.stores.countTransactions(e)>0)throw new Kt(`Toko ini memiliki transaksi terkait dan tidak dapat dihapus. Arsipkan toko untuk menyembunyikannya tanpa menghilangkan data.`);await this.stores.delete(e),await this.audit.log(`delete`,`store`,e)}},mn=[`active`,`inactive`];function hn(e){if(!mn.includes(e))throw new N(`Status produk tidak valid.`,{status:`Pilih status produk.`});return e}var gn=class{db;products;audit;constructor(e,t,n){this.db=e,this.products=t,this.audit=n}list(e={}){return this.products.list(e)}listCategories(){return this.products.listCategories()}async get(e){let t=await this.products.getById(e);if(!t)throw new Gt(`Produk tidak ditemukan.`);return t}async listCosts(e){return await this.get(e),this.products.listCosts(e)}async listPrices(e){return await this.get(e),this.products.listPrices(e)}async create(e){let t=qt(e.name,`Nama produk`,`name`);if(t.length>150)throw new N(`Nama produk terlalu panjang.`,{name:`Nama produk maksimal 150 karakter.`});let n=qt(e.sku,`SKU`,`sku`);if(n.length>80)throw new N(`SKU terlalu panjang.`,{sku:`SKU maksimal 80 karakter.`});let r=Jt(e.price,`Harga jual`,`price`),i=e.cost===null||e.cost===void 0?null:Jt(e.cost,`HPP`,`cost`),a=hn(e.status),o=P(e.category,100),s=P(e.variant,100),c=P(e.notes,1e3);if(await this.products.getBySku(n))throw new Kt(`SKU "${n}" sudah digunakan oleh produk lain.`);try{let e=await this.db.transaction(e=>this.products.create({name:t,sku:n,category:o,variant:s,price:r,cost:i,status:a,notes:c},e));return await this.audit.log(`create`,`product`,e.id,{name:t,sku:n}),e}catch(e){throw Zt(e)?new Kt(`SKU "${n}" sudah digunakan oleh produk lain.`):e}}async update(e,t){let n=await this.get(e),r=qt(t.name,`Nama produk`,`name`);if(r.length>150)throw new N(`Nama produk terlalu panjang.`,{name:`Nama produk maksimal 150 karakter.`});let i=qt(t.sku,`SKU`,`sku`);if(i.length>80)throw new N(`SKU terlalu panjang.`,{sku:`SKU maksimal 80 karakter.`});let a=Jt(t.price,`Harga jual`,`price`),o=t.cost===null||t.cost===void 0?null:Jt(t.cost,`HPP`,`cost`),s=hn(t.status),c=P(t.category,100),l=P(t.variant,100),u=P(t.notes,1e3),d=await this.products.getBySku(i);if(d&&d.id!==e)throw new Kt(`SKU "${i}" sudah digunakan oleh produk lain.`);try{return await this.db.transaction(async t=>{await this.products.update(e,{name:r,sku:i,category:c,variant:l,price:a,cost:o,status:s,notes:u},t),o!==null&&o!==n.currentCost&&await this.products.addCost(e,o,w(),`Perubahan HPP`,t),a!==n.price&&await this.products.addPrice(e,a,w(),t)}),await this.audit.log(`update`,`product`,e,{name:r,sku:i,price:a,cost:o,status:s}),this.get(e)}catch(e){throw Zt(e)?new Kt(`SKU "${i}" sudah digunakan oleh produk lain.`):e}}async delete(e){if(await this.get(e),await this.products.countOrderItems(e)>0)throw new Kt(`Produk sudah digunakan pada pesanan sehingga tidak dapat dihapus. Nonaktifkan produk agar tetap tersedia untuk riwayat.`);await this.products.delete(e),await this.audit.log(`delete`,`product`,e)}};function _n(e){if(!en.includes(e))throw new N(`Status pesanan tidak valid.`,{status:`Pilih status pesanan yang valid.`});return e}var vn=class{db;orders;products;stores;audit;constructor(e,t,n,r,i){this.db=e,this.orders=t,this.products=n,this.stores=r,this.audit=i}list(e={}){return this.orders.list(e)}listRecent(e=6,t){return this.orders.listRecent(e,t)}async get(e){let t=await this.orders.getById(e);if(!t)throw new Gt(`Pesanan tidak ditemukan.`);return t}async getDetail(e){let t=await this.orders.getDetail(e);if(!t)throw new Gt(`Pesanan tidak ditemukan.`);return t}async buildWriteData(e,t){let n=qt(e.storeId,`Toko`,`storeId`);if(!await this.stores.getPublic(n))throw new N(`Toko tidak ditemukan.`,{storeId:`Pilih toko yang valid.`});let r=qt(e.marketplaceOrderId,`Nomor pesanan marketplace`,`marketplaceOrderId`);if(r.length>120)throw new N(`Nomor pesanan terlalu panjang.`,{marketplaceOrderId:`Nomor pesanan maksimal 120 karakter.`});if(!ze(e.orderDate))throw new N(`Tanggal pesanan tidak valid.`,{orderDate:`Pilih tanggal pesanan yang valid.`});let i=_n(e.status),a=Jt(e.sellerDiscount,`Diskon penjual`,`sellerDiscount`),o=Jt(e.marketplaceDiscount,`Diskon marketplace`,`marketplaceDiscount`),s=Jt(e.shippingPaid,`Ongkir dibayar pembeli`,`shippingPaid`),c=Xt(e.settlementValue,`Nilai pencairan`,`settlementValue`),l=P(e.notes,1e3);if(!Array.isArray(e.items)||e.items.length===0)throw new N(`Pesanan harus memiliki minimal satu produk.`,{items:`Tambahkan minimal satu produk.`});if(e.items.length>100)throw new N(`Terlalu banyak item dalam satu pesanan.`,{items:`Maksimal 100 item per pesanan.`});let u=new Map((t?.items??[]).map(e=>[e.id,e])),d=[];for(let t=0;t<e.items.length;t+=1){let n=e.items[t];if(!n)continue;let r=null,i,a,o;if(n.productId){let e=await this.products.getById(n.productId);if(!e)throw new N(`Produk pada item pesanan tidak ditemukan.`,{items:`Produk pada baris ${t+1} tidak ditemukan.`});r=e.id,i=e.name,a=e.sku;let s=n.id&&u.get(n.id)?.productId===e.id?u.get(n.id):null;o=s?s.hppSnapshot:e.currentCost}else{i=qt(n.productName,`Nama produk baris ${t+1}`,`items`),a=qt(n.sku,`SKU baris ${t+1}`,`items`);let e=n.id&&u.get(n.id)?.productId===null?u.get(n.id):null;o=e?e.hppSnapshot:n.hppSnapshot!==void 0&&n.hppSnapshot!==null?Jt(n.hppSnapshot,`HPP baris ${t+1}`,`items`):0}d.push({productId:r,productName:i,sku:a,quantity:Yt(n.quantity,`Kuantitas baris ${t+1}`,`items`),unitPrice:Jt(n.unitPrice,`Harga satuan baris ${t+1}`,`items`),hppSnapshot:o})}return{data:{storeId:n,marketplaceOrderId:r,orderDate:e.orderDate,status:i,sellerDiscount:a,marketplaceDiscount:o,shippingPaid:s,settlementValue:c,notes:l},items:d}}async assertUniqueOrder(e,t,n){let r=await this.orders.findByMarketplaceId(e,t);if(r&&r.id!==n)throw new Kt(`Nomor pesanan "${t}" sudah ada pada toko ini. Import ulang tidak menggandakan pesanan.`)}async create(e){let{data:t,items:n}=await this.buildWriteData(e,null);await this.assertUniqueOrder(t.storeId,t.marketplaceOrderId);try{let e=await this.db.transaction(e=>this.orders.insertOrder(t,n,e));return await this.audit.log(`create`,`order`,e,{storeId:t.storeId,marketplaceOrderId:t.marketplaceOrderId,status:t.status}),this.getDetail(e)}catch(e){throw Zt(e)?new Kt(`Nomor pesanan "${t.marketplaceOrderId}" sudah ada pada toko ini.`):e}}async update(e,t){let n=await this.getDetail(e),{data:r,items:i}=await this.buildWriteData(t,n);await this.assertUniqueOrder(r.storeId,r.marketplaceOrderId,e);try{return await this.db.transaction(t=>this.orders.updateOrder(e,r,i,t)),await this.audit.log(`update`,`order`,e,{storeId:r.storeId,marketplaceOrderId:r.marketplaceOrderId,status:r.status}),this.getDetail(e)}catch(e){throw Zt(e)?new Kt(`Nomor pesanan "${r.marketplaceOrderId}" sudah ada pada toko ini.`):e}}async updateStatus(e,t){await this.get(e);let n=_n(t);await this.orders.updateStatus(e,n),await this.audit.log(`update_status`,`order`,e,{status:n})}async delete(e){if(await this.get(e),await this.orders.countRefunds(e)>0)throw new Kt(`Pesanan memiliki data refund dan tidak dapat dihapus. Hapus refund terlebih dahulu jika memang diperlukan.`);await this.db.transaction(t=>this.orders.delete(e,t)),await this.audit.log(`delete`,`order`,e)}};function yn(e){if(!tn.includes(e))throw new N(`Jenis biaya tidak valid.`,{feeType:`Pilih jenis biaya.`});return e}function bn(e){if(!nn.includes(e))throw new N(`Sumber biaya tidak valid.`,{source:`Pilih sumber biaya aktual atau estimasi.`});return e}var xn=class{fees;stores;orders;audit;constructor(e,t,n,r){this.fees=e,this.stores=t,this.orders=n,this.audit=r}list(e){return this.fees.list(e)}async get(e){let t=await this.fees.getById(e);if(!t)throw new Gt(`Biaya marketplace tidak ditemukan.`);return t}async normalize(e){let t=P(e.orderId,100),n=qt(e.storeId,`Toko`,`storeId`);if(t){let e=await this.orders.getById(t);if(!e)throw new N(`Pesanan tidak ditemukan.`,{orderId:`Pesanan yang dipilih tidak ditemukan.`});if(e.storeId!==n)throw new N(`Pesanan berasal dari toko yang berbeda.`,{orderId:`Pilih pesanan dari toko yang sama.`})}else if(!await this.stores.getPublic(n))throw new N(`Toko tidak ditemukan.`,{storeId:`Pilih toko yang valid.`});if(!ze(e.feeDate))throw new N(`Tanggal biaya tidak valid.`,{feeDate:`Pilih tanggal biaya yang valid.`});return{storeId:n,orderId:t,feeType:yn(e.feeType),amount:Jt(e.amount,`Nominal biaya`,`amount`),feeDate:e.feeDate,source:bn(e.source),notes:P(e.notes,1e3)}}async create(e){let t=await this.normalize(e),n=await this.fees.create(t);return await this.audit.log(`create`,`marketplace_fee`,n,{storeId:t.storeId,feeType:t.feeType,amount:t.amount,source:t.source}),this.get(n)}async update(e,t){await this.get(e);let n=await this.normalize(t);return await this.fees.update(e,n),await this.audit.log(`update`,`marketplace_fee`,e,{storeId:n.storeId,feeType:n.feeType,amount:n.amount,source:n.source}),this.get(e)}async delete(e){await this.get(e),await this.fees.delete(e),await this.audit.log(`delete`,`marketplace_fee`,e)}},Sn=new Intl.NumberFormat(`id-ID`,{style:`currency`,currency:`IDR`,minimumFractionDigits:0,maximumFractionDigits:0}),Cn=new Intl.NumberFormat(`id-ID`,{maximumFractionDigits:0}),wn=new Intl.NumberFormat(`id-ID`,{notation:`compact`,maximumFractionDigits:1}),Tn=new Intl.NumberFormat(`id-ID`,{minimumFractionDigits:1,maximumFractionDigits:1});function F(e){if(!Number.isFinite(e))return`N/A`;let t=Math.round(e);return t<0?`-${Sn.format(Math.abs(t))}`:Sn.format(t)}function I(e){return Number.isFinite(e)?Cn.format(e):`N/A`}function En(e){return Number.isFinite(e)?`${e<0?`-`:``}Rp ${wn.format(Math.abs(e))}`:`N/A`}function Dn(e){return e===null||!Number.isFinite(e)?`N/A`:`${Tn.format(e)}%`}function On(e){return e===null||!Number.isFinite(e)?`N/A`:Tn.format(e)}function kn(e){let t=e.trim().replace(/^rp/i,``).replace(/\s+/g,``).replace(/\u00a0/g,``);if(t===``)return null;let n=t.startsWith(`-`)?-1:1,r=t.replace(/^[+-]/,``);if(!/^[0-9.,]+$/.test(r))return null;let i,a=r.lastIndexOf(`.`),o=r.lastIndexOf(`,`);if(a>=0&&o>=0){let e=a>o?`.`:`,`,t=e===`.`?`,`:`.`;i=r.split(t).join(``);let n=i.lastIndexOf(e);if(n>=0){let e=i.slice(n+1);if(/[1-9]/.test(e))return null;i=i.slice(0,n)}}else if(o>=0){let e=r.slice(o+1);if(r.indexOf(`,`)===o&&e.length>0&&e.length<=2){if(/[1-9]/.test(e))return null;i=r.slice(0,o)}else i=r.split(`,`).join(``)}else if(a>=0){let e=r.slice(a+1);if(r.indexOf(`.`)===a&&e.length>0&&e.length<=2){if(/[1-9]/.test(e))return null;i=r.slice(0,a)}else i=r.split(`.`).join(``)}else i=r;if(i=i.replace(/[.,]/g,``),!/^\d+$/.test(i))return null;let s=Number(i);return Number.isSafeInteger(s)?n*s:null}function An(e){let t=e.trim().replace(/\s+/g,``);if(!/^-?\d+$/.test(t))return null;let n=Number(t);return Number.isSafeInteger(n)?n:null}function jn(e,t){return t===0?null:(e-t)/Math.abs(t)*100}function Mn(){return{grossSales:0,sellerDiscount:0,marketplaceDiscount:0,refunds:0,cogs:0,marketplaceFeesActual:0,marketplaceFeesEstimated:0,advertisingSpend:0,operationalExpenses:0,sharedOperationalExpenses:0,sharedAdvertisingSpend:0,orderCount:0,unitsSold:0}}function Nn(e){let t=e.marketplaceFeesActual+e.marketplaceFeesEstimated,n=e.grossSales-e.sellerDiscount-e.refunds,r=n-e.cogs,i=n-e.cogs-t-e.advertisingSpend-e.operationalExpenses;return{grossSales:e.grossSales,sellerDiscount:e.sellerDiscount,marketplaceDiscount:e.marketplaceDiscount,refunds:e.refunds,netSales:n,cogs:e.cogs,grossProfit:r,marketplaceFeesActual:e.marketplaceFeesActual,marketplaceFeesEstimated:e.marketplaceFeesEstimated,marketplaceFees:t,advertisingSpend:e.advertisingSpend,operationalExpenses:e.operationalExpenses,sharedOperationalExpenses:e.sharedOperationalExpenses,sharedAdvertisingSpend:e.sharedAdvertisingSpend,operatingProfit:i,orderCount:e.orderCount,unitsSold:e.unitsSold,averageOrderValue:e.orderCount>0?Math.round(n/e.orderCount):0,marginPercent:n>0?i/n*100:null,hasEstimatedFees:e.marketplaceFeesEstimated>0}}function Pn(e,t){return t.storeId===null||e===t.storeId}function Fn(e,t,n){for(let r of t.orders)if(pt(r.status)&&Pn(r.storeId,n)){e.orderCount+=1,e.sellerDiscount+=r.sellerDiscount,e.marketplaceDiscount+=r.marketplaceDiscount;for(let t of r.items)e.grossSales+=t.quantity*t.unitPrice,e.cogs+=t.quantity*t.hppSnapshot,e.unitsSold+=t.quantity}}function In(e,t,n){for(let r of t.fees)Pn(r.storeId,n)&&(r.source===`estimated`?e.marketplaceFeesEstimated+=r.amount:e.marketplaceFeesActual+=r.amount)}function Ln(e,t,n){for(let r of t.refunds)r.status===`completed`&&pt(r.orderStatus)&&Pn(r.storeId,n)&&(e.refunds+=r.amount)}function Rn(e,t,n){for(let r of t.advertisingExpenses)r.storeId===null&&(e.sharedAdvertisingSpend+=r.amount,n.storeId!==null)||Pn(r.storeId,n)&&(e.advertisingSpend+=r.amount)}function zn(e,t,n){for(let r of t.operationalExpenses)r.storeId===null&&(e.sharedOperationalExpenses+=r.amount,n.storeId!==null)||Pn(r.storeId,n)&&(e.operationalExpenses+=r.amount)}function Bn(e,t){let n=Mn();return Fn(n,e,t),In(n,e,t),Ln(n,e,t),Rn(n,e,t),zn(n,e,t),Nn(n)}function Vn(e,t,n,r){let i=new Map;for(let e of Ke(n,r))i.set(e,Mn());for(let n of e.orders){if(!pt(n.status)||!Pn(n.storeId,t))continue;let e=i.get(n.orderDate);if(e){e.orderCount+=1,e.sellerDiscount+=n.sellerDiscount,e.marketplaceDiscount+=n.marketplaceDiscount;for(let t of n.items)e.grossSales+=t.quantity*t.unitPrice,e.cogs+=t.quantity*t.hppSnapshot,e.unitsSold+=t.quantity}}for(let n of e.fees){if(!Pn(n.storeId,t))continue;let e=i.get(n.feeDate);e&&(n.source===`estimated`?e.marketplaceFeesEstimated+=n.amount:e.marketplaceFeesActual+=n.amount)}for(let n of e.refunds){if(n.status!==`completed`||!pt(n.orderStatus)||!Pn(n.storeId,t))continue;let e=i.get(n.refundDate);e&&(e.refunds+=n.amount)}for(let n of e.advertisingExpenses){let e=i.get(n.expenseDate);e&&(n.storeId===null&&(e.sharedAdvertisingSpend+=n.amount,t.storeId!==null)||Pn(n.storeId,t)&&(e.advertisingSpend+=n.amount))}for(let n of e.operationalExpenses){let e=i.get(n.expenseDate);e&&(n.storeId===null&&(e.sharedOperationalExpenses+=n.amount,t.storeId!==null)||Pn(n.storeId,t)&&(e.operationalExpenses+=n.amount))}return[...i.entries()].sort(([e],[t])=>e.localeCompare(t)).map(([e,t])=>({date:e,...Nn(t)}))}function Hn(e,t){return t.map(t=>({storeId:t.id,storeName:t.name,platform:t.platform,summary:Bn(e,{storeId:t.id})})).sort((e,t)=>t.summary.netSales-e.summary.netSales)}function Un(e,t){return{current:e,previous:t,grossSalesChangePercent:jn(e.grossSales,t.grossSales),netSalesChangePercent:jn(e.netSales,t.netSales),operatingProfitChangePercent:jn(e.operatingProfit,t.operatingProfit)}}function Wn(e,t,n){return n<=0||t===null?{roas:null,acos:null}:e<=0?{roas:null,acos:t>0?0:null}:{roas:t/e,acos:t>0?e/t*100:null}}function Gn(e){if(!rn.includes(e))throw new N(`Platform iklan tidak valid.`,{platform:`Pilih platform iklan.`});return e}var Kn=class{ads;stores;audit;constructor(e,t,n){this.ads=e,this.stores=t,this.audit=n}async listCampaigns(e){return(await this.ads.listCampaigns({storeId:e??null})).map(e=>{let t=Wn(e.totalSpend,e.totalAttributedRevenue,e.attributionRows);return{...e,...t}})}async getCampaign(e){let t=await this.ads.getCampaign(e);if(!t)throw new Gt(`Kampanye iklan tidak ditemukan.`);return{...t,...Wn(t.totalSpend,t.totalAttributedRevenue,t.attributionRows)}}async normalizeCampaign(e){let t=qt(e.name,`Nama kampanye`,`name`);if(t.length>150)throw new N(`Nama kampanye terlalu panjang.`,{name:`Nama kampanye maksimal 150 karakter.`});let n=Gn(e.platform),r=P(e.storeId,100);if(r&&!await this.stores.getPublic(r))throw new N(`Toko tidak ditemukan.`,{storeId:`Pilih toko yang valid.`});return{storeId:r,platform:n,name:t,notes:P(e.notes,1e3)}}async createCampaign(e){let t=await this.normalizeCampaign(e),n=await this.ads.createCampaign(t);return await this.audit.log(`create`,`advertising_campaign`,n,{name:t.name,platform:t.platform,storeId:t.storeId}),this.getCampaign(n)}async updateCampaign(e,t){await this.getCampaign(e);let n=await this.normalizeCampaign(t);return await this.ads.updateCampaign(e,n),await this.audit.log(`update`,`advertising_campaign`,e,{name:n.name,platform:n.platform,storeId:n.storeId}),this.getCampaign(e)}async deleteCampaign(e){let t=await this.getCampaign(e);await this.ads.deleteCampaign(e),await this.audit.log(`delete`,`advertising_campaign`,e,{name:t.name,expenseCount:t.expenseCount})}listExpenses(e={}){return this.ads.listExpenses(e)}async getExpense(e){let t=await this.ads.getExpense(e);if(!t)throw new Gt(`Biaya iklan tidak ditemukan.`);return t}async normalizeExpense(e){let t=await this.ads.getCampaignBase(e.campaignId);if(!t)throw new N(`Kampanye iklan tidak ditemukan.`,{campaignId:`Pilih kampanye iklan yang valid.`});if(!ze(e.expenseDate))throw new N(`Tanggal biaya iklan tidak valid.`,{expenseDate:`Pilih tanggal yang valid.`});let n=Xt(e.impressions,`Impression`,`impressions`),r=Xt(e.clicks,`Click`,`clicks`),i=Xt(e.attributedOrders,`Pesanan teratribusi`,`attributedOrders`),a=Xt(e.attributedRevenue,`Omzet teratribusi`,`attributedRevenue`);return{campaignId:t.id,expenseDate:e.expenseDate,amount:Jt(e.amount,`Pengeluaran iklan`,`amount`),impressions:n,clicks:r,attributedOrders:i,attributedRevenue:a,notes:P(e.notes,1e3)}}async createExpense(e){let t=await this.normalizeExpense(e),n=await this.ads.createExpense(t);return await this.audit.log(`create`,`advertising_expense`,n,{campaignId:t.campaignId,amount:t.amount,date:t.expenseDate}),this.getExpense(n)}async updateExpense(e,t){await this.getExpense(e);let n=await this.normalizeExpense(t);return await this.ads.updateExpense(e,n),await this.audit.log(`update`,`advertising_expense`,e,{campaignId:n.campaignId,amount:n.amount,date:n.expenseDate}),this.getExpense(e)}async deleteExpense(e){await this.getExpense(e),await this.ads.deleteExpense(e),await this.audit.log(`delete`,`advertising_expense`,e)}async campaignsForSelect(){return(await this.ads.listCampaigns()).map(e=>({id:e.id,storeId:e.storeId,platform:e.platform,name:e.name,notes:e.notes,createdAt:e.createdAt,updatedAt:e.updatedAt}))}};function qn(e){if(!an.includes(e))throw new N(`Kategori biaya tidak valid.`,{category:`Pilih kategori biaya.`});return e}var Jn=class{expenses;stores;audit;constructor(e,t,n){this.expenses=e,this.stores=t,this.audit=n}list(e){return this.expenses.list(e)}async get(e){let t=await this.expenses.getById(e);if(!t)throw new Gt(`Biaya operasional tidak ditemukan.`);return t}async normalize(e){let t=P(e.storeId,100);if(t&&!await this.stores.getPublic(t))throw new N(`Toko tidak ditemukan.`,{storeId:`Pilih toko yang valid.`});if(!ze(e.expenseDate))throw new N(`Tanggal biaya tidak valid.`,{expenseDate:`Pilih tanggal biaya yang valid.`});let n=Jt(e.amount,`Nominal biaya`,`amount`);if(n<=0)throw new N(`Nominal biaya harus lebih dari 0.`,{amount:`Nominal biaya harus lebih dari 0.`});return{storeId:t,expenseDate:e.expenseDate,category:qn(e.category),amount:n,description:qt(e.description,`Deskripsi`,`description`),receiptNote:P(e.receiptNote,2e3)}}async create(e){let t=await this.normalize(e),n=await this.expenses.create(t);return await this.audit.log(`create`,`operational_expense`,n,{storeId:t.storeId,category:t.category,amount:t.amount,date:t.expenseDate}),this.get(n)}async update(e,t){await this.get(e);let n=await this.normalize(t);return await this.expenses.update(e,n),await this.audit.log(`update`,`operational_expense`,e,{storeId:n.storeId,category:n.category,amount:n.amount,date:n.expenseDate}),this.get(e)}async delete(e){await this.get(e),await this.expenses.delete(e),await this.audit.log(`delete`,`operational_expense`,e)}};function Yn(e){if(!on.includes(e))throw new N(`Status refund tidak valid.`,{status:`Pilih status refund.`});return e}var Xn=class{refunds;orders;settlements;audit;constructor(e,t,n,r){this.refunds=e,this.orders=t,this.settlements=n,this.audit=r}list(e){return this.refunds.list(e)}async get(e){let t=await this.refunds.getById(e);if(!t)throw new Gt(`Refund tidak ditemukan.`);return t}async describeRevenueImpact(e){let t=await this.orders.getById(e);if(!t)throw new Gt(`Pesanan tidak ditemukan.`);return{countsInRevenue:pt(t.status)}}async normalize(e,t){let n=qt(e.orderId,`Pesanan`,`orderId`),r=await this.orders.getDetail(n);if(!r)throw new N(`Pesanan tidak ditemukan.`,{orderId:`Pilih pesanan yang valid.`});if(!ze(e.refundDate))throw new N(`Tanggal refund tidak valid.`,{refundDate:`Pilih tanggal refund yang valid.`});let i=Yt(e.quantity,`Jumlah barang`,`quantity`),a=Jt(e.amount,`Nilai refund`,`amount`);if(a<=0)throw new N(`Nilai refund harus lebih dari 0.`,{amount:`Nilai refund harus lebih dari 0.`});let o=r.items.reduce((e,t)=>e+t.quantity,0),s=r.refunds.filter(e=>e.id!==t&&e.status!==`rejected`).reduce((e,t)=>e+t.quantity,0);if(i+s>o)throw new N(`Jumlah barang melebihi jumlah pada pesanan.`,{quantity:`Maksimal ${Math.max(0,o-s)} barang untuk refund ini.`});let c=r.items.reduce((e,t)=>e+t.quantity*t.unitPrice,0),l=r.refunds.filter(e=>e.id!==t&&e.status!==`rejected`).reduce((e,t)=>e+t.amount,0);if(a+l>c)throw new N(`Nilai refund melebihi nilai pesanan.`,{amount:`Maksimal ${c-l} untuk refund ini.`});let u=P(e.settlementId,100);if(u){let e=await this.settlements.getById(u);if(!e)throw new N(`Settlement tidak ditemukan.`,{settlementId:`Pilih settlement yang valid.`});if(e.storeId!==r.storeId)throw new N(`Settlement berasal dari toko yang berbeda.`,{settlementId:`Pilih settlement dari toko yang sama.`})}return{orderId:r.id,storeId:r.storeId,settlementId:u,refundDate:e.refundDate,amount:a,quantity:i,reason:qt(e.reason,`Alasan refund`,`reason`),status:Yn(e.status),notes:P(e.notes,1e3)}}async create(e){let t=await this.normalize(e),n=await this.refunds.create(t);return await this.audit.log(`create`,`refund`,n,{orderId:t.orderId,amount:t.amount,status:t.status,date:t.refundDate}),this.get(n)}async update(e,t){await this.get(e);let n=await this.normalize(t,e);return await this.refunds.update(e,n),await this.audit.log(`update`,`refund`,e,{orderId:n.orderId,amount:n.amount,status:n.status,date:n.refundDate}),this.get(e)}async delete(e){await this.get(e),await this.refunds.delete(e),await this.audit.log(`delete`,`refund`,e)}};function Zn(e){if(!sn.includes(e))throw new N(`Status settlement tidak valid.`,{status:`Pilih status settlement.`});return e}var Qn=class{settlements;stores;audit;constructor(e,t,n){this.settlements=e,this.stores=t,this.audit=n}list(e){return this.settlements.list(e)}async get(e){let t=await this.settlements.getById(e);if(!t)throw new Gt(`Settlement tidak ditemukan.`);return t}listForSelect(e){return this.settlements.listForSelect(e)}async normalize(e){let t=qt(e.storeId,`Toko`,`storeId`);if(!await this.stores.getPublic(t))throw new N(`Toko tidak ditemukan.`,{storeId:`Pilih toko yang valid.`});let n=qt(e.settlementNo,`Nomor settlement`,`settlementNo`);if(n.length>120)throw new N(`Nomor settlement terlalu panjang.`,{settlementNo:`Nomor settlement maksimal 120 karakter.`});if(!ze(e.settlementDate))throw new N(`Tanggal settlement tidak valid.`,{settlementDate:`Pilih tanggal settlement yang valid.`});return{storeId:t,settlementNo:n,settlementDate:e.settlementDate,grossSales:Jt(e.grossSales,`Total penjualan`,`grossSales`),totalDeductions:Jt(e.totalDeductions,`Total potongan`,`totalDeductions`),totalPayout:Jt(e.totalPayout,`Total pencairan`,`totalPayout`),status:Zn(e.status),notes:P(e.notes,1e3)}}async assertUnique(e,t,n){let r=await this.settlements.findByNumber(e,t);if(r&&r.id!==n)throw new Kt(`Nomor settlement "${t}" sudah ada pada toko ini.`)}async create(e){let t=await this.normalize(e);await this.assertUnique(t.storeId,t.settlementNo);try{let e=await this.settlements.create(t);return await this.audit.log(`create`,`settlement`,e,{storeId:t.storeId,settlementNo:t.settlementNo,totalPayout:t.totalPayout}),this.get(e)}catch(e){throw Zt(e)?new Kt(`Nomor settlement "${t.settlementNo}" sudah ada pada toko ini.`):e}}async update(e,t){await this.get(e);let n=await this.normalize(t);await this.assertUnique(n.storeId,n.settlementNo,e);try{return await this.settlements.update(e,n),await this.audit.log(`update`,`settlement`,e,{storeId:n.storeId,settlementNo:n.settlementNo,totalPayout:n.totalPayout}),this.get(e)}catch(e){throw Zt(e)?new Kt(`Nomor settlement "${n.settlementNo}" sudah ada pada toko ini.`):e}}async delete(e){await this.get(e),await this.settlements.delete(e),await this.audit.log(`delete`,`settlement`,e)}},$n=[{key:`orderId`,label:`Nomor pesanan`,required:!0,help:`Nomor pesanan unik dari marketplace.`,aliases:[`order id`,`order_id`,`no pesanan`,`nomor pesanan`,`no. pesanan`,`order no`,`id pesanan`]},{key:`orderDate`,label:`Tanggal pesanan`,required:!0,help:`Tanggal pesanan (YYYY-MM-DD atau DD/MM/YYYY).`,aliases:[`tanggal pesanan`,`order date`,`tanggal`,`waktu pesanan`,`created at`,`order time`]},{key:`status`,label:`Status`,required:!0,help:`Status marketplace akan dipetakan ke status internal.`,aliases:[`status pesanan`,`status`,`order status`,`status order`]},{key:`productName`,label:`Nama produk`,required:!1,help:`Nama produk pada baris pesanan. Wajib jika SKU tidak diisi.`,aliases:[`nama produk`,`product name`,`produk`,`item name`,`nama item`]},{key:`sku`,label:`SKU`,required:!1,help:`SKU produk. Wajib jika nama produk tidak diisi.`,aliases:[`sku`,`seller sku`,`sku produk`,`product sku`]},{key:`quantity`,label:`Kuantitas`,required:!0,help:`Jumlah barang pada baris.`,aliases:[`kuantitas`,`quantity`,`qty`,`jumlah`,`jumlah barang`]},{key:`unitPrice`,label:`Harga satuan`,required:!0,help:`Harga jual per barang sebelum potongan.`,aliases:[`harga satuan`,`unit price`,`harga`,`price`,`harga jual`]},{key:`hpp`,label:`HPP`,required:!1,help:`Opsional. Jika kosong, HPP diambil dari master produk. Jika produk tidak ditemukan, HPP dianggap 0 dan diberi peringatan.`,aliases:[`hpp`,`modal`,`cost`,`harga modal`]},{key:`sellerDiscount`,label:`Diskon penjual`,required:!1,help:`Diskon yang ditanggung penjual. Nilai pesanan, bukan per baris.`,aliases:[`diskon penjual`,`seller discount`,`diskon toko`]},{key:`marketplaceDiscount`,label:`Diskon marketplace`,required:!1,help:`Diskon yang ditanggung marketplace. Tidak mengurangi pendapatan penjual.`,aliases:[`diskon marketplace`,`marketplace discount`,`diskon platform`]},{key:`shippingPaid`,label:`Ongkir dibayar pembeli`,required:!1,help:`Nilai ongkir yang dibayar pembeli, jika ada.`,aliases:[`ongkir`,`shipping`,`ongkos kirim`,`shipping fee`]},{key:`marketplaceFee`,label:`Biaya marketplace`,required:!1,help:`Biaya aktual per pesanan. Akan disimpan sebagai biaya marketplace aktual.`,aliases:[`biaya marketplace`,`marketplace fee`,`biaya admin`,`commission`,`fee`,`biaya layanan`]},{key:`refundAmount`,label:`Nilai refund`,required:!1,help:`Jika diisi, refund aktual akan dicatat untuk pesanan ini.`,aliases:[`refund`,`nominal refund`,`pengembalian dana`,`refund amount`]},{key:`refundQuantity`,label:`Jumlah barang refund`,required:!1,help:`Opsional. Default memakai seluruh kuantitas pesanan.`,aliases:[`jumlah refund`,`refund quantity`,`qty refund`]},{key:`notes`,label:`Catatan`,required:!1,help:`Catatan tambahan untuk pesanan.`,aliases:[`catatan`,`notes`,`remark`,`keterangan`]}];function er(e){return e.toLowerCase().replace(/[_\-.]+/g,` `).replace(/\s+/g,` `).trim()}function tr(e){let t=Object.fromEntries($n.map(e=>[e.key,null])),n=new Set;for(let r of $n){let i=e.find(e=>{if(n.has(e))return!1;let t=er(e);return r.aliases.some(e=>t===e||t.includes(e))});i&&(t[r.key]=i,n.add(i))}return t}function nr(e,t){let n=[],r=new Set(t),i=new Map;for(let t of $n){let a=e[t.key];if(a!==null&&!r.has(a)&&n.push(`Kolom "${a}" untuk ${t.label} tidak ditemukan.`),a!==null){let e=i.get(a);e?n.push(`Kolom "${a}" dipetakan ke lebih dari satu field (${e} dan ${t.label}).`):i.set(a,t.label)}}for(let t of $n)t.required&&e[t.key]===null&&n.push(`${t.label} wajib dipetakan.`);return e.productName===null&&e.sku===null&&n.push(`Pilih minimal salah satu kolom Nama produk atau SKU.`),n}var rr=class{row;headerIndex;mapping;constructor(e,t,n){this.row=e,this.headerIndex=t,this.mapping=n}get(e){let t=this.mapping[e];if(!t)return``;let n=this.headerIndex.get(t);return n===void 0?``:(this.row[n]??``).trim()}has(e){return this.get(e)!==``}};function ir(e){let t=e.trim();if(t===``)return null;let n=/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/.exec(t);if(n){let e=`${n[1]}-${(n[2]??``).padStart(2,`0`)}-${(n[3]??``).padStart(2,`0`)}`;return ze(e)?e:null}let r=/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/.exec(t);if(r){let e=Number(r[1]),t=Number(r[2]),n=Number(r[3]);e>12&&t<=12||t>12&&e<=12&&([e,t]=[t,e]);let i=`${n}-${String(t).padStart(2,`0`)}-${String(e).padStart(2,`0`)}`;return ze(i)?i:null}return null}function ar(e){let t=e.trim().toLowerCase();return t===``?null:{pending:`pending`,menunggu:`pending`,"belum bayar":`pending`,unpaid:`pending`,processing:`processing`,diproses:`processing`,"siap kirim":`processing`,"ready to ship":`processing`,shipped:`shipped`,dikirim:`shipped`,"in transit":`shipped`,delivered:`delivered`,terkirim:`delivered`,diterima:`delivered`,completed:`completed`,selesai:`completed`,"pesanan selesai":`completed`,cancelled:`cancelled`,canceled:`cancelled`,batal:`cancelled`,dibatalkan:`cancelled`,returned:`returned`,retur:`returned`,dikembalikan:`returned`,refunded:`refunded`,refund:`refunded`,"dana dikembalikan":`refunded`}[t.replace(/[_-]+/g,` `).replace(/\s+/g,` `).trim()]??null}function or(e,t,n,r){if(e.trim()===``)return 0;let i=kn(e);return i===null||i<0?(n.push({rowNumber:r,message:`${t} tidak valid: "${e}".`}),0):i}function sr(e,t,n,r,i,a){let o=e.map(({row:e})=>new rr(e,n,r).get(t)).filter(e=>e!==``);if(o.length===0)return``;let s=[...new Set(o)];return s.length>1&&a.push({rowNumber:e[0]?.rowNumber??1,message:`Nilai ${i} berbeda antar baris dalam pesanan yang sama.`}),s[0]??``}var cr=class{db;orders;products;stores;fees;refunds;imports;audit;constructor(e,t,n,r,i,a,o,s){this.db=e,this.orders=t,this.products=n,this.stores=r,this.fees=i,this.refunds=a,this.imports=o,this.audit=s}async preview(e,t,n){if(!n)throw new N(`Pilih toko tujuan import.`,{storeId:`Toko tujuan import wajib dipilih.`});if(!await this.stores.getPublic(n))throw new N(`Toko tidak ditemukan.`,{storeId:`Pilih toko yang valid.`});let r=nr(t,e.headers);if(r.length>0)return{fileName:e.fileName,storeId:n,totalRows:e.rows.length,candidates:[],headerIndex:new Map(e.headers.map((e,t)=>[e,t])),mappingErrors:r,validCount:0,duplicateCount:0,invalidCount:0,warningCount:0,successRows:0,duplicateRows:0,invalidRows:0,ungroupedErrors:[]};let i=new Map(e.headers.map((e,t)=>[e,t])),a=new Map,o=[];for(let n of e.rows){let e=new rr(n.values,i,t).get(`orderId`);if(e===``){o.push({rowNumber:n.rowNumber,message:`Nomor pesanan kosong.`});continue}let r=a.get(e)??[];r.push({rowNumber:n.rowNumber,row:n.values}),a.set(e,r)}let s=await this.orders.findExistingMarketplaceIds(n,[...a.keys()]),c=new Map,l=[];for(let[e,n]of a){let r=[],a=[],o=n.map(e=>e.rowNumber),u=o[0]??1,d=sr(n,`orderDate`,i,t,`tanggal pesanan`,r),f=ir(d);f||r.push({rowNumber:u,message:`Tanggal pesanan tidak valid: "${d||`(kosong)`}". Gunakan YYYY-MM-DD atau DD/MM/YYYY.`});let p=sr(n,`status`,i,t,`status`,r),m=ar(p);m||r.push({rowNumber:u,message:`Status pesanan tidak dikenali: "${p||`(kosong)`}".`});let h=or(sr(n,`sellerDiscount`,i,t,`diskon penjual`,r),`Diskon penjual`,r,u),g=or(sr(n,`marketplaceDiscount`,i,t,`diskon marketplace`,r),`Diskon marketplace`,r,u),_=or(sr(n,`shippingPaid`,i,t,`ongkir`,r),`Ongkir`,r,u),v=or(sr(n,`marketplaceFee`,i,t,`biaya marketplace`,r),`Biaya marketplace`,r,u),y=or(sr(n,`refundAmount`,i,t,`refund`,r),`Nilai refund`,r,u),b=sr(n,`refundQuantity`,i,t,`jumlah barang refund`,r),ee=sr(n,`notes`,i,t,`catatan`,r)||null,x=[],te=0;for(let{rowNumber:e,row:o}of n){let n=new rr(o,i,t),s=n.get(`productName`),l=n.get(`sku`),u=n.get(`quantity`),d=n.get(`unitPrice`),f=n.get(`hpp`),p=An(u)??0,m=kn(d)??NaN,h=!0;if(s===``&&l===``&&(r.push({rowNumber:e,message:`Nama produk atau SKU wajib diisi.`}),h=!1),(!Number.isSafeInteger(p)||p<=0)&&(r.push({rowNumber:e,message:`Kuantitas tidak valid: "${u}".`}),h=!1),(!Number.isSafeInteger(m)||m<0)&&(r.push({rowNumber:e,message:`Harga satuan tidak valid: "${d}".`}),h=!1),!h)continue;let g=(l||s).toLowerCase(),_=c.get(g);if(!_){let e=l?await this.products.getBySku(l):await this.products.getByName(s);_=e?{id:e.id,name:e.name,sku:e.sku,cost:e.currentCost}:{id:null,name:s,sku:l,cost:0},c.set(g,_)}let v=_.cost;if(f!==``){let t=kn(f);if(t===null||t<0){r.push({rowNumber:e,message:`HPP tidak valid: "${f}".`});continue}v=t}else _.id===null&&a.push(`Produk "${s||l}" tidak ditemukan di master produk. HPP baris ${e} dianggap 0.`);x.push({productId:_.id,productName:_.name||s||l,sku:_.sku||l||s,quantity:p,unitPrice:m,hppSnapshot:v}),te+=p}x.length===0&&r.push({rowNumber:u,message:`Pesanan tidak memiliki item yang valid.`});let ne=0;if(y>0){if(b!==``){let e=An(b);e===null||e<=0?r.push({rowNumber:u,message:`Jumlah barang refund tidak valid: "${b}".`}):ne=e}else ne=te;ne>te&&r.push({rowNumber:u,message:`Jumlah barang refund (${ne}) melebihi jumlah barang pesanan (${te}).`});let e=x.reduce((e,t)=>e+t.quantity*t.unitPrice,0);y>e&&r.push({rowNumber:u,message:`Nilai refund (${y}) melebihi nilai pesanan (${e}).`})}let re=s.has(e);l.push({key:e,rowNumbers:o,orderId:e,orderDate:f??``,status:m??`pending`,items:x,sellerDiscount:h,marketplaceDiscount:g,shippingPaid:_,marketplaceFee:v,refundAmount:y,refundQuantity:ne,notes:ee,issues:r,warnings:a,duplicate:re})}let u=l.filter(e=>e.issues.length===0&&!e.duplicate),d=l.filter(e=>e.issues.length===0&&e.duplicate),f=l.filter(e=>e.issues.length>0);return{fileName:e.fileName,storeId:n,totalRows:e.rows.length,candidates:l,headerIndex:i,mappingErrors:r,validCount:u.length,duplicateCount:d.length,invalidCount:f.length,warningCount:l.reduce((e,t)=>e+t.warnings.length,0),successRows:u.reduce((e,t)=>e+t.rowNumbers.length,0),duplicateRows:d.reduce((e,t)=>e+t.rowNumbers.length,0),invalidRows:f.reduce((e,t)=>e+t.rowNumbers.length,0)+o.length,ungroupedErrors:o}}async execute(e){if(e.mappingErrors.length>0)throw new N(`Mapping kolom masih bermasalah.`,{mapping:e.mappingErrors.join(` `)});if(!await this.stores.getPublic(e.storeId))throw new N(`Toko tujuan import tidak ditemukan.`);let t=e.candidates.filter(e=>e.issues.length===0&&!e.duplicate),n=e.candidates.filter(e=>e.issues.length>0),r=e.candidates.filter(e=>e.duplicate&&e.issues.length===0),i=await this.orders.findExistingMarketplaceIds(e.storeId,t.map(e=>e.orderId)),a=[...r,...t.filter(e=>i.has(e.orderId))],o=t.filter(e=>!i.has(e.orderId)),s=[];for(let t of e.ungroupedErrors)s.push({rowNumber:t.rowNumber,message:t.message,rawData:null});for(let e of n)for(let t of e.issues)s.push({rowNumber:t.rowNumber,message:t.message,rawData:null});let c=a.reduce((e,t)=>e+t.rowNumbers.length,0),l=o.reduce((e,t)=>e+t.rowNumbers.length,0),u=e.candidates.flatMap(e=>e.warnings),d=await this.db.transaction(async t=>{let n=0;for(let r of o){let i=await this.orders.insertOrder({storeId:e.storeId,marketplaceOrderId:r.orderId,orderDate:r.orderDate,status:r.status,sellerDiscount:r.sellerDiscount,marketplaceDiscount:r.marketplaceDiscount,shippingPaid:r.shippingPaid,settlementValue:null,notes:r.notes},r.items,t);n+=1,r.marketplaceFee>0&&await this.fees.create({storeId:e.storeId,orderId:i,feeType:`other`,amount:r.marketplaceFee,feeDate:r.orderDate,source:`actual`,notes:`Biaya dari import pesanan`},t),r.refundAmount>0&&await this.refunds.create({orderId:i,storeId:e.storeId,settlementId:null,refundDate:r.orderDate,amount:r.refundAmount,quantity:r.refundQuantity,reason:`Refund dari import marketplace`,status:`completed`,notes:`Dibuat dari import pesanan`},t)}let r={importType:`orders`,fileName:e.fileName,totalRows:e.totalRows,successRows:l,failedRows:e.invalidRows,skippedRows:c,notes:[`${n} pesanan dibuat`,u.length>0?`${u.length} peringatan HPP/produk`:null].filter(e=>e!==null).join(`. `)},i=await this.imports.createBatch(r,t);return s.length>0&&await this.imports.addErrors(i,s.slice(0,1e3),t),i});return await this.audit.log(`import`,`order`,null,{batchId:d,storeId:e.storeId,successRows:l,failedRows:e.invalidRows,skippedRows:c,orders:o.length}),{batchId:d,totalRows:e.totalRows,successRows:l,failedRows:e.invalidRows,skippedRows:c,orderCount:o.length,warnings:u,issues:[...e.ungroupedErrors,...n.flatMap(e=>e.issues)]}}},lr=class{tail=Promise.resolve();run(e){let t=this.tail.then(e,e);return this.tail=t.then(()=>void 0,()=>void 0),t}},ur=`manka`;function dr(e){return e===void 0?[]:Array.isArray(e)?[...e]:[]}var fr=class{backend=`native`;queue=new lr;connection;sqlite;inTransaction=!1;closed=!1;constructor(e,t){this.connection=e,this.sqlite=t}assertOpen(){if(this.closed)throw Error(`Database sudah ditutup.`)}async query(e,t){return this.assertOpen(),this.queue.run(async()=>((await this.connection.query(e,dr(t))).values??[]).map(e=>this.normalizeRow(e)))}normalizeRow(e){if(Array.isArray(e)){let t={};return e.forEach((e,n)=>{t[String(n)]=typeof e==`boolean`?+!!e:e}),t}if(e&&typeof e==`object`){let t={};for(let[n,r]of Object.entries(e))t[n]=r===null||typeof r==`string`||typeof r==`number`?r:typeof r==`boolean`?+!!r:r===void 0?null:String(r);return t}return{}}async execute(e,t){return this.assertOpen(),this.queue.run(async()=>{let n=await this.connection.run(e,dr(t),!1);return{changes:n.changes?.changes??0,lastInsertId:n.changes?.lastId??null}})}async executeScript(e){return this.assertOpen(),this.queue.run(async()=>{await this.connection.execute(e,!1)})}async transaction(e){return this.assertOpen(),this.queue.run(async()=>{await this.connection.beginTransaction(),this.inTransaction=!0;let t={query:async(e,t)=>((await this.connection.query(e,dr(t))).values??[]).map(e=>this.normalizeRow(e)),execute:async(e,t)=>{let n=await this.connection.run(e,dr(t),!1);return{changes:n.changes?.changes??0,lastInsertId:n.changes?.lastId??null}},executeScript:async e=>{await this.connection.execute(e,!1)}};try{let n=await e(t);return await this.connection.commitTransaction(),this.inTransaction=!1,n}catch(e){try{await this.connection.rollbackTransaction()}catch{}throw this.inTransaction=!1,e}})}async close(){this.closed||await this.queue.run(async()=>{if(this.inTransaction)try{await this.connection.rollbackTransaction()}catch{}await this.connection.close(),await this.sqlite.closeConnection(ur,!1),this.closed=!0})}};async function pr(){let{CapacitorSQLite:e,SQLiteConnection:t}=await de(async()=>{let{CapacitorSQLite:e,SQLiteConnection:t}=await import(`./esm-BD_HVl9d.js`);return{CapacitorSQLite:e,SQLiteConnection:t}},[]),n=new t(e),r=await n.checkConnectionsConsistency(),i=await n.isConnection(ur,!1),a=r.result&&i.result?await n.retrieveConnection(ur,!1):await n.createConnection(ur,!1,`no-encryption`,1,!1);return await a.open(),await a.execute(`PRAGMA foreign_keys = ON;`,!1),new fr(a,n)}var mr=c(o(((e,t)=>{var n=void 0,r=function(e){return n||(n=new Promise(function(n,r){var i=e===void 0?{}:e,a=i.onAbort;i.onAbort=function(e){r(Error(e)),a&&a(e)},i.postRun=i.postRun||[],i.postRun.push(function(){n(i)}),t=void 0;var o;o||=i===void 0?{}:i;var s=!!globalThis.window,c=!!globalThis.WorkerGlobalScope;o.onRuntimeInitialized=function(){function e(e,t){Ae(e,t instanceof Error?t.message:String(t),-1)}function t(e,t){switch(typeof t){case`boolean`:ke(e,+!!t);break;case`number`:Te(e,t);break;case`string`:De(e,t,ve(t),-1);break;case`object`:if(t===null)Ee(e);else if(t.length!=null){var n=qt(t.length);oe.set(t,n),Oe(e,n,t.length,-1),P(n)}else Ae(e,`Wrong API use : tried to return a value of an unknown type (`+t+`).`,-1);break;default:Ee(e)}}function n(e,t){for(var n=[],r=0;r<e;r+=1){var i=Lt(t+4*r,`i32`),a=xe(i);if(a===1||a===2)i=we(i);else if(a===3)a=C(i),i=Se(i),i=S(i,a,!0);else if(a===4){a=i,i=C(a),a=Ce(a);for(var o=new Uint8Array(i),s=0;s<i;s+=1)o[s]=oe[a+s];i=o}else i=null;n.push(i)}return n}function r(e,t){this.Va=e,this.db=t,this.Ta=1,this.Eb=[]}function i(e,t){if(this.db=t,this.tb=zt(e),this.tb===null)throw Error(`Unable to allocate memory for the SQL string`);this.zb=this.tb,this.fb=this.Kb=null}function a(e){this.filename=`dbfile_`+(4294967295*Math.random()>>>0),e!=null&&gt(this.filename,e),this.handleError(f(this.filename,u)),this.db=Lt(u,`i32`),l&&Me(this.db),this.Bb={},this.ab=new Map}function s(e,t){return e.replace(/[A-Z]/g,function(e){return e.toLowerCase()})+`:`+t}function c(e){e.forEach(Ht)}var l=o.useOldExtensionFunctions!==!1,u=Zt(4),d=o.cwrap,f=d(`sqlite3_open`,`number`,[`string`,`number`]),p=d(`sqlite3_close_v2`,`number`,[`number`]),m=d(`sqlite3_backup_init`,`number`,[`number`,`string`,`number`,`string`]),h=d(`sqlite3_backup_step`,`number`,[`number`,`number`]),g=d(`sqlite3_backup_finish`,`number`,[`number`]),_=d(`sqlite3_exec`,`number`,[`number`,`number`,`number`,`number`,`number`]),v=d(`sqlite3_changes`,`number`,[`number`]),y=d(`sqlite3_sql`,`string`,[`number`]),b=d(`sqlite3_normalized_sql`,`string`,[`number`]),ee=d(`sqlite3_prepare_v2`,`number`,[`number`,`number`,`number`,`number`,`number`]),x=d(`sqlite3_bind_text`,`number`,[`number`,`number`,`number`,`number`,`number`]),te=d(`sqlite3_bind_blob`,`number`,[`number`,`number`,`number`,`number`,`number`]),ne=d(`sqlite3_bind_double`,`number`,[`number`,`number`,`number`]),re=d(`sqlite3_bind_int`,`number`,[`number`,`number`,`number`]),ie=d(`sqlite3_bind_parameter_index`,`number`,[`number`,`string`]),ae=d(`sqlite3_step`,`number`,[`number`]),se=d(`sqlite3_errmsg`,`string`,[`number`]),ce=d(`sqlite3_column_count`,`number`,[`number`]),le=d(`sqlite3_data_count`,`number`,[`number`]),ue=d(`sqlite3_column_double`,`number`,[`number`,`number`]),de=d(`sqlite3_column_text`,`number`,[`number`,`number`]),fe=d(`sqlite3_column_blob`,`number`,[`number`,`number`]),pe=d(`sqlite3_column_bytes`,`number`,[`number`,`number`]),me=d(`sqlite3_column_type`,`number`,[`number`,`number`]),he=d(`sqlite3_column_name`,`string`,[`number`,`number`]),ge=d(`sqlite3_reset`,`number`,[`number`]),_e=d(`sqlite3_clear_bindings`,`number`,[`number`]),ye=d(`sqlite3_finalize`,`number`,[`number`]),be=d(`sqlite3_create_function_v2`,`number`,`number string number number number number number number number`.split(` `)),xe=d(`sqlite3_value_type`,`number`,[`number`]),C=d(`sqlite3_value_bytes`,`number`,[`number`]),Se=d(`sqlite3_value_text`,`number`,[`number`]),Ce=d(`sqlite3_value_blob`,`number`,[`number`]),we=d(`sqlite3_value_double`,`number`,[`number`]),Te=d(`sqlite3_result_double`,``,[`number`,`number`]),Ee=d(`sqlite3_result_null`,``,[`number`]),De=d(`sqlite3_result_text`,``,[`number`,`string`,`number`,`number`]),Oe=d(`sqlite3_result_blob`,``,[`number`,`number`,`number`,`number`]),ke=d(`sqlite3_result_int`,``,[`number`,`number`]),Ae=d(`sqlite3_result_error`,``,[`number`,`string`,`number`]),je=d(`sqlite3_aggregate_context`,`number`,[`number`,`number`]),Me=d(`RegisterExtensionFunctions`,`number`,[`number`]),Ne=d(`sqlite3_update_hook`,`number`,[`number`,`number`,`number`]);r.prototype.bind=function(e){if(!this.Va)throw`Statement closed`;return this.reset(),Array.isArray(e)?this.bc(e):typeof e==`object`&&e?this.cc(e):!0},r.prototype.step=function(){if(!this.Va)throw`Statement closed`;this.Ta=1;var e=ae(this.Va);switch(e){case 100:return!0;case 101:return!1;default:throw this.db.handleError(e)}},r.prototype.Ub=function(e){return e??(e=this.Ta,this.Ta+=1),ue(this.Va,e)},r.prototype.oc=function(e){if(e??(e=this.Ta,this.Ta+=1),typeof BigInt!=`function`)throw Error(`BigInt is not supported`);return BigInt(this.Vb(e))},r.prototype.Vb=function(e){e??(e=this.Ta,this.Ta+=1);var t=de(this.Va,e);return e=pe(this.Va,e),S(t,e,!0)},r.prototype.getBlob=function(e){e??(e=this.Ta,this.Ta+=1);var t=pe(this.Va,e);e=fe(this.Va,e);for(var n=new Uint8Array(t),r=0;r<t;r+=1)n[r]=oe[e+r];return n},r.prototype.get=function(e,t){t||={},e!=null&&this.bind(e)&&this.step(),e=[];for(var n=le(this.Va),r=0;r<n;r+=1)switch(me(this.Va,r)){case 1:var i=t.useBigInt?this.oc(r):this.Ub(r);e.push(i);break;case 2:e.push(this.Ub(r));break;case 3:e.push(this.Vb(r));break;case 4:e.push(this.getBlob(r));break;default:e.push(null)}return e},r.prototype.Ib=function(){for(var e=[],t=ce(this.Va),n=0;n<t;n+=1)e.push(he(this.Va,n));return e},r.prototype.Tb=function(e,t){var n=this.get(e,t);return e=this.Ib(),Object.fromEntries(e.map(function(e,t){return[e,n[t]]}))},r.prototype.tc=function(){return y(this.Va)},r.prototype.qc=function(){return b(this.Va)},r.prototype.run=function(e){return e!=null&&this.bind(e),this.step(),this.reset()},r.prototype.Pb=function(e,t){t??(t=this.Ta,this.Ta+=1);var n=zt(e);this.Eb.push(n),this.db.handleError(x(this.Va,t,n,ve(e),0))},r.prototype.ac=function(e,t){t??(t=this.Ta,this.Ta+=1);var n=qt(e.length);oe.set(e,n),this.Eb.push(n),this.db.handleError(te(this.Va,t,n,e.length,0))},r.prototype.Ob=function(e,t){t??(t=this.Ta,this.Ta+=1),this.db.handleError((e===(e|0)?re:ne)(this.Va,t,e))},r.prototype.dc=function(e){e??(e=this.Ta,this.Ta+=1),te(this.Va,e,0,0,0)},r.prototype.Qb=function(e,t){switch(t??(t=this.Ta,this.Ta+=1),typeof e){case`string`:this.Pb(e,t);return;case`number`:this.Ob(e,t);return;case`bigint`:this.Pb(e.toString(),t);return;case`boolean`:this.Ob(e+0,t);return;case`object`:if(e===null){this.dc(t);return}if(e.length!=null){this.ac(e,t);return}}throw`Wrong API use : tried to bind a value of an unknown type (`+e+`).`},r.prototype.cc=function(e){var t=this;return Object.keys(e).forEach(function(n){var r=ie(t.Va,n);r!==0&&t.Qb(e[n],r)}),!0},r.prototype.bc=function(e){for(var t=0;t<e.length;t+=1)this.Qb(e[t],t+1);return!0},r.prototype.reset=function(){return this.Hb(),_e(this.Va)===0&&ge(this.Va)===0},r.prototype.Hb=function(){for(var e;(e=this.Eb.pop())!==void 0;)P(e)},r.prototype.jb=function(){this.Hb();var e=ye(this.Va)===0;return delete this.db.Bb[this.Va],this.Va=0,e},i.prototype.next=function(){if(this.tb===null)return{done:!0};if(this.fb!==null&&(this.fb.jb(),this.fb=null),!this.db.db)throw this.ub(),Error(`Database closed`);var e=Qt(),t=Zt(4);It(u),It(t);try{this.db.handleError(ee(this.db.db,this.zb,-1,u,t)),this.zb=Lt(t,`i32`);var n=Lt(u,`i32`);return n===0?(this.ub(),{done:!0}):(this.fb=new r(n,this.db),this.db.Bb[n]=this.fb,{value:this.fb,done:!1})}catch(e){throw this.Kb=S(this.zb),this.ub(),e}finally{Xt(e)}},i.prototype.ub=function(){P(this.tb),this.tb=null},i.prototype.return=function(){return this.fb!==null&&(this.fb.jb(),this.fb=null),this.ub(),{done:!0}},i.prototype.rc=function(){return this.Kb===null?S(this.zb):this.Kb},typeof Symbol==`function`&&typeof Symbol.iterator==`symbol`&&(i.prototype[Symbol.iterator]=function(){return this}),a.prototype.run=function(e,t){if(!this.db)throw`Database closed`;if(t){e=this.Lb(e,t);try{e.step()}finally{e.jb()}}else{e=zt(e);try{this.handleError(_(this.db,e,0,0,u))}finally{P(e)}}return this},a.prototype.exec=function(e,t,n){if(!this.db)throw`Database closed`;var i=Qt(),a=null,o=null,s=null;try{s=o=zt(e);var c=Zt(4);for(e=[];Lt(s,`i8`)!==0;){It(u),It(c),this.handleError(ee(this.db,s,-1,u,c));var l=Lt(u,`i32`);if(s=Lt(c,`i32`),l!==0){var d=null;for(a=new r(l,this),t!=null&&a.bind(t);a.step();)d===null&&(d={columns:a.Ib(),values:[]},e.push(d)),d.values.push(a.get(null,n));a.jb()}}return e}catch(e){throw a&&a.jb(),e}finally{o&&P(o),Xt(i)}},a.prototype.lc=function(e,t,n,r,i){typeof t==`function`&&(r=n,n=t,t=void 0),e=this.Lb(e,t);try{for(;e.step();)n(e.Tb(null,i))}finally{e.jb()}if(typeof r==`function`)return r()},a.prototype.Lb=function(e,t){e=zt(e);try{It(u),this.handleError(ee(this.db,e,-1,u,0))}finally{P(e)}if(e=Lt(u,`i32`),e===0)throw`Nothing to prepare`;var n=new r(e,this);return t!=null&&n.bind(t),this.Bb[e]=n},a.prototype.wc=function(e){return new i(e,this)},a.prototype.nc=function(){if(!this.db)throw Error(`Database closed`);var e=this.filename+`_export`;gt(e,[]);var t=0,n=0;try{var r=E(e).node,i=null,a=r.Qa.write;r.Qa=Object.create(r.Qa),r.Qa.write=function(e,t,n,o,s){return i===null?a(e,t,n,o,s):(r.Ua.set(t.subarray(n,n+o),s),r.Wa=Math.max(r.Wa,s+o),o)};var o=f(e,u);if(t=Lt(u,`i32`),o!==0||(n=m(t,`main`,this.db,`main`),n===0))throw Error(se(t));if(o=h(n,0),o===0){var s=this.exec(`PRAGMA main.page_count; PRAGMA main.page_size`);i=new Uint8Array(s[0].values[0][0]*s[1].values[0][0]),r.Ua=i,o=h(n,-1)}if(o===5||o===6)throw Error(`Unable to export: SQLite is busy or locked. Finish active write transactions before exporting.`);if(o!==101||(o=g(n),n=0,o!==0)||(o=p(t),o!==0))throw Error(se(t));return t=0,i=new Uint8Array(r.Ua.buffer,r.Ua.byteOffset,r.Wa),i.length>0&&(i[18]=1,i[19]=1),i}finally{n!==0&&g(n),t!==0&&p(t),at(`/`+e)}},a.prototype.close=function(){this.db!==null&&(Object.values(this.Bb).forEach(function(e){e.jb()}),this.ab.forEach(c),this.ab.clear(),this.lb&&=(Ht(this.lb),void 0),this.handleError(p(this.db)),at(`/`+this.filename),this.db=null)},a.prototype.handleError=function(e){if(e===0)return null;throw e=se(this.db),Error(e)},a.prototype.sc=function(){return v(this.db)},a.prototype.jc=function(r,i){var a=s(r,i.length);this.ab.has(a)&&(c(this.ab.get(a)),this.ab.delete(a));var o=Gt(function(r,a,o){a=n(a,o);try{var s=i.apply(null,a)}catch(t){e(r,t);return}t(r,s)},`viii`);return this.ab.set(a,[o]),this.handleError(be(this.db,r,i.length,1,0,o,0,0,0)),this},a.prototype.hc=function(r,i){function a(e){return d.has(e)||d.set(e,o()),d.get(e)}var o=i.init||function(){return null},l=i.finalize||function(e){return e},u=i.step;if(!u)throw`An aggregate function must have a step function in `+r;var d=new Map;i=s(r,u.length-1),this.ab.has(i)&&(c(this.ab.get(i)),this.ab.delete(i));var f=Gt(function(t,r,i){var o=je(t,1),s=a(o);r=n(r,i),s=[s].concat(r);try{d.set(o,u.apply(null,s))}catch(n){d.delete(o),e(t,n)}},`viii`),p=Gt(function(n){var r=je(n,1);try{var i=l(a(r))}catch(t){d.delete(r),e(n,t);return}t(n,i),d.delete(r)},`vi`);return this.ab.set(i,[f,p]),this.handleError(be(this.db,r,u.length-1,1,0,0,f,p,0)),this},a.prototype.Dc=function(e){return this.lb&&=(Ne(this.db,0,0),Ht(this.lb),void 0),e&&(this.lb=Gt(function(t,n,r,i,a){switch(n){case 18:t=`insert`;break;case 23:t=`update`;break;case 9:t=`delete`;break;default:throw`unknown operationCode in updateHook callback: `+n}if(r=S(r),i=S(i),a>2**53-1)throw`rowId too big to fit inside a Number`;e(t,r,i,Number(a))},`viiiij`),Ne(this.db,this.lb,0)),this},r.prototype.bind=r.prototype.bind,r.prototype.step=r.prototype.step,r.prototype.get=r.prototype.get,r.prototype.getColumnNames=r.prototype.Ib,r.prototype.getAsObject=r.prototype.Tb,r.prototype.getSQL=r.prototype.tc,r.prototype.getNormalizedSQL=r.prototype.qc,r.prototype.run=r.prototype.run,r.prototype.reset=r.prototype.reset,r.prototype.freemem=r.prototype.Hb,r.prototype.free=r.prototype.jb,i.prototype.next=i.prototype.next,i.prototype.getRemainingSQL=i.prototype.rc,a.prototype.run=a.prototype.run,a.prototype.exec=a.prototype.exec,a.prototype.each=a.prototype.lc,a.prototype.prepare=a.prototype.Lb,a.prototype.iterateStatements=a.prototype.wc,a.prototype.export=a.prototype.nc,a.prototype.close=a.prototype.close,a.prototype.handleError=a.prototype.handleError,a.prototype.getRowsModified=a.prototype.sc,a.prototype.create_function=a.prototype.jc,a.prototype.create_aggregate=a.prototype.hc,a.prototype.updateHook=a.prototype.Dc,o.Database=a};var l=`./this.program`,u=globalThis.document?.currentScript?.src;c&&(u=self.location.href);var d=``,f,p;if(s||c){try{d=new URL(`.`,u).href}catch{}c&&(p=e=>{var t=new XMLHttpRequest;return t.open(`GET`,e,!1),t.responseType=`arraybuffer`,t.send(null),new Uint8Array(t.response)}),f=async e=>{if(e=await fetch(e,{credentials:`same-origin`}),e.ok)return e.arrayBuffer();throw Error(e.status+` : `+e.url)}}var m=console.log.bind(console),h=console.error.bind(console),g,_=!1,v;function y(){if(!oe?.buffer?.resizable){var e=$t.buffer;oe=new Int8Array(e),Ct=new Int16Array(e),ue=new Uint8Array(e),vt=new Int32Array(e),M=new Uint32Array(e),Pt=new Float32Array(e),Ft=new Float64Array(e),yt=new BigInt64Array(e)}}function b(){var e=o.preRun;for(e&&(typeof e==`function`&&(e=[e]),ce.push(...e)),e=ce;e.length>0;)e.shift()(o)}function ee(){var e=o.postRun;for(e&&(typeof e==`function`&&(e=[e]),se.push(...e)),e=se;e.length>0;)e.shift()(o)}function x(e){throw o.onAbort?.(e),e=`Aborted(${e})`,h(e),_=!0,new WebAssembly.RuntimeError(e+`. Build with -sASSERTIONS for more info.`)}var te;async function ne(e){if(!g)try{return await f(e)}catch{}if(e==te&&g)e=new Uint8Array(g);else if(p)e=p(e);else throw`both async and sync fetching of the wasm failed`;return e}async function re(e,t){try{var n=await ne(e);return await WebAssembly.instantiate(n,t)}catch(e){h(`failed to asynchronously prepare wasm: ${e}`),x(e)}}async function ie(e){var t=te;if(!g)try{var n=fetch(t,{credentials:`same-origin`});return await WebAssembly.instantiateStreaming(n,e)}catch(e){h(`wasm streaming compile failed: ${e}`),h(`falling back to ArrayBuffer instantiation`)}return re(t,e)}class ae{name=`ExitStatus`;constructor(e){this.message=`Program terminated with exit(${e})`,this.status=e}}var oe,se=[],ce=[],le=!0,ue,de=new TextDecoder,fe=(e,t,n,r)=>{if(n=t+n,r)return n;for(;e[t]&&!(t>=n);)++t;return t},S=(e,t,n)=>e?de.decode(ue.subarray(e,fe(ue,e,t,n))):``,pe=(e,t)=>{for(var n=0,r=e.length-1;r>=0;r--){var i=e[r];i===`.`?e.splice(r,1):i===`..`?(e.splice(r,1),n++):n&&(e.splice(r,1),n--)}if(t)for(;n;n--)e.unshift(`..`);return e},me=e=>{var t=e.charAt(0)===`/`,n=e.slice(-1)===`/`;return(e=pe(e.split(`/`).filter(e=>!!e),!t).join(`/`))||t||(e=`.`),e&&n&&(e+=`/`),(t?`/`:``)+e},he=e=>{var t=/^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/.exec(e).slice(1);return e=t[0],t=t[1],!e&&!t?`.`:(t&&=t.slice(0,-1),e+t)},ge=e=>e&&e.match(/([^\/]+|\/)\/*$/)[1],_e=(...e)=>{for(var t=``,n=!1,r=e.length-1;r>=-1&&!n;r--){if(n=r>=0?e[r]:`/`,typeof n!=`string`)throw TypeError(`Arguments to path.resolve must be strings`);if(!n)return``;t=n+`/`+t,n=n.charAt(0)===`/`}return t=pe(t.split(`/`).filter(e=>!!e),!n).join(`/`),(n?`/`:``)+t||`.`},ve=e=>{for(var t=0,n=0;n<e.length;++n){var r=e.codePointAt(n);r<=127?t++:r<=2047?t+=2:r<=65535?t+=3:(t+=4,n++)}return t},ye=(e,t,n,r)=>{if(!(r>0))return 0;var i=n;r=n+r-1;for(var a=0;a<e.length;++a){var o=e.codePointAt(a);if(o<=127){if(n>=r)break;t[n++]=o}else if(o<=2047){if(n+1>=r)break;t[n++]=192|o>>6,t[n++]=128|o&63}else if(o<=65535){if(n+2>=r)break;t[n++]=224|o>>12,t[n++]=128|o>>6&63,t[n++]=128|o&63}else{if(n+3>=r)break;t[n++]=240|o>>18,t[n++]=128|o>>12&63,t[n++]=128|o>>6&63,t[n++]=128|o&63,a++}}return t[n]=0,n-i},be=e=>{var t=Array(ve(e)+1);return e=ye(e,t,0,t.length),t.length=e,t},xe=(e,t)=>{var n=0;return e&&(n|=365),t&&(n|=146),n},C={cb:null,hb(){return C.createNode(null,`/`,16895,0)},createNode(e,t,n,r){if((n&61440)==24576||(n&61440)==4096)throw new w(63);return C.cb||={dir:{node:{$a:C.Ra.$a,eb:C.Ra.eb,rb:C.Ra.rb,wb:C.Ra.wb,Zb:C.Ra.Zb,Db:C.Ra.Db,Ab:C.Ra.Ab,Nb:C.Ra.Nb,Cb:C.Ra.Cb},stream:{bb:C.Qa.bb}},file:{node:{$a:C.Ra.$a,eb:C.Ra.eb},stream:{bb:C.Qa.bb,read:C.Qa.read,write:C.Qa.write,xb:C.Qa.xb,yb:C.Qa.yb}},link:{node:{$a:C.Ra.$a,eb:C.Ra.eb,kb:C.Ra.kb},stream:{}},Rb:{node:{$a:C.Ra.$a,eb:C.Ra.eb},stream:A}},n=We(e,t,n,r),Ge(n.mode)?(n.Ra=C.cb.dir.node,n.Qa=C.cb.dir.stream,n.Ua={}):(n.mode&61440)==32768?(n.Ra=C.cb.file.node,n.Qa=C.cb.file.stream,n.Wa=0,n.Ua=C.mc??=new Uint8Array):(n.mode&61440)==40960?(n.Ra=C.cb.link.node,n.Qa=C.cb.link.stream):(n.mode&61440)==8192&&(n.Ra=C.cb.Rb.node,n.Qa=C.cb.Rb.stream),n.gb=n.Ya=n.Xa=Date.now(),e&&(e.Ua[t]=n,e.gb=e.Ya=e.Xa=n.gb),n},Ra:{$a(e){var t={};return t.kc=(e.mode&61440)==8192?e.id:1,t.vc=e.id,t.mode=e.mode,t.yc=1,t.uid=0,t.uc=0,t.sb=e.sb,t.size=Ge(e.mode)?4096:(e.mode&61440)==32768?e.Wa:(e.mode&61440)==40960?e.link.length:0,t.gb=new Date(e.gb),t.Ya=new Date(e.Ya),t.Xa=new Date(e.Xa),t.ec=4096,t.fc=Math.ceil(t.size/t.ec),t},eb(e,t){for(var n of[`mode`,`atime`,`mtime`,`ctime`])t[n]!=null&&(e[n]=t[n]);t.size!==void 0&&(t=t.size,e.Wa!=t&&(n=e.Ua,e.Ua=new Uint8Array(t),e.Ua.set(n.subarray(0,Math.min(t,e.Wa))),e.Wa=t))},rb(){throw C.Fb||(C.Fb=new w(44),C.Fb.stack=`<generic error, no stack>`),C.Fb},wb(e,t,n,r){return C.createNode(e,t,n,r)},Zb(e,t,n){try{var r=Ue(t,n)}catch{}if(r&&Ge(e.mode))for(var i in r.Ua)throw new w(55);delete e.parent.Ua[e.name],t.Ua[n]=e,e.name=n,t.Xa=t.Ya=e.parent.Xa=e.parent.Ya=Date.now()},Db(e,t){delete e.Ua[t],e.Xa=e.Ya=Date.now()},Ab(e,t){var n=Ue(e,t),r;for(r in n.Ua)throw new w(55);delete e.Ua[t],e.Xa=e.Ya=Date.now()},Nb(e){return[`.`,`..`,...Object.keys(e.Ua)]},Cb(e,t,n){return e=C.createNode(e,t,41471,0),e.link=n,e},kb(e){if((e.mode&61440)!=40960)throw new w(28);return e.link}},Qa:{read(e,t,n,r,i){return i>=e.node.Wa?0:(r=Math.min(e.node.Wa-i,r),t.set(e.node.Ua.subarray(i,i+r),n),r)},write(e,t,n,r,i,a){if(t.buffer===oe.buffer&&(a=!1),!r)return 0;if(e=e.node,e.Ya=e.Xa=Date.now(),a)e.Ua=t.subarray(n,n+r),e.Wa=r;else if(e.Wa||i){a=i+r;var o=e.Ua.length;o>=a||(a=Math.max(a,o*(o<1048576?2:1.125)>>>0),o&&(a=Math.max(a,256)),o=e.Ua.subarray(0,e.Wa),e.Ua=new Uint8Array(a),e.Ua.set(o)),e.Ua.set(t.subarray(n,n+r),i),e.Wa=Math.max(e.Wa,i+r)}else e.Ua=t.slice(n,n+r),e.Wa=r;return r},bb(e,t,n){if(n===1?t+=e.position:n===2&&(e.node.mode&61440)==32768&&(t+=e.node.Wa),t<0)throw new w(28);return t},xb(e,t,n,r,i){if((e.node.mode&61440)!=32768)throw new w(43);if(e=e.node.Ua,i&2||e.buffer!==oe.buffer){i=!0,r=Math.ceil(t/65536)*65536;var a=Jt(65536,r);if(a&&ue.fill(0,a,a+r),r=a,!r)throw new w(48);e&&((n>0||n+t<e.length)&&(e=e.subarray?e.subarray(n,n+t):e.slice(n,n+t)),oe.set(e,r))}else i=!1,r=e.byteOffset;return{Bc:r,$b:i}},yb(e,t,n,r){return C.Qa.write(e,t,0,r,n,!1),0}}},Se=[],Ce=e=>{var t=fe(e,0);return de.decode(e.buffer?e.subarray(0,t):new Uint8Array(e.slice(0,t)))},we=[];function Te(e,t){we[e]={input:[],output:[],pb:t},Ze(e,Ee)}var Ee={open(e){var t=we[e.node.sb];if(!t)throw new w(43);e.Za=t,e.seekable=!1},close(e){e.Za.pb.qb(e.Za)},qb(e){e.Za.pb.qb(e.Za)},read(e,t,n,r){if(!e.Za||!e.Za.pb.Wb)throw new w(60);for(var i=0,a=0;a<r;a++){try{var o=e.Za.pb.Wb(e.Za)}catch{throw new w(29)}if(o===void 0&&!i)throw new w(6);if(o==null||(i++,t[n+a]=o,o===10))break}return i&&(e.node.gb=Date.now()),i},write(e,t,n,r){if(!e.Za||!e.Za.pb.Mb)throw new w(60);try{for(var i=0;i<r;i++)e.Za.pb.Mb(e.Za,t[n+i])}catch{throw new w(29)}return r&&(e.node.Ya=e.node.Xa=Date.now()),i}},De={Wb(){a:{if(!Se.length){var e=null;if(globalThis.window?.prompt&&(e=window.prompt(`Input: `),e!==null&&(e+=`
`)),!e){e=null;break a}Se=be(e)}e=Se.shift()}return e},Mb(e,t){t===null||t===10?(m(Ce(e.output)),e.output=[]):t!=0&&e.output.push(t)},qb(e){e.output?.length>0&&(m(Ce(e.output)),e.output=[])},Kc(){return{Gc:25856,Ic:5,Fc:191,Hc:35387,Ec:[3,28,127,21,4,0,1,0,17,19,26,0,18,15,23,22,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]}},Lc(){return 0},Mc(){return[24,80]}},Oe={Mb(e,t){t===null||t===10?(h(Ce(e.output)),e.output=[]):t!=0&&e.output.push(t)},qb(e){e.output?.length>0&&(h(Ce(e.output)),e.output=[])}},ke=()=>e=>(crypto.getRandomValues(e),0),Ae=e=>(Ae=ke())(e),je=null,Me={},Ne=[],Pe=1,Fe=[],Ie=!1,Le=!0,Re={},w=class{name=`ErrnoError`;constructor(e){this.Sa=e}},T=class{shared={};node=null;get flags(){return this.shared.flags}set flags(e){this.shared.flags=e}get position(){return this.shared.position}set position(e){this.shared.position=e}},ze=class{Ra={};Qa={};nb=null;constructor(e,t,n,r){e||=this,this.parent=e,this.hb=e.hb,this.id=Pe++,this.name=t,this.mode=n,this.sb=r,this.gb=this.Ya=this.Xa=Date.now()}get read(){return(this.mode&365)==365}set read(e){e?this.mode|=365:this.mode&=-366}get write(){return(this.mode&146)==146}set write(e){e?this.mode|=146:this.mode&=-147}Ac(){}};function E(e,t={}){if(!e)throw new w(44);t.Gb??=!0,e.charAt(0)===`/`||(e=`//`+e);var n=0;a:for(;n<40;n++){e=e.split(`/`).filter(e=>!!e);for(var r=je,i=`/`,a=0;a<e.length;a++){var o=a===e.length-1;if(o&&t.parent)break;if(e[a]!==`.`){if(e[a]===`..`){if(i=he(i),r===r.parent){e=i+`/`+e.slice(a+1).join(`/`),n--;continue a}r=r.parent}else{i=me(i+`/`+e[a]);try{r=Ue(r,e[a])}catch(e){if(e?.Sa===44&&o&&t.zc)return{path:i};throw e}if(!r.nb||o&&!t.Gb||(r=r.nb.root),(r.mode&61440)==40960&&(!o||t.mb)){if(!r.Ra.kb)throw new w(52);r=r.Ra.kb(r),r.charAt(0)===`/`||(r=he(i)+`/`+r),e=r+`/`+e.slice(a+1).join(`/`);continue a}}}}return{path:i,node:r}}throw new w(32)}function Be(e){for(var t;;){if(e===e.parent)return e=e.hb.Yb,t?e[e.length-1]===`/`?e+t:`${e}/${t}`:e;t=t?`${e.name}/${t}`:e.name,e=e.parent}}function Ve(e,t){for(var n=0,r=0;r<t.length;r++)n=(n<<5)-n+t.charCodeAt(r)|0;return(e+n>>>0)%Fe.length}function He(e){var t=Ve(e.parent.id,e.name);if(Fe[t]===e)Fe[t]=e.ob;else for(t=Fe[t];t;){if(t.ob===e){t.ob=e.ob;break}t=t.ob}}function Ue(e,t){var n=Ge(e.mode)?(n=Ke(e,`x`))?n:e.Ra.rb?0:2:54;if(n)throw new w(n);for(n=Fe[Ve(e.id,t)];n;n=n.ob){var r=n.name;if(n.parent.id===e.id&&r===t)return n}return e.Ra.rb(e,t)}function We(e,t,n,r){return e=new ze(e,t,n,r),t=Ve(e.parent.id,e.name),e.ob=Fe[t],Fe[t]=e}function Ge(e){return(e&61440)==16384}function Ke(e,t){return Le?0:t.includes(`r`)&&!(e.mode&292)||t.includes(`w`)&&!(e.mode&146)||t.includes(`x`)&&!(e.mode&73)?2:0}function D(e,t){if(!Ge(e.mode))return 54;try{return Ue(e,t),20}catch{}return Ke(e,`wx`)}function qe(e,t,n){try{var r=Ue(e,t)}catch(e){return e.Sa}if(e=Ke(e,`wx`))return e;if(n){if(!Ge(r.mode))return 54;if(r===r.parent||Be(r)===`/`)return 10}else if(Ge(r.mode))return 31;return 0}function Je(e){if(!e)throw new w(63);return e}function Ye(e){if(e=Ne[e],!e)throw new w(8);return e}function Xe(e,t=-1){if(e=Object.assign(new T,e),t==-1)a:{for(t=0;t<=4096;t++)if(!Ne[t])break a;throw new w(33)}return e.ib=t,Ne[t]=e}function O(e,t=-1){return e=Xe(e,t),e.Qa?.Jc?.(e),e}function k(e,t,n){var r=e?.Qa.eb;e=r?e:t,r??=t.Ra.eb,Je(r);try{r(e,n)}catch(e){throw e instanceof RangeError?new w(22):e}}var A={open(e){e.Qa=Me[e.node.sb].Qa,e.Qa.open?.(e)},bb(){throw new w(70)}};function Ze(e,t){Me[e]={Qa:t}}function Qe(e,t){var n=t===`/`;if(n&&je)throw new w(10);if(!n&&t){var r=E(t,{Gb:!1});if(t=r.path,r=r.node,r.nb)throw new w(10);if(!Ge(r.mode))throw new w(54)}t={type:e,Nc:{},Yb:t,xc:[]},e=e.hb(t),e.hb=t,t.root=e,n?je=e:r&&(r.nb=t,r.hb&&r.hb.xc.push(t))}function $e(e,t,n){var r=E(e,{parent:!0}).node;if(e=ge(e),!e)throw new w(28);if(e===`.`||e===`..`)throw new w(20);var i=D(r,e);if(i)throw new w(i);if(!r.Ra.wb)throw new w(63);return r.Ra.wb(r,e,t,n)}function et(e,t=438){return $e(e,t&4095|32768,0)}function tt(e,t=511){return $e(e,t&1023|16384,0)}function nt(e,t,n){n===void 0&&(n=t,t=438),$e(e,t|8192,n)}function rt(e,t){if(!_e(e))throw new w(44);var n=E(t,{parent:!0}).node;if(!n)throw new w(44);t=ge(t);var r=D(n,t);if(r)throw new w(r);if(!n.Ra.Cb)throw new w(63);n.Ra.Cb(n,t,e)}function it(e){var t=E(e,{parent:!0}).node;e=ge(e);var n=Ue(t,e),r=qe(t,e,!0);if(r)throw new w(r);if(!t.Ra.Ab)throw new w(63);if(n.nb)throw new w(10);t.Ra.Ab(t,e),He(n)}function at(e){var t=E(e,{parent:!0}).node;if(!t)throw new w(44);e=ge(e);var n=Ue(t,e),r=qe(t,e,!1);if(r)throw new w(r);if(!t.Ra.Db)throw new w(63);if(n.nb)throw new w(10);t.Ra.Db(t,e),He(n)}function ot(e,t=!1){return e=E(e,{mb:!t}).node,Je(e.Ra.$a)(e)}function st(e,t,n){k(e,t,{mode:n&4095|t.mode&-4096,Xa:Date.now(),Sb:!1})}function ct(e,t){e=typeof e==`string`?E(e,{mb:!0}).node:e,st(null,e,t)}function lt(e,t,n){if(Ge(t.mode))throw new w(31);if((t.mode&61440)!=32768)throw new w(28);var r=Ke(t,`w`);if(r)throw new w(r);k(e,t,{size:n,timestamp:Date.now()})}function ut(e,t,n,r=!1){e=E(e,{mb:!r}),k(null,e.node,{gb:t,Ya:n,Sb:r})}function dt(e,t,n=438){if(e===``)throw new w(44);if(typeof t==`string`){var r={r:0,"r+":2,w:577,"w+":578,a:1089,"a+":1090}[t];if(r===void 0)throw Error(`Unknown file open mode: ${t}`);t=r}if(n=t&64?n&4095|32768:0,typeof e==`object`)r=e;else{var i=e.endsWith(`/`);e=E(e,{mb:!(t&131072),zc:!0}),r=e.node,e=e.path}var a=!1;if(t&64){if(r){if(t&128)throw new w(20)}else{if(i)throw new w(31);r=$e(e,n|511,0),a=!0}}if(!r)throw new w(44);if((r.mode&61440)==8192&&(t&=-513),t&65536&&!Ge(r.mode))throw new w(54);if(!a&&(r?(r.mode&61440)==40960?i=32:(i=[`r`,`w`,`rw`][t&3],t&512&&(i+=`w`),i=Ge(r.mode)&&(i!==`r`||t&576)?31:Ke(r,i)):i=44,i))throw new w(i);return t&512&&!a&&(i=r,i=typeof i==`string`?E(i,{mb:!0}).node:i,lt(null,i,0)),t&=-131713,i=Xe({node:r,path:Be(r),flags:t,seekable:!0,position:0,Qa:r.Qa,Cc:[],error:!1}),i.Qa.open&&i.Qa.open(i),a&&ct(r,n&511),!o.logReadFiles||t&1||e in Re||(Re[e]=1,h(`read file: ${e}`)),i}function ft(e){if(e.ib===null)throw new w(8);e.Jb&&=null,e.node?.Ac();try{e.Qa.close&&e.Qa.close(e)}catch(e){throw e}finally{Ne[e.ib]=null}e.ib=null}function pt(e,t,n){if(e.ib===null)throw new w(8);if(!e.seekable||!e.Qa.bb)throw new w(70);if(n!=0&&n!=1&&n!=2)throw new w(28);e.position=e.Qa.bb(e,t,n),e.Cc=[]}function mt(e,t,n,r,i){if(r<0||i<0)throw new w(28);if(e.ib===null||!(e.flags&2097155))throw new w(8);if(Ge(e.node.mode))throw new w(31);if(!e.Qa.write)throw new w(28);e.seekable&&e.flags&1024&&pt(e,0,2);var a=i!==void 0;if(!a)i=e.position;else if(!e.seekable)throw new w(70);return t=e.Qa.write(e,t,n,r,i,void 0),a||(e.position+=t),t}function ht(){var e,t,n;Ie=!0,e??=o.stdin,t??=o.stdout,n??=o.stderr,e?_t(`stdin`,e):rt(`/dev/tty`,`/dev/stdin`),t?_t(`stdout`,null,t):rt(`/dev/tty`,`/dev/stdout`),n?_t(`stderr`,null,n):rt(`/dev/tty1`,`/dev/stderr`),dt(`/dev/stdin`,0),dt(`/dev/stdout`,1),dt(`/dev/stderr`,1)}function gt(e,t){var n=`/`,r=e;n&&(n=typeof n==`string`?n:Be(n),r=e?me(n+`/`+e):n),e=xe(!0,!0),r=et(r,e),t&&(typeof t==`string`&&(t=be(t)),t.subarray||(t=new Uint8Array(t)),ct(r,e|146),n=dt(r,577),mt(n,t,0,t.length,0),ft(n),ct(r,e))}function _t(e,t,n){e=me(`/dev/`+e);var r=xe(!!t,!!n);_t.Xb??=64;var i=_t.Xb++<<8;Ze(i,{open(e){e.seekable=!1},close(){n?.buffer?.length&&n(10)},read(e,n,r,i){for(var a=0,o=0;o<i;o++){try{var s=t()}catch{throw new w(29)}if(s===void 0&&!a)throw new w(6);if(s==null)break;a++,n[r+o]=s}return a&&(e.node.gb=Date.now()),a},write(e,t,r,i){for(var a=0;a<i;a++)try{n(t[r+a])}catch{throw new w(29)}return i&&(e.node.Ya=e.node.Xa=Date.now()),a}}),nt(e,r,i)}var j={},vt,yt,M;function bt(e,t,n=!1){if(t.charAt(0)===`/`)return t;if(e=e===-100?`/`:Ye(e).path,t.length==0){if(!n)throw new w(44);return e}return e+`/`+t}function xt(e,t){M[e>>2]=t.kc,M[e+4>>2]=t.mode,M[e+8>>2]=t.yc,M[e+12>>2]=t.uid,M[e+16>>2]=t.uc,M[e+20>>2]=t.sb,yt[e+24>>3]=BigInt(t.size),vt[e+32>>2]=4096,vt[e+36>>2]=t.fc;var n=t.gb.getTime(),r=t.Ya.getTime(),i=t.Xa.getTime();return yt[e+40>>3]=BigInt(Math.floor(n/1e3)),M[e+48>>2]=n%1e3*1e3*1e3,yt[e+56>>3]=BigInt(Math.floor(r/1e3)),M[e+64>>2]=r%1e3*1e3*1e3,yt[e+72>>3]=BigInt(Math.floor(i/1e3)),M[e+80>>2]=i%1e3*1e3*1e3,yt[e+88>>3]=BigInt(t.vc),0}var St=void 0,Ct,wt=()=>{var e=vt[St>>2];return St+=4,e},Tt=0,Et=[0,31,60,91,121,152,182,213,244,274,305,335],Dt=[0,31,59,90,120,151,181,212,243,273,304,334],Ot=e=>{if(!(e instanceof ae||e==`unwind`))throw e},kt=e=>{throw v=e,le||Tt>0||(o.onExit?.(e),_=!0),new ae(e)},At={},jt={},Mt=()=>{if(!Nt){var e={USER:`web_user`,LOGNAME:`web_user`,PATH:`/`,PWD:`/`,HOME:`/home/web_user`,LANG:(globalThis.navigator?.language??`C`).replace(`-`,`_`)+`.UTF-8`,_:l},t;for(t in jt)jt[t]===void 0?delete e[t]:e[t]=jt[t];var n=[];for(t in e)n.push(`${t}=${e[t]}`);Nt=n}return Nt},Nt,Pt,Ft;function It(e){var t=`i32`;switch(t.endsWith(`*`)&&(t=`*`),t){case`i1`:oe[e]=0;break;case`i8`:oe[e]=0;break;case`i16`:Ct[e>>1]=0;break;case`i32`:vt[e>>2]=0;break;case`i64`:yt[e>>3]=BigInt(0);break;case`float`:Pt[e>>2]=0;break;case`double`:Ft[e>>3]=0;break;case`*`:M[e>>2]=0;break;default:x(`invalid type for setValue: ${t}`)}}function Lt(e,t=`i8`){switch(t.endsWith(`*`)&&(t=`*`),t){case`i1`:return oe[e];case`i8`:return oe[e];case`i16`:return Ct[e>>1];case`i32`:return vt[e>>2];case`i64`:return yt[e>>3];case`float`:return Pt[e>>2];case`double`:return Ft[e>>3];case`*`:return M[e>>2];default:x(`invalid type for getValue: ${t}`)}}var Rt=(e,t,n,r)=>{var i={string:e=>{var t=0;if(e!=null&&e!==0){t=ve(e)+1;var n=Zt(t);ye(e,ue,n,t),t=n}return t},array:e=>{var t=Zt(e.length);return oe.set(e,t),t}};e=o[`_`+e];var a=[],s=0;if(r)for(var c=0;c<r.length;c++){var l=i[n[c]];l?(s||=Qt(),a[c]=l(r[c])):a[c]=r[c]}return n=e(...a),n=function(e){return s&&Xt(s),t===`string`?S(e):t===`boolean`?!!e:e}(n)},zt=e=>{var t=ve(e)+1,n=qt(t);return n&&ye(e,ue,n,t),n},Bt=[],Vt,Ht=e=>{Vt.delete(en.get(e)),en.set(e,null),Bt.push(e)},Ut=e=>{var t=e.length;return[t%128|128,t>>7,...e]},Wt={i:127,p:127,j:126,f:125,d:124,e:111},N=e=>Ut(Array.from(e,e=>Wt[e])),Gt=(e,t)=>{if(!Vt){Vt=new WeakMap;var n=en.length;if(Vt)for(var r=0;r<0+n;r++){var i=en.get(r);i&&Vt.set(i,r)}}if(n=Vt.get(e)||0)return n;n=Bt.length?Bt.pop():en.grow(1);try{en.set(n,e)}catch(r){if(!(r instanceof TypeError))throw r;t=Uint8Array.of(0,97,115,109,1,0,0,0,1,...Ut([1,96,...N(t.slice(1)),...N(t[0]===`v`?``:t[0])]),2,7,1,1,101,1,102,0,0,7,5,1,1,102,0,0),t=new WebAssembly.Module(t),t=new WebAssembly.Instance(t,{e:{f:e}}).exports.f,en.set(n,t)}return Vt.set(e,n),n};Fe.length=4096,Qe(C,`/`),tt(`/tmp`),tt(`/home`),tt(`/home/web_user`),(function(){tt(`/dev`),Ze(259,{read:()=>0,write:(e,t,n,r)=>r,bb:()=>0}),nt(`/dev/null`,259),Te(1280,De),Te(1536,Oe),nt(`/dev/tty`,1280),nt(`/dev/tty1`,1536);var e=new Uint8Array(1024),t=0,n=()=>(t||=(Ae(e),e.byteLength),e[--t]);_t(`random`,n),_t(`urandom`,n),tt(`/dev/shm`),tt(`/dev/shm/tmp`)})(),(function(){tt(`/proc`);var e=tt(`/proc/self`);tt(`/proc/self/fd`),Qe({hb(){var t=We(e,`fd`,16895,73);return t.Qa={bb:C.Qa.bb},t.Ra={rb(e,t){e=+t;var n=Ye(e);return e={parent:null,hb:{Yb:`fake`},Ra:{kb:()=>n.path},id:e+1},e.parent=e},Nb(){return Array.from(Ne.entries()).filter(([,e])=>e).map(([e])=>e.toString())}},t}},`/proc/self/fd`)})(),o.noExitRuntime&&(le=o.noExitRuntime),o.print&&(m=o.print),o.printErr&&(h=o.printErr),o.wasmBinary&&(g=o.wasmBinary),o.thisProgram&&(l=o.thisProgram);var Kt=o.preInit;if(Kt)for(typeof Kt==`function`&&(o.preInit=Kt=[Kt]);Kt.length>0;)Kt.shift()();o.stackSave=()=>Qt(),o.stackRestore=e=>Xt(e),o.stackAlloc=e=>Zt(e),o.cwrap=(e,t,n,r)=>{var i=!n||n.every(e=>e===`number`||e===`boolean`);return t!==`string`&&i&&!r?o[`_`+e]:(...r)=>Rt(e,t,n,r)},o.addFunction=Gt,o.removeFunction=Ht,o.UTF8ToString=S,o.lengthBytesUTF8=ve,o.stringToNewUTF8=zt,o.writeArrayToMemory=(e,t)=>{oe.set(e,t)};var qt,P,Jt,Yt,Xt,Zt,Qt,$t,en,tn={a:(e,t,n,r)=>x(`Assertion failed: ${S(e)}, at: `+[t?S(t):`unknown filename`,n,r?S(r):`unknown function`]),i:function(e,t){try{return e=S(e),ct(e,t),0}catch(e){if(j===void 0||e.name!==`ErrnoError`)throw e;return-e.Sa}},D:function(e,t,n){try{if(t=S(t),t=bt(e,t),n&-8)return-28;var r=E(t,{mb:!0}).node;return r?(e=``,n&4&&(e+=`r`),n&2&&(e+=`w`),n&1&&(e+=`x`),e&&Ke(r,e)?-2:0):-44}catch(e){if(j===void 0||e.name!==`ErrnoError`)throw e;return-e.Sa}},j:function(e,t){try{var n=Ye(e);return st(n,n.node,t),0}catch(e){if(j===void 0||e.name!==`ErrnoError`)throw e;return-e.Sa}},h:function(e){try{var t=Ye(e);return k(t,t.node,{timestamp:Date.now(),Sb:!1}),0}catch(e){if(j===void 0||e.name!==`ErrnoError`)throw e;return-e.Sa}},b:function(e,t,n){St=n;try{var r=Ye(e);switch(t){case 0:var i=wt();if(i<0)break;for(;Ne[i];)i++;return O(r,i).ib;case 1:case 2:return 0;case 3:return r.flags;case 4:return i=wt(),r.flags=r.flags&-289793|i&289792,0;case 12:return i=wt(),Ct[i+0>>1]=2,0;case 13:case 14:return 0}return-28}catch(e){if(j===void 0||e.name!==`ErrnoError`)throw e;return-e.Sa}},g:function(e,t){try{var n=Ye(e),r=n.node,i=n.Qa.$a;return e=i?n:r,i??=r.Ra.$a,Je(i),xt(t,i(e))}catch(e){if(j===void 0||e.name!==`ErrnoError`)throw e;return-e.Sa}},J:function(e,t){t=t<-9007199254740992||t>9007199254740992?NaN:Number(t);try{if(isNaN(t))return-22;var n=Ye(e);if(t<0||!(n.flags&2097155))throw new w(28);return lt(n,n.node,t),0}catch(e){if(j===void 0||e.name!==`ErrnoError`)throw e;return-e.Sa}},I:function(e,t){try{if(!t)return-28;var n=ve(`/`)+1;return t<n?-68:(ye(`/`,ue,e,t),n)}catch(e){if(j===void 0||e.name!==`ErrnoError`)throw e;return-e.Sa}},F:()=>0,M:function(e,t){try{return e=S(e),xt(t,ot(e,!0))}catch(e){if(j===void 0||e.name!==`ErrnoError`)throw e;return-e.Sa}},C:function(e,t,n){try{return t=S(t),t=bt(e,t),tt(t,n&-19),0}catch(e){if(j===void 0||e.name!==`ErrnoError`)throw e;return-e.Sa}},L:function(e,t,n,r){try{t=S(t);var i=r&256;return t=bt(e,t,r&4096),xt(n,i?ot(t,!0):ot(t))}catch(e){if(j===void 0||e.name!==`ErrnoError`)throw e;return-e.Sa}},x:function(e,t,n,r){St=r;try{t=S(t),t=bt(e,t);var i=r?wt():0;return n&64&&(i&=-19),dt(t,n,i).ib}catch(e){if(j===void 0||e.name!==`ErrnoError`)throw e;return-e.Sa}},s:function(e,t,n,r){try{if(t=S(t),t=bt(e,t),r<=0)return-28;var i=E(t).node;if(!i)throw new w(44);if(!i.Ra.kb)throw new w(28);var a=i.Ra.kb(i),o=Math.min(r,ve(a)),s=oe[n+o];return ye(a,ue,n,r+1),oe[n+o]=s,o}catch(e){if(j===void 0||e.name!==`ErrnoError`)throw e;return-e.Sa}},r:function(e){try{return e=S(e),it(e),0}catch(e){if(j===void 0||e.name!==`ErrnoError`)throw e;return-e.Sa}},N:function(e,t){try{return e=S(e),xt(t,ot(e))}catch(e){if(j===void 0||e.name!==`ErrnoError`)throw e;return-e.Sa}},o:function(e,t,n){try{if(t=S(t),t=bt(e,t),n){if(n===512)it(t);else return-28}else at(t);return 0}catch(e){if(j===void 0||e.name!==`ErrnoError`)throw e;return-e.Sa}},n:function(e,t,n,r){try{r&=256,t=S(t),t=bt(e,t,!0);var i=Date.now();if(n){function e(e){var t=vt[e+8>>2];return t==1073741823?i:t==1073741822?null:(M[e>>2]+vt[e+4>>2]*4294967296)*1e3+Math.floor(t/1e6)}var a=e(n),o=e(n+16)}else o=a=i;return(o??a)!==null&&ut(t,a,o,r),0}catch(e){if(j===void 0||e.name!==`ErrnoError`)throw e;return-e.Sa}},w:()=>x(``),v:()=>{le=!1,Tt=0},A:function(e,t){if(e=e<-9007199254740992||e>9007199254740992?NaN:Number(e),e=new Date(e*1e3),isNaN(e.getTime()))return 1;vt[t>>2]=e.getSeconds(),vt[t+4>>2]=e.getMinutes(),vt[t+8>>2]=e.getHours(),vt[t+12>>2]=e.getDate(),vt[t+16>>2]=e.getMonth(),vt[t+20>>2]=e.getFullYear()-1900,vt[t+24>>2]=e.getDay();var n=e.getFullYear();vt[t+28>>2]=(n%4!=0||n%100==0&&n%400!=0?Dt:Et)[e.getMonth()]+e.getDate()-1|0,vt[t+36>>2]=-(e.getTimezoneOffset()*60),n=new Date(e.getFullYear(),6,1).getTimezoneOffset();var r=new Date(e.getFullYear(),0,1).getTimezoneOffset();return vt[t+32>>2]=(n!=r&&e.getTimezoneOffset()==Math.min(r,n))|0,0},y:function(e,t,n,r,i,a,o){i=i<-9007199254740992||i>9007199254740992?NaN:Number(i);try{var s=Ye(r);if(t&2&&!(n&2)&&(s.flags&2097155)!=2||(s.flags&2097155)==1)throw new w(2);if(!s.Qa.xb)throw new w(43);if(!e)throw new w(28);var c=s.Qa.xb(s,e,i,t,n),l=c.Bc;return vt[a>>2]=c.$b,M[o>>2]=l,0}catch(e){if(j===void 0||e.name!==`ErrnoError`)throw e;return-e.Sa}},z:function(e,t,n,r,i,a){a=a<-9007199254740992||a>9007199254740992?NaN:Number(a);try{var o=Ye(i);if(n&2){if((o.node.mode&61440)!=32768)throw new w(43);r&2||o.Qa.yb&&o.Qa.yb(o,ue.subarray(e,e+t),a,t,r)}}catch(e){if(j===void 0||e.name!==`ErrnoError`)throw e;return-e.Sa}},k:(e,t)=>(At[e]&&(clearTimeout(At[e].id),delete At[e]),t&&(At[e]={id:setTimeout(()=>{delete At[e];var t=[e,performance.now()],n=Yt;if(!_)try{n(...t)}catch(e){Ot(e)}finally{if(!(le||Tt>0))try{v=t=v,kt(t)}catch(e){Ot(e)}}},t),Oc:t}),0),B:(e,t,n,r)=>{var i=new Date().getFullYear(),a=new Date(i,0,1).getTimezoneOffset();i=new Date(i,6,1).getTimezoneOffset(),M[e>>2]=Math.max(a,i)*60,vt[t>>2]=Number(a!=i),t=e=>{var t=Math.abs(e);return`UTC${e>=0?`-`:`+`}${String(Math.floor(t/60)).padStart(2,`0`)}${String(t%60).padStart(2,`0`)}`},e=t(a),t=t(i),i<a?(ye(e,ue,n,17),ye(t,ue,r,17)):(ye(e,ue,r,17),ye(t,ue,n,17))},d:()=>Date.now(),p:()=>2147483648,c:()=>performance.now(),l:e=>{var t=ue.length;if(e>>>=0,e>2147483648)return!1;for(var n=1;n<=4;n*=2){var r=t*(1+.2/n);r=Math.min(r,e+100663296);a:{r=(Math.min(2147483648,Math.ceil(Math.max(e,r)/65536)*65536)-$t.buffer.byteLength+65535)/65536|0;try{$t.grow(r),y();var i=1;break a}catch{}i=void 0}if(i)return!0}return!1},G:(e,t)=>{var n=0,r=0,i;for(i of Mt()){var a=t+n;M[e+r>>2]=a,n+=ye(i,ue,a,1/0)+1,r+=4}return 0},H:(e,t)=>{var n=Mt();M[e>>2]=n.length,e=0;for(var r of n)e+=ve(r)+1;return M[t>>2]=e,0},e:function(e){try{return ft(Ye(e)),0}catch(e){if(j===void 0||e.name!==`ErrnoError`)throw e;return e.Sa}},m:function(e,t){try{var n=Ye(e);return oe[t]=n.Za?2:Ge(n.mode)?3:(n.mode&61440)==40960?7:4,Ct[t+2>>1]=0,yt[t+8>>3]=BigInt(0),yt[t+16>>3]=BigInt(0),0}catch(e){if(j===void 0||e.name!==`ErrnoError`)throw e;return e.Sa}},t:function(e,t,n,r){try{a:{var i=Ye(e);e=t;for(var a,o=t=0;o<n;o++){var s=M[e>>2],c=M[e+4>>2];e+=8;try{var l=i,u=s,d=c,f=a,p=oe;if(d<0||f<0)throw new w(28);if(l.ib===null||(l.flags&2097155)==1)throw new w(8);if(Ge(l.node.mode))throw new w(31);if(!l.Qa.read)throw new w(28);var m=f!==void 0;if(!m)f=l.position;else if(!l.seekable)throw new w(70);var h=l.Qa.read(l,p,u,d,f);m||(l.position+=h);var g=h}catch(e){if(t>0&&e instanceof w&&(e.Sa==6||e.Sa==6))break;throw e}if(g<0){var _=-1;break a}if(t+=g,g<c)break;a!==void 0&&(a+=g)}_=t}return M[r>>2]=_,0}catch(e){if(j===void 0||e.name!==`ErrnoError`)throw e;return e.Sa}},E:function(e,t,n,r){t=t<-9007199254740992||t>9007199254740992?NaN:Number(t);try{if(isNaN(t))return 22;var i=Ye(e);return pt(i,t,n),yt[r>>3]=BigInt(i.position),i.Jb&&!t&&n===0&&(i.Jb=null),0}catch(e){if(j===void 0||e.name!==`ErrnoError`)throw e;return e.Sa}},K:function(e){try{var t=Ye(e);return t.Qa?.qb?.(t)}catch(e){if(j===void 0||e.name!==`ErrnoError`)throw e;return e.Sa}},q:function(e,t,n,r){try{var i=Ye(e);if(e=t,n==1)var a=mt(i,oe,M[e>>2],M[e+4>>2]);else{for(var o=t=0,s=e;o<n;o++,s+=8)t+=M[s+4>>2];var c=new Uint8Array(t);for(o=s=0;o<n;o++,e+=8){var l=M[e>>2],u=M[e+4>>2];c.set(ue.subarray(l,l+u),s),s+=u}a=mt(i,c,0,t)}return M[r>>2]=a,0}catch(e){if(j===void 0||e.name!==`ErrnoError`)throw e;return e.Sa}},u:kt,f:function(e){console.warn(`sql.js: legacy function `+S(e)+`() is deprecated and will be disabled by default in the next major version. Initialize with useOldExtensionFunctions: false to use native SQLite functions. See https://github.com/sql-js/sql.js/pull/647`)}};async function nn(){b();var e=o.setStatus;e&&(e(`Running...`),await new Promise(e=>setTimeout(e,1)),setTimeout(e,1,``)),_||(o.noFSInit||Ie||ht(),rn.P(),Le=!1,o.onRuntimeInitialized?.(),ee())}var rn;return(async function(){function e(e){return e=rn=e.exports,o._sqlite3_free=e.R,o._sqlite3_value_text=e.S,o._sqlite3_prepare_v2=e.T,o._sqlite3_step=e.U,o._sqlite3_reset=e.V,o._sqlite3_exec=e.W,o._sqlite3_finalize=e.X,o._sqlite3_column_name=e.Y,o._sqlite3_column_text=e.Z,o._sqlite3_column_type=e._,o._sqlite3_errmsg=e.$,o._sqlite3_backup_init=e.aa,o._sqlite3_backup_step=e.ba,o._sqlite3_backup_finish=e.ca,o._sqlite3_clear_bindings=e.da,o._sqlite3_value_blob=e.ea,o._sqlite3_value_bytes=e.fa,o._sqlite3_value_double=e.ga,o._sqlite3_value_int=e.ha,o._sqlite3_value_type=e.ia,o._sqlite3_result_blob=e.ja,o._sqlite3_result_double=e.ka,o._sqlite3_result_error=e.la,o._sqlite3_result_int=e.ma,o._sqlite3_result_int64=e.na,o._sqlite3_result_null=e.oa,o._sqlite3_result_text=e.pa,o._sqlite3_aggregate_context=e.qa,o._sqlite3_column_count=e.ra,o._sqlite3_data_count=e.sa,o._sqlite3_column_blob=e.ta,o._sqlite3_column_bytes=e.ua,o._sqlite3_column_double=e.va,o._sqlite3_bind_blob=e.wa,o._sqlite3_bind_double=e.xa,o._sqlite3_bind_int=e.ya,o._sqlite3_bind_text=e.za,o._sqlite3_bind_parameter_index=e.Aa,o._sqlite3_sql=e.Ba,o._sqlite3_normalized_sql=e.Ca,o._sqlite3_changes=e.Da,o._sqlite3_close_v2=e.Ea,o._sqlite3_create_function_v2=e.Fa,o._sqlite3_update_hook=e.Ga,o._sqlite3_open=e.Ha,qt=o._malloc=e.Ia,P=o._free=e.Ja,o._RegisterExtensionFunctions=e.Ka,Jt=e.La,Yt=e.Ma,Xt=e.Na,Zt=e.Oa,Qt=e.Pa,$t=e.O,en=e.Q,y(),rn}var t={a:tn},n=o.instantiateWasm;return n?new Promise(r=>{n(t,t=>r(e(t)))}):(te??=o.locateFile?o.locateFile(`sql-wasm-browser.wasm`,d):d+`sql-wasm-browser.wasm`,function(t){return e(t.instance)}(await ie(t)))})().then(()=>nn()),i}),n)};typeof e==`object`&&typeof t==`object`?(t.exports=r,t.exports.default=r):typeof define==`function`&&define.amd?define([],function(){return r}):typeof e==`object`&&(e.Module=r)}))(),1),hr=`/assets/sql-wasm-CXIAVl5-.wasm`,gr=null;function _r(){return gr||=(0,mr.default)({locateFile:()=>hr}),gr}function vr(e){if(e!==void 0)return Array.isArray(e)?[...e]:e}function yr(e){let t={};for(let[n,r]of Object.entries(e))t[n]=r===null||typeof r==`string`||typeof r==`number`||r instanceof Uint8Array?r:typeof r==`boolean`?+!!r:r===void 0?null:String(r);return t}var br=class{backend;raw;queue=new lr;onWrite;inTransaction=!1;closed=!1;constructor(e){this.raw=e.raw,this.backend=e.backend??`web`,this.onWrite=e.onWrite}assertOpen(){if(this.closed)throw Error(`Database sudah ditutup.`)}async persist(){if(!this.onWrite)return;let e=this.raw.export();await this.onWrite(e)}async query(e,t){return this.assertOpen(),this.queue.run(async()=>{let n=this.raw.prepare(e);try{let e=vr(t);e!==void 0&&n.bind(e);let r=[];for(;n.step();)r.push(yr(n.getAsObject()));return r}finally{n.free()}})}async execute(e,t){return this.assertOpen(),this.queue.run(async()=>{let n=vr(t);this.raw.run(e,n);let r=this.raw.getRowsModified(),i=this.raw.exec(`SELECT last_insert_rowid() AS id;`)[0]?.values[0]?.[0],a={changes:r,lastInsertId:typeof i==`number`?i:null};return this.inTransaction||await this.persist(),a})}async executeScript(e){return this.assertOpen(),this.queue.run(async()=>{this.raw.exec(e),this.inTransaction||await this.persist()})}async transaction(e){return this.assertOpen(),this.queue.run(async()=>{this.raw.exec(`BEGIN IMMEDIATE TRANSACTION;`),this.inTransaction=!0;let t={query:async(e,t)=>{let n=this.raw.prepare(e);try{let e=vr(t);e!==void 0&&n.bind(e);let r=[];for(;n.step();)r.push(yr(n.getAsObject()));return r}finally{n.free()}},execute:async(e,t)=>{this.raw.run(e,vr(t));let n=this.raw.getRowsModified(),r=this.raw.exec(`SELECT last_insert_rowid() AS id;`)[0]?.values[0]?.[0];return{changes:n,lastInsertId:typeof r==`number`?r:null}},executeScript:async e=>{this.raw.exec(e)}};try{let n=await e(t);return this.raw.exec(`COMMIT;`),this.inTransaction=!1,await this.persist(),n}catch(e){try{this.raw.exec(`ROLLBACK;`)}catch{}throw this.inTransaction=!1,e}})}async close(){this.closed||await this.queue.run(async()=>{await this.persist(),this.raw.close(),this.closed=!0})}async exportBytes(){return this.queue.run(async()=>this.raw.export())}};async function xr(e){let t=e?.wasmBinary?await(0,mr.default)({wasmBinary:e.wasmBinary}):await _r(),n=e?.bytes?new t.Database(e.bytes):new t.Database;return n.exec(`PRAGMA foreign_keys = ON;`),new br({raw:n,...e?.onWrite?{onWrite:e.onWrite}:{},...e?.backend?{backend:e.backend}:{}})}var Sr=`manka-local-database`,Cr=`sqlite`,wr=`main`;function Tr(){return new Promise((e,t)=>{let n=indexedDB.open(Sr,1);n.onupgradeneeded=()=>{let e=n.result;e.objectStoreNames.contains(Cr)||e.createObjectStore(Cr)},n.onsuccess=()=>e(n.result),n.onerror=()=>t(n.error??Error(`Gagal membuka penyimpanan lokal.`))})}async function Er(){let e=await Tr();try{return await new Promise((t,n)=>{let r=e.transaction(Cr,`readonly`).objectStore(Cr).get(wr);r.onsuccess=()=>{let e=r.result;t(e instanceof Uint8Array?e:void 0)},r.onerror=()=>n(r.error??Error(`Gagal membaca database lokal.`))})}finally{e.close()}}async function Dr(e){let t=await Tr();try{await new Promise((n,r)=>{let i=t.transaction(Cr,`readwrite`);i.objectStore(Cr).put(e,wr),i.oncomplete=()=>n(),i.onerror=()=>r(i.error??Error(`Gagal menyimpan database lokal.`)),i.onabort=()=>r(i.error??Error(`Penyimpanan database dibatalkan.`))})}finally{t.close()}}async function Or(){let e=await Er();return xr({...e?{bytes:e}:{},onWrite:Dr,backend:`web`})}var kr=[{version:1,name:`initial`,sql:`-- Manka database schema, version 1.
-- Semua nominal Rupiah disimpan sebagai INTEGER (tanpa floating point).
-- Tanggal bisnis disimpan sebagai TEXT dengan format YYYY-MM-DD (zona Asia/Jakarta).

CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS stores (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('shopee', 'tiktok', 'other')),
  email TEXT,
  phone TEXT,
  password_enc TEXT,
  ktp_name TEXT,
  bank_account_enc TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'archived')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_stores_status ON stores (status);
CREATE INDEX IF NOT EXISTS idx_stores_platform ON stores (platform);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sku TEXT NOT NULL COLLATE NOCASE UNIQUE,
  category TEXT,
  variant TEXT,
  price INTEGER NOT NULL DEFAULT 0 CHECK (price >= 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_products_status ON products (status);
CREATE INDEX IF NOT EXISTS idx_products_category ON products (category);

CREATE TABLE IF NOT EXISTS product_costs (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  cost INTEGER NOT NULL CHECK (cost >= 0),
  effective_at TEXT NOT NULL,
  note TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_product_costs_product ON product_costs (product_id, effective_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_costs_effective ON product_costs (effective_at);

CREATE TABLE IF NOT EXISTS product_prices (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL REFERENCES products (id) ON DELETE CASCADE,
  price INTEGER NOT NULL CHECK (price >= 0),
  effective_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_product_prices_product ON product_prices (product_id, effective_at DESC);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  store_id TEXT NOT NULL REFERENCES stores (id) ON DELETE RESTRICT,
  marketplace_order_id TEXT NOT NULL,
  order_date TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN (
    'pending', 'processing', 'shipped', 'delivered', 'completed', 'cancelled', 'returned', 'refunded'
  )),
  seller_discount INTEGER NOT NULL DEFAULT 0 CHECK (seller_discount >= 0),
  marketplace_discount INTEGER NOT NULL DEFAULT 0 CHECK (marketplace_discount >= 0),
  shipping_paid INTEGER NOT NULL DEFAULT 0 CHECK (shipping_paid >= 0),
  settlement_value INTEGER CHECK (settlement_value IS NULL OR settlement_value >= 0),
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (store_id, marketplace_order_id)
);

CREATE INDEX IF NOT EXISTS idx_orders_store ON orders (store_id);
CREATE INDEX IF NOT EXISTS idx_orders_date ON orders (order_date);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_store_date ON orders (store_id, order_date);
CREATE INDEX IF NOT EXISTS idx_orders_marketplace_id ON orders (marketplace_order_id);

CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL REFERENCES orders (id) ON DELETE CASCADE,
  product_id TEXT REFERENCES products (id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  sku TEXT NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price INTEGER NOT NULL CHECK (unit_price >= 0),
  hpp_snapshot INTEGER NOT NULL CHECK (hpp_snapshot >= 0),
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items (product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_sku ON order_items (sku);

CREATE TABLE IF NOT EXISTS marketplace_fees (
  id TEXT PRIMARY KEY,
  store_id TEXT NOT NULL REFERENCES stores (id) ON DELETE RESTRICT,
  order_id TEXT REFERENCES orders (id) ON DELETE CASCADE,
  fee_type TEXT NOT NULL CHECK (fee_type IN (
    'admin', 'service', 'transaction', 'commission', 'promotion', 'other'
  )),
  amount INTEGER NOT NULL CHECK (amount >= 0),
  fee_date TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'actual' CHECK (source IN ('actual', 'estimated')),
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_fees_store ON marketplace_fees (store_id);
CREATE INDEX IF NOT EXISTS idx_fees_date ON marketplace_fees (fee_date);
CREATE INDEX IF NOT EXISTS idx_fees_order ON marketplace_fees (order_id);
CREATE INDEX IF NOT EXISTS idx_fees_store_date ON marketplace_fees (store_id, fee_date);

CREATE TABLE IF NOT EXISTS advertising_campaigns (
  id TEXT PRIMARY KEY,
  store_id TEXT REFERENCES stores (id) ON DELETE RESTRICT,
  platform TEXT NOT NULL CHECK (platform IN ('shopee', 'tiktok', 'meta', 'google', 'other')),
  name TEXT NOT NULL,
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_campaigns_store ON advertising_campaigns (store_id);

CREATE TABLE IF NOT EXISTS advertising_expenses (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL REFERENCES advertising_campaigns (id) ON DELETE CASCADE,
  expense_date TEXT NOT NULL,
  amount INTEGER NOT NULL CHECK (amount >= 0),
  impressions INTEGER CHECK (impressions IS NULL OR impressions >= 0),
  clicks INTEGER CHECK (clicks IS NULL OR clicks >= 0),
  attributed_orders INTEGER CHECK (attributed_orders IS NULL OR attributed_orders >= 0),
  attributed_revenue INTEGER CHECK (attributed_revenue IS NULL OR attributed_revenue >= 0),
  notes TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_ad_expenses_campaign ON advertising_expenses (campaign_id);
CREATE INDEX IF NOT EXISTS idx_ad_expenses_date ON advertising_expenses (expense_date);

CREATE TABLE IF NOT EXISTS operational_expenses (
  id TEXT PRIMARY KEY,
  store_id TEXT REFERENCES stores (id) ON DELETE RESTRICT,
  expense_date TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'salary', 'electricity', 'internet', 'rent', 'machine_maintenance',
    'supplies', 'transportation', 'other'
  )),
  amount INTEGER NOT NULL CHECK (amount > 0),
  description TEXT NOT NULL,
  receipt_note TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_op_expenses_store ON operational_expenses (store_id);
CREATE INDEX IF NOT EXISTS idx_op_expenses_date ON operational_expenses (expense_date);
CREATE INDEX IF NOT EXISTS idx_op_expenses_category ON operational_expenses (category);

CREATE TABLE IF NOT EXISTS settlements (
  id TEXT PRIMARY KEY,
  store_id TEXT NOT NULL REFERENCES stores (id) ON DELETE RESTRICT,
  settlement_no TEXT NOT NULL,
  settlement_date TEXT NOT NULL,
  gross_sales INTEGER NOT NULL CHECK (gross_sales >= 0),
  total_deductions INTEGER NOT NULL CHECK (total_deductions >= 0),
  total_payout INTEGER NOT NULL CHECK (total_payout >= 0),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'received')),
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE (store_id, settlement_no)
);

CREATE INDEX IF NOT EXISTS idx_settlements_store ON settlements (store_id);
CREATE INDEX IF NOT EXISTS idx_settlements_date ON settlements (settlement_date);

CREATE TABLE IF NOT EXISTS refunds (
  id TEXT PRIMARY KEY,
  store_id TEXT NOT NULL REFERENCES stores (id) ON DELETE RESTRICT,
  order_id TEXT NOT NULL REFERENCES orders (id) ON DELETE RESTRICT,
  settlement_id TEXT REFERENCES settlements (id) ON DELETE SET NULL,
  refund_date TEXT NOT NULL,
  amount INTEGER NOT NULL CHECK (amount > 0),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'rejected')),
  notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_refunds_store ON refunds (store_id);
CREATE INDEX IF NOT EXISTS idx_refunds_order ON refunds (order_id);
CREATE INDEX IF NOT EXISTS idx_refunds_date ON refunds (refund_date);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON refunds (status);

CREATE TABLE IF NOT EXISTS import_batches (
  id TEXT PRIMARY KEY,
  import_type TEXT NOT NULL,
  file_name TEXT NOT NULL,
  total_rows INTEGER NOT NULL DEFAULT 0 CHECK (total_rows >= 0),
  success_rows INTEGER NOT NULL DEFAULT 0 CHECK (success_rows >= 0),
  failed_rows INTEGER NOT NULL DEFAULT 0 CHECK (failed_rows >= 0),
  skipped_rows INTEGER NOT NULL DEFAULT 0 CHECK (skipped_rows >= 0),
  notes TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_import_batches_date ON import_batches (created_at);

CREATE TABLE IF NOT EXISTS import_errors (
  id TEXT PRIMARY KEY,
  batch_id TEXT NOT NULL REFERENCES import_batches (id) ON DELETE CASCADE,
  row_number INTEGER NOT NULL CHECK (row_number >= 0),
  message TEXT NOT NULL,
  raw_data TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_import_errors_batch ON import_errors (batch_id);

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  details TEXT,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_date ON audit_logs (created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs (entity_type, entity_id);
`}],Ar=kr[kr.length-1]?.version??0;async function jr(e){let t=await e.query(`SELECT MAX(version) AS version FROM schema_migrations;`);return Number(t[0]?.version??0)}async function Mr(e){await e.execute(`PRAGMA foreign_keys = ON;`),await e.execute(`CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, applied_at TEXT NOT NULL);`);let t=await jr(e);if(t>Ar)throw Error(`Database ini dibuat oleh versi aplikasi yang lebih baru. Perbarui aplikasi untuk membukanya.`);let n=kr.filter(e=>e.version>t).sort((e,t)=>e.version-t.version);for(let t of n)await e.transaction(async e=>{await e.executeScript(t.sql),await e.execute(`INSERT INTO schema_migrations (version, applied_at) VALUES (?, ?);`,[t.version,T()])});await e.execute(`PRAGMA foreign_keys = ON;`)}var Nr=null;async function Pr(){return m.isNativePlatform()?pr():Or()}function Fr(){return Nr||=Pr().then(async e=>(await Mr(e),e)).catch(e=>{throw Nr=null,e}),Nr}var Ir=new TextEncoder;function Lr(e){let t=e.replace(/[\\/:*?"<>|]+/g,`-`).replace(/\s+/g,`-`).replace(/-+/g,`-`).replace(/^-|-$/g,``);return t===``?`manka-file`:t.slice(0,140)}function Rr(e){return typeof e==`string`?Ir.encode(e):e}async function zr(e,t,n){let r=Lr(e);if(m.isNativePlatform()){let{Filesystem:e,Directory:t}=await de(async()=>{let{Filesystem:e,Directory:t}=await import(`./esm-CBinPeSg.js`);return{Filesystem:e,Directory:t}},[]),{Share:i}=await de(async()=>{let{Share:e}=await import(`./esm-C_zsDTQv.js`);return{Share:e}},[]),a=Rr(n),o=`Manka/${r}`;await e.writeFile({path:o,data:ge(a),directory:t.Cache,recursive:!0});let s=await e.getUri({directory:t.Cache,path:o});return await i.share({title:r,text:`File dibuat oleh Manka.`,url:s.uri,dialogTitle:`Simpan atau bagikan file`}),{method:`share`,fileName:r}}let i=Rr(n),a=new Blob([i],{type:t}),o=URL.createObjectURL(a);try{let e=document.createElement(`a`);e.href=o,e.download=r,e.rel=`noopener`,document.body.appendChild(e),e.click(),e.remove()}finally{setTimeout(()=>URL.revokeObjectURL(o),3e4)}return{method:`download`,fileName:r}}var Br=`1.0.0`;function Vr(e){return typeof e==`object`&&!!e&&!Array.isArray(e)}function Hr(e){return Vr(e)&&e.format===`manka-backup`&&e.version===1&&Vr(e.kdf)&&Vr(e.cipher)&&typeof e.payload==`string`}function Ur(e){if(!Vr(e))throw new N(`Isi backup tidak valid.`);let t=Number(e.schemaVersion);if(!Number.isSafeInteger(t)||t<1)throw new N(`Versi skema backup tidak valid.`);if(t>Ar)throw new N(`Backup dibuat oleh versi aplikasi yang lebih baru. Perbarui aplikasi sebelum memulihkan backup ini.`);if(t<Ar)throw new N(`Versi skema backup ini belum didukung oleh aplikasi. Backup versi lama memerlukan migrasi khusus.`);if(typeof e.encryptionKey!=`string`||!/^[A-Za-z0-9+/]+={0,2}$/.test(e.encryptionKey))throw new N(`Kunci enkripsi pada backup tidak valid.`);if(!Vr(e.tables))throw new N(`Data tabel pada backup tidak valid.`);let n={};for(let t of Ut){let r=e.tables[t.name];if(!Array.isArray(r))throw new N(`Tabel "${t.name}" tidak ditemukan pada backup.`);let i=[];for(let e of r){if(!Vr(e))throw new N(`Baris data pada tabel "${t.name}" tidak valid.`);let n={};for(let r of t.columns){let i=e[r];if(i!==null&&typeof i!=`string`&&typeof i!=`number`)throw new N(`Nilai kolom "${t.name}.${r}" pada backup tidak valid.`);n[r]=i??null}i.push(n)}n[t.name]=i}return{schemaVersion:t,appVersion:typeof e.appVersion==`string`?e.appVersion:`tidak diketahui`,createdAt:typeof e.createdAt==`string`?e.createdAt:T(),encryptionKey:e.encryptionKey,tables:n}}var Wr=class{backup;encryption;audit;constructor(e,t,n){this.backup=e,this.encryption=t,this.audit=n}async exportBackup(e){if(e.length<8)throw new N(`Kata sandi backup minimal 8 karakter.`,{password:`Gunakan minimal 8 karakter.`});let t=await this.backup.readAll(),n=await this.encryption.exportKeyBase64(),r=T(),i=await Ce(JSON.stringify({schemaVersion:Ar,appVersion:Br,createdAt:r,encryptionKey:n,tables:t}),e,r),a=JSON.stringify(i,null,2),o=await zr(`manka-backup-${r.slice(0,19).replace(/[:T]/g,`-`)}.manka`,`application/json`,a);return await this.audit.log(`backup`,`database`,null,{schemaVersion:Ar,sizeBytes:new TextEncoder().encode(a).length}),{fileName:o.fileName,method:o.method,tableCounts:Object.fromEntries(Object.entries(t).map(([e,t])=>[e,t.length]))}}async inspectBackup(e,t){let n=await this.readBackupPayload(e,t);return{schemaVersion:n.schemaVersion,appVersion:n.appVersion,createdAt:n.createdAt,tableCounts:Object.fromEntries(Object.entries(n.tables).map(([e,t])=>[e,t.length]))}}async readBackupPayload(e,t){if(t.length===0)throw new N(`Masukkan kata sandi backup.`);if(e.size>62914560)throw new N(`Ukuran file backup terlalu besar.`);let n;try{let t=await e.text();n=JSON.parse(t)}catch{throw new N(`File backup tidak valid atau rusak.`)}if(!Hr(n))throw new N(`File ini bukan backup Manka yang valid.`);let r;try{r=await we(n,t)}catch(e){throw new N(e instanceof Error?e.message:`Backup tidak dapat dibuka.`)}let i;try{i=JSON.parse(r)}catch{throw new N(`Isi backup rusak.`)}return Ur(i)}async restoreBackup(e,t){let n=await this.readBackupPayload(e,t);return await this.backup.restoreAll(n.tables),await this.encryption.replaceKey(n.encryptionKey),await this.audit.log(`restore`,`database`,null,{schemaVersion:n.schemaVersion,appVersion:n.appVersion}),{schemaVersion:n.schemaVersion,appVersion:n.appVersion,createdAt:n.createdAt,tableCounts:Object.fromEntries(Object.entries(n.tables).map(([e,t])=>[e,t.length]))}}},Gr=class{orders;fees;refunds;ads;expenses;settlements;constructor(e,t,n,r,i,a){this.orders=e,this.fees=t,this.refunds=n,this.ads=r,this.expenses=i,this.settlements=a}async loadDataset(e){let[t,n,r,i,a]=await Promise.all([this.orders.findForFinance(e.from,e.to),this.fees.findForFinance(e.from,e.to),this.refunds.findForFinance(e.from,e.to),this.ads.findForFinance(e.from,e.to),this.expenses.findForFinance(e.from,e.to)]);return{orders:t,fees:n,refunds:r,advertisingExpenses:i,operationalExpenses:a}}async getSummary(e,t){return Bn(await this.loadDataset(e),{storeId:t})}async getDaily(e,t){return Vn(await this.loadDataset(e),{storeId:t},e.from,e.to)}async getStorePerformance(e,t){return Hn(await this.loadDataset(e),t)}async getComparison(e,t,n){let[r,i]=await Promise.all([this.loadDataset(e),this.loadDataset(t)]);return Un(Bn(r,{storeId:n}),Bn(i,{storeId:n}))}async getReceivedSettlements(e,t){return this.settlements.sumReceived(e.from,e.to,t)}},Kr=class{finance;stores;orders;constructor(e,t,n){this.finance=e,this.stores=t,this.orders=n}async load(e,t){let n=Ye(e),[r,i,a,o,s]=await Promise.all([this.finance.loadDataset(e),this.finance.loadDataset(n),this.stores.listAll(),this.orders.listRecent(6,t),this.finance.getReceivedSettlements(e,t)]),c=Bn(r,{storeId:t}),l=Bn(i,{storeId:t}),u=Hn(r,t?a.filter(e=>e.id===t):a),d=Vn(r,{storeId:t},e.from,e.to);return{range:e,previousRange:n,summary:c,previousSummary:l,comparison:Un(c,l),daily:d,storePerformance:u,stores:a,recentOrders:o,receivedSettlements:s}}},qr=class{finance;stores;constructor(e,t){this.finance=e,this.stores=t}async getReport(e,t){let[n,r]=await Promise.all([this.finance.loadDataset(e),this.stores.listAll()]),i=t?r.filter(e=>e.id===t):r;return{range:e,storeId:t,stores:i,summary:Bn(n,{storeId:t}),daily:Vn(n,{storeId:t},e.from,e.to),storePerformance:Hn(n,i)}}};function Jr(e,t=new Ee){let n=new De(t),r=new $e(e),i=new at(e),a=new dt(e),o=new bt(e),s=new Ct(e),c=new Ot(e),l=new jt(e),u=new Ft(e),d=new Rt(e),f=new Vt(e),p=new Ht(e),m=new Wt(e),h=new pn(i,r,n),g=new gn(e,a,r),_=new vn(e,o,a,i,r),v=new xn(s,i,o,r),y=new Kn(c,i,r),b=new Jn(l,i,r),ee=new Xn(u,o,d,r),x=new Qn(d,i,r),te=new cr(e,o,a,i,s,u,f,r),ne=new Wr(m,n,r),re=new Gr(o,s,u,c,l,d);return{db:e,encryption:n,audit:r,stores:i,products:a,orders:o,fees:s,advertising:c,expenses:l,refunds:u,settlements:d,imports:f,settings:p,backupRepo:m,storeService:h,productService:g,orderService:_,feeService:v,advertisingService:y,expenseService:b,refundService:ee,settlementService:x,importService:te,backupService:ne,financeService:re,dashboardService:new Kr(re,i,o),reportService:new qr(re,i)}}function L(e){return String(e??``).replace(/&/g,`&amp;`).replace(/</g,`&lt;`).replace(/>/g,`&gt;`).replace(/"/g,`&quot;`).replace(/'/g,`&#39;`)}function R(e){return L(e)}var Yr={xmlns:`http://www.w3.org/2000/svg`,width:24,height:24,viewBox:`0 0 24 24`,fill:`none`,stroke:`currentColor`,"stroke-width":2,"stroke-linecap":`round`,"stroke-linejoin":`round`},Xr=([e,t,n])=>{let r=document.createElementNS(`http://www.w3.org/2000/svg`,e);return Object.keys(t).forEach(e=>{r.setAttribute(e,String(t[e]))}),n?.length&&n.forEach(e=>{let t=Xr(e);r.appendChild(t)}),r},Zr=(e,t={})=>Xr([`svg`,{...Yr,...t},e]),Qr=(...e)=>e.filter((e,t,n)=>!!e&&e.trim()!==``&&n.indexOf(e)===t).join(` `).trim(),$r=e=>{for(let t in e)if(t.startsWith(`aria-`)||t===`role`||t===`title`)return!0;return!1},ei=e=>{let t=``,n=!1;for(let r of e)r===`-`||r===`_`||r<=` `?n=t.length>0:(t.length===0?t+=r.toLowerCase():t+=n?r.toUpperCase():r,n=!1);return t},ti=e=>{let t=ei(e);return t.charAt(0).toUpperCase()+t.slice(1)},ni=e=>Array.from(e.attributes).reduce((e,t)=>(e[t.name]=t.value,e),{}),ri=e=>typeof e==`string`?e:!e||!e.class?``:e.class&&typeof e.class==`string`?e.class.split(` `):e.class&&Array.isArray(e.class)?e.class:``,ii=(e,{nameAttr:t,icons:n,attrs:r})=>{let i=e.getAttribute(t);if(i==null)return;let a=n[ti(i)];if(!a)return console.warn(`${e.outerHTML} icon name was not found in the provided icons object.`);let o=ni(e),s=$r(o)?{}:{"aria-hidden":`true`},c={...Yr,"data-lucide":i,...s,...r,...o},l=ri(o),u=ri(r),d=Qr(`lucide`,`lucide-${i}`,...l,...u);d&&Object.assign(c,{class:d});let f=Zr(a,c);return e.parentNode?.replaceChild(f,e)},ai=[[`rect`,{width:`20`,height:`5`,x:`2`,y:`3`,rx:`1`}],[`path`,{d:`M4 8v11a2 2 0 0 0 2 2h2`}],[`path`,{d:`M20 8v11a2 2 0 0 1-2 2h-2`}],[`path`,{d:`m9 15 3-3 3 3`}],[`path`,{d:`M12 12v9`}]],oi=[[`rect`,{width:`20`,height:`5`,x:`2`,y:`3`,rx:`1`}],[`path`,{d:`M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8`}],[`path`,{d:`M10 12h4`}]],si=[[`path`,{d:`m7 7 10 10`}],[`path`,{d:`M17 7v10H7`}]],ci=[[`path`,{d:`m12 19-7-7 7-7`}],[`path`,{d:`M19 12H5`}]],li=[[`path`,{d:`M5 12h14`}],[`path`,{d:`m12 5 7 7-7 7`}]],ui=[[`path`,{d:`M7 7h10v10`}],[`path`,{d:`M7 17 17 7`}]],di=[[`rect`,{width:`20`,height:`12`,x:`2`,y:`6`,rx:`2`}],[`circle`,{cx:`12`,cy:`12`,r:`2`}],[`path`,{d:`M6 12h.01M18 12h.01`}]],fi=[[`path`,{d:`M8 2v3`}],[`path`,{d:`M16 2v3`}],[`rect`,{x:`3`,y:`3`,width:`18`,height:`18`,rx:`2`}],[`path`,{d:`M3 9h18`}],[`path`,{d:`M8 13h.01`}],[`path`,{d:`M12 13h.01`}],[`path`,{d:`M16 13h.01`}],[`path`,{d:`M8 17h.01`}],[`path`,{d:`M12 17h.01`}],[`path`,{d:`M16 17h.01`}]],pi=[[`path`,{d:`M8 2v3`}],[`path`,{d:`M16 2v3`}],[`rect`,{x:`3`,y:`3`,width:`18`,height:`18`,rx:`2`}],[`path`,{d:`M3 9h18`}]],mi=[[`path`,{d:`M3 3v16a2 2 0 0 0 2 2h16`}],[`path`,{d:`M18 17V9`}],[`path`,{d:`M13 17V5`}],[`path`,{d:`M8 17v-3`}]],hi=[[`path`,{d:`M3 3v16a2 2 0 0 0 2 2h16`}],[`path`,{d:`m19 9-5 5-4-4-3 3`}]],gi=[[`path`,{d:`M21 12c.552 0 1.005-.449.95-.998a10 10 0 0 0-8.953-8.951c-.55-.055-.998.398-.998.95v8a1 1 0 0 0 1 1z`}],[`path`,{d:`M21.21 15.89A10 10 0 1 1 8 2.83`}]],_i=[[`path`,{d:`M18 6 7 17l-5-5`}],[`path`,{d:`m22 10-7.5 7.5L13 16`}]],vi=[[`path`,{d:`M20 6 9 17l-5-5`}]],yi=[[`path`,{d:`m6 9 6 6 6-6`}]],bi=[[`path`,{d:`m15 18-6-6 6-6`}]],xi=[[`path`,{d:`m9 18 6-6-6-6`}]],Si=[[`path`,{d:`m11 17-5-5 5-5`}],[`path`,{d:`m18 17-5-5 5-5`}]],Ci=[[`path`,{d:`m6 17 5-5-5-5`}],[`path`,{d:`m13 17 5-5-5-5`}]],wi=[[`circle`,{cx:`12`,cy:`12`,r:`10`}],[`path`,{d:`m16 9-5.5 5.5L8 12`}]],Ti=[[`circle`,{cx:`12`,cy:`12`,r:`10`}],[`path`,{d:`M9 9.5a3 2.5 0 016 0c0 2-2 2-3 3.5`}],[`path`,{d:`M12 17h.01`}]],Ei=[[`circle`,{cx:`12`,cy:`12`,r:`10`}],[`path`,{d:`m15 9-6 6`}],[`path`,{d:`m9 9 6 6`}]],Di=[[`circle`,{cx:`12`,cy:`12`,r:`10`}],[`path`,{d:`M12 6v6l4 2`}]],Oi=[[`path`,{d:`M13.744 17.736a6 6 0 1 1-7.48-7.48`}],[`path`,{d:`M15 6h1v4`}],[`path`,{d:`m6.134 14.768.866-.5 2 3.464`}],[`circle`,{cx:`16`,cy:`8`,r:`6`}]],ki=[[`rect`,{width:`14`,height:`14`,x:`8`,y:`8`,rx:`2`,ry:`2`}],[`path`,{d:`M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2`}]],Ai=[[`rect`,{width:`20`,height:`14`,x:`2`,y:`5`,rx:`2`}],[`line`,{x1:`2`,x2:`22`,y1:`10`,y2:`10`}],[`path`,{d:`M6 14h2`}]],ji=[[`ellipse`,{cx:`12`,cy:`5`,rx:`9`,ry:`3`}],[`path`,{d:`M3 5V19A9 3 0 0 0 21 19V5`}],[`path`,{d:`M3 12A9 3 0 0 0 21 12`}]],Mi=[[`path`,{d:`M12 15V3`}],[`path`,{d:`M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4`}],[`path`,{d:`m7 10 5 5 5-5`}]],Ni=[[`circle`,{cx:`12`,cy:`12`,r:`1`}],[`circle`,{cx:`12`,cy:`5`,r:`1`}],[`circle`,{cx:`12`,cy:`19`,r:`1`}]],Pi=[[`path`,{d:`M15 3h6v6`}],[`path`,{d:`M10 14 21 3`}],[`path`,{d:`M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6`}]],Fi=[[`path`,{d:`M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49`}],[`path`,{d:`M14.084 14.158a3 3 0 0 1-4.242-4.242`}],[`path`,{d:`M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143`}],[`path`,{d:`m2 2 20 20`}]],Ii=[[`path`,{d:`M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0`}],[`circle`,{cx:`12`,cy:`12`,r:`3`}]],Li=[[`path`,{d:`M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z`}],[`path`,{d:`M14 2v5a1 1 0 0 0 1 1h5`}],[`path`,{d:`M12 18v-6`}],[`path`,{d:`m9 15 3 3 3-3`}]],Ri=[[`path`,{d:`M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z`}],[`path`,{d:`M14 2v5a1 1 0 0 0 1 1h5`}],[`path`,{d:`M8 13h2`}],[`path`,{d:`M14 13h2`}],[`path`,{d:`M8 17h2`}],[`path`,{d:`M14 17h2`}]],zi=[[`path`,{d:`M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z`}],[`path`,{d:`M14 2v5a1 1 0 0 0 1 1h5`}],[`path`,{d:`M10 9H8`}],[`path`,{d:`M16 13H8`}],[`path`,{d:`M16 17H8`}]],Bi=[[`path`,{d:`M10 20a1 1 0 0 0 .553.895l2 1A1 1 0 0 0 14 21v-7a2 2 0 0 1 .517-1.341L21.74 4.67A1 1 0 0 0 21 3H3a1 1 0 0 0-.742 1.67l7.225 7.989A2 2 0 0 1 10 14z`}]],Vi=[[`path`,{d:`M10 16h.01`}],[`path`,{d:`M2.212 11.577a2 2 0 0 0-.212.896V18a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5.527a2 2 0 0 0-.212-.896L18.55 5.11A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z`}],[`path`,{d:`M21.946 12.013H2.054`}],[`path`,{d:`M6 16h.01`}]],Hi=[[`path`,{d:`M13 19a4 4 0 00-8 0`}],[`path`,{d:`M16 10h2`}],[`path`,{d:`M16 14h2`}],[`circle`,{cx:`9`,cy:`12`,r:`3`}],[`rect`,{x:`2`,y:`5`,width:`20`,height:`14`,rx:`2`}]],Ui=[[`circle`,{cx:`12`,cy:`12`,r:`10`}],[`path`,{d:`M12 16v-4`}],[`path`,{d:`M12 8h.01`}]],Wi=[[`path`,{d:`M2.586 17.414A2 2 0 0 0 2 18.828V21a1 1 0 0 0 1 1h3a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h1a1 1 0 0 0 1-1v-1a1 1 0 0 1 1-1h.172a2 2 0 0 0 1.414-.586l.814-.814a6.5 6.5 0 1 0-4-4z`}],[`circle`,{cx:`16.5`,cy:`7.5`,r:`.5`,fill:`currentColor`}]],Gi=[[`rect`,{width:`7`,height:`9`,x:`3`,y:`3`,rx:`1`}],[`rect`,{width:`7`,height:`5`,x:`14`,y:`3`,rx:`1`}],[`rect`,{width:`7`,height:`9`,x:`14`,y:`12`,rx:`1`}],[`rect`,{width:`7`,height:`5`,x:`3`,y:`16`,rx:`1`}]],Ki=[[`path`,{d:`M21 12a9 9 0 1 1-6.219-8.56`}]],qi=[[`circle`,{cx:`12`,cy:`16`,r:`1`}],[`rect`,{x:`3`,y:`10`,width:`18`,height:`12`,rx:`2`}],[`path`,{d:`M7 10V7a5 5 0 0 1 10 0v3`}]],Ji=[[`rect`,{width:`18`,height:`11`,x:`3`,y:`11`,rx:`2`,ry:`2`}],[`path`,{d:`M7 11V7a5 5 0 0 1 10 0v4`}]],Yi=[[`path`,{d:`m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7`}],[`rect`,{x:`2`,y:`4`,width:`20`,height:`16`,rx:`2`}]],Xi=[[`path`,{d:`M11 6a13 13 0 0 0 8.4-2.8A1 1 0 0 1 21 4v12a1 1 0 0 1-1.6.8A13 13 0 0 0 11 14H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z`}],[`path`,{d:`M6 14a12 12 0 0 0 2.4 7.2 2 2 0 0 0 3.2-2.4A8 8 0 0 1 10 14`}],[`path`,{d:`M8 6v8`}]],Zi=[[`path`,{d:`M4 5h16`}],[`path`,{d:`M4 12h16`}],[`path`,{d:`M4 19h16`}]],Qi=[[`path`,{d:`M5 12h14`}]],$i=[[`path`,{d:`M11 21.73a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73z`}],[`path`,{d:`M12 22V12`}],[`polyline`,{points:`3.29 7 12 12 20.71 7`}],[`path`,{d:`m7.5 4.27 9 5.15`}]],ea=[[`line`,{x1:`19`,x2:`5`,y1:`5`,y2:`19`}],[`circle`,{cx:`6.5`,cy:`6.5`,r:`2.5`}],[`circle`,{cx:`17.5`,cy:`17.5`,r:`2.5`}]],ta=[[`path`,{d:`M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z`}],[`path`,{d:`m15 5 4 4`}]],na=[[`path`,{d:`M13.832 16.568a1 1 0 0 0 1.213-.303l.355-.465A2 2 0 0 1 17 15h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a2 2 0 0 1 2 2v3a2 2 0 0 1-.8 1.6l-.468.351a1 1 0 0 0-.292 1.233 14 14 0 0 0 6.392 6.384`}]],ra=[[`path`,{d:`M5 12h14`}],[`path`,{d:`M12 5v14`}]],ia=[[`path`,{d:`M12 17V7`}],[`path`,{d:`M16 8h-6a2 2 0 0 0 0 4h4a2 2 0 0 1 0 4H8`}],[`path`,{d:`M4 3a1 1 0 0 1 1-1 1.3 1.3 0 0 1 .7.2l.933.6a1.3 1.3 0 0 0 1.4 0l.934-.6a1.3 1.3 0 0 1 1.4 0l.933.6a1.3 1.3 0 0 0 1.4 0l.933-.6a1.3 1.3 0 0 1 1.4 0l.934.6a1.3 1.3 0 0 0 1.4 0l.933-.6A1.3 1.3 0 0 1 19 2a1 1 0 0 1 1 1v18a1 1 0 0 1-1 1 1.3 1.3 0 0 1-.7-.2l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.934.6a1.3 1.3 0 0 1-1.4 0l-.933-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-1.4 0l-.934-.6a1.3 1.3 0 0 0-1.4 0l-.933.6a1.3 1.3 0 0 1-.7.2 1 1 0 0 1-1-1z`}]],aa=[[`path`,{d:`M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8`}],[`path`,{d:`M21 3v5h-5`}],[`path`,{d:`M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16`}],[`path`,{d:`M8 16H3v5`}]],oa=[[`path`,{d:`M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z`}],[`path`,{d:`M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7`}],[`path`,{d:`M7 3v4a1 1 0 0 0 1 1h7`}]],sa=[[`path`,{d:`m21 21-4.34-4.34`}],[`circle`,{cx:`11`,cy:`11`,r:`8`}]],ca=[[`path`,{d:`M9.671 4.136a2.34 2.34 0 0 1 4.659 0 2.34 2.34 0 0 0 3.319 1.915 2.34 2.34 0 0 1 2.33 4.033 2.34 2.34 0 0 0 0 3.831 2.34 2.34 0 0 1-2.33 4.033 2.34 2.34 0 0 0-3.319 1.915 2.34 2.34 0 0 1-4.659 0 2.34 2.34 0 0 0-3.32-1.915 2.34 2.34 0 0 1-2.33-4.033 2.34 2.34 0 0 0 0-3.831A2.34 2.34 0 0 1 6.35 6.051a2.34 2.34 0 0 0 3.319-1.915`}],[`circle`,{cx:`12`,cy:`12`,r:`3`}]],la=[[`path`,{d:`M12 2v13`}],[`path`,{d:`m16 6-4-4-4 4`}],[`path`,{d:`M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8`}]],ua=[[`path`,{d:`M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z`}],[`path`,{d:`m9 12 2 2 4-4`}]],da=[[`path`,{d:`M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z`}],[`path`,{d:`M12 8v4`}],[`path`,{d:`M12 16h.01`}]],fa=[[`path`,{d:`M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z`}]],pa=[[`path`,{d:`M16 10a4 4 0 0 1-8 0`}],[`path`,{d:`M3.103 6.034h17.794`}],[`path`,{d:`M3.4 5.467a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.667a2 2 0 0 0-.4-1.2l-2-2.667A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z`}]],ma=[[`path`,{d:`M10 5H3`}],[`path`,{d:`M12 19H3`}],[`path`,{d:`M14 3v4`}],[`path`,{d:`M16 17v4`}],[`path`,{d:`M21 12h-9`}],[`path`,{d:`M21 19h-5`}],[`path`,{d:`M21 5h-7`}],[`path`,{d:`M8 10v4`}],[`path`,{d:`M8 12H3`}]],ha=[[`path`,{d:`M11.017 2.814a1 1 0 0 1 1.966 0l1.051 5.558a2 2 0 0 0 1.594 1.594l5.558 1.051a1 1 0 0 1 0 1.966l-5.558 1.051a2 2 0 0 0-1.594 1.594l-1.051 5.558a1 1 0 0 1-1.966 0l-1.051-5.558a2 2 0 0 0-1.594-1.594l-5.558-1.051a1 1 0 0 1 0-1.966l5.558-1.051a2 2 0 0 0 1.594-1.594z`}],[`path`,{d:`M20 2v4`}],[`path`,{d:`M22 4h-4`}],[`circle`,{cx:`4`,cy:`20`,r:`2`}]],ga=[[`path`,{d:`M15 21v-5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v5`}],[`path`,{d:`M17.774 10.31a1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.451 0 1.12 1.12 0 0 0-1.548 0 2.5 2.5 0 0 1-3.452 0 1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.77-3.248l2.889-4.184A2 2 0 0 1 7 2h10a2 2 0 0 1 1.653.873l2.895 4.192a2.5 2.5 0 0 1-3.774 3.244`}],[`path`,{d:`M4 10.95V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8.05`}]],_a=[[`path`,{d:`M10 11v6`}],[`path`,{d:`M14 11v6`}],[`path`,{d:`M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6`}],[`path`,{d:`M3 6h18`}],[`path`,{d:`M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2`}]],va=[[`path`,{d:`M16 17h6v-6`}],[`path`,{d:`m22 17-8.5-8.5-5 5L2 7`}]],ya=[[`path`,{d:`M16 7h6v6`}],[`path`,{d:`m22 7-8.5 8.5-5-5L2 17`}]],ba=[[`path`,{d:`m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3`}],[`path`,{d:`M12 9v4`}],[`path`,{d:`M12 17h.01`}]],xa=[[`path`,{d:`M12 3v12`}],[`path`,{d:`m17 8-5-5-5 5`}],[`path`,{d:`M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4`}]],Sa=[[`circle`,{cx:`12`,cy:`8`,r:`5`}],[`path`,{d:`M20 21a8 8 0 0 0-16 0`}]],Ca=[[`path`,{d:`M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1`}],[`path`,{d:`M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4`}]],wa=[[`path`,{d:`M18 6 6 18`}],[`path`,{d:`m6 6 12 12`}]],Ta=({icons:e={},nameAttr:t=`data-lucide`,attrs:n={},root:r=document,inTemplates:i}={})=>{if(!Object.values(e).length)throw Error(`Please provide an icons object.
If you want to use all the icons you can import it like:
 \`import { createIcons, icons } from 'lucide';
lucide.createIcons({icons});\``);if(r===void 0)throw Error("`createIcons()` only works in a browser environment.");if(Array.from(r.querySelectorAll(`[${t}]`)).forEach(r=>ii(r,{nameAttr:t,icons:e,attrs:n})),i&&Array.from(r.querySelectorAll(`template`)).forEach(r=>Ta({icons:e,nameAttr:t,attrs:n,root:r.content,inTemplates:i})),t===`data-lucide`){let t=r.querySelectorAll(`[icon-name]`);t.length>0&&(console.warn(`[Lucide] Some icons were found with the now deprecated icon-name attribute. These will still be replaced for backwards compatibility, but will no longer be supported in v1.0 and you should switch to data-lucide`),Array.from(t).forEach(t=>ii(t,{nameAttr:`icon-name`,icons:e,attrs:n})))}},Ea={Archive:oi,ArchiveRestore:ai,ArrowDownRight:si,ArrowLeft:ci,ArrowRight:li,ArrowUpRight:ui,Banknote:di,Calendar:pi,CalendarDays:fi,ChartColumn:mi,ChartLine:hi,ChartPie:gi,Check:vi,CheckCheck:_i,ChevronDown:yi,ChevronLeft:bi,ChevronRight:xi,ChevronsLeft:Si,ChevronsRight:Ci,CircleCheck:wi,CircleQuestionMark:Ti,CircleX:Ei,Clock:Di,Coins:Oi,Copy:ki,CreditCard:Ai,Database:ji,Download:Mi,EllipsisVertical:Ni,ExternalLink:Pi,Eye:Ii,EyeOff:Fi,FileDown:Li,FileSpreadsheet:Ri,FileText:zi,Filter:Bi,HardDrive:Vi,IdCard:Hi,Info:Ui,KeyRound:Wi,LayoutDashboard:Gi,LoaderCircle:Ki,Lock:Ji,LockKeyhole:qi,Mail:Yi,Megaphone:Xi,Menu:Zi,Minus:Qi,Package:$i,Pencil:ta,Percent:ea,Phone:na,Plus:ra,Receipt:ia,RefreshCw:aa,Save:oa,Search:sa,Settings:ca,Share:la,ShieldAlert:da,ShieldCheck:ua,Shirt:fa,ShoppingBag:pa,SlidersHorizontal:ma,Sparkles:ha,Store:ga,Trash:_a,TrendingDown:va,TrendingUp:ya,TriangleAlert:ba,Upload:xa,UserRound:Sa,Wallet:Ca,X:wa};function z(e=document){Ta({icons:Ea,root:e})}function B(e,t=``){let n=t.replace(/"/g,``);return`<i data-lucide="${e}"${n?` class="${n}"`:``} aria-hidden="true"></i>`}var Da={success:`circle-check`,error:`circle-x`,info:`info`,warning:`triangle-alert`};function V(e,t=`success`,n){let r=document.getElementById(`toast-root`);if(!r)return;let i=document.createElement(`div`);i.className=`toast toast-${t}`,i.setAttribute(`role`,t===`error`?`alert`:`status`),i.innerHTML=`
    <i data-lucide="${Da[t]}" aria-hidden="true"></i>
    <span>${L(e)}</span>
  `,r.appendChild(i),z(i);let a=n??(t===`error`?6500:3800);window.setTimeout(()=>{i.classList.add(`toast-leaving`),window.setTimeout(()=>i.remove(),220)},a)}var Oa=[{href:`/dashboard`,label:`Dashboard`,iconName:`layout-dashboard`,match:[`/dashboard`],section:`main`},{href:`/stores`,label:`Toko`,iconName:`store`,match:[`/stores`],section:`main`},{href:`/orders`,label:`Pesanan`,iconName:`shopping-bag`,match:[`/orders`],section:`main`},{href:`/products`,label:`Produk`,iconName:`package`,match:[`/products`],section:`main`},{href:`/finance`,label:`Keuangan`,iconName:`wallet`,match:[`/finance`],section:`main`},{href:`/reports`,label:`Laporan`,iconName:`chart-column`,match:[`/reports`],section:`main`},{href:`/settings`,label:`Pengaturan`,iconName:`settings`,match:[`/settings`],section:`main`}],ka=[{href:`/finance`,label:`Ringkasan`,iconName:`chart-pie`,match:[`/finance`],section:`finance`},{href:`/finance/fees`,label:`Biaya marketplace`,iconName:`credit-card`,match:[`/finance/fees`],section:`finance`},{href:`/finance/ads`,label:`Iklan`,iconName:`megaphone`,match:[`/finance/ads`],section:`finance`},{href:`/finance/expenses`,label:`Operasional`,iconName:`receipt`,match:[`/finance/expenses`],section:`finance`},{href:`/finance/refunds`,label:`Refund`,iconName:`refresh-cw`,match:[`/finance/refunds`],section:`finance`},{href:`/finance/settlements`,label:`Settlement`,iconName:`banknote`,match:[`/finance/settlements`],section:`finance`}],Aa=[{href:`/dashboard`,label:`Dashboard`,iconName:`layout-dashboard`,match:[`/dashboard`]},{href:`/orders`,label:`Pesanan`,iconName:`shopping-bag`,match:[`/orders`]},{href:`/products`,label:`Produk`,iconName:`package`,match:[`/products`]},{href:`/finance`,label:`Keuangan`,iconName:`wallet`,match:[`/finance`]},{href:`/more`,label:`Lainnya`,iconName:`menu`,match:[`/more`,`/stores`,`/reports`,`/settings`]}];function ja(e,t,n){return`<a class="${n}" href="#${L(e.href)}" data-nav-kind="${t}" data-nav-href="${L(e.href)}">
    ${B(e.iconName,`nav-icon`)}
    <span>${L(e.label)}</span>
  </a>`}function Ma(e,t,n){return n===`finance`?e===`/finance`?t===`/finance`:t===e||t.startsWith(`${e}/`):n===`mobile`?e===`/dashboard`?t===`/dashboard`:e===`/more`?[`/more`,`/stores`,`/reports`,`/settings`].some(e=>t===e||t.startsWith(`${e}/`)):e===`/finance`?t.startsWith(`/finance`):t===e||t.startsWith(`${e}/`):t===e||t.startsWith(`${e}/`)}function Na(e,t,n){let r=Oa.filter(e=>[`/dashboard`,`/stores`,`/orders`,`/products`].includes(e.href)),i=Oa.filter(e=>[`/reports`,`/settings`].includes(e.href)),a=D(w(),`weekday`),o=t.db.backend===`native`?`SQLite lokal`:`SQLite dev`;e.innerHTML=`
    <a class="skip-link" href="#page-content">Lewati ke konten</a>
    <div class="app-shell">
      <aside class="sidebar">
        <a class="brand" href="#/dashboard" aria-label="Manka — kembali ke dashboard">
          <span class="brand-mark" aria-hidden="true">M</span>
          <span class="brand-copy">
            <strong>Manka</strong>
            <small>Konveksi Manager</small>
          </span>
        </a>
        <nav class="sidebar-nav" aria-label="Navigasi utama">
          <div class="nav-group">
            ${r.map(e=>ja(e,`main`,`nav-link`)).join(``)}
          </div>
          <div class="nav-group">
            <p class="nav-label">Keuangan</p>
            ${ka.map(e=>ja(e,`finance`,`nav-link nav-link-sub`)).join(``)}
          </div>
          <div class="nav-group">
            ${i.map(e=>ja(e,`main`,`nav-link`)).join(``)}
          </div>
        </nav>
        <div class="sidebar-foot">
          <div class="local-status">
            <span class="status-dot" aria-hidden="true"></span>
            <div>
              <strong>${L(o)}</strong>
              <small>Data tersimpan di perangkat ini</small>
            </div>
          </div>
        </div>
      </aside>

      <div class="app-main">
        <header class="topbar">
          <div class="topbar-left">
            <a class="topbar-brand" href="#/dashboard" aria-label="Manka">M</a>
            <div class="topbar-context">
              <span data-page-label>Dashboard</span>
              <small>${L(a)}</small>
            </div>
          </div>
          <form class="topbar-search" role="search" data-global-search>
            <label class="sr-only" for="global-search">Cari nomor pesanan</label>
            ${B(`search`,`search-icon`)}
            <input id="global-search" type="search" name="search" placeholder="Cari nomor pesanan…" autocomplete="off" />
            <button type="submit" class="btn btn-secondary btn-sm">Cari</button>
          </form>
          <div class="topbar-right">
            <span class="local-badge" title="Aplikasi berjalan tanpa server. Semua data tersimpan lokal.">
              <span class="status-dot" aria-hidden="true"></span>
              Data lokal
            </span>
          </div>
        </header>
        <main id="page-content" class="page-content" tabindex="-1"></main>
      </div>

      <nav class="bottom-nav" aria-label="Navigasi bawah">
        ${Aa.map(e=>ja(e,`mobile`,`bottom-link`)).join(``)}
      </nav>
    </div>
  `;let s=e.querySelector(`#page-content`);if(!s)throw Error(`Kontainer halaman tidak ditemukan.`);let c=e.querySelector(`[data-page-label]`),l=e.querySelector(`[data-global-search]`),u=l?.querySelector(`input[name="search"]`);l?.addEventListener(`submit`,e=>{e.preventDefault();let t=u?.value.trim()??``;t===``?(u?.focus(),V(`Masukkan nomor pesanan yang ingin dicari.`,`info`)):n(`/orders?search=${encodeURIComponent(t)}`)});let d=Array.from(e.querySelectorAll(`[data-nav-kind][data-nav-href]`));return z(e),{pageHost:s,setActive(e){for(let t of d){let n=t.dataset.navHref??``,r=t.dataset.navKind;if(r!==`main`&&r!==`finance`&&r!==`mobile`)continue;let i=Ma(n,e,r);t.classList.toggle(`is-active`,i),i?t.setAttribute(`aria-current`,`page`):t.removeAttribute(`aria-current`)}},setPageLabel(e){c&&(c.textContent=e)}}}var Pa={shopee:`Shopee`,tiktok:`TikTok Shop`,other:`Lainnya`},Fa={active:`Aktif`,archived:`Diarsipkan`},Ia={active:`success`,archived:`neutral`},La={active:`Aktif`,inactive:`Nonaktif`},Ra={active:`success`,inactive:`neutral`},za={pending:`Menunggu`,processing:`Diproses`,shipped:`Dikirim`,delivered:`Diterima`,completed:`Selesai`,cancelled:`Batal`,returned:`Retur`,refunded:`Refund`},Ba={pending:`warning`,processing:`info`,shipped:`info`,delivered:`primary`,completed:`success`,cancelled:`neutral`,returned:`danger`,refunded:`danger`},Va={admin:`Administrasi`,service:`Layanan`,transaction:`Transaksi`,commission:`Komisi`,promotion:`Promosi`,other:`Lainnya`},Ha={actual:`Aktual`,estimated:`Estimasi`},Ua={actual:`neutral`,estimated:`warning`},Wa={shopee:`Shopee Ads`,tiktok:`TikTok Ads`,meta:`Meta Ads`,google:`Google Ads`,other:`Lainnya`},Ga={salary:`Gaji`,electricity:`Listrik`,internet:`Internet`,rent:`Sewa`,machine_maintenance:`Perawatan mesin`,supplies:`Bahan pendukung`,transportation:`Transportasi`,other:`Lainnya`},Ka={pending:`Menunggu`,completed:`Selesai`,rejected:`Ditolak`},qa={pending:`warning`,completed:`success`,rejected:`neutral`},Ja={pending:`Menunggu`,received:`Diterima`},Ya={pending:`warning`,received:`success`};function H(e){return`
    <header class="page-header">
      <div class="page-header-copy">
        ${e.eyebrow?`<p class="eyebrow">${L(e.eyebrow)}</p>`:``}
        <h1>${L(e.title)}</h1>
        ${e.subtitle?`<p class="page-subtitle">${L(e.subtitle)}</p>`:``}
      </div>
      ${e.actions?`<div class="page-actions">${e.actions}</div>`:``}
    </header>
  `}function U(e){return`
    <section class="card ${e.className??``}">
      ${e.title||e.actions?`<div class="card-head">
              <div>
                ${e.title?`<h2 class="card-title">${L(e.title)}</h2>`:``}
                ${e.subtitle?`<p class="card-subtitle">${L(e.subtitle)}</p>`:``}
              </div>
              ${e.actions?`<div class="card-actions">${e.actions}</div>`:``}
            </div>`:``}
      <div class="card-body ${e.padded===!1?`card-body-flush`:``}">${e.body}</div>
    </section>
  `}function W(e){return`
    <article class="kpi-card kpi-${e.tone??`default`}">
      <div class="kpi-top">
        <span class="kpi-label">${L(e.label)}</span>
        ${e.iconName?`<span class="kpi-icon">${B(e.iconName)}</span>`:``}
      </div>
      <p class="kpi-value">${L(e.value)}</p>
      <div class="kpi-foot">
        ${e.delta===void 0?``:Xa(e.delta,e.deltaLabel)}
        ${e.hint?`<span class="kpi-hint">${L(e.hint)}</span>`:``}
      </div>
    </article>
  `}function Xa(e,t=`vs periode sebelumnya`){if(e===null||!Number.isFinite(e))return`<span class="delta delta-neutral">${B(`minus`,`delta-icon`)} N/A <span>${L(t)}</span></span>`;let n=e>=0;return`<span class="delta ${n?`delta-up`:`delta-down`}">
    ${B(n?`trending-up`:`trending-down`,`delta-icon`)}
    ${L(`${n?`+`:``}${e.toFixed(1)}%`)}
    <span>${L(t)}</span>
  </span>`}function G(e,t=`neutral`,n=!1){return`<span class="badge badge-${t}">${n?`<span class="badge-dot" aria-hidden="true"></span>`:``}${L(e)}</span>`}function Za(e){let t=e.trim();return t===``||t.startsWith(`#`)||t.startsWith(`//`)||/^[a-z][a-z0-9+.-]*:/i.test(t)?t:t.startsWith(`/`)?`#${t}`:`#/${t}`}function K(e,t,n=`btn btn-secondary`,r){return`<a class="${n}" href="${R(Za(e))}">${r?B(r):``}<span>${L(t)}</span></a>`}function q(e){return`
    <div class="empty-state ${e.compact?`empty-compact`:``}">
      <div class="empty-icon">${B(e.iconName??`circle-question-mark`)}</div>
      <h3>${L(e.title)}</h3>
      <p>${L(e.description)}</p>
      ${e.action?`<div class="empty-actions">${e.action}</div>`:``}
    </div>
  `}function J(e=`Memuat data…`){return`
    <div class="loading-state" role="status" aria-live="polite">
      <span class="spinner spinner-lg" aria-hidden="true"></span>
      <p>${L(e)}</p>
    </div>
  `}function Qa(e,t){return`
    <div class="error-state" role="alert">
      <div class="error-icon">${B(`triangle-alert`)}</div>
      <h3>Data tidak dapat dimuat</h3>
      <p>${L(e)}</p>
      ${t?`<div class="error-actions">${t}</div>`:``}
    </div>
  `}function Y(e,t,n=``){return t.length===0?``:`
    <div class="table-wrap">
      <table class="data-table ${n}">
        <thead><tr>${e.map(e=>`<th scope="col">${L(e)}</th>`).join(``)}</tr></thead>
        <tbody>${t.map(t=>`<tr>${t.map((t,n)=>`<td data-label="${R(e[n]??``)}">${t}</td>`).join(``)}</tr>`).join(``)}</tbody>
      </table>
    </div>
  `}function $a(e){let t=Math.max(1,Math.ceil(e.total/Math.max(1,e.pageSize)));if(t<=1)return``;let n=Math.min(Math.max(1,e.page),t),r=[...new Set([1,t,n-1,n,n+1])].filter(e=>e>=1&&e<=t).sort((e,t)=>e-t),i=[],a=0;for(let e of r)e-a>1&&i.push(`<span class="page-gap">…</span>`),i.push(`<button type="button" class="page-btn ${e===n?`is-active`:``}" data-page="${e}" ${e===n?`aria-current="page"`:``}>${e}</button>`),a=e;return`
    <div class="pagination">
      <p class="pagination-info">Menampilkan ${e.pageSize*(n-1)+1}–${Math.min(e.total,e.pageSize*n)} dari ${e.total}</p>
      <div class="pagination-controls">
        <button type="button" class="page-btn" data-page="${n-1}" ${n<=1?`disabled`:``} aria-label="Halaman sebelumnya">${B(`chevron-left`)}</button>
        ${i.join(``)}
        <button type="button" class="page-btn" data-page="${n+1}" ${n>=t?`disabled`:``} aria-label="Halaman berikutnya">${B(`chevron-right`)}</button>
      </div>
    </div>
  `}function eo(e,t){e.addEventListener(`click`,e=>{let n=e.target;if(!(n instanceof Element))return;let r=n.closest(`button[data-page]`);if(!r||r.disabled)return;let i=Number(r.dataset.page);Number.isInteger(i)&&i>0&&t(i)})}function X(e){let t=`${e.idPrefix??`field`}-${e.name}`,n=e.type??`text`,r=e.value===null||e.value===void 0?``:String(e.value),i=e.required?` required aria-required="true"`:``,a=e.disabled?` disabled`:``,o;if(n===`select`)o=`<select class="input select" id="${R(t)}" name="${R(e.name)}"${i}${a}>
      ${(e.options??[]).map(e=>`<option value="${R(e.value)}" ${String(e.value)===r?`selected`:``}>${L(e.label)}</option>`).join(``)}
    </select>`;else if(n===`textarea`)o=`<textarea class="input textarea" id="${R(t)}" name="${R(e.name)}" rows="${e.rows??3}" placeholder="${R(e.placeholder??``)}"${i}${a}>${L(r)}</textarea>`;else if(n===`money`||n===`integer`)o=`<div class="input-affix"><span class="affix">${n===`money`?`Rp`:`#`}</span><input class="input" id="${R(t)}" name="${R(e.name)}" type="text" inputmode="numeric" value="${R(r)}" placeholder="${R(e.placeholder??(n===`money`?`0`:`1`))}"${i}${a} /></div>`;else{let s=e.autocomplete?` autocomplete="${R(e.autocomplete)}"`:` autocomplete="off"`,c=n===`date`?``:` inputmode="text"`;o=`<input class="input" id="${R(t)}" name="${R(e.name)}" type="${n}" value="${R(r)}" placeholder="${R(e.placeholder??``)}"${i}${a}${s}${c}${e.min===void 0?``:` min="${R(e.min)}"`}${e.max===void 0?``:` max="${R(e.max)}"`}${e.step===void 0?``:` step="${R(e.step)}"`} />`}return`
    <div class="field ${e.span?`span-2`:``}" data-field="${R(e.name)}">
      <label class="field-label" for="${R(t)}">
        ${L(e.label)}
        ${e.required?`<span class="required-mark" aria-hidden="true">*</span>`:`<span class="optional-mark">Opsional</span>`}
      </label>
      ${o}
      ${e.help?`<p class="field-help">${L(e.help)}</p>`:``}
      <p class="field-error" data-error-for="${R(e.name)}"></p>
    </div>
  `}function to(e){let t=`${e.idPrefix??`field`}-${e.name}`;return`
    <label class="checkbox-field" for="${R(t)}">
      <input type="checkbox" id="${R(t)}" name="${R(e.name)}" ${e.checked?`checked`:``} />
      <span>
        <strong>${L(e.label)}</strong>
        ${e.description?`<small>${L(e.description)}</small>`:``}
      </span>
    </label>
  `}function no(){return`<p class="form-error" data-form-error hidden role="alert"></p>`}function ro(e,t={}){return`
    <div class="form-actions">
      ${t.cancelHref?`<a class="btn btn-secondary" href="${R(t.cancelHref)}">${L(t.cancelLabel??`Batal`)}</a>`:`<button type="button" class="btn btn-secondary" data-modal-cancel>${L(t.cancelLabel??`Batal`)}</button>`}
      <button type="submit" class="btn btn-primary">${t.submitIcon?B(t.submitIcon):``}<span>${L(e)}</span></button>
      ${t.extra??``}
    </div>
  `}function Z(e,t,n){t?(e.dataset.originalHtml||(e.dataset.originalHtml=e.innerHTML),e.disabled=!0,e.innerHTML=`<span class="spinner" aria-hidden="true"></span><span>${L(n??`Memproses…`)}</span>`):(e.dataset.originalHtml&&(e.innerHTML=e.dataset.originalHtml),delete e.dataset.originalHtml,e.disabled=!1)}function io(e,t){return e.querySelector(`[data-field="${t}"]`)}function ao(e,t,n){let r=io(e,t);if(!r)return;r.classList.add(`has-error`);let i=r.querySelector(`[data-error-for="${t}"]`);i&&(i.textContent=n)}function oo(e){e.querySelectorAll(`.field.has-error`).forEach(e=>e.classList.remove(`has-error`)),e.querySelectorAll(`[data-error-for]`).forEach(e=>{e.textContent=``});let t=e.querySelector(`[data-form-error]`);t&&(t.textContent=``,t.hidden=!0)}function so(e,t){oo(e);let n=Qt(t);if(t instanceof N&&Object.keys(t.fieldErrors).length>0){for(let[n,r]of Object.entries(t.fieldErrors))ao(e,n,r);e.querySelector(`.field.has-error input, .field.has-error select, .field.has-error textarea`)?.focus()}let r=e.querySelector(`[data-form-error]`);return r?(r.textContent=n,r.hidden=!1):t instanceof N||V(n,`error`),n}function Q(e,t){let n=e.elements.namedItem(t);return n instanceof HTMLInputElement||n instanceof HTMLTextAreaElement||n instanceof HTMLSelectElement?n.value.trim():``}function co(e,t){let n=Q(e,t);return n===``?null:n}function lo(e,t,n,r={}){let i=Q(e,t);if(i===``){if(r.required)throw new N(`${n} wajib diisi.`,{[t]:`${n} wajib diisi.`});return 0}let a=kn(i);if(a===null||a<0)throw new N(`${n} tidak valid.`,{[t]:`${n} harus berupa nominal Rupiah bulat minimal 0.`});return a}function uo(e,t,n){let r=Q(e,t);if(r===``)return null;let i=kn(r);if(i===null||i<0)throw new N(`${n} tidak valid.`,{[t]:`${n} harus berupa nominal Rupiah bulat minimal 0.`});return i}function fo(e,t,n,r={}){let i=Q(e,t);if(i===``){if(r.required)throw new N(`${n} wajib diisi.`,{[t]:`${n} wajib diisi.`});return 0}let a=An(i),o=r.min??0;if(a===null||a<o)throw new N(`${n} tidak valid.`,{[t]:`${n} harus berupa bilangan bulat minimal ${o}.`});return a}function po(e,t,n){let r=Q(e,t);if(r===``)return null;let i=An(r);if(i===null||i<0)throw new N(`${n} tidak valid.`,{[t]:`${n} harus berupa bilangan bulat minimal 0.`});return i}function mo(e,t){let n=e.elements.namedItem(t);return n instanceof HTMLInputElement&&n.checked}var ho=0,go=new Set;function _o(e){let t=document.getElementById(`overlay-root`)??document.body,n=`modal-title-${++ho}`,r=document.createElement(`dialog`);r.className=`modal modal-${e.size??`md`}`,r.setAttribute(`aria-labelledby`,n),r.innerHTML=`
    <div class="modal-panel">
      <div class="modal-head">
        <div>
          <h2 id="${n}">${L(e.title)}</h2>
          ${e.description?`<p>${L(e.description)}</p>`:``}
        </div>
        <button type="button" class="btn btn-ghost btn-icon modal-close" aria-label="Tutup dialog" title="Tutup">${B(`x`)}</button>
      </div>
      <div class="modal-body">${e.body}</div>
      ${e.footer?`<div class="modal-foot">${e.footer}</div>`:``}
    </div>
  `;let i,a=()=>{r.open&&r.close(),r.isConnected&&r.remove(),go.delete(r)};return r.addEventListener(`close`,()=>{go.delete(r),r.remove(),typeof i==`function`&&i()}),r.addEventListener(`click`,e=>{e.target===r&&a()}),r.querySelector(`.modal-close`)?.addEventListener(`click`,a),r.querySelectorAll(`[data-modal-cancel]`).forEach(e=>{e.addEventListener(`click`,a)}),t.appendChild(r),go.add(r),r.showModal(),z(r),i=e.onMount?.(r),{dialog:r,close:a}}function vo(){for(let e of[...go])e.open&&e.close(),e.remove(),go.delete(e)}function yo(e){return new Promise(t=>{let n=!1,r=e.requireText?`<div class="confirm-requirement">
          <label class="field-label" for="confirm-text">Ketik <strong>${L(e.requireText)}</strong> untuk melanjutkan</label>
          <input class="input" id="confirm-text" type="text" autocomplete="off" spellcheck="false" />
        </div>`:``,i=e.details?.length?`<ul class="confirm-details">${e.details.map(e=>`<li>${L(e)}</li>`).join(``)}</ul>`:``,a=_o({title:e.title,size:`sm`,body:`<p class="confirm-message">${L(e.message)}</p>${i}${r}`,footer:`
        <button type="button" class="btn btn-secondary" data-confirm-cancel>${L(e.cancelLabel??`Batal`)}</button>
        <button type="button" class="btn ${e.tone===`danger`?`btn-danger`:`btn-primary`}" data-confirm-ok ${e.requireText?`disabled`:``}>${L(e.confirmLabel??`Lanjutkan`)}</button>
      `}),o=a.dialog.querySelector(`[data-confirm-ok]`),s=a.dialog.querySelector(`#confirm-text`);s&&o&&(s.addEventListener(`input`,()=>{o.disabled=s.value.trim()!==(e.requireText??``)}),s.focus()),a.dialog.querySelector(`[data-confirm-cancel]`)?.addEventListener(`click`,()=>{a.close()}),o?.addEventListener(`click`,()=>{o.disabled||(n=!0,a.close())}),a.dialog.addEventListener(`close`,()=>{t(n)})})}async function bo(e,t=`Disalin ke clipboard.`){try{if(navigator.clipboard&&window.isSecureContext)await navigator.clipboard.writeText(e);else{let t=document.createElement(`textarea`);t.value=e,t.setAttribute(`readonly`,``),t.style.position=`fixed`,t.style.opacity=`0`,document.body.appendChild(t),t.select();let n=document.execCommand(`copy`);if(t.remove(),!n)throw Error(`Clipboard tidak tersedia.`)}V(t,`success`)}catch{V(`Data tidak dapat disalin pada perangkat ini.`,`error`)}}function xo(e){let t=e.get(`period`);return t&&ke.some(e=>e.value===t)?t:`thisMonth`}function So(e){let t=xo(e),n=e.get(`from`)??``,r=e.get(`to`)??``,i=ze(n)&&ze(r)?{from:n,to:r}:void 0,a;try{a=Xe(t,i,w())}catch{a=Xe(`thisMonth`,void 0,w())}let o=e.get(`storeId`);return{period:a,storeId:o&&o.trim()!==``?o:null}}function Co(e,t,n={}){let r=[];n.allLabel!==void 0&&r.push({value:``,label:n.allLabel});for(let i of e)n.activeOnly&&i.status===`archived`&&i.id!==t||(n.includeArchived||i.status!==`archived`||i.id===t)&&r.push({value:i.id,label:`${i.name}${i.status===`archived`?` (arsip)`:``}`});return r}function wo(e,t){return Co(e,t,{allLabel:`Semua toko`,includeArchived:!0}).map(e=>`<option value="${R(e.value)}" ${e.value===(t??``)?`selected`:``}>${L(e.label)}</option>`).join(``)}function To(e,t,n={}){let r=n.showStore??!0,i=n.showPeriod??!0,a=e.period.preset===`custom`;return`
    <div class="filter-bar" data-filter-bar>
      ${i?`<div class="filter-control">
              <label class="filter-label" for="filter-period">Periode</label>
              <select class="input select" id="filter-period" data-filter-period>
                ${ke.map(t=>`<option value="${t.value}" ${t.value===e.period.preset?`selected`:``}>${L(t.label)}</option>`).join(``)}
              </select>
            </div>
            <div class="filter-control filter-dates" data-filter-dates ${a?``:`hidden`}>
              <div class="date-field">
                <label class="filter-label" for="filter-from">Dari</label>
                <input class="input" id="filter-from" type="date" data-filter-from value="${R(e.period.from)}" />
              </div>
              <span class="date-separator" aria-hidden="true">—</span>
              <div class="date-field">
                <label class="filter-label" for="filter-to">Sampai</label>
                <input class="input" id="filter-to" type="date" data-filter-to value="${R(e.period.to)}" />
              </div>
              <button type="button" class="btn btn-secondary btn-sm" data-filter-apply>Terapkan</button>
            </div>`:``}
      ${r?`<div class="filter-control">
              <label class="filter-label" for="filter-store">Toko</label>
              <select class="input select" id="filter-store" data-filter-store>
                ${wo(t,e.storeId)}
              </select>
            </div>`:``}
      <span class="filter-range">${B(`calendar-days`,`filter-icon`)} ${L(e.period.label)}</span>
    </div>
  `}function Eo(e,t,n){let r=new URLSearchParams(t.toString());for(let[e,t]of Object.entries(n))t==null||t===``?r.delete(e):r.set(e,String(t));let i=r.toString();return i===``?e:`${e}?${i}`}function Do(e,t){let n=e.querySelectorAll(`[data-filter-apply]`),r=e.querySelector(`[data-filter-period]`),i=e.querySelector(`[data-filter-store]`),a=e.querySelector(`[data-filter-dates]`),o=e.querySelector(`[data-filter-from]`),s=e.querySelector(`[data-filter-to]`),c=e=>{t.navigate(Eo(t.path,t.query,{...e,page:null}))};r?.addEventListener(`change`,()=>{let e=r.value;e===`custom`?(a&&(a.hidden=!1),o?.focus()):(a&&(a.hidden=!0),c({period:e,from:null,to:null}))});for(let e of n)e.addEventListener(`click`,()=>{let e=o?.value??``,t=s?.value??``;!ze(e)||!ze(t)?V(`Pilih tanggal awal dan akhir yang valid.`,`error`):e>t?V(`Tanggal awal tidak boleh setelah tanggal akhir.`,`error`):c({period:`custom`,from:e,to:t})});i?.addEventListener(`change`,()=>{c({storeId:i.value||null})})}var Oo=`'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif`;async function ko(){return(await de(()=>import(`./auto-DDJxwizk.js`),[])).default}function Ao(e,t){return{responsive:!0,maintainAspectRatio:!1,interaction:{mode:`index`,intersect:!1},animation:{duration:300},plugins:{legend:{display:e.length>1,position:`bottom`,labels:{usePointStyle:!0,pointStyle:`circle`,boxWidth:7,boxHeight:7,padding:16,color:`#667085`,font:{size:12}}},tooltip:{backgroundColor:`#172033`,titleColor:`#FFFFFF`,bodyColor:`#E6EAF0`,padding:10,cornerRadius:8,displayColors:!0,callbacks:{label:e=>{let n=e.parsed.y,r=typeof n==`number`?n:0,i=t.currency?F(r):String(r);return` ${e.dataset.label??``}: ${i}`}}}},scales:{x:{grid:{display:!1},border:{display:!1},ticks:{color:`#667085`,font:{size:11},maxRotation:0,autoSkip:!0,maxTicksLimit:8}},y:{beginAtZero:!0,border:{display:!1},grid:{color:`rgba(230, 234, 240, 0.8)`},ticks:{color:`#667085`,font:{size:11},callback:e=>{let n=typeof e==`number`?e:Number(e);return t.currency?En(n):String(n)}}}}}}async function jo(e,t,n,r={}){if(r.signal?.aborted)return null;let i=await ko();return r.signal?.aborted?null:(i.defaults.font.family=Oo,i.defaults.color=`#667085`,new i(e,{type:`line`,data:{labels:t,datasets:n.map(e=>({label:e.label,data:e.data,borderColor:e.color,backgroundColor:e.fillColor??`transparent`,fill:e.fill??!1,tension:.3,borderWidth:2,pointRadius:0,pointHoverRadius:4,pointBackgroundColor:e.color}))},options:Ao(n,r)}))}function $(e,t,n){t.signal.aborted||(e.innerHTML=Qa(Qt(n,`Data gagal dimuat. Silakan coba lagi.`),`<button type="button" class="btn btn-primary" data-retry-page>Muat ulang</button>`),e.querySelector(`[data-retry-page]`)?.addEventListener(`click`,()=>{t.refresh()}))}function Mo(e,t){e.navigate(Eo(e.path,e.query,t))}function No(e,t=1){if(!e)return t;let n=Number(e);return Number.isInteger(n)&&n>0?n:t}var Po=async e=>{let{root:t,services:n}=e;t.innerHTML=J(`Menghitung ringkasan bisnis…`);let r;try{let i=So(e.query);if(r=await n.dashboardService.load(i.period,i.storeId),e.signal.aborted)return;e.setTitle(`Dashboard`);let a=r.stores,o=r.summary,s=a.length>0,c=o.orderCount>0||o.grossSales!==0||o.marketplaceFees!==0||o.advertisingSpend!==0||o.operationalExpenses!==0||o.refunds!==0,l=i.storeId?a.find(e=>e.id===i.storeId)?.name:null,u=`vs ${D(r.previousRange.from)} – ${D(r.previousRange.to)}`,d=s?`${K(`/orders/import`,`Import`,`btn btn-secondary`,`upload`)}
         ${K(`/orders/new`,`Tambah pesanan`,`btn btn-primary`,`plus`)}`:K(`/stores/new`,`Tambah toko`,`btn btn-primary`,`plus`),f=s?``:U({className:`onboarding-card`,body:q({iconName:`store`,title:`Mulai dengan menambahkan toko`,description:`Buat toko pertama, lengkapi profile, lalu tambahkan produk dan pesanan. Semua data tersimpan di perangkat ini tanpa server.`,action:`
                ${K(`/stores/new`,`Tambah toko pertama`,`btn btn-primary`,`plus`)}
                <a class="btn btn-secondary" href="#/settings">Buka pengaturan</a>
              `})}),p=s?To(i,a):``,m=s?`
        <div class="kpi-grid">
          ${W({label:`Omzet`,value:F(o.grossSales),iconName:`coins`,delta:r.comparison.grossSalesChangePercent,deltaLabel:u,hint:l??`Semua toko`})}
          ${W({label:`Penjualan bersih`,value:F(o.netSales),iconName:`banknote`,delta:r.comparison.netSalesChangePercent,deltaLabel:u,hint:`${I(o.unitsSold)} unit terjual`})}
          ${W({label:`Laba operasional`,value:F(o.operatingProfit),iconName:o.operatingProfit>=0?`trending-up`:`trending-down`,tone:o.operatingProfit>=0?`positive`:`negative`,delta:r.comparison.operatingProfitChangePercent,deltaLabel:u,hint:o.marginPercent===null?`Margin N/A`:`Margin ${Dn(o.marginPercent)}`})}
          ${W({label:`Pesanan`,value:I(o.orderCount),iconName:`shopping-bag`,hint:`Rata-rata ${F(o.averageOrderValue)} per pesanan`})}
        </div>
      `:``,h=c?`
        <div class="chart-grid">
          ${U({title:`Omzet dan penjualan bersih`,subtitle:`Nilai harian berdasarkan tanggal transaksi`,body:`<div class="chart-box"><canvas id="dashboard-sales-chart" aria-label="Grafik omzet dan penjualan bersih" role="img"></canvas></div>`})}
          ${U({title:`Laba operasional harian`,subtitle:`Setelah HPP, biaya marketplace, iklan, dan operasional`,body:`<div class="chart-box"><canvas id="dashboard-profit-chart" aria-label="Grafik laba operasional" role="img"></canvas></div>`})}
        </div>

        <div class="dashboard-lower-grid">
          ${U({title:`Ringkasan biaya`,subtitle:`Biaya yang diperhitungkan pada periode ini`,actions:K(`/finance`,`Rincian`,`btn btn-ghost btn-sm`,`arrow-right`),body:`
              <ul class="cost-list">
                <li><span>${B(`refresh-cw`)} Refund selesai</span><strong class="value-negative">${F(-o.refunds)}</strong></li>
                <li><span>${B(`package`)} HPP terjual</span><strong>${F(o.cogs)}</strong></li>
                <li><span>${B(`credit-card`)} Biaya marketplace</span><strong>${F(o.marketplaceFees)}</strong></li>
                ${o.marketplaceFeesEstimated>0?`<li class="cost-sub"><span>Termasuk estimasi</span><strong>${F(o.marketplaceFeesEstimated)}</strong></li>`:``}
                <li><span>${B(`megaphone`)} Biaya iklan</span><strong>${F(o.advertisingSpend)}</strong></li>
                <li><span>${B(`receipt`)} Biaya operasional</span><strong>${F(o.operationalExpenses)}</strong></li>
                <li><span>${B(`banknote`)} Dana settlement diterima</span><strong>${F(r.receivedSettlements)}</strong></li>
              </ul>
              <p class="inline-note">Settlement adalah pencairan dana, bukan tambahan omzet.</p>
            `})}
          ${U({title:`Performa toko`,subtitle:l?`Toko ${l}`:`Diurutkan dari penjualan bersih`,actions:K(`/stores`,`Semua toko`,`btn btn-ghost btn-sm`,`arrow-right`),body:r.storePerformance.length?Y([`Toko`,`Pesanan`,`Penjualan bersih`,`Laba`],r.storePerformance.map(e=>[`<a class="table-link" href="#/stores/${e.storeId}">${L(e.storeName)}</a><span class="table-sub">${Pa[e.platform]}</span>`,I(e.summary.orderCount),F(e.summary.netSales),`<span class="${e.summary.operatingProfit>=0?`value-positive`:`value-negative`}">${F(e.summary.operatingProfit)}</span>`])):q({compact:!0,iconName:`store`,title:`Belum ada performa toko`,description:`Performa muncul setelah ada transaksi pada periode ini.`})})}
        </div>

        ${U({title:`Transaksi terbaru`,subtitle:`Enam pesanan terakhir yang tersimpan`,actions:K(`/orders`,`Lihat semua pesanan`,`btn btn-ghost btn-sm`,`arrow-right`),body:r.recentOrders.length?Y([`Pesanan`,`Tanggal`,`Status`,`Omzet kotor`,``],r.recentOrders.map(e=>[`<a class="table-link" href="#/orders/${e.id}">${L(e.marketplaceOrderId)}</a><span class="table-sub">${L(e.storeName)}</span>`,D(e.orderDate),G(za[e.status],Ba[e.status]),F(e.grossSales),`<a class="btn btn-ghost btn-sm" href="#/orders/${e.id}">Buka</a>`])):q({compact:!0,iconName:`shopping-bag`,title:`Belum ada pesanan`,description:`Pesanan yang ditambahkan atau diimpor akan muncul di sini.`})})}
      `:U({body:q({iconName:`chart-line`,title:`Belum ada aktivitas pada periode ini`,description:`Tambahkan pesanan secara manual atau import file marketplace. Ringkasan akan dihitung dari transaksi yang benar-benar tersimpan.`,action:`${K(`/orders/new`,`Tambah pesanan`,`btn btn-primary`,`plus`)}
              ${K(`/orders/import`,`Import CSV / XLSX`,`btn btn-secondary`,`upload`)}`})});if(t.innerHTML=`
      ${H({eyebrow:l?`Toko ${l}`:`Semua toko`,title:`Dashboard`,subtitle:`${r.range.from===r.range.to?D(r.range.from,`long`):`${D(r.range.from,`long`)} – ${D(r.range.to,`long`)}`}`,actions:d})}
      ${p}
      ${f}
      ${m}
      ${s&&c&&o.hasEstimatedFees?`<p class="inline-note note-warning">${B(`triangle-alert`)} Sebagian biaya marketplace adalah estimasi. Laba operasional dapat berubah saat biaya aktual dicatat.</p>`:``}
      ${l&&(o.sharedAdvertisingSpend>0||o.sharedOperationalExpenses>0)?`<p class="inline-note">${B(`info`)} Biaya bersama tidak dialokasikan ke toko yang dipilih.</p>`:``}
      <div class="dashboard-stack">${h}</div>
    `,s&&Do(t,e),s&&c){let n=r.daily.map(e=>D(e.date)),i=t.querySelector(`#dashboard-sales-chart`);if(i){let t=await jo(i,n,[{label:`Omzet`,data:r.daily.map(e=>e.grossSales),color:`#2563EB`,fillColor:`rgba(37, 99, 235, 0.10)`,fill:!0},{label:`Penjualan bersih`,data:r.daily.map(e=>e.netSales),color:`#0891B2`}],{currency:!0,signal:e.signal});t&&e.onCleanup(()=>t.destroy())}let a=t.querySelector(`#dashboard-profit-chart`);if(a){let t=await jo(a,n,[{label:`Laba operasional`,data:r.daily.map(e=>e.operatingProfit),color:`#16A34A`,fillColor:`rgba(22, 163, 74, 0.10)`,fill:!0}],{currency:!0,signal:e.signal});t&&e.onCleanup(()=>t.destroy())}}}catch(n){$(t,e,n)}};function Fo(e){let t=e.email||e.phone?[e.email?B(`mail`)+`<span>${L(e.email)}</span>`:``,e.phone?B(`phone`)+`<span>${L(e.phone)}</span>`:``].filter(Boolean).join(``):`<span class="muted">Email dan nomor HP belum diisi</span>`;return`
    <article class="store-card" data-platform="${e.platform}">
      <div class="store-card-top">
        <span class="store-platform-icon">${B(`store`)}</span>
        <div class="store-card-badges">
          ${G(Pa[e.platform],e.platform===`shopee`?`warning`:e.platform===`tiktok`?`neutral`:`info`)}
          ${G(Fa[e.status],Ia[e.status])}
        </div>
      </div>
      <h2 class="store-card-name"><a href="#/stores/${e.id}">${L(e.name)}</a></h2>
      <p class="store-contact">${t}</p>
      <div class="store-card-foot">
        <a class="btn btn-secondary btn-sm" href="#/stores/${e.id}">Buka</a>
        <div class="store-card-actions">
          <a class="btn btn-ghost btn-icon" href="#/stores/${e.id}/edit" aria-label="Ubah ${R(e.name)}" title="Ubah toko">${B(`pencil`)}</a>
          <button type="button" class="btn btn-ghost btn-icon" data-store-toggle="${e.id}" data-store-status="${e.status}" aria-label="${e.status===`active`?`Arsipkan`:`Aktifkan`} ${R(e.name)}" title="${e.status===`active`?`Arsipkan`:`Aktifkan`}">
            ${B(e.status===`active`?`archive`:`archive-restore`)}
          </button>
        </div>
      </div>
    </article>
  `}var Io=async e=>{let{root:t,services:n}=e;t.innerHTML=J(`Memuat daftar toko…`);try{let r=e.query.get(`search`)?.trim()??``,i=e.query.get(`platform`)??``,a=i&&$t.includes(i)?i:null,o=e.query.get(`archived`)===`1`,s=await n.storeService.list({search:r,platform:a,includeArchived:o});if(e.signal.aborted)return;e.setTitle(`Toko`);let c=r!==``||a!==null,l=(await n.storeService.listAll()).length,u=s.map(Fo).join(``),d=c?``:`<a class="store-card store-card-add" href="#/stores/new">
          <span class="store-add-icon">${B(`plus`)}</span>
          <strong>Tambah toko</strong>
          <small>Buat profile toko baru</small>
        </a>`,f=q(l===0?{iconName:`store`,title:`Belum ada toko`,description:`Tambahkan toko Shopee, TikTok Shop, atau toko lain. Setiap transaksi akan terhubung ke toko yang tepat.`,action:K(`/stores/new`,`Tambah toko pertama`,`btn btn-primary`,`plus`)}:{iconName:`search`,title:`Toko tidak ditemukan`,description:`Tidak ada toko yang sesuai dengan pencarian atau filter yang dipilih.`,action:`<a class="btn btn-secondary" href="#/stores">${B(`refresh-cw`)}<span>Reset filter</span></a>`});t.innerHTML=`
      ${H({eyebrow:`Multi-toko`,title:`Toko`,subtitle:`Kelola identitas, profile, dan status setiap toko dalam satu tempat.`,actions:K(`/stores/new`,`Tambah toko`,`btn btn-primary`,`plus`)})}

      <div class="filter-bar store-filter-bar">
        <form class="filter-search" data-store-search role="search">
          <label class="filter-label" for="store-search">Cari toko</label>
          <div class="search-input-wrap">
            ${B(`search`,`search-icon`)}
            <input class="input" id="store-search" name="search" type="search" value="${R(r)}" placeholder="Nama, email, atau nomor HP…" autocomplete="off" />
            <button type="submit" class="btn btn-secondary btn-sm">Cari</button>
          </div>
        </form>
        <div class="filter-control">
          <label class="filter-label" for="store-platform">Platform</label>
          <select class="input select" id="store-platform" data-store-platform>
            <option value="">Semua platform</option>
            ${$t.map(e=>`<option value="${e}" ${e===a?`selected`:``}>${Pa[e]}</option>`).join(``)}
          </select>
        </div>
        <label class="filter-check">
          <input type="checkbox" data-store-archived ${o?`checked`:``} />
          <span>Tampilkan arsip</span>
        </label>
      </div>

      ${s.length>0?`<div class="store-grid">${u}${d}</div>`:`<div class="card"><div class="card-body">${f}</div></div>`}
    `;let p=t.querySelector(`[data-store-search]`);p?.addEventListener(`submit`,t=>{t.preventDefault();let n=p.querySelector(`input[name="search"]`);e.navigate(Eo(e.path,e.query,{search:n?.value.trim()||null}))}),t.querySelector(`[data-store-platform]`)?.addEventListener(`change`,t=>{let n=t.currentTarget;e.navigate(Eo(e.path,e.query,{platform:n.value||null}))}),t.querySelector(`[data-store-archived]`)?.addEventListener(`change`,t=>{let n=t.currentTarget;e.navigate(Eo(e.path,e.query,{archived:n.checked?`1`:null}))});for(let r of t.querySelectorAll(`[data-store-toggle]`))r.addEventListener(`click`,async()=>{let t=r.dataset.storeToggle,i=r.dataset.storeStatus;if(t&&i&&(i!==`active`||await yo({title:`Arsipkan toko?`,message:`Toko akan disembunyikan dari pilihan transaksi baru, tetapi seluruh pesanan, produk, dan data keuangan tetap tersimpan.`,confirmLabel:`Arsipkan toko`,tone:`primary`}))){r.disabled=!0;try{i===`active`?(await n.storeService.archive(t),V(`Toko diarsipkan. Data transaksi tetap tersimpan.`,`success`)):(await n.storeService.restore(t),V(`Toko diaktifkan kembali.`,`success`)),e.refresh()}catch(e){V(e instanceof Error?e.message:`Status toko gagal diubah.`,`error`),r.disabled=!1}}});z(t)}catch(n){$(t,e,n)}};function Lo(e,t,n={}){return`
    <div class="finance-row ${n.strong?`finance-row-strong`:``}">
      <dt>
        ${L(e)}
        ${n.hint?`<small>${L(n.hint)}</small>`:``}
      </dt>
      <dd class="${n.negative?`value-negative`:``} ${n.tone===`positive`?`value-positive`:``} ${n.tone===`negative`?`value-negative`:``}">${L(t)}</dd>
    </div>
  `}function Ro(e,t){let n=t===null&&(e.sharedAdvertisingSpend>0||e.sharedOperationalExpenses>0)?`Termasuk biaya bersama`:t===null?void 0:`Biaya bersama tidak dialokasikan ke toko`;return`
    <dl class="finance-breakdown">
      ${Lo(`Omzet`,F(e.grossSales),{strong:!0})}
      ${Lo(`Diskon penjual`,F(-e.sellerDiscount),{negative:!0})}
      ${Lo(`Refund selesai`,F(-e.refunds),{negative:!0})}
      ${Lo(`Penjualan bersih`,F(e.netSales),{strong:!0})}
      ${Lo(`HPP terjual`,F(-e.cogs),{negative:!0})}
      ${Lo(`Laba kotor`,F(e.grossProfit),{strong:!0,tone:e.grossProfit>=0?`positive`:`negative`})}
      ${Lo(`Biaya marketplace aktual`,F(-e.marketplaceFeesActual),{negative:!0})}
      ${e.marketplaceFeesEstimated>0?Lo(`Biaya marketplace estimasi`,F(-e.marketplaceFeesEstimated),{negative:!0,hint:`Estimasi, bukan biaya aktual`}):``}
      ${Lo(`Biaya iklan`,F(-e.advertisingSpend),{negative:!0,hint:n})}
      ${Lo(`Biaya operasional`,F(-e.operationalExpenses),{negative:!0,hint:n})}
      ${Lo(`Laba operasional`,F(e.operatingProfit),{strong:!0,tone:e.operatingProfit>=0?`positive`:`negative`})}
      ${Lo(`Margin operasional`,e.marginPercent===null?`N/A`:Dn(e.marginPercent))}
    </dl>
    ${e.hasEstimatedFees?`<p class="inline-note note-warning">${B(`triangle-alert`)} Sebagian biaya marketplace masih berupa estimasi dan diberi label.</p>`:``}
  `}function zo(e){return e?`Biaya bersama tanpa toko tidak dimasukkan ke ringkasan per toko. Settlement tidak dihitung sebagai pendapatan baru.`:`Semua toko digabung. Settlement adalah arus kas pencairan dan tidak menambah omzet.`}var Bo=[{id:`ringkasan`,label:`Ringkasan`},{id:`profile`,label:`Profile Toko`},{id:`pesanan`,label:`Pesanan`},{id:`keuangan`,label:`Keuangan`},{id:`iklan`,label:`Iklan`}];function Vo(e){return e.map(e=>[`<span class="table-strong">${L(e.name)}</span><span class="table-sub">${L(e.storeName??`Kampanye bersama`)}</span>`,F(e.totalSpend),e.totalAttributedRevenue===null?`N/A`:F(e.totalAttributedRevenue),e.roas===null?`N/A`:`${On(e.roas)}×`,e.acos===null?`N/A`:Dn(e.acos),I(e.expenseCount),`<a class="btn btn-ghost btn-sm" href="#/finance/ads/${encodeURIComponent(e.id)}">Buka</a>`])}var Ho=async e=>{let{root:t,services:n}=e,r=e.params.id??``,i=e.query.get(`tab`)??`ringkasan`,a=Bo.some(e=>e.id===i)?i:`ringkasan`;t.innerHTML=J(`Memuat toko…`);try{let i=await n.storeService.get(r),o=await n.stores.countTransactions(r);if(e.signal.aborted)return;e.setTitle(i.name);let s=Xe(`thisMonth`,void 0,w()),c=``,l=()=>void 0;if(a===`ringkasan`){let[a,u]=await Promise.all([n.financeService.getSummary(s,r),n.orderService.list({storeId:r,page:1,pageSize:6})]);if(e.signal.aborted)return;c=`
        <div class="kpi-grid kpi-grid-3">
          ${W({label:`Omzet bulan ini`,value:F(a.grossSales),iconName:`coins`,hint:`${I(a.orderCount)} pesanan`})}
          ${W({label:`Penjualan bersih`,value:F(a.netSales),iconName:`banknote`,hint:`${I(a.unitsSold)} unit`})}
          ${W({label:`Laba operasional`,value:F(a.operatingProfit),iconName:a.operatingProfit>=0?`trending-up`:`trending-down`,tone:a.operatingProfit>=0?`positive`:`negative`,hint:a.marginPercent===null?`Margin N/A`:`Margin ${Dn(a.marginPercent)}`})}
        </div>
        <div class="detail-grid">
          ${U({title:`Aksi cepat`,subtitle:`Transaksi baru selalu terkait toko ini`,body:`
              <div class="quick-actions">
                <a class="quick-action" href="#/orders/new?storeId=${i.id}">
                  <span>${B(`plus`)}</span><strong>Tambah pesanan</strong><small>Input manual</small>
                </a>
                <a class="quick-action" href="#/orders/import?storeId=${i.id}">
                  <span>${B(`upload`)}</span><strong>Import pesanan</strong><small>CSV atau XLSX</small>
                </a>
                <a class="quick-action" href="#/finance/fees?storeId=${i.id}">
                  <span>${B(`credit-card`)}</span><strong>Biaya marketplace</strong><small>Catat potongan</small>
                </a>
                <a class="quick-action" href="#/finance/ads?storeId=${i.id}">
                  <span>${B(`megaphone`)}</span><strong>Iklan</strong><small>Kampanye toko</small>
                </a>
              </div>
            `})}
          ${U({title:`Ringkasan bulan ini`,subtitle:s.label,actions:K(`/finance?storeId=${i.id}&period=thisMonth`,`Keuangan toko`,`btn btn-ghost btn-sm`,`arrow-right`),body:Ro(a,r)+`<p class="inline-note">${L(zo(r))}</p>`})}
        </div>
        ${U({title:`Pesanan terbaru`,subtitle:`Enam pesanan terakhir dari toko ini`,actions:K(`/orders?storeId=${i.id}`,`Lihat semua`,`btn btn-ghost btn-sm`,`arrow-right`),body:u.items.length?Y([`Pesanan`,`Tanggal`,`Status`,`Omzet kotor`,``],u.items.map(e=>[`<a class="table-link" href="#/orders/${e.id}">${L(e.marketplaceOrderId)}</a>`,D(e.orderDate),G(za[e.status],Ba[e.status]),F(e.grossSales),`<a class="btn btn-ghost btn-sm" href="#/orders/${e.id}">Buka</a>`])):q({compact:!0,iconName:`shopping-bag`,title:`Belum ada pesanan`,description:`Input manual atau import pesanan untuk toko ini.`,action:K(`/orders/new?storeId=${i.id}`,`Tambah pesanan`,`btn btn-primary btn-sm`,`plus`)})})}
        ${U({title:`Kelola toko`,subtitle:`Data transaksi tidak dihapus saat toko diarsipkan`,body:`
            <div class="danger-zone">
              <div>
                <strong>${i.status===`active`?`Arsipkan toko`:`Aktifkan toko`}</strong>
                <p>${i.status===`active`?`Toko akan disembunyikan dari pilihan transaksi baru. Semua data tetap tersimpan.`:`Toko akan muncul kembali pada pilihan transaksi baru.`}</p>
              </div>
              <button type="button" class="btn btn-secondary btn-sm" data-store-archive>
                ${B(i.status===`active`?`archive`:`archive-restore`)}
                <span>${i.status===`active`?`Arsipkan`:`Aktifkan`}</span>
              </button>
            </div>
            <div class="danger-zone danger-row">
              <div>
                <strong>Hapus toko</strong>
                <p>${o>0?`Tidak dapat dihapus: masih ada ${o} transaksi/profil terkait. Gunakan arsip agar data tetap aman.`:`Toko belum memiliki transaksi. Penghapusan menghilangkan profile toko secara permanen.`}</p>
              </div>
              <button type="button" class="btn btn-danger btn-sm" data-store-delete ${o>0?`disabled`:``}>
                ${B(`trash`)}<span>Hapus toko</span>
              </button>
            </div>
          `})}
      `,l=()=>{t.querySelector(`[data-store-archive]`)?.addEventListener(`click`,async t=>{let r=t.currentTarget;if(i.status!==`active`||await yo({title:`Arsipkan toko?`,message:`Toko disembunyikan dari pilihan baru, tetapi pesanan dan laporan tetap dapat diakses melalui arsip.`,confirmLabel:`Arsipkan toko`,tone:`primary`})){Z(r,!0,`Menyimpan…`);try{i.status===`active`?(await n.storeService.archive(i.id),V(`Toko diarsipkan.`,`success`)):(await n.storeService.restore(i.id),V(`Toko diaktifkan kembali.`,`success`)),e.refresh()}catch(e){V(e instanceof Error?e.message:`Status toko gagal diubah.`,`error`),Z(r,!1)}}}),t.querySelector(`[data-store-delete]`)?.addEventListener(`click`,async()=>{if(await yo({title:`Hapus toko secara permanen?`,message:`Profile toko "${i.name}" akan dihapus. Tindakan ini tidak dapat dibatalkan.`,confirmLabel:`Hapus toko`,tone:`danger`,requireText:i.name,details:[`Toko hanya dapat dihapus jika belum memiliki transaksi.`]}))try{await n.storeService.delete(i.id),V(`Toko dihapus.`,`success`),e.navigate(`/stores`)}catch(e){V(e instanceof Error?e.message:`Toko gagal dihapus.`,`error`)}})}}if(a===`profile`&&(c=`
        <div class="detail-grid">
          ${U({title:`Informasi toko`,subtitle:`Identitas dasar dan kontak`,actions:K(`/stores/${i.id}/edit`,`Ubah`,`btn btn-secondary btn-sm`,`pencil`),body:`
              <dl class="detail-list">
                <div><dt>Nama toko</dt><dd>${L(i.name)}</dd></div>
                <div><dt>Platform</dt><dd>${G(Pa[i.platform],i.platform===`shopee`?`warning`:i.platform===`tiktok`?`neutral`:`info`)}</dd></div>
                <div><dt>Email toko</dt><dd>${i.email?L(i.email):`<span class="muted">Belum diisi</span>`}</dd></div>
                <div><dt>Nomor HP</dt><dd>${i.phone?L(i.phone):`<span class="muted">Belum diisi</span>`}</dd></div>
                <div><dt>Nama KTP</dt><dd>${i.ktpName?L(i.ktpName):`<span class="muted">Belum diisi</span>`}</dd></div>
                <div><dt>Status</dt><dd>${G(Fa[i.status],Ia[i.status])}</dd></div>
                <div><dt>Dibuat</dt><dd>${qe(i.createdAt)}</dd></div>
                <div><dt>Terakhir diubah</dt><dd>${qe(i.updatedAt)}</dd></div>
              </dl>
            `})}
          ${U({title:`Data sensitif`,subtitle:`Kata sandi marketplace dan nomor rekening`,body:`
              <div class="security-banner">
                ${B(`shield-alert`)}
                <p>Data sensitif disamarkan secara default. Membukanya memerlukan konfirmasi dan dicatat pada log aktivitas. Jangan tampilkan di tempat umum.</p>
              </div>
              <div data-sensitive-area>
                <div class="sensitive-lock">
                  <span>${B(`lock-keyhole`)}</span>
                  <div>
                    <strong>Data tersimpan terenkripsi</strong>
                    <p>Kata sandi dan nomor rekening tidak dimuat sampai Anda memintanya.</p>
                  </div>
                  <button type="button" class="btn btn-secondary btn-sm" data-reveal-sensitive>${B(`eye`)}<span>Tampilkan</span></button>
                </div>
              </div>
              <p class="inline-note">${B(`info`)} Kata sandi hanya catatan akses marketplace dan tidak digunakan untuk login aplikasi.</p>
            `})}
        </div>
        ${U({title:`Keamanan profile`,body:`
            <ul class="plain-list">
              <li>${B(`check`)} Data sensitif dienkripsi dengan kunci acak yang disimpan terpisah dari database.</li>
              <li>${B(`check`)} Kata sandi dan nomor rekening tidak pernah masuk ke URL, log, atau ringkasan dashboard.</li>
              <li>${B(`check`)} Backup dibuat dengan proteksi kata sandi melalui menu Pengaturan.</li>
              <li>${B(`triangle-alert`)} Siapa pun yang dapat membuka perangkat dan aplikasi berpotensi mengakses data bisnis.</li>
            </ul>
          `})}
      `,l=()=>{let r=t.querySelector(`[data-reveal-sensitive]`),a=t.querySelector(`[data-sensitive-area]`);r?.addEventListener(`click`,async()=>{if(a&&await yo({title:`Tampilkan data sensitif?`,message:`Pastikan layar tidak terlihat oleh orang lain. Tindakan ini akan dicatat pada log aktivitas.`,confirmLabel:`Tampilkan data`,tone:`primary`,details:[`Kata sandi marketplace`,`Nomor rekening`]})){Z(r,!0,`Membuka…`);try{let t=await n.storeService.getSensitiveData(i.id);a.innerHTML=`
              <div class="sensitive-values">
                <div class="sensitive-row">
                  <div>
                    <span class="sensitive-label">Kata sandi marketplace</span>
                    <code class="sensitive-value">${t.password?L(t.password):`<span class="muted">Belum disimpan</span>`}</code>
                  </div>
                  ${t.password?`<button type="button" class="btn btn-ghost btn-icon" data-copy-password aria-label="Salin kata sandi" title="Salin">${B(`copy`)}</button>`:``}
                </div>
                <div class="sensitive-row">
                  <div>
                    <span class="sensitive-label">Nomor rekening</span>
                    <code class="sensitive-value">${t.bankAccount?L(t.bankAccount):`<span class="muted">Belum disimpan</span>`}</code>
                  </div>
                  ${t.bankAccount?`<button type="button" class="btn btn-ghost btn-icon" data-copy-bank aria-label="Salin nomor rekening" title="Salin">${B(`copy`)}</button>`:``}
                </div>
              </div>
              <div class="sensitive-actions">
                <button type="button" class="btn btn-secondary btn-sm" data-hide-sensitive>${B(`eye-off`)}<span>Sembunyikan</span></button>
              </div>
            `;let o=t.password,s=t.bankAccount;a.querySelector(`[data-copy-password]`)?.addEventListener(`click`,()=>{o&&bo(o,`Kata sandi disalin.`)}),a.querySelector(`[data-copy-bank]`)?.addEventListener(`click`,()=>{s&&bo(s,`Nomor rekening disalin.`)}),a.querySelector(`[data-hide-sensitive]`)?.addEventListener(`click`,()=>{e.refresh()}),z(a),Z(r,!1)}catch(e){Z(r,!1),V(e instanceof Error?e.message:`Data sensitif tidak dapat dibuka.`,`error`)}}})}),a===`pesanan`){let t=await n.orderService.list({storeId:r,page:1,pageSize:15});if(e.signal.aborted)return;c=U({title:`Pesanan toko`,subtitle:`Pesanan terbaru; gunakan halaman pesanan untuk filter lengkap`,actions:K(`/orders?storeId=${i.id}`,`Semua pesanan`,`btn btn-secondary btn-sm`,`arrow-right`),body:t.items.length?Y([`Pesanan`,`Tanggal`,`Item`,`Omzet kotor`,`Status`,``],t.items.map(e=>[`<span class="table-strong">${L(e.marketplaceOrderId)}</span>`,D(e.orderDate),`${I(e.unitCount)} unit`,F(e.grossSales),G(za[e.status],Ba[e.status]),`<a class="btn btn-ghost btn-sm" href="#/orders/${e.id}">Buka</a>`])):q({iconName:`shopping-bag`,title:`Belum ada pesanan`,description:`Pesanan untuk toko ini belum dicatat.`,action:K(`/orders/new?storeId=${i.id}`,`Tambah pesanan`,`btn btn-primary`,`plus`)})})}if(a===`keuangan`){let[t,a]=await Promise.all([n.financeService.getSummary(s,r),n.feeService.list({storeId:r,page:1,pageSize:10})]);if(e.signal.aborted)return;c=`
        <div class="detail-grid">
          ${U({title:`Ringkasan keuangan`,subtitle:s.label,body:Ro(t,r)+`<p class="inline-note">${L(zo(r))}</p>`})}
          ${U({title:`Biaya marketplace terbaru`,subtitle:`Biaya aktual dan estimasi`,actions:K(`/finance/fees?storeId=${i.id}`,`Kelola biaya`,`btn btn-ghost btn-sm`,`arrow-right`),body:a.items.length?`<ul class="simple-list">
                  ${a.items.map(e=>`<li>
                        <div><strong>${F(e.amount)}</strong><small>${D(e.feeDate)}${e.marketplaceOrderId?` · ${L(e.marketplaceOrderId)}`:``}</small></div>
                        <span class="badge badge-${e.source===`estimated`?`warning`:`neutral`}">${e.source===`estimated`?`Estimasi`:`Aktual`}</span>
                      </li>`).join(``)}
                </ul>`:q({compact:!0,iconName:`credit-card`,title:`Belum ada biaya marketplace`,description:`Catat potongan aktual atau estimasi agar laba lebih akurat.`})})}
        </div>
      `}if(a===`iklan`){let t=await n.advertisingService.listCampaigns(r);if(e.signal.aborted)return;c=U({title:`Kampanye iklan toko`,subtitle:`ROAS dan ACOS hanya dihitung jika data atribusi tersedia`,actions:K(`/finance/ads?storeId=${i.id}`,`Kelola iklan`,`btn btn-secondary btn-sm`,`megaphone`),body:t.length?Y([`Kampanye`,`Pengeluaran`,`Omzet atribusi`,`ROAS`,`ACOS`,`Baris`,``],Vo(t)):q({iconName:`megaphone`,title:`Belum ada kampanye iklan`,description:`Kampanye dapat dipisahkan per toko atau dicatat sebagai kampanye bersama.`,action:K(`/finance/ads/new?storeId=${i.id}`,`Tambah kampanye`,`btn btn-primary`,`plus`)})})}let u=Bo.map(e=>`<a class="tab-link ${e.id===a?`is-active`:``}" href="#/stores/${i.id}?tab=${e.id}" ${e.id===a?`aria-current="page"`:``}>${L(e.label)}</a>`).join(``);t.innerHTML=`
      ${H({eyebrow:Pa[i.platform],title:i.name,subtitle:`Profile toko dan performa bisnis terpisah dari toko lain.`,actions:`
          <a class="btn btn-secondary" href="#/stores">${B(`arrow-left`)}<span>Kembali</span></a>
          ${K(`/stores/${i.id}/edit`,`Ubah toko`,`btn btn-primary`,`pencil`)}
        `})}
      <div class="detail-meta">
        ${G(Fa[i.status],Ia[i.status])}
        ${G(Pa[i.platform],i.platform===`shopee`?`warning`:i.platform===`tiktok`?`neutral`:`info`)}
        <span class="muted">${o>0?`${I(o)} transaksi terkait`:`Belum ada transaksi terkait`}</span>
      </div>
      <nav class="tabs" aria-label="Bagian toko">${u}</nav>
      ${c}
    `,l(),z(t)}catch(n){$(t,e,n)}};function Uo(e){let t=`${e.idPrefix}-${e.name}`;return`
    <div class="field" data-field="${e.name}">
      <label class="field-label" for="${t}">${L(e.label)} <span class="optional-mark">Opsional</span></label>
      <div class="input-with-action">
        <input class="input" id="${t}" name="${e.name}" type="password" autocomplete="off" spellcheck="false" />
        <button type="button" class="btn btn-ghost btn-icon input-action" data-toggle-secret="${t}" aria-label="Tampilkan ${L(e.label.toLowerCase())}" title="Tampilkan">
          ${B(`eye`)}
        </button>
      </div>
      <p class="field-help">${L(e.help)}</p>
      <p class="field-error" data-error-for="${e.name}"></p>
    </div>
  `}var Wo=async e=>{let{root:t,services:n}=e,r=e.params.id??null,i=r!==null;t.innerHTML=J(i?`Memuat data toko…`:`Menyiapkan formulir…`);try{let a=null;if(r&&(a=await n.storeService.get(r)),e.signal.aborted)return;e.setTitle(i?`Ubah toko`:`Toko baru`);let o=$t.map(e=>({value:e,label:Pa[e]}));t.innerHTML=`
      ${H({eyebrow:`Toko`,title:i?`Ubah informasi toko`:`Tambah toko`,subtitle:i?`Dibuat ${a?D(a.createdAt.slice(0,10),`long`):``}. Data sensitif tidak pernah dimuat ke formulir ini.`:`Lengkapi identitas toko. Field profile tambahan dapat diisi nanti melalui halaman profile toko.`,actions:`<a class="btn btn-secondary" href="#${i&&r?`/stores/${r}`:`/stores`}">${B(`arrow-left`)}<span>Kembali</span></a>`})}

      <form class="form-card" id="store-form" novalidate>
        ${no()}
        <div class="form-section">
          <div class="form-section-head">
            <h2>Informasi toko</h2>
            <p>Nama dan platform wajib diisi.</p>
          </div>
          <div class="form-grid">
            ${X({name:`name`,label:`Nama toko`,value:a?.name??``,required:!0,placeholder:`Contoh: Manka Official`,idPrefix:`store`,span:!0})}
            ${X({name:`platform`,label:`Platform`,type:`select`,value:a?.platform??`shopee`,options:o,required:!0,idPrefix:`store`})}
            ${X({name:`email`,label:`Email toko`,type:`email`,value:a?.email??``,placeholder:`toko@contoh.com`,idPrefix:`store`})}
            ${X({name:`phone`,label:`Nomor HP`,type:`tel`,value:a?.phone??``,placeholder:`0812…`,idPrefix:`store`})}
            ${X({name:`ktpName`,label:`Nama KTP`,value:a?.ktpName??``,help:`Nama pemilik sesuai identitas, jika diperlukan untuk administrasi.`,idPrefix:`store`})}
            ${i?X({name:`status`,label:`Status toko`,type:`select`,value:a?.status??`active`,options:[{value:`active`,label:`Aktif`},{value:`archived`,label:`Diarsipkan`}],idPrefix:`store`}):``}
          </div>
        </div>

        <div class="form-section">
          <div class="form-section-head">
            <h2>Informasi pemilik & akses</h2>
            <p>Nomor rekening dan kata sandi disimpan terenkripsi. Nilai tersimpan tidak ditampilkan pada formulir.</p>
          </div>
          <div class="form-grid">
            ${Uo({name:`bankAccount`,label:`Nomor rekening`,help:i?`Biarkan kosong untuk mempertahankan nomor rekening tersimpan. Isi hanya jika ingin menggantinya.`:`Opsional. Hanya ditampilkan setelah tindakan eksplisit di halaman profile.`,idPrefix:`store`})}
            ${Uo({name:`password`,label:`Kata sandi marketplace`,help:i?`Biarkan kosong untuk mempertahankan kata sandi tersimpan. Kata sandi bukan autentikasi aplikasi.`:`Opsional. Catatan kredensial marketplace, bukan login aplikasi.`,idPrefix:`store`})}
          </div>
          ${i?`<div class="form-checks">
                  ${to({name:`clearBankAccount`,label:`Hapus nomor rekening tersimpan`,description:`Nomor rekening akan dikosongkan setelah disimpan.`,idPrefix:`store`})}
                  ${to({name:`clearPassword`,label:`Hapus kata sandi tersimpan`,description:`Kata sandi marketplace akan dikosongkan setelah disimpan.`,idPrefix:`store`})}
                </div>
                <p class="inline-note note-warning">${B(`shield-alert`)} Tindakan menghapus data sensitif tidak dapat dibatalkan.</p>`:``}
        </div>

        <div class="form-section form-section-note">
          <div class="security-note">
            ${B(`shield-check`)}
            <div>
              <strong>Data sensitif tidak masuk ke log atau URL</strong>
              <p>Backup yang memuat profile toko juga dilindungi kata sandi saat dibuat melalui menu Pengaturan.</p>
            </div>
          </div>
        </div>

        ${ro(i?`Simpan perubahan`:`Simpan toko`,{submitIcon:`save`,cancelHref:`#${i&&r?`/stores/${r}`:`/stores`}`})}
      </form>
    `;for(let e of t.querySelectorAll(`[data-toggle-secret]`))e.addEventListener(`click`,()=>{let n=e.dataset.toggleSecret,r=n?t.querySelector(`#${CSS.escape(n)}`):null;if(!r)return;let i=r.type===`password`;r.type=i?`text`:`password`,e.innerHTML=B(i?`eye-off`:`eye`),e.setAttribute(`aria-label`,i?`Sembunyikan data`:`Tampilkan data`),e.setAttribute(`title`,i?`Sembunyikan`:`Tampilkan`),z(e)});let s=t.querySelector(`#store-form`);if(!s)throw Error(`Formulir toko tidak ditemukan.`);let c=s.querySelector(`button[type="submit"]`);s.addEventListener(`submit`,async t=>{if(t.preventDefault(),c){so(s,null),Z(c,!0,`Menyimpan…`);try{let t=Q(s,`password`),a=Q(s,`bankAccount`),o={name:Q(s,`name`),platform:Q(s,`platform`),email:co(s,`email`),phone:co(s,`phone`),ktpName:co(s,`ktpName`),status:i&&Q(s,`status`)===`archived`?`archived`:`active`};t===``?i&&mo(s,`clearPassword`)&&(o.password=null):o.password=t,a===``?i&&mo(s,`clearBankAccount`)&&(o.bankAccount=null):o.bankAccount=a;let c=i&&r?await n.storeService.update(r,o):await n.storeService.create(o);V(i?`Perubahan toko tersimpan.`:`Toko berhasil dibuat.`,`success`),e.navigate(`/stores/${c.id}`)}catch(e){so(s,e),Z(c,!1),e instanceof N||V(`Periksa kembali data toko.`,`error`)}}}),z(t)}catch(n){$(t,e,n)}};function Go(e,t){return!Number.isFinite(e)||!Number.isFinite(t)||e<=0?null:(e-t)/e*100}function Ko(e,t){return e-t}var qo=async e=>{let{root:t,services:n}=e;t.innerHTML=J(`Memuat produk…`);try{let r=e.query.get(`search`)?.trim()??``,i=e.query.get(`status`)??`all`,a=i===`active`||i===`inactive`?i:`all`,o=e.query.get(`category`)?.trim()||null,[s,c,l]=await Promise.all([n.productService.list({search:r,status:a,category:o}),n.productService.listCategories(),n.productService.list()]);if(e.signal.aborted)return;e.setTitle(`Produk`);let u=r!==``||a!==`all`||o!==null,d=l.filter(e=>e.status===`active`).length,f=s.map(e=>{let t=Go(e.price,e.currentCost);return[`<a class="table-link" href="#/products/${e.id}">${L(e.name)}</a><span class="table-sub">${L(e.sku)}${e.category?` · ${L(e.category)}`:``}</span>`,F(e.price),F(e.currentCost),t===null?`N/A`:`<span class="${t>=0?`value-positive`:`value-negative`}">${Dn(t)}</span>`,G(La[e.status],Ra[e.status]),`<div class="table-actions">
          <a class="btn btn-ghost btn-sm" href="#/products/${e.id}">Detail</a>
          <a class="btn btn-ghost btn-icon" href="#/products/${e.id}/edit" aria-label="Ubah ${R(e.name)}" title="Ubah">${B(`pencil`)}</a>
        </div>`]}),p=l.length===0?q({iconName:`package`,title:`Belum ada produk`,description:`Tambahkan produk beserta SKU, harga jual, dan HPP. HPP akan tersimpan sebagai riwayat dan menjadi snapshot pada pesanan.`,action:K(`/products/new`,`Tambah produk pertama`,`btn btn-primary`,`plus`)}):q({iconName:`search`,title:`Produk tidak ditemukan`,description:`Tidak ada produk yang sesuai dengan pencarian atau filter.`,action:`<a class="btn btn-secondary" href="#/products">${B(`refresh-cw`)}<span>Reset filter</span></a>`});t.innerHTML=`
      ${H({eyebrow:`Master produk`,title:`Produk`,subtitle:`${I(l.length)} produk · ${I(d)} aktif`,actions:K(`/products/new`,`Tambah produk`,`btn btn-primary`,`plus`)})}

      <div class="filter-bar product-filter-bar">
        <form class="filter-search" data-product-search role="search">
          <label class="filter-label" for="product-search">Cari produk</label>
          <div class="search-input-wrap">
            ${B(`search`,`search-icon`)}
            <input class="input" id="product-search" name="search" type="search" value="${R(r)}" placeholder="Nama produk, SKU, atau kategori…" autocomplete="off" />
            <button type="submit" class="btn btn-secondary btn-sm">Cari</button>
          </div>
        </form>
        <div class="filter-control">
          <label class="filter-label" for="product-status">Status</label>
          <select class="input select" id="product-status" data-product-status>
            <option value="all" ${a===`all`?`selected`:``}>Semua status</option>
            <option value="active" ${a===`active`?`selected`:``}>Aktif</option>
            <option value="inactive" ${a===`inactive`?`selected`:``}>Nonaktif</option>
          </select>
        </div>
        <div class="filter-control">
          <label class="filter-label" for="product-category">Kategori</label>
          <select class="input select" id="product-category" data-product-category>
            <option value="">Semua kategori</option>
            ${c.map(e=>`<option value="${R(e)}" ${e===o?`selected`:``}>${L(e)}</option>`).join(``)}
          </select>
        </div>
        ${u?`<a class="filter-reset" href="#/products">${B(`x`)} Reset</a>`:``}
      </div>

      ${s.length>0?U({title:`Daftar produk`,subtitle:`Margin dihitung dari harga jual dan HPP aktif`,padded:!1,body:Y([`Produk`,`Harga jual`,`HPP aktif`,`Margin`,`Status`,``],f)}):U({body:p})}
    `;let m=t.querySelector(`[data-product-search]`);m?.addEventListener(`submit`,t=>{t.preventDefault();let n=m.querySelector(`input[name="search"]`);e.navigate(Eo(e.path,e.query,{search:n?.value.trim()||null}))}),t.querySelector(`[data-product-status]`)?.addEventListener(`change`,t=>{let n=t.currentTarget;e.navigate(Eo(e.path,e.query,{status:n.value===`all`?null:n.value}))}),t.querySelector(`[data-product-category]`)?.addEventListener(`change`,t=>{let n=t.currentTarget;e.navigate(Eo(e.path,e.query,{category:n.value||null}))}),z(t)}catch(n){$(t,e,n)}},Jo=async e=>{let{root:t,services:n}=e,r=e.params.id??``;t.innerHTML=J(`Memuat produk…`);try{let[i,a,o]=await Promise.all([n.productService.get(r),n.productService.listCosts(r),n.productService.listPrices(r)]);if(e.signal.aborted)return;e.setTitle(i.name);let s=Go(i.price,i.currentCost),c=Ko(i.price,i.currentCost);t.innerHTML=`
      ${H({eyebrow:`Master produk`,title:i.name,subtitle:`${i.sku}${i.category?` · ${i.category}`:``}${i.variant?` · ${i.variant}`:``}`,actions:`
          <a class="btn btn-secondary" href="#/products">${B(`arrow-left`)}<span>Kembali</span></a>
          ${K(`/products/${i.id}/edit`,`Ubah produk`,`btn btn-primary`,`pencil`)}
        `})}
      <div class="detail-meta">
        ${G(La[i.status],Ra[i.status])}
        <span class="muted">HPP dan harga jual memiliki riwayat perubahan</span>
      </div>

      <div class="kpi-grid kpi-grid-3">
        ${W({label:`Harga jual aktif`,value:F(i.price),iconName:`banknote`})}
        ${W({label:`HPP aktif`,value:F(i.currentCost),iconName:`package`})}
        ${W({label:`Margin kotor`,value:s===null?`N/A`:Dn(s),iconName:c>=0?`trending-up`:`trending-down`,tone:c>=0?`positive`:`negative`,hint:`${F(c)} per unit`})}
      </div>

      <div class="detail-grid">
        ${U({title:`Informasi produk`,body:`
            <dl class="detail-list">
              <div><dt>Nama</dt><dd>${L(i.name)}</dd></div>
              <div><dt>SKU</dt><dd><code>${L(i.sku)}</code></dd></div>
              <div><dt>Kategori</dt><dd>${i.category?L(i.category):`<span class="muted">Belum diisi</span>`}</dd></div>
              <div><dt>Varian</dt><dd>${i.variant?L(i.variant):`<span class="muted">Belum diisi</span>`}</dd></div>
              <div><dt>Status</dt><dd>${G(La[i.status],Ra[i.status])}</dd></div>
              <div><dt>Dibuat</dt><dd>${qe(i.createdAt)}</dd></div>
              <div><dt>Terakhir diubah</dt><dd>${qe(i.updatedAt)}</dd></div>
            </dl>
            ${i.notes?`<div class="notes-block"><span class="sensitive-label">Catatan</span><p>${L(i.notes)}</p></div>`:``}
          `})}
        ${U({title:`Kebijakan HPP`,body:`
            <div class="security-banner">
              ${B(`shield-check`)}
              <p>Pesanan menyimpan HPP snapshot masing-masing. Mengubah HPP produk tidak mengubah laba pesanan yang sudah tercatat.</p>
            </div>
            <p class="inline-note">${B(`info`)} Riwayat HPP dan harga jual dibuat otomatis setiap kali nilai berubah melalui formulir produk.</p>
          `})}
      </div>

      ${U({title:`Riwayat HPP`,subtitle:`${a.length} perubahan tercatat`,padded:!1,body:a.length?Y([`Tanggal berlaku`,`HPP`,`Catatan`,`Dicatat`],a.map(e=>[D(e.effectiveAt),`<strong>${F(e.cost)}</strong>`,e.note?L(e.note):`<span class="muted">—</span>`,qe(e.createdAt)])):q({compact:!0,iconName:`package`,title:`Belum ada riwayat HPP`,description:`Riwayat muncul saat HPP produk diisi atau diubah.`})})}

      ${U({title:`Riwayat harga jual`,subtitle:`${o.length} perubahan tercatat`,padded:!1,body:o.length?Y([`Tanggal berlaku`,`Harga jual`,`Dicatat`],o.map(e=>[D(e.effectiveAt),`<strong>${F(e.price)}</strong>`,qe(e.createdAt)])):q({compact:!0,iconName:`banknote`,title:`Belum ada riwayat harga`,description:`Riwayat muncul saat harga jual produk diisi atau diubah.`})})}

      ${U({title:`Hapus produk`,body:`
          <div class="danger-zone danger-row">
            <div>
              <strong>Hapus produk secara permanen</strong>
              <p>Produk yang sudah dipakai pada pesanan tidak dapat dihapus. Nonaktifkan produk agar riwayat tetap utuh.</p>
            </div>
            <button type="button" class="btn btn-danger btn-sm" data-delete-product>${B(`trash`)}<span>Hapus produk</span></button>
          </div>
        `})}
    `,t.querySelector(`[data-delete-product]`)?.addEventListener(`click`,async()=>{if(await yo({title:`Hapus produk?`,message:`Produk "${i.name}" akan dihapus permanen. Produk yang sudah dipakai pada pesanan akan ditolak oleh sistem.`,confirmLabel:`Hapus produk`,tone:`danger`,requireText:i.sku}))try{await n.productService.delete(i.id),V(`Produk dihapus.`,`success`),e.navigate(`/products`)}catch(e){V(e instanceof Error?e.message:`Produk gagal dihapus.`,`error`)}}),z(t)}catch(n){$(t,e,n)}},Yo=async e=>{let{root:t,services:n}=e,r=e.params.id??null,i=r!==null;t.innerHTML=J(i?`Memuat produk…`:`Menyiapkan formulir…`);try{let a=null;if(r&&(a=await n.productService.get(r)),e.signal.aborted)return;e.setTitle(i?`Ubah produk`:`Produk baru`),t.innerHTML=`
      ${H({eyebrow:`Master produk`,title:i?`Ubah produk`:`Tambah produk`,subtitle:i?`Perubahan HPP dan harga jual dicatat sebagai riwayat baru. Pesanan lama tetap memakai snapshot HPP saat dibuat.`:`HPP dan harga jual akan dicatat sebagai riwayat awal produk.`,actions:`<a class="btn btn-secondary" href="#${i&&r?`/products/${r}`:`/products`}">${B(`arrow-left`)}<span>Kembali</span></a>`})}

      <form class="form-card" id="product-form" novalidate>
        ${no()}
        <div class="form-section">
          <div class="form-section-head">
            <h2>Informasi produk</h2>
            <p>Nama dan SKU wajib diisi. SKU harus unik.</p>
          </div>
          <div class="form-grid">
            ${X({name:`name`,label:`Nama produk`,value:a?.name??``,required:!0,placeholder:`Contoh: Kaos Polos Premium`,idPrefix:`product`,span:!0})}
            ${X({name:`sku`,label:`SKU`,value:a?.sku??``,required:!0,placeholder:`Contoh: KPS-001`,help:`SKU dipakai untuk mencocokkan produk saat import pesanan.`,idPrefix:`product`})}
            ${X({name:`status`,label:`Status`,type:`select`,value:a?.status??`active`,options:[{value:`active`,label:`Aktif`},{value:`inactive`,label:`Nonaktif`}],required:!0,idPrefix:`product`})}
            ${X({name:`category`,label:`Kategori`,value:a?.category??``,placeholder:`Contoh: Kaos`,idPrefix:`product`})}
            ${X({name:`variant`,label:`Varian`,value:a?.variant??``,placeholder:`Contoh: Hitam / L`,idPrefix:`product`})}
          </div>
        </div>

        <div class="form-section">
          <div class="form-section-head">
            <h2>Harga dan HPP</h2>
            <p>Nominal dalam Rupiah bulat. HPP saat ini: <strong>${F(a?.currentCost??0)}</strong>.</p>
          </div>
          <div class="form-grid">
            ${X({name:`price`,label:`Harga jual`,type:`money`,value:a?String(a.price):``,required:!0,placeholder:`0`,help:`Harga jual aktif per unit. Perubahan akan dicatat pada riwayat harga.`,idPrefix:`product`})}
            ${X({name:`cost`,label:`HPP`,type:`money`,value:i?``:a?String(a.currentCost):``,placeholder:i?`Biarkan kosong untuk mempertahankan HPP`:`0`,help:i?`Isi hanya jika HPP berubah. Nilai baru dicatat pada riwayat HPP dengan tanggal hari ini.`:`Opsional. HPP akan menjadi snapshot pada pesanan baru.`,idPrefix:`product`})}
            ${X({name:`notes`,label:`Catatan`,type:`textarea`,value:a?.notes??``,rows:4,placeholder:`Bahan, ukuran, atau catatan produksi…`,idPrefix:`product`,span:!0})}
          </div>
          <div class="form-info">
            ${B(`info`)}
            <p>Perubahan HPP tidak mengubah laba pesanan lama. Setiap item pesanan menyimpan HPP snapshot saat transaksi dibuat atau diimpor.</p>
          </div>
        </div>

        ${ro(i?`Simpan perubahan`:`Simpan produk`,{submitIcon:`save`,cancelHref:`#${i&&r?`/products/${r}`:`/products`}`})}
      </form>
    `;let o=t.querySelector(`#product-form`);if(!o)throw Error(`Formulir produk tidak ditemukan.`);let s=o.querySelector(`button[type="submit"]`);o.addEventListener(`submit`,async t=>{if(t.preventDefault(),s){so(o,null),Z(s,!0,`Menyimpan…`);try{let t=Q(o,`cost`)===``?null:uo(o,`cost`,`HPP`),a={name:Q(o,`name`),sku:Q(o,`sku`),category:Q(o,`category`)||null,variant:Q(o,`variant`)||null,price:lo(o,`price`,`Harga jual`,{required:!0}),cost:t,status:Q(o,`status`),notes:Q(o,`notes`)||null},s=i&&r?await n.productService.update(r,a):await n.productService.create(a);V(i?`Produk tersimpan.`:`Produk berhasil dibuat.`,`success`),e.navigate(`/products/${s.id}`)}catch(e){so(o,e),Z(s,!1),e instanceof N||V(`Produk gagal disimpan. Periksa kembali datanya.`,`error`)}}}),z(t)}catch(n){$(t,e,n)}},Xo=async e=>{let{root:t,services:n}=e;t.innerHTML=J(`Memuat pesanan…`);try{let r=So(e.query),i=e.query.get(`search`)?.trim()??``,a=e.query.get(`status`)??`all`,o=en.includes(a)?a:`all`,s=No(e.query.get(`page`)),[c,l]=await Promise.all([n.storeService.listAll(),n.orderService.list({storeId:r.storeId,status:o,from:r.period.from,to:r.period.to,search:i,page:s,pageSize:20})]);if(e.signal.aborted)return;e.setTitle(`Pesanan`);let u=i!==``||o!==`all`||r.storeId!==null||r.period.preset!==`thisMonth`,d=l.items.map(e=>[`<a class="table-link" href="#/orders/${e.id}">${L(e.marketplaceOrderId)}</a><span class="table-sub">${L(e.storeName)}</span>`,D(e.orderDate),`<span class="table-strong">${I(e.unitCount)} unit</span><span class="table-sub">${I(e.itemCount)} item</span>`,F(e.grossSales),pt(e.status)?F(e.netSales):`<span class="muted">Tidak dihitung</span>`,G(za[e.status],Ba[e.status]),`<div class="table-actions">
        <a class="btn btn-ghost btn-sm" href="#/orders/${e.id}">Buka</a>
        <a class="btn btn-ghost btn-icon" href="#/orders/${e.id}/edit" aria-label="Ubah pesanan ${R(e.marketplaceOrderId)}" title="Ubah">${B(`pencil`)}</a>
      </div>`]),f=l.total===0?q({iconName:u?`search`:`shopping-bag`,title:u?`Pesanan tidak ditemukan`:`Belum ada pesanan`,description:u?`Tidak ada pesanan yang sesuai dengan filter. Coba ubah periode, toko, status, atau kata kunci.`:`Tambahkan pesanan secara manual atau import file CSV/XLSX dari marketplace. Nomor pesanan unik per toko.`,action:u?`<a class="btn btn-secondary" href="#/orders">${B(`refresh-cw`)}<span>Reset filter</span></a>`:`${K(`/orders/new`,`Tambah pesanan`,`btn btn-primary`,`plus`)}
                 ${K(`/orders/import`,`Import pesanan`,`btn btn-secondary`,`upload`)}`}):``;t.innerHTML=`
      ${H({eyebrow:`Transaksi penjualan`,title:`Pesanan`,subtitle:`${I(l.total)} pesanan pada filter aktif. Pesanan batal/retur tidak dihitung sebagai penjualan.`,actions:`${K(`/orders/import`,`Import`,`btn btn-secondary`,`upload`)}
          ${K(`/orders/new`,`Tambah pesanan`,`btn btn-primary`,`plus`)}`})}

      ${To(r,c)}

      <div class="filter-bar filter-bar-extra">
        <div class="filter-control">
          <label class="filter-label" for="order-status">Status</label>
          <select class="input select" id="order-status" data-order-status>
            <option value="all" ${o===`all`?`selected`:``}>Semua status</option>
            ${en.map(e=>`<option value="${e}" ${e===o?`selected`:``}>${za[e]}</option>`).join(``)}
          </select>
        </div>
        <form class="filter-search" data-order-search role="search">
          <label class="filter-label" for="order-search">Cari pesanan</label>
          <div class="search-input-wrap">
            ${B(`search`,`search-icon`)}
            <input class="input" id="order-search" name="search" type="search" value="${R(i)}" placeholder="Nomor pesanan, catatan, atau nama toko…" autocomplete="off" />
            <button type="submit" class="btn btn-secondary btn-sm">Cari</button>
          </div>
        </form>
        ${u?`<a class="filter-reset" href="#/orders">${B(`x`)} Reset</a>`:``}
      </div>

      ${l.items.length>0?U({padded:!1,body:Y([`Pesanan`,`Tanggal`,`Jumlah`,`Omzet kotor`,`Penjualan bersih`,`Status`,``],d)}):U({body:f})}
      ${$a({page:l.page,pageSize:l.pageSize,total:l.total})}
    `,Do(t,e),t.querySelector(`[data-order-status]`)?.addEventListener(`change`,t=>{let n=t.currentTarget;Mo(e,{status:n.value===`all`?null:n.value,page:null})});let p=t.querySelector(`[data-order-search]`);p?.addEventListener(`submit`,t=>{t.preventDefault(),Mo(e,{search:p.querySelector(`input[name="search"]`)?.value.trim()||null,page:null})}),eo(t,t=>{e.navigate(Eo(e.path,e.query,{page:t}))}),z(t)}catch(n){$(t,e,n)}},Zo=async e=>{let{root:t,services:n}=e,r=e.params.id??``;t.innerHTML=J(`Memuat pesanan…`);try{let i=await n.orderService.getDetail(r);if(e.signal.aborted)return;e.setTitle(i.marketplaceOrderId);let a=pt(i.status),o=i.refunds.filter(e=>e.status!==`rejected`).reduce((e,t)=>e+t.quantity,0),s=i.items.reduce((e,t)=>e+t.quantity,0),c=i.refunds.length===0;t.innerHTML=`
      ${H({eyebrow:`Transaksi penjualan`,title:i.marketplaceOrderId,subtitle:`${i.storeName} · ${D(i.orderDate,`long`)}`,actions:`
          <a class="btn btn-secondary" href="#/orders">${B(`arrow-left`)}<span>Kembali</span></a>
          ${K(`/orders/${i.id}/edit`,`Ubah pesanan`,`btn btn-primary`,`pencil`)}
        `})}

      <div class="detail-meta">
        ${G(za[i.status],Ba[i.status])}
        <a class="detail-meta-link" href="#/stores/${i.storeId}">${B(`store`)} ${L(i.storeName)}</a>
        ${a?``:`<span class="inline-note note-warning">${B(`triangle-alert`)} Status ini tidak dihitung sebagai penjualan.</span>`}
      </div>

      <div class="kpi-grid">
        ${W({label:`Omzet kotor`,value:F(i.grossSales),iconName:`coins`,hint:`${I(s)} unit · ${I(i.items.length)} item`})}
        ${W({label:`Penjualan bersih`,value:a?F(i.netSales):`Tidak dihitung`,iconName:`banknote`,hint:i.refundTotal>0?`Setelah refund ${F(i.refundTotal)}`:`Sebelum biaya marketplace`})}
        ${W({label:`HPP snapshot`,value:F(i.cogs),iconName:`package`,hint:`Memakai HPP saat pesanan dibuat`})}
        ${W({label:`Laba kotor estimasi`,value:a?F(i.netSales-i.cogs):`—`,iconName:`trending-up`,tone:a&&i.netSales-i.cogs>=0?`positive`:a?`negative`:`default`,hint:`Sebelum biaya marketplace ${F(i.marketplaceFees)}`})}
      </div>

      <div class="detail-grid">
        ${U({title:`Informasi pesanan`,body:`
            <dl class="detail-list">
              <div><dt>Toko</dt><dd><a class="table-link" href="#/stores/${i.storeId}">${L(i.storeName)}</a></dd></div>
              <div><dt>Nomor marketplace</dt><dd><code>${L(i.marketplaceOrderId)}</code></dd></div>
              <div><dt>Tanggal pesanan</dt><dd>${D(i.orderDate,`long`)}</dd></div>
              <div><dt>Status</dt><dd>${G(za[i.status],Ba[i.status])}</dd></div>
              <div><dt>Diskon penjual</dt><dd>${F(i.sellerDiscount)}</dd></div>
              <div><dt>Diskon marketplace</dt><dd>${F(i.marketplaceDiscount)} <span class="muted">(tidak mengurangi pendapatan)</span></dd></div>
              <div><dt>Ongkir dibayar pembeli</dt><dd>${F(i.shippingPaid)}</dd></div>
              <div><dt>Nilai pencairan</dt><dd>${i.settlementValue===null?`<span class="muted">Belum diisi</span>`:F(i.settlementValue)}</dd></div>
              <div><dt>Dibuat</dt><dd>${qe(i.createdAt)}</dd></div>
              <div><dt>Terakhir diubah</dt><dd>${qe(i.updatedAt)}</dd></div>
            </dl>
            ${i.notes?`<div class="notes-block"><span class="sensitive-label">Catatan</span><p>${L(i.notes)}</p></div>`:``}
          `})}
        ${U({title:`Rincian keuangan pesanan`,body:`
            <dl class="finance-breakdown">
              <div class="finance-row"><dt>Omzet item</dt><dd>${F(i.grossSales)}</dd></div>
              <div class="finance-row"><dt>Diskon penjual</dt><dd class="value-negative">${F(-i.sellerDiscount)}</dd></div>
              <div class="finance-row"><dt>Refund selesai</dt><dd class="value-negative">${F(-i.refundTotal)}</dd></div>
              <div class="finance-row finance-row-strong"><dt>Penjualan bersih</dt><dd>${a?F(i.netSales):`Tidak dihitung`}</dd></div>
              <div class="finance-row"><dt>HPP snapshot</dt><dd class="value-negative">${F(-i.cogs)}</dd></div>
              <div class="finance-row finance-row-strong"><dt>Laba kotor</dt><dd class="${a&&i.netSales-i.cogs>=0?`value-positive`:a?`value-negative`:``}">${a?F(i.netSales-i.cogs):`—`}</dd></div>
              <div class="finance-row"><dt>Biaya marketplace tercatat</dt><dd class="value-negative">${F(-i.marketplaceFees)}</dd></div>
              <div class="finance-row finance-row-strong"><dt>Estimasi laba sebelum iklan & operasional</dt><dd class="${a&&i.estimatedProfit>=0?`value-positive`:a?`value-negative`:``}">${a?F(i.estimatedProfit):`—`}</dd></div>
            </dl>
            <p class="inline-note">${B(`info`)} Biaya iklan dan operasional tidak dialokasikan per pesanan; keduanya dihitung pada laporan periode.</p>
          `})}
      </div>

      ${U({title:`Item pesanan`,subtitle:`HPP snapshot tersimpan permanen pada setiap item`,padded:!1,body:Y([`Produk`,`SKU`,`Kuantitas`,`Harga satuan`,`HPP snapshot`,`Subtotal omzet`,`Subtotal HPP`],i.items.map(e=>[e.productId?`<a class="table-link" href="#/products/${e.productId}">${L(e.productName)}</a>`:`${L(e.productName)}<span class="table-sub">Item manual</span>`,`<code>${L(e.sku)}</code>`,I(e.quantity),F(e.unitPrice),F(e.hppSnapshot),F(e.quantity*e.unitPrice),F(e.quantity*e.hppSnapshot)]))})}

      <div class="detail-grid">
        ${U({title:`Biaya marketplace`,subtitle:i.fees.length?`${i.fees.length} biaya tercatat`:`Belum ada biaya`,actions:K(`/finance/fees/new?storeId=${encodeURIComponent(i.storeId)}&orderId=${encodeURIComponent(i.id)}&feeDate=${i.orderDate}`,`Catat biaya`,`btn btn-ghost btn-sm`,`plus`),padded:!1,body:i.fees.length?Y([`Tanggal`,`Jenis`,`Sumber`,`Nominal`,``],i.fees.map(e=>[D(e.feeDate),L(e.feeType),G(e.source===`actual`?`Aktual`:`Estimasi`,e.source===`actual`?`neutral`:`warning`),F(e.amount),`<div class="table-actions">
                    <a class="btn btn-ghost btn-sm" href="#/finance/fees/${e.id}/edit">Ubah</a>
                    <button type="button" class="btn btn-ghost btn-icon" data-delete-fee="${R(e.id)}" aria-label="Hapus biaya" title="Hapus biaya">${B(`trash`)}</button>
                  </div>`])):q({compact:!0,iconName:`credit-card`,title:`Belum ada biaya marketplace`,description:`Catat potongan aktual agar laba pesanan lebih akurat.`,action:K(`/finance/fees/new?storeId=${encodeURIComponent(i.storeId)}&orderId=${encodeURIComponent(i.id)}&feeDate=${i.orderDate}`,`Catat biaya`,`btn btn-secondary btn-sm`,`plus`)})})}

        ${U({title:`Refund`,subtitle:i.refunds.length>0?`${I(o)} dari ${I(s)} barang direfund`:`Belum ada refund`,actions:K(`/finance/refunds/new?orderId=${encodeURIComponent(i.id)}&refundDate=${w()}`,`Catat refund`,`btn btn-ghost btn-sm`,`plus`),padded:!1,body:i.refunds.length?Y([`Tanggal`,`Nilai`,`Jumlah`,`Alasan`,`Status`,``],i.refunds.map(e=>[D(e.refundDate),F(e.amount),`${I(e.quantity)} barang`,L(e.reason),G(e.status===`completed`?`Selesai`:e.status===`pending`?`Menunggu`:`Ditolak`,e.status===`completed`?`success`:e.status===`pending`?`warning`:`neutral`),`<div class="table-actions">
                    <a class="btn btn-ghost btn-sm" href="#/finance/refunds/${e.id}/edit">Ubah</a>
                    <button type="button" class="btn btn-ghost btn-icon" data-delete-refund="${R(e.id)}" aria-label="Hapus refund" title="Hapus refund">${B(`trash`)}</button>
                  </div>`])):q({compact:!0,iconName:`refresh-cw`,title:`Tidak ada refund`,description:`Refund hanya mengurangi penjualan bila pesanan masih dihitung sebagai penjualan.`})})}
      </div>

      <div class="detail-grid">
        ${U({title:`Perbarui status`,body:`
            <form data-status-form class="inline-form">
              <div class="field">
                <label class="field-label" for="order-status-select">Status pesanan</label>
                <select class="input select" id="order-status-select" name="status">
                  ${en.map(e=>`<option value="${e}" ${e===i.status?`selected`:``}>${za[e]}</option>`).join(``)}
                </select>
              </div>
              <button type="submit" class="btn btn-secondary">Simpan status</button>
            </form>
            <p class="inline-note">${B(`info`)} Mengubah status memengaruhi perhitungan penjualan periode. Status batal, retur, dan refund tidak dihitung sebagai penjualan.</p>
          `})}

        ${U({title:`Hapus pesanan`,body:`
            <div class="danger-zone danger-row">
              <div>
                <strong>Hapus pesanan permanen</strong>
                <p>${c?`Biaya marketplace terkait juga akan dihapus. Tindakan ini tidak dapat dibatalkan.`:`Pesanan memiliki refund dan tidak dapat dihapus. Hapus data refund terlebih dahulu.`}</p>
              </div>
              <button type="button" class="btn btn-danger btn-sm" data-delete-order ${c?``:`disabled`}>${B(`trash`)}<span>Hapus pesanan</span></button>
            </div>
          `})}
      </div>
    `;let l=t.querySelector(`[data-status-form]`);l?.addEventListener(`submit`,async t=>{t.preventDefault();let r=l.querySelector(`select[name="status"]`),a=l.querySelector(`button[type="submit"]`);if(!r||!a)return;if(r.value===i.status){V(`Status pesanan tidak berubah.`,`info`);return}let o=r.value;Z(a,!0,`Menyimpan…`);try{await n.orderService.updateStatus(i.id,o),V(`Status pesanan diperbarui.`,`success`),e.refresh()}catch(e){Z(a,!1),V(e instanceof Error?e.message:`Status gagal diperbarui.`,`error`)}}),t.querySelectorAll(`[data-delete-fee]`).forEach(t=>{t.addEventListener(`click`,async()=>{let r=t.dataset.deleteFee??``,a=i.fees.find(e=>e.id===r);if(a&&await yo({title:`Hapus biaya marketplace?`,message:`Biaya ${F(a.amount)} akan dihapus dari pesanan dan laporan.`,confirmLabel:`Hapus biaya`,tone:`danger`}))try{await n.feeService.delete(r),V(`Biaya marketplace dihapus.`,`success`),e.refresh()}catch(e){V(e instanceof Error?e.message:`Biaya gagal dihapus.`,`error`)}})}),t.querySelectorAll(`[data-delete-refund]`).forEach(t=>{t.addEventListener(`click`,async()=>{let r=t.dataset.deleteRefund??``,a=i.refunds.find(e=>e.id===r);if(a&&await yo({title:`Hapus refund?`,message:`Refund ${F(a.amount)} akan dihapus. Penjualan bersih pesanan akan dihitung ulang.`,confirmLabel:`Hapus refund`,tone:`danger`}))try{await n.refundService.delete(r),V(`Refund dihapus.`,`success`),e.refresh()}catch(e){V(e instanceof Error?e.message:`Refund gagal dihapus.`,`error`)}})}),t.querySelector(`[data-delete-order]`)?.addEventListener(`click`,async t=>{let r=t.currentTarget;if(await yo({title:`Hapus pesanan?`,message:`Pesanan "${i.marketplaceOrderId}" beserta item dan biaya marketplace-nya akan dihapus permanen.`,confirmLabel:`Hapus pesanan`,tone:`danger`,requireText:i.marketplaceOrderId,details:[`Toko: ${i.storeName}`,`Omzet: ${F(i.grossSales)}`,`Refund harus dihapus terlebih dahulu.`]})){Z(r,!0,`Menghapus…`);try{await n.orderService.delete(i.id),V(`Pesanan dihapus.`,`success`),e.navigate(`/orders`)}catch(e){Z(r,!1),V(e instanceof Error?e.message:`Pesanan gagal dihapus.`,`error`)}}}),z(t)}catch(n){$(t,e,n)}};function Qo(e,t){return`
    <option value="" ${t===null?`selected`:``}>Produk manual / tidak tertaut</option>
    ${e.map(e=>`<option value="${R(e.id)}" ${e.id===t?`selected`:``}>${L(e.name)} — ${L(e.sku)}${e.status===`inactive`?` (nonaktif)`:``}</option>`).join(``)}
  `}function $o(e,t,n){let r=e.productId!==null;return`
    <div class="order-item" data-item-row data-item-id="${R(e.id??``)}">
      <div class="order-item-head">
        <strong data-item-title>Item ${n}</strong>
        <button type="button" class="btn btn-ghost btn-icon" data-remove-item aria-label="Hapus item" title="Hapus item">${B(`trash`)}</button>
      </div>
      <div class="order-item-grid">
        <div class="field item-product-field">
          <label class="field-label">Produk</label>
          <select class="input select" data-item-product>${Qo(t,e.productId)}</select>
        </div>
        <div class="field">
          <label class="field-label">Nama produk</label>
          <input class="input" data-item-name value="${R(e.productName)}" ${r?`readonly`:``} placeholder="Nama produk" />
        </div>
        <div class="field">
          <label class="field-label">SKU</label>
          <input class="input" data-item-sku value="${R(e.sku)}" ${r?`readonly`:``} placeholder="SKU" />
        </div>
        <div class="field">
          <label class="field-label">Kuantitas</label>
          <input class="input" data-item-qty type="text" inputmode="numeric" value="${e.quantity>0?e.quantity:1}" />
        </div>
        <div class="field">
          <label class="field-label">Harga satuan</label>
          <div class="input-affix"><span class="affix">Rp</span><input class="input" data-item-price type="text" inputmode="numeric" value="${e.unitPrice>0?e.unitPrice:``}" placeholder="0" /></div>
        </div>
        <div class="field">
          <label class="field-label">HPP snapshot</label>
          <div class="input-affix"><span class="affix">Rp</span><input class="input" data-item-hpp type="text" inputmode="numeric" value="${e.hppSnapshot}" ${r?`readonly`:``} /></div>
          <p class="field-help" data-item-hpp-hint>${r?`HPP tersimpan pada item ini`:`Isi HPP manual jika produk tidak tertaut`}</p>
        </div>
      </div>
      <p class="field-error" data-item-error></p>
    </div>
  `}function es(){return{productId:null,productName:``,sku:``,quantity:1,unitPrice:0,hppSnapshot:0}}var ts=async e=>{let{root:t,services:n}=e,r=e.params.id??null,i=r!==null;t.innerHTML=J(i?`Memuat pesanan…`:`Menyiapkan formulir pesanan…`);try{let[a,o,s]=await Promise.all([n.storeService.listAll(),n.productService.list(),r?n.orderService.getDetail(r):Promise.resolve(null)]);if(e.signal.aborted)return;e.setTitle(i?`Ubah pesanan`:`Pesanan baru`);let c=e.query.get(`storeId`),l=a.filter(e=>e.status===`active`),u=s?.storeId??(c&&l.some(e=>e.id===c)?c:l[0]?.id??``);if(!i&&l.length===0){t.innerHTML=`
        ${H({eyebrow:`Transaksi penjualan`,title:`Pesanan baru`,actions:`<a class="btn btn-secondary" href="#/orders">${B(`arrow-left`)}<span>Kembali</span></a>`})}
        <div class="card"><div class="card-body">
          ${q({iconName:`store`,title:`Belum ada toko aktif`,description:`Pesanan harus terkait toko. Tambahkan toko atau aktifkan kembali toko yang diarsipkan terlebih dahulu.`,action:`<a class="btn btn-primary" href="#/stores/new">${B(`plus`)}<span>Tambah toko</span></a>
              <a class="btn btn-secondary" href="#/stores?archived=1">Lihat toko diarsipkan</a>`})}
        </div></div>
      `,z(t);return}let d=Co(a,u,{activeOnly:!0}),f=s?.items.map(e=>({id:e.id,productId:e.productId,productName:e.productName,sku:e.sku,quantity:e.quantity,unitPrice:e.unitPrice,hppSnapshot:e.hppSnapshot}))??[es()],p=s?.refunds.filter(e=>e.status===`completed`).reduce((e,t)=>e+t.amount,0)??0;t.innerHTML=`
      ${H({eyebrow:`Transaksi penjualan`,title:i?`Ubah pesanan`:`Pesanan baru`,subtitle:i?`HPP snapshot item yang sudah ada dipertahankan. Perubahan item dapat memakai HPP produk saat ini.`:`HPP setiap item disimpan sebagai snapshot saat pesanan dibuat. Perubahan HPP produk tidak akan mengubah pesanan ini.`,actions:`<a class="btn btn-secondary" href="#${i&&r?`/orders/${r}`:`/orders`}">${B(`arrow-left`)}<span>Kembali</span></a>`})}

      <form class="form-card order-form" id="order-form" novalidate>
        ${no()}
        <div class="form-section">
          <div class="form-section-head">
            <h2>Informasi pesanan</h2>
            <p>Nomor pesanan harus unik per toko. Status batal, retur, dan refund tidak dihitung sebagai penjualan.</p>
          </div>
          <div class="form-grid">
            ${X({name:`storeId`,label:`Toko`,type:`select`,value:u,options:d,required:!0,idPrefix:`order`})}
            ${X({name:`marketplaceOrderId`,label:`Nomor pesanan marketplace`,value:s?.marketplaceOrderId??``,required:!0,placeholder:`Contoh: 240615ABC123`,idPrefix:`order`})}
            ${X({name:`orderDate`,label:`Tanggal pesanan`,type:`date`,value:s?.orderDate??w(),required:!0,idPrefix:`order`})}
            ${X({name:`status`,label:`Status pesanan`,type:`select`,value:s?.status??`completed`,options:en.map(e=>({value:e,label:za[e]})),required:!0,idPrefix:`order`})}
            ${X({name:`sellerDiscount`,label:`Diskon penjual`,type:`money`,value:s?String(s.sellerDiscount):`0`,help:`Diskon yang ditanggung penjual. Mengurangi penjualan bersih.`,idPrefix:`order`})}
            ${X({name:`marketplaceDiscount`,label:`Diskon marketplace`,type:`money`,value:s?String(s.marketplaceDiscount):`0`,help:`Ditanggung marketplace; tidak mengurangi pendapatan penjual.`,idPrefix:`order`})}
            ${X({name:`shippingPaid`,label:`Ongkir dibayar pembeli`,type:`money`,value:s?String(s.shippingPaid):`0`,help:`Nilai ongkir yang dibayar pembeli, jika ada.`,idPrefix:`order`})}
            ${X({name:`settlementValue`,label:`Nilai pencairan`,type:`money`,value:s?.settlementValue!==null&&s?.settlementValue!==void 0?String(s.settlementValue):``,help:`Opsional. Nilai bersih yang dicairkan marketplace untuk pesanan ini.`,idPrefix:`order`})}
            ${X({name:`notes`,label:`Catatan`,type:`textarea`,value:s?.notes??``,rows:3,placeholder:`Catatan pesanan…`,idPrefix:`order`,span:!0})}
          </div>
        </div>

        <div class="form-section">
          <div class="form-section-head">
            <h2>Item pesanan</h2>
            <p>Pilih produk agar HPP dan SKU terisi otomatis, atau isi item manual.</p>
          </div>
          <div class="order-items" id="order-items">
            ${f.map((e,t)=>$o(e,o,t+1)).join(``)}
          </div>
          <div class="order-items-actions">
            <button type="button" class="btn btn-secondary btn-sm" data-add-item>${B(`plus`)}<span>Tambah item</span></button>
            <a class="btn btn-ghost btn-sm" href="#/products/new">${B(`package`)}<span>Produk belum ada?</span></a>
          </div>
          ${o.length===0?`<p class="inline-note note-warning">${B(`triangle-alert`)} Belum ada master produk. Item manual tetap dapat disimpan tanpa tautan produk.</p>`:``}
        </div>

        <div class="form-section order-summary-section">
          <div class="form-section-head">
            <h2>Ringkasan nilai pesanan</h2>
            <p>Estimasi ini belum memasukkan biaya marketplace, iklan, dan operasional.</p>
          </div>
          <div class="order-summary" data-order-summary>
            <div><span>Omzet item</span><strong data-preview-gross>Rp 0</strong></div>
            <div><span>Diskon penjual</span><strong data-preview-discount class="value-negative">Rp 0</strong></div>
            ${p>0?`<div><span>Refund selesai</span><strong data-preview-refund class="value-negative">${F(-p)}</strong></div>`:``}
            <div class="summary-strong"><span>Penjualan bersih</span><strong data-preview-net>Rp 0</strong></div>
            <div><span>HPP snapshot</span><strong data-preview-cogs>Rp 0</strong></div>
            <div class="summary-strong"><span>Laba kotor estimasi</span><strong data-preview-profit>Rp 0</strong></div>
          </div>
          <p class="inline-note" data-preview-note hidden></p>
        </div>

        ${ro(i?`Simpan perubahan`:`Simpan pesanan`,{submitIcon:`save`,cancelHref:`#${i&&r?`/orders/${r}`:`/orders`}`})}
      </form>
    `;let m=t.querySelector(`#order-form`),h=t.querySelector(`#order-items`);if(!m||!h)throw Error(`Formulir pesanan tidak ditemukan.`);let g=m.querySelector(`button[type="submit"]`),_=new Map(o.map(e=>[e.id,e])),v=()=>{h.querySelectorAll(`.order-item.has-error`).forEach(e=>e.classList.remove(`has-error`)),h.querySelectorAll(`[data-item-error]`).forEach(e=>{e.textContent=``})},y=()=>{h.querySelectorAll(`[data-item-row]`).forEach((e,t)=>{let n=e.querySelector(`[data-item-title]`);n&&(n.textContent=`Item ${t+1}`)})},b=()=>{let e=Q(m,`status`),n=[];for(let e of h.querySelectorAll(`[data-item-row]`)){let t=An(e.querySelector(`[data-item-qty]`)?.value??``)??0,r=kn(e.querySelector(`[data-item-price]`)?.value??``)??0,i=kn(e.querySelector(`[data-item-hpp]`)?.value??``)??0;n.push({quantity:Math.max(0,t),unitPrice:Math.max(0,r),hppSnapshot:Math.max(0,i)})}let r=kn(Q(m,`sellerDiscount`))??0,i=mt({status:e,sellerDiscount:Math.max(0,r),items:n,completedRefundTotal:p,marketplaceFees:0}),a=pt(e),o=ee(`[data-preview-gross]`),s=ee(`[data-preview-discount]`),c=ee(`[data-preview-net]`),l=ee(`[data-preview-cogs]`),u=ee(`[data-preview-profit]`),d=t.querySelector(`[data-preview-note]`);o&&(o.textContent=F(i.grossSales)),s&&(s.textContent=F(-i.sellerDiscount)),c&&(c.textContent=a?F(i.netSales):`Tidak dihitung`),l&&(l.textContent=F(i.cogs)),u&&(u.textContent=a?F(i.estimatedProfit):`—`),d&&(d.hidden=a,d.textContent=a?``:`Status pesanan ini tidak dihitung sebagai penjualan. Nilai item tetap disimpan untuk riwayat.`)},ee=e=>t.querySelector(e),x=(e,t)=>{let n=e.querySelector(`[data-item-product]`),r=e.querySelector(`[data-item-name]`),i=e.querySelector(`[data-item-sku]`),a=e.querySelector(`[data-item-hpp]`),o=e.querySelector(`[data-item-price]`),s=e.querySelector(`[data-item-hpp-hint]`);if(!n||!r||!i||!a||!o)return;let c=n.value?_.get(n.value):void 0,l=c!==void 0;r.readOnly=l,i.readOnly=l,a.readOnly=l,c?(r.value=c.name,i.value=c.sku,a.value=String(c.currentCost),t&&(o.value=String(c.price)),s&&(s.textContent=`HPP mengikuti master produk saat ini`)):(s&&(s.textContent=`Isi HPP manual jika produk tidak tertaut`),a.value===``&&(a.value=`0`))};h.addEventListener(`change`,e=>{let t=e.target;if(!(t instanceof HTMLSelectElement)||!t.matches(`[data-item-product]`))return;let n=t.closest(`[data-item-row]`);n&&x(n,!0),b()}),m.addEventListener(`input`,()=>b()),t.querySelector(`[data-add-item]`)?.addEventListener(`click`,()=>{let e=$o(es(),o,h.children.length+1);h.insertAdjacentHTML(`beforeend`,e),y(),z(h.lastElementChild??h),b()}),h.addEventListener(`click`,e=>{let t=e.target;if(!(t instanceof Element))return;let n=t.closest(`[data-remove-item]`);if(!n)return;let r=n.closest(`[data-item-row]`);r&&(h.querySelectorAll(`[data-item-row]`).length<=1?V(`Pesanan harus memiliki minimal satu item.`,`info`):(r.remove(),y(),b()))}),b(),m.addEventListener(`submit`,async t=>{if(t.preventDefault(),g){so(m,null),v(),Z(g,!0,`Menyimpan…`);try{let t=[],a=0;for(let e of h.querySelectorAll(`[data-item-row]`)){a+=1;let n=t=>{e.classList.add(`has-error`);let n=e.querySelector(`[data-item-error]`);throw n&&(n.textContent=t),new N(`Item ${a}: ${t}`,{items:`Item ${a}: ${t}`})},r=e.querySelector(`[data-item-product]`)?.value||null,i=r?_.get(r):void 0,o=An(e.querySelector(`[data-item-qty]`)?.value??``);(o===null||o<=0)&&n(`Kuantitas harus bilangan bulat lebih dari 0.`);let s=kn(e.querySelector(`[data-item-price]`)?.value??``);(s===null||s<0)&&n(`Harga satuan harus nominal Rupiah bulat minimal 0.`);let c=kn(e.querySelector(`[data-item-hpp]`)?.value??``);(c===null||c<0)&&n(`HPP harus nominal Rupiah bulat minimal 0.`);let l=e.querySelector(`[data-item-name]`)?.value.trim()??``,u=e.querySelector(`[data-item-sku]`)?.value.trim()??``;!r&&l===``&&n(`Nama produk wajib diisi untuk item manual.`),!r&&u===``&&n(`SKU wajib diisi untuk item manual.`);let d={productId:r,productName:i?.name??l,sku:i?.sku??u,quantity:o,unitPrice:s},f=e.dataset.itemId;f&&(d.id=f),r||(d.hppSnapshot=c),t.push(d)}if(t.length===0)throw new N(`Pesanan harus memiliki minimal satu item.`,{items:`Tambahkan minimal satu item.`});let o={storeId:Q(m,`storeId`),marketplaceOrderId:Q(m,`marketplaceOrderId`),orderDate:Q(m,`orderDate`),status:Q(m,`status`),sellerDiscount:lo(m,`sellerDiscount`,`Diskon penjual`),marketplaceDiscount:lo(m,`marketplaceDiscount`,`Diskon marketplace`),shippingPaid:lo(m,`shippingPaid`,`Ongkir dibayar pembeli`),settlementValue:uo(m,`settlementValue`,`Nilai pencairan`),notes:Q(m,`notes`)||null,items:t},s=i&&r?await n.orderService.update(r,o):await n.orderService.create(o);V(i?`Perubahan pesanan tersimpan.`:`Pesanan berhasil dibuat.`,`success`),e.navigate(`/orders/${s.id}`)}catch(e){so(m,e),Z(g,!1),e instanceof N||V(`Pesanan gagal disimpan.`,`error`)}}}),z(t)}catch(n){$(t,e,n)}};function ns(e,t){let n=0,r=!1;for(let i=0;i<e.length;i+=1){let a=e[i];a===`"`?r&&e[i+1]===`"`?i+=1:r=!r:a===t&&!r&&(n+=1)}return n}function rs(e){let t=e.split(/\r?\n/,1)[0]??``,n=[`,`,`;`,`	`],r=`,`,i=-1;for(let e of n){let n=ns(t,e);n>i&&(r=e,i=n)}return r}function is(e,t){let n=e.replace(/^\uFEFF/,``),r=t??rs(n),i=[],a=[],o=``,s=!1,c=()=>{a.push(o),o=``},l=()=>{c(),a.some(e=>e.trim()!==``)&&i.push(a),a=[]};for(let e=0;e<n.length;e+=1){let t=n[e];s?t===`"`?n[e+1]===`"`?(o+=`"`,e+=1):s=!1:o+=t:t===`"`&&o===``?s=!0:t===r?c():t===`
`?l():t===`\r`?(n[e+1]===`
`&&(e+=1),l()):o+=t}if(s)throw Error(`File CSV tidak valid: tanda kutip tidak ditutup.`);(o!==``||a.length>0)&&l();let u=i.shift();if(!u)throw Error(`File tidak memiliki baris judul kolom.`);let d=u.map(e=>e.trim());return{headers:d,rows:i.map(e=>{let t=[...e];for(;t.length<d.length;)t.push(``);return t.slice(0,d.length)}),delimiter:r}}function as(e){return/[",;\n\r]/.test(e)?`"${e.replace(/"/g,`""`)}"`:e}function os(e,t){let n=[e.map(as).join(`,`)];for(let e of t)n.push(e.map(e=>as(e)).join(`,`));return`\uFEFF${n.join(`\r
`)}\r\n`}var ss=class extends Error{constructor(e){super(e),this.name=`ImportFileError`}},cs=12582912;function ls(e){if(e==null)return``;if(typeof e==`string`)return e.trim();if(typeof e==`number`)return String(e);if(typeof e==`boolean`)return e?`TRUE`:`FALSE`;if(e instanceof Date&&!Number.isNaN(e.getTime()))return`${e.getFullYear()}-${String(e.getMonth()+1).padStart(2,`0`)}-${String(e.getDate()).padStart(2,`0`)}`;if(typeof e==`object`){let t=e;if(typeof t.text==`string`)return t.text.trim();if(t.result!==void 0)return ls(t.result);if(Array.isArray(t.richText))return t.richText.map(e=>e.text??``).join(``).trim();if(typeof t.hyperlink==`string`)return t.hyperlink}return String(e).trim()}function us(e){let t=e.map((e,t)=>{let n=e.trim();return n===``?`Kolom ${t+1}`:n}),n=new Map;for(let e of t){let t=e.toLowerCase();if(n.set(t,(n.get(t)??0)+1),(n.get(t)??0)>1)throw new ss(`Nama kolom "${e}" muncul lebih dari sekali.`)}return t}function ds(e,t){if(e.length===0)throw new ss(`File tidak memiliki data.`);let n=e[0];if(!n)throw new ss(`File tidak memiliki baris judul kolom.`);let r=us(n),i=[];for(let t=1;t<e.length;t+=1){let n=e[t]??[],a=r.map((e,t)=>(n[t]??``).trim());a.every(e=>e===``)||i.push({rowNumber:t+1,values:a})}if(i.length===0)throw new ss(`File hanya berisi judul kolom tanpa data.`);return{headers:r,rows:i,fileName:t}}async function fs(e){let t=is(await e.text());return ds([t.headers,...t.rows],e.name)}async function ps(e){let t=new(await(de(async()=>{let{default:e}=await import(`./exceljs.min-CX77fFuh.js`).then(e=>c(e.default,1));return{default:e}},[]))).default.Workbook;try{let n=await e.arrayBuffer();await t.xlsx.load(n)}catch{throw new ss(`File Excel tidak dapat dibaca. Pastikan formatnya .xlsx yang valid.`)}let n=t.worksheets[0];if(!n)throw new ss(`File Excel tidak memiliki lembar kerja.`);let r=[];return n.eachRow({includeEmpty:!1},(e,t)=>{let i=[],a=Math.max(n.columnCount,1);for(let t=1;t<=a;t+=1)i.push(ls(e.getCell(t).value));i.some(e=>e!==``)&&(r[t-1]=i)}),ds(r.filter(e=>Array.isArray(e)),e.name)}async function ms(e){if(e.size===0)throw new ss(`File kosong.`);if(e.size>cs)throw new ss(`Ukuran file maksimal 12 MB.`);let t=e.name.toLowerCase();if(t.endsWith(`.csv`)||t.endsWith(`.txt`))return fs(e);if(t.endsWith(`.xlsx`))return ps(e);throw new ss(`Format file harus CSV atau XLSX.`)}var hs=[`orderId`,`orderDate`,`status`,`productName`,`sku`,`quantity`,`unitPrice`,`hpp`,`sellerDiscount`,`marketplaceDiscount`,`shippingPaid`,`marketplaceFee`,`refundAmount`,`refundQuantity`,`notes`];function gs(e){return`
    <ol class="wizard-steps" aria-label="Langkah import">
      ${[{number:1,label:`Pilih file`},{number:2,label:`Petakan kolom`},{number:3,label:`Pratinjau`},{number:4,label:`Hasil`}].map(t=>`
            <li class="wizard-step ${t.number===e?`is-active`:``} ${t.number<e?`is-complete`:``}">
              <span class="wizard-number">${t.number<e?B(`check`):t.number}</span>
              <span>${t.label}</span>
            </li>
          `).join(``)}
    </ol>
  `}function _s(){return`<p class="form-error" data-import-error hidden role="alert"></p>`}function vs(e,t){let n=e.querySelector(`[data-import-error]`);n?(n.textContent=t,n.hidden=!1,n.scrollIntoView({block:`nearest`})):V(t,`error`)}function ys(e){let t=e.querySelector(`[data-import-error]`);t&&(t.textContent=``,t.hidden=!0)}function bs(e){let t=e.items.reduce((e,t)=>e+t.quantity,0);return`${I(e.items.length)} item · ${I(t)} unit`}function xs(e){return e.items.reduce((e,t)=>e+t.quantity*t.unitPrice,0)}function Ss(e,t){let n=e[t];return n.length===0?``:`<ul class="import-issue-list">${n.map(e=>typeof e==`string`?`<li>${L(e)}</li>`:`<li>Baris ${e.rowNumber}: ${L(e.message)}</li>`).join(``)}</ul>`}var Cs=async e=>{let{root:t,services:n}=e;t.innerHTML=J(`Menyiapkan import pesanan…`);try{let r=await n.storeService.listAll();if(e.signal.aborted)return;e.setTitle(`Import pesanan`);let i=r.filter(e=>e.status===`active`);if(i.length===0){t.innerHTML=`
        ${H({eyebrow:`Transaksi penjualan`,title:`Import pesanan`,actions:`<a class="btn btn-secondary" href="#/orders">${B(`arrow-left`)}<span>Kembali</span></a>`})}
        ${U({body:q({iconName:`store`,title:`Belum ada toko aktif`,description:`Import pesanan membutuhkan toko tujuan. Tambahkan toko atau aktifkan kembali toko yang diarsipkan.`,action:K(`/stores/new`,`Tambah toko`,`btn btn-primary`,`plus`)})})}
      `,z(t);return}let a=e.query.get(`storeId`),o={step:1,storeId:i.some(e=>e.id===a)?a:i[0]?.id??``,tabular:null,mapping:null,preview:null,result:null},s=()=>{o.step=1,o.tabular=null,o.mapping=null,o.preview=null,o.result=null,h()},c=e=>{o.step=e,h()},l=()=>{let e=o.tabular?.fileName??``;return`
        ${U({title:`1. Pilih toko dan file`,subtitle:`Format CSV atau XLSX. File diproses sepenuhnya di perangkat ini.`,body:`
            ${_s()}
            <div class="form-grid">
              ${X({name:`storeId`,label:`Toko tujuan`,type:`select`,value:o.storeId,required:!0,options:Co(i,o.storeId),idPrefix:`import`,help:`Seluruh pesanan pada file akan masuk ke toko ini. Nomor pesanan unik per toko.`})}
              <div class="field">
                <label class="field-label" for="import-file">File CSV / XLSX</label>
                <input class="input file-input" id="import-file" type="file" accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" />
                <p class="field-help">Maksimal 12 MB. Baris judul kolom harus berada di baris pertama.</p>
              </div>
            </div>
            ${e?`<p class="inline-note">${B(`file-spreadsheet`)} File siap diproses: <strong>${L(e)}</strong>. Pilih file baru untuk menggantinya.</p>`:``}
            <div class="wizard-actions">
              <button type="button" class="btn btn-ghost" data-download-template>${B(`download`)}<span>Unduh template CSV</span></button>
              <span class="wizard-spacer"></span>
              <button type="button" class="btn btn-primary" data-next>${B(`arrow-right`)}<span>Lanjut ke mapping</span></button>
            </div>
            <div class="form-info">
              ${B(`info`)}
              <p>Kolom wajib: nomor pesanan, tanggal, status, kuantitas, dan harga satuan. Produk akan dicocokkan berdasarkan SKU atau nama. Pesanan dengan nomor yang sudah ada akan dilewati.</p>
            </div>
          `})}
      `},u=()=>{let e=o.tabular,t=o.mapping;if(!e||!t)return``;let n=nr(t,e.headers),r=e.rows.slice(0,5);return`
        ${U({title:`2. Petakan kolom`,subtitle:`${I(e.rows.length)} baris data · ${I(e.headers.length)} kolom terdeteksi`,body:`
            ${_s()}
            <p class="inline-note">${B(`file-spreadsheet`)} <strong>${L(e.fileName)}</strong></p>
            <div class="mapping-grid">
              ${$n.map(n=>`
                  <div class="field ${n.required?`field-required`:``}" data-field="${n.key}">
                    <label class="field-label" for="map-${n.key}">
                      ${L(n.label)}
                      ${n.required?`<span class="required-mark" aria-hidden="true">*</span>`:`<span class="optional-mark">Opsional</span>`}
                    </label>
                    <select class="input select" id="map-${n.key}" data-map-field="${n.key}">
                      <option value="">— Tidak dipakai —</option>
                      ${e.headers.map(e=>`<option value="${R(e)}" ${t[n.key]===e?`selected`:``}>${L(e)}</option>`).join(``)}
                    </select>
                    <p class="field-help">${L(n.help)}</p>
                  </div>
                `).join(``)}
            </div>
            ${n.length>0?`<div class="import-errors"><strong>Mapping belum lengkap</strong><ul>${n.map(e=>`<li>${L(e)}</li>`).join(``)}</ul></div>`:``}
            <details class="import-raw-preview">
              <summary>Lihat contoh ${r.length} baris pertama</summary>
              <div class="table-wrap">
                <table class="data-table">
                  <thead><tr>${e.headers.map(e=>`<th scope="col">${L(e)}</th>`).join(``)}</tr></thead>
                  <tbody>
                    ${r.map(e=>`<tr>${e.values.map(e=>`<td>${L(e)}</td>`).join(``)}</tr>`).join(``)}
                  </tbody>
                </table>
              </div>
            </details>
            <div class="wizard-actions">
              <button type="button" class="btn btn-secondary" data-back>${B(`arrow-left`)}<span>Kembali</span></button>
              <span class="wizard-spacer"></span>
              <button type="button" class="btn btn-primary" data-next ${n.length>0?`disabled`:``}>${B(`list-checks`)}<span>Validasi dan pratinjau</span></button>
            </div>
          `})}
      `},d=()=>{let e=o.preview;if(!e)return``;let t=e.candidates,n=[...e.ungroupedErrors.map(e=>`Baris ${e.rowNumber}: ${e.message}`),...t.flatMap(e=>e.issues.map(e=>`Baris ${e.rowNumber}: ${e.message}`))],r=t.flatMap(e=>e.warnings);return`
        ${U({title:`3. Pratinjau import`,subtitle:`${L(e.fileName)} · ${I(e.totalRows)} baris`,body:`
            ${_s()}
            <div class="kpi-grid kpi-grid-4">
              <div class="import-stat import-stat-success"><strong>${I(e.validCount)}</strong><span>Pesanan siap</span></div>
              <div class="import-stat"><strong>${I(e.successRows)}</strong><span>Baris akan disimpan</span></div>
              <div class="import-stat import-stat-warning"><strong>${I(e.duplicateCount)}</strong><span>Duplikat dilewati</span></div>
              <div class="import-stat import-stat-danger"><strong>${I(e.invalidCount)}</strong><span>Pesanan bermasalah</span></div>
            </div>
            ${e.mappingErrors.length>0?`<div class="import-errors"><strong>Mapping tidak valid</strong><ul>${e.mappingErrors.map(e=>`<li>${L(e)}</li>`).join(``)}</ul></div>`:``}
            <div class="table-wrap import-preview-table">
              <table class="data-table">
                <thead>
                  <tr>
                    <th scope="col">Baris</th>
                    <th scope="col">Nomor pesanan</th>
                    <th scope="col">Tanggal</th>
                    <th scope="col">Status</th>
                    <th scope="col">Item</th>
                    <th scope="col">Omzet</th>
                    <th scope="col">Hasil validasi</th>
                  </tr>
                </thead>
                <tbody>
                  ${t.map(e=>{let t=e.rowNumbers.length>1?`${e.rowNumbers[0]}–${e.rowNumbers[e.rowNumbers.length-1]}`:String(e.rowNumbers[0]??``),n=e.issues.length?`<span class="badge badge-danger">Bermasalah</span>`:e.duplicate?`<span class="badge badge-warning">Duplikat</span>`:`<span class="badge badge-success">Siap</span>`,r=[Ss(e,`issues`),Ss(e,`warnings`)].filter(Boolean).join(``);return`<tr class="${e.issues.length?`row-invalid`:e.duplicate?`row-muted`:``}">
                        <td data-label="Baris">${L(t)}</td>
                        <td data-label="Nomor pesanan"><code>${L(e.orderId)}</code></td>
                        <td data-label="Tanggal">${e.orderDate?D(e.orderDate):`<span class="value-negative">Tidak valid</span>`}</td>
                        <td data-label="Status">${e.issues.some(e=>e.message.includes(`Status`))?`<span class="value-negative">Tidak valid</span>`:za[e.status]}</td>
                        <td data-label="Item">${bs(e)}</td>
                        <td data-label="Omzet">${F(xs(e))}</td>
                        <td data-label="Hasil validasi">${n}${r}</td>
                      </tr>`}).join(``)}
                </tbody>
              </table>
            </div>
            ${n.length>0?`<details class="import-errors" open><summary>${I(n.length)} pesan kesalahan</summary><ul class="import-issue-list">${n.slice(0,200).map(e=>`<li>${L(e)}</li>`).join(``)}</ul>${n.length>200?`<p class="inline-note">Ditampilkan 200 pesan pertama.</p>`:``}</details>`:``}
            ${r.length>0?`<details class="import-warnings"><summary>${I(r.length)} peringatan produk/HPP</summary><ul class="import-issue-list">${r.slice(0,200).map(e=>`<li>${L(e)}</li>`).join(``)}</ul></details>`:``}
            <div class="form-info">
              ${B(`shield-check`)}
              <p>Hanya pesanan valid yang akan disimpan dalam satu transaksi database. Duplikat dan baris bermasalah tidak disimpan. Refund dan biaya marketplace pada file ikut dicatat sekali.</p>
            </div>
            <div class="wizard-actions">
              <button type="button" class="btn btn-secondary" data-back>${B(`arrow-left`)}<span>Ubah mapping</span></button>
              <span class="wizard-spacer"></span>
              <button type="button" class="btn btn-primary" data-execute ${e.validCount===0||e.mappingErrors.length>0?`disabled`:``}>${B(`upload`)}<span>Import ${I(e.validCount)} pesanan</span></button>
            </div>
          `})}
      `},f=()=>{let e=o.result;return e?`
        ${U({title:`4. Hasil import`,subtitle:`Import selesai dan tersimpan di database lokal`,body:`
            <div class="import-result-hero">
              <span class="import-result-icon">${B(`check`)}</span>
              <div>
                <h2>${I(e.orderCount)} pesanan berhasil dibuat</h2>
                <p>${I(e.successRows)} baris tersimpan · ${I(e.skippedRows)} baris duplikat dilewati · ${I(e.failedRows)} baris gagal</p>
              </div>
            </div>
            <dl class="detail-list">
              <div><dt>ID batch</dt><dd><code>${L(e.batchId)}</code></dd></div>
              <div><dt>Total baris file</dt><dd>${I(e.totalRows)}</dd></div>
              <div><dt>Peringatan</dt><dd>${I(e.warnings.length)}</dd></div>
            </dl>
            ${e.issues.length>0?`<details class="import-errors"><summary>${I(e.issues.length)} baris gagal</summary><ul class="import-issue-list">${e.issues.slice(0,200).map(e=>`<li>Baris ${e.rowNumber}: ${L(e.message)}</li>`).join(``)}</ul></details>`:``}
            ${e.warnings.length>0?`<details class="import-warnings"><summary>${I(e.warnings.length)} peringatan</summary><ul class="import-issue-list">${e.warnings.slice(0,200).map(e=>`<li>${L(e)}</li>`).join(``)}</ul></details>`:``}
            <div class="wizard-actions">
              <button type="button" class="btn btn-secondary" data-restart>${B(`upload`)}<span>Import file lain</span></button>
              <span class="wizard-spacer"></span>
              ${K(`/orders?storeId=${encodeURIComponent(o.storeId)}`,`Lihat pesanan toko`,`btn btn-secondary`,`shopping-bag`)}
              ${K(`/orders/new`,`Tambah pesanan manual`,`btn btn-primary`,`plus`)}
            </div>
          `})}
      `:``},p=e=>`
      ${H({eyebrow:`Transaksi penjualan`,title:`Import pesanan`,subtitle:`Tarik data pesanan dari file CSV/XLSX marketplace. Tidak ada data yang dikirim ke internet.`,actions:`<a class="btn btn-secondary" href="#/orders">${B(`arrow-left`)}<span>Kembali</span></a>`})}
      ${gs(o.step)}
      <div class="wizard-panel">${e}</div>
    `,m=()=>{let e=t.querySelector(`[data-field="storeId"] select, select[name="storeId"]`);e?.addEventListener(`change`,()=>{o.storeId=e.value,o.preview=null}),t.querySelector(`[data-download-template]`)?.addEventListener(`click`,async e=>{let t=e.currentTarget;Z(t,!0,`Menyiapkan…`);try{await zr(`template-import-pesanan.csv`,`text/csv;charset=utf-8`,os(hs,[])),V(`Template import berhasil dibuat.`,`success`)}catch(e){V(e instanceof Error?e.message:`Template gagal dibuat.`,`error`)}finally{Z(t,!1)}}),t.querySelector(`[data-back]`)?.addEventListener(`click`,()=>{o.step===3?c(2):c(1)}),t.querySelector(`[data-restart]`)?.addEventListener(`click`,s),o.step===1&&t.querySelector(`[data-next]`)?.addEventListener(`click`,async e=>{let n=e.currentTarget;ys(t);let r=t.querySelector(`select[name="storeId"]`);if(o.storeId=r?.value??``,!o.storeId){vs(t,`Pilih toko tujuan import terlebih dahulu.`);return}let i=t.querySelector(`#import-file`)?.files?.[0]??null;if(!i&&!o.tabular)vs(t,`Pilih file CSV atau XLSX terlebih dahulu.`);else{Z(n,!0,`Membaca file…`);try{if(i&&(o.tabular=await ms(i),o.mapping=tr(o.tabular.headers),o.preview=null),!o.tabular||!o.mapping)throw new ss(`File tidak dapat dibaca.`);c(2)}catch(e){Z(n,!1),vs(t,e instanceof Error?e.message:`File gagal dibaca.`)}}}),o.step===2&&o.mapping&&(t.querySelectorAll(`[data-map-field]`).forEach(e=>{e.addEventListener(`change`,()=>{if(!o.mapping)return;let n=e.dataset.mapField;o.mapping[n]=e.value===``?null:e.value;let r=t.querySelector(`.import-errors`);r&&r.remove();let i=t.querySelector(`[data-next]`);i&&(i.disabled=!1)})}),t.querySelector(`[data-next]`)?.addEventListener(`click`,async e=>{let r=e.currentTarget,i=o.tabular,a=o.mapping;if(!i||!a)return;ys(t);let s=nr(a,i.headers);if(s.length>0)vs(t,s.join(` `));else{Z(r,!0,`Memvalidasi…`);try{o.preview=await n.importService.preview(i,a,o.storeId),c(3)}catch(e){Z(r,!1),vs(t,e instanceof Error?e.message:`Pratinjau gagal dibuat.`)}}})),o.step===3&&t.querySelector(`[data-execute]`)?.addEventListener(`click`,async e=>{let r=e.currentTarget,i=o.preview;if(i){ys(t),Z(r,!0,`Mengimpor…`);try{o.result=await n.importService.execute(i),o.preview=null,c(4)}catch(e){Z(r,!1),vs(t,e instanceof Error?e.message:`Import gagal disimpan.`)}}})},h=()=>{let e=``;e=o.step===1?l():o.step===2?u():o.step===3?d():f(),t.innerHTML=p(e),m(),z(t)};h()}catch(n){$(t,e,n)}},ws=async e=>{let{root:t,services:n}=e;t.innerHTML=J(`Menghitung ringkasan keuangan…`);try{let r=So(e.query),[i,a]=await Promise.all([n.storeService.listAll(),n.backupRepo.getDataCounts()]);if(i.length===0){e.setTitle(`Keuangan`),t.innerHTML=`
        ${H({eyebrow:`Keuangan`,title:`Ringkasan keuangan`,subtitle:`Semua angka dihitung dari transaksi yang tersimpan di perangkat.`,actions:K(`/reports`,`Buka laporan`,`btn btn-secondary`,`chart-column`)})}
        ${U({body:q({iconName:`wallet`,title:`Belum ada data keuangan`,description:`Tambahkan toko dan pesanan terlebih dahulu. Biaya marketplace, iklan, operasional, refund, dan settlement akan muncul di sini setelah dicatat.`,action:`${K(`/stores/new`,`Tambah toko`,`btn btn-primary`,`plus`)}
              ${K(`/orders/import`,`Import pesanan`,`btn btn-secondary`,`upload`)}`})})}
      `,z(t);return}let o=r.storeId?i.filter(e=>e.id===r.storeId):i,[s,c,l,u]=await Promise.all([n.financeService.getSummary(r.period,r.storeId),n.financeService.getDaily(r.period,r.storeId),n.financeService.getStorePerformance(r.period,o),n.financeService.getReceivedSettlements(r.period,r.storeId)]);if(e.signal.aborted)return;e.setTitle(`Keuangan`);let d=r.storeId?i.find(e=>e.id===r.storeId)?.name??null:null,f=s.orderCount>0||s.marketplaceFees!==0||s.advertisingSpend!==0||s.operationalExpenses!==0||s.refunds!==0||u!==0,p=[{href:`/finance/fees`,title:`Biaya marketplace`,description:`Potongan administrasi, layanan, komisi, dan promosi.`,iconName:`credit-card`,count:a.fees,countLabel:`biaya`},{href:`/finance/ads`,title:`Iklan`,description:`Kampanye, pengeluaran harian, ROAS, dan ACOS.`,iconName:`megaphone`,count:a.campaigns,countLabel:`kampanye`},{href:`/finance/expenses`,title:`Biaya operasional`,description:`Gaji, listrik, sewa, perawatan mesin, dan biaya bersama.`,iconName:`receipt`,count:a.operationalExpenses,countLabel:`catatan`},{href:`/finance/refunds`,title:`Refund`,description:`Pengembalian dana yang mengurangi penjualan sekali saja.`,iconName:`refresh-cw`,count:a.refunds,countLabel:`refund`},{href:`/finance/settlements`,title:`Settlement`,description:`Pencairan dana marketplace sebagai arus kas, bukan omzet baru.`,iconName:`banknote`,count:a.settlements,countLabel:`settlement`}];if(t.innerHTML=`
      ${H({eyebrow:d?`Toko ${d}`:`Semua toko`,title:`Ringkasan keuangan`,subtitle:r.period.label,actions:`
          ${K(`/finance/expenses/new`,`Catat biaya`,`btn btn-secondary`,`plus`)}
          ${K(`/reports`,`Buka laporan`,`btn btn-primary`,`chart-column`)}
        `})}

      ${To(r,i)}

      <div class="kpi-grid">
        ${W({label:`Penjualan bersih`,value:F(s.netSales),iconName:`banknote`,hint:`${I(s.orderCount)} pesanan · ${I(s.unitsSold)} unit`})}
        ${W({label:`Laba kotor`,value:F(s.grossProfit),iconName:`trending-up`,tone:s.grossProfit>=0?`positive`:`negative`,hint:`Setelah HPP ${F(s.cogs)}`})}
        ${W({label:`Laba operasional`,value:F(s.operatingProfit),iconName:s.operatingProfit>=0?`trending-up`:`trending-down`,tone:s.operatingProfit>=0?`positive`:`negative`,hint:s.marginPercent===null?`Margin N/A`:`Margin ${Dn(s.marginPercent)}`})}
        ${W({label:`Dana settlement diterima`,value:F(u),iconName:`wallet`,hint:`Arus kas, tidak menambah omzet`})}
      </div>

      ${s.hasEstimatedFees?`<p class="inline-note note-warning">${B(`triangle-alert`)} Sebagian biaya marketplace masih berupa estimasi dan tidak dianggap biaya aktual.</p>`:``}

      ${f?`
            <div class="finance-grid">
              ${U({title:`Rincian laba rugi`,subtitle:`Tidak ada biaya yang dihitung dua kali`,body:Ro(s,r.storeId)})}
              ${U({title:`Arus kas dan catatan`,subtitle:`Informasi agar omzet tidak tertukar dengan pencairan`,body:`
                  <div class="finance-cashflow">
                    <div>
                      <span>${B(`banknote`)} Settlement diterima</span>
                      <strong>${F(u)}</strong>
                    </div>
                    <p>Settlement adalah uang yang benar-benar dicairkan marketplace. Nilai ini tidak ditambahkan ke penjualan bersih atau laba.</p>
                  </div>
                  <div class="finance-cashflow">
                    <div>
                      <span>${B(`refresh-cw`)} Refund selesai</span>
                      <strong>${F(s.refunds)}</strong>
                    </div>
                    <p>Refund pada pesanan yang masih dihitung sebagai penjualan mengurangi pendapatan satu kali.</p>
                  </div>
                  <div class="finance-cashflow">
                    <div>
                      <span>${B(`percent`)} Diskon marketplace</span>
                      <strong>${F(s.marketplaceDiscount)}</strong>
                    </div>
                    <p>Diskon yang ditanggung marketplace tidak mengurangi pendapatan penjual.</p>
                  </div>
                  <p class="inline-note">${B(`info`)} ${L(zo(r.storeId))}</p>
                `})}
            </div>

            ${U({title:`Tren penjualan dan laba`,subtitle:`Nilai harian pada periode aktif`,body:`<div class="chart-box chart-box-lg"><canvas id="finance-chart" aria-label="Grafik penjualan bersih dan laba operasional" role="img"></canvas></div>`})}
          `:U({body:q({iconName:`chart-pie`,title:`Belum ada aktivitas keuangan`,description:`Tidak ada pesanan, biaya, atau settlement pada filter yang dipilih. Ubah periode/toko atau catat transaksi baru.`,action:`${K(`/orders/new`,`Tambah pesanan`,`btn btn-primary`,`plus`)}
                  ${K(`/finance/expenses/new`,`Catat biaya`,`btn btn-secondary`,`plus`)}`})})}

      <div class="section-heading">
        <h2>Kelola keuangan</h2>
        <p>Setiap catatan terhubung ke toko dan periode laporan.</p>
      </div>
      <div class="shortcut-grid">
        ${p.map(e=>`
              <a class="shortcut-card" href="#${e.href}">
                <span class="shortcut-icon">${B(e.iconName)}</span>
                <div>
                  <strong>${L(e.title)}</strong>
                  <p>${L(e.description)}</p>
                  <span class="shortcut-meta">${I(e.count)} ${L(e.countLabel)}</span>
                </div>
                ${B(`arrow-right`,`shortcut-arrow`)}
              </a>
            `).join(``)}
      </div>

      ${l.length>1?U({title:`Perbandingan toko`,subtitle:`Diurutkan dari penjualan bersih`,padded:!1,body:Y([`Toko`,`Pesanan`,`Omzet`,`Penjualan bersih`,`Laba operasional`],l.map(e=>[`<a class="table-link" href="#/stores/${e.storeId}">${L(e.storeName)}</a><span class="table-sub">${Pa[e.platform]}</span>`,I(e.summary.orderCount),F(e.summary.grossSales),F(e.summary.netSales),`<span class="${e.summary.operatingProfit>=0?`value-positive`:`value-negative`}">${F(e.summary.operatingProfit)}</span>`]))}):``}
    `,Do(t,e),f){let n=t.querySelector(`#finance-chart`);if(n){let t=await jo(n,c.map(e=>D(e.date)),[{label:`Penjualan bersih`,data:c.map(e=>e.netSales),color:`#2563EB`,fillColor:`rgba(37, 99, 235, 0.10)`,fill:!0},{label:`Laba operasional`,data:c.map(e=>e.operatingProfit),color:`#16A34A`}],{currency:!0,signal:e.signal});t&&e.onCleanup(()=>t.destroy())}}z(t)}catch(n){$(t,e,n)}};function Ts(e){let t=new URLSearchParams({feeDate:w()});return e&&t.set(`storeId`,e),`/finance/fees/new?${t.toString()}`}var Es=async e=>{let{root:t,services:n}=e;t.innerHTML=J(`Memuat biaya marketplace…`);try{let r=So(e.query),i=e.query.get(`feeType`)??`all`,a=e.query.get(`source`)??`all`,o=tn.includes(i)?i:`all`,s=nn.includes(a)?a:`all`,c=e.query.get(`search`)?.trim()??``,l=No(e.query.get(`page`)),[u,d]=await Promise.all([n.storeService.listAll(),n.feeService.list({storeId:r.storeId,feeType:o,source:s,search:c,from:r.period.from,to:r.period.to,page:l,pageSize:25})]);if(e.signal.aborted)return;e.setTitle(`Biaya marketplace`);let f=d.items.filter(e=>e.source===`actual`).reduce((e,t)=>e+t.amount,0),p=d.items.filter(e=>e.source===`estimated`).reduce((e,t)=>e+t.amount,0),m=r.storeId!==null||r.period.preset!==`thisMonth`||o!==`all`||s!==`all`||c!==``,h=d.items.map(e=>[`<span class="table-strong">${D(e.feeDate)}</span>`,e.orderId?`<a class="table-link" href="#/orders/${e.orderId}">${L(e.marketplaceOrderId??`Pesanan`)}</a><span class="table-sub">${L(e.storeName)}</span>`:`<span class="muted">Biaya umum</span><span class="table-sub">${L(e.storeName)}</span>`,Va[e.feeType],G(Ha[e.source],Ua[e.source]),F(e.amount),e.notes?`<span class="table-note">${L(e.notes)}</span>`:`<span class="muted">—</span>`,`<div class="table-actions">
        <a class="btn btn-ghost btn-sm" href="#/finance/fees/${e.id}/edit">Ubah</a>
        <button type="button" class="btn btn-ghost btn-icon" data-delete-fee="${R(e.id)}" aria-label="Hapus biaya" title="Hapus biaya">${B(`trash`)}</button>
      </div>`]);t.innerHTML=`
      ${H({eyebrow:`Keuangan`,title:`Biaya marketplace`,subtitle:`${I(d.total)} biaya pada filter aktif. Estimasi diberi label terpisah dari biaya aktual.`,actions:K(Ts(r.storeId),`Catat biaya`,`btn btn-primary`,`plus`)})}

      ${To(r,u)}

      <div class="filter-bar filter-bar-extra">
        <div class="filter-control">
          <label class="filter-label" for="fee-type">Jenis biaya</label>
          <select class="input select" id="fee-type" data-fee-type>
            <option value="all" ${o===`all`?`selected`:``}>Semua jenis</option>
            ${tn.map(e=>`<option value="${e}" ${e===o?`selected`:``}>${Va[e]}</option>`).join(``)}
          </select>
        </div>
        <div class="filter-control">
          <label class="filter-label" for="fee-source">Sumber</label>
          <select class="input select" id="fee-source" data-fee-source>
            <option value="all" ${s===`all`?`selected`:``}>Semua sumber</option>
            <option value="actual" ${s===`actual`?`selected`:``}>Aktual</option>
            <option value="estimated" ${s===`estimated`?`selected`:``}>Estimasi</option>
          </select>
        </div>
        <form class="filter-search" data-fee-search role="search">
          <label class="filter-label" for="fee-search">Cari</label>
          <div class="search-input-wrap">
            ${B(`search`,`search-icon`)}
            <input class="input" id="fee-search" name="search" type="search" value="${R(c)}" placeholder="Nomor pesanan, toko, atau catatan…" autocomplete="off" />
            <button type="submit" class="btn btn-secondary btn-sm">Cari</button>
          </div>
        </form>
        ${m?`<a class="filter-reset" href="#/finance/fees">${B(`x`)} Reset</a>`:``}
      </div>

      <div class="kpi-grid kpi-grid-3">
        <div class="import-stat"><strong>${F(f)}</strong><span>Aktual pada halaman ini</span></div>
        <div class="import-stat import-stat-warning"><strong>${F(p)}</strong><span>Estimasi pada halaman ini</span></div>
        <div class="import-stat"><strong>${I(d.items.length)}</strong><span>Baris ditampilkan</span></div>
      </div>

      ${d.items.length>0?U({padded:!1,body:Y([`Tanggal`,`Pesanan / toko`,`Jenis`,`Sumber`,`Nominal`,`Catatan`,``],h)}):U({body:q({iconName:m?`search`:`credit-card`,title:m?`Biaya tidak ditemukan`:`Belum ada biaya marketplace`,description:m?`Tidak ada biaya yang sesuai dengan filter. Ubah periode, toko, jenis, atau sumber biaya.`:`Catat potongan marketplace secara manual atau import pesanan yang memuat biaya aktual. Biaya estimasi akan diberi label.`,action:m?`<a class="btn btn-secondary" href="#/finance/fees">${B(`refresh-cw`)}<span>Reset filter</span></a>`:K(Ts(r.storeId),`Catat biaya pertama`,`btn btn-primary`,`plus`)})})}
      ${$a({page:d.page,pageSize:d.pageSize,total:d.total})}
    `,Do(t,e),t.querySelector(`[data-fee-type]`)?.addEventListener(`change`,t=>{let n=t.currentTarget;Mo(e,{feeType:n.value===`all`?null:n.value,page:null})}),t.querySelector(`[data-fee-source]`)?.addEventListener(`change`,t=>{let n=t.currentTarget;Mo(e,{source:n.value===`all`?null:n.value,page:null})});let g=t.querySelector(`[data-fee-search]`);g?.addEventListener(`submit`,t=>{t.preventDefault(),Mo(e,{search:g.querySelector(`input[name="search"]`)?.value.trim()||null,page:null})}),eo(t,t=>{e.navigate(Eo(e.path,e.query,{page:t}))}),t.querySelectorAll(`[data-delete-fee]`).forEach(t=>{t.addEventListener(`click`,async()=>{let r=t.dataset.deleteFee??``,i=d.items.find(e=>e.id===r);if(i&&await yo({title:`Hapus biaya marketplace?`,message:`Biaya ${F(i.amount)} pada ${D(i.feeDate)} akan dihapus permanen.`,confirmLabel:`Hapus biaya`,tone:`danger`}))try{await n.feeService.delete(r),V(`Biaya marketplace dihapus.`,`success`),e.refresh()}catch(e){V(e instanceof Error?e.message:`Biaya gagal dihapus.`,`error`)}})}),z(t)}catch(n){$(t,e,n)}};function Ds(e,t,n){let r=new Map;n&&r.set(n.id,n);for(let t of e)r.set(t.id,t);let i=[{value:``,label:`Tanpa pesanan (biaya umum toko)`}];for(let e of r.values())i.push({value:e.id,label:`${e.marketplaceOrderId} · ${D(e.orderDate)} · ${za[e.status]}`});return t&&!r.has(t)&&i.push({value:t,label:`Pesanan ${t}`}),i}async function Os(e,t){return t?(await e.orderService.list({storeId:t,pageSize:100})).items:[]}var ks=async e=>{let{root:t,services:n}=e,r=e.params.id??null,i=r!==null;t.innerHTML=J(i?`Memuat biaya…`:`Menyiapkan formulir…`);try{let[a,o]=await Promise.all([n.storeService.listAll(),r?n.feeService.get(r):Promise.resolve(null)]);if(e.signal.aborted)return;e.setTitle(i?`Ubah biaya marketplace`:`Biaya marketplace baru`);let s=a.filter(e=>e.status===`active`);if(s.length===0){t.innerHTML=`
        ${H({eyebrow:`Keuangan`,title:i?`Ubah biaya`:`Catat biaya marketplace`,actions:`<a class="btn btn-secondary" href="#/finance/fees">${B(`arrow-left`)}<span>Kembali</span></a>`})}
        ${U({body:q({iconName:`store`,title:`Belum ada toko aktif`,description:`Biaya marketplace harus terhubung ke toko. Tambahkan toko atau aktifkan kembali toko yang diarsipkan.`,action:K(`/stores/new`,`Tambah toko`,`btn btn-primary`,`plus`)})})}
      `,z(t);return}let c=e.query.get(`storeId`),l=o?.storeId??(c&&s.some(e=>e.id===c)?c:s[0]?.id??``),u=e.query.get(`orderId`),d=o?.orderId??u??``,f=await Os(n,l),p=null;if(d&&!f.some(e=>e.id===d))try{let e=await n.orderService.getDetail(d);p={...e,storeName:e.storeName,grossSales:e.grossSales,itemCount:e.items.length,unitCount:e.items.reduce((e,t)=>e+t.quantity,0),refundTotal:e.refundTotal,netSales:e.netSales}}catch{p=null}t.innerHTML=`
      ${H({eyebrow:`Keuangan`,title:i?`Ubah biaya marketplace`:`Catat biaya marketplace`,subtitle:`Gunakan nominal aktual bila tersedia. Estimasi hanya untuk perkiraan dan selalu diberi label.`,actions:`<a class="btn btn-secondary" href="#/finance/fees">${B(`arrow-left`)}<span>Kembali</span></a>`})}

      <form class="form-card" id="fee-form" novalidate>
        ${no()}
        <div class="form-section">
          <div class="form-section-head">
            <h2>Detail biaya</h2>
            <p>Biaya dapat dikaitkan ke pesanan atau dicatat sebagai biaya umum toko.</p>
          </div>
          <div class="form-grid">
            ${X({name:`storeId`,label:`Toko`,type:`select`,value:l,required:!0,options:Co(s,l),idPrefix:`fee`})}
            <div class="field" data-field="orderId">
              <label class="field-label" for="fee-orderId">Pesanan terkait <span class="optional-mark">Opsional</span></label>
              <select class="input select" id="fee-orderId" name="orderId">
                ${Ds(f,d||null,p).map(e=>`<option value="${R(e.value)}" ${e.value===d?`selected`:``}>${L(e.label)}</option>`).join(``)}
              </select>
              <p class="field-help" data-order-help>Menampilkan maksimal 100 pesanan terbaru pada toko ini.</p>
              <p class="field-error" data-error-for="orderId"></p>
            </div>
            ${X({name:`feeType`,label:`Jenis biaya`,type:`select`,value:o?.feeType??`admin`,required:!0,options:tn.map(e=>({value:e,label:Va[e]})),idPrefix:`fee`})}
            ${X({name:`source`,label:`Sumber nilai`,type:`select`,value:o?.source??`actual`,required:!0,options:nn.map(e=>({value:e,label:Ha[e]})),help:`Estimasi tidak dianggap biaya aktual pada laporan.`,idPrefix:`fee`})}
            ${X({name:`amount`,label:`Nominal biaya`,type:`money`,value:o?String(o.amount):``,required:!0,placeholder:`0`,idPrefix:`fee`})}
            ${X({name:`feeDate`,label:`Tanggal biaya`,type:`date`,value:o?.feeDate??e.query.get(`feeDate`)??w(),required:!0,idPrefix:`fee`})}
            ${X({name:`notes`,label:`Catatan`,type:`textarea`,value:o?.notes??``,rows:3,placeholder:`Contoh: potongan komisi pesanan periode ini…`,idPrefix:`fee`,span:!0})}
          </div>
          <div class="form-info">
            ${B(`info`)}
            <p>Biaya yang sudah tercermin di settlement tetap dicatat di sini sebagai biaya aktual. Settlement tidak menambah penjualan dan tidak menghitung biaya dua kali.</p>
          </div>
        </div>

        ${ro(i?`Simpan perubahan`:`Simpan biaya`,{submitIcon:`save`,cancelHref:`#/finance/fees`})}
      </form>
    `;let m=t.querySelector(`#fee-form`);if(!m)throw Error(`Formulir biaya tidak ditemukan.`);let h=m.querySelector(`button[type="submit"]`),g=m.querySelector(`select[name="storeId"]`),_=m.querySelector(`select[name="orderId"]`),v=m.querySelector(`[data-order-help]`),y=async(e,t)=>{if(_){_.disabled=!0,v&&(v.textContent=`Memuat pesanan toko…`);try{let r=await Os(n,e),i=r.some(e=>e.id===t)?t:``;_.innerHTML=Ds(r,i,null).map(e=>`<option value="${R(e.value)}" ${e.value===i?`selected`:``}>${L(e.label)}</option>`).join(``),v&&(v.textContent=r.length===0?`Belum ada pesanan pada toko ini. Biaya akan disimpan sebagai biaya umum toko.`:`Menampilkan maksimal 100 pesanan terbaru pada toko ini.`)}catch(e){v&&(v.textContent=`Pesanan gagal dimuat. Biaya tetap dapat disimpan tanpa pesanan.`),V(e instanceof Error?e.message:`Pesanan gagal dimuat.`,`error`)}finally{_.disabled=!1}}};g?.addEventListener(`change`,()=>{y(g.value,_?.value??``)}),m.addEventListener(`submit`,async t=>{if(t.preventDefault(),h){so(m,null),Z(h,!0,`Menyimpan…`);try{let t={storeId:Q(m,`storeId`),orderId:Q(m,`orderId`)||null,feeType:Q(m,`feeType`),source:Q(m,`source`),amount:lo(m,`amount`,`Nominal biaya`,{required:!0}),feeDate:Q(m,`feeDate`),notes:co(m,`notes`)};i&&r?await n.feeService.update(r,t):await n.feeService.create(t),V(i?`Biaya marketplace diperbarui.`:`Biaya marketplace dicatat.`,`success`),e.navigate(`/finance/fees`)}catch(e){so(m,e),Z(h,!1),e instanceof N||V(`Biaya gagal disimpan.`,`error`)}}}),z(t)}catch(n){$(t,e,n)}};function As(){return`/finance/ads/new`}function js(e){let t=new URLSearchParams({expenseDate:w()});return e&&t.set(`campaignId`,e),`/finance/ads/expenses/new?${t.toString()}`}function Ms(e){return e===null?`N/A`:`${On(e)}×`}function Ns(e){return e===null?`N/A`:Dn(e)}function Ps(e){return G(Wa[e],`info`)}function Fs(e){return e?L(e):`<span class="badge badge-primary">Semua toko</span>`}var Is=async e=>{let{root:t,services:n}=e;t.innerHTML=J(`Memuat kampanye iklan…`);try{let r=So(e.query),i=e.query.get(`platform`)??`all`,a=rn.includes(i)?i:`all`,o=e.query.get(`search`)?.trim().toLowerCase()??``,s=await n.storeService.listAll(),c=await n.advertisingService.listCampaigns(r.storeId);if(e.signal.aborted)return;e.setTitle(`Iklan`);let l=c.filter(e=>!(a!==`all`&&e.platform!==a||o&&!e.name.toLowerCase().includes(o))),u=l.reduce((e,t)=>e+t.totalSpend,0),d=l.reduce((e,t)=>e+(t.totalAttributedRevenue??0),0),f=l.reduce((e,t)=>e+t.attributionRows,0),p=u>0&&f>0?d/u:null,m=r.storeId!==null||a!==`all`||o!==``,h=l.map(e=>[`<a class="table-link" href="#/finance/ads/${e.id}">${L(e.name)}</a>${e.notes?`<span class="table-sub">${L(e.notes)}</span>`:``}`,Ps(e.platform),Fs(e.storeName),`<span class="table-strong">${F(e.totalSpend)}</span><span class="table-sub">${I(e.expenseCount)} catatan</span>`,e.totalAttributedRevenue===null?`<span class="muted">N/A</span>`:F(e.totalAttributedRevenue),Ms(e.roas),Ns(e.acos),`<div class="table-actions">
        <a class="btn btn-ghost btn-sm" href="#/finance/ads/expenses?campaignId=${encodeURIComponent(e.id)}">Biaya</a>
        <a class="btn btn-ghost btn-sm" href="#/finance/ads/${e.id}/edit">Ubah</a>
      </div>`]);t.innerHTML=`
      ${H({eyebrow:`Keuangan`,title:`Iklan`,subtitle:`Catat pengeluaran iklan per kampanye. ROAS dan ACOS hanya dihitung bila data atribusi tersedia.`,actions:`
          ${K(`/finance/ads/expenses`,`Semua biaya iklan`,`btn btn-secondary`,`receipt`)}
          ${K(As(),`Kampanye baru`,`btn btn-primary`,`plus`)}
        `})}

      <div class="kpi-grid">
        ${W({label:`Total pengeluaran iklan`,value:F(u),iconName:`megaphone`,hint:`${I(l.length)} kampanye`})}
        ${W({label:`Omzet teratribusi`,value:f>0?F(d):`N/A`,iconName:`target`,hint:f>0?`${I(f)} catatan memiliki atribusi`:`Belum ada data atribusi`})}
        ${W({label:`ROAS keseluruhan`,value:p===null?`N/A`:`${p.toFixed(2)}×`,iconName:`trending-up`,hint:`Omzet teratribusi ÷ biaya iklan`})}
        ${W({label:`Kampanye aktif tercatat`,value:I(l.length),iconName:`list-checks`,hint:m?`Setelah filter`:`Seluruh kampanye`})}
      </div>

      <div class="filter-bar filter-bar-extra">
        <div class="filter-control">
          <label class="filter-label" for="ad-store">Toko</label>
          <select class="input select" id="ad-store" data-ad-store>
            <option value="">Semua toko</option>
            ${s.map(e=>`<option value="${R(e.id)}" ${e.id===r.storeId?`selected`:``}>${L(e.name)}</option>`).join(``)}
          </select>
        </div>
        <div class="filter-control">
          <label class="filter-label" for="ad-platform">Platform</label>
          <select class="input select" id="ad-platform" data-ad-platform>
            <option value="all" ${a===`all`?`selected`:``}>Semua platform</option>
            ${rn.map(e=>`<option value="${e}" ${e===a?`selected`:``}>${Wa[e]}</option>`).join(``)}
          </select>
        </div>
        <form class="filter-search" data-ad-search role="search">
          <label class="filter-label" for="ad-search">Cari kampanye</label>
          <div class="search-input-wrap">
            ${B(`search`,`search-icon`)}
            <input class="input" id="ad-search" name="search" type="search" value="${R(o)}" placeholder="Nama kampanye…" autocomplete="off" />
            <button type="submit" class="btn btn-secondary btn-sm">Cari</button>
          </div>
        </form>
        ${m?`<a class="filter-reset" href="#/finance/ads">${B(`x`)} Reset</a>`:``}
      </div>

      ${l.length>0?U({padded:!1,body:Y([`Kampanye`,`Platform`,`Toko`,`Biaya iklan`,`Omzet teratribusi`,`ROAS`,`ACOS`,``],h)}):U({body:q({iconName:m?`search`:`megaphone`,title:m?`Kampanye tidak ditemukan`:`Belum ada kampanye iklan`,description:m?`Tidak ada kampanye yang sesuai dengan filter. Ubah toko, platform, atau kata kunci.`:`Buat kampanye untuk mengelompokkan pengeluaran iklan. Data atribusi opsional; ROAS/ACOS tampil N/A jika tidak tersedia.`,action:m?`<a class="btn btn-secondary" href="#/finance/ads">${B(`refresh-cw`)}<span>Reset filter</span></a>`:K(As(),`Buat kampanye pertama`,`btn btn-primary`,`plus`)})})}
    `,t.querySelector(`[data-ad-store]`)?.addEventListener(`change`,t=>{let n=t.currentTarget;Mo(e,{storeId:n.value||null,page:null})}),t.querySelector(`[data-ad-platform]`)?.addEventListener(`change`,t=>{let n=t.currentTarget;Mo(e,{platform:n.value===`all`?null:n.value,page:null})});let g=t.querySelector(`[data-ad-search]`);g?.addEventListener(`submit`,t=>{t.preventDefault(),Mo(e,{search:g.querySelector(`input[name="search"]`)?.value.trim()||null,page:null})}),z(t)}catch(n){$(t,e,n)}},Ls=async e=>{let{root:t,services:n}=e,r=e.params.id??``;t.innerHTML=J(`Memuat kampanye iklan…`);try{let[i,a]=await Promise.all([n.advertisingService.getCampaign(r),n.advertisingService.listExpenses({campaignId:r,pageSize:100})]);if(e.signal.aborted)return;e.setTitle(i.name);let o=a.items,s=o.reduce((e,t)=>e+(t.impressions??0),0),c=o.reduce((e,t)=>e+(t.clicks??0),0),l=s>0?c/s*100:null,u=c>0?i.totalSpend/c:null;t.innerHTML=`
      ${H({eyebrow:`Kampanye iklan`,title:i.name,subtitle:`${Wa[i.platform]} · ${i.storeName??`Semua toko`}`,actions:`
          <a class="btn btn-secondary" href="#/finance/ads">${B(`arrow-left`)}<span>Kembali</span></a>
          ${K(`/finance/ads/${i.id}/edit`,`Ubah kampanye`,`btn btn-secondary`,`pencil`)}
          ${K(js(i.id),`Catat biaya`,`btn btn-primary`,`plus`)}
        `})}

      <div class="kpi-grid">
        ${W({label:`Total biaya iklan`,value:F(i.totalSpend),iconName:`megaphone`,hint:`${I(i.expenseCount)} catatan biaya`})}
        ${W({label:`Omzet teratribusi`,value:i.totalAttributedRevenue===null?`N/A`:F(i.totalAttributedRevenue),iconName:`target`,hint:i.attributionRows>0?`${I(i.totalAttributedOrders??0)} pesanan teratribusi`:`Isi omzet teratribusi pada biaya iklan`})}
        ${W({label:`ROAS`,value:Ms(i.roas),iconName:`trending-up`,hint:`Omzet teratribusi ÷ biaya iklan`})}
        ${W({label:`ACOS`,value:Ns(i.acos),iconName:`percent`,hint:`Biaya iklan ÷ omzet teratribusi`})}
      </div>

      ${U({title:`Ringkasan kampanye`,body:`
          <dl class="detail-list detail-list-3">
            <div><dt>Platform</dt><dd>${Ps(i.platform)}</dd></div>
            <div><dt>Toko</dt><dd>${i.storeName?`<a class="table-link" href="#/stores/${i.storeId}">${L(i.storeName)}</a>`:`Semua toko (biaya bersama)`}</dd></div>
            <div><dt>Dibuat</dt><dd>${D(i.createdAt.slice(0,10),`long`)}</dd></div>
            <div><dt>Impression</dt><dd>${s>0?I(s):`N/A`}</dd></div>
            <div><dt>Click</dt><dd>${c>0?I(c):`N/A`}</dd></div>
            <div><dt>CTR</dt><dd>${l===null?`N/A`:Dn(l)}</dd></div>
            <div><dt>CPC</dt><dd>${u===null?`N/A`:F(u)}</dd></div>
            <div><dt>Pesanan teratribusi</dt><dd>${i.totalAttributedOrders===null?`N/A`:I(i.totalAttributedOrders)}</dd></div>
            <div><dt>Catatan</dt><dd>${i.notes?L(i.notes):`<span class="muted">—</span>`}</dd></div>
          </dl>
          <p class="inline-note">${B(`info`)} ROAS/ACOS bernilai N/A selama belum ada catatan biaya dengan omzet teratribusi. Angka tidak pernah dikarang.</p>
        `})}

      ${U({title:`Riwayat biaya iklan`,subtitle:`${I(o.length)} catatan terakhir`,padded:!1,body:o.length>0?Y([`Tanggal`,`Biaya`,`Impression`,`Click`,`Pesanan`,`Omzet atribusi`,`ROAS`,`ACOS`,`Catatan`,``],o.map(e=>{let t=e.attributedRevenue!==null&&e.amount>0?e.attributedRevenue/e.amount:null,n=e.attributedRevenue!==null&&e.attributedRevenue>0?e.amount/e.attributedRevenue*100:null;return[D(e.expenseDate),`<span class="table-strong">${F(e.amount)}</span>`,e.impressions===null?`—`:I(e.impressions),e.clicks===null?`—`:I(e.clicks),e.attributedOrders===null?`—`:I(e.attributedOrders),e.attributedRevenue===null?`<span class="muted">N/A</span>`:F(e.attributedRevenue),t===null?`N/A`:`${t.toFixed(2)}×`,Ns(n),e.notes?`<span class="table-note">${L(e.notes)}</span>`:`<span class="muted">—</span>`,`<div class="table-actions">
                      <a class="btn btn-ghost btn-sm" href="#/finance/ads/expenses/${e.id}/edit">Ubah</a>
                      <button type="button" class="btn btn-ghost btn-icon" data-delete-expense="${R(e.id)}" aria-label="Hapus biaya iklan" title="Hapus biaya iklan">${B(`trash`)}</button>
                    </div>`]})):q({compact:!0,iconName:`receipt`,title:`Belum ada biaya iklan`,description:`Catat pengeluaran harian kampanye beserta impression, click, dan atribusi bila tersedia.`,action:K(js(i.id),`Catat biaya iklan`,`btn btn-secondary btn-sm`,`plus`)})})}

      <div class="detail-grid">
        ${U({title:`Metrik kampanye`,body:`
            <dl class="finance-breakdown">
              <div class="finance-row"><dt>Biaya iklan</dt><dd class="value-negative">${F(-i.totalSpend)}</dd></div>
              <div class="finance-row"><dt>Omzet teratribusi</dt><dd>${i.totalAttributedRevenue===null?`N/A`:F(i.totalAttributedRevenue)}</dd></div>
              <div class="finance-row finance-row-strong"><dt>ROAS</dt><dd>${Ms(i.roas)}</dd></div>
              <div class="finance-row finance-row-strong"><dt>ACOS</dt><dd>${Ns(i.acos)}</dd></div>
            </dl>
            <p class="inline-note">${B(`info`)} Omzet teratribusi adalah omzet yang dilaporkan platform iklan. Nilai ini tidak ditambahkan ke omzet pesanan agar tidak dihitung dua kali.</p>
          `})}

        ${U({title:`Hapus kampanye`,body:`
            <div class="danger-zone danger-row">
              <div>
                <strong>Hapus kampanye dan seluruh biayanya</strong>
                <p>${I(i.expenseCount)} catatan biaya iklan akan dihapus permanen dan laba periode berubah.</p>
              </div>
              <button type="button" class="btn btn-danger btn-sm" data-delete-campaign>${B(`trash`)}<span>Hapus kampanye</span></button>
            </div>
          `})}
      </div>
    `,t.querySelectorAll(`[data-delete-expense]`).forEach(t=>{t.addEventListener(`click`,async()=>{let r=t.dataset.deleteExpense??``,i=o.find(e=>e.id===r);if(i&&await yo({title:`Hapus biaya iklan?`,message:`Biaya ${F(i.amount)} pada ${D(i.expenseDate)} akan dihapus permanen.`,confirmLabel:`Hapus biaya`,tone:`danger`}))try{await n.advertisingService.deleteExpense(r),V(`Biaya iklan dihapus.`,`success`),e.refresh()}catch(e){V(e instanceof Error?e.message:`Biaya iklan gagal dihapus.`,`error`)}})}),t.querySelector(`[data-delete-campaign]`)?.addEventListener(`click`,async t=>{let r=t.currentTarget;if(await yo({title:`Hapus kampanye iklan?`,message:`Kampanye "${i.name}" beserta ${I(i.expenseCount)} catatan biaya iklan akan dihapus permanen.`,confirmLabel:`Hapus kampanye`,tone:`danger`,requireText:i.name,details:[`Platform: ${Wa[i.platform]}`,`Toko: ${i.storeName??`Semua toko`}`,`Total biaya: ${F(i.totalSpend)}`]})){Z(r,!0,`Menghapus…`);try{await n.advertisingService.deleteCampaign(i.id),V(`Kampanye iklan dihapus.`,`success`),e.navigate(`/finance/ads`)}catch(e){Z(r,!1),V(e instanceof Error?e.message:`Kampanye gagal dihapus.`,`error`)}}}),z(t)}catch(n){$(t,e,n)}},Rs=async e=>{let{root:t,services:n}=e,r=e.params.id??null,i=r!==null;t.innerHTML=J(i?`Memuat kampanye…`:`Menyiapkan formulir…`);try{let[a,o]=await Promise.all([n.storeService.listAll(),r?n.advertisingService.getCampaign(r):Promise.resolve(null)]);if(e.signal.aborted)return;e.setTitle(i?`Ubah kampanye iklan`:`Kampanye iklan baru`);let s=a.filter(e=>e.status===`active`),c=e.query.get(`storeId`),l=o?.storeId??(c&&s.some(e=>e.id===c)?c:``);t.innerHTML=`
      ${H({eyebrow:`Iklan`,title:i?`Ubah kampanye iklan`:`Kampanye iklan baru`,subtitle:`Kampanye mengelompokkan biaya iklan dan menyimpan platform serta toko terkait.`,actions:`<a class="btn btn-secondary" href="#${i&&r?`/finance/ads/${r}`:`/finance/ads`}">${B(`arrow-left`)}<span>Kembali</span></a>`})}

      <form class="form-card" id="ad-campaign-form" novalidate>
        ${no()}
        <div class="form-section">
          <div class="form-section-head">
            <h2>Detail kampanye</h2>
            <p>Pilih toko bila biaya iklan dapat dialokasikan. Kampanye tanpa toko dihitung sebagai biaya bersama.</p>
          </div>
          <div class="form-grid">
            ${X({name:`name`,label:`Nama kampanye`,value:o?.name??``,required:!0,placeholder:`Contoh: Shopee Ads Seragam Sekolah`,idPrefix:`ad-campaign`,span:!0})}
            ${X({name:`platform`,label:`Platform`,type:`select`,value:o?.platform??`shopee`,required:!0,options:rn.map(e=>({value:e,label:Wa[e]})),idPrefix:`ad-campaign`})}
            ${X({name:`storeId`,label:`Toko terkait`,type:`select`,value:l,options:Co(s,l,{allLabel:`Semua toko (biaya bersama)`}),help:`Kosongkan untuk kampanye lintas toko.`,idPrefix:`ad-campaign`})}
            ${X({name:`notes`,label:`Catatan`,type:`textarea`,value:o?.notes??``,rows:3,placeholder:`Tujuan kampanye, target audiens, atau catatan lain…`,idPrefix:`ad-campaign`,span:!0})}
          </div>
        </div>

        ${ro(i?`Simpan perubahan`:`Simpan kampanye`,{submitIcon:`save`,cancelHref:`#${i&&r?`/finance/ads/${r}`:`/finance/ads`}`})}
      </form>
    `;let u=t.querySelector(`#ad-campaign-form`);if(!u)throw Error(`Formulir kampanye tidak ditemukan.`);let d=u.querySelector(`button[type="submit"]`);u.addEventListener(`submit`,async t=>{if(t.preventDefault(),d){so(u,null),Z(d,!0,`Menyimpan…`);try{let t={name:Q(u,`name`),platform:Q(u,`platform`),storeId:Q(u,`storeId`)||null,notes:co(u,`notes`)};i&&r?await n.advertisingService.updateCampaign(r,t):await n.advertisingService.createCampaign(t),V(i?`Kampanye diperbarui.`:`Kampanye iklan dibuat.`,`success`),e.navigate(`/finance/ads`)}catch(e){so(u,e),Z(d,!1),e instanceof N||V(`Kampanye gagal disimpan.`,`error`)}}}),z(t)}catch(n){$(t,e,n)}},zs=async e=>{let{root:t,services:n}=e;t.innerHTML=J(`Memuat biaya iklan…`);try{let r=So(e.query),i=e.query.get(`campaignId`),a=No(e.query.get(`page`)),[o,s,c]=await Promise.all([n.storeService.listAll(),n.advertisingService.listCampaigns(r.storeId),n.advertisingService.listExpenses({storeId:r.storeId,campaignId:i,from:r.period.from,to:r.period.to,page:a,pageSize:30})]);if(e.signal.aborted)return;e.setTitle(`Biaya iklan`);let l=c.items.reduce((e,t)=>e+t.amount,0),u=r.storeId!==null||r.period.preset!==`thisMonth`||i!==null;t.innerHTML=`
      ${H({eyebrow:`Iklan`,title:`Biaya iklan`,subtitle:`${I(c.total)} catatan pada filter aktif. Metrik ROAS/ACOS per baris dihitung dari atribusi yang diisi.`,actions:`
          ${K(`/finance/ads`,`Kampanye`,`btn btn-secondary`,`megaphone`)}
          ${K(js(i),`Catat biaya`,`btn btn-primary`,`plus`)}
        `})}

      ${To(r,o)}

      <div class="filter-bar filter-bar-extra">
        <div class="filter-control">
          <label class="filter-label" for="ad-campaign-filter">Kampanye</label>
          <select class="input select" id="ad-campaign-filter" data-campaign-filter>
            <option value="">Semua kampanye</option>
            ${s.map(e=>`<option value="${R(e.id)}" ${e.id===i?`selected`:``}>${L(e.name)}</option>`).join(``)}
          </select>
        </div>
        <div class="filter-control">
          <span class="filter-label">Total halaman</span>
          <div class="filter-static">${F(l)}</div>
        </div>
        ${u?`<a class="filter-reset" href="#/finance/ads/expenses">${B(`x`)} Reset</a>`:``}
      </div>

      ${c.items.length>0?U({padded:!1,body:Y([`Tanggal`,`Kampanye`,`Toko`,`Biaya`,`Impression`,`Click`,`Pesanan`,`Omzet atribusi`,`ROAS`,`ACOS`,``],c.items.map(e=>{let t=e.attributedRevenue!==null&&e.amount>0?e.attributedRevenue/e.amount:null,n=e.attributedRevenue!==null&&e.attributedRevenue>0?e.amount/e.attributedRevenue*100:null;return[D(e.expenseDate),`<a class="table-link" href="#/finance/ads/${e.campaignId}">${L(e.campaignName)}</a><span class="table-sub">${Wa[e.platform]}</span>`,e.storeName?L(e.storeName):`<span class="badge badge-primary">Bersama</span>`,`<span class="table-strong">${F(e.amount)}</span>`,e.impressions===null?`—`:I(e.impressions),e.clicks===null?`—`:I(e.clicks),e.attributedOrders===null?`—`:I(e.attributedOrders),e.attributedRevenue===null?`<span class="muted">N/A</span>`:F(e.attributedRevenue),t===null?`N/A`:`${t.toFixed(2)}×`,Ns(n),`<div class="table-actions">
                      <a class="btn btn-ghost btn-sm" href="#/finance/ads/expenses/${e.id}/edit">Ubah</a>
                      <button type="button" class="btn btn-ghost btn-icon" data-delete-expense="${R(e.id)}" aria-label="Hapus biaya iklan" title="Hapus biaya iklan">${B(`trash`)}</button>
                    </div>`]}))}):U({body:q({iconName:u?`search`:`receipt`,title:u?`Biaya iklan tidak ditemukan`:`Belum ada biaya iklan`,description:u?`Tidak ada biaya iklan pada filter ini. Ubah periode, toko, atau kampanye.`:`Buat kampanye lebih dahulu, lalu catat pengeluaran iklan harian beserta metrik opsional.`,action:u?`<a class="btn btn-secondary" href="#/finance/ads/expenses">${B(`refresh-cw`)}<span>Reset filter</span></a>`:K(`/finance/ads/new`,`Buat kampanye`,`btn btn-primary`,`plus`)})})}
      ${$a({page:c.page,pageSize:c.pageSize,total:c.total})}
    `,Do(t,e),t.querySelector(`[data-campaign-filter]`)?.addEventListener(`change`,t=>{let n=t.currentTarget;Mo(e,{campaignId:n.value||null,page:null})}),eo(t,t=>{e.navigate(Eo(e.path,e.query,{page:t}))}),t.querySelectorAll(`[data-delete-expense]`).forEach(t=>{t.addEventListener(`click`,async()=>{let r=t.dataset.deleteExpense??``,i=c.items.find(e=>e.id===r);if(i&&await yo({title:`Hapus biaya iklan?`,message:`Biaya ${F(i.amount)} untuk kampanye "${i.campaignName}" akan dihapus permanen.`,confirmLabel:`Hapus biaya`,tone:`danger`}))try{await n.advertisingService.deleteExpense(r),V(`Biaya iklan dihapus.`,`success`),e.refresh()}catch(e){V(e instanceof Error?e.message:`Biaya iklan gagal dihapus.`,`error`)}})}),z(t)}catch(n){$(t,e,n)}},Bs=async e=>{let{root:t,services:n}=e,r=e.params.id??null,i=r!==null;t.innerHTML=J(i?`Memuat biaya iklan…`:`Menyiapkan formulir…`);try{let[a,o]=await Promise.all([n.advertisingService.listCampaigns(),r?n.advertisingService.getExpense(r):Promise.resolve(null)]);if(e.signal.aborted)return;if(e.setTitle(i?`Ubah biaya iklan`:`Biaya iklan baru`),a.length===0){t.innerHTML=`
        ${H({eyebrow:`Iklan`,title:i?`Ubah biaya iklan`:`Catat biaya iklan`,actions:`<a class="btn btn-secondary" href="#/finance/ads">${B(`arrow-left`)}<span>Kembali</span></a>`})}
        ${U({body:q({iconName:`megaphone`,title:`Belum ada kampanye iklan`,description:`Biaya iklan harus terhubung ke kampanye. Buat kampanye terlebih dahulu.`,action:K(`/finance/ads/new`,`Buat kampanye`,`btn btn-primary`,`plus`)})})}
      `,z(t);return}let s=e.query.get(`campaignId`),c=o?.campaignId??(s&&a.some(e=>e.id===s)?s:a[0]?.id??``),l=a.find(e=>e.id===c)??a[0],u=a.map(e=>({value:e.id,label:`${e.name} · ${Wa[e.platform]}${e.storeName?` · ${e.storeName}`:` · Semua toko`}`}));t.innerHTML=`
      ${H({eyebrow:`Iklan`,title:i?`Ubah biaya iklan`:`Catat biaya iklan`,subtitle:l?`${l.name} · ${Wa[l.platform]}`:`Catat pengeluaran iklan dan metrik atribusi opsional.`,actions:`<a class="btn btn-secondary" href="#/finance/ads/expenses">${B(`arrow-left`)}<span>Kembali</span></a>`})}

      <form class="form-card" id="ad-expense-form" novalidate>
        ${no()}
        <div class="form-section">
          <div class="form-section-head">
            <h2>Pengeluaran iklan</h2>
            <p>Nominal wajib diisi. Impression, click, pesanan, dan omzet teratribusi opsional — kosongkan bila platform tidak menyediakannya.</p>
          </div>
          <div class="form-grid">
            ${X({name:`campaignId`,label:`Kampanye`,type:`select`,value:c,required:!0,options:u,idPrefix:`ad-expense`,span:!0})}
            ${X({name:`expenseDate`,label:`Tanggal`,type:`date`,value:o?.expenseDate??e.query.get(`expenseDate`)??w(),required:!0,idPrefix:`ad-expense`})}
            ${X({name:`amount`,label:`Biaya iklan`,type:`money`,value:o?String(o.amount):``,required:!0,placeholder:`0`,idPrefix:`ad-expense`})}
            ${X({name:`impressions`,label:`Impression`,type:`integer`,value:o?.impressions===null||o?.impressions===void 0?``:o.impressions,placeholder:`Opsional`,idPrefix:`ad-expense`,help:`Kosongkan bila tidak tersedia.`})}
            ${X({name:`clicks`,label:`Click`,type:`integer`,value:o?.clicks===null||o?.clicks===void 0?``:o.clicks,placeholder:`Opsional`,idPrefix:`ad-expense`,help:`Kosongkan bila tidak tersedia.`})}
            ${X({name:`attributedOrders`,label:`Pesanan teratribusi`,type:`integer`,value:o?.attributedOrders===null||o?.attributedOrders===void 0?``:o.attributedOrders,placeholder:`Opsional`,idPrefix:`ad-expense`,help:`Jumlah pesanan yang diklaim platform iklan.`})}
            ${X({name:`attributedRevenue`,label:`Omzet teratribusi`,type:`money`,value:o?.attributedRevenue===null||o?.attributedRevenue===void 0?``:o.attributedRevenue,placeholder:`Opsional`,idPrefix:`ad-expense`,help:`Dipakai untuk ROAS dan ACOS. Tidak menambah omzet pesanan.`})}
            ${X({name:`notes`,label:`Catatan`,type:`textarea`,value:o?.notes??``,rows:3,placeholder:`Nama iklan, targeting, atau catatan lain…`,idPrefix:`ad-expense`,span:!0})}
          </div>
          <div class="form-info">
            ${B(`info`)}
            <p>ROAS = omzet teratribusi ÷ biaya iklan. ACOS = biaya iklan ÷ omzet teratribusi × 100%. Keduanya N/A bila omzet teratribusi tidak diisi.</p>
          </div>
        </div>

        ${ro(i?`Simpan perubahan`:`Simpan biaya`,{submitIcon:`save`,cancelHref:`#/finance/ads/expenses`})}
      </form>
    `;let d=t.querySelector(`#ad-expense-form`);if(!d)throw Error(`Formulir biaya iklan tidak ditemukan.`);let f=d.querySelector(`button[type="submit"]`);d.addEventListener(`submit`,async t=>{if(t.preventDefault(),f){so(d,null),Z(f,!0,`Menyimpan…`);try{let t={campaignId:Q(d,`campaignId`),expenseDate:Q(d,`expenseDate`),amount:lo(d,`amount`,`Biaya iklan`,{required:!0}),impressions:po(d,`impressions`,`Impression`),clicks:po(d,`clicks`,`Click`),attributedOrders:po(d,`attributedOrders`,`Pesanan teratribusi`),attributedRevenue:uo(d,`attributedRevenue`,`Omzet teratribusi`),notes:co(d,`notes`)};i&&r?await n.advertisingService.updateExpense(r,t):await n.advertisingService.createExpense(t),V(i?`Biaya iklan diperbarui.`:`Biaya iklan dicatat.`,`success`),e.navigate(`/finance/ads/expenses`)}catch(e){so(d,e),Z(f,!1),e instanceof N||V(`Biaya iklan gagal disimpan.`,`error`)}}}),z(t)}catch(n){$(t,e,n)}};function Vs(e){let t=new URLSearchParams({expenseDate:w()});return e&&t.set(`storeId`,e),`/finance/expenses/new?${t.toString()}`}var Hs=async e=>{let{root:t,services:n}=e;t.innerHTML=J(`Memuat biaya operasional…`);try{let r=So(e.query),i=e.query.get(`category`)??`all`,a=an.includes(i)?i:`all`,o=e.query.get(`search`)?.trim()??``,s=No(e.query.get(`page`)),[c,l]=await Promise.all([n.storeService.listAll(),n.expenseService.list({storeId:r.storeId,category:a,search:o,from:r.period.from,to:r.period.to,page:s,pageSize:25})]);if(e.signal.aborted)return;e.setTitle(`Biaya operasional`);let u=l.items.reduce((e,t)=>e+t.amount,0),d=l.items.filter(e=>e.storeId===null).reduce((e,t)=>e+t.amount,0),f=r.storeId!==null||r.period.preset!==`thisMonth`||a!==`all`||o!==``,p=l.items.map(e=>[`<span class="table-strong">${D(e.expenseDate)}</span>`,e.storeId?`<a class="table-link" href="#/stores/${e.storeId}">${L(e.storeName??`Toko`)}</a>`:`<span class="badge badge-primary">Biaya bersama</span>`,Ga[e.category],`<span class="table-strong">${L(e.description)}</span>${e.receiptNote?`<span class="table-sub">${L(e.receiptNote)}</span>`:``}`,F(e.amount),`<div class="table-actions">
        <a class="btn btn-ghost btn-sm" href="#/finance/expenses/${e.id}/edit">Ubah</a>
        <button type="button" class="btn btn-ghost btn-icon" data-delete-expense="${R(e.id)}" aria-label="Hapus biaya" title="Hapus biaya">${B(`trash`)}</button>
      </div>`]);t.innerHTML=`
      ${H({eyebrow:`Keuangan`,title:`Biaya operasional`,subtitle:`${I(l.total)} catatan pada filter aktif. Biaya tanpa toko dihitung sebagai biaya bersama.`,actions:K(Vs(r.storeId),`Catat biaya`,`btn btn-primary`,`plus`)})}

      ${To(r,c)}

      <div class="filter-bar filter-bar-extra">
        <div class="filter-control">
          <label class="filter-label" for="expense-category">Kategori</label>
          <select class="input select" id="expense-category" data-expense-category>
            <option value="all" ${a===`all`?`selected`:``}>Semua kategori</option>
            ${an.map(e=>`<option value="${e}" ${e===a?`selected`:``}>${Ga[e]}</option>`).join(``)}
          </select>
        </div>
        <form class="filter-search" data-expense-search role="search">
          <label class="filter-label" for="expense-search">Cari</label>
          <div class="search-input-wrap">
            ${B(`search`,`search-icon`)}
            <input class="input" id="expense-search" name="search" type="search" value="${R(o)}" placeholder="Deskripsi atau catatan…" autocomplete="off" />
            <button type="submit" class="btn btn-secondary btn-sm">Cari</button>
          </div>
        </form>
        ${f?`<a class="filter-reset" href="#/finance/expenses">${B(`x`)} Reset</a>`:``}
      </div>

      <div class="kpi-grid kpi-grid-3">
        <div class="import-stat"><strong>${F(u)}</strong><span>Total pada halaman ini</span></div>
        <div class="import-stat import-stat-warning"><strong>${F(d)}</strong><span>Biaya bersama pada halaman ini</span></div>
        <div class="import-stat"><strong>${I(l.items.length)}</strong><span>Baris ditampilkan</span></div>
      </div>

      ${l.items.length>0?U({padded:!1,body:Y([`Tanggal`,`Toko`,`Kategori`,`Deskripsi`,`Nominal`,``],p)}):U({body:q({iconName:f?`search`:`receipt`,title:f?`Biaya tidak ditemukan`:`Belum ada biaya operasional`,description:f?`Tidak ada biaya yang sesuai dengan filter. Ubah periode, toko, kategori, atau kata kunci.`:`Catat gaji, listrik, internet, sewa, perawatan mesin, bahan pendukung, dan biaya lain. Biaya bersama dicatat tanpa toko.`,action:f?`<a class="btn btn-secondary" href="#/finance/expenses">${B(`refresh-cw`)}<span>Reset filter</span></a>`:K(Vs(r.storeId),`Catat biaya pertama`,`btn btn-primary`,`plus`)})})}
      ${$a({page:l.page,pageSize:l.pageSize,total:l.total})}
    `,Do(t,e),t.querySelector(`[data-expense-category]`)?.addEventListener(`change`,t=>{let n=t.currentTarget;Mo(e,{category:n.value===`all`?null:n.value,page:null})});let m=t.querySelector(`[data-expense-search]`);m?.addEventListener(`submit`,t=>{t.preventDefault(),Mo(e,{search:m.querySelector(`input[name="search"]`)?.value.trim()||null,page:null})}),eo(t,t=>{e.navigate(Eo(e.path,e.query,{page:t}))}),t.querySelectorAll(`[data-delete-expense]`).forEach(t=>{t.addEventListener(`click`,async()=>{let r=t.dataset.deleteExpense??``,i=l.items.find(e=>e.id===r);if(i&&await yo({title:`Hapus biaya operasional?`,message:`Biaya "${i.description}" sebesar ${F(i.amount)} akan dihapus permanen.`,confirmLabel:`Hapus biaya`,tone:`danger`}))try{await n.expenseService.delete(r),V(`Biaya operasional dihapus.`,`success`),e.refresh()}catch(e){V(e instanceof Error?e.message:`Biaya gagal dihapus.`,`error`)}})}),z(t)}catch(n){$(t,e,n)}},Us=async e=>{let{root:t,services:n}=e,r=e.params.id??null,i=r!==null;t.innerHTML=J(i?`Memuat biaya…`:`Menyiapkan formulir…`);try{let[a,o]=await Promise.all([n.storeService.listAll(),r?n.expenseService.get(r):Promise.resolve(null)]);if(e.signal.aborted)return;e.setTitle(i?`Ubah biaya operasional`:`Biaya operasional baru`);let s=a.filter(e=>e.status===`active`),c=e.query.get(`storeId`),l=o?.storeId??(c&&s.some(e=>e.id===c)?c:``);t.innerHTML=`
      ${H({eyebrow:`Keuangan`,title:i?`Ubah biaya operasional`:`Catat biaya operasional`,subtitle:`Biaya tanpa toko dihitung sebagai biaya bersama dan hanya muncul pada total semua toko.`,actions:`<a class="btn btn-secondary" href="#/finance/expenses">${B(`arrow-left`)}<span>Kembali</span></a>`})}

      <form class="form-card" id="expense-form" novalidate>
        ${no()}
        <div class="form-section">
          <div class="form-section-head">
            <h2>Detail biaya</h2>
            <p>Nominal harus lebih dari 0. Deskripsi wajib diisi agar laporan mudah ditelusuri.</p>
          </div>
          <div class="form-grid">
            ${X({name:`storeId`,label:`Toko terkait`,type:`select`,value:l,options:Co(s,l,{allLabel:`Biaya bersama (tanpa toko)`}),help:`Pilih biaya bersama untuk biaya yang tidak dapat dialokasikan ke satu toko.`,idPrefix:`expense`})}
            ${X({name:`expenseDate`,label:`Tanggal biaya`,type:`date`,value:o?.expenseDate??e.query.get(`expenseDate`)??w(),required:!0,idPrefix:`expense`})}
            ${X({name:`category`,label:`Kategori`,type:`select`,value:o?.category??`salary`,required:!0,options:an.map(e=>({value:e,label:Ga[e]})),idPrefix:`expense`})}
            ${X({name:`amount`,label:`Nominal`,type:`money`,value:o?String(o.amount):``,required:!0,placeholder:`0`,idPrefix:`expense`})}
            ${X({name:`description`,label:`Deskripsi`,value:o?.description??``,required:!0,placeholder:`Contoh: Gaji produksi bulan ini`,idPrefix:`expense`,span:!0})}
            ${X({name:`receiptNote`,label:`Bukti / catatan`,type:`textarea`,value:o?.receiptNote??``,rows:3,placeholder:`Nomor nota, keterangan bukti, atau catatan tambahan…`,idPrefix:`expense`,span:!0})}
          </div>
        </div>

        ${ro(i?`Simpan perubahan`:`Simpan biaya`,{submitIcon:`save`,cancelHref:`#/finance/expenses`})}
      </form>
    `;let u=t.querySelector(`#expense-form`);if(!u)throw Error(`Formulir biaya operasional tidak ditemukan.`);let d=u.querySelector(`button[type="submit"]`);u.addEventListener(`submit`,async t=>{if(t.preventDefault(),d){so(u,null),Z(d,!0,`Menyimpan…`);try{let t={storeId:Q(u,`storeId`)||null,expenseDate:Q(u,`expenseDate`),category:Q(u,`category`),amount:lo(u,`amount`,`Nominal`,{required:!0}),description:Q(u,`description`),receiptNote:co(u,`receiptNote`)};if(t.amount<=0)throw new N(`Nominal biaya harus lebih dari 0.`,{amount:`Nominal biaya harus lebih dari 0.`});i&&r?await n.expenseService.update(r,t):await n.expenseService.create(t),V(i?`Biaya operasional diperbarui.`:`Biaya operasional dicatat.`,`success`),e.navigate(`/finance/expenses`)}catch(e){so(u,e),Z(d,!1),e instanceof N||V(`Biaya operasional gagal disimpan.`,`error`)}}}),z(t)}catch(n){$(t,e,n)}};function Ws(e){return e}async function Gs(e,t,n){if(!t)return{orders:[],linked:null};let r=(await e.orderService.list({storeId:t,pageSize:100})).items.map(e=>({id:e.id,marketplaceOrderId:e.marketplaceOrderId,orderDate:e.orderDate,status:e.status,storeId:e.storeId})),i=r.find(e=>e.id===n)??null;if(n&&!i)try{let t=await e.orderService.getDetail(n);i=Ws({id:t.id,marketplaceOrderId:t.marketplaceOrderId,orderDate:t.orderDate,status:t.status,storeId:t.storeId})}catch{i=null}return{orders:r,linked:i}}function Ks(e,t,n){let r=new Map;t&&r.set(t.id,t);for(let t of e)r.set(t.id,t);return`
    <option value="">— Pilih pesanan —</option>
    ${[...r.values()].map(e=>`<option value="${R(e.id)}" ${e.id===n?`selected`:``}>${L(e.marketplaceOrderId)} · ${D(e.orderDate)}</option>`).join(``)}
  `}function qs(e,t=null){let n=new URLSearchParams({refundDate:w()});return e&&n.set(`storeId`,e),t&&n.set(`orderId`,t),`/finance/refunds/new?${n.toString()}`}var Js=async e=>{let{root:t,services:n}=e;t.innerHTML=J(`Memuat refund…`);try{let r=So(e.query),i=e.query.get(`status`)??`all`,a=on.includes(i)?i:`all`,o=e.query.get(`search`)?.trim()??``,s=No(e.query.get(`page`)),[c,l]=await Promise.all([n.storeService.listAll(),n.refundService.list({storeId:r.storeId,status:a,search:o,from:r.period.from,to:r.period.to,page:s,pageSize:25})]);if(e.signal.aborted)return;e.setTitle(`Refund`);let u=l.items.filter(e=>e.status===`completed`).reduce((e,t)=>e+t.amount,0),d=r.storeId!==null||r.period.preset!==`thisMonth`||a!==`all`||o!==``,f=l.items.map(e=>[`<span class="table-strong">${D(e.refundDate)}</span>`,`<a class="table-link" href="#/orders/${e.orderId}">${L(e.marketplaceOrderId)}</a><span class="table-sub">${L(e.storeName)}</span>`,`<span class="table-strong">${F(e.amount)}</span>`,`${I(e.quantity)} barang`,`<span class="table-note">${L(e.reason)}</span>`,G(Ka[e.status],qa[e.status]),`<div class="table-actions">
        <a class="btn btn-ghost btn-sm" href="#/finance/refunds/${e.id}/edit">Ubah</a>
        <button type="button" class="btn btn-ghost btn-icon" data-delete-refund="${R(e.id)}" aria-label="Hapus refund" title="Hapus refund">${B(`trash`)}</button>
      </div>`]);t.innerHTML=`
      ${H({eyebrow:`Keuangan`,title:`Refund & retur`,subtitle:`${I(l.total)} refund pada filter aktif. Hanya refund selesai pada pesanan penjualan yang mengurangi pendapatan, dan hanya sekali.`,actions:K(qs(r.storeId),`Catat refund`,`btn btn-primary`,`plus`)})}

      ${To(r,c)}

      <div class="filter-bar filter-bar-extra">
        <div class="filter-control">
          <label class="filter-label" for="refund-status">Status</label>
          <select class="input select" id="refund-status" data-refund-status>
            <option value="all" ${a===`all`?`selected`:``}>Semua status</option>
            ${on.map(e=>`<option value="${e}" ${e===a?`selected`:``}>${Ka[e]}</option>`).join(``)}
          </select>
        </div>
        <form class="filter-search" data-refund-search role="search">
          <label class="filter-label" for="refund-search">Cari</label>
          <div class="search-input-wrap">
            ${B(`search`,`search-icon`)}
            <input class="input" id="refund-search" name="search" type="search" value="${R(o)}" placeholder="Nomor pesanan, toko, atau alasan…" autocomplete="off" />
            <button type="submit" class="btn btn-secondary btn-sm">Cari</button>
          </div>
        </form>
        ${d?`<a class="filter-reset" href="#/finance/refunds">${B(`x`)} Reset</a>`:``}
      </div>

      <div class="kpi-grid kpi-grid-3">
        <div class="import-stat import-stat-danger"><strong>${F(u)}</strong><span>Refund selesai pada halaman ini</span></div>
        <div class="import-stat"><strong>${I(l.items.length)}</strong><span>Baris ditampilkan</span></div>
        <div class="import-stat"><strong>${I(l.items.filter(e=>e.status===`pending`).length)}</strong><span>Refund menunggu</span></div>
      </div>

      ${l.items.length>0?U({padded:!1,body:Y([`Tanggal`,`Pesanan / toko`,`Nilai`,`Jumlah`,`Alasan`,`Status`,``],f)}):U({body:q({iconName:d?`search`:`refresh-cw`,title:d?`Refund tidak ditemukan`:`Belum ada refund`,description:d?`Tidak ada refund yang sesuai dengan filter. Ubah periode, toko, status, atau kata kunci.`:`Catat pengembalian dana dari pesanan. Refund selesai akan mengurangi penjualan bersih sekali saja.`,action:d?`<a class="btn btn-secondary" href="#/finance/refunds">${B(`refresh-cw`)}<span>Reset filter</span></a>`:K(qs(r.storeId),`Catat refund pertama`,`btn btn-primary`,`plus`)})})}
      ${$a({page:l.page,pageSize:l.pageSize,total:l.total})}
    `,Do(t,e),t.querySelector(`[data-refund-status]`)?.addEventListener(`change`,t=>{let n=t.currentTarget;Mo(e,{status:n.value===`all`?null:n.value,page:null})});let p=t.querySelector(`[data-refund-search]`);p?.addEventListener(`submit`,t=>{t.preventDefault(),Mo(e,{search:p.querySelector(`input[name="search"]`)?.value.trim()||null,page:null})}),eo(t,t=>{e.navigate(Eo(e.path,e.query,{page:t}))}),t.querySelectorAll(`[data-delete-refund]`).forEach(t=>{t.addEventListener(`click`,async()=>{let r=t.dataset.deleteRefund??``,i=l.items.find(e=>e.id===r);if(i&&await yo({title:`Hapus refund?`,message:`Refund ${F(i.amount)} untuk pesanan ${i.marketplaceOrderId} akan dihapus permanen.`,confirmLabel:`Hapus refund`,tone:`danger`}))try{await n.refundService.delete(r),V(`Refund dihapus.`,`success`),e.refresh()}catch(e){V(e instanceof Error?e.message:`Refund gagal dihapus.`,`error`)}})}),z(t)}catch(n){$(t,e,n)}},Ys=async e=>{let{root:t,services:n}=e,r=e.params.id??null,i=r!==null;t.innerHTML=J(i?`Memuat refund…`:`Menyiapkan formulir…`);try{let[a,o]=await Promise.all([n.storeService.listAll(),r?n.refundService.get(r):Promise.resolve(null)]);if(e.signal.aborted)return;e.setTitle(i?`Ubah refund`:`Refund baru`);let s=a.filter(e=>e.status===`active`);if(s.length===0){t.innerHTML=`
        ${H({eyebrow:`Keuangan`,title:i?`Ubah refund`:`Catat refund`,actions:`<a class="btn btn-secondary" href="#/finance/refunds">${B(`arrow-left`)}<span>Kembali</span></a>`})}
        ${U({body:q({iconName:`store`,title:`Belum ada toko aktif`,description:`Refund harus terhubung ke pesanan pada toko. Tambahkan toko dan pesanan terlebih dahulu.`,action:K(`/stores/new`,`Tambah toko`,`btn btn-primary`,`plus`)})})}
      `,z(t);return}let c=e.query.get(`storeId`),l=e.query.get(`orderId`),u=o?.storeId??(c&&s.some(e=>e.id===c)?c:s[0]?.id??``),d=o?.orderId??l??``,{orders:f,linked:p}=await Gs(n,u,d||null),m=await n.settlementService.listForSelect(u),h=o?.settlementId??``;h&&!m.some(e=>e.id===h)&&m.unshift({id:h,storeId:u,settlementNo:h,settlementDate:o?.refundDate??w(),grossSales:0,totalDeductions:0,totalPayout:0,status:`pending`,notes:null,createdAt:``,updatedAt:``});let g=d?await n.orderService.getDetail(d).catch(()=>null):null,_=r,v=Xs(g,_);t.innerHTML=`
      ${H({eyebrow:`Keuangan`,title:i?`Ubah refund`:`Catat refund`,subtitle:`Refund hanya mengurangi penjualan sekali. Settlement tidak menambah penjualan dan tidak menghitung refund dua kali.`,actions:`<a class="btn btn-secondary" href="#/finance/refunds">${B(`arrow-left`)}<span>Kembali</span></a>`})}

      <form class="form-card" id="refund-form" novalidate>
        ${no()}
        <div class="form-section">
          <div class="form-section-head">
            <h2>Detail refund</h2>
            <p>Pilih pesanan asal. Batas jumlah dan nilai refund dihitung dari item pesanan dan refund lain.</p>
          </div>
          <div class="form-grid">
            ${X({name:`storeId`,label:`Toko`,type:`select`,value:u,required:!0,options:Co(s,u),idPrefix:`refund`})}
            <div class="field span-2" data-field="orderId">
              <label class="field-label" for="refund-orderId">Pesanan <span class="required-mark" aria-hidden="true">*</span></label>
              <select class="input select" id="refund-orderId" name="orderId" required>
                ${Ks(f,p,d)}
              </select>
              <p class="field-help" data-order-hint>${L(v)}</p>
              <p class="field-error" data-error-for="orderId"></p>
            </div>
            ${X({name:`settlementId`,label:`Settlement terkait`,type:`select`,value:h,options:[{value:``,label:`Tidak terkait settlement`},...m.map(e=>({value:e.id,label:`${e.settlementNo} · ${D(e.settlementDate)}`}))],help:`Opsional. Settlement harus berasal dari toko yang sama.`,idPrefix:`refund`})}
            ${X({name:`refundDate`,label:`Tanggal refund`,type:`date`,value:o?.refundDate??e.query.get(`refundDate`)??w(),required:!0,idPrefix:`refund`})}
            ${X({name:`amount`,label:`Nilai refund`,type:`money`,value:o?String(o.amount):``,required:!0,placeholder:`0`,idPrefix:`refund`})}
            ${X({name:`quantity`,label:`Jumlah barang`,type:`integer`,value:o?String(o.quantity):`1`,required:!0,min:1,idPrefix:`refund`})}
            ${X({name:`status`,label:`Status refund`,type:`select`,value:o?.status??`completed`,required:!0,options:on.map(e=>({value:e,label:Ka[e]})),help:`Hanya refund selesai yang mengurangi penjualan bersih.`,idPrefix:`refund`})}
            ${X({name:`reason`,label:`Alasan refund`,value:o?.reason??``,required:!0,placeholder:`Contoh: Barang rusak saat pengiriman`,idPrefix:`refund`,span:!0})}
            ${X({name:`notes`,label:`Catatan`,type:`textarea`,value:o?.notes??``,rows:3,placeholder:`Catatan tambahan…`,idPrefix:`refund`,span:!0})}
          </div>
          <div class="form-info">
            ${B(`info`)}
            <p>Pesanan yang berstatus batal, retur, atau refund tidak lagi dihitung sebagai penjualan. Refund pada pesanan tersebut tetap tersimpan sebagai riwayat, tetapi tidak mengurangi pendapatan dua kali.</p>
          </div>
        </div>

        ${ro(i?`Simpan perubahan`:`Simpan refund`,{submitIcon:`save`,cancelHref:`#/finance/refunds`})}
      </form>
    `;let y=t.querySelector(`#refund-form`);if(!y)throw Error(`Formulir refund tidak ditemukan.`);let b=y.querySelector(`button[type="submit"]`),ee=y.querySelector(`select[name="storeId"]`),x=y.querySelector(`select[name="orderId"]`),te=y.querySelector(`select[name="settlementId"]`),ne=y.querySelector(`[data-order-hint]`),re=async()=>{if(x&&ne){if(!x.value)ne.textContent=`Pilih pesanan untuk melihat batas refund.`;else{ne.textContent=`Menghitung batas refund…`;try{let e=await n.orderService.getDetail(x.value);ne.textContent=Xs(e,_)}catch(e){ne.textContent=e instanceof Error?e.message:`Pesanan gagal dimuat.`}}}},ie=async e=>{if(x){x.disabled=!0;try{let t=x.value,r=await Gs(n,e,t||null),i=r.linked?.id??(r.orders.some(e=>e.id===t)?t:``);if(x.innerHTML=Ks(r.orders,r.linked,i),await re(),te){let t=await n.settlementService.listForSelect(e);te.innerHTML=`
            <option value="">Tidak terkait settlement</option>
            ${t.map(e=>`<option value="${R(e.id)}">${L(e.settlementNo)} · ${D(e.settlementDate)}</option>`).join(``)}
          `}}catch(e){V(e instanceof Error?e.message:`Data pesanan gagal dimuat.`,`error`)}finally{x.disabled=!1}}};ee?.addEventListener(`change`,()=>{ie(ee.value)}),x?.addEventListener(`change`,()=>{re()}),y.addEventListener(`submit`,async t=>{if(t.preventDefault(),b){so(y,null),Z(b,!0,`Menyimpan…`);try{let t={orderId:Q(y,`orderId`),settlementId:Q(y,`settlementId`)||null,refundDate:Q(y,`refundDate`),amount:lo(y,`amount`,`Nilai refund`,{required:!0}),quantity:fo(y,`quantity`,`Jumlah barang`,{required:!0,min:1}),reason:Q(y,`reason`),status:Q(y,`status`),notes:co(y,`notes`)};i&&r?await n.refundService.update(r,t):await n.refundService.create(t),V(i?`Refund diperbarui.`:`Refund dicatat.`,`success`),e.navigate(`/finance/refunds`)}catch(e){so(y,e),Z(b,!1),e instanceof N||V(`Refund gagal disimpan.`,`error`)}}}),z(t)}catch(n){$(t,e,n)}};function Xs(e,t){if(!e)return`Pilih pesanan untuk melihat batas refund.`;let n=e.items.reduce((e,t)=>e+t.quantity,0),r=e.items.reduce((e,t)=>e+t.quantity*t.unitPrice,0),i=e.refunds.filter(e=>e.id!==t&&e.status!==`rejected`).reduce((e,t)=>e+t.quantity,0),a=e.refunds.filter(e=>e.id!==t&&e.status!==`rejected`).reduce((e,t)=>e+t.amount,0);return`Pesanan ${e.marketplaceOrderId}: maksimal ${I(Math.max(0,n-i))} barang dan ${F(Math.max(0,r-a))}.`}function Zs(e){let t=new URLSearchParams({settlementDate:w()});return e&&t.set(`storeId`,e),`/finance/settlements/new?${t.toString()}`}var Qs=async e=>{let{root:t,services:n}=e;t.innerHTML=J(`Memuat settlement…`);try{let r=So(e.query),i=e.query.get(`status`)??`all`,a=sn.includes(i)?i:`all`,o=e.query.get(`search`)?.trim()??``,s=No(e.query.get(`page`)),[c,l]=await Promise.all([n.storeService.listAll(),n.settlementService.list({storeId:r.storeId,status:a,search:o,from:r.period.from,to:r.period.to,page:s,pageSize:25})]);if(e.signal.aborted)return;e.setTitle(`Settlement`);let u=l.items.reduce((e,t)=>e+t.totalPayout,0),d=l.items.filter(e=>e.status===`received`).reduce((e,t)=>e+t.totalPayout,0),f=l.items.filter(e=>e.status===`pending`).reduce((e,t)=>e+t.totalPayout,0),p=r.storeId!==null||r.period.preset!==`thisMonth`||a!==`all`||o!==``,m=l.items.map(e=>[`<span class="table-strong">${L(e.settlementNo)}</span><span class="table-sub">${L(e.storeName)}</span>`,D(e.settlementDate),F(e.grossSales),`<span class="value-negative">${F(-e.totalDeductions)}</span>`,`<span class="table-strong">${F(e.totalPayout)}</span>`,G(Ja[e.status],Ya[e.status]),e.notes?`<span class="table-note">${L(e.notes)}</span>`:`<span class="muted">—</span>`,`<div class="table-actions">
        <a class="btn btn-ghost btn-sm" href="#/finance/settlements/${e.id}/edit">Ubah</a>
        <button type="button" class="btn btn-ghost btn-icon" data-delete-settlement="${R(e.id)}" aria-label="Hapus settlement" title="Hapus settlement">${B(`trash`)}</button>
      </div>`]);t.innerHTML=`
      ${H({eyebrow:`Keuangan`,title:`Settlement & pencairan`,subtitle:`${I(l.total)} settlement pada filter aktif. Pencairan adalah arus kas, bukan omzet baru.`,actions:K(Zs(r.storeId),`Catat settlement`,`btn btn-primary`,`plus`)})}

      ${To(r,c)}

      <div class="filter-bar filter-bar-extra">
        <div class="filter-control">
          <label class="filter-label" for="settlement-status">Status</label>
          <select class="input select" id="settlement-status" data-settlement-status>
            <option value="all" ${a===`all`?`selected`:``}>Semua status</option>
            ${sn.map(e=>`<option value="${e}" ${e===a?`selected`:``}>${Ja[e]}</option>`).join(``)}
          </select>
        </div>
        <form class="filter-search" data-settlement-search role="search">
          <label class="filter-label" for="settlement-search">Cari</label>
          <div class="search-input-wrap">
            ${B(`search`,`search-icon`)}
            <input class="input" id="settlement-search" name="search" type="search" value="${R(o)}" placeholder="Nomor settlement, toko, atau catatan…" autocomplete="off" />
            <button type="submit" class="btn btn-secondary btn-sm">Cari</button>
          </div>
        </form>
        ${p?`<a class="filter-reset" href="#/finance/settlements">${B(`x`)} Reset</a>`:``}
      </div>

      <div class="kpi-grid kpi-grid-3">
        <div class="import-stat"><strong>${F(d)}</strong><span>Diterima pada halaman ini</span></div>
        <div class="import-stat import-stat-warning"><strong>${F(f)}</strong><span>Menunggu pada halaman ini</span></div>
        <div class="import-stat"><strong>${F(u)}</strong><span>Total pencairan halaman ini</span></div>
      </div>

      <p class="inline-note">${B(`info`)} Settlement tidak ditambahkan ke omzet atau laba. Nilainya mencatat uang yang benar-benar dicairkan marketplace.</p>

      ${l.items.length>0?U({padded:!1,body:Y([`Nomor / toko`,`Tanggal`,`Penjualan`,`Potongan`,`Pencairan`,`Status`,`Catatan`,``],m)}):U({body:q({iconName:p?`search`:`wallet`,title:p?`Settlement tidak ditemukan`:`Belum ada settlement`,description:p?`Tidak ada settlement yang sesuai dengan filter. Ubah periode, toko, status, atau kata kunci.`:`Catat pencairan dana dari marketplace agar omzet, laba, dan uang masuk dapat dibedakan.`,action:p?`<a class="btn btn-secondary" href="#/finance/settlements">${B(`refresh-cw`)}<span>Reset filter</span></a>`:K(Zs(r.storeId),`Catat settlement pertama`,`btn btn-primary`,`plus`)})})}
      ${$a({page:l.page,pageSize:l.pageSize,total:l.total})}
    `,Do(t,e),t.querySelector(`[data-settlement-status]`)?.addEventListener(`change`,t=>{let n=t.currentTarget;Mo(e,{status:n.value===`all`?null:n.value,page:null})});let h=t.querySelector(`[data-settlement-search]`);h?.addEventListener(`submit`,t=>{t.preventDefault(),Mo(e,{search:h.querySelector(`input[name="search"]`)?.value.trim()||null,page:null})}),eo(t,t=>{e.navigate(Eo(e.path,e.query,{page:t}))}),t.querySelectorAll(`[data-delete-settlement]`).forEach(t=>{t.addEventListener(`click`,async()=>{let r=t.dataset.deleteSettlement??``,i=l.items.find(e=>e.id===r);if(i&&await yo({title:`Hapus settlement?`,message:`Settlement ${i.settlementNo} sebesar ${F(i.totalPayout)} akan dihapus permanen. Refund yang tertaut dapat kehilangan relasi settlement.`,confirmLabel:`Hapus settlement`,tone:`danger`,details:[`Toko: ${i.storeName}`,`Tanggal: ${D(i.settlementDate)}`,`Penghapusan tidak mengubah omzet pesanan.`]}))try{await n.settlementService.delete(r),V(`Settlement dihapus.`,`success`),e.refresh()}catch(e){V(e instanceof Error?e.message:`Settlement gagal dihapus.`,`error`)}})}),z(t)}catch(n){$(t,e,n)}},$s=async e=>{let{root:t,services:n}=e,r=e.params.id??null,i=r!==null;t.innerHTML=J(i?`Memuat settlement…`:`Menyiapkan formulir…`);try{let[a,o]=await Promise.all([n.storeService.listAll(),r?n.settlementService.get(r):Promise.resolve(null)]);if(e.signal.aborted)return;e.setTitle(i?`Ubah settlement`:`Settlement baru`);let s=a.filter(e=>e.status===`active`);if(s.length===0){t.innerHTML=`
        ${H({eyebrow:`Keuangan`,title:i?`Ubah settlement`:`Catat settlement`,actions:`<a class="btn btn-secondary" href="#/finance/settlements">${B(`arrow-left`)}<span>Kembali</span></a>`})}
        ${U({body:q({iconName:`store`,title:`Belum ada toko aktif`,description:`Settlement harus terhubung ke toko. Tambahkan toko atau aktifkan kembali toko yang diarsipkan.`,action:K(`/stores/new`,`Tambah toko`,`btn btn-primary`,`plus`)})})}
      `,z(t);return}let c=e.query.get(`storeId`),l=o?.storeId??(c&&s.some(e=>e.id===c)?c:s[0]?.id??``);t.innerHTML=`
      ${H({eyebrow:`Keuangan`,title:i?`Ubah settlement`:`Catat settlement`,subtitle:`Nomor settlement unik per toko. Total pencairan tidak menambah omzet atau laba.`,actions:`<a class="btn btn-secondary" href="#/finance/settlements">${B(`arrow-left`)}<span>Kembali</span></a>`})}

      <form class="form-card" id="settlement-form" novalidate>
        ${no()}
        <div class="form-section">
          <div class="form-section-head">
            <h2>Detail settlement</h2>
            <p>Isi nilai sesuai laporan pencairan marketplace. Total potongan dan pencairan adalah informasi arus kas.</p>
          </div>
          <div class="form-grid">
            ${X({name:`storeId`,label:`Toko`,type:`select`,value:l,required:!0,options:Co(s,l),idPrefix:`settlement`})}
            ${X({name:`settlementNo`,label:`Nomor settlement`,value:o?.settlementNo??``,required:!0,placeholder:`Contoh: SPL-2026-001`,idPrefix:`settlement`})}
            ${X({name:`settlementDate`,label:`Tanggal settlement`,type:`date`,value:o?.settlementDate??e.query.get(`settlementDate`)??w(),required:!0,idPrefix:`settlement`})}
            ${X({name:`status`,label:`Status pencairan`,type:`select`,value:o?.status??`received`,required:!0,options:sn.map(e=>({value:e,label:Ja[e]})),help:`Hanya status diterima yang dihitung sebagai dana masuk pada ringkasan.`,idPrefix:`settlement`})}
            ${X({name:`grossSales`,label:`Total penjualan`,type:`money`,value:o?String(o.grossSales):``,required:!0,placeholder:`0`,idPrefix:`settlement`})}
            ${X({name:`totalDeductions`,label:`Total potongan`,type:`money`,value:o?String(o.totalDeductions):``,required:!0,placeholder:`0`,idPrefix:`settlement`})}
            ${X({name:`totalPayout`,label:`Total pencairan`,type:`money`,value:o?String(o.totalPayout):``,required:!0,placeholder:`0`,help:`Nominal bersih yang benar-benar dicairkan.`,idPrefix:`settlement`})}
            ${X({name:`notes`,label:`Catatan`,type:`textarea`,value:o?.notes??``,rows:3,placeholder:`Catatan pencairan, nomor referensi bank, atau periode…`,idPrefix:`settlement`,span:!0})}
          </div>
          <div class="form-info">
            ${B(`info`)}
            <p>Jangan menambahkan settlement sebagai pendapatan baru. Omzet dan laba sudah dihitung dari pesanan. Settlement hanya menunjukkan uang yang dicairkan.</p>
          </div>
        </div>

        ${ro(i?`Simpan perubahan`:`Simpan settlement`,{submitIcon:`save`,cancelHref:`#/finance/settlements`})}
      </form>
    `;let u=t.querySelector(`#settlement-form`);if(!u)throw Error(`Formulir settlement tidak ditemukan.`);let d=u.querySelector(`button[type="submit"]`);u.addEventListener(`submit`,async t=>{if(t.preventDefault(),d){so(u,null),Z(d,!0,`Menyimpan…`);try{let t={storeId:Q(u,`storeId`),settlementNo:Q(u,`settlementNo`),settlementDate:Q(u,`settlementDate`),grossSales:lo(u,`grossSales`,`Total penjualan`,{required:!0}),totalDeductions:lo(u,`totalDeductions`,`Total potongan`,{required:!0}),totalPayout:lo(u,`totalPayout`,`Total pencairan`,{required:!0}),status:Q(u,`status`),notes:co(u,`notes`)};i&&r?await n.settlementService.update(r,t):await n.settlementService.create(t),V(i?`Settlement diperbarui.`:`Settlement dicatat.`,`success`),e.navigate(`/finance/settlements`)}catch(e){so(u,e),Z(d,!1),e instanceof N||V(`Settlement gagal disimpan.`,`error`)}}}),z(t)}catch(n){$(t,e,n)}},ec=[`Tanggal`,`Pesanan`,`Omzet (Rp)`,`Diskon penjual (Rp)`,`Refund (Rp)`,`Penjualan bersih (Rp)`,`HPP (Rp)`,`Laba kotor (Rp)`,`Biaya marketplace (Rp)`,`Biaya iklan (Rp)`,`Biaya operasional (Rp)`,`Laba operasional (Rp)`,`Margin (%)`];function tc(e){return[e.date,e.orderCount,e.grossSales,e.sellerDiscount,e.refunds,e.netSales,e.cogs,e.grossProfit,e.marketplaceFees,e.advertisingSpend,e.operationalExpenses,e.operatingProfit,e.marginPercent===null?``:Number(e.marginPercent.toFixed(2))]}function nc(e){let t=e.summary;return[[`Periode`,`${e.range.from} s/d ${e.range.to}`],[`Toko`,e.storeId?e.stores[0]?.name??`-`:`Semua toko`],[`Jumlah pesanan`,t.orderCount],[`Unit terjual`,t.unitsSold],[`Omzet`,t.grossSales],[`Diskon penjual`,t.sellerDiscount],[`Diskon marketplace (informasi)`,t.marketplaceDiscount],[`Refund`,t.refunds],[`Penjualan bersih`,t.netSales],[`HPP`,t.cogs],[`Laba kotor`,t.grossProfit],[`Biaya marketplace aktual`,t.marketplaceFeesActual],[`Biaya marketplace estimasi`,t.marketplaceFeesEstimated],[`Biaya iklan`,t.advertisingSpend],[`Biaya operasional`,t.operationalExpenses],[`Laba operasional`,t.operatingProfit],[`Margin operasional`,t.marginPercent===null?`-`:Dn(t.marginPercent)]]}function rc(e){return`manka-laporan-${(e.storeId?e.stores[0]?.name:`semua-toko`)??`semua-toko`}-${e.range.from}-${e.range.to}`}function ic(e){let t=[];t.push([`Ringkasan`,`Nilai`]);for(let[n,r]of nc(e))t.push([n,String(r)]);t.push([]),t.push([`Harian`]),t.push(ec);for(let n of e.daily)t.push(tc(n).map(e=>String(e)));if(!e.storeId){t.push([]),t.push([`Per Toko`]),t.push([`Toko`,`Platform`,`Pesanan`,`Omzet (Rp)`,`Penjualan bersih (Rp)`,`Laba operasional (Rp)`]);for(let n of e.storePerformance)t.push([n.storeName,n.platform,String(n.summary.orderCount),String(n.summary.grossSales),String(n.summary.netSales),String(n.summary.operatingProfit)])}return{fileName:`${rc(e)}.csv`,data:os(t[0]??[],t.slice(1))}}async function ac(e){let t=new(await(de(async()=>{let{default:e}=await import(`./exceljs.min-CX77fFuh.js`).then(e=>c(e.default,1));return{default:e}},[]))).default.Workbook;t.creator=`Manka`,t.created=new Date;let n=t.addWorksheet(`Ringkasan`);n.columns=[{header:`Metrik`,key:`label`,width:34},{header:`Nilai`,key:`value`,width:24}],n.getRow(1).font={bold:!0,color:{argb:`FFFFFFFF`}},n.getRow(1).fill={type:`pattern`,pattern:`solid`,fgColor:{argb:`FF2563EB`}};for(let[t,r]of nc(e)){let e=n.addRow({label:t,value:r});typeof r!=`number`||t.includes(`Margin`)||t.includes(`Jumlah`)||t.includes(`Unit`)||(e.getCell(`value`).numFmt=`#,##0`),(t===`Laba operasional`||t===`Penjualan bersih`||t===`Omzet`)&&(e.font={bold:!0})}n.addRow([]),n.addRow([`Dibuat`,qe(new Date().toISOString())]);let r=t.addWorksheet(`Harian`);r.columns=ec.map(e=>({header:e,key:e,width:e.includes(`Tanggal`)?14:20})),r.getRow(1).font={bold:!0,color:{argb:`FFFFFFFF`}},r.getRow(1).fill={type:`pattern`,pattern:`solid`,fgColor:{argb:`FF2563EB`}};for(let t of e.daily){let e=r.addRow(tc(t));for(let t=2;t<=12;t+=1)e.getCell(t).numFmt=`#,##0`;e.getCell(13).numFmt=`0.00`}if(r.getColumn(1).numFmt=`yyyy-mm-dd`,r.views=[{state:`frozen`,ySplit:1}],!e.storeId){let n=t.addWorksheet(`Per Toko`);n.columns=[{header:`Toko`,key:`name`,width:30},{header:`Platform`,key:`platform`,width:14},{header:`Pesanan`,key:`orders`,width:12},{header:`Omzet`,key:`gross`,width:18},{header:`Penjualan Bersih`,key:`net`,width:18},{header:`Laba Operasional`,key:`profit`,width:20}],n.getRow(1).font={bold:!0,color:{argb:`FFFFFFFF`}},n.getRow(1).fill={type:`pattern`,pattern:`solid`,fgColor:{argb:`FF2563EB`}};for(let t of e.storePerformance){let e=n.addRow({name:t.storeName,platform:t.platform,orders:t.summary.orderCount,gross:t.summary.grossSales,net:t.summary.netSales,profit:t.summary.operatingProfit});e.getCell(4).numFmt=`#,##0`,e.getCell(5).numFmt=`#,##0`,e.getCell(6).numFmt=`#,##0`}}let i=await t.xlsx.writeBuffer();return{fileName:`${rc(e)}.xlsx`,data:new Uint8Array(i)}}async function oc(e){let{jsPDF:t}=await de(async()=>{let{jsPDF:e}=await import(`./jspdf.es.min-CowJEiK2.js`);return{jsPDF:e}},[]),n=(await de(()=>import(`./jspdf.plugin.autotable-2eOJeXl-.js`),[])).default,r=new t({orientation:`landscape`,unit:`mm`,format:`a4`}),i=e.storeId?e.stores[0]?.name??`-`:`Semua toko`;r.setFontSize(16),r.setTextColor(`#172033`),r.text(`Laporan Keuangan Manka`,14,16),r.setFontSize(10),r.setTextColor(`#667085`),r.text(`Periode: ${D(e.range.from,`long`)} - ${D(e.range.to,`long`)}`,14,23),r.text(`Toko: ${i}`,14,28),r.text(`Dibuat: ${qe(new Date().toISOString())}`,14,33);let a=e.summary;n(r,{startY:39,head:[[`Metrik`,`Nilai`]],body:[[`Omzet`,F(a.grossSales)],[`Diskon penjual`,F(a.sellerDiscount)],[`Refund`,F(a.refunds)],[`Penjualan bersih`,F(a.netSales)],[`HPP`,F(a.cogs)],[`Laba kotor`,F(a.grossProfit)],[`Biaya marketplace`,F(a.marketplaceFees)],[`Biaya iklan`,F(a.advertisingSpend)],[`Biaya operasional`,F(a.operationalExpenses)],[`Laba operasional`,F(a.operatingProfit)],[`Margin operasional`,a.marginPercent===null?`N/A`:Dn(a.marginPercent)]],theme:`grid`,styles:{fontSize:9,cellPadding:2},headStyles:{fillColor:[37,99,235],textColor:255},columnStyles:{1:{halign:`right`}},margin:{left:14,right:14}}),n(r,{startY:(r.lastAutoTable?.finalY??60)+6,head:[[`Tanggal`,`Pesanan`,`Omzet`,`Refund`,`Bersih`,`HPP`,`Fee MP`,`Iklan`,`Operasional`,`Laba`]],body:e.daily.map(e=>[D(e.date),String(e.orderCount),F(e.grossSales),F(e.refunds),F(e.netSales),F(e.cogs),F(e.marketplaceFees),F(e.advertisingSpend),F(e.operationalExpenses),F(e.operatingProfit)]),theme:`striped`,styles:{fontSize:7.5,cellPadding:1.5},headStyles:{fillColor:[37,99,235],textColor:255},columnStyles:{2:{halign:`right`},3:{halign:`right`},4:{halign:`right`},5:{halign:`right`},6:{halign:`right`},7:{halign:`right`},8:{halign:`right`},9:{halign:`right`}},margin:{left:14,right:14},didDrawPage:()=>{let e=r.getNumberOfPages();r.setFontSize(8),r.setTextColor(`#667085`),r.text(`Manka - data lokal - halaman ${e}`,r.internal.pageSize.getWidth()-14,r.internal.pageSize.getHeight()-7,{align:`right`}),a.hasEstimatedFees&&r.text(`Sebagian biaya marketplace adalah estimasi.`,14,r.internal.pageSize.getHeight()-7)}});let o=r.output(`arraybuffer`);return{fileName:`${rc(e)}.pdf`,data:new Uint8Array(o)}}async function sc(e,t){if(t===`csv`){let{fileName:t,data:n}=ic(e);return zr(t,`text/csv;charset=utf-8`,n)}if(t===`xlsx`){let{fileName:t,data:n}=await ac(e);return zr(t,`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`,n)}let{fileName:n,data:r}=await oc(e);return zr(n,`application/pdf`,r)}var cc=[{format:`csv`,label:`CSV`,iconName:`file-text`},{format:`xlsx`,label:`Excel`,iconName:`file-spreadsheet`},{format:`pdf`,label:`PDF`,iconName:`file`}];function lc(e){let t=e.summary;return t.orderCount>0||t.marketplaceFees!==0||t.advertisingSpend!==0||t.operationalExpenses!==0||t.refunds!==0}var uc=async e=>{let{root:t,services:n}=e;t.innerHTML=J(`Menyusun laporan…`);try{let r=So(e.query),i=await n.storeService.listAll();if(e.signal.aborted)return;if(i.length===0){e.setTitle(`Laporan`),t.innerHTML=`
        ${H({eyebrow:`Analitik`,title:`Laporan keuangan`,subtitle:`Laporan dihitung dari transaksi lokal pada periode dan toko yang dipilih.`})}
        ${U({body:q({iconName:`chart-column`,title:`Belum ada data untuk dilaporkan`,description:`Tambahkan toko dan pesanan terlebih dahulu. Laporan akan tersedia otomatis.`,action:`${K(`/stores/new`,`Tambah toko`,`btn btn-primary`,`plus`)}
              ${K(`/orders/new`,`Tambah pesanan`,`btn btn-secondary`,`plus`)}`})})}
      `,z(t);return}let a=await n.reportService.getReport(r.period,r.storeId);if(e.signal.aborted)return;e.setTitle(`Laporan`);let o=r.storeId?i.find(e=>e.id===r.storeId)?.name??`Toko`:`Semua toko`,s=lc(a),c=a.daily.filter(e=>e.orderCount>0||e.refunds!==0||e.marketplaceFees!==0||e.advertisingSpend!==0||e.operationalExpenses!==0),l=(c.length>0?c:a.daily).map(e=>[`<span class="table-strong">${D(e.date)}</span>`,I(e.orderCount),F(e.grossSales),F(e.refunds),F(e.netSales),F(e.cogs),F(e.marketplaceFees),F(e.advertisingSpend),F(e.operationalExpenses),`<span class="${e.operatingProfit>=0?`value-positive`:`value-negative`}">${F(e.operatingProfit)}</span>`,e.marginPercent===null?`N/A`:Dn(e.marginPercent)]);if(t.innerHTML=`
      ${H({eyebrow:`Analitik`,title:`Laporan keuangan`,subtitle:`${r.period.label} · ${o}`,actions:`
          ${K(`/dashboard`,`Dashboard`,`btn btn-secondary`,`layout-dashboard`)}
          ${K(`/finance`,`Ringkasan keuangan`,`btn btn-secondary`,`wallet`)}
        `})}

      ${To(r,i)}

      <div class="report-export-bar">
        <div>
          <strong>Ekspor laporan</strong>
          <p>File berisi data aktual pada periode dan toko yang dipilih. Tidak ada data contoh.</p>
        </div>
        <div class="report-export-actions">
          ${cc.map(e=>`<button type="button" class="btn btn-secondary" data-export="${e.format}">${B(e.iconName)}<span>${e.label}</span></button>`).join(``)}
        </div>
      </div>

      ${s?`
            <div class="kpi-grid">
              ${W({label:`Penjualan bersih`,value:F(a.summary.netSales),iconName:`banknote`,hint:`${I(a.summary.orderCount)} pesanan · ${I(a.summary.unitsSold)} unit`})}
              ${W({label:`Laba kotor`,value:F(a.summary.grossProfit),iconName:`trending-up`,tone:a.summary.grossProfit>=0?`positive`:`negative`,hint:`Setelah HPP ${F(a.summary.cogs)}`})}
              ${W({label:`Laba operasional`,value:F(a.summary.operatingProfit),iconName:a.summary.operatingProfit>=0?`trending-up`:`trending-down`,tone:a.summary.operatingProfit>=0?`positive`:`negative`,hint:`Setelah fee, iklan, dan operasional`})}
              ${W({label:`Margin operasional`,value:a.summary.marginPercent===null?`N/A`:Dn(a.summary.marginPercent),iconName:`percent`,hint:a.summary.marginPercent===null?`Butuh penjualan bersih > 0`:`Laba operasional ÷ penjualan bersih`})}
            </div>

            ${a.summary.hasEstimatedFees?`<p class="inline-note note-warning">${B(`triangle-alert`)} Sebagian biaya marketplace masih estimasi; angka aktual dan estimasi dipisahkan pada rincian.</p>`:``}

            <div class="finance-grid">
              ${U({title:`Rincian laba rugi`,subtitle:`Perhitungan periode terpilih`,body:Ro(a.summary,a.storeId)})}
              ${U({title:`Catatan perhitungan`,subtitle:`Aturan yang dipakai laporan`,body:`
                  <ul class="report-notes">
                    <li><strong>Omzet</strong> dihitung dari harga item setelah diskon penjual, bukan diskon marketplace.</li>
                    <li><strong>Refund selesai</strong> mengurangi penjualan satu kali; pesanan batal/retur/refund tidak dihitung sebagai penjualan.</li>
                    <li><strong>HPP</strong> memakai snapshot saat pesanan dibuat, sehingga perubahan HPP produk tidak mengubah masa lalu.</li>
                    <li><strong>Biaya marketplace estimasi</strong> tidak dianggap biaya aktual pada laba.</li>
                    <li><strong>Settlement</strong> adalah arus kas dan tidak menambah omzet atau laba.</li>
                  </ul>
                  <p class="inline-note">${B(`info`)} ${L(zo(a.storeId))}</p>
                `})}
            </div>

            ${U({title:`Tren penjualan bersih dan laba`,subtitle:`${D(a.range.from,`long`)} – ${D(a.range.to,`long`)}`,body:`<div class="chart-box chart-box-lg"><canvas id="report-chart" aria-label="Grafik penjualan bersih dan laba operasional" role="img"></canvas></div>`})}

            ${U({title:`Rincian harian`,subtitle:`${I(a.daily.length)} hari dalam periode · ${I(c.length)} hari memiliki aktivitas`,padded:!1,body:Y([`Tanggal`,`Pesanan`,`Omzet`,`Refund`,`Bersih`,`HPP`,`Fee MP`,`Iklan`,`Operasional`,`Laba`,`Margin`],l)})}

            ${!a.storeId&&a.storePerformance.length>0?U({title:`Perbandingan toko`,subtitle:`Data pada periode terpilih`,padded:!1,body:Y([`Toko`,`Pesanan`,`Omzet`,`Penjualan bersih`,`HPP`,`Laba kotor`,`Laba operasional`,`Margin`],a.storePerformance.map(e=>[`<a class="table-link" href="#/stores/${e.storeId}">${L(e.storeName)}</a><span class="table-sub">${Pa[e.platform]}</span>`,I(e.summary.orderCount),F(e.summary.grossSales),F(e.summary.netSales),F(e.summary.cogs),F(e.summary.grossProfit),`<span class="${e.summary.operatingProfit>=0?`value-positive`:`value-negative`}">${F(e.summary.operatingProfit)}</span>`,e.summary.marginPercent===null?`N/A`:Dn(e.summary.marginPercent)]))}):``}
          `:U({body:q({iconName:`chart-column`,title:`Tidak ada aktivitas pada periode ini`,description:`Tidak ada pesanan, biaya, refund, atau iklan pada filter yang dipilih. Ubah periode/toko atau catat transaksi baru.`,action:`${K(`/orders/new`,`Tambah pesanan`,`btn btn-primary`,`plus`)}
                  ${K(`/finance/expenses/new`,`Catat biaya`,`btn btn-secondary`,`plus`)}`})})}
    `,Do(t,e),s){let n=t.querySelector(`#report-chart`);if(n){let t=await jo(n,a.daily.map(e=>D(e.date)),[{label:`Penjualan bersih`,data:a.daily.map(e=>e.netSales),color:`#2563EB`,fillColor:`rgba(37, 99, 235, 0.10)`,fill:!0},{label:`Laba operasional`,data:a.daily.map(e=>e.operatingProfit),color:`#16A34A`}],{currency:!0,signal:e.signal});t&&e.onCleanup(()=>t.destroy())}}t.querySelectorAll(`[data-export]`).forEach(e=>{e.addEventListener(`click`,async()=>{let t=e.dataset.export;if(t){Z(e,!0,`Menyiapkan…`);try{let e=await sc(a,t);V(e.method===`share`?`${e.fileName} siap dibagikan melalui dialog berbagi.`:`${e.fileName} diunduh.`,`success`)}catch(e){V(e instanceof Error?e.message:`Laporan gagal diekspor.`,`error`)}finally{Z(e,!1)}}})}),z(t)}catch(n){$(t,e,n)}},dc={app_settings:`Pengaturan aplikasi`,stores:`Toko & profil`,products:`Produk`,product_costs:`Riwayat HPP`,product_prices:`Riwayat harga jual`,orders:`Pesanan`,order_items:`Item pesanan`,marketplace_fees:`Biaya marketplace`,advertising_campaigns:`Kampanye iklan`,advertising_expenses:`Biaya iklan`,operational_expenses:`Biaya operasional`,refunds:`Refund`,settlements:`Settlement`,import_batches:`Riwayat import`,import_errors:`Error import`,audit_logs:`Audit log`},fc={create:`Tambah`,update:`Ubah`,delete:`Hapus`,backup:`Backup`,restore:`Restore`,reveal:`Tampilkan sensitif`,reveal_sensitive:`Tampilkan sensitif`,copy:`Salin sensitif`,import:`Import`,open:`Buka aplikasi`,update_status:`Ubah status`,archive:`Arsipkan`,restore_store:`Aktifkan toko`},pc={store:`Toko`,product:`Produk`,order:`Pesanan`,marketplace_fee:`Biaya marketplace`,advertising_campaign:`Kampanye iklan`,advertising_expense:`Biaya iklan`,operational_expense:`Biaya operasional`,refund:`Refund`,settlement:`Settlement`,database:`Database`,app:`Aplikasi`};function mc(e){return Object.entries(e).filter(([,e])=>e>0).map(([e,t])=>`<div class="count-item"><span>${L(dc[e]??e)}</span><strong>${I(t)}</strong></div>`).join(``)}function hc(e){if(!e)return`<span class="muted">—</span>`;try{let t=JSON.parse(e);if(typeof t!=`object`||!t)return L(e);let n=Object.entries(t).filter(([e])=>!/password|secret|account/i.test(e));return n.length===0?`<span class="muted">—</span>`:`<span class="table-note">${n.map(([e,t])=>`${L(e)}: ${L(String(t))}`).join(` · `)}</span>`}catch{return`<span class="table-note">${L(e)}</span>`}}function gc(e){return e.failedRows>0?G(`${I(e.failedRows)} gagal`,`warning`):G(`Berhasil`,`success`)}function _c(e){return`
    <div class="backup-inspect">
      <div class="backup-inspect-head">
        <span class="import-result-icon">${B(`shield-check`)}</span>
        <div>
          <strong>Backup valid dan dapat dipulihkan</strong>
          <p>Dibuat ${qe(e.createdAt)} · skema v${I(e.schemaVersion)} · aplikasi ${L(e.appVersion)}</p>
        </div>
      </div>
      <div class="count-grid">${mc(e.tableCounts)}</div>
      <p class="inline-note note-warning">${B(`triangle-alert`)} Pemulihan akan mengganti seluruh data saat ini, termasuk profile toko dan riwayat transaksi. Buat backup terbaru sebelum melanjutkan.</p>
      <div class="backup-actions">
        <button type="button" class="btn btn-danger" data-restore-confirm disabled>${B(`database-backup`)}<span>Pulihkan backup ini</span></button>
      </div>
    </div>
  `}var vc=async e=>{let{root:t,services:n}=e;e.setTitle(`Pengaturan`);try{let r=e.query.get(`batchId`),[i,a,o,s]=await Promise.all([n.backupRepo.getDataCounts(),n.audit.list(40),n.imports.listBatches(25),r?n.imports.listErrors(r,200):Promise.resolve([])]);if(e.signal.aborted)return;let c=r?o.find(e=>e.id===r)??null:null,l=i.stores+i.products+i.orders+i.fees+i.refunds+i.settlements+i.campaigns+i.expenses+i.operationalExpenses;t.innerHTML=`
      ${H({eyebrow:`Sistem`,title:`Pengaturan & data`,subtitle:`Backup terenkripsi, riwayat import, audit aktivitas, dan informasi keamanan data lokal.`})}

      <div class="settings-grid">
        ${U({title:`Ringkasan data`,subtitle:`Seluruh data tersimpan di perangkat ini`,body:`
            <div class="count-grid">
              <div class="count-item"><span>Toko</span><strong>${I(i.stores)}</strong></div>
              <div class="count-item"><span>Produk</span><strong>${I(i.products)}</strong></div>
              <div class="count-item"><span>Pesanan</span><strong>${I(i.orders)}</strong></div>
              <div class="count-item"><span>Biaya marketplace</span><strong>${I(i.fees)}</strong></div>
              <div class="count-item"><span>Refund</span><strong>${I(i.refunds)}</strong></div>
              <div class="count-item"><span>Settlement</span><strong>${I(i.settlements)}</strong></div>
              <div class="count-item"><span>Kampanye iklan</span><strong>${I(i.campaigns)}</strong></div>
              <div class="count-item"><span>Biaya iklan</span><strong>${I(i.expenses)}</strong></div>
              <div class="count-item"><span>Biaya operasional</span><strong>${I(i.operationalExpenses)}</strong></div>
            </div>
            <p class="inline-note">${B(`database`)} ${I(l)} catatan inti tersimpan. Database berjalan offline; tidak ada sinkronisasi cloud.</p>
          `})}

        ${U({title:`Keamanan & privasi`,body:`
            <ul class="settings-notes">
              <li>${B(`lock`)} Kata sandi marketplace dan nomor rekening disimpan terenkripsi AES-GCM.</li>
              <li>${B(`eye-off`)} Data sensitif hanya ditampilkan setelah tindakan pengguna dan tidak pernah masuk URL atau log.</li>
              <li>${B(`shield-alert`)} Aplikasi tidak memiliki login. Siapa pun yang dapat membuka perangkat dan aplikasi berpotensi melihat data bisnis.</li>
              <li>${B(`file-lock`)} Backup memuat profile toko dan dilindungi kata sandi yang hanya Anda ketahui.</li>
            </ul>
            <p class="inline-note">${B(`info`)} Kunci enkripsi perangkat ikut tersimpan di backup agar profile dapat dibuka setelah restore. Jaga file backup tetap aman.</p>
          `})}
      </div>

      <div class="settings-grid">
        ${U({title:`Buat backup`,subtitle:`Salinan lengkap database dalam satu file terenkripsi`,body:`
            <form id="backup-export-form" class="backup-form" novalidate>
              <div class="field">
                <label class="field-label" for="backup-password">Kata sandi backup <span class="required-mark" aria-hidden="true">*</span></label>
                <input class="input" id="backup-password" name="password" type="password" autocomplete="new-password" minlength="8" required />
                <p class="field-help">Minimal 8 karakter. Kata sandi ini diperlukan saat memulihkan backup.</p>
              </div>
              <div class="field">
                <label class="field-label" for="backup-password-confirm">Ulangi kata sandi <span class="required-mark" aria-hidden="true">*</span></label>
                <input class="input" id="backup-password-confirm" name="passwordConfirm" type="password" autocomplete="new-password" minlength="8" required />
              </div>
              <p class="form-error" data-backup-error hidden role="alert"></p>
              <div class="form-info">
                ${B(`shield-check`)}
                <p>File berisi seluruh data, termasuk profile toko terenkripsi, dan dapat disalin keluar aplikasi. Simpan di tempat aman.</p>
              </div>
              <div class="backup-actions">
                <button type="submit" class="btn btn-primary">${B(`download`)}<span>Buat & simpan backup</span></button>
              </div>
            </form>
            <div data-backup-result></div>
          `})}

        ${U({title:`Pulihkan backup`,subtitle:`Validasi file sebelum menimpa data`,body:`
            <div class="field">
              <label class="field-label" for="restore-file">File backup (.manka)</label>
              <input class="input file-input" id="restore-file" type="file" accept=".manka,.json,application/json" />
            </div>
            <div class="field">
              <label class="field-label" for="restore-password">Kata sandi backup</label>
              <input class="input" id="restore-password" type="password" autocomplete="current-password" />
            </div>
            <p class="form-error" data-restore-error hidden role="alert"></p>
            <div class="backup-actions">
              <button type="button" class="btn btn-secondary" data-restore-inspect>${B(`search`)}<span>Periksa backup</span></button>
            </div>
            <div data-restore-result></div>
          `})}
      </div>

      ${U({title:`Riwayat import`,subtitle:o.length>0?`${I(o.length)} batch terakhir`:`Belum ada import`,actions:`<a class="btn btn-secondary btn-sm" href="#/orders/import">${B(`upload`)}<span>Import pesanan</span></a>`,padded:o.length===0,body:o.length===0?q({compact:!0,iconName:`file-spreadsheet`,title:`Belum ada riwayat import`,description:`Import pesanan dari CSV/XLSX akan tercatat di sini beserta ringkasan baris berhasil dan gagal.`,action:`<a class="btn btn-secondary btn-sm" href="#/orders/import">Buka import</a>`}):Y([`Tanggal`,`File`,`Jenis`,`Total`,`Berhasil`,`Dilewati`,`Gagal`,`Status`,``],o.map(e=>[qe(e.createdAt),`<span class="table-strong">${L(e.fileName)}</span>`,L(e.importType===`orders`?`Pesanan`:e.importType),I(e.totalRows),I(e.successRows),I(e.skippedRows),I(e.failedRows),gc(e),`<a class="btn btn-ghost btn-sm" href="#/settings?batchId=${encodeURIComponent(e.id)}">Lihat error</a>`]))+(c?`<div class="import-error-panel">
                      <div class="section-heading"><h2>Error batch ${L(c.fileName)}</h2><p>${I(s.length)} error ditampilkan, maksimal 200 baris.</p></div>
                      ${s.length>0?Y([`Baris`,`Pesan`,`Data mentah`],s.map(e=>[I(e.rowNumber),L(e.message),e.rawData?`<code class="raw-data">${L(e.rawData)}</code>`:`<span class="muted">—</span>`])):q({compact:!0,iconName:`circle-check`,title:`Tidak ada error tersimpan`,description:`Batch ini tidak memiliki pesan error per baris.`})}
                      <a class="btn btn-secondary btn-sm" href="#/settings">${B(`x`)}<span>Tutup detail</span></a>
                    </div>`:``)})}

      ${U({title:`Audit aktivitas`,subtitle:`Perubahan data penting dan akses data sensitif`,padded:a.length===0,body:a.length===0?q({compact:!0,iconName:`history`,title:`Belum ada aktivitas tercatat`,description:`Audit log akan terisi saat data dibuat, diubah, dihapus, diekspor, atau dipulihkan.`}):Y([`Waktu`,`Aksi`,`Entitas`,`ID`,`Detail`],a.map(e=>[qe(e.createdAt),`<span class="table-strong">${L(fc[e.action]??e.action)}</span>`,L(pc[e.entityType]??e.entityType),e.entityId?`<code>${L(e.entityId.slice(0,12))}…</code>`:`<span class="muted">—</span>`,hc(e.details)]))})}

      ${U({title:`Tentang Manka`,body:`
          <dl class="detail-list detail-list-3">
            <div><dt>Versi aplikasi</dt><dd>1.0.0</dd></div>
            <div><dt>Zona waktu</dt><dd>Asia/Jakarta</dd></div>
            <div><dt>Mata uang</dt><dd>IDR (Rupiah)</dd></div>
            <div><dt>Penyimpanan</dt><dd>SQLite lokal${n.db.backend===`web`?` (mode browser pengembangan)`:``}</dd></div>
            <div><dt>Jaringan</dt><dd>Offline-first, tanpa backend</dd></div>
            <div><dt>Format backup</dt><dd>.manka · PBKDF2 + AES-GCM</dd></div>
          </dl>
          <p class="inline-note">${B(`info`)} Tanggal bisnis dihitung dengan zona waktu Asia/Jakarta. File ekspor dibuat langsung di perangkat.</p>
        `})}
    `;let u=t.querySelector(`#backup-export-form`),d=t.querySelector(`[data-backup-result]`);u?.addEventListener(`submit`,async e=>{e.preventDefault();let t=u.querySelector(`input[name="password"]`),r=u.querySelector(`input[name="passwordConfirm"]`),i=u.querySelector(`[data-backup-error]`),a=u.querySelector(`button[type="submit"]`),o=t?.value??``,s=r?.value??``,c=e=>{i&&(i.textContent=e,i.hidden=!1)};if(i&&(i.hidden=!0),o.length<8)c(`Kata sandi backup minimal 8 karakter.`),t?.focus();else if(o!==s)c(`Kata sandi dan konfirmasi tidak sama.`),r?.focus();else if(a){a.disabled=!0,a.innerHTML=`${B(`loader-circle`,`spin`)}<span>Menyiapkan backup…</span>`;try{let e=await n.backupService.exportBackup(o);u.reset(),d&&(d.innerHTML=`
            <div class="backup-success">
              <div class="backup-inspect-head">
                <span class="import-result-icon">${B(`circle-check`)}</span>
                <div>
                  <strong>Backup berhasil dibuat</strong>
                  <p>${L(e.fileName)} · ${e.method===`share`?`dibagikan melalui dialog berbagi`:`diunduh ke perangkat`}</p>
                </div>
              </div>
              <div class="count-grid">${mc(e.tableCounts)}</div>
              <p class="inline-note">${B(`shield-check`)} File dapat disalin keluar aplikasi. Simpan kata sandi terpisah dari file backup.</p>
            </div>
          `),V(`Backup berhasil dibuat.`,`success`)}catch(e){c(e instanceof Error?e.message:`Backup gagal dibuat.`),e instanceof N||V(`Backup gagal dibuat.`,`error`)}finally{a.disabled=!1,a.innerHTML=`${B(`download`)}<span>Buat & simpan backup</span>`}}});let f=t.querySelector(`#restore-file`),p=t.querySelector(`#restore-password`),m=t.querySelector(`[data-restore-result]`),h=t.querySelector(`[data-restore-error]`),g=t.querySelector(`[data-restore-inspect]`),_=null,v=``,y=()=>{_=null,v=``,m&&(m.innerHTML=``)};f?.addEventListener(`change`,y),p?.addEventListener(`input`,y);let b=e=>{h&&(h.textContent=e,h.hidden=!1)};g?.addEventListener(`click`,async()=>{h&&(h.hidden=!0);let e=f?.files?.[0]??null,t=p?.value??``;if(!e)b(`Pilih file backup terlebih dahulu.`);else if(t===``)b(`Masukkan kata sandi backup.`);else{g.disabled=!0,g.innerHTML=`${B(`loader-circle`,`spin`)}<span>Memeriksa…</span>`;try{let r=await n.backupService.inspectBackup(e,t);if(_=e,v=t,m){m.innerHTML=_c(r);let e=m.querySelector(`[data-restore-confirm]`);e&&(e.disabled=!1)}}catch(e){y(),b(e instanceof Error?e.message:`Backup gagal diperiksa.`)}finally{g.disabled=!1,g.innerHTML=`${B(`search`)}<span>Periksa backup</span>`}}}),m?.addEventListener(`click`,async t=>{let r=t.target;if(!(r instanceof Element))return;let i=r.closest(`[data-restore-confirm]`);if(i&&!i.disabled){if(!_||!v)b(`Periksa backup kembali sebelum memulihkan.`);else if(await yo({title:`Pulihkan backup?`,message:`Seluruh data saat ini akan diganti dengan isi backup. Tindakan ini tidak dapat dibatalkan.`,confirmLabel:`Pulihkan sekarang`,tone:`danger`,requireText:`PULIHKAN`,details:[`Semua toko, produk, pesanan, biaya, refund, settlement, dan pengaturan akan diganti.`,`Profile toko mengikuti kunci enkripsi yang tersimpan di backup.`,`Buat backup data saat ini terlebih dahulu bila masih diperlukan.`]})){i.disabled=!0,i.innerHTML=`${B(`loader-circle`,`spin`)}<span>Memulihkan…</span>`;try{let t=await n.backupService.restoreBackup(_,v);V(`Backup dipulihkan: ${I(t.tableCounts.orders??0)} pesanan, ${I(t.tableCounts.stores??0)} toko.`,`success`),e.navigate(`/dashboard`)}catch(e){i.disabled=!1,i.innerHTML=`${B(`database-backup`)}<span>Pulihkan backup ini</span>`,b(e instanceof Error?e.message:`Backup gagal dipulihkan.`)}}}}),z(t)}catch(n){$(t,e,n)}},yc=[{href:`/stores`,label:`Toko & profil`,description:`Kelola toko marketplace, data sensitif terenkripsi, arsip, dan riwayat toko.`,iconName:`store`},{href:`/orders`,label:`Pesanan`,description:`Catat penjualan, status pesanan, HPP snapshot, dan nominal pencairan.`,iconName:`shopping-bag`},{href:`/orders/import`,label:`Import pesanan`,description:`Tarik CSV/XLSX marketplace dengan mapping kolom, validasi, dan deteksi duplikat.`,iconName:`upload`},{href:`/products`,label:`Produk & HPP`,description:`Produk, harga jual, dan riwayat HPP untuk perhitungan laba yang konsisten.`,iconName:`package`},{href:`/reports`,label:`Laporan`,description:`Laporan harian, bulanan, tahunan, per toko, dan ekspor CSV/Excel/PDF.`,iconName:`chart-column`},{href:`/settings`,label:`Pengaturan & backup`,description:`Backup terenkripsi, restore, riwayat import, audit log, dan keamanan data.`,iconName:`settings`}],bc=[{href:`/finance/fees`,label:`Biaya marketplace`,description:`Potongan aktual dan estimasi.`,iconName:`credit-card`},{href:`/finance/ads`,label:`Iklan`,description:`Kampanye dan biaya iklan.`,iconName:`megaphone`},{href:`/finance/expenses`,label:`Biaya operasional`,description:`Biaya toko dan biaya bersama.`,iconName:`receipt`},{href:`/finance/refunds`,label:`Refund`,description:`Pengembalian dana yang tidak dihitung ganda.`,iconName:`refresh-cw`},{href:`/finance/settlements`,label:`Settlement`,description:`Pencairan dana sebagai arus kas.`,iconName:`banknote`}],xc=[{path:`/dashboard`,title:`Dashboard`,render:Po},{path:`/stores`,title:`Toko`,render:Io},{path:`/stores/new`,title:`Toko baru`,render:Wo},{path:`/stores/:id`,title:`Detail toko`,render:Ho},{path:`/stores/:id/edit`,title:`Ubah toko`,render:Wo},{path:`/products`,title:`Produk`,render:qo},{path:`/products/new`,title:`Produk baru`,render:Yo},{path:`/products/:id`,title:`Detail produk`,render:Jo},{path:`/products/:id/edit`,title:`Ubah produk`,render:Yo},{path:`/orders`,title:`Pesanan`,render:Xo},{path:`/orders/new`,title:`Pesanan baru`,render:ts},{path:`/orders/import`,title:`Import pesanan`,render:Cs},{path:`/orders/:id`,title:`Detail pesanan`,render:Zo},{path:`/orders/:id/edit`,title:`Ubah pesanan`,render:ts},{path:`/finance`,title:`Keuangan`,render:ws},{path:`/finance/fees`,title:`Biaya marketplace`,render:Es},{path:`/finance/fees/new`,title:`Biaya marketplace baru`,render:ks},{path:`/finance/fees/:id/edit`,title:`Ubah biaya marketplace`,render:ks},{path:`/finance/ads`,title:`Iklan`,render:Is},{path:`/finance/ads/new`,title:`Kampanye iklan baru`,render:Rs},{path:`/finance/ads/expenses`,title:`Biaya iklan`,render:zs},{path:`/finance/ads/expenses/new`,title:`Biaya iklan baru`,render:Bs},{path:`/finance/ads/expenses/:id/edit`,title:`Ubah biaya iklan`,render:Bs},{path:`/finance/ads/:id`,title:`Detail kampanye`,render:Ls},{path:`/finance/ads/:id/edit`,title:`Ubah kampanye`,render:Rs},{path:`/finance/expenses`,title:`Biaya operasional`,render:Hs},{path:`/finance/expenses/new`,title:`Biaya operasional baru`,render:Us},{path:`/finance/expenses/:id/edit`,title:`Ubah biaya operasional`,render:Us},{path:`/finance/refunds`,title:`Refund`,render:Js},{path:`/finance/refunds/new`,title:`Refund baru`,render:Ys},{path:`/finance/refunds/:id/edit`,title:`Ubah refund`,render:Ys},{path:`/finance/settlements`,title:`Settlement`,render:Qs},{path:`/finance/settlements/new`,title:`Settlement baru`,render:$s},{path:`/finance/settlements/:id/edit`,title:`Ubah settlement`,render:$s},{path:`/reports`,title:`Laporan`,render:uc},{path:`/settings`,title:`Pengaturan`,render:vc},{path:`/more`,title:`Lainnya`,render:async e=>{let{root:t,services:n}=e;e.setTitle(`Lainnya`);try{let r=await n.backupRepo.getDataCounts();if(e.signal.aborted)return;t.innerHTML=`
      ${H({eyebrow:`Menu`,title:`Lainnya`,subtitle:`Semua modul yang tidak muat di navigasi bawah. Data tetap tersimpan lokal di perangkat.`})}

      <div class="quick-counts">
        <span>${B(`store`)} <strong>${I(r.stores)}</strong> toko</span>
        <span>${B(`package`)} <strong>${I(r.products)}</strong> produk</span>
        <span>${B(`shopping-bag`)} <strong>${I(r.orders)}</strong> pesanan</span>
      </div>

      <div class="more-grid">
        ${yc.map(e=>`
            <a class="more-card" href="#${e.href}">
              <span class="more-icon">${B(e.iconName)}</span>
              <span class="more-copy">
                <strong>${e.label}</strong>
                <span>${e.description}</span>
              </span>
              ${B(`chevron-right`,`more-chevron`)}
            </a>
          `).join(``)}
      </div>

      ${U({title:`Keuangan`,subtitle:`Akses cepat ke modul keuangan`,body:`
          <div class="more-grid more-grid-compact">
            ${bc.map(e=>`
                <a class="more-card more-card-compact" href="#${e.href}">
                  <span class="more-icon">${B(e.iconName)}</span>
                  <span class="more-copy">
                    <strong>${e.label}</strong>
                    <span>${e.description}</span>
                  </span>
                  ${B(`chevron-right`,`more-chevron`)}
                </a>
              `).join(``)}
          </div>
        `})}

      ${U({title:`Tentang data`,body:`
          <p class="inline-note">${B(`shield-check`)} Manka berjalan offline. Tidak ada akun, server, atau sinkronisasi cloud. Backup terenkripsi tersedia di Pengaturan dan dapat disalin keluar aplikasi.</p>
          <div class="more-foot-links">
            <a class="btn btn-secondary" href="#/settings">${B(`database-backup`)}<span>Backup & restore</span></a>
            <a class="btn btn-ghost" href="#/dashboard">${B(`layout-dashboard`)}<span>Kembali ke dashboard</span></a>
          </div>
        `})}
    `,z(t)}catch(n){$(t,e,n)}}}];function Sc(e){let[t=``,n=``]=e.replace(/^#/,``).split(`?`),r=t.trim();return r===``&&(r=`/dashboard`),r.startsWith(`/`)||(r=`/${r}`),r.length>1&&r.endsWith(`/`)&&(r=r.slice(0,-1)),{path:r,query:new URLSearchParams(n)}}function Cc(e,t){let n=t.split(`/`).filter(Boolean);for(let t of e){let e=t.path.split(`/`).filter(Boolean);if(e.length!==n.length)continue;let r={},i=!0;for(let t=0;t<e.length;t+=1){let a=e[t]??``,o=n[t]??``;if(a.startsWith(`:`)){if(o===``){i=!1;break}r[a.slice(1)]=decodeURIComponent(o)}else if(a!==o){i=!1;break}}if(i)return{route:t,params:r}}return null}function wc(e,t,n,r){let i=null,a=[],o=!1,s=(e,t={})=>{let n=e.startsWith(`/`)?e:`/${e}`,r=`#${n}`;window.location.hash===r?l():t.replace?(window.history.replaceState(null,``,r),l()):window.location.hash=n},c=()=>{for(let e of a.splice(0))try{e()}catch{}},l=async()=>{if(o)return;i?.abort(),i=new AbortController;let u=i;c(),vo();let d=Sc(window.location.hash),f=d.path,p=d.query;(f===`/`||f===``)&&(f=`/dashboard`,p=new URLSearchParams,window.history.replaceState(null,``,`#/dashboard`));let m=Cc(e,f),h=document.createElement(`div`);if(h.className=`page`,t.replaceChildren(h),window.scrollTo({top:0,left:0,behavior:`auto`}),r.setActive(f),!m){document.title=`Halaman tidak ditemukan · Manka`,r.setPageLabel(`Tidak ditemukan`),h.innerHTML=`
        <div class="page-not-found">
          ${Qa(`Halaman yang Anda buka tidak tersedia. Gunakan navigasi untuk kembali.`,`<a class="btn btn-primary" href="#/dashboard">Kembali ke dashboard</a>`)}
        </div>
      `,z(h);return}let{route:g,params:_}=m,v=g.title;document.title=`${g.title} · Manka`,r.setPageLabel(g.title);let y={root:h,path:f,params:_,query:p,services:n,signal:u.signal,navigate:s,refresh:()=>{l()},onCleanup:e=>{a.push(e)},setTitle:e=>{v=e,u.signal.aborted||(document.title=`${e} · Manka`,r.setPageLabel(e))}};h.setAttribute(`aria-busy`,`true`);try{if(await g.render(y),u.signal.aborted)return;h.removeAttribute(`aria-busy`),z(h),v&&r.setPageLabel(v)}catch(e){if(u.signal.aborted)return;h.removeAttribute(`aria-busy`),h.innerHTML=Qa(Qt(e,`Halaman gagal dimuat. Silakan coba lagi.`),`<button type="button" class="btn btn-primary" data-retry-page>Muat ulang</button>`),h.querySelector(`[data-retry-page]`)?.addEventListener(`click`,()=>{l()}),z(h)}},u=()=>{l()};window.addEventListener(`hashchange`,u);let d=Sc(window.location.hash).path;return window.location.hash&&window.location.hash!==`#`&&d!==`/`||window.history.replaceState(null,``,`#/dashboard`),l(),{navigate:s,refresh:()=>{l()},stop:()=>{o=!0,window.removeEventListener(`hashchange`,u),i?.abort(),c()}}}function Tc(e,t){let n=Na(e,t,e=>{r.router.navigate(e)}),r={router:wc(xc,n.pageHost,t,{setActive:e=>n.setActive(e),setPageLabel:e=>n.setPageLabel(e)}),services:t};return r}var Ec=null;function Dc(e){let t=document.getElementById(`app`);t&&(t.innerHTML=`
    <div class="boot-error">
      <div class="boot-error-card">
        <span class="boot-error-mark">M</span>
        <h1>Data lokal gagal dibuka</h1>
        <p>${L(e instanceof Error&&e.message?e.message:`Kesalahan tidak diketahui.`)}</p>
        <p class="boot-error-hint">Pastikan aplikasi tidak sedang dibuka di tab lain. Pada browser, penyimpanan IndexedDB harus diizinkan.</p>
        <button type="button" class="btn btn-primary" id="boot-retry">Coba lagi</button>
      </div>
    </div>
  `,document.getElementById(`boot-retry`)?.addEventListener(`click`,()=>{window.location.reload()}))}async function Oc(){let e=document.getElementById(`app`);if(!e)throw Error(`Elemen #app tidak ditemukan.`);try{let t=await Fr(),n=Jr(t);Ec=Tc(e,n),await n.audit.log(`open`,`app`,null,{backend:t.backend,userAgent:navigator.userAgent.slice(0,120)})}catch(e){Dc(e)}}window.addEventListener(`beforeunload`,()=>{Ec?.router.stop()}),Oc();export{o as a,h as i,g as n,l as o,te as r,c as s,de as t};