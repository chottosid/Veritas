import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, User, LogOut, Settings, Menu, X, BellRing } from 'lucide-react';
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
import { api } from '@/lib/api';

interface NotificationSummary {
  totalUnread: number;
  recent: Array<{
    _id: string;
    title: string;
    message: string;
    type: string;
    isRead: boolean;
    createdAt: string;
  }>;
}

export const Header = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNotificationDropdownOpen, setIsNotificationDropdownOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationSummary>({
    totalUnread: 0,
    recent: []
  });
  const [pollingInterval, setPollingInterval] = useState<NodeJS.Timeout | null>(null);

  // Get notification endpoint based on user role
  const getNotificationEndpoint = () => {
    switch (user?.role) {
      case 'POLICE':
        return '/police/notifications';
      case 'JUDGE':
        return '/judges/notifications';
      case 'LAWYER':
        return '/lawyers/notifications';
      case 'CITIZEN':
      default:
        return '/citizens/notifications';
    }
  };

  // Fetch notification summary
  const fetchNotificationSummary = useCallback(async () => {
    if (!user) return;
    
    try {
      const endpoint = getNotificationEndpoint();
      const response = await api.get(`${endpoint}?limit=5&unreadOnly=false`);
      if (response.data.success) {
        const unreadCount = response.data.data.filter((n: any) => !n.isRead).length;
        setNotifications({
          totalUnread: unreadCount,
          recent: response.data.data.slice(0, 3)
        });
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  }, [user]);

  // Start notification polling
  useEffect(() => {
    if (user) {
      fetchNotificationSummary();
      
      // Poll every 30 seconds
      const interval = setInterval(fetchNotificationSummary, 30000);
      setPollingInterval(interval);
      
      return () => {
        if (interval) clearInterval(interval);
      };
    }
  }, [user, fetchNotificationSummary]);

  // Handle navigation and close dropdown
  const handleNotificationNavigation = () => {
    setIsNotificationDropdownOpen(false);
    navigate('/notifications');
  };

  const handleLogout = () => {
    if (pollingInterval) clearInterval(pollingInterval);
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
          <img src="/stop.png" alt="OneStop Justice" className="h-8" />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          {user ? (
            <>
              <Link 
                to={user.role === 'POLICE' ? "/police/dashboard" : user.role === 'JUDGE' ? "/judge/dashboard" : "/dashboard"} 
                className="text-foreground hover:text-primary transition-colors"
              >
                Dashboard
              </Link>
              {user.role === 'CITIZEN' && (
                <Link to="/complaints" className="text-foreground hover:text-primary transition-colors">
                  Complaints
                </Link>
              )}
              {user.role === 'POLICE' && (
                <Link to="/police/complaints" className="text-foreground hover:text-primary transition-colors">
                  Complaints
                </Link>
              )}
              {user.role === 'CITIZEN' && (
                <Link to="/cases" className="text-foreground hover:text-primary transition-colors">
                  Cases
                </Link>
              )}
              {user.role === 'POLICE' && (
                <Link to="/police/cases" className="text-foreground hover:text-primary transition-colors">
                  Cases
                </Link>
              )}
              {user.role === 'JUDGE' && (
                <Link to="/judge/cases" className="text-foreground hover:text-primary transition-colors">
                  Cases
                </Link>
              )}
              {user.role === 'POLICE' && (
                <Link to="/police/judges" className="text-foreground hover:text-primary transition-colors">
                  Judges
                </Link>
              )}
              {user.role === 'JUDGE' && (
                <Link to="/judge/firs" className="text-foreground hover:text-primary transition-colors">
                  FIRs
                </Link>
              )}
              {user.role === 'POLICE' && user.isOC && (
                <Link to="/police/oc/complaints" className="text-foreground hover:text-primary transition-colors">
                  OC Complaints
                </Link>
              )}
              {user.role === 'POLICE' && user.isOC && (
                <Link to="/police/oc/officers" className="text-foreground hover:text-primary transition-colors">
                  Station Officers
                </Link>
              )}
              {user.role === 'LAWYER' && (
                <Link to="/cases" className="text-foreground hover:text-primary transition-colors">
                  Cases
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
              <DropdownMenu open={isNotificationDropdownOpen} onOpenChange={setIsNotificationDropdownOpen}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="relative">
                    {notifications.totalUnread > 0 ? (
                      <BellRing className="h-4 w-4 text-primary" />
                    ) : (
                      <Bell className="h-4 w-4" />
                    )}
                    {notifications.totalUnread > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-primary">
                        {notifications.totalUnread > 9 ? '9+' : notifications.totalUnread}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-80" align="end">
                  <div className="flex items-center justify-between p-4 border-b">
                    <h4 className="font-semibold">Notifications</h4>
                    <Button variant="ghost" size="sm" onClick={handleNotificationNavigation}>
                      View All
                    </Button>
                  </div>
                  
                  {notifications.recent.length > 0 ? (
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.recent.map((notification) => (
                        <DropdownMenuItem
                          key={notification._id}
                          className="p-4 flex-col items-start cursor-pointer"
                          onClick={handleNotificationNavigation}
                        >
                          <div className="flex items-start justify-between w-full">
                            <div className="flex-1 space-y-1">
                              <p className={`text-sm font-medium ${!notification.isRead ? 'text-primary' : ''}`}>
                                {notification.title}
                              </p>
                              <p className="text-xs text-muted-foreground line-clamp-2">
                                {notification.message}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(notification.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-1 ml-2" />
                            )}
                          </div>
                        </DropdownMenuItem>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 text-center text-muted-foreground">
                      <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No notifications</p>
                    </div>
                  )}
                  
                  {notifications.recent.length > 0 && (
                    <div className="p-2 border-t">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full"
                        onClick={handleNotificationNavigation}
                      >
                        View All Notifications
                      </Button>
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

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
                        {user.role === 'POLICE' && user.isOC ? 'Officer in Charge' : user.role}
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
                  to={user.role === 'POLICE' ? "/police/dashboard" : user.role === 'JUDGE' ? "/judge/dashboard" : "/dashboard"}
                  className="block px-4 py-2 text-foreground hover:bg-muted rounded-md transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                {user.role === 'CITIZEN' && (
                  <Link 
                    to="/complaints" 
                    className="block px-4 py-2 text-foreground hover:bg-muted rounded-md transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Complaints
                  </Link>
                )}
                {user.role === 'POLICE' && (
                  <Link 
                    to="/police/complaints" 
                    className="block px-4 py-2 text-foreground hover:bg-muted rounded-md transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Complaints
                  </Link>
                )}
                {user.role === 'CITIZEN' && (
                  <Link 
                    to="/cases" 
                    className="block px-4 py-2 text-foreground hover:bg-muted rounded-md transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Cases
                  </Link>
                )}
                {user.role === 'POLICE' && (
                  <Link 
                    to="/police/cases" 
                    className="block px-4 py-2 text-foreground hover:bg-muted rounded-md transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Cases
                  </Link>
                )}
                {user.role === 'JUDGE' && (
                  <Link 
                    to="/judge/cases" 
                    className="block px-4 py-2 text-foreground hover:bg-muted rounded-md transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Cases
                  </Link>
                )}
                {user.role === 'POLICE' && (
                  <Link 
                    to="/police/judges" 
                    className="block px-4 py-2 text-foreground hover:bg-muted rounded-md transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Judges
                  </Link>
                )}
                {user.role === 'JUDGE' && (
                  <Link 
                    to="/judge/firs" 
                    className="block px-4 py-2 text-foreground hover:bg-muted rounded-md transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    FIRs
                  </Link>
                )}
                {user.role === 'POLICE' && user.isOC && (
                  <Link 
                    to="/police/oc/complaints" 
                    className="block px-4 py-2 text-foreground hover:bg-muted rounded-md transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    OC Complaints
                  </Link>
                )}
                {user.role === 'POLICE' && user.isOC && (
                  <Link 
                    to="/police/oc/officers" 
                    className="block px-4 py-2 text-foreground hover:bg-muted rounded-md transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Station Officers
                  </Link>
                )}
                {user.role === 'LAWYER' && (
                  <Link 
                    to="/cases" 
                    className="block px-4 py-2 text-foreground hover:bg-muted rounded-md transition-colors"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Cases
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