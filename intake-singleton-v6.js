(()=>{'use strict';
if(globalThis.FitCoachIntakeSingletonV6)return;
globalThis.FitCoachIntakeSingletonV6=true;

const originalAppend=Element.prototype.append;
const originalPrepend=Element.prototype.prepend;

function filterNodes(target,nodes,mode){
  return nodes.filter(node=>{
    if(!(node instanceof Element))return true;
    if(node.id==='fcIntakeModal'&&document.getElementById('fcIntakeModal'))return false;
    if(node.id==='fcIntakeStyle'&&document.getElementById('fcIntakeStyle'))return false;
    if(node.classList.contains('fcIntakeLaunch')){
      const scope=target?.closest?.('#home,#settings')||target;
      if(scope?.querySelector?.('.fcIntakeLaunch'))return false;
    }
    return true;
  });
}

Element.prototype.append=function(...nodes){
  const allowed=filterNodes(this,nodes,'append');
  if(allowed.length)return originalAppend.apply(this,allowed);
};

Element.prototype.prepend=function(...nodes){
  const allowed=filterNodes(this,nodes,'prepend');
  if(allowed.length)return originalPrepend.apply(this,allowed);
};
})();