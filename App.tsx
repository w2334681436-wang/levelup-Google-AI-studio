import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, Square, RotateCcw, Gamepad2, BookOpen, Coffee, Save, 
  History, Trophy, AlertCircle, X, CheckCircle2, Download, Upload, 
  Settings, Target, Maximize2, Minimize2, AlertTriangle, Sparkles, 
  BrainCircuit, Server, Cpu, RefreshCw, List, Send, Smile, Search, 
  ChevronDown, Zap, MessageCircle, User, Info, Bell, PlusCircle, Clock,
  Home,
  BarChart3,
  TrendingUp,
  Edit,
  Image,
  Trash2,
  Calendar,
  Palette
} from 'lucide-react';
// --- 新增：请求通知权限 ---
const requestNotificationPermission = () => {
  if ('Notification' in window && Notification.permission !== 'granted') {
    Notification.requestPermission();
  }
};

// --- 新增：发送通知工具 ---
const sendNotification = (title, body) => {
  if ('Notification' in window && Notification.permission === 'granted') {
    // 尝试在 Service Worker 中显示通知（移动端更稳定）
    if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
      navigator.serviceWorker.ready.then(registration => {
        try {
          registration.showNotification(title, {
            body: body,
            icon: '/icon_final.svg', 
            vibrate: [200, 100, 200], // 震动提醒
            tag: 'levelup-timer' // 防止重复
          });
        } catch (e) {
          new Notification(title, { body, icon: '/icon_final.svg' });
        }
      });
    } else {
      new Notification(title, { body, icon: '/icon_final.svg' });
    }
  }
};
// --- 1. 组件：自定义通知 (Toast) ---
const Toast = ({ notifications, removeNotification }) => {
  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-[100] flex flex-col gap-2 w-full max-w-sm px-4 pointer-events-none">
      {notifications.map((note) => (
        <div 
          key={note.id} 
          className={`
            pointer-events-auto flex items-center gap-3 p-4 rounded-xl shadow-2xl border backdrop-blur-md animate-in slide-in-from-top-2 fade-in
            ${note.type === 'error' ? 'bg-red-950/80 border-red-500/50 text-red-200' : 
              note.type === 'success' ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200' : 
              'bg-gray-900/80 border-gray-700 text-gray-200'}
          `}
        >
          {note.type === 'error' ? <AlertCircle className="w-5 h-5 flex-shrink-0" /> : 
           note.type === 'success' ? <CheckCircle2 className="w-5 h-5 flex-shrink-0" /> : 
           <Info className="w-5 h-5 flex-shrink-0" />}
          <p className="text-sm font-medium">{note.message}</p>
          <button onClick={() => removeNotification(note.id)} className="ml-auto hover:text-white"><X className="w-4 h-4" /></button>
        </div>
      ))}
    </div>
  );
};

