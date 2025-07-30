'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Plus, Search, Filter, Eye, Edit, Star, User, Calendar, 
  Briefcase, CheckCircle, XCircle, AlertCircle, TrendingUp
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { format } from 'date-fns';

interface Evaluation {
  id: string;
  evaluationType: string;
  evaluatorName: string;
  technicalSkills?: number;
  communication?: number;
  problemSolving?: number;
  culturalFit?: number;
  experience?: number;
  motivation?: number;
  overallScore?: number;
  recommendation?: string;
  strengths?: string;
  weaknesses?: string;
  comments?: string;
  createdAt: string;
  candidate: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    currentCompany?: string;
    currentPosition?: string;
    totalExperience?: number;
  };
  application?: {
    id: string;
    status: string;
    stage: string;
    appliedAt: string;
  };
  interview?: {
    id: string;
    title: string;
    type: string;
    scheduledAt: string;
    status: string;
  };
}

export default function EvaluationsPage() {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [recommendationFilter, setRecommendationFilter] = useState('all');
  const [evaluatorFilter, setEvaluatorFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { toast } = useToast();

  const fetchEvaluations = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: '12',
        sortBy: 'createdAt',
        sortOrder: 'desc',
      });

      if (searchTerm) params.append('search', searchTerm);
      if (typeFilter && typeFilter !== 'all') params.append('evaluationType', typeFilter);
      if (recommendationFilter && recommendationFilter !== 'all') params.append('recommendation', recommendationFilter);
      if (evaluatorFilter && evaluatorFilter !== 'all') params.append('evaluatorId', evaluatorFilter);

      const response = await fetch(`/api/hr/recruitment/evaluations?${params}`);
      if (!response.ok) throw new Error('Failed to fetch evaluations');

      const data = await response.json();
      setEvaluations(data.evaluations);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error('Error fetching evaluations:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch evaluations',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvaluations();
  }, [currentPage, searchTerm, typeFilter, recommendationFilter, evaluatorFilter]);

  const getTypeBadge = (type: string) => {
    const typeConfig = {
      resume_screening: { color: 'bg-blue-100 text-blue-800', label: 'Resume Screening' },
      phone_screening: { color: 'bg-green-100 text-green-800', label: 'Phone Screening' },
      technical: { color: 'bg-orange-100 text-orange-800', label: 'Technical' },
      behavioral: { color: 'bg-purple-100 text-purple-800', label: 'Behavioral' },
      final: { color: 'bg-yellow-100 text-yellow-800', label: 'Final' },
    };

    const config = typeConfig[type as keyof typeof typeConfig] || { 
      color: 'bg-gray-100 text-gray-800', 
      label: type.replace('_', ' ') 
    };
    
    return <Badge className={config.color}>{config.label}</Badge>;
  };

  const getRecommendationBadge = (recommendation?: string) => {
    if (!recommendation) return null;

    const recommendationConfig = {
      strong_hire: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Strong Hire' },
      hire: { color: 'bg-green-50 text-green-700', icon: CheckCircle, label: 'Hire' },
      maybe: { color: 'bg-yellow-100 text-yellow-800', icon: AlertCircle, label: 'Maybe' },
      no_hire: { color: 'bg-red-50 text-red-700', icon: XCircle, label: 'No Hire' },
      strong_no_hire: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Strong No Hire' },
    };

    const config = recommendationConfig[recommendation as keyof typeof recommendationConfig];
    if (!config) return null;

    const IconComponent = config.icon;
    
    return (
      <Badge className={config.color}>
        <IconComponent className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const renderRating = (rating?: number) => {
    if (!rating) return <span className="text-gray-400">Not rated</span>;
    
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating/2 ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="text-sm text-gray-600 ml-1">({rating}/10)</span>
      </div>
    );
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getScoreColor = (score?: number) => {
    if (!score) return 'text-gray-400';
    if (score >= 8) return 'text-green-600';
    if (score >= 6) return 'text-yellow-600';
    if (score >= 4) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Candidate Evaluations</h1>
          <p className="text-gray-600">Review and manage candidate assessments and feedback</p>
        </div>
        <Link href="/hr/recruitment/evaluations/create">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Create Evaluation
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search evaluations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="resume_screening">Resume Screening</SelectItem>
                <SelectItem value="phone_screening">Phone Screening</SelectItem>
                <SelectItem value="technical">Technical</SelectItem>
                <SelectItem value="behavioral">Behavioral</SelectItem>
                <SelectItem value="final">Final</SelectItem>
              </SelectContent>
            </Select>

            <Select value={recommendationFilter} onValueChange={setRecommendationFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Recommendations" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Recommendations</SelectItem>
                <SelectItem value="strong_hire">Strong Hire</SelectItem>
                <SelectItem value="hire">Hire</SelectItem>
                <SelectItem value="maybe">Maybe</SelectItem>
                <SelectItem value="no_hire">No Hire</SelectItem>
                <SelectItem value="strong_no_hire">Strong No Hire</SelectItem>
              </SelectContent>
            </Select>

            <Select value={evaluatorFilter} onValueChange={setEvaluatorFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Evaluators" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Evaluators</SelectItem>
                {/* This would be populated with actual evaluators */}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setTypeFilter('');
                setRecommendationFilter('');
                setEvaluatorFilter('');
              }}
            >
              <Filter className="w-4 h-4 mr-2" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Evaluations Grid */}
      {loading ? (
        <div className="text-center py-8">Loading evaluations...</div>
      ) : evaluations.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <p className="text-gray-500">No evaluations found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {evaluations.map((evaluation) => (
            <Card key={evaluation.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src="" />
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        {getInitials(evaluation.candidate.firstName, evaluation.candidate.lastName)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold">
                        {evaluation.candidate.firstName} {evaluation.candidate.lastName}
                      </h3>
                      <p className="text-sm text-gray-600">{evaluation.candidate.email}</p>
                    </div>
                  </div>
                  <Link href={`/hr/recruitment/evaluations/${evaluation.id}`}>
                    <Button variant="outline" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>

                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between">
                    {getTypeBadge(evaluation.evaluationType)}
                    {getRecommendationBadge(evaluation.recommendation)}
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <User className="w-4 h-4 mr-2" />
                    Evaluated by {evaluation.evaluatorName}
                  </div>

                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-2" />
                    {format(new Date(evaluation.createdAt), 'MMM dd, yyyy')}
                  </div>

                  {evaluation.candidate.currentCompany && (
                    <div className="flex items-center text-sm text-gray-600">
                      <Briefcase className="w-4 h-4 mr-2" />
                      {evaluation.candidate.currentPosition} at {evaluation.candidate.currentCompany}
                    </div>
                  )}
                </div>

                {evaluation.overallScore && (
                  <div className="border-t pt-4 mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Overall Score:</span>
                      <div className="flex items-center gap-2">
                        <TrendingUp className={`w-4 h-4 ${getScoreColor(evaluation.overallScore)}`} />
                        <span className={`font-bold ${getScoreColor(evaluation.overallScore)}`}>
                          {evaluation.overallScore}/10
                        </span>
                      </div>
                    </div>
                    {renderRating(evaluation.overallScore)}
                  </div>
                )}

                {/* Score Breakdown */}
                {(evaluation.technicalSkills || evaluation.communication || evaluation.problemSolving) && (
                  <div className="border-t pt-4">
                    <h4 className="text-sm font-medium mb-2">Score Breakdown:</h4>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {evaluation.technicalSkills && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Technical:</span>
                          <span className={getScoreColor(evaluation.technicalSkills)}>
                            {evaluation.technicalSkills}/10
                          </span>
                        </div>
                      )}
                      {evaluation.communication && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Communication:</span>
                          <span className={getScoreColor(evaluation.communication)}>
                            {evaluation.communication}/10
                          </span>
                        </div>
                      )}
                      {evaluation.problemSolving && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Problem Solving:</span>
                          <span className={getScoreColor(evaluation.problemSolving)}>
                            {evaluation.problemSolving}/10
                          </span>
                        </div>
                      )}
                      {evaluation.culturalFit && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Cultural Fit:</span>
                          <span className={getScoreColor(evaluation.culturalFit)}>
                            {evaluation.culturalFit}/10
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {evaluation.strengths && (
                  <div className="mt-4 p-3 bg-green-50 rounded-lg">
                    <h5 className="text-sm font-medium text-green-800 mb-1">Key Strengths:</h5>
                    <p className="text-sm text-green-700 line-clamp-2">
                      {evaluation.strengths}
                    </p>
                  </div>
                )}

                {evaluation.interview && (
                  <div className="mt-4 text-xs text-gray-500">
                    Related to: {evaluation.interview.title} ({evaluation.interview.type})
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-8">
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <span className="flex items-center px-4">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            variant="outline"
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
