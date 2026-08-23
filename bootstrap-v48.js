(()=>{'use strict';
let fresh=false;
try{
  fresh=localStorage.getItem('profile')===null&&localStorage.getItem('fitcoach_client_profile_v35')===null;
  if(localStorage.getItem('profile')===null){
    localStorage.setItem('profile',JSON.stringify({name:''}));
  }
}catch{}
function clearFreshLegacyDefaults(){
  if(!fresh)return;
  ['calcAge','calcHeight','calcWeight','calcFat'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',clearFreshLegacyDefaults,{once:true});else clearFreshLegacyDefaults();
})();