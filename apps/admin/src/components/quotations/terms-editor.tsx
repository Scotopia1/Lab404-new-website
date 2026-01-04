"use client";

import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Underline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  Undo,
  Redo,
  FileText,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import "@/components/blog-editor/styles.css";

// Default terms templates
const DEFAULT_TERMS_TEMPLATES = {
  standard: `<p><strong>1. Quotation Validity</strong></p>
<p>This quotation is valid for 30 days from the date of issue. Prices and availability are subject to change after this period.</p>

<p><strong>2. Payment Terms</strong></p>
<p>Payment is due within 30 days of invoice date. For orders over $1,000, a 50% deposit is required before order processing.</p>

<p><strong>3. Delivery</strong></p>
<p>Delivery times are estimates and may vary based on product availability. Shipping costs will be calculated at checkout unless otherwise specified.</p>

<p><strong>4. Warranty</strong></p>
<p>All products are covered by manufacturer warranty. Warranty terms vary by product and will be provided with your order confirmation.</p>

<p><strong>5. Returns & Cancellations</strong></p>
<p>Orders may be cancelled within 24 hours of placement. Returns are accepted within 14 days of delivery for unused items in original packaging.</p>`,

  electronics: `<p><strong>1. Quotation Validity</strong></p>
<p>This quotation is valid for 14 days from the date of issue due to rapid pricing changes in electronic components.</p>

<p><strong>2. Component Availability</strong></p>
<p>Stock availability is subject to change. We will notify you immediately if any items become unavailable.</p>

<p><strong>3. Lead Times</strong></p>
<p>Standard lead time is 3-5 business days for in-stock items. Special order items may require 2-4 weeks.</p>

<p><strong>4. Technical Support</strong></p>
<p>Technical documentation and datasheets are available upon request. Our engineering team is available for pre-sales technical consultation.</p>

<p><strong>5. Minimum Order Quantities</strong></p>
<p>Some components may have minimum order quantities (MOQ). These will be clearly indicated in the quotation.</p>

<p><strong>6. Warranty</strong></p>
<p>Electronic components carry manufacturer warranty. Defective items will be replaced at no additional cost within the warranty period.</p>`,

  services: `<p><strong>1. Scope of Work</strong></p>
<p>This quotation covers the services as described above. Any additional work required will be quoted separately.</p>

<p><strong>2. Timeline</strong></p>
<p>Estimated completion times are provided in good faith but may vary based on project complexity and customer responsiveness.</p>

<p><strong>3. Payment Schedule</strong></p>
<ul>
<li>25% deposit upon acceptance</li>
<li>50% at project midpoint</li>
<li>25% upon completion</li>
</ul>

<p><strong>4. Changes & Revisions</strong></p>
<p>Two rounds of revisions are included. Additional revisions will be billed at our standard hourly rate.</p>

<p><strong>5. Intellectual Property</strong></p>
<p>Upon full payment, all deliverables and intellectual property rights transfer to the client.</p>`,
};

interface TermsEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  tooltip: string;
  children: React.ReactNode;
}

function ToolbarButton({
  onClick,
  isActive,
  disabled,
  tooltip,
  children,
}: ToolbarButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onClick}
          disabled={disabled}
          className={cn(
            "h-8 w-8",
            isActive && "bg-accent text-accent-foreground"
          )}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}

export function TermsEditor({
  content,
  onChange,
  placeholder = "Enter terms and conditions...",
  minHeight = 200,
}: TermsEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [3, 4],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      Underline,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
    ],
    content,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: `prose prose-sm dark:prose-invert max-w-none outline-none focus:outline-none p-4`,
        style: `min-height: ${minHeight}px`,
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
  });

  // Update content when prop changes
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content, editor]);

  const loadTemplate = (templateKey: keyof typeof DEFAULT_TERMS_TEMPLATES) => {
    if (editor) {
      editor.commands.setContent(DEFAULT_TERMS_TEMPLATES[templateKey]);
      onChange(DEFAULT_TERMS_TEMPLATES[templateKey]);
    }
  };

  if (!editor) {
    return (
      <div
        className="border rounded-lg bg-muted/30 animate-pulse"
        style={{ minHeight: minHeight + 40 }}
      />
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <TooltipProvider delayDuration={300}>
        <div className="flex flex-wrap items-center justify-between gap-1 p-2 border-b bg-muted/30">
          <div className="flex items-center gap-1">
            {/* Undo/Redo */}
            <ToolbarButton
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              tooltip="Undo"
            >
              <Undo className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              tooltip="Redo"
            >
              <Redo className="h-4 w-4" />
            </ToolbarButton>

            <Separator orientation="vertical" className="mx-1 h-6" />

            {/* Text Formatting */}
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              isActive={editor.isActive("bold")}
              tooltip="Bold"
            >
              <Bold className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              isActive={editor.isActive("italic")}
              tooltip="Italic"
            >
              <Italic className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              isActive={editor.isActive("underline")}
              tooltip="Underline"
            >
              <UnderlineIcon className="h-4 w-4" />
            </ToolbarButton>

            <Separator orientation="vertical" className="mx-1 h-6" />

            {/* Lists */}
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              isActive={editor.isActive("bulletList")}
              tooltip="Bullet List"
            >
              <List className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              isActive={editor.isActive("orderedList")}
              tooltip="Numbered List"
            >
              <ListOrdered className="h-4 w-4" />
            </ToolbarButton>

            <Separator orientation="vertical" className="mx-1 h-6" />

            {/* Alignment */}
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign("left").run()}
              isActive={editor.isActive({ textAlign: "left" })}
              tooltip="Align Left"
            >
              <AlignLeft className="h-4 w-4" />
            </ToolbarButton>
            <ToolbarButton
              onClick={() => editor.chain().focus().setTextAlign("center").run()}
              isActive={editor.isActive({ textAlign: "center" })}
              tooltip="Align Center"
            >
              <AlignCenter className="h-4 w-4" />
            </ToolbarButton>
          </div>

          {/* Load Template Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-8">
                <FileText className="h-4 w-4 mr-1" />
                Load Template
                <ChevronDown className="h-3 w-3 ml-1" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => loadTemplate("standard")}>
                Standard Terms
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => loadTemplate("electronics")}>
                Electronics Terms
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => loadTemplate("services")}>
                Services Terms
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </TooltipProvider>

      <EditorContent editor={editor} />
    </div>
  );
}

export default TermsEditor;
