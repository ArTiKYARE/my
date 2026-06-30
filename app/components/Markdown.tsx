"use client";

function parseInline(text: string): React.ReactNode[] {
  const parts = text.split(/(\*\*.*?\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

interface MarkdownProps {
  content: string;
}

export default function Markdown({ content }: MarkdownProps) {
  const blocks = content.split("\n\n");

  return (
    <>
      {blocks.map((block, index) => {
        const lines = block.split("\n");

        // Numbered list
        if (lines.every((line) => /^\d+\.\s/.test(line))) {
          return (
            <ol key={index} className="list-decimal pl-6 space-y-2 my-4">
              {lines.map((line, i) => (
                <li key={i}>{parseInline(line.replace(/^\d+\.\s/, ""))}</li>
              ))}
            </ol>
          );
        }

        // Bullet list
        if (lines.every((line) => /^[-*]\s/.test(line))) {
          return (
            <ul key={index} className="list-disc pl-6 space-y-2 my-4">
              {lines.map((line, i) => (
                <li key={i}>{parseInline(line.replace(/^[-*]\s/, ""))}</li>
              ))}
            </ul>
          );
        }

        return (
          <p key={index} className="mb-4">
            {parseInline(block)}
          </p>
        );
      })}
    </>
  );
}
