import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  RotateCcw,
  Copy,
  Check,
  Shield,
  Key,
  Code2,
  Terminal,
  FileCode,
  Sparkles,
  Layers,
  HelpCircle,
  Eye,
  Maximize2,
  Minimize2,
} from 'lucide-react';

type ToolTab = 'html' | 'python' | 'encrypt';

const DEFAULT_HTML_CODE = `<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: system-ui, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 85vh;
      margin: 0;
      background: linear-gradient(135deg, #0b1020, #141b36);
      color: #e8ecfa;
    }
    .card {
      background: rgba(255, 255, 255, 0.06);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 18px;
      padding: 30px;
      text-align: center;
      box-shadow: 0 20px 40px rgba(0,0,0,0.5);
      backdrop-filter: blur(10px);
      max-width: 320px;
    }
    h2 { color: #5ec8ff; margin-bottom: 8px; }
    p { color: #8b94b5; font-size: 0.95rem; }
    button {
      background: linear-gradient(135deg, #5ec8ff, #7b6dff);
      color: #05080f;
      border: none;
      padding: 10px 22px;
      border-radius: 10px;
      font-weight: 700;
      cursor: pointer;
      margin-top: 14px;
      transition: transform 0.2s;
    }
    button:hover { transform: scale(1.05); }
  </style>
</head>
<body>
  <div class="card">
    <h2>سڵاو لە Ayoubi!</h2>
    <p>ئەمە ڕەنکەری ڕاستەوخۆی HTML و CSS و JavaScript ـە.</p>
    <button onclick="testClick()">کلیک لێرە بکە</button>
  </div>

  <script>
    function testClick() {
      alert("دەستخۆش! کۆدەکەت بە سەرکەوتوویی لە براوسەردا کاری کرد ✨");
      console.log("دوگمەکە لە لایەن بەکارهێنەرەوە داگیرا.");
    }
  </script>
</body>
</html>`;

const DEFAULT_PYTHON_CODE = `# تاقیکردنەوەی خێرای کۆدی پایتۆن لە وێبگەڕەکەتدا
def calculate_growth(initial, rate, years):
    print("--- ژمێریاری گەشەی بیزنس لەگەڵ Ayoubi ---")
    total = initial
    for yr in range(1, years + 1):
        profit = round(total * rate, 2)
        total = round(total + profit, 2)
        print("ساڵی " + str(yr) + ": قازانج = " + str(profit) + "$ | کۆی گشتی = " + str(total) + "$")
    return total

print("دەستپێکردنی بەرنامەی پایتۆن...")
final_sum = calculate_growth(1500, 0.20, 5)
print("ئەنجامی کۆتایی: " + str(final_sum) + " USD")
`;

interface ProgrammingToolsProps {
  initialTab?: ToolTab;
}

