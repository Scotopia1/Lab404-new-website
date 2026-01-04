"use client";

import { useState, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { GoogleImageSearch } from "@/components/google-image-search";
import { Toolbar } from "./toolbar";
import { getExtensions } from "./extensions";
import "./styles.css";

interface BlogEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
}

export function BlogEditor({ content, onChange, placeholder }: BlogEditorProps) {
  const [showImageSearch, setShowImageSearch] = useState(false);

  const editor = useEditor({
    extensions: getExtensions(placeholder),
    content,
    immediatelyRender: false, // Prevent SSR hydration mismatch
    editorProps: {
      attributes: {
        class:
          "prose prose-sm dark:prose-invert max-w-none min-h-[400px] p-4 outline-none focus:outline-none",
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Update content when prop changes (for edit mode)
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  const handleImageSelected = (urls: string[]) => {
    if (urls.length > 0 && editor) {
      editor.chain().focus().setImage({ src: urls[0] }).run();
    }
    setShowImageSearch(false);
  };

  // Calculate statistics
  const text = editor?.getText() || "";
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  const charCount = text.length;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <>
      <Card className="overflow-hidden">
        <Toolbar editor={editor} onInsertImage={() => setShowImageSearch(true)} />
        <CardContent className="p-0">
          <EditorContent editor={editor} />
        </CardContent>
        <CardFooter className="border-t px-4 py-2 text-xs text-muted-foreground bg-muted/30">
          <div className="flex gap-4">
            <span>{wordCount} words</span>
            <span>{charCount.toLocaleString()} characters</span>
            <span>{readingTime} min read</span>
          </div>
        </CardFooter>
      </Card>

      <GoogleImageSearch
        open={showImageSearch}
        onOpenChange={setShowImageSearch}
        onSelectImages={handleImageSelected}
        maxSelections={1}
      />
    </>
  );
}

export default BlogEditor;
