'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
// import { Slider } from '@/components/ui/slider';
import { ArrowLeft, Save, Star, User, Briefcase } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  currentCompany?: string;
  currentPosition?: string;
  totalExperience?: number;
  skills: string[];
}

interface Interview {
  id: string;
  title: string;
  type: string;
  scheduledAt: string;
}

interface Application {
  id: string;
  jobPosting: {
    id: string;
    title: string;
  };
}

interface FormData {
  candidateId: string;
  applicationId: string;
  interviewId: string;
  evaluationType: string;
  evaluatorName: string;
  technicalSkills: number;
  communication: number;
  problemSolving: number;
  culturalFit: number;
  experience: number;
  motivation: number;
  overallScore: number;
  recommendation: string;
  strengths: string;
  weaknesses: string;
  comments: string;
}

export default function CreateEvaluationPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);

  const [formData, setFormData] = useState<FormData>({
    candidateId: searchParams.get('candidateId') || '',
    applicationId: searchParams.get('applicationId') || '',
    interviewId: searchParams.get('interviewId') || '',
    evaluationType: '',
    evaluatorName: '',
    technicalSkills: 5,
    communication: 5,
    problemSolving: 5,
    culturalFit: 5,
    experience: 5,
    motivation: 5,
    overallScore: 5,
    recommendation: '',
    strengths: '',
    weaknesses: '',
    comments: '',
  });

  const fetchCandidate = async (candidateId: string) => {
    try {
      const response = await fetch(`/api/hr/recruitment/candidates/${candidateId}`);
      if (!response.ok) throw new Error('Failed to fetch candidate');
      const data = await response.json();
      setCandidate(data.candidate);
      setApplications(data.candidate.applications || []);
      setInterviews(data.candidate.interviews || []);
    } catch (error) {
      console.error('Error fetching candidate:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch candidate details',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    if (formData.candidateId) {
      fetchCandidate(formData.candidateId);
    }
  }, [formData.candidateId]);

  useEffect(() => {
    // Calculate overall score based on individual scores
    const scores = [
      formData.technicalSkills,
      formData.communication,
      formData.problemSolving,
      formData.culturalFit,
      formData.experience,
      formData.motivation,
    ];
    const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    setFormData(prev => ({ ...prev, overallScore: Math.round(average * 10) / 10 }));
  }, [
    formData.technicalSkills,
    formData.communication,
    formData.problemSolving,
    formData.culturalFit,
    formData.experience,
    formData.motivation,
  ]);

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.candidateId || !formData.evaluationType || !formData.evaluatorName) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      
      const response = await fetch('/api/hr/recruitment/evaluations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          evaluatorId: 'current-user-id', // This should come from session
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create evaluation');
      }

      const data = await response.json();
      
      toast({
        title: 'Success',
        description: 'Evaluation created successfully',
      });

      router.push(`/hr/recruitment/evaluations/${data.evaluation.id}`);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const renderScoreSlider = (
    label: string,
    field: keyof FormData,
    description: string
  ) => (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <Label htmlFor={field}>{label}</Label>
        <div className="flex items-center gap-1">
          <Star className="w-4 h-4 text-yellow-400 fill-current" />
          <span className="font-semibold">{formData[field]}/10</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">1</span>
        <input
          type="range"
          min="1"
          max="10"
          step="0.5"
          value={formData[field] as number}
          onChange={(e) => handleInputChange(field, parseFloat(e.target.value))}
          className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
        <span className="text-sm text-gray-500">10</span>
      </div>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );

  const getRecommendationColor = (recommendation: string) => {
    switch (recommendation) {
      case 'strong_hire': return 'bg-green-100 text-green-800 border-green-200';
      case 'hire': return 'bg-green-50 text-green-700 border-green-200';
      case 'maybe': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'no_hire': return 'bg-red-50 text-red-700 border-red-200';
      case 'strong_no_hire': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/hr/recruitment/evaluations">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Evaluations
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Create Candidate Evaluation</h1>
          <p className="text-gray-600">Evaluate candidate performance and provide feedback</p>
        </div>
      </div>

      {/* Candidate Information */}
      {candidate && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="w-5 h-5 mr-2" />
              Candidate Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-lg">
                  {candidate.firstName} {candidate.lastName}
                </h3>
                <p className="text-gray-600">{candidate.email}</p>
                {candidate.currentCompany && (
                  <p className="text-gray-600">
                    {candidate.currentPosition} at {candidate.currentCompany}
                  </p>
                )}
                {candidate.totalExperience && (
                  <p className="text-gray-600">
                    {candidate.totalExperience} years experience
                  </p>
                )}
              </div>
              <div>
                <h4 className="font-medium mb-2">Skills:</h4>
                <div className="flex flex-wrap gap-1">
                  {candidate.skills.slice(0, 6).map((skill, index) => (
                    <span
                      key={index}
                      className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm"
                    >
                      {skill}
                    </span>
                  ))}
                  {candidate.skills.length > 6 && (
                    <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-sm">
                      +{candidate.skills.length - 6} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Evaluation Context */}
        <Card>
          <CardHeader>
            <CardTitle>Evaluation Context</CardTitle>
            <CardDescription>Specify the context and type of this evaluation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="evaluationType">Evaluation Type *</Label>
                <Select value={formData.evaluationType} onValueChange={(value) => handleInputChange('evaluationType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select evaluation type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="resume_screening">Resume Screening</SelectItem>
                    <SelectItem value="phone_screening">Phone Screening</SelectItem>
                    <SelectItem value="technical">Technical Interview</SelectItem>
                    <SelectItem value="behavioral">Behavioral Interview</SelectItem>
                    <SelectItem value="final">Final Interview</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="evaluatorName">Evaluator Name *</Label>
                <Input
                  id="evaluatorName"
                  value={formData.evaluatorName}
                  onChange={(e) => handleInputChange('evaluatorName', e.target.value)}
                  placeholder="Your name"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {applications.length > 0 && (
                <div>
                  <Label htmlFor="applicationId">Related Application</Label>
                  <Select value={formData.applicationId} onValueChange={(value) => handleInputChange('applicationId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select application" />
                    </SelectTrigger>
                    <SelectContent>
                      {applications.map((app) => (
                        <SelectItem key={app.id} value={app.id}>
                          {app.jobPosting.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {interviews.length > 0 && (
                <div>
                  <Label htmlFor="interviewId">Related Interview</Label>
                  <Select value={formData.interviewId} onValueChange={(value) => handleInputChange('interviewId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select interview" />
                    </SelectTrigger>
                    <SelectContent>
                      {interviews.map((interview) => (
                        <SelectItem key={interview.id} value={interview.id}>
                          {interview.title} - {interview.type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Scoring Criteria */}
        <Card>
          <CardHeader>
            <CardTitle>Scoring Criteria</CardTitle>
            <CardDescription>Rate the candidate on various competencies (1-10 scale)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {renderScoreSlider(
              'Technical Skills',
              'technicalSkills',
              'Proficiency in required technical skills and knowledge'
            )}

            {renderScoreSlider(
              'Communication',
              'communication',
              'Clarity of expression, listening skills, and overall communication ability'
            )}

            {renderScoreSlider(
              'Problem Solving',
              'problemSolving',
              'Analytical thinking, creativity, and approach to solving problems'
            )}

            {renderScoreSlider(
              'Cultural Fit',
              'culturalFit',
              'Alignment with company values, team dynamics, and work culture'
            )}

            {renderScoreSlider(
              'Experience',
              'experience',
              'Relevance and depth of previous work experience'
            )}

            {renderScoreSlider(
              'Motivation',
              'motivation',
              'Enthusiasm for the role, company, and career growth'
            )}

            <div className="pt-4 border-t">
              <div className="flex justify-between items-center mb-2">
                <Label>Overall Score (Calculated)</Label>
                <div className="flex items-center gap-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= formData.overallScore ? 'text-yellow-400 fill-current' : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="font-bold text-lg">{formData.overallScore}/10</span>
                </div>
              </div>
              <p className="text-sm text-gray-600">
                Automatically calculated based on individual scores
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Recommendation */}
        <Card>
          <CardHeader>
            <CardTitle>Recommendation</CardTitle>
            <CardDescription>Your hiring recommendation based on the evaluation</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="recommendation">Hiring Recommendation</Label>
              <Select value={formData.recommendation} onValueChange={(value) => handleInputChange('recommendation', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select recommendation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="strong_hire">Strong Hire</SelectItem>
                  <SelectItem value="hire">Hire</SelectItem>
                  <SelectItem value="maybe">Maybe</SelectItem>
                  <SelectItem value="no_hire">No Hire</SelectItem>
                  <SelectItem value="strong_no_hire">Strong No Hire</SelectItem>
                </SelectContent>
              </Select>
              {formData.recommendation && (
                <div className="mt-2">
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getRecommendationColor(formData.recommendation)}`}>
                    {formData.recommendation.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Detailed Feedback */}
        <Card>
          <CardHeader>
            <CardTitle>Detailed Feedback</CardTitle>
            <CardDescription>Provide specific feedback about the candidate</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="strengths">Key Strengths</Label>
              <Textarea
                id="strengths"
                value={formData.strengths}
                onChange={(e) => handleInputChange('strengths', e.target.value)}
                placeholder="What are the candidate's main strengths?"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="weaknesses">Areas for Improvement</Label>
              <Textarea
                id="weaknesses"
                value={formData.weaknesses}
                onChange={(e) => handleInputChange('weaknesses', e.target.value)}
                placeholder="What areas could the candidate improve on?"
                rows={3}
              />
            </div>

            <div>
              <Label htmlFor="comments">Additional Comments</Label>
              <Textarea
                id="comments"
                value={formData.comments}
                onChange={(e) => handleInputChange('comments', e.target.value)}
                placeholder="Any additional observations or comments..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-4">
          <Link href="/hr/recruitment/evaluations">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={loading}>
            {loading ? (
              'Creating...'
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Create Evaluation
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
