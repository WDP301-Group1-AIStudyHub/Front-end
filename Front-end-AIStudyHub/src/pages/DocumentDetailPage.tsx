import { ArrowLeft, Download, FileText } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { StatusBadge } from '../components/management/StatusBadge'
import { useDocumentDetail } from '../hooks/useDocumentDetail'
import { useSubjects } from '../hooks/useSubjects'
import { useToast } from '../hooks/useToast'
import { formatDate, formatFileSize } from '../utils/formatters'

function InfoCard({
  items,
  title,
}: {
  items: { label: string; value: string | number }[]
  title: string
}) {
  return (
    <section className="celestial-card tone-surface tone-sapphire p-5">
      <h2 className="text-lg font-semibold">{title}</h2>
      <dl className="mt-4 grid gap-4 sm:grid-cols-2">
        {items.map((item) => (
          <div className="min-w-0" key={item.label}>
            <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-muted-foreground">
              {item.label}
            </dt>
            <dd className="mt-1 truncate text-sm">{item.value || 'None'}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

export default function DocumentDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { document, error, isLoading } = useDocumentDetail(id)
  const { subjects } = useSubjects()
  const { showToast } = useToast()
  const subject = subjects.find((item) => item._id === document?.subjectId)
  const subjectLabel = subject
    ? [subject.code, subject.name].filter(Boolean).join(' ')
    : document?.subject || 'Unsorted'

  function handleDownload() {
    if (document?.fileUrl) {
      window.open(document.fileUrl, '_blank', 'noopener,noreferrer')
      return
    }

    showToast({ tone: 'warning', message: 'Download URL is not available' })
  }

  return (
    <main className="celestial-page flex min-h-svh w-full min-w-0 flex-col overflow-y-auto text-foreground">
      <div className="mx-auto flex w-full min-w-0 max-w-7xl flex-1 flex-col gap-6 px-5 py-6 sm:px-8 lg:px-10">
        <header className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <Button onClick={() => navigate('/library')} type="button" variant="ghost">
              <ArrowLeft data-icon="inline-start" aria-hidden="true" />
              Back To Documents
            </Button>
            <h1 className="celestial-title mt-3 truncate text-3xl font-semibold tracking-tight md:text-5xl">
              {isLoading ? 'Document detail' : document?.title || 'Document detail'}
            </h1>
          </div>
          <Button disabled={!document} onClick={handleDownload} type="button">
            <Download data-icon="inline-start" aria-hidden="true" />
            Download Document
          </Button>
        </header>

        {error ? (
          <div className="celestial-card tone-surface tone-coral px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        ) : null}

        {isLoading ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <section className="celestial-card p-5" key={index}>
                <Skeleton className="h-6 w-48" />
                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  {Array.from({ length: 6 }).map((__, itemIndex) => (
                    <Skeleton className="h-10" key={itemIndex} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : null}

        {!isLoading && document ? (
          <>
            <div className="grid gap-4 lg:grid-cols-2">
              <InfoCard
                title="Document Information"
                items={[
                  { label: 'Title', value: document.title },
                  { label: 'Description', value: document.description || 'No description' },
                  { label: 'Subject', value: subjectLabel },
                  { label: 'Visibility', value: document.visibility || 'Private' },
                  { label: 'Status', value: document.status },
                  { label: 'File Type', value: document.fileType || 'Unknown' },
                  { label: 'File Size', value: formatFileSize(document.fileSize) },
                  { label: 'Total Views', value: document.totalViews },
                  { label: 'Total Downloads', value: document.totalDownloads },
                  { label: 'Total Versions', value: document.totalVersions ?? document.versions?.length ?? 0 },
                  { label: 'Created Date', value: formatDate(document.createdAt) },
                  { label: 'Updated Date', value: formatDate(document.updatedAt) },
                ]}
              />

              <InfoCard
                title="File Information"
                items={[
                  { label: 'Original File Name', value: document.originalFileName || document.fileName || 'Unknown' },
                  { label: 'Stored File Name', value: document.storedFileName || 'Unknown' },
                  { label: 'MIME Type', value: document.mimeType || document.fileType || 'Unknown' },
                ]}
              />

              <InfoCard
                title="Processing Information"
                items={[
                  { label: 'Extraction Status', value: document.extractionStatus || document.status },
                  { label: 'Total Chunks', value: document.totalChunks ?? 0 },
                  { label: 'Last Indexed At', value: formatDate(document.lastIndexedAt) },
                ]}
              />
            </div>

            <section className="celestial-card celestial-table tone-surface tone-sapphire overflow-hidden">
              <div className="flex items-center gap-3 p-5">
                <div className="admin-icon-badge admin-tone-blue flex size-9 items-center justify-center rounded-lg">
                  <FileText aria-hidden="true" />
                </div>
                <h2 className="text-lg font-semibold">Version Information</h2>
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Version Number</TableHead>
                    <TableHead>Upload Mode</TableHead>
                    <TableHead>Upload Date</TableHead>
                    <TableHead>Processing Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(document.versions ?? []).map((version) => (
                    <TableRow key={version._id ?? version.versionNumber}>
                      <TableCell>{version.versionNumber}</TableCell>
                      <TableCell>{version.uploadMode}</TableCell>
                      <TableCell>{formatDate(version.uploadDate)}</TableCell>
                      <TableCell><StatusBadge status={version.processingStatus} /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {(document.versions ?? []).length === 0 ? (
                <div className="border-t border-border p-8 text-center text-sm text-muted-foreground">
                  No version history available.
                </div>
              ) : null}
            </section>

            <div className="flex flex-wrap justify-end gap-2">
              <Button asChild variant="secondary">
                <Link to="/library">Back To Documents</Link>
              </Button>
              <Button onClick={handleDownload} type="button">
                <Download data-icon="inline-start" aria-hidden="true" />
                Download Document
              </Button>
            </div>
          </>
        ) : null}
      </div>
    </main>
  )
}
