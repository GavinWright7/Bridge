require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const multer = require('multer');
const path = require('path');
const OpenAI = require('openai');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 5001;

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({ storage: storage });

// Sample data (keeping for backwards compatibility)
const jobs = [
  { id: 1, title: 'Frontend Developer', company: 'TechCorp', location: 'Remote', match: 95 },
  { id: 2, title: 'Full Stack Engineer', company: 'StartupInc', location: 'San Francisco', match: 88 },
  { id: 3, title: 'React Developer', company: 'WebSolutions', location: 'New York', match: 92 },
  { id: 4, title: 'Software Engineer', company: 'BigTech', location: 'Seattle', match: 85 }
];

const learningPlans = [
  { id: 1, title: 'React Mastery', description: 'Master React hooks, context, and advanced patterns', duration: '4 weeks' },
  { id: 2, title: 'Node.js Backend', description: 'Build scalable backend applications with Node.js', duration: '6 weeks' },
  { id: 3, title: 'System Design', description: 'Learn to design large-scale distributed systems', duration: '8 weeks' }
];

// Add file text extraction utilities with PDF support
const pdfParse = require('pdf-parse');

const extractTextFromFile = async (filename) => {
  try {
    const filepath = path.join(__dirname, 'uploads', filename);
    
    if (!fs.existsSync(filepath)) {
      throw new Error(`File not found: ${filename}`);
    }
    
    const fileBuffer = fs.readFileSync(filepath);
    const fileExtension = path.extname(filename).toLowerCase();
    
    let extractedText = '';
    
    if (fileExtension === '.pdf') {
      // Extract text from PDF
      const pdfData = await pdfParse(fileBuffer);
      extractedText = pdfData.text;
    } else if (fileExtension === '.txt') {
      // Extract text from plain text file
      extractedText = fileBuffer.toString('utf-8');
    } else {
      // For other formats, return basic info and suggest manual input
      const stats = fs.statSync(filepath);
      return `File uploaded: ${filename} (${(stats.size / 1024).toFixed(1)}KB). For better results, please ensure your resume is in PDF or text format. This appears to be a ${fileExtension} file which may not extract text properly.`;
    }
    
    // Clean up the extracted text
    extractedText = extractedText
      .replace(/\s+/g, ' ') // Replace multiple spaces with single space
      .replace(/\n\s*\n/g, '\n') // Clean up extra newlines
      .trim();
    
    if (extractedText.length < 50) {
      return `File processed but extracted text seems too short (${extractedText.length} characters). The file may be an image-based PDF or corrupted. Please try uploading a text-based PDF or provide manual text input.`;
    }
    
    console.log(`Successfully extracted ${extractedText.length} characters from ${filename}`);
    return extractedText;
    
  } catch (error) {
    console.error('Error extracting text from file:', error);
    return `Unable to extract text from ${filename}. Error: ${error.message}. Please try uploading a different format or provide manual text input.`;
  }
};

