import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Jobs = () => {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userPreferences, setUserPreferences] = useState(null);

  useEffect(() => {
    // Get user preferences from localStorage
    const preferences = JSON.parse(localStorage.getItem('userPreferences') || '{}');
    if (!preferences.activities || !preferences.skills) {
      navigate('/'); // Redirect to home if no preferences
      return;
    }
    setUserPreferences(preferences);
    fetchCareerRecommendations(preferences);
  }, [navigate]);

  const fetchCareerRecommendations = async (preferences) => {
    try {
      setLoading(true);
      const response = await axios.post('http://localhost:5001/api/career-recommendations', {
        salary: preferences.salaryRange ? Math.round((preferences.salaryRange[0] + preferences.salaryRange[1]) / 2) : preferences.salary || 75000,
        activities: preferences.activities,
        skills: preferences.skills
      });
      setJobs(response.data.careers || []);
    } catch (err) {
      setError('Failed to fetch career recommendations');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectJob = (job) => {
    // Store selected job for the upload page
    localStorage.setItem('selectedJob', JSON.stringify(job));
    navigate('/upload');
  };

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600 mb-4"></div>
        <p className="text-gray-600">Finding perfect career matches for you...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
        <button
          onClick={() => navigate('/')}
          className="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700"
        >
          Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Career Recommendations</h1>
        <p className="text-gray-600">
          Based on your preferences, here are personalized career paths that align with your interests and skills.
        </p>
        {userPreferences && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <div className="text-sm text-gray-700">
              <strong>Your Preferences:</strong>
              <div className="mt-2">
                <span className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs mr-2 mb-1">
                  Salary: {userPreferences.salaryRange 
                    ? `$${Math.round(userPreferences.salaryRange[0]/1000)}k - $${Math.round(userPreferences.salaryRange[1]/1000)}k`
                    : `$${userPreferences.salary?.toLocaleString()}`
                  }
                </span>
                {userPreferences.activities?.map(activity => (
                  <span key={activity} className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs mr-2 mb-1">
                    {activity}
                  </span>
                ))}
                {userPreferences.skills?.map(skill => (
                  <span key={skill} className="inline-block bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs mr-2 mb-1">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Job Cards */}
      <div className="grid md:grid-cols-2 gap-6">
        {jobs.map((job, index) => (
          <div key={index} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow border-l-4 border-primary-500">
            <div className="mb-4">
              <h3 className="text-2xl font-bold text-gray-900 mb-3 leading-tight">{job.title}</h3>
              <p className="text-gray-600 mb-4 leading-relaxed">{job.description}</p>
              
              <div className="mb-4 bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <span className="text-sm font-medium text-gray-700">Salary Range</span>
                    <div className="text-lg font-bold text-primary-600">{job.salaryRange}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-medium text-gray-700">Match Score</span>
                    <div className="text-lg font-bold text-green-600">{job.matchScore}%</div>
                  </div>
                </div>
              </div>

              <div className="mb-4">
                <h4 className="text-sm font-semibold text-gray-800 mb-3">Required Skills</h4>
                <div className="flex flex-wrap gap-2">
                  {job.requiredSkills?.map((skill, skillIndex) => (
                    <span
                      key={skillIndex}
                      className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full font-medium"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-sm font-semibold text-gray-800 mb-2">Growth Potential</h4>
                <p className="text-sm text-gray-600 leading-relaxed">{job.growthPotential}</p>
              </div>
            </div>

            <button
              onClick={() => handleSelectJob(job)}
              className="w-full bg-primary-600 text-white py-3 px-6 rounded-lg hover:bg-primary-700 transition-colors font-semibold text-lg shadow-md hover:shadow-lg"
            >
              Select This Career Path
            </button>
          </div>
        ))}
      </div>

      {jobs.length === 0 && !loading && (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No career recommendations found.</p>
          <button
            onClick={() => navigate('/')}
            className="bg-primary-600 text-white px-6 py-2 rounded-md hover:bg-primary-700"
          >
            Try Different Preferences
          </button>
        </div>
      )}
    </div>
  );
};

export default Jobs; 