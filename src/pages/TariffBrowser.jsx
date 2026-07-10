// @ts-nocheck
import { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import {
  FolderPlus, Upload, ChevronRight, Home,
  File, Download, Trash2, Loader2, FileText, Image as ImageIcon,
  Film, FolderX, MoreVertical, FolderOpen, Pencil, UploadCloud, Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

const CARD_VARIANTS = [
  { from: '#0a0a0f', to: '#2d1b69', border: 'rgba(139,92,246,0.5)',  glow: 'rgba(139,92,246,0.45)' },
  { from: '#0d0d0d', to: '#1e0a3c', border: 'rgba(168,85,247,0.4)',  glow: 'rgba(168,85,247,0.4)'  },
  { from: '#050510', to: '#3b0764', border: 'rgba(192,132,252,0.5)', glow: 'rgba(192,132,252,0.4)' },
  { from: '#0a0a0a', to: '#1a0533', border: 'rgba(147,51,234,0.5)',  glow: 'rgba(147,51,234,0.45)' },
  { from: '#08080f', to: '#240d55', border: 'rgba(167,139,250,0.5)', glow: 'rgba(167,139,250,0.4)' },
  { from: '#0c0c0c', to: '#1b0545', border: 'rgba(216,180,254,0.4)', glow: 'rgba(216,180,254,0.35)'},
];

const SEED_DATA = {
  '.LAND ARRANGEMENT.': {
    folders: [
      '[AFSO1B1] 4D3N',
      '[GJT1B1] REYKJAVIK',
      '[KPS1B1] 9D8N BEST OF',
      'CANADA',
      'CHINA',
      '[EOJP1B1] TOKYO JAPAN',
      'HONGKONG',
      'KOREA',
      'SINGAPORE',
      'TAIWAN',
      'THAILAND',
      'VIETNAM',
    ],
    files: [],
  },
};

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveData(SEED_DATA);
      return SEED_DATA;
    }
    const parsed = JSON.parse(raw);
    // Seed Land Arrangement if not yet seeded
    if (!parsed['.LAND ARRANGEMENT.']) {
      const merged = { ...SEED_DATA, ...parsed };
      saveData(merged);
      return merged;
    }
    return parsed;
  } catch { return SEED_DATA; }
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
  const [showNewFolder, setShowNewFolder]   = useState(false);
  const [newFolderName, setNewFolderName]   = useState('');
  const [showRename, setShowRename]         = useState(false);
  const [renamingFolder, setRenamingFolder] = useState('');
  const [renameValue, setRenameValue]       = useState('');
  const [uploading, setUploading]           = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const fileInputRef     = useRef(null);
  const folderUploadRefs = useRef({});

  const key      = pathKey(path);
  const isRoot   = path.length === 0;
  const entry    = data[key] || { folders: [], files: [] };

  const extraRootFolders = (data['']?.folders || []).filter(f => !ROOT_FOLDERS.includes(f));
  const currentFolders   = isRoot ? [...ROOT_FOLDERS, ...extraRootFolders] : (entry.folders || []);
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
    if (isRoot && ROOT_FOLDERS.includes(name)) return;
    mutate(d => { if (d[key]) d[key].folders = (d[key].folders || []).filter(f => f !== name); });
  }

  function openRename(name) {
    setRenamingFolder(name);
    setRenameValue(name);
    setShowRename(true);
  }

  function doRename() {
    const next = renameValue.trim();
    if (!next || next === renamingFolder) { setShowRename(false); return; }
    mutate(d => {
      // rename in parent folder list
      if (!d[key]) d[key] = { folders: [], files: [] };
      d[key].folders = (d[key].folders || []).map(f => f === renamingFolder ? next : f);
      // move child data to new key
      const oldChildKey = pathKey([...path, renamingFolder]);
      const newChildKey = pathKey([...path, next]);
      if (d[oldChildKey]) { d[newChildKey] = d[oldChildKey]; delete d[oldChildKey]; }
    });
    setShowRename(false);
  }

  async function uploadToFolder(folderName, e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    setUploading(true);
    const folderKey = pathKey([...path, folderName]);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(`Uploading ${i + 1}/${files.length}: ${file.name}`);
        const { file_url } = await base44.integrations.Core.UploadFile({ file });
        setData(prev => {
          const next = { ...prev };
          if (!next[folderKey]) next[folderKey] = { folders: [], files: [] };
          next[folderKey].files = [...(next[folderKey].files || []), {
            name: file.name, url: file_url, type: file.type,
            size: file.size, uploadedAt: new Date().toISOString(),
          }];
          saveData(next);
          return next;
        });
      }
    } finally {
      setUploading(false);
      setUploadProgress('');
      e.target.value = '';
    }
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
        <Button
          size="sm"
          variant="outline"
          className="gap-1.5 text-xs h-8"
          onClick={() => { setNewFolderName(''); setShowNewFolder(true); }}
        >
          <FolderPlus className="w-3.5 h-3.5" /> New Folder
        </Button>
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
            const count      = childCount(folder);
            const v          = CARD_VARIANTS[idx % CARD_VARIANTS.length];
            const isBuiltIn  = isRoot && ROOT_FOLDERS.includes(folder);
            const folderKey  = pathKey([...path, folder]);
            return (
              <div
                key={folder}
                className="group relative rounded-xl select-none overflow-hidden"
                style={{
                  background: `linear-gradient(135deg, ${v.from} 0%, ${v.to} 100%)`,
                  border: `1px solid ${v.border}`,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
                  transition: 'transform 0.18s ease, box-shadow 0.18s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'translateY(-3px) scale(1.03)';
                  e.currentTarget.style.boxShadow = `0 8px 24px ${v.glow}, 0 0 0 1px ${v.border}`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'translateY(0) scale(1)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.5)';
                }}
              >
                {/* Shimmer overlay */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.04) 0%, transparent 60%)' }} />

                {/* Top accent line */}
                <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-xl"
                  style={{ background: `linear-gradient(90deg, transparent, ${v.border}, transparent)` }} />

                {/* Hidden file input per folder */}
                <input
                  type="file" multiple className="hidden"
                  ref={el => { folderUploadRefs.current[folder] = el; }}
                  onChange={e => uploadToFolder(folder, e)}
                />

                {/* Card body — clickable area */}
                <div
                  className="relative p-3.5 pr-8 cursor-pointer"
                  onClick={() => navigate(folder)}
                >
                  <p className="text-xs font-bold text-white leading-tight line-clamp-3 break-words tracking-wide">
                    {folder}
                  </p>
                  <p className="text-[10px] text-purple-300/60 mt-1.5">
                    {count === 0 ? 'Empty' : `${count} item${count !== 1 ? 's' : ''}`}
                  </p>
                </div>

                {/* Three-dot menu button */}
                <div className="absolute top-2 right-1.5" onClick={e => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-white/10">
                        <MoreVertical className="w-3.5 h-3.5 text-white/80" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44 text-xs">
                      <DropdownMenuItem onClick={() => navigate(folder)} className="gap-2 text-xs cursor-pointer">
                        <FolderOpen className="w-3.5 h-3.5" /> Open
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => folderUploadRefs.current[folder]?.click()}
                        className="gap-2 text-xs cursor-pointer"
                      >
                        <UploadCloud className="w-3.5 h-3.5" /> Upload Files
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => openRename(folder)}
                        className="gap-2 text-xs cursor-pointer"
                        disabled={isBuiltIn}
                      >
                        <Pencil className="w-3.5 h-3.5" /> Rename
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => deleteFolder(folder)}
                        className="gap-2 text-xs cursor-pointer text-rose-500 focus:text-rose-500"
                        disabled={isBuiltIn}
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
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

      {/* Rename Dialog */}
      <Dialog open={showRename} onOpenChange={setShowRename}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-jakarta flex items-center gap-2">
              <Pencil className="w-4 h-4 text-purple-500" /> Rename Folder
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-1">
            <Input
              value={renameValue}
              onChange={e => setRenameValue(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && doRename()}
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <Button variant="outline" size="sm" onClick={() => setShowRename(false)}>Cancel</Button>
              <Button size="sm" onClick={doRename} disabled={!renameValue.trim()} className="gradient-gold text-white border-0">
                Rename
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
