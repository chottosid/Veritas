import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, User, LogOut, Settings, Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/authStore';
import logo from '@/assets/logo.png';

export const Header = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'CITIZEN': return 'bg-primary/10 text-primary';
      case 'POLICE': return 'bg-secondary/10 text-secondary';
      case 'OC': return 'bg-tertiary/10 text-tertiary';
      case 'JUDGE': return 'bg-warning/10 text-warning';
      case 'LAWYER': return 'bg-success/10 text-success';
      default: return 'bg-muted/10 text-muted-foreground';
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/60">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link to="/" className="flex items-center space-x-2">
          <img src={logo} alt="Justice Nexus Chain" className="h-8" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          {user ? (
            <>
              <Link to="/dashboard" className="text-foreground hover:text-primary transition-colors">
                Dashboard
              </Link>
              {(user.role === 'CITIZEN' || user.role === 'POLICE' || user.role === 'OC') && (
                <Link to="/complaints" className="text-foreground hover:text-primary transition-colors">
                  Complaints
                </Link>
              )}
              {(user.role === 'CITIZEN' || user.role === 'JUDGE' || user.role === 'LAWYER') && (
                <Link to="/cases" className="text-foreground hover:text-primary transition-colors">
                  Cases
                </Link>
              )}
              {user.role === 'JUDGE' && (
                <Link to="/firs" className="text-foreground hover:text-primary transition-colors">
                  FIRs
                </Link>
              )}
            </>
          ) : (
            <>
              <Link to="/about" className="text-foreground hover:text-primary transition-colors">
                About
              </Link>
              <Link to="/contact" className="text-foreground hover:text-primary transition-colors">
                Contact
              </Link>
            </>
          )}
        </nav>

        {/* User Actions */}
        <div className="flex items-center space-x-4">
          {user ? (
            <>
              {/* Notifications */}
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-4 w-4" />
                <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs">
                  3
                </Badge>
              </Button>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {getUserInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-80" align="end">
                  <div className="flex items-center justify-start gap-2 p-4">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                      <Badge className={`w-fit text-xs ${getRoleColor(user.role)}`}>
                        {user.role === 'OC' ? 'Officer in Charge' : user.role}
                      </Badge>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/settings')}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild>
                <Link to="/login">Login</Link>
              </Button>
              <Button className="btn-hero" asChild>
                <Link to="/register">Get Started</Link>
              </Button>
            </>
          )}

          {/* Mobile Menu Toggle */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t bg-card">
          <nav className="container py-4 space-y-2">
            {user ? (
              <>
                <Link 
                  to="/dashboard" 
                  className="block px-4 py-2 text-foreground hover:bg-muted rounded-md transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                {(user.role === 'CITIZEN' || user.role === 'POLICE' || user.role === 'OC') && (
                  <Link 
                    to="/complaints" 
                    className="block px-4 py-2 text-foreground hover:bg-muted rounded-md transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Complaints
                  </Link>
                )}
                {(user.role === 'CITIZEN' || user.role === 'JUDGE' || user.role === 'LAWYER') && (
                  <Link 
                    to="/cases" 
                    className="block px-4 py-2 text-foreground hover:bg-muted rounded-md transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Cases
                  </Link>
                )}
                {user.role === 'JUDGE' && (
                  <Link 
                    to="/firs" 
                    className="block px-4 py-2 text-foreground hover:bg-muted rounded-md transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    FIRs
                  </Link>
                )}
              </>
            ) : (
              <>
                <Link 
                  to="/about" 
                  className="block px-4 py-2 text-foreground hover:bg-muted rounded-md transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  About
                </Link>
                <Link 
                  to="/contact" 
                  className="block px-4 py-2 text-foreground hover:bg-muted rounded-md transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Contact
                </Link>
                <div className="flex gap-2 px-4 pt-2">
                  <Button variant="ghost" asChild className="flex-1">
                    <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>Login</Link>
                  </Button>
                  <Button className="btn-hero flex-1" asChild>
                    <Link to="/register" onClick={() => setIsMobileMenuOpen(false)}>Get Started</Link>
                  </Button>
                </div>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
};