// --- 2. 组件：通用确认框 (Confirm Modal) ---
const ConfirmDialog = ({ isOpen, title, message, onConfirm, onCancel, confirmText = "确定", cancelText = "取消", isDangerous = false }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[90] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl transform transition-all scale-100">
        <div className={`flex items-center gap-3 mb-4 ${isDangerous ? 'text-red-500' : 'text-blue-500'}`}>
          {isDangerous ? <AlertTriangle className="w-6 h-6" /> : <Info className="w-6 h-6" />}
          <h3 className="text-lg font-bold text-white">{title}</h3>
        </div>
        <p className="text-gray-300 text-sm mb-6 leading-relaxed">{message}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium py-2.5 rounded-lg transition-colors">
            {cancelText}
          </button>
          <button onClick={onConfirm} className={`flex-1 font-bold py-2.5 rounded-lg transition-colors ${isDangerous ? 'bg-red-900/50 hover:bg-red-800 text-red-100 border border-red-800' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- 3. 工具函数 ---
const formatTime = (seconds) => {
  if (seconds < 0) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

const getTodayDateString = () => {
  const date = new Date();
  return date.toISOString().split('T')[0];
};

const getYesterdayDateString = () => {
  const date = new Date();
  date.setDate(date.getDate() - 1);
  return date.toISOString().split('T')[0];
};

const cleanAIResponse = (text) => {
  if (!text) return '';
  return text.trim();
};

const getContrastColor = (hexColor) => {
  if (!hexColor) return '#ffffff';
  const r = parseInt(hexColor.substr(1, 2), 16);
  const g = parseInt(hexColor.substr(3, 2), 16);
  const b = parseInt(hexColor.substr(5, 2), 16);
  const yiq = ((r * 299) + (g * 587) + (b * 114)) / 1000;
  return (yiq >= 128) ? '#000000' : '#ffffff';
};

// Markdown 渲染组件
const MarkdownMessage = ({ content }) => {
  if (!content) return null;
  
  const parseMarkdown = (text) => {
    let parsed = text;
    parsed = parsed.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    parsed = parsed.replace(/### (.*?)(?=\n|$)/g, '<h3 class="text-lg font-bold mt-4 mb-2">$1</h3>');
    parsed = parsed.replace(/## (.*?)(?=\n|$)/g, '<h2 class="text-xl font-bold mt-4 mb-2">$1</h2>');
    parsed = parsed.replace(/^[-*] (.*?)(?=\n|$)/gm, '<li class="ml-4">$1</li>');
    parsed = parsed.replace(/(<li class="ml-4">.*?<\/li>)+/g, '<ul class="list-disc ml-4 my-2">$&</ul>');
    parsed = parsed.replace(/\n/g, '<br />');
    
    parsed = parsed.replace(/<think>([\s\S]*?)<\/think>/gi, (match, p1) => {
        return `<div class="bg-black/20 text-opacity-80 text-xs p-3 rounded-lg mb-2 italic border-l-2 border-purple-400/50"><span class="font-bold not-italic opacity-100">Thinking:</span><br/>${p1}</div>`;
    });

    return parsed;
  };

  return (
    <div 
      className="markdown-content"
      dangerouslySetInnerHTML={{ __html: parseMarkdown(content) }}
    />
  );
};

const getStageInfo = () => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const TARGET_YEAR = 2026; 

  if (month === 11 || month === 12) {
    if (year === TARGET_YEAR - 1) {
      return { name: "全真模拟演练期", desc: "心态调整 / 考场适应", targetHours: 6, color: "text-cyan-400", borderColor: "border-cyan-500", bg: "bg-cyan-500/10" };
    } else {
       return { name: "终极冲刺期", desc: "背水一战 / 回归基础", targetHours: 11, color: "text-pink-500", borderColor: "border-pink-500", bg: "bg-pink-500/10" };
    }
  } else if (month >= 1 && month <= 6) {
    return { name: "基础夯实期", desc: "地毯式复习 / 英语单词", targetHours: 7, color: "text-emerald-400", borderColor: "border-emerald-500", bg: "bg-emerald-500/10" };
  } else if (month >= 7 && month <= 9) {
    return { name: "强化提升期", desc: "海量刷题 / 攻克难点", targetHours: 9, color: "text-yellow-400", borderColor: "border-yellow-500", bg: "bg-yellow-500/10" };
  } else {
    return { name: "真题实战期", desc: "真题模拟 / 查缺", targetHours: 10, color: "text-orange-400", borderColor: "border-orange-500", bg: "bg-orange-500/10" };
  }
};

const API_PROVIDERS = [
  { id: 'siliconflow', name: '硅基流动 (SiliconFlow)', url: 'https://api.siliconflow.cn/v1', defaultModel: 'deepseek-ai/DeepSeek-R1', supportsVision: false },
  { id: 'deepseek', name: 'DeepSeek 官方', url: 'https://api.deepseek.com', defaultModel: 'deepseek-chat', supportsVision: true },
  { id: 'google', name: 'Google Gemini', url: 'https://generativelanguage.googleapis.com/v1beta/openai', defaultModel: 'gemini-1.5-flash', supportsVision: true },
  { id: 'moonshot', name: '月之暗面 (Kimi)', url: 'https://api.moonshot.cn/v1', defaultModel: 'moonshot-v1-8k', supportsVision: false },
  { id: 'aliyun', name: '阿里云 (通义千问)', url: 'https://dashscope.aliyuncs.com/compatible-mode/v1', defaultModel: 'qwen-turbo', supportsVision: false },
  { id: 'openai', name: 'OpenAI (需要梯子)', url: 'https://api.openai.com/v1', defaultModel: 'gpt-4o', supportsVision: true },
  { id: 'doubao', name: '豆包 (字节跳动)', url: 'https://ark.cn-beijing.volces.com/api/v3', defaultModel: 'doubao-1-5-32k-pro', supportsVision: true },
  { id: 'custom', name: '自定义 (Custom)', url: '', defaultModel: '', supportsVision: false }
];

const COMMON_EMOJIS = ['👍', '🔥', '💪', '😭', '🙏', '🎉', '🤔', '💤', '📚', '☕️', '🤖', '👻'];

const DEFAULT_PERSONA = "你是一位专业、耐心的考研导师。请根据学生的学习数据和进度提供有针对性的建议和指导。请使用markdown格式回复，用**粗体**强调重点，用###表示小标题，用-表示列表项。";

const SUBJECT_CONFIG = {
  english: { name: "英语", color: "text-red-400", keyword: ['英语', '单词', '长难句', '语法'] },
  politics: { name: "政治", color: "text-blue-400", keyword: ['政治', '肖秀荣', '腿姐', '史纲', '思修'] },
  math: { name: "专业课一（数学）", color: "text-yellow-400", keyword: ['数学', '高数', '线代', '概统', '660', '1800'] },
  cs: { name: "专业课二（408）", color: "text-purple-400", keyword: ['408', '计组', '数据结构', '操作系统', '计算机网络'] },
};

const initialProgress = {
  english: { content: "目前已学习完单词书第一册，开始做长难句分析。", lastUpdate: getTodayDateString() },
  politics: { content: "未开始政治基础学习。", lastUpdate: getTodayDateString() },
  math: { content: "完成了高等数学上册的全部基础知识点梳理和练习。", lastUpdate: getTodayDateString() },
  cs: { content: "数据结构完成了链表和栈的初步学习。", lastUpdate: getTodayDateString() },
};

// --- 新增：等级系统逻辑 ---
// 专家设计：采用非线性升级曲线，前期升级快（正反馈强），后期升级慢（不仅是积累，更是沉淀）
// 设定：每 60 分钟 = 100 XP。
// 升级所需 XP = 当前等级 * 100 * 1.2 (难度递增)
const calculateLevelStats = (totalMinutes) => {
  const XP_PER_HOUR = 100;
  let currentXp = totalMinutes * (XP_PER_HOUR / 60); // 总经验值
  let level = 1;
  let xpForNextLevel = 100; // 初始升级经验
  
  // 循环扣除经验升级
  while (currentXp >= xpForNextLevel) {
    currentXp -= xpForNextLevel;
    level++;
    xpForNextLevel = Math.floor(xpForNextLevel * 1.1); // 每一级难度增加 10%
  }

  // 获得称号
  const getTitle = (lv) => {
    if (lv <= 5) return "考研萌新";
    if (lv <= 10) return "自律学徒";
    if (lv <= 20) return "专注达人";
    if (lv <= 35) return "学术精英";
    if (lv <= 50) return "卷王之王";
    if (lv <= 70) return "准研究生";
    return "学术泰斗";
  };

  return {
    level,
    currentXp: Math.floor(currentXp),
    xpForNextLevel: Math.floor(xpForNextLevel),
    progressPercent: Math.min((currentXp / xpForNextLevel) * 100, 100),
    title: getTitle(level)
  };
};

// --- 新增：等级展示组件 ---
const UserLevelSystem = ({ history, todayMinutes }) => {
  // 计算总时长：历史记录 + 今天的时长
  const totalHistoryMinutes = history.reduce((acc, curr) => acc + (curr.studyMinutes || 0), 0);
  const totalAllTime = totalHistoryMinutes + todayMinutes;
  
  const stats = calculateLevelStats(totalAllTime);

  return (
    <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-4 rounded-xl border border-gray-700 shadow-lg relative overflow-hidden group">
      {/* 背景特效 */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 group-hover:bg-cyan-500/20 transition-all"></div>
      
      <div className="flex justify-between items-end mb-2 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center shadow-lg transform rotate-3 group-hover:rotate-6 transition-transform">
             <span className="font-black text-xl text-white italic">Lv.{stats.level}</span>
          </div>
          <div>
            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Current Rank</div>
            <div className="text-white font-bold bg-clip-text text-transparent bg-gradient-to-r from-cyan-300 to-blue-300">
              {stats.title}
            </div>
          </div>
        </div>
        <div className="text-right">
           <div className="text-xs text-cyan-400 font-mono font-bold">
             {stats.currentXp} <span className="text-gray-500">/</span> {stats.xpForNextLevel} XP
           </div>
           <div className="text-[10px] text-gray-500">总投入: {(totalAllTime / 60).toFixed(1)} 小时</div>
        </div>
      </div>

      {/* 经验条 */}
      <div className="h-3 w-full bg-black/40 rounded-full overflow-hidden border border-white/5 relative z-10">
        <div 
          className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 shadow-[0_0_10px_rgba(6,182,212,0.5)] transition-all duration-1000 ease-out relative"
          style={{ width: `${stats.progressPercent}%` }}
        >
          {/* 扫光动画 */}
          <div className="absolute inset-0 bg-white/30 w-full animate-[shimmer_2s_infinite] translate-x-[-100%]"></div>
        </div>
      </div>
    </div>
  );
};

// --- 4. 组件：学习进度面板 ---
const LearningProgressPanel = ({ learningProgress, onProgressUpdate, isMobileView }) => {
  const [editingSubject, setEditingSubject] = useState(null);
  const [tempContent, setTempContent] = useState(''); 

  const startEdit = (subjectKey, currentContent) => {
    setEditingSubject(subjectKey);
    setTempContent(currentContent);
  };

  const saveEdit = (subjectKey) => {
    onProgressUpdate(subjectKey, tempContent, 'manual');
    setEditingSubject(null);
  };
  
  const subjects = Object.entries(SUBJECT_CONFIG);

  return (
    <div className="bg-[#1a1a20] border border-gray-700/50 rounded-xl p-4 space-y-3 relative z-10 shadow-lg">
      <h2 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2 mb-3">
        <TrendingUp className="w-4 h-4 text-cyan-400" /> 学习进度追踪
      </h2>

      {subjects.map(([key, config]) => (
        <div key={key} className="bg-gray-900/50 p-3 rounded-lg border border-gray-800 space-y-2">
          <div className="flex justify-between items-start mb-1">
            <span className={`font-semibold ${config.color}`}>{config.name}</span>
            <button 
              onClick={() => startEdit(key, learningProgress[key].content)}
              className="text-gray-500 hover:text-cyan-400 transition flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-gray-800/50 hover:bg-gray-700"
            >
              <Edit className="w-3 h-3 flex-shrink-0" /> 编辑
            </button>
          </div>
          
          <div className="text-xs text-gray-300 bg-black/30 p-2 rounded-lg max-h-24 overflow-y-auto whitespace-pre-wrap font-mono scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent">
             {learningProgress[key].content || '暂无详细学习记录。'}
          </div>

          <p className="text-[10px] text-gray-500 mt-1 text-right">上次更新: {learningProgress[key].lastUpdate}</p>
        </div>
      ))}

      {editingSubject && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[110] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-gray-900 border border-cyan-500/30 rounded-2xl p-6 max-w-lg w-full shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-4">编辑: {SUBJECT_CONFIG[editingSubject].name} 学习内容</h3>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">学习内容详情（可换行，最多 5000 字）</label>
            <textarea 
              value={tempContent} 
              onChange={(e) => setTempContent(e.target.value)}
              className="w-full bg-black/50 border border-gray-700 rounded-xl p-3 text-white font-mono mb-4 min-h-[200px] resize-none text-sm"
              autoFocus
            />
            <div className="flex gap-3">
              <button onClick={() => setEditingSubject(null)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium py-2.5 rounded-lg transition-colors">取消</button>
              <button onClick={() => saveEdit(editingSubject)} className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2.5 rounded-lg transition-colors">保存</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// 历史记录查看组件
const HistoryView = ({ history, isOpen, onClose }) => {
  const [selectedDate, setSelectedDate] = useState(getTodayDateString());
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  if (!isOpen) return null;

  const selectedDateData = history.find((d) => d.date === selectedDate);
  const availableDates = history.map((d) => d.date).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
  
  const totalPages = Math.ceil(availableDates.length / itemsPerPage);
  const paginatedDates = availableDates.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-0 md:p-4 animate-in fade-in duration-200">
      <div className="bg-[#111116] w-full h-full md:max-w-4xl md:h-[85vh] md:rounded-3xl shadow-2xl flex flex-col relative overflow-hidden border-0 md:border border-gray-800">
        <div className="p-4 md:p-6 border-b border-gray-800 flex justify-between items-center bg-[#111116] z-10">
          <div>
            <h2 className="text-lg md:text-2xl font-bold text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 md:w-6 md:h-6 text-cyan-400" />
              历史学习记录
            </h2>
            <p className="text-gray-400 text-xs md:text-sm mt-1">查看往日的学习成果和进度</p>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-white p-2 rounded-full hover:bg-gray-800 transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden flex-col md:flex-row">
          {/* 日期列表 - Mobile: Top Scrollable, Desktop: Left Sidebar */}
          <div className="w-full md:w-1/3 border-b md:border-b-0 md:border-r border-gray-800 flex flex-row md:flex-col h-auto md:h-full">
            <div className="hidden md:block p-4 border-b border-gray-800">
              <h3 className="font-bold text-gray-400 text-sm mb-2">选择日期</h3>
              <div className="flex gap-2 mb-4">
                <button 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-gray-300 py-2 rounded text-sm"
                >
                  上一页
                </button>
                <button 
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="flex-1 bg-gray-800 hover:bg-gray-700 disabled:opacity-50 text-gray-300 py-2 rounded text-sm"
                >
                  下一页
                </button>
              </div>
              <div className="text-xs text-gray-500 text-center">
                第 {currentPage} 页，共 {totalPages} 页
              </div>
            </div>
            
            <div className="flex-1 overflow-x-auto md:overflow-x-hidden md:overflow-y-auto flex md:block scrollbar-hide">
              {paginatedDates.map((date) => (
                <button
                  key={date}
                  onClick={() => setSelectedDate(date)}
                  className={`flex-shrink-0 md:w-full text-left p-3 border-r md:border-r-0 md:border-b border-gray-800 hover:bg-gray-800/50 transition whitespace-nowrap md:whitespace-normal ${
                    selectedDate === date ? 'bg-cyan-900/30 border-cyan-500/50' : ''
                  }`}
                >
                  <div className="font-medium text-white text-sm md:text-base">{date}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    {history.find((d) => d.date === date)?.studyMinutes || 0} 分钟学习
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* 详情面板 */}
          <div className="flex-1 p-4 md:p-6 overflow-y-auto">
            {selectedDateData ? (
              <div>
                <h3 className="text-lg md:text-xl font-bold text-white mb-4 flex items-center gap-2 flex-wrap">
                  {selectedDate}
                  <span className="text-xs md:text-sm font-normal bg-emerald-900/30 text-emerald-400 px-2 py-1 rounded">
                    {selectedDateData.studyMinutes} 分钟学习
                  </span>
                </h3>

                <div className="grid grid-cols-2 gap-3 md:gap-4 mb-6">
                  <div className="bg-gray-900/50 p-3 md:p-4 rounded-lg border border-gray-800">
                    <div className="text-gray-400 text-xs md:text-sm">游戏券余额</div>
                    <div className="text-purple-400 font-bold text-base md:text-lg">{selectedDateData.gameBank}m</div>
                  </div>
                  <div className="bg-gray-900/50 p-3 md:p-4 rounded-lg border border-gray-800">
                    <div className="text-gray-400 text-xs md:text-sm">游戏时间使用</div>
                    <div className="text-blue-400 font-bold text-base md:text-lg">{selectedDateData.gameUsed}m</div>
                  </div>
                </div>

                <h4 className="font-bold text-gray-400 mb-3 text-sm md:text-base">学习记录</h4>
                <div className="space-y-3 pb-16 md:pb-0">
                  {selectedDateData.logs && selectedDateData.logs.length > 0 ? (
                    selectedDateData.logs.map((log, index) => (
                      <div key={index} className="bg-[#1a1a20] p-3 md:p-4 rounded-lg border-l-2 border-emerald-500/50">
                        <div className="flex justify-between text-gray-500 text-xs md:text-sm mb-2">
                          <span className="font-mono text-emerald-600">{log.time}</span>
                          <span className="text-emerald-500/80">+{log.duration}m</span>
                        </div>
                        <div className="text-gray-300 text-sm md:text-base">{log.content}</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center text-gray-500 py-8">
                      该日期没有学习记录
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500 py-16">
                <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <div>选择日期查看详细记录</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// 移动端底部导航组件
const MobileNav = ({ 
  mode, 
  switchMode, 
  startAICoach, 
  showSettings, 
  setShowSettings, 
  todayStats, 
  activeView, 
  setActiveView,
  openManualLog,
  unreadAIMessages,
  showHistory,
  setShowHistory
}) => {
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#111116] border-t border-gray-800 p-2 z-50 safe-area-bottom">
      <div className="flex justify-around items-center">
        <button 
          onClick={() => setActiveView('timer')}
          className={`flex flex-col items-center p-2 rounded-lg ${activeView === 'timer' ? 'text-cyan-400 bg-cyan-500/20' : 'text-gray-400'}`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] mt-1">主页</span>
        </button>
        
        <button 
          onClick={() => setActiveView('stats')}
          className={`flex flex-col items-center p-2 rounded-lg ${activeView === 'stats' ? 'text-emerald-400 bg-emerald-500/20' : 'text-gray-400'}`}
        >
          <BarChart3 className="w-5 h-5" />
          <span className="text-[10px] mt-1">数据</span>
        </button>
        
        <button 
          onClick={() => setShowHistory(true)}
          className="flex flex-col items-center p-2 rounded-lg text-gray-400 hover:text-blue-400"
        >
          <History className="w-5 h-5" />
          <span className="text-[10px] mt-1">历史</span>
        </button>
        
        <button 
          onClick={openManualLog}
          className="flex flex-col items-center p-2 rounded-lg text-gray-400 hover:text-emerald-400"
        >
          <PlusCircle className="w-5 h-5" />
          <span className="text-[10px] mt-1">补录</span>
        </button>
        
      {/* --- 移动端 AI 导师按钮 (能量核心版) --- */}
        <button 
          onClick={startAICoach}
          className={`flex flex-col items-center p-2 rounded-lg relative transition-all duration-300 ${unreadAIMessages > 0 ? 'text-fuchsia-300' : 'text-gray-400 hover:text-fuchsia-400'}`}
        >
          {/* 背景光晕 (仅有消息时显示) */}
          {unreadAIMessages > 0 && (
            <div className="absolute inset-0 bg-fuchsia-500/10 rounded-lg animate-pulse blur-sm"></div>
          )}

          <div className="relative">
            {/* 图标：有消息时剧烈跳动 */}
            <MessageCircle className={`w-6 h-6 z-10 relative ${unreadAIMessages > 0 ? 'animate-[bounce_1s_infinite] text-fuchsia-400 drop-shadow-[0_0_8px_rgba(232,121,249,0.8)]' : ''}`} />
            
            {/* 移动端红点：改成青色激光点，形成红蓝撞色 */}
            {unreadAIMessages > 0 && (
              <span className="absolute -top-1 -right-1.5 flex h-4 w-4 z-20">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-cyan-500 border-2 border-[#111116] items-center justify-center">
                   <span className="text-[9px] font-bold text-black font-mono">
                     {unreadAIMessages}
                   </span>
                </span>
              </span>
            )}
          </div>
          
          <span className={`text-[10px] mt-1 z-10 relative ${unreadAIMessages > 0 ? 'font-black text-fuchsia-400 tracking-wider scale-105' : ''}`}>
             {unreadAIMessages > 0 ? 'ALERT' : 'AI导师'}
          </span>
        </button>
        
        <button 
          onClick={() => setShowSettings(!showSettings)}
          className="flex flex-col items-center p-2 rounded-lg text-gray-400 hover:text-white"
        >
          <Settings className="w-5 h-5" />
          <span className="text-[10px] mt-1">设置</span>
        </button>
      </div>
    </div>
  );
};

// --- 5. 主组件 ---
export default function LevelUpApp() {
  // 1. 先定义所有的 State (必须放在最前面！)
  const [loading, setLoading] = useState(true);
  
  // 核心状态
  const [mode, setMode] = useState('focus'); 
  const [timeLeft, setTimeLeft] = useState(45 * 60);
  const [isActive, setIsActive] = useState(false);
  const [initialTime, setInitialTime] = useState(45 * 60);
  const [lastActiveTime, setLastActiveTime] = useState(null); 
  const [stage, setStage] = useState(getStageInfo());
  const [isZen, setIsZen] = useState(false);
  const [customTargetHours, setCustomTargetHours] = useState(null); 
  const [activeView, setActiveView] = useState('timer'); 
  
  // 数据状态
  const [todayStats, setTodayStats] = useState({ date: getTodayDateString(), studyMinutes: 0, gameBank: 0, gameUsed: 0, logs: [] });
  const [history, setHistory] = useState([]);
  const [learningProgress, setLearningProgress] = useState(initialProgress); 
  
  // AI 设置状态
  const [apiKey, setApiKey] = useState(''); 
  const [apiBaseUrl, setApiBaseUrl] = useState('https://api.siliconflow.cn/v1'); 
  const [apiModel, setApiModel] = useState('deepseek-ai/DeepSeek-R1');
  const [selectedProvider, setSelectedProvider] = useState('siliconflow');
  const [customPersona, setCustomPersona] = useState(''); 
  const [customUserBackground, setCustomUserBackground] = useState('');
  const [zenQuote, setZenQuote] = useState('');
  const [deepThinkingMode, setDeepThinkingMode] = useState(false); 
  
  const [availableModels, setAvailableModels] = useState([]);
  const [isFetchingModels, setIsFetchingModels] = useState(false);
  const [isModelListOpen, setIsModelListOpen] = useState(false);
  const [modelSearch, setModelSearch] = useState('');
  
  // 自定义气泡颜色
  const [userBubbleColor, setUserBubbleColor] = useState('#059669');
  const [aiBubbleColor, setAiBubbleColor] = useState('#ffffff');

  // 聊天状态 (注意：showChatModal 和 unreadAIMessages 在这里定义)
  const [chatMessages, setChatMessages] = useState([]); 
  const [chatInput, setChatInput] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false); // <--- 定义在这里
  const [unreadAIMessages, setUnreadAIMessages] = useState(0); // <--- 定义在这里

  // 图像识别状态
  const [selectedImages, setSelectedImages] = useState([]);
  const [imageDescriptions, setImageDescriptions] = useState({});

  // 界面模态框状态
  const [showLogModal, setShowLogModal] = useState(false);
  const [isManualLog, setIsManualLog] = useState(false); 
  const [manualDuration, setManualDuration] = useState(45); 
  const [showStopModal, setShowStopModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [logContent, setLogContent] = useState('');
  const [pendingStudyTime, setPendingStudyTime] = useState(0); 
  const [isFullscreen, setIsFullscreen] = useState(false);

  // 通知与确认框状态
  const [notifications, setNotifications] = useState([]);
  const [confirmState, setConfirmState] = useState({ isOpen: false, title: '', message: '', onConfirm: () => {}, isDangerous: false, confirmText: '确定' });
  const [pendingImportData, setPendingImportData] = useState(null);

  // 2. 然后定义 Refs (普通 Refs)
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const timerRef = useRef(null);
  const appContainerRef = useRef(null);
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const [isPipActive, setIsPipActive] = useState(false); // PiP 状态

  // 3. 【关键修复】定义用于追踪 State 的 Refs (必须放在 useState 之后！)
  const showChatModalRef = useRef(showChatModal);
  const unreadAIMessagesRef = useRef(unreadAIMessages);

  // 4. 【关键修复】同步 State 到 Ref 的 useEffect
  useEffect(() => {
    showChatModalRef.current = showChatModal;
  }, [showChatModal]);

  useEffect(() => {
    unreadAIMessagesRef.current = unreadAIMessages;
  }, [unreadAIMessages]);

  // ... (后面的代码不需要动：sendNotification, Toast 等组件逻辑，以及后续的 functions) ...

  // --- 通知系统逻辑 ---
  const addNotification = (message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const closeConfirm = () => {
    setConfirmState(prev => ({ ...prev, isOpen: false }));
  };

  // --- 数据加载与保存 ---
  const saveLearningProgress = (progress) => {
    setLearningProgress(progress);
    try {
      localStorage.setItem('levelup_progress', JSON.stringify(progress));
    } catch (e) {
      console.error("Progress Save Error", e);
    }
  };

  const autoUpdateProgress = (logContent, currentProgress) => {
    const newProgress = JSON.parse(JSON.stringify(currentProgress)); 
    const lowerLog = logContent.toLowerCase();
    const date = getTodayDateString();
    let updated = false;

    Object.entries(SUBJECT_CONFIG).forEach(([key, config]) => {
      const isMatch = config.keyword.some((kw) => lowerLog.includes(kw.toLowerCase()));
      if (isMatch) {
        const existingContent = newProgress[key].content.trim();
        const newEntry = `[${date} 打卡] ${logContent}`;
        
        if (!existingContent.includes(newEntry.substring(0, 50))) { 
          const separator = existingContent ? "\n---\n" : "";
          newProgress[key].content = (existingContent + separator + newEntry).substring(0, 5000); 
          newProgress[key].lastUpdate = date;
          updated = true;
        }
      }
    });
    
    if (updated) {
      saveLearningProgress(newProgress);
    }
    return updated;
  };

  const saveTimerState = (active, left, initial, currentMode) => {
    const state = {
      isActive: active,
      timeLeft: left,
      initialTime: initial,
      mode: currentMode,
      timestamp: active ? Date.now() : null, 
    };
    localStorage.setItem('levelup_timer_state', JSON.stringify(state));
  };

  const loadData = () => {
    try {
      const todayStr = getTodayDateString();
      const storedHistoryText = localStorage.getItem('levelup_history');
      let storedHistory = [];
      
      if (storedHistoryText) {
        try {
          storedHistory = JSON.parse(storedHistoryText);
          if (!Array.isArray(storedHistory)) storedHistory = [];
        } catch (e) {
          console.error("JSON Parse Error", e);
          storedHistory = [];
        }
      }
      
      const storedKey = localStorage.getItem('ai_api_key') || '';
      const storedBaseUrl = localStorage.getItem('ai_base_url') || 'https://api.siliconflow.cn/v1';
      const storedModel = localStorage.getItem('ai_model') || 'deepseek-ai/DeepSeek-R1';
      const storedProvider = localStorage.getItem('ai_provider') || 'siliconflow';
      const storedPersona = localStorage.getItem('ai_persona') || '';
      const storedUserBackground = localStorage.getItem('user_background') || ''; // 新增：个人背景
      const storedTargetHours = localStorage.getItem('target_hours') ? parseFloat(localStorage.getItem('target_hours')) : null;
      const storedManualStage = localStorage.getItem('manual_stage'); // 新增：手动阶段
      const storedDeepThinking = localStorage.getItem('deep_thinking_mode') === 'true';

      const storedUserColor = localStorage.getItem('user_bubble_color') || '#059669';
      const storedAiColor = localStorage.getItem('ai_bubble_color') || '#ffffff';

      const storedModelList = JSON.parse(localStorage.getItem('ai_model_list') || '[]');
      const storedChat = JSON.parse(localStorage.getItem('ai_chat_history') || '[]');
      const storedUnread = parseInt(localStorage.getItem('ai_unread_messages') || '0');

      const storedProgressText = localStorage.getItem('levelup_progress');
      let storedProgress = initialProgress;
      if (storedProgressText) {
        try { 
          const parsed = JSON.parse(storedProgressText);
          if (parsed.english && typeof parsed.english.progress === 'number') {
             storedProgress = initialProgress;
          } else {
             storedProgress = parsed;
          }
        } catch (e) { 
          console.error("Progress JSON Error", e); 
          storedProgress = initialProgress;
        }
      }
      
      setLearningProgress(storedProgress);
      setHistory(storedHistory);
      setApiKey(storedKey);
      setApiBaseUrl(storedBaseUrl);
      setApiModel(storedModel);
      setSelectedProvider(storedProvider);
      setCustomPersona(storedPersona);
      setCustomUserBackground(storedUserBackground); // 新增状态设置
      setCustomTargetHours(storedTargetHours);
      // 阶段判断逻辑：如果有手动设置，用手动的；否则用自动计算的
      if (storedManualStage) {
        setStage(JSON.parse(storedManualStage));
      } else {
        setStage(getStageInfo());
      }
      setDeepThinkingMode(storedDeepThinking);
      setAvailableModels(storedModelList);
      setChatMessages(storedChat);
      setUnreadAIMessages(storedUnread);
      setUserBubbleColor(storedUserColor);
      setAiBubbleColor(storedAiColor);

      const todayData = storedHistory.find((d) => d.date === todayStr);
      if (todayData) {
        setTodayStats(todayData);
      } else {
        // 新的一天：游戏时间重置为 0，不再继承上一天的余额
        setTodayStats({ date: todayStr, studyMinutes: 0, gameBank: 0, gameUsed: 0, logs: [] });
      }

      const storedTimerStateText = localStorage.getItem('levelup_timer_state');
      if (storedTimerStateText) {
        const storedTimerState = JSON.parse(storedTimerStateText);
        
        if (storedTimerState.isActive && storedTimerState.timestamp) {
          const elapsed = (Date.now() - storedTimerState.timestamp) / 1000;
          const recoveredTimeLeft = storedTimerState.timeLeft - elapsed;

          if (recoveredTimeLeft > 1) { 
            setTimeLeft(Math.floor(recoveredTimeLeft));
            setInitialTime(storedTimerState.initialTime);
            setMode(storedTimerState.mode);
            setTimeout(() => {
                setIsActive(true);
                addNotification(`倒计时已从上次进度恢复: ${formatTime(Math.floor(recoveredTimeLeft))}`, "success");
            }, 100); 
            
          } else {
            addNotification("应用恢复，但计时器已超时，请重新开始或打卡。", "info");
            saveTimerState(false, 45 * 60, 45 * 60, 'focus'); 
          }
        } else {
          setInitialTime(storedTimerState.initialTime);
          setTimeLeft(storedTimerState.timeLeft);
          setMode(storedTimerState.mode);
        }
      }
    } catch (e) { 
      console.error("Load Error", e); 
      addNotification("数据加载遇到一些小问题，已重置为安全状态。", "error");
    }
    setLoading(false);
  };

  const saveData = (newTodayStats) => {
    try {
      const todayStr = getTodayDateString();
      let storedHistory = [...history]; 
      storedHistory = storedHistory.filter(d => d.date !== todayStr);
      storedHistory.unshift(newTodayStats);
      storedHistory.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      localStorage.setItem('levelup_history', JSON.stringify(storedHistory));
      setTodayStats(newTodayStats);
      setHistory(storedHistory);
    } catch (e) { 
      console.error("Save Error", e);
      addNotification("保存数据失败，可能是存储空间已满。", "error");
    }
  };
  
  const handleProgressUpdate = (subjectKey, newContent, type = 'manual') => {
    setLearningProgress((prev) => {
      const updated = {
        ...prev,
        [subjectKey]: {
          content: newContent,
          lastUpdate: getTodayDateString()
        }
      };
      saveLearningProgress(updated);
      if (type === 'manual') {
        addNotification(`${SUBJECT_CONFIG[subjectKey].name} 学习内容已更新`, "info");
      }
      return updated;
    });
  };

  const saveAISettings = (key, baseUrl, model, provider, persona, modelList = availableModels) => {
    setApiKey(key); setApiBaseUrl(baseUrl); setApiModel(model); setSelectedProvider(provider); setCustomPersona(persona); setAvailableModels(modelList);
    localStorage.setItem('ai_api_key', key);
    localStorage.setItem('ai_base_url', baseUrl);
    localStorage.setItem('ai_model', model);
    localStorage.setItem('ai_provider', provider);
    localStorage.setItem('ai_persona', persona);
    localStorage.setItem('ai_model_list', JSON.stringify(modelList));
  };

  const saveBubbleColors = (userColor, aiColor) => {
    setUserBubbleColor(userColor);
    setAiBubbleColor(aiColor);
    localStorage.setItem('user_bubble_color', userColor);
    localStorage.setItem('ai_bubble_color', aiColor);
  };

  const saveTargetHours = (hours) => {
    setCustomTargetHours(hours);
    if (hours) {
      localStorage.setItem('target_hours', hours.toString());
    } else {
      localStorage.removeItem('target_hours');
    }
  }

  const saveDeepThinkingMode = (enabled) => {
    setDeepThinkingMode(enabled);
    localStorage.setItem('deep_thinking_mode', enabled.toString());
  };

  const saveUnreadMessages = (count) => {
    setUnreadAIMessages(count);
    localStorage.setItem('ai_unread_messages', count.toString());
  };

// --- 2. 增强版：绘制悬浮窗内容 (防黑屏 + 美化 + 亮框提醒) ---
  const updatePiP = (seconds, currentMode) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // 1. 智能背景色：普通状态深色护眼，时间到(<=0)变成鲜艳的亮红色/绿色
    if (seconds <= 0) {
        // 时间到！红绿闪烁背景 (模拟亮框效果)
        const isEvenSecond = Math.floor(Date.now() / 500) % 2 === 0;
        ctx.fillStyle = isEvenSecond ? '#ef4444' : '#22c55e'; // 红绿交替
    } else {
        // 正常倒计时背景 (根据模式：专注深绿 / 休息深蓝)
        ctx.fillStyle = currentMode === 'focus' ? '#022c22' : '#172554'; 
    }
    
    // 绘制圆角矩形背景
    ctx.fillRect(0, 0, width, height);

    // 2. 绘制时间文字 (超大字体填满画面)
    ctx.fillStyle = '#ffffff';
    // 根据时间长度动态调整字号，保证不溢出
    const fontSize = seconds > 3600 ? 40 : 48; 
    ctx.font = `bold ${fontSize}px "Segoe UI", Roboto, sans-serif`; 
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // 如果时间到了，显示 "TIME UP"
    const text = seconds <= 0 ? "DONE!" : formatTime(seconds);
    
    // 添加文字阴影，增加立体感
    ctx.shadowColor = "rgba(0, 0, 0, 0.5)";
    ctx.shadowBlur = 4;
    ctx.shadowOffsetX = 2;
    ctx.shadowOffsetY = 2;
    
    ctx.fillText(text, width / 2, height / 2 + 2); // 微调垂直居中
    
    // 重置阴影
    ctx.shadowColor = "transparent";

    // 3. 关键修复黑屏：强制刷新视频流
    if (video.srcObject) {
        // 如果流已经存在，不需要重新 capture，但为了防黑屏，画一点微小的噪点或动态条
        // (这里用一个极小的透明矩形刷新画布状态)
        ctx.fillStyle = 'rgba(255,255,255,0.01)';
        ctx.fillRect(0, 0, 1, 1);
    } else {
       // 首次捕获
       const stream = canvas.captureStream(30);
       video.srcObject = stream;
       // 强制播放，解决某些浏览器黑屏
       video.play().then(() => {}).catch((e) => console.log("PiP play fix:", e));
    }
  };

  // --- 3. 新增：切换悬浮窗开关 ---
  const togglePiP = async () => {
    try {
      if (document.pictureInPictureElement) {
        // 如果已经开了，就关掉
        await document.exitPictureInPicture();
        setIsPipActive(false);
      } else if (videoRef.current) {
        // 先更新一次画面，防止黑屏
        updatePiP(timeLeft, mode);
        // 请求进入画中画
        await videoRef.current.requestPictureInPicture();
        setIsPipActive(true);
      }
    } catch (err) {
      console.error(err);
      addNotification("开启悬浮窗失败，请在浏览器设置中允许，或先点击开始计时。", "error");
    }
  };

 // --- 4. 优化：实时更新悬浮窗画面 (加入定时刷新防黑屏) ---
  useEffect(() => {
     let intervalId;
     
     // 只要悬浮窗开着，就开启一个高频刷新器
     if (isPipActive) {
        // 立即画一次
        updatePiP(timeLeft, mode);
        
        // 每秒强制刷新一次画面 (防止视频流因画面静止被浏览器暂停导致黑屏)
        // 同时也负责驱动“时间到”时的闪烁效果
        intervalId = setInterval(() => {
            updatePiP(timeLeft, mode);
        }, 500);
     } else if (isActive) {
        // 如果没开悬浮窗，但计时器在跑，只在 timeLeft 变化时更新 (这是上面的 useEffect 做的)
        updatePiP(timeLeft, mode);
     }

     return () => {
        if (intervalId) clearInterval(intervalId);
     };
  }, [timeLeft, mode, isActive, isPipActive]);

  useEffect(() => {
    if (chatMessages.length > 0) {
      const recent = chatMessages.slice(-50);
      localStorage.setItem('ai_chat_history', JSON.stringify(recent));
    }
  }, [chatMessages]);

  useEffect(() => { loadData(); }, []);

// --- 核心计时器逻辑 (纯净版：无后台暂停，无省电模式) ---
  useEffect(() => {
    // 只要是激活状态，就一直跑，不监听是否切后台
    if (isActive && timeLeft > 0) {
      // 1. 记录开始状态
      saveTimerState(true, timeLeft, initialTime, mode); 
      
      // 2. 启动定时器 (每秒减1)
      timerRef.current = setInterval(() => { 
        setTimeLeft((prev) => {
          const newTime = Math.max(0, prev - 1);
          // 实时保存，防止刷新丢失
          saveTimerState(true, newTime, initialTime, mode); 
          return newTime;
        }); 
      }, 1000);

    } else if (timeLeft <= 0 && isActive) {
      // 3. 时间走完，触发完成逻辑
      handleTimerComplete();
      
    } else if (!isActive) {
      // 4. 如果是暂停状态，保存当前进度
      saveTimerState(false, timeLeft, initialTime, mode);
    }
    
    // 组件卸载或状态变化时，清理旧的定时器，防止冲突
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, timeLeft, initialTime, mode]);

// --- 终极版：每日自动复盘 (防重复 + 隐式触发) ---
  useEffect(() => {
    // 必须等待基础数据加载完成
    if (loading || history.length === 0) return;

    const checkDailyReview = () => {
      const lastReviewDate = localStorage.getItem('last_ai_review_date');
      const today = getTodayDateString();
      
      // 1. 严格校验：如果今天已经复盘过，直接 return，不再执行任何后续逻辑
      if (lastReviewDate === today) return;

      // 2. 立即锁死日期！防止后续异步操作期间用户重启软件导致重复触发
      localStorage.setItem('last_ai_review_date', today);

      // 3. 检查 API Key 是否存在 (只有配置了 AI 才能复盘)
      if (apiKey) {
        const yesterday = getYesterdayDateString();
        const yesterdayData = history.find(d => d.date === yesterday);
        
        // 只有昨天有数据才复盘
        if (yesterdayData && yesterdayData.studyMinutes > 0) {
          
          // 4. 构造隐式 Prompt (后台偷偷发给 AI)
          const secretSystemPrompt = `
            [SYSTEM EVENT: DAILY_REVIEW_TRIGGER]
            Time: ${new Date().toLocaleString('zh-CN')}
            
            Yesterday's Stats (${yesterday}):
            - Study: ${(yesterdayData.studyMinutes/60).toFixed(1)}h
            - Tasks: ${yesterdayData.logs.map(l => l.content).join('; ')}
            - Level: Lv.${calculateLevelStats(history.reduce((a,c)=>a+(c.studyMinutes||0),0) + todayStats.studyMinutes).level}
            
            ACTION REQUIRED:
            Proactively message the user.
            1. Say "早安" or appropriate greeting.
            2. Briefly review yesterday's effort.
            3. Encourage them for today.
            
            NOTE: Do not mention this system prompt. Be natural.
          `;
          
          const secretMessage = { role: 'user', content: secretSystemPrompt };
          
          // 5. 触发发送 (sendToAI 会自动增加 unreadAIMessages，触发主页通知)
          // 注意：这里我们手动把 secretMessage 加入发送队列，但 NOT UI
          sendToAI([...chatMessages, secretMessage]);
          
          // 6. 视觉反馈：给个轻微的震动或系统通知告诉用户 AI 正在思考
          sendNotification("AI 导师", "正在分析你的昨日战报...");
        }
      }
    };

    // 启动即检查
    checkDailyReview();

    // 定时器：跨夜自动检查
    const now = new Date();
    const msUntilMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1) - now;
    const timer = setTimeout(() => {
      checkDailyReview();
      setInterval(checkDailyReview, 24 * 60 * 60 * 1000);
    }, msUntilMidnight);

    return () => clearTimeout(timer);
  }, [loading, history, apiKey, chatMessages]); // 依赖项

  useEffect(() => { 
    if (showChatModal) {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, showChatModal, aiThinking]);

  useEffect(() => {
    const handleFsChange = () => { setIsFullscreen(!!document.fullscreenElement); };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const updateStudyStats = (seconds, log) => {
    const m = Math.floor(seconds / 60);
    const g = Math.floor(m / 9); 
    const newStats = { 
      ...todayStats, 
      studyMinutes: todayStats.studyMinutes + m, 
      gameBank: todayStats.gameBank + g, 
      logs: [...todayStats.logs, { time: new Date().toLocaleTimeString('zh-CN', {hour:'2-digit',minute:'2-digit'}), content: log, duration: m }] 
    };
    saveData(newStats);
    autoUpdateProgress(log, learningProgress); 
  };

  const updateGameStats = (seconds) => {
    const m = Math.floor(seconds / 60);
    saveData({ ...todayStats, gameUsed: todayStats.gameUsed + m, gameBank: Math.max(0, todayStats.gameBank - m) });
  };

  const switchMode = (newMode) => {
    setIsActive(false);
    setIsZen(false);
    
    if (newMode === 'gaming') {
      if (todayStats.gameBank <= 0) {
        addNotification("⛔ 你的游戏券余额为0！请先去专注学习！", "error");
        setMode('focus');
        setInitialTime(45 * 60);
        setTimeLeft(45 * 60);
        return;
      }
      const availableSeconds = todayStats.gameBank * 60;
      setMode(newMode);
      setInitialTime(availableSeconds);
      setTimeLeft(availableSeconds);
    } else {
      setMode(newMode);
      if (newMode === 'focus') {
        const defaultFocusTime = 45 * 60;
        setInitialTime(defaultFocusTime);
        setTimeLeft(defaultFocusTime);
      } else if (newMode === 'break') {
        const defaultBreakTime = 10 * 60;
        setInitialTime(defaultBreakTime); 
        setTimeLeft(defaultBreakTime);
      }
    }
    saveTimerState(false, timeLeft, initialTime, newMode);
  };

  const openManualLog = () => {
    setIsManualLog(true);
    setManualDuration(45); 
    setLogContent('');
    setShowLogModal(true);
  };

  const saveLog = () => { 
    if(logContent.trim()){ 
      const durationToSave = isManualLog ? (manualDuration * 60) : pendingStudyTime;
      
      updateStudyStats(durationToSave, logContent); 
      setShowLogModal(false); 
      setLogContent(''); 
      setIsManualLog(false);
      
      if (isManualLog) {
          addNotification(`成功补录 ${manualDuration} 分钟学习记录！`, "success");
      } else {
          addNotification("学习记录已保存，休息一下吧！", "success");
          switchMode('break'); 
      }
      saveTimerState(false, 45 * 60, 45 * 60, 'focus'); 
    }
  };

 const handleTimerComplete = () => {
    // --- 新增：发送通知 ---
    const title = mode === 'focus' ? "🎉 专注完成！" : "💪 休息结束！";
    const body = mode === 'focus' ? "真棒！去领奖励吧！" : "该回到学习状态了！";
    sendNotification(title, body);
    // -------------------

    setIsActive(false); 
    setIsZen(false);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    clearInterval(timerRef.current);
    
    localStorage.removeItem('levelup_timer_state');
    
    if (mode === 'focus') {
      setPendingStudyTime(initialTime); 
      setIsManualLog(false); 
      setShowLogModal(true);
    } else if (mode === 'gaming') {
      updateGameStats(initialTime); 
      addNotification("⚠️ 游戏时间耗尽！该回去学习了！", "error");
      switchMode('focus');
    } else { 
      addNotification("🔔 休息结束！开始专注吧。", "info");
      switchMode('focus');
    }
  };

  const toggleFullScreen = async () => {
    if (!appContainerRef.current) return;
    const isFullscreenAvailable = document.fullscreenEnabled || (document as any).webkitFullscreenEnabled;
    if (!isFullscreenAvailable) {
      addNotification("您的浏览器不支持全屏模式", "error");
      return;
    }

    if (!document.fullscreenElement) {
      try {
        await appContainerRef.current.requestFullscreen();
      } catch (err) { console.log("Fullscr err", err); }
    } else {
      try {
        if (document.exitFullscreen) await document.exitFullscreen();
      } catch (err) { console.log("Exit Fullscr err", err); }
    }
  };
// --- 新增：生成禅模式激励语录 ---
  const fetchZenQuote = async () => {
    if (!apiKey) return; // 如果没有 API Key 就不生成
    
    // 如果有个人背景，也发给 AI，让它生成的句子更贴切
    const backgroundPrompt = customUserBackground ? `用户背景：${customUserBackground}。` : "";
    
    try {
      const cleanBaseUrl = apiBaseUrl.replace(/\/$/, '');
      const response = await fetch(`${cleanBaseUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: apiModel,
          messages: [{ 
            role: "user", 
            content: `${backgroundPrompt}请生成一句非常简短、震撼人心、能激励考研学生坚持下去的励志语录（名人名言或高级心灵鸡汤）。要求：中文，30字以内，不要带引号，不要解释，直接给句子。` 
          }],
          stream: false // 这里不需要流式传输，直接要结果
        })
      });
      const data = await response.json();
      const quote = data.choices?.[0]?.message?.content?.trim();
      if (quote) setZenQuote(quote);
    } catch (e) {
      console.error("Quote fetch failed", e);
    }
  };
  const toggleTimer = () => {
    if (mode === 'gaming' && todayStats.gameBank <= 0 && !isActive) {
      addNotification("余额不足，无法开始游戏！", "error");
      return;
    }
    
    if (!isActive) {
      requestNotificationPermission()
      saveTimerState(true, timeLeft, initialTime, mode);
      setIsActive(true);
      if (mode === 'focus') {
        fetchZenQuote(); // <--- 新增：每次开始专注，就去求一条签！
        setIsZen(true);
        if (appContainerRef.current && document.fullscreenEnabled) {
             appContainerRef.current.requestFullscreen().catch(() => {});
        }
      }
    } else {
      saveTimerState(false, timeLeft, initialTime, mode);
      setIsActive(false);
    }
  };

  const triggerStopTimer = () => setShowStopModal(true);
  
  const confirmStopTimer = () => { 
    setShowStopModal(false); 
    setIsActive(false); 
    setIsZen(false); 
    
    if(document.fullscreenElement) document.exitFullscreen().catch(()=>{}); 

    if (mode === 'gaming') {
      // 游戏模式：扣除已用时间，保留剩余时间
      updateGameStats(initialTime - timeLeft);
      setInitialTime(timeLeft); // 将当前剩余时间设为新的起点
      // timeLeft 保持不变
      saveTimerState(false, timeLeft, timeLeft, mode);
      addNotification("游戏暂停，剩余时间已保存", "info");
    } else {
      // 学习模式：重置回初始设定时间
      const newTimeLeft = initialTime;
      setTimeLeft(newTimeLeft); 
      saveTimerState(false, newTimeLeft, initialTime, mode);
      addNotification("计时已取消", "info");
    }
  };
  
  const cancelStopTimer = () => setShowStopModal(false);

  const handleExportData = () => {
    try {
      const exportData = {
        version: '2.0',
        exportDate: new Date().toISOString(),
        history: history,
        progress: learningProgress,
        settings: {
          customTargetHours: customTargetHours,
          customPersona: customPersona,
          selectedProvider: selectedProvider,
          apiBaseUrl: apiBaseUrl,
          apiModel: apiModel
        }
      };
      const str = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
      const a = document.createElement('a'); 
      a.href = str; 
      a.download = `LevelUp_Backup_${getTodayDateString()}.json`; 
      document.body.appendChild(a); 
      a.click(); 
      document.body.removeChild(a);
      addNotification("完整数据导出成功！", "success");
    } catch(err) {
      addNotification("导出失败，请重试。", "error");
    }
  };
  
  const handleImportData = (e) => {
    const f = e.target.files[0]; 
    if(!f) return; 
    
    const r = new FileReader();
    r.onload = (ev) => { 
      try { 
        const d = JSON.parse(ev.target.result as string); 
        
        if (d.version === '2.0') {
          setPendingImportData(d);
          setConfirmState({
            isOpen: true,
            title: "导入完整备份",
            message: `检测到完整备份文件（版本 ${d.version}）。导入将覆盖当前的所有学习数据、进度和设置（除API Key外）。确定继续吗？`,
            onConfirm: () => confirmImportData(d),
            isDangerous: true,
            confirmText: "覆盖并导入"
          });
        } else if (Array.isArray(d)) {
          setPendingImportData({ history: d, progress: initialProgress });
          setConfirmState({
            isOpen: true,
            title: "导入旧版备份",
            message: `检测到旧版备份文件（${d.length} 条历史记录）。导入将覆盖当前的历史记录。确定继续吗？`,
            onConfirm: () => confirmImportData({ history: d, progress: initialProgress }),
            isDangerous: true,
            confirmText: "覆盖并导入"
          });
        } else if (d.history) {
          setPendingImportData(d);
          setConfirmState({
            isOpen: true,
            title: "导入备份",
            message: `解析到 ${d.history.length} 条历史记录。导入将覆盖当前的历史记录和学习进度，确定继续吗？`,
            onConfirm: () => confirmImportData(d),
            isDangerous: true,
            confirmText: "覆盖并导入"
          });
        } else {
          addNotification("文件格式错误：必须是有效的备份文件。", "error");
        }
      } catch(err){
        addNotification("文件解析失败，请检查文件是否损坏。", "error");
      } 
    };
    r.readAsText(f);
    e.target.value = '';
  };

  const confirmImportData = (data) => {
    try {
      localStorage.setItem('levelup_history', JSON.stringify(data.history));
      localStorage.setItem('levelup_progress', JSON.stringify(data.progress || initialProgress));
      
      if (data.version === '2.0' && data.settings) {
        const settings = data.settings;
        if (settings.customTargetHours !== undefined) {
          localStorage.setItem('target_hours', settings.customTargetHours);
        }
        if (settings.customPersona) {
          localStorage.setItem('ai_persona', settings.customPersona);
        }
        if (settings.selectedProvider) {
          localStorage.setItem('ai_provider', settings.selectedProvider);
        }
        if (settings.apiBaseUrl) {
          localStorage.setItem('ai_base_url', settings.apiBaseUrl);
        }
        if (settings.apiModel) {
          localStorage.setItem('ai_model', settings.apiModel);
        }
      }
      
      loadData();
      closeConfirm();
      addNotification("数据导入成功！", "success");
      setPendingImportData(null);
    } catch (error) {
      addNotification("导入过程中出现错误: " + error.message, "error");
    }
  };

  const fetchAvailableModels = async () => {
    if (!apiKey) return addNotification("请先输入 API Key！", "error");
    setIsFetchingModels(true);
    try {
      const cleanBaseUrl = apiBaseUrl.replace(/\/$/, '');
      const response = await fetch(`${cleanBaseUrl}/models`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      if (!response.ok) throw new Error(`HTTP Error: ${response.status}`);
      const data = await response.json();
      if (data.data && Array.isArray(data.data)) {
        const models = data.data.map((m) => m.id).sort();
        setAvailableModels(models);
        saveAISettings(apiKey, apiBaseUrl, apiModel, selectedProvider, customPersona, models);
        setIsModelListOpen(true); 
        addNotification(`成功获取 ${models.length} 个模型`, "success");
      } else {
        addNotification("获取成功，但返回格式无法解析。", "error");
      }
    } catch (error) {
      addNotification(`获取失败: ${error.message}`, "error");
    } finally {
      setIsFetchingModels(false);
    }
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length + selectedImages.length > 5) {
      addNotification("最多只能上传5张图片", "error");
      return;
    }

    const newImages = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file as Blob),
      id: Date.now() + Math.random()
    }));

    setSelectedImages(prev => [...prev, ...newImages]);
    e.target.value = '';
  };

  const removeImage = (id) => {
    setSelectedImages(prev => {
      const imageToRemove = prev.find(img => img.id === id);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.preview);
      }
      return prev.filter(img => img.id !== id);
    });
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result;
        const base64 = (result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
    });
  };

  // --------------------------------------------------------------------------
  // Send AI Message (Streaming Implementation)
  // --------------------------------------------------------------------------
  const sendToAI = async (newMessages, images = []) => {
    setAiThinking(true);
    // Add placeholder assistant message
    const placeholderId = Date.now();
    setChatMessages(prev => [...prev, { role: 'assistant', content: '', id: placeholderId }]);

    try {
      const cleanBaseUrl = apiBaseUrl.replace(/\/$/, '');
      const endpoint = `${cleanBaseUrl}/chat/completions`;
      
      let messages = [...newMessages];
      
      // Handle images for multimodal models
      if (images.length > 0 && (selectedProvider === 'deepseek' || selectedProvider === 'doubao' || selectedProvider === 'google')) {
        const lastUserMessage = messages[messages.length - 1];
        if (lastUserMessage.role === 'user') {
          lastUserMessage.content = [
            { type: 'text', text: lastUserMessage.content },
            ...images.map(img => ({
              type: 'image_url',
              image_url: { url: img.preview }
            }))
          ];
        }
      }
      
      const requestBody = {
        model: apiModel,
        messages: messages,
        temperature: deepThinkingMode ? 0.3 : 0.7,
        max_tokens: deepThinkingMode ? 4000 : 2000,
        stream: true // Enable streaming
      };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) throw new Error(`API Error: ${response.status}`);
      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let done = false;
      let accumulatedText = "";

      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        const chunkValue = decoder.decode(value, { stream: !done });
        
        // Parse SSE (Server-Sent Events)
        // Format is usually "data: JSON\n\n"
        const lines = chunkValue.split('\n');
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine || trimmedLine === 'data: [DONE]') continue;
            
            if (trimmedLine.startsWith('data: ')) {
                try {
                    const jsonStr = trimmedLine.replace('data: ', '');
                    const json = JSON.parse(jsonStr);
                    // Different providers might have slightly different structures, but OpenAI standard is choices[0].delta.content
                    const content = json.choices?.[0]?.delta?.content || "";
                    
                    if (content) {
                        accumulatedText += content;
                        
                        // Update state in real-time
                        setChatMessages(prev => {
                            const newHistory = [...prev];
                            const lastMsgIndex = newHistory.findIndex(m => m.id === placeholderId);
                            if (lastMsgIndex !== -1) {
                                newHistory[lastMsgIndex] = { 
                                    ...newHistory[lastMsgIndex], 
                                    content: accumulatedText 
                                };
                            }
                            return newHistory;
                        });
                    }
                } catch (e) {
                    console.error("Error parsing stream chunk", e);
                }
            }
        }
      }
      


      if (!showChatModalRef.current) {
        saveUnreadMessages(unreadAIMessagesRef.current + 1);
      }

    } catch (error) {

      if (!showChatModalRef.current) {
        saveUnreadMessages(unreadAIMessagesRef.current + 1);
      }
    } finally {
      setAiThinking(false);
    }
  };

  const startAICoach = () => {
    if (!apiKey) {
      addNotification("请先在设置中输入 API Key！", "error");
      setShowSettings(true);
      return;
    }
    setShowChatModal(true);
    saveUnreadMessages(0); 
    
    const currentPersona = customPersona.trim() || DEFAULT_PERSONA;
    
    if (chatMessages.length === 0 || chatMessages.length === 1 && chatMessages[0].role === 'system') {
      const yesterdayStr = getYesterdayDateString();
      const yesterdayData = history.find(d => d.date === yesterdayStr);
      
      const target = customTargetHours || stage.targetHours;

      let dataContext = `
        --- 实时学习数据 ---
        1. 考研目标: 上海交大/中科大AI硕士(2026)。
        2. 每日目标学习时长: ${target}小时。
        3. 个人背景档案: ${customUserBackground || '未填写'}
        4. 今日(${getTodayDateString()})统计: 已学习 ${(todayStats.studyMinutes / 60).toFixed(1)}h, 游戏券余额 ${todayStats.gameBank}m。
        5. 学习进度板 (最新的学习内容和状态):
           - 英语: ${learningProgress.english.content || '暂无记录'} (更新于 ${learningProgress.english.lastUpdate})
           - 政治: ${learningProgress.politics.content || '暂无记录'} (更新于 ${learningProgress.politics.lastUpdate})
           - 数学: ${learningProgress.math.content || '暂无记录'} (更新于 ${learningProgress.math.lastUpdate})
           - 408: ${learningProgress.cs.content || '暂无记录'} (更新于 ${learningProgress.cs.lastUpdate})
      `;

      if (yesterdayData) {
        const studyHours = (yesterdayData.studyMinutes / 60).toFixed(1);
        dataContext += `\n5. 昨日(${yesterdayStr})统计: 学习 ${studyHours}h (目标 ${target}h), 玩 ${yesterdayData.gameUsed}m。昨日日志摘要: ${yesterdayData.logs.map((l) => typeof l.content === 'string' ? l.content : '日志').join('; ')}`;
      } else {
        dataContext += `\n5. 昨日(${yesterdayStr})无学习记录。`;
      }

      const systemContext = `${currentPersona}\n\n${dataContext}\n\n根据以上学习内容和你的专业知识，评估用户当前学习阶段（${stage.name}）的进度是落后、正常还是超前，并用你的人设给出简洁的分析、建议或鼓励。请使用markdown格式回复，用**粗体**强调重点，用###表示小标题，用-表示列表项。`;

      const initialMsg = { role: 'system', content: systemContext };
      const triggerMsg = { role: 'user', content: "导师，请评估我当前的整体学习情况和进度。" };
      
      const newHistory = [initialMsg, triggerMsg];
      setChatMessages(newHistory); 
      sendToAI(newHistory);
    }
  };

  const startNewChat = () => {
    setChatMessages([]);
    addNotification("已开始新的对话", "info");
  };

  const clearChatHistory = () => {
    setConfirmState({
      isOpen: true,
      title: "清除聊天记录",
      message: "确定要清除所有聊天记录吗？此操作不可撤销。",
      onConfirm: () => {
        setChatMessages([]);
        localStorage.removeItem('ai_chat_history');
        closeConfirm();
        addNotification("聊天记录已清除", "success");
      },
      isDangerous: true,
      confirmText: "确定清除"
    });
  };

  const handleUserSend = () => {
    if (!chatInput.trim() && selectedImages.length === 0) return;
    
    const currentPersona = customPersona.trim() || DEFAULT_PERSONA;
    
    const userMessage = { 
      role: 'user', 
      content: chatInput,
      images: selectedImages.length > 0 ? [...selectedImages] : undefined
    };
    
    const getSummary = (content) => content ? content.trim().substring(0, 50) + (content.length > 50 ? '...' : '') : '暂无记录';

    const progressSummary = `
      英语: ${getSummary(learningProgress.english.content)} | 
      数学: ${getSummary(learningProgress.math.content)} | 
      政治: ${getSummary(learningProgress.politics.content)} |
      408: ${getSummary(learningProgress.cs.content)}
    `;
    
    const currentContext = { 
      role: 'system', 
      content: `${currentPersona}\n\n[实时数据快照 - 关键进度摘要: ${progressSummary.trim().replace(/\s+/g, ' ')}。今日已学: ${(todayStats.studyMinutes / 60).toFixed(1)}h。]`
    };

    const updatedHistory = [...chatMessages, currentContext, userMessage];
    setChatMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setShowEmojiPicker(false);
    sendToAI(updatedHistory, selectedImages);
    setSelectedImages([]); 
  };

  const handleEmojiClick = (emoji) => {
    setChatInput(prev => prev + emoji);
  };

  const progress = initialTime > 0 ? ((initialTime - timeLeft) / initialTime) * 100 : 0;
  const currentTargetHours = customTargetHours || stage.targetHours;
  const dailyProgressPercent = currentTargetHours > 0 ? Math.min((todayStats.studyMinutes / (currentTargetHours*60)) * 100, 100) : 0;

  const getThemeColor = () => {
    if (mode === 'focus') return 'text-emerald-400 border-emerald-500 shadow-emerald-900/50';
    if (mode === 'break') return 'text-blue-400 border-blue-500 shadow-blue-900/50';
    if (mode === 'gaming') return 'text-purple-400 border-purple-500 shadow-purple-900/50';
  };
  
  const getBgColor = () => {
     if (mode === 'focus') return 'from-emerald-950/90 to-black';
     if (mode === 'break') return 'from-blue-950/90 to-black';
     if (mode === 'gaming') return 'from-purple-950/90 to-black';
  };

  if (loading) return <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center font-mono animate-pulse">正在载入系统...</div>;

  return (
    <div ref={appContainerRef} className={`h-[100dvh] w-full bg-[#0a0a0a] text-gray-100 font-sans flex flex-col md:flex-row overflow-hidden relative selection:bg-cyan-500/30`}>
            <style>{`
  @keyframes cyber-flow {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }
  .cyber-gradient {
    background: linear-gradient(270deg, #ec4899, #8b5cf6, #06b6d4, #ec4899);
    background-size: 300% 300%;
    animation: cyber-flow 3s ease infinite;
  }
`}</style>
            <Toast notifications={notifications} removeNotification={removeNotification} />
   
      <div className="absolute opacity-0 pointer-events-none w-0 h-0 overflow-hidden">
        <canvas ref={canvasRef} width={180} height={60} />
        <video ref={videoRef} muted autoPlay playsInline loop />
      </div>
      
      <ConfirmDialog 
        isOpen={confirmState.isOpen} 
        title={confirmState.title} 
        message={confirmState.message} 
        onConfirm={confirmState.onConfirm} 
        onCancel={closeConfirm}
        isDangerous={confirmState.isDangerous}
        confirmText={confirmState.confirmText}
      />

      <HistoryView 
        history={history}
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
      />

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(20,20,40,0.4),transparent_70%)] pointer-events-none"></div>
      <div className="absolute inset-0 opacity-5 pointer-events-none mix-blend-overlay" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}></div>

      {/* --- 左侧边栏 (动画优化：duration-500 + ease-out 更轻快) --- */}
      <div className={`hidden md:flex flex-col bg-[#111116] gap-4 z-20 h-full relative group scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${isZen ? 'w-0 min-w-0 p-0 opacity-0 border-none pointer-events-none overflow-hidden' : 'w-96 p-6 border-r border-gray-800 opacity-100 overflow-y-auto'}`}>
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/10 via-purple-900/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
        
        {/* 内容容器：min-w 保持内容宽度，防止挤压 */}
        <div className="min-w-[340px] flex flex-col gap-4">
            <div className="flex justify-between items-start relative z-10 flex-shrink-0">
              <div>
                <h1 className="text-3xl font-black italic tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-600 drop-shadow-[0_0_10px_rgba(0,255,255,0.3)]">LEVEL UP!</h1>
                <p className="text-[10px] text-gray-500 font-mono flex items-center gap-1"><Zap className="w-3 h-3 text-yellow-500"/> CHAT COACH EDITION</p>
              </div>
              <button onClick={() => setShowSettings(!showSettings)} className="text-gray-500 hover:text-white transition p-1 hover:bg-gray-800 rounded-full"><Settings className="w-5 h-5" /></button>
            </div>

        {/* --- PC 端 AI 导师按钮 (赛博朋克·终极形态) --- */}
            <button 
              onClick={startAICoach} 
              className={`
                w-full relative group font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all duration-300 overflow-hidden
                ${unreadAIMessages > 0 
                  ? 'border border-fuchsia-400/50 shadow-[0_0_30px_rgba(236,72,153,0.5)] scale-[1.02]' 
                  : 'bg-[#1a1a20] border border-gray-800 hover:border-fuchsia-500/50 hover:shadow-[0_0_20px_rgba(168,85,247,0.2)]'
                }
              `}
            >
              {/* 1. 动态流光背景 (仅在有消息时激活，或者 hover 时隐约出现) */}
              <div className={`absolute inset-0 opacity-0 transition-opacity duration-300 ${unreadAIMessages > 0 ? 'opacity-100 cyber-gradient' : 'group-hover:opacity-20 cyber-gradient'}`}></div>
              
              {/* 2. 呼吸光晕叠加层 (增加层次感) */}
              {unreadAIMessages > 0 && (
                 <div className="absolute inset-0 bg-fuchsia-500/20 animate-pulse mix-blend-overlay"></div>
              )}

              {/* 3. 图标与文字 */}
              <div className="relative z-10 flex items-center gap-2">
                <MessageCircle className={`w-5 h-5 transition-colors ${unreadAIMessages > 0 ? 'text-white drop-shadow-[0_0_5px_rgba(255,255,255,0.8)]' : 'text-fuchsia-500 group-hover:text-fuchsia-400'}`} /> 
                <span className={`tracking-wide ${unreadAIMessages > 0 ? 'text-white font-black drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]' : 'text-gray-300 group-hover:text-white'}`}>
                  {unreadAIMessages > 0 ? 'INCOMING TRANSMISSION' : 'AI COACH TERMINAL'}
                </span>
              </div>

              {/* 4. 赛博风格徽章 (全息投影感) */}
              {unreadAIMessages > 0 && (
                <div className="absolute -top-1.5 -right-1.5 flex h-5 w-5 z-20">
                  {/* 外层雷达波 */}
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  {/* 核心光点 */}
                  <span className="relative inline-flex rounded-full h-5 w-5 bg-gradient-to-br from-cyan-400 to-blue-500 border-2 border-white items-center justify-center shadow-[0_0_10px_#06b6d4]">
                    <span className="text-[10px] font-black text-black leading-none font-mono">
                      {unreadAIMessages > 9 ? '!' : unreadAIMessages}
                    </span>
                  </span>
                </div>
              )}
            </button>

            <UserLevelSystem history={history} todayMinutes={todayStats.studyMinutes} />
          
            <button 
              onClick={() => setShowHistory(true)}
              className="w-full bg-blue-900/30 border border-blue-500/30 hover:border-blue-400 text-blue-400 font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all"
            >
              <History className="w-5 h-5" />
              查看历史记录
            </button>

            <LearningProgressPanel 
              learningProgress={learningProgress} 
              onProgressUpdate={handleProgressUpdate}
              isMobileView={false}
            />

            <div className={`rounded-xl p-3 md:p-4 border-l-4 ${stage.borderColor} ${stage.bg} relative overflow-hidden z-0 flex-shrink-0`}>
              <div className="flex items-center gap-2 mb-1 relative z-10"><Target className={`w-4 h-4 ${stage.color}`} /><span className={`text-xs font-bold ${stage.color} tracking-widest uppercase`}>STAGE: {stage.name}</span></div>
              <div className="pl-6 relative z-10">
                <div className="flex justify-between text-xs mb-1 text-gray-400">
                  <span>DAILY TARGET</span>
                  <span className="font-mono flex items-center gap-1">
                    {customTargetHours && <span className="text-[10px] bg-gray-700 px-1 rounded text-white" title="自定义目标">自定义</span>}
                    {currentTargetHours}h
                  </span>
                </div>
                <div className="h-1.5 w-full bg-black/30 rounded-full overflow-hidden"><div className={`h-full ${stage.color.replace('text', 'bg')} transition-all duration-1000 shadow-[0_0_10px_currentColor]`} style={{ width: `${dailyProgressPercent}%` }}></div></div>
                <div className="text-[10px] text-gray-500 mt-1 text-right font-mono">{(todayStats.studyMinutes/60).toFixed(1)}h / {currentTargetHours}h</div>
              </div>
            </div>
            
            <div className="flex items-center justify-between px-1 mt-2 mb-1 relative z-0 flex-shrink-0">
                <span className="text-xs font-bold text-gray-500">TODAY'S LOGS</span>
                <button 
                  onClick={openManualLog}
                  className="text-[10px] flex items-center gap-1 bg-emerald-900/30 text-emerald-400 border border-emerald-800/50 px-2 py-0.5 rounded hover:bg-emerald-800/50 transition-colors"
                >
                  <PlusCircle className="w-3 h-3" /> 补录
                </button>
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 space-y-2 pr-1 scrollbar-thin scrollbar-thumb-gray-800 scrollbar-track-transparent relative z-0">
              {todayStats.logs && todayStats.logs.slice().reverse().map((log, i) => (
                <div key={i} className="bg-[#1a1a20] p-3 rounded border-l-2 border-emerald-500/50 text-xs text-gray-300 relative group hover:bg-[#222228] transition-colors">
                  <div className="flex justify-between text-gray-500 mb-1"><span className="font-mono text-emerald-600">{log.time}</span><span className="text-emerald-500/80">+{log.duration}m XP</span></div>
                  <div className="truncate">{typeof log.content === 'string' ? log.content : 'Log Entry'}</div>
                </div>
              ))}
            </div>
        </div>
      </div>

      <MobileNav 
        mode={mode}
        switchMode={switchMode}
        startAICoach={startAICoach}
        showSettings={showSettings}
        setShowSettings={setShowSettings}
        todayStats={todayStats}
        activeView={activeView}
        setActiveView={setActiveView}
        openManualLog={openManualLog}
        unreadAIMessages={unreadAIMessages}
        showHistory={showHistory}
        setShowHistory={setShowHistory}
      />

      <div className={`flex-1 flex flex-col items-center justify-center p-4 relative bg-gradient-to-br ${getBgColor()} transition-colors duration-1000 overflow-hidden pb-20 md:pb-4 min-h-[500px] md:min-h-0 overflow-y-auto md:overflow-y-hidden`}>
        
        <div className={`md:hidden w-full mb-4 ${activeView !== 'timer' ? 'hidden' : ''}`}>
          <div className="flex gap-2 bg-gray-900/80 backdrop-blur-md p-2 rounded-2xl border border-gray-700/50 shadow-2xl z-10">
            <button 
              onClick={() => switchMode('focus')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all ${mode === 'focus' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'text-gray-500 hover:text-gray-300'}`}
            >
              <BookOpen className="w-4 h-4" /> <span>学习</span>
            </button>
            <button 
              onClick={() => switchMode('break')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all ${mode === 'break' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'text-gray-500 hover:text-gray-300'}`}
            >
              <Coffee className="w-4 h-4" /> <span>休息</span>
            </button>
            <button 
              onClick={() => switchMode('gaming')}
              className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold transition-all ${mode === 'gaming' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.3)]' : 'text-gray-500 hover:text-gray-300'}`}
            >
              <Gamepad2 className="w-4 h-4" /> <span>游戏</span>
            </button>
          </div>
        </div>

        <div className={`md:hidden w-full space-y-4 pt-4 overflow-y-auto ${activeView !== 'stats' ? 'hidden' : ''}`}>
          <UserLevelSystem history={history} todayMinutes={todayStats.studyMinutes} />
          <div className="bg-[#111116] rounded-xl p-4 border border-gray-800">
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-bold text-white">今日学习数据</h2>
            </div>
            
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">学习时长</span>
                <span className="text-white font-mono">{(todayStats.studyMinutes/60).toFixed(1)}h</span>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-gray-400">游戏余额</span>
                <span className="text-purple-400 font-mono">{todayStats.gameBank}m</span>
              </div>
              
              <div className="pt-2 border-t border-gray-800">
                <div className="flex justify-between text-xs mb-1 text-gray-400">
                  <span>目标进度</span>
                  <span className="font-mono">{currentTargetHours}h</span>
                </div>
                <div className="h-2 w-full bg-black/30 rounded-full overflow-hidden">
                  <div className={`h-full bg-emerald-500 transition-all duration-1000`} style={{ width: `${dailyProgressPercent}%` }}></div>
                </div>
              </div>
            </div>
          </div>

          <LearningProgressPanel 
            learningProgress={learningProgress} 
            onProgressUpdate={handleProgressUpdate}
            isMobileView={true}
          />
          
          <div className="bg-[#111116] rounded-xl p-4 border border-gray-800">
            <div className="flex items-center gap-2 mb-3">
              <History className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg font-bold text-white">学习记录</h2>
            </div>
            
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {todayStats.logs && todayStats.logs.slice().reverse().map((log, i) => (
                <div key={i} className="bg-[#1a1a20] p-3 rounded border-l-2 border-emerald-500/50 text-xs text-gray-300">
                  <div className="flex justify-between text-gray-500 mb-1">
                    <span className="font-mono text-emerald-600">{log.time}</span>
                    <span className="text-emerald-500/80">+{log.duration}m</span>
                  </div>
                  <div>{typeof log.content === 'string' ? log.content : 'Log Entry'}</div>
                </div>
              ))}
              {(!todayStats.logs || todayStats.logs.length === 0) && (
                <div className="text-center text-gray-500 py-4">暂无学习记录</div>
              )}
            </div>
          </div>
        </div>

        <div className={`${activeView === 'timer' ? 'flex' : 'hidden md:flex'} flex-col items-center w-full`}>
          <div className={`absolute top-4 right-4 z-30 transition-opacity duration-300 flex items-center gap-4 ${isZen && isActive ? 'opacity-0 hover:opacity-100' : 'opacity-100'}`}>
            {isZen && <button onClick={() => setIsZen(false)} className="bg-gray-800/50 hover:bg-gray-700 text-gray-400 hover:text-white px-3 py-2 rounded text-xs transition">
                  退出禅模式
                </button>
            }

            <button 
              onClick={togglePiP}
              className="bg-gray-800/50 hover:bg-gray-700 text-white p-2 rounded-lg backdrop-blur-sm transition-all shadow-lg mr-2"
              title="开启悬浮窗 (防后台杀活)"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="10" width="20" height="12" rx="2" />
                <rect x="10" y="3" width="12" height="12" rx="2" fill="rgba(255,255,255,0.5)" />
              </svg>
            </button>
            
            <button 
              onClick={toggleFullScreen}
              className="bg-gray-800/50 hover:bg-gray-700 text-white p-2 rounded-lg backdrop-blur-sm transition-all shadow-lg hidden md:block"
              title="全屏显示"
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
          </div>

          <div className={`hidden md:flex gap-4 mb-8 md:mb-12 bg-gray-900/80 backdrop-blur-md p-2 rounded-2xl border border-gray-700/50 shadow-2xl z-10 transition-all duration-500 ${isZen ? '-translate-y-40 opacity-0 scale-75 absolute pointer-events-none' : 'translate-y-0 opacity-100 scale-100 pointer-events-auto'}`}>
            <button 
              onClick={() => switchMode('focus')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${mode === 'focus' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.3)]' : 'text-gray-500 hover:text-gray-300'}`}
            >
              <BookOpen className="w-4 h-4" /> <span>专注学习</span>
            </button>
            <button 
              onClick={() => switchMode('break')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${mode === 'break' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : 'text-gray-500 hover:text-gray-300'}`}
            >
              <Coffee className="w-4 h-4" /> <span>休息</span>
            </button>
            <button 
              onClick={() => switchMode('gaming')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all ${mode === 'gaming' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50 shadow-[0_0_15px_rgba(168,85,247,0.3)]' : 'text-gray-500 hover:text-gray-300'}`}
            >
              <Gamepad2 className="w-4 h-4" /> <span>奖励时刻</span>
            </button>
          </div>

        <div className={`relative mb-8 md:mb-12 group transition-all duration-700 ease-in-out ${isZen ? 'scale-125 md:scale-[2.5]' : 'scale-90 md:scale-100 landscape:scale-75 landscape:mb-4'}`}>
            {!isZen && (
              <>
                {/* 外层装饰圈 1 */}
                <div className="absolute inset-0 rounded-full border-4 border-gray-800/50 scale-110"></div>
                {/* 外层装饰圈 2 (发光模糊) */}
                <div className={`absolute inset-0 rounded-full border-4 opacity-20 blur-md transition-all duration-500 ${(getThemeColor() || '').split(' ')[0].replace('text', 'border')}`}></div>
              </>
            )}
            
            {/* --- 核心计时器圆环 (修复点：确保 rounded-full 生效) --- */}
            <div className={`
               rounded-full flex items-center justify-center relative transition-all duration-500 overflow-hidden
               ${isZen ? 'w-56 h-56 border-0' : `w-64 h-64 md:w-80 md:h-80 border-8 bg-gray-900 shadow-[0_0_60px_-15px_rgba(0,0,0,0.6)] ${getThemeColor()}`}
            `}>
               
               <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 100 100">
                 {!isZen && <circle cx="50" cy="50" r="44" fill="none" stroke="#1f2937" strokeWidth="4" />}
                 <circle 
                   cx="50" cy="50" r="44" fill="none" 
                   stroke="currentColor" 
                   strokeWidth={isZen ? "2" : "4"} 
                   strokeLinecap="round"
                   strokeDasharray="276"
                   strokeDashoffset={276 - (276 * progress) / 100}
                   className={`transition-all duration-1000 ease-linear ${isZen ? 'text-white/20' : ''}`}
                 />
               </svg>

               <div className="flex flex-col items-center z-10 select-none">
                 <div className={`font-mono font-bold tracking-tighter tabular-nums text-white drop-shadow-2xl transition-all duration-500 ${isZen ? 'text-6xl' : 'text-5xl md:text-7xl'}`}>
                   {formatTime(timeLeft)}
                 </div>
                 
                 <div className={`text-sm mt-4 font-bold tracking-widest uppercase transition-all duration-500 ${mode === 'focus' ? 'text-emerald-400' : mode === 'break' ? 'text-blue-400' : 'text-purple-400'} ${isZen ? 'opacity-50' : 'opacity-100'}`}>
                   {mode === 'focus' ? 'DEEP WORK' : mode === 'break' ? 'RECHARGE' : 'GAME ON'}
                 </div>
                 
                 {!isZen && mode === 'focus' && isActive && (
                    <div className="text-[10px] text-gray-500 mt-2 bg-gray-800 px-2 py-1 rounded-full animate-pulse border border-gray-700">
                      预计收益: +{Math.floor(initialTime / 60 / 9)}m 券
                    </div>
                 )}
               </div>
            </div>
          </div>
{/* --- 新增：禅模式激励金句 --- */}
          {isZen && zenQuote && (
            <div className="my-8 max-w-2xl px-6 text-center z-20 animate-in fade-in slide-in-from-bottom-4 duration-1000">
              <p className="text-xl md:text-3xl font-serif italic text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 via-white to-cyan-200 drop-shadow-lg opacity-90 leading-relaxed">
                “{zenQuote}”
              </p>
            </div>
          )}
          <div className={`flex gap-4 md:gap-6 z-10 transition-all duration-300 ${isZen && isActive ? 'opacity-30 hover:opacity-100' : 'opacity-100'} landscape:mb-8`}>
            {!isActive ? (
              <button 
                onClick={toggleTimer}
                className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 hover:bg-gray-100 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)] active:scale-95 touch-manipulation"
              >
                <Play className="w-6 h-6 md:w-8 md:h-8 ml-0.5" />
              </button>
            ) : (
              <div className="flex gap-4 md:gap-6">
                 <button 
                   onClick={toggleTimer}
                   className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gray-800 border-2 border-gray-600 text-white flex items-center justify-center hover:bg-gray-700 hover:border-gray-500 transition-all active:scale-95 shadow-xl touch-manipulation"
                 >
                   <Pause className="w-6 h-6 md:w-8 md:h-8" />
                 </button>
                 <button 
                   onClick={triggerStopTimer}
                   className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-red-950/30 border-2 border-red-900/50 text-red-500 flex items-center justify-center hover:bg-red-900/40 hover:border-red-500 transition-all active:scale-95 shadow-xl touch-manipulation"
                 >
                   <Square className="w-5 h-5 md:w-6 md:h-6" />
                 </button>
              </div>
            )}
            
           {/* 重置按钮已删除 */}
          </div>
        </div>
      </div>

      {showStopModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-gray-900 border border-red-500/30 rounded-2xl p-6 max-w-sm w-full shadow-[0_0_50px_rgba(239,68,68,0.2)]">
            <div className="flex items-center gap-4 mb-4 text-red-500">
               <AlertTriangle className="w-8 h-8" />
               <h3 className="text-xl font-bold text-white">确定要放弃吗？</h3>
            </div>
            
            <p className="text-gray-400 text-sm mb-6 leading-relaxed">
              如果现在停止，你本次的努力将<span className="text-red-400 font-bold">不会获得任何奖励</span>。坚持就是胜利！
            </p>
            
            <div className="flex gap-3">
              <button 
                onClick={cancelStopTimer}
                className="flex-1 bg-gray-800 hover:bg-gray-700 text-white font-bold py-3 rounded-xl transition-colors"
              >
                继续坚持
              </button>
              <button 
                onClick={confirmStopTimer}
                className="flex-1 bg-red-900/50 hover:bg-red-900 text-red-200 border border-red-800 font-bold py-3 rounded-xl transition-colors"
              >
                放弃进度
              </button>
            </div>
          </div>
        </div>
      )}

      {showChatModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-0 md:p-4 animate-in fade-in zoom-in duration-200">
          <div className="bg-[#111116] w-full h-full md:max-w-2xl lg:max-w-4xl xl:max-w-5xl md:h-[85vh] md:rounded-3xl shadow-2xl flex flex-col relative overflow-hidden border-0 md:border border-gray-800">
            <div className="p-4 bg-[#16161c] border-b border-gray-800 flex justify-between items-center z-10 shadow-lg safe-area-top">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center shadow-lg"><Sparkles className="w-5 h-5 text-white" /></div>
                <div>
                  <h3 className="font-bold text-white text-sm">AI 导师</h3>
                  <p className="text-[10px] text-gray-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span> 
                    Online
                    {deepThinkingMode && <span className="ml-2 bg-purple-500/20 text-purple-400 px-1.5 py-0.5 rounded text-[8px]">深度思考模式</span>}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => saveDeepThinkingMode(!deepThinkingMode)}
                  className={`w-8 h-8 rounded-full flex items-center justify-center transition ${
                    deepThinkingMode 
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/50' 
                      : 'bg-gray-800 text-gray-400 hover:text-blue-400 hover:bg-gray-700'
                  }`}
                  title={deepThinkingMode ? "切换到快速模式" : "切换到深度思考模式"}
                >
                  <BrainCircuit className="w-4 h-4"/>
                </button>
                <button 
                  onClick={startNewChat}
                  className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:text-blue-400 hover:bg-gray-700 transition"
                  title="新对话"
                >
                  <RefreshCw className="w-4 h-4"/>
                </button>
                <button 
                  onClick={clearChatHistory}
                  className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:text-red-400 hover:bg-gray-700 transition"
                  title="清除记录"
                >
                  <Trash2 className="w-4 h-4"/>
                </button>
                <button onClick={() => setShowChatModal(false)} className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-gray-400 hover:text-white hover:bg-gray-700 transition"><X className="w-4 h-4"/></button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#0a0a0a]">
              {chatMessages.filter(m => m.role !== 'system').map((msg, idx) => (
                <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex-shrink-0 flex items-center justify-center mr-2 self-start mt-1">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                  )}
                  
                  <div 
                    className={`max-w-[75%] lg:max-w-[80%] p-3.5 text-sm leading-relaxed shadow-md relative overflow-x-auto rounded-2xl ${
                      msg.role === 'user' 
                        ? 'rounded-tr-none text-white' 
                        : 'rounded-tl-none text-gray-900'
                    }`}
                    style={{ 
                      backgroundColor: msg.role === 'user' ? userBubbleColor : aiBubbleColor,
                      color: getContrastColor(msg.role === 'user' ? userBubbleColor : aiBubbleColor)
                    }}
                  >
                    {msg.role === 'user' && msg.images && msg.images.length > 0 && (
                      <div className="mb-2">
                        <div className="opacity-80 text-xs mb-1">上传的图片:</div>
                        <div className="flex gap-2 flex-wrap">
                          {msg.images.map((img, imgIdx) => (
                            <div key={imgIdx} className="relative">
                              <img src={img.preview} alt="已发送的图片" className="w-16 h-16 object-cover rounded border border-white/20" />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {msg.role === 'assistant' ? (
                      <MarkdownMessage content={msg.content} />
                    ) : (
                      <div style={{ whiteSpace: 'pre-wrap' }}>{msg.content}</div>
                    )}
                  </div>

                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-gray-700 flex-shrink-0 flex items-center justify-center ml-2 self-start mt-1">
                      <User className="w-4 h-4 text-gray-300" />
                    </div>
                  )}
                </div>
              ))}
              
              {selectedImages.length > 0 && (
                <div className="flex justify-end">
                  <div className="max-w-[75%] p-3 rounded-2xl rounded-tr-none" style={{ backgroundColor: userBubbleColor }}>
                    <div className="text-white text-xs mb-2">准备发送的图片:</div>
                    <div className="flex gap-2 flex-wrap">
                      {selectedImages.map(img => (
                        <div key={img.id} className="relative">
                          <img src={img.preview} alt="预览" className="w-16 h-16 object-cover rounded border border-white/20" />
                          <button 
                            onClick={() => removeImage(img.id)}
                            className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {aiThinking && (
                <div className="flex justify-start animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex-shrink-0 flex items-center justify-center mr-2">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div className="bg-white p-4 rounded-2xl rounded-tl-none flex gap-1.5 items-center">
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-75"></div>
                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce delay-150"></div>
                    <span className="text-gray-500 text-xs ml-2">{deepThinkingMode ? "深度思考中..." : "思考中..."}</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-3 bg-[#16161c] border-t border-gray-800 flex flex-col gap-2 safe-area-bottom">
              {showEmojiPicker && (
                <div className="bg-[#1f1f27] p-3 rounded-xl grid grid-cols-6 gap-2 mb-2 absolute bottom-20 left-4 shadow-xl border border-gray-700 z-50 animate-in zoom-in duration-200 origin-bottom-left">
                  {COMMON_EMOJIS.map(e => <button key={e} onClick={() => handleEmojiClick(e)} className="text-2xl hover:bg-white/10 p-2 rounded transition">{e}</button>)}
                </div>
              )}
              
              {selectedImages.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {selectedImages.map(img => (
                    <div key={img.id} className="relative flex-shrink-0">
                      <img src={img.preview} alt="预览" className="w-12 h-12 object-cover rounded border border-gray-600" />
                      <button 
                        onClick={() => removeImage(img.id)}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="flex items-center gap-2 bg-[#0a0a0a] p-1.5 rounded-full border border-gray-800 focus-within:border-purple-500/50 transition-colors">
                <button 
                  onClick={() => imageInputRef.current?.click()} 
                  className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:text-blue-400 hover:bg-white/5 transition"
                  title="上传图片"
                >
                  <Image className="w-5 h-5"/>
                </button>
                <input 
                  type="file" 
                  ref={imageInputRef}
                  onChange={handleImageSelect}
                  accept="image/*"
                  multiple
                  className="hidden"
                />
                
                <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className="w-9 h-9 rounded-full flex items-center justify-center text-gray-400 hover:text-yellow-400 hover:bg-white/5 transition"><Smile className="w-5 h-5"/></button>
                <input 
                  type="text" 
                  value={chatInput} 
                  onChange={(e) => setChatInput(e.target.value)} 
                  onKeyDown={(e) => e.key === 'Enter' && handleUserSend()} 
                  placeholder={selectedProvider === 'deepseek' || selectedProvider === 'doubao' ? "输入消息或上传图片..." : "输入消息..."}
                  className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-gray-600"
                />
                <button 
                  onClick={handleUserSend} 
                  disabled={(!chatInput.trim() && selectedImages.length === 0) || aiThinking} 
                  className="w-9 h-9 rounded-full bg-purple-600 text-white flex items-center justify-center hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </div>
              
              {(selectedProvider === 'deepseek' || selectedProvider === 'doubao' || selectedProvider === 'google') && (
                <div className="text-[10px] text-gray-500 text-center">
                  支持图片识别分析 {selectedProvider === 'deepseek' ? '(DeepSeek-Vision)' : selectedProvider === 'google' ? '(Gemini Vision)' : '(豆包多模态)'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showLogModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-gray-900 border border-emerald-500/30 rounded-2xl p-6 max-w-md w-full shadow-[0_0_50px_rgba(16,185,129,0.15)] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-cyan-500"></div>
            <div className="flex items-center gap-4 mb-6">
               <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                 {isManualLog ? <PlusCircle className="w-6 h-6" /> : <CheckCircle2 className="w-6 h-6" />}
               </div>
               <div>
                 <h3 className="text-xl font-bold text-white">{isManualLog ? '补录学习记录' : 'Focus Session Complete!'}</h3>
                 <p className="text-xs text-gray-400">经验值已到账，请记录你的成就</p>
               </div>
            </div>
            
            <div className="space-y-4">
               {isManualLog && (
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">时长 (分钟)</label>
                    <input 
                      type="number" 
                      value={manualDuration} 
                      onChange={(e) => setManualDuration(Number(e.target.value))}
                      className="w-full bg-black/50 border border-gray-700 rounded-xl p-3 text-white font-mono"
                    />
                  </div>
               )}

               <div><label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">本次成果 (Log Content)</label><textarea value={logContent} onChange={(e) => setLogContent(e.target.value)} placeholder="做了什么？(例如：完成了660题第二章前10题，理解了泰勒公式展开...)" className="w-full bg-black/50 border border-gray-700 rounded-xl p-4 text-gray-200 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 min-h-[120px] resize-none text-sm placeholder:text-gray-700" autoFocus /></div>
               <button onClick={saveLog} disabled={!logContent.trim()} className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2"><Save className="w-4 h-4" /> 存入档案并休息 (+{isManualLog ? Math.floor(manualDuration/9) : Math.floor(pendingStudyTime/60/4.5)}m 券)</button>
            </div>
            
            <button onClick={() => setShowLogModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X className="w-5 h-5"/></button>
          </div>
        </div>
      )}

      {showSettings && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-0 md:p-4 animate-in fade-in zoom-in duration-200">
            <div className="bg-[#111116] w-full h-full md:max-w-xl md:h-[85vh] md:rounded-3xl shadow-2xl flex flex-col relative overflow-hidden border-0 md:border border-gray-800 p-4 md:p-8">
               <h2 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6 flex items-center gap-2 mt-4 md:mt-0"><Settings className="w-6 h-6 text-cyan-400"/> 系统设置与配置</h2>
               <div className="flex-1 overflow-y-auto space-y-6 pb-20 md:pb-0">
                  
                  {/* Chat Bubbles Color */}
                  <div className="bg-gray-800/30 p-4 rounded-xl border border-gray-700/50">
                    <h3 className="text-gray-300 font-bold mb-3 flex items-center gap-2 text-sm"><Palette className="w-4 h-4 text-purple-400"/> 对话气泡颜色</h3>
                    <div className="flex gap-4">
                       <div className="flex-1">
                          <label className="text-xs text-gray-500 block mb-2">用户 (我)</label>
                          <div className="flex items-center gap-2">
                             <input type="color" value={userBubbleColor} onChange={(e) => saveBubbleColors(e.target.value, aiBubbleColor)} className="w-8 h-8 rounded cursor-pointer border-none p-0 bg-transparent"/>
                             <span className="text-xs font-mono text-gray-400">{userBubbleColor}</span>
                          </div>
                       </div>
                       <div className="flex-1">
                          <label className="text-xs text-gray-500 block mb-2">AI 导师</label>
                          <div className="flex items-center gap-2">
                             <input type="color" value={aiBubbleColor} onChange={(e) => saveBubbleColors(userBubbleColor, e.target.value)} className="w-8 h-8 rounded cursor-pointer border-none p-0 bg-transparent"/>
                             <span className="text-xs font-mono text-gray-400">{aiBubbleColor}</span>
                          </div>
                       </div>
                    </div>
                  </div>

                  <div className="bg-purple-900/20 p-4 rounded-xl border border-purple-500/30">
                    <h3 className="text-purple-400 font-bold mb-3 flex items-center gap-2 text-sm"><Sparkles className="w-4 h-4"/> AI 导师人设定制</h3>
                    <textarea 
                      value={customPersona}
                      onChange={(e) => saveAISettings(apiKey, apiBaseUrl, apiModel, selectedProvider, e.target.value)}
                      placeholder={DEFAULT_PERSONA}
                      className="w-full bg-black/50 border border-purple-500/30 rounded-lg p-3 text-white outline-none focus:border-purple-500 text-sm min-h-[80px] resize-none"
                    />
                  </div>
                 {/* 新增：个人背景设置 */}
                  <div className="bg-indigo-900/20 p-4 rounded-xl border border-indigo-500/30">
                    <h3 className="text-indigo-400 font-bold mb-3 flex items-center gap-2 text-sm"><User className="w-4 h-4"/> 个人背景档案</h3>
                    <textarea 
                      value={customUserBackground}
                      onChange={(e) => {
                        setCustomUserBackground(e.target.value);
                        localStorage.setItem('user_background', e.target.value);
                      }}
                      placeholder="告诉导师你的背景（例如：双非跨考985、英语基础薄弱、在职备考...）"
                      className="w-full bg-black/50 border border-indigo-500/30 rounded-lg p-3 text-white outline-none focus:border-indigo-500 text-sm min-h-[80px] resize-none"
                    />
                  </div>

                  {/* 新增：阶段手动调整 */}
                  <div className="bg-orange-900/20 p-4 rounded-xl border border-orange-500/30">
                    <div className="flex justify-between items-center mb-3">
                      <h3 className="text-orange-400 font-bold flex items-center gap-2 text-sm"><Target className="w-4 h-4"/> 当前备考阶段</h3>
                      <button onClick={() => {
                        localStorage.removeItem('manual_stage');
                        setStage(getStageInfo());
                        addNotification("已恢复为自动时间判断", "success");
                      }} className="text-xs text-gray-400 underline hover:text-white transition">恢复自动 (根据时间)</button>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { name: "基础夯实期", desc: "地毯式复习 / 英语单词", targetHours: 7, color: "text-emerald-400", borderColor: "border-emerald-500", bg: "bg-emerald-500/10" },
                        { name: "强化提升期", desc: "海量刷题 / 攻克难点", targetHours: 9, color: "text-yellow-400", borderColor: "border-yellow-500", bg: "bg-yellow-500/10" },
                        { name: "真题实战期", desc: "真题模拟 / 查缺补漏", targetHours: 10, color: "text-orange-400", borderColor: "border-orange-500", bg: "bg-orange-500/10" },
                        { name: "全真模拟期", desc: "心态调整 / 考场适应", targetHours: 6, color: "text-cyan-400", borderColor: "border-cyan-500", bg: "bg-cyan-500/10" },
                        { name: "终极冲刺期", desc: "背水一战 / 回归基础", targetHours: 11, color: "text-pink-500", borderColor: "border-pink-500", bg: "bg-pink-500/10" }
                      ].map((s) => (
                        <button 
                          key={s.name}
                          onClick={() => {
                            setStage(s);
                            localStorage.setItem('manual_stage', JSON.stringify(s));
                          }}
                          className={`p-2 rounded-lg border text-left transition-all ${stage.name === s.name ? `${s.bg} ${s.borderColor} ring-1 ring-offset-1 ring-offset-[#111] ring-white` : 'bg-black/30 border-gray-700 hover:bg-gray-800'}`}
                        >
                          <div className={`text-xs font-bold ${s.color}`}>{s.name}</div>
                          <div className="text-[10px] text-gray-500 truncate">{s.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="bg-blue-900/20 p-4 rounded-xl border border-blue-500/30">
                    <h3 className="text-blue-400 font-bold mb-3 flex items-center gap-2 text-sm"><BrainCircuit className="w-4 h-4"/> 回复模式</h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-white text-sm">深度思考模式</div>
                        <div className="text-gray-400 text-xs">开启后回复更详细准确，但速度较慢</div>
                      </div>
                      <button 
                        onClick={() => saveDeepThinkingMode(!deepThinkingMode)}
                        className={`w-12 h-6 rounded-full transition-colors ${
                          deepThinkingMode ? 'bg-blue-500' : 'bg-gray-600'
                        }`}
                      >
                        <div className={`w-5 h-5 bg-white rounded-full transform transition-transform ${
                          deepThinkingMode ? 'translate-x-7' : 'translate-x-1'
                        }`} />
                      </button>
                    </div>
                  </div>

                  <div className="bg-emerald-900/20 p-4 rounded-xl border border-emerald-500/30">
                     <div className="flex justify-between items-center mb-2">
                       <h3 className="text-emerald-400 font-bold flex items-center gap-2 text-sm"><Clock className="w-4 h-4"/> 每日目标时长 (小时)</h3>
                       {customTargetHours && <button onClick={() => saveTargetHours(null)} className="text-xs text-gray-400 underline hover:text-white transition">恢复默认</button>}
                     </div>
                     <input 
                       type="range" 
                       min="1" max="16" step="0.5"
                       value={customTargetHours || stage.targetHours}
                       onChange={(e) => saveTargetHours(parseFloat(e.target.value))}
                       className="w-full accent-emerald-500 cursor-pointer h-2 bg-gray-700 rounded-lg appearance-none"
                     />
                     <div className="flex justify-between text-gray-500 text-xs mt-2 font-mono">
                       <span>1h</span>
                       <span className="text-emerald-400 font-bold">{customTargetHours || stage.targetHours}h</span>
                       <span>16h</span>
                     </div>
                  </div>

                  <div className="bg-gray-800/50 p-4 rounded-xl border border-gray-700">
                    <h3 className="text-gray-400 font-bold mb-3 flex items-center gap-2 text-sm"><BrainCircuit className="w-4 h-4 text-cyan-500"/> AI 模型配置</h3>
                    <div className="space-y-3 text-sm">
                      <div className="mb-2">
                        <label className="text-gray-500 block mb-1">服务商</label>
                        <div className="flex items-center bg-black/50 border border-gray-600 rounded-lg px-3 relative">
                          <select value={selectedProvider} onChange={(e) => {
                            const p = API_PROVIDERS.find(x => x.id === e.target.value);
                            if (p) saveAISettings(apiKey, p.url, p.defaultModel, p.id, customPersona);
                            else setSelectedProvider('custom');
                          }} className="w-full bg-transparent py-3 text-white outline-none border-none appearance-none z-10 font-mono">
                            {API_PROVIDERS.map(p => (
                              <option key={p.id} value={p.id} className="bg-gray-900">
                                {p.name} {p.supportsVision ? '📷' : ''}
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3" />
                        </div>
                      </div>

                      {/* URL Input: Only shown if custom is selected */}
                      {selectedProvider === 'custom' && (
                        <div className="mb-2 animate-in fade-in slide-in-from-top-1">
                          <label className="text-cyan-400 block mb-1">自定义 URL (Base URL)</label>
                          <input type="text" placeholder="https://api.example.com/v1" value={apiBaseUrl} onChange={(e) => saveAISettings(apiKey, e.target.value, apiModel, selectedProvider, customPersona)} className="w-full bg-black/50 border border-cyan-500/50 rounded-lg p-3 text-white outline-none focus:border-cyan-500 font-mono"/>
                        </div>
                      )}
                      
                      <div className="mb-2">
                        <label className="text-gray-500 block mb-1">API Key</label>
                        <input type="password" placeholder="sk-..." value={apiKey} onChange={(e) => saveAISettings(e.target.value, apiBaseUrl, apiModel, selectedProvider, customPersona)} className="w-full bg-black/50 border border-gray-600 rounded-lg p-3 text-white outline-none focus:border-cyan-500 font-mono"/>
                      </div>
                      <div className="mb-2 relative">
                        <div className="flex justify-between items-center mb-1">
                          <label className="text-gray-500">模型名称</label>
                          <button onClick={fetchAvailableModels} disabled={isFetchingModels} className="text-[10px] bg-cyan-900/30 text-cyan-300 border border-cyan-800/50 px-2 py-1 rounded flex items-center gap-1 hover:bg-cyan-800/50 transition-colors">{isFetchingModels ? <RefreshCw className="w-3 h-3 animate-spin"/> : <List className="w-3 h-3"/>} 获取列表</button>
                        </div>
                        <div className="flex items-center bg-black/50 border border-gray-600 rounded-lg px-3 relative z-50">
                          <Cpu className="w-4 h-4 text-gray-500 mr-2 flex-shrink-0" />
                          <input type="text" value={apiModel} onChange={(e) => { setApiModel(e.target.value); setIsModelListOpen(true); setModelSearch(e.target.value); }} onFocus={() => setIsModelListOpen(true)} className="w-full bg-transparent py-3 text-white outline-none font-mono" placeholder="输入或选择模型"/>
                          <button onClick={() => setIsModelListOpen(!isModelListOpen)}><ChevronDown className="w-4 h-4 text-gray-500" /></button>
                        </div>
                        
                        {isModelListOpen && availableModels.length > 0 && (
                          <div className="absolute top-full left-0 w-full bg-[#1a1a20] border border-gray-700 rounded-b-lg shadow-xl max-h-40 overflow-y-auto z-[100] mt-1 font-mono">
                            <div className="sticky top-0 bg-[#1a1a20] p-2 border-b border-gray-700 flex items-center gap-2">
                              <Search className="w-3 h-3 text-gray-500" />
                              <input type="text" value={modelSearch} onChange={(e) => setModelSearch(e.target.value)} placeholder="搜索..." className="w-full bg-transparent text-white outline-none text-xs"/>
                            </div>
                            {availableModels.filter(m => m.toLowerCase().includes(modelSearch.toLowerCase())).map(m => (
                              <div key={m} onClick={() => { setApiModel(m); saveAISettings(apiKey, apiBaseUrl, m, selectedProvider, customPersona); setIsModelListOpen(false); }} className="px-3 py-2 hover:bg-cyan-900/30 cursor-pointer truncate text-gray-300 hover:text-cyan-400 transition-colors text-xs">{m}</div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-red-900/20 p-4 rounded-xl border border-red-700/30">
                     <h3 className="text-red-400 font-bold mb-3 flex items-center gap-2 text-sm"><AlertTriangle className="w-4 h-4"/> 数据备份与恢复 (DATA BACKUP)</h3>
                     <div className="flex gap-2">
                       <button onClick={handleExportData} className="flex-1 bg-gray-800 hover:bg-gray-700 p-3 rounded-lg flex justify-center gap-2 transition-colors text-gray-400 hover:text-white text-sm"><Download className="w-4 h-4"/> 导出备份</button>
                       <button onClick={() => fileInputRef.current?.click()} className="flex-1 bg-gray-800 hover:bg-gray-700 p-3 rounded-lg flex justify-center gap-2 transition-colors text-gray-400 hover:text-white text-sm"><Upload className="w-4 h-4"/> 导入覆盖</button>
                       <input type="file" ref={fileInputRef} onChange={handleImportData} className="hidden" accept=".json" />
                     </div>
                     <p className="text-[10px] text-gray-500 mt-2">导出包含：历史记录、学习进度、个性化设置（不含API Key）</p>
                  </div>
               </div>
              
              <div className="mt-4 pt-4 border-t border-gray-800 safe-area-bottom">
                 <button onClick={() => setShowSettings(false)} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-colors">关闭设置</button>
              </div>
            </div>
          </div>
      )}
    </div>
  );
}
