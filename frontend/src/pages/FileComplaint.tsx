import { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  FileText, 
  Upload, 
  X, 
  AlertCircle, 
  ArrowLeft,
  MapPin,
  FileCheck,
  Send,
  Paperclip,
  UserPlus,
  Users,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Layout } from '@/components/layout/Layout';
import { useAuthStore } from '@/store/authStore';
import { useToast } from '@/hooks/use-toast';
import api, { isAuthenticated } from '@/lib/api';

interface AttachmentFile {
  file: File;
  id: string;
  name: string;
  size: number;
  type: string;
}

interface AccusedPerson {
  id: string;
  name: string;
  address: string;
  phone?: string;
  email?: string;
  nid?: string;
  age?: number;
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
  occupation?: string;
  relationshipToComplainant?: string;
}

interface ComplaintFormData {
  title: string;
  description: string;
  area: string;
}

// Common police stations/areas in Bangladesh
const policeStations = [
  'Dhanmondi Police Station',
  'Ramna Police Station',
  'Tejgaon Police Station',
  'Wari Police Station',
  'Lalbagh Police Station',
  'Shahbagh Police Station',
  'Gulshan Police Station',
  'Banani Police Station',
  'Uttara Police Station',
  'Mirpur Police Station',
  'Pallabi Police Station',
  'Shah Ali Police Station',
  'Adabar Police Station',
  'Mohammadpur Police Station',
  'Hazaribagh Police Station',
  'Kotwali Police Station',
  'Chawkbazar Police Station',
  'Sutrapur Police Station',
  'Motijheel Police Station',
  'Paltan Police Station'
];

