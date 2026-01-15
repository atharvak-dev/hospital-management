
import os

file_path = r'd:\Hospital Management\client\src\pages\PatientDetails.jsx'
new_content = r'''            {/* Link Family Modal */}
            {showLinkModal && (
                <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all">
                    <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 transform transition-all border border-gray-100">
                        <h3 className="text-xl font-bold mb-6 text-gray-900">Link Family Member</h3>
                        <div className="mb-5">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Search Database</label>
                            <div className="relative">
                                <input 
                                    type="text" 
                                    placeholder="Search by name or phone..." 
                                    className="w-full border border-gray-300 rounded-lg p-2.5 pl-10 bg-white text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    value={searchQuery} 
                                    onChange={(e) => handleSearch(e.target.value)} 
                                />
                                <LinkIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                            </div>
                            {searchResults.length > 0 && (
                                <div className="mt-2 max-h-48 overflow-y-auto border border-gray-200 rounded-lg bg-white shadow-lg z-10 custom-scrollbar">
                                    {searchResults.map(p => (
                                        <div 
                                            key={p.patient_id} 
                                            className={`p-3 cursor-pointer hover:bg-gray-50 text-sm border-b last:border-0 border-gray-100 transition-colors
                                                ${selectedMember?.patient_id === p.patient_id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'}`}
                                            onClick={() => { setSelectedMember(p); setSearchResults([]); setSearchQuery(`${p.first_name} ${p.last_name}`); }}
                                        >
                                            {p.first_name} {p.last_name} <span className="text-gray-400 ml-1">({p.phone})</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        
                        {selectedMember && (
                            <div className="mb-5 bg-blue-50 border border-blue-100 p-3 rounded-lg flex items-center text-sm text-blue-800">
                                <Users className="w-4 h-4 mr-2" />
                                <span>Selected: <strong className="font-semibold">{selectedMember.first_name} {selectedMember.last_name}</strong></span>
                            </div>
                        )}

                        <div className="mb-8">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Relationship</label>
                            <select 
                                className="w-full border border-gray-300 rounded-lg p-2.5 bg-white text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                value={relationship} 
                                onChange={(e) => setRelationship(e.target.value)}
                            >
                                <option value="spouse">Spouse</option>
                                <option value="child">Child</option>
                                <option value="parent">Parent</option>
                                <option value="sibling">Sibling</option>
                            </select>
                        </div>
                        
                        <div className="flex justify-end space-x-3">
                            <button 
                                onClick={() => setShowLinkModal(false)} 
                                className="px-5 py-2.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={handleLink} 
                                disabled={!selectedMember} 
                                className={`px-5 py-2.5 rounded-lg text-white font-medium shadow-sm transition-all
                                    ${!selectedMember ? 'bg-blue-400 cursor-not-allowed opacity-70' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-md'}`}
                            >
                                Link Member
                            </button>
                        </div>
                    </div>
                </div>
            )}'''

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Replace lines 311 to 382 (indices 310 to 382)
# Note: lines list is 0-indexed. Line 311 is index 310.
# We want to replace from index 310 up to (not including) index 382?
# view_file showed lines 311 to 382 containing the modal content.
# EndLine 382 contained ")}" which is the end of the block.
# So we replace lines[310:382] with the new content (split into lines).

start_idx = 310
end_idx = 382

# Keep content before and after
final_lines = lines[:start_idx] + [new_content + '\n'] + lines[end_idx:]

with open(file_path, 'w', encoding='utf-8') as f:
    f.writelines(final_lines)

print("File updated successfully.")
