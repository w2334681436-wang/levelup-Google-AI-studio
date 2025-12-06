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

// --- 还原：基础通知工具 (无点击交互，最稳定) ---
const sendNotification = (title, body) => {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  
  try {
    // 尝试使用 ServiceWorker 发送 (PWA标准)，如果失败则回退到普通通知
    if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
      navigator.serviceWorker.ready.then(reg => {
        reg.showNotification(title, {
          body: body,
          icon: '/icon_final.svg',
          tag: 'levelup-timer',
          renotify: true
        }).catch(() => new Notification(title, { body, icon: '/icon_final.svg' }));
      });
    } else {
      new Notification(title, { body, icon: '/icon_final.svg' });
    }
  } catch (e) {
    console.error(e);
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


// ==================== 1. 考研荣耀核心配置 (配置区) ====================

const RANK_CONFIG = [
  { name: '倔强青铜', id: 'bronze', subTiers: 3, starsPerTier: 3, iconColor: 'text-amber-700' }, // 青铜III-I，每段3星
  { name: '秩序白银', id: 'silver', subTiers: 3, starsPerTier: 3, iconColor: 'text-gray-400' },
  { name: '荣耀黄金', id: 'gold', subTiers: 4, starsPerTier: 4, iconColor: 'text-yellow-400' },
  { name: '尊贵铂金', id: 'platinum', subTiers: 4, starsPerTier: 4, iconColor: 'text-cyan-300' },
  { name: '永恒钻石', id: 'diamond', subTiers: 5, starsPerTier: 5, iconColor: 'text-fuchsia-400' }, // 钻石5星晋级
  { name: '至尊星耀', id: 'starshine', subTiers: 5, starsPerTier: 5, iconColor: 'text-orange-400' },
  { name: '最强王者', id: 'king', subTiers: 1, starsPerTier: 50, iconColor: 'text-yellow-500' }, // 0-49星
  { name: '荣耀王者', id: 'glory_king', subTiers: 1, starsPerTier: 50, iconColor: 'text-red-500' }, // 50-99星
  { name: '传奇王者', id: 'legendary_king', subTiers: 1, starsPerTier: 9999, iconColor: 'text-purple-500' } // 100+星 (新增)
];

// 战力牌子阈值 (根据你的要求修改)
const BADGE_THRESHOLDS = [
  { score: 20000, name: '大国标', color: 'bg-red-600 text-white border border-yellow-300 shadow-[0_0_10px_gold]' }, // 20000
  { score: 15000, name: '小国标', color: 'bg-red-600 text-white' }, // 15000
  { score: 10000, name: '省标', color: 'bg-yellow-500 text-black' }, // 10000
  { score: 7000, name: '市标', color: 'bg-gray-300 text-black' },    // 7000
  { score: 4000, name: '县标', color: 'bg-amber-700 text-white' },    // 4000
  { score: 0, name: '无标', color: 'bg-gray-800 text-gray-500' }
];

// 分路配置 (映射你的科目)
const LANE_CONFIG = {
  math: { role: '打野', icon: '⚔️', name: '数学 (野王)', factor: 1.2 }, // 核心C位
  cs: { role: '射手', icon: '🏹', name: '408 (射手)', factor: 1.1 },   // 后期大核
  english: { role: '中路', icon: '🪄', name: '英语 (法师)', factor: 1.0 },
  politics: { role: '辅助', icon: '🛡️', name: '政治 (辅助)', factor: 0.9 }
};

// ==================== 2. 核心计算逻辑 (逻辑区) ====================

// 计算具体段位
const calculateRankDetails = (totalStars) => {
  let remainingStars = totalStars;
  
  for (let i = 0; i < RANK_CONFIG.length; i++) {
    const rank = RANK_CONFIG[i];
    
    // 王者段位特殊处理 (无小段位，直接堆星)
    if (['king', 'glory_king', 'legendary_king'].includes(rank.id)) {
       const threshold = rank.starsPerTier;
       // 如果是最后一个段位(传奇王者)或者星星不够升级了，就停在这里
       if (rank.id === 'legendary_king' || remainingStars < threshold) {
          // 对于荣耀王者和传奇王者，显示的星数是总星数
          // 王者(0-49), 荣耀(50-99), 传奇(100+)
          let displayStars = totalStars; 
          // 修正逻辑：如果只想显示当前段位的星数，可以调整，但通常王者是看总星
          return { ...rank, subTierDisplay: '', currentStars: remainingStars, totalDisplayStars: totalStars, isKing: true };
       }
       remainingStars -= threshold;
       continue;
    }

    // 普通段位 (有小段位，如青铜 I, II, III)
    const starsInThisRank = rank.subTiers * rank.starsPerTier;
    if (remainingStars < starsInThisRank) {
      // 计算小段位: 剩余星星 / 每段星星数。
      // 例如青铜(每段3星)，剩4颗星 -> 4/3 = 1余1 -> 是第2个小段位(II)的第1颗星
      // 注意：王者荣耀通常是倒序：III -> II -> I。index 0 是最低段。
      const subTierIndex = Math.floor(remainingStars / rank.starsPerTier); 
      const currentStars = remainingStars % rank.starsPerTier;
      
      const romanNumerals = ["V", "IV", "III", "II", "I"]; // 最多5段
      // 截取当前段位实际的小段数
      const actualRomans = romanNumerals.slice(5 - rank.subTiers);
      
      return { 
        ...rank, 
        subTierDisplay: actualRomans[subTierIndex] || 'I', 
        currentStars, // 当前小段位的星星
        isKing: false,
        // 晋级赛判断：当前是该大段位的最后一个小段位 (subTierIndex 是最后一个)，且星星满了
        isPromo: subTierIndex === rank.subTiers - 1 && currentStars === rank.starsPerTier - 1
      };
    }
    remainingStars -= starsInThisRank;
  }
  return RANK_CONFIG[0]; // 默认青铜
};

// 计算今日净胜星数 (严格执行你的4小时分界线规则)
const calculateDailyNetStars = (minutes) => {
  const hours = minutes / 60;
  if (hours < 1) return -4; // 0-1h 扣4星
  if (hours < 2) return -3; // 1-2h 扣3星
  if (hours < 3) return -2; // 2-3h 扣2星
  if (hours < 4) return -1; // 3-4h 扣1星
  if (hours < 5) return 0;  // 4-5h 保级 (不加不扣)
  if (hours < 6) return 1;  // 5-6h 加1星
  return 1 + Math.floor(hours - 5); // 之后每多1小时加1星
};

// ==================== 3. 新 UI 组件 (界面区) ====================

const MobaRankCard = ({ totalStars, todayMinutes, peakScore, season, heroPowers }) => {
  const rank = calculateRankDetails(totalStars);
  const netStars = calculateDailyNetStars(todayMinutes);
  const nextHourNet = calculateDailyNetStars(todayMinutes + 60);
  
  // 晋级赛逻辑：是大段位晋级 + 今日还没学够8小时
  const isPromoMatch = rank.isPromo; 
  const promoRequirementMet = todayMinutes >= 8 * 60;

  // 获取最高战力科目
  let maxPower = 0;
  let maxBadge = '无标';
  Object.values(heroPowers || {}).forEach(score => {
     if (score > maxPower) maxPower = score;
  });
  const getBadgeName = (s) => (BADGE_THRESHOLDS.find(b => s >= b.score) || BADGE_THRESHOLDS[5]).name;
  maxBadge = getBadgeName(maxPower);

  return (
    <div className="bg-gradient-to-br from-[#0f1119] via-[#1a1c2e] to-black p-4 rounded-xl border border-blue-900/50 shadow-2xl relative overflow-hidden group mb-4">
      {/* 赛季标识 */}
      <div className="flex justify-between items-start mb-2 relative z-10">
         <div className="bg-black/60 border border-gray-700 px-2 py-0.5 rounded text-[10px] text-gray-400 font-bold uppercase tracking-wider">
           {season} 赛季
         </div>
         {peakScore > 0 && (
           <div className="flex items-center gap-1 bg-gradient-to-r from-amber-900/50 to-black px-2 py-0.5 rounded border border-amber-600">
             <span className="text-amber-500 text-[10px] font-bold">巅峰赛</span>
             <span className="text-white font-mono text-xs font-bold">{peakScore}</span>
           </div>
         )}
      </div>

      <div className="flex items-center gap-4 relative z-10">
        {/* 左侧：大段位图标 */}
        <div className="relative flex-shrink-0">
           <div className={`w-20 h-20 flex items-center justify-center rounded-full bg-gradient-to-b from-gray-800 to-black border-[3px] ${rank.id.includes('king') ? 'border-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.4)]' : 'border-gray-600'} shadow-lg`}>
              <span className={`text-3xl ${rank.iconColor} drop-shadow-md`}>
                 {rank.id.includes('king') ? '👑' : '🛡️'}
              </span>
           </div>
           {/* 段位名 */}
           <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap bg-gray-900/90 px-2 py-0.5 rounded text-[10px] font-bold border border-gray-700 text-white shadow-lg">
             {rank.name} {rank.subTierDisplay}
           </div>
        </div>

        {/* 右侧：数据与状态 */}
        <div className="flex-1 min-w-0">
           <div className="flex items-baseline gap-1 mb-1">
              <span className={`text-2xl font-black italic ${rank.iconColor}`}>
                x{rank.isKing ? rank.totalDisplayStars : rank.currentStars}
              </span>
              <span className="text-gray-500 text-[10px]">当前星数</span>
              {/* 显示最高牌子 */}
              <span className="ml-auto text-[10px] px-1.5 py-0.5 bg-gray-800 rounded text-gray-300 border border-gray-700">
                 最高: {maxBadge}
              </span>
           </div>

           {/* 晋级赛特殊UI */}
           {isPromoMatch && (
             <div className={`text-[10px] px-2 py-1 rounded mb-2 border flex items-center gap-1 animate-pulse ${promoRequirementMet ? 'bg-green-900/30 border-green-500 text-green-400' : 'bg-red-900/30 border-red-500 text-red-400'}`}>
               <span>⚡ 晋级赛:</span>
               <span>{promoRequirementMet ? '条件已达成' : `需学满8h (当前 ${(todayMinutes/60).toFixed(1)})`}</span>
             </div>
           )}

           {/* 今日结算预测 */}
           <div className="bg-[#111] rounded p-2 border border-gray-800 flex justify-between items-center">
              <div>
                 <div className="text-[10px] text-gray-500">今日结算预测</div>
                 <div className="text-[10px] text-gray-600">
                   {netStars < 0 ? `再学1h: 少扣1星` : `再学1h: +1星`}
                 </div>
              </div>
              <div className={`text-lg font-bold font-mono ${netStars >= 0 ? 'text-green-400' : 'text-red-500'}`}>
                 {netStars > 0 ? '+' : ''}{netStars}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

const HeroPowerList = ({ powers }) => {
  const getBadge = (score) => {
    return BADGE_THRESHOLDS.find(b => score >= b.score) || BADGE_THRESHOLDS[BADGE_THRESHOLDS.length - 1];
  };

  return (
    <div className="grid grid-cols-2 gap-2 mb-4">
      {Object.entries(LANE_CONFIG).map(([key, config]) => {
         const score = powers[key] || 0;
         const badge = getBadge(score);
         
         return (
           <div key={key} className="bg-[#151725] p-2 rounded-lg border border-gray-800/60 flex items-center gap-2 hover:bg-[#1a1c2e] transition-colors group relative">
              <div className="text-xl group-hover:scale-110 transition-transform">{config.icon}</div>
              <div className="flex-1 min-w-0">
                 <div className="flex justify-between items-center mb-0.5">
                    <span className="text-[10px] font-bold text-gray-500">{config.role}</span>
                    <span className={`text-[8px] px-1 rounded transform scale-90 origin-right ${badge.color}`}>
                       {badge.name}
                    </span>
                 </div>
                 <div className="text-xs font-bold text-gray-200 truncate">{config.name}</div>
                 <div className="text-[10px] font-mono text-cyan-500">战力: {score}</div>
              </div>
           </div>
         );
      })}
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

  // --- 新增：时间格式化工具 ---
  const formatDurationCN = (minutes) => {
    if (!minutes) return "0分钟";
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h > 0 && m > 0) return `${h}小时 ${m}分钟`;
    if (h > 0) return `${h}小时`;
    return `${m}分钟`;
  };

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
              {paginatedDates.map((date) => {
                const dayMinutes = history.find((d) => d.date === date)?.studyMinutes || 0;
                return (
                  <button
                    key={date}
                    onClick={() => setSelectedDate(date)}
                    className={`flex-shrink-0 md:w-full text-left p-3 border-r md:border-r-0 md:border-b border-gray-800 hover:bg-gray-800/50 transition whitespace-nowrap md:whitespace-normal ${
                      selectedDate === date ? 'bg-cyan-900/30 border-cyan-500/50' : ''
                    }`}
                  >
                    <div className="font-medium text-white text-sm md:text-base">{date}</div>
                    {/* 修改点：列表里的时间更显眼 */}
                    <div className={`text-xs mt-1 font-mono font-bold ${dayMinutes > 0 ? 'text-emerald-400' : 'text-gray-500'}`}>
                      {formatDurationCN(dayMinutes)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 详情面板 */}
          <div className="flex-1 p-4 md:p-6 overflow-y-auto">
            {selectedDateData ? (
              <div>
                <h3 className="text-lg md:text-xl font-bold text-white mb-4 flex items-center gap-3 flex-wrap">
                  {selectedDate}
                  {/* 修改点：详情页的时间变成显眼的徽章 */}
                  <span className="text-sm md:text-base font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 px-3 py-1.5 rounded-lg shadow-[0_0_10px_rgba(16,185,129,0.2)]">
                    ⏱️ {formatDurationCN(selectedDateData.studyMinutes)}
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

// --- 音效文件 (Base64) ---
// 替换为真实的音效链接
const ALARM_SOUND = "https://actions.google.com/sounds/v1/alarms/beep_short.ogg";
// --- 顶级 UI：金色粒子特效组件 ---
const GoldParticles = () => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let particles = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    resize();

    class Particle {
      constructor() {
        this.reset(true);
      }
      
      reset(initial = false) {
        this.x = Math.random() * canvas.width;
        this.y = initial ? Math.random() * canvas.height : canvas.height + 10;
        this.speed = 0.5 + Math.random() * 1.5;
        this.size = 0.5 + Math.random() * 2;
        this.opacity = 0.1 + Math.random() * 0.5;
        this.fadeSpeed = 0.002 + Math.random() * 0.005;
        this.wobble = Math.random() * Math.PI * 2;
      }

      update() {
        this.y -= this.speed;
        this.wobble += 0.05;
        this.x += Math.sin(this.wobble) * 0.3; // 轻微左右摇摆
        this.opacity -= this.fadeSpeed;

        if (this.y < -10 || this.opacity <= 0) {
          this.reset();
        }
      }

      draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(251, 191, 36, ${this.opacity})`; // Amber-400 gold
        ctx.shadowBlur = 10;
        ctx.shadowColor = "rgba(245, 158, 11, 0.5)"; // Glow effect
        ctx.fill();
      }
    }

    // 初始化粒子数量
    const particleCount = Math.min(100, (window.innerWidth * window.innerHeight) / 10000);
    for (let i = 0; i < particleCount; i++) {
      particles.push(new Particle());
    }

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // 绘制微弱的金色光晕背景
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, 'rgba(0,0,0,0)');
      gradient.addColorStop(1, 'rgba(251, 191, 36, 0.05)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      particles.forEach(p => {
        p.update();
        p.draw();
      });
      animationFrameId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />;};

// --- 修改：将原来的 TIMER_PRESETS 改名为 DEFAULT_PRESETS ---
const DEFAULT_PRESETS = {
  focus: [25, 45, 60, 90],
  break: [5, 10, 15, 20],
  gaming: [15, 30, 45, 60],
  overtime: []
};

// ==================== 0. 新增工具：防休眠高精度定时器 (Web Worker) ====================
// 解决浏览器后台运行时 setInterval 变慢/卡顿的核心方案
function createWorkerTimer(callback, interval) {
  // 创建一个内联 Worker
  const blob = new Blob([`
    let timerId;
    self.onmessage = function(e) {
      if (e.data === 'start') {
        // 在 Worker 线程中计时，不受页面后台休眠影响
        timerId = setInterval(() => {
          self.postMessage('tick');
        }, ${interval});
      } else if (e.data === 'stop') {
        clearInterval(timerId);
      }
    };
  `], { type: 'application/javascript' });

  const worker = new Worker(URL.createObjectURL(blob));
  
  worker.onmessage = () => {
    callback();
  };

  return {
    start: () => worker.postMessage('start'),
    stop: () => worker.postMessage('stop'),
    terminate: () => worker.terminate()
  };
}

// ==================== 1. 考研荣耀核心配置 (配置区) ====================

// --- 5. 主组件 ---
export default function LevelUpApp() {
  // 1. 先定义所有的 State (必须放在最前面！)
  const [loading, setLoading] = useState(true);
        
  
  // 核心状态
  const [mode, setMode] = useState('focus'); 
  const [timeLeft, setTimeLeft] = useState(45 *60);
  const [isActive, setIsActive] = useState(false);
  const [initialTime, setInitialTime] = useState(45 * 60);
  const [stage, setStage] = useState(getStageInfo());
  const [isZen, setIsZen] = useState(false);
  const [customTargetHours, setCustomTargetHours] = useState(null); 
  const [activeView, setActiveView] = useState('timer'); 
  const [showTimeUpModal, setShowTimeUpModal] = useState(false); // 询问弹窗状态
  const [overtimeSeconds, setOvertimeSeconds] = useState(0);     // 加时秒数
  const audioRef = useRef(null);                                 // 音频引用
  
  // 数据状态
  const [todayStats, setTodayStats] = useState({ date: getTodayDateString(), studyMinutes: 0, gameBank: 0, gameUsed: 0, logs: [] });
  const [history, setHistory] = useState([]);
  const [learningProgress, setLearningProgress] = useState(initialProgress); 
  // --- 考研荣耀：段位与战力系统状态 ---
  const [rankState, setRankState] = useState(() => {
    try {
      const saved = localStorage.getItem('moba_rank_state');
      // 默认初始：青铜III (3*3) - 3(当前3) = 总星星0 ? 
      // 不，我们给点初始资金，比如 3 颗星 (青铜III满星)
      return saved ? JSON.parse(saved) : { 
        totalStars: 3, 
        season: `${new Date().getMonth() + 1}月赛季`, // 自动生成当前月份赛季
        highestRank: '倔强青铜 III',
        peakScore: 1200 // 巅峰赛初始分
      };
    } catch (e) {
      return { totalStars: 3, season: 'S1', highestRank: '青铜', peakScore: 1200 };
    }
  });

  const [heroPowers, setHeroPowers] = useState(() => {
    try {
      const saved = localStorage.getItem('moba_hero_powers');
      return saved ? JSON.parse(saved) : { math: 0, english: 0, politics: 0, cs: 0 };
    } catch (e) {
      return { math: 0, english: 0, politics: 0, cs: 0 };
    }
  });
  
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
// --- 新增：自定义铃声状态 ---
  // 默认铃声使用 Google 的短提示音，你也可以换成其他在线链接
  const DEFAULT_ALARM = "https://actions.google.com/sounds/v1/alarms/beep_short.ogg";
  const [customAlarmSound, setCustomAlarmSound] = useState(localStorage.getItem('custom_alarm_sound'));
  const audioInputRef = useRef(null);

  // ... 其他 State ...
  
  // --- 新增：预设管理 State ---
  // 初始化时尝试从 localStorage 读取，如果没有则使用默认值
  const [timerPresets, setTimerPresets] = useState(() => {
    try {
      const saved = localStorage.getItem('timer_custom_presets');
      return saved ? JSON.parse(saved) : DEFAULT_PRESETS;
    } catch (e) {
      return DEFAULT_PRESETS;
    }
  });

  // --- 新增：添加当前时间为预设 ---
  const addCurrentToPresets = () => {
    const currentMin = Math.floor(initialTime / 60);
    // 防止重复添加
    if (timerPresets[mode].includes(currentMin)) {
      addNotification("该时长已在预设列表中", "info");
      return;
    }
    
    const newPresets = {
      ...timerPresets,
      [mode]: [...timerPresets[mode], currentMin].sort((a, b) => a - b) // 添加并排序
    };
    
    setTimerPresets(newPresets);
    localStorage.setItem('timer_custom_presets', JSON.stringify(newPresets));
    addNotification(`已添加 ${currentMin}分钟 到快捷预设`, "success");
  };

  // --- 新增：删除预设 ---
  const removePreset = (valToRemove, e) => {
    e.stopPropagation(); // 防止触发点击时间切换
    
    // 允许删除，但如果想保留默认预设不可删除，可以加个判断。这里我允许全部删除，除了最后一个
    if (timerPresets[mode].length <= 1) {
      addNotification("请至少保留一个预设", "error");
      return;
    }

    const newPresets = {
      ...timerPresets,
      [mode]: timerPresets[mode].filter(t => t !== valToRemove)
    };
    
    setTimerPresets(newPresets);
    localStorage.setItem('timer_custom_presets', JSON.stringify(newPresets));
    addNotification(`已删除 ${valToRemove}分钟 预设`, "info");
  };

  // 处理铃声上传
  const handleAlarmUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 限制大小 (比如 2MB)
    if (file.size > 2 * 1024 * 1024) {
      addNotification("音频文件过大，请上传 2MB 以内的文件", "error");
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64Sound = ev.target.result;
      setCustomAlarmSound(base64Sound);
      localStorage.setItem('custom_alarm_sound', base64Sound);
      addNotification("🔔 自定义铃声设置成功！", "success");
      
      // 试听一下
      const testAudio = new Audio(base64Sound);
      testAudio.volume = 0.5;
      testAudio.play();
    };
    reader.readAsDataURL(file);
  };

  // 恢复默认铃声
  const resetAlarmSound = () => {
    setCustomAlarmSound(null);
    localStorage.removeItem('custom_alarm_sound');
    addNotification("已恢复默认铃声", "info");
  };
  
  
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

// --- 修改：智能自动更新进度 (Async) ---
  const autoUpdateProgress = async (logContent, currentProgress) => {
    const lowerLog = logContent.toLowerCase();
    const date = getTodayDateString();
    
    // 遍历所有科目配置
    for (const [key, config] of Object.entries(SUBJECT_CONFIG)) {
      const isMatch = config.keyword.some((kw) => lowerLog.includes(kw.toLowerCase()));
      
      if (isMatch) {
        const oldContent = currentProgress[key].content || "";
        
        // 1. 先发个通知告诉用户正在处理
        addNotification(`🧠 AI 正在整合 ${config.name} 的学习进度...`, "info");
        
        // 2. 调用 AI 进行融合 (异步)
        const mergedContent = await mergeProgressWithAI(config.name, oldContent, logContent);
        
        // 3. 更新状态
        setLearningProgress(prev => {
          const updated = {
            ...prev,
            [key]: {
              content: mergedContent,
              lastUpdate: date
            }
          };
          saveLearningProgress(updated);
          return updated;
        });
        
        // 4. 完成通知
        addNotification(`✅ ${config.name} 进度已智能更新！`, "success");
      }
    }
  };

  // --- 新增：清空历史记录 ---
  const handleClearHistory = () => {
    setConfirmState({
      isOpen: true,
      title: "⚠️ 危险操作：清空历史",
      message: "确定要删除所有历史学习记录吗？\n\n1. 你的【等级】将可能大幅下降（仅保留今日经验）\n2. 你的【累计时长】将清零\n3. 你的【学习进度】描述会保留（不会被删除）\n\n此操作不可撤销！",
      onConfirm: () => {
        setHistory([]); // 清空状态
        localStorage.removeItem('levelup_history'); // 清空本地存储
        
        // 重新计算并保存（仅保留今日数据）
        // 注意：我们不清除 todayStats，因为那是“今天”的努力
        
        addNotification("历史记录已清空，等级已重新计算", "success");
        closeConfirm();
      },
      isDangerous: true,
      confirmText: "确认清空"
    });
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
          
          // --- 修复开始：区分加时模式和普通模式 ---
          let recoveredTimeLeft;
          if (storedTimerState.mode === 'overtime') {
             // 加时模式是“正计时”，所以要加上流逝的时间
             recoveredTimeLeft = storedTimerState.timeLeft + elapsed;
          } else {
             // 专注/休息模式是“倒计时”，所以要减去流逝的时间
             recoveredTimeLeft = storedTimerState.timeLeft - elapsed;
          }
          // --- 修复结束 ---

          // 判断逻辑调整：如果是加时模式，或者普通模式时间未耗尽
          if (storedTimerState.mode === 'overtime' || recoveredTimeLeft > 1) { 
            setTimeLeft(Math.floor(recoveredTimeLeft));
            setInitialTime(storedTimerState.initialTime);
            setMode(storedTimerState.mode);
            
            // 如果是加时模式，顺便恢复 overtimeSeconds
            if (storedTimerState.mode === 'overtime') {
               setOvertimeSeconds(Math.floor(recoveredTimeLeft));
            }

            setTimeout(() => {
                setIsActive(true);
                addNotification(`已恢复进度: ${formatTime(Math.floor(recoveredTimeLeft))}`, "success");
            }, 100); 
            
          } else {
            addNotification("应用恢复，但计时器已超时，请重新开始或打卡。", "info");
            saveTimerState(false, 45 * 60, 45 * 60, 'focus'); 
          }
        } else {
          // ... (后面的代码保持不变)
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

// --- 2. 增强版：绘制悬浮窗内容 (修复点点点方向 + 绿色氛围) ---
  const updatePiP = (seconds, currentMode) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    const total = initialTime > 0 ? initialTime : 1;
    const progress = Math.max(0, Math.min(1, (total - seconds) / total));

    // --- 1. 配色系统 ---
    let theme = {
        primary: '#34d399', // 亮青绿
        glow: '#059669',
        bgGradientStart: '#064e3b', // 深祖母绿 (专注模式核心氛围)
        bgGradientEnd: '#000000',   
        textShadow: 15
    };

    let statusText = "DEEP WORK PROTOCOL";
    
    // >>>>> 核心修复：使用 Date.now() 确保动画永远正向 (0->1->2->3) <<<<<
    // 之前用 seconds 在倒计时会变成 (3->2->1->0)，现在改为系统时间，永远向前
    const dotCount = Math.floor(Date.now() / 1000) % 4;
    const dots = ".".repeat(dotCount).padEnd(3, ' '); 
    
    let headerText = `⚡ 对局进行中${dots}`;

    // 根据模式切换皮肤
    if (seconds <= 0 && currentMode === 'focus') { 
        theme = { primary: '#ef4444', glow: '#991b1b', bgGradientStart: '#450a0a', bgGradientEnd: '#000000', textShadow: 20 };
        statusText = "VICTORY PENDING"; 
        headerText = "⚠ 专注目标达成";
    } else if (currentMode === 'overtime') { 
        theme = { primary: '#fbbf24', glow: '#d97706', bgGradientStart: '#451a03', bgGradientEnd: '#000000', textShadow: 20 };
        statusText = `PEAK SCORE: ${rankState.peakScore}`; 
        headerText = `🏆 巅峰加时${dots}`;
    } else if (currentMode === 'break') { 
        theme = { primary: '#60a5fa', glow: '#2563eb', bgGradientStart: '#172554', bgGradientEnd: '#000000', textShadow: 15 };
        statusText = `RECOVERING${dots}`;
        headerText = `💤 泉水回血${dots}`;
    } else if (currentMode === 'gaming') { 
        theme = { primary: '#c084fc', glow: '#7e22ce', bgGradientStart: '#3b0764', bgGradientEnd: '#000000', textShadow: 15 };
        statusText = "ENTERTAINMENT";
        headerText = `🎮 娱乐放松中${dots}`;
    }

    // --- 2. 绘制背景 ---
    const gradient = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width * 0.8);
    gradient.addColorStop(0, theme.bgGradientStart);
    gradient.addColorStop(1, theme.bgGradientEnd);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // 绘制背景网格
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let x = 0; x <= width; x += 40) { ctx.moveTo(x, 0); ctx.lineTo(x, height); }
    for (let y = 0; y <= height; y += 40) { ctx.moveTo(0, y); ctx.lineTo(width, y); }
    ctx.stroke();

    // --- 3. 绘制 HUD 战术边角 ---
    ctx.strokeStyle = theme.primary;
    ctx.lineWidth = 4;
    ctx.shadowBlur = 10;
    ctx.shadowColor = theme.glow;
    const cornerSize = 20;
    
    ctx.beginPath();
    ctx.moveTo(10, 10 + cornerSize); ctx.lineTo(10, 10); ctx.lineTo(10 + cornerSize, 10);
    ctx.moveTo(width - 10 - cornerSize, 10); ctx.lineTo(width - 10, 10); ctx.lineTo(width - 10, 10 + cornerSize);
    ctx.moveTo(10, height - 10 - cornerSize); ctx.lineTo(10, height - 10); ctx.lineTo(10 + cornerSize, height - 10);
    ctx.moveTo(width - 10 - cornerSize, height - 10); ctx.lineTo(width - 10, height - 10); ctx.lineTo(width - 10, height - 10 - cornerSize);
    ctx.stroke();

    ctx.lineWidth = 1;
    ctx.strokeStyle = theme.primary;
    ctx.globalAlpha = 0.3;
    ctx.strokeRect(10, 10, width - 20, height - 20);
    ctx.globalAlpha = 1.0;

    // --- 4. 绘制文字信息 ---
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = theme.primary;
    
    ctx.shadowBlur = 5;
    ctx.font = `bold 20px "Inter", sans-serif`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'; 
    ctx.fillText(headerText, width / 2, height / 2 - 100); 

    // 核心时间
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold 150px "JetBrains Mono", monospace`; 
    ctx.shadowBlur = theme.textShadow; 
    ctx.shadowColor = theme.glow;
    
    let timeStr = "";
    if (currentMode === 'overtime') timeStr = `+${formatTime(seconds)}`;
    else timeStr = seconds <= 0 ? "00:00" : formatTime(seconds);
    
    ctx.fillText(timeStr, width / 2, height / 2 + 10);

    // 底部文字
    ctx.shadowBlur = 0; 
    ctx.font = `bold 14px "Inter", sans-serif`;
    ctx.fillStyle = theme.primary;
    ctx.letterSpacing = "4px"; 
    ctx.fillText(statusText, width / 2, height / 2 + 120);
    
    // --- 5. 绘制底部能量条 ---
    if (currentMode !== 'overtime') {
        const barHeight = 6;
        const barWidth = width - 80;
        const startX = 40;
        const startY = height - 20;
        
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(startX, startY, barWidth, barHeight);
        
        ctx.fillStyle = theme.primary;
        ctx.shadowBlur = 10;
        const currentW = barWidth * (1 - progress);
        ctx.fillRect(startX, startY, currentW, barHeight);

        ctx.fillStyle = '#000'; 
        for(let i=0; i<barWidth; i+=barWidth/20) { 
            if(i < currentW) {
                ctx.fillRect(startX + i, startY, 2, barHeight);
            }
        }
    }

    // --- 6. 视频流保活 ---
    if (!video.srcObject) {
        const stream = canvas.captureStream();
        video.srcObject = stream;
    }
    if (video.paused) {
        video.play().catch(() => {});
    }
  };

// --- 还原：最简单的悬浮窗开关 (修复第一次点击失败 Bug) ---
  const togglePiP = async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setIsPipActive(false);
      } else if (videoRef.current && canvasRef.current) {
        // 1. 强制刷新一帧画面，这会触发 updatePiP 里的 srcObject 初始化
        updatePiP(timeLeft, mode);
        
        const video = videoRef.current;

        // 2. 关键修复：如果视频刚初始化(readyState=0)，必须等待元数据加载完成
        // 否则直接调用 requestPictureInPicture 会报错 "Metadata not loaded"
        if (video.readyState === 0) {
            await new Promise((resolve) => {
                video.onloadedmetadata = () => resolve(true);
                // 兜底：如果500ms还没好，也强行继续，防止死等
                setTimeout(() => resolve(true), 500);
            });
        }

        // 3. 确保视频流在播放
        if (video.paused) {
           await video.play().catch(() => {});
        }

        // 4. 一切就绪，请求画中画
        await video.requestPictureInPicture();
        setIsPipActive(true);
      }
    } catch (err) {
      console.error("PiP Error:", err);
      // 只有手动点击失败时才提示一下
      addNotification("开启悬浮窗失败，请确保先点击开始计时，或重试一次", "error");
    }
  };

  // --- 新增：移动端屏幕常亮 (Wake Lock) ---
  useEffect(() => {
    let wakeLock = null;

    const requestWakeLock = async () => {
      try {
        if ('wakeLock' in navigator) {
          wakeLock = await navigator.wakeLock.request('screen');
        }
      } catch (err) {
        console.log(`${err.name}, ${err.message}`);
      }
    };

    // 只有在专注或加时模式且计时中，才保持常亮
    if (isActive && (mode === 'focus' || mode === 'overtime')) {
      requestWakeLock();
    } else {
      if (wakeLock) wakeLock.release();
    }

    return () => {
      if (wakeLock) wakeLock.release();
    };
  }, [isActive, mode]);

// --- 4. 新增：低功耗画面同步刷新器 (每秒触发一次) ---
  // 替代了原来的 60FPS 循环，配合 updatePiP 中的静态逻辑，彻底解决后台卡顿
  useEffect(() => {
    // 只有在开启悬浮窗时，才需要手动更新 Canvas
    if (isPipActive) {
      updatePiP(timeLeft, mode);
    }
    
    // 顺便利用这个每秒一次的时机，更新网页标题 (可选)
    if (isActive) {
        document.title = `${formatTime(timeLeft)} - ${mode === 'focus' ? '专注中' : '休息中'}`;
    }
  }, [timeLeft, mode, isPipActive, isActive]); // 关键依赖：timeLeft 变了(过了一秒)，就重画一次

  useEffect(() => {
    if (chatMessages.length > 0) {
      const recent = chatMessages.slice(-50);
      localStorage.setItem('ai_chat_history', JSON.stringify(recent));
    }
  }, [chatMessages]);

  useEffect(() => { loadData(); }, []);

// --- 核心计时器逻辑 (已修改：使用 Web Worker 防卡顿) ---
  useEffect(() => {
    if (isActive) {
      // 1. 记录开始状态
      saveTimerState(true, timeLeft, initialTime, mode);
      
      // >>>>> 修改开始：使用 Worker Timer 替换 setInterval <<<<<
      // 创建 Worker 计时器，间隔 1000ms
      const workerTimer = createWorkerTimer(() => {
        // 这里是回调函数，相当于原来的 setInterval 内部逻辑
        
        // 注意：在 React 的 useEffect 闭包中，我们需要小心处理 state 更新
        // 这里使用函数式更新 setTimeLeft(prev => ...) 是安全的
        
        if (mode === 'overtime') {
           // >>> 加时模式：正计时 <<<
           setTimeLeft((prev) => prev + 1); 
           setOvertimeSeconds((prev) => prev + 1);
        } else {
           // >>> 普通模式：倒计时 <<<
           setTimeLeft((prev) => {
             const newTime = prev - 1;
             
             // A. 如果专注时间到了
             if (newTime <= 0 && mode === 'focus') {
               workerTimer.stop(); // 停止 Worker
               handleFocusTimeUp(); 
               return 0;
             }
             
             // B. 如果休息或游戏时间到了
             if (newTime <= 0 && mode !== 'focus') {
                workerTimer.stop(); // 停止 Worker
                handleTimerComplete();
                return 0;
             }

             return newTime;
           }); 
        }
      }, 1000);

      // 启动 Worker
      workerTimer.start();
      
      // 将 worker 实例存入 ref，方便 cleanup
      timerRef.current = workerTimer;
      // >>>>> 修改结束 <<<<<

    } else {
      // 暂停状态
      if (timerRef.current) {
          timerRef.current.stop(); // 调用 worker 的 stop
          if(timerRef.current.terminate) timerRef.current.terminate(); // 彻底销毁防内存泄漏
      }
      saveTimerState(false, timeLeft, initialTime, mode);
    }
    
    return () => {
      // 组件卸载或依赖变化时清理
      if (timerRef.current) {
          timerRef.current.stop();
          if(timerRef.current.terminate) timerRef.current.terminate();
      }
    };
  }, [isActive, timeLeft, initialTime, mode]); // 依赖项保持不变

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
    const g = Math.floor(m / 10); 
    
    // 1. 基础数据更新
    const newStats = { 
      ...todayStats, 
      studyMinutes: todayStats.studyMinutes + m, 
      gameBank: todayStats.gameBank + g, 
      logs: [...todayStats.logs, { time: new Date().toLocaleTimeString('zh-CN', {hour:'2-digit',minute:'2-digit'}), content: log, duration: m }] 
    };
    
    // 2. 战力更新 (Hero Power)
    const lowerLog = log.toLowerCase();
    let targetSubject = null;
    
    // 关键词匹配分路
    if (lowerLog.includes('数学') || lowerLog.includes('math') || lowerLog.includes('高数')) targetSubject = 'math';
    else if (lowerLog.includes('英语') || lowerLog.includes('english') || lowerLog.includes('单词')) targetSubject = 'english';
    else if (lowerLog.includes('政治') || lowerLog.includes('politics') || lowerLog.includes('肖秀荣')) targetSubject = 'politics';
    else if (lowerLog.includes('408') || lowerLog.includes('cs') || lowerLog.includes('数据结构')) targetSubject = 'cs';
    
    if (targetSubject) {
       // 基础分：1分钟 = 4战力 (可调整)
       const baseScore = m * 4; 
       const laneFactor = LANE_CONFIG[targetSubject].factor;
       
       // 巅峰系数加成：(巅峰分 - 1200) / 100 * 1% (每100分加1%)
       // 例如 1500分 -> 加成 3%
       const peakFactor = 1 + Math.max(0, (rankState.peakScore - 1200) / 10000);
       
       const scoreToAdd = Math.floor(baseScore * laneFactor * peakFactor);
       
       setHeroPowers(prev => {
         const newState = { ...prev, [targetSubject]: prev[targetSubject] + scoreToAdd };
         localStorage.setItem('moba_hero_powers', JSON.stringify(newState));
         return newState;
       });
       
       addNotification(`战力增加: ${LANE_CONFIG[targetSubject].name} +${scoreToAdd}`, "success");
    }

    // 3. 加时模式下：增加巅峰积分
    if (mode === 'overtime') {
       // 加时 1分钟 = +2 巅峰分 (可调整难度)
       const peakAdded = m * 2;
       setRankState(prev => {
         const newState = { ...prev, peakScore: prev.peakScore + peakAdded };
         localStorage.setItem('moba_rank_state', JSON.stringify(newState));
         return newState;
       });
       addNotification(`巅峰积分 +${peakAdded}`, "success");
    }

    setTodayStats(newStats);
    saveData(newStats); // 保存历史
    autoUpdateProgress(log, learningProgress); 
  };

  // --- 每日结算监听器 ---
  useEffect(() => {
    // 只有当历史数据加载完毕后才运行
    if (loading) return;

    const lastSettleDate = localStorage.getItem('last_settle_date');
    const today = getTodayDateString();
    
    // 如果上次结算不是今天，且历史记录里有昨天的数据（或者是新的一天开始）
    if (lastSettleDate !== today) {
       // 获取昨天日期
       const d = new Date();
       d.setDate(d.getDate() - 1);
       const yesterdayStr = d.toISOString().split('T')[0];
       
       // 从历史里找昨天的数据
       const yesterdayData = history.find(d => d.date === yesterdayStr);
       const yesterdayMins = yesterdayData ? yesterdayData.studyMinutes : 0;
       
       // 计算星星变化
       const starsChange = calculateDailyNetStars(yesterdayMins);
       
       // 晋级赛判定
       const currentDetails = calculateRankDetails(rankState.totalStars);
       const isPromo = currentDetails.isPromo;
       
       let finalChange = starsChange;
       let promoMsg = "";

       // 晋级赛特殊规则：如果是晋级点，且昨天没学够8小时(480分钟)
       if (isPromo && starsChange > 0 && yesterdayMins < 480) {
          finalChange = 0; // 强制不能加星
          promoMsg = "\n⛔ 晋级赛失败：昨日未达8小时考核线";
       }

       // 更新状态
       const newTotalStars = Math.max(0, rankState.totalStars + finalChange);
       
       // 赛季轮换检测 (简单的月份轮换)
       const currentMonthSeason = `${new Date().getMonth() + 1}月赛季`;
       let seasonMsg = "";
       let finalSeason = rankState.season;
       
       if (rankState.season !== currentMonthSeason) {
           // 新赛季！
           finalSeason = currentMonthSeason;
           seasonMsg = `\n🎉 新赛季开启！当前为 ${currentMonthSeason}`;
           // 这里可以加重置段位逻辑，比如 totalStars * 0.8
       }

       const newRankState = {
           ...rankState,
           totalStars: newTotalStars,
           season: finalSeason
       };
       
       setRankState(newRankState);
       localStorage.setItem('moba_rank_state', JSON.stringify(newRankState));
       localStorage.setItem('last_settle_date', today);
       
       // 弹窗通知
       if (yesterdayMins > 0 || finalChange !== 0) {
         setConfirmState({
           isOpen: true,
           title: "📅 昨日排位结算报告",
           message: `昨日投入: ${(yesterdayMins/60).toFixed(1)} 小时\n段位变更: ${finalChange >= 0 ? '+' : ''}${finalChange} ⭐${promoMsg}${seasonMsg}\n当前段位: ${calculateRankDetails(newTotalStars).name}`,
           onConfirm: closeConfirm,
           confirmText: "我以此为荣"
         });
       }
    }
  }, [loading, history, rankState]);

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

// --- 修改：计时结束逻辑 (加入健康提醒) ---
  const handleTimerComplete = () => {
    // 1. 准备文案
    const title = mode === 'focus' ? "🎉 专注完成！" : "💪 休息结束！";
    // 修改点：专注结束时加入健康提醒
    const body = mode === 'focus' 
      ? "太棒了！记得站起来活动一下，喝口水补充水分！💧" 
      : "该回到学习状态了！加油！";
    
    sendNotification(title, body);

    setIsActive(false); 
    setIsZen(false);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    clearInterval(timerRef.current);
    
    localStorage.removeItem('levelup_timer_state');
    
    if (mode === 'focus') {
      setPendingStudyTime(initialTime); 
      setIsManualLog(false); 
      setShowLogModal(true); 
      // 这里也可以额外弹个 Toast 强调一下
      addNotification("🌟 专注结束！快去接杯水，活动活动脖子吧！", "success");
    } else {
      if (mode === 'gaming') updateGameStats(initialTime);
      playAlarm(); 
      setShowTimeUpModal(true); 
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

// --- 修改：生成禅模式激励语录 (防解析、防思考标签版) ---
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
            content: `${backgroundPrompt}请生成一句非常简短、震撼人心、能激励考研学生坚持下去的励志语录（名人名言或高级心灵鸡汤）。
            严一格要求：
            1. 中文，30字以内。
            2. **绝对不要**包含“解析”、“出处”、“含义”、“注：”等解释性文字。
            3. **绝对不要**带引号、书名号或Markdown格式。
            4. 直接输出这一句纯文本。` 
          }],
          stream: false // 这里不需要流式传输，直接要结果
        })
      });
      const data = await response.json();
      
      let quote = data.choices?.[0]?.message?.content?.trim();
      
      if (quote) {
        // --- 核心修复逻辑：清洗脏数据 ---
        
        // 1. 去除 DeepSeek R1 等模型的 <think>...</think> 思考过程
        quote = quote.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

        // 2. 暴力截断：如果AI还是输出了 "解析："、"出处：" 等，直接砍掉后面的内容
        // 匹配：解析、分析、出处、含义、---分隔符
        const dirtyKeywords = ["解析", "分析", "出处", "含义", "---", "###", "Note:"];
        dirtyKeywords.forEach(kw => {
            if (quote.includes(kw)) {
                quote = quote.split(kw)[0].trim();
            }
        });

        // 3. 去除首尾可能残留的引号
        quote = quote.replace(/^["'“「](.*)["'”」]$/, '$1');

        setZenQuote(quote);
      }
    } catch (e) {
      console.error("Quote fetch failed", e);
    }
  };

  // --- 新增：手动调节时长函数 ---
  const handleSetDuration = (minutes) => {
    if (minutes < 1) return; // 至少1分钟
    const seconds = minutes * 60;
    setInitialTime(seconds);
    setTimeLeft(seconds);
    // 可选：保存用户的最后一次偏好，如果需要的话
    // localStorage.setItem(`last_${mode}_duration`, minutes); 
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
  

// --- 修改：音效控制函数 (支持动态切换) ---
  const playAlarm = () => {
    const soundSrc = customAlarmSound || DEFAULT_ALARM;
    
    // 如果当前 audioRef 不存在，或者 src 不一样，就重新创建
    if (!audioRef.current || audioRef.current.src !== soundSrc) {
      if (audioRef.current) audioRef.current.pause(); // 停止旧的
      audioRef.current = new Audio(soundSrc);
      audioRef.current.loop = true; // 循环播放
    }
    
    audioRef.current.play().catch(e => console.log("Play error", e));
  };

  const stopAlarm = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  // --- 专注结束处理 ---
  const handleFocusTimeUp = () => {
    setIsActive(false); 
    playAlarm(); 
    setShowTimeUpModal(true); 
    sendNotification("🔔 专注时间达成！", "已完成设定目标。是否要进入加时模式？");
  };

  const startOvertime = () => {
    stopAlarm();
    setShowTimeUpModal(false);
    setMode('overtime');
    setInitialTime(initialTime); 
    setTimeLeft(0); 
    setOvertimeSeconds(0);
    setIsActive(true);
    addNotification("🔥 开启【黄金加时】模式！无上限冲刺！", "success");
  };

  const finishAndRest = () => {
    stopAlarm();
    setShowTimeUpModal(false);
    setPendingStudyTime(initialTime); 
    setIsManualLog(false); 
    setShowLogModal(true);
  };

  // --- 修改后的：确认停止计时 ---
  const confirmStopTimer = () => { 
    setShowStopModal(false); 
    setIsActive(false); 
    setIsZen(false); 
    
    if(document.fullscreenElement) document.exitFullscreen().catch(()=>{}); 

    if (mode === 'gaming') {
      updateGameStats(initialTime - timeLeft);
      setInitialTime(timeLeft); 
      saveTimerState(false, timeLeft, timeLeft, mode);
      addNotification("游戏暂停，剩余时间已保存", "info");
    } else if (mode === 'overtime') {
      // >>> 加时模式结算逻辑 <<<
      const totalTime = initialTime + timeLeft;
      setPendingStudyTime(totalTime);
      addNotification(`💪 太强了！额外加练了 ${Math.floor(timeLeft/60)} 分钟！`, "success");
      setIsManualLog(false);
      setShowLogModal(true);
      saveTimerState(false, 45 * 60, 45 * 60, 'focus'); 
    } else {
      const newTimeLeft = initialTime;
      setTimeLeft(newTimeLeft); 
      saveTimerState(false, newTimeLeft, initialTime, mode);
      addNotification("计时已取消", "info");
    }
  };
  
  const cancelStopTimer = () => setShowStopModal(false);

// --- 新增：调用 AI 融合学习进度 ---
  const mergeProgressWithAI = async (subjectName, oldContent, newLog) => {
    // 如果没有 API Key，降级为追加模式
    if (!apiKey) return oldContent ? `${oldContent}\n---\n[${getTodayDateString()}] ${newLog}` : newLog;

    try {
      const prompt = `
        角色：你是一个严谨的学习进度管理员。
        任务：将【旧进度】和【新增投入】合并，生成一句最新的、简洁的当前进度描述。
        规则：
        1. 只要结果。不要解释，不要前缀。
        2. 如果【新增投入】推进了进度（如从第3章到第4章），则更新为新进度。
        3. 如果【新增投入】是复习或做题，请在原进度后补充说明（如"已学完第3章，正在进行习题巩固"）。
        4. 保持极简，不超过 80 字。

        【旧进度】：${oldContent || "无"}
        【新增投入】：${newLog}
      `;

      const cleanBaseUrl = apiBaseUrl.replace(/\/$/, '');
      const response = await fetch(`${cleanBaseUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
        body: JSON.stringify({
          model: apiModel,
          messages: [{ role: "user", content: prompt }],
          stream: false // 这里不需要流式，直接要结果
        })
      });
      const data = await response.json();
      const mergedText = data.choices?.[0]?.message?.content?.trim();
      return mergedText || oldContent; // 如果失败返回旧的
    } catch (e) {
      console.error("AI Merge Failed", e);
      return oldContent ? `${oldContent}\n---\n[${getTodayDateString()}] ${newLog}` : newLog;
    }
  };


 const handleExportData = () => {
    try {
      const exportData = {
        version: '3.0', // 升级版本号
        exportDate: new Date().toISOString(),
        // 核心数据
        history: history,
        progress: learningProgress,
        // 游戏化数据 (关键新增)
        rankState: rankState,
        heroPowers: heroPowers,
        // 个性化配置
        settings: {
          customTargetHours: customTargetHours,
          customPersona: customPersona,
          customUserBackground: customUserBackground, // 新增
          selectedProvider: selectedProvider,
          apiBaseUrl: apiBaseUrl,
          apiModel: apiModel,
          userBubbleColor: userBubbleColor,
          aiBubbleColor: aiBubbleColor,
          deepThinkingMode: deepThinkingMode,
          timerPresets: timerPresets, // 新增
          customAlarmSound: customAlarmSound // 新增
        }
      };
      const str = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
      const a = document.createElement('a'); 
      a.href = str; 
      a.download = `LevelUp_Backup_${getTodayDateString()}.json`; 
      document.body.appendChild(a); 
      a.click(); 
      document.body.removeChild(a);
      addNotification("完整数据导出成功 (含段位/战力)！", "success");
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
      // 1. 恢复核心数据
      if (data.history) {
          localStorage.setItem('levelup_history', JSON.stringify(data.history));
          setHistory(data.history);
      }
      if (data.progress) {
          localStorage.setItem('levelup_progress', JSON.stringify(data.progress));
          setLearningProgress(data.progress);
      }

      // 2. 恢复游戏化数据 (关键新增)
      if (data.rankState) {
          localStorage.setItem('moba_rank_state', JSON.stringify(data.rankState));
          setRankState(data.rankState);
      }
      if (data.heroPowers) {
          localStorage.setItem('moba_hero_powers', JSON.stringify(data.heroPowers));
          setHeroPowers(data.heroPowers);
      }

      // 3. 恢复设置
      if (data.settings) {
        const s = data.settings;
        if (s.customTargetHours) saveTargetHours(s.customTargetHours);
        if (s.customPersona) { setCustomPersona(s.customPersona); localStorage.setItem('ai_persona', s.customPersona); }
        if (s.customUserBackground) { setCustomUserBackground(s.customUserBackground); localStorage.setItem('user_background', s.customUserBackground); }
        if (s.selectedProvider) { setSelectedProvider(s.selectedProvider); localStorage.setItem('ai_provider', s.selectedProvider); }
        if (s.apiBaseUrl) { setApiBaseUrl(s.apiBaseUrl); localStorage.setItem('ai_base_url', s.apiBaseUrl); }
        if (s.apiModel) { setApiModel(s.apiModel); localStorage.setItem('ai_model', s.apiModel); }
        if (s.userBubbleColor && s.aiBubbleColor) saveBubbleColors(s.userBubbleColor, s.aiBubbleColor);
        if (s.deepThinkingMode !== undefined) saveDeepThinkingMode(s.deepThinkingMode);
        
        if (s.timerPresets) {
            setTimerPresets(s.timerPresets);
            localStorage.setItem('timer_custom_presets', JSON.stringify(s.timerPresets));
        }
        if (s.customAlarmSound) {
            setCustomAlarmSound(s.customAlarmSound);
            localStorage.setItem('custom_alarm_sound', s.customAlarmSound);
        }
      }
      
      // 重新加载数据以确保所有状态同步
      loadData();
      closeConfirm();
      addNotification("数据完美恢复！段位战力已同步。", "success");
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


  // Send AI Message (终极修复版：确保关窗必通知)
  // --------------------------------------------------------------------------
  const sendToAI = async (newMessages, images = []) => {
    setAiThinking(true);
    // Add placeholder assistant message
    const placeholderId = Date.now();
    setChatMessages(prev => [...prev, { role: 'assistant', content: '', id: placeholderId }]);

    // 🔒 状态锁：确保一次对话只增加 1 个未读计数，防止数字乱跳
    let hasNotifiedThisSession = false;

    // 🛠️ 辅助函数：尝试通知
    // 逻辑：如果窗口是关着的 (ref为false)，并且还没通知过，就 +1
    const tryNotify = () => {
        if (!showChatModalRef.current && !hasNotifiedThisSession) {
            setUnreadAIMessages(prev => {
                const newValue = prev + 1;
                // 同步保存到本地，防止刷新丢失
                localStorage.setItem('ai_unread_messages', newValue.toString());
                return newValue;
            });
            hasNotifiedThisSession = true; // 锁定
        }
    };

    try {
      const cleanBaseUrl = apiBaseUrl.replace(/\/$/, '');
      const endpoint = `${cleanBaseUrl}/chat/completions`;
      
      let messages = [...newMessages];
      
      // 处理多模态图片 (DeepSeek/Doubao/Gemini)
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
        stream: true // 强制开启流式
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

      // --- 流式读取循环 ---
      while (!done) {
        const { value, done: readerDone } = await reader.read();
        done = readerDone;
        const chunkValue = decoder.decode(value, { stream: !done });
        
        // 解析 SSE 数据
        const lines = chunkValue.split('\n');
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine || trimmedLine === 'data: [DONE]') continue;
            
            if (trimmedLine.startsWith('data: ')) {
                try {
                    const jsonStr = trimmedLine.replace('data: ', '');
                    const json = JSON.parse(jsonStr);
                    const content = json.choices?.[0]?.delta?.content || "";
                    
                    if (content) {
                        accumulatedText += content;
                        
                        // 1. 实时更新对话框 UI
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

                        // 2. 实时检查：如果此时用户关掉了窗口，立即通知
                        tryNotify();
                    }
                } catch (e) {
                    // 忽略解析错误
                }
            }
        }
      }
      
    } catch (error) {
      console.error("AI Request Failed", error);
      // 如果报错了，也尝试通知用户去查看错误
      tryNotify();
    } finally {
      // ✅ 关键修复：最终兜底检查
      // 就算流结束了，或者代码跑完了，再检查一次窗口状态。
      // 防止用户在 AI 刚说完话的那一瞬间关闭窗口，导致 while 循环正好结束没来得及通知。
      // 使用 setTimeout 让它在下一个事件循环检查，确保 React 的状态已经更新完毕。
      setTimeout(() => {
          tryNotify();
      }, 100);
      
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
    
    // 只有当这是新对话时，才发送上下文
    if (chatMessages.length === 0 || chatMessages.length === 1 && chatMessages[0].role === 'system') {
      
      const target = customTargetHours || stage.targetHours;

      // 1. 格式化【今日】数据
      const todayLogDetails = todayStats.logs && todayStats.logs.length > 0
        ? todayStats.logs.map((l, i) => `   - [${l.time}] 投入${l.duration}分钟: ${l.content}`).join('\n')
        : "   - 暂无具体打卡记录";
      
      const todayEntry = `📅 [${todayStats.date}] (今天):
   - 总投入: ${(todayStats.studyMinutes / 60).toFixed(1)}h / 目标${target}h
   - 游戏券余额: ${todayStats.gameBank}m
   - 详细日志:
${todayLogDetails}`;

      // 2. 格式化【历史】档案 (取最近 30 天，防止 Token 爆炸)
      const historyArchive = history.slice(0, 30).map(entry => {
         const logStr = entry.logs && entry.logs.length > 0
            ? entry.logs.map(l => `   - [${l.time}] ${l.duration}m: ${l.content}`).join('\n')
            : "   - 无详细记录";
         return `📅 [${entry.date}]:\n   - 总投入: ${(entry.studyMinutes / 60).toFixed(1)}h\n${logStr}`;
      }).join('\n\n');

      // 3. 组装完整的上下文
      let dataContext = `
        --- 🎓 考研学习全息档案 🎓 ---
        
        【基本信息】
        1. 目标: 上海交大/中科大AI硕士(2026)。
        2. 每日目标: ${target}小时。
        3. 背景: ${customUserBackground || '未填写'}
        4. 规则: 专注10分钟 = 1分钟游戏券。
        
        【总体学科进度】
        - 英语: ${learningProgress.english.content || '无'}
        - 政治: ${learningProgress.politics.content || '无'}
        - 数学: ${learningProgress.math.content || '无'}
        - 408: ${learningProgress.cs.content || '无'}

        【📅 每日实战记录档案 (Recent 30 Days)】
        (AI注意：用户如果询问任意一天的复盘，请在此档案中检索对应日期的数据)
        
        ${todayEntry}
        
        ${historyArchive}
      `;

      const systemContext = `${currentPersona}\n\n${dataContext}\n\n指令：你是用户的全能考研导师。你拥有用户最近30天的所有详细学习记录（在【每日实战记录档案】中）。\n1. 如果用户求复盘“今天”，请重点分析${todayStats.date}的数据。\n2. 如果用户求复盘“昨天”或“x月x日”，请务必在档案中查找对应日期的日志，不要编造。\n3. 分析时要结合具体做了什么（如做了哪章题、背了多少词），给出针对性建议。\n4. 保持格式清晰，使用Markdown。`;

      const initialMsg = { role: 'system', content: systemContext };
      
      // 默认触发语改得更通用一点，引导用户去问
      const triggerMsg = { role: 'user', content: "导师，请查看我的学习记录和进度。你可以帮我分析一下现在的学习进度和状态吗" };
      
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
    if (mode === 'overtime') return 'text-amber-400 border-amber-500 shadow-amber-900/50 drop-shadow-[0_0_15px_rgba(251,191,36,0.5)]'; // 金色传说
  };
  
  const getBgColor = () => {
     if (mode === 'focus') return 'from-emerald-950/90 to-black';
     if (mode === 'break') return 'from-blue-950/90 to-black';
     if (mode === 'gaming') return 'from-purple-950/90 to-black';
     if (mode === 'overtime') return 'from-amber-950/90 to-black'; // 金色背景
  };

  // --- 新增：获取当前模式的主题色 (用于背景光晕) ---
  const getModeColor = () => {
     if (mode === 'focus') return 'rgba(16, 185, 129'; // Emerald
     if (mode === 'break') return 'rgba(59, 130, 246'; // Blue
     if (mode === 'gaming') return 'rgba(168, 85, 247'; // Purple
     if (mode === 'overtime') return 'rgba(245, 158, 11'; // Amber
     return 'rgba(16, 185, 129';
  };

  if (loading) return <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center font-mono animate-pulse">正在载入系统...</div>;

 return (
    <div ref={appContainerRef} className={`h-[100dvh] w-full bg-[#0a0a0a] text-gray-100 font-sans flex flex-col md:flex-row overflow-hidden relative selection:bg-cyan-500/30`}>
      
      {/* 1. CSS 动画样式保持不变 */}
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
        /* --- 新增：战术网格背景 --- */
.tactical-grid {
  background-size: 40px 40px;
  background-image:
    linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
  mask-image: radial-gradient(circle at center, black 40%, transparent 100%);
  -webkit-mask-image: radial-gradient(circle at center, black 40%, transparent 100%);
}

/* --- 新增：禅模式 HUD 扫描线 --- */
.hud-scanline {
  background: linear-gradient(to bottom, transparent 50%, rgba(0, 0, 0, 0.2) 51%);
  background-size: 100% 4px;
  animation: scanline-move 0.5s linear infinite;
  pointer-events: none;
}

/* --- 新增：呼吸光晕动画 --- */
@keyframes breathe-glow {
  0%, 100% { opacity: 0.4; transform: scale(1); }
  50% { opacity: 0.7; transform: scale(1.1); }
}
.animate-breathe {
  animation: breathe-glow 4s ease-in-out infinite;
}
      `}</style>
      
      <Toast notifications={notifications} removeNotification={removeNotification} />

     
   
      {/* 2. 【关键修改】这里是新的 PiP 画布容器 */}
      {/* 删掉原来那个 "absolute opacity-0..." 的 div，用下面这个替换 */}
      <div 
        className="fixed pointer-events-none overflow-hidden" 
        style={{ width: '1px', height: '1px', right: '0', bottom: '0', opacity: 0.01, zIndex: -1 }}
      >
        <canvas ref={canvasRef} width={640} height={360} />
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

   {/* --- 3. 新视觉：动态战术背景 (Grid + Glow) --- */}
      <div className="absolute inset-0 bg-[#050505] pointer-events-none z-0">
         {/* 1. 中心动态光晕 (跟随模式变色) */}
         <div 
           className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] md:w-[40vw] md:h-[40vw] rounded-full blur-[100px] transition-colors duration-1000 animate-breathe"
           style={{ background: `radial-gradient(circle, ${getModeColor()}, 0.3) 0%, transparent 70%)` }}
         ></div>
         
         {/* 2. 全屏战术网格 */}
         <div className="absolute inset-0 tactical-grid opacity-50"></div>

         {/* 3. 禅模式专属：暗角增强 + 扫描线 */}
         {isZen && (
            <>
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#000_90%)] duration-1000"></div>
              <div className="absolute inset-0 hud-scanline opacity-10"></div>
            </>
         )}
      </div>
            
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

          {/* --- 桌面端：考研荣耀段位卡片 --- */}
<MobaRankCard 
  totalStars={rankState.totalStars} 
  todayMinutes={todayStats.studyMinutes} 
  peakScore={rankState.peakScore} 
  season={rankState.season}
  heroPowers={heroPowers}
/>
{/* --- 桌面端：分路战力榜 --- */}
<HeroPowerList powers={heroPowers} />
          
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

{mode === 'overtime' && (
       <div className="absolute inset-0 z-0 pointer-events-none">
           <GoldParticles />
           {/* 加一层径向光晕，让粒子更明显，同时避免背景死黑 */}
           <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_20%,#000_100%)] opacity-60"></div>
       </div>
    )}
        
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
         {/* --- 移动端：考研荣耀段位卡片 --- */}
<MobaRankCard 
  totalStars={rankState.totalStars} 
  todayMinutes={todayStats.studyMinutes} 
  peakScore={rankState.peakScore} 
  season={rankState.season}
  heroPowers={heroPowers}
/>
{/* --- 移动端：分路战力榜 --- */}
<HeroPowerList powers={heroPowers} />
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
           {isZen ? (
    <button 
      onClick={() => setIsZen(false)} 
      className="bg-gray-800/80 hover:bg-gray-700 text-gray-400 hover:text-white px-3 py-2 rounded-lg text-xs transition backdrop-blur-md border border-gray-700 font-bold flex items-center gap-2"
    >
      <Minimize2 className="w-4 h-4" /> 退出禅模式
    </button>
  ) : (
    <button 
      onClick={() => setIsZen(true)} 
      className={`
        px-3 py-2 rounded-lg text-xs transition backdrop-blur-md border font-bold flex items-center gap-2 shadow-lg
        ${mode === 'overtime' 
          ? 'bg-amber-500/20 hover:bg-amber-500/40 text-amber-400 border-amber-500/50 animate-pulse' 
          : 'bg-gray-800/80 hover:bg-gray-700 text-gray-300 hover:text-white border-gray-700'
        }
      `}
      title="进入沉浸模式"
    >
      <Maximize2 className="w-4 h-4" /> 
      {/* 在加时模式下文字更有激情一点 */}
      {mode === 'overtime' ? '极·专注' : '禅模式'}
    </button>
  )}

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
            
       {/* --- 核心计时器容器 (含 Zen Mode HUD 边框) --- */}
        <div className={`relative mb-8 md:mb-12 group transition-all duration-700 ease-in-out ${isZen ? 'scale-110 md:scale-[1.5]' : 'scale-90 md:scale-100 landscape:scale-75 landscape:mb-4'}`}>
            
            {/* >>> 新增：禅模式 HUD 战术边框 (1:1 还原悬浮窗) <<< */}
            {isZen && (
              <div className="absolute -inset-12 pointer-events-none animate-in fade-in zoom-in duration-700">
                  {/* 左上角 */}
                  <div className={`absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 rounded-tl-lg transition-colors duration-500 ${getThemeColor().split(' ')[0].replace('text', 'border')}`} style={{ filter: 'drop-shadow(0 0 5px currentColor)' }}></div>
                  {/* 右上角 */}
                  <div className={`absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 rounded-tr-lg transition-colors duration-500 ${getThemeColor().split(' ')[0].replace('text', 'border')}`} style={{ filter: 'drop-shadow(0 0 5px currentColor)' }}></div>
                  {/* 左下角 */}
                  <div className={`absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 rounded-bl-lg transition-colors duration-500 ${getThemeColor().split(' ')[0].replace('text', 'border')}`} style={{ filter: 'drop-shadow(0 0 5px currentColor)' }}></div>
                  {/* 右下角 */}
                  <div className={`absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 rounded-br-lg transition-colors duration-500 ${getThemeColor().split(' ')[0].replace('text', 'border')}`} style={{ filter: 'drop-shadow(0 0 5px currentColor)' }}></div>
                  
                  {/* 顶部标签 */}
                  <div className={`absolute -top-8 left-1/2 -translate-x-1/2 text-[10px] font-mono tracking-[0.3em] font-bold opacity-70 ${getThemeColor().split(' ')[0]}`}>
                     // {mode === 'focus' ? 'DEEP WORK' : 'SYSTEM IDLE'} //
                  </div>

                  {/* 底部能量条装饰 */}
                  <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-32 h-1 bg-gray-800 rounded-full overflow-hidden">
                     <div className={`h-full ${getThemeColor().split(' ')[0].replace('text', 'bg')} transition-all duration-1000`} style={{ width: `${progress}%` }}></div>
                  </div>
              </div>
            )}

            {!isZen && (
              <>
                {/* 非禅模式下的原有装饰圈 */}
                <div className="absolute inset-0 rounded-full border-4 border-gray-800/50 scale-110"></div>
                <div className={`absolute inset-0 rounded-full border-4 opacity-20 blur-md transition-all duration-500 ${(getThemeColor() || '').split(' ')[0].replace('text', 'border')}`}></div>
              </>
            )}
            
            {/* ... 这里保留原来的计时器圆环 div 代码 ... */}
            <div className={`
               rounded-full flex items-center justify-center relative transition-all duration-500 overflow-hidden
               ${isZen ? 'w-64 h-64 md:w-80 md:h-80 border-0 bg-transparent' : `w-64 h-64 md:w-80 md:h-80 border-8 bg-gray-900 shadow-[0_0_60px_-15px_rgba(0,0,0,0.6)] ${getThemeColor()}`}
            `}>
               {/* 注意：Zen模式下去掉圆环背景色，改为透明，以突显 HUD */}
               
               {/* 内部 SVG 和 文字保持不变，直接用原来的代码即可 */}
               <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 100 100">
                 {!isZen && <circle cx="50" cy="50" r="44" fill="none" stroke="#1f2937" strokeWidth="4" />}
                 <circle 
                   cx="50" cy="50" r="44" fill="none" 
                   stroke="currentColor" 
                   strokeWidth={isZen ? "1.5" : "4"} 
                   strokeLinecap="round"
                   strokeDasharray="276"
                   strokeDashoffset={276 - (276 * progress) / 100}
                   className={`transition-all duration-1000 ease-linear ${isZen ? 'text-white/40' : ''}`}
                 />
               </svg>

               <div className="flex flex-col items-center z-10 select-none">
                 <div className={`font-mono font-bold tracking-tighter tabular-nums text-white drop-shadow-2xl transition-all duration-500 ${isZen ? 'text-7xl md:text-8xl' : 'text-5xl md:text-7xl'} ${mode === 'overtime' ? 'text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.8)]' : ''}`}>
                   {mode === 'overtime' ? `+${formatTime(timeLeft)}` : formatTime(timeLeft)}
                 </div>
                 
                 {/* 禅模式下隐藏这个小标签，因为已经移到 HUD 顶部了 */}
                 {!isZen && (
                    <div className={`text-sm mt-4 font-bold tracking-widest uppercase transition-all duration-500 ${mode === 'focus' ? 'text-emerald-400' : mode === 'break' ? 'text-blue-400' : mode === 'gaming' ? 'text-purple-400' : 'text-amber-400'}`}>
                    {mode === 'focus' ? 'DEEP WORK' : mode === 'break' ? 'RECHARGE' : mode === 'gaming' ? 'GAME ON' : 'GOLDEN TIME'}
                    </div>
                 )}
               </div>
            </div>
          </div>

          {/* --- 新增：时间调节面板 (支持自定义预设) --- */}
          {!isActive && !isZen && mode !== 'overtime' && (
            <div className="mb-8 flex flex-col items-center gap-4 animate-in slide-in-from-bottom-4 fade-in duration-500 z-20">
              
              {/* 1. 微调控制器 ( - 45 + ) */}
              <div className="flex items-center gap-6 bg-black/40 border border-white/10 rounded-2xl px-6 py-2 backdrop-blur-md shadow-lg">
                 <button 
                   onClick={() => handleSetDuration(Math.floor(initialTime / 60) - 5)}
                   className="text-gray-400 hover:text-white hover:bg-white/10 p-2 rounded-lg transition active:scale-95"
                   title="-5分钟"
                 >
                   <span className="text-xl font-bold">−</span>
                 </button>
                 
                 <div className="flex flex-col items-center w-20">
                   <span className="text-2xl font-mono font-bold text-white tracking-tighter">
                     {Math.floor(initialTime / 60)}
                   </span>
                   <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">MIN</span>
                 </div>

                 <button 
                   onClick={() => handleSetDuration(Math.floor(initialTime / 60) + 5)}
                   className="text-gray-400 hover:text-white hover:bg-white/10 p-2 rounded-lg transition active:scale-95"
                   title="+5分钟"
                 >
                   <span className="text-xl font-bold">+</span>
                 </button>
              </div>

              {/* 2. 智能预设胶囊 (列表 + 添加按钮) */}
              <div className="flex gap-2 flex-wrap justify-center max-w-md">
                {timerPresets[mode].map((m) => {
                  const isCurrent = Math.floor(initialTime / 60) === m;
                  return (
                    <div key={m} className="relative group">
                      <button
                        onClick={() => handleSetDuration(m)}
                        className={`
                          px-3 py-1.5 rounded-lg text-xs font-mono font-bold border transition-all active:scale-95 relative overflow-hidden
                          ${isCurrent
                            ? 'bg-white text-black border-white shadow-[0_0_10px_rgba(255,255,255,0.4)] scale-105 z-10' 
                            : 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10 hover:border-white/30 hover:text-white'}
                        `}
                      >
                        {m}
                      </button>
                      {/* 删除按钮：仅在Hover或选中时显示小红叉 */}
                      <button
                        onClick={(e) => removePreset(m, e)}
                        className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-20 hover:bg-red-600 scale-75"
                        title="删除此预设"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}

                {/* 添加当前时间为新预设的按钮 (仅当当前时间不在列表中时显示) */}
                {!timerPresets[mode].includes(Math.floor(initialTime / 60)) && (
                  <button
                    onClick={addCurrentToPresets}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold border border-dashed border-emerald-500/50 text-emerald-500 hover:bg-emerald-500/10 hover:border-emerald-500 transition-all flex items-center gap-1 active:scale-95"
                    title="将当前时长保存为常用预设"
                  >
                    <PlusCircle className="w-3 h-3" /> 保存
                  </button>
                )}
              </div>
            </div>
          )}
          
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

{/* --- 修改：通用时间到弹窗 (支持专注完成/休息结束) --- */}
      {showTimeUpModal && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in zoom-in duration-300">
          <div className={`bg-gray-900 border-2 ${mode === 'focus' ? 'border-amber-500/50' : 'border-cyan-500/50'} rounded-3xl p-8 max-w-sm w-full shadow-[0_0_100px_rgba(0,0,0,0.5)] relative overflow-hidden`}>
            
            {/* 动态背景光效 */}
            <div className={`absolute inset-0 bg-gradient-to-tr ${mode === 'focus' ? 'from-amber-500/10 via-transparent to-emerald-500/10' : 'from-cyan-500/10 via-transparent to-blue-500/10'} animate-pulse`}></div>
            
            <div className="relative z-10 text-center">
              <div className={`w-20 h-20 mx-auto bg-gradient-to-br ${mode === 'focus' ? 'from-emerald-400 to-cyan-500' : 'from-blue-400 to-purple-500'} rounded-full flex items-center justify-center mb-6 shadow-xl animate-bounce`}>
                {mode === 'focus' ? <CheckCircle2 className="w-10 h-10 text-white" /> : <Zap className="w-10 h-10 text-white" />}
              </div>
              
              <h3 className="text-2xl font-black text-white mb-2 italic">
                {mode === 'focus' ? 'EXCELLENT!' : 'TIME TO WORK!'}
              </h3>
              
              <p className="text-gray-300 mb-8">
                {mode === 'focus' ? '专注目标已达成。此刻状态如何？' : '休息时间结束，请立即回到学习状态！'}
              </p>
              
              <div className="flex flex-col gap-3">
                {mode === 'focus' ? (
                  // --- 专注结束的按钮 ---
                  <>
                    <button 
                      onClick={startOvertime}
                      className="w-full bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold py-4 rounded-xl transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(245,158,11,0.4)] flex items-center justify-center gap-2 group"
                    >
                      <Zap className="w-5 h-5 fill-current group-hover:animate-ping" />
                      <span>状态正佳，进入加时！</span>
                    </button>
                    <button 
                      onClick={finishAndRest}
                      className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold py-4 rounded-xl transition-all border border-gray-700 flex items-center justify-center gap-2"
                    >
                      <Coffee className="w-5 h-5" />
                      <span>存入记录并休息</span>
                    </button>
                  </>
                ) : (
                  // --- 休息结束的按钮 ---
                  <button 
                    onClick={() => {
                      stopAlarm();
                      setShowTimeUpModal(false);
                      switchMode('focus');
                    }}
                    className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-4 rounded-xl transition-all transform hover:scale-105 shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center justify-center gap-2"
                  >
                    <BookOpen className="w-5 h-5" />
                    <span>立即开始专注</span>
                  </button>
                )}
              </div>
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
               <button onClick={saveLog} disabled={!logContent.trim()} className="w-full bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-emerald-900/20 flex items-center justify-center gap-2"><Save className="w-4 h-4" /> 存入档案并休息 (+{isManualLog ? Math.floor(manualDuration/10) : Math.floor(pendingStudyTime/60/4.5)}m 券)</button>
            </div>
            
            <button onClick={() => setShowLogModal(false)} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X className="w-5 h-5"/></button>
          </div>
        </div>
      )}

      {showSettings && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-0 md:p-4 animate-in fade-in zoom-in duration-200">
            <div className="bg-[#111116] w-full h-full md:max-w-xl md:h-[85vh] md:rounded-3xl shadow-2xl flex flex-col relative overflow-hidden border-0 md:border border-gray-800 p-4 md:p-8">
               <h2 className="text-xl md:text-2xl font-bold text-white mb-4 md:mb-6 flex items-center gap-2 mt-4 md:mt-0"><Settings className="w-6 h-6 text-cyan-400"/> 系统设置与配置</h2>
              {/* --- 移动端通知权限手动触发器 --- */}
                {Notification.permission !== 'granted' && (
                  <div className="mb-4 bg-amber-500/20 border border-amber-500/50 p-3 rounded-xl flex items-center justify-between animate-pulse">
                    <div className="flex items-center gap-2 text-amber-400 text-xs font-bold">
                      <AlertTriangle className="w-4 h-4" />
                      <span>移动端需手动开启通知权限</span>
                    </div>
                    <button 
                      onClick={() => {
                        Notification.requestPermission().then(perm => {
                          if(perm === 'granted') {
                            addNotification("通知权限已开启！快切后台试试", "success");
                            sendNotification("测试成功", "你的手机可以收到通知了！");
                          } else {
                            addNotification("权限被拒绝，请在手机系统设置中允许浏览器通知", "error");
                          }
                        });
                      }}
                      className="bg-amber-500 text-black text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg active:scale-95 transition"
                    >
                      开启权限
                    </button>
                  </div>
                )}
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

{/* --- 新增：个性化铃声设置 --- */}
                  <div className="bg-amber-900/20 p-4 rounded-xl border border-amber-500/30">
                    <h3 className="text-amber-400 font-bold mb-3 flex items-center gap-2 text-sm"><Bell className="w-4 h-4"/> 专注结束铃声</h3>
                    <div className="flex items-center justify-between bg-black/30 p-3 rounded-lg border border-amber-500/20">
                      <div className="text-xs text-gray-300 truncate max-w-[150px]">
                        {customAlarmSound ? "🎵 当前：自定义铃声" : "🔔 当前：默认 (Ding)"}
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => audioInputRef.current?.click()}
                          className="text-xs bg-amber-600/20 hover:bg-amber-600/40 text-amber-400 border border-amber-600/50 px-3 py-1.5 rounded transition"
                        >
                          上传
                        </button>
                        {customAlarmSound && (
                          <button 
                            onClick={resetAlarmSound}
                            className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-400 border border-gray-600 px-3 py-1.5 rounded transition"
                          >
                            重置
                          </button>
                        )}
                      </div>
                      <input type="file" ref={audioInputRef} onChange={handleAlarmUpload} accept="audio/*" className="hidden" />
                    </div>
                    <p className="text-[10px] text-gray-500 mt-2">* 建议上传 5秒以内 的 MP3/WAV 音效，文件过大会影响性能。</p>
                  </div>
                 
                  <div className="bg-red-900/20 p-4 rounded-xl border border-red-700/30">
                     <h3 className="text-red-400 font-bold mb-3 flex items-center gap-2 text-sm"><AlertTriangle className="w-4 h-4"/> 数据备份与恢复 (DATA BACKUP)</h3>
                     <div className="flex gap-2">
                       <button onClick={handleExportData} className="flex-1 bg-gray-800 hover:bg-gray-700 p-3 rounded-lg flex justify-center gap-2 transition-colors text-gray-400 hover:text-white text-sm"><Download className="w-4 h-4"/> 导出备份</button>
                       <button onClick={() => fileInputRef.current?.click()} className="flex-1 bg-gray-800 hover:bg-gray-700 p-3 rounded-lg flex justify-center gap-2 transition-colors text-gray-400 hover:text-white text-sm"><Upload className="w-4 h-4"/> 导入覆盖</button>
                       <input type="file" ref={fileInputRef} onChange={handleImportData} className="hidden" accept=".json" />
                     </div>

                    <button 
                       onClick={handleClearHistory} 
                       className="w-full border border-red-800/50 text-red-500 hover:bg-red-900/20 p-2 rounded-lg text-xs flex items-center justify-center gap-2 transition-colors mt-3"
                     >
                       <Trash2 className="w-3 h-3" /> 清空所有历史记录 (Reset History)
                     </button>
                    
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
      </div>
  );
}
