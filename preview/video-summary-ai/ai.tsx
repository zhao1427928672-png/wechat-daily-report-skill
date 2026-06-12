import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Settings, 
  UploadCloud, 
  FileText, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  Play, 
  X, 
  ChevronRight, 
  Hash, 
  History, 
  Eye, 
  Trash2, 
  Printer, 
  LayoutGrid, 
  MessageSquare, 
  BookOpen, 
  User, 
  Clock, 
  Calendar,
  HelpCircle,
  FileCode,
  Compass,
  Search,
  BookOpenCheck,
  Copy,
  Check,
  GitFork,
  Menu,
  ChevronLeft,
  Download,
  Plus,
  Minus,
  RefreshCw,
  Volume2
} from 'lucide-react';

export default function App() {
  // 界面与配置状态
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isConfirmClearOpen, setIsConfirmClearOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // 侧边栏折叠状态
  const [sidebarWidth, setSidebarWidth] = useState(360); // 侧边栏宽度拖拽
  const [activeTab, setActiveTab] = useState('standard'); // 'standard' | 'word-preview' | 'transcript' | 'mindmap'
  const [isCopied, setIsCopied] = useState(false);
  
  // 字号控制（11px - 20px）
  const [fontSize, setFontSize] = useState(13);

  // ASR 过滤配置状态
  const [isAsrCleanupEnabled, setIsAsrCleanupEnabled] = useState(true);
  const [fillerWords, setFillerWords] = useState('然后,就是,这个,那个,嗯,啊,就是说,那什么,其实,我觉得');

  // 接口设置状态
  const [apiUrl, setApiUrl] = useState('https://api.openai.com/v1/chat/completions');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('gpt-4o-mini');
  
  // 系统总结提示词
  const defaultPrompt = `你是一个专业的音视频内容总结助理。请阅读以下视频文本内容，提取核心观点并严格按照以下 JSON 格式输出，不要包含任何 markdown 标记（如 \`\`\`json）：

【核心生成原则】
1. 报告中所有数组字段（如 chapters、highlights、thinking、terms、tags）的长度必须根据字幕内容的实际信息量 and 视频长度动态调整。
2. 章节总结（chapters）的数量和区间必须根据视频实际的时间轴跨度与内容转折点自动调节。必须在 time 字段中返回明确的起止时间区间（例如 "00:00 - 04:07"）。
3. 亮点（highlights）、思考（thinking）和术语解释（terms）同样需要按内容实际含金量动态扩增或缩减数组长度。

{
  "title": "根据内容推断的视频主标题",
  "subtitle": "副标题或核心卖点",
  "meta": {"author": "推断UP主或未知", "duration": "推断时长或未知", "date": "推断日期或未知"},
  "summary": "150-300字的全局摘要",
  "highlights": [{"time": "00:00", "desc": "亮点描述文字（根据内容实际信息量动态增减，通常 4-8 个）"}],
  "tags": ["核心标签1", "标签2"],
  "thinking": [{"question": "提取的深度思考问题（根据内容实际深度动态增减，通常 2-4 组）", "answer": "对应的解答"}],
  "terms": [{"term": "专业术语提取（根据内容实际密度动态增减，通常 3-6 个）", "definition": "对应解释"}],
  "chapters": [{"time": "00:00 - 04:07", "emoji": "📝", "title": "章节标题（必须 provide 明确的起止时间区间，根据视频逻辑自动调节数量）", "desc": "详情描述"}],
  "theme": "总体主题概述"
}`;
  const [prompt, setPrompt] = useState(defaultPrompt);

  // 思维导图专用提示词
  const mindmapPrompt = `你是一个专业的知识图谱和思维导图构建大师。请深度分析以下视频字幕文本，抽丝剥茧，提取出层级严密、逻辑清晰的树状思维导图。请严格按照以下 JSON 格式输出，不要包含任何 markdown 标记（如 \`\`\`json）：
{
  "topic": "视频或文章的全局核心主题（通常是讨论的核心痛点或命题）",
  "branches": [
    {
      "label": "一级分支标题（代表主要的篇章、论点、阶段或观察维度）",
      "details": [
        "二级细节要点一（具体的方法、证据、数据或延伸阐述）",
        "二级细节要点二",
        "二级细节要点三"
      ]
    }
  ]
}`;

  // 文件与解析状态
  const [file, setFile] = useState(null);
  const [fileContent, setFileContent] = useState('');
  const [isAudioFile, setIsAudioFile] = useState(false); // 是否上传的是音视频文件
  const [audioFile, setAudioFile] = useState(null); // 存储音视频实体
  const [isDragging, setIsDragging] = useState(false);
  const [searchQuery, setSearchQuery] = useState(''); // 细读搜索
  
  // 运行状态与历史管理
  const [isLoading, setIsLoading] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false); // 语音转写加载状态
  const [isMindmapLoading, setIsMindmapLoading] = useState(false);
  const [isExportingPng, setIsExportingPng] = useState(false); // 导出PNG时的加载状态
  const [result, setResult] = useState(null);
  const [mindmapResult, setMindmapResult] = useState(null); // 思维导图数据
  const [rawResult, setRawResult] = useState(''); 
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);
  const [activeHistoryId, setActiveHistoryId] = useState(null);
  
  // 章节原始字幕展开状态
  const [expandedChapters, setExpandedChapters] = useState({});

  // 脑图动态折叠、平移与缩放状态
  const [collapsedBranches, setCollapsedBranches] = useState({});
  const [scale, setScale] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });

  const fileInputRef = useRef(null);
  const sidebarRef = useRef(null);

  // 初始化读取本地配置与历史记录
  useEffect(() => {
    const savedSettings = localStorage.getItem('bibi_clone_settings_v4');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      setApiUrl(parsed.apiUrl || apiUrl);
      setApiKey(parsed.apiKey || apiKey);
      setModel(parsed.model || model);
      setPrompt(parsed.prompt || prompt);
      setFillerWords(parsed.fillerWords !== undefined ? parsed.fillerWords : '然后,就是,这个,那个,嗯,啊,就是说,那什么,其实,我觉得');
    }

    const savedHistory = localStorage.getItem('bibi_clone_history_v4');
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    }
  }, []);

  const saveSettings = () => {
    try {
      localStorage.setItem(
        'bibi_clone_settings_v4',
        JSON.stringify({
          apiUrl,
          apiKey,
          model,
          prompt,
          fillerWords
        })
      );
      setIsSettingsOpen(false);
      setError('');
    } catch (err) {
      setError('保存设置失败，请稍后重试');
    }
  };

  // ---------------- ASR 语气助词净化过滤逻辑 ----------------
  function cleanAsrFillerWords(text) {
    if (!text || !fillerWords) return text;
    const wordList = fillerWords
      .split(/[,，]/)
      .map(w => w.trim())
      .filter(w => w.length > 0);
      
    if (wordList.length === 0) return text;

    // 安全转义正则表达式元字符
    const escapedWords = wordList
      .map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .filter(w => w.length > 0)
      .join('|');

    if (!escapedWords) return text;

    const fillerPattern = new RegExp(`(${escapedWords})(，|、|。|\\s)?`, 'g');
    return text.replace(fillerPattern, '');
  }

  // ---------------- Subtitles Parser ----------------

  function parseSubtitles(text) {
    const cues = [];
    const lines = text.split(/\r?\n/);
    let currentCue = null;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.includes('-->')) {
        const parts = line.split('-->');
        const startSec = parseTimestampToSeconds(parts[0]);
        const endSec = parseTimestampToSeconds(parts[1]);
        
        if (currentCue) {
          cues.push(currentCue);
        }
        currentCue = { start: startSec, end: endSec, textLines: [] };
      } else if (currentCue) {
        if (line === '') {
          // block break
        } else if (/^\d+$/.test(line) && lines[i+1] && lines[i+1].includes('-->')) {
          // index skip
        } else {
          currentCue.textLines.push(line);
        }
      }
    }
    if (currentCue) {
      cues.push(currentCue);
    }
    
    return cues.map(c => ({
      start: c.start,
      end: c.end,
      text: c.textLines.join(' ').replace(/<[^>]*>/g, '')
    }));
  }

  // 转换时间到秒数
  function parseTimestampToSeconds(ts) {
    const cleaned = ts.replace(',', '.').trim();
    const parts = cleaned.split(':');
    let seconds = 0;
    if (parts.length === 3) {
      seconds += parseFloat(parts[0]) * 3600;
      seconds += parseFloat(parts[1]) * 60;
      seconds += parseFloat(parts[2]);
    } else if (parts.length === 2) {
      seconds += parseFloat(parts[0]) * 60;
      seconds += parseFloat(parts[1]);
    }
    return seconds || 0;
  }

  function parseChapterTimeToSeconds(timeStr) {
    if (!timeStr) return 0;
    const cleaned = timeStr.replace(/[\[\]]/g, '').trim();
    const parts = cleaned.split(':');
    let seconds = 0;
    if (parts.length === 3) {
      seconds += parseInt(parts[0], 10) * 3600;
      seconds += parseInt(parts[1], 10) * 60;
      seconds += parseInt(parts[2], 10);
    } else if (parts.length === 2) {
      seconds += parseInt(parts[0], 10) * 60;
      seconds += parseInt(parts[1], 10);
    }
    return seconds;
  }

  function formatSeconds(sec) {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = Math.floor(sec % 60);
    const pad = (n) => String(n).padStart(2, '0');
    if (h > 0) {
      return `${pad(h)}:${pad(m)}:${pad(s)}`;
    }
    return `${pad(m)}:${pad(s)}`;
  }

  // ---------------- 同步状态解析器（派生自 State） ----------------
  const parsedCues = useMemo(() => {
    if (!fileContent) return [];
    const cleanedContent = isAsrCleanupEnabled ? cleanAsrFillerWords(fileContent) : fileContent;
    return parseSubtitles(cleanedContent);
  }, [fileContent, isAsrCleanupEnabled, fillerWords]);

  const filteredCues = useMemo(() => {
    return parsedCues.filter(cue => 
      cue.text.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [parsedCues, searchQuery]);

  // --------------------------------------------------

  // 智能计算章节时间范围区间
  const getChapterTimeRange = (ch, index, allChapters) => {
    if (!ch) return '';
    if (ch.time.includes('-') || ch.time.includes('~')) return ch.time;
    
    const startTime = ch.time.trim();
    const nextCh = allChapters[index + 1];
    if (nextCh) {
      const nextTime = nextCh.time.includes('-') ? nextCh.time.split('-')[0].trim() : nextCh.time.trim();
      return `${startTime} - ${nextTime}`;
    }
    return `${startTime} - 结束`;
  };

  const getChapterSubtitles = (timeStr, nextTimeStr) => {
    if (parsedCues.length === 0) {
      return '此字幕文件不包含 SRT/VTT 格式的时间轴标记，或尚未上传有效字幕。';
    }
    const normalizedTimeStr = timeStr.replace(/[–—~～]/g, '-');
    const actualStartTime = normalizedTimeStr.includes('-') ? normalizedTimeStr.split('-')[0].trim() : normalizedTimeStr;
    const startSec = parseChapterTimeToSeconds(actualStartTime);
    
    let endSec = Infinity;
    if (nextTimeStr) {
      const normalizedNextTimeStr = nextTimeStr.replace(/[–—~～]/g, '-');
      const actualEndTime = normalizedNextTimeStr.includes('-') ? normalizedNextTimeStr.split('-')[0].trim() : normalizedNextTimeStr;
      endSec = parseChapterTimeToSeconds(actualEndTime);
    } else if (normalizedTimeStr.includes('-')) {
      const actualEndTime = normalizedTimeStr.split('-')[1].trim();
      const parsedEnd = parseChapterTimeToSeconds(actualEndTime);
      endSec = parsedEnd > startSec ? parsedEnd : Infinity;
    }
    
    const matchedCues = parsedCues.filter(cue => cue.start >= startSec && cue.start < endSec);
    if (matchedCues.length === 0) {
      return '该时段内未匹配到相关的原始字幕文本。';
    }
    return matchedCues.map(c => `[${formatSeconds(c.start)}] ${c.text}`).join('\n');
  };

  const toggleChapterSubtitles = (index) => {
    setExpandedChapters(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // ---------------- 侧边栏拖拽 Resize 机制 ----------------
  const handleSidebarMouseDown = (e) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidth = sidebarWidth;

    // 隐式覆盖层屏蔽：阻断 Iframe 拦截事件焦点，保障滑动无限丝滑
    const mask = document.createElement('div');
    mask.style.position = 'fixed';
    mask.style.inset = '0';
    mask.style.cursor = 'col-resize';
    mask.style.zIndex = '9999';
    document.body.appendChild(mask);

    const handleMouseMove = (moveEvent) => {
      const newWidth = startWidth + (moveEvent.clientX - startX);
      if (newWidth > 260 && newWidth < 550) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      document.body.removeChild(mask);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  // ---------------- 脑图无限画布平移与缩放 ----------------
  const handleCanvasMouseDown = (e) => {
    if (e.target.closest('button') || e.target.closest('input')) return;
    setIsPanning(true);
    setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleCanvasMouseMove = (e) => {
    if (!isPanning) return;
    setPanOffset({ x: e.clientX - panStart.x, y: e.clientY - panStart.y });
  };

  const handleCanvasMouseUp = () => {
    setIsPanning(false);
  };

  const handleCanvasWheel = (e) => {
    e.preventDefault();
    const zoomFactor = 0.08;
    if (e.deltaY < 0) {
      setScale(prev => Math.min(2.5, prev + zoomFactor));
    } else {
      setScale(prev => Math.max(0.4, prev - zoomFactor));
    }
  };

  const resetCanvasView = () => {
    setScale(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const toggleBranchFold = (idx) => {
    setCollapsedBranches(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  // ---------------- 载入 2D 导出插件 ----------------
  const loadHtml2Canvas = () => {
    return new Promise((resolve, reject) => {
      if (window.html2canvas) {
        resolve(window.html2canvas);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
      script.onload = () => resolve(window.html2canvas);
      script.onerror = () => reject(new Error('无法载入 html2canvas 插件，请确认网络畅通。'));
      document.head.appendChild(script);
    });
  };

  // --------------------------------------------------

  const processFile = (selectedFile) => {
    if (!selectedFile) return;
    
    const validExtensions = ['.txt', '.srt', '.vtt'];
    const validAudioExtensions = ['.mp3', '.wav', '.m4a', '.mp4', '.webm', '.aac', '.ogg'];
    const fileNameLower = selectedFile.name.toLowerCase();
    
    const isText = validExtensions.some(ext => fileNameLower.endsWith(ext));
    const isAudio = validAudioExtensions.some(ext => fileNameLower.endsWith(ext));
    
    if (!isText && !isAudio) {
      setError('仅支持字幕文本（.txt, .srt, .vtt）或音视频音频文件（.mp3, .wav, .m4a等）');
      return;
    }

    setFile(selectedFile);
    setError('');
    setResult(null);
    setMindmapResult(null);
    setRawResult('');
    setActiveHistoryId(null);
    setExpandedChapters({});
    setSearchQuery('');
    setCollapsedBranches({});
    resetCanvasView();

    if (isAudio) {
      setIsAudioFile(true);
      setAudioFile(selectedFile);
      setFileContent(''); 
    } else {
      setIsAudioFile(false);
      setAudioFile(null);
      const reader = new FileReader();
      reader.onload = (e) => {
        setFileContent(e.target.result);
      };
      reader.onerror = () => setError('文件读取失败，请重试');
      reader.readAsText(selectedFile);
    }
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    processFile(e.dataTransfer.files[0]);
  };

  const safeSaveHistory = (updatedHistory) => {
    try {
      localStorage.setItem('bibi_clone_history_v4', JSON.stringify(updatedHistory));
    } catch (e) {
      if (e.name === 'QuotaExceededError' || e.code === 22) {
        const pruned = updatedHistory.slice(0, Math.max(1, Math.floor(updatedHistory.length * 0.75)));
        setHistory(pruned);
        safeSaveHistory(pruned);
      }
    }
  };

  const saveToHistory = (parsedJson, textRaw, fileName, originalSubtitles, mindmapData = null) => {
    const newRecord = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleString('zh-CN', { hour12: false }),
      fileName: fileName || '未命名文件',
      title: parsedJson?.title || '未命名报告',
      subtitle: parsedJson?.subtitle || '',
      result: parsedJson,
      rawResult: textRaw,
      fileContent: originalSubtitles,
      mindmap: mindmapData 
    };

    const updatedHistory = [newRecord, ...history];
    setHistory(updatedHistory);
    setActiveHistoryId(newRecord.id);
    safeSaveHistory(updatedHistory);
  };

  const updateCurrentHistoryRecord = (mindmapData) => {
    if (!activeHistoryId) return;
    const updatedHistory = history.map(item => {
      if (item.id === activeHistoryId) {
        return { ...item, mindmap: mindmapData };
      }
      return item;
    });
    setHistory(updatedHistory);
    safeSaveHistory(updatedHistory);
  };

  const deleteHistoryItem = (id, e) => {
    e.stopPropagation();
    const updatedHistory = history.filter(item => item.id !== id);
    setHistory(updatedHistory);
    safeSaveHistory(updatedHistory);
    if (activeHistoryId === id) {
      setResult(null);
      setMindmapResult(null);
      setRawResult('');
      setFileContent('');
      setFile(null);
      setActiveHistoryId(null);
      setExpandedChapters({});
      setSearchQuery('');
    }
  };

  const loadHistoryItem = (item) => {
    setResult(item.result);
    setRawResult(item.rawResult);
    setMindmapResult(item.mindmap || null); 
    setFileContent(item.fileContent || '');
    setFile(item.fileName ? { name: item.fileName } : null);
    setIsAudioFile(false); 
    setActiveHistoryId(item.id);
    setExpandedChapters({});
    setSearchQuery('');
    setError('');
  };

  const clearAllHistory = () => {
    setHistory([]);
    safeSaveHistory([]);
    setResult(null);
    setMindmapResult(null);
    setRawResult('');
    setFileContent('');
    setFile(null);
    setActiveHistoryId(null);
    setExpandedChapters({});
    setSearchQuery('');
    setIsConfirmClearOpen(false);
  };

  // ---------------- Whisper 智能 ASR 接口转写 ----------------
  const transcribeAudioFile = async () => {
    if (!apiKey) {
      setError('请先在设置中配置 API Key');
      setIsSettingsOpen(true);
      return;
    }
    if (!audioFile) {
      setError('请先选择待转写的音视频文件');
      return;
    }

    setIsTranscribing(true);
    setError('');
    setFileContent('');

    // 自动将 ChatCompletion URL 转换适配成 Whisper SpeechToText 接口地址
    let whisperUrl = apiUrl.replace('/chat/completions', '/audio/transcriptions');
    if (whisperUrl === apiUrl) {
      whisperUrl = apiUrl.replace(/\/v1\/.*/, '/v1/audio/transcriptions');
    }

    const formData = new FormData();
    formData.append('file', audioFile);
    formData.append('model', 'whisper-1');
    formData.append('response_format', 'vtt'); // 强制拉取 vtt 格式以保留高精度时间戳

    try {
      const response = await fetch(whisperUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`
        },
        body: formData
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error?.message || `语音识别接口请求失败，HTTP 错误代码: ${response.status}`);
      }

      const vttText = await response.text();
      setFileContent(vttText);
      setIsAudioFile(false); // 转写成功，直接进入标准文本交互区
    } catch (err) {
      setError(err.message);
    } finally {
      setIsTranscribing(false);
    }
  };

  // 一键生成总结报告
  const generateSummary = async () => {
    if (!apiKey) {
      setError('请先在设置中配置 API Key');
      setIsSettingsOpen(true);
      return;
    }
    if (!fileContent) {
      setError('没有可分析的字幕内容，请先上传字幕或执行语音转写');
      return;
    }

    setIsLoading(true);
    setError('');
    setResult(null);
    setMindmapResult(null);
    setRawResult('');
    setExpandedChapters({});

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: prompt },
            { role: 'user', content: `以下是视频字幕/文本内容：\n\n${fileContent.substring(0, 30000)}` }
          ]
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP 错误: ${response.status}`);
      }

      const data = await response.json();
      const textResponse = data.choices[0].message.content;
      
      let parsedJson = null;
      let isParsedSuccess = false;

      try {
        let cleanedText = textResponse.trim();
        const jsonMatch = cleanedText.match(/```json\s*([\s\S]*?)\s*```/i) || cleanedText.match(/```\s*([\s\S]*?)\s*```/i);
        if (jsonMatch) {
          cleanedText = jsonMatch[1].trim();
        }
        parsedJson = JSON.parse(cleanedText);
        setResult(parsedJson);
        isParsedSuccess = true;
      } catch (parseError) {
        console.warn('JSON解析失败降级展示', parseError);
        setRawResult(textResponse);
      }

      saveToHistory(isParsedSuccess ? parsedJson : null, textResponse, file?.name, fileContent, null);

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ---------------- 智能思维导图独立生成 ----------------
  const generateMindmap = async () => {
    if (!apiKey) {
      setError('请先在设置中配置 API Key');
      setIsSettingsOpen(true);
      return;
    }
    if (!fileContent) {
      setError('没有字幕内容可供分析。');
      return;
    }

    setIsMindmapLoading(true);
    setError('');
    setMindmapResult(null);
    setCollapsedBranches({});
    resetCanvasView();

    try {
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: mindmapPrompt },
            { role: 'user', content: `以下是视频字幕/文本内容：\n\n${fileContent.substring(0, 30000)}` }
          ]
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error?.message || `HTTP 错误: ${response.status}`);
      }

      const data = await response.json();
      const textResponse = data.choices[0].message.content;
      
      try {
        let cleanedText = textResponse.trim();
        const jsonMatch = cleanedText.match(/```json\s*([\s\S]*?)\s*```/i) || cleanedText.match(/```\s*([\s\S]*?)\s*```/i);
        if (jsonMatch) {
          cleanedText = jsonMatch[1].trim();
        }
        const parsedMindmap = JSON.parse(cleanedText);
        setMindmapResult(parsedMindmap);
        
        if (activeHistoryId) {
          updateCurrentHistoryRecord(parsedMindmap);
        } else {
          saveToHistory(null, '', file?.name, fileContent, parsedMindmap);
        }
      } catch (parseError) {
        throw new Error('思维导图解析失败，模型未按预设 of JSON 格式输出。请尝试重新生成。');
      }

    } catch (err) {
      setError(err.message);
    } finally {
      setIsMindmapLoading(false);
    }
  };

  // ---------------- 各种核心多维格式导出引擎 ----------------
  
  const exportMindmapAsMarkdown = () => {
    if (!mindmapResult) return;
    const mdLines = [
      `# ${mindmapResult.topic}`,
      "",
      ...mindmapResult.branches.map(b => {
        return [
          `## ${b.label}`,
          ...b.details.map(d => `- ${d}`),
          ""
        ].join('\n');
      })
    ];
    const mdContent = mdLines.join('\n');
    const blob = new Blob([mdContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.href = url;
    downloadAnchor.setAttribute("download", `思维导图-${mindmapResult.topic || '未命名主题'}.md`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
    URL.revokeObjectURL(url);
  };

  const exportMindmapAsJSON = () => {
    if (!mindmapResult) return;
    const jsonContent = JSON.stringify(mindmapResult, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.href = url;
    downloadAnchor.setAttribute("download", `思维导图-${mindmapResult.topic || '未命名主题'}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
    URL.revokeObjectURL(url);
  };

  const exportReportAsMarkdown = () => {
    if (!result) return;
    const mdLines = [
      `# 《${result.title}》`,
      result.subtitle ? `> **${result.subtitle}**` : '',
      "",
      `- **主讲人/作者**: ${result.meta?.author || '未知'}`,
      `- **音视频时长**: ${result.meta?.duration || '未知'}`,
      `- **归档日期**: ${result.meta?.date || '未知'}`,
      "",
      "## 核心摘要",
      result.summary,
      "",
      "## 要点亮点",
      ...result.highlights.map(h => `* **[${h.time}]** ${h.desc}`),
      "",
      "## 深度问答思考",
      ...result.thinking.map((t, i) => `### Q${i+1}: ${t.question}\n${t.answer}\n`),
      "",
      "## 专业术语检索",
      ...result.terms.map(t => `* **${t.term}**: ${t.definition}`),
      "",
      "## 章节多维纲要",
      ...result.chapters.map((ch, i) => {
        const tr = getChapterTimeRange(ch, i, result.chapters);
        return `### [${tr}] ${ch.emoji || '📝'} ${ch.title}\n${ch.desc}\n`;
      }),
      "",
      `## 核心主旨综述`,
      result.theme
    ];
    
    const blob = new Blob([mdLines.join('\n')], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.href = url;
    downloadAnchor.setAttribute("download", `视频大纲报告-${result.title}.md`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
    URL.revokeObjectURL(url);
  };

  const exportMindmapAsPNG = async () => {
    if (!mindmapResult) return;
    setIsExportingPng(true);
    setError('');
    
    try {
      const html2canvasLib = await loadHtml2Canvas();
      const element = document.getElementById('mindmap-capture-area');
      if (!element) throw new Error('捕获节点解析异常：未在 DOM 树中检索到捕获区域。');

      const originalTransform = element.style.transform;
      const originalTransformOrigin = element.style.transformOrigin;
      const originalWidth = element.style.width;
      const originalHeight = element.style.height;

      element.style.transform = 'none';
      element.style.transformOrigin = 'unset';
      element.style.width = 'max-content';
      element.style.height = 'max-content';

      const canvas = await html2canvasLib(element, {
        backgroundColor: '#0E0E0D', 
        useCORS: true,
        scale: 2, 
        logging: false
      });

      element.style.transform = originalTransform;
      element.style.transformOrigin = originalTransformOrigin;
      element.style.width = originalWidth;
      element.style.height = originalHeight;

      const imgData = canvas.toDataURL('image/png');
      const downloadAnchor = document.createElement('a');
      downloadAnchor.href = imgData;
      downloadAnchor.setAttribute("download", `思维导图-${mindmapResult.topic || '未命名主题'}.png`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      document.body.removeChild(downloadAnchor);
    } catch (err) {
      console.error(err);
      setError(`脑图 PNG 转换异常: ${err.message}`);
    } finally {
      setIsExportingPng(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // ---------------- 避开 iframe 限制的安全剪贴板写入 ----------------
  const handleCopyReport = () => {
    if (!result) return;
    
    const textLines = [
      `《${result.title}》`,
      result.subtitle ? `${result.subtitle}` : '',
      `UP主: ${result.meta?.author || '未知'} | 时长: ${result.meta?.duration || '未知'} | 日期: ${result.meta?.date || '未知'}`,
      '\n[ 摘要 ]',
      result.summary,
      '\n[ 亮点回顾 ]'
    ];

    result.highlights?.forEach(hl => {
      textLines.push(`[${hl.time}] ${hl.desc}`);
    });

    if (result.thinking && result.thinking.length > 0) {
      textLines.push('\n[ 深度思考与洞察 ]');
      result.thinking.forEach((tk, idx) => {
        textLines.push(`Q${idx + 1}: ${tk.question}\nA: ${tk.answer}`);
      });
    }

    if (result.chapters && result.chapters.length > 0) {
      textLines.push('\n[ 章节归纳 ]');
      result.chapters.forEach((ch, idx) => {
        const timeRange = getChapterTimeRange(ch, idx, result.chapters);
        textLines.push(`[${timeRange}] ${ch.emoji || ''} ${ch.title}\n描述: ${ch.desc}`);
      });
    }

    const reportText = textLines.join('\n');

    const textArea = document.createElement("textarea");
    textArea.value = reportText;
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      const successful = document.execCommand('copy');
      if (successful) {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
      }
    } catch (err) {
      console.error('一键复制执行异常', err);
    }
    document.body.removeChild(textArea);
  };

  return (
    <div className="h-screen w-full bg-[#0E0E0D] text-[#ECECE9] font-sans flex overflow-hidden antialiased select-none">
      
      {/* 注入全局极致暗色滚动条、微网格及字体抗锯齿 CSS */}
      <style dangerouslySetInnerHTML={{__html: `
        /* 定制精细化滚动条 */
        ::-webkit-scrollbar {
          width: 5px;
          height: 5px;
        }
        ::-webkit-scrollbar-track {
          background: #0E0E0D;
        }
        ::-webkit-scrollbar-thumb {
          background: #262624;
          border-radius: 0px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #3E3E3B;
        }
        
        /* 莫兰迪低饱和度卡片发光边框 */
        .morandi-oatmeal-card {
          background: linear-gradient(185deg, rgba(45,42,36,0.2) 0%, rgba(14,14,13,0) 100%);
          border: 1px solid rgba(69,65,55,0.4);
        }
        .morandi-green-card {
          background: linear-gradient(185deg, rgba(35,45,39,0.2) 0%, rgba(14,14,13,0) 100%);
          border: 1px solid rgba(58,76,64,0.4);
        }
        .morandi-pink-card {
          background: linear-gradient(185deg, rgba(46,34,35,0.2) 0%, rgba(14,14,13,0) 100%);
          border: 1px solid rgba(76,59,60,0.4);
        }
        .morandi-blue-card {
          background: linear-gradient(185deg, rgba(36,46,53,0.2) 0%, rgba(14,14,13,0) 100%);
          border: 1px solid rgba(62,78,89,0.4);
        }
      `}} />

      {/* 打印样式控制 */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body {
            background-color: #ffffff !important;
          }
          aside, nav, .non-printable, button, .tabs-container {
            display: none !important;
          }
          .printable-sheet {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
          }
          .right-content-area {
            padding: 0 !important;
            overflow: visible !important;
            height: auto !important;
          }
          .h-screen {
            height: auto !important;
            overflow: visible !important;
          }
        }
      `}} />

      {/* 左侧控制面板 - unmoth-like 深邃硬核暗色基调 */}
      <aside 
        ref={sidebarRef}
        style={{ width: isSidebarOpen ? `${sidebarWidth}px` : '0px' }}
        className="bg-[#0E0E0D] text-[#ECECE9] border-r border-[#1C1C1B] flex flex-col flex-shrink-0 z-10 shadow-none non-printable transition-all duration-75 relative overflow-hidden"
      >
        
        {/* 页头 */}
        <div className="h-16 px-6 border-b border-[#1C1C1B] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 bg-white flex items-center justify-center text-[#0E0E0D] font-mono font-black text-xs">
              M
            </div>
            <span className="text-xs font-mono font-bold tracking-widest uppercase">Unmoth 智能总结</span>
          </div>
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className="p-1.5 text-zinc-500 hover:text-white transition-colors"
            title="接口配置"
          >
            <Settings size={16} />
          </button>
        </div>

        {/* 核心总结面板 */}
        <div className="p-6 border-b border-[#1C1C1B] space-y-4 bg-[#0A0A09]/40 shrink-0">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[9px] font-mono text-zinc-500 tracking-wider uppercase block">[ 01 / 资源上传 ]</span>
              
              {/* 字幕文本语气词净化过滤器（开关） */}
              <label className="flex items-center gap-1.5 cursor-pointer text-zinc-500 hover:text-zinc-300 transition-colors" title="自动净化 ASR 口语高频语气填充词，降低语义噪点。">
                <input 
                  type="checkbox" 
                  checked={isAsrCleanupEnabled} 
                  onChange={(e) => setIsAsrCleanupEnabled(e.target.checked)} 
                  className="rounded-none bg-black border-zinc-800 focus:ring-0 checked:bg-zinc-100" 
                />
                <span className="text-[9px] font-mono uppercase tracking-tight">[ 净化语气词 ]</span>
              </label>
            </div>
            
            <div 
              className={`border rounded-sm p-4 text-center cursor-pointer transition-colors ${
                isDragging 
                  ? 'border-white bg-zinc-900 text-white' 
                  : 'border-[#262624] bg-[#0F0F0E] hover:border-zinc-500'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input type="file" ref={fileInputRef} onChange={(e) => processFile(e.target.files[0])} accept=".srt,.vtt,.txt,.mp3,.wav,.m4a,.mp4,.webm,.aac" className="hidden" />
              <div className="flex flex-col items-center justify-center gap-2">
                <UploadCloud size={16} className="text-zinc-500" />
                <div>
                  <p className="font-mono text-[10px] font-bold tracking-wider">上传音视频或字幕</p>
                  <p className="text-zinc-600 text-[8px] font-mono mt-0.5">支持：SRT, VTT, TXT | MP3, WAV, M4A等</p>
                </div>
              </div>
            </div>

            {file && (
              <div className="p-3 bg-[#0F0F0E] border border-[#262624] flex items-start gap-2 rounded-sm">
                <FileText className="text-zinc-500 shrink-0 mt-0.5" size={14} />
                <div className="flex-1 min-w-0">
                  <p className="font-mono text-[10px] text-zinc-200 truncate font-semibold">{file.name}</p>
                  <p className="text-zinc-600 text-[8px] font-mono mt-0.5">
                    {isAudioFile ? '音视频大文件' : `${(fileContent.length / 1000).toFixed(1)}K 字符`}
                  </p>
                </div>
                {!isAudioFile && <CheckCircle2 className="text-zinc-300 shrink-0" size={14} />}
              </div>
            )}
          </div>

          {error && (
            <div className="bg-[#1C0F0E] text-[#E0A8A6] p-2.5 rounded-sm border border-[#3D2220] flex items-start gap-2 text-[11px] font-mono leading-relaxed">
              <AlertCircle size={13} className="shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* 转写与分析操作触发区 */}
          <div className="space-y-2">
            <span className="text-[9px] font-mono text-zinc-500 tracking-wider uppercase block">[ 02 / 交互处理 ]</span>
            
            {/* 音视频专属 ASR 转写按钮 */}
            {isAudioFile && (
              <button
                onClick={transcribeAudioFile}
                disabled={isTranscribing}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 bg-[#232D27] text-[#7E998B] border border-[#3A4C40] hover:bg-[#323D36] rounded-sm font-mono text-[10px] font-bold tracking-widest uppercase transition-colors"
              >
                {isTranscribing ? (
                  <><div className="w-3 h-3 border-2 border-[#7E998B]/30 border-t-[#7E998B] rounded-full animate-spin" />Whisper 智能识别中...</>
                ) : (
                  <><Volume2 size={11} />Whisper 一键语音转字幕</>
                )}
              </button>
            )}

            <button
              onClick={generateSummary}
              disabled={isLoading || !fileContent}
              className={`w-full flex items-center justify-center gap-1.5 py-2 px-4 rounded-sm font-mono text-[10px] font-bold tracking-widest uppercase transition-colors
                ${isLoading || !fileContent 
                  ? 'bg-[#1C1C1B] text-zinc-600 border border-[#262624] cursor-not-allowed' 
                  : 'bg-white text-black hover:bg-zinc-200'
                }`}
            >
              {isLoading ? (
                <><div className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />解析处理中...</>
              ) : (
                <><Sparkles size={11} />一键生成全文总结</>
              )}
            </button>
          </div>
        </div>

        {/* 历史管理列表 */}
        <div className="flex-1 flex flex-col min-h-0">
          <div className="px-6 py-3.5 border-b border-[#1C1C1B] bg-[#0A0A09]/20 flex items-center justify-between shrink-0">
            <span className="text-[9px] font-mono text-zinc-500 tracking-wider uppercase flex items-center gap-1.5">
              [ 03 / 历史归档 data - {history.length} ]
            </span>
            {history.length > 0 && (
              <button 
                onClick={() => setIsConfirmClearOpen(true)}
                className="text-[9px] font-mono text-zinc-500 hover:text-rose-400 uppercase tracking-wider animate-pulse"
              >
                清空全部
              </button>
            )}
          </div>

          {/* 清空档案确认控制 */}
          {isConfirmClearOpen && (
            <div className="px-6 py-3 bg-[#1C0F0E] border-b border-[#3D2220] flex items-center justify-between gap-3 shrink-0 non-printable">
              <span className="text-[10px] font-mono text-[#E0A8A6]">确认彻底清空历史归档吗？</span>
              <div className="flex items-center gap-2">
                <button 
                  onClick={clearAllHistory}
                  className="px-2 py-0.5 bg-[#4C1A1C] border border-[#7A2B2D] text-[#FAF0EF] text-[9px] font-mono rounded-sm font-bold"
                >
                  确定
                </button>
                <button 
                  onClick={() => setIsConfirmClearOpen(false)}
                  className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-zinc-400 text-[9px] font-mono rounded-sm font-bold"
                >
                  取消
                </button>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto divide-y divide-[#1C1C1B]">
            {history.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-zinc-600 text-center px-6">
                <p className="text-[10px] font-mono tracking-widest">[ 暂无历史总结 ]</p>
                <p className="text-[9px] font-mono text-zinc-700 mt-2 max-w-[200px] leading-relaxed">生成的分析报告将自动固化在本地，方便快速调用</p>
              </div>
            ) : (
              history.map((item) => (
                <div 
                  key={item.id}
                  onClick={() => loadHistoryItem(item)}
                  className={`px-6 py-4 flex items-start gap-3 cursor-pointer group transition-colors text-left relative
                    ${activeHistoryId === item.id 
                      ? 'bg-[#141413] border-l border-white pl-5' 
                      : 'hover:bg-[#0A0A09]/60'}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="font-mono text-[11px] font-bold text-zinc-100 truncate tracking-tight">{item.title}</p>
                      <button 
                        onClick={(e) => deleteHistoryItem(item.id, e)}
                        className="text-zinc-600 hover:text-rose-400 p-0.5 rounded opacity-0 group-hover:opacity-100 transition-all shrink-0 active:scale-90"
                        title="删除记录"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                    {item.subtitle && <p className="text-[10px] font-mono text-zinc-500 truncate mt-0.5">{item.subtitle}</p>}
                    <div className="flex items-center justify-between text-[8px] font-mono text-zinc-600 mt-2">
                      <span className="truncate max-w-[120px]">{item.fileName}</span>
                      <span>{item.timestamp}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </aside>

      {/* 物理网格拖拽分割线杆 */}
      {isSidebarOpen && (
        <div 
          onMouseDown={handleSidebarMouseDown}
          className="w-1 cursor-col-resize hover:bg-[#3E4E59] bg-[#1C1C1B] transition-colors shrink-0 z-20 non-printable relative"
          title="左右无级拉伸分栏比例"
        />
      )}

      {/* 右侧展示工作台 */}
      <div className="flex-1 flex flex-col h-screen min-w-0 right-content-area bg-[#0E0E0D]">
        
        {/* 控制区导航 / 瑞士模块化顶栏 */}
        <div className="h-14 border-b border-[#1C1C1B] bg-[#0E0E0D] flex items-center justify-between shrink-0 non-printable select-none text-[10px] font-mono tracking-wider">
          {/* 左侧：折叠按钮 + 标签页 */}
          <div className="flex items-center h-full">
            {/* 折叠侧边栏 */}
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="h-full px-4 border-r border-[#1C1C1B] text-zinc-500 hover:text-white hover:bg-[#141413] transition-colors flex items-center justify-center"
              title={isSidebarOpen ? "收起侧边栏" : "展开侧边栏"}
            >
              {isSidebarOpen ? <ChevronLeft size={14} /> : <Menu size={14} />}
            </button>

            {/* 标签切换网格段 */}
            {(result || rawResult || fileContent) && (
              <div className="flex h-full items-center">
                {(result || rawResult) && (
                  <>
                    <button 
                      onClick={() => setActiveTab('standard')}
                      className={`h-full px-5 border-r border-[#1C1C1B] font-bold transition-colors uppercase
                        ${activeTab === 'standard' 
                          ? 'bg-white text-black border-b border-black' 
                          : 'text-zinc-500 hover:text-zinc-100 hover:bg-[#141413]'}`}
                    >
                      标准总结
                    </button>
                    <button 
                      onClick={() => setActiveTab('word-preview')}
                      className={`h-full px-5 border-r border-[#1C1C1B] font-bold transition-colors uppercase
                        ${activeTab === 'word-preview' 
                          ? 'bg-white text-black border-b border-black' 
                          : 'text-zinc-500 hover:text-zinc-100 hover:bg-[#141413]'}`}
                    >
                      A4预览
                    </button>
                  </>
                )}
                {fileContent && (
                  <>
                    <button 
                      onClick={() => setActiveTab('transcript')}
                      className={`h-full px-5 border-r border-[#1C1C1B] font-bold transition-colors uppercase
                        ${activeTab === 'transcript' 
                          ? 'bg-white text-black border-b border-black' 
                          : 'text-zinc-500 hover:text-zinc-100'}`}
                    >
                      原文细读
                    </button>
                    <button 
                      onClick={() => setActiveTab('mindmap')}
                      className={`h-full px-5 border-r border-[#1C1C1B] font-bold transition-colors uppercase
                        ${activeTab === 'mindmap' 
                          ? 'bg-white text-black border-b border-black' 
                          : 'text-zinc-500 hover:text-zinc-100'}`}
                    >
                      思维导图
                    </button>
                  </>
                )}
              </div>
            )}
          </div>

          {/* 右侧：动作控制面板 */}
          <div className="flex items-center h-full">
            
            {/* 字号微调模块 */}
            {(result || fileContent) && activeTab !== 'word-preview' && (
              <div className="flex items-center h-full border-l border-[#1C1C1B] text-zinc-400">
                <button 
                  onClick={() => setFontSize(prev => Math.max(11, prev - 1))}
                  className="h-full px-3 hover:text-white hover:bg-[#141413] transition-colors"
                  title="减小字号"
                >
                  <Minus size={11} />
                </button>
                <span className="px-2 font-mono text-[10px] tracking-tight text-zinc-300">
                  {fontSize}PX
                </span>
                <button 
                  onClick={() => setFontSize(prev => Math.min(20, prev + 1))}
                  className="h-full px-3 border-r border-[#1C1C1B] hover:text-white hover:bg-[#141413] transition-colors"
                  title="增大字号"
                >
                  <Plus size={11} />
                </button>
              </div>
            )}

            {/* 动态行动流 */}
            {result && activeTab === 'standard' && (
              <div className="flex items-center h-full">
                <button
                  onClick={exportReportAsMarkdown}
                  className="h-full px-4 border-r border-[#1C1C1B] text-zinc-300 hover:text-white hover:bg-[#141413] font-bold transition-colors flex items-center gap-1.5"
                  title="导出完整大纲为标准 Markdown 文件"
                >
                  <Download size={12} />
                  导出大纲
                </button>

                <button
                  onClick={handleCopyReport}
                  className="h-full px-4 text-zinc-300 hover:text-white hover:bg-[#141413] font-bold transition-colors flex items-center gap-1.5"
                  title="复制总结大纲到剪贴板"
                >
                  {isCopied ? (
                    <>
                      <Check size={12} className="text-[#7E998B]" />
                      <span className="text-[#7E998B]">已复制</span>
                    </>
                  ) : (
                    <>
                      <Copy size={12} />
                      <span>复制报告</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {activeTab === 'word-preview' && (result || rawResult) && (
              <button
                onClick={handlePrint}
                className="h-full px-5 bg-white text-black hover:bg-zinc-200 font-bold transition-all flex items-center gap-1.5"
              >
                <Printer size={12} />
                系统打印 (PDF)
              </button>
            )}
          </div>
        </div>

        {/* 核心画布 */}
        <div className={`flex-1 overflow-y-auto ${activeTab === 'word-preview' ? 'bg-[#1C1C1B]' : 'bg-[#0E0E0D]'}`}>
          {!result && !rawResult && activeTab !== 'transcript' && activeTab !== 'mindmap' ? (
            <div className="h-full flex flex-col items-center justify-center text-zinc-500 p-8 text-center bg-[#0E0E0D]">
              <div className="w-12 h-12 mb-4 text-[#7E998B] opacity-60">
                <BookOpen size={48} strokeWidth={1.5} />
              </div>
              <h3 className="text-xs font-mono font-bold tracking-widest text-zinc-300 uppercase">[ 文档展示区 ]</h3>
              <p className="text-[10px] font-mono text-zinc-500 max-w-sm mt-2 leading-relaxed">
                请先上传字幕文件或音视频大文件，配置好 API 密钥后，开始一键生成总结报告。分析报告支持标准网格、Word、字幕对齐和智能思维导图。
              </p>
            </div>
          ) : (
            
            <div className={`w-full ${activeTab === 'word-preview' ? 'py-12 px-6' : 'p-10 max-w-4xl mx-auto'}`}>
              
              {/* 非结构化退化展示 */}
              {rawResult && activeTab !== 'transcript' && activeTab !== 'mindmap' && (
                <div className="max-w-3xl mx-auto p-10 bg-[#141413] border border-[#262624] text-[#F2EFEA] rounded-none shadow-none whitespace-pre-wrap leading-relaxed font-sans text-sm">
                  <div className="p-3 bg-[#2E2223] border border-[#4C3B3C] text-[#B48C8E] rounded-sm mb-6 text-[10px] font-mono flex items-start gap-2">
                    <AlertCircle size={14} className="shrink-0 mt-0.5" />
                    <span>检测到非结构化模型输出。已降级并自动以纯文本对齐排版。</span>
                  </div>
                  {rawResult}
                </div>
              )}

              {/* JSON 模板渲染 */}
              {result && (
                <>
                  {/* TAB 1: 精美标准网格版 - 莫兰迪暗色多彩色块补偿 */}
                  {activeTab === 'standard' && (
                    <div className="space-y-12 text-[#FAF0EF] bg-[#0E0E0D]" style={{ fontSize: `${fontSize}px` }}>
                      
                      {/* 标题与网格化元数据栏 */}
                      <div className="space-y-6 pb-8 border-b border-[#1C1C1B]">
                        <div className="space-y-2">
                          <span className="text-[9px] font-mono text-zinc-500 tracking-widest uppercase block">[ 视频基础元数据 ]</span>
                          <h1 className="font-black text-white tracking-tight leading-snug font-mono" style={{ fontSize: `${fontSize + 10}px` }}>
                            《{result.title}》
                          </h1>
                          {result.subtitle && (
                            <h2 className="font-mono font-semibold text-[#89A2B0] leading-normal" style={{ fontSize: `${fontSize + 1}px` }}>
                              {result.subtitle}
                            </h2>
                          )}
                        </div>
                        
                        {/* 优化后的网格化元数据栏 */}
                        <div className="grid grid-cols-3 border border-[#1C1C1B] bg-[#0A0A09] text-center font-mono text-[11px] overflow-hidden">
                          <div className="py-3 px-4 border-r border-[#1C1C1B] flex flex-col sm:flex-row items-center justify-center gap-2 bg-[#242E35]/10">
                            <span className="text-[#89A2B0] text-[10px] tracking-wider uppercase">[ UP主 ]</span>
                            <span className="text-white font-bold truncate max-w-[140px]">{result.meta?.author || '未知'}</span>
                          </div>
                          <div className="py-3 px-4 border-r border-[#1C1C1B] flex flex-col sm:flex-row items-center justify-center gap-2 bg-[#232D27]/10">
                            <span className="text-[#7E998B] text-[10px] tracking-wider uppercase">[ 时长 ]</span>
                            <span className="text-white font-bold">{result.meta?.duration || '未知'}</span>
                          </div>
                          <div className="py-3 px-4 flex flex-col sm:flex-row items-center justify-center gap-2 bg-[#2E2223]/10">
                            <span className="text-[#B48C8E] text-[10px] tracking-wider uppercase">[ 日期 ]</span>
                            <span className="text-white font-bold">{result.meta?.date || '未知'}</span>
                          </div>
                        </div>
                      </div>

                      {/* 全局总结网格拼图 - 采用合并 1px 实线框，达成绝对连贯、呼吸感极强的 Swiss 排版架构 */}
                      <div className="border border-[#1C1C1B] bg-[#0E0E0D] divide-y divide-[#1C1C1B]">
                        
                        {/* 摘要板块 (莫兰迪燕麦暖色底流) */}
                        <div className="p-8 morandi-oatmeal-card transition-all duration-300">
                          <div className="flex items-center gap-2 mb-4">
                            <span className="text-[#AB9D8B] font-mono text-[10px] font-bold tracking-widest uppercase bg-[#2D2A24]/60 px-2 py-0.5 border border-[#454137]/60">
                              [ 概要 / ABSTRACT ]
                            </span>
                          </div>
                          <p className="leading-relaxed text-[#FAF9F6] font-medium text-justify font-sans">{result.summary}</p>
                        </div>

                        {/* 亮点板块 (莫兰迪灰绿底流) */}
                        {result.highlights && result.highlights.length > 0 && (
                          <div className="p-8 morandi-green-card transition-all duration-300">
                            <div className="flex items-center gap-2 mb-6">
                              <span className="text-[#7E998B] font-mono text-[10px] font-bold tracking-widest uppercase bg-[#232D27]/60 px-2 py-0.5 border border-[#3A4C40]/60">
                                [ 亮点回顾 / HIGHLIGHTS ]
                              </span>
                            </div>
                            <div className="grid grid-cols-1 gap-4 font-sans">
                              {result.highlights.map((hl, i) => (
                                <div key={i} className="flex items-start gap-4 p-3.5 bg-black/35 border border-[#1C1C1B] hover:border-zinc-700 transition-colors duration-200">
                                  <div className="bg-[#232D27] border border-[#3A4C40] text-[#7E998B] font-bold font-mono text-[9px] px-2 py-0.5 shrink-0 w-[58px] text-center tracking-tighter shadow-sm">
                                    {hl.time}
                                  </div>
                                  <div className="text-zinc-200 text-justify flex-1 font-medium leading-relaxed">
                                    {hl.desc}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 深度问答板块 (莫兰迪烟粉底流) */}
                        {result.thinking && result.thinking.length > 0 && (
                          <div className="p-8 morandi-pink-card transition-all duration-300">
                            <div className="flex items-center gap-2 mb-6">
                              <span className="text-[#B48C8E] font-mono text-[10px] font-bold tracking-widest uppercase bg-[#2E2223]/60 px-2 py-0.5 border border-[#4C3B3C]/60">
                                [ 深度问答思考 / INQUIRIES ]
                              </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 font-sans">
                              {result.thinking.map((tk, i) => (
                                <div key={i} className="p-5 bg-black/40 border border-[#262624] flex flex-col justify-between hover:border-zinc-700 transition-all duration-200">
                                  <div className="space-y-4">
                                    <div className="flex items-start gap-2.5">
                                      <span className="text-[#B48C8E] font-mono text-[9px] font-bold border border-[#4C3B3C] px-1.5 py-0.2 shrink-0 bg-black/40">
                                        Q{i + 1}
                                      </span>
                                      <span className="font-bold text-zinc-100 leading-snug">{tk.question}</span>
                                    </div>
                                    <p className="text-zinc-400 text-justify font-medium leading-relaxed">
                                      {tk.answer}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 专业术语板块 (莫兰迪灰蓝底流) */}
                        {result.terms && result.terms.length > 0 && (
                          <div className="p-8 morandi-blue-card transition-all duration-300">
                            <div className="flex items-center gap-2 mb-6">
                              <span className="text-[#89A2B0] font-mono text-[10px] font-bold tracking-widest uppercase bg-[#242E35]/60 px-2 py-0.5 border border-[#3E4E59]/60">
                                [ 学术术语释义 / NOMENCLATURE ]
                              </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-sans">
                              {result.terms.map((term, i) => (
                                <div key={i} className="p-4 border border-[#1C1C1B] bg-black/35 hover:border-zinc-700 transition-all duration-200">
                                  <h4 className="font-mono font-bold text-[#89A2B0] mb-2 flex items-center gap-1.5 uppercase">
                                    <span className="w-1.5 h-1.5 bg-[#89A2B0]"></span>
                                    {term.term}
                                  </h4>
                                  <p className="text-zinc-400 leading-normal text-justify font-medium">{term.definition}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 章节自动区间对齐板块 (莫兰迪灰绿底流) */}
                        {result.chapters && result.chapters.length > 0 && (
                          <div className="p-8 morandi-green-card transition-all duration-300">
                            <div className="flex items-center gap-2 mb-6">
                              <span className="text-[#7E998B] font-mono text-[10px] font-bold tracking-widest uppercase bg-[#232D27]/60 px-2 py-0.5 border border-[#3A4C40]/60">
                                [ 章节剖析大纲 / SECTIONS ]
                              </span>
                            </div>
                            <div className="border border-[#1C1C1B] bg-black/25 divide-y divide-[#1C1C1B] font-sans">
                              {result.chapters.map((ch, i) => {
                                const timeRange = getChapterTimeRange(ch, i, result.chapters);
                                return (
                                  <div key={i} className="p-5 flex flex-col md:flex-row gap-5 hover:bg-white/[0.02] transition-colors duration-150">
                                    <div className="w-32 font-mono font-bold text-[#7E998B] shrink-0 tracking-tight">
                                      [{timeRange}]
                                    </div>
                                    <div className="flex-1 space-y-3">
                                      <div className="flex items-center justify-between gap-4 flex-wrap">
                                        <h4 className="font-mono font-bold text-white uppercase">
                                          {ch.emoji} {ch.title}
                                        </h4>
                                        <button
                                          onClick={() => toggleChapterSubtitles(i)}
                                          className="flex items-center gap-1.5 px-2.5 py-1 text-[9px] font-mono bg-[#0E0E0D] border border-[#262624] hover:border-white text-zinc-300 transition-colors duration-150"
                                        >
                                          {expandedChapters[i] ? '收起关联字幕' : '展开对应原文'}
                                        </button>
                                      </div>
                                      <p className="text-zinc-400 leading-relaxed font-medium text-justify">{ch.desc}</p>
                                      
                                      {expandedChapters[i] && (
                                        <div className="p-4 bg-[#0A0A09] text-zinc-300 border border-[#1C1C1B] rounded-none text-[10px] font-mono leading-relaxed whitespace-pre-wrap max-h-56 overflow-y-auto">
                                          {getChapterSubtitles(timeRange, result.chapters[i + 1]?.time)}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* 核心主旨综述板块 (莫兰迪燕麦暖色底流) */}
                        {result.theme && (
                          <div className="p-8 morandi-oatmeal-card transition-all duration-300">
                            <span className="text-[#AB9D8B] font-mono text-[10px] font-bold tracking-widest uppercase block mb-3 bg-[#2D2A24]/60 px-2 py-0.5 border border-[#454137]/60 w-max">
                              [ 核心主旨探讨 / SYNOPSIS ]
                            </span>
                            <p className="leading-relaxed text-[#ECE3DA] text-justify font-medium">{result.theme}</p>
                          </div>
                        )}

                      </div>

                      {/* 亮点标签区 */}
                      {result.tags && result.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2">
                          {result.tags.map((tag, i) => (
                            <span key={i} className="bg-[#242E35] border border-[#3E4E59] text-[#89A2B0] font-mono text-[9px] px-2.5 py-1 tracking-wider uppercase">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      )}

                    </div>
                  )}

                  {/* TAB 2: A4 Word 高保真排版 */}
                  {activeTab === 'word-preview' && (
                    <div className="mx-auto bg-white border border-zinc-300 shadow-[0_16px_40px_rgba(112,104,90,0.06)] max-w-[812px] p-[1.4in] printable-sheet rounded-none relative" style={{ fontFamily: 'Arial, sans-serif' }}>
                      
                      {/* 页眉 */}
                      <div className="flex items-center justify-between pb-[10px] border-b border-zinc-200 mb-[40px] non-printable">
                        <span style={{ fontSize: '9pt', color: '#9CA3AF' }} className="font-normal text-zinc-500">AI 视频总结</span>
                        <span style={{ fontSize: '9pt', color: '#9CA3AF' }} className="font-normal flex items-center gap-1 text-zinc-500">
                          <HelpCircle size={10} /> Word A4 标准排版视图
                        </span>
                      </div>

                      <div className="hidden print:flex items-center justify-between pb-[10px] border-b border-zinc-200 mb-[40px]">
                        <span style={{ fontSize: '9pt', color: '#9CA3AF' }}>AI 视频总结</span>
                      </div>

                      {/* 标题 */}
                      <div className="mb-[32px]">
                        <h1 style={{ fontSize: '19pt', color: '#1F2937', lineHeight: '1.3' }} className="font-bold mb-[8px]">
                          《{result.title}》
                        </h1>
                        {result.subtitle && (
                          <h2 style={{ fontSize: '14pt', color: '#1F2937' }} className="font-bold mb-[12px]">
                            {result.subtitle}
                          </h2>
                        )}
                        <div style={{ fontSize: '10pt', color: '#6B7280' }} className="flex items-center gap-[8px] flex-wrap font-normal mt-[16px]">
                          <span>UP主：{result.meta?.author || '未知'}</span>
                          <span style={{ color: '#E5E7EB' }}>|</span>
                          <span>时长：{result.meta?.duration || '未知'}</span>
                          <span style={{ color: '#E5E7EB' }}>|</span>
                          <span>日期：{result.meta?.date || '未知'}</span>
                        </div>
                      </div>

                      {/* 摘要 */}
                      <div className="mb-[32px]">
                        <h3 style={{ fontSize: '13pt', color: '#1F2937' }} className="font-bold mt-[480] mb-[200]">摘要</h3>
                        <p style={{ fontSize: '11pt', color: '#1F2937', lineHeight: '1.5' }} className="mb-[160] font-normal text-justify">
                          {result.summary}
                        </p>
                      </div>

                      {/* 亮点 */}
                      {result.highlights && result.highlights.length > 0 && (
                        <div className="mb-[32px]">
                          <h3 style={{ fontSize: '13pt', color: '#1F2937' }} className="font-bold mt-[480] mb-[200]">亮点</h3>
                          <table className="w-full border-collapse" style={{ width: '100%' }}>
                            <tbody>
                              {result.highlights.map((hl, i) => (
                                <tr key={i}>
                                  <td style={{
                                    width: '80px',
                                    backgroundColor: '#DBEAFE',
                                    padding: '8px',
                                    verticalAlign: 'top',
                                    border: '1px solid #E5E7EB'
                                  }} className="text-center">
                                    <span style={{ fontSize: '10pt', color: '#3B82F6' }} className="font-bold">
                                      [{hl.time}]
                                    </span>
                                  </td>
                                  <td style={{
                                    backgroundColor: i % 2 === 1 ? '#FAFBFC' : '#FFFFFF',
                                    padding: '12px',
                                    border: '1px solid #E5E7EB',
                                    verticalAlign: 'top'
                                  }}>
                                    <p style={{ fontSize: '11pt', color: '#1F2937', lineHeight: '1.5' }} className="font-normal text-justify">
                                      {hl.desc}
                                    </p>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>

                          {result.tags && result.tags.length > 0 && (
                            <div className="mt-[240] mb-[320]">
                              <p style={{ fontSize: '10pt', color: '#9CA3AF', lineHeight: '1.5' }} className="font-normal">
                                {result.tags.map(t => `#${t}`).join(' \u2003 ')}
                              </p>
                            </div>
                          )}
                        </div>
                      )}

                      {/* 思考 */}
                      {result.thinking && result.thinking.length > 0 && (
                        <div className="mb-[32px]">
                          <div className="h-0 border-b border-[#E5E7EB] my-[320] mb-[24px]"></div>
                          <h3 style={{ fontSize: '13pt', color: '#1F2937' }} className="font-bold mt-[480] mb-[200]">思考</h3>
                          <div className="space-y-[16px]">
                            {result.thinking.map((tk, i) => (
                              <div key={i} className="mb-[160]">
                                <p style={{ fontSize: '11pt', color: '#1F2937', lineHeight: '1.5' }} className="font-bold mb-[60]">
                                  <span style={{ color: '#3B82F6' }} className="mr-1">{i + 1}.</span> {tk.question}
                                </p>
                                <p style={{ fontSize: '11pt', color: '#1F2937', lineHeight: '1.5', paddingLeft: '24px' }} className="font-normal text-justify">
                                  {tk.answer}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 术语模块 */}
                      {result.terms && result.terms.length > 0 && (
                        <div className="mb-[32px]">
                          <div className="h-0 border-b border-[#E5E7EB] my-[320] mb-[24px]"></div>
                          <h3 style={{ fontSize: '13pt', color: '#1F2937' }} className="font-bold mt-[480] mb-[200]">术语解释</h3>
                          <div className="space-y-[80]">
                            {result.terms.map((term, i) => (
                              <div key={i} className="flex items-start gap-2 mb-[80]">
                                <span style={{ fontSize: '11pt', color: '#1F2937' }}>•</span>
                                <p style={{ fontSize: '11pt', color: '#1F2937', lineHeight: '1.5' }}>
                                  <strong className="font-bold">{term.term}：</strong>
                                  <span className="font-normal text-justify">{term.definition}</span>
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 章节归纳 */}
                      {result.chapters && result.chapters.length > 0 && (
                        <div className="mb-[32px]">
                          <div className="h-0 border-b border-[#E5E7EB] my-[320] mb-[24px]"></div>
                          <h3 style={{ fontSize: '13pt', color: '#1F2937' }} className="font-bold mt-[480] mb-[200]">视频章节总结</h3>
                          <p style={{ fontSize: '11pt', color: '#1F2937', lineHeight: '1.5' }} className="mb-[160] font-normal text-justify">
                            以下是章节维度的深度归集梳理：
                          </p>
                          <div className="space-y-[24px] mt-[160]">
                            {result.chapters.map((ch, i) => {
                              const timeRange = getChapterTimeRange(ch, i, result.chapters);
                              return (
                                <div key={i} style={{ borderLeft: '4px solid #3B82F6', paddingLeft: '12px' }} className="mb-[160]">
                                  <div className="flex items-center justify-between gap-4 mb-[100] flex-wrap">
                                    <p style={{ fontSize: '11pt', color: '#1F2937', margin: 0 }} className="font-bold">
                                      <span style={{ color: '#3B82F6' }}>[{timeRange}]</span> &nbsp;
                                      <span>{ch.emoji} {ch.title}</span>
                                    </p>
                                    <button
                                      onClick={() => toggleChapterSubtitles(i)}
                                      className="non-printable font-medium hover:bg-gray-200 transition-colors cursor-pointer"
                                      style={{
                                        fontSize: '9.5pt',
                                        backgroundColor: '#F3F4F6',
                                        color: '#4B5563',
                                        padding: '2px 8px',
                                        borderRadius: '4px',
                                        border: '1px solid #D1D5DB'
                                      }}
                                    >
                                      {expandedChapters[i] ? '收起字幕' : '查看原文'}
                                    </button>
                                  </div>
                                  <p style={{ fontSize: '11pt', color: '#1F2937', lineHeight: '1.5' }} className="font-normal text-justify pl-1">
                                    {ch.desc}
                                  </p>

                                  {expandedChapters[i] && (
                                    <div className="mb-[100] non-printable" style={{
                                      marginTop: '8px',
                                      padding: '12px',
                                      backgroundColor: '#FAFBFC',
                                      border: '1px solid #E5E7EB',
                                      borderRadius: '4px',
                                      fontSize: '9.5pt',
                                      color: '#6B7280',
                                      fontFamily: 'monospace',
                                      whiteSpace: 'pre-wrap',
                                      maxHeight: '200px',
                                      overflowY: 'auto'
                                    }}>
                                      {getChapterSubtitles(timeRange, result.chapters[i + 1]?.time)}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* 全局定位 */}
                      {result.theme && (
                        <div className="mb-[32px]">
                          <div className="h-0 border-b border-[#E5E7EB] my-[320] mb-[24px]"></div>
                          <h3 style={{ fontSize: '13pt', color: '#1F2937' }} className="font-bold mt-[480] mb-[200]">视频主题</h3>
                          <p style={{ fontSize: '11pt', color: '#1F2937', lineHeight: '1.5' }} className="font-normal text-justify">
                            《{result.title}》 —— {result.theme}
                          </p>
                        </div>
                      )}

                    </div>
                  )}
                </>
              )}

              {/* TAB 3: 原文细读面板 */}
              {activeTab === 'transcript' && fileContent && (
                <div className="space-y-6" style={{ fontSize: `${fontSize}px` }}>
                  {/* 控制面板 */}
                  <div className="bg-[#141413] border border-[#262624] p-5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h3 className="text-xs font-mono font-bold tracking-widest text-zinc-300 uppercase">[ 字幕原文精细细读 ]</h3>
                        <p className="text-[10px] font-mono text-zinc-500 mt-1">
                          {parsedCues.length > 0 
                            ? `系统检测并提取出 ${parsedCues.length} 条时间轴片段。` 
                            : `系统检测到纯文本。共计 ${fileContent.length.toLocaleString()} 个字符。`}
                        </p>
                      </div>
                      
                      {/* 字幕检索 */}
                      {parsedCues.length > 0 && (
                        <div className="relative max-w-xs w-full shrink-0">
                          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                            <Search size={12} />
                          </span>
                          <input 
                            type="text" 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="检索原文关键词..."
                            className="w-full pl-8 pr-3 py-1.5 bg-[#0E0E0D] border border-[#262624] rounded-none text-xs font-mono text-zinc-200 focus:outline-none focus:border-zinc-500 transition-colors"
                          />
                          {searchQuery && (
                            <button 
                              onClick={() => setSearchQuery('')}
                              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-zinc-500 hover:text-white"
                            >
                              <X size={12} />
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 字幕表 */}
                  {parsedCues.length > 0 ? (
                    <div className="bg-[#0E0E0D] border border-[#1C1C1B] overflow-hidden">
                      <div className="divide-y divide-[#1C1C1B] max-h-[70vh] overflow-y-auto">
                        {filteredCues.length === 0 ? (
                          <div className="p-12 text-center text-zinc-500 text-xs font-mono">
                            未匹配到与 “{searchQuery}” 相关的字幕行。
                          </div>
                        ) : (
                          filteredCues.map((cue, idx) => (
                            <div key={idx} className="p-4 flex items-start gap-4 hover:bg-[#141413] transition-colors">
                              <span className="bg-black text-zinc-400 font-mono text-[9px] font-bold px-2.5 py-0.5 rounded-none shrink-0 w-[64px] text-center mt-0.5 border border-[#262624]">
                                {formatSeconds(cue.start)}
                              </span>
                              <div className="flex-1 text-xs text-zinc-300 leading-relaxed text-justify font-medium pt-0.5">
                                {cue.text}
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  ) : (
                    /* 降级无时间轨文本 */
                    <div className="bg-[#141413] border border-[#262624] p-8 text-xs text-zinc-300 leading-relaxed text-justify font-medium max-h-[75vh] overflow-y-auto font-mono font-semibold">
                      {fileContent}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: 独立智能思维导图视图 */}
              {activeTab === 'mindmap' && fileContent && (
                <div className="space-y-6">
                  
                  {/* 控制面板 */}
                  <div className="bg-[#141413] border border-[#262624] p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h3 className="text-xs font-mono font-bold tracking-widest text-zinc-300 uppercase">[ 智能结构化思维导图 ]</h3>
                      <p className="text-[10px] font-mono text-zinc-500 mt-1">
                        一键构建拓扑导图。支持鼠标【拖拽平移】、【滚轮/按钮缩放】。
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      {/* 如果已经生成，显示丰富导出选项 */}
                      {mindmapResult && (
                        <div className="flex items-center gap-2">
                          
                          {/* 物理形变操控器 */}
                          <div className="flex items-center gap-1 border border-[#262624] bg-[#0E0E0D] px-1.5 py-1 rounded-sm text-zinc-400 mr-2">
                            <button 
                              onClick={() => setScale(prev => Math.max(0.4, prev - 0.1))}
                              className="p-1 hover:text-white transition-colors"
                              title="缩小脑图"
                            >
                              <Minus size={11} />
                            </button>
                            <button 
                              onClick={() => setScale(prev => Math.min(2.5, prev + 0.1))}
                              className="p-1 hover:text-white transition-colors"
                              title="放大脑图"
                            >
                              <Plus size={11} />
                            </button>
                            <button 
                              onClick={resetCanvasView}
                              className="p-1 hover:text-white transition-colors border-l border-[#262624] pl-1.5 ml-1"
                              title="重置脑图视角"
                            >
                              <RefreshCw size={11} />
                            </button>
                          </div>

                          <button
                            onClick={exportMindmapAsMarkdown}
                            className="flex items-center gap-1.5 px-3 py-2 bg-[#1C1C1B] border border-[#262624] hover:border-zinc-500 text-zinc-300 rounded-sm text-[10px] font-mono font-bold tracking-wider uppercase transition-colors"
                            title="导出为 Markdown 大纲，可直接载入主流思维导图软件（XMind、GitMind）"
                          >
                            <Download size={11} />
                            导出 Markdown 大纲
                          </button>
                          
                          <button
                            onClick={exportMindmapAsJSON}
                            className="flex items-center gap-1.5 px-3 py-2 bg-[#1C1C1B] border border-[#262624] hover:border-zinc-500 text-zinc-300 rounded-sm text-[10px] font-mono font-bold tracking-wider uppercase transition-colors"
                            title="导出原始 JSON 结构数据"
                          >
                            <Download size={11} />
                            导出 JSON
                          </button>

                          <button
                            onClick={exportMindmapAsPNG}
                            disabled={isExportingPng}
                            className="flex items-center gap-1.5 px-3 py-2 bg-[#1C1C1B] border border-[#262624] hover:border-zinc-500 text-zinc-300 rounded-sm text-[10px] font-mono font-bold tracking-wider uppercase transition-colors"
                            title="下载为高画质 PNG 拓扑图"
                          >
                            {isExportingPng ? (
                              <><div className="w-2.5 h-2.5 border border-zinc-500 border-t-white rounded-full animate-spin" />图片渲染中...</>
                            ) : (
                              <><Download size={11} />下载脑图 PNG</>
                            )}
                          </button>
                        </div>
                      )}

                      <button
                        onClick={generateMindmap}
                        disabled={isMindmapLoading}
                        className={`flex items-center gap-1.5 px-4 py-2 bg-white text-black hover:bg-zinc-200 rounded-sm text-[10px] font-mono font-bold tracking-widest uppercase transition-colors shrink-0
                          ${isMindmapLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {isMindmapLoading ? (
                          <>
                            <div className="w-3 h-3 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                            正在分析重构...
                          </>
                        ) : (
                          <>
                            <GitFork size={12} />
                            {mindmapResult ? '重新生成' : '开始构建'}
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* 导图拓扑渲染板 - 支持拖拽Pan and 滚轮Zoom */}
                  {!mindmapResult ? (
                    <div className="border border-[#1C1C1B] bg-[#0A0A09]/40 p-12 text-center rounded-sm">
                      <GitFork size={32} className="text-zinc-600 mx-auto mb-3 animate-pulse" />
                      <p className="text-xs font-mono text-zinc-400">思维导图尚未生成</p>
                      <p className="text-[9px] font-mono text-zinc-600 mt-1">请点击右上方按钮开始调用大语言模型进行高维度拓扑总结。</p>
                    </div>
                  ) : (
                    <div 
                      onMouseDown={handleCanvasMouseDown}
                      onMouseMove={handleCanvasMouseMove}
                      onMouseUp={handleCanvasMouseUp}
                      onMouseLeave={handleCanvasMouseUp}
                      onWheel={handleCanvasWheel}
                      className="border border-[#1C1C1B] bg-[#0E0E0D] bg-[radial-gradient(#1C1C1B_1px,transparent_1px)] [background-size:16px_16px] h-[70vh] w-full overflow-hidden rounded-sm relative cursor-grab active:cursor-grabbing select-none"
                    >
                      {/* 无限画布物理变换容器 */}
                      <div 
                        id="mindmap-capture-area"
                        style={{
                          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${scale})`,
                          transformOrigin: 'center center',
                          transition: isPanning ? 'none' : 'transform 0.15s ease-out'
                        }}
                        className="p-16 space-y-8 min-w-max flex items-start gap-12 bg-transparent"
                      >
                        
                        {/* 根节点 - 核心大主题 (莫兰迪灰绿) */}
                        <div className="w-48 shrink-0">
                          <div className="bg-[#232D27] border border-[#3A4C40] p-4 text-center rounded-sm relative">
                            <span className="text-[8px] font-mono text-[#8CB0A1] tracking-wider block mb-1">[ 核心主题 ]</span>
                            <h4 className="text-xs font-bold text-white leading-normal">{mindmapResult.topic}</h4>
                            <div className="absolute top-1/2 -right-6 w-6 h-px bg-[#262624]" />
                          </div>
                        </div>

                        {/* 一级、二级分支节点容器 */}
                        <div className="flex-1 space-y-6 relative before:absolute before:-left-6 before:top-4 before:bottom-4 before:w-px before:bg-[#262624]">
                          {mindmapResult.branches?.map((branch, bIdx) => {
                            const isCollapsed = collapsedBranches[bIdx];
                            return (
                              <div key={bIdx} className="flex items-start gap-8 relative">
                                
                                {/* 一级分支连接横线 */}
                                <div className="absolute top-6 -left-6 w-6 h-px bg-[#262624]" />

                                {/* 一级分支卡片 (莫兰迪灰蓝) - 点击可动态折叠收起 */}
                                <div 
                                  onClick={() => toggleBranchFold(bIdx)}
                                  className="w-52 shrink-0 bg-[#242E35]/40 border border-[#3E4E59] p-4 rounded-sm relative cursor-pointer hover:border-[#89A2B0] transition-colors"
                                  title="点击折叠/展开子叶子节点要点"
                                >
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-[8px] font-mono text-[#89A2B0] tracking-wider">[ 核心模块 {bIdx + 1} ]</span>
                                    <span className="text-[9px] font-mono text-zinc-500">{isCollapsed ? '[+] 已折叠' : '[-]'}</span>
                                  </div>
                                  <h5 className="text-xs font-bold text-zinc-100 leading-snug">{branch.label}</h5>
                                  {!isCollapsed && branch.details && branch.details.length > 0 && (
                                    <div className="absolute top-1/2 -right-8 w-8 h-px bg-[#262624]" />
                                  )}
                                </div>

                                {/* 二级细节叶子节点列表 (莫兰迪烟粉) */}
                                {!isCollapsed && (
                                  <div className="flex-1 space-y-3 relative before:absolute before:-left-8 before:top-4 before:bottom-4 before:w-px before:bg-[#262624]">
                                    {branch.details?.map((detail, dIdx) => (
                                      <div key={dIdx} className="flex items-center gap-4 relative">
                                        <div className="absolute top-1/2 -left-8 w-8 h-px bg-[#262624]" />
                                        
                                        <div className="bg-[#2E2223]/30 border border-[#4C3B3C] px-3.5 py-2.5 rounded-sm flex-1 text-xs text-[#FAF0EF] leading-relaxed text-justify font-medium pl-4">
                                          <span className="text-[#C4A3A5] font-mono text-[9px] mr-2">•</span>
                                          {detail}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}

                              </div>
                            );
                          })}
                        </div>

                      </div>

                    </div>
                  )}

                </div>
              )}

            </div>
          )}
        </div>
      </div>

      {/* 极简高对比度接口配置 (重构版 - 双栏扁平化网格系统) */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-[#000000]/70 backdrop-blur-[4px] z-50 flex items-center justify-center p-4 non-printable transition-all">
          <div className="bg-[#0E0E0D] rounded-none w-full max-w-4xl shadow-none flex flex-col border border-zinc-800 max-h-[90vh]">
            
            {/* 头部标题栏 */}
            <div className="px-6 h-14 border-b border-zinc-800 flex items-center justify-between bg-[#0A0A09]/90 shrink-0">
              <h2 className="text-[10px] font-mono font-bold text-zinc-300 tracking-widest uppercase flex items-center gap-2">
                <Settings size={14} className="text-[#8CB0A1]" />
                [ 接口与文本分析配置控制台 ]
              </h2>
              <button 
                onClick={() => setIsSettingsOpen(false)} 
                className="text-zinc-500 hover:text-white transition-colors p-1"
              >
                <X size={16} />
              </button>
            </div>
            
            {/* 核心双栏配置主体 */}
            <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-zinc-800">
              
              {/* 左侧分栏: API 与连接端参数 */}
              <div className="p-6 space-y-5 flex flex-col justify-start">
                <div className="pb-2 border-b border-zinc-900">
                  <span className="text-[9px] font-mono text-zinc-500 tracking-wider uppercase block">[ CONNECTIVITY / 物理连接参数 ]</span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-widest">[ API 接口代理地址 ]</label>
                  <input 
                    type="text" 
                    value={apiUrl}
                    onChange={(e) => setApiUrl(e.target.value)}
                    className="w-full px-3 py-2 bg-[#141413] border border-zinc-800 rounded-none text-xs font-mono text-zinc-100 focus:outline-none focus:border-zinc-500 transition-colors"
                  />
                  <span className="text-[8px] font-mono text-zinc-600 block">兼容 OpenAI 规范的端点路由 (必须支持 CORS 跨域请求)</span>
                </div>
                
                <div className="space-y-1.5">
                  <label className="block text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-widest">[ 账户密钥 API Key ]</label>
                  <input 
                    type="password" 
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full px-3 py-2 bg-[#141413] border border-zinc-800 rounded-none text-xs font-mono text-zinc-100 focus:outline-none focus:border-zinc-500 transition-colors"
                    placeholder="sk-........................................"
                  />
                  <span className="text-[8px] font-mono text-zinc-600 block">密钥将以加密会话形式临时驻留在你本机的 LocalStorage</span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-widest">[ 推理模型 Model ]</label>
                  <input 
                    type="text" 
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full px-3 py-2 bg-[#141413] border border-zinc-800 rounded-none text-xs font-mono text-zinc-100 focus:outline-none focus:border-zinc-500 transition-colors"
                  />
                  <span className="text-[8px] font-mono text-zinc-600 block">建议使用具备 high-level JSON 遵循能力的多模态模型</span>
                </div>
              </div>

              {/* 右侧分栏: 词库过滤与 LLM 提示词 */}
              <div className="p-6 space-y-5 flex flex-col justify-start bg-[#0A0A09]/20">
                <div className="pb-2 border-b border-zinc-900">
                  <span className="text-[9px] font-mono text-zinc-500 tracking-wider uppercase block">[ ENGINE STRATEGY / 过滤与生成机制 ]</span>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-widest">[ 净化词库设置 (逗号分隔) ]</label>
                  <input 
                    type="text" 
                    value={fillerWords}
                    onChange={(e) => setFillerWords(e.target.value)}
                    className="w-full px-3 py-2 bg-[#141413] border border-zinc-800 rounded-none text-xs font-mono text-zinc-100 focus:outline-none focus:border-zinc-500 transition-colors"
                    placeholder="然后,就是,这个,那个"
                  />
                  <span className="text-[8px] font-mono text-zinc-600 block">开启主面板「净化语气词」时，文本对齐引擎将动态剪除此列表内的敏感口癖</span>
                </div>

                <div className="space-y-1.5 flex-1 flex flex-col">
                  <label className="block text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-widest">[ 系统提示词 System Prompt ]</label>
                  <textarea 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="w-full flex-1 px-3 py-2 bg-[#141413] border border-zinc-800 rounded-none text-[10px] font-mono text-zinc-300 focus:outline-none focus:border-zinc-500 resize-none leading-relaxed min-h-[140px]"
                  />
                  <span className="text-[8px] font-mono text-zinc-600 block">核心 JSON Scheme 的严格约束提示，请勿破坏原有的输出结构描述</span>
                </div>
              </div>

            </div>

            {/* 底部确认操作栏 */}
            <div className="px-6 h-14 border-t border-zinc-800 bg-[#141413] flex justify-end items-center gap-3 shrink-0">
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="px-4 h-8 border border-zinc-800 text-zinc-400 hover:text-white text-[10px] font-mono font-bold tracking-widest uppercase transition-colors"
              >
                取消
              </button>
              <button 
                onClick={saveSettings}
                className="px-6 h-8 bg-white hover:bg-zinc-200 text-black text-[10px] font-mono font-bold tracking-widest uppercase transition-colors"
              >
                保存当前配置
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
