import { QrCode } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-sidebar text-sidebar-foreground py-12">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
              <QrCode className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">Digital Attendance</span>
          </div>

          {/* Info */}
          <div className="text-center md:text-right">
            <p className="text-sidebar-foreground/70">College Use Only</p>
            <p className="text-sm text-sidebar-foreground/50 mt-1">
              © 2026 Digital Attendance. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
