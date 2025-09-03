import {
  JupyterFrontEnd,
  JupyterFrontEndPlugin
} from '@jupyterlab/application';
import { Widget } from '@lumino/widgets';
import React from 'react';
import { createRoot } from 'react-dom/client';
import { LoginWidget } from './LoginWidget';
import { RegisterWidget } from './RegisterWidget';
import { ChatWidget } from './ChatWidget';
import { INotebookTracker } from '@jupyterlab/notebook';
import { LabIcon } from '@jupyterlab/ui-components';
// @ts-ignore
import symbolSvg from '../static/symbol.svg?raw';
import '../style/index.css';

/**
 * Initialization data for the ai_sidebar extension.
 */
const plugin: JupyterFrontEndPlugin<void> = {
  id: 'ai_sidebar:plugin',
  description: 'A JupyterLab extension.',
  autoStart: true,
  requires: [INotebookTracker],
  activate: (app: JupyterFrontEnd, notebookTracker: INotebookTracker) => {
    console.log('JupyterLab extension ai_sidebar is activated!');

    // 创建一个空白 Widget
  const content = new Widget();
  content.id = 'ai-sidebar-panel';
  // content.title.label = 'AI 侧边栏'; // 移除标题
  content.title.closable = true;
  // 设置icon为symbol.svg
  const aiSidebarIcon = new LabIcon({ name: 'ai-sidebar:symbol', svgstr: symbolSvg });
  content.title.icon = aiSidebarIcon;

  // 创建根元素
  const root = createRoot(content.node);

  // 登录注册状态逻辑
  let isLogin = false;
  let showRegister = false;
  const render = () => {
    if (!isLogin) {
      if (showRegister) {
        root.render(
          <RegisterWidget
            onRegister={() => {}}
            onSwitchToLogin={() => {
              showRegister = false;
              render();
            }}
          />);
      } else {
        root.render(
          <LoginWidget
            onLogin={() => {
              isLogin = true;
              render();
            }}
            onSwitchToRegister={() => {
              showRegister = true;
              render();
            }}
          />);
      }
    } else {
      root.render(<ChatWidget notebookTracker={notebookTracker} />);
    }
  };
  render();

    // 添加到右侧栏
    app.shell.add(content, 'right');

    // 可选：添加命令到命令面板
    app.commands.addCommand('ai-sidebar:open', {
      label: '打开 AI 侧边栏',
      execute: () => {
        app.shell.activateById(content.id);
      }
    });
  }
};

export default plugin;
