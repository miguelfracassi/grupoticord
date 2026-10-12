(function(){
var $=function(i){return document.getElementById(i)},U=null,pend=null,busy=false,mode="login",ctok="",root=document.documentElement;
var PH=["Olá, como posso te ajudar?","Precisa de Ajuda?","Estou aqui.","Suporte com IA"],CH=["O que é o Grupo Ticord?","Como mudo minha senha?","Como falo com o Comercial?","O que é a Bup?"],COL=["#0656BF","#7c3aed","#059669","#e11d48","#f59e0b","#0f172a"];
function esc(s){return String(s==null?"":s).replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function md(s){return esc(s).replace(/\*\*(.+?)\*\*/g,"<b>$1</b>").replace(/`([^`]+)`/g,"<code>$1</code>").replace(/(https?:\/\/[^\s<]*[^\s<.,;:!?)])/g,'<a href="$1" target="_blank" rel="noopener">$1</a>').replace(/\n/g,"<br>")}
function api(p,o){o=o||{};o.headers={"Content-Type":"application/json"};o.credentials="same-origin";return fetch(p,o).then(function(r){return r.json().catch(function(){return{}}).then(function(d){d._s=r.status;return d})}).catch(function(){return{error:"Sem conexão. Tente novamente.",_s:0}})}
function prefs(t,c){t=t||"auto";c=c||"#0656BF";var dk=t==="dark"||(t==="auto"&&matchMedia("(prefers-color-scheme: dark)").matches);root.dataset.theme=dk?"dark":"light";root.style.setProperty("--b",c);root.style.setProperty("--pale","color-mix(in srgb, "+c+" 14%, transparent)");try{localStorage.setItem("tk_p",JSON.stringify({t:t,c:c}))}catch(e){}U&&(U.theme=t,U.color=c);mark()}
try{var lp=JSON.parse(localStorage.getItem("tk_p")||"{}");prefs(lp.t,lp.c)}catch(e){prefs()}
function mark(){var t=U?U.theme:"auto",c=U?U.color:"#0656BF";document.querySelectorAll("#th button").forEach(function(b){b.classList.toggle("on",b.dataset.v===t)});document.querySelectorAll("#sw button").forEach(function(b){b.classList.toggle("on",b.dataset.c.toLowerCase()===String(c).toLowerCase())})}
matchMedia("(prefers-color-scheme: dark)").addEventListener&&matchMedia("(prefers-color-scheme: dark)").addEventListener("change",function(){if(U&&U.theme==="auto")prefs("auto",U.color)});
/* texto rotativo */
var ri=0,rt=$("rot");(function show(){rt.className="rot";rt.innerHTML=PH[ri%PH.length].split(" ").map(function(w,i){return '<span class="wd" style="animation-delay:'+(i*.12)+'s">'+w+"</span>"}).join(" ");setTimeout(function(){rt.className="rot out"},2700);setTimeout(function(){ri++;show()},3250)})();
$("chips").innerHTML=CH.map(function(c){return "<button>"+esc(c)+"</button>"}).join("");
$("chips").onclick=function(e){if(e.target.tagName==="BUTTON")ask(e.target.textContent)};
$("sw").innerHTML=COL.map(function(c){return '<button data-c="'+c+'" style="background:'+c+'" aria-label="'+c+'"></button>'}).join("")+'<input type="color" id="cc" value="#0656BF" aria-label="Cor personalizada">';
/* acessos */
function acts(){var a=$("acts");if(U){a.innerHTML="<span>Olá, "+esc(U.name.split(" ")[0])+"</span><button id='a1'>Abrir chat</button><button id='a2'>Configurações</button><button id='a3'>Sair</button>";$("a1").onclick=openChat;$("a2").onclick=openSet;$("a3").onclick=logout}else{a.innerHTML="<button id='a0'>Entrar ou criar conta</button>";$("a0").onclick=function(){openAuth("login")}}}
function openChat(){$("land").style.display="none";$("chat").style.display="flex";hist()}
function hist(){$("msgs").innerHTML="";api("/api/chat").then(function(d){if(d._s===401){U=null;return gohome()}var m=d.messages||[];if(!m.length)bubble("a","Olá"+(U?", "+U.name.split(" ")[0]:"")+"! Sou o assistente de suporte do Grupo Ticord. Como posso te ajudar?");m.forEach(function(x){bubble(x.role==="user"?"u":"a",x.content)});scroll()})}
function gohome(){$("chat").style.display="none";$("land").style.display="flex";acts()}
function scroll(){var m=$("msgs");m.scrollTop=m.scrollHeight}
function bubble(r,t){var d=document.createElement("div");d.className="m "+r;d.innerHTML=r==="a"?md(t):esc(t);$("msgs").appendChild(d);scroll();return d}
function type(el,t){var i=0,iv=setInterval(function(){i+=3;el.innerHTML=md(t.slice(0,i));scroll();if(i>=t.length)clearInterval(iv)},18)}
function send(t){if(busy||!t)return;busy=true;bubble("u",t);var dots=document.createElement("div");dots.className="m a dots";dots.innerHTML="<i></i><i></i><i></i>";$("msgs").appendChild(dots);scroll();
 api("/api/chat",{method:"POST",body:JSON.stringify({message:t})}).then(function(d){dots.remove();busy=false;if(d._s===401){U=null;return openAuth("login")}var el=bubble("a","");type(el,d.reply||d.error||"Algo deu errado. Tente novamente.")})}
function ask(t){t=(t||"").trim();if(!t)return;if(!U){pend=t;return openAuth("login")}openChat();setTimeout(function(){send(t)},350)}
$("lf").onsubmit=function(e){e.preventDefault();var t=$("li").value;$("li").value="";ask(t)};
$("cf").onsubmit=function(e){e.preventDefault();var t=$("ci").value.trim();$("ci").value="";send(t)};
$("nw").onclick=function(){if(confirm("Apagar o histórico e começar uma nova conversa?"))api("/api/chat",{method:"DELETE"}).then(hist)};
$("gs").onclick=openSet;$("lo").onclick=logout;
function logout(){api("/api/auth?a=logout",{method:"POST",body:"{}"}).then(function(){U=null;prefs("auto","#0656BF");gohome()})}
/* modais */
document.querySelectorAll("[data-x]").forEach(function(b){b.onclick=function(){b.closest(".ov").classList.remove("on")}});
document.querySelectorAll(".ov").forEach(function(o){o.onclick=function(e){if(e.target===o)o.classList.remove("on")}});
function cap(){$("cimg").innerHTML="";api("/api/auth?a=captcha").then(function(d){ctok=d.token||"";$("cimg").innerHTML=d.svg||"";$("ac").value=""})}
function setMode(m){mode=m;$("tl").classList.toggle("on",m==="login");$("tr").classList.toggle("on",m==="register");$("rf").style.display=m==="register"?"grid":"none";$("an").required=$("ap").required=m==="register";$("ab").textContent=m==="login"?"Entrar":"Criar conta";$("am").textContent="";$("aw").autocomplete=m==="login"?"current-password":"new-password"}
function openAuth(m){setMode(m);$("ma").classList.add("on");cap()}
$("tl").onclick=function(){setMode("login");cap()};$("tr").onclick=function(){setMode("register");cap()};$("cr").onclick=cap;
$("af").onsubmit=function(e){e.preventDefault();var am=$("am");am.className="msg";am.textContent="Aguarde...";
 var b={email:$("ae").value,password:$("aw").value,captcha:$("ac").value,captchaToken:ctok};if(mode==="register"){b.name=$("an").value;b.phone=$("ap").value}
 api("/api/auth?a="+mode,{method:"POST",body:JSON.stringify(b)}).then(function(d){if(!d.user){am.className="msg e";am.textContent=d.error||"Não foi possível continuar.";cap();return}
  U=d.user;prefs(U.theme,U.color);$("ma").classList.remove("on");$("af").reset();acts();var p=pend;pend=null;openChat();if(p)setTimeout(function(){send(p)},400)})};
function openSet(){$("who").textContent=U?U.name+" · "+U.email:"";["pm","dm"].forEach(function(i){$(i).textContent=""});mark();$("ms").classList.add("on")}
function save(t,c){api("/api/auth?a=prefs",{method:"POST",body:JSON.stringify({theme:t,color:c})})}
$("th").onclick=function(e){var v=e.target.dataset&&e.target.dataset.v;if(!v)return;prefs(v,U.color);save(v,U.color)};
$("sw").onclick=function(e){var c=e.target.dataset&&e.target.dataset.c;if(!c)return;prefs(U.theme,c);save(U.theme,c)};
$("cc").onchange=function(){prefs(U.theme,this.value);save(U.theme,this.value)};
$("pf").onsubmit=function(e){e.preventDefault();var m=$("pm");m.className="msg";api("/api/auth?a=password",{method:"POST",body:JSON.stringify({current:$("pc").value,next:$("pn").value})}).then(function(d){if(d.ok){m.className="msg k";m.textContent="Senha alterada com sucesso.";$("pf").reset()}else{m.className="msg e";m.textContent=d.error||"Erro."}})};
$("df").onsubmit=function(e){e.preventDefault();if(!confirm("Tem certeza? Sua conta e seu histórico serão apagados para sempre."))return;var m=$("dm");api("/api/auth?a=delete",{method:"POST",body:JSON.stringify({password:$("dp").value})}).then(function(d){if(d.ok){U=null;$("df").reset();$("ms").classList.remove("on");prefs("auto","#0656BF");gohome()}else{m.className="msg e";m.textContent=d.error||"Erro."}})};
/* sessão */
api("/api/auth?a=me").then(function(d){if(d.user){U=d.user;prefs(U.theme,U.color)}acts()});acts();
})();
