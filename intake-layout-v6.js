(()=>{'use strict';
const id='fitcoach-intake-layout-v6';
if(document.getElementById(id))return;
const style=document.createElement('style');
style.id=id;
style.textContent=`
.fcIntakeActions{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;gap:10px!important;align-items:stretch!important}
.fcIntakeActions>button{position:static!important;inset:auto!important;transform:none!important;width:auto!important;min-width:0!important;max-width:none!important;margin:0!important;z-index:auto!important}
.fcIntakeActions>button[hidden]{display:none!important}
@media(max-width:620px){.fcIntakeActions{grid-template-columns:1fr 1fr!important}.fcIntakeActions>#fcGenerate:not([hidden]){grid-column:1/-1}}
`;
document.head.appendChild(style);
})();
