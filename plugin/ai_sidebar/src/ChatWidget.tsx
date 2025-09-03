import React, { useState, useRef, useEffect, useCallback } from 'react';
import { INotebookTracker } from '@jupyterlab/notebook';
import { marked } from 'marked';
import { fixMarkdown, getApiUrl } from './utils';
import parse from 'html-react-parser';
import axios from 'axios';

declare global {
  interface Window {
    aiSidebarContext?: any;
  }
}

// SVG 图标组件
const IconNewChat = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:'block',margin:'auto'}}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
);
const IconChat = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:'block',margin:'auto'}}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
);
const IconHistory = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:'block',margin:'auto'}}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);
const IconUser = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:'block',margin:'auto'}}><circle cx="12" cy="7" r="4"/><path d="M5.5 21a8.38 8.38 0 0 1 13 0"/></svg>
);

// 修改密码弹窗组件
function ChangePasswordModal({ open, onClose, onSuccess }: { open: boolean, onClose: () => void, onSuccess: () => void }) {
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');
  if (!open) return null;
  return (
    <div style={{position:'fixed',top:0,left:0,right:0,bottom:0,background:'rgba(0,0,0,0.18)',zIndex:999,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{background:'#fff',borderRadius:10,padding:'18px 16px',minWidth:220,maxWidth:260,boxShadow:'0 4px 24px #0001',position:'relative'}}>
        <div style={{fontWeight:600,fontSize:16,marginBottom:14}}>修改密码</div>
        <div style={{marginBottom:8}}>
          <input type="password" value={oldPwd} onChange={e=>setOldPwd(e.target.value)} placeholder="原密码" style={{width:'100%',padding:6,borderRadius:4,border:'1px solid #ddd',marginBottom:6,fontSize:13}} />
          <input type="password" value={newPwd} onChange={e=>setNewPwd(e.target.value)} placeholder="新密码" style={{width:'100%',padding:6,borderRadius:4,border:'1px solid #ddd',fontSize:13}} />
        </div>
        {err && <div style={{color:'#e57373',marginBottom:6,fontSize:13}}>{err}</div>}
        <div style={{display:'flex',justifyContent:'flex-end',gap:8}}>
          <button onClick={onClose} style={{padding:'5px 12px',border:'none',background:'#eee',borderRadius:5,cursor:'pointer',fontSize:13}}>取消</button>
          <button disabled={loading} style={{padding:'5px 12px',border:'none',background:'#1976d2',color:'#fff',borderRadius:5,cursor:'pointer',opacity:loading?0.6:1,fontSize:13}} onClick={async()=>{
            setErr(''); setLoading(true);
            try {
              const res = await fetch(getApiUrl('/api/auth/change-password'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({ oldPassword: oldPwd, newPassword: newPwd })
              });
              const text = await res.text();
              if (res.ok) { onSuccess(); } else { setErr(text); }
            } catch(e) { setErr('网络错误'); }
            setLoading(false);
          }}>确定</button>
        </div>
      </div>
    </div>
  );
}

function ProfilePage({ onLogout }: { onLogout: () => void }) {
  const [info, setInfo] = useState<{username:string,email:string}|null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  useEffect(()=>{
    setLoading(true);
    fetch(getApiUrl('/api/auth/userinfo'), { credentials: 'include' })
      .then(async r=>{
        if(r.ok) setInfo(await r.json());
        else setErr(await r.text());
      })
      .catch(()=>setErr('网络错误')).finally(()=>setLoading(false));
  },[]);
  return (
    <div style={{padding: 24, color: '#1976d2', fontSize: 16, maxWidth: 340, margin: '0 auto'}}>
      <div style={{fontWeight: 600, fontSize: 20, marginBottom: 18}}>个人中心</div>
      {loading ? <div>加载中...</div> : err ? <div style={{color:'#e57373'}}>{err}</div> : info && <>
        <div style={{marginBottom: 12}}><b>用户名：</b>{info.username}</div>
        <div style={{marginBottom: 18}}><b>邮箱：</b>{info.email}</div>
        <button style={{padding:'5px 12px',background:'#1976d2',color:'#fff',border:'none',borderRadius:5,marginRight:8,cursor:'pointer',fontSize:13}} onClick={()=>setShowPwd(true)}>修改密码</button>
        <button style={{padding:'5px 12px',background:'#e57373',color:'#fff',border:'none',borderRadius:5,cursor:'pointer',fontSize:13}} onClick={async()=>{
          if(!window.confirm('确定要注销账号吗？此操作不可恢复！')) return;
          const res = await fetch(getApiUrl('/api/auth/delete-account'), {method:'POST',credentials:'include'});
          if(res.ok) onLogout();
          else alert(await res.text());
        }}>注销账号</button>
        <ChangePasswordModal open={showPwd} onClose={()=>setShowPwd(false)} onSuccess={onLogout} />
        {!loading && info && (
          <button style={{padding:'5px 12px',background:'#888',color:'#fff',border:'none',borderRadius:5,marginLeft:8,cursor:'pointer',fontSize:13}} onClick={async()=>{
            await axios.post(getApiUrl('/api/auth/logout'), null, { withCredentials: true });
            window.location.reload();
          }}>登出账号</button>
        )}
      </>}
    </div>
  );
}

function HistoryPage(props: { onLoadToNewChat?: (newChatId: number) => void }) {
  const [list, setList] = useState<{lastRequest:string,lastTime:string,chatId?:number}[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [detail, setDetail] = useState<any[]|null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeChatId, setActiveChatId] = useState<number|null>(null);

  const fetchList = useCallback(() => {
    setLoading(true);
    fetch(getApiUrl('/api/chat/history/list'), { credentials: 'include' })
      .then(async r => {
        if (r.ok) setList(await r.json());
        else setErr(await r.text());
      })
      .catch(() => setErr('网络错误')).finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchList(); }, [fetchList]);

  const fetchDetail = (chatId: number) => {
    setDetailLoading(true);
    setActiveChatId(chatId);
    fetch(getApiUrl(`/api/chat/history/detail?chatId=${chatId}`), { credentials: 'include' })
      .then(async r => {
        if (r.ok) setDetail(await r.json());
        else setErr(await r.text());
      })
      .catch(() => setErr('网络错误')).finally(() => setDetailLoading(false));
  };

  return (
    <div style={{padding: 16}}>
      <div style={{fontWeight: 600, fontSize: 18, color: '#1976d2', marginBottom: 16}}>历史对话记录</div>
      {loading ? <div>加载中...</div> : err ? <div style={{color:'#e57373'}}>{err}</div> : (
        <>
          {detail === null ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              maxHeight: '65vh',
              minHeight: '320px',
              overflowY: 'auto',
              paddingRight: 4
            }}>
              {list.length === 0 && <div style={{color:'#bbb',textAlign:'center',marginTop:40}}>暂无历史记录</div>}
              {list.map((item, idx) => (
                <div key={idx} style={{
                  background: '#fff',
                  borderRadius: 10,
                  boxShadow: '0 2px 8px #e3eaf2',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  border: '1.5px solid #e3f2fd',
                  cursor: 'pointer',
                  transition: 'box-shadow 0.2s',
                }} onClick={() => fetchDetail(item.chatId!)}>
                  <div style={{fontWeight: 500, fontSize: 15, color: '#1976d2', maxWidth: '60%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{item.lastRequest || '（空）'}</div>
                  <div style={{fontSize: 13, color: '#888'}}>{item.lastTime?.replace('T',' ').slice(0,16)}</div>
                </div>
              ))}
            </div>
          ) : (
            <div>
              <button style={{marginBottom:10,padding:'4px 12px',background:'#1976d2',color:'#fff',border:'none',borderRadius:5,cursor:'pointer'}} onClick={()=>{setDetail(null);setActiveChatId(null);}}>返回</button>
              <button style={{marginLeft:10,marginBottom:10,padding:'4px 12px',background:'#43a047',color:'#fff',border:'none',borderRadius:5,cursor:'pointer'}} onClick={async()=>{
                if (!activeChatId) return;
                const res = await fetch(getApiUrl('/api/chat/history/load'), {
                  method: 'POST',
                  credentials: 'include',
                  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                  body: `chatId=${activeChatId}`
                });
                if (res.ok) {
                  const data = await res.json();
                  if (props.onLoadToNewChat) props.onLoadToNewChat(data.chatId || data.chat_id);
                } else {
                  alert('载入失败: ' + (await res.text()));
                }
              }}>载入为新对话</button>
              <button style={{marginLeft:10,marginBottom:10,padding:'4px 12px',background:'#e57373',color:'#fff',border:'none',borderRadius:5,cursor:'pointer'}} onClick={async()=>{
                if (!activeChatId) return;
                if (!window.confirm('确定要删除该对话记录吗？')) return;
                await axios.post(getApiUrl('/api/chat/history/delete'), new URLSearchParams({chatId: String(activeChatId)}).toString(), {
                  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                  withCredentials: true
                });
                setDetail(null); setActiveChatId(null); fetchList();
              }}>删除记录</button>
              <div style={{fontWeight:600,fontSize:16,marginBottom:8}}>对话 {activeChatId} 详情</div>
              {detailLoading ? <div>加载中...</div> : (
                <div style={{maxHeight: '55vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8}}>
                  {detail.map((msg,i) => (
                    <div key={msg.id} style={{background:'#f5f5f5',borderRadius:6,padding:'8px 12px'}}>
                      <div style={{color:'#1976d2',fontWeight:500}}>用户：</div>
                      <div style={{marginBottom:4,whiteSpace:'pre-wrap',wordBreak:'break-all'}}>
                        <span dangerouslySetInnerHTML={{ __html: String(marked(fixMarkdown(msg.request))) }} />
                      </div>
                      <div style={{color:'#888',fontWeight:500}}>AI：</div>
                      <div style={{whiteSpace:'pre-wrap',wordBreak:'break-all'}}>
                        <span dangerouslySetInnerHTML={{ __html: String(marked(fixMarkdown(msg.response))) }} />
                      </div>
                      <div style={{fontSize:12,color:'#bbb',marginTop:2}}>{msg.chatTime?.replace('T',' ').slice(0,16)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

// 代码块组件，支持复制和应用
function CodeBlock({ code, language, codebase, aiReply, setIsApplying }: { code: string, language?: string, codebase: string, aiReply: string, setIsApplying?: (v: boolean) => void }) {
  const codeRef = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);
  const notebookTracker = (window as any).aiSidebarContext?.notebookTracker;

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  };
  const handleApply = async () => {
    if (setIsApplying) setIsApplying(true);
    try {
      // 每次点击时获取最新的notebook内容
      const codebase = getNotebookContent(notebookTracker);
      const res = await axios.post(getApiUrl('/api/chat/apply'), {
        codebase,
        advice: aiReply,
        apply_code: code
      }, { withCredentials: true });
      let result = res.data;
      let mods = [];
      if (result && typeof result.result === 'string') {
        let raw = result.result.trim();
        // 兼容```json代码块包裹
        if (raw.startsWith('```json')) {
          raw = raw.replace(/^```json/, '').replace(/```$/, '').trim();
        } else if (raw.startsWith('```')) {
          raw = raw.replace(/^```/, '').replace(/```$/, '').trim();
        }
        try {
          const parsed = JSON.parse(raw);
          mods = parsed.modifications || [];
        } catch (e) {
          alert('AI返回内容无法解析');
          return;
        }
      }
      console.log('handleApply called, notebookTracker:', notebookTracker, 'mods:', mods);
      if (!mods || mods.length === 0) {
        alert('没有可修改内容');
        return;
      }
      // 只保留自动写入cell逻辑，去除手动应用弹窗
      if (notebookTracker && notebookTracker.currentWidget) {
        console.log('mods:', mods);
        mods.forEach((mod: {cell_index: number, updated_code: string}) => {
          let cell = notebookTracker.currentWidget?.content.widgets[mod.cell_index-1];
          const notebook = notebookTracker.currentWidget?.content;
          // 如果cell不存在，自动插入新cell（兼容JupyterLab 6.x及以后）
          if (!cell && notebook && notebook.model && notebook.model.sharedModel && typeof notebook.model.sharedModel.insertCell === 'function') {
            const insertIndex = Math.max(0, Math.min(mod.cell_index - 1, notebook.widgets.length));
            notebook.model.sharedModel.insertCell(insertIndex, 'code', { source: mod.updated_code });
            // 插入后刷新cell
            cell = notebook.widgets[insertIndex];
          }
          // 详细调试输出
          console.log('cell:', cell);
          console.log('cell.model:', cell && cell.model);
          console.log('cell.model.type:', cell && cell.model && cell.model.type);
          console.log('cell.model.value:', cell && cell.model && cell.model.value);
          // 兼容不同JupyterLab版本的cell写入
          if (cell && cell.model && cell.model.type === 'code') {
            if (cell.model.value && typeof cell.model.value.text === 'string') {
              cell.model.value.text = mod.updated_code;
            } else if (cell.model.sharedModel && typeof cell.model.sharedModel.source === 'string') {
              cell.model.sharedModel.source = mod.updated_code;
            } else {
              console.warn('cell可写字段未找到', cell);
            }
          } else {
            console.warn('cell不可写入，cell:', cell);
          }
        });
        alert('代码已应用到 notebook');
      }
    } catch (e) {
      console.error('应用失败', e);
      alert('应用失败: ' + (e && (e as any).message ? (e as any).message : e));
    } finally {
      if (setIsApplying) setIsApplying(false);
    }
  };
  return (
    <div style={{position:'relative', marginBottom: 8}}>
      <pre ref={codeRef} className="ai-sidebar-codeblock" style={{background:'#222',color:'#fff',borderRadius:6,padding:'12px 12px 28px 12px',fontSize:13,overflowX:'auto',position:'relative'}}>
        <code>{code}</code>
      </pre>
      <div style={{position:'absolute',right:8,bottom:8,display:'flex',gap:6,opacity:0.7}}>
        <button className="ai-sidebar-btn ai-sidebar-btn-copy" style={{fontSize:11,padding:'2px 8px',borderRadius:4,border:'none',background:'#333',color:'#fff',cursor:'pointer'}} onClick={handleCopy}>{copied ? '已复制' : '复制'}</button>
        <button className="ai-sidebar-btn ai-sidebar-btn-apply" style={{fontSize:11,padding:'2px 8px',borderRadius:4,border:'none',background:'#1976d2',color:'#fff',cursor:'pointer'}} onClick={handleApply}>应用</button>
      </div>
    </div>
  );
}

// markdown渲染，代码块用自定义CodeBlock，其余用dangerouslySetInnerHTML
function renderMarkdown(md: string, codebase: string, aiReply: string, setIsApplying?: (v: boolean) => void) {
  const html = String(marked.parse(fixMarkdown(md)));
  return parse(html, {
    replace(domNode) {
      if ((domNode as any).name === 'pre' && (domNode as any).children && (domNode as any).children[0]?.name === 'code') {
        // 直接取 code 节点的 data，原样传递
        let code = '';
        const codeNode = (domNode as any).children[0];
        if (codeNode.children && Array.isArray(codeNode.children)) {
          code = codeNode.children.map((c: any) => c.data || '').join('');
        } else {
          code = codeNode.children?.[0]?.data || '';
        }
        const lang = codeNode.attribs?.class?.replace('language-', '') || undefined;
        return <CodeBlock code={code} language={lang} codebase={codebase} aiReply={aiReply} setIsApplying={setIsApplying} />;
      }
    }
  });
}

function getNotebookContent(tracker: INotebookTracker): string {
  const panel = tracker.currentWidget;
  if (!panel || !panel.content) return '';
  const cells = panel.content.widgets;
  const cellArr: any[] = [];
  cells.forEach((cell: any, idx: number) => {
    let code = '';
    if (cell.model && cell.model.value && typeof cell.model.value.text === 'string' && cell.model.value.text.trim()) {
      code = cell.model.value.text.trim();
    } else if (cell.model && typeof cell.model.toJSON === 'function') {
      const src = cell.model.toJSON().source;
      if (typeof src === 'string') {
        code = src.trim();
      } else if (Array.isArray(src)) {
        code = src.join('').trim();
      }
    }
    let outputStr = '';
    if (cell.model.type === 'code' && cell.outputArea) {
      const outputs = cell.outputArea.model.toJSON();
      if (outputs && Array.isArray(outputs)) {
        let outArr: string[] = [];
        outputs.forEach((out: any) => {
          if (out.output_type === 'error') {
            // 收集ename, evalue, traceback
            let errMsg = '';
            if (out.ename) errMsg += out.ename + ': ';
            if (out.evalue) errMsg += out.evalue + '\n';
            if (Array.isArray(out.traceback)) {
              errMsg += out.traceback.join('\n');
            }
            outArr.push(errMsg.trim());
          } else if (out.text) {
            outArr.push(out.text);
          } else if (out.data && out.data['text/plain']) {
            outArr.push(out.data['text/plain']);
          }
        });
        if (outArr.length > 0) {
          outputStr = outArr.join('\n');
        }
      }
    }
    cellArr.push({
      cell_index: idx + 1,
      ...(code ? { code } : {}),
      ...(outputStr ? { output: outputStr } : {})
    });
  });
  return JSON.stringify({ cells: cellArr }, null, 2);
}

// 新增：提取output区图片并上传
async function uploadOutputImages() {
  const notebookTracker = (window as any).aiSidebarContext?.notebookTracker;
  const panel = notebookTracker?.currentWidget;
  if (!panel || !panel.content) return;
  const cells = panel.content.widgets;
  let imageFiles: File[] = [];
  let imgIdx = 1;
  for (let cell of cells) {
    if (cell.model && cell.model.type === 'code' && cell.model.outputs) {
      const outputs = cell.model.outputs.toJSON();
      for (const out of outputs) {
        if (out.data && out.data['image/png']) {
          let b64 = out.data['image/png'];
          if (Array.isArray(b64)) b64 = b64.join('');
          const byteString = atob(b64);
          const ab = new ArrayBuffer(byteString.length);
          const ia = new Uint8Array(ab);
          for (let i = 0; i < byteString.length; i++) {
            ia[i] = byteString.charCodeAt(i);
          }
          const blob = new Blob([ab], { type: 'image/png' });
          const file = new File([blob], imgIdx + '.png', { type: 'image/png' });
          imageFiles.push(file);
          imgIdx++;
        }
      }
    }
  }
  console.log('imageFiles:', imageFiles);
  if (imageFiles.length === 0) return;
  await axios.post(getApiUrl('/api/figures/clear'), null, { withCredentials: true });
  const formData = new FormData();
  imageFiles.forEach(f => formData.append('files', f));
  const resp = await axios.post(getApiUrl('/api/figures/upload'), formData, { withCredentials: true });
  console.log('upload response:', resp.data);
}

export function ChatWidget(props: { notebookTracker: INotebookTracker }) {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{role: string, content: string}[]>([]);
  const [aiReply, setAiReply] = useState('');
  const eventSourceRef = useRef<EventSource | null>(null);
  const [loading, setLoading] = useState(false);
  const [isThinking, setIsThinking] = useState(false); // 新增思考中状态
  const [isApplying, setIsApplying] = useState(false); // 新增应用中状态
  const [codebaseAdded, setCodebaseAdded] = useState(false);
  const [codebaseContent, setCodebaseContent] = useState('');
  const [activeTab, setActiveTab] = useState('chat');
  const [chatId, setChatId] = useState<number|null>(null);
  const [username, setUsername] = useState<string>('');

  // 获取用户名
  useEffect(() => {
    axios.get(getApiUrl('/api/auth/userinfo'), { withCredentials: true })
      .then(res => setUsername(res.data.username))
      .catch(() => setUsername(''));
  }, []);

  useEffect(() => {
    if (props.notebookTracker) {
      if (!window.aiSidebarContext) window.aiSidebarContext = {};
      window.aiSidebarContext.notebookTracker = props.notebookTracker;
    }
  }, [props.notebookTracker]);

  const handleCodebaseClick = () => {
    if (!codebaseAdded) {
      const content = getNotebookContent(props.notebookTracker);
      setCodebaseContent(content);
      setCodebaseAdded(true);
    } else {
      setCodebaseAdded(false);
      setCodebaseContent('');
    }
  };

  const handleNewChat = async () => {
    try {
      const res = await fetch(getApiUrl('/api/chat/new'), {
        method: 'POST',
        credentials: 'include',
      });
      if (res.ok) {
        const data = await res.json();
        setChatId(data.chat_id || data.chatId || null);
        setMessages([]);
        setAiReply('');
        setInput('');
        setActiveTab('chat');
      } else {
        alert('新建对话失败: ' + (await res.text()));
      }
    } catch (e) {
      alert('新建对话网络错误');
    }
  };

  const handleLoadToNewChat = async (newChatId: number) => {
    setActiveTab('chat');
    setChatId(newChatId);
    setMessages([]);
    setAiReply('');
    setInput('');
    // 自动拉取历史内容
    try {
      const res = await fetch(getApiUrl(`/api/chat/history/detail?chatId=${newChatId}`), { credentials: 'include' });
      if (res.ok) {
        const history = await res.json();
        const msgs: {role: string, content: string}[] = [];
        history.forEach((msg: any) => {
          msgs.push({ role: 'user', content: msg.request });
          msgs.push({ role: 'ai', content: msg.response });
        });
        setMessages(msgs);
      }
    } catch {}
  };

  const navItems = [
    { id: 'new', title: '新建对话', icon: IconNewChat, clickable: true },
    { id: 'chat', title: '对话', icon: IconChat, selectable: true },
    { id: 'history', title: '历史记录', icon: IconHistory, selectable: true },
    { id: 'profile', title: '个人主页', icon: IconUser, selectable: true }
  ];

  const getNavButtonStyle = (item: any, isActive: boolean) => {
    let style: any = {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: '2px',
      borderRadius: '6px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.2s ease',
      color: isActive ? '#1976d2' : '#666',
      transform: isActive ? 'scale(1.05)' : 'scale(1)',
      marginLeft: 2,
      height: 26,
      width: 26,
      minWidth: 26,
      minHeight: 26,
      boxSizing: 'border-box',
    };
    if (item.id === 'history') {
      style.background = isActive ? 'linear-gradient(90deg,#e3f2fd 60%,#bbdefb 100%)' : '#f5f5f5';
      style.color = isActive ? '#1976d2' : '#1976d2';
      style.boxShadow = isActive ? '0 2px 8px rgba(25, 118, 210, 0.10)' : 'none';
      style.border = isActive ? '1.5px solid #1976d2' : '1.5px solid #e3f2fd';
    }
    if (item.id === 'chat') {
      style.background = isActive ? 'linear-gradient(90deg,#e3f2fd 60%,#b3e5fc 100%)' : '#f5f5f5';
      style.color = isActive ? '#1976d2' : '#1976d2';
      style.boxShadow = isActive ? '0 2px 8px rgba(25, 118, 210, 0.10)' : 'none';
      style.border = isActive ? '1.5px solid #1976d2' : '1.5px solid #e3f2fd';
    }
    if (item.id === 'profile') {
      style.background = isActive ? 'linear-gradient(90deg,#e3f2fd 60%,#c5e1a5 100%)' : '#f5f5f5';
      style.color = isActive ? '#1976d2' : '#1976d2';
      style.boxShadow = isActive ? '0 2px 8px rgba(25, 118, 210, 0.10)' : 'none';
      style.border = isActive ? '1.5px solid #1976d2' : '1.5px solid #e3f2fd';
    }
    return style;
  };

  const sendMessage = async () => {
    console.log('sendMessage called');
    if (aiReply) {
      setMessages(prev => [...prev, { role: 'ai', content: aiReply }]);
      setAiReply('');
    }
    if (!input.trim()) return;
    await uploadOutputImages();
    const params = new URLSearchParams();
    if (codebaseAdded && codebaseContent) params.append('codebase', codebaseContent);
    params.append('message', input);
    if (chatId !== null) params.append('chatId', String(chatId));
    setMessages(prev => [...prev, { role: 'user', content: input }]);
    setAiReply('');
    setLoading(true);
    setIsThinking(true); // 发送后立即显示思考中
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    fetch(getApiUrl(`/api/chat/stream?${params.toString()}`), {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Accept': 'text/event-stream'
      }
    });
    const es = new window.EventSource(getApiUrl(`/api/chat/stream?${params.toString()}`), { withCredentials: true } as any);
    eventSourceRef.current = es;
    let aiContent = '';
    let receivedFirst = false; // 标记是否收到第一条
    es.onmessage = (e) => {
      if (!receivedFirst) {
        setIsThinking(false); // 收到第一条流式内容，隐藏思考中
        receivedFirst = true;
      }
      aiContent += e.data;
      setAiReply(aiContent);
    };
    es.onerror = () => {
      es.close();
      setLoading(false);
      setIsThinking(false);
    };
    es.onopen = () => {
      setInput('');
    };
    es.addEventListener('end', () => {
      es.close();
      setLoading(false);
      setIsThinking(false);
      setMessages(prev => [...prev, { role: 'ai', content: aiReply }]);
      setAiReply('');
    });
  };

  const buttonStyle = {
    padding: '4px 12px',
    borderRadius: 4,
    cursor: 'pointer',
    fontSize: '12px',
    width: '100px',
    border: '1px solid #ddd',
    backgroundColor: '#fff',
    transition: 'all 0.2s'
  };

  return (
    <div style={{ 
      padding: 20, 
      height: '100%', 
      display: 'flex', 
      flexDirection: 'column',
      boxSizing: 'border-box'
    }}>
      {/* 顶部导航栏 */}
      <div style={{
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        marginBottom: 6,
        background: 'none',
        boxShadow: 'none',
        border: 'none',
        borderRadius: 0,
        padding: '0 0 0 0',
        minHeight: 40,
        position: 'relative',
      }}>
        {/* 应用中/思考中指示器，优先显示应用中 */}
        {(isApplying || isThinking) && (
          <div style={{
            position: 'absolute',
            left: 0,
            top: '50%',
            transform: 'translateY(-50%)',
            display: 'flex',
            alignItems: 'center',
            background: 'rgba(255,255,255,0.95)',
            borderRadius: 6,
            padding: '3px 12px 3px 8px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            zIndex: 11,
            fontSize: 14,
            color: '#1976d2',
            fontWeight: 500
          }}>
            <span>{isApplying ? '应用中' : '思考中'}</span>
            <span style={{
              width: 16,
              height: 16,
              border: '2px solid #b3e5fc',
              borderTop: '2px solid #1976d2',
              borderRadius: '50%',
              marginLeft: 8,
              display: 'inline-block',
              animation: 'ai-spin 1s linear infinite'
            }} />
          </div>
        )}
        {navItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              title={item.title}
              style={getNavButtonStyle(item, isActive)}
              onClick={() => {
                if (item.id === 'new') {
                  handleNewChat();
                } else if (item.id === 'chat') {
                  setActiveTab('chat');
                } else if (item.id === 'profile') {
                  setActiveTab('profile');
                } else if (item.id === 'history') {
                  setActiveTab('history');
                }
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = '#f5f5f5';
                  e.currentTarget.style.color = '#1976d2';
                  e.currentTarget.style.transform = 'scale(1.02)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = (item.id === 'history' || item.id === 'chat' || item.id === 'profile') ? '#f5f5f5' : 'transparent';
                  e.currentTarget.style.color = '#666';
                  e.currentTarget.style.transform = 'scale(1)';
                }
              }}
            >
              <span style={{display: 'flex', alignItems: 'center', justifyContent: 'center', width: 20, height: 20}}>
                <IconComponent />
              </span>
            </button>
          );
        })}
      </div>
      {/* 页面内容区，根据 activeTab 切换 */}
      {activeTab === 'chat' && (
        <div style={{
          flex: 1,
          overflowY: 'auto',
          background: '#f5f5f5',
          padding: 0,
          marginBottom: 0,
          borderRadius: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}>
          {messages.map((msg, i) => (
            <div
              key={i}
              style={{
                margin: '8px 0',
                maxWidth: '600px',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start',
              }}
            >
              <div style={{fontWeight: 500, color: msg.role === 'user' ? '#1976d2' : '#43a047', marginBottom: 4, fontSize: 14}}>{msg.role === 'user' ? username || '用户' : 'AI'}</div>
              <div
                className={`ai-sidebar-bubble ${msg.role === 'user' ? 'ai-sidebar-bubble-user' : 'ai-sidebar-bubble-ai'}`}
              >
                {msg.role === 'user'
                  ? msg.content.replace(/^([\s\S]*?)#用户输入\n/, '')
                  : <>{renderMarkdown(msg.content, codebaseContent, aiReply, setIsApplying)}</>}
              </div>
            </div>
          ))}
          {aiReply && (
            <div
              style={{margin:'8px 0',maxWidth:'600px',width:'100%',display:'flex',flexDirection:'column',alignItems:'flex-start'}}
            >
              <div style={{fontWeight: 500, color: '#43a047', marginBottom: 4, fontSize: 14}}>AI</div>
              <div className="ai-sidebar-bubble ai-sidebar-bubble-ai">
                {renderMarkdown(aiReply, codebaseContent, aiReply, setIsApplying)}
              </div>
            </div>
          )}
        </div>
      )}
      {activeTab === 'history' && <HistoryPage onLoadToNewChat={handleLoadToNewChat} />}
      {activeTab === 'profile' && <ProfilePage onLogout={()=>window.location.reload()} />}
      {/* 输入框区域 */}
      {activeTab === 'chat' && (
        <div style={{ flexShrink: 0, marginTop: 12, marginBottom: 10 }}>
          <textarea 
            value={input} 
            onChange={e => setInput(e.target.value)} 
            style={{ 
              width: '100%',
              height: '80px',
              padding: '8px 12px',
              borderRadius: 4,
              border: '1px solid #ddd',
              marginBottom: 6,
              resize: 'none',
              boxSizing: 'border-box'
            }} 
            disabled={loading}
            placeholder="请输入您的问题..."
          />
          <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginBottom: 0 }}>
            <button
              onClick={handleCodebaseClick}
              style={{
                ...buttonStyle,
                fontSize: '11px',
                backgroundColor: codebaseAdded ? '#4caf50' : '#fff',
                color: codebaseAdded ? '#fff' : '#000',
                borderColor: codebaseAdded ? '#4caf50' : '#ddd'
              }}
            >
              {codebaseAdded ? '移除 codebase' : '添加 codebase'}
            </button>
            <button 
              onClick={sendMessage} 
              disabled={loading || !input.trim()}
              style={{
                ...buttonStyle,
                fontSize: '11px',
                opacity: loading || !input.trim() ? 0.6 : 1,
                cursor: loading || !input.trim() ? 'not-allowed' : 'pointer'
              }}
            >
              发送
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 