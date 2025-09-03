import * as React from 'react';
import { getApiUrl } from './utils';

export function RegisterWidget(props: { onRegister: () => void; onSwitchToLogin: () => void }) {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState('');

  const handleRegister = async () => {
    setError('');
    setSuccess('');
    const res = await fetch(getApiUrl('/api/auth/register'), {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, email })
    });
    if (res.ok) {
      // 注册成功后自动登录
      const loginRes = await fetch(getApiUrl('/api/auth/login'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      if (loginRes.ok) {
        setSuccess('注册成功！');
        setTimeout(() => props.onRegister(), 500);
      } else {
        setSuccess('注册成功，请手动登录');
        setTimeout(() => props.onSwitchToLogin(), 1000);
      }
    } else {
      const msg = await res.text();
      setError(msg);
    }
  };

  return (
    <div className="ai-sidebar-auth-container">
      <div className="ai-sidebar-auth-title">AI 侧边栏注册</div>
      <input className="ai-sidebar-auth-input" placeholder="用户名" value={username} onChange={e => setUsername(e.target.value)} />
      <input className="ai-sidebar-auth-input" type="password" placeholder="密码" value={password} onChange={e => setPassword(e.target.value)} />
      <input className="ai-sidebar-auth-input" placeholder="邮箱（可选）" value={email} onChange={e => setEmail(e.target.value)} />
      <button className="ai-sidebar-auth-btn" onClick={handleRegister}>注册</button>
      <button className="ai-sidebar-auth-link" onClick={props.onSwitchToLogin}>去登录</button>
      {error && <div style={{ color: 'red', marginTop: 10 }}>{error}</div>}
      {success && <div style={{ color: 'green', marginTop: 10 }}>{success}</div>}
    </div>
  );
} 