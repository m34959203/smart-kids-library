'use client';

/**
 * Word-like Tiptap-редактор для админки. Реализация повторяет AIMAK
 * (apps/web/src/components/rich-text-editor.tsx), упрощённая версия без видео:
 * StarterKit + Underline + TextAlign + Link + Image. Картинки грузятся через
 * /api/upload (drag&drop, paste, кнопка). Возвращает HTML.
 */
import { useEditor, EditorContent, type Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import TextAlign from '@tiptap/extension-text-align';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { useEffect, useRef, useState } from 'react';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Code,
  Heading1,
  Heading2,
  Heading3,
  Image as ImageIcon,
  Italic,
  Link as LinkIcon,
  List,
  ListOrdered,
  Quote,
  Loader2,
  Redo,
  Strikethrough,
  Underline as UnderlineIcon,
  Undo,
} from 'lucide-react';

interface Props {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
}

async function uploadFileAsImage(file: File): Promise<string | null> {
  const form = new FormData();
  form.append('file', file);
  form.append('kind', 'misc');
  const res = await fetch('/api/upload', {
    method: 'POST',
    credentials: 'include',
    body: form,
  });
  if (!res.ok) {
    const e = await res.json().catch(() => ({}));
    alert(e?.error || `Ошибка загрузки: HTTP ${res.status}`);
    return null;
  }
  const data = await res.json();
  return data.url || null;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = 'Начните печатать…',
  minHeight = '320px',
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isUpdatingRef = useRef(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({ link: false, underline: false }),
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({
        openOnClick: false,
        autolink: true,
        HTMLAttributes: { class: 'text-blue-600 underline hover:text-blue-800' },
      }),
      Image.configure({ inline: false, HTMLAttributes: { class: 'max-w-full h-auto rounded-lg' } }),
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    onUpdate: ({ editor: e }) => {
      if (isUpdatingRef.current) return;
      onChange(e.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose max-w-none focus:outline-none p-4',
        style: `min-height: ${minHeight}`,
      },
      handleDrop(view, event, _slice, moved) {
        if (moved) return false;
        const f = event.dataTransfer?.files?.[0];
        if (!f || !f.type.startsWith('image/')) return false;
        event.preventDefault();
        (async () => {
          const url = await uploadFileAsImage(f);
          if (!url) return;
          const coords = view.posAtCoords({ left: event.clientX, top: event.clientY });
          const node = view.state.schema.nodes.image.create({ src: url });
          const tr = view.state.tr.insert(coords?.pos ?? view.state.doc.content.size, node);
          view.dispatch(tr);
        })();
        return true;
      },
      handlePaste(_view, event) {
        const items = event.clipboardData?.items;
        if (!items) return false;
        for (let i = 0; i < items.length; i++) {
          if (items[i].type.startsWith('image/')) {
            event.preventDefault();
            const f = items[i].getAsFile();
            if (!f) return true;
            (async () => {
              const url = await uploadFileAsImage(f);
              if (!url) return;
              editor?.chain().focus().setImage({ src: url }).run();
            })();
            return true;
          }
        }
        return false;
      },
    },
  });

  // Sync external value changes (e.g. when loading existing news/event)
  useEffect(() => {
    if (!editor) return;
    const current = editor.getHTML();
    if (value && value !== current) {
      isUpdatingRef.current = true;
      editor.commands.setContent(value, { emitUpdate: false });
      setTimeout(() => {
        isUpdatingRef.current = false;
      }, 50);
    }
  }, [value, editor]);

  if (!editor) return <div className="border rounded-lg p-4 text-sm text-gray-400">Загрузка редактора…</div>;

  const onImageButton = () => fileInputRef.current?.click();
  const onFileChosen = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    setUploadingImage(true);
    try {
      const url = await uploadFileAsImage(f);
      if (url) editor.chain().focus().setImage({ src: url }).run();
    } finally {
      setUploadingImage(false);
    }
  };

  const setLinkPrompt = () => {
    const prev = editor.getAttributes('link').href;
    const url = window.prompt('URL ссылки:', prev || 'https://');
    if (url === null) return;
    if (url === '') {
      editor.chain().focus().unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange('link').setLink({ href: url, target: '_blank' }).run();
  };

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden bg-white">
      <Toolbar
        editor={editor}
        onImage={onImageButton}
        onLink={setLinkPrompt}
        uploadingImage={uploadingImage}
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={onFileChosen}
      />
      <EditorContent editor={editor} />
    </div>
  );
}

