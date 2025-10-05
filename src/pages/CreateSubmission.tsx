import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Save, Send, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';
import { supabase } from '../config/supabase';
import { useAuth } from '../contexts/AuthContext';
import { ProjectSubmission, EventSubmission, SubmissionType, ChecklistItem, Reminder } from '../types/submissions';
import LocationPicker from '../components/LocationPicker';
import ChecklistBuilder from '../components/ChecklistBuilder';
import ReminderManager from '../components/ReminderManager';

const CreateSubmission = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { currentUser, userData, isAdmin } = useAuth();
  const [submissionType, setSubmissionType] = useState<SubmissionType>('project');

  useEffect(() => {
    const typeParam = searchParams.get('type');
    if (typeParam === 'event' || typeParam === 'project') {
      setSubmissionType(typeParam as SubmissionType);
    }
  }, [searchParams]);
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  const [projectData, setProjectData] = useState({
    title: '',
    description: '',
    category: 'Education',
    location: '',
    address: '',
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    startDate: '',
    endDate: '',
    expectedVolunteers: 10,
    targetAudience: '',
    durationEstimate: '',
    requirements: [''],
    resourceRequirements: [] as string[],
    skillRequirements: [] as string[],
    objectives: [''],
    contactEmail: userData?.email || '',
    contactPhone: '',
    budget: '',
    timeline: '',
    notes: '',
    checklist: [] as ChecklistItem[],
    reminders: [] as Reminder[],
    image: ''
  });

  const [eventData, setEventData] = useState({
    title: '',
    description: '',
    category: 'Community',
    date: '',
    time: '',
    location: '',
    address: '',
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    expectedAttendees: 50,
    targetAudience: '',
    durationEstimate: '',
    registrationDeadline: '',
    requirements: [''],
    resourceRequirements: [] as string[],
    skillRequirements: [] as string[],
    agenda: [''],
    contactEmail: userData?.email || '',
    contactPhone: '',
    cost: 'Free',
    notes: '',
    checklist: [] as ChecklistItem[],
    reminders: [] as Reminder[],
    image: ''
  });

  const projectCategories = ['Education', 'Healthcare', 'Environment', 'Technology', 'Community Development', 'Youth Programs'];
  const eventCategories = ['Community', 'Health', 'Education', 'Training', 'Environment', 'Fundraising'];

  const handleInputChange = (field: string, value: any) => {
    if (submissionType === 'project') {
      setProjectData(prev => ({ ...prev, [field]: value }));
    } else {
      setEventData(prev => ({ ...prev, [field]: value }));
    }
  };

  const handleArrayFieldChange = (field: 'requirements' | 'objectives' | 'agenda', index: number, value: string) => {
    const data = submissionType === 'project' ? projectData : eventData;
    const newArray = [...(data[field] as string[])];
    newArray[index] = value;
    handleInputChange(field, newArray);
  };

  const addArrayField = (field: 'requirements' | 'objectives' | 'agenda') => {
    const data = submissionType === 'project' ? projectData : eventData;
    const newArray = [...(data[field] as string[]), ''];
    handleInputChange(field, newArray);
  };

  const removeArrayField = (field: 'requirements' | 'objectives' | 'agenda', index: number) => {
    const data = submissionType === 'project' ? projectData : eventData;
    const newArray = (data[field] as string[]).filter((_, i) => i !== index);
    handleInputChange(field, newArray);
  };

  const validateForm = () => {
    const data = submissionType === 'project' ? projectData : eventData;
    const requiredFields = submissionType === 'project' 
      ? ['title', 'description', 'location', 'startDate', 'endDate', 'contactEmail', 'timeline']
      : ['title', 'description', 'date', 'time', 'location', 'registrationDeadline', 'contactEmail'];
    
    return requiredFields.every(field => data[field as keyof typeof data]);
  };

  const handleSubmit = async (status: 'draft' | 'pending') => {
    if (!currentUser || !userData) return;

    setLoading(true);
    try {
      const finalStatus = isAdmin ? 'approved' : status;
      let tableName: string;
      let insertData: any;

      if (submissionType === 'project') {
        tableName = 'project_submissions';
        insertData = {
          title: projectData.title,
          description: projectData.description,
          category: projectData.category,
          location: projectData.location,
          address: projectData.address,
          latitude: projectData.latitude,
          longitude: projectData.longitude,
          start_date: projectData.startDate,
          end_date: projectData.endDate,
          expected_volunteers: projectData.expectedVolunteers,
          target_audience: projectData.targetAudience,
          duration_estimate: projectData.durationEstimate,
          requirements: projectData.requirements.filter(r => r.trim() !== ''),
          objectives: projectData.objectives.filter(o => o.trim() !== ''),
          contact_email: projectData.contactEmail,
          contact_phone: projectData.contactPhone,
          budget: projectData.budget,
          timeline: projectData.timeline,
          notes: projectData.notes,
          image: projectData.image,
          submitted_by: currentUser.uid,
          submitter_name: userData.displayName || 'Unknown User',
          submitter_email: userData.email || '',
          status: finalStatus,
          submitted_at: new Date().toISOString()
        };
      } else {
        tableName = 'event_submissions';
        insertData = {
          title: eventData.title,
          description: eventData.description,
          category: eventData.category,
          date: eventData.date,
          time: eventData.time,
          location: eventData.location,
          address: eventData.address,
          latitude: eventData.latitude,
          longitude: eventData.longitude,
          expected_attendees: eventData.expectedAttendees,
          target_audience: eventData.targetAudience,
          duration_estimate: eventData.durationEstimate,
          registration_deadline: eventData.registrationDeadline,
          requirements: eventData.requirements.filter(r => r.trim() !== ''),
          agenda: eventData.agenda.filter(a => a.trim() !== ''),
          contact_email: eventData.contactEmail,
          contact_phone: eventData.contactPhone,
          cost: eventData.cost,
          notes: eventData.notes,
          image: eventData.image,
          submitted_by: currentUser.uid,
          submitter_name: userData.displayName || 'Unknown User',
          submitter_email: userData.email || '',
          status: finalStatus,
          submitted_at: new Date().toISOString()
        };
      }

      const { data, error } = await supabase
        .from(tableName)
        .insert([insertData])
        .select();

      if (error) throw error;

      if (finalStatus === 'pending') {
        setShowConfirmation(true);
        setTimeout(() => {
          navigate('/dashboard');
        }, 3000);
      } else if (isAdmin && finalStatus === 'approved') {
        alert(`${submissionType === 'project' ? 'Project' : 'Event'} has been created and automatically approved!`);
        navigate(submissionType === 'project' ? '/projects' : '/events');
      } else {
        navigate('/dashboard');
      }
    } catch (error) {
      console.error('Error submitting:', error);
      alert('Error submitting. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser || userData?.isGuest) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-luxury-heading text-black mb-4">Authentication Required</h2>
          <p className="text-black font-luxury-body mb-6">You need to be signed in to create submissions.</p>
          <button
            onClick={() => navigate('/')}
            className="btn-luxury-primary px-6 py-3"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  if (showConfirmation) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="luxury-card bg-cream-white p-12 text-center max-w-md">
          <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
          <h2 className="text-3xl font-luxury-heading text-black mb-4">Submission Received!</h2>
          <p className="text-black font-luxury-body mb-6">
            Your {submissionType} has been submitted for review. You'll receive an email notification once it's been reviewed by our team.
          </p>
          <div className="animate-pulse text-vibrant-orange font-luxury-semibold">
            Redirecting to dashboard...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="inline-flex items-center text-vibrant-orange hover:text-vibrant-orange-dark mb-4 font-luxury-semibold"
          >
            <ArrowLeft className="mr-2 w-5 h-5" />
            Back to Dashboard
          </button>
          
          <h1 className="text-4xl font-luxury-display text-black mb-4">
            Create New {submissionType === 'project' ? 'Project' : 'Event'}
          </h1>
          <p className="text-xl text-black font-luxury-body">
            Submit your {submissionType} idea for review and approval by our team.
          </p>
        </div>

        {/* Type Selection */}
        <div className="luxury-card bg-cream-white p-6 mb-8">
          <h3 className="text-xl font-luxury-heading text-black mb-4">What would you like to create?</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => setSubmissionType('project')}
              className={`p-6 rounded-luxury border-2 transition-all ${
                submissionType === 'project'
                  ? 'border-vibrant-orange bg-vibrant-orange/5'
                  : 'border-gray-200 hover:border-vibrant-orange/50'
              }`}
            >
              <h4 className="text-lg font-luxury-heading text-black mb-2">Project</h4>
              <p className="text-black/70 font-luxury-body">Long-term initiatives that create lasting impact</p>
            </button>
            
            <button
              onClick={() => setSubmissionType('event')}
              className={`p-6 rounded-luxury border-2 transition-all ${
                submissionType === 'event'
                  ? 'border-vibrant-orange bg-vibrant-orange/5'
                  : 'border-gray-200 hover:border-vibrant-orange/50'
              }`}
            >
              <h4 className="text-lg font-luxury-heading text-black mb-2">Event</h4>
              <p className="text-black/70 font-luxury-body">One-time activities and community gatherings</p>
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="luxury-card bg-cream-white p-8">
          <form className="space-y-8">
            {/* Basic Information */}
            <div>
              <h3 className="text-2xl font-luxury-heading text-black mb-6">Basic Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block font-luxury-medium text-black mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    value={submissionType === 'project' ? projectData.title : eventData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
                    placeholder={`Enter ${submissionType} title`}
                  />
                </div>

                <div>
                  <label className="block font-luxury-medium text-black mb-2">
                    Category *
                  </label>
                  <select
                    value={submissionType === 'project' ? projectData.category : eventData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
                  >
                    {(submissionType === 'project' ? projectCategories : eventCategories).map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <LocationPicker
                    location={submissionType === 'project' ? projectData.location : eventData.location}
                    address={submissionType === 'project' ? projectData.address : eventData.address}
                    latitude={submissionType === 'project' ? projectData.latitude : eventData.latitude}
                    longitude={submissionType === 'project' ? projectData.longitude : eventData.longitude}
                    onLocationChange={(value) => handleInputChange('location', value)}
                    onAddressChange={(value) => handleInputChange('address', value)}
                    onCoordinatesChange={(lat, lng) => {
                      handleInputChange('latitude', lat);
                      handleInputChange('longitude', lng);
                    }}
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block font-luxury-medium text-black mb-2">
                    Description *
                  </label>
                  <textarea
                    rows={4}
                    value={submissionType === 'project' ? projectData.description : eventData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
                    placeholder={`Describe your ${submissionType} in detail`}
                  />
                </div>
              </div>
            </div>

            {/* Date/Time Information */}
            <div>
              <h3 className="text-2xl font-luxury-heading text-black mb-6">
                {submissionType === 'project' ? 'Timeline' : 'Schedule'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {submissionType === 'project' ? (
                  <>
                    <div>
                      <label className="block font-luxury-medium text-black mb-2">Start Date *</label>
                      <input
                        type="date"
                        value={projectData.startDate}
                        onChange={(e) => handleInputChange('startDate', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
                      />
                    </div>
                    <div>
                      <label className="block font-luxury-medium text-black mb-2">End Date *</label>
                      <input
                        type="date"
                        value={projectData.endDate}
                        onChange={(e) => handleInputChange('endDate', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="block font-luxury-medium text-black mb-2">Timeline Description *</label>
                      <textarea
                        rows={3}
                        value={projectData.timeline}
                        onChange={(e) => handleInputChange('timeline', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
                        placeholder="Describe the project timeline and milestones"
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <label className="block font-luxury-medium text-black mb-2">Event Date *</label>
                      <input
                        type="date"
                        value={eventData.date}
                        onChange={(e) => handleInputChange('date', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
                      />
                    </div>
                    <div>
                      <label className="block font-luxury-medium text-black mb-2">Event Time *</label>
                      <input
                        type="time"
                        value={eventData.time}
                        onChange={(e) => handleInputChange('time', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
                      />
                    </div>
                    <div>
                      <label className="block font-luxury-medium text-black mb-2">Registration Deadline *</label>
                      <input
                        type="date"
                        value={eventData.registrationDeadline}
                        onChange={(e) => handleInputChange('registrationDeadline', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
                      />
                    </div>
                    <div>
                      <label className="block font-luxury-medium text-black mb-2">Cost</label>
                      <input
                        type="text"
                        value={eventData.cost}
                        onChange={(e) => handleInputChange('cost', e.target.value)}
                        className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
                        placeholder="e.g., Free, $10, etc."
                      />
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Participants/Volunteers */}
            <div>
              <h3 className="text-2xl font-luxury-heading text-black mb-6">Participation</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block font-luxury-medium text-black mb-2">
                    Expected {submissionType === 'project' ? 'Volunteers' : 'Attendees'}
                  </label>
                  <input
                    type="number"
                    value={submissionType === 'project' ? projectData.expectedVolunteers : eventData.expectedAttendees}
                    onChange={(e) => handleInputChange(
                      submissionType === 'project' ? 'expectedVolunteers' : 'expectedAttendees', 
                      parseInt(e.target.value)
                    )}
                    className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
                    min="1"
                  />
                </div>
                {submissionType === 'project' && (
                  <div>
                    <label className="block font-luxury-medium text-black mb-2">Budget (Optional)</label>
                    <input
                      type="text"
                      value={projectData.budget}
                      onChange={(e) => handleInputChange('budget', e.target.value)}
                      className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
                      placeholder="Estimated budget"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Requirements */}
            <div>
              <h3 className="text-2xl font-luxury-heading text-black mb-6">Requirements</h3>
              <div className="space-y-4">
                {(submissionType === 'project' ? projectData.requirements : eventData.requirements).map((req, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={req}
                      onChange={(e) => handleArrayFieldChange('requirements', index, e.target.value)}
                      className="flex-1 px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
                      placeholder={`Requirement ${index + 1}`}
                    />
                    {(submissionType === 'project' ? projectData.requirements : eventData.requirements).length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArrayField('requirements', index)}
                        className="px-4 py-3 bg-red-500 text-white rounded-luxury hover:bg-red-600"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayField('requirements')}
                  className="flex items-center px-4 py-2 text-vibrant-orange hover:bg-vibrant-orange/10 rounded-luxury transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Requirement
                </button>
              </div>
            </div>

            {/* Objectives/Agenda */}
            <div>
              <h3 className="text-2xl font-luxury-heading text-black mb-6">
                {submissionType === 'project' ? 'Objectives' : 'Agenda'}
              </h3>
              <div className="space-y-4">
                {(submissionType === 'project' ? projectData.objectives : eventData.agenda).map((item, index) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => handleArrayFieldChange(
                        submissionType === 'project' ? 'objectives' : 'agenda', 
                        index, 
                        e.target.value
                      )}
                      className="flex-1 px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
                      placeholder={`${submissionType === 'project' ? 'Objective' : 'Agenda item'} ${index + 1}`}
                    />
                    {(submissionType === 'project' ? projectData.objectives : eventData.agenda).length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeArrayField(submissionType === 'project' ? 'objectives' : 'agenda', index)}
                        className="px-4 py-3 bg-red-500 text-white rounded-luxury hover:bg-red-600"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addArrayField(submissionType === 'project' ? 'objectives' : 'agenda')}
                  className="flex items-center px-4 py-2 text-vibrant-orange hover:bg-vibrant-orange/10 rounded-luxury transition-colors"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add {submissionType === 'project' ? 'Objective' : 'Agenda Item'}
                </button>
              </div>
            </div>

            {/* Additional Details */}
            <div>
              <h3 className="text-2xl font-luxury-heading text-black mb-6">Additional Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block font-luxury-medium text-black mb-2">Target Audience</label>
                  <input
                    type="text"
                    value={submissionType === 'project' ? projectData.targetAudience : eventData.targetAudience}
                    onChange={(e) => handleInputChange('targetAudience', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
                    placeholder="e.g., Youth ages 12-18, Senior citizens"
                  />
                </div>
                <div>
                  <label className="block font-luxury-medium text-black mb-2">Duration Estimate</label>
                  <input
                    type="text"
                    value={submissionType === 'project' ? projectData.durationEstimate : eventData.durationEstimate}
                    onChange={(e) => handleInputChange('durationEstimate', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
                    placeholder="e.g., 3 hours, Full day, 6 months"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block font-luxury-medium text-black mb-2">Notes</label>
                  <textarea
                    rows={3}
                    value={submissionType === 'project' ? projectData.notes : eventData.notes}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
                    placeholder="Any additional notes or special considerations"
                  />
                </div>
              </div>
            </div>

            {/* Checklist */}
            <div>
              <h3 className="text-2xl font-luxury-heading text-black mb-6">Task Checklist</h3>
              <ChecklistBuilder
                items={submissionType === 'project' ? projectData.checklist : eventData.checklist}
                onChange={(items) => handleInputChange('checklist', items)}
              />
            </div>

            {/* Reminders */}
            <div>
              <h3 className="text-2xl font-luxury-heading text-black mb-6">Reminders</h3>
              <ReminderManager
                reminders={submissionType === 'project' ? projectData.reminders : eventData.reminders}
                onChange={(reminders) => handleInputChange('reminders', reminders)}
                defaultEmail={submissionType === 'project' ? projectData.contactEmail : eventData.contactEmail}
              />
            </div>

            {/* Contact Information */}
            <div>
              <h3 className="text-2xl font-luxury-heading text-black mb-6">Contact Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block font-luxury-medium text-black mb-2">Contact Email *</label>
                  <input
                    type="email"
                    value={submissionType === 'project' ? projectData.contactEmail : eventData.contactEmail}
                    onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
                  />
                </div>
                <div>
                  <label className="block font-luxury-medium text-black mb-2">Contact Phone</label>
                  <input
                    type="tel"
                    value={submissionType === 'project' ? projectData.contactPhone : eventData.contactPhone}
                    onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                    className="w-full px-4 py-3 border-2 border-vibrant-orange/30 rounded-luxury focus:outline-none focus:ring-2 focus:ring-vibrant-orange focus:border-vibrant-orange font-luxury-body"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-8 border-t">
              <button
                type="button"
                onClick={() => handleSubmit('draft')}
                disabled={loading}
                className="flex-1 flex items-center justify-center px-6 py-3 border-2 border-gray-300 rounded-luxury text-black font-luxury-semibold hover:bg-gray-50 disabled:opacity-50"
              >
                <Save className="w-5 h-5 mr-2" />
                Save as Draft
              </button>
              
              <button
                type="button"
                onClick={() => handleSubmit('pending')}
                disabled={loading || !validateForm()}
                className="flex-1 btn-luxury-primary py-3 px-6 flex items-center justify-center disabled:opacity-50"
              >
                <Send className="w-5 h-5 mr-2" />
                {loading ? 'Submitting...' : 'Submit for Review'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateSubmission;