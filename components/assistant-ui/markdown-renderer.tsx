"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { CheckIcon, CopyIcon } from "lucide-react";
import { useState } from "react";
import { TooltipIconButton } from "@/components/assistant-ui/tooltip-icon-button";

interface MarkdownRendererProps {
  children: string;
}

export const MarkdownRenderer = ({ children }: MarkdownRendererProps) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={{
        h1: ({ children }) => (
          <h1 className="mb-8 scroll-m-20 text-4xl font-extrabold tracking-tight">
            {children}
          </h1>
        ),
        h2: ({ children }) => (
          <h2 className="mt-8 mb-4 scroll-m-20 text-3xl font-semibold tracking-tight first:mt-0">
            {children}
          </h2>
        ),
        h3: ({ children }) => (
          <h3 className="mt-6 mb-4 scroll-m-20 text-2xl font-semibold tracking-tight first:mt-0">
            {children}
          </h3>
        ),
        h4: ({ children }) => (
          <h4 className="mt-6 mb-4 scroll-m-20 text-xl font-semibold tracking-tight first:mt-0">
            {children}
          </h4>
        ),
        h5: ({ children }) => (
          <h5 className="my-4 text-lg font-semibold first:mt-0">
            {children}
          </h5>
        ),
        h6: ({ children }) => (
          <h6 className="my-4 font-semibold first:mt-0">
            {children}
          </h6>
        ),
        p: ({ children }) => (
          <p className="my-4 leading-7">
            {children}
          </p>
        ),
        a: ({ children, href }) => (
          <a
            href={href}
            className="font-medium text-primary underline underline-offset-4 hover:text-primary/80"
            target="_blank"
            rel="noopener noreferrer"
          >
            {children}
          </a>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-primary pl-6 italic my-4 text-muted-foreground">
            {children}
          </blockquote>
        ),
        ul: ({ children }) => (
          <ul className="my-4 ml-6 list-disc space-y-2">
            {children}
          </ul>
        ),
        ol: ({ children }) => (
          <ol className="my-4 ml-6 list-decimal space-y-2">
            {children}
          </ol>
        ),
        li: ({ children }) => (
          <li className="ml-2">
            {children}
          </li>
        ),
        hr: () => (
          <hr className="my-6 border-border" />
        ),
        table: ({ children }) => (
          <div className="my-6 overflow-x-auto rounded-lg border border-border">
            <table className="w-full border-collapse">
              {children}
            </table>
          </div>
        ),
        thead: ({ children }) => (
          <thead className="bg-muted">
            {children}
          </thead>
        ),
        tbody: ({ children }) => (
          <tbody>
            {children}
          </tbody>
        ),
        tr: ({ children }) => (
          <tr className="border-b border-border hover:bg-muted/50">
            {children}
          </tr>
        ),
        th: ({ children }) => (
          <th className="px-4 py-3 text-left font-semibold">
            {children}
          </th>
        ),
        td: ({ children }) => (
          <td className="px-4 py-2">
            {children}
          </td>
        ),
        code: ({ inline, children, className }) => {
          const language = className?.replace(/language-/, "");

          if (inline) {
            return (
              <code className="rounded bg-muted px-2 py-1 font-mono text-sm font-semibold">
                {children}
              </code>
            );
          }

          const codeText = String(children).replace(/\n$/, "");
          return <CodeBlock language={language || ""} code={codeText} />;
        },
        pre: ({ children }) => (
          <div>{children}</div>
        ),
      }}
    >
      {children}
    </ReactMarkdown>
  );
};

interface CodeBlockProps {
  language: string;
  code: string;
}

const CodeBlock = ({ language, code }: CodeBlockProps) => {
  const { isCopied, copyToClipboard } = useCopyToClipboard();

  const onCopy = () => {
    if (!code || isCopied) return;
    copyToClipboard(code);
  };

  return (
    <div className="my-4 rounded-lg overflow-hidden border border-border">
      <div className="flex items-center justify-between gap-4 bg-muted-foreground/10 px-4 py-2 text-sm font-semibold text-foreground">
        <span className="lowercase">{language || "code"}</span>
        <TooltipIconButton tooltip="Copy" onClick={onCopy}>
          {!isCopied && <CopyIcon className="h-4 w-4" />}
          {isCopied && <CheckIcon className="h-4 w-4" />}
        </TooltipIconButton>
      </div>
      <pre className="overflow-x-auto bg-slate-950 dark:bg-slate-950 p-4 text-white text-sm">
        <code>{code}</code>
      </pre>
    </div>
  );
};

const useCopyToClipboard = ({
  copiedDuration = 3000,
}: {
  copiedDuration?: number;
} = {}) => {
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const copyToClipboard = (value: string) => {
    if (!value) return;

    navigator.clipboard.writeText(value).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), copiedDuration);
    });
  };

  return { isCopied, copyToClipboard };
};
