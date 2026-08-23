/* Miimiid Authentication Engine v2
 * Configuration -> Controller -> Form State -> Validation -> Action -> Auth Service -> State -> Renderer
 */
(function (window, document) {
  "use strict";

  const STATES = Object.freeze({ IDLE:"idle", VALIDATING:"validating", SUBMITTING:"submitting", SUCCESS:"success", FAILURE:"failure", RECOVERING:"recovering" });
  const SESSION_STATES = Object.freeze({ UNAUTHENTICATED:"unauthenticated", AUTHENTICATING:"authenticating", AUTHENTICATED:"authenticated", REFRESHING:"refreshing", EXPIRED:"expired" });
  const FIELD_STATES = Object.freeze({ UNTOUCHED:"untouched", FOCUSED:"focused", FILLED:"filled", VALIDATING:"validating", VALID:"valid", INVALID:"invalid", DISABLED:"disabled" });
  const EVENTS = Object.freeze({ FIELD_CHANGED:"FIELD_CHANGED", FIELD_FOCUSED:"FIELD_FOCUSED", FIELD_BLURRED:"FIELD_BLURRED", CONTINUE_PRESSED:"CONTINUE_PRESSED", BACK_PRESSED:"BACK_PRESSED", SUBMIT_STARTED:"SUBMIT_STARTED", SUBMIT_SUCCEEDED:"SUBMIT_SUCCEEDED", SUBMIT_FAILED:"SUBMIT_FAILED", RESEND_VERIFICATION:"RESEND_VERIFICATION", SESSION_EXPIRED:"SESSION_EXPIRED", MODE_CHANGED:"MODE_CHANGED" });

  const FLOW = Object.freeze({
    login:{ mode:"login", initialStep:"login", steps:{ login:{id:"login",type:"form",titleKey:"authWelcome",fields:[{id:"email",element:"miimiid-login-identifier",type:"email",required:true,rules:["required","email"]},{id:"password",element:"miimiid-login-password",type:"password",required:true,rules:["required","password"]}],primaryAction:{id:"login",labelKey:"authSignIn",apiAction:"login",nextStep:"authenticated"}}}},
    register:{ mode:"register", initialStep:"welcome", steps:{
      welcome:{id:"welcome",type:"confirmation",elementStep:1,titleKey:"authWelcome",primaryAction:{id:"start",labelKey:"authGetStarted",nextStep:"name"}},
      name:{id:"name",type:"text",elementStep:2,fields:[{id:"firstName",element:"miimiid-register-first-name",type:"text",required:true,rules:["required"]},{id:"lastName",element:"miimiid-register-last-name",type:"text",required:true,rules:["required"]}],primaryAction:{id:"name-next",labelKey:"authContinue",nextStep:"email"}},
      email:{id:"email",type:"email",elementStep:3,fields:[{id:"email",element:"miimiid-register-email",type:"email",required:true,rules:["required","email"]}],primaryAction:{id:"email-next",labelKey:"authContinue",nextStep:"personal"}},
      personal:{id:"personal",type:"birthday",elementStep:4,fields:[{id:"gender",element:"miimiid-register-gender",type:"text",required:true,rules:["required"]},{id:"dateOfBirth",element:"miimiid-register-dob",type:"birthday",required:true,rules:["required","birthday"]}],primaryAction:{id:"personal-next",labelKey:"authContinue",nextStep:"password"}},
      password:{id:"password",type:"password",elementStep:5,fields:[{id:"password",element:"miimiid-register-password",type:"password",required:true,rules:["required","password"]},{id:"confirmPassword",element:"miimiid-register-confirm",type:"confirmation",required:true,rules:["required","confirmation"]}],primaryAction:{id:"register",labelKey:"authContinue",apiAction:"register",nextStep:"verification"}},
      verification:{id:"verification",type:"verification",elementStep:6,fields:[{id:"code",element:"miimiid-register-verification-code",type:"verification",required:true,rules:["required","verification"]}],primaryAction:{id:"verify",labelKey:"authVerifyAccount",apiAction:"verify",nextStep:"authenticated"},secondaryActions:[{id:"resend",labelKey:"authResendCode",event:EVENTS.RESEND_VERIFICATION}]}
    }},
    forgot:{mode:"forgot",initialStep:"forgot",steps:{forgot:{id:"forgot",type:"recovery",fields:[{id:"email",element:"miimiid-forgot-identifier",type:"email",required:true,rules:["required","email"]}],primaryAction:{id:"forgot",labelKey:"authSendResetInstructions",apiAction:"forgotPassword",nextStep:"forgot"}}}},
    reset:{mode:"reset",initialStep:"reset",steps:{reset:{id:"reset",type:"password",fields:[{id:"password",element:"miimiid-reset-password",type:"password",required:true,rules:["required","password"]},{id:"confirmPassword",element:"miimiid-reset-confirm",type:"confirmation",required:true,rules:["required","confirmation"]}],primaryAction:{id:"reset",labelKey:"authResetPasswordButton",apiAction:"resetPassword",nextStep:"login"}}}}
  });

  const STEP_ALIASES = Object.freeze({welcome:1,name:2,email:3,personal:4,password:5,verification:6});

  function clone(v){ return JSON.parse(JSON.stringify(v)); }
  function email(v){ return String(v||"").trim().toLowerCase(); }

  class ErrorNormalizer {
    normalize(error, fallback, meta){
      const source = meta && meta.source || "client";
      const raw = error && typeof error.message === "string" ? error.message.trim() : "";
      const code = error && error.code ? String(error.code) : "AUTH_ERROR";
      const field = error && error.field ? String(error.field) : null;
      const retryable = error && typeof error.retryable === "boolean" ? error.retryable : source === "network" || /^HTTP_5/.test(code);
      const safe = raw && !/^auth[A-Z]/.test(raw) && !/^(Error:|Mongo|Mongoose|CastError|ValidationError|ECONN|ETIMEDOUT|ENOTFOUND)/i.test(raw);
      return { type:source === "validation" ? "validation" : source === "network" ? "network" : source === "server" ? "server" : "authentication", code, field, message:safe ? raw : (fallback || "Authentication request failed."), retryable, source };
    }
  }

  class ValidationEngine {
    constructor(){ this.messages={required:"authRequired",email:"authEnterValidEmail",password:"authPasswordMinLength",birthday:"authBirthdayInvalid",verification:"authVerificationCodeRequired",confirmation:"authPasswordMismatch"}; }
    validateRule(rule,value,values){
      if(rule==="required") return String(value||"").trim() ? null : this.messages.required;
      if(rule==="email") return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email(value)) ? null : this.messages.email;
      if(rule==="password") return String(value||"").length>=8 ? null : this.messages.password;
      if(rule==="verification") return /^\d{6}$/.test(String(value||"").trim()) ? null : this.messages.verification;
      if(rule==="birthday"){
        const v=String(value||"");
        if(!/^\d{4}-\d{2}-\d{2}$/.test(v)) return this.messages.birthday;
        const d=new Date(v+"T00:00:00"); const now=new Date();
        if(Number.isNaN(d.getTime()) || d.toISOString().slice(0,10)!==v) return this.messages.birthday;
        const max=new Date(now.getFullYear()-18,now.getMonth(),now.getDate());
        return d<=max ? null : this.messages.birthday;
      }
      if(rule==="confirmation") return String(value||"")===String(values.password||"") ? null : this.messages.confirmation;
      return null;
    }
    validateField(field,value,values){
      for(const rule of field.rules||[]){ const key=this.validateRule(rule,value,values); if(key) return {code:key,field:field.id}; }
      return null;
    }
    validateStep(step,values){
      const errors={};
      for(const field of step.fields||[]){ const e=this.validateField(field,values[field.id],values); if(e) errors[field.id]=e; }
      return errors;
    }
  }

  class FormEngine {
    constructor(){ this.values={}; this.touched={}; this.dirty={}; this.errors={}; this.fields={}; }
    configure(fields){
      this.fields={}; fields.forEach(f=>{this.fields[f.id]=f;if(!(f.id in this.values))this.values[f.id]="";});
    }
    sync(){ Object.values(this.fields).forEach(f=>{const el=document.getElementById(f.element);if(el && el.type!=="password")this.values[f.id]=el.value;else if(el)this.values[f.id]=el.value;}); }
    set(id,value){ this.values[id]=value;this.dirty[id]=true; }
    touch(id){ this.touched[id]=true; }
    fieldState(id){ if(!this.touched[id])return FIELD_STATES.UNTOUCHED; if(this.errors[id])return FIELD_STATES.INVALID; if(this.values[id])return FIELD_STATES.VALID; return FIELD_STATES.FILLED; }
    resetErrors(){this.errors={};}
    canSubmit(){return Object.keys(this.errors).length===0;}
  }

  class AuthService {
    async request(path,payload,method="POST"){
      let response;
      try{response=await fetch(path,{method,credentials:"same-origin",headers:{Accept:"application/json",...(payload!==undefined?{"Content-Type":"application/json"}:{})},body:payload===undefined?undefined:JSON.stringify(payload)});}catch(e){throw {code:"NETWORK_ERROR",message:"Unable to connect to the authentication service.",source:"network",retryable:true};}
      let result=null;try{result=await response.json();}catch(e){throw {code:"INVALID_RESPONSE",message:"The authentication service returned an invalid response.",source:"server"};}
      if(!response.ok || !result || result.status!=="success") throw {code:result&&result.code||`HTTP_${response.status}`,message:result&&result.message||"Authentication request failed.",source:response.status>=500?"server":"authentication",retryable:response.status>=500};
      return result;
    }
    login(v){return this.request("/api/auth/login",{identifier:email(v.email),password:v.password});}
    register(v){return this.request("/api/auth/register",{firstName:String(v.firstName||"").trim(),lastName:String(v.lastName||"").trim(),email:email(v.email),gender:String(v.gender||"").trim(),dateOfBirth:v.dateOfBirth,password:v.password});}
    verify(v){return this.request("/api/auth/verify-account",{email:email(v.email),code:String(v.code||"").trim()});}
    resendVerification(v){return this.request("/api/auth/resend-verification",{email:email(v.email)});}
    forgotPassword(v){return this.request("/api/auth/forgot-password",{email:email(v.email)});}
    resetPassword(v){return this.request("/api/auth/reset-password",{token:v.token,password:v.password});}
    refreshSession(){return this.request("/api/auth/me",undefined,"GET");}
    logout(){return this.request("/api/auth/logout",{});}
  }

  class SessionManager {
    constructor(service){this.service=service;this.status=SESSION_STATES.UNAUTHENTICATED;this.user=null;}
    async restore(){this.status=SESSION_STATES.REFRESHING;try{const r=await this.service.refreshSession();this.user=r.data.user;this.status=SESSION_STATES.AUTHENTICATED;return this.user;}catch(e){this.user=null;this.status=SESSION_STATES.UNAUTHENTICATED;return null;}}
    setAuthenticated(user){this.user=user||null;this.status=user?SESSION_STATES.AUTHENTICATED:SESSION_STATES.UNAUTHENTICATED;if(user){window.currentUser=user;window.MIIMIID_CURRENT_USER=user;}}
    async logout(){await this.service.logout();this.user=null;this.status=SESSION_STATES.UNAUTHENTICATED;window.currentUser=null;window.MIIMIID_CURRENT_USER=null;}
  }

  class NavigationController {
    constructor(){this.currentStep=null;this.history=[];this.transition="idle";}
    enter(step,replace=false){if(!replace && this.currentStep && this.currentStep!==step)this.history.push(this.currentStep);this.currentStep=step;this.transition="idle";}
    back(){const previous=this.history.pop();if(previous){this.currentStep=previous;return previous;}return null;}
  }

  class PrimaryAction {
    constructor(element){this.el=element;this.state=STATES.IDLE;this.running=false;this.original=element?element.innerHTML:"";this.render();}
    render(){if(!this.el)return;this.el.classList.add("miimiid-async-button");if(!this.el.querySelector(".miimiid-engine-spinner")){this.el.innerHTML=`<span class="miimiid-engine-content">${this.original}</span><span class="miimiid-engine-spinner" aria-hidden="true"></span>`;}this.el.dataset.authActionState=this.state;this.el.toggleAttribute("disabled",this.running);this.el.setAttribute("aria-busy",this.running?"true":"false");}
    async run(operation){if(this.running)return undefined;this.running=true;this.state=STATES.SUBMITTING;this.render();try{const result=await operation();this.state=STATES.SUCCESS;return result;}catch(e){this.state=STATES.FAILURE;throw e;}finally{this.running=false;this.state=STATES.IDLE;this.render();}}
  }

  class UIFieldRenderer {
    renderField(field,form){const el=document.getElementById(field.element);if(!el)return;el.disabled=false;el.dataset.authFieldState=form.fieldState(field.id);el.setAttribute("aria-invalid",form.errors[field.id]?"true":"false");const parent=el.closest(".miimiid-auth-field");if(parent){let error=parent.querySelector("[data-auth-field-error]");if(!error){error=document.createElement("div");error.dataset.authFieldError="";error.className="miimiid-auth-field-error";parent.appendChild(error);}error.textContent=form.errors[field.id]?translate(form.errors[field.id].code,field.id):"";error.hidden=!form.errors[field.id];}}
  }
  class AuthShellRenderer {
    render(engine){const mode=engine.state.mode;const config=FLOW[mode];if(!config)return;const step=config.steps[engine.state.step];if(!step)return;document.querySelectorAll("#miimiid-register-form [data-register-step]").forEach(s=>{const n=Number(s.dataset.registerStep);const wanted=step.elementStep; if(wanted)s.classList.toggle("hidden",n!==wanted);});const title=document.getElementById("miimiid-auth-title"),subtitle=document.getElementById("miimiid-auth-subtitle");if(mode!=="register"){if(title){title.textContent=translate(step.titleKey||"authWelcome");title.classList.remove("hidden");}if(subtitle){subtitle.classList.remove("hidden");}}else{if(title)title.classList.add("hidden");if(subtitle)subtitle.classList.add("hidden");}if(engine.form){(step.fields||[]).forEach(f=>this.fieldRenderer.renderField(f,engine.form));}engine.renderPrimaryAction(step);}
    constructor(){this.fieldRenderer=new UIFieldRenderer();}
  }

  function translate(key,fallback){try{if(typeof window.miimiidDashboardTranslate==="function"){const v=window.miimiidDashboardTranslate(key);if(v&&v!==key)return v;}if(typeof window.miimiidTranslate==="function"){const v=window.miimiidTranslate(key,typeof window.getSavedLanguage==="function"?window.getSavedLanguage():"en");if(v&&v!==key)return v;}}catch(e){}return fallback||key;}

  class AuthController {
    constructor(){this.validation=new ValidationEngine();this.errors=new ErrorNormalizer();this.service=new AuthService();this.session=new SessionManager(this.service);this.nav=new NavigationController();this.form=new FormEngine();this.listeners=new Set();this.state={mode:"login",step:"login",status:STATES.IDLE,session:SESSION_STATES.UNAUTHENTICATED,action:null,error:null,verificationEmail:"",verificationExpiresAt:0};this.shell=new AuthShellRenderer();this.actions=new Map();}
    emit(){const snapshot={...clone(this.state),form:{values:clone(this.form.values),touched:clone(this.form.touched),dirty:clone(this.form.dirty),errors:clone(this.form.errors)}};this.listeners.forEach(fn=>fn(snapshot));this.shell.render(this);}
    subscribe(fn){if(typeof fn!=="function")return()=>{};this.listeners.add(fn);fn({state:clone(this.state)});return()=>this.listeners.delete(fn);}
    config(){return FLOW[this.state.mode];}
    stepConfig(){return this.config().steps[this.state.step];}
    setMode(mode){if(!FLOW[mode])return;this.state.mode=mode;this.state.step=FLOW[mode].initialStep;this.nav=new NavigationController();this.form=new FormEngine();this.form.configure(this.stepConfig().fields||[]);this.state.error=null;this.state.status=STATES.IDLE;this.emit();}
    enter(step){const config=this.config();if(!config.steps[step])return;this.nav.enter(step);this.state.step=step;this.form=new FormEngine();this.form.configure(config.steps[step].fields||[]);this.state.error=null;this.state.status=STATES.IDLE;this.emit();}
    dispatch(type,payload={}){switch(type){case EVENTS.FIELD_CHANGED:this.form.set(payload.field,payload.value);this.form.touch(payload.field);this.revalidate();break;case EVENTS.FIELD_FOCUSED:this.form.touch(payload.field);break;case EVENTS.FIELD_BLURRED:this.form.touch(payload.field);this.revalidate();break;case EVENTS.BACK_PRESSED:{const p=this.nav.back();if(p)this.enter(p);break;}case EVENTS.RESEND_VERIFICATION:this.runAction("resend",payload);break;case EVENTS.CONTINUE_PRESSED:this.runAction(payload.actionId||this.stepConfig().primaryAction.id);break;}this.emit();}
    revalidate(){const step=this.stepConfig();this.form.sync();this.form.errors=this.validation.validateStep(step,this.form.values);}
    valuesForApi(){const v={...this.form.values};if(this.state.mode==="register"){const persisted={};["firstName","lastName","email","gender","dateOfBirth","password","confirmPassword"].forEach(k=>{const el=document.getElementById({firstName:"miimiid-register-first-name",lastName:"miimiid-register-last-name",email:"miimiid-register-email",gender:"miimiid-register-gender",dateOfBirth:"miimiid-register-dob",password:"miimiid-register-password",confirmPassword:"miimiid-register-confirm"}[k]);if(el)persisted[k]=el.value;});Object.assign(v,persisted);}
      if(this.state.step==="verification")v.email=this.state.verificationEmail;return v;}
    actionConfig(id){const step=this.stepConfig();if(step.primaryAction.id===id)return step.primaryAction;return (step.secondaryActions||[]).find(a=>a.id===id)||null;}
    getActionElement(action){const ids={login:"miimiid-login-submit",start:"miimiid-register-get-started","name-next":"miimiid-register-name-next","email-next":"miimiid-register-contact-next","personal-next":"miimiid-register-details-next",register:"miimiid-register-submit",verify:"miimiid-verify-account-submit",resend:"miimiid-resend-verification",forgot:"miimiid-forgot-submit",reset:"miimiid-reset-submit"};return document.getElementById(ids[action.id||action]);}
    renderPrimaryAction(step){const action=step&&step.primaryAction;if(!action)return;const el=this.getActionElement(action);if(!el)return;const current=this.actions.get(action.id)||new PrimaryAction(el);this.actions.set(action.id,current);const label=translate(action.labelKey);const content=el.querySelector(".miimiid-engine-content");if(content && !current.running)content.textContent=label;else if(!content && !current.running)el.textContent=label;el.disabled=current.running;el.dataset.authActionState=current.state;}
    async runAction(id){if(this.state.status===STATES.SUBMITTING)return;const action=this.actionConfig(id);if(!action)return;const button=this.getActionElement(action);const primary=this.actions.get(action.id)||new PrimaryAction(button);this.actions.set(action.id,primary);this.form.sync();this.state.action=id;this.state.status=STATES.VALIDATING;this.form.errors=this.validation.validateStep(this.stepConfig(),this.valuesForApi());this.form.configure(this.stepConfig().fields||[]);this.emit();if(Object.keys(this.form.errors).length){this.form.touched=Object.fromEntries((this.stepConfig().fields||[]).map(f=>[f.id,true]));this.state.status=STATES.FAILURE;this.state.error=this.errors.normalize({code:"VALIDATION_FAILED",message:"Please correct the highlighted fields.",source:"validation"},"Please correct the highlighted fields.",{source:"validation"});this.emit();return;}
      if(!action.apiAction){this.state.status=STATES.SUBMITTING;this.emit();this.enter(action.nextStep);return;}
      try{const result=await primary.run(()=>this.executeApi(action.apiAction));this.state.status=STATES.SUCCESS;this.state.error=null;this.transitionAfter(action,result);}
      catch(error){this.state.status=STATES.FAILURE;this.state.error=this.errors.normalize(error,"Authentication request failed.",{source:error&&error.source||"authentication"});this.emit();}
      finally{this.state.action=null;this.state.status=this.state.error?STATES.FAILURE:STATES.IDLE;this.emit();}
    }
    async executeApi(name){const v=this.valuesForApi();if(name==="login")return this.service.login(v);if(name==="register")return this.service.register(v);if(name==="verify")return this.service.verify(v);if(name==="resendVerification")return this.service.resendVerification({email:this.state.verificationEmail});if(name==="forgotPassword")return this.service.forgotPassword(v);if(name==="resetPassword")return this.service.resetPassword({token:new URLSearchParams(location.search).get("resetToken"),password:v.password});throw {code:"UNKNOWN_ACTION",message:"Authentication action is unavailable."};}
    transitionAfter(action,result){if(action.apiAction==="register" && result.data&&result.data.verificationRequired){this.state.verificationEmail=this.form.values.email;this.state.verificationExpiresAt=Date.now()+Number(result.data.expiresInSeconds||0)*1000;this.enter("verification");return;}if(action.apiAction==="verify" && result.data&&result.data.user){this.session.setAuthenticated(result.data.user);this.state.session=SESSION_STATES.AUTHENTICATED;this.enter("authenticated");window.initializeMiimiidDashboard&&window.initializeMiimiidDashboard();return;}if(action.apiAction==="login"&&result.data&&result.data.user){this.session.setAuthenticated(result.data.user);this.state.session=SESSION_STATES.AUTHENTICATED;window.initializeMiimiidDashboard&&window.initializeMiimiidDashboard();return;}if(action.apiAction==="forgotPassword")return;if(action.apiAction==="resetPassword"){history.replaceState({},document.title,location.pathname);this.setMode("login");return;}if(action.nextStep && action.nextStep!=="authenticated")this.enter(action.nextStep);}
  }

  const controller=new AuthController();
  window.MIIMIID_AUTH_ENGINE_V2=Object.freeze({STATES,SESSION_STATES,FIELD_STATES,EVENTS,FLOW,controller});

  function bind(){
    controller.emit();
    document.addEventListener("input",e=>{const el=e.target;if(!el||!el.id)return;for(const step of Object.values(FLOW).flatMap(f=>Object.values(f.steps))){const field=(step.fields||[]).find(f=>f.element===el.id);if(field){controller.dispatch(EVENTS.FIELD_CHANGED,{field:field.id,value:el.value});break;}}},true);
    document.addEventListener("focusin",e=>{const el=e.target;if(!el||!el.id)return;const f=findField(el.id);if(f)controller.dispatch(EVENTS.FIELD_FOCUSED,{field:f.id});},true);
    document.addEventListener("focusout",e=>{const el=e.target;if(!el||!el.id)return;const f=findField(el.id);if(f)controller.dispatch(EVENTS.FIELD_BLURRED,{field:f.id});},true);
    document.addEventListener("click",e=>{const b=e.target.closest("button");if(!b)return;const map={"miimiid-show-register":()=>controller.setMode("register"),"miimiid-show-forgot":()=>controller.setMode("forgot"),"miimiid-show-login-from-register":()=>controller.setMode("login"),"miimiid-show-login-from-forgot":()=>controller.setMode("login"),"miimiid-show-login-from-reset":()=>controller.setMode("login")};if(map[b.id]){e.stopImmediatePropagation();e.preventDefault();map[b.id]();return;}const action=findActionByElement(b.id);if(action){e.stopImmediatePropagation();e.preventDefault();controller.dispatch(action.event||EVENTS.CONTINUE_PRESSED,{actionId:action.id});}},true);
    document.addEventListener("submit",e=>{const form=e.target;if(!form||!form.id)return;const mode=form.id==="miimiid-login-form"?"login":form.id==="miimiid-register-form"?"register":form.id==="miimiid-forgot-form"?"forgot":form.id==="miimiid-reset-form"?"reset":null;if(mode){e.stopImmediatePropagation();e.preventDefault();const action={login:"login",register:"register",forgot:"forgot",reset:"reset"}[mode];controller.setMode(mode);controller.dispatch(EVENTS.CONTINUE_PRESSED,{actionId:action});}},true);
    document.addEventListener("click",e=>{const b=e.target.closest("[data-register-back]");if(b){e.stopImmediatePropagation();e.preventDefault();const target=Number(b.dataset.registerBack);const step=Object.entries(STEP_ALIASES).find(([,n])=>n===target);if(step)controller.enter(step[0]);}},true);
  }
  function findField(id){for(const flow of Object.values(FLOW))for(const step of Object.values(flow.steps))for(const f of step.fields||[])if(f.element===id)return f;return null;}
  function findActionByElement(id){for(const flow of Object.values(FLOW))for(const step of Object.values(flow.steps)){const a=step.primaryAction;if(a&&id===({login:"miimiid-login-submit",start:"miimiid-register-get-started","name-next":"miimiid-register-name-next","email-next":"miimiid-register-contact-next","personal-next":"miimiid-register-details-next",register:"miimiid-register-submit",verify:"miimiid-verify-account-submit",resend:"miimiid-resend-verification",forgot:"miimiid-forgot-submit",reset:"miimiid-reset-submit"}[a.id]))return a;for(const s of step.secondaryActions||[])if(id==="miimiid-resend-verification"&&s.id===a.id)return s;}return null;}
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",bind,{once:true});else bind();
})(window,document);
