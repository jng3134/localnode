/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, memo } from 'react';
import Markdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import 'katex/dist/katex.min.css';
import { Copy, Check, Terminal } from 'lucide-react';

import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface CodeBlockProps {
  language: string;
  value: string;
  isGenerating?: boolean;
}

export const CodeBlock: React.FC<CodeBlockProps> = memo(({ language, value, isGenerating }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error('Copy to clipboard failed:', e);
    }
  };

  return (
    <div className="my-4 overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 bg-[#1e1e1e] shadow-lg font-mono text-sm max-w-full">
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800 bg-[#2d2d2d] text-xs text-zinc-400 font-sans tracking-wide">
        <div className="flex items-center gap-2 font-mono text-[11px] uppercase">
          <Terminal size={14} className="text-emerald-400" />
          <span>{language || 'code'}</span>
        </div>
        <button
          onClick={handleCopy}
          id="btn-copy-code"
          className="flex items-center gap-1.5 px-2 py-1 rounded bg-zinc-800 hover:bg-zinc-700 hover:text-zinc-100 transition duration-150 cursor-pointer"
        >
          {copied ? (
            <>
              <Check size={12} className="text-emerald-400" />
              <span className="text-emerald-400">Copied!</span>
            </>
          ) : (
            <>
              <Copy size={12} />
              <span>Copy Code</span>
            </>
          )}
        </button>
      </div>
      <div className="overflow-x-auto select-text bg-[#1e1e1e]">
        {isGenerating ? (
          <pre className="p-4 m-0 overflow-x-auto text-zinc-200 select-text leading-relaxed bg-transparent font-mono text-xs md:text-sm whitespace-pre">
            <code>{value}</code>
          </pre>
        ) : (
          <SyntaxHighlighter
            language={language.toLowerCase()}
            style={vscDarkPlus}
            customStyle={{
              margin: 0,
              padding: '1rem',
              background: 'transparent',
              fontSize: '0.875rem',
              lineHeight: '1.5',
            }}
            wrapLines={true}
            wrapLongLines={false}
          >
            {value}
          </SyntaxHighlighter>
        )}
      </div>
    </div>
  );
});

interface MarkdownRendererProps {
  content: string;
  isGenerating?: boolean;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = memo(({ content, isGenerating }) => {
  return (
    <div className="markdown-body prose prose-zinc dark:prose-invert prose-xs md:prose-sm max-w-none break-words leading-relaxed select-text text-zinc-800 dark:text-zinc-200">
      <Markdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex]}
        components={{
          code({ className, children, ...props }) {
            // Check if inline
            const contentString = String(children || '').trim();
            const hasNewline = contentString.includes('\n');
            const match = /language-(\w+)/.exec(className || '');
            const inline = !match && !hasNewline;

            if (!inline) {
              return (
                <CodeBlock
                  language={match ? match[1] : 'text'}
                  value={contentString}
                  isGenerating={isGenerating}
                />
              );
            }

            return (
              <code
                className="px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-rose-500 dark:text-rose-400 font-mono text-[13px] border border-zinc-200/50 dark:border-zinc-700/30"
                {...props}
              >
                {children}
              </code>
            );
          },
          p({ children }) {
            return <p className="mb-2.5 last:mb-0 leading-relaxed">{children}</p>;
          },
          ul({ children }) {
            return <ul className="list-disc pl-5 mb-3.5 space-y-1">{children}</ul>;
          },
          ol({ children }) {
            return <ol className="list-decimal pl-5 mb-3.5 space-y-1">{children}</ol>;
          },
          li({ children }) {
            return <li className="mb-0.5">{children}</li>;
          },
          h1({ children }) {
            return <h1 className="text-lg md:text-xl font-bold tracking-tight mt-4 mb-2 text-zinc-900 dark:text-zinc-50">{children}</h1>;
          },
          h2({ children }) {
            return <h2 className="text-base md:text-lg font-semibold tracking-tight mt-3 mb-2 text-zinc-800 dark:text-zinc-100">{children}</h2>;
          },
          h3({ children }) {
            return <h3 className="text-sm md:text-base font-semibold tracking-tight mt-2 mb-1.5 text-zinc-800 dark:text-zinc-200">{children}</h3>;
          },
          blockquote({ children }) {
            return (
              <blockquote className="border-l-4 border-emerald-500/50 bg-emerald-500/5 dark:bg-emerald-400/5 px-4 py-1 my-3 rounded-r italic text-zinc-600 dark:text-zinc-400">
                {children}
              </blockquote>
            );
          },
          table({ children }) {
            return (
              <div className="my-4 overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
                <table className="w-full text-left border-collapse text-xs md:text-sm">
                  {children}
                </table>
              </div>
            );
          },
          thead({ children }) {
            return <thead className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium">{children}</thead>;
          },
          tbody({ children }) {
            return <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">{children}</tbody>;
          },
          tr({ children }) {
            return <tr className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/30 transition-colors">{children}</tr>;
          },
          th({ children }) {
            return <th className="px-4 py-2 font-medium">{children}</th>;
          },
          td({ children }) {
            return <td className="px-4 py-2 text-zinc-600 dark:text-zinc-400">{children}</td>;
          },
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noreferrer"
                className="text-emerald-500 hover:text-emerald-600 underline font-medium break-all"
              >
                {children}
              </a>
            );
          },
        }}
      >
        {content}
      </Markdown>
    </div>
  );
});
