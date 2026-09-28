import React, { useState } from 'react';

/**
 * Syntax highlighter for code blocks (C++, Bash, Python, etc.)
 */
const highlightCode = (code, lang = 'cpp') => {
  const lines = code.split('\n');

  return lines.map((line, lineIdx) => {
    const trimmed = line.trim();

    // 1. Comments
    if (trimmed.startsWith('//') || trimmed.startsWith('/*') || (lang === 'bash' || lang === 'python' ? trimmed.startsWith('#') : false)) {
      return (
        <span key={lineIdx} style={{ color: '#94a3b8', fontStyle: 'italic' }}>
          {line}
        </span>
      );
    }

    // 2. Preprocessor directives in C++ (starts with #)
    if (trimmed.startsWith('#include') || trimmed.startsWith('#define') || trimmed.startsWith('#ifdef') || trimmed.startsWith('#ifndef') || trimmed.startsWith('#endif')) {
      const parts = line.split(/(<[^>]+>|"[^"]+")/);
      return (
        <span key={lineIdx}>
          {parts.map((p, pIdx) => {
            if (p.startsWith('<') || p.startsWith('"')) {
              return <span key={pIdx} style={{ color: '#86efac' }}>{p}</span>;
            }
            return <span key={pIdx} style={{ color: '#f472b6', fontWeight: 600 }}>{p}</span>;
          })}
        </span>
      );
    }

    // 3. Tokenize by strings, comments, keywords, identifiers, numbers, and operators
    const tokenRegex = /(\/\/.*$|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b(?:int|float|double|char|bool|void|string|if|else|for|while|do|switch|case|break|continue|return|using|namespace|class|public|private|protected|struct|new|delete|nullptr|true|false|const|static|virtual|iptables|access-list|deny|permit|any|host|eq)\b|\b(?:cout|cin|endl|std|vector|size_t|printf|scanf|getline)\b|\b\d+(?:\.\d+)?\b|[{}();,\<\>\+\-\*\/\=\&\|!:]+|\s+|[^\s{}();,\<\>\+\-\*\/\=\&\|!:"']+)/g;

    const tokens = line.match(tokenRegex) || [line];

    return (
      <span key={lineIdx}>
        {tokens.map((token, tokIdx) => {
          if (token.startsWith('//')) {
            return <span key={tokIdx} style={{ color: '#94a3b8', fontStyle: 'italic' }}>{token}</span>;
          }
          if (token.startsWith('"') || token.startsWith("'")) {
            return <span key={tokIdx} style={{ color: '#86efac' }}>{token}</span>;
          }
          if (/^(int|float|double|char|bool|void|string|if|else|for|while|do|switch|case|break|continue|return|using|namespace|class|public|private|protected|struct|new|delete|nullptr|true|false|const|static|virtual|iptables|access-list|deny|permit|any|host|eq)$/.test(token)) {
            return <span key={tokIdx} style={{ color: '#38bdf8', fontWeight: 600 }}>{token}</span>;
          }
          if (/^(cout|cin|endl|std|vector|size_t|printf|scanf|getline)$/.test(token)) {
            return <span key={tokIdx} style={{ color: '#c084fc', fontWeight: 600 }}>{token}</span>;
          }
          if (/^\d+(?:\.\d+)?$/.test(token)) {
            return <span key={tokIdx} style={{ color: '#fb923c' }}>{token}</span>;
          }
          if (/^[{}();,]$/.test(token)) {
            return <span key={tokIdx} style={{ color: '#fde047' }}>{token}</span>;
          }
          if (/^[\<\>\+\-\*\/\=\&\|!:]+$/.test(token)) {
            return <span key={tokIdx} style={{ color: '#f43f5e' }}>{token}</span>;
          }
          return <span key={tokIdx} style={{ color: '#f8fafc' }}>{token}</span>;
        })}
      </span>
    );
  });
};

/**
 * Individual Interactive Code Block Card
 */
const CodeBlock = ({ code, language = 'cpp' }) => {
  const [copied, setCopied] = useState(false);

  const cleanLang = (language || 'cpp').toLowerCase().replace('c++', 'cpp');
  const displayLang = cleanLang === 'cpp' ? 'C++' : cleanLang === 'py' || cleanLang === 'python' ? 'Python' : cleanLang === 'bash' || cleanLang === 'sh' ? 'Bash / Shell' : cleanLang.toUpperCase() || 'Code';

  const handleCopy = () => {
    navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const lines = code.trim().split('\n');

  return (
    <div className="chat-code-block">
      {/* Code Card Header Bar */}
      <div className="chat-code-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="code-window-dots">
            <span style={{ background: '#ef4444' }} />
            <span style={{ background: '#f59e0b' }} />
            <span style={{ background: '#10b981' }} />
          </span>
          <span className="code-lang-badge">
            💻 {displayLang}
          </span>
          <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
            ({lines.length} lines)
          </span>
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="code-copy-btn"
          title="Copy full code to clipboard"
        >
          {copied ? '✓ Copied!' : '📋 Copy Code'}
        </button>
      </div>

      {/* Code Editor Body with Line Numbers */}
      <div className="chat-code-body">
        <table style={{ borderCollapse: 'collapse', width: '100%', fontVariantNumeric: 'tabular-nums' }}>
          <tbody>
            {lines.map((lineText, idx) => (
              <tr key={idx} className="code-line-row">
                <td className="code-line-number">{idx + 1}</td>
                <td className="code-line-content">
                  {highlightCode(lineText, cleanLang)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/**
 * Formats inline text (bold, inline code, italics, bullets)
 */
const formatInlineText = (text) => {
  if (!text) return null;

  // Split by inline code: `code`
  const codeParts = text.split(/(`[^`]+`)/g);

  return codeParts.map((part, i) => {
    if (part.startsWith('`') && part.endsWith('`') && part.length >= 2) {
      const codeSnippet = part.slice(1, -1);
      return (
        <code key={i} className="chat-inline-code">
          {codeSnippet}
        </code>
      );
    }

    // Process bold **text**
    const boldParts = part.split(/(\*\*[^*]+\*\*)/g);
    return boldParts.map((bPart, bIdx) => {
      if (bPart.startsWith('**') && bPart.endsWith('**') && bPart.length >= 4) {
        return <strong key={`${i}-${bIdx}`}>{bPart.slice(2, -2)}</strong>;
      }

      // Process italic *text*
      const italicParts = bPart.split(/(\*[^*]+\*)/g);
      return italicParts.map((itPart, itIdx) => {
        if (itPart.startsWith('*') && itPart.endsWith('*') && itPart.length >= 2 && !itPart.startsWith('**')) {
          return <em key={`${i}-${bIdx}-${itIdx}`} style={{ color: '#93c5fd' }}>{itPart.slice(1, -1)}</em>;
        }
        return itPart;
      });
    });
  });
};

/**
 * Main FormattedChatMessage component
 * Parses raw text containing Markdown & Fenced Code Blocks (```cpp ... ```)
 */
const FormattedChatMessage = ({ content }) => {
  if (!content) return null;

  // Split content by fenced code blocks: ```[lang]\n[code]```
  const codeBlockRegex = /```([a-zA-Z0-9_\+\-\.]*)\n?([\s\S]*?)```/g;

  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    const textBefore = content.slice(lastIndex, match.index);
    if (textBefore) {
      parts.push({ type: 'text', content: textBefore });
    }

    const language = match[1] || 'cpp';
    const code = match[2];
    parts.push({ type: 'code', language, content: code });

    lastIndex = match.index + match[0].length;
  }

  const remainingText = content.slice(lastIndex);
  if (remainingText) {
    parts.push({ type: 'text', content: remainingText });
  }

  return (
    <div className="formatted-chat-message">
      {parts.map((part, idx) => {
        if (part.type === 'code') {
          return <CodeBlock key={idx} code={part.content} language={part.language} />;
        }

        // Render formatted text lines with bullet support
        const lines = part.content.split('\n');
        return (
          <div key={idx} className="chat-text-segment">
            {lines.map((line, lineIdx) => {
              const isBullet = line.trim().startsWith('•') || line.trim().startsWith('-');
              return (
                <div
                  key={lineIdx}
                  style={{
                    minHeight: line.trim() === '' ? '8px' : 'auto',
                    paddingLeft: isBullet ? '12px' : '0',
                    margin: line.trim() === '' ? '4px 0' : '2px 0'
                  }}
                >
                  {formatInlineText(line)}
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
};

export default FormattedChatMessage;
