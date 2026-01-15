import React from "react";
import AppSidebar from "./AppSidebar";
import AppHeader from "./AppHeader";

const LayoutContent = ({ children }) => {
    return (
        <div className="min-h-screen transition-colors bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-outfit">
            <AppSidebar />
            <div className="flex flex-col min-h-screen pl-0 lg:pl-[290px] transition-all duration-300 ease-in-out">
                <AppHeader />
                <main className="flex-1 p-4 mx-auto max-w-screen-2xl md:p-6 lg:p-8 w-full">
                    {children}
                </main>
            </div>
        </div>
    );
};

const AppLayout = ({ children }) => {
    return (
        <LayoutContent>{children}</LayoutContent>
    );
};

export default AppLayout;
