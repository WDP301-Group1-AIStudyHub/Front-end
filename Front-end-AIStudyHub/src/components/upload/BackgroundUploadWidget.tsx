import { useState } from 'react'
import { useUploadStore } from '../../store/useUploadStore'
import { 
  ChevronDown, 
  ChevronUp, 
  X, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  FileText, 
  Upload,
  Sparkles
} from 'lucide-react'

export default function BackgroundUploadWidget() {
  const { uploads, cancelUpload, cancelAll, removeUpload, clearFinished } = useUploadStore()
  const [isExpanded, setIsExpanded] = useState(true)
  const [activeTab, setActiveTab] = useState<'all' | 'completed' | 'failed'>('all')

  if (uploads.length === 0) {
    return null
  }

  // Count stats
  const activeCount = uploads.filter(
    (u) => u.status === 'uploading' || u.status === 'processing' || u.status === 'pending'
  ).length
  const completedCount = uploads.filter((u) => u.status === 'success').length
  const failedCount = uploads.filter((u) => u.status === 'failed').length

  // Filter items
  const filteredUploads = uploads.filter((u) => {
    if (activeTab === 'completed') return u.status === 'success'
    if (activeTab === 'failed') return u.status === 'failed'
    return true
  })

  const getFileExtension = (fileName: string) => {
    const parts = fileName.split('.')
    return parts.length > 1 ? parts[parts.length - 1].toUpperCase() : 'FILE'
  }

  // Minimized view (just the bar)
  if (!isExpanded) {
    return (
      <div 
        onClick={() => setIsExpanded(true)}
        className="fixed bottom-4 right-4 z-50 flex items-center justify-between w-80 bg-[#0061fe] hover:bg-[#0052d4] text-white px-4 py-3 rounded-lg shadow-lg cursor-pointer transition-all duration-200 select-none"
      >
        <div className="flex items-center gap-2 font-medium text-sm">
          {activeCount > 0 ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          <span>
            {activeCount > 0 
              ? `Uploading ${activeCount} item${activeCount > 1 ? 's' : ''}`
              : `Uploads complete (${completedCount} success)`}
          </span>
        </div>
        <ChevronUp className="h-4 w-4 opacity-80" />
      </div>
    )
  }

  // Expanded card view (Dropbox style)
  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 bg-[#1e1e1e] border border-neutral-800 rounded-xl shadow-2xl overflow-hidden flex flex-col font-sans select-none">
      
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#1e1e1e] border-b border-neutral-800">
        <span className="text-white font-semibold text-base">Uploads</span>
        <div className="flex items-center gap-3">
          {activeCount > 0 && (
            <button 
              onClick={cancelAll}
              className="text-xs text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 px-2.5 py-1 rounded transition-colors cursor-pointer"
            >
              Cancel all
            </button>
          )}
          <button 
            onClick={() => setIsExpanded(false)}
            className="text-neutral-400 hover:text-white p-1 rounded hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1.5 px-4 py-3 bg-[#1e1e1e]">
        <button
          onClick={() => setActiveTab('all')}
          className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all cursor-pointer ${
            activeTab === 'all'
              ? 'bg-neutral-800 text-white shadow-sm'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          All uploads ({uploads.length})
        </button>
        <button
          onClick={() => setActiveTab('completed')}
          className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all cursor-pointer ${
            activeTab === 'completed'
              ? 'bg-neutral-800 text-white shadow-sm'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Completed ({completedCount})
        </button>
        <button
          onClick={() => setActiveTab('failed')}
          className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all cursor-pointer ${
            activeTab === 'failed'
              ? 'bg-neutral-800 text-white shadow-sm'
              : 'text-neutral-400 hover:text-neutral-200'
          }`}
        >
          Failed ({failedCount})
        </button>
      </div>

      {/* Uploading to path info */}
      <div className="px-4 pb-2 bg-[#1e1e1e] text-[11px] text-neutral-400">
        Uploading to <span className="underline cursor-default hover:text-neutral-200">Library</span>
      </div>

      {/* Item List */}
      <div className="flex-1 max-h-64 overflow-y-auto divide-y divide-neutral-800 bg-[#1a1a1a]">
        {filteredUploads.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-neutral-500">
            <FileText className="h-8 w-8 stroke-1 mb-2 opacity-50" />
            <p className="text-xs">No uploads in this tab</p>
          </div>
        ) : (
          filteredUploads.map((item) => (
            <div key={item.id} className="relative p-4 flex flex-col bg-[#1a1a1a] hover:bg-[#202020] transition-colors group">
              <div className="flex items-start justify-between gap-3">
                
                {/* File Info */}
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  {/* Status Icon */}
                  <div className="flex-shrink-0 text-neutral-400">
                    {item.status === 'uploading' && (
                      <Loader2 className="h-4 w-4 animate-spin text-[#0061fe]" />
                    )}
                    {item.status === 'processing' && (
                      <Sparkles className="h-4 w-4 animate-pulse text-violet-400" />
                    )}
                    {item.status === 'success' && (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    )}
                    {item.status === 'failed' && (
                      <AlertCircle className="h-4 w-4 text-rose-500" />
                    )}
                    {item.status === 'pending' && (
                      <Loader2 className="h-4 w-4 animate-spin opacity-50" />
                    )}
                  </div>

                  {/* Filename & Badge */}
                  <div className="min-w-0 flex-1 flex flex-col">
                    <span className="text-sm font-semibold text-neutral-200 truncate pr-2" title={item.fileName}>
                      {item.fileName}
                    </span>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[10px] font-bold text-neutral-300 bg-neutral-800 px-1.5 py-0.5 rounded uppercase">
                        {getFileExtension(item.fileName)}
                      </span>
                      <span className="text-[11px] text-neutral-400 truncate">
                        {item.status === 'pending' && 'Queued...'}
                        {item.status === 'uploading' && `Uploading (${item.progress}%)`}
                        {item.status === 'processing' && (item.progress >= 95 ? 'AI chunking & indexing...' : 'Extracting text...')}
                        {item.status === 'success' && 'Completed'}
                        {item.status === 'failed' && (item.error || 'Failed')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex-shrink-0">
                  {item.status === 'uploading' || item.status === 'processing' || item.status === 'pending' ? (
                    <button
                      onClick={() => cancelUpload(item.id)}
                      className="text-xs text-neutral-400 hover:text-white bg-neutral-800 hover:bg-neutral-700 px-2 py-1 rounded transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                  ) : (
                    <button
                      onClick={() => removeUpload(item.id)}
                      className="text-neutral-400 hover:text-neutral-200 p-1 rounded hover:bg-neutral-800 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 cursor-pointer"
                    >
                      <X className="h-4.5 w-4.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Individual Progress Bar */}
              {(item.status === 'uploading' || item.status === 'processing') && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-800">
                  <div 
                    className="h-full bg-[#0061fe] transition-all duration-200"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#0061fe] text-white">
        <div className="flex items-center gap-2">
          {activeCount > 0 ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          <span className="font-semibold text-sm">
            {activeCount > 0 
              ? `Uploading ${activeCount} item${activeCount > 1 ? 's' : ''}`
              : `All uploads completed (${completedCount} success)`}
          </span>
        </div>
        
        {activeCount === 0 && (
          <button 
            onClick={clearFinished}
            className="text-xs bg-white/20 hover:bg-white/30 text-white font-medium px-2.5 py-1 rounded transition-colors cursor-pointer"
          >
            Clear all
          </button>
        )}
      </div>
    </div>
  )
}
