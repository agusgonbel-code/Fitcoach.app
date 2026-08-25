(()=>{'use strict';
const id='fitcoach-intake-layout-v6';
if(document.getElementById(id))return;
const style=document.createElement('style');
style.id=id;
style.textContent=`
.fcIntake{position:relative!important;isolation:isolate!important;overflow:visible!important}
.fcIntakeBody,.fcStep{position:relative!important;z-index:1!important}
.fcIntakeActions{display:grid!important;grid-template-columns:repeat(3,minmax(0,1fr))!important;grid-template-areas:'prev next generate'!important;gap:12px!important;align-items:stretch!important;position:sticky!important;bottom:0!important;z-index:1000!important;background:#0f172a!important;padding:12px 0 calc(env(safe-area-inset-bottom) + 4px)!important;margin-top:18px!important;border-top:1px solid rgba(255,255,255,.10)!important;pointer-events:auto!important}
.fcIntakeActions>button{position:static!important;inset:auto!important;transform:none!important;width:100%!important;min-width:0!important;max-width:100%!important;min-height:48px!important;margin:0!important;box-sizing:border-box!important;pointer-events:auto!important;touch-action:manipulation!important}
.fcIntakeActions>#fcPrev{grid-area:prev!important}
.fcIntakeActions>#fcNext{grid-area:next!important}
.fcIntakeActions>#fcGenerate{grid-area:generate!important}
.fcIntakeActions>button[hidden]{display:none!important}
@media(max-width:620px){
  .fcModal{padding-bottom:0!important}
  .fcIntake{padding-bottom:0!important}
  .fcIntakeActions{grid-template-columns:minmax(0,1fr) minmax(0,1fr)!important;grid-template-areas:'prev next' 'generate generate'!important;padding:12px 0 calc(env(safe-area-inset-bottom) + 8px)!important;margin-left:0!important;margin-right:0!important}
}
`;
document.head.appendChild(style);
})();