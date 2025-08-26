import { Link } from 'react-router-dom';
import { Scale, Shield, Users, Gavel } from 'lucide-react';
import logoIcon from '@/assets/logo-icon.png';

export const Footer = () => {
  return (
    <footer className="bg-tertiary text-tertiary-foreground">
      <div className="container py-12 px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <img src={logoIcon} alt="Justice Nexus Chain" className="h-8 w-8" />
              <span className="font-bold text-lg">Justice Nexus Chain</span>
            </div>
            <p className="text-tertiary-foreground/80 text-sm">
              Revolutionizing justice through transparent, efficient, and accessible legal processes.
            </p>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-semibold mb-4">Services</h3>
            <ul className="space-y-2 text-sm text-tertiary-foreground/80">
              <li>
                <Link to="/complaints" className="hover:text-primary transition-colors flex items-center gap-2">
                  <Shield className="h-3 w-3" />
                  File Complaints
                </Link>
              </li>
              <li>
                <Link to="/cases" className="hover:text-primary transition-colors flex items-center gap-2">
                  <Gavel className="h-3 w-3" />
                  Track Cases
                </Link>
              </li>
              <li>
                <Link to="/lawyers" className="hover:text-primary transition-colors flex items-center gap-2">
                  <Users className="h-3 w-3" />
                  Find Lawyers
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-primary transition-colors flex items-center gap-2">
                  <Scale className="h-3 w-3" />
                  About Justice
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-2 text-sm text-tertiary-foreground/80">
              <li>
                <Link to="/privacy" className="hover:text-primary transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-primary transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/compliance" className="hover:text-primary transition-colors">
                  Compliance
                </Link>
              </li>
              <li>
                <Link to="/security" className="hover:text-primary transition-colors">
                  Security
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold mb-4">Contact</h3>
            <ul className="space-y-2 text-sm text-tertiary-foreground/80">
              <li>Emergency: 999</li>
              <li>Support: 1247</li>
              <li>Email: support@justicenexus.gov</li>
              <li>
                <Link to="/contact" className="hover:text-primary transition-colors">
                  Contact Form
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-tertiary-foreground/20 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-tertiary-foreground/60">
          <p>&copy; 2025 Justice Nexus Chain. All rights reserved.</p>
          <p>Powered by blockchain technology for transparent justice.</p>
        </div>
      </div>
    </footer>
  );
};