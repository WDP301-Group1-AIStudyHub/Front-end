export function formatFileSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 B'
  }

  const units = ['B', 'KB', 'MB', 'GB']
  const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / 1024 ** index

  return `${value >= 10 || index === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[index]}`
}

export function formatDate(value: string | undefined): string {
  if (!value) {
    return 'Unknown'
  }

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return 'Unknown'
  }

  return new Intl.DateTimeFormat(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

export function getFileBadgeClass(fileName: string | undefined): string {
  if (!fileName) return "file-txt-badge";
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "file-pdf-badge";
  if (ext === "docx" || ext === "doc") return "file-docx-badge";
  if (ext === "xlsx" || ext === "xls") return "file-xlsx-badge";
  if (ext === "pptx" || ext === "ppt") return "file-pptx-badge";
  return "file-txt-badge";
}

export function getFileIconColorClass(fileName: string | undefined): string {
  if (!fileName) return "text-muted-foreground";
  const ext = fileName.split(".").pop()?.toLowerCase();
  if (ext === "pdf") return "text-red-500";
  if (ext === "docx" || ext === "doc") return "text-blue-500";
  if (ext === "xlsx" || ext === "xls") return "text-green-600";
  if (ext === "pptx" || ext === "ppt") return "text-orange-500";
  return "text-muted-foreground";
}

