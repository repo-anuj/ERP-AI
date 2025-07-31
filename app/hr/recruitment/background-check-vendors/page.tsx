'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Plus, Search, Filter, Eye, Edit, Building, Phone, Mail, 
  CheckCircle, XCircle, Clock, Star, ExternalLink, ArrowLeft
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

interface Vendor {
  id: string;
  name: string;
  contactEmail: string;
  contactPhone?: string;
  website?: string;
  supportedCheckTypes: string[];
  averageTurnaroundDays?: number;
  rating?: number;
  isActive: boolean;
  cost?: number;
  notes?: string;
  createdAt: string;
}

export default function BackgroundCheckVendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [checkTypeFilter, setCheckTypeFilter] = useState('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchVendors();
  }, [searchTerm, statusFilter, checkTypeFilter]);

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (searchTerm) params.append('search', searchTerm);
      if (statusFilter && statusFilter !== 'all') params.append('isActive', statusFilter);
      if (checkTypeFilter && checkTypeFilter !== 'all') params.append('checkType', checkTypeFilter);

      const response = await fetch(`/api/hr/recruitment/background-check-vendors?${params}`);
      if (!response.ok) throw new Error('Failed to fetch vendors');

      const data = await response.json();
      setVendors(data.vendors || []);
    } catch (error) {
      console.error('Error fetching vendors:', error);
      toast({
        title: 'Error',
        description: 'Failed to load vendors',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const toggleVendorStatus = async (vendorId: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/hr/recruitment/background-check-vendors/${vendorId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive: !isActive }),
      });

      if (!response.ok) throw new Error('Failed to update vendor status');

      toast({
        title: 'Success',
        description: `Vendor ${!isActive ? 'activated' : 'deactivated'} successfully`,
      });

      fetchVendors();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const getCheckTypeBadges = (checkTypes: string[]) => {
    const typeColors: Record<string, string> = {
      criminal: 'bg-red-100 text-red-800',
      employment: 'bg-blue-100 text-blue-800',
      education: 'bg-green-100 text-green-800',
      reference: 'bg-purple-100 text-purple-800',
      credit: 'bg-yellow-100 text-yellow-800',
      identity: 'bg-indigo-100 text-indigo-800',
      drug_test: 'bg-orange-100 text-orange-800',
      driving_record: 'bg-gray-100 text-gray-800',
    };

    return checkTypes.slice(0, 3).map((type, index) => (
      <Badge key={index} className={typeColors[type] || 'bg-gray-100 text-gray-800'}>
        {type.replace('_', ' ')}
      </Badge>
    ));
  };

  const getRatingStars = (rating?: number) => {
    if (!rating) return null;
    
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-1 text-sm text-muted-foreground">({rating})</span>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <Link href="/hr/recruitment/background-checks">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Background Checks
          </Button>
        </Link>

        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Background Check Vendors</h1>
            <p className="text-gray-600">Manage your background check service providers</p>
          </div>
          <Link href="/hr/recruitment/background-check-vendors/create">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Add Vendor
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search vendors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="true">Active</SelectItem>
                <SelectItem value="false">Inactive</SelectItem>
              </SelectContent>
            </Select>

            <Select value={checkTypeFilter} onValueChange={setCheckTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Check Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Check Types</SelectItem>
                <SelectItem value="criminal">Criminal</SelectItem>
                <SelectItem value="employment">Employment</SelectItem>
                <SelectItem value="education">Education</SelectItem>
                <SelectItem value="reference">Reference</SelectItem>
                <SelectItem value="credit">Credit</SelectItem>
                <SelectItem value="identity">Identity</SelectItem>
                <SelectItem value="drug_test">Drug Test</SelectItem>
                <SelectItem value="driving_record">Driving Record</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setCheckTypeFilter('all');
              }}
            >
              <Filter className="w-4 h-4 mr-2" />
              Clear
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Vendors Grid */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading vendors...</p>
          </div>
        </div>
      ) : vendors.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Building className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Vendors Found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || statusFilter !== 'all' || checkTypeFilter !== 'all'
                ? 'No vendors match your current filters.'
                : 'Get started by adding your first background check vendor.'}
            </p>
            <Link href="/hr/recruitment/background-check-vendors/create">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add First Vendor
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vendors.map((vendor) => (
            <Card key={vendor.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{vendor.name}</CardTitle>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={vendor.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {vendor.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                      {vendor.averageTurnaroundDays && (
                        <Badge variant="outline">
                          <Clock className="w-3 h-3 mr-1" />
                          {vendor.averageTurnaroundDays} days
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center text-sm text-muted-foreground mb-1">
                    <Mail className="w-4 h-4 mr-2" />
                    {vendor.contactEmail}
                  </div>
                  {vendor.contactPhone && (
                    <div className="flex items-center text-sm text-muted-foreground mb-1">
                      <Phone className="w-4 h-4 mr-2" />
                      {vendor.contactPhone}
                    </div>
                  )}
                  {vendor.website && (
                    <div className="flex items-center text-sm text-muted-foreground">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      <a href={vendor.website} target="_blank" rel="noopener noreferrer" className="hover:underline">
                        Website
                      </a>
                    </div>
                  )}
                </div>

                {vendor.rating && (
                  <div>
                    {getRatingStars(vendor.rating)}
                  </div>
                )}

                <div>
                  <p className="text-sm font-medium mb-2">Supported Check Types:</p>
                  <div className="flex flex-wrap gap-1">
                    {getCheckTypeBadges(vendor.supportedCheckTypes)}
                    {vendor.supportedCheckTypes.length > 3 && (
                      <Badge variant="outline">
                        +{vendor.supportedCheckTypes.length - 3} more
                      </Badge>
                    )}
                  </div>
                </div>

                {vendor.cost && (
                  <div className="text-sm">
                    <span className="font-medium">Starting from: </span>
                    <span className="text-green-600">${vendor.cost}</span>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    variant={vendor.isActive ? "outline" : "default"}
                    size="sm"
                    onClick={() => toggleVendorStatus(vendor.id, vendor.isActive)}
                    className="flex-1"
                  >
                    {vendor.isActive ? (
                      <>
                        <XCircle className="w-4 h-4 mr-1" />
                        Deactivate
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 mr-1" />
                        Activate
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