export const ProgrammingTools: React.FC<ProgrammingToolsProps> = ({ initialTab = 'html' }) => {
  const [activeTab, setActiveTab] = useState<ToolTab>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // HTML State
  const [htmlCode, setHtmlCode] = useState(DEFAULT_HTML_CODE);
  const [htmlSrcDoc, setHtmlSrcDoc] = useState(DEFAULT_HTML_CODE);
  const [htmlConsole, setHtmlConsole] = useState<string[]>([]);
  const [isHtmlFullscreen, setIsHtmlFullscreen] = useState(false);

  // Python State
  const [pythonCode, setPythonCode] = useState(DEFAULT_PYTHON_CODE);
  const [pythonOutput, setPythonOutput] = useState<string>('');
  const [isPythonRunning, setIsPythonRunning] = useState(false);

  // Encryption State
  const [encryptLang, setEncryptLang] = useState<'js' | 'python' | 'html' | 'php' | 'generic'>('js');
  const [encryptMode, setEncryptMode] = useState<'xor' | 'base64' | 'hex' | 'packed'>('xor');
  const [secretKey, setSecretKey] = useState('ayoubi-secret-2026');
  const [sourceCode, setSourceCode] = useState(`console.log("پارێزراوە لە لایەن ئەیوبی!");`);
  const [encryptedOutput, setEncryptedOutput] = useState('');
  const [copied, setCopied] = useState(false);

  // HTML Runner Execution
  const runHtml = () => {
    setHtmlConsole([]);
    // Inject custom console interceptor into iframe doc
    const interceptor = `
      <script>
        (function() {
          var oldLog = console.log;
          console.log = function(...args) {
            window.parent.postMessage({ type: 'HTML_CONSOLE', text: args.join(' ') }, '*');
            oldLog.apply(console, args);
          };
        })();
      </script>
    `;
    const docWithConsole = htmlCode.includes('<head>')
      ? htmlCode.replace('<head>', `<head>${interceptor}`)
      : `${interceptor}${htmlCode}`;

    setHtmlSrcDoc(docWithConsole);
  };

  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === 'HTML_CONSOLE') {
        setHtmlConsole((prev) => [...prev, String(e.data.text)]);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Python Execution Simulation Engine (Runs pure Python logic client-side in browser)
  const runPython = async () => {
    setIsPythonRunning(true);
    setPythonOutput('لە کارکردندایە...\n');

    await new Promise((r) => setTimeout(r, 250));

    const logs: string[] = [];
    const print = (...args: unknown[]) => {
      logs.push(args.map((a) => (typeof a === 'object' ? JSON.stringify(a) : String(a))).join(' '));
    };

    try {
      // Lightweight client-side Python execution environment
      const lines = pythonCode.split('\n');
      let outputBuffer = '';

      // Simple Python function & print evaluator
      const pythonGlobals: Record<string, unknown> = {
        print: (...args: unknown[]) => {
          outputBuffer += args.join(' ') + '\n';
        },
        range: (start: number, end?: number, step = 1) => {
          const res: number[] = [];
          const s = end === undefined ? 0 : start;
          const e = end === undefined ? start : end;
          for (let i = s; i < e; i += step) res.push(i);
          return res;
        },
        len: (item: unknown[]) => (item && item.length) || 0,
        int: (val: unknown) => parseInt(String(val), 10),
        float: (val: unknown) => parseFloat(String(val)),
        str: (val: unknown) => String(val),
        round: (val: number, dec = 0) => Number(val.toFixed(dec)),
      };

      // Transform common python constructs to JS for immediate, zero-lag browser execution
      let jsCode = pythonCode
        // Replace def func(args): with function func(args) {
        .replace(/def\s+([a-zA-Z_]\w*)\s*\((.*?)\):/g, 'function $1($2) {')
        // Replace for item in range(a, b):
        .replace(/for\s+([a-zA-Z_]\w*)\s+in\s+range\((.*?)\):/g, 'for (let $1 of range($2)) {')
        // Replace for item in list:
        .replace(/for\s+([a-zA-Z_]\w*)\s+in\s+([a-zA-Z_]\w*):/g, 'for (let $1 of $2) {')
        // Replace if cond:
        .replace(/if\s+(.*?):/g, 'if ($1) {')
        .replace(/elif\s+(.*?):/g, '} else if ($1) {')
        .replace(/else:/g, '} else {')
        // Replace print(...) with print(...)
        .replace(/print\s*\((.*?)\)/g, 'print($1)')
        // Python f-strings f"..." to template literals `...`
        .replace(/f"([^"]*)"/g, (m, str) => {
          const templated = str.replace(/{([^}]+)}/g, '${$1}');
          return '`' + templated + '`';
        })
        .replace(/f'([^']*)'/g, (m, str) => {
          const templated = str.replace(/{([^}]+)}/g, '${$1}');
          return '`' + templated + '`';
        });

      // Add closing braces based on indentation estimation or simple wrapper
      const blockCount = (jsCode.match(/{/g) || []).length;
      const closeCount = (jsCode.match(/}/g) || []).length;
      if (blockCount > closeCount) {
        jsCode += '\n' + '}'.repeat(blockCount - closeCount);
      }

      // Execute safely
      const executor = new Function(
        'print',
        'range',
        'len',
        'int',
        'float',
        'str',
        'round',
        `"use strict";\ntry {\n${jsCode}\n} catch(err) { print("[هەڵەی پایتۆن]: " + err.message); }`
      );

      executor(
        pythonGlobals.print,
        pythonGlobals.range,
        pythonGlobals.len,
        pythonGlobals.int,
        pythonGlobals.float,
        pythonGlobals.str,
        pythonGlobals.round
      );

      setPythonOutput(outputBuffer || 'کۆدەکە بە سەرکەوتوویی تەواو بوو بێ دەرئەنجامی print.');
    } catch (err: unknown) {
      setPythonOutput(`[هەڵەی شیکردنەوەی پایتۆن]: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsPythonRunning(false);
    }
  };

  // Code Encryption Engine for all languages
  const handleEncrypt = () => {
    if (!sourceCode.trim()) {
      setEncryptedOutput('// تکایە کۆدێک بنووسە بۆ ئینکریپتکردن');
      return;
    }

    const key = secretKey || 'ayoubi_key';

    if (encryptMode === 'xor') {
      // XOR Cipher with key
      const xorBytes: number[] = [];
      for (let i = 0; i < sourceCode.length; i++) {
        const codeChar = sourceCode.charCodeAt(i);
        const keyChar = key.charCodeAt(i % key.length);
        xorBytes.push(codeChar ^ keyChar);
      }
      const hexString = xorBytes.map((b) => b.toString(16).padStart(2, '0')).join('');

      if (encryptLang === 'js' || encryptLang === 'html') {
        setEncryptedOutput(`// Protected with Ayoubi XOR Encryption
(function(){
  const _h = "${hexString}";
  const _k = "${key}";
  let _s = "";
  for (let i = 0; i < _h.length; i += 2) {
    const b = parseInt(_h.substr(i, 2), 16);
    _s += String.fromCharCode(b ^ _k.charCodeAt((i / 2) % _k.length));
  }
  new Function(_s)();
})();`);
      } else if (encryptLang === 'python') {
        setEncryptedOutput(`# Protected with Ayoubi Python XOR Encryption
_h = "${hexString}"
_k = "${key}"
_b = bytes.fromhex(_h)
_s = "".join([chr(b ^ ord(_k[i % len(_k)])) for i, b in enumerate(_b)])
exec(_s)`);
      } else if (encryptLang === 'php') {
        setEncryptedOutput(`<?php
// Protected with Ayoubi PHP XOR Encryption
$_h = "${hexString}";
$_k = "${key}";
$_b = hex2bin($_h);
$_s = "";
for ($i = 0; $i < strlen($_b); $i++) {
  $_s .= chr(ord($_b[$i]) ^ ord($_k[$i % strlen($_k)]));
}
eval($_s);
?>`);
      } else {
        // Generic C/C++/C# byte array
        const cArray = xorBytes.map((b) => `0x${b.toString(16).padStart(2, '0')}`).join(', ');
        setEncryptedOutput(`// Protected C/C++/C# Byte Array
const unsigned char encrypted_payload[] = { ${cArray} };
const char key[] = "${key}";
// Length: ${xorBytes.length} bytes
// Decrypt logic: payload[i] ^ key[i % sizeof(key)]`);
      }
    } else if (encryptMode === 'base64') {
      // Base64 + Encoding
      const b64 = btoa(unescape(encodeURIComponent(sourceCode)));

      if (encryptLang === 'js' || encryptLang === 'html') {
        setEncryptedOutput(`// Protected with Ayoubi Base64 Wrapper
(function(){
  const _d = "${b64}";
  eval(decodeURIComponent(escape(atob(_d))));
})();`);
      } else if (encryptLang === 'python') {
        setEncryptedOutput(`# Protected with Ayoubi Base64 Python Runner
import base64
_d = "${b64}"
exec(base64.b64decode(_d).decode('utf-8'))`);
      } else if (encryptLang === 'php') {
        setEncryptedOutput(`<?php
// Protected with Ayoubi PHP Base64 Runner
eval(base64_decode("${b64}"));
?>`);
      } else {
        setEncryptedOutput(`// Base64 Payload
const char* b64_payload = "${b64}";`);
      }
    } else if (encryptMode === 'hex') {
      // Hex Escape Sequence
      let hexEscaped = '';
      for (let i = 0; i < sourceCode.length; i++) {
        const hex = sourceCode.charCodeAt(i).toString(16).padStart(2, '0');
        hexEscaped += `\\x${hex}`;
      }

      if (encryptLang === 'js' || encryptLang === 'html') {
        setEncryptedOutput(`// Protected with Ayoubi Hex Obfuscator
eval("${hexEscaped}");`);
      } else if (encryptLang === 'python') {
        setEncryptedOutput(`# Protected with Ayoubi Python Hex Runner
exec(b"${hexEscaped}".decode('unicode_escape'))`);
      } else {
        setEncryptedOutput(`"${hexEscaped}"`);
      }
    } else {
      // Packed / Multi-layer Armor
      const b64 = btoa(unescape(encodeURIComponent(sourceCode)));
      const reversed = b64.split('').reverse().join('');

      if (encryptLang === 'js' || encryptLang === 'html') {
        setEncryptedOutput(`// Protected with Ayoubi Multi-layer Armor
(function(_0x1a){
  const _0x2b = _0x1a.split('').reverse().join('');
  const _0x3c = decodeURIComponent(escape(atob(_0x2b)));
  (new Function(_0x3c))();
})("${reversed}");`);
      } else if (encryptLang === 'python') {
        setEncryptedOutput(`# Protected with Ayoubi Multi-layer Python Armor
import base64
_0x1a = "${reversed}"
exec(base64.b64decode(_0x1a[::-1]).decode('utf-8'))`);
      } else if (encryptLang === 'php') {
        setEncryptedOutput(`<?php
$_0x1a = "${reversed}";
eval(base64_decode(strrev($_0x1a)));
?>`);
      } else {
        setEncryptedOutput(`// Multi-layer Obfuscated String
"${reversed}"`);
      }
    }
  };

  const handleCopy = () => {
    if (!encryptedOutput) return;
    navigator.clipboard.writeText(encryptedOutput);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ marginTop: '30px' }}>
      {/* Header and Sub-tabs */}
      <div className="glass" style={{ padding: '20px', borderRadius: '16px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '14px' }}>
          <div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Code2 size={22} style={{ color: 'var(--ice)' }} />
              ئامرازە پێشکەوتووەکانی بەرنامەسازی
            </h3>
            <p style={{ color: 'var(--muted)', fontSize: '0.86rem', margin: '4px 0 0' }}>
              ڕەنکردنی ڕاستەوخۆی HTML و Python لەگەڵ ستۆدیۆی ئینکریپتکردن و پاراستنی کۆدەکان.
            </p>
          </div>

          {/* Subtabs Buttons */}
          <div style={{ display: 'flex', gap: '6px', background: 'rgba(255, 255, 255, 0.05)', padding: '4px', borderRadius: '12px' }}>
            <button
              type="button"
              onClick={() => setActiveTab('html')}
              style={{
                background: activeTab === 'html' ? 'linear-gradient(135deg, var(--ice), var(--vio))' : 'transparent',
                color: activeTab === 'html' ? '#05080f' : 'var(--text)',
                border: 'none',
                padding: '8px 14px',
                borderRadius: '8px',
                fontWeight: activeTab === 'html' ? 700 : 500,
                fontSize: '0.84rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontFamily: 'inherit',
              }}
            >
              <FileCode size={15} />
              <span>ڕەنکردنی HTML</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('python')}
              style={{
                background: activeTab === 'python' ? 'linear-gradient(135deg, var(--ice), var(--vio))' : 'transparent',
                color: activeTab === 'python' ? '#05080f' : 'var(--text)',
                border: 'none',
                padding: '8px 14px',
                borderRadius: '8px',
                fontWeight: activeTab === 'python' ? 700 : 500,
                fontSize: '0.84rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontFamily: 'inherit',
              }}
            >
              <Terminal size={15} />
              <span>ڕەنکردنی پایتۆن</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setActiveTab('encrypt');
                handleEncrypt();
              }}
              style={{
                background: activeTab === 'encrypt' ? 'linear-gradient(135deg, var(--ice), var(--vio))' : 'transparent',
                color: activeTab === 'encrypt' ? '#05080f' : 'var(--text)',
                border: 'none',
                padding: '8px 14px',
                borderRadius: '8px',
                fontWeight: activeTab === 'encrypt' ? 700 : 500,
                fontSize: '0.84rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontFamily: 'inherit',
              }}
            >
              <Shield size={15} />
              <span>ئینکریپتکردنی کۆد</span>
            </button>
          </div>
        </div>
      </div>

      {/* HTML RUNNER TAB */}
      {activeTab === 'html' && (
        <div className="glass" style={{ padding: '24px', borderRadius: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileCode size={18} style={{ color: 'var(--ice)' }} />
              <span style={{ fontWeight: 700, fontSize: '0.98rem' }}>دەستکاریکەر و ڕەنکەری HTML / CSS / JS</span>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="btn pri"
                onClick={runHtml}
                style={{ padding: '7px 18px', fontSize: '0.85rem', gap: '6px' }}
              >
                <Play size={15} />
                <span>ڕەنکردن (Run)</span>
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setHtmlCode(DEFAULT_HTML_CODE);
                  setHtmlSrcDoc(DEFAULT_HTML_CODE);
                  setHtmlConsole([]);
                }}
                style={{ padding: '7px 14px', fontSize: '0.85rem', gap: '6px' }}
                title="گەڕانەوە بۆ کۆدی سەرەتایی"
              >
                <RotateCcw size={14} />
                <span>ڕیسێت</span>
              </button>
            </div>
          </div>

          {/* Editor & Preview Split */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', minHeight: '440px' }}>
            {/* Editor Panel */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
                <span>کۆدی سەرچاوە (Source Code)</span>
                <span>{htmlCode.split('\n').length} دێڕ</span>
              </div>
              <textarea
                value={htmlCode}
                onChange={(e) => setHtmlCode(e.target.value)}
                style={{
                  width: '100%',
                  flex: 1,
                  minHeight: '380px',
                  background: '#040711',
                  color: '#e8ecfa',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '0.84rem',
                  lineHeight: 1.7,
                  padding: '14px',
                  borderRadius: '12px',
                  border: '1px solid var(--line2)',
                  resize: 'vertical',
                  direction: 'ltr',
                  textAlign: 'left',
                  outline: 'none',
                }}
                placeholder="کۆدی HTML لێرە بنووسە..."
                spellCheck={false}
              />
            </div>

            {/* Live Output Panel */}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--ice)', marginBottom: '6px', display: 'flex', justifyContent: 'space-between' }}>
                <span>دەرئەنجامی ڕاستەوخۆ (Live Preview)</span>
                <span>ساندبۆکسی پارێزراو</span>
              </div>
              <div
                style={{
                  width: '100%',
                  flex: 1,
                  minHeight: '380px',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  border: '1px solid var(--line2)',
                  background: '#ffffff',
                }}
              >
                <iframe
                  srcDoc={htmlSrcDoc}
                  title="HTML Preview"
                  sandbox="allow-scripts allow-modals"
                  style={{ width: '100%', height: '100%', border: 'none', display: 'block' }}
                />
              </div>

              {/* Mini Console Output */}
              {htmlConsole.length > 0 && (
                <div
                  style={{
                    marginTop: '10px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: '#040711',
                    border: '1px solid var(--line)',
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: '0.76rem',
                    color: 'var(--s)',
                    direction: 'ltr',
                    textAlign: 'left',
                    maxHeight: '100px',
                    overflowY: 'auto',
                  }}
                >
                  <div style={{ color: 'var(--muted)', marginBottom: '4px' }}>Console:</div>
                  {htmlConsole.map((msg, i) => (
                    <div key={i}>{'> ' + msg}</div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PYTHON RUNNER TAB */}
      {activeTab === 'python' && (
        <div className="glass" style={{ padding: '24px', borderRadius: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Terminal size={18} style={{ color: 'var(--ice)' }} />
              <span style={{ fontWeight: 700, fontSize: '0.98rem' }}>مەکینەی ڕەنکردنی پایتۆن (Python Runner)</span>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="btn pri"
                onClick={runPython}
                disabled={isPythonRunning}
                style={{ padding: '7px 18px', fontSize: '0.85rem', gap: '6px' }}
              >
                <Play size={15} />
                <span>{isPythonRunning ? 'لە کارکردندایە...' : 'ڕەنکردنی پایتۆن'}</span>
              </button>
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setPythonCode(DEFAULT_PYTHON_CODE);
                  setPythonOutput('');
                }}
                style={{ padding: '7px 14px', fontSize: '0.85rem', gap: '6px' }}
              >
                <RotateCcw size={14} />
                <span>ڕیسێت</span>
              </button>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '16px', minHeight: '420px' }}>
            {/* Python Code Input */}
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginBottom: '6px' }}>
                دەستکاریکەری سکریپتی پایتۆن (.py)
              </div>
              <textarea
                value={pythonCode}
                onChange={(e) => setPythonCode(e.target.value)}
                style={{
                  width: '100%',
                  height: '380px',
                  background: '#040711',
                  color: '#9ee6b5',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '0.86rem',
                  lineHeight: 1.7,
                  padding: '14px',
                  borderRadius: '12px',
                  border: '1px solid var(--line2)',
                  direction: 'ltr',
                  textAlign: 'left',
                  outline: 'none',
                }}
                placeholder="# پایتۆن کۆدەکەت لێرە بنووسە..."
                spellCheck={false}
              />
            </div>

            {/* Python Terminal Output */}
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--ice)', marginBottom: '6px' }}>
                تێرمیناڵی دەرئەنجام (Output Terminal)
              </div>
              <div
                style={{
                  width: '100%',
                  height: '380px',
                  background: '#02040a',
                  color: '#e8ecfa',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '0.84rem',
                  lineHeight: 1.7,
                  padding: '14px',
                  borderRadius: '12px',
                  border: '1px solid rgba(94, 200, 255, 0.25)',
                  overflowY: 'auto',
                  direction: 'ltr',
                  textAlign: 'left',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {pythonOutput || (
                  <span style={{ color: 'var(--muted)' }}>
                    کلیک لەسەر دوگمەی "ڕەنکردنی پایتۆن" بکە بۆ بینینی دەرئەنجامەکان لێرە...
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CODE ENCRYPTION & OBFUSCATION STUDIO */}
      {activeTab === 'encrypt' && (
        <div className="glass" style={{ padding: '24px', borderRadius: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={18} style={{ color: 'var(--ice)' }} />
              <span style={{ fontWeight: 700, fontSize: '0.98rem' }}>ستۆدیۆی ئینکریپتکردن و پاراستنی کۆدەکان (هەموو زمانەکان)</span>
            </div>

            <button
              type="button"
              className="btn pri"
              onClick={handleEncrypt}
              style={{ padding: '7px 20px', fontSize: '0.85rem', gap: '6px' }}
            >
              <Sparkles size={15} />
              <span>ئینکریپت بکە</span>
            </button>
          </div>

          {/* Encryption Options Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', marginBottom: '16px' }}>
            {/* Language Selector */}
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>
                زمانی پڕۆگرامسازی:
              </label>
              <select
                value={encryptLang}
                onChange={(e) => {
                  setEncryptLang(e.target.value as any);
                  setTimeout(handleEncrypt, 50);
                }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--line2)',
                  color: 'var(--text)',
                  fontFamily: 'inherit',
                  outline: 'none',
                }}
              >
                <option value="js">JavaScript / Node.js</option>
                <option value="python">Python</option>
                <option value="html">HTML / Web Script</option>
                <option value="php">PHP</option>
                <option value="generic">C / C++ / C# (Byte Array)</option>
              </select>
            </div>

            {/* Encryption Mode */}
            <div>
              <label style={{ fontSize: '0.78rem', color: 'var(--muted)', display: 'block', marginBottom: '4px' }}>
                شێوازی ئینکریپت:
              </label>
              <select
                value={encryptMode}
                onChange={(e) => {
                  setEncryptMode(e.target.value as any);
                  setTimeout(handleEncrypt, 50);
                }}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--line2)',
                  color: 'var(--text)',
                  fontFamily: 'inherit',
                  outline: 'none',
                }}
              >
                <option value="xor">XOR Cipher بە کلیلی نهێنی (بەهێز)</option>
                <option value="packed">Multi-layer Armor (فرە-چین و پارێزراو)</option>
                <option value="base64">Base64 Dynamic Unpack</option>
                <option value="hex">Hex Escape Obfuscation</option>
              </select>
            </div>

            {/* Secret Key Input */}
            {encryptMode === 'xor' && (
              <div>
                <label style={{ fontSize: '0.78rem', color: 'var(--ice)', display: 'block', marginBottom: '4px' }}>
                  کلیلی نهێنی (Secret Key):
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    value={secretKey}
                    onChange={(e) => setSecretKey(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px 30px 8px 12px',
                      borderRadius: '10px',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid var(--ice)',
                      color: 'var(--text)',
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: '0.84rem',
                      outline: 'none',
                    }}
                  />
                  <Key
                    size={14}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--ice)' }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Code Input & Encrypted Output */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {/* Input Code */}
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--muted)', marginBottom: '6px' }}>
                کۆدی بنەڕەتی تۆ (Source Code)
              </div>
              <textarea
                value={sourceCode}
                onChange={(e) => setSourceCode(e.target.value)}
                style={{
                  width: '100%',
                  height: '340px',
                  background: '#040711',
                  color: '#e8ecfa',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '0.84rem',
                  lineHeight: 1.7,
                  padding: '14px',
                  borderRadius: '12px',
                  border: '1px solid var(--line2)',
                  direction: 'ltr',
                  textAlign: 'left',
                  outline: 'none',
                }}
                placeholder="کۆدەکەت لێرە دابنێ بۆ پاراستن و ئینکریپتکردن..."
                spellCheck={false}
              />
            </div>

            {/* Encrypted Code Result */}
            <div>
              <div style={{ fontSize: '0.78rem', color: 'var(--s)', marginBottom: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>دەرئەنجامی ئینکریپتکراو (Encrypted Output)</span>
                <button
                  type="button"
                  onClick={handleCopy}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: copied ? 'var(--s)' : 'var(--ice)',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.78rem',
                  }}
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copied ? 'کۆپیکرا ✅' : 'کۆپیکردن'}</span>
                </button>
              </div>
              <textarea
                value={encryptedOutput}
                readOnly
                style={{
                  width: '100%',
                  height: '340px',
                  background: '#040711',
                  color: '#c792ea',
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '0.82rem',
                  lineHeight: 1.7,
                  padding: '14px',
                  borderRadius: '12px',
                  border: '1px solid rgba(199, 146, 234, 0.3)',
                  direction: 'ltr',
                  textAlign: 'left',
                  outline: 'none',
                }}
                placeholder="کۆدی ئینکریپتکراو لێرە دەردەکەوێت..."
                spellCheck={false}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
