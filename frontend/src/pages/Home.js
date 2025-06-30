import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import DoubleRangeSlider from '../components/DoubleRangeSlider';

const Home = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    salaryRange: [60000, 120000],
    activities: [],
    skills: []
  });

  const activities = [
    'Building things',
    'Helping people',
    'Solving problems',
    'Teaching others',
    'Creating art',
    'Analyzing data',
    'Leading teams',
    'Writing content'
  ];

  const skills = [
    'Excel',
    'Python',
    'Writing',
    'Leadership',
    'JavaScript',
    'Project Management',
    'Public Speaking',
    'Data Analysis',
    'Design',
    'Marketing'
  ];

  const handleActivityChange = (activity) => {
    setFormData(prev => ({
      ...prev,
      activities: prev.activities.includes(activity)
        ? prev.activities.filter(a => a !== activity)
        : [...prev.activities, activity]
    }));
  };

  const handleSkillChange = (skill) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.includes(skill)
        ? prev.skills.filter(s => s !== skill)
        : [...prev.skills, skill]
    }));
  };

  const handleContinue = () => {
    // Store form data in localStorage to pass to jobs page
    localStorage.setItem('userPreferences', JSON.stringify(formData));
    navigate('/jobs');
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Welcome to <span className="text-primary-600">Bridge</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Discover your perfect career path by telling us about your preferences, 
          skills, and goals. Let's bridge the gap between where you are and where you want to be.
        </p>
      </div>

      {/* Preferences Form */}
      <div className="bg-white p-8 rounded-lg shadow-md mb-8">
        <h2 className="text-2xl font-semibold text-gray-900 mb-6">Tell us about yourself</h2>
        
        {/* Salary Range Slider */}
        <div className="mb-8">
          <label className="block text-lg font-medium text-gray-700 mb-4">
            Desired Salary Range
          </label>
          <DoubleRangeSlider
            min={30000}
            max={200000}
            step={5000}
            value={formData.salaryRange}
            onChange={(newRange) => setFormData(prev => ({ ...prev, salaryRange: newRange }))}
            formatValue={(range) => 
              range[0] === range[1] 
                ? `$${Math.round(range[0]/1000)}k` 
                : `$${Math.round(range[0]/1000)}k - $${Math.round(range[1]/1000)}k`
            }
          />
        </div>

        {/* Activities I Like */}
        <div className="mb-8">
          <label className="block text-lg font-medium text-gray-700 mb-4">
            Activities I Like
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {activities.map((activity) => (
              <label
                key={activity}
                className={`flex items-center p-3 rounded-full border-2 cursor-pointer transition-all ${
                  formData.activities.includes(activity)
                    ? 'border-primary-500 bg-primary-50 text-primary-700'
                    : 'border-gray-300 hover:border-primary-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.activities.includes(activity)}
                  onChange={() => handleActivityChange(activity)}
                  className="sr-only"
                />
                <span className="text-sm font-medium">{activity}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Skills I Have */}
        <div className="mb-8">
          <label className="block text-lg font-medium text-gray-700 mb-4">
            Skills I Have
          </label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {skills.map((skill) => (
              <label
                key={skill}
                className={`flex items-center p-3 rounded-full border-2 cursor-pointer transition-all ${
                  formData.skills.includes(skill)
                    ? 'border-green-500 bg-green-50 text-green-700'
                    : 'border-gray-300 hover:border-green-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={formData.skills.includes(skill)}
                  onChange={() => handleSkillChange(skill)}
                  className="sr-only"
                />
                <span className="text-sm font-medium">{skill}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Continue Button */}
        <div className="text-center">
          <button
            onClick={handleContinue}
            disabled={formData.activities.length === 0 || formData.skills.length === 0}
            className={`px-8 py-3 rounded-lg font-semibold text-lg transition-colors ${
              formData.activities.length === 0 || formData.skills.length === 0
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-primary-600 text-white hover:bg-primary-700'
            }`}
          >
            Continue to Job Matching
          </button>
        </div>
      </div>

      {/* Features Preview */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">AI-Powered Matching</h3>
          <p className="text-gray-600 text-sm">Get personalized job recommendations based on your preferences</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">Smart Upload</h3>
          <p className="text-gray-600 text-sm">Upload your documents for personalized learning plans</p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold mb-2">Custom Learning</h3>
          <p className="text-gray-600 text-sm">Get a tailored 30-day learning plan just for you</p>
        </div>
      </div>

      {/* Features Section */}
      <div className="grid md:grid-cols-3 gap-8 mb-12">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2">Job Matching</h3>
          <p className="text-gray-600">
            Find perfect job opportunities tailored to your skills and preferences with our intelligent matching algorithm.
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2">Resume Upload</h3>
          <p className="text-gray-600">
            Easily upload and manage your resume. Our system analyzes your skills to provide better job recommendations.
          </p>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold mb-2">Learning Plans</h3>
          <p className="text-gray-600">
            Create personalized learning paths to develop new skills and advance your career in your chosen field.
          </p>
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-primary-600 text-white rounded-lg p-8 text-center">
        <h2 className="text-3xl font-bold mb-4">Ready to Bridge Your Career Gap?</h2>
        <p className="text-xl mb-6">Join thousands of professionals who have accelerated their careers with Bridge.</p>
        <Link
          to="/learning-plan"
          className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors inline-block"
        >
          Start Learning Today
        </Link>
      </div>
    </div>
  );
};

export default Home; 