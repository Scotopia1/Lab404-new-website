import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";

// Create lowlight instance with common languages
const lowlight = createLowlight(common);

export const getExtensions = (placeholder?: string) => [
  StarterKit.configure({
    heading: {
      levels: [2, 3, 4],
    },
    codeBlock: false, // Use CodeBlockLowlight instead
  }),
  Placeholder.configure({
    placeholder: placeholder || "Start writing your blog post...",
  }),
  Image.configure({
    HTMLAttributes: {
      class: "rounded-lg max-w-full mx-auto",
    },
    allowBase64: true,
  }),
  Link.configure({
    openOnClick: false,
    HTMLAttributes: {
      class: "text-primary underline",
    },
  }),
  Underline,
  TextAlign.configure({
    types: ["heading", "paragraph"],
  }),
  CodeBlockLowlight.configure({
    lowlight,
    HTMLAttributes: {
      class: "bg-muted rounded-lg p-4 overflow-x-auto",
    },
  }),
];
