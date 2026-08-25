(()=>{'use strict';
let fresh=false;
try{
  fresh=localStorage.getItem('profile')===null&&localStorage.getItem('fitcoach_client_profile_v35')===null&&localStorage.getItem('fitcoach_nutrition_profile_v34')===null;
  if(localStorage.getItem('profile')===null){
    localStorage.setItem('profile',JSON.stringify({name:''}));
  }
}catch{}
globalThis.FitCoachFreshLaunchV48=fresh;
const IDS=['calcAge','calcHeight','calcWeight','calcFat','age','hei','wei','bf'];
function clearFreshDefaults(root=document){
  if(!fresh)return;
  IDS.forEach(id=>{const el=(root.getElementById?.(id)||document.getElementById(id));if(el)el.value='';});
}
function installFreshGuard(){
  clearFreshDefaults(document);
  if(!fresh)return;
  const observer=new MutationObserver(records=>{
    for(const record of records){
      for(const node of record.addedNodes){
        if(node.nodeType!==1)continue;
        clearFreshDefaults(node);
        IDS.forEach(id=>{const el=node.matches?.(`#${id}`)?node:node.querySelector?.(`#${id}`);if(el)el.value='';});
      }
    }
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});
  window.addEventListener('load',()=>{clearFreshDefaults(document);setTimeout(()=>{clearFreshDefaults(document);observer.disconnect();},250);},{once:true});
}
function loadScript(src,key){
  return new Promise((resolve,reject)=>{
    if(document.querySelector(`script[data-fitcoach-module="${key}"]`)){resolve();return;}
    const s=document.createElement('script');
    s.src=src;
    s.dataset.fitcoachModule=key;
    s.onload=resolve;
    s.onerror=()=>reject(new Error(`No se pudo cargar ${src}`));
    document.head.appendChild(s);
  });
}
function loadReleaseModules(){
  loadScript('nutrition-precision-v6.js?v=6.0.0','precision')
    .then(()=>loadScript('client-engine-v35.js?v=6.0.0','client-engine'))
    .then(()=>loadScript('client-quality-v41.js?v=6.0.0','client-quality'))
    .then(()=>loadScript('mobile-quality-v41.js?v=6.0.0','mobile-quality'))
    .then(()=>loadScript('unified-intake-v35.js?v=6.0.0','unified-intake'))
    .then(()=>loadScript('coach-page-v6.js?v=6.0.0','coach-page'))
    .catch(error=>console.error('[FitCoach release modules]',error));
}
loadReleaseModules();
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{installFreshGuard();},{once:true});else{installFreshGuard();}
})();
