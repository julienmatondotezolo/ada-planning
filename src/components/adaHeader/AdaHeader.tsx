import Link from "next/link";
import React, { useEffect, useState } from "react";
import { Menu, Calendar, Users, Settings, LogOut } from "lucide-react";

import { HamburgerMenu } from "./HamburgerMenu";

const AdaHeader = () => {
  const [time, setTime] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(new Date().toLocaleTimeString('fr-FR'));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!mounted) return null;

  return (
    <div className="flex items-center justify-between p-4 bg-primary text-white shadow-lg">
      <div className="flex items-center space-x-4">
        <HamburgerMenu />
        <Link href="/">
          <div className="flex items-center space-x-2">
            <Calendar className="w-6 h-6" />
            <span className="font-bold text-lg cursor-pointer hover:opacity-80 transition-opacity">
              ADA - Planning
            </span>
          </div>
        </Link>
      </div>

      <div className="flex items-center space-x-6">
        <div className="text-sm font-medium">
          {time}
        </div>
        <div className="text-sm opacity-80">
          L'Osteria Deerlijk
        </div>
      </div>
    </div>
  );
};

export { AdaHeader };