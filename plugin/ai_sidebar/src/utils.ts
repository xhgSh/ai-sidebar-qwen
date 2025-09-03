// Markdown 预处理函数：自动修正大模型常见格式错误
export function fixMarkdown(md: string): string {
  if (!md) return '';
  // 1. 标题后补空格，如 ###内容 => ### 内容（只匹配行首且紧跟至少一个#，避免误伤）
  md = md.replace(/^(#{1,6})([^ #])/gm, '$1 $2');
  // 2. 列表项后补空格，如 -**内容** => - **内容**（只匹配行首-或*后紧跟非空格，避免误伤星号）
  md = md.replace(/^(\s*[-*])(\S)/gm, '$1 $2');
  // 3. 处理 -1.内容 => - 1.内容
  md = md.replace(/^(\s*[-*])([0-9]+\.)/gm, '$1 $2');
  // 4. 处理 -[a-zA-Z]内容 => - [a-zA-Z]内容
  md = md.replace(/^(\s*[-*])([a-zA-Z]\.)/gm, '$1 $2');
  // 5. 处理 -[中文]内容 => - [中文]内容
  md = md.replace(/^(\s*[-*])([\u4e00-\u9fa5]+)/gm, '$1 $2');
  // 删除以单星号包裹内容但末尾多余悬空星号的情况，如 *描述*
  md = md.replace(/^(\*[^\*]+)\*$/gm, '$1');
  // 删除以两个或更多星号包裹内容但末尾多余悬空星号的情况，如 **描述***
  md = md.replace(/(\*{2,}[^\*]+\*{2,})\*$/gm, '$1');
  // 行尾悬空星号自动转义，避免被解析为斜体
  md = md.replace(/([^\s*])\*$/gm, '$1\\*');
  return md;
}

// 统一后端 API 地址
export const API_BASE_URL = 'http://localhost:8088';
export function getApiUrl(path: string) {
  if (path.startsWith('/')) return API_BASE_URL + path;
  return API_BASE_URL + '/' + path;
} 