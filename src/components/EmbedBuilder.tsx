import React, { useState, useEffect, useCallback, useRef } from 'react';
import ToastContainer, { addToast } from './ToastSystem';
import WebhookManager from './WebhookManager';
import { I18nProvider, LangSwitch, useT } from '../lib/i18n';
import ChangelogModal from './ChangelogModal';
import FormatToolbar from './FormatToolbar';
import SendHistoryModal, { recordSend } from './SendHistoryModal';
import TemplatesModal from './TemplatesModal';
import ImportModal, { type ImportedPayload } from './ImportModal';
import DiffModal from './DiffModal';
import WebhookAppearanceModal from './WebhookAppearanceModal';

// ── Types ─────────────────────────────────────────────────────────────────────

interface EmbedField { _id: string; name: string; value: string; inline: boolean }
interface DiscordEmbed {
  _id: string; color: number | null;
  author_name: string; author_url: string; author_icon: string;
  title: string; url: string; description: string;
  fields: EmbedField[];
  image: string; thumbnail: string;
  footer_text: string; footer_icon: string; timestamp: boolean;
}
interface LinkButton { _id: string; label: string; url: string; emoji: string; disabled: boolean }
interface ButtonRow  { _id: string; buttons: LinkButton[] }
interface DiscordMessage { _id: string; content: string; embeds: DiscordEmbed[]; rows: ButtonRow[] }
interface AppState { messages: DiscordMessage[] }
type SendMode = 'bot' | 'webhook';

// ── Helpers ───────────────────────────────────────────────────────────────────

const uid = () => Math.random().toString(36).slice(2, 9);
const colorToHex = (c: number | null) => c != null ? `#${c.toString(16).padStart(6, '0')}` : '#555e70';
const hexToColor = (h: string) => parseInt(h.replace('#', ''), 16);

const newField  = (): EmbedField  => ({ _id: uid(), name: '', value: '', inline: false });
const newEmbed  = (): DiscordEmbed => ({ _id: uid(), color: 5592405, author_name: '', author_url: '', author_icon: '', title: '', url: '', description: '', fields: [], image: '', thumbnail: '', footer_text: '', footer_icon: '', timestamp: false });
const newBtn    = (): LinkButton  => ({ _id: uid(), label: '', url: '', emoji: '', disabled: false });
const newRow    = (): ButtonRow   => ({ _id: uid(), buttons: [newBtn()] });
const newMessage = (): DiscordMessage => ({ _id: uid(), content: '', embeds: [], rows: [] });

const ESC = '';
function makeExample(): AppState {
  return { messages: [{ _id: uid(), content: '', rows: [], embeds: [{
    _id: uid(), color: 5814783,
    author_name: 'Embed Builder', author_url: '', author_icon: '',
    title: '¡Bienvenido al Embed Builder! 👋', url: '',
    description: `Editá los campos del panel izquierdo — el preview se actualiza en tiempo real.\n\n> Soporta **markdown** completo: *italic*, \`código\`, [links](https://discord.com), :sparkles: emojis, @menciones y más.\n\n\`\`\`ansi\n${ESC}[1;32mVerde${ESC}[0m  ${ESC}[1;33mAmarillo${ESC}[0m  ${ESC}[1;31mRojo${ESC}[0m  ${ESC}[1;34mAzul${ESC}[0m  ${ESC}[1;35mMagenta${ESC}[0m  ${ESC}[1;36mCian${ESC}[0m\n${ESC}[2;37mTexto tenue${ESC}[0m  ${ESC}[4;33mSubrayado amarillo${ESC}[0m  ${ESC}[1;45m${ESC}[1;37m fondo morado ${ESC}[0m\n\`\`\``,
    fields: [
      { _id: uid(), name: 'Campos inline', value: 'Aparecen en columnas', inline: true },
      { _id: uid(), name: 'Markdown', value: '**bold** *italic* `code`', inline: true },
      { _id: uid(), name: 'Límites', value: 'Título: 256 chars · Descripción: 4096 · Campos: 25 · Embeds: 10', inline: false },
    ],
    image: '', thumbnail: '',
    footer_text: 'Embed Builder by Liam', footer_icon: '', timestamp: true,
  }] }] };
}

function encodeState(s: unknown) {
  try { return btoa(encodeURIComponent(JSON.stringify(s))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=/g,''); } catch { return ''; }
}
function decodeState(s: string): unknown {
  try { const b=s.replace(/-/g,'+').replace(/_/g,'/'); return JSON.parse(decodeURIComponent(atob(b+'='.repeat((4-b.length%4)%4)))); } catch { return null; }
}

function serializeEmbed(e: DiscordEmbed): Record<string, unknown> {
  const o: any = {};
  if (e.color!=null) o.color=e.color;
  if (e.author_name.trim()) { const a:any={name:e.author_name}; if(e.author_url.trim())a.url=e.author_url; if(e.author_icon.trim())a.icon_url=e.author_icon; o.author=a; }
  if (e.title.trim()) o.title=e.title;
  if (e.url.trim()&&e.title.trim()) o.url=e.url;
  if (e.description.trim()) o.description=e.description;
  const fs=e.fields.filter(f=>f.name.trim()&&f.value.trim()).map(f=>({name:f.name,value:f.value,inline:f.inline}));
  if(fs.length) o.fields=fs;
  if(e.image.trim()) o.image={url:e.image};
  if(e.thumbnail.trim()) o.thumbnail={url:e.thumbnail};
  if(e.footer_text.trim()) { const ft:any={text:e.footer_text}; if(e.footer_icon.trim())ft.icon_url=e.footer_icon; o.footer=ft; }
  if(e.timestamp) o.timestamp=new Date().toISOString();
  return o;
}
function serializeMessage(m: DiscordMessage, whName='', whAvatar='') {
  const o: any = { embeds: m.embeds.map(serializeEmbed).filter(e=>Object.keys(e).length>0) };
  if(m.content.trim()) o.content=m.content;
  if(whName.trim()) o.username=whName;
  if(whAvatar.trim()) o.avatar_url=whAvatar;
  const validRows = (m.rows||[]).filter(r=>r.buttons.some(b=>b.label.trim()&&b.url.trim()));
  if(validRows.length) o.components = validRows.map(r=>({
    type:1,
    components: r.buttons.filter(b=>b.label.trim()&&b.url.trim()).map(b=>({
      type:2, style:5, label:b.label.trim(),
      url:b.url.trim(),
      ...(b.emoji.trim()?{emoji:{name:b.emoji.trim()}}:{}),
      ...(b.disabled?{disabled:true}:{}),
    }))
  }));
  return o;
}

// ── ANSI renderer ─────────────────────────────────────────────────────────────

