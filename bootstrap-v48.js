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
function installOnboardingReloadGuard(){
  document.addEventListener('click',event=>{
    if(!event.target.closest?.('#fcGenerate'))return;
    queueMicrotask(()=>{
      try{
        if(localStorage.getItem('fitcoach_client_profile_v35')!==null)location.reload();
      }catch{}
    });
  });
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>{installFreshGuard();},{once:true});else{installFreshGuard();}
})();

