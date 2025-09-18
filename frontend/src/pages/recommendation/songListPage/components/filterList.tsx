import React from 'react';

const FilterList: React.FC = () => {

  return (
    <div className="mb-8 ">
        <div className="filter bg-card border border-border rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 flex items-center justify-center">
                        <svg className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
                        </svg>
                    </div>
                    <h2 className="text-lg font-semibold text-foreground">필터 및 정렬</h2>
                </div>
                
                <div className="flex items-center space-x-3">
                    <button className="flex items-center space-x-2 px-3 py-2 bg-card border border-border rounded-lg text-foreground hover:bg-muted/50 transition-colors">
                        <span className="text-sm">추천순</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    
                    <button className="flex items-center space-x-2 px-3 py-2 bg-card border border-border rounded-lg text-foreground hover:bg-muted/50 transition-colors">
                        <span className="text-sm">모든 장르</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                    
                    <button className="flex items-center space-x-2 px-3 py-2 bg-card border border-border rounded-lg text-foreground hover:bg-muted/50 transition-colors">
                        <span className="text-sm">모든 난이도</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
            
        <div className="filter-content">
            <div className="grid grid-cols-3 gap-4 mt-4">
                {/* 앨범 표지 1 */}
                <div className="relative bg-card border border-border rounded-lg overflow-hidden group cursor-pointer hover:shadow-lg transition-all duration-300">
                    <div className="aspect-square bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <span className="text-white text-4xl">♪</span>
                    </div>
                    <div className="absolute top-2 left-2">
                        <span className="bg-yellow-400 text-black text-xs px-2 py-1 rounded font-semibold">중급</span>
                    </div>
                    <div className="absolute top-2 right-2">
                        <button className="w-6 h-6 bg-gray-800/50 rounded-full flex items-center justify-center hover:bg-red-500 transition-colors">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                    <div className="p-3">
                        <h3 className="text-sm font-semibold text-card-foreground truncate">Shape of You</h3>
                        <p className="text-xs text-muted-foreground truncate">Ed Sheeran</p>
                    </div>
                </div>

                {/* 앨범 표지 2 */}
                <div className="relative bg-card border border-border rounded-lg overflow-hidden group cursor-pointer hover:shadow-lg transition-all duration-300">
                    <div className="aspect-square bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                        <span className="text-white text-4xl">♪</span>
                    </div>
                    <div className="absolute top-2 left-2">
                        <span className="bg-yellow-400 text-black text-xs px-2 py-1 rounded font-semibold">중급</span>
                    </div>
                    <div className="absolute top-2 right-2">
                        <button className="w-6 h-6 bg-gray-800/50 rounded-full flex items-center justify-center hover:bg-red-500 transition-colors">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                    <div className="p-3">
                        <h3 className="text-sm font-semibold text-card-foreground truncate">Blinding Lights</h3>
                        <p className="text-xs text-muted-foreground truncate">The Weeknd</p>
                    </div>
                </div>

                {/* 앨범 표지 3 */}
                <div className="relative bg-card border border-border rounded-lg overflow-hidden group cursor-pointer hover:shadow-lg transition-all duration-300">
                    <div className="aspect-square bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center">
                        <span className="text-white text-4xl">♪</span>
                    </div>
                    <div className="absolute top-2 left-2">
                        <span className="bg-yellow-400 text-black text-xs px-2 py-1 rounded font-semibold">중급</span>
                    </div>
                    <div className="absolute top-2 right-2">
                        <button className="w-6 h-6 bg-gray-800/50 rounded-full flex items-center justify-center hover:bg-red-500 transition-colors">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                    <div className="p-3">
                        <h3 className="text-sm font-semibold text-card-foreground truncate">Levitating</h3>
                        <p className="text-xs text-muted-foreground truncate">Dua Lipa</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};

export default FilterList;
