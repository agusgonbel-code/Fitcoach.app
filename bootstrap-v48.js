(()=>{'use strict';
try{
  if(localStorage.getItem('profile')===null){
    localStorage.setItem('profile',JSON.stringify({name:''}));
  }
}catch{}
})();
