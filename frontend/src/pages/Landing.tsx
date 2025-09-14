import { Link } from 'react-router-dom';
import { ArrowRight, Shield, Scale, Users, Gavel, CheckCircle, FileText, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import logoIcon from '/veritas.png';

export const Landing = () => {
  const features = [
    {
      icon: FileText,
      title: 'File Complaints',
      description: 'Submit your complaints online with documents and evidence.',
      color: 'text-primary'
    },
    {
      icon: Shield,
      title: 'Track Your Case',
      description: 'See updates on your case status from start to finish.',
      color: 'text-secondary'
    },
    {
      icon: Scale,
      title: 'Fair Process',
      description: 'Transparent system that ensures everyone is treated fairly.',
      color: 'text-warning'
    },
    {
      icon: Users,
      title: 'Find Lawyers',
      description: 'Connect with lawyers who can help with your case.',
      color: 'text-success'
    },
    {
      icon: Gavel,
      title: 'Court Hearings',
      description: 'Schedule and attend court hearings easily.',
      color: 'text-tertiary'
    },
    {
      icon: Clock,
      title: 'Faster Process',
      description: 'Complete your case faster with our streamlined system.',
      color: 'text-danger'
    }
  ];

  const benefits = [
    'File complaints online with documents',
    'Get updates on your case progress',
    'Fair and transparent process',
    'Talk directly with lawyers',
    'Secure document storage',
    'Easy hearing scheduling'
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-hero text-white py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-secondary/30 to-tertiary/30" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
        <div className="container relative z-10 px-4">
          <div className="max-w-4xl mx-auto text-center space-y-8">
            <div className="flex justify-center mb-6">
              <div className="relative">
                <img src={logoIcon} alt="Justice" className="h-20 w-20 animate-float" />
                <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-secondary/20 rounded-full blur-xl animate-pulse"></div>
              </div>
            </div>
            <h1 className="text-4xl lg:text-6xl font-bold leading-tight">
              Justice Made
              <span className="block bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                Simple & Fair
              </span>
            </h1>
            <p className="text-xl lg:text-2xl text-white/90 max-w-2xl mx-auto leading-relaxed">
              A simple platform that connects citizens, police, lawyers, and courts to make justice accessible to everyone.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button size="lg" className="btn-hero text-lg px-8 py-4 shadow-glow" asChild>
                <Link to="/register">
                  Start Your Case
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="btn-outline-white text-lg px-8 py-4 backdrop-blur-sm" asChild>
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
              How It Works
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              From filing a complaint to getting a decision, our system makes justice simple and fair for everyone.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="card-friendly group cursor-pointer">
                <CardHeader>
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br from-current/20 to-current/30 flex items-center justify-center mb-4 ${feature.color} group-hover:scale-110 transition-transform shadow-soft`}>
                    <feature.icon className="h-7 w-7" />
                  </div>
                  <CardTitle className="text-xl font-bold">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
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
                Why Choose Our System?
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Our platform makes the legal process faster, clearer, and easier for everyone involved.
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
              <Card className="card-friendly p-6 text-center bounce-hover">
                <div className="text-3xl font-bold gradient-text-warm mb-2">10K+</div>
                <div className="text-muted-foreground font-medium">Cases Resolved</div>
              </Card>
              <Card className="card-friendly p-6 text-center bounce-hover">
                <div className="text-3xl font-bold gradient-text-cool mb-2">24/7</div>
                <div className="text-muted-foreground font-medium">System Availability</div>
              </Card>
              <Card className="card-friendly p-6 text-center bounce-hover">
                <div className="text-3xl font-bold text-warning mb-2">500+</div>
                <div className="text-muted-foreground font-medium">Legal Professionals</div>
              </Card>
              <Card className="card-friendly p-6 text-center bounce-hover">
                <div className="text-3xl font-bold text-success mb-2">99.9%</div>
                <div className="text-muted-foreground font-medium">Data Security</div>
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
              For Everyone
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Different tools and features for citizens, police, judges, and lawyers.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8 max-w-7xl mx-auto">
            <Card className="relative overflow-hidden bg-white border-0 shadow-soft hover:shadow-card transition-all duration-500 group hover:scale-105 transform">
              <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-orange-400 to-yellow-500 rounded-t-2xl"></div>
              <CardHeader className="text-center pb-4 pt-8 bg-gradient-to-br from-orange-50 to-yellow-50">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-orange-400 to-yellow-500 rounded-2xl flex items-center justify-center shadow-soft">
                  <Users className="h-8 w-8 text-white" />
                </div>
                <Badge className="w-fit mx-auto mb-4 bg-orange-100 text-orange-800 font-semibold px-4 py-2 rounded-full border border-orange-200">Citizens</Badge>
                <CardTitle className="text-xl font-bold text-slate-800">For Citizens</CardTitle>
                <CardDescription className="text-sm leading-relaxed mt-3 text-slate-600">
                  File complaints, track your case, find lawyers, and get updates.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 pb-6 px-6">
                <Button className="w-full btn-warm font-semibold py-3" asChild>
                  <Link to="/register?role=citizen">Register as Citizen</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden bg-white border-0 shadow-soft hover:shadow-card transition-all duration-500 group hover:scale-105 transform">
              <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-t-2xl"></div>
              <CardHeader className="text-center pb-4 pt-8 bg-gradient-to-br from-blue-50 to-indigo-50">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-soft">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <Badge className="w-fit mx-auto mb-4 bg-blue-100 text-blue-800 font-semibold px-4 py-2 rounded-full border border-blue-200">Law Enforcement</Badge>
                <CardTitle className="text-xl font-bold text-slate-800">For Police</CardTitle>
                <CardDescription className="text-sm leading-relaxed mt-3 text-slate-600">
                  Handle investigations, file reports, submit evidence, and work with courts.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 pb-6 px-6">
                <Button className="w-full btn-cool font-semibold py-3" asChild>
                  <Link to="/register?role=police">Register as Officer</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden bg-white border-0 shadow-soft hover:shadow-card transition-all duration-500 group hover:scale-105 transform">
              <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-teal-500 to-cyan-600 rounded-t-2xl"></div>
              <CardHeader className="text-center pb-4 pt-8 bg-gradient-to-br from-teal-50 to-cyan-50">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-soft">
                  <Gavel className="h-8 w-8 text-white" />
                </div>
                <Badge className="w-fit mx-auto mb-4 bg-teal-100 text-teal-800 font-semibold px-4 py-2 rounded-full border border-teal-200">Judiciary</Badge>
                <CardTitle className="text-xl font-bold text-slate-800">For Judges</CardTitle>
                <CardDescription className="text-sm leading-relaxed mt-3 text-slate-600">
                  Review cases, schedule hearings, and make decisions.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 pb-6 px-6">
                <Button className="w-full bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-semibold py-3 rounded-xl transition-all duration-300 shadow-soft hover:shadow-glow" asChild>
                  <Link to="/register?role=judge">Register as Judge</Link>
                </Button>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden bg-white border-0 shadow-soft hover:shadow-card transition-all duration-500 group hover:scale-105 transform">
              <div className="absolute top-0 left-0 w-full h-3 bg-gradient-to-r from-emerald-500 to-green-600 rounded-t-2xl"></div>
              <CardHeader className="text-center pb-4 pt-8 bg-gradient-to-br from-emerald-50 to-green-50">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-emerald-500 to-green-600 rounded-2xl flex items-center justify-center shadow-soft">
                  <Scale className="h-8 w-8 text-white" />
                </div>
                <Badge className="w-fit mx-auto mb-4 bg-emerald-100 text-emerald-800 font-semibold px-4 py-2 rounded-full border border-emerald-200">Legal Profession</Badge>
                <CardTitle className="text-xl font-bold text-slate-800">For Lawyers</CardTitle>
                <CardDescription className="text-sm leading-relaxed mt-3 text-slate-600">
                  Help clients, submit documents, access case files, and talk with everyone involved.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-4 pb-6 px-6">
                <Button className="w-full bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold py-3 rounded-xl transition-all duration-300 shadow-soft hover:shadow-glow" asChild>
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
            Ready to Get Started?
          </h2>
          <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
            Join citizens, legal professionals, and law enforcement officers using our platform for fair and efficient justice.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="btn-hero text-lg px-8 py-4 shadow-glow" asChild>
              <Link to="/register">
                Get Started Today
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="btn-outline-white text-lg px-8 py-4 backdrop-blur-sm" asChild>
              <Link to="/login">
                Login
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};