// OpenAI function for career recommendations
const generateCareerRecommendations = async (salary, activities, skills) => {
  try {
    const prompt = `Based on the following user preferences, provide 10 personalized ENTRY-LEVEL career recommendations:

Salary preference: $${salary}
Activities they enjoy: ${activities.join(', ')}
Skills they have: ${skills.join(', ')}

IMPORTANT: Focus ONLY on entry-level positions suitable for recent graduates, career changers, or people starting their careers. Include internships, junior roles, associate positions, and trainee programs.

For each career, provide:
1. title (entry-level job title like "Junior Data Analyst", "Marketing Associate", "Sales Representative")
2. description (2-3 sentences about the entry-level role and what beginners would do)
3. salaryRange (realistic entry-level range like "$35,000 - $55,000" or "$40,000 - $65,000")
4. matchScore (number between 70-99 based on how well it matches their preferences)
5. requiredSkills (array of 3-5 key skills needed for entry-level)
6. growthPotential (1-2 sentences about career growth from this entry-level position)

Return ONLY a valid JSON array of career objects. No markdown formatting, no explanations, just the JSON array.`;

    console.log('Generating career recommendations with OpenAI...');
    
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a career counselor AI that provides personalized job recommendations. You must respond with ONLY valid JSON format - no markdown, no code blocks, no explanations. Just a clean JSON array."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.7,
    });

    const response = completion.choices[0].message.content;
    console.log('OpenAI Response received:', response.substring(0, 200) + '...');
    
    // Multiple attempts to clean and parse the JSON response
    try {
      // First, try to remove common markdown patterns more aggressively
      let cleanedResponse = response
        .replace(/```json\s*/g, '') // Remove ```json with optional whitespace
        .replace(/```\s*/g, '') // Remove ``` with optional whitespace
        .replace(/`{3,}/g, '') // Remove 3 or more backticks
        .replace(/^```.*$/gm, '') // Remove entire lines that start with ```
        .trim();
      
      // If the response starts with any non-JSON characters, try to find the JSON part
      const jsonStart = cleanedResponse.indexOf('[');
      const jsonEnd = cleanedResponse.lastIndexOf(']');
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonStart < jsonEnd) {
        cleanedResponse = cleanedResponse.substring(jsonStart, jsonEnd + 1);
      }
      
      console.log('Cleaned response:', cleanedResponse.substring(0, 200) + '...');
      
      const careers = JSON.parse(cleanedResponse);
      
      // Validate the parsed data
      if (Array.isArray(careers) && careers.length > 0) {
        console.log(`Successfully parsed ${careers.length} career recommendations`);
        return careers.slice(0, 10);
      } else {
        throw new Error('Parsed data is not a valid array of careers');
      }
      
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', parseError);
      console.error('Original response:', response.substring(0, 500) + '...');
      
      // Try one more time with more aggressive cleaning
      try {
        // Find JSON array pattern in the response
        const arrayMatch = response.match(/\[[\s\S]*\]/);
        if (arrayMatch) {
          let jsonStr = arrayMatch[0];
          // Clean up any remaining markdown or special characters
          jsonStr = jsonStr
            .replace(/```/g, '') // Remove all backticks
            .replace(/\n\s*\n/g, '\n') // Clean up extra newlines
            .trim();
          
          const careers = JSON.parse(jsonStr);
          if (Array.isArray(careers) && careers.length > 0) {
            console.log('Successfully parsed with regex extraction');
            return careers.slice(0, 10);
          }
        }
      } catch (secondParseError) {
        console.error('Second parse attempt also failed:', secondParseError);
      }
      
      // If all parsing fails, fall back to mock data
      console.log('Falling back to mock data due to parsing failure');
      return mockGPTCareerRecommendations(salary, activities, skills);
    }
  } catch (error) {
    console.error('OpenAI API error:', error);
    console.log('Falling back to mock data due to API error');
    // Fallback to mock data if OpenAI fails
    return mockGPTCareerRecommendations(salary, activities, skills);
  }
};

// Mock GPT function (fallback)
const mockGPTCareerRecommendations = (salary, activities, skills) => {
  const careerTemplates = [
    {
      title: 'Junior Frontend Developer',
      description: 'Learn to create user interfaces and websites using HTML, CSS, and JavaScript. Work with senior developers to build engaging web experiences.',
      salaryRange: '$40,000 - $65,000',
      matchScore: 92,
      requiredSkills: ['HTML', 'CSS', 'JavaScript', 'Git'],
      growthPotential: 'High demand field with clear progression to senior developer roles'
    },
    {
      title: 'Data Analyst Associate',
      description: 'Analyze data using Excel and basic programming to help businesses make decisions. Perfect starting point for data career.',
      salaryRange: '$35,000 - $55,000',
      matchScore: 88,
      requiredSkills: ['Excel', 'Basic Python', 'Data Visualization', 'Statistics'],
      growthPotential: 'Growing field with opportunities to advance to senior analyst or data scientist'
    },
    {
      title: 'Marketing Coordinator',
      description: 'Support marketing campaigns, manage social media, and help with content creation. Great entry point into marketing.',
      salaryRange: '$32,000 - $48,000',
      matchScore: 85,
      requiredSkills: ['Communication', 'Social Media', 'Content Creation', 'Analytics'],
      growthPotential: 'Can advance to marketing manager and eventually director roles'
    },
    {
      title: 'Junior UX Designer',
      description: 'Learn to design user-friendly digital experiences under guidance of senior designers. Focus on wireframes and user research.',
      salaryRange: '$38,000 - $58,000',
      matchScore: 87,
      requiredSkills: ['Design Software', 'User Research', 'Wireframing', 'Communication'],
      growthPotential: 'Creative field with advancement to senior designer and UX lead positions'
    },
    {
      title: 'Customer Success Representative',
      description: 'Help customers succeed with products and services. Build relationships and solve problems daily.',
      salaryRange: '$35,000 - $50,000',
      matchScore: 83,
      requiredSkills: ['Communication', 'Problem Solving', 'Empathy', 'CRM Software'],
      growthPotential: 'Path to customer success manager and account management roles'
    },
    {
      title: 'Sales Development Representative',
      description: 'Generate leads and qualify prospects for sales team. Learn fundamentals of B2B sales process.',
      salaryRange: '$40,000 - $60,000',
      matchScore: 81,
      requiredSkills: ['Communication', 'Persistence', 'CRM', 'Research'],
      growthPotential: 'Direct path to account executive and sales manager positions'
    },
    {
      title: 'Junior Financial Analyst',
      description: 'Support financial planning and analysis using Excel and financial software. Great entry into finance.',
      salaryRange: '$42,000 - $62,000',
      matchScore: 84,
      requiredSkills: ['Excel', 'Financial Modeling', 'Attention to Detail', 'Communication'],
      growthPotential: 'Clear progression to senior analyst and finance manager roles'
    },
    {
      title: 'Content Creator',
      description: 'Create engaging content for websites, social media, and marketing materials. Perfect for creative individuals.',
      salaryRange: '$30,000 - $45,000',
      matchScore: 86,
      requiredSkills: ['Writing', 'Social Media', 'Basic Design', 'SEO'],
      growthPotential: 'Can advance to content manager and creative director positions'
    }
  ];

  // Filter and score based on user input
  const scoredCareers = careerTemplates.map(career => {
    let score = career.matchScore;
    
    // Adjust score based on skills match
    const matchingSkills = career.requiredSkills.filter(skill => 
      skills.some(userSkill => userSkill.toLowerCase().includes(skill.toLowerCase()))
    );
    score += matchingSkills.length * 2;
    
    // Adjust score based on activities
    if (activities.includes('Building things') && career.title.includes('Developer')) score += 5;
    if (activities.includes('Helping people') && (career.title.includes('Manager') || career.title.includes('Designer'))) score += 5;
    if (activities.includes('Solving problems') && (career.title.includes('Analyst') || career.title.includes('Developer'))) score += 5;
    
    return { ...career, matchScore: Math.min(score, 99) };
  });

  // Sort by match score and return top 10
  return scoredCareers
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 10);
};

// OpenAI function for learning plan generation
const generateLearningPlan = async (selectedJob, resumeContext = '', transcriptContext = '') => {
  try {
    const prompt = `Create a detailed 30-day learning plan for someone who wants to become a ${selectedJob.title}.

Job Details:
- Title: ${selectedJob.title}
- Description: ${selectedJob.description}
- Required Skills: ${selectedJob.requiredSkills?.join(', ') || 'Not specified'}

User Context:
${resumeContext ? `Resume information: ${resumeContext}` : ''}
${transcriptContext ? `Educational background: ${transcriptContext}` : ''}

Create a 30-day plan where each day has:
1. Day number (1-30)
2. Title (specific topic for that day)
3. Type (reading, video, quiz, or game)
4. Duration (5 minutes)

The plan should:
- Build progressively from basics to advanced topics
- Mix different learning types (reading, video, quiz, game)
- Be specific to the ${selectedJob.title} role
- Consider the user's background if provided

Format as JSON with this structure:
{
  "title": "${selectedJob.title} Learning Plan",
  "description": "A personalized 30-day learning plan...",
  "totalDays": 30,
  "days": [
    {
      "day": 1,
      "title": "Day 1: Introduction to...",
      "type": "reading",
      "duration": "5 minutes"
    }
  ]
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an educational content creator AI that designs comprehensive learning curricula. Always respond with valid JSON format."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 2500,
      temperature: 0.7,
    });

    const response = completion.choices[0].message.content;
    
    try {
      // Remove markdown code blocks if present
      const cleanedResponse = response.replace(/```json\n?|\n?```/g, '').trim();
      const learningPlan = JSON.parse(cleanedResponse);
      return {
        ...learningPlan,
        estimatedTime: '5 minutes per day',
        generatedAt: new Date().toISOString(),
        career: selectedJob
      };
    } catch (parseError) {
      console.error('Error parsing OpenAI learning plan response:', parseError);
      console.error('Response was:', response);
      // Fallback to mock plan
      return generateMockLearningPlan(selectedJob);
    }
  } catch (error) {
    console.error('OpenAI API error for learning plan:', error);
    // Fallback to mock plan
    return generateMockLearningPlan(selectedJob);
  }
};

// Mock learning plan generation (fallback)
const generateMockLearningPlan = (selectedJob) => {
  return {
    title: `${selectedJob.title} Learning Plan`,
    description: `A personalized 30-day learning plan to prepare you for a ${selectedJob.title} role`,
    totalDays: 30,
    estimatedTime: '5 minutes per day',
    generatedAt: new Date().toISOString(),
    career: selectedJob,
    days: Array.from({ length: 30 }, (_, i) => ({
      day: i + 1,
      title: `Day ${i + 1}: ${getJobSpecificTitle(selectedJob.title, i + 1)}`,
      type: ['reading', 'video', 'quiz', 'game'][(i) % 4],
      duration: '5 minutes',
      completed: false
    }))
  };
};

// Helper function to extract skill list from GPT response
const extractListFromGPT = (response) => {
  try {
    // First, try to find array-like content
    const arrayMatch = response.match(/\[([^\]]+)\]/);
    if (arrayMatch) {
      // Parse the array content
      const arrayContent = arrayMatch[1];
      // Split by comma and clean up each item
      const skills = arrayContent
        .split(',')
        .map(skill => skill.trim().replace(/['"]/g, ''))
        .filter(skill => skill.length > 0);
      return skills;
    }
    
    // If no array found, try to extract comma-separated values
    const skills = response
      .replace(/[^\w\s,.-]/g, '') // Remove special chars except common ones
      .split(',')
      .map(skill => skill.trim())
      .filter(skill => skill.length > 2) // Filter out very short items
      .slice(0, 7); // Limit to max 7 skills
    
    return skills.length > 0 ? skills : ['Excel', 'Communication', 'Problem Solving'];
  } catch (error) {
    console.error('Error extracting skills from GPT response:', error);
    return ['Excel', 'Communication', 'Problem Solving'];
  }
};

// Function to identify missing skills using OpenAI GPT-4
const identifyMissingSkills = async (resumeText, selectedJob) => {
  try {
    const prompt = `Based on this resume: ${resumeText}, identify the 5–7 most important missing skills or tools the user needs to succeed as a ${selectedJob}. Return the list in a comma-separated array format, such as ['SQL', 'Power BI', 'pivot tables', 'data storytelling'].`;

    console.log('Identifying missing skills with OpenAI...');
    
    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a career advisor AI. Analyze resumes and identify missing skills. Return ONLY a clean comma-separated list in array format like ['skill1', 'skill2', 'skill3']."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 200,
      temperature: 0.3,
    });

    const response = completion.choices[0].message.content;
    console.log('OpenAI skills response:', response);
    
    return extractListFromGPT(response);
  } catch (error) {
    console.error('OpenAI API error for skills identification:', error);
    // Fallback based on job type
    const fallbackSkills = {
      'Data Analyst': ['SQL', 'Power BI', 'pivot tables', 'data storytelling', 'statistics'],
      'Junior Data Analyst': ['SQL', 'Excel formulas', 'data visualization', 'Python', 'statistics'],
      'Frontend Developer': ['React', 'JavaScript', 'CSS', 'HTML', 'Git'],
      'Junior Frontend Developer': ['HTML', 'CSS', 'JavaScript', 'responsive design', 'Git']
    };
    return fallbackSkills[selectedJob] || ['communication', 'problem solving', 'teamwork', 'adaptability'];
  }
};

// Function to load content library from JSON file
const loadContentLibrary = async () => {
  try {
    const fs = require('fs').promises;
    const libraryPath = path.join(__dirname, 'content', 'library.json');
    const libraryData = await fs.readFile(libraryPath, 'utf8');
    const library = JSON.parse(libraryData);
    return library.resources || [];
  } catch (error) {
    console.error('Error loading content library:', error);
    // Return minimal fallback content
    return [
      {
        title: "Getting Started",
        type: "reading",
        tags: ["basics", "introduction"],
        path: "/readings/getting-started.md",
        length: 5
      }
    ];
  }
};

// Function to build 30-day learning plan
const buildPlan = (missingSkills, contentLibrary) => {
  const plan = [];
  const contentTypes = ['video', 'quiz', 'game', 'reading'];
  
  // Create a map of skills to relevant content
  const skillContentMap = {};
  
  missingSkills.forEach(skill => {
    skillContentMap[skill] = contentLibrary.filter(resource => 
      resource.tags.some(tag => 
        tag.toLowerCase().includes(skill.toLowerCase()) ||
        skill.toLowerCase().includes(tag.toLowerCase())
      )
    );
  });
  
  // Build 30-day plan with rotating content types
  for (let day = 1; day <= 30; day++) {
    const contentTypeIndex = (day - 1) % 4;
    const desiredType = contentTypes[contentTypeIndex];
    
    // Find content for the current skill cycle
    const skillIndex = Math.floor((day - 1) / 4) % missingSkills.length;
    const currentSkill = missingSkills[skillIndex];
    
    // Try to find content of the desired type for the current skill
    let selectedContent = null;
    
    if (skillContentMap[currentSkill]) {
      selectedContent = skillContentMap[currentSkill].find(content => 
        content.type === desiredType
      );
    }
    
    // If no specific content found, try to find any content of the desired type
    if (!selectedContent) {
      selectedContent = contentLibrary.find(content => 
        content.type === desiredType &&
        content.tags.some(tag => 
          missingSkills.some(skill => 
            tag.toLowerCase().includes(skill.toLowerCase()) ||
            skill.toLowerCase().includes(tag.toLowerCase())
          )
        )
      );
    }
    
    // If still no content, use any content of the desired type
    if (!selectedContent) {
      selectedContent = contentLibrary.find(content => content.type === desiredType);
    }
    
    // Final fallback - create a generic item
    if (!selectedContent) {
      selectedContent = {
        title: `Day ${day}: ${currentSkill} Basics`,
        type: desiredType,
        path: `/content/day-${day}.html`,
        length: 5
      };
    }
    
    plan.push({
      day,
      title: selectedContent.title,
      type: selectedContent.type,
      path: selectedContent.path,
      skill: currentSkill,
      completed: false
    });
  }
  
  return plan;
};

function getJobSpecificTitle(jobTitle, day) {
  const topics = {
    'Frontend Developer': [
      'HTML Fundamentals', 'CSS Basics', 'JavaScript Introduction', 'DOM Manipulation', 'ES6 Features',
      'React Basics', 'Components & Props', 'State Management', 'Event Handling', 'Hooks Introduction',
      'useEffect Hook', 'Custom Hooks', 'Context API', 'Routing', 'Forms',
      'API Integration', 'Error Handling', 'Testing Basics', 'Performance', 'Accessibility',
      'Responsive Design', 'CSS Grid', 'Flexbox', 'Animations', 'Build Tools',
      'Git & GitHub', 'Deployment', 'Code Review', 'Best Practices', 'Final Project'
    ],
    'Data Analyst': [
      'Excel Basics', 'Data Types', 'Formulas & Functions', 'Pivot Tables', 'Charts & Graphs',
      'Python Introduction', 'Pandas Library', 'Data Cleaning', 'Data Visualization', 'Statistics Basics',
      'Descriptive Statistics', 'Inferential Statistics', 'Hypothesis Testing', 'Correlation', 'Regression',
      'SQL Basics', 'Database Queries', 'Joins', 'Aggregations', 'Data Modeling',
      'Dashboard Creation', 'Storytelling with Data', 'Business Intelligence', 'KPIs', 'Reporting',
      'Advanced Analytics', 'Forecasting', 'A/B Testing', 'Case Studies', 'Final Project'
    ],
    'Marketing Coordinator': [
      'Marketing Fundamentals', 'Target Audience Research', 'Brand Positioning', 'Marketing Mix (4Ps)', 'Consumer Behavior',
      'Digital Marketing Basics', 'Social Media Marketing', 'Content Marketing', 'Email Marketing', 'SEO Fundamentals',
      'Google Analytics', 'Facebook Ads Manager', 'Instagram Marketing', 'LinkedIn Marketing', 'Twitter Marketing',
      'Content Creation', 'Copywriting Basics', 'Visual Design Principles', 'Photography for Marketing', 'Video Marketing',
      'Campaign Planning', 'Budget Management', 'ROI Measurement', 'A/B Testing', 'Marketing Automation',
      'Customer Journey Mapping', 'Lead Generation', 'CRM Basics', 'Event Marketing', 'Final Campaign Project'
    ],
    'Junior Data Analyst': [
      'Data Literacy', 'Excel Fundamentals', 'Data Types & Formats', 'Basic Statistics', 'Data Collection',
      'Data Cleaning Basics', 'Sorting & Filtering', 'Pivot Tables', 'VLOOKUP & HLOOKUP', 'Charts & Graphs',
      'Statistical Concepts', 'Mean, Median, Mode', 'Standard Deviation', 'Data Distributions', 'Correlation Analysis',
      'Introduction to SQL', 'Basic Queries', 'WHERE Clauses', 'GROUP BY', 'JOINs',
      'Data Visualization', 'Dashboard Design', 'Storytelling with Data', 'Presentation Skills', 'Business Context',
      'Quality Assurance', 'Data Ethics', 'Documentation', 'Final Analysis Project', 'Portfolio Building'
    ],
    'Software Developer': [
      'Programming Fundamentals', 'Problem Solving', 'Algorithms', 'Data Structures', 'Version Control (Git)', 
      'Object-Oriented Programming', 'Functions & Methods', 'Error Handling', 'Testing Basics', 'Code Documentation',
      'Web Development Basics', 'APIs & HTTP', 'Databases', 'Security Fundamentals', 'Code Review Process',
      'Agile Methodology', 'Project Planning', 'User Stories', 'Sprint Planning', 'Team Collaboration',
      'Performance Optimization', 'Debugging Techniques', 'Best Practices', 'Deployment', 'Final Project'
    ],
    'Sales Representative': [
      'Sales Fundamentals', 'Customer Psychology', 'Active Listening', 'Rapport Building', 'Needs Assessment',
      'Product Knowledge', 'Value Proposition', 'Features vs Benefits', 'Competitive Analysis', 'Objection Handling',
      'Sales Process', 'Lead Qualification', 'Discovery Questions', 'Presentation Skills', 'Closing Techniques',
      'CRM Systems', 'Pipeline Management', 'Follow-up Strategies', 'Customer Retention', 'Upselling & Cross-selling',
      'Time Management', 'Territory Planning', 'Networking', 'Social Selling', 'Sales Analytics',
      'Negotiation Skills', 'Contract Basics', 'Customer Success', 'Continuous Learning', 'Final Sales Project'
    ],
    'Project Manager': [
      'Project Management Basics', 'Project Lifecycle', 'Stakeholder Management', 'Scope Definition', 'Requirements Gathering',
      'Work Breakdown Structure', 'Scheduling', 'Resource Planning', 'Budget Management', 'Risk Assessment',
      'Team Leadership', 'Communication Skills', 'Meeting Management', 'Conflict Resolution', 'Change Management',
      'Agile Methodology', 'Scrum Framework', 'Kanban Boards', 'Sprint Planning', 'Retrospectives',
      'Project Tools', 'Gantt Charts', 'Progress Tracking', 'Quality Assurance', 'Documentation',
      'Performance Metrics', 'Lessons Learned', 'Project Closure', 'Stakeholder Reporting', 'Final Project Plan'
    ],
    'Human Resources Coordinator': [
      'HR Fundamentals', 'Employment Law Basics', 'Recruitment Process', 'Job Descriptions', 'Interview Techniques',
      'Onboarding Process', 'Employee Relations', 'Performance Management', 'Compensation & Benefits', 'HRIS Systems',
      'Training & Development', 'Employee Engagement', 'Workplace Diversity', 'Conflict Resolution', 'Documentation',
      'Compliance Requirements', 'Safety Regulations', 'Employee Handbook', 'Policy Development', 'Grievance Procedures',
      'Data Analysis', 'HR Metrics', 'Retention Strategies', 'Exit Interviews', 'Culture Building',
      'Communication Skills', 'Confidentiality', 'Ethical Practices', 'Change Management', 'HR Strategy'
    ],
    'Customer Service Representative': [
      'Customer Service Basics', 'Communication Skills', 'Active Listening', 'Empathy & Patience', 'Problem Solving',
      'Product Knowledge', 'Company Policies', 'Service Standards', 'First Call Resolution', 'De-escalation Techniques',
      'Phone Etiquette', 'Email Communication', 'Chat Support', 'CRM Systems', 'Ticket Management',
      'Complaint Handling', 'Refund Processes', 'Escalation Procedures', 'Customer Retention', 'Upselling Basics',
      'Time Management', 'Multitasking', 'Stress Management', 'Team Collaboration', 'Quality Assurance',
      'Customer Feedback', 'Continuous Improvement', 'Service Recovery', 'Relationship Building', 'Final Case Study'
    ]
  };

  const jobTopics = topics[jobTitle] || topics['Marketing Coordinator']; // Default to Marketing Coordinator instead of Frontend Developer
  return jobTopics[day - 1] || `${jobTitle} Topic ${day}`;
}

// API Routes
app.get('/api/health', (req, res) => {
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  res.json({ 
    message: 'Backend server is running!',
    openai: hasOpenAI ? 'connected' : 'not configured'
  });
});

app.get('/api/jobs', (req, res) => {
  res.json(jobs);
});

app.get('/api/learning-plans', (req, res) => {
  res.json(learningPlans);
});

// Enhanced career recommendations endpoint with OpenAI
app.post('/api/career-recommendations', async (req, res) => {
  try {
    const { salary, activities, skills } = req.body;
    
    if (!activities || !skills) {
      return res.status(400).json({ error: 'Activities and skills are required' });
    }

    console.log('Generating career recommendations with OpenAI...');
    let careers = await generateCareerRecommendations(salary, activities, skills);
    
    // Ensure we always have career recommendations
    if (!careers || !Array.isArray(careers) || careers.length === 0) {
      console.log('No careers returned from OpenAI, using fallback mock data');
      careers = mockGPTCareerRecommendations(salary, activities, skills);
    }
    
    console.log(`Returning ${careers.length} career recommendations`);
    res.json({ careers });
  } catch (error) {
    console.error('Error generating career recommendations:', error);
    // Even on error, return fallback data instead of error
    const fallbackCareers = mockGPTCareerRecommendations(req.body.salary || 75000, req.body.activities || [], req.body.skills || []);
    res.json({ careers: fallbackCareers });
  }
});

// File upload endpoints
app.post('/api/upload-resume', upload.single('resume'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  res.json({
    message: 'Resume uploaded successfully',
    filename: req.file.filename,
    originalname: req.file.originalname,
    size: req.file.size
  });
});

app.post('/api/upload-transcript', upload.single('transcript'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  
  res.json({
    message: 'Transcript uploaded successfully',
    filename: req.file.filename,
    originalname: req.file.originalname,
    size: req.file.size
  });
});

// Enhanced learning plan generation endpoint with OpenAI
app.post('/api/generate-learning-plan', async (req, res) => {
  try {
    const { resumeText, resumeFile, selectedJob, transcriptFile } = req.body;
    
    if ((!resumeText && !resumeFile) || !selectedJob) {
      return res.status(400).json({ error: 'Either resumeText or resumeFile is required, along with selectedJob' });
    }

    console.log('Generating personalized learning plan with OpenAI...');
    console.log('Selected Job:', selectedJob);
    
    // Step 1: Get resume text content
    let finalResumeText = resumeText;
    if (!finalResumeText && resumeFile) {
      console.log('Extracting text from uploaded resume file:', resumeFile);
      finalResumeText = await extractTextFromFile(resumeFile);
    }
    
    // Step 2: Get transcript text if provided
    let transcriptText = '';
    if (transcriptFile) {
      console.log('Extracting text from transcript file:', transcriptFile);
      transcriptText = await extractTextFromFile(transcriptFile);
    }
    
    // Step 3: Generate comprehensive learning plan using OpenAI
    const learningPlan = await generateLearningPlan(selectedJob, finalResumeText, transcriptText);
    
    console.log('Learning plan generated for:', selectedJob.title || selectedJob);
    
    // Step 4: Also identify missing skills for additional context
    const missingSkills = await identifyMissingSkills(finalResumeText, selectedJob.title || selectedJob);
    
    res.json({
      ...learningPlan,
      selectedJob,
      missingSkills,
      plan: learningPlan.days // Ensure frontend gets the days array
    });
  } catch (error) {
    console.error('Error generating learning plan:', error);
    
    // Fallback to mock plan with job-specific content
    const fallbackPlan = generateMockLearningPlan(selectedJob);
    res.json({
      ...fallbackPlan,
      selectedJob,
      missingSkills: ['Excel', 'Communication', 'Problem Solving'],
      plan: fallbackPlan.days,
      error: 'Using fallback plan due to OpenAI error'
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(`OpenAI API: ${process.env.OPENAI_API_KEY ? 'Connected' : 'Not configured'}`);
}); 