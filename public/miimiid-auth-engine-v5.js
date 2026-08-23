/* Miimiid Authentication Engine v5
 * One state machine, one form/validation layer, one action lifecycle,
 * one navigation owner and one authentication service.
 */
(function(window, document){
  'use strict';

  const STATES=Object.freeze({IDLE:'idle',VALIDATING:'validating',SUBMITTING:'submitting',SUCCESS:'success',FAILURE:'failure',RECOVERING:'recovering'});
  const SESSION=Object.freeze({UNAUTHENTICATED:'unauthenticated',AUTHENTICATED:'authenticated',REFRESHING:'refreshing',EXPIRED:'expired'});
  const EVENTS=Object.freeze({FIELD_CHANGED:'FIELD_CHANGED',FIELD_FOCUSED:'FIELD_FOCUSED',FIELD_BLURRED:'FIELD_BLURRED',ACTION:'ACTION',BACK:'BACK',MODE:'MODE'});

  const FLOW={
    login:{initial:'login',steps:{login:{fields:[
      {id:'email',element:'miimiid-login-identifier',rules:['required','email']},
      {id:'password',element:'miimiid-login-password',rules:['required','password']}
    ],action:{id:'login',element:'miimiid-login-submit',label:'authSignIn',api:'login'}}}},
    register:{initial:'welcome',steps:{
      welcome:{step:1,fields:[],action:{id:'start',element:'miimiid-register-get-started',label:'authGetStarted',next:'name'}},
      name:{step:2,fields:[{id:'firstName',element:'miimiid-register-first-name',rules:['required']},{id:'lastName',element:'miimiid-register-last-name',rules:['required']}],action:{id:'name-next',element:'miimiid-register-name-next',label:'authContinue',next:'email'}},
      email:{step:3,fields:[{id:'email',element:'miimiid-register-email',rules:['required','email']}],action:{id:'email-next',element:'miimiid-register-contact-next',label:'authContinue',next:'personal'}},
      personal:{step:4,fields:[{id:'gender',element:'miimiid-register-gender',rules:['required','gender']},{id:'dateOfBirth',element:'miimiid-register-dob',rules:['required','birthday']}],action:{id:'personal-next',element:'miimiid-register-details-next',label:'authContinue',next:'password'}},
      password:{step:5,fields:[{id:'password',element:'miimiid-register-password',rules:['required','password']},{id:'confirmPassword',element:'miimiid-register-confirm',rules:['required','confirmation']}],action:{id:'register',element:'miimiid-register-submit',label:'authCreateAccountButton',api:'register'}},
      verification:{step:6,fields:[{id:'code',element:'miimiid-register-verification-code',rules:['required','verification']}],action:{id:'verify',element:'miimiid-verify-account-submit',label:'authVerifyAccount',api:'verify'},secondary:[{id:'resend',element:'miimiid-resend-verification',label:'authResendCode',api:'resend'}]}
    }},
    forgot:{initial:'forgot',steps:{forgot:{fields:[{id:'email',element:'miimiid-forgot-identifier',rules:['required','email']}],action:{id:'forgot',element:'miimiid-forgot-submit',label:'authSendResetInstructions',api:'forgot'}}}},
    reset:{initial:'reset',steps:{reset:{fields:[{id:'password',element:'miimiid-reset-password',rules:['required','password']},{id:'confirmPassword',element:'miimiid-reset-confirm',rules:['required','confirmation']}],action:{id:'reset',element:'miimiid-reset-submit',label:'authResetPasswordButton',api:'reset'}}}}
  };

  const FORMS={login:'miimiid-login-form',register:'miimiid-register-form',forgot:'miimiid-forgot-form',reset:'miimiid-reset-form'};
  const MODE_BUTTONS={'miimiid-show-register':'register','miimiid-show-forgot':'forgot','miimiid-show-login-from-register':'login','miimiid-show-login-from-forgot':'login','miimiid-show-login-from-reset':'login'};
  const REGISTER_STEPS=['welcome','name','email','personal','password','verification'];
  const allFields=()=>Object.values(FLOW).flatMap(flow=>Object.values(flow.steps)).flatMap(step=>step.fields||[]);
  const email=v=>String(v||'').trim().toLowerCase();
  const translate=(key,fallback)=>{try{if(typeof window.miimiidDashboardTranslate==='function'){const x=window.miimiidDashboardTranslate(key);if(x&&x!==key)return x;}if(typeof window.miimiidTranslate==='function'){const x=window.miimiidTranslate(key,typeof window.getSavedLanguage==='function'?window.getSavedLanguage():'en');if(x&&x!==key)return x;}}catch(_){}return fallback||key;};

  class ValidationEngine{
    validate(rule,value,values){const v=String(value??'');
      if(rule==='required')return v.trim()?null:'authRequired';
      if(rule==='email')return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email(v))?null:'authEnterValidEmail';
      if(rule==='password')return v.length>=8?null:'authPasswordMinLength';
      if(rule==='confirmation')return v===String(values.password||'')?null:'authPasswordMismatch';
      if(rule==='verification')return /^\d{6}$/.test(v.trim())?null:'authVerificationCodeRequired';
      if(rule==='gender')return v==='male'||v==='female'?null:'authRequired';
      if(rule==='birthday'){if(!/^\d{4}-\d{2}-\d{2}$/.test(v))return'authBirthdayInvalid';const d=new Date(v+'T00:00:00');if(Number.isNaN(d.getTime())||d.toISOString().slice(0,10)!==v)return'authBirthdayInvalid';const n=new Date(),min=new Date(n.getFullYear()-18,n.getMonth(),n.getDate());return d<=min?null:'authBirthdayInvalid';}
      return null;
    }
    step(step,values){const errors={};for(const f of step?.fields||[]){for(const r of f.rules||[]){const code=this.validate(r,values[f.id],values);if(code){errors[f.id]={code,field:f.id};break;}}}return errors;}
  }

  class FormEngine{
    constructor(){this.values={};this.touched={};this.errors={};}
    configure(fields,preserve=true){const old=this.values;this.values={};this.touched={};this.errors={};for(const f of fields||[])this.values[f.id]=preserve&&old[f.id]!==undefined?old[f.id]:this.read(f);}
    read(f){const e=document.getElementById(f.element);return e?String(e.value||''):'';}
    sync(fields){for(const f of fields||[]){const e=document.getElementById(f.element);if(e)this.values[f.id]=e.value;}}
    touchAll(fields){for(const f of fields||[])this.touched[f.id]=true;}
  }

  class AuthService{
    async request(url,payload,method='POST'){let response;try{response=await fetch(url,{method,credentials:'same-origin',headers:{Accept:'application/json',...(payload!==undefined?{'Content-Type':'application/json'}:{})},body:payload===undefined?undefined:JSON.stringify(payload)});}catch(_){throw{code:'NETWORK_ERROR',message:'Unable to connect to the authentication service.',source:'network',retryable:true};}let result;try{result=await response.json();}catch(_){throw{code:'INVALID_RESPONSE',message:'The authentication service returned an invalid response.',source:'server'};}if(!response.ok||result?.status!=='success')throw{code:result?.code||`HTTP_${response.status}`,message:result?.message||'Authentication request failed.',source:response.status>=500?'server':'authentication',retryable:response.status>=500};return result;}
    login(v){return this.request('/api/auth/login',{identifier:email(v.email),password:v.password});}
    register(v){return this.request('/api/auth/register',{firstName:v.firstName,lastName:v.lastName,email:email(v.email),gender:v.gender,dateOfBirth:v.dateOfBirth,password:v.password});}
    verify(v){return this.request('/api/auth/verify-account',{email:email(v.email),code:String(v.code||'').trim()});}
    resend(v){return this.request('/api/auth/resend-verification',{email:email(v.email)});}
    forgot(v){return this.request('/api/auth/forgot-password',{email:email(v.email)});}
    reset(v){return this.request('/api/auth/reset-password',{token:new URLSearchParams(location.search).get('resetToken'),password:v.password});}
    me(){return this.request('/api/auth/me',undefined,'GET');}
    logout(){return this.request('/api/auth/logout',{});}
  }

  class SessionManager{
    constructor(service){this.service=service;this.state=SESSION.UNAUTHENTICATED;this.user=null;}
    async restore(){this.state=SESSION.REFRESHING;try{const r=await this.service.me();this.user=r?.data?.user||null;this.state=this.user?SESSION.AUTHENTICATED:SESSION.UNAUTHENTICATED;return this.user;}catch(_){this.user=null;this.state=SESSION.UNAUTHENTICATED;return null;}}
    authenticate(user){this.user=user||null;this.state=this.user?SESSION.AUTHENTICATED:SESSION.UNAUTHENTICATED;if(this.user){window.currentUser=this.user;window.MIIMIID_CURRENT_USER=this.user;}}
  }

  class NavigationController{
    constructor(){this.current=null;this.history=[];}
    go(step,replace=false){if(this.current&&this.current!==step&&!replace)this.history.push(this.current);this.current=step;return step;}
    back(){return this.history.pop()||null;}
  }

  class ActionController{
    constructor(){this.running=null;}
    execute(action,operation){if(this.running)return this.running.promise;let run;run={id:action.id,promise:null};this.running=run;run.promise=(async()=>{await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame);return operation();})().finally(()=>{if(this.running===run)this.running=null;});return run.promise;}
  }

  class Renderer{
    constructor(engine){this.engine=engine;this.installStyle();}
    installStyle(){if(document.getElementById('miimiid-auth-v5-style'))return;const s=document.createElement('style');s.id='miimiid-auth-v5-style';s.textContent='.miimiid-auth-v5-spinner{position:absolute;left:50%;top:50%;width:18px;height:18px;transform:translate(-50%,-50%);border:2px solid currentColor;border-right-color:transparent;border-bottom-color:transparent;border-radius:50%;animation:miimiid-auth-v5-spin .65s linear infinite;display:none}.miimiid-auth-v5-loading{position:relative;pointer-events:none}.miimiid-auth-v5-loading .miimiid-auth-v5-spinner{display:block}.miimiid-auth-v5-loading .miimiid-auth-v5-label{visibility:hidden}@keyframes miimiid-auth-v5-spin{to{transform:translate(-50%,-50%) rotate(360deg)}}';document.head.appendChild(s);}
    prepareButton(action){const b=document.getElementById(action.element);if(!b)return null;if(!b.dataset.authV5Prepared){const html=b.innerHTML;b.innerHTML=`<span class="miimiid-auth-v5-label">${html}</span><span class="miimiid-auth-v5-spinner" aria-hidden="true"></span>`;b.dataset.authV5Prepared='true';}return b;}
    button(action){const b=this.prepareButton(action);if(!b)return;const loading=this.engine.actions.running?.id===action.id;b.disabled=loading;b.classList.toggle('miimiid-auth-v5-loading',loading);b.setAttribute('aria-busy',String(loading));}
    ensureGender(){const existing=document.getElementById('miimiid-register-gender');if(existing){if(existing.tagName==='SELECT'){Array.from(existing.options).forEach(o=>{if(o.value&&!['male','female'].includes(o.value))o.remove();});}return;}const form=document.getElementById('miimiid-register-form');const dob=document.getElementById('miimiid-register-dob');if(!form||!dob)return;const parent=dob.closest('.miimiid-auth-field')||dob.parentElement;const wrap=document.createElement('div');wrap.className=parent?.className||'miimiid-auth-field';wrap.innerHTML=`<label for="miimiid-register-gender">${translate('authGender','Gender')}</label><select id="miimiid-register-gender" required><option value="">${translate('authSelectGender','Select gender')}</option><option value="male">${translate('authMale','Male')}</option><option value="female">${translate('authFemale','Female')}</option></select>`;(parent?.parentElement||form).insertBefore(wrap,parent||null);}
    ensureSteps(){const form=document.getElementById('miimiid-register-form');if(!form)return;const nodes=[...form.querySelectorAll('[data-register-step]')];if(nodes.length>=6)return;const ids=['miimiid-register-get-started','miimiid-register-first-name','miimiid-register-email','miimiid-register-dob','miimiid-register-password','miimiid-register-verification-code'];const seen=[];for(const id of ids){const el=document.getElementById(id);const p=el?.closest('[data-register-step]');if(p&&!seen.includes(p))seen.push(p);}if(seen.length===6)return;/* Preserve legacy containers when present; otherwise assign nearest form sections by action/field ownership. */const selectors=[['miimiid-register-get-started'],['miimiid-register-first-name','miimiid-register-last-name'],['miimiid-register-email'],['miimiid-register-gender','miimiid-register-dob'],['miimiid-register-password','miimiid-register-confirm','miimiid-register-submit'],['miimiid-register-verification-code','miimiid-verify-account-submit']];const containers=[];for(const group of selectors){const el=group.map(id=>document.getElementById(id)).find(Boolean);const c=el?.closest('section,.miimiid-auth-step,.auth-step,.form-step,.registration-step,.miimiid-auth-card-content')||el?.parentElement;if(c&&!containers.includes(c))containers.push(c);}containers.slice(0,6).forEach((c,i)=>c.dataset.registerStep=String(i+1));}
    show(){const s=this.engine.state;for(const [mode,id] of Object.entries(FORMS)){const f=document.getElementById(id);if(f)f.classList.toggle('hidden',mode!==s.mode);}if(s.mode==='register'){const n=FLOW.register.steps[s.step]?.step;document.querySelectorAll('#miimiid-register-form [data-register-step]').forEach(x=>x.classList.toggle('hidden',Number(x.dataset.registerStep)!==n));}const step=FLOW[s.mode]?.steps[s.step];for(const f of step?.fields||[])this.field(f);if(step?.action)this.button(step.action);for(const a of step?.secondary||[])this.button(a);const status=document.getElementById('miimiid-auth-status');if(status){status.textContent=s.error||'';status.classList.toggle('hidden',!s.error);}}
    field(f){const el=document.getElementById(f.element);if(!el)return;const invalid=!!this.engine.form.errors[f.id];el.setAttribute('aria-invalid',String(invalid));const parent=el.closest('.miimiid-auth-field')||el.parentElement;if(!parent)return;let e=parent.querySelector('[data-auth-v5-error]');if(!e){e=document.createElement('div');e.dataset.authV5Error='true';e.className='miimiid-auth-field-error';parent.appendChild(e);}const code=this.engine.form.errors[f.id]?.code;e.textContent=code?translate(code,'Please check this field.'):'';e.hidden=!code;}
    render(){this.show();}
  }

  class AuthEngine{
    constructor(){this.validation=new ValidationEngine();this.form=new FormEngine();this.service=new AuthService();this.session=new SessionManager(this.service);this.navigation=new NavigationController();this.actions=new ActionController();this.state={mode:'login',step:'login',status:STATES.IDLE,error:null,verificationEmail:''};this.renderer=new Renderer(this);}
    step(){return FLOW[this.state.mode]?.steps[this.state.step];}
    configure(){if(this.state.mode==='register'){this.renderer.ensureGender();this.renderer.ensureSteps();}this.form.configure(this.step()?.fields||[],true);this.renderer.render();}
    setMode(mode){if(!FLOW[mode])return;this.state={...this.state,mode,step:FLOW[mode].initial,status:STATES.IDLE,error:null};this.navigation=new NavigationController();this.configure();}
    go(step,replace=false){if(!FLOW[this.state.mode]?.steps[step])return;this.navigation.go(step,replace);this.state={...this.state,step,status:STATES.IDLE,error:null};this.configure();}
    values(){this.form.sync(this.step()?.fields);const v={...this.form.values};if(this.state.mode==='register'){for(const id of ['firstName','lastName','email','gender','dateOfBirth','password','confirmPassword']){const f=allFields().find(x=>x.id===id);const e=f&&document.getElementById(f.element);if(e)v[id]=e.value;}}if(this.state.step==='verification')v.email=this.state.verificationEmail;return v;}
    async dispatch(type,payload={}){if(type===EVENTS.MODE)return this.setMode(payload.mode);if(type===EVENTS.FIELD_CHANGED){this.form.values[payload.field]=payload.value;this.form.touched[payload.field]=true;this.form.errors=this.validation.step(this.step(),this.values());this.renderer.render();return;}if(type===EVENTS.FIELD_FOCUSED||type===EVENTS.FIELD_BLURRED){this.form.touched[payload.field]=true;this.renderer.render();return;}if(type===EVENTS.BACK){const p=this.navigation.back();if(p)this.go(p,true);return;}if(type===EVENTS.ACTION)return this.run(payload.id);}
    async run(id){if(this.actions.running)return;const step=this.step();const action=[step?.action,...(step?.secondary||[])].find(a=>a?.id===id);if(!action)return;const values=this.values();this.state={...this.state,status:STATES.VALIDATING,error:null};this.form.errors=this.validation.step(step,values);this.form.touchAll(step.fields||[]);this.renderer.render();if(Object.keys(this.form.errors).length){this.state={...this.state,status:STATES.FAILURE,error:translate('authRequired','Please correct the highlighted fields.')};this.renderer.render();return;}this.state={...this.state,status:STATES.SUBMITTING};const promise=this.actions.execute(action,()=>this.api(action,values));this.renderer.render();try{const result=await promise;this.state={...this.state,status:STATES.SUCCESS,error:null};await this.transition(action,result);}catch(err){this.state={...this.state,status:STATES.FAILURE,error:/Mongo|Mongoose|CastError|ValidationError|ECONN|ETIMEDOUT|ENOTFOUND/i.test(String(err?.message||''))?'Authentication request failed.':String(err?.message||'Authentication request failed.')};this.renderer.render();}finally{if(this.state.status!==STATES.FAILURE)this.state={...this.state,status:STATES.IDLE};this.renderer.render();}}
    api(a,v){switch(a.api){case'login':return this.service.login(v);case'register':return this.service.register(v);case'verify':return this.service.verify(v);case'resend':return this.service.resend({email:this.state.verificationEmail});case'forgot':return this.service.forgot(v);case'reset':return this.service.reset(v);default:return Promise.resolve({status:'success',data:{}});}}
    async transition(action,result){const data=result?.data||{};if(action.api==='register'&&data.verificationRequired){this.state.verificationEmail=this.values().email;const target=document.getElementById('miimiid-verification-email');if(target)target.textContent=data.maskedEmail||this.state.verificationEmail;this.go('verification');return;}if(action.api==='verify'||action.api==='login'){if(data.user)this.session.authenticate(data.user);const ok=await (window.initializeMiimiidDashboard?.()||Promise.resolve(true));if(ok!==false)window.hideMiimiidAuthView?.();return;}if(action.api==='reset'){history.replaceState({},document.title,location.pathname);this.setMode('login');return;}if(action.next)this.go(action.next);}
    async restore(){this.state.status=STATES.RECOVERING;this.renderer.render();const user=await this.session.restore();if(user){window.currentUser=user;window.MIIMIID_CURRENT_USER=user;await (window.initializeMiimiidDashboard?.()||Promise.resolve());window.hideMiimiidAuthView?.();}else this.setMode(new URLSearchParams(location.search).get('resetToken')?'reset':'login');}
  }

  const engine=new AuthEngine();
  window.MIIMIID_AUTH_ENGINE=Object.freeze({STATES,SESSION,EVENTS,FLOW,controller:engine,engine});

  function fieldFor(id){return allFields().find(f=>f.element===id)||null;}
  function actionFor(id){for(const flow of Object.values(FLOW))for(const step of Object.values(flow.steps)){if(step.action?.element===id)return step.action;for(const a of step.secondary||[])if(a.element===id)return a;}return null;}
  function prepareLegacyWidgets(){try{window.initializeMiimiidPasswordToggles?.();window.initializeMiimiidGenderSelector?.();window.initializeMiimiidDobWheelPicker?.();window.initializeMiimiidBirthdayWheelModal?.();}catch(error){console.warn('[MIIMIID AUTH ENGINE] legacy visual widget init skipped',error);}}
  function bind(){
    prepareLegacyWidgets();
    document.addEventListener('input',e=>{const f=fieldFor(e.target?.id);if(f)engine.dispatch(EVENTS.FIELD_CHANGED,{field:f.id,value:e.target.value});},true);
    document.addEventListener('change',e=>{const f=fieldFor(e.target?.id);if(f)engine.dispatch(EVENTS.FIELD_CHANGED,{field:f.id,value:e.target.value});},true);
    document.addEventListener('focusin',e=>{const f=fieldFor(e.target?.id);if(f)engine.dispatch(EVENTS.FIELD_FOCUSED,{field:f.id});},true);
    document.addEventListener('click',e=>{const b=e.target?.closest?.('button');if(!b)return;const mode=MODE_BUTTONS[b.id];if(mode){e.preventDefault();e.stopImmediatePropagation();engine.dispatch(EVENTS.MODE,{mode});return;}const a=actionFor(b.id);if(a){e.preventDefault();e.stopImmediatePropagation();engine.dispatch(EVENTS.ACTION,{id:a.id});return;}const back=b.getAttribute('data-register-back');if(back){e.preventDefault();e.stopImmediatePropagation();const step=REGISTER_STEPS[Number(back)-1];if(step){engine.go(step,true);}}},true);
    document.addEventListener('submit',e=>{const mode=Object.entries(FORMS).find(([,id])=>id===e.target?.id)?.[0];if(!mode)return;e.preventDefault();e.stopImmediatePropagation();if(engine.state.mode!==mode)engine.setMode(mode);engine.run(engine.step()?.action?.id);},true);
    engine.setMode(new URLSearchParams(location.search).get('resetToken')?'reset':'login');
    engine.restore();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})(window,document);
