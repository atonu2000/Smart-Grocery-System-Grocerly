const KEY="grocerly_final_year_v2";
history.scrollRestoration="manual";
function resetScroll(){ const m=document.querySelector(".main"); if(m) m.scrollTop=0; window.scrollTo(0,0); }
const DEMO={
 budget:500, spent:184.70,
 inventory:[
  {id:1,name:"Whole Milk",category:"Dairy",qty:2,min:2,price:3.49,expiry:"2026-08-28"},
  {id:2,name:"Eggs",category:"Dairy",qty:8,min:6,price:4.29,expiry:"2026-09-03"},
  {id:3,name:"Bananas",category:"Produce",qty:3,min:5,price:1.29,expiry:"2026-08-25"},
  {id:4,name:"Chicken Breast",category:"Meat",qty:1,min:2,price:8.99,expiry:"2026-08-24"},
  {id:5,name:"Rice",category:"Pantry",qty:4,min:2,price:5.49,expiry:"2027-02-01"},
  {id:6,name:"Bread",category:"Bakery",qty:2,min:1,price:3.19,expiry:"2026-08-26"},
  {id:7,name:"Orange Juice",category:"Beverages",qty:1,min:1,price:4.99,expiry:"2026-09-08"},
  {id:8,name:"Frozen Peas",category:"Frozen",qty:3,min:1,price:2.79,expiry:"2027-01-15"}
 ],
 shopping:[
  {id:11,name:"Greek Yogurt",qty:2,price:1.99,done:false},
  {id:12,name:"Tomatoes",qty:5,price:0.79,done:false},
  {id:13,name:"Chicken Breast",qty:1,price:8.99,done:true},
  {id:14,name:"Avocado",qty:3,price:1.49,done:false}
 ]};
