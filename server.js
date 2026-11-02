const http=require('http'),fs=require('fs'),path=require('path'),WebSocket=require('ws');
const PORT=process.env.PORT||3000,server=http.createServer((req,res)=>{let p=req.url.split('?')[0];if(p==='/')p='/index.html';let f=path.join(__dirname,p);fs.readFile(f,(e,d)=>{if(e){res.writeHead(404);return res.end('Not found')}res.setHeader('Content-Type',f.endsWith('.html')?'text/html; charset=utf-8':'application/octet-stream');res.end(d)})});
const wss=new WebSocket.Server({server}),rooms=new Map();let uid=0;
const randRoom=()=>Math.random().toString(36).slice(2,7).toUpperCase();
function send(ws,o){if(ws.readyState===1)ws.send(JSON.stringify(o))}
function roomState(room){return {type:'state',players:Object.fromEntries([...room.players].map(([id,p])=>[id,p])),zombies:room.zombies,bullets:room.bullets,loot:room.loot}}
function broadcast(room,o){room.players.forEach(p=>send(p.ws,o))}
function spawnZombie(room){let a=Math.random()*Math.PI*2,d=550+Math.random()*250;room.zombies.push({id:++uid,x:room.centerX+Math.cos(a)*d,y:room.centerY+Math.sin(a)*d,r:14,hp:2+Math.floor(room.wave/3),speed:0.55+room.wave*.07})}
wss.on('connection',ws=>{let pid='p'+(++uid),current=null;ws.on('message',raw=>{let m;try{m=JSON.parse(raw)}catch{return}
 if(m.type==='create'||m.type==='join'){let rid=m.type==='create'?randRoom():String(m.room||'').toUpperCase();if(!rid){send(ws,{type:'notice',text:'Nhập mã phòng để tham gia.'});return}
 let room=rooms.get(rid);if(!room&&m.type==='join'){send(ws,{type:'notice',text:'Không tìm thấy phòng. Hãy tạo phòng trước.'});return}
 if(!room){room={id:rid,players:new Map(),zombies:[],bullets:[],loot:[],wave:1,score:0,centerX:0,centerY:0,lastSpawn:0};rooms.set(rid,room)}
 if(room.players.size>=5){send(ws,{type:'roomfull'});return}
 current=room;let p={id:pid,name:String(m.name||'Survivor').slice(0,14),x:(Math.random()-.5)*100,y:(Math.random()-.5)*100,hp:100,aim:0,input:{x:0,y:0,fire:false},lastShot:0,ws};room.players.set(pid,p);send(ws,{type:'joined',id:pid,room:rid,count:room.players.size});broadcast(room,{type:'notice',text:`${p.name} đã tham gia (${room.players.size}/5)`});return}
 if(!current)return;let p=current.players.get(pid);if(!p)return;
 if(m.type==='input'){p.input={x:Math.max(-1,Math.min(1,Number(m.x)||0)),y:Math.max(-1,Math.min(1,Number(m.y)||0)),fire:!!m.fire};p.aim=Number(m.aim)||0}
 });
 ws.on('close',()=>{if(current){current.players.delete(pid);broadcast(current,{type:'notice',text:'Một người chơi đã rời phòng.'});if(!current.players.size)rooms.delete(current.id)}})
});
setInterval(()=>{for(let room of rooms.values()){
 let alive=[...room.players.values()].filter(p=>p.hp>0);
 for(let p of alive){let v=p.input,l=Math.hypot(v.x,v.y)||1;p.x+=v.x/l*3.2;p.y+=v.y/l*3.2;if(v.fire&&Date.now()-p.lastShot>220){p.lastShot=Date.now();room.bullets.push({id:++uid,x:p.x+Math.cos(p.aim)*20,y:p.y+Math.sin(p.aim)*20,vx:Math.cos(p.aim)*8,vy:Math.sin(p.aim)*8,life:70,owner:p.id})}}
 if(room.zombies.length<Math.min(8+room.wave*2,30)&&Date.now()-room.lastSpawn>Math.max(400,1700-room.wave*90)){spawnZombie(room);room.lastSpawn=Date.now()}
 for(let z of room.zombies){let target=alive.sort((a,b)=>Math.hypot(a.x-z.x,a.y-z.y)-Math.hypot(b.x-z.x,b.y-z.y))[0];if(target){let a=Math.atan2(target.y-z.y,target.x-z.x);z.x+=Math.cos(a)*z.speed;z.y+=Math.sin(a)*z.speed;if(Math.hypot(target.x-z.x,target.y-z.y)<27&&Date.now()%500<50)target.hp-=0.8}}
 for(let b of room.bullets){b.x+=b.vx;b.y+=b.vy;b.life--;for(let z of room.zombies){if(z.hp>0&&Math.hypot(b.x-z.x,b.y-z.y)<z.r+5){z.hp--;b.life=0;if(z.hp<=0){room.score+=10;if(Math.random()<.2)room.loot.push({x:z.x,y:z.y,kind:Math.random()<.5?'med':'ammo',life:900})}break}}}
 room.zombies=room.zombies.filter(z=>z.hp>0);room.bullets=room.bullets.filter(b=>b.life>0);
 for(let l of room.loot){l.life--;for(let p of alive){if(Math.hypot(p.x-l.x,p.y-l.y)<25){if(l.kind==='med')p.hp=Math.min(100,p.hp+25);else p.hp=Math.min(100,p.hp+5);l.life=0;break}}}room.loot=room.loot.filter(l=>l.life>0);
 if(!alive.length&&room.players.size){room.zombies=[];room.wave=1;room.players.forEach(p=>p.hp=100)}
 if(room.zombies.length===0&&Date.now()-room.lastSpawn>5000){room.wave++;room.lastSpawn=Date.now()}
 broadcast(room,roomState(room));
}},50);
server.listen(PORT,()=>console.log('Zombie Party Online listening on '+PORT));