const ANSI_FG: Record<number,string> = {
  30:'#4f545c', 31:'#dc322f', 32:'#859900', 33:'#b58900',
  34:'#268bd2', 35:'#d33682', 36:'#2aa198', 37:'#dcddde',
  90:'#4f545c', 91:'#ff7b72', 92:'#3fb950', 93:'#d29922',
  94:'#58a6ff', 95:'#bc8cff', 96:'#39c5cf', 97:'#ffffff',
};
const ANSI_BG: Record<number,string> = {
  40:'#002b36', 41:'#cb4b16', 42:'#586e75', 43:'#657b83',
  44:'#839496', 45:'#6c71c4', 46:'#93a1a1', 47:'#fdf6e3',
  100:'#002b36', 101:'#cb4b16', 102:'#586e75', 103:'#657b83',
  104:'#839496', 105:'#6c71c4', 106:'#93a1a1', 107:'#fdf6e3',
};
interface AnsiSt { fg:string|null; bg:string|null; bold:boolean; dim:boolean; ul:boolean }
function applyAnsi(codes: number[], s: AnsiSt): AnsiSt {
  const n={...s};
  for(const c of codes){
    if(c===0){n.fg=null;n.bg=null;n.bold=false;n.dim=false;n.ul=false;}
    else if(c===1)n.bold=true; else if(c===2)n.dim=true; else if(c===4)n.ul=true;
    else if(ANSI_FG[c]!==undefined)n.fg=ANSI_FG[c];
    else if(ANSI_BG[c]!==undefined)n.bg=ANSI_BG[c];
  }
  return n;
}
function ansiSt(s: AnsiSt): React.CSSProperties {
  const st:React.CSSProperties={};
  if(s.fg)st.color=s.fg; if(s.bg)st.backgroundColor=s.bg;
  if(s.bold)st.fontWeight='bold'; if(s.dim)st.opacity=0.65; if(s.ul)st.textDecoration='underline';
  return st;
}
let _ak=0;
function renderAnsi(text: string): React.ReactNode {
  const out:React.ReactNode[]=[];
  let state:AnsiSt={fg:null,bg:null,bold:false,dim:false,ul:false};
  const re=/(?:|\\u001b|\\x1b)\[([0-9;]*)m/g;
  let last=0, m:RegExpExecArray|null;
  while((m=re.exec(text))!==null){
    if(m.index>last){const st=ansiSt(state);out.push(<span key={_ak++} style={Object.keys(st).length?st:undefined}>{text.slice(last,m.index)}</span>);}
    state=applyAnsi(m[1]?m[1].split(';').map(Number).filter(n=>!isNaN(n)):[0],state);
    last=m.index+m[0].length;
  }
  if(last<text.length){const st=ansiSt(state);out.push(<span key={_ak++} style={Object.keys(st).length?st:undefined}>{text.slice(last)}</span>);}
  return <>{out}</>;
}

// ── Discord markdown renderer ─────────────────────────────────────────────────

const M_S  = {color:'#c9cdfb',background:'rgba(88,101,242,.3)',borderRadius:3,padding:'0 3px',cursor:'default'} as const;
const ME_S = {color:'#f8a8c8',background:'rgba(255,105,180,.18)',borderRadius:3,padding:'0 3px',cursor:'default'} as const;
const CO_S = {background:'#1e1f22',color:'#b9bec7',borderRadius:3,padding:'0 5px',fontFamily:'Consolas,"Courier New",monospace',fontSize:'0.875em'} as const;
const CB_S:React.CSSProperties = {background:'#1e1f22',color:'#b9bec7',borderRadius:4,padding:'10px 14px',fontFamily:'Consolas,"Courier New",monospace',fontSize:13,margin:'4px 0',whiteSpace:'pre-wrap',wordBreak:'break-all',display:'block'};
const ANSI_CB:React.CSSProperties = {...CB_S, background:'#111214', color:'#dcddde'};
const EM_S = {height:'1.3em',verticalAlign:'text-bottom',display:'inline-block'} as const;
const EMO  = "'gg sans','Noto Sans','Apple Color Emoji','Segoe UI Emoji',sans-serif";

const EMOJIS:Record<string,string>={
  smile:'😄',grin:'😁',joy:'😂',blush:'😊',wink:'😉',sweat_smile:'😅',heart_eyes:'😍',kissing_heart:'😘',
  thinking:'🤔',nerd_face:'🤓',flushed:'😳',unamused:'😒',sob:'😭',cry:'😢',angry:'😠',rage:'😡',skull:'💀',
  innocent:'😇',upside_down:'🙃',partying_face:'🥳',star_struck:'🤩',pleading_face:'🥺',
  thumbsup:'👍','+1':'👍',thumbsdown:'👎',ok_hand:'👌',clap:'👏',raised_hands:'🙌',wave:'👋',pray:'🙏',muscle:'💪',
  heart:'❤️',orange_heart:'🧡',yellow_heart:'💛',green_heart:'💚',blue_heart:'💙',purple_heart:'💜',broken_heart:'💔',sparkling_heart:'💖',
  fire:'🔥',sun:'☀️',moon:'🌙',rainbow:'🌈',snowflake:'❄️',lightning:'⚡',
  star:'⭐',star2:'🌟',sparkles:'✨',boom:'💥',tada:'🎉',balloon:'🎈',trophy:'🏆',crown:'👑',gem:'💎',
  bell:'🔔',lock:'🔒',key:'🔑',gear:'⚙️',mag:'🔍',warning:'⚠️',x:'❌',white_check_mark:'✅',
  eyes:'👀',rocket:'🚀',link:'🔗',computer:'💻',email:'📧',
  campana:'🔔',fuego:'🔥',corazon:'❤️',estrella:'⭐',pulgar:'👍',celebracion:'🎉',corona:'👑',calavera:'💀',cohete:'🚀',
};

const _eCache=new Map<string,string|null>();
function EmojiImg({name,id,animated}:{name:string;id:string;animated?:boolean}){
  const key=`${id}:${animated?'a':'s'}`;
  const URLS=animated?[`https://cdn.discordapp.com/emojis/${id}.gif?size=64&quality=lossless`,`https://cdn.discordapp.com/emojis/${id}.png`]:[`https://cdn.discordapp.com/emojis/${id}.png`];
  const [idx,setIdx]=useState<number>(()=>{const c=_eCache.get(key);if(c===null)return URLS.length;if(c){const i=URLS.indexOf(c);return i>=0?i:0;}return 0;});
  if(idx>=URLS.length)return<span style={{background:'#2b2d31',borderRadius:3,padding:'0 3px',fontSize:'.85em',color:'#b5bac1'}}>:{name}:</span>;
  return<img key={key+idx}src={URLS[idx]}style={EM_S}alt={`:${name}:`}onLoad={()=>_eCache.set(key,URLS[idx])}onError={()=>{const n=idx+1;if(n>=URLS.length)_eCache.set(key,null);setIdx(n);}}/>;
}

type IPat={re:RegExp;fn:(f:string,g1:string,g2:string)=>React.ReactNode;t?:boolean};
const ID_ICON_S:React.CSSProperties={fontSize:'0.8em',verticalAlign:'middle',marginRight:3};
const ID_CH:{[k:string]:{icon:React.ReactNode;label:string}}={
  browse:       {icon:<i className="fi fi-sr-search"style={ID_ICON_S}/>,label:'Browse Channels'},
  customize:    {icon:<i className="fi fi-sr-list"style={ID_ICON_S}/>,label:'Channels & Roles'},
  guide:        {icon:<i className="fi fi-sr-diploma"style={ID_ICON_S}/>,label:'Server Guide'},
  'linked-roles':{icon:<i className="fi fi-sr-link"style={ID_ICON_S}/>,label:'Linked Roles'},
};

const IPATS:IPat[]=[
  {re:/\\([*_~|`\\>])/g,fn:(_,c)=>c,t:true},
  {re:/\*\*\*([^*\n]+)\*\*\*/g,fn:(_,t)=><strong><em>{t}</em></strong>},
  {re:/\*\*([^*\n]+)\*\*/g,fn:(_,t)=><strong>{t}</strong>},
  {re:/__([^_\n]+)__/g,fn:(_,t)=><u>{t}</u>},
  {re:/\*([^*\n]+)\*/g,fn:(_,t)=><em>{t}</em>},
  {re:/_([^_\n]+)_/g,fn:(_,t)=><em>{t}</em>},
  {re:/~~([^~\n]+)~~/g,fn:(_,t)=><span style={{textDecoration:'line-through',opacity:.65}}>{t}</span>},
  {re:/`([^`\n]+)`/g,fn:(_,c)=><code style={CO_S}>{c}</code>,t:true},
  {re:/\|\|([^|]+)\|\|/g,fn:(_,t)=><span style={{background:'#111',color:'transparent',borderRadius:3,padding:'0 3px'}}title={t}>▒▒▒</span>,t:true},
  {re:/<a:([^:>]+):(\d+)>/g,fn:(_,n,id)=><EmojiImg name={n}id={id}animated/>,t:true},
  {re:/<:([^:>]+):(\d+)>/g,fn:(_,n,id)=><EmojiImg name={n}id={id}/>,t:true},
  {re:/:([a-zA-Z0-9_+\-]+):/g,fn:(_,n)=>{const e=EMOJIS[n.toLowerCase()];return e?<span style={{fontFamily:EMO}}>{e}</span>:<span style={{opacity:.55,fontSize:'.85em'}}>:{n}:</span>;},t:true},
  {re:/<@!?(\d+)>/g,fn:()=><span style={M_S}>@usuario</span>,t:true},
  {re:/<#(\d+)>/g,fn:()=><span style={M_S}>#canal</span>,t:true},
  {re:/<@&(\d+)>/g,fn:()=><span style={M_S}>@rol</span>,t:true},
  {re:/<id:(browse|customize|guide|linked-roles)>/g,fn:(_,id)=>{const ch=ID_CH[id];return ch?<span style={M_S}>{ch.icon} {ch.label}</span>:<span style={M_S}>{id}</span>;},t:true},
  {re:/@(everyone|here)\b/g,fn:(_,w)=><span style={ME_S}>@{w}</span>,t:true},
  {re:/@([a-zA-Z0-9_.]{1,32})\b/g,fn:(_,w)=><span style={M_S}>@{w}</span>,t:true},
  {re:/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,fn:(_,lb,url)=><a href={url}target="_blank"rel="noreferrer"style={{color:'#00aafc',textDecoration:'none'}}>{lb}</a>,t:true},
  {re:/(https?:\/\/[^\s<>)"]+)/g,fn:(_,u)=><a href={u}target="_blank"rel="noreferrer"style={{color:'#00aafc',textDecoration:'none'}}>{u}</a>,t:true},
];

let _k=0;
function applyInline(text:string,pats:IPat[]):React.ReactNode[]{
  if(!text||!pats.length)return[text];
  const{re,fn,t}=pats[0];const rest=pats.slice(1);
  const fresh=new RegExp(re.source,'g');const out:React.ReactNode[]=[];let last=0,m:RegExpExecArray|null;
  while((m=fresh.exec(text))!==null){
    if(m.index>last)out.push(...applyInline(text.slice(last,m.index),rest));
    const g1=t?(m[1]??''):(applyInline(m[1]??'',rest) as any);
    out.push(<React.Fragment key={_k++}>{fn(m[0],g1,m[2]??'')}</React.Fragment>);
    last=m.index+m[0].length;
  }
  if(last<text.length)out.push(...applyInline(text.slice(last),rest));
  return out;
}
function ri(text:string):React.ReactNode{return<>{applyInline(text,IPATS)}</>;}

function renderMd(raw:string):React.ReactNode{
  if(!raw)return null;
  const lines=raw.split('\n');const blocks:React.ReactNode[]=[];let i=0;
  while(i<lines.length){
    const line=lines[i];
    if(line.startsWith('```')){
      const lang=line.slice(3).trim();const cl:string[]=[];i++;
      while(i<lines.length&&!lines[i].startsWith('```')){cl.push(lines[i]);i++;}
      const content=cl.join('\n');
      if(lang==='ansi'){blocks.push(<pre key={_k++}style={ANSI_CB}>{renderAnsi(content)}</pre>);}
      else{blocks.push(<pre key={_k++}style={CB_S}>{content}</pre>);}
      i++;continue;
    }
    if(line.startsWith('>>> ')){const q=[line.slice(4),...lines.slice(i+1)].join('\n');blocks.push(<div key={_k++}style={{display:'flex',margin:'4px 0'}}><div style={{width:4,background:'#4e5058',borderRadius:4,flexShrink:0,marginRight:12}}/><div style={{flex:1,minWidth:0}}>{renderMd(q)}</div></div>);break;}
    if(line.startsWith('-# '))     {blocks.push(<div key={_k++}style={{fontSize:12,color:'#80848e',lineHeight:1.375,fontFamily:EMO}}>{ri(line.slice(3))}</div>);}
    else if(line.startsWith('### ')){blocks.push(<div key={_k++}style={{fontSize:15,fontWeight:700,color:'#f2f3f5',margin:'4px 0 2px',fontFamily:EMO}}>{ri(line.slice(4))}</div>);}
    else if(line.startsWith('## ')) {blocks.push(<div key={_k++}style={{fontSize:18,fontWeight:700,color:'#f2f3f5',margin:'6px 0 2px',fontFamily:EMO}}>{ri(line.slice(3))}</div>);}
    else if(line.startsWith('# '))  {blocks.push(<div key={_k++}style={{fontSize:22,fontWeight:700,color:'#f2f3f5',margin:'8px 0 2px',fontFamily:EMO}}>{ri(line.slice(2))}</div>);}
    else if(line.startsWith('> ')){
      const ql:string[]=[];
      while(i<lines.length&&lines[i].startsWith('> ')){ql.push(lines[i].slice(2));i++;}
      blocks.push(<div key={_k++}style={{display:'flex',margin:'4px 0'}}><div style={{width:4,background:'#4e5058',borderRadius:4,flexShrink:0,marginRight:12}}/><div style={{flex:1,minWidth:0}}>{renderMd(ql.join('\n'))}</div></div>);
      continue;
    }else if(/^( {0,3})[-*] /.test(line)){
      blocks.push(<div key={_k++}style={{display:'flex',gap:6,lineHeight:1.375,paddingLeft:4,fontFamily:EMO}}><span style={{color:'#b5bac1',flexShrink:0}}>•</span><span>{ri(line.replace(/^( {0,3})[-*] /,''))}</span></div>);
    }else if(/^\d+\. /.test(line)){
      const dot=line.indexOf('. ');const num=line.slice(0,dot);
      blocks.push(<div key={_k++}style={{display:'flex',gap:6,lineHeight:1.375,paddingLeft:4,fontFamily:EMO}}><span style={{color:'#b5bac1',flexShrink:0,minWidth:16,textAlign:'right'}}>{num}.</span><span>{ri(line.slice(dot+2))}</span></div>);
    }else if(line===''){blocks.push(<div key={_k++}style={{height:6}}/>);}
    else{blocks.push(<div key={_k++}style={{lineHeight:1.375,color:'#dbdee1',fontFamily:EMO}}>{ri(line)}</div>);}
    i++;
  }
  return<>{blocks}</>;
}

// ── Preview ───────────────────────────────────────────────────────────────────

function EmbedPreview({embed}:{embed:DiscordEmbed}){
  const { lang } = useT();
  const locales: Record<string,string> = { es: 'es', en: 'en', pt: 'pt-BR' };
  const bar=colorToHex(embed.color);
  const rows:EmbedField[][]=[];let row:EmbedField[]=[];
  for(const f of embed.fields){if(!f.inline){if(row.length){rows.push(row);row=[];}rows.push([f]);}else{row.push(f);if(row.length===3){rows.push(row);row=[];}}}
  if(row.length)rows.push(row);
  const has=embed.title||embed.description||embed.author_name||embed.fields.length||embed.image||embed.thumbnail||embed.footer_text||embed.timestamp;
  if(!has)return null;
  return(
    <div style={{display:'flex',maxWidth:520,borderRadius:4,overflow:'hidden',background:'#2b2d31',marginBottom:4}}>
      <div style={{width:4,background:bar,flexShrink:0}}/>
      <div style={{flex:1,padding:'12px 16px 12px 12px',minWidth:0}}>
        <div style={{display:'flex',gap:16}}>
          <div style={{flex:1,minWidth:0}}>
            {embed.author_name&&<div style={{display:'flex',alignItems:'center',gap:7,marginBottom:7}}>
              {embed.author_icon&&<img src={embed.author_icon}style={{width:20,height:20,borderRadius:'50%',objectFit:'cover'}}alt=""onError={e=>(e.currentTarget.style.display='none')}/>}
              <span style={{fontSize:13,fontWeight:600,color:'#dbdee1'}}>{embed.author_url?<a href={embed.author_url}target="_blank"rel="noreferrer"style={{color:'inherit',textDecoration:'none'}}>{embed.author_name}</a>:embed.author_name}</span>
            </div>}
            {embed.title&&<div style={{fontSize:15,fontWeight:700,color:embed.url?'#00a8fc':'#dbdee1',marginBottom:6,wordBreak:'break-word'}}>{embed.url?<a href={embed.url}target="_blank"rel="noreferrer"style={{color:'inherit',textDecoration:'none'}}>{ri(embed.title)}</a>:ri(embed.title)}</div>}
            {embed.description&&<div style={{fontSize:14,color:'#dbdee1',lineHeight:1.5,marginBottom:rows.length?8:0,wordBreak:'break-word'}}>{renderMd(embed.description)}</div>}
          </div>
          {embed.thumbnail&&<div style={{flexShrink:0}}><img src={embed.thumbnail}style={{width:80,height:80,borderRadius:4,objectFit:'cover'}}alt=""onError={e=>(e.currentTarget.style.display='none')}/></div>}
        </div>
        {rows.length>0&&<div style={{marginTop:8,display:'flex',flexDirection:'column',gap:8}}>
          {rows.map((row,ri2)=>(
            <div key={ri2}style={{display:'grid',gridTemplateColumns:`repeat(${row.length===1&&!row[0].inline?1:row.length},1fr)`,gap:8}}>
              {row.map(f=><div key={f._id}>
                <div style={{fontSize:13,fontWeight:700,color:'#dbdee1',marginBottom:2,wordBreak:'break-word'}}>{ri(f.name)}</div>
                <div style={{fontSize:13,color:'#dbdee1',lineHeight:1.45,wordBreak:'break-word'}}>{renderMd(f.value)}</div>
              </div>)}
            </div>
          ))}
        </div>}
        {embed.image&&<div style={{marginTop:12}}><img src={embed.image}style={{maxWidth:'100%',borderRadius:4}}alt=""onError={e=>(e.currentTarget.style.display='none')}/></div>}
        {(embed.footer_text||embed.timestamp)&&<div style={{display:'flex',alignItems:'center',gap:6,marginTop:10}}>
          {embed.footer_icon&&<img src={embed.footer_icon}style={{width:16,height:16,borderRadius:'50%'}}alt=""onError={e=>(e.currentTarget.style.display='none')}/>}
          <span style={{fontSize:12,color:'#87898c'}}>{embed.footer_text}{embed.footer_text&&embed.timestamp?' • ':''}{embed.timestamp&&new Date().toLocaleDateString(locales[lang]??'en',{year:'numeric',month:'long',day:'numeric'})}</span>
        </div>}
      </div>
    </div>
  );
}

function MessagePreview({msg,idx,whName,whAvatar,fetchedInfo}:{msg:DiscordMessage;idx:number;whName:string;whAvatar:string;fetchedInfo?:{username:string;avatar:string|null}|null}){
  const { t, lang } = useT();
  const locales: Record<string,string> = { es: 'es', en: 'en', pt: 'pt-BR' };
  const now=new Date().toLocaleTimeString(locales[lang]??'en',{hour:'2-digit',minute:'2-digit'});
  const displayName=whName||fetchedInfo?.username||'Bot';
  const displayAvatar=whAvatar||(fetchedInfo?.avatar??'');
  const hasAny=msg.content.trim()||msg.embeds.some(e=>e.title||e.description||e.author_name||e.image||e.thumbnail||e.footer_text||e.fields.length);
  if(!hasAny)return<div style={{padding:'8px 0',color:'#5c5f66',fontSize:12,fontStyle:'italic'}}>{t('eb_message',idx+1)} —</div>;
  return(
    <div style={{display:'flex',gap:14,fontFamily:EMO,padding:'4px 0 12px',borderBottom:'1px solid #1e1f22',marginBottom:8}}>
      <div style={{width:40,height:40,borderRadius:'50%',flexShrink:0,overflow:'hidden'}}>
        {displayAvatar?<img src={displayAvatar}style={{width:40,height:40,objectFit:'cover'}}alt=""onError={e=>(e.currentTarget.style.display='none')}/>:<div style={{width:40,height:40,background:'#5865f2',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:18,fontWeight:700}}>{displayName[0]?.toUpperCase()||'B'}</div>}
      </div>
      <div style={{flex:1,minWidth:0}}>
        <div style={{display:'flex',alignItems:'baseline',gap:8,marginBottom:4}}>
          <span style={{fontSize:15,fontWeight:700,color:'#dbdee1'}}>{displayName}</span>
          <span style={{fontSize:10,background:'#5865f2',color:'#fff',borderRadius:3,padding:'1px 5px',fontWeight:700}}>BOT</span>
          <span style={{fontSize:12,color:'#80848e'}}>{now}</span>
        </div>
        {msg.content&&<div style={{fontSize:15,color:'#dbdee1',lineHeight:1.5,marginBottom:4,wordBreak:'break-word'}}>{renderMd(msg.content)}</div>}
        {msg.embeds.map(e=><EmbedPreview key={e._id}embed={e}/>)}
        {/* Link button rows preview */}
        {(msg.rows||[]).filter(r=>r.buttons.some(b=>b.label||b.url)).map(row=>(
          <div key={row._id} style={{display:'flex',flexWrap:'wrap',gap:6,marginTop:4}}>
            {row.buttons.filter(b=>b.label||b.url).map(btn=>(
              <a key={btn._id} href={btn.url||'#'} target="_blank" rel="noreferrer"
                style={{display:'inline-flex',alignItems:'center',gap:5,padding:'5px 14px',background:'#4e5058',borderRadius:4,color:'#dbdee1',textDecoration:'none',fontSize:14,fontWeight:500,border:'none',cursor:btn.disabled?'not-allowed':'pointer',opacity:btn.disabled?.5:1}}
                onClick={e=>{if(!btn.url||btn.disabled)e.preventDefault();}}>
                {btn.emoji&&<span style={{fontFamily:"'Apple Color Emoji','Segoe UI Emoji',sans-serif"}}>{btn.emoji}</span>}
                {btn.label||'Button'}
                <i className="fi fi-sr-link" style={{fontSize:10,opacity:.6}}/>
              </a>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Form atoms ────────────────────────────────────────────────────────────────

const IS:React.CSSProperties={background:'#1e1f22',border:'1px solid #383a40',borderRadius:4,color:'#dbdee1',fontSize:13,padding:'6px 9px',outline:'none',width:'100%',boxSizing:'border-box',fontFamily:'inherit'};
const LS:React.CSSProperties={fontSize:11,fontWeight:700,color:'#72767d',textTransform:'uppercase',letterSpacing:'.05em',marginBottom:3,display:'block'};
const IB:React.CSSProperties={background:'none',border:'none',cursor:'pointer',borderRadius:3,padding:'3px 5px',display:'inline-flex',alignItems:'center',justifyContent:'center',lineHeight:1};

function Inp({label,value,onChange,placeholder,type='text',hint,maxLen}:{label?:string;value:string;onChange:(v:string)=>void;placeholder?:string;type?:string;hint?:string;maxLen?:number}){
  const over=maxLen&&value.length>maxLen;
  return(
    <div style={{display:'flex',flexDirection:'column',marginBottom:8}}>
      {(label||hint||maxLen)&&<div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
        {label&&<label style={LS}>{label}</label>}
        {maxLen&&<span style={{fontSize:10,color:over?'#ed4245':value.length>maxLen*0.85?'#fcc419':'#4e5058'}}>{value.length}/{maxLen}</span>}
      </div>}
      <input type={type}value={value}onChange={e=>onChange(e.target.value)}placeholder={placeholder}style={{...IS,borderColor:over?'#ed4245':undefined}}/>
      {hint&&<span style={{fontSize:10,color:'#4e5058',marginTop:3}}>{hint}</span>}
    </div>
  );
}
function Tex({label,value,onChange,placeholder,rows=3,maxLen}:{label?:string;value:string;onChange:(v:string)=>void;placeholder?:string;rows?:number;maxLen?:number}){
  const over=maxLen&&value.length>maxLen;
  return(
    <div style={{display:'flex',flexDirection:'column',marginBottom:8}}>
      {(label||maxLen)&&<div style={{display:'flex',justifyContent:'space-between',marginBottom:3}}>
        {label&&<label style={LS}>{label}</label>}
        {maxLen&&<span style={{fontSize:10,color:over?'#ed4245':value.length>maxLen*0.85?'#fcc419':'#4e5058'}}>{value.length}/{maxLen}</span>}
      </div>}
      <textarea value={value}onChange={e=>onChange(e.target.value)}placeholder={placeholder}rows={rows}style={{...IS,resize:'vertical',borderColor:over?'#ed4245':undefined}}/>
    </div>
  );
}
function Row2({children}:{children:React.ReactNode}){return<div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>{children}</div>;}
function Row3({children}:{children:React.ReactNode}){return<div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:8}}>{children}</div>;}

function Collapsible({label,icon,children,defaultOpen=false}:{label:string;icon?:string;children:React.ReactNode;defaultOpen?:boolean}){
  const [open,setOpen]=useState(defaultOpen);
  return(
    <div style={{borderTop:'1px solid #1e1f22',paddingTop:4,marginTop:4}}>
      <button onClick={()=>setOpen(o=>!o)}style={{background:'none',border:'none',cursor:'pointer',color:'#72767d',fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'.04em',padding:'3px 0',display:'flex',alignItems:'center',gap:5,width:'100%',textAlign:'left'}}>
        <i className={`fi fi-sr-angle-small-${open?'up':'down'}`}style={{fontSize:10}}/>
        {icon&&<i className={`fi fi-sr-${icon}`}style={{fontSize:10}}/>}
        {label}
      </button>
      {open&&<div style={{paddingTop:8}}>{children}</div>}
    </div>
  );
}

// ── Embed item ────────────────────────────────────────────────────────────────

function EmbedItem({embed,onChange,onRemove,onDup,onMoveUp,onMoveDown,canUp,canDown}:{
  embed:DiscordEmbed;onChange:(p:Partial<DiscordEmbed>)=>void;onRemove:()=>void;onDup:()=>void;
  onMoveUp:()=>void;onMoveDown:()=>void;canUp:boolean;canDown:boolean;
}){
  const { t } = useT();
  const [open,setOpen]=useState(false);
  const bar=colorToHex(embed.color);
  const label=embed.title?embed.title.slice(0,34)+(embed.title.length>34?'…':''):t('eb_no_title');
  const DTOT=embed.author_name.length+embed.title.length+embed.description.length+embed.fields.reduce((t,f)=>t+f.name.length+f.value.length,0)+embed.footer_text.length;

  const updField=(fid:string,p:Partial<EmbedField>)=>onChange({fields:embed.fields.map(f=>f._id===fid?{...f,...p}:f)});
  const delField=(fid:string)=>onChange({fields:embed.fields.filter(f=>f._id!==fid)});
  const addField=()=>{if(embed.fields.length<25)onChange({fields:[...embed.fields,newField()]});};

  return(
    <div style={{borderLeft:`3px solid ${bar}`,background:'#252528',borderRadius:'0 5px 5px 0',marginBottom:4,overflow:'hidden'}}>
      {/* Header row */}
      <div style={{display:'flex',alignItems:'center',gap:4,padding:'7px 8px',cursor:'pointer',userSelect:'none'}}onClick={()=>setOpen(o=>!o)}>
        <span style={{color:'#5c5f66',fontSize:10,width:12,flexShrink:0}}>{open?'▾':'▸'}</span>
        <div style={{flex:1,minWidth:0}}>
          <span style={{fontSize:13,color:'#dbdee1',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',display:'block'}}>{label}</span>
        </div>
        <div style={{display:'flex',gap:1,flexShrink:0}}onClick={e=>e.stopPropagation()}>
          <span style={{fontSize:10,color:DTOT>6000?'#ed4245':DTOT>5000?'#fcc419':'#4e5058',marginRight:4}}>{DTOT}</span>
          <button style={{...IB,color:canUp?'#72767d':'#2e2f35',fontSize:12}}onClick={onMoveUp}disabled={!canUp}title="Subir">↑</button>
          <button style={{...IB,color:canDown?'#72767d':'#2e2f35',fontSize:12}}onClick={onMoveDown}disabled={!canDown}title="Bajar">↓</button>
          <button style={{...IB,color:'#72767d',fontSize:11}}onClick={onDup}title="Duplicar">⧉</button>
          <button style={{...IB,color:'#ed4245',fontSize:11}}onClick={()=>{if(confirm(t('eb_confirm_embed')))onRemove();}}>  <i className="fi fi-sr-trash"style={{fontSize:10}}/></button>
        </div>
        <span style={{color:'#3a3b42',fontSize:10,marginLeft:2}}>{open?'▴':'▾'}</span>
      </div>

      {open&&(
        <div style={{padding:'0 12px 12px',borderTop:'1px solid #1e1f22'}}>
          <div style={{height:10}}/>

          {/* Color */}
          <div style={{display:'flex',flexDirection:'column',marginBottom:10}}>
            <label style={LS}>{t('eb_color')}</label>
            <div style={{display:'flex',gap:8,alignItems:'center'}}>
              <input type="color"value={colorToHex(embed.color)}onChange={e=>onChange({color:hexToColor(e.target.value)})}style={{width:34,height:28,border:'none',borderRadius:4,cursor:'pointer',padding:2,background:'#1e1f22',flexShrink:0}}/>
              <input value={colorToHex(embed.color)}onChange={e=>{const v=e.target.value;if(/^#[0-9a-fA-F]{6}$/.test(v))onChange({color:hexToColor(v)});}}style={{...IS,width:90,fontFamily:'monospace'}}placeholder="#5865f2"/>
              <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
                {['#5865f2','#57f287','#fee75c','#eb459e','#ed4245','#ff7b00','#2aa198'].map(c=>(
                  <div key={c}onClick={()=>onChange({color:hexToColor(c)})}style={{width:16,height:16,borderRadius:3,background:c,cursor:'pointer',border:colorToHex(embed.color)===c?'2px solid #fff':'2px solid transparent'}}/>
                ))}
                <button onClick={()=>onChange({color:null})}style={{background:'#1e1f22',border:'1px solid #383a40',borderRadius:3,color:'#72767d',cursor:'pointer',fontSize:10,padding:'2px 6px'}}>{t('eb_no_color')}</button>
              </div>
            </div>
          </div>

          {/* Author */}
          <Collapsible label={t('eb_author')} icon="user">
            <Inp label={t('eb_author_name')}value={embed.author_name}onChange={v=>onChange({author_name:v})}placeholder={t('eb_author_name')}maxLen={256}/>
            <Row2>
              <Inp label={t('eb_author_url')}value={embed.author_url}onChange={v=>onChange({author_url:v})}placeholder="https://..."/>
              <Inp label={t('eb_author_icon')}value={embed.author_icon}onChange={v=>onChange({author_icon:v})}placeholder="https://..."/>
            </Row2>
          </Collapsible>

          {/* Title + URL */}
          <div style={{height:6}}/>
          <Inp label={t('eb_title_f')}value={embed.title}onChange={v=>onChange({title:v})}placeholder={t('eb_title_f')}maxLen={256}/>
          <Inp label={t('eb_title_url')}value={embed.url}onChange={v=>onChange({url:v})}placeholder={t('eb_title_url_hint')}/>

          {/* Description */}
          <Tex label={t('eb_description')}value={embed.description}onChange={v=>onChange({description:v})}placeholder={t('eb_desc_ph')}rows={5}maxLen={4096}/>

          {/* Fields */}
          <Collapsible label={t('eb_fields',embed.fields.length)}icon="th-list"defaultOpen={embed.fields.length>0}>
            {embed.fields.map((f,fi)=>(
              <div key={f._id}style={{background:'#1e1f22',borderRadius:4,padding:'8px',marginBottom:6,border:'1px solid #2e2f35'}}>
                <div style={{display:'flex',alignItems:'center',gap:5,marginBottom:5}}>
                  <span style={{fontSize:10,color:'#4e5058',fontWeight:700,flex:1}}>{t('eb_field_n',fi+1)}</span>
                  <label style={{display:'flex',alignItems:'center',gap:4,fontSize:11,color:'#b5bac1',cursor:'pointer'}}>
                    <input type="checkbox"checked={f.inline}onChange={e=>updField(f._id,{inline:e.target.checked})}style={{width:'auto',margin:0}}/>{t('eb_inline')}
                  </label>
                  <button onClick={()=>{const arr=[...embed.fields];arr.splice(fi,0,{...f,_id:uid()});onChange({fields:arr});}}style={{...IB,color:'#72767d',fontSize:11}}>⧉</button>
                  <button onClick={()=>delField(f._id)}style={{...IB,color:'#ed4245',fontSize:12}}>✕</button>
                </div>
                <Inp value={f.name}onChange={v=>updField(f._id,{name:v})}placeholder={t('eb_field_name_ph')}maxLen={256}/>
                <Tex value={f.value}onChange={v=>updField(f._id,{value:v})}placeholder={t('eb_field_value_ph')}rows={2}maxLen={1024}/>
              </div>
            ))}
            <button onClick={addField}disabled={embed.fields.length>=25}
              style={{width:'100%',padding:'6px',background:'rgba(88,101,242,.1)',border:'1px dashed rgba(88,101,242,.3)',borderRadius:4,color:embed.fields.length>=25?'#3f4147':'#8b94e5',cursor:embed.fields.length>=25?'not-allowed':'pointer',fontSize:12,fontWeight:600}}>
              <i className="fi fi-sr-plus-small"style={{marginRight:4,fontSize:11}}/>{t('eb_add_field')}
            </button>
          </Collapsible>

          {/* Images */}
          <Collapsible label={t('eb_images')} icon="picture">
            <Row2>
              <Inp label={t('eb_image')}value={embed.image}onChange={v=>onChange({image:v})}placeholder="https://..."/>
              <Inp label={t('eb_thumbnail')}value={embed.thumbnail}onChange={v=>onChange({thumbnail:v})}placeholder="https://..."/>
            </Row2>
            {(embed.image||embed.thumbnail)&&(
              <div style={{display:'flex',gap:8,marginTop:4}}>
                {embed.image&&<img src={embed.image}style={{maxHeight:60,maxWidth:120,borderRadius:4,objectFit:'cover'}}alt=""onError={e=>(e.currentTarget.style.display='none')}/>}
                {embed.thumbnail&&<img src={embed.thumbnail}style={{width:60,height:60,borderRadius:4,objectFit:'cover'}}alt=""onError={e=>(e.currentTarget.style.display='none')}/>}
              </div>
            )}
          </Collapsible>

          {/* Footer */}
          <Collapsible label={t('eb_footer')} icon="info">
            <Inp label={t('eb_footer_text')}value={embed.footer_text}onChange={v=>onChange({footer_text:v})}placeholder={t('eb_footer_text')}maxLen={2048}/>
            <Inp label={t('eb_footer_icon')}value={embed.footer_icon}onChange={v=>onChange({footer_icon:v})}placeholder="https://..."/>
            <label style={{display:'flex',alignItems:'center',gap:7,fontSize:12,color:'#b5bac1',cursor:'pointer',marginTop:2}}>
              <input type="checkbox"checked={embed.timestamp}onChange={e=>onChange({timestamp:e.target.checked})}style={{width:'auto',margin:0}}/>
              {t('eb_timestamp')}
            </label>
          </Collapsible>

          {/* ANSI helper */}
          <Collapsible label={t('eb_ansi')}>
            <div style={{fontSize:11,color:'#72767d',lineHeight:1.6}}>
              {t('eb_ansi_tip')} <code style={{background:'#1e1f22',padding:'1px 4px',borderRadius:3,fontSize:10}}>{`\`\`\`ansi`}</code><br/>
              Códigos de color: <span style={{color:'#dc322f'}}>31</span> <span style={{color:'#859900'}}>32</span> <span style={{color:'#b58900'}}>33</span> <span style={{color:'#268bd2'}}>34</span> <span style={{color:'#d33682'}}>35</span> <span style={{color:'#2aa198'}}>36</span> <span style={{color:'#dcddde'}}>37</span><br/>
              Modificadores: <code style={{background:'#1e1f22',padding:'1px 4px',borderRadius:3,fontSize:10}}>1</code>=bold <code style={{background:'#1e1f22',padding:'1px 4px',borderRadius:3,fontSize:10}}>2</code>=tenue <code style={{background:'#1e1f22',padding:'1px 4px',borderRadius:3,fontSize:10}}>4</code>=subrayado <code style={{background:'#1e1f22',padding:'1px 4px',borderRadius:3,fontSize:10}}>0</code>=reset
            </div>
            <pre style={{...ANSI_CB,fontSize:11,marginTop:6}}>{renderAnsi(`${ESC}[1;32mVerde bold${ESC}[0m  ${ESC}[2;33mAmarillo tenue${ESC}[0m  ${ESC}[4;34mAzul subrayado${ESC}[0m\n${ESC}[1;45m${ESC}[1;37m fondo morado ${ESC}[0m  ${ESC}[2;31mRojo dim${ESC}[0m`)}</pre>
          </Collapsible>
        </div>
      )}
    </div>
  );
}

// ── Message section ───────────────────────────────────────────────────────────

function MessageSection({msg,onChange,onRemove,onDup,index,total,forceCollapse}:{
  msg:DiscordMessage;onChange:(p:Partial<DiscordMessage>)=>void;onRemove:()=>void;onDup:()=>void;index:number;total:number;forceCollapse?:boolean;
}){
  const { t } = useT();
  const [open,setOpen]=useState(true);
  const effectiveOpen=forceCollapse?false:open;
  const contentRef=useRef<HTMLTextAreaElement>(null);
  const preview=msg.content.trim().slice(0,50)||(msg.embeds[0]?.title?msg.embeds[0].title.slice(0,50):'');
  const LIMIT=2000;const len=msg.content.length;
  const rows=msg.rows||[];

  const updRow=(rid:string,patch:Partial<ButtonRow>)=>onChange({rows:rows.map(r=>r._id===rid?{...r,...patch}:r)});
  const delRow=(rid:string)=>onChange({rows:rows.filter(r=>r._id!==rid)});
  const addRow=()=>{if(rows.length>=5){addToast(t('eb_max_rows'),'warn');return;}onChange({rows:[...rows,newRow()]});};
  const updBtn=(rid:string,bid:string,p:Partial<LinkButton>)=>updRow(rid,{buttons:rows.find(r=>r._id===rid)!.buttons.map(b=>b._id===bid?{...b,...p}:b)});
  const delBtn=(rid:string,bid:string)=>updRow(rid,{buttons:rows.find(r=>r._id===rid)!.buttons.filter(b=>b._id!==bid)});
  const addBtn=(rid:string)=>{const r=rows.find(x=>x._id===rid)!;if(r.buttons.length>=5){addToast(t('eb_max_btns_row'),'warn');return;}updRow(rid,{buttons:[...r.buttons,newBtn()]});};

  const updateEmbed=(eid:string,patch:Partial<DiscordEmbed>)=>onChange({embeds:msg.embeds.map(e=>e._id===eid?{...e,...patch}:e)});
  const removeEmbed=(eid:string)=>onChange({embeds:msg.embeds.filter(e=>e._id!==eid)});
  const dupEmbed=(eid:string)=>{
    const idx=msg.embeds.findIndex(e=>e._id===eid);if(idx===-1)return;
    const copy={...msg.embeds[idx],_id:uid(),fields:msg.embeds[idx].fields.map(f=>({...f,_id:uid()}))};
    const arr=[...msg.embeds];arr.splice(idx+1,0,copy);onChange({embeds:arr});
  };
  const moveEmbed=(idx:number,dir:-1|1)=>{
    const arr=[...msg.embeds];const t=idx+dir;if(t<0||t>=arr.length)return;
    [arr[idx],arr[t]]=[arr[t],arr[idx]];onChange({embeds:arr});
  };

  return(
    <div style={{border:'1px solid #383a40',borderRadius:6,marginBottom:8,overflow:'hidden'}}>
      <div style={{display:'flex',alignItems:'center',gap:6,padding:'9px 12px',background:'#25262b',cursor:'pointer'}}onClick={()=>setOpen(o=>!o)}>
        <span style={{color:'#5c5f66',fontSize:10,width:14,flexShrink:0}}>{effectiveOpen?'▾':'▸'}</span>
        <div style={{flex:1,minWidth:0}}>
          <span style={{fontSize:12,fontWeight:700,color:'#b5bac1'}}>{t('eb_message',index+1)}</span>
          {preview&&<span style={{fontSize:11,color:'#4e5058',marginLeft:6,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',maxWidth:160,display:'inline-block',verticalAlign:'bottom'}}>— {preview}</span>}
        </div>
        <div style={{display:'flex',gap:2}}onClick={e=>e.stopPropagation()}>
          <button style={{...IB,color:'#72767d',fontSize:11}}onClick={onDup}title="Duplicar mensaje">⧉</button>
          {total>1&&<button style={{...IB,color:'#ed4245',fontSize:11}}onClick={()=>{if(confirm(t('eb_confirm_msg')))onRemove();}}><i className="fi fi-sr-trash"style={{fontSize:10}}/></button>}
        </div>
      </div>

      {effectiveOpen&&(
        <div style={{padding:'12px',background:'#2b2d31'}}>
          {/* Content */}
          <div style={{display:'flex',flexDirection:'column',marginBottom:10}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:3}}>
              <label style={LS}>{t('eb_content')}</label>
              <span style={{fontSize:10,color:len>LIMIT?'#ed4245':len>LIMIT*0.85?'#fcc419':'#4e5058'}}>{len}/{LIMIT}</span>
            </div>
            <FormatToolbar targetRef={contentRef} onChange={v=>onChange({content:v})}/>
            <textarea ref={contentRef} value={msg.content}onChange={e=>onChange({content:e.target.value})}
              placeholder={t('eb_content_ph')}rows={3}
              style={{...IS,resize:'vertical',borderColor:len>LIMIT?'#ed4245':undefined}}/>
          </div>

          {/* Embed list */}
          {msg.embeds.map((e,ei)=>(
            <EmbedItem key={e._id}embed={e}canUp={ei>0}canDown={ei<msg.embeds.length-1}
              onChange={p=>updateEmbed(e._id,p)}
              onRemove={()=>removeEmbed(e._id)}
              onDup={()=>dupEmbed(e._id)}
              onMoveUp={()=>moveEmbed(ei,-1)}
              onMoveDown={()=>moveEmbed(ei,1)}
            />
          ))}

          {/* Add embed button */}
          <button onClick={()=>{if(msg.embeds.length>=10){addToast(t('eb_max_embeds'),'warn');return;}onChange({embeds:[...msg.embeds,newEmbed()]});}}
            disabled={msg.embeds.length>=10}
            style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'center',gap:6,padding:'7px',background:'rgba(88,101,242,.08)',border:`1px dashed ${msg.embeds.length>=10?'#2e2f35':'rgba(88,101,242,.35)'}`,borderRadius:5,color:msg.embeds.length>=10?'#3f4147':'#8b94e5',cursor:msg.embeds.length>=10?'not-allowed':'pointer',fontSize:12,fontWeight:600,marginTop:4}}>
            <i className="fi fi-sr-plus-small"style={{fontSize:12}}/>{t('eb_add_embed',msg.embeds.length)}
          </button>

          {/* Link button rows */}
          <div style={{marginTop:8,borderTop:'1px solid #1e1f22',paddingTop:8}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:rows.length?6:0}}>
              <span style={{...LS,marginBottom:0}}>{t('eb_link_btns',rows.length,5)}</span>
              <button onClick={addRow}disabled={rows.length>=5}style={{...IB,color:rows.length>=5?'#2e2f35':'#57f287',fontSize:11,fontWeight:700}}>
                {t('eb_add_row')}
              </button>
            </div>
            {rows.map((row,ri)=>(
              <div key={row._id} style={{background:'#1e1f22',borderRadius:4,padding:'8px',marginBottom:6,border:'1px solid #2e2f35'}}>
                <div style={{display:'flex',alignItems:'center',gap:5,marginBottom:5}}>
                  <span style={{fontSize:10,color:'#4e5058',fontWeight:700,flex:1}}>{t('eb_btn_row_n',ri+1)}</span>
                  <button onClick={()=>addBtn(row._id)}disabled={row.buttons.length>=5}style={{...IB,color:row.buttons.length>=5?'#2e2f35':'#72767d',fontSize:10}}>{t('eb_add_link_btn')}</button>
                  <button onClick={()=>delRow(row._id)}style={{...IB,color:'#ed4245',fontSize:11}}>✕</button>
                </div>
                {row.buttons.map((btn,bi)=>(
                  <div key={btn._id} style={{display:'flex',gap:4,alignItems:'flex-start',marginBottom:4}}>
                    <div style={{flex:2,display:'flex',flexDirection:'column',gap:3}}>
                      <input value={btn.label}onChange={e=>updBtn(row._id,btn._id,{label:e.target.value})}placeholder={t('eb_btn_label_ph')}style={{...IS,padding:'4px 6px',fontSize:11}}/>
                      <input value={btn.url}onChange={e=>updBtn(row._id,btn._id,{url:e.target.value})}placeholder={t('eb_btn_url_ph')}style={{...IS,padding:'4px 6px',fontSize:11}}/>
                    </div>
                    <input value={btn.emoji}onChange={e=>updBtn(row._id,btn._id,{emoji:e.target.value})}placeholder={t('eb_btn_emoji_ph')}style={{...IS,width:80,padding:'4px 6px',fontSize:11}}/>
                    <button onClick={()=>delBtn(row._id,btn._id)}style={{...IB,color:'#4e5058',fontSize:11,marginTop:2}}
                      onMouseEnter={e=>(e.currentTarget.style.color='#ed4245')}onMouseLeave={e=>(e.currentTarget.style.color='#4e5058')}>✕</button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── App ───────────────────────────────────────────────────────────────────────

function loadState():AppState{
  try{
    const h=typeof window!=='undefined'?window.location.hash.slice(1):'';
    if(h){
      const s=decodeState(h) as any;
      if(s?.messages){
        return {messages:(s.messages as any[]).map(m=>({...m,rows:m.rows||[]}))};
      }
    }
  }catch{}
  return makeExample();
}

export default function EmbedBuilder(){
  return <I18nProvider><EmbedBuilderCore/></I18nProvider>;
}

function EmbedBuilderCore(){
  const { t } = useT();
  const [state,setState]=useState<AppState>(()=>({messages:[newMessage()]}));
  const [mode,setMode]=useState<SendMode>('webhook');
  const [token,setToken]=useState('');
  const [channelId,setChannelId]=useState('');
  const [webhookUrl,setWebhookUrl]=useState('');
  const [whName,setWhName]=useState('');
  const [whAvatar,setWhAvatar]=useState('');
  const [threadId,setThreadId]=useState('');
  const [messageId,setMessageId]=useState('');
  const [sending,setSending]=useState(false);
  const [progress,setProgress]=useState('');
  const [status,setStatus]=useState<{msg:string;kind:'ok'|'err'|'info'}|null>(null);
  const [changelogOpen,setChangelogOpen]=useState(false);
  const [historyOpen,setHistoryOpen]=useState(false);
  const [templatesOpen,setTemplatesOpen]=useState(false);
  const [importOpen,setImportOpen]=useState(false);
  const [compactAll,setCompactAll]=useState(false);
  const [diffOpen,setDiffOpen]=useState(false);
  const [whAppearanceOpen,setWhAppearanceOpen]=useState(false);
  const [webhookFetchedInfo,setWebhookFetchedInfo]=useState<{username:string;avatar:string|null}|null>(null);
  const [botFetchedInfo,setBotFetchedInfo]=useState<{username:string;avatar:string|null}|null>(null);
  const [securityWarning,setSecurityWarning]=useState<'token'|'webhook'|null>(null);
  const diffSnapshotRef=useRef<unknown>(null);
  const warnedRef=useRef(new Set<string>());
  const previewRef=useRef<HTMLDivElement>(null);
  const loaded=useRef(false);

  useEffect(()=>{
    if(loaded.current)return;loaded.current=true;
    setState(loadState());
    try{
      setToken(localStorage.getItem('dcb_token')||'');
      setChannelId(localStorage.getItem('dcb_channel')||'');
      setWebhookUrl(localStorage.getItem('dcb_webhook')||'');
      setMode((localStorage.getItem('dcb_mode') as SendMode)||'webhook');
      setWhName(localStorage.getItem('dcb_wh_name')||'');
      setWhAvatar(localStorage.getItem('dcb_wh_avatar')||'');
      const warned=JSON.parse(localStorage.getItem('dcb_security_warned')||'[]');
      warnedRef.current=new Set(warned);
    }catch{}
  },[]);

  useEffect(()=>{if(typeof window!=='undefined')window.history.replaceState(null,'','#'+encodeState(state));},[state]);

  const handleCredentialFocus=(type:'token'|'webhook')=>{
    const isEmpty=type==='token'?!token:!webhookUrl;
    if(isEmpty&&!warnedRef.current.has(type)){
      warnedRef.current.add(type);
      try{localStorage.setItem('dcb_security_warned',JSON.stringify([...warnedRef.current]));}catch{}
      setSecurityWarning(type);
    }
  };

  // auto-fetch webhook info for preview
  useEffect(()=>{
    if(mode!=='webhook'||!webhookUrl.includes('/api/webhooks/')){setWebhookFetchedInfo(null);return;}
    const id=setTimeout(()=>{
      fetch('/api/webhook-info',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({webhookUrl})})
        .then(r=>r.ok?r.json():null)
        .then((d:any)=>{if(d?.username)setWebhookFetchedInfo({username:d.username,avatar:d.avatar??null});})
        .catch(()=>{});
    },800);
    return()=>clearTimeout(id);
  },[webhookUrl,mode]);

  // auto-fetch bot info for preview (bot token mode)
  useEffect(()=>{
    if(mode!=='bot'||!token||token.length<20){setBotFetchedInfo(null);return;}
    const id=setTimeout(async()=>{
      try{
        const res=await fetch(`/api/bot-info?token=${encodeURIComponent(token)}`);
        if(res.ok)setBotFetchedInfo(await res.json());
        else setBotFetchedInfo(null);
      }catch{setBotFetchedInfo(null);}
    },800);
    return()=>clearTimeout(id);
  },[token,mode]);

  // snapshot for diff: capture state when messageId is first set
  const prevMsgId=useRef('');
  useEffect(()=>{
    if(messageId&&messageId!==prevMsgId.current){
      diffSnapshotRef.current=JSON.parse(JSON.stringify(state.messages.map(m=>serializeMessage(m,whName,whAvatar))));
    }
    if(!messageId)diffSnapshotRef.current=null;
    prevMsgId.current=messageId;
  },[messageId]);

  // keyboard shortcuts
  useEffect(()=>{
    const handler=(e:KeyboardEvent)=>{
      if(!e.ctrlKey&&!e.metaKey)return;
      const tag=(e.target as HTMLElement)?.tagName;
      if(tag==='INPUT'||tag==='TEXTAREA'){if(e.key==='Enter'){e.preventDefault();handleSend();}return;}
      if(e.key==='s'){e.preventDefault();handleExport();}
      if(e.key==='Enter'){e.preventDefault();handleSend();}
    };
    document.addEventListener('keydown',handler);
    return()=>document.removeEventListener('keydown',handler);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[sending,state,mode,token,channelId,webhookUrl,threadId,messageId,whName,whAvatar]);

  const sv=(k:string,v:string)=>{try{localStorage.setItem(k,v);}catch{}};

  const updateMsg=useCallback((mid:string,patch:Partial<DiscordMessage>)=>
    setState(s=>({messages:s.messages.map(m=>m._id===mid?{...m,...patch}:m)})),[]);
  const removeMsg=useCallback((mid:string)=>
    setState(s=>({messages:s.messages.filter(m=>m._id!==mid)})),[]);
  const dupMsg=useCallback((mid:string)=>{
    setState(s=>{
      const idx=s.messages.findIndex(m=>m._id===mid);if(idx===-1)return s;
      const orig=s.messages[idx];
      const copy:DiscordMessage={...orig,_id:uid(),
        embeds:orig.embeds.map(e=>({...e,_id:uid(),fields:e.fields.map(f=>({...f,_id:uid()}))})),
        rows:(orig.rows||[]).map(r=>({...r,_id:uid(),buttons:r.buttons.map(b=>({...b,_id:uid()}))})),
      };
      const arr=[...s.messages];arr.splice(idx+1,0,copy);return{messages:arr};
    });
  },[]);

  const handleImport=useCallback((payload:ImportedPayload)=>{
    const msgs=payload.embeds||payload.content||payload.components?[{
      _id:uid(),
      content:payload.content||'',
      rows:(payload.components||[]).filter((c:any)=>c.type===1&&Array.isArray(c.components)).map((row:any)=>({
        _id:uid(),
        buttons:row.components.filter((b:any)=>b.style===5).map((b:any)=>({
          _id:uid(),label:b.label||'',url:b.url||'',emoji:b.emoji?.name||'',disabled:!!b.disabled,
        }))
      })),
      embeds:(payload.embeds||[]).map((e:any)=>({
        _id:uid(),
        color:e.color??null,
        author_name:e.author?.name||'',author_url:e.author?.url||'',author_icon:e.author?.icon_url||'',
        title:e.title||'',url:e.url||'',description:e.description||'',
        fields:(e.fields||[]).map((f:any)=>({_id:uid(),name:f.name||'',value:f.value||'',inline:!!f.inline})),
        image:e.image?.url||'',thumbnail:e.thumbnail?.url||'',
        footer_text:e.footer?.text||'',footer_icon:e.footer?.icon_url||'',timestamp:!!e.timestamp,
      })),
    }]:null;
    if(!msgs){addToast(t('import_err'),'err');return;}
    setState({messages:msgs});
    if(payload.username)setWhName(payload.username);
    if(payload.avatar_url)setWhAvatar(payload.avatar_url);
  },[t]);

  const getErr=(data:any)=>{let h='';if(data.errors){const m=JSON.stringify(data.errors).match(/"message":"([^"]+)"/);if(m)h=` — ${m[1]}`;}return`Error ${data.status??''}${data.code?` (${data.code})`:''}${data.message?': '+data.message:''}${h}`;};

  const handleSend=async()=>{
    const msgs=state.messages.map(m=>serializeMessage(m,whName,whAvatar));
    if(msgs.every(m=>!m.content&&(!m.embeds||!m.embeds.length))){addToast(t('eb_no_content'),'err');return;}
    if(messageId&&msgs.length>1){addToast(t('eb_only_one_edit'),'warn');return;}
    setSending(true);setStatus({msg:'…',kind:'info'});let ok=0;
    for(let i=0;i<msgs.length;i++){
      const payload=msgs[i];
      if(!payload.content&&(!payload.embeds||!payload.embeds.length))continue;
      setProgress(msgs.length>1?`Msg ${i+1}/${msgs.length}…`:'');
      try{
        let res:Response;
        if(mode==='webhook'){
          if(!webhookUrl){addToast(t('eb_err_webhook'),'err');setSending(false);return;}
          try{
            const u=new URL(webhookUrl);u.searchParams.set('wait','true');
            if(threadId.trim())u.searchParams.set('thread_id',threadId.trim());
            if(messageId)u.pathname=u.pathname+`/messages/${messageId}`;
            res=await fetch(u.toString(),{method:messageId?'PATCH':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)});
          }catch{addToast(t('eb_err_webhook_invalid'),'err');setSending(false);return;}
        }else{
          if(!token||!channelId){addToast(t('eb_err_creds'),'err');setSending(false);return;}
          res=await fetch('/api/embed-send',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...payload,token,channelId,threadId:threadId||undefined,messageId:messageId||undefined})});
        }
        const data=await res.json() as any;
        if(!res.ok){const msg=getErr({...data,status:res.status});setStatus({msg,kind:'err'});addToast(msg,'err');setSending(false);return;}
        ok++;if(msgs.length===1)setStatus({msg:`✓ ${t('eb_sent',data.id)}`,kind:'ok'});
        if(data.id)recordSend({id:data.id+Date.now(),msgId:data.id,mode});
      }catch(e){const msg=`Error de red: ${e}`;setStatus({msg,kind:'err'});addToast(msg,'err');setSending(false);return;}
    }
    if(ok>1){const m=`✓ ${t('eb_sent_multi',ok)}`;setStatus({msg:m,kind:'ok'});addToast(m,'ok');}
    setProgress('');setSending(false);
  };

  const handleExportPng=async()=>{
    const el=previewRef.current;if(!el)return;
    addToast(t('export_png'),'info');
    const h2c=(await import('html2canvas')).default;
    const canvas=await h2c(el,{backgroundColor:'#313338',scale:2,useCORS:true,logging:false});
    const a=document.createElement('a');
    a.href=canvas.toDataURL('image/png');
    a.download='discord-preview.png';
    a.click();
  };

  const handleExport=()=>{
    const msgs=state.messages.map(m=>serializeMessage(m,whName,whAvatar));
    const out=msgs.length===1?msgs[0]:msgs;
    const blob=new Blob([JSON.stringify(out,null,2)],{type:'application/json'});
    const url=URL.createObjectURL(blob);const a=document.createElement('a');
    a.href=url;a.download='embed.json';a.click();URL.revokeObjectURL(url);
    addToast(t('eb_exported'),'ok');
  };

  const totalEmbeds=state.messages.reduce((t,m)=>t+m.embeds.length,0);

  return(
    <div id="root">
      <ToastContainer/>
      {changelogOpen&&<ChangelogModal onClose={()=>setChangelogOpen(false)}/>}
      {historyOpen&&<SendHistoryModal onClose={()=>setHistoryOpen(false)} onLoadId={id=>setMessageId(id)}/>}
      {templatesOpen&&<TemplatesModal currentState={state} onLoad={s=>setState(s as AppState)} onClose={()=>setTemplatesOpen(false)}/>}
      {importOpen&&<ImportModal onImport={handleImport} onClose={()=>setImportOpen(false)}/>}
      {whAppearanceOpen&&<WebhookAppearanceModal webhookUrl={webhookUrl} overrideName={whName} overrideAvatar={whAvatar} onSave={(n,a)=>{setWhName(n);setWhAvatar(a);sv('dcb_wh_name',n);sv('dcb_wh_avatar',a);}} onClose={()=>setWhAppearanceOpen(false)}/>}
      {diffOpen&&<DiffModal original={diffSnapshotRef.current} current={state.messages.map(m=>serializeMessage(m,whName,whAvatar))} onClose={()=>setDiffOpen(false)}/>}

      {/* Security warning */}
      {securityWarning&&(
        <div className="modal-overlay">
          <div className="modal"style={{width:420}}>
            <div className="modal-header">
              <div className="modal-header-icon"style={{background:'rgba(252,196,25,.12)',color:'#fcc419'}}><i className="fi fi-sr-triangle-warning"/></div>
              <div className="modal-header-text">
                <h2 style={{color:'#fcc419'}}>{t('security_title')}</h2>
                <p>{securityWarning==='token'?t('security_label_token'):t('security_label_webhook')}</p>
              </div>
            </div>
            <div className="modal-body">
              <div className="tutorial-step">
                <div className="tutorial-step-desc">
                  {securityWarning==='token'?t('security_desc_token'):t('security_desc_webhook')}
                </div>
                <div className="security-tip">
                  <i className="fi fi-sr-lock"/> {t('security_local')}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary"style={{fontSize:12}}onClick={()=>{
                if(securityWarning)warnedRef.current.delete(securityWarning);
                setSecurityWarning(null);
                (document.activeElement as HTMLElement)?.blur();
              }}>{t('cancel')}</button>
              <button style={{background:'#b7950b',color:'#fff',fontSize:12,padding:'6px 16px',borderRadius:6,border:'none',cursor:'pointer',fontWeight:600}}
                onClick={()=>setSecurityWarning(null)}>{t('security_confirm')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="app-header">
        <a href="/"style={{display:'flex',alignItems:'center',gap:5,color:'#5865f2',textDecoration:'none',padding:'3px 8px',borderRadius:4,background:'rgba(88,101,242,.1)',fontSize:12,fontWeight:600}}>
          {t('eb_back')}
        </a>
        <div style={{width:1,height:18,background:'#383a40'}}/>
        <i className="fi fi-sr-rectangle-list"style={{color:'#a5b4fc',fontSize:15}}/>
        <h1>{t('eb_title')}</h1>
        {(botFetchedInfo&&mode==='bot')&&(
          <div style={{display:'flex',alignItems:'center',gap:6,fontSize:12,color:'#b5bac1'}}>
            {botFetchedInfo.avatar
              ?<img src={botFetchedInfo.avatar}style={{width:20,height:20,borderRadius:'50%',objectFit:'cover'}}alt=""/>
              :<div style={{width:20,height:20,borderRadius:'50%',background:'#5865f2',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:10,fontWeight:700}}>{botFetchedInfo.username[0]}</div>
            }
            <span style={{color:'#dbdee1'}}>{botFetchedInfo.username}</span>
            <span style={{background:'#5865f2',color:'#fff',borderRadius:3,padding:'0 4px',fontSize:9,fontWeight:700,textTransform:'uppercase'}}>BOT</span>
          </div>
        )}
        <div className="spacer"/>
        <LangSwitch/>
        <button className="btn-secondary" title={t('copy_link')} onClick={()=>{navigator.clipboard.writeText(window.location.href);addToast(t('copy_link_ok'),'ok');}} style={{padding:'6px 10px',fontSize:12}}>
          <i className="fi fi-sr-link"/>
        </button>
        <button className="btn-secondary" title={t('import_title')} onClick={()=>setImportOpen(true)} style={{padding:'6px 10px',fontSize:12}}>
          <i className="fi fi-sr-upload"/>
        </button>
        <button className="btn-secondary" title={t('tmpl_title')} onClick={()=>setTemplatesOpen(true)} style={{padding:'6px 10px',fontSize:12}}>
          <i className="fi fi-sr-bookmark"/>
        </button>
        <button className="btn-secondary" title={t('hist_title')} onClick={()=>setHistoryOpen(true)} style={{padding:'6px 10px',fontSize:12}}>
          <i className="fi fi-sr-clock"/>
        </button>
        <button className="btn-secondary" title={compactAll?t('expand_all'):t('compact_all')} onClick={()=>setCompactAll(v=>!v)} style={{padding:'6px 10px',fontSize:12}}>
          <i className={`fi fi-sr-${compactAll?'expand':'compress'}`}/>
        </button>
        <button className="btn-secondary" title="Changelog" onClick={()=>setChangelogOpen(true)} style={{padding:'6px 10px',fontSize:12}}>
          <i className="fi fi-sr-list"/>
        </button>
        <button className="btn-secondary"onClick={handleExportPng}title={t('export_png')}style={{fontSize:12}}>
          <i className="fi fi-sr-picture"style={{fontSize:11}}/> PNG
        </button>
        <button className="btn-secondary"onClick={handleExport}style={{fontSize:12}}>
          <i className="fi fi-sr-download"style={{fontSize:11}}/> {t('eb_export')}
        </button>
        <button className="btn-success btn-send"onClick={handleSend}disabled={sending}>
          {sending?<><i className="fi fi-sr-spinner"style={{fontSize:11}}/> {progress||t('eb_sending')}</>:<><i className="fi fi-sr-paper-plane"style={{fontSize:11}}/> {t('eb_send')}</>}
        </button>
      </header>

      <div className="app-body">
        {/* Left panel */}
        <div className="panel-left"style={{width:450}}>
          {/* Config */}
          <div className="config-bar">
            <div className="send-mode-toggle">
              <button className={`mode-btn${mode==='bot'?' active':''}`}onClick={()=>{setMode('bot');sv('dcb_mode','bot');}}>
                <i className="fi fi-sr-robot"style={{marginRight:5,fontSize:11}}/>{t('bot_token_mode')}
              </button>
              <button className={`mode-btn${mode==='webhook'?' active':''}`}onClick={()=>{setMode('webhook');sv('dcb_mode','webhook');}}>
                <i className="fi fi-sr-link"style={{marginRight:5,fontSize:11}}/>{t('webhook_mode')}
              </button>
            </div>

            {mode==='bot'?(
              <Row2>
                <div className="field"><label>{t('bot_token_label')}</label><input type="password"value={token}onChange={e=>{setToken(e.target.value);sv('dcb_token',e.target.value);}} onFocus={()=>handleCredentialFocus('token')} placeholder="Bot token…"/></div>
                <div className="field"><label>{t('channel_id')}</label><input value={channelId}onChange={e=>{setChannelId(e.target.value);sv('dcb_channel',e.target.value);}}placeholder="123456…"/></div>
              </Row2>
            ):(
              <>
                <div className="field"><label>{t('webhook_url')}</label><input type="password"value={webhookUrl}onChange={e=>{setWebhookUrl(e.target.value);sv('dcb_webhook',e.target.value);}} onFocus={()=>handleCredentialFocus('webhook')} placeholder="https://discord.com/api/webhooks/…"/>
                  <WebhookManager currentUrl={webhookUrl} onSelect={url=>{setWebhookUrl(url);sv('dcb_webhook',url);}} />
                </div>
                <button onClick={()=>setWhAppearanceOpen(true)} style={{display:'flex',alignItems:'center',gap:8,background:'rgba(88,101,242,.08)',border:'1px solid rgba(88,101,242,.2)',borderRadius:6,padding:'6px 12px',cursor:'pointer',width:'100%',textAlign:'left'}}>
                  <div style={{width:28,height:28,borderRadius:'50%',flexShrink:0,overflow:'hidden',background:'#5865f2',display:'flex',alignItems:'center',justifyContent:'center',color:'#fff',fontSize:13,fontWeight:700}}>
                    {(whAvatar||(webhookFetchedInfo?.avatar??''))
                      ?<img src={whAvatar||webhookFetchedInfo?.avatar||''}style={{width:28,height:28,objectFit:'cover'}}alt=""onError={e=>(e.currentTarget.style.display='none')}/>
                      :(whName||webhookFetchedInfo?.username||'W')[0]?.toUpperCase()}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:12,fontWeight:600,color:'#dbdee1',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{whName||webhookFetchedInfo?.username||'Webhook'}</div>
                    <div style={{fontSize:10,color:'#72767d'}}>{t('wh_appearance_btn')} →</div>
                  </div>
                </button>
              </>
            )}

            <Row2>
              <div className="field">
                <label style={{display:'flex',alignItems:'center',gap:5}}>{t('thread_id')} <span style={{color:'#3f4147',fontWeight:400,textTransform:'none',fontSize:10}}>{t('optional')}</span></label>
                <input value={threadId}onChange={e=>setThreadId(e.target.value.trim())}placeholder={t('thread_placeholder')}/>
              </div>
              <div className="field">
                <label style={{display:'flex',alignItems:'center',gap:5}}>{t('message_id')} <span style={{color:'#3f4147',fontWeight:400,textTransform:'none',fontSize:10}}>{t('eb_msg_id_hint')}</span></label>
                <input value={messageId}onChange={e=>setMessageId(e.target.value.trim())}placeholder={t('msg_placeholder')}/>
              </div>
            </Row2>
            {!!(messageId&&diffSnapshotRef.current!=null)&&(
              <button onClick={()=>setDiffOpen(true)}style={{background:'rgba(255,220,0,.06)',border:'1px solid rgba(255,220,0,.2)',borderRadius:4,color:'#fcc419',cursor:'pointer',fontSize:11,fontWeight:600,padding:'4px 10px',width:'100%'}}>
                ⚡ {t('diff_title')}
              </button>
            )}
          </div>

          {/* Message list */}
          <div className="panel-body"style={{padding:'10px 12px'}}>
            {state.messages.map((m,mi)=>(
              <MessageSection key={m._id}msg={m}index={mi}total={state.messages.length}
                forceCollapse={compactAll}
                onChange={p=>updateMsg(m._id,p)}
                onRemove={()=>removeMsg(m._id)}
                onDup={()=>dupMsg(m._id)}
              />
            ))}

            <button onClick={()=>{if(state.messages.length>=10){addToast(t('eb_max_msgs'),'warn');return;}setState(s=>({messages:[...s.messages,newMessage()]}));}}
              disabled={state.messages.length>=10}
              style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'center',gap:8,padding:'10px',background:state.messages.length>=10?'#1e1f22':'#25262b',border:`1px dashed ${state.messages.length>=10?'#2e2f35':'rgba(88,101,242,.4)'}`,borderRadius:6,color:state.messages.length>=10?'#3f4147':'#8b94e5',cursor:state.messages.length>=10?'not-allowed':'pointer',fontSize:13,fontWeight:600,marginTop:4}}>
              <i className="fi fi-sr-comment-alt"style={{fontSize:13}}/>{t('eb_add_message',state.messages.length)}
            </button>
          </div>
        </div>

        {/* Preview */}
        <div style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden',background:'#313338'}}>
          <div className="panel-header"style={{display:'flex',alignItems:'center',gap:6}}>
            <i className="fi fi-sr-eye"style={{fontSize:10}}/> Preview
          </div>
          <div style={{flex:1,overflowY:'auto',padding:'12px 28px'}}>
            <div ref={previewRef} style={{maxWidth:680,margin:'0 auto'}}>
              {state.messages.map((m,mi)=><MessagePreview key={m._id}msg={m}idx={mi}whName={whName}whAvatar={whAvatar}fetchedInfo={mode==='webhook'?webhookFetchedInfo:botFetchedInfo}/>)}
            </div>
          </div>
        </div>
      </div>

      {/* Status bar */}
      <div className="status-bar">
        <span className={`msg${status?' '+status.kind:''}`}>{status?.msg??t('eb_ready')}</span>
        <small>{state.messages.length!==1?t('eb_sb_msgs',state.messages.length):t('eb_sb_msg',state.messages.length)}</small>
        <span style={{color:'#3f4147'}}>·</span>
        <small>{totalEmbeds!==1?t('eb_sb_embeds',totalEmbeds):t('eb_sb_embed',totalEmbeds)}</small>
        <span style={{color:'#3f4147'}}>·</span>
        <small>{mode==='bot'?t('bot_token_mode'):t('webhook_mode')}</small>
      </div>
    </div>
  );
}
