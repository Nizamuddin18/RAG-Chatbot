import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, CheckCircle, XCircle } from 'lucide-react';
import { useDocumentStore } from '../../store/documentStore';
import { formatFileSize } from '../../utils/errorHandler';
import Spinner from '../ui/Spinner';

interface UploadingFile {
  file: File;
  status: 'uploading' | 'success' | 'error';
  error?: string;
}

const DocumentUpload: React.FC = () => {
  const { uploadDocument, isLoading } = useDocumentStore();
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      console.log('Files dropped:', acceptedFiles);

      // Initialize uploading files
      const newFiles: UploadingFile[] = acceptedFiles.map(file => ({
        file,
        status: 'uploading' as const,
      }));
      setUploadingFiles(newFiles);

      // Upload each file
      for (let i = 0; i < acceptedFiles.length; i++) {
        const file = acceptedFiles[i];
        console.log('Uploading file:', file.name);

        try {
          const result = await uploadDocument(file);

          if (result) {
            console.log('Upload successful:', result);
            setUploadingFiles(prev =>
              prev.map((f, idx) =>
                idx === i ? { ...f, status: 'success' as const } : f
              )
            );
          } else {
            console.error('Upload failed for:', file.name);
            setUploadingFiles(prev =>
              prev.map((f, idx) =>
                idx === i ? { ...f, status: 'error' as const, error: 'Upload failed' } : f
              )
            );
          }
        } catch (error) {
          console.error('Upload error:', error);
          setUploadingFiles(prev =>
            prev.map((f, idx) =>
              idx === i
                ? {
                    ...f,
                    status: 'error' as const,
                    error: error instanceof Error ? error.message : 'Upload failed',
                  }
                : f
            )
          );
        }
      }

      // Clear after a delay
      setTimeout(() => {
        setUploadingFiles([]);
      }, 3000);
    },
    [uploadDocument]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    maxSize: Number(import.meta.env.VITE_MAX_FILE_SIZE) || 15728640, // 15MB default
    multiple: true,
    disabled: isLoading,
  });

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors duration-200 ${
          isDragActive
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
        } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />
        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        {isDragActive ? (
          <p className="text-lg font-medium text-primary-600">Drop the files here...</p>
        ) : (
          <>
            <p className="text-lg font-medium text-gray-700 mb-2">
              Drag & drop PDF files here, or click to select files
            </p>
            <p className="text-sm text-gray-500">
              Only PDF files up to 15MB are accepted
            </p>
          </>
        )}
      </div>

      {uploadingFiles.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-sm font-medium text-gray-700">Upload Status:</p>
          {uploadingFiles.map((item, index) => (
            <div
              key={index}
              className={`flex items-center justify-between p-3 rounded-lg ${
                item.status === 'success'
                  ? 'bg-green-50 border border-green-200'
                  : item.status === 'error'
                  ? 'bg-red-50 border border-red-200'
                  : 'bg-blue-50 border border-blue-200'
              }`}
            >
              <div className="flex items-center space-x-3">
                {item.status === 'uploading' && <Spinner size="sm" />}
                {item.status === 'success' && (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                )}
                {item.status === 'error' && <XCircle className="w-5 h-5 text-red-600" />}
                <div>
                  <p className="text-sm font-medium text-gray-900">{item.file.name}</p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(item.file.size)}
                    {item.status === 'uploading' && ' - Uploading...'}
                    {item.status === 'success' && ' - Uploaded successfully'}
                    {item.status === 'error' && ` - ${item.error || 'Upload failed'}`}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default DocumentUpload;
