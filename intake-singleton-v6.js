(()=>{'use strict';
if(globalThis.FitCoachIntakeSingletonV6)return;
globalThis.FitCoachIntakeSingletonV6=true;

const originalAppend=Element.prototype.append;
const originalPrepend=Element.prototype.prepend;
const originalAppendChild=Node.prototype.appendChild;

function filterNodes(target,nodes){
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

function isUnifiedIntakeScript(node){
  return node instanceof HTMLScriptElement && /(?:^|\/)unified-intake-v35\.js(?:\?|$)/.test(node.src||'');
}

function existingUnifiedScript(exclude){
  return [...document.scripts].find(script=>script!==exclude&&/(?:^|\/)unified-intake-v35\.js(?:\?|$)/.test(script.src||''));
}

Node.prototype.appendChild=function(node){
  if(isUnifiedIntakeScript(node)&&existingUnifiedScript(node)){
    queueMicrotask(()=>node.dispatchEvent(new Event('load')));
    return node;
  }
  return originalAppendChild.call(this,node);
};

Element.prototype.append=function(...nodes){
  const allowed=filterNodes(this,nodes);
  if(allowed.length)return originalAppend.apply(this,allowed);
};

Element.prototype.prepend=function(...nodes){
  const allowed=filterNodes(this,nodes);
  if(allowed.length)return originalPrepend.apply(this,allowed);
};
})();