export const FileComplaint = () => {
  const { user, token } = useAuthStore();
  const { toast } = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState<ComplaintFormData>({
    title: '',
    description: '',
    area: ''
  });
  
  const [attachments, setAttachments] = useState<AttachmentFile[]>([]);
  const [accused, setAccused] = useState<AccusedPerson[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Partial<ComplaintFormData>>({});

  // Redirect if not authenticated or not a citizen
  if (!isAuthenticated() || !user || !token || user.role !== 'CITIZEN') {
    navigate('/login');
    return null;
  }

  const addAccused = () => {
    const newAccused: AccusedPerson = {
      id: Date.now().toString(),
      name: '',
      address: '',
      phone: '',
      email: '',
      nid: '',
      age: undefined,
      gender: undefined,
      occupation: '',
      relationshipToComplainant: ''
    };
    setAccused(prev => [...prev, newAccused]);
  };

  const removeAccused = (id: string) => {
    setAccused(prev => prev.filter(acc => acc.id !== id));
  };

  const updateAccused = (id: string, field: keyof AccusedPerson, value: any) => {
    setAccused(prev => prev.map(acc => 
      acc.id === id ? { ...acc, [field]: value } : acc
    ));
  };

  const validateAccused = (): boolean => {
    for (const acc of accused) {
      if (!acc.name.trim()) {
        toast({
          title: "Validation Error",
          description: "All accused must have a name",
          variant: "destructive",
        });
        return false;
      }
      if (!acc.address.trim()) {
        toast({
          title: "Validation Error",
          description: "All accused must have an address",
          variant: "destructive",
        });
        return false;
      }
    }
    return true;
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<ComplaintFormData> = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length < 5) {
      newErrors.title = 'Title must be at least 5 characters';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.length < 20) {
      newErrors.description = 'Description must be at least 20 characters';
    }
    
    if (!formData.area) {
      newErrors.area = 'Please select a police station/area';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof ComplaintFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    const newAttachments: AttachmentFile[] = [];
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf', 'video/mp4', 'video/avi'];

    for (let i = 0; i < files.length && attachments.length + newAttachments.length < 5; i++) {
      const file = files[i];
      
      if (file.size > maxSize) {
        toast({
          title: "File too large",
          description: `${file.name} is larger than 10MB`,
          variant: "destructive",
        });
        continue;
      }
      
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: `${file.name} is not a supported file type`,
          variant: "destructive",
        });
        continue;
      }

      newAttachments.push({
        file,
        id: Date.now().toString() + i,
        name: file.name,
        size: file.size,
        type: file.type
      });
    }

    setAttachments(prev => [...prev, ...newAttachments]);

    if (attachments.length + newAttachments.length >= 5) {
      toast({
        title: "Maximum files reached",
        description: "You can attach up to 5 files maximum",
        variant: "destructive",
      });
    }

    // Clear the input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(att => att.id !== id));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the errors and try again",
        variant: "destructive",
      });
      return;
    }

    if (!validateAccused()) {
      return;
    }

    try {
      setIsSubmitting(true);

      // Create FormData for multipart/form-data request
      const submitData = new FormData();
      submitData.append('title', formData.title.trim());
      submitData.append('description', formData.description.trim());
      submitData.append('area', formData.area);

      // Add accused information if any
      if (accused.length > 0) {
        submitData.append('accused', JSON.stringify(accused));
      }

      // Add attachments
      attachments.forEach(attachment => {
        submitData.append('attachments', attachment.file);
      });

      console.log('Submitting complaint with data:', {
        title: formData.title,
        description: formData.description,
        area: formData.area,
        accusedCount: accused.length,
        attachmentCount: attachments.length
      });

      const response = await api.post('/citizens/complaints', submitData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.data.success) {
        toast({
          title: "Complaint Filed Successfully",
          description: "Your complaint has been submitted and will be reviewed by authorities",
        });

        // Redirect to complaints list or complaint detail
        navigate('/complaints');
      } else {
        throw new Error(response.data.message || 'Failed to file complaint');
      }
    } catch (error: any) {
      console.error('Error filing complaint:', error);
      
      if (error.response?.status === 401) {
        toast({
          title: "Session Expired",
          description: "Please log in again to file a complaint",
          variant: "destructive",
        });
        navigate('/login');
      } else {
        toast({
          title: "Error",
          description: error.response?.data?.message || error.message || "Failed to file complaint",
          variant: "destructive",
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Button variant="outline" asChild className="mb-4">
            <Link to="/complaints">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to My Complaints
            </Link>
          </Button>
          
          <div>
            <h1 className="text-3xl font-bold text-slate-800 mb-2">File a New Complaint</h1>
            <p className="text-slate-600">
              Submit your complaint to the authorities for investigation and resolution
            </p>
            {user && (
              <p className="text-sm text-slate-500 mt-1">
                Filing as: {user.name} ({user.nid})
              </p>
            )}
          </div>
        </div>

        {/* Instructions Card */}
        <Card className="mb-6 border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-800">
              <AlertCircle className="h-5 w-5" />
              Important Guidelines
            </CardTitle>
          </CardHeader>
          <CardContent className="text-blue-700">
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Provide accurate and detailed information about the incident</li>
              <li>Include relevant evidence files (photos, videos, documents)</li>
              <li>Maximum 5 files, each up to 10MB in size</li>
              <li>Supported formats: JPG, PNG, PDF, MP4, AVI</li>
              <li>You can optionally add details of accused persons</li>
              <li>False complaints may result in legal consequences</li>
            </ul>
          </CardContent>
        </Card>

        {/* Main Form */}
        <form onSubmit={handleSubmit}>
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Complaint Details
              </CardTitle>
              <CardDescription>
                Provide comprehensive details about your complaint
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* Title Field */}
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-medium text-slate-700">
                  Complaint Title *
                </Label>
                <Input
                  id="title"
                  placeholder="e.g., Theft of personal belongings, Property damage, etc."
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  className={`${errors.title ? 'border-red-500 focus:border-red-500' : ''}`}
                  maxLength={100}
                />
                {errors.title && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.title}
                  </p>
                )}
                <p className="text-xs text-slate-500">
                  {formData.title.length}/100 characters
                </p>
              </div>

              {/* Area/Police Station Field */}
              <div className="space-y-2">
                <Label htmlFor="area" className="text-sm font-medium text-slate-700">
                  Police Station / Area *
                </Label>
                <Select 
                  value={formData.area} 
                  onValueChange={(value) => handleInputChange('area', value)}
                >
                  <SelectTrigger className={`${errors.area ? 'border-red-500 focus:border-red-500' : ''}`}>
                    <SelectValue placeholder="Select the relevant police station or area" />
                  </SelectTrigger>
                  <SelectContent>
                    {policeStations.map((station) => (
                      <SelectItem key={station} value={station}>
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-slate-400" />
                          {station}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.area && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.area}
                  </p>
                )}
              </div>

              {/* Description Field */}
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-medium text-slate-700">
                  Detailed Description *
                </Label>
                <Textarea
                  id="description"
                  placeholder="Provide a detailed description of the incident including when, where, and what happened. Include any relevant details that might help with the investigation."
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className={`min-h-32 ${errors.description ? 'border-red-500 focus:border-red-500' : ''}`}
                  maxLength={1000}
                />
                {errors.description && (
                  <p className="text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle className="h-4 w-4" />
                    {errors.description}
                  </p>
                )}
                <p className="text-xs text-slate-500">
                  {formData.description.length}/1000 characters
                </p>
              </div>

              {/* Accused Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-slate-700">
                    Accused Persons (Optional)
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addAccused}
                    className="flex items-center gap-2"
                  >
                    <UserPlus className="h-4 w-4" />
                    Add Accused
                  </Button>
                </div>
                
                <p className="text-sm text-slate-600">
                  If you know the details of the accused persons, you can add them here. 
                  This information will help with the investigation.
                </p>

                {accused.length > 0 && (
                  <div className="space-y-4">
                    {accused.map((acc, index) => (
                      <Card key={acc.id} className="border border-slate-200">
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-lg flex items-center gap-2">
                              <Users className="h-5 w-5" />
                              Accused Person {index + 1}
                            </CardTitle>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeAccused(acc.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Full Name *</Label>
                              <Input
                                placeholder="Enter full name"
                                value={acc.name}
                                onChange={(e) => updateAccused(acc.id, 'name', e.target.value)}
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Address *</Label>
                              <Input
                                placeholder="Enter address"
                                value={acc.address}
                                onChange={(e) => updateAccused(acc.id, 'address', e.target.value)}
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Phone Number</Label>
                              <Input
                                placeholder="Enter phone number"
                                value={acc.phone || ''}
                                onChange={(e) => updateAccused(acc.id, 'phone', e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Email</Label>
                              <Input
                                type="email"
                                placeholder="Enter email address"
                                value={acc.email || ''}
                                onChange={(e) => updateAccused(acc.id, 'email', e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">NID Number</Label>
                              <Input
                                placeholder="Enter NID number"
                                value={acc.nid || ''}
                                onChange={(e) => updateAccused(acc.id, 'nid', e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Age</Label>
                              <Input
                                type="number"
                                placeholder="Enter age"
                                value={acc.age || ''}
                                onChange={(e) => updateAccused(acc.id, 'age', e.target.value ? parseInt(e.target.value) : undefined)}
                                min="1"
                                max="120"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Gender</Label>
                              <Select 
                                value={acc.gender || ''} 
                                onValueChange={(value) => updateAccused(acc.id, 'gender', value)}
                              >
                                <SelectTrigger>
                                  <SelectValue placeholder="Select gender" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="MALE">Male</SelectItem>
                                  <SelectItem value="FEMALE">Female</SelectItem>
                                  <SelectItem value="OTHER">Other</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Occupation</Label>
                              <Input
                                placeholder="Enter occupation"
                                value={acc.occupation || ''}
                                onChange={(e) => updateAccused(acc.id, 'occupation', e.target.value)}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-sm font-medium">Relationship to You</Label>
                              <Input
                                placeholder="e.g., Neighbor, Colleague, Stranger"
                                value={acc.relationshipToComplainant || ''}
                                onChange={(e) => updateAccused(acc.id, 'relationshipToComplainant', e.target.value)}
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              {/* File Attachments */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium text-slate-700">
                    Evidence & Attachments
                  </Label>
                  <span className="text-xs text-slate-500">
                    {attachments.length}/5 files
                  </span>
                </div>
                
                {/* Upload Button */}
                <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-slate-400 transition-colors">
                  <div className="space-y-2">
                    <Upload className="h-8 w-8 text-slate-400 mx-auto" />
                    <div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={attachments.length >= 5}
                        className="mb-2"
                      >
                        <Paperclip className="h-4 w-4 mr-2" />
                        Choose Files
                      </Button>
                      <p className="text-sm text-slate-600">
                        Upload photos, videos, or documents related to your complaint
                      </p>
                      <p className="text-xs text-slate-500">
                        JPG, PNG, PDF, MP4, AVI • Max 10MB each • Up to 5 files
                      </p>
                    </div>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    accept=".jpg,.jpeg,.png,.pdf,.mp4,.avi"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>

                {/* Attached Files List */}
                {attachments.length > 0 && (
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-slate-700">
                      Attached Files:
                    </Label>
                    <div className="space-y-2">
                      {attachments.map((attachment) => (
                        <div key={attachment.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border">
                          <div className="flex items-center gap-3">
                            <FileCheck className="h-4 w-4 text-green-600" />
                            <div>
                              <p className="text-sm font-medium text-slate-700">
                                {attachment.name}
                              </p>
                              <p className="text-xs text-slate-500">
                                {formatFileSize(attachment.size)} • {attachment.type}
                              </p>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeAttachment(attachment.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Submit Section */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/complaints')}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Filing Complaint...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  File Complaint
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
};
