import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useAuthStore } from "@/store/authStore";
import { useWebSocket } from "@/hooks/useWebSocket";
import { 
  Bell, 
  BellRing,
  Menu,
  User,
  LogOut,
  Settings,
  Shield,
  Scale,
  Building2,
  UserCheck,
  Hash
} from "lucide-react";

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
  
  // Use WebSocket hook for real-time notifications
  const { 
    isConnected, 
    notifications: wsNotifications, 
    unreadCount: wsUnreadCount,
    markAsRead,
    markAllAsRead 
  } = useWebSocket();

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

  // Handle navigation and close dropdown
  const handleNotificationNavigation = () => {
    setIsNotificationDropdownOpen(false);
    navigate('/notifications');
  };

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
      case 'JUDGE': return 'bg-warning/10 text-warning';
      case 'LAWYER': return 'bg-success/10 text-success';
      default: return 'bg-muted/10 text-muted-foreground';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'CITIZEN': return <UserCheck className="h-4 w-4" />;
      case 'POLICE': return <Shield className="h-4 w-4" />;
      case 'JUDGE': return <Scale className="h-4 w-4" />;
      case 'LAWYER': return <Building2 className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  // Get recent notifications from WebSocket or use empty array
  const recentNotifications = wsNotifications.slice(0, 3);
  const totalUnread = wsUnreadCount;

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
                to={user.role === 'POLICE' ? "/police/dashboard" : user.role === 'JUDGE' ? "/judge/dashboard" : user.role === 'LAWYER' ? "/lawyer/dashboard" : "/dashboard"} 
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
                <Link 
                  to={user.isOC ? "/police/oc/complaints" : "/police/complaints"} 
                  className="text-foreground hover:text-primary transition-colors"
                >
                  Complaints
                </Link>
              )}
              {user.role === 'CITIZEN' && (
                <Link to="/cases" className="text-foreground hover:text-primary transition-colors">
                  Cases
                </Link>
              )}
              {user.role === 'CITIZEN' && (
                <Link to="/find-lawyer" className="text-foreground hover:text-primary transition-colors">
                  Find Lawyers
                </Link>
              )}
              {user.role === 'CITIZEN' && (
                <Link to="/lawyer-requests" className="text-foreground hover:text-primary transition-colors">
                  Lawyer Requests
                </Link>
              )}
              {user.role === 'POLICE' && (
                <Link to="/police/cases" className="text-foreground hover:text-primary transition-colors">
                  Cases
                </Link>
              )}
              {user.role === 'JUDGE' && (
                <Link to="/judge/firs" className="text-foreground hover:text-primary transition-colors">
                  FIRs
                </Link>
              )}
              {user.role === 'JUDGE' && (
                <Link to="/judge/cases" className="text-foreground hover:text-primary transition-colors">
                  Cases
                </Link>
              )}
              {user.role === 'LAWYER' && (
                <Link to="/lawyer/requests" className="text-foreground hover:text-primary transition-colors">
                  Requests
                </Link>
              )}
              {user.role === 'LAWYER' && (
                <Link to="/lawyer/cases" className="text-foreground hover:text-primary transition-colors">
                  Cases
                </Link>
              )}
              {/* Blockchain Transparency - Available to all users */}
              <Link to="/blockchain" className="text-foreground hover:text-primary transition-colors flex items-center gap-1">
                <Hash className="h-4 w-4" />
                Blockchain
              </Link>
            </>
          ) : (
            <>
              <Link to="/login" className="text-foreground hover:text-primary transition-colors">
                Login
              </Link>
              <Link to="/register" className="text-foreground hover:text-primary transition-colors">
                Register
              </Link>
              {/* Blockchain Transparency - Available to non-authenticated users */}
              <Link to="/blockchain" className="text-foreground hover:text-primary transition-colors flex items-center gap-1">
                <Hash className="h-4 w-4" />
                Blockchain
              </Link>
            </>
          )}
        </nav>

        {/* Right side - Notifications and User Menu */}
        <div className="flex items-center space-x-4">
          {user && (
            <>
              {/* WebSocket Connection Status */}
              <div className="hidden md:flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-xs text-muted-foreground">
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>

              {/* Notifications */}
              <DropdownMenu open={isNotificationDropdownOpen} onOpenChange={setIsNotificationDropdownOpen}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="relative">
                    {totalUnread > 0 ? (
                      <BellRing className="h-5 w-5 text-orange-500" />
                    ) : (
                      <Bell className="h-5 w-5" />
                    )}
                    {totalUnread > 0 && (
                      <Badge 
                        variant="destructive" 
                        className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
                      >
                        {totalUnread > 99 ? '99+' : totalUnread}
                      </Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <div className="flex items-center justify-between p-4 border-b">
                    <h3 className="font-semibold">Notifications</h3>
                    <div className="flex items-center space-x-2">
                      {totalUnread > 0 && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={markAllAsRead}
                          className="text-xs"
                        >
                          Mark all read
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={handleNotificationNavigation}
                        className="text-xs"
                      >
                        View all
                      </Button>
                    </div>
                  </div>
                  
                  <div className="max-h-96 overflow-y-auto">
                    {recentNotifications.length > 0 ? (
                      recentNotifications.map((notification) => (
                        <div 
                          key={notification._id} 
                          className={`p-3 border-b last:border-b-0 hover:bg-muted/50 cursor-pointer ${
                            !notification.isRead ? 'bg-blue-50' : ''
                          }`}
                          onClick={() => {
                            if (!notification.isRead) {
                              markAsRead(notification._id);
                            }
                            setIsNotificationDropdownOpen(false);
                          }}
                        >
                          <div className="flex items-start space-x-3">
                            <div className={`w-2 h-2 rounded-full mt-2 ${
                              notification.priority === 'urgent' ? 'bg-red-500' :
                              notification.priority === 'high' ? 'bg-orange-500' :
                              notification.priority === 'normal' ? 'bg-blue-500' : 'bg-gray-500'
                            }`} />
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-medium ${!notification.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>
                                {notification.title}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {notification.message}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(notification.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-4 text-center text-muted-foreground">
                        <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>No notifications</p>
                      </div>
                    )}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* User Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getUserInitials(user.name)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex items-center justify-start gap-2 p-2">
                    <div className="flex flex-col space-y-1 leading-none">
                      <p className="font-medium">{user.name}</p>
                      <div className="flex items-center space-x-1">
                        {getRoleIcon(user.role)}
                        <Badge variant="secondary" className={getRoleColor(user.role)}>
                          {user.role}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    Profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/notifications')}>
                    <Bell className="mr-2 h-4 w-4" />
                    Notifications
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/blockchain')}>
                    <Hash className="mr-2 h-4 w-4" />
                    Blockchain Transparency
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="sm"
            className="md:hidden"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t bg-card">
          <div className="container px-4 py-4 space-y-2">
            {user ? (
              <>
                <Link 
                  to={user.role === 'POLICE' ? "/police/dashboard" : user.role === 'JUDGE' ? "/judge/dashboard" : user.role === 'LAWYER' ? "/lawyer/dashboard" : "/dashboard"} 
                  className="block py-2 text-foreground hover:text-primary transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                {user.role === 'CITIZEN' && (
                  <>
                    <Link to="/complaints" className="block py-2 text-foreground hover:text-primary transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                      Complaints
                    </Link>
                    <Link to="/cases" className="block py-2 text-foreground hover:text-primary transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                      Cases
                    </Link>
                    <Link to="/find-lawyer" className="block py-2 text-foreground hover:text-primary transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                      Find Lawyers
                    </Link>
                    <Link to="/lawyer-requests" className="block py-2 text-foreground hover:text-primary transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                      Lawyer Requests
                    </Link>
                  </>
                )}
                {user.role === 'POLICE' && (
                  <>
                    <Link 
                      to={user.isOC ? "/police/oc/complaints" : "/police/complaints"} 
                      className="block py-2 text-foreground hover:text-primary transition-colors" 
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      Complaints
                    </Link>
                    <Link to="/police/cases" className="block py-2 text-foreground hover:text-primary transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                      Cases
                    </Link>
                  </>
                )}
                {user.role === 'JUDGE' && (
                  <>
                    <Link to="/judge/firs" className="block py-2 text-foreground hover:text-primary transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                      FIRs
                    </Link>
                    <Link to="/judge/cases" className="block py-2 text-foreground hover:text-primary transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                      Cases
                    </Link>
                  </>
                )}
                {user.role === 'LAWYER' && (
                  <>
                    <Link to="/lawyer/requests" className="block py-2 text-foreground hover:text-primary transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                      Requests
                    </Link>
                    <Link to="/lawyer/cases" className="block py-2 text-foreground hover:text-primary transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                      Cases
                    </Link>
                  </>
                )}
                <div className="pt-2 border-t">
                  <Link to="/profile" className="block py-2 text-foreground hover:text-primary transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                    Profile
                  </Link>
                  <Link to="/notifications" className="block py-2 text-foreground hover:text-primary transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                    Notifications
                  </Link>
                  <Link to="/blockchain" className="block py-2 text-foreground hover:text-primary transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                    Blockchain Transparency
                  </Link>
                  <button 
                    onClick={handleLogout}
                    className="block w-full text-left py-2 text-foreground hover:text-primary transition-colors"
                  >
                    Log out
                  </button>
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="block py-2 text-foreground hover:text-primary transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                  Login
                </Link>
                <Link to="/register" className="block py-2 text-foreground hover:text-primary transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                  Register
                </Link>
                <Link to="/blockchain" className="block py-2 text-foreground hover:text-primary transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
                  Blockchain Transparency
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};