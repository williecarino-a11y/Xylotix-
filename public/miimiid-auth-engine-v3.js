/* Miimiid Authentication Engine v3
 * Single runtime owner for authentication events, state, validation, actions,
 * navigation, API coordination, session state and dynamic auth rendering.
 */
(function (window, document) {
  "use strict";

  const STATES = Object.freeze({ IDLE:"idle", VALIDATING:"validating", SUBMITTING:"submitting", SUCCESS:"success", FAILURE:"failure", RECOVERING:"recovering" });
  const SESSION_STATES = Object.freeze({ UNAUTHENTICATED:"unauthenticated", AUTHENTICATING:"authenticating", AUTHENTICATED:"authenticated", REFRESHING:"refreshing", EXPIRED:"expired" });
  const FIELD_STATES = Object.freeze({ UNTOUCHED:"untouched", FOCUSED:"focused", FILLED:"filled", VALIDATING:"validating", VALID:"valid", INVALID:"invalid", DISABLED:"disabled" });
  const EVENTS = Object.freeze({ FIELD_CHANGED:"FIELD_CHANGED", FIELD_FOCUSED:"FIELD_FOCUSED", FIELD_BLURRED:"FIELD_BLURRED", CONTINUE_PRESSED:"CONTINUE_PRESSED", BACK_PRESSED:"BACK_PRESSED", SUBMIT_STARTED:"SUBMIT_STARTED", SUBMIT_SUCCEEDED:"SUBMIT_SUCCEEDED", SUBMIT_FAILED:"SUBMIT_FAILED", RESEND_VERIFICATION:"RESEND_VERIFICATION", SESSION_EXPIRED:"SESSION_EXPIRED", MODE_CHANGED:"MODE_CHANGED" });

  const FLOW = {
    login:{mode:"login",initialStep:"login",steps:{login:{id:"login",type:"form",titleKey:"authWelcome",descriptionKey:"authSignInSubtitle",fields:[
      {id:"email",element:"miimiid-login-identifier",type:"email",required:true,rules:["required","email"]},
      {id:"password",element:"miimiid-login-password",type:"password",required:true,rules:["required","password"]}
    ],primaryAction:{id:"login",labelKey:"authSignIn",apiAction:"login",nextStep:"authenticated"}}}},
    register:{mode:"register",initialStep:"welcome",steps:{
      welcome:{id:"welcome",type:"confirmation",elementStep:1,primaryAction:{id:"start",element:"miimiid-register-get-started",labelKey:"authGetStarted",nextStep:"name"}},
      name:{id:"name",type:"text",elementStep:2,fields:[
        {id:"firstName",element:"miimiid-register-first-name",type:"text",required:true,rules:["required"]},
        {id:"lastName",element:"miimiid-register-last-name",type:"text",required:true,rules:["required"]}
      ],primaryAction:{id:"name-next",element:"miimiid-register-name-next",labelKey:"authContinue",nextStep:"email"}},
      email:{id:"email",type:"email",elementStep:3,fields:[
        {id:"email",element:"miimiid-register-email",type:"email",required:true,rules:["required","email"]}
      ],primaryAction:{id:"email-next",element:"miimiid-register-contact-next",labelKey:"authContinue",nextStep:"personal"}},
      personal:{id:"personal",type:"birthday",elementStep:4,fields:[
        {id:"gender",element:"miimiid-register-gender",type:"gender",required:true,rules:["required"]},
        {id:"dateOfBirth",element:"miimiid-register-dob",type:"birthday",required:true,rules:["required","birthday"]}
      ],primaryAction:{id:"personal-next",element:"miimiid-register-details-next",labelKey:"authContinue",nextStep:"password"}},
      password:{id:"password",type:"password",elementStep:5,fields:[
        {id:"password",element:"miimiid-register-password",type:"password",required:true,rules:["required","password"]},
        {id:"confirmPassword",element:"miimiid-register-confirm",type:"confirmation",required:true,rules:["required","confirmation"]}
      ],primaryAction:{id:"register",element:"miimiid-register-submit",labelKey:"authCreateAccountButton",apiAction:"register",nextStep:"verification"}},
      verification:{id:"verification",type:"verification",elementStep:6,fields:[
        {id:"code",element:"miimiid-register-verification-code",type:"verification",required:true,rules:["required","verification"]}
      ],primaryAction:{id:"verify",element:"miimiid-verify-account-submit",labelKey:"authVerifyAccount",apiAction:"verify",nextStep:"authenticated"},secondaryActions:[{id:"resend",element:"miimiid-resend-verification",labelKey:"authResendCode",event:EVENTS.RESEND_VERIFICATION}]}
    }},
    forgot:{mode:"forgot",initialStep:"forgot",steps:{forgot:{id:"forgot",type:"recovery",titleKey:"authForgotPassword",descriptionKey:"authResetSubtitle",fields:[{id:"email",element:"miimiid-forgot-identifier",type:"email",required:true,rules:["required","email"]}],primaryAction:{id:"forgot",element:"miimiid-forgot-submit",labelKey:"authSendResetInstructions",apiAction:"forgotPassword",nextStep:"forgot"}}}},
    reset:{mode:"reset",initialStep:"reset",steps:{reset:{id:"reset",type:"password",titleKey:"authResetPasswordTitle",descriptionKey:"authResetPasswordSubtitle",fields:[{id:"password",element:"miimiid-reset-password",type:"password",required:true,rules:["required","password"]},{id:"confirmPassword",element:"miimiid-reset-confirm",type:"confirmation",required:true,rules:["required","confirmation"]}],primaryAction:{id:"reset",element:"miimiid-reset-submit",labelKey:"authResetPasswordButton",apiAction:"resetPassword",nextStep:"login"}}}}
  };

  const REGISTRATION_STEP_IDS = Object.freeze({1:"welcome",2:"name",3:"email",4:"personal",5:"password",6:"verification"});
  const AUTH_FORMS = Object.freeze({login:"miimiid-login-form",register:"miimiid-register-form",forgot:"miimiid-forgot-form",reset:"miimiid-reset-form"});
  const MODE_BUTTONS = Object.freeze({
    "miimiid-show-register":"register",
    "miimiid-show-forgot":"forgot",
    "miimiid-show-login-from-register":"login",
    "miimiid-show-login-from-forgot":"login",
    "miimiid-show-login-from-reset":"login"
  });

  function clone(value){ return JSON.parse(JSON.stringify(value)); }
  function normalizeEmail(value){ return String(value || "").trim().toLowerCase(); }

  class ErrorNormalizer {
    normalize(error, fallback, sourceOverride){
      const source = sourceOverride || error?.source || "authentication";
      const code = String(error?.code || "AUTH_ERROR");
      const field = error?.field ? String(error.field) : null;
      const raw = typeof error?.message === "string" ? error.message.trim() : "";
      const unsafe = !raw || /^auth[A-Z]/.test(raw) || /Mongo|Mongoose|CastError|ValidationError|ECONN|ETIMEDOUT|ENOTFOUND/i.test(raw);
      return {
        type: source === "validation" ? "validation" : source === "network" ? "network" : source === "server" ? "server" : "authentication",
        code, field,
        message: unsafe ? fallback : raw,
        retryable: typeof error?.retryable === "boolean" ? error.retryable : source === "network" || /^HTTP_5/.test(code),
        source
      };
    }
  }

  class ValidationEngine {
    constructor(){
      this.messages={
        required:"authRequired", email:"authEnterValidEmail", password:"authPasswordMinLength",
        birthday:"authBirthdayInvalid", verification:"authVerificationCodeRequired", confirmation:"authPasswordMismatch"
      };
    }
    rule(rule,value,values){
      if(rule==="required") return String(value ?? "").trim() ? null : this.messages.required;
      if(rule==="email") return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizeEmail(value)) ? null : this.messages.email;
      if(rule==="password") return String(value || "").length >= 8 ? null : this.messages.password;
      if(rule==="verification") return /^\d{6}$/.test(String(value || "").trim()) ? null : this.messages.verification;
      if(rule==="birthday"){
        const v=String(value || "");
        if(!/^\d{4}-\d{2}-\d{2}$/.test(v)) return this.messages.birthday;
        const d=new Date(v+"T00:00:00");
        if(Number.isNaN(d.getTime()) || d.toISOString().slice(0,10)!==v) return this.messages.birthday;
        const today=new Date();
        const minimum=new Date(today.getFullYear()-18,today.getMonth(),today.getDate());
        return d<=minimum ? null : this.messages.birthday;
      }
      if(rule==="confirmation") return String(value || "")===String(values.password || "") ? null : this.messages.confirmation;
      return null;
    }
    validateField(field,value,values){
      for(const rule of field.rules || []){ const code=this.rule(rule,value,values); if(code)return {code,field:field.id}; }
      return null;
    }
    validateStep(step,values){
      const errors={};
      for(const field of step.fields || []){ const error=this.validateField(field,values[field.id],values); if(error)errors[field.id]=error; }
      return errors;
    }
  }

  class FormEngine {
    constructor(){ this.values={};this.touched={};this.dirty={};this.errors={};this.fields={}; }
    configure(fields, preserve=true){
      const old=this.values;
      this.fields={};
      this.values={};
      (fields || []).forEach(field=>{this.fields[field.id]=field;this.values[field.id]=preserve && old[field.id] !== undefined ? old[field.id] : this.read(field);});
    }
    read(field){const el=document.getElementById(field.element);return el ? String(el.value || "") : "";}
    sync(){Object.values(this.fields).forEach(field=>{const el=document.getElementById(field.element);if(el)this.values[field.id]=el.value;});}
    set(id,value){this.values[id]=value;this.dirty[id]=true;}
    touch(id){this.touched[id]=true;}
    touchAll(){Object.keys(this.fields).forEach(id=>{this.touched[id]=true;});}
    fieldState(id){if(this.fields[id]?.disabled)return FIELD_STATES.DISABLED;if(!this.touched[id])return FIELD_STATES.UNTOUCHED;if(this.errors[id])return FIELD_STATES.INVALID;if(String(this.values[id] || "").trim())return FIELD_STATES.VALID;return FIELD_STATES.FILLED;}
    get canContinue(){return Object.keys(this.errors).length===0;}
  }

  class AuthService {
    async request(endpoint,payload,method="POST"){
      let response;
      try{response=await fetch(endpoint,{method,credentials:"same-origin",headers:{Accept:"application/json",...(payload!==undefined?{"Content-Type":"application/json"}:{})},body:payload===undefined?undefined:JSON.stringify(payload)});}
      catch(error){throw {code:"NETWORK_ERROR",message:"Unable to connect to the authentication service.",source:"network",retryable:true};}
      let result;
      try{result=await response.json();}
      catch(error){throw {code:"INVALID_RESPONSE",message:"The authentication service returned an invalid response.",source:"server"};}
      if(!response.ok || !result || result.status!=="success")throw {code:result?.code || `HTTP_${response.status}`,message:result?.message || "Authentication request failed.",source:response.status>=500?"server":"authentication",retryable:response.status>=500};
      return result;
    }
    register(v){return this.request("/api/auth/register",{firstName:v.firstName,lastName:v.lastName,email:normalizeEmail(v.email),gender:v.gender,dateOfBirth:v.dateOfBirth,password:v.password});}
    login(v){return this.request("/api/auth/login",{identifier:normalizeEmail(v.email),password:v.password});}
    verify(v){return this.request("/api/auth/verify-account",{email:normalizeEmail(v.email),code:String(v.code || "").trim()});}
    resendVerification(v){return this.request("/api/auth/resend-verification",{email:normalizeEmail(v.email)});}
    forgotPassword(v){return this.request("/api/auth/forgot-password",{email:normalizeEmail(v.email)});}
    resetPassword(v){return this.request("/api/auth/reset-password",{token:v.token,password:v.password});}
    refreshSession(){return this.request("/api/auth/me",undefined,"GET");}
    logout(){return this.request("/api/auth/logout",{});}
  }

  class SessionManager {
    constructor(service){this.service=service;this.state=SESSION_STATES.UNAUTHENTICATED;this.user=null;}
    async restore(){this.state=SESSION_STATES.REFRESHING;try{const result=await this.service.refreshSession();this.user=result?.data?.user || null;this.state=this.user?SESSION_STATES.AUTHENTICATED:SESSION_STATES.UNAUTHENTICATED;return this.user;}catch(error){this.user=null;this.state=SESSION_STATES.UNAUTHENTICATED;return null;}}
    authenticate(user){this.user=user || null;this.state=this.user?SESSION_STATES.AUTHENTICATED:SESSION_STATES.UNAUTHENTICATED;if(this.user){window.currentUser=this.user;window.MIIMIID_CURRENT_USER=this.user;}}
    expire(){this.user=null;this.state=SESSION_STATES.EXPIRED;window.currentUser=null;window.MIIMIID_CURRENT_USER=null;}
    async logout(){await this.service.logout();this.expire();this.state=SESSION_STATES.UNAUTHENTICATED;}
  }

  class NavigationController {
    constructor(){this.currentStep=null;this.history=[];this.transition="idle";}
    enter(step,replace=false){if(this.currentStep && this.currentStep!==step && !replace)this.history.push(this.currentStep);this.currentStep=step;this.transition="idle";return step;}
    back(){const previous=this.history.pop();if(previous){this.currentStep=previous;this.transition="back";return previous;}return null;}
  }

  class ActionController {
    constructor(){this.running=false;this.state=STATES.IDLE;this.action=null;this.promise=null;}
    async execute(action,operation){if(this.running)return this.promise;this.running=true;this.action=action;this.state=STATES.SUBMITTING;this.promise=(async()=>{try{const result=await operation();this.state=STATES.SUCCESS;return result;}catch(error){this.state=STATES.FAILURE;throw error;}finally{this.running=false;this.action=null;}})();try{return await this.promise;}finally{this.promise=null;this.state=STATES.IDLE;}}
  }

  class AuthRenderer {
    constructor(controller){this.controller=controller;}
    translate(key,fallback){try{if(typeof window.miimiidDashboardTranslate==="function"){const v=window.miimiidDashboardTranslate(key);if(v&&v!==key)return v;}if(typeof window.miimiidTranslate==="function"){const v=window.miimiidTranslate(key,typeof window.getSavedLanguage==="function"?window.getSavedLanguage():"en");if(v&&v!==key)return v;}}catch(e){}return fallback || key;}
    ensureGenderField(){
      const step=document.querySelector('#miimiid-register-form [data-register-step="4"]');
      if(!step || document.getElementById("miimiid-register-gender"))return;
      const dob=step.querySelector("#miimiid-register-dob")?.closest(".miimiid-auth-field");
      const wrapper=document.createElement("div");wrapper.className="miimiid-auth-field";wrapper.innerHTML=`<label for="miimiid-register-gender">${this.translate("authGender","Gender")}</label><select id="miimiid-register-gender" autocomplete="sex" required><option value="">${this.translate("authSelectGender","Select gender")}</option><option value="male">${this.translate("authMale","Male")}</option><option value="female">${this.translate("authFemale","Female")}</option><option value="other">${this.translate("authOther","Other")}</option></select>`;
      if(dob)step.insertBefore(wrapper,dob);else step.insertBefore(wrapper,step.firstChild);
      const style=document.createElement("style");style.textContent="#miimiid-register-gender{width:100%;min-height:52px;padding:0 16px;border-radius:14px;border:1px solid #475569;background:#0f172a;color:#f8fafc;font-size:1rem;}#miimiid-register-gender:focus{outline:2px solid #38bdf8;outline-offset:1px;}";document.head.appendChild(style);
    }
    normalizeRegistrationDom(){
      this.ensureGenderField();
      const form=document.getElementById("miimiid-register-form");if(!form)return;
      const existingVerification=form.querySelector('[data-register-step="5"]');
      const oldPasswordSection=form.querySelector('[data-register-step="4"]');
      if(existingVerification){existingVerification.dataset.registerStep="6";}
      if(!document.getElementById("miimiid-register-password-step")){
        const passwordSection=document.createElement("section");passwordSection.id="miimiid-register-password-step";passwordSection.className="miimiid-register-step hidden";passwordSection.dataset.registerStep="5";
        const passwordField=document.getElementById("miimiid-register-password")?.closest(".miimiid-auth-field");
        const confirmField=document.getElementById("miimiid-register-confirm")?.closest(".miimiid-auth-field");
        if(passwordField)passwordSection.appendChild(passwordField);if(confirmField)passwordSection.appendChild(confirmField);
        const next=document.createElement("button");next.type="button";next.className="btn";next.id="miimiid-register-submit";next.dataset.miimiidAuthKey="authCreateAccountButton";next.textContent=this.translate("authCreateAccountButton","Create Account");passwordSection.appendChild(next);
        const back=document.createElement("button");back.type="button";back.className="miimiid-auth-link";back.dataset.registerBack="4";back.textContent=this.translate("authBackToPrevious","Back");passwordSection.appendChild(back);
        form.insertBefore(passwordSection,existingVerification || null);
      }
      if(oldPasswordSection){const submit=oldPasswordSection.querySelector("#miimiid-register-submit");if(submit)submit.remove();const back=oldPasswordSection.querySelector('[data-register-back="3"]');if(back)back.remove();}
    }
    showMode(mode){
      Object.entries(AUTH_FORMS).forEach(([name,id])=>{const form=document.getElementById(id);if(form)form.classList.toggle("hidden",name!==mode);});
      const title=document.getElementById("miimiid-auth-title");const subtitle=document.getElementById("miimiid-auth-subtitle");
      const config=FLOW[mode];const step=config?.steps[config.initialStep];
      if(title){title.textContent=this.translate(step?.titleKey || (mode==="register"?"authWelcome":"authWelcome"));title.classList.toggle("hidden",mode==="register");}
      if(subtitle){subtitle.textContent=this.translate(step?.descriptionKey || "authSignInSubtitle");subtitle.classList.toggle("hidden",mode==="register");}
      if(mode==="register")this.showRegistrationStep(this.controller.state.step || "welcome");
      this.renderStatus();
    }
    showRegistrationStep(stepId){
      const form=document.getElementById("miimiid-register-form");if(!form)return;
      form.querySelectorAll("[data-register-step]").forEach(section=>section.classList.toggle("hidden",Number(section.dataset.registerStep)!==Number(FLOW.register.steps[stepId]?.elementStep)));
    }
    renderField(field){
      const el=document.getElementById(field.element);if(!el)return;
      const state=this.controller.form.fieldState(field.id);el.dataset.authFieldState=state;el.setAttribute("aria-invalid",this.controller.form.errors[field.id]?"true":"false");
      const parent=el.closest(".miimiid-auth-field");if(!parent)return;
      let error=parent.querySelector("[data-auth-field-error]");if(!error){error=document.createElement("div");error.dataset.authFieldError="";error.className="miimiid-auth-field-error";parent.appendChild(error);}const validation=this.controller.form.errors[field.id];error.textContent=validation?this.translate(validation.code,"Please check this field."):"";error.hidden=!validation;
    }
    renderAction(action){
      const el=document.getElementById(action.element);if(!el)return;
      if(!el.classList.contains("miimiid-async-button")){const label=el.textContent.trim() || this.translate(action.labelKey);el.innerHTML=`<span class="miimiid-engine-content">${label}</span><span class="miimiid-engine-spinner" aria-hidden="true"></span>`;el.classList.add("miimiid-async-button");}
      const running=this.controller.actions.running && this.controller.actions.action===action.id;el.dataset.authActionState=running?STATES.SUBMITTING:STATES.IDLE;el.disabled=running;el.setAttribute("aria-busy",running?"true":"false");const content=el.querySelector(".miimiid-engine-content");if(content && !running)content.textContent=this.translate(action.labelKey);
    }
    renderStatus(){
      const status=document.getElementById("miimiid-auth-status");if(status){status.textContent=this.controller.state.error?.message || "";status.className="miimiid-auth-status"+(this.controller.state.error?" error-text":"");}
      const feedback=document.getElementById("miimiid-register-feedback");if(feedback){feedback.textContent=this.controller.state.error?.message || "";feedback.className="miimiid-auth-feedback"+(this.controller.state.error?" error":"");}
    }
    render(){
      this.normalizeRegistrationDom();
      const mode=this.controller.state.mode;this.showMode(mode);
      const step=this.controller.stepConfig();if(step){(step.fields||[]).forEach(field=>this.renderField(field));if(step.primaryAction)this.renderAction(step.primaryAction);(step.secondaryActions||[]).forEach(action=>this.renderAction(action));}
      this.renderStatus();
    }
  }

  class AuthController {
    constructor(){this.validation=new ValidationEngine();this.errors=new ErrorNormalizer();this.service=new AuthService();this.session=new SessionManager(this.service);this.navigation=new NavigationController();this.actions=new ActionController();this.form=new FormEngine();this.listeners=new Set();this.state={mode:"login",step:"login",status:STATES.IDLE,session:SESSION_STATES.UNAUTHENTICATED,error:null,action:null,verificationEmail:"",verificationExpiresAt:0};this.renderer=new AuthRenderer(this);}
    config(){return FLOW[this.state.mode];}
    stepConfig(){return this.config()?.steps[this.state.step];}
    emit(){const snapshot={...clone(this.state),form:{values:clone(this.form.values),touched:clone(this.form.touched),dirty:clone(this.form.dirty),errors:clone(this.form.errors),canContinue:this.form.canContinue}};this.listeners.forEach(listener=>{try{listener(snapshot);}catch(error){console.error("Miimiid auth subscriber error",error);}});this.renderer.render();}
    subscribe(listener){if(typeof listener!=="function")return()=>{};this.listeners.add(listener);return()=>this.listeners.delete(listener);}
    setMode(mode){if(!FLOW[mode])return;this.state.mode=mode;this.state.step=FLOW[mode].initialStep;this.state.error=null;this.state.status=STATES.IDLE;this.navigation=new NavigationController();this.form=new FormEngine();this.form.configure(this.stepConfig().fields || [],false);this.emit();}
    enter(step,replace=false){if(!this.config()?.steps[step])return;this.navigation.enter(step,replace);this.state.step=step;this.state.error=null;this.state.status=STATES.IDLE;this.form.configure(this.stepConfig().fields || [],true);this.emit();}
    syncAndValidate(){this.form.sync();this.form.errors=this.validation.validateStep(this.stepConfig(),this.form.values);return this.form.errors;}
    values(){
      this.form.sync();
      const values={...this.form.values};
      if(this.state.mode==="register"){
        const fields=["firstName","lastName","email","gender","dateOfBirth","password","confirmPassword"];
        fields.forEach(id=>{const field=FLOW.register.steps[Object.values(FLOW.register.steps).find(step=>(step.fields||[]).some(f=>f.id===id))?.id || ""]?.fields?.find(f=>f.id===id);if(field){const el=document.getElementById(field.element);if(el)values[id]=el.value;}});
      }
      if(this.state.step==="verification")values.email=this.state.verificationEmail;
      return values;
    }
    async dispatch(type,payload={}){
      if(type===EVENTS.FIELD_CHANGED){this.form.set(payload.field,payload.value);this.form.touch(payload.field);if(payload.field==="password" || payload.field==="confirmPassword")this.revalidateCurrent();this.emit();return;}
      if(type===EVENTS.FIELD_FOCUSED){this.form.touch(payload.field);this.emit();return;}
      if(type===EVENTS.FIELD_BLURRED){this.form.touch(payload.field);this.revalidateCurrent();this.emit();return;}
      if(type===EVENTS.BACK_PRESSED){const previous=this.navigation.back();if(previous)this.enter(previous,true);return;}
      if(type===EVENTS.RESEND_VERIFICATION){await this.runAction("resend");return;}
      if(type===EVENTS.CONTINUE_PRESSED){await this.runAction(payload.actionId || this.stepConfig()?.primaryAction?.id);}
    }
    revalidateCurrent(){this.form.sync();this.form.errors=this.validation.validateStep(this.stepConfig(),this.form.values);}
    actionConfig(id){const step=this.stepConfig();if(step?.primaryAction?.id===id)return step.primaryAction;return (step?.secondaryActions||[]).find(action=>action.id===id);}
    async runAction(id){
      if(this.actions.running)return;
      const action=this.actionConfig(id);if(!action)return;
      this.form.sync();this.state.action=id;this.state.status=STATES.VALIDATING;this.form.errors=this.validation.validateStep(this.stepConfig(),this.values());this.emit();
      if(Object.keys(this.form.errors).length){this.form.touchAll();this.state.status=STATES.FAILURE;this.state.error=this.errors.normalize({code:"VALIDATION_FAILED",message:"Please correct the highlighted fields.",source:"validation"},"Please correct the highlighted fields.","validation");this.emit();return;}
      if(!action.apiAction){this.state.status=STATES.SUBMITTING;this.emit();this.enter(action.nextStep);return;}
      try{
        this.state.status=STATES.SUBMITTING;this.emit();
        const result=await this.actions.execute(id,()=>this.executeApi(action.apiAction));
        this.state.status=STATES.SUCCESS;this.state.error=null;this.transitionAfter(action,result);
      }catch(error){this.state.status=STATES.FAILURE;this.state.error=this.errors.normalize(error,"Authentication request failed.",error?.source || "authentication");this.emit();}
      finally{if(this.state.status!==STATES.FAILURE)this.state.status=STATES.IDLE;this.state.action=null;this.emit();}
    }
    async executeApi(name){const v=this.values();switch(name){case "login":return this.service.login(v);case "register":return this.service.register(v);case "verify":return this.service.verify(v);case "resendVerification":return this.service.resendVerification({email:this.state.verificationEmail});case "forgotPassword":return this.service.forgotPassword(v);case "resetPassword":return this.service.resetPassword({token:new URLSearchParams(window.location.search).get("resetToken"),password:v.password});default:throw {code:"UNKNOWN_ACTION",message:"Authentication action is unavailable."};}}
    transitionAfter(action,result){
      const data=result?.data || {};
      if(action.apiAction==="register" && data.verificationRequired){this.state.verificationEmail=this.values().email;this.state.verificationExpiresAt=Date.now()+Number(data.expiresInSeconds||0)*1000;const target=document.getElementById("miimiid-verification-email");if(target)target.textContent=data.maskedEmail || this.state.verificationEmail;this.enter("verification");const code=document.getElementById("miimiid-register-verification-code");if(code){code.value="";setTimeout(()=>code.focus(),0);}return;}
      if(action.apiAction==="verify"){if(data.user)this.session.authenticate(data.user);this.state.session=this.session.state;this.enter("authenticated",true);window.initializeMiimiidDashboard?.();window.hideMiimiidAuthView?.();return;}
      if(action.apiAction==="login"){if(data.user)this.session.authenticate(data.user);this.state.session=this.session.state;window.initializeMiimiidDashboard?.();window.hideMiimiidAuthView?.();return;}
      if(action.apiAction==="forgotPassword")return;
      if(action.apiAction==="resetPassword"){window.history.replaceState({},document.title,window.location.pathname);this.setMode("login");return;}
      if(action.nextStep && action.nextStep!=="authenticated")this.enter(action.nextStep);
    }
    async restoreSession(){this.state.session=SESSION_STATES.REFRESHING;this.state.status=STATES.RECOVERING;this.emit();const user=await this.session.restore();this.state.session=this.session.state;this.state.status=STATES.IDLE;if(user){window.currentUser=user;window.MIIMIID_CURRENT_USER=user;window.hideMiimiidAuthView?.();window.initializeMiimiidDashboard?.();}else{window.showMiimiidAuthView?.();this.setMode("login");}this.emit();return user;}
  }

  const controller=new AuthController();
  window.MIIMIID_AUTH_ENGINE=Object.freeze({STATES,SESSION_STATES,FIELD_STATES,EVENTS,FLOW,controller});

  function fieldByElement(elementId){for(const flow of Object.values(FLOW))for(const step of Object.values(flow.steps))for(const field of step.fields || [])if(field.element===elementId)return field;return null;}
  function actionByElement(elementId){for(const flow of Object.values(FLOW))for(const step of Object.values(flow.steps)){if(step.primaryAction?.element===elementId)return step.primaryAction;for(const action of step.secondaryActions || [])if(action.element===elementId)return action;}return null;}

  function bindRuntime(){
    controller.renderer.normalizeRegistrationDom();
    controller.emit();

    document.addEventListener("input",event=>{const field=fieldByElement(event.target?.id);if(field)controller.dispatch(EVENTS.FIELD_CHANGED,{field:field.id,value:event.target.value});},true);
    document.addEventListener("change",event=>{const field=fieldByElement(event.target?.id);if(field)controller.dispatch(EVENTS.FIELD_CHANGED,{field:field.id,value:event.target.value});},true);
    document.addEventListener("focusin",event=>{const field=fieldByElement(event.target?.id);if(field)controller.dispatch(EVENTS.FIELD_FOCUSED,{field:field.id});},true);
    document.addEventListener("focusout",event=>{const field=fieldByElement(event.target?.id);if(field)controller.dispatch(EVENTS.FIELD_BLURRED,{field:field.id});},true);

    document.addEventListener("click",event=>{
      const button=event.target?.closest?.("button");if(!button)return;
      const mode=MODE_BUTTONS[button.id];
      if(mode){event.preventDefault();event.stopImmediatePropagation();controller.setMode(mode);return;}
      const action=actionByElement(button.id);
      if(action){event.preventDefault();event.stopImmediatePropagation();if(action.event===EVENTS.RESEND_VERIFICATION)controller.dispatch(EVENTS.RESEND_VERIFICATION);else controller.dispatch(EVENTS.CONTINUE_PRESSED,{actionId:action.id});return;}
      const back=button.getAttribute("data-register-back");
      if(back){event.preventDefault();event.stopImmediatePropagation();const step=REGISTRATION_STEP_IDS[Number(back)];if(step)controller.dispatch(EVENTS.BACK_PRESSED,{step});}
    },true);

    document.addEventListener("submit",event=>{
      const form=event.target;if(!form?.id)return;
      const mode=Object.entries(AUTH_FORMS).find(([,id])=>id===form.id)?.[0];if(!mode)return;
      event.preventDefault();event.stopImmediatePropagation();
      if(controller.state.mode!==mode)controller.setMode(mode);
      const action=controller.config()?.steps[controller.state.step]?.primaryAction?.id;
      if(action)controller.dispatch(EVENTS.CONTINUE_PRESSED,{actionId:action});
    },true);

    controller.restoreSession();
  }

  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",bindRuntime,{once:true});else bindRuntime();
})(window,document);
