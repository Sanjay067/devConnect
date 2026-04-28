import React from 'react';
import Navbar from '@/shared/components/Navbar';

function DashboardLayout({ children }) {
    return (
        <div>
            <Navbar />
            {children}
        </div>
    )
}

export default DashboardLayout;