import React, { useMemo, useState, useEffect } from 'react';

interface Props {
  customers: any[];
}

export default function AdminDashboardCharts({ customers }: Props) {
  // Generate real-time traffic mock data
  const [trafficData, setTrafficData] = useState<any[]>([]);
  
  useEffect(() => {
    // Initialize with 20 data points
    const now = new Date();
    const initialData = Array.from({ length: 20 }, (_, i) => {
      const d = new Date(now.getTime() - (19 - i) * 5000);
      return {
        time: d.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' }),
        visitors: Math.floor(Math.random() * 40) + 10,
      };
    });
    setTrafficData(initialData);

    const interval = setInterval(() => {
      setTrafficData(prev => {
        const newData = [...prev.slice(1)];
        newData.push({
          time: new Date().toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' }),
          visitors: Math.floor(Math.random() * 40) + 10,
        });
        return newData;
      });
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Process customers for recent login activity
  const loginActivity = useMemo(() => {
    if (!customers || customers.length === 0) {
      // Return some fallback data if no customers loaded
      const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
      return days.map(day => ({
        date: day,
        logins: Math.floor(Math.random() * 80) + 20,
        signups: Math.floor(Math.random() * 20) + 5
      }));
    }

    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toLocaleDateString();
    });

    const loginCounts: Record<string, number> = {};
    const signupCounts: Record<string, number> = {};
    
    last7Days.forEach(date => {
      loginCounts[date] = 0;
      signupCounts[date] = 0;
    });

    customers.forEach(c => {
      const createdDate = c.createdAt?.seconds 
        ? new Date(c.createdAt.seconds * 1000).toLocaleDateString()
        : c.createdAt ? new Date(c.createdAt).toLocaleDateString() : null;
      
      const loginDate = c.lastLogin?.seconds
        ? new Date(c.lastLogin.seconds * 1000).toLocaleDateString()
        : c.lastLogin ? new Date(c.lastLogin).toLocaleDateString() : null;

      if (createdDate && signupCounts[createdDate] !== undefined) signupCounts[createdDate]++;
      if (loginDate && loginCounts[loginDate] !== undefined) loginCounts[loginDate]++;
    });

    return last7Days.map(date => ({
      date: date.substring(0, 5), // short date
      logins: loginCounts[date],
      signups: signupCounts[date]
    }));
  }, [customers]);

  const maxTraffic = Math.max(...trafficData.map(d => d.visitors), 50);
  const maxActivity = Math.max(...loginActivity.map(d => Math.max(d.logins, d.signups)), 100);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
      {/* Real-time Traffic Line Chart (Simulated with Bars) */}
      <div className="bg-white/5 border border-white/10 p-6 flex flex-col">
        <div className="mb-6">
          <h3 className="text-brand-metallic text-[10px] uppercase tracking-widest font-bold mb-1">Real-time Traffic</h3>
          <p className="text-sm text-white/60">Active visitors over the last few minutes</p>
        </div>
        <div className="h-[250px] w-full flex items-end justify-between gap-1 mt-auto overflow-hidden relative">
          {/* Grid lines */}
          <div className="absolute inset-x-0 bottom-[25%] border-b border-white/5" />
          <div className="absolute inset-x-0 bottom-[50%] border-b border-white/5" />
          <div className="absolute inset-x-0 bottom-[75%] border-b border-white/5" />
          
          {trafficData.map((data, i) => {
            const height = `${(data.visitors / maxTraffic) * 100}%`;
            return (
              <div key={i} className="flex-1 flex flex-col items-center justify-end relative group h-full z-10">
                <div 
                  className="w-full bg-brand-accent/80 hover:bg-brand-accent transition-all duration-500 rounded-t-sm" 
                  style={{ height: height || '2%' }}
                />
                
                {/* Tooltip */}
                <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black border border-white/20 text-white text-[10px] py-1 px-2 rounded whitespace-nowrap pointer-events-none z-20">
                  {data.time}<br />
                  <span className="text-brand-accent font-bold">{data.visitors} visitors</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Login Activity Bar Chart */}
      <div className="bg-white/5 border border-white/10 p-6 flex flex-col">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h3 className="text-brand-metallic text-[10px] uppercase tracking-widest font-bold mb-1">Weekly Activity Overview</h3>
            <p className="text-sm text-white/60">Logins vs New Signups</p>
          </div>
          <div className="flex items-center gap-4 text-[10px] uppercase tracking-widest">
            <div className="flex items-center gap-2"><div className="w-2 h-2 bg-white rounded-sm" /> Logins</div>
            <div className="flex items-center gap-2"><div className="w-2 h-2 bg-brand-accent rounded-sm" /> Signups</div>
          </div>
        </div>
        
        <div className="h-[250px] w-full flex items-end justify-between gap-4 mt-auto relative">
          {/* Grid lines */}
          <div className="absolute inset-x-0 bottom-[25%] border-b border-white/5" />
          <div className="absolute inset-x-0 bottom-[50%] border-b border-white/5" />
          <div className="absolute inset-x-0 bottom-[75%] border-b border-white/5" />

          {loginActivity.map((data, i) => {
            const loginHeight = `${(data.logins / maxActivity) * 100}%`;
            const signupHeight = `${(data.signups / maxActivity) * 100}%`;
            
            return (
              <div key={i} className="flex-1 flex flex-col items-center justify-end h-full relative group z-10">
                <div className="flex items-end justify-center gap-1 w-full h-full">
                  <div 
                    className="w-1/2 bg-white/80 hover:bg-white transition-all duration-500 rounded-t-sm" 
                    style={{ height: loginHeight || '2%' }}
                  />
                  <div 
                    className="w-1/2 bg-brand-accent/80 hover:bg-brand-accent transition-all duration-500 rounded-t-sm" 
                    style={{ height: signupHeight || '2%' }}
                  />
                </div>
                <div className="text-[10px] text-brand-metallic mt-2">{data.date}</div>

                {/* Tooltip */}
                <div className="absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity bg-black border border-white/20 text-white text-[10px] py-2 px-3 rounded whitespace-nowrap pointer-events-none z-20 shadow-xl">
                  <div className="font-bold border-b border-white/10 pb-1 mb-1">{data.date}</div>
                  <div className="flex justify-between gap-4">
                    <span className="text-white/70">Logins:</span>
                    <span className="font-bold">{data.logins}</span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-white/70">Signups:</span>
                    <span className="font-bold text-brand-accent">{data.signups}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
