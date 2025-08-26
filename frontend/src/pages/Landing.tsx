import { Link } from 'react-router-dom';
import { ArrowRight, Shield, Scale, Users, Gavel, CheckCircle, FileText, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import logoIcon from '@/assets/logo-icon.png';

export const Landing = () => {
  const features = [
    {
      icon: FileText,
      title: 'File Complaints',
      description: 'Submit complaints digitally with complete documentation and evidence management.',
      color: 'text-primary'
    },
    {
      icon: Shield,
      title: 'Track Progress',
      description: 'Real-time updates on your case status from complaint to verdict.',
      color: 'text-secondary'
    },
    {
      icon: Scale,
      title: 'Transparent Justice',
      description: 'Blockchain-powered transparency ensuring accountability at every step.',
      color: 'text-warning'
    },
    {
      icon: Users,
      title: 'Connect with Lawyers',
      description: 'Find and connect with qualified legal professionals for your case.',
      color: 'text-success'
    },
    {
      icon: Gavel,
      title: 'Digital Hearings',
      description: 'Schedule and attend hearings with digital integration and notifications.',
      color: 'text-tertiary'
    },
    {
      icon: Clock,
      title: 'Efficient Process',
      description: 'Streamlined workflow from police investigation to court proceedings.',
      color: 'text-danger'
    }
  ];

  const benefits = [
    'Digital complaint filing with evidence upload',
    'Real-time case tracking and notifications',
    'Transparent investigation process',
    'Direct lawyer communication',
    'Blockchain-secured document storage',
    'Automated hearing scheduling'
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-hero text-white py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-secondary/20 to-tertiary/20" />
        <div className="container relative z-10 px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="flex justify-center mb-6">
              <img src={logoIcon} alt="Justice" className="h-16 w-16 animate-float" />
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
              Justice Made
              <span className="block gradient-text">Digital & Transparent</span>
            </h1>
            <p className="text-xl lg:text-2xl text-white/90 max-w-2xl mx-auto">
              Revolutionary blockchain-powered justice system connecting citizens, police, lawyers, and courts in one unified platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button size="lg" className="btn-hero text-lg px-8 py-4" asChild>
                <Link to="/register">
                  Start Your Case
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="text-black border-black hover:bg-white hover:text-tertiary text-lg px-8 py-4" asChild>
                <Link to="/login">
                  Access Portal
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 bg-background">
        <div className="container px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Complete Justice Ecosystem
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              From complaint filing to verdict delivery, experience justice that's transparent, efficient, and accessible to all.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="card-elegant hover:shadow-elegant transition-all duration-300 group cursor-pointer">
                <CardHeader>
                  <div className={`w-12 h-12 rounded-lg bg-gradient-to-br from-current/10 to-current/20 flex items-center justify-center mb-4 ${feature.color} group-hover:scale-110 transition-transform`}>
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-muted/30">
        <div className="container px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl lg:text-4xl font-bold mb-6">
                Why Choose Digital Justice?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Our platform revolutionizes traditional legal processes with cutting-edge technology, ensuring justice is swift, transparent, and accessible to every citizen.
              </p>
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-success flex-shrink-0" />
                    <span className="text-foreground">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Card className="card-elegant p-6 text-center">
                <div className="text-3xl font-bold text-primary mb-2">10K+</div>
                <div className="text-muted-foreground">Cases Resolved</div>
              </Card>
              <Card className="card-elegant p-6 text-center">
                <div className="text-3xl font-bold text-secondary mb-2">24/7</div>
                <div className="text-muted-foreground">System Availability</div>
              </Card>
              <Card className="card-elegant p-6 text-center">
                <div className="text-3xl font-bold text-warning mb-2">500+</div>
                <div className="text-muted-foreground">Legal Professionals</div>
              </Card>
              <Card className="card-elegant p-6 text-center">
                <div className="text-3xl font-bold text-success mb-2">99.9%</div>
                <div className="text-muted-foreground">Data Security</div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Role-based Access */}
      <section className="py-20 bg-background">
        <div className="container px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold mb-4">
              Access For Every Role
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Tailored interfaces and features for each stakeholder in the justice system.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 max-w-7xl mx-auto">
            <Card className="relative overflow-hidden bg-white border-0 shadow-xl hover:shadow-2xl transition-all duration-500 group hover:scale-105 transform perspective-1000 hover:rotate-y-2">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-yellow-400 to-yellow-600"></div>
              <CardHeader className="text-center pb-4 pt-6 bg-gradient-to-br from-slate-50 to-gray-100">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center shadow-lg">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <Badge className="w-fit mx-auto mb-4 bg-yellow-100 text-yellow-800 font-semibold px-4 py-2 rounded-full border border-yellow-200">Citizens</Badge>
                <CardTitle className="text-xl font-bold text-slate-800">For Citizens</CardTitle>
                <CardDescription className="text-sm leading-relaxed mt-3 text-slate-600">
                  File complaints, track cases, find lawyers, and stay updated on proceedings.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 pb-6 px-6">
                <Button className="w-full bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white font-semibold py-3 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl" asChild>
                  <Link to="/register?role=citizen">Register as Citizen</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden bg-white border-0 shadow-xl hover:shadow-2xl transition-all duration-500 group hover:scale-105 transform perspective-1000 hover:rotate-y-2">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-slate-600 to-slate-800"></div>
              <CardHeader className="text-center pb-4 pt-6 bg-gradient-to-br from-slate-50 to-gray-100">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-slate-600 to-slate-800 rounded-full flex items-center justify-center shadow-lg">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <Badge className="w-fit mx-auto mb-4 bg-slate-100 text-slate-800 font-semibold px-4 py-2 rounded-full border border-slate-200">Law Enforcement</Badge>
                <CardTitle className="text-xl font-bold text-slate-800">For Police</CardTitle>
                <CardDescription className="text-sm leading-relaxed mt-3 text-slate-600">
                  Manage investigations, file FIRs, submit evidence, and coordinate with courts.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 pb-6 px-6">
                <Button className="w-full bg-gradient-to-r from-slate-600 to-slate-800 hover:from-slate-700 hover:to-slate-900 text-white font-semibold py-3 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl" asChild>
                  <Link to="/register?role=police">Register as Officer</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden bg-white border-0 shadow-xl hover:shadow-2xl transition-all duration-500 group hover:scale-105 transform perspective-1000 hover:rotate-y-2">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-teal-500 to-teal-700"></div>
              <CardHeader className="text-center pb-4 pt-6 bg-gradient-to-br from-slate-50 to-gray-100">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-teal-500 to-teal-700 rounded-full flex items-center justify-center shadow-lg">
                  <Gavel className="h-8 w-8 text-white" />
                </div>
                <Badge className="w-fit mx-auto mb-4 bg-teal-100 text-teal-800 font-semibold px-4 py-2 rounded-full border border-teal-200">Judiciary</Badge>
                <CardTitle className="text-xl font-bold text-slate-800">For Judges</CardTitle>
                <CardDescription className="text-sm leading-relaxed mt-3 text-slate-600">
                  Process FIRs, create cases, schedule hearings, and deliver verdicts.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 pb-6 px-6">
                <Button className="w-full bg-gradient-to-r from-teal-500 to-teal-700 hover:from-teal-600 hover:to-teal-800 text-white font-semibold py-3 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl" asChild>
                  <Link to="/register?role=judge">Register as Judge</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden bg-white border-0 shadow-xl hover:shadow-2xl transition-all duration-500 group hover:scale-105 transform perspective-1000 hover:rotate-y-2">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-emerald-500 to-emerald-700"></div>
              <CardHeader className="text-center pb-4 pt-6 bg-gradient-to-br from-slate-50 to-gray-100">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-emerald-500 to-emerald-700 rounded-full flex items-center justify-center shadow-lg">
                  <Scale className="h-8 w-8 text-white" />
                </div>
                <Badge className="w-fit mx-auto mb-4 bg-emerald-100 text-emerald-800 font-semibold px-4 py-2 rounded-full border border-emerald-200">Legal Profession</Badge>
                <CardTitle className="text-xl font-bold text-slate-800">For Lawyers</CardTitle>
                <CardDescription className="text-sm leading-relaxed mt-3 text-slate-600">
                  Represent clients, submit documents, access case files, and communicate with all parties.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 pb-6 px-6">
                <Button className="w-full bg-gradient-to-r from-emerald-500 to-emerald-700 hover:from-emerald-600 hover:to-emerald-800 text-white font-semibold py-3 rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl" asChild>
                  <Link to="/register?role=lawyer">Register as Lawyer</Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-hero text-white">
        <div className="container px-4 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold mb-6">
            Ready to Experience Digital Justice?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join thousands of citizens, legal professionals, and law enforcement officers using our platform for transparent and efficient justice.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="btn-hero text-lg px-8 py-4" asChild>
              <Link to="/register">
                Get Started Today
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-black border-white hover:bg-white hover:text-tertiary text-lg px-8 py-4" asChild>
              <Link to="/contact">
                Contact Support
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};