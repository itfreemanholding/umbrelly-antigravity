import { useRef, useEffect } from 'react';
import { Bold, Italic, Underline, Palette, Highlighter } from 'lucide-react';

export function RichTextEditor({ value, onChange }: { value: string, onChange: (val: string) => void }) {
    const editorRef = useRef<HTMLDivElement>(null);

    // Only set initial value to avoid cursor jumping during edits
    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== value) {
            // Encode pure newlines so they don't get eaten by contentEditable
            // (Only for initial string from backend, if it lacks HTML tags)
            editorRef.current.innerHTML = value || '';
        }
    }, [value]); // Wait, if we keep setting it, it resets cursor. We should only set strictly once if value starts empty? Actually, empty [] is safer for cursor, but maybe [value] if we ensure it only overrides if entirely different or empty. Let's stick to [] for first render.

    useEffect(() => {
        // Safe one-time inject specifically for cases where the component remounts or receives late async data without user typing
        if (editorRef.current && editorRef.current.innerHTML === '' && value) {
            editorRef.current.innerHTML = value;
        }
    }, [value]);

    const execCommand = (command: string, arg?: string) => {
        document.execCommand(command, false, arg);
        editorRef.current?.focus();
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
    };

    const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
        onChange(e.currentTarget.innerHTML);
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
        // Only allow plain text paste, prevent images and rich text
        e.preventDefault();
        const text = e.clipboardData.getData('text/plain');
        document.execCommand('insertText', false, text);
    };

    return (
        <div style={{ border: '1px solid var(--border-color)', borderRadius: '8px', background: '#ffffff', overflow: 'hidden' }}>
            {/* Toolbar */}
            <div style={{ 
                display: 'flex', gap: '8px', padding: '10px 16px', 
                borderBottom: '1px solid var(--border-color)', 
                background: 'var(--bg-primary)', alignItems: 'center' 
            }}>
                <button 
                    onClick={() => execCommand('bold')}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center' }}
                    title="Bold"
                ><Bold size={16}/></button>
                <button 
                    onClick={() => execCommand('italic')}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center' }}
                    title="Italic"
                ><Italic size={16}/></button>
                <button 
                    onClick={() => execCommand('underline')}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center' }}
                    title="Underline"
                ><Underline size={16}/></button>

                <div style={{ width: '1px', height: '20px', background: 'var(--border-color)', margin: '0 4px' }} />

                <button 
                    onClick={() => execCommand('hiliteColor', '#fcd34d')}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--text-primary)', display: 'flex', alignItems: 'center' }}
                    title="Yellow Marker Highlight"
                ><Highlighter size={16}/></button>
                
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center', marginLeft: '8px', paddingLeft: '12px', borderLeft: '1px solid var(--border-color)' }}>
                    <Palette size={16} color="var(--text-primary)" style={{position: 'absolute', pointerEvents: 'none', left: 18}} />
                    <input 
                        type="color" 
                        onChange={(e) => execCommand('foreColor', e.target.value)}
                        style={{ opacity: 0, width: '24px', height: '24px', cursor: 'pointer' }}
                        title="Text Color"
                    />
                </div>
            </div>

            {/* Editable Content Area */}
            <div 
                ref={editorRef}
                contentEditable
                onInput={handleInput}
                onPaste={handlePaste}
                className="rich-text-content"
                style={{ 
                    minHeight: '200px', 
                    padding: '32px', 
                    outline: 'none', 
                    border: 'none', 
                    fontSize: '15px', 
                    lineHeight: '1.8', 
                    background: 'transparent',
                    whiteSpace: 'pre-wrap', // Preserves exact space/returns for pasted plaintext
                    color: 'var(--text-primary)'
                }}
            />
        </div>
    );
}
