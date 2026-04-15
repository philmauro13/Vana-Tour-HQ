'use client'

import { useEffect, useState, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'

interface Doc {
  id: string
  file_name: string
  file_path: string
  file_size: number | null
  mime_type: string | null
  bucket: string
  created_at: string
  tour_id: string | null
}

function formatBytes(bytes: number | null) {
  if (!bytes) return '0 KB'
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

function fileIcon(mime: string | null) {
  if (!mime) return '📄'
  if (mime.includes('pdf')) return '📋'
  if (mime.includes('image')) return '🖼️'
  if (mime.includes('word') || mime.includes('document')) return '📝'
  return '📄'
}

export default function DocumentsPage() {
  const [docs, setDocs] = useState<Doc[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [noTour, setNoTour] = useState(false)
  const [bucketMissing, setBucketMissing] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { loadDocs() }, [])

  async function loadDocs() {
    setLoading(true)
    const tourStored = localStorage.getItem('tourhq_current_tour')
    if (!tourStored) { setNoTour(true); setLoading(false); return }
    let tourId: string
    try { tourId = JSON.parse(tourStored).id } catch { setNoTour(true); setLoading(false); return }

    const userStored = localStorage.getItem('tourhq_current_user')
    if (!userStored) { setNoTour(true); setLoading(false); return }
    const userId = JSON.parse(userStored).id

    const { data, error } = await supabase
      .from('documents')
      .select('id, file_name, file_path, file_size, mime_type, bucket, created_at, tour_id')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      const msg = (error as any).message || ''
      if (msg.includes('bucket') || msg.includes('STORAGE_BUCKET_NOT_FOUND') || msg.includes('not found')) {
        setBucketMissing(true)
      }
    }
    if (data) setDocs(data)
    setLoading(false)
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files || files.length === 0) return

    const tourStored = localStorage.getItem('tourhq_current_tour')
    const userStored = localStorage.getItem('tourhq_current_user')
    if (!tourStored || !userStored) return

    const tourId = JSON.parse(tourStored).id
    const userId = JSON.parse(userStored).id

    setUploading(true)
    setUploadError('')
    setUploadProgress(`Uploading ${files.length} file(s)...`)

    for (const file of Array.from(files)) {
      const storagePath = `${userId}/${tourId}/${Date.now()}_${file.name.replace(/\s+/g, '_')}`

      const { error: uploadError } = await supabase.storage
        .from('tour-hq-docs')
        .upload(storagePath, file, { upsert: false })

      if (uploadError) {
        const errMsg = (uploadError as any).message || ''
        if (errMsg.includes('bucket') || errMsg.includes('STORAGE_BUCKET_NOT_FOUND') || errMsg.includes('not found')) {
          setBucketMissing(true)
          setUploadError('Storage bucket "tour-hq-docs" not found. Create it in Supabase > Storage > New Bucket, then retry.')
        } else {
          setUploadError(`Upload failed: ${errMsg}`)
        }
        setUploading(false)
        return
      }

      const { data: urlData } = supabase.storage.from('tour-hq-docs').getPublicUrl(storagePath)

      const { error: dbError } = await supabase.from('documents').insert({
        user_id: userId,
        tour_id: tourId,
        file_name: file.name,
        file_path: urlData.publicUrl || storagePath,
        file_size: file.size,
        mime_type: file.type,
        bucket: 'tour-hq-docs',
      })

      if (dbError) { setUploadError(`Failed to save record: ${dbError.message}`) }
    }

    setUploadProgress('')
    setUploading(false)
    if (fileInputRef.current) fileInputRef.current.value = ''
    await loadDocs()
  }

  async function deleteDoc(doc: Doc) {
    setDeletingId(doc.id)
    const pathParts = doc.file_path.split('/tour-hq-docs/')
    const storagePath = pathParts.length > 1 ? pathParts[1] : doc.file_path
    if (storagePath && storagePath !== doc.file_path) {
      await supabase.storage.from('tour-hq-docs').remove([storagePath])
    }
    await supabase.from('documents').delete().eq('id', doc.id)
    setDeletingId(null)
    await loadDocs()
  }

  async function downloadDoc(doc: Doc) {
    const pathParts = doc.file_path.split('/tour-hq-docs/')
    const storagePath = pathParts.length > 1 ? pathParts[1] : doc.file_path
    const { data } = await supabase.storage.from('tour-hq-docs').createSignedUrl(storagePath, 60)
    if (data?.signedUrl) { window.open(data.signedUrl, '_blank') }
  }

  if (noTour) {
    return (
      <div style={{ padding: '2rem 1rem', textAlign: 'center' }}>
        <div style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '0.5rem' }}>No tour selected</div>
        <div style={{ fontSize: '0.85rem', color: '#8888a0', marginBottom: '1rem' }}>Select a tour from the Dashboard first</div>
      </div>
    )
  }

  return (
    <div>
      <div style={{ padding: '1.25rem 1.5rem', textAlign: 'center', borderBottom: '1px solid #1f1f2e' }}>
        <div style={{ fontSize: '1.4rem', fontWeight: 700, letterSpacing: '-0.02em', marginBottom: '0.25rem' }}>Documents</div>
        <div style={{ color: '#8888a0', fontSize: '0.85rem' }}>{docs.length} document{docs.length !== 1 ? 's' : ''} stored securely</div>
      </div>

      {bucketMissing && (
        <div style={{ margin: '1rem', background: 'rgba(245,158,11,0.1)', border: '1px solid #f59e0b', borderRadius: 12, padding: '1rem' }}>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#f59e0b', marginBottom: '0.5rem' }}>⚠️ Storage Bucket Not Found</div>
          <div style={{ fontSize: '0.8rem', color: '#8888a0', lineHeight: 1.6, marginBottom: '0.75rem' }}>
            To enable file uploads, create a Supabase Storage bucket:
            <br />1. Go to <strong style={{ color: '#f0f0f5' }}>Supabase Dashboard → Storage</strong>
            <br />2. Click <strong style={{ color: '#f0f0f5' }}>New Bucket</strong>
            <br />3. Name: <strong style={{ color: '#22d3ee', fontFamily: 'monospace' }}>tour-hq-docs</strong>
            <br />4. Set to <strong style={{ color: '#f0f0f5' }}>Private</strong>
          </div>
          <button onClick={() => { setBucketMissing(false); setUploadError('') }} style={{ background: '#f59e0b', border: 'none', color: '#07070c', padding: '0.4rem 0.75rem', borderRadius: 6, fontSize: '0.75rem', fontWeight: 700, cursor: 'pointer' }}>Dismiss</button>
        </div>
      )}

      {uploadError && (
        <div style={{ margin: '0 1rem 0.75rem', background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', borderRadius: 8, padding: '0.75rem', color: '#ef4444', fontSize: '0.8rem' }}>{uploadError}</div>
      )}

      {uploading && (
        <div style={{ margin: '0 1rem 0.75rem', background: 'rgba(0,119,182,0.1)', border: '1px solid #0077b6', borderRadius: 8, padding: '0.75rem', color: '#0077b6', fontSize: '0.8rem' }}>{uploadProgress}</div>
      )}

      <div style={{ padding: '0 1rem' }}>
        <input ref={fileInputRef} type="file" multiple accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx" onChange={handleFileUpload} style={{ display: 'none' }} id="file-upload" />
        <label htmlFor="file-upload" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', border: '2px dashed #1f1f2e', borderRadius: 14, padding: '1.75rem', cursor: 'pointer', marginBottom: '0.75rem', background: '#101018', gap: '0.5rem' }}>
          <span style={{ fontSize: '2rem' }}>📄</span>
          <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Tap to upload documents</span>
          <span style={{ fontSize: '0.75rem', color: '#8888a0' }}>PDF, JPG, PNG, DOC, XLS — up to 10MB each</span>
        </label>
      </div>

      {loading && <div style={{ textAlign: 'center', padding: '1rem', color: '#8888a0', fontSize: '0.85rem' }}>Loading documents...</div>}

      {!loading && docs.length === 0 && !bucketMissing && (
        <div style={{ textAlign: 'center', padding: '1.5rem 1rem', color: '#555570', fontSize: '0.85rem' }}>No documents uploaded yet. Tap above to upload your first file.</div>
      )}

      {!loading && docs.length > 0 && (
        <div style={{ margin: '0 1rem 1rem', background: '#101018', border: '1px solid #1f1f2e', borderRadius: 14, overflow: 'hidden' }}>
          <div style={{ background: '#181822', padding: '0.75rem 1rem', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#8888a0', borderBottom: '1px solid #1f1f2e' }}>📁 All Documents</div>
          {docs.map((doc, i) => (
            <div key={doc.id} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.875rem 1rem', borderBottom: i < docs.length - 1 ? '1px solid #1f1f2e' : 'none' }}>
              <div style={{ width: 40, height: 40, background: '#181822', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem', flexShrink: 0 }}>{fileIcon(doc.mime_type)}</div>
              <div style={{ flexGrow: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.85rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.file_name}</div>
                <div style={{ fontSize: '0.7rem', color: '#8888a0', marginTop: 2 }}>{formatBytes(doc.file_size)} • {timeAgo(doc.created_at)}</div>
              </div>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button onClick={() => downloadDoc(doc)} style={{ background: '#181822', border: '1px solid #1f1f2e', color: '#8888a0', padding: '0.35rem 0.6rem', borderRadius: 6, fontSize: '0.7rem', cursor: 'pointer' }}>↓</button>
                <button onClick={() => deleteDoc(doc)} disabled={deletingId === doc.id} style={{ background: '#181822', border: '1px solid #1f1f2e', color: '#ef4444', padding: '0.35rem 0.6rem', borderRadius: 6, fontSize: '0.7rem', cursor: deletingId === doc.id ? 'not-allowed' : 'pointer', opacity: deletingId === doc.id ? 0.5 : 1 }}>✕</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}