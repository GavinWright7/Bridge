import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Upload = () => {
  const navigate = useNavigate();
  const [selectedJob, setSelectedJob] = useState(null);
  const [files, setFiles] = useState({
    resume: null,
    transcript: null
  });
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState({});
  const [error, setError] = useState(null);
  const [generatingPlan, setGeneratingPlan] = useState(false);

  useEffect(() => {
    // Get selected job from localStorage
    const job = JSON.parse(localStorage.getItem('selectedJob') || 'null');
    if (!job) {
      navigate('/jobs'); // Redirect to jobs if no job selected
      return;
    }
    setSelectedJob(job);
  }, [navigate]);

  const handleFileChange = (fileType, e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) { // 10MB limit
        setError(`${fileType} file size must be less than 10MB`);
        return;
      }
      if (!['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(selectedFile.type)) {
        setError(`Please upload a PDF or Word document for ${fileType}`);
        return;
      }
      setFiles(prev => ({ ...prev, [fileType]: selectedFile }));
      setError(null);
    }
  };

  const handleUpload = async (fileType) => {
    const file = files[fileType];
    if (!file) {
      setError(`Please select a ${fileType} to upload`);
      return;
    }

    setUploading(true);
    setError(null);

    const formData = new FormData();
    formData.append(fileType, file);

    try {
      const response = await axios.post(`http://localhost:5001/api/upload-${fileType}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setUploadResults(prev => ({ ...prev, [fileType]: response.data }));
    } catch (err) {
      setError(`Failed to upload ${fileType}. Please try again.`);
    } finally {
      setUploading(false);
    }
  };

  const handleGenerateLearningPlan = async () => {
    if (!uploadResults.resume) {
      setError('Please upload your resume first');
      return;
    }

    setGeneratingPlan(true);
    setError(null);

    try {
      const response = await axios.post('http://localhost:5001/api/generate-learning-plan', {
        selectedJob: selectedJob,
        resumeFile: uploadResults.resume.filename,
        transcriptFile: uploadResults.transcript?.filename
      });

      // Store the learning plan
      localStorage.setItem('learningPlan', JSON.stringify(response.data));
      navigate('/learn');
    } catch (err) {
      setError('Failed to generate learning plan. Please try again.');
    } finally {
      setGeneratingPlan(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (fileType, e) => {
    e.preventDefault();
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      handleFileChange(fileType, { target: { files: [droppedFile] } });
    }
  };

  if (!selectedJob) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Upload Your Documents</h1>
        <p className="text-gray-600 mb-4">
          Upload your resume and transcript to get a personalized 30-day learning plan for your selected career path.
        </p>
        
        {/* Selected Job Info */}
        <div className="bg-primary-50 p-4 rounded-lg mb-6">
          <h3 className="font-semibold text-primary-800">Selected Career Path:</h3>
          <p className="text-primary-700">{selectedJob.title}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8 mb-8">
        {/* Resume Upload */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Resume Upload *</h2>
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              files.resume ? 'border-primary-300 bg-primary-50' : 'border-gray-300 hover:border-primary-300'
            }`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop('resume', e)}
          >
            <div className="w-12 h-12 mx-auto mb-4">
              <svg className="w-full h-full text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>

            {files.resume ? (
              <div>
                <p className="font-medium text-gray-900 mb-2">File Selected:</p>
                <p className="text-primary-600 font-medium">{files.resume.name}</p>
                <p className="text-sm text-gray-500">
                  {(files.resume.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <div>
                <p className="font-medium text-gray-900 mb-2">
                  Drop your resume here, or click to select
                </p>
                <p className="text-gray-500 text-sm">
                  PDF, DOC, or DOCX up to 10MB
                </p>
              </div>
            )}

            <input
              type="file"
              onChange={(e) => handleFileChange('resume', e)}
              accept=".pdf,.doc,.docx"
              className="hidden"
              id="resume-upload"
            />
            <label
              htmlFor="resume-upload"
              className="mt-4 bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors cursor-pointer inline-block"
            >
              Choose File
            </label>
          </div>

          {files.resume && !uploadResults.resume && (
            <button
              onClick={() => handleUpload('resume')}
              disabled={uploading}
              className="w-full mt-4 bg-primary-600 text-white py-2 px-4 rounded-md hover:bg-primary-700 transition-colors disabled:bg-gray-400"
            >
              {uploading ? 'Uploading...' : 'Upload Resume'}
            </button>
          )}

          {uploadResults.resume && (
            <div className="mt-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              <p className="font-medium">Resume uploaded successfully!</p>
            </div>
          )}
        </div>

        {/* Transcript Upload */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Transcript Upload (Optional)</h2>
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              files.transcript ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-green-300'
            }`}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop('transcript', e)}
          >
            <div className="w-12 h-12 mx-auto mb-4">
              <svg className="w-full h-full text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>

            {files.transcript ? (
              <div>
                <p className="font-medium text-gray-900 mb-2">File Selected:</p>
                <p className="text-green-600 font-medium">{files.transcript.name}</p>
                <p className="text-sm text-gray-500">
                  {(files.transcript.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <div>
                <p className="font-medium text-gray-900 mb-2">
                  Drop your transcript here, or click to select
                </p>
                <p className="text-gray-500 text-sm">
                  PDF, DOC, or DOCX up to 10MB
                </p>
              </div>
            )}

            <input
              type="file"
              onChange={(e) => handleFileChange('transcript', e)}
              accept=".pdf,.doc,.docx"
              className="hidden"
              id="transcript-upload"
            />
            <label
              htmlFor="transcript-upload"
              className="mt-4 bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors cursor-pointer inline-block"
            >
              Choose File
            </label>
          </div>

          {files.transcript && !uploadResults.transcript && (
            <button
              onClick={() => handleUpload('transcript')}
              disabled={uploading}
              className="w-full mt-4 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 transition-colors disabled:bg-gray-400"
            >
              {uploading ? 'Uploading...' : 'Upload Transcript'}
            </button>
          )}

          {uploadResults.transcript && (
            <div className="mt-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
              <p className="font-medium">Transcript uploaded successfully!</p>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Generate Learning Plan Button */}
      <div className="text-center">
        <button
          onClick={handleGenerateLearningPlan}
          disabled={!uploadResults.resume || generatingPlan}
          className={`px-8 py-3 rounded-lg font-semibold text-lg transition-colors ${
            !uploadResults.resume || generatingPlan
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-primary-600 to-purple-600 text-white hover:from-primary-700 hover:to-purple-700'
          }`}
        >
          {generatingPlan ? 'Generating Your Learning Plan...' : 'Generate Learning Plan'}
        </button>
        <p className="text-sm text-gray-600 mt-2">
          * Resume upload is required to generate your personalized learning plan
        </p>
      </div>
    </div>
  );
};

export default Upload; 