import {
  Award,
  ClipboardCheck,
  FilePenLine,
  FolderOpen,
  Gamepad2,
  MessageSquare,
  NotebookText,
  Presentation,
} from 'lucide-react'
import type { ModuleIconName } from '../../config/site'

export function ModuleIcon({ name, className = 'size-5' }: { name: ModuleIconName; className?: string }) {
  switch (name) {
    case 'message-square':
      return <MessageSquare className={className} aria-hidden />
    case 'presentation':
      return <Presentation className={className} aria-hidden />
    case 'notebook-text':
      return <NotebookText className={className} aria-hidden />
    case 'gamepad-2':
      return <Gamepad2 className={className} aria-hidden />
    case 'clipboard-check':
      return <ClipboardCheck className={className} aria-hidden />
    case 'file-pen-line':
      return <FilePenLine className={className} aria-hidden />
    case 'award':
      return <Award className={className} aria-hidden />
    case 'folder-open':
      return <FolderOpen className={className} aria-hidden />
  }
}
