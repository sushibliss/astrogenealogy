import ReactMarkdown from "react-markdown";

/** Renders publication Markdown. Raw HTML in the source is not rendered. */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="prose-origen">
      <ReactMarkdown>{children}</ReactMarkdown>
    </div>
  );
}
