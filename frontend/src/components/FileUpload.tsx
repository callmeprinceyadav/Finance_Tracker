import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, AlertCircle, CheckCircle, X, Loader2 } from 'lucide-react';
import { financeApi, handleApiError } from '../services/api';
import { FileUploadState, UploadResponse } from '../types';

interface FileUploadProps {
  onUploadSuccess?: (data: UploadResponse) => void;
  onUploadError?: (error: string) => void;
  className?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({ 
  onUploadSuccess, 
  onUploadError,
  className = '' 
}) => {
  const [uploadState, setUploadState] = useState<FileUploadState>({
    isUploading: false,
    progress: 0,
    error: null,
    success: false
  });

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const resetUploadState = () => {
    setUploadState({ isUploading: false, progress: 0, error: null, success: false });
    setUploadedFile(null);
  };

  const handleFileUpload = useCallback(async (file: File) => {
    setUploadedFile(file);
    setUploadState({ isUploading: true, progress: 0, error: null, success: false });

    try {
      const response = await financeApi.uploadBankStatement(
        file,
        (progress) => { setUploadState(prev => ({ ...prev, progress })); }
      );

      if (response.success && response.data) {
        setUploadState({ isUploading: false, progress: 100, error: null, success: true });
        if (onUploadSuccess) onUploadSuccess(response.data);
        setTimeout(() => { resetUploadState(); }, 4000);
      } else {
        throw new Error(response.error || 'Upload failed');
      }
    } catch (error) {
      const errorMessage = handleApiError(error);
      setUploadState({ isUploading: false, progress: 0, error: errorMessage, success: false });
      if (onUploadError) onUploadError(errorMessage);
    }
  }, [onUploadSuccess, onUploadError]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) handleFileUpload(file);
  }, [handleFileUpload]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/csv': ['.csv'],
      'text/plain': ['.txt'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    multiple: false,
    maxSize: 10 * 1024 * 1024,
    disabled: uploadState.isUploading
  });

  const getDropzoneStyle = (): React.CSSProperties => {
    const base: React.CSSProperties = {
      background: 'rgba(30, 41, 59, 0.5)',
      backdropFilter: 'blur(12px)',
      borderRadius: '16px',
      padding: '2.5rem',
      cursor: 'pointer',
      transition: 'all 0.3s ease',
      border: '2px dashed rgba(148, 163, 184, 0.15)',
    };

    if (uploadState.isUploading) {
      return { ...base, borderColor: 'rgba(99, 102, 241, 0.5)', background: 'rgba(99, 102, 241, 0.05)' };
    } else if (uploadState.success) {
      return { ...base, borderColor: 'rgba(16, 185, 129, 0.5)', background: 'rgba(16, 185, 129, 0.05)' };
    } else if (uploadState.error || isDragReject) {
      return { ...base, borderColor: 'rgba(244, 63, 94, 0.5)', background: 'rgba(244, 63, 94, 0.05)' };
    } else if (isDragActive) {
      return { ...base, borderColor: 'rgba(99, 102, 241, 0.5)', background: 'rgba(99, 102, 241, 0.08)', transform: 'scale(1.02)' };
    }
    return base;
  };

  const renderUploadContent = () => {
    if (uploadState.isUploading) {
      return (
        <div className="text-center">
          <div className="mx-auto mb-4 p-3 rounded-2xl gradient-indigo" style={{ width: 'fit-content' }}>
            <Loader2 className="h-8 w-8 text-white animate-spin" />
          </div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: '#e2e8f0' }}>
            Processing your bank statement...
          </h3>
          <p className="text-sm mb-4" style={{ color: '#64748b' }}>
            Analyzing transactions with AI
          </p>
          {uploadedFile && (
            <div className="flex items-center justify-center text-sm mb-4" style={{ color: '#64748b' }}>
              <FileText className="h-4 w-4 mr-2" />
              {uploadedFile.name}
            </div>
          )}
          <div className="w-full rounded-full h-1.5" style={{ background: 'rgba(51, 65, 85, 0.5)' }}>
            <div 
              className="h-1.5 rounded-full transition-all duration-300"
              style={{ 
                width: `${uploadState.progress}%`,
                background: 'linear-gradient(90deg, #6366f1, #8b5cf6)',
                boxShadow: '0 0 10px rgba(99, 102, 241, 0.3)',
              }}
            />
          </div>
          <p className="text-xs mt-2" style={{ color: '#64748b' }}>{uploadState.progress}% complete</p>
        </div>
      );
    }

    if (uploadState.success) {
      return (
        <div className="text-center">
          <div className="mx-auto mb-4 p-3 rounded-2xl gradient-emerald" style={{ width: 'fit-content' }}>
            <CheckCircle className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: '#34d399' }}>
            New Session Started!
          </h3>
          <p className="text-sm" style={{ color: '#64748b' }}>
            Dashboard showing your new data. Previous data preserved.
          </p>
        </div>
      );
    }

    if (uploadState.error) {
      return (
        <div className="text-center">
          <div className="mx-auto mb-4 p-3 rounded-2xl gradient-rose" style={{ width: 'fit-content' }}>
            <AlertCircle className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-lg font-semibold mb-2" style={{ color: '#fb7185' }}>Upload Failed</h3>
          <p className="text-sm mb-4" style={{ color: '#64748b' }}>{uploadState.error}</p>
          <button onClick={resetUploadState} className="text-sm text-primary-500 font-medium">
            Try Again
          </button>
        </div>
      );
    }

    return (
      <div className="text-center">
        <div className="mx-auto mb-4 p-4 rounded-2xl animate-float" style={{ 
          width: 'fit-content',
          background: 'rgba(99, 102, 241, 0.1)',
          border: '1px solid rgba(99, 102, 241, 0.2)',
        }}>
          <Upload className="h-8 w-8" style={{ color: '#818cf8' }} />
        </div>
        <h3 className="text-lg font-semibold mb-2" style={{ color: '#e2e8f0' }}>
          {isDragActive ? 'Drop your file here' : 'Upload Bank Statement'}
        </h3>
        <p className="text-sm mb-4" style={{ color: '#64748b' }}>
          {isDragReject 
            ? 'Invalid file type. Please select a PDF, CSV, or TXT file.'
            : 'Drop your file here, or click to select'
          }
        </p>
        <div className="flex flex-wrap justify-center gap-2 text-xs">
          {['PDF', 'CSV', 'TXT'].map(fmt => (
            <span key={fmt} className="px-3 py-1 rounded-full" style={{ 
              background: 'rgba(51, 65, 85, 0.5)', 
              color: '#94a3b8',
              border: '1px solid rgba(148, 163, 184, 0.1)',
            }}>
              {fmt}
            </span>
          ))}
        </div>
        <p className="text-xs mt-4" style={{ color: '#475569' }}>Maximum file size: 10MB</p>
      </div>
    );
  };

  return (
    <div className={`relative ${className}`}>
      {(uploadState.error || uploadState.success) && (
        <button
          onClick={resetUploadState}
          className="absolute top-2 right-2 z-10 p-1 rounded-full transition-all"
          style={{ color: '#64748b' }}
        >
          <X className="h-4 w-4" />
        </button>
      )}

      <div {...getRootProps()} style={getDropzoneStyle()}>
        <input {...getInputProps()} />
        {renderUploadContent()}
      </div>

      <div className="mt-4 text-sm" style={{ color: '#64748b' }}>
        <h4 className="font-medium mb-2" style={{ color: '#94a3b8' }}>Supported formats:</h4>
        <ul className="text-xs space-y-1">
          <li>• PDF bank statements from most major banks</li>
          <li>• CSV files with Date, Amount, and Description columns</li>
          <li>• Plain text files with transaction data</li>
        </ul>
      </div>
    </div>
  );
};
