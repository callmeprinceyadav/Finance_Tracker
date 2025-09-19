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
    setUploadState({
      isUploading: false,
      progress: 0,
      error: null,
      success: false
    });
    setUploadedFile(null);
  };

  const handleFileUpload = useCallback(async (file: File) => {
    setUploadedFile(file);
    setUploadState({
      isUploading: true,
      progress: 0,
      error: null,
      success: false
    });

    try {
      const response = await financeApi.uploadBankStatement(
        file,
        (progress) => {
          setUploadState(prev => ({ ...prev, progress }));
        }
      );

      if (response.success && response.data) {
        setUploadState({
          isUploading: false,
          progress: 100,
          error: null,
          success: true
        });

        if (onUploadSuccess) {
          onUploadSuccess(response.data);
        }

        console.log('✅ Session-based upload successful:', {
          totalParsed: response.data.totalParsed,
          totalSaved: response.data.totalSaved,
          previousDataPreserved: response.data.previousDataPreserved,
          isNewSession: response.data.isNewSession,
          sessionMessage: response.data.sessionMessage
        });

        // Auto-reset after 4 seconds for session-based uploads
        setTimeout(() => {
          resetUploadState();
        }, 4000);
      } else {
        throw new Error(response.error || 'Upload failed');
      }
    } catch (error) {
      const errorMessage = handleApiError(error);
      setUploadState({
        isUploading: false,
        progress: 0,
        error: errorMessage,
        success: false
      });

      if (onUploadError) {
        onUploadError(errorMessage);
      }

      console.error('❌ Upload failed:', errorMessage);
    }
  }, [onUploadSuccess, onUploadError]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      handleFileUpload(file);
    }
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
    maxSize: 10 * 1024 * 1024, // 10MB
    disabled: uploadState.isUploading
  });

  const getUploadAreaClasses = () => {
    let baseClasses = 'relative border-2 border-dashed rounded-lg p-6 transition-all duration-200 cursor-pointer';
    
    if (uploadState.isUploading) {
      baseClasses += ' border-primary-400 bg-primary-50';
    } else if (uploadState.success) {
      baseClasses += ' border-success-400 bg-success-50';
    } else if (uploadState.error) {
      baseClasses += ' border-danger-400 bg-danger-50';
    } else if (isDragReject) {
      baseClasses += ' border-danger-400 bg-danger-50';
    } else if (isDragActive) {
      baseClasses += ' border-primary-400 bg-primary-50';
    } else {
      baseClasses += ' border-gray-300 bg-gray-50 hover:border-primary-400 hover:bg-primary-50';
    }

    return baseClasses;
  };

  const renderUploadContent = () => {
    if (uploadState.isUploading) {
      return (
        <div className="text-center">
          <Loader2 className="mx-auto h-12 w-12 text-primary-500 animate-spin mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Processing your bank statement...
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            💾 Preserving existing data and analyzing new transactions with AI
          </p>
          
          {uploadedFile && (
            <div className="flex items-center justify-center text-sm text-gray-500 mb-4">
              <FileText className="h-4 w-4 mr-2" />
              {uploadedFile.name}
            </div>
          )}
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadState.progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">{uploadState.progress}% complete</p>
        </div>
      );
    }

    if (uploadState.success) {
      return (
        <div className="text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-success-500 mb-4" />
          <h3 className="text-lg font-medium text-success-900 mb-2">
            New Session Started!
          </h3>
          <p className="text-sm text-success-700">
            🎆 Dashboard showing your new statement data. All previous data preserved in database.
          </p>
        </div>
      );
    }

    if (uploadState.error) {
      return (
        <div className="text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-danger-500 mb-4" />
          <h3 className="text-lg font-medium text-danger-900 mb-2">
            Upload Failed
          </h3>
          <p className="text-sm text-danger-700 mb-4">
            {uploadState.error}
          </p>
          <button
            onClick={resetUploadState}
            className="text-sm text-primary-600 hover:text-primary-800 font-medium"
          >
            Try Again
          </button>
        </div>
      );
    }

    // Default upload state
    return (
      <div className="text-center">
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          {isDragActive ? 'Drop your file here' : 'Upload Bank Statement'}
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          {isDragReject 
            ? 'Invalid file type. Please select a PDF, CSV, or TXT file.'
            : 'Drop your file here, or click to select'
          }
        </p>
        <div className="flex flex-wrap justify-center gap-2 text-xs text-gray-500">
          <span className="px-2 py-1 bg-white rounded border">PDF</span>
          <span className="px-2 py-1 bg-white rounded border">CSV</span>
          <span className="px-2 py-1 bg-white rounded border">TXT</span>
        </div>
        <p className="text-xs text-gray-400 mt-4">Maximum file size: 10MB</p>
      </div>
    );
  };

  return (
    <div className={`relative ${className}`}>
      {/* Close button for error or success states */}
      {(uploadState.error || uploadState.success) && (
        <button
          onClick={resetUploadState}
          className="absolute top-2 right-2 z-10 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-white/50"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      <div
        {...getRootProps()}
        className={getUploadAreaClasses()}
      >
        <input {...getInputProps()} />
        {renderUploadContent()}
      </div>

      {/* Help text */}
      <div className="mt-4 text-sm text-gray-600">
        <h4 className="font-medium mb-2">Supported formats:</h4>
        <ul className="text-xs space-y-1">
          <li>• PDF bank statements from most major banks</li>
          <li>• CSV files with Date, Amount, and Description columns</li>
          <li>• Plain text files with transaction data</li>
        </ul>
      </div>
    </div>
  );
};
