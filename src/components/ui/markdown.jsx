import { cn } from "@/lib/utils"
import { marked } from "marked"
import { memo, useId, useMemo } from "react"
import ReactMarkdown from "react-markdown";
import remarkBreaks from "remark-breaks"
import remarkGfm from "remark-gfm"
import { CodeBlock, CodeBlockCode } from "./code-block"

function parseMarkdownIntoBlocks(markdown) {
  const tokens = marked.lexer(markdown)
  return tokens.map((token) => token.raw);
}

function extractLanguage(className) {
  if (!className) return "plaintext"
  const match = className.match(/language-(\w+)/)
  return match ? match[1] : "plaintext"
}

const INITIAL_COMPONENTS = {
  code: function CodeComponent({ className, children, ...props }) {
    const isInline =
      !props.node?.position?.start.line ||
      props.node?.position?.start.line === props.node?.position?.end.line

    if (isInline) {
      return (
        <span
          className={cn("bg-primary-foreground rounded-sm px-1 font-mono text-sm", className)}
          {...props}>
          {children}
        </span>
      );
    }

    const language = extractLanguage(className)

    return (
      <CodeBlock className={className}>
        <CodeBlockCode code={children} language={language} />
      </CodeBlock>
    );
  },
  pre: function PreComponent({ children }) {
    return <>{children}</>
  },
  table: ({ children, ...props }) => (
    <div className="w-full overflow-x-auto my-4 custom-scrollbar rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-[#0c0c0e]">
      <table className="w-full text-left border-collapse text-[13px]" {...props}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }) => (
    <thead className="bg-zinc-50 dark:bg-[#151515] border-b border-zinc-200 dark:border-zinc-800" {...props}>
      {children}
    </thead>
  ),
  tbody: ({ children, ...props }) => (
    <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50" {...props}>
      {children}
    </tbody>
  ),
  tr: ({ children, ...props }) => (
    <tr className="hover:bg-zinc-50/50 dark:hover:bg-white/[0.02] transition-colors" {...props}>
      {children}
    </tr>
  ),
  th: ({ children, ...props }) => (
    <th className="px-4 py-3 font-semibold text-zinc-700 dark:text-zinc-300 border-r border-zinc-200 dark:border-zinc-800 last:border-0 whitespace-nowrap" {...props}>
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td className="px-4 py-2.5 text-zinc-600 dark:text-zinc-400 border-r border-zinc-100 dark:border-zinc-800/50 last:border-0 align-top" {...props}>
      {children}
    </td>
  ),
}

const MemoizedMarkdownBlock = memo(function MarkdownBlock({
  content,
  components = INITIAL_COMPONENTS
}) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]} components={components}>
      {content}
    </ReactMarkdown>
  );
}, function propsAreEqual(prevProps, nextProps) {
  return prevProps.content === nextProps.content
})

MemoizedMarkdownBlock.displayName = "MemoizedMarkdownBlock"

function MarkdownComponent({
  children,
  id,
  className,
  components = INITIAL_COMPONENTS
}) {
  const generatedId = useId()
  const blockId = id ?? generatedId
  const blocks = useMemo(() => parseMarkdownIntoBlocks(children), [children])

  return (
    <div className={className}>
      {blocks.map((block, index) => (
        <MemoizedMarkdownBlock key={`${blockId}-block-${index}`} content={block} components={components} />
      ))}
    </div>
  );
}

const Markdown = memo(MarkdownComponent)
Markdown.displayName = "Markdown"

export { Markdown }
