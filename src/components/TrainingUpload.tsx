import { useState } from 'react';
import { Upload, File, FileVideo, FileImage, FileText, X, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
}

export function TrainingUpload() {
  const { user } = useAuth();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const getFileIcon = (type: string) => {
    if (type.startsWith('video/')) return <FileVideo className="text-emerald-400" size={20} />;
    if (type.startsWith('image/')) return <FileImage className="text-blue-400" size={20} />;
    if (type.includes('pdf')) return <FileText className="text-red-400" size={20} />;
    return <File className="text-slate-400" size={20} />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleFiles = async (fileList: FileList) => {
    const newFiles: UploadedFile[] = Array.from(fileList).map((file) => ({
      id: crypto.randomUUID(),
      name: file.name,
      type: file.type,
      size: file.size,
      status: 'uploading',
      progress: 0,
    }));

    setFiles((prev) => [...prev, ...newFiles]);

    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i];
      const uploadFile = newFiles[i];

      try {
        const filePath = `${user?.id}/${uploadFile.id}-${file.name}`;

        const { error: uploadError } = await supabase.storage
          .from('training-materials')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
          });

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('training-materials')
          .getPublicUrl(filePath);

        setFiles((prev) =>
          prev.map((f) =>
            f.id === uploadFile.id ? { ...f, status: 'processing', progress: 100 } : f
          )
        );

        const { error: dbError } = await supabase
          .from('training_materials')
          .insert({
            user_id: user!.id,
            file_name: file.name,
            file_type: file.type,
            file_url: publicUrl,
            file_size: file.size,
            status: 'pending',
          });

        if (dbError) throw dbError;

        setFiles((prev) =>
          prev.map((f) => (f.id === uploadFile.id ? { ...f, status: 'completed' } : f))
        );
      } catch (error) {
        console.error('Upload error:', error);
        setFiles((prev) =>
          prev.map((f) => (f.id === uploadFile.id ? { ...f, status: 'error' } : f))
        );
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Training Materials</h2>
        <p className="text-slate-400">
          Upload PDFs, videos, images, or documents to train the AI on your trading strategy
        </p>
      </div>

      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`border-2 border-dashed rounded-xl p-12 text-center transition-all ${
          isDragging
            ? 'border-emerald-500 bg-emerald-500/5'
            : 'border-slate-700 hover:border-slate-600 bg-slate-800/50'
        }`}
      >
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 flex items-center justify-center">
            <Upload className="text-emerald-400" size={32} />
          </div>
          <div>
            <p className="text-lg font-medium text-white mb-1">Drop files here or click to upload</p>
            <p className="text-sm text-slate-400">
              Supports PDF, MP4, MOV, PNG, JPG, DOCX
            </p>
          </div>
          <input
            type="file"
            multiple
            accept=".pdf,.mp4,.mov,.png,.jpg,.jpeg,.docx,.doc"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
            className="hidden"
            id="file-upload"
          />
          <label
            htmlFor="file-upload"
            className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg cursor-pointer transition-all"
          >
            Select Files
          </label>
        </div>
      </div>

      {files.length > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Uploaded Files</h3>
          <div className="space-y-3">
            {files.map((file) => (
              <div
                key={file.id}
                className="flex items-center gap-3 p-3 bg-slate-900 rounded-lg border border-slate-700"
              >
                <div className="flex-shrink-0">{getFileIcon(file.type)}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{file.name}</p>
                  <p className="text-xs text-slate-400">{formatFileSize(file.size)}</p>
                </div>
                <div className="flex items-center gap-2">
                  {file.status === 'uploading' && (
                    <div className="w-5 h-5 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
                  )}
                  {file.status === 'processing' && (
                    <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
                  )}
                  {file.status === 'completed' && <CheckCircle className="text-emerald-400" size={20} />}
                  {file.status === 'error' && <AlertCircle className="text-red-400" size={20} />}
                  <button
                    onClick={() => removeFile(file.id)}
                    className="p-1 hover:bg-slate-800 rounded transition-colors"
                  >
                    <X className="text-slate-400 hover:text-white" size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
