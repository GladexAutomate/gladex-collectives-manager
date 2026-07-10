// @ts-nocheck
import { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import {
  FolderPlus, Upload, ChevronRight, Home,
  File, Download, Trash2, Loader2, FileText, Image as ImageIcon,
  Film, X, FolderX
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

const STORAGE_KEY = 'gladex_tariff_v1';

const ROOT_FOLDERS = [
  '.LAND ARRANGEMENT.',
  'AMERICA',
  'BALI',
  'CANADA',
  'CENTRAL ASIA',
  'CHINA',
  'CRUISE',
  'DUBAI',
  'EUROPE',
  'FAM TOUR',
  'HOLY LAND',
  'HONGKONG',
  'INDIA',
  'JAPAN',
  'KOREA',
  'MONGOLIA',
  'NEW ZEALAND',
  'PREMIUM PACKAGES',
  'SINGAPORE',
  'SOUTH ASIA',
  'TAIWAN',
  'THAILAND',
  'TRI-CITY',
  'UNITED KINGDOM',
  'VIETNAM',
];

const ROW_COLORS = [
  { bg: 'bg-purple-600',  hover: 'hover:bg-purple-700',  count: 'text-purple-200'  },
  { bg: 'bg-pink-500',    hover: 'hover:bg-pink-600',    count: 'text-pink-200'    },
  { bg: 'bg-sky-500',     hover: 'hover:bg-sky-600',     count: 'text-sky-200'     },
  { bg: 'bg-emerald-600', hover: 'hover:bg-emerald-700', count: 'text-emerald-200' },
  { bg: 'bg-amber-500',   hover: 'hover:bg-amber-600',   count: 'text-amber-200'   },
  { bg: 'bg-rose-500',    hover: 'hover:bg-rose-600',    count: 'text-rose-200'    },
  { bg: 'bg-indigo-600',  hover: 'hover:bg-indigo-700',  count: 'text-indigo-200'  },
  { bg: 'bg-teal-600',    hover: 'hover:bg-teal-700',    count: 'text-teal-200'    },
];

function loadData() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
  catch { return {}; }
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function pathKey(arr) { return arr.join('/'); }

function getFileIcon(type = '', name = '') {
  const n = name.toLowerCase();
  if (type.startsWith('image/') || /\.(jpe?g|png|gif|webp|svg)$/.test(n))
    return <ImageIcon className="w-5 h-5 text-blue-500 flex-shrink-0" />;
  if (type.startsWith('video/') || /\.(mp4|mov|avi|mkv)$/.test(n))
    return <Film className="w-5 h-5 text-purple-500 flex-shrink-0" />;
  if (type.includes('pdf') || n.endsWith('.pdf'))
    return <FileText className="w-5 h-5 text-rose-500 flex-shrink-0" />;
  return <File className="w-5 h-5 text-slate-400 flex-shrink-0" />;
}

function formatSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function TariffBrowser() {
  const [path, setPath]                   = useState([]);
  const [data, setData]                   = useState(loadData);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [uploading, setUploading]         = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const fileInputRef = useRef(null);

  const key      = pathKey(path);
  const isRoot   = path.length === 0;
  const entry    = data[key] || { folders: [], files: [] };

  const currentFolders = isRoot ? ROOT_FOLDERS : (entry.folders || []);
  const currentFiles   = entry.files || [];

  function navigate(folder) { setPath(p => [...p, folder]); }
  function goTo(idx)        { setPath(p => p.slice(0, idx + 1)); }
  function goHome()         { setPath([]); }

  function mutate(fn) {
    setData(prev => {
      const next = { ...prev };
      if (!next[key]) next[key] = { folders: [], files: [] };
      fn(next);
      saveData(next);
      return next;
    });
  }

  function createFolder() {
    const name = newFolderName.trim();
    if (!name) return;
    mutate(d => {
      if (!d[key].folders.includes(name)) d[key].folders = [...d[key].folders, name];
    });
    setNewFolderName('');
    setShowNewFolder(false);
  }

  function deleteFolder(name) {
    if (isRoot) return;
    mutate(d => { d[key].folders = d[key].folders.filter(f => f !== name); });
  }

  function deleteFile(idx) {
    mutate(d => { d[key].files = d[key].files.filter((_, i) => i !== idx); });
  }

  async function handleUpload(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(`Uploading ${i + 1}/${files.length}: ${file.name}`);
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        mutate(d => {
          d[key].files = [...(d[key].files || []), {
            name: file.name,
            url: file_url,
            type: file.type,
            size: file.size,
            uploadedAt: new Date().toISOString(),
          }];
        });
      }
    } finally {
      setUploading(false);
      setUploadProgress('');
      e.target.value = '';
    }
  }

  function childCount(folderName) {
    const childKey = pathKey([...path, folderName]);
    const childEntry = data[childKey] || { folders: [], files: [] };
    return (childEntry.folders?.length || 0) + (childEntry.files?.length || 0);
  }

  return (
    <div className="space-y-4">

      {/* Breadcrumb */}
      <div className="flex items-center gap-1 flex-wrap text-sm min-h-[28px]">
        <button
          onClick={goHome}
          className={cn(
            "flex items-center gap-1.5 px-2 py-1 rounded-lg transition-colors",
            isRoot
              ? "bg-amber-100 text-amber-800 font-semibold"
              : "text-muted-foreground hover:text-foreground hover:bg-muted"
          )}
        >
          <Home className="w-3.5 h-3.5" /> Tariff
        </button>
        {path.map((seg, idx) => (
          <span key={idx} className="flex items-center gap-1">
            <ChevronRight className="w-3 h-3 text-muted-foreground flex-shrink-0" />
            <button
              onClick={() => goTo(idx)}
              className={cn(
                "px-2 py-1 rounded-lg transition-colors text-xs font-medium",
                idx === path.length - 1
                  ? "bg-amber-100 text-amber-800 font-semibold"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              )}
            >
              {seg}
            </button>
          </span>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        {!isRoot && (
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5 text-xs h-8"
            onClick={() => { setNewFolderName(''); setShowNewFolder(true); }}
          >
            <FolderPlus className="w-3.5 h-3.5" /> New Folder
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 text-xs h-8"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading
            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
            : <Upload className="w-3.5 h-3.5" />}
          Upload Files
        </Button>
        <input ref={fileInputRef} type="file" multiple className="hidden" onChange={handleUpload} />
        {uploading && (
          <span className="text-xs text-muted-foreground italic">{uploadProgress}</span>
        )}
      </div>

      {/* Folders grid */}
      {currentFolders.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2.5">
          {currentFolders.map((folder, idx) => {
            const count  = childCount(folder);
            const color  = ROW_COLORS[Math.floor(idx / 6) % ROW_COLORS.length];
            return (
              <div
                key={folder}
                onClick={() => navigate(folder)}
                className={cn(
                  'group relative rounded-xl p-3.5 cursor-pointer transition-all select-none shadow-sm',
                  color.bg, color.hover,
                )}
              >
                {!isRoot && (
                  <button
                    onClick={e => { e.stopPropagation(); deleteFolder(folder); }}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-white/70 hover:text-white transition-all p-0.5 rounded"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
                <div className="flex flex-col items-center gap-1 text-center">
                  <p className="text-xs font-bold text-white leading-tight line-clamp-3 break-words w-full">
                    {folder}
                  </p>
                  <p className={cn('text-[10px]', color.count)}>
                    {count === 0 ? 'Empty' : `${count} item${count !== 1 ? 's' : ''}`}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Files list */}
      {currentFiles.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
            Files ({currentFiles.length})
          </p>
          <div className="space-y-1.5">
            {currentFiles.map((file, idx) => (
              <div
                key={idx}
                className="group flex items-center gap-3 bg-card border border-border rounded-xl px-3.5 py-2.5 hover:border-slate-300 transition-colors"
              >
                {getFileIcon(file.type, file.name)}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{file.name}</p>
                  <p className="text-[10px] text-muted-foreground">
                    {formatSize(file.size)}
                    {file.uploadedAt && ` · ${new Date(file.uploadedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`}
                  </p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                  <a
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="p-1.5 hover:bg-sky-50 rounded-lg transition-colors"
                    title="Download"
                  >
                    <Download className="w-3.5 h-3.5 text-sky-600" />
                  </a>
                  <button
                    onClick={() => deleteFile(idx)}
                    className="p-1.5 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {currentFolders.length === 0 && currentFiles.length === 0 && (
        <div className="flex flex-col items-center justify-center py-14 text-muted-foreground">
          <FolderX className="w-12 h-12 mb-3 opacity-20" />
          <p className="text-sm font-medium text-foreground">Empty folder</p>
          <p className="text-xs mt-1 mb-4">Create a sub-folder or upload files here</p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => { setNewFolderName(''); setShowNewFolder(true); }}>
              <FolderPlus className="w-3.5 h-3.5" /> New Folder
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-3.5 h-3.5" /> Upload Files
            </Button>
          </div>
        </div>
      )}

      {/* New Folder Dialog */}
      <Dialog open={showNewFolder} onOpenChange={setShowNewFolder}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-jakarta flex items-center gap-2">
              <FolderPlus className="w-4 h-4 text-amber-500" /> New Folder
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-1">
            <Input
              placeholder="e.g. [JP001B1] 5D4N TOKYO OSAKA"
              value={newFolderName}
              onChange={e => setNewFolderName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && createFolder()}
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowNewFolder(false)}>Cancel</Button>
              <Button size="sm" onClick={createFolder} disabled={!newFolderName.trim()} className="gradient-gold text-white border-0">
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