let state=load();
function load(){try{return JSON.parse(localStorage.getItem(KEY))||structuredClone(DEMO)}catch{return structuredClone(DEMO)}}
function save(){localStorage.setItem(KEY,JSON.stringify(state));renderAll()}
function money(n){return "$"+Number(n||0).toFixed(2)}
function today(){return new Date().toISOString().slice(0,10)}
function status(item){if(item.expiry&&item.expiry<today())return"expired";if(Number(item.qty)<=Number(item.min))return"low";return"healthy"}
function daysTo(date){if(!date)return null;return Math.ceil((new Date(date)-new Date())/86400000)}
function toast(msg){const t=document.getElementById("toast");t.textContent=msg;t.classList.add("show");setTimeout(()=>t.classList.remove("show"),1800)}
function setView(view){
 document.querySelectorAll(".view").forEach(v=>v.classList.remove("active-view"));
 document.getElementById(view).classList.add("active-view");
 document.querySelectorAll(".nav").forEach(n=>n.classList.toggle("active",n.dataset.view===view));
 document.getElementById("pageTitle").textContent=view[0].toUpperCase()+view.slice(1);
 if(view==="inventory")renderInventory(); if(view==="shopping")renderShopping(); if(view==="analytics")renderAnalytics(); if(view==="settings")document.getElementById("budgetInput").value=state.budget;
 document.getElementById("sidebar").classList.remove("open");
 resetScroll();
}
document.addEventListener("click",e=>{
 const v=e.target.closest("[data-view]"); if(v){e.preventDefault();setView(v.dataset.view)}
 const a=e.target.closest("[data-action]"); if(a){const x=a.dataset.action;if(x==="add")openItem();if(x==="addShopping")addShopping();if(x==="clearDone"){state.shopping=state.shopping.filter(x=>!x.done);save();toast("Completed items cleared")}if(x==="demo"){state=structuredClone(DEMO);save();toast("Demo workspace loaded")}}
});
function renderAll(){renderDashboard();renderInventory();renderShopping();renderAnalytics();document.getElementById("budgetInput").value=state.budget;document.getElementById("navStock").textContent=state.inventory.length;document.getElementById("navCart").textContent=state.shopping.filter(x=>!x.done).length}
function renderDashboard(){
 const inv=state.inventory, low=inv.filter(x=>status(x)==="low"), exp=inv.filter(x=>status(x)==="expired"), healthy=inv.filter(x=>status(x)==="healthy");
 const value=inv.reduce((a,x)=>a+x.qty*x.price,0), cats=new Set(inv.map(x=>x.category)).size, done=state.shopping.filter(x=>x.done).length;
 document.getElementById("kpiItems").textContent=inv.length;document.getElementById("kpiItemsSub").textContent=`${cats} categories`;
 document.getElementById("kpiLow").textContent=low.length;document.getElementById("kpiValue").textContent=money(value);document.getElementById("kpiShopping").textContent=state.shopping.filter(x=>!x.done).length;document.getElementById("kpiDone").textContent=`${done} completed`;
 const total=Math.max(inv.length,1), pct=Math.round(healthy.length/total*100);document.getElementById("donut").style.background=`conic-gradient(var(--green) 0 ${pct*3.6}deg,#e58a1b ${pct*3.6}deg ${(pct+low.length/total*100)*3.6}deg,#d9534f ${(pct+low.length/total*100)*3.6}deg 360deg)`;document.getElementById("donutPct").textContent=pct+"%";document.getElementById("healthyCount").textContent=healthy.length;document.getElementById("lowCount").textContent=low.length;document.getElementById("expiredCount").textContent=exp.length;
 document.getElementById("spent").textContent=money(state.spent);document.getElementById("budget").textContent=money(state.budget);const used=state.budget?Math.min(100,state.spent/state.budget*100):0;document.getElementById("budgetBar").style.width=used+"%";document.getElementById("budgetUsed").textContent=Math.round(used)+"% used";document.getElementById("budgetRemain").textContent=money(Math.max(0,state.budget-state.spent))+" remaining";
 document.getElementById("heroHealth").textContent=exp.length?"Needs attention":low.length?"Monitor stock":"Healthy";
 const att=[...exp.map(x=>({x,type:"expired"})),...low.map(x=>({x,type:"low"}))].slice(0,5);
 document.getElementById("attentionList").innerHTML=att.length?att.map(({x,type})=>`<div class="attention"><div class="a-icon">${type==="expired"?"!":"↓"}</div><div><strong>${esc(x.name)}</strong><small>${type==="expired"?"Expired":"Only "+x.qty+" left"} · ${esc(x.category)}</small></div><span class="status ${type}">${type}</span></div>`).join(""):`<div class="empty">All clear. Your pantry needs no immediate attention.</div>`;
}
function renderInventory(){
 const cats=[...new Set(state.inventory.map(x=>x.category))].sort(), cf=document.getElementById("categoryFilter"), old=cf.value;cf.innerHTML='<option value="all">All categories</option>'+cats.map(c=>`<option>${esc(c)}</option>`).join("");cf.value=cats.includes(old)?old:"all";
 const q=(document.getElementById("search")?.value||"").toLowerCase(), sf=document.getElementById("stockFilter")?.value||"all";
 const list=state.inventory.filter(x=>(x.name+" "+x.category).toLowerCase().includes(q)&&(sf==="all"||status(x)===sf));
 document.getElementById("inventoryBody").innerHTML=list.length?list.map(x=>{let s=status(x),d=daysTo(x.expiry);return `<tr><td><strong>${esc(x.name)}</strong></td><td>${esc(x.category)}</td><td>${x.qty}</td><td>${money(x.price)}</td><td><strong>${money(x.qty*x.price)}</strong></td><td><span class="status ${s}">${s}</span></td><td>${x.expiry?(d<0?Math.abs(d)+"d ago":d+"d left"):"—"}</td><td><div class="row-actions"><button class="small" onclick="openItem(${x.id})">Edit</button><button class="small delete" onclick="deleteItem(${x.id})">Delete</button></div></td></tr>`}).join(""):`<tr><td colspan="8"><div class="empty">No inventory items match your filters.</div></td></tr>`;
}
function renderShopping(){
 const list=state.shopping, done=list.filter(x=>x.done).length,total=list.reduce((a,x)=>a+x.qty*x.price,0);
 document.getElementById("shoppingSummary").textContent=`${list.length} items · ${done} completed`;document.getElementById("tripTotal").textContent=money(total);document.getElementById("tripBar").style.width=Math.min(100,state.budget?total/state.budget*100:0)+"%";document.getElementById("tripBudgetText").textContent=money(state.budget)+" budget";
 document.getElementById("shoppingBody").innerHTML=list.length?list.map(x=>`<div class="shop-item"><button class="check ${x.done?"done":""}" onclick="toggleShop(${x.id})">${x.done?"✓":""}</button><div class="shop-info"><strong>${esc(x.name)}</strong><small>${money(x.price)} each · ${x.done?"Completed":"Pending"}</small></div><div class="qty"><button onclick="changeQty(${x.id},-1)">−</button><span>${x.qty}</span><button onclick="changeQty(${x.id},1)">+</button></div><button class="small delete" onclick="deleteShop(${x.id})">×</button></div>`).join(""):`<div class="empty">Your shopping list is empty. Add something for your next trip.</div>`;
}
function renderAnalytics(){
 const value=state.inventory.reduce((a,x)=>a+x.qty*x.price,0), avg=state.inventory.length?value/state.inventory.length:0, total=state.shopping.length, done=state.shopping.filter(x=>x.done).length;
 document.getElementById("aSpend").textContent=money(state.spent);document.getElementById("aAvg").textContent=money(avg);document.getElementById("aRate").textContent=(total?Math.round(done/total*100):0)+"%";
 const cats={};state.inventory.forEach(x=>cats[x.category]=(cats[x.category]||0)+x.qty*x.price);const max=Math.max(...Object.values(cats),1);
 document.getElementById("categoryChart").innerHTML=Object.entries(cats).sort((a,b)=>b[1]-a[1]).map(([c,v])=>`<div class="bar-row"><span>${esc(c)}</span><div class="bar"><div style="width:${v/max*100}%"></div></div><b>${money(v)}</b></div>`).join("");
 const low=state.inventory.filter(x=>status(x)==="low").length, exp=state.inventory.filter(x=>status(x)==="expired").length, remaining=Math.max(0,state.budget-state.spent);
 const insights=[low?["↓",`${low} item${low>1?"s":""} need restocking`,`Convert low-stock items into a shopping run before your next trip.`]:["✓","Stock levels look healthy","No inventory item is currently below its threshold."],exp?["!","Expiry risk detected",`${exp} item${exp>1?"s are":" is"} past the recorded expiry date.`]:["◷","Expiry tracking is clear","No expired grocery items were detected."], [money(remaining), "Budget remaining", `You have ${money(remaining)} left in the current monthly budget.`]];
 document.getElementById("insights").innerHTML=insights.map(x=>`<div class="insight"><i>${x[0]}</i><div><b>${esc(x[1])}</b><span>${esc(x[2])}</span></div></div>`).join("");
}
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
function openItem(id=null){
 const modal=document.getElementById("modal"),form=document.getElementById("itemForm");form.reset();document.getElementById("itemId").value=id||"";
 if(id){const x=state.inventory.find(i=>i.id===id);document.getElementById("modalTitle").textContent="Edit grocery item";document.getElementById("fName").value=x.name;document.getElementById("fCategory").value=x.category;document.getElementById("fQty").value=x.qty;document.getElementById("fMin").value=x.min;document.getElementById("fPrice").value=x.price;document.getElementById("fExpiry").value=x.expiry||""}else document.getElementById("modalTitle").textContent="Add grocery item";
 modal.classList.add("show");
}
function deleteItem(id){if(confirm("Delete this inventory item?")){state.inventory=state.inventory.filter(x=>x.id!==id);save();toast("Inventory item deleted")}}
document.getElementById("itemForm").addEventListener("submit",e=>{e.preventDefault();const id=Number(document.getElementById("itemId").value),x={id:id||Date.now(),name:document.getElementById("fName").value.trim(),category:document.getElementById("fCategory").value,qty:Number(document.getElementById("fQty").value),min:Number(document.getElementById("fMin").value),price:Number(document.getElementById("fPrice").value),expiry:document.getElementById("fExpiry").value};if(id)state.inventory=state.inventory.map(i=>i.id===id?x:i);else state.inventory.unshift(x);document.getElementById("modal").classList.remove("show");save();toast(id?"Inventory updated":"Inventory item added")});
function addShopping(){const name=prompt("Shopping item name:");if(!name?.trim())return;const p=Number(prompt("Estimated unit price:", "2.50"));const q=Number(prompt("Quantity:","1"));if(!isFinite(p)||!isFinite(q)||q<=0)return;state.shopping.unshift({id:Date.now(),name:name.trim(),qty:q,price:p,done:false});save();toast("Shopping item added")}
function toggleShop(id){const x=state.shopping.find(i=>i.id===id);x.done=!x.done;save()}
function changeQty(id,d){const x=state.shopping.find(i=>i.id===id);x.qty=Math.max(.1,Number(x.qty)+d);save()}
function deleteShop(id){state.shopping=state.shopping.filter(x=>x.id!==id);save();toast("Shopping item removed")}
document.getElementById("search").addEventListener("input",renderInventory);document.getElementById("categoryFilter").addEventListener("change",renderInventory);document.getElementById("stockFilter").addEventListener("change",renderInventory);
document.getElementById("closeModal").onclick=()=>document.getElementById("modal").classList.remove("show");document.getElementById("cancelModal").onclick=()=>document.getElementById("modal").classList.remove("show");
document.getElementById("hamburger").onclick=()=>document.getElementById("sidebar").classList.toggle("open");
document.getElementById("refreshBtn").onclick=()=>{renderAll();
resetScroll();toast("Dashboard insights refreshed")};
document.getElementById("themeBtn").onclick=()=>{document.body.classList.toggle("dark");localStorage.setItem("grocerly_theme",document.body.classList.contains("dark")?"dark":"light")};
document.getElementById("saveBudget").onclick=()=>{state.budget=Math.max(0,Number(document.getElementById("budgetInput").value)||0);save();toast("Budget saved")};
document.getElementById("loadDemo").onclick=()=>{state=structuredClone(DEMO);save();toast("Demo dataset loaded")};
document.getElementById("resetData").onclick=()=>{if(confirm("Reset the entire workspace?")){state={budget:500,spent:0,inventory:[],shopping:[]};save();toast("Workspace reset")}};
document.getElementById("exportBtn").onclick=()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"}),a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="grocerly-report.json";a.click();URL.revokeObjectURL(a.href);toast("Report exported")};
if(localStorage.getItem("grocerly_theme")==="dark")document.body.classList.add("dark");
renderAll();
resetScroll();
