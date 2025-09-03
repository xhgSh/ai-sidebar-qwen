import * as React from 'react';
import { getApiUrl } from './utils';

export function LoginWidget(props: { onLogin: () => void; onSwitchToRegister: () => void }) {
  const [username, setUsername] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState('');

  const handleLogin = async () => {
    setError('');
    const res = await fetch(getApiUrl('/api/auth/login'), {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (res.ok) {
      props.onLogin();
    } else {
      const msg = await res.text();
      setError(msg);
    }
  };

  return (
    <div className="ai-sidebar-auth-container">
      <div className="ai-sidebar-auth-title">AI 侧边栏登录</div>
      <input className="ai-sidebar-auth-input" placeholder="用户名" value={username} onChange={e => setUsername(e.target.value)} />
      <input className="ai-sidebar-auth-input" type="password" placeholder="密码" value={password} onChange={e => setPassword(e.target.value)} />
      <button className="ai-sidebar-auth-btn" onClick={handleLogin}>登录</button>
      <button className="ai-sidebar-auth-link" onClick={props.onSwitchToRegister}>去注册</button>
      {error && <div style={{ color: 'red', marginTop: 10 }}>{error}</div>}
    </div>
  );
} 