function ToolBtn({
  active,
  disabled,
  onClick,
  title,
  children,
}: {
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`p-2 rounded hover:bg-gray-200 disabled:opacity-40 ${active ? 'bg-gray-300' : ''}`}
    >
      {children}
    </button>
  );
}

function Toolbar({
  editor,
  onImage,
  onLink,
  uploadingImage,
}: {
  editor: Editor;
  onImage: () => void;
  onLink: () => void;
  uploadingImage?: boolean;
}) {
  return (
    <div className="border-b border-gray-300 bg-gray-50 px-2 py-1.5 flex flex-wrap items-center gap-1 sticky top-0 z-10">
      <div className="flex gap-0.5 border-r border-gray-300 pr-1">
        <ToolBtn title="Жирный (Ctrl+B)" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="w-4 h-4" /></ToolBtn>
        <ToolBtn title="Курсив (Ctrl+I)" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="w-4 h-4" /></ToolBtn>
        <ToolBtn title="Подчёркнутый (Ctrl+U)" active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()}><UnderlineIcon className="w-4 h-4" /></ToolBtn>
        <ToolBtn title="Зачёркнутый" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}><Strikethrough className="w-4 h-4" /></ToolBtn>
      </div>
      <div className="flex gap-0.5 border-r border-gray-300 pr-1">
        <ToolBtn title="Заголовок 1" active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}><Heading1 className="w-4 h-4" /></ToolBtn>
        <ToolBtn title="Заголовок 2" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 className="w-4 h-4" /></ToolBtn>
        <ToolBtn title="Заголовок 3" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 className="w-4 h-4" /></ToolBtn>
      </div>
      <div className="flex gap-0.5 border-r border-gray-300 pr-1">
        <ToolBtn title="Маркированный список" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}><List className="w-4 h-4" /></ToolBtn>
        <ToolBtn title="Нумерованный список" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="w-4 h-4" /></ToolBtn>
      </div>
      <div className="flex gap-0.5 border-r border-gray-300 pr-1">
        <ToolBtn title="По левому краю" active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()}><AlignLeft className="w-4 h-4" /></ToolBtn>
        <ToolBtn title="По центру" active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()}><AlignCenter className="w-4 h-4" /></ToolBtn>
        <ToolBtn title="По правому краю" active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()}><AlignRight className="w-4 h-4" /></ToolBtn>
        <ToolBtn title="По ширине" active={editor.isActive({ textAlign: 'justify' })} onClick={() => editor.chain().focus().setTextAlign('justify').run()}><AlignJustify className="w-4 h-4" /></ToolBtn>
      </div>
      <div className="flex gap-0.5 border-r border-gray-300 pr-1">
        <ToolBtn title="Цитата" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote className="w-4 h-4" /></ToolBtn>
        <ToolBtn title="Блок кода" active={editor.isActive('codeBlock')} onClick={() => editor.chain().focus().toggleCodeBlock().run()}><Code className="w-4 h-4" /></ToolBtn>
        <ToolBtn title="Ссылка" active={editor.isActive('link')} onClick={onLink}><LinkIcon className="w-4 h-4" /></ToolBtn>
      </div>
      <div className="flex gap-0.5 border-r border-gray-300 pr-1">
        <ToolBtn title="Вставить изображение" disabled={uploadingImage} onClick={onImage}>
          {uploadingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
        </ToolBtn>
      </div>
      <div className="flex gap-0.5">
        <ToolBtn title="Отменить (Ctrl+Z)" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}><Undo className="w-4 h-4" /></ToolBtn>
        <ToolBtn title="Повторить (Ctrl+Y)" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}><Redo className="w-4 h-4" /></ToolBtn>
      </div>
    </div>
  );
}
