// File System Access API type augmentations
// These APIs are available in Chromium-based browsers but not in TypeScript's default lib

interface Window {
  showDirectoryPicker(options?: { mode?: 'read' | 'readwrite' }): Promise<FileSystemDirectoryHandle>
}

interface FileSystemDirectoryHandle {
  entries(): AsyncIterableIterator<[string, FileSystemDirectoryHandle | FileSystemFileHandle]>
}

interface DataTransferItem {
  getAsFileSystemHandle(): Promise<FileSystemHandle | null>
}
