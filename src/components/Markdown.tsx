import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/** Renders publication and editorial Markdown. Raw HTML in the source is not rendered. */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="prose-origen